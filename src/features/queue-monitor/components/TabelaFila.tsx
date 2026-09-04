'use client';

import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Paginacao } from '@/components/ui/Paginacao';
import { ROTULO_STATUS, TOM_STATUS } from '@/constants/fila';
import type { PaginaFila } from '@/features/queue-monitor/types';
import { formatarHora, formatarNumero } from '@/lib/utils';

export interface TabelaFilaProps {
  titulo: string;
  Icone: LucideIcon;
  dados: PaginaFila;
  pagina: number;
  porPagina: number;
  aoMudarPagina: (pagina: number) => void;
}

export function TabelaFila({
  titulo,
  Icone,
  dados,
  pagina,
  porPagina,
  aoMudarPagina,
}: TabelaFilaProps) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-title text-base font-bold text-foreground">
          <Icone className="size-4 text-primary" aria-hidden />
          {titulo}
        </h2>

        <Badge tom="primario">{formatarNumero(dados.total)} na fila</Badge>
      </div>

      {dados.tickets.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-border py-10 text-center text-sm text-muted">
          Fila vazia no momento.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left text-sm whitespace-nowrap">
              <thead className="text-xs font-medium tracking-wide text-muted uppercase">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3">Senha</th>
                  <th className="w-full py-2 pr-3">Paciente</th>
                  <th className="py-2 pr-3">Entrada</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {dados.tickets.map((ticket) => (
                  <tr key={ticket.ticket_id}>
                    <td className="py-3 pr-3 font-mono font-semibold text-primary">
                      {ticket.senha ?? '—'}
                    </td>
                    <td className="w-full py-3 pr-3">
                      <p className="font-medium text-foreground">
                        {ticket.paciente_nome ?? 'Paciente sem nome'}
                      </p>
                      {ticket.prioridade === 'preferencial' ? (
                        <Badge tom="alerta" className="mt-1">
                          Preferencial
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-muted tabular-nums">
                      {formatarHora(ticket.entrada_fila)}
                    </td>
                    <td className="py-3">
                      <Badge tom={TOM_STATUS[ticket.status]}>
                        {ROTULO_STATUS[ticket.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            pagina={pagina}
            porPagina={porPagina}
            total={dados.total}
            aoMudar={aoMudarPagina}
          />
        </>
      )}
    </section>
  );
}
