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

**Puis « qui signifie que » sur quatre questions seulement, et une onzième
sans points rouges (v413).** Demande de Turquet : « affiche signifie que
f(....) = ..... dans deux questions pour les images et dans deux questions
pour les antécédents, ne plus le demander après ; à la fin rajouter une
question qui demande une image et soit un antécédent soit deux antécédents
mais sans afficher les points rouges sur les axes ». La question porte deux
drapeaux de plus : `sig` (l'écriture « qui signifie que : f( … ) = … » se
demande — les deux questions animées de chaque sorte, c'est-à-dire les deux
premières), `nus` (aucun point rouge sur les axes — la onzième, `mix-nu`,
seule dans son temps). Sans `sig`, la ligne s'arrête à la case de la réponse
et le juge ne lit pas les cases absentes ; sans points rouges, les cercles
des axes portent `data-des="2"` et n'apparaissent qu'avec le chemin, à la
vérification. La onzième veut un antécédent OU deux, à pile ou face
(`voulu`), là où les autres en veulent deux.

---

## {tracer-droite} — tracer la droite d'une fonction affine, du calcul au tableau de signes (6.3, novembre 2026, Première v414)

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

**Puis la mise en page de la fiche « suite », la racine à trouver, et la bulle
au clic (v416).** Demande de Turquet, sur la fiche « exercice tracer une droite
(suite) » : « dans la question 1, quand on calcule l'image d'un nombre,
présenter comme le pdf joint. Dans la question 4, il faut aligner les signes
"=" verticalement et la règle 1 doit être "prendre l'opposé" et écrire "donc
on change le ……" sur la même ligne. Pour la règle 2, mettre aussi sur la même
ligne le "donc …". Pour le tableau de signes, l'élève doit trouver la racine
dans le tableau. En mode soutien, je veux que la bulle apparaisse quand on
clique sur la case et que l'aide corresponde uniquement à l'opération de la
case, comme dans l'exercice de seconde 8.4.4. »
· ① trois lignes par image, les « = » l'un sous l'autre (une grille à trois
  colonnes, `.trd-calc`) : f(2) = −2 × ( … ) + 3, = … + 3, = … — une case de
  plus par image, le produit (`trd-p1`, `trd-p2`) : 20 cases au lieu de 17.
· ④ une grille à quatre colonnes (premier membre, « = », second membre,
  règle) : les « = » s'alignent d'eux-mêmes ; la règle 1 et son « donc on
  change le … » sur la ligne 1, la règle 2 et son « donc on garde le même … »
  sur la ligne 3 ; la règle 1 se lit « prendre l'opposé » (listes : prendre
  l'inverse / prendre l'opposé / garder le même nombre). Les règles écrivent
  un peu plus petit (0,9 rem) : à pleine taille, la règle 1 sortait du cadre
  sur un écran de 1 100 px — vu sur la capture.
· ⑤ la racine est une case (`trd-rac`), lue décimale ou en fraction
  (`trdLitNb` : « 1,5 », « 1.5 », « 3/2 ») ; le point vert reste sur le
  dessin. Et le « + » du dessin, qui touchait l'axe des ordonnées sur une
  droite proche de l'axe, essaie maintenant les deux côtés de la droite.
· Soutien : les bulles fixes sous les lignes sont retirées ; la bulle
  s'ouvre au focus d'une case de CALCUL (`TRD_GP_CASES` : les produits, les
  sommes, le second membre, la division), à côté d'elle, par le patron de
  `vcdGpOuvrir` du 8.4.4 — sur <body>, placée par `bexpPoser`,
  `data-bulle-aide`, fermée au premier geste ailleurs, à Échap, au redessin,
  à la vérification. Elle ne parle que de l'opération de sa case, avec les
  nombres que l'élève a écrits dans les cases d'avant (sinon : « Écris
  d'abord … ») : le produit et sa règle des signes, la somme « signes
  différents → grand − petit, signe du plus fort » ou « signes identiques →
  on additionne, même signe », la division et sa règle des signes. Ses deux
  cases remplies écrivent le résultat dans la case du calcul. Essai dans
  Chromium : bulle du produit, de la somme, de la division, la consigne
  quand le produit manque, la fermeture au clic ailleurs, le résultat écrit
  par la bulle et jugé juste ; copie juste 1 / 1, 20 cases `ok`.

**Puis une aide plus discrète, les flèches de la transposition, et les cases
manquantes en rouge en soutien (v417).** Demande de Turquet : « pour l'aide
facultative mettre uniquement la règle des signes avec des signes un peu plus
gros et en une seule colonne ; ne pas écrire qu'on multiplie sans les signes ;
il ne faut pas que l'aide facultative cache une partie du calcul qu'on est en
train d'effectuer ainsi que les règles que l'on doit compléter ; faire des
aides facultatives avec une police plus petite, discrètes sur la page ; il
manque les flèches comme sur le pdf quand on transpose ; quand il manque des
cases à compléter dans le mode soutien, les mettre en rouge. »
· La bulle du produit et celle de la division ne portent plus que la règle
  des signes, quatre lignes en une colonne, signes à 1,25 rem — plus de
  cases, plus de « on multiplie sans les signes » ; celle d'une somme garde
  son texte et ses deux cases. La bulle est petite (0,8 rem, 260 px au plus),
  bordure fine vert pâle, ombre légère.
· Sa place (`trdGpPlacer`, qui ne passe plus par `bexpPoser`) : le BLOC
  entier — les deux calculs d'images, ou l'équation et ses règles — mesuré
  par ses cellules (`trdGpEmprise` : la quatrième colonne de la grille
  s'étire sur toute la largeur, sa boîte ne dit rien de ce qui est écrit), et
  la bulle à droite du bloc, sinon à gauche, dessous, dessus. Mesuré dans
  Chromium : aucun élément du calcul sous la bulle d'une image (posée à
  droite) ; sous l'équation pour la division.
· Les flèches (`trdFleches`) : un SVG posé sur la grille de l'équation
  (`.trd-eq`, en position relative, une marge en haut et à gauche pour les
  courbes), pointillé, sans prise ; du terme entouré de la ligne 1, par
  au-dessus, à sa case de la ligne 2 ; du facteur entouré de la ligne 3, par
  la gauche, au dénominateur. Positions lues sur les cases rendues, à chaque
  redessin (`trdDessiner`), à la correction et au redimensionnement.
· Soutien : une case VIDE (et visible) à la vérification s'entoure de rouge
  — la classe `trd-manque`, PAS `.bad` : la règle commune « une case vide ne
  rougit jamais » parle d'une case jugée fausse alors qu'elle était vide, ce
  qui n'est pas le cas ici (elle n'est pas fausse, et le message dit « à
  compléter ») ; le contrôle universel ne lit que `.bad`. Le liseré tombe à
  la première frappe (`trdLive`). Le message nomme les deux : « corrige les
  cases en rouge, et complète celles entourées de rouge », et, graphique
  inachevé, « … ; et complète les cases entourées de rouge ».
· Un oubli de la v416 réparé au passage : la règle `.trd-mot` (qui garde
  « f (x) = ax + b » d'un seul morceau) avait disparu avec l'ancienne bulle.
· Une erreur JavaScript trouvée par l'essai et corrigée avant de partir : la
  bulle sans cases (produit, division) cherchait encore à brancher les siennes.
· Et la version a dû passer à 418 après la fusion : le 7.1 ({augmentation-
  tableau}, PR #1015) est arrivé sur `main` quelques minutes avant, en v417
  lui aussi — la même ligne `APP_VERSION=417` des deux côtés, git n'y a vu
  aucun conflit, et deux pages différentes portaient le même numéro.

**Puis la règle trace la droite (v419).** Demande de Turquet : « quand on
complète par le mot droite, tracer la droite directement et passer à la
suite ; si le mot droite n'est pas mis, ne pas continuer ». `trdAvancer` :
« une droite » choisi, la liste se fige en bleu (`ok`, désactivée), l'étape
passe directement à `fin` — la droite se dessine par A et B, les questions 3
à 5 s'ouvrent, le chemin de l'antécédent se déplie ; un autre mot, la liste
rougit (`bad` : un choix FAUX, pas une case vide) et le message dit que la
suite attend la bonne réponse. Le tracé par deux clics (l'étape `tracer`)
n'est plus atteint ; son code reste, inoffensif. La description du menu, le
contexte du modèle et les consignes le disent.

**Puis le numérateur qui recopie la ligne 3, et une question 5 plus petite
(v423 — le 7.1 avait pris la v422 sur `main` pendant les contrôles).** Demande de Turquet : « dans la question 4, quand l'élève a mis le
résultat dans la case de la 3e ligne, qui est une somme, afficher son
résultat dans le numérateur de la 4e ligne ; dans la question 5, écrire en
plus petit « le signe de f(x) se lit sur le dessin » et faire un dessin plus
petit ». Le numérateur (`trd-e3`) n'est plus une case à écrire : lecture
seule, pointillés, `.hors-note`, et `trdMiroir` lui donne la valeur ET la
couleur de la ligne 3 — à la frappe, au jugement du soutien, à la
correction. Il sort du juge (19 cases par question au lieu de 20) : la
ligne 3 est déjà jugée, et la compter deux fois punirait deux fois la même
faute. La bulle de la division le lit toujours. Question 5 : le titre à
1,15 rem (au lieu de 2), le dessin à 330 px au plus (au lieu de 620).

**Puis le tableau de signes centré (v427 — le 1.13 puis le 7.1 avaient pris les v425 et v426 sur `main` pendant les contrôles).** Demande de Turquet : « dans la
dernière question, il faudrait centrer le tableau comme c'est déjà le cas pour
le dessin ». Le cadre `.itv-ligne` (560 px au plus) est posé directement dans
la partie, pas dans la colonne flex centrée des fiches (`.itv-fiche`) : il
restait collé à gauche. Une marge automatique (`.trd-tab-ligne`) le centre.

## {image-antecedents-libre} — la onzième question du 6.2, seule, six fois (6.4, novembre 2026, Première v429)

**La demande** (Turquet) : « faire un autre exercice avec uniquement la
question 11, donc sans aide mais plusieurs fois ». Ajouté EN DERNIER dans le
thème 6 : il ne renumérote rien. Un identifiant à lui, sur le moteur du 6.2 —
deux exercices peuvent partager un moteur, jamais leur identité : la note
porte l'identifiant (`test.qId`), « Recommencer » le relit, le rappel et les
questions à l'IA sont ceux du kind `ima`, et le profil déclare l'identifiant
dans les rappels et dans `etiquetteCourbe`. Le tirage est celui du 6.2 au
temps 'mix-nu' pour toutes les questions (`imaTirage(nb, planFixe)`) : une
image et un ou deux antécédents (pile ou face) sur le même graphique, sans
point rouge, sans chemin avant la vérification, sans l'écriture
f( … ) = … — six questions, le réglage « Questions » d'un devoir les allonge.

## 6.5 {tracer-droite-libre} — le 6.3, les calculs rédigés (v434 — le 7.1, le 7.2, le 6.4 {image-antecedents-libre}, le 7.1 encore puis le 1.13 avaient pris les v428 à v433 sur `main` pendant les contrôles ; arrivé après lui dans le thème, l'exercice est devenu le 6.5)

Demande de Turquet (novembre 2026) : « faire un exercice comme le 6.3 en
première mais les élèves doivent écrire leur calcul dans la 1re question dans
un champ de saisie par image ; quand on appuie sur Entrée, afficher le signe
égal au début de la nouvelle ligne, aligné verticalement avec le premier
signe = de la ligne du dessus. Pour la question 4, écrire la première ligne
de calcul et en dessous afficher une case suivie de = et d'une autre case […]
quand un élève appuie sur Entrée, afficher une autre ligne en dessous
exactement comme celle d'avant. On acceptera toute équation équivalente pour
chaque ligne. Dans la question 5, on ne tracera que la droite, sans les
signes et les couleurs et sans le point vert. »

**Le même moteur, une autre identité.** Kind `trd`, `test.qId =
'tracer-droite-libre'` ; `trdLibre()` la lit. Tirage, repère, points, règle
qui trace la droite, chemin animé et tableau de signes sont ceux du 6.3 ;
seules les questions 1, 4 et 5 changent. « Recommencer » choisit le départ par
l'identité (`restartCurrentTest`), le contexte du modèle aussi
(`ctxTrdLibre`).

**Les lignes vivent dans l'état de la question** (`test.trdE.lignes = {i1,
i2, eq}`) : elles partent avec la pause et reviennent avec elle. Une case de
TEXTE par ligne (`input.trd-lin`), dans la grille à trois colonnes du 6.3 —
les « = » tombent dans la même colonne sans rien mesurer. Entrée dans la
dernière ligne REMPLIE en ouvre une nouvelle (la grille se redessine, le
curseur y va) ; Entrée dans une ligne vide passe à la case suivante de
l'écran ; ⌫ dans la dernière ligne vide la retire. À l'équation, Entrée dans
le membre de gauche passe au membre de droite. Le « - » tapé s'écrit « − »,
le « * » « × » (la porte commune `caseCalculEcrire`, par `data-pave-plus`).

**Entrée est prise sur la FENÊTRE, en capture.** La porte commune des cases
vides (`#confirmer-vides`) écoute Entrée en capture sur le DOCUMENT : dans la
dernière case visible de l'écran (la dernière ligne de la question 1, tant
que la suite est fermée), elle aurait ouvert sa boîte au lieu d'ouvrir une
ligne. La fenêtre passe avant le document : `stopImmediatePropagation` y
garde Entrée pour les lignes. Éprouvé dans Chromium, la boîte ACTIVE (les
bancs la coupent ; l'essai non) : Entrée ouvre la ligne, la boîte reste
fermée.

**Le juge, ligne par ligne** — `trdLin`, un petit lecteur d'expressions du
premier degré (nombres à virgule, `x`, `+ − × ÷ * /`, parenthèses,
multiplication implicite « 2x », « 3(x + 1) » ; x × x ou ÷ x : illisible,
donc faux). Question 1 : une ligne est juste si sa valeur est f (x) ; le
calcul est FINI quand sa dernière ligne écrite est juste et n'est qu'un
nombre. Question 4 : une ligne « g = d » est juste si c'est une équation du
premier degré de même solution unique (`trdLigneEquivalente`) ; le calcul est
fini quand la dernière ligne est juste et s'écrit « x = nombre » ou « nombre
= x ». Chaque bloc a donc une case de plus au juge, sa « fin » (`s.fin`) :
pas une case de l'écran, jamais vide, juste si le calcul va au bout. Une
ligne ajoutée et laissée vide n'est pas une réponse : `data-facultatif`
(la boîte des cases vides ne la réclame pas) et le juge l'ignore.

**La correction.** Une ligne juste en bleu, fausse en rouge ; une première
ligne laissée vide reçoit le calcul type en vert ; un calcul qui ne va pas au
bout reçoit sa dernière ligne en VERT, ajoutée sous les siennes (le résultat,
ou « x = … »). En soutien, chaque ligne se colore à la frappe, et rien ne se
fige : une ligne juste mais pas finale doit rester ouverte, sans quoi Entrée
ne pourrait plus y ouvrir la suivante. Un calcul juste mais inachevé le dit :
« Va jusqu'au bout : … — la dernière ligne doit être le résultat seul. »

**La question 5 : la droite seule** (`trdNueSVG`) — ni rouge, ni bleu, ni
signes, ni point vert, la droite à l'encre ; la consigne dit de lire où elle
coupe l'axe, puis de quel côté elle est.

Plus de règles à choisir, plus de flèches de transposition, plus de bulles
d'aide : la demande ne garde que les lignes (les ids des cases à bulle
n’existent pas dans le 6.5, `trdGpOuvrir` ne s'ouvre jamais).

**Puis l'antécédent du 6.5 se lit sans chemin (v437, avec la fraction ci-dessous).** Demande de Turquet :
« pour l'antécédent, ne plus mettre l'animation sur le dessin ni le point de
départ ». Au 6.5 seulement (`trdLibre()`), `trdGraphSVG` ne pose plus
`trdChemin` : ni pointillés animés, ni point rouge sur l'axe des ordonnées,
ni graduation récrite ni mot « antécédent » — à la correction non plus. Le
bouton « ▶ Revoir le chemin » disparaît, la consigne dit le chemin en mots
(« pars de k sur l'axe des ordonnées, va horizontalement jusqu'à la droite,
puis verticalement jusqu'à l'axe des abscisses ») et le contexte du modèle
le dit aussi. Le 6.3 garde son chemin animé. Éprouvé dans Chromium : après
« une droite », aucun `.ima-chemin` ni `.ima-pt-axe` au 6.5, le chemin et
son point toujours là au 6.3.

**Et la division de la question 4 s'écrit en fraction (v437).** Demande de
Turquet : « dans la question 4, la division doit apparaître sous forme
fractionnaire ». Les cases de l'équation du 6.5 sont devenues des champs
MathLive (`pm-mf`) : « / » y empile la fraction selon la règle commune
(#fraction-numworks : « 10/2 » donne 10 sur 2 ; « −10/ » laisse le signe
devant la fraction), et le clavier mathématique les sert sur tablette. Le
juge ne change pas : la case se relit en texte (`pmPlain` → `toPlain`,
« \frac{10}{2} » → « (10)/(2) ») et `trdLin` lit les parenthèses. L'état
range le LaTeX (`getValue()`), qui revient empilé au redessin et après une
pause ; le juge lit la case quand elle est à l'écran, la valeur rangée
sinon (`trdEqTexte`). Les cases du calcul des images (question 1) restent
des cases de texte.

Deux pièges vus en l'exécutant :
- **MathLive signale sa saisie un peu APRÈS la frappe.** Un Entrée tapé
  aussitôt trouvait la ligne rangée encore vide : il passait à la case
  suivante au lieu d'ouvrir une ligne. `trdLibreTouche` relit les deux cases
  de la ligne au moment même d'Entrée.
- **En soutien, une ligne à moitié écrite rougissait** (« x = » sans second
  membre : pas une équation, donc fausse) et ouvrait « Comprendre mon
  erreur » au milieu de la frappe. Une ligne d'équation ne se colore plus
  tant qu'un de ses membres est vide.

**Puis une ligne de la question 4 a pu être une CHAÎNE d'égalités (v438, puis v439 : le 7.1 et le 7.2 avaient pris la v438 sur `main` pendant les contrôles).**
Demande de Turquet : la ligne « x = 4/(−2) = −2 » — la division et son
résultat écrits dans la même case de droite — était rouge, et la page
ajoutait en vert « x = −2 » dessous. Le « = » tapé dans la case faisait de
son membre une expression illisible pour `trdLin`. Les deux cases d'une
ligne se lisent désormais comme UNE chaîne coupée à chaque « = »
(`trdMaillons`) : deux maillons voisins sont soit deux nombres égaux, soit
une équation du premier degré de solution xk, et un maillon au moins porte
x (`trdLigneEquivalente`) ; la ligne est finale si la chaîne va de « x » à
un nombre seul (`trdLigneFinale`). « x = 4/(−2) = −3 » reste rouge.
Éprouvé dans Chromium, la case MathLive tapée au clavier (« / » empile la
fraction, → en sort, « =−2 ») : les deux cases `ok`, aucune ligne verte
ajoutée, la fin du calcul comptée juste.

**Puis la question 5 a attendu la droite, au 6.5 comme au 6.3 (v440).**
Demande de Turquet : « pour les exercices 6.5 et 6.3, ne pas afficher la
question 5 tant que la droite de la question 2 n'est pas tracée ». Le 6.3
le faisait déjà : ses questions 3, 4 et 5 vivent dans `#trdSuite`, fermé
jusqu'à l'étape « fin ». Le 6.5 montrait sa question 5 dès le départ, et ce
n'était pas une décision : sa question 4 (`trdLibreEquationHTML`) ferme
elle-même son cadre, et le `</div>` commun qui suivait, écrit pour la
question 4 du 6.3, fermait alors `#trdSuite` AVANT la question 5. Chaque
branche ferme maintenant son propre cadre, et la question 5 reste dans
`#trdSuite`. Contrôle : banc navigateur, « 11 sexdecies » — pour chacun des
deux exercices, les titres visibles avant la droite (1 et 2), puis après
(1 à 5). Avant le correctif, l'essai dans Chromium relevait « 1 2 5 » au
départ du 6.5.

**Au 6.5, la question 4 sur tablette : la touche « x », et ⏎ qui ouvre la
ligne.** Signalé par Turquet (novembre 2026). Le clavier mathématique n'avait
pas de « x » (`kbVarsFor` ne donnait de lettres qu'au calcul littéral) : l'élève
ne pouvait pas écrire « x = … » ; le 6.5 reçoit sa touche. Et la touche ⏎ de
ce clavier n'est pas une touche Entrée : c'est un « commit » MathLive, qui lève
« change » — et la porte commune des champs `pm-mf` (`pmNavSuiv`) passait à la
case suivante, sans jamais ouvrir la ligne du dessous. Un écouteur de
« change » sur la fenêtre, en capture, le prend avant elle : le « change »
d'un champ qui garde le focus est un Entrée (`trdLibreTouche`), celui d'un
champ qu'on quitte n'est rien. La case « x » qui rougissait pendant que l'élève
écrivait le membre de droite est devenue une règle de tout le site (voir
`02-conventions-ecran.md`, `gardeAutres`). Banc navigateur, « 11 septdecies ».

## 6.6 {image-second-degre} — l'image d'un nombre par une fonction du second degré, la fiche à ses valeurs (novembre 2026, Première v446)

Demande de Turquet : « en première faire un exercice comme le pdf » (la fiche
« image second degré »), « présenter comme le pdf avec des flèches et des
accolades », « quand une case est recopiée sur la ligne du dessous, la
recopier automatiquement » — puis, en cours de travail, « on prendra les mêmes
exemples avec les mêmes valeurs numériques ». Kind `isd`, écran `scr-isd`.

**Rien n'est tiré.** `ISD_FICHE` porte les sept questions de la fiche, dans
son ordre : 1² et (−1)², puis l'image de 1 et de −1 par x² + 3x − 1,
3x² − 2x + 1 et −3x² + 2x + 1. (La fiche écrit « f(1) = » devant l'image de
−1 de la deuxième fonction : coquille corrigée, l'écran écrit f(−1).) Aucune
question ne se répète : la fonction ou le nombre change d'une question à
l'autre. Le réglage « Questions » d'un devoir n'a donc pas de prise.

**La présentation de la fiche est une grille à cinq colonnes** (intitulé,
« f(x) = » / « f(1) = » / « = », puis un terme par colonne) : chaque terme de
f(x) tombe au-dessus de son groupe, chaque accolade au-dessus de sa case.
Flèches et accolades sont un `<svg>` posé par-dessus (`isdTrace`, sur le modèle
de `dvlTrace`), qui lit les positions RENDUES et se retrace au redimensionnement.
Les flèches visent le GROUPE entier (`isd-g1`, `isd-g2`) et non la parenthèse :
viser la parenthèse les faisait pencher, la fiche les a droites.

**La recopie automatique** : quand a ≠ 1, la ligne « = a × [carré]  [bx]  [c] »
est suivie de « = [a × carré]  bx  c », dont les deux derniers termes ne sont
que la recopie de la ligne du dessus. Ce sont des miroirs (`.isd-mir`, comme
les `.sui-mir` du 7.1) : du texte, pas des cases — ni notés, ni réclamés par
`#confirmer-vides`, recopiés à chaque frappe, après la correction et à la
reprise d'une pause (`restoreBoxes` appelle `isdMiroirs`). Le miroir d'une case
fausse recopie la saisie de l'élève : la correction verte est sur la case.

**Le terme qui en suit un autre garde son signe** (la règle du 5.2) : « 3 »
pour « +3 » au milieu de la ligne est jugé faux, et le pourquoi dit « le nombre
est juste, mais ce terme en suit un autre ». Une parenthèse se lit avec ou sans
ses parenthèses (« (−1) » ou « −1 »). Un point par question parfaite, les cases
justes au crédit partiel (`ptsExo`).

**Puis le « + » d'un terme positif est écrit par la page (v449).** Demande de
Turquet : « quand une case représentant le résultat d'un calcul de la ligne du
dessus est un terme d'une somme, si le nombre est positif mettre le signe +
devant cette case si elle n'est pas au début de l'expression ». Les cases du
second terme et du terme constant, et leurs miroirs, portent un « + » imprimé
(`isdPlus`) quand leur valeur est positive ; l'élève y écrit le nombre seul
(« +3 » reste accepté). Une valeur négative n'a rien devant sa case : l'élève
écrit « −2 ». La règle « le terme garde son signe » et son message (« le
nombre est juste, mais… ») disparaissent : le signe n'est plus à écrire que
pour un terme négatif, et un « 2 » pour « −2 » est simplement faux. La première
case d'une ligne (carré, produit, résultat) n'a jamais de signe imprimé.

## 6.7 {image-second-degre-libre} — le 6.6, les calculs rédigés (v448)

Demande de Turquet (novembre 2026) : « en première faire un exercice comme le
6.6, où l'élève doit écrire ses calculs dans un champ de saisie, qui affichera
"f(....) =" au début du champ, et avec la valeur de l'énoncé dans les
parenthèses. Quand on appuie sur Entrée, le champ passe à la ligne avec un "="
aligné sur le premier "=" de la ligne du dessus. On acceptera tout calcul avec
au moins une étape intermédiaire. »

**Un moteur à lui, kind `isdl`, écran `#scr-isdl`.** Les questions sont les
six images de la fiche du 6.6 (`ISD_FICHE` sans l'échauffement des carrés),
dans son ordre et à ses valeurs : rien n'est tiré, comme au 6.6.

**Les lignes, au geste du 6.5.** Une grille à trois colonnes — « f(1) », « = »,
la case — : les « = » tombent dans la même colonne sans rien mesurer. Entrée
dans la dernière ligne remplie ouvre une ligne « = [ … ] » (le curseur y va
À L'INSTANT, pas après un `setTimeout` : une frappe rapide après Entrée se
perdait pendant le redessin, vu dans Chromium) ; dans une ligne remplie qui
n'est pas la dernière, passe à la suivante ; dans la dernière ligne VIDE, la
retire et clique « Vérifier » (la porte `#confirmer-vides` voit passer ce
clic). ⌫ dans une ligne vide la retire. Entrée est prise sur la FENÊTRE, en
capture, comme au 6.5 ; la touche ⏎ du pavé des tablettes envoie un `keydown`
Entrée à une case en texte, donc passe par la même porte. Les lignes vivent
dans l'état (`test.isdlE = {idx, lignes}`) et partent avec la pause.

**Le juge** — `isdlVal`, un petit lecteur sans inconnue : nombres à virgule,
`+ − × ÷ * / :`, parenthèses, carrés (`²`, `^2` — la case offre la touche ^,
et `caseExposants` écrit « ² »), multiplication implicite « 3(−1)² » ;
−1² vaut −1 (la puissance passe avant le signe). Une ligne est juste si elle
vaut f(x) ; une ligne peut être une chaîne « 1 + 3 − 1 = 3 », chaque maillon
doit alors valoir f(x), et un « f(1) = » recopié en tête est toléré. Le calcul
est FINI quand la dernière ligne se termine par le résultat SEUL et qu'un
maillon au moins n'est pas un nombre seul — « −3 » écrit d'emblée est juste,
mais la question n'est pas parfaite : il manque l'étape intermédiaire, et le
message le dit avec un calcul type.

**La correction.** Juste en bleu, faux en rouge ; une première ligne vide
reçoit le calcul type en vert ; un calcul inachevé reçoit en vert, sous ses
lignes, ce qui manque (le calcul type et le résultat s'il n'y avait aucune
étape, le résultat seul sinon) — une case `sol` de plus, qui compte non juste
dans la note de l'exercice. Les cases GRANDISSENT avec leur contenu
(`isdlLargeur`) : la première capture montrait la correction verte coupée
avant son « = −3 ». En soutien, une ligne se colore une fois validée (la règle
commune de la case qu'on écrit) ; un calcul juste mais inachevé garde
« Revérifier » et dit « Va jusqu'au bout » plutôt que « corrige les cases en
rouge » devant un écran sans rouge.

## 6.8 {tracer-droite-pouce} — le 6.5, et un coup de pouce sous chaque question rédigée autrement qu'au 6.3 (novembre 2026, Première v465)

Demande de Turquet : « faire un exercice comme le 6.5 avec, quand c'est rédigé
différemment dans le 6.3 pour la même question, un bouton coup de pouce qui
permet d'afficher la résolution de la question comme dans le 6.3 ; on pourra
enlever le coup de pouce pour revenir à la version rédigée. »

**Le moteur du 6.5, une troisième identité.** Kind `trd`, `test.qId =
'tracer-droite-pouce'` ; `trdLibre()` est vrai pour le 6.5 ET le 6.8,
`trdPouceEx()` ne l'est que pour le 6.8. Chaque endroit où le 6.5 différait
du 6.3 lit désormais la question elle-même : `trdLibreQ(n)` — vrai au 6.5,
faux au 6.3, et au 6.8 vrai tant que le coup de pouce de la question n n'est
pas pris (`test.trdE.pouce[n]`). Le rendu (`renderTrd`), le chemin de
l'antécédent (`trdGraphSVG`), les cases jugées (`trdCases`) et les lignes
jugées (`trdLibreSubs`) le lisent : une question sur son coup de pouce se
montre ET se juge comme au 6.3.

**Les questions qui ont un bouton** : la 1 (les lignes rédigées / les trois
lignes à cases, bulles du soutien comprises), la 3 (la consigne en mots / le
chemin animé, son point rouge et « Revoir le chemin » — le chemin se déplie
au moment où le coup de pouce est pris), la 4 (les équations rédigées /
chaque ligne face à sa règle, les flèches de transposition) et la 5 (la
droite seule / la droite en couleurs, ses signes et son point vert). La 2 est
la même aux deux exercices : pas de bouton. Le bouton vit sous le titre de sa
question (`trdPouceHTML`) ; pris, il devient « ↩ Enlever le coup de pouce ».

**Rien ne se perd d'un aller-retour.** La bascule (`trdPouce(n)`) range les
cases écrites (`test.trdE.saisies`, les deux versions s'y accumulent), redessine
l'écran, et les rend ; les lignes rédigées et les listes vivaient déjà dans
l'état. Tout part avec la pause. Les boutons disparaissent à la correction.
Aucune pénalité n'a été demandée : la question vaut son point avec ou sans
coup de pouce (la lecture du 8.1).

**Contrôle** : banc navigateur, « 11 undevicies » — les boutons visibles avant
et après la droite, la question 1 basculée aller-retour-aller avec ce qui
était écrit des deux côtés, le chemin de la 3, les règles de la 4 et le retour
aux équations, la droite en couleurs de la 5, puis une copie juste mêlant
cases et lignes, comptée 1 point, sans bouton après la correction. Éprouvé
dans Chromium avant d'être écrit en contrôle.

## 6.9 {image-second-degre-pouce} — le 6.7 précédé des carrés, chaque question avec son coup de pouce en cases (v467 — écrit comme le 6.8, il est devenu le 6.9 : le 6.8 {tracer-droite-pouce} est arrivé sur `main` pendant les contrôles, puis trois v466 de plus)

Demande de Turquet (novembre 2026) : « en première faire un exercice comme le
6.7 en rajoutant la question 1 de l'exercice 6.6 en mode rédigé. Il faudra un
bouton coup de pouce pour chaque question qui permet d'afficher la résolution
de la question comme dans le 6.6. On pourra enlever le coup de pouce pour
revenir à la version rédigée. »

**Le même moteur que le 6.7, kind `isdl`**, distingué par `test.qId`
(`ISDP_ID`, comme le 6.2 et le 6.4 sur `ima`) : `startIsdp()`, Recommencer
lit le qId. Les sept questions de `ISD_FICHE`, dans l'ordre, carrés compris.

**Les carrés rédigés : des BLOCS.** Une question a un ou plusieurs blocs de
calcul (`isdlBlocs`) : un pour une image (« f(1) = »), deux pour les carrés
(« 1² = » puis « (−1)² = »), chacun avec ses lignes, sa valeur, son calcul
type (« 1 × 1 », « (−1) × (−1) ») et son étape exigée ; « 1² = 1 » recopié se
lit comme « f(1) = 3 » : sans étape. L'état devient
`test.isdlE = {idx, blocs}` (une pause d'avant, `{idx, lignes}`, est relue
comme un bloc). Les lignes du premier bloc gardent les identifiants du 6.7
(`isdl-l-2`), celles du second s'écrivent `isdl-l1-2`. Entrée dans la
dernière ligne vide d'un bloc passe au bloc suivant ; dans le dernier,
vérifie. Le 6.7 n'a qu'un bloc et ne change pas.

**Le coup de pouce** pose `q.aide` (dans la question : il tient à la pause)
et dessine la question du 6.6 SUR L'ÉCRAN DU 6.8 — `isdSchema` ou
`isdCarresHTML`, flèches, accolades, miroirs, et le juge du 6.6 (`isdCases`,
`isdJuste`, `isdCorr`, `isdPourquoi`) dans `isdlPouceCheck`. Les cases y
portent les identifiants du 6.6 : `#isdHost` est vidé avant, et le 6.6 vide
`#isdlHost` s'il porte un schéma — jamais deux `#isd-p1` dans la page.
`isdMiroirs` et le retraçage au redimensionnement servent les deux écrans, et
`restoreBoxes` recopie les miroirs à la reprise.

**Le retour**, « ✍️ Revenir à la version rédigée », juste avant « Vérifier »
et qui reste après la vérification — la règle du 8.1 (v463) : un
`MutationObserver` sur `#isdlActions` le remet quand la rangée est réécrite
(`isdlRetourSuivre`, coupé par `isdlRetourArreter` à chaque rendu et au
passage à la question suivante). La rédaction tapée avant le coup de pouce
est dans l'état : elle revient telle quelle. Après la vérification des
cases, la question est notée ; le retour pose `q.rejeu`, la feuille revient
pour s'entraîner (`#isdlRejeuNote`), « Vérifier ma rédaction » corrige sans
toucher ni au score ni aux réponses enregistrées, et « Question suivante »
est offerte d'emblée.

**Un point par question**, rédigée ou en cases (la lecture du 8.1 : aucune
pénalité demandée).

**Exécuté** (Chromium, un script de scénario hors banc) : Q1 rédigée juste
au clavier, Entrée qui passe du bloc 1² au bloc (−1)² ; coup de pouce avec
flèches tracées, retour avant vérification (rédaction intacte, coup de pouce
de nouveau offert) ; cases justes (un point), retour qui reste après
« Vérifier », rejeu juste sans point ni réponse de plus ; rédaction fausse
en rouge ; miroirs recopiés ; pause sur un coup de pouce entamé, reprise sur
le coup de pouce, cases, miroirs et bouton de retour remis. Aucune erreur de
page.
