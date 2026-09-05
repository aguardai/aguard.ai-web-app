-- =============================================================================
-- Aguard.ai — 14. Fecha as views de painel de sala de espera
--
-- vw_fila_atendimento_publica e vw_fila_consulta_publica foram criadas apenas com
-- security_barrier. Sem security_invoker a view executa com os privilégios do dono
-- e o RLS das tabelas de base não é aplicado: com a chave anon era possível ler a
-- fila de qualquer clínica, não só a da unidade endereçada.
--
-- As views passam a respeitar o RLS de quem consulta, e o painel anônimo passa a
-- usar RPC endereçada, como as demais rotas públicas do projeto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Painel da sala de espera por unidade (Fila 1)
-- -----------------------------------------------------------------------------
create or replace function public.fn_painel_fila_atendimento(p_unidade_id uuid)
returns table (
  ticket_id          uuid,
  senha              text,
  paciente           text,
  status             public.status_fila,
  prioridade         public.prioridade_fila,
  posicao            integer,
  guiche_nome        text,
  entrada_fila       timestamptz,
  chamado_em         timestamptz,
  estimativa_minutos integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.senha,
    public.fn_mascarar_nome(p.nome),
    a.status,
    a.prioridade,
    a.posicao,
    g.nome,
    a.entrada_fila,
    a.chamado_em,
    public.fn_estimativa_espera_minutos('atendimento', a.unidade_id, a.posicao)
  from public.atendimento a
  join public.unidade u     on u.id = a.unidade_id
  join public.clinica c     on c.id = u.clinica_id
  join public.paciente p    on p.id = a.paciente_id
  left join public.guiche g on g.id = a.guiche_id
  where a.unidade_id = p_unidade_id
    and u.ativa and u.deleted_at is null
    and c.ativa and c.deleted_at is null
    and a.deleted_at is null
    and a.data_fila = current_date
    and a.status in ('aguardando', 'chamado', 'em_atendimento')
  order by a.posicao nulls last, a.entrada_fila;
$$;

comment on function public.fn_painel_fila_atendimento is 'Fila do dia de uma unidade para painel de sala de espera. Exige o id da unidade e não expõe telefone, e-mail nem sobrenome completo.';

-- -----------------------------------------------------------------------------
-- 2. Painel da sala de espera por profissional (Fila 2)
-- -----------------------------------------------------------------------------
create or replace function public.fn_painel_fila_consulta(p_profissional_id uuid)
returns table (
  ticket_id          uuid,
  senha              text,
  paciente           text,
  status             public.status_fila,
  prioridade         public.prioridade_fila,
  posicao            integer,
  tipo_consulta      text,
  unidade_nome       text,
  entrada_fila       timestamptz,
  chamado_em         timestamptz,
  estimativa_minutos integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    co.id,
    co.senha,
    public.fn_mascarar_nome(p.nome),
    co.status,
    co.prioridade,
    co.posicao,
    co.tipo_consulta,
    u.nome,
    co.entrada_fila,
    co.chamado_em,
    public.fn_estimativa_espera_minutos('consulta', co.profissional_id, co.posicao)
  from public.consulta co
  join public.profissional pr on pr.id = co.profissional_id
  join public.unidade u       on u.id = co.unidade_id
  join public.clinica c       on c.id = u.clinica_id
  join public.paciente p      on p.id = co.paciente_id
  where co.profissional_id = p_profissional_id
    and pr.ativo and pr.deleted_at is null
    and u.ativa and u.deleted_at is null
    and c.ativa and c.deleted_at is null
    and co.deleted_at is null
    and co.data_fila = current_date
    and co.status in ('aguardando', 'chamado', 'em_atendimento')
  order by co.posicao nulls last, co.entrada_fila;
$$;

comment on function public.fn_painel_fila_consulta is 'Fila do dia de um profissional para painel de sala de espera. Exige o id do profissional e não expõe telefone, e-mail nem sobrenome completo.';

-- -----------------------------------------------------------------------------
-- 3. As views passam a respeitar o RLS de quem consulta
-- -----------------------------------------------------------------------------
alter view public.vw_fila_atendimento_publica set (security_invoker = true);
alter view public.vw_fila_consulta_publica    set (security_invoker = true);

comment on view public.vw_fila_atendimento_publica is 'Fila do dia por unidade, com nome do paciente mascarado. Respeita o RLS: cada gestor vê apenas o próprio escopo. O painel anônimo usa fn_painel_fila_atendimento.';
comment on view public.vw_fila_consulta_publica is 'Fila do dia por profissional, com nome do paciente mascarado. Respeita o RLS: cada gestor vê apenas o próprio escopo. O painel anônimo usa fn_painel_fila_consulta.';

-- -----------------------------------------------------------------------------
-- 4. Privilégios
-- -----------------------------------------------------------------------------
revoke all on public.vw_fila_atendimento_publica, public.vw_fila_consulta_publica
  from public, anon, authenticated;

grant select on public.vw_fila_atendimento_publica, public.vw_fila_consulta_publica
  to authenticated;

revoke all on function
  public.fn_painel_fila_atendimento(uuid),
  public.fn_painel_fila_consulta(uuid)
  from public, anon, authenticated;

grant execute on function
  public.fn_painel_fila_atendimento(uuid),
  public.fn_painel_fila_consulta(uuid)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Painel unificado da sala de espera
--
-- O paciente é atendido no guichê e volta a esperar pela consulta, então a TV da
-- sala precisa das duas filas na mesma lista. fn_painel_fila_consulta é endereçada
-- por profissional e o visitante anônimo não pode descobrir quem atende na
-- unidade, por isso a união acontece aqui dentro.
-- -----------------------------------------------------------------------------
create or replace function public.fn_painel_unidade(p_unidade_id uuid)
returns table (
  tipo_fila          public.tipo_fila,
  ticket_id          uuid,
  senha              text,
  paciente           text,
  status             public.status_fila,
  prioridade         public.prioridade_fila,
  posicao            integer,
  origem             text,
  entrada_fila       timestamptz,
  chamado_em         timestamptz,
  estimativa_minutos integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    'atendimento'::public.tipo_fila,
    a.id,
    a.senha,
    public.fn_mascarar_nome(p.nome),
    a.status,
    a.prioridade,
    a.posicao,
    g.nome,
    a.entrada_fila,
    a.chamado_em,
    public.fn_estimativa_espera_minutos('atendimento', a.unidade_id, a.posicao)
  from public.atendimento a
  join public.unidade u     on u.id = a.unidade_id
  join public.clinica c     on c.id = u.clinica_id
  join public.paciente p    on p.id = a.paciente_id
  left join public.guiche g on g.id = a.guiche_id
  where a.unidade_id = p_unidade_id
    and u.ativa and u.deleted_at is null
    and c.ativa and c.deleted_at is null
    and a.deleted_at is null
    and a.data_fila = current_date
    and a.status in ('aguardando', 'chamado', 'em_atendimento')

  union all

  select
    'consulta'::public.tipo_fila,
    co.id,
    co.senha,
    public.fn_mascarar_nome(p.nome),
    co.status,
    co.prioridade,
    co.posicao,
    pr.nome,
    co.entrada_fila,
    co.chamado_em,
    public.fn_estimativa_espera_minutos('consulta', co.profissional_id, co.posicao)
  from public.consulta co
  join public.profissional pr on pr.id = co.profissional_id
  join public.unidade u       on u.id = co.unidade_id
  join public.clinica c       on c.id = u.clinica_id
  join public.paciente p      on p.id = co.paciente_id
  where co.unidade_id = p_unidade_id
    and pr.ativo and pr.deleted_at is null
    and u.ativa and u.deleted_at is null
    and c.ativa and c.deleted_at is null
    and co.deleted_at is null
    and co.data_fila = current_date
    and co.status in ('aguardando', 'chamado', 'em_atendimento')

  -- Por posição: os nomes das colunas de saída colidem com os parâmetros OUT
  -- e não dá para qualificar com alias dentro de um union
  order by 10 desc nulls last, 7 nulls last, 9;
$$;

comment on function public.fn_painel_unidade is 'Fila do dia da unidade, recepção e consulta na mesma lista, para o painel da sala de espera. Não expõe telefone, e-mail nem sobrenome completo.';

revoke all on function public.fn_painel_unidade(uuid) from public, anon, authenticated;
grant execute on function public.fn_painel_unidade(uuid) to anon, authenticated;
