import { Badge } from '@/components/ui/Badge';
import type { ConsultaComPaciente } from '@/features/attendance/types';
import { formatarData, formatarHora } from '@/lib/utils';

export interface HistoricoListaProps {
  consultas: ConsultaComPaciente[];
  temBusca: boolean;
}

function duracaoEmMinutos(inicio?: string | null, fim?: string | null): string {
  if (!inicio || !fim) {
    return '—';
  }

  const diferenca = new Date(fim).getTime() - new Date(inicio).getTime();

  return diferenca <= 0 ? '0 min' : Math.round(diferenca / 60000) + ' min';
}

function formatarStatus(status: string): string {
  const formatado = status.replace('_', ' ');

  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}

export function HistoricoLista({ consultas, temBusca }: HistoricoListaProps) {
  if (consultas.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        {temBusca
          ? 'Nenhum resultado para essa busca.'
          : 'Nenhuma consulta registrada no histórico.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
      <table className="w-full min-w-[46rem] text-left text-sm whitespace-nowrap">
        <caption className="sr-only">Histórico de atendimentos do profissional</caption>
        <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">Senha</th>
            <th scope="col" className="w-full px-4 py-3">Paciente</th>
            <th scope="col" className="px-4 py-3">Data</th>
            <th scope="col" className="px-4 py-3">Horário</th>
            <th scope="col" className="px-4 py-3">Duração</th>
            <th scope="col" className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {consultas.map((consulta) => {
            const inicio = consulta.atendido_em || consulta.chamado_em || consulta.entrada_fila;
            const fim = consulta.finalizado_em;
            const encerradoSemAtendimento =
              consulta.status === 'ausente' || consulta.status === 'cancelado';

            return (
              <tr key={consulta.id} className="transition-colors hover:bg-muted-bg/60">
                <td className="px-4 py-3 font-mono font-medium text-primary">
                  {consulta.senha ?? '—'}
                </td>

                <td className="w-full px-4 py-3 font-medium text-foreground">
                  {consulta.paciente?.nome ?? (
                    <span className="text-muted">Nome indisponível</span>
                  )}
                </td>

                <td className="px-4 py-3 text-muted">
                  {formatarData(consulta.data_fila)}
                </td>

                <td className="px-4 py-3 text-muted">
                  {formatarHora(inicio)}
                  {fim ? ' às ' + formatarHora(fim) : ''}
                </td>

                <td className="px-4 py-3 text-muted">
                  {encerradoSemAtendimento ? '—' : duracaoEmMinutos(inicio, fim)}
                </td>

                <td className="px-4 py-3">
                  <Badge
                    tom={
                      consulta.status === 'ausente'
                        ? 'alerta'
                        : consulta.status === 'cancelado'
                          ? 'perigo'
                          : 'sucesso'
                    }
                  >
                    {formatarStatus(consulta.status)}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
