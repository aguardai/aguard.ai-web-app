import { createClient } from '@/lib/supabase/client';
import type { TicketFilaUnificada } from '@/features/queue-monitor/types';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[queue-monitor] ${contexto}`, erro);
  }
}

export async function listarFilaUnificada(
  unidadeId?: string
): Promise<TicketFilaUnificada[]> {
  const supabase = createClient();

  let query = supabase
    .from('vw_fila_unificada')
    .select('*')
    .order('tipo_fila', { ascending: true })
    .order('posicao', { ascending: true, nullsFirst: false })
    .order('entrada_fila', { ascending: true });

  if (unidadeId) {
    query = query.eq('unidade_id', unidadeId);
  }

  const { data, error } = await query;

  if (error) {
    registrarErro('listagem da fila unificada', error);
    return [];
  }

  return (data ?? []) as unknown as TicketFilaUnificada[];
}
