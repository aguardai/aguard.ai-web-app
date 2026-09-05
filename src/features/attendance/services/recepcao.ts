import type {
  GuicheDaRecepcao,
  ProfissionalDaRecepcao,
  ResultadoFila,
  StatusFila,
  TicketRecepcao,
} from '@/features/attendance/types';
import { createClient } from '@/lib/supabase/server';
import { hojeISO } from '@/lib/utils';

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

// Profissionais que podem receber o encaminhamento: o trigger só cria a consulta
// quando existe locação vigente do profissional na unidade
export async function listarProfissionaisDaUnidade(
  unidadeId: string
): Promise<ProfissionalDaRecepcao[]> {
  const supabase = await createClient();
  const hoje = hojeISO();

  const { data, error } = await supabase
    .from('profissional')
    .select('id, nome, especialidade, locacao!inner(unidade_id)')
    .eq('ativo', true)
    .is('deleted_at', null)
    .eq('locacao.unidade_id', unidadeId)
    .eq('locacao.ativa', true)
    .is('locacao.deleted_at', null)
    .lte('locacao.data_inicio', hoje)
    .or('data_fim.is.null,data_fim.gte.' + hoje, { referencedTable: 'locacao' })
    .order('nome', { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((profissional) => ({
    id: profissional.id,
    nome: profissional.nome,
    especialidade: profissional.especialidade,
  }));
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

// A recepção escolhe para qual profissional o paciente segue. Sem profissional
// o ticket é encerrado sem gerar consulta
export async function finalizarRecepcao(
  ticketId: string,
  profissionalId: string | null = null
): Promise<ResultadoFila> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('fn_finalizar_atendimento', {
    p_atendimento_id: ticketId,
    p_encaminhar: profissionalId !== null,
    p_profissional_id: profissionalId,
  });

  if (error) {
    return { sucesso: false, erro: 'Não foi possível finalizar o atendimento.' };
  }

  return { sucesso: true };
}