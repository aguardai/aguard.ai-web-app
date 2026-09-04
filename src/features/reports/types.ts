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
  esperaMediaMinutos: number | null;
}
