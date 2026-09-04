'use client';

import { useState, useTransition } from 'react';
import { Power, PowerOff } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { Button } from '@/components/ui/Button';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
import { alternarAtivoProfissional } from '@/features/professional/actions';

export interface AlternarAtivoBotaoProps {
  id: string;
  nome: string;
  ativo: boolean;
  variante?: 'texto' | 'icone';
}

export function AlternarAtivoBotao({
  id,
  nome,
  ativo,
  variante = 'texto',
}: AlternarAtivoBotaoProps) {
  const [pendente, iniciarTransicao] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function confirmar() {
    iniciarTransicao(async () => {
      await alternarAtivoProfissional(id, !ativo);
      setConfirmando(false);
    });
  }

  const rotulo = ativo ? 'Desativar' : 'Reativar';
  const Icone = ativo ? PowerOff : Power;

  return (
    <>
      {variante === 'icone' ? (
        <AcaoIcone rotulo={`${rotulo} ${nome}`} onClick={() => setConfirmando(true)}>
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
        titulo={`${rotulo} profissional`}
        descricao={
          ativo
            ? `${nome} sai das filas e das listagens de escala. O histórico é preservado e o cadastro pode ser reativado depois.`
            : `${nome} volta a aparecer nas filas e nas listagens de escala.`
        }
        rotuloConfirmar={rotulo}
        pendente={pendente}
        aoConfirmar={confirmar}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
