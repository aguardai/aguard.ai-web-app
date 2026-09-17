// Gestão da clínica — dados cadastrais e plano contratado (monetização simulada)
// Acesso: CLINICA
import { redirect } from 'next/navigation';

import { Alert } from '@/components/ui/Alert';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { CartaoUsoPlano } from '@/features/clinic/components/CartaoUsoPlano';
import { ClinicaForm } from '@/features/clinic/components/ClinicaForm';
import { PlanoForm } from '@/features/clinic/components/PlanoForm';
import { buscarClinica, buscarUsoPlano } from '@/features/clinic/services/clinica';
import { formatarData } from '@/lib/utils';

export const metadata = { title: 'Minha Clínica — Aguard.ai' };

export default async function ClinicaPage() {
  const perfil = await exigirPerfil();

  // Só a administração da clínica edita o cadastro e troca o plano
  if (perfil.papel !== 'clinica') {
    redirect('/dashboard');
  }

  const [clinica, uso] = await Promise.all([buscarClinica(), buscarUsoPlano()]);

  if (!clinica) {
    return (
      <div className="content-container py-8">
        <Alert tom="erro">
          Não foi possível carregar os dados da clínica. Atualize a página em instantes.
        </Alert>
      </div>
    );
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <header>
        <h1 className="font-title text-2xl font-bold text-foreground">{clinica.nome}</h1>
        <p className="text-sm text-muted">
          Cadastro criado em {formatarData(clinica.created_at)}.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div>
            <h2 className="font-title text-base font-bold text-foreground">
              Dados da clínica
            </h2>
            <p className="text-sm text-muted">
              Usados nos painéis de sala de espera e no contato com os pacientes.
            </p>
          </div>

          <ClinicaForm clinica={clinica} />
        </section>

        {uso ? <CartaoUsoPlano uso={uso} /> : null}

        <section className="flex flex-col gap-5 rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6 lg:col-span-3">
          <div>
            <h2 className="font-title text-base font-bold text-foreground">
              Plano e cobrança
            </h2>
            <p className="text-sm text-muted">
              O plano define os limites de unidades, guichês, profissionais e
              atendimentos por mês.
            </p>
          </div>

          <PlanoForm planoAtual={clinica.plano} emailClinica={clinica.email}/>
        </section>
      </div>
    </div>
  );
}
