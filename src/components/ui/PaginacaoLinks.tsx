import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { acaoIconeClasses } from '@/components/ui/AcaoIcone';
import { cn, formatarNumero } from '@/lib/utils';

export interface PaginacaoLinksProps {
  pagina: number;
  porPagina: number;
  total: number;
  hrefDaPagina: (pagina: number) => string;
}

// Paginação de listagens renderizadas no servidor: cada página é um link
export function PaginacaoLinks({
  pagina,
  porPagina,
  total,
  hrefDaPagina,
}: PaginacaoLinksProps) {
  const totalPaginas = Math.max(Math.ceil(total / porPagina), 1);
  const primeiro = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  const temAnterior = pagina > 1;
  const temProxima = pagina < totalPaginas;

  const inativo = 'pointer-events-none opacity-40';

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">
        {formatarNumero(primeiro)}–{formatarNumero(ultimo)} de {formatarNumero(total)}
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={temAnterior ? hrefDaPagina(pagina - 1) : '#'}
          aria-label="Página anterior"
          aria-disabled={!temAnterior}
          tabIndex={temAnterior ? undefined : -1}
          className={cn(acaoIconeClasses(), !temAnterior && inativo)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>

        <span className="text-sm text-muted tabular-nums">
          {pagina} de {formatarNumero(totalPaginas)}
        </span>

        <Link
          href={temProxima ? hrefDaPagina(pagina + 1) : '#'}
          aria-label="Próxima página"
          aria-disabled={!temProxima}
          tabIndex={temProxima ? undefined : -1}
          className={cn(acaoIconeClasses(), !temProxima && inativo)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
