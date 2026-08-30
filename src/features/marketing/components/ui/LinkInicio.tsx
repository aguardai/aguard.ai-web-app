'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface LinkInicioProps {
  className?: string;
  children: React.ReactNode;
}

// Leva para a home; se já estiver nela, rola de volta ao topo
export function LinkInicio({ className, children }: LinkInicioProps) {
  const caminho = usePathname();

  function handleClick(evento: React.MouseEvent<HTMLAnchorElement>) {
    if (caminho !== '/') return;

    evento.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Link
      href="/"
      aria-label="Aguard.ai — início"
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
