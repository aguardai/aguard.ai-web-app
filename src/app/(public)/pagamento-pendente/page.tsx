import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { verificarPagamentoPendente } from '@/features/auth/actions';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Pagamento em aberto | Aguard.ai',
  description: 'Confirme o pagamento do plano para liberar o acesso à sua clínica.',
};

// Retomada do cadastro com Pix ainda não confirmado: o usuário existe no Auth,
// mas a clínica só é criada quando o gateway aprova o pagamento
export default async function PagamentoPendentePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AuthShell
      titulo="Pagamento em aberto"
      descricao="Seu cadastro foi criado, mas ainda não identificamos a confirmação do seu Pix."
    >
      <form action={verificarPagamentoPendente} className="flex flex-col gap-5">
        <p className="text-sm text-muted">
          Assim que o pagamento for confirmado, sua clínica é liberada com o plano escolhido.
          Se preferir, faça login mais tarde: verificamos de novo a cada acesso.
        </p>

        <Button type="submit" tamanho="lg" className="w-full">
          <RefreshCw className="size-4" aria-hidden />
          Já paguei, verificar
        </Button>
      </form>
    </AuthShell>
  );
}
