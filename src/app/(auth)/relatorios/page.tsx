// Relatórios de volume, espera e perdas
// Acesso: CLINICA, UNIDADE
import { redirect } from 'next/navigation';

import { exigirPerfil } from '@/features/auth/services/sessao';
import { listarUnidades } from '@/features/clinic/services/guiche';
import { ReportsPanelClient } from '@/features/reports/components/ReportsPanelClient';
import { buscarKpis, buscarSerieDiaria } from '@/features/reports/services/relatorios';

export const metadata = { title: 'Relatórios — Aguard.ai' };
export const revalidate = 0;

const TODAS = 'todas';

interface PaginaProps {
  searchParams: Promise<{ unidade?: string }>;
}

export default async function RelatoriosPage({ searchParams }: PaginaProps) {
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const unidadeId = (await searchParams).unidade ?? TODAS;
  const recorte = unidadeId === TODAS ? undefined : unidadeId;

  const [kpis, serieDiaria, unidades] = await Promise.all([
    buscarKpis(perfil, recorte),
    buscarSerieDiaria(perfil, recorte),
    listarUnidades(),
  ]);

  return (
    <ReportsPanelClient
      kpis={kpis}
      serieDiaria={serieDiaria}
      unidades={unidades}
      unidadeId={unidadeId}
      podeFiltrar={perfil.papel === 'clinica'}
    />
  );
}
