'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { salvarGuiche } from '@/features/clinic/actions';
import { useCamposPreenchidos } from '@/hooks/useCamposPreenchidos';
import type {
  EstadoFormularioGuiche,
  GuicheComUnidade,
  UnidadeResumo,
} from '@/features/clinic/types';

const ESTADO_INICIAL: EstadoFormularioGuiche = {};

const CAMPOS_OBRIGATORIOS = ['unidadeId', 'nome', 'codigo'];

export interface GuicheFormProps {
  guiche?: GuicheComUnidade;
  unidades: UnidadeResumo[];
  aoCancelar: () => void;
}

export function GuicheForm({ guiche, unidades, aoCancelar }: GuicheFormProps) {
  const acao = salvarGuiche.bind(null, guiche?.id ?? null);
  const [estado, executarAcao, pendente] = useActionState(acao, ESTADO_INICIAL);

  const valores = estado.valores ?? {
    unidadeId: guiche?.unidade_id ?? unidades[0]?.id ?? '',
    nome: guiche?.nome ?? '',
    codigo: guiche?.codigo ?? '',
  };

  const { sincronizar, todosPreenchidos } = useCamposPreenchidos(valores);

  const opcoes = unidades.map((unidade) => ({
    valor: unidade.id,
    rotulo: unidade.nome,
  }));

  return (
    <form
      action={executarAcao}
      onChange={sincronizar}
      className="flex flex-col gap-5"
      noValidate
    >
      {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}
      {estado.sucesso ? <Alert tom="sucesso">{estado.sucesso}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <Select
          id="unidadeId"
          name="unidadeId"
          label="Unidade"
          opcoes={opcoes}
          defaultValue={valores.unidadeId}
          erro={estado.erros?.unidadeId}
          required
        />

        <Input
          id="nome"
          name="nome"
          label="Nome do guichê"
          placeholder="Guichê 1 - Recepção"
          defaultValue={valores.nome}
          erro={estado.erros?.nome}
          required
        />

        <Input
          id="codigo"
          name="codigo"
          label="Código"
          placeholder="REC1"
          dica="2 a 6 letras ou números."
          defaultValue={valores.codigo}
          erro={estado.erros?.codigo}
          required
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variante="secondary"
          onClick={aoCancelar}
          className="w-full sm:w-auto"
        >
          {estado.sucesso ? 'Fechar' : 'Cancelar'}
        </Button>

        <Button
          type="submit"
          disabled={pendente || !todosPreenchidos(CAMPOS_OBRIGATORIOS)}
          className="w-full sm:w-auto"
        >
          {pendente ? 'Salvando...' : guiche ? 'Salvar guichê' : 'Cadastrar guichê'}
        </Button>
      </div>
    </form>
  );
}
