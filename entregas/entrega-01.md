# 🚶 Aguard.ai — Entrega 01

> **Disciplina:** Engenharia de Software 3
>
> **Projeto:** Aguard.ai — Fila Virtual para Clínicas

## 1. Visão do Produto

Solução para clínicas e serviços de saúde que enfrentam filas presenciais longas e desorganizadas, causando insatisfação de pacientes e ineficiência operacional. O Aguard.ai é um WebApp de fila virtual que permite ao paciente entrar na fila remotamente, acompanhar sua posição e tempo estimado de espera em tempo real, enquanto oferece à clínica um painel completo de gestão de atendimento. 

Diferente de sistemas tradicionais de senha com painel físico, o Aguard.ai elimina a necessidade de presença física na sala de espera, oferece estimativas inteligentes de tempo, e dá à clínica dados e relatórios sobre seu fluxo de atendimento, tudo acessível via navegador, sem instalação de aplicativos.

## 2. Personas

### Persona 1 — Camila Rezende (Administradora da Clínica)

| Atributo         | Detalhe                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| **Idade**        | 42 anos                                                                 |
| **Cargo**        | Diretora e proprietária de uma clínica de médio porte                   |
| **Perfil técnico** | Usa tecnologia no dia a dia (WhatsApp, sistemas de agenda), mas não é técnica |
| **Motivação**    | Reduzir reclamações de pacientes sobre tempo de espera e organizar melhor o fluxo de atendimento |
| **Frustrações**  | Sala de espera lotada gera má impressão; não tem dados sobre tempo médio de atendimento; secretárias sobrecarregadas gerenciando filas manualmente |
| **Objetivo**     | Ter uma visão centralizada do atendimento, saber quanto tempo cada profissional leva, e oferecer uma experiência moderna e digital ao paciente |
| **Cenário de uso** | Acessa o dashboard pela manhã para verificar volume de atendimentos do dia anterior, configura novos guichês quando contrata um profissional, e analisa relatórios semanais |

### Persona 2 — Rafael Mendes (Profissional de Saúde)

| Atributo         | Detalhe                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| **Idade**        | 38 anos                                                                 |
| **Cargo**        | Dentista em uma clínica odontológica com 3 consultórios                 |
| **Perfil técnico** | Usa sistemas de prontuário eletrônico e agenda digital no dia a dia   |
| **Motivação**    | Focar no atendimento clínico sem se preocupar com gestão manual da fila de pacientes |
| **Frustrações**  | Pacientes chegam atrasados ou fora de ordem; não sabe se o próximo paciente está presente; tempo ocioso entre consultas quando paciente não aparece |
| **Objetivo**     | Ter um painel simples para chamar o próximo paciente, marcar ausências e pausar a fila entre atendimentos |
| **Cenário de uso** | Entre uma consulta e outra, abre o painel de atendimento, clica em "chamar próximo", verifica se o paciente compareceu, e pausa a fila no horário de almoço |

### Persona 3 — Lucas Martins (Paciente)

| Atributo         | Detalhe                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| **Idade**        | 28 anos                                                                 |
| **Perfil técnico** | Nativo digital, usa apps para tudo                                    |
| **Motivação**    | Não perder tempo na sala de espera; saber exatamente quando será atendido |
| **Frustrações**  | Chega na clínica e descobre que vai esperar 1h sem previsão; não pode sair do local para resolver outras coisas |
| **Objetivo**     | Entrar na fila de casa, acompanhar sua posição pelo celular e chegar na clínica apenas quando estiver próximo de ser chamado |
| **Cenário de uso** | Recebe um link/QR Code da clínica, entra na fila pelo celular, acompanha a posição enquanto está no trabalho, e sai quando faltam 2 pessoas |

## 3. Backlog de Histórias de Usuário

> Formato: **Como** [persona], **quero** [ação], **para** [benefício].

### Autenticação e Cadastro

| #  | História | Prioridade |
| -- | -------- | ---------- |
| 01 | **Como** administradora da clínica, **quero** me cadastrar e fazer login na plataforma, **para** acessar o painel de gestão. | Alta |
| 02 | **Como** administradora, **quero** cadastrar minha clínica com nome, endereço e informações de contato, **para** que ela esteja registrada no sistema. | Alta |
| 03 | **Como** administradora, **quero** cadastrar unidades (filiais) vinculadas à minha clínica, **para** gerenciar múltiplos locais de atendimento. | Alta |

### Gestão de Profissionais e Guichês

| #  | História | Prioridade |
| -- | -------- | ---------- |
| 04 | **Como** administradora, **quero** cadastrar profissionais e vinculá-los a unidades, **para** que possam atender pacientes na fila. | Alta |
| 05 | **Como** administradora, **quero** cadastrar guichês e tipos de serviço em cada unidade, **para** organizar os pontos de atendimento. | Alta |

### Fila Virtual (Paciente)

| #  | História | Prioridade |
| -- | -------- | ---------- |
| 06 | **Como** paciente, **quero** entrar em uma fila virtual de uma clínica via link ou QR Code, **para** garantir meu lugar sem estar presencialmente. | Alta |
| 07 | **Como** paciente, **quero** ver minha posição atual na fila e o tempo estimado de espera, **para** planejar quando devo ir à clínica. | Alta |
| 08 | **Como** paciente, **quero** ser notificado quando estiver próximo de ser chamado, **para** não perder minha vez. | Média |
| 09 | **Como** paciente, **quero** cancelar minha entrada na fila, **para** desistir do atendimento quando necessário. | Alta |

### Painel de Atendimento (Profissional)

| #  | História | Prioridade |
| -- | -------- | ---------- |
| 10 | **Como** atendente, **quero** visualizar a fila de espera e chamar o próximo paciente com um clique, **para** agilizar o atendimento. | Alta |
| 11 | **Como** atendente, **quero** marcar um paciente como ausente se ele não comparecer quando chamado, **para** seguir com a fila. | Alta |
| 12 | **Como** atendente, **quero** pausar a fila temporariamente (almoço, intervalo), **para** que novos pacientes não sejam chamados durante a pausa. | Média |

### Dashboard e Relatórios

| #  | História | Prioridade |
| -- | -------- | ---------- |
| 13 | **Como** administradora, **quero** ver um dashboard com indicadores do dia (total atendidos, tempo médio, fila atual), **para** acompanhar a operação em tempo real. | Média |
| 14 | **Como** administradora, **quero** gerar relatórios de tempo médio de espera e volume de atendimentos por período, **para** tomar decisões baseadas em dados. | Média |

### Monetização

| #  | História | Prioridade |
| -- | -------- | ---------- |
| 15 | **Como** administradora, **quero** visualizar planos disponíveis com limites de guichês e atendimentos, **para** entender os custos e escolher o plano adequado à minha clínica. | Baixa |

## 4. Critérios para Definição do MVP

O MVP do Aguard.ai será considerado completo quando atender todos os três critérios abaixo:

### Critério 1 — Ciclo Completo da Fila Virtual

> O paciente consegue entrar na fila remotamente, acompanhar sua posição em tempo real e ser chamado pelo atendente, completando o fluxo ponta a ponta sem intervenção manual.

**Validação:** Um paciente entra na fila via link, vê sua posição atualizar conforme outros são atendidos, e o atendente consegue chamá-lo pelo painel.

### Critério 2 — Gestão Básica de Entidades

> A administradora consegue cadastrar clínica, unidade, guichê e profissional, e o profissional consegue gerenciar a fila (chamar próximo, marcar ausência, pausar).

**Validação:** CRUD funcional de clínica, unidade e profissional. Painel de atendimento operacional com ações de chamar, pausar e marcar ausência.

### Critério 3 — Visibilidade Operacional

> A administradora tem acesso a um dashboard com indicadores básicos (total de atendimentos, tempo médio de espera, fila atual) que permitam avaliar a operação.

**Validação:** Dashboard com pelo menos 3 indicadores numéricos atualizados, refletindo dados reais dos atendimentos realizados.

## 5. Hipótese de Monetização

### Modelo: Planos por Capacidade (SaaS B2B)

A monetização do Aguard.ai será baseada em planos institucionais escalonados, cobrados da clínica com base no número de guichês ativos e/ou volume de atendimentos mensais.

| Plano        | Guichês | Atendimentos/mês | Preço |
| ------------ | ------- | ----------------- | -------------- |
| **Starter**  | Até 2   | Até 200           | Gratuito       |
| **Pro**      | Até 5   | Até 1.000         | R$ 99/mês      |
| **Business** | Até 15  | Até 5.000         | R$ 249/mês     |
| **Enterprise** | Ilimitado | Ilimitado      | Sob consulta   |

### Justificativa

- **B2B com receita recorrente:** clínicas pagam mensalidade previsível, proporcional ao uso.
- **Freemium como porta de entrada:** plano gratuito permite validação do produto sem barreira, incentivando upgrade conforme a clínica cresce.
- **Escalabilidade natural:** o gatilho de upgrade (mais guichês ou atendimentos) está diretamente ligado ao crescimento do negócio do cliente.
- **Upsell futuro:** funcionalidades premium como relatórios avançados, integrações com agenda, notificações por WhatsApp e suporte prioritário podem ser adicionados em planos superiores.
