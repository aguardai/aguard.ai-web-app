'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { Button } from '@/components/ui/Button';
import { excluirProfissional } from '@/features/professional/actions';

export interface RemoverProfissionalBotaoProps {
  id: string;
  nome: string;
  variante?: 'texto' | 'icone';
}

export function RemoverProfissionalBotao({
  id,
  nome,
  variante = 'texto',
}: RemoverProfissionalBotaoProps) {
  const [pendente, iniciarTransicao] = useTransition();

  function remover() {
    const confirmado = window.confirm(
      `Remover ${nome}? O histórico de atendimentos é preservado, mas o cadastro sai das listagens.`
    );

    if (!confirmado) return;

    iniciarTransicao(async () => {
      await excluirProfissional(id);
    });
  }

  if (variante === 'icone') {
    return (
      <AcaoIcone rotulo={`Remover ${nome}`} tom="perigo" onClick={remover} disabled={pendente}>
        <Trash2 className="size-4" aria-hidden />
      </AcaoIcone>
    );
  }

  return (
    <Button
      type="button"
      variante="danger"
      onClick={remover}
      disabled={pendente}
      className="w-full sm:w-auto"
    >
      <Trash2 className="size-4" aria-hidden />
      {pendente ? 'Removendo...' : 'Remover'}
    </Button>
  );
}
