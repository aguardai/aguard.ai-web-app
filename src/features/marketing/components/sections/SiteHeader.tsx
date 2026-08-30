'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { LinkInicio } from '@/features/marketing/components/ui/LinkInicio';

const NAVEGACAO = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#planos', label: 'Planos' },
  { href: '#duvidas', label: 'Dúvidas' },
];

export function SiteHeader() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="content-container flex h-16 items-center justify-between gap-6">
        <LinkInicio>
          <Logo tamanho={36} prioridade />
        </LinkInicio>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAVEGACAO.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-label={item.label}
              className="grid text-sm text-muted transition-colors duration-200 before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-bold before:content-[attr(data-label)] hover:font-bold hover:text-primary"
            >
              <span className="col-start-1 row-start-1">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className={buttonClasses({ variante: 'ghost', tamanho: 'sm' })}
          >
            Entrar
          </Link>
          <Link href="/cadastro" className={buttonClasses({ tamanho: 'sm' })}>
            Criar conta grátis
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setAberto((estado) => !estado)}
          aria-expanded={aberto}
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          className="cursor-pointer rounded-[8px] p-2 text-primary transition-colors hover:bg-muted-bg lg:hidden"
        >
          {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {aberto ? (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="content-container flex flex-col gap-1 py-4">
            {NAVEGACAO.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className="rounded-[8px] px-2 py-2.5 text-sm text-muted transition-colors hover:bg-muted-bg hover:text-primary"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-col gap-2">
              <Link href="/login" className={buttonClasses({ variante: 'secondary' })}>
                Entrar
              </Link>
              <Link href="/cadastro" className={buttonClasses()}>
                Criar conta grátis
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
