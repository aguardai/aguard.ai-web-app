import { z } from 'zod';

const telefoneRegex = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

export const entrarNaFilaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(120, 'Nome muito longo.'),
  telefone: z
    .string()
    .trim()
    .regex(telefoneRegex, 'Informe um telefone válido com DDD.'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('')),
});

export type EntrarNaFilaFormValues = z.infer<typeof entrarNaFilaSchema>;
