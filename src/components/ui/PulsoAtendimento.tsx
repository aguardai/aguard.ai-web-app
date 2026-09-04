import { Stethoscope } from 'lucide-react';

import { cn } from '@/lib/utils';

export type TomPulso = 'branco' | 'primary';

export interface PulsoAtendimentoProps {
  tom?: TomPulso;
  className?: string;
}

const TONS: Record<TomPulso, { anel: string; chapa: string; icone: string; traco: string }> = {
  branco: {
    anel: 'border-white/40',
    chapa: 'bg-white/15',
    icone: 'text-white',
    traco: 'rgba(255,255,255,0.75)',
  },
  primary: {
    anel: 'border-primary/30',
    chapa: 'bg-primary/10',
    icone: 'text-primary',
    traco: 'var(--color-primary)',
  },
};

// Anéis de chamada, flutuação e traçado de ECG. Usada no painel de autenticação
// e como indicador de carregamento das telas internas
export function PulsoAtendimento({ tom = 'branco', className }: PulsoAtendimentoProps) {
  const cores = TONS[tom];

  return (
    <div aria-hidden className={cn('relative flex size-44 items-center justify-center', className)}>
      <span className={cn('motion-anel absolute inset-0 rounded-full border', cores.anel)} />
      <span
        className={cn(
          'motion-anel absolute inset-0 rounded-full border [animation-delay:1s]',
          cores.anel
        )}
      />
      <span
        className={cn(
          'motion-anel absolute inset-0 rounded-full border [animation-delay:2s]',
          cores.anel
        )}
      />

      <span
        className={cn(
          'motion-flutua flex size-24 items-center justify-center rounded-full',
          cores.chapa
        )}
      >
        <Stethoscope className={cn('size-11', cores.icone)} />
      </span>

      <svg
        viewBox="0 0 200 28"
        fill="none"
        className="absolute -bottom-4 w-52"
        role="presentation"
      >
        <polyline
          className="motion-ecg"
          points="0,14 44,14 52,5 60,23 68,14 112,14 120,6 128,22 136,14 200,14"
          stroke={cores.traco}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
