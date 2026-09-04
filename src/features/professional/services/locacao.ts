import type { LocacaoFormValues } from '@/features/professional/schemas';
import type { LocacaoDetalhada } from '@/features/professional/types';
import { ITENS_POR_PAGINA, intervaloDaPagina } from '@/constants/paginacao';
import { createClient } from '@/lib/supabase/server';
import type { Pagina } from '@/types/paginacao';
import { hojeISO } from '@/lib/utils';
export interface ResultadoOperacao {
  sucesso: boolean;
  erro?: string;
  id?: string;
}

export type SituacaoLocacao = 'todas' | 'vigentes' | 'encerradas';

export interface FiltroLocacoes {
  unidadeId?: string;
  situacao?: SituacaoLocacao;
  pagina: number;
  porPagina?: number;
}

// Vínculos visíveis ao usuário — o RLS entrega só as unidades que ele gerencia
export async function listarLocacoes({
  unidadeId,
  situacao = 'todas',
  pagina,
  porPagina = ITENS_POR_PAGINA,
}: FiltroLocacoes): Promise<Pagina<LocacaoDetalhada>> {
  const supabase = await createClient();
  const { de, ate } = intervaloDaPagina(pagina, porPagina);

  let consulta = supabase
    .from('locacao')
    .select(
      '*, unidade:unidade_id(id, nome, codigo), profissional:profissional_id(id, nome, especialidade)',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('ativa', { ascending: false })
    .order('data_inicio', { ascending: false })
    .range(de, ate);

  if (unidadeId) {
    consulta = consulta.eq('unidade_id', unidadeId);
  }

  if (situacao !== 'todas') {
    consulta = consulta.eq('ativa', situacao === 'vigentes');
  }

  const { data, error, count } = await consulta;

  if (error) {
    return { itens: [], total: 0 };
  }

  return { itens: (data ?? []) as unknown as LocacaoDetalhada[], total: count ?? 0 };
}

// Totais do cabeçalho, sem depender da página nem do filtro aberto
export async function contarLocacoes(): Promise<{ total: number; vigentes: number }> {
  const supabase = await createClient();

  const [todas, vigentes] = await Promise.all([
    supabase
      .from('locacao')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('locacao')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('ativa', true),
  ]);

  return { total: todas.count ?? 0, vigentes: vigentes.count ?? 0 };
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
    return { sucesso: false, erro: 'Não foi possível encerrar a locação.' };
  }

  return { sucesso: true, id };
}

export async function removerLocacao(id: string): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase.from('locacao').delete().eq('id', id);

  if (error) {
    return { sucesso: false, erro: 'Não foi possível remover a locação.' };
  }

  return { sucesso: true, id };
}
