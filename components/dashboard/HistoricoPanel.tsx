"use client";

import { useEffect, useRef, useState } from "react";
import type { Cliente, EventoComRelacoes } from "@/lib/types/db";
import { formatEvento, type EventoIconeChave } from "@/lib/eventos/format";
import { formatRelativeTime } from "@/lib/format/relativeTime";
import EmptyState from "@/components/ui/EmptyState";
import {
  IconAlertTriangle,
  IconClipboardList,
  IconDot,
  IconKey,
  IconMail,
  IconMessageCircle,
  IconPaperclip,
  IconRefreshCw,
  IconTrash,
  IconUnlock,
  IconUser,
} from "@/components/ui/icons";

type ClienteListado = Pick<Cliente, "id" | "nome">;

const ICONE: Record<EventoIconeChave, (props: { className?: string }) => React.ReactElement> = {
  user: IconUser,
  trash: IconTrash,
  key: IconKey,
  unlock: IconUnlock,
  "clipboard-list": IconClipboardList,
  "refresh-cw": IconRefreshCw,
  paperclip: IconPaperclip,
  "message-circle": IconMessageCircle,
  "alert-triangle": IconAlertTriangle,
  mail: IconMail,
  dot: IconDot,
};

function formatDia(iso: string): string {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function HistoricoPanel({ contadorId }: { contadorId: string }) {
  const [clientes, setClientes] = useState<ClienteListado[]>([]);
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [eventos, setEventos] = useState<EventoComRelacoes[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Gera um id por troca de filtro: uma resposta que chega depois do filtro
  // já ter mudado de novo (ou depois de um loadMore concorrente) é descartada
  // em vez de sobrescrever o estado com dados da consulta antiga.
  const requestId = useRef(0);

  useEffect(() => {
    fetch(`/api/clientes?c=${encodeURIComponent(contadorId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setClientes(json.clientes);
      })
      .catch(() => {});
  }, [contadorId]);

  useEffect(() => {
    const id = ++requestId.current;
    setError(null);
    setEventos(null);
    setNextCursor(null);
    (async () => {
      try {
        const params = new URLSearchParams({ c: contadorId });
        if (clienteFiltro) params.set("clienteId", clienteFiltro);
        const res = await fetch(`/api/eventos?${params}`);
        const json = await res.json();
        if (requestId.current !== id) return;
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Erro ao carregar histórico.");
          return;
        }
        setEventos(json.eventos);
        setNextCursor(json.nextCursor);
      } catch {
        if (requestId.current === id) setError("Erro de conexão ao carregar histórico.");
      }
    })();
  }, [contadorId, clienteFiltro]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ c: contadorId, before: nextCursor });
      if (clienteFiltro) params.set("clienteId", clienteFiltro);
      const res = await fetch(`/api/eventos?${params}`);
      const json = await res.json();
      if (requestId.current !== id) return;
      if (res.ok && json.ok) {
        setEventos((atual) => [...(atual ?? []), ...json.eventos]);
        setNextCursor(json.nextCursor);
      }
    } finally {
      if (requestId.current === id) setLoadingMore(false);
    }
  }

  let ultimoDia: string | null = null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold">Histórico de atividade</h2>
        <select
          className="px-3 py-2 rounded-btn border-[1.5px] border-border bg-surface text-text text-[13px] cursor-pointer"
          value={clienteFiltro}
          onChange={(e) => setClienteFiltro(e.target.value)}
        >
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="bg-pend-bg text-pend rounded-btn px-3.5 py-2.5 text-[13px] mb-4">{error}</p>
      )}

      {eventos === null && !error && (
        <p className="text-text-2 text-[13px] py-6 text-center">Carregando…</p>
      )}

      {eventos !== null && eventos.length === 0 && (
        <EmptyState
          title="Nenhuma atividade ainda"
          description="Ações como criação de clientes, solicitações e envio de arquivos vão aparecer aqui."
        />
      )}

      {eventos !== null && eventos.length > 0 && (
        <div className="mb-4">
          {eventos.map((evento) => {
            const { icone, texto } = formatEvento(evento);
            const Icone = ICONE[icone];
            const dia = formatDia(evento.created_at);
            const mostrarDia = dia !== ultimoDia;
            ultimoDia = dia;
            return (
              <div key={evento.id}>
                {mostrarDia && (
                  <div className="text-xs font-bold text-text-2 uppercase tracking-wide mt-5 mb-2 first:mt-0">
                    {dia}
                  </div>
                )}
                <div className="flex items-baseline gap-2.5 px-3.5 py-2.5 rounded-btn transition-colors hover:bg-surface-2">
                  <Icone className="size-3.5 shrink-0 self-center text-text-2" />
                  <span className="flex-1 text-[13.5px] text-text">{texto}</span>
                  <span
                    className="shrink-0 text-xs text-text-2 whitespace-nowrap"
                    title={new Date(evento.created_at).toLocaleString("pt-BR")}
                  >
                    {formatRelativeTime(evento.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {nextCursor && (
        <button
          className="w-full py-2.5 rounded-btn border-[1.5px] border-border bg-surface text-text-2 text-[13px] font-semibold cursor-pointer transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Carregando…" : "Carregar mais"}
        </button>
      )}
    </div>
  );
}
