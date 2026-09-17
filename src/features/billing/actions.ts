'use server';

import { ehPlanoValido } from '@/constants/planos';
import {
  consultarStatusPagamento,
  iniciarPagamentoPlano,
} from '@/features/billing/services/pagamento';
import type { DadosCheckout } from '@/features/billing/types';
import type { PlanoId } from '@/constants/planos';
import type { ResultadoCobranca } from '@/lib/pagamento/types';

// Cobrança da troca de plano de uma clínica já existente
export async function processarPagamento(
  planoId: PlanoId,
  dados: DadosCheckout
): Promise<ResultadoCobranca> {
  if (!ehPlanoValido(planoId)) {
    return { sucesso: false, status: 'recusado', erro: 'Plano inválido.' };
  }

  return iniciarPagamentoPlano(planoId, {
    metodo: dados.metodo,
    emailPagador: dados.emailPagador || undefined,
    statusTeste: dados.statusTeste || undefined,
  });
}

// Polling do Pix pela tela de troca de plano
export async function verificarStatusPagamento(
  transacaoId: string
): Promise<ResultadoCobranca> {
  const { status } = await consultarStatusPagamento(transacaoId);

  return { sucesso: status === 'aprovado', status };
}
