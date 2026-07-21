import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";
import { generateCodigoAcesso, hashCodigoAcesso } from "@/lib/auth/codigoAcesso";
import { logEvento } from "@/lib/eventos/log";

export async function POST(
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
    .select("id, contador_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !cliente || cliente.contador_id !== session.contadorId) {
    return Response.json({ ok: false, error: "Cliente não encontrado." }, { status: 404 });
  }

  const codigoAcesso = generateCodigoAcesso();
  const codigoAcessoHash = await hashCodigoAcesso(codigoAcesso);

  const { error: updateError } = await supabase
    .from("clientes")
    .update({ codigo_acesso_hash: codigoAcessoHash, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return Response.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  await logEvento({
    contadorId: session.contadorId,
    clienteId: cliente.id,
    tipo: "codigo_acesso_resetado",
    atorTipo: "contador",
    atorId: session.contadorId,
  });

  // Igual à criação: o código em texto puro só existe nesta resposta.
  return Response.json({ ok: true, codigoAcesso });
}
