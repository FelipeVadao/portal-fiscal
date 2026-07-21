"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do navegador — uso restrito a `uploadToSignedUrl()`.
 * A anon key é segura para expor (é o propósito dela); a segurança real
 * vem do token de upload de curta duração emitido por
 * /api/arquivos/signed-upload-url, não desta chave. Nenhuma outra leitura
 * ou escrita no app passa por este cliente — tudo mais vai por API routes
 * server-side com a service role key.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas."
    );
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
