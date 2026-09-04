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
// Formato das linhas devolvidas pelos selects de consulta com o paciente
// embutido. O client do Supabase não é tipado, então o formato é declarado aqui
// em vez de espalhar casts pelas páginas.
export interface PacienteEmbutido {
  nome: string;
}

export type PacienteDaConsulta = PacienteEmbutido | PacienteEmbutido[] | null;

export function nomeDoPaciente(paciente: PacienteDaConsulta): string {
  const registro = Array.isArray(paciente) ? paciente[0] : paciente;

  return registro?.nome || 'Paciente sem nome';
}

export interface LinhaConsultaFila {
  id: string;
  senha: string | null;
  status: string;
  entrada_fila: string;
  tipo_consulta: string | null;
  paciente: PacienteDaConsulta;
}

export interface LinhaConsultaHistorico {
  id: string;
  senha: string | null;
  status: string;
  entrada_fila: string;
  atendido_em: string | null;
  finalizado_em: string | null;
  paciente: PacienteDaConsulta;
}
