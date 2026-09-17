import { mercadoPagoGateway } from '@/lib/pagamento/mercadoPago';
import type { GatewayPagamento } from '@/lib/pagamento/types';

// Ponto único de troca do provedor: os services só conhecem a interface
export function obterGateway(): GatewayPagamento {
  return mercadoPagoGateway;
}
