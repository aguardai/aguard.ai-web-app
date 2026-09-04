import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { acaoIconeClasses } from '@/components/ui/AcaoIcone';

export interface CabecalhoPaginaProps {
  titulo: string;
  descricao?: string;
  voltarPara?: string;
  rotuloVoltar?: string;
  acoes?: React.ReactNode;
}

// Cabeçalho padrão das telas autenticadas: a seta de voltar fica à esquerda do
// bloco de título e descrição, e as ações à direita
export function CabecalhoPagina({
  titulo,
  descricao,
  voltarPara,
  rotuloVoltar = 'Voltar',
  acoes,
}: CabecalhoPaginaProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {voltarPara ? (
          <Link
            href={voltarPara}
            aria-label={rotuloVoltar}
            title={rotuloVoltar}
            className={acaoIconeClasses('neutro', 'shrink-0')}
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        ) : null}

        <div className="min-w-0">
          <h1 className="font-title text-2xl font-bold text-foreground">{titulo}</h1>
          {descricao ? <p className="text-sm text-muted">{descricao}</p> : null}
        </div>
      </div>

      {acoes ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">{acoes}</div>
      ) : null}
    </header>
  );
}
