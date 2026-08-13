-- ============================================================================
--  003 — Les signalements des élèves
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LES MIGRATIONS 001 ET 002.
--
--  POURQUOI CE FICHIER EXISTE
--
--  Trois pannes sont passées en production sans qu'aucun contrôle ne rougisse,
--  et aucune n'a été apprise par la page : elles se sont vues en classe, ou pas
--  du tout. Un élève qui bloque le soir sur un exercice cassé n'avait aucun
--  moyen de le dire, et « ça marchait pas », le lendemain, ne se débogue pas.
--
--  Une table par niveau reçoit donc ce que l'élève signale — et surtout
--  l'ÉTAT EXACT de l'exercice au moment du problème, dans « contexte » :
--  la question telle qu'elle a été tirée, et ce qui était saisi dans chaque
--  case. C'est le même instantané que la mise en pause, si bien que le
--  professeur peut rouvrir l'écran à l'identique au lieu de deviner.
--
--  LE TYPE DE « eleve_id » N'EST PAS ÉCRIT ICI, IL EST RECOPIÉ.
--  eleves.id et eleves_2nde.id sont des uuid, eleves_1ere.id est un bigint :
--  une colonne écrite en dur marcherait sur deux niveaux et casserait le
--  troisième. Le type est donc lu sur « resultats….eleve_id », qui est déjà
--  juste pour chaque niveau, et recopié tel quel.
--
--  Il est IDEMPOTENT : le relancer ne fait plus rien.
-- ============================================================================

do $$
declare
  niveaux text[][] := array[
    array['signalements',      'resultats',      'eleves'],
    array['signalements_1ere', 'resultats_1ere', 'eleves_1ere'],
    array['signalements_2nde', 'resultats_2nde', 'eleves_2nde']
  ];
  n text[];
  si text; re text; el text;
  type_id text;
  crees int := 0;
begin
  raise notice '';
  raise notice '=== TABLES DE SIGNALEMENTS ===';

  foreach n slice 1 in array niveaux loop
    si := n[1]; re := n[2]; el := n[3];

    -- Un niveau absent du projet est passé sans bruit : les trois pages
    -- partagent un seul projet Supabase, mais rien ne garantit que les trois
    -- jeux de tables y soient.
    if to_regclass('public.' || el) is null then
      raise notice '  % : table des élèves absente, ignorée', si;
      continue;
    end if;

    -- le type exact de eleve_id, recopié de la table des résultats du niveau
    select format_type(a.atttypid, a.atttypmod) into type_id
    from pg_attribute a
    where a.attrelid = to_regclass('public.' || re)
      and a.attname = 'eleve_id'
      and a.attnum > 0 and not a.attisdropped;

    if type_id is null then
      raise notice '  % : eleve_id introuvable sur %, ignorée', si, re;
      continue;
    end if;

    execute format($f$
      create table if not exists public.%I (
        id          uuid primary key default gen_random_uuid(),
        created_at  timestamptz not null default now(),
        eleve_id    %s not null references public.%I(id) on delete cascade,
        exercice    text not null,
        numero      text,
        mode        text,
        message     text not null,
        contexte    jsonb,
        version     integer,
        navigateur  text,
        lu          boolean not null default false
      )$f$, si, type_id, el);

    execute format('create index if not exists %I on public.%I (lu, created_at desc)',
                   'idx_' || si || '_non_lus', si);

    execute format('alter table public.%I enable row level security', si);

    -- LES DROITS DE TABLE, EXPLICITEMENT. Une politique RLS ne donne aucun
    -- droit : elle filtre les lignes une fois le droit accordé. Les tables
    -- existantes du projet tiennent les leurs d'un « grant … on all tables »
    -- passé une fois, qui ne concerne que les tables présentes ce jour-là :
    -- une table créée ensuite naît sans aucun droit, et l'élève se heurte à
    -- « permission denied » alors que sa politique est juste. Le banc l'a
    -- montré avant que ça n'arrive en production.
    -- Rien pour « anon » : un visiteur non connecté n'a rien à faire ici, et
    -- l'arrêter au niveau du droit de table plutôt qu'à la politique est une
    -- barrière de plus.
    execute format('grant insert, select, update, delete on public.%I to authenticated', si);

    -- L'élève ne signale que sous son propre nom. Sans ce contrôle, n'importe
    -- qui pourrait déposer un signalement au nom d'un autre.
    execute format('drop policy if exists p_%s_ecriture on public.%I', si, si);
    execute format($f$create policy p_%s_ecriture on public.%I for insert to authenticated
      with check (exists (select 1 from public.%I e where e.id = eleve_id and e.user_id = auth.uid()))$f$, si, si, el);

    -- SEUL LE PROFESSEUR LIT. Un signalement porte le prénom d'un élève et un
    -- texte libre qu'il a tapé : il n'a rien à faire sous les yeux des autres,
    -- et l'auteur n'a pas besoin de le relire. La page insère donc sans jamais
    -- demander la ligne en retour.
    execute format('drop policy if exists p_%s_lecture on public.%I', si, si);
    execute format('create policy p_%s_lecture on public.%I for select to authenticated using (public.est_prof())', si, si);

    -- marquer « lu », et faire le ménage : le professeur, et lui seul.
    execute format('drop policy if exists p_%s_prof_modif on public.%I', si, si);
    execute format('create policy p_%s_prof_modif on public.%I for update to authenticated using (public.est_prof()) with check (public.est_prof())', si, si);

    execute format('drop policy if exists p_%s_prof_suppr on public.%I', si, si);
    execute format('create policy p_%s_prof_suppr on public.%I for delete to authenticated using (public.est_prof())', si, si);

    crees := crees + 1;
    raise notice '  % : prête (eleve_id %)', si, type_id;
  end loop;

  raise notice '';
  raise notice '% table(s) de signalements en place.', crees;
end $$;

-- ---------------------------------------------------------------------------
--  ÉTAT OBTENU — à lire dans la sortie de l'éditeur SQL
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
