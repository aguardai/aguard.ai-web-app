// Dashboard principal — KPIs do dia, resumo de filas ativas, atalhos rápidos
// Acesso: CLINICA, UNIDADE
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

export default function DashboardPage() {
  return (
    <TelaPlaceholder
      titulo="Dashboard"
      rota="/dashboard"
      detalhe="KPIs do dia, filas ativas e atalhos rápidos."
    />
  );
}
