'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { CalendarOff, Eye, Trash2 } from 'lucide-react';

import { AcaoIcone, acaoIconeClasses } from '@/components/ui/AcaoIcone';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { encerrarLocacaoAction, removerLocacaoAction } from '@/features/professional/actions';
import type { LocacaoDetalhada } from '@/features/professional/types';
import { formatarData } from '@/lib/utils';

export interface LocacaoTabelaProps {
  locacoes: LocacaoDetalhada[];
  podeGerenciar: boolean;
}

export function LocacaoTabela({ locacoes, podeGerenciar }: LocacaoTabelaProps) {
  const [pendente, iniciarTransicao] = useTransition();

  function encerrar(locacao: LocacaoDetalhada) {
    const confirmado = window.confirm(
      `Encerrar o vínculo de ${locacao.profissional.nome} com ${locacao.unidade.nome} hoje?`
    );

    if (!confirmado) return;

    iniciarTransicao(async () => {
      await encerrarLocacaoAction(locacao.id);
    });
  }

  function remover(locacao: LocacaoDetalhada) {
    const confirmado = window.confirm(
      `Remover o vínculo de ${locacao.profissional.nome} com ${locacao.unidade.nome}?`
    );

    if (!confirmado) return;

    iniciarTransicao(async () => {
      await removerLocacaoAction(locacao.id);
    });
  }

  if (locacoes.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhuma locação encontrada com esse filtro.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th className="w-full px-4 py-3">Profissional</th>
            <th className="px-4 py-3 whitespace-nowrap">Unidade</th>
            <th className="px-4 py-3 whitespace-nowrap">Início</th>
            <th className="px-4 py-3 whitespace-nowrap">Término</th>
            <th className="px-4 py-3 whitespace-nowrap">Status</th>
            <th className="px-4 py-3">
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
              <td className="px-4 py-3 whitespace-nowrap text-muted">
                {locacao.unidade.nome}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted tabular-nums">
                {formatarData(locacao.data_inicio)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted tabular-nums">
                {locacao.data_fim ? formatarData(locacao.data_fim) : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <EtiquetaAtivo ativo={locacao.ativa} rotulos={['Vigente', 'Encerrada']} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/profissionais/${locacao.profissional.id}`}
                    aria-label={`Ver ${locacao.profissional.nome}`}
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
                          onClick={() => encerrar(locacao)}
                          disabled={pendente}
                        >
                          <CalendarOff className="size-4" aria-hidden />
                        </AcaoIcone>
                      ) : null}

                      <AcaoIcone
                        rotulo="Remover locação"
                        tom="perigo"
                        onClick={() => remover(locacao)}
                        disabled={pendente}
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
  );
}
