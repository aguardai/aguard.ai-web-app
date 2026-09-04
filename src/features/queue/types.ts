export type StatusFila =
  | 'aguardando'
  | 'chamado'
  | 'em_atendimento'
  | 'ausente'
  | 'finalizado'
  | 'cancelado';

export type PrioridadeFila = 'normal' | 'preferencial';

export type TipoFila = 'atendimento' | 'consulta';

export interface TicketFila {
  tipo_fila: TipoFila;
  ticket_id: string;
  senha: string | null;
  status: StatusFila;
  prioridade: PrioridadeFila;
  posicao: number | null;
  estimativa_minutos: number | null;
  aguardando_na_frente: number;
  local: string | null;
  tipo_servico: string | null;
  unidade: string | null;
  guiche: string | null;
  clinica: string | null;
  paciente: string | null;
  entrada_fila: string;
  chamado_em: string | null;
  tipo_consulta?: string | null;
  proximo_ticket_id: string | null;
}
