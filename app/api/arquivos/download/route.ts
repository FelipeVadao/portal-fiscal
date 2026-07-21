import { z } from "zod";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin, DOCUMENTOS_BUCKET } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";

const bodySchema = z.object({ path: z.string().min(1) });

export async function POST(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  // paths são "{contador_id}/{envio_id}/{campo}/{arquivo}" — o prefixo tem
  // que bater com o contador da sessão, senão seria possível forjar o path
  // de outro contador e baixar um arquivo alheio.
  if (!parsed.data.path.startsWith(`${session.contadorId}/`)) {
    return Response.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(DOCUMENTOS_BUCKET)
    .createSignedUrl(parsed.data.path, 3600);

  if (error || !data) {
    return Response.json(
      { ok: false, error: error?.message ?? "Erro ao gerar link." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, signedUrl: data.signedUrl });
}
