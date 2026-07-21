import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import { getContadorSession } from "@/lib/auth/session";

const bodySchema = z.object({
  id: z.string().trim().min(1).max(100),
  senha: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }
  const { id, senha } = parsed.data;

  const supabase = getSupabaseAdmin();
  const { data: contador, error } = await supabase
    .from("contadores")
    .select("id, nome, senha_hash")
    .eq("id", id)
    .maybeSingle();

  // Mensagem de erro genérica em ambos os casos (usuário inexistente vs
  // senha errada) — evita vazar quais IDs de contador existem.
  if (error || !contador || !contador.senha_hash) {
    return Response.json({ ok: false, error: "Credenciais inválidas." }, { status: 401 });
  }

  const valid = await verifyPassword(senha, contador.senha_hash);
  if (!valid) {
    return Response.json({ ok: false, error: "Credenciais inválidas." }, { status: 401 });
  }

  const session = await getContadorSession();
  session.contadorId = contador.id;
  session.nome = contador.nome;
  await session.save();

  return Response.json({ ok: true, nome: contador.nome });
}
