-- Comentários trocados entre contador e cliente sobre uma solicitação
-- específica (ex.: "esse comprovante está ilegível, reenvie"). `contador_id`
-- é duplicado aqui (também alcançável via solicitacao_id -> solicitacoes)
-- pelo mesmo motivo de `eventos`: evita join só pra filtrar por dono nas
-- API routes. `autor_id` é `text` mesmo pra cliente (uuid) — mesmo padrão
-- de `eventos.ator_id`, guarda os dois tipos como texto.
create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  contador_id text not null references public.contadores(id) on delete cascade,
  solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
  autor_tipo text not null check (autor_tipo in ('contador', 'cliente')),
  autor_id text not null,
  texto text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comentarios_solicitacao on public.comentarios(solicitacao_id, created_at);
create index if not exists idx_comentarios_contador on public.comentarios(contador_id);

-- Mesmo tratamento das outras tabelas: deny-by-default, só service_role
-- (via API routes) acessa.
alter table public.comentarios enable row level security;
alter table public.comentarios force row level security;
