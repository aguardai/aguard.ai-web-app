'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InputTelefone } from '@/components/ui/InputTelefone';
import { Select } from '@/components/ui/Select';
import { ESPECIALIDADES } from '@/constants/especialidades';
import { cadastrarProfissional, editarProfissional } from '@/features/professional/actions';
import type { EstadoFormularioProfissional, Profissional } from '@/features/professional/types';

const ESTADO_INICIAL: EstadoFormularioProfissional = {};

const OPCOES_ESPECIALIDADE = ESPECIALIDADES.map((especialidade) => ({
  valor: especialidade,
  rotulo: especialidade,
}));

export interface ProfissionalFormProps {
  profissional?: Profissional;
}

export function ProfissionalForm({ profissional }: ProfissionalFormProps) {
  const acao = profissional
    ? editarProfissional.bind(null, profissional.id)
    : cadastrarProfissional;

  const [estado, executarAcao, pendente] = useActionState(acao, ESTADO_INICIAL);

  const valores = estado.valores ?? {
    nome: profissional?.nome ?? '',
    especialidade: profissional?.especialidade ?? '',
    registroProfissional: profissional?.registro_profissional ?? '',
    email: profissional?.email ?? '',
    telefone: profissional?.telefone ?? '',
  };

  // Especialidade de cadastro antigo pode estar fora da lista: entra como opção
  // extra para a edição não trocar o valor sem o usuário perceber
  const opcoes = OPCOES_ESPECIALIDADE.some((opcao) => opcao.valor === valores.especialidade)
    ? OPCOES_ESPECIALIDADE
    : [...OPCOES_ESPECIALIDADE, { valor: valores.especialidade, rotulo: valores.especialidade }];

  return (
    <form action={executarAcao} className="flex flex-col gap-5" noValidate>
      {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}

      <Input
        id="nome"
        name="nome"
        label="Nome completo"
        autoComplete="name"
        defaultValue={valores.nome}
        erro={estado.erros?.nome}
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          id="especialidade"
          name="especialidade"
          label="Especialidade"
          opcoes={opcoes}
          placeholder="Selecione uma especialidade"
          defaultValue={valores.especialidade}
          erro={estado.erros?.especialidade}
          required
        />

        <Input
          id="registroProfissional"
          name="registroProfissional"
          label="Registro profissional"
          placeholder="CRM, CRO, CREFITO..."
          defaultValue={valores.registroProfissional}
          erro={estado.erros?.registroProfissional}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="email"
          name="email"
          type="email"
          label="E-mail de contato"
          placeholder="Opcional"
          autoComplete="email"
          defaultValue={valores.email}
          erro={estado.erros?.email}
        />

        <InputTelefone
          id="telefone"
          name="telefone"
          label="Telefone"
          placeholder="Opcional"
          autoComplete="tel"
          valorInicial={valores.telefone}
          erro={estado.erros?.telefone}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pendente} className="w-full sm:w-auto">
          {pendente
            ? 'Salvando...'
            : profissional
              ? 'Salvar alterações'
              : 'Cadastrar profissional'}
        </Button>
      </div>
    </form>
  );
}
