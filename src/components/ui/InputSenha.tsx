'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface InputSenhaProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
  label: string;
  erro?: string;
  dica?: string;
}

// Campo de senha com botão para mostrar ou esconder o que foi digitado
export function InputSenha({ id, label, erro, dica, className, ...props }: InputSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const idDescricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          aria-describedby={idDescricao}
          aria-invalid={erro ? true : undefined}
          className={cn(
            'h-11 w-full rounded-[8px] border bg-white pr-11 pl-3.5 text-sm text-foreground',
            'placeholder:text-muted transition-colors duration-200 ease-in-out',
            'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
            erro ? 'border-danger' : 'border-border',
            className
          )}
          {...props}
        />

        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          title={visivel ? 'Esconder senha' : 'Mostrar senha'}
          className={cn(
            'absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 cursor-pointer',
            'items-center justify-center rounded-full text-muted',
            'transition-colors duration-200 ease-in-out',
            'hover:bg-muted-bg hover:text-foreground',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
        >
          {visivel ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>

      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-sm text-danger">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="text-sm text-muted">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
