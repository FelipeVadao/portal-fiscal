import type { SolicitacaoStatus } from "@/lib/types/db";

export const STATUS_LABELS: Record<SolicitacaoStatus, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

const CLASSES: Record<SolicitacaoStatus, string> = {
  pendente: "bg-pend-bg text-pend",
  enviado: "bg-info-bg text-info",
  em_analise: "bg-warn-bg text-warn",
  aprovado: "bg-ok-bg text-ok",
  rejeitado: "bg-pend-bg text-pend",
};

export default function StatusBadge({ status }: { status: SolicitacaoStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
