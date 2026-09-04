import type { PontoDiario } from '@/features/reports/types';
import { formatarData, formatarMinutos, formatarNumero } from '@/lib/utils';

export interface GraficoDiarioProps {
  pontos: PontoDiario[];
  titulo: string;
}

// Volume diário em barras de CSS: a altura é proporcional ao maior dia da série.
// No mobile as colunas mantêm largura mínima e a área rola na horizontal
export function GraficoDiario({ pontos, titulo }: GraficoDiarioProps) {
  const maior = Math.max(...pontos.map((ponto) => ponto.total), 1);
  const total = pontos.reduce((soma, ponto) => soma + ponto.total, 0);

  return (
    <figure className="flex h-full min-h-72 min-w-0 flex-col gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-title text-base font-bold text-foreground">{titulo}</h2>
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{formatarNumero(total)}</span> nos
          últimos {pontos.length} dias
        </p>
      </figcaption>

      {total === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-[8px] border border-dashed border-border text-center text-sm text-muted">
          Nenhum atendimento registrado no período.
        </p>
      ) : (
        <div className="scroll-oculto flex-1 overflow-x-auto">
          <div className="flex h-full items-end gap-1.5">
            {pontos.map((ponto) => (
              <div
                key={ponto.data}
                title={`${formatarData(ponto.data)} — ${formatarNumero(ponto.total)} tickets, espera média de ${formatarMinutos(ponto.esperaMedia)}`}
                className="flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-[10px] text-muted tabular-nums">{ponto.total}</span>

                <div
                  className="w-full rounded-t-[4px] bg-gradient-to-t from-primary to-primary-light transition-[height] duration-500 ease-out"
                  style={{ height: `${Math.max((ponto.total / maior) * 100, 2)}%` }}
                />

                <span className="text-[10px] text-muted tabular-nums">
                  {ponto.data.slice(8)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}
