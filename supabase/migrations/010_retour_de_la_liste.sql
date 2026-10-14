-- ============================================================================
--  010 — Le retour de la liste des prénoms
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE. Collez le fichier ENTIER.
--
--  L'ORDRE EST INDIFFÉRENT : avant ou après la mise en ligne des pages, et
--  que la 009 ait été jouée ou non. C'est voulu, et c'est expliqué plus bas
--  (« L'ORDRE, ET POURQUOI IL EST INDIFFÉRENT ») — la 009 avait un ordre
--  impératif, celle-ci n'en a pas.
--
--  POURQUOI CE FICHIER EXISTE
--
--  La 009 avait fermé aux visiteurs la lecture de la liste des prénoms :
--  l'élève TAPAIT son prénom, et une fonction SECURITY DEFINER rendait la ou
--  les clés de ce prénom. Décision de Turquet, le 14 octobre 2026 : « revenir
--  à la liste des élèves qui s'affichent à l'écran avant de rentrer son mot de
--  passe ». Les PASTILLES de prénoms reviennent sur l'écran de connexion, et
--  la liste se lit de nouveau sans compte — exactement comme après la 001.
--
--  CE QU'ELLE FAIT
--
--  1. Sur eleves, eleves_1ere et eleves_2nde : la politique p_<table>_liste
--     est REMPLACÉE par celle de la 001 — « for select to anon, authenticated
--     using (true) ». Le NOM ne change pas (d'autres scripts peuvent le
--     citer), seul « anon » revient. On remplace, on n'ajoute pas : deux
--     politiques permissives se combinent par un OU, et une seconde politique
--     laissée à côté est une règle qu'on ne relit jamais (la leçon de la 002).
--
--  2. public.cles_de_connexion(text, text) et public.normaliser_prenom(text)
--     sont SUPPRIMÉES. Elles ne servaient qu'à l'écran du prénom tapé. Et leur
--     ABSENCE est un signal que les pages lisent : une page qui trouve la
--     liste VIDE demande si cles_de_connexion existe, et la croit fermée exprès
--     si oui. Laissée en place, la fonction ferait afficher le champ « Ton
--     prénom » à une classe vide au lieu de « Aucun compte pour l'instant » —
--     et masquerait une liste refermée par erreur un jour dans la console.
--
--  3. « notify pgrst, 'reload schema' » : PostgREST doit OUBLIER la fonction
--     (voir « LE CACHE DE SCHÉMA DE POSTGREST » en fin de fichier).
--
--  L'ORDRE, ET POURQUOI IL EST INDIFFÉRENT
--
--  Trois états de la base peuvent exister au moment où ce fichier est collé :
--  la 009 jamais jouée (liste ouverte, pas de fonction), la 009 jouée (liste
--  fermée, fonction présente), et celui-ci joué (liste ouverte, plus de
--  fonction). Deux pages peuvent être ouvertes chez les élèves. Chaque
--  combinaison connecte :
--
--  • La page qui ramène les pastilles lit la liste. Si elle revient VIDE —
--    la 009 jouée, pas encore ce fichier —, elle demande à la base si
--    cles_de_connexion existe ; si oui, la liste est fermée, et la page
--    affiche le champ « Ton prénom » à la place des pastilles : la connexion
--    par prénom tapé, intacte. Dès que ce fichier est passé, la liste revient
--    pleine, les pastilles s'affichent, et la question n'est plus posée. Ce
--    repli s'ÉTEINT de lui-même : il ne reste rien à retirer, ni dans la page
--    ni dans la base.
--  • La page d'hier (le champ « Ton prénom »), si une tablette la garde
--    encore en cache, appelle cles_de_connexion ; dès que ce fichier l'a
--    supprimée, PostgREST répond « fonction inconnue » (code PGRST202) et la
--    page se replie d'elle-même sur la lecture de la liste — rouverte au même
--    instant, par le même fichier.
--  • Si la 009 n'a JAMAIS été jouée, ce fichier ne change rien de visible :
--    la politique est déjà celle-là, et les fonctions n'existent pas.
--
--  La création de compte refuse un prénom déjà pris — sans accent ni
--  majuscule — dans les trois états : par la fonction si elle existe, par la
--  liste sinon. Aucun élève ne se crée un second compte pendant la transition.
--
--  LE PRIX, NOMMÉ PLUTÔT QUE TU
--
--  C'est exactement la lecture que la 009 avait fermée, et son prix revient
--  avec elle. La clé anonyme de Supabase est dans la page : N'IMPORTE QUI,
--  sans compte, depuis n'importe où sur Internet, lit de nouveau les prénoms
--  de trois classes de mineurs — et la CLÉ de chacun, dont l'adresse de
--  connexion (<clé>@<domaine des comptes>) est dérivée. La moitié de
--  l'identifiant est offerte : le code à six chiffres et la limitation de
--  cadence de Supabase (voir « La limitation de cadence » dans
--  supabase/LISEZMOI.md) redeviennent le SEUL rempart. C'est la décision de
--  Turquet, prise en connaissance de ce prix ; ce fichier l'applique, il ne
--  la discute pas.
--
--  CE QU'ELLE NE FAIT PAS, ET C'EST VOULU
--
--  Aucune donnée n'est touchée : pas un élève, pas une note, pas un compte.
--  Aucune autre politique n'est touchée : notes, signalements, paramètres,
--  écriture et suppression d'un élève gardent les leurs. Elle ne revient pas
--  sur la 002 — les politiques « for all » grandes ouvertes restent retirées,
--  et elle refuse de se déclarer faite si l'une d'elles est revenue. Et la 009
--  reste dans le dossier, telle quelle : c'est l'histoire, et elle a pu être
--  jouée.
--
--  ELLE EST IDEMPOTENTE : la rejouer ne casse rien et ne duplique rien.
--  Un niveau dont la table est absente est SIGNALÉ et sauté, jamais deviné.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  ÉTAT TROUVÉ — dans quel état était la base avant ce fichier
-- ---------------------------------------------------------------------------
--  La 009 a pu être collée ou non : la sortie le dit, plutôt que de laisser
--  le deviner. (Une base où la 009 n'a jamais été jouée et une base où ce
--  fichier l'a déjà été se ressemblent trait pour trait — c'est tout l'objet.)
do $$
begin
  raise notice '';
  raise notice '=== LE RETOUR DE LA LISTE DES PRÉNOMS ===';
  if to_regprocedure('public.cles_de_connexion(text, text)') is not null then
    raise notice '  état trouvé : la 009 avait été jouée (cles_de_connexion existe)';
  else
    raise notice '  état trouvé : pas de cles_de_connexion — la 009 n''a jamais été jouée, ou ce fichier l''a déjà été';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. La liste des prénoms se lit de nouveau sans être connecté
-- ---------------------------------------------------------------------------
do $$
declare
  el text;
  faits int := 0;
begin
  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    -- Un niveau absent du projet est SIGNALÉ et sauté, jamais deviné : les
    -- trois pages partagent un seul projet, mais rien ne garantit que les
    -- trois jeux de tables y soient.
    if to_regclass('public.' || el) is null then
      raise notice '  % : table absente, ignorée', el;
      continue;
    end if;

    -- Même nom qu'en 001 et en 009, « anon » de retour. REMPLACÉE, pas doublée.
    execute format('drop policy if exists p_%s_liste on public.%I', el, el);
    execute format('create policy p_%s_liste on public.%I for select to anon, authenticated using (true)', el, el);

    faits := faits + 1;
    raise notice '  % : liste lisible sans connexion', el;
  end loop;

  raise notice '% table(s) d''élèves rouverte(s) aux visiteurs.', faits;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Les deux fonctions de la 009 disparaissent
-- ---------------------------------------------------------------------------
--  Dans cet ordre : la fonction de connexion appelle la normalisation. Sans
--  « cascade » : si quelque chose d'autre s'appuyait sur l'une d'elles, le
--  fichier doit s'arrêter et le dire, pas l'emporter en silence.
drop function if exists public.cles_de_connexion(text, text);
drop function if exists public.normaliser_prenom(text);

-- ---------------------------------------------------------------------------
--  ÉCHEC BRUYANT SI UNE PIÈCE MANQUE
-- ---------------------------------------------------------------------------
--  Un fichier qui se termine sans rien dire laisse croire qu'il a travaillé.
--  Trois choses doivent être vraies à la fois ; chacune manquante est nommée.
do $$
declare
  el text;
  n int;
  noms text;
  p record;
  total int;
  vus int;
  ancien text;
begin
  -- 1. Une seule politique de lecture par table d'élèves — « for all » compte
  --    comme une lecture : c'est la forme des neuf politiques que la 002
  --    retire, et si l'une d'elles était revenue par la console, c'est elle
  --    qui déciderait de la liste, quoi que dise p_<table>_liste. Et cette
  --    politique laisse tout lire, au visiteur ET au compte connecté : sans
  --    anon, l'écran de connexion n'aurait plus de pastilles ; sans
  --    authenticated, le tableau du professeur ne nommerait plus ses élèves.
  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    if to_regclass('public.' || el) is null then continue; end if;
    select count(*),
           string_agg(policyname || ' pour ' || array_to_string(roles::text[], '+'), ', ' order by policyname)
      into n, noms
      from pg_policies
     where schemaname = 'public' and tablename = el and cmd in ('SELECT', 'ALL');
    if n <> 1 then
      raise exception '% : % politique(s) de lecture au lieu d''une seule (%) — jouez 002 si l''une d''elles n''est pas à vous',
        el, n, coalesce(noms, 'aucune');
    end if;
    select policyname, roles::text[] as roles, coalesce(qual, 'true') as qual, permissive
      into p
      from pg_policies
     where schemaname = 'public' and tablename = el and cmd in ('SELECT', 'ALL');
    if not (p.roles && array['anon', 'public']) then
      raise exception 'la liste des prénoms reste fermée aux visiteurs : %.% (pour %) — l''écran de connexion n''aurait plus de pastilles',
        el, p.policyname, array_to_string(p.roles, '+');
    end if;
    if not (p.roles && array['authenticated', 'public']) then
      raise exception '%.% (pour %) ne nomme plus authenticated : le tableau du professeur ne lirait plus sa classe',
        el, p.policyname, array_to_string(p.roles, '+');
    end if;
    if p.qual <> 'true' or p.permissive <> 'PERMISSIVE' then
      raise exception '%.% ne laisse pas lire toute la liste (%, using %)', el, p.policyname, p.permissive, p.qual;
    end if;
  end loop;

  -- 2. Les deux fonctions ont disparu.
  if to_regprocedure('public.cles_de_connexion(text, text)') is not null then
    raise exception 'public.cles_de_connexion(text, text) existe encore : les pages la lisent comme le signe d''une liste fermée exprès';
  end if;
  if to_regprocedure('public.normaliser_prenom(text)') is not null then
    raise exception 'public.normaliser_prenom(text) existe encore : plus rien ne l''appelle, et anon peut toujours l''exécuter';
  end if;

  -- 3. Et le visiteur LIT la liste : la politique ne suffit pas, l'effet se
  --    mesure. On prend le rôle anon et on lit ce que la page demande — id,
  --    prénom et clé — : un droit de colonne retiré, une politique
  --    restrictive posée à côté, une RLS forcée se verraient ici et nulle
  --    part ailleurs sur le projet réel. Le compte de référence est celui du
  --    rôle qui joue ce fichier (postgres dans l'éditeur SQL, propriétaire
  --    des tables, qui traverse la RLS). Une table vide se DÉCLARE ; un rôle
  --    qu'on ne peut pas prendre aussi — ni l'un ni l'autre ne passe au vert
  --    en silence.
  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    if to_regclass('public.' || el) is null then continue; end if;
    execute format('select count(*) from public.%I', el) into total;
    if total = 0 then
      raise notice '  % : table vide, effet non mesuré', el;
      continue;
    end if;
    -- Seule la PRISE DE RÔLE est protégée : un refus de lecture levé sous le
    -- rôle anon doit faire échouer ce fichier, pas se faire passer pour
    -- « impossible de prendre le rôle ». Le rôle d'avant est rendu tel
    -- quel — « reset role » rendrait le rôle de SESSION, qui n'est pas
    -- forcément celui en vigueur.
    ancien := current_user;
    begin
      set local role anon;
    exception when insufficient_privilege then
      raise notice '  % : impossible de prendre le rôle anon ici, effet non mesuré', el;
      continue;
    end;
    -- Ce gestionnaire-ci ne SAUTE rien : il relève l'erreur, avec son nom.
    -- Un « permission denied for table » nu, dans l'éditeur SQL, ne dirait
    -- pas que c'est la page qui ne pourrait plus lire ses pastilles.
    begin
      execute format('select count(*) from (select id, prenom, cle from public.%I) t', el) into vus;
    exception when insufficient_privilege then
      raise exception '% : un visiteur n''a pas le droit de lire id, prénom et clé (%) — la page ne pourrait pas afficher les pastilles : un droit de colonne retiré à anon ?',
        el, sqlerrm;
    end;
    execute format('set local role %I', ancien);
    if vus <> total then
      raise exception '% : un visiteur ne lit que % élève(s) sur % — la liste reste fermée ou filtrée : l''écran de connexion serait vide ou incomplet',
        el, vus, total;
    end if;
    raise notice '  % : un visiteur lit la liste entière (% élève(s), prénom et clé)', el, vus;
  end loop;

  raise notice 'La liste des prénoms se lit de nouveau sans connexion ; cles_de_connexion et normaliser_prenom ont disparu.';
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

-- ---------------------------------------------------------------------------
--  LE CACHE DE SCHÉMA DE POSTGREST
-- ---------------------------------------------------------------------------
--  PostgREST garde en cache la liste des fonctions appelables. Tant qu'il n'a
--  pas oublié cles_de_connexion, il tente encore de l'appeler, et PostgreSQL
--  répond « fonction inexistante » — une erreur qui n'est PAS « fonction
--  inconnue » (PGRST202) : la page d'hier dirait « Connexion impossible »
--  au lieu de se replier sur la liste, et la création de compte
--  « Vérification du prénom impossible ». Supabase recharge ce cache de
--  lui-même après chaque DDL, mais pas à la seconde ; cette ligne le lui
--  demande tout de suite. Si c'est ce que vous voyez dans la minute qui suit :
--  attendez, ne rejouez rien. Les pastilles, elles, ne passent pas par la
--  fonction et s'affichent dès la première seconde. Sans auditeur — sur le
--  PostgreSQL du banc — la ligne ne fait rien, et elle est idempotente.
notify pgrst, 'reload schema';
