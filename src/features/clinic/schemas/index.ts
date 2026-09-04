import { z } from 'zod';

import { PLANO_IDS } from '@/constants/planos';
import { emailSchema, telefoneOpcionalSchema } from '@/lib/validations';

export { erroPorCampo } from '@/features/auth/schemas';

export const clinicaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome da clínica.')
    .max(120, 'Nome muito longo.'),
  email: emailSchema,
  telefone: telefoneOpcionalSchema,
  endereco: z.string().trim().max(240, 'Endereço muito longo.').optional().or(z.literal('')),
});

export type ClinicaFormValues = z.infer<typeof clinicaSchema>;

export const trocaPlanoSchema = z.object({
  plano: z.enum(PLANO_IDS),
});

// Schema da edição da clínica pelo client, com logo, usado por clinica-client
export const editarClinicaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da clínica.').max(120, 'Nome muito longo.'),
  email: emailSchema,
  telefone: telefoneOpcionalSchema,
  endereco: z.string().trim().max(200, 'Endereço muito longo.').optional().or(z.literal('')),
  logo_url: z.string().trim().url('Informe uma URL válida.').optional().or(z.literal('')),
});

export type EditarClinicaFormValues = z.infer<typeof editarClinicaSchema>;

export const guicheSchema = z.object({
  unidadeId: z.string().uuid('Selecione a unidade.'),
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome do guichê.')
    .max(60, 'Nome muito longo.'),
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,6}$/, 'Use de 2 a 6 letras ou números, sem espaços.'),
});

export type GuicheFormValues = z.infer<typeof guicheSchema>;

export const unidadeSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da unidade.').max(120, 'Nome muito longo.'),
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,6}$/, 'Use de 2 a 6 letras ou números, sem espaços.'),
  tipoServico: z
    .string()
    .trim()
    .min(1, 'Informe o tipo de serviço.')
    .max(60, 'Tipo de serviço muito longo.'),
  telefone: telefoneOpcionalSchema,
  endereco: z.string().trim().min(3, 'Informe o endereço.').max(240, 'Endereço muito longo.'),
});

export type UnidadeFormValues = z.infer<typeof unidadeSchema>;
