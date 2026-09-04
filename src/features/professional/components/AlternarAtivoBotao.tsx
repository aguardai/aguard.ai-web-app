'use client';

import { useTransition } from 'react';
import { Power, PowerOff } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { Button } from '@/components/ui/Button';
import { alternarAtivoProfissional } from '@/features/professional/actions';

export interface AlternarAtivoBotaoProps {
  id: string;
  ativo: boolean;
  variante?: 'texto' | 'icone';
}

export function AlternarAtivoBotao({ id, ativo, variante = 'texto' }: AlternarAtivoBotaoProps) {
  const [pendente, iniciarTransicao] = useTransition();

  function alternar() {
    iniciarTransicao(async () => {
      await alternarAtivoProfissional(id, !ativo);
    });
  }

  const rotulo = ativo ? 'Desativar' : 'Reativar';
  const Icone = ativo ? PowerOff : Power;

  if (variante === 'icone') {
    return (
      <AcaoIcone rotulo={rotulo} onClick={alternar} disabled={pendente}>
        <Icone className="size-4" aria-hidden />
      </AcaoIcone>
    );
  }

  return (
    <Button
      type="button"
      variante="secondary"
      onClick={alternar}
      disabled={pendente}
      className="w-full sm:w-auto"
    >
      <Icone className="size-4" aria-hidden />
      {pendente ? 'Atualizando...' : rotulo}
    </Button>
  );
}
