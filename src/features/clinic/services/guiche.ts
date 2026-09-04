import type { GuicheFormValues } from '@/features/clinic/schemas';
import type { Guiche, GuicheComUnidade, UnidadeResumo } from '@/features/clinic/types';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[guiche] ${contexto}`, erro);
  }
}

export interface ResultadoOperacao {
  sucesso: boolean;
  erro?: string;
  id?: string;
}

// Unidades visíveis ao usuário — o RLS já entrega só o escopo dele
export async function listarUnidades(): Promise<UnidadeResumo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('unidade')
    .select('id, nome, codigo, ativa')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) {
    registrarErro('listagem de unidades', error);
    return [];
  }

  return (data ?? []) as UnidadeResumo[];
}

export async function listarGuiches(): Promise<GuicheComUnidade[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guiche')
    .select('*, unidade:unidade_id(id, nome, codigo)')
    .is('deleted_at', null)
    .order('nome', { ascending: true });

  if (error) {
    registrarErro('listagem de guichês', error);
    return [];
  }

  return (data ?? []) as unknown as GuicheComUnidade[];
}

export async function buscarGuiche(id: string): Promise<Guiche | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guiche')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    registrarErro('busca de guichê', error);
    return null;
  }

  return data as Tables<'guiche'>;
}

function traduzirErro(mensagem: string | undefined, padrao: string) {
  if (mensagem?.toLowerCase().includes('limite')) {
    return 'O plano atual atingiu o limite de guichês.';
  }

  if (mensagem?.toLowerCase().includes('duplicate') || mensagem?.includes('23505')) {
    return 'Já existe um guichê com esse código nesta unidade.';
  }

  return padrao;
}

export async function criarGuiche(dados: GuicheFormValues): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guiche')
    .insert({
      unidade_id: dados.unidadeId,
      nome: dados.nome,
      codigo: dados.codigo,
    })
    .select('id')
    .single();

  if (error || !data) {
    registrarErro('criação de guichê', error);
    return {
      sucesso: false,
      erro: traduzirErro(error?.message, 'Não foi possível cadastrar o guichê.'),
    };
  }

  return { sucesso: true, id: data.id };
}

export async function atualizarGuiche(
  id: string,
  dados: GuicheFormValues
): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guiche')
    .update({
      unidade_id: dados.unidadeId,
      nome: dados.nome,
      codigo: dados.codigo,
    })
    .eq('id', id)
    .select('id');

  if (error || !data?.length) {
    registrarErro('atualização de guichê', error);
    return {
      sucesso: false,
      erro: traduzirErro(error?.message, 'Não foi possível salvar o guichê.'),
    };
  }

  return { sucesso: true, id };
}

export async function alternarAtivoGuiche(
  id: string,
  ativo: boolean
): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guiche')
    .update({ ativo })
    .eq('id', id)
    .select('id');

  if (error || !data?.length) {
    registrarErro('alternância de guichê', error);
    return { sucesso: false, erro: 'Não foi possível atualizar o status do guichê.' };
  }

  return { sucesso: true, id };
}

// O DELETE é interceptado pelo trigger e vira soft delete
export async function removerGuiche(id: string): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase.from('guiche').delete().eq('id', id);

  if (error) {
    registrarErro('remoção de guichê', error);
    return { sucesso: false, erro: 'Não foi possível remover o guichê.' };
  }

  return { sucesso: true, id };
}
