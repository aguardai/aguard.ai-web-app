'use client';

import { useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import type { ProfissionalDaRecepcao } from '@/features/attendance/types';

export interface ModalEncaminharConsultaProps {
  aberto: boolean;
  senha: string | null;
  paciente: string | null;
  profissionais: ProfissionalDaRecepcao[];
  pendente: boolean;
  aoConfirmar: (profissionalId: string | null) => void;
  aoFechar: () => void;
}

function rotularProfissional(profissional: ProfissionalDaRecepcao): string {
  return profissional.especialidade
    ? profissional.nome + ' — ' + profissional.especialidade
    : profissional.nome;
}

// Escolha do profissional que recebe o paciente na Fila 2 ao encerrar o
// atendimento do guichê
export function ModalEncaminharConsulta({
  aberto,
  senha,
  paciente,
  profissionais,
  pendente,
  aoConfirmar,
  aoFechar,
}: ModalEncaminharConsultaProps) {
  const [profissionalId, setProfissionalId] = useState('');

  const semProfissionais = profissionais.length === 0;

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    aoConfirmar(semProfissionais ? null : profissionalId);
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Finalizar e encaminhar"
      descricao={
        senha && paciente
          ? 'Senha ' + senha + ' · ' + paciente
          : 'Escolha o profissional que vai atender o paciente.'
      }
      aoFechar={aoFechar}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {semProfissionais ? (
          <Alert tom="info">
            Nenhum profissional com locação vigente nesta unidade. O atendimento será
            encerrado sem gerar a senha da consulta.
          </Alert>
        ) : (
          <Select
            id="profissional-encaminhamento"
            label="Encaminhar para"
            placeholder="Selecione o profissional"
            opcoes={profissionais.map((profissional) => ({
              valor: profissional.id,
              rotulo: rotularProfissional(profissional),
            }))}
            value={profissionalId}
            onChange={(evento) => setProfissionalId(evento.target.value)}
            dica="O paciente entra na fila deste profissional com uma nova senha."
            required
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variante="secondary"
            onClick={aoFechar}
            disabled={pendente}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={pendente || (!semProfissionais && profissionalId === '')}
            className="w-full sm:w-auto"
          >
            {pendente
              ? 'Finalizando...'
              : semProfissionais
                ? 'Finalizar atendimento'
                : 'Finalizar e encaminhar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
