'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { excluirProfissional } from '@/features/professional/actions';

export interface RemoverProfissionalBotaoProps {
  id: string;
  nome: string;
}

export function RemoverProfissionalBotao({ id, nome }: RemoverProfissionalBotaoProps) {
  const [pendente, iniciarTransicao] = useTransition();

  function remover() {
    // TODO: trocar por um Dialog de confirmação do design system, se houver um
    const confirmado = window.confirm(
      `Remover ${nome}? O histórico de atendimentos é preservado, mas o cadastro sai das listagens.`
    );

    if (!confirmado) return;

    iniciarTransicao(async () => {
      await excluirProfissional(id);
    });
  }

  return (
    <Button type="button" variante="danger" tamanho="sm" onClick={remover} disabled={pendente}>
      <Trash2 className="size-4" aria-hidden />
      {pendente ? 'Removendo...' : 'Remover'}
    </Button>
  );
}