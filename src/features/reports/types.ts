// Tipos da feature de relatórios e dashboards

import type { PlanoId } from '@/constants/planos';

export type EscopoDashboard = 'clinica' | 'unidade';

// Indicadores do dia, montados a partir de vw_dashboard_clinica ou vw_dashboard_unidade
export interface ResumoDashboard {
  escopo: EscopoDashboard;
  titulo: string;
  plano: PlanoId | null;
  totalUnidades: number | null;
  totalGuiches: number;
  totalProfissionais: number;
  ticketsHoje: number;
  finalizadosHoje: number;
  aguardandoAgora: number;
  esperaMediaHoje: number | null;
  duracaoMedia30d: number | null;
}

// Um dia da série histórica de vw_metricas_diarias
export interface PontoDiario {
  data: string;
  total: number;
  finalizados: number;
  esperaMedia: number | null;
}

export interface ResumoUnidade {
  unidadeId: string;
  nome: string;
  totalGuiches: number;
  ticketsHoje: number;
  aguardandoAgora: number;
  esperaMediaHoje: number | null;
}

// Indicadores e série diária consumidos pelo painel de /relatorios
export interface DashboardKpis {
  ticketsHoje: number;
  finalizadosHoje: number;
  aguardandoAgora: number;
  esperaMediaHoje: number | null;
  duracaoMedia30d: number | null;
  canceladosHoje: number | null;
  ausentesHoje: number | null;
  totalGuiches: number;
  totalProfissionais: number;
  totalUnidades: number | null;
}

export interface DiaMetrica {
  data: string;
  totalTickets: number;
  finalizados: number;
  cancelados: number;
  ausentes: number;
  esperaMediaMinutos: number | null;
}
