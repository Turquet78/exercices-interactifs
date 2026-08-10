-- ============================================================================
--  CONTRÔLES DES POLITIQUES — ce que chaque rôle peut réellement faire
-- ============================================================================
--  Poser une politique ne prouve pas qu'elle protège. Ce fichier se met tour à
--  tour dans la peau d'un visiteur non connecté, de deux élèves et du
--  professeur, et vérifie ce que chacun obtient VRAIMENT de PostgreSQL.
--
--  Chaque contrôle qui échoue lève une exception : psql -v ON_ERROR_STOP=1
--  s'arrête alors, et le banc devient rouge.
--
--  « set role » est indispensable : le propriétaire d'une table et le
--  superutilisateur TRAVERSENT la RLS sans la voir. Un contrôle écrit sans lui
--  passerait au vert quelles que soient les politiques — y compris sans aucune.
-- ============================================================================

\set ON_ERROR_STOP on

-- --------------------------------------------------------------------------
-- Jeu d'essai, posé en superutilisateur
-- --------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@eleves.test'),
  ('22222222-2222-2222-2222-222222222222', 'b@eleves.test'),
  ('99999999-9999-9999-9999-999999999999', 'prof@test')
on conflict (id) do nothing;

insert into public.eleves_2nde (id, prenom, user_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alice', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Bob',   '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

insert into public.professeurs (user_id) values ('99999999-9999-9999-9999-999999999999')
on conflict do nothing;

insert into public.resultats_2nde (eleve_id, score, total, percent, duration_sec, details) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 8, 10, 80, 120, '{"test":"pourcentage"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 5, 10, 50, 200, '{"test":"pourcentage"}');

insert into public.parametres_2nde (id, valeurs) values (1, '{"devoirs":[]}')
on conflict (id) do nothing;

-- Le compteur sert de preuve de passage : le banc compare le nombre de lignes
-- « OK » qu'il a lues au total annoncé ici. Un fichier interrompu au milieu, ou
-- une sortie mal captée, se voit alors au lieu de passer pour un succès.
create temporary table if not exists pg_temp_compte (n int);
insert into pg_temp_compte values (0);

-- « security definer » n'est pas un détail : exige() est appelée APRÈS
-- « set local role anon », et le compteur appartient au superutilisateur.
-- Sans cela, le premier contrôle joué sous un autre rôle échoue sur un refus
-- de permission — et l'échec ressemble à une politique cassée.
create or replace function pg_temp.exige(intitule text, obtenu bool) returns void
language plpgsql
security definer
as $$
begin
  if obtenu then
    update pg_temp_compte set n = n + 1;
    raise notice '   OK  %', intitule;
  else
    raise exception 'ÉCHEC : %', intitule;
  end if;
end $$;

-- ==========================================================================
-- 1. UN VISITEUR NON CONNECTÉ (rôle anon)
-- ==========================================================================
do $$
declare n int; ok bool;
begin
  raise notice '';
  raise notice '1. VISITEUR NON CONNECTÉ';
  set local role anon;

  -- La liste des prénoms doit rester lisible : l'écran de connexion l'affiche
  -- avant toute authentification.
  select count(*) into n from public.eleves_2nde;
  perform pg_temp.exige('il voit la liste des prénoms (' || n || ')', n = 2);

  -- Il ne doit voir AUCUNE note. C'est la fuite principale d'avant.
  select count(*) into n from public.resultats_2nde;
  perform pg_temp.exige('il ne voit aucune note (' || n || ')', n = 0);

  -- Les devoirs et verrous doivent rester lisibles : l'accueil les consulte.
  select count(*) into n from public.parametres_2nde;
  perform pg_temp.exige('il lit les paramètres (devoirs, verrous)', n = 1);

  -- Il ne doit pouvoir écrire nulle part.
  begin
    insert into public.resultats_2nde (eleve_id, score, total)
      values ('aaaaaaaa-0000-0000-0000-000000000001', 10, 10);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  perform pg_temp.exige('il ne peut pas poser de note', ok);

  begin
    update public.parametres_2nde set valeurs = '{"pirate":true}' where id = 1;
    ok := not found;
  exception when insufficient_privilege then ok := true;
  end;
  perform pg_temp.exige('il ne peut pas modifier les devoirs', ok);

  begin
    delete from public.eleves_2nde where prenom = 'Alice';
    ok := not found;
  exception when insufficient_privilege then ok := true;
  end;
  perform pg_temp.exige('il ne peut pas supprimer un élève', ok);

  reset role;
end $$;

-- ==========================================================================
-- 2. UN ÉLÈVE CONNECTÉ (Alice)
-- ==========================================================================
do $$
declare n int; ok bool;
begin
  raise notice '';
  raise notice '2. ALICE, CONNECTÉE';
  set local role authenticated;
  set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

  select count(*) into n from public.resultats_2nde;
  perform pg_temp.exige('elle voit ses notes, et elles seules (' || n || ')', n = 1);

  select count(*) into n from public.resultats_2nde
    where eleve_id = 'bbbbbbbb-0000-0000-0000-000000000002';
  perform pg_temp.exige('elle ne voit pas les notes de Bob', n = 0);

  -- Elle enregistre sa propre note : c'est le cas normal, il doit marcher.
  insert into public.resultats_2nde (eleve_id, score, total, percent, duration_sec, details)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 9, 10, 90, 60, '{"test":"pourcentage"}');
  perform pg_temp.exige('elle enregistre sa propre note', true);

  -- Elle ne doit pas pouvoir en poser une sur le compte de Bob.
  begin
    insert into public.resultats_2nde (eleve_id, score, total)
      values ('bbbbbbbb-0000-0000-0000-000000000002', 0, 10);
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  perform pg_temp.exige('elle ne peut pas noter à la place de Bob', ok);

  -- Ni se déclarer professeur.
  begin
    insert into public.professeurs (user_id) values ('11111111-1111-1111-1111-111111111111');
    ok := false;
  exception when insufficient_privilege then ok := true;
  end;
  perform pg_temp.exige('elle ne peut pas se déclarer professeur', ok);

  -- Ni supprimer un camarade.
  begin
    delete from public.eleves_2nde where prenom = 'Bob';
    ok := not found;
  exception when insufficient_privilege then ok := true;
  end;
  perform pg_temp.exige('elle ne peut pas supprimer un camarade', ok);

  -- Ni verrouiller/déverrouiller les évaluations.
  begin
    update public.parametres_2nde set valeurs = '{"pirate":true}' where id = 1;
    ok := not found;
  exception when insufficient_privilege then ok := true;
  end;
  perform pg_temp.exige('elle ne peut pas toucher aux devoirs', ok);

  reset role;
end $$;

-- ==========================================================================
-- 3. LE PROFESSEUR
-- ==========================================================================
do $$
declare n int;
begin
  raise notice '';
  raise notice '3. LE PROFESSEUR';
  set local role authenticated;
  set local request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

  select count(*) into n from public.resultats_2nde;
  perform pg_temp.exige('il voit toutes les notes de la classe (' || n || ')', n = 3);

  update public.parametres_2nde set valeurs = '{"devoirs":[{"id":"dm1"}]}' where id = 1;
  perform pg_temp.exige('il modifie les devoirs', found);

  update public.eleves_2nde set prenom = 'Alice B.' where prenom = 'Alice';
  perform pg_temp.exige('il renomme un élève', found);

  delete from public.resultats_2nde where score = 5;
  perform pg_temp.exige('il supprime une note', found);

  reset role;
end $$;

-- ==========================================================================
-- 4. LA COLONNE « pin » A DISPARU PARTOUT
-- ==========================================================================
do $$
declare n int;
begin
  raise notice '';
  raise notice '4. LES CODES NE PEUVENT PLUS PARTIR EN CLAIR';
  select count(*) into n from information_schema.columns
    where table_schema = 'public' and column_name = 'pin';
  perform pg_temp.exige('aucune colonne pin ne subsiste (' || n || ')', n = 0);

  select count(*) into n from pg_class
    where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity;
  perform pg_temp.exige('aucune table publique sans RLS (' || n || ')', n = 0);
  raise notice '';
end $$;

-- --------------------------------------------------------------------------
-- Preuve de passage : le banc exige de retrouver exactement ce nombre.
-- --------------------------------------------------------------------------
do $$
declare n int;
begin
  select pg_temp_compte.n into n from pg_temp_compte;
  raise notice 'CONTROLES EXECUTES : %', n;
end $$;
