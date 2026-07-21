// Mesmas extensões aceitas pelos vários campos do formulário original
// (accept=".pdf,.jpg,.jpeg,.png", ".pdf,.csv,.txt,.json", ".pdf,.xlsx,.csv").
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "csv",
  "txt",
  "json",
  "xlsx",
] as const;

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — folga generosa para PDFs escaneados

export function hasAllowedExtension(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return !!ext && (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}
