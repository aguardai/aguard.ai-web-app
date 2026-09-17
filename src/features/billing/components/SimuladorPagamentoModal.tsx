'use client';

import { useEffect, useState, useTransition } from 'react';

import { PLANOS, type PlanoId } from '@/constants/planos';
import type { MetodoPagamento, ResultadoCobranca } from '@/lib/payment/types';
import { formatarMoeda } from '@/lib/utils';

export interface DadosCheckout {
  metodo: MetodoPagamento;
  emailPagador: string;
  statusTeste?: string;
}

interface SimuladorPagamentoModalProps {
  planoSelecionado: PlanoId;
  emailPagador: string;
  aoFechar: () => void;
  aoSubmeter: (dados: DadosCheckout) => Promise<ResultadoCobranca>;
  aoVerificarStatus: (transacaoId: string) => Promise<ResultadoCobranca>;
  aoConcluir: (resultado: ResultadoCobranca) => void | Promise<void>;
}

const CENARIOS_TESTE = [
  { valor: 'APRO', rotulo: 'Aprovado' },
  { valor: 'OTHE', rotulo: 'Recusado' },
];

function formatarNumeroCartao(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatarValidade(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

export function SimuladorPagamentoModal({
  planoSelecionado,
  emailPagador,
  aoFechar,
  aoSubmeter,
  aoVerificarStatus,
  aoConcluir,
}: SimuladorPagamentoModalProps) {
  const [pendente, iniciarTransicao] = useTransition();
  const [aba, setAba] = useState<'cartao' | 'pix'>('cartao');
  const [erro, setErro] = useState<string | null>(null);
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeCartao, setNomeCartao] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [statusTeste, setStatusTeste] = useState('APRO');
  const [pix, setPix] = useState<{ transacaoId: string; qrCodeBase64: string; copiaECola: string } | null>(null);
  const [statusPix, setStatusPix] = useState<'pendente' | 'aprovado' | 'recusado'>('pendente');

  const planoInfo = PLANOS.find((plano) => plano.id === planoSelecionado);

  useEffect(() => {
    if (!pix || statusPix !== 'pendente') return;

    const intervalo = setInterval(() => {
      iniciarTransicao(async () => {
        const resultado = await aoVerificarStatus(pix.transacaoId);

        if (resultado.status === 'aprovado') {
          setStatusPix('aprovado');
          await aoConcluir(resultado);
        } else if (resultado.status === 'recusado') {
          setStatusPix('recusado');
          await aoConcluir(resultado);
        }
      });
    }, 4000);

    return () => clearInterval(intervalo);
  }, [pix, statusPix, aoVerificarStatus, aoConcluir]);

  const enviarCartao = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    iniciarTransicao(async () => {
      const resultado = await aoSubmeter({ metodo: 'cartao', emailPagador, statusTeste });

      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }

      await aoConcluir(resultado);
    });
  };

  const gerarPix = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    iniciarTransicao(async () => {
      const resultado = await aoSubmeter({ metodo: 'pix', emailPagador });

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-lg">
        <h2 className="font-title text-lg font-bold text-foreground">
          Assinatura do plano {planoInfo?.nome}
        </h2>
        <p className="mt-1 text-xs text-muted">
          Pagamento via Mercado Pago Sandbox — nenhuma cobrança real ocorre.
        </p>
        <p className="mt-1 text-xs text-muted">
          Confirmação será enviada para <span className="font-medium">{emailPagador}</span>.
        </p>
        <p className="mt-3 text-sm font-semibold text-primary">
          {planoInfo ? `${formatarMoeda(planoInfo.precoMensal)}/mês` : ''}
        </p>

        {erro ? <p className="mt-3 text-sm text-danger">{erro}</p> : null}

        {!pix ? (
          <>
            <div className="mt-4 flex rounded-md border border-border p-1">
              <button
                type="button"
                onClick={() => setAba('cartao')}
                className={`flex-1 rounded-sm py-1.5 text-sm font-medium ${
                  aba === 'cartao' ? 'bg-primary text-white' : 'text-muted'
                }`}
              >
                Cartão de crédito
              </button>
              <button
                type="button"
                onClick={() => setAba('pix')}
                className={`flex-1 rounded-sm py-1.5 text-sm font-medium ${
                  aba === 'pix' ? 'bg-primary text-white' : 'text-muted'
                }`}
              >
                Pix
              </button>
            </div>

            {aba === 'cartao' ? (
              <form onSubmit={enviarCartao} className="mt-4 flex flex-col gap-3">
                <label className="text-sm">
                  Número do cartão
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={numeroCartao}
                    onChange={(e) => setNumeroCartao(formatarNumeroCartao(e.target.value))}
                    className="mt-1 w-full rounded-md border border-border p-2 text-sm"
                    disabled={pendente}
                    required
                  />
                </label>

                <label className="text-sm">
                  Nome impresso no cartão
                  <input
                    type="text"
                    value={nomeCartao}
                    onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-md border border-border p-2 text-sm"
                    disabled={pendente}
                    required
                  />
                </label>

                <div className="flex gap-3">
                  <label className="flex-1 text-sm">
                    Validade
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/AA"
                      value={validade}
                      onChange={(e) => setValidade(formatarValidade(e.target.value))}
                      className="mt-1 w-full rounded-md border border-border p-2 text-sm"
                      disabled={pendente}
                      required
                    />
                  </label>
                  <label className="flex-1 text-sm">
                    CVV
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="mt-1 w-full rounded-md border border-border p-2 text-sm"
                      disabled={pendente}
                      required
                    />
                  </label>
                </div>

                <div className="mt-1 rounded-md bg-slate-50 p-3">
                  <label className="text-xs text-muted">
                    Ambiente de testes — resultado simulado
                    <select
                      value={statusTeste}
                      onChange={(e) => setStatusTeste(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border p-1.5 text-xs"
                      disabled={pendente}
                    >
                      {CENARIOS_TESTE.map((cenario) => (
                        <option key={cenario.valor} value={cenario.valor}>
                          {cenario.rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={aoFechar}
                    disabled={pendente}
                    className="rounded-md px-4 py-2 text-sm text-muted hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pendente}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pendente ? 'Processando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={gerarPix} className="mt-4 flex flex-col gap-3">
                <p className="text-xs text-muted">
                  Um QR Code Pix real do Mercado Pago Sandbox é gerado ao confirmar.
                </p>

                <div className="mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={aoFechar}
                    disabled={pendente}
                    className="rounded-md px-4 py-2 text-sm text-muted hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pendente}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pendente ? 'Gerando Pix...' : 'Gerar QR Code'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3 text-center">
            {statusPix === 'aprovado' ? (
              <p className="text-sm font-semibold text-success">Pagamento confirmado!</p>
            ) : statusPix === 'recusado' ? (
              <p className="text-sm font-semibold text-danger">Pagamento não aprovado.</p>
            ) : (
              <>
                <img
                  src={`data:image/png;base64,${pix.qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="h-48 w-48 rounded-md border border-border"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(pix.copiaECola)}
                  className="w-full truncate rounded-md border border-border p-2 text-xs text-muted hover:bg-slate-50"
                >
                  {pix.copiaECola}
                </button>
                <p className="text-xs text-muted">
                  Aguardando confirmação — verificando automaticamente a cada poucos segundos.
                </p>
                <button type="button" onClick={aoFechar} className="text-xs text-muted underline">
                  Fechar e continuar depois
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}