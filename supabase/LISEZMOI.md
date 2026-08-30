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

Elle ne fait qu'aiguiller : trois boutons vers les trois tableaux de bord. Elle
ne contient aucun secret, n'appelle pas Supabase, et n'est liée depuis aucune
page d'élève — un contrôle du banc l'interdit sur les trois fichiers.

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

Elle commence par **afficher l'état actuel** de vos neuf tables — RLS active ou
non, politiques déjà en place. **Lisez ces lignes.** Si des politiques à vous y
figurent, elles ne seront pas touchées : la migration ne pose et ne retire que
les siennes, préfixées `p_`.

Ce qu'elle fait ensuite :

- ajoute une colonne `user_id` à chaque table d'élèves ;
- **supprime la colonne `pin`** — c'est elle qui partait en clair dans chaque
  navigateur ;
- active la RLS sur les neuf tables et pose 30 politiques.

Elle se termine en réaffichant l'état obtenu, et **échoue bruyamment** si une
table est restée sans RLS ou si une colonne `pin` subsiste.

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
et exécutez-le. Il nomme chaque politique retirée, laisse en place tout ce qui
n'est pas manifestement grand ouvert, et **échoue** s'il en subsiste une.

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
le droit pour la suite, elle ne nettoie pas le passé. Collez
**`menage-brouillons.sql`** dans l'éditeur SQL et exécutez-le.

Il travaille en trois temps, et le premier ne touche à rien :

1. **ce qu'il y a** — par table : lignes, notes, brouillons, et combien datent
   de moins de 24 h. Si les nombres vous surprennent, arrêtez-vous là ;
2. **le ménage** — les seules lignes dont `details->>'state'` vaut `paused` ;
3. **ce qu'il reste** — « brouillons » à zéro, « notes » identique au point 1.

**Aucune note n'est touchée**, et ce n'est pas une promesse : une note n'a pas
de champ `state`, le filtre ne peut pas l'atteindre, et l'étape 1 le montre
chiffres en main avant toute suppression.

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
fichier se termine donc par un contrôle qui **échoue bruyamment** si le bucket
manque, s'il est resté public, ou s'il n'a pas ses quatre politiques. Lisez la
ligne `NOTICE` qu'il affiche.

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

**Une fois son code choisi, il est renvoyé à l'écran des prénoms** et doit se
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
écrit dans deux fuseaux, comptent pour identiques. Ce qui s'affiche est un vrai
écart.

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

Il répond `eleves_1ere : 8 ligne(s) restaurée(s), séquence replacée`.

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
  lien par l'adresse dérivée de la clé, sans changer aucun code, et liste les
  élèves qu'il n'a pas pu relier.
- **Les comptes ont disparu aussi** : « Nouveau code » depuis l'onglet Élèves
  recrée le compte et pose le lien — l'élève reçoit un code provisoire.

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
