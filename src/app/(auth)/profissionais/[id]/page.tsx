// Detalhe do profissional: dados, status do cadastro, acesso e unidades
// Acesso: CLINICA, UNIDADE
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IdCard, Mail, Pencil, Phone, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { AlternarAtivoBotao } from '@/features/professional/components/AlternarAtivoBotao';
import { ConviteAcessoForm } from '@/features/professional/components/ConviteAcessoForm';
import { LocacoesDoProfissional } from '@/features/professional/components/LocacoesDoProfissional';
import { RemoverProfissionalBotao } from '@/features/professional/components/RemoverProfissionalBotao';
import { buscarProfissionalPorId } from '@/features/professional/services/profissional';
import { mascararTelefone } from '@/lib/validations';

export const metadata = { title: 'Profissional — Aguard.ai' };

interface PaginaProps {
  params: Promise<{ id: string }>;
}

interface DadoProps {
  rotulo: string;
  valor: string | null;
  Icone: LucideIcon;
}

function Dado({ rotulo, valor, Icone }: DadoProps) {
  return (
    <div className="flex items-start gap-3">
      <Icone className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted">{rotulo}</p>
        <p className="text-sm text-foreground">
          {valor ?? <span className="text-muted">Não informado</span>}
        </p>
      </div>
    </div>
  );
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
    <div className="content-container flex max-w-4xl flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo={profissional.nome}
        descricao={profissional.especialidade}
        voltarPara="/profissionais"
        rotuloVoltar="Profissionais"
        acoes={
          podeGerenciar ? (
            <>
              <Link
                href={`/profissionais/${profissional.id}/editar`}
                className={buttonClasses({
                  variante: 'secondary',
                  className: 'w-full sm:w-auto',
                })}
              >
                <Pencil className="size-4" aria-hidden />
                Editar
              </Link>

              <RemoverProfissionalBotao id={profissional.id} nome={profissional.nome} />
            </>
          ) : null
        }
      />

      <section className="grid gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:grid-cols-3 sm:p-6">
        <Dado
          rotulo="Registro profissional"
          valor={profissional.registro_profissional}
          Icone={IdCard}
        />
        <Dado rotulo="E-mail de contato" valor={profissional.email} Icone={Mail} />
        <Dado
          rotulo="Telefone"
          valor={profissional.telefone ? mascararTelefone(profissional.telefone) : null}
          Icone={Phone}
        />
      </section>

      {podeGerenciar ? (
        <section className="flex flex-col gap-4 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-title text-base font-bold text-foreground">
                Status do cadastro
              </h2>
              <EtiquetaAtivo ativo={profissional.ativo} />
            </div>

            <AlternarAtivoBotao
              id={profissional.id}
              nome={profissional.nome}
              ativo={profissional.ativo}
            />
          </div>
        </section>
      ) : null}

      {podeGerenciar ? (
        <section className="flex flex-col gap-4 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-title text-base font-bold text-foreground">
              Acesso ao sistema
            </h2>

            {profissional.user_id ? (
              <Badge tom="sucesso">Login vinculado</Badge>
            ) : (
              <Badge tom="neutro">Sem login</Badge>
            )}
          </div>

          {profissional.user_id ? null : (
            <ConviteAcessoForm profissional={profissional} />
          )}
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-title text-base font-bold text-foreground">Unidades</h2>
        <LocacoesDoProfissional locacoes={profissional.locacoes} />
      </section>
    </div>
  );
}
