import { z } from 'zod';

export const editarClinicaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da clínica.').max(120, 'Nome muito longo.'),
  email: z.string().trim().email('E-mail inválido.'),
  telefone: z.string().trim().max(20, 'Telefone muito longo.').optional().or(z.literal('')),
  endereco: z.string().trim().max(200, 'Endereço muito longo.').optional().or(z.literal('')),
  logo_url: z
    .string()
    .trim()
    .url('Informe uma URL válida.')
    .optional()
    .or(z.literal('')),
});

export type EditarClinicaFormValues = z.infer<typeof editarClinicaSchema>;
