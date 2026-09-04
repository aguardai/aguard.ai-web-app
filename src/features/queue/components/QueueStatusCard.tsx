'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, Hash, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { buscarTicket, cancelarTicket } from '@/features/queue/services/fila';
import { useQueueStore } from '@/features/queue/store';
import type { TicketFila } from '@/features/queue/types';

const INTERVALO_ATUALIZACAO_MS = 6000;

const ROTULOS_STATUS: Record<string, string> = {
  aguardando: 'Aguardando',
  chamado: 'Chamado - dirija-se ao guichê',
  em_atendimento: 'Em atendimento',
  ausente: 'Ausência registrada',
  finalizado: 'Atendimento finalizado',
  cancelado: 'Cancelado',
};

export interface QueueStatusCardProps {
  ticketId: string;
  ticketInicial: TicketFila | null;
}

export function QueueStatusCard({ ticketId, ticketInicial }: QueueStatusCardProps) {
  const router = useRouter();
  const limparTicketAtivo = useQueueStore((estado) => estado.limparTicketAtivo);

  const [ticket, setTicket] = useState<TicketFila | null>(ticketInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function atualizar() {
      const resposta = await buscarTicket(ticketId);

      if (!resposta.sucesso || !resposta.ticket) {
        setErro(resposta.erro ?? 'Não foi possível atualizar sua posição.');
        return;
      }

      setErro(null);
      setTicket(resposta.ticket);
    }

    if (!ticketInicial) {
      atualizar();
    }

    intervaloRef.current = setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [ticketId, ticketInicial]);

  async function handleCancelar() {
    setCancelando(true);
    const resposta = await cancelarTicket(ticketId);
    setCancelando(false);

    if (!resposta.sucesso) {
      setErro(resposta.erro ?? 'Não foi possível cancelar.');
      setConfirmandoCancelamento(false);
      return;
    }

    if (intervaloRef.current) clearInterval(intervaloRef.current);
    limparTicketAtivo();
    router.push('/');
  }

  if (erro && !ticket) {
    return <Alert tom="erro">{erro}</Alert>;
  }

  if (!ticket) {
    return (
      <div className="animate-pulse rounded-[12px] border border-border bg-white p-8 text-center text-muted">
        Carregando sua posição na fila...
      </div>
    );
  }

  const podeCancelar = ticket.status === 'aguardando' || ticket.status === 'chamado';
  const encerrado = ['finalizado', 'cancelado'].includes(ticket.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {ticket.unidade ?? ticket.local}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              ticket.status === 'chamado'
                ? 'border border-warning/30 bg-warning/10 text-warning'
                : encerrado
                  ? 'border border-border bg-muted-bg text-muted'
                  : 'border border-primary/20 bg-primary/5 text-primary'
            }`}
          >
            {ticket.status === 'aguardando' ? (
              <span className="size-2 animate-pulse rounded-full bg-primary" />
            ) : null}
            {ROTULOS_STATUS[ticket.status] ?? ticket.status}
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <span className="text-xs text-muted">Sua senha</span>
          <span className="text-5xl font-extrabold tracking-tight text-primary">
            {ticket.senha ?? '--'}
          </span>
        </div>

        {!encerrado ? (
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-[8px] bg-muted-bg p-4 text-center">
              <Hash className="mx-auto size-4 text-primary" aria-hidden />
              <p className="mt-2 text-2xl font-bold text-foreground">
                {ticket.posicao ?? '-'}
              </p>
              <p className="text-xs text-muted">Posição na fila</p>
            </div>
            <div className="rounded-[8px] bg-muted-bg p-4 text-center">
              <Clock className="mx-auto size-4 text-primary" aria-hidden />
              <p className="mt-2 text-2xl font-bold text-foreground">
                {ticket.estimativa_minutos ?? '-'}
              </p>
              <p className="text-xs text-muted">Minutos estimados</p>
            </div>
          </div>
        ) : null}

        {!encerrado ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
            <Users className="size-4" aria-hidden />
            {ticket.aguardando_na_frente === 0
              ? 'Você é o próximo!'
              : `${ticket.aguardando_na_frente} pessoa(s) na sua frente`}
          </p>
        ) : null}

        {erro ? (
          <Alert tom="erro" className="mt-4">
            {erro}
          </Alert>
        ) : null}
      </div>

      {podeCancelar ? (
        confirmandoCancelamento ? (
          <div className="flex flex-col gap-3 rounded-[12px] border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm text-foreground">
              Tem certeza que deseja sair da fila? Você perderá sua posição atual.
            </p>
            <div className="flex gap-3">
              <Button
                variante="danger"
                onClick={handleCancelar}
                disabled={cancelando}
                className="flex-1"
              >
                {cancelando ? 'Cancelando...' : 'Sim, cancelar'}
              </Button>
              <Button
                variante="secondary"
                onClick={() => setConfirmandoCancelamento(false)}
                disabled={cancelando}
                className="flex-1"
              >
                Voltar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variante="ghost"
            onClick={() => setConfirmandoCancelamento(true)}
            className="gap-2 self-center text-danger hover:bg-danger/10"
          >
            <XCircle className="size-4" aria-hidden />
            Cancelar minha vaga na fila
          </Button>
        )
      ) : null}
    </div>
  );
}
