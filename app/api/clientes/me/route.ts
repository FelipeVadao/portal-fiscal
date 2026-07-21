import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireClienteSession } from "@/lib/auth/session";
import { calcularProgresso } from "@/lib/solicitacoes/progress";

export async function GET(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireClienteSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id, nome, cpf, email, telefone")
    .eq("id", session.clienteId)
    .maybeSingle();

  if (clienteError || !cliente) {
    return Response.json({ ok: false, error: "Cliente não encontrado." }, { status: 404 });
  }

  const { data: solicitacoes, error: solicitacoesError } = await supabase
    .from("solicitacoes")
    .select("status")
    .eq("cliente_id", session.clienteId);

  if (solicitacoesError) {
    return Response.json({ ok: false, error: solicitacoesError.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    cliente,
    progresso: calcularProgresso(solicitacoes ?? []),
  });
}
