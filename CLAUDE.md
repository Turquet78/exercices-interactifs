# Conventions du projet

Exercices de mathématiques interactifs pour trois niveaux, hébergés sur GitHub
Pages. Trois fichiers HTML **monolithiques** — HTML, CSS et JavaScript dans le
même fichier, sans étape de compilation :

| Fichier | Niveau | Tables Supabase |
|---|---|---|
| `secondes.html` | Seconde | `eleves_2nde`, `resultats_2nde` |
| `premiere-specifique.html` | Première | `eleves_1ere`, `resultats_1ere` |
| `terminale.html` | Terminale | `eleves`, `resultats` |

Les trois partagent un seul projet Supabase et la même fonction Edge
`corriger-definition` (aide par IA). Communication en français.

---

## Règles absolues

**1. `main` publie immédiatement — et seul Turquet décide du moment.** GitHub
Pages sert `main` : toute fusion met le site sous les yeux des élèves dans la
minute. Le travail se fait toujours sur une branche, puis passe par une pull
request que Claude prépare et teste (action « Contrôles » verte, modification
réellement exécutée — règle 3). Claude annonce alors « prêt à mettre en
ligne » et **attend que Turquet dise explicitement « mets en ligne »** (ou un
équivalent clair) dans la conversation ; Claude fusionne à ce moment-là,
vérifie la publication, et jamais avant (décision de Turquet, août 2026).
Jamais de poussée directe sur `main`.

**2. `npm test` avant toute proposition.** Aucune modification n'est poussée si
les contrôles échouent. `npm test` contrôle **les trois niveaux**, chacun selon
son profil (`tests/profils.js`). L'action GitHub `.github/workflows/controles.yml`
les rejoue tous les trois sur chaque pull request, une étape par fichier : elle
doit être verte avant fusion. Voir `tests/LISEZMOI.md`.

**3. Ne jamais livrer sans avoir exécuté.** Une vérification de syntaxe ne prouve
rien. Trois pannes en production sont passées à travers des contrôles statiques
parfaitement verts — leur point commun était que personne n'avait ouvert la page.

**4. Incrémenter `APP_VERSION`** à chaque modification. Ce numéro s'affiche dans
l'en-tête et permet de savoir d'un coup d'œil quelle version est ouverte.

---

## Pièges éprouvés

Chacun a coûté une panne en production. Ils ne se voient pas à la relecture.

**Bloc CSS tronqué** — une règle coupée déséquilibre les accolades et les
panneaux flottants restent affichés en permanence. Contrôlé par `npm test`.

**Supabase renvoie ses erreurs sans lever d'exception.** Toujours tester `error`
explicitement. Les colonnes `integer` échouent silencieusement si on y insère une
durée décimale : arrondir avant l'envoi.

**`<!DOCTYPE html>`** — son absence déclenche le mode quirks et casse la mise en
page sur mobile.

**MathLive** — la feuille de styles statique (`<style id="ml-static-css">`) est
indispensable au rendu des fractions hors des champs de saisie. Sans elle,
`\frac{25}{100}` s'affiche « 10025 », dénominateur d'abord, dans l'ordre du DOM.

**Fenêtres d'aide détachées** — sur ordinateur, les fenêtres « Soutien » et
« Question à l'IA » s'ouvrent dans une fenêtre indépendante et leur carte y est
déplacée. `document.getElementById` ne les trouve plus : la fonction `$` doit
chercher aussi dans `window.__fenetresDetachees`.

**Portage depuis `terminale.html`** — ne jamais extraire par script en filtrant
sur `function`, `const` et `let` : les affectations comme
`window.__fenetresDetachees = […]` et les redéfinitions de `$` sont invisibles à
ce filtre. Deux pannes sont nées exactement de là.

---

## Ajouter un exercice

Quatorze points de branchement. En oublier un ne provoque aucune erreur visible
— l'exercice fonctionne, mais l'aide, la reprise ou la note manquent.

1. `TESTS` — nom, icône, description, fonction de démarrage
2. `THEMES` — l'identifiant dans le bon sous-thème (la numérotation en découle)
3. `MENU` — pour le tableau du professeur
4. l'écran `<section class="screen" id="scr-…">`
5. `show()` — ajouter l'écran à `testScreens`
6. `liveCheckCurrent()` — correction en direct du mode soutien
7. `restartCurrentTest()` — bouton « Recommencer »
8. `resumeTest()` — reprise après une pause
9. la liste des fonctions de rendu enveloppées en fin de fichier (jetons + boutons IA)
10. `RAPPELS` — rappel de cours, obligatoire ; un `console.warn` signale l'oubli
11. `QIA_SUGG` — questions proposées dans la fenêtre d'aide
12. `conseilCtxCourant()` — description de l'exercice envoyée au modèle
13. `QIA_MODELES` — corrigé type généré par l'application (facultatif)
14. `details.test` à l'enregistrement du résultat, avec l'identifiant exact

Puis `npm test`.

---

## Énoncés

Chaque exercice tire sa formulation dans une table de variantes, et son contexte
concret dans une table de mises en situation. Deux principes :

**La variante et le contexte sont tirés à la génération**, puis rangés dans la
question (`q.v` et `q.ci`). Jamais au moment de l'affichage : l'énoncé changerait
sous les yeux de l'élève à chaque redessin, et à la reprise d'une pause.

**On range l'indice, jamais l'objet.** Les questions partent en base de données
pour la reprise après pause : elles doivent rester du JSON, sans fonction.

Une variante peut porter une condition (`si`) et un poids (`poids`) — les
tournures de soldes ne sortent qu'en euros, les mises en situation sortent plus
souvent que les formulations abstraites. Un contexte peut porter `nOk`, qui
écarte les nombres rendant la scène absurde : un loyer à 44 €, une classe de
9 000 élèves.

---

## Vérifier

```bash
npm install          # une seule fois
npm test             # les trois niveaux
npm run test:secondes # un seul, quand on travaille dessus
```

**Un bug trouvé devient un contrôle.** Sinon il reviendra. Les trois pannes qui
ont motivé ce banc de test y sont chacune couvertes par une ligne.

**Un contrôle qui ne s'applique pas se déclare, il ne se retire pas.** Les trois
fichiers ne savent pas faire les mêmes choses : `tests/profils.js` dit pour
chacun ce que le banc doit piloter, et la liste `lacunes` de son profil énumère
ce qui lui manque. Ces manques s'affichent à chaque exécution. Un contrôle
supprimé en silence rend le banc vert sur un fichier qu'il ne vérifie plus.
