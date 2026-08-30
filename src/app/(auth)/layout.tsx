// Layout compartilhado para rotas autenticadas (dashboard, gestão, atendimento).
import { exigirPerfil } from '@/features/auth/services/sessao';

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

  return <>{children}</>;
}
