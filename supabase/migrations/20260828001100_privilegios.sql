-- =============================================================================
-- Aguard.ai — 11. Endurecimento de privilégios
--
-- REVOKE remove apenas a concessão do papel nomeado. O que foi concedido a
-- PUBLIC continua valendo para todos os papéis, inclusive anon e authenticated.
-- O PostgreSQL concede EXECUTE a PUBLIC em toda função criada, então as funções
-- não listadas na migration 09 permaneciam executáveis por anon via PostgREST.
--
-- Esta migration refaz a matriz de privilégios de forma explícita: revoga tudo
-- de PUBLIC, anon e authenticated e devolve apenas o necessário.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Zera o estado herdado (tabelas, views e funções)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Tabelas e views
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on
  public.clinica, public.perfil, public.unidade, public.profissional,
  public.guiche, public.paciente, public.locacao, public.atendimento, public.consulta
  to authenticated;

grant select on public.fila_evento, public.plano_limite to authenticated;

grant select on
  public.vw_fila_unificada, public.vw_relatorio_tickets, public.vw_metricas_diarias,
  public.vw_dashboard_clinica, public.vw_uso_plano,
  public.vw_fila_atendimento_publica, public.vw_fila_consulta_publica
  to authenticated;

grant select on public.plano_limite to anon;
grant select on public.vw_fila_atendimento_publica, public.vw_fila_consulta_publica to anon;

-- -----------------------------------------------------------------------------
-- 3. Funções expostas ao paciente (rotas públicas)
-- -----------------------------------------------------------------------------
grant execute on function
  public.fn_entrar_fila_atendimento(uuid, text, text, text, public.prioridade_fila),
  public.fn_entrar_fila_consulta(uuid, uuid, text, text, text, text, public.prioridade_fila),
  public.fn_acompanhar_ticket(uuid),
  public.fn_cancelar_ticket(uuid)
  to anon, authenticated;

-- Chamadas diretamente pelas views públicas de sala de espera:
-- o EXECUTE de função é verificado contra o papel que consulta, não contra o dono da view
grant execute on function
  public.fn_mascarar_nome(text),
  public.fn_estimativa_espera_minutos(public.tipo_fila, uuid, integer)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Funções do painel autenticado
-- -----------------------------------------------------------------------------
grant execute on function
  public.fn_chamar_proximo_atendimento(uuid),
  public.fn_chamar_proximo_consulta(uuid),
  public.fn_finalizar_atendimento(uuid, boolean, uuid, text)
  to authenticated;

-- Avaliadas dentro das políticas de RLS, que rodam como o usuário que consulta
grant execute on function
  public.fn_clinica_atual(),
  public.fn_papel_atual(),
  public.fn_e_admin_clinica(),
  public.fn_profissional_atual(),
  public.fn_atua_na_unidade(uuid),
  public.fn_clinica_do_guiche(uuid)
  to authenticated;

-- Chamada por fn_status_fila, que é SECURITY INVOKER
grant execute on function
  public.fn_transicao_valida(public.status_fila, public.status_fila)
  to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Funções sem nenhuma concessão (permanecem restritas a postgres/service_role)
--
--    fn_upsert_paciente, fn_recalcular_posicoes_atendimento,
--    fn_recalcular_posicoes_consulta, fn_duracao_media_guiche,
--    fn_duracao_media_profissional, fn_encerrar_filas_do_dia,
--    fn_encerrar_locacoes_vencidas
--
--    São chamadas apenas de dentro de funções SECURITY DEFINER pertencentes a
--    postgres, onde o EXECUTE é verificado contra o dono e não contra o chamador.
--
--    As funções de trigger também ficam sem concessão: o EXECUTE de uma função
--    de trigger é verificado na criação do trigger, não a cada disparo.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 6. Impede que objetos futuros reabram o acesso
--    A partir daqui, toda nova tabela ou função criada por este papel nasce
--    fechada e precisa de GRANT explícito.
-- -----------------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Verificação
--
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'execute')          as anon,
--        has_function_privilege('authenticated', p.oid, 'execute') as authenticated
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' order by 1;
--
-- select c.relname,
--        has_table_privilege('anon', c.oid, 'select')          as anon_select,
--        has_table_privilege('authenticated', c.oid, 'select') as auth_select
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public' and c.relkind in ('r', 'v') order by 1;
-- -----------------------------------------------------------------------------
