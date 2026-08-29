-- =============================================================================
-- Aguard.ai — 05. Funções de apoio das filas virtuais
-- =============================================================================

-- Oculta o sobrenome do paciente em painéis públicos ("Maria Souza" -> "Maria S.")
create or replace function public.fn_mascarar_nome(p_nome text)
returns text
language sql
immutable
as $$
  select case
    when p_nome is null or btrim(p_nome) = '' then 'Paciente'
    when position(' ' in btrim(p_nome)) = 0 then btrim(p_nome)
    else split_part(btrim(p_nome), ' ', 1) || ' ' ||
         upper(substr(split_part(btrim(p_nome), ' ', array_length(string_to_array(btrim(p_nome), ' '), 1)), 1, 1)) || '.'
  end;
$$;

-- Valida se a mudança de status respeita o diagrama de estados das filas
create or replace function public.fn_transicao_valida(p_de public.status_fila, p_para public.status_fila)
returns boolean
language sql
immutable
as $$
  select case p_de
    when 'aguardando'     then p_para in ('chamado', 'cancelado')
    when 'chamado'        then p_para in ('em_atendimento', 'ausente', 'aguardando', 'cancelado')
    when 'em_atendimento' then p_para in ('finalizado', 'cancelado')
    when 'ausente'        then p_para in ('aguardando', 'cancelado')
    when 'finalizado'     then false
    when 'cancelado'      then false
    else false
  end;
$$;

comment on function public.fn_transicao_valida is 'Máquina de estados das filas. Além do diagrama da Entrega 02, permite chamado->cancelado e chamado->aguardando (rechamada).';

-- Resolve a clínica dona de um guichê
create or replace function public.fn_clinica_do_guiche(p_guiche_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.clinica_id
    from public.guiche g
    join public.unidade u on u.id = g.unidade_id
   where g.id = p_guiche_id;
$$;

-- Renumera a fila de atendimento de um guichê em uma data
create or replace function public.fn_recalcular_posicoes_atendimento(p_guiche_id uuid, p_data date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ordenada as (
    select id, row_number() over (order by prioridade desc, entrada_fila, id) as pos
      from public.atendimento
     where guiche_id = p_guiche_id
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
   where guiche_id = p_guiche_id
     and data_fila = p_data
     and status in ('chamado', 'em_atendimento')
     and deleted_at is null
     and posicao is distinct from 0;

  update public.atendimento
     set posicao = null
   where guiche_id = p_guiche_id
     and data_fila = p_data
     and (status in ('ausente', 'finalizado', 'cancelado') or deleted_at is not null)
     and posicao is not null;
end;
$$;

-- Renumera a fila de consulta de um profissional em uma data
create or replace function public.fn_recalcular_posicoes_consulta(p_profissional_id uuid, p_data date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ordenada as (
    select id, row_number() over (order by prioridade desc, entrada_fila, id) as pos
      from public.consulta
     where profissional_id = p_profissional_id
       and data_fila = p_data
       and status = 'aguardando'
       and deleted_at is null
  )
  update public.consulta c
     set posicao = o.pos
    from ordenada o
   where c.id = o.id
     and c.posicao is distinct from o.pos;

  update public.consulta
     set posicao = 0
   where profissional_id = p_profissional_id
     and data_fila = p_data
     and status in ('chamado', 'em_atendimento')
     and deleted_at is null
     and posicao is distinct from 0;

  update public.consulta
     set posicao = null
   where profissional_id = p_profissional_id
     and data_fila = p_data
     and (status in ('ausente', 'finalizado', 'cancelado') or deleted_at is not null)
     and posicao is not null;
end;
$$;

-- Tempo médio de atendimento de um guichê nos últimos 30 dias, com fallback no cadastro
create or replace function public.fn_duracao_media_guiche(p_guiche_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select round(avg(extract(epoch from (a.finalizado_em - a.atendido_em)) / 60)::numeric, 1)
       from public.atendimento a
      where a.guiche_id = p_guiche_id
        and a.status = 'finalizado'
        and a.atendido_em is not null
        and a.finalizado_em is not null
        and a.finalizado_em >= now() - interval '30 days'
        and a.deleted_at is null),
    (select g.duracao_media_minutos from public.guiche g where g.id = p_guiche_id),
    10
  );
$$;

-- Tempo médio de consulta de um profissional nos últimos 30 dias, com fallback no cadastro
create or replace function public.fn_duracao_media_profissional(p_profissional_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select round(avg(extract(epoch from (c.finalizado_em - c.atendido_em)) / 60)::numeric, 1)
       from public.consulta c
      where c.profissional_id = p_profissional_id
        and c.status = 'finalizado'
        and c.atendido_em is not null
        and c.finalizado_em is not null
        and c.finalizado_em >= now() - interval '30 days'
        and c.deleted_at is null),
    (select p.duracao_media_minutos from public.profissional p where p.id = p_profissional_id),
    20
  );
$$;

-- Estimativa de espera em minutos a partir da posição na fila
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
    when p_tipo = 'atendimento' then ceil(greatest(p_posicao, 0) * public.fn_duracao_media_guiche(p_escopo_id))::int
    else ceil(greatest(p_posicao, 0) * public.fn_duracao_media_profissional(p_escopo_id))::int
  end;
$$;
