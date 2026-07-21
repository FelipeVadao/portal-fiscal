import { z } from "zod";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession, requireClienteSession } from "@/lib/auth/session";
import { logEvento } from "@/lib/eventos/log";
import { sendEmail } from "@/lib/email/send";
import { templateNovaSolicitacao } from "@/lib/email/templates";
import { getAppUrl } from "@/lib/email/resend";
import { sendPushToCliente } from "@/lib/push/send";

const createSchema = z.object({
  clienteId: z.string().uuid(),
  nome: z.string().trim().min(1).max(200),
  descricao: z.string().trim().max(2000).optional().or(z.literal("")),
  categoria: z.string().trim().max(100).optional().or(z.literal("")),
  obrigatoria: z.boolean().optional(),
  dataLimite: z.string().trim().optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const contadorIdParam = request.nextUrl.searchParams.get("c");
  const clienteIdParam = request.nextUrl.searchParams.get("clienteId");

  const contadorSession = await requireContadorSession(contadorIdParam);
  const clienteSession = contadorSession ? null : await requireClienteSession(contadorIdParam);

  if (!contadorSession && !clienteSession) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Sem clienteId, um contador autenticado recebe a listagem global (todas
  // as solicitações de todos os clientes dele, com o nome do cliente
  // embutido, sem arquivos — o painel de prazos não precisa deles) — usada
  // pelo painel de prazos. Com clienteId, mantém o comportamento original:
  // só as solicitações daquele cliente, com os arquivos embutidos.
  const selectClause = contadorSession && !clienteIdParam ? "*, clientes(nome)" : "*, arquivos(*)";

  let query = supabase
    .from("solicitacoes")
    .select(selectClause)
    .order("data_limite", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (contadorSession) {
    query = query.eq("contador_id", contadorSession.contadorId);
    if (clienteIdParam) {
      query = query.eq("cliente_id", clienteIdParam);
    }
  } else if (clienteSession) {
    query = query.eq("cliente_id", clienteSession.clienteId);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, solicitacoes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Garante que o cliente pertence a este contador antes de criar a solicitação.
  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id, contador_id, nome, email")
    .eq("id", parsed.data.clienteId)
    .maybeSingle();

  if (clienteError || !cliente || cliente.contador_id !== session.contadorId) {
    return Response.json({ ok: false, error: "Cliente não encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("solicitacoes")
    .insert({
      contador_id: session.contadorId,
      cliente_id: parsed.data.clienteId,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      categoria: parsed.data.categoria || null,
      obrigatoria: parsed.data.obrigatoria ?? true,
      data_limite: parsed.data.dataLimite || null,
    })
    .select("*")
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  await logEvento({
    contadorId: session.contadorId,
    clienteId: parsed.data.clienteId,
    solicitacaoId: data.id,
    tipo: "solicitacao_criada",
    atorTipo: "contador",
    atorId: session.contadorId,
    metadata: { nome: parsed.data.nome },
  });

  const portalUrl = `${getAppUrl()}/?c=${encodeURIComponent(session.contadorId)}`;

  if (cliente.email) {
    const { subject, html } = templateNovaSolicitacao({
      clienteNome: cliente.nome,
      solicitacaoNome: data.nome,
      categoria: data.categoria,
      dataLimite: data.data_limite,
      portalUrl,
    });
    await sendEmail({ to: cliente.email, subject, html });
  }

  await sendPushToCliente({
    clienteId: parsed.data.clienteId,
    title: "Novo documento solicitado",
    body: `Seu contador pediu: ${data.nome}`,
    url: portalUrl,
  });

  return Response.json({ ok: true, solicitacao: data }, { status: 201 });
}
