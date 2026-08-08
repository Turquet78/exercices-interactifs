# Vérifications automatiques

## Lancer les tests

```bash
npm install     # une seule fois, installe jsdom
npm test        # vérifie les TROIS niveaux, l'un après l'autre
```

Un seul niveau à la fois :

```bash
npm run test:premiere
npm run test:secondes
npm run test:terminale
```

La commande affiche une ligne par contrôle et se termine par un verdict. Elle
renvoie le code 0 si tout passe, 1 sinon — ce qui permet de la brancher sur une
action GitHub pour bloquer une fusion qui casserait quelque chose.
`.github/workflows/controles.yml` contrôle bien les trois fichiers, chacun dans
sa propre étape.

## À quoi ça sert

Les applications sont des fichiers HTML uniques de plusieurs milliers de lignes,
sans étape de compilation. Rien ne signale une erreur avant qu'un élève ne tombe
dessus. Ces tests chargent la page dans un navigateur simulé et **cliquent
réellement** sur les boutons.

Trois pannes ont motivé leur écriture, toutes invisibles à la relecture :

| Panne | Symptôme | Ce qui manquait |
|---|---|---|
| v43 | les boutons d'aide ne faisaient rien | `window.__fenetresDetachees` non initialisé |
| v44 | les fenêtres s'ouvraient, puis plus rien | `$` ignorait les fenêtres détachées |
| v46 | `25/100` s'affichait « 10025 » | la feuille de styles MathLive |

Chacune passait la vérification de syntaxe sans broncher. Le banc de test les
détecte toutes les trois.

## Trois fichiers, un seul banc : les profils

Les trois niveaux ne se ressemblent pas. La Seconde n'a pas de fenêtre
« Question à l'IA ». La Terminale place ses boutons d'aide en ligne au lieu
d'une rangée, et sa `liveCheckCurrent` est vide parce que la correction du
soutien passe par `submitAnswer`. Chaque fichier a ses propres générateurs.

`tests/profils.js` déclare, pour chaque fichier, ce qu'il sait faire : quel
exercice le banc doit piloter, quel sélecteur trouve les boutons d'aide, quels
contrôles s'appliquent. **Ajouter un niveau, c'est ajouter un profil.**

Un contrôle inapplicable s'affiche `○ non applicable` avec sa raison, et le
manque correspondant est répété en fin d'exécution sous « CE QUE CE NIVEAU N'A
PAS ENCORE ». C'est délibéré : un contrôle retiré en silence est pire que pas de
contrôle du tout, parce qu'il rend le banc vert sur un fichier qu'il ne vérifie
plus.

Une erreur JavaScript imprévue fait désormais **échouer un contrôle** au lieu
d'interrompre le banc. Avant, un `ReferenceError` parti d'un `setTimeout` tuait
le processus avant tout verdict : c'est ainsi que la Seconde et la Terminale
n'ont jamais pu être vérifiées jusqu'au bout, alors même que la famille 1 y
signalait déjà de vrais défauts.

## Ce qui est contrôlé

**1. Structure** — syntaxe de chaque bloc `<script>`, équilibre des accolades de
chaque bloc `<style>`, existence de tous les écrans visés par `show()`,
définition de toutes les fonctions appelées depuis un attribut `onclick`,
**examen de `error` sur chaque appel Supabase** (y compris les appels dont le
retour n'est même pas recueilli — ceux-là échappaient au contrôle précédent),
et **arrondi des durées** avant envoi vers une colonne `integer`.

**2. Démarrage** — la page se charge sans erreur JavaScript, le numéro de
version est lisible, et chaque exercice de `TESTS` a bien une fonction de
démarrage.

**3. Boutons d'aide** — l'exercice témoin s'affiche, les boutons d'aide
apparaissent en mode soutien, la fenêtre « Question à l'IA » s'ouvre
**détachée** (le cas qui a échoué trois fois, car sur ordinateur c'est le chemin
par défaut), la réponse s'affiche dans le dialogue, le bouton Soutien produit un
conseil, le contexte envoyé au modèle existe, et les styles de fraction sont
présents.

**4. Exercices** — la correction en direct colore les cases au bon moment, la
pause conserve le devoir maison et restaure les saisies, sa durée part entière,
« Recommencer » relance le bon exercice, chaque exercice possède son rappel de
cours, et les générateurs produisent des milliers de questions conformes.

## Ajouter un contrôle

Un bug trouvé devrait toujours devenir un contrôle, sinon il reviendra. Ouvrez
`tests/verifier.js`, ajoutez une ligne `verifier('ce qui doit être vrai',
condition, 'détail en cas d\'échec')` dans la section qui convient. Si le
contrôle a besoin d'exécuter du code dans la page, passez par
`verifierEval(w, intitulé, code, juge)` : une exception y devient un échec
lisible au lieu d'une pile.

Si le contrôle ne vaut que pour certains niveaux, ajoutez le réglage
correspondant dans `tests/profils.js` plutôt qu'un `if` sur le nom du fichier —
et, pour les niveaux qui ne l'ont pas, écrivez la raison dans leur liste
`lacunes`.

## Éprouver le banc lui-même

Un banc qui ne dit jamais « non » ne prouve rien. Pour vérifier qu'il détecte
encore, cassez volontairement une copie du fichier — retirer un `{error}`,
supprimer une accolade fermante d'un bloc `<style>`, effacer le bloc
`<style id="ml-static-css">`, appeler une fonction inexistante dans une fonction
de rendu — puis relancez : chacune de ces quatre mutations doit produire un
échec nommé, et le banc doit toujours rendre son verdict.

Le fichier `tests/harnais.js` s'occupe du chargement. Il remplace MathLive, qui
est un module ESM distant que le navigateur simulé n'exécute pas, par un élément
`<math-field>` minimal exposant `value`, `getValue` et `setValue`. **Sans cette
substitution, toute lecture de `.value` renvoie `undefined` et les tests
remontent de faux échecs** — l'erreur a été commise, d'où cet avertissement.
