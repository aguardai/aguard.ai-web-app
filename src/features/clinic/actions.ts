'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { obterPlano, type Plano, type PlanoId } from '@/constants/planos';
import { consultarStatusPagamento } from '@/features/billing/services/pagamento';
import {
  buscarClinica,
  buscarUsoPlano,
  atualizarClinica,
  trocarPlano,
} from '@/features/clinic/services/clinica';
import {
  alternarAtivoGuiche,
  atualizarGuiche,
  criarGuiche,
  removerGuiche,
} from '@/features/clinic/services/guiche';
import {
  alternarAtivaUnidade,
  atualizarUnidade as atualizarUnidadeNoBanco,
  criarUnidade as criarUnidadeNoBanco,
  removerUnidade,
} from '@/features/clinic/services/unidade';
import {
  clinicaSchema,
  erroPorCampo,
  guicheSchema,
  trocaPlanoSchema,
  unidadeSchema,
} from '@/features/clinic/schemas';
import type {
  EstadoFormularioClinica,
  EstadoFormularioGuiche,
  EstadoFormularioUnidade,
  EstadoTrocaPlano,
  UsoPlano,
} from '@/features/clinic/types';

function revalidarTelasDaClinica() {
  revalidatePath('/clinica');
  revalidatePath('/dashboard');
}

function revalidarTelasDaUnidade(id?: string) {
  revalidatePath('/unidades');
  revalidatePath('/dashboard');

  if (id) {
    revalidatePath(`/unidades/${id}`);
  }
}

export async function salvarClinica(
  _estadoAnterior: EstadoFormularioClinica,
  formData: FormData
): Promise<EstadoFormularioClinica> {
  const valores = {
    nome: String(formData.get('nome') ?? ''),
    email: String(formData.get('email') ?? ''),
    telefone: String(formData.get('telefone') ?? ''),
    endereco: String(formData.get('endereco') ?? ''),
  };

  const validacao = clinicaSchema.safeParse(valores);

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  const clinica = await buscarClinica();

  if (!clinica) {
    return { erro: 'Não foi possível identificar a clínica.', valores };
  }

  const resultado = await atualizarClinica(clinica.id, validacao.data);

  if (!resultado.sucesso) {
    return { erro: resultado.erro, valores };
  }

  revalidarTelasDaClinica();
  return { sucesso: 'Dados da clínica atualizados.' };
}

// O plano novo precisa comportar o que já está cadastrado: os limites do banco
// só barram inserções novas, então a redução é validada aqui
function recursoAcimaDoLimite(uso: UsoPlano, limites: Plano['limites']) {
  const comparacoes: [string, number, number][] = [
    ['unidades', uso.unidades.usado, limites.unidades],
    ['guichês', uso.guiches.usado, limites.guiches],
    ['profissionais', uso.profissionais.usado, limites.profissionais],
    ['atendimentos no mês', uso.ticketsMes.usado, limites.ticketsMes],
  ];

  return comparacoes.find(([, usado, limite]) => usado > limite);
}

// Roda ANTES de abrir o modal de pagamento — evita cobrar por uma troca que
// já sabemos que vai ser recusada por excesso de uso
export async function validarTrocaPlano(planoId: PlanoId) {
  const plano = obterPlano(planoId);
  const uso = await buscarUsoPlano();

  if (!plano || !uso) {
    return { ok: false as const, erro: 'Não foi possível carregar os dados do plano.' };
  }

  const excedente = recursoAcimaDoLimite(uso, plano.limites);

  if (excedente) {
    const [recurso, usado, limite] = excedente;
    return {
      ok: false as const,
      erro: `O plano ${plano.nome} permite ${limite} ${recurso} e a clínica já tem ${usado}. Reduza antes de trocar.`,
    };
  }

  return { ok: true as const };
}

export async function alterarPlano(
  _estadoAnterior: EstadoTrocaPlano,
  formData: FormData
): Promise<EstadoTrocaPlano> {
  const validacao = trocaPlanoSchema.safeParse({ plano: formData.get('plano') });

  if (!validacao.success) {
    return { erro: 'Selecione um plano válido.' };
  }

  const plano = obterPlano(validacao.data.plano);
  const [clinica, validacaoLimite] = await Promise.all([
    buscarClinica(),
    validarTrocaPlano(validacao.data.plano),
  ]);

  if (!plano || !clinica) {
    return { erro: 'Não foi possível carregar os dados do plano.' };
  }

  if (clinica.plano === plano.id) {
    return { sucesso: `A clínica já está no plano ${plano.nome}.` };
  }

  if (!validacaoLimite.ok) {
    return { erro: validacaoLimite.erro };
  }

  // Plano pago exige prova de pagamento aprovado — o servidor sempre reconfirma
  // esse transacaoId com o gateway, nunca confia só na chamada do client
  if (plano.precoMensal > 0) {
    const transacaoId = String(formData.get('transacaoId') ?? '');

    if (!transacaoId) {
      return { erro: 'Conclua o pagamento antes de trocar de plano.' };
    }

    const status = await consultarStatusPagamento(transacaoId);

    if (status.status !== 'aprovado') {
      return { erro: 'Não conseguimos confirmar o pagamento. Tente novamente.' };
    }
  }

  const resultado = await trocarPlano(clinica.id, plano.id);

  if (!resultado.sucesso) {
    return { erro: resultado.erro };
  }

  revalidarTelasDaClinica();
  return { sucesso: `Plano alterado para ${plano.nome}.` };
}

// --- Guichês -----------------------------------------------------------------

function valoresDoGuiche(formData: FormData) {
  return {
    unidadeId: String(formData.get('unidadeId') ?? ''),
    nome: String(formData.get('nome') ?? ''),
    codigo: String(formData.get('codigo') ?? ''),
  };
}

export async function salvarGuiche(
  id: string | null,
  _estadoAnterior: EstadoFormularioGuiche,
  formData: FormData
): Promise<EstadoFormularioGuiche> {
  const valores = valoresDoGuiche(formData);
  const validacao = guicheSchema.safeParse(valores);

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  const resultado = id
    ? await atualizarGuiche(id, validacao.data)
    : await criarGuiche(validacao.data);

  if (!resultado.sucesso) {
    return { erro: resultado.erro, valores };
  }

  revalidatePath('/guiches');
  revalidatePath('/dashboard');

  return { sucesso: id ? 'Guichê atualizado.' : 'Guichê cadastrado.' };
}

export async function alternarAtivoGuicheAction(id: string, ativo: boolean) {
  const resultado = await alternarAtivoGuiche(id, ativo);

  revalidatePath('/guiches');
  return resultado;
}

export async function removerGuicheAction(id: string) {
  const resultado = await removerGuiche(id);

  revalidatePath('/guiches');
  revalidatePath('/dashboard');

  return resultado;
}

export async function salvarUnidade(
  id: string | null,
  _estadoAnterior: EstadoFormularioUnidade,
  formData: FormData
): Promise<EstadoFormularioUnidade> {
  const valores = {
    nome: String(formData.get('nome') ?? ''),
    codigo: String(formData.get('codigo') ?? ''),
    tipoServico: String(formData.get('tipoServico') ?? ''),
    telefone: String(formData.get('telefone') ?? ''),
    endereco: String(formData.get('endereco') ?? ''),
  };
  const validacao = unidadeSchema.safeParse(valores);

  if (!validacao.success) {
    return { erros: erroPorCampo(validacao.error), valores };
  }

  if (id) {
    const atualizacao = await atualizarUnidadeNoBanco(id, validacao.data);

    if (!atualizacao.sucesso) {
      return { erro: atualizacao.erro, valores };
    }

    revalidarTelasDaUnidade(id);
    return { sucesso: 'Unidade atualizada.' };
  }

  const clinica = await buscarClinica();

  if (!clinica) {
    return { erro: 'Não foi possível identificar a clínica.', valores };
  }

  const resultado = await criarUnidadeNoBanco(clinica.id, validacao.data);

  if (!resultado.sucesso) {
    return { erro: resultado.erro, valores };
  }

  revalidarTelasDaUnidade();
  return { sucesso: 'Unidade cadastrada com sucesso.' };
}

export async function alternarAtivaUnidadeAction(id: string, ativa: boolean) {
  const resultado = await alternarAtivaUnidade(id, ativa);

  revalidarTelasDaUnidade(id);
  return resultado;
}

export async function excluirUnidade(id: string) {
  const resultado = await removerUnidade(id);

  if (resultado.sucesso) {
    revalidarTelasDaUnidade();
    redirect('/unidades');
  }

  return resultado;
}