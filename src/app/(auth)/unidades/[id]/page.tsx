// Visualização de unidade — dados da unidade e guichês vinculados
// Acesso: CLINICA
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

interface VerUnidadePageProps {
  params: Promise<{ id: string }>;
}

export default async function VerUnidadePage({ params }: VerUnidadePageProps) {
  const { id } = await params;

  return (
    <TelaPlaceholder
      titulo="Ver Unidade"
      rota={`/unidades/${id}`}
    />
  );
}
