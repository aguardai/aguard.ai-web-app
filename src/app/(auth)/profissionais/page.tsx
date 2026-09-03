import Link from 'next/link';
import { Plus } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { listarProfissionais } from '@/features/professional/services/profissional';
import { ProfissionalTabela } from '@/features/professional/components/ProfissionalTabela';

export const metadata = { title: 'Profissionais — Aguard.ai' };

export default async function ProfissionaisPage() {
  const perfil = await exigirPerfil();
  const profissionais = await listarProfissionais();

  // Só a clínica cadastra profissionais — unidade e profissional só visualizam
  const podeGerenciar = perfil.papel === 'clinica';

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-2xl font-bold text-foreground">Profissionais</h1>
          <p className="text-sm text-muted">
            {profissionais.length}{' '}
            {profissionais.length === 1 ? 'profissional cadastrado' : 'profissionais cadastrados'}
          </p>
        </div>

        {podeGerenciar ? (
          <Link href="/profissionais/novo" className={buttonClasses({ tamanho: 'lg' })}>
            <Plus className="size-4" aria-hidden />
            Novo profissional
          </Link>
        ) : null}
      </div>

      <ProfissionalTabela profissionais={profissionais} />
    </div>
  );
}