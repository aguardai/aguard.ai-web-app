// Cadastro de unidade
// Acesso: CLINICA
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { UnidadeForm } from '@/features/clinic/components/UnidadeForm';

export default function NovaUnidadePage() {
  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Nova unidade"
        descricao="Cadastre um local de atendimento para a sua clínica."
        voltarPara="/unidades"
      />
      <div className="rounded-[12px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <UnidadeForm />
      </div>
    </div>
  );
}
