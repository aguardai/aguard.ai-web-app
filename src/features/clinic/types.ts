// Tipos da feature de gestão de clínica e unidades

import type { PlanoId } from '@/constants/planos';
import type { Tables } from '@/types/supabase';

export type Clinica = Tables<'clinica'>;
export type Unidade = Tables<'unidade'>;

// Unidade reduzida ao necessário para filtros e selects
export interface UnidadeResumo {
  id: string;
  nome: string;
  codigo: string;
  ativa: boolean;
}

export interface RecursoUso {
  usado: number;
  limite: number;
}

// Espelha vw_uso_plano: consumo atual contra os limites de plano_limite
export interface UsoPlano {
  plano: PlanoId;
  precoMensalSimulado: number;
  unidades: RecursoUso;
  guiches: RecursoUso;
  profissionais: RecursoUso;
  ticketsMes: RecursoUso;
}
export interface EstadoTrocaPlano {
  erro?: string;
  sucesso?: string;
  status?: 'aprovado' | 'pendente' | 'recusado';
  transacaoId?: string;
  pix?: { qrCodeBase64: string; copiaECola: string };
}

export interface EstadoFormularioClinica {
  erro?: string;
  sucesso?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;
}

export type Guiche = Tables<'guiche'>;

// Guichê com o nome da unidade resolvido, usado na listagem
export interface GuicheComUnidade extends Guiche {
  unidade: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface EstadoFormularioGuiche {
  erro?: string;
  sucesso?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;
}

export interface EstadoFormularioUnidade {
  erro?: string;
  sucesso?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;
}
