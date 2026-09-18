-- =============================================================================
-- Aguard.ai — 13. Fila Virtual 1 compartilhada por unidade
--
-- O paciente passa a entrar na fila da UNIDADE, não na fila de um guichê.
-- O guichê deixa de ser dono da fila e passa a registrar quem chamou o ticket:
-- o primeiro guichê que fica livre chama o próximo da fila da unidade.
--
-- Aplicar depois de 20260828001200_papel_unidade.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Views são recriadas no fim; saem primeiro para liberar as colunas
-- -----------------------------------------------------------------------------
drop view if exists public.vw_uso_plano;
drop view if exists public.vw_dashboard_unidade;
drop view if exists public.vw_dashboard_clinica;
drop view if exists public.vw_metricas_diarias;
drop view if exists public.vw_relatorio_tickets;
drop view if exists public.vw_fila_unificada;
drop view if exists public.vw_fila_atendimento_publica;

-- -----------------------------------------------------------------------------
-- 2. A configuração da fila migra do guichê para a unidade
-- -----------------------------------------------------------------------------
alter table public.unidade
  add column if not exists codigo                  text,
  add column if not exists tipo_servico            text     not null default 'Recepção',
  add column if not exists duracao_media_minutos   smallint not null default 10,
  add column if not exists encaminha_para_consulta boolean  not null default false,
  add column if not exists profissional_padrao_id  uuid references public.profissional (id) on delete set null;

alter table public.unidade disable trigger user;

-- Herda a configuração do guichê de menor código da unidade
with base as (
  select distinct on (g.unidade_id)
         g.unidade_id,
         g.codigo,
         g.tipo_servico,
         g.duracao_media_minutos,
         g.profissional_padrao_id
    from public.guiche g
   where g.deleted_at is null
   order by g.unidade_id, g.codigo
),
encaminhamento as (
  select g.unidade_id, bool_or(g.encaminha_para_consulta) as encaminha
    from public.guiche g
   where g.deleted_at is null
   group by g.unidade_id
)
update public.unidade u
   set codigo                  = coalesce(u.codigo, b.codigo),
       tipo_servico            = coalesce(b.tipo_servico, u.tipo_servico),
       duracao_media_minutos   = coalesce(b.duracao_media_minutos, u.duracao_media_minutos),
       profissional_padrao_id  = coalesce(b.profissional_padrao_id, u.profissional_padrao_id),
       encaminha_para_consulta = coalesce(e.encaminha, false)
  from base b
  left join encaminhamento e on e.unidade_id = b.unidade_id
 where u.id = b.unidade_id;

-- O código vira prefixo da senha: precisa ser único dentro da clínica
update public.unidade u
   set codigo = null
  from (
    select un.id,
           row_number() over (partition by un.clinica_id, upper(un.codigo)
                              order by un.created_at, un.id) as ordem
      from public.unidade un
     where un.codigo is not null
  ) d
 where d.id = u.id and d.ordem > 1;

update public.unidade u
   set codigo = 'U' || lpad(x.n::text, 2, '0')
  from (
    select un.id,
           row_number() over (partition by un.clinica_id order by un.created_at, un.id) as n
      from public.unidade un
  ) x
 where u.id = x.id
   and (u.codigo is null or btrim(u.codigo) = '');

alter table public.unidade enable trigger user;

alter table public.unidade
  alter column codigo set not null,
  add constraint unidade_codigo_formato   check (codigo ~ '^[A-Z0-9]{2,6}$'),
  add constraint unidade_tipo_servico_ok  check (length(btrim(tipo_servico)) between 1 and 60),
  add constraint unidade_duracao_valida   check (duracao_media_minutos between 1 and 480);

create unique index unidade_codigo_unico_idx
  on public.unidade (clinica_id, upper(codigo)) where deleted_at is null;

create index unidade_profissional_padrao_idx
  on public.unidade (profissional_padrao_id) where profissional_padrao_id is not null;

comment on column public.unidade.codigo is 'Prefixo usado na senha da fila de recepção (ex.: REC-042).';
comment on column public.unidade.encaminha_para_consulta is 'Quando verdadeiro, todo atendimento finalizado nesta unidade é encaminhado automaticamente para a fila de consulta.';
comment on column public.unidade.profissional_padrao_id is 'Profissional usado no encaminhamento automático quando o operador não escolhe outro.';

-- -----------------------------------------------------------------------------
-- 3. O ticket da Fila 1 passa a pertencer à unidade
-- -----------------------------------------------------------------------------
alter table public.atendimento
  add column if not exists unidade_id uuid references public.unidade (id) on delete cascade;

alter table public.atendimento disable trigger user;

update public.atendimento a
   set unidade_id = g.unidade_id
  from public.guiche g
 where g.id = a.guiche_id
   and a.unidade_id is null;

alter table public.atendimento alter column unidade_id set not null;

alter table public.atendimento drop constraint if exists atendimento_guiche_id_fkey;
alter table public.atendimento alter column guiche_id drop not null;
alter table public.atendimento
  add constraint atendimento_guiche_id_fkey
  foreign key (guiche_id) references public.guiche (id) on delete set null;

-- Quem ainda aguarda não tem guichê: será chamado pelo primeiro que ficar livre
update public.atendimento
   set guiche_id = null
 where status = 'aguardando';

-- A senha era numerada por guichê; passa a ser numerada por unidade e por dia
with renumerada as (
  select a.id,
         a.unidade_id,
         row_number() over (partition by a.unidade_id, a.data_fila
                            order by a.entrada_fila, a.id) as n
    from public.atendimento a
)
update public.atendimento a
   set numero_senha = r.n,
       senha        = upper(u.codigo) || '-' || lpad(r.n::text, 3, '0')
  from renumerada r
  join public.unidade u on u.id = r.unidade_id
 where a.id = r.id;

alter table public.atendimento enable trigger user;

comment on table public.atendimento is 'Fila Virtual 1: fila única da unidade (recepção, triagem, coleta). Uma linha equivale a um ticket.';
comment on column public.atendimento.unidade_id is 'Unidade dona da fila. O paciente entra aqui, não em um guichê específico.';
comment on column public.atendimento.guiche_id is 'Guichê que chamou o ticket. Nulo enquanto o paciente aguarda.';

-- -----------------------------------------------------------------------------
-- 4. Índices da fila migram de guichê para unidade
-- -----------------------------------------------------------------------------
drop index if exists public.atendimento_fila_idx;
drop index if exists public.atendimento_ativos_idx;
drop index if exists public.atendimento_guiche_data_idx;
drop index if exists public.atendimento_senha_unica_idx;
drop index if exists public.atendimento_paciente_ativo_idx;
drop index if exists public.guiche_profissional_padrao_idx;

create index atendimento_fila_idx
  on public.atendimento (unidade_id, data_fila, prioridade desc, entrada_fila)
  where status = 'aguardando'::public.status_fila and deleted_at is null;

create index atendimento_ativos_idx
  on public.atendimento (unidade_id, status, data_fila)
  where status in ('aguardando'::public.status_fila, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila)
    and deleted_at is null;

create index atendimento_unidade_data_idx on public.atendimento (unidade_id, data_fila);

create index atendimento_guiche_idx on public.atendimento (guiche_id)
  where guiche_id is not null;

create unique index atendimento_senha_unica_idx
  on public.atendimento (unidade_id, data_fila, numero_senha);

-- Impede que o mesmo paciente ocupe duas vagas ativas na fila da mesma unidade
create unique index atendimento_paciente_ativo_idx
  on public.atendimento (unidade_id, paciente_id)
  where status in ('aguardando'::public.status_fila, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila)
    and deleted_at is null;

-- -----------------------------------------------------------------------------
-- 5. Funções de apoio da fila
-- -----------------------------------------------------------------------------
drop function if exists public.fn_recalcular_posicoes_atendimento(uuid, date);

-- Renumera a fila de atendimento de uma unidade em uma data
create function public.fn_recalcular_posicoes_atendimento(p_unidade_id uuid, p_data date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ordenada as (
    select id, row_number() over (order by prioridade desc, entrada_fila, id) as pos
      from public.atendimento
     where unidade_id = p_unidade_id
       and data_fila = p_data
       and status = 'aguardando'
       and deleted_at is null
  )
  update public.atendimento a
     set posicao = o.pos
    from ordenada o
   where a.id = o.id
     and a.posicao is distinct from o.pos;

  update public.atendimento
     set posicao = 0
   where unidade_id = p_unidade_id
     and data_fila = p_data
     and status in ('chamado', 'em_atendimento')
     and deleted_at is null
     and posicao is distinct from 0;

  update public.atendimento
     set posicao = null
   where unidade_id = p_unidade_id
     and data_fila = p_data
     and (status in ('ausente', 'finalizado', 'cancelado') or deleted_at is not null)
     and posicao is not null;
end;
$$;

-- Guichês que podem chamar a fila da unidade agora
create or replace function public.fn_guiches_ativos(p_unidade_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(count(*), 1)::int
    from public.guiche g
   where g.unidade_id = p_unidade_id
     and g.ativo
     and g.deleted_at is null;
$$;

-- Tempo médio de atendimento da unidade nos últimos 30 dias, com fallback no cadastro
create or replace function public.fn_duracao_media_unidade(p_unidade_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select round(avg(extract(epoch from (a.finalizado_em - a.atendido_em)) / 60)::numeric, 1)
       from public.atendimento a
      where a.unidade_id = p_unidade_id
        and a.status = 'finalizado'
        and a.atendido_em is not null
        and a.finalizado_em is not null
        and a.finalizado_em >= now() - interval '30 days'
        and a.deleted_at is null),
    (select u.duracao_media_minutos from public.unidade u where u.id = p_unidade_id),
    10
  );
$$;

-- Estimativa de espera em minutos a partir da posição na fila.
-- Na Fila 1 a fila é única e vários guichês a consomem em paralelo.
create or replace function public.fn_estimativa_espera_minutos(
  p_tipo      public.tipo_fila,
  p_escopo_id uuid,
  p_posicao   integer
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_posicao is null then null
    when p_tipo = 'atendimento' then
      ceil(
        greatest(p_posicao, 0) * public.fn_duracao_media_unidade(p_escopo_id)
        / public.fn_guiches_ativos(p_escopo_id)
      )::int
    else ceil(greatest(p_posicao, 0) * public.fn_duracao_media_profissional(p_escopo_id))::int
  end;
$$;

comment on function public.fn_estimativa_espera_minutos is 'Na Fila 1 o escopo é a unidade e a espera é dividida pelo número de guichês ativos, que atendem a mesma fila em paralelo.';

-- -----------------------------------------------------------------------------
-- 6. Automações da fila
-- -----------------------------------------------------------------------------
create or replace function public.fn_gerar_senha_atendimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo    text;
  v_encaminha boolean;
  v_numero    integer;
begin
  select upper(u.codigo), u.encaminha_para_consulta
    into v_codigo, v_encaminha
    from public.unidade u
   where u.id = new.unidade_id;

  if coalesce(v_encaminha, false) then
    new.encaminhar_para_consulta := true;
  end if;

  if new.numero_senha is null then
    perform pg_advisory_xact_lock(hashtextextended(new.unidade_id::text || new.data_fila::text, 0));

    select coalesce(max(numero_senha), 0) + 1 into v_numero
      from public.atendimento
     where unidade_id = new.unidade_id and data_fila = new.data_fila;

    new.numero_senha := v_numero;
    new.senha := coalesce(v_codigo, 'ATD') || '-' || lpad(v_numero::text, 3, '0');
  end if;

  return new;
end;
$$;

create or replace function public.fn_validar_atendimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_disponivel boolean;
begin
  select (u.ativa and c.ativa and u.deleted_at is null and c.deleted_at is null)
    into v_disponivel
    from public.unidade u
    join public.clinica c on c.id = u.clinica_id
   where u.id = new.unidade_id;

  if tg_op = 'INSERT' and not coalesce(v_disponivel, false) then
    raise exception 'Esta unidade não está disponível para novas entradas na fila.'
      using errcode = 'check_violation';
  end if;

  -- O guichê que chamou precisa pertencer à unidade dona da fila
  if new.guiche_id is not null
     and (tg_op = 'INSERT' or new.guiche_id is distinct from old.guiche_id) then
    if not exists (
      select 1
        from public.guiche g
       where g.id = new.guiche_id
         and g.unidade_id = new.unidade_id
         and g.ativo
         and g.deleted_at is null
    ) then
      raise exception 'O guichê informado não pertence a esta unidade ou está inativo.'
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  if new.proximo_profissional_id is not null
     and (tg_op = 'INSERT' or new.proximo_profissional_id is distinct from old.proximo_profissional_id) then
    if not exists (
      select 1
        from public.locacao l
       where l.profissional_id = new.proximo_profissional_id
         and l.unidade_id = new.unidade_id
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

create or replace function public.fn_recalcular_fila()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.recalculando_fila', true), '0') = '1' then
    return null;
  end if;

  perform set_config('app.recalculando_fila', '1', true);

  if tg_table_name = 'atendimento' then
    perform public.fn_recalcular_posicoes_atendimento(new.unidade_id, new.data_fila);

    if tg_op = 'UPDATE' and old.unidade_id is distinct from new.unidade_id then
      perform public.fn_recalcular_posicoes_atendimento(old.unidade_id, old.data_fila);
    end if;
  else
    perform public.fn_recalcular_posicoes_consulta(new.profissional_id, new.data_fila);

    if tg_op = 'UPDATE' and old.profissional_id is distinct from new.profissional_id then
      perform public.fn_recalcular_posicoes_consulta(old.profissional_id, old.data_fila);
    end if;
  end if;

  perform set_config('app.recalculando_fila', '0', true);

  return null;
end;
$$;

drop trigger if exists trg_atendimento_posicao on public.atendimento;
create trigger trg_atendimento_posicao
  after insert or update of status, prioridade, entrada_fila, unidade_id, deleted_at on public.atendimento
  for each row execute function public.fn_recalcular_fila();

-- Limite mensal de tickets do plano, agora resolvido pela unidade do ticket
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
  select u.clinica_id into v_clinica_id
    from public.unidade u
   where u.id = new.unidade_id;

  select l.max_tickets_mes into v_limite
    from public.clinica c
    join public.plano_limite l on l.plano = c.plano
   where c.id = v_clinica_id;

  if v_limite is null then
    return new;
  end if;

  select (
    (select count(*) from public.atendimento a
       join public.unidade u on u.id = a.unidade_id
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

-- AUTOMAÇÃO PRINCIPAL: ao finalizar a Fila 1, o paciente entra na Fila 2
create or replace function public.fn_encaminhar_para_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinica_id   uuid;
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

  select u.clinica_id,
         (new.encaminhar_para_consulta or u.encaminha_para_consulta),
         coalesce(new.proximo_profissional_id, u.profissional_padrao_id)
    into v_clinica_id, v_encaminha, v_profissional
    from public.unidade u
   where u.id = new.unidade_id;

  if not coalesce(v_encaminha, false) or v_profissional is null then
    return null;
  end if;

  -- Sem locação vigente o encaminhamento é apenas registrado, nunca bloqueia a fila
  if not exists (
    select 1
      from public.locacao l
     where l.profissional_id = v_profissional
       and l.unidade_id = new.unidade_id
       and l.ativa
       and l.deleted_at is null
       and l.data_inicio <= current_date
       and (l.data_fim is null or l.data_fim >= current_date)
  ) then
    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, unidade_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'atendimento', new.id, v_clinica_id, new.unidade_id, old.status, new.status, true,
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
    v_profissional, new.paciente_id, new.unidade_id, new.id,
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

comment on function public.fn_encaminhar_para_consulta is 'Encaminhamento automático da Fila Virtual 1 para a Fila Virtual 2 ao finalizar o atendimento na unidade.';

-- Histórico append-only das transições de status
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

  select u.clinica_id into v_clinica_id
    from public.unidade u
   where u.id = new.unidade_id;

  if tg_table_name = 'atendimento' then
    insert into public.fila_evento (tipo_fila, ticket_id, clinica_id, unidade_id, status_de, status_para, automatico, detalhes, created_by)
    values (
      'atendimento', new.id, v_clinica_id, new.unidade_id,
      case when tg_op = 'UPDATE' then old.status end, new.status,
      pg_trigger_depth() > 1,
      jsonb_build_object('guiche_id', new.guiche_id, 'senha', new.senha, 'posicao', new.posicao),
      auth.uid()
    );
  else
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

-- Broadcast anonimizado: o tópico específico (guichê ou profissional) e o
-- tópico da unidade, que carrega as transições das duas filas
create or replace function public.fn_broadcast_fila()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_topico  text;
  v_payload jsonb;
begin
  if to_regprocedure('realtime.send(jsonb, text, text, boolean)') is null then
    return null;
  end if;

  if tg_table_name = 'atendimento' then
    v_topico := 'atendimento:unidade:' || new.unidade_id::text;
    v_payload := jsonb_build_object(
      'ticket_id', new.id,
      'senha', new.senha,
      'status', new.status,
      'posicao', new.posicao,
      'prioridade', new.prioridade,
      'unidade_id', new.unidade_id,
      'guiche_id', new.guiche_id,
      'consulta_gerada_id', new.consulta_gerada_id,
      'atualizado_em', new.updated_at
    );
  else
    v_topico := 'consulta:profissional:' || new.profissional_id::text;
    v_payload := jsonb_build_object(
      'ticket_id', new.id,
      'senha', new.senha,
      'status', new.status,
      'posicao', new.posicao,
      'prioridade', new.prioridade,
      'profissional_id', new.profissional_id,
      'unidade_id', new.unidade_id,
      'atualizado_em', new.updated_at
    );
  end if;

  perform realtime.send(v_payload, lower(tg_op), v_topico, false);

  -- Tópico único da unidade, ouvido pelo painel da sala de espera: ele junta as
  -- duas filas e precisa das transições das duas
  perform realtime.send(
    v_payload,
    lower(tg_op),
    'fila:unidade:' || new.unidade_id::text,
    false
  );

  return null;
end;
$$;

drop trigger if exists trg_atendimento_broadcast on public.atendimento;
create trigger trg_atendimento_broadcast
  after insert or update of status, posicao, guiche_id, consulta_gerada_id on public.atendimento
  for each row execute function public.fn_broadcast_fila();

-- -----------------------------------------------------------------------------
-- 7. RPC das rotas públicas e do painel
-- -----------------------------------------------------------------------------
drop function if exists public.fn_entrar_fila_atendimento(uuid, text, text, text, public.prioridade_fila);

-- Entrada do paciente na fila da unidade (Fila Virtual 1)
create function public.fn_entrar_fila_atendimento(
  p_unidade_id uuid,
  p_nome       text,
  p_telefone   text,
  p_email      text default null,
  p_prioridade public.prioridade_fila default 'normal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id uuid;
  v_ticket_id   uuid;
  v_ticket      public.atendimento%rowtype;
begin
  v_paciente_id := public.fn_upsert_paciente(p_nome, p_telefone, p_email);

  select * into v_ticket
    from public.atendimento
   where unidade_id = p_unidade_id
     and paciente_id = v_paciente_id
     and status in ('aguardando', 'chamado', 'em_atendimento')
     and deleted_at is null
   limit 1;

  if not found then
    insert into public.atendimento (unidade_id, paciente_id, prioridade)
    values (p_unidade_id, v_paciente_id, p_prioridade)
    returning id into v_ticket_id;
  else
    v_ticket_id := v_ticket.id;
  end if;

  return public.fn_acompanhar_ticket(v_ticket_id);
end;
$$;

comment on function public.fn_entrar_fila_atendimento is 'Fila única da unidade: o paciente não escolhe guichê, é chamado pelo primeiro que ficar livre.';

-- Consulta pública da posição do ticket, em qualquer uma das duas filas
create or replace function public.fn_acompanhar_ticket(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_resultado jsonb;
begin
  select jsonb_build_object(
           'tipo_fila', 'atendimento',
           'ticket_id', a.id,
           'senha', a.senha,
           'status', a.status,
           'prioridade', a.prioridade,
           'posicao', a.posicao,
           'estimativa_minutos', public.fn_estimativa_espera_minutos('atendimento', a.unidade_id, a.posicao),
           'aguardando_na_frente', greatest(coalesce(a.posicao, 1) - 1, 0),
           'local', u.nome,
           'tipo_servico', u.tipo_servico,
           'unidade', u.nome,
           'guiche', g.nome,
           'clinica', c.nome,
           'paciente', public.fn_mascarar_nome(pa.nome),
           'entrada_fila', a.entrada_fila,
           'chamado_em', a.chamado_em,
           'proximo_ticket_id', a.consulta_gerada_id
         )
    into v_resultado
    from public.atendimento a
    join public.unidade u        on u.id = a.unidade_id
    join public.clinica c        on c.id = u.clinica_id
    join public.paciente pa      on pa.id = a.paciente_id
    left join public.guiche g    on g.id = a.guiche_id
   where a.id = p_ticket_id and a.deleted_at is null;

  if v_resultado is not null then
    return v_resultado;
  end if;

  select jsonb_build_object(
           'tipo_fila', 'consulta',
           'ticket_id', co.id,
           'senha', co.senha,
           'status', co.status,
           'prioridade', co.prioridade,
           'posicao', co.posicao,
           'estimativa_minutos', public.fn_estimativa_espera_minutos('consulta', co.profissional_id, co.posicao),
           'aguardando_na_frente', greatest(coalesce(co.posicao, 1) - 1, 0),
           'local', pr.nome,
           'tipo_servico', pr.especialidade,
           'unidade', u.nome,
           'guiche', null,
           'clinica', c.nome,
           'paciente', public.fn_mascarar_nome(pa.nome),
           'entrada_fila', co.entrada_fila,
           'chamado_em', co.chamado_em,
           'tipo_consulta', co.tipo_consulta,
           'proximo_ticket_id', null
         )
    into v_resultado
    from public.consulta co
    join public.profissional pr on pr.id = co.profissional_id
    join public.unidade u       on u.id = co.unidade_id
    join public.clinica c       on c.id = u.clinica_id
    join public.paciente pa     on pa.id = co.paciente_id
   where co.id = p_ticket_id and co.deleted_at is null;

  if v_resultado is null then
    raise exception 'Ticket não encontrado.' using errcode = 'no_data_found';
  end if;

  return v_resultado;
end;
$$;

-- O guichê chama o próximo da fila da unidade e assume o ticket
create or replace function public.fn_chamar_proximo_atendimento(p_guiche_id uuid)
returns public.atendimento
language plpgsql
set search_path = public
as $$
declare
  v_unidade_id uuid;
  v_ticket     public.atendimento;
begin
  select g.unidade_id into v_unidade_id
    from public.guiche g
   where g.id = p_guiche_id
     and g.ativo
     and g.deleted_at is null;

  if v_unidade_id is null then
    raise exception 'Guichê não encontrado ou inativo.' using errcode = 'no_data_found';
  end if;

  select * into v_ticket
    from public.atendimento
   where unidade_id = v_unidade_id
     and data_fila = current_date
     and status = 'aguardando'
     and deleted_at is null
   order by prioridade desc, entrada_fila, id
   limit 1
     for update skip locked;

  if not found then
    return null;
  end if;

  update public.atendimento
     set status = 'chamado',
         guiche_id = p_guiche_id
   where id = v_ticket.id
   returning * into v_ticket;

  return v_ticket;
end;
$$;

comment on function public.fn_chamar_proximo_atendimento is 'Retira o próximo ticket da fila compartilhada da unidade e registra o guichê que o chamou.';

-- -----------------------------------------------------------------------------
-- 8. RLS da Fila 1 passa a olhar a unidade do ticket
-- -----------------------------------------------------------------------------
drop policy if exists "atendimento_select_gestor" on public.atendimento;
drop policy if exists "atendimento_insert_gestor" on public.atendimento;
drop policy if exists "atendimento_update_gestor" on public.atendimento;
drop policy if exists "atendimento_delete_gestor" on public.atendimento;

-- "in (select ...)" em vez de função por linha: a lista de unidades é
-- resolvida uma vez por consulta
create policy "atendimento_select_gestor" on public.atendimento
  for select to authenticated
  using (unidade_id in (select public.fn_unidades_gerenciadas()));

create policy "atendimento_insert_gestor" on public.atendimento
  for insert to authenticated
  with check (unidade_id in (select public.fn_unidades_gerenciadas()));

create policy "atendimento_update_gestor" on public.atendimento
  for update to authenticated
  using (unidade_id in (select public.fn_unidades_gerenciadas()))
  with check (unidade_id in (select public.fn_unidades_gerenciadas()));

create policy "atendimento_delete_gestor" on public.atendimento
  for delete to authenticated
  using (unidade_id in (select public.fn_unidades_gerenciadas()));

-- -----------------------------------------------------------------------------
-- 9. Views recriadas sobre a fila da unidade
-- -----------------------------------------------------------------------------
create view public.vw_fila_atendimento_publica
with (security_barrier = true) as
select
  a.id                                   as ticket_id,
  a.unidade_id,
  u.nome                                 as unidade_nome,
  u.tipo_servico,
  a.guiche_id,
  g.nome                                 as guiche_nome,
  a.senha,
  public.fn_mascarar_nome(p.nome)        as paciente,
  a.status,
  a.prioridade,
  a.posicao,
  a.entrada_fila,
  a.chamado_em,
  public.fn_estimativa_espera_minutos('atendimento', a.unidade_id, a.posicao) as estimativa_minutos
from public.atendimento a
join public.unidade u     on u.id = a.unidade_id
join public.paciente p    on p.id = a.paciente_id
left join public.guiche g on g.id = a.guiche_id
where a.deleted_at is null
  and a.data_fila = current_date
  and a.status in ('aguardando', 'chamado', 'em_atendimento');

comment on view public.vw_fila_atendimento_publica is 'Fila do dia por unidade para painéis de sala de espera. O guichê aparece só depois da chamada. Não expõe telefone, e-mail nem sobrenome completo.';

create view public.vw_fila_unificada
with (security_invoker = true, security_barrier = true) as
select
  'consulta'::public.tipo_fila as tipo_fila,
  c.id                         as ticket_id,
  c.senha,
  c.status,
  c.prioridade,
  c.posicao,
  c.entrada_fila,
  c.chamado_em,
  c.atendido_em,
  c.tipo_consulta,
  c.profissional_id,
  c.unidade_id,
  null::uuid                   as guiche_id,
  pr.nome                      as origem,
  p.id                         as paciente_id,
  p.nome                       as paciente_nome,
  p.telefone                   as paciente_telefone,
  u.clinica_id
from public.consulta c
join public.profissional pr on pr.id = c.profissional_id
join public.unidade u       on u.id = c.unidade_id
join public.paciente p      on p.id = c.paciente_id
where c.deleted_at is null
  and c.status in ('aguardando', 'chamado', 'em_atendimento')

union all

select
  'atendimento'::public.tipo_fila,
  a.id,
  a.senha,
  a.status,
  a.prioridade,
  a.posicao,
  a.entrada_fila,
  a.chamado_em,
  a.atendido_em,
  a.tipo_consulta,
  a.proximo_profissional_id,
  a.unidade_id,
  a.guiche_id,
  u.nome,
  p.id,
  p.nome,
  p.telefone,
  u.clinica_id
from public.atendimento a
join public.unidade u  on u.id = a.unidade_id
join public.paciente p on p.id = a.paciente_id
where a.deleted_at is null
  and a.status in ('aguardando', 'chamado', 'em_atendimento');

comment on view public.vw_fila_unificada is
  'Combina as duas filas dentro do escopo do usuário. Gestores de clínica e de unidade veem atendimentos e consultas; o profissional vê apenas as suas consultas, porque o RLS da Fila 1 não o alcança.';

create view public.vw_relatorio_tickets
with (security_invoker = true, security_barrier = true) as
select
  'atendimento'::public.tipo_fila as tipo_fila,
  a.id                            as ticket_id,
  u.clinica_id,
  a.unidade_id,
  a.guiche_id,
  a.proximo_profissional_id       as profissional_id,
  a.status,
  a.prioridade,
  a.data_fila,
  a.entrada_fila,
  a.finalizado_em,
  round(extract(epoch from (coalesce(a.atendido_em, a.finalizado_em) - a.entrada_fila)) / 60.0, 1) as espera_minutos,
  round(extract(epoch from (a.finalizado_em - a.atendido_em)) / 60.0, 1)                           as duracao_minutos,
  (a.consulta_gerada_id is not null)                                                               as gerou_consulta
from public.atendimento a
join public.unidade u on u.id = a.unidade_id
where a.deleted_at is null

union all

select
  'consulta'::public.tipo_fila,
  c.id,
  u.clinica_id,
  c.unidade_id,
  null::uuid,
  c.profissional_id,
  c.status,
  c.prioridade,
  c.data_fila,
  c.entrada_fila,
  c.finalizado_em,
  round(extract(epoch from (coalesce(c.atendido_em, c.finalizado_em) - c.entrada_fila)) / 60.0, 1),
  round(extract(epoch from (c.finalizado_em - c.atendido_em)) / 60.0, 1),
  false
from public.consulta c
join public.unidade u on u.id = c.unidade_id
where c.deleted_at is null;

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
  round(avg(m.duracao_media_minutos)
    filter (where m.data_fila between current_date - 29 and current_date), 1)                     as duracao_media_30d,
  coalesce(sum(m.cancelados)    filter (where m.data_fila = current_date), 0)                     as cancelados_hoje,
  coalesce(sum(m.ausentes)      filter (where m.data_fila = current_date), 0)                     as ausentes_hoje
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
  round(avg(m.duracao_media_minutos)
    filter (where m.data_fila between current_date - 29 and current_date), 1)                     as duracao_media_30d
from public.unidade u
left join public.vw_metricas_diarias m on m.unidade_id = u.id
where u.deleted_at is null
group by u.id, u.clinica_id, u.nome;

create view public.vw_uso_plano
with (security_invoker = true, security_barrier = true) as
select
  c.id                        as clinica_id,
  c.plano,
  l.preco_mensal_simulado,
  l.max_unidades,
  l.max_guiches,
  l.max_profissionais,
  l.max_tickets_mes,
  (select count(*) from public.unidade u where u.clinica_id = c.id and u.deleted_at is null)      as unidades_usadas,
  (select count(*) from public.profissional p where p.clinica_id = c.id and p.deleted_at is null) as profissionais_usados,
  (select count(*) from public.guiche g
     join public.unidade u on u.id = g.unidade_id
    where u.clinica_id = c.id and g.deleted_at is null)                                           as guiches_usados,
  (select count(*) from public.vw_relatorio_tickets t
    where t.clinica_id = c.id and t.data_fila >= date_trunc('month', current_date)::date)         as tickets_no_mes
from public.clinica c
join public.plano_limite l on l.plano = c.plano
where c.deleted_at is null;

-- -----------------------------------------------------------------------------
-- 10. Limpeza dos objetos que a fila por guichê deixou para trás
-- -----------------------------------------------------------------------------
alter table public.guiche
  drop column if exists tipo_servico,
  drop column if exists duracao_media_minutos,
  drop column if exists encaminha_para_consulta,
  drop column if exists profissional_padrao_id;

comment on table public.guiche is 'Posto de chamada da unidade. Não tem fila própria: consome a fila compartilhada da unidade.';

drop function if exists public.fn_duracao_media_guiche(uuid);
drop function if exists public.fn_unidade_do_guiche(uuid);
drop function if exists public.fn_clinica_do_guiche(uuid);

-- -----------------------------------------------------------------------------
-- 11. Privilégios dos objetos novos e recriados
--     As default privileges do schema estão fechadas: sem GRANT explícito,
--     nada fica acessível a anon ou authenticated.
-- -----------------------------------------------------------------------------
revoke all on function
  public.fn_entrar_fila_atendimento(uuid, text, text, text, public.prioridade_fila),
  public.fn_acompanhar_ticket(uuid),
  public.fn_chamar_proximo_atendimento(uuid),
  public.fn_estimativa_espera_minutos(public.tipo_fila, uuid, integer),
  public.fn_duracao_media_unidade(uuid),
  public.fn_guiches_ativos(uuid),
  public.fn_recalcular_posicoes_atendimento(uuid, date)
  from public, anon, authenticated;

grant execute on function
  public.fn_entrar_fila_atendimento(uuid, text, text, text, public.prioridade_fila),
  public.fn_acompanhar_ticket(uuid),
  public.fn_estimativa_espera_minutos(public.tipo_fila, uuid, integer),
  public.fn_duracao_media_unidade(uuid),
  public.fn_guiches_ativos(uuid)
  to anon, authenticated;

grant execute on function
  public.fn_chamar_proximo_atendimento(uuid)
  to authenticated;

grant select on public.vw_fila_atendimento_publica to anon, authenticated;
grant select on
  public.vw_fila_unificada, public.vw_relatorio_tickets, public.vw_metricas_diarias,
  public.vw_dashboard_clinica, public.vw_dashboard_unidade, public.vw_uso_plano
  to authenticated;
