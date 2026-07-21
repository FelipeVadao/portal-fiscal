-- Log de auditoria genérico. Sem UI nesta sub-fase (isso é a feature #4,
-- Histórico, futura) — mas toda mutação relevante que esta sub-fase já
-- escreve (solicitação criada, status alterado, arquivo enviado) grava um
-- evento aqui, porque o custo é ~zero e sem isso a atividade de agora seria
-- irrecuperável quando a timeline for construída depois.
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  contador_id text not null references public.contadores(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  solicitacao_id uuid references public.solicitacoes(id) on delete set null,
  envio_id uuid references public.envios(id) on delete set null,
  arquivo_id uuid references public.arquivos(id) on delete set null,
  tipo text not null,
  ator_tipo text not null check (ator_tipo in ('contador', 'cliente', 'sistema')),
  ator_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_eventos_contador on public.eventos(contador_id, created_at desc);
create index if not exists idx_eventos_cliente on public.eventos(cliente_id, created_at desc);

alter table public.eventos enable row level security;
alter table public.eventos force row level security;
