'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { Modal } from '@/components/ui/Modal';
import { GuicheForm } from '@/features/clinic/components/GuicheForm';
import { GuicheTabela } from '@/features/clinic/components/GuicheTabela';
import type { GuicheComUnidade, UnidadeResumo } from '@/features/clinic/types';
import { formatarNumero } from '@/lib/utils';

export interface GuichesGestaoProps {
  guiches: GuicheComUnidade[];
  unidades: UnidadeResumo[];
  podeGerenciar: boolean;
  total: number;
  ativos: number;
  paginacao: React.ReactNode;
}

// Cadastro e edição usam o mesmo modal: a chave do formulário troca junto com o
// alvo para reiniciar o estado da action
export function GuichesGestao({
  guiches,
  unidades,
  podeGerenciar,
  total,
  ativos,
  paginacao,
}: GuichesGestaoProps) {
  const [alvo, setAlvo] = useState<GuicheComUnidade | null>(null);
  const [aberto, setAberto] = useState(false);

  function abrirNovo() {
    setAlvo(null);
    setAberto(true);
  }

  function abrirEdicao(guiche: GuicheComUnidade) {
    setAlvo(guiche);
    setAberto(true);
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Guichês"
        descricao={`${formatarNumero(total)} cadastrados · ${formatarNumero(ativos)} ativos`}
        acoes={
          podeGerenciar ? (
            <Button
              type="button"
              onClick={abrirNovo}
              disabled={unidades.length === 0}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" aria-hidden />
              Novo guichê
            </Button>
          ) : null
        }
      />

      <GuicheTabela guiches={guiches} podeGerenciar={podeGerenciar} aoEditar={abrirEdicao} />

      {paginacao}

      <Modal
        aberto={aberto}
        titulo={alvo ? 'Editar guichê' : 'Novo guichê'}
        descricao="O guichê chama as senhas da fila compartilhada da unidade."
        aoFechar={() => setAberto(false)}
      >
        <GuicheForm
          key={alvo?.id ?? 'novo'}
          guiche={alvo ?? undefined}
          unidades={unidades}
          aoCancelar={() => setAberto(false)}
        />
      </Modal>
    </div>
  );
}
