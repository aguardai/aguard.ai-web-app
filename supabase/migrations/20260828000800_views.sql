-- =============================================================================
-- Aguard.ai — 08. Views de painel, relatórios e filas públicas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Painel público da fila do guichê (nomes mascarados, sem contato do paciente)
-- -----------------------------------------------------------------------------
create view public.vw_fila_atendimento_publica
with (security_barrier = true) as
select
  a.id                                   as ticket_id,
  a.guiche_id,
  g.nome                                 as guiche_nome,
  g.tipo_servico,
  u.id                                   as unidade_id,
  u.nome                                 as unidade_nome,
  a.senha,
  public.fn_mascarar_nome(p.nome)        as paciente,
  a.status,
  a.prioridade,
  a.posicao,
  a.entrada_fila,
  a.chamado_em,
  public.fn_estimativa_espera_minutos('atendimento', a.guiche_id, a.posicao) as estimativa_minutos
from public.atendimento a
join public.guiche g   on g.id = a.guiche_id
join public.unidade u  on u.id = g.unidade_id
join public.paciente p on p.id = a.paciente_id
where a.deleted_at is null
  and a.data_fila = current_date
  and a.status in ('aguardando', 'chamado', 'em_atendimento');

comment on view public.vw_fila_atendimento_publica is 'Fila do dia por guichê para painéis de sala de espera. Não expõe telefone, e-mail nem sobrenome completo.';

-- -----------------------------------------------------------------------------
-- Painel público da fila do profissional
-- -----------------------------------------------------------------------------
create view public.vw_fila_consulta_publica
with (security_barrier = true) as
select
  c.id                                   as ticket_id,
  c.profissional_id,
  pr.nome                                as profissional_nome,
  pr.especialidade,
  c.unidade_id,
  u.nome                                 as unidade_nome,
  c.senha,
  public.fn_mascarar_nome(p.nome)        as paciente,
  c.status,
  c.prioridade,
  c.posicao,
  c.tipo_consulta,
  c.entrada_fila,
  c.chamado_em,
  public.fn_estimativa_espera_minutos('consulta', c.profissional_id, c.posicao) as estimativa_minutos
from public.consulta c
join public.profissional pr on pr.id = c.profissional_id
join public.unidade u       on u.id = c.unidade_id
join public.paciente p      on p.id = c.paciente_id
where c.deleted_at is null
  and c.data_fila = current_date
  and c.status in ('aguardando', 'chamado', 'em_atendimento');

-- -----------------------------------------------------------------------------
-- Fila unificada do profissional (RN 4) — respeita o RLS do usuário autenticado
-- -----------------------------------------------------------------------------
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
  u.id,
  a.guiche_id,
  g.nome,
  p.id,
  p.nome,
  p.telefone,
  u.clinica_id
from public.atendimento a
join public.guiche g   on g.id = a.guiche_id
join public.unidade u  on u.id = g.unidade_id
join public.paciente p on p.id = a.paciente_id
where a.deleted_at is null
  and a.status in ('aguardando', 'chamado', 'em_atendimento');

comment on view public.vw_fila_unificada is 'Fila única do painel de atendimento: consultas do profissional e atendimentos de guichê já encaminhados a ele.';

-- -----------------------------------------------------------------------------
-- Base de relatórios: todos os tickets das duas filas com durações calculadas
-- -----------------------------------------------------------------------------
create view public.vw_relatorio_tickets
with (security_invoker = true, security_barrier = true) as
select
  'atendimento'::public.tipo_fila as tipo_fila,
  a.id                            as ticket_id,
  u.clinica_id,
  u.id                            as unidade_id,
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
join public.guiche g  on g.id = a.guiche_id
join public.unidade u on u.id = g.unidade_id
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

-- -----------------------------------------------------------------------------
-- Métricas diárias consolidadas por clínica
-- -----------------------------------------------------------------------------
create view public.vw_metricas_diarias
with (security_invoker = true, security_barrier = true) as
select
  t.clinica_id,
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
group by t.clinica_id, t.data_fila, t.tipo_fila;

-- -----------------------------------------------------------------------------
-- Resumo do dia para o dashboard da clínica
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- Consumo do plano contratado (monetização simulada)
-- -----------------------------------------------------------------------------
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
-- Privilégios das views
-- -----------------------------------------------------------------------------
grant select on public.vw_fila_atendimento_publica, public.vw_fila_consulta_publica to anon, authenticated;
grant select on
  public.vw_fila_unificada, public.vw_relatorio_tickets,
  public.vw_metricas_diarias, public.vw_dashboard_clinica, public.vw_uso_plano
  to authenticated;
