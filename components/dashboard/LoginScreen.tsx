"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginScreen.module.css";

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
    <div className={styles.screen}>
      <form className={`card ${styles.lockCard}`} onSubmit={handleSubmit}>
        <div className={styles.logo}>PF</div>
        <h1 className={styles.title}>Portal Fiscal</h1>
        <p className={styles.sub}>
          Entre com a senha do escritório <strong>{contadorId}</strong> para acessar o
          dashboard.
        </p>
        <div className={styles.field}>
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading || senha.length === 0}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        {error && <p className={styles.err}>{error}</p>}
      </form>
    </div>
  );
}
