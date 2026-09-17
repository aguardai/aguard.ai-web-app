# 🖥️ Aguard.ai

**Fila virtual inteligente para clínicas.**

Aguard.ai permite que pacientes entrem em filas virtuais de forma remota, acompanhem sua posição e tempo estimado de espera em tempo real, enquanto clínicas gerenciam o atendimento de forma eficiente.

---

## 📋 Sobre o Projeto

### Problema

Pacientes perdem tempo esperando atendimento presencialmente em clínicas e outros serviços de saúde, sem visibilidade sobre posição na fila ou tempo estimado de espera.

### Solução

Uma plataforma web que digitaliza a fila de atendimento, permitindo:

- **Entrada remota** na fila virtual
- **Acompanhamento em tempo real** de posição e tempo estimado
- **Gestão completa** do fluxo de atendimento pela clínica

### Público-alvo

- **Clínicas** — administradores que gerenciam unidades, guichês e profissionais
- **Unidades** — recepção que chama as senhas no guichê e encaminha o paciente
- **Profissionais de saúde** — atendem a fila de consulta do próprio consultório
- **Pacientes** — usuários que entram na fila e acompanham sua posição

---

## ✨ Funcionalidades

- 🏥 Cadastro de clínicas, unidades, guichês e profissionais
- 🔗 Entrada do paciente na fila por link ou QR Code, sem instalar aplicativo
- 📊 Posição na fila e tempo estimado de espera, atualizados sozinhos
- 🔔 Chamada do próximo paciente pelo guichê e pelo consultório
- ➡️ Encaminhamento da recepção para o profissional escolhido
- 🖥️ Painel de chamada da sala de espera, com as duas filas na mesma tela
- 🚫 Ausência e cancelamento de atendimento
- 📈 Relatórios de tempo médio e volume de atendimentos
- 💼 Planos institucionais simulados (por guichês/atendimentos)

---

## 🔄 Fluxo de Atendimento

O atendimento acontece em **duas filas encadeadas**, uma por etapa da visita.

### Fila 1 — Recepção

1. O paciente aponta a câmera para o QR Code da unidade (ou abre o link) e cai em
   `/fila/[unidadeId]`. Informa nome, telefone e prioridade — não escolhe guichê.
2. Recebe uma senha e acompanha a posição em `/acompanhar/[ticketId]`.
3. A fila é **compartilhada pela unidade**: qualquer guichê livre chama o próximo.
4. O atendente inicia o atendimento e, ao encerrar, escolhe no modal para qual
   profissional o paciente segue.

### Fila 2 — Consulta

5. Ao finalizar a recepção, o sistema cria a senha da consulta na fila do
   profissional escolhido. A tela de acompanhamento do paciente passa sozinha
   para essa nova senha.
6. O profissional chama, inicia e finaliza o atendimento em `/atendimento`.

### Sala de espera

7. `/painel/[unidadeId]` é a tela pública para a TV da sala de espera: mostra a
   senha chamada no momento, as últimas chamadas das duas filas e o QR Code de
   entrada. Atualiza em tempo real, sem login.

---

## 🏗️ Arquitetura

O projeto segue uma **arquitetura feature-based**, onde cada funcionalidade de negócio é agrupada em seu próprio diretório com componentes, hooks, serviços e tipos específicos.

```
src/
├── app/                    # App Router (páginas e layouts)
│   ├── (auth)/             # Rotas autenticadas
│   │   ├── dashboard/      # Indicadores + painel de chamada da recepção
│   │   ├── clinica/        # Dados da clínica e plano
│   │   ├── unidades/       # Gestão de unidades
│   │   ├── guiches/        # Gestão de guichês
│   │   ├── profissionais/  # Gestão de profissionais
│   │   ├── locacoes/       # Vínculo profissional ↔ unidade
│   │   ├── filas/          # Monitoramento das duas filas
│   │   ├── atendimento/    # Fila do profissional + histórico
│   │   └── relatorios/     # Relatórios e métricas
│   └── (public)/           # Rotas públicas
│       ├── fila/           # Entrada do paciente na fila
│       ├── acompanhar/     # Acompanhamento da senha
│       ├── painel/         # Painel da sala de espera (TV)
│       └── pagamento-pendente/ # Retomada do cadastro com Pix em aberto
├── features/               # Módulos por funcionalidade
│   ├── auth/               # Autenticação e papéis
│   ├── queue/              # Fila virtual (paciente e painel)
│   ├── clinic/             # Gestão de clínica, unidades e guichês
│   ├── professional/       # Gestão de profissionais e locações
│   ├── attendance/         # Painéis de chamada das duas filas
│   ├── billing/            # Cobrança simulada dos planos
│   └── reports/            # Relatórios e dashboards
├── components/ui/          # Componentes primitivos compartilhados
├── lib/                    # Utilitários, clients Supabase, gateway de pagamento e validações
├── hooks/                  # Custom hooks compartilhados
├── stores/                 # Stores Zustand globais
├── types/                  # Tipos globais e gerados do Supabase
└── constants/              # Constantes e configurações
```

As migrations e o seed do banco ficam em `supabase/`.

---

## 🛠️ Stack Tecnológica

| Camada         | Tecnologia                               |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 16 (App Router)                  |
| Linguagem      | TypeScript (strict mode)                 |
| UI / Estilo    | Tailwind CSS v4                          |
| Primitivos UI  | Componentes próprios em `components/ui/` |
| Ícones         | Lucide React                             |
| Backend / BaaS | Supabase (`@supabase/ssr`)               |
| Validação      | Zod                                      |
| Estado Global  | Zustand                                  |
| Gráficos       | Recharts                                 |
| QR Code        | qrcode.react                             |
| Pagamento      | mercadopago (apenas sandbox)             |

> **Data fetching e tabelas não usam biblioteca.** As consultas acontecem em
> Server Components, através dos `services/` de cada feature, e as tabelas são
> `<table>` com paginação no banco. Cache e revalidação usam os mecanismos
> nativos do Next.

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v20+)
- [Yarn](https://yarnpkg.com/)
- Conta no [Supabase](https://supabase.com/) com projeto configurado

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/aguard.ai-web-app.git
cd aguard.ai-web-app

# Instalar dependências
yarn install
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
MERCADO_PAGO_ACCESS_TOKEN_TEST=seu_token_de_teste_aqui
```

A cobrança dos planos é simulada no ambiente de testes do Mercado Pago: nenhum
valor real é movimentado. Sem o token, a troca para um plano pago é recusada.

### Execução

```bash
# Servidor de desenvolvimento
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## 📦 Scripts Disponíveis

| Comando           | Descrição                         |
| ----------------- | --------------------------------- |
| `yarn dev`        | Servidor de desenvolvimento       |
| `yarn build`      | Build de produção                 |
| `yarn start`      | Iniciar servidor de produção      |
| `yarn lint`       | Verificar lint                    |
| `yarn lint:fix`   | Corrigir lint automaticamente     |
| `yarn format`     | Formatar código com Prettier      |
| `yarn typecheck`  | Verificar tipos TypeScript        |
| `yarn supabase-gen` | Gerar tipos do Supabase         |

---

## 🎨 Design System

| Token         | Cor         | Uso                          |
| ------------- | ----------- | ---------------------------- |
| Primary       | `#295174`   | Botões, links, destaques     |
| Primary Light | `#569eae`   | Hover, gradientes, badges    |
| Background    | `#FFFFFF`   | Fundo principal              |
| Foreground    | `#000000`   | Texto principal              |
| Success       | `#10B981`   | Confirmações                 |
| Warning       | `#F59E0B`   | Alertas                      |
| Danger        | `#EF4444`   | Erros, ações destrutivas     |

- **Títulos:** Montserrat Bold
- **Corpo:** Inter

---

## 👥 Entidades e Papéis

| Entidade     | Descrição                                                |
| ------------ | -------------------------------------------------------- |
| CLINICA      | Entidade pai. Administra a clínica e suas unidades.      |
| UNIDADE      | Pertence a uma CLINICA. Filial ou local de atendimento.  |
| PROFISSIONAL | Pertence a UNIDADE e CLINICA. Realiza os atendimentos.   |
| PACIENTE     | Usuário final que entra na fila virtual.                 |

---

## 📝 Convenções

- **Código:** Português
- **Comentários:** Português
- **Commits:** Português, formato `tipo(escopo): descrição`
  - Tipos: `feat`, `fix`, `refactor`, `docs`
- **UI:** Português do Brasil
- **Gerenciador de pacotes:** Yarn (exclusivo)
