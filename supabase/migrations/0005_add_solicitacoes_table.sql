-- Pedidos de documento que o contador faz para um cliente específico —
-- feature #1 do produto. `status` é enum de verdade (máquina de estado real);
-- `categoria` é texto livre porque a taxonomia de documentos varia por
-- escritório e não deve exigir migration toda vez que alguém cria uma nova.
create type public.solicitacao_status as enum (
  'pendente',
  'enviado',
  'em_analise',
  'aprovado',
  'rejeitado'
);

create table if not exists public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  contador_id text not null references public.contadores(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null,
  descricao text,
  categoria text,
  obrigatoria boolean not null default true,
  data_limite date,
  status public.solicitacao_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_solicitacoes_contador on public.solicitacoes(contador_id);
create index if not exists idx_solicitacoes_cliente on public.solicitacoes(cliente_id);
create index if not exists idx_solicitacoes_status on public.solicitacoes(status);

-- Mesmo tratamento das outras tabelas novas: só service_role acessa.
alter table public.solicitacoes enable row level security;
alter table public.solicitacoes force row level security;
