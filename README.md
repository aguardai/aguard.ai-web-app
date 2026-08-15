# 🛡️ Aguard.ai

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

- **Clínicas** — administradores que gerenciam unidades e profissionais
- **Profissionais de saúde** — atendentes que chamam pacientes e gerenciam a fila
- **Pacientes** — usuários que entram na fila e acompanham sua posição

---

## ✨ Funcionalidades

- 🏥 Cadastro de clínicas, unidades, guichês e profissionais
- 📋 Entrada do paciente em fila virtual
- 📊 Exibição de posição e tempo estimado de espera
- 🔔 Chamada do próximo paciente por atendente
- ⏸️ Pausa, ausência e cancelamento de atendimento
- 📺 Painel de atendimento em tempo real
- 📈 Relatórios de tempo médio e volume de atendimentos
- 💼 Planos institucionais simulados (por guichês/atendimentos)

---

## 🏗️ Arquitetura

O projeto segue uma **arquitetura feature-based**, onde cada funcionalidade de negócio é agrupada em seu próprio diretório com componentes, hooks, serviços e tipos específicos.

```
src/
├── app/                    # App Router (páginas e layouts)
│   ├── (auth)/             # Rotas autenticadas
│   └── (public)/           # Rotas públicas
├── features/               # Módulos por funcionalidade
│   ├── auth/               # Autenticação
│   ├── queue/              # Fila virtual
│   ├── clinic/             # Gestão de clínica e unidades
│   ├── professional/       # Gestão de profissionais
│   ├── attendance/         # Painel de atendimento
│   └── reports/            # Relatórios
├── components/ui/          # Componentes primitivos compartilhados
├── lib/                    # Utilitários e clients (Supabase)
├── hooks/                  # Custom hooks compartilhados
├── stores/                 # Stores Zustand globais
├── types/                  # Tipos globais e gerados do Supabase
└── constants/              # Constantes e configurações
```

---

## 🛠️ Stack Tecnológica

| Camada           | Tecnologia                        |
| ---------------- | --------------------------------- |
| Framework        | Next.js 16 (App Router)           |
| Linguagem        | TypeScript (strict mode)          |
| UI / Estilo      | Tailwind CSS v4                   |
| Primitivos UI    | Radix UI                          |
| Ícones           | Lucide React                      |
| Backend / BaaS   | Supabase                          |
| Validação        | Zod                               |
| Estado Global    | Zustand                           |
| Gráficos         | Recharts                          |
| Tabelas          | TanStack Table                    |
| Data Fetching    | TanStack Query                    |
| Upload de Imagem | react-easy-crop                   |
| Mapas            | Leaflet + react-leaflet           |
| Exportação PDF   | html2pdf.js                       |
| QR Code          | qrcode.react                      |

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
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
```

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

- **Código:** Inglês
- **Comentários:** Português
- **Commits:** Português, formato `tipo(escopo): descrição`
  - Tipos: `feat`, `fix`, `refactor`, `docs`
- **UI:** Português do Brasil
- **Gerenciador de pacotes:** Yarn (exclusivo)

---

## 📄 Licença

Este projeto é de uso privado e não possui licença pública.
