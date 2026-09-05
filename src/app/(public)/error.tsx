'use client';

import { TelaErro } from '@/components/ui/TelaErro';

export default function ErroPublico({ reset }: { reset: () => void }) {
  return (
    <TelaErro
      descricao="Não conseguimos carregar esta página. Verifique sua conexão e tente novamente."
      aoTentarNovamente={reset}
    />
  );
}
