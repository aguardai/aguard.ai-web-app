# 🚶 Aguard.ai — Entrega 02

> **Disciplina:** Engenharia de Software 3
>
> **Projeto:** Aguard.ai — Fila Virtual para Clínicas

---

## 1. Objetivo

Revisar e detalhar o modelo de entidades e relacionamentos do Aguard.ai, corrigindo a modelagem inicial para refletir:

- Relação **N:N** entre Profissional e Unidade (via tabela **Locação**)
- Duas filas virtuais distintas:
  - **Fila de Atendimento** (Guichê ↔ Paciente, via tabela **Atendimento**)
  - **Fila de Consulta** (Profissional ↔ Paciente, via tabela **Consulta**)

---

## 2. Modelo de Entidades e Relacionamentos

### 2.1 Diagrama ER

```mermaid
erDiagram
    CLINICA ||--o{ UNIDADE : "possui (1:N)"
    UNIDADE ||--o{ GUICHE : "possui (1:N)"
    UNIDADE ||--o{ LOCACAO : "aloca (1:N)"
    PROFISSIONAL ||--o{ LOCACAO : "atua em (1:N)"
    GUICHE ||--o{ ATENDIMENTO : "gera fila (1:N)"
    PACIENTE ||--o{ ATENDIMENTO : "enfileira (1:N)"
    PROFISSIONAL ||--o{ CONSULTA : "realiza (1:N)"
    PACIENTE ||--o{ CONSULTA : "aguarda (1:N)"
    UNIDADE ||--o{ CONSULTA : "sedia (1:N)"

    CLINICA {
        uuid id PK
        string nome
        string email
        string telefone
        string endereco
        string logo_url
        string plano
        timestamp created_at
    }

    UNIDADE {
        uuid id PK
        uuid clinica_id FK
        string nome
        string endereco
        string telefone
        boolean ativa
        timestamp created_at
    }

    PROFISSIONAL {
        uuid id PK
        uuid user_id FK
        string nome
        string especialidade
        string registro_profissional
        string avatar_url
        boolean ativo
        timestamp created_at
    }

    GUICHE {
        uuid id PK
        uuid unidade_id FK
        string nome
        string tipo_servico
        boolean ativo
        timestamp created_at
    }

    PACIENTE {
        uuid id PK
        string nome
        string telefone
        string email
        timestamp created_at
    }

    LOCACAO {
        uuid id PK
        uuid unidade_id FK
        uuid profissional_id FK
        date data_inicio
        date data_fim
        boolean ativa
        timestamp created_at
    }

    ATENDIMENTO {
        uuid id PK
        uuid guiche_id FK
        uuid paciente_id FK
        string status
        integer posicao
        timestamp entrada_fila
        timestamp chamado_em
        timestamp atendido_em
        timestamp finalizado_em
        timestamp created_at
    }

    CONSULTA {
        uuid id PK
        uuid profissional_id FK
        uuid paciente_id FK
        uuid unidade_id FK
        string status
        integer posicao
        string tipo_consulta
        timestamp entrada_fila
        timestamp chamado_em
        timestamp atendido_em
        timestamp finalizado_em
        timestamp created_at
    }
```

### 2.2 Diagrama de Hierarquia

```mermaid
graph TD
    CLINICA["🏥 CLÍNICA"]
    UNIDADE["🏢 UNIDADE"]
    PROFISSIONAL["👨‍⚕️ PROFISSIONAL"]
    GUICHE["🪟 GUICHÊ"]
    PACIENTE["🧑 PACIENTE"]
    LOCACAO["📌 LOCAÇÃO"]
    ATENDIMENTO["📋 ATENDIMENTO<br/>(Fila Virtual 1)"]
    CONSULTA["🩺 CONSULTA<br/>(Fila Virtual 2)"]

    CLINICA -->|"1:N"| UNIDADE
    UNIDADE -->|"1:N"| GUICHE
    UNIDADE --- LOCACAO
    PROFISSIONAL --- LOCACAO
    GUICHE --- ATENDIMENTO
    PACIENTE --- ATENDIMENTO
    PROFISSIONAL --- CONSULTA
    PACIENTE --- CONSULTA
```

---

## 3. Entidades Principais

### 3.1 CLÍNICA

Entidade raiz do sistema. Representa a organização que contrata o Aguard.ai.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `nome` | string | Nome da clínica |
| `email` | string | E-mail de contato |
| `telefone` | string | Telefone de contato |
| `endereco` | string | Endereço completo |
| `logo_url` | string | URL da logo |
| `plano` | enum | Plano contratado (starter, pro, business, enterprise) |
| `created_at` | timestamp | Data de criação |

**Regras:**
- Uma clínica possui **uma ou mais** unidades.
- O administrador da clínica é o usuário que a cadastrou (vinculado via `auth.users` do Supabase).

---

### 3.2 UNIDADE

Filial ou local de atendimento. Pertence a uma única clínica.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `clinica_id` | UUID (FK → CLINICA) | Clínica à qual pertence |
| `nome` | string | Nome da unidade |
| `endereco` | string | Endereço da unidade |
| `telefone` | string | Telefone da unidade |
| `ativa` | boolean | Se a unidade está ativa |
| `created_at` | timestamp | Data de criação |

**Regras:**
- Uma unidade possui **um ou mais** guichês.
- Uma unidade pode ter **vários profissionais** alocados (via Locação).
- Um profissional pode atuar em **várias unidades**.

---

### 3.3 PROFISSIONAL

Médico, dentista ou outro profissional de saúde que realiza consultas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `user_id` | UUID (FK → auth.users) | Conta de login |
| `nome` | string | Nome completo |
| `especialidade` | string | Especialidade (ex: Odontologia, Dermatologia) |
| `registro_profissional` | string | CRM, CRO, etc. |
| `avatar_url` | string | Foto de perfil |
| `ativo` | boolean | Se está ativo |
| `created_at` | timestamp | Data de criação |

**Regras:**
- Pode atuar em **múltiplas unidades** de uma mesma clínica (via Locação).
- Possui sua **própria fila de consultas** (Fila Virtual 2).
- Acessa o painel de atendimento para chamar pacientes.

---

### 3.4 GUICHÊ

Ponto físico de atendimento dentro de uma unidade (recepção, balcão, sala).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `unidade_id` | UUID (FK → UNIDADE) | Unidade à qual pertence |
| `nome` | string | Identificador do guichê (ex: "Guichê 1", "Sala 3") |
| `tipo_servico` | string | Tipo de serviço oferecido (ex: "Recepção", "Coleta") |
| `ativo` | boolean | Se está ativo |
| `created_at` | timestamp | Data de criação |

**Regras:**
- Pertence a **uma única** unidade.
- Possui sua **própria fila de atendimentos** (Fila Virtual 1).
- Limitado pelo plano da clínica.

---

### 3.5 PACIENTE

Usuário final que entra nas filas virtuais.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `nome` | string | Nome do paciente |
| `telefone` | string | Telefone para contato/notificação |
| `email` | string (opcional) | E-mail |
| `created_at` | timestamp | Data de criação |

**Regras:**
- Não requer login — identificado por dados básicos ao entrar na fila.
- Pode estar em **múltiplas filas** simultaneamente (atendimento e consulta).
- Acessa o sistema exclusivamente via rotas públicas (link/QR Code).

---

## 4. Tabelas Intermediárias (Relacionamentos N:N)

### 4.1 LOCAÇÃO (Unidade ↔ Profissional)

Registra a alocação de um profissional em uma unidade. Permite que o mesmo profissional atue em várias unidades da mesma clínica.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `unidade_id` | UUID (FK → UNIDADE) | Unidade |
| `profissional_id` | UUID (FK → PROFISSIONAL) | Profissional |
| `data_inicio` | date | Início da alocação |
| `data_fim` | date (nullable) | Fim da alocação (null = vigente) |
| `ativa` | boolean | Se a locação está ativa |
| `created_at` | timestamp | Data de criação |

**Exemplo:** Dr. Rafael (dentista) atende na Unidade Centro às segundas e quartas, e na Unidade Shopping às terças e quintas.

---

### 4.2 ATENDIMENTO (Guichê ↔ Paciente) — Fila Virtual 1

Registra a entrada de um paciente na fila de um guichê específico. É a **fila de atendimento geral** — usada para serviços como recepção, coleta de exames, triagem.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único (ticket) |
| `guiche_id` | UUID (FK → GUICHE) | Guichê |
| `paciente_id` | UUID (FK → PACIENTE) | Paciente |
| `status` | enum | `aguardando`, `chamado`, `em_atendimento`, `ausente`, `finalizado`, `cancelado` |
| `posicao` | integer | Posição na fila |
| `entrada_fila` | timestamp | Quando entrou na fila |
| `chamado_em` | timestamp (nullable) | Quando foi chamado |
| `atendido_em` | timestamp (nullable) | Quando o atendimento iniciou |
| `finalizado_em` | timestamp (nullable) | Quando finalizou |
| `created_at` | timestamp | Data de criação |

**Cenários de uso:**
- Paciente chega na clínica e entra na fila da **recepção** (Guichê 1)
- Paciente precisa fazer **coleta de sangue** (Guichê "Laboratório")
- Paciente aguarda **triagem** antes da consulta

---

### 4.3 CONSULTA (Profissional ↔ Paciente) — Fila Virtual 2

Registra a entrada de um paciente na fila de um profissional específico. É a **fila de consulta** — usada para atendimento com médico, dentista, etc.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID (PK) | Identificador único (ticket) |
| `profissional_id` | UUID (FK → PROFISSIONAL) | Profissional |
| `paciente_id` | UUID (FK → PACIENTE) | Paciente |
| `unidade_id` | UUID (FK → UNIDADE) | Unidade onde a consulta ocorre |
| `status` | enum | `aguardando`, `chamado`, `em_atendimento`, `ausente`, `finalizado`, `cancelado` |
| `posicao` | integer | Posição na fila |
| `tipo_consulta` | string | Tipo da consulta (ex: "Retorno", "Primeira vez") |
| `entrada_fila` | timestamp | Quando entrou na fila |
| `chamado_em` | timestamp (nullable) | Quando foi chamado |
| `atendido_em` | timestamp (nullable) | Quando o atendimento iniciou |
| `finalizado_em` | timestamp (nullable) | Quando finalizou |
| `created_at` | timestamp | Data de criação |

**Cenários de uso:**
- Paciente entra na fila do **Dr. Rafael** (consulta odontológica)
- Paciente aguarda a **Dra. Ana** para retorno dermatológico
- Profissional gerencia **sua própria fila** independente dos guichês

---

## 5. Duas Filas Virtuais

### 5.1 Comparação

| Aspecto | Fila de Atendimento (1) | Fila de Consulta (2) |
|---------|------------------------|---------------------|
| **Tabela** | ATENDIMENTO | CONSULTA |
| **Vínculo** | Guichê ↔ Paciente | Profissional ↔ Paciente |
| **Quem gerencia** | Operador do guichê | Profissional de saúde |
| **Uso típico** | Recepção, coleta, triagem | Consulta médica, odontológica |
| **Entrada** | QR Code do guichê/unidade | QR Code do profissional/clínica |
| **Prioridade** | Ordem de chegada | Ordem de chegada (+ tipo consulta) |

### 5.2 Fluxo Combinado Típico

```mermaid
flowchart TD
    PAC["🧑 Paciente chega"] --> FILA1["📋 Fila de Atendimento<br/>(Guichê: Recepção)"]
    FILA1 --> RECEP["Atendido na recepção<br/>(check-in, ficha)"]
    RECEP --> FILA2["🩺 Fila de Consulta<br/>(Dr. Rafael)"]
    FILA2 --> CONSULTA["Consulta com profissional"]
    CONSULTA --> FIM["✅ Finalizado"]

    RECEP -.->|"Se precisar"| FILA_LAB["📋 Fila de Atendimento<br/>(Guichê: Laboratório)"]
    FILA_LAB --> COLETA["Coleta de exame"]
    COLETA --> FILA2
```

---

## 6. Diagrama de Estados (Compartilhado)

Ambas as filas (Atendimento e Consulta) compartilham o mesmo ciclo de estados:

```mermaid
stateDiagram-v2
    [*] --> aguardando : Paciente entra na fila
    aguardando --> chamado : Operador/Profissional chama
    chamado --> em_atendimento : Paciente comparece
    chamado --> ausente : Paciente não comparece
    em_atendimento --> finalizado : Atendimento/Consulta concluída
    ausente --> aguardando : Retorna ao fim da fila
    ausente --> cancelado : Removido definitivamente
    aguardando --> cancelado : Paciente cancela
    finalizado --> [*]
    cancelado --> [*]
```

---

## 7. Impacto nas Rotas e Navegação

### Rotas completas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/(auth)/unidades` | Autenticada | Lista de unidades |
| `/(auth)/unidades/nova` | Autenticada | Criar unidade |
| `/(auth)/unidades/[id]` | Autenticada | Ver unidade + guichês vinculados |
| `/(auth)/unidades/[id]/editar` | Autenticada | Editar unidade |
| `/(auth)/profissionais` | Autenticada | Lista de profissionais |
| `/(auth)/profissionais/novo` | Autenticada | Cadastrar profissional |
| `/(auth)/profissionais/[id]` | Autenticada | Ver profissional + locações |
| `/(auth)/profissionais/[id]/editar` | Autenticada | Editar profissional |
| `/(auth)/locacoes` | Autenticada | Gestão de alocação de profissionais por unidade |
| `/(auth)/atendimento` | Autenticada | Painel único do profissional — fila unificada |
| `/(auth)/atendimento/historico` | Autenticada | Histórico de atendimentos e consultas |
| `/(public)/fila/[guicheId]` | Pública | Entrada na fila virtual do guichê (recepção) |
| `/(public)/acompanhar/[ticketId]` | Pública | Acompanhar posição na fila (Guichê → Consulta automática) |

### Sidebar atualizada (Clínica)

```
📊 Dashboard              → /(auth)/dashboard
🏥 Minha Clínica          → /(auth)/clinica
🏢 Unidades               → /(auth)/unidades
👨‍⚕️ Profissionais         → /(auth)/profissionais
📌 Locações               → /(auth)/locacoes
📋 Filas                   → /(auth)/filas
📈 Relatórios              → /(auth)/relatorios
```

### Sidebar atualizada (Profissional)

```
📺 Minha Fila              → /(auth)/atendimento
📜 Histórico               → /(auth)/atendimento/historico
```

---

## 8. Canais Realtime (Supabase)

| Canal | Evento | Quem escuta |
|-------|--------|-------------|
| `atendimento:guiche:{guicheId}` | Novo paciente, chamada, mudança de status | Operador do guichê, Paciente |
| `consulta:profissional:{profId}` | Novo paciente, chamada, mudança de status | Profissional, Paciente |
| `unidade:{unidadeId}` | Resumo de filas da unidade | Dashboard da Clínica |
| `clinica:{clinicaId}` | Métricas agregadas | Dashboard da Clínica |

---

## 9. Regras de Negócio

1. Um **Profissional** pode estar alocado em múltiplas unidades, mas a locação tem período de vigência (`data_inicio`, `data_fim`).
2. O **Guichê** possui fila própria (Atendimento). Quem opera o guichê não precisa ser necessariamente um profissional cadastrado — pode ser um recepcionista.
3. A **Consulta** está sempre vinculada a um profissional e a uma unidade (para saber onde o paciente deve ir).
4. O **Profissional** vê apenas **uma fila unificada** — os pacientes aptos a serem atendidos por ele, independente da origem (guichê ou consulta direta).
5. O **Paciente** acompanha apenas **uma fila por vez** — a fila em que está. A tela de acompanhamento é única e resolve o tipo de fila internamente.
6. O **plano da clínica** limita o número de guichês ativos e/ou volume total de atendimentos + consultas.
7. Cada fila tem **posição** gerenciada independentemente — a posição na fila do Guichê 1 não afeta a posição na fila do Dr. Rafael.
