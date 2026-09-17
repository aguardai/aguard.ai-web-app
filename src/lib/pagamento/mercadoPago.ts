// Gateway do Mercado Pago no ambiente de testes (sandbox). Nenhuma cobrança
// real acontece: o cartão é o de teste oficial e o cenário vem do nome do
// titular (APRO aprova, OTHE recusa)
import { CardToken, MercadoPagoConfig, Payment } from 'mercadopago';
import type { CardTokenCreateBody } from 'mercadopago/dist/clients/cardToken/create/types';

import type {
  GatewayPagamento,
  ParametrosCobranca,
  ResultadoCobranca,
  StatusPagamento,
} from '@/lib/pagamento/types';

const EMAIL_PAGADOR_TESTE = 'test+4@mail.com';
const CENARIO_PADRAO = 'APRO';

const CARTAO_TESTE = {
  numero: '4235647728025682',
  codigoSeguranca: '123',
  mesValidade: '11',
  anoValidade: String(new Date().getFullYear() + 2),
};

const MAPA_STATUS: Record<string, StatusPagamento> = {
  approved: 'aprovado',
  pending: 'pendente',
  in_process: 'pendente',
  rejected: 'recusado',
  cancelled: 'recusado',
};

// O SDK não tipa o titular, mas a API usa o nome dele para escolher o cenário
type CorpoTokenTeste = CardTokenCreateBody & { cardholder: { name: string } };

const cliente = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN_TEST ?? '',
});

const pagamentos = new Payment(cliente);
const tokensDeCartao = new CardToken(cliente);

function descricaoDaCobranca(planoId: string) {
  return 'Assinatura do plano Aguard.ai - ' + planoId;
}

async function gerarTokenTeste(statusTeste: string): Promise<string> {
  const corpo: CorpoTokenTeste = {
    card_number: CARTAO_TESTE.numero,
    security_code: CARTAO_TESTE.codigoSeguranca,
    expiration_month: CARTAO_TESTE.mesValidade,
    expiration_year: CARTAO_TESTE.anoValidade,
    cardholder: { name: statusTeste },
  };

  const resposta = await tokensDeCartao.create({ body: corpo });

  if (!resposta.id) {
    throw new Error('Não foi possível gerar o token de teste.');
  }

  return resposta.id;
}

async function cobrarCartao(params: ParametrosCobranca): Promise<ResultadoCobranca> {
  const token =
    params.tokenCartao ?? (await gerarTokenTeste(params.statusTeste ?? CENARIO_PADRAO));

  const resposta = await pagamentos.create({
    body: {
      transaction_amount: params.valorCentavos / 100,
      token,
      installments: 1,
      payment_method_id: 'visa',
      description: descricaoDaCobranca(params.planoId),
      payer: { email: params.emailPagador || EMAIL_PAGADOR_TESTE },
    },
  });

  if (resposta.status === 'approved') {
    return { sucesso: true, status: 'aprovado', transacaoId: String(resposta.id) };
  }

  return {
    sucesso: false,
    status: 'recusado',
    erro: 'O pagamento não foi aprovado. Tente outro cartão ou o Pix.',
  };
}

async function cobrarPix(params: ParametrosCobranca): Promise<ResultadoCobranca> {
  const resposta = await pagamentos.create({
    body: {
      transaction_amount: params.valorCentavos / 100,
      description: descricaoDaCobranca(params.planoId),
      payment_method_id: 'pix',
      payer: { email: params.emailPagador || EMAIL_PAGADOR_TESTE },
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

export const mercadoPagoGateway: GatewayPagamento = {
  async cobrar(params) {
    try {
      return params.metodo === 'pix' ? await cobrarPix(params) : await cobrarCartao(params);
    } catch {
      return {
        sucesso: false,
        status: 'recusado',
        erro: 'Não foi possível falar com o serviço de pagamento. Tente novamente.',
      };
    }
  },

  async consultarStatus(transacaoId) {
    const resposta = await pagamentos.get({ id: transacaoId });

    return { status: MAPA_STATUS[resposta.status ?? ''] ?? 'pendente' };
  },
};
