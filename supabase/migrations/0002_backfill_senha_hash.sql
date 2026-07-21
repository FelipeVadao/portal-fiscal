-- Gera o hash bcrypt de toda senha em texto puro que ainda não tenha um
-- senha_hash. Idempotente (safe re-run: só afeta linhas com senha_hash null).
--
-- pgcrypto's crypt(text, gen_salt('bf', 10)) produz hashes bcrypt padrão
-- ($2a$-prefixed), compatíveis com bcryptjs.compare() no lado da aplicação.
-- Não é necessário nenhum script Node lendo senha em texto puro para isso.
update public.contadores
set senha_hash = crypt(senha, gen_salt('bf', 10))
where senha_hash is null
  and senha is not null
  and trim(senha) <> '';

-- Checagem de cobertura (rode manualmente após aplicar, não faz parte da
-- migration): deve retornar 0 linhas.
--   select id from public.contadores where senha is not null and senha_hash is null;
