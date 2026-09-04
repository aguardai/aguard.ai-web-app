'use client';

import dynamic from 'next/dynamic';

import type { UnidadeResumo } from '@/features/clinic/types';
import type { DashboardKpis, DiaMetrica } from '@/features/reports/types';

// Recharts só roda no browser: o painel entra por import dinâmico sem SSR
const ReportsPanel = dynamic(
  () => import('@/features/reports/components/ReportsPanel').then((mod) => mod.ReportsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="content-container py-8">
        <div className="h-64 animate-pulse rounded-[12px] bg-muted-bg" />
      </div>
    ),
  }
);

export interface ReportsPanelClientProps {
  kpis: DashboardKpis | null;
  serieDiaria: DiaMetrica[];
  unidades: UnidadeResumo[];
  unidadeId: string;
  podeFiltrar: boolean;
}

export function ReportsPanelClient(props: ReportsPanelClientProps) {
  return <ReportsPanel {...props} />;
}
