'use client';

import { useRouter } from 'next/navigation';

import { Select } from '@/components/ui/Select';
import type { UnidadeResumo } from '@/features/clinic/types';

const TODAS = 'todas';

const OPCOES_SITUACAO = [
  { valor: TODAS, rotulo: 'Todas as situações' },
  { valor: 'vigentes', rotulo: 'Vigentes' },
  { valor: 'encerradas', rotulo: 'Encerradas' },
];

export interface FiltrosLocacoesProps {
  unidades: UnidadeResumo[];
  unidadeId: string;
  situacao: string;
}

// Os filtros vão para a URL porque a listagem é paginada no banco: filtrar só a
// página aberta daria um resultado errado
export function FiltrosLocacoes({ unidades, unidadeId, situacao }: FiltrosLocacoesProps) {
  const router = useRouter();

  function navegar(campo: 'unidade' | 'situacao', valor: string) {
    const busca = new URLSearchParams({
      unidade: campo === 'unidade' ? valor : unidadeId,
      situacao: campo === 'situacao' ? valor : situacao,
    });

    router.push('/locacoes?' + busca.toString());
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
      <Select
        id="filtro-unidade"
        label="Unidade"
        opcoes={[
          { valor: TODAS, rotulo: 'Todas as unidades' },
          ...unidades.map((unidade) => ({ valor: unidade.id, rotulo: unidade.nome })),
        ]}
        value={unidadeId}
        onChange={(evento) => navegar('unidade', evento.target.value)}
      />

      <Select
        id="filtro-situacao"
        label="Situação"
        opcoes={OPCOES_SITUACAO}
        value={situacao}
        onChange={(evento) => navegar('situacao', evento.target.value)}
      />
    </div>
  );
}
