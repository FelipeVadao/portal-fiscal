import "server-only";
import { Resend } from "resend";

/**
 * Cliente Resend — só pode ser importado por código server-side. Segue o
 * mesmo padrão lazy-singleton de lib/supabase/server.ts.
 */
let cached: Resend | null = null;

export function getResendClient(): Resend {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada. Veja .env.example.");
  }

  cached = new Resend(apiKey);
  return cached;
}

/**
 * Remetente dos e-mails. Sem domínio verificado no Resend, só
 * onboarding@resend.dev funciona — e mesmo assim só envia pra o e-mail da
 * conta Resend, não pra clientes reais. Trocar EMAIL_FROM assim que um
 * domínio for verificado (ver CLAUDE.md).
 */
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "Portal Fiscal <onboarding@resend.dev>";
}

/** URL base do app, usada pra montar links nos e-mails (nunca chega ao browser, só usado server-side). */
export function getAppUrl(): string {
  return process.env.APP_URL ?? "https://portal-fiscal-wine.vercel.app";
}
