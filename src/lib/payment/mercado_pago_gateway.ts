import { CardToken, MercadoPagoConfig, Payment } from 'mercadopago';
import type { GatewayPagamento, ParametrosCobranca, ResultadoCobranca, StatusPagamento } from './types';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST || '',
});

const payment = new Payment(client);
const cardTokenResource = new CardToken(client);

// Cartão de teste oficial do Mercado Pago — nunca é um dado real.
// O nome do titular decide o cenário: APRO aprovado, OTHE recusa genérica.
const CARTAO_TESTE = {
  card_number: '4235647728025682',
  security_code: '123',
  expiration_month: 11,
  expiration_year: new Date().getFullYear() + 2,
};

async function gerarTokenTeste(statusTeste: string): Promise<string> {
  const resposta = await cardTokenResource.create({
    body: {
      card_number: CARTAO_TESTE.card_number,
      security_code: CARTAO_TESTE.security_code,
      expiration_month: String(CARTAO_TESTE.expiration_month),
      expiration_year: String(CARTAO_TESTE.expiration_year),
      cardholder: { name: statusTeste },
    } as any,
  });

  if (!resposta.id) {
    throw new Error('Não foi possível gerar o token de teste.');
  }

  return resposta.id;
}

async function cobrarCartao(params: ParametrosCobranca): Promise<ResultadoCobranca> {
  const token = params.tokenCartao ?? (await gerarTokenTeste(params.statusTeste ?? 'APRO'));

  const resposta = await payment.create({
    body: {
      transaction_amount: params.valorCentavos / 100,
      token,
      installments: 1,
      payment_method_id: 'visa',
      description: `Assinatura do Plano Aguard.ai - ${params.planoId}`,
      payer: { email: params.emailPagador || 'test_user_123456@testuser.com' },
    },
  });

  if (resposta.status === 'approved') {
    return { sucesso: true, status: 'aprovado', transacaoId: String(resposta.id) };
  }

  return {
    sucesso: false,
    status: 'recusado',
    erro: `Pagamento ${resposta.status_detail ?? resposta.status ?? 'não aprovado'}.`,
  };
}

async function cobrarPix(params: ParametrosCobranca): Promise<ResultadoCobranca> {
  const resposta = await payment.create({
    body: {
      transaction_amount: params.valorCentavos / 100,
      description: `Assinatura do Plano Aguard.ai - ${params.planoId}`,
      payment_method_id: 'pix',
      payer: { email: params.emailPagador || 'test_user_123456@testuser.com' },
    },
  });

  const dadosPix = resposta.point_of_interaction?.transaction_data;

  if (!dadosPix?.qr_code_base64 || !dadosPix?.qr_code) {
    return { sucesso: false, status: 'recusado', erro: 'Não foi possível gerar o Pix.' };
  }

  return {
    sucesso: true,
    status: 'pendente',
    transacaoId: String(resposta.id),
    pix: { qrCodeBase64: dadosPix.qr_code_base64, copiaECola: dadosPix.qr_code },
  };
}

const MAPA_STATUS: Record<string, StatusPagamento> = {
  approved: 'aprovado',
  pending: 'pendente',
  in_process: 'pendente',
  rejected: 'recusado',
  cancelled: 'recusado',
};

export const mercadoPagoGateway: GatewayPagamento = {
  async cobrar(params: ParametrosCobranca): Promise<ResultadoCobranca> {
    try {
      return params.metodo === 'pix' ? await cobrarPix(params) : await cobrarCartao(params);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao comunicar com o Mercado Pago.';
      return { sucesso: false, status: 'recusado', erro: mensagem };
    }
  },

  async consultarStatus(transacaoId: string) {
    const resposta = await payment.get({ id: transacaoId });
    return { status: MAPA_STATUS[resposta.status ?? ''] ?? 'pendente' };
  },
};