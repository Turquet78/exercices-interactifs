-- ============================================================================
--  011 — L'élève efface la réponse du professeur une fois qu'il l'a lue
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 008.
--
--  ⚠️  ELLE SE JOUE AVANT LA MISE EN LIGNE, PAS APRÈS.
--
--  Demande de Turquet (octobre 2026) : « quand il y a une réponse du
--  professeur pour l'élève, supprimer le message quand l'élève valide la
--  lecture ». La page pose un bouton « J'ai lu » sous chaque réponse ; sans ce
--  fichier, la base refuse en silence (0 ligne) et la page le dit à l'élève —
--  rien ne casse, mais rien ne s'efface non plus.
--
--  CE QU'ELLE FAIT
--
--  1. une politique de SUPPRESSION pour l'élève, sur les trois tables de
--     signalements : SA PROPRE ligne, et seulement si le professeur y a
--     RÉPONDU. Un signalement encore sans réponse reste au professeur — sans
--     cette condition, un élève effacerait ce qu'il vient d'envoyer avant
--     qu'on l'ait lu ;
--  2. la même chose sur le bucket « signalements » : l'élève supprime (et
--     donc voit — remove() l'exige) la copie d'écran d'un signalement à lui,
--     déjà répondu, et aucune autre. Gardée, elle
--     resterait dans le stockage sans plus aucune ligne pour la désigner —
--     invisible, et décomptée du quota.
--
--  POURQUOI UNE SUPPRESSION ET PAS UNE MARQUE « J'AI LU »
--
--  La 008 l'expliquait : une politique d'UPDATE ouverte à l'élève, fût-ce sur
--  sa propre ligne, le laisserait réécrire son message ou la réponse elle-même.
--  Une politique de DELETE ne réécrit rien : l'élève ne peut que retirer une
--  ligne qui est à lui et qui a reçu sa réponse. Elle s'AJOUTE à celle du
--  professeur (deux permissives se combinent par un OU), elle ne la remplace
--  pas : p_…_prof_suppr reste telle que la 003 l'a posée.
--
--  LE STOCKAGE N'EXISTE QUE SUR SUPABASE
--
--  npm run test:base lève un PostgreSQL ordinaire, sans schéma « storage » :
--  l'étape 2 s'y annonce sautée, et c'est le seul morceau de ce fichier qu'il
--  ne voit pas. Sur le projet, elle est jouée et contrôlée à la fin.
--
--  ELLE EST IDEMPOTENTE : la rejouer ne casse rien et ne duplique rien.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ÉTAPE 1 — la suppression de sa propre ligne répondue
-- ---------------------------------------------------------------------------
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
  raise notice '=== L''ÉLÈVE EFFACE LA RÉPONSE LUE ===';

  foreach n slice 1 in array niveaux loop
    si := n[1]; el := n[2];

    -- Un niveau absent est SIGNALÉ et sauté, jamais deviné.
    if to_regclass('public.' || si) is null or to_regclass('public.' || el) is null then
      raise notice '  % : table absente, ignorée', si;
      continue;
    end if;
    if not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = si
                      and column_name = 'reponse') then
      raise exception '% n''a pas de colonne « reponse » : jouez d''abord la migration 008.', si;
    end if;

    execute format('drop policy if exists p_%s_eleve_lu on public.%I', si, si);
    execute format($f$create policy p_%s_eleve_lu on public.%I for delete to authenticated
      using (reponse is not null
             and exists (select 1 from public.%I e
                          where e.id = eleve_id and e.user_id = auth.uid()))$f$, si, si, el);

    faits := faits + 1;
    raise notice '  % : l''élève efface sa ligne une fois répondue', si;
  end loop;

  raise notice '% table(s) de signalements.', faits;
end $$;

-- ---------------------------------------------------------------------------
-- ÉTAPE 2 — la copie d'écran part avec la ligne
-- ---------------------------------------------------------------------------
-- Le chemin du fichier est rangé dans la colonne « capture » (migration 007) :
-- l'élève supprime l'objet que désigne une de SES lignes déjà répondues, et
-- aucun autre. La page supprime l'image AVANT la ligne — après, plus rien ne
-- prouverait qu'elle était à lui.
do $$
declare
  niveaux text[][] := array[
    array['signalements',      'eleves'],
    array['signalements_1ere', 'eleves_1ere'],
    array['signalements_2nde', 'eleves_2nde']
  ];
  n text[];
  conditions text[] := '{}';
begin
  if to_regclass('storage.objects') is null then
    raise notice '  stockage absent (PostgreSQL ordinaire) : étape 2 sautée';
    return;
  end if;

  foreach n slice 1 in array niveaux loop
    if to_regclass('public.' || n[1]) is null or to_regclass('public.' || n[2]) is null then continue; end if;
    if not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = n[1]
                      and column_name = 'capture') then continue; end if;
    conditions := conditions || format(
      'exists (select 1 from public.%I s join public.%I e on e.id = s.eleve_id
                where s.capture = objects.name and s.reponse is not null and e.user_id = auth.uid())',
      n[1], n[2]);
  end loop;

  execute 'drop policy if exists p_signalements_eleve_lu on storage.objects';
  execute 'drop policy if exists p_signalements_eleve_lu_vue on storage.objects';
  if array_length(conditions, 1) is null then
    raise notice '  aucune table avec la colonne « capture » : pas de politique de stockage';
    return;
  end if;
  execute format('create policy p_signalements_eleve_lu on storage.objects for delete to authenticated
    using (bucket_id = ''signalements'' and (%s))', array_to_string(conditions, ' or '));
  -- ET LA MÊME CONDITION EN LECTURE, sans quoi la suppression ne fait RIEN.
  -- remove() de Supabase efface avec un « where name in (…) returning » : une
  -- ligne que la politique SELECT cache n'est pas vue, donc pas effacée — et
  -- sans erreur. La documentation le dit (« objects: delete and select »), et
  -- un essai sur une base jetable l'a montré : sans cette politique, la
  -- capture restait. La 007 ne laissait l'élève rien relire ; il relit
  -- désormais SA capture, celle d'un signalement à lui déjà répondu, et
  -- aucune autre — la page ne la lui affiche d'ailleurs pas.
  execute format('create policy p_signalements_eleve_lu_vue on storage.objects for select to authenticated
    using (bucket_id = ''signalements'' and (%s))', array_to_string(conditions, ' or '));
  raise notice '  bucket « signalements » : l''élève supprime la capture d''un signalement répondu (% table(s))',
    array_length(conditions, 1);
end $$;

-- ---------------------------------------------------------------------------
-- ÉCHEC BRUYANT SI UNE PIÈCE MANQUE
-- ---------------------------------------------------------------------------
do $$
declare n_tab int; n_pol int;
begin
  select count(*) into n_tab
    from information_schema.tables
   where table_schema = 'public'
     and table_name in ('signalements', 'signalements_1ere', 'signalements_2nde');
  if n_tab = 0 then
    raise exception 'Aucune table de signalements : jouez d''abord les migrations 003 et 008.';
  end if;

  -- La politique doit nommer le compte ET la réponse : sans auth.uid(),
  -- n'importe qui effacerait ; sans « reponse », l'élève effacerait ce que le
  -- professeur n'a pas encore lu.
  select count(*) into n_pol
    from pg_policies
   where schemaname = 'public'
     and tablename in ('signalements', 'signalements_1ere', 'signalements_2nde')
     and cmd = 'DELETE'
     and qual like '%auth.uid()%' and qual like '%reponse IS NOT NULL%';
  if n_pol <> n_tab then
    raise exception 'La suppression par l''élève n''est pas posée sur toutes les tables : % sur %.', n_pol, n_tab;
  end if;

  if to_regclass('storage.objects') is not null
     and (select count(*) from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and policyname in ('p_signalements_eleve_lu', 'p_signalements_eleve_lu_vue')) <> 2 then
    raise exception 'Les politiques p_signalements_eleve_lu et p_signalements_eleve_lu_vue manquent sur le bucket « signalements ».';
  end if;

  raise notice '% table(s) : l''élève efface la réponse lue. La page peut être mise en ligne.', n_tab;
end $$;

-- À relire après coup, dans l'éditeur SQL :
--   select tablename, policyname, cmd from pg_policies
--    where policyname like 'p_signalements%' order by 1, 2;
