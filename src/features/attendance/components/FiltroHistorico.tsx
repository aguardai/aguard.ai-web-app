'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/Input';

const ESPERA_MS = 400;

export interface FiltroHistoricoProps {
  busca: string;
}

// A busca vai para a URL porque a listagem é paginada no banco: filtrar só a
// página aberta daria um resultado errado
export function FiltroHistorico({ busca }: FiltroHistoricoProps) {
  const router = useRouter();
  const [termo, setTermo] = useState(busca);

  useEffect(() => {
    const limpo = termo.trim();

    if (limpo === busca) {
      return;
    }

    const temporizador = setTimeout(() => {
      router.replace(
        limpo ? '/atendimento/historico?busca=' + encodeURIComponent(limpo) : '/atendimento/historico'
      );
    }, ESPERA_MS);

    return () => clearTimeout(temporizador);
  }, [termo, busca, router]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
      <Input
        id="filtro-busca"
        name="busca"
        type="search"
        label="Buscar"
        placeholder="Senha ou nome do paciente"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
      />
    </div>
  );
}
