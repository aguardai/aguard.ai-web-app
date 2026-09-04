import { AttendanceHistoryTable } from '@/features/attendance/components/AttendanceHistoryTable';
import {
  nomeDoPaciente,
  type AtendimentoHistoricoItem,
  type LinhaConsultaHistorico,
} from '@/features/attendance/types';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const revalidate = 0;
export const metadata = { title: 'Histórico — Aguard.ai' };

export default async function HistoricoAtendimentoPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'profissional') {
    return (
      <div className="content-container flex flex-col gap-6 py-8">
        <Alert tom="info">Este painel é exclusivo para o papel Profissional.</Alert>
      </div>
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
  const linhas = (consultas ?? []) as LinhaConsultaHistorico[];

  const historico: AtendimentoHistoricoItem[] = linhas.map((linha) => ({
    id: linha.id,
    senha: linha.senha ?? '—',
    paciente_nome: nomeDoPaciente(linha.paciente),
    created_at: linha.entrada_fila,
    started_at: linha.atendido_em,
    finished_at: linha.finalizado_em,
    status: linha.status,
  }));

  return <HistoricoLista consultas={consultas} />;
}