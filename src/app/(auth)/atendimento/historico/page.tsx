// Histórico de consultas do profissional
// Acesso: PROFISSIONAL
import { Alert } from '@/components/ui/Alert';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { PaginacaoLinks } from '@/components/ui/PaginacaoLinks';
import { ITENS_POR_PAGINA, paginaDaBusca } from '@/constants/paginacao';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { FiltroHistorico } from '@/features/attendance/components/FiltroHistorico';
import { HistoricoLista } from '@/features/attendance/components/HistoricoLista';
import { listarHistoricoPaginado } from '@/features/attendance/services/consulta';

export const revalidate = 0;
export const metadata = { title: 'Histórico — Aguard.ai' };

interface PaginaProps {
  searchParams: Promise<{ pagina?: string; busca?: string }>;
}

export default async function HistoricoAtendimentoPage({ searchParams }: PaginaProps) {
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'profissional') {
    return (
      <div className="content-container flex flex-col gap-6 py-8">
        <Alert tom="info">Este painel é exclusivo para o papel Profissional.</Alert>
      </div>
    );
  }

  const parametros = await searchParams;
  const pagina = paginaDaBusca(parametros.pagina);
  const busca = parametros.busca ?? '';

  const lista = await listarHistoricoPaginado(pagina, busca);

  function hrefDaPagina(destino: number) {
    const parametrosDaUrl = new URLSearchParams({ pagina: String(destino) });

    if (busca) {
      parametrosDaUrl.set('busca', busca);
    }

    return '/atendimento/historico?' + parametrosDaUrl.toString();
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Histórico"
        descricao="Consultas registradas por você."
        voltarPara="/atendimento"
        rotuloVoltar="Minha fila"
      />

      <FiltroHistorico busca={busca} />

      <HistoricoLista consultas={lista.itens} temBusca={Boolean(busca)} />

      <PaginacaoLinks
        pagina={pagina}
        porPagina={ITENS_POR_PAGINA}
        total={lista.total}
        hrefDaPagina={hrefDaPagina}
      />
    </div>
  );
}
