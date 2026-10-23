-- ============================================================================
--  RENOMMER LES ÉLÈVES DE SECONDE « NOM Prénom », D'APRÈS LA LISTE DE LA CLASSE
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE. Il est IDEMPOTENT : le relancer ne
--  trouve plus que des comptes « déjà au bon nom » et ne touche à rien.
--
--  POURQUOI CE FICHIER EXISTE
--
--  Demande de Turquet (octobre 2026) : « en seconde change le nom des élèves
--  sur leur compte, si celui de l'image ne correspond pas au compte du site.
--  Tu mettras le nom et le prénom exactement comme sur l'image, en respectant
--  les majuscules et les accents, au lieu du prénom seul. Si aucun prénom ne
--  correspond, ne rien faire. » La liste ci-dessous est celle de l'image,
--  recopiée telle quelle.
--
--  QUEL COMPTE EST RECONNU — sans accent, sans majuscule, tiret = espace
--
--  Un compte répond à une ligne de la liste si son nom actuel est :
--    · le prénom seul                      « Lina », « lina », « Jahinna » ;
--    · le prénom suivi de l'initiale du nom « Manon C », « Manon C. » ;
--    · le nom et le prénom, dans un ordre   « marmasse lina », « Lina Marmasse ».
--
--  CE QUI NE BOUGE PAS, et le tableau final le dit ligne par ligne
--
--    · une ligne de la liste qu'aucun compte ne reconnaît : rien à faire ;
--    · un compte que PLUSIEURS lignes reconnaissent — « Manon » seul, pour
--      CHECCHI Manon et GESTIN Manon — ou une ligne que PLUSIEURS comptes
--      reconnaissent (deux comptes pour un même élève) : le fichier ne choisit
--      pas au hasard, il laisse les comptes tels quels et les dit « ambigus ».
--      On les renomme alors à la main depuis la liste du professeur (bouton du
--      prénom), ou on fusionne les deux comptes (fusionner-eleves-2nde.sql).
--      Seule exception : « Manon G. » ne désigne que GESTIN Manon, et
--      l'emporte sur un « Manon » seul, qui reste tel quel ;
--    · un nom final déjà porté par un AUTRE compte (à la casse près) : deux
--      élèves ne se distingueraient plus sur l'écran de connexion — la page
--      refuse ce doublon, ce fichier aussi ;
--    · les comptes qui ne répondent à aucune ligne : intacts.
--
--  LES COMPTES DÉSIGNÉS À LA MAIN (table _designes) : après un premier passage,
--  Turquet a dit lui-même qui était qui — « Manon » seul est CHECCHI Manon,
--  « Iness » est VALGRESY Ines. Ces comptes-là ne passent plus par le
--  rapprochement automatique. Les deux comptes de Salomé se fusionnent AVANT,
--  avec fusionner-eleves-2nde.sql (motif « salome », « QUERE Salomé »).
--
--  RIEN D'AUTRE NE CHANGE : le code et la connexion de l'élève dépendent de
--  `cle`, jamais du prénom ; ses notes le désignent par `eleve_id` et suivent
--  le nouveau nom d'elles-mêmes (voir « Renommer un élève » dans
--  docs/journal/01-infrastructure-supabase.md).
--
--  CE QUE L'ÉDITEUR SQL MONTRE : le DERNIER select — une ligne par élève de
--  la liste, puis une par compte que la liste n'a pas reconnu, avec ce qui a
--  été fait. Le tout est une seule transaction : une erreur n'a rien changé.
-- ============================================================================

create or replace function pg_temp.norm(t text) returns text language sql immutable as $$
  select btrim(regexp_replace(
           lower(translate(coalesce(t, ''),
             'ÉÈÊËéèêëÀÂÄàâäÎÏîïÔÖôöÙÛÜùûüÇçŸÿ-.',
             'EEEEeeeeAAAaaaIIiiOOooUUUuuuCcYy  ')),
           '\s+', ' ', 'g'))
$$;

drop table if exists _liste;
create temporary table _liste (nom text not null, prenom text not null);
insert into _liste (nom, prenom) values      -- ← la liste de la classe
  ('AHMED', 'Inaya'),
  ('AKHOUN', 'Mouhammad'),
  ('ALAMELOU', 'Malya'),
  ('AMBOUDI', 'Maéva'),
  ('AZER', 'Céleste'),
  ('BACARI', 'Wandji'),
  ('BODZEN-PAYET', 'Nayana'),
  ('BROCARD', 'Léo'),
  ('CHECCHI', 'Manon'),
  ('CLAIN', 'Morgane'),
  ('DALLEAU', 'Camille'),
  ('DAREL', 'Sohan'),
  ('DAVERY', 'Roan-Lewis'),
  ('DE QUEIROZ', 'Enzo'),
  ('DELEFLIE', 'Adam'),
  ('DELMONT', 'Clément'),
  ('DEWAELE', 'Matis'),
  ('DIJOUX', 'Jahînna'),
  ('DINDAR', 'Dylan'),
  ('FATIMA', 'Anna'),
  ('GESTIN', 'Manon'),
  ('HOAREAU', 'Shalya'),
  ('LAO-YEC', 'Jérémy'),
  ('LEDOYEN', 'Tiffany'),
  ('MALHERBE-ESPERANCE', 'Lucas'),
  ('MARMASSE', 'Lina'),
  ('MATHIOT', 'Basil'),
  ('NODODUS', 'Norah'),
  ('OBERLE', 'Lison'),
  ('QUERE', 'Salomé'),
  ('RASAMIMANANA', 'Stephen'),
  ('SAUTRON', 'Hadel'),
  ('TIRANO', 'Cécile'),
  ('VALGRESY', 'Ines');

/* Les noms de compte que Turquet a désignés lui-même, après un premier
   passage : ils l'emportent sur le rapprochement automatique. « Manon » seul,
   ambigu entre deux élèves, est CHECCHI Manon ; « Iness » est Ines. */
drop table if exists _designes;
create temporary table _designes (compte text not null, nom text not null, prenom text not null);
insert into _designes (compte, nom, prenom) values      -- ← désignés à la main
  ('Manon', 'CHECCHI', 'Manon'),
  ('Iness', 'VALGRESY', 'Ines');

/* Chaque rapprochement possible entre une ligne de la liste et un compte :
   celui que Turquet a désigné, sinon celui que le nom reconnaît. */
drop table if exists _paires;
create temporary table _paires as
select d.nom, d.prenom, d.nom || ' ' || d.prenom as cible, e.id, e.prenom as actuel
  from _designes d
  join public.eleves_2nde e on pg_temp.norm(e.prenom) = pg_temp.norm(d.compte)
union all
select l.nom, l.prenom, l.nom || ' ' || l.prenom as cible, e.id, e.prenom as actuel
  from _liste l
  join public.eleves_2nde e
    on pg_temp.norm(e.prenom) in (
         pg_temp.norm(l.prenom),
         pg_temp.norm(l.prenom || ' ' || left(l.nom, 1)),
         pg_temp.norm(l.nom || ' ' || l.prenom),
         pg_temp.norm(l.prenom || ' ' || l.nom))
 where not exists (select 1 from _designes d where pg_temp.norm(d.compte) = pg_temp.norm(e.prenom));

/* Combien de lignes de la liste chaque compte reconnaît : « Manon » seul en
   reconnaît deux, et ne désigne donc personne. */
alter table _paires add column n_lignes int;
update _paires p set n_lignes = (select count(*) from _paires q where q.id = p.id);

/* Le sort de chaque ligne de la liste. Un compte ambigu s'efface devant un
   compte qui ne désigne qu'elle (« Manon G. » l'emporte sur « Manon » pour
   GESTIN Manon) ; sans un tel compte, la ligne se dit ambiguë. */
drop table if exists _sort;
create temporary table _sort as
select l.nom || ' ' || l.prenom as cible,
       p.id, p.actuel,
       case
         when p.id is null then 'aucun compte ne correspond : rien fait'
         when p.n_lignes > 1
           then 'ambigu, ce compte répond à plusieurs élèves : rien fait'
         when (select count(*) from _paires q where q.cible = p.cible and q.n_lignes = 1) > 1
           then 'ambigu, plusieurs comptes : rien fait'
         when p.actuel = p.cible then 'déjà au bon nom'
         when exists (select 1 from public.eleves_2nde e
                       where e.id <> p.id and lower(e.prenom) = lower(p.cible))
           then 'nom déjà porté par un autre compte : rien fait'
         else 'renommé'
       end as fait
  from _liste l
  left join _paires p on p.cible = l.nom || ' ' || l.prenom
 where p.id is null or p.n_lignes = 1
    or not exists (select 1 from _paires q where q.cible = p.cible and q.n_lignes = 1);

update public.eleves_2nde e
   set prenom = s.cible
  from _sort s
 where s.fait = 'renommé' and e.id = s.id;

select s.cible as "élève de la liste",
       coalesce(s.actuel, '—') as "compte trouvé",
       s.fait as "ce qui a été fait"
  from _sort s
union all
select '—', e.prenom, 'compte absent de la liste : intact'
  from public.eleves_2nde e
 where not exists (select 1 from _paires p where p.id = e.id)
order by 3 desc, 1, 2;
