import { requireContadorSession } from "@/lib/auth/session";
import LoginScreen from "@/components/dashboard/LoginScreen";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const contadorId = c || "geral";
  const session = await requireContadorSession(contadorId);

  if (!session) {
    return <LoginScreen contadorId={contadorId} />;
  }

  return <DashboardShell contadorId={contadorId} nome={session.nome} />;
}
