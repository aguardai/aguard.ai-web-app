import type { LocacaoFormValues } from '@/features/professional/schemas';
import type { LocacaoDetalhada } from '@/features/professional/types';
import { createClient } from '@/lib/supabase/server';
import { hojeISO } from '@/lib/utils';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[locacao] ${contexto}`, erro);
  }
}

export interface ResultadoOperacao {
  sucesso: boolean;
  erro?: string;
  id?: string;
}

// Vínculos visíveis ao usuário — o RLS entrega só as unidades que ele gerencia
export async function listarLocacoes(): Promise<LocacaoDetalhada[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locacao')
    .select(
      '*, unidade:unidade_id(id, nome, codigo), profissional:profissional_id(id, nome, especialidade)'
    )
    .is('deleted_at', null)
    .order('ativa', { ascending: false })
    .order('data_inicio', { ascending: false });

  if (error) {
    registrarErro('listagem de locações', error);
    return [];
  }

  return (data ?? []) as unknown as LocacaoDetalhada[];
}

export async function criarLocacao(dados: LocacaoFormValues): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locacao')
    .insert({
      unidade_id: dados.unidadeId,
      profissional_id: dados.profissionalId,
      data_inicio: dados.dataInicio,
      data_fim: dados.dataFim || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    registrarErro('criação de locação', error);

    // locacao_vigente_unica_idx impede dois vínculos abertos no mesmo par
    if (error?.code === '23505') {
      return {
        sucesso: false,
        erro: 'Este profissional já tem um vínculo vigente com essa unidade.',
      };
    }

    return { sucesso: false, erro: 'Não foi possível criar a locação.' };
  }

  return { sucesso: true, id: data.id };
}

// Encerrar mantém o histórico: marca a data de saída e tira o vínculo de vigente
export async function encerrarLocacao(id: string): Promise<ResultadoOperacao> {
  const supabase = await createClient();
  const hoje = hojeISO();

  const { data, error } = await supabase
    .from('locacao')
    .update({ ativa: false, data_fim: hoje })
    .eq('id', id)
    .select('id');

  if (error || !data?.length) {
    registrarErro('encerramento de locação', error);
    return { sucesso: false, erro: 'Não foi possível encerrar a locação.' };
  }

  return { sucesso: true, id };
}

export async function removerLocacao(id: string): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase.from('locacao').delete().eq('id', id);

  if (error) {
    registrarErro('remoção de locação', error);
    return { sucesso: false, erro: 'Não foi possível remover a locação.' };
  }

  return { sucesso: true, id };
}
