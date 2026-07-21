-- Liga envios/arquivos às novas entidades. Aditivo e nullable dos dois lados
-- de propósito: preserva o fluxo de upload genérico (arquivo sem
-- solicitação vinculada) e não quebra nenhum envio antigo que não tenha
-- cliente_id. Confirmado via introspection do PostgREST que nenhuma outra
-- coluna de envios/arquivos é NOT NULL além de id/contador_id — não é
-- necessário afrouxar nenhuma constraint existente para o novo fluxo
-- (contador_id + cliente_id bastam pra criar um envio "vazio" que os
-- uploads subsequentes vão preencher).
alter table public.envios
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
create index if not exists idx_envios_cliente on public.envios(cliente_id);

alter table public.arquivos
  add column if not exists solicitacao_id uuid references public.solicitacoes(id) on delete set null;
create index if not exists idx_arquivos_solicitacao on public.arquivos(solicitacao_id);
