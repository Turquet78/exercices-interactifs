# Seconde — le thème 8, Vecteurs

**Le thème vient EN DERNIER** (thème 8, v473) : un thème ajouté à la fin ne
renumérote rien — les sept premiers gardent leurs numéros, et aucun renvoi
{identifiant} ne bouge. Le contrôle de l'exercice relit les numéros de 2.1,
5.1, 6.1.1, 7.1 et 7.8 pour le prouver.

## {translation-grille} — image d'un point par une translation (8.1, v473)

**La demande** (Turquet, octobre 2026) : « en seconde créer un exercice comme
l'image », une fiche papier. En haut, huit vecteurs dessinés, v₁ à v₈ : vers
le haut, vers le bas, vers la gauche, vers la droite, puis les quatre
diagonales (haut-gauche, haut-droite, bas-droite, bas-gauche). Dessous, une
grille de six colonnes et quatre lignes, un point nommé à chaque croisement,
les lettres en serpentin : A B C D E F, puis L K J I H G, puis M N O P Q R,
puis X W V U T S. Enfin un tableau de six lignes « … a pour image … par la
translation de vecteur … » : quatre lignes donnent le point et le vecteur et
demandent l'image ; deux donnent le point et son image et demandent le
vecteur.

**La fiche, relue par le juge** : L → A par v₁, L → M par v₂, N → M par v₃,
H → G par v₄, puis I → O (une case vers le bas et une vers la gauche : v₈) et
T → P (une case vers le haut et une vers la gauche : v₅). C'est la copie
témoin du contrôle, posée telle quelle sur la première page.

**Trois pages, six cases par page, barème 18** — et le nombre de pages suit
le réglage « Questions » du devoir (`dmNbQuestions(3)`, tirage par
`distinctes()`). Chaque page tire **six directions différentes** sur les huit,
dans l'ordre de la fiche (quatre images, puis deux vecteurs), et pour chacune
un point de départ dont l'image **reste sur la grille** : un point du bord ne
part jamais vers l'extérieur. Un point peut servir deux fois, comme L sur la
fiche.

**La numérotation des vecteurs est tirée par page** (`q.ordre`, une
permutation des huit directions) : la première page suit la fiche — v₁ vers
le haut, v₂ vers le bas… —, les suivantes mélangent, pour que l'élève relise
la figure plutôt que de retenir « v₁, c'est le haut ». L'ordre ne fait pas
une autre question (`ordre` est dans `CLE_HORS`) : deux pages qui posent les
mêmes déplacements sont la même page.

**On range les indices, jamais les réponses** : une ligne porte le point de
départ (`p`, ligne × 6 + colonne), la direction (`d`, 0 à 7) et ce qu'on
demande (`t`) ; `vtrLignes()` recalcule l'image et le numéro du vecteur dans
la fonction qui corrige. Les deux figures sont des SVG écrits par la page
(`vtrSvgVecteurs`, `vtrSvgGrille`) : les flèches des vecteurs sont **à
l'échelle d'une case** (chaque composante vaut la même longueur, une
diagonale est donc plus longue qu'un côté — c'est un vrai vecteur de la
grille, pas un pictogramme), et les textes font 17 px, 12 px pour l'indice
d'un vecteur, ce que le contrôle des graphiques exige.

**La case de l'image est une saisie d'une lettre**, à la taille des lettres
qui l'entourent (`.vtr-in` et `.vtr-pt` ont le même corps), jugée sans tenir
compte de la casse — « a » vaut « A ». **Le vecteur se choisit dans une
liste** v₁ à v₈ (`.plc-sel.vtr-sel`, en italique à empattements comme la
lettre d'un vecteur). La correction passe par `corrChoix` — une case vide
reçoit la réponse en vert et ne rougit jamais, une liste fausse reçoit le
badge « v₈ » à côté d'elle (`.vtr-x`, comme `.rpd-x` au 7.8) —, et le message
dit le déplacement de la première case fausse : « Le vecteur v₁ déplace d'une
case vers le haut : en partant de L, on arrive en A. »

**Les deux figures se posent sur un fond uni** (v474, demande de Turquet le
jour même : « ne pas voir le quadrillage derrière ces dessins ») : la scène
(`.mp-stage`) est quadrillée comme une feuille, et ses carreaux passaient
derrière les flèches et la grille de points ; chaque figure (`.vtr-fig`) porte
désormais son fond blanc et son cadre.

**La flèche au-dessus de la lettre v** est posée par CSS (`.vtr-fl::before`),
dans les lignes comme dans le rappel ; dans une `<option>`, qui ne porte pas
de balise, le vecteur s'écrit « v₁ » avec un indice Unicode (`vtrVecTxt`),
et c'est cette écriture que reprennent les messages, la note enregistrée et
le contexte envoyé au modèle.

**Le juge** (`tests/verifier.js`, « image d'un point par une translation ») :
la place (8.1, thème « Vecteurs », les autres thèmes inchangés, pas de bouton
des tables), la grille et les huit déplacements de la fiche, 300 séances
tirées (trois pages, six lignes, directions distinctes, image sur la grille,
quatre images puis deux vecteurs, première page dans l'ordre de la fiche,
pages distinctes, 900 pages dont au moins 200 différentes, aucune fonction
rangée), 200 pages dont les images et numéros sont **reconstruits à part**
(une grille et des déplacements écrits dans le contrôle), puis le bouton sur
la fiche : la copie juste (6/6, score 6, les deux figures, huit flèches,
vingt-quatre lettres, la liste de v₁ à v₈), la minuscule acceptée, le piège
du sens inversé (M au lieu de A pour v₁ : rouge, les cinq autres restent
justes, le message nomme « vers le haut » et « arrive en A »), le piège sur
un vecteur (v₇ au lieu de v₈ : rouge, badge « v₈ »), deux cases vides (vertes,
remplies, « il te manquait 2 cases »), la copie entièrement vide (rien ne
rougit), et le soutien au fil de la saisie (peint sans verrouiller).

## {vecteurs-egaux-tableau} — vecteurs égaux, figure et configuration (8.2, v474)

**La demande** (Turquet, octobre 2026, d'après la fiche papier « Fiche 5 —
Vecteurs égaux ») : « créer un exercice comme le pdf, sans faire de rappel.
L'élève devra compléter les cases manquantes en choisissant parmi les 3
propositions. » La fiche est un tableau à trois colonnes — l'ÉGALITÉ de
vecteurs, la FIGURE, la CONFIGURATION géométrique (« … revient à dire que … »)
— et dix lignes où une seule colonne est remplie. Son rappel (les trois
équivalences dessinées) n'est PAS repris à l'écran : la page ne montre que le
tableau. Le rappel de cours derrière le bouton d'aide, lui, reste — tout
exercice en a un, et le contrôle « chaque exercice a son rappel » l'exige ;
il tient en trois lignes.

**Trois familles, celles de la fiche** : `par` — AB = CD revient à dire que
ABDC est un parallélogramme (quatre lettres) ; `mil` — AB = BC revient à dire
que B est le milieu de [AC] ; `conf` — AB = AC revient à dire que B et C sont
confondus. **Une page = une ligne du tableau = deux cases**, une par colonne
manquante : trois cartes A, B, C (la bonne et deux pièges) et une liste
A / B / C dessous — toucher la carte choisit sa lettre, la liste reste la
CASE que tous les contrôles universels connaissent (vide, juste, rouge). C'est
le motif du 2.5 ({intervalles-inegalite}) : des cartes pour les yeux, une
liste pour le juge.

**Dix lignes, dans l'ordre (famille, colonne donnée) de la fiche**
(`VGT_PLAN`) ; les lettres sont tirées, dans un ordre QUELCONQUE — HT = TC,
comme la fiche : avec des lettres rangées par ordre alphabétique, le milieu
serait toujours la lettre du milieu, et la configuration se lirait sans
regarder l'égalité. Ni O (un zéro), ni W, X, Y, Z (des coordonnées, et le x
de l'inconnue). `distinctes()` tient les lignes deux à deux différentes ;
`dmNbQuestions(10)` laisse un devoir allonger la séance. Barème 20 (deux
cases par ligne), `vgtCases(q).length` donne son poids à chaque ligne.

**On range la famille, la colonne donnée, les lettres et l'ordre des
propositions, jamais les réponses** : `vgtProps(q, col)` recalcule les trois
propositions d'une colonne, LA BONNE EN TÊTE, et `q.ordre[col]` dit à quelle
carte elle s'affiche. Le choix de l'élève se range dans `q.rep` — une clé que
`CLE_HORS` exclut de la distinction des questions — et la pause le retrouve,
avec la carte surlignée.

**Deux pièges qui n'en sont pas, écartés avant d'être écrits.** AC = BD dit
la MÊME chose que AB = CD (C − A = D − B ⇔ B − A = D − C) : c'est le même
parallélogramme, ABDC, et ACDB le nomme aussi. Un élève qui aurait choisi
« AC = BD » aurait eu RAISON et aurait été compté faux. Les pièges de la
famille `par` sont donc AB = DC et AD = CB (ABCD et ADBC, deux AUTRES
parallélogrammes), ABCD et ACBD. Le juge tient ce bord : aucun piège de
l'égalité ne doit être l'une des huit écritures de la bonne, aucun piège de
la configuration ne doit être l'un des huit noms du bon parallélogramme.
Même soin sur les figures : la troisième figure de `par` ne pose plus les
flèches A→C et B→D (le même parallélogramme, encore) mais un D déplacé, qui
rend les flèches non parallèles.

**Les figures** sont dessinées (`vgtSvg`), un trait et une pointe par
vecteur, dans une boîte de 200 × 100 ; les lettres à 15 px, parce que le
contrôle universel des textes de graphique en exige 12. Les pièges dessinés :
pour `par`, les flèches de sens contraires (AB = DC) et des flèches non
parallèles ; pour `mil`, les flèches qui se rejoignent en B (AB = CB) et un
coude de même longueur (B n'est pas sur [AC]) ; pour `conf`, deux flèches
qui partent de A dans deux directions, et la figure du milieu (A, B, C
alignés). La carte choisie se surligne en VIOLET (`--crd-a`, celui du liseré
de {croiser-denominateurs}) : ni le bleu du juste, ni le vert de la
correction — un surlignage bleu à côté de cases justes bleues aurait dit
autre chose que ce qu'il dit.

**La vérification** suit la convention commune : `corrChoix` sur chaque
liste (bleu juste, rouge faux, la case vide reçoit la correction en vert en
entraînement, reste vide en soutien), et `vgtPeindre` fait dire la même
chose aux cartes — la carte choisie bleue ou rouge, la bonne carte MONTRÉE en
vert quand l'élève ne l'avait pas choisie, sauf en soutien, où il corrige
lui-même. Le message nomme la lettre : « on lit les lettres en tournant
autour du parallélogramme — A, B, D, C. C'est ABDC, pas ABCD. »

**Le juge** (`tests/verifier.js`, « vecteurs égaux ») : la place (8.2, le
7.8 immobile, bouton des tables absent), 300 tirages (le plan de la fiche
ligne par ligne, le bon nombre de lettres, toutes différentes, hors de
OWXYZ, les propositions mélangées, les lettres tirées), les réponses jugées
par une SECONDE écriture de l'égalité et de la configuration à partir des
lettres (RSTU, puis HTC pour les deux autres familles), les pièges
équivalents à la bonne réponse (ci-dessus), trois figures distinctes qui
écrivent chaque lettre, puis le bouton : la copie juste des dix lignes
(20 / 20, deux cartes bleues par ligne), le piège ABCD rouge sans toucher la
figure juste à côté, la bonne carte en vert, le message « ABDC, pas ABCD »,
la case vide en correction (jamais rouge, sa carte montrée en vert, aucune
carte rouge, « Il te manquait 1 case »), et la carte touchée qui choisit sa
lettre et se range dans `q.rep`.

**Puis deux figures sur trois étaient « justes », et c'est l'élève qui l'a
vu** (Turquet, octobre 2026, deux copies d'écran, v479 → v480) : sur la
ligne « UKAH est un parallélogramme », deux dessins montraient UKAH
parallélogramme ; sur la ligne « J est le milieu de [RA] », deux dessins
montraient J au milieu de [RA]. Les pièges dessinés gardaient les MÊMES
points que la bonne figure et ne changeaient que le sens d'une flèche : A→H
au lieu de H→A, les quatre points U, K, A, H restaient aux quatre sommets du
parallélogramme ; A→J au lieu de J→A, J restait au milieu. Le dessin disait
« le piège », les points disaient « la bonne réponse », et un élève qui
regarde les points — ce qu'on lui apprend — avait deux bonnes figures. Le
troisième dessin de `par` n'arrangeait rien : ses flèches « non parallèles »
ne faisaient que 13° d'écart, et se lisaient comme un parallélogramme un peu
penché. **Un piège dessiné est faux PAR SES POINTS, jamais seulement par le
sens de ses flèches.** Les pièges sont désormais, pour `par`, le
parallélogramme ABCD (les flèches A→B et D→C, égales, C et D échangés, une
forme un peu différente pour que l'œil ne cherche pas la différence
d'étiquettes) et deux flèches à 38° l'une de l'autre ; pour `mil`, A au
milieu de [BC] (les flèches B→A et A→C, égales, sur une droite qui descend).
Chaque figure est redevenue COHÉRENTE : ses deux flèches sont égales (sauf
le coude et les deux directions, qui le disent), et sa phrase (`vgtFigTxt`,
l'aria-label et le contexte envoyé au modèle) raconte ce qu'elle montre —
avant, « de même longueur mais de sens contraires » décrivait un dessin
qu'aucune ligne de la fiche ne nomme. `conf` n'a pas bougé : ses pièges
(deux flèches qui s'écartent, trois points alignés) étaient déjà faux par
leurs points.

Le contrôle (`tests/verifier.js`, « vecteurs égaux », section 2) relit chaque
dessin comme l'élève le regarde : les cercles sont les points, chaque lettre
va au point le plus proche, chaque flèche est un trait et sa pointe. Sur les
POINTS, la configuration de la ligne (AB = CD, B milieu de [AC], B = C) doit
être vraie sur la figure 0 et FAUSSE sur les deux autres ; chaque flèche doit
joindre deux points nommés ; les flèches des deux parallélogrammes sont
parallèles, celles du troisième dessin font au moins 30°. Éprouvé sur la
page de v479 : « par figure 1 : les points du piège vérifient la
configuration », « par figure 2 : les flèches « non parallèles » ne font que
13° », « mil figure 1 : les points du piège vérifient la configuration » —
les trois défauts, nommés, aucun autre.

## {vecteurs-egaux} — retrouver les vecteurs égaux dans une figure (8.3, v475)

**Trois sessions ont créé le thème 8 le même jour** — la translation du 8.1,
le tableau du 8.2 et cet exercice, chacune voyant un thème « Vecteurs » neuf sur sa branche,
chacune en v473, chacune avec SON `19-seconde-vecteurs.md` : le motif du
thème 7 (7.1 et 7.2, septembre 2026), à l'identique. Le dernier arrivé sur
`main` prend la place 8.3 et le numéro 475, et les deux chroniques vivent
dans ce seul fichier. Les préfixes (`vtr`, `vgt`, `veg`) ne se sont pas heurtés ;
la fusion, elle, a laissé deux blocs amputés de leur FIN commune (les
quatre dernières lignes de `ctxVtr`, les trois du contrôle de la
translation) : quand deux ajouts se terminent par les mêmes lignes, git les
tient pour communes et ne les écrit qu'une fois — la vérification de syntaxe
de chaque bloc `<script>` l'a vu avant tout banc.

**La demande** (Turquet, octobre 2026, d'après une fiche papier « Retrouver
les vecteurs égaux dans la figure ») : un rectangle quadrillé de ses milieux
(E, F, G, B, J), de ses diagonales et de deux obliques, onze points nommés
(H et D aux croisements), puis cinq lignes « AB = … = … = … = … = … » où
l'élève écrit, deux lettres par case, tous les vecteurs égaux à celui qui
ouvre la ligne. « On pourra changer la forme du dessin et les traits (dans un
carré, un triangle, un hexagone…). Il faut au moins un deuxième vecteur égal
pour chaque question. »

**La figure est une DONNÉE, pas un dessin.** `VEG_FIGURES` range, pour
chaque forme, ses points nommés (coordonnées dans un repère abstrait) et les
traits qui les relient — rien d'autre. Le dessin SVG, les familles de
vecteurs égaux, les lignes posées, le juge et l'explication s'en déduisent
tous. Sept formes au départ : le rectangle de la fiche (`rect9`), un carré
partagé en quatre avec ses diagonales, le même en parallélogramme, un
triangle avec ses milieux et le point L qui fait de ABLC un parallélogramme,
un triangle partagé en tiers avec deux familles de parallèles, un hexagone
régulier et ses six rayons, un trapèze partagé en six triangles (la grande
base en trois, la petite en deux, les obliques en zigzag). Une forme ajoutée demain n'écrit que ses points et ses traits, et le
contrôle la relit sans rien déclarer.

**Deux vecteurs sont égaux quand ils ont les mêmes coordonnées** : les
couples ordonnés de points nommés se rangent par déplacement
(`vegClasses`), et une famille est une classe de vecteurs égaux. On ne pose
en tête de ligne qu'un vecteur dont la famille compte de 2 à 6 membres — au
moins UN autre vecteur égal (la consigne), au plus CINQ cases (la fiche).
**Tout couple de points nommés compte, qu'un trait le dessine ou non** : la
fiche elle-même attend EJ et BG pour FK, que rien ne relie. Le vecteur de
TÊTE, lui, se choisit de préférence le long d'un trait (`vegTrace`), pour que
l'élève le voie. Sur la figure de la fiche, le moteur retrouve exactement ses
lignes : AB → BC, EF, FG, IJ, JK ; FK → AF, EJ, BG ; CD → DH, HI ; HC → ID.
(La fiche ne laissait que trois cases à IE, qui en a cinq : EA, JF, FB, KG,
GC — on les demande toutes, comme pour AB.)

**Le triangle des milieux seul n'avait que trois familles** (AI = IB = KJ et
ses deux sœurs) : trop peu pour cinq lignes. Le point L, symétrique de A par
rapport au milieu J de [BC], en fait un parallélogramme ABLC et double les
familles. Le prototype sous Node a compté les familles de chaque forme avant
que la page ne les dessine ; c'est lui qui a montré le manque. **Le premier
trapèze** (la grande base partagée en trois, deux obliques) n'avait que cinq
familles, quatre d'entre elles à UNE case : la capture montrait quatre lignes
« DA = … » à une seule case. Partagé en six triangles, il en a six, de deux à
cinq cases.

**Cinq lignes par figure, jamais une famille ET son opposée** : les familles
riches passent devant sans sortir à chaque fois (un rang tiré, pondéré par
la taille), et les lignes vont du plus de cases au moins, comme la fiche.
Trois figures par séance (`VEG_NB`), de FORMES différentes tant que la séance
est plus courte que le vivier (`distinctes()` sur la forme), de forme ou de
retournement différents au-delà ; le réglage « Questions » d'un devoir
allonge la séance (`dmNbQuestions`). **Le retournement** (`fx`, `fy` : miroir
horizontal, vertical, les deux) ne change aucune égalité de vecteurs,
seulement l'image — il quadruple le vivier.

**Le sens compte : BA n'est pas AB.** C'est le piège de l'exercice, et
l'explication le nomme : opposé (même direction, même longueur, sens
contraire — « c'est AB qui est égal à … »), colinéaire (même direction,
autre longueur), ou ni l'un ni l'autre. **L'ordre des cases d'une ligne est
libre**, et un vecteur écrit deux fois n'est juste qu'une fois — la seconde
case est fausse, la première reste juste. Une ligne se juge donc ENTIÈRE
(`vegJugeLigne`), jamais case par case : la correction écrit, dans chaque
case fausse ou vide, un des vecteurs attendus qui manquent encore. Minuscules,
espaces, flèches tapées sont ignorés (`vegLit`) ; « ab » vaut AB.

**On range la forme, son retournement et les vecteurs de tête, jamais les
réponses** : `vegLignes()` recalcule les familles dans la fonction même qui
corrige. Le champ s'appelle `dep`, pas `v` — `v` est retiré de la clé de
`distinctes()` comme une tournure, et deux figures aux vecteurs différents
seraient passées pour la même question.

**Le dessin** (`vegSvg`) : pas de quadrillage — celui de `.mp-stage` ferait
croire à un repère, et l'élève raisonne sur la figure, pas sur des
coordonnées. Une lettre se pose du côté opposé au centre de la figure, donc
hors du polygone et de ses traits ; un point intérieur (le centre, un
croisement) a sa place écrite à la main (`etq`), dans un secteur libre entre
ses traits, et cette place suit le retournement. Deux captures ont montré ce
que le calcul ne voit pas : le J du triangle est le CENTRE du parallélogramme
ABLC — « du côté opposé au centre » ne veut plus rien dire —, et le E du
carré, posé à 18 px du croisement de quatre traits, touchait une diagonale ;
tous deux ont reçu leur place écrite. Lettres à 19 px dans une
boîte de 460 — 13 px rendus sur un téléphone, au-dessus des 12 px que le
banc exige des textes de dessin. La flèche du vecteur est dessinée en CSS
au-dessus des deux lettres, et au-dessus de chaque case, pour dire qu'on y
attend un vecteur. Le « = » et sa case forment un bloc insécable
(`.veg-grp`) ; la rangée peut se replier sur un téléphone, jamais entre les
deux. Les cases ont la taille des lettres qui les entourent (1.45rem,
Fredoka, comme `.red-expr`), et leurs trois verdicts reprennent les encres de
`.red-in` : juste en bleu, faux en rouge, correction en vert.

**Pas de bouton des tables** (l'identifiant est dans `TABLES_SANS` et dans
`tablesAide.sans` du profil) : on lit une figure, on ne multiplie rien.

**Le contexte envoyé au modèle** (`ctxVeg`) décrit la figure par ses points
et ses coordonnées, ses traits, les lignes posées et les réponses secrètes —
et lui demande de raisonner avec les parallélogrammes, les milieux et les
longueurs de la figure, jamais avec des coordonnées que l'élève ne voit pas.

**Le juge** (`tests/verifier.js`, « vecteurs égaux dans une figure ») : la
place (8.3 derrière la translation du 8.1 et le tableau du 8.2, le thème 7 immobile, pas de bouton des tables) ; chaque forme
relue depuis ses coordonnées par une SECONDE écriture des familles,
indépendante de `vegClasses` (au moins six points, des lettres majuscules,
pas deux points au même endroit, des traits entre des points connus, et au
moins cinq familles de 2 à 6 membres sans leurs opposées) ; 300 séances
tirées (trois figures de formes différentes, cinq lignes chacune, les
réponses attendues égales à celles de la seconde écriture, de 1 à 5 cases par
ligne, du plus de cases au moins, jamais deux lignes de la même famille ni
d'une famille et son opposée, chaque forme sortie au moins une fois) ; puis
le bouton sur la figure de la fiche : seize cases, les onze lettres
dessinées, la copie juste (16/16), la même en minuscules et dans un autre
ordre, le piège BA (rouge, ses voisines justes, le message dit « opposé » et
« sens », la correction propose un vecteur égal), BC écrit deux fois (la
première juste, la seconde rouge, le message le dit), AC pour AB (rouge, le
message parle de longueur), une case vide (correction FB, jamais rouge, le
message nomme le manque), la copie entièrement vide (rien de rouge), le
barème égal au total des cases de la séance, `qId`.

**Puis le TOTAL des cases est devenu la consigne : de 10 à 12 vecteurs à
trouver par figure (v480).** Turquet, octobre 2026 : « pour l'exercice 8.3,
il faudrait entre 10 et 12 vecteurs à trouver pour chaque dessin ». La fiche
posait cinq lignes quel que soit leur total, et le total allait de 10 sur
l'hexagone à 16 sur le rectangle — et le triangle des milieux, avec ses six
familles (2 2 2 1 1 1), ne pouvait pas dépasser 9. `VEG_CASES` (`[10,12]`)
porte la consigne ; `VEG_LIGNES` n'est plus un nombre mais deux bornes
(`[4,6]`) : jamais deux lignes de cinq cases pour faire le compte, jamais dix
lignes d'une case. Le tirage (`vegGenQuestion`) est une recherche en
profondeur dans l'ordre tiré des familles : la première combinaison qui tient
les deux bornes, sans famille ET son opposée. **Et l'ordre tiré a dû
changer avec lui** : le rang « taille + hasard » d'avant, qui suffisait quand
on prenait les cinq premières, faisait sortir 5 + 5 + 1 + 1 neuf fois sur dix
sur le rectangle, le carré et le parallélogramme dès que le total a été
borné — le prototype sous Node l'a mesuré sur 3 000 séances. Le rang est
désormais un tirage pondéré par le nombre de cases (`Math.pow(Math.random(),
1/cases)`) : une famille de cinq cases passe en tête cinq fois plus souvent
qu'une famille d'une case, et le rectangle sort vingt-cinq combinaisons
différentes au lieu de quatre.

**Trois figures ont gagné des points, parce que le prototype a d'abord
compté** ce que chacune pouvait donner (familles sans leurs opposées, cases
par famille, nombre de combinaisons de 4 à 6 lignes faisant 10 à 12) :
le triangle des milieux plafonnait à 9, l'hexagone et le trapèze
n'atteignaient 12 qu'en posant leurs six familles à chaque fois. Le
triangle ABLC est devenu **un triangle partagé deux fois en quatre** — ABC,
le triangle DEF de ses milieux, le triangle GHI des milieux de DEF — neuf
points, neuf familles (2 2 2 2 2 2 1 1 1) ; l'identifiant `triMilieux` ne
change pas, seuls ses points changent. **L'hexagone a reçu G, H, I, les
milieux de trois rayons sur six** ([OA], [OC], [OE]) : douze familles
(3 3 3 2 2 2 et six à une case). **Le trapèze a reçu H et I, les milieux de
ses côtés obliques** : huit familles. Leurs places sont écrites (`etq`) là où
le calcul se trompe, et la capture l'a montré une fois de plus : le H du
triangle, milieu de [EF], est à la hauteur du centre de la boîte — « du côté
opposé au centre » le posait SUR son trait, à gauche du point. Les trois
figures ont été capturées dans Chromium, à l'endroit et retournées.

**Le contrôle a suivi la consigne** (`tests/verifier.js`) : `VEG_CASES` vaut
`[10,12]` — la demande elle-même, écrite en dur, pour qu'un réglage qui
dérive se voie — ; pour chaque forme, une table des totaux atteignables par
nombre de lignes dit si une combinaison existe dans les bornes, et nomme
les cases par famille quand elle n'existe pas ; sur 300 séances, chaque
figure compte de 10 à 12 vecteurs à trouver, relus depuis la seconde
écriture des familles, en 4 à 6 lignes. Le rejeu de la fiche (seize cases,
cinq lignes) reste tel quel : il éprouve le juge, pas le tirage, et pose ses
lignes à la main.

## {translation-quadrillage} — déplacer un point en suivant le chemin u⃗ (8.4, v476)

**La demande** (Turquet, octobre 2026, une autre conversation que celle du 8.1 :
« en seconde créer un exercice comme le pdf joint ») : la *fiche 2 sur les
vecteurs*. Un quadrillage où une flèche u⃗ est dessinée, des points A, B, C,
D, E, et la consigne « déplacer le point A en suivant le chemin u⃗ et appeler
le nouveau point A′ » ; puis le même quadrillage sans flèche, où le chemin
est « celui qui va de A à B » (le vecteur AB⃗), et des points C, D, E, F, G à
déplacer. En bas de la fiche, la phrase à retenir : « *l'image de A par la
translation de vecteur u⃗ est le point A′* ». Les deux conversations ont
créé le thème 8 le même jour ; celle-ci a repris `main` trois fois et s'est rangée
DERRIÈRE le 8.1, le 8.2 et le 8.3 — ajouté en dernier, l'exercice ne renumérote rien.

**{translation-quadrillage} (8.4) : les deux exercices de la fiche sont les
deux FORMES du tirage.** `q.forme` vaut `'u'` (la flèche dessinée, nommée u⃗,
les points à déplacer sont A, B et C) ou `'ab'` (deux points A et B SANS
flèche — lire le chemin fait partie du travail —, les points à déplacer sont
C, D et E). Trois images par question, quatre questions par séance
(`TRL_NB`, et `dmNbQuestions()` quand un devoir règle autrement), tirées par
`distinctes()` sur la clé des données : le vecteur s'appelle `vec`, pas `v` —
`v` est la tournure, que la clé écarte, et deux questions aux vecteurs
différents auraient passé pour la même.

**Puis les deux formes ont ALTERNÉ** (v482, demande de Turquet, octobre 2026 :
« en seconde dans le 8.4, il faut alterner une question avec un vecteur u et
une autre avec le vecteur AB »). Chaque question tirait sa forme au sort
(`pick(['u','ab'])`) : une séance de quatre questions pouvait n'avoir que des
flèches, ou que des points — une chance sur huit, assez pour qu'un élève ne
voie jamais la seconde moitié de la fiche. La forme se lit désormais sur
l'INDEX de la question (`trlForme(i)` : u aux rangs pairs, AB aux rangs
impairs), passée à `trlFabrique(forme)` par `distinctes()` — par l'index, pas
par un compteur, pour qu'une question retirée comme doublon ne décale pas
l'alternance (le motif des pourcentages, `incs[i%incs.length]`). Le secours du
vivier épuisé rend lui aussi une question de la forme demandée. Le contrôle du
banc principal, qui se contentait de voir sortir les deux formes en deux cents
séances, exige l'ordre u, ab, u, ab sur chaque séance tirée, et u, ab, u, ab, u
sur cinq questions — le réglage « Questions » d'un devoir peut être impair.

**Le tirage est garanti LISIBLE, et le contrôle le relit sur deux cents
séances.** Tous les points — les trois sources, leurs trois images, et A et B
ou les deux bouts de la flèche — sont dans le quadrillage (13 colonnes sur 9
lignes), deux à deux NON VOISINS (distance de Tchebychev ≥ 2 : deux
étiquettes côte à côte se liraient l'une sur l'autre), et aucun point nommé ne
tombe sur la flèche u⃗ (ses nœuds intermédiaires se comptent par le pgcd des
composantes). Le chemin fait au moins deux carreaux. La question ne porte que
`forme`, `vec`, `o` (l'origine de la flèche, ou le point A), `src` et `rep`
(trois `null` au tirage) ; elle survit au JSON de la pause. Éprouvé par
sabotage : des points seulement « distincts » au lieu de « non voisins » ont
rougi dès le premier tirage, quatre paires nommées.

**La bonne réponse n'est jamais rangée à côté de la question.** L'image de
chaque point se recalcule (`trlImage`) depuis la source et le vecteur — les
données MÊMES qui dessinent le quadrillage —, par la fonction qui corrige
(`trlCheck`), par le dessin de la correction et par le contexte du modèle. Une
image calculée de travers (le `−` à la place du `+` sur la seconde
composante) a rougi au tirage même, avant d'atteindre le juge.

**Le geste est celui de {placer-image}, avec trois stylos.** Le point se POSE
au clic sur un nœud ; l'écouteur est DÉLÉGUÉ à l'hôte, le SVG étant réécrit à
chaque pose ; `trlNoeud()` relit la géométrie dans le SVG RENDU (`data-m`,
`data-c`, `data-w`, `data-h`) et s'accroche au nœud le plus proche — aucune
coordonnée recopiée. Trois images, donc trois stylos « ● Placer A′ », « ●
Placer B′ », « ● Placer C′ » (`trlChoisir`) : poser un point passe au stylo
suivant encore vide, recliquer sur un de ses points le RETIRE et rend son
stylo, cliquer ailleurs avec le même stylo le déplace. jsdom n'a pas de mise
en page : le clic, le stylo qui avance et le reclic qui retire ne se mesurent
que dans le banc navigateur (« 6 quadragies bis »), qui clique le bon nœud,
un nœud décalé d'un tiers de maille, et retire au reclic. Le banc principal,
lui, pose `rep` à la main — la répartition de {placer-image}.

**La demande en énoncé, le mode d'emploi en plus petit.** « Déplace les points
A, B et C en suivant le chemin u⃗ : place les points A′, B′ et C′, images de
A, B et C par la translation de vecteur u⃗. » est l'énoncé (`.lv-instr`, qui
prend l'encadré) ; le geste — choisir le stylo, cliquer le nœud, déplacer,
retirer — se lit après, dans `.trl-sous`, à 0,85 rem contre 1,04. Le nom d'un
vecteur est une lettre coiffée d'une flèche : la classe `.vec`, dont le
`::before` porte la flèche, dans l'énoncé, le rappel et les corrections ; sur
le dessin, un « u » en fonte mathématique sous un petit trait fléché.

**Chaque image se juge SEULE, et une image manquante ne rougit jamais.** La
copie juste vaut 3 ; une image fausse coûte son point et pas celui des deux
autres ; une image NON POSÉE n'est pas une erreur : sa pastille (`pts-case`,
comptée par `ptsEcran`) ne rougit pas — en entraînement elle devient `sol`
(verte) et le dessin montre l'image attendue en vert : un anneau, son
étiquette, et le chemin depuis la source en pointillés ; en soutien rien ne
se révèle et rien ne se verrouille tant que la copie n'est pas juste, la
pastille et le point se colorent à la pose (`trlLive`). Vérifier sans AUCUN
point ne peint rien et ne verrouille rien : le message redit le geste. Les
encres suivent la convention commune — le point de l'élève est bleu, rouge
quand il est faux, la correction verte (`.trl-sol`, le motif de `.pim-sol`) —
et le banc « 9 bis » les relit comme toutes les autres. Éprouvé par sabotage
des deux côtés : une pastille vide peinte en rouge a rougi (« n'est pas sol,
elle est bad »), et un soutien qui verrouille une copie fausse a rougi trois
fois (verrouillage, révélation, copie corrigée).

**Le contexte envoyé au modèle dit le chemin en carreaux.** « 3 carreaux vers
la droite et 2 carreaux vers le bas » (`trlChemin`), les points en (colonne ;
ligne) comptées depuis le coin bas gauche, ce que l'élève a posé (juste, FAUX,
pas encore posé), et les images attendues derrière `CTX_SECRET`. La même
phrase en carreaux sert la correction écrite à l'élève. Le bouton des tables
n'est pas proposé : on n'y multiplie rien (`TABLES_SANS`, et `tablesAide.sans`
dans le profil — deux sources, donc un vrai contrôle).

**Ce qu'aucun banc ne voit** : la fiche 1 (construire le point D tel que ABDC
soit un parallélogramme) n'est pas portée — Turquet a précisé que la fiche 2
était « le bon fichier » ; et la phrase à compléter « l'image de B par la
translation de vecteur … est le point … » de la fiche est dite dans la
correction et le rappel, pas demandée dans une case.

## {parallelogramme-point} — le quatrième point d'un parallélogramme (8.5, v477)

**Deux changements sous un seul numéro.** La PR 630 (brouillon étiqueté,
bilan « en cours ») et celle-ci sont arrivées sur `main` à quatre minutes
d'écart, toutes deux en v477 : le contrôle des versions compare une branche à
`main`, pas deux branches entre elles, et la fusion n'y a rien vu. Le numéro
est passé à **v478** aussitôt après, sans autre changement, pour qu'un
numéro désigne de nouveau un seul état de la page.

**Une question = un quadrillage = trois cases.** Le quadrillage est celui de
la fiche : 9 carreaux sur 9, les nœuds de 0 à 9 dans chaque sens, les trois
points marqués d'une croix et d'une lettre — jamais le caractère « x », qui
tomberait sous la règle de l'inconnue en italique : la croix est deux traits
SVG. Les deux premières cases sont les deux lettres de la phrase (deux listes
A, B, C, D) ; la troisième est le nœud posé, qui doit être D exactement. La
séance tire six questions (`dmNbQuestions(6)`), la première moitié en ABDC
comme l'exercice 1 de la fiche, la seconde en ABCD comme l'exercice 2 ;
barème 18.

**La forme change la réponse, et c'est le piège de la fiche.** Dans ABDC les
sommets se suivent A, B, D, C : D est en face de A, et le chemin de A à B
est celui de C à D. Dans ABCD ils se suivent A, B, C, D : D est en face de
B, et le chemin de **B à A** est celui de C à D. La phrase attendue sort de
`vecChemin(q)`, le point de `vecQuatrieme(q)` — tous deux recalculés dans la
fonction qui corrige. **On range les trois points et la forme, jamais D.**

**Le tirage refuse trois choses**, cinq cents essais au plus : trois points
alignés (le déterminant est nul, il n'y a pas de parallélogramme) ; un D qui
sortirait du quadrillage — l'élève ne pourrait pas le poser ; deux points à
moins de deux carreaux l'un de l'autre, D compris, parce que leurs lettres se
chevaucheraient. Le repli, jamais atteint en pratique, est un
parallélogramme valable dans les deux formes. Les questions passent par
`distinctes()` : deux quadrillages d'une même séance n'ont jamais les mêmes
trois points dans la même forme.

**Le quadrillage ne peint rien au fil des clics.** Chaque nœud libre est une
cible — invisible, elle ne se montre qu'au survol —, avec la zone de touche
de 14 px à l'écran de {solutions-graphique} (un trait de longueur nulle à
bouts ronds, `vector-effect:non-scaling-stroke`, dans une couche dessinée
AVANT les cibles). Cliquer un nœud y pose D en bleu, cliquer un autre nœud
l'y déplace, re-cliquer le nœud posé le retire : un seul D à la fois. La
sélection vit dans la question (`q.selD`) : elle part avec la pause et
revient avec la reprise. Colorer le nœud au moment où on le pose dirait s'il
est juste avant même de vérifier : l'exercice est déclaré dans
`soutienEnDirect.sans`, raison écrite, comme « tvg ».

**Le soutien colore à la vérification, sans montrer D.** Les lettres passent
par `corrChoix` — la juste en bleu et figée, la fausse en rouge sans badge,
la vide neutre ; le nœud juste devient bleu et figé (`test.vecFige`), le
nœud faux rouge, à déplacer. Le message dit la méthode — compter le chemin
en carreaux, le refaire depuis C, relire l'ordre des lettres —, jamais les
deux lettres ni la position de D.

**La correction finale trace la figure.** Bleu pour ce qui est juste, rouge
pour ce qui est faux, vert pour la bonne réponse : la lettre attendue en
badge à côté d'une liste fausse (ou écrite dans la liste vide, classe
`sol`), D en vert sur le quadrillage s'il manquait ou était ailleurs, et par
dessus le parallélogramme en pointillés verts avec ses deux chemins égaux
fléchés — celui de la phrase, et celui de C à D. Le pourquoi ne parle que
des vraies fautes : l'ordre des lettres pour la phrase (« D est en face de
A »), le chemin compté en carreaux pour le point (« 3 carreaux vers la
droite puis 2 carreaux vers le haut ») ; une case vide passe par
`msgAvecVides`, qui dit d'abord ce qui manquait.

**Ce que le modèle sait** (`ctxVec`) : le quadrillage décrit par ses
coordonnées — il ne voit pas le dessin —, la forme, les trois points, ce que
l'élève a choisi et posé, et les réponses attendues sous clause de secret :
ni les deux lettres, ni la position de D. La méthode qu'il doit faire
appliquer est celle du rappel (`RAP_VEC`) : lire les lettres dans l'ordre,
repérer les côtés opposés, compter le chemin, le refaire depuis C.

**Le poids d'une question se lit par la convention de nommage** :
`vecCases(q)` rend ses trois identifiants, et un devoir qui coupe la séance
coupe le barème avec elle. Le nœud posé est une `pts-case` (le bloc de la
consigne b), peint `ok`, `bad` ou `sol`) : la note affichée compte bien
trois cases, pas deux.

## {egalite-vectorielle-point} — placer un point pour une égalité de vecteurs, et nommer le parallélogramme (8.6, v481)

**La demande** (Turquet, octobre 2026) : « en seconde créer un exercice comme
le 8.5, où il faut placer un quatrième point pour avoir une égalité
vectorielle avec les lettres A, B, C et D dans l'ordre que tu veux ; puis en
deuxième question il faut nommer le parallélogramme correctement ». Le 8.5
donne le NOM du parallélogramme et demande la phrase des chemins et le point ;
le 8.6 donne l'ÉGALITÉ de vecteurs et demande le point, puis le nom. Même
quadrillage, même geste, l'inverse comme donnée.

**Le quadrillage du 8.5 est devenu un moteur partagé.** `vecSVG` dessinait
les trois croix A, B, C et une cible « D » par nœud libre, en dur ;
`vecQuadrillage(o)` reçoit les points donnés, la lettre à poser, le nœud
choisi, le préfixe des identifiants et la fonction du clic, et `vecSVG(q)`
n'est plus qu'un appel. De même `vecFigure(P, ordre, fleches, marker)`
trace le parallélogramme en pointillés verts et ses chemins fléchés pour les
deux exercices. Rien n'a changé à l'écran du 8.5 — même rendu, même CSS
`.vec-svg` —, et ses identités restent les siennes (`vecn-`, `vecPose`,
`vecCorr`) : deux exercices partagent un moteur, pas leur identité.

**L'égalité est une permutation des quatre lettres** (`q.eq`, par exemple
`'BDAC'` : le vecteur BD est égal au vecteur AC), tirée au hasard — avec des
lettres toujours dans le même ordre, l'élève retiendrait une recette au lieu
de lire l'égalité. **La lettre qui manque** (`q.m`) est l'une des quatre,
tirée elle aussi, et les trois autres sont rangées sous leur lettre (`q.A`,
`q.B`, `q.D`…). Rien d'autre dans la question : le point attendu
(`vepPoint`) et les noms du parallélogramme (`vepNoms`) se recalculent dans
la fonction qui corrige. Le tirage refuse ce que refuse le 8.5 — trois
points plats (déterminant sous 6), un point hors du quadrillage, deux
points à moins de deux carreaux —, et les questions passent par
`distinctes()` ; `dmNbQuestions(6)`, barème 12 (deux cases par question,
`vepCases`).

**Le chemin à refaire dépend de la lettre qui manque**, et c'est la
difficulté nouvelle. PQ = RS : si le point manquant TERMINE son vecteur (S,
ou Q), on compte le chemin de l'autre vecteur et on le refait depuis le
départ du sien (S = R + PQ) ; s'il le COMMENCE (R, ou P), on refait ce chemin
À L'ENVERS depuis l'arrivée (R = S − PQ, soit le chemin de Q à P refait depuis
S). `vepChemin(q)` rend les trois lettres (de, a, depuis), et la correction le
dit en carreaux par `vecMots`, en nommant le cas : « Le point A est le DÉPART
de son vecteur : on refait donc le chemin à l'envers. De D à B, on fait
3 carreaux vers la gauche puis 1 carreau vers le bas ; on refait exactement ce
chemin en partant de C ».

**Nommer le parallélogramme : huit noms justes, seize faux.** PQ = RS dit que
P, Q, S, R sont les sommets lus en tournant ; les quatre départs et les deux
sens font huit écritures, toutes justes — le 8.2 avait déjà appris qu'un piège
équivalent à la bonne réponse compte un élève juste pour faux. Les seize
autres permutations font traverser la figure par une diagonale : PQRS, les
lettres de l'égalité dans l'ordre, est LE piège, et le message le nomme avec
ce que l'élève a tapé : « C'est CABD — ou le même tour en partant d'une autre
lettre, ou dans l'autre sens — mais pas CADB : ses lettres ne font pas le
tour de la figure, elles la traversent. » Le nom se tape dans une case de
quatre lettres (`.veg-in.vep-in`, la case de vecteur du 8.3 élargie), jugée
sans la casse ni les espaces (`vepLit`) ; sa correction passe par
`corrChoix` — vide, elle reçoit le tour en vert et ne rougit jamais ; fausse,
le badge `.mf-cor` écrit le tour à côté.

**Le reste est le 8.5** : le nœud posé est une `pts-case` (consigne a), le
quadrillage ne peint rien au fil des clics (`soutienEnDirect.sans`, kind
« vep »), le soutien colore à la vérification sans rien révéler — le nom
juste bleu et figé, le nœud faux rouge à déplacer —, la correction finale
pose le point en vert s'il manquait et trace le parallélogramme avec ses DEUX
VECTEURS fléchés (ceux de l'égalité, dans le même sens), le contexte du
modèle (`ctxVep`) décrit le quadrillage par ses coordonnées et porte le point
et les huit noms sous clause de secret. Pas de bouton des tables
(`TABLES_SANS`, `tablesAide.sans`). L'énoncé écrit l'égalité avec les flèches
en CSS de `.vgt-vec` (8.2), jamais en texte nu.

**Le juge** (`tests/verifier.js`, « égalité de vecteurs ») : la place (8.6, le
8.5 immobile), 200 séances tirées (six questions distinctes, barème 12, la
question ne range que `eq`, `m`, `selM` et les trois points, l'égalité est une
permutation de ABCD, chaque lettre manque à son tour, douze égalités au moins,
le point attendu RECALCULÉ par une seconde écriture des quatre cas, dans le
quadrillage, à deux carreaux, jamais plat, huit noms distincts dont le tour et
son envers et jamais PQRS, la question survit au JSON), puis trois questions
choisies — AB = DC sans C (c'est ABCD), BD = AC sans A (A termine son
vecteur), CA = DB sans D (D commence le sien) : l'énoncé (« Place le point C »,
« AB = DC » coiffé de flèches, A, B, D seuls dessinés, 97 cibles), la copie
vide (deux `sol`, ABCD écrit, le point (6 ; 7) en vert, le parallélogramme et
ses deux flèches, « Il te manquait 2 cases », 0/2), la copie juste par
`vepPose` (poser, retirer, déplacer) et « acdb » (2/2, `okc`, rien ne se
révèle), le piège CADB avec un nœud faux (0/2, `badc`, D (8 ; 5) en vert, badge
« CABD », « traversent », « 3 carreaux vers la gauche puis 2 carreaux vers le
haut » n'était PAS le chemin : D est le départ de DB, on refait A → C à l'envers, « 3 carreaux vers la droite puis 2 carreaux vers le bas » « en partant de B » — le juge l'avait d'abord écrit dans le mauvais sens, et c'est la page qui avait raison), le soutien (rien ne se verrouille ni ne se
révèle, le nom juste figé, le nœud faux rougi puis déplacé, la copie corrigée
vaut 2, un nom vide reste neutre, le nœud juste se fige), et le contexte du
modèle (secret, le point, le nom, « posé en (1 ; 8) »). **Le banc navigateur**
(« 6 quadragies ter ») clique pour de vrai : le nœud visé, le reclic qui
retire, un clic à un cinquième de maille qui s'accroche, le nom tapé à
l'envers en minuscules (2/2), puis un nœud faux et le piège (le point attendu
en vert d'étendue non nulle, le badge, les deux flèches, aucun point gagné) —
et mesure que les vecteurs de l'énoncé portent leur flèche et que la case du
nom n'est pas plus petite que sa phrase.
