import { obterGateway } from '@/lib/payment';
import { createClient } from '@/lib/supabase/server';
import type { PlanoId } from '@/constants/planos';
import type { MetodoPagamento, ResultadoCobranca } from '@/lib/payment/types';

async function buscarPrecoPlano(planoId: PlanoId): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('plano_limite')
    .select('preco_mensal_simulado')
    .eq('id', planoId)
    .maybeSingle();

  if (error || !data) return null;
  return data.preco_mensal_simulado;
}

interface DadosCobranca {
  metodo: MetodoPagamento;
  emailPagador?: string;
  tokenCartao?: string;
  statusTeste?: string;
}

// Não recebe clinicaId — no cadastro a clínica ainda não existe quando isso roda.
// Quem cobra troca de plano e quem cobra o primeiro cadastro chamam a mesma função.
export async function iniciarPagamentoPlano(
  planoId: PlanoId,
  dados: DadosCobranca
): Promise<ResultadoCobranca> {
  const precoMensal = await buscarPrecoPlano(planoId);

  if (precoMensal === null) {
    return { sucesso: false, status: 'recusado', erro: 'Não foi possível obter o preço do plano.' };
  }

  if (precoMensal === 0) {
    return { sucesso: true, status: 'aprovado' };
  }

  return obterGateway().cobrar({
    planoId,
    valorCentavos: Math.round(precoMensal * 100),
    ...dados,
  });
}

export async function consultarStatusPagamento(transacaoId: string) {
  return obterGateway().consultarStatus(transacaoId);
}