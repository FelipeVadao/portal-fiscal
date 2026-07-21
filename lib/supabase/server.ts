import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DOCUMENTOS_BUCKET } from "@/lib/constants/storage";

export { DOCUMENTOS_BUCKET };

/**
 * Cliente Supabase com a service role key — só pode ser importado por
 * código server-side (API routes, Server Components). O import de
 * "server-only" faz o build falhar caso este módulo acabe importado por
 * engano num Client Component.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas. Veja .env.example."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
