-- ============================================================================
--  RÉPARER LES NOTES FAUSSÉES PAR LA COUPE DU NOMBRE DE QUESTIONS (SECONDE)
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE. Il est IDEMPOTENT : le relancer ne
--  trouve plus rien. Il ne BAISSE jamais une note, et il ne détruit rien —
--  l'ancien barème et l'ancien pourcentage sont CONSERVÉS dans la ligne, sous
--  details.correction_bareme (le dernier paragraphe dit comment revenir en
--  arrière).
--
--  POURQUOI CE FICHIER EXISTE
--
--  Signalé par Turquet (septembre 2026) : « dans la fiche 3 en Seconde, les
--  élèves ont 15/20 à l'exercice 1 alors que tout est bon ». Quand un devoir ou
--  une fiche règle le NOMBRE DE QUESTIONS d'un exercice, la coupe retirait des
--  questions sans toucher au barème, resté celui du tirage ENTIER : trois
--  questions posées sur quatre tirées, et une copie sans faute valait 3/4 —
--  75 %, donc 7,5/10, donc 15/20. La page est corrigée depuis (v128) ; les
--  notes DÉJÀ enregistrées, elles, portent encore le mauvais dénominateur.
--
--  SEULE LA SECONDE EST TOUCHÉE. Son finishTest note sur
--  « test.maxScore || test.questions.length » ; ceux de la Première et de la
--  Terminale notent sur le NOMBRE DE QUESTIONS et n'ont donc jamais mal noté.
--  Ce fichier ne regarde que resultats_2nde.
--
--  LA SEULE RÈGLE, ET ELLE SE PROUVE SUR LA LIGNE ELLE-MÊME
--
--  Une copie SANS FAUTE vaut 100 %. Le score n'additionne que des réponses
--  justes : sans aucune faute, il atteint EXACTEMENT le barème de la séance
--  réellement posée — quel que soit le poids des questions, sans qu'on ait à
--  connaître le réglage du devoir ni le tirage. Donc une copie sans faute dont
--  le pourcentage est inférieur à 100 % porte, par construction, un barème qui
--  n'est pas celui de sa séance : le score EST le barème juste.
--    total := score, percent := 100.
--  Le détecteur et la réparation sont la même chose, et c'est ce qui rend le
--  geste sûr : aucune ligne n'est corrigée sans que son propre contenu ne
--  démontre qu'elle est fausse.
--
--  CE QUE CE FICHIER REFUSE DE FAIRE
--
--  Une copie qui a des FAUTES est elle aussi sous-notée, et pourtant elle
--  n'est pas réparée. Son barème juste n'est écrit nulle part : il faudrait le
--  déduire de celui d'un camarade, ce qui suppose que les questions pèsent
--  toutes le même poids (faux pour plusieurs exercices : une équation vaut 5
--  cases quand une inéquation en vaut 17) ET que la séance de ce camarade ait
--  été coupée de la même façon — deux choses que la ligne ne dit pas. Un
--  pourcentage remonté à tort serait invisible et définitif, là où une note
--  laissée trop basse se voit et se rattrape : l'élève REFAIT l'exercice, la
--  meilleure note l'emporte, et le carnet se corrige de lui-même.
--  Ces copies sont donc LISTÉES à la fin, devoir par devoir, sans être
--  touchées — et la liste distingue celles dont le devoir porte par ailleurs
--  une copie réparée : là, la coupe a bien eu lieu, et elles sont
--  probablement sous-notées elles aussi.
--
--  CE QU'IL NE TOUCHE PAS
--   · les brouillons de pause (details.state = 'paused') ;
--   · les notes PARTIELLES (details.partiel), écrites sur un exercice
--     interrompu : leur pourcentage est bas parce que l'élève n'a pas fini, et
--     une copie « sans faute jusqu'ici » n'est pas une copie à 100 % ;
--   · les notes hors devoir (sans details.dm) : la coupe ne s'applique qu'aux
--     exercices lancés depuis un devoir ou une fiche ;
--
--  L'IDEMPOTENCE NE TIENT À AUCUN GARDE-FOU, et c'est le détecteur qui la
--  donne : une ligne réparée porte total = score, donc « total > score » est
--  faux et elle ne peut plus être reprise. Un « ignorer les lignes déjà
--  réparées » avait d'abord été écrit ici ; le sabotage l'a montré INERTE — le
--  retirer ne changeait rien — et un garde-fou qui n'écarte jamais rien fait
--  croire qu'on vérifie quelque chose. C'est le banc qui EXIGE la propriété.
--   · la Première et la Terminale, indemnes.
--
--  REVENIR EN ARRIÈRE, si besoin :
--    update public.resultats_2nde
--       set total   = (details->'correction_bareme'->>'total_avant')::int,
--           percent = (details->'correction_bareme'->>'percent_avant')::numeric,
--           details = details - 'correction_bareme'
--     where details ? 'correction_bareme';
-- ============================================================================

do $$
declare
  n_vues int; n_faites int := 0; n_reste int := 0; n_deja int;
  ligne record;
begin
  raise notice '';
  raise notice '=== NOTES FAUSSÉES PAR LA COUPE — SECONDE ===';

  if to_regclass('public.resultats_2nde') is null then
    raise notice '  resultats_2nde : table absente du projet — rien à faire.';
    return;
  end if;

  /* Les lignes EXPLOITABLES : une note de devoir TERMINÉE, dont on sait lire
     les fautes. Tout le reste est écarté — le rapport final le dit. */
  create temporary table _lignes on commit drop as
  select r.id, r.score, r.total, r.percent,
         r.details->>'test' as ex,
         r.details->>'dm'   as dm,
         jsonb_array_length(r.details->'misses') as fautes
    from public.resultats_2nde r
   where jsonb_typeof(r.details) = 'object'
     and r.details ? 'dm'
     and coalesce(r.details->>'state','') <> 'paused'
     and coalesce((r.details->>'partiel')::boolean, false) = false
     and jsonb_typeof(r.details->'misses') = 'array'
     and r.score is not null and r.total is not null
     and r.score >= 0 and r.total > 0
     and r.score = trunc(r.score);                 /* le barème est un entier */

  select count(*) into n_vues from _lignes;
  select count(*) into n_deja from public.resultats_2nde where details ? 'correction_bareme';
  raise notice '  % note(s) de devoir exploitables, % déjà réparée(s)', n_vues, n_deja;

  /* -----------------------------------------------------------------------
     LA RÈGLE : une copie sans faute vaut 100 %
     ----------------------------------------------------------------------- */
  with cible as (
    select l.id, l.score, l.total, l.percent from _lignes l
     where l.fautes = 0 and l.score > 0 and l.total > l.score
  )
  update public.resultats_2nde r
     set total   = c.score::int,
         percent = 100,
         details = r.details || jsonb_build_object('correction_bareme',
                     jsonb_build_object('total_avant', c.total, 'percent_avant', c.percent,
                                        'le', to_char(now(),'YYYY-MM-DD"T"HH24:MI:SSOF'),
                                        'motif', 'copie sans faute : le score EST le barème'))
    from cible c where r.id = c.id;
  get diagnostics n_faites = row_count;

  raise notice '';
  raise notice '  RÉPARÉES : % copie(s) sans faute remise(s) à 100 %%', n_faites;

  /* -----------------------------------------------------------------------
     Le détail, devoir par devoir — avec le titre que le professeur connaît
     ----------------------------------------------------------------------- */
  if n_faites > 0 then
    for ligne in
      select coalesce(d.genre,'note') as genre, coalesce(d.num,'?') as num,
             coalesce(d.titre,c.dm) as titre, c.ex, count(*) as n,
             min(c.pa) as pmin, max(c.pa) as pmax
        from public.resultats_2nde r
        cross join lateral (select r.details->>'test' as ex, r.details->>'dm' as dm,
                                   (r.details->'correction_bareme'->>'percent_avant')::numeric as pa) c
        left join lateral (
              select v->>'num' as num, v->>'titre' as titre, g.genre
                from public.parametres_2nde p,
                     lateral (values ('fiches','fiche'),('devoirs','devoir')) as g(cle,genre),
                     lateral jsonb_array_elements(coalesce(p.valeurs->g.cle,'[]'::jsonb)) v
               where v->>'id' = c.dm limit 1) d on true
       where r.details ? 'correction_bareme'
       group by 1,2,3,4 order by 1,2,4
    loop
      raise notice '   · % n°% « % » — % : % note(s), % %% → 100 %%',
        ligne.genre, ligne.num, ligne.titre, ligne.ex, ligne.n,
        (case when ligne.pmin = ligne.pmax then ligne.pmin::text
              else ligne.pmin::text || '-' || ligne.pmax::text end);
    end loop;
  end if;

  /* -----------------------------------------------------------------------
     Les copies AVEC faute : nommées, jamais devinées
     ----------------------------------------------------------------------- */
  create temporary table _reste on commit drop as
  select l.ex, l.dm, count(*) as n,
         exists (select 1 from public.resultats_2nde r2
                  where r2.details ? 'correction_bareme'
                    and r2.details->>'test' = l.ex and r2.details->>'dm' = l.dm) as coupe_avérée
    from _lignes l
   where l.fautes > 0 and l.total > l.score
   group by l.ex, l.dm;

  select coalesce(sum(n),0) into n_reste from _reste where coupe_avérée;
  if n_reste > 0 then
    raise notice '';
    raise notice '  NON RÉPARÉES : % copie(s) AVEC FAUTE, dans un devoir où la coupe', n_reste;
    raise notice '  a bien eu lieu — donc probablement sous-notées elles aussi. Leur';
    raise notice '  barème juste n''est écrit nulle part : le deviner ferait courir le';
    raise notice '  risque de remonter une note à tort, ce qu''on ne saurait plus voir.';
    for ligne in select * from _reste where coupe_avérée order by ex loop
      raise notice '   · % (devoir %) : % note(s)', ligne.ex, ligne.dm, ligne.n;
    end loop;
    raise notice '';
    raise notice '  Pour celles-là : faire REFAIRE l''exercice — la meilleure note';
    raise notice '  l''emporte, et le carnet se corrige de lui-même.';
  end if;

  raise notice '';
  raise notice '  Aucune note n''a été baissée : la règle ne peut que remonter un';
  raise notice '  pourcentage, le barème corrigé étant toujours plus petit.';
  raise notice '';
end $$;
