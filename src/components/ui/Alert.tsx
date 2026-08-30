import { CircleAlert, CircleCheck, Info } from 'lucide-react';

import { cn } from '@/lib/utils';

export type AlertTom = 'erro' | 'sucesso' | 'info';

const TONS: Record<AlertTom, { classes: string; Icone: typeof Info }> = {
  erro: { classes: 'border-danger/30 bg-danger/10 text-danger', Icone: CircleAlert },
  sucesso: {
    classes: 'border-success/30 bg-success/10 text-success',
    Icone: CircleCheck,
  },
  info: { classes: 'border-primary/20 bg-primary/5 text-primary', Icone: Info },
};

export interface AlertProps {
  tom: AlertTom;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ tom, children, className }: AlertProps) {
  const { classes, Icone } = TONS[tom];

  return (
    <div
      role={tom === 'erro' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-[8px] border px-3.5 py-3 text-sm',
        classes,
        className
      )}
    >
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
