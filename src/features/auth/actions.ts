'use server';

import { redirect } from 'next/navigation';

import type { PlanoId } from '@/constants/planos';
import { cadastroClinicaSchema, erroPorCampo, loginSchema } from '@/features/auth/schemas';
import {
  buscarNomeClinicaDoUsuario,
  buscarPerfil,
  criarClinicaAPartirDosMetadados,
  resolverClinicaPendente,
  salvarTransacaoPendente,
  voltarParaStarter,
} from '@/features/auth/services/cadastro';
import { rotaPorPapel } from '@/features/auth/services/sessao';
import type { EstadoFormulario } from '@/features/auth/types';
import {
  consultarStatusPagamento,
  iniciarPagamentoPlano,
} from '@/features/billing/services/pagamento';
import type { DadosCheckout } from '@/features/billing/types';
import { createClient } from '@/lib/supabase/server';

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

  // Usuário criado no Auth. O Starter não depende de pagamento: cria a clínica
  // se já houver sessão, senão espera a confirmação do e-mail
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

// Chamada pelo checkout depois que o usuário já existe no Auth. Recusa não
// apaga a conta: ela cai para o Starter
export async function confirmarPagamentoCadastro(
  usuarioId: string,
  plano: PlanoId,
  dados: DadosCheckout
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

  // Cartão aprova na hora: cria a clínica já, sem esperar o próximo login
  const nomeClinica = await buscarNomeClinicaDoUsuario(usuarioId);

  if (nomeClinica) {
    const supabase = await createClient();
    await criarClinicaAPartirDosMetadados(supabase, { nome_clinica: nomeClinica, plano });
  }

  return { statusPagamento: 'aprovado' };
}

// Polling do Pix pelo checkout do cadastro
export async function verificarPagamentoCadastro(
  transacaoId: string,
  usuarioId: string
): Promise<EstadoFormulario> {
  const { status } = await consultarStatusPagamento(transacaoId);

  if (status === 'recusado') {
    await voltarParaStarter(usuarioId);
  }

  return { statusPagamento: status };
}

// Retomada manual pela tela /pagamento-pendente
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
