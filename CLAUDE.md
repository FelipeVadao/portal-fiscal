# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Portal Fiscal — plataforma multi-contador e multi-cliente para envio de documentos fiscais (IRPF). Qualquer contador cadastrado recebe um link único para seus clientes; os clientes preenchem o formulário e fazem upload dos documentos; o contador acessa o dashboard para visualizar e baixar os arquivos.

## Deployment

**URL de produção:** https://portal-fiscal-wine.vercel.app  
**Hospedagem:** Vercel

**Publicar atualização:**
```
npx vercel --prod
```

## Architecture

Três arquivos HTML independentes — cada um é uma SPA com CSS + JS inline:

- `index.html` — Portal do cliente. Formulário de dados + 7 seções de upload. Envia para Supabase ao clicar em "Enviar".
- `dashboard.html` — Dashboard do contador. Login com senha, visualização de envios agrupados por cliente, download de arquivos, exclusão individual ou em massa.
- `registro.html` — Cadastro de novo contador. Protegido por `CODIGO_CONVITE` hardcoded. Cria registro na tabela `contadores`.
- `server.js` — servidor Express local; não vai para produção (`.vercelignore`).
- `fonts/` — Inter woff2 (400, 600, 700).

## Multi-contador

O parâmetro `?c=ID` na URL determina qual contador está sendo referenciado:

| Quem | URL |
|---|---|
| Cliente envia documentos | `portal-fiscal-wine.vercel.app?c=diego` |
| Contador acessa o dashboard | `portal-fiscal-wine.vercel.app/dashboard.html?c=diego` |
| Novo contador se cadastra | `portal-fiscal-wine.vercel.app/registro.html` |

O portal abre direto sem senha. O dashboard exige a senha definida no cadastro. O link com `?c=` é o próprio controle de acesso do portal.

## Supabase

**Projeto:** `mxebpznsuekwxquqajfk.supabase.co`  
**Credenciais:** `SUPABASE_URL` e `SUPABASE_ANON_KEY` hardcoded no topo do `<script>` de cada arquivo.

### Tabelas

```
contadores   id (text PK), nome, senha, codigo_acesso
envios       id (uuid PK), contador_id, nome, cpf, nascimento, titulo_eleitor,
             govbr, email, telefone, atividade_profissional, endereco,
             banco, agencia, conta, created_at
arquivos     id (uuid PK), envio_id (FK→envios), campo, nome_original,
             storage_path, tamanho, created_at
```

Storage bucket: `documentos` (privado). Paths: `{contador_id}/{envio_id}/{campo_slug}/{filename}`.

### RLS policies necessárias

`anon`: SELECT/INSERT em `contadores`, `envios`, `arquivos`; INSERT/SELECT/DELETE em `storage.objects` (bucket `documentos`); DELETE em `envios`.

## Autenticação (sessionStorage)

- Portal cliente: sem autenticação
- Dashboard: `sessionStorage.getItem('dash_' + CONTADOR_ID) === '1'`
- Código de convite do registro: `CODIGO_CONVITE = '200396'` em `registro.html`

## Design System

CSS custom properties — tema claro (`:root`) e escuro (`[data-theme="dark"]`). Tema aplicado no `<head>` via script inline (evita flash). Toggle persiste em `localStorage` (`pf_theme`).

Tokens principais: `--bg`, `--surface`, `--surface-2`, `--border`, `--primary`, `--text`, `--text-2`, `--text-3`, `--ok`, `--pend`, `--r`, `--r-sm`, `--t`.

## Padrão para campo de upload

```html
<div class="upload-field">
  <label>Nome do Documento</label>
  <div class="upload-wrap">
    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onchange="showFile(this)">
    <div class="upload-placeholder">
      <span class="upload-placeholder-icon">📎</span>
      <span class="upload-placeholder-text"><span>Escolher arquivo</span> — descrição curta</span>
    </div>
    <div class="upload-filename"></div>
  </div>
</div>
```

Para múltiplos arquivos: adicionar `multiple` ao `<input>`.

## Seções de upload (index.html)

1. **Declaração Anterior** — Cópia da última DIRPF (se houver)
2. **Relacionados à Renda** — Instituições financeiras; salário/aposentadoria/pró-labore; aluguéis; programas fiscais; outras rendas; Carnê-Leão
3. **Rendas Variáveis** — Informes de renda variável; notas de corretagem; DARFs
4. **Bens e Direitos** — Comprovação de compra/venda; matrícula + escritura + IPTU; posição acionária; Demonstrativo de Ganhos de Capital
5. **Dívidas e Ônus** — Documentos de dívida > R$ 5.000 (financiamento imobiliário e consórcio não precisam)
6. **Pagamentos e Deduções** — Médico/odontológico; educação; previdência; plano de saúde; doações
7. **Dependentes** — Documentos (CPF/RG/certidão); gastos; informes de rendimentos

## Campos obrigatórios no formulário

Nome completo, CPF, Data de nascimento, E-mail, Telefone/WhatsApp, Endereço completo, Banco, Agência, Conta/Dígito. Validados em `handleSubmit()` com destaque visual (borda vermelha + scroll até o primeiro campo vazio).

## Status atual

Última atualização: 31/05/2026
