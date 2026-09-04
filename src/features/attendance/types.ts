// Tipos da feature de atendimento — painel de fila (Fila Virtual 2) do profissional

import type { Database } from '@/types/supabase';
import type { Tables } from '@/types/supabase';

export type StatusFila = Database['public']['Enums']['status_fila'];
export type PrioridadeFila = Database['public']['Enums']['prioridade_fila'];

// Linha devolvida por fn_painel_fila_consulta — já vem com o nome do paciente
// resolvido pelo backend, sem precisar de join manual
export type TicketFila =
  Database['public']['Functions']['fn_painel_fila_consulta']['Returns'][number];

export type Consulta = Tables<'consulta'>;

// Histórico com o nome do paciente embutido via join — pode vir null se a
// RLS não liberar a leitura da linha de paciente para o papel profissional
export interface ConsultaComPaciente extends Consulta {
  paciente: { nome: string } | null;
}

export interface ResultadoFila {
  sucesso: boolean;
  erro?: string;
}