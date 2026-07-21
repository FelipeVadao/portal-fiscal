/**
 * Tipos refletindo o schema atual do Supabase.
 */

export interface Contador {
  id: string;
  nome: string;
  senha_hash: string | null;
}

export interface Envio {
  id: string;
  contador_id: string;
  cliente_id: string | null;
  nome: string | null;
  cpf: string | null;
  nascimento: string | null;
  titulo_eleitor: string | null;
  govbr: string | null;
  email: string | null;
  telefone: string | null;
  atividade_profissional: string | null;
  endereco: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  created_at: string;
}

/** Resultado da verificação automática (IA) de que o arquivo bate com o tipo de documento pedido — null quando não se aplica (sem solicitação vinculada, tipo não suportado, ou ainda não processado). */
export type IaValidacaoStatus = "compativel" | "suspeito" | "nao_verificado" | "erro";

export interface Arquivo {
  id: string;
  envio_id: string;
  solicitacao_id: string | null;
  campo: string;
  nome_original: string;
  storage_path: string;
  tamanho: number;
  created_at: string;
  ia_validacao: IaValidacaoStatus | null;
  ia_observacao: string | null;
}

export interface EnvioComArquivos extends Envio {
  arquivos: Arquivo[];
}

/** Cliente "ad hoc", inferido de envios (cpf, com fallback para nome) — usado na listagem/agrupamento de envios do dashboard, independente da tabela `clientes` abaixo. */
export interface ClienteAgrupado {
  chave: string;
  nome: string;
  cpf: string;
  envios: EnvioComArquivos[];
  totalArquivos: number;
  ultimoEnvio: string;
}

/** Cliente cadastrado formalmente pelo contador (tabela `clientes`) — entidade própria, com login via CPF + código de acesso, dona de solicitações e (opcionalmente) envios/arquivos. */
export interface Cliente {
  id: string;
  contador_id: string;
  nome: string;
  cpf: string;
  codigo_acesso_hash: string | null;
  email: string | null;
  telefone: string | null;
  created_at: string;
  updated_at: string;
}

export type SolicitacaoStatus = "pendente" | "enviado" | "em_analise" | "aprovado" | "rejeitado";

export interface Solicitacao {
  id: string;
  contador_id: string;
  cliente_id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  obrigatoria: boolean;
  data_limite: string | null;
  status: SolicitacaoStatus;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoComArquivos extends Solicitacao {
  arquivos: Arquivo[];
}

/** Solicitação com o nome do cliente embutido, sem os arquivos (a listagem global não precisa deles) — usada na listagem global (sem `clienteId`) de GET /api/solicitacoes, que alimenta o painel de prazos. `solicitacoes.cliente_id` é `ON DELETE CASCADE`, então diferente de eventos, esse join nunca vem null. */
export interface SolicitacaoComCliente extends Solicitacao {
  clientes: { nome: string };
}

export type EventoAtorTipo = "contador" | "cliente" | "sistema";

export interface Evento {
  id: string;
  contador_id: string;
  cliente_id: string | null;
  solicitacao_id: string | null;
  envio_id: string | null;
  arquivo_id: string | null;
  tipo: string;
  ator_tipo: EventoAtorTipo;
  ator_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** Evento com o nome atual de cliente/solicitação anexado via join — null quando a entidade já foi removida (o FK correspondente é ON DELETE SET NULL). Usado pela timeline do dashboard. */
export interface EventoComRelacoes extends Evento {
  clientes: { nome: string } | null;
  solicitacoes: { nome: string } | null;
}

export type ComentarioAutorTipo = "contador" | "cliente";

export interface Comentario {
  id: string;
  contador_id: string;
  solicitacao_id: string;
  autor_tipo: ComentarioAutorTipo;
  autor_id: string;
  texto: string;
  created_at: string;
}

/** Resumo de progresso de um cliente nas solicitações — base da feature #2 (painel de progresso). */
export interface ClienteProgresso {
  total: number;
  pendentes: number;
  enviados: number;
  emAnalise: number;
  aprovados: number;
  rejeitados: number;
  percentualConcluido: number;
}

/** Forma retornada por GET /api/clientes — cada cliente já vem com o progresso agregado, pra alimentar a barra inline em ClientesPanel sem uma requisição por cliente. */
export type ClienteListadoComProgresso = Pick<
  Cliente,
  "id" | "nome" | "cpf" | "email" | "telefone" | "created_at"
> & {
  progresso: ClienteProgresso;
};

/** Resultado de cliente em GET /api/busca — subconjunto enxuto de Cliente, sem progresso (não é relevante pra busca). */
export type ClienteResultadoBusca = Pick<Cliente, "id" | "nome" | "cpf" | "email" | "telefone">;

/** Resultado de arquivo em GET /api/busca, com o nome do cliente (via envios) e da solicitação (se vinculado) pro card de resultado fazer sentido sozinho. */
export interface ArquivoResultadoBusca {
  id: string;
  nome_original: string;
  created_at: string;
  envios: { clientes: { nome: string } | null } | null;
  solicitacoes: { nome: string } | null;
}
