"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginScreen({ contadorId }: { contadorId: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/contador/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contadorId, senha }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      // O cookie de sessão já foi definido pelo servidor — refresh re-executa
      // o Server Component da página e ele renderiza o dashboard de verdade.
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
          Entre com a senha do escritório <strong>{contadorId}</strong> para acessar o
          dashboard.
        </p>
        <div className="flex flex-col gap-[5px] mb-4 text-left">
          <label htmlFor="senha" className="text-[11.5px] font-semibold text-text-2">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
            className="px-3.5 py-2.5 border-[1.5px] border-border rounded-btn bg-surface-2 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading || senha.length === 0}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        {error && (
          <p className="mt-2.5 text-xs text-pend min-h-[18px] motion-safe:animate-shake">{error}</p>
        )}
      </form>
    </div>
  );
}
