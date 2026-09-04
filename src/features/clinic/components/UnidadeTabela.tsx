import Link from 'next/link';
import { Eye, Pencil } from 'lucide-react';

import { acaoIconeClasses } from '@/components/ui/AcaoIcone';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { AlternarAtivaUnidadeBotao } from '@/features/clinic/components/AlternarAtivaUnidadeBotao';
import { RemoverUnidadeBotao } from '@/features/clinic/components/RemoverUnidadeBotao';
import type { Unidade } from '@/features/clinic/types';
import { mascararTelefone } from '@/lib/validations';

export interface UnidadeTabelaProps {
  unidades: Unidade[];
  podeGerenciar: boolean;
}

export function UnidadeTabela({ unidades, podeGerenciar }: UnidadeTabelaProps) {
  if (unidades.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhuma unidade cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
      <table className="w-full min-w-[46rem] text-left text-sm whitespace-nowrap">
        <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th className="w-full px-4 py-3">Unidade</th>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Tipo de serviço</th>
            <th className="px-4 py-3">Telefone</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {unidades.map((unidade) => (
            <tr key={unidade.id} className="transition-colors hover:bg-muted-bg/60">
              <td className="w-full px-4 py-3 font-medium text-foreground">{unidade.nome}</td>
              <td className="px-4 py-3 font-mono text-muted">{unidade.codigo}</td>
              <td className="px-4 py-3 text-muted">{unidade.tipo_servico}</td>
              <td className="px-4 py-3 text-muted">
                {unidade.telefone ? mascararTelefone(unidade.telefone) : '—'}
              </td>
              <td className="px-4 py-3">
                <EtiquetaAtivo ativo={unidade.ativa} rotulos={['Ativa', 'Inativa']} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/unidades/${unidade.id}`}
                    aria-label={`Ver ${unidade.nome}`}
                    title={`Ver ${unidade.nome}`}
                    className={acaoIconeClasses()}
                  >
                    <Eye className="size-4" aria-hidden />
                  </Link>

                  {podeGerenciar ? (
                    <>
                      <Link
                        href={`/unidades/${unidade.id}/editar`}
                        aria-label={`Editar ${unidade.nome}`}
                        title={`Editar ${unidade.nome}`}
                        className={acaoIconeClasses()}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Link>

                      <AlternarAtivaUnidadeBotao
                        id={unidade.id}
                        nome={unidade.nome}
                        ativa={unidade.ativa}
                        variante="icone"
                      />

                      <RemoverUnidadeBotao
                        id={unidade.id}
                        nome={unidade.nome}
                        variante="icone"
                      />
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
