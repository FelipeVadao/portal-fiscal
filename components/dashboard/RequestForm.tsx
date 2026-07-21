"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIAS_DOCUMENTO } from "@/lib/constants/categorias";

interface Props {
  contadorId: string;
  clienteId: string;
  onCreated: () => void;
  onClose: () => void;
}

const FIELD_CLASS =
  "px-3 py-2.5 border-[1.5px] border-border rounded-btn bg-surface-2 outline-none transition-colors focus:border-primary font-[inherit] resize-y";
const LABEL_CLASS = "text-[11.5px] font-semibold text-text-2";

export default function RequestForm({ contadorId, clienteId, onCreated, onClose }: Props) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [obrigatoria, setObrigatoria] = useState(true);
  const [dataLimite, setDataLimite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/solicitacoes?c=${encodeURIComponent(contadorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, nome, categoria, descricao, obrigatoria, dataLimite }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Não foi possível criar a solicitação.");
        setLoading(false);
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form className="glass-card p-[18px] my-3" onSubmit={handleSubmit}>
      <h4 className="text-sm mb-2.5">Nova solicitação</h4>
      <div className="flex flex-col gap-[5px] mb-3">
        <label htmlFor="req-nome" className={LABEL_CLASS}>
          Nome do documento
        </label>
        <input
          id="req-nome"
          className={FIELD_CLASS}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          placeholder="Ex.: Holerite de dezembro"
        />
      </div>
      <div className="flex flex-col gap-[5px] mb-3">
        <label htmlFor="req-categoria" className={LABEL_CLASS}>
          Categoria
        </label>
        <select
          id="req-categoria"
          className={FIELD_CLASS}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Sem categoria</option>
          {CATEGORIAS_DOCUMENTO.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-[5px] mb-3">
        <label htmlFor="req-descricao" className={LABEL_CLASS}>
          Descrição (opcional)
        </label>
        <textarea
          id="req-descricao"
          className={FIELD_CLASS}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-end gap-4 flex-wrap">
        <div className="flex flex-col gap-[5px] mb-3">
          <label htmlFor="req-prazo" className={LABEL_CLASS}>
            Data limite (opcional)
          </label>
          <input
            id="req-prazo"
            type="date"
            className={FIELD_CLASS}
            value={dataLimite}
            onChange={(e) => setDataLimite(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-1.5 text-[12.5px] text-text-2 pb-2.5">
          <input
            type="checkbox"
            checked={obrigatoria}
            onChange={(e) => setObrigatoria(e.target.checked)}
          />
          Obrigatória
        </label>
      </div>
      {error && <p className="text-xs text-pend mb-2">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-danger-sm" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Criando…" : "Criar solicitação"}
        </button>
      </div>
    </form>
  );
}
