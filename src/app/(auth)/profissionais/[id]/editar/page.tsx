// Edição de profissional
// Acesso: CLINICA
import { notFound, redirect } from 'next/navigation';

import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { ProfissionalForm } from '@/features/professional/components/ProfissionalForm';
import { buscarProfissionalPorId } from '@/features/professional/services/profissional';

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
    <div className="content-container flex max-w-3xl flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Editar profissional"
        descricao={profissional.nome}
        voltarPara={`/profissionais/${id}`}
        rotuloVoltar="Voltar ao profissional"
      />

      <section className="rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <ProfissionalForm profissional={profissional} />
      </section>
    </div>
  );
}
