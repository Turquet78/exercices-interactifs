# Vérifications automatiques

## Lancer les tests

```bash
npm install     # une seule fois, installe jsdom
npm test        # vérifie premiere-specifique.html
```

Pour les autres niveaux :

```bash
npm run test:terminale
npm run test:secondes
```

La commande affiche une ligne par contrôle et se termine par un verdict. Elle
renvoie le code 0 si tout passe, 1 sinon — ce qui permet de la brancher sur une
action GitHub pour bloquer une fusion qui casserait quelque chose.

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
| v75 | un double clic sur « Voir mes résultats » enregistrait le résultat en double | un verrou de réentrance sur les clôtures |

Chacune passait la vérification de syntaxe sans broncher. Le banc de test les
détecte toutes — la quatrième a été trouvée par la simulation d'élèves
ci-dessous avant qu'un élève ne tombe dessus.

## Ce qui est contrôlé

**1. Structure** — syntaxe de chaque bloc `<script>`, équilibre des accolades de
chaque bloc `<style>`, existence de tous les écrans visés par `show()`, et
définition de toutes les fonctions appelées depuis un attribut `onclick`.

**2. Démarrage** — la page se charge sans erreur JavaScript, et le numéro de
version est lisible.

**3. Boutons d'aide** — la rangée apparaît en mode soutien, la fenêtre
« Question à l'IA » s'ouvre **détachée** (le cas qui a échoué trois fois, car
sur ordinateur c'est le chemin par défaut), la réponse s'affiche dans le
dialogue, le bouton Soutien produit un conseil, le contexte envoyé au modèle
existe pour les huit exercices, et les styles de fraction sont présents.

**4. Exercices** — la correction en direct colore les cases au bon moment (une
fraction attend ses deux parties), rien ne se colore en entraînement, les cinq
générateurs de pourcentage produisent 5 000 questions conformes chacun, et
chaque exercice possède son rappel de cours.

## Simulation en conditions réelles

`tests/simulation_eleves.js` va plus loin que le banc : cinq élèves fictifs
(Test-Lea, Test-Tom, Test-Zoe, Test-Max, Test-Eva) déroulent de vrais parcours
— inscription, exercices, erreurs, pause et reprise, évaluation — dans un vrai
navigateur, contre la **vraie base Supabase**. C'est elle qui a trouvé la panne
v75. Comme elle écrit en base, elle ne tourne **pas** dans l'action GitHub :
on la lance à la main, depuis un environnement dont le réseau autorise
`*.supabase.co`.

```bash
npm install --no-save playwright-core mathlive @supabase/supabase-js   # une fois
node tests/simulation_eleves.js             # simule puis nettoie tout
node tests/simulation_eleves.js --garder    # conserve comptes et résultats
node tests/simulation_eleves.js --nettoyer  # retire les comptes Test-*
```

Après `--garder`, les cinq comptes restent visibles sur l'écran de connexion du
site et dans le tableau du professeur ; lancer `--nettoyer` avant toute
nouvelle simulation, sinon les inscriptions échouent (prénoms déjà pris).

## Ajouter un contrôle

Un bug trouvé devrait toujours devenir un contrôle, sinon il reviendra. Ouvrez
`tests/verifier.js`, ajoutez une ligne `verifier('ce qui doit être vrai',
condition, 'détail en cas d\'échec')` dans la section qui convient.

Le fichier `tests/harnais.js` s'occupe du chargement. Il remplace MathLive, qui
est un module ESM distant que le navigateur simulé n'exécute pas, par un élément
`<math-field>` minimal exposant `value`, `getValue` et `setValue`. **Sans cette
substitution, toute lecture de `.value` renvoie `undefined` et les tests
remontent de faux échecs** — l'erreur a été commise, d'où cet avertissement.
