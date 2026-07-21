-- registro.html deixa de escrever senha em texto puro (migra pra
-- /api/contadores, que só grava senha_hash). A coluna senha permanece
-- (rede de segurança pra contas antigas), mas passa a aceitar null pra
-- contas novas — nenhum código volta a escrever texto puro nela.
alter table public.contadores alter column senha drop not null;
