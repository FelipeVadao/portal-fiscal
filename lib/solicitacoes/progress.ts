import type { ClienteProgresso, Solicitacao } from "@/lib/types/db";

/**
 * "Concluído" aqui = o cliente já fez a parte dele (enviou o documento),
 * independente do contador já ter revisado. `pendente` e `rejeitado` ainda
 * exigem ação do cliente, por isso não contam pro percentual.
 */
export function calcularProgresso(solicitacoes: Pick<Solicitacao, "status">[]): ClienteProgresso {
  const total = solicitacoes.length;
  const counts = { pendente: 0, enviado: 0, em_analise: 0, aprovado: 0, rejeitado: 0 };
  for (const s of solicitacoes) counts[s.status]++;

  const concluidas = counts.enviado + counts.em_analise + counts.aprovado;

  return {
    total,
    pendentes: counts.pendente,
    enviados: counts.enviado,
    emAnalise: counts.em_analise,
    aprovados: counts.aprovado,
    rejeitados: counts.rejeitado,
    percentualConcluido: total === 0 ? 0 : Math.round((concluidas / total) * 100),
  };
}
