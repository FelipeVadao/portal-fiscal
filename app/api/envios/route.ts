import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession, requireClienteSession } from "@/lib/auth/session";
import { groupEnviosByCliente } from "@/lib/envios/group";
import type { EnvioComArquivos } from "@/lib/types/db";

export async function GET(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("envios")
    .select("*, arquivos(*)")
    .eq("contador_id", session.contadorId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const envios = (data ?? []) as EnvioComArquivos[];
  const clientes = groupEnviosByCliente(envios);
  const hojeISO = new Date().toISOString().slice(0, 10);

  return Response.json({
    ok: true,
    stats: {
      totalClientes: clientes.length,
      totalArquivos: envios.reduce((sum, e) => sum + e.arquivos.length, 0),
      enviosHoje: envios.filter((e) => e.created_at.startsWith(hojeISO)).length,
    },
    clientes,
  });
}

/**
 * Cria um "envio" (contêiner de upload) para a sessão do cliente logado —
 * chamado uma vez quando o portal carrega; o id retornado é reaproveitado
 * no navegador para todos os uploads daquela visita. Copia nome/cpf/
 * email/telefone de `clientes` só para manter a aba "Envios" do dashboard
 * (agrupamento por cliente) funcionando sem precisar o cliente redigitar
 * nada — os demais campos (banco, endereço etc.) ficam null, já que o
 * fluxo novo é focado em documentos, não no formulário grande de antes.
 */
export async function POST(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireClienteSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("nome, cpf, email, telefone")
    .eq("id", session.clienteId)
    .maybeSingle();

  if (clienteError || !cliente) {
    return Response.json({ ok: false, error: "Cliente não encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("envios")
    .insert({
      contador_id: session.contadorId,
      cliente_id: session.clienteId,
      nome: cliente.nome,
      cpf: cliente.cpf,
      email: cliente.email,
      telefone: cliente.telefone,
    })
    .select("id")
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, envioId: data.id }, { status: 201 });
}
