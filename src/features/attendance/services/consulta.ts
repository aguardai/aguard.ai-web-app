import { ITENS_POR_PAGINA, intervaloDaPagina } from '@/constants/paginacao';
import { createClient } from '@/lib/supabase/server';
import { hojeISO } from '@/lib/utils';
import type { Pagina } from '@/types/paginacao';
import type {
  ConsultaComPaciente,
  ResultadoFila,
  StatusFila,
  TicketFila,
} from '@/features/attendance/types';

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;
async function resolverProfissionalAtual(supabase: SupabaseServidor) {
  const { data, error } = await supabase.rpc('fn_profissional_atual');

  if (error || !data) {
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

  const { data: painel, error: erroPainel } = await supabase.rpc(
    'fn_painel_fila_consulta',
    { p_profissional_id: profissionalId }
  );

  if (erroPainel) {
    return [];
  }

  const fila = (painel ?? []) as TicketFila[];

  if (fila.length === 0) {
    return [];
  }

  // A RPC devolve o nome mascarado. A view resolve o nome completo, mas só para
  // os tickets que estão na tela: sem o recorte ela varre a fila inteira do
  // profissional, inclusive dias futuros, e passa de um segundo
  const { data: unificada, error: erroUnificada } = await supabase
    .from('vw_fila_unificada')
    .select('ticket_id, paciente_nome')
    .in(
      'ticket_id',
      fila.map((item) => item.ticket_id)
    );

  if (erroUnificada) {
    return fila;
  }

  const nomePorTicket = new Map<string, string>();

  (unificada ?? []).forEach((linha) => {
    if (linha.ticket_id && linha.paciente_nome) {
      nomePorTicket.set(linha.ticket_id, linha.paciente_nome);
    }
  });

  return fila.map((item) => ({
    ...item,
    paciente: nomePorTicket.get(item.ticket_id) || item.paciente,
  }));
}

// Ids dos pacientes cujo nome casa com a busca. O filtro por nome não pode ir
// direto na consulta porque o nome mora na tabela embutida
async function idsDePacientesPorNome(supabase: SupabaseServidor, termo: string) {
  const { data, error } = await supabase
    .from('paciente')
    .select('id')
    .ilike('nome', '%' + termo + '%')
    .limit(500);

  if (error) {
    return [];
  }

  return (data ?? []).map((linha) => linha.id);
}

// 2. HISTÓRICO: consultas finalizadas, ausentes ou canceladas, paginadas no banco
export async function listarHistoricoPaginado(
  pagina: number,
  busca = '',
  porPagina = ITENS_POR_PAGINA
): Promise<Pagina<ConsultaComPaciente>> {
  const supabase = await createClient();
  const profissionalId = await resolverProfissionalAtual(supabase);

  if (!profissionalId) {
    return { itens: [], total: 0 };
  }

  const termo = busca.trim();
  const { de, ate } = intervaloDaPagina(pagina, porPagina);

  let consulta = supabase
    .from('consulta')
    .select('*, paciente:paciente_id (nome)', { count: 'exact' })
    .eq('profissional_id', profissionalId)
    .in('status', ['finalizado', 'ausente', 'cancelado'])
    .lte('data_fila', hojeISO());

  if (termo) {
    const ids = await idsDePacientesPorNome(supabase, termo);
    const porSenha = 'senha.ilike.%' + termo + '%';

    consulta = consulta.or(
      ids.length > 0 ? porSenha + ',paciente_id.in.(' + ids.join(',') + ')' : porSenha
    );
  }

  const { data, error, count } = await consulta
    .order('data_fila', { ascending: false })
    .order('finalizado_em', { ascending: false, nullsFirst: false })
    .order('entrada_fila', { ascending: false })
    .range(de, ate);

  if (error) {
    return { itens: [], total: 0 };
  }

  return {
    itens: (data as unknown as ConsultaComPaciente[]) ?? [],
    total: count ?? 0,
  };
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
    return { sucesso: false, erro: 'Não foi possível cancelar o ticket.' };
  }

  return { sucesso: true };
}