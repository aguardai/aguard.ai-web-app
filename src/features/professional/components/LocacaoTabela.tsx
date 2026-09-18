'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { CalendarOff, Eye, Trash2 } from 'lucide-react';

import { AcaoIcone, acaoIconeClasses } from '@/components/ui/AcaoIcone';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
import { encerrarLocacaoAction, removerLocacaoAction } from '@/features/professional/actions';
import type { LocacaoDetalhada } from '@/features/professional/types';
import { formatarData } from '@/lib/utils';

type Acao = 'encerrar' | 'remover';

interface Alvo {
  locacao: LocacaoDetalhada;
  acao: Acao;
}

export interface LocacaoTabelaProps {
  locacoes: LocacaoDetalhada[];
  podeGerenciar: boolean;
}

export function LocacaoTabela({ locacoes, podeGerenciar }: LocacaoTabelaProps) {
  const [pendente, iniciarTransicao] = useTransition();
  const [alvo, setAlvo] = useState<Alvo | null>(null);

  function confirmar() {
    if (!alvo) return;

    iniciarTransicao(async () => {
      if (alvo.acao === 'remover') {
        await removerLocacaoAction(alvo.locacao.id);
      } else {
        await encerrarLocacaoAction(alvo.locacao.id);
      }

      setAlvo(null);
    });
  }

  const removendo = alvo?.acao === 'remover';
  const vinculo = alvo
    ? alvo.locacao.profissional.nome + ' e ' + alvo.locacao.unidade.nome
    : '';

  if (locacoes.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhuma locação encontrada com esse filtro.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
        <table className="w-full min-w-[44rem] text-left text-sm whitespace-nowrap">
          <caption className="sr-only">Locações de profissionais por unidade</caption>
          <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="w-full px-4 py-3">Profissional</th>
              <th scope="col" className="px-4 py-3">Unidade</th>
              <th scope="col" className="px-4 py-3">Início</th>
              <th scope="col" className="px-4 py-3">Término</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {locacoes.map((locacao) => (
              <tr key={locacao.id} className="transition-colors hover:bg-muted-bg/60">
                <td className="w-full px-4 py-3">
                  <p className="font-medium text-foreground">{locacao.profissional.nome}</p>
                  <p className="text-xs text-muted">{locacao.profissional.especialidade}</p>
                </td>
                <td className="px-4 py-3 text-muted">{locacao.unidade.nome}</td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {formatarData(locacao.data_inicio)}
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">
                  {locacao.data_fim ? formatarData(locacao.data_fim) : '—'}
                </td>
                <td className="px-4 py-3">
                  <EtiquetaAtivo ativo={locacao.ativa} rotulos={['Vigente', 'Encerrada']} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={'/profissionais/' + locacao.profissional.id}
                      aria-label={'Ver ' + locacao.profissional.nome}
                      title="Ver profissional"
                      className={acaoIconeClasses()}
                    >
                      <Eye className="size-4" aria-hidden />
                    </Link>

                    {podeGerenciar ? (
                      <>
                        {locacao.ativa ? (
                          <AcaoIcone
                            rotulo="Encerrar locação"
                            onClick={() => setAlvo({ locacao, acao: 'encerrar' })}
                          >
                            <CalendarOff className="size-4" aria-hidden />
                          </AcaoIcone>
                        ) : null}

                        <AcaoIcone
                          rotulo="Remover locação"
                          tom="perigo"
                          onClick={() => setAlvo({ locacao, acao: 'remover' })}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </AcaoIcone>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalConfirmacao
        aberto={alvo !== null}
        titulo={removendo ? 'Remover locação' : 'Encerrar locação'}
        descricao={
          removendo
            ? 'O vínculo entre ' + vinculo + ' sai das listagens.'
            : 'O vínculo entre ' + vinculo + ' recebe a data de saída de hoje e deixa de ser vigente. O histórico é preservado.'
        }
        rotuloConfirmar={removendo ? 'Remover' : 'Encerrar'}
        variante={removendo ? 'danger' : 'primary'}
        pendente={pendente}
        aoConfirmar={confirmar}
        aoCancelar={() => setAlvo(null)}
      />
    </>
  );
}
