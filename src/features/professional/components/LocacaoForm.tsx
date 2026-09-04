'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { salvarLocacao } from '@/features/professional/actions';
import { useCamposPreenchidos } from '@/hooks/useCamposPreenchidos';
import type {
  EstadoFormularioLocacao,
  Profissional,
} from '@/features/professional/types';
import type { UnidadeResumo } from '@/features/clinic/types';
import { hojeISO } from '@/lib/utils';

const ESTADO_INICIAL: EstadoFormularioLocacao = {};

// O término é opcional: vínculo sem data de saída fica aberto
const CAMPOS_OBRIGATORIOS = ['profissionalId', 'unidadeId', 'dataInicio'];

export interface LocacaoFormProps {
  profissionais: Profissional[];
  unidades: UnidadeResumo[];
  aoCancelar: () => void;
}

export function LocacaoForm({ profissionais, unidades, aoCancelar }: LocacaoFormProps) {
  const [estado, executarAcao, pendente] = useActionState(salvarLocacao, ESTADO_INICIAL);

  const valores = estado.valores ?? {
    profissionalId: profissionais[0]?.id ?? '',
    unidadeId: unidades[0]?.id ?? '',
    dataInicio: hojeISO(),
    dataFim: '',
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
        <Select
          id="profissionalId"
          name="profissionalId"
          label="Profissional"
          opcoes={profissionais.map((profissional) => ({
            valor: profissional.id,
            rotulo: `${profissional.nome} · ${profissional.especialidade}`,
          }))}
          defaultValue={valores.profissionalId}
          erro={estado.erros?.profissionalId}
          required
        />

        <Select
          id="unidadeId"
          name="unidadeId"
          label="Unidade"
          opcoes={unidades.map((unidade) => ({ valor: unidade.id, rotulo: unidade.nome }))}
          defaultValue={valores.unidadeId}
          erro={estado.erros?.unidadeId}
          required
        />

        <Input
          id="dataInicio"
          name="dataInicio"
          type="date"
          label="Início"
          defaultValue={valores.dataInicio}
          erro={estado.erros?.dataInicio}
          required
        />

        <Input
          id="dataFim"
          name="dataFim"
          type="date"
          label="Término"
          dica="Deixe vazio para vínculo aberto."
          defaultValue={valores.dataFim}
          erro={estado.erros?.dataFim}
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
          {pendente ? 'Salvando...' : 'Criar locação'}
        </Button>
      </div>
    </form>
  );
}
