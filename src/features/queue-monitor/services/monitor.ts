import type { StatusFila, TipoFila } from '@/constants/fila';
import type { PaginaFila, TicketFilaUnificada } from '@/features/queue-monitor/types';
import { createClient } from '@/lib/supabase/client';
import { intervaloDeHoje } from '@/lib/utils';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[queue-monitor] ${contexto}`, erro);
  }
}

export interface ConsultaFila {
  unidadeId?: string;
  tipoFila?: TipoFila;
  status?: StatusFila;
  pagina: number;
  porPagina: number;
}

// A view devolve no máximo 1000 linhas por página; o total vem do count exato
// do PostgREST, não do tamanho do array
export async function listarFilaPaginada({
  unidadeId,
  tipoFila,
  status,
  pagina,
  porPagina,
}: ConsultaFila): Promise<PaginaFila> {
  const supabase = createClient();
  const de = (pagina - 1) * porPagina;
  const hoje = intervaloDeHoje();

  let consulta = supabase
    .from('vw_fila_unificada')
    .select('*', { count: 'exact' })
    .gte('entrada_fila', hoje.inicio)
    .lt('entrada_fila', hoje.fim)
    .order('tipo_fila', { ascending: true })
    .order('posicao', { ascending: true, nullsFirst: false })
    .order('entrada_fila', { ascending: true })
    .range(de, de + porPagina - 1);

  let contagem = supabase
    .from('vw_fila_unificada')
    .select('ticket_id', { count: 'exact', head: true })
    .gte('entrada_fila', hoje.inicio)
    .lt('entrada_fila', hoje.fim)
    .eq('status', 'aguardando');

  if (unidadeId) {
    consulta = consulta.eq('unidade_id', unidadeId);
    contagem = contagem.eq('unidade_id', unidadeId);
  }

  if (tipoFila) {
    consulta = consulta.eq('tipo_fila', tipoFila);
    contagem = contagem.eq('tipo_fila', tipoFila);
  }

  if (status) {
    consulta = consulta.eq('status', status);
  }

  const [pagina1, aguardando] = await Promise.all([consulta, contagem]);

  if (pagina1.error) {
    registrarErro('listagem da fila unificada', pagina1.error);
    return { tickets: [], total: 0, aguardando: 0 };
  }

  if (aguardando.error) {
    registrarErro('contagem de aguardando', aguardando.error);
  }

  return {
    tickets: (pagina1.data ?? []) as unknown as TicketFilaUnificada[],
    total: pagina1.count ?? 0,
    aguardando: aguardando.count ?? 0,
  };
}
