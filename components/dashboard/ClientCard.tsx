"use client";

import { useState } from "react";
import type { ClienteAgrupado } from "@/lib/types/db";
import EnvioSub from "./EnvioSub";
import { IconChevronDown } from "@/components/ui/icons";

interface Props {
  cliente: ClienteAgrupado;
  onDownload: (path: string) => Promise<string | null>;
  onDeleteEnvio: (id: string) => void;
  onDeleteAllForClient: (ids: string[]) => void;
}

export default function ClientCard({
  cliente,
  onDownload,
  onDeleteEnvio,
  onDeleteAllForClient,
}: Props) {
  const [open, setOpen] = useState(false);
  const ultimoEnvio = new Date(cliente.ultimoEnvio).toLocaleDateString("pt-BR");

  return (
    <div className="glass-card mb-3 overflow-hidden transition-shadow hover:shadow-card hover:ring-[1.5px] hover:ring-primary">
      <button
        className="w-full flex items-center justify-between gap-3 px-[18px] py-4 bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-surface-2"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="font-bold text-[14.5px]">{cliente.nome}</div>
          <div className="text-xs text-text-2 mt-0.5">
            {cliente.cpf || "CPF não informado"} · último envio {ultimoEnvio}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="badge badge-neutral">
            {cliente.envios.length} envio{cliente.envios.length === 1 ? "" : "s"}
          </span>
          <span className="badge badge-neutral">
            {cliente.totalArquivos} arquivo{cliente.totalArquivos === 1 ? "" : "s"}
          </span>
          <IconChevronDown
            className={`size-4 text-text-2 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {cliente.envios.map((envio) => (
            <EnvioSub
              key={envio.id}
              envio={envio}
              onDownload={onDownload}
              onDelete={() => onDeleteEnvio(envio.id)}
            />
          ))}
          <div className="px-4 py-3 flex justify-end">
            <button
              className="btn-danger-sm"
              onClick={() => {
                if (
                  confirm(
                    `Excluir todos os ${cliente.envios.length} envio(s) de ${cliente.nome}? Essa ação não pode ser desfeita.`
                  )
                ) {
                  onDeleteAllForClient(cliente.envios.map((e) => e.id));
                }
              }}
            >
              Excluir tudo deste cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
