-- ============================================================================
--  005 — Le professeur dépose des cours et des fiches en PDF
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LES MIGRATIONS 001 À 004.
--
--  POURQUOI CE FICHIER EXISTE
--
--  Le tableau de bord du professeur reçoit un onglet « Cours en PDF » : il y
--  dépose un fichier, l'élève le retrouve en haut de la page des exercices.
--  Le fichier lui-même ne peut pas vivre dans une table : il vit dans le
--  stockage de Supabase, qui a ses propres règles d'accès. Elles sont ici.
--
--  CE QU'ELLE POSE
--
--    · un bucket « cours », PRIVÉ — l'adresse d'un fichier public serait
--      devinable et indexable ; l'application demande une adresse signée à
--      chaque ouverture, valable une heure, et seul un compte connecté peut
--      l'obtenir ;
--    · une limite de 20 Mo et le seul type application/pdf, POSÉS SUR LE
--      BUCKET. La page vérifie déjà les deux, mais une vérification faite dans
--      le navigateur ne protège rien : elle se contourne en dix secondes. La
--      borne qui compte est celle-ci ;
--    · quatre politiques : lecture pour tout compte connecté, dépôt,
--      remplacement et suppression pour le seul professeur — la même fonction
--      est_prof() que partout ailleurs, posée par la migration 001.
--
--  CE QU'ELLE N'ACCORDE PAS
--
--  Un élève ne peut ni déposer, ni remplacer, ni supprimer. Un visiteur non
--  connecté ne voit rien du tout : le rôle anon n'est nommé nulle part.
--
--  UN AVERTISSEMENT QUI NE SE DEVINE PAS
--
--  npm run test:base ne rejoue PAS cette migration. Le banc lève un PostgreSQL
--  ordinaire, où le schéma « storage » n'existe pas : il est propre à Supabase.
--  Ce fichier est donc le seul endroit où ces règles sont écrites, et il n'a
--  pas de banc. À relire à l'œil, et à vérifier dans Supabase après l'avoir
--  joué — la requête de contrôle est à la fin.
--
--  ELLE EST IDEMPOTENTE : la rejouer ne casse rien et ne duplique rien.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ÉTAPE 1 — le bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cours', 'cours', false, 20971520, array['application/pdf'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = 20971520,
      allowed_mime_types = array['application/pdf'];

-- ---------------------------------------------------------------------------
-- ÉTAPE 2 — les politiques
-- ---------------------------------------------------------------------------
-- Elles portent le préfixe « p_ », comme toutes celles de ce projet : une
-- politique posée par quelqu'un d'autre ne sera jamais retirée par erreur.

drop policy if exists p_cours_lecture      on storage.objects;
drop policy if exists p_cours_depot        on storage.objects;
drop policy if exists p_cours_remplacement on storage.objects;
drop policy if exists p_cours_suppression  on storage.objects;

-- Lire : tout compte connecté — élèves compris. C'est ce qui permet à la page
-- de demander une adresse signée pour l'élève qui clique sur « Ouvrir le PDF ».
create policy p_cours_lecture on storage.objects
  for select to authenticated
  using (bucket_id = 'cours');

-- Déposer, remplacer, supprimer : le professeur, et lui seul.
create policy p_cours_depot on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cours' and public.est_prof());

create policy p_cours_remplacement on storage.objects
  for update to authenticated
  using      (bucket_id = 'cours' and public.est_prof())
  with check (bucket_id = 'cours' and public.est_prof());

create policy p_cours_suppression on storage.objects
  for delete to authenticated
  using (bucket_id = 'cours' and public.est_prof());

-- ---------------------------------------------------------------------------
-- ÉTAPE 3 — état obtenu, et échec bruyant si une pièce manque
-- ---------------------------------------------------------------------------
do $$
declare n_pol int; prive boolean;
begin
  select count(*) into n_pol from pg_policies
   where schemaname = 'storage' and tablename = 'objects' and policyname like 'p_cours_%';
  select not public into prive from storage.buckets where id = 'cours';

  if prive is null then
    raise exception 'Le bucket « cours » n''a pas été créé.';
  end if;
  if not prive then
    raise exception 'Le bucket « cours » est PUBLIC : les PDF seraient lisibles sans compte.';
  end if;
  if n_pol <> 4 then
    raise exception 'Il manque des politiques sur le bucket « cours » : % au lieu de 4', n_pol;
  end if;

  raise notice 'Bucket « cours » : privé, 4 politiques. Rien d''autre à faire.';
end $$;

-- À relire après coup, dans l'éditeur SQL :
--   select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'cours';
--   select policyname, cmd, roles from pg_policies
--    where schemaname = 'storage' and tablename = 'objects' and policyname like 'p_cours_%';
