import type { UnidadeFormValues } from '@/features/clinic/schemas';
import { createClient } from '@/lib/supabase/server';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[unidade] ${contexto}`, erro);
  }
}

export interface ResultadoOperacaoUnidade {
  sucesso: boolean;
  erro?: string;
  id?: string;
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
    registrarErro('criação da unidade', error);

    if (error?.message.toLowerCase().includes('limite')) {
      return { sucesso: false, erro: 'O plano atual atingiu o limite de unidades.' };
    }

    if (error?.message.includes('23505') || error?.message.toLowerCase().includes('duplicate')) {
      return { sucesso: false, erro: 'Já existe uma unidade com esse código nesta clínica.' };
    }

    return { sucesso: false, erro: 'Não foi possível cadastrar a unidade.' };
  }

  return { sucesso: true, id: data.id };
}