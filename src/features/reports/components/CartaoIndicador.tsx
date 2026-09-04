import type { LucideIcon } from 'lucide-react';

export interface CartaoIndicadorProps {
  rotulo: string;
  valor: string;
  detalhe?: string;
  Icone: LucideIcon;
}

export function CartaoIndicador({ rotulo, valor, detalhe, Icone }: CartaoIndicadorProps) {
  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-border bg-white p-5 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
        <Icone className="size-5" aria-hidden />
      </span>

      <div className="min-w-0">
        <p className="text-sm text-muted">{rotulo}</p>
        <p className="font-title text-2xl font-bold text-foreground">{valor}</p>
        {detalhe ? <p className="mt-0.5 text-xs text-muted">{detalhe}</p> : null}
      </div>
    </div>
  );
}
