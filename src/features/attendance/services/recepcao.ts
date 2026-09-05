import type {
  GuicheDaRecepcao,
  ResultadoFila,
  StatusFila,
  TicketRecepcao,
} from '@/features/attendance/types';
import { createClient } from '@/lib/supabase/server';

// Guichês ativos da unidade: a chamada da Fila 1 sempre parte de um guichê
export async function listarGuichesDaUnidade(
  unidadeId: string
): Promise<GuicheDaRecepcao[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guiche')
    .select('id, nome, codigo')
    .eq('unidade_id', unidadeId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as GuicheDaRecepcao[];
}

export async function listarFilaRecepcao(unidadeId: string): Promise<TicketRecepcao[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fn_painel_fila_atendimento', {
    p_unidade_id: unidadeId,
  });

  if (error) {
    return [];
  }

  return (data ?? []) as TicketRecepcao[];
}

// A RPC devolve null quando não há ninguém aguardando
export async function chamarProximoRecepcao(guicheId: string): Promise<ResultadoFila> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fn_chamar_proximo_atendimento', {
    p_guiche_id: guicheId,
  });

  if (error) {
    return { sucesso: false, erro: 'Não foi possível chamar o próximo paciente.' };
  }

  if (!data) {
    return { sucesso: false, erro: 'Não há pacientes aguardando na fila da recepção.' };
  }

  return { sucesso: true };
}

export async function atualizarStatusRecepcao(
  ticketId: string,
  status: StatusFila
): Promise<ResultadoFila> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('atendimento')
    .update({ status })
    .eq('id', ticketId)
    .select('id');

  if (error || !data?.length) {
    return {
      sucesso: false,
      erro: 'Não foi possível atualizar o status. Confira se a transição é permitida.',
    };
  }

  return { sucesso: true };
}

// Finaliza sem argumentos extras: o encaminhamento para a Fila 2 já está gravado
// no ticket a partir da configuração da unidade, e o trigger cria a consulta
export async function finalizarRecepcao(ticketId: string): Promise<ResultadoFila> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('fn_finalizar_atendimento', {
    p_atendimento_id: ticketId,
  });

  if (error) {
    return { sucesso: false, erro: 'Não foi possível finalizar o atendimento.' };
  }

  return { sucesso: true };
}
