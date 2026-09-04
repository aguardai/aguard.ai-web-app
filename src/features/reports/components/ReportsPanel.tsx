'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  Timer,
  Users,
  XCircle,
} from 'lucide-react';

import type { DashboardKpis, DiaMetrica } from '@/features/reports/types';

function formatarDataCurta(dataIso: string): string {
  return new Date(`${dataIso}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

interface KpiCardProps {
  titulo: string;
  valor: number | string;
  Icone: typeof Users;
  tom?: 'primary' | 'success' | 'danger' | 'muted';
}

const TOM_CLASSES: Record<NonNullable<KpiCardProps['tom']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  muted: 'bg-muted-bg text-muted',
};

function KpiCard({ titulo, valor, Icone, tom = 'primary' }: KpiCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
          {titulo}
        </span>
        <span className={`flex size-9 items-center justify-center rounded-[8px] ${TOM_CLASSES[tom]}`}>
          <Icone className="size-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{valor}</p>
    </div>
  );
}

export interface ReportsPanelProps {
  kpis: DashboardKpis | null;
  serieDiaria: DiaMetrica[];
}

export function ReportsPanel({ kpis, serieDiaria }: ReportsPanelProps) {
  const dadosGrafico = serieDiaria.map((dia) => ({
    data: formatarDataCurta(dia.data),
    Atendidos: dia.finalizados,
    Total: dia.totalTickets,
  }));

  const dadosEspera = serieDiaria.map((dia) => ({
    data: formatarDataCurta(dia.data),
    'Espera média (min)': dia.esperaMediaMinutos ?? 0,
  }));

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <div>
        <h1 className="font-title text-2xl font-bold text-foreground sm:text-3xl">
          Relatórios
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tempo médio de espera e volume de atendimentos dos ultimos 30 dias.
        </p>
      </div>

      {!kpis ? (
        <div className="rounded-[12px] border border-border bg-white p-8 text-center text-muted">
          Ainda não há dados suficientes para exibir métricas.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard titulo="Tickets hoje" valor={kpis.ticketsHoje} Icone={Users} tom="primary" />
            <KpiCard
              titulo="Finalizados hoje"
              valor={kpis.finalizadosHoje}
              Icone={CheckCircle2}
              tom="success"
            />
            <KpiCard
              titulo="Aguardando agora"
              valor={kpis.aguardandoAgora}
              Icone={Clock}
              tom="muted"
            />
            <KpiCard
              titulo="Espera média hoje"
              valor={kpis.esperaMediaHoje != null ? `${kpis.esperaMediaHoje} min` : '-'}
              Icone={Timer}
              tom="primary"
            />
          </div>

          {kpis.canceladosHoje != null ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                titulo="Cancelados hoje"
                valor={kpis.canceladosHoje}
                Icone={XCircle}
                tom="danger"
              />
              <KpiCard
                titulo="Duração média (30d)"
                valor={kpis.duracaoMedia30d != null ? `${kpis.duracaoMedia30d} min` : '-'}
                Icone={Timer}
                tom="muted"
              />
              <KpiCard titulo="Guichês" valor={kpis.totalGuiches} Icone={Users} tom="muted" />
              <KpiCard
                titulo="Profissionais"
                valor={kpis.totalProfissionais}
                Icone={Users}
                tom="muted"
              />
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
              <h2 className="font-title font-bold text-foreground">Volume de tickets por dia</h2>
              <p className="mt-1 text-xs text-muted">Últimos 30 dias - total vs finalizados</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="data" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="Total"
                      stroke="#569eae"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Atendidos"
                      stroke="#295174"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm">
              <h2 className="font-title font-bold text-foreground">Tempo médio de espera</h2>
              <p className="mt-1 text-xs text-muted">Últimos 30 dias - em minutos</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosEspera}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="data" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="Espera média (min)"
                      stroke="#295174"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
