import type { NextRequest } from "next/server";
import { getSupabaseAdmin, DOCUMENTOS_BUCKET } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: envio, error: fetchError } = await supabase
    .from("envios")
    .select("id, contador_id, arquivos(storage_path)")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !envio || envio.contador_id !== session.contadorId) {
    return Response.json({ ok: false, error: "Envio não encontrado." }, { status: 404 });
  }

  const paths = (envio.arquivos ?? []).map((a: { storage_path: string }) => a.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove(paths);
  }

  const { error: deleteError } = await supabase.from("envios").delete().eq("id", id);
  if (deleteError) {
    return Response.json({ ok: false, error: deleteError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
