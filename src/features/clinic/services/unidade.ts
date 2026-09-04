import { ITENS_POR_PAGINA, intervaloDaPagina } from '@/constants/paginacao';
import type { UnidadeFormValues } from '@/features/clinic/schemas';
import type { Unidade } from '@/features/clinic/types';
import { createClient } from '@/lib/supabase/server';
import type { Pagina } from '@/types/paginacao';
export interface ResultadoOperacaoUnidade {
  sucesso: boolean;
  erro?: string;
  id?: string;
}

function traduzirErro(mensagem: string | undefined, padrao: string) {
  if (mensagem?.toLowerCase().includes('limite')) {
    return 'O plano atual atingiu o limite de unidades.';
  }

  if (mensagem?.toLowerCase().includes('duplicate') || mensagem?.includes('23505')) {
    return 'Já existe uma unidade com esse código nesta clínica.';
  }

  return padrao;
}

// Listagem paginada no banco: o RLS já entrega só as unidades do escopo do usuário
export async function listarUnidadesPaginado(
  pagina: number,
  porPagina = ITENS_POR_PAGINA
): Promise<Pagina<Unidade>> {
  const supabase = await createClient();
  const { de, ate } = intervaloDaPagina(pagina, porPagina);

  const { data, error, count } = await supabase
    .from('unidade')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('nome', { ascending: true })
    .range(de, ate);

  if (error) {
    return { itens: [], total: 0 };
  }

  return { itens: (data ?? []) as Unidade[], total: count ?? 0 };
}

// Contagem completa para o resumo do cabeçalho, independente da página aberta
export async function contarUnidades(): Promise<{ total: number; ativas: number }> {
  const supabase = await createClient();

  const [todas, ativas] = await Promise.all([
    supabase.from('unidade').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('unidade')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('ativa', true),
  ]);

  return { total: todas.count ?? 0, ativas: ativas.count ?? 0 };
}

export async function buscarUnidadePorId(id: string): Promise<Unidade | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('unidade')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Unidade;
}

export async function criarUnidade(
  clinicaId: string,
  dados: UnidadeFormValues
): Promise<ResultadoOperacaoUnidade> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('unidade')
    .insert({
      clinica_id: clinicaId,
      nome: dados.nome,
      codigo: dados.codigo,
      tipo_servico: dados.tipoServico,
      telefone: dados.telefone || null,
      endereco: dados.endereco,
    })
    .select('id')
    .single();

  if (error || !data) {
    return {
      sucesso: false,
      erro: traduzirErro(error?.message, 'Não foi possível cadastrar a unidade.'),
    };
  }

  return { sucesso: true, id: data.id };
}

// O UPDATE bloqueado pelo RLS volta com 200 e nenhuma linha, por isso o select
export async function atualizarUnidade(
  id: string,
  dados: UnidadeFormValues
): Promise<ResultadoOperacaoUnidade> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('unidade')
    .update({
      nome: dados.nome,
      codigo: dados.codigo,
      tipo_servico: dados.tipoServico,
      telefone: dados.telefone || null,
      endereco: dados.endereco,
    })
    .eq('id', id)
    .select('id');

  if (error || !data?.length) {
    return {
      sucesso: false,
      erro: traduzirErro(error?.message, 'Não foi possível salvar a unidade.'),
    };
  }

  return { sucesso: true, id };
}

export async function alternarAtivaUnidade(
  id: string,
  ativa: boolean
): Promise<ResultadoOperacaoUnidade> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('unidade')
    .update({ ativa })
    .eq('id', id)
    .select('id');

  if (error || !data?.length) {
    return { sucesso: false, erro: 'Não foi possível atualizar o status da unidade.' };
  }

  return { sucesso: true, id };
}

// O DELETE é interceptado pelo trigger e vira soft delete, que cascateia para
// os guichês e as locações da unidade
export async function removerUnidade(id: string): Promise<ResultadoOperacaoUnidade> {
  const supabase = await createClient();

  const { error } = await supabase.from('unidade').delete().eq('id', id);

  if (error) {
    return { sucesso: false, erro: 'Não foi possível remover a unidade.' };
  }

  return { sucesso: true, id };
}
