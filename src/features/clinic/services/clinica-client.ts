import { createClient } from '@/lib/supabase/client';
import type { PlanoId } from '@/constants/planos';
import type { EditarClinicaFormValues } from '@/features/clinic/schemas';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[clinic] ${contexto}`, erro);
  }
}

export interface ResultadoOperacao {
  sucesso: boolean;
  erro?: string;
}

export async function atualizarClinica(
  clinicaId: string,
  dados: EditarClinicaFormValues
): Promise<ResultadoOperacao> {
  const supabase = createClient();

  const { error } = await supabase
    .from('clinica')
    .update({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone || null,
      endereco: dados.endereco || null,
      logo_url: dados.logo_url || null,
    })
    .eq('id', clinicaId);

  if (error) {
    registrarErro('atualizacao da clinica', error);
    return { sucesso: false, erro: 'Não foi possível salvar as alterações.' };
  }

  return { sucesso: true };
}

export async function trocarPlano(
  clinicaId: string,
  plano: PlanoId
): Promise<ResultadoOperacao> {
  const supabase = createClient();

  const { error } = await supabase.from('clinica').update({ plano }).eq('id', clinicaId);

  if (error) {
    registrarErro('troca de plano', error);

    if (error.message?.toLowerCase().includes('limite')) {
      return {
        sucesso: false,
        erro: 'O plano escolhido não comporta o que a clínica já usa hoje.',
      };
    }

    return { sucesso: false, erro: 'Não foi possível trocar de plano.' };
  }

  return { sucesso: true };
}
