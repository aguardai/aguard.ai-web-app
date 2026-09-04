import { z } from 'zod';

import { PLANO_IDS } from '@/constants/planos';

export { erroPorCampo } from '@/features/auth/schemas';

export const clinicaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome da clínica.')
    .max(120, 'Nome muito longo.'),
  email: z
    .string()
    .trim()
    .min(5, 'Informe um e-mail válido.')
    .max(160, 'E-mail muito longo.')
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.'),
  telefone: z
    .string()
    .trim()
    .max(20, 'Telefone muito longo.')
    .refine(
      (valor) => valor === '' || /^[0-9]{10,13}$/.test(valor.replace(/\D/g, '')),
      'Informe um telefone com DDD.'
    )
    .transform((valor) => valor.replace(/[^0-9]/g, '')),
  endereco: z.string().trim().max(240, 'Endereço muito longo.').optional().or(z.literal('')),
});

export type ClinicaFormValues = z.infer<typeof clinicaSchema>;

export const trocaPlanoSchema = z.object({
  plano: z.enum(PLANO_IDS),
});
