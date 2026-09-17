'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { iniciarPagamentoPlano, consultarStatusPagamento } from '@/features/billing/services/pagamento';
import type { MetodoPagamento } from '@/lib/payment/types';
import type { PlanoId } from '@/constants/planos';
import {
  cadastroClinicaSchema,
  erroPorCampo,
  loginSchema,
  metadadosCadastroSchema,
} from '@/features/auth/schemas';
import { rotaPorPapel } from '@/features/auth/services/sessao';
import type { EstadoFormulario, PapelUsuario } from '@/features/auth/types';

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

interface PerfilMinimo {
  clinica_id: string | null;
  papel: PapelUsuario;
}

type ResolucaoClinica = 'criada' | 'pagamento_pendente' | 'nao_aplicavel';

function gerarSlugClinica(nome: string) {
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);

  return `${base || 'clinica'}-${Math.random().toString(36).slice(2, 8)}`;
}

async function buscarPerfil(
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

async function criarClinicaAPartirDosMetadados(
  supabase: SupabaseServidor,
  metadados: { nome_clinica: string; plano: PlanoId }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('clinica').insert({
    nome: metadados.nome_clinica,
    slug: gerarSlugClinica(metadados.nome_clinica),
    email: user.email,
    plano: metadados.plano,
  });
}

async function salvarTransacaoPendente(usuarioId: string, transacaoId: string) {
  const admin = createAdminClient();

  const {
    data: { user },
  } = await admin.auth.admin.getUserById(usuarioId);

  await admin.auth.admin.updateUserById(usuarioId, {
    user_metadata: { ...user?.user_metadata, transacao_id: transacaoId },
  });
}

// Nunca apaga a conta por pagamento recusado — sempre volta pro Starter,
// que não depende de pagamento nenhum
async function voltarParaStarter(usuarioId: string) {
  const admin = createAdminClient();

  const {
    data: { user },
  } = await admin.auth.admin.getUserById(usuarioId);

  const { transacao_id, ...metadadosRestantes } = (user?.user_metadata ?? {}) as Record<string, unknown>;

  await admin.auth.admin.updateUserById(usuarioId, {
    user_metadata: { ...metadadosRestantes, plano: 'starter' },
  });
}

// Roda no login: decide o que fazer com um usuário que ainda não tem clínica.
// - Não é dono de clínica (unidade/profissional) ou já tem uma → nao_aplicavel, segue normal.
// - Starter → cria a clínica na hora, nunca dependeu de pagamento.
// - Pago sem transacao_id salvo → nunca chegou a tentar pagar, apaga a conta.
// - Pago com transacao_id salvo → reconsulta o status ao vivo com o gateway.
async function resolverClinicaPendente(
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
    await criarClinicaAPartirDosMetadados(supabase, metadados.data);
    return 'criada';
  }

  if (!metadados.data.transacao_id) {
    // Fechou a aba antes de tentar pagar — mesma política: cai para o Starter
    await voltarParaStarter(usuarioId);
    await criarClinicaAPartirDosMetadados(supabase, { ...metadados.data, plano: 'starter' });
    return 'criada';
  }

  const status = await consultarStatusPagamento(metadados.data.transacao_id);

  if (status.status === 'aprovado') {
    await criarClinicaAPartirDosMetadados(supabase, metadados.data);
    return 'criada';
  }

  if (status.status === 'recusado') {
    await voltarParaStarter(usuarioId);
    await criarClinicaAPartirDosMetadados(supabase, { ...metadados.data, plano: 'starter' });
    return 'criada';
  }

  return 'pagamento_pendente';
}

export async function entrar(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const valores = { email: String(formData.get('email') ?? '') };

  const validacao = loginSchema.safeParse({
    email: formData.get('email'),
    senha: formData.get('senha'),
  });

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: validacao.data.email.toLowerCase(),
    password: validacao.data.senha,
  });

  if (error || !data.user) {
    return { erro: 'E-mail ou senha incorretos.', valores };
  }

  const resolucao = await resolverClinicaPendente(supabase, data.user.id);

  if (resolucao === 'pagamento_pendente') {
    redirect('/pagamento-pendente');
  }

  const perfil = await buscarPerfil(supabase, data.user.id);
  redirect(rotaPorPapel(perfil?.papel));
}

export async function cadastrar(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const valores = {
    nome: String(formData.get('nome') ?? ''),
    nomeClinica: String(formData.get('nomeClinica') ?? ''),
    email: String(formData.get('email') ?? ''),
    plano: String(formData.get('plano') ?? ''),
  };

  const validacao = cadastroClinicaSchema.safeParse({
    nome: formData.get('nome'),
    nomeClinica: formData.get('nomeClinica'),
    email: formData.get('email'),
    senha: formData.get('senha'),
    confirmarSenha: formData.get('confirmarSenha'),
    plano: formData.get('plano'),
  });

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  const { nome, nomeClinica, email, senha, plano } = validacao.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password: senha,
    options: { data: { nome, nome_clinica: nomeClinica, plano } },
  });

  if (error) {
    return {
      erro:
        error.status === 422 || error.status === 400
          ? 'Não foi possível criar a conta com esses dados. Confira o e-mail e a senha.'
          : 'Não foi possível criar a conta agora. Tente novamente em instantes.',
      valores,
    };
  }

  if (data.user && data.user.identities?.length === 0) {
    return { erro: 'Já existe uma conta com este e-mail. Faça login.', valores };
  }

  // A partir daqui o cadastro foi aprovado pelo Supabase: usuário criado no Auth.
  if (plano === 'starter') {
    if (data.session && data.user) {
      await criarClinicaAPartirDosMetadados(supabase, { nome_clinica: nomeClinica, plano });
      redirect('/dashboard');
    }

    return {
      sucesso: 'Conta criada. Confirme o e-mail que enviamos para ativar o acesso e entrar.',
    };
  }

  if (!data.user) {
    return { erro: 'Não foi possível concluir o cadastro agora. Tente novamente.', valores };
  }

  return { aguardandoPagamento: true, usuarioId: data.user.id, valores };
}

// Chamado pelo modal de pagamento depois que o cadastro já foi aprovado.
// Se recusar, desfaz o cadastro (apaga o usuário) — nunca deixa conta sem plano pago.
export async function confirmarPagamentoCadastro(
  usuarioId: string,
  plano: PlanoId,
  dados: { metodo: MetodoPagamento; emailPagador?: string; statusTeste?: string }
): Promise<EstadoFormulario> {
  const resultado = await iniciarPagamentoPlano(plano, dados);

  if (resultado.status === 'pendente') {
    if (resultado.transacaoId) {
      await salvarTransacaoPendente(usuarioId, resultado.transacaoId);
    }

    return {
      statusPagamento: 'pendente',
      transacaoId: resultado.transacaoId,
      pix: resultado.pix,
      usuarioId,
    };
  }

  if (!resultado.sucesso) {
    await voltarParaStarter(usuarioId);
    return { statusPagamento: 'recusado' };
  }
  
  // aprovado na hora (cartão) — cria a clínica já, não espera o próximo login
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.admin.getUserById(usuarioId);
  const nomeClinica = user?.user_metadata?.nome_clinica;

  if (nomeClinica) {
    await criarClinicaAPartirDosMetadados(supabase, { nome_clinica: nomeClinica, plano });
  } 
  return { statusPagamento: 'aprovado' };
}

// Polling do Pix, chamado pelo modal enquanto o pagamento estiver pendente
export async function verificarPagamentoCadastro(
  transacaoId: string,
  usuarioId: string
): Promise<EstadoFormulario> {
  const status = await consultarStatusPagamento(transacaoId);

  if (status.status === 'recusado') {
    await voltarParaStarter(usuarioId);
    return { statusPagamento: 'recusado' };
  }
  
  if (status.status !== 'aprovado') {
    return { statusPagamento: 'pendente' };
  }
  
  return { statusPagamento: 'aprovado' };
}

// Retomada manual, chamada pela tela /pagamento-pendente
export async function verificarPagamentoPendente() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const resolucao = await resolverClinicaPendente(supabase, user.id);

  if (resolucao === 'criada') redirect('/dashboard');

}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function iniciarCadastroClinica() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/cadastro');
}