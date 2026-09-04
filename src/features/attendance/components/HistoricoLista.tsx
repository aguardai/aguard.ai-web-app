'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, History, UserX, XCircle } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import type { ConsultaComPaciente } from '@/features/attendance/types';

export interface HistoricoListaProps {
  consultas: (ConsultaComPaciente & { paciente_nome?: string })[];
}

function calcularDuracaoMinutos(inicio?: string | null, fim?: string | null): string {
  if (!inicio || !fim) return '--';
  const diffMs = new Date(fim).getTime() - new Date(inicio).getTime();
  if (diffMs <= 0) return '0 min';
  return `${Math.round(diffMs / 60000)} min`;
}

function formatarHora(dataIso?: string | null): string {
  if (!dataIso) return '--:--';
  return new Date(dataIso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarStatus(status: string): string {
  const formatado = status.replace('_', ' ');
  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}

export function HistoricoLista({ consultas }: HistoricoListaProps) {
  const [busca, setBusca] = useState('');

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return consultas;

    return consultas.filter((consulta) => {
      const senha = consulta.senha?.toLowerCase() ?? '';
      const nomePaciente =
        consulta.paciente?.nome?.toLowerCase() ??
        consulta.paciente_nome?.toLowerCase() ??
        '';

      return senha.includes(termo) || nomePaciente.includes(termo);
    });
  }, [busca, consultas]);

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-title flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <History className="size-7 text-primary" aria-hidden />
            Histórico
          </h1>
          <p className="mt-1 text-sm text-muted">Consultas registradas por você.</p>
        </div>

        <div className="max-w-sm sm:w-72">
          <Input
            id="busca-historico"
            name="busca"
            label="Buscar por senha ou paciente"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted-bg text-xs font-semibold tracking-wider text-muted uppercase">
              <tr>
                <th scope="col" className="px-6 py-4">Senha / Paciente</th>
                <th scope="col" className="px-6 py-4">Horário</th>
                <th scope="col" className="px-6 py-4">Duração</th>
                <th scope="col" className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filtradas.length > 0 ? (
                filtradas.map((consulta) => {
                  const ehAusente = consulta.status === 'ausente';
                  const ehCancelado = consulta.status === 'cancelado';

                  const nomeExibicao =
                    consulta.paciente?.nome ||
                    consulta.paciente_nome ||
                    null;

                  const horaInicio =
                    consulta.atendido_em ||
                    consulta.chamado_em ||
                    consulta.entrada_fila;

                  const horaFim = consulta.finalizado_em || null;

                  return (
                    <tr key={consulta.id} className="transition-colors hover:bg-muted-bg/50">
                      <td className="px-6 py-4 font-medium">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{consulta.senha}</span>
                          <span className="text-foreground font-semibold">
                            {nomeExibicao ? (
                              nomeExibicao
                            ) : (
                              <span className="text-muted italic">Nome indisponível</span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted">
                          <Clock className="size-3.5 text-muted" aria-hidden />
                          <span>
                            {formatarHora(horaInicio)}
                            {horaFim ? ` às ${formatarHora(horaFim)}` : ''}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-foreground">
                        {ehAusente || ehCancelado || !horaFim
                          ? '--'
                          : calcularDuracaoMinutos(horaInicio, horaFim)}
                      </td>

                      <td className="px-6 py-4">
                        {ehAusente ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <UserX className="size-3.5" aria-hidden />
                            Ausente
                          </span>
                        ) : ehCancelado ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                            <XCircle className="size-3.5" aria-hidden />
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="size-3.5" aria-hidden />
                            {formatarStatus(consulta.status)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted">
                    {consultas.length === 0
                      ? 'Nenhuma consulta registrada no histórico.'
                      : 'Nenhum resultado para essa busca.'}
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