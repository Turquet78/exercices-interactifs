# Conventions du projet

Exercices de mathématiques interactifs pour trois niveaux, hébergés sur GitHub
Pages. Trois fichiers HTML **monolithiques** — HTML, CSS et JavaScript dans le
même fichier, sans étape de compilation :

| Fichier | Niveau | Tables Supabase |
|---|---|---|
| `secondes.html` | Seconde | `eleves_2nde`, `resultats_2nde`, `signalements_2nde` |
| `premiere-specifique.html` | Première | `eleves_1ere`, `resultats_1ere`, `signalements_1ere` |
| `terminale.html` | Terminale | `eleves`, `resultats`, `signalements` |

Les trois partagent un seul projet Supabase et la même fonction Edge
`corriger-definition` (aide par IA). Communication en français.

---

## Règles absolues

**1. `main` publie immédiatement — et Claude met en ligne dès que c'est
possible.** GitHub Pages sert `main` : toute fusion met le site sous les yeux
des élèves dans la minute. Le travail se fait toujours sur une branche, puis
passe par une pull request que Claude prépare et teste (action « Contrôles »
verte, modification réellement exécutée — règle 3). Dès que tout est vert,
Claude **fusionne lui-même, sans attendre de feu vert**, puis vérifie la
publication (décision de Turquet, septembre 2026 : « à partir de maintenant,
toujours mettre en ligne automatiquement dès que c'est possible »). Elle
remplace la règle d'août 2026, qui faisait attendre un « mets en ligne »
explicite. Jamais de poussée directe sur `main`, et jamais de fusion sur des
contrôles rouges : « dès que c'est possible » veut dire « dès que c'est vert ».

**Et Claude ne joint plus le fichier HTML de la branche** (même décision) : la
page se regarde en ligne, une fois publiée. Le compte rendu dit ce qui a
changé, ce qui a été exécuté, et ce qu'aucun banc ne voit.

**2. `npm test` avant toute proposition.** Aucune modification n'est poussée si
les contrôles échouent. `npm test` contrôle **les trois niveaux**, chacun selon
son profil (`tests/profils.js`). L'action GitHub `.github/workflows/controles.yml`
les rejoue tous les trois sur chaque pull request, une étape par fichier : elle
doit être verte avant fusion. Voir `tests/LISEZMOI.md`.

**3. Ne jamais livrer sans avoir exécuté.** Une vérification de syntaxe ne prouve
rien. Trois pannes en production sont passées à travers des contrôles statiques
parfaitement verts — leur point commun était que personne n'avait ouvert la page.
`npm run test:navigateur` ouvre les trois pages dans un vrai Chromium et fait un
exercice de bout en bout : c'est le seul banc qui voit ce qui s'affiche.

**4. Incrémenter `APP_VERSION`** à chaque modification. Ce numéro s'affiche dans
l'en-tête et permet de savoir d'un coup d'œil quelle version est ouverte.

---

## Ce que TOUT exercice doit respecter

Les mêmes défauts revenaient exercice après exercice — la taille des cases,
l'alignement d'un signe sur un trait de fraction, une case juste qui rougit —
parce que chaque règle était écrite au moment où elle était apprise, dans le
coin où elle était apprise, et tenue par un contrôle qui ne regardait que cet
exercice-là (constat de Turquet, août 2026).

**Une règle valable partout doit être tenue par un contrôle qui va PARTOUT.**
C'est la seule chose qui empêche la répétition : pas la vigilance, pas la
relecture. Chacune des règles ci-dessous est donc vérifiée sur TOUS les
exercices, par un contrôle greffé sur la visite qui les ouvre un par un dans
les deux modes (`tests/navigateur.js`, section 9). Un exercice ajouté demain est
couvert sans rien avoir à déclarer.

| Règle | Ce qu'elle empêche | Contrôle |
|---|---|---|
| Une case où l'élève écrit a la **taille des nombres qui l'entourent** | la réponse de l'élève passe pour une note en bas de page | « les cases de saisie ont la taille des nombres qui les entourent » |
| Un **signe posé à côté d'une fraction tombe sur son trait** | le « + » monte au-dessus du trait, la ligne se lit de travers | « un signe posé à côté d'une fraction tombe sur son trait » |
| **Une case vide ne rougit jamais** à la vérification | l'élève croit avoir faux là où il n'a rien écrit | « aucune case laissée vide ne rougit à la vérification » |
| Une case juste se marque **`ok`**, jamais `good` | la note affichée ne la compte pas | « chaque exercice à cases compte ses cases justes » |
| Chaque exercice a son **bouton d'aide IA** | l'aide est écrite, rien n'y mène | « le bouton d'aide IA est présent sur chaque exercice » |
| Aucune référence **`{identifiant}`** ne reste affichée | l'élève lit des accolades | « aucune référence {identifiant} ne reste affichée à l'élève » |
| L'écran d'un exercice prend **toute la largeur**, et ses rangées ne se replient pas | une chaîne d'égalités se lit comme trois calculs séparés | « aucune rangée ne se replie » |
| Le **clavier mathématique** est atteignable sur tout écran à champ mathématique | sur tablette, l'élève ne peut plus rien écrire | « le clavier mathématique est atteignable sur tout écran à champ mathématique » |
| Le **calcul écrit en tête de rangée** a la taille de sa rangée | l'énoncé de la chaîne se lit comme une note de bas de page devant les cases | « le calcul en tête de rangée s'écrit à la taille de sa rangée » |
| La vérification peint le **juste en BLEU**, le faux en rouge, la **correction en VERT** | l'élève ne distingue plus sa réponse juste de la correction écrite par la page | « les règles .ok sont bleues, .sol et .mf-cor vertes, .bad rouges » |
| Les questions d'une séance se tirent par **`distinctes()`** — jamais deux fois les mêmes données | l'élève refait le même calcul dans la même séance | « aucune séance ne pose deux fois la même question » (banc principal, `tests/verifier.js`) |

**Les couleurs de la vérification ont changé en août 2026** (décision de
Turquet) : ce qui est JUSTE se peint en **bleu**, ce qui est faux reste en
rouge, et la **correction** — la bonne réponse écrite par la page — est
**verte**. Avant, juste était vert et correction bleue : les paragraphes plus
anciens de ce fichier qui disent « la correction en bleu » ou « une copie
verte » racontent l'histoire avec les couleurs de leur époque — la RÈGLE
qu'ils enseignent reste vraie, seule l'encre a changé. Les classes, elles,
n'ont pas bougé : `ok`, `bad`, `sol` — c'est la feuille de styles qui a
tourné, et les étiquettes internes des contrôles (`peint()` rend 'vert' pour
`ok`) parlent toujours des CLASSES.
Ce qui a bougé AVEC les couleurs, parce que la sémantique l'exigeait : les
**révélations de la Terminale** (tvi, ef, eq, rc, tg, tx, ec, suites) ne
repeignent plus tout l'écran en « juste » — la case que l'élève avait juste
garde son `ok` bleu, celle qu'il avait fausse ou vide reçoit la valeur et la
classe `sol`, verte ; la note partielle relue à l'écran devient plus vraie, et
le garde-fou de `ptsRep` reste en ceinture. Même règle sur les **QCM à
cartes** (itq, ing, afq) et le plus petit ensemble (pge) : la bonne réponse
CHOISIE est bleue, la bonne réponse MONTRÉE est verte — deux familles ont
gagné leur règle `.sol` ce jour-là. Les pastilles ✓/✗, les messages de
verdict (`good`/`bad` sur le texte) et les marqueurs « fait » restent verts :
la demande porte sur les cases, et ces exceptions sont NOMMÉES dans le
contrôle. Le contrôle vit dans le banc navigateur (« 9 bis ») : il relit
CHAQUE règle CSS de verdict, résout ses `var(--…)` et classe chaque encre par
sa dominante — une famille ajoutée demain entre dans la feuille de styles,
donc dans le contrôle, sans rien déclarer. Éprouvé par sabotage des deux
côtés (un `.ok` reverdi, un `.sol` rebleui). Un piège de banc s'y est
montré : depuis l'imbrication CSS, TOUTE règle porte un `cssRules` (souvent
vide, mais truthy) — une récursion qui teste ce champ pour descendre dans les
`@media` avale alors chaque règle sans la lire, et le contrôle mesure zéro.
C'est son second bord (« la convention a des règles à tenir ») qui l'a
attrapé, à la première exécution : un contrôle qui n'a rien à mesurer ne
mesure rien, et doit le dire. Le **liseré bleu** de
{croiser-denominateurs} est devenu **violet** (`--crd-a`) : un liseré bleu à
côté de cases justes bleues aurait dit autre chose que ce qu'il dit.

**Trois autres règles ne se vérifient pas encore partout**, et le dire vaut
mieux que de le taire :

* **Une case juste ne rougit pas parce qu'une AUTRE est vide ou fausse.** Il
  faudrait, pour chaque exercice, savoir écrire une copie juste — ce que seul
  l'exercice témoin de chaque profil sait faire aujourd'hui (`navigateur.repondre`).
  Le bord voisin, lui, est tenu partout : la case vide qui rougit.
* **Le message d'erreur dit la vérité.** « Il faut le MÊME dénominateur »
  devant une copie dont il manque sept cases est un mensonge, et rien ne le
  mesure.
* **La note enregistrée est celle qui s'affiche.** Le contrôle des cases justes
  compare ce que la page a peint ; il ne relit pas ce qui part en base.

## Pièges éprouvés

Chacun a coûté une panne en production. Ils ne se voient pas à la relecture.

**Ce fichier ne porte que la RÈGLE ; la chronique vit dans `docs/journal/`** —
pourquoi chaque règle existe, ce qu'elle a coûté, par quel sabotage elle a été
éprouvée. Elle est dans le dépôt, entière et greppable, et rien n'en a été
réécrit : elle a seulement cessé d'être rechargée à chaque tour. **Avant de
toucher à un exercice, lis le fichier de son thème** ; avant de toucher à une
règle ci-dessous, lis le paragraphe qui la porte :
`grep -n "les premiers mots" docs/journal/*.md`.

### Infrastructure, comptes et base de données

`docs/journal/01-infrastructure-supabase.md`

- **Bloc CSS tronqué**
- **Supabase renvoie ses erreurs sans lever d'exception.**
- **`<!DOCTYPE html>`**
- **`esc()` ne protège pas un attribut `onclick`.**
- **L'authentification vit dans Supabase, pas dans la page.**
- **Les trois niveaux n'ont pas le même type d'identifiant.**
- **Une suppression que RLS refuse n'est pas une erreur.**
- **Une politique RLS grande ouverte annule toutes les autres.**
- **Un élève prévenu trop tard n'est pas prévenu.**
- **Supabase refuse tout mot de passe de moins de 6 caractères.**
- **Les codes font 6 chiffres, et la limitation de cadence de Supabase est le seul rempart.**
- **`DOMAINE_COMPTES` et `PREFIXE_CODE` sont écrits à deux endroits que rien ne relie**
- **La fonction Edge portait les gestes les plus lourds sans qu'aucun banc ne l'exécute.**
- **Une borne posée côté serveur coupe l'aide sans le dire.**
- **La fonction Edge ne se met jamais à jour toute seule.**
- **Renommer un élève ne passe PAS par la fonction Edge, et c'est la leçon du paragraphe précédent prise à l'envers.**
- **Une sauvegarde remise en place casse la Première le lendemain.**
- **Un élève dé-relié se connecte parfaitement — et tout ce qui est à lui est refusé.**
- **Le plan gratuit de Supabase ne sauvegarde rien.**
- **Supabase ne rend jamais plus de 1000 lignes par requête — et il coupe EN SILENCE.** Toute lecture d'une table de résultats passe par `lireToutes()`.

### Conventions d'écran : énoncé, numéro, saisie, signalement

`docs/journal/02-conventions-ecran.md`

- **La classe de l'énoncé pose une étiquette « Énoncé ».**
- **Le numéro de l'exercice est en tête de son écran, et c'est `show()` qui l'y met.**
- **Les numéros d'exercice n'existent nulle part.**
- **Une copie d'écran jointe est FACULTATIVE, et tout le reste en découle.**
- **Un signalement d'élève est du texte libre tapé par un mineur, et le rejeu se fait sous le compte du professeur.**
- **Le professeur RÉPOND à un signalement, et c'est la lecture qu'il a fallu renverser.**
- **La case où l'élève ÉCRIT ne se colore pas.**
- **La case rouge propose de COMPRENDRE l'erreur — et l'explication ne part que sur un clic.**
- **Puis la bulle est venue À CÔTÉ de la case, une flèche pointée sur elle.**
- **Puis la bulle GLISSE, et se RESSERRE plutôt que de retourner au coin.**
- **Puis la VÉRIFICATION a levé la bulle — et c'est la partie Algorithmique qui l'a montré.**
- **Puis la bulle a SUIVI la case que l'élève regarde — et le garde a rendu la main à la VÉRIFICATION.**
- **`numeros()` ne passe que par trois entonnoirs.**

### Verdicts, juges locaux et relecture par l'IA

`docs/journal/08-verdicts-et-juges.md`

- **Les phrases qui commentent une vérification par l'IA sont VERTES quand c'est bon, ROUGES quand c'est faux**
- **Et la même règle était PERDUE en Première et en Terminale — par deux portes différentes.**
- **Un verdict arithmétique ne se confie pas à un modèle.**
- **Un résidu invisible rend fausse une réponse juste.**
- **Le terme entier recopié dans une case de coefficient se NOMME.**

### Devoirs, fiches, notes et carnet du professeur

`docs/journal/09-devoirs-et-notes.md`

- **Une case juste se marque `ok`, jamais `good`.**
- **Deux exercices peuvent partager un moteur — mais pas leur identité.**
- **Un devoir peut allonger la séance des tables, dans des bornes.**
- **Les fiches de travail en classe sont des devoirs sous un autre nom — et c'est UNE table qui le dit.**
- **Deux réglages par exercice d'un devoir : le nombre de questions, et le plafond du soutien**
- **Sur le parcours du 1.6 (Première), « Questions » règle CHAQUE NIVEAU — la coupe générique y faisait pire que rien.**
- **LE BARÈME SUIT LA COUPE — sans quoi une copie PARFAITE est comptée fausse.**
- **Et les notes DÉJÀ enregistrées se réparent — celles qu'on peut PROUVER.**
- **La note d'un DEVOIR ENTIER se pose à la main — en Terminale.**
- **Un exercice BONUS vaut 1 point, et ne fait jamais dépasser le maximum.**
- **Puis le mot « BONUS » s'est ÉCRIT, et partout où l'exercice se montre.**
- **La Seconde et la Première ne changent pas, et c'est nommé**
- **Le carnet de notes du professeur : une moyenne par élève, un devoir par colonne.**
- **Supprimer un devoir ne perd plus ses notes : il s'ARCHIVE.**
- **Une fiche de travail se fait DANS L'ORDRE ; un devoir reste tout ouvert.**
- **Un devoir demande une fois chaque exercice, et tous sont ouverts.**
- **La note d'une FICHE se lit SUR 20 — celle d'un devoir reste en points bruts.**
- **L'ordre des exercices d'un DEVOIR se règle en Terminale — l'affichage, jamais un verrou.**
- **Et la Seconde a suivi — le ruban vaut pour les DEUX familles, le verrou pour une seule.**
- **Les TRAVAUX FACULTATIFS sont la seconde famille de devoirs de la Terminale — gérés comme les devoirs, rangés à part.**
- **Un élève connecté dans un autre onglet CHASSE la session du professeur, et la base répond 42501.**
- **L'écran du bilan ne bouge plus quand le professeur pose une note.**
- **Et la note du DEVOIR ENTIER est une note, elle aussi.**

### Aides, rappels, mise en page et navigation

`docs/journal/11-aides-et-interface.md`

- **Les identifiants, eux, ne se renomment jamais.**
- **Sans balise `<form>`, le gestionnaire de mots de passe de Chrome fouille la page entière.**
- **Le bouton qui MÈNE à l'aide.**
- **« Montre-moi un exemple de rédaction de cet exercice. » est proposée partout.**
- **Le contexte de l'exercice part au modèle — et la clause de secret va avec.**
- **Et en TERMINALE, quatre exercices n'envoyaient que leur énoncé.**
- **Le modèle parle simplement, sans qu'on le lui demande.**
- **Un indice posé NU dans un conteneur flex remonte sur la ligne de sa lettre.**
- **Une case où l'élève écrit a la taille des nombres qui l'entourent.**
- **Une fraction se lit empilée, ou elle ne se lit pas.**
- **Il n'y a plus aucun bouton « Explique-moi plus simplement ».**
- **Un bouton d'une fenêtre DÉTACHÉE ne trouve pas sa fonction tout seul.**
- **MathLive**
- **Un cadre prend la largeur de son plus large enfant — souvent son énoncé.**
- **Le bouton des tables n'est proposé que là où il SERT**
- **La fenêtre des tables de multiplication a deux bords opposés.**
- **Un enchaînement d'égalités se lit d'un trait.**
- **Puis l'étage des PARTIES est venu, et c'est le thème des Fonctions qui l'a réclamé.**
- **UN « = » NE SE SÉPARE JAMAIS DE LA CASE QU'IL ANNONCE.**
- **ET UN DÉFAUT EST PARTI EN LIGNE AVEC CE CORRECTIF — du CODE affiché à l'élève.**
- **Et le contrôle s'est pris en défaut deux fois avant la page.**
- **Une somme de fractions s'écrit en une seule ligne, et l'entier est un maillon.**
- **Et le CADRE lui-même prenait la colonne, pas l'écran.**
- **Le contrôle tient les deux bords, et n'en tenir qu'un ne tient rien**
- **La fenêtre « Soutien » se saisit n'importe où.**
- **Fenêtres d'aide détachées**
- **Une fenêtre d'aide FERMÉE doit se rouvrir — et « est-elle fermée ? » n'a pas de réponse au moment où on la pose.**

### Séances : pause, abandon, branchements oubliés

`docs/journal/12-seances-et-branchements.md`

- **Portage depuis `terminale.html`**
- **Un brouillon de pause désigne quatre choses, pas une.**
- **Abandonner ne pose aucune note, et n'efface que la pause de son mode.**
- **Cinq oublis silencieux en ajoutant un exercice.**

### Cours en PDF, porte du professeur et portail

`docs/journal/13-professeur-et-portail.md`

- **Un PDF déposé vit à deux endroits, et le second se perd en silence.**
- **Ces PDF ne s'affichent PAS dans cette application, mais sur le portail**
- **La porte du professeur n'a plus de poignée.**

### Clavier mathématique, pavé numérique et tablettes

`docs/journal/15-clavier-et-tablette.md`

- **Huit écrans de la Terminale n'offraient aucun bouton pour le clavier mathématique.**
- **Sur tablette, le clavier du système recouvre la moitié de l'écran pour taper trois chiffres.**
- **Le pavé compact de la Première sert aussi ses cases MathLive — et change de forme avec l'orientation.**
- **Puis le paysage est revenu à UNE rangée**
- **Puis les commandes du bas ont rejoint le pavé**
- **Puis le pavé est devenu AUSSI LARGE QUE L'ÉCRAN LE PERMET.**
- **La touche « ⏎ » du clavier à l'écran VALIDE — et en paysage, le clavier tient sur DEUX rangées.**
- **Puis, en PORTRAIT sur une tablette, le clavier tient sur TROIS rangées.**
- **Puis la Seconde, le jour même : « fais pareil pour la Seconde ».**
- **Et la TERMINALE, le lendemain : « fais pareil pour la terminale ».**
- **Sur tablette, la feuille de calcul libre écrit plus petit.**
- **La touche « = » est sur le clavier mathématique à l'écran**
- **Sur un TÉLÉPHONE en portrait, les touches du clavier mathématique sont RÉDUITES — et ses deux couches se nomment « clavier A » et « clavier B ».**
- **Puis le clavier de la Terminale s'est partagé en deux couches lisibles, et ses touches ont maigri sur tablette.**
- **Puis la TABLETTE COUCHÉE a pris la forme courte, et un exercice sur les limites a rendu ses quatre touches au clavier A.**
- **Une case où l'élève écrit une LIMITE est un champ mathématique — le clavier du 3.5.**
- **Sur tablette, la page s'installe comme une application — et sur tablette seulement.**
- **Sur tablette, la police de TOUTE la page est réduite à 90 % — par une seule règle.**
- **Puis, sur tablette, la CHAÎNE À NOMBRES a écrit plus petit que le reste — la case et ce qui l'entoure, du même facteur.**
- **Et un défaut d'à côté s'est vu en mesurant : le 2.5.2 écrivait ses cases trois fois plus petites que ses nombres.**
- **Puis la tablette a proposé un RACCOURCI, pas une installation — et le manifeste n'y était pour rien.**
- **Puis « ne marche toujours pas » — et la tablette a fini par dire le contraire, à condition de lui demander à ELLE.**
- **Puis la barre du bas a disparu — en PREMIÈRE seulement, et le prix est nommé.**
- **Et la bande du bas appartient au SYSTÈME : la Première y descendait.**
- **LE CLAVIER ANCRÉ PREND LE BAS, LES COMMANDES MONTENT EN HAUT.**
- **Là où l'élève rédige en MOTS, le clavier C porte les lettres.**

### Vérification, bancs de test et numérotation des sections

`docs/journal/17-verification-et-bancs.md`

- **La même erreur, huit fois, n'est pas huit mesures.**
- **Deux bancs jsdom ne se lancent pas EN MÊME TEMPS.**
- **Un bug trouvé devient un contrôle.**
- **Une clé écrite deux fois dans `tests/profils.js` ne casse rien — elle gagne.**
- **Un NUMÉRO de section du banc ne désigne qu'une section — et un en-tête qui n'imprime pas son titre est pire qu'un titre absent.**
- **Un contrôle qui ne s'applique pas se déclare, il ne se retire pas.**

### La chronique des exercices, thème par thème

Un exercice ajouté demain se lit d'abord ici : le tirage, le juge, les bords
tenus, les sabotages qui les ont éprouvés.

- Opérations posées et calcul mental (Première, et Seconde depuis septembre 2026) — `docs/journal/03-calcul-pose.md`
- Seconde — intervalles et ordre des nombres — `docs/journal/04-seconde-intervalles.md`
- Seconde — fonctions, courbes et tableaux — `docs/journal/05-seconde-fonctions.md`
- Seconde — algorithmique et Python — `docs/journal/06-seconde-python.md`
- Fractions (Seconde et Première) — `docs/journal/07-fractions.md`
- Pourcentages, évolutions et coefficients (Première, et Seconde depuis septembre 2026) — `docs/journal/10-premiere-pourcentages.md`
- Terminale — dérivées, suites, récurrences et TVI — `docs/journal/14-terminale.md`
- Seconde — calcul littéral (thème 7 : les nombres relatifs, somme et produit, réduire une somme) — `docs/journal/16-seconde-calcul-litteral.md`

## Ajouter un exercice

Quinze points de branchement. En oublier un ne provoque aucune erreur visible
— l'exercice fonctionne, mais l'aide, la reprise ou la note manquent.

1. `TESTS` — nom, icône, description, fonction de démarrage
2. `THEMES` — l'identifiant dans le bon sous-thème (la numérotation en découle,
   et le tableau du professeur en découle aussi)
3. l'écran `<section class="screen" id="scr-…">`
4. `show()` — ajouter l'écran à `testScreens`
5. la réserve du bas en CSS — `#scr-…{padding-bottom:84px}`, sinon les
   commandes flottantes recouvrent la dernière ligne de l'exercice
6. `liveCheckCurrent()` — correction en direct du mode soutien
7. `restartCurrentTest()` — bouton « Recommencer »
8. `resumeTest()` / `afficherEcranDe()` — reprise après une pause, et rejeu
9. la liste des fonctions de rendu enveloppées en fin de fichier (jetons + boutons IA)
10. `RAPPELS` — rappel de cours, obligatoire ; un `console.warn` signale l'oubli
11. `QIA_SUGG` — questions proposées dans la fenêtre d'aide
12. `conseilCtxCourant()` — description de l'exercice envoyée au modèle
13. `QIA_MODELES` — corrigé type généré par l'application (facultatif)
14. `details.test` à l'enregistrement du résultat, avec l'identifiant exact
15. l'énoncé dans un élément de classe `enonce` — il prend l'encadré et
    l'étiquette. Deux contrôles l'exigent ; un exercice dont l'énoncé est
    l'ardoise se déclare dans `tests/profils.js` (`enonce.ardoise`)

Le point 4 est le seul dont l'oubli rendait le banc **aveugle** au lieu de le
faire rougir : `testScreens` est la liste que parcourt le contrôle de l'énoncé,
si bien qu'un écran absent en sortait au lieu d'y être signalé. Un contrôle
l'exige désormais, à partir des écrans de menu déclarés dans `tests/profils.js`
(`ecransHorsExercice`) : ajouter un exercice ne demande rien là-bas, ajouter un
écran de menu si.

Les points 2, 5, 6, 11 et 14 n'étaient contrôlés nulle part : les cinq trous ont
été fermés en août 2026, et trois d'entre eux ont trouvé un manque déjà en place
(voir « Cinq oublis silencieux » plus haut). Il n'y a plus de constante `MENU` :
elle listait les exercices pour le tableau du professeur, mais celui-ci se
construit depuis `THEMES` — elle ne servait plus à rien, et une liste morte qu'on
croit vivante est pire qu'aucune liste.

**Et la chronique va dans `docs/journal/`, jamais ici.** Ce fichier est rechargé
à CHAQUE tour : tout ce qu'on y écrit se paie à chaque tour, pour toujours. Un
exercice neuf raconte son tirage, son juge, ses bords et ses sabotages dans le
fichier de son thème ; seule la règle qui vaut PARTOUT — celle qu'un exercice
ajouté demain doit respecter sans avoir rien lu — gagne une ligne dans l'index
des pièges ci-dessus, et le tableau « ce que TOUT exercice doit respecter » si
un contrôle universel la tient. Une règle qui ne concerne qu'un exercice reste
dans son journal : c'est là qu'on la cherchera.

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

## Fiches imprimées (`.docx`)

Les fiches d'exercices sur papier ne vivent pas dans le dépôt et aucun script du
projet ne les produit : elles se modifient à la main, dans le XML du `.docx`.
Deux règles les tiennent (décisions de Turquet, août 2026).

**Les traits de fraction sont épais.** Une barre de fraction fine s'imprime
grise et se confond avec le cadre des cases. Il y en a de deux sortes, et n'en
traiter qu'une ne traite rien : les fractions IMPRIMÉES sont des formules Word
(`m:f`), leur barre suit le `m:ctrlPr` de la fraction — on y pose `<w:b/>`, Word
épaissit alors la barre sans toucher aux chiffres ; les fractions que l'ÉLÈVE
écrit sont deux cases empilées, et leur barre n'est que le côté partagé de deux
cadres, à 1 pt comme les trois autres côtés — rien ne disait que c'était une
barre. Ce trait-là est à 2,25 pt en bleu nuit (`w:sz="18"`, `1F3864`, la couleur
du trait des opérations posées), posé sur le `bottom` du numérateur ET le `top`
du dénominateur : Word garde le plus épais des deux, en oublier un laisse le
résultat à la merci du sens de résolution.

**Les exercices se suivent sur la même page.** Aucun `<w:pageBreakBefore/>` sur
les titres d'exercice : un exercice qui s'arrête au tiers de la page laisse
deux tiers de papier blanc, et la fiche passe de trois pages à quatre. Mais
retirer les sauts ne suffit pas — c'est là que le piège se referme. Le saut de
page cachait ce qu'il empêchait : dès que le texte s'enchaîne, une
multiplication posée se coupe en deux, l'opération en bas d'une page et ses
cases de résultat en haut de la suivante. Trois solidarités le tiennent, et il
les faut toutes les trois : `keepNext` sur toutes les rangées d'un tableau sauf
la dernière (le tableau ne se coupe plus), sur l'intitulé
« *3. Calcule 92 × 0,5.* » (il reste avec sa ligne de fractions), et sur la
consigne
« *✎ Pose la multiplication…* » (elle reste avec l'opération qu'elle annonce).
Ces solidarités repoussent les blocs et regagnent une page à elles seules : la
place se reprend sur les paragraphes VIDES qui séparent deux questions — un
paragraphe vide coûte une ligne entière (~15 pt) en plus de son espacement. On
le retire et on reporte son `after` sur le `before` du bloc suivant :
l'intervalle reste, la ligne perdue disparaît. Jamais sur la hauteur des cases,
qui est la place où l'élève écrit.

**Une fiche se juge en l'ouvrant, comme une page.** `soffice --convert-to pdf`
suffit à voir la pagination (`apt-get install libreoffice-writer` — le conteneur
n'a que le noyau, sans les filtres Writer, et sans eux la conversion répond
« *source file could not be loaded* », ce qui ressemble à un fichier corrompu
alors que le fichier est parfait). Deux réserves à connaître : LibreOffice
IGNORE le gras sur la barre des fractions OMML — les barres imprimées y restent
fines même quand le fichier est correct, seul Word tranche — et il dessine les
`=` des formules en `¿`. La pagination, elle, est fiable à une ligne près ; les
solidarités rendent cet écart sans conséquence.

---

## Quand passer à Fable

Turquet crée les exercices avec Opus et garde Fable, dont la limite
hebdomadaire est courte, pour ce qui résiste (décision de septembre 2026).
**Si un problème résiste après deux tentatives de correction** (contrôles
toujours rouges, ou bug introuvable), Claude cesse d'essayer et le dit, en
proposant deux options :

1. **passer toute la conversation sur Fable** : c'est Turquet qui change de
   modèle dans le sélecteur ;
2. **confier seulement le point bloquant à un sous-agent Fable** (outil
   `Agent`, `model: "fable"`), avec une tâche précise, puis reprendre la suite
   sous Opus.

L'option 2 consomme la limite Fable : elle se **propose**, elle ne se lance
jamais sans accord. Cette règle ne s'applique pas quand la session tourne déjà
sous Fable.

---

## Vérifier

```bash
npm install          # une seule fois
npm test             # les trois niveaux
npm run test:secondes # un seul, quand on travaille dessus
npm run test:navigateur # les trois pages ouvertes dans un vrai Chromium
npm run test:base    # les règles d'accès de la base, sur un PostgreSQL jetable
npm run test:fonction # la fonction Edge admin-eleve, réellement exécutée
npm run test:version # les numéros de version, comparés à ceux de `main`
```

`npm test` et `npm run test:navigateur` remplacent Supabase par un double en
mémoire — exprès : aucun contrôle ne doit approcher les comptes réels. Ils sont
donc **aveugles aux règles d'accès de la base**, et c'est là qu'étaient les
fuites. `npm run test:base` comble ce trou sans jamais toucher au projet : il
lève un PostgreSQL jetable, y recrée l'état d'avant, y joue les vraies
migrations (001, 002, 003, 004 et 008 — les 005 à 007 sont du `storage`, propre
à Supabase, que ce banc ne sait pas lever), puis joue chaque rôle — visiteur,
deux élèves, professeur — et vérifie ce que chacun obtient. Il éprouve aussi
les scripts qui ÉCRIVENT dans la base vivante — la restauration d'une
sauvegarde, le reliage des comptes, la réparation des notes faussées par la
coupe : ce sont les gestes les plus dangereux du dépôt, et aucun autre banc ne
peut les voir. Il exige PostgreSQL installé localement ; à défaut il le dit
bruyamment plutôt que de passer au vert.

Ce qu'aucun banc ne voit, et qui reste à vérifier à la main sur le projet : le
réglage de l'authentification Supabase, le déploiement de la fonction Edge, et
le fait que `COURRIEL_PROF` désigne un compte réel. Voir `supabase/LISEZMOI.md`.

**Une erreur qui revient à l'identique se diagnostique en remontant la
chaîne, jamais en la répétant** ; **deux bancs jsdom ne se lancent pas EN MÊME
TEMPS, `npm test` les enchaîne exprès** ; **une clé dupliquée dans
`tests/profils.js` gagne en silence** ; **un NUMÉRO de section du banc
navigateur ne désigne qu'une section, et se relit à chaque fusion de `main`
comme `APP_VERSION`** ; **un contrôle qui ne s'applique pas à un fichier se
déclare dans `lacunes`, il ne se retire pas**. Chronique, sabotages et
paragraphes complets : `docs/journal/17-verification-et-bancs.md`.
