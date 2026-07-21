"use client";

import { useState } from "react";
import { CATEGORIAS_DOCUMENTO } from "@/lib/constants/categorias";
import UploadField from "./UploadField";

interface Props {
  contadorId: string;
  envioId: string | null;
  onUploaded: () => void;
}

/**
 * Fallback para quando o cliente quer enviar um documento sem que haja uma
 * solicitação específica pra ele — mantido de propósito (ver plano):
 * evita tela vazia em contadores que ainda não criaram nenhuma solicitação,
 * e cobre documentos que o contador não pensou em pedir com antecedência.
 */
export default function GenericUploadSection({ contadorId, envioId, onUploaded }: Props) {
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_DOCUMENTO[0]);

  return (
    <div className="glass-card p-[18px] mb-6">
      <h3 className="text-[14.5px] mb-1">Enviar outro documento</h3>
      <p className="text-xs text-text-2 mb-3">
        Não tem uma solicitação para o que você quer mandar? Envie por aqui.
      </p>
      <div className="flex flex-col gap-[5px] mb-1 max-w-xs">
        <label htmlFor="categoria-generica" className="text-[11.5px] font-semibold text-text-2">
          Categoria
        </label>
        <select
          id="categoria-generica"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="px-3 py-2 border-[1.5px] border-border rounded-btn bg-surface-2 outline-none transition-colors focus:border-primary"
        >
          {CATEGORIAS_DOCUMENTO.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <UploadField
        contadorId={contadorId}
        envioId={envioId}
        campo={categoria}
        accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.txt,.json"
        multiple
        onUploaded={onUploaded}
      />
    </div>
  );
}
