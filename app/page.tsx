import { requireClienteSession } from "@/lib/auth/session";
import ClienteLoginForm from "@/components/portal/ClienteLoginForm";
import PortalShell from "@/components/portal/PortalShell";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const contadorId = c || "geral";
  const session = await requireClienteSession(contadorId);

  if (!session) {
    return <ClienteLoginForm contadorId={contadorId} />;
  }

  return <PortalShell contadorId={contadorId} nome={session.nome} />;
}
