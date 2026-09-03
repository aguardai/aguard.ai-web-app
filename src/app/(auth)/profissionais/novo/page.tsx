import { redirect } from 'next/navigation';

import { Alert } from '@/components/ui/Alert';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { buscarUsoPlano } from '@/features/professional/services/profissional';
import { ProfissionalForm } from '@/features/professional/components/ProfissionalForm';

export const metadata = { title: 'Novo profissional — Aguard.ai' };

export default async function NovoProfissionalPage() {
  const perfil = await exigirPerfil();

  // Só a clínica cadastra profissionais (RN da Entrega 02 + README de RLS)
  if (perfil.papel !== 'clinica') {
    redirect('/profissionais');
  }

  const usoPlano = await buscarUsoPlano();
  const cotaEsgotada = usoPlano ? usoPlano.profissionaisUsados >= usoPlano.maxProfissionais : false;

  return (
    <div className="content-container flex max-w-2xl flex-col gap-6 py-8">
      <div>
        <h1 className="font-title text-2xl font-bold text-foreground">Novo profissional</h1>
        <p className="text-sm text-muted">
          O acesso de login é vinculado separadamente, depois de salvar o cadastro.
        </p>
      </div>

      {usoPlano ? (
        <Alert tom={cotaEsgotada ? 'erro' : 'info'}>
          {cotaEsgotada
            ? `O plano ${usoPlano.plano} atingiu o limite de ${usoPlano.maxProfissionais} profissionais. Faça um upgrade para cadastrar mais.`
            : `${usoPlano.profissionaisUsados} de ${usoPlano.maxProfissionais} profissionais usados no plano ${usoPlano.plano}.`}
        </Alert>
      ) : null}

      <ProfissionalForm />
    </div>
  );
}