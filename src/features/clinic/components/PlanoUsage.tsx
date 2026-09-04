'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PLANOS, resumirLimites, type PlanoId } from '@/constants/planos';
import { trocarPlano } from '@/features/clinic/services/clinica-client';
import type { UsoPlanoDetalhado } from '@/features/clinic/types';

function BarraUso({ usado, max, rotulo }: { usado: number; max: number; rotulo: string }) {
  const percentual = max > 0 ? Math.min((usado / max) * 100, 100) : 0;
  const critico = percentual >= 90;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{rotulo}</span>
        <span>
          {usado} / {max >= 999 ? 'ilimitado' : max}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted-bg">
        <div
          className={`h-full rounded-full transition-all ${critico ? 'bg-danger' : 'bg-primary'}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}

export interface PlanoUsageProps {
  clinicaId: string;
  uso: UsoPlanoDetalhado;
}

export function PlanoUsage({ clinicaId, uso }: PlanoUsageProps) {
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoId | null>(null);
  const [trocando, setTrocando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleTrocarPlano(plano: PlanoId) {
    setTrocando(true);
    setErro(null);

    const resposta = await trocarPlano(clinicaId, plano);

    setTrocando(false);

    if (!resposta.sucesso) {
      setErro(resposta.erro ?? 'Não foi possível trocar de plano.');
      return;
    }

    setPlanoSelecionado(null);
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
        <h2 className="font-title font-bold text-foreground">Uso do plano atual</h2>
        <p className="mt-1 text-xs text-muted">
          {resumirLimites(PLANOS.find((plano) => plano.id === uso.plano) ?? PLANOS[0])}
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <BarraUso usado={uso.unidadesUsadas} max={uso.maxUnidades} rotulo="Unidades" />
          <BarraUso usado={uso.guichesUsados} max={uso.maxGuiches} rotulo="Guichês" />
          <BarraUso
            usado={uso.profissionaisUsados}
            max={uso.maxProfissionais}
            rotulo="Profissionais"
          />
          <BarraUso
            usado={uso.ticketsNoMes}
            max={uso.maxTicketsMes}
            rotulo="Atendimentos neste mês"
          />
        </div>
      </div>

      {erro ? <Alert tom="erro">{erro}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANOS.map((plano) => {
          const ehAtual = plano.id === uso.plano;

          return (
            <div
              key={plano.id}
              className={`flex flex-col gap-3 rounded-[12px] border bg-white p-5 shadow-sm ${
                ehAtual ? 'border-primary ring-1 ring-primary' : 'border-border'
              }`}
            >
              <div>
                <h3 className="font-title font-bold text-foreground">{plano.nome}</h3>
                <p className="mt-1 text-xs text-muted">{plano.chamada}</p>
              </div>

              <p className="text-2xl font-bold text-primary">
                {plano.precoMensal === 0 ? 'Gratis' : `R$ ${plano.precoMensal.toFixed(2)}`}
                {plano.precoMensal > 0 ? (
                  <span className="text-sm font-normal text-muted">/mes</span>
                ) : null}
              </p>

              <ul className="flex flex-col gap-1.5 text-xs text-muted">
                {plano.recursos.map((recurso) => (
                  <li key={recurso} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                    {recurso}
                  </li>
                ))}
              </ul>

              {ehAtual ? (
                <span className="mt-auto rounded-[8px] bg-primary/10 px-3 py-2 text-center text-xs font-semibold text-primary">
                  Plano atual
                </span>
              ) : planoSelecionado === plano.id ? (
                <div className="mt-auto flex flex-col gap-2">
                  <p className="text-xs text-muted">Confirmar troca para {plano.nome}?</p>
                  <div className="flex gap-2">
                    <Button
                      tamanho="sm"
                      onClick={() => handleTrocarPlano(plano.id)}
                      disabled={trocando}
                      className="flex-1"
                    >
                      {trocando ? 'Trocando...' : 'Confirmar'}
                    </Button>
                    <Button
                      tamanho="sm"
                      variante="secondary"
                      onClick={() => setPlanoSelecionado(null)}
                      disabled={trocando}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  tamanho="sm"
                  variante="secondary"
                  className="mt-auto"
                  onClick={() => setPlanoSelecionado(plano.id)}
                >
                  Selecionar plano
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

