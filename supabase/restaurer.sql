-- ============================================================================
--  COMPARER ET RESTAURER — confronter la base à une sauvegarde, et corriger
-- ============================================================================
--  À jouer dans l'éditeur SQL de Supabase. Ce fichier ne change rien par
--  lui-même : il pose trois outils. Le tableau JSON qu'ils avalent se copie
--  depuis la sauvegarde déchiffrée ; la marche à suivre complète est dans
--  LISEZMOI.md.
--
--  LE CAS COURANT — une note paraît fausse ou a disparu, la base est vivante :
--
--      select * from public.comparer('resultats_1ere', $j$ [ … ] $j$::json);
--      select public.restaurer('resultats_1ere', $j$ [ … ] $j$::json);
--      select public.restaurer('resultats_1ere', $j$ [ … ] $j$::json, true);
--
--  Le premier ne modifie rien : il dit ce qui manque, ce qui diffère, ce qui a
--  été ajouté depuis. Le deuxième remet les notes PERDUES et ne touche à rien
--  d'autre. Le troisième remet aussi les notes MODIFIÉES à leur valeur d'alors
--  — c'est le seul qui efface quelque chose, d'où le mot en plus.
--
--  Comparer d'abord. Une note « différente » est le plus souvent une note
--  refaite depuis, pas une note falsifiée : la sauvegarde date d'un dimanche.
--
--  LE CAS RARE — tout est perdu, on repart d'une base vide :
--
--      select public.restaurer('eleves_1ere', $j$   [ … ] $j$::json);
--      select public.restaurer('resultats_1ere', $j$ [ … ] $j$::json);
--
--  TROIS PIÈGES QUE CET OUTIL DÉSAMORCE, et qu'un simple « insert » laisse
--  passer :
--
--  1. `user_id` ne se restaure pas. Après un sinistre, les comptes Supabase
--     n'existent plus : la colonne pointe vers des comptes disparus et la clé
--     étrangère vers auth.users refuse la ligne. L'outil la retire. Les élèves
--     reviennent donc sans compte — c'est voulu : « Nouveau code » leur en
--     recrée un au premier code donné.
--
--  2. Les identifiants de la Première sont des `bigint` produits par une
--     séquence. Réinsérer les lignes avec leurs identifiants d'origine ne fait
--     pas avancer cette séquence : elle repart de 1, et le PREMIER élève ajouté
--     après la restauration se heurte à un identifiant déjà pris. La panne
--     n'arrive pas pendant la restauration — tout paraît réussi — mais le
--     lendemain. L'outil replace la séquence après chaque table.
--
--  3. L'ordre compte. Les notes désignent un élève : `eleves…` avant
--     `resultats…`, sans quoi la clé étrangère refuse tout. L'outil ne devine
--     pas l'ordre, mais l'erreur est franche et immédiate.
--
--  Ces outils ne sont pas faits pour vivre dans la base. Une fois le travail
--  terminé, les retirer — la marche à suivre finit par là.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  COMPARER — ce que dit la sauvegarde, ce que dit la base, et ce qui diffère
-- ----------------------------------------------------------------------------
--  Ne modifie RIEN. C'est le premier geste, et souvent le seul nécessaire :
--
--      select * from public.comparer('resultats_1ere', $j$ [ … ] $j$::json);
--
--  Trois verdicts par ligne :
--    MANQUANTE   la sauvegarde l'a, la base ne l'a plus  → note perdue
--    DIFFÉRENTE  les deux l'ont, avec des valeurs qui ne correspondent pas
--    EN TROP     la base l'a, la sauvegarde ne l'a pas   → note passée après
--
--  « EN TROP » est le verdict normal pour tout ce qui a été fait depuis la
--  sauvegarde : la plupart du temps il ne signale rien d'anormal.
-- ----------------------------------------------------------------------------

/* Une note à 8 et une note à 8.0 sont la même note ; « 2026-06-03T08:00:00+00:00 »
   et « 2026-06-03T10:00:00+02:00 » sont le même instant. Sans cette fonction,
   la comparaison signalerait des dizaines d'écarts qui n'en sont pas — et un
   outil qui crie tout le temps ne sert plus à rien le jour où il a raison. */
create or replace function public.memes_valeurs(a jsonb, b jsonb)
returns boolean
language plpgsql
immutable
as $$
begin
  if a is not distinct from b then return true; end if;
  if a is null or b is null then return false; end if;
  if jsonb_typeof(a) = 'number' and jsonb_typeof(b) = 'number' then
    return (a #>> '{}')::numeric = (b #>> '{}')::numeric;
  end if;
  if jsonb_typeof(a) = 'string' and jsonb_typeof(b) = 'string' then
    begin
      return (a #>> '{}')::timestamptz = (b #>> '{}')::timestamptz;
    exception when others then
      return false;
    end;
  end if;
  return false;
end;
$$;

create or replace function public.comparer(nom text, lignes json)
returns setof text
language plpgsql
as $$
declare
  ligne   jsonb;
  en_base jsonb;
  colonne text;
  va      jsonb;
  vb      jsonb;
  ecarts  text;
  vus     text[] := '{}';
  present int;
  eleves  text;
  n_ok    int := 0;
  n_diff  int := 0;
  n_manq  int := 0;
  n_trop  int := 0;
begin
  if to_regclass('public.' || quote_ident(nom)) is null then
    raise exception 'la table « % » n''existe pas', nom;
  end if;
  if jsonb_typeof(lignes::jsonb) <> 'array' then
    lignes := jsonb_build_array(lignes::jsonb)::json;
  end if;

  eleves := case nom
    when 'resultats'      then 'eleves'
    when 'resultats_1ere' then 'eleves_1ere'
    when 'resultats_2nde' then 'eleves_2nde'
    else null end;

  for ligne in select * from jsonb_array_elements(lignes::jsonb) loop
    vus := vus || (ligne ->> 'id');
    execute format('select to_jsonb(t) from public.%I t where t.id::text = $1', nom)
      into en_base using ligne ->> 'id';

    if en_base is null then
      n_manq := n_manq + 1;
      /* Une note ne peut revenir que si son élève est encore là. Le dire
         maintenant, pas au moment où la remise en place échouera. */
      if eleves is not null then
        execute format('select 1 from public.%I e where e.id::text = $1', eleves)
          into present using ligne ->> 'eleve_id';
        if present is null then
          return next 'MANQUANTE  id=' || (ligne ->> 'id')
            || ' — et son élève (' || coalesce(ligne ->> 'eleve_id', '?')
            || ') n''est plus dans la base : la note ne pourra pas revenir sans lui';
          continue;
        end if;
      end if;
      return next 'MANQUANTE  id=' || (ligne ->> 'id') || ' — perdue par la base';
      continue;
    end if;

    ecarts := null;
    for colonne in select jsonb_object_keys(ligne) loop
      if colonne = 'user_id' then continue; end if;
      va := ligne -> colonne;
      vb := en_base -> colonne;
      if not public.memes_valeurs(va, vb) then
        ecarts := coalesce(ecarts || ', ', '') || colonne
               || ' : base=' || coalesce(vb::text, 'null')
               || ' sauvegarde=' || coalesce(va::text, 'null');
      end if;
    end loop;

    if ecarts is null then
      n_ok := n_ok + 1;
    else
      n_diff := n_diff + 1;
      return next 'DIFFÉRENTE id=' || (ligne ->> 'id') || ' — ' || ecarts;
    end if;
  end loop;

  for colonne in execute format('select t.id::text from public.%I t order by 1', nom) loop
    if not (colonne = any(vus)) then
      n_trop := n_trop + 1;
      return next 'EN TROP    id=' || colonne || ' — ajoutée depuis la sauvegarde';
    end if;
  end loop;

  return next '— ' || n_ok || ' identique(s), ' || n_diff || ' différente(s), '
           || n_manq || ' manquante(s), ' || n_trop || ' en trop';
end;
$$;

-- ----------------------------------------------------------------------------
--  RESTAURER — remettre les lignes en place
-- ----------------------------------------------------------------------------

/* La version à deux arguments a existé. La laisser vivre à côté de celle-ci
   rendrait tout appel à deux arguments ambigu — PostgreSQL ne saurait pas
   laquelle choisir, et refuserait. */
drop function if exists public.restaurer(text, json);

create or replace function public.restaurer(nom text, lignes json, ecraser boolean default false)
returns text
language plpgsql
as $$
declare
  sans_compte jsonb;
  posees      bigint;
  sequence    text;
  colonnes    text;
  conflit     text;
begin
  if nom = 'professeurs' then
    raise exception 'la table « professeurs » ne se restaure pas ainsi : sa clé '
                    'primaire est le compte Supabase du professeur, qui vient '
                    'd''être recréé et porte donc un autre identifiant. '
                    'Réinsérez-la à la main avec le nouvel identifiant.';
  end if;

  if to_regclass('public.' || quote_ident(nom)) is null then
    raise exception 'la table « % » n''existe pas : jouez 001 puis 002 d''abord', nom;
  end if;

  -- Une table qui ne contient qu'UNE ligne arrive comme un objet, pas comme un
  -- tableau : Windows PowerShell 5.1 — celui qu'ont les machines de bureau —
  -- déballe les tableaux d'un seul élément, et son ConvertTo-Json n'a pas
  -- l'option qui l'en empêche. Plutôt qu'exiger une version de PowerShell, on
  -- accepte les deux formes.
  if jsonb_typeof(lignes::jsonb) <> 'array' then
    lignes := jsonb_build_array(lignes::jsonb)::json;
  end if;

  -- Piège 1 — les comptes d'avant le sinistre n'existent plus.
  select coalesce(jsonb_agg(ligne - 'user_id'), '[]'::jsonb)
    into sans_compte
    from jsonb_array_elements(lignes::jsonb) as ligne;

  /* DEUX GESTES, PAS UN.

     Sans « ecraser » : les lignes déjà présentes sont laissées telles quelles.
     C'est ce qu'il faut pour remettre des notes PERDUES sur une base vivante —
     rien de ce qui a été fait depuis n'est touché. C'est aussi ce qui rend la
     restauration rejouable quand une copie a été coupée en deux.

     Avec « ecraser » : les lignes présentes reprennent les valeurs de la
     sauvegarde. C'est ce qu'il faut pour défaire une note FALSIFIÉE — et c'est
     précisément pour cela que ce n'est pas le comportement par défaut : le
     travail fait depuis la sauvegarde serait effacé sans un mot. Comparer
     d'abord, écraser ensuite. */
  if ecraser then
    select string_agg(format('%I = excluded.%I', column_name, column_name), ', ')
      into colonnes
      from information_schema.columns
     where table_schema = 'public' and table_name = nom
       and column_name not in ('id', 'user_id');
    conflit := 'on conflict (id) do update set ' || colonnes;
  else
    conflit := 'on conflict do nothing';
  end if;

  execute format(
    'insert into public.%I select * from json_populate_recordset(null::public.%I, $1) %s',
    nom, nom, conflit)
    using sans_compte::json;
  get diagnostics posees = row_count;

  -- Piège 2 — replacer la séquence des identifiants entiers.
  sequence := pg_get_serial_sequence('public.' || quote_ident(nom), 'id');
  if sequence is not null then
    execute format(
      'select setval(%L, coalesce((select max(id) from public.%I), 0) + 1, false)',
      sequence, nom);
  end if;

  return nom || ' : ' || posees || ' ligne(s) '
       || case when ecraser then 'remises à la valeur de la sauvegarde' else 'remises en place' end
       || case when sequence is null then '' else ', séquence replacée' end;
end;
$$;

-- Ces outils écrivent dans les tables, ou lisent tout leur contenu. Personne
-- d'autre que le propriétaire du projet n'a de raison de les appeler :
-- PostgreSQL ouvre l'exécution des fonctions à tous par défaut, on la referme.
revoke execute on function public.restaurer(text, json, boolean) from public;
revoke execute on function public.comparer(text, json) from public;
revoke execute on function public.memes_valeurs(jsonb, jsonb) from public;
