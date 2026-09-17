'use server';

import { ehPlanoValido } from '@/constants/planos';
import { iniciarPagamentoPlano, consultarStatusPagamento } from '@/features/billing/services/pagamento';
import type { MetodoPagamento, ResultadoCobranca } from '@/lib/payment/types';

export async function processarPagamento(
  _estadoAnterior: ResultadoCobranca | Record<string, never>,
  formData: FormData
): Promise<ResultadoCobranca> {
  const planoId = String(formData.get('plano') ?? '');

  if (!ehPlanoValido(planoId)) {
    return { sucesso: false, status: 'recusado', erro: 'Plano inválido.' };
  }

  const metodo = String(formData.get('metodo') ?? 'cartao') as MetodoPagamento;

  return iniciarPagamentoPlano(planoId, {
    metodo,
    emailPagador: String(formData.get('emailPagador') ?? '') || undefined,
    statusTeste: String(formData.get('statusTeste') ?? '') || undefined,
  });
}

export async function verificarStatusPagamento(transacaoId: string): Promise<ResultadoCobranca> {
  const status = await consultarStatusPagamento(transacaoId);
  return { sucesso: status.status === 'aprovado', status: status.status };
}