'use client';

import { useState } from 'react';

import { Input, type InputProps } from '@/components/ui/Input';
import { mascararTelefone } from '@/lib/validations';

export interface InputTelefoneProps
  extends Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  valorInicial?: string | null;
}

// Campo de telefone com máscara aplicada enquanto o usuário digita
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
