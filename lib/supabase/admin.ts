import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Only ever call this from
// code that has already verified the caller is the admin -- it bypasses RLS
// entirely and can perform Auth admin operations (e.g. deleting accounts).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
