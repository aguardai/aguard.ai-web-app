import { ITENS_POR_PAGINA, intervaloDaPagina } from '@/constants/paginacao';
import { createClient } from '@/lib/supabase/server';
import type { Pagina } from '@/types/paginacao';
import type {
  LocacaoComUnidade,
  Profissional,
  ProfissionalComLocacoes,
} from '@/features/professional/types';
import type { ProfissionalFormValues } from '@/features/professional/schemas';

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[professional] ${contexto}`, erro);
  }
}

// Lista os profissionais visíveis ao usuário logado — o RLS já resolve o
// escopo (clínica vê todos os seus, unidade só vê os alocados nela)
export async function listarProfissionais(): Promise<Profissional[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profissional')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    registrarErro('listagem', error);
    return [];
  }

  return data ?? [];
}

// Página da listagem: o total vem do count exato, não do tamanho do array
export async function listarProfissionaisPaginado(
  pagina: number,
  porPagina = ITENS_POR_PAGINA
): Promise<Pagina<Profissional>> {
  const supabase = await createClient();
  const { de, ate } = intervaloDaPagina(pagina, porPagina);

  const { data, error, count } = await supabase
    .from('profissional')
    .select('*', { count: 'exact' })
    .order('nome', { ascending: true })
    .range(de, ate);

  if (error) {
    registrarErro('listagem paginada', error);
    return { itens: [], total: 0 };
  }

  return { itens: (data ?? []) as Profissional[], total: count ?? 0 };
}

// Busca um profissional com as locações vigentes e futuras, já com o nome
// da unidade resolvido, para a tela de detalhe
export async function buscarProfissionalPorId(
  id: string
): Promise<ProfissionalComLocacoes | null> {
  const supabase = await createClient();

  const { data: profissional, error } = await supabase
    .from('profissional')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !profissional) {
    registrarErro('busca por id', error);
    return null;
  }

  const { data: locacoes, error: erroLocacoes } = await supabase
    .from('locacao')
    .select('*, unidade:unidade_id(id, nome, codigo)')
    .eq('profissional_id', id)
    .order('data_inicio', { ascending: false });

  if (erroLocacoes) {
    registrarErro('locações do profissional', erroLocacoes);
  }

  return {
    ...profissional,
    locacoes: (locacoes ?? []) as unknown as LocacaoComUnidade[],
  };
}

// clinica_id é obrigatório na tabela: resolve pelo helper de RLS
// SECURITY DEFINER em vez de reimplementar a busca do perfil aqui
async function resolverClinicaAtual(supabase: SupabaseServidor) {
  const { data, error } = await supabase.rpc('fn_clinica_atual');

  if (error || !data) {
    registrarErro('resolução da clínica atual', error);
    return null;
  }

  return data;
}

export interface UsoPlano {
  plano: string | null;
  profissionaisUsados: number;
  maxProfissionais: number;
}

// Usada na tela de cadastro para avisar a cota antes de tentar salvar —
// o bloqueio de verdade continua sendo o trigger do banco (RN 7)
export async function buscarUsoPlano(): Promise<UsoPlano | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('vw_uso_plano').select('*').maybeSingle();

  if (error || !data) {
    registrarErro('uso do plano', error);
    return null;
  }

  return {
    plano: data.plano,
    profissionaisUsados: data.profissionais_usados ?? 0,
    maxProfissionais: data.max_profissionais ?? 0,
  };
}

export interface ResultadoOperacao {
  sucesso: boolean;
  erro?: string;
  id?: string;
}

export async function criarProfissional(
  dados: ProfissionalFormValues
): Promise<ResultadoOperacao> {
  const supabase = await createClient();
  const clinicaId = await resolverClinicaAtual(supabase);

  if (!clinicaId) {
    return { sucesso: false, erro: 'Não foi possível identificar a clínica.' };
  }

  const { data, error } = await supabase
    .from('profissional')
    .insert({
      clinica_id: clinicaId,
      nome: dados.nome,
      especialidade: dados.especialidade,
      registro_profissional: dados.registroProfissional,
      email: dados.email || null,
      telefone: dados.telefone || null,
    })
    .select('id')
    .single();

  if (error) {
    registrarErro('criação', error);

    // Mensagem específica para o bloqueio de limite do plano (RN 7 do README)
    if (error.message?.toLowerCase().includes('limite')) {
      return {
        sucesso: false,
        erro: 'O plano atual atingiu o limite de profissionais cadastrados.',
      };
    }

    return { sucesso: false, erro: 'Não foi possível cadastrar o profissional.' };
  }

  return { sucesso: true, id: data.id };
}

export async function atualizarProfissional(
  id: string,
  dados: ProfissionalFormValues
): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profissional')
    .update({
      nome: dados.nome,
      especialidade: dados.especialidade,
      registro_profissional: dados.registroProfissional,
      email: dados.email || null,
      telefone: dados.telefone || null,
    })
    .eq('id', id);

  if (error) {
    registrarErro('atualização', error);
    return { sucesso: false, erro: 'Não foi possível salvar as alterações.' };
  }

  return { sucesso: true, id };
}

// Desliga/reativa o profissional sem removê-lo (mantém o histórico de
// atendimentos e locações intacto — diferente do soft delete via DELETE)
export async function alternarAtivo(
  id: string,
  ativo: boolean
): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase.from('profissional').update({ ativo }).eq('id', id);

  if (error) {
    registrarErro('alternância de status ativo', error);
    return { sucesso: false, erro: 'Não foi possível atualizar o status.' };
  }

  return { sucesso: true, id };
}

// Remoção passa pelo DELETE normal: o trigger de auditoria intercepta e
// converte em soft delete automaticamente (deleted_at/deleted_by)
export async function removerProfissional(id: string): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { error } = await supabase.from('profissional').delete().eq('id', id);

  if (error) {
    registrarErro('remoção', error);
    return { sucesso: false, erro: 'Não foi possível remover o profissional.' };
  }

  return { sucesso: true, id };
}

// Vincula um login ao profissional: cria (ou reaproveita) o auth.users e o
// perfil via RPC, depois grava o user_id retornado na linha do profissional
export async function convidarAcesso(
  id: string,
  email: string
): Promise<ResultadoOperacao> {
  const supabase = await createClient();

  const { data: userId, error: erroRpc } = await supabase.rpc('fn_vincular_usuario', {
    p_email: email,
    p_papel: 'profissional',
  });

  if (erroRpc || !userId) {
    registrarErro('convite de acesso (rpc)', erroRpc);
    return {
      sucesso: false,
      erro: 'Não foi possível enviar o convite. Verifique o e-mail informado.',
    };
  }

  const { error: erroVinculo } = await supabase
    .from('profissional')
    .update({ user_id: userId, email })
    .eq('id', id);

  if (erroVinculo) {
    registrarErro('vínculo do user_id ao profissional', erroVinculo);
    return {
      sucesso: false,
      erro: 'Convite enviado, mas não foi possível vincular ao cadastro. Avise o time.',
    };
  }

  return { sucesso: true, id };
}