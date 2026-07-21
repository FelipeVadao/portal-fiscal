/**
 * As mesmas 7 categorias de documento do formulário original do portal
 * (index.html) — reaproveitadas como taxonomia para solicitações e para o
 * upload genérico (sem solicitação vinculada), assim os dois fluxos usam a
 * mesma classificação em vez de texto livre solto.
 */
export const CATEGORIAS_DOCUMENTO = [
  "Declaração Anterior",
  "Relacionados à Renda",
  "Rendas Variáveis",
  "Bens e Direitos",
  "Dívidas e Ônus",
  "Pagamentos e Deduções",
  "Dependentes",
  "Outro",
] as const;

export type CategoriaDocumento = (typeof CATEGORIAS_DOCUMENTO)[number];
