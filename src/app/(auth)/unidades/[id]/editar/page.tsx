// Edição de unidade
// Acesso: CLINICA
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

interface EditarUnidadePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarUnidadePage({ params }: EditarUnidadePageProps) {
  const { id } = await params;

  return (
    <TelaPlaceholder
      titulo="Editar Unidade"
      rota={`/unidades/${id}/editar`}
    />
  );
}
