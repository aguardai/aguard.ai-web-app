'use client';

import { useActionState, useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PLANOS, resumirLimites, type PlanoId } from '@/constants/planos';
import { alterarPlano } from '@/features/clinic/actions';
import type { EstadoTrocaPlano } from '@/features/clinic/types';
import { formatarMoeda } from '@/lib/utils';

const ESTADO_INICIAL: EstadoTrocaPlano = {};

export interface PlanoFormProps {
  planoAtual: PlanoId;
}

export function PlanoForm({ planoAtual }: PlanoFormProps) {
  const [estado, acao, pendente] = useActionState(alterarPlano, ESTADO_INICIAL);
  const [selecionado, setSelecionado] = useState<PlanoId>(planoAtual);

  return (
    <form action={acao} className="flex flex-col gap-4">
      {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}
      {estado.sucesso ? <Alert tom="sucesso">{estado.sucesso}</Alert> : null}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-medium text-foreground">
          Plano contratado
        </legend>

        {PLANOS.map((plano) => (
          <label key={plano.id} className="block cursor-pointer">
            <input
              type="radio"
              name="plano"
              value={plano.id}
              checked={selecionado === plano.id}
              onChange={() => setSelecionado(plano.id)}
              className="peer sr-only"
            />
            <span className="grid grid-cols-[1fr_auto] items-center gap-x-3 rounded-[12px] border border-border px-4 py-3 transition-colors duration-200 ease-in-out hover:border-primary-light peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
              <span className="min-w-0 text-sm font-semibold text-foreground">
                {plano.nome}
                {plano.id === planoAtual ? (
                  <span className="ml-2 hidden text-xs font-medium text-primary sm:inline">
                    atual
                  </span>
                ) : null}
              </span>
              <span className="text-right text-sm font-semibold text-primary sm:row-span-2">
                {plano.precoMensal === 0
                  ? 'Grátis'
                  : `${formatarMoeda(plano.precoMensal)}/mês`}
              </span>
              <span className="col-span-2 text-xs text-muted sm:col-span-1">
                {resumirLimites(plano)}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Cobrança simulada — nenhuma transação financeira é feita.
        </p>

        <Button
          type="submit"
          disabled={pendente || selecionado === planoAtual}
          className="w-full sm:w-auto"
        >
          {pendente ? 'Alterando...' : 'Alterar plano'}
        </Button>
      </div>
    </form>
  );
}
