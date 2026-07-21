"use client";

import { useEffect, useState } from "react";
import type { ClienteProgresso, SolicitacaoStatus } from "@/lib/types/db";
import type { VolumeDia } from "@/lib/estatisticas/arquivosPorDia";
import { STATUS_LABELS } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

interface Estatisticas {
  progresso: ClienteProgresso;
  arquivosPorDia: VolumeDia[];
}

const STATUS_ORDEM: SolicitacaoStatus[] = ["pendente", "enviado", "em_analise", "aprovado", "rejeitado"];

const STATUS_BAR_CLASS: Record<SolicitacaoStatus, string> = {
  pendente: "bg-pend",
  enviado: "bg-info",
  em_analise: "bg-warn",
  aprovado: "bg-ok",
  rejeitado: "bg-pend",
};

function formatDiaCurto(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export default function GraficosPanel({ contadorId }: { contadorId: string }) {
  const [dados, setDados] = useState<Estatisticas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/estatisticas?c=${encodeURIComponent(contadorId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelado) return;
        if (!json.ok) {
          setError(json.error ?? "Erro ao carregar estatísticas.");
          return;
        }
        setDados(json);
      })
      .catch(() => {
        if (!cancelado) setError("Erro de conexão ao carregar estatísticas.");
      });
    return () => {
      cancelado = true;
    };
  }, [contadorId]);

  if (error) {
    return <p className="bg-pend-bg text-pend rounded-btn px-3.5 py-2.5 text-[13px]">{error}</p>;
  }
  if (dados === null) {
    return <p className="text-text-2 text-[13px] py-6 text-center">Carregando…</p>;
  }

  const { progresso, arquivosPorDia } = dados;

  if (progresso.total === 0) {
    return (
      <EmptyState
        title="Nenhum dado ainda"
        description="Assim que houver solicitações e envios, os gráficos aparecem aqui."
      />
    );
  }

  const contagemPorStatus: Record<SolicitacaoStatus, number> = {
    pendente: progresso.pendentes,
    enviado: progresso.enviados,
    em_analise: progresso.emAnalise,
    aprovado: progresso.aprovados,
    rejeitado: progresso.rejeitados,
  };
  const maxStatus = Math.max(...STATUS_ORDEM.map((s) => contagemPorStatus[s]), 1);

  const maxVolume = Math.max(...arquivosPorDia.map((d) => d.total), 1);
  const picoIndex = arquivosPorDia.reduce((melhorIdx, d, idx, arr) => {
    const melhor = arr[melhorIdx];
    return melhor && d.total > melhor.total ? idx : melhorIdx;
  }, 0);

  return (
    <div>
      <h2 className="text-base font-bold mb-4">Gráficos</h2>

      <div className="grid grid-cols-2 max-[600px]:grid-cols-1 gap-3 mb-4">
        <div className="glass-card px-[18px] py-4">
          <div className="text-2xl font-bold tracking-[-0.5px]">{progresso.total}</div>
          <div className="text-xs text-text-2 mt-0.5">Total de solicitações</div>
        </div>
        <div className="glass-card px-[18px] py-4">
          <div className="text-2xl font-bold tracking-[-0.5px]">{progresso.percentualConcluido}%</div>
          <div className="text-xs text-text-2 mt-0.5">Taxa de conclusão</div>
        </div>
      </div>

      <div className="glass-card px-5 py-[18px] mb-4">
        <h3 className="text-[13.5px] font-bold mb-4">Solicitações por status</h3>
        <div className="flex flex-col gap-3">
          {STATUS_ORDEM.map((status) => {
            const count = contagemPorStatus[status];
            const pct = (count / maxStatus) * 100;
            return (
              <div
                key={status}
                className="relative grid grid-cols-[84px_1fr_32px] max-[600px]:grid-cols-[68px_1fr_28px] items-center gap-2.5 rounded-btn group focus:outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                tabIndex={0}
                aria-label={`${STATUS_LABELS[status]}: ${count} de ${progresso.total}`}
              >
                <span className="text-[12.5px] text-text-2">{STATUS_LABELS[status]}</span>
                <div className="h-5 bg-surface-2 rounded overflow-hidden">
                  <div
                    className={`h-full rounded-r transition-[width] duration-200 ${STATUS_BAR_CLASS[status]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[12.5px] font-bold text-right tabular-nums">{count}</span>
                <div
                  role="tooltip"
                  className="absolute bottom-[calc(100%+6px)] left-[84px] max-[600px]:left-[68px] bg-text text-bg text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 z-10"
                >
                  {STATUS_LABELS[status]}: {count} de {progresso.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card px-5 py-[18px] mb-4">
        <h3 className="text-[13.5px] font-bold mb-4">Arquivos recebidos (últimos 14 dias)</h3>
        <div className="flex items-end gap-1 h-[140px]">
          {arquivosPorDia.map((d, idx) => {
            const alturaPct = (d.total / maxVolume) * 100;
            return (
              <div
                key={d.data}
                className="relative flex-1 min-w-0 flex flex-col items-center justify-end h-full rounded-btn group focus:outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                tabIndex={0}
                aria-label={`${formatDiaCurto(d.data)}: ${d.total} arquivo${d.total === 1 ? "" : "s"}`}
              >
                {idx === picoIndex && d.total > 0 && (
                  <span className="text-[11px] font-bold text-text mb-1 tabular-nums">{d.total}</span>
                )}
                <div className="flex-1 flex items-end w-full max-w-6">
                  <div
                    className="w-full min-h-[2px] bg-primary rounded-t transition-[height] duration-200"
                    style={{ height: `${alturaPct}%` }}
                  />
                </div>
                <span className="text-[9.5px] text-text-3 mt-1.5 whitespace-nowrap">
                  {formatDiaCurto(d.data)}
                </span>
                <div
                  role="tooltip"
                  className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-text text-bg text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 z-10"
                >
                  {formatDiaCurto(d.data)}: {d.total} arquivo{d.total === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
