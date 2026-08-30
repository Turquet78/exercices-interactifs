-- ============================================================================
--  008 — Le professeur répond à un signalement, et l'élève lit la réponse
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 007.
--
--  ⚠️  ELLE SE JOUE AVANT LA MISE EN LIGNE, PAS APRÈS.
--
--  C'est la leçon des migrations 003 et 007, et elle a déjà coûté une panne.
--  Ici le coût d'un retard est heureusement du bon côté — l'accueil de l'élève
--  se contente de ne rien afficher, il n'échoue pas — mais le professeur, lui,
--  reçoit une erreur au moment où il essaie de répondre. Jouez ce fichier
--  d'abord ; la page qui ne le connaît pas encore n'en souffre pas.
--
--  CE QU'ELLE FAIT
--
--  1. deux colonnes sur les trois tables de signalements : « reponse » (le
--     texte du professeur) et « repondu_at » (la date, que l'élève voit) ;
--  2. elle ÉLARGIT la politique de lecture — c'est le cœur du fichier.
--
--  POURQUOI LA LECTURE DOIT CHANGER
--
--  La 003 réservait la lecture au professeur, et le disait en toutes lettres :
--  « SEUL LE PROFESSEUR LIT ». La raison était bonne — un signalement porte le
--  prénom d'un élève et un texte libre qu'il a tapé, il n'a rien à faire sous
--  les yeux des autres — et elle ne change pas : l'élève ne lira toujours que
--  SA PROPRE LIGNE, jamais celle d'un camarade. C'est exactement le motif que
--  « resultats » emploie depuis la 001 : est_prof() OU sa propre ligne.
--
--  Sans cet élargissement, une réponse serait parfaitement enregistrée et
--  parfaitement invisible : la page insère d'ailleurs « à sec », sans demander
--  la ligne en retour, précisément parce que la demander échouait.
--
--  CE QU'ELLE NE FAIT PAS, ET C'EST VOULU
--
--  Elle ne donne À L'ÉLÈVE AUCUN DROIT D'ÉCRITURE. Pas d'UPDATE, donc pas de
--  marque « j'ai lu », pas de réponse à la réponse : le droit qu'on ne donne
--  pas est celui qu'on n'a pas à surveiller. La table porte un UPDATE ouvert à
--  tout « authenticated » au niveau des DROITS (grant), et seule la politique
--  le restreint au professeur — lui ouvrir une politique d'UPDATE, fût-ce sur
--  sa propre ligne, le laisserait réécrire son message ou la réponse elle-même.
--
--  ELLE EST IDEMPOTENTE : la rejouer ne casse rien et ne duplique rien.
-- ============================================================================

do $$
declare
  niveaux text[][] := array[
    array['signalements',      'eleves'],
    array['signalements_1ere', 'eleves_1ere'],
    array['signalements_2nde', 'eleves_2nde']
  ];
  n text[];
  si text; el text;
  faits int := 0;
begin
  raise notice '';
  raise notice '=== RÉPONSE DU PROFESSEUR AUX SIGNALEMENTS ===';

  foreach n slice 1 in array niveaux loop
    si := n[1]; el := n[2];

    -- Un niveau absent du projet est SIGNALÉ et sauté, jamais deviné : les
    -- trois pages partagent un seul projet, mais rien ne garantit que les
    -- trois jeux de tables y soient.
    if to_regclass('public.' || si) is null then
      raise notice '  % : table absente, ignorée', si;
      continue;
    end if;
    if to_regclass('public.' || el) is null then
      raise notice '  % : table des élèves (%) absente, ignorée', si, el;
      continue;
    end if;

    -- 1. les deux colonnes
    execute format('alter table public.%I add column if not exists reponse text', si);
    execute format('alter table public.%I add column if not exists repondu_at timestamptz', si);

    -- 2. la lecture : le professeur, OU l'élève sur sa propre ligne.
    --    Le nom de la politique ne change pas — on remplace celle de la 003,
    --    on n'en ajoute pas une seconde à côté. Deux politiques permissives se
    --    combinent par un OU, et c'est ainsi qu'on se retrouve avec une règle
    --    qu'on croit avoir retirée (la leçon de la migration 002).
    execute format('drop policy if exists p_%s_lecture on public.%I', si, si);
    execute format($f$create policy p_%s_lecture on public.%I for select to authenticated
      using (public.est_prof()
             or exists (select 1 from public.%I e
                         where e.id = eleve_id and e.user_id = auth.uid()))$f$, si, si, el);

    faits := faits + 1;
    raise notice '  % : colonnes « reponse » et « repondu_at », lecture élargie à sa propre ligne', si;
  end loop;

  raise notice '';
  raise notice '% table(s) de signalements prête(s) pour les réponses.', faits;
end $$;

-- ---------------------------------------------------------------------------
--  ÉCHEC BRUYANT SI UNE PIÈCE MANQUE
-- ---------------------------------------------------------------------------
--  Un fichier qui se termine sans rien dire laisse croire qu'il a travaillé.
do $$
declare n_col int; n_pol int; n_tab int;
begin
  select count(*) into n_tab
    from information_schema.tables
   where table_schema = 'public'
     and table_name in ('signalements', 'signalements_1ere', 'signalements_2nde');

  if n_tab = 0 then
    raise exception 'Aucune table de signalements : jouez d''abord la migration 003.';
  end if;

  select count(*) into n_col
    from information_schema.columns
   where table_schema = 'public'
     and table_name in ('signalements', 'signalements_1ere', 'signalements_2nde')
     and column_name in ('reponse', 'repondu_at');

  if n_col <> n_tab * 2 then
    raise exception 'Colonnes manquantes : % au lieu de % (2 par table).', n_col, n_tab * 2;
  end if;

  -- La politique doit VRAIMENT nommer auth.uid() : une politique restée à
  -- est_prof() seul laisserait la réponse invisible sans que rien ne rougisse.
  select count(*) into n_pol
    from pg_policies
   where schemaname = 'public'
     and tablename in ('signalements', 'signalements_1ere', 'signalements_2nde')
     and cmd = 'SELECT'
     and qual like '%auth.uid()%';

  if n_pol <> n_tab then
    raise exception 'La lecture n''a pas été élargie sur toutes les tables : % sur %.', n_pol, n_tab;
  end if;

  raise notice '% table(s) : colonnes en place, lecture élargie. La page peut être mise en ligne.', n_tab;
end $$;

-- ---------------------------------------------------------------------------
--  ÉTAT OBTENU — à relire dans la sortie de l'éditeur SQL
-- ---------------------------------------------------------------------------
do $$
declare p record;
begin
  raise notice '';
  raise notice '=== POLITIQUES DES SIGNALEMENTS ===';
  for p in
    select tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public' and tablename like 'signalements%'
    order by tablename, policyname
  loop
    raise notice '  %  %  (%)', rpad(p.tablename, 20), rpad(p.policyname, 34), p.cmd;
  end loop;
end $$;
