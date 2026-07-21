-- Fecha a exposição de PII encontrada em produção: hoje qualquer policy de
-- RLS que permita `anon` fazer SELECT em `contadores` também expõe a coluna
-- `senha` inteira via API REST do Supabase (RLS é por linha, não por
-- coluna), já que não há escopo por contador_id nas policies atuais.
--
-- IMPORTANTE: `registro.html` AINDA não foi migrado nesta leva (isso é uma
-- sub-fase futura) e continua fazendo `insert()` direto em `contadores` com
-- a anon key. Por isso esta migration remove toda leitura pública (SELECT)
-- mas mantém uma policy de INSERT para `anon`, idêntica em permissividade
-- à que existe hoje — sem isso, o cadastro de novos contadores quebraria
-- imediatamente. Essa policy de INSERT será removida quando registro.html
-- for repontado para /api/contadores (ver supabase/migrations/README.md).
--
-- Login, leitura de dashboard e qualquer outra consulta a `contadores`
-- passam a ser feitas exclusivamente via service_role dentro de API routes
-- server-side do Next.js (/api/auth/contador/login).
--
-- Descobre e remove TODAS as policies existentes na tabela dinamicamente —
-- não depende de conhecer os nomes reais das policies criadas originalmente.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'contadores'
  loop
    execute format('drop policy if exists %I on public.contadores', pol.policyname);
  end loop;
end $$;

alter table public.contadores enable row level security;
alter table public.contadores force row level security;

create policy "anon_insert_contadores_temp_ate_migrar_registro"
  on public.contadores
  for insert
  to anon
  with check (true);

-- Nenhuma policy de SELECT/UPDATE/DELETE é recriada para anon/authenticated
-- -> essas operações ficam deny-by-default. service_role sempre ignora RLS
-- no Supabase, então login/dashboard continuam funcionando via API routes.

-- Verificação pós-deploy (rode manualmente, não faz parte da migration):
--   select policyname, cmd, roles from pg_policies
--   where schemaname='public' and tablename='contadores';
--   -- deve retornar só a policy de insert acima; select/update/delete = 0 linhas.
--   -- confirme também que um `select * from contadores` autenticado como
--   -- anon (REST API com a anon key) retorna vazio.
