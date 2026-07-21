"use client";

import { useState } from "react";
import type { SolicitacaoComArquivos } from "@/lib/types/db";
import StatusBadge from "@/components/ui/StatusBadge";
import UploadField from "./UploadField";
import ComentariosThread from "@/components/shared/ComentariosThread";
import { IconFileText, IconMessageCircle } from "@/components/ui/icons";

interface Props {
  contadorId: string;
  envioId: string | null;
  solicitacoes: SolicitacaoComArquivos[];
  onUploaded: () => void;
}

export default function SolicitacoesList({ contadorId, envioId, solicitacoes, onUploaded }: Props) {
  const [comentariosAbertos, setComentariosAbertos] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 mb-5">
      {solicitacoes.map((s, i) => (
        <div
          key={s.id}
          className="glass-card p-4 sm:px-[18px] sm:py-4 motion-safe:animate-fade-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
            <div>
              <div className="font-bold text-[14.5px]">
                {s.nome}{" "}
                {s.obrigatoria && (
                  <span className="text-[10.5px] font-semibold text-text-3 uppercase ml-1">
                    obrigatório
                  </span>
                )}
              </div>
              <div className="text-xs text-text-2 mt-0.5">
                {s.categoria ? `${s.categoria}` : ""}
                {s.data_limite
                  ? `${s.categoria ? " · " : ""}prazo ${new Date(`${s.data_limite}T00:00:00`).toLocaleDateString("pt-BR")}`
                  : ""}
              </div>
              {s.descricao && <div className="text-[12.5px] text-text-2 mt-1.5">{s.descricao}</div>}
            </div>
            <StatusBadge status={s.status} />
          </div>

          {s.arquivos?.length > 0 && (
            <ul className="list-none mt-2.5 text-[12.5px] text-text-2 flex flex-col gap-1">
              {s.arquivos.map((a) => (
                <li key={a.id} className="flex items-center gap-1.5">
                  <IconFileText className="size-3.5 shrink-0" /> {a.nome_original}
                </li>
              ))}
            </ul>
          )}

          {(s.status === "pendente" || s.status === "rejeitado") && (
            <UploadField
              contadorId={contadorId}
              envioId={envioId}
              solicitacaoId={s.id}
              campo={s.nome}
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onUploaded={onUploaded}
            />
          )}

          <button
            type="button"
            className="mt-3 flex items-center gap-1.5 bg-transparent border-none p-0 text-[12.5px] font-semibold text-primary cursor-pointer hover:underline"
            onClick={() => setComentariosAbertos(comentariosAbertos === s.id ? null : s.id)}
          >
            <IconMessageCircle className="size-3.5" /> Comentários
          </button>
          {comentariosAbertos === s.id && (
            <ComentariosThread contadorId={contadorId} solicitacaoId={s.id} viewerTipo="cliente" />
          )}
        </div>
      ))}
    </div>
  );
}
