import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Server-side only: our API routes use this. The browser never talks to
// Supabase directly — it goes through our /api/* routes instead.
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Copy .env.example to .env.local and add your project URL + anon key."
      );
    }
    client = createClient(url, key);
  }
  return client;
}
