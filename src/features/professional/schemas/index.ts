import { z } from 'zod';

// Reaproveita o mesmo formatador de erro usado em auth, para manter o padrão
// de EstadoFormulario { erros: Record<string, string> } em todo o app
export { erroPorCampo } from '@/features/auth/schemas';

const NOME = z
  .string()
  .trim()
  .min(3, 'Informe o nome completo.')
  .max(120, 'Nome muito longo.');

const ESPECIALIDADE = z
  .string()
  .trim()
  .min(2, 'Informe a especialidade.')
  .max(80, 'Especialidade muito longa.');

const REGISTRO_PROFISSIONAL = z
  .string()
  .trim()
  .min(2, 'Informe o registro profissional (CRM, CRO, CREFITO...).')
  .max(40, 'Registro muito longo.');

const EMAIL_OPCIONAL = z
  .string()
  .trim()
  .max(160, 'E-mail muito longo.')
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.')
  .optional()
  .or(z.literal(''));

const TELEFONE_OPCIONAL = z
  .string()
  .trim()
  .max(20, 'Telefone muito longo.')
  .optional()
  .or(z.literal(''));

// Cadastro e edição usam o mesmo schema — os dados do profissional em si
// não têm relação com o login (que é vinculado separadamente)
export const profissionalSchema = z.object({
  nome: NOME,
  especialidade: ESPECIALIDADE,
  registroProfissional: REGISTRO_PROFISSIONAL,
  email: EMAIL_OPCIONAL,
  telefone: TELEFONE_OPCIONAL,
});

export type ProfissionalFormValues = z.infer<typeof profissionalSchema>;

// Convite de acesso: só precisa do e-mail que vai receber o vínculo de login
export const convidarAcessoSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, 'Informe um e-mail válido.')
    .max(160, 'E-mail muito longo.')
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.'),
});