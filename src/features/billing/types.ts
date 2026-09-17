// Tipos da feature de cobrança simulada dos planos

import type { MetodoPagamento } from '@/lib/pagamento/types';

// O que o checkout envia para a action: os dados do cartão nunca saem da tela,
// o gateway usa o cartão de teste e só o cenário escolhido importa
export interface DadosCheckout {
  metodo: MetodoPagamento;
  emailPagador: string;
  statusTeste?: string;
}
