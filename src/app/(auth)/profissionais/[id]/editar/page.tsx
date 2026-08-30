// Edição de profissional
// Acesso: CLINICA
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

interface EditarProfissionalPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProfissionalPage({ params }: EditarProfissionalPageProps) {
  const { id } = await params;

  return (
    <TelaPlaceholder
      titulo="Editar Profissional"
      rota={`/profissionais/${id}/editar`}
    />
  );
}
