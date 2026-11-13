# Première — étude de fonction

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

## 6.1 — lire l'image d'un nombre, le chemin animé (novembre 2026, Première v404)

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

Un thème neuf, le 6 « Étude de fonction », ajouté EN DERNIER : il ne
renumérote rien. L'identifiant est neuf lui aussi (`lire-image-animation`,
kind `ima`) : l'exercice n'est pas le 3.1.1 de la Seconde (`image-nombre`)
porté tel quel — le chemin s'y montre AVANT la réponse, là où la Seconde le
garde pour la correction —, et un identifiant partagé aurait mis sous le même
nom deux exercices qui n'enseignent pas le même geste.

**Le dessin est celui de la Seconde, recopié au mot près** : `lvGenPts` (sept
valeurs entières sur [−3 ; 3], deux ou trois morceaux monotones), la spline
de `lvPath`, le cadre de `lvGraphSVG`, l'étiquette Cf posée hors de sa courbe
par `etqLibre`, les constantes `ETQ_*`, le lecteur `lvReadInt`. Les noms sont
ceux de la Seconde, exprès : le contrôle « lvReadInt lit un entier
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
