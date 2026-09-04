// Cadastro de profissional
// Acesso: CLINICA
import { redirect } from 'next/navigation';

import { Alert } from '@/components/ui/Alert';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { obterPlano } from '@/constants/planos';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { ProfissionalForm } from '@/features/professional/components/ProfissionalForm';
import { buscarUsoPlano } from '@/features/professional/services/profissional';
import { formatarNumero } from '@/lib/utils';

export const metadata = { title: 'Novo profissional — Aguard.ai' };

export default async function NovoProfissionalPage() {
  const perfil = await exigirPerfil();

  // Só a clínica cadastra profissionais (RN da Entrega 02 + README de RLS)
  if (perfil.papel !== 'clinica') {
    redirect('/profissionais');
  }

  const usoPlano = await buscarUsoPlano();
  const ilimitado = usoPlano?.plano === 'enterprise';
  const nomePlano = obterPlano(usoPlano?.plano)?.nome ?? usoPlano?.plano;

  const cotaEsgotada =
    usoPlano && !ilimitado
      ? usoPlano.profissionaisUsados >= usoPlano.maxProfissionais
      : false;

  return (
    <div className="content-container flex max-w-3xl flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Novo profissional"
        descricao="O acesso de login é vinculado depois de salvar o cadastro."
        voltarPara="/profissionais"
        rotuloVoltar="Profissionais"
      />

      {usoPlano ? (
        <Alert tom={cotaEsgotada ? 'erro' : 'info'}>
          {cotaEsgotada
            ? `O plano ${nomePlano} atingiu o limite de ${formatarNumero(usoPlano.maxProfissionais)} profissionais. Faça um upgrade para cadastrar mais.`
            : ilimitado
              ? `${formatarNumero(usoPlano.profissionaisUsados)} profissionais cadastrados — o plano ${nomePlano} não tem limite.`
              : `${formatarNumero(usoPlano.profissionaisUsados)} de ${formatarNumero(usoPlano.maxProfissionais)} profissionais usados no plano ${nomePlano}.`}
        </Alert>
      ) : null}

      <section className="rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <ProfissionalForm />
      </section>
    </div>
  );
}
