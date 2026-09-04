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
  ListOrdered,
  Monitor,
  Stethoscope,
  Ticket,
  Timer,
  UserX,
  XCircle,
} from 'lucide-react';

import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { CartaoIndicador } from '@/components/ui/CartaoIndicador';
import type { DashboardKpis, DiaMetrica } from '@/features/reports/types';
import { formatarDataCurta, formatarMinutos, formatarNumero } from '@/lib/utils';

const COR_PRIMARIA = '#295174';
const COR_CLARA = '#569eae';
const COR_SUCESSO = '#10b981';
const COR_PERIGO = '#ef4444';
const COR_ALERTA = '#f59e0b';
const COR_GRADE = '#e5e7eb';
const COR_TEXTO = '#6b7280';

const EIXO = { fontSize: 12, fill: COR_TEXTO };
const MARGEM = { top: 8, right: 8, left: 0, bottom: 0 };

interface GraficoProps {
  titulo: string;
  descricao: string;
  dados: Record<string, string | number>[];
  series: { chave: string; cor: string }[];
}

// Cada gráfico ocupa a linha inteira; o eixo Y usa largura fixa curta para não
// abrir uma calha vazia à esquerda
function Grafico({ titulo, descricao, dados, series }: GraficoProps) {
  return (
    <section className="flex flex-col gap-1 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-title text-base font-bold text-foreground">{titulo}</h2>
      <p className="text-sm text-muted">{descricao}</p>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={MARGEM}>
            <CartesianGrid strokeDasharray="3 3" stroke={COR_GRADE} />
            <XAxis dataKey="data" tick={EIXO} tickLine={false} />
            <YAxis
              tick={EIXO}
              width={36}
              tickMargin={4}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            {series.map((serie) => (
              <Line
                key={serie.chave}
                type="monotone"
                dataKey={serie.chave}
                stroke={serie.cor}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export interface ReportsPanelProps {
  kpis: DashboardKpis | null;
  serieDiaria: DiaMetrica[];
}

export function ReportsPanel({ kpis, serieDiaria }: ReportsPanelProps) {
  const volume = serieDiaria.map((dia) => ({
    data: formatarDataCurta(dia.data),
    Total: dia.totalTickets,
    Finalizados: dia.finalizados,
  }));

  const espera = serieDiaria.map((dia) => ({
    data: formatarDataCurta(dia.data),
    'Espera média (min)': Math.round(dia.esperaMediaMinutos ?? 0),
  }));

  const perdas = serieDiaria.map((dia) => ({
    data: formatarDataCurta(dia.data),
    Cancelados: dia.cancelados,
    Ausentes: dia.ausentes,
  }));

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Relatórios"
        descricao="Volume, espera e perdas dos últimos 30 dias."
      />

      {!kpis ? (
        <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
          Ainda não há dados suficientes para exibir métricas.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CartaoIndicador
              Icone={Ticket}
              rotulo="Tickets hoje"
              valor={formatarNumero(kpis.ticketsHoje)}
              detalhe={`${formatarNumero(kpis.finalizadosHoje)} finalizados`}
            />
            <CartaoIndicador
              Icone={CheckCircle2}
              rotulo="Finalizados hoje"
              valor={formatarNumero(kpis.finalizadosHoje)}
              detalhe="Atendimentos concluídos"
            />
            <CartaoIndicador
              Icone={ListOrdered}
              rotulo="Aguardando agora"
              valor={formatarNumero(kpis.aguardandoAgora)}
              detalhe="Ainda na fila"
            />
            <CartaoIndicador
              Icone={Clock}
              rotulo="Espera média hoje"
              valor={formatarMinutos(kpis.esperaMediaHoje)}
              detalhe="Da entrada até a chamada"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CartaoIndicador
              Icone={Timer}
              rotulo="Duração média (30 dias)"
              valor={formatarMinutos(kpis.duracaoMedia30d)}
              detalhe="Tempo de atendimento"
            />
            <CartaoIndicador
              Icone={XCircle}
              rotulo="Cancelados hoje"
              valor={kpis.canceladosHoje != null ? formatarNumero(kpis.canceladosHoje) : '—'}
              detalhe="Desistências registradas"
            />
            <CartaoIndicador
              Icone={UserX}
              rotulo="Ausentes hoje"
              valor={kpis.ausentesHoje != null ? formatarNumero(kpis.ausentesHoje) : '—'}
              detalhe="Chamados sem retorno"
            />
            <CartaoIndicador
              Icone={kpis.totalUnidades != null ? Monitor : Stethoscope}
              rotulo={kpis.totalUnidades != null ? 'Guichês' : 'Profissionais'}
              valor={formatarNumero(
                kpis.totalUnidades != null ? kpis.totalGuiches : kpis.totalProfissionais
              )}
              detalhe={
                kpis.totalUnidades != null
                  ? `${formatarNumero(kpis.totalUnidades)} unidades`
                  : `${formatarNumero(kpis.totalGuiches)} guichês`
              }
            />
          </div>

          <Grafico
            titulo="Volume de tickets por dia"
            descricao="Últimos 30 dias — total contra finalizados."
            dados={volume}
            series={[
              { chave: 'Total', cor: COR_CLARA },
              { chave: 'Finalizados', cor: COR_SUCESSO },
            ]}
          />

          <Grafico
            titulo="Tempo médio de espera"
            descricao="Últimos 30 dias — média ponderada pelos atendimentos finalizados."
            dados={espera}
            series={[{ chave: 'Espera média (min)', cor: COR_PRIMARIA }]}
          />

          <Grafico
            titulo="Cancelamentos e ausências"
            descricao="Últimos 30 dias — tickets que saíram da fila sem atendimento."
            dados={perdas}
            series={[
              { chave: 'Cancelados', cor: COR_PERIGO },
              { chave: 'Ausentes', cor: COR_ALERTA },
            ]}
          />
        </>
      )}
    </div>
  );
}
