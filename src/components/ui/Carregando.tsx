import { PulsoAtendimento } from '@/components/ui/PulsoAtendimento';

export interface CarregandoProps {
  rotulo?: string;
}

// Estado de carregamento das telas autenticadas, centralizado na área de conteúdo
export function Carregando({ rotulo = 'Carregando...' }: CarregandoProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-8"
    >
      <PulsoAtendimento tom="primary" />
      <p className="text-sm text-muted">{rotulo}</p>
    </div>
  );
}
