import { cn } from '@/lib/utils';

export type TomAcao = 'neutro' | 'perigo';

// Botão quadrado só com ícone, usado nas colunas de ação das listagens
export function acaoIconeClasses(tom: TomAcao = 'neutro', className?: string) {
  return cn(
    'inline-flex size-9 cursor-pointer items-center justify-center rounded-[8px]',
    'border border-border bg-white text-muted',
    'transition-colors duration-200 ease-in-out',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-60',
    tom === 'perigo'
      ? 'hover:border-danger/40 hover:bg-danger/10 hover:text-danger focus-visible:outline-danger'
      : 'hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-primary',
    className
  );
}

export interface AcaoIconeProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  rotulo: string;
  tom?: TomAcao;
  children: React.ReactNode;
}

export function AcaoIcone({
  rotulo,
  tom,
  className,
  children,
  type = 'button',
  ...props
}: AcaoIconeProps) {
  return (
    <button
      type={type}
      aria-label={rotulo}
      title={rotulo}
      className={acaoIconeClasses(tom, className)}
      {...props}
    >
      {children}
    </button>
  );
}
