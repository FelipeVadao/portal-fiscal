"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClienteAgrupado } from "@/lib/types/db";
import ClientCard from "./ClientCard";
import StatsGrid from "./StatsGrid";
import EmptyState from "@/components/ui/EmptyState";

interface Stats {
  totalClientes: number;
  totalArquivos: number;
  enviosHoje: number;
}

export default function EnviosPanel({ contadorId }: { contadorId: string }) {
  const [clientes, setClientes] = useState<ClienteAgrupado[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/envios?c=${encodeURIComponent(contadorId)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erro ao carregar dados.");
        return;
      }
      setClientes(json.clientes);
      setStats(json.stats);
    } catch {
      setError("Erro de conexão ao carregar dados.");
    }
  }, [contadorId]);

  useEffect(() => {
    load();
  }, [load]);

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

  async function handleDeleteEnvio(id: string) {
    await fetch(`/api/envios/${id}?c=${encodeURIComponent(contadorId)}`, { method: "DELETE" });
    load();
  }

  async function handleDeleteIds(ids: string[]) {
    await fetch(`/api/envios/bulk-delete?c=${encodeURIComponent(contadorId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    load();
  }

  return (
    <div>
      {error && (
        <p className="bg-pend-bg text-pend rounded-btn px-3.5 py-2.5 text-[13px] mb-5">{error}</p>
      )}

      {stats && <StatsGrid stats={stats} />}

      {clientes === null && !error && (
        <p className="text-text-2 text-[13px] py-6 text-center">Carregando…</p>
      )}

      {clientes !== null && clientes.length === 0 && (
        <EmptyState
          title="Nenhum envio ainda"
          description="Assim que um cliente enviar documentos pelo portal, ele aparece aqui."
        />
      )}

      {clientes !== null && clientes.length > 0 && (
        <div>
          {clientes.map((cliente) => (
            <ClientCard
              key={cliente.chave}
              cliente={cliente}
              onDownload={handleDownload}
              onDeleteEnvio={handleDeleteEnvio}
              onDeleteAllForClient={handleDeleteIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
