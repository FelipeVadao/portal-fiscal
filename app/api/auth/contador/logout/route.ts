import { getContadorSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getContadorSession();
  session.destroy();
  return Response.json({ ok: true });
}
