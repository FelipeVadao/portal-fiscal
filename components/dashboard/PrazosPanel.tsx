"use client";

import { useCallback, useEffect, useState } from "react";
import type { SolicitacaoComCliente, SolicitacaoStatus } from "@/lib/types/db";
import { calcularPrazo, type PrazoInfo, type UrgenciaPrazo } from "@/lib/solicitacoes/prazos";
import StatusBadge, { STATUS_LABELS } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

const STATUS_OPTIONS: SolicitacaoStatus[] = ["pendente", "enviado", "em_analise", "aprovado", "rejeitado"];

const URGENCIA_BADGE: Record<UrgenciaPrazo, string> = {
  vencido: "badge-pend",
  hoje: "badge-warn",
  proximo: "badge-warn",
  distante: "badge-neutral",
};

function formatDataLimite(dataLimite: string): string {
  return new Date(`${dataLimite}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function PrazosPanel({ contadorId }: { contadorId: string }) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComCliente[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/solicitacoes?c=${encodeURIComponent(contadorId)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erro ao carregar prazos.");
        return;
      }
      setSolicitacoes(json.solicitacoes);
    } catch {
      setError("Erro de conexão ao carregar prazos.");
    }
  }, [contadorId]);

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

  const emAberto = (solicitacoes ?? [])
    .filter((s) => s.data_limite && s.status !== "aprovado" && s.status !== "rejeitado")
    .map((s) => ({ solicitacao: s, prazo: calcularPrazo(s.data_limite!) }));
  const vencidos = emAberto.filter((e) => e.prazo.urgencia === "vencido");
  const proximos = emAberto.filter((e) => e.prazo.urgencia === "hoje" || e.prazo.urgencia === "proximo");
  const distantes = emAberto.filter((e) => e.prazo.urgencia === "distante");

  function renderGrupo(titulo: string, itens: { solicitacao: SolicitacaoComCliente; prazo: PrazoInfo }[]) {
    if (itens.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-[13px] font-bold text-text-2 uppercase tracking-wide mb-2.5 flex items-center gap-2">
          {titulo}{" "}
          <span className="bg-surface-2 rounded-full px-2 py-px text-[11px] font-bold normal-case tracking-normal">
            {itens.length}
          </span>
        </h3>
        <div className="glass-card overflow-hidden">
          {itens.map(({ solicitacao: s, prazo }) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0 flex-wrap"
            >
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold text-[13.5px]">
                  {s.nome}{" "}
                  {s.obrigatoria && (
                    <span className="text-[10.5px] font-semibold text-text-3 uppercase ml-1">
                      obrigatória
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-2 mt-0.5">
                  {s.clientes.nome}
                  {s.categoria ? ` · ${s.categoria}` : ""} · {formatDataLimite(s.data_limite!)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge ${URGENCIA_BADGE[prazo.urgencia]}`}>{prazo.label}</span>
                <StatusBadge status={s.status} />
                <select
                  className="px-2.5 py-1.5 border-[1.5px] border-border rounded-btn bg-surface-2 text-[12.5px] cursor-pointer"
                  value={s.status}
                  onChange={(e) => handleStatusChange(s.id, e.target.value as SolicitacaoStatus)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {STATUS_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-bold mb-4">Prazos</h2>

      {error && (
        <p className="bg-pend-bg text-pend rounded-btn px-3.5 py-2.5 text-[13px] mb-4">{error}</p>
      )}

      {solicitacoes === null && !error && (
        <p className="text-text-2 text-[13px] py-6 text-center">Carregando…</p>
      )}

      {solicitacoes !== null && emAberto.length === 0 && (
        <EmptyState
          title="Nenhum prazo em aberto"
          description="Solicitações com data limite definida e ainda não aprovadas/rejeitadas aparecem aqui, ordenadas por urgência."
        />
      )}

      {renderGrupo("Vencidos", vencidos)}
      {renderGrupo("Próximos 7 dias", proximos)}
      {renderGrupo("Depois", distantes)}
    </div>
  );
}
