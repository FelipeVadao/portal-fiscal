"use client";

import { useCallback, useEffect, useState } from "react";
import type { SolicitacaoComArquivos, SolicitacaoStatus } from "@/lib/types/db";
import { calcularProgresso } from "@/lib/solicitacoes/progress";
import RequestForm from "./RequestForm";
import StatusBadge, { STATUS_LABELS } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import ComentariosThread from "@/components/shared/ComentariosThread";
import FileRow from "./FileRow";
import { IconMessageCircle } from "@/components/ui/icons";

interface Props {
  contadorId: string;
  clienteId: string;
}

const STATUS_OPTIONS: SolicitacaoStatus[] = [
  "pendente",
  "enviado",
  "em_analise",
  "aprovado",
  "rejeitado",
];

export default function RequestsPanel({ contadorId, clienteId }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComArquivos[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [comentariosAbertos, setComentariosAbertos] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        `/api/solicitacoes?c=${encodeURIComponent(contadorId)}&clienteId=${encodeURIComponent(clienteId)}`
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erro ao carregar solicitações.");
        return;
      }
      setSolicitacoes(json.solicitacoes);
    } catch {
      setError("Erro de conexão.");
    }
  }, [contadorId, clienteId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(id: string, status: SolicitacaoStatus) {
    await fetch(`/api/solicitacoes/${id}?c=${encodeURIComponent(contadorId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta solicitação?")) return;
    await fetch(`/api/solicitacoes/${id}?c=${encodeURIComponent(contadorId)}`, { method: "DELETE" });
    load();
  }

  async function handleDownload(path: string): Promise<string | null> {
    const res = await fetch(`/api/arquivos/download?c=${encodeURIComponent(contadorId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) return null;
    return json.signedUrl as string;
  }

  const progresso = solicitacoes ? calcularProgresso(solicitacoes) : null;

  return (
    <div className="px-[18px] py-4">
      {progresso && progresso.total > 0 && (
        <div className="flex items-center gap-2.5 mb-3.5">
          <ProgressBar percent={progresso.percentualConcluido} />
          <span className="text-xs text-text-2 whitespace-nowrap">
            {progresso.percentualConcluido}% concluído
          </span>
        </div>
      )}

      {error && (
        <p className="bg-pend-bg text-pend rounded-btn px-3 py-2 text-[12.5px] mb-2.5">{error}</p>
      )}

      {!showForm && (
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nova solicitação
        </button>
      )}
      {showForm && (
        <RequestForm
          contadorId={contadorId}
          clienteId={clienteId}
          onCreated={load}
          onClose={() => setShowForm(false)}
        />
      )}

      {solicitacoes === null && !error && (
        <p className="text-[12.5px] text-text-2 py-3">Carregando…</p>
      )}

      {solicitacoes !== null && solicitacoes.length === 0 && !showForm && (
        <EmptyState
          title="Nenhuma solicitação ainda"
          description="Crie uma solicitação para pedir um documento específico a este cliente."
        />
      )}

      {solicitacoes !== null && solicitacoes.length > 0 && (
        <ul className="list-none mt-3.5 flex flex-col gap-2">
          {solicitacoes.map((s) => (
            <li key={s.id} className="rounded-btn border border-border px-3.5 py-2.5">
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div className="font-semibold text-[13.5px]">
                    {s.nome}{" "}
                    {s.obrigatoria && (
                      <span className="text-[10.5px] font-semibold text-text-3 uppercase ml-1">
                        obrigatória
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-text-2 mt-0.5">
                    {s.categoria ? `${s.categoria} · ` : ""}
                    {s.data_limite
                      ? `prazo ${new Date(`${s.data_limite}T00:00:00`).toLocaleDateString("pt-BR")} · `
                      : ""}
                    {s.arquivos?.length ?? 0} arquivo{s.arquivos?.length === 1 ? "" : "s"}
                  </div>
                  {s.descricao && (
                    <div className="text-xs text-text-2 mt-1">{s.descricao}</div>
                  )}
                  {(s.arquivos?.length ?? 0) > 0 && (
                    <div className="mt-2">
                      {s.arquivos.map((arquivo) => (
                        <FileRow key={arquivo.id} arquivo={arquivo} onDownload={handleDownload} />
                      ))}
                    </div>
                  )}
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <select
                  className="px-2.5 py-1.5 border-[1.5px] border-border rounded-btn bg-surface-2 text-[12.5px] outline-none transition-colors focus:border-primary"
                  value={s.status}
                  onChange={(e) => handleStatusChange(s.id, e.target.value as SolicitacaoStatus)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {STATUS_LABELS[opt]}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-icon"
                  title="Comentários"
                  aria-label="Comentários"
                  onClick={() =>
                    setComentariosAbertos(comentariosAbertos === s.id ? null : s.id)
                  }
                >
                  <IconMessageCircle />
                </button>
                <button className="btn-danger-sm" onClick={() => handleDelete(s.id)}>
                  Excluir
                </button>
              </div>
              {comentariosAbertos === s.id && (
                <ComentariosThread contadorId={contadorId} solicitacaoId={s.id} viewerTipo="contador" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
