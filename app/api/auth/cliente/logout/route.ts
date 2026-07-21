import { getClienteSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getClienteSession();
  session.destroy();
  return Response.json({ ok: true });
}
