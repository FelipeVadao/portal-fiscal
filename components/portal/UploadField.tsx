"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { DOCUMENTOS_BUCKET } from "@/lib/constants/storage";
import { MAX_FILE_SIZE_BYTES } from "@/lib/validation/upload";
import { IconCheck, IconPaperclip } from "@/components/ui/icons";

interface Props {
  contadorId: string;
  envioId: string | null;
  solicitacaoId?: string;
  campo: string;
  accept?: string;
  multiple?: boolean;
  onUploaded?: () => void;
}

type Status = "idle" | "uploading" | "done" | "error";

/**
 * Upload direto do navegador para o Supabase Storage via signed URL — não
 * passa pelo servidor Next.js (Vercel Functions têm limite de 4.5MB por
 * requisição, documentos fiscais escaneados podem passar disso).
 */
export default function UploadField({
  contadorId,
  envioId,
  solicitacaoId,
  campo,
  accept,
  multiple,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!envioId) {
      setStatus("error");
      setMessage("Ainda carregando sua sessão, tente de novo em instantes.");
      return;
    }

    setStatus("uploading");
    setMessage(null);

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`${file.name} é maior que ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
        }

        const signedRes = await fetch(
          `/api/arquivos/signed-upload-url?c=${encodeURIComponent(contadorId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ envioId, solicitacaoId, campo, fileName: file.name }),
          }
        );
        const signedJson = await signedRes.json();
        if (!signedRes.ok || !signedJson.ok) {
          throw new Error(signedJson.error ?? "Erro ao preparar upload.");
        }

        const supabase = getSupabaseBrowser();
        const { error: uploadError } = await supabase.storage
          .from(DOCUMENTOS_BUCKET)
          .uploadToSignedUrl(signedJson.path, signedJson.token, file);
        if (uploadError) throw new Error(uploadError.message);

        const registerRes = await fetch(`/api/arquivos?c=${encodeURIComponent(contadorId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            envioId,
            solicitacaoId,
            campo,
            nomeOriginal: file.name,
            storagePath: signedJson.path,
            tamanho: file.size,
          }),
        });
        const registerJson = await registerRes.json();
        if (!registerRes.ok || !registerJson.ok) {
          throw new Error(registerJson.error ?? "Erro ao registrar arquivo.");
        }
      }

      setStatus("done");
      setMessage(`${files.length} arquivo${files.length === 1 ? "" : "s"} enviado(s).`);
      onUploaded?.();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Erro no envio.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-2">
      <label
        className={`relative flex items-center gap-2 rounded-btn border-[1.5px] border-dashed px-3.5 py-2.5 text-[12.5px] cursor-pointer transition-colors ${
          status === "done"
            ? "border-solid border-ok text-ok"
            : "border-border text-text-2 hover:border-primary hover:text-primary"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={status === "uploading"}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-sm">{status === "done" ? <IconCheck className="size-3.5" /> : <IconPaperclip className="size-3.5" />}</span>
        <span>
          {status === "uploading" ? "Enviando…" : status === "done" ? "Enviar outro" : "Escolher arquivo"}
        </span>
      </label>
      {status === "error" && message && <p className="mt-1.5 text-xs text-pend">{message}</p>}
      {status === "done" && message && <p className="mt-1.5 text-xs text-ok">{message}</p>}
    </div>
  );
}
