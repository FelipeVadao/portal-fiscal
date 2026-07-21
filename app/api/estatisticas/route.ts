import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireContadorSession } from "@/lib/auth/session";
import { calcularProgresso } from "@/lib/solicitacoes/progress";
import { agruparArquivosPorDia } from "@/lib/estatisticas/arquivosPorDia";

const DIAS_VOLUME = 14;

export async function GET(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireContadorSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const [solicitacoesRes, enviosRes] = await Promise.all([
    supabase.from("solicitacoes").select("status").eq("contador_id", session.contadorId),
    supabase
      .from("envios")
      .select("arquivos(created_at)")
      .eq("contador_id", session.contadorId),
  ]);

  if (solicitacoesRes.error) {
    return Response.json({ ok: false, error: solicitacoesRes.error.message }, { status: 500 });
  }
  if (enviosRes.error) {
    return Response.json({ ok: false, error: enviosRes.error.message }, { status: 500 });
  }

  const progresso = calcularProgresso(solicitacoesRes.data ?? []);
  const arquivos = (enviosRes.data ?? []).flatMap((e) => e.arquivos);
  const arquivosPorDia = agruparArquivosPorDia(arquivos, DIAS_VOLUME);

  return Response.json({ ok: true, progresso, arquivosPorDia });
}
