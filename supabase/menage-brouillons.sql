-- ============================================================================
--  MÉNAGE DES BROUILLONS DE PAUSE FANTÔMES
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 004.
--
--  POURQUOI CE FICHIER EXISTE
--
--  Pendant des mois, l'élève n'a pas eu le droit de supprimer sa ligne « en
--  pause » : la migration 001 ne lui avait donné que l'insertion. Et le refus
--  était MUET — sous RLS, une ligne qu'on n'a pas le droit de toucher est une
--  ligne qui n'existe pas, et PostgREST répond « 0 ligne » plutôt que « refusé ».
--  Chaque exercice commencé a donc laissé une ligne « state: paused » qui n'est
--  jamais partie, ni à la fin du test, ni à l'abandon.
--
--  La migration 004 ouvre le droit pour la suite. Elle ne fait pas le ménage
--  du passé : c'est ce fichier.
--
--  CES BROUILLONS NE VALENT RIEN, ET C'EST DÉMONTRABLE
--
--  Le droit de MODIFIER manquait autant que celui de supprimer. Chaque ligne
--  est donc restée figée à l'instant de la toute PREMIÈRE réponse : elle
--  annonce « tu t'es arrêté à la question 5 » et ramène en réalité à la
--  question 1. Les garder ne conserve pas du travail, cela conserve un
--  mensonge — et empêche l'élève de recommencer l'exercice, puisque l'écran
--  des modes remplace « M'entraîner » par « Reprendre » dès qu'un brouillon
--  existe.
--
--  AUCUNE NOTE N'EST TOUCHÉE. Une note n'a pas de champ « state » : le filtre
--  details->>'state' = 'paused' ne peut pas l'atteindre. L'ÉTAPE 1 le montre
--  chiffres en main avant que quoi que ce soit ne soit supprimé.
--
--  QUAND LE JOUER : en dehors des heures où les élèves travaillent. Les rares
--  pauses réellement en cours partiraient avec les autres — sans perte de note,
--  mais l'élève reprendrait l'exercice au début.
--
--  Il est IDEMPOTENT : le relancer ne trouve plus rien.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  ÉTAPE 1 — CE QU'IL Y A, AVANT DE TOUCHER À QUOI QUE CE SOIT
--  Lisez cette sortie. Si les nombres vous surprennent, arrêtez-vous ici :
--  rien n'a encore été supprimé.
-- ---------------------------------------------------------------------------
do $$
declare
  t text; n_total int; n_pause int; n_notes int; n_recent int;
begin
  raise notice '';
  raise notice '=== ÉTAT AVANT MÉNAGE ===';
  raise notice '  %  %  %  %  %', rpad('table', 18), rpad('lignes', 8),
               rpad('notes', 8), rpad('brouillons', 12), 'dont < 24 h';
  foreach t in array array['resultats', 'resultats_1ere', 'resultats_2nde'] loop
    if to_regclass('public.' || t) is null then
      raise notice '  % absente du projet', t;
      continue;
    end if;
    execute format($q$
      select count(*),
             count(*) filter (where details->>'state' = 'paused'),
             count(*) filter (where details->>'state' is distinct from 'paused'),
             count(*) filter (where details->>'state' = 'paused'
                                and created_at > now() - interval '24 hours')
        from public.%I$q$, t)
      into n_total, n_pause, n_notes, n_recent;
    raise notice '  %  %  %  %  %', rpad(t, 18), rpad(n_total::text, 8),
                 rpad(n_notes::text, 8), rpad(n_pause::text, 12), n_recent;
  end loop;
  raise notice '';
  raise notice '  « notes » ne bougera pas. Seule la colonne « brouillons » sera vidée.';
end $$;

-- ---------------------------------------------------------------------------
--  ÉTAPE 2 — LE MÉNAGE
--
--  POUR NE RETIRER QUE LES VIEUX BROUILLONS et garder ceux d'aujourd'hui —
--  au cas où un élève serait en train de travailler — décommentez la ligne
--  « and created_at < now() - interval '24 hours' » ci-dessous.
-- ---------------------------------------------------------------------------
do $$
declare
  t text; n int; total int := 0;
begin
  raise notice '';
  raise notice '=== MÉNAGE ===';
  foreach t in array array['resultats', 'resultats_1ere', 'resultats_2nde'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format($q$
      delete from public.%I
       where details->>'state' = 'paused'
       -- and created_at < now() - interval '24 hours'
      $q$, t);
    get diagnostics n = row_count;
    total := total + n;
    raise notice '  % : % brouillon(s) retiré(s)', rpad(t, 18), n;
  end loop;
  raise notice '';
  raise notice '% brouillon(s) au total. Aucune note n''a été touchée.', total;
end $$;

-- ---------------------------------------------------------------------------
--  ÉTAPE 3 — CE QU'IL RESTE
--  « brouillons » doit être à zéro partout, et « notes » identique à l'étape 1.
-- ---------------------------------------------------------------------------
do $$
declare
  t text; n_pause int; n_notes int;
begin
  raise notice '';
  raise notice '=== ÉTAT APRÈS MÉNAGE ===';
  foreach t in array array['resultats', 'resultats_1ere', 'resultats_2nde'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format($q$
      select count(*) filter (where details->>'state' = 'paused'),
             count(*) filter (where details->>'state' is distinct from 'paused')
        from public.%I$q$, t)
      into n_pause, n_notes;
    raise notice '  %  brouillons=%  notes=%', rpad(t, 18), rpad(n_pause::text, 6), n_notes;
  end loop;
end $$;
