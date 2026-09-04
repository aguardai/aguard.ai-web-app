'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { Button } from '@/components/ui/Button';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
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
  const [confirmando, setConfirmando] = useState(false);

  function confirmar() {
    iniciarTransicao(async () => {
      await excluirProfissional(id);
      setConfirmando(false);
    });
  }

  return (
    <>
      {variante === 'icone' ? (
        <AcaoIcone
          rotulo={`Remover ${nome}`}
          tom="perigo"
          onClick={() => setConfirmando(true)}
        >
          <Trash2 className="size-4" aria-hidden />
        </AcaoIcone>
      ) : (
        <Button
          type="button"
          variante="danger"
          onClick={() => setConfirmando(true)}
          className="w-full sm:w-auto"
        >
          <Trash2 className="size-4" aria-hidden />
          Remover
        </Button>
      )}

      <ModalConfirmacao
        aberto={confirmando}
        titulo="Remover profissional"
        descricao={`${nome} sai das listagens. O histórico de atendimentos é preservado.`}
        rotuloConfirmar="Remover"
        variante="danger"
        pendente={pendente}
        aoConfirmar={confirmar}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
