import Link from 'next/link';

import { buttonClasses } from '@/components/ui/Button';
import { ComoFunciona } from '@/features/marketing/components/sections/ComoFunciona';
import { Duvidas } from '@/features/marketing/components/sections/Duvidas';
import { Hero } from '@/features/marketing/components/sections/Hero';
import { Planos } from '@/features/marketing/components/sections/Planos';
import { Recursos } from '@/features/marketing/components/sections/Recursos';
import { SiteFooter } from '@/features/marketing/components/sections/SiteFooter';
import { SiteHeader } from '@/features/marketing/components/sections/SiteHeader';

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <ComoFunciona />
        <Recursos />
        <Planos />
        <Duvidas />

        <section className="bg-gradient-to-br from-primary to-primary-light py-20 text-white sm:py-24">
          <div className="content-container flex flex-col items-center gap-7 text-center">
            <h2 className="max-w-2xl font-title text-3xl leading-tight font-bold sm:text-4xl">
              Organize a fila da sua clínica ainda hoje
            </h2>
            <p className="max-w-xl text-lg text-white/85">
              Crie a conta, cadastre o primeiro guichê e imprima o QR Code. O plano
              gratuito não pede cartão de crédito.
            </p>
            <Link
              href="/cadastro"
              className={buttonClasses({ variante: 'secondary', tamanho: 'lg' })}
            >
              Criar conta grátis
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
