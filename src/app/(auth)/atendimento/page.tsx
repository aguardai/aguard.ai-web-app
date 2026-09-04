import { Alert } from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/server';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { listarFilaConsulta } from '@/features/attendance/services/consulta';
import { FilaConsultaLista } from '@/features/attendance/components/FilaConsultaLista';

export const metadata = { title: 'Minha Fila — Aguard.ai' };

export default async function AtendimentoPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'profissional') {
    return (
      <div className="content-container flex flex-col gap-6 py-8">
        <Alert tom="info">Este painel é exclusivo para o papel Profissional.</Alert>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: profissionalId } = await supabase.rpc('fn_profissional_atual');
  const fila = await listarFilaConsulta();

  return <FilaConsultaLista fila={fila} profissionalId={profissionalId ?? ''} />;
}