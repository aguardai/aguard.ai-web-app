'use server';

import { revalidatePath } from 'next/cache';

import {
  atualizarStatusTicket,
  cancelarTicket,
  chamarProximo,
} from '@/features/attendance/services/consulta';
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