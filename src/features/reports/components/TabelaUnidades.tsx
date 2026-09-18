import type { ResumoUnidade } from '@/features/reports/types';
import { formatarMinutos, formatarNumero } from '@/lib/utils';

export interface TabelaUnidadesProps {
  unidades: ResumoUnidade[];
}

// Movimento de hoje por unidade, a partir de vw_dashboard_unidade
export function TabelaUnidades({ unidades }: TabelaUnidadesProps) {
  if (unidades.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhuma unidade cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">Resumo do dia por unidade</caption>
        <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">Unidade</th>
            <th scope="col" className="px-4 py-3 text-right">Guichês</th>
            <th scope="col" className="px-4 py-3 text-right">Tickets hoje</th>
            <th scope="col" className="px-4 py-3 text-right">Na fila agora</th>
            <th scope="col" className="px-4 py-3 text-right">Espera média</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {unidades.map((unidade) => (
            <tr key={unidade.unidadeId} className="transition-colors hover:bg-muted-bg/60">
              <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                {unidade.nome}
              </td>
              <td className="px-4 py-3 text-right text-muted tabular-nums">
                {formatarNumero(unidade.totalGuiches)}
              </td>
              <td className="px-4 py-3 text-right text-muted tabular-nums">
                {formatarNumero(unidade.ticketsHoje)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span
                  className={
                    unidade.aguardandoAgora > 0
                      ? 'font-semibold text-primary'
                      : 'text-muted'
                  }
                >
                  {formatarNumero(unidade.aguardandoAgora)}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-muted tabular-nums">
                {formatarMinutos(unidade.esperaMediaHoje)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
