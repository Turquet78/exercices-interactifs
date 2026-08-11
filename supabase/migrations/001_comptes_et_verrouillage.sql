-- ============================================================================
--  001 — Comptes réels et verrouillage des tables
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, EN UNE SEULE FOIS.
--
--  Ce que fait ce fichier :
--    1. il AFFICHE d'abord l'état actuel (RLS activée ? politiques déjà là ?)
--       sans rien modifier — lisez ces lignes avant de regarder le reste ;
--    2. il rattache chaque élève à un vrai compte Supabase (colonne user_id) ;
--    3. il supprime la colonne « pin », qui partait en clair dans le navigateur ;
--    4. il active la RLS sur les neuf tables et pose les politiques.
--
--  Il est IDEMPOTENT : le relancer ne casse rien et ne duplique rien.
--  Il est RÉVERSIBLE : voir 001_annulation.sql.
--
--  Il ne SUPPRIME aucune politique qu'il n'a pas lui-même créée : toutes les
--  siennes portent le préfixe « p_ ». Si vous aviez déjà des politiques à vous,
--  elles restent en place — l'étape 1 vous les affiche pour que vous puissiez
--  décider de leur sort en connaissance de cause.
--
--  ATTENTION — les résultats ne sont PAS perdus : eleves_*.id ne change pas.
--  Seuls les CODES sont réinitialisés (décision du 10 août 2026). Aucun élève
--  ne peut se connecter tant que vous ne lui avez pas donné son nouveau code.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ÉTAPE 1 — état actuel, avant toute modification
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  n int;
  actif bool;
  pol text;
begin
  raise notice '';
  raise notice '=== ÉTAT AVANT MIGRATION ===';
  foreach t in array array[
    'eleves','eleves_1ere','eleves_2nde',
    'resultats','resultats_1ere','resultats_2nde',
    'parametres','parametres_1ere','parametres_2nde'
  ] loop
    select relrowsecurity into actif
      from pg_class where relname = t and relnamespace = 'public'::regnamespace;
    if actif is null then
      raise notice '  % : TABLE ABSENTE', rpad(t, 18);
      continue;
    end if;
    select count(*) into n from pg_policies where schemaname = 'public' and tablename = t;
    select coalesce(string_agg(policyname, ', '), '—') into pol
      from pg_policies where schemaname = 'public' and tablename = t;
    raise notice '  % RLS=%  politiques=% (%)', rpad(t, 18), rpad(actif::text, 5), n, pol;
  end loop;
  raise notice '=== fin de l''état ===';
  raise notice '';
end $$;

-- ---------------------------------------------------------------------------
-- ÉTAPE 2 — qui est professeur
-- ---------------------------------------------------------------------------
-- Un compte Supabase ordinaire, plus le mot de passe en clair dans la page.
-- Vous inscrirez votre propre compte ici (voir supabase/LISEZMOI.md).
create table if not exists public.professeurs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ajoute_le timestamptz not null default now()
);
alter table public.professeurs enable row level security;

-- est_prof() est SECURITY DEFINER : elle lit professeurs SANS repasser par la
-- RLS. Sans cela, une politique qui interroge professeurs déclencherait la
-- politique de professeurs, qui l'interrogerait à nouveau — récursion infinie,
-- et PostgreSQL refuse la requête entière.
create or replace function public.est_prof()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select exists(select 1 from public.professeurs where user_id = auth.uid()) $$;

revoke all on function public.est_prof() from public;
grant execute on function public.est_prof() to anon, authenticated;

drop policy if exists p_professeurs_lecture on public.professeurs;
create policy p_professeurs_lecture on public.professeurs
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ÉTAPE 3 — rattachement des élèves à un compte, et fin de la colonne « pin »
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['eleves','eleves_1ere','eleves_2nde'] loop
    if to_regclass('public.' || t) is null then
      raise notice 'table % absente, ignorée', t;
      continue;
    end if;

    execute format(
      'alter table public.%I add column if not exists user_id uuid unique references auth.users(id) on delete cascade', t);

    -- « cle » est l'identifiant du compte Supabase de l'élève : son adresse
    -- technique en est dérivée. Une colonne à part, et non « id », parce que
    -- LES TROIS NIVEAUX N'ONT PAS LE MÊME TYPE D'IDENTIFIANT — uuid en
    -- Terminale et en Seconde, bigint en Première. Dériver l'adresse de « id »
    -- marchait sur deux niveaux et cassait la création de compte sur le
    -- troisième. Avec « cle », un seul mécanisme couvre les trois.
    execute format('alter table public.%I add column if not exists cle text', t);
    execute format('create unique index if not exists %I on public.%I (cle)', t || '_cle_idx', t);

    -- L'application n'écrit plus « id » elle-même : elle laisse la base le
    -- produire, ce qui la rend indifférente au type. Encore faut-il qu'une
    -- valeur par défaut existe. Les colonnes bigint identity en ont une par
    -- construction ; on s'assure ici que les colonnes uuid en ont une aussi,
    -- plutôt que de le supposer.
    if (select data_type from information_schema.columns
        where table_schema = 'public' and table_name = t and column_name = 'id') = 'uuid'
       and (select column_default from information_schema.columns
            where table_schema = 'public' and table_name = t and column_name = 'id') is null
    then
      execute format('alter table public.%I alter column id set default gen_random_uuid()', t);
      raise notice '  %.id reçoit une valeur par défaut (gen_random_uuid)', t;
    end if;

    -- La colonne pin partait en clair vers chaque navigateur : select(''*'')
    -- sur cette table la rapportait, et l''onglet Réseau l''affichait. Les
    -- codes vivent désormais dans auth.users, hachés par Supabase.
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = t and column_name = 'pin') then
      execute format('alter table public.%I drop column pin', t);
      raise notice '  %.pin supprimée (les codes sont maintenant dans auth.users)', t;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- ÉTAPE 4 — politiques
-- ---------------------------------------------------------------------------
do $$
declare
  suffixe text;
  el text; re text; pa text;
begin
  foreach suffixe in array array['', '_1ere', '_2nde'] loop
    el := 'eleves' || suffixe;
    re := 'resultats' || suffixe;
    pa := 'parametres' || suffixe;

    ------------------------------------------------------------------ élèves
    if to_regclass('public.' || el) is not null then
      execute format('alter table public.%I enable row level security', el);

      -- La liste des prénoms doit rester lisible sans être connecté : c'est
      -- l'écran de connexion qui la demande, avant toute authentification.
      -- Elle ne contient plus rien de secret depuis que « pin » a disparu.
      execute format('drop policy if exists p_%s_liste on public.%I', el, el);
      execute format('create policy p_%s_liste on public.%I for select to anon, authenticated using (true)', el, el);

      -- Un élève crée son propre compte, et lui seul : la ligne doit porter
      -- l'identifiant du compte Supabase qui l'insère.
      execute format('drop policy if exists p_%s_creation on public.%I', el, el);
      execute format('create policy p_%s_creation on public.%I for insert to authenticated with check (user_id = auth.uid())', el, el);

      execute format('drop policy if exists p_%s_prof_modif on public.%I', el, el);
      execute format('create policy p_%s_prof_modif on public.%I for update to authenticated using (public.est_prof()) with check (public.est_prof())', el, el);

      execute format('drop policy if exists p_%s_prof_suppr on public.%I', el, el);
      execute format('create policy p_%s_prof_suppr on public.%I for delete to authenticated using (public.est_prof())', el, el);
    end if;

    --------------------------------------------------------------- résultats
    if to_regclass('public.' || re) is not null then
      execute format('alter table public.%I enable row level security', re);

      -- Un élève n'écrit une note que sous son propre nom. Sans ce contrôle,
      -- n'importe qui pouvait poser une note sur le compte de n'importe qui.
      execute format('drop policy if exists p_%s_ecriture on public.%I', re, re);
      execute format($f$create policy p_%s_ecriture on public.%I for insert to authenticated
        with check (exists (select 1 from public.%I e where e.id = eleve_id and e.user_id = auth.uid()))$f$, re, re, el);

      -- Chacun voit ses notes ; le professeur les voit toutes.
      execute format('drop policy if exists p_%s_lecture on public.%I', re, re);
      execute format($f$create policy p_%s_lecture on public.%I for select to authenticated
        using (public.est_prof() or exists (select 1 from public.%I e where e.id = eleve_id and e.user_id = auth.uid()))$f$, re, re, el);

      execute format('drop policy if exists p_%s_prof_suppr on public.%I', re, re);
      execute format('create policy p_%s_prof_suppr on public.%I for delete to authenticated using (public.est_prof())', re, re);
    end if;

    -------------------------------------------------------------- paramètres
    if to_regclass('public.' || pa) is not null then
      execute format('alter table public.%I enable row level security', pa);

      -- Les devoirs et les verrous d'évaluation doivent être lisibles par les
      -- élèves — y compris avant connexion, l'accueil les consulte.
      execute format('drop policy if exists p_%s_lecture on public.%I', pa, pa);
      execute format('create policy p_%s_lecture on public.%I for select to anon, authenticated using (true)', pa, pa);

      -- mais modifiables par le seul professeur.
      execute format('drop policy if exists p_%s_prof_ecriture on public.%I', pa, pa);
      execute format('create policy p_%s_prof_ecriture on public.%I for insert to authenticated with check (public.est_prof())', pa, pa);

      execute format('drop policy if exists p_%s_prof_modif on public.%I', pa, pa);
      execute format('create policy p_%s_prof_modif on public.%I for update to authenticated using (public.est_prof()) with check (public.est_prof())', pa, pa);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- ÉTAPE 5 — état obtenu
-- ---------------------------------------------------------------------------
do $$
declare
  t text; actif bool; n int;
  manque text[] := '{}';
begin
  raise notice '';
  raise notice '=== ÉTAT APRÈS MIGRATION ===';
  foreach t in array array[
    'eleves','eleves_1ere','eleves_2nde',
    'resultats','resultats_1ere','resultats_2nde',
    'parametres','parametres_1ere','parametres_2nde'
  ] loop
    select relrowsecurity into actif
      from pg_class where relname = t and relnamespace = 'public'::regnamespace;
    if actif is null then continue; end if;
    select count(*) into n from pg_policies where schemaname = 'public' and tablename = t;
    raise notice '  % RLS=%  politiques=%', rpad(t, 18), rpad(actif::text, 5), n;
    if not actif then manque := manque || t; end if;
  end loop;

  if array_length(manque, 1) is not null then
    raise exception 'RLS toujours inactive sur : %', array_to_string(manque, ', ');
  end if;

  -- Le filet : si une colonne pin subsiste quelque part, la migration a
  -- échoué en silence et les codes repartiraient dans le navigateur.
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and column_name = 'pin'
               and table_name in ('eleves','eleves_1ere','eleves_2nde')) then
    raise exception 'une colonne pin subsiste : les codes partiraient encore en clair';
  end if;

  raise notice '=== migration terminée ===';
  raise notice '';
end $$;
