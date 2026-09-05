import { z } from 'zod';

import { emailOpcionalSchema, telefoneSchema } from '@/lib/validations';

// Entrada do paciente na fila da unidade. A prioridade é declarada por ele
// mesmo e vai direto para fn_entrar_fila_atendimento
export const entrarNaFilaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(120, 'Nome muito longo.'),
  telefone: telefoneSchema,
  email: emailOpcionalSchema,
  prioridade: z.enum(['normal', 'preferencial']),
});

export type EntrarNaFilaFormValues = z.infer<typeof entrarNaFilaSchema>;
