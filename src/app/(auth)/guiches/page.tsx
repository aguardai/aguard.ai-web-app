// Gestão de guichês das unidades
// Acesso: CLINICA, UNIDADE
import { redirect } from 'next/navigation';

import { exigirPerfil } from '@/features/auth/services/sessao';
import { GuichesGestao } from '@/features/clinic/components/GuichesGestao';
import { listarGuiches, listarUnidades } from '@/features/clinic/services/guiche';

export const metadata = { title: 'Guichês — Aguard.ai' };

export default async function GuichesPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const [guiches, unidades] = await Promise.all([listarGuiches(), listarUnidades()]);

  return (
    <GuichesGestao
      guiches={guiches}
      unidades={unidades}
      podeGerenciar={perfil.papel === 'clinica' || perfil.papel === 'unidade'}
    />
  );
}
