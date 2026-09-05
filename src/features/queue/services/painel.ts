import type { TicketPainel } from '@/features/queue/types';
import { createClient } from '@/lib/supabase/server';

// Recepção e consulta na mesma lista. A RPC é endereçada e liberada para anon:
// devolve só a unidade pedida, com o nome do paciente mascarado e sem contato
export async function buscarPainelDaUnidade(unidadeId: string): Promise<TicketPainel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fn_painel_unidade', {
    p_unidade_id: unidadeId,
  });

  if (error) {
    return [];
  }

  return (data ?? []) as TicketPainel[];
}
