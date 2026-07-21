import { z } from "zod";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin, DOCUMENTOS_BUCKET } from "@/lib/supabase/server";
import { requireClienteSession } from "@/lib/auth/session";
import { buildStoragePath } from "@/lib/storage/paths";
import { hasAllowedExtension } from "@/lib/validation/upload";

const bodySchema = z.object({
  envioId: z.string().uuid(),
  solicitacaoId: z.string().uuid().optional(),
  campo: z.string().trim().min(1).max(100),
  fileName: z.string().trim().min(1).max(255),
});

export async function POST(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireClienteSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  if (!hasAllowedExtension(parsed.data.fileName)) {
    return Response.json({ ok: false, error: "Tipo de arquivo não permitido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: envio, error: envioError } = await supabase
    .from("envios")
    .select("id, contador_id, cliente_id")
    .eq("id", parsed.data.envioId)
    .maybeSingle();

  if (
    envioError ||
    !envio ||
    envio.contador_id !== session.contadorId ||
    envio.cliente_id !== session.clienteId
  ) {
    return Response.json({ ok: false, error: "Envio não encontrado." }, { status: 404 });
  }

  if (parsed.data.solicitacaoId) {
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from("solicitacoes")
      .select("id, contador_id, cliente_id")
      .eq("id", parsed.data.solicitacaoId)
      .maybeSingle();

    if (
      solicitacaoError ||
      !solicitacao ||
      solicitacao.contador_id !== session.contadorId ||
      solicitacao.cliente_id !== session.clienteId
    ) {
      return Response.json({ ok: false, error: "Solicitação não encontrada." }, { status: 404 });
    }
  }

  const path = buildStoragePath(
    session.contadorId,
    parsed.data.envioId,
    parsed.data.campo,
    parsed.data.fileName
  );

  const { data, error } = await supabase.storage.from(DOCUMENTOS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return Response.json(
      { ok: false, error: error?.message ?? "Erro ao gerar URL de upload." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, path: data.path, token: data.token });
}
