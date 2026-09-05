// Schemas Zod e formatadores compartilhados entre features
import { z } from 'zod';

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, '');
}

// Máscara brasileira de telefone: (87) 99999-0000 ou (87) 9999-0000
export function mascararTelefone(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 11);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }

  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

const TELEFONE_VALIDO = /^[0-9]{10,13}$/;

// Telefone obrigatório: aceita mascarado e guarda só os dígitos, como a coluna espera
export const telefoneSchema = z
  .string()
  .trim()
  .max(20, 'Telefone muito longo.')
  .refine((valor) => TELEFONE_VALIDO.test(apenasDigitos(valor)), 'Informe um telefone com DDD.')
  .transform(apenasDigitos);

// Mesma regra, mas o campo pode vir vazio
export const telefoneOpcionalSchema = z
  .string()
  .trim()
  .max(20, 'Telefone muito longo.')
  .refine(
    (valor) => valor === '' || TELEFONE_VALIDO.test(apenasDigitos(valor)),
    'Informe um telefone com DDD.'
  )
  .transform(apenasDigitos);

export const emailSchema = z
  .string()
  .trim()
  .min(5, 'Informe um e-mail válido.')
  .max(160, 'E-mail muito longo.')
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.');

export const emailOpcionalSchema = z
  .string()
  .trim()
  .max(160, 'E-mail muito longo.')
  .refine(
    (valor) => valor === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor),
    'Informe um e-mail válido.'
  );
