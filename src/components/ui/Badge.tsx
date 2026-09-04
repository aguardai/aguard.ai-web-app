import { cn } from '@/lib/utils';

export type BadgeTom = 'neutro' | 'primario' | 'sucesso' | 'alerta' | 'perigo';

const TONS: Record<BadgeTom, string> = {
  neutro: 'bg-muted-bg text-muted',
  primario: 'bg-primary/10 text-primary',
  sucesso: 'bg-success/15 text-success',
  alerta: 'bg-warning/15 text-warning',
  perigo: 'bg-danger/15 text-danger',
};

export interface BadgeProps {
  tom?: BadgeTom;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tom = 'neutro', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONS[tom],
        className
      )}
    >
      {children}
    </span>
  );
}
