// Lista de unidades da clínica com acesso às operações de cada unidade
// Acesso: CLINICA
import { exigirPerfil } from '@/features/auth/services/sessao';
import { createClient } from '@/lib/supabase/server';
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';
import { Eye, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';

export default async function UnidadesPage() {
  const perfil = await exigirPerfil();

  if (!perfil.clinica_id) {
    return <TelaPlaceholder titulo="Unidades" rota="/unidades" detalhe="Sua conta não está vinculada a uma clínica." />;
  }

  const supabase = await createClient();
  const { data: unidades } = await supabase
    .from('unidade')
    .select('id, nome, codigo, endereco, telefone, ativa')
    .eq('clinica_id', perfil.clinica_id)
    .is('deleted_at', null)
    .order('nome');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-primary">Operação</p>
          <h1 className="mt-2 font-title text-3xl font-bold text-foreground">Unidades</h1>
        </div>
        <Link href="/unidades/nova" className={buttonClasses({ tamanho: 'sm' })}>
          <Plus className="size-4" aria-hidden />
          Nova unidade
        </Link>
      </header>

      <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-muted-bg text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-4 font-medium">Unidade</th><th className="px-5 py-4 font-medium">Código</th><th className="px-5 py-4 font-medium">Telefone</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 text-right font-medium">Ações</th></tr>
            </thead>
            <tbody>
              {unidades?.length ? unidades.map((unidade) => (
                <tr key={unidade.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-5 font-semibold text-foreground">{unidade.nome}</td>
                  <td className="px-5 py-5 text-muted">{unidade.codigo}</td>
                  <td className="px-5 py-5 text-muted">{unidade.telefone ?? 'Não informado'}</td>
                  <td className="px-5 py-5 text-muted">{unidade.ativa ? 'Ativa' : 'Inativa'}</td>
                  <td className="px-5 py-5 text-right"><span className="inline-flex gap-2"><Link href={`/unidades/${unidade.id}`} aria-label={`Ver ${unidade.nome}`} className={buttonClasses({ variante: 'secondary', tamanho: 'sm' })}><Eye className="size-4" aria-hidden /></Link><Link href={`/unidades/${unidade.id}/editar`} aria-label={`Editar ${unidade.nome}`} className={buttonClasses({ variante: 'secondary', tamanho: 'sm' })}><Pencil className="size-4" aria-hidden /></Link></span></td>
                </tr>
              )) : <tr><td colSpan={5} className="px-5 py-12 text-center text-muted">Nenhuma unidade cadastrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
