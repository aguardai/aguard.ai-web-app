import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client com service role, só para o servidor, em operações que a RLS não
// alcança (ex.: metadados de um usuário que ainda não tem clínica).
// Nunca importar em código de client
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.');
  }

  return createSupabaseClient(url, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
