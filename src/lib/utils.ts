// Helpers genéricos compartilhados entre features
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const NUMERO = new Intl.NumberFormat('pt-BR');

const FUSO = 'America/Sao_Paulo';

// Datas do banco chegam como 'YYYY-MM-DD' (date) ou ISO completo (timestamptz)
function paraData(valor: string) {
  return valor.length === 10 ? new Date(`${valor}T12:00:00`) : new Date(valor);
}

export function formatarMoeda(valor: number) {
  return MOEDA.format(valor);
}

export function formatarNumero(valor: number) {
  return NUMERO.format(valor);
}

// Minutos vindos do banco (numeric com 1 casa) em texto curto: "8 min", "1h12"
export function formatarMinutos(valor: number | null | undefined) {
  if (valor === null || valor === undefined) {
    return '—';
  }

  const total = Math.round(valor);

  if (total < 60) {
    return `${total} min`;
  }

  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`;
}

export function formatarData(valor: string | null | undefined) {
  if (!valor) {
    return '—';
  }

  return paraData(valor).toLocaleDateString('pt-BR', { timeZone: FUSO });
}

export function formatarDataCurta(valor: string | null | undefined) {
  if (!valor) {
    return '—';
  }

  return paraData(valor).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: FUSO,
  });
}
