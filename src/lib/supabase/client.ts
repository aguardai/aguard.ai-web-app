// Client Supabase para uso no browser (Client Components)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variáveis do Supabase ausentes. Crie um arquivo .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
