import { mercadoPagoGateway } from './mercado_pago_gateway';
import type { GatewayPagamento } from './types';

export function obterGateway(): GatewayPagamento {
  return mercadoPagoGateway;
}