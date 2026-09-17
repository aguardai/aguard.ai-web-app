// Contrato do gateway de pagamento simulado. A cobrança nunca é real: o
// gateway conversa apenas com o ambiente de testes do provedor

export type MetodoPagamento = 'cartao' | 'pix';
export type StatusPagamento = 'aprovado' | 'pendente' | 'recusado';

export interface DadosPix {
  qrCodeBase64: string;
  copiaECola: string;
}

export interface ParametrosCobranca {
  planoId: string;
  valorCentavos: number;
  metodo: MetodoPagamento;
  emailPagador?: string;
  tokenCartao?: string;
  statusTeste?: string;
}

export interface ResultadoCobranca {
  sucesso: boolean;
  status: StatusPagamento;
  transacaoId?: string;
  erro?: string;
  pix?: DadosPix;
}

export interface GatewayPagamento {
  cobrar(params: ParametrosCobranca): Promise<ResultadoCobranca>;
  consultarStatus(transacaoId: string): Promise<{ status: StatusPagamento }>;
}
