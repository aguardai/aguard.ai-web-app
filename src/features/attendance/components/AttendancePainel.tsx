'use client';

import { useState } from 'react';
import { UserCheck, Clock, Play, CheckCircle2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import type { TicketAtendimento } from '../types';

export interface AttendancePanelProps {
  pacienteAtualInicial: TicketAtendimento | null;
  filaInicial: TicketAtendimento[];
  onChamarProximo: () => Promise<void>;
  onFinalizarAtendimento: () => Promise<void>;
}

// Função auxiliar para formatar horas garantindo o fuso horário oficial (America/Sao_Paulo)
function formatarHorario(dataIso?: string | null): string {
  if (!dataIso) return '--:--';
  return new Date(dataIso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

// Formata o status vindo do enum do banco (ex: "em_atendimento" -> "Em atendimento")
function formatarStatus(status: string): string {
  const statusFormatado = status.replace('_', ' ');
  return statusFormatado.charAt(0).toUpperCase() + statusFormatado.slice(1);
}

export function AttendancePanel({
  pacienteAtualInicial,
  filaInicial,
  onChamarProximo,
  onFinalizarAtendimento,
}: AttendancePanelProps) {
  const [pendente, setPendente] = useState(false);

  async function handleChamar() {
    try {
      setPendente(true);
      await onChamarProximo();
    } finally {
      setPendente(false);
    }
  }

  async function handleFinalizar() {
    try {
      setPendente(true);
      await onFinalizarAtendimento();
    } finally {
      setPendente(false);
    }
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-title text-2xl font-bold text-foreground sm:text-3xl">
            Painel de Atendimento
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie e chame os pacientes da sua fila em tempo real.
          </p>
        </div>

        <Button
          type="button"
          tamanho="lg"
          onClick={handleChamar}
          disabled={pendente || filaInicial.length === 0}
          className="gap-2 bg-primary text-white hover:bg-primary/90"
        >
          <Play className="size-5 fill-current" aria-hidden />
          {pendente ? 'Processando...' : 'Chamar Próximo Paciente'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
                <UserCheck className="size-4 text-primary" />
                Atendimento Atual
              </span>
              {pacienteAtualInicial ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  {formatarStatus(pacienteAtualInicial.status || 'em_atendimento')}
                </span>
              ) : null}
            </div>

            {pacienteAtualInicial ? (
              <div className="mt-6 flex flex-col gap-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-3xl font-extrabold text-primary tracking-tight">
                      {pacienteAtualInicial.senha}
                    </span>
                    <h2 className="font-title mt-1 text-xl font-bold text-foreground">
                      {pacienteAtualInicial.paciente_nome || 'Paciente sem nome'}
                    </h2>
                  </div>

                  <Button
                    type="button"
                    variante="secondary"
                    onClick={handleFinalizar}
                    disabled={pendente}
                    className="self-start border-emerald-600 text-emerald-700 hover:bg-emerald-50 sm:self-auto"
                  >
                    <CheckCircle2 className="size-4" />
                    Finalizar Atendimento
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-[8px] bg-muted-bg p-4 text-sm">
                  <div>
                    <p className="text-muted">Início do atendimento</p>
                    <p className="mt-0.5 flex items-center gap-1 font-semibold text-foreground">
                      <Clock className="size-3.5 text-muted" />
                      {formatarHorario(
                        pacienteAtualInicial.started_at || pacienteAtualInicial.created_at
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Etapa</p>
                    <p className="mt-0.5 font-semibold text-foreground">
                      {pacienteAtualInicial.tipo_servico || 'Primeira vez'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted">Nenhum paciente em atendimento no momento.</p>
                <p className="mt-1 text-xs text-muted">
                  Clique no botão &quot;Chamar Próximo Paciente&quot; para iniciar.
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-title font-bold text-foreground">Fila de Espera</h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {filaInicial.length} aguardando
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {filaInicial.length > 0 ? (
                filaInicial.map((paciente, idx) => (
                  <div
                    key={paciente.id}
                    className="flex items-center justify-between rounded-[8px] border border-border bg-white p-3 transition-colors hover:bg-muted-bg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted-bg text-xs font-bold text-muted">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {paciente.senha} — {paciente.paciente_nome || 'Paciente sem nome'}
                        </p>
                        <p className="text-xs text-muted">
                          Chegou às {formatarHorario(paciente.created_at)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted" />
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