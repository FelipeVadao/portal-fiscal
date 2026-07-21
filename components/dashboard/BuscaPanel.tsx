"use client";

import { useEffect, useRef, useState } from "react";
import type { ArquivoResultadoBusca, ClienteResultadoBusca, SolicitacaoComCliente } from "@/lib/types/db";
import StatusBadge from "@/components/ui/StatusBadge";
import { IconFileText } from "@/components/ui/icons";

interface Resultados {
  clientes: ClienteResultadoBusca[];
  solicitacoes: SolicitacaoComCliente[];
  arquivos: ArquivoResultadoBusca[];
}

const VAZIO: Resultados = { clientes: [], solicitacoes: [], arquivos: [] };
const DEBOUNCE_MS = 300;

function formatCpf(cpf: string): string {
  return cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : cpf;
}

export default function BuscaPanel({ contadorId }: { contadorId: string }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Resultados>(VAZIO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const termo = q.trim();
    if (termo.length < 2) {
      setResultados(VAZIO);
      setError(null);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/busca?c=${encodeURIComponent(contadorId)}&q=${encodeURIComponent(termo)}`
        );
        const json = await res.json();
        if (requestId.current !== id) return;
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Erro ao buscar.");
          setLoading(false);
          return;
        }
        setResultados({
          clientes: json.clientes,
          solicitacoes: json.solicitacoes,
          arquivos: json.arquivos,
        });
        setError(null);
        setLoading(false);
      } catch {
        if (requestId.current === id) {
          setError("Erro de conexão ao buscar.");
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [q, contadorId]);

  const termo = q.trim();
  const semResultados =
    termo.length >= 2 &&
    !loading &&
    !error &&
    resultados.clientes.length === 0 &&
    resultados.solicitacoes.length === 0 &&
    resultados.arquivos.length === 0;

  return (
    <div>
      <h2 className="text-base font-bold mb-4">Busca</h2>
      <input
        className="w-full px-4 py-3 border-[1.5px] border-border rounded-btn bg-surface text-text text-sm mb-2 outline-none focus:border-primary"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome, CPF, e-mail, documento…"
        autoFocus
      />

      {termo.length > 0 && termo.length < 2 && (
        <p className="text-text-2 text-[13px] px-0.5 py-2">Digite pelo menos 2 caracteres.</p>
      )}
      {error && (
        <p className="bg-pend-bg text-pend rounded-btn px-3.5 py-2.5 text-[13px] mt-2">{error}</p>
      )}
      {loading && <p className="text-text-2 text-[13px] px-0.5 py-2">Buscando…</p>}
      {semResultados && (
        <p className="text-text-2 text-[13px] px-0.5 py-2">Nenhum resultado para &quot;{termo}&quot;.</p>
      )}

      {resultados.clientes.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold text-text-2 uppercase tracking-wide mb-2">Clientes</h3>
          <div className="glass-card overflow-hidden">
            {resultados.clientes.map((c) => (
              <div key={c.id} className="px-4 py-3 border-b border-border last:border-b-0">
                <div className="font-semibold text-[13.5px]">{c.nome}</div>
                <div className="text-xs text-text-2 mt-0.5">
                  {formatCpf(c.cpf)}
                  {c.email ? ` · ${c.email}` : ""}
                  {c.telefone ? ` · ${c.telefone}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resultados.solicitacoes.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold text-text-2 uppercase tracking-wide mb-2">Solicitações</h3>
          <div className="glass-card overflow-hidden">
            {resultados.solicitacoes.map((s) => (
              <div key={s.id} className="px-4 py-3 border-b border-border last:border-b-0">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="font-semibold text-[13.5px]">{s.nome}</div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="text-xs text-text-2 mt-0.5">
                  {s.clientes.nome}
                  {s.categoria ? ` · ${s.categoria}` : ""}
                </div>
                {s.descricao && <div className="text-[12.5px] text-text-2 mt-1">{s.descricao}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {resultados.arquivos.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold text-text-2 uppercase tracking-wide mb-2">Arquivos</h3>
          <div className="glass-card overflow-hidden">
            {resultados.arquivos.map((a) => (
              <div key={a.id} className="px-4 py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-1.5 font-semibold text-[13.5px]">
                  <IconFileText className="size-3.5 shrink-0 text-text-2" />
                  {a.nome_original}
                </div>
                <div className="text-xs text-text-2 mt-0.5">
                  {a.envios?.clientes?.nome ?? "Cliente desconhecido"}
                  {a.solicitacoes ? ` · ${a.solicitacoes.nome}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
