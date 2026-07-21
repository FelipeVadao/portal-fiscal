import { z } from "zod";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession, requireClienteSession } from "@/lib/auth/session";
import { logEvento } from "@/lib/eventos/log";

const createSchema = z.object({
  texto: z.string().trim().min(1).max(2000),
});

async function loadSolicitacaoParaAutor(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  solicitacaoId: string,
  contadorIdParam: string | null
) {
  const contadorSession = await requireContadorSession(contadorIdParam);
  const clienteSession = contadorSession ? null : await requireClienteSession(contadorIdParam);
  if (!contadorSession && !clienteSession) return null;

  const { data: solicitacao, error } = await supabase
    .from("solicitacoes")
    .select("id, contador_id, cliente_id")
    .eq("id", solicitacaoId)
    .maybeSingle();

  if (error || !solicitacao) return null;

  if (contadorSession) {
    if (solicitacao.contador_id !== contadorSession.contadorId) return null;
    return { solicitacao, autorTipo: "contador" as const, autorId: contadorSession.contadorId };
  }
  if (clienteSession) {
    if (solicitacao.cliente_id !== clienteSession.clienteId) return null;
    return { solicitacao, autorTipo: "cliente" as const, autorId: clienteSession.clienteId };
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contadorIdParam = request.nextUrl.searchParams.get("c");
  const supabase = getSupabaseAdmin();

  const contexto = await loadSolicitacaoParaAutor(supabase, id, contadorIdParam);
  if (!contexto) {
    return Response.json({ ok: false, error: "Não autenticado ou solicitação não encontrada." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("comentarios")
    .select("*")
    .eq("solicitacao_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, comentarios: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contadorIdParam = request.nextUrl.searchParams.get("c");
  const supabase = getSupabaseAdmin();

  const contexto = await loadSolicitacaoParaAutor(supabase, id, contadorIdParam);
  if (!contexto) {
    return Response.json({ ok: false, error: "Não autenticado ou solicitação não encontrada." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { solicitacao, autorTipo, autorId } = contexto;

  const { data, error } = await supabase
    .from("comentarios")
    .insert({
      contador_id: solicitacao.contador_id,
      solicitacao_id: id,
      autor_tipo: autorTipo,
      autor_id: autorId,
      texto: parsed.data.texto,
    })
    .select("*")
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  await logEvento({
    contadorId: solicitacao.contador_id,
    clienteId: solicitacao.cliente_id,
    solicitacaoId: id,
    tipo: "comentario_criado",
    atorTipo: autorTipo,
    atorId: autorId,
    metadata: { texto: parsed.data.texto.slice(0, 140) },
  });

  return Response.json({ ok: true, comentario: data }, { status: 201 });
}
