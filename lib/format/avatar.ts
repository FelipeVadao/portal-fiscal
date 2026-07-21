/**
 * Paleta fixa (8 cores) para os avatares de cliente — deliberadamente longe
 * dos tons reservados de status (--ok/--pend/--warn/--info) e do --primary,
 * pra não parecer um badge de status. A ordem é fixa: o índice de cada
 * cliente nunca muda entre renders (ver getAvatarColor).
 */
const AVATAR_COLORS = [
  "#dc2626", // vermelho
  "#ea580c", // laranja
  "#b45309", // âmbar escuro
  "#16a34a", // verde
  "#0891b2", // ciano
  "#2563eb", // azul
  "#7c3aed", // violeta
  "#db2777", // rosa
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Cor determinística a partir de um id estável (não do nome, que pode ser editado). */
export function getAvatarColor(id: string): string {
  return AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length] ?? "#2563eb";
}

/** "Cliente Demo" → "CD"; "Ana" → "AN". */
export function getInitials(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = palavras[0];
  if (!primeira) return "?";
  if (palavras.length === 1) return primeira.slice(0, 2).toUpperCase();
  const ultima = palavras[palavras.length - 1] ?? primeira;
  return (primeira[0] ?? "").concat(ultima[0] ?? "").toUpperCase();
}
