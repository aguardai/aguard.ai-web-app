// Tipos da feature de painel de atendimento

export interface TicketAtendimento {
    id: string;
    senha: string;
    paciente_nome: string | null;
    created_at: string;
    started_at?: string | null;
    status: string;
    tipo_servico: string | null;
  }
  
  export interface AtendimentoHistoricoItem {
    id: string;
    senha: string;
    paciente_nome: string | null;
    created_at: string;
    started_at?: string | null;
    finished_at: string | null;
    status: string;
  }