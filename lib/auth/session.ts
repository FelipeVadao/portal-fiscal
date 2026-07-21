import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export interface ContadorSessionData {
  contadorId: string;
  nome: string;
}

export interface ClienteSessionData {
  clienteId: string;
  contadorId: string;
  nome: string;
}

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET ausente ou curta demais (mínimo 32 caracteres). Veja .env.example."
    );
  }
  return secret;
}

const contadorSessionOptions: SessionOptions = {
  get password() {
    return requireSessionSecret();
  },
  cookieName: "pf_contador_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getContadorSession(): Promise<IronSession<ContadorSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<ContadorSessionData>(cookieStore, contadorSessionOptions);
}

/**
 * Para uso em API routes: retorna a sessão só se houver contador logado E
 * (quando informado) o contadorId da URL (`?c=`) bater com o da sessão —
 * evita que uma sessão válida para o contador A seja reaproveitada contra
 * dados do contador B só editando o parâmetro na URL.
 */
export async function requireContadorSession(
  contadorIdFromRequest?: string | null
): Promise<IronSession<ContadorSessionData> | null> {
  const session = await getContadorSession();
  if (!session.contadorId) return null;
  if (contadorIdFromRequest && session.contadorId !== contadorIdFromRequest) return null;
  return session;
}

const clienteSessionOptions: SessionOptions = {
  get password() {
    return requireSessionSecret();
  },
  cookieName: "pf_cliente_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getClienteSession(): Promise<IronSession<ClienteSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<ClienteSessionData>(cookieStore, clienteSessionOptions);
}

/** Mesma lógica de requireContadorSession, só que para a sessão do cliente. */
export async function requireClienteSession(
  contadorIdFromRequest?: string | null
): Promise<IronSession<ClienteSessionData> | null> {
  const session = await getClienteSession();
  if (!session.clienteId) return null;
  if (contadorIdFromRequest && session.contadorId !== contadorIdFromRequest) return null;
  return session;
}
