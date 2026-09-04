// Gestão de guichês das unidades
// Acesso: CLINICA, UNIDADE
import { redirect } from 'next/navigation';

import { PaginacaoLinks } from '@/components/ui/PaginacaoLinks';
import { ITENS_POR_PAGINA, paginaDaBusca } from '@/constants/paginacao';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { GuichesGestao } from '@/features/clinic/components/GuichesGestao';
import {
  contarGuiches,
  listarGuiches,
  listarUnidades,
} from '@/features/clinic/services/guiche';

export const metadata = { title: 'Guichês — Aguard.ai' };

interface PaginaProps {
  searchParams: Promise<{ pagina?: string }>;
}

export default async function GuichesPage({ searchParams }: PaginaProps) {
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const pagina = paginaDaBusca((await searchParams).pagina);

  const [lista, unidades, contagem] = await Promise.all([
    listarGuiches(pagina),
    listarUnidades(),
    contarGuiches(),
  ]);

  return (
    <GuichesGestao
      guiches={lista.itens}
      unidades={unidades}
      podeGerenciar
      total={contagem.total}
      ativos={contagem.ativos}
      paginacao={
        <PaginacaoLinks
          pagina={pagina}
          porPagina={ITENS_POR_PAGINA}
          total={lista.total}
          hrefDaPagina={(destino) => '/guiches?pagina=' + destino}
        />
      }
    />
  );
}
