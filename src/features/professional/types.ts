// Tipos da feature de profissionais

import type { Tables } from '@/types/supabase';

export type Profissional = Tables<'profissional'>;
export type Locacao = Tables<'locacao'>;

// Locação com o nome/código da unidade já resolvidos, usada na tela de detalhe
export interface LocacaoComUnidade extends Locacao {
  unidade: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface ProfissionalComLocacoes extends Profissional {
  locacoes: LocacaoComUnidade[];
}

export interface EstadoFormularioProfissional {
  erro?: string;
  sucesso?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;
}

export interface EstadoConviteAcesso {
  erro?: string;
  sucesso?: string;
}