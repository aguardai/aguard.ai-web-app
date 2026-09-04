import { EntrarNaFilaForm } from '@/features/queue/components/EntrarNaFilaForm';

interface PaginaFilaProps {
  params: Promise<{ unidadeId: string }>;
}

export default async function PaginaFila({ params }: PaginaFilaProps) {
  const { unidadeId } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted-bg px-4 py-12">
      <div className="w-full max-w-md rounded-[12px] border border-border bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h1 className="font-title text-2xl font-bold text-foreground">
            Entrar na fila
          </h1>
          <p className="text-sm text-muted">
            Preencha seus dados para acompanhar sua posição em tempo real.
          </p>
        </div>

        <EntrarNaFilaForm unidadeId={unidadeId} />
      </div>
    </div>
  );
}
