import { z } from 'zod';

import {
  emailOpcionalSchema,
  emailSchema,
  telefoneOpcionalSchema,
} from '@/lib/validations';

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
  .min(2, 'Selecione a especialidade.')
  .max(80, 'Especialidade muito longa.');

const REGISTRO_PROFISSIONAL = z
  .string()
  .trim()
  .min(2, 'Informe o registro profissional (CRM, CRO, CREFITO...).')
  .max(40, 'Registro muito longo.');

// Cadastro e edição usam o mesmo schema — os dados do profissional em si
// não têm relação com o login (que é vinculado separadamente)
export const profissionalSchema = z.object({
  nome: NOME,
  especialidade: ESPECIALIDADE,
  registroProfissional: REGISTRO_PROFISSIONAL,
  email: emailOpcionalSchema,
  telefone: telefoneOpcionalSchema,
});

export type ProfissionalFormValues = z.infer<typeof profissionalSchema>;

// Convite de acesso: só precisa do e-mail que vai receber o vínculo de login
export const convidarAcessoSchema = z.object({
  email: emailSchema,
});

export const locacaoSchema = z
  .object({
    profissionalId: z.string().uuid('Selecione o profissional.'),
    unidadeId: z.string().uuid('Selecione a unidade.'),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início.'),
    dataFim: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de término inválida.')
      .optional()
      .or(z.literal('')),
  })
  .refine((dados) => !dados.dataFim || dados.dataFim >= dados.dataInicio, {
    message: 'O término não pode ser antes do início.',
    path: ['dataFim'],
  });

export type LocacaoFormValues = z.infer<typeof locacaoSchema>;
