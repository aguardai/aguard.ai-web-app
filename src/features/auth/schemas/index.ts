import { z } from 'zod';

import { PLANO_IDS } from '@/constants/planos';
import { emailSchema } from '@/lib/validations';

const EMAIL = emailSchema;

const CAMPOS_DADOS = {
  nomeClinica: z
    .string()
    .trim()
    .min(2, 'Informe o nome da clínica.')
    .max(120, 'Nome muito longo.'),
  nome: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(120, 'Nome muito longo.'),
  email: EMAIL,
};

const CAMPOS_SENHA = {
  senha: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(72, 'A senha pode ter no máximo 72 caracteres.'),
  confirmarSenha: z.string().min(1, 'Repita a senha.'),
};

const SENHAS_IGUAIS = {
  message: 'As senhas não conferem.',
  path: ['confirmarSenha'],
};

function senhasConferem(valores: { senha: string; confirmarSenha: string }) {
  return valores.senha === valores.confirmarSenha;
}

export const loginSchema = z.object({
  email: EMAIL,
  senha: z.string().min(1, 'Informe sua senha.').max(72),
});

// Passo 1 do cadastro: identificação da clínica e do responsável
export const dadosClinicaSchema = z.object(CAMPOS_DADOS);

// Passo 2 do cadastro: senha e confirmação
export const senhaCadastroSchema = z
  .object(CAMPOS_SENHA)
  .refine(senhasConferem, SENHAS_IGUAIS);

// Cadastro completo, revalidado no servidor
export const cadastroClinicaSchema = z
  .object({ ...CAMPOS_DADOS, ...CAMPOS_SENHA, plano: z.enum([...PLANO_IDS] as [string, ...string[]]), })
  .refine(senhasConferem, SENHAS_IGUAIS);

export const metadadosCadastroSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  nome_clinica: z.string().trim().min(2).max(120),
  plano: z.enum(PLANO_IDS),
   transacao_id: z.string().optional(),
});

// Devolve a primeira mensagem de erro de cada campo, para exibição inline
export function erroPorCampo(error: z.ZodError): Record<string, string> {
  const erros: Record<string, string> = {};

  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? '');
    if (campo && !erros[campo]) {
      erros[campo] = issue.message;
    }
  }

  return erros;
}
