import { MapPin } from 'lucide-react';

import type { LocacaoComUnidade } from '@/features/professional/types';
import { cn } from '@/lib/utils';

export interface LocacoesDoProfissionalProps {
  locacoes: LocacaoComUnidade[];
}

// Somente leitura: locação é gerida na feature de Unidade/Locação, não aqui
export function LocacoesDoProfissional({ locacoes }: LocacoesDoProfissionalProps) {
  if (locacoes.length === 0) {
    return (
      <p className="text-sm text-muted">
        Este profissional ainda não está alocado em nenhuma unidade.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-[12px] border border-border">
      {locacoes.map((locacao) => (
        <li key={locacao.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">{locacao.unidade.nome}</p>
              <p className="text-xs text-muted">
                Desde {new Date(locacao.data_inicio).toLocaleDateString('pt-BR')}
                {locacao.data_fim
                  ? ` até ${new Date(locacao.data_fim).toLocaleDateString('pt-BR')}`
                  : ''}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              locacao.ativa ? 'bg-success text-white' : 'bg-muted-bg text-muted'
            )}
          >
            {locacao.ativa ? 'Vigente' : 'Encerrada'}
          </span>
        </li>
      ))}
    </ul>
  );
}