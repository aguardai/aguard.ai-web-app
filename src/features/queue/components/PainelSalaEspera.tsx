'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Volume2, VolumeX } from 'lucide-react';

import { BolhasFundo } from '@/components/ui/BolhasFundo';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ROTULO_TIPO_FILA, type StatusFila } from '@/constants/fila';
import { useSomDeChamada } from '@/features/queue/hooks/useSomDeChamada';
import type { TicketPainel } from '@/features/queue/types';
import { createClient } from '@/lib/supabase/client';
import { formatarHora } from '@/lib/utils';

const ULTIMAS_VISIVEIS = 5;

const ROTULO_DESTAQUE: Partial<Record<StatusFila, string>> = {
  chamado: 'Chamando agora',
  em_atendimento: 'Em atendimento',
};

export interface PainelSalaEsperaProps {
  unidadeId: string;
  enderecoDaFila: string;
  fila: TicketPainel[];
}

export function PainelSalaEspera({
  unidadeId,
  enderecoDaFila,
  fila,
}: PainelSalaEsperaProps) {
  const router = useRouter();

  // Canal público da unidade: o trigger de broadcast publica nele as transições
  // das duas filas, então a chamada do profissional também atualiza o painel
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel('fila:unidade:' + unidadeId)
      .on('broadcast', { event: '*' }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [unidadeId, router]);

  // A RPC devolve as chamadas primeiro, da mais recente para a mais antiga,
  // inclusive as já finalizadas: o painel mostra a ordem de chamada do dia
  const chamados = fila.filter((ticket) => ticket.chamado_em !== null);
  const destaque = chamados[0] ?? null;

  const { somAtivo, alternarSom } = useSomDeChamada(destaque?.ticket_id ?? null);
  const ultimas = chamados.slice(1, ULTIMAS_VISIVEIS + 1);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-primary to-primary-light">
      <BolhasFundo />

      <div className="content-container relative flex min-h-dvh items-center justify-center py-10">
        <div className="grid w-full gap-10 overflow-hidden rounded-[12px] bg-background p-6 shadow-2xl sm:p-10 lg:grid-cols-[1.6fr_1fr]">
          <section className="flex min-w-0 flex-col justify-between gap-8">
            <div className="flex items-center justify-between gap-4">
              <Logo tamanho={40} prioridade />

              <Button
                type="button"
                variante="secondary"
                tamanho="sm"
                onClick={alternarSom}
                aria-pressed={somAtivo}
              >
                {somAtivo ? (
                  <Volume2 className="size-4" aria-hidden />
                ) : (
                  <VolumeX className="size-4" aria-hidden />
                )}
                {somAtivo ? 'Som ligado' : 'Ativar som'}
              </Button>
            </div>

            <p role="status" className="sr-only">
              {destaque
                ? 'Senha ' + destaque.senha + ', ' + destaque.paciente + (destaque.origem ? ', ' + destaque.origem : '')
                : 'Nenhuma senha chamada.'}
            </p>

            <div aria-hidden className="flex flex-col items-center gap-2 text-center">
              {destaque ? (
                <>
                  <p className="text-sm tracking-wide text-muted uppercase">
                    {ROTULO_DESTAQUE[destaque.status] ?? 'Última senha chamada'}
                  </p>

                  <p className="font-title text-7xl leading-none font-bold text-primary sm:text-8xl">
                    {destaque.senha}
                  </p>

                  <p className="font-title text-2xl font-bold text-foreground">
                    {destaque.paciente}
                  </p>

                  <p className="text-lg text-muted">{destaque.origem ?? 'Aguarde a chamada'}</p>

                  <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {ROTULO_TIPO_FILA[destaque.tipo_fila]}
                  </span>
                </>
              ) : (
                <>
                  <p className="font-title text-4xl font-bold text-foreground">
                    Nenhuma senha chamada
                  </p>
                  <p className="text-muted">
                    Assim que um guichê ou consultório chamar, a senha aparece aqui.
                  </p>
                </>
              )}
            </div>

            <p className="text-center text-sm text-muted">
              As senhas são atualizadas automaticamente.
            </p>
          </section>

          <aside className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-3 rounded-[12px] bg-muted-bg p-5">
              <h2 className="font-title text-base font-bold text-foreground">
                Últimas senhas
              </h2>

              {ultimas.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {ultimas.map((ticket) => (
                    <li
                      key={ticket.ticket_id}
                      className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-title text-lg font-bold text-foreground">
                          {ticket.senha}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {ROTULO_TIPO_FILA[ticket.tipo_fila]} · {ticket.origem ?? '—'}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm text-muted">
                        {formatarHora(ticket.chamado_em)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Nenhuma senha chamada ainda.</p>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 rounded-[12px] border border-border p-5 text-center">
              <p className="font-title text-base font-bold text-foreground">
                Entre na fila pelo celular
              </p>

              <QRCodeSVG
                value={enderecoDaFila}
                size={160}
                level="M"
                marginSize={1}
                title="QR Code para entrar na fila pelo celular"
              />

              <p className="text-sm text-muted">
                Aponte a câmera e acompanhe sua posição.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
