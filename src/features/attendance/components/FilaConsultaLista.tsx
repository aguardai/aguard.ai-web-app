'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Play, UserCheck, X } from 'lucide-react';


import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { atualizarStatusAction, cancelarTicketAction, chamarProximoAction } from '@/features/attendance/actions';
import type { TicketFila } from '@/features/attendance/types';
import { cn } from '@/lib/utils';

export interface FilaConsultaListaProps {
  fila: TicketFila[];
  profissionalId: string;
}

// Garante o fuso oficial (America/Sao_Paulo), igual ao padrão já usado no time
function formatarHorario(dataIso?: string | null): string {
  if (!dataIso) return '--:--';
  return new Date(dataIso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function formatarStatus(status: string): string {
  const formatado = status.replace('_', ' ');
  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}

export function FilaConsultaLista({ fila, profissionalId }: FilaConsultaListaProps) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  // Broadcast anonimizado no canal consulta:profissional:{id} (README de RLS/Realtime):
  // qualquer evento só serve de gatilho pra buscar os dados de novo no servidor
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`consulta:profissional:${profissionalId}`)
      .on('broadcast', { event: '*' }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [profissionalId, router]);

  const ticketAtual =
    fila.find((ticket) => ticket.status === 'em_atendimento') ??
    fila.find((ticket) => ticket.status === 'chamado') ??
    null;

  const filaDeEspera = fila.filter(
    (ticket) => ticket.status === 'aguardando' || ticket.status === 'ausente'
  );

  function chamarProximo() {
    iniciarTransicao(async () => {
      const resultado = await chamarProximoAction();
      // TODO: trocar por toast do design system, se houver um
      if (!resultado.sucesso && resultado.erro) window.alert(resultado.erro);
    });
  }

  function mudarStatus(ticketId: string, status: 'em_atendimento' | 'finalizado' | 'ausente' | 'aguardando') {
    iniciarTransicao(async () => {
      await atualizarStatusAction(ticketId, status);
      router.refresh();
    });
  }

  function cancelar(ticketId: string, senha: string) {
    if (!window.confirm(`Cancelar o ticket ${senha}?`)) return;
    iniciarTransicao(async () => {
      await cancelarTicketAction(ticketId);
    });
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-title text-2xl font-bold text-foreground sm:text-3xl">
            Minha Fila
          </h1>
          <p className="mt-1 text-sm text-muted">
            Pacientes encaminhados da recepção para você.
          </p>
        </div>

        <Button
          type="button"
          tamanho="lg"
          onClick={chamarProximo}
          disabled={pendente || !!ticketAtual || filaDeEspera.filter((t) => t.status === 'aguardando').length === 0}
        >
          <Play className="size-5 fill-current" aria-hidden />
          {pendente ? 'Processando...' : 'Chamar próximo paciente'}
        </Button>
      </div>

      {ticketAtual && ticketAtual.status === 'chamado' ? (
        <Alert tom="info">
          Inicie ou marque como ausente o paciente chamado antes de chamar outro.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Atendimento atual */}
        <div className="lg:col-span-2">
          <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
                <UserCheck className="size-4 text-primary" />
                Atendimento atual
              </span>
              {ticketAtual ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                  {formatarStatus(ticketAtual.status)}
                </span>
              ) : null}
            </div>

            {ticketAtual ? (
              <div className="mt-6 flex flex-col gap-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-3xl font-extrabold tracking-tight text-primary">
                      {ticketAtual.senha}
                    </span>
                    <h2 className="font-title mt-1 text-xl font-bold text-foreground">
                      {ticketAtual.paciente}
                    </h2>
                  </div>

                  {ticketAtual.status === 'chamado' ? (
                    <div className="flex gap-2 self-start sm:self-auto">
                      <Button
                        type="button"
                        disabled={pendente}
                        onClick={() => mudarStatus(ticketAtual.ticket_id, 'em_atendimento')}
                      >
                        <Play className="size-4" aria-hidden />
                        Iniciar atendimento
                      </Button>
                      <Button
                        type="button"
                        variante="secondary"
                        disabled={pendente}
                        onClick={() => mudarStatus(ticketAtual.ticket_id, 'ausente')}
                      >
                        Ausente
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variante="secondary"
                      disabled={pendente}
                      onClick={() => mudarStatus(ticketAtual.ticket_id, 'finalizado')}
                      className="self-start border-emerald-600 text-emerald-700 hover:bg-emerald-50 sm:self-auto"
                    >
                      <CheckCircle2 className="size-4" aria-hidden />
                      Finalizar atendimento
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-[8px] bg-muted-bg p-4 text-sm">
                  <div>
                    <p className="text-muted">Chegou às</p>
                    <p className="mt-0.5 flex items-center gap-1 font-semibold text-foreground">
                      <Clock className="size-3.5 text-muted" aria-hidden />
                      {formatarHorario(ticketAtual.entrada_fila)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Tipo de consulta</p>
                    <p className="mt-0.5 font-semibold text-foreground">
                      {ticketAtual.tipo_consulta ?? 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted">Nenhum paciente em atendimento no momento.</p>
                <p className="mt-1 text-xs text-muted">
                  Clique em &quot;Chamar próximo paciente&quot; para iniciar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fila de espera */}
        <div>
          <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-title font-bold text-foreground">Fila de espera</h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {filaDeEspera.length} aguardando
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {filaDeEspera.length > 0 ? (
                filaDeEspera.map((ticket, idx) => (
                  <div
                    key={ticket.ticket_id}
                    className="flex items-center justify-between gap-2 rounded-[8px] border border-border bg-white p-3 transition-colors hover:bg-muted-bg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-bg text-xs font-bold text-muted">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {ticket.senha} — {ticket.paciente}
                        </p>
                        <p className="text-xs text-muted">
                          {ticket.status === 'ausente' ? (
                            <span className="text-amber-700">Ausente</span>
                          ) : (
                            `Chegou às ${formatarHorario(ticket.entrada_fila)}`
                          )}
                        </p>
                      </div>
                    </div>

                    {ticket.status === 'ausente' ? (
                      <button
                        type="button"
                        disabled={pendente}
                        onClick={() => mudarStatus(ticket.ticket_id, 'aguardando')}
                        className="shrink-0 cursor-pointer text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Rechamar
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pendente}
                        onClick={() => cancelar(ticket.ticket_id, ticket.senha ?? '')}
                        className="shrink-0 cursor-pointer text-muted transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Cancelar ${ticket.senha}`}
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-muted">
                  Fila vazia! Não há pacientes aguardando.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}