import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TicketAtivo {
  ticketId: string;
  unidadeId: string;
}

interface QueueState {
  ticketAtivo: TicketAtivo | null;
  definirTicketAtivo: (ticket: TicketAtivo) => void;
  limparTicketAtivo: () => void;
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set) => ({
      ticketAtivo: null,
      definirTicketAtivo: (ticket) => set({ ticketAtivo: ticket }),
      limparTicketAtivo: () => set({ ticketAtivo: null }),
    }),
    { name: 'aguardai-ticket-ativo' }
  )
);
