-- =============================================================================
-- Aguard.ai — 03. Tabelas
-- Todas as tabelas de negócio possuem auditoria completa:
-- created_at/created_by, updated_at/updated_by, deleted_at/deleted_by.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CLINICA — entidade raiz do sistema
-- -----------------------------------------------------------------------------
create table public.clinica (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(btrim(nome)) between 2 and 120),
  slug        text not null check (slug ~ '^[a-z0-9][a-z0-9-]{2,59}$'),
  email       text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  telefone    text check (regexp_replace(telefone, '\D', '', 'g') ~ '^[0-9]{10,13}$'),
  endereco    text,
  logo_url    text,
  plano       public.plano_clinica not null default 'starter',
  ativa       boolean not null default true,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

comment on table public.clinica is 'Organização que contrata o Aguard.ai. Entidade raiz do multi-tenant.';

-- -----------------------------------------------------------------------------
-- PERFIL — vínculo entre auth.users e a clínica, com o papel do usuário
-- -----------------------------------------------------------------------------
create table public.perfil (
  id          uuid primary key references auth.users (id) on delete cascade,
  clinica_id  uuid references public.clinica (id) on delete cascade,
  papel       public.papel_usuario not null default 'clinica',
  nome        text not null,
  email       text,
  avatar_url  text,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

comment on table public.perfil is 'Espelho de auth.users com papel e tenant. Base de todas as políticas de RLS.';

-- -----------------------------------------------------------------------------
-- UNIDADE — filial ou local de atendimento
-- -----------------------------------------------------------------------------
create table public.unidade (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null references public.clinica (id) on delete cascade,
  nome        text not null check (length(btrim(nome)) between 2 and 120),
  endereco    text,
  telefone    text check (regexp_replace(telefone, '\D', '', 'g') ~ '^[0-9]{10,13}$'),
  latitude    numeric(9, 6) check (latitude between -90 and 90),
  longitude   numeric(9, 6) check (longitude between -180 and 180),
  ativa       boolean not null default true,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

-- -----------------------------------------------------------------------------
-- PROFISSIONAL — realiza as consultas (Fila Virtual 2)
-- -----------------------------------------------------------------------------
create table public.profissional (
  id                     uuid primary key default gen_random_uuid(),
  clinica_id             uuid not null references public.clinica (id) on delete cascade,
  user_id                uuid references auth.users (id) on delete set null,
  nome                   text not null check (length(btrim(nome)) between 2 and 120),
  email                  text check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  telefone               text check (regexp_replace(telefone, '\D', '', 'g') ~ '^[0-9]{10,13}$'),
  especialidade          text not null,
  registro_profissional  text not null,
  codigo                 text check (codigo ~ '^[A-Z0-9]{2,6}$'),
  avatar_url             text,
  duracao_media_minutos  smallint not null default 20 check (duracao_media_minutos between 1 and 480),
  ativo                  boolean not null default true,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

comment on column public.profissional.clinica_id is 'Adicionado ao modelo da Entrega 02: necessário para o isolamento multi-tenant via RLS.';
comment on column public.profissional.codigo is 'Prefixo usado na senha da fila de consulta (ex.: RAF-007).';

-- -----------------------------------------------------------------------------
-- GUICHE — ponto físico de atendimento (Fila Virtual 1)
-- -----------------------------------------------------------------------------
create table public.guiche (
  id                       uuid primary key default gen_random_uuid(),
  unidade_id               uuid not null references public.unidade (id) on delete cascade,
  nome                     text not null check (length(btrim(nome)) between 1 and 60),
  codigo                   text not null check (codigo ~ '^[A-Z0-9]{2,6}$'),
  tipo_servico             text not null,
  duracao_media_minutos    smallint not null default 10 check (duracao_media_minutos between 1 and 480),
  encaminha_para_consulta  boolean not null default false,
  profissional_padrao_id   uuid references public.profissional (id) on delete set null,
  ativo                    boolean not null default true,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

comment on column public.guiche.encaminha_para_consulta is 'Quando verdadeiro, todo atendimento finalizado neste guichê é encaminhado automaticamente para a fila de consulta.';
comment on column public.guiche.profissional_padrao_id is 'Profissional usado no encaminhamento automático quando o operador não escolhe outro.';

-- -----------------------------------------------------------------------------
-- PACIENTE — usuário final, sem login
-- -----------------------------------------------------------------------------
create table public.paciente (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null check (length(btrim(nome)) between 2 and 120),
  telefone         text not null check (regexp_replace(telefone, '\D', '', 'g') ~ '^[0-9]{10,13}$'),
  email            text check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  data_nascimento  date check (data_nascimento between date '1900-01-01' and current_date),

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

comment on table public.paciente is 'Identificado apenas por dados básicos de contato. Não armazena dados sensíveis.';

-- -----------------------------------------------------------------------------
-- LOCACAO — N:N entre Unidade e Profissional
-- -----------------------------------------------------------------------------
create table public.locacao (
  id               uuid primary key default gen_random_uuid(),
  unidade_id       uuid not null references public.unidade (id) on delete cascade,
  profissional_id  uuid not null references public.profissional (id) on delete cascade,
  data_inicio      date not null default current_date,
  data_fim         date,
  ativa            boolean not null default true,
  observacoes      text,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null,

  constraint locacao_periodo_valido check (data_fim is null or data_fim >= data_inicio)
);

-- -----------------------------------------------------------------------------
-- ATENDIMENTO — Fila Virtual 1 (Guichê <-> Paciente)
-- -----------------------------------------------------------------------------
create table public.atendimento (
  id                       uuid primary key default gen_random_uuid(),
  guiche_id                uuid not null references public.guiche (id) on delete cascade,
  paciente_id              uuid not null references public.paciente (id) on delete cascade,
  status                   public.status_fila not null default 'aguardando',
  prioridade               public.prioridade_fila not null default 'normal',
  posicao                  integer check (posicao >= 0),
  data_fila                date not null default current_date,
  numero_senha             integer check (numero_senha > 0),
  senha                    text,
  observacoes              text,

  -- Encaminhamento automático para a Fila Virtual 2
  encaminhar_para_consulta boolean not null default false,
  proximo_profissional_id  uuid references public.profissional (id) on delete set null,
  tipo_consulta            text,
  consulta_gerada_id       uuid,

  entrada_fila             timestamptz not null default now(),
  chamado_em               timestamptz,
  atendido_em              timestamptz,
  finalizado_em            timestamptz,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

comment on table public.atendimento is 'Fila Virtual 1: recepção, triagem, coleta. Uma linha equivale a um ticket.';
comment on column public.atendimento.consulta_gerada_id is 'Consulta criada automaticamente ao finalizar este atendimento.';

-- -----------------------------------------------------------------------------
-- CONSULTA — Fila Virtual 2 (Profissional <-> Paciente)
-- -----------------------------------------------------------------------------
create table public.consulta (
  id                     uuid primary key default gen_random_uuid(),
  profissional_id        uuid not null references public.profissional (id) on delete cascade,
  paciente_id            uuid not null references public.paciente (id) on delete cascade,
  unidade_id             uuid not null references public.unidade (id) on delete cascade,
  origem_atendimento_id  uuid references public.atendimento (id) on delete set null,
  status                 public.status_fila not null default 'aguardando',
  prioridade             public.prioridade_fila not null default 'normal',
  posicao                integer check (posicao >= 0),
  data_fila              date not null default current_date,
  numero_senha           integer check (numero_senha > 0),
  senha                  text,
  tipo_consulta          text,
  observacoes            text,

  entrada_fila           timestamptz not null default now(),
  chamado_em             timestamptz,
  atendido_em            timestamptz,
  finalizado_em          timestamptz,

  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null
);

comment on table public.consulta is 'Fila Virtual 2: atendimento com o profissional de saúde. Uma linha equivale a um ticket.';
comment on column public.consulta.origem_atendimento_id is 'Atendimento do guichê que originou esta consulta pelo encaminhamento automático.';

alter table public.atendimento
  add constraint atendimento_consulta_gerada_fkey
  foreign key (consulta_gerada_id) references public.consulta (id) on delete set null;

-- -----------------------------------------------------------------------------
-- PLANO_LIMITE — limites da monetização simulada
-- -----------------------------------------------------------------------------
create table public.plano_limite (
  plano                  public.plano_clinica primary key,
  max_unidades           integer not null check (max_unidades > 0),
  max_guiches            integer not null check (max_guiches > 0),
  max_profissionais      integer not null check (max_profissionais > 0),
  max_tickets_mes        integer not null check (max_tickets_mes > 0),
  preco_mensal_simulado  numeric(10, 2) not null default 0,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

insert into public.plano_limite
  (plano, max_unidades, max_guiches, max_profissionais, max_tickets_mes, preco_mensal_simulado)
values
  ('starter',     1,   2,   3,     500,   0.00),
  ('pro',         3,   8,  15,    3000,  39.90),
  ('business',   10,  30,  60,   15000, 129.90),
  ('enterprise', 999, 999, 999, 999999, 349.90);

-- -----------------------------------------------------------------------------
-- FILA_EVENTO — trilha de auditoria imutável das mudanças de status
-- -----------------------------------------------------------------------------
create table public.fila_evento (
  id           bigint generated always as identity primary key,
  tipo_fila    public.tipo_fila not null,
  ticket_id    uuid not null,
  clinica_id   uuid references public.clinica (id) on delete cascade,
  status_de    public.status_fila,
  status_para  public.status_fila not null,
  automatico   boolean not null default false,
  detalhes     jsonb not null default '{}'::jsonb,

  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null
);

comment on table public.fila_evento is 'Histórico append-only de transições de status das duas filas.';
