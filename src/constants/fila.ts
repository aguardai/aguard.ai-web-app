// Rótulos e tons dos enums das duas filas, compartilhados pelas telas de
// monitoramento e relatórios
import type { BadgeTom } from '@/components/ui/Badge';
import type { Database } from '@/types/supabase';

export type StatusFila = Database['public']['Enums']['status_fila'];
export type TipoFila = Database['public']['Enums']['tipo_fila'];
export type PrioridadeFila = Database['public']['Enums']['prioridade_fila'];

// Status que ainda ocupam lugar na fila
export const STATUS_ATIVOS: StatusFila[] = ['aguardando', 'chamado', 'em_atendimento'];

export const ROTULO_STATUS: Record<StatusFila, string> = {
  aguardando: 'Aguardando',
  chamado: 'Chamado',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  ausente: 'Ausente',
  cancelado: 'Cancelado',
};

export const TOM_STATUS: Record<StatusFila, BadgeTom> = {
  aguardando: 'neutro',
  chamado: 'alerta',
  em_atendimento: 'primario',
  finalizado: 'sucesso',
  ausente: 'alerta',
  cancelado: 'perigo',
};

export const ROTULO_TIPO_FILA: Record<TipoFila, string> = {
  atendimento: 'Recepção',
  consulta: 'Consulta',
};
