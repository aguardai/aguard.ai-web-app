// Layout compartilhado para rotas autenticadas (dashboard, gestão, atendimento).
// O header fica fixo no topo e o scroll acontece dentro da área de conteúdo.
import type { Role } from '@/constants/routes';
import { AppHeader } from '@/features/auth/components/AppHeader';
import { exigirPerfil, rotaPorPapel } from '@/features/auth/services/sessao';
import type { PapelUsuario } from '@/features/auth/types';

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

  if (!perfil.clinica_id) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5">
        <div className="max-w-md text-center">
          <h1 className="font-title text-2xl font-bold text-foreground">
            Conta aguardando vínculo
          </h1>
          <p className="mt-3 text-muted">
            Sua conta ainda não está ligada a uma clínica. Peça ao administrador
            para liberar seu acesso e entre novamente.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        nome={perfil.nome}
        papel={PAPEL_PARA_ROLE[perfil.papel]}
        rotaInicial={rotaPorPapel(perfil.papel)}
      />

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
