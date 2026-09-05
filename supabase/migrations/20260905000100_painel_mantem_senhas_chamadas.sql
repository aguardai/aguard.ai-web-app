-- Painel da sala de espera: a senha continua na lista depois de finalizada.
-- O painel mostra a ordem de chamada, não quem está sendo atendido agora, então
-- o ticket só sai quando outras chamadas o empurram para fora das últimas.

create or replace function public.fn_painel_unidade(p_unidade_id uuid)
returns table (
  tipo_fila          public.tipo_fila,
  ticket_id          uuid,
  senha              text,
  paciente           text,
  status             public.status_fila,
  prioridade         public.prioridade_fila,
  posicao            integer,
  origem             text,
  entrada_fila       timestamptz,
  chamado_em         timestamptz,
  estimativa_minutos integer
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from (
    select
      'atendimento'::public.tipo_fila,
      a.id,
      a.senha,
      public.fn_mascarar_nome(p.nome),
      a.status,
      a.prioridade,
      a.posicao,
      g.nome,
      a.entrada_fila,
      a.chamado_em,
      public.fn_estimativa_espera_minutos('atendimento', a.unidade_id, a.posicao)
    from public.atendimento a
    join public.unidade u     on u.id = a.unidade_id
    join public.clinica c     on c.id = u.clinica_id
    join public.paciente p    on p.id = a.paciente_id
    left join public.guiche g on g.id = a.guiche_id
    where a.unidade_id = p_unidade_id
      and u.ativa and u.deleted_at is null
      and c.ativa and c.deleted_at is null
      and a.deleted_at is null
      and a.data_fila = current_date
      and a.status <> 'cancelado'

    union all

    select
      'consulta'::public.tipo_fila,
      co.id,
      co.senha,
      public.fn_mascarar_nome(p.nome),
      co.status,
      co.prioridade,
      co.posicao,
      pr.nome,
      co.entrada_fila,
      co.chamado_em,
      public.fn_estimativa_espera_minutos('consulta', co.profissional_id, co.posicao)
    from public.consulta co
    join public.profissional pr on pr.id = co.profissional_id
    join public.unidade u       on u.id = co.unidade_id
    join public.clinica c       on c.id = u.clinica_id
    join public.paciente p      on p.id = co.paciente_id
    where co.unidade_id = p_unidade_id
      and pr.ativo and pr.deleted_at is null
      and u.ativa and u.deleted_at is null
      and c.ativa and c.deleted_at is null
      and co.deleted_at is null
      and co.data_fila = current_date
      and co.status <> 'cancelado'
  ) fila
  -- Por posição: os nomes das colunas de saída colidem com os parâmetros OUT
  order by 10 desc nulls last, 7 nulls last, 9
  limit 100;
$$;

comment on function public.fn_painel_unidade is 'Fila do dia da unidade, recepção e consulta na mesma lista, para o painel da sala de espera. Mantém as senhas já finalizadas para preservar a ordem de chamada. Não expõe telefone, e-mail nem sobrenome completo.';

revoke all on function public.fn_painel_unidade(uuid) from public, anon, authenticated;
grant execute on function public.fn_painel_unidade(uuid) to anon, authenticated;
