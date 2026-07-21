"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClienteProgresso, SolicitacaoComArquivos } from "@/lib/types/db";
import SolicitacoesList from "./SolicitacoesList";
import GenericUploadSection from "./GenericUploadSection";
import ProgressBar from "@/components/ui/ProgressBar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PushNotificationToggle from "./PushNotificationToggle";
import EmptyState from "@/components/ui/EmptyState";
import { IconLogout } from "@/components/ui/icons";

export default function PortalShell({ contadorId, nome }: { contadorId: string; nome: string }) {
  const router = useRouter();
  const [envioId, setEnvioId] = useState<string | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComArquivos[] | null>(null);
  const [progresso, setProgresso] = useState<ClienteProgresso | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSolicitacoes = useCallback(async () => {
    try {
      const res = await fetch(`/api/solicitacoes?c=${encodeURIComponent(contadorId)}`);
      const json = await res.json();
      if (res.ok && json.ok) setSolicitacoes(json.solicitacoes);
    } catch {
      // silencioso — a próxima ação do usuário tenta recarregar de qualquer forma
    }
  }, [contadorId]);

  const loadProgresso = useCallback(async () => {
    try {
      const res = await fetch(`/api/clientes/me?c=${encodeURIComponent(contadorId)}`);
      const json = await res.json();
      if (res.ok && json.ok) setProgresso(json.progresso);
    } catch {
      // idem
    }
  }, [contadorId]);

  useEffect(() => {
    async function bootstrapEnvio() {
      try {
        const res = await fetch(`/api/envios?c=${encodeURIComponent(contadorId)}`, {
          method: "POST",
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          setEnvioId(json.envioId);
        } else {
          setError(json.error ?? "Erro ao iniciar sua sessão de envio.");
        }
      } catch {
        setError("Erro de conexão ao iniciar sua sessão.");
      }
    }
    bootstrapEnvio();
    loadSolicitacoes();
    loadProgresso();
  }, [contadorId, loadSolicitacoes, loadProgresso]);

  function handleUploaded() {
    loadSolicitacoes();
    loadProgresso();
  }

  async function handleLogout() {
    await fetch("/api/auth/cliente/logout", { method: "POST" });
    router.refresh();
  }

  const pendentes = solicitacoes?.filter((s) => s.status !== "aprovado") ?? [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/80 backdrop-blur-xl px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1 font-bold text-[15px] truncate">
          Portal Fiscal <span className="font-normal text-text-2">· {nome}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PushNotificationToggle contadorId={contadorId} />
          <ThemeToggle />
          <button className="btn-icon" onClick={handleLogout} title="Sair" aria-label="Sair">
            <IconLogout />
          </button>
        </div>
      </header>

      <div className="wrap">
        {error && (
          <p className="bg-pend-bg text-pend rounded-btn px-3.5 py-2.5 text-[13px] my-5">{error}</p>
        )}

        {progresso && progresso.total > 0 && (
          <div className="glass-card px-4.5 py-4 sm:px-[18px] my-5">
            <div className="flex items-center gap-2.5">
              <ProgressBar percent={progresso.percentualConcluido} />
              <span className="text-[13px] font-bold">{progresso.percentualConcluido}%</span>
            </div>
            <p className="text-xs text-text-2 mt-2">
              {progresso.enviados + progresso.emAnalise + progresso.aprovados} de {progresso.total}{" "}
              documento(s) enviados
            </p>
          </div>
        )}

        {solicitacoes === null && (
          <p className="text-text-2 text-[13px] py-6 text-center">Carregando…</p>
        )}

        {solicitacoes !== null && solicitacoes.length > 0 && pendentes.length === 0 && (
          <EmptyState
            title="Tudo enviado!"
            description="Você já enviou todos os documentos solicitados. Obrigado!"
          />
        )}

        {solicitacoes !== null && solicitacoes.length === 0 && (
          <EmptyState
            title="Nenhuma solicitação por enquanto"
            description="Seu contador ainda não pediu nenhum documento específico. Se quiser adiantar, use o formulário abaixo."
          />
        )}

        {pendentes.length > 0 && (
          <SolicitacoesList
            contadorId={contadorId}
            envioId={envioId}
            solicitacoes={pendentes}
            onUploaded={handleUploaded}
          />
        )}

        <GenericUploadSection contadorId={contadorId} envioId={envioId} onUploaded={handleUploaded} />
      </div>
    </div>
  );
}
