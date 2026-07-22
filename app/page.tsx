import { redirect } from "next/navigation";
import { requireClienteSession } from "@/lib/auth/session";
import ClienteLoginForm from "@/components/portal/ClienteLoginForm";
import PortalShell from "@/components/portal/PortalShell";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;

  // Sem ?c=, não há como saber de qual contador é o cliente que está
  // acessando — esse link só faz sentido para quem tem o link específico
  // do próprio contador. Quem abre a raiz "pelada" está, na prática,
  // procurando se cadastrar como contador.
  if (!c) {
    redirect("/registro");
  }

  const session = await requireClienteSession(c);

  if (!session) {
    return <ClienteLoginForm contadorId={c} />;
  }

  return <PortalShell contadorId={c} nome={session.nome} />;
}
