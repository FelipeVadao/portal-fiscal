import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const clienteId = request.nextUrl.searchParams.get("clienteId");
  const before = request.nextUrl.searchParams.get("before");
  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(limitParam, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("eventos")
    .select("*, clientes(nome), solicitacoes(nome)")
    .eq("contador_id", session.contadorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (clienteId) {
    query = query.eq("cliente_id", clienteId);
  }
  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const eventos = data ?? [];
  const nextCursor = eventos.length === limit ? eventos[eventos.length - 1].created_at : null;

  return Response.json({ ok: true, eventos, nextCursor });
}
