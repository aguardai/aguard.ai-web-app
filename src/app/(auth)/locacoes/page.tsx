// Gestão de locações — vínculo dos profissionais com as unidades
// Acesso: CLINICA
import { redirect } from 'next/navigation';

import { PaginacaoLinks } from '@/components/ui/PaginacaoLinks';
import { ITENS_POR_PAGINA, paginaDaBusca } from '@/constants/paginacao';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { listarUnidades } from '@/features/clinic/services/guiche';
import { LocacoesGestao } from '@/features/professional/components/LocacoesGestao';
import {
  contarLocacoes,
  listarLocacoes,
  type SituacaoLocacao,
} from '@/features/professional/services/locacao';
import { listarProfissionais } from '@/features/professional/services/profissional';

export const metadata = { title: 'Locações — Aguard.ai' };

const SITUACOES: SituacaoLocacao[] = ['todas', 'vigentes', 'encerradas'];

interface PaginaProps {
  searchParams: Promise<{ pagina?: string; unidade?: string; situacao?: string }>;
}

export default async function LocacoesPage({ searchParams }: PaginaProps) {
  const perfil = await exigirPerfil();

  // Só a administração da clínica cria e encerra vínculos (RLS locacao_*_admin_clinica)
  if (perfil.papel !== 'clinica') {
    redirect('/dashboard');
  }

  const busca = await searchParams;
  const pagina = paginaDaBusca(busca.pagina);
  const unidadeId = busca.unidade ?? 'todas';

  const situacao = SITUACOES.includes(busca.situacao as SituacaoLocacao)
    ? (busca.situacao as SituacaoLocacao)
    : 'todas';

  const [lista, profissionais, unidades, contagem] = await Promise.all([
    listarLocacoes({
      unidadeId: unidadeId === 'todas' ? undefined : unidadeId,
      situacao,
      pagina,
    }),
    listarProfissionais(),
    listarUnidades(),
    contarLocacoes(),
  ]);

  const filtros = new URLSearchParams({ unidade: unidadeId, situacao });

  return (
    <LocacoesGestao
      locacoes={lista.itens}
      profissionais={profissionais.filter((profissional) => profissional.ativo)}
      unidades={unidades}
      podeGerenciar
      total={contagem.total}
      vigentes={contagem.vigentes}
      unidadeId={unidadeId}
      situacao={situacao}
      paginacao={
        <PaginacaoLinks
          pagina={pagina}
          porPagina={ITENS_POR_PAGINA}
          total={lista.total}
          hrefDaPagina={(destino) =>
            '/locacoes?' + filtros.toString() + '&pagina=' + destino
          }
        />
      }
    />
  );
}
