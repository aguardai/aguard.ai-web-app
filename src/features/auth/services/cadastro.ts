// Criação da clínica após o cadastro e a resolução do pagamento do plano
import type { PlanoId } from '@/constants/planos';
import { metadadosCadastroSchema } from '@/features/auth/schemas';
import { consultarStatusPagamento } from '@/features/billing/services/pagamento';
import type { PapelUsuario } from '@/features/auth/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

export interface PerfilMinimo {
  clinica_id: string | null;
  papel: PapelUsuario;
}

export type ResolucaoClinica = 'criada' | 'pagamento_pendente' | 'falhou' | 'nao_aplicavel';

interface MetadadosClinica {
  nome_clinica: string;
  plano: PlanoId;
}

export async function buscarPerfil(
  supabase: SupabaseServidor,
  usuarioId: string
): Promise<PerfilMinimo | null> {
  const { data } = await supabase
    .from('perfil')
    .select('clinica_id, papel')
    .eq('id', usuarioId)
    .maybeSingle();

  return (data as PerfilMinimo | null) ?? null;
}

// O trigger trg_clinica_vincular_admin liga o perfil do usuário à clínica criada
export async function criarClinicaAPartirDosMetadados(
  supabase: SupabaseServidor,
  metadados: MetadadosClinica
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;

  const { error } = await supabase.from('clinica').insert({
    nome: metadados.nome_clinica,
    email: user.email,
    plano: metadados.plano,
  });

  return !error;
}

// Os metadados do usuário guardam o cadastro até a clínica existir; o service
// role é necessário porque, sem clínica, o usuário ainda não tem perfil completo
async function atualizarMetadados(
  usuarioId: string,
  alterar: (atuais: Record<string, unknown>) => Record<string, unknown>
) {
  const admin = createAdminClient();

  const {
    data: { user },
  } = await admin.auth.admin.getUserById(usuarioId);

  await admin.auth.admin.updateUserById(usuarioId, {
    user_metadata: alterar(user?.user_metadata ?? {}),
  });
}

export function salvarTransacaoPendente(usuarioId: string, transacaoId: string) {
  return atualizarMetadados(usuarioId, (atuais) => ({ ...atuais, transacao_id: transacaoId }));
}

// Pagamento recusado nunca apaga a conta: ela volta para o Starter, que é grátis
export function voltarParaStarter(usuarioId: string) {
  return atualizarMetadados(usuarioId, (atuais) => {
    const metadados: Record<string, unknown> = { ...atuais, plano: 'starter' };
    delete metadados.transacao_id;

    return metadados;
  });
}

export async function buscarNomeClinicaDoUsuario(usuarioId: string): Promise<string | null> {
  const admin = createAdminClient();

  const {
    data: { user },
  } = await admin.auth.admin.getUserById(usuarioId);

  const nome = user?.user_metadata?.nome_clinica;

  return typeof nome === 'string' ? nome : null;
}

// Roda no login: decide o que fazer com um usuário que ainda não tem clínica.
// - Não é dono de clínica ou já tem uma → nao_aplicavel, segue normal.
// - Starter → cria a clínica na hora, nunca dependeu de pagamento.
// - Pago sem transacao_id → fechou a aba antes de pagar, cai para o Starter.
// - Pago com transacao_id → reconsulta o status ao vivo no gateway.
export async function resolverClinicaPendente(
  supabase: SupabaseServidor,
  usuarioId: string
): Promise<ResolucaoClinica> {
  const perfil = await buscarPerfil(supabase, usuarioId);

  if (!perfil || perfil.papel !== 'clinica' || perfil.clinica_id) {
    return 'nao_aplicavel';
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadados = metadadosCadastroSchema.safeParse(user?.user_metadata ?? {});

  if (!metadados.success) {
    return 'nao_aplicavel';
  }

  if (metadados.data.plano === 'starter') {
    const criada = await criarClinicaAPartirDosMetadados(supabase, metadados.data);
    return criada ? 'criada' : 'falhou';
  }

  const status = metadados.data.transacao_id
    ? await consultarStatusPagamento(metadados.data.transacao_id)
    : { status: 'recusado' as const };

  if (status.status === 'pendente') {
    return 'pagamento_pendente';
  }

  if (status.status === 'recusado') {
    await voltarParaStarter(usuarioId);
  }

  const criada = await criarClinicaAPartirDosMetadados(supabase, {
    ...metadados.data,
    plano: status.status === 'aprovado' ? metadados.data.plano : 'starter',
  });

  return criada ? 'criada' : 'falhou';
}
