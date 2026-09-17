'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PlanoId } from '@/constants/planos';
import { confirmarPagamentoCadastro, verificarPagamentoCadastro } from '@/features/auth/actions';
import type { DadosCheckout } from '@/features/billing/types';
import type { ResultadoCobranca } from '@/lib/pagamento/types';

const ATRASO_REDIRECIONAMENTO_MS = 2500;

const MENSAGEM_APROVADO =
  'Conta criada. Confirme o e-mail que enviamos para ativar o acesso e entrar.';
const MENSAGEM_RECUSADO =
  'Não conseguimos confirmar o pagamento. Sua conta foi criada no plano Starter (grátis) — você pode mudar de plano em Gerenciar Plano, na aba Clínica.';

// Liga o checkout do cadastro às actions: a conta já existe no Auth quando o
// modal abre, e o resultado do pagamento define a mensagem final
export function useCheckoutCadastro(usuarioId: string | undefined, plano: PlanoId) {
  const router = useRouter();
  const [mensagemFinal, setMensagemFinal] = useState<string | null>(null);

  async function submeter(dados: DadosCheckout): Promise<ResultadoCobranca> {
    if (!usuarioId) throw new Error('Sem cadastro pendente de pagamento.');

    const resultado = await confirmarPagamentoCadastro(usuarioId, plano, dados);

    return {
      sucesso: resultado.statusPagamento === 'aprovado',
      status: resultado.statusPagamento ?? 'recusado',
      transacaoId: resultado.transacaoId,
      pix: resultado.pix,
    };
  }

  async function verificar(transacaoId: string): Promise<ResultadoCobranca> {
    if (!usuarioId) throw new Error('Sem cadastro pendente de pagamento.');

    const resultado = await verificarPagamentoCadastro(transacaoId, usuarioId);

    return {
      sucesso: resultado.statusPagamento === 'aprovado',
      status: resultado.statusPagamento ?? 'pendente',
    };
  }

  function concluir(resultado: ResultadoCobranca) {
    setMensagemFinal(resultado.status === 'aprovado' ? MENSAGEM_APROVADO : MENSAGEM_RECUSADO);
    setTimeout(() => router.push('/'), ATRASO_REDIRECIONAMENTO_MS);
  }

  return { mensagemFinal, submeter, verificar, concluir };
}
