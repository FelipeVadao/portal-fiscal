"use client";

import { useState } from "react";
import type { Arquivo } from "@/lib/types/db";
import { IconAlertTriangle, IconCheck, IconDownload, IconFileText, IconImage, IconPaperclip } from "@/components/ui/icons";

function IconFor({ nome, className }: { nome: string; className?: string }) {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return <IconFileText className={className} />;
  if (["jpg", "jpeg", "png"].includes(ext)) return <IconImage className={className} />;
  return <IconPaperclip className={className} />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  arquivo: Arquivo;
  onDownload: (path: string) => Promise<string | null>;
}

export default function FileRow({ arquivo, onDownload }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const url = await onDownload(arquivo.storage_path);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-2.5 rounded-btn border border-border px-3 py-2.5 mb-1.5 last:mb-0 transition-colors hover:border-primary">
      <IconFor nome={arquivo.nome_original} className="size-4 shrink-0 text-text-2" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0 text-[13px] font-semibold">
          <span className="truncate">{arquivo.nome_original}</span>
          {arquivo.ia_validacao === "suspeito" && (
            <span
              className="badge badge-warn shrink-0 whitespace-nowrap inline-flex items-center gap-1"
              title={arquivo.ia_observacao ?? "A IA sinalizou que este arquivo pode não ser o documento certo."}
            >
              <IconAlertTriangle className="size-3" /> pode não ser o documento certo
            </span>
          )}
          {arquivo.ia_validacao === "compativel" && (
            <span
              className="badge badge-ok shrink-0 whitespace-nowrap inline-flex items-center gap-1"
              title={arquivo.ia_observacao ?? "A IA confirmou que este arquivo parece ser o documento certo."}
            >
              <IconCheck className="size-3" /> verificado
            </span>
          )}
        </div>
        <div className="truncate text-[11.5px] text-text-2">
          {arquivo.campo} · {formatSize(arquivo.tamanho)}
        </div>
      </div>
      <button
        className="btn-icon"
        onClick={handleClick}
        disabled={loading}
        title="Baixar"
        aria-label="Baixar"
      >
        {loading ? "…" : <IconDownload />}
      </button>
    </div>
  );
}
