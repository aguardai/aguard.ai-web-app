import { createClient } from '@/lib/supabase/client';
import type { TicketFila } from '@/features/queue/types';
import type { EntrarNaFilaFormValues } from '@/features/queue/schemas';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[queue] ${contexto}`, erro);
  }
}

export interface ResultadoFila {
  sucesso: boolean;
  ticket?: TicketFila;
  erro?: string;
}

export async function entrarNaFilaAtendimento(
  unidadeId: string,
  dados: EntrarNaFilaFormValues
): Promise<ResultadoFila> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('fn_entrar_fila_atendimento', {
    p_unidade_id: unidadeId,
    p_nome: dados.nome,
    p_telefone: dados.telefone,
    p_email: dados.email || undefined,
  });

  if (error || !data) {
    registrarErro('entrada na fila', error);
    return { sucesso: false, erro: 'Não foi possível entrar na fila. Tente novamente.' };
  }

  return { sucesso: true, ticket: data as unknown as TicketFila };
}

export async function buscarTicket(ticketId: string): Promise<ResultadoFila> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('fn_acompanhar_ticket', {
    p_ticket_id: ticketId,
  });

  if (error || !data) {
    registrarErro('busca do ticket', error);
    return { sucesso: false, erro: 'Ticket não encontrado ou fila já encerrada.' };
  }

  return { sucesso: true, ticket: data as unknown as TicketFila };
}

export async function cancelarTicket(ticketId: string): Promise<ResultadoFila> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('fn_cancelar_ticket', {
    p_ticket_id: ticketId,
  });

  if (error || !data) {
    registrarErro('cancelamento', error);
    return {
      sucesso: false,
      erro: 'Não foi possível cancelar: o ticket já não está mais na fila.',
    };
  }

  return { sucesso: true, ticket: data as unknown as TicketFila };
}
