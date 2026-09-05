'use client';

import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export interface TelaErroProps {
  titulo?: string;
  descricao?: string;
  aoTentarNovamente: () => void;
}

// Conteúdo dos error boundaries: mensagem amigável e um caminho de volta.
// Nunca expõe a mensagem original, que pode carregar detalhe técnico
export function TelaErro({
  titulo = 'Algo deu errado por aqui',
  descricao = 'Não conseguimos carregar esta tela. Verifique sua conexão e tente novamente.',
  aoTentarNovamente,
}: TelaErroProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-danger/10">
        <TriangleAlert className="size-7 text-danger" aria-hidden />
      </span>

      <div className="flex flex-col gap-1">
        <h1 className="font-title text-xl font-bold text-foreground">{titulo}</h1>
        <p className="max-w-md text-sm text-muted">{descricao}</p>
      </div>

      <Button type="button" onClick={aoTentarNovamente}>
        Tentar novamente
      </Button>
    </div>
  );
}
