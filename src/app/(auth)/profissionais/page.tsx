// Lista de profissionais — listagem com busca e filtros
// Acesso: CLINICA, UNIDADE (somente leitura)
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

export default function ProfissionaisPage() {
  return (
    <TelaPlaceholder
      titulo="Profissionais"
      rota="/profissionais"
      detalhe="Listagem dos profissionais com busca e filtros."
    />
  );
}
