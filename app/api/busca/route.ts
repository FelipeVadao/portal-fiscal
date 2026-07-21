import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";
import { normalizeCpf } from "@/lib/validation/cpf";

const LIMITE_POR_CATEGORIA = 10;

// Remove caracteres que quebrariam a sintaxe do filtro .or() do PostgREST
// (vírgula separa condições, parênteses agrupam, % é o coringa do ilike).
function sanitizar(termo: string): string {
  return termo.replace(/[,()%*]/g, "").trim();
}

export async function GET(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const termoBruto = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const termo = sanitizar(termoBruto);
  if (termo.length < 2) {
    return Response.json({ ok: true, clientes: [], solicitacoes: [], arquivos: [] });
  }

  const digitos = normalizeCpf(termo);
  const supabase = getSupabaseAdmin();

  const clienteFiltros = [`nome.ilike.%${termo}%`, `email.ilike.%${termo}%`];
  if (digitos) clienteFiltros.push(`cpf.ilike.%${digitos}%`);

  const [clientesRes, solicitacoesRes, arquivosRes] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome, cpf, email, telefone")
      .eq("contador_id", session.contadorId)
      .or(clienteFiltros.join(","))
      .order("nome", { ascending: true })
      .limit(LIMITE_POR_CATEGORIA),
    supabase
      .from("solicitacoes")
      .select("*, clientes(nome)")
      .eq("contador_id", session.contadorId)
      .or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%,categoria.ilike.%${termo}%`)
      .order("created_at", { ascending: false })
      .limit(LIMITE_POR_CATEGORIA),
    supabase
      .from("arquivos")
      .select("id, nome_original, created_at, envios!inner(contador_id, clientes(nome)), solicitacoes(nome)")
      .eq("envios.contador_id", session.contadorId)
      .ilike("nome_original", `%${termo}%`)
      .order("created_at", { ascending: false })
      .limit(LIMITE_POR_CATEGORIA),
  ]);

  if (clientesRes.error) {
    return Response.json({ ok: false, error: clientesRes.error.message }, { status: 500 });
  }
  if (solicitacoesRes.error) {
    return Response.json({ ok: false, error: solicitacoesRes.error.message }, { status: 500 });
  }
  if (arquivosRes.error) {
    return Response.json({ ok: false, error: arquivosRes.error.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    clientes: clientesRes.data ?? [],
    solicitacoes: solicitacoesRes.data ?? [],
    arquivos: arquivosRes.data ?? [],
  });
}
