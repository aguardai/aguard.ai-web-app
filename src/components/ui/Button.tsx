import { cn } from '@/lib/utils';

export type ButtonVariante = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonTamanho = 'sm' | 'md' | 'lg';

const VARIANTES: Record<ButtonVariante, string> = {
  primary:
    'bg-primary text-white shadow-sm hover:bg-primary/90 focus-visible:outline-primary',
  secondary:
    'bg-white text-primary border border-border shadow-sm hover:bg-muted-bg focus-visible:outline-primary',
  ghost: 'text-primary hover:bg-muted-bg focus-visible:outline-primary',
  danger:
    'bg-danger text-white shadow-sm hover:bg-danger/90 focus-visible:outline-danger',
};

const TAMANHOS: Record<ButtonTamanho, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

interface ButtonClassesOptions {
  variante?: ButtonVariante;
  tamanho?: ButtonTamanho;
  className?: string;
}

// Monta as classes do botão para uso em <button> e em links estilizados como botão
export function buttonClasses({
  variante = 'primary',
  tamanho = 'md',
  className,
}: ButtonClassesOptions = {}) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[8px] font-medium',
    'transition-colors duration-200 ease-in-out',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-60',
    VARIANTES[variante],
    TAMANHOS[tamanho],
    className
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: ButtonVariante;
  tamanho?: ButtonTamanho;
}

export function Button({
  variante,
  tamanho,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variante, tamanho, className })}
      {...props}
    />
  );
}
