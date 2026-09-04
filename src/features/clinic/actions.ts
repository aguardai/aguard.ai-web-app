'use server';

import { revalidatePath } from 'next/cache';

import { obterPlano, type Plano } from '@/constants/planos';
import {
  buscarClinica,
  buscarUsoPlano,
  atualizarClinica,
  trocarPlano,
} from '@/features/clinic/services/clinica';
import { clinicaSchema, erroPorCampo, trocaPlanoSchema } from '@/features/clinic/schemas';
import type {
  EstadoFormularioClinica,
  EstadoTrocaPlano,
  UsoPlano,
} from '@/features/clinic/types';

function revalidarTelasDaClinica() {
  revalidatePath('/clinica');
  revalidatePath('/dashboard');
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

export async function alterarPlano(
  _estadoAnterior: EstadoTrocaPlano,
  formData: FormData
): Promise<EstadoTrocaPlano> {
  const validacao = trocaPlanoSchema.safeParse({ plano: formData.get('plano') });

  if (!validacao.success) {
    return { erro: 'Selecione um plano válido.' };
  }

  const plano = obterPlano(validacao.data.plano);
  const [clinica, uso] = await Promise.all([buscarClinica(), buscarUsoPlano()]);

  if (!plano || !clinica || !uso) {
    return { erro: 'Não foi possível carregar os dados do plano.' };
  }

  if (clinica.plano === plano.id) {
    return { sucesso: `A clínica já está no plano ${plano.nome}.` };
  }

  const excedente = recursoAcimaDoLimite(uso, plano.limites);

  if (excedente) {
    const [recurso, usado, limite] = excedente;

    return {
      erro: `O plano ${plano.nome} permite ${limite} ${recurso} e a clínica já tem ${usado}. Reduza antes de trocar.`,
    };
  }

  const resultado = await trocarPlano(clinica.id, plano.id);

  if (!resultado.sucesso) {
    return { erro: resultado.erro };
  }

  revalidarTelasDaClinica();
  return { sucesso: `Plano alterado para ${plano.nome}.` };
}
