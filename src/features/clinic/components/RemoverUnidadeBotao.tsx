'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { Button } from '@/components/ui/Button';
import { ModalConfirmacao } from '@/components/ui/ModalConfirmacao';
import { excluirUnidade } from '@/features/clinic/actions';

export interface RemoverUnidadeBotaoProps {
  id: string;
  nome: string;
  variante?: 'texto' | 'icone';
}

export function RemoverUnidadeBotao({
  id,
  nome,
  variante = 'texto',
}: RemoverUnidadeBotaoProps) {
  const [pendente, iniciarTransicao] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function confirmar() {
    iniciarTransicao(async () => {
      await excluirUnidade(id);
      setConfirmando(false);
    });
  }

  return (
    <>
      {variante === 'icone' ? (
        <AcaoIcone
          rotulo={'Remover ' + nome}
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
        titulo="Remover unidade"
        descricao={
          nome +
          ' sai das listagens junto com os guichês e as locações dela, e a vaga volta para a cota do plano. O histórico de atendimentos é preservado. Para só pausar a unidade, use Desativar.'
        }
        rotuloConfirmar="Remover"
        variante="danger"
        pendente={pendente}
        aoConfirmar={confirmar}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
