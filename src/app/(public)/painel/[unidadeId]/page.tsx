// Painel de chamada da sala de espera — aberto, roda numa TV da unidade
import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { PainelSalaEspera } from '@/features/queue/components/PainelSalaEspera';
import { buscarPainelDaUnidade } from '@/features/queue/services/painel';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Painel de chamada | Aguard.ai',
  description: 'Senhas chamadas e próximas da fila da unidade.',
};

interface PaginaPainelProps {
  params: Promise<{ unidadeId: string }>;
}

export default async function PaginaPainel({ params }: PaginaPainelProps) {
  const { unidadeId } = await params;

  // O QR precisa da URL absoluta e o painel pode ser aberto por qualquer host da
  // clínica, então a origem vem da própria requisição
  const [cabecalhos, fila] = await Promise.all([
    headers(),
    buscarPainelDaUnidade(unidadeId),
  ]);

  const host = cabecalhos.get('x-forwarded-host') ?? cabecalhos.get('host') ?? '';
  const protocolo = cabecalhos.get('x-forwarded-proto') ?? 'http';

  return (
    <PainelSalaEspera
      unidadeId={unidadeId}
      enderecoDaFila={protocolo + '://' + host + '/fila/' + unidadeId}
      fila={fila}
    />
  );
}
