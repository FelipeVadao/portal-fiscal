/**
 * Templates de e-mail transacional. HTML com estilos inline (clientes de
 * e-mail não confiam em <style>/CSS externo de forma consistente) — por
 * isso não reaproveita os tokens de app/globals.css, só replica a cor
 * primária (#4f46e5) manualmente.
 */

function layout(tituloInterno: string, corpoHtml: string, portalUrl: string): string {
  return `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <div style="font-weight:700;font-size:15px;color:#0f172a;">Portal Fiscal</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;">
                <h1 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${tituloInterno}</h1>
                ${corpoHtml}
                <a href="${portalUrl}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:13.5px;">
                  Acessar o portal
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11.5px;color:#94a3b8;">
                  Entre com seu CPF e o código de acesso que seu contador te enviou.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export function templateNovaSolicitacao(input: {
  clienteNome: string;
  solicitacaoNome: string;
  categoria: string | null;
  dataLimite: string | null;
  portalUrl: string;
}): { subject: string; html: string } {
  const prazo = input.dataLimite
    ? `<p style="margin:0 0 8px;font-size:13.5px;color:#475569;">Prazo: <strong>${new Date(`${input.dataLimite}T00:00:00`).toLocaleDateString("pt-BR")}</strong></p>`
    : "";
  const corpo = `
    <p style="margin:0 0 12px;font-size:14px;color:#334155;">
      Olá, ${input.clienteNome}! Seu contador solicitou um novo documento:
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#0f172a;font-weight:600;">${input.solicitacaoNome}</p>
    ${input.categoria ? `<p style="margin:0 0 8px;font-size:13.5px;color:#475569;">Categoria: ${input.categoria}</p>` : ""}
    ${prazo}
  `;
  return {
    subject: `Novo documento solicitado: ${input.solicitacaoNome}`,
    html: layout("Novo documento solicitado", corpo, input.portalUrl),
  };
}

export function templatePrazoProximo(input: {
  clienteNome: string;
  solicitacaoNome: string;
  dataLimite: string;
  portalUrl: string;
}): { subject: string; html: string } {
  const corpo = `
    <p style="margin:0 0 12px;font-size:14px;color:#334155;">
      Olá, ${input.clienteNome}! O prazo para enviar o documento abaixo está próximo:
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#0f172a;font-weight:600;">${input.solicitacaoNome}</p>
    <p style="margin:0 0 8px;font-size:13.5px;color:#dc2626;font-weight:600;">
      Prazo: ${new Date(`${input.dataLimite}T00:00:00`).toLocaleDateString("pt-BR")}
    </p>
  `;
  return {
    subject: `Prazo próximo: ${input.solicitacaoNome}`,
    html: layout("Prazo se aproximando", corpo, input.portalUrl),
  };
}
