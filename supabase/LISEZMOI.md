# Mettre la connexion côté serveur — mode d'emploi

Ce dossier contient tout ce qui doit être appliqué **dans Supabase**. Rien ici
ne part sur GitHub Pages : ce sont les pièces que le site ne peut pas installer
lui-même.

---

## La bascule est faite

**Terminée le 11 août 2026**, et éprouvée de bout en bout sur le projet réel :
création de compte, connexion, exercice mené jusqu'à la note, tableau de bord
du professeur, et « Nouveau code ». Les six étapes ci-dessous sont conservées
comme référence — pour comprendre ce qui a été fait, pour remonter une base
neuve, ou pour reprendre après un incident.

> Si la même bascule devait se refaire avec des élèves en service, elle ne
> pourrait pas être progressive : SQL appliqué sans le nouveau code, ou
> l'inverse, et plus personne ne se connecte. Il faudrait enchaîner les deux
> dans la même demi-heure, un soir ou pendant des vacances.

---

## Ce que montre l'éditeur SQL de Supabase — et ce qu'il ne montre pas

Constaté le 14 octobre 2026, en jouant la 010 : l'éditeur SQL du tableau de
bord ne répond que **« Success. No rows returned »**, ou l'erreur en rouge.
Trois règles en découlent, et elles valent pour chaque fichier de ce dossier :

- **Les lignes `NOTICE` ne s'affichent jamais.** Tout ce qu'un fichier
  « annonce », « nomme » ou « liste » par `raise notice` — un état avant, un
  bilan, une liste d'élèves — reste invisible. Seul `psql` les montre : c'est
  ce que lit le banc (`npm run test:base`), et c'est de lui que parlent les
  commentaires des fichiers quand ils disent « à lire dans la sortie ».
- **Seul le résultat de la DERNIÈRE requête s'affiche.** Deux `select` collés
  ensemble ne montrent que le tableau du second : une requête de lecture se
  colle **seule**.
- **Une erreur s'affiche en rouge, et annule tout le fichier.** Les migrations
  se contrôlent elles-mêmes par des erreurs (`raise exception`) : pour elles,
  « Success » veut dire que leurs contrôles sont passés. Mais ce qu'un fichier
  se contente de **déclarer** par une `NOTICE` — une table absente sautée, une
  mesure qu'il n'a pas pu faire — passe en silence, et « Success » ne le
  distingue pas.

Là où un compte rendu compte vraiment, la section donne la **requête de
lecture** qui le montre : un `select` qui ne modifie rien, à coller seul,
avant ou après le fichier.

---

## 1. Régler l'authentification (2 min)

Dans Supabase → **Authentication → Sign In / Providers → Email** :

- **Confirm email** : à **désactiver**.
  Les élèves n'ont pas d'adresse — leur compte utilise une adresse technique en
  `.invalid`, un domaine que l'IETF réserve pour ne jamais exister. Aucun
  courriel ne part, donc aucune confirmation ne peut arriver. Si cette option
  reste active, la création de compte échoue et le site affiche exactement
  ceci : *« À régler dans Supabase : désactiver la confirmation par courriel »*.
- **Allow new users to sign up** : à **laisser activé** si vous voulez que les
  élèves créent eux-mêmes leur compte. Sinon, désactivez-le et créez-les depuis
  l'onglet Élèves du tableau de bord.

> C'est le seul réglage que le banc de contrôle **ne peut pas** vérifier : il ne
> vit pas dans le schéma de la base. À contrôler à l'œil.

---

## 2. Créer votre compte de professeur (3 min)

Dans **Authentication → Users → Add user → Create new user** :

- **adresse** : exactement `professeur@exercices-interactifs.invalid`.
  C'est celle qu'attend le code (`COURRIEL_PROF`, ligne 10 des trois fichiers).
  En la reprenant telle quelle, aucun fichier n'est à modifier — et votre vraie
  adresse ne se retrouve pas dans un dépôt public ;
- **mot de passe** : un vrai mot de passe, pas `2709`. Il n'est plus dans la
  page, donc plus rien ne vous oblige à le garder court ;
- cochez **Auto Confirm User**.

Notez l'**UUID** du compte créé : il sert à l'étape 4.

---

## 2 bis. Entrer dans le tableau de bord (à mettre en favori)

Depuis août 2026, **le bouton « Je suis le professeur » n'existe plus** : la
page s'ouvre directement sur la connexion des élèves.

**Un seul favori suffit** — la page `prof.html` rassemble les trois niveaux :

```
https://turquet78.github.io/exercices-interactifs/prof.html
```

Elle demande le mot de passe, puis aiguille : trois boutons vers les trois
tableaux de bord. Elle ne contient aucun secret — c'est Supabase qui vérifie le
mot de passe, comme sur les trois pages — et le seul lien qui y ramène est le
« Quitter » d'un tableau de bord, jamais une page d'élève : un contrôle du banc
l'exige sur les trois fichiers.

Les adresses directes restent valables, si vous préférez un favori par niveau :

```
…/secondes.html#prof
…/premiere-specifique.html#prof
…/terminale.html#prof
```

Le fragment reste dans l'adresse : recharger la page rouvre l'écran de
connexion. Sur une page déjà ouverte, ajouter `#prof` dans la barre d'adresse
fonctionne aussi — sans quoi le navigateur ne rechargerait rien pour un simple
fragment.

**Il n'y a pas d'identifiant à saisir, seulement un mot de passe** : celui du
compte `professeur@exercices-interactifs.invalid` (étape 2), présenté à
Supabase par la page elle-même. Il est le même pour les trois niveaux.

Les deux refus possibles ne disent pas la même chose, et c'est ce qui fait
gagner du temps :

- *« Mot de passe incorrect »* — Supabase a refusé le mot de passe ;
- *« Ce compte n'est pas celui du professeur »* — le mot de passe était bon,
  mais l'UUID du compte ne figure pas dans la table `professeurs` : c'est
  l'étape 4 qui manque.

> **Rien de tout cela n'est une protection.** Le mot de passe du compte
> Supabase reste le seul verrou, et l'adresse peut traîner dans l'historique
> d'un ordinateur de la classe. Ce que cela retire, c'est l'invitation : aucun
> élève ne voit la porte, donc aucun ne s'amuse à y frapper.

---

## 3. Jouer la migration (5 min)

Dans **SQL Editor**, coller **`migrations/001_comptes_et_verrouillage.sql`** en
entier, et exécuter.

Elle commence par décrire l'état actuel de vos neuf tables — RLS active ou
non, politiques déjà en place — mais en lignes `NOTICE`, que l'éditeur
n'affiche pas. Cet état se lit **avant** de la coller, par une requête qui ne
touche à rien, collée seule :

```sql
select c.relname as "table", c.relrowsecurity as rls,
       count(p.policyname) as politiques,
       coalesce(string_agg(p.policyname, ', '), '—') as noms
from pg_class c
left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('eleves','eleves_1ere','eleves_2nde',
                    'resultats','resultats_1ere','resultats_2nde',
                    'parametres','parametres_1ere','parametres_2nde')
group by c.relname, c.relrowsecurity
order by c.relname;
```

**Lisez ces lignes** — une table absente n'y figure pas. Si des politiques à
vous y figurent, elles ne seront pas touchées : la migration ne pose et ne
retire que les siennes, préfixées `p_`.

Ce qu'elle fait ensuite :

- ajoute une colonne `user_id` à chaque table d'élèves ;
- **supprime la colonne `pin`** — c'est elle qui partait en clair dans chaque
  navigateur ;
- active la RLS sur les neuf tables et pose 30 politiques.

Elle se termine par un contrôle qui **échoue bruyamment** — en rouge, tout
annulé — si une table est restée sans RLS ou si une colonne `pin` subsiste :
« Success » veut dire qu'il est passé. L'état obtenu, elle le décrit aussi en
`NOTICE` ; pour le voir, relancez seule la requête ci-dessus — `rls` à `true`
sur chaque ligne.

Elle est **idempotente** : la relancer ne casse rien.

> Ne jamais exécuter `000_socle_de_controle.sql` sur le projet : il recrée le
> schéma `auth` et les rôles, que Supabase fournit déjà. Il n'existe que pour le
> banc de contrôle hors ligne.

---

## 3 bis. Retirer les politiques grandes ouvertes (2 min) — INDISPENSABLE

**Sans cette étape, la migration 001 ne protège rien.**

Le projet portait neuf politiques de cette forme, une par table :

```sql
create policy "acces classe - eleves" on public.eleves for all
  to anon using (true) with check (true);
```

`using (true)` veut dire : tout le monde, tout le temps, tout. Et PostgreSQL
combine les politiques permissives par un **OU** — il suffit qu'une seule
autorise pour que l'accès passe. Ces neuf-là annulent donc les trente que 001
vient de poser.

001 ne les touche pas volontairement : elle ne défait jamais ce qu'elle n'a pas
fait. C'est à `002_retirer_politiques_ouvertes.sql` de le faire, explicitement.

Collez **`migrations/002_retirer_politiques_ouvertes.sql`** dans l'éditeur SQL
et exécutez-le. Il retire les politiques grandes ouvertes, laisse en place tout
ce qui ne l'est pas manifestement, et **échoue** — en rouge, tout annulé — s'il
en subsiste une. Il nomme aussi chaque politique retirée ou laissée, mais en
`NOTICE`, invisibles dans l'éditeur : les retirées ne se relisent plus dans la
base ; les laissées, si — ce sont les lignes de la requête ci-dessous.

Pour vérifier :

```sql
select tablename, policyname from pg_policies
where schemaname='public' and policyname not like 'p\_%'
  and tablename in ('eleves','eleves_1ere','eleves_2nde',
                    'resultats','resultats_1ere','resultats_2nde',
                    'parametres','parametres_1ere','parametres_2nde');
```

→ **zéro ligne**.

> `npm run test:base` le démontre plutôt que de l'affirmer : joué après 001
> seule, le banc des rôles **doit échouer**. S'il passait, c'est qu'il ne
> mesurerait pas ce qu'il croit mesurer.

## 3 ter. Les signalements des élèves (1 min)

Collez **`migrations/003_signalements.sql`** dans l'éditeur SQL et exécutez-le.
Il crée une table par niveau — `signalements`, `signalements_1ere`,
`signalements_2nde` — pose leurs règles d'accès et leurs droits.

**À jouer AVANT de mettre en ligne la version qui porte le bouton.** Sans cette
étape, l'élève qui clique sur « Signaler un problème » reçoit une erreur : la
page marche, mais le bouton ne mène nulle part.

Ce que ces règles disent :

- l'élève **écrit** un signalement, sous son propre nom et sous aucun autre ;
- l'élève ne **lit** rien — pas même le sien. Un signalement porte le prénom
  d'un mineur et un texte libre qu'il a tapé ; il n'a rien à faire sous les yeux
  des autres, et son auteur n'a pas besoin de le relire ;
- le professeur lit tout, marque « lu », supprime.

Le type de `eleve_id` n'est pas écrit en dur : il est **recopié** de
`resultats….eleve_id`, parce que `eleves.id` et `eleves_2nde.id` sont des `uuid`
alors que `eleves_1ere.id` est un `bigint`. Une colonne écrite en dur aurait
marché sur deux niveaux et cassé le troisième — c'est déjà arrivé sur la
création de compte.

Pour vérifier :

```sql
select tablename, policyname, cmd from pg_policies
where schemaname='public' and tablename like 'signalements%'
order by tablename, policyname;
```

→ **quatre politiques par table** : écriture élève, lecture professeur,
modification professeur, suppression professeur.

> `npm run test:base` joue la migration sur un PostgreSQL jetable, vérifie le
> type de `eleve_id` table par table, puis met le banc dans la peau d'Alice et
> du professeur. Il éprouve aussi la fuite : rendre les signalements lisibles
> par toute la classe **doit** le faire rougir.

## 3 quater. La pause de l'élève (1 min)

Collez **`migrations/004_pause_de_l_eleve.sql`** dans l'éditeur SQL et
exécutez-le.

**À jouer AVANT de mettre en ligne la version qui porte la relecture.** Sans
cette étape, l'élève qui abandonne un exercice verra désormais un message rouge
« Abandon non enregistré — l'exercice reste en pause » : il dira la vérité, mais
l'abandon ne marchera toujours pas.

### Ce qui n'allait pas

La mise en pause fait **trois** gestes dans la table des résultats : insérer la
ligne « en pause », la faire avancer à chaque réponse, puis la supprimer quand
le test se termine ou que l'élève abandonne. La migration 001 n'avait donné que
le premier — il n'existait ni politique d'`update` ni politique de `delete` pour
l'élève, seulement pour le professeur.

Et les deux gestes manquants étaient refusés **sans erreur** : sous RLS, une
ligne qu'on n'a pas le droit de toucher est une ligne qui n'existe pas.
PostgREST répond « 0 ligne », ce qui n'est pas un refus. D'où trois
conséquences, toutes silencieuses et toutes en production :

- le brouillon n'avançait jamais : « tu t'es arrêté à la question 2 » restait
  figé sur la première réponse enregistrée ;
- il n'était **jamais** supprimé, ni à la fin d'un test ni à l'abandon.
  L'exercice restait donc proposé « à reprendre » indéfiniment, pendant que la
  page annonçait « Exercice abandonné ✓ » ;
- chaque tentative laissait une ligne fantôme de plus dans la table.

### Ce que la migration n'accorde pas

Le droit est volontairement étroit : il ne porte que sur les lignes dont
`details->>'state'` vaut `paused`, et seulement celles de l'élève lui-même.

- une **note obtenue reste intouchable** : un élève ne peut ni l'effacer ni se
  relever un score ;
- le `with check` de l'`update` interdit de transformer un brouillon en note ;
- le travail d'un camarade reste hors de portée.

Pour vérifier :

```sql
select tablename, policyname, cmd from pg_policies
where schemaname='public' and tablename like 'resultats%'
order by tablename, cmd, policyname;
```

→ **cinq politiques par table** : écriture élève, lecture élève+professeur,
modification de la pause par l'élève, suppression de la pause par l'élève,
suppression professeur.

### Le ménage des lignes fantômes

Les brouillons accumulés depuis des mois sont toujours là : la migration ouvre
le droit pour la suite, elle ne nettoie pas le passé : c'est
**`menage-brouillons.sql`** qui le fait — précédé et suivi d'une requête de
lecture.

Le script travaille en trois temps — ce qu'il y a, le ménage, ce qu'il reste —
mais il n'en dit rien dans l'éditeur : il ne parle qu'en `NOTICE`, et, collé
entier, il se joue d'un seul clic, **ménage compris**. Le garde-fou « regarder
avant de supprimer » se fait donc à part, par cette requête qui ne touche à
rien, collée **seule** :

```sql
select t.nom as "table",
  count(r.nom) as lignes,
  count(r.nom) filter (where r.details->>'state' is distinct from 'paused') as notes,
  count(r.nom) filter (where r.details->>'state' = 'paused') as brouillons,
  count(r.nom) filter (where r.details->>'state' = 'paused'
    and r.created_at > now() - interval '24 hours') as "dont < 24 h"
from (values ('resultats'), ('resultats_1ere'), ('resultats_2nde')) t(nom)
left join (select 'resultats' as nom, details, created_at from public.resultats
           union all select 'resultats_1ere', details, created_at
                       from public.resultats_1ere
           union all select 'resultats_2nde', details, created_at
                       from public.resultats_2nde) r on r.nom = t.nom
group by t.nom
order by t.nom;
```

1. **avant** — lancez la requête : par table, lignes, notes, brouillons, et
   combien datent de moins de 24 h. Si les nombres vous surprennent,
   arrêtez-vous là : rien n'est supprimé ;
2. **le ménage** — collez alors le script À LA PLACE de la requête, et
   exécutez-le : il ne retire que les lignes dont `details->>'state'` vaut
   `paused` ;
3. **après** — remettez la requête seule : « brouillons » à zéro (sauf ceux de
   moins de 24 h si vous avez décommenté la ligne de l'étape 2), « notes »
   identique au point 1.

**Aucune note n'est touchée**, et ce n'est pas une promesse : une note n'a pas
de champ `state`, le filtre ne peut pas l'atteindre, et la requête le montre
chiffres en main — « notes » ne bouge pas entre le point 1 et le point 3.

Ces brouillons ne valent rien, et c'est démontrable : le droit de *modifier*
manquait autant que celui de supprimer, si bien que chaque ligne est restée
figée à l'instant de la toute première réponse. Elle annonce « tu t'es arrêté à
la question 5 » et ramènerait en réalité à la question 1. Les garder ne conserve
pas du travail — cela conserve un mensonge, et empêche l'élève de recommencer
l'exercice, puisque l'écran des modes remplace « M'entraîner » par « Reprendre »
dès qu'un brouillon existe.

**À jouer en dehors des heures où les élèves travaillent** : les rares pauses
réellement en cours partiraient avec les autres. Aucune note perdue, mais
l'exercice reprendrait au début. Pour les épargner, décommentez dans l'étape 2
la ligne `and created_at < now() - interval '24 hours'`.

Le relancer ne trouve plus rien.

> `npm run test:base` rejoue ce script sur un PostgreSQL jetable semé exprès —
> deux notes, deux brouillons, un brouillon sur un autre niveau — et vérifie que
> les notes et leurs scores sont intacts, que les trois tables sont traitées, et
> qu'un second passage ne casse rien. Retirer le filtre `state = 'paused'`
> **doit** le faire rougir : c'est le cas.

> `npm run test:base` joue la migration sur un PostgreSQL jetable et met le banc
> dans la peau d'Alice : sa pause doit avancer et s'effacer, sa note doit rester
> intouchable, et le travail de Bob hors d'atteinte. Retirer la politique de
> suppression **doit** le faire rougir.

---

## 3 quinquies. Les cours en PDF (2 min)

Collez **`migrations/005_cours_en_pdf.sql`** dans l'éditeur SQL et exécutez-le,
**puis `migrations/006_cours_lisibles_par_le_portail.sql`**.

> **Collez le fichier ENTIER.** L'éditeur SQL de Supabase exécute tout le script
> comme une seule transaction : si une instruction échoue, tout est annulé,
> bucket compris — et un extrait qui ne contiendrait que des commentaires
> afficherait « Success » sans rien créer. La vérification qui tranche :
> `select id, public from storage.buckets where id = 'cours';` doit rendre une
> ligne.

**À jouer AVANT de mettre en ligne la version qui porte l'onglet « Cours en
PDF ».** Sans cette étape, le bouton « Déposer » répondra *« Dépôt refusé »* :
le bucket n'existe pas, et aucune politique n'autorise quoi que ce soit.

### Où les élèves les voient

**Pas dans l'application** : sur le portail (`turquet-math974.netlify.app`),
dans « Cours et exercices » du niveau, à côté des fiches du dossier `fiches/`.
C'est la migration **006** qui rend le bucket lisible par ce site : il n'a aucun
élève connecté, donc aucun moyen d'obtenir une adresse signée.

### Ce qu'elle pose

Un bucket **`cours`**, **privé**, limité à 20 Mo par fichier et au seul type
`application/pdf` — ces deux bornes sont posées sur le bucket, pas seulement
dans la page : une vérification faite dans le navigateur se contourne en dix
secondes. Et quatre politiques : **lecture** pour tout compte connecté,
**dépôt**, **remplacement** et **suppression** pour le seul professeur, par la
même fonction `est_prof()` que partout ailleurs.

Privé, donc : l'application demande à Supabase une **adresse signée** valable
une heure chaque fois qu'un élève clique sur « Ouvrir le PDF ». Un bucket public
aurait donné des adresses devinables, lisibles sans compte et indexables.

### Où vit le reste

Le fichier vit dans le bucket ; son **titre, sa date et sa taille** vivent dans
la ligne de `parametres_…` (`valeurs.cours`), à côté des devoirs et des
réglages. Aucune table nouvelle, donc aucune politique nouvelle à écrire pour
eux : ceux des paramètres suffisent — lecture pour tous, écriture pour le
professeur.

### Ce qu'aucun banc ne voit

`npm run test:base` **ne rejoue pas** cette migration : il lève un PostgreSQL
ordinaire, où le schéma `storage` n'existe pas — il est propre à Supabase. Le
fichier se termine donc par un contrôle qui **échoue bruyamment** — en rouge,
tout annulé — si le bucket manque, s'il est resté public, ou s'il n'a pas ses
quatre politiques : « Success » veut dire qu'il est passé. La ligne `NOTICE`
qui le redit n'apparaît pas dans l'éditeur. Pour relire l'état après coup, les
deux requêtes en commentaire à la fin du fichier — **une à la fois** : collées
ensemble, seule la seconde s'afficherait (et `public` y vaut `true` depuis la
006, qui a ouvert le bucket en lecture au portail).

---

## 3 sexies. La copie d'écran jointe à un signalement (2 min)

Collez **`migrations/007_capture_de_signalement.sql`** dans l'éditeur SQL et
exécutez-le. **Collez le fichier ENTIER**, pour la même raison qu'au 3 quinquies.

**À jouer AVANT de mettre en ligne la version qui porte la zone de copie
d'écran.** Sans cette étape, l'élève qui joint une image reçoit une erreur au
moment précis où il essaie d'aider — c'est ce que la migration 003 avait déjà
coûté. Dans l'autre sens, il n'y a aucun risque : une colonne en trop et un
bucket inutilisé ne gênent personne.

### Ce qu'elle pose

Une colonne **`capture`** sur les trois tables de signalements — le CHEMIN du
fichier, jamais l'image : une image en base64 ferait grossir la table de
centaines de kilo-octets par ligne, et la sauvegarde nocturne avec elle.

Un bucket **`signalements`**, **privé**, limité à 3 Mo et aux seuls types
`image/jpeg`, `image/png`, `image/webp`. Trois politiques :

| Geste | Qui |
|---|---|
| déposer | l'élève, **dans son propre dossier** — le premier segment du chemin est son identifiant, vérifié contre son compte |
| lire | le professeur, et lui seul |
| supprimer | le professeur |

Aucune politique de **remplacement**, volontairement : une capture est une pièce
déposée, pas un brouillon qu'on retouche.

### Pourquoi privé, alors que `cours` est public

Ce n'est pas la même chose. Un cours en PDF est un document destiné à être lu ;
une copie d'écran est l'écran d'un élève **mineur**, avec son prénom affiché
dessus, ses réponses et sa note. Public voudrait dire lisible par quiconque
devine l'adresse. Le professeur, lui, est connecté : il demande une adresse
signée, valable une heure.

L'élève ne peut même pas **relire** ce qu'il vient d'envoyer — rien dans la page
n'en a besoin, et le droit qu'on ne donne pas est celui qu'on n'a pas à
surveiller.

### Ce qu'aucun banc ne voit

Comme au 3 quinquies : la partie `storage` n'est pas rejouée par
`npm run test:base`. La colonne `capture`, elle, est du SQL ordinaire et le banc
la voit. Le fichier se termine par un contrôle qui **échoue bruyamment** si le
bucket manque, s'il est resté public, s'il n'a pas ses trois politiques, ou si
aucune table n'a reçu la colonne.

### Le quota

Le plan gratuit offre 1 Go de stockage. La page **réduit** chaque image avant
l'envoi (1600 px de large, JPEG) : comptez 150 à 400 Ko par capture. Supprimer
un signalement emporte son image — c'est ce qui garde le quota stable dans le
temps.

### Les sauvegardes ne l'emportent pas

L'export de nuit (`sauvegarde.yml`) exporte les **tables**, pas le stockage. Les
titres des cours sont donc sauvegardés, les PDF eux-mêmes ne le sont pas —
gardez vos originaux sur votre ordinateur.

---

## 3 septies. Répondre à un signalement (1 min)

Collez **`migrations/008_reponse_au_signalement.sql`** dans l'éditeur SQL et
exécutez-le. **Collez le fichier ENTIER.**

**À jouer AVANT de mettre en ligne la version qui porte le bouton
« Répondre ».** Sans cette étape, le bouton renvoie une erreur au moment où
vous écrivez votre réponse. Côté élève le retard coûte moins cher — son accueil
n'affiche simplement rien — mais il ne verra rien non plus. Dans l'autre sens,
il n'y a aucun risque : deux colonnes en trop ne gênent personne.

### Ce qu'elle pose

Deux colonnes sur les trois tables de signalements : **`reponse`** (votre texte)
et **`repondu_at`** (la date, que l'élève voit à côté).

Et surtout, elle **élargit la politique de lecture**. C'est le cœur du fichier :
la migration 003 la réservait au professeur, si bien qu'une réponse serait
parfaitement enregistrée et parfaitement invisible. L'élève lit désormais
**sa propre ligne, et elle seule** — jamais celle d'un camarade. C'est exactement
le motif que `resultats` emploie depuis la 001 :

```sql
using (public.est_prof()
       or exists (select 1 from public.eleves e
                   where e.id = eleve_id and e.user_id = auth.uid()))
```

La politique **remplace** celle de la 003, elle ne s'ajoute pas à côté : deux
politiques permissives se combinent par un OU, et c'est ainsi qu'on garde une
règle qu'on croit avoir retirée (la leçon de la migration 002).

### Ce qu'elle ne donne pas, et c'est voulu

**Aucun droit d'écriture à l'élève.** Pas de marque « j'ai lu », pas de réponse
à la réponse. La table porte un UPDATE ouvert à tout compte connecté au niveau
des *droits*, et seule la politique le restreint au professeur : lui ouvrir une
politique d'UPDATE, fût-ce sur sa propre ligne, le laisserait réécrire son
message — ou votre réponse. Le droit qu'on ne donne pas est celui qu'on n'a pas
à surveiller.

Conséquence à connaître : la réponse reste sur l'accueil de l'élève tant que
vous ne supprimez pas le signalement. C'est le bouton « Supprimer » de la carte
qui la retire.

### Ce que le banc voit

Celle-ci est du SQL ordinaire : `npm run test:base` la rejoue en entier et
exerce les trois bords — l'élève lit sa réponse, il ne lit pas celle d'un
camarade, il ne peut pas écrire de réponse. Le fichier se termine en plus par un
contrôle qui **échoue bruyamment** si une colonne manque ou si la lecture n'a
pas été élargie.

---

## 3 octies. Réparer les notes faussées par la coupe (une seule fois)

*À ne jouer que si vous avez réglé le NOMBRE DE QUESTIONS d'un exercice dans un
devoir ou une fiche de Seconde avant septembre 2026.*

Jusqu'à la v128, la coupe retirait des questions **sans toucher au barème** :
trois questions posées sur quatre tirées, et une copie sans faute valait 3/4 —
75 %, donc 7,5/10, donc **15/20** (signalé par Turquet sur la fiche 3). La page
est corrigée ; les notes déjà enregistrées portent encore le mauvais
dénominateur.

Collez **`corriger-notes-coupe.sql`** dans l'éditeur SQL et exécutez-le. Il est
idempotent, il ne baisse jamais une note, et il conserve l'ancien barème dans
la ligne (le fichier dit comment revenir en arrière).

Il ne répare **que les copies sans faute**, et c'est volontaire : là, le score
est par construction le barème de la séance réellement posée, donc la note
juste est 100 % — aucune supposition. Une copie qui a des fautes est
sous-notée elle aussi, mais son barème n'est écrit nulle part ; le deviner
ferait courir le risque de remonter une note à tort, ce qu'on ne saurait plus
voir. Ces copies-là sont **listées** à la fin de son rapport — mais ce rapport
part en `NOTICE`, et l'éditeur n'en affiche rien : « Success. No rows
returned » dit que le script a tourné, pas ce qu'il a réparé. Ce qu'il fera,
puis ce qu'il a fait, se lit par cette requête de lecture, collée **seule**,
avant puis après le script :

```sql
select d.genre, d.num, d.titre, r.details->>'dm' as id,
       r.details->>'test' as exercice,
       count(*) filter (where r.details->'misses' = '[]' and r.score > 0
                          and r.total > r.score) as a_reparer,
       count(*) filter (where r.details ? 'correction_bareme') as reparees,
       count(*) filter (where r.details->'misses' <> '[]'
                          and r.total > r.score) as avec_faute
  from public.resultats_2nde r
  left join lateral (
       select k.genre, v->>'num' as num, v->>'titre' as titre
         from public.parametres_2nde p,
              (values ('fiches','fiche'), ('devoirs','devoir')) k(cle, genre),
              jsonb_array_elements(coalesce(p.valeurs->k.cle, '[]')) v
        where v->>'id' = r.details->>'dm' limit 1) d on true
 where jsonb_typeof(r.details) = 'object' and r.details ? 'dm'
   and coalesce(r.details->>'state', '') <> 'paused'
   and not coalesce((r.details->>'partiel')::boolean, false)
   and jsonb_typeof(r.details->'misses') = 'array'
   and r.total > 0 and r.score >= 0 and r.score = trunc(r.score)
 group by 1, 2, 3, 4, 5
having count(*) filter (where r.details ? 'correction_bareme'
                           or (r.details->'misses' = '[]' and r.score > 0
                               and r.total > r.score)) > 0
 order by 1, 2, 5;
```

Une ligne par exercice d'un devoir où une copie sans faute prouve la coupe,
avec le genre, le numéro et le titre que vous connaissez (vides si le devoir a
été retiré des réglages : reste son identifiant, `id`). **Avant** le script,
`a_reparer` compte les copies sans faute qu'il remettra à 100 % ; **après**,
`a_reparer` est à zéro et `reparees` les a reprises. `avec_faute` compte les
copies qu'il laisse : faites refaire l'exercice, la meilleure note l'emporte et
le carnet se corrige de lui-même. Aucune ligne : il n'y a rien à réparer.

**Seule la Seconde est concernée** : la Première et la Terminale notent sur le
nombre de questions et n'ont jamais mal noté.

`npm run test:base` rejoue le script sur un PostgreSQL jetable — la copie
parfaite remise à 100 %, la copie fautive laissée et nommée, la note partielle
et le brouillon de pause épargnés, l'idempotence et le retour arrière.

---

## 3 nonies. La connexion sans la liste des prénoms (1 min)

> **Remplacée le 14 octobre 2026 par la 3 decies** (juste après) ; gardée
> pour l'histoire, et parce qu'elle a pu être jouée. Ne la collez plus : si
> elle l'a été, la 3 decies la défait.

Collez **`migrations/009_connexion_sans_liste.sql`** dans l'éditeur SQL et
exécutez-le. **Collez le fichier ENTIER.**

**À jouer APRÈS la mise en ligne de la version qui la connaît, et pas
avant.** C'est l'inverse des 003, 007 et 008, et la raison ne se devine pas :
l'ancien écran de connexion demandait la **liste des prénoms** avant toute
authentification, et cette migration ferme précisément cette lecture. Jouée
trop tôt, elle coupe la connexion de **tout le monde** — l'ancienne page
afficherait « Aucun compte pour l'instant » à une classe entière.

**Le repère à lire est l'écran de connexion lui-même**, sur les trois pages en
ligne : la page qui connaît cette migration demande de **taper son prénom**
(un champ « Ton prénom », puis le code). Tant que vous voyez des **pastilles de
prénoms** à cliquer sur l'une des trois pages, ne collez pas ce fichier. Les
numéros qui l'ont apportée — Seconde v483, Première v317, Terminale v384 —
valent « ce numéro ou plus » ; un numéro recopié peut se tromper (c'est arrivé
avant même la mise en ligne), le champ, non. GitHub Pages peut servir
l'ancienne page quelques minutes encore après la fusion : si vous voyez le
champ, attendez dix minutes de plus avant de coller.

Dans le bon ordre, il n'y a aucun risque : tant que la migration n'est pas
jouée, la nouvelle page **se replie d'elle-même** sur l'ancienne liste
(Supabase répond « fonction inconnue », code `PGRST202`, et la page lit la
liste comme avant). Ce repli **s'éteint tout seul** dès que le fichier est
passé : il ne reste rien à retirer, ni dans la page, ni dans la base.

### Ce qu'elle pose

La migration 001 laissait un visiteur lire la liste des prénoms — et la **clé**
de chacun, dont l'adresse de connexion est dérivée —, parce que l'écran de
connexion l'affichait. C'était le prix, et il était trop haut pour trois
classes de mineurs (décision de Turquet, octobre 2026). L'élève **tape**
désormais son prénom, et la page n'obtient que ce qu'il faut pour le
connecter.

- **`normaliser_prenom(text)`** : minuscules, espaces rognés, accents retirés
  — « Chloé », « chloe » et « CHLOÉ  » sont le même prénom, « Ayşe » et
  « ayse » aussi. C'est la règle exacte de la page (`normalize(…, NFD)` de
  PostgreSQL, puis les signes combinants retirés), et le banc exige que les
  deux rendent la même chose sur les mêmes prénoms.
- **`cles_de_connexion(niveau, prenom)`** : la ou les clés des élèves du niveau
  qui portent ce prénom, **cinq au plus**, et **rien d'autre** — ni
  l'identifiant, ni le prénom, ni la liste. Elle est `security definer` : elle
  lit la table **sans repasser par la RLS**, comme `est_prof()`, sans quoi le
  visiteur qui l'appelle ne verrait rien. Un visiteur n'obtient plus que ce
  qu'il savait déjà, traduit en ce qu'il lui faut pour tenter un code — et le
  code reste vérifié par Supabase seul.
- Sur `eleves`, `eleves_1ere`, `eleves_2nde` : la politique **`p_<table>_liste`**
  est **remplacée** par la même, pour `authenticated` seul. Le nom ne change
  pas, seul `anon` disparaît. Remplacée, pas doublée : deux politiques
  permissives se combinent par un OU (la leçon de la 002).

Elle se termine par un contrôle qui **échoue bruyamment** si une politique de
lecture d'une table d'élèves nomme encore `anon`, si une table porte plus d'une
politique de lecture, si la fonction manque ou n'est pas `security definer`, ou
si `anon` n'a pas le droit de l'appeler. Elle est **idempotente**, et un niveau
dont la table manque est sauté — signalé par une `NOTICE`, donc sans rien à
l'écran.

Pour vérifier :

```sql
select tablename, policyname, roles from pg_policies
where schemaname='public' and tablename like 'eleves%' and cmd='SELECT';
```

→ **trois lignes**, toutes `{authenticated}`.

### Ce qu'elle ne donne pas, et c'est voulu

**Un élève connecté lit toujours la liste entière de sa classe.** Votre
tableau, les signalements et le bilan en ont besoin — ils nomment chaque ligne
par son élève. Restreindre l'élève connecté à sa propre ligne est une étape
possible plus tard, **nommée ici comme non faite**.

**Les scripts à clé de service ne sont pas concernés** — `sauvegarde.mjs`,
`relier-comptes.sql`, la fonction Edge `admin-eleve` : ils traversent la RLS,
qu'une politique soit là ou non.

**Il reste un résidu, nommé plutôt que caché.** Un visiteur peut demander si
« Léa » a un compte dans une classe et obtenir ses clés — cinq au plus par
appel ; au-delà de cinq homonymes, les suivants ne sortent pas et ne peuvent
pas se connecter par cet écran. C'est un oracle d'existence par prénom : bien
moins que la liste entière d'avant, mais pas rien. Le code reste le seul
secret, vérifié par Supabase seul, sous sa limitation de cadence. Un
durcissement possible, **non fait** : `revoke select on public.eleves,
public.eleves_1ere, public.eleves_2nde from anon` — la fonction n'en a pas
besoin, et une politique `anon` recréée un jour dans la console ne rouvrirait
plus rien.

**Si l'écran répond « Prénom inconnu » à tout le monde dans la minute qui
suit**, c'est le cache de schéma de PostgREST, qui ne connaît pas encore la
fonction : le fichier lui demande de se recharger (`notify pgrst`), Supabase
le fait aussi de lui-même, mais pas à la seconde. Attendez, ne rejouez rien.

### Ce que le banc voit

Celle-ci est du SQL ordinaire : `npm run test:base` la rejoue en entier, puis
met le banc dans la peau d'un **visiteur** : il ne voit plus la liste, il
obtient la clé d'un prénom qu'il connaît **et elle seule**, jamais une clé
vide, « CHLOE » et « CHLOÉ » retrouvent Chloé, un prénom inconnu ou vide ne
rend rien, un niveau inconnu est refusé, et la fonction ne rend que des
`text`. Le professeur, lui, voit encore sa liste. Le banc relit aussi la
fonction de normalisation des trois pages et l'exécute sur les mêmes sondes
que la base — « Ayşe », « Nguyễn », une tabulation, un insécable — et exige le
même résultat : la page et la base **doivent** reconnaître les mêmes prénoms.
Il éprouvait enfin, jusqu'à la 010, les deux retours en arrière les plus
tentants : remettre `anon` sur la politique de la liste, et retirer `security
definer` à la fonction — chacun **devait** le faire rougir, et **pour la bonne
cause** : la ligne d'échec attendue est écrite pour chaque mutation. **Depuis
la 010, remettre `anon` est l'état EXIGÉ**, et ces deux mutations ont quitté
la boucle ; ce que pose ce fichier — la liste vide au visiteur, la fonction et
ses réponses — reste éprouvé juste après lui (voir « Ce que le banc voit » de
la 3 decies).

Le fichier lui-même se termine par une mesure, pas une affirmation : il prend
le rôle `anon`, demande un prénom présent dans chaque table, et **échoue** si
la fonction ne rend rien — c'est le seul contrôle qui tourne sur le projet
réel. Une table vide, ou un rôle qu'il ne peut pas prendre, se déclare par une
`NOTICE` au lieu d'échouer — et l'éditeur n'en montre rien : dans ces deux cas,
« Success » ne prouve pas que la mesure a eu lieu. Une erreur de droit levée
dans la fonction elle-même, elle, fait échouer le fichier, en rouge ; elle ne
se déguise pas en « rôle impossible à prendre ».

---

## 3 decies. Le retour de la liste des prénoms (1 min)

Collez **`migrations/010_retour_de_la_liste.sql`** dans l'éditeur SQL et
exécutez-le. **Collez le fichier ENTIER.**

Décision de Turquet, le 14 octobre 2026 : *« revenir à la liste des élèves qui
s'affichent à l'écran avant de rentrer son mot de passe »*. Les **pastilles de
prénoms** reviennent sur l'écran de connexion des trois pages, et la liste se
lit de nouveau sans compte — exactement comme après la 001.

**L'ordre est indifférent** : avant ou après la mise en ligne de la page qui
ramène les pastilles, et que la 3 nonies (009) ait été jouée ou non. C'est la
seule migration de ce dossier dont on puisse le dire, et c'est voulu — chaque
combinaison connecte :

- **La page qui ramène les pastilles** lit la liste. Si elle revient vide —
  la 009 jouée, pas encore la 010 —, elle demande à la base si la fonction de
  la 009 existe ; si oui, la liste est fermée exprès, et la page affiche le
  champ **« Ton prénom »** à la place des pastilles : la connexion par prénom
  tapé, intacte. Dès que la 010 est passée, la liste revient pleine et les
  pastilles s'affichent d'elles-mêmes. Ce repli s'éteint tout seul : il ne
  reste rien à retirer, ni dans la page, ni dans la base.
- **La page d'hier** (le champ « Ton prénom »), si une tablette la garde
  encore en cache, appelle la fonction ; dès que la 010 l'a supprimée,
  Supabase répond « fonction inconnue » (code `PGRST202`) et la page relit la
  liste — rouverte au même instant, par le même fichier.
- **Si la 009 n'a jamais été jouée**, la 010 ne change rien de visible : la
  politique est déjà celle-là, et les fonctions n'existent pas.

Et la **création de compte** refuse un prénom déjà pris — sans accent ni
majuscule — dans les trois cas : par la fonction si elle existe, par la liste
sinon. Aucun élève ne se crée un second compte pendant la transition. Une
limite, nommée : tant que la 009 est jouée et pas la 010, la fonction ne voit
pas une ligne **sans clé** (élève jamais relié) — le doublon d'un tel prénom
n'y est pas refusé ; dès la 010 jouée, la liste le voit.

### Ce qu'elle pose

- Sur `eleves`, `eleves_1ere`, `eleves_2nde` : la politique **`p_<table>_liste`**
  est **remplacée** par celle de la 001 — `for select to anon, authenticated
  using (true)`. Le nom ne change pas, seul `anon` revient. Remplacée, pas
  doublée : deux politiques permissives se combinent par un OU (la leçon de
  la 002).
- Le **droit de lire** `id`, `prenom` et `cle` est rendu à `anon` sur ces
  trois tables. La 3 nonies proposait un durcissement « possible, non fait » :
  `revoke select … from anon`. S'il a été appliqué, la politique ne suffit
  pas — la page recevrait « permission denied » au lieu de la liste. Rendu sur
  ces trois colonnes et sur elles seules : `created_at` et `user_id` restent
  fermés à un visiteur si le droit de table avait été retiré. S'il ne l'a pas
  été, ce `grant` ne change rien.
- Les deux fonctions de la 009, **`cles_de_connexion`** et
  **`normaliser_prenom`**, sont **supprimées**. Elles ne servaient qu'à
  l'écran du prénom tapé — et leur **absence** est un signal que les pages
  lisent : laissée en place, la fonction ferait afficher « Ton prénom » à une
  classe vide au lieu de « Aucun compte pour l'instant », et masquerait une
  liste refermée par erreur un jour.
- `notify pgrst, 'reload schema'` : PostgREST doit **oublier** la fonction.

Elle dit aussi **l'état trouvé** — « la 009 avait été jouée », ou « pas de
cles_de_connexion » — mais par une `NOTICE`, que l'éditeur n'affiche pas. Pour
le savoir, il faut le demander **avant** de la coller, par une requête seule :
`select to_regprocedure('public.cles_de_connexion(text, text)') is not null as
la_009_avait_ete_jouee;` — après elle, la réponse est `false` dans tous les
cas, et la question n'a plus d'objet.
Elle se termine par un contrôle qui **échoue bruyamment** si une table d'élèves
porte plus d'une politique de lecture (une politique « for all » revenue par
la console, par exemple : jouez alors la 002), si cette politique ne nomme pas
`anon` et `authenticated` ou ne laisse pas tout lire, ou si l'une des deux
fonctions existe encore. Puis elle **mesure** : elle prend le rôle `anon`, lit
ce que la page demande — identifiant, prénom et clé — et exige autant de
lignes que le rôle qui joue le fichier. Une table vide, ou un rôle qu'elle ne
peut pas prendre, se **déclare** par une `NOTICE` au lieu d'échouer — invisible
dans l'éditeur : dans ces deux cas, « Success » ne prouve pas que la mesure a
eu lieu. La preuve directe est sur les pages en ligne : elles lisent la liste
**en visiteur**, et les pastilles de toute la classe s'y affichent.
Elle est **idempotente**, et un niveau dont la table manque est sauté
(signalé, lui aussi, par une `NOTICE`). **Aucune donnée n'est touchée**, et
aucune autre politique.

### Ce qu'elle coûte, nommé

C'est exactement la lecture que la 009 avait fermée, et son prix revient avec
elle. La clé anonyme de Supabase est dans la page : **n'importe qui, sans
compte, depuis n'importe où sur Internet, lit de nouveau les prénoms de trois
classes de mineurs — et la clé de chacun**, dont l'adresse de connexion est
dérivée. La moitié de l'identifiant est offerte : **le code à six chiffres et
la limitation de cadence de Supabase** (voir « La limitation de cadence »
plus bas) **redeviennent le seul rempart**. C'est la décision de Turquet,
prise en connaissance de ce prix.

### Ce que voient les élèves pendant la transition

- **La 009 jouée, la 010 pas encore** : le champ « Ton prénom » à la place des
  pastilles, sur la page qui les ramène comme sur celle d'hier. **La connexion
  marche.**
- **La 010 jouée** : les pastilles, sur les trois pages.
- **Dans la minute qui suit la 010**, la page d'hier peut répondre « Connexion
  impossible — réessaie », et la création de compte « Vérification du prénom
  impossible » : c'est le cache de schéma de PostgREST, qui tente encore une
  fonction disparue. Le fichier lui demande de se recharger, Supabase le fait
  aussi de lui-même, mais pas à la seconde. **Attendez, ne rejouez rien.** Les
  pastilles, elles, ne passent pas par la fonction.
- **Si la 009 est rejouée par erreur après la 010**, la liste se referme et le
  champ « Ton prénom » revient — la connexion marche encore. **Sauf dans la
  minute qui suit** : tant que PostgREST n'a pas appris la fonction recréée,
  la page affiche « Aucun compte pour l'instant », et la création de compte ne
  voit plus les prénoms pris. Recollez la 010 aussitôt, et que personne ne
  crée de compte pendant ce temps.
- **Deux élèves du même prénom** ont deux pastilles pareilles : l'un ou l'autre
  peut cliquer n'importe laquelle, c'est **le code qui départage**.
- **Une ligne ajoutée à la main dans la table, sans clé**, a sa pastille, mais
  aucun compte derrière : l'élève lit « Ton compte n'est pas encore relié —
  préviens ton professeur ». « Nouveau code » depuis l'onglet Élèves lui pose
  une clé et un compte : l'élève reçoit un code provisoire.

### Pour vérifier

```sql
select tablename, policyname, roles from pg_policies
where schemaname='public' and tablename like 'eleves%' and cmd='SELECT';
```

→ **trois lignes**, toutes `{anon,authenticated}`.

Et sur les trois pages en ligne, **les pastilles reviennent** à l'écran de
connexion.

### Ce que le banc voit

`npm run test:base` joue la 010 dans les deux états d'où elle peut partir —
**après la 009**, et sur une base où **la 009 n'a jamais été jouée** — et
exige les deux fois : aucune erreur, la liste rouverte sur les trois tables et
mesurée en tant que visiteur, une seule politique de lecture par table, qui
nomme `anon`, plus aucune des deux fonctions ; rejouée, elle ne change plus
rien. Elle doit aussi **refuser** de se déclarer faite tant que les politiques
grandes ouvertes que retire la 002 sont là. Le banc des rôles, joué sur
l'état final (001 à 004, 008, 009 **puis** 010), met le banc dans la peau
d'un visiteur : il voit la liste des prénoms (Alice, Bob, Chloé) **et la clé
de chacun**, et toujours aucune note. Deux retours en arrière doivent le faire
rougir, pour la bonne cause : **la liste qui se referme aux visiteurs**, et
**la clé cachée par un droit de colonne** — « garder la liste, cacher les
clés » est le durcissement le plus tentant, et il couperait la connexion de
tout le monde.

L'état intermédiaire — la 009 jouée, pas la 010 — **reste éprouvé**, parce
qu'il peut exister sur le projet : la liste revient vide au visiteur, sans
erreur ; la fonction rend la clé d'un prénom et elle seule, sans accent ni
majuscule ; et la question que posent les pages — « la fonction existe-t-elle ? », un
prénom vide sur le niveau de chaque page — répond sans erreur et ne rend
rien.

Ce qu'il ne voit pas : **dans quel état est votre projet**. La 010 a été
jouée le 14 octobre 2026 (« Success. No rows returned ») ; l'« état trouvé »
qu'elle annonçait part en `NOTICE` et ne s'est pas affiché : on ne saura pas si
la 009 l'avait précédée — et, la 010 jouée, cela n'a plus d'importance.

## 4. Vous déclarer professeur (1 min)

Toujours dans **SQL Editor**, avec l'UUID de l'étape 2 :

```sql
insert into public.professeurs (user_id)
values ('collez-ici-l-uuid-de-votre-compte');
```

Sans cette ligne, votre mot de passe sera accepté mais le tableau de bord
refusera de s'ouvrir : *« Ce compte n'est pas celui du professeur »*.

---

## 5. Déployer la fonction `admin-eleve` (5 min)

Elle porte les trois gestes qui demandent des droits que le navigateur ne doit
pas avoir : donner un nouveau code, ajouter un élève, en retirer un.

```bash
npx supabase functions deploy admin-eleve
```

ou, sans outil en ligne de commande : **Edge Functions → Deploy a new function**,
nom `admin-eleve`, et coller le contenu de `functions/admin-eleve/index.ts`.

Aucune variable d'environnement à régler : `SUPABASE_URL`,
`SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournies
automatiquement par Supabase.

> ### ⚠️ Cette fonction ne se met JAMAIS à jour toute seule
>
> GitHub Pages publie les trois pages à chaque fusion. La fonction Edge, elle,
> vit chez Supabase et **se déploie à la main**. Elle peut donc rester en
> arrière indéfiniment sans que rien ne le signale.
>
> C'est arrivé le 11 août 2026 : les codes étaient passés à 6 chiffres, la
> fonction déployée en produisait encore 4, et « Nouveau code » en distribuait
> sans broncher.
>
> **Chaque fois que `functions/admin-eleve/index.ts` change, redéployez-la.**
>
> Le contrôle « la longueur du code est la même dans la page et dans la
> fonction Edge » compare deux fichiers du dépôt : il ne voit pas ce qui est
> déployé. Le seul garde-fou qui le voie est dans la page — elle vérifie la
> longueur des codes qu'elle reçoit et vous avertit :
> *« Ce code n'a que 4 chiffres : redéployez la fonction admin-eleve »*.
> Le code est affiché quand même : l'ancien vient d'être invalidé, le taire
> enfermerait l'élève dehors.

---

## 5 bis. Déployer la fonction `corriger-definition` (5 min)

C'est elle qui porte **toute l'aide par IA** des trois niveaux : les conseils,
les questions à l'IA, la correction des définitions et la vérification des
rédactions. Elle tient la clé du modèle, qui n'est jamais dans la page.

```bash
npx supabase functions deploy corriger-definition
```

ou, sans outil en ligne de commande : **Edge Functions → `corriger-definition`
→ Code**, et coller le contenu de `functions/corriger-definition/index.ts`.

Une variable d'environnement à régler, une seule : **`ANTHROPIC_API_KEY`**
(Edge Functions → Secrets). Les trois autres sont fournies par Supabase.

> ### ⚠️ Elle non plus ne se met pas à jour toute seule
>
> Le 19 août 2026, sa borne `MAX_CTX` valait 8000 caractères. Or la Terminale
> envoie 6650 caractères de consignes **avant même** le contexte de l'exercice :
> **11 de ses 30 exercices dépassaient la borne**, et leurs élèves lisaient
> *« Demande de conseil invalide. »* à chaque question — sans aide, et sans que
> rien n'explique pourquoi. La Seconde (1100) et la Première (4900) n'étaient
> pas touchées.
>
> La borne est passée à 20000. Elle ne protégeait de rien : ce qu'un élève écrit
> est déjà plafonné à 300 caractères par la page et à `MAX_LEN` par la fonction —
> tout le reste, ce sont les consignes de l'application.
>
> **Après cette mise à jour du dépôt, redéployez la fonction**, sinon l'aide
> reste coupée sur ces 11 exercices.
>
> Le contrôle « le contexte envoyé au modèle tient dans la borne de la fonction
> Edge » mesure, exercice par exercice, ce que chaque page enverrait, et le
> compare à `MAX_CTX` **lu dans le fichier du dépôt** — il ne voit pas ce qui est
> déployé. Il affiche à chaque exécution le contexte le plus long et sa marge.

> ### ⚠️ Octobre 2026 : passage à Claude Haiku 5.5 — redéployez
>
> L'aide par IA quitte Claude Haiku 4.5 pour **Claude Haiku 5.5** (identifiant
> `claude-haiku-5-5`). Tout le changement est dans
> `functions/corriger-definition/index.ts` : les trois pages n'ont pas bougé.
>
> **Ce qui change pour les élèves.** Rien à l'écran : mêmes boutons, mêmes
> fenêtres, mêmes quotas. Les conseils et les verdicts viennent d'un modèle plus
> récent. Et quand l'IA refuse une demande, que sa réponse est coupée ou qu'elle
> est illisible, l'élève lit un message clair — par exemple *« L'IA n'a pas pu
> relire ta réponse. Réessaie, ou demande à ton professeur. »*, *« La réponse de
> l'IA a été coupée avant la fin. Réessaie. »* ou *« La réponse de l'IA est
> illisible. Réessaie. »* — là où il lisait avant un verdict « faux » qui n'en
> était pas un, ou *« Je n'ai pas de conseil pour l'instant »*. Une copie n'est
> plus comptée fausse ni verrouillée sur une réponse de l'IA qui n'en était pas
> une ; là où la page sait juger la copie elle-même, elle prend le relais. Ces
> cas laissent une ligne dans la table `corrections_ia` (`[refus du modèle :
> …]`, `[réponse coupée]`, `[réponse illisible] …`) : vous y lirez leur
> fréquence réelle.
>
> **Les erreurs du service se lisent autrement.** Un service surchargé dit à
> l'élève *« L'IA est très sollicitée, réessaie dans un instant (code 529). »* ;
> une erreur de configuration (clé, crédit, modèle) dit *« L'aide IA est mal
> configurée (code 404) : préviens ton professeur. »*. Le code entre parenthèses
> est celui à lire ci-dessous.
>
> **Le geste : redéployez la fonction**, comme indiqué plus haut. Tant que ce
> n'est pas fait, l'aide continue de tourner sur Haiku 4.5, sans que rien ne le
> signale.
>
> **Vérifier que c'est fait.** Edge Functions → `corriger-definition` → Code :
> le fichier déployé porte `const MODEL = "claude-haiku-5-5"`. Puis, après une
> demande d'aide faite depuis une page, **console.anthropic.com → Usage** : les
> appels apparaissent sous `claude-haiku-5-5`. Les journaux de la fonction chez
> Supabase (Edge Functions → `corriger-definition` → Logs) le montrent aussi
> dès qu'un refus ou une coupure s'y produit : *« Refus du modèle … »* ou
> *« Réponse du modèle coupée … »* — deux lignes que l'ancienne version
> n'écrivait jamais.
>
> **Le retour arrière.** Si, après le redéploiement, l'aide répond partout
> *« L'aide IA est mal configurée (code 404) : préviens ton professeur. »*, le
> modèle n'est pas ouvert à votre clé. Remettez la version précédente du fichier — le dépôt la garde : sur
> GitHub, `supabase/functions/corriger-definition/index.ts` → **History**, la
> version d'avant ce passage, celle qui porte `claude-haiku-4-5-20251001` — et
> redéployez-la de la même façon : l'aide revient sur Haiku 4.5. Un code 400
> appelle le même geste (c'est alors la requête elle-même qui est refusée).
> Seule la fonction déployée revient en arrière : le dépôt reste sur Haiku 5.5,
> et son banc (`npm run test:fonction`) exige ce modèle. Un code 401 ou 403 est
> une clé refusée ou sans crédit : réglez-la sur console.anthropic.com, sans
> toucher au fichier.

---

## 6. Redonner un code à chaque élève

Les anciens codes n'existent plus — ils ont été supprimés avec la colonne, et un
hachage ne se relit pas. Dans **Élèves** du tableau de bord, le bouton
**« Nouveau code »** en tire un et **l'affiche une seule fois**.

Il fonctionne aussi pour les élèves **inscrits avant la bascule**, qui n'ont pas
encore de compte Supabase : la fonction leur en crée un au passage. C'est
exactement ce que « redonner un code à chaque élève » veut dire — il n'y a rien
d'autre à faire pour eux. Notez-le à ce
moment-là : personne, pas même vous, ne pourra le retrouver ensuite.

C'est voulu. Un code que le professeur peut relire est un code qu'un autre peut
lire aussi.

**L'élève DOIT ensuite en choisir un — ce n'est pas une option.** Un code tiré
au hasard ne se retient pas. À sa première connexion avec un code provisoire,
la page lui demande d'en choisir un **avant de le laisser entrer**. Pas un
bouton qu'il pourrait ignorer : une demande qui barre l'entrée. S'il renonce,
la session se referme et il revient à l'accueil.

**Une fois son code choisi, il est renvoyé à l'écran de connexion** et doit se
reconnecter avec. C'est voulu : il vérifie ainsi tout de suite qu'il l'a bien
retenu, au lieu de s'en apercevoir le lendemain, seul devant son écran. La
session est réellement refermée avant le renvoi — sans quoi l'élève suivant sur
le même poste hériterait de ses droits.

Le marqueur qui commande ce bouton (`code_provisoire`) vit dans
l'`app_metadata` du compte : **seul le service peut l'écrire**. Un élève ne
peut donc pas se le redonner pour rouvrir le bouton. La fonction Edge le pose
en donnant un code, et le retire quand l'élève en a choisi un — c'est le seul
geste qu'un élève puisse lui demander, et il ne porte que sur son propre
compte, jamais sur celui d'un camarade.

> Si Supabase refuse le changement, l'élève entre quand même et le marqueur
> reste : la demande reviendra à la prochaine connexion. Un incident de service
> ne doit pas l'empêcher de travailler.

Le changement lui-même n'exige aucun droit particulier — Supabase autorise un
compte connecté à changer son propre mot de passe, et rien d'autre.

---

## Si quelque chose se passe mal

`migrations/001_annulation.sql` rouvre l'accès immédiatement.

Elle **ne rend pas** les anciens codes : ils n'existent plus. Elle vous ramène à
un site ouvert, avec des codes à redistribuer de toute façon — donc si vous en
êtes là, corriger en avant est presque toujours préférable.

Elle ne retire que les politiques `p_` : les vôtres, s'il y en avait, restent.

---

## Si la structure des tables change

`tests/base-avant.sql` reproduit la structure réelle du projet, **relevée le
10 août 2026**, et le banc s'en sert comme point de départ. Elle n'est pas la
même d'un niveau à l'autre :

| | `eleves.id` | `resultats.eleve_id` |
|---|---|---|
| Terminale | uuid | uuid |
| Première | **bigint** | **bigint** |
| Seconde | uuid | uuid |

Cet écart a coûté un défaut réel : le premier jet dérivait l'adresse du compte
de `eleves.id`, ce qui marchait en Terminale et en Seconde et cassait la
création de compte en Première. D'où la colonne `cle`, indépendante du type.

Si vous modifiez la structure, **relevez-la à nouveau** et mettez
`tests/base-avant.sql` à jour — ne le corrigez pas de mémoire :

```sql
select table_name as "table", column_name as "colonne", data_type as "type"
from information_schema.columns
where table_schema = 'public'
  and table_name in ('eleves','eleves_1ere','eleves_2nde',
                     'resultats','resultats_1ere','resultats_2nde',
                     'parametres','parametres_1ere','parametres_2nde')
order by table_name, ordinal_position;
```

---

## La limitation de cadence — réglée à 200 le 11 août 2026

Supabase **ne verrouille jamais un compte** après des échecs répétés. Sa seule
protection est une limitation par **adresse IP**, réglable dans
Authentication → Rate Limits → *sign ups and sign ins*.

Le défaut est de **30 par tranche de 5 minutes**. Or une classe partage l'IP de
l'établissement : trente élèves qui se connectent au même début d'heure font
trente requêtes depuis une seule adresse — les derniers auraient été refusés,
avec le bon code. **Le réglage a donc été porté à 200**, ce qui laisse passer
une classe de 35 avec ses fautes de frappe.

- **Créer les comptes depuis le tableau de bord** plutôt que de laisser les
  élèves s'inscrire le premier jour : l'onglet Élèves passe par la fonction
  Edge, qui ne compte pas dans cette limite.

Relever la limite affaiblit mécaniquement les codes — c'est pourquoi ils font
**6 chiffres** et non 4 :

| Limite | 4 chiffres | 6 chiffres |
|---|---|---|
| 30 / 5 min | une nuit | ~5 ans |
| 200 / 5 min | **2 heures** | ~9 jours |

Un verrouillage par compte serait possible — une fonction Edge tenant un
compteur d'échecs — mais il donnerait à chaque élève le moyen de bloquer un
camarade : le prénom est affiché sur l'écran de connexion, cinq mauvais codes
volontaires suffiraient. Écarté pour cette raison. Le pas suivant, s'il en faut
un, est le contrôle anti-robot (Turnstile) que Supabase sait activer.

---

## Les trois pièges rencontrés en vrai

Aucun banc ne pouvait les voir : ce sont des comportements de Supabase, pas du
code de l'application. Le double de test répond toujours ce qu'on attend de
lui, et toujours avec un statut de succès. Ils sont consignés ici parce qu'ils
se représenteront à la prochaine base montée de zéro.

**1. « Création impossible — réessaie » à chaque création de compte.**
Supabase refuse tout mot de passe de moins de 6 caractères. Le code d'un élève
en fait 4. L'application envoie donc `PREFIXE_CODE + code` — une chaîne
dérivée, toujours la même pour un code donné. Ce préfixe ne protège rien : il
satisfait une longueur minimale. Il doit être **identique** dans les trois
fichiers HTML et dans la fonction Edge ; un contrôle le vérifie.

**2. « Nouveau code de undefined : undefined ».**
L'exemple par défaut de Supabase était encore déployé sous le nom
`admin-eleve` — coller le code dans l'éditeur ne suffit pas, il faut cliquer
**Deploy**. Pour vérifier ce qui répond vraiment, depuis la console du
navigateur :

```js
(async () => {
  const r = await sb.functions.invoke('admin-eleve', { body:{ action:'ping', niveau:NIVEAU } });
  console.log('DATA :', JSON.stringify(r.data), 'ERREUR :', JSON.stringify(r.error));
})()
```

`{"message":"Hello …"}` = l'exemple par défaut. Une erreur **non-2xx** = la
bonne fonction, qui refuse une action inconnue.

**3. « Échec : réessaie » sans autre explication.**
Un refus de fonction Edge est un statut non-2xx, et `supabase-js` range alors
tout dans `error` : le motif écrit par la fonction restait dans le corps de la
réponse, que personne ne lisait. `motifFonction()` va l'y chercher.

---

## Les sauvegardes

Le plan gratuit de Supabase **ne fait aucune sauvegarde**. L'action
`.github/workflows/sauvegarde.yml` s'en charge : chaque **nuit du samedi au
dimanche**, elle exporte les données, les chiffre, et conserve le fichier
90 jours.

### Les deux secrets à poser une fois

Settings → Secrets and variables → Actions :

| Secret | Ce que c'est |
|---|---|
| `SUPABASE_SERVICE_KEY` | la clé **service_role** du projet (Project Settings → API) |
| `SAUVEGARDE_PASSPHRASE` | une phrase de passe longue, de votre choix |

⚠️ **Sans la phrase de passe, les sauvegardes sont définitivement illisibles.**
Personne — ni moi, ni GitHub, ni Supabase — ne peut les rouvrir. Rangez-la
dans votre gestionnaire de mots de passe, pas sur un papier.

Le chiffrement n'est pas un excès de prudence : **ce dépôt est public**, et les
fichiers produits par une action y sont téléchargeables par n'importe qui. En
clair, la sauvegarde — des prénoms d'élèves mineurs associés à leurs résultats
— serait un problème plus grave que celui qu'elle résout.

### Ce qui est sauvegardé, et ce qui ne l'est pas

| | |
|---|---|
| prénoms, notes, devoirs, réglages | ✅ sauvegardés |
| structure des tables et règles d'accès | déjà dans `supabase/migrations/` |
| **codes des élèves** | ❌ **non** — hachés par Supabase, un hachage ne se restaure pas |

Après une restauration, il faut donc **redonner un code à chaque élève**.
Quelques minutes ; les notes, elles, sont sauvées.

### Récupérer une sauvegarde

**Windows n'a pas `gpg`.** Une seule fois, dans PowerShell — puis fermer et
rouvrir la fenêtre, sinon la commande reste inconnue :

```powershell
winget install GnuPG.Gpg4win
```

Ensuite, à chaque fois : onglet **Actions** → **Sauvegarde** → une exécution →
section **Artifacts**, tout en bas → télécharger `sauvegarde-….zip` → le
décompresser. Puis, dans le dossier obtenu :

```bash
gpg -d sauvegarde.json.gpg > sauvegarde.json
```

Il demandera la phrase de passe. Le fichier obtenu s'ouvre dans n'importe quel
éditeur de texte.

⚠️ Les artefacts GitHub sont conservés **90 jours**, pas davantage : c'est le
maximum de la plateforme. En télécharger un de temps en temps — une fois par
trimestre suffit — et le garder ailleurs. Chiffré, il ne craint rien.

### Récupérer des notes perdues ou modifiées

C'est le cas courant, et il n'a rien à voir avec un sinistre : la base tourne,
les élèves travaillent, et une note manque ou paraît fausse. **On ne restaure
alors pas la base — on compare, puis on corrige ce qui doit l'être.**

**1. Poser les outils.** Coller le contenu de `supabase/restaurer.sql` dans
l'éditeur SQL de Supabase et l'exécuter. Il ne change rien : il installe trois
fonctions.

**2. Sortir les notes de la sauvegarde**, dans PowerShell, à côté de
`sauvegarde.json` :

```powershell
$s = Get-Content sauvegarde.json -Raw | ConvertFrom-Json
$s.donnees.resultats_1ere | ConvertTo-Json -Depth 20 | Set-Clipboard
```

**3. Regarder ce qui diffère** — ce geste ne modifie rien, et c'est souvent le
seul nécessaire :

```sql
select * from public.comparer('resultats_1ere', $j$
-- Ctrl+V ici
$j$::json);
```

| Verdict | Ce que ça veut dire |
|---|---|
| `MANQUANTE` | la sauvegarde l'a, la base ne l'a plus — note perdue |
| `DIFFÉRENTE` | les deux l'ont, avec des valeurs qui ne correspondent pas |
| `EN TROP` | passée après la sauvegarde — **normal**, pas une anomalie |

Les écarts de forme ne sont pas signalés : `8` et `8.0`, ou le même instant
écrit dans deux fuseaux, comptent pour identiques. Chaque ligne affichée est
un vrai écart — sauf la dernière, toujours présente, qui fait le compte :
« — N identique(s), N différente(s), N manquante(s), N en trop ». Seule, elle
dit que la base et la sauvegarde sont d'accord.

⚠️ **`DIFFÉRENTE` ne veut pas dire falsifiée.** La sauvegarde date du dimanche
précédent : un exercice refait depuis apparaît là, légitimement. Lisez les
valeurs avant de décider.

**4a. Remettre ce qui manque** — n'écrase rien, ne touche pas au travail fait
depuis :

```sql
select public.restaurer('resultats_1ere', $j$   … $j$::json);
```

**4b. Défaire une modification** — remet les notes à leur valeur de dimanche.
**Ce geste efface ce qui a été fait depuis** ; c'est pour cela qu'il demande un
mot de plus :

```sql
select public.restaurer('resultats_1ere', $j$   … $j$::json, true);
```

Avant un `true`, lancez une sauvegarde à la main (Actions → Sauvegarde → Run
workflow) : l'état d'aujourd'hui sera conservé, quoi qu'il arrive ensuite.

**5. Retirer les outils** quand c'est fini (voir la dernière étape ci-dessous).

Les élèves ne sont jamais touchés par cette procédure : seule la table de notes
nommée dans l'appel est concernée.

### Restaurer entièrement, après un sinistre

Comptez une demi-heure. Rien n'est difficile, mais l'ordre compte.

**1. Une base neuve.** Jouer **001** puis **002** (étapes 3 et 3 bis ci-dessus),
puis recréer le compte du professeur et sa ligne dans `professeurs`
(étapes 2 et 5). Ce compte porte un nouvel identifiant : c'est pourquoi la
table `professeurs` ne se restaure pas depuis la sauvegarde.

**2. Poser l'outil.** Coller le contenu de `supabase/restaurer.sql` dans
l'éditeur SQL et l'exécuter. Il ne restaure rien — il installe la fonction qui
va le faire, en désamorçant trois pièges qu'un simple `insert` laisse passer
(les comptes disparus, la séquence des identifiants, l'ordre des tables). Les
trois sont détaillés en tête du fichier.

**3. Sortir une table de la sauvegarde.** Dans PowerShell, dans le dossier où
se trouve `sauvegarde.json` :

```powershell
$s = Get-Content sauvegarde.json -Raw | ConvertFrom-Json
$s.donnees.eleves_1ere | ConvertTo-Json -Depth 20 | Set-Clipboard
```

**4. La remettre en place.** Dans l'éditeur SQL, coller entre les deux `$j$` :

```sql
select public.restaurer('eleves_1ere', $j$
-- Ctrl+V ici
$j$::json);
```

Il répond, par une seule ligne : `eleves_1ere : 8 ligne(s) remises en place,
séquence replacée`. La fin « séquence replacée » ne vient que pour
`eleves_1ere` et `resultats_1ere`, dont l'identifiant sort d'une séquence. Une
table par exécution : collés ensemble, plusieurs `select` ne montreraient que
la réponse du dernier.

**5. Recommencer pour chaque table**, en respectant cet ordre — les notes
désignent un élève, elles ne peuvent pas arriver les premières :

```
eleves  →  resultats  →  parametres
eleves_1ere  →  resultats_1ere  →  parametres_1ere
eleves_2nde  →  resultats_2nde  →  parametres_2nde
```

**6. Relier ou redonner les comptes.** Les élèves reviennent la colonne
`user_id` VIDE : leur ligne n'est plus rattachée à leur compte Supabase, et
tout ce que la base leur accorde « en propre » — notes, pause, signalements,
devoir sur papier — est refusé, la connexion continuant pourtant de marcher.
Deux cas :

- **Les comptes ont survécu** (la base a été restaurée mais `auth.users` n'a
  pas été touché — c'est le cas d'une restauration ordinaire) : coller
  **`relier-comptes.sql`** dans l'éditeur SQL et l'exécuter. Il recalcule le
  lien par l'adresse dérivée de la clé, sans changer aucun code. L'éditeur ne
  répond que « Success. No rows returned » : c'est normal.
- **Les comptes ont disparu aussi** : « Nouveau code » depuis l'onglet Élèves
  recrée le compte et pose le lien — l'élève reçoit un code provisoire.

**Qui reste à relier ?** Le script nomme les élèves qu'il n'a pas pu relier,
mais par des `NOTICE`, que l'éditeur n'affiche pas. Pour les voir, lancez
ENSUITE cette requête, seule — elle ne modifie rien :

```sql
select 'Terminale' as niveau, prenom from public.eleves where user_id is null
union all
select 'Première', prenom from public.eleves_1ere where user_id is null
union all
select 'Seconde', prenom from public.eleves_2nde where user_id is null
order by niveau, prenom;
```

Chaque ligne nomme un élève dont le compte n'existe plus : « Nouveau code »
pour lui. « No rows returned » : tous sont reliés. Jouée AVANT le script, la
même requête sert de diagnostic — aucune ligne veut dire que personne n'est
dé-relié, et que la panne vient d'ailleurs.

**7. Retirer les outils**, ils n'ont plus rien à faire dans la base :

```sql
drop function public.restaurer(text, json, boolean);
drop function public.comparer(text, json);
drop function public.memes_valeurs(jsonb, jsonb);
```

Cette marche à suivre est **jouée en entier à chaque `npm run test:base`**, sur
un PostgreSQL jetable : base neuve, migrations, sauvegarde d'essai remise en
place, puis vérification que les élèves ont retrouvé leurs identifiants, que
les notes ont retrouvé leur élève, et qu'un élève ajouté le lendemain ne se
heurte pas à un identifiant déjà pris.

### La lancer à la main

Sans attendre samedi : **Actions** → **Sauvegarde** → **Run workflow**.
C'est la façon de vérifier que les deux secrets sont bien posés.

---

## Ce que le banc vérifie, et ce qu'il ne vérifie pas

`npm run test:base` lève un PostgreSQL jetable, y rejoue cette migration et
vérifie ce que chaque rôle obtient réellement — visiteur, deux élèves, le
professeur. Il **ne touche jamais** votre projet.

Il ne voit pas, et personne ne verra à votre place :

- le réglage de l'authentification de l'étape 1 ;
- le déploiement de la fonction Edge ;
- le fait que `COURRIEL_PROF` corresponde à un compte réel.

**Éprouvez la connexion sur un compte d'essai avant de laisser entrer une
classe.** Créez un élève, notez son code, déconnectez-vous, reconnectez-vous
sous son nom, faites un exercice, et vérifiez que la note apparaît dans votre
tableau de bord.
