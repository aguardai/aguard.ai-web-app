import type { PlanoId } from '@/constants/planos';
import { obterGateway } from '@/lib/pagamento/gateway';
import type { MetodoPagamento, ResultadoCobranca } from '@/lib/pagamento/types';
import { createClient } from '@/lib/supabase/server';

interface DadosCobranca {
  metodo: MetodoPagamento;
  emailPagador?: string;
  tokenCartao?: string;
  statusTeste?: string;
}

async function buscarPrecoPlano(planoId: PlanoId): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('plano_limite')
    .select('preco_mensal_simulado')
    .eq('plano', planoId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.preco_mensal_simulado;
}

// Cobra a assinatura do plano. Não recebe a clínica porque no cadastro ela
// ainda não existe; a troca de plano e o primeiro cadastro usam a mesma função
export async function iniciarPagamentoPlano(
  planoId: PlanoId,
  dados: DadosCobranca
): Promise<ResultadoCobranca> {
  const precoMensal = await buscarPrecoPlano(planoId);

  if (precoMensal === null) {
    return {
      sucesso: false,
      status: 'recusado',
      erro: 'Não foi possível obter o preço do plano.',
    };
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
