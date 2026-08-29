-- =============================================================================
-- Aguard.ai — 04. Índices e restrições de unicidade
-- Todo índice parcial ignora registros com soft delete (deleted_at is not null).
-- =============================================================================

-- CLINICA
create unique index clinica_slug_unico_idx on public.clinica (lower(slug)) where deleted_at is null;
create unique index clinica_email_unico_idx on public.clinica (lower(email)) where deleted_at is null;
create index clinica_plano_idx on public.clinica (plano) where deleted_at is null;
create index clinica_nome_busca_idx on public.clinica using gin (nome extensions.gin_trgm_ops);

-- PERFIL
create index perfil_clinica_idx on public.perfil (clinica_id) where deleted_at is null;
create index perfil_papel_idx on public.perfil (papel);

-- UNIDADE
create index unidade_clinica_idx on public.unidade (clinica_id) where deleted_at is null;
create unique index unidade_nome_unico_idx on public.unidade (clinica_id, lower(nome)) where deleted_at is null;
create index unidade_ativa_idx on public.unidade (clinica_id, ativa) where deleted_at is null;
create index unidade_nome_busca_idx on public.unidade using gin (nome extensions.gin_trgm_ops);

-- PROFISSIONAL
create index profissional_clinica_idx on public.profissional (clinica_id) where deleted_at is null;
create unique index profissional_user_unico_idx on public.profissional (user_id) where user_id is not null and deleted_at is null;
create unique index profissional_registro_unico_idx
  on public.profissional (clinica_id, upper(registro_profissional)) where deleted_at is null;
create index profissional_especialidade_idx on public.profissional (clinica_id, especialidade) where deleted_at is null;
create index profissional_nome_busca_idx on public.profissional using gin (nome extensions.gin_trgm_ops);

-- GUICHE
create index guiche_unidade_idx on public.guiche (unidade_id) where deleted_at is null;
create unique index guiche_codigo_unico_idx on public.guiche (unidade_id, upper(codigo)) where deleted_at is null;
create index guiche_ativo_idx on public.guiche (unidade_id, ativo) where deleted_at is null;
create index guiche_profissional_padrao_idx on public.guiche (profissional_padrao_id) where profissional_padrao_id is not null;

-- PACIENTE
create unique index paciente_telefone_unico_idx
  on public.paciente (regexp_replace(telefone, '\D', '', 'g')) where deleted_at is null;
create index paciente_nome_busca_idx on public.paciente using gin (nome extensions.gin_trgm_ops);

-- LOCACAO
create index locacao_unidade_idx on public.locacao (unidade_id) where deleted_at is null;
create index locacao_profissional_idx on public.locacao (profissional_id) where deleted_at is null;
create unique index locacao_vigente_unica_idx
  on public.locacao (unidade_id, profissional_id) where ativa and data_fim is null and deleted_at is null;
create index locacao_periodo_idx on public.locacao (profissional_id, data_inicio, data_fim) where deleted_at is null;

-- ATENDIMENTO (Fila Virtual 1)
create index atendimento_fila_idx
  on public.atendimento (guiche_id, data_fila, prioridade desc, entrada_fila)
  where status = 'aguardando'::public.status_fila and deleted_at is null;

create index atendimento_ativos_idx
  on public.atendimento (guiche_id, status, data_fila)
  where status in ('aguardando'::public.status_fila, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila)
    and deleted_at is null;

create index atendimento_paciente_idx on public.atendimento (paciente_id, entrada_fila desc);
create index atendimento_guiche_data_idx on public.atendimento (guiche_id, data_fila);
create index atendimento_relatorio_idx on public.atendimento (finalizado_em desc)
  where status = 'finalizado'::public.status_fila and deleted_at is null;
create index atendimento_proximo_profissional_idx on public.atendimento (proximo_profissional_id)
  where proximo_profissional_id is not null;
create index atendimento_consulta_gerada_idx on public.atendimento (consulta_gerada_id)
  where consulta_gerada_id is not null;

create unique index atendimento_senha_unica_idx on public.atendimento (guiche_id, data_fila, numero_senha);

-- Impede que o mesmo paciente ocupe duas vagas ativas na fila do mesmo guichê
create unique index atendimento_paciente_ativo_idx
  on public.atendimento (guiche_id, paciente_id)
  where status in ('aguardando'::public.status_fila, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila)
    and deleted_at is null;

-- CONSULTA (Fila Virtual 2)
create index consulta_fila_idx
  on public.consulta (profissional_id, data_fila, prioridade desc, entrada_fila)
  where status = 'aguardando'::public.status_fila and deleted_at is null;

create index consulta_ativas_idx
  on public.consulta (profissional_id, status, data_fila)
  where status in ('aguardando'::public.status_fila, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila)
    and deleted_at is null;

create index consulta_paciente_idx on public.consulta (paciente_id, entrada_fila desc);
create index consulta_unidade_idx on public.consulta (unidade_id, data_fila);
create index consulta_origem_idx on public.consulta (origem_atendimento_id) where origem_atendimento_id is not null;
create index consulta_relatorio_idx on public.consulta (finalizado_em desc)
  where status = 'finalizado'::public.status_fila and deleted_at is null;

create unique index consulta_senha_unica_idx on public.consulta (profissional_id, data_fila, numero_senha);

create unique index consulta_paciente_ativa_idx
  on public.consulta (profissional_id, paciente_id)
  where status in ('aguardando'::public.status_fila, 'chamado'::public.status_fila, 'em_atendimento'::public.status_fila)
    and deleted_at is null;

-- FILA_EVENTO
create index fila_evento_ticket_idx on public.fila_evento (ticket_id, created_at desc);
create index fila_evento_clinica_idx on public.fila_evento (clinica_id, created_at desc);
