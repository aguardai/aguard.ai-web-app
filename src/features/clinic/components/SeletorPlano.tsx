'use client';

import { PLANOS, resumirLimites, type PlanoId } from '@/constants/planos';
import { formatarMoeda } from '@/lib/utils';

export interface SeletorPlanoProps {
  legenda: string;
  selecionado: PlanoId;
  aoSelecionar: (plano: PlanoId) => void;
  planoAtual?: PlanoId;
  erro?: string;
}

// Lista de planos como grupo de rádios, usada no cadastro e na troca de plano.
// Envia o campo "plano" no formulário que a contém
export function SeletorPlano({
  legenda,
  selecionado,
  aoSelecionar,
  planoAtual,
  erro,
}: SeletorPlanoProps) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-sm font-medium text-foreground">{legenda}</legend>

      {PLANOS.map((plano) => (
        <label key={plano.id} className="block cursor-pointer">
          <input
            type="radio"
            name="plano"
            value={plano.id}
            checked={selecionado === plano.id}
            onChange={() => aoSelecionar(plano.id)}
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
              {plano.precoMensal === 0 ? 'Grátis' : formatarMoeda(plano.precoMensal) + '/mês'}
            </span>
            <span className="col-span-2 text-xs text-muted sm:col-span-1">
              {resumirLimites(plano)}
            </span>
          </span>
        </label>
      ))}

      {erro ? (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      ) : null}
    </fieldset>
  );
}
