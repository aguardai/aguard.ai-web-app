import { notFound, redirect } from 'next/navigation';

import { exigirPerfil } from '@/features/auth/services/sessao';
import { buscarProfissionalPorId } from '@/features/professional/services/profissional';
import { ProfissionalForm } from '@/features/professional/components/ProfissionalForm';

export const metadata = { title: 'Editar profissional — Aguard.ai' };

interface PaginaProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProfissionalPage({ params }: PaginaProps) {
  const { id } = await params;
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'clinica') {
    redirect(`/profissionais/${id}`);
  }

  const profissional = await buscarProfissionalPorId(id);

  if (!profissional) {
    notFound();
  }

  return (
    <div className="content-container flex max-w-2xl flex-col gap-6 py-8">
      <div>
        <h1 className="font-title text-2xl font-bold text-foreground">Editar profissional</h1>
        <p className="text-sm text-muted">{profissional.nome}</p>
      </div>

      <ProfissionalForm profissional={profissional} />
    </div>
  );
}