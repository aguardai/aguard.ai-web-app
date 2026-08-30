import Image from 'next/image';

import { cn } from '@/lib/utils';

export interface LogoProps {
  tamanho?: number;
  tom?: 'primary' | 'branco';
  comChapa?: boolean;
  prioridade?: boolean;
  className?: string;
}

export function Logo({
  tamanho = 32,
  tom = 'primary',
  comChapa = false,
  prioridade = false,
  className,
}: LogoProps) {
  const emBranco = tom === 'branco';

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/logo.svg"
        alt=""
        width={tamanho}
        height={tamanho}
        unoptimized
        priority={prioridade}
        className={cn(
          'shrink-0 rounded-[8px] object-contain',
          comChapa && 'bg-white p-1'
        )}
      />
      <span
        className={cn(
          'font-title text-xl font-normal',
          emBranco ? 'text-white' : 'text-foreground'
        )}
      >
        Aguard
        <span
          className={cn(
            'font-bold',
            emBranco
              ? 'text-white'
              : 'bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent'
          )}
        >
          .ai
        </span>
      </span>
    </span>
  );
}
