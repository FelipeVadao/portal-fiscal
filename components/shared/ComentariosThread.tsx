"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Comentario, ComentarioAutorTipo } from "@/lib/types/db";
import { formatRelativeTime } from "@/lib/format/relativeTime";

interface Props {
  contadorId: string;
  solicitacaoId: string;
  /** Quem está vendo a thread agora — decide o rótulo "Você" e o destaque visual, não a permissão (o servidor infere o autor real pela sessão). */
  viewerTipo: ComentarioAutorTipo;
}

function autorLabel(autorTipo: ComentarioAutorTipo, viewerTipo: ComentarioAutorTipo): string {
  if (autorTipo === viewerTipo) return "Você";
  return autorTipo === "contador" ? "Contador(a)" : "Cliente";
}

export default function ComentariosThread({ contadorId, solicitacaoId, viewerTipo }: Props) {
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/solicitacoes/${solicitacaoId}/comentarios?c=${encodeURIComponent(contadorId)}`
      );
      const json = await res.json();
      if (res.ok && json.ok) {
        setComentarios(json.comentarios);
      } else {
        setLoadError(json.error ?? "Erro ao carregar comentários.");
      }
    } catch {
      setLoadError("Erro de conexão ao carregar comentários.");
    }
  }, [contadorId, solicitacaoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setSubmitError(null);
    try {
      const res = await fetch(
        `/api/solicitacoes/${solicitacaoId}/comentarios?c=${encodeURIComponent(contadorId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSubmitError(json.error ?? "Não foi possível enviar o comentário.");
        return;
      }
      setTexto("");
      load();
    } catch {
      setSubmitError("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-border">
      {comentarios === null && !loadError && (
        <p className="text-xs text-text-2 py-1">Carregando comentários…</p>
      )}
      {comentarios === null && loadError && <p className="text-xs text-pend py-1">{loadError}</p>}
      {comentarios !== null && comentarios.length === 0 && (
        <p className="text-xs text-text-2 py-1">Nenhum comentário ainda.</p>
      )}
      {comentarios !== null && comentarios.length > 0 && (
        <ul className="list-none flex flex-col gap-2 mb-2.5">
          {comentarios.map((c) => {
            const own = c.autor_tipo === viewerTipo;
            return (
              <li
                key={c.id}
                className={`rounded-btn px-3 py-2 ${own ? "bg-primary-sub" : "bg-surface-2"}`}
              >
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span
                    className={`text-[11.5px] font-bold ${own ? "text-primary-txt" : "text-text-2"}`}
                  >
                    {autorLabel(c.autor_tipo, viewerTipo)}
                  </span>
                  <span className="text-[11px] text-text-3 whitespace-nowrap">
                    {formatRelativeTime(c.created_at)}
                  </span>
                </div>
                <p className="text-[13px] text-text whitespace-pre-wrap break-words">{c.texto}</p>
              </li>
            );
          })}
        </ul>
      )}

      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <textarea
          className="px-2.5 py-2 border-[1.5px] border-border rounded-btn bg-surface text-text text-[13px] resize-y"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva um comentário…"
          rows={2}
        />
        {submitError && <p className="text-xs text-pend">{submitError}</p>}
        <button type="submit" className="btn-primary self-end" disabled={enviando || !texto.trim()}>
          {enviando ? "Enviando…" : "Comentar"}
        </button>
      </form>
    </div>
  );
}
