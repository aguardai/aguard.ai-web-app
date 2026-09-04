import { createClient } from '@/lib/supabase/server';
import type { Perfil } from '@/features/auth/types';
import type { DashboardKpis, DiaMetrica } from '@/features/reports/types';

const DIAS_JANELA = 30;

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[reports] ${contexto}`, erro);
  }
}

export async function buscarKpis(perfil: Perfil): Promise<DashboardKpis | null> {
  const supabase = await createClient();

  if (perfil.papel === 'unidade' && perfil.unidade_id) {
    const { data, error } = await supabase
      .from('vw_dashboard_unidade')
      .select('*')
      .eq('unidade_id', perfil.unidade_id)
      .maybeSingle();

    if (error || !data) {
      registrarErro('kpis da unidade', error);
      return null;
    }

    return {
      ticketsHoje: data.tickets_hoje ?? 0,
      finalizadosHoje: data.finalizados_hoje ?? 0,
      aguardandoAgora: data.aguardando_agora ?? 0,
      esperaMediaHoje: data.espera_media_hoje,
      duracaoMedia30d: data.duracao_media_30d,
      canceladosHoje: data.cancelados_hoje ?? 0,
      ausentesHoje: data.ausentes_hoje ?? 0,
      totalGuiches: data.total_guiches ?? 0,
      totalProfissionais: data.total_profissionais ?? 0,
      totalUnidades: null,
    };
  }

  const { data, error } = await supabase
    .from('vw_dashboard_clinica')
    .select('*')
    .eq('clinica_id', perfil.clinica_id ?? '')
    .maybeSingle();

  if (error || !data) {
    registrarErro('kpis da clinica', error);
    return null;
  }

  return {
    ticketsHoje: data.tickets_hoje ?? 0,
    finalizadosHoje: data.finalizados_hoje ?? 0,
    aguardandoAgora: data.aguardando_agora ?? 0,
    esperaMediaHoje: data.espera_media_hoje,
    duracaoMedia30d: data.duracao_media_30d,
    canceladosHoje: null,
    ausentesHoje: null,
    totalGuiches: data.total_guiches ?? 0,
    totalProfissionais: data.total_profissionais ?? 0,
    totalUnidades: data.total_unidades ?? 0,
  };
}

export async function buscarSerieDiaria(perfil: Perfil): Promise<DiaMetrica[]> {
  const supabase = await createClient();

  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - (DIAS_JANELA - 1));
  const dataInicioIso = dataInicio.toISOString().slice(0, 10);

  let query = supabase
    .from('vw_metricas_diarias')
    .select('*')
    .gte('data_fila', dataInicioIso)
    .order('data_fila', { ascending: true });

  if (perfil.papel === 'unidade' && perfil.unidade_id) {
    query = query.eq('unidade_id', perfil.unidade_id);
  } else if (perfil.clinica_id) {
    query = query.eq('clinica_id', perfil.clinica_id);
  }

  const { data, error } = await query;

  if (error || !data) {
    registrarErro('serie diaria', error);
    return [];
  }

  const porDia = new Map<string, DiaMetrica>();
  const esperaPonderada = new Map<string, number>();

  for (const linha of data) {
    const chave = linha.data_fila as string;
    const atual = porDia.get(chave) ?? {
      data: chave,
      totalTickets: 0,
      finalizados: 0,
      cancelados: 0,
      ausentes: 0,
      esperaMediaMinutos: null,
    };

    const finalizados = linha.finalizados ?? 0;

    atual.totalTickets += linha.total_tickets ?? 0;
    atual.finalizados += finalizados;
    atual.cancelados += linha.cancelados ?? 0;
    atual.ausentes += linha.ausentes ?? 0;

    esperaPonderada.set(
      chave,
      (esperaPonderada.get(chave) ?? 0) + (linha.espera_media_minutos ?? 0) * finalizados
    );

    porDia.set(chave, atual);
  }

  // A espera do dia é ponderada pelos finalizados: cada linha da view é um par
  // (unidade, tipo de fila), e a média das médias distorce o resultado
  for (const [chave, dia] of porDia) {
    dia.esperaMediaMinutos =
      dia.finalizados > 0 ? (esperaPonderada.get(chave) ?? 0) / dia.finalizados : null;
  }

  return Array.from(porDia.values()).sort((a, b) => a.data.localeCompare(b.data));
}
