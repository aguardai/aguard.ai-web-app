export type MetodoPagamento = 'cartao' | 'pix';
export type StatusPagamento = 'aprovado' | 'pendente' | 'recusado';

export interface ParametrosCobranca {
  
  planoId: string;
  valorCentavos: number;
  emailPagador?: string;
  metodo: MetodoPagamento;
  tokenCartao?: string;
  statusTeste?: string; // só cartão — cenário de sandbox: APRO, OTHE...
}

export interface ResultadoCobranca {
  sucesso: boolean;
  status: StatusPagamento;
  transacaoId?: string;
  erro?: string;
  pix?: { qrCodeBase64: string; copiaECola: string };
}

export interface GatewayPagamento {
  cobrar(params: ParametrosCobranca): Promise<ResultadoCobranca>;
  consultarStatus(transacaoId: string): Promise<{ status: StatusPagamento }>;
}