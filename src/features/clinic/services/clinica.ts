import { ehPlanoValido, type PlanoId } from '@/constants/planos';
import type { ClinicaFormValues } from '@/features/clinic/schemas';
import type { Clinica, UsoPlano } from '@/features/clinic/types';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
export interface ResultadoOperacao {
  sucesso: boolean;
  erro?: string;
}

// O RLS já limita a clínica ao tenant do usuário logado
export async function buscarClinica(): Promise<Clinica | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clinica')
    .select('*')
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Clinica;
}

// Consumo atual contra os limites do plano (vw_uso_plano)
export async function buscarUsoPlano(): Promise<UsoPlano | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('vw_uso_plano').select('*').maybeSingle();

  if (error || !data) {
    return null;
  }

  const linha = data as Tables<'vw_uso_plano'>;

  return {
    plano: ehPlanoValido(linha.plano) ? linha.plano : 'starter',
    precoMensalSimulado: linha.preco_mensal_simulado ?? 0,
    unidades: { usado: linha.unidades_usadas ?? 0, limite: linha.max_unidades ?? 0 },
    guiches: { usado: linha.guiches_usados ?? 0, limite: linha.max_guiches ?? 0 },
    profissionais: {
      usado: linha.profissionais_usados ?? 0,
      limite: linha.max_profissionais ?? 0,
    },
    ticketsMes: { usado: linha.tickets_no_mes ?? 0, limite: linha.max_tickets_mes ?? 0 },
  };
}

// O update volta com a linha afetada de propósito: o RLS devolve 0 linhas em vez
// de erro quando a política barra a escrita, e isso não pode passar como sucesso
export async function atualizarClinica(
  id: string,
  dados: ClinicaFormValues
): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('clinica')
    .update({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone || null,
      endereco: dados.endereco || null,
    })
    .eq('id', id);

  if (error) {
    return { sucesso: false, erro: 'Não foi possível salvar as alterações.' };
  }

  return { sucesso: true };
}

export async function trocarPlano(
  id: string,
  plano: PlanoId
): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase.from('clinica').update({ plano }).eq('id', id);

  if (error) {
    return { sucesso: false, erro: 'Não foi possível trocar o plano agora.' };
  }

  return { sucesso: true };
}
