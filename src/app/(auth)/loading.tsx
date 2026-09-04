'use client';

import { usePathname } from 'next/navigation';

import { Carregando } from '@/components/ui/Carregando';
import { mensagemDeCarregamento } from '@/constants/routes';

// Boundary único do grupo autenticado: a frase vem da rota de destino, que o
// router já expõe enquanto o segmento novo está suspenso
export default function Loading() {
  return <Carregando frase={mensagemDeCarregamento(usePathname())} />;
}
