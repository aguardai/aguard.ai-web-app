import { createClient } from '@/lib/supabase/server';
import { QueueStatusCard } from '@/features/queue/components/QueueStatusCard';
import type { TicketFila } from '@/features/queue/types';

interface PaginaAcompanharProps {
  params: Promise<{ ticketId: string }>;
}

export default async function PaginaAcompanhar({ params }: PaginaAcompanharProps) {
  const { ticketId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc('fn_acompanhar_ticket', { p_ticket_id: ticketId });
  const ticketInicial = (data as unknown as TicketFila) ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted-bg px-4 py-12">
      <div className="w-full max-w-md">
        <QueueStatusCard ticketId={ticketId} ticketInicial={ticketInicial} />
      </div>
    </div>
  );
}
