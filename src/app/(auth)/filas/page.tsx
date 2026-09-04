import { redirect } from 'next/navigation';

import { QueueMonitorPanel } from '@/features/queue-monitor/components/QueueMonitorPanel';
import type { TicketFilaUnificada } from '@/features/queue-monitor/types';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function FilasPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const supabase = await createClient();

  let query = supabase
    .from('vw_fila_unificada')
    .select('*')
    .order('tipo_fila', { ascending: true })
    .order('posicao', { ascending: true, nullsFirst: false })
    .order('entrada_fila', { ascending: true });

  if (perfil.papel === 'unidade' && perfil.unidade_id) {
    query = query.eq('unidade_id', perfil.unidade_id);
  }

  const { data } = await query;

  return (
    <QueueMonitorPanel
      ticketsIniciais={(data ?? []) as unknown as TicketFilaUnificada[]}
      unidadeId={perfil.papel === 'unidade' ? (perfil.unidade_id ?? undefined) : undefined}
    />
  );
}
