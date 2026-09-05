'use client';

import { TelaErro } from '@/components/ui/TelaErro';

export default function ErroAutenticado({ reset }: { reset: () => void }) {
  return <TelaErro aoTentarNovamente={reset} />;
}
