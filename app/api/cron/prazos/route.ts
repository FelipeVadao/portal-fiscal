import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { templatePrazoProximo } from "@/lib/email/templates";
import { getAppUrl } from "@/lib/email/resend";
import { logEvento } from "@/lib/eventos/log";
import { sendPushToCliente } from "@/lib/push/send";

interface SolicitacaoComPrazoPendente {
  id: string;
  nome: string;
  contador_id: string;
  cliente_id: string;
  data_limite: string;
  clientes: { nome: string; email: string | null } | null;
}

/**
 * Chamado uma vez por dia pelo Vercel Cron (ver `vercel.json`). Manda um
 * lembrete por e-mail pra solicitações com prazo hoje/amanhã (ou já
 * vencido, se o cron ficou fora do ar um dia) que ainda não foram
 * lembradas — `lembrete_enviado_em` marca isso pra nunca mandar duas vezes
 * pra mesma solicitação.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const amanhaISO = amanha.toISOString().slice(0, 10);

  const supabase = getSupabaseAdmin();
  const { data: solicitacoes, error } = await supabase
    .from("solicitacoes")
    .select("id, nome, contador_id, cliente_id, data_limite, clientes(nome, email)")
    .in("status", ["pendente", "rejeitado"])
    .not("data_limite", "is", null)
    .lte("data_limite", amanhaISO)
    .is("lembrete_enviado_em", null);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const linhas = (solicitacoes ?? []) as unknown as SolicitacaoComPrazoPendente[];

  let enviados = 0;
  for (const s of linhas) {
    const cliente = s.clientes;
    if (!cliente || !s.data_limite) continue;

    const portalUrl = `${getAppUrl()}/?c=${encodeURIComponent(s.contador_id)}`;

    if (cliente.email) {
      const { subject, html } = templatePrazoProximo({
        clienteNome: cliente.nome,
        solicitacaoNome: s.nome,
        dataLimite: s.data_limite,
        portalUrl,
      });
      await sendEmail({ to: cliente.email, subject, html });
    }

    await sendPushToCliente({
      clienteId: s.cliente_id,
      title: "Prazo se aproximando",
      body: `"${s.nome}" vence em breve`,
      url: portalUrl,
    });

    await supabase
      .from("solicitacoes")
      .update({ lembrete_enviado_em: new Date().toISOString() })
      .eq("id", s.id);

    await logEvento({
      contadorId: s.contador_id,
      clienteId: s.cliente_id,
      solicitacaoId: s.id,
      tipo: "prazo_notificado",
      atorTipo: "sistema",
      metadata: { nome: s.nome },
    });

    enviados++;
  }

  return Response.json({ ok: true, verificados: solicitacoes?.length ?? 0, enviados });
}
