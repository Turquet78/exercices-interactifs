-- ============================================================================
--  007 — L'élève peut joindre une copie d'écran à son signalement
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 006.
--
--  ⚠️  ELLE SE JOUE AVANT LA MISE EN LIGNE, PAS APRÈS.
--
--  C'est la leçon de la 003, et elle a coûté une panne : la page envoie la
--  capture puis écrit la colonne « capture ». Si la migration n'est pas encore
--  passée, l'élève reçoit une erreur au moment où il essaie d'aider. Jouez ce
--  fichier d'abord ; la page qui ne le connaît pas encore n'en souffre pas —
--  une colonne en trop et un bucket inutilisé ne gênent personne.
--
--  CE QU'ELLE FAIT
--
--  1. une colonne « capture » sur les trois tables de signalements : le CHEMIN
--     du fichier dans le stockage, jamais l'image elle-même. Une image en
--     base64 dans une colonne ferait grossir la table de centaines de kilo-
--     octets par ligne, et la sauvegarde nocturne avec elle ;
--  2. un bucket « signalements », PRIVÉ.
--
--  POURQUOI PRIVÉ, ALORS QUE « cours » EST PUBLIC
--
--  Ce n'est pas la même chose. Un cours en PDF est un document destiné à être
--  lu ; une capture d'écran est l'écran d'un élève MINEUR, avec son prénom
--  affiché dessus, ses réponses, sa note. Public voudrait dire lisible par
--  quiconque devine l'adresse. Le professeur, lui, est connecté : il demande
--  une adresse signée, valable une heure. C'est tout ce qu'il faut.
--
--  QUI PEUT QUOI
--
--  · l'élève DÉPOSE dans son propre dossier — le premier segment du chemin est
--    son identifiant d'élève, et la politique le vérifie contre son compte. Il
--    ne peut pas déposer chez un autre, et il ne peut RIEN LIRE, pas même ce
--    qu'il vient d'envoyer : rien dans la page n'en a besoin, et le droit qu'on
--    ne donne pas est celui qu'on n'a pas à surveiller ;
--  · le professeur LIT et SUPPRIME, et lui seul ;
--  · personne ne remplace : une capture est une pièce, pas un brouillon.
--
--  UN AVERTISSEMENT QUI NE SE DEVINE PAS
--
--  npm run test:base ne rejoue PAS la partie « storage » de cette migration :
--  le banc lève un PostgreSQL ordinaire, où ce schéma n'existe pas — il est
--  propre à Supabase. La colonne « capture », elle, est du SQL ordinaire et le
--  banc la voit. Les politiques du bucket sont à relire à l'œil, et la requête
--  de contrôle est à la fin.
--
--  ELLE EST IDEMPOTENTE : la rejouer ne casse rien et ne duplique rien.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ÉTAPE 1 — la colonne, sur les trois tables qui existent
-- ---------------------------------------------------------------------------
-- Écrite en boucle comme la 003 : un niveau dont la table n'existe pas encore
-- est SIGNALÉ et sauté, jamais deviné.
do $$
declare si text;
begin
  foreach si in array array['signalements', 'signalements_1ere', 'signalements_2nde'] loop
    if to_regclass('public.' || si) is null then
      raise notice '  % : table absente, ignorée', si;
      continue;
    end if;
    execute format('alter table public.%I add column if not exists capture text', si);
    raise notice '  % : colonne « capture » en place', si;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- ÉTAPE 2 — le bucket, privé
-- ---------------------------------------------------------------------------
-- 3 Mo : la page réduit l'image avant l'envoi (1600 px de large, JPEG), ce qui
-- donne 150 à 400 Ko. La borne du bucket est le dernier rempart, pas le
-- premier — elle est là pour le jour où la réduction échouerait.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signalements', 'signalements', false, 3145728,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = 3145728,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ---------------------------------------------------------------------------
-- ÉTAPE 3 — les politiques
-- ---------------------------------------------------------------------------
-- Préfixe « p_ », comme toutes celles du projet : une politique posée par
-- quelqu'un d'autre ne sera jamais retirée par erreur.

drop policy if exists p_signalements_depot       on storage.objects;
drop policy if exists p_signalements_lecture     on storage.objects;
drop policy if exists p_signalements_suppression on storage.objects;

-- Déposer : un élève connecté, DANS SON DOSSIER. Le premier segment du chemin
-- (storage.foldername(name))[1] est son identifiant d'élève ; on vérifie qu'il
-- désigne bien un élève dont le compte est celui qui écrit. Le professeur peut
-- déposer aussi — il rejoue les écrans, et un contrôle du banc a besoin d'un
-- chemin d'écriture qui ne soit pas celui d'un élève.
create policy p_signalements_depot on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'signalements'
    and (
      public.est_prof()
      or exists (
        select 1 from public.eleves e
         where e.user_id = auth.uid()
           and e.id::text = (storage.foldername(name))[1]
      )
      or exists (
        select 1 from public.eleves_1ere e
         where e.user_id = auth.uid()
           and e.id::text = (storage.foldername(name))[1]
      )
      or exists (
        select 1 from public.eleves_2nde e
         where e.user_id = auth.uid()
           and e.id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Lire : le professeur, et lui seul. L'élève ne relit pas sa capture — la page
-- ne le lui propose pas, et le droit qu'on ne donne pas ne se surveille pas.
create policy p_signalements_lecture on storage.objects
  for select to authenticated
  using (bucket_id = 'signalements' and public.est_prof());

-- Supprimer : le professeur. Elle part avec le signalement qu'elle illustre.
create policy p_signalements_suppression on storage.objects
  for delete to authenticated
  using (bucket_id = 'signalements' and public.est_prof());

-- Aucune politique d'UPDATE, volontairement : une capture est une pièce
-- déposée, pas un brouillon qu'on retouche. Sans politique, personne ne peut
-- la remplacer — pas même son auteur.

-- ---------------------------------------------------------------------------
-- ÉTAPE 4 — état obtenu, et échec bruyant si une pièce manque
-- ---------------------------------------------------------------------------
do $$
declare n_pol int; prive boolean; n_col int;
begin
  select count(*) into n_col
    from information_schema.columns
   where table_schema = 'public'
     and table_name in ('signalements', 'signalements_1ere', 'signalements_2nde')
     and column_name = 'capture';

  select count(*) into n_pol from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname like 'p_signalements_%';

  select not public into prive from storage.buckets where id = 'signalements';

  if prive is null then
    raise exception 'Le bucket « signalements » n''a pas été créé.';
  end if;
  if not prive then
    raise exception 'Le bucket « signalements » est PUBLIC : les écrans des élèves seraient lisibles sans compte.';
  end if;
  if n_pol <> 3 then
    raise exception 'Il manque des politiques sur le bucket « signalements » : % au lieu de 3', n_pol;
  end if;
  if n_col = 0 then
    raise exception 'Aucune table de signalements n''a reçu la colonne « capture ».';
  end if;

  raise notice 'Bucket « signalements » : privé, 3 politiques, % table(s) avec la colonne « capture ».', n_col;
  raise notice 'La page peut être mise en ligne.';
end $$;

-- À relire après coup, dans l'éditeur SQL :
--   select id, public, file_size_limit, allowed_mime_types
--     from storage.buckets where id = 'signalements';
--   select policyname, cmd, roles from pg_policies
--    where schemaname = 'storage' and tablename = 'objects'
--      and policyname like 'p_signalements_%';
