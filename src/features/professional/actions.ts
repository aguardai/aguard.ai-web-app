'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import {
  convidarAcessoSchema,
  erroPorCampo,
  locacaoSchema,
  profissionalSchema,
} from '@/features/professional/schemas';
import type {
  EstadoConviteAcesso,
  EstadoFormularioLocacao,
  EstadoFormularioProfissional,
} from '@/features/professional/types';
import {
  criarLocacao,
  encerrarLocacao,
  removerLocacao,
} from '@/features/professional/services/locacao';
import {
  alternarAtivo,
  atualizarProfissional,
  convidarAcesso,
  criarProfissional,
  removerProfissional,
} from '@/features/professional/services/profissional';

function valoresDoFormulario(formData: FormData) {
  return {
    nome: String(formData.get('nome') ?? ''),
    especialidade: String(formData.get('especialidade') ?? ''),
    registroProfissional: String(formData.get('registroProfissional') ?? ''),
    email: String(formData.get('email') ?? ''),
    telefone: String(formData.get('telefone') ?? ''),
  };
}

export async function cadastrarProfissional(
  _estadoAnterior: EstadoFormularioProfissional,
  formData: FormData
): Promise<EstadoFormularioProfissional> {
  const valores = valoresDoFormulario(formData);
  const validacao = profissionalSchema.safeParse(valores);

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  const resultado = await criarProfissional(validacao.data);

  if (!resultado.sucesso) {
    return { erro: resultado.erro, valores };
  }

  revalidatePath('/profissionais');
  redirect(`/profissionais/${resultado.id}`);
}

export async function editarProfissional(
  id: string,
  _estadoAnterior: EstadoFormularioProfissional,
  formData: FormData
): Promise<EstadoFormularioProfissional> {
  const valores = valoresDoFormulario(formData);
  const validacao = profissionalSchema.safeParse(valores);

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  const resultado = await atualizarProfissional(id, validacao.data);

  if (!resultado.sucesso) {
    return { erro: resultado.erro, valores };
  }

  revalidatePath('/profissionais');
  revalidatePath(`/profissionais/${id}`);
  redirect(`/profissionais/${id}`);
}

export async function enviarConviteAcesso(
  id: string,
  _estadoAnterior: EstadoConviteAcesso,
  formData: FormData
): Promise<EstadoConviteAcesso> {
  const validacao = convidarAcessoSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validacao.success) {
    return { erro: validacao.error.issues[0]?.message ?? 'E-mail inválido.' };
  }

  const resultado = await convidarAcesso(id, validacao.data.email);

  if (!resultado.sucesso) {
    return { erro: resultado.erro };
  }

  revalidatePath(`/profissionais/${id}`);
  return { sucesso: 'Convite enviado. O profissional já pode acessar com esse e-mail.' };
}

export async function alternarAtivoProfissional(id: string, ativo: boolean) {
  const resultado = await alternarAtivo(id, ativo);

  revalidatePath('/profissionais');
  revalidatePath(`/profissionais/${id}`);

  return resultado;
}

export async function excluirProfissional(id: string) {
  const resultado = await removerProfissional(id);

  if (resultado.sucesso) {
    revalidatePath('/profissionais');
    redirect('/profissionais');
  }

  return resultado;
}
// --- Locações ----------------------------------------------------------------

export async function salvarLocacao(
  _estadoAnterior: EstadoFormularioLocacao,
  formData: FormData
): Promise<EstadoFormularioLocacao> {
  const valores = {
    profissionalId: String(formData.get('profissionalId') ?? ''),
    unidadeId: String(formData.get('unidadeId') ?? ''),
    dataInicio: String(formData.get('dataInicio') ?? ''),
    dataFim: String(formData.get('dataFim') ?? ''),
  };

  const validacao = locacaoSchema.safeParse(valores);

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  const resultado = await criarLocacao(validacao.data);

  if (!resultado.sucesso) {
    return { erro: resultado.erro, valores };
  }

  revalidatePath('/locacoes');
  revalidatePath('/profissionais');

  return { sucesso: 'Locação criada.' };
}

export async function encerrarLocacaoAction(id: string) {
  const resultado = await encerrarLocacao(id);

  revalidatePath('/locacoes');
  revalidatePath('/profissionais');

  return resultado;
}

export async function removerLocacaoAction(id: string) {
  const resultado = await removerLocacao(id);

  revalidatePath('/locacoes');
  revalidatePath('/profissionais');

  return resultado;
}
