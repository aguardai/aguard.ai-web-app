// Gestão dos guichês — postos que consomem a fila compartilhada da unidade
// Acesso: CLINICA, UNIDADE
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

export default function GuichesPage() {
  return (
    <TelaPlaceholder
      titulo="Guichês"
      rota="/guiches"
      detalhe="Postos que chamam a fila compartilhada da unidade."
    />
  );
}
