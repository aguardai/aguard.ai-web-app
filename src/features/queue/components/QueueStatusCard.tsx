'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Hash, Users, XCircle } from 'lucide-react';

import { Alert } from '@/components/ui/Alert';
import { Badge, type BadgeTom } from '@/components/ui/Badge';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
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

const TOM_STATUS: Record<string, BadgeTom> = {
  aguardando: 'primario',
  chamado: 'alerta',
  em_atendimento: 'primario',
  ausente: 'alerta',
  finalizado: 'sucesso',
  cancelado: 'neutro',
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
      <p className="animate-pulse py-10 text-center text-muted">
        Carregando sua posição na fila...
      </p>
    );
  }

  const podeCancelar = ticket.status === 'aguardando' || ticket.status === 'chamado';
  const encerrado = ['finalizado', 'cancelado'].includes(ticket.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <span className="min-w-0 truncate text-xs font-medium tracking-wide text-muted uppercase">
          {ticket.unidade ?? ticket.local}
        </span>

        <Badge tom={TOM_STATUS[ticket.status] ?? 'neutro'}>
          {ROTULOS_STATUS[ticket.status] ?? ticket.status}
        </Badge>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm text-muted">Sua senha</span>
        <span className="font-title text-5xl font-bold text-primary">
          {ticket.senha ?? '—'}
        </span>
      </div>

      {encerrado ? null : (
        <dl className="grid grid-cols-2 gap-4">
          <div className="rounded-[8px] bg-muted-bg p-4 text-center">
            <Hash className="mx-auto size-4 text-primary" aria-hidden />
            <dd className="mt-2 font-title text-2xl font-bold text-foreground">
              {ticket.posicao ?? '—'}
            </dd>
            <dt className="text-xs text-muted">Posição na fila</dt>
          </div>

          <div className="rounded-[8px] bg-muted-bg p-4 text-center">
            <Clock className="mx-auto size-4 text-primary" aria-hidden />
            <dd className="mt-2 font-title text-2xl font-bold text-foreground">
              {ticket.estimativa_minutos ?? '—'}
            </dd>
            <dt className="text-xs text-muted">Minutos estimados</dt>
          </div>
        </dl>
      )}

      {encerrado ? null : (
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
          <Users className="size-4" aria-hidden />
          {ticket.aguardando_na_frente === 0
            ? 'Você é o próximo!'
            : ticket.aguardando_na_frente + ' pessoa(s) na sua frente'}
        </p>
      )}

      {erro ? <Alert tom="erro">{erro}</Alert> : null}

      {podeCancelar ? (
        <button
          type="button"
          onClick={() => setConfirmandoCancelamento(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-1 self-center text-sm font-medium text-danger hover:underline"
        >
          <XCircle className="size-4" aria-hidden />
          Cancelar minha vaga na fila
        </button>
      ) : null}

      <ModalConfirmacao
        aberto={confirmandoCancelamento}
        titulo="Cancelar minha vaga"
        descricao="Você sai da fila e perde a posição atual. Para voltar, será preciso entrar de novo e pegar uma nova senha."
        rotuloConfirmar="Sim, cancelar"
        variante="danger"
        pendente={cancelando}
        aoConfirmar={handleCancelar}
        aoCancelar={() => setConfirmandoCancelamento(false)}
      />
    </div>
  );
}
