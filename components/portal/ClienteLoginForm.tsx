"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ClienteLoginForm({ contadorId }: { contadorId: string }) {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [codigoAcesso, setCodigoAcesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/cliente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contadorId, cpf, codigoAcesso }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        className="glass-card w-full max-w-[380px] px-6 pt-8 pb-8 sm:px-8 sm:pt-10 text-center motion-safe:animate-fade-up"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gradient mb-1.5">Portal Fiscal</h1>
        <p className="text-[12.5px] text-text-2 mb-6 leading-relaxed">
          Digite seu CPF e o código de acesso que seu contador te enviou.
        </p>
        <div className="flex flex-col gap-[5px] mb-4 text-left">
          <label htmlFor="cpf" className="text-[11.5px] font-semibold text-text-2">
            CPF
          </label>
          <input
            id="cpf"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            required
            autoFocus
            className="px-3.5 py-2.5 border-[1.5px] border-border rounded-btn bg-surface-2 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <div className="flex flex-col gap-[5px] mb-4 text-left">
          <label htmlFor="codigo" className="text-[11.5px] font-semibold text-text-2">
            Código de acesso
          </label>
          <input
            id="codigo"
            value={codigoAcesso}
            onChange={(e) => setCodigoAcesso(e.target.value.toUpperCase())}
            placeholder="Ex.: 7K9M2XQP"
            required
            className="px-3.5 py-2.5 border-[1.5px] border-border rounded-btn bg-surface-2 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading || !cpf || !codigoAcesso}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        {error && (
          <p className="mt-2.5 text-xs text-pend min-h-[18px] motion-safe:animate-shake">{error}</p>
        )}
      </form>
    </div>
  );
}
