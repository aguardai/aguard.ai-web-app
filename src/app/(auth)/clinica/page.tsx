import { redirect } from 'next/navigation';

import { exigirPerfil } from '@/features/auth/services/sessao';
import { buscarClinicaAtual, buscarUsoPlanoDetalhado } from '@/features/clinic/services/clinica';
import { ClinicaForm } from '@/features/clinic/components/ClinicaForm';
import { PlanoUsage } from '@/features/clinic/components/PlanoUsage';

export const revalidate = 0;

export default async function ClinicaPage() {
  const perfil = await exigirPerfil();

  if (perfil.papel !== 'clinica') {
    redirect(perfil.papel === 'profissional' ? '/atendimento' : '/dashboard');
  }

  const [clinica, uso] = await Promise.all([
    buscarClinicaAtual(),
    buscarUsoPlanoDetalhado(),
  ]);

  if (!clinica) {
    return (
      <div className="content-container py-8">
        <p className="text-muted">Nao foi possivel carregar os dados da clinica.</p>
      </div>
    );
  }

  return (
    <div className="content-container flex flex-col gap-8 py-8">
      <div>
        <h1 className="font-title text-2xl font-bold text-foreground sm:text-3xl">
          Minha clinica
        </h1>
        <p className="mt-1 text-sm text-muted">Dados da clinica e plano contratado.</p>
      </div>

      <div className="rounded-[12px] border border-border bg-white p-6 shadow-sm sm:p-8">
        <ClinicaForm clinica={clinica} />
      </div>

      {uso ? <PlanoUsage clinicaId={clinica.id} uso={uso} /> : null}
    </div>
  );
}
