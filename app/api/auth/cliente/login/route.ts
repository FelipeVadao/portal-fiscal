import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyCodigoAcesso } from "@/lib/auth/codigoAcesso";
import { getClienteSession } from "@/lib/auth/session";
import { normalizeCpf } from "@/lib/validation/cpf";
import { logEvento } from "@/lib/eventos/log";

const bodySchema = z.object({
  contadorId: z.string().trim().min(1).max(100),
  cpf: z.string().trim().min(1),
  codigoAcesso: z.string().trim().min(1).max(20),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  const cpf = normalizeCpf(parsed.data.cpf);
  const supabase = getSupabaseAdmin();
  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, nome, contador_id, codigo_acesso_hash")
    .eq("contador_id", parsed.data.contadorId)
    .eq("cpf", cpf)
    .maybeSingle();

  // Mensagem genérica em qualquer caso de falha — não revela se o CPF existe.
  if (error || !cliente || !cliente.codigo_acesso_hash) {
    return Response.json({ ok: false, error: "Credenciais inválidas." }, { status: 401 });
  }

  const valid = await verifyCodigoAcesso(parsed.data.codigoAcesso, cliente.codigo_acesso_hash);
  if (!valid) {
    return Response.json({ ok: false, error: "Credenciais inválidas." }, { status: 401 });
  }

  const session = await getClienteSession();
  session.clienteId = cliente.id;
  session.contadorId = cliente.contador_id;
  session.nome = cliente.nome;
  await session.save();

  await logEvento({
    contadorId: cliente.contador_id,
    clienteId: cliente.id,
    tipo: "cliente_login",
    atorTipo: "cliente",
    atorId: cliente.id,
  });

  return Response.json({ ok: true, nome: cliente.nome });
}
