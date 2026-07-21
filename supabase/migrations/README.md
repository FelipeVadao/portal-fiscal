# Migrations — Portal Fiscal

**Importante:** `.env.local` e `.env.production.local` apontam para o **mesmo projeto Supabase** (`mxebpznsuekwxquqajfk`) — não existem ambientes de staging/produção separados neste projeto. Os dois arquivos existem só por conveniência (`.env.local` pro `npm run dev`, `.env.production.local` pra scripts/deploy), mas qualquer migration só precisa ser aplicada **uma vez**. Se um dia um projeto de staging de verdade for criado, reintroduzir a distinção aqui.

## Como aplicar

`scripts/run-migration.mjs` aplica arquivos `.sql` direto via `pg`, cada um em sua própria transação. Precisa de `DATABASE_URL` (connection string do Postgres — não confundir com `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, que só dão acesso via REST/Storage e não executam DDL).

Pegue a connection string em **Connect** (botão no topo do dashboard do projeto, não em Settings) → aba **Session pooler** ou **Transaction pooler** (a "Direct connection" costuma ser IPv6-only e falha em redes sem suporte a IPv6). Formato:

```
postgresql://postgres.<project-ref>:<senha-do-banco>@aws-<n>-<regiao>.pooler.supabase.com:6543/postgres
```

**Cuidado com a senha:** se ela tiver caracteres especiais (`@`, `#`, etc.), precisa ser URL-encoded na connection string, senão a lib `pg` interpreta errado o `user:senha@host`.

Uso:
```
DATABASE_URL=... node scripts/run-migration.mjs supabase/migrations/000X_arquivo.sql [outro.sql ...]
```

## Migrations aplicadas (ordem)

1. `0001_add_senha_hash.sql` — adiciona a coluna `senha_hash`.
2. `0002_backfill_senha_hash.sql` — gera o bcrypt hash de toda senha existente (via `pgcrypto`, sem script lendo texto puro).
3. `0003_rls_lockdown_contadores.sql` — fecha o acesso público de leitura a `contadores` (fechava uma exposição real de PII/senha em produção), mantendo só uma policy de `INSERT` para `anon` (hoje sem uso — ver "não incluído ainda").
4. `0004_add_clientes_table.sql` — tabela `clientes`, RLS trancada (só `service_role`, via `/api/clientes`).
5. `0005_add_solicitacoes_table.sql` — tabela `solicitacoes` (pedidos de documento), enum `solicitacao_status`, RLS trancada.
6. `0006_add_eventos_table.sql` — log de auditoria genérico, RLS trancada. Sem UI ainda, só grava.
7. `0007_link_envios_arquivos.sql` — `envios.cliente_id` e `arquivos.solicitacao_id`, ambos nullable/aditivos.
8. `0008_fn_registrar_arquivo_enviado.sql` — function `security definer` que grava o arquivo, atualiza o status da solicitação e loga o evento numa transação só. Só `service_role` pode executar.
9. `0009_contadores_senha_nullable.sql` — `registro.html` migrou pra `/api/contadores` (só grava `senha_hash`); a coluna `senha` passa a aceitar `null`.
10. `0010_rls_lockdown_final.sql` — remove as últimas policies de `anon` em `envios`, `arquivos` e `storage.objects` (bucket `documentos`). Essas policies só existiam pro `index.html`/`dashboard.html` legados, já totalmente aposentados.
11. `0011_add_comentarios_table.sql` — tabela `comentarios` (thread de conversa por solicitação, entre contador e cliente), RLS trancada (`deny-by-default`, só `service_role`).
12. `0012_add_lembrete_enviado_solicitacoes.sql` — coluna `lembrete_enviado_em` em `solicitacoes` (nullable), marca quando o e-mail de prazo próximo já foi enviado pra não mandar duas vezes. Usada pelo cron `/api/cron/prazos`.
13. `0013_add_ia_validacao_arquivos.sql` — colunas `ia_validacao`/`ia_observacao` em `arquivos` (nullable), guardam o resultado da verificação automática (Gemini) de que o arquivo bate com o tipo de documento pedido na solicitação. Usadas por `lib/ai/validarDocumento.ts`.
14. `0014_add_push_subscriptions_table.sql` — tabela `push_subscriptions` (inscrições de Web Push por cliente, um cliente pode ter várias — uma por navegador/dispositivo), RLS trancada (deny-by-default, só `service_role`).

**Status: 0001→0014 todas aplicadas (2026-07-20).** Testadas de ponta a ponta: login de contador, CRUD de clientes, criação de solicitação + upload real via signed URL + mudança automática de status + evento registrado, cadastro de contador novo com login em seguida, e — depois do lockdown final — o mesmo fluxo completo repetido com sucesso (upload continua funcionando) mais uma verificação explícita de que `anon` não lê mais `envios`/`arquivos`/`storage.objects` (testado com dados reais existentes, não só tabela vazia). Depois, `0011`: troca de comentários entre uma sessão de contador e uma de cliente reais (cada um no seu próprio cookie), confirmando que ambos leem a mesma thread, que o autor é sempre inferido da sessão (nunca aceito do client), e que uma requisição sem sessão nenhuma recebe 401. Dados de teste sempre limpos depois de cada verificação.

## Verificações feitas em cada leva

- Hash de senha: `bcryptjs.compare(senhaConhecida, hash)` retorna `true`; login pela API funciona; `curl` direto na REST API do Supabase (`/rest/v1/contadores`) com a anon key retorna vazio/401.
- Clientes: criar via `/api/clientes`, confirmar `curl .../rest/v1/clientes` com anon key retorna vazio/401.
- Solicitações: criar solicitação, subir arquivo via `/api/arquivos/signed-upload-url` + `/api/arquivos`, confirmar status → `enviado` e linha em `eventos`.
- Registro: cadastrar contador via `/api/contadores`, confirmar login com a senha escolhida, confirmar convite errado/ID duplicado são rejeitados.
- Lockdown final: repetir o fluxo de solicitação+upload depois da migration (confirma que `uploadToSignedUrl` não depende de RLS permissivo — é o token de curta duração que autoriza, não a policy); depois, com um envio/arquivo real ainda no banco, confirmar que a mesma consulta via anon key retorna `[]` (prova que o RLS está de fato bloqueando, não que a tabela está vazia).
- Comentários: contador comenta, cliente responde (sessões separadas), ambos leem a thread completa via `GET`; requisição sem cookie nenhum recebe 401; contador de outro escritório não consegue comentar numa solicitação que não é dele (checagem de posse via `solicitacao.contador_id`/`cliente_id`, não via id vindo do client).
- Cron de prazos: chamada sem header/com header errado recebe 401; criar uma solicitação com prazo hoje e chamar o cron marca `lembrete_enviado_em` e loga `prazo_notificado`; chamar de novo não reprocessa (retorna `verificados: 0`); falha do envio de e-mail (ex.: `RESEND_API_KEY` ausente) não derruba a criação da solicitação nem a rota de cron.
- Verificação por IA: upload de um arquivo deliberadamente errado pra uma solicitação grava `ia_validacao = 'suspeito'` com `ia_observacao` coerente e loga `arquivo_suspeito_ia`; upload de um arquivo certo grava `'compativel'`; ambos rodam depois da resposta do upload (via `after()`, confirmado que não atrasa o `POST /api/arquivos`); erro/timeout da API do Gemini vira `'erro'` sem derrubar o upload.
- Push notifications: ativar pelo toggle do portal grava uma linha real em `push_subscriptions` (endpoint do FCM); desativar remove a linha; criar uma solicitação nova dispara `sendPushToCliente()`, o `web-push` recebe 201 do FCM, e a notificação chega de fato na tela (confirmado num Chrome aberto normalmente — Chrome automatizado via CDP/Playwright não mantém canal de push ativo, então não serve pra esse teste específico).

## Não incluído ainda (fases futuras)

A policy de `INSERT` para `anon` em `contadores` (da migration 0003) não é mais usada por nenhum código — `registro.html` agora passa por `/api/contadores` com `service_role`. Candidata a remover numa limpeza futura.

`contadores.senha` e `contadores.codigo_acesso` **não são removidas** ainda — ficam como rede de segurança por pelo menos um ciclo de release.

Nenhuma tabela/bucket do projeto tem mais policy de `anon` com acesso de leitura/escrita real (só a `INSERT` morta em `contadores`, acima). Todo acesso passa por API routes (`service_role`) ou pelo mecanismo de signed URL (upload/download).
