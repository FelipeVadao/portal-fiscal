import type { EventoComRelacoes, SolicitacaoStatus } from "@/lib/types/db";
import { STATUS_LABELS } from "@/components/ui/StatusBadge";

export type EventoIconeChave =
  | "user"
  | "trash"
  | "key"
  | "unlock"
  | "clipboard-list"
  | "refresh-cw"
  | "paperclip"
  | "message-circle"
  | "alert-triangle"
  | "mail"
  | "dot";

interface EventoFormatado {
  icone: EventoIconeChave;
  texto: string;
}

const CLIENTE_REMOVIDO = "Cliente removido";
const SOLICITACAO_REMOVIDA = "solicitação removida";

function metaString(metadata: Record<string, unknown> | null, chave: string): string | null {
  const valor = metadata?.[chave];
  return typeof valor === "string" ? valor : null;
}

/**
 * Converte um evento bruto em ícone + descrição legível para a timeline do
 * dashboard. `metadata.nome` significa coisas diferentes por tipo de evento
 * (nome do cliente vs. nome da solicitação) — por isso cada case lê a
 * metadata isoladamente, em vez de compartilhar um fallback genérico.
 * `icone` é uma chave (não o glifo em si) — o componente que renderiza mapeia
 * pra um ícone SVG compartilhado (ver components/ui/icons.tsx).
 */
export function formatEvento(evento: EventoComRelacoes): EventoFormatado {
  const clienteAtual = evento.clientes?.nome ?? null;
  const solicitacaoAtual = evento.solicitacoes?.nome ?? null;

  switch (evento.tipo) {
    case "cliente_criado": {
      const nome = clienteAtual ?? metaString(evento.metadata, "nome") ?? CLIENTE_REMOVIDO;
      return { icone: "user", texto: `Cliente ${nome} foi cadastrado` };
    }
    case "cliente_removido": {
      const nome = metaString(evento.metadata, "nome") ?? CLIENTE_REMOVIDO;
      return { icone: "trash", texto: `Cliente ${nome} foi removido` };
    }
    case "codigo_acesso_resetado": {
      const nome = clienteAtual ?? CLIENTE_REMOVIDO;
      return { icone: "key", texto: `Código de acesso de ${nome} foi resetado` };
    }
    case "cliente_login": {
      const nome = clienteAtual ?? CLIENTE_REMOVIDO;
      return { icone: "unlock", texto: `${nome} entrou no portal` };
    }
    case "solicitacao_criada": {
      const solicitacaoNome = solicitacaoAtual ?? metaString(evento.metadata, "nome") ?? SOLICITACAO_REMOVIDA;
      const clienteNome = clienteAtual ?? CLIENTE_REMOVIDO;
      return { icone: "clipboard-list", texto: `Solicitação "${solicitacaoNome}" criada para ${clienteNome}` };
    }
    case "solicitacao_status_alterado": {
      const solicitacaoLabel = solicitacaoAtual ? `"${solicitacaoAtual}"` : `(${SOLICITACAO_REMOVIDA})`;
      const clienteNome = clienteAtual ?? CLIENTE_REMOVIDO;
      const de = metaString(evento.metadata, "de") as SolicitacaoStatus | null;
      const para = metaString(evento.metadata, "para") as SolicitacaoStatus | null;
      const deLabel = de ? STATUS_LABELS[de] ?? de : "?";
      const paraLabel = para ? STATUS_LABELS[para] ?? para : "?";
      return {
        icone: "refresh-cw",
        texto: `Status da solicitação ${solicitacaoLabel} de ${clienteNome}: ${deLabel} → ${paraLabel}`,
      };
    }
    case "solicitacao_removida": {
      const nome = metaString(evento.metadata, "nome") ?? SOLICITACAO_REMOVIDA;
      return { icone: "trash", texto: `Solicitação "${nome}" foi removida` };
    }
    case "arquivo_enviado": {
      const clienteNome = clienteAtual ?? CLIENTE_REMOVIDO;
      const arquivo = metaString(evento.metadata, "nome_original") ?? "arquivo";
      return { icone: "paperclip", texto: `${clienteNome} enviou o arquivo "${arquivo}"` };
    }
    case "comentario_criado": {
      // A timeline só é vista pelo contador, então "contador" aqui é sempre "você".
      const autor = evento.ator_tipo === "cliente" ? (clienteAtual ?? CLIENTE_REMOVIDO) : "Você";
      const solicitacaoLabel = solicitacaoAtual ? `"${solicitacaoAtual}"` : `(${SOLICITACAO_REMOVIDA})`;
      const trecho = metaString(evento.metadata, "texto") ?? "";
      return { icone: "message-circle", texto: `${autor} comentou em ${solicitacaoLabel}: "${trecho}"` };
    }
    case "arquivo_suspeito_ia": {
      const clienteNome = clienteAtual ?? CLIENTE_REMOVIDO;
      const arquivo = metaString(evento.metadata, "nome") ?? "arquivo";
      const motivo = metaString(evento.metadata, "motivo");
      return {
        icone: "alert-triangle",
        texto: `IA sinalizou o arquivo "${arquivo}" de ${clienteNome} como possivelmente errado${motivo ? `: ${motivo}` : ""}`,
      };
    }
    case "prazo_notificado": {
      const solicitacaoNome = solicitacaoAtual ?? metaString(evento.metadata, "nome") ?? SOLICITACAO_REMOVIDA;
      const clienteNome = clienteAtual ?? CLIENTE_REMOVIDO;
      return {
        icone: "mail",
        texto: `${clienteNome} foi avisado por e-mail do prazo de "${solicitacaoNome}"`,
      };
    }
    default:
      return { icone: "dot", texto: evento.tipo };
  }
}
