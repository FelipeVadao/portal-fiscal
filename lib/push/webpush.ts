import "server-only";
import webpush from "web-push";
import { getAppUrl } from "@/lib/email/resend";

let configured = false;

/** Configura o client web-push uma vez por processo (setVapidDetails é global, não por-chamada). */
export function ensureVapidConfigured(): void {
  if (configured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY não configuradas. Veja .env.example.");
  }

  webpush.setVapidDetails(getAppUrl(), publicKey, privateKey);
  configured = true;
}

export { webpush };
