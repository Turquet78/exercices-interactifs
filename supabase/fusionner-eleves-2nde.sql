-- ============================================================================
--  FUSIONNER DEUX COMPTES D'UN MÊME ÉLÈVE (SECONDE)
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE. Il est IDEMPOTENT : le relancer,
--  une fois la fusion faite, ne trouve plus qu'un compte et ne touche à rien.
--
--  POURQUOI CE FICHIER EXISTE
--
--  Demande de Turquet (octobre 2026) : « en seconde regrouper les deux comptes
--  Clément en un seul compte au nom de "DELMONT Clément", en ne prenant que les
--  meilleures notes de chaque exercice s'ils concernent une fiche ou un DM ».
--  Un élève qui a créé un second compte travaille sous deux lignes : ses notes
--  de devoir sont coupées en deux, le carnet n'en voit que la moitié sur
--  chaque ligne, et la moyenne de chacune est fausse.
--
--  LES DEUX RÉGLAGES — les seules lignes à modifier pour une autre fusion
--
--    motif      : ce que les deux prénoms contiennent, sans accent ni
--                 majuscule (« clement » trouve « Clément », « CLEMENT D. »…).
--                 Il doit désigner EXACTEMENT deux comptes : sinon le fichier
--                 s'arrête en rouge en les nommant, et ne touche à rien.
--    nom_final  : le nom du compte qui reste.
--
--  QUEL COMPTE RESTE, et donc QUEL CODE marche encore
--
--  Celui qui porte déjà le nom final ; sinon celui qui est relié à un compte de
--  connexion ; sinon, et c'est le cas ordinaire, celui qui a travaillé le PLUS
--  RÉCEMMENT — c'est son code que l'élève a en tête. L'autre code cesse de
--  marcher. Si l'élève ne le retrouve pas, « Nouveau code » dans le tableau du
--  professeur lui en donne un, sans rien perdre.
--
--  CE QUE DEVIENNENT LES NOTES — la règle de la page, pas une autre
--
--   · DEVOIRS ET FICHES (details.dm) : pour chaque exercice d'un devoir, dans
--     chaque mode (soutien, entraînement), la page ne compte que la MEILLEURE
--     tentative — le plus haut pourcentage (dmMeilleur, dmBest). Le fichier ne
--     garde que celle-là, sur les deux comptes réunis ; à égalité, la plus
--     récente. Soutien et entraînement se gardent CHACUN, parce que la note de
--     l'exercice les compare (noteDevoirExo) : n'en garder qu'un changerait
--     la note. Le carnet affiche donc après la fusion exactement la note que
--     la page aurait calculée sur les deux comptes réunis.
--   · LES BROUILLONS DE PAUSE (details.state = 'paused') : ils ne sont pas des
--     notes terminées ; ils passent sur le compte gardé — sauf si ce compte a
--     déjà une pause pour le même exercice, le même mode et le même devoir :
--     deux pauses du même exercice se disputeraient la reprise, et la plus
--     ancienne s'écarte.
--   · TOUT LE RESTE (exercices faits hors devoir) : passe en entier sur le
--     compte gardé. La progression de l'élève prend déjà la meilleure note par
--     exercice ; son historique reste complet.
--   · LES NOTES POSÉES À LA MAIN par le professeur (devoirs[].notes et
--     fiches[].notes, clés « élève|exercice ») passent au compte gardé ; si
--     les deux comptes en ont une sur le même exercice, la plus haute reste.
--   · LES SIGNALEMENTS de l'élève passent au compte gardé.
--
--  RIEN N'EST PERDU. Chaque ligne écartée — notes de devoir moins bonnes,
--  pause en double, ligne du compte retiré — est d'abord COPIÉE, entière, dans
--  archives.fusion_eleves : un schéma que l'API ne publie pas, donc que ni les
--  élèves ni la page ne peuvent lire. Le dernier paragraphe dit comment les
--  relire ; on les remet à la main si besoin.
--
--  CE QUE L'ÉDITEUR SQL MONTRE. Une erreur s'affiche en rouge et ANNULE tout
--  le fichier (deux comptes introuvables, trois trouvés…) : rien n'a bougé.
--  Sinon, le tableau affiché est le DERNIER select : les notes de devoir et
--  de fiche du compte fusionné, exercice par exercice. Le compte rendu chiffré
--  part en NOTICE, que seul psql affiche (voir supabase/LISEZMOI.md).
--
--  RELIRE CE QUI A ÉTÉ ÉCARTÉ :
--    select le, motif, table_source, ligne->>'percent' as pct,
--           ligne->'details'->>'test' as exercice, ligne->'details'->>'dm' as dm
--      from archives.fusion_eleves order by le desc;
-- ============================================================================

create schema if not exists archives;
revoke all on schema archives from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema archives from anon, authenticated';
  end if;
end $$;
create table if not exists archives.fusion_eleves (
  id           bigserial primary key,
  le           timestamptz not null default now(),
  niveau       text not null,
  table_source text not null,
  motif        text not null,
  ligne        jsonb not null
);

do $$
declare
  motif     constant text := 'clement';           -- ← réglage 1
  nom_final constant text := 'DELMONT Clément';   -- ← réglage 2

  garde uuid; perdu uuid; uid_perdu uuid;
  n int; noms text;
  n_deplaces int; n_ecartes int; n_pauses int; n_sig int; n_notes int := 0;
  p record; fam text; arr jsonb; neuf jsonb;
begin
  raise notice '';
  raise notice '=== FUSION DE COMPTES — SECONDE — « % » ===', nom_final;

  /* Les candidats : sans accent ni majuscule, pour que « Clément » et
     « CLEMENT » se trouvent l'un l'autre. */
  create temporary table _cand on commit drop as
  select e.id, e.prenom, e.user_id, e.created_at,
         (select max(r.created_at) from public.resultats_2nde r where r.eleve_id = e.id) as dernier
    from public.eleves_2nde e
   where lower(translate(e.prenom, 'ÉÈÊËéèêëÀÂàâÎÏîïÔôÙÛÜùûüÇç', 'EEEEeeeeAAaaIIiiOoUUUuuuCc'))
         like '%' || motif || '%';

  select count(*), string_agg('« ' || prenom || ' »', ', ' order by prenom) into n, noms from _cand;

  if n = 1 and exists (select 1 from _cand where prenom = nom_final) then
    raise notice '  Un seul compte, déjà nommé « % » : la fusion est faite, rien à faire.', nom_final;
    return;
  end if;
  if n = 1 then
    update public.eleves_2nde set prenom = nom_final where id = (select id from _cand);
    raise notice '  Un seul compte (%) : renommé « % », rien à fusionner.', noms, nom_final;
    return;
  end if;
  if n <> 2 then
    raise exception 'FUSION ANNULÉE, RIEN N''A BOUGÉ : le motif « % » désigne % compte(s) au lieu de 2 : %. Préciser le motif en tête du fichier.',
      motif, n, coalesce(noms, 'aucun');
  end if;

  /* Le compte qui reste : déjà au bon nom, puis relié, puis le plus récent. */
  select id into garde from _cand
   order by (prenom = nom_final) desc, (user_id is not null) desc,
            coalesce(dernier, created_at) desc nulls last, created_at desc
   limit 1;
  select id, user_id into perdu, uid_perdu from _cand where id <> garde;
  raise notice '  Gardé  : « % »', (select prenom from _cand where id = garde);
  raise notice '  Retiré : « % »', (select prenom from _cand where id = perdu);

  /* -----------------------------------------------------------------------
     1. Devoirs et fiches : la meilleure tentative par exercice et par mode
     ----------------------------------------------------------------------- */
  create temporary table _dm on commit drop as
  select r.id, r.eleve_id,
         row_number() over (
           partition by r.details->>'dm', coalesce(r.details->>'test', 'derivees'),
                        coalesce(r.details->>'mode', 'eval')
           order by coalesce(r.percent, -1) desc, r.created_at desc, r.id) as rang
    from public.resultats_2nde r
   where r.eleve_id in (garde, perdu)
     and jsonb_typeof(r.details) = 'object'
     and jsonb_typeof(r.details->'dm') = 'string'
     and coalesce(r.details->>'state', '') <> 'paused';

  insert into archives.fusion_eleves (niveau, table_source, motif, ligne)
  select '2nde', 'resultats_2nde', 'note de devoir moins bonne', to_jsonb(r)
    from public.resultats_2nde r join _dm d on d.id = r.id where d.rang > 1;
  delete from public.resultats_2nde r using _dm d where d.id = r.id and d.rang > 1;
  get diagnostics n_ecartes = row_count;

  /* -----------------------------------------------------------------------
     2. Pauses : une seule par exercice, mode et devoir — la plus récente
     ----------------------------------------------------------------------- */
  create temporary table _pause on commit drop as
  select r.id,
         row_number() over (
           partition by coalesce(r.details->>'test', 'derivees'), coalesce(r.details->>'mode', 'eval'),
                        coalesce(r.details->>'dm', '')
           order by r.created_at desc, r.id) as rang
    from public.resultats_2nde r
   where r.eleve_id in (garde, perdu)
     and jsonb_typeof(r.details) = 'object'
     and r.details->>'state' = 'paused';

  insert into archives.fusion_eleves (niveau, table_source, motif, ligne)
  select '2nde', 'resultats_2nde', 'pause en double', to_jsonb(r)
    from public.resultats_2nde r join _pause p2 on p2.id = r.id where p2.rang > 1;
  delete from public.resultats_2nde r using _pause p2 where p2.id = r.id and p2.rang > 1;
  get diagnostics n_pauses = row_count;

  /* -----------------------------------------------------------------------
     3. Tout ce qui reste du compte retiré passe au compte gardé
     ----------------------------------------------------------------------- */
  update public.resultats_2nde set eleve_id = garde where eleve_id = perdu;
  get diagnostics n_deplaces = row_count;

  n_sig := 0;
  if to_regclass('public.signalements_2nde') is not null then
    update public.signalements_2nde set eleve_id = garde where eleve_id = perdu;
    get diagnostics n_sig = row_count;
  end if;

  /* -----------------------------------------------------------------------
     4. Les notes posées à la main : « perdu|exo » devient « garde|exo »,
        la plus haute l'emporte si les deux existent
     ----------------------------------------------------------------------- */
  for p in select id, valeurs from public.parametres_2nde
            where jsonb_typeof(valeurs) = 'object' loop
    neuf := p.valeurs;
    foreach fam in array array['devoirs', 'fiches'] loop
      arr := neuf->fam;
      if arr is null or jsonb_typeof(arr) <> 'array' then continue; end if;
      select coalesce(jsonb_agg(
               case when jsonb_typeof(d->'notes') = 'object' then
                 d || jsonb_build_object('notes', (
                   select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) from (
                     select distinct on (k) k, v from (
                       select case when key like perdu::text || '|%'
                                   then garde::text || substr(key, length(perdu::text) + 1)
                                   else key end as k, value as v
                         from jsonb_each(d->'notes')) t
                      order by k, (jsonb_typeof(v) = 'number') desc,
                               (case when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric end) desc nulls last) u))
               else d end
             order by i), '[]'::jsonb)
        into arr
        from jsonb_array_elements(neuf->fam) with ordinality as x(d, i);
      neuf := jsonb_set(neuf, array[fam], arr);
    end loop;
    if neuf is distinct from p.valeurs then
      update public.parametres_2nde set valeurs = neuf where id = p.id;
      n_notes := n_notes + 1;
    end if;
  end loop;

  /* -----------------------------------------------------------------------
     5. Le compte retiré s'en va (archivé), le compte gardé prend le nom
     ----------------------------------------------------------------------- */
  insert into archives.fusion_eleves (niveau, table_source, motif, ligne)
  select '2nde', 'eleves_2nde', 'compte retiré par fusion avec ' || garde::text, to_jsonb(e)
    from public.eleves_2nde e where e.id = perdu;
  /* Les lignes de résultats ont toutes été déplacées : la suppression en
     cascade n'emporte plus rien. On le VÉRIFIE plutôt que de le supposer. */
  if exists (select 1 from public.resultats_2nde where eleve_id = perdu) then
    raise exception 'FUSION ANNULÉE : des notes restent sur le compte retiré.';
  end if;
  delete from public.eleves_2nde where id = perdu;
  update public.eleves_2nde set prenom = nom_final where id = garde;

  /* Le compte de connexion du compte retiré : son code ne mène plus à rien.
     Le retirer, comme le fait « Retirer » dans le tableau du professeur ; s'il
     résiste (droits), il reste orphelin sans rien ouvrir, et on le dit. */
  if uid_perdu is not null then
    begin
      delete from auth.users where id = uid_perdu;
    exception when others then
      raise notice '  (le compte de connexion du compte retiré n''a pas pu être supprimé : %)', sqlerrm;
    end;
  end if;

  raise notice '';
  raise notice '  % note(s) de devoir moins bonne(s) écartée(s)', n_ecartes;
  raise notice '  % pause(s) en double écartée(s)', n_pauses;
  raise notice '  % ligne(s) de résultats passée(s) au compte gardé', n_deplaces;
  raise notice '  % signalement(s) passé(s) au compte gardé', n_sig;
  raise notice '  % réglage(s) de devoirs réécrit(s) pour les notes posées à la main', n_notes;
  raise notice '  Tout ce qui a été écarté est dans archives.fusion_eleves.';
  raise notice '';
end $$;

/* Ce que l'éditeur SQL affiche : les notes de devoir et de fiche du compte
   fusionné, une ligne par exercice et par mode. */
select e.prenom,
       coalesce(d.genre || ' n°' || d.num || ' « ' || d.titre || ' »', r.details->>'dm') as devoir,
       r.details->>'test' as exercice,
       r.details->>'mode' as mode,
       r.percent as pourcentage,
       case when r.details->>'state' = 'paused' then 'pause en cours' else 'terminé' end as etat
  from public.eleves_2nde e
  join public.resultats_2nde r on r.eleve_id = e.id
  left join lateral (
        select v->>'num' as num, v->>'titre' as titre, g.genre
          from public.parametres_2nde p,
               lateral (values ('fiches','fiche'),('devoirs','devoir')) as g(cle,genre),
               lateral jsonb_array_elements(coalesce(p.valeurs->g.cle,'[]'::jsonb)) v
         where v->>'id' = r.details->>'dm' limit 1) d on true
 where e.prenom = 'DELMONT Clément'          -- ← le même que nom_final
   and jsonb_typeof(r.details->'dm') = 'string'
 order by devoir, exercice, mode;
