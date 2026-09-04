import { redirect } from 'next/navigation';

import { exigirPerfil } from '@/features/auth/services/sessao';
import { buscarKpis, buscarSerieDiaria } from '@/features/reports/services/relatorios';
import { ReportsPanelClient } from '@/features/reports/components/ReportsPanelClient';

export const revalidate = 0;

export default async function RelatoriosPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const [kpis, serieDiaria] = await Promise.all([
    buscarKpis(perfil),
    buscarSerieDiaria(perfil),
  ]);

  return <ReportsPanelClient kpis={kpis} serieDiaria={serieDiaria} />;
}
