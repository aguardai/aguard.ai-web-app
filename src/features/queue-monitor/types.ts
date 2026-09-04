import type { StatusFila, PrioridadeFila } from '@/features/queue/types';

export type TipoFilaUnificada = 'atendimento' | 'consulta';

export interface TicketFilaUnificada {
  tipo_fila: TipoFilaUnificada;
  ticket_id: string;
  senha: string | null;
  status: StatusFila;
  prioridade: PrioridadeFila;
  posicao: number | null;
  entrada_fila: string;
  chamado_em: string | null;
  atendido_em: string | null;
  tipo_consulta: string | null;
  profissional_id: string | null;
  unidade_id: string;
  guiche_id: string | null;
  origem: string | null;
  paciente_id: string;
  paciente_nome: string | null;
  paciente_telefone: string | null;
  clinica_id: string;
}

// Uma página da fila com os totais reais vindos do count do PostgREST
export interface PaginaFila {
  tickets: TicketFilaUnificada[];
  total: number;
  aguardando: number;
}
