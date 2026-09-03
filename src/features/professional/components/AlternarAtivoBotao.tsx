'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { alternarAtivoProfissional } from '@/features/professional/actions';

export interface AlternarAtivoBotaoProps {
  id: string;
  ativo: boolean;
}

export function AlternarAtivoBotao({ id, ativo }: AlternarAtivoBotaoProps) {
  const [pendente, iniciarTransicao] = useTransition();

  function alternar() {
    iniciarTransicao(async () => {
      await alternarAtivoProfissional(id, !ativo);
    });
  }

  return (
    <Button
      type="button"
      variante={ativo ? 'secondary' : 'primary'}
      tamanho="sm"
      onClick={alternar}
      disabled={pendente}
    >
      {pendente ? 'Atualizando...' : ativo ? 'Desativar' : 'Reativar'}
    </Button>
  );
}