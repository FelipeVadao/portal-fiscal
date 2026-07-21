-- RPC que registra um arquivo enviado, atualiza o status da solicitação
-- correspondente (se houver) e loga o evento — tudo numa única transação
-- implícita, sem transaction handling manual no lado da aplicação.
create or replace function public.registrar_arquivo_enviado(
  p_envio_id uuid,
  p_solicitacao_id uuid,
  p_campo text,
  p_nome_original text,
  p_storage_path text,
  p_tamanho bigint,
  p_ator_tipo text,
  p_ator_id text
) returns public.arquivos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_arquivo public.arquivos;
begin
  insert into public.arquivos (envio_id, solicitacao_id, campo, nome_original, storage_path, tamanho)
  values (p_envio_id, p_solicitacao_id, p_campo, p_nome_original, p_storage_path, p_tamanho)
  returning * into v_arquivo;

  if p_solicitacao_id is not null then
    update public.solicitacoes
    set status = 'enviado', updated_at = now()
    where id = p_solicitacao_id and status = 'pendente';
  end if;

  insert into public.eventos (contador_id, cliente_id, solicitacao_id, envio_id, arquivo_id, tipo, ator_tipo, ator_id, metadata)
  select e.contador_id, e.cliente_id, p_solicitacao_id, p_envio_id, v_arquivo.id,
         'arquivo_enviado', p_ator_tipo, p_ator_id, jsonb_build_object('nome_original', p_nome_original)
  from public.envios e
  where e.id = p_envio_id;

  return v_arquivo;
end;
$$;

-- security definer roda com os privilégios de quem criou a function, então
-- por padrão fica executável por PUBLIC — revoga isso e libera só pra
-- service_role (que é o role usado por todas as API routes).
revoke all on function public.registrar_arquivo_enviado from public, anon, authenticated;
grant execute on function public.registrar_arquivo_enviado to service_role;
