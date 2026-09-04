'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { acaoIconeClasses } from '@/components/ui/AcaoIcone';
import { formatarNumero } from '@/lib/utils';

export interface PaginacaoProps {
  pagina: number;
  porPagina: number;
  total: number;
  aoMudar: (pagina: number) => void;
}

// Navegação de páginas para listagens paginadas no servidor
export function Paginacao({ pagina, porPagina, total, aoMudar }: PaginacaoProps) {
  const totalPaginas = Math.max(Math.ceil(total / porPagina), 1);
  const primeiro = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">
        {formatarNumero(primeiro)}–{formatarNumero(ultimo)} de {formatarNumero(total)}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Página anterior"
          title="Página anterior"
          onClick={() => aoMudar(pagina - 1)}
          disabled={pagina <= 1}
          className={acaoIconeClasses()}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <span className="text-sm text-muted tabular-nums">
          {pagina} de {formatarNumero(totalPaginas)}
        </span>

        <button
          type="button"
          aria-label="Próxima página"
          title="Próxima página"
          onClick={() => aoMudar(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className={acaoIconeClasses()}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
