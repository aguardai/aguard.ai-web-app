'use client';

import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface InputBuscaProps {
  id: string;
  label: string;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  dica?: string;
  className?: string;
}

// Campo de busca em texto livre: lupa à esquerda e botão de limpar à direita.
// O X nativo do type="search" fica escondido porque o Firefox não o desenha e o
// cursor dele não é configurável
export function InputBusca({
  id,
  label,
  valor,
  aoMudar,
  placeholder,
  dica,
  className,
}: InputBuscaProps) {
  const preenchido = valor.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />

        <input
          id={id}
          type="search"
          value={valor}
          placeholder={placeholder}
          aria-describedby={dica ? `${id}-dica` : undefined}
          onChange={(evento) => aoMudar(evento.target.value)}
          className={cn(
            'h-11 w-full rounded-[8px] border border-border bg-white pr-10 pl-10',
            'text-sm text-foreground placeholder:text-muted',
            'transition-colors duration-200 ease-in-out',
            'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
            '[&::-webkit-search-cancel-button]:appearance-none',
            className
          )}
        />

        {preenchido ? (
          <button
            type="button"
            onClick={() => aoMudar('')}
            aria-label="Limpar busca"
            title="Limpar busca"
            className={cn(
              'absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 cursor-pointer',
              'items-center justify-center rounded-full text-muted',
              'transition-colors duration-200 ease-in-out',
              'hover:bg-muted-bg hover:text-foreground',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {dica ? (
        <p id={`${id}-dica`} className="text-sm text-muted">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
