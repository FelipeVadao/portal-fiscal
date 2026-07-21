"use client";

import { useState } from "react";

interface Props {
  codigo: string;
  onDismiss: () => void;
}

export default function CodigoAcessoReveal({ codigo, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (ex: contexto não-seguro) — o código já está visível na tela.
    }
  }

  return (
    <div className="bg-warn-bg border-[1.5px] border-warn rounded-btn p-3.5 mt-2.5">
      <p className="text-xs text-text mb-2.5 leading-relaxed">
        Anote este código agora — ele não será mostrado de novo, só é possível gerar um novo
        código depois.
      </p>
      <div className="flex items-center gap-2.5">
        <code className="flex-1 text-lg font-bold tracking-[2px] px-3 py-2 bg-surface border border-border rounded-btn text-center">
          {codigo}
        </code>
        <button type="button" className="btn-primary" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <button
        type="button"
        className="block mt-2.5 bg-transparent border-none text-text-2 text-xs underline cursor-pointer p-0"
        onClick={onDismiss}
      >
        Entendi, fechar
      </button>
    </div>
  );
}
