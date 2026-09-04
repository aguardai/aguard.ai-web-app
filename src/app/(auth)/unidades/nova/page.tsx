// Cadastro de unidade
// Acesso: CLINICA
import { redirect } from 'next/navigation';

import { Alert } from '@/components/ui/Alert';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { obterPlano } from '@/constants/planos';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { UnidadeForm } from '@/features/clinic/components/UnidadeForm';
import { buscarUsoPlano } from '@/features/clinic/services/clinica';
import { formatarNumero } from '@/lib/utils';

export const metadata = { title: 'Nova unidade — Aguard.ai' };

export default async function NovaUnidadePage() {
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'clinica') {
    redirect('/unidades');
  }

  const uso = await buscarUsoPlano();
  const ilimitado = uso?.plano === 'enterprise';
  const nomePlano = obterPlano(uso?.plano)?.nome ?? uso?.plano;
  const cotaEsgotada = uso && !ilimitado ? uso.unidades.usado >= uso.unidades.limite : false;

  return (
    <div className="content-container flex max-w-3xl flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Nova unidade"
        descricao="Cadastre um local de atendimento para a sua clínica."
        voltarPara="/unidades"
        rotuloVoltar="Unidades"
      />

      {uso ? (
        <Alert tom={cotaEsgotada ? 'erro' : 'info'}>
          {cotaEsgotada
            ? `O plano ${nomePlano} atingiu o limite de ${formatarNumero(uso.unidades.limite)} unidades. Faça um upgrade para cadastrar mais.`
            : ilimitado
              ? `${formatarNumero(uso.unidades.usado)} unidades cadastradas — o plano ${nomePlano} não tem limite.`
              : `${formatarNumero(uso.unidades.usado)} de ${formatarNumero(uso.unidades.limite)} unidades usadas no plano ${nomePlano}.`}
        </Alert>
      ) : null}

      <section className="rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <UnidadeForm />
      </section>
    </div>
  );
}
