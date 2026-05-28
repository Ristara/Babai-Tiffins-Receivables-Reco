import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS and can use the Auth Admin API.
// SECRET key, server-only. Never import this into a client component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Add it in Vercel → Environment Variables.",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
