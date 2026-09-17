import { redirect } from 'next/navigation';

import { verificarPagamentoPendente } from '@/features/auth/actions';
import { createClient } from '@/lib/supabase/server';

export default async function PagamentoPendentePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-16 text-center">
      <h1 className="font-title text-xl font-bold text-foreground">Pagamento em aberto</h1>
      <p className="text-sm text-muted">
        Seu cadastro foi criado, mas ainda não identificamos a confirmação do seu Pix.
      </p>
      <form action={verificarPagamentoPendente}>
        <button
          type="submit"
          className="w-full rounded-md bg-primary p-3 text-sm font-semibold text-white"
        >
          Já paguei, verificar
        </button>
      </form>
    </div>
  );
}