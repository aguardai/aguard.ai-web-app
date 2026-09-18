-- =============================================================================
-- Aguard.ai — 12. Papel UNIDADE
--
-- A UNIDADE passa a ser um usuário da plataforma, filho da CLINICA:
--   faz tudo que a clínica faz dentro do seu próprio escopo, exceto
--   gerir clínicas, unidades e locações.
--
-- Escopo da UNIDADE: seus guichês, suas duas filas, seus pacientes, seu
-- histórico e seus relatórios. Enxerga os profissionais alocados nela, mas
-- não os cria, edita nem realoca — isso é exclusivo da CLINICA.
--
-- O PROFISSIONAL não enxerga a Fila 1. O paciente aparece na fila dele apenas
-- quando sai do guichê, no encaminhamento que define o responsável.
--
-- Observação sobre o ENUM: 'unidade' é adicionado a papel_usuario nesta mesma
-- transação, então nenhuma expressão aqui pode usar o literal do enum. Todas as
-- comparações são feitas por papel::text, que não referencia o novo valor.
-- =============================================================================

alter type public.papel_usuario add value if not exists 'unidade';

-- -----------------------------------------------------------------------------
-- 1. Estrutura
-- -----------------------------------------------------------------------------
alter table public.perfil
  add column if not exists unidade_id uuid references public.unidade (id) on delete set null;

comment on column public.perfil.unidade_id is 'Unidade do usuário quando papel = unidade. Nulo para os demais papéis.';

create index if not exists perfil_unidade_idx on public.perfil (unidade_id) where unidade_id is not null;

alter table public.fila_evento
  add column if not exists unidade_id uuid references public.unidade (id) on delete set null;

create index if not exists fila_evento_unidade_idx on public.fila_evento (unidade_id, created_at desc);

alter table public.fila_evento disable trigger trg_fila_evento_imutavel;

update public.fila_evento fe
   set unidade_id = g.unidade_id
  from public.atendimento a
  join public.guiche g on g.id = a.guiche_id
 where fe.ticket_id = a.id
   and fe.tipo_fila = 'atendimento'
   and fe.unidade_id is null;

update public.fila_evento fe
   set unidade_id = c.unidade_id
  from public.consulta c
 where fe.ticket_id = c.id
   and fe.tipo_fila = 'consulta'
   and fe.unidade_id is null;

alter table public.fila_evento enable trigger trg_fila_evento_imutavel;

-- -----------------------------------------------------------------------------
-- 2. Funções de contexto
-- -----------------------------------------------------------------------------
create or replace function public.fn_unidade_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.unidade_id from public.perfil p where p.id = auth.uid() and p.deleted_at is null;
$$;

create or replace function public.fn_e_admin_unidade()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfil p
     where p.id = auth.uid()
       and p.papel::text = 'unidade'
       and p.unidade_id is not null
       and p.deleted_at is null
  );
$$;

-- Verdadeiro quando o usuário administra a unidade: admin da clínica dona dela
-- ou o próprio usuário daquela unidade
create or replace function public.fn_gerencia_unidade(p_unidade_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.perfil pf
      join public.unidade un on un.id = p_unidade_id
     where pf.id = auth.uid()
       and pf.deleted_at is null
       and un.deleted_at is null
       and (
            (pf.papel::text = 'clinica' and pf.clinica_id = un.clinica_id)
         or (pf.papel::text = 'unidade' and pf.unidade_id = un.id)
       )
  );
$$;

-- Conjunto das unidades que o usuário gerencia. Nas policies entra como
-- "unidade_id in (select ...)": o planner avalia uma vez por consulta e faz
-- hash, em vez de chamar fn_gerencia_unidade linha a linha
create or replace function public.fn_unidades_gerenciadas()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select un.id
    from public.perfil pf
    join public.unidade un
      on (pf.papel::text = 'clinica' and un.clinica_id = pf.clinica_id)
      or (pf.papel::text = 'unidade' and un.id = pf.unidade_id)
   where pf.id = auth.uid()
     and pf.deleted_at is null
     and un.deleted_at is null;
$$;

create or replace function public.fn_unidade_do_guiche(p_guiche_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select g.unidade_id from public.guiche g where g.id = p_guiche_id;
$$;

create or replace function public.fn_profissional_na_unidade(p_profissional_id uuid, p_unidade_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.locacao l
     where l.profissional_id = p_profissional_id
       and l.unidade_id = p_unidade_id
       and l.ativa
       and l.deleted_at is null
       and l.data_inicio <= current_date
       and (l.data_fim is null or l.data_fim >= current_date)
  );
$$;

-- Concentra a visibilidade do paciente para evitar RLS aninhada nas políticas.
-- O profissional só alcança quem está na fila de consulta dele.
create or replace function public.fn_paciente_visivel(p_paciente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.atendimento a
      join public.guiche g on g.id = a.guiche_id
     where a.paciente_id = p_paciente_id
       and public.fn_gerencia_unidade(g.unidade_id)
    union all
    select 1
      from public.consulta c
     where c.paciente_id = p_paciente_id
       and (public.fn_gerencia_unidade(c.unidade_id) or c.profissional_id = public.fn_profissional_atual())
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. Coerência do perfil e locação automática
-- -----------------------------------------------------------------------------
create or replace function public.fn_validar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.papel::text = 'unidade' then
    if new.unidade_id is null then
      if tg_op = 'INSERT' or new.papel is distinct from old.papel then
        raise exception 'Perfil de unidade exige a unidade vinculada.' using errcode = 'check_violation';
      end if;
    else
      select u.clinica_id into new.clinica_id from public.unidade u where u.id = new.unidade_id;
    end if;
  else
    new.unidade_id := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_perfil_validacao on public.perfil;
create trigger trg_perfil_validacao
  before insert or update of papel, unidade_id, clinica_id on public.perfil
  for each row execute function public.fn_validar_perfil();

-- -----------------------------------------------------------------------------
-- 4. Triggers de fila passam a registrar a unidade no histórico
-- -----------------------------------------------------------------------------
create or replace function public.fn_log_fila_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinica_id uuid;
  v_unidade_id uuid;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  if tg_table_name = 'atendimento' then
    v_unidade_id := public.fn_unidade_do_guiche(new.guiche_id);
    v_clinica_id := public.fn_clinica_do_guiche(new.guiche_id);

    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, unidade_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'atendimento', new.id, v_clinica_id, v_unidade_id,
      case when tg_op = 'UPDATE' then old.status end, new.status,
      pg_trigger_depth() > 1,
      jsonb_build_object('guiche_id', new.guiche_id, 'senha', new.senha, 'posicao', new.posicao),
      auth.uid()
    );
  else
    select u.clinica_id into v_clinica_id from public.unidade u where u.id = new.unidade_id;

    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, unidade_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'consulta', new.id, v_clinica_id, new.unidade_id,
      case when tg_op = 'UPDATE' then old.status end, new.status,
      pg_trigger_depth() > 1,
      jsonb_build_object('profissional_id', new.profissional_id, 'senha', new.senha, 'posicao', new.posicao),
      auth.uid()
    );
  end if;

  return null;
end;
$$;

create or replace function public.fn_encaminhar_para_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unidade_id   uuid;
  v_encaminha    boolean;
  v_profissional uuid;
  v_consulta_id  uuid;
begin
  if new.status <> 'finalizado' or old.status = 'finalizado' then
    return null;
  end if;

  if new.consulta_gerada_id is not null or new.deleted_at is not null then
    return null;
  end if;

  select g.unidade_id,
         (new.encaminhar_para_consulta or g.encaminha_para_consulta),
         coalesce(new.proximo_profissional_id, g.profissional_padrao_id)
    into v_unidade_id, v_encaminha, v_profissional
    from public.guiche g
   where g.id = new.guiche_id;

  if not coalesce(v_encaminha, false) or v_profissional is null then
    return null;
  end if;

  -- Sem locação vigente o encaminhamento é apenas registrado, nunca bloqueia o guichê
  if not public.fn_profissional_na_unidade(v_profissional, v_unidade_id) then
    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, unidade_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'atendimento', new.id, public.fn_clinica_do_guiche(new.guiche_id), v_unidade_id, old.status, new.status, true,
      jsonb_build_object('encaminhamento', 'ignorado', 'motivo', 'profissional sem locação vigente',
                         'profissional_id', v_profissional),
      auth.uid()
    );
    return null;
  end if;

  insert into public.consulta (
    profissional_id, paciente_id, unidade_id, origem_atendimento_id,
    status, prioridade, tipo_consulta, created_by
  )
  values (
    v_profissional, new.paciente_id, v_unidade_id, new.id,
    'aguardando', new.prioridade, coalesce(new.tipo_consulta, 'Primeira vez'), new.updated_by
  )
  on conflict do nothing
  returning id into v_consulta_id;

  if v_consulta_id is null then
    select c.id into v_consulta_id
      from public.consulta c
     where c.profissional_id = v_profissional
       and c.paciente_id = new.paciente_id
       and c.status in ('aguardando', 'chamado', 'em_atendimento')
       and c.deleted_at is null
     order by c.entrada_fila
     limit 1;
  end if;

  update public.atendimento
     set consulta_gerada_id = v_consulta_id
   where id = new.id;

  return null;
end;
$$;

-- Não rebaixa o papel de um usuário que já administra clínica ou unidade
create or replace function public.fn_vincular_perfil_profissional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  insert into public.perfil as pf (id, clinica_id, papel, nome, email)
  values (new.user_id, new.clinica_id, 'profissional', new.nome, new.email)
  on conflict (id) do update
    set clinica_id = excluded.clinica_id,
        nome       = excluded.nome,
        updated_at = now()
  where pf.papel::text = 'profissional';

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Vinculação de usuários da unidade (feita pela administração da clínica)
-- -----------------------------------------------------------------------------
create or replace function public.fn_vincular_usuario(
  p_email      text,
  p_papel      text,
  p_unidade_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id    uuid;
  v_clinica_id uuid;
  v_nome       text;
begin
  if not public.fn_e_admin_clinica() then
    raise exception 'Apenas a administração da clínica pode vincular usuários.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_papel not in ('clinica', 'unidade', 'profissional') then
    raise exception 'Papel inválido.' using errcode = 'check_violation';
  end if;

  v_clinica_id := public.fn_clinica_atual();

  if p_papel = 'unidade' then
    if p_unidade_id is null then
      raise exception 'Informe a unidade do usuário.' using errcode = 'check_violation';
    end if;

    if not exists (
      select 1 from public.unidade u
       where u.id = p_unidade_id and u.clinica_id = v_clinica_id and u.deleted_at is null
    ) then
      raise exception 'A unidade informada não pertence à sua clínica.'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  select u.id, coalesce(u.raw_user_meta_data ->> 'nome', split_part(u.email, '@', 1))
    into v_user_id, v_nome
    from auth.users u
   where lower(u.email) = lower(btrim(p_email));

  if v_user_id is null then
    raise exception 'Usuário não encontrado. Peça que ele crie a conta antes do vínculo.'
      using errcode = 'no_data_found';
  end if;

  insert into public.perfil (id, clinica_id, unidade_id, papel, nome, email)
  values (
    v_user_id, v_clinica_id,
    case when p_papel = 'unidade' then p_unidade_id end,
    p_papel::public.papel_usuario,
    v_nome, lower(btrim(p_email))
  )
  on conflict (id) do update
    set clinica_id = excluded.clinica_id,
        unidade_id = excluded.unidade_id,
        papel      = excluded.papel,
        deleted_at = null,
        deleted_by = null,
        updated_at = now();

  return v_user_id;
end;
$$;

comment on function public.fn_vincular_usuario is 'Vincula uma conta existente do Auth à clínica do administrador, com papel e unidade.';

-- -----------------------------------------------------------------------------
-- 6. Políticas de RLS refeitas
-- -----------------------------------------------------------------------------
drop policy if exists "clinica_select_tenant"            on public.clinica;
drop policy if exists "clinica_insert_primeiro_cadastro" on public.clinica;
drop policy if exists "clinica_update_admin"             on public.clinica;
drop policy if exists "clinica_delete_admin"             on public.clinica;

drop policy if exists "perfil_select_proprio_ou_tenant"  on public.perfil;
drop policy if exists "perfil_insert_proprio_ou_admin"   on public.perfil;
drop policy if exists "perfil_update_proprio_ou_admin"   on public.perfil;
drop policy if exists "perfil_delete_admin"              on public.perfil;

drop policy if exists "unidade_select_tenant"            on public.unidade;
drop policy if exists "unidade_insert_admin"             on public.unidade;
drop policy if exists "unidade_update_admin"             on public.unidade;
drop policy if exists "unidade_delete_admin"             on public.unidade;

drop policy if exists "profissional_select_tenant"           on public.profissional;
drop policy if exists "profissional_insert_admin"            on public.profissional;
drop policy if exists "profissional_update_admin_ou_proprio" on public.profissional;
drop policy if exists "profissional_delete_admin"            on public.profissional;

drop policy if exists "guiche_select_tenant" on public.guiche;
drop policy if exists "guiche_insert_admin"  on public.guiche;
drop policy if exists "guiche_update_admin"  on public.guiche;
drop policy if exists "guiche_delete_admin"  on public.guiche;

drop policy if exists "locacao_select_tenant" on public.locacao;
drop policy if exists "locacao_insert_admin"  on public.locacao;
drop policy if exists "locacao_update_admin"  on public.locacao;
drop policy if exists "locacao_delete_admin"  on public.locacao;

drop policy if exists "paciente_select_tenant" on public.paciente;
drop policy if exists "paciente_insert_tenant" on public.paciente;
drop policy if exists "paciente_update_admin"  on public.paciente;
drop policy if exists "paciente_delete_admin"  on public.paciente;

drop policy if exists "atendimento_select_tenant"   on public.atendimento;
drop policy if exists "atendimento_insert_operador" on public.atendimento;
drop policy if exists "atendimento_update_operador" on public.atendimento;
drop policy if exists "atendimento_delete_admin"    on public.atendimento;

drop policy if exists "consulta_select_tenant"      on public.consulta;
drop policy if exists "consulta_insert_tenant"      on public.consulta;
drop policy if exists "consulta_update_dono_da_fila" on public.consulta;
drop policy if exists "consulta_delete_admin"       on public.consulta;

drop policy if exists "fila_evento_select_tenant" on public.fila_evento;

-- CLINICA — leitura para todos os papéis do tenant, escrita só da administração
create policy "clinica_select_tenant" on public.clinica
  for select to authenticated
  using (id = public.fn_clinica_atual());

create policy "clinica_insert_primeiro_cadastro" on public.clinica
  for insert to authenticated
  with check (public.fn_clinica_atual() is null);

create policy "clinica_update_admin" on public.clinica
  for update to authenticated
  using (id = public.fn_clinica_atual() and public.fn_e_admin_clinica())
  with check (id = public.fn_clinica_atual());

create policy "clinica_delete_admin" on public.clinica
  for delete to authenticated
  using (id = public.fn_clinica_atual() and public.fn_e_admin_clinica());

-- PERFIL
create policy "perfil_select_escopo" on public.perfil
  for select to authenticated
  using (
    id = auth.uid()
    or (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
    or (public.fn_e_admin_unidade() and unidade_id = public.fn_unidade_atual())
  );

create policy "perfil_insert_proprio_ou_admin" on public.perfil
  for insert to authenticated
  with check (
    id = auth.uid()
    or (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
  );

create policy "perfil_update_proprio_ou_admin" on public.perfil
  for update to authenticated
  using (
    id = auth.uid()
    or (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
  )
  with check (
    id = auth.uid()
    or (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
  );

create policy "perfil_delete_admin" on public.perfil
  for delete to authenticated
  using (
    public.fn_e_admin_clinica()
    and clinica_id = public.fn_clinica_atual()
    and id <> auth.uid()
  );

-- UNIDADE — a unidade enxerga a si mesma, mas não cria nem edita unidades
create policy "unidade_select_escopo" on public.unidade
  for select to authenticated
  using (
    (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
    or id = public.fn_unidade_atual()
    or public.fn_atua_na_unidade(id)
  );

create policy "unidade_insert_admin_clinica" on public.unidade
  for insert to authenticated
  with check (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

create policy "unidade_update_admin_clinica" on public.unidade
  for update to authenticated
  using (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
  with check (clinica_id = public.fn_clinica_atual());

create policy "unidade_delete_admin_clinica" on public.unidade
  for delete to authenticated
  using (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

-- PROFISSIONAL — a unidade apenas visualiza quem está alocado nela;
-- cadastro, edição e remanejamento são exclusivos da clínica
create policy "profissional_select_escopo" on public.profissional
  for select to authenticated
  using (
    (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
    or user_id = auth.uid()
    or (public.fn_e_admin_unidade()
        and public.fn_profissional_na_unidade(profissional.id, public.fn_unidade_atual()))
  );

create policy "profissional_insert_admin_clinica" on public.profissional
  for insert to authenticated
  with check (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

create policy "profissional_update_admin_ou_proprio" on public.profissional
  for update to authenticated
  using (
    (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
    or user_id = auth.uid()
  )
  with check (clinica_id = public.fn_clinica_atual());

create policy "profissional_delete_admin_clinica" on public.profissional
  for delete to authenticated
  using (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

-- GUICHE — CRUD completo dentro da unidade. Sem a Fila 1, o profissional
-- não precisa enxergar guichês
create policy "guiche_select_gestor" on public.guiche
  for select to authenticated
  using (public.fn_gerencia_unidade(unidade_id));

create policy "guiche_insert_gestor" on public.guiche
  for insert to authenticated
  with check (public.fn_gerencia_unidade(unidade_id));

create policy "guiche_update_gestor" on public.guiche
  for update to authenticated
  using (public.fn_gerencia_unidade(unidade_id))
  with check (public.fn_gerencia_unidade(unidade_id));

create policy "guiche_delete_gestor" on public.guiche
  for delete to authenticated
  using (public.fn_gerencia_unidade(unidade_id));

-- LOCACAO — leitura no escopo, escrita exclusiva da administração da clínica
create policy "locacao_select_escopo" on public.locacao
  for select to authenticated
  using (
    public.fn_gerencia_unidade(unidade_id)
    or profissional_id = public.fn_profissional_atual()
  );

create policy "locacao_insert_admin_clinica" on public.locacao
  for insert to authenticated
  with check (
    public.fn_e_admin_clinica()
    and public.fn_gerencia_unidade(unidade_id)
  );

create policy "locacao_update_admin_clinica" on public.locacao
  for update to authenticated
  using (public.fn_e_admin_clinica() and public.fn_gerencia_unidade(unidade_id))
  with check (public.fn_e_admin_clinica() and public.fn_gerencia_unidade(unidade_id));

create policy "locacao_delete_admin_clinica" on public.locacao
  for delete to authenticated
  using (public.fn_e_admin_clinica() and public.fn_gerencia_unidade(unidade_id));

-- PACIENTE
create policy "paciente_select_escopo" on public.paciente
  for select to authenticated
  using (public.fn_paciente_visivel(paciente.id));

create policy "paciente_insert_tenant" on public.paciente
  for insert to authenticated
  with check (public.fn_clinica_atual() is not null);

create policy "paciente_update_gestor" on public.paciente
  for update to authenticated
  using (
    (public.fn_e_admin_clinica() or public.fn_e_admin_unidade())
    and public.fn_paciente_visivel(paciente.id)
  )
  with check (public.fn_e_admin_clinica() or public.fn_e_admin_unidade());

create policy "paciente_delete_admin_clinica" on public.paciente
  for delete to authenticated
  using (public.fn_e_admin_clinica() and public.fn_paciente_visivel(paciente.id));

-- ATENDIMENTO (Fila Virtual 1) — operada apenas por quem gere a unidade.
-- O profissional não alcança esta fila: recebe o paciente pelo encaminhamento.
create policy "atendimento_select_gestor" on public.atendimento
  for select to authenticated
  using (public.fn_gerencia_unidade(public.fn_unidade_do_guiche(guiche_id)));

create policy "atendimento_insert_gestor" on public.atendimento
  for insert to authenticated
  with check (public.fn_gerencia_unidade(public.fn_unidade_do_guiche(guiche_id)));

create policy "atendimento_update_gestor" on public.atendimento
  for update to authenticated
  using (public.fn_gerencia_unidade(public.fn_unidade_do_guiche(guiche_id)))
  with check (public.fn_gerencia_unidade(public.fn_unidade_do_guiche(guiche_id)));

create policy "atendimento_delete_gestor" on public.atendimento
  for delete to authenticated
  using (public.fn_gerencia_unidade(public.fn_unidade_do_guiche(guiche_id)));

-- CONSULTA (Fila Virtual 2)
create policy "consulta_select_escopo" on public.consulta
  for select to authenticated
  using (unidade_id in (select public.fn_unidades_gerenciadas()) or profissional_id = (select public.fn_profissional_atual()));

create policy "consulta_insert_escopo" on public.consulta
  for insert to authenticated
  with check (unidade_id in (select public.fn_unidades_gerenciadas()) or profissional_id = (select public.fn_profissional_atual()));

create policy "consulta_update_escopo" on public.consulta
  for update to authenticated
  using (unidade_id in (select public.fn_unidades_gerenciadas()) or profissional_id = (select public.fn_profissional_atual()))
  with check (unidade_id in (select public.fn_unidades_gerenciadas()) or profissional_id = (select public.fn_profissional_atual()));

create policy "consulta_delete_gestor" on public.consulta
  for delete to authenticated
  using (unidade_id in (select public.fn_unidades_gerenciadas()));

-- FILA_EVENTO — histórico é ferramenta de gestão
create policy "fila_evento_select_gestor" on public.fila_evento
  for select to authenticated
  using (
    ((select public.fn_e_admin_clinica()) and clinica_id = (select public.fn_clinica_atual()))
    or unidade_id in (select public.fn_unidades_gerenciadas())
  );

comment on view public.vw_fila_unificada is
  'Combina as duas filas dentro do escopo do usuário. Gestores de clínica e de unidade veem atendimentos e consultas; o profissional vê apenas as suas consultas, porque o RLS da Fila 1 não o alcança.';

-- -----------------------------------------------------------------------------
-- 7. Relatórios por unidade
-- -----------------------------------------------------------------------------
drop view if exists public.vw_metricas_diarias cascade;

create view public.vw_metricas_diarias
with (security_invoker = true, security_barrier = true) as
select
  t.clinica_id,
  t.unidade_id,
  t.data_fila,
  t.tipo_fila,
  count(*)                                                        as total_tickets,
  count(*) filter (where t.status = 'finalizado')                 as finalizados,
  count(*) filter (where t.status = 'cancelado')                  as cancelados,
  count(*) filter (where t.status = 'ausente')                    as ausentes,
  count(*) filter (where t.status in ('aguardando', 'chamado'))   as em_fila,
  round(avg(t.espera_minutos) filter (where t.status = 'finalizado'), 1)   as espera_media_minutos,
  round(avg(t.duracao_minutos) filter (where t.status = 'finalizado'), 1)  as duracao_media_minutos
from public.vw_relatorio_tickets t
group by t.clinica_id, t.unidade_id, t.data_fila, t.tipo_fila;

create view public.vw_dashboard_clinica
with (security_invoker = true, security_barrier = true) as
select
  c.id                                                                  as clinica_id,
  c.nome                                                                as clinica_nome,
  c.plano,
  (select count(*) from public.unidade u where u.clinica_id = c.id and u.deleted_at is null)      as total_unidades,
  (select count(*) from public.profissional p where p.clinica_id = c.id and p.deleted_at is null) as total_profissionais,
  (select count(*) from public.guiche g
     join public.unidade u on u.id = g.unidade_id
    where u.clinica_id = c.id and g.deleted_at is null)                                           as total_guiches,
  coalesce(sum(m.total_tickets) filter (where m.data_fila = current_date), 0)                     as tickets_hoje,
  coalesce(sum(m.finalizados)   filter (where m.data_fila = current_date), 0)                     as finalizados_hoje,
  coalesce(sum(m.em_fila)       filter (where m.data_fila = current_date), 0)                     as aguardando_agora,
  round(avg(m.espera_media_minutos) filter (where m.data_fila = current_date), 1)                 as espera_media_hoje,
  round(avg(m.duracao_media_minutos) filter (where m.data_fila >= current_date - 29), 1)          as duracao_media_30d
from public.clinica c
left join public.vw_metricas_diarias m on m.clinica_id = c.id
where c.deleted_at is null
group by c.id, c.nome, c.plano;

create view public.vw_dashboard_unidade
with (security_invoker = true, security_barrier = true) as
select
  u.id                                                                  as unidade_id,
  u.clinica_id,
  u.nome                                                                as unidade_nome,
  (select count(*) from public.guiche g where g.unidade_id = u.id and g.deleted_at is null)       as total_guiches,
  (select count(*) from public.locacao l
    where l.unidade_id = u.id and l.ativa and l.deleted_at is null)                               as total_profissionais,
  coalesce(sum(m.total_tickets) filter (where m.data_fila = current_date), 0)                     as tickets_hoje,
  coalesce(sum(m.finalizados)   filter (where m.data_fila = current_date), 0)                     as finalizados_hoje,
  coalesce(sum(m.cancelados)    filter (where m.data_fila = current_date), 0)                     as cancelados_hoje,
  coalesce(sum(m.ausentes)      filter (where m.data_fila = current_date), 0)                     as ausentes_hoje,
  coalesce(sum(m.em_fila)       filter (where m.data_fila = current_date), 0)                     as aguardando_agora,
  round(avg(m.espera_media_minutos) filter (where m.data_fila = current_date), 1)                 as espera_media_hoje,
  round(avg(m.duracao_media_minutos) filter (where m.data_fila >= current_date - 29), 1)          as duracao_media_30d
from public.unidade u
left join public.vw_metricas_diarias m on m.unidade_id = u.id
where u.deleted_at is null
group by u.id, u.clinica_id, u.nome;

-- -----------------------------------------------------------------------------
-- 8. Privilégios dos objetos novos e recriados
--    As default privileges do schema estão fechadas: sem GRANT explícito,
--    nada fica acessível a anon ou authenticated.
-- -----------------------------------------------------------------------------
grant select on
  public.vw_metricas_diarias, public.vw_dashboard_clinica, public.vw_dashboard_unidade
  to authenticated;

grant execute on function
  public.fn_unidade_atual(),
  public.fn_e_admin_unidade(),
  public.fn_gerencia_unidade(uuid),
  public.fn_unidade_do_guiche(uuid),
  public.fn_profissional_na_unidade(uuid, uuid),
  public.fn_paciente_visivel(uuid),
  public.fn_vincular_usuario(text, text, uuid)
  to authenticated;

-- Deixou de ser usada em políticas: agora só é chamada de dentro de funções
-- SECURITY DEFINER, então não precisa mais estar exposta ao papel authenticated
revoke execute on function public.fn_clinica_do_guiche(uuid) from authenticated;

-- -----------------------------------------------------------------------------
-- 9. Limpeza de objetos sem consumidor
-- -----------------------------------------------------------------------------

-- Nenhuma política usa fn_papel_atual: o papel do usuário vem da leitura de perfil,
-- que o próprio usuário já enxerga
drop function if exists public.fn_papel_atual();

-- Colunas nunca lidas por nenhuma função, view ou política.
-- data_nascimento ainda concentrava dado pessoal sem finalidade no produto.
-- slug não é usado por nenhuma rota: as públicas endereçam por guicheId e ticketId.
-- O índice único clinica_slug_unico_idx cai junto com a coluna.
alter table public.paciente drop column if exists data_nascimento;
alter table public.locacao  drop column if exists observacoes;
alter table public.clinica  drop column if exists slug;

-- Índices sobre tabelas de pouquíssimas linhas ou sem consulta correspondente:
-- a clínica tem uma linha por tenant e o perfil nunca é filtrado por papel
drop index if exists public.clinica_nome_busca_idx;
drop index if exists public.clinica_plano_idx;
drop index if exists public.perfil_papel_idx;
