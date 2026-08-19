-- ============================================================================
--  006 — Les cours en PDF deviennent lisibles par le portail
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 005.
--
--  POURQUOI CE FICHIER EXISTE
--
--  La migration 005 avait fait le bucket PRIVÉ : les PDF n'étaient lisibles
--  que par un compte connecté, et l'application affichait alors le cours à
--  l'élève après l'avoir authentifié.
--
--  Ce n'est plus là qu'ils s'affichent. Les cours vivent désormais sur le
--  portail (turquet-math974.netlify.app), dans « Cours et exercices », à côté
--  des fiches déjà publiées. Or ce site n'a AUCUN élève connecté : il ne peut
--  donc pas demander d'adresse signée. Un bucket privé y afficherait des
--  cartes qui n'ouvrent rien.
--
--  CE QUE ÇA CHANGE, DIT FRANCHEMENT
--
--  Les PDF de cours deviennent téléchargeables par toute personne qui connaît
--  leur adresse — sans compte, sans mot de passe. C'est EXACTEMENT le statut
--  des fiches que le portail publie déjà (elles sont dans un dépôt GitHub
--  public). Ce sont des documents de cours, pas des données d'élèves : aucun
--  prénom, aucune note ne passe par ce bucket.
--
--  CE QUE ÇA NE CHANGE PAS
--
--  Déposer, remplacer et supprimer restent réservés au professeur : les
--  politiques de la migration 005 ne sont pas touchées. Public veut dire
--  « lisible », jamais « modifiable ».
--
--  ELLE EST IDEMPOTENTE, et se termine par une vérification qui échoue
--  bruyamment si le bucket manque ou si l'écriture s'est ouverte.
-- ============================================================================

update storage.buckets
   set public             = true,
       file_size_limit    = 20971520,
       allowed_mime_types = array['application/pdf']
 where id = 'cours';

do $$
declare ouvert boolean; n_ecriture int;
begin
  select public into ouvert from storage.buckets where id = 'cours';
  if ouvert is null then
    raise exception 'Le bucket « cours » n''existe pas : jouez d''abord la migration 005.';
  end if;
  if not ouvert then
    raise exception 'Le bucket « cours » est resté privé : le portail ne pourra pas afficher les PDF.';
  end if;

  -- L'écriture doit rester réservée au professeur : une politique d'insertion,
  -- de modification ou de suppression ouverte à « anon » serait une porte.
  select count(*) into n_ecriture from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and cmd in ('INSERT','UPDATE','DELETE')
     and 'anon' = any(roles);
  if n_ecriture > 0 then
    raise exception 'Une politique d''écriture est ouverte aux visiteurs : % politique(s)', n_ecriture;
  end if;

  raise notice 'Bucket « cours » : lisible par tous, écriture réservée au professeur.';
end $$;

select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'cours';
