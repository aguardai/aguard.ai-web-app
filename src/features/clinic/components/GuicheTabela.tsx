'use client';

import { useTransition } from 'react';
import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { alternarAtivoGuicheAction, removerGuicheAction } from '@/features/clinic/actions';
import type { GuicheComUnidade } from '@/features/clinic/types';

export interface GuicheTabelaProps {
  guiches: GuicheComUnidade[];
  podeGerenciar: boolean;
  aoEditar: (guiche: GuicheComUnidade) => void;
}

export function GuicheTabela({ guiches, podeGerenciar, aoEditar }: GuicheTabelaProps) {
  const [pendente, iniciarTransicao] = useTransition();

  function alternar(guiche: GuicheComUnidade) {
    iniciarTransicao(async () => {
      await alternarAtivoGuicheAction(guiche.id, !guiche.ativo);
    });
  }

  function remover(guiche: GuicheComUnidade) {
    const confirmado = window.confirm(
      `Remover ${guiche.nome}? Os atendimentos já chamados por ele são preservados.`
    );

    if (!confirmado) return;

    iniciarTransicao(async () => {
      await removerGuicheAction(guiche.id);
    });
  }

  if (guiches.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhum guichê cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
      <table className="w-full min-w-[38rem] text-left text-sm">
        <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th className="w-full px-4 py-3">Guichê</th>
            <th className="px-4 py-3 whitespace-nowrap">Código</th>
            <th className="px-4 py-3 whitespace-nowrap">Unidade</th>
            <th className="px-4 py-3 whitespace-nowrap">Status</th>
            <th className="px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {guiches.map((guiche) => (
            <tr key={guiche.id} className="transition-colors hover:bg-muted-bg/60">
              <td className="w-full px-4 py-3 font-medium text-foreground">{guiche.nome}</td>
              <td className="px-4 py-3 font-mono whitespace-nowrap text-muted">
                {guiche.codigo}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">
                {guiche.unidade?.nome ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <EtiquetaAtivo ativo={guiche.ativo} />
              </td>
              <td className="px-4 py-3">
                {podeGerenciar ? (
                  <div className="flex items-center justify-end gap-2">
                    <AcaoIcone rotulo={`Editar ${guiche.nome}`} onClick={() => aoEditar(guiche)}>
                      <Pencil className="size-4" aria-hidden />
                    </AcaoIcone>

                    <AcaoIcone
                      rotulo={guiche.ativo ? `Desativar ${guiche.nome}` : `Reativar ${guiche.nome}`}
                      onClick={() => alternar(guiche)}
                      disabled={pendente}
                    >
                      {guiche.ativo ? (
                        <PowerOff className="size-4" aria-hidden />
                      ) : (
                        <Power className="size-4" aria-hidden />
                      )}
                    </AcaoIcone>

                    <AcaoIcone
                      rotulo={`Remover ${guiche.nome}`}
                      tom="perigo"
                      onClick={() => remover(guiche)}
                      disabled={pendente}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </AcaoIcone>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
