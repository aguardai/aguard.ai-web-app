import { cn } from '@/lib/utils';

export interface EtiquetaAtivoProps {
  ativo: boolean;
  rotulos?: [ativo: string, inativo: string];
  className?: string;
}

// Etiqueta de status usada nas listagens e nas telas de detalhe
export function EtiquetaAtivo({
  ativo,
  rotulos = ['Ativo', 'Inativo'],
  className,
}: EtiquetaAtivoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        ativo ? 'bg-success text-white' : 'bg-muted-bg text-muted',
        className
      )}
    >
      {ativo ? rotulos[0] : rotulos[1]}
    </span>
  );
}
