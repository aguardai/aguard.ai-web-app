// Entrada na fila virtual da Unidade — Paciente preenche dados e entra na fila compartilhada
// Acesso: público (via link ou QR Code da unidade)
// É chamado pelo primeiro guichê que ficar livre; o encaminhamento para a consulta é automático
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

interface FilaUnidadePageProps {
  params: Promise<{ unidadeId: string }>;
}

export default async function FilaUnidadePage({ params }: FilaUnidadePageProps) {
  const { unidadeId } = await params;

  return (
    <TelaPlaceholder
      titulo="Entrar na fila"
      rota={`/fila/${unidadeId}`}
      detalhe="Entrada do paciente na fila compartilhada da unidade."
    />
  );
}
