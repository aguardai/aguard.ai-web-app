'use client';

import { useState, useTransition } from 'react';
import { Power, PowerOff } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { Button } from '@/components/ui/Button';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
import { alternarAtivaUnidadeAction } from '@/features/clinic/actions';

export interface AlternarAtivaUnidadeBotaoProps {
  id: string;
  nome: string;
  ativa: boolean;
  variante?: 'texto' | 'icone';
}

export function AlternarAtivaUnidadeBotao({
  id,
  nome,
  ativa,
  variante = 'texto',
}: AlternarAtivaUnidadeBotaoProps) {
  const [pendente, iniciarTransicao] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function confirmar() {
    iniciarTransicao(async () => {
      await alternarAtivaUnidadeAction(id, !ativa);
      setConfirmando(false);
    });
  }

  const rotulo = ativa ? 'Desativar' : 'Reativar';
  const Icone = ativa ? PowerOff : Power;

  return (
    <>
      {variante === 'icone' ? (
        <AcaoIcone rotulo={rotulo + ' ' + nome} onClick={() => setConfirmando(true)}>
          <Icone className="size-4" aria-hidden />
        </AcaoIcone>
      ) : (
        <Button
          type="button"
          variante="secondary"
          onClick={() => setConfirmando(true)}
          className="w-full sm:w-auto"
        >
          <Icone className="size-4" aria-hidden />
          {rotulo}
        </Button>
      )}

      <ModalConfirmacao
        aberto={confirmando}
        titulo={rotulo + ' unidade'}
        descricao={
          ativa
            ? nome +
              ' para de aceitar novas entradas na fila e some do QR Code público. Os guichês e as locações continuam cadastrados e a unidade pode ser reativada depois.'
            : nome + ' volta a aceitar entradas na fila e a aparecer para os pacientes.'
        }
        rotuloConfirmar={rotulo}
        pendente={pendente}
        aoConfirmar={confirmar}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
