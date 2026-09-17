<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 🛡️ Aguard.ai — Regras de Desenvolvimento para IAs

> **Este documento define as regras obrigatórias para qualquer assistente de IA que trabalhe neste projeto.**

---

## 1. Visão Geral do Projeto

- **Nome:** Aguard.ai
- **Descrição:** Fila virtual para clínicas. Permite entrada remota na fila, estimativa de espera em tempo real e gestão completa de atendimento.
- **Problema:** Usuários perdem tempo esperando atendimento presencialmente em clínicas e outros serviços.
- **Público-alvo:** Clínicas (público inicial) — administradores, profissionais de saúde e pacientes.
- **Estágio atual:** MVP

### Proposta de Valor

Permitir entrada remota na fila, exibição de posição e tempo estimado de espera, e gestão de atendimento para clínicas.

### Requisitos Funcionais

1. Cadastro de unidades, guichês, profissionais e tipos de serviço.
2. Entrada do usuário em uma fila virtual.
3. Exibição da posição e tempo estimado de espera.
4. Chamada do próximo usuário por atendente.
5. Pausa, ausência e cancelamento.
6. Painel de atendimento em tempo real.
7. Relatório simples de tempo médio e volume de atendimentos.
8. Plano institucional simulado por número de guichês ou atendimentos.

### Entidades e Papéis

| Entidade      | Descrição                                                    |
| ------------- | ------------------------------------------------------------ |
| CLINICA       | Entidade pai. Usuário que administra a clínica.              |
| UNIDADE       | Pertence a uma CLINICA. Filial ou local de atendimento.      |
| PROFISSIONAL  | Pertence a uma UNIDADE e à CLINICA. Realiza os atendimentos. |
| PACIENTE      | Usuário final que entra na fila virtual.                     |

### Requisitos Transversais

- WebApp responsivo e navegável.
- CRUD das entidades centrais do negócio.
- Busca, filtro ou ordenação em pelo menos uma área relevante.
- Persistência de dados via Supabase.
- Validações de entrada com Zod e mensagens de erro compreensíveis.
- Dashboard com resumo e indicadores úteis ao usuário.
- Funcionalidade vinculada à monetização simulada (planos por guichês/atendimentos).
- README, repositório Git e backlog mantidos durante todo o projeto.
- Sem transações financeiras reais e sem coleta de dados sensíveis.

---

## 2. Stack Tecnológica

| Camada              | Tecnologia                          |
| ------------------- | ----------------------------------- |
| Framework           | Next.js 16 (App Router)             |
| Linguagem           | TypeScript (strict mode)            |
| UI / Estilo         | Tailwind CSS v4                     |
| Primitivos UI       | Componentes próprios em `components/ui/` |
| Ícones              | Lucide React                        |
| Backend / BaaS      | Supabase (`@supabase/ssr`)          |
| Gerenciador         | Yarn                                |
| Linting             | ESLint 9 + eslint-config-next       |
| Validação           | Zod                                 |
| Estado Global       | Zustand                             |
| Gráficos            | Recharts                            |
| QR Code             | qrcode.react                        |
| Pagamento simulado  | mercadopago (apenas sandbox)        |

> **Data fetching e tabelas:** não há biblioteca. As consultas acontecem em Server
> Components, através dos `services/` de cada feature, e as tabelas são `<table>`
> com paginação no banco (`PaginacaoLinks` + `ITENS_POR_PAGINA`). Cache e
> revalidação usam os mecanismos nativos do Next (`cache()`, `revalidatePath`,
> `staleTimes`).

### Regras de dependências

- Sempre usar **Yarn** para instalar dependências. Nunca usar npm ou pnpm.
- Prefira soluções nativas do Next.js/React antes de adicionar dependências externas.
- Nunca instale bibliotecas que não constem na tabela acima sem aprovação explícita do usuário.
- Ao adicionar uma nova dependência aprovada, atualize a tabela acima.

---

## 3. Arquitetura e Estrutura de Pastas

> **Arquitetura feature-based:** cada funcionalidade de negócio é agrupada em seu próprio diretório, contendo componentes, hooks, serviços e tipos específicos daquela feature.

```
src/
├── app/                        # App Router — páginas e layouts
│   ├── (auth)/                 # Grupo de rotas autenticadas
│   │   ├── dashboard/          # Painel principal
│   │   ├── clinica/            # Gestão de clínica
│   │   ├── unidades/           # Gestão de unidades
│   │   ├── profissionais/      # Gestão de profissionais
│   │   ├── filas/              # Gestão de filas
│   │   ├── atendimento/        # Painel de atendimento
│   │   └── relatorios/         # Relatórios e métricas
│   ├── (public)/               # Grupo de rotas públicas
│   │   ├── fila/               # Entrada na fila (paciente)
│   │   ├── acompanhar/         # Acompanhamento de posição
│   │   ├── painel/             # Painel de chamada da sala de espera
│   │   └── pagamento-pendente/ # Retomada do cadastro com Pix em aberto
│   ├── api/                    # API Routes
│   ├── layout.tsx              # Layout raiz
│   └── globals.css             # Estilos globais (Tailwind v4)
├── features/                   # Módulos por funcionalidade (feature-based)
│   ├── auth/                   # Autenticação e autorização
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/            # Schemas Zod da feature
│   │   └── types.ts
│   ├── queue/                  # Fila virtual
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── store.ts            # Store Zustand da feature
│   │   └── types.ts
│   ├── clinic/                 # Gestão de clínica e unidades
│   ├── professional/           # Gestão de profissionais
│   ├── attendance/             # Painel de atendimento
│   ├── billing/                # Cobrança simulada dos planos
│   └── reports/                # Relatórios e dashboards
├── components/                 # Componentes compartilhados (globais)
│   └── ui/                     # Componentes primitivos (Button, Input, Card...)
├── lib/                        # Utilitários e clients
│   ├── supabase/               # Clients Supabase (client/server/admin)
│   ├── pagamento/              # Gateway de pagamento (sandbox do Mercado Pago)
│   ├── utils.ts                # Helpers genéricos
│   └── validations.ts          # Schemas Zod compartilhados
├── hooks/                      # Custom hooks compartilhados
├── stores/                     # Stores Zustand globais
├── types/                      # Tipos globais e tipos gerados do Supabase
│   └── supabase.ts             # Tipos auto-gerados (yarn supabase-gen)
└── constants/                  # Constantes e configurações
```

### Regras de arquitetura

- **Feature-based:** cada feature em `src/features/` contém seus próprios `components/`, `hooks/`, `services/`, `schemas/` e `types.ts`. Código só sai da feature se for compartilhado.
- Componentes em `src/components/ui/` são primitivos reutilizáveis e **não devem conter lógica de negócio**.
- Stores Zustand específicas de feature ficam em `src/features/<feature>/store.ts`. Stores globais ficam em `src/stores/`.
- Schemas Zod específicos de feature ficam em `src/features/<feature>/schemas/`. Schemas compartilhados ficam em `src/lib/validations.ts`.
- Chamadas ao Supabase devem ser feitas via `services/` dentro de cada feature, nunca diretamente em componentes.
- Server Components por padrão. Só use `'use client'` quando estritamente necessário (interatividade, hooks de estado, event handlers).
- Toda página deve estar dentro de um route group `(auth)` ou `(public)`.

---

## 4. Padrões de Código

### 4.1 TypeScript

- Nunca use `any`. Use `unknown` quando necessário e faça type narrowing.
- Nunca use `eslint-disable` ou `@ts-ignore`. Corrija o problema na raiz.
- Sempre defina interfaces para props de componentes.
- Exporte tipos junto ao arquivo que os utiliza. Se compartilhados entre features, mova para `src/types/`.
- Use os tipos gerados de `src/types/supabase.ts` para dados do banco.
- Toda entrada de formulário deve ser validada com Zod antes de ser enviada.

### 4.2 Componentes React

- Use function declarations (não arrow functions) para componentes exportados.
- Props devem ser tipadas com interface nomeada `[Componente]Props`.
- Prefira composição sobre herança.
- Componentes devem ter no máximo ~200 linhas. Se maior, divida em subcomponentes.
- Extraia lógica complexa para custom hooks.
- Use `forwardRef` quando o componente precisa expor ref ao pai.

### 4.3 Nomenclatura

| Elemento             | Convenção         | Exemplo                        |
| -------------------- | ----------------- | ------------------------------ |
| Arquivos componentes | PascalCase        | `QueueCard.tsx`                |
| Arquivos utilitários | camelCase         | `formatWaitTime.ts`            |
| Pastas               | kebab-case        | `queue-management/`            |
| Variáveis/funções    | camelCase         | `getQueuePosition()`           |
| Tipos/Interfaces     | PascalCase        | `QueueEntry`                   |
| Constantes globais   | SCREAMING_SNAKE   | `MAX_QUEUE_SIZE`               |
| Handlers de evento   | handle + Ação     | `handleCallNext`, `handlePause`|
| Boolean props        | is/has/should/can | `isWaiting`, `hasBeenCalled`   |
| Schemas Zod          | camelCase + Schema| `createClinicSchema`           |
| Stores Zustand       | use + Nome + Store| `useQueueStore`                |

### 4.4 Importações

- Sempre use alias `@/` para imports absolutos (já configurado no tsconfig). Nunca use imports relativos com `../`.
- Ordem de imports:
  1. React / Next.js
  2. Bibliotecas externas (Zustand, Zod, Recharts, etc.)
  3. `@/` imports (features, components, lib, hooks, types)
  4. Imports relativos (apenas `./` dentro do mesmo diretório, quando inevitável)

---

## 5. Estilo e UI

### 5.1 Design System

- **Design:** Limpo, moderno e profissional. Voltado para ambiente clínico — transmitir confiança e organização.
- **Fonte de títulos:** Montserrat Bold (via `next/font/google`)
- **Fonte de corpo:** Inter (via `next/font/google`)
- **Paleta de cores:**

| Token         | Cor                   | Uso                                      |
| ------------- | --------------------- | ---------------------------------------- |
| primary       | `#295174`             | Botões primários, links, destaques       |
| primary-light | `#569eae`             | Hover, gradientes, badges                |
| gradient      | `#295174 → #569eae`   | Headers, banners, CTAs                   |
| background    | `#FFFFFF`             | Fundo principal                          |
| foreground    | `#000000`             | Texto principal                          |
| muted         | `#6B7280`             | Texto secundário, placeholders           |
| muted-bg      | `#F3F4F6`             | Fundos de cards, áreas secundárias       |
| border        | `#E5E7EB`             | Bordas e separadores                     |
| success       | `#10B981`             | Status positivo, confirmações            |
| warning       | `#F59E0B`             | Alertas, atenção                         |
| danger        | `#EF4444`             | Erros, exclusões, ações destrutivas      |

- Border radius padrão: `12px` para cards, `8px` para botões e inputs, `50%` para avatares.
- Sombras suaves para elevação de cards e modais.
- Use gradiente `primary → primary-light` em headers e elementos de destaque.

### 5.2 Responsividade

- Mobile-first obrigatório.
- Breakpoints padrão do Tailwind: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Todo layout deve funcionar de 320px a 1920px.
- Painel de atendimento deve ter layout otimizado para tablet/desktop (mín. 768px).
- Tela de acompanhamento de fila (paciente) deve ser otimizada para mobile.

### 5.3 Animações

- Use transições CSS suaves (150–300ms `ease-in-out`) para hover, focus e mudanças de estado.
- Animações de entrada para modais, drawers e toasts (fade + slide).
- Transições suaves de posição na fila (quando posição muda).
- Evite animações pesadas que impactem performance. Prefira CSS `transition` e `animation` sobre libs JavaScript.

---

## 6. Supabase e Dados

- Use os clients Supabase de `@/lib/supabase/`. Mantenha clients separados para server (`createServerClient`) e client (`createBrowserClient`).
- Nunca exponha chaves do Supabase no client — use apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` só existe em `lib/supabase/admin.ts`, para operações que a RLS não
  alcança (metadados de um usuário sem clínica). Nunca importe o client admin fora de `services/`.
- Use RLS (Row Level Security) para todas as tabelas.
- Gere tipos atualizados com `yarn supabase-gen` após qualquer mudança no schema.
- Dados sensíveis devem ser acessados apenas via Server Components ou API Routes.
- Use Supabase Realtime para o painel de atendimento e atualização de posição na fila.
- Sem transações financeiras reais. Monetização simulada apenas.
- Sem coleta de dados sensíveis (CPF, dados bancários, etc.).

---

## 7. Tratamento de Erros

- Toda chamada assíncrona deve ter `try/catch` com tratamento adequado.
- Exiba mensagens de erro amigáveis ao usuário via toasts ou alertas inline. Nunca mostre mensagens técnicas ou stack traces.
- Use `error.tsx` do Next.js em cada route group para error boundaries. O conteúdo é o
  componente `TelaErro`, que nunca exibe a mensagem original do erro.
- O carregamento é um `loading.tsx` por route group, renderizando `Carregando`. A frase de
  cada rota fica em `carregando` dentro de `AUTH_ROUTES` — não crie um `loading.tsx` por tela.
- Valide toda entrada de formulário com Zod antes do submit. Exiba erros de validação inline nos campos.
- Em caso de falha de rede, exiba mensagem de "tente novamente" com opção de retry.
- Log de erros no console apenas em desenvolvimento (`process.env.NODE_ENV === 'development'`).

---

## 8. Performance

- Use `next/image` para todas as imagens. Nunca use `<img>` diretamente.
- Use `next/font` para carregar Montserrat e Inter. Nunca use `<link>` para Google Fonts.
- Implemente `loading.tsx` para estados de carregamento em cada rota.
- Lazy load componentes pesados (Recharts, Leaflet, html2pdf) com `dynamic()` do Next.js usando `{ ssr: false }`.
- Prefira Server Components para reduzir bundle do client.
- Use `React.memo` apenas quando houver problemas de performance comprovados, não preventivamente.
- Tabelas com muitos dados devem usar paginação server-side via TanStack Query.

---

## 9. Git e Commits

- Mensagens de commit em **português**, no imperativo.
- Formato: `tipo(escopo): descrição`
  - Exemplo: `feat(fila): adicionar entrada remota na fila virtual`
- Tipos permitidos: `feat`, `fix`, `refactor`, `docs`
- Nunca commite `.env`, `.env.local`, secrets ou `node_modules`.
- Mantenha commits atômicos — uma mudança lógica por commit.

---

## 10. Idioma

- **Código (variáveis, funções, tipos):** Português. Só os nomes de pastas de feature
  (`attendance/`, `clinic/`, `queue/`...) e as APIs do React/Next permanecem em inglês
- **Comentários no código:** Português
- **Commits:** Português
- **Interface do usuário (UI):** Português do Brasil
- **Documentação:** Português
- **Comunicação com a IA:** Português do Brasil

---

## 11. Segurança

- Nunca inclua secrets, API keys ou tokens em código-fonte.
- Use variáveis de ambiente para todas as configurações sensíveis. Apenas `NEXT_PUBLIC_*` pode ser acessado no client.
- Valide e sanitize toda entrada do usuário com Zod, tanto no client (formulários) quanto no server (API Routes).
- Implemente verificação de permissão por papel (CLINICA, PROFISSIONAL, PACIENTE) em cada rota protegida.
- Use RLS do Supabase como camada adicional de segurança no banco.
- Nunca confie apenas em validação client-side — sempre revalide no server.

---

## 12. Comportamento da IA

> Regras sobre **como** a IA deve se comportar ao trabalhar neste projeto.

### Geral

- Sempre pergunte antes de deletar ou substituir código existente significativo.
- Nunca altere arquivos de configuração (`.env`, `next.config`, `tsconfig`) sem pedir.
- Prefira mudanças incrementais e pequenas a refatorações massivas.
- Se não tiver certeza sobre uma decisão arquitetural, apresente opções e peça para o usuário escolher.
- Nunca invente dados de exemplo com informações pessoais reais.
- Sempre preserve comentários existentes que não estejam relacionados à mudança.
- Sempre rode `yarn lint` e `yarn typecheck` antes de considerar uma tarefa concluída.

### Comentários no código

- **Nunca** comente decisões de design, escolha de abordagem ou justificativas ("usamos X porque..."). Comente apenas **o que a função/componente faz**.
- Prefira comentários globais: um bloco no topo do arquivo ou antes de uma função/componente. Nunca comente linha a linha.
- Comentários devem ser curtos e objetivos.
- Exemplo correto:
  ```ts
  // Busca a posição atual do paciente na fila e retorna dados formatados
  export async function getQueuePosition(patientId: string) { ... }
  ```
- Exemplo **incorreto** (nunca faça):
  ```ts
  // Usamos fetch ao invés de axios porque é nativo do browser
  // e o Next.js estende o fetch com cache automático
  const data = await fetch(...) // faz a requisição para a API
  const json = await data.json() // converte para JSON
  ```

---

## 13. Comandos Úteis

```bash
yarn dev          # Servidor de desenvolvimento
yarn build        # Build de produção
yarn lint         # Verificar lint
yarn lint:fix     # Corrigir lint automaticamente
yarn format       # Formatar código com Prettier
yarn typecheck    # Verificar tipos TypeScript
yarn supabase-gen # Gerar tipos do Supabase
```

---

> **Nota:** Este documento deve ser mantido atualizado. Sempre que houver mudanças significativas na stack, convenções ou regras, atualize este arquivo.
