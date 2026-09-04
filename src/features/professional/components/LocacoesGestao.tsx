'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { Modal } from '@/components/ui/Modal';
import type { UnidadeResumo } from '@/features/clinic/types';
import { FiltrosLocacoes } from '@/features/professional/components/FiltrosLocacoes';
import { LocacaoForm } from '@/features/professional/components/LocacaoForm';
import { LocacaoTabela } from '@/features/professional/components/LocacaoTabela';
import type { LocacaoDetalhada, Profissional } from '@/features/professional/types';
import { formatarNumero } from '@/lib/utils';

export interface LocacoesGestaoProps {
  locacoes: LocacaoDetalhada[];
  profissionais: Profissional[];
  unidades: UnidadeResumo[];
  podeGerenciar: boolean;
  total: number;
  vigentes: number;
  unidadeId: string;
  situacao: string;
  paginacao: React.ReactNode;
}

export function LocacoesGestao({
  locacoes,
  profissionais,
  unidades,
  podeGerenciar,
  total,
  vigentes,
  unidadeId,
  situacao,
  paginacao,
}: LocacoesGestaoProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Locações"
        descricao={`${formatarNumero(total)} vínculos · ${formatarNumero(vigentes)} vigentes`}
        acoes={
          podeGerenciar ? (
            <Button
              type="button"
              onClick={() => setAberto(true)}
              disabled={profissionais.length === 0 || unidades.length === 0}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" aria-hidden />
              Nova locação
            </Button>
          ) : null
        }
      />

      <FiltrosLocacoes unidades={unidades} unidadeId={unidadeId} situacao={situacao} />

      <LocacaoTabela locacoes={locacoes} podeGerenciar={podeGerenciar} />

      {paginacao}

      <Modal
        aberto={aberto}
        titulo="Nova locação"
        descricao="O vínculo define em quais unidades o profissional atende."
        aoFechar={() => setAberto(false)}
      >
        <LocacaoForm
          profissionais={profissionais}
          unidades={unidades}
          aoCancelar={() => setAberto(false)}
        />
      </Modal>
    </div>
  );
}
