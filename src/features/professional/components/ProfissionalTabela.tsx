import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import type { Profissional } from '@/features/professional/types';
import { cn } from '@/lib/utils';

export interface ProfissionalTabelaProps {
  profissionais: Profissional[];
}

export function ProfissionalTabela({ profissionais }: ProfissionalTabelaProps) {
  if (profissionais.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
        Nenhum profissional cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Especialidade</th>
            <th className="px-4 py-3">Registro</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {profissionais.map((profissional) => (
            <tr key={profissional.id} className="transition-colors hover:bg-muted-bg/60">
              <td className="px-4 py-3 font-medium text-foreground">{profissional.nome}</td>
              <td className="px-4 py-3 text-muted">{profissional.especialidade}</td>
              <td className="px-4 py-3 text-muted">{profissional.registro_profissional}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    profissional.ativo ? 'bg-success text-white' : 'bg-muted-bg text-muted'
                  )}
                >
                  {profissional.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/profissionais/${profissional.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Ver detalhes
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}