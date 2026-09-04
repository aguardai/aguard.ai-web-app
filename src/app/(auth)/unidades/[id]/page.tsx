// Detalhe da unidade: dados de contato e situação do cadastro
// Acesso: CLINICA, UNIDADE
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowRightLeft,
  Clock,
  Hash,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

import { buttonClasses } from '@/components/ui/Button';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { EtiquetaAtivo } from '@/components/ui/EtiquetaAtivo';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { AlternarAtivaUnidadeBotao } from '@/features/clinic/components/AlternarAtivaUnidadeBotao';
import { RemoverUnidadeBotao } from '@/features/clinic/components/RemoverUnidadeBotao';
import { buscarUnidadePorId } from '@/features/clinic/services/unidade';
import { formatarMinutos } from '@/lib/utils';
import { mascararTelefone } from '@/lib/validations';

export const metadata = { title: 'Unidade — Aguard.ai' };

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

export default async function DetalheUnidadePage({ params }: PaginaProps) {
  const { id } = await params;
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const unidade = await buscarUnidadePorId(id);

  if (!unidade) {
    notFound();
  }

  const podeGerenciar = perfil.papel === 'clinica';

  return (
    <div className="content-container flex max-w-4xl flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo={unidade.nome}
        descricao={unidade.tipo_servico}
        voltarPara="/unidades"
        rotuloVoltar="Unidades"
        acoes={
          podeGerenciar ? (
            <>
              <Link
                href={`/unidades/${unidade.id}/editar`}
                className={buttonClasses({
                  variante: 'secondary',
                  className: 'w-full sm:w-auto',
                })}
              >
                <Pencil className="size-4" aria-hidden />
                Editar
              </Link>

              <RemoverUnidadeBotao id={unidade.id} nome={unidade.nome} />
            </>
          ) : null
        }
      />

      <section className="grid gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:grid-cols-3 sm:p-6">
        <Dado rotulo="Código" valor={unidade.codigo} Icone={Hash} />
        <Dado rotulo="Tipo de serviço" valor={unidade.tipo_servico} Icone={Stethoscope} />
        <Dado
          rotulo="Telefone"
          valor={unidade.telefone ? mascararTelefone(unidade.telefone) : null}
          Icone={Phone}
        />
        <Dado rotulo="Endereço" valor={unidade.endereco} Icone={MapPin} />
        <Dado
          rotulo="Duração média do atendimento"
          valor={formatarMinutos(unidade.duracao_media_minutos)}
          Icone={Clock}
        />
        <Dado
          rotulo="Encaminhamento"
          valor={
            unidade.encaminha_para_consulta
              ? 'Da recepção para a fila de consulta'
              : 'Atende apenas na fila da recepção'
          }
          Icone={ArrowRightLeft}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-title text-base font-bold text-foreground">
              Status do cadastro
            </h2>
            <EtiquetaAtivo ativo={unidade.ativa} rotulos={['Ativa', 'Inativa']} />
          </div>

          {podeGerenciar ? (
            <AlternarAtivaUnidadeBotao
              id={unidade.id}
              nome={unidade.nome}
              ativa={unidade.ativa}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
