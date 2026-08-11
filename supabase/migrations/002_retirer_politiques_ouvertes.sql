-- ============================================================================
--  002 — Retirer les politiques grandes ouvertes
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 001.
--
--  POURQUOI CE FICHIER EXISTE
--
--  La migration 001 pose des politiques précises : chacun voit ses notes, le
--  professeur les voit toutes, personne n'écrit sous le nom d'un autre. Mais
--  elle ne touche pas aux politiques qu'elle n'a pas écrites — prudence
--  délibérée, pour ne rien casser d'existant.
--
--  Or le projet en portait NEUF, une par table, de cette forme :
--
--      create policy "…" on public.eleves for all
--        to anon using (true) with check (true);
--
--  « using (true) » signifie : tout le monde, tout le temps, tout. Et
--  PostgreSQL combine les politiques permissives par un OU — il suffit qu'UNE
--  SEULE autorise pour que l'accès passe. Une politique pareille annule donc
--  toutes celles que 001 a posées à côté. Après 001 seule, la base restait
--  entièrement lisible et modifiable par n'importe quel visiteur.
--
--  CE FICHIER NE SUPPRIME RIEN EN SILENCE. Il nomme chaque politique retirée,
--  et il laisse en place — en le signalant — tout ce qui ne serait pas
--  manifestement grand ouvert, pour que vous décidiez vous-même.
--
--  Critère de suppression, volontairement étroit : la politique est
--  PERMISSIVE, elle s'applique à anon, public ou authenticated, sa condition
--  de lecture ET sa condition d'écriture valent « true » (ou sont absentes),
--  et elle ne fait pas partie de celles que 001 a posées (préfixe « p_ »).
--
--  Il est IDEMPOTENT : le relancer ne fait plus rien.
-- ============================================================================

do $$
declare
  p record;
  retirees int := 0;
  laissees text[] := '{}';
  TABLES text[] := array[
    'eleves','eleves_1ere','eleves_2nde',
    'resultats','resultats_1ere','resultats_2nde',
    'parametres','parametres_1ere','parametres_2nde'
  ];
begin
  raise notice '';
  raise notice '=== POLITIQUES EXAMINÉES ===';

  for p in
    select tablename, policyname, permissive, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename = any(TABLES)
      and policyname not like 'p\_%'
    order by tablename, policyname
  loop
    if p.permissive = 'PERMISSIVE'
       and p.roles::text[] && array['anon','public','authenticated']
       and coalesce(p.qual, 'true') = 'true'
       and coalesce(p.with_check, 'true') = 'true'
    then
      execute format('drop policy %I on public.%I', p.policyname, p.tablename);
      raise notice '  RETIRÉE  %.%  (était : pour %, lecture=true, écriture=true)',
        p.tablename, p.policyname, array_to_string(p.roles::text[], '+');
      retirees := retirees + 1;
    else
      laissees := laissees || (p.tablename || '.' || p.policyname);
      raise notice '  LAISSÉE  %.%  — pas manifestement ouverte, à vous de juger',
        p.tablename, p.policyname;
    end if;
  end loop;

  raise notice '';
  raise notice '% politique(s) grande(s) ouverte(s) retirée(s).', retirees;
  if array_length(laissees, 1) is not null then
    raise notice 'Laissées en place : %', array_to_string(laissees, ', ');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Le filet : plus aucune porte ouverte ne doit subsister
-- ---------------------------------------------------------------------------
do $$
declare
  reste text;
begin
  select string_agg(tablename || '.' || policyname, ', ')
  into reste
  from pg_policies
  where schemaname = 'public'
    and tablename in ('eleves','eleves_1ere','eleves_2nde',
                      'resultats','resultats_1ere','resultats_2nde',
                      'parametres','parametres_1ere','parametres_2nde')
    and policyname not like 'p\_%'
    and permissive = 'PERMISSIVE'
    and roles::text[] && array['anon','public','authenticated']
    and coalesce(qual, 'true') = 'true'
    and coalesce(with_check, 'true') = 'true';

  if reste is not null then
    raise exception 'des politiques grandes ouvertes subsistent : %', reste;
  end if;

  -- Et les politiques de 001 doivent bien être là : sans elles, retirer les
  -- anciennes ne protégerait pas — cela couperait l'accès à tout le monde.
  if (select count(*) from pg_policies
      where schemaname = 'public' and policyname like 'p\_%') < 30 then
    raise exception 'les politiques de la migration 001 sont absentes ou incomplètes : jouez 001 AVANT 002';
  end if;

  raise notice '';
  raise notice 'La base est verrouillée : seules les politiques de 001 subsistent.';
  raise notice '';
end $$;
