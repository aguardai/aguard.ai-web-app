// Acompanhamento da posição na fila — resolve sozinho o tipo de fila do ticket
// Acesso: público (link recebido ao entrar na fila)
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

interface AcompanharPageProps {
  params: Promise<{ ticketId: string }>;
}

export default async function AcompanharPage({ params }: AcompanharPageProps) {
  const { ticketId } = await params;

  return (
    <TelaPlaceholder
      titulo="Acompanhar fila"
      rota={`/acompanhar/${ticketId}`}
      detalhe="Posição, senha e tempo estimado de espera."
    />
  );
}
