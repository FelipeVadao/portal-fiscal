"use client";

import { useState } from "react";
import type { EnvioComArquivos } from "@/lib/types/db";
import FileRow from "./FileRow";

interface Props {
  envio: EnvioComArquivos;
  onDownload: (path: string) => Promise<string | null>;
  onDelete: () => void;
}

export default function EnvioSub({ envio, onDownload, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const data = new Date(envio.created_at).toLocaleString("pt-BR");

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between gap-2.5 px-4 py-2.5">
        <button
          className="flex-1 flex items-center justify-between gap-2.5 bg-transparent border-none text-left cursor-pointer text-[12.5px] text-text py-1"
          onClick={() => setOpen((o) => !o)}
        >
          <span>{data}</span>
          <span className="text-text-2 text-[11.5px]">
            {envio.arquivos.length} arquivo{envio.arquivos.length === 1 ? "" : "s"}
          </span>
        </button>
        <button
          className="btn-danger-sm"
          onClick={() => {
            if (confirm("Excluir este envio e seus arquivos? Essa ação não pode ser desfeita.")) {
              onDelete();
            }
          }}
        >
          Excluir
        </button>
      </div>
      {open && (
        <div className="px-4 pb-3.5">
          {envio.arquivos.length === 0 ? (
            <p className="text-[12.5px] text-text-2">Nenhum arquivo neste envio.</p>
          ) : (
            envio.arquivos.map((arquivo) => (
              <FileRow key={arquivo.id} arquivo={arquivo} onDownload={onDownload} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
