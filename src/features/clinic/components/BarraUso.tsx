import { cn, formatarNumero } from '@/lib/utils';

export interface BarraUsoProps {
  rotulo: string;
  usado: number;
  limite: number;
  ilimitado?: boolean;
}

// Consumo de um recurso do plano. Acima de 70% vira alerta, acima de 90% perigo
export function BarraUso({ rotulo, usado, limite, ilimitado }: BarraUsoProps) {
  const proporcao = limite > 0 ? Math.min(usado / limite, 1) : 0;
  const percentual = Math.round(proporcao * 100);

  const cor = ilimitado
    ? 'bg-primary-light'
    : percentual >= 90
      ? 'bg-danger'
      : percentual >= 70
        ? 'bg-warning'
        : 'bg-primary';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <span className="font-medium text-foreground">{rotulo}</span>
        <span className="text-right whitespace-nowrap text-muted">
          {formatarNumero(usado)}
          {ilimitado ? ' · ilimitado' : ` / ${formatarNumero(limite)}`}
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted-bg"
        role="progressbar"
        aria-label={rotulo}
        aria-valuenow={usado}
        aria-valuemin={0}
        aria-valuemax={ilimitado ? undefined : limite}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', cor)}
          style={{ width: ilimitado ? '100%' : `${percentual}%` }}
        />
      </div>
    </div>
  );
}
