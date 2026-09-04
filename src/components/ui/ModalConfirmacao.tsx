'use client';

import { Button, type ButtonVariante } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export interface ModalConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  variante?: ButtonVariante;
  pendente?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

export function ModalConfirmacao({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar,
  variante = 'primary',
  pendente,
  aoConfirmar,
  aoCancelar,
}: ModalConfirmacaoProps) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      descricao={descricao}
      aoFechar={aoCancelar}
      className="max-w-md"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variante="secondary"
          onClick={aoCancelar}
          disabled={pendente}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variante={variante}
          onClick={aoConfirmar}
          disabled={pendente}
          className="w-full sm:w-auto"
        >
          {pendente ? 'Aguarde...' : rotuloConfirmar}
        </Button>
      </div>
    </Modal>
  );
}
