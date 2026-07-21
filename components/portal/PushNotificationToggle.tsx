"use client";

import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "@/lib/push/browser";
import { IconBell, IconBellOff } from "@/components/ui/icons";

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

interface Props {
  contadorId: string;
}

async function getSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export default function PushNotificationToggle({ contadorId }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsubscribed"));
  }, []);

  async function ativar() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setStatus("unsubscribed");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const res = await fetch(`/api/push/subscribe?c=${encodeURIComponent(contadorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        // O navegador já criou a inscrição, mas o servidor não conseguiu salvar —
        // desfaz pra não deixar o botão dizer "ativado" com nada gravado no banco.
        await subscription.unsubscribe();
        setStatus("unsubscribed");
        return;
      }

      setStatus("subscribed");
    } catch {
      setStatus("unsubscribed");
    } finally {
      setBusy(false);
    }
  }

  async function desativar() {
    setBusy(true);
    try {
      const sub = await getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?c=${encodeURIComponent(contadorId)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  if (status === "denied") {
    return (
      <button className="btn-icon" disabled title="Notificações bloqueadas no navegador" aria-label="Notificações bloqueadas">
        <IconBellOff />
      </button>
    );
  }

  if (status === "subscribed") {
    return (
      <button
        className="btn-icon"
        onClick={desativar}
        disabled={busy}
        title="Desativar notificações"
        aria-label="Desativar notificações"
      >
        <IconBell />
      </button>
    );
  }

  return (
    <button
      className="btn-icon"
      onClick={ativar}
      disabled={busy}
      title="Ativar notificações"
      aria-label="Ativar notificações"
    >
      <IconBellOff />
    </button>
  );
}
