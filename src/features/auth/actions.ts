'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
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

function registrarErro(contexto: string, erro: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[auth] ${contexto}`, erro);
  }
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

// Cria a clínica a partir dos dados guardados no cadastro. Roda também no primeiro
// login, para cobrir o caso em que o cadastro parou na confirmação de e-mail.
async function garantirClinica(supabase: SupabaseServidor, usuarioId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const perfil = await buscarPerfil(supabase, usuarioId);

  if (!perfil || perfil.papel !== 'clinica' || perfil.clinica_id) {
    return;
  }

  const metadados = metadadosCadastroSchema.safeParse(user.user_metadata ?? {});

  if (!metadados.success) {
    return;
  }

  const { error } = await supabase.from('clinica').insert({
    nome: metadados.data.nome_clinica,
    email: user.email,
    plano: metadados.data.plano,
  });

  if (error) {
    registrarErro('criação da clínica', error);
  }
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
    registrarErro('login', error);
    return { erro: 'E-mail ou senha incorretos.', valores };
  }

  await garantirClinica(supabase, data.user.id);

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
    registrarErro('cadastro', error);
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

  if (!data.session || !data.user) {
    return {
      sucesso:
        'Conta criada. Confirme o e-mail que enviamos para ativar o acesso e entrar.',
    };
  }

  await garantirClinica(supabase, data.user.id);

  redirect('/dashboard');
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect('/');
}
