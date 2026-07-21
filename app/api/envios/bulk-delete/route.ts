import { z } from "zod";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin, DOCUMENTOS_BUCKET } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";

const bodySchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) });

/**
 * Endpoint único para "excluir todos os envios de um cliente" e "excluir
 * tudo do contador" — o cliente (front-end) manda a lista de ids que já
 * tem carregada na tela; o servidor filtra por posse antes de apagar.
 */
export async function POST(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: envios, error: fetchError } = await supabase
    .from("envios")
    .select("id, contador_id, arquivos(storage_path)")
    .in("id", parsed.data.ids);

  if (fetchError) {
    return Response.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  const owned = (envios ?? []).filter((e) => e.contador_id === session.contadorId);
  const paths = owned.flatMap((e) =>
    (e.arquivos ?? []).map((a: { storage_path: string }) => a.storage_path)
  );
  const ids = owned.map((e) => e.id);

  if (paths.length > 0) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove(paths);
  }
  if (ids.length > 0) {
    const { error: deleteError } = await supabase.from("envios").delete().in("id", ids);
    if (deleteError) {
      return Response.json({ ok: false, error: deleteError.message }, { status: 500 });
    }
  }

  return Response.json({ ok: true, deleted: ids.length });
}
