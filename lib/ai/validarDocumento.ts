import "server-only";
import { getSupabaseAdmin, DOCUMENTOS_BUCKET } from "@/lib/supabase/server";
import { getGeminiClient, getGeminiModel } from "@/lib/ai/gemini";
import { ApiError, type GenerateContentResponse, type Part } from "@google/genai";
import type { IaValidacaoStatus } from "@/lib/types/db";

const RETRYABLE_STATUS = new Set([429, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** O tier gratuito do Gemini devolve 429/503 com alguma frequência sob alta demanda — uma única retentativa cobre a maioria desses casos transitórios sem atrasar demais a verificação em background. */
async function gerarConteudoComRetry(
  parts: Part[]
): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  try {
    return await ai.models.generateContent({
      model: getGeminiModel(),
      contents: parts,
      config: { responseMimeType: "application/json" },
    });
  } catch (err) {
    if (err instanceof ApiError && RETRYABLE_STATUS.has(err.status)) {
      await sleep(1500);
      return ai.models.generateContent({
        model: getGeminiModel(),
        contents: parts,
        config: { responseMimeType: "application/json" },
      });
    }
    throw err;
  }
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const TEXT_EXTS = new Set(["csv", "txt", "json"]);

// Requisição inline (base64) do Gemini tem um teto de ~20MB — damos uma
// folga bem menor pra não estourar em arquivos grandes de qualquer forma
// (contando o overhead do encode base64, ~33% maior que o binário).
const MAX_VALIDATION_BYTES = 12 * 1024 * 1024;

interface ValidarDocumentoInput {
  storagePath: string;
  nomeOriginal: string;
  solicitacaoNome: string;
  solicitacaoCategoria: string | null;
  solicitacaoDescricao: string | null;
}

interface ValidarDocumentoResult {
  status: IaValidacaoStatus;
  observacao: string | null;
}

function extensaoDe(nome: string): string {
  return nome.split(".").pop()?.toLowerCase() ?? "";
}

function truncar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max)}…` : texto;
}

function extrairJson(texto: string): { compativel: boolean; motivo: string } | null {
  // Non-greedy: pega só o primeiro objeto JSON. O Gemini às vezes devolve
  // texto duplicado/concatenado (visto em produção) — um match guloso juntaria
  // os dois blobs num JSON inválido só.
  const match = texto.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]);
    if (typeof obj.compativel === "boolean" && typeof obj.motivo === "string") {
      return { compativel: obj.compativel, motivo: obj.motivo };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Confere, via Gemini, se o conteúdo de um arquivo recém-enviado parece
 * mesmo ser o tipo de documento pedido na solicitação (ex.: alguém sobe um
 * comprovante de residência num campo que pedia informe de rendimentos).
 * Best-effort: nunca lança — qualquer falha (download, API, parsing) vira
 * status "erro" e é só logada no console, pra nunca derrubar o upload.
 */
export async function validarDocumento(
  input: ValidarDocumentoInput
): Promise<ValidarDocumentoResult> {
  const ext = extensaoDe(input.nomeOriginal);
  const mime = MIME_BY_EXT[ext];
  const isText = TEXT_EXTS.has(ext);

  if (!mime && !isText) {
    return { status: "nao_verificado", observacao: "Tipo de arquivo não suportado para verificação automática." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: blob, error } = await supabase.storage
      .from(DOCUMENTOS_BUCKET)
      .download(input.storagePath);

    if (error || !blob) {
      console.error("[ia] falha ao baixar arquivo para validação:", input.storagePath, error?.message);
      return { status: "erro", observacao: null };
    }

    if (blob.size > MAX_VALIDATION_BYTES) {
      return { status: "nao_verificado", observacao: "Arquivo grande demais para verificação automática." };
    }

    const contexto = [
      "Você está conferindo, para um escritório de contabilidade, se um arquivo enviado por um cliente",
      "realmente corresponde ao tipo de documento fiscal pedido — não avalie se o documento está",
      "correto/completo, só se o TIPO bate com o esperado.",
      "",
      `Documento pedido: "${input.solicitacaoNome}"`,
      input.solicitacaoCategoria ? `Categoria: ${input.solicitacaoCategoria}` : "",
      input.solicitacaoDescricao ? `Descrição do que foi pedido: ${input.solicitacaoDescricao}` : "",
      "",
      "Responda APENAS com um objeto JSON, sem markdown, no formato exato:",
      '{"compativel": true ou false, "motivo": "explicação em até 20 palavras, em português"}',
    ]
      .filter(Boolean)
      .join("\n");

    const parts: Part[] = [{ text: contexto }];

    if (mime) {
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      parts.push({ inlineData: { mimeType: mime, data: base64 } });
    } else {
      const texto = await blob.text();
      parts.push({ text: `Conteúdo do arquivo "${input.nomeOriginal}":\n${truncar(texto, 8000)}` });
    }

    const response = await gerarConteudoComRetry(parts);

    const resultado = extrairJson(response.text ?? "");
    if (!resultado) {
      const finishReason = response.candidates?.[0]?.finishReason;
      console.error(
        "[ia] resposta em formato inesperado para",
        input.storagePath,
        "finishReason:",
        finishReason,
        "text:",
        response.text
      );
      return { status: "erro", observacao: null };
    }

    return {
      status: resultado.compativel ? "compativel" : "suspeito",
      observacao: truncar(resultado.motivo, 300),
    };
  } catch (err) {
    console.error("[ia] falha ao validar documento:", input.storagePath, err);
    return { status: "erro", observacao: null };
  }
}
