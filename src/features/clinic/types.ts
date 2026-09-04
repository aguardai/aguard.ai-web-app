import type { PlanoId } from '@/constants/planos';

export interface Clinica {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  logo_url: string | null;
  plano: PlanoId;
  ativa: boolean;
}

export interface UsoPlanoDetalhado {
  plano: PlanoId;
  precoMensalSimulado: number;
  maxUnidades: number;
  maxGuiches: number;
  maxProfissionais: number;
  maxTicketsMes: number;
  unidadesUsadas: number;
  guichesUsados: number;
  profissionaisUsados: number;
  ticketsNoMes: number;
}
