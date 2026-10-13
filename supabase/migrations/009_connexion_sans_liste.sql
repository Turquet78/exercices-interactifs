-- ============================================================================
--  009 — La connexion sans la liste des prénoms
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 008.
--
--  ⚠️  ELLE SE JOUE APRÈS LA MISE EN LIGNE, PAS AVANT — l'inverse des 003,
--      007 et 008, et pour une raison qui ne se devine pas.
--
--  La version qui la connaît est : Seconde v480, Première v316, Terminale
--  v384. Attendez de LIRE ces numéros dans l'en-tête des trois pages en ligne,
--  puis collez ce fichier. Dans l'autre ordre, la connexion de TOUT LE MONDE
--  est coupée : l'ancienne page demande la liste des prénoms avant toute
--  authentification (select sur eleves… en tant que visiteur), et cette
--  migration ferme précisément cette lecture — l'écran afficherait « Aucun
--  compte pour l'instant » à une classe entière. La nouvelle page, elle, se
--  passe de la liste ; et TANT QUE cette migration n'est pas jouée, elle se
--  replie d'elle-même sur l'ancienne lecture (PostgREST répond 404, code
--  PGRST202, à une fonction qui n'existe pas encore). Ce repli s'éteint tout
--  seul dès que ce fichier est passé : il ne reste rien à retirer.
--
--  POURQUOI CE FICHIER EXISTE
--
--  La migration 001 avait posé, sur chaque table d'élèves, une politique de
--  lecture ouverte à anon : « la liste des prénoms doit rester lisible sans
--  être connecté, c'est l'écran de connexion qui la demande ». C'était vrai, et
--  c'était le prix : n'importe qui, sans compte, lisait les prénoms de trois
--  classes de mineurs et la clé de chacun — dont l'adresse de connexion est
--  dérivée. Décision de Turquet (octobre 2026) : cette lecture se ferme.
--  L'élève TAPE son prénom, et la page n'obtient que ce qu'il faut pour le
--  connecter : la ou les clés de CE prénom.
--
--  CE QU'ELLE FAIT
--
--  1. public.normaliser_prenom(text) : minuscules, espaces rognés et réduits,
--     accents retirés — pour que « Chloé », « chloe » et « CHLOÉ  » soient le
--     même prénom. La page applique la MÊME règle de son côté (normaliserPrenom,
--     par NFD) ; les deux doivent rester d'accord.
--
--  2. public.cles_de_connexion(niveau, prenom) : rend la ou les clés des élèves
--     du niveau dont le prénom normalisé est celui demandé — cinq au plus,
--     triées. Elle est SECURITY DEFINER : elle lit la table SANS repasser par
--     la RLS, comme est_prof() — sans cela, le visiteur qui l'appelle ne verrait
--     rien, puisque la politique qui le laissait lire disparaît au point 3.
--     Et elle ne rend QUE la clé : ni l'identifiant, ni le prénom, ni la liste.
--     Un visiteur n'obtient plus que ce qu'il savait déjà (le prénom qu'il a
--     tapé) traduit en ce qu'il lui faut pour tenter un code — et le code,
--     lui, reste vérifié par Supabase seul.
--
--  3. Sur eleves, eleves_1ere et eleves_2nde : la politique p_<table>_liste
--     est REMPLACÉE par la même, pour « authenticated » seul. Le NOM ne change
--     pas (d'autres scripts peuvent le citer), seul « anon » disparaît. On
--     remplace, on n'ajoute pas : deux politiques permissives se combinent par
--     un OU, et c'est ainsi qu'on garde une règle qu'on croit avoir retirée
--     (la leçon de la migration 002).
--
--  CE QU'ELLE NE FAIT PAS, ET C'EST VOULU
--
--  Un élève CONNECTÉ lit toujours la liste entière de sa classe : le tableau
--  du professeur, les signalements et le bilan en ont besoin (ils lisent
--  eleves….id et prenom pour nommer les lignes). Restreindre l'élève connecté
--  à sa propre ligne est une étape possible plus tard, NOMMÉE ici comme non
--  faite — et non faite.
--
--  Elle ne touche pas aux scripts à clé de service — sauvegarde.mjs,
--  relier-comptes.sql, la fonction Edge admin-eleve : ils traversent la RLS,
--  qu'une politique soit là ou non.
--
--  ELLE EST IDEMPOTENTE : la rejouer ne casse rien et ne duplique rien.
--  Un niveau dont la table est absente est SIGNALÉ et sauté, jamais deviné.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Le prénom normalisé — la MÊME règle que normaliserPrenom() dans la page
-- ---------------------------------------------------------------------------
-- lower() d'abord, puis le retrait des accents. Les majuscules accentuées
-- figurent AUSSI dans la table de translate : sous une locale « C », lower()
-- laisse « É » tel quel, et « CHLOÉ » ne retrouverait pas « Chloé ». Sous une
-- locale complète (celle de Supabase) ces entrées sont inertes ; sous l'autre,
-- elles rattrapent ce que lower() a laissé. Une règle qui dépend de la locale
-- n'est pas une règle.
create or replace function public.normaliser_prenom(p text)
returns text
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select translate(
           regexp_replace(lower(btrim(p)), '\s+', ' ', 'g'),
           'àáâäãåèéêëìíîïòóôöõùúûüýÿçñÀÁÂÄÃÅÈÉÊËÌÍÎÏÒÓÔÖÕÙÚÛÜÝŸÇÑ',
           'aaaaaaeeeeiiiiooooouuuuyycnaaaaaaeeeeiiiiooooouuuuyycn')
$$;

revoke all on function public.normaliser_prenom(text) from public;
grant execute on function public.normaliser_prenom(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Les clés d'un prénom — ce que l'écran de connexion a le droit de demander
-- ---------------------------------------------------------------------------
-- Les clés de niveau sont celles de NIVEAUX dans la fonction Edge admin-eleve
-- et de la constante NIVEAU de chaque page : 'secondes', 'premiere',
-- 'terminale'. Un niveau inconnu est une erreur, pas une liste vide : la page
-- qui enverrait un mauvais nom doit le voir, pas conclure « prénom inconnu ».
create or replace function public.cles_de_connexion(niveau text, prenom text)
returns setof text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  t text;
  p text;
begin
  t := case niveau
         when 'secondes'  then 'eleves_2nde'
         when 'premiere'  then 'eleves_1ere'
         when 'terminale' then 'eleves'
       end;
  if t is null then
    raise exception 'niveau inconnu : %', niveau;
  end if;

  -- Un prénom vide après normalisation ne rend rien : sans ce garde, une
  -- table où un prénom serait vide rendrait sa clé à qui n'a rien tapé.
  p := public.normaliser_prenom(prenom);
  if p is null or p = '' then
    return;
  end if;

  -- « limit 5 » : deux homonymes dans une classe, c'est courant ; cinq, c'est
  -- déjà le signe d'autre chose. La page essaie le code sur chaque clé rendue.
  return query execute format(
    'select e.cle from public.%I e
      where public.normaliser_prenom(e.prenom) = $1
      order by e.cle
      limit 5', t)
    using p;
end $$;

revoke all on function public.cles_de_connexion(text, text) from public;
grant execute on function public.cles_de_connexion(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. La liste des prénoms ne se lit plus sans être connecté
-- ---------------------------------------------------------------------------
do $$
declare
  el text;
  faits int := 0;
begin
  raise notice '';
  raise notice '=== CONNEXION SANS LA LISTE DES PRÉNOMS ===';

  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    -- Un niveau absent du projet est SIGNALÉ et sauté, jamais deviné : les
    -- trois pages partagent un seul projet, mais rien ne garantit que les
    -- trois jeux de tables y soient.
    if to_regclass('public.' || el) is null then
      raise notice '  % : table absente, ignorée', el;
      continue;
    end if;

    -- Même nom qu'en 001, « anon » en moins. REMPLACÉE, pas doublée.
    execute format('drop policy if exists p_%s_liste on public.%I', el, el);
    execute format('create policy p_%s_liste on public.%I for select to authenticated using (true)', el, el);

    faits := faits + 1;
    raise notice '  % : connexion sans liste', el;
  end loop;

  raise notice '';
  raise notice '% table(s) d''élèves fermée(s) aux visiteurs.', faits;
end $$;

-- ---------------------------------------------------------------------------
--  ÉCHEC BRUYANT SI UNE PIÈCE MANQUE
-- ---------------------------------------------------------------------------
--  Un fichier qui se termine sans rien dire laisse croire qu'il a travaillé.
--  Quatre choses doivent être vraies à la fois ; chacune manquante est nommée.
do $$
declare
  p record;
  el text;
  n int;
  definer bool;
  chemin text[];
begin
  -- 1. Plus aucune politique de LECTURE d'une table d'élèves ne nomme anon —
  --    ni « public », qui le contient. « for all » compte comme une lecture :
  --    c'est la forme des neuf politiques que la 002 retire, et si l'une
  --    d'elles était revenue par la console Supabase, la liste serait de
  --    nouveau ouverte quoi que dise p_<table>_liste.
  for p in
    select tablename, policyname, roles
      from pg_policies
     where schemaname = 'public'
       and tablename in ('eleves', 'eleves_1ere', 'eleves_2nde')
       and cmd in ('SELECT', 'ALL')
       and roles::text[] && array['anon', 'public']
     order by tablename, policyname
  loop
    raise exception 'la liste des prénoms reste lisible sans connexion : %.% (pour %) — jouez 002 si cette politique n''est pas à vous',
      p.tablename, p.policyname, array_to_string(p.roles::text[], '+');
  end loop;

  -- 2. Une seule politique de lecture par table : la nôtre. Une seconde posée
  --    à côté, même fermée, est une règle de trop qu'on ne relit jamais.
  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    if to_regclass('public.' || el) is null then continue; end if;
    select count(*) into n
      from pg_policies
     where schemaname = 'public' and tablename = el and cmd in ('SELECT', 'ALL');
    if n <> 1 then
      raise exception '% : % politique(s) de lecture au lieu d''une seule', el, n;
    end if;
  end loop;

  -- 3. La fonction existe, et elle lit SANS la RLS. Sans security definer,
  --    elle s'exécuterait comme le visiteur qui l'appelle — et ne rendrait
  --    plus rien, puisque la lecture vient de lui être fermée : l'écran de
  --    connexion répondrait « prénom inconnu » à toute la classe.
  select prosecdef, proconfig into definer, chemin
    from pg_proc
   where oid = to_regprocedure('public.cles_de_connexion(text, text)');
  if definer is null then
    raise exception 'la fonction public.cles_de_connexion(text, text) manque';
  end if;
  if not definer then
    raise exception 'public.cles_de_connexion n''est pas SECURITY DEFINER : elle ne rendrait rien à un visiteur';
  end if;
  if chemin is null or not exists (select 1 from unnest(chemin) c where c like 'search_path=%') then
    raise exception 'public.cles_de_connexion ne verrouille pas son search_path';
  end if;

  -- 4. Et le visiteur a le droit de l'appeler : c'est tout ce qu'il lui reste.
  if not has_function_privilege('anon', 'public.cles_de_connexion(text, text)', 'execute') then
    raise exception 'anon ne peut pas exécuter public.cles_de_connexion : la connexion serait impossible';
  end if;

  raise notice 'La liste des prénoms ne se lit plus sans connexion ; cles_de_connexion répond au visiteur, et elle seule.';
end $$;

-- ---------------------------------------------------------------------------
--  ÉTAT OBTENU — à relire dans la sortie de l'éditeur SQL
-- ---------------------------------------------------------------------------
do $$
declare p record;
begin
  raise notice '';
  raise notice '=== POLITIQUES DES TABLES D''ÉLÈVES ===';
  for p in
    select tablename, policyname, cmd, roles
      from pg_policies
     where schemaname = 'public' and tablename in ('eleves', 'eleves_1ere', 'eleves_2nde')
     order by tablename, policyname
  loop
    raise notice '  %  %  (%, pour %)', rpad(p.tablename, 14), rpad(p.policyname, 28), p.cmd,
      array_to_string(p.roles::text[], '+');
  end loop;
end $$;
