import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client com service role — só para uso server-only, em operações que RLS não
// alcança (ex.: apagar um usuário do Auth). Nunca importar isso em código de client.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}