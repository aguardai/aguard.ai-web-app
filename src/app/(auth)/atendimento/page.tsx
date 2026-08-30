// Painel do profissional — fila de consulta com os pacientes encaminhados
// Acesso: PROFISSIONAL
import { TelaPlaceholder } from '@/components/ui/TelaPlaceholder';

export default function AtendimentoPage() {
  return (
    <TelaPlaceholder
      titulo="Minha Fila"
      rota="/atendimento"
      detalhe="Pacientes encaminhados da recepção para você."
    />
  );
}
