import { createClient } from '@/lib/supabase/server';
import type { PlanoId } from '@/constants/planos';
import type { Clinica, UsoPlanoDetalhado } from '@/features/clinic/types';

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[clinic] ${contexto}`, erro);
  }
}

export async function buscarClinicaAtual(): Promise<Clinica | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('clinica').select('*').maybeSingle();

  if (error || !data) {
    registrarErro('busca da clinica', error);
    return null;
  }

  return data as Clinica;
}

export async function buscarUsoPlanoDetalhado(): Promise<UsoPlanoDetalhado | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('vw_uso_plano').select('*').maybeSingle();

  if (error || !data) {
    registrarErro('uso do plano', error);
    return null;
  }

  return {
    plano: data.plano as PlanoId,
    precoMensalSimulado: data.preco_mensal_simulado ?? 0,
    maxUnidades: data.max_unidades ?? 0,
    maxGuiches: data.max_guiches ?? 0,
    maxProfissionais: data.max_profissionais ?? 0,
    maxTicketsMes: data.max_tickets_mes ?? 0,
    unidadesUsadas: data.unidades_usadas ?? 0,
    guichesUsados: data.guiches_usados ?? 0,
    profissionaisUsados: data.profissionais_usados ?? 0,
    ticketsNoMes: data.tickets_no_mes ?? 0,
  };
}
