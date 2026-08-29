-- =============================================================================
-- Aguard.ai — 01. Extensões e tipos
-- =============================================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- Planos comerciais simulados da clínica
create type public.plano_clinica as enum ('starter', 'pro', 'business', 'enterprise');

-- Papel do usuário autenticado dentro do sistema
create type public.papel_usuario as enum ('clinica', 'profissional');

-- Ciclo de vida compartilhado pelas duas filas virtuais
create type public.status_fila as enum (
  'aguardando',
  'chamado',
  'em_atendimento',
  'ausente',
  'finalizado',
  'cancelado'
);

-- Identifica qual das duas filas virtuais está sendo referenciada
create type public.tipo_fila as enum ('atendimento', 'consulta');

-- Ordem de chamada dentro da fila
create type public.prioridade_fila as enum ('normal', 'preferencial');
