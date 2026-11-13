# Première — le thème 6, Étude de fonction

## {tableau-signes-courbe} — le tableau de signes lu sur une courbe, les signes écrits sur le dessin (6.1, novembre 2026, Première v404)

**La demande** (Turquet, novembre 2026) : « en première dans un nouveau thème
étude de fonction, faire un exercice comme le 3.3.4 de seconde mais il faudra
mettre les signes + et − sur les parties des courbes correspondantes sur le
dessin. Il faudra supprimer les deux phrases à compléter avec f(x) > 0 et
f(x) < 0. On laissera le tableau à compléter et l'équation f(x) = 0 à
compléter. On supprimera donc les dernières lignes sur la résolution
d'inéquation. »

**Un thème neuf, le 6 « Étude de fonction », ajouté EN DERNIER** : il ne
renumérote rien. L'identifiant est NEUF (`tableau-signes-courbe`, kind `tsc`),
et non celui de la Seconde (`tableau-signes-graphique`, kind `tsg`) : ce n'est
pas le même exercice — ni les phrases, ni les inéquations, et les signes sont
écrits sur le dessin. Garder l'identifiant de la Seconde aurait fait jouer son
contrôle (`tableauSignesGraphique`, qui cherche les cases des phrases) sur une
page qui ne les a pas ; et la table `kind → écran` est globale aux trois
niveaux dans `tests/profils.js`. La Seconde ne change pas.

**Le dessin est celui de la Seconde, recopié tel quel, pas réécrit** : la
famille `lv` de {lecture-variations} (`lvGenPts`, `lvAnalyze`, `lvTangents`,
`lvPath` par morceaux, `lvGraphSVG`) et le placement de « Cf » hors de la
courbe et des axes (`lvEchantillon`, `etqLibre`, `etqCandidats`, les
constantes `ETQ_*`), avec `numFmt`. Les cases sont les listes de la famille
`.itv-sel` (`itvSelHTML`, `itvNum`) ; `corrChoix` et `msgAvecVides`, déjà
partagées par la Première, les corrigent — le badge vert au LIBELLÉ de la
bonne option (« − », pas « - »), la case vide remplie en `sol` en
entraînement, rien en soutien. La Première n'avait rien de tout cela : le CSS
des deux familles (`.lv-*`, `.itv-*`, `.itq-ineg`) et celui du tableau de
signes (`.tsg-tbl`, `.tsg-pos`, `.tsg-neg`, `.tsg-mot-*`) sont portés avec les
classes de la Seconde — et la feuille de la Première les peint comme partout
ici : juste en BLEU, faux en rouge, correction en VERT (le banc navigateur
« 9 bis » relit chaque règle).

**Le tirage est celui du 3.3.4 de la Seconde** (`tscGen`, le filtre
`tscOkPts` posé à la hauteur zéro) : exactement deux racines strictement
intérieures, chacune un vrai CROISEMENT (la tangence et les racines voisines
mentiraient), zéro jamais traversé entre deux graduations (la spline est
monotone entre deux points voisins : une racine hors graduation serait
illisible). Les DEUX visages (+ − + et − + −) sortent dans chaque séance d'au
moins deux questions — sans quoi l'élève apprendrait que le tableau est
toujours le même. Le nombre de questions se lit sur le devoir
(`dmNbQuestions(TSC_NB)`, cinq par défaut), jamais sur la constante nue : la
coupe d'un devoir ou le banc des notes (réglé à deux questions) raccourcit la
séance au tirage. La question ne porte QUE la courbe (`pts`) : tout se
recalcule par les fonctions qui corrigent (`tscSols`, `tscSide`), et le
contrôle refuse tout autre champ.

**Les signes sur le dessin** (`tscSigne`) : chaque morceau de la courbe est
peint de la couleur de son signe (rouge au-dessus de l'axe, bleu en dessous —
`lvPath` par morceaux, les tangentes de la courbe entière), et porte SON signe
écrit à côté, à l'encre de son morceau : « + » posé 6 px au-dessus du point le
plus haut du morceau rouge, « − » 6 px au-dessous du point le plus bas du
morceau bleu. On essaie d'abord le milieu du morceau, puis de part et d'autre
par pas de 8 px, et l'on garde la première place qui tient dans le dessin, hors
de l'axe des ordonnées et de ses graduations (la bande `x0 − 24 … x0 + 3` de
`etqLibre`). Le repli — aucune place ne tient — pose le signe au milieu,
ramené dans le dessin. Un « + » est donc toujours au-dessus de l'axe, un « − »
toujours en dessous : c'est ce que le contrôle mesure, sur les deux visages, en
lisant les attributs du SVG rendu contre l'axe dessiné.
**Et c'est « Cf » qui évite les signes, pas l'inverse — la première capture
l'a montré.** Le premier jet faisait éviter la boîte de « Cf » au signe : sur
un morceau de 37 px (une seule graduation, le cas le plus fréquent, puisque
les racines sont souvent voisines du bord), « Cf » occupait toute la place
au-dessus de la courbe, les trois abscisses candidates du signe la
chevauchaient toutes, et le repli posait « + » collé à « Cf » (« Cf+ », vu sur
la capture, pas au banc). Les signes se posent donc D'ABORD, et `lvGraphSVG`
reçoit leurs boîtes en OBSTACLES (`obst`, le motif de « Cg » en Seconde :
coins, centre, milieux des côtés — `tscSigneObst`) : `etqLibre` pose « Cf » à
`ETQ_MARGE` au moins de chaque signe, par ses places calées puis son balayage.
Le signe, qui enseigne, passe avant le nom de la courbe. Sonde dans Chromium
sur 400 tirages (1 200 signes) : aucun sur « Cf », aucun hors du dessin, aucun
du mauvais côté de l'axe.

**L'énoncé** dit la correspondance couleur/signe en toutes lettres — « au-dessus
… rouge … + », « en dessous … bleu … − » — chaque mot À SON ENCRE
(`.tsg-mot-rouge`, `.tsg-mot-bleu`), aucun `<b>` : la règle `.mp-instr b`
peint tous les gras en rouge, et « bleu » écrit en rouge dirait l'inverse de ce
que l'exercice enseigne (la leçon du 3.3.4 de la Seconde, apprise sur la
capture). Puis le tableau — les racines et les zéros DONNÉS, seuls les trois
signes se placent, « comme en Terminale » — et S = { … ; … }, à ordre LIBRE
(la règle des paires : le même nombre posé deux fois est défendable une fois,
faux la seconde).

**La note est celle de la Première** : un point par question PARFAITE
(`finishTest` compte `total = test.questions.length` ; recopier
`test.score += nCorrect` de la Seconde aurait donné 25 points sur 5
questions), les cases justes vont au crédit partiel (`ptsExo`, suspendu à ce
niveau), `maxScore` vaut le nombre de questions, l'en-tête dit « Exercices
parfaits » comme les fractions et le calcul littéral, et `test.qId` est écrit
en toutes lettres (le contrôle « chaque exercice enregistre sa note sous son
identifiant » ne lit que des littéraux). Pas de bouton des tables en Première
(`sfBoutonsAide`).

**Les quinze branchements** : `TESTS`, `THEMES` (thème 6), l'écran `scr-tsc`,
`testScreens`, la réserve du bas, `liveCheckCurrent`, `restartCurrentTest`,
`afficherEcranDe`, la liste des rendus enveloppés (`renderTscTest`), le rappel
(`RAP_TSC`, dans `RAPPELS_ID` par identifiant — le contrôle de la Première ne
connaît pas le kind `tsc`, et un rappel par identifiant le satisfait),
`QIA_SUGG.tsc`, `conseilCtxCourant` (`ctxTsc`, les réponses « STRICTEMENT
SECRÈTES »), `test.qId`, l'énoncé en `.mp-instr`. Pas de `QIA_MODELES`
(facultatif).

**Le contrôle** (`tableauSignesCourbe`, `tests/verifier.js`, présent dès que
`startTsc` existe — la Seconde et la Terminale le déclarent non applicable) :
la place au menu (le thème « Étude de fonction », son premier exercice, le
numéro qui en découle), le tirage sur 250 séances par sa propre arithmétique,
les encres des morceaux ET des signes lues dans la feuille de styles, les mots
de l'énoncé à leur encre et aucun gras, le démarreur réel (kind, `maxScore` =
nombre de questions, `qId`, l'écran affiché), puis les gestes CLIQUÉS sur les
deux visages : la copie juste vaut UN point et ses cinq cases sont `ok`,
exactement CINQ listes (ni phrase ni inéquation), les morceaux et les signes
comptés par côté, chaque signe dans le dessin, du bon côté de l'axe, au-dessus
d'un morceau de sa couleur, hors de « Cf » ; S = { ; } à l'envers vaut le
point, le doublon est défendable une fois ; un signe faux vaut zéro, rougit,
porte le badge « − », et la case juste voisine reste `ok` ; la case vide reçoit
`sol` en entraînement et le message dit qu'elle manquait, rien en soutien, où
le faux rougit.
