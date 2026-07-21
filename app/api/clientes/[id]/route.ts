import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";
import { logEvento } from "@/lib/eventos/log";

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

  const { data: cliente, error: fetchError } = await supabase
    .from("clientes")
    .select("id, contador_id, nome")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !cliente || cliente.contador_id !== session.contadorId) {
    return Response.json({ ok: false, error: "Cliente não encontrado." }, { status: 404 });
  }

  // Loga antes de deletar: o FK de eventos.cliente_id é ON DELETE SET NULL,
  // então depois do delete o vínculo se perde e só sobra o nome em metadata.
  await logEvento({
    contadorId: session.contadorId,
    clienteId: cliente.id,
    tipo: "cliente_removido",
    atorTipo: "contador",
    atorId: session.contadorId,
    metadata: { nome: cliente.nome },
  });

  const { error: deleteError } = await supabase.from("clientes").delete().eq("id", id);
  if (deleteError) {
    return Response.json({ ok: false, error: deleteError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
