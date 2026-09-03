import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, Phone, Mail, IdCard } from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { buscarProfissionalPorId } from '@/features/professional/services/profissional';
import { LocacoesDoProfissional } from '@/features/professional/components/LocacoesDoProfissional';
import { ConviteAcessoForm } from '@/features/professional/components/ConviteAcessoForm';
import { AlternarAtivoBotao } from '@/features/professional/components/AlternarAtivoBotao';
import { RemoverProfissionalBotao } from '@/features/professional/components/RemoverProfissionalBotao';

export const metadata = { title: 'Profissional — Aguard.ai' };

interface PaginaProps {
  params: Promise<{ id: string }>;
}

export default async function DetalheProfissionalPage({ params }: PaginaProps) {
  const { id } = await params;
  const perfil = await exigirPerfil();
  const profissional = await buscarProfissionalPorId(id);

  if (!profissional) {
    notFound();
  }

  const podeGerenciar = perfil.papel === 'clinica';

  return (
    <div className="content-container flex max-w-2xl flex-col gap-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-title text-2xl font-bold text-foreground">{profissional.nome}</h1>
          <p className="text-sm text-muted">{profissional.especialidade}</p>
        </div>

        {podeGerenciar ? (
          <Link
            href={`/profissionais/${profissional.id}/editar`}
            className={buttonClasses({ variante: 'secondary' })}
          >
            <Pencil className="size-4" aria-hidden />
            Editar
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-[12px] border border-border p-5 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <IdCard className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="text-sm text-foreground">{profissional.registro_profissional}</span>
        </div>

        <div className="flex items-center gap-3">
          <Mail className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="text-sm text-foreground">
            {profissional.email ?? <span className="text-muted">Não informado</span>}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Phone className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="text-sm text-foreground">
            {profissional.telefone ?? <span className="text-muted">Não informado</span>}
          </span>
        </div>
      </div>

      {podeGerenciar ? (
        <section className="flex flex-col gap-3 rounded-[12px] border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Status do cadastro</h2>
            <div className="flex items-center gap-2">
              <AlternarAtivoBotao id={profissional.id} ativo={profissional.ativo} />
              <RemoverProfissionalBotao id={profissional.id} nome={profissional.nome} />
            </div>
          </div>
        </section>
      ) : null}

      {podeGerenciar ? (
        <section className="flex flex-col gap-3 rounded-[12px] border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">Acesso ao sistema</h2>

          {profissional.user_id ? (
            <p className="text-sm text-success">Login vinculado — já pode acessar a plataforma.</p>
          ) : (
            <>
              <p className="text-sm text-muted">
                Este profissional ainda não tem login. Envie um convite para o e-mail dele.
              </p>
              <ConviteAcessoForm profissional={profissional} />
            </>
          )}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Unidades</h2>
        <LocacoesDoProfissional locacoes={profissional.locacoes} />
      </section>
    </div>
  );
}