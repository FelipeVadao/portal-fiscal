import "server-only";
import { getResendClient, getEmailFrom } from "./resend";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envia um e-mail transacional. Best-effort igual a logEvento() — nunca
 * lança, só loga o erro no console. Um e-mail de notificação que falha não
 * deve derrubar a operação principal (criar solicitação, etc.).
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: getEmailFrom(),
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[email] falha ao enviar:", subject, "para", to, "-", error.message);
    }
  } catch (err) {
    console.error("[email] falha ao enviar:", subject, "para", to, "-", err);
  }
}
