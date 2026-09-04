'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { GuicheForm } from '@/features/clinic/components/GuicheForm';
import { GuicheTabela } from '@/features/clinic/components/GuicheTabela';
import type { GuicheComUnidade, UnidadeResumo } from '@/features/clinic/types';
import { formatarNumero } from '@/lib/utils';

export interface GuichesGestaoProps {
  guiches: GuicheComUnidade[];
  unidades: UnidadeResumo[];
  podeGerenciar: boolean;
}

// O cadastro e a edição usam o mesmo painel: a chave do formulário troca junto
// com o alvo para reiniciar o estado da action
export function GuichesGestao({ guiches, unidades, podeGerenciar }: GuichesGestaoProps) {
  const [alvo, setAlvo] = useState<GuicheComUnidade | null>(null);
  const [aberto, setAberto] = useState(false);

  const ativos = guiches.filter((guiche) => guiche.ativo).length;

  function abrirNovo() {
    setAlvo(null);
    setAberto(true);
  }

  function abrirEdicao(guiche: GuicheComUnidade) {
    setAlvo(guiche);
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    setAlvo(null);
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Guichês"
        descricao={`${formatarNumero(guiches.length)} cadastrados · ${formatarNumero(ativos)} ativos`}
        acoes={
          podeGerenciar && !aberto ? (
            <Button type="button" onClick={abrirNovo} disabled={unidades.length === 0}>
              <Plus className="size-4" aria-hidden />
              Novo guichê
            </Button>
          ) : null
        }
      />

      {aberto ? (
        <section className="flex flex-col gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-title text-base font-bold text-foreground">
              {alvo ? 'Editar guichê' : 'Novo guichê'}
            </h2>
            <p className="text-sm text-muted">
              O guichê chama as senhas da fila compartilhada da unidade.
            </p>
          </div>

          <GuicheForm
            key={alvo?.id ?? 'novo'}
            guiche={alvo ?? undefined}
            unidades={unidades}
            aoCancelar={fechar}
          />
        </section>
      ) : null}

      <GuicheTabela
        guiches={guiches}
        podeGerenciar={podeGerenciar}
        aoEditar={abrirEdicao}
      />
    </div>
  );
}
