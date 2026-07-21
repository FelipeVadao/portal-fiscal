import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";

const bodySchema = z.object({
  codigoConvite: z.string().min(1, "Informe o código de convite."),
  nome: z.string().trim().min(1, "Informe seu nome completo.").max(200),
  id: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe um ID para sua conta.")
    .regex(/^[a-z0-9-]+$/, "ID inválido: use só letras minúsculas, números e hífens."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

/**
 * Cadastro de contador — antes era um insert direto no Supabase com a anon
 * key (registro.html), o que deixava o código de convite visível via
 * view-source e gravava a senha em texto puro. Agora o convite é checado
 * server-side (nunca sai do bundle do cliente) e só senha_hash é gravado.
 */
export async function POST(request: Request) {
  const inviteCode = process.env.CONTADOR_INVITE_CODE;
  if (!inviteCode) {
    return Response.json(
      { ok: false, error: "Cadastro temporariamente indisponível." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  if (parsed.data.codigoConvite !== inviteCode) {
    return Response.json({ ok: false, error: "Código de convite inválido." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existe } = await supabase
    .from("contadores")
    .select("id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (existe) {
    return Response.json({ ok: false, error: "Este ID já está em uso. Escolha outro." }, { status: 409 });
  }

  const senhaHash = await hashPassword(parsed.data.senha);

  const { error } = await supabase.from("contadores").insert({
    id: parsed.data.id,
    nome: parsed.data.nome,
    senha_hash: senhaHash,
  });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, id: parsed.data.id }, { status: 201 });
}
