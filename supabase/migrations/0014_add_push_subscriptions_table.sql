-- Inscrições de push notification do navegador, por cliente. Um cliente
-- pode ter várias (um por navegador/dispositivo em que ativou), por isso é
-- tabela própria e não uma coluna em `clientes`. `endpoint` é único porque
-- é a URL do serviço de push do navegador — identifica a inscrição.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_cliente on public.push_subscriptions(cliente_id);

-- Mesmo tratamento das outras tabelas: deny-by-default, só service_role
-- (via API routes) acessa.
alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
