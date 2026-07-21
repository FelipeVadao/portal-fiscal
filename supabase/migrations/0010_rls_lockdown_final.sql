-- Lockdown final: fecha o último acesso direto de `anon` a dados de
-- clientes (envios/arquivos) e ao bucket de documentos. Esses policies só
-- existiam para o `index.html`/`dashboard.html` legados, que já foram
-- totalmente aposentados — todo acesso hoje passa por API routes com
-- service_role, exceto o upload, que usa createSignedUploadUrl (gerado
-- server-side com service_role) + uploadToSignedUrl no navegador. Segundo a
-- documentação do Supabase, uploadToSignedUrl não depende de RLS
-- permissivo (a autorização é o token de curta duração, não a policy) —
-- verificado empiricamente após esta migration (ver supabase/migrations/README.md).
drop policy if exists "anon select envios" on public.envios;
drop policy if exists "anon insert envios" on public.envios;
drop policy if exists "anon delete envios" on public.envios;

drop policy if exists "anon select arquivos" on public.arquivos;
drop policy if exists "anon insert arquivos" on public.arquivos;

drop policy if exists "anon download documentos" on storage.objects;
drop policy if exists "anon upload documentos" on storage.objects;
drop policy if exists "anon delete documentos" on storage.objects;

alter table public.envios enable row level security;
alter table public.envios force row level security;
alter table public.arquivos enable row level security;
alter table public.arquivos force row level security;

-- Verificação pós-deploy (rode manualmente):
--   select tablename, policyname from pg_policies
--   where (schemaname='public' and tablename in ('envios','arquivos'))
--      or (schemaname='storage' and tablename='objects' and policyname like '%documentos%');
--   -- deve retornar 0 linhas.
