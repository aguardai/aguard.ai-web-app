import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { redirecionarSeAutenticado } from '@/features/auth/services/sessao';

export const metadata: Metadata = {
  title: 'Entrar | Aguard.ai',
  description: 'Acesse o painel da sua clínica, unidade ou agenda de atendimento.',
};

export default async function LoginPage() {
  await redirecionarSeAutenticado();

  return (
    <AuthShell
      titulo="Entrar"
      descricao="Acesse o painel da sua clínica, da sua unidade ou a sua fila de atendimento."
    >
      <LoginForm />
    </AuthShell>
  );
}
