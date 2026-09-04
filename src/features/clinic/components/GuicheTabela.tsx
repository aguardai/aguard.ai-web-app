'use client';

import { useState, useTransition } from 'react';
import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
import { alternarAtivoGuicheAction, removerGuicheAction } from '@/features/clinic/actions';
import type { GuicheComUnidade } from '@/features/clinic/types';

type Acao = 'alternar' | 'remover';

interface Alvo {
  guiche: GuicheComUnidade;
  acao: Acao;
}

export interface GuicheTabelaProps {
  guiches: GuicheComUnidade[];
  podeGerenciar: boolean;
  aoEditar: (guiche: GuicheComUnidade) => void;
}

export function GuicheTabela({ guiches, podeGerenciar, aoEditar }: GuicheTabelaProps) {
  const [pendente, iniciarTransicao] = useTransition();
  const [alvo, setAlvo] = useState<Alvo | null>(null);

  function confirmar() {
    if (!alvo) return;

    iniciarTransicao(async () => {
      if (alvo.acao === 'remover') {
        await removerGuicheAction(alvo.guiche.id);
      } else {
        await alternarAtivoGuicheAction(alvo.guiche.id, !alvo.guiche.ativo);
      }

      setAlvo(null);
    });
  }

  const desativando = alvo?.acao === 'alternar' && alvo.guiche.ativo;
  const removendo = alvo?.acao === 'remover';
  const nomeAlvo = alvo?.guiche.nome ?? '';

  const descricao = removendo
    ? nomeAlvo + ' sai das listagens. Os atendimentos já chamados por ele são preservados.'
    : desativando
      ? nomeAlvo + ' deixa de chamar senhas e sai do cálculo da espera estimada da unidade.'
      : nomeAlvo + ' volta a chamar senhas da fila da unidade.';

  if (guiches.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhum guichê cadastrado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
        <table className="w-full min-w-[38rem] text-left text-sm whitespace-nowrap">
          <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
            <tr>
              <th className="w-full px-4 py-3">Guichê</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Unidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {guiches.map((guiche) => (
              <tr key={guiche.id} className="transition-colors hover:bg-muted-bg/60">
                <td className="w-full px-4 py-3 font-medium text-foreground">{guiche.nome}</td>
                <td className="px-4 py-3 font-mono text-muted">{guiche.codigo}</td>
                <td className="px-4 py-3 text-muted">{guiche.unidade?.nome ?? '—'}</td>
                <td className="px-4 py-3">
                  <EtiquetaAtivo ativo={guiche.ativo} />
                </td>
                <td className="px-4 py-3">
                  {podeGerenciar ? (
                    <div className="flex items-center justify-end gap-2">
                      <AcaoIcone
                        rotulo={'Editar ' + guiche.nome}
                        onClick={() => aoEditar(guiche)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </AcaoIcone>

                      <AcaoIcone
                        rotulo={(guiche.ativo ? 'Desativar ' : 'Reativar ') + guiche.nome}
                        onClick={() => setAlvo({ guiche, acao: 'alternar' })}
                      >
                        {guiche.ativo ? (
                          <PowerOff className="size-4" aria-hidden />
                        ) : (
                          <Power className="size-4" aria-hidden />
                        )}
                      </AcaoIcone>

                      <AcaoIcone
                        rotulo={'Remover ' + guiche.nome}
                        tom="perigo"
                        onClick={() => setAlvo({ guiche, acao: 'remover' })}
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

      <ModalConfirmacao
        aberto={alvo !== null}
        titulo={removendo ? 'Remover guichê' : desativando ? 'Desativar guichê' : 'Reativar guichê'}
        descricao={descricao}
        rotuloConfirmar={removendo ? 'Remover' : desativando ? 'Desativar' : 'Reativar'}
        variante={removendo ? 'danger' : 'primary'}
        pendente={pendente}
        aoConfirmar={confirmar}
        aoCancelar={() => setAlvo(null)}
      />
    </>
  );
}
