import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { EntrarNaFilaForm } from '@/features/queue/components/EntrarNaFilaForm';

export const metadata: Metadata = {
  title: 'Entrar na fila | Aguard.ai',
  description: 'Entre na fila da unidade e acompanhe sua posição pelo celular.',
};

interface PaginaFilaProps {
  params: Promise<{ unidadeId: string }>;
}

export default async function PaginaFila({ params }: PaginaFilaProps) {
  const { unidadeId } = await params;

  return (
    <AuthShell
      titulo="Entrar na fila"
      descricao="Preencha seus dados para acompanhar sua posição em tempo real."
      frase="Pegue sua senha agora e espere onde você quiser."
    >
      <EntrarNaFilaForm unidadeId={unidadeId} />
    </AuthShell>
  );
}
