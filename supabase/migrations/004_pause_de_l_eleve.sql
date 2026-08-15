-- ============================================================================
--  004 — L'élève peut faire avancer et effacer SA pause
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LES MIGRATIONS 001, 002 ET 003.
--
--  POURQUOI CE FICHIER EXISTE
--
--  La mise en pause écrit une ligne « state: paused » dans la table des
--  résultats, la fait avancer à chaque réponse, puis la supprime quand le test
--  se termine ou que l'élève abandonne. Trois gestes : insert, update, delete.
--
--  La migration 001 n'a donné que le premier. Il n'existait aucune politique
--  d'update ni de delete pour l'élève — seulement pour le professeur. Les deux
--  autres gestes étaient donc refusés, et REFUSÉS SANS ERREUR : sous RLS, une
--  ligne qu'on n'a pas le droit de toucher est une ligne qui n'existe pas.
--  PostgREST répond « 0 ligne modifiée », ce qui n'est pas une erreur.
--
--  Conséquences, toutes silencieuses et toutes en production :
--    · le brouillon de pause n'avançait jamais — il restait figé sur la
--      première réponse, et « tu t'es arrêté à la question 2 » était faux ;
--    · il n'était JAMAIS supprimé : ni à la fin d'un test, ni à l'abandon.
--      L'exercice restait donc proposé « à reprendre » indéfiniment, alors que
--      la page annonçait « Exercice abandonné ✓ » ;
--    · chaque tentative laissait une ligne fantôme de plus dans la table.
--
--  CE QUE CETTE MIGRATION N'ACCORDE PAS
--
--  Le droit est délibérément étroit : il ne porte QUE sur les lignes dont
--  details->>'state' vaut 'paused', et seulement celles de l'élève lui-même.
--    · une NOTE obtenue reste intouchable — un élève ne peut pas effacer une
--      mauvaise note ni se relever un score ;
--    · le « with check » de l'update interdit de transformer un brouillon en
--      note : ce qui sort de l'update doit encore être un brouillon ;
--    · le travail d'un camarade reste hors de portée.
--
--  LES DROITS DE TABLE, EXPLICITEMENT. Une politique RLS ne donne aucun droit :
--  elle filtre les lignes une fois le droit accordé. C'est la leçon de la
--  migration 003, où des tables nées après un « grant … on all tables » se
--  heurtaient à « permission denied » avec des politiques pourtant justes.
--
--  Il est IDEMPOTENT : le relancer ne fait plus rien.
--
--  `npm run test:base` le rejoue sur un PostgreSQL jetable et vérifie les deux
--  bords : que la pause avance et s'efface, et qu'une note reste intouchable.
-- ============================================================================

do $$
declare
  suffixe text;
  el text; re text;
  faits int := 0;
begin
  raise notice '';
  raise notice '=== LA PAUSE DE L''ÉLÈVE ===';

  foreach suffixe in array array['', '_1ere', '_2nde'] loop
    el := 'eleves' || suffixe;
    re := 'resultats' || suffixe;

    if to_regclass('public.' || re) is null or to_regclass('public.' || el) is null then
      raise notice '  % : absente du projet, ignorée', re;
      continue;
    end if;

    execute format('grant select, insert, update, delete on public.%I to authenticated', re);

    -- FAIRE AVANCER SA PAUSE. « using » dit quelles lignes elle peut prendre,
    -- « with check » ce qu'elle a le droit d'en faire : les deux exigent un
    -- brouillon à elle, si bien qu'un brouillon ne peut pas devenir une note.
    execute format('drop policy if exists p_%s_eleve_pause_modif on public.%I', re, re);
    execute format($f$create policy p_%s_eleve_pause_modif on public.%I for update to authenticated
      using (details->>'state' = 'paused'
             and exists (select 1 from public.%I e where e.id = eleve_id and e.user_id = auth.uid()))
      with check (details->>'state' = 'paused'
             and exists (select 1 from public.%I e where e.id = eleve_id and e.user_id = auth.uid()))$f$,
      re, re, el, el);

    -- EFFACER SA PAUSE : fin du test, ou abandon. Les notes, jamais.
    execute format('drop policy if exists p_%s_eleve_pause_suppr on public.%I', re, re);
    execute format($f$create policy p_%s_eleve_pause_suppr on public.%I for delete to authenticated
      using (details->>'state' = 'paused'
             and exists (select 1 from public.%I e where e.id = eleve_id and e.user_id = auth.uid()))$f$,
      re, re, el);

    faits := faits + 1;
    raise notice '  % : la pause de l''élève avance et s''efface', re;
  end loop;

  raise notice '';
  raise notice '% table(s) de résultats mises à jour.', faits;
end $$;

-- ---------------------------------------------------------------------------
--  ÉTAT OBTENU — à lire dans la sortie de l'éditeur SQL
-- ---------------------------------------------------------------------------
do $$
declare p record;
begin
  raise notice '';
  raise notice '=== POLITIQUES DES RÉSULTATS ===';
  for p in
    select tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public' and tablename like 'resultats%'
    order by tablename, cmd, policyname
  loop
    raise notice '  %  %  (%)', rpad(p.tablename, 18), rpad(p.policyname, 34), p.cmd;
  end loop;
end $$;
