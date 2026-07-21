export type UrgenciaPrazo = "vencido" | "hoje" | "proximo" | "distante";

export interface PrazoInfo {
  urgencia: UrgenciaPrazo;
  diasRestantes: number;
  label: string;
}

function inicioDoDia(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Classifica um `data_limite` (string "YYYY-MM-DD") em urgência + label
 * legível. O "T00:00:00" força o parse em horário local — sem isso,
 * `new Date("YYYY-MM-DD")` é interpretado como UTC meia-noite e pode exibir
 * o dia errado em fusos horários negativos (mesmo truque já usado em
 * RequestsPanel.tsx).
 */
export function calcularPrazo(dataLimite: string): PrazoInfo {
  const limite = inicioDoDia(new Date(`${dataLimite}T00:00:00`));
  const hoje = inicioDoDia(new Date());
  const diasRestantes = Math.round((limite.getTime() - hoje.getTime()) / 86_400_000);

  if (diasRestantes < 0) {
    const dias = Math.abs(diasRestantes);
    return {
      urgencia: "vencido",
      diasRestantes,
      label: `Vencido há ${dias} dia${dias === 1 ? "" : "s"}`,
    };
  }
  if (diasRestantes === 0) {
    return { urgencia: "hoje", diasRestantes, label: "Vence hoje" };
  }
  if (diasRestantes === 1) {
    return { urgencia: "proximo", diasRestantes, label: "Vence amanhã" };
  }
  if (diasRestantes <= 7) {
    return { urgencia: "proximo", diasRestantes, label: `Vence em ${diasRestantes} dias` };
  }
  return { urgencia: "distante", diasRestantes, label: `Vence em ${diasRestantes} dias` };
}
