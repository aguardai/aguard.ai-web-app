import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { AttendancePanel } from '@/features/attendance/components/AttendancePainel';
import {
  nomeDoPaciente,
  type LinhaConsultaFila,
  type TicketAtendimento,
} from '@/features/attendance/types';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function AtendimentoPage() {
  const supabase = await createClient();

  // 1. Obtém o usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Localiza o ID do profissional vinculado ao Auth (por user_id ou e-mail)
  const { data: profissional } = await supabase
    .from('profissional')
    .select('id')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();

  if (!profissional) {
    return (
      <AttendancePanel
        pacienteAtualInicial={null}
        filaInicial={[]}
        onChamarProximo={async () => {}}
        onFinalizarAtendimento={async () => {}}
      />
    );
  }

  // 3. Busca o paciente atualmente em consulta/chamado para o médico logado
  const { data: pacienteAtualDb } = await supabase
    .from('consulta')
    .select(`
      id,
      senha,
      status,
      entrada_fila,
      tipo_consulta,
      paciente:paciente_id (
        nome
      )
    `)
    .eq('profissional_id', profissional.id)
    .in('status', ['em_atendimento', 'chamado'])
    .order('entrada_fila', { ascending: true })
    .maybeSingle();

  // 4. Busca os pacientes aguardando na fila do profissional
  const { data: filaEsperaDb } = await supabase
    .from('consulta')
    .select(`
      id,
      senha,
      status,
      entrada_fila,
      tipo_consulta,
      paciente:paciente_id (
        nome
      )
    `)
    .eq('profissional_id', profissional.id)
    .eq('status', 'aguardando')
    .order('posicao', { ascending: true });

  // Mapeamento dos dados do banco para a interface
  const emAtendimento = pacienteAtualDb as LinhaConsultaFila | null;
  const aguardando = (filaEsperaDb ?? []) as LinhaConsultaFila[];

  function paraTicket(linha: LinhaConsultaFila): TicketAtendimento {
    return {
      id: linha.id,
      senha: linha.senha ?? '—',
      paciente_nome: nomeDoPaciente(linha.paciente),
      created_at: linha.entrada_fila,
      status: linha.status,
      tipo_servico: linha.tipo_consulta || 'Consulta',
    };
  }

  const pacienteAtual: TicketAtendimento | null = emAtendimento
    ? paraTicket(emAtendimento)
    : null;

  const fila: TicketAtendimento[] = aguardando.map(paraTicket);

  // Server Action para chamar o próximo paciente usando a RPC oficial do banco ou UPDATE
  async function chamarProximoAction() {
    'use server';
    const supabaseServer = await createClient();

    if (fila.length > 0) {
      const proximo = fila[0];
      await supabaseServer
        .from('consulta')
        .update({
          status: 'em_atendimento',
          atendido_em: new Date().toISOString(),
        })
        .eq('id', proximo.id);
    }

    revalidatePath('/atendimento');
  }

  // Server Action para finalizar a consulta atual
  async function finalizarAtendimentoAction() {
    'use server';
    if (pacienteAtual) {
      const supabaseServer = await createClient();
      await supabaseServer
        .from('consulta')
        .update({
          status: 'finalizado',
          finalizado_em: new Date().toISOString(),
        })
        .eq('id', pacienteAtual.id);
    }

    revalidatePath('/atendimento');
  }

  return (
    <AttendancePanel
      pacienteAtualInicial={pacienteAtual}
      filaInicial={fila}
      onChamarProximo={chamarProximoAction}
      onFinalizarAtendimento={finalizarAtendimentoAction}
    />
  );
}