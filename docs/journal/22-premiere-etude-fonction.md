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

---

## {lire-image-animation} — lire l'image d'un nombre, le chemin animé (6.2, novembre 2026, Première v406)

**La demande** (Turquet) : « en première créer un exercice dans le thème
étude de fonction comme l'exercice 3.1.1 de seconde, sauf que l'on placera
un point rouge sur l'abscisse du nombre donné dans l'exercice et on tracera
des pointillés depuis ce point jusqu'à la courbe verticalement et on tracera
ensuite des pointillés de la courbe jusqu'à l'axe des ordonnées qui indique
l'image. On écrira image sur l'axe des ordonnées. Supprimer le tableau de
valeurs à la fin de l'exercice. » Puis, le même jour : « il faudrait faire
une animation pour que l'élève comprenne que l'on part de l'abscisse
verticalement jusqu'à la courbe puis que l'on va horizontalement sur l'axe
des ordonnées pour lire l'image. »

**Le thème 6 est né deux fois le même jour.** La branche de cet exercice et
celle de {tableau-signes-courbe} (ci-dessus) sont parties du même `main`,
chacune créant « le » thème 6 « Étude de fonction » en v404, chacune portant
de la Seconde le même moteur de dessin, chacune écrivant ce fichier. L'autre
est arrivée sur `main` la première : la fusion a réuni les deux thèmes en
un, le 6.1 reste le tableau de signes, cet exercice devient le 6.2 (ajouté
EN DERNIER dans le thème, il ne renumérote rien), la seconde copie du moteur
est retirée (deux `const ETQ_W` auraient tué la page au chargement, et deux
fonctions du même nom se seraient écrasées en silence), et la version est
passée à 406 derrière la 405 du 3.10. L'identifiant est neuf (`lire-image-animation`,
kind `ima`) : l'exercice n'est pas le 3.1.1 de la Seconde (`image-nombre`)
porté tel quel — le chemin s'y montre AVANT la réponse, là où la Seconde le
garde pour la correction —, et un identifiant partagé aurait mis sous le même
nom deux exercices qui n'enseignent pas le même geste.

**Le dessin est celui de la Seconde**, porté dans la page par le 6.1 (voir
plus haut) : `lvGenPts`, la spline de `lvPath`, le cadre de `lvGraphSVG`,
l'étiquette Cf posée hors de sa courbe par `etqLibre`, les constantes
`ETQ_*` ; le 6.2 n'y ajoute que le lecteur `lvReadInt` (le 6.1 répond par
des listes). Les noms sont ceux de la Seconde, exprès : le contrôle « lvReadInt lit un entier
strictement » (M58) s'est appliqué de lui-même, et le banc navigateur
« 6 tricies » (l'étiquette rendue à côté de sa courbe) a trouvé son dessin
par les classes `lv-cf` et `lv-curve`. Le profil de la Première déclare
`etiquetteCourbe` avec un moteur à lui, `ima` : les quarante dessins de plus
y sont faits par `imaGraphSVG` — ce niveau n'a ni `adrSVG` ni `afGraphSVG`.
Le tirage est celui du 3.1.1 (`imgTirage`) passé par `distinctes()` : jamais
x = 0 (le point rouge tomberait sur l'axe des ordonnées, le pointillé vertical
n'aurait rien à tracer), jamais d'image nulle (le pointillé horizontal serait
invisible — on retire la COURBE, pas l'abscisse), les six abscisses mélangées
et toutes différentes tant qu'il y en a ; au-delà — un devoir qui règle plus
de questions, `dmNbQuestions` — on repart au début avec une autre courbe.

**Le chemin de lecture est montré à l'élève, et il s'anime.** Le point rouge
sur l'axe des abscisses se voit dès la question ; 350 ms plus tard le
pointillé vertical se déplie du point jusqu'à la courbe (800 ms), un point
rouge se pose sur la courbe, un arrêt de 300 ms, puis le pointillé horizontal
se déplie de la courbe jusqu'à l'axe des ordonnées (800 ms), où une marque,
la graduation lue récrite en rouge sur un halo, et le mot « image »
apparaissent. Tout est posé à sa place finale dans le SVG (`data-y2`,
`data-x2`) : l'animation ne calcule rien, elle DÉPLIE — `imaAnimer`, un jeton
qui annule l'animation en cours quand une autre commence (question suivante,
« ▶ Revoir le chemin »), `imaFin` qui saute à la fin pour « moins
d'animations » (`prefers-reduced-motion`) et à la vérification. Le groupe
`.ima-chemin` porte son état (`data-etat` : depart, vertical, horizontal,
fini) pour qu'un banc puisse le lire.
**Le mot « image » s'écrit DE L'AUTRE CÔTÉ de l'axe que le chemin**, à la
hauteur de l'image, contre l'axe : à gauche de la graduation quand le chemin
arrive par la droite (x > 0), à droite de l'axe quand il arrive par la gauche.
Le premier jet l'écrivait toujours à gauche, et l'essai dans Chromium l'a
montré traversé par le pointillé pour x = −3, la graduation « 3 » barrée avec
lui : d'où le côté opposé, et la graduation récrite en rouge sur un halo
par-dessus le pointillé (`.ima-grad`, un second `<text class="lv-ax">` à la
même place — le contrôle des étiquettes qui chevauchent le nom de la courbe le
mesure comme l'original). Et l'étiquette Cf ÉVITE le chemin et le mot :
`imaObstacles` donne à `etqLibre` les coins et le centre de la boîte du mot et
les deux pointillés échantillonnés tous les 4 px — le mécanisme de « Cg » en
Seconde. Mesuré sur quatre cas choisis (x = −3, −1, 1, 2) : aucun
chevauchement entre le mot, Cf et les deux pointillés.

**Ce qui change par rapport à la Seconde, et seulement cela.** Deux écritures
au lieu de trois — « L'image de X est la hauteur de X. C'est … » et
« f( … ) = … » —, le tableau de valeurs retiré. La note se compte par question
parfaite, comme tout exercice de ce niveau (`finishTest` note sur le nombre de
questions ; `if(allOk) test.score++`), les cases justes vont au crédit partiel
(`ptsExo`). Les cases se peignent par `corrChoix`, la fonction de ce niveau :
juste en bleu, faux en rouge avec la bonne réponse en vert à côté (le badge
`mf-cor`), vide remplie en vert et jamais rouge ; `msgAvecVides` dit d'abord
les cases manquantes, puis le pourquoi — le chemin raconté, et f(X) = Y. En
soutien, `imaLive` colore au fil de la frappe et `soutienAgain` fait
revérifier. La bonne réponse n'est jamais rangée à côté de la question :
l'image est `q.pts[x0 + 3]`, lue dans la courbe même par `imaCheck` — la
question ne porte QUE la courbe et l'abscisse.

**Les quinze branchements**, tous posés : `TESTS`, `THEMES` (thème 6),
l'écran `scr-ima` (énoncé en `.mp-instr`, la rangée `imaActions` où
`iaBoutons` pose l'aide), `testScreens`, la réserve du bas, `liveCheckCurrent`
(`imaLive`), `restartCurrentTest`, `afficherEcranDe` (reprise et rejeu),
la liste des rendus enveloppés (`renderIma`), `RAPPELS.ima` (`RAP_IMA`, en
HTML pur sans un seul `\(` — la leçon du rappel de {placer-image}),
`QIA_SUGG.ima`, `ctxIma` dans `conseilCtxCourant` (la courbe point par point,
le chemin montré, les saisies, les attendus sous la clause de secret, la
méthode), `test.qId` écrit en toutes lettres. Le profil : la clé `ima` dans
les rappels de la Première, `etiquetteCourbe`.

**Essai dans Chromium (hors banc)** : la question s'ouvre sur le point rouge
seul, le chemin se déplie en deux temps (états vertical, horizontal, fini
relus sur le groupe), le mot et la marque à la hauteur de la graduation de
l'image (mesuré contre les graduations RENDUES : même y à 0,5 px), le point
rouge à l'abscisse demandée (même x que sa graduation) ; une copie juste vaut
le point, trois cases `ok` ; une copie à une fausse, une juste, une vide :
rouge avec le badge vert, bleu, verte remplie — « Il te manquait 1 case… »
puis le pourquoi, note 0,3 / 1 ; « Revoir le chemin » rejoue ; sur un
téléphone, la page ne déborde pas. Aucune erreur JavaScript.
