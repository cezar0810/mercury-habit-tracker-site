import { createClient } from "@supabase/supabase-js";
let client: ReturnType<typeof createClient<any>> | null = null;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ujgmefsbaehwpvmelqrc.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_i2Sp7oC7vUo8G01ESDfT5Q_5mUFzgOs";
  if (!url || !key || typeof window === "undefined") return null;
  return client ??= createClient<any>(url, key, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
}
