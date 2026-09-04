import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface CabecalhoPaginaProps {
  titulo: string;
  descricao?: string;
  voltarPara?: string;
  rotuloVoltar?: string;
  acoes?: React.ReactNode;
}

// Cabeçalho padrão das telas autenticadas: título, apoio e ações à direita
export function CabecalhoPagina({
  titulo,
  descricao,
  voltarPara,
  rotuloVoltar = 'Voltar',
  acoes,
}: CabecalhoPaginaProps) {
  return (
    <header className="flex flex-col gap-3">
      {voltarPara ? (
        <Link
          href={voltarPara}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {rotuloVoltar}
        </Link>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-title text-2xl font-bold text-foreground">{titulo}</h1>
          {descricao ? <p className="text-sm text-muted">{descricao}</p> : null}
        </div>

        {acoes ? <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div> : null}
      </div>
    </header>
  );
}
