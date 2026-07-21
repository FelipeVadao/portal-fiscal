-- Marca quando o lembrete de prazo (e-mail) já foi enviado pra uma
-- solicitação, pro cron de notificações não mandar duas vezes. Nullable:
-- null = ainda não enviado. Não usa a tabela `eventos` pra isso porque a
-- query do cron ("quem ainda não foi lembrado") fica muito mais simples e
-- barata como uma coluna direta do que como anti-join.
alter table public.solicitacoes
  add column if not exists lembrete_enviado_em timestamptz;
