'use client';

import { useEffect, useRef, useState } from 'react';
import { ListOrdered, Stethoscope, Users } from 'lucide-react';

import { listarFilaUnificada } from '@/features/queue-monitor/services/monitor';
import type { TicketFilaUnificada } from '@/features/queue-monitor/types';

const INTERVALO_ATUALIZACAO_MS = 5000;

const ROTULOS_STATUS: Record<string, string> = {
  aguardando: 'Aguardando',
  chamado: 'Chamado',
  em_atendimento: 'Em atendimento',
};

function formatarHorario(dataIso?: string | null): string {
  if (!dataIso) return '--:--';
  return new Date(dataIso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

interface ColunaFilaProps {
  titulo: string;
  Icone: typeof ListOrdered;
  tickets: TicketFilaUnificada[];
}

function ColunaFila({ titulo, Icone, tickets }: ColunaFilaProps) {
  return (
    <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
          <Icone className="size-4 text-primary" aria-hidden />
          {titulo}
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {tickets.length} na fila
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {tickets.length > 0 ? (
          tickets.map((ticket, idx) => (
            <div
              key={ticket.ticket_id}
              className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-white p-3 transition-colors hover:bg-muted-bg"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-bg text-xs font-bold text-muted">
                  {ticket.posicao ?? idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {ticket.senha ?? '--'} - {ticket.paciente_nome || 'Paciente sem nome'}
                  </p>
                  <p className="text-xs text-muted">
                    {ticket.origem ?? 'Sem guichê/profissional'} - Entrou às{' '}
                    {formatarHorario(ticket.entrada_fila)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {ticket.prioridade === 'preferencial' ? (
                  <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    Preferencial
                  </span>
                ) : null}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    ticket.status === 'em_atendimento'
                      ? 'border border-success/30 bg-success/10 text-success'
                      : ticket.status === 'chamado'
                        ? 'border border-warning/30 bg-warning/10 text-warning'
                        : 'border border-border bg-muted-bg text-muted'
                  }`}
                >
                  {ticket.status === 'aguardando' ? (
                    <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  ) : null}
                  {ROTULOS_STATUS[ticket.status] ?? ticket.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-xs text-muted">
            Fila vazia no momento.
          </p>
        )}
      </div>
    </div>
  );
}

export interface QueueMonitorPanelProps {
  ticketsIniciais: TicketFilaUnificada[];
  unidadeId?: string;
}

export function QueueMonitorPanel({ ticketsIniciais, unidadeId }: QueueMonitorPanelProps) {
  const [tickets, setTickets] = useState<TicketFilaUnificada[]>(ticketsIniciais);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function atualizar() {
      const dados = await listarFilaUnificada(unidadeId);
      setTickets(dados);
    }

    intervaloRef.current = setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [unidadeId]);

  const filaAtendimento = tickets.filter((ticket) => ticket.tipo_fila === 'atendimento');
  const filaConsulta = tickets.filter((ticket) => ticket.tipo_fila === 'consulta');
  const totalAguardando = tickets.filter((ticket) => ticket.status === 'aguardando').length;

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-title text-2xl font-bold text-foreground sm:text-3xl">
            Filas
          </h1>
          <p className="mt-1 text-sm text-muted">
            Fila da recepção e fila de consulta em tempo real.
          </p>
        </div>

        <span className="flex items-center gap-2 self-start rounded-full border border-border bg-white px-4 py-2 text-sm text-muted sm:self-auto">
          <Users className="size-4 text-primary" aria-hidden />
          {totalAguardando} aguardando no total
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ColunaFila titulo="Fila 1 - Recepção" Icone={ListOrdered} tickets={filaAtendimento} />
        <ColunaFila titulo="Fila 2 - Consulta" Icone={Stethoscope} tickets={filaConsulta} />
      </div>
    </div>
  );
}
