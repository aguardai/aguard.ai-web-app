-- =============================================================================
-- Aguard.ai — 15. Perdas no dashboard da clínica e janela de 30 dias fechada
--
-- 1. vw_dashboard_unidade já agrega cancelados_hoje e ausentes_hoje, mas
--    vw_dashboard_clinica não: o relatório com o filtro em "Todas as unidades"
--    ficava sem esses dois números, enquanto o recorte por unidade os exibia.
--    As colunas entram no fim da lista de propósito — create or replace view só
--    aceita acrescentar colunas ao final, e assim a view não precisa ser dropada
--    nem as permissões reconcedidas.
--
-- 2. duracao_media_30d filtrava por data_fila >= current_date - 29, sem limite
--    superior. Como o seed carrega dias futuros, a média de "30 dias" somava
--    tudo daqui para frente: 498 linhas em vez de 132, e 20,3 min em vez de
--    19,7. O filtro passa a usar um between fechado nas duas pontas.
-- =============================================================================

create or replace view public.vw_dashboard_clinica
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

comment on view public.vw_dashboard_clinica is 'Indicadores do dia consolidados por clínica, incluindo cancelamentos e ausências. A média de 30 dias é fechada em current_date. Respeita o RLS de quem consulta.';

-- A lista de colunas não muda: só a janela do duracao_media_30d
create or replace view public.vw_dashboard_unidade
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

comment on view public.vw_dashboard_unidade is 'Indicadores do dia por unidade. A média de 30 dias é fechada em current_date. Respeita o RLS de quem consulta.';
