// Listagem de profissionais da clínica
// Acesso: CLINICA, UNIDADE
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { ProfissionalTabela } from '@/features/professional/components/ProfissionalTabela';
import { listarProfissionais } from '@/features/professional/services/profissional';
import { formatarNumero } from '@/lib/utils';

export const metadata = { title: 'Profissionais — Aguard.ai' };

export default async function ProfissionaisPage() {
  const perfil = await exigirPerfil();
  const profissionais = await listarProfissionais();

  // Só a clínica cadastra profissionais — unidade e profissional só visualizam
  const podeGerenciar = perfil.papel === 'clinica';

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Profissionais"
        descricao={`${formatarNumero(profissionais.length)} ${
          profissionais.length === 1 ? 'profissional cadastrado' : 'profissionais cadastrados'
        }`}
        acoes={
          podeGerenciar ? (
            <Link href="/profissionais/novo" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden />
              Novo profissional
            </Link>
          ) : null
        }
      />

      <ProfissionalTabela profissionais={profissionais} podeGerenciar={podeGerenciar} />
    </div>
  );
}
