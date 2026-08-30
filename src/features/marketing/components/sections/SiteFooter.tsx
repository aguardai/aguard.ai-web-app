import Link from 'next/link';

import { Logo } from '@/components/ui/Logo';
import { LinkInicio } from '@/features/marketing/components/ui/LinkInicio';

const LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#planos', label: 'Planos' },
  { href: '#duvidas', label: 'Dúvidas' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="content-container flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <LinkInicio>
            <Logo tamanho={32} />
          </LinkInicio>
          <p className="text-sm text-muted">Fila virtual para clínicas.</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-start">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-label={link.label}
              className="grid text-sm text-muted transition-colors duration-200 before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-bold before:content-[attr(data-label)] hover:font-bold hover:text-primary"
            >
              <span className="col-start-1 row-start-1">{link.label}</span>
            </Link>
          ))}
          <Link
            href="/login"
            data-label="Entrar"
            className="grid text-sm text-muted transition-colors duration-200 before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-bold before:content-[attr(data-label)] hover:font-bold hover:text-primary"
          >
            <span className="col-start-1 row-start-1">Entrar</span>
          </Link>
        </nav>
      </div>

      <div className="content-container mt-8 border-t border-border pt-6">
        <p className="text-xs text-muted text-center">
          Projeto acadêmico — Engenharia de Software 3, UNIVASF. Valores e planos são
          simulados, sem cobrança real.
        </p>
      </div>
    </footer>
  );
}
