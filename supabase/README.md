# Banco de dados — Aguard.ai

Estrutura completa do banco (Supabase / PostgreSQL) derivada do modelo da [Entrega 02](../entregas/entrega-02.md).

## Ordem das migrations

| Arquivo | Conteúdo |
|---|---|
| `20260828000100_extensoes_e_tipos.sql` | Extensões (`pgcrypto`, `pg_trgm`) e ENUMs |
| `20260828000200_funcoes_auditoria.sql` | Auditoria, soft delete e vínculo com `auth.users` |
| `20260828000300_tabelas.sql` | Tabelas, constraints e limites de plano |
| `20260828000400_indices.sql` | Índices, unicidade e índices de busca |
| `20260828000500_funcoes_fila.sql` | Posições, tempos médios e estimativa de espera |
| `20260828000600_automacoes.sql` | Triggers (inclui o encaminhamento Fila 1 → Fila 2) |
| `20260828000700_rls.sql` | RLS, políticas e privilégios |
| `20260828000800_views.sql` | Painéis públicos, relatórios e dashboard |
| `20260828000900_rpc.sql` | Funções RPC das rotas públicas e do painel |
| `20260828001000_realtime_e_rotinas.sql` | Realtime, broadcast e rotinas diárias |
| `20260828001100_privilegios.sql` | Matriz de privilégios explícita (fecha o acesso herdado de `PUBLIC`) |
| `20260828001200_papel_unidade.sql` | Papel `unidade`, escopo de acesso por unidade, relatórios por unidade e limpeza de objetos sem uso |

## Tabelas

| Tabela | Papel no modelo |
|---|---|
| `clinica` | Entidade raiz do tenant |
| `perfil` | Espelho de `auth.users` com papel e clínica — base do RLS |
| `unidade` | Filial da clínica |
| `profissional` | Profissional de saúde (recebeu `clinica_id` para o multi-tenant) |
| `guiche` | Ponto de atendimento — dono da Fila Virtual 1 |
| `paciente` | Usuário final, sem login |
| `locacao` | N:N entre unidade e profissional, com vigência |
| `atendimento` | **Fila Virtual 1** (guichê ↔ paciente) |
| `consulta` | **Fila Virtual 2** (profissional ↔ paciente) |
| `plano_limite` | Limites da monetização simulada |
| `fila_evento` | Trilha append-only das transições de status |

Todas as tabelas de negócio possuem `created_at/by`, `updated_at/by` e `deleted_at/by`. O `DELETE` é
interceptado por trigger e convertido em soft delete; a exclusão de uma clínica ou unidade propaga o
soft delete para os filhos.

## Regras de acesso

| Papel | Acesso |
|---|---|
| `anon` (paciente) | Nenhum acesso direto às tabelas. Apenas RPCs (`fn_entrar_fila_*`, `fn_acompanhar_ticket`, `fn_cancelar_ticket`) e as views anonimizadas de sala de espera |
| `authenticated` / perfil `clinica` | CRUD completo restrito à própria clínica. Único papel que gere clínica, unidades e locações |
| `authenticated` / perfil `unidade` | Tudo que a clínica faz, restrito à sua unidade: guichês, as duas filas, pacientes, histórico e relatórios. Vê os profissionais alocados, mas não os cria nem edita. Não toca em clínica, unidades ou locações |
| `authenticated` / perfil `profissional` | Apenas a própria fila de consulta. Não enxerga a fila de atendimento: o paciente só aparece quando sai do guichê e o encaminhamento o define como responsável |

O escopo é resolvido por `fn_clinica_atual()`, `fn_unidade_atual()`, `fn_e_admin_clinica()`,
`fn_e_admin_unidade()`, `fn_gerencia_unidade()`, `fn_profissional_atual()` e `fn_atua_na_unidade()` —
todas `SECURITY DEFINER` para evitar recursão nas políticas.

`fn_gerencia_unidade(unidade_id)` é o predicado central: verdadeiro para o administrador da clínica dona
da unidade e para o usuário daquela unidade. A maior parte das políticas se resume a chamá-lo.

### Criando um usuário de unidade

1. A pessoa cria a conta no Supabase Auth (o trigger `fn_novo_usuario` gera um perfil sem clínica).
2. O administrador da clínica chama `select public.fn_vincular_usuario('email@exemplo', 'unidade', '<unidade_id>');`

O perfil de unidade tem `perfil.unidade_id` preenchido e `clinica_id` derivado da unidade pelo trigger
`fn_validar_perfil`.

Profissionais são cadastrados e remanejados apenas pela clínica: a UNIDADE enxerga quem está alocado nela
(via locação vigente), mas não cria, edita nem realoca. O login do profissional também é criado pela
clínica, definindo `profissional.user_id` ou chamando `fn_vincular_usuario(email, 'profissional')`.

### Privilégios versus RLS

RLS filtra linhas; `GRANT`/`REVOKE` decidem se o papel chega à tabela ou à função. `REVOKE ... FROM anon`
não remove nada concedido a `PUBLIC`, e o PostgreSQL concede `EXECUTE` a `PUBLIC` em toda função criada —
por isso a migration `20260828001100_privilegios.sql` revoga de `PUBLIC` também e reconstrói a matriz
inteira de forma explícita, além de fechar as *default privileges* do schema. Toda tabela ou função nova
nasce sem acesso: é preciso um `GRANT` explícito para `anon` ou `authenticated`.

Cuidados ao alterar essa matriz:

- Funções usadas dentro de políticas de RLS são avaliadas como o papel que consulta — `authenticated`
  precisa de `EXECUTE` nelas, senão toda a leitura quebra.
- `fn_transicao_valida` é chamada por `fn_status_fila`, que é `SECURITY INVOKER` — mesma exigência.
- O `EXECUTE` de função é verificado contra o papel que consulta, mesmo em view com
  `security_invoker = false`. Por isso `anon` recebe `fn_mascarar_nome` e `fn_estimativa_espera_minutos`.
- Funções de trigger não precisam de concessão: o `EXECUTE` é verificado ao criar o trigger.

## Automações

1. **Fila 1 → Fila 2 (principal):** ao atingir `finalizado` no atendimento, o paciente é inserido
   automaticamente na fila do profissional com status `aguardando`. O destino é
   `atendimento.proximo_profissional_id` ou, na ausência dele, `guiche.profissional_padrao_id`.
   O vínculo fica registrado em `atendimento.consulta_gerada_id` e `consulta.origem_atendimento_id`.
2. **Máquina de estados:** transições fora do diagrama são rejeitadas com mensagem amigável.
3. **Carimbos de tempo:** `chamado_em`, `atendido_em` e `finalizado_em` preenchidos pela mudança de status.
4. **Retorno do ausente:** `ausente → aguardando` renova `entrada_fila`, jogando o paciente para o fim da fila.
5. **Posições:** renumeração automática das duas filas a cada entrada, chamada, ausência ou cancelamento,
   com prioridade `preferencial` à frente.
6. **Senha do ticket:** geração sequencial diária por guichê/profissional (`REC-001`, `RAF-004`).
7. **Limites do plano:** bloqueio de unidades, guichês, profissionais e volume mensal de tickets.
8. **Locação vigente:** consulta só é criada para profissional com locação ativa na unidade.
9. **Auditoria de fila:** cada transição gera um registro imutável em `fila_evento`.
10. **Realtime:** broadcast anonimizado nos canais `atendimento:guiche:{id}` e `consulta:profissional:{id}`.
11. **Rotina diária:** encerra tickets abandonados de dias anteriores e desativa locações vencidas.

## Massa de dados (`seed.sql`)

Somente para desenvolvimento — o script apaga fisicamente a carga anterior antes de recarregar.

| Conjunto | Volume |
|---|---|
| Clínicas | 2 (`business` e `pro`, para comparar consumo de plano) |
| Unidades / guichês / profissionais | 5 / 13 / 16 |
| Locações | 22, incluindo profissionais atuando em duas unidades |
| Pacientes | 600 |
| Histórico | 90 dias corridos (~64 dias úteis), ~14 mil atendimentos e ~6 mil consultas |
| `fila_evento` | ~65 mil transições |
| Fila do dia | ~130 tickets criados pelo caminho real da aplicação |

Características da massa: volume por dia da semana (segunda mais cheia, sexta mais vazia), 15% de
pacientes preferenciais, distribuição realista de status (~86% finalizados, ~7% cancelados, ~7% ausentes),
tempos de espera e de atendimento variáveis por guichê e profissional, e ~70% dos atendimentos de recepção
gerando consulta pelo encaminhamento automático.

As filas do dia corrente são criadas pelas RPCs reais (`fn_entrar_fila_atendimento`,
`fn_chamar_proximo_*`, `fn_finalizar_atendimento`, `fn_cancelar_ticket`), com todos os triggers ativos —
exercitando senha, posição, máquina de estados e o encaminhamento Fila 1 → Fila 2. O histórico é carregado
em massa com os triggers desligados, para desempenho e para controlar os carimbos de tempo retroativos.

Também ficam prontos cenários de auditoria: um guichê desativado, um profissional desligado (com cascata
de soft delete nas locações) e uma locação encerrada por vigência.

### Consultas rápidas de validação

```sql
-- Volume e tempos por dia e por fila
select * from public.vw_metricas_diarias order by data_fila desc, tipo_fila limit 30;

-- Indicadores do dia e consumo do plano
select * from public.vw_dashboard_clinica;
select * from public.vw_uso_plano;

-- A automação Fila 1 -> Fila 2 amarrou os dois tickets?
select a.senha as senha_guiche, c.senha as senha_consulta, p.nome, c.status
  from public.atendimento a
  join public.consulta c on c.id = a.consulta_gerada_id
  join public.paciente p on p.id = a.paciente_id
 where a.data_fila = current_date;

-- Fila viva de hoje, já ordenada e posicionada pelos triggers
select guiche_nome, senha, paciente, status, posicao, estimativa_minutos
  from public.vw_fila_atendimento_publica
 order by guiche_nome, posicao nulls last;

-- Trilha de auditoria de um ticket
select status_de, status_para, automatico, created_at
  from public.fila_evento
 where ticket_id = '<uuid>' order by created_at;
```

## Views

- `vw_fila_atendimento_publica` / `vw_fila_consulta_publica` — painel de sala de espera, nomes mascarados.
- `vw_fila_unificada` — fila única do profissional (RN 4).
- `vw_relatorio_tickets`, `vw_metricas_diarias` — base dos relatórios de tempo médio e volume.
- `vw_dashboard_clinica` — indicadores do dia.
- `vw_uso_plano` — consumo versus limite do plano contratado.
