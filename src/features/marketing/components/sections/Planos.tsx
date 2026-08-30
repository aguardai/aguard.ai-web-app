import Link from 'next/link';
import { Check, Headphones } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { PLANOS } from '@/constants/planos';
import { cn, formatarMoeda } from '@/lib/utils';
import { EtiquetaSecao } from '@/features/marketing/components/ui/EtiquetaSecao';

const COMPARATIVO = [
  { nome: 'Fisioly', preco: 'R$ 44,90/mês' },
  { nome: 'ZenFisio', preco: 'R$ 79,00 a R$ 439,00/mês' },
  { nome: 'Shosp', preco: 'R$ 149,00 a R$ 229,00/mês por prestador' },
  { nome: 'Filazero', preco: 'a partir de ~R$ 1.000,00/mês' },
];

export function Planos() {
  return (
    <section id="planos" className="py-20 sm:py-28">
      <div className="content-container">
        <div className="mx-auto max-w-2xl text-center">
          <EtiquetaSecao>Planos</EtiquetaSecao>
          <h2 className="mt-3 font-title text-3xl leading-tight font-bold text-foreground sm:text-4xl">
            Você paga pela capacidade, não por cabeça
          </h2>
          <p className="mt-4 text-lg text-muted">
            Contratar um profissional novo não aumenta a sua conta. Comece de graça e
            mude de plano quando a fila crescer.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANOS.map((plano) => (
            <article
              key={plano.id}
              className={cn(
                'relative flex flex-col gap-6 rounded-[12px] border bg-white p-7',
                plano.destaque
                  ? 'border-primary shadow-lg xl:-mt-4'
                  : 'border-border shadow-sm'
              )}
            >
              {plano.destaque ? (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  Mais escolhido
                </span>
              ) : null}

              <div className="flex flex-col gap-2">
                <h3 className="font-title text-xl font-bold text-foreground">
                  {plano.nome}
                </h3>
                <p className="min-h-15 text-sm text-muted">{plano.chamada}</p>
              </div>

              <p className="flex items-baseline gap-1.5">
                <span className="font-title text-4xl font-bold text-primary">
                  {plano.precoMensal === 0
                    ? 'Grátis'
                    : formatarMoeda(plano.precoMensal)}
                </span>
                {plano.precoMensal > 0 ? (
                  <span className="text-sm text-muted">/mês</span>
                ) : null}
              </p>

              <Link
                href={`/cadastro?plano=${plano.id}`}
                className={buttonClasses({
                  variante: plano.destaque ? 'primary' : 'secondary',
                  className: 'w-full',
                })}
              >
                {plano.precoMensal === 0 ? 'Começar grátis' : 'Escolher plano'}
              </Link>

              <ul className="flex flex-col gap-3">
                {plano.recursos.map((recurso) => (
                  <li key={recurso} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden
                    />
                    <span className="text-foreground">{recurso}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-auto flex items-start gap-2.5 border-t border-border pt-5 text-sm">
                <Headphones className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="text-foreground">{plano.suporte}</span>
              </p>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-[12px] border border-border bg-muted-bg p-7">
          <h3 className="font-title text-lg font-bold text-foreground">
            Como isso se compara ao mercado
          </h3>
          <p className="mt-2 text-sm text-muted">
            Preços públicos das soluções que disputam o mesmo orçamento, consultados em
            agosto de 2026.
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {COMPARATIVO.map((item) => (
              <li
                key={item.nome}
                className="flex items-center justify-between gap-4 rounded-[8px] bg-white px-4 py-3 text-sm"
              >
                <span className="text-muted">{item.nome}</span>
                <span className="text-right font-medium text-foreground">
                  {item.preco}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
