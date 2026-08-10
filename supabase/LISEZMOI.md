# Mettre la connexion côté serveur — mode d'emploi

Ce dossier contient tout ce qui doit être appliqué **dans Supabase**. Rien ici
ne part sur GitHub Pages : ce sont les pièces que le site ne peut pas installer
lui-même.

---

## Avant tout : la bascule ne peut pas être progressive

Le site ancien parle à une base ancienne, le nouveau à une base nouvelle. Il n'y
a pas d'état intermédiaire où les deux fonctionnent :

| Situation | Ce que voient les élèves |
|---|---|
| SQL appliqué, site pas encore fusionné | « Code incorrect » pour tout le monde |
| Site fusionné, SQL pas encore appliqué | Connexion impossible, création de compte en échec |
| Les deux faits | Le site marche — avec des codes tout neufs |

**Il faut donc faire les deux dans la même demi-heure**, et les élèves auront de
toute façon besoin de nouveaux codes. Un soir ou un jour de vacances, pas un
mardi à 10 h.

Prévoir : **30 minutes** pour les étapes 1 à 6, puis le temps de distribuer les
codes.

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

Dans **Authentication → Users → Add user** :

- adresse : la vôtre, ou n'importe laquelle — elle ne sert qu'à vous identifier ;
- mot de passe : **un vrai mot de passe**, pas `2709`. Il n'est plus dans la
  page, donc plus rien ne vous oblige à le garder court ;
- cochez **Auto Confirm User**.

Notez l'**UUID** du compte créé : il sert à l'étape 4.

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

---

## 6. Renseigner votre adresse dans les trois fichiers (2 min)

Ligne 10 de `secondes.html`, `premiere-specifique.html` et `terminale.html` :

```js
const COURRIEL_PROF = "professeur@exercices-interactifs.invalid";
```

Remplacez par l'adresse du compte créé à l'étape 2, dans **les trois fichiers**.
Puis fusionnez la pull request.

---

## 7. Redonner un code à chaque élève

Les anciens codes n'existent plus — ils ont été supprimés avec la colonne, et un
hachage ne se relit pas. Dans **Élèves** du tableau de bord, le bouton
**« Nouveau code »** en tire un et **l'affiche une seule fois**. Notez-le à ce
moment-là : personne, pas même vous, ne pourra le retrouver ensuite.

C'est voulu. Un code que le professeur peut relire est un code qu'un autre peut
lire aussi.

---

## Si quelque chose se passe mal

`migrations/001_annulation.sql` rouvre l'accès immédiatement.

Elle **ne rend pas** les anciens codes : ils n'existent plus. Elle vous ramène à
un site ouvert, avec des codes à redistribuer de toute façon — donc si vous en
êtes là, corriger en avant est presque toujours préférable.

Elle ne retire que les politiques `p_` : les vôtres, s'il y en avait, restent.

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
