-- ============================================================================
-- Mercury Habit Tracker — ajustes para o SITE usar o mesmo banco do APP
-- Projeto Supabase: ujgmefsbaehwpvmelqrc
--
-- IMPORTANTE: as tabelas do app (mercury_documents, mercury_annual,
-- mercury_devices, water_entries, daily_stats, mercury_snapshots) JÁ EXISTEM.
-- Esta migration NÃO recria nada — apenas garante que o role `authenticated`
-- (usado pelo site via Supabase Auth) tenha acesso às tabelas principais,
-- se alguma grant/policy estiver faltando.
--
-- COMO APLICAR:
--   1. Abra o SQL Editor do projeto no dashboard do Supabase.
--   2. Cole TODO este arquivo e execute.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Permissões básicas para o role authenticated (o site entra logado).
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at automático (idempotente)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime — a publicação é feita pelo dashboard (Database → Replication).
-- Como alternativa via SQL, descomente as linhas abaixo:
--
-- alter publication supabase_realtime add table public.mercury_documents;
-- alter publication supabase_realtime add table public.mercury_annual;
-- alter publication supabase_realtime add table public.mercury_devices;
-- ---------------------------------------------------------------------------
