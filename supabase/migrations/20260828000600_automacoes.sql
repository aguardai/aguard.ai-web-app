-- =============================================================================
-- Aguard.ai — 06. Automações (triggers)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Auditoria e soft delete em todas as tabelas de negócio
-- -----------------------------------------------------------------------------
do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array[
    'clinica', 'perfil', 'unidade', 'profissional',
    'guiche', 'paciente', 'locacao', 'atendimento', 'consulta'
  ] loop
    execute format(
      'create trigger trg_%1$s_auditoria before insert or update on public.%1$I
         for each row execute function public.fn_auditoria()', v_tabela);

    execute format(
      'create trigger trg_%1$s_soft_delete before delete on public.%1$I
         for each row execute function public.fn_soft_delete()', v_tabela);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Vínculo automático entre usuários do Supabase Auth e perfis
-- -----------------------------------------------------------------------------
create trigger trg_auth_novo_usuario
  after insert on auth.users
  for each row execute function public.fn_novo_usuario();

create trigger trg_clinica_vincular_admin
  after insert on public.clinica
  for each row execute function public.fn_vincular_admin_clinica();

create trigger trg_profissional_vincular_perfil
  after insert or update of user_id, clinica_id on public.profissional
  for each row execute function public.fn_vincular_perfil_profissional();

-- -----------------------------------------------------------------------------
-- Propagação do soft delete para os registros filhos
-- -----------------------------------------------------------------------------
create or replace function public.fn_cascata_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is null or old.deleted_at is not null then
    return null;
  end if;

  if tg_table_name = 'clinica' then
    update public.unidade set deleted_at = new.deleted_at, deleted_by = new.deleted_by
      where clinica_id = new.id and deleted_at is null;
    update public.profissional set deleted_at = new.deleted_at, deleted_by = new.deleted_by
      where clinica_id = new.id and deleted_at is null;

  elsif tg_table_name = 'unidade' then
    update public.guiche set deleted_at = new.deleted_at, deleted_by = new.deleted_by
      where unidade_id = new.id and deleted_at is null;
    update public.locacao set deleted_at = new.deleted_at, deleted_by = new.deleted_by, ativa = false
      where unidade_id = new.id and deleted_at is null;

  elsif tg_table_name = 'profissional' then
    update public.locacao set deleted_at = new.deleted_at, deleted_by = new.deleted_by, ativa = false
      where profissional_id = new.id and deleted_at is null;
  end if;

  return null;
end;
$$;

create trigger trg_clinica_cascata after update of deleted_at on public.clinica
  for each row execute function public.fn_cascata_soft_delete();
create trigger trg_unidade_cascata after update of deleted_at on public.unidade
  for each row execute function public.fn_cascata_soft_delete();
create trigger trg_profissional_cascata after update of deleted_at on public.profissional
  for each row execute function public.fn_cascata_soft_delete();

-- -----------------------------------------------------------------------------
-- Limites da monetização simulada por plano
-- -----------------------------------------------------------------------------
create or replace function public.fn_validar_limite_plano()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinica_id uuid;
  v_limite     public.plano_limite%rowtype;
  v_qtd        integer;
begin
  if tg_table_name = 'guiche' then
    select u.clinica_id into v_clinica_id from public.unidade u where u.id = new.unidade_id;
  else
    v_clinica_id := new.clinica_id;
  end if;

  select l.* into v_limite
    from public.clinica c
    join public.plano_limite l on l.plano = c.plano
   where c.id = v_clinica_id;

  if not found then
    return new;
  end if;

  if tg_table_name = 'unidade' then
    select count(*) into v_qtd from public.unidade
      where clinica_id = v_clinica_id and deleted_at is null;
    if v_qtd >= v_limite.max_unidades then
      raise exception 'Limite de unidades do plano % atingido (máximo de %).', v_limite.plano, v_limite.max_unidades
        using errcode = 'check_violation';
    end if;

  elsif tg_table_name = 'profissional' then
    select count(*) into v_qtd from public.profissional
      where clinica_id = v_clinica_id and deleted_at is null;
    if v_qtd >= v_limite.max_profissionais then
      raise exception 'Limite de profissionais do plano % atingido (máximo de %).', v_limite.plano, v_limite.max_profissionais
        using errcode = 'check_violation';
    end if;

  elsif tg_table_name = 'guiche' then
    select count(*) into v_qtd
      from public.guiche g
      join public.unidade u on u.id = g.unidade_id
     where u.clinica_id = v_clinica_id and g.deleted_at is null;
    if v_qtd >= v_limite.max_guiches then
      raise exception 'Limite de guichês do plano % atingido (máximo de %).', v_limite.plano, v_limite.max_guiches
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_unidade_limite_plano before insert on public.unidade
  for each row execute function public.fn_validar_limite_plano();
create trigger trg_profissional_limite_plano before insert on public.profissional
  for each row execute function public.fn_validar_limite_plano();
create trigger trg_guiche_limite_plano before insert on public.guiche
  for each row execute function public.fn_validar_limite_plano();

-- Bloqueia novos tickets quando o volume mensal do plano é excedido
create or replace function public.fn_validar_limite_tickets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinica_id uuid;
  v_limite     integer;
  v_qtd        integer;
  v_inicio     date := date_trunc('month', current_date)::date;
begin
  if tg_table_name = 'atendimento' then
    v_clinica_id := public.fn_clinica_do_guiche(new.guiche_id);
  else
    select u.clinica_id into v_clinica_id from public.unidade u where u.id = new.unidade_id;
  end if;

  select l.max_tickets_mes into v_limite
    from public.clinica c
    join public.plano_limite l on l.plano = c.plano
   where c.id = v_clinica_id;

  if v_limite is null then
    return new;
  end if;

  select (
    (select count(*) from public.atendimento a
       join public.guiche g on g.id = a.guiche_id
       join public.unidade u on u.id = g.unidade_id
      where u.clinica_id = v_clinica_id and a.data_fila >= v_inicio and a.deleted_at is null)
    +
    (select count(*) from public.consulta c
       join public.unidade u on u.id = c.unidade_id
      where u.clinica_id = v_clinica_id and c.data_fila >= v_inicio and c.deleted_at is null)
  ) into v_qtd;

  if v_qtd >= v_limite then
    raise exception 'Volume mensal do plano atingido (máximo de % tickets).', v_limite
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger trg_atendimento_limite_tickets before insert on public.atendimento
  for each row execute function public.fn_validar_limite_tickets();
create trigger trg_consulta_limite_tickets before insert on public.consulta
  for each row execute function public.fn_validar_limite_tickets();

-- -----------------------------------------------------------------------------
-- Geração automática da senha (ticket) de cada fila
-- -----------------------------------------------------------------------------
create or replace function public.fn_gerar_senha_atendimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text;
  v_encaminha boolean;
  v_numero integer;
begin
  select upper(g.codigo), g.encaminha_para_consulta
    into v_codigo, v_encaminha
    from public.guiche g
   where g.id = new.guiche_id;

  if coalesce(v_encaminha, false) then
    new.encaminhar_para_consulta := true;
  end if;

  if new.numero_senha is null then
    perform pg_advisory_xact_lock(hashtextextended(new.guiche_id::text || new.data_fila::text, 0));

    select coalesce(max(numero_senha), 0) + 1 into v_numero
      from public.atendimento
     where guiche_id = new.guiche_id and data_fila = new.data_fila;

    new.numero_senha := v_numero;
    new.senha := coalesce(v_codigo, 'ATD') || '-' || lpad(v_numero::text, 3, '0');
  end if;

  return new;
end;
$$;

create or replace function public.fn_gerar_senha_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text;
  v_numero integer;
begin
  if new.numero_senha is not null then
    return new;
  end if;

  select upper(coalesce(p.codigo, 'CON')) into v_codigo
    from public.profissional p
   where p.id = new.profissional_id;

  perform pg_advisory_xact_lock(hashtextextended(new.profissional_id::text || new.data_fila::text, 0));

  select coalesce(max(numero_senha), 0) + 1 into v_numero
    from public.consulta
   where profissional_id = new.profissional_id and data_fila = new.data_fila;

  new.numero_senha := v_numero;
  new.senha := coalesce(v_codigo, 'CON') || '-' || lpad(v_numero::text, 3, '0');

  return new;
end;
$$;

create trigger trg_atendimento_senha before insert on public.atendimento
  for each row execute function public.fn_gerar_senha_atendimento();
create trigger trg_consulta_senha before insert on public.consulta
  for each row execute function public.fn_gerar_senha_consulta();

-- -----------------------------------------------------------------------------
-- Máquina de estados e carimbos de tempo das filas
-- -----------------------------------------------------------------------------
create or replace function public.fn_status_fila()
returns trigger
language plpgsql
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not public.fn_transicao_valida(old.status, new.status) then
    raise exception 'Transição de status inválida na fila: % -> %.', old.status, new.status
      using errcode = 'check_violation',
            hint = 'Verifique o diagrama de estados: aguardando, chamado, em_atendimento, ausente, finalizado, cancelado.';
  end if;

  if new.status = 'chamado' then
    new.chamado_em := now();
    new.atendido_em := null;
    new.finalizado_em := null;

  elsif new.status = 'em_atendimento' then
    new.atendido_em := coalesce(new.atendido_em, now());
    new.finalizado_em := null;

  elsif new.status in ('finalizado', 'cancelado') then
    new.finalizado_em := coalesce(new.finalizado_em, now());

  elsif new.status = 'ausente' then
    new.finalizado_em := null;

  elsif new.status = 'aguardando' then
    -- Retorno ao fim da fila: zera os carimbos e renova a hora de entrada
    new.entrada_fila := now();
    new.chamado_em := null;
    new.atendido_em := null;
    new.finalizado_em := null;
  end if;

  return new;
end;
$$;

create trigger trg_atendimento_status before update of status on public.atendimento
  for each row execute function public.fn_status_fila();
create trigger trg_consulta_status before update of status on public.consulta
  for each row execute function public.fn_status_fila();

-- -----------------------------------------------------------------------------
-- Validações de integridade das filas
-- -----------------------------------------------------------------------------
create or replace function public.fn_validar_atendimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unidade_id uuid;
  v_disponivel boolean;
begin
  select u.id, (g.ativo and u.ativa and c.ativa and g.deleted_at is null and u.deleted_at is null and c.deleted_at is null)
    into v_unidade_id, v_disponivel
    from public.guiche g
    join public.unidade u on u.id = g.unidade_id
    join public.clinica c on c.id = u.clinica_id
   where g.id = new.guiche_id;

  if tg_op = 'INSERT' and not coalesce(v_disponivel, false) then
    raise exception 'Este guichê não está disponível para novas entradas na fila.'
      using errcode = 'check_violation';
  end if;

  if new.proximo_profissional_id is not null
     and (tg_op = 'INSERT' or new.proximo_profissional_id is distinct from old.proximo_profissional_id) then
    if not exists (
      select 1
        from public.locacao l
       where l.profissional_id = new.proximo_profissional_id
         and l.unidade_id = v_unidade_id
         and l.ativa
         and l.deleted_at is null
         and l.data_inicio <= current_date
         and (l.data_fim is null or l.data_fim >= current_date)
    ) then
      raise exception 'O profissional escolhido não possui locação vigente nesta unidade.'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.fn_validar_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.profissional_id is distinct from old.profissional_id
     or new.unidade_id is distinct from old.unidade_id then
    if not exists (
      select 1
        from public.locacao l
       where l.profissional_id = new.profissional_id
         and l.unidade_id = new.unidade_id
         and l.ativa
         and l.deleted_at is null
         and l.data_inicio <= current_date
         and (l.data_fim is null or l.data_fim >= current_date)
    ) then
      raise exception 'O profissional não possui locação vigente na unidade informada.'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_atendimento_validacao before insert or update on public.atendimento
  for each row execute function public.fn_validar_atendimento();
create trigger trg_consulta_validacao before insert or update on public.consulta
  for each row execute function public.fn_validar_consulta();

-- -----------------------------------------------------------------------------
-- Recálculo automático das posições das filas
-- -----------------------------------------------------------------------------
create or replace function public.fn_recalcular_fila()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_escopo_id uuid;
  v_data      date;
begin
  if coalesce(current_setting('app.recalculando_fila', true), '0') = '1' then
    return null;
  end if;

  perform set_config('app.recalculando_fila', '1', true);

  if tg_table_name = 'atendimento' then
    v_escopo_id := new.guiche_id;
    v_data := new.data_fila;
    perform public.fn_recalcular_posicoes_atendimento(v_escopo_id, v_data);

    if tg_op = 'UPDATE' and old.guiche_id is distinct from new.guiche_id then
      perform public.fn_recalcular_posicoes_atendimento(old.guiche_id, old.data_fila);
    end if;
  else
    v_escopo_id := new.profissional_id;
    v_data := new.data_fila;
    perform public.fn_recalcular_posicoes_consulta(v_escopo_id, v_data);

    if tg_op = 'UPDATE' and old.profissional_id is distinct from new.profissional_id then
      perform public.fn_recalcular_posicoes_consulta(old.profissional_id, old.data_fila);
    end if;
  end if;

  perform set_config('app.recalculando_fila', '0', true);

  return null;
end;
$$;

create trigger trg_atendimento_posicao
  after insert or update of status, prioridade, entrada_fila, guiche_id, deleted_at on public.atendimento
  for each row execute function public.fn_recalcular_fila();

create trigger trg_consulta_posicao
  after insert or update of status, prioridade, entrada_fila, profissional_id, deleted_at on public.consulta
  for each row execute function public.fn_recalcular_fila();

-- -----------------------------------------------------------------------------
-- AUTOMAÇÃO PRINCIPAL
-- Ao atingir o status final da Fila 1 (atendimento finalizado), o paciente é
-- inserido automaticamente na Fila 2 (consulta) com o status inicial aguardando.
-- -----------------------------------------------------------------------------
create or replace function public.fn_encaminhar_para_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unidade_id     uuid;
  v_encaminha      boolean;
  v_profissional   uuid;
  v_consulta_id    uuid;
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
  if not exists (
    select 1
      from public.locacao l
     where l.profissional_id = v_profissional
       and l.unidade_id = v_unidade_id
       and l.ativa
       and l.deleted_at is null
       and l.data_inicio <= current_date
       and (l.data_fim is null or l.data_fim >= current_date)
  ) then
    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'atendimento', new.id, public.fn_clinica_do_guiche(new.guiche_id), old.status, new.status, true,
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

  -- O paciente já estava na fila deste profissional: reaproveita o ticket existente
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

comment on function public.fn_encaminhar_para_consulta is 'Encaminhamento automático da Fila Virtual 1 para a Fila Virtual 2 ao finalizar o atendimento no guichê.';

create trigger trg_atendimento_encaminhar
  after update of status on public.atendimento
  for each row execute function public.fn_encaminhar_para_consulta();

-- -----------------------------------------------------------------------------
-- Histórico append-only das transições de status
-- -----------------------------------------------------------------------------
create or replace function public.fn_log_fila_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinica_id uuid;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  if tg_table_name = 'atendimento' then
    v_clinica_id := public.fn_clinica_do_guiche(new.guiche_id);

    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'atendimento', new.id, v_clinica_id,
      case when tg_op = 'UPDATE' then old.status end, new.status,
      pg_trigger_depth() > 1,
      jsonb_build_object('guiche_id', new.guiche_id, 'senha', new.senha, 'posicao', new.posicao),
      auth.uid()
    );
  else
    select u.clinica_id into v_clinica_id from public.unidade u where u.id = new.unidade_id;

    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'consulta', new.id, v_clinica_id,
      case when tg_op = 'UPDATE' then old.status end, new.status,
      pg_trigger_depth() > 1,
      jsonb_build_object('profissional_id', new.profissional_id, 'senha', new.senha, 'posicao', new.posicao),
      auth.uid()
    );
  end if;

  return null;
end;
$$;

create trigger trg_atendimento_evento after insert or update of status on public.atendimento
  for each row execute function public.fn_log_fila_evento();
create trigger trg_consulta_evento after insert or update of status on public.consulta
  for each row execute function public.fn_log_fila_evento();

-- Garante a imutabilidade da trilha de eventos
create or replace function public.fn_bloquear_alteracao()
returns trigger
language plpgsql
as $$
begin
  raise exception 'A tabela % é somente de inserção.', tg_table_name
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger trg_fila_evento_imutavel before update or delete on public.fila_evento
  for each row execute function public.fn_bloquear_alteracao();
