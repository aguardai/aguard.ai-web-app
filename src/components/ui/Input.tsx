import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  erro?: string;
  dica?: string;
}

export function Input({ id, label, erro, dica, className, ...props }: InputProps) {
  const idDescricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <input
        id={id}
        aria-describedby={idDescricao}
        aria-invalid={erro ? true : undefined}
        className={cn(
          'h-11 w-full rounded-[8px] border bg-white px-3.5 text-sm text-foreground',
          'placeholder:text-muted transition-colors duration-200 ease-in-out',
          'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
          erro ? 'border-danger' : 'border-border',
          className
        )}
        {...props}
      />

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
