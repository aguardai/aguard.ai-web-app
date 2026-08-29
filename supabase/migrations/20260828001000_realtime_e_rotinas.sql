-- =============================================================================
-- Aguard.ai — 10. Realtime e rotinas agendadas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Replicação das filas para o Supabase Realtime (painéis autenticados)
-- -----------------------------------------------------------------------------
alter table public.atendimento replica identity full;
alter table public.consulta    replica identity full;

do $$
declare
  v_tabela text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach v_tabela in array array['atendimento', 'consulta'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_tabela
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_tabela);
    end if;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Broadcast anonimizado para os canais públicos descritos na Entrega 02:
--   atendimento:guiche:{guicheId}   consulta:profissional:{profId}
-- -----------------------------------------------------------------------------
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
    v_topico := 'atendimento:guiche:' || new.guiche_id::text;
    v_payload := jsonb_build_object(
      'ticket_id', new.id,
      'senha', new.senha,
      'status', new.status,
      'posicao', new.posicao,
      'prioridade', new.prioridade,
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
  return null;
end;
$$;

comment on function public.fn_broadcast_fila is 'Publica alterações da fila sem expor dados de contato do paciente.';

create trigger trg_atendimento_broadcast
  after insert or update of status, posicao, consulta_gerada_id on public.atendimento
  for each row execute function public.fn_broadcast_fila();

create trigger trg_consulta_broadcast
  after insert or update of status, posicao on public.consulta
  for each row execute function public.fn_broadcast_fila();

-- -----------------------------------------------------------------------------
-- Encerramento diário das filas: tickets abandonados de dias anteriores
-- -----------------------------------------------------------------------------
create or replace function public.fn_encerrar_filas_do_dia()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  v_qtd   integer;
begin
  update public.atendimento
     set status = 'cancelado',
         observacoes = coalesce(observacoes || ' | ', '') || 'Encerrado automaticamente no fim do expediente'
   where data_fila < current_date
     and status in ('aguardando', 'chamado')
     and deleted_at is null;
  get diagnostics v_qtd = row_count;
  v_total := v_total + v_qtd;

  update public.consulta
     set status = 'cancelado',
         observacoes = coalesce(observacoes || ' | ', '') || 'Encerrada automaticamente no fim do expediente'
   where data_fila < current_date
     and status in ('aguardando', 'chamado')
     and deleted_at is null;
  get diagnostics v_qtd = row_count;

  return v_total + v_qtd;
end;
$$;

-- Encerra as locações cujo período de vigência já terminou
create or replace function public.fn_encerrar_locacoes_vencidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qtd integer;
begin
  update public.locacao
     set ativa = false
   where ativa
     and deleted_at is null
     and data_fim is not null
     and data_fim < current_date;
  get diagnostics v_qtd = row_count;

  return v_qtd;
end;
$$;

-- Agendamento diário (executa apenas se a extensão pg_cron estiver habilitada)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'aguardai-encerrar-filas',
      '5 3 * * *',
      $cron$select public.fn_encerrar_filas_do_dia(); select public.fn_encerrar_locacoes_vencidas();$cron$
    );
  end if;
end;
$$;
