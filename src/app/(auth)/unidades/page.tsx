// Lista de unidades da clínica
// Acesso: CLINICA, UNIDADE
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { PaginacaoLinks } from '@/components/ui/PaginacaoLinks';
import { ITENS_POR_PAGINA, paginaDaBusca } from '@/constants/paginacao';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { UnidadeTabela } from '@/features/clinic/components/UnidadeTabela';
import { contarUnidades, listarUnidadesPaginado } from '@/features/clinic/services/unidade';
import { formatarNumero } from '@/lib/utils';

export const metadata = { title: 'Unidades — Aguard.ai' };

interface PaginaProps {
  searchParams: Promise<{ pagina?: string }>;
}

export default async function UnidadesPage({ searchParams }: PaginaProps) {
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const pagina = paginaDaBusca((await searchParams).pagina);
  const podeGerenciar = perfil.papel === 'clinica';

  const [lista, contagem] = await Promise.all([
    listarUnidadesPaginado(pagina),
    contarUnidades(),
  ]);

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Unidades"
        descricao={`${formatarNumero(contagem.total)} cadastradas · ${formatarNumero(contagem.ativas)} ativas`}
        acoes={
          podeGerenciar ? (
            <Link
              href="/unidades/nova"
              className={buttonClasses({ className: 'w-full sm:w-auto' })}
            >
              <Plus className="size-4" aria-hidden />
              Nova unidade
            </Link>
          ) : null
        }
      />

      <UnidadeTabela unidades={lista.itens} podeGerenciar={podeGerenciar} />

      <PaginacaoLinks
        pagina={pagina}
        porPagina={ITENS_POR_PAGINA}
        total={lista.total}
        hrefDaPagina={(destino) => '/unidades?pagina=' + destino}
      />
    </div>
  );
}
