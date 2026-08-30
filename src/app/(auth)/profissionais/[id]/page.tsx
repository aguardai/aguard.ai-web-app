// Visualização de profissional — dados, unidades e histórico
// Acesso: CLINICA, UNIDADE
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

interface VerProfissionalPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerProfissionalPage({ params }: VerProfissionalPageProps) {
  const { id } = await params;

  return (
    <TelaPlaceholder
      titulo="Ver Profissional"
      rota={`/profissionais/${id}`}
    />
  );
}
