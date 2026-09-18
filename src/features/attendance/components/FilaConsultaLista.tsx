'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Play, UserCheck, X } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
import {
  atualizarStatusAction,
  cancelarTicketAction,
  chamarProximoAction,
} from '@/features/attendance/actions';
import type { TicketFila } from '@/features/attendance/types';
import { createClient } from '@/lib/supabase/client';
import { formatarHora } from '@/lib/utils';

export interface FilaConsultaListaProps {
  fila: TicketFila[];
  profissionalId: string;
}

function formatarStatus(status: string): string {
  const formatado = status.replace('_', ' ');

  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}

export function FilaConsultaLista({ fila, profissionalId }: FilaConsultaListaProps) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [alvoCancelamento, setAlvoCancelamento] = useState<TicketFila | null>(null);

  // Broadcast anonimizado no canal consulta:profissional:{id} (README de RLS/Realtime):
  // qualquer evento só serve de gatilho pra buscar os dados de novo no servidor
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel('consulta:profissional:' + profissionalId)
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

  const aguardando = filaDeEspera.filter((ticket) => ticket.status === 'aguardando');

  function chamarProximo() {
    iniciarTransicao(async () => {
      const resultado = await chamarProximoAction();
      setErro(resultado.sucesso ? null : (resultado.erro ?? null));
    });
  }

  function mudarStatus(
    ticketId: string,
    status: 'em_atendimento' | 'finalizado' | 'ausente' | 'aguardando'
  ) {
    iniciarTransicao(async () => {
      const resultado = await atualizarStatusAction(ticketId, status);
      setErro(resultado.sucesso ? null : (resultado.erro ?? null));
      router.refresh();
    });
  }

  function confirmarCancelamento() {
    if (!alvoCancelamento) return;

    iniciarTransicao(async () => {
      const resultado = await cancelarTicketAction(alvoCancelamento.ticket_id);
      setErro(resultado.sucesso ? null : (resultado.erro ?? null));
      setAlvoCancelamento(null);
    });
  }

  const descricaoCancelamento = alvoCancelamento
    ? 'A senha ' +
      alvoCancelamento.senha +
      ' de ' +
      alvoCancelamento.paciente +
      ' sai da fila como cancelada e não pode ser chamada de novo.'
    : '';

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <p role="status" className="sr-only">
        {ticketAtual
          ? 'Senha ' + ticketAtual.senha + ', ' + ticketAtual.paciente + ', ' + formatarStatus(ticketAtual.status).toLowerCase()
          : 'Nenhum paciente em atendimento.'}
      </p>

      <CabecalhoPagina
        titulo="Minha fila"
        descricao="Pacientes encaminhados da recepção para você."
        acoes={
          <Button
            type="button"
            onClick={chamarProximo}
            disabled={pendente || Boolean(ticketAtual) || aguardando.length === 0}
            className="w-full sm:w-auto"
          >
            <Play className="size-4" aria-hidden />
            {pendente ? 'Processando...' : 'Chamar próximo paciente'}
          </Button>
        }
      />

      {erro ? <Alert tom="erro">{erro}</Alert> : null}

      {ticketAtual?.status === 'chamado' ? (
        <Alert tom="info">
          Inicie ou marque como ausente o paciente chamado antes de chamar outro.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="min-w-0 lg:col-span-2">
          <div className="flex h-full flex-col gap-6 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <h2 className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
                <UserCheck className="size-4 text-primary" aria-hidden />
                Atendimento atual
              </h2>

              {ticketAtual ? (
                <Badge tom="sucesso">{formatarStatus(ticketAtual.status)}</Badge>
              ) : null}
            </div>

            {ticketAtual ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <span className="font-title text-3xl font-bold text-primary">
                      {ticketAtual.senha}
                    </span>
                    <h3 className="font-title text-xl font-bold text-foreground">
                      {ticketAtual.paciente}
                    </h3>
                  </div>

                  {ticketAtual.status === 'chamado' ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        disabled={pendente}
                        onClick={() => mudarStatus(ticketAtual.ticket_id, 'em_atendimento')}
                        className="w-full sm:w-auto"
                      >
                        <Play className="size-4" aria-hidden />
                        Iniciar atendimento
                      </Button>

                      <Button
                        type="button"
                        variante="secondary"
                        disabled={pendente}
                        onClick={() => mudarStatus(ticketAtual.ticket_id, 'ausente')}
                        className="w-full sm:w-auto"
                      >
                        Ausente
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      disabled={pendente}
                      onClick={() => mudarStatus(ticketAtual.ticket_id, 'finalizado')}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle2 className="size-4" aria-hidden />
                      Finalizar atendimento
                    </Button>
                  )}
                </div>

                <dl className="grid grid-cols-1 gap-4 rounded-[8px] bg-muted-bg p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Chegou às</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-foreground">
                      <Clock className="size-3.5 text-muted" aria-hidden />
                      {formatarHora(ticketAtual.entrada_fila)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-muted">Tipo de consulta</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {ticketAtual.tipo_consulta ?? 'Não informado'}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="py-10 text-center text-muted">
                Nenhum paciente em atendimento no momento.
              </p>
            )}
          </div>
        </section>

        <section className="min-w-0">
          <div className="flex h-full flex-col gap-4 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <h2 className="font-title text-base font-bold text-foreground">Fila de espera</h2>
              <Badge tom="primario">{filaDeEspera.length} aguardando</Badge>
            </div>

            {filaDeEspera.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {filaDeEspera.map((ticket, indice) => (
                  <li
                    key={ticket.ticket_id}
                    className="flex items-center justify-between gap-3 rounded-[8px] border border-border p-3 transition-colors hover:bg-muted-bg/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-bg text-xs font-medium text-muted">
                        {indice + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {ticket.senha} — {ticket.paciente}
                        </p>
                        <p className="text-xs text-muted">
                          {ticket.status === 'ausente'
                            ? 'Ausente'
                            : 'Chegou às ' + formatarHora(ticket.entrada_fila)}
                        </p>
                      </div>
                    </div>

                    {ticket.status === 'ausente' ? (
                      <Button
                        type="button"
                        variante="ghost"
                        tamanho="sm"
                        disabled={pendente}
                        onClick={() => mudarStatus(ticket.ticket_id, 'aguardando')}
                        className="shrink-0"
                      >
                        Rechamar
                      </Button>
                    ) : (
                      <AcaoIcone
                        rotulo={'Remover ' + ticket.senha + ' da fila'}
                        tom="perigo"
                        disabled={pendente}
                        onClick={() => setAlvoCancelamento(ticket)}
                        className="shrink-0"
                      >
                        <X className="size-4" aria-hidden />
                      </AcaoIcone>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted">
                Nenhum paciente aguardando.
              </p>
            )}
          </div>
        </section>
      </div>

      <ModalConfirmacao
        aberto={alvoCancelamento !== null}
        titulo="Remover da fila"
        descricao={descricaoCancelamento}
        rotuloConfirmar="Remover da fila"
        variante="danger"
        pendente={pendente}
        aoConfirmar={confirmarCancelamento}
        aoCancelar={() => setAlvoCancelamento(null)}
      />
    </div>
  );
}
