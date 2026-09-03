import { History, Clock, CheckCircle2 } from 'lucide-react';
import type { AtendimentoHistoricoItem } from '../types';

export interface AttendanceHistoryTableProps {
  historico: AtendimentoHistoricoItem[];
}

// Função auxiliar para calcular duração em minutos entre início e término
function calcularDuracaoMinutos(inicio?: string | null, fim?: string | null): string {
  if (!inicio || !fim) return '--';
  const dataInicio = new Date(inicio).getTime();
  const dataFim = new Date(fim).getTime();
  const diffMs = dataFim - dataInicio;
  if (diffMs <= 0) return '0 min';
  const minutos = Math.round(diffMs / 60000);
  return `${minutos} min`;
}

// Função para formatar o valor do status para exibição
function formatarStatus(status: string): string {
  const statusFormatado = status.replace('_', ' ');
  return statusFormatado.charAt(0).toUpperCase() + statusFormatado.slice(1);
}

export function AttendanceHistoryTable({ historico }: AttendanceHistoryTableProps) {
  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-title flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <History className="size-7 text-primary" />
            Histórico de Atendimentos
          </h1>
          <p className="mt-1 text-sm text-muted">
            Consultas e atendimentos registrados no sistema.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted-bg text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-6 py-4">
                  Senha / Paciente
                </th>
                <th scope="col" className="px-6 py-4">
                  Início / Fim
                </th>
                <th scope="col" className="px-6 py-4">
                  Duração
                </th>
                <th scope="col" className="px-6 py-4">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historico.length > 0 ? (
                historico.map((item) => {
                  const horaInicio = item.started_at || item.created_at
                    ? new Date(item.started_at || item.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--';

                  const horaFim = item.finished_at
                    ? new Date(item.finished_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--';

                  const duracao = calcularDuracaoMinutos(
                    item.started_at || item.created_at,
                    item.finished_at
                  );

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-muted-bg/50">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{item.senha}</span>
                          <span className="text-foreground">
                            {item.paciente_nome || 'Paciente sem nome'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted">
                          <Clock className="size-3.5 text-muted" />
                          <span>
                            {horaInicio} às {horaFim}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {duracao}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="size-3.5" />
                          {formatarStatus(item.status || 'finalizado')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted">
                    Nenhum atendimento encontrado na tabela do banco de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}