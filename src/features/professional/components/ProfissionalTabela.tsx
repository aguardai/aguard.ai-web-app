import Link from 'next/link';
import { Eye, Pencil } from 'lucide-react';

import { acaoIconeClasses } from '@/components/ui/AcaoIcone';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { AlternarAtivoBotao } from '@/features/professional/components/AlternarAtivoBotao';
import { RemoverProfissionalBotao } from '@/features/professional/components/RemoverProfissionalBotao';
import type { Profissional } from '@/features/professional/types';
import { mascararTelefone } from '@/lib/validations';

export interface ProfissionalTabelaProps {
  profissionais: Profissional[];
  podeGerenciar: boolean;
}

export function ProfissionalTabela({ profissionais, podeGerenciar }: ProfissionalTabelaProps) {
  if (profissionais.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhum profissional cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
      <table className="w-full min-w-[46rem] text-left text-sm">
        <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th className="w-full px-4 py-3 whitespace-nowrap">Nome</th>
            <th className="px-4 py-3 whitespace-nowrap">Especialidade</th>
            <th className="px-4 py-3 whitespace-nowrap">Registro</th>
            <th className="px-4 py-3 whitespace-nowrap">Telefone</th>
            <th className="px-4 py-3 whitespace-nowrap">Status</th>
            <th className="px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {profissionais.map((profissional) => (
            <tr key={profissional.id} className="transition-colors hover:bg-muted-bg/60">
              <td className="w-full px-4 py-3 font-medium whitespace-nowrap text-foreground">
                {profissional.nome}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">
                {profissional.especialidade}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">
                {profissional.registro_profissional}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">
                {profissional.telefone ? mascararTelefone(profissional.telefone) : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <EtiquetaAtivo ativo={profissional.ativo} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/profissionais/${profissional.id}`}
                    aria-label={`Ver ${profissional.nome}`}
                    title="Ver detalhes"
                    className={acaoIconeClasses()}
                  >
                    <Eye className="size-4" aria-hidden />
                  </Link>

                  {podeGerenciar ? (
                    <>
                      <Link
                        href={`/profissionais/${profissional.id}/editar`}
                        aria-label={`Editar ${profissional.nome}`}
                        title="Editar"
                        className={acaoIconeClasses()}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Link>

                      <AlternarAtivoBotao
                        id={profissional.id}
                        nome={profissional.nome}
                        ativo={profissional.ativo}
                        variante="icone"
                      />

                      <RemoverProfissionalBotao
                        id={profissional.id}
                        nome={profissional.nome}
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
