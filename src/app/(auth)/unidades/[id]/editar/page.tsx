// Edição de unidade
// Acesso: CLINICA
import { notFound, redirect } from 'next/navigation';

import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { UnidadeForm } from '@/features/clinic/components/UnidadeForm';
import { buscarUnidadePorId } from '@/features/clinic/services/unidade';

export const metadata = { title: 'Editar unidade — Aguard.ai' };

interface PaginaProps {
  params: Promise<{ id: string }>;
}

export default async function EditarUnidadePage({ params }: PaginaProps) {
  const { id } = await params;
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'clinica') {
    redirect(`/unidades/${id}`);
  }

  const unidade = await buscarUnidadePorId(id);

  if (!unidade) {
    notFound();
  }

  return (
    <div className="content-container flex max-w-3xl flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Editar unidade"
        descricao={unidade.nome}
        voltarPara={`/unidades/${id}`}
        rotuloVoltar="Voltar à unidade"
      />

      <section className="rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <UnidadeForm unidade={unidade} />
      </section>
    </div>
  );
}
