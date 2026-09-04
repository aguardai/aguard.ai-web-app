import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { QueueStatusCard } from '@/features/queue/components/QueueStatusCard';
import type { TicketFila } from '@/features/queue/types';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Acompanhar atendimento | Aguard.ai',
  description: 'Veja sua posição na fila e o tempo estimado de espera.',
};

interface PaginaAcompanharProps {
  params: Promise<{ ticketId: string }>;
}

export default async function PaginaAcompanhar({ params }: PaginaAcompanharProps) {
  const { ticketId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc('fn_acompanhar_ticket', { p_ticket_id: ticketId });
  const ticketInicial = (data as unknown as TicketFila) ?? null;

  return (
    <AuthShell
      titulo="Acompanhar atendimento"
      descricao="Sua posição na fila é atualizada automaticamente."
    >
      <QueueStatusCard ticketId={ticketId} ticketInicial={ticketInicial} />
    </AuthShell>
  );
}
