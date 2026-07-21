"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EnviosPanel from "./EnviosPanel";
import ClientesPanel from "./ClientesPanel";
import PrazosPanel from "./PrazosPanel";
import GraficosPanel from "./GraficosPanel";
import HistoricoPanel from "./HistoricoPanel";
import BuscaPanel from "./BuscaPanel";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { IconLogout } from "@/components/ui/icons";

type Tab = "envios" | "clientes" | "prazos" | "graficos" | "historico" | "busca";

const TABS: { id: Tab; label: string }[] = [
  { id: "envios", label: "Envios" },
  { id: "clientes", label: "Clientes" },
  { id: "prazos", label: "Prazos" },
  { id: "graficos", label: "Gráficos" },
  { id: "historico", label: "Histórico" },
  { id: "busca", label: "Busca" },
];

export default function DashboardShell({
  contadorId,
  nome,
}: {
  contadorId: string;
  nome: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("envios");

  async function handleLogout() {
    await fetch("/api/auth/contador/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/80 backdrop-blur-xl px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1 font-bold text-[15px] truncate">
          Portal Fiscal <span className="font-normal text-text-2">· {nome}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <button className="btn-icon" onClick={handleLogout} title="Sair" aria-label="Sair">
            <IconLogout />
          </button>
        </div>
      </header>

      <div className="wrap wrap--wide">
        <nav className="flex gap-1 my-6 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`bg-transparent border-x-0 border-t-0 border-b-2 px-1 py-2.5 mr-5 text-[13.5px] font-semibold cursor-pointer transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-2 hover:text-text"
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "envios" && <EnviosPanel contadorId={contadorId} />}
        {tab === "clientes" && <ClientesPanel contadorId={contadorId} />}
        {tab === "prazos" && <PrazosPanel contadorId={contadorId} />}
        {tab === "graficos" && <GraficosPanel contadorId={contadorId} />}
        {tab === "historico" && <HistoricoPanel contadorId={contadorId} />}
        {tab === "busca" && <BuscaPanel contadorId={contadorId} />}
      </div>
    </div>
  );
}
