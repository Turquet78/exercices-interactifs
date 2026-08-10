-- ============================================================================
--  000 — Socle de contrôle : NE PAS EXÉCUTER SUR LE PROJET SUPABASE
-- ============================================================================
--  Supabase fournit lui-même le schéma auth, les rôles anon / authenticated /
--  service_role et la fonction auth.uid(). Ce fichier les recrée à l'identique
--  sur un PostgreSQL nu, uniquement pour que `npm run test:base` puisse jouer
--  la vraie migration 001 et éprouver les politiques hors ligne.
--
--  Sur le projet Supabase, tout ceci existe déjà : exécuter ce fichier n'y
--  aurait aucun sens. La migration 001, elle, est faite pour y être collée.
-- ============================================================================

create schema if not exists auth;

-- Supabase l'expose ainsi : l'identifiant du compte connecté est lu dans les
-- revendications du jeton, que PostgREST pose en variable de session.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;
