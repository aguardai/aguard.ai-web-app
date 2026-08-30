import Link from 'next/link';

import { BolhasFundo } from '@/components/ui/BolhasFundo';
import { Logo } from '@/components/ui/Logo';
import { MotionAtendimento } from '@/features/auth/components/MotionAtendimento';

export interface AuthShellProps {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}

export function AuthShell({ titulo, descricao, children }: AuthShellProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-primary to-primary-light">
      <BolhasFundo />

      <div className="content-container relative flex min-h-dvh items-center justify-center py-10">
        <div className="grid w-full overflow-hidden rounded-[12px] bg-background shadow-2xl lg:grid-cols-2">
          <aside className="hidden flex-col items-center justify-center gap-12 bg-gradient-to-br from-primary to-primary-light p-12 text-white lg:flex">
            <MotionAtendimento />

            <p className="max-w-sm text-center font-title text-3xl leading-tight font-bold">
              A sala de espera da sua clínica cabe no celular do paciente.
            </p>
          </aside>

          <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
            <Link
              href="/"
              aria-label="Aguard.ai — início"
              className="mb-10 self-center"
            >
              <Logo tamanho={36} prioridade />
            </Link>

            <h1 className="font-title text-2xl font-bold text-foreground sm:text-3xl">
              {titulo}
            </h1>
            <p className="mt-2 mb-8 text-muted">{descricao}</p>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
