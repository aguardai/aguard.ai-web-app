// Layout compartilhado para rotas autenticadas (dashboard, gestão, atendimento).
// O header fica fixo no topo e o scroll acontece dentro da área de conteúdo.
import type { Role } from '@/constants/routes';
import { AppHeader } from '@/features/auth/components/AppHeader';
import { resolverClinicaPendente } from '@/features/auth/services/cadastro';
import {
  cadastroEmAndamento,
  exigirPerfil,
  rotaPorPapel,
} from '@/features/auth/services/sessao';
import type { PapelUsuario } from '@/features/auth/types';
import { Logo } from '@/components/ui/Logo';
import { PularParaConteudo } from '@/components/ui/PularParaConteudo';
import { Button } from '@/components/ui/Button';
import { sair } from '@/features/auth/actions';
import { LogOut, RefreshCw } from 'lucide-react';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

const PAPEL_PARA_ROLE: Record<PapelUsuario, Role> = {
  clinica: 'CLINICA',
  unidade: 'UNIDADE',
  profissional: 'PROFISSIONAL',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await exigirPerfil();
  const donoSemClinica = cadastroEmAndamento(perfil);

  if (donoSemClinica) {
    const supabase = await createClient();
    const resolucao = await resolverClinicaPendente(supabase, perfil.id);

    if (resolucao === 'pagamento_pendente') redirect('/pagamento-pendente');
    if (resolucao === 'criada') redirect(rotaPorPapel(perfil.papel));
  }

  if (!perfil.clinica_id) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[var(--color-muted-bg)] px-5 py-10">
        <div className="flex max-w-md flex-col items-center text-center">
          <Logo tamanho={48} className="mb-5" />

          <h1 className="font-title text-2xl font-bold text-foreground">
            {donoSemClinica ? 'Não conseguimos criar sua clínica' : 'Conta aguardando vínculo'}
          </h1>
          <p className="mt-3 text-muted">
            {donoSemClinica
              ? 'Sua conta existe, mas a clínica não foi criada. Tente novamente em instantes.'
              : 'Sua conta ainda não está ligada a uma clínica. Peça ao administrador para liberar seu acesso e tente novamente.'}
          </p>

          <div className="mt-8 w-full flex flex-col gap-3 sm:flex-row sm:justify-center">
            <form>
              <Button
                type="submit"
                className="w-full"
                formAction={async () => {
                  'use server';
                  const { revalidatePath } = await import('next/cache');
                  revalidatePath('/', 'layout');
                }}
              >
                <RefreshCw className="size-4" aria-hidden />
                Tentar novamente
              </Button>
            </form>

            <form action={sair}>
              <Button type="submit" className="w-full" variante="danger">
                <LogOut className="size-4" aria-hidden />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <PularParaConteudo />
      <AppHeader
        nome={perfil.nome}
        papel={PAPEL_PARA_ROLE[perfil.papel]}
        rotaInicial={rotaPorPapel(perfil.papel)}
        painelUnidadeId={perfil.papel === 'unidade' ? perfil.unidade_id : null}
      />

      <main id="conteudo" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
        {children}
      </main>
    </div>
  );
}

