import { AttendanceHistoryTable } from '@/features/attendance/components/AttendanceHistoryTable';
import type { AtendimentoHistoricoItem } from '@/features/attendance/types';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function HistoricoAtendimentoPage() {
  const supabase = await createClient();

  // 1. Obtém o usuário logado no Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Localiza o registro do profissional logado
  const { data: profissional } = await supabase
    .from('profissional')
    .select('id')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();

  if (!profissional) {
    return (
      <AttendanceHistoryTable historico={[]} />
    );
  }

  // 3. Consulta as consultas do profissional (Fila 2) ordenadas por data
  const { data: consultas, error } = await supabase
    .from('consulta')
    .select(`
      id,
      senha,
      status,
      entrada_fila,
      atendido_em,
      finalizado_em,
      paciente:paciente_id (
        nome
      )
    `)
    .eq('profissional_id', profissional.id)
    .order('entrada_fila', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórico de consultas:', error);
  }

  // 4. Mapeia o resultado para o tipo exigido pelo componente
  const historico: AtendimentoHistoricoItem[] = (consultas || []).map((item: any) => ({
    id: item.id,
    senha: item.senha,
    paciente_nome: item.paciente?.nome || 'Paciente sem nome',
    created_at: item.entrada_fila,
    started_at: item.atendido_em,
    finished_at: item.finalizado_em,
    status: item.status,
  }));

  return <AttendanceHistoryTable historico={historico} />;
}