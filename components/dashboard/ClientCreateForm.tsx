"use client";

import { useState, type FormEvent } from "react";
import CodigoAcessoReveal from "./CodigoAcessoReveal";

interface Props {
  contadorId: string;
  onCreated: () => void;
  onClose: () => void;
}

const FIELD_CLASS =
  "px-3 py-2.5 border-[1.5px] border-border rounded-btn bg-surface-2 outline-none transition-colors focus:border-primary";
const LABEL_CLASS = "text-[11.5px] font-semibold text-text-2";

export default function ClientCreateForm({ contadorId, onCreated, onClose }: Props) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clientes?c=${encodeURIComponent(contadorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cpf, email, telefone }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Não foi possível criar o cliente.");
        setLoading(false);
        return;
      }
      setCodigoGerado(json.codigoAcesso);
      onCreated();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (codigoGerado) {
    return (
      <div className="glass-card p-5 mb-4 max-w-[420px]">
        <h3 className="text-[15px] mb-1">Cliente criado</h3>
        <p className="text-[12.5px] text-text-2 mb-1 leading-snug">
          Envie o CPF + este código para <strong>{nome}</strong> acessar o portal.
        </p>
        <CodigoAcessoReveal codigo={codigoGerado} onDismiss={onClose} />
      </div>
    );
  }

  return (
    <form className="glass-card p-5 mb-4 max-w-[420px]" onSubmit={handleSubmit}>
      <h3 className="text-[15px] mb-1">Novo cliente</h3>
      <div className="flex flex-col gap-[5px] my-3">
        <label htmlFor="nome" className={LABEL_CLASS}>
          Nome
        </label>
        <input
          id="nome"
          className={FIELD_CLASS}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-[5px] my-3">
        <label htmlFor="cpf" className={LABEL_CLASS}>
          CPF
        </label>
        <input
          id="cpf"
          className={FIELD_CLASS}
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          required
          placeholder="000.000.000-00"
        />
      </div>
      <div className="flex flex-col gap-[5px] my-3">
        <label htmlFor="email" className={LABEL_CLASS}>
          E-mail (opcional)
        </label>
        <input
          id="email"
          type="email"
          className={FIELD_CLASS}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-[5px] my-3">
        <label htmlFor="telefone" className={LABEL_CLASS}>
          Telefone (opcional)
        </label>
        <input
          id="telefone"
          className={FIELD_CLASS}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-pend mt-1">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" className="btn-danger-sm" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Criando…" : "Criar cliente"}
        </button>
      </div>
    </form>
  );
}
