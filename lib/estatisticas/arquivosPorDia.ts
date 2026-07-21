export interface VolumeDia {
  data: string;
  total: number;
}

/**
 * Agrupa arquivos por dia de criação (últimos `dias` dias, incluindo hoje,
 * com dias sem envio zerados). Compara por prefixo ISO ("YYYY-MM-DD"), o
 * mesmo padrão já usado em app/api/envios/route.ts pro card "Envios hoje" —
 * o servidor roda em UTC, então isso é consistente com o resto do dashboard.
 */
export function agruparArquivosPorDia(
  arquivos: { created_at: string }[],
  dias: number
): VolumeDia[] {
  const hoje = new Date();
  const buckets = new Map<string, number>();

  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const arquivo of arquivos) {
    const dia = arquivo.created_at.slice(0, 10);
    if (buckets.has(dia)) {
      buckets.set(dia, (buckets.get(dia) ?? 0) + 1);
    }
  }

  return Array.from(buckets, ([data, total]) => ({ data, total }));
}
