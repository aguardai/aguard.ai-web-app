import { Alert } from '@/components/ui/Alert';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { listarHistorico } from '@/features/attendance/services/consulta';
import { HistoricoLista } from '@/features/attendance/components/HistoricoLista';

export const revalidate = 0;
export const metadata = { title: 'Histórico — Aguard.ai' };

export default async function HistoricoAtendimentoPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'profissional') {
    return (
      <div className="content-container flex flex-col gap-6 py-8">
        <Alert tom="info">Este painel é exclusivo para o papel Profissional.</Alert>
      </div>
    );
  }

  const consultas = await listarHistorico();

  return <HistoricoLista consultas={consultas} />;
}