-- Entidade formal de cliente. Até aqui, "cliente" era só inferido ad hoc de
-- envios.cpf/nome (ver lib/envios/group.ts) — agora existe uma tabela de
-- verdade, necessária para o contador poder cadastrar um cliente e emitir
-- um código de acesso ANTES de qualquer envio existir (pré-requisito da
-- feature de Solicitação de Documentos, que vem na próxima sub-fase).
--
-- `envios`/`arquivos` ainda NÃO ganham FK para `clientes` nesta migration —
-- isso é intencional, chega junto da sub-fase de Solicitações (que também
-- traz o backfill ligando envios existentes aos clientes correspondentes).
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  contador_id text not null references public.contadores(id) on delete cascade,
  nome text not null,
  cpf text not null,
  codigo_acesso_hash text,
  email text,
  telefone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clientes_contador_cpf_unique unique (contador_id, cpf)
);

create index if not exists idx_clientes_contador on public.clientes(contador_id);

-- Mesmo tratamento de contadores: só service_role acessa (API routes).
-- Nenhuma policy de anon/authenticated é criada -> deny-by-default.
alter table public.clientes enable row level security;
alter table public.clientes force row level security;
