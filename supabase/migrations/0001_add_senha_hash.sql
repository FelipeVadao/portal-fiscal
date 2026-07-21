-- Adiciona a coluna de senha hasheada (bcrypt) em contadores.
-- Aditiva e reversível: a coluna "senha" (texto puro) é mantida por enquanto
-- como rede de segurança durante a transição — será removida numa migration
-- futura, só depois de confirmado que nada mais a lê.
create extension if not exists pgcrypto;

alter table public.contadores
  add column if not exists senha_hash text;
