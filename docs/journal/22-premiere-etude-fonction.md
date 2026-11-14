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

**Puis un point VERT sur chaque racine (v406).** Demande de Turquet, le jour
même : « un point vert sur le graphique pour les points représentant
f(x) = 0 ». Deux cercles (`.tsc-racine`, rayon 4,5 px, liseré blanc) posés sur
l'axe aux abscisses des racines, EN DERNIER dans le SVG — par-dessus les deux
encres, pour qu'aucun trait ne les recouvre. Le vert est celui de la
correction (`--green`), l'encre de ce que la page MONTRE. Le contrôle lit les
deux cercles sur chaque visage (leur `cx` à la racine, leur `cy` sur l'axe
dessiné, rien dessiné après eux) et l'encre verte dans la feuille de styles.

---

## {lire-image-animation} — lire l'image d'un nombre, le chemin animé (6.2, novembre 2026, Première v407)

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
passée à 406 derrière la 405 du 3.10 — puis à 407, le 6.1 ayant pris la 406
entre-temps (son point vert sur chaque racine). L'identifiant est neuf (`lire-image-animation`,
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

**Puis trois paliers, deux questions chacun (v409).** Demande de Turquet,
novembre 2026 : « après deux questions, faire deux autres questions avec les
signes qui ne sont plus sur le dessin et les racines à placer dans le tableau
avec les zéros, puis deux autres questions avec aucune couleur, aucun signe,
aucun point sur le dessin et le tableau complet à compléter avec les racines
et les zéros ». Six questions (`TSC_NB`), le palier RANGÉ dans la question
(`q.et`, calculé au tirage par `tscEtape` — 1,1,2,2,3,3 sur six ; une séance
coupée à deux par un devoir garde 1 puis 2) : la reprise d'une pause le relit,
rien ne se recalcule à l'affichage, et le contrôle refuse tout autre champ.
· Palier 1 : inchangé — encres, signes écrits, points verts, trois signes à
  placer, racines et zéros donnés.
· Palier 2 : encres et points verts, plus aucun signe (`tscDessin` ne pose
  ni signe ni obstacle, « Cf » se place comme en Seconde) ; le tableau est
  ENTIER, celui du {lecture-signes} de la Seconde : les deux racines dans la
  ligne des x, À LEUR PLACE (la plus petite à gauche — un tableau se lit de
  gauche à droite, les racines échangées sont fausses toutes les deux, alors
  que S = { ; } reste à ordre libre), puis +, − ou 0 dans chacune des CINQ
  cases de la ligne du signe — savoir que le 0 va sous une racine EST évalué,
  des cases qui ne l'offriraient que sous les racines révéleraient la réponse.
· Palier 3 : la courbe NUE (`lvGraphSVG` sans rien par-dessus), le même
  tableau entier.
Le titre de la fiche (`TSC_TITRES`), la consigne du tableau, le pourquoi
(`tscWhy`) et le contexte du modèle (`ctxTsc`) changent avec le palier ;
l'énoncé de l'écran et la description du menu annoncent les trois. Neuf
cases aux paliers 2 et 3 (2 racines, 5 signes, 2 solutions), cinq au 1 ;
toujours un point par question parfaite.
**Le contrôle** : six questions aux paliers 1,1,2,2,3,3 ; par palier, le
dessin compté (encres, signes, points : 2-1 / 2-1 / 2 au palier 1, 2-1 / 0 /
2 au 2, 0 / 0 / 0 au 3, la courbe `.lv-curve` toujours là) ; au palier 2 la
copie juste vaut un point sur neuf cases `ok`, chaque case de la ligne du
signe offre le 0, les racines échangées rougissent toutes les deux, un + sous
une racine rougit avec le badge « 0 » ; au palier 3 la copie juste (S à
l'envers) vaut le point et le titre dit « nue » ; une question posée seule au
palier 3 se dessine nue — le palier est lu dans la question, pas déduit de sa
place.
**Puis la séance en cinq temps, et les antécédents par le chemin inverse (v409).**
Demande de Turquet, le lendemain : « écrire simplement l'image de .. est :
.... sans écrire "est la hauteur de ...". Après deux questions avec
l'animation poser deux autres questions sans l'animation. Puis deux questions
sur le ou les antécédents avec une animation inverse de celle de l'image d'un
point, qui part de l'image pour aller vers le ou les antécédents. Puis deux
autres questions sur le ou les antécédents sans les animations, puis deux
autres questions sans animation qui demandent une image et le ou les
antécédents sur le même graphique. »
*Dix questions* (`IMA_NB`), le temps de chacune lu dans sa POSITION
(`imaPlan`) : image animée, image sans chemin, antécédents avec le chemin
inverse animé, antécédents sans chemin, image et antécédents sur le même
dessin sans chemin — deux questions par temps, et le cycle recommence si un
devoir règle plus de dix questions. La question porte `x0` (l'abscisse, ou
null), `y0` (la hauteur, ou null) et `anim` ; l'image et les antécédents
restent LUS dans la courbe (`imaY`, `imaAnts`).
*Le tirage des hauteurs* est celui du 3.1.3 de la Seconde (`antCibles`, ici
`imaCibles`) : une hauteur que la ligne de niveau ne coupe qu'aux graduations,
un à trois antécédents ; de plus jamais 0 (la ligne serait sur l'axe) ni un
antécédent en 0 (son pointillé serait sur l'axe des ordonnées) ; la première
question de chaque paire préfère UN antécédent, la seconde PLUSIEURS — les
deux visages de la notion. Sur le dessin à deux questions, l'image demandée
n'est jamais la hauteur des antécédents : les deux chemins se confondraient.
Les abscisses des questions à image suivent le RANG de la question parmi
celles-ci, jamais un compteur : `distinctes()` rappelle la fabrique pour la
même question quand elle tire un doublon, et un compteur aurait sauté des
abscisses.
*Le chemin inverse* : le point rouge sur l'axe des ordonnées, la ligne de
niveau se déplie depuis l'axe vers la gauche ET vers la droite à la fois,
jusqu'aux antécédents extrêmes, un point rouge à chaque croisement, l'arrêt,
puis un pointillé vertical de chaque croisement jusqu'à l'axe des abscisses,
la marque, la graduation récrite en rouge et le mot « antécédent » ou
« antécédents », centré sur eux, sous les graduations quand le chemin descend
d'en haut, au-dessus de l'axe quand il monte d'en bas. L'animateur ne connaît
plus de chemin particulier : chaque groupe `.ima-chemin` porte ses pointillés
en `data-phase` 1 et 2 (le bout dans `data-x2` / `data-y2`) et ce qui
apparaît après chaque phase en `data-des` ; les groupes se suivent (l'image,
puis les antécédents). Sans animation, le ou les points rouges se voient
seuls, et `imaFin` déplie tout à la vérification — la méthode de la Seconde.
*Les cases* : « L'image de X est : … » et « f( … ) = … » ; « L'antécédent de
Y est : … » ou « Les antécédents de Y sont : … ; … », autant de cases que
d'antécédents, l'ordre LIBRE — chaque case promet d'être l'un des attendus,
la liste les prend une fois chacun, les cases sans correspondance reçoivent
les antécédents restants pour la correction (la règle du 3.1.3). Le rappel,
les questions à l'IA et le contexte parlent des deux chemins.

**Puis une ligne par écriture, et deux antécédents de préférence (v411).**
Demande de Turquet : « écrire sur la même ligne "l'image de .... est : ....
qui signifie que : f(....) = ......" ; pour le ou les antécédents je souhaite
avoir deux antécédents régulièrement ; écrire sur la même ligne "l'antécédent
de ... est .... et ... qui signifie f(...) = f(...) = ...." ». La rangée est
une ligne flex qui ne se replie jamais (`.ima-ligne`, contenu centré tant
qu'il tient, défilement horizontal sur un petit écran). Les antécédents
s'écrivent deux fois : dans la liste (« sont … et … ») et entre les
parenthèses (« f( … ) = f( … ) »), chaque liste jugée dans l'ordre libre par
le même juge (`juge(prefixe)`), puis la hauteur après le dernier « = ». Le
tirage préfère désormais DEUX antécédents sur chaque question à antécédents —
un ou trois seulement quand la courbe n'en offre pas deux.

---

## {tracer-droite} — tracer la droite d'une fonction affine, du calcul au tableau de signes (6.3, novembre 2026, Première v412)

**La demande** (Turquet, sur le sujet papier « Exercice 3 », f(x) = −2x + 3) :
« en première faire un exercice comme le pdf. On mettra en rouge le point sur
le graphique s'il est mal placé, donc on ne passera pas au point suivant tant
que le premier point sera mal placé. Quand les deux points sont bien placés,
demander de compléter la règle : la représentation d'une fonction du premier
degré de la forme ax + b est … Puis demander de tracer la droite en cliquant
sur les deux points placés. Pour déterminer graphiquement l'antécédent, faire
une animation comme dans l'exercice 6.2. Pour le calcul de l'antécédent avec
la résolution d'une équation, demander à compléter les règles en face des
lignes correspondantes. En mode soutien, quand on doit calculer la somme de
deux relatifs, faire une bulle d'aide à compléter de manière facultative […] ;
si on doit calculer une division, faire une bulle d'aide qui rappelle la
règle des signes. Pour le tableau de signes, refaire le dessin de la droite
et demander de compléter le tableau de signes ; on présentera la question
comme au début de l'exercice 6.1. »

**Une question = une fonction, les cinq parties du sujet** (kind `trd`,
identifiant neuf, ajouté en dernier dans le thème : il ne renumérote rien).
① f(x₁) = a × ( … ) + b = … pour deux abscisses ; ② A puis B posés d'un clic
sur le repère (−5…5 × −6…6, le clic arrondi au nœud le plus proche) : un
point mal placé se peint en ROUGE avec la raison écrite au-dessus du repère,
et B attend qu'A soit juste ; les deux justes, la règle « … est une droite »
(une liste) s'ouvre ; la règle choisie, le tracé : un clic sur A (cerclé),
un clic sur B, et la droite traverse le cadre ; ③ l'antécédent de k lu par
le chemin inverse du 6.2, déplié sur ce repère par le MÊME animateur
(`imaAnimer` prend désormais la racine du dessin, `'#imaGraph'` par défaut) ;
④ l'équation, chaque ligne face à sa règle (règle 1 : on fait l'opération
inverse, donc on change le signe ; règle 2 : on divise, donc on garde le même
signe), le terme transposé entouré de pointillés comme sur le papier, la
fraction empilée ; ⑤ la droite redessinée comme au palier 1 du 6.1 (rouge et
« + » au-dessus, bleu et « − » en dessous, point vert sur la racine), la
racine et le zéro donnés, deux signes à placer. ③ à ⑤ s'ouvrent quand la
droite est tracée.

**Le tirage** (`trdTirage`, par `distinctes()`) : a ∈ {−3, −2, 2, 3} — ±1
rendrait la division sans objet —, b ≠ 0, la racine −b/a entière ou
demi-entière (lisible, écrite « 1,5 ») ; x₁, x₂ non nuls, écartés d'au moins
2, images dans le repère, jamais |a·x| = |b| (la somme « grand − petit »
vaudrait 0, sans signe) ; k ≠ 0, k ≠ b, d'antécédent entier non nul, autre
que x₁ et x₂ de préférence. La question ne porte que a, b, x₁, x₂, k.

**L'état de la question** (`test.trdE`) : l'étape, les points posés et leurs
erreurs, le point choisi, les listes — il part avec la pause et revient avec
elle (les listes, que `captureBoxes` ne lit pas, y sont rangées).

**« Vérifier » est toujours là.** Une copie vide se corrige comme ailleurs :
les parties fermées s'ouvrent, les points et la droite qui manquent se
dessinent en VERT (`.trd-pt.sol`, `.trd-droite.sol`), le chemin se déplie,
les cases se remplissent en vert — c'est ce qui laisse les bancs des notes et
de la pause mener l'exercice. En entraînement, un graphique inachevé sans
case vide visible (la boîte `#confirmer-vides` ne voit pas les parties
fermées) est signalé une fois par le message de la page ; les bancs le
coupent avec la boîte (`confirmerCasesVides=false`).

**La note** : un point par question PARFAITE (les 17 cases justes et le
graphique achevé), les cases au crédit partiel. Un point d'abord mal placé ne
retire rien : le premier jet le pénalisait, et la note de l'exercice, qui
compte des CASES (`ptsRep` borne un « 17 sur 17 » non parfait à 16/17),
affichait « 16 cases justes sur 17 » devant 17 cases justes — vu à l'essai.

**Les bulles du soutien** (`trdBulleSomme`, `trdBulleDivision`) : sous
chaque image (le produit donné, puis la somme p + b), sous l'équation (k et
−b) — « les signes sont différents, donc on fait la soustraction grand −
petit = … et on prend le signe du plus fort entre … et …, ici … », ou « les
signes sont les mêmes, donc on additionne … et on garde le même signe » —, et
la règle des signes de la division. Leurs cases sont `.hors-note` : colorées
au fil de la frappe, jamais comptées, jamais demandées par la boîte des cases
vides.

**Les quinze branchements** : `TESTS`, `THEMES` (thème 6), `scr-trd`,
`testScreens`, la réserve du bas, `liveCheckCurrent` (`trdLive`),
`restartCurrentTest`, `afficherEcranDe`, la liste des rendus enveloppés
(`renderTrd`), `RAPPELS_ID['tracer-droite']` (`RAP_TRD`, HTML pur),
`QIA_SUGG.trd`, `ctxTrd` (l'étape, les saisies, les attendus « STRICTEMENT
SECRETS »), `test.qId`, l'énoncé en `.mp-instr`. Pas de `QIA_MODELES`.

**Essai dans Chromium (hors banc)** : A cliqué une case trop haut → rouge,
message ; un clic sur la place de B pendant que A est faux reste une tentative
pour A ; A puis B justes → la règle ; la droite tracée → le chemin déplié
(état `fini`) ; copie juste → 1 / 1, 17 cases `ok` ; en soutien, une case
fausse rougit, les bulles s'affichent, « Revérifier ». Aucune erreur
JavaScript. Le mot « antécédent » se pose à la première place libre (hors de
l'axe, loin de A et B, sans que la droite le traverse) — la première capture
le montrait sur B.
