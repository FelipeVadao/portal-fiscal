import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureVapidConfigured, webpush } from "@/lib/push/webpush";

interface SendPushToClienteInput {
  clienteId: string;
  title: string;
  body: string;
  url: string;
}

/**
 * Manda uma push notification pra todas as inscrições ativas de um cliente
 * (um por navegador/dispositivo em que ele ativou). Best-effort igual a
 * sendEmail()/logEvento(): nunca lança. Uma inscrição que responde 404/410
 * (expirada ou revogada pelo navegador) é removida do banco — é o jeito
 * padrão de manter push_subscriptions só com inscrições vivas.
 */
export async function sendPushToCliente({ clienteId, title, body, url }: SendPushToClienteInput): Promise<void> {
  try {
    ensureVapidConfigured();
  } catch (err) {
    console.error("[push] VAPID não configurado:", err);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("cliente_id", clienteId);

  if (error || !subs || subs.length === 0) return;

  const payload = JSON.stringify({ title, body, url });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("[push] falha ao enviar:", sub.endpoint, err);
        }
      }
    })
  );
}
