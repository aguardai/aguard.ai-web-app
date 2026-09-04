// Listagem de profissionais da clínica
// Acesso: CLINICA, UNIDADE
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { PaginacaoLinks } from '@/components/ui/PaginacaoLinks';
import { ITENS_POR_PAGINA, paginaDaBusca } from '@/constants/paginacao';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { ProfissionalTabela } from '@/features/professional/components/ProfissionalTabela';
import { listarProfissionaisPaginado } from '@/features/professional/services/profissional';
import { formatarNumero } from '@/lib/utils';

export const metadata = { title: 'Profissionais — Aguard.ai' };

interface PaginaProps {
  searchParams: Promise<{ pagina?: string }>;
}

export default async function ProfissionaisPage({ searchParams }: PaginaProps) {
  const perfil = await exigirPerfil();
  const pagina = paginaDaBusca((await searchParams).pagina);
  const { itens, total } = await listarProfissionaisPaginado(pagina);

  // Só a clínica cadastra profissionais — unidade e profissional só visualizam
  const podeGerenciar = perfil.papel === 'clinica';

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Profissionais"
        descricao={`${formatarNumero(total)} ${
          total === 1 ? 'profissional cadastrado' : 'profissionais cadastrados'
        }`}
        acoes={
          podeGerenciar ? (
            <Link
              href="/profissionais/novo"
              className={buttonClasses({ className: 'w-full sm:w-auto' })}
            >
              <Plus className="size-4" aria-hidden />
              Novo profissional
            </Link>
          ) : null
        }
      />

      <ProfissionalTabela profissionais={itens} podeGerenciar={podeGerenciar} />

      <PaginacaoLinks
        pagina={pagina}
        porPagina={ITENS_POR_PAGINA}
        total={total}
        hrefDaPagina={(destino) => `/profissionais?pagina=${destino}`}
      />
    </div>
  );
}
