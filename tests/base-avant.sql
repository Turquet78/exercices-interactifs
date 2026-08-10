-- ============================================================================
--  Les tables TELLES QU'ELLES SONT AUJOURD'HUI, avant la migration 001.
-- ============================================================================
--  Le banc part de cet état — colonne « pin » en clair, aucune RLS — pour que
--  la migration soit éprouvée sur le cas réel et non sur une base déjà propre.
--  Les colonnes reprennent celles qu'utilisent les trois fichiers HTML.
-- ============================================================================

create table if not exists public.eleves_2nde (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  pin text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.resultats_2nde (
  id bigserial primary key,
  eleve_id uuid not null references public.eleves_2nde(id) on delete cascade,
  score int, total int, percent numeric, duration_sec int,
  details jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.parametres_2nde (
  id int primary key,
  valeurs jsonb not null default '{}'::jsonb
);

create table if not exists public.eleves_1ere (like public.eleves_2nde including all);
create table if not exists public.parametres_1ere (like public.parametres_2nde including all);
create table if not exists public.resultats_1ere (
  id bigserial primary key,
  eleve_id uuid not null references public.eleves_1ere(id) on delete cascade,
  score int, total int, percent numeric, duration_sec int,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.eleves (like public.eleves_2nde including all);
create table if not exists public.parametres (like public.parametres_2nde including all);
create table if not exists public.resultats (
  id bigserial primary key,
  eleve_id uuid not null references public.eleves(id) on delete cascade,
  score int, total int, percent numeric, duration_sec int,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Les droits que Supabase accorde par défaut : sans RLS, ils suffisent à tout
-- lire et à tout écrire depuis le navigateur. C'est l'état actuel.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
