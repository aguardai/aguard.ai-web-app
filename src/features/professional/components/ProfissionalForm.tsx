'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cadastrarProfissional, editarProfissional } from '@/features/professional/actions';
import type { EstadoFormularioProfissional, Profissional } from '@/features/professional/types';

const ESTADO_INICIAL: EstadoFormularioProfissional = {};

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
        <Input
          id="especialidade"
          name="especialidade"
          label="Especialidade"
          defaultValue={valores.especialidade}
          erro={estado.erros?.especialidade}
          required
        />

        <Input
          id="registroProfissional"
          name="registroProfissional"
          label="Registro profissional"
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
          placeholder="opcional"
          autoComplete="email"
          defaultValue={valores.email}
          erro={estado.erros?.email}
          
        />

        <Input
          id="telefone"
          name="telefone"
          label="Telefone"
          placeholder="opcional"
          autoComplete="tel"
          defaultValue={valores.telefone}
          erro={estado.erros?.telefone}
        />
      </div>

      <Button type="submit" tamanho="lg" disabled={pendente} className="w-full sm:w-auto">
        {pendente
          ? 'Salvando...'
          : profissional
            ? 'Salvar alterações'
            : 'Cadastrar profissional'}
      </Button>
    </form>
  );
}