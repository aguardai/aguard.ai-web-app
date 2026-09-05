'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Play, UserCheck } from 'lucide-react';

import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  atualizarStatusRecepcaoAction,
  chamarProximoRecepcaoAction,
  finalizarRecepcaoAction,
} from '@/features/attendance/actions';
import type { GuicheDaRecepcao, TicketRecepcao } from '@/features/attendance/types';
import { createClient } from '@/lib/supabase/client';
import { formatarHora } from '@/lib/utils';

const ESPERA_VISIVEL = 2;

export interface PainelRecepcaoProps {
  unidadeId: string;
  fila: TicketRecepcao[];
  guiches: GuicheDaRecepcao[];
}

function formatarStatus(status: string): string {
  const formatado = status.replace('_', ' ');

  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}

export function PainelRecepcao({ unidadeId, fila, guiches }: PainelRecepcaoProps) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [guicheId, setGuicheId] = useState(guiches[0]?.id ?? '');

  // Canal publicado pelo trigger a cada transição da Fila 1: outro guichê
  // chamando um paciente reflete aqui sem recarregar a página
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel('atendimento:unidade:' + unidadeId)
      .on('broadcast', { event: '*' }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [unidadeId, router]);

  // Cada guichê atende o seu próprio paciente: sem o recorte, o painel mostra o
  // primeiro em atendimento da unidade e os botões agiriam sobre o ticket de
  // outro guichê. A RPC só devolve o nome do guichê, não o id
  const nomeDoGuiche = guiches.find((guiche) => guiche.id === guicheId)?.nome ?? null;

  const noGuiche = (ticket: TicketRecepcao) => ticket.guiche_nome === nomeDoGuiche;

  const ticketAtual =
    fila.find((ticket) => ticket.status === 'em_atendimento' && noGuiche(ticket)) ??
    fila.find((ticket) => ticket.status === 'chamado' && noGuiche(ticket)) ??
    null;

  const aguardando = fila.filter((ticket) => ticket.status === 'aguardando');
  const visiveis = aguardando.slice(0, ESPERA_VISIVEL);

  function executar(acao: () => Promise<{ sucesso: boolean; erro?: string }>) {
    iniciarTransicao(async () => {
      const resultado = await acao();
      setErro(resultado.sucesso ? null : (resultado.erro ?? null));
      router.refresh();
    });
  }

  const semGuiche = guiches.length === 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="min-w-0 font-title text-base font-bold text-foreground">
          Fila da recepção
        </h2>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {guiches.length > 1 ? (
            <div className="sm:w-56">
              <Select
                id="guiche-chamada"
                label="Guichê que vai chamar"
                rotuloOculto
                opcoes={guiches.map((guiche) => ({
                  valor: guiche.id,
                  rotulo: guiche.nome,
                }))}
                value={guicheId}
                onChange={(evento) => setGuicheId(evento.target.value)}
              />
            </div>
          ) : null}

          <Button
            type="button"
            onClick={() => executar(() => chamarProximoRecepcaoAction(guicheId))}
            disabled={pendente || semGuiche || Boolean(ticketAtual) || aguardando.length === 0}
            className="w-full shrink-0 sm:w-auto"
          >
            <Play className="size-4" aria-hidden />
            {pendente ? 'Processando...' : 'Chamar próximo paciente'}
          </Button>
        </div>
      </div>

      {semGuiche ? (
        <Alert tom="info">
          Cadastre um guichê ativo na unidade para chamar as senhas da recepção.
        </Alert>
      ) : null}

      {erro ? <Alert tom="erro">{erro}</Alert> : null}

      {ticketAtual?.status === 'chamado' ? (
        <Alert tom="info">
          Inicie ou marque como ausente o paciente chamado antes de chamar outro.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="flex h-full flex-col gap-6 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <h3 className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
                <UserCheck className="size-4 text-primary" aria-hidden />
                Atendimento atual
              </h3>

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
                    <p className="font-title text-xl font-bold text-foreground">
                      {ticketAtual.paciente}
                    </p>
                  </div>

                  {ticketAtual.status === 'chamado' ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        disabled={pendente}
                        onClick={() =>
                          executar(() =>
                            atualizarStatusRecepcaoAction(ticketAtual.ticket_id, 'em_atendimento')
                          )
                        }
                        className="w-full sm:w-auto"
                      >
                        <Play className="size-4" aria-hidden />
                        Iniciar atendimento
                      </Button>

                      <Button
                        type="button"
                        variante="secondary"
                        disabled={pendente}
                        onClick={() =>
                          executar(() =>
                            atualizarStatusRecepcaoAction(ticketAtual.ticket_id, 'ausente')
                          )
                        }
                        className="w-full sm:w-auto"
                      >
                        Ausente
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      disabled={pendente}
                      onClick={() => executar(() => finalizarRecepcaoAction(ticketAtual.ticket_id))}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle2 className="size-4" aria-hidden />
                      Finalizar e encaminhar
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
                    <dt className="text-muted">Guichê</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {ticketAtual.guiche_nome ?? 'Não informado'}
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
        </div>

        <div className="min-w-0">
          <div className="flex h-full flex-col gap-4 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <h3 className="font-title text-base font-bold text-foreground">Fila de espera</h3>
              <Badge tom="primario">{aguardando.length} aguardando</Badge>
            </div>

            {visiveis.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {visiveis.map((ticket, indice) => (
                  <li
                    key={ticket.ticket_id}
                    className="flex items-center gap-3 rounded-[8px] border border-border p-3"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-bg text-xs font-medium text-muted">
                      {indice + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {ticket.senha} — {ticket.paciente}
                      </p>
                      <p className="text-xs text-muted">
                        {ticket.prioridade === 'preferencial'
                          ? 'Preferencial'
                          : 'Chegou às ' + formatarHora(ticket.entrada_fila)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted">
                Nenhum paciente aguardando.
              </p>
            )}

            {aguardando.length > visiveis.length ? (
              <p className="text-center text-xs text-muted">
                + {aguardando.length - visiveis.length} na fila
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
