'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InputTelefone } from '@/components/ui/InputTelefone';
import { criarUnidade } from '@/features/clinic/actions';
import type { EstadoFormularioUnidade } from '@/features/clinic/types';
import { useCamposPreenchidos } from '@/hooks/useCamposPreenchidos';

const ESTADO_INICIAL: EstadoFormularioUnidade = {};
const CAMPOS_OBRIGATORIOS = ['nome', 'codigo', 'tipoServico', 'telefone', 'endereco'];

export function UnidadeForm() {
  const [estado, executarAcao, pendente] = useActionState(criarUnidade, ESTADO_INICIAL);
  const valores = estado.valores ?? {
    nome: '',
    codigo: '',
    tipoServico: '',
    telefone: '',
    endereco: '',
  };
  const { sincronizar, todosPreenchidos } = useCamposPreenchidos(valores);

  return (
    <form
      action={executarAcao}
      onChange={sincronizar}
      className="flex flex-col gap-5"
      noValidate
    >
      {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}
      {estado.sucesso ? <Alert tom="sucesso">{estado.sucesso}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="nome"
          name="nome"
          label="Nome da unidade"
          placeholder="Unidade Centro"
          defaultValue={valores.nome}
          erro={estado.erros?.nome}
          required
        />
        <Input
          id="codigo"
          name="codigo"
          label="Código da unidade"
          placeholder="CTR"
          dica="Use de 2 a 6 letras ou números."
          defaultValue={valores.codigo}
          erro={estado.erros?.codigo}
          required
        />
        <Input
          id="tipoServico"
          name="tipoServico"
          label="Tipo de serviço"
          placeholder="Recepção"
          defaultValue={valores.tipoServico}
          erro={estado.erros?.tipoServico}
          required
        />
        <InputTelefone
          id="telefone"
          name="telefone"
          label="Telefone"
          placeholder="(87) 99999-0000"
          valorInicial={valores.telefone}
          erro={estado.erros?.telefone}
          required
        />
        <Input
          id="endereco"
          name="endereco"
          label="Endereço"
          placeholder="Rua, número, bairro e cidade"
          defaultValue={valores.endereco}
          erro={estado.erros?.endereco}
          required
          className="sm:col-span-2"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pendente || !todosPreenchidos(CAMPOS_OBRIGATORIOS)}
          className="w-full sm:w-auto"
        >
          {pendente ? 'Cadastrando...' : 'Cadastrar unidade'}
        </Button>
      </div>
    </form>
  );
}