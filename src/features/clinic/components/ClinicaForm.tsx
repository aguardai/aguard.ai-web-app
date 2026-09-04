'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InputTelefone } from '@/components/ui/InputTelefone';
import { salvarClinica } from '@/features/clinic/actions';
import type { Clinica, EstadoFormularioClinica } from '@/features/clinic/types';
import { useCamposPreenchidos } from '@/hooks/useCamposPreenchidos';

const ESTADO_INICIAL: EstadoFormularioClinica = {};

const CAMPOS = ['nome', 'email', 'telefone', 'endereco'];

export interface ClinicaFormProps {
  clinica: Clinica;
}

export function ClinicaForm({ clinica }: ClinicaFormProps) {
  const [estado, acao, pendente] = useActionState(salvarClinica, ESTADO_INICIAL);

  function valorDe(campo: keyof Clinica, padrao: string | null) {
    return estado.valores?.[campo] ?? padrao ?? '';
  }

  const valores = {
    nome: valorDe('nome', clinica.nome),
    email: valorDe('email', clinica.email),
    telefone: valorDe('telefone', clinica.telefone),
    endereco: valorDe('endereco', clinica.endereco),
  };

  const { sincronizar, todosPreenchidos } = useCamposPreenchidos(valores);

  return (
    <form action={acao} onChange={sincronizar} className="flex flex-col gap-5" noValidate>
      {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}
      {estado.sucesso ? <Alert tom="sucesso">{estado.sucesso}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="nome"
          name="nome"
          label="Nome da clínica"
          autoComplete="organization"
          defaultValue={valores.nome}
          erro={estado.erros?.nome}
          required
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="E-mail de contato"
          autoComplete="email"
          defaultValue={valores.email}
          erro={estado.erros?.email}
          required
        />

        <InputTelefone
          id="telefone"
          name="telefone"
          label="Telefone"
          placeholder="(87) 99999-0000"
          autoComplete="tel"
          valorInicial={valores.telefone}
          erro={estado.erros?.telefone}
          required
        />

        <Input
          id="endereco"
          name="endereco"
          label="Endereço"
          placeholder="Rua, número, bairro e cidade"
          autoComplete="street-address"
          defaultValue={valores.endereco}
          erro={estado.erros?.endereco}
          required
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pendente || !todosPreenchidos(CAMPOS)}
          className="w-full sm:w-auto"
        >
          {pendente ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}
