import { cache } from 'react';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { PapelUsuario, Perfil } from '@/features/auth/types';

const ROTA_INICIAL: Record<PapelUsuario, string> = {
  clinica: '/dashboard',
  unidade: '/dashboard',
  profissional: '/atendimento',
};

export function rotaPorPapel(papel: PapelUsuario | undefined): string {
  return papel ? ROTA_INICIAL[papel] : '/dashboard';
}

// Busca o perfil do usuário autenticado. Devolve null quando não há sessão válida.
// O cache() deduplica as chamadas da mesma renderização: o layout e a página pedem
// o perfil, mas só uma consulta ao Supabase acontece
export const obterPerfil = cache(async function obterPerfil(): Promise<Perfil | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('perfil')
    .select('*')
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Perfil;
});

// Guarda das rotas autenticadas
export async function exigirPerfil(): Promise<Perfil> {
  const perfil = await obterPerfil();

  if (!perfil) {
    redirect('/login');
  }

  return perfil;
}

// Guarda das rotas de login e cadastro
export async function redirecionarSeAutenticado(): Promise<void> {
  const perfil = await obterPerfil();

  if (perfil) {
    redirect(rotaPorPapel(perfil.papel));
  }
}
