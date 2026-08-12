-- ============================================================================
--  RESTAURER — remettre dans la base les lignes d'une sauvegarde
-- ============================================================================
--  À jouer dans l'éditeur SQL de Supabase, APRÈS 001 et 002, sur une base
--  dont les tables existent mais sont vides.
--
--  Ce fichier ne restaure rien à lui seul : il pose un outil, `restaurer`, qui
--  avale le tableau JSON d'une table et le remet en place. On l'appelle ensuite
--  une fois par table :
--
--      select public.restaurer('eleves_1ere', $j$   [ … ]   $j$::json);
--      select public.restaurer('resultats_1ere', $j$ [ … ] $j$::json);
--
--  Le tableau se copie depuis la sauvegarde déchiffrée. La marche à suivre
--  complète — décrypter, copier, ordre des tables — est dans LISEZMOI.md.
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
--  Cet outil est fait pour un jour de sinistre, pas pour vivre dans la base :
--  la dernière ligne de la marche à suivre le supprime.
-- ============================================================================

create or replace function public.restaurer(nom text, lignes json)
returns text
language plpgsql
as $$
declare
  sans_compte jsonb;
  posees      bigint;
  sequence    text;
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

  -- « on conflict do nothing » rend la restauration rejouable : si la copie a
  -- été coupée en deux, on rejoue tout sans dupliquer ce qui est déjà passé.
  execute format(
    'insert into public.%I select * from json_populate_recordset(null::public.%I, $1) '
    'on conflict do nothing', nom, nom)
    using sans_compte::json;
  get diagnostics posees = row_count;

  -- Piège 2 — replacer la séquence des identifiants entiers.
  sequence := pg_get_serial_sequence('public.' || quote_ident(nom), 'id');
  if sequence is not null then
    execute format(
      'select setval(%L, coalesce((select max(id) from public.%I), 0) + 1, false)',
      sequence, nom);
  end if;

  return nom || ' : ' || posees || ' ligne(s) restaurée(s)'
       || case when sequence is null then '' else ', séquence replacée' end;
end;
$$;

-- Cet outil écrit dans les tables. Personne d'autre que le propriétaire du
-- projet n'a de raison de l'appeler : PostgreSQL ouvre l'exécution des
-- fonctions à tous par défaut, on la referme ici.
revoke execute on function public.restaurer(text, json) from public;
