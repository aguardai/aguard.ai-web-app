import { createClient } from '@/lib/supabase/server';
import type { Perfil } from '@/features/auth/types';
import type { DashboardKpis, DiaMetrica } from '@/features/reports/types';

const DIAS_JANELA = 30;

// Data local no formato das colunas date; toISOString usaria UTC e viraria o dia
function diaISO(data: Date) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0'),
  ].join('-');
}
// O gestor de unidade fica preso à própria unidade; a clínica escolhe o recorte
function unidadeDoRecorte(perfil: Perfil, unidadeId?: string) {
  return perfil.papel === 'unidade' ? perfil.unidade_id : (unidadeId ?? null);
}

export async function buscarKpis(
  perfil: Perfil,
  unidadeId?: string
): Promise<DashboardKpis | null> {
  const supabase = await createClient();
  const unidade = unidadeDoRecorte(perfil, unidadeId);

  if (unidade) {
    const { data, error } = await supabase
      .from('vw_dashboard_unidade')
      .select('*')
      .eq('unidade_id', unidade)
      .maybeSingle();

    if (error || !data) {
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
    return null;
  }

  return {
    ticketsHoje: data.tickets_hoje ?? 0,
    finalizadosHoje: data.finalizados_hoje ?? 0,
    aguardandoAgora: data.aguardando_agora ?? 0,
    esperaMediaHoje: data.espera_media_hoje,
    duracaoMedia30d: data.duracao_media_30d,
    canceladosHoje: data.cancelados_hoje ?? null,
    ausentesHoje: data.ausentes_hoje ?? null,
    totalGuiches: data.total_guiches ?? 0,
    totalProfissionais: data.total_profissionais ?? 0,
    totalUnidades: data.total_unidades ?? 0,
  };
}

export async function buscarSerieDiaria(
  perfil: Perfil,
  unidadeId?: string
): Promise<DiaMetrica[]> {
  const supabase = await createClient();
  const unidade = unidadeDoRecorte(perfil, unidadeId);

  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - (DIAS_JANELA - 1));

  // O teto é obrigatório: o seed carrega dias futuros e sem ele a janela de 30
  // dias passa a somar tudo o que existe daqui para frente
  let query = supabase
    .from('vw_metricas_diarias')
    .select('*')
    .gte('data_fila', diaISO(dataInicio))
    .lte('data_fila', diaISO(new Date()))
    .order('data_fila', { ascending: true });

  if (unidade) {
    query = query.eq('unidade_id', unidade);
  } else if (perfil.clinica_id) {
    query = query.eq('clinica_id', perfil.clinica_id);
  }

  const { data, error } = await query;

  if (error || !data) {
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
