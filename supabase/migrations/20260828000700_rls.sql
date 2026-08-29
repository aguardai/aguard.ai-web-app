-- =============================================================================
-- Aguard.ai — 07. Row Level Security e regras de acesso
--
-- Papéis:
--   anon          -> paciente público. Sem acesso direto às tabelas; usa apenas
--                    as funções RPC e as views anonimizadas.
--   authenticated -> perfil 'clinica'      : CRUD completo dentro do próprio tenant.
--                    perfil 'profissional' : leitura do tenant e escrita apenas
--                                            nas filas em que atua.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções de contexto (SECURITY DEFINER para evitar recursão nas políticas)
-- -----------------------------------------------------------------------------
create or replace function public.fn_clinica_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.clinica_id from public.perfil p where p.id = auth.uid() and p.deleted_at is null;
$$;

create or replace function public.fn_papel_atual()
returns public.papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select p.papel from public.perfil p where p.id = auth.uid() and p.deleted_at is null;
$$;

create or replace function public.fn_e_admin_clinica()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfil p
     where p.id = auth.uid() and p.papel = 'clinica' and p.clinica_id is not null and p.deleted_at is null
  );
$$;

create or replace function public.fn_profissional_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.profissional p
   where p.user_id = auth.uid() and p.deleted_at is null
   limit 1;
$$;

-- Verifica se o profissional autenticado possui locação vigente na unidade
create or replace function public.fn_atua_na_unidade(p_unidade_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.locacao l
     where l.unidade_id = p_unidade_id
       and l.profissional_id = public.fn_profissional_atual()
       and l.ativa
       and l.deleted_at is null
       and l.data_inicio <= current_date
       and (l.data_fim is null or l.data_fim >= current_date)
  );
$$;

-- -----------------------------------------------------------------------------
-- Ativação do RLS
-- -----------------------------------------------------------------------------
alter table public.clinica       enable row level security;
alter table public.perfil        enable row level security;
alter table public.unidade       enable row level security;
alter table public.profissional  enable row level security;
alter table public.guiche        enable row level security;
alter table public.paciente      enable row level security;
alter table public.locacao       enable row level security;
alter table public.atendimento   enable row level security;
alter table public.consulta      enable row level security;
alter table public.fila_evento   enable row level security;
alter table public.plano_limite  enable row level security;

-- -----------------------------------------------------------------------------
-- CLINICA
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- PERFIL
-- -----------------------------------------------------------------------------
create policy "perfil_select_proprio_ou_tenant" on public.perfil
  for select to authenticated
  using (id = auth.uid() or clinica_id = public.fn_clinica_atual());

create policy "perfil_insert_proprio_ou_admin" on public.perfil
  for insert to authenticated
  with check (id = auth.uid() or (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual()));

create policy "perfil_update_proprio_ou_admin" on public.perfil
  for update to authenticated
  using (id = auth.uid() or (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual()))
  with check (id = auth.uid() or (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual()));

create policy "perfil_delete_admin" on public.perfil
  for delete to authenticated
  using (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual() and id <> auth.uid());

-- -----------------------------------------------------------------------------
-- UNIDADE
-- -----------------------------------------------------------------------------
create policy "unidade_select_tenant" on public.unidade
  for select to authenticated
  using (clinica_id = public.fn_clinica_atual());

create policy "unidade_insert_admin" on public.unidade
  for insert to authenticated
  with check (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

create policy "unidade_update_admin" on public.unidade
  for update to authenticated
  using (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual())
  with check (clinica_id = public.fn_clinica_atual());

create policy "unidade_delete_admin" on public.unidade
  for delete to authenticated
  using (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

-- -----------------------------------------------------------------------------
-- PROFISSIONAL
-- -----------------------------------------------------------------------------
create policy "profissional_select_tenant" on public.profissional
  for select to authenticated
  using (clinica_id = public.fn_clinica_atual());

create policy "profissional_insert_admin" on public.profissional
  for insert to authenticated
  with check (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

create policy "profissional_update_admin_ou_proprio" on public.profissional
  for update to authenticated
  using (
    clinica_id = public.fn_clinica_atual()
    and (public.fn_e_admin_clinica() or user_id = auth.uid())
  )
  with check (clinica_id = public.fn_clinica_atual());

create policy "profissional_delete_admin" on public.profissional
  for delete to authenticated
  using (public.fn_e_admin_clinica() and clinica_id = public.fn_clinica_atual());

-- -----------------------------------------------------------------------------
-- GUICHE
-- -----------------------------------------------------------------------------
create policy "guiche_select_tenant" on public.guiche
  for select to authenticated
  using (exists (
    select 1 from public.unidade u
     where u.id = guiche.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "guiche_insert_admin" on public.guiche
  for insert to authenticated
  with check (public.fn_e_admin_clinica() and exists (
    select 1 from public.unidade u
     where u.id = guiche.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "guiche_update_admin" on public.guiche
  for update to authenticated
  using (public.fn_e_admin_clinica() and exists (
    select 1 from public.unidade u
     where u.id = guiche.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ))
  with check (exists (
    select 1 from public.unidade u
     where u.id = guiche.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "guiche_delete_admin" on public.guiche
  for delete to authenticated
  using (public.fn_e_admin_clinica() and exists (
    select 1 from public.unidade u
     where u.id = guiche.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

-- -----------------------------------------------------------------------------
-- LOCACAO
-- -----------------------------------------------------------------------------
create policy "locacao_select_tenant" on public.locacao
  for select to authenticated
  using (exists (
    select 1 from public.unidade u
     where u.id = locacao.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "locacao_insert_admin" on public.locacao
  for insert to authenticated
  with check (public.fn_e_admin_clinica() and exists (
    select 1 from public.unidade u
     where u.id = locacao.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "locacao_update_admin" on public.locacao
  for update to authenticated
  using (public.fn_e_admin_clinica() and exists (
    select 1 from public.unidade u
     where u.id = locacao.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ))
  with check (exists (
    select 1 from public.unidade u
     where u.id = locacao.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "locacao_delete_admin" on public.locacao
  for delete to authenticated
  using (public.fn_e_admin_clinica() and exists (
    select 1 from public.unidade u
     where u.id = locacao.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

-- -----------------------------------------------------------------------------
-- PACIENTE
-- Visível apenas para o tenant que possui um ticket vinculado ao paciente.
-- -----------------------------------------------------------------------------
create policy "paciente_select_tenant" on public.paciente
  for select to authenticated
  using (
    exists (
      select 1
        from public.atendimento a
        join public.guiche g on g.id = a.guiche_id
        join public.unidade u on u.id = g.unidade_id
       where a.paciente_id = paciente.id and u.clinica_id = public.fn_clinica_atual()
    )
    or exists (
      select 1
        from public.consulta c
        join public.unidade u on u.id = c.unidade_id
       where c.paciente_id = paciente.id and u.clinica_id = public.fn_clinica_atual()
    )
  );

create policy "paciente_insert_tenant" on public.paciente
  for insert to authenticated
  with check (public.fn_clinica_atual() is not null);

create policy "paciente_update_admin" on public.paciente
  for update to authenticated
  using (public.fn_e_admin_clinica())
  with check (public.fn_e_admin_clinica());

create policy "paciente_delete_admin" on public.paciente
  for delete to authenticated
  using (public.fn_e_admin_clinica());

-- -----------------------------------------------------------------------------
-- ATENDIMENTO (Fila Virtual 1)
-- -----------------------------------------------------------------------------
create policy "atendimento_select_tenant" on public.atendimento
  for select to authenticated
  using (public.fn_clinica_do_guiche(atendimento.guiche_id) = public.fn_clinica_atual());

create policy "atendimento_insert_operador" on public.atendimento
  for insert to authenticated
  with check (
    public.fn_clinica_do_guiche(atendimento.guiche_id) = public.fn_clinica_atual()
    and (
      public.fn_e_admin_clinica()
      or exists (
        select 1 from public.guiche g
         where g.id = atendimento.guiche_id and public.fn_atua_na_unidade(g.unidade_id)
      )
    )
  );

create policy "atendimento_update_operador" on public.atendimento
  for update to authenticated
  using (
    public.fn_clinica_do_guiche(atendimento.guiche_id) = public.fn_clinica_atual()
    and (
      public.fn_e_admin_clinica()
      or exists (
        select 1 from public.guiche g
         where g.id = atendimento.guiche_id and public.fn_atua_na_unidade(g.unidade_id)
      )
    )
  )
  with check (public.fn_clinica_do_guiche(atendimento.guiche_id) = public.fn_clinica_atual());

create policy "atendimento_delete_admin" on public.atendimento
  for delete to authenticated
  using (
    public.fn_e_admin_clinica()
    and public.fn_clinica_do_guiche(atendimento.guiche_id) = public.fn_clinica_atual()
  );

-- -----------------------------------------------------------------------------
-- CONSULTA (Fila Virtual 2)
-- -----------------------------------------------------------------------------
create policy "consulta_select_tenant" on public.consulta
  for select to authenticated
  using (exists (
    select 1 from public.unidade u
     where u.id = consulta.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "consulta_insert_tenant" on public.consulta
  for insert to authenticated
  with check (
    exists (
      select 1 from public.unidade u
       where u.id = consulta.unidade_id and u.clinica_id = public.fn_clinica_atual()
    )
    and (public.fn_e_admin_clinica() or consulta.profissional_id = public.fn_profissional_atual())
  );

create policy "consulta_update_dono_da_fila" on public.consulta
  for update to authenticated
  using (
    exists (
      select 1 from public.unidade u
       where u.id = consulta.unidade_id and u.clinica_id = public.fn_clinica_atual()
    )
    and (public.fn_e_admin_clinica() or consulta.profissional_id = public.fn_profissional_atual())
  )
  with check (exists (
    select 1 from public.unidade u
     where u.id = consulta.unidade_id and u.clinica_id = public.fn_clinica_atual()
  ));

create policy "consulta_delete_admin" on public.consulta
  for delete to authenticated
  using (
    public.fn_e_admin_clinica()
    and exists (
      select 1 from public.unidade u
       where u.id = consulta.unidade_id and u.clinica_id = public.fn_clinica_atual()
    )
  );

-- -----------------------------------------------------------------------------
-- FILA_EVENTO — somente leitura pelo tenant. Escrita apenas pelos triggers.
-- -----------------------------------------------------------------------------
create policy "fila_evento_select_tenant" on public.fila_evento
  for select to authenticated
  using (clinica_id = public.fn_clinica_atual());

-- -----------------------------------------------------------------------------
-- PLANO_LIMITE — tabela de referência pública, somente leitura
-- -----------------------------------------------------------------------------
create policy "plano_limite_select_publico" on public.plano_limite
  for select to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Privilégios de tabela
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select, insert, update, delete on
  public.clinica, public.perfil, public.unidade, public.profissional,
  public.guiche, public.paciente, public.locacao, public.atendimento, public.consulta
  to authenticated;

grant select on public.fila_evento, public.plano_limite to authenticated;
grant select on public.plano_limite to anon;

grant usage on schema public to anon, authenticated;
