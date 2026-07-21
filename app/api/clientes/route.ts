import { z } from "zod";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";
import { generateCodigoAcesso, hashCodigoAcesso } from "@/lib/auth/codigoAcesso";
import { isValidCpf, normalizeCpf } from "@/lib/validation/cpf";
import { logEvento } from "@/lib/eventos/log";
import { calcularProgresso } from "@/lib/solicitacoes/progress";

const createSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  cpf: z.string().refine(isValidCpf, "CPF inválido."),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, cpf, email, telefone, created_at, solicitacoes(status)")
    .eq("contador_id", session.contadorId)
    .order("nome", { ascending: true });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  // O progresso por cliente é computado aqui (reaproveitando a mesma
  // calcularProgresso() do painel do cliente e dos Gráficos) pra alimentar
  // a barra inline em ClientesPanel, sem precisar de uma requisição extra
  // por cliente.
  const clientes = (data ?? []).map(({ solicitacoes, ...cliente }) => ({
    ...cliente,
    progresso: calcularProgresso(solicitacoes),
  }));

  return Response.json({ ok: true, clientes });
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

  const cpf = normalizeCpf(parsed.data.cpf);
  const codigoAcesso = generateCodigoAcesso();
  const codigoAcessoHash = await hashCodigoAcesso(codigoAcesso);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      contador_id: session.contadorId,
      nome: parsed.data.nome,
      cpf,
      email: parsed.data.email || null,
      telefone: parsed.data.telefone || null,
      codigo_acesso_hash: codigoAcessoHash,
    })
    .select("id, nome, cpf, email, telefone, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { ok: false, error: "Já existe um cliente com esse CPF." },
        { status: 409 }
      );
    }
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  await logEvento({
    contadorId: session.contadorId,
    clienteId: data.id,
    tipo: "cliente_criado",
    atorTipo: "contador",
    atorId: session.contadorId,
    metadata: { nome: data.nome },
  });

  // O código em texto puro só existe aqui, nesta resposta — nunca é
  // persistido nem pode ser reobtido depois (só regerado).
  return Response.json({ ok: true, cliente: data, codigoAcesso }, { status: 201 });
}
