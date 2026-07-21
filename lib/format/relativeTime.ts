const DIVISIONS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

/**
 * "há 5 minutos" / "há 2 dias", em pt-BR, a partir de um timestamp ISO.
 * `created_at` vem do relógio do Postgres, não do browser — um desvio de
 * poucos segundos entre os dois é normal e, sem o clamp abaixo, faria um
 * evento que acabou de acontecer aparecer como "em 3 segundos" (futuro).
 * Como tudo aqui já é um fato passado (o evento já foi salvo), qualquer
 * diferença positiva é só esse desvio de relógio, nunca um evento futuro de
 * verdade — por isso é seguro zerar em vez de exibir.
 */
export function formatRelativeTime(iso: string): string {
  const diffSec = Math.min(Math.round((new Date(iso).getTime() - Date.now()) / 1000), 0);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  for (const [unit, secondsInUnit] of DIVISIONS) {
    if (Math.abs(diffSec) >= secondsInUnit) {
      return rtf.format(Math.round(diffSec / secondsInUnit), unit);
    }
  }
  return rtf.format(diffSec, "second");
}
