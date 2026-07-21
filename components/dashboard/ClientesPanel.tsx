"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClienteListadoComProgresso } from "@/lib/types/db";
import ClientCreateForm from "./ClientCreateForm";
import CodigoAcessoReveal from "./CodigoAcessoReveal";
import RequestsPanel from "./RequestsPanel";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { IconChevronDown, IconKey } from "@/components/ui/icons";

function formatCpf(cpf: string): string {
  return cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : cpf;
}

export default function ClientesPanel({ contadorId }: { contadorId: string }) {
  const [clientes, setClientes] = useState<ClienteListadoComProgresso[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [codigoResetado, setCodigoResetado] = useState<{ clienteId: string; codigo: string } | null>(
    null
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/clientes?c=${encodeURIComponent(contadorId)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erro ao carregar clientes.");
        return;
      }
      setClientes(json.clientes);
    } catch {
      setError("Erro de conexão ao carregar clientes.");
    }
  }, [contadorId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o cliente ${nome}? O código de acesso dele deixa de funcionar.`)) return;
    await fetch(`/api/clientes/${id}?c=${encodeURIComponent(contadorId)}`, { method: "DELETE" });
    if (expandedId === id) setExpandedId(null);
    load();
  }

  async function handleResetCodigo(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (
      !confirm("Gerar um novo código de acesso? O código anterior deixa de funcionar imediatamente.")
    )
      return;
    const res = await fetch(`/api/clientes/${id}/reset-codigo?c=${encodeURIComponent(contadorId)}`, {
      method: "POST",
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      setCodigoResetado({ clienteId: id, codigo: json.codigoAcesso });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold">Clientes cadastrados</h2>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Novo cliente
          </button>
        )}
      </div>

      {showForm && (
        <ClientCreateForm
          contadorId={contadorId}
          onCreated={load}
          onClose={() => setShowForm(false)}
        />
      )}

      {error && (
        <p className="bg-pend-bg text-pend rounded-btn px-3.5 py-2.5 text-[13px] mb-4">{error}</p>
      )}

      {clientes === null && !error && (
        <p className="text-text-2 text-[13px] py-6 text-center">Carregando…</p>
      )}

      {clientes !== null && clientes.length === 0 && !showForm && (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre um cliente para gerar o CPF + código de acesso que ele vai usar para entrar no portal."
        />
      )}

      {clientes !== null && clientes.length > 0 && (
        <div className="glass-card overflow-hidden">
          {clientes.map((cliente) => {
            const open = expandedId === cliente.id;
            return (
              <div key={cliente.id} className="border-b border-border last:border-b-0">
                <div
                  className="flex items-center justify-between gap-3 px-[18px] py-3.5 cursor-pointer text-left transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(open ? null : cliente.id)}
                  onKeyDown={(e) => {
                    // Só reage a Enter/Espaço quando o foco está na própria
                    // linha — senão o evento também bubbleia dos botões
                    // internos (🔑/Excluir) e cancelaria a ativação deles.
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedId(open ? null : cliente.id);
                    }
                  }}
                >
                  <Avatar id={cliente.id} nome={cliente.nome} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{cliente.nome}</div>
                    <div className="text-xs text-text-2 mt-0.5">
                      {formatCpf(cliente.cpf)}
                      {cliente.email ? ` · ${cliente.email}` : ""}
                      {cliente.telefone ? ` · ${cliente.telefone}` : ""}
                    </div>
                    {cliente.progresso.total > 0 && (
                      <div className="flex items-center gap-2 mt-1.5 max-w-[220px]">
                        <ProgressBar percent={cliente.progresso.percentualConcluido} />
                        <span className="text-[11px] font-bold text-text-2 whitespace-nowrap">
                          {cliente.progresso.percentualConcluido}%
                        </span>
                      </div>
                    )}
                    {codigoResetado?.clienteId === cliente.id && (
                      <CodigoAcessoReveal
                        codigo={codigoResetado.codigo}
                        onDismiss={() => setCodigoResetado(null)}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="btn-icon"
                      title="Gerar novo código"
                      aria-label="Gerar novo código"
                      onClick={(e) => handleResetCodigo(cliente.id, e)}
                    >
                      <IconKey />
                    </button>
                    <button
                      className="btn-danger-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cliente.id, cliente.nome);
                      }}
                    >
                      Excluir
                    </button>
                    <IconChevronDown
                      className={`size-4 ml-1 text-text-2 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
                {open && (
                  <div className="border-t border-border bg-surface-2">
                    <RequestsPanel contadorId={contadorId} clienteId={cliente.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
