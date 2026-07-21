import { z } from "zod";
import { after, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireClienteSession } from "@/lib/auth/session";
import { MAX_FILE_SIZE_BYTES } from "@/lib/validation/upload";
import { validarDocumento } from "@/lib/ai/validarDocumento";
import { logEvento } from "@/lib/eventos/log";

const bodySchema = z.object({
  envioId: z.string().uuid(),
  solicitacaoId: z.string().uuid().optional(),
  campo: z.string().trim().min(1).max(100),
  nomeOriginal: z.string().trim().min(1).max(255),
  storagePath: z.string().trim().min(1),
  tamanho: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

/** Registra os metadados de um arquivo já enviado direto pro Storage via signed URL — chama a RPC que grava o arquivo, atualiza a solicitação e loga o evento numa transação só. */
export async function POST(request: NextRequest) {
  const contadorId = request.nextUrl.searchParams.get("c");
  const session = await requireClienteSession(contadorId);
  if (!session) {
    return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  // O path já foi emitido só para este contador em /signed-upload-url, mas
  // confirma de novo aqui — defesa em profundidade contra um path forjado.
  if (!parsed.data.storagePath.startsWith(`${session.contadorId}/`)) {
    return Response.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("registrar_arquivo_enviado", {
    p_envio_id: parsed.data.envioId,
    p_solicitacao_id: parsed.data.solicitacaoId ?? null,
    p_campo: parsed.data.campo,
    p_nome_original: parsed.data.nomeOriginal,
    p_storage_path: parsed.data.storagePath,
    p_tamanho: parsed.data.tamanho,
    p_ator_tipo: "cliente",
    p_ator_id: session.clienteId,
  });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const arquivo = data as { id: string };
  const solicitacaoId = parsed.data.solicitacaoId;

  // Verificação por IA roda depois da resposta ser enviada ao cliente —
  // não faz sentido o upload esperar alguns segundos de chamada ao Gemini.
  if (solicitacaoId) {
    after(async () => {
      const supabaseBg = getSupabaseAdmin();
      const { data: solicitacao } = await supabaseBg
        .from("solicitacoes")
        .select("nome, categoria, descricao")
        .eq("id", solicitacaoId)
        .maybeSingle();

      if (!solicitacao) return;

      const resultado = await validarDocumento({
        storagePath: parsed.data.storagePath,
        nomeOriginal: parsed.data.nomeOriginal,
        solicitacaoNome: solicitacao.nome,
        solicitacaoCategoria: solicitacao.categoria,
        solicitacaoDescricao: solicitacao.descricao,
      });

      await supabaseBg
        .from("arquivos")
        .update({ ia_validacao: resultado.status, ia_observacao: resultado.observacao })
        .eq("id", arquivo.id);

      if (resultado.status === "suspeito") {
        await logEvento({
          contadorId: session.contadorId,
          clienteId: session.clienteId,
          solicitacaoId,
          arquivoId: arquivo.id,
          tipo: "arquivo_suspeito_ia",
          atorTipo: "sistema",
          metadata: { nome: parsed.data.nomeOriginal, motivo: resultado.observacao },
        });
      }
    });
  }

  return Response.json({ ok: true, arquivo: data }, { status: 201 });
}
