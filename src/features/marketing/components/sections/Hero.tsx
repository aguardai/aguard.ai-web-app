import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { BolhasFundo } from '@/components/ui/BolhasFundo';
import { buttonClasses } from '@/components/ui/Button';
import { ChamandoAgora } from '@/features/marketing/components/ui/ChamandoAgora';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-light text-white">
      <BolhasFundo />

      <div className="content-container relative grid gap-14 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
          <h1 className="font-title text-4xl leading-[1.1] font-bold sm:text-5xl lg:text-[3.4rem]">
            Sua sala de espera cabe no celular do paciente
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-white/85">
            O paciente entra na fila por QR Code, acompanha a posição em tempo real e
            chega na hora de ser atendido. A recepção chama, encaminha para o
            profissional e você vê tudo em um painel só.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/cadastro"
              className={buttonClasses({
                variante: 'secondary',
                tamanho: 'lg',
                className: 'w-full sm:w-auto',
              })}
            >
              Criar conta grátis
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="#planos"
              className={buttonClasses({
                variante: 'ghost',
                tamanho: 'lg',
                className:
                  'w-full border border-white/40 text-white hover:bg-white/10 sm:w-auto',
              })}
            >
              Ver planos
            </Link>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-sm lg:block">
          <div className="rounded-[12px] bg-white p-6 shadow-2xl">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              Sua senha
            </p>
            <p className="font-title text-5xl font-bold text-primary">REC-042</p>

            <div className="my-5 h-px bg-border" />

            <dl className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted">Posição na fila</dt>
                <dd className="text-sm font-semibold text-foreground">3º</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted">Espera estimada</dt>
                <dd className="text-sm font-semibold text-foreground">18 min</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted">Fila</dt>
                <dd className="text-sm font-semibold text-foreground">Recepção</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-[8px] bg-muted-bg px-4 py-3">
              <p className="text-xs text-muted">Depois da recepção</p>
              <p className="text-sm font-medium text-foreground">
                Você vai para a fila do profissional automaticamente
              </p>
            </div>
          </div>

          <ChamandoAgora />
        </div>
      </div>
    </section>
  );
}
