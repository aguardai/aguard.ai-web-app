-- =============================================================================
-- Aguard.ai — 09. Funções RPC
-- Rotas públicas (anon) usam apenas estas funções; nunca as tabelas diretamente.
-- =============================================================================

-- Localiza ou cadastra o paciente pelo telefone normalizado
create or replace function public.fn_upsert_paciente(
  p_nome     text,
  p_telefone text,
  p_email    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digitos text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_id      uuid;
begin
  if length(btrim(coalesce(p_nome, ''))) < 2 then
    raise exception 'Informe o nome completo.' using errcode = 'check_violation';
  end if;

  if v_digitos !~ '^[0-9]{10,13}$' then
    raise exception 'Informe um telefone válido com DDD.' using errcode = 'check_violation';
  end if;

  select id into v_id
    from public.paciente
   where regexp_replace(telefone, '\D', '', 'g') = v_digitos
     and deleted_at is null;

  if v_id is null then
    insert into public.paciente (nome, telefone, email)
    values (btrim(p_nome), v_digitos, nullif(btrim(coalesce(p_email, '')), ''))
    returning id into v_id;
  else
    update public.paciente
       set nome  = btrim(p_nome),
           email = coalesce(nullif(btrim(coalesce(p_email, '')), ''), email)
     where id = v_id;
  end if;

  return v_id;
end;
$$;

-- Entrada do paciente na fila de um guichê (Fila Virtual 1)
create or replace function public.fn_entrar_fila_atendimento(
  p_guiche_id  uuid,
  p_nome       text,
  p_telefone   text,
  p_email      text default null,
  p_prioridade public.prioridade_fila default 'normal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id uuid;
  v_ticket_id   uuid;
  v_ticket      public.atendimento%rowtype;
begin
  v_paciente_id := public.fn_upsert_paciente(p_nome, p_telefone, p_email);

  select * into v_ticket
    from public.atendimento
   where guiche_id = p_guiche_id
     and paciente_id = v_paciente_id
     and status in ('aguardando', 'chamado', 'em_atendimento')
     and deleted_at is null
   limit 1;

  if not found then
    insert into public.atendimento (guiche_id, paciente_id, prioridade)
    values (p_guiche_id, v_paciente_id, p_prioridade)
    returning id into v_ticket_id;
  else
    v_ticket_id := v_ticket.id;
  end if;

  return public.fn_acompanhar_ticket(v_ticket_id);
end;
$$;

-- Entrada do paciente diretamente na fila de um profissional (Fila Virtual 2)
create or replace function public.fn_entrar_fila_consulta(
  p_profissional_id uuid,
  p_unidade_id      uuid,
  p_nome            text,
  p_telefone        text,
  p_email           text default null,
  p_tipo_consulta   text default 'Primeira vez',
  p_prioridade      public.prioridade_fila default 'normal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paciente_id uuid;
  v_ticket_id   uuid;
  v_ticket      public.consulta%rowtype;
begin
  v_paciente_id := public.fn_upsert_paciente(p_nome, p_telefone, p_email);

  select * into v_ticket
    from public.consulta
   where profissional_id = p_profissional_id
     and paciente_id = v_paciente_id
     and status in ('aguardando', 'chamado', 'em_atendimento')
     and deleted_at is null
   limit 1;

  if not found then
    insert into public.consulta (profissional_id, unidade_id, paciente_id, tipo_consulta, prioridade)
    values (p_profissional_id, p_unidade_id, v_paciente_id, p_tipo_consulta, p_prioridade)
    returning id into v_ticket_id;
  else
    v_ticket_id := v_ticket.id;
  end if;

  return public.fn_acompanhar_ticket(v_ticket_id);
end;
$$;

-- Consulta pública da posição do ticket, em qualquer uma das duas filas
create or replace function public.fn_acompanhar_ticket(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_resultado jsonb;
begin
  select jsonb_build_object(
           'tipo_fila', 'atendimento',
           'ticket_id', a.id,
           'senha', a.senha,
           'status', a.status,
           'prioridade', a.prioridade,
           'posicao', a.posicao,
           'estimativa_minutos', public.fn_estimativa_espera_minutos('atendimento', a.guiche_id, a.posicao),
           'aguardando_na_frente', greatest(coalesce(a.posicao, 1) - 1, 0),
           'local', g.nome,
           'tipo_servico', g.tipo_servico,
           'unidade', u.nome,
           'clinica', c.nome,
           'paciente', public.fn_mascarar_nome(pa.nome),
           'entrada_fila', a.entrada_fila,
           'chamado_em', a.chamado_em,
           'proximo_ticket_id', a.consulta_gerada_id
         )
    into v_resultado
    from public.atendimento a
    join public.guiche g   on g.id = a.guiche_id
    join public.unidade u  on u.id = g.unidade_id
    join public.clinica c  on c.id = u.clinica_id
    join public.paciente pa on pa.id = a.paciente_id
   where a.id = p_ticket_id and a.deleted_at is null;

  if v_resultado is not null then
    return v_resultado;
  end if;

  select jsonb_build_object(
           'tipo_fila', 'consulta',
           'ticket_id', co.id,
           'senha', co.senha,
           'status', co.status,
           'prioridade', co.prioridade,
           'posicao', co.posicao,
           'estimativa_minutos', public.fn_estimativa_espera_minutos('consulta', co.profissional_id, co.posicao),
           'aguardando_na_frente', greatest(coalesce(co.posicao, 1) - 1, 0),
           'local', pr.nome,
           'tipo_servico', pr.especialidade,
           'unidade', u.nome,
           'clinica', c.nome,
           'paciente', public.fn_mascarar_nome(pa.nome),
           'entrada_fila', co.entrada_fila,
           'chamado_em', co.chamado_em,
           'tipo_consulta', co.tipo_consulta,
           'proximo_ticket_id', null
         )
    into v_resultado
    from public.consulta co
    join public.profissional pr on pr.id = co.profissional_id
    join public.unidade u       on u.id = co.unidade_id
    join public.clinica c       on c.id = u.clinica_id
    join public.paciente pa     on pa.id = co.paciente_id
   where co.id = p_ticket_id and co.deleted_at is null;

  if v_resultado is null then
    raise exception 'Ticket não encontrado.' using errcode = 'no_data_found';
  end if;

  return v_resultado;
end;
$$;

-- Cancelamento do próprio ticket pelo paciente
create or replace function public.fn_cancelar_ticket(p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_afetados integer;
begin
  update public.atendimento
     set status = 'cancelado'
   where id = p_ticket_id
     and deleted_at is null
     and status in ('aguardando', 'chamado');
  get diagnostics v_afetados = row_count;

  if v_afetados = 0 then
    update public.consulta
       set status = 'cancelado'
     where id = p_ticket_id
       and deleted_at is null
       and status in ('aguardando', 'chamado');
    get diagnostics v_afetados = row_count;
  end if;

  if v_afetados = 0 then
    raise exception 'Não foi possível cancelar: o ticket não está mais na fila.'
      using errcode = 'check_violation';
  end if;

  return public.fn_acompanhar_ticket(p_ticket_id);
end;
$$;

-- Chama o próximo paciente da fila do guichê
create or replace function public.fn_chamar_proximo_atendimento(p_guiche_id uuid)
returns public.atendimento
language plpgsql
set search_path = public
as $$
declare
  v_ticket public.atendimento;
begin
  select * into v_ticket
    from public.atendimento
   where guiche_id = p_guiche_id
     and data_fila = current_date
     and status = 'aguardando'
     and deleted_at is null
   order by prioridade desc, entrada_fila, id
   limit 1
     for update skip locked;

  if not found then
    return null;
  end if;

  update public.atendimento
     set status = 'chamado'
   where id = v_ticket.id
   returning * into v_ticket;

  return v_ticket;
end;
$$;

-- Chama o próximo paciente da fila do profissional
create or replace function public.fn_chamar_proximo_consulta(p_profissional_id uuid)
returns public.consulta
language plpgsql
set search_path = public
as $$
declare
  v_ticket public.consulta;
begin
  select * into v_ticket
    from public.consulta
   where profissional_id = p_profissional_id
     and data_fila = current_date
     and status = 'aguardando'
     and deleted_at is null
   order by prioridade desc, entrada_fila, id
   limit 1
     for update skip locked;

  if not found then
    return null;
  end if;

  update public.consulta
     set status = 'chamado'
   where id = v_ticket.id
   returning * into v_ticket;

  return v_ticket;
end;
$$;

-- Finaliza o atendimento do guichê definindo o encaminhamento para a consulta
create or replace function public.fn_finalizar_atendimento(
  p_atendimento_id  uuid,
  p_encaminhar      boolean default null,
  p_profissional_id uuid default null,
  p_tipo_consulta   text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.atendimento
     set encaminhar_para_consulta = coalesce(p_encaminhar, encaminhar_para_consulta),
         proximo_profissional_id  = coalesce(p_profissional_id, proximo_profissional_id),
         tipo_consulta            = coalesce(p_tipo_consulta, tipo_consulta),
         status                   = 'finalizado'
   where id = p_atendimento_id
     and deleted_at is null
   returning id into v_id;

  if v_id is null then
    raise exception 'Atendimento não encontrado ou já finalizado.' using errcode = 'no_data_found';
  end if;

  return public.fn_acompanhar_ticket(v_id);
end;
$$;

comment on function public.fn_finalizar_atendimento is 'Finaliza o ticket da Fila 1; o trigger de encaminhamento cria automaticamente o ticket da Fila 2.';

-- -----------------------------------------------------------------------------
-- Privilégios de execução
-- -----------------------------------------------------------------------------
revoke all on function
  public.fn_upsert_paciente(text, text, text),
  public.fn_entrar_fila_atendimento(uuid, text, text, text, public.prioridade_fila),
  public.fn_entrar_fila_consulta(uuid, uuid, text, text, text, text, public.prioridade_fila),
  public.fn_acompanhar_ticket(uuid),
  public.fn_cancelar_ticket(uuid),
  public.fn_chamar_proximo_atendimento(uuid),
  public.fn_chamar_proximo_consulta(uuid),
  public.fn_finalizar_atendimento(uuid, boolean, uuid, text)
  from public, anon, authenticated;

grant execute on function
  public.fn_entrar_fila_atendimento(uuid, text, text, text, public.prioridade_fila),
  public.fn_entrar_fila_consulta(uuid, uuid, text, text, text, text, public.prioridade_fila),
  public.fn_acompanhar_ticket(uuid),
  public.fn_cancelar_ticket(uuid)
  to anon, authenticated;

-- Funções usadas pelas views públicas de painel de sala de espera
grant execute on function
  public.fn_mascarar_nome(text),
  public.fn_estimativa_espera_minutos(public.tipo_fila, uuid, integer),
  public.fn_duracao_media_guiche(uuid),
  public.fn_duracao_media_profissional(uuid)
  to anon, authenticated;

grant execute on function
  public.fn_chamar_proximo_atendimento(uuid),
  public.fn_chamar_proximo_consulta(uuid),
  public.fn_finalizar_atendimento(uuid, boolean, uuid, text),
  public.fn_estimativa_espera_minutos(public.tipo_fila, uuid, integer),
  public.fn_duracao_media_guiche(uuid),
  public.fn_duracao_media_profissional(uuid),
  public.fn_clinica_atual(),
  public.fn_papel_atual(),
  public.fn_e_admin_clinica(),
  public.fn_profissional_atual()
  to authenticated;
