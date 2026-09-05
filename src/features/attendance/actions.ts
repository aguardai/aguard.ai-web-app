'use server';

import { revalidatePath } from 'next/cache';

import {
  atualizarStatusTicket,
  cancelarTicket,
  chamarProximo,
} from '@/features/attendance/services/consulta';
import {
  atualizarStatusRecepcao,
  chamarProximoRecepcao,
  finalizarRecepcao,
} from '@/features/attendance/services/recepcao';
import type { StatusFila } from '@/features/attendance/types';

export async function chamarProximoAction() {
  const resultado = await chamarProximo();
  revalidatePath('/atendimento', 'layout');
  revalidatePath('/atendimento/historico', 'page')
  return resultado;
}

export async function atualizarStatusAction(ticketId: string, status: StatusFila) {
  const resultado = await atualizarStatusTicket(ticketId, status);
  revalidatePath('/atendimento', 'layout');
  revalidatePath('/atendimento/historico', 'page');
  return resultado;
}

export async function cancelarTicketAction(ticketId: string) {
  const resultado = await cancelarTicket(ticketId);
  revalidatePath('/atendimento', 'layout');
  revalidatePath('/atendimento/historico', 'page');
  return resultado;
}
// --- Fila da recepção (Fila 1), operada pela unidade -------------------------

function revalidarTelasDaRecepcao() {
  revalidatePath('/dashboard');
  revalidatePath('/filas');
}

export async function chamarProximoRecepcaoAction(guicheId: string) {
  const resultado = await chamarProximoRecepcao(guicheId);

  revalidarTelasDaRecepcao();
  return resultado;
}

export async function atualizarStatusRecepcaoAction(ticketId: string, status: StatusFila) {
  const resultado = await atualizarStatusRecepcao(ticketId, status);

  revalidarTelasDaRecepcao();
  return resultado;
}

export async function finalizarRecepcaoAction(
  ticketId: string,
  profissionalId: string | null
) {
  const resultado = await finalizarRecepcao(ticketId, profissionalId);

  revalidarTelasDaRecepcao();
  return resultado;
}
