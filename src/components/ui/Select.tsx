import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  id: string;
  label: string;
  opcoes: readonly OpcaoSelect[];
  placeholder?: string;
  erro?: string;
  dica?: string;
}

export function Select({
  id,
  label,
  opcoes,
  placeholder,
  erro,
  dica,
  className,
  ...props
}: SelectProps) {
  const idDescricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          aria-describedby={idDescricao}
          aria-invalid={erro ? true : undefined}
          className={cn(
            'h-11 w-full cursor-pointer appearance-none rounded-[8px] border bg-white',
            'pr-10 pl-3.5 text-sm text-foreground',
            'transition-colors duration-200 ease-in-out',
            'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
            erro ? 'border-danger' : 'border-border',
            className
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
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
