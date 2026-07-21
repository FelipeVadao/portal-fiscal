import type { ClienteAgrupado, EnvioComArquivos } from "@/lib/types/db";

/**
 * Agrupa envios por cliente. Prioriza `cliente_id` (FK real, existe para
 * qualquer envio criado pelo novo fluxo de solicitações) e cai para
 * CPF/nome em texto quando não houver — mantém os envios antigos (gerados
 * pelo formulário anônimo original) agrupados corretamente também.
 */
export function groupEnviosByCliente(envios: EnvioComArquivos[]): ClienteAgrupado[] {
  const map = new Map<string, ClienteAgrupado>();

  for (const envio of envios) {
    const nome = envio.nome?.trim() || "(sem nome)";
    const cpf = envio.cpf?.trim() ?? "";
    const chave = envio.cliente_id ? `cliente:${envio.cliente_id}` : cpf ? `cpf:${cpf}` : `nome:${nome}`;

    let cliente = map.get(chave);
    if (!cliente) {
      cliente = {
        chave,
        nome,
        cpf,
        envios: [],
        totalArquivos: 0,
        ultimoEnvio: envio.created_at,
      };
      map.set(chave, cliente);
    }
    cliente.envios.push(envio);
    cliente.totalArquivos += envio.arquivos.length;
    if (envio.created_at > cliente.ultimoEnvio) {
      cliente.ultimoEnvio = envio.created_at;
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.ultimoEnvio < b.ultimoEnvio ? 1 : -1));
}
