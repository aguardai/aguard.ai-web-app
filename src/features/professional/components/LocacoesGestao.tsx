'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { Select } from '@/components/ui/Select';
import type { UnidadeResumo } from '@/features/clinic/types';
import { LocacaoForm } from '@/features/professional/components/LocacaoForm';
import { LocacaoTabela } from '@/features/professional/components/LocacaoTabela';
import type { LocacaoDetalhada, Profissional } from '@/features/professional/types';
import { formatarNumero } from '@/lib/utils';

const TODAS = 'todas';

const OPCOES_SITUACAO = [
  { valor: TODAS, rotulo: 'Todas as situações' },
  { valor: 'vigentes', rotulo: 'Vigentes' },
  { valor: 'encerradas', rotulo: 'Encerradas' },
];

export interface LocacoesGestaoProps {
  locacoes: LocacaoDetalhada[];
  profissionais: Profissional[];
  unidades: UnidadeResumo[];
  podeGerenciar: boolean;
}

export function LocacoesGestao({
  locacoes,
  profissionais,
  unidades,
  podeGerenciar,
}: LocacoesGestaoProps) {
  const [aberto, setAberto] = useState(false);
  const [unidadeId, setUnidadeId] = useState(TODAS);
  const [situacao, setSituacao] = useState(TODAS);

  const filtradas = useMemo(
    () =>
      locacoes.filter((locacao) => {
        if (unidadeId !== TODAS && locacao.unidade_id !== unidadeId) return false;
        if (situacao === 'vigentes' && !locacao.ativa) return false;
        if (situacao === 'encerradas' && locacao.ativa) return false;
        return true;
      }),
    [locacoes, unidadeId, situacao]
  );

  const vigentes = locacoes.filter((locacao) => locacao.ativa).length;

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Locações"
        descricao={`${formatarNumero(locacoes.length)} vínculos · ${formatarNumero(vigentes)} vigentes`}
        acoes={
          podeGerenciar && !aberto ? (
            <Button
              type="button"
              onClick={() => setAberto(true)}
              disabled={profissionais.length === 0 || unidades.length === 0}
            >
              <Plus className="size-4" aria-hidden />
              Nova locação
            </Button>
          ) : null
        }
      />

      {aberto ? (
        <section className="flex flex-col gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-title text-base font-bold text-foreground">Nova locação</h2>
            <p className="text-sm text-muted">
              O vínculo define em quais unidades o profissional atende.
            </p>
          </div>

          <LocacaoForm
            profissionais={profissionais}
            unidades={unidades}
            aoCancelar={() => setAberto(false)}
          />
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <Select
          id="filtro-unidade"
          label="Unidade"
          opcoes={[
            { valor: TODAS, rotulo: 'Todas as unidades' },
            ...unidades.map((unidade) => ({ valor: unidade.id, rotulo: unidade.nome })),
          ]}
          value={unidadeId}
          onChange={(evento) => setUnidadeId(evento.target.value)}
        />

        <Select
          id="filtro-situacao"
          label="Situação"
          opcoes={OPCOES_SITUACAO}
          value={situacao}
          onChange={(evento) => setSituacao(evento.target.value)}
        />
      </div>

      <LocacaoTabela locacoes={filtradas} podeGerenciar={podeGerenciar} />
    </div>
  );
}
