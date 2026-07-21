// Faixa Unicode dos acentos combinantes (gerados por normalize("NFD")),
// construída via new RegExp com escapes \\u para evitar caracteres
// combinantes literais soltos no código-fonte.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** Mesma regra de slugify que o index.html original aplicava no label do campo. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

/** Mesma convenção de path já usada em produção: {contador_id}/{envio_id}/{campo_slug}/{arquivo}. */
export function buildStoragePath(
  contadorId: string,
  envioId: string,
  campo: string,
  fileName: string
): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? `.${ext}` : ""}`;
  return `${contadorId}/${envioId}/${slugify(campo)}/${safeName}`;
}
