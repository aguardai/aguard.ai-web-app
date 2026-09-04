// Monitoramento das duas filas em tempo real
// Acesso: CLINICA, UNIDADE
import { redirect } from 'next/navigation';

import { Alert } from '@/components/ui/Alert';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { listarUnidades } from '@/features/clinic/services/guiche';
import { QueueMonitorPanel } from '@/features/queue-monitor/components/QueueMonitorPanel';
import type { PaginaFila, TicketFilaUnificada } from '@/features/queue-monitor/types';
import { createClient } from '@/lib/supabase/server';
import { intervaloDeHoje } from '@/lib/utils';

export const metadata = { title: 'Filas — Aguard.ai' };
export const revalidate = 0;

const POR_PAGINA = 20;

// Primeira página renderizada no servidor; o painel assume a atualização depois
async function primeiraPagina(unidadeId: string): Promise<PaginaFila> {
  const supabase = await createClient();
  const hoje = intervaloDeHoje();

  const [pagina, aguardando] = await Promise.all([
    supabase
      .from('vw_fila_unificada')
      .select('*', { count: 'exact' })
      .eq('unidade_id', unidadeId)
      .gte('entrada_fila', hoje.inicio)
      .lt('entrada_fila', hoje.fim)
      .order('tipo_fila', { ascending: true })
      .order('posicao', { ascending: true, nullsFirst: false })
      .order('entrada_fila', { ascending: true })
      .range(0, POR_PAGINA - 1),
    supabase
      .from('vw_fila_unificada')
      .select('ticket_id', { count: 'exact', head: true })
      .eq('unidade_id', unidadeId)
      .gte('entrada_fila', hoje.inicio)
      .lt('entrada_fila', hoje.fim)
      .eq('status', 'aguardando'),
  ]);

  return {
    tickets: (pagina.data ?? []) as unknown as TicketFilaUnificada[],
    total: pagina.count ?? 0,
    aguardando: aguardando.count ?? 0,
  };
}

export default async function FilasPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const unidades = await listarUnidades();

  // O gestor de unidade fica preso à própria unidade; a clínica escolhe qual ver
  const unidadeInicial =
    perfil.papel === 'unidade' && perfil.unidade_id
      ? perfil.unidade_id
      : (unidades[0]?.id ?? '');

  if (!unidadeInicial) {
    return (
      <div className="content-container py-8">
        <Alert tom="info">
          Cadastre uma unidade para acompanhar as filas em tempo real.
        </Alert>
      </div>
    );
  }

  return (
    <QueueMonitorPanel
      unidades={unidades}
      unidadeInicial={unidadeInicial}
      paginaInicial={await primeiraPagina(unidadeInicial)}
      podeTrocarUnidade={perfil.papel === 'clinica'}
    />
  );
}
