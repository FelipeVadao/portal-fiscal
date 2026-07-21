import { z } from "zod";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";
import { logEvento } from "@/lib/eventos/log";

const updateSchema = z.object({
  status: z.enum(["pendente", "enviado", "em_analise", "aprovado", "rejeitado"]).optional(),
  descricao: z.string().trim().max(2000).nullable().optional(),
  dataLimite: z.string().trim().nullable().optional(),
});

async function loadOwned(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  id: string,
  contadorId: string
) {
  const { data, error } = await supabase
    .from("solicitacoes")
    .select("id, contador_id, cliente_id, status, nome")
    .eq("id", id)
    .maybeSingle();
  if (error || !data || data.contador_id !== contadorId) return null;
  return data;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const solicitacao = await loadOwned(supabase, id, session.contadorId);
  if (!solicitacao) {
    return Response.json({ ok: false, error: "Solicitação não encontrada." }, { status: 404 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.descricao !== undefined) update.descricao = parsed.data.descricao;
  if (parsed.data.dataLimite !== undefined) update.data_limite = parsed.data.dataLimite;

  const { data, error } = await supabase
    .from("solicitacoes")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (parsed.data.status && parsed.data.status !== solicitacao.status) {
    await logEvento({
      contadorId: session.contadorId,
      clienteId: solicitacao.cliente_id,
      solicitacaoId: id,
      tipo: "solicitacao_status_alterado",
      atorTipo: "contador",
      atorId: session.contadorId,
      metadata: { de: solicitacao.status, para: parsed.data.status },
    });
  }

  return Response.json({ ok: true, solicitacao: data });
}

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
  const solicitacao = await loadOwned(supabase, id, session.contadorId);
  if (!solicitacao) {
    return Response.json({ ok: false, error: "Solicitação não encontrada." }, { status: 404 });
  }

  // Loga antes de deletar: o FK de eventos.solicitacao_id é ON DELETE SET
  // NULL, então depois do delete o vínculo se perde (aqui e em qualquer
  // evento antigo dessa solicitação) e só sobra o nome em metadata.
  await logEvento({
    contadorId: session.contadorId,
    clienteId: solicitacao.cliente_id,
    solicitacaoId: id,
    tipo: "solicitacao_removida",
    atorTipo: "contador",
    atorId: session.contadorId,
    metadata: { nome: solicitacao.nome },
  });

  const { error } = await supabase.from("solicitacoes").delete().eq("id", id);
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
