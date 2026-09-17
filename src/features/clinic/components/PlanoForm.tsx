'use client';

import { useActionState, useRef, useState, useTransition } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { PlanoId } from '@/constants/planos';
import { processarPagamento, verificarStatusPagamento } from '@/features/billing/actions';
import { SimuladorPagamentoModal } from '@/features/billing/components/SimuladorPagamentoModal';
import type { DadosCheckout } from '@/features/billing/types';
import { alterarPlano, validarTrocaPlano } from '@/features/clinic/actions';
import { SeletorPlano } from '@/features/clinic/components/SeletorPlano';
import type { EstadoTrocaPlano } from '@/features/clinic/types';
import type { ResultadoCobranca } from '@/lib/pagamento/types';

const ESTADO_INICIAL: EstadoTrocaPlano = {};

export interface PlanoFormProps {
  planoAtual: PlanoId;
  emailClinica: string;
}

// Plano gratuito troca direto; plano pago abre o checkout e só envia o
// formulário depois que o pagamento é aprovado, levando o id da transação
export function PlanoForm({ planoAtual, emailClinica }: PlanoFormProps) {
  const [estado, acao, pendente] = useActionState(alterarPlano, ESTADO_INICIAL);
  const [selecionado, setSelecionado] = useState<PlanoId>(planoAtual);
  const [modalAberto, setModalAberto] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [validando, iniciarValidacao] = useTransition();

  const formulario = useRef<HTMLFormElement>(null);
  const transacaoId = useRef<HTMLInputElement>(null);

  function handleAlterar(evento: React.MouseEvent<HTMLButtonElement>) {
    if (selecionado === 'starter') return;

    evento.preventDefault();
    setErroValidacao(null);

    iniciarValidacao(async () => {
      const validacao = await validarTrocaPlano(selecionado);

      if (!validacao.ok) {
        setErroValidacao(validacao.erro ?? 'Não foi possível validar a troca de plano.');
        return;
      }

      setModalAberto(true);
    });
  }

  function submeterPagamento(dados: DadosCheckout): Promise<ResultadoCobranca> {
    return processarPagamento(selecionado, dados);
  }

  // Pix adiado só fecha o modal: sem transação aprovada, o plano não muda
  function concluirPagamento(resultado: ResultadoCobranca) {
    if (resultado.status === 'pendente') {
      setModalAberto(false);
      return;
    }

    if (resultado.status !== 'aprovado') return;

    if (transacaoId.current) {
      transacaoId.current.value = resultado.transacaoId ?? '';
    }

    setModalAberto(false);
    formulario.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formulario} action={acao} className="flex flex-col gap-4">
        {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}
        {erroValidacao ? <Alert tom="erro">{erroValidacao}</Alert> : null}
        {estado.sucesso ? <Alert tom="sucesso">{estado.sucesso}</Alert> : null}

        <input type="hidden" name="transacaoId" ref={transacaoId} />

        <SeletorPlano
          legenda="Plano contratado"
          selecionado={selecionado}
          aoSelecionar={setSelecionado}
          planoAtual={planoAtual}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Cobrança simulada — nenhuma transação financeira é feita.
          </p>

          <Button
            type="submit"
            onClick={handleAlterar}
            disabled={pendente || validando || selecionado === planoAtual}
            className="w-full sm:w-auto"
          >
            {pendente ? 'Alterando...' : validando ? 'Verificando...' : 'Alterar plano'}
          </Button>
        </div>
      </form>

      <SimuladorPagamentoModal
        key={selecionado}
        aberto={modalAberto}
        planoSelecionado={selecionado}
        emailPagador={emailClinica}
        aoFechar={() => setModalAberto(false)}
        aoSubmeter={submeterPagamento}
        aoVerificarStatus={verificarStatusPagamento}
        aoConcluir={concluirPagamento}
      />
    </>
  );
}
