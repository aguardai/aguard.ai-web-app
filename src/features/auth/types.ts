// Tipos da feature de autenticação e autorização

import type { PlanoId } from '@/constants/planos';

export type PapelUsuario = 'clinica' | 'unidade' | 'profissional';

export interface Perfil {
  id: string;
  clinica_id: string | null;
  unidade_id: string | null;
  papel: PapelUsuario;
  nome: string;
  email: string | null;
}

export interface MetadadosCadastro {
  nome: string;
  nome_clinica: string;
  plano: PlanoId;
}

export interface EstadoFormulario {
  erro?: string;
  sucesso?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;

  // Cadastro aprovado, aguardando o pagamento do plano escolhido
  aguardandoPagamento?: boolean;
  usuarioId?: string;
  statusPagamento?: 'pendente' | 'aprovado' | 'recusado';
  transacaoId?: string;
  pix?: { qrCodeBase64: string; copiaECola: string };
}
