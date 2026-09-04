import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { obterPlano } from '@/constants/planos';
import { BarraUso } from '@/features/clinic/components/BarraUso';
import type { UsoPlano } from '@/features/clinic/types';
import { cn, formatarMoeda } from '@/lib/utils';

export interface CartaoUsoPlanoProps {
  uso: UsoPlano;
  comLinkParaGestao?: boolean;
  className?: string;
}

// Consumo do plano contratado. Sem teto no Enterprise, por decisão comercial
export function CartaoUsoPlano({
  uso,
  comLinkParaGestao,
  className,
}: CartaoUsoPlanoProps) {
  const plano = obterPlano(uso.plano);
  const ilimitado = uso.plano === 'enterprise';

  return (
    <section
      className={cn(
        'flex flex-col gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="font-title text-base font-bold text-foreground">Uso do plano</h2>

        <Badge tom="primario" className="w-full justify-center sm:w-auto">
          {plano?.nome ?? uso.plano}
          {uso.precoMensalSimulado > 0
            ? ` · ${formatarMoeda(uso.precoMensalSimulado)}/mês`
            : ' · grátis'}
        </Badge>
      </div>

      <div className="flex flex-col gap-4">
        <BarraUso
          rotulo="Unidades"
          usado={uso.unidades.usado}
          limite={uso.unidades.limite}
          ilimitado={ilimitado}
        />
        <BarraUso
          rotulo="Guichês"
          usado={uso.guiches.usado}
          limite={uso.guiches.limite}
          ilimitado={ilimitado}
        />
        <BarraUso
          rotulo="Profissionais"
          usado={uso.profissionais.usado}
          limite={uso.profissionais.limite}
          ilimitado={ilimitado}
        />
        <BarraUso
          rotulo="Atendimentos no mês"
          usado={uso.ticketsMes.usado}
          limite={uso.ticketsMes.limite}
          ilimitado={ilimitado}
        />
      </div>

      {comLinkParaGestao ? (
        <Link
          href="/clinica"
          className="inline-flex items-center justify-center gap-1 self-center text-sm font-medium text-primary hover:underline"
        >
          Gerenciar plano
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}
