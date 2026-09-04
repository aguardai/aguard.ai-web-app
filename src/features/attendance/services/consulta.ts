import { createClient } from '@/lib/supabase/server';
import type {
  ConsultaComPaciente,
  ResultadoFila,
  StatusFila,
  TicketFila,
} from '@/features/attendance/types';

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[attendance] ${contexto}`, erro);
  }
}

async function resolverProfissionalAtual(supabase: SupabaseServidor) {
  const { data, error } = await supabase.rpc('fn_profissional_atual');

  if (error || !data) {
    registrarErro('resolução do profissional atual', error);
    return null;
  }

  return data;
}

// 1. FILA DE ATENDIMENTO (Fila Virtual 2) - Cruzamento robusto com vw_fila_unificada
export async function listarFilaConsulta(): Promise<TicketFila[]> {
  const supabase = await createClient();
  const profissionalId = await resolverProfissionalAtual(supabase);

  if (!profissionalId) {
    return [];
  }

  const [{ data: painel, error: erroPainel }, { data: unificada, error: erroUnificada }] =
    await Promise.all([
      supabase.rpc('fn_painel_fila_consulta', {
        p_profissional_id: profissionalId,
      }),
      supabase
        .from('vw_fila_unificada')
        .select('ticket_id, paciente_nome')
        .eq('profissional_id', profissionalId),
    ]);

  if (erroPainel) {
    registrarErro('painel da fila', erroPainel);
    return [];
  }

  if (erroUnificada) {
    registrarErro('nomes da fila (vw_fila_unificada)', erroUnificada);
  }

  const nomePorTicket = new Map<string, string>();
  (unificada ?? []).forEach((linha) => {
    if (linha.ticket_id && linha.paciente_nome) {
      nomePorTicket.set(linha.ticket_id, linha.paciente_nome);
    }
  });

  return (painel ?? []).map((item: TicketFila) => {
    const nomeReal = nomePorTicket.get(item.ticket_id);
    return {
      ...item,
      paciente: nomeReal || item.paciente,
    };
  });
}

// 2. HISTÓRICO: Busca consultas finalizadas, ausentes ou canceladas com ordenação temporal pelas colunas do modelo
export async function listarHistorico(): Promise<ConsultaComPaciente[]> {
  const supabase = await createClient();
  const profissionalId = await resolverProfissionalAtual(supabase);

  if (!profissionalId) {
    return [];
  }

  const { data: consultas, error } = await supabase
    .from('consulta')
    .select(`
      *,
      paciente:paciente_id (
        nome
      )
    `)
    .eq('profissional_id', profissionalId)
    .in('status', ['finalizado', 'ausente', 'cancelado'])
    .order('finalizado_em', { ascending: false, nullsFirst: false })
    .order('entrada_fila', { ascending: false });

  if (error) {
    registrarErro('histórico de consultas', error);
    return [];
  }

  return (consultas as unknown as ConsultaComPaciente[]) ?? [];
}

export async function chamarProximo(): Promise<ResultadoFila> {
  const supabase = await createClient();
  const profissionalId = await resolverProfissionalAtual(supabase);

  if (!profissionalId) {
    return { sucesso: false, erro: 'Não foi possível identificar o profissional.' };
  }

  const { error } = await supabase.rpc('fn_chamar_proximo_consulta', {
    p_profissional_id: profissionalId,
  });

  if (error) {
    registrarErro('chamar próximo', error);
    return { sucesso: false, erro: 'Não foi possível chamar o próximo paciente.' };
  }

  return { sucesso: true };
}

export async function atualizarStatusTicket(
  ticketId: string,
  status: StatusFila
): Promise<ResultadoFila> {
  const supabase = await createClient();

  const { error } = await supabase.from('consulta').update({ status }).eq('id', ticketId);

  if (error) {
    registrarErro('atualização de status', error);
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o status. Confira se a transição é permitida.',
    };
  }

  return { sucesso: true };
}

export async function cancelarTicket(ticketId: string): Promise<ResultadoFila> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('fn_cancelar_ticket', { p_ticket_id: ticketId });

  if (error) {
    registrarErro('cancelamento', error);
    return { sucesso: false, erro: 'Não foi possível cancelar o ticket.' };
  }

  return { sucesso: true };
}