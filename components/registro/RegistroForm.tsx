"use client";

import { useEffect, useState, type FormEvent } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { IconCheck } from "@/components/ui/icons";

const LABEL = "text-[11.5px] font-semibold text-text-2";
const FIELD =
  "w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-btn bg-surface-2 outline-none transition-colors focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/15";

interface Resultado {
  portalUrl: string;
  dashboardUrl: string;
}

export default function RegistroForm() {
  const [origin, setOrigin] = useState("");
  const [convite, setConvite] = useState("");
  const [nome, setNome] = useState("");
  const [id, setId] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function handleIdChange(value: string) {
    setId(value.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!convite.trim()) return setError("Informe o código de convite.");
    if (!nome.trim()) return setError("Informe seu nome completo.");
    if (!id) return setError("Informe um ID para sua conta.");
    if (!/^[a-z0-9-]+$/.test(id)) {
      return setError("ID inválido: use só letras minúsculas, números e hífens.");
    }
    if (senha.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== confirma) return setError("As senhas não coincidem.");

    setLoading(true);
    try {
      const res = await fetch("/api/contadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoConvite: convite.trim(), nome: nome.trim(), id, senha }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erro ao criar conta.");
        setLoading(false);
        return;
      }
      const base = window.location.origin;
      setResultado({ portalUrl: `${base}/?c=${id}`, dashboardUrl: `${base}/dashboard?c=${id}` });
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (resultado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card relative w-full max-w-[420px] px-6 pt-10 pb-8 sm:px-9 text-center motion-safe:animate-fade-up">
          <div className="absolute top-3.5 right-3.5">
            <ThemeToggle />
          </div>
          <div className="mx-auto mb-3.5 flex size-12 items-center justify-center rounded-full bg-ok-bg text-ok">
            <IconCheck className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-ok mb-2">Conta criada com sucesso!</h1>
          <p className="text-[13px] text-text-2 leading-relaxed mb-5">
            Guarde os links abaixo. Compartilhe o link do portal com seus clientes e acesse o
            dashboard para ver os envios.
          </p>
          <div className="flex flex-col gap-2 text-left">
            <div className="bg-surface-2 border border-border rounded-btn px-3.5 py-2.5">
              <label className="block text-[10.5px] font-bold uppercase tracking-wide text-text-3 mb-1">
                Link para seus clientes
              </label>
              <a
                href={resultado.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary break-all hover:underline"
              >
                {resultado.portalUrl}
              </a>
            </div>
            <div className="bg-surface-2 border border-border rounded-btn px-3.5 py-2.5">
              <label className="block text-[10.5px] font-bold uppercase tracking-wide text-text-3 mb-1">
                Seu dashboard
              </label>
              <a
                href={resultado.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary break-all hover:underline"
              >
                {resultado.dashboardUrl}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="glass-card relative w-full max-w-[420px] px-6 pt-10 pb-8 sm:px-9 motion-safe:animate-fade-up"
      >
        <div className="absolute top-3.5 right-3.5">
          <ThemeToggle />
        </div>
        <h1 className="text-[19px] font-bold tracking-tight text-gradient text-center mb-1">
          Portal Fiscal
        </h1>
        <p className="text-[12.5px] text-text-2 text-center mb-6">Criar conta de contador</p>

        <div className="flex flex-col gap-[5px] mb-3">
          <label htmlFor="convite" className={LABEL}>
            Código de convite
          </label>
          <input
            id="convite"
            className={FIELD}
            value={convite}
            onChange={(e) => setConvite(e.target.value)}
            placeholder="Código recebido do administrador"
            autoComplete="off"
          />
        </div>

        <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-3 mt-4 mb-3 pt-3.5 border-t border-border">
          Suas informações
        </div>

        <div className="flex flex-col gap-[5px] mb-3">
          <label htmlFor="nome" className={LABEL}>
            Nome completo
          </label>
          <input
            id="nome"
            className={FIELD}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Diego Rodrigues"
          />
        </div>

        <div className="flex flex-col gap-[5px] mb-3">
          <label htmlFor="contador-id" className={LABEL}>
            ID do contador <span className="text-text-3 font-normal">(sem espaços ou acentos)</span>
          </label>
          <input
            id="contador-id"
            className={FIELD}
            value={id}
            onChange={(e) => handleIdChange(e.target.value)}
            placeholder="Ex.: diego"
            autoComplete="off"
          />
          <div className="text-[11px] text-text-3 mt-0.5">
            Este ID aparece no link do portal e do dashboard.
          </div>
          {id && origin && (
            <div className="text-[11px] bg-surface-2 border border-border rounded-btn px-3 py-2 text-text-3 mt-1 break-all">
              Portal dos clientes: <b className="text-primary">{origin}/?c={id}</b>
              <br />
              Seu dashboard: <b className="text-primary">{origin}/dashboard?c={id}</b>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[5px] mb-3">
          <label htmlFor="senha" className={LABEL}>
            Senha do dashboard <span className="text-text-3 font-normal">(seu acesso privado)</span>
          </label>
          <input
            id="senha"
            type="password"
            className={FIELD}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="flex flex-col gap-[5px] mb-3">
          <label htmlFor="confirma" className={LABEL}>
            Confirmar senha
          </label>
          <input
            id="confirma"
            type="password"
            className={FIELD}
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            placeholder="Repita a senha"
          />
        </div>

        <button type="submit" className="btn-primary w-full mt-1.5" disabled={loading}>
          {loading ? "Criando conta…" : "Criar conta"}
        </button>
        {error && (
          <p className="mt-2.5 text-xs text-pend min-h-[18px] motion-safe:animate-shake">{error}</p>
        )}
      </form>
    </div>
  );
}
