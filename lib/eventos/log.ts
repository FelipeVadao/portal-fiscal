import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { EventoAtorTipo } from "@/lib/types/db";

interface LogEventoInput {
  contadorId: string;
  clienteId?: string | null;
  solicitacaoId?: string | null;
  envioId?: string | null;
  arquivoId?: string | null;
  tipo: string;
  atorTipo: EventoAtorTipo;
  atorId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Grava um evento de auditoria. Sem UI ainda (feature de Histórico é
 * futura) — chamado a partir das rotas que já mutam dados de qualquer
 * forma, então o custo marginal é uma insert a mais. Falha em silêncio
 * (loga no console) para nunca quebrar a operação principal por causa do
 * log — auditoria é best-effort, não deve ser um ponto de falha.
 */
export async function logEvento(input: LogEventoInput): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("eventos").insert({
    contador_id: input.contadorId,
    cliente_id: input.clienteId ?? null,
    solicitacao_id: input.solicitacaoId ?? null,
    envio_id: input.envioId ?? null,
    arquivo_id: input.arquivoId ?? null,
    tipo: input.tipo,
    ator_tipo: input.atorTipo,
    ator_id: input.atorId ?? null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.error("[eventos] falha ao registrar evento:", input.tipo, error.message);
  }
}
