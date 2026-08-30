export interface TelaPlaceholderProps {
  titulo: string;
  rota: string;
  detalhe?: string;
}

// Marcador das telas ainda não implementadas: identifica a rota no centro da área de conteúdo
export function TelaPlaceholder({ titulo, rota, detalhe }: TelaPlaceholderProps) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-20">
      <div className="text-center">
        <p className="font-mono text-sm text-muted">{rota}</p>
        <h1 className="mt-3 font-title text-3xl font-bold text-foreground sm:text-4xl">
          {titulo}
        </h1>
        {detalhe ? <p className="mt-3 text-muted">{detalhe}</p> : null}
      </div>
    </div>
  );
}
