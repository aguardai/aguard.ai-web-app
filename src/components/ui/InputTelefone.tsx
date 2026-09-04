'use client';

import { useState } from 'react';

import { Input, type InputProps } from '@/components/ui/Input';

// Aplica a máscara brasileira de telefone: (87) 99999-0000 ou (87) 9999-0000
export function mascararTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);

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

export interface InputTelefoneProps
  extends Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  valorInicial?: string | null;
}

export function InputTelefone({ valorInicial, ...props }: InputTelefoneProps) {
  const [valor, setValor] = useState(() => mascararTelefone(valorInicial ?? ''));

  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      value={valor}
      onChange={(evento) => setValor(mascararTelefone(evento.target.value))}
    />
  );
}
