'use client';

import { useEffect, useState, useTransition } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { obterPlano, type PlanoId } from '@/constants/planos';
import { FormularioCartao } from '@/features/billing/components/FormularioCartao';
import { PixPendente } from '@/features/billing/components/PixPendente';
import type { DadosCheckout } from '@/features/billing/types';
import type {
  DadosPix,
  MetodoPagamento,
  ResultadoCobranca,
  StatusPagamento,
} from '@/lib/pagamento/types';
import { cn, formatarMoeda } from '@/lib/utils';

const INTERVALO_POLLING_MS = 4000;

const METODOS: { valor: MetodoPagamento; rotulo: string }[] = [
  { valor: 'cartao', rotulo: 'Cartão de crédito' },
  { valor: 'pix', rotulo: 'Pix' },
];

interface PixEmAndamento extends DadosPix {
  transacaoId: string;
}

export interface SimuladorPagamentoModalProps {
  aberto: boolean;
  planoSelecionado: PlanoId;
  emailPagador: string;
  aoFechar: () => void;
  aoSubmeter: (dados: DadosCheckout) => Promise<ResultadoCobranca>;
  aoVerificarStatus: (transacaoId: string) => Promise<ResultadoCobranca>;
  aoConcluir: (resultado: ResultadoCobranca) => void | Promise<void>;
}

// Checkout simulado da assinatura: cartão resolve na hora, Pix gera o QR Code
// e fica consultando o status até o provedor aprovar ou recusar
export function SimuladorPagamentoModal({
  aberto,
  planoSelecionado,
  emailPagador,
  aoFechar,
  aoSubmeter,
  aoVerificarStatus,
  aoConcluir,
}: SimuladorPagamentoModalProps) {
  const [pendente, iniciarTransicao] = useTransition();
  const [metodo, setMetodo] = useState<MetodoPagamento>('cartao');
  const [erro, setErro] = useState<string | null>(null);
  const [pix, setPix] = useState<PixEmAndamento | null>(null);
  const [statusPix, setStatusPix] = useState<StatusPagamento>('pendente');

  const plano = obterPlano(planoSelecionado);

  useEffect(() => {
    if (!pix || statusPix !== 'pendente') return;

    const intervalo = setInterval(() => {
      iniciarTransicao(async () => {
        const resultado = await aoVerificarStatus(pix.transacaoId);

        if (resultado.status === 'pendente') return;

        setStatusPix(resultado.status);
        await aoConcluir(resultado);
      });
    }, INTERVALO_POLLING_MS);

    return () => clearInterval(intervalo);
  }, [pix, statusPix, aoVerificarStatus, aoConcluir]);

  function cobrar(dados: DadosCheckout) {
    setErro(null);

    iniciarTransicao(async () => {
      const resultado = await aoSubmeter(dados);

      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }

      if (resultado.status === 'pendente' && resultado.transacaoId && resultado.pix) {
        setPix({ transacaoId: resultado.transacaoId, ...resultado.pix });
        return;
      }

      await aoConcluir(resultado);
    });
  }

  return (
    <Modal
      aberto={aberto}
      titulo={plano ? 'Assinatura do plano ' + plano.nome : 'Assinatura do plano'}
      descricao="Cobrança simulada no ambiente de testes do Mercado Pago. Nenhum valor é cobrado."
      aoFechar={aoFechar}
      className="max-w-lg"
    >
      <div className="flex items-baseline justify-between gap-4 rounded-[8px] bg-muted-bg px-4 py-3">
        <span className="min-w-0 truncate text-sm text-muted">{emailPagador}</span>
        <span className="shrink-0 font-title text-lg font-bold text-primary">
          {plano ? formatarMoeda(plano.precoMensal) + '/mês' : '—'}
        </span>
      </div>

      {erro ? <Alert tom="erro">{erro}</Alert> : null}

      {pix ? (
        <PixPendente
          pix={pix}
          status={statusPix}
          aoAdiar={() =>
            aoConcluir({ sucesso: false, status: 'pendente', transacaoId: pix.transacaoId })
          }
        />
      ) : (
        <>
          <div role="tablist" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-1 rounded-[8px] border border-border p-1">
            {METODOS.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                role="tab"
                aria-selected={metodo === opcao.valor}
                onClick={() => setMetodo(opcao.valor)}
                className={cn(
                  'h-9 cursor-pointer rounded-[6px] text-sm font-medium transition-colors duration-200 ease-in-out',
                  metodo === opcao.valor ? 'bg-primary text-white' : 'text-muted hover:bg-muted-bg'
                )}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>

          {metodo === 'cartao' ? (
            <FormularioCartao
              pendente={pendente}
              aoCancelar={aoFechar}
              aoConfirmar={(statusTeste) => cobrar({ metodo: 'cartao', emailPagador, statusTeste })}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-muted">
                Ao confirmar, geramos um QR Code Pix no ambiente de testes do provedor.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variante="secondary"
                  onClick={aoFechar}
                  disabled={pendente}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={() => cobrar({ metodo: 'pix', emailPagador })}
                  disabled={pendente}
                  className="w-full sm:w-auto"
                >
                  {pendente ? 'Gerando Pix...' : 'Gerar QR Code'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
