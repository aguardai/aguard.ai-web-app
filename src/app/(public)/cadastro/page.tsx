import type { Metadata } from 'next';

import { ehPlanoValido } from '@/constants/planos';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { CadastroForm } from '@/features/auth/components/CadastroForm';
import { redirecionarSeAutenticado } from '@/features/auth/services/sessao';

export const metadata: Metadata = {
  title: 'Criar conta | Aguard.ai',
  description: 'Cadastre sua clínica e comece a organizar a fila em minutos.',
};

interface CadastroPageProps {
  searchParams: Promise<{ plano?: string }>;
}

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  await redirecionarSeAutenticado();

  const { plano } = await searchParams;
  const planoInicial = ehPlanoValido(plano) ? plano : 'starter';

  return (
    <AuthShell
      titulo="Criar conta da clínica"
      descricao="Você cria a clínica e depois libera acesso para as unidades e profissionais."
    >
      <CadastroForm planoInicial={planoInicial} />
    </AuthShell>
  );
}
