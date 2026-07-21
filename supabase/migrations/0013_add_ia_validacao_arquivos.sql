-- Colunas para o resultado da validação automática (IA) de que o arquivo
-- enviado bate com o tipo de documento pedido na solicitação. Nullable:
-- fica null para arquivos sem solicitação vinculada, arquivos enviados
-- antes desta migration, ou quando a validação ainda não rodou/falhou.
alter table public.arquivos
  add column if not exists ia_validacao text,
  add column if not exists ia_observacao text;
