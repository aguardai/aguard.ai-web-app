import { ehPlanoValido } from '@/constants/planos';
import type { Perfil } from '@/features/auth/types';
import type { PontoDiario, ResumoDashboard, ResumoUnidade } from '@/features/reports/types';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
// Datas no formato 'YYYY-MM-DD' das colunas data_fila
function diaISO(deslocamentoEmDias = 0) {
  const data = new Date();
  data.setDate(data.getDate() + deslocamentoEmDias);

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

async function resumoDaClinica(): Promise<ResumoDashboard | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vw_dashboard_clinica')
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const linha = data as Tables<'vw_dashboard_clinica'>;

  return {
    escopo: 'clinica',
    titulo: linha.clinica_nome ?? 'Minha clínica',
    plano: ehPlanoValido(linha.plano) ? linha.plano : null,
    totalUnidades: linha.total_unidades ?? 0,
    totalGuiches: linha.total_guiches ?? 0,
    totalProfissionais: linha.total_profissionais ?? 0,
    ticketsHoje: linha.tickets_hoje ?? 0,
    finalizadosHoje: linha.finalizados_hoje ?? 0,
    aguardandoAgora: linha.aguardando_agora ?? 0,
    esperaMediaHoje: linha.espera_media_hoje,
    duracaoMedia30d: linha.duracao_media_30d,
  };
}

async function resumoDaUnidade(unidadeId: string): Promise<ResumoDashboard | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vw_dashboard_unidade')
    .select('*')
    .eq('unidade_id', unidadeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const linha = data as Tables<'vw_dashboard_unidade'>;

  return {
    escopo: 'unidade',
    titulo: linha.unidade_nome ?? 'Minha unidade',
    plano: null,
    totalUnidades: null,
    totalGuiches: linha.total_guiches ?? 0,
    totalProfissionais: linha.total_profissionais ?? 0,
    ticketsHoje: linha.tickets_hoje ?? 0,
    finalizadosHoje: linha.finalizados_hoje ?? 0,
    aguardandoAgora: linha.aguardando_agora ?? 0,
    esperaMediaHoje: linha.espera_media_hoje,
    duracaoMedia30d: linha.duracao_media_30d,
  };
}

// A clínica vê o consolidado; a unidade vê apenas os próprios números
export async function buscarResumoDashboard(
  perfil: Perfil
): Promise<ResumoDashboard | null> {
  if (perfil.papel === 'unidade' && perfil.unidade_id) {
    return resumoDaUnidade(perfil.unidade_id);
  }

  return resumoDaClinica();
}

// Série dos últimos dias com os dias sem movimento preenchidos com zero
export async function buscarSerieDiaria(
  dias: number,
  unidadeId?: string | null
): Promise<PontoDiario[]> {
  const supabase = await createClient();
  const inicio = diaISO(-(dias - 1));

  let consulta = supabase
    .from('vw_metricas_diarias')
    .select('data_fila, total_tickets, finalizados, espera_media_minutos')
    .gte('data_fila', inicio)
    .lte('data_fila', diaISO());

  if (unidadeId) {
    consulta = consulta.eq('unidade_id', unidadeId);
  }

  const { data, error } = await consulta;

  if (error) {
    return [];
  }

  const linhas = (data ?? []) as Tables<'vw_metricas_diarias'>[];
  const acumulado = new Map<string, { total: number; finalizados: number; somaEspera: number }>();

  for (const linha of linhas) {
    if (!linha.data_fila) continue;

    const atual = acumulado.get(linha.data_fila) ?? {
      total: 0,
      finalizados: 0,
      somaEspera: 0,
    };

    const finalizados = linha.finalizados ?? 0;

    atual.total += linha.total_tickets ?? 0;
    atual.finalizados += finalizados;
    atual.somaEspera += (linha.espera_media_minutos ?? 0) * finalizados;

    acumulado.set(linha.data_fila, atual);
  }

  return Array.from({ length: dias }, (_, indice) => {
    const data = diaISO(indice - (dias - 1));
    const valores = acumulado.get(data);

    if (!valores) {
      return { data, total: 0, finalizados: 0, esperaMedia: null };
    }

    return {
      data,
      total: valores.total,
      finalizados: valores.finalizados,
      esperaMedia:
        valores.finalizados > 0 ? valores.somaEspera / valores.finalizados : null,
    };
  });
}

// Painel por unidade, usado só no dashboard da clínica
export async function listarResumoUnidades(): Promise<ResumoUnidade[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vw_dashboard_unidade')
    .select('*')
    .order('unidade_nome', { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as Tables<'vw_dashboard_unidade'>[])
    .filter((linha) => linha.unidade_id !== null)
    .map((linha) => ({
      unidadeId: linha.unidade_id as string,
      nome: linha.unidade_nome ?? 'Unidade',
      totalGuiches: linha.total_guiches ?? 0,
      ticketsHoje: linha.tickets_hoje ?? 0,
      aguardandoAgora: linha.aguardando_agora ?? 0,
      esperaMediaHoje: linha.espera_media_hoje,
    }));
}
