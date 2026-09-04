// Gestão de locações — vínculo dos profissionais com as unidades
// Acesso: CLINICA
import { redirect } from 'next/navigation';

import { exigirPerfil } from '@/features/auth/services/sessao';
import { listarUnidades } from '@/features/clinic/services/guiche';
import { LocacoesGestao } from '@/features/professional/components/LocacoesGestao';
import { listarLocacoes } from '@/features/professional/services/locacao';
import { listarProfissionais } from '@/features/professional/services/profissional';

export const metadata = { title: 'Locações — Aguard.ai' };

export default async function LocacoesPage() {
  const perfil = await exigirPerfil();

  // Só a administração da clínica cria e encerra vínculos (RLS locacao_*_admin_clinica)
  if (perfil.papel !== 'clinica') {
    redirect('/dashboard');
  }

  const [locacoes, profissionais, unidades] = await Promise.all([
    listarLocacoes(),
    listarProfissionais(),
    listarUnidades(),
  ]);

  return (
    <LocacoesGestao
      locacoes={locacoes}
      profissionais={profissionais.filter((profissional) => profissional.ativo)}
      unidades={unidades}
      podeGerenciar
    />
  );
}
