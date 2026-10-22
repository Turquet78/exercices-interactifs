# Seconde — le thème 8, Vecteurs

**Le thème vient EN DERNIER** (thème 8, v473) : un thème ajouté à la fin ne
renumérote rien — les sept premiers gardent leurs numéros, et aucun renvoi
{identifiant} ne bouge. Le contrôle de l'exercice relit les numéros de 2.1,
5.1, 6.1.1, 7.1 et 7.8 pour le prouver.


**Puis le thème s'est découpé en deux sous-thèmes** (v507 — fusionné en v506 juste après le 8.14, qui portait le même numéro : la v507 rend la version de l'en-tête de nouveau parlante —, demande de
Turquet, octobre 2026 : « regroupe le 8.1 à 8.6 dans un sous-thème vecteurs
égaux, puis les autres dans un sous-thème somme de vecteurs »). « Vecteurs
égaux » porte la translation, les vecteurs égaux et le parallélogramme
(8.1.1 à 8.1.6) ; « Somme de vecteurs » porte la somme, Chasles et les points
construits (8.2.1 à 8.2.9). L'ordre ne bouge pas ; les notes portent
l'IDENTIFIANT et ne bougent pas. Les paragraphes ci-dessous citent les numéros
à deux niveaux de leur époque : « le 8.5 » = 8.1.5, « le 8.7 » = 8.2.1,
« le 8.15 » = 8.2.9. Les contrôles du banc qui lisaient `TEST_NUM` ont suivi
(`tests/verifier.js`, `numero` dans `tests/profils.js`).
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

**Puis la colonne DONNÉE a ressorti, dès l'arrivée de la question**
(Turquet, octobre 2026, v486 : « faire ressortir la colonne qui donne
l'information au début de chaque question »). Les trois colonnes avaient le
même cadre pâle : l'élève devait chercher laquelle était remplie avant de
savoir d'où partir. La cellule donnée (`vgt-donnee`, une classe qui existait
sans aucun style) prend une encre DORÉE (`--gold`) — ni le bleu du juste, ni
le vert de la correction, ni le rouge, ni le violet de la carte choisie —,
une étiquette « Donnée » à côté de son titre, et un battement d'1,4 s à
l'arrivée de la question (figé par la règle `prefers-reduced-motion`). La
consigne NOMME la colonne (« la colonne « Figure » est donnée ») puisqu'elle
change d'une ligne à l'autre. Et sur téléphone, où le tableau s'empile, la
colonne donnée passe EN TÊTE (`order:-1`) : elle tombait en deuxième ou
troisième place, sous le bas de l'écran, et l'élève voyait des propositions
avant de voir de quoi elles parlaient. Vu dans Chromium (bureau et
390 px), égalité donnée et figure donnée.

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

**Puis le point s'est posé SANS NOM, et l'élève le nomme** (v484, demande de
Turquet, octobre 2026 : « en seconde dans le 8.4, laisser l'élève placer un
point et demander lui ensuite de le nommer »). Les trois stylos « ● Placer
A′ » disaient d'avance quel point l'élève déplaçait : la page choisissait le
nom, l'élève n'avait qu'à suivre. Le clic pose désormais un point neutre,
entouré de pointillés et marqué « ? » (`q.pend`), et la page demande sous le
quadrillage « Comment s'appelle ce point ? » avec trois boutons A′, B′, C′
(`trlNommer`) — inactifs tant qu'aucun point n'attend son nom. Un seul point
sans nom à la fois : cliquer ailleurs le déplace, recliquer dessus le
retire ; recliquer un point NOMMÉ lui rend son nom à choisir (c'est le geste
pour renommer ou retirer) ; donner un nom déjà porté DÉPLACE ce nom sur le
nouveau point — deux A′ n'existent jamais. Vérifier avec un point sans nom
ne peint rien et ne verrouille rien : le message demande le nom — on ne
devine pas quel point l'élève a voulu déplacer, ce serait lui ôter
précisément ce qu'on lui demande. `q.pend` est du JSON, part avec la pause
et revient avec la reprise ; le contexte du modèle dit qu'un point attend
son nom. Le juge, lui, n'a pas bougé : `q.rep[i]` reste l'image nommée
`i`, et une image fausse parce que mal NOMMÉE (le bon nœud de B′ appelé A′)
coûte son point comme une image mal placée. Le banc principal éprouve le
refus d'un point sans nom, le rangement au nom choisi et le nom déplacé ;
le banc navigateur (« 6 quadragies bis ») clique le nœud, constate le « ? »
et la question, retire au reclic, clique le VRAI bouton de nom, puis rend
son nom à choisir à un point nommé.

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

### Puis les trois questions se sont mises dans l'ordre de la fiche (v482)

Demande de Turquet, octobre 2026 : « en seconde dans le 8.5, mettre en
premier la question b, qui doit être vérifiée et corrigée si nécessaire,
puis en deuxième question la phrase avec le chemin, puis en troisième
question une égalité de vecteurs à compléter correspondant à la question
sur les chemins ». La construction d'abord, l'explication ensuite, puis
l'écriture savante : **a)** cliquer le nœud où se trouve D, **b)** « le
chemin qui va de … à … est le même que celui qui va de C à D », **c)**
« ⟶?? = ⟶CD » — deux listes sous une même flèche (l'écriture `.vgt-vec` du
8.2), le vecteur CD écrit en clair comme dans la phrase. Les paragraphes
ci-dessus qui disent « la consigne b) » pour le nœud racontent l'ordre de
leur époque : la règle qu'ils portent n'a pas bougé, seule la lettre a
changé.

**Chaque question se vérifie seule, et la suivante n'apparaît qu'après.**
« Vérifiée et corrigée si nécessaire » : le nœud est jugé AVANT que la
phrase ne s'affiche. En soutien, un nœud faux rougit et se déplace, un nœud
manquant reste neutre, et rien n'avance tant que D n'est pas juste — comme
avant, mais question par question. Hors soutien, le verdict tombe une fois :
le nœud juste en bleu, le faux en rouge, et D **en vert aussitôt** s'il
manquait ou était ailleurs — la figure est juste sous les yeux de l'élève
pour les deux questions qui suivent, et c'est le sens de « corrigée si
nécessaire ». Le quadrillage se fige dès que la question a) est passée
(`vecPose` refuse quand `q.etape` est au-delà de 0). La phrase et le vecteur
suivent la même règle : juste en bleu et figé ; hors soutien, la lettre
fausse reçoit la bonne en badge vert, la liste vide l'écrit en vert
(`corrChoix`, la convention commune des listes). Le pourquoi, la figure
(parallélogramme en pointillés, deux chemins fléchés) et la note ne viennent
qu'après la question c) : cinq réponses par question, barème 30 sur six
questions, `vecCases(q)` en rend les cinq identifiants dans l'ordre des
questions, et `VEC_ETAPES` dit lesquels chaque question juge.

**Le juge lit la question, jamais les listes — et c'est le piège de cette
marche.** Hors soutien, la correction d'une liste vide y ÉCRIT la bonne
lettre (classe `sol`) ; un juge qui relirait la liste à la fin de la
question c) compterait juste une lettre que l'élève n'a jamais choisie.
Tout ce que l'élève a fait vit donc dans la question : la question atteinte
(`q.etape`, 0 à 2), le nœud posé (`q.selD`), les quatre lettres (`q.s1`,
`q.s2`, `q.v1`, `q.v2`) — chaque changement de liste y retourne, et
`vecJuge()` ne lit que cela. La pause et la reprise les emportent :
`renderVec()` rejoue l'écran tel qu'il était, les blocs déjà franchis
repeints d'après leur verdict, les listes remplies depuis la question. Les
réponses enregistrées disent les trois gestes (« D (6 ; 7) — chemin de A à
B — vecteur AB = vecteur CD ») ; le contexte du modèle dit la question en
cours, ce que l'élève a répondu à chacune, et tient les lettres et la
position de D sous secret. Le rappel a gagné un cinquième point — un chemin
s'écrit avec un vecteur, les deux lettres dans l'ordre du chemin — et la
fenêtre d'aide une question de plus.

**Le contrôle** vit dans le banc principal (`parallelogrammePoint`, déclaré
dans `tests/profils.js`) : le tirage lisible et sans rien de répondu ; au
départ la question a) seule et rien de peint ; une copie d'entraînement qui
laisse le nœud vide (sol, D en vert, quadrillage figé, la b) apparaît, le
nœud ne se pose plus), écrit la phrase juste (bleue, figée, la c) apparaît,
la figure pas encore tracée), puis un vecteur faux et à moitié vide : 2 sur
5, la lettre manquante écrite en vert mais **pas comptée**, le pourquoi qui
ne parle que des vraies fautes ; une copie juste par `vecPose` ; le soutien,
où rien ne se révèle et rien n'avance tant que ce n'est pas juste ; et la
reprise à la question b) puis c), qui repeint ce qui a été jugé et dont le
juge refuse toujours la lettre écrite par la correction. Le clic réel sur un
nœud reste l'affaire du banc navigateur. Éprouvé par sabotage, le contrôle
rejoué dans un vrai Chromium sur des copies de la page : un juge qui relit
les listes (« la lettre que la correction a écrite compte juste »), les trois
questions affichées d'un coup, D jamais révélé — chacun rougit, la page
intacte reste verte. Un quatrième sabotage, le garde de `q.etape` retiré de
`vecPose`, est resté vert : les nœuds sont aussi `off` dès que la question
a) se ferme, et le second garde tient seul — ce n'est pas un trou du
contrôle, c'est une ceinture avec des bretelles.

### Puis les lettres ont changé, et la figure s'est centrée (v485)

Demande de Turquet, octobre 2026 : « en seconde dans le 8.5, nommer les 4
points avec les lettres A, B, C, D ou M, N, O, P ou E, F, G, H ou I, J, K, L
ou Q, R, S, T. De plus il faudrait que les 4 points soient plus au centre du
dessin afin d'avoir tous les parallélogrammes possibles avec ces 3 points. »

**Les lettres sont tirées, les rôles restent.** La question range l'INDICE
du jeu (`q.lt` dans `VEC_LETTRES`), jamais les lettres. Tout le moteur
raisonne encore sur les rôles A, B, C, D — `q.A`, la forme `'ABDC'`,
`vecChemin()`, `vecQuatrieme()` — et `vecL(q, rôle)` traduit au dernier
moment : l'énoncé (« MNPO est un parallélogramme… construis le point P »),
les étiquettes du dessin, les options des listes, « de O à P », le vecteur
OP, le pourquoi, la réponse enregistrée et le contexte du modèle. Les
lettres que l'élève choisit sont les lettres AFFICHÉES, et le juge les
compare à la traduction du chemin. Une question rangée avant v485 n'a pas de
`q.lt` : elle se lit en ABCD, la reprise d'une pause ne casse rien. Le
rappel de cours garde A, B, C, D : c'est la méthode, pas l'exercice.

**Centrée veut dire : les trois parallélogrammes possibles tiennent.** Trois
points font trois parallélogrammes, un par quatrième point — B+C−A, A+C−B,
A+B−C. Le tirage (`vecCentre`) exige que les TROIS tombent dans le
quadrillage, à un carreau au moins du bord ; les trois points donnés, milieux
de ce grand triangle, sont alors au cœur du dessin. **Le piège était le
taux d'acceptation** : tirés sur tout le quadrillage, à peine un triplet sur
six cents passait (0,17 %), et le repli constant sortait près d'une fois sur
deux — vu à la première capture d'écran, la même figure revenant deux fois
par séance. Les points se tirent maintenant à deux carreaux au moins du bord
(un sur cinquante passe), deux mille essais au plus ; le repli,
`(3;3) (5;4) (4;6)`, est lui-même centré.

**Le contrôle** (`parallelogrammePoint`) range `lt` parmi les clés permises,
exige sur cent séances que les cinq jeux sortent et que les trois quatrièmes
points de chaque question tiennent dans [1 ; 8], puis joue une question en
MNOP (forme MNPO) : énoncé, étiquettes M, N, O sans A ni D, liste « MNOP »,
phrase « de O à P », vecteur OP, la phrase « de M à N » jugée juste, une
copie à 3 sur 5, le pourquoi, la réponse enregistrée et le contexte du
modèle en M, N, O, P. Éprouvé par trois sabotages, le contrôle rejoué seul
dans un vrai Chromium : le centrage retiré (« un des trois parallélogrammes
possibles a son quatrième point en (−3 ; 7) »), les lettres figées sur ABCD
(« les jeux sortis sont ABCD »), un juge qui compare au rôle au lieu de la
lettre affichée (« la phrase de M à N n'est pas jugée juste ») — chacun
rougit, la page intacte reste verte.

### Puis le nom a quitté l'ordre alphabétique (v490)

Demande de Turquet, octobre 2026 : « en seconde dans le 8.5, les lettres ne
sont pas forcément dans l'ordre alphabétique pour le nom du
parallélogramme ». Jusque-là le jeu de lettres changeait, mais ses lettres
suivaient les rôles dans l'ordre : MNOP donnait toujours MNPO ou MNOP, et le
point à construire était toujours la dernière lettre du jeu — l'élève
pouvait deviner sans lire.

**Les lettres se distribuent sur les rôles dans un ordre tiré.** La question
range une permutation des INDICES (`q.pm`, quatre entiers : `q.pm[k]` est la
place dans le jeu de la lettre du k-ième rôle), jamais les lettres ; `vecL`
la lit, et rien d'autre du moteur n'a bougé — les rôles A, B, C, D, la
forme, `vecChemin()` et `vecQuatrieme()` raisonnent comme avant. « OMNP est
un parallélogramme… construis le point N ». Les listes, elles, proposent le
jeu dans l'ordre alphabétique (`vecJeu(q)`), pas dans l'ordre des rôles, qui
trahirait la réponse. Une question rangée avant v490 n'a pas de `q.pm` : ses
lettres suivent les rôles, la reprise d'une pause ne casse rien.

**Le contrôle** (`parallelogrammePoint`) range `pm` parmi les clés permises,
exige que ce soit une permutation de 0 à 3, que sur cent séances plus de la
moitié des noms de forme ABCD sortent hors de l'ordre alphabétique (en ABDC,
MNPO n'y était déjà pas : ce bord-là ne voit rien) et plus de la moitié des
points à construire ne soient pas la dernière lettre du jeu, puis joue une
question MNOP permutée [2,0,3,1] : énoncé « OMNP… le point N », étiquettes M,
O, P, liste en M, N, O, P, phrase « de P à N », la phrase « de O à M » et le
vecteur OM jugés justes, 5 sur 5. Éprouvé par sabotage (la permutation
retirée du tirage) : le contrôle rougit (« le point à construire n'est que 0
fois une autre lettre que la dernière du jeu »), la page intacte reste verte.

### Puis les côtés ont quitté les lignes du quadrillage (v491)

Demande de Turquet, octobre 2026 : « en seconde dans le 8.5, je veux des
parallélogrammes qui n'ont pas forcément un côté horizontal ou vertical ».
Mesuré avant de toucher à rien, sur vingt mille tirages : **53 %** des
parallélogrammes avaient au moins un côté posé sur une ligne du quadrillage
— le cas facile, où le chemin ne compte qu'un déplacement, et où l'élève
finit par croire qu'un parallélogramme se pose toujours ainsi.

**Le tirage refuse désormais tout côté horizontal ou vertical**
(`vecOblique(q)`) : les quatre côtés, pris sommet après sommet dans l'ordre
du NOM — A, B, D, C en ABDC ; A, B, C, D en ABCD —, jamais les diagonales.
Les chemins ont donc toujours deux déplacements, l'un horizontal, l'autre
vertical. Le taux d'acceptation baisse sans gêner : le repli, qui avait
déjà ses quatre côtés obliques dans les deux formes, sort environ une fois
sur sept cents questions. Rien d'autre du moteur n'a bougé, ni le 8.6 qui
partage le quadrillage mais pas ce tirage.

**Le contrôle** (`parallelogrammePoint`) relit, sur les cent séances du
tirage, les quatre côtés de chaque question dans l'ordre du nom, et nomme
celui qui serait horizontal ou vertical. Éprouvé par sabotage (le refus
retiré du tirage) : le contrôle rougit, la page intacte reste verte.

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

## {somme-vecteurs} — la somme de deux vecteurs : un début va sur une fin (8.7, v487)

**La demande** (Turquet, octobre 2026, « en seconde créer un exercice comme
le pdf ») : la fiche « Fiche 1 : somme de vecteurs — un début va sur une
fin ». Dix quadrillages ; sur chacun, deux flèches séparées, u⃗ en trait
plein et v⃗ en pointillés, chacune marquée « début » et « fin » ; la consigne
« construire le vecteur égal à la somme u⃗ + v⃗ ». Ajouté en dernier, il ne
renumérote rien.

**La construction de la fiche, en un geste.** On recopie v⃗ en posant son
DÉBUT sur la FIN de u⃗ ; u⃗ + v⃗ va du début de u⃗ à la fin de v⃗ recopié.
L'élève clique le nœud où arrive la fin de v⃗ recopié, et la page trace
aussitôt SA construction en bleu : v⃗ recopié en pointillés depuis la fin de
u⃗, et la flèche u⃗ + v⃗ depuis le début de u⃗. Ce tracé est le dessin de ce
qu'il a posé, pas un verdict — rien ne dit juste ou faux avant « Vérifier »
(`soutienEnDirect.sans`, kind « svc », comme le 8.5 et le 8.6). Cliquer un
autre nœud déplace la construction, le même nœud la retire. Une réponse par
question, huit questions (`SVC_NB`, `dmNbQuestions`), barème 8 ; la consigne
est une `pts-case` (`svcCases`).

**On range les deux flèches, jamais la réponse** : `uo`/`uc` (le début de u⃗
et son chemin), `vo`/`vc`, `sel` le nœud posé. **Pas de champ `v`** : `v` est
dans `CLE_HORS` (une tournure), et deux figures aux v⃗ différents auraient
passé pour la même question dans `distinctes()` — le piège du 8.3 et du 8.4,
évité d'avance. `svcPoint(q)` recalcule le nœud attendu là où l'on corrige.

**Le quadrillage est celui de la fiche, plus large que haut** : 12 carreaux
sur 8, la recette des cibles du 8.5 (zone de touche de 14 px, cible au
clavier), mais TOUS les nœuds cliquables — le nœud attendu peut tomber sur
une extrémité dessinée. Le tirage (`svcGen`) garde tout dans le quadrillage,
chaque chemin (u⃗, v⃗ et la somme) à deux carreaux au moins, les quatre
extrémités deux à deux à deux carreaux (les mots « début » et « fin » ne se
chevauchent pas), les deux flèches à plus de 1,2 carreau l'une de l'autre
(jamais croisées, jamais collées) — donc jamais v⃗ déjà posé au bout de u⃗.
La deuxième capture a ajouté deux refus : une extrémité dessinée sur le BORD
posait son mot « début » à cheval sur le cadre (les quatre extrémités restent
désormais à un carreau du bord), et la flèche u⃗ + v⃗ attendue traversait
le « début » de v⃗ (la construction attendue passe maintenant à un carreau au
moins de la flèche v⃗, et le nœud attendu à deux carreaux de ses bouts). Le
tirage accepte une figure en 200 essais au plus, sans jamais atteindre le
repli (3 000 figures simulées sous Node, toutes différentes).
Les mots se posent dans le prolongement de la flèche, hors d'elle, à 15 px ;
la marge de 46 unités les tient au bord, et le banc navigateur mesure qu'aucun
ne sort du dessin.

**Les deux pièges sont nommés** (`svcPourquoi`) : v⃗ posé sur le DÉBUT de u⃗
(« un début va sur une FIN ») et v⃗ recopié à l'envers ; tout message faux dit
ensuite le chemin de v⃗ en carreaux et celui de u⃗ + v⃗. Les messages écrivent
« u » et « v » sans flèche : la flèche combinante (U+20D7) se dessinait mal en
texte brut, la première capture l'a montré. Correction finale : nœud juste
bleu (`okc`), faux rouge avec sa construction rouge, et la construction
attendue en VERT (v⃗ recopié et u⃗ + v⃗) quand l'élève ne l'avait pas ; une
consigne vide devient `sol`, jamais rouge. En soutien : le faux rougit et se
déplace, le juste se fige, rien ne se révèle.

**Le juge** (`tests/verifier.js`, « somme de vecteurs ») : la place (8.7, le
8.6 immobile), 200 séances (huit questions distinctes, barème 8, la question
ne range que `uo`, `uc`, `vo`, `vc`, `sel`, le nœud attendu relu par une
seconde écriture, tout dans le quadrillage, extrémités à deux carreaux,
chemins à deux carreaux, JSON), puis la première figure de la fiche : deux
« début », deux « fin », u et v nommés, 117 cibles ; la copie vide (sol, nœud
(5 ; 3) en vert, deux traits verts, « Il te manquait 1 case ») ; la copie
juste par `svcPose` (poser, retirer, déplacer, la construction tracée) ; les
deux pièges nommés ; le soutien et le contexte du modèle (secret, le nœud,
ce que l'élève a posé). **Le banc navigateur** (« 6 quadragies quater »)
clique pour de vrai : le nœud visé, le reclic qui retire, un clic à un
cinquième de maille, la construction d'étendue non nulle, puis un nœud faux
(rouge, construction attendue en vert, aucun point).

**Puis les flèches ont GLISSÉ (v489).** Turquet, octobre 2026 : « je veux
que l'on puisse déplacer les vecteurs u et v sur le quadrillage. l'élève
peut construire la somme où il veut si cela rentre dans le quadrillage et
dans l'ordre qu'il veut pour les vecteurs ». Le clic unique (la fin de v⃗
recopié, la page traçant le reste) est remplacé par deux gestes : l'élève
fait GLISSER u⃗ et v⃗ — chaque flèche s'accroche aux nœuds et reste entière
dans le quadrillage, retenue au bord (`svcDeplacer`) — jusqu'à les poser bout
à bout, u⃗ puis v⃗ ou v⃗ puis u⃗ (`svcChaine`) ; puis il TRACE u⃗ + v⃗ en
cliquant son début puis sa fin (`svcPose` : un troisième clic recommence,
recliquer le début seul le retire). Deux réponses, jugées chacune SEULE :
`svc-ch` (le début de l'une sur la fin de l'autre) et `svc-sm` (la flèche
tracée est un représentant de u⃗ + v⃗, où qu'elle soit) — une flèche u⃗ + v⃗
juste ne rougit pas parce que les deux autres sont mal posées. Le barème
passe de 8 à 16 (`svcCases`, `bareme` dans `tests/profils.js`).
On range `up`/`vp` (les débuts déplacés, null tant qu'une flèche n'a pas
bougé), `sd`/`sf` (la flèche tracée) ; `sel` disparaît. Le chaînage est
« vide » tant qu'aucune flèche n'a quitté sa place.
**La prise.** Chaque flèche porte un trait large et transparent posé
par-dessus tout le dessin (`.svc-prise`, `touch-action:none`, et `touchstart`
retenu pour Safari) : on la saisit pour glisser ; le reste du dessin fait
défiler la page sous le doigt. Mais le début de u⃗ + v⃗ tombe presque
toujours SUR une flèche, sous sa prise : un appui qui ne bouge pas d'un
tiers de carreau est donc un CLIC sur le nœud le plus proche. Au clavier, la
prise a le focus et les flèches du clavier la déplacent. Les écouteurs sont
délégués à l'hôte, mouvement et relâchement à la fenêtre (le motif
d'{antecedents-droite}).
**Les pièges nommés** (`svcPourquoi`) : deux débuts ensemble, deux fins
ensemble, deux flèches qui ne se touchent pas, u⃗ + v⃗ tracé à l'envers.
**La correction** montre en vert la construction attendue depuis u⃗ là où
l'élève l'a laissé, sinon depuis v⃗ (l'autre ordre), sinon depuis la place
de départ de u⃗ — celle que le tirage garantit (`svcConstruction`) ; quand
le chaînage est juste, seulement u⃗ + v⃗. En soutien, la réponse juste se
fige (les flèches ne glissent plus, ou u⃗ + v⃗ ne se retrace plus).
Le juge (`tests/verifier.js`) éprouve les deux ordres, la flèche retenue au
bord, la reprise après JSON, chaque piège et le jugement séparé ; le banc
navigateur (« 6 quadragies quater ») glisse v⃗ à la souris jusqu'au bout de
u⃗, clique le début de u⃗ + v⃗ À TRAVERS la prise de u⃗, tire u⃗ hors du
quadrillage, et relit `touch-action` sur la prise. Le doigt sur tablette, lui,
ne se joue dans aucun banc.

**Puis deux questions, a) et b), et une flèche par lettre (v491).** Turquet,
capture à l'appui : « le nom de la somme doit être avec deux flèches, une pour
u et l'autre pour v. […] je veux que la question a soit place les vecteurs u
et v correctement. puis question b) trace le vecteur somme ».
**Le nom.** « u+v » portait UNE longue flèche sur les trois signes : il se
lisait comme le nom d'un vecteur « u+v ». Chaque signe est désormais un
`tspan` à x absolu (un bloc centré pour lui seul), le « + » droit en
`KaTeX_Main` entre deux lettres italiques, et `svc-nfl` trace une petite
flèche par lettre, décalée d'un pixel vers la droite parce que la lettre
penche. Le texte du nœud reste « u+v ». La même capture montrait les noms u
et v l'un sur l'autre (deux flèches bout à bout en angle aigu posent leurs
noms du même côté, dans l'angle) : `svcNomPos` calcule la place d'un nom, et
v passe de l'autre côté de son trait quand son nom tomberait à moins de 26
unités de celui de u.
**Les deux questions.** L'étape vit dans la question (`q.et`, 'a' ou 'b'),
posée au premier dessin et non au tirage — la clé de `distinctes()` ne la
voit pas, la pause la retrouve. En a), les flèches glissent et un clic sur le
quadrillage ne trace rien (`svcPose` l'ignore) ; « Passer à la question b) »
fige les flèches (plus de prises, `svcDeplacer` refuse) et ouvre le tracé ;
« Revenir à la question a) » les rend tant que rien n'est jugé. La question
en cours est encadrée en bleu, celle qui attend pâlit. En SOUTIEN, le bouton
de a) est « Vérifier a) » : une construction fausse rougit, nommée (deux
débuts, deux fins, pas bout à bout), et reste à reprendre ; une juste se fige
et passe à b) sans retour — et une reprise en b) la retrouve figée. Ailleurs,
rien ne se juge avant « Vérifier », qui note les deux cases comme avant : le
barème ne bouge pas (16). `checkSvc` appelé en a) en soutien vérifie a) ;
hors soutien il reste la vérification entière (la copie vide en dépend).
Le juge ajoute : a) en cours au départ, un clic en a) ne trace rien, b) fige
les flèches, le retour les rend, la reprise garde b), le soutien passe à b)
sans retour, et le nom de la somme porte trois signes et deux flèches. Le banc
navigateur passe à b) par le bouton, puis mesure que chaque petite flèche est
AU-DESSUS de sa lettre et que les trois signes ne se chevauchent pas.

**Puis les questions sont montées AU-DESSUS du dessin (v502).** Turquet,
octobre 2026 : « afficher la question a au-dessus du dessin ; quand l'élève
passe à la question b, afficher cette question au-dessus du dessin aussi ».
Les deux consignes (`svc-ch`, `svc-sm`) se lisaient SOUS le quadrillage : sur
un écran ordinaire, l'élève qui fait glisser ses flèches ne voyait plus ce
qu'on lui demandait. `#svcBody` passe simplement avant `#svcGraph` dans
l'écran : la question en cours (encadrée en bleu) se lit au-dessus du
dessin, en a) comme en b), et la correction finale garde ses deux cases au
même endroit. Le banc navigateur (« 6 quadragies quater ») mesure que la
consigne a) finit au-dessus du haut du dessin, puis, une fois passé à b), que
la consigne b) aussi — éprouvé par sabotage (l'ancien ordre rétabli rougit).


**Le nom « u⃗ + v⃗ » s'écrit hors du triangle (v504)** — demande de Turquet,
octobre 2026, capture à l'appui : posé toujours du même côté de son trait
(`cote` 1), le nom de la flèche tracée tombait dans le triangle, sur le nom
de u⃗. `svcCoteDehors` essaie les deux côtés et garde celui où le nom est le
plus loin des deux autres flèches (leur milieu et leur nom) : bout à bout,
elles sont dedans, l'autre côté est l'extérieur. Même règle pour la flèche
verte de la correction, avec les deux côtés de la construction. Vu dans un
vrai Chromium sur trois triangles (angle aigu, obtus, plat en bas) et sur la
correction ; aucun banc ne mesure ce chevauchement.
**Puis les questions a) et b) sont devenues les ÉTAPES 1 et 2, et l'étape 1 réalisée ouvre l'étape 2 d'elle-même (v509).**
La demande (Turquet, octobre 2026) : « en seconde dans le 8.2.1, remplacer
les questions par des étapes 1 et 2 ; quand l'étape 1 est réalisée, mettre
cette étape en vert avec un fond vert clair pour le cadre, puis passer
automatiquement à l'étape 2. Le point de départ alors doit s'afficher sur la
flèche de la souris comme dans le 8.2.9, et quand il choisit on passe au
suivant ; quand le point d'arrivée est choisi, on arrête d'afficher un point
sur la flèche de la souris. »
**Réalisée = bout à bout** (`svcChaine`, un début sur une fin) : c'est le
geste même de l'étape, il n'y a pas d'autre façon de l'avoir « faite ». Elle
se lit au LÂCHER d'une flèche et à chaque pas au clavier (`svcAuto`), jamais
pendant le glisser : une flèche qui traverse le bon nœud en passant ne se fige
pas sous le doigt. Les flèches se figent (`svcFigeCh`, dans TOUS les modes
désormais, et la reprise d'une étape 2 bout à bout les retrouve figées),
l'étape 1 prend `svc-fait` (cadre vert, fond `--green-soft`), l'étape 2
s'encadre en bleu. Le prix est nommé : hors soutien, voir l'étape 1 verdir
dit que le chaînage est juste avant « Vérifier » — c'est ce qui a été
demandé. Pour qu'une construction fausse ne BLOQUE pas l'élève hors soutien,
« Passer à l'étape 2 » reste offert (bouton discret) : l'étape 1 n'y verdit
pas, et « Revenir à l'étape 1 » rend les flèches. En soutien, « Vérifier
l'étape 1 » nomme le piège (deux débuts, deux fins, pas bout à bout). À la
vérification, `svc-fait` cède la place à `ok`/`bad`/`sol` : le barème et la
note ne bougent pas.
**Le point suit la souris**, la recette du 8.2.9 (`#svcCurseur`, posé en
dernier dans le SVG, `pointer-events:none`) : à l'étape 2, tant que la fin de
u⃗ + v⃗ n'est pas posée — le début d'abord, puis la fin — et plus rien
ensuite ; jamais au doigt, pendant un glisser, après la correction ou u⃗ + v⃗
juste figé en soutien. Un clic entre les nœuds pose au nœud le plus proche ;
le drapeau `apresPrise` avale le clic qui suit un glisser — sans lui, le
lâcher qui ouvre l'étape 2 aurait posé aussitôt le début de u⃗ + v⃗.
Le juge (`tests/verifier.js`) tient les intitulés « Étape 1 / Étape 2 » et
l'absence de « a) » / « b) », le non-passage de deux flèches séparées, le
passage par `svcAuto` (vert, figé, sans retour, rejoué une seule fois) ; le
banc navigateur (« 6 quadragies quater ») glisse v⃗ au bout de u⃗ et lit
l'étape 2 ouverte SANS bouton, le cadre et le fond verts calculés, le point à
moins de 3 px de la souris sur la flèche u⃗ puis pour la fin, plus aucun point
une fois la fin posée, une étape 1 fausse qui ne verdit pas, et le clic entre
les nœuds.

**Puis u⃗ + v⃗ tracé a gardé le point blanc de sa fin, éteint le survol des nœuds, et l'étape 2 finie a verdi comme l'étape 1 (v511 — fusionné en v510 juste après le vecteur nul du 8.2.7, qui portait le même numéro : la v511 rend la version de l'en-tête de nouveau parlante).**
La demande (Turquet, octobre 2026) : « dans le 8.2.1, laisser le point blanc
quand on choisit le point à la fin du vecteur somme ; il ne faut plus que la
flèche affiche un point ensuite quand on passe sur une intersection du
quadrillage ; quand on a fini l'étape 2, le texte passe au vert comme pour
l'étape 1 ». Le point blanc du clic sur la fin était celui du SURVOL
(`.vec-t:hover .dot`) : il s'éteignait dès que la souris partait, et chaque
nœud survolé ensuite en rallumait un. `svcTracer` pose désormais, dès que
u⃗ + v⃗ a un début ET une fin, la classe `svc-fin` sur le nœud de la fin
(point blanc, cerne bleu, à demeure) et `svc-complet` sur le SVG, qui éteint
le point de survol de tous les autres nœuds (le début garde son `sel`). Le
même instant met `svc-fait` sur l'étape 2 — cadre et texte verts sur fond
vert clair, la règle de l'étape 1. « Fini » ne juge rien : une flèche fausse
mais tracée verdit son étape comme une juste, et « Vérifier » tranche ; une
étape 2 déjà marquée `ok`/`bad` en soutien garde sa marque, et le
verrouillage retire `svc-fait` (`checkSvc`). Le banc navigateur lit, après
le second clic, le fond blanc calculé du point de la fin, le cadre et le
fond verts de l'étape 2, et un nœud libre survolé sans point.

**Puis, le début de u⃗ + v⃗ posé, une flèche va de lui jusqu'à la pointe de la souris (v520).**
La demande (Turquet, octobre 2026) : « dans l'étape 2, après avoir placé le
point de départ, on trace un vecteur de ce point de départ jusqu'à
l'extrémité de la flèche de la souris ». La recette du 8.1.7 (`tvxVif`) :
un calque `#svcVif`, posé juste sous le point de la souris et sans prise sur
les clics, reçoit à chaque mouvement un trait bleu (`svc-e`, pointe
`svcArrE`) du nœud du début jusqu'à la souris — la souris elle-même, pas le
nœud le plus proche : la flèche suit la main, le clic pose au nœud. Bleue
comme u⃗ + v⃗ tracé, parce que c'est le dessin de ce que l'élève fait, pas
un verdict. Elle vit dans la même fonction que le point qui suit la souris
(`curseur`, dans `svcBrancher`), donc sous les mêmes conditions : étape 2,
début posé et fin pas encore, jamais au doigt, pendant un glisser, après la
correction ou u⃗ + v⃗ figé. Elle s'efface à la fin posée, au début retiré,
et quand la souris quitte le dessin ; rien n'en est rangé dans la question.
Le banc navigateur (« 6 quadragies quater ») lit, le début posé, une flèche
qui part du nœud du début (à 2 px), finit à la souris (à 3 px), porte sa
pointe et ne prend pas les clics ; la suit quand la souris bouge ; et n'en
trouve plus une fois la fin posée.

## {relation-chasles} — compléter des sommes de vecteurs par la relation de Chasles (8.8, v488, retouché v490)

**La demande** (Turquet, octobre 2026) : « en seconde créer un exercice comme
le pdf », une fiche « Compléter à l'aide du dessin afin d'utiliser la
relation de Chasles » : un rectangle ABCD, ses diagonales qui se coupent en
E, et huit lignes — AE + EB = … ; DC + CE, CE + BC, AD + BA, DC + BD = … + …
= … ; AB + AD = AB + … = … ; BE + AE = BE + … = … ; BA − CA = BA + … = ….

**Quatre sortes de lignes, le plan de la fiche** (`CHS_PLAN`) : `r` — les
vecteurs s'enchaînent déjà, une case pour le résultat ; `c` — trois cases,
la somme réécrite dans un ordre qui s'enchaîne, puis le résultat (la
première déjà dans l'ordre, trois à retourner) ; `u` — le second vecteur se
remplace par un vecteur ÉGAL qui part là où s'arrête le premier ; `s` —
soustraire, c'est ajouter l'opposé. **La première figure de la séance EST la
fiche** (`CHS_FICHE`, rangée telle quelle) ; les suivantes tirent la forme —
rectangle, carré, parallélogramme, losange : tous ont des diagonales qui se
coupent en leur milieu, donc les mêmes égalités de vecteurs —, son
retournement, cinq lettres (ni O, ni I, ni W à Z) et huit lignes du plan,
sans somme nulle ni ligne impossible (`chsPosable`). `CHS_NB` = 2 figures,
`dmNbQuestions` allonge la séance, `distinctes()` les tient différentes ;
19 cases par figure.

**Un calcul juste n'est jamais compté faux.** Chaque case se juge par les
VECTEURS, pas par des lettres attendues : le résultat est juste dès qu'il est
égal à la somme (AE + EB = DC, puisque DC = AB) ; les deux cases du milieu
d'une ligne `c` sont justes dès qu'elles réécrivent la même somme avec des
vecteurs égaux qui s'enchaînent (DC + CE = EA + AB est juste aussi). La
première case du milieu est juste si une suite existe ; la seconde l'est si
elle enchaîne la première — ou, la première fausse, si elle termine une
écriture juste : une case juste ne rougit pas pour sa voisine.

**On range la forme, le retournement, les lettres et les lignes, jamais les
réponses** : `chsLigne()` recalcule les écritures justes depuis les points.
Le dessin (`chsSvg`) reprend le trait du 8.3 (`.veg-svg`) ; la lettre du
centre se pose sur la bissectrice du plus large des quatre secteurs, ce qui
marche aussi pour le losange, où « au-dessus » tombait sur une diagonale.
Les vecteurs, signes et cases sont ceux du 8.3 (`.veg-v`, `.veg-in`,
`.veg-grp`) ; la figure se pose à gauche des lignes, comme la fiche, dès que
l'écran le permet. Les messages nomment la faute : l'opposé oublié (« Soustraire
CA, c'est AJOUTER son opposé AC »), le vecteur recopié qui ne part pas du bon
point, l'ordre qui ne s'enchaîne pas, le résultat à l'envers.

**Le juge** (`tests/verifier.js`, « relation de Chasles ») : la place (8.8,
pas de bouton des tables), 300 séances tirées dont chaque correction est
relue par un juge INDÉPENDANT écrit depuis les coordonnées (somme,
enchaînement, égalité), la fiche en première page, le plan des lignes,
aucune somme nulle, chaque forme tirée ; puis le bouton sur la fiche : 19
cases, cinq lettres et six traits, la copie juste, d'autres écritures justes
en minuscules, le piège BA + CA (rouge, son résultat juste reste bleu,
« opposé »), BA pour AE + EB (« sens »), AE recopié dans BE + AE (« part de
E »), CE + BC écrit dans le même ordre (« ordre »), DC + AB (DC bleu, AB
rouge, badge CE), la case vide (correction BC, jamais rouge), la copie vide
(rien de rouge, une correction juste pour le juge), le soutien au fil de la
saisie, le barème, `qId`, le contexte du modèle.

**Puis deux retouches, d'après la page ouverte** (Turquet, octobre 2026, v490).
« Il faut que les noms des vecteurs soient alignés horizontalement » : le
premier vecteur de chaque ligne (`.veg-tete`) n'avait aucune règle — un span
en ligne, blockifié par le flex de `.veg-l`, où la `.veg-v` se posait sur la
ligne de base de son texte. Mesuré dans Chromium : ses lettres tombaient 5 px
sous celles des vecteurs voisins, sur les huit lignes. `.veg-tete` est
désormais `inline-flex`, centrée comme les `.veg-grp` : écart 0 px. La règle
vaut aussi pour le 8.3, qui pose la même tête. Et « pour la deuxième ligne,
on peut utiliser la relation de Chasles directement, ce n'est pas la peine de
demander deux termes » : DC + CE s'enchaîne déjà, la ligne devient `r` (le
résultat seul). Le plan est `r, r, ci, ci, ci, u, u, s` — la variante `cd`
(« à réécrire, déjà dans l'ordre ») disparaît du tirage : 17 cases par figure.
Une séance en pause rangée avant (un `t:'c'` déjà enchaîné) se rejoue telle
quelle, `chsLigne` sait toujours la lire. Le banc suit : fiche, plan, 17
cases ; le contrôle « une case juste ne rougit pas pour sa voisine » passe de
DC + CE à CE + BC (BC bleu, AB rouge, badge CE).

## {chasles-trois-vecteurs} — la relation de Chasles jusqu'à trois vecteurs (8.9, v491)

**La demande** (Turquet, octobre 2026) : « en seconde fait un exercice comme
le 8.8 mais avec le pdf joint », une fiche « EFGH est un parallélogramme de
centre O. Compléter » : OF + EO = … = … ; OG + EO = … = … ; HO + OG = … ;
HE + HG = … = … ; HE + OG + HO, EG + FE + GF, EG − FG − OF = … = …. Le PDF
porte aussi, en texte blanc invisible, des restes d'une version antérieure
(EF + GH, HE + HG + FH, HF) : ils ne s'impriment pas, ils ne sont pas repris.

**Le moteur des lignes à deux vecteurs EST celui du 8.8.** `chsLigne`,
`chsPosable`, `chsJugeLigne`, `chsPourquoi`, `chsSvg` servent tels quels ;
`chsJugeLigne` et `chsCaseHTML` ont seulement gagné un préfixe de case
facultatif (`'chs'` par défaut, `'ctv'` ici) — le 8.8 ne change pas d'un
octet à l'écran. L'identité est propre (kind `ctv`, écran `scr-ctv`, rappel
`RAP_CTV`, `qId` « chasles-trois-vecteurs ») : deux exercices partagent un
moteur, jamais une identité.

**Le plan** (`CTV_PLAN`) : `ci, ci, r, u, t, t0, ts` — deux lignes à
retourner, une déjà enchaînée (le résultat seul), une où l'on remplace le
second vecteur, puis trois lignes à TROIS vecteurs, écrites
« … + … + … = … » : `t` une somme dont aucun ordre des vecteurs écrits ne
s'enchaîne (il faut remplacer un vecteur par un vecteur égal, comme
HE + OG + HO = HE + EO + OF = HF), `t0` une somme NULLE (EG + FE + GF =
FE + EG + GF = 0), `ts` deux soustractions (EG − FG − OF = EG + GF + FO =
EO). Une ligne à trois vecteurs se range `{t:'t', w:[…], s:[1,±1,±1]}`. Elle
se tire en construisant une chaîne de points (refermée pour `t0`), dont chaque
vecteur est remplacé par un vecteur égal au hasard, puis l'ordre mélangé (`t`,
`t0`) ou les deux derniers retournés et soustraits (`ts`). Le centre
s'appelle toujours O, comme la fiche ; les sommets se tirent (ni I, ni W à Z).
La première figure EST la fiche ; `CTV_NB` = 2 figures, 21 cases chacune.

**Le juge d'une ligne à trois vecteurs** (`ctvJuge3`) : `ctvLigne` énumère
TOUTES les chaînes justes — trois vecteurs de la figure qui s'enchaînent et
égalent les termes signés dans un ordre quelconque. Chaque case du milieu se
juge contre les chaînes encore possibles après les cases JUSTES qui la
précèdent : HE + OG + OF garde HE et OF bleus, seul OG rougit (« doit partir
de E »), badge EO. Le résultat se juge contre la somme. **Le vecteur nul**
s'écrit 0, ou O seul, ou deux fois la même lettre (FF) : `ctvLit` les lit
tous comme « 0 » ; la correction écrit 0, sous la flèche de la case. Un
vecteur écrit pour une somme nulle rougit avec « la chaîne revient à son
point de départ ». La correction préfère la chaîne qui garde le plus de
vecteurs écrits (les soustraits par leur opposé).

**Le juge du banc** (`tests/verifier.js`, « Chasles avec trois vecteurs ») :
la place (8.9, pas de bouton des tables), 300 séances dont chaque correction
est relue par un juge INDÉPENDANT écrit depuis les coordonnées (pour une
chaîne : l'enchaînement, et les déplacements égaux aux termes signés à
l'ordre près), le plan, la ligne nulle et elle seule, la fiche en première
page ; puis par le bouton : 21 cases, lettres EFGHO, la copie juste,
d'autres écritures justes (HO + OG + GF = hf, GF + FE + EG = FF, résultat
OG pour EO), « o » pour le nul, le piège EG + FG (rouge, EG et le résultat
restent bleus, « opposé »), EG écrit pour la somme nulle (« nul »),
HE + OG + OF (seul OG rouge, badge EO, « part de E »), FH (« sens »),
OF + EO recopié (« ordre », du 8.8), la case vide (correction EO), la copie
vide, le soutien, le barème, `qId`, le contexte du modèle.

## {chasles-simplifier} — écrire plus simplement une somme de vecteurs (8.10, v492)

**La demande** (Turquet, octobre 2026) : « en seconde fais un exercice comme
le 8.8 mais avec le pdf joint » — une seconde fiche, le jour même où
l'EFGH de centre O devenait le 8.9 : les deux exercices cohabitent, celui-ci
en 8.10. La fiche : « ACKI est un rectangle. B, G, J
et E sont les milieux respectifs de [AC], [CK], [KI] et [IA]. » — le
rectangle, ses deux diagonales (centre F), la médiane [EG], et [BG], [EJ],
qui coupent la diagonale [IC] en D et H (milieux de [FC] et [IF]). Puis
« Écrire plus simplement les vecteurs suivants » : EH + HF = … ;
AE + FG = AE + … = … ; EH + IE, FC + BG, EF + EF, EI − JI = … + … = … ;
AC + AI = AC + … = … ; AF − FK = … + … = … + … = … ; EA − BA − CB − GC =
… + … + … = ….

**Un moteur à part, pas celui du 8.8.** Les lignes du 8.8 ont deux vecteurs
et une étape ; ici une ligne en a jusqu'à quatre, des signes, et parfois
deux étapes (AF − FK : l'opposé d'abord, AF + KF, puis un vecteur égal,
AF + FA). Une ligne se range comme ses termes (`v`), ses signes (`s`) et sa
forme (`f` ∈ r, u, c, z, q) ; la forme donne les ÉTAPES (`CSP_ETAPES`), des
emplacements « case » ou « premier vecteur gardé ». **Une étape est juste
quand ses vecteurs sont, dans un ordre quelconque, égaux aux termes (l'opposé
d'un terme soustrait) ; la dernière doit en plus s'enchaîner.** Le résultat
est juste dès qu'il vaut la somme ; la somme nulle s'écrit AA (n'importe quel
point répété) ou 0.

**La dernière ligne de la fiche n'avait que TROIS cases pour quatre
vecteurs** : l'écran en pose quatre (EA + AB + BC + CG = EG), une par
vecteur réécrit — c'est l'écart assumé avec le papier.

**Une case juste ne rougit pas pour sa voisine** : `cspRemplit` énumère
toutes les écritures justes d'une étape ; une case est juste s'il en existe
une qui la porte avec les cases justes avant elle. La correction prend,
parmi celles qui gardent les cases justes, la plus lisible : des vecteurs
portés par les traits du dessin, puis les lettres de l'énoncé (FC + BG se
corrige AF + FC, pas EB + BG, que rien ne trace).

**La première figure est la fiche** (`CSP_FICHE`) ; les suivantes tirent une
image affine — rectangle, carré, parallélogramme : mêmes milieux, mêmes
égalités —, son retournement, onze lettres (ni O, ni I, ni W à Z) et neuf
lignes du plan de la fiche (`CSP_PLAN` : déjà enchaînés, remplacer,
retourner, remplacer, remplacer, le même deux fois, soustraire, la somme
nulle, un chemin de quatre traits), chacune lisible sur les traits
(`cspPosable`). 27 cases par figure, `CSP_NB` = 2.

**Le juge** (`tests/verifier.js`, « écrire plus simplement une somme de
vecteurs ») : la place (8.10, pas de bouton des tables), la fiche du PDF
ligne à ligne, 150 séances dont chaque correction est relue par un juge
indépendant (appariement des vecteurs aux termes, enchaînement, somme), les
milieux qui restent des milieux, chaque forme tirée ; puis le bouton sur la
fiche : 27 cases, onze lettres, neuf traits, la copie juste, d'autres
écritures justes (FG pour EH + HF, IF + FK = IK, le nul écrit 0, AC pour
EG), le piège EI + JI (« opposé IJ »), FE (« sens »), FG recopié dans
AE + FG (« part de E »), EH + IE dans le même ordre (« ordre »), AF + BG
(AF bleu, BG rouge, badge FC), AK pour la somme nulle (« nul »), la case
vide, la copie vide, le soutien, le barème, `qId`, le contexte du modèle.

## {somme-vecteurs-repere} — placer un point défini par une somme de vecteurs (8.11, v493)

**La demande** (Turquet, octobre 2026) : « en seconde fais un exercice comme le
pdf, en plaçant d'abord les points demandés, puis en traçant les vecteurs
demandés, puis en déplaçant correctement ces vecteurs, puis en plaçant le
point relatif à la question ». La « Fiche 10 sur somme de vecteur » : un
repère gradué de −4 à 4, « 1) Placer A(3 ; 4), B(1 ; 2), C(3 ; 1) et
D(−2 ; −3) ; 2) Tracer BC⃗ et BA⃗ ; 3) Placer M tel que DM⃗ = BC⃗ + BA⃗ ».
Ajouté en dernier, il ne renumérote rien. Écrit comme 8.9, il est devenu 8.11 à la fusion :
{chasles-trois-vecteurs} (8.9) puis {chasles-simplifier} (8.10) sont arrivés sur `main`
pendant que la pull request attendait ses contrôles — deux fusions de `main`, et
la version est passée de v491 à v493.

**Quatre gestes, huit réponses, chacune jugée SEULE** (`svrJuge`) : les quatre
points (`svr-A` … `svr-D`), les deux vecteurs tracés (`svr-t0`, `svr-t1` : du
bon point au bon point, dans le bon sens), le déplacement (`svr-ch` : une
copie part du point d'origine, la copie de l'autre part de sa fin — dans
l'ordre qu'on veut) et M (`svr-M`). Un point faux ne fait pas rougir le
vecteur tracé juste, et le déplacement se juge au GESTE, sur les vecteurs que
l'élève a tracés : un vecteur tracé à l'envers coûte son point au geste ②,
pas une seconde fois au geste ③. M se juge à sa place. Trois questions
(`SVR_NB`, `dmNbQuestions`), barème 24.

**Les boutons des gestes sont les réponses.** Sous l'énoncé, trois rangées :
① « A(3 ; 4) », « B(1 ; 2) »… ; ② « Tracer BC⃗ », « Tracer BA⃗ » ; ③ la
consigne du déplacement, puis « Placer M ». Chaque bouton choisit le geste,
et c'est aussi une `pts-case` : il se peint bleu, rouge ou vert à la
vérification. Poser un point passe au geste suivant encore à faire
(`svrSuivant`), dans l'ordre de la demande. Un point se pose d'un clic, un
second clic au même nœud le retire ; un vecteur se trace début puis fin (un
clic de plus recommence, recliquer le début seul le retire).

**Le déplacement est le glisser du 8.7, sur une COPIE.** Chaque vecteur
tracé porte une prise (`.svc-prise`, reprise du 8.7 avec son `touch-action`
et le clic qui la traverse) ; ce qui glisse est une copie en pointillés — le
vecteur tracé reste entre ses deux points, comme sur la feuille où l'on
recopie la flèche ailleurs. La copie s'accroche aux nœuds, reste entière dans
le repère (retenue au bord), et s'efface quand on la ramène sur l'original.
Retracer un vecteur remet sa copie à sa place.

**On range les points et les indices, jamais la réponse** : `P` (A, B, C,
D), `o` (l'indice du point d'origine), `a` et `b` (les deux vecteurs en
paires d'indices), puis `pl`, `t` ({d, f}), `cp`, `m` — ce que l'élève a fait.
`svrM(q)` recalcule M. **La première question EST la fiche** ; les suivantes
tirent quatre points hors des axes, à un carreau du bord, deux à deux à deux
carreaux, JAMAIS TROIS ALIGNÉS, un point d'origine et deux paires des trois
autres, non colinéaires ni opposées, M lisible, la construction dans le
repère dans les deux ordres. Le repère va de −6 à 6 et de −5 à 5 : la fiche y
tient, avec la place de faire glisser.

**Ce que les captures ont corrigé avant la livraison.** La première montrait
un tirage où A, B et D étaient sur une même ligne : BA⃗ et AD⃗ se
superposaient, et la construction se lisait sur leurs traits — d'où le refus
des trois points alignés et des vecteurs colinéaires. Elle montrait aussi la
lettre B posée sur la flèche BA⃗ : la lettre d'un point se pose maintenant
dans celui des quatre coins le plus loin, en angle, des flèches qui touchent
ce point (`svrCoin`). La deuxième montrait les noms AD⃗ et DB⃗ l'un sur
l'autre, posés sur les nombres de l'axe : `svrNomsLisibles` refuse un tirage
où les noms des quatre flèches de la figure se chevauchent ou tombent sur une
bande de graduations (3 000 figures simulées sous Node, toutes différentes,
aucune au repli). L'abscisse −1 est exclue pour les points : la lettre,
posée à droite, touchait la graduation de l'axe des ordonnées.

**Les messages nomment la faute** (`svrPourquoi`) : abscisse et ordonnée
échangées, signe oublié, vecteur tracé à l'envers, construction qui ne part
pas du point d'origine, « un début va sur une fin », et où est M. En soutien,
le juste se fige (le bouton se désactive, la copie ne glisse plus), le faux
rougit, rien ne se révèle ; vérifier sans rien avoir fait ne peint rien.
Correction finale : en VERT les points manquants ou faux, les vecteurs du bon
point au bon point, la construction depuis le point d'origine (pointillés),
et M.

**Le juge** (`tests/verifier.js`, « somme de vecteurs dans un repère ») :
la place (8.11, le 8.8, le 8.9 et le 8.10 immobiles), 120 séances (la fiche en premier, chaque
figure relue par une seconde écriture : M, points lisibles, non voisins,
jamais trois alignés, vecteurs non colinéaires, construction dans le repère,
rien de répondu, JSON), la copie vide (huit `sol`, rien de rouge, cinq points
et quatre flèches en vert, « Il te manquait 8 cases »), la copie juste aux
gestes de l'élève avec reclic, copie retenue au bord, copie ramenée qui
s'efface, reprise après JSON ; l'autre ordre (BA⃗ d'abord) avec A aux
coordonnées échangées, BC⃗ à l'envers et M faux — `bad,ok,ok,ok,bad,ok,ok,bad`,
chaque faute nommée ; le soutien et le contexte du modèle. **Le banc
navigateur** (« 6 quadragies quinquies ») fait la fiche entière à la souris :
les quatre points (le premier clic à un cinquième de maille), le reclic qui
retire, BC⃗ et BA⃗ (le second clic sur B traverse la prise de BC⃗), les deux
copies glissées jusqu'à D puis au bout de la première, M — 8 sur 8, « 8 cases
justes sur 8 » — puis une copie vide entièrement verte. Le doigt sur
tablette, lui, ne se joue dans aucun banc.

**Les objectifs réalisés verdissent, M posé éteint le survol, et le vecteur
résultat se trace (v510).** La demande (Turquet, octobre 2026) : « dans
l'exercice 8.2.5, mettre en vert les objectifs dès qu'ils sont remplis comme
dans le 8.2.1 — ne pas oublier l'objectif "fais glisser … bout à bout, à
partir de …" ; quand placer M est réalisé, la souris ne doit plus afficher de
point au bout de la flèche quand on passe sur une intersection du
quadrillage ; il faut aussi tracer le vecteur correspondant au résultat ».
**Réalisé = le geste fait** : un point posé, un vecteur tracé (début et fin),
M posé — et pour le déplacement, les copies bout à bout depuis le point
d'origine (`svrChaine`), le seul objectif dont « fait » suppose « juste »,
comme l'étape 1 du 8.2.1. La classe `fait` (cadre vert, fond
`--green-soft`) se pose dans `svrMajOutils`, que `svrDeplacer` appelle
désormais : des copies qu'on écarte rendent l'objectif à son gris. Elle
s'efface au verrou, et dans la feuille de styles elle précède `ok`, `bad` et
`sol` : en soutien, la réponse jugée reprend la main sur le vert « fait ».
**Le survol** : M posé avec le geste « Placer M » choisi, le repère prend
`svr-repos` et le point de survol des nœuds (`.vec-t:hover .dot`) ne se
montre plus ; choisir un autre geste le rend. Un clic repose toujours M.
**Le vecteur résultat** OM⃗ (DM⃗ sur la fiche) se trace dès que M est posé,
du point d'origine au M de l'élève (`svr-res`), bleu, rouge si M est faux ;
à la correction, si M n'est pas juste, OM⃗ attendu se trace en vert. Ce
n'est pas une réponse de plus : le barème reste à 8. Son nom ne se pose pas
au milieu par principe : `svrEtiqResultat` essaie cinq places le long du
trait, HORS du triangle de la construction d'abord, et garde la première qui
ne tombe ni sur les graduations, ni sur le nom d'une autre flèche, ni sur un
point — sur la fiche, le milieu de DM⃗ tombait sur l'axe des ordonnées.
`svrCoin` compte aussi cette flèche pour poser les lettres. Vu dans un vrai
Chromium sur la fiche et quatre corrections tirées. Le juge
(`tests/verifier.js`) tient les sept objectifs verts, « Placer M » gris avant
M, des copies écartées qui rendent le gris, le survol éteint, DM⃗ tracé depuis
D et nommé, rouge vers un M faux, cinq flèches vertes dans une copie vide et
aucun `fait` après la vérification ; le banc navigateur (« 6 quadragies
quinquies ») lit les couleurs calculées du cadre et du fond, le point de
survol présent avant M et absent après, et la flèche DM⃗ dessinée.

**Puis les objectifs ne verdissent que JUSTES, un vecteur suit la souris, et le dessin s'est allégé (v519).**
La demande (Turquet, octobre 2026) : « dans le 8.2.5, les croix et les
lettres un peu plus petites, la pointe des vecteurs un peu plus petite ; la
case ne passe au vert que si c'est bien tracé ou placé ; à l'étape deux, le
point de départ posé, un vecteur tracé de ce point jusqu'à la flèche de la
souris ; M posé, le vecteur correspondant tracé ». **Juste, plus seulement
fait** : `svrJuste` (le point à sa place, le vecteur du bon point au bon
point, M au bout de la construction) pose la classe `fait` ; `svrFait` (le
geste fait) garde la main sur le geste suivant (`svrSuivant`) — sinon un
point faux retiendrait l'élève sur son geste. Le déplacement suivait déjà la
règle (`svrChaine`). Le vert dit donc juste avant la vérification : c'est
la demande, en devoir comme en entraînement. **La flèche qui suit la
souris** (`svrVif`, groupe `#svrVif` sans clic, la recette de `tvxVif`) :
du début posé jusqu'à la pointe, bleue à 75 %, rien au doigt, rien pendant
un glisser, rien une fois la fin posée ou la question corrigée ; la souris
se range dans `test.svrSouris` pour que chaque redessin la retrouve. **Le
vecteur résultat** OM⃗ se traçait déjà depuis la v510 : vu de nouveau dans
Chromium. **Les tailles** : croix de demi-côté 4 (au lieu de 5), trait 2,1,
lettres à 14 px (16), posées à 6 px (7) ; pointes `markerWidth` 5 (7), sur
ce dessin seulement — les classes `.svr-pt` du 8.2.8 et du 8.2.9 gardent les
leurs, la règle CSS est restée sous `.svr-svg`, propre à ce repère. Le juge
(`tests/verifier.js`) tient A faux, BC⃗ à l'envers et M faux restés gris, B
juste vert, la flèche vive depuis le début et effacée au retrait ou à la
fin ; le banc navigateur (« 6 quadragies quinquies ») bouge la vraie souris
après le début de BC⃗ et mesure la flèche du début de BC⃗ jusqu'à elle.

**Puis le geste ne passe à la suite que sur un objectif VERT (v523).** La
demande (Turquet, octobre 2026) : « dans le 8.2.5, tant qu'une case n'est
pas verte, ne pas passer à la suivante ». `svrSuivant` lit désormais
`svrJuste`, et `svrFait` a disparu : la v519 avait gardé « fait » pour
l'enchaînement exprès, pour qu'un point faux ne retienne pas l'élève — c'est
justement ce qui est demandé. Un point faux garde son geste : le clic
suivant le repose ailleurs ; un vecteur faux garde le sien : le clic suivant
recommence le tracé. Choisir un autre geste à la main reste possible ; un
geste juste mène au premier objectif encore gris APRÈS lui dans la même
étape, puis au premier gris de la fiche (A faux, B choisi à la main : B, C,
D s'enchaînent, puis retour à A) — on ne passe à l'étape suivante qu'avec
une étape toute verte. La première écriture ramenait à A dès B juste — le
clic destiné à C déplaçait alors A ; la deuxième avançait en cercle, et
après D partait tracer BC⃗, A toujours faux. Le juge a montré les deux à la
première exécution. `svrSuivant(q, depuis)` part donc du geste en cours ;
au rendu, sans geste, du début de la fiche. Rien n'enferme : un geste figé en soutien est sauté
comme avant. Le juge (`tests/verifier.js`, copie
« dans l'autre ordre ») tient A faux resté sur A, le retour à A après B, C,
D justes, et BC⃗ à l'envers resté sur « Tracer BC⃗ » ; la copie juste du
banc navigateur enchaîne toujours d'elle-même.

**Puis les pointes ont toutes pris la taille des pointillés, une croix M suit la souris, et la main a disparu (v523).**
La demande (Turquet, octobre 2026) : « les pointes de tous les vecteurs aussi
petites que celles des vecteurs en pointillés de ce même exercice ; quand on
place le point final, afficher à la pointe de la flèche de la souris une
croix avec la lettre du point à placer ; la souris ne peut pas afficher une
main à côté d'un point d'intersection du quadrillage ». **Les pointes** : un
`<marker>` se mesure par défaut en épaisseurs de trait — à `markerWidth` 5,
la pointe d'un trait plein (2,6) dépassait celle d'une copie en pointillés
(2). Les trois pointes des vecteurs (`svrArrE`, `svrArrB`, `svrArrS`) passent
en `markerUnits="userSpaceOnUse"`, à 10 unités du dessin (5 × 2, la taille
des copies) : la même pointe sur toutes les flèches, quelle que soit leur
épaisseur ; les axes gardent la leur. **La croix** : « le point final » est
M, le dernier geste. Le geste « Placer M » choisi et M pas encore juste,
`svrVif` dessine sous la pointe de la souris une croix de la taille de
celles du repère, lettre M en haut à droite, à 75 % — non aimantée au nœud,
c'est la souris qu'elle suit ; rien au doigt, rien une fois M juste ou la
question corrigée. **La main** : les nœuds de ce repère prennent
`cursor:default` (règle sous `.svr-svg`, les autres repères vectoriels
gardent leur main), et pendant que la croix suit, les prises des copies
aussi (`svr-croix`) — en dehors de « Placer M », la main ouverte des prises
reste, elle annonce le glisser. Le juge (`tests/verifier.js`) tient la
croix M à la souris, la classe `svr-croix`, les trois pointes à
`userSpaceOnUse:10`, la croix effacée M juste ; le banc navigateur
(« 6 quadragies quinquies ») bouge la vraie souris près d'un nœud et sur une
copie : croix M centrée sur la souris, aucun curseur `pointer` ni `grab`.

**Puis une croix suit la souris pour CHAQUE point, le point rond a disparu, un point faux rougit, un vecteur égal compte, et le glisser est devenu un geste (v525).**
La demande (Turquet, octobre 2026) : « dans le 8.2.5, je ne veux pas qu'un
point rond apparaisse sur le quadrillage quand la souris est à côté ; quand
on doit placer un point, une croix à l'extrémité de la flèche de la souris
ainsi que le nom du point à placer ; un point mal placé en rouge sur le
dessin ; à l'étape deux, on accepte un vecteur correct qui ne démarre pas du
point demandé ; l'étape 3, impossible de la faire : on me demande de placer
le point M directement ». **Le point rond** : sous `.svr-svg`, le survol
d'un nœud ne montre plus rien (`.vec-t:not(.sel):hover .dot`) — le début
posé d'un vecteur garde son point ; la classe `svr-repos` (M posé) a
disparu avec la règle qu'elle portait. **La croix** de M (v523) vaut pour A,
B, C, D : `svrVif` la dessine dès que le geste choisi est un point pas
encore juste, avec SA lettre. **Le rouge** : `svrCoulPt` peint un point posé
qui n'est pas à sa place en `eb` dès qu'il est posé — et la flèche DM⃗ vers
un M faux avec lui ; avant, le rouge attendait la vérification. Le vert de
l'objectif disait déjà juste ou non : le rouge n'apprend rien de plus, en
devoir non plus. **Le vecteur égal** : `svrJuste` (et `svrJuge`, qui le lit
désormais) compare le vecteur tracé au vecteur demandé, plus ses deux
bouts ; le message « à l'envers » lit le vecteur opposé, où qu'il soit. La
construction se juge comme avant sur les vecteurs de l'élève : un BA⃗ tracé
depuis D est déjà au départ. **L'étape 3** : « Fais glisser … » n'était
qu'une étiquette (`span`), hors de `SVR_OUTILS` — les deux vecteurs justes,
`svrSuivant` sautait au geste « Placer M », la croix M suivait la souris, et
un appui sur une copie sans assez de mouvement posait M. Le glisser est
maintenant un geste (`ch`, bouton de l'étape ③) : les vecteurs justes y
mènent, un clic sur un nœud n'y pose rien, aucune croix ne suit la souris,
la prise garde sa main ouverte ; faire glisser une copie choisit ce geste,
et les copies bout à bout depuis le point d'origine passent à « Placer M ».
Huit boutons de gestes au lieu de sept ; le barème reste à 8. Le juge
(`tests/verifier.js`) tient la croix A à la souris, la règle du survol, A
faux rouge avant la vérification puis A et M rouges, le geste « fais
glisser » après les vecteurs (un clic n'y pose pas M), le passage à M une
fois bout à bout, et une copie où BC⃗ est tracé depuis (−5 ; 0) et BA⃗
depuis D — 8 sur 8. Le banc navigateur (« 6 quadragies quinquies ») bouge
la vraie souris près de A : croix A, aucun point rond ; « fais glisser »
après les vecteurs, « Placer M » après le glisser.

**Puis un vecteur faux rougit dès qu'il est tracé, et l'étape ③ attend les deux vecteurs justes (v529).**
La demande (Turquet, octobre 2026) : « dans le 8.2.5, pour l'étape 2, quand
un vecteur tracé n'est pas bon, le mettre en rouge et ne pas passer à la
suite de l'exercice : il faut que l'élève le corrige jusqu'à ce que le
résultat soit bon ». **Le rouge** : `svrCoulVec` peint un vecteur tracé qui
n'est pas égal au vecteur demandé en `svc-eb` (pointe `svrArrB`) dès sa fin
posée, comme `svrCoulPt` pour les points (v525) ; avant, il restait bleu
jusqu'à la vérification. **La suite fermée** : la v523 retenait déjà le
GESTE sur un vecteur faux, mais rien n'empêchait de choisir à la main « Fais
glisser » ou « Placer M », ni de faire glisser la copie du vecteur faux —
la somme se construisait sur un vecteur faux. `svrOuvert(q,o)` ferme
désormais `ch` et `M` tant que `t0` et `t1` ne sont pas tous deux justes :
leurs boutons sont `disabled` (avec un `title` qui dit pourquoi), les copies
n'ont pas de prise, `svrDeplacer` refuse, `svrOutil` et `svrPose` refusent,
`svrSuivant` ne les propose pas. Le vecteur faux se retrace d'un clic
(« un clic de plus recommence »). L'énoncé le dit en une phrase. Un
brouillon d'avant la règle, copies et M déjà posés sur un vecteur faux, se
relit et se juge comme avant, chaque réponse seule. Le juge
(`tests/verifier.js`, copie « dans l'autre ordre ») tient BC⃗ à l'envers
rouge avant la vérification, les deux boutons de l'étape ③ fermés, aucune
prise, une copie qui ne glisse pas, « Placer M » refusé et le geste ramené
à BC⃗ ; le banc navigateur (« 6 quadragies quinquies ») trace d'abord BC⃗
faux à la souris, lit la couleur calculée du trait, l'étape ③ fermée, puis
le retrace juste et fait la fiche comme avant.

## {chasles-alignes} — la relation de Chasles sur une droite (8.12, v494)

**La demande** (Turquet, octobre 2026, le même jour que le 8.9 et avec la même phrase, mais une AUTRE fiche) : « en seconde fais un exercice comme
le 8.8 mais avec le pdf joint ». La fiche : « A, B, C et D sont quatre points
alignés tels que AB = BC = CD », une droite, et six lignes « Compléter » —
AB + CD, CB + AB, AC + DC, BD + BA, AB + DC = … = … ; AB + CD + CA = … = ….

**Ce que la fiche ajoute au 8.8, et que le moteur du 8.8 refusait** : le
VECTEUR NUL (CB + AB et AB + DC valent 0⃗ — `chsPosable` écartait toute somme
nulle) et une somme de TROIS vecteurs. D'où un exercice à part (`cha`), qui
partage les outils de lecture du 8.8 (`chsD`, `chsMeme`, `chsVecs`,
`chsGrp`) et du 8.3 (`vegLit`, `vegVecHTML`, `.veg-in`), mais pas son juge.

**Une seule forme de ligne** : aucune ligne de la fiche ne s'enchaîne telle
quelle, chacune se RÉÉCRIT (un vecteur par case, autant de cases que de
vecteurs) puis se conclut — 3 cases par ligne de deux vecteurs, 4 pour la
ligne de trois : 19 cases par figure. Le plan (`CHA_PLAN`) est celui de la
fiche : `n` (somme non nulle), `z` (somme nulle), `n`, `n`, `z`, `t` (trois
vecteurs, de somme nulle ou non). La première figure EST la fiche
(`CHA_FICHE`) ; les suivantes tirent quatre lettres (`CHS_LETTRES`) et six
lignes dont aucune paire voisine ne s'enchaîne déjà (`chaEnchainee` — pour
deux vecteurs, dans aucun ordre : « retourner » seul ne suffit jamais).
`CHA_NB` = 2 figures, `dmNbQuestions` allonge la séance, `distinctes()` les
tient différentes. On range les lettres et les lignes (`vs`), jamais les
réponses.

**Le juge** (`chaJugeLigne`) : `chaLigne` énumère TOUTES les écritures
enchaînées de la même somme (des vecteurs égaux à ceux de la ligne, dans un
ordre où chacun part là où s'arrête le précédent) ; la page retient celle qui
garde le plus de cases de l'élève (à égalité, celle qui garde les premières,
puis celle qui reprend le plus de vecteurs de la ligne — la correction de
AB + CD est AB + BC, pas BC + CD). Une case juste ne rougit donc pas pour sa
voisine. Le résultat est juste dès qu'il est égal à la somme (AB + CD = BD
aussi) ; le vecteur nul s'écrit 0, O ou deux fois la même lettre (AA), et la
correction écrit 0 sous la flèche de la case. Les messages nomment la faute :
le vecteur recopié qui doit « partir de B, là où s'arrête AB », le vecteur
égal à aucun de la somme, le vecteur nul (« on revient au point de départ »),
le résultat à l'envers.

**Le dessin** (`chaSvg`) : une droite, quatre points à pas égal, les lettres
dessous comme sur la fiche, un petit trait de codage sur chaque segment. Il
prend toute la largeur au-dessus des lignes (`.cha-fig`) : la droite est
longue et basse, posée à gauche elle écrasait les lignes.

**Le banc** (`tests/verifier.js`, « Chasles sur une droite ») : la place
(8.12, pas de bouton des tables), 300 séances dont chaque correction est relue
par un juge INDÉPENDANT écrit depuis les abscisses 0, 1, 2, 3, le plan, les
sommes nulles où le plan les veut, la ligne de trois vecteurs tantôt nulle
tantôt non ; puis le bouton sur la fiche : 19 cases, quatre lettres, trois
codages, la copie juste, d'autres écritures justes en minuscules (BC + CD =
BD, CB + BC = CC, CA + AB + BC = aa), AB + CD recopié (CD rouge, AB et AC
bleus, badge BC, « partir de B »), CD égal à rien de AC + DC, AB + DC = AB
(« nul »), BA pour AC + DC (« sens »), la case vide (correction BA, jamais
rouge), la copie vide, le soutien, le barème, `qId`, le contexte du modèle.

## {chasles-sans-figure} — la relation de Chasles sans figure (8.13, v495)

**La demande** (Turquet, octobre 2026) : « en seconde fais un exercice comme
le 8.8 mais avec le pdf joint », la fiche 6 « Relation de Chasles » — sans
figure, des points quelconques, trois parties : 1) écrire sous forme d'un
seul vecteur… si c'est possible (AD + DF, CB + CA, DF − FG, AB − AC,
RS + AR, EG + GT, AL − LA, − AD − DB) ; 2) écrire plus simplement
u = AB + BC + CA, v = IJ + KI + JK, w = AB + AC + BC, x = DE + FG + EF + DG ;
3) la même chose en transformant d'abord les soustractions (AB − AC,
RT − ST + RS, AB + MA − MB + BA, MN − MP − PQ + MQ).

**Prévu 8.9, publié 8.13** : pendant sa rédaction, d'autres sessions ont mis en ligne, le même jour, quatre exercices de vecteurs tirés d'AUTRES fiches — {chasles-trois-vecteurs} (8.9, le parallélogramme EFGH), {chasles-simplifier} (8.10, le rectangle ACKI), {somme-vecteurs-repere} (8.11) et {chasles-alignes} (8.12). Celle-ci, la fiche 6 sans figure, vient derrière, en 8.13. Elle s'appelait aussi « chasles-simplifier » sur sa branche : l'identifiant étant pris, elle est devenue {chasles-sans-figure}, et sa fonction de banc `chaslesSansFigure`. Aucun moteur commun avec les autres, sauf l'habillage des vecteurs du 8.3 (`.veg-v`, `.veg-in`).

**Une page par partie ; les trois premières SONT la fiche** (`CHL_FICHE`),
les trois suivantes reprennent chaque ligne de la fiche avec d'autres lettres
(ni O, ni I, ni W à Z), dans un autre ordre. `CHL_NB` = 6 pages,
`dmNbQuestions` règle la séance, `distinctes()` la tient différente ; 32
cases par séance. On range la partie et les lignes écrites (« +AB-AC »),
jamais les réponses.

**Une case par ligne, et la réponse s'écrit comme sur la copie** : AF, 2AC,
0 (le vecteur nul), ou « impossible ». Sur la partie 1 — la seule qui dise
« si c'est possible » — un bouton écrit le mot dans la case (et l'en retire
au second appui) ; la case s'élargit alors et perd sa flèche. Une seule case
peinte par ligne, et c'est voulu : `ptsEcran()` compte les champs peints, une
case du coefficient à côté de celle du vecteur aurait compté chaque ligne
deux fois.

**Le juge lit le calcul, pas des lettres attendues.** Sans figure, deux
vecteurs ne sont égaux que s'ils ont les mêmes lettres ; une somme se lit
donc comme une combinaison de points (AB vaut B − A). La réponse est juste
dès que sa combinaison est celle de la ligne : 2AL et −2LA ne font qu'un, AA
vaut 0. La ligne est impossible quand la combinaison porte trois points ou
plus (CB + CA = A + B − 2C). Les messages nomment la faute — « impossible »
sur une somme possible, un vecteur pour une somme impossible, le mauvais
sens, le mauvais nombre (AL au lieu de 2AL), la soustraction oubliée — et
déroulent le calcul : AB + MA − MB + BA = AB + MA + BM + BA = AB + BM + MA +
BA = 0 + BA = BA (`chlEtapes` : les opposés, la somme remise dans l'ordre
qui enchaîne, chaque chaîne réduite).

**Le juge du banc** (`tests/verifier.js`, « Chasles sans figure ») : la place
(8.13, pas de bouton des tables) ; les réponses de la fiche ; 300 séances dont
chaque correction est relue par un juge INDÉPENDANT — des coordonnées
quelconques pour chaque lettre, la somme calculée en déplacements, et
« impossible » vérifié contre tous les kXY possibles ; chaque ligne tirée est
une ligne de la fiche, lettres changées ; puis par le bouton : les trois
copies justes, d'autres écritures justes (minuscules, −2LA, « imp », AA,
2×DG), « impossible » sur AD + DF, AB pour CB + CA (badge « impossible »),
BC pour AB − AC (« sens »), AL pour AL − LA (« 2AL »), 2RT pour RT − ST + RS
(« opposé TS »), « A » illisible, la case vide (correction, jamais rouge),
la copie vide des trois parties, le bouton « impossible » dans les deux sens,
le soutien au fil de la saisie, le barème, `qId`, le contexte du modèle.

**Puis l'élève a écrit SA CHAÎNE** (v497, Turquet, octobre 2026 : « laisser
l'élève entrer dans un champ de saisie ses vecteurs, il doit y avoir une
flèche déjà prête à accueillir les deux lettres ; s'il tape un plus, un moins
ou un égal, alors afficher une autre flèche […] il peut toujours choisir
impossible »). La case unique de chaque ligne est devenue le DÉBUT d'une
chaîne : la première case garde son nom (`chl-i`, et tout le banc d'avant
s'y lit sans changement) ; un « + », un « − » ou un « = » tapé derrière des
lettres ferme la case et en ouvre une autre, le signe posé devant elle
(`chlSaisie`, sur l'événement `input` — le clavier d'une tablette Android
n'envoie pas de `key` utile, et un collage passe par le même chemin). Un « − »
EN TÊTE reste un signe (− AD − DB) ; un « + » ou un « = » en tête est retiré.
Retour arrière dans une case vide : elle part avec son signe. Le bouton
« impossible » écrit le mot au bout de la chaîne — derrière un « = » si elle
est commencée (CB + CA = impossible) — et l'en retire au second appui ; il
reste sur la partie 1 seulement, mais le mot se tape aussi.

**Le juge découpe aux « = »** (`chlAnalyse`, `chlLitMembre`) : chaque morceau
doit valoir la ligne (sinon « l'égalité … est fausse »), le DERNIER est le
résultat — un seul vecteur, 0 ou « impossible ». Un dernier morceau juste
mais encore à plusieurs vecteurs ne conclut pas : « tu peux encore l'écrire
avec un seul vecteur », ou, sur une somme impossible, « écris
“impossible” ». Une case vide au milieu de la chaîne rend la ligne illisible ;
les cases vides du bout tombent. **Le verdict reste à la page**, alors que la
demande disait « c'est l'IA qui vérifiera si c'est nécessaire » : une somme
de vecteurs sans figure se calcule exactement, le juge sait donc TOUJOURS
lire, et « un verdict arithmétique ne se confie pas à un modèle »
(`08-verdicts-et-juges.md`). Le modèle reçoit la chaîne dans `ctxChl` et
l'explique, comme avant.

**Une ligne vaut toujours un point** : seule la case du RÉSULTAT compte ; les
cases des étapes se peignent (bleu si leur morceau vaut la ligne, rouge
sinon) mais leur groupe porte `.pose-fac`, que `ptsEcran()` saute — la note
de la fiche reste « 8 cases », quel que soit le nombre d'étapes. Une ligne
vide reçoit la correction dans sa première case, en vert, comme avant.

**Le banc** (`tests/verifier.js`, même contrôle) tape caractère par caractère :
AB+CA=CB (trois cases, signes « + » et « = », juste, 8 cases à la note, tout
bleu), CB+CA puis le bouton (CB | CA | impossible, juste ; le second appui le
retire), CB+CA sans conclure (rouge, « écris “impossible” »), AB+AC=CB
(l'étape fausse nommée), AB+CA (pas fini : la première case bleue, la
dernière rouge), −AD−DB=BA (le « − » de tête reste un signe, posé DEVANT la
flèche et non dessous), la partie 2
en deux étapes, le retour arrière, et aucune case vide de chaîne ne rougit.

**Puis la chaîne est entrée dans UN SEUL champ** (v501, Turquet, octobre
2026 : « la réponse des élèves pour une question dans un seul champ de
saisie, la flèche du vecteur dans ce champ, le curseur qui clignote sous
cette flèche, qui doit s'agrandir quand on met une lettre dessous ; un plus,
un moins ou un égal fait apparaître une nouvelle flèche avec le curseur
dessous »). Une ligne = un `<input>` (`chl-i`), et plus aucune case ajoutée :
`chlAjoute`, `chlSigne`, `chlOp`, `chlNeg` et la classe `.pose-fac` de la
chaîne sont partis.

**Le vrai champ garde la saisie, un dessin la montre** (`chlRendu`). Un champ
« riche » (contenteditable, MathLive) aurait dû refaire ce que le navigateur
sait déjà : le clavier d'une tablette Android, le collage, le retour arrière,
la sélection. Le texte du `<input>` est donc transparent (curseur compris), et
`.chl-rendu`, posé par-dessus sans capter les clics, réécrit la même chaîne
lettre à lettre : chaque vecteur sous SA flèche (`.chl-vec`, la flèche des
`.veg-v`, 20 px à vide, puis la largeur de ses lettres), les signes entre
eux, et un curseur dessiné (`.chl-car`) qui clignote à la place de
`selectionStart` — sous la flèche ouverte quand on vient de taper un signe.
Un « − » en tête d'un morceau reste un signe, DEVANT la flèche ; un nombre
(2AC) aussi ; « impossible » s'écrit sans flèche (« 0 » aussi, jusqu'en v509). Un clic se
ramène aux lettres DESSINÉES (`chlClic`) : le curseur se pose entre les deux
lettres les plus proches du doigt, pas entre celles, invisibles, du vrai
champ. Le champ s'élargit avec la chaîne. La saisie est remise au propre à
chaque frappe (`chlNorme` : sans espaces, « − » → « - », « + » ou « = » de
tête retirés), le curseur suivant.

**Un champ, un verdict, une case peinte par ligne** — la note reste « 8 cases »
sans `.pose-fac`. Le juge lit la chaîne entière (`chlAnalyse` : découpe aux
« = », un signe laissé au bout tombe). La couleur du dessin suit celle du
champ par la CSS (`.chl-in.ok ~ .chl-rendu`), si bien que le garde qui retire
la couleur de la case où l'élève écrit agit sur le dessin sans le savoir ; la
couleur de chaque MORCEAU (`dataset.mv`, posée par `chlPeint`) ne se dessine
que hors du champ — une étape juste reste bleue dans une ligne fausse, le
résultat n'est bleu que si la ligne est juste. Le badge de la correction
(`mf-cor`) se glisse entre le champ et son dessin : `corrChoix` le trouve
toujours en `nextElementSibling`.

**Le banc** (`tests/verifier.js`, « Chasles sans figure ») tape caractère par
caractère : un seul champ par ligne, AB+CA=CB dessiné en trois flèches avec
« + » et « = », « AB+ » ouvre une flèche vide avec le curseur dessous (et il
y reste après une lettre), le champ vide a sa flèche prête, « impossible »
sans flèche, AB+AC=CB (morceaux « ff »), AB+CA=BC (« jf », l'étape bleue),
−AD−DB=BA (trois flèches, trois signes, le « − » hors de la flèche), un
« − » de tablette et des espaces remis au propre, le 2 de 2AC hors de la
flèche, un champ réduit à « += » qui ne rougit pas. Ce que jsdom ne voit
pas — la flèche qui s'allonge (20, 25 puis 42 px pour A puis AD), le curseur
qui clignote, le dessin aligné sur le champ — a été regardé dans Chromium,
à 1280 et à 390 px de large.

**Puis le calcul est entré DANS le champ, et un exemple ouvre la page**
(v505, Turquet, octobre 2026 : « mettre le calcul à effectuer dans le champ
de saisie ; écrire un exemple au début, un champ déjà complété, qui effectue
une addition et donne un modèle avec une étape jusqu'au résultat »). La
ligne ne montre plus « AD + DF = » DEVANT le champ : le champ s'ouvre sur
« AD + DF = », chaque vecteur sous sa flèche, et l'élève continue derrière.
**Ce début n'est pas dans la valeur du champ** — il est dessiné par
`chlPrefHTML` depuis `data-pref`, devant le dessin de la saisie
(`chlDessin`, tiré de `chlRendu`). C'est voulu : dans la valeur, l'élève
aurait pu l'effacer, et surtout un champ où il n'a rien tapé n'aurait plus été
VIDE — ni pour le juge (`s.vide`), ni pour `corrChoix` (la correction verte
dans un champ vide), ni pour la règle « une case vide ne rougit jamais », ni
pour la reprise. Tout cela lit la valeur, inchangée ; le juge, le banc et le
brouillon n'ont pas bougé. Le début s'écrit à l'encre de l'énoncé
(`.chl-pref`, `--ink`) et ne prend pas la couleur du verdict. Ses signes
portent `.chl-pop`, pas `.chl-op`, et ses vecteurs ne sont pas des
`.chl-vec` : le banc compte les flèches et les signes de la SAISIE.
L'exemple (`CHL_EXEMPLE`, `chlExempleHTML`) : « EF + GE = GE + EF = GF » —
une addition, une étape (l'ordre changé pour que les vecteurs s'enchaînent),
puis le résultat ; un dessin dans un cadre de champ, pas un `<input>` : rien à
saisir, à juger ni à reprendre. Sur un téléphone (≤ 520 px), la rangée entière
écrit à 1,1 rem, champ compris, du même facteur — le début ajouté élargissait
le champ hors de la rangée. Reste nommé : une chaîne de cinq vecteurs ou plus
déborde encore à 390 px. Regardé dans Chromium à 1280 et 390 px.

**Le vecteur nul a sa flèche** (v510, Turquet : « quand on tape 0, afficher
la flèche au-dessus, c'est le vecteur nul »). `chlDessin` dessinait « 0 »
comme « impossible », sans flèche : le résultat de AB + BA se lisait comme le
nombre zéro. Un morceau réduit à « 0 » passe désormais par `fleche()`, comme
un vecteur à deux lettres. Le banc tape « AB+BA=0 » et attend trois flèches,
« AB|BA|0 ». Le juge, la correction et le badge ne changent pas.

## {point-somme-vecteurs} — construire un point avec une somme de vecteurs (8.14, v496)

**La demande** (Turquet, octobre 2026) : « en seconde fais un exercice
comme l'exercice 2 du pdf, l'élève devra d'abord tracer les 2 vecteurs
demandés, puis pourra les déplacer aux bons endroits comme dans le 8.7 et on
finira par placer le point demandé ». La fiche (« Fiche 8 sur somme de
vecteur », exercice 2) : cinq points A, B, C, D, E sur un quadrillage, et
« construire A′ tel que AA′ = BC + BD », « B′ tel que BB′ = ED + EA »,
« C′ tel que CC′ = AE + BD ». Ajouté en dernier, il ne renumérote rien. Écrit comme 8.9 en v491, il est devenu le 8.14 en v496 au fil de cinq fusions de `main`, où {chasles-trois-vecteurs} (8.9, v491), {chasles-simplifier} (8.10, v492), {somme-vecteurs-repere} (8.11, v493), {chasles-alignes} (8.12, v494) puis {chasles-sans-figure} (8.13, v495) avaient pris leur place le même jour — plusieurs sessions remplissaient le thème 8 de front, et chaque pull request verte arrivait derrière une autre. Ce dernier part d'une autre fiche (la « Fiche 10 », un repère où l'élève place d'abord les points) : les deux exercices sont voisins, pas doubles — ici les cinq points sont donnés, et le geste à apprendre est de recopier deux vecteurs de la figure.

**Trois gestes, quatre réponses jugées chacune SEULE** (`cpsJuge`). ① Les
deux vecteurs se TRACENT, deux clics chacun (le début, puis la fin ;
recliquer le début seul le retire), le premier de la somme d'abord : la
flèche porte son nom dès qu'elle est tracée, et une ligne sous le dessin
(`#cpsEtape`) dit quelle flèche tracer ou quel point placer — un guide du
geste, jamais un verdict. ② Elles GLISSENT comme au 8.7 (le moteur de
`svcBrancher`, recopié pour son hôte : prise transparente, `touch-action`,
appui immobile = clic au nœud, flèches du clavier) jusqu'à être bout à bout
depuis le point donné, dans l'ordre qu'on veut. ③ Les deux tracées, un clic
pose le point (le même nœud le retire, un autre le déplace), dont la lettre
A′ s'écrit sur la cible. Les réponses : `cps-t1` et `cps-t2` (chaque flèche
fait le chemin de son vecteur, où qu'elle soit), `cps-ch` (les deux partent
bout à bout du point donné, quelles qu'elles soient), `cps-pt` (le point au
nœud attendu). Barème 4 par question, quatre questions (`CPS_NB`,
`dmNbQuestions`) : 16.

**Le chaînage jamais tenté ne rougit pas.** Deux flèches tracées sur la
figure et jamais déplacées, sans être déjà bout à bout depuis le point,
font un chaînage VIDE (sol), pas faux : l'élève n'a rien fait de travers,
il n'a rien fait. « Effacer mes flèches » efface les deux tracés pour les
reprendre — sauf, en soutien, celui que la vérification a figé juste ; le
point posé reste.

**On range la figure, jamais la réponse** : `pts` (les cinq points), `m`
(le point déplacé), `a` et `b` (les deux vecteurs, en indices de points),
puis `d1`/`f1`/`p1`, `d2`/`f2`/`p2` (les deux clics de chaque tracé et le
début déplacé) et `pt`. `cpsAttendu(q)` recalcule le point. Les deux formes
de la fiche ALTERNENT : « mo », deux vecteurs de même origine (BC + BD),
puis « qq », quatre lettres (AE + BD) ; le point déplacé n'est jamais une
lettre de la somme. Le tirage (`cpsGen`) : cinq points à un carreau du bord,
deux à deux à deux carreaux ; chaque chemin et la somme à deux carreaux au
moins ; deux vecteurs jamais parallèles (la construction se voit) ; la
construction depuis le point dans le quadrillage, dans les deux ordres ; le
point attendu à deux carreaux de tout point nommé. Quadrillage de 14 × 9.

**`svcFleche` sert les deux exercices** — et la fusion y a rencontré le nom à une flèche par lettre du 8.7 (« u+v » écrit u⃗ + v⃗) : une lettre est un morceau du nom coupé aux « + », et un morceau de deux lettres (BC) reçoit une flèche de deux largeurs. Elle prend désormais `o.geo` (le
quadrillage de l'appelant) et ne pose ses suffixes `-o`, `-t`, `-f` que sur
la PREMIÈRE classe — une flèche nommée en pointillés (`svc-s svc-copie`)
aurait sinon posé la classe `svc-s` sur son nom, et un trait vert de 2,6 px
autour des lettres. Le 8.7 n'en voit rien : il ne nommait jamais une flèche
à deux classes.

**La correction** : flèche juste en bleu, fausse en rouge ; en vert ce qui
manque — la flèche juste de chaque vecteur manqué, posée sur ses deux
lettres ; la construction depuis le point (le premier vecteur en trait
plein, le second en pointillés) si le chaînage n'y était pas ; le point
attendu avec sa lettre. Les pièges nommés (`cpsPourquoi`) : une flèche à
l'envers, une flèche de travers (avec son chemin en carreaux), les deux
débuts sur le point, une construction qui ne part pas du point, deux
flèches qui ne se touchent pas, un point qui n'est pas au bout. En soutien :
le faux rougit, le juste se fige, rien ne se révèle ; le chaînage ne se fige
que sur deux flèches justes — figé sur une fausse, il empêcherait de la
retracer.

**Le juge** (`tests/verifier.js`, « point par une somme de vecteurs ») : la
place (8.14, le 8.7 à 8.13 immobiles, pas de bouton des tables), 200
séances (quatre questions distinctes, barème 16, les clés rangées, les
formes qui alternent, le point recalculé, tout dans le quadrillage, JSON),
puis la figure de la fiche recadrée (A′ en (5 ; 2)) : l'énoncé, cinq croix,
150 cibles, aucune flèche avant le tracé ; la copie vide (quatre sol, quatre
traits verts, A′ en vert, « Il te manquait 4 cases ») ; la copie juste dans
les deux ordres, la reprise après JSON, la flèche retenue au bord ; BD à
l'envers et deux débuts sur A avec A′ juste (ok, bad, bad, ok — le point
juste ne rougit pas) ; les flèches jamais déplacées avec A′ faux (ok, ok,
sol, bad) ; le soutien (rien ne se révèle, la flèche juste se fige,
« Effacer » garde la figée) et le contexte du modèle. **Le banc navigateur**
(« 6 quadragies sexies ») trace BC à la souris (un clic à un cinquième
de maille), trace BD depuis B SOUS la prise de BC, fait glisser les deux
flèches bout à bout depuis A, pose A′ sous la pointe de BD et lit sa
lettre, puis corrige une copie vide (quatre traits verts, rien de rouge).
Le doigt sur tablette, lui, ne se joue dans aucun banc.

**Chaque étape faite passe au vert (v506).** La demande (Turquet, octobre
2026) : « dans le 8.14 mettre en vert l'étape qui a été effectuée à chaque
fois ». Les quatre consignes sous le dessin (① BC tracé, ② BD tracé,
③ bout à bout depuis A, ④ A′ placé) prennent la classe `cps-fait` — encre
et liseré verts, une coche « ✓ », SANS le fond adouci de `.sol` — dès que
leur geste est fait (`cpsFaits`, appelé par `cpsConsigne`, que le glisser
appelle désormais lui aussi). « Faite », pas « juste » : une flèche tracée à
l'envers passe au vert comme une autre ; seule la vérification juge.
`cpsPeindre` retire la marque avant de peindre son verdict, et une consigne
déjà marquée ok, bad ou sol ne la reprend pas (en soutien, la case bleue
reste bleue ; une rouge reste rouge jusqu'au geste suivant). La règle CSS ne
nomme aucune classe de verdict : « 9 bis » ne la lit pas, et n'a pas à la
lire. Le juge suit la copie juste du banc pas à pas : 0000, 1000, 1100,
1110, 1111, puis 0000 une fois la copie vérifiée.

**Puis les étapes sont passées AU-DESSUS du dessin, sur fond vert une fois faites, et le point a suivi la souris à la dernière étape (v509).**
La demande (Turquet, octobre 2026) : « en seconde pour le 8.2.8, afficher les
étapes avant le dessin, quand une étape est réussie mettre aussi le cadre sur
un fond vert clair. Quand on doit placer le point à la dernière étape,
afficher le point sur la souris comme dans le 8.2.9, mais quand le point est
placé il ne faut plus que le point soit affiché sur la flèche de la souris. »
`#cpsBody` (les quatre consignes, puis la ligne `#cpsEtape`) passe avant
`#cpsGraph`. `cps-fait` prend le fond `--green-soft` — le paragraphe
précédent disait « sans le fond adouci de `.sol` » : c'est la demande qui a
changé, la règle CSS ne nomme toujours aucune classe de verdict. Le curseur
est celui du 8.2.9 (`#cpsCurseur`, classe `cvp-curseur`, posé en DERNIER dans
le SVG, au-dessus des prises) : il ne se montre que si les deux flèches sont
bout à bout depuis le point (`cpsChaine`) ET que A′ n'est pas encore posé —
jamais pendant un glisser, après la correction, une fois le point figé, ni
au doigt. Retirer A′ (recliquer son nœud) le fait revenir. Comme au 8.2.9, un
clic n'importe où dans le quadrillage pose le point au nœud le plus proche,
dès que les deux flèches sont TRACÉES (avant, un clic de ce genre aurait posé
un bout de flèche à l'aveugle) ; le drapeau `apresPrise` avale le `click`
qui suit un appui sur une prise, déjà traité par le glisser. Le juge vérifie
l'ordre (consignes avant le dessin) et le curseur caché au départ ; le banc
navigateur (6 quadragies sexies) mesure les consignes au-dessus du dessin,
le fond de l'étape faite différent de celui de l'étape à faire, le point à
moins de 3 px de la souris sur le milieu de BD, un clic entre les nœuds qui
pose A′ au plus proche, puis le curseur caché une fois A′ posé.

**Puis A′ s'est marqué d'une CROIX, le survol n'a plus montré de rond, et le vecteur AA′ s'est tracé (v514).**
La demande (Turquet, octobre 2026) : « dans le 8.2.8, quand le point de
l'objectif 4 est placé, mettre une croix plutôt qu'un rond pour le point ; il
ne faut plus que la flèche de la souris affiche un rond quand on passe à côté
d'une intersection du quadrillage. Il faut aussi afficher le vecteur
correspondant à la solution. » Le nœud choisi porte une croix
(`path.cps-x`, posée par `cpsCroix` dans les SEULS nœuds marqués), bleue
posée ou juste, rouge fausse, verte attendue — comme les cinq points donnés.
Une première version cachait une croix dans chacun des 150 nœuds ; le 8.1.6,
publié pendant ce temps, venait d'apprendre que ce choix sature la mémoire du
banc principal dans l'action : la croix ne se crée donc qu'à la demande. Le rond (`.dot`) ne se montre
plus jamais sur ce dessin, survol compris ; la règle est bornée à `.cps-svg`,
les 8.5 et suivants gardent leur rond. Le point qui suit la souris est la même
croix. Le vecteur : un calque `#cpsSol`, à part de `#cpsFl` et `#cpsCorr`
(leurs comptes de traits restent ceux du juge), porte la flèche AA′ du point
donné au point posé — violette (`--crd-a`) avant le jugement, bleue ou rouge
comme le point ensuite ; quand A′ n'est pas juste (faux ou vide), la
correction y ajoute en vert AA′ vers le point attendu, son nom de l'autre
côté. Le juge lit la croix sur le nœud posé, AA′ tracé depuis A et nommé, AA′
effacé quand A′ se retire, bleu seul sur la copie juste, rouge plus vert sur
A′ faux, vert seul sur la copie vide ; le banc navigateur mesure la croix
visible sans rond, AA′ visible, et aucun rond au survol d'un nœud.

**Puis chaque cadre a porté sa consigne, le cadre à faire est passé en bleu, et une flèche fausse n'a plus validé son étape (v517).**
La demande (Turquet, octobre 2026) : « dans le 8.2.8, je ne veux que les 4
cadres pour les étapes et je ne veux plus les consignes entre ces 4 cadres et
le dessin. Chaque cadre contiendra la consigne correspondante. Le cadre à
réaliser sera en bleu, quand il sera fait on le met en vert et on met en bleu
le cadre suivant. Si l'élève ne fait pas le bon vecteur, ne pas valider le
cadre et ne pas mettre de nom sur le dessin pour ce vecteur. » La ligne
`#cpsEtape` a disparu, et avec elle la liste ①②③ du bas de l'énoncé, qui
doublait les cadres : `#cpsBody` ne porte plus que les quatre cadres, chacun
avec sa consigne dans un `span.cps-txt` (seul ce `span` se réécrit, le cadre
garde ce qu'on y aurait greffé). Le cadre en cours prend `cps-cours` — liseré
et fond bleu clair, la PREMIÈRE étape non faite (`cpsEtapes`) ; la règle ne
nomme aucune classe de verdict, « 9 bis » ne la lit pas. « Faite » change de
sens pour les deux flèches : faite veut dire JUSTE (`cpsJuste`, le chemin du
vecteur, où que soit la flèche). Une flèche fausse reste dessinée, SANS nom
et sans prise, son cadre reste bleu et dit « Ce n'est pas le vecteur EC.
Trace-le de nouveau » ; le clic suivant recommence son tracé. Le prix est
nommé : en évaluation aussi, l'élève apprend avant de vérifier que sa flèche
n'est pas la bonne — c'est la demande. La seconde flèche ne se trace qu'une
fois la première juste, et A′ ne se pose qu'une fois les deux justes ; une
copie d'avant v517 reprise avec une flèche fausse se juge comme avant,
réponse par réponse. Le juge suit le bleu pas à pas (1000, 0100, 0010, 0001,
puis 0000 une fois vérifié), trace une flèche fausse (pas de vert, pas de
nom, pas de prise, le cadre qui le dit) ; le banc navigateur le rejoue à la
souris et mesure le fond bleu du cadre à faire.

**Puis le tracé s'est fait à la croix, une flèche a suivi la souris, et toutes les pointes se sont affinées (v521).**
La demande (Turquet, octobre 2026) : « dans le 8.2.8, quand il faut tracer un
vecteur, mettre une croix sur la pointe de la flèche de la souris, puis quand
on clique tracer un vecteur de ce point jusqu'à la pointe de la flèche de la
souris ; quand on reclique le vecteur se fixe. Dans cet exercice tous les
vecteurs dessinés doivent avoir une pointe plus fine. » **La croix** :
`#cpsCurseur`, qui ne se montrait qu'à la dernière étape, se montre aussi
tant qu'une flèche reste à tracer (`!cpsEtapes(q)[1]`) — sans la lettre A′,
qui n'appartient qu'au point à placer. Le début posé se marque lui aussi
d'une croix (`cpsCroix` prend `.deb` : le rond qui le marquait est caché sur
ce dessin depuis la v514, le début posé ne se voyait plus). **La flèche qui
suit la souris** : la recette de `svcVif` (8.2.1), un calque `#cpsVif` sans
clic, sous la croix ; du début posé jusqu'à la souris elle-même, dans le
style de la flèche qu'on trace (trait plein `svc-u` ou pointillés `svc-v`,
à 80 %) ; elle s'efface au second clic, au début retiré, quand la souris
quitte le dessin, et ne vit pas au doigt. Le clic de l'hôte va désormais au
nœud le plus proche AUSSI pendant le tracé — le paragraphe de la v509 le
refusait parce qu'un tel clic aurait posé un bout de flèche « à l'aveugle » :
la croix sous la souris lui rend la vue. Il appelle `curseur` après chaque
clic, celui d'un nœud compris, pour que la flèche parte dès le début posé.
**Les pointes** : les six marqueurs du dessin (`pointe` dans `cpsSVG`)
gardent leur longueur et perdent un tiers de leur largeur (`M0 1.8L10 5L0
8.2z`) — tracées, glissées, corrigées, AA′ et la flèche vive : ce dessin
seulement. Le banc navigateur (« 6 quadragies sexies ») mesure la croix sans
lettre sur la souris avant le tracé, la croix du début posé, la flèche du
nœud B (à 2 px) jusqu'à la souris (à 3 px), pointe comprise et sans clic,
qui suit la souris qui bouge et s'efface à la fin fixée, puis le tracé de
chaque pointe.

**Puis la croix a quitté la pointe de la souris pendant le tracé (v527).**
La demande (Turquet, octobre 2026) : « en seconde dans le 8.2.8, ne pas
mettre de croix au bout de l'extrémité de la flèche de la souris quand on
doit tracer un vecteur. » La croix de la v521 sur la pointe de la souris est
retirée tant qu'une flèche reste à tracer, avant le début comme après :
`curseur` cache `#cpsCurseur` dès que `trace` est vrai. Ce qui reste : la
croix du début posé sur son nœud, la flèche vive du début jusqu'à la souris,
le clic qui va au nœud le plus proche, et, à la dernière étape seulement, la
croix A′ qui suit la souris avec sa lettre. Le banc navigateur (« 6
quadragies sexies ») renverse ses deux mesures : aucune croix visible sous la
souris, avant le tracé ni le début posé ; la flèche vive est toujours mesurée.

**Puis la flèche fausse s'est peinte en ROUGE dès le tracé (v530).**
La demande (Turquet, octobre 2026) : « dans le 8.2.8 mettre les vecteurs en
rouge si la réponse de l'élève ne correspond pas à ce qui est demandé. »
Depuis la v517, une flèche tracée qui n'est pas le bon vecteur restait au
dessin sans nom ni prise, dans l'encre de la flèche à tracer ; son cadre
seul disait « Ce n’est pas le vecteur … ». `cpsDessiner` la peint désormais
`svc-eb` (trait et pointe rouges, `cpsArrB`) dès qu'elle est tracée, sans
attendre la vérification — même logique que le cadre, qui le disait déjà :
le prix nommé à la v517 (l'élève l'apprend avant de vérifier, en évaluation
aussi) ne change pas. Une flèche juste garde son encre jusqu'à la
vérification ; le clic suivant retrace la fausse, et le rouge part avec
elle. La règle « une case vide ne rougit jamais » n'est pas touchée : seule
une flèche tracée peut rougir. Le juge lit `svc-eb` et `cpsArrB` sur la
flèche fausse ; le banc navigateur (« 6 quadragies sexies ») mesure la
dominante rouge de son trait calculé.

## {point-somme-difference} — construire un point par une somme ou une différence de deux vecteurs (8.15, v498)

**La demande** (Turquet, octobre 2026) : « en seconde fais un exercice comme
l'exercice 1 du pdf, en déplaçant les vecteurs comme dans le 8.7 ». La
« Fiche 8 sur somme de vecteurs », exercice 1 : deux vecteurs u⃗ et v⃗ sur un
quadrillage, trois points A, B, C, et « construire le point manquant
vérifiant l'égalité » — AA′ = u⃗ + v⃗, BB′ = u⃗ − v⃗, CC′ = −u⃗ − v⃗. Ajouté en
dernier, il ne renumérote rien. Il voisine avec le 8.11
({somme-vecteurs-repere}), écrit le même jour dans une autre conversation :
là, des vecteurs tracés entre des points d'un repère, et seulement des
SOMMES ; ici, deux vecteurs libres, et des DIFFÉRENCES et des opposés — d'où
le geste de retourner une flèche.

**Écrit comme 8.9 en v491, publié 8.15 en v498**, au fil de trois fusions de
`main` : les 8.9 à 8.14 avaient été pris le même jour par d'autres sessions.
La dernière fusion a montré une COLLISION d'identité, pas seulement de numéro :
le 8.14 venait d'être publié sous l'identifiant `point-somme-vecteurs` — celui
que portait cet exercice — et sous le profil de banc `pointSommeVecteurs`. Le
8.14 fait l'exercice 2 de la MÊME fiche (cinq points donnés, AA′ = BC + BD,
deux vecteurs à tracer puis à faire glisser) ; celui-ci fait l'exercice 1
(u⃗ et v⃗ libres, sommes, différences et opposés). Ils sont voisins, pas
doubles. Celui-ci a donc changé d'identifiant (`point-somme-difference`), de
profil (`pointSommeDifference`), de section de banc navigateur (« 6
quadragies septies ») et de titre (« Construire un point : somme ou
différence de deux vecteurs ») : deux noms de menu presque identiques
auraient fait choisir l'un pour l'autre. Le kind `cvp` et les fonctions
`cvp…` n'entraient en collision avec rien (le 8.14 est `cps`).
**Puis l'énoncé n'a gardé que les mathématiques, et la méthode est passée AU-DESSUS du dessin, une étape à la fois (v501).**
La demande (Turquet, octobre 2026) : « dans le 8.15, je ne veux que l'énoncé
mathématique, l'explication de l'étape n°1 doit s'afficher en premier au
dessus du dessin de manière visible ; quand l'élève a fait cette étape, il
faut afficher l'étape 2 au dessus du dessin de manière visible. Ne pas
afficher fin / début sur les vecteurs du dessin. » L'énoncé (`#cvpInstr`) se
réduit à « Construis le point A′ tel que AA′ = u⃗ + v⃗. » ; un bandeau
`#cvpEtape`, posé entre l'énoncé et le dessin, dit l'étape en cours
(`cvpConsigne`, rappelée à chaque redessin des flèches). Étape 1 : faire
glisser u⃗ et v⃗ bout à bout depuis le point — et, SEULEMENT si l'égalité en
porte un, retourner −u⃗ ou −v⃗ (la phrase générique « pour −u⃗ ou −v⃗ » nommait
un geste inutile sur AA′ = u⃗ + v⃗). Étape 2 dès que les deux flèches sont bout
à bout depuis le point, dans un ordre ou l'autre (`cvpBoutABout`) : c'est le
GESTE qui fait passer à l'étape 2, pas sa justesse — le sens des flèches
n'est pas regardé, sans quoi le bandeau dirait « juste » avant « Vérifier »
(soutienEnDirect.sans). Après la correction, le bandeau se vide. Les mots
« début », « fin » et « fin / début » ne s'écrivent plus sur les flèches ; la
petite pastille du début reste, le nom des flèches aussi.

Le juge tient l'énoncé à la phrase près, la place du bandeau (juste avant le
dessin), le « −v⃗ » seul nommé sur BB′ = u⃗ − v⃗, l'étape 2 après u⃗ puis −v⃗
posés depuis B, le bandeau vide après la correction et zéro `svc-mot` dans le
dessin ; le banc navigateur mesure que le bandeau est AU-DESSUS du dessin, à
l'étape 1 puis à l'étape 2 après les deux glissés à la souris.

**Puis, à l'étape 2, le point a suivi la pointe de la souris, et un clic n'importe où le pose au nœud le plus proche (v504).**
La demande (Turquet, octobre 2026) : « dans le 8.15, quand il faut placer un
point sur le quadrillage, afficher le point au bout de la flèche de la
souris ; il doit être visible quand on passe sur un vecteur ; quand on
clique, il faut le placer sur le point le plus proche du quadrillage. »
Le survol d'un nœud (`.vec-t:hover .dot`) ne se voyait pas sous une flèche :
la prise (`.svc-prise`, un trait de 22 unités) passe au-dessus des nœuds et
prend le survol. Un groupe `#cvpCurseur` (`pointer-events:none`, posé en
DERNIER dans le SVG, au-dessus des prises) dessine le point et sa lettre
(« B′ ») à la position exacte de la souris — pas aimanté : c'est la pointe
qui le porte, l'aimant ne joue qu'au clic. Il ne se montre qu'à l'étape 2
(`cvpBoutABout`), jamais pendant un glisser, après la correction, une fois
le point juste figé, ni au doigt (`pointerType` « touch » : pas de survol).
Le clic : un écouteur de l'hôte pose au nœud le plus proche tout clic du
quadrillage (à une demi-maille du cadre près) qui ne tombe ni sur un nœud,
ni sur une prise — ceux-là gardent leur propre clic, sans quoi le nœud
recliqué se retirerait aussitôt reposé. **Piège rencontré** : un glisser qui
commence sur une prise et finit ailleurs envoie son `click` à l'ancêtre
commun, le SVG — il aurait posé un point. Une première garde au chronomètre
(400 ms après la fin d'un glisser) avalait au banc le clic légitime qui
suivait vite ; c'est un drapeau `apresPrise`, levé à la fin du geste sur la
prise et baissé au prochain appui, qui tient le bord. Le banc navigateur (6
quadragies septies) mesure le point posé sur le milieu de −v⃗ à moins de
3 px de la souris, et un clic loin de tout nœud et de toute flèche qui pose
B′ au nœud le plus proche.

**Puis, au 8.1.6, le point a suivi la souris, et le point choisi est devenu une croix (v511).**
La demande (Turquet, octobre 2026) : « dans le 8.1.6, la flèche de la souris
doit afficher un point constamment à l'écran. Quand un point est choisi,
mettre une croix, et ne plus afficher de point au bout de la flèche de la
souris ainsi que quand on passe sur une intersection du quadrillage. »
Un groupe `#vepCurseur` (la classe `.cvp-curseur` du 8.2.8 : `pointer-events:none`,
posé en DERNIER dans le SVG) dessine le point et la lettre à placer à la
position exacte de la souris, partout sur le quadrillage à une demi-maille du
cadre près — pas aimanté, le clic garde les zones de touche des nœuds. Le
nœud choisi se dessine en croix comme les points donnés : UNE croix
(`vepCroix`), posée dans le groupe du seul nœud choisi, bleue, rouge si elle
est fausse (`badc`), et son disque devient transparent — il garde sa
géométrie. **Piège rencontré** : la première version cachait une croix dans
chacun des 97 nœuds (une option de `vecQuadrillage`) ; le dessin triplait à
chaque question, et le banc principal de la Seconde, déjà proche de la limite
de mémoire de Node, est mort de saturation dans l'action — deux fois, quand
les autres pull requests passaient. La mesure de la mémoire ligne par ligne,
branche contre `main`, a désigné le bloc des vecteurs (+300 Mo). Dès qu'un nœud est choisi,
la classe `vep-pose` du dessin éteint le survol des autres nœuds et cache le
point de la souris ; recliquer la croix la retire, et le point revient. Rien
au doigt (`pointerType` « touch »), rien une fois la question corrigée ou le
point juste figé en soutien. Le point attendu de la correction (`missc`) reste
le disque vert. Le banc navigateur (6 quadragies ter) mesure le point à moins
de 3 px de la souris entre deux nœuds, la croix et le disque transparent du
nœud choisi, le point caché, le survol éteint, puis le point revenu après le
reclic.

## {tracer-vecteurs-egaux} — tracer un vecteur égal à u⃗, à v⃗, à w⃗ (8.1.7, v512)

**La demande** (Turquet, octobre 2026) : « en seconde créer un exercice qui
affiche trois vecteurs u, v et w sur un quadrillage et qui demande à l'élève
de tracer un vecteur égal au vecteur u, puis au vecteur v puis au vecteur w.
Sur la flèche de la souris il doit y avoir un point et quand on clique, on
doit placer une croix sur l'intersection du quadrillage la plus proche, et il
doit apparaître une flèche qui part de ce point placé jusqu'à la pointe de la
flèche de la souris. Quand on clique une deuxième fois il doit fixer le
vecteur avec comme point d'arrivée le point du quadrillage le plus proche de
la souris. Si l'élève clique sur le point de départ on peut déplacer ce point
à l'aide de la souris en traçant le vecteur jusqu'à son point d'arrivée qui
est fixé. Si on clique sur le point d'arrivée, alors le vecteur est tracé du
point de départ qui est fixe jusqu'à la flèche de la souris. » Il ferme le
sous-thème « Vecteurs égaux » : 8.1.7, rien ne se renumérote.

**Le geste, mot pour mot.** Le point de la souris est le `cvp-curseur` du
8.2.9 (`#tvxCurseur`, posé en DERNIER dans le SVG), à la position EXACTE de
la pointe — l'aimant ne joue qu'au clic. Il se montre tant qu'un clic posera
quelque chose (une flèche reste à tracer, ou une extrémité est reprise) ;
les trois flèches tracées, il se cache. Le premier clic pose le départ au
nœud le plus proche, dessiné en CROIX ; une flèche élastique (`#tvxVif`) va
de la croix à la pointe de la souris, sans aimant. Le second clic fixe
l'arrivée au nœud le plus proche. Un clic sur le départ d'une flèche tracée
le reprend (`test.tvxMob`, `bout:'d'`) : la flèche va de la souris à
l'arrivée, fixe ; le clic suivant repose le départ. Même chose pour
l'arrivée (`bout:'f'`). Trois gestes en plus, pour ne jamais coincer
l'élève : recliquer la croix d'une flèche commencée la retire (comme au
8.2.8), Échap rend une extrémité reprise à sa place (ou retire la croix d'une
flèche commencée), « Effacer mes flèches » efface tout sauf ce que le soutien
a figé. Un clic qui ferait un vecteur nul est ignoré.

**Un seul écouteur de clic, à l'hôte, qui va au nœud le plus proche** — pas
de cible par nœud comme au 8.2.8 : le clic n'a jamais à viser, et
`tvxClic(i, j)` est ce que le banc principal joue. L'ordre de lecture d'un
clic : une extrémité reprise se pose ; sinon une flèche commencée prend son
arrivée ; sinon un clic sur une extrémité d'une flèche tracée la reprend ;
sinon il pose le départ de la flèche suivante. **Le prix est nommé** : un
départ ne peut pas se poser sur une extrémité d'une flèche déjà tracée (le
clic la reprendrait) — ici, sans conséquence : un vecteur égal se trace
n'importe où.

**Les couleurs.** u⃗, v⃗, w⃗ donnés en noir, comme au 8.7. Les flèches de
l'élève en VIOLET (`--crd-a`, le violet du liseré de {croiser-denominateurs})
tant qu'elles ne sont pas jugées : le bleu dit « juste » et le vert
« correction » depuis août 2026, aucune des deux encres n'était libre. Elles
portent leur nom (u, v, w) — un vecteur égal à u⃗ EST u⃗. Les classes de la
croix (`tvx-ok`, `tvx-bad`, `tvx-sol`) ne sont pas des classes de verdict :
« 9 bis » ne les lit pas.

**On range la figure, jamais la réponse** : `q.vs` (trois
`[origine x, origine y, dx, dy]`) et `d1/f1`, `d2/f2`, `d3/f3`. L'extrémité
reprise n'est pas rangée : après une pause, la flèche revient à sa dernière
place. Le tirage (`tvxGen`) : chemins de 2 à 4 carreaux par direction, deux
à deux non parallèles, au moins deux en biais, à un carreau du bord et à deux
carreaux l'un de l'autre, sur un quadrillage de 18 × 10. Trois questions par
séance (`TVX_NB`, `dmNbQuestions`), barème 9.

**Le juge** (`tvxJuge`) : chaque flèche SEULE, juste si elle fait le chemin
du vecteur, où qu'elle soit. Les pièges nommés (`tvxPourquoi`) : la flèche à
l'envers, la bonne direction et le bon sens sans la bonne longueur, la bonne
direction seule, la mauvaise direction — puis le chemin du vecteur et celui
de la flèche en carreaux. La correction trace en VERT la flèche juste de
chaque vecteur manqué : au départ de la flèche de l'élève si elle tient dans
le quadrillage, sinon à la première place libre (`tvxPlace`). En soutien, la
flèche juste se fige (plus de prise), la fausse rougit et se reprend d'un
clic ; rien ne se révèle.

**Le contexte du modèle** (`ctxTvx`) donne les trois vecteurs par leurs
extrémités et les flèches de l'élève. Pas de clause de secret : la réponse
est sous les yeux de l'élève ; la contrainte est de faire COMPTER le chemin
plutôt que de le dicter.

**Les bancs.** Le principal (`tracerVecteursEgaux`, « vecteurs égaux à
tracer ») : la place (8.1.7, les voisins immobiles, pas de bouton des
tables), 200 séances (trois questions distinctes, barème 9, les clés
rangées, les contraintes du tirage, JSON), puis une figure fixe : l'énoncé,
les trois vecteurs nommés, aucune flèche avant le tracé, les étapes avant le
dessin ; la copie vide (trois sol, trois flèches vertes, « Il te manquait 3
cases ») ; la croix, son retrait, Échap ; le départ repris (un vecteur nul
refusé, Échap qui rend la place), l'arrivée reprise ; la reprise après JSON ;
la copie juste (trois ok, trois flèches bleues, plus de prise) ; u à
l'envers, v trop court, w absent (bad, bad, sol, la flèche verte de u au
départ de l'élève) ; v de travers seul (ok, bad, ok) ; le soutien (le juste
figé ne se reprend pas, le rouge oui, « Effacer » garde le figé). **Le banc
navigateur** (« 6 quadragies octies ») joue tout à la vraie souris : le
point à moins de 3 px de la pointe, un clic à un cinquième de maille qui
pose la croix au nœud, la flèche élastique mesurée de la croix à la pointe,
le départ repris qui suit la souris pendant que l'arrivée reste fixe, puis
l'inverse, le point caché une fois les trois flèches tracées, Échap au
clavier, la copie juste (3) et la copie vide (trois flèches vertes, rien de
rouge). Le doigt sur tablette — un toucher pour le départ, un pour
l'arrivée, sans flèche élastique faute de survol — ne se joue dans aucun banc.

**Puis les deux étapes sont passées AU-DESSUS du dessin comme au 8.2.8, le point est devenu une croix, et le vecteur solution s'est tracé (v513).**
La demande (Turquet, octobre 2026) : « dans le 8.2.9, afficher les objectifs
(ici ce sont les 2 étapes) comme dans le 8.2.8 ; quand le point de
l'objectif 2 est placé, mettre une croix plutôt qu'un rond pour le point ; il
ne faut plus que la flèche de la souris affiche un rond bleu ou blanc quand
on passe à côté d'une intersection du quadrillage ; de plus il faut aussi
afficher le vecteur correspondant à la solution. »
**Les étapes.** Les deux réponses `cvp-ch` et `cvp-pt` s'intitulent
« Étape 1 : … » et « Étape 2 : … » et passent avant le bandeau `#cvpEtape`
(qui reste, juste au-dessus du dessin, la méthode de l'étape en cours) ; les
boutons « ⇄ Retourner » descendent sous le dessin (`#cvpOutils`). Une étape
EFFECTUÉE prend `cvp-fait` (`cvpFaits`, la recette de `cpsFaits`) : cadre,
encre et fond verts, coche — l'étape 1 dès que les flèches sont bout à bout
depuis le point (`cvpBoutABout`, le geste, pas sa justesse), l'étape 2 dès
que le point est posé ; recliquer le nœud la rend. Une étape marquée ok, bad
ou sol par la vérification garde son verdict ; `cvpCasesPeindre` retire la
marque. **La croix.** Le rond `.dot` des cibles ne se montre plus ; une croix
(`.crx`) est dessinée par `cvpCroix`, dans le calque `#cvpCroix`, sur le seul
nœud posé (bleu, ou bleu juste, rouge faux) et sur le point attendu de la
correction (vert) — jamais une croix cachée dans chacun des 117 nœuds : au
8.1.6, 97 croix cachées saturaient la mémoire du banc principal ; le rond du survol (`.vec-t:hover .dot`, blanc liseré bleu) n'existe
plus sur cet écran, et le point qui suit la souris (`#cvpCurseur`) est lui
aussi une croix bleue. Le 8.2.8, qui partage la classe `cvp-curseur`, garde
son rond : la demande ne portait que sur le 8.2.9. **Le vecteur solution.**
À la vérification, toujours — juste ou faux —, `cvpVecteurSol` trace en vert
la flèche du point donné au point attendu, nommée « BB′ » du côté le plus loin
de la construction (`svcCoteDehors`), dans son propre calque `#cvpSol` :
`#cvpCorr` ne porte toujours que ce qui MANQUAIT, et les contrôles qui le
veulent vide sur une copie juste n'ont pas bougé. Le juge vérifie l'ordre
(étapes, bandeau, dessin), les intitulés, aucune étape verte au départ,
l'étape 1 seule verte une fois les flèches bout à bout, l'étape 2 verte au
point posé et rendue au point retiré, plus de marque sous le verdict, 117
croix et aucun rond, le vecteur BB′ tracé et nommé sur la copie vide comme
sur la juste. Le banc navigateur (6 quadragies septies) mesure les étapes
au-dessus du dessin, le fond de l'étape faite différent de l'étape à faire,
aucun rond visible au survol d'un nœud, la croix du point posé visible, le
point qui suit la souris centré sur elle, et le vecteur solution tracé.

**Puis les cadres blancs sont partis : les étapes SONT les bandeaux bleus, l'étape 2 vient sous l'étape 1, et le vecteur de l'élève se trace (v519)**
La demande (Turquet, octobre 2026) : « dans le 8.2.9, garder uniquement les
encadrés en bleu qui donnent les étapes, tu peux supprimer les cadres blancs
avec étape 1 et étape 2. Quand l'étape 1/2 est réussie mettre ce cadre en
vert et ajouter le cadre de l'étape 2/2 en dessous ; quand l'étape 2 est
réussie, mettre le cadre correspondant en vert. Quand l'élève place le point
d'arrivée tracer aussi le vecteur qui va du point de départ au point
d'arrivée. Une fois le point placé, ne plus afficher de point au bout de la
flèche de la souris. »
**Les étapes.** Le bandeau unique `#cvpEtape` n'existe plus, ni les cadres
`tvg-cons` : les deux réponses notées `cvp-ch` et `cvp-pt` SONT les bandeaux
bleus (`cvp-etape pts-case`, écrits par `cvpEtapesHTML`), dans `#cvpBody`,
juste au-dessus du dessin. L'étape 2 est cachée (`style.display`, pas
l'attribut `hidden`, qu'un `display` d'auteur écraserait) tant que les
flèches ne sont pas bout à bout depuis le point — sauf si un point est déjà
posé, à la correction, ou si elle porte un verdict : une réponse notée ne se
cache jamais (`cvpConsigne`). Une étape effectuée prend `cvp-fait`, vert ; la
vérification la peint ok bleu, bad rouge, sol vert, par le liseré et le fond
du bandeau (`#scr-cvp .cvp-etape.ok/.bad/.sol`).
**Le vecteur de l'élève.** `cvpVecteurEleve` trace BB′ du point donné au
point posé, dans son calque `#cvpEl` (au-dessus de `#cvpSol`) — la recette
du 8.2.8 : violet (`cvp-aa`, `--crd-a`) et nommé avant le jugement, puis bleu
(`svc-e`) ou rouge (`svc-eb`) comme la croix du point, sans nom à la
correction : le nom « BB′ » passe au vecteur solution vert, dessous. Il est
redessiné par `cvpCroix` (chaque marquage) et `cvpDessinerFleches` (le côté
du nom suit les flèches). **Le point qui suit la souris** se cache dès que
B′ est posé (`!q.sel` dans le garde du curseur, et `cvpPose` le masque
aussitôt) ; retirer B′ le fait revenir. Le juge vérifie aucun cadre blanc,
l'étape 2 cachée au départ puis montrée SOUS l'étape 1, montrée après la
correction, BB′ violet et nommé au point posé, effacé au point retiré, bleu
sans nom sur la copie juste, rouge sur la fausse, le curseur caché ; le banc
navigateur (6 quadragies septies) mesure l'étape 2 sans hauteur au départ,
puis entre l'étape 1 et le dessin, le curseur caché et le vecteur visible au
point posé, et l'étape 2 verte comme l'étape 1.

**Puis l'étape 2 a attendu l'étape 1 : plus de point posé avant les flèches bout à bout (v521)**
La demande (Turquet, octobre 2026) : « en seconde dans le 8.2.9 on ne peut
pas réaliser l'étape 2 avant l'étape 1. » Le bandeau de l'étape 2 était
caché, mais le geste ne l'était pas : un clic sur un nœud, ou n'importe où
dans le quadrillage, posait B′ dès la première seconde — et le bandeau
caché réapparaissait (`q.sel` le montre). `cvpPose` refuse désormais de
POSER un point tant que `cvpBoutABout` est faux ; RETIRER un point déjà posé
reste permis. Un point posé à l'étape 2 reste posé si l'élève déplace
ensuite ses flèches : le juge garde le cas « construction hors de B, B′
juste » (1 sur 2), joué désormais dans cet ordre-là. Le juge vérifie qu'un
clic avant les flèches ne pose rien, ne trace aucun vecteur et laisse
l'étape 2 cachée ; le banc navigateur (6 quadragies septies) clique le
quadrillage à la souris avant tout glisser et mesure que rien n'est posé.

**Puis les deux étapes se sont montrées dès le départ, chacune dans son encadré, et le cadre bleu passe de l’une à l’autre (v528)**
La demande (Turquet, octobre 2026) : « dans le 8.2.9 il faudrait afficher
les étapes 1 et 2 par un encadré, l'étape 1 ayant un fond bleu au départ et
l'étape 2 un fond blanc au départ. Quand l'étape 1 est réalisée, le cadre de
l'étape 1 passe en vert et celui de l'étape 2 en bleu. Quand le 2 est
réalisé, c'est le cadre 2 qui passe en vert. » Le bandeau à liseré gauche
devient, sur cet écran seulement (`#scr-cvp .cvp-etape` — le 8.1.7 partage
la classe `cvp-etape` et n'a pas bougé), un cadre de 2 px tout autour, blanc
liseré gris. L'étape 2 ne se cache plus : elle est là, blanche, sous l'étape
1 dès le départ. `cvpFaits` pose `cvp-cours` (cadre et fond bleus) sur la
première étape non faite : l'étape 1, puis l'étape 2 dès les flèches bout à
bout ; les deux faites, plus aucune. Une étape portant un verdict ne la prend
pas, `cvpCasesPeindre` la retire, et `cvpConsigne` l'efface une fois la
question verrouillée. Le verrou du v521 reste : l'étape 2 se VOIT dès le
départ, mais aucun point ne se pose avant l'étape 1. Flèches déplacées après
le point posé : l'étape 1 redevient bleue, l'étape 2 reste verte. Le juge
vérifie les deux étapes visibles au départ, l'étape 1 seule en cours, le
cadre bleu passé à l'étape 2 aux flèches bout à bout, plus aucune étape en
cours au point posé ni après la correction ; le banc navigateur (6
quadragies septies) mesure le fond bleu de l'étape 1 et blanc de l'étape 2
au départ, l'étape 2 sous l'étape 1, son fond devenu bleu une fois l'étape 1
faite. **Piège de banc rencontré** : l'action a rougi deux fois de suite
sur le 8.1.6 (6 quadragies ter), que ce changement ne touche pas — « avant le
choix, le point ne suit pas la souris : caché », vert en local. Le contrôle
posait la souris entre deux nœuds à côté du point attendu, TIRÉ au hasard :
près du bas du dessin, la souris peut tomber hors du quadrillage (sous les
commandes flottantes), et aucun `pointermove` n'atteint `#vepGraph`. Il la
pose désormais au milieu du quadrillage, et son message nomme l'élément sous
la souris s'il rougit encore.

**Puis l'étape 1 n'a plus été validée par le seul geste : bout à bout, mais avec les bons vecteurs (v531)**
La demande (Turquet, octobre 2026) : « en seconde dans le 8.2.9 ne pas
valider l'étape 1 si l'élève a mis les vecteurs bout à bout et que ce ne
sont pas les bons vecteurs. » Jusque-là, `cvpBoutABout` (le GESTE, sens des
flèches ignoré) faisait l'étape 1 : u⃗ + v⃗ posés bout à bout depuis B pour
BB′ = u⃗ − v⃗ passaient au vert et ouvraient l'étape 2. L'étape 1 est
désormais faite quand `cvpEtape1` est vrai — `cvpChaine`, la lecture même
du juge : chaque flèche dans le sens que l'égalité demande, bout à bout
depuis le point. Ce qui en dépend a suivi : le vert et le cadre bleu
(`cvpFaits`), le verrou de l'étape 2 (`cvpPose`) et le point qui suit la
souris. Bout à bout mais dans le mauvais sens, l'étape 1 reste bleue et une
phrase rouge, sous sa consigne (`#cvpAlerte`), dit « Tes flèches sont bout
à bout, mais ce ne sont pas les bons vecteurs : relis les signes de BB′ =
u⃗ − v⃗. » — sans nommer la flèche à retourner, que seule la correction
nomme ; elle se tait une fois la question verrouillée. C'est un verdict en
direct, que le v501 évitait exprès : la demande le veut, pour cette étape
seulement. Le piège « signe oublié » du juge posait B′ après une chaîne
fausse : ce geste n'existe plus, le juge vérifie donc l'étape 1 non faite,
la phrase, et B′ refusé ; les contrôles de la croix rouge et du vecteur
rouge passent sur la question « construction juste, B′ faux », où la
phrase est aussi vue se taire quand v⃗ est retourné.

## {tracer-vecteurs-opposes} — tracer −u⃗, −v⃗, −w⃗ (8.1.8, v516)

**La demande** (Turquet, octobre 2026) : « en seconde faire un exercice comme
le 8.1.7 où on demande de tracer l'opposé de chaque vecteur. On demandera de
tracer −u ; −v ; −w dans l'énoncé. » Il prend la suite du sous-thème
« Vecteurs égaux » : 8.1.8, rien ne se renumérote.

**Le moteur du 8.1.7, pas un second.** Même écran (`scr-tvx`), même kind
`tvx`, même geste, même tirage, même barème (9). La question porte `q.op = 1`
— rangée, donc relue après une pause ; le 8.1.7 ne la porte pas, et ses
questions n'ont pas changé d'une clé. Tout ce qui diffère passe par deux
fonctions : `tvxCible(q,k)` (le chemin attendu : −w au lieu de w — le juge,
la place et la flèche de la correction) et `tvxNom(q,k)` (« −u » au lieu de
« u » — le nom des flèches de l'élève et de la correction, l'enregistrement,
les messages). L'identité suit `currentTestId`, comme au calcul mental :
`RAPPELS_ID` (`RAP_TVO`), `QIA_SUGG_ID`, `TABLES_SANS`.

**L'énoncé** : « Trace les vecteurs −u⃗, −v⃗ et −w⃗, opposés aux vecteurs u⃗,
v⃗ et w⃗. » Les étapes : « ① Le vecteur −u⃗ tracé. » Sur le dessin, les
vecteurs donnés gardent leurs noms u, v, w ; les flèches de l'élève
s'appellent −u, −v, −w. `svcFleche` a appris ce nom : le signe moins s'écrit
DROIT devant la lettre (un `tspan` `svc-nom-op`, comme le « + » de « u+v »),
et la petite flèche ne coiffe que la lettre — −u⃗, jamais une flèche sur
« −u ».

**Le piège nommé** : la flèche ÉGALE au vecteur — le réflexe du 8.1.7 —
est fausse : « Ta flèche −u est égale à u : même direction, même longueur,
mais il fallait le sens contraire. » La phrase du chemin dit les deux : « u
fait 3 carreaux vers la droite puis 4 vers le haut ; −u fait donc 3
carreaux vers la gauche puis 4 vers le bas ; ta flèche fait … ». Le soutien
ajoute « — puis fais ce chemin à l'envers ». Le contexte du modèle décrit la
consigne et la méthode des opposés.

**Le banc** (`tracerVecteursOpposes`, banc principal) ne rejoue pas le geste,
tenu par celui du 8.1.7 et par le banc navigateur, mais ce qui CHANGE : la
place (8.1.8, voisins immobiles), le rappel et les questions à l'IA par
identifiant, `q.op` rangé (et absent du 8.1.7), l'énoncé −u, −v, −w, les noms
des flèches avec leur petite flèche, la copie juste (trois chemins à
l'envers, après un passage par le JSON de la pause), le vecteur égal faux et
nommé, la flèche verte de −u partie du départ de l'élève vers la gauche, la
réponse enregistrée, le contexte du modèle, et le 8.1.7 qui reste le 8.1.7.

**Puis le cadre à faire est passé en bleu (v521).** La demande (Turquet,
octobre 2026) : « en seconde dans le 8.1.8, mettre en bleu le cadre que l'on
doit réaliser sur le dessin ». La recette de `cps-cours` (8.2.8) : le cadre
de la flèche à tracer prend `tvx-cours` — liseré et fond bleu clair —, posé
par `tvxFaits` sur la première flèche sans arrivée (`tvxCourante`), ou sur
celle dont une extrémité est reprise (`test.tvxMob`), qui quitte alors son
vert « tracé ». Les trois tracées, aucun cadre n'est bleu ; la vérification
l'efface (`tvxPeindre`), et la règle ne nomme aucune classe de verdict :
« 9 bis » ne la lit pas. Même écran, même moteur : le 8.1.7 l'a aussi. Le
banc principal suit le bleu (100, 010, 000, 100 à la reprise de u, 000 une
fois vérifié) ; le banc navigateur mesure le fond bleu calculé du cadre ②
une fois u tracé.

## {somme-vecteurs-libre} — la somme de deux vecteurs, sans étapes (8.2.10, v522)

**La demande** (Turquet, octobre 2026) : « faire le même exercice que le
8.2.1 en seconde, mais sans afficher les étapes et sans afficher début et fin
sur les vecteurs. » Ajouté en dernier du sous-thème « Somme de vecteurs » :
8.2.10, rien ne se renumérote.

**Le moteur du 8.2.1, pas un second** — la recette du 8.1.8. Même écran
(`scr-svc`), même kind `svc`, même tirage, même geste. La question porte
`q.libre = 1`, rangé, donc relu après une pause ; le 8.2.1 ne le porte pas
et ses questions n'ont pas changé d'une clé. Rappel et questions à l'IA sont
ceux du kind (`RAP_SVC`, `QIA_SUGG.svc`) : la méthode est la même.

**Ce qui disparaît.** Les deux cadres « Étape 1 / Étape 2 », le passage
automatique de l'une à l'autre (`svcAuto`, `svcVersB`, `svcVersA` ne font
rien sur une question libre), le figeage des flèches mises bout à bout, le
vert « étape faite », les mots « début » et « fin » sur les flèches (et le
mot double « fin / début » d'une jonction), et la phrase « Un début va sur
une fin » de l'énoncé. L'énoncé dit seulement « Voici deux vecteurs u⃗ et v⃗
sur un quadrillage », le geste en petit dessous ; la consigne « Construis le
vecteur u⃗ + v⃗ » est la seule `pts-case`.

**Glisser ET tracer, toujours.** `svcPeutGlisser(q)` et `svcPeutTracer(q)`
remplacent les tests sur `q.et` : sur une question libre, les deux sont
vrais à tout moment, dans l'ordre que l'élève veut ; le point et la flèche
qui suivent la souris restent ceux du 8.2.1. `q.et` n'existe pas sur une
question libre (`renderSvc` le retire).

**Une seule réponse notée : la flèche u⃗ + v⃗** (`svcCases` rend
`['svc-sm']`, barème 8 pour 8 questions). Le chaînage est le CHEMIN, pas la
réponse : sans étape 1 affichée, il n'a plus de case où se peindre. Il reste
jugé (`svcJuge` inchangé) pour deux choses seulement : nommer l'erreur
(`svcPourquoi` — deux débuts, deux fins, pas bout à bout) quand u⃗ + v⃗ est
fausse, et tracer en vert, à la correction, le second vecteur recopié quand
les flèches n'étaient pas bout à bout. `svcNotees` filtre ce qui compte ; une
u⃗ + v⃗ juste tracée sans avoir bougé les flèches vaut le point.

**Le banc** (`sommeVecteursLibre`, banc principal) ne rejoue pas ce que tient
celui du 8.2.1, mais ce qui CHANGE : la place (8.2.10, voisins immobiles),
`q.libre` rangé (et absent du 8.2.1), aucun « Étape », aucun « début » /
« fin » sur le dessin ni dans l'énoncé, pas de `svc-ch`, les deux prises,
le bouton « Vérifier » seul ; la copie vide (sol, construction verte, « Il te
manquait 1 case », 0 sur 1) ; un clic qui commence u⃗ + v⃗ AVANT tout glisser,
v⃗ qui glisse ensuite, rien ne se fige à la mise bout à bout ; la reprise
après JSON ; u⃗ + v⃗ juste sans chaînage (1) ; u⃗ + v⃗ à l'envers (nommé,
correction verte) ; le soutien ; le contexte du modèle ; et le 8.2.1 qui
garde ses étapes et ses mots. Le glisser au doigt et à la souris est celui
du 8.2.1, tenu par son banc navigateur (« 6 quadragies quater »).

## {translation-pavage} — l'image d'un triangle dans un pavage (8.1.9, v526)

**La demande** (Turquet, octobre 2026). Claude avait proposé onze idées
d'exercices sur les vecteurs égaux, la translation et Chasles ; Turquet a
retenu la première : « fais l'exercice 1 avec le pavage ». C'est la FIGURE
ENTIÈRE qui glisse : le reste du thème ne déplaçait que des points. Ajouté en
dernier du sous-thème « Vecteurs égaux » : 8.1.9, rien ne se renumérote.

**Le pavage est un réseau, pas un dessin.** Deux vecteurs de base, e1 = (1, 0)
et e2 selon la forme, 5 × 3 parallélogrammes, chacun coupé en deux triangles
par une diagonale. Un triangle se repère par (i, j, t) : sa case et sa moitié.
Une translation d'un vecteur du réseau (a, b) envoie (i, j, t) sur
(i + a, j + b, t), c'est-à-dire sur la MÊME moitié. C'est ce qui sépare
l'image de son voisin retourné, le piège de l'exercice.

Trois formes (`TPV_PAVAGES`) :
- des triangles équilatéraux ;
- un quadrillage coupé, en triangles rectangles ;
- des triangles quelconques.

La pente des côtés obliques peut changer de sens (`sx`), la diagonale peut
changer de côté (`dg`), sauf pour l'équilatéral.

**Les numéros suivent l'ordre de lecture**, la bande du haut d'abord : l'élève
trouve « le triangle 17 » sans fouiller. **Les lettres sont les seize nœuds du
contour**, dans l'ordre du tour (`TPV_LETTRES`, sans I, O ni Q), et A part de
l'un des quatre coins (`d0`). Posées dehors, le long de la normale sortante
de leur côté (la somme des deux normales à un coin), elles ne recouvrent ni un
trait ni un numéro.

**Quatre lignes par pavage** (`TPV_PLAN`), barème 4 :
- trois images à trouver, avec deux tournures : « l'image du triangle 15 par la
  translation de vecteur SC est le triangle … » et « la translation qui
  transforme B en G transforme le triangle 22 en le triangle … » ;
- un vecteur à trouver : « la translation qui transforme le triangle 11 en le
  triangle 5 a pour vecteur … ». Tout couple de lettres qui fait le bon chemin
  est juste (`tpvVecsDe`), et la correction écrit le premier.

Deux lignes n'ont jamais le même déplacement, ni des déplacements opposés. Un
triangle ne sert qu'une fois dans le pavage, comme départ ou comme image. La
première image a toujours une composante le long des côtés obliques : glisser
seulement à l'horizontale ne demande pas de lire le pavage. Le départ est pris
de préférence là où l'image à l'envers existe aussi, pour que le piège du sens
soit posable. Trois pavages par séance (`TPV_NB`, `dmNbQuestions`), barème 12.

**Les pièges nommés** (`tpvPourquoi`, sur la première case fausse) :
- le triangle de DÉPART recopié ;
- l'image À L'ENVERS : « tu as fait glisser dans le sens contraire » ;
- le triangle RETOURNÉ : à la bonne place mais pas dans la bonne orientation,
  car « une translation fait glisser la figure sans la tourner » ;
- un numéro hors du pavage ;
- sinon, le chemin dit avec les côtés du pavage (`tpvChemin` : « 2 côtés vers
  la droite le long des côtés horizontaux, puis 1 côté vers le bas le long des
  côtés obliques »).

Pour le vecteur : écrit à l'envers, menant ailleurs, ou illisible.

**Le dessin montre une ligne à la fois** (`tpvMontrer`). La ligne choisie (par
le focus de sa case ou un clic) prend un liseré violet. Son triangle de départ
prend un fond violet, le vecteur de l'énoncé une flèche violette entre ses deux
lettres, et le numéro tapé un fond violet clair. Une fois la page VERROUILLÉE
par la vérification :
- l'image juste est bleue, la fausse rouge, la correction verte ;
- une flèche verte va d'un triangle à l'autre.

En soutien, rien ne se révèle : la condition est `test.locked`, pas la classe
de la case, que la correction en direct pose aussi. Après la vérification, la
première ligne fausse est montrée. Les numéros portent un halo blanc
(`paint-order:stroke`) : les flèches les traversent sans les effacer.

**Un clic sur un triangle écrit son numéro** (`tpvClicTri`) dans la case de
la ligne montrée. Si cette ligne attend un vecteur, le numéro va dans la
première case d'image libre. Les cases d'image sont `inputmode="numeric"`, donc
servies par le pavé sur tablette ; la case du vecteur porte sa flèche en CSS
(`.tpv-vc`, le dessin de `.vgt-vec`).

**On range la forme, les lettres et les lignes** (`pav`, `dg`, `sx`, `d0`,
`lignes`), jamais les réponses : `tpvLigne` recalcule l'image, l'image à
l'envers, le retourné et les vecteurs justes.

**Le banc** (`translationPavage`, banc principal) a un juge qui ne lit PAS le
réseau de la page. Il relit le DESSIN : les sommets de chaque polygone, le
numéro écrit DEDANS, la place de chaque lettre (le point dessiné le plus
proche de son étiquette). Il fait ensuite glisser les sommets du triangle de
départ du chemin d'une lettre à l'autre, et cherche le polygone qui tombe
dessus.

Ce qu'il vérifie :
- **sur 120 séances**, chaque image, chaque image à l'envers et chaque liste
  de vecteurs justes recalculées depuis le dessin ; les trois formes sorties ;
  le plan des lignes ; aucun déplacement répété ni opposé ; aucun triangle
  servi deux fois ; la première image en biais ;
- **sur un pavage fixe** (quadrillage, A au coin bas gauche) : les tournures ;
  la copie juste avec le second vecteur juste en minuscules (4/4) ; les sept
  pièges peints en rouge et nommés ; le badge vert ; le dessin de la ligne
  fausse (départ violet, correction verte, réponse rouge, flèche verte) ; la
  case vide en correction ; la copie vide sans rouge ; le clic dans la ligne
  montrée puis vers la première case libre ; le redessin après le JSON ; le
  soutien qui peint sans révéler ni verrouiller ; le contexte du modèle.

**Le juge lit le SVG comme du TEXTE** (`tpvSvg(q)`), sans le poser dans le
DOM. La première version redessinait les 360 pavages dans jsdom : verte sur
la machine de travail, elle a épuisé les 4 Go du banc de l'action (« heap out
of memory »). Seul le pavage fixe est relu à l'écran.

Trois sabotages ont été attrapés :
- l'image remplacée par son retourné : « la page dit 27, le dessin 28 » ;
- le mot « RETOURNÉ » retiré du message ;
- le dessin jugé en soutien.

## {vrai-faux-vecteurs} — vrai ou faux sur une figure à pièges (8.1.10, v529 — v528 prise par le 8.2.9)

**La demande** (Turquet, octobre 2026). Parmi les idées d'exercices proposées
sur les vecteurs égaux, Turquet a retenu l'idée n° 4 : « vrai ou faux sur une
figure à pièges ». Une figure, une dizaine d'égalités de vecteurs à juger ;
les fausses sont tirées EXPRÈS parmi trois pièges, et la correction nomme le
critère qui manque. Ajouté en dernier du sous-thème « Vecteurs égaux » :
8.1.10, rien ne se renumérote.

**Les trois pièges** (`VFH_PIEGES`) sont les trois critères de l'égalité, pris
un par un : deux vecteurs qui ont tout en commun SAUF
- la DIRECTION (même longueur, droites non parallèles) ;
- le SENS (même direction, même longueur : des vecteurs opposés) ;
- la LONGUEUR (même direction, même sens).

Deux vecteurs qui n'ont rien en commun ne sont jamais posés : « faux » se
verrait sans réfléchir. `AB = BA` non plus : le sens se lirait dans les
lettres, pas sur la figure. De 3 à 5 égalités sont vraies (`VFH_VRAIES`), les
autres se partagent entre les trois pièges, chacun au moins une fois. Dix
égalités par figure (`VFH_L`), un vecteur n'y sert qu'une fois.

**Trois figures** (`VFH_FIGURES`), une de chaque par séance de trois :
- un hexagone régulier ABCDEF de centre O, ses côtés et ses six rayons — le
  quart de tour (`rot`), le sommet de A (`k0`) et le sens des lettres
  (`sens`) se tirent ;
- une frise de trois losanges, d'angle 60° ou 72° (`ang`) ; les lettres du
  haut vont de gauche à droite ou font le tour (`lt`) ;
- quatre parallélogrammes accolés, chacun coupé par une diagonale. Le côté
  oblique (1,2 ; 1,6) et la diagonale (−1,2 ; 1,6) ont la même longueur : en
  miroir l'un de l'autre, c'est le piège de la direction. Sans cette
  diagonale, un réseau de parallélogrammes quelconques n'a AUCUN couple de
  même longueur et de directions différentes — le piège n'était pas posable.

Les retournements (`fx`, `fy`) s'ajoutent partout. Rien de tout cela ne
change une égalité, seulement l'image.

**Le verdict se calcule sur les coordonnées** (`vfhCat`) : colinéaires
(produit en croix nul), même sens (produit scalaire positif), même longueur,
au millionième. On range la figure et les couples de vecteurs, jamais les
réponses : `vfhLignes` recalcule le verdict.

**La case est une liste « ? / Vrai / Faux »** (`itvSelHTML`, `TVF_OPT_VF`,
celle du 2.x vrai-ou-faux) : `corrChoix` la peint, met « Faux » en badge vert
à côté d'une réponse fausse, et remplit en vert une liste laissée sur « ? ».

**La correction nomme le critère** à deux endroits :
- sous CHAQUE égalité, une fois la page verrouillée (`vfhNote`) : « Vrai :
  même direction, même sens, même longueur. » ou « Faux : pas le même
  sens. » ;
- dans le message, sur la première ligne fausse (`vfhPourquoi`) : le critère
  en capitales ; pour le sens, le vecteur qui AURAIT été égal (« c'est le
  vecteur ED qui est égal au vecteur AB ») ; pour la longueur, le rapport
  quand il est entier (« 2 fois plus court ») ; pour une vraie jugée fausse,
  le parallélogramme PQSR — sauf s'il est aplati (OA = DO : O, A, D
  alignés), où il n'en nomme aucun.

**Le dessin montre une ligne à la fois** (`vfhMontrer`, au focus de la liste
ou au clic sur la ligne). Le premier vecteur est violet (`--crd-a`), le
second ambre (`--crd-b`), dans la ligne comme sur la figure. Avant la
vérification, RIEN sur la figure : la ligne prend son liseré, et c'est tout.
(Jusqu'à la v530, des anneaux entouraient ses quatre points ; Turquet les a
retirés en octobre 2026 : « ne pas mettre de rond autour des points de la
figure quand on clique sur une case réponse ». Le banc clique sur une case
et exige `#vfhFl` vide.) Une fois la page VERROUILLÉE, les deux
flèches (la seconde en tirets), et la première ligne fausse est montrée. En
soutien, rien ne se révèle : ni flèche, ni note — la condition est
`test.locked`.

**Les lettres se posent dans le plus grand angle libre** entre les traits qui
partent de leur point : dehors pour un point du contour, entre deux rayons
pour O, au-dessus du point du milieu des parallélogrammes. Une seule règle,
aucune place écrite à la main.

**Le banc** (`vraiFauxVecteurs`, banc principal) a un juge qui ne lit PAS les
coordonnées de la page. Il relit le SVG comme du TEXTE (la leçon du 8.1.9 :
jamais des centaines de figures dans jsdom) : les ronds, les lettres (le rond
le plus proche), les traits ; puis il classe chaque égalité d'après les
pixels, à 1 % près. Ce qu'il vérifie :
- **sur 150 séances** : le verdict de chaque égalité recalculé sur le dessin ;
  jamais une égalité sans rien de commun ; de 3 à 5 vraies ; les trois
  pièges présents ; aucun vecteur servi deux fois ; jamais `AB = BA` ; une
  figure de chaque forme par séance ; les deux orientations de l'hexagone ;
  chaque lettre à 9 px au moins de tout trait ;
- **sur un hexagone fixe** : les dix verdicts lus sur le dessin ; la copie
  juste (10/10) ; les notes qui nomment direction, sens et longueur ; les
  quatre pièges peints en rouge et nommés (avec « vecteur ED », « 2 fois plus
  court », « ABDE est un parallélogramme ») ; aucun parallélogramme nommé
  pour OA = DO ; le badge « Faux » ; rien sur la figure avant, les flèches après ;
  la case vide en correction ; la copie vide sans rouge ; le redessin après
  le JSON ; le soutien qui peint sans révéler ni verrouiller ; le contexte
  du modèle.

Quatre sabotages ont été attrapés :
- l'égalité « même direction, même sens, autre longueur » attendue Vrai par
  la page : « los : EH = EF attend V » ;
- le piège du sens compté vrai : le tirage ne trouve plus ses égalités, et le
  banc le dit ;
- la note de correction réduite à « Faux. » ;
- les flèches tracées avant la vérification : le soutien révèle, et le banc
  le dit deux fois.

## {chasles-inserer-point} — Chasles : insérer un point (8.2.11, v530 — v528 puis v529 prises par le 8.2.9, le 8.1.10 et le 8.2.5 pendant la rédaction)

**La demande** (Turquet, octobre 2026). Parmi les idées d'exercices proposées
sur les vecteurs, Turquet a retenu la neuvième : « Chasles : insérer un
point », le sens INVERSE des 8.2.2 à 8.2.7. Là, on réduisait une somme en un
seul vecteur ; ici, on DÉCOMPOSE un vecteur. Ajouté en dernier du sous-thème
« Somme de vecteurs » : 8.2.11, rien ne se renumérote.

**Quatre formes de ligne** (`CHI_FORMES`, le plan `CHI_PLAN` = l, m, e, m, d) :
- `l` — AC⃗ = A…⃗ + …C⃗ : un point LIBRE, une case d'une lettre sous chaque
  flèche ; juste dès que les deux cases portent le même point ;
- `m` — AC⃗ = …B⃗ + B…⃗ : le point B est IMPOSÉ, l'élève écrit le début et
  la fin ; le piège est le chemin à l'envers (CB⃗ + BA⃗ = CA⃗) ;
- `e` — AC⃗ = …⃗ + …⃗ « en passant par B » : les deux vecteurs entiers ; le
  piège de la demande, AC⃗ = AB⃗ + CB⃗, se nomme (« CB part de C : […] AC = AB
  + BC, pas AB + CB ») ;
- `d` — AB⃗ = A…⃗ + …⃗ + …B⃗ : deux points insérés (une lettre, un vecteur,
  une lettre).

Onze cases par page. **Une page sur deux a une figure** : la première, celle
du 8.2.2 (`chsPoints`, `chsSvg` — rectangle, carré, parallélogramme ou
losange, et le centre), la seconde des points quelconques, sans dessin
(`q.f`). `CHI_NB` = 2 pages, barème 22 ; `dmNbQuestions` allonge la séance en
alternant. Deux exercices partagent le dessin, pas l'identité (kind `chi`,
écran `scr-chi`, `RAP_CHI`, `QIA_SUGG.chi`, `ctxChi`).

**Toute égalité juste est acceptée.** Le juge ne compare pas des lettres
attendues : `chiSolutions()` énumère toutes les façons de remplir les cases
qui rendent l'égalité vraie — par les déplacements de la figure, ou, sans
figure, en lisant XY⃗ comme Y − X (deux vecteurs n'y sont égaux que s'ils ont
les mêmes lettres). Sur la figure, AB⃗ = …E⃗ + E…⃗ s'écrit AE⃗ + EB⃗ mais aussi
DE⃗ + EC⃗ (DC⃗ = AB⃗) ; le point libre peut être n'importe quel point (même A :
AA⃗ + AC⃗ est vrai). « En passant par B » ajoute une seule exigence : le
premier vecteur arrive en B, le second en part. Chaque case se juge contre
les écritures qui restent possibles après les cases JUSTES qui la précèdent
(la règle du 8.2.3) : dans AB⃗ + CB⃗, AB reste bleu. La correction écrit la
décomposition par le point attendu (`p`, rangé) quand elle garde les cases
justes, une autre écriture juste sinon. Le badge vert d'une case fausse sort
de la flèche et écrit le vecteur ENTIER (une case d'une lettre, seule, n'en
disait pas assez).

**On range la figure, les lettres et les lignes** (`f`, `fig`, `fx`, `fy`,
`n`, `lignes` : `t`, `v`, `p`), jamais les réponses.

**Ce qui a été décidé sans demander** (la consigne était de ne pas demander) :
l'ordre des quatre formes, deux `m` par page (le piège du sens est le plus
fréquent), la figure du 8.2.2 plutôt qu'une nouvelle, et un point libre qui
peut être une extrémité du vecteur (l'égalité est vraie : la refuser
contredirait « toute décomposition juste est acceptée »).

**Le banc** (`chaslesInsererPoint`, banc principal) a un juge INDÉPENDANT :
sur une page à figure il relit les points sur le DESSIN (le SVG comme du
texte, jamais posé dans le DOM — la leçon du 8.1.9 et des 4 Go de l'action) ;
sans figure, il donne à chaque lettre des coordonnées quelconques dans
l'espace. Sur 300 séances : chaque correction relue, le plan, la figure en
première page et aucune en seconde, aucune lettre répétée dans une ligne,
aucun vecteur demandé deux fois, chaque forme de figure tirée ; et, une
séance sur dix, l'ensemble des écritures que la page accepte comparé à celui
que le juge trouve, case par case. Puis par le bouton, sur une page fixe à
figure : 11 cases, la copie juste, d'autres écritures justes en minuscules
(E, DE + EC, AE + EC + CB), AB + CB (rouge, AB bleu, « pas AB + CB », badge
BC hors de la flèche), le chemin à l'envers, le point qui ne se répète pas,
le premier vecteur qui n'arrive pas en B, une lettre hors de la figure, deux
points qui ne s'enchaînent pas, la case vide (correction), la copie vide
(aucun rouge), la reprise après JSON, le soutien qui peint sans révéler ; et
sur une page fixe SANS figure : aucun dessin, une copie juste à points libres
(Q, A, B), deux pièges ; enfin le contexte du modèle.

## {demontrer-parallelogramme} — démontrer qu'un quadrilatère est un parallélogramme (8.2.12, v532 — numéro et versions pris en route : 8.2.11 par {chasles-inserer-point}, v528 à v531 par les retouches du 8.2.9, du 8.1.10, du 8.2.5 et du 8.2.8)

**La demande** (Turquet, octobre 2026, idée n° 11 parmi celles proposées) :
une égalité vectorielle entre quatre points, qui se SIMPLIFIE par Chasles
jusqu'à une égalité du type AB = DC, des étapes à trous, puis le NOM du
parallélogramme — ABCD, jamais ABDC : le piège de l'ordre des lettres, déjà
nommé au 8.1.6. Ajouté en dernier du sous-thème « Somme de vecteurs » :
8.2.12, rien ne se renumérote. Pas de figure : tout se lit sur les lettres.

**La question range le tour et les formes, jamais les réponses.** `t` est le
tour du parallélogramme (une permutation des quatre lettres W X Y Z : la
démonstration aboutit à WX = ZY) ; `f` la forme de l'énoncé ; `g` et `d` les
deux membres (un type et ses lettres intermédiaires) ; `sw` échange les
membres à l'écran ; `r` est le vecteur retiré. Les étapes (`dpaLignes`) et
les réponses (`dpaCases`) se recalculent.

Trois formes :
- `egal` : membre = membre, chacun d'un type — `seul` (déjà un vecteur),
  `c2` (PT + TQ), `c3` (PT + TS + SQ), `ordre` (TQ + PT : on change
  l'ordre), `moins` (PT − QT : soustraire, c'est ajouter l'opposé), `nul`
  (PQ + RS + SR : le vecteur nul) ;
- `zero` : AB + CD = 0, la ligne « On retire CD aux deux membres : AB = − CD
  = … » ;
- `retire` : un même vecteur ajouté aux deux membres. Il n'est ni un vecteur
  déjà écrit, ni son opposé, et ne s'enchaîne avec AUCUN terme de l'égalité
  (le sens compté) : NM + ML = LN − KN + ML proposait Chasles (NM + ML = NL)
  au lieu du retrait, et le premier tirage le sortait.

Le plan d'une séance (`DPA_PLAN`, `DPA_NB` = 4, `dmNbQuestions`) : Chasles
simple, puis l'ordre ou la soustraction, puis le zéro ou le retrait, puis un
mélange avec le vecteur nul. Une case = un point ; le barème varie donc avec
le tirage (de 2 à 6 cases par question).

**Chaque tirage est VÉRIFIÉ par la page** (`dpaVerifie`) : chaque case
attendue est un vrai vecteur, chaque membre écrit avec ses bonnes cases vaut
son départ, et l'hypothèse revient exactement à WX = ZY (sa combinaison de
points vaut ±(X + Z − W − Y)). Un tirage refusé est retiré.

**Le juge lit le calcul.** Sans figure, XY vaut Y − X ; une case est juste
dès que sa combinaison est celle qui manque à son membre (AA, BB ou 0 pour le
vecteur nul, en minuscules si l'on veut). Seule l'étape qui CHANGE L'ORDRE
se juge lettre à lettre : ses deux cases doivent être les vecteurs de la
somme, remis pour s'enchaîner. La case de vecteur porte sa flèche en CSS
(`.dpa-vc`, posée sur la case seule) ; la correction (`mf-cor`) se réécrit
sous sa propre flèche (`dpaBadge`).

**Le nom** se juge comme au 8.1.6 : huit écritures justes (quatre départs,
deux sens), lues sur l'égalité AFFICHÉE — si l'énoncé échange les membres,
DC = AB, le nom de la correction est DCBA, et le piège DCAB.

**Les pièges nommés** (`dpaPourquoi`, sur la première case fausse) : le nom
recopié dans l'ORDRE des lettres de l'égalité (ABDC) ; un nom qui traverse ;
un nom qui n'a pas les quatre lettres ; le vecteur soustrait recopié sans
l'OPPOSÉ (− BC laissé BC) ; un résultat dans le mauvais sens ; l'ordre qui ne
s'enchaîne pas ; RS + SR pris pour autre chose que le vecteur nul ; un
vecteur retiré qui n'est pas commun aux deux membres ; un vecteur illisible ;
sinon, la relation de Chasles redite sur le membre.

Le soutien peint au fil de la saisie et à la vérification, sans révéler ni
verrouiller (`corrChoix`). Pas de bouton des tables. Le contexte du modèle
(`ctxDpa`) porte l'hypothèse, les étapes, les réponses sous clause de secret,
la méthode et le piège.

**Le banc** (`tests/verifier.js`, « démontrer un parallélogramme ») a un juge
qui ne lit PAS les réponses de la page : il relit le HTML affiché comme du
TEXTE (l'hypothèse, chaque étape — sans le poser dans le DOM, la leçon du
8.1.9), en tire les combinaisons de points, recalcule chaque case attendue,
et déduit les sommets opposés du parallélogramme des SIGNES de l'hypothèse
(deux points de même signe sont opposés) : le nom de la page doit faire le
tour, le piège doit traverser. Sur 150 séances : les trois formes et les six
types sortent, aucune question répétée, la question ne range que t, f, g, d,
sw, r. Puis par le bouton, quatre questions fixes (AC − BC = DA + AC ;
CB + AC + DB = DC + DB ; AB + CD = 0 ; DC = AB + BD + DB) : l'énoncé, les
étapes, la copie juste en minuscules, CDAB juste, BB et 0 pour le vecteur
nul, les neuf pièges peints en rouge et nommés, le badge fléché, une case
juste qui ne rougit pas pour sa voisine, la case vide en correction, la
copie vide sans rouge, le JSON, le soutien, le contexte du modèle.

Trois sabotages ont été attrapés :
- le nom de la correction remplacé par le piège : « le nom QNMP ne fait pas
  le tour », sur les séances tirées comme sur la question fixe ;
- la soustraction écrite sans l'opposé (PT − TQ au lieu de PT − QT) :
  `dpaVerifie` refuse alors tous ces tirages, et le banc le voit — « le
  membre moins ne sort jamais » ;
- le mot « ORDRE » retiré du message du piège.

Regardé dans Chromium à 1280 et à 390 px : l'hypothèse centrée sous
l'énoncé, une ligne par étape, la flèche sur chaque case, la correction
fléchée à côté de la case fausse ; sur téléphone, les membres passent à la
ligne avant un « = », jamais au milieu d'un vecteur.

**Puis le banc a rendu sa mémoire.** Le premier passage dans l'action est
tombé en « heap out of memory » : le banc de la Seconde, près de ses 4 Go,
recevait le même jour une dizaine d'exercices du thème 8. Le contrôle
redessinait l'écran à chaque copie essayée (~25 rendus, 8,3 Mo retenus) ; il
ne redessine plus que quand la question change et remet sinon les cases à
zéro — 2,9 Mo retenus, mesurés avec `--expose-gc`.

## {milieu-vecteurs-egaux} — milieux et vecteurs égaux (8.1.12, v534)

**La demande** (Turquet, octobre 2026). Parmi les idées proposées sur les
vecteurs égaux, Turquet a retenu la n° 5 : « Milieu et vecteurs égaux » — un
triangle et les milieux de ses côtés, qui découpent trois parallélogrammes ;
traduire « I est le milieu de [AB] » par une égalité de vecteurs, sans aucune
multiplication par un réel, puis écrire tous les vecteurs égaux à un vecteur
donné, comme au 8.1.3. Ajouté en dernier du sous-thème « Vecteurs égaux » :
8.1.11, rien ne se renumérote — et le numéro a changé en route : écrit en 8.1.10 et v528, l'exercice a trouvé à la fusion de `main` le 8.1.10 pris par {vrai-faux-vecteurs} (une autre session, le même jour) et la v529 avec lui ; puis la v530, prise à son tour par le 8.2.8 et le 8.2.11 pendant que l'action tournait — le contrôle « version » l'a vu. Puis la v531, prise par le 8.2.9 et le 8.1.10 retouchés. Puis la v532, prise par le 8.2.12. Le dernier arrivé prend le suivant : v533. Les détails ci-dessous ont été décidés sans
aller-retour, comme la demande le voulait.

**La figure est tirée, jamais dessinée à la main.** Quatre formes
(`VMI_FORMES` : quelconque, isocèle, rectangle, obtusangle) ; la base sur
[0 ; 1], le troisième sommet au-dessus, puis une rotation de −30° à 30°, un
miroir horizontal et/ou vertical, et les sommets permutés (le côté de la
base n'est pas toujours le premier). Un triangle dont le plus petit angle
passe sous 28° est retiré : à 24°, la première capture montrait un
obtusangle si plat que ses milieux se serraient contre les côtés. Six
lettres tirées (`VMI_LETTRES`, sans O, Q, ni W à Z) : les sommets dans
l'ordre alphabétique, les milieux aussi. `n[0] n[1] n[2]` sont les sommets,
`n[3+k]` le milieu du côté k, de `n[k]` à `n[k+1]`.

**Cinq lignes, sept cases par figure** (`VMI_PLAN`), trois figures par
séance (`VMI_NB`, `dmNbQuestions`), barème 21 :
- **le milieu** : « « I est le milieu de [AB] » s'écrit, avec les points A,
  I et B : AI = … ». La tête est AI, IB, IA ou BI ; la réponse est l'unique
  vecteur du segment qui fait le même chemin. La phrase NOMME les trois
  points : KJ est aussi égal à AI, mais c'est le parallélogramme qui le dit,
  pas le milieu — le message le dit en ces termes (`ailleurs`), plutôt que
  de compter faux une égalité vraie sans prévenir ;
- **l'équivalence** : « AI = IB équivaut à : I est le milieu du segment
  [ … ] », sur un AUTRE côté ; [AB] et [BA] sont justes, crochets tapés
  ignorés. Le milieu écrit comme extrémité est nommé (`milieu`) ;
- **le côté du triangle des milieux** : « JK = … », une case, tout vecteur
  égal est juste. Il suit le TROISIÈME côté ;
- **deux lignes « u = … = … »** comme au 8.1.3 (ordre libre, un vecteur
  écrit deux fois n'est juste qu'une fois), sur les côtés des deux premières
  lignes, dans le SENS CONTRAIRE de ce qu'elles affichent. La première
  version prenait n'importe quel sens : la capture a montré « RG = … » en
  tête de la ligne du milieu ET de la ligne « tous » — et « MB = BE », écrit
  en toutes lettres dans la ligne de l'équivalence, donnait les réponses
  d'une ligne « tous ». Le sens contraire ferme les deux.

**Les pièges nommés** (`vmiPourquoi`, sur la première case fausse) :
l'opposé (« même direction, même longueur, mais sens contraire »), le
segment entier ou le côté entier (« le milieu partage le segment en deux
moitiés », « un côté du triangle des milieux mesure la MOITIÉ du côté qui
lui est parallèle »), une autre direction, le vecteur de tête recopié (« on
cherche un AUTRE vecteur »), un doublon, une écriture illisible, et pour le
segment, le milieu pris pour une extrémité ou un autre segment.

**Le dessin** (`vmiSvg`) : les traits et les lettres du 8.3, les côtés du
triangle des milieux un peu plus fins. Une lettre de sommet se pose dans le
prolongement du centre de gravité vers le sommet — l'angle opposé par le
sommet est libre de tout trait —, une lettre de milieu le long de la normale
sortante de son côté (les côtés du triangle des milieux partent vers
l'intérieur). Un halo blanc (`paint-order:stroke`) garde les lettres lisibles
sous une flèche. La ligne choisie (focus ou clic) prend un liseré violet et
son vecteur de tête une flèche violette (les deux vecteurs pour la ligne de
l'équivalence), la saisie une flèche violet clair. Une fois la page
VERROUILLÉE : juste en bleu, faux en rouge, correction en vert ; en soutien
rien ne se révèle (la condition est `test.locked`).

**Les trois flèches rouges ont TOUJOURS la même épaisseur** (v546, demande
de Turquet sur capture) : la ligne montrée épaississait ses flèches libres
(`lsd-vu`, 4,2 contre 2,6), si bien que u⃗ et v⃗ paraissaient plus fins que w⃗
— une différence d'épaisseur qui ne veut rien dire et que l'élève cherche à
lire. L'épaississement est retiré ; le liseré violet et les flèches violettes
pointillées suffisent à dire quelle ligne est montrée. Le banc vérifie
qu'aucune règle de la feuille n'épaissit une flèche libre plus qu'une autre,
et qu'aucune ne porte de classe de plus.

**Un clic sur un point écrit sa lettre** (`vmiClicPt`) dans la dernière case
choisie, ou la première case libre de la ligne montrée : deux clics font un
vecteur, un troisième recommence la case. Chaque point porte une cible ronde
de 16 px (`circle.vmi-cible`), distincte du point dessiné (`circle.vmi-pt`).

**Le badge vert sort de la colonne.** La case d'un vecteur est, comme au
8.3, une colonne flèche + case (`.veg-v`) ; `corrChoix` pose le badge de la
correction juste après la case, donc DANS la colonne, sous elle : la
capture montrait la case soulevée et la rangée cassée. `checkVmiAnswer`
déplace le badge après la colonne.

**On range les sommets, les lettres et les vecteurs de tête** (`f`, `p`,
`n`, `lignes[].t`, `lignes[].u`), jamais les réponses : `vmiLignes`
recalcule les familles depuis les coordonnées.

**Le banc** (`milieuVecteursEgaux`, banc principal) a un juge qui ne lit PAS
les lettres de la question. Il relit le DESSIN comme du TEXTE (`vmiSvg(q)`,
la leçon du 8.1.9 : rien n'est posé dans le DOM) : la place de chaque point,
la lettre la plus proche. Il y trouve LUI-MÊME les trois milieux (un point au
milieu de deux autres), puis recalcule chaque famille de vecteurs égaux.
Sur 150 séances : six points nommés et distincts ; les milieux que l'énoncé
annonce sont ceux du dessin ; aucun angle sous 20° ; aucune lettre à moins
de 9 px d'un trait ni hors du dessin ; le plan des lignes ; la réponse du
milieu, le segment de l'équivalence, chaque famille, égaux à ceux du dessin ;
le milieu et l'équivalence sur deux côtés différents ; trois directions
différentes pour les trois dernières lignes ; aucune ligne « tous » ne
montre ni n'attend un vecteur écrit plus haut ; les quatre formes, les deux
orientations, au moins 100 jeux de lettres. Puis une figure fixe (ABC, I, J,
K), par le bouton : les phrases, la copie juste en minuscules, crochets et
désordre (7/7), dix pièges peints en rouge et nommés, le premier d'un doublon
resté bleu, le badge, les flèches rouge et verte, la case vide en
correction, la copie vide sans rouge, le clic (deux lettres, puis on
recommence), le redessin après le JSON, le soutien qui peint sans révéler ni
verrouiller, le contexte du modèle.

Cinq sabotages ont été attrapés :
- la réponse du milieu prise dans toute la famille : « la page attend JH TN,
  le dessin TN » ;
- les milieux décalés d'un côté (l'énoncé et le dessin se contredisent) ;
- le mot « OPPOSÉ » retiré du message — et ce sabotage a montré un défaut
  réel : pour IA écrit à la place de IB, le message disait « C'est AI qui est
  égal à AI » ; il dit désormais « un vecteur égal à AI va, lui aussi, de A
  vers I » ;
- les lignes « tous » remises dans le sens affiché : « la ligne de RN reprend
  RN, écrit plus haut » ;
- la correction montrée sur le dessin en soutien.
## {translation-antecedent} — retrouver un point dont on connaît l'image (8.1.12, v534)

**La demande** (Turquet, octobre 2026). C'est l'idée n° 2 de la liste proposée
par Claude : « antécédent par une translation ». C'est le chemin INVERSE du
8.1.4. Sur un quadrillage, un vecteur u⃗ est dessiné, ainsi que trois points
A′, B′, C′, images de A, B et C par la translation de vecteur u⃗. L'élève
place A, B et C d'un clic. L'exercice est ajouté en dernier du sous-thème
« Vecteurs égaux », après le vrai ou faux du 8.1.10 et les milieux du
8.1.11, fusionnés le même jour pendant que celui-ci attendait son action :
8.1.12, rien ne se renumérote.

**Le piège visé, et nommé** : suivre u⃗ depuis A′. On obtient alors l'IMAGE
de A′, pas son antécédent. Le message le dit en clair : « tu as suivi u⃗ en
partant de A′. Or c'est de A qu'on part pour arriver en A′ : depuis A′, il
faut suivre u⃗ À L'ENVERS, c'est-à-dire le vecteur −u⃗ ». Le rappel (`RAP_TAN`)
en fait son point ③, et le contexte du modèle le signale sur le point fautif
(« l'élève a suivi u au lieu de −u »).

Trois autres erreurs sont nommées (`tanPourquoi`) :
- le point posé SUR A′ : « il faut que AA′⃗ soit égal à u⃗, qui n'est pas
  nul » ;
- l'antécédent d'un AUTRE point (A posé à la place de B) ;
- sinon, le chemin de AA′ comparé à celui de u⃗, en carreaux (`vecMots`).

**Le tirage** (`tanGen`) :
- u⃗ est toujours en biais : ses deux composantes sont non nulles, et l'une
  vaut au moins 2 en valeur absolue (au plus 4) ;
- les trois points donnés et leurs trois antécédents sont à un carreau du bord
  au moins, deux à deux non voisins (Tchebychev ≥ 2), et hors de la flèche
  u⃗ ;
- le PIÈGE de chaque point (M′ + u⃗) existe sur le quadrillage : l'erreur
  doit pouvoir se faire pour pouvoir se nommer. Il ne tombe sur aucun point
  dessiné ni sur un autre piège ;
- la flèche verte de la correction (de M à M′) ne traverse aucun autre
  point.

Le quadrillage fait 16 × 10 carreaux. Quatre questions par séance (`TAN_NB`,
`dmNbQuestions`), barème 12. Chaque question prend un jeu de lettres par son
index : A B C, M N P, E F G, R S T (`TAN_NOMS`, `q.l`). Le prime s'écrit
U+2032.

**On range la figure, jamais la réponse** : `u`, `o` (l'origine de la flèche),
`im` (les trois points donnés), `l`, et `p` (les points posés, `null` tant
qu'ils manquent). `tanAnte` recalcule l'antécédent (M′ − u⃗) et `tanPiege` le
piège (M′ + u⃗), depuis les données mêmes qui dessinent la figure.

**Le geste, celui du 8.1.7 pour un point.** Un seul écouteur de clic, à
l'hôte, va au nœud le plus proche (`tanClic(i, j)`, ce que joue le banc
principal). Le clic pose le point EN COURS : le premier qui manque, ou celui
dont l'élève a cliqué le cadre (`tanChoisir`). Un clic sur un point posé le
reprend : il disparaît, son cadre redevient bleu, le clic suivant le repose.
« Effacer mes points » retire tout. La croix et la lettre du point en cours
suivent la souris (`#tanCurseur`, sans aimant) ; elles se cachent quand les
trois points sont posés, et au doigt, faute de survol.

Les choix faits sans demander, puisque l'idée était déjà retenue :
- les points se nomment par leur cadre, et non après la pose comme au 8.1.4 :
  l'antécédent de A′ s'appelle A, il n'y a rien à deviner ;
- pas de touche Échap : reprendre un point, c'est cliquer dessus ;
- le soutien ne peint pas à la pose. C'est la règle des points posés au clic
  (« vec », « tvx » : `soutienEnDirect.sans`), car peindre le nœud au moment
  de la pose dirait s'il est juste avant toute vérification.

**Les couleurs.** u⃗ et les points donnés sont en noir. Les points de l'élève
et leur cadre « en cours » suivent la recette du 8.1.7 : violet avant le
jugement, cadre bleu pour le point en cours, vert « fait » quand il est posé.
À la vérification :
- la croix juste est bleue, la fausse rouge, avec la flèche de son point à
  M′ (bleue ou rouge : c'est le vecteur MM′ de l'élève) ;
- pour chaque point faux ou manquant, le BON point en VERT et la flèche
  verte MM′ = u⃗ ;
- un cadre vide passe en `sol` et ne rougit jamais.

En soutien, les points posés se jugent à « Vérifier » (bleu, rouge), mais rien
ne se révèle et rien ne se verrouille. Un point repris perd son verdict.

**Les bancs.** Le banc principal (`translationAntecedent`) a un juge qui ne lit
PAS les données de la page. Il relit le SVG comme du TEXTE, sans le poser dans
le DOM (la leçon du 8.1.9) : les lignes du quadrillage (origine et maille), la
flèche u⃗ (dont la pointe s'arrête 3 px avant le nœud), les croix noires et
les lettres des points donnés. Il calcule ensuite lui-même M = M′ − u⃗ et le
piège M′ + u⃗.

Ce qu'il vérifie :
- **sur 150 séances** : quatre questions distinctes, le jeu de lettres de
  chaque rang, les clés rangées, aucune réponse au tirage, le JSON, chaque
  antécédent et chaque piège relus sur le dessin, la lisibilité (bord,
  voisins, flèche, piège sur le quadrillage et sur aucun point) ;
- **sur une figure fixe** (u⃗ = (3 ; 2) ; A′ (7 ; 4), B′ (12 ; 6), C′ (6 ;
  8)) : la place (8.1.12, voisins immobiles, pas de tables, rappel et
  questions à l'IA ; le 8.1.10 et le 8.1.11 voisins) ; l'énoncé `.enonce` ; le geste (pose, reprise au reclic,
  cadre choisi, retour au premier point manquant, « Effacer ») ; la reprise
  après JSON ; la copie juste (trois ok, trois croix et trois flèches bleues,
  aucune correction) ; le PIÈGE nommé « IMAGE de A′ … À L'ENVERS » avec C
  posé sur C′ (bad, ok, bad, deux points et deux flèches verts, le vert de A
  en (4 ; 2)) ; l'échange A/B nommé ; le chemin faux dit en carreaux ; la
  copie vide (trois sol, « manquait 3 cases », rien de rouge) ; le soutien
  (bad, ok, rien, sans révéler ni verrouiller, puis la copie corrigée
  acceptée) ; la réponse enregistrée et le contexte du modèle (secret,
  méthode, piège).

Le banc navigateur (« 6 quadragies nonies ») joue tout à la vraie souris :
- la croix de la souris à moins de 3 px de la pointe, avec sa lettre ;
- un clic à un cinquième de maille qui pose A au nœud ;
- la lettre qui passe à B, la croix cachée une fois les trois points posés ;
- C repris d'un clic puis reposé ;
- la copie juste (3, trois flèches bleues visibles) ;
- le piège avec deux points vides (bad, sol, sol, le message, trois points
  et trois flèches verts visibles, une flèche rouge).

**Ce qu'aucun banc ne voit** : le geste au doigt sur une vraie tablette (un
toucher pose le point, sans croix qui suit), et la lisibilité des étiquettes
quand l'élève pose un point juste à côté d'une lettre donnée.

## {demontrer-chasles} — démontrer une égalité avec Chasles (8.2.13, v535 — prévu 8.2.11 en v528 ; pendant sa rédaction, v528 à v534 ont été prises par le 8.2.9, le 8.1.10, le 8.2.5, le 8.2.8, le 8.2.12, le 8.1.11 et le 8.1.12, le 8.2.11 par {chasles-inserer-point} et le 8.2.12 par {demontrer-parallelogramme})

**La demande** (Turquet, octobre 2026). Parmi les idées d'exercices proposées
par Claude, Turquet a retenu la dixième : « Montrer que AB⃗ + CD⃗ = AD⃗ +
CB⃗ » (et d'autres égalités, tirées), une rédaction à trous, étape par
étape — chaque étape a ses cases (des vecteurs) ET sa justification à choisir
dans une liste. « Premier pas vers la démonstration ; toute écriture juste
d'une étape acceptée. » Ajouté en dernier du sous-thème « Somme de
vecteurs » : 8.2.13, rien ne se renumérote. Les détails ci-dessous ont été
décidés sans aller-retour (consigne de la demande) ; ils sont nommés pour
pouvoir être repris.

**Une démonstration est un plan** (`DCH_DEMOS`, douze plans) : le membre de
gauche, celui de droite, et les étapes — chacune une justification et, sauf la
dernière, un nombre de cases. **La dernière ligne est le membre de droite,
déjà écrit** : on sait où l'on va, on cherche comment y aller ; elle n'a que
sa justification. Six plans sur des points quelconques (AB + CD = AD + CB ;
AB + CD + BC = AD ; AB − CB = AC ; AB + BC + CA = 0 ; AB − AC + BC = 0 ;
AB + CD − AD = CB), six sur un parallélogramme ABCD (AB + AD = AC ; BA + BC =
BD ; AB + CD = 0 ; AB + CB = DB ; MA + MC = MB + MD, la plus longue, cinq
étapes ; MA + DC = MB). Les lettres se renomment (`q.n`, sans I, O ni Q :
le O se lirait 0) ; la tournure se tire (« Montrer », « Démontrer »,
« Prouver que », `q.v`). **La première page est toujours l'exemple de la
demande, avec ses lettres** ; les trois suivantes sont trois autres plans,
jamais deux fois le même (`DCH_NB` = 4, `dmNbQuestions`, `distinctes()` avec
le plan pour clé tant qu'il en reste).

**Six justifications** (`DCH_JUST`, dans cet ordre dans la liste) : relation
de Chasles ; on change l'ordre de la somme ; vecteurs opposés : leur somme
est le vecteur nul ; ajouter le vecteur nul ne change rien ; soustraire un
vecteur, c'est ajouter son opposé ; vecteurs égaux car ABCD est un
parallélogramme — cette dernière n'est proposée que sur un parallélogramme,
et porte son nom. La liste dit les règles EN MOTS, sans « AB⃗ + BA⃗ = 0⃗ »
de l'idée : des lettres de l'énoncé souffleraient la réponse, et la première
version, écrite « u⃗ + (−u⃗) = 0⃗ », s'affichait avec des carrés vides — la
flèche combinante (U+20D7) n'a pas de dessin dans la police des listes, et
une `<option>` ne peut pas poser la flèche en CSS comme `.vgt-vec`. Vu à
l'écran, dans Chromium, pas par un banc. Sur un téléphone, la liste prend
toute la ligne sous les cases (`flex:1 1 0;min-width:0`) : à sa largeur
naturelle, la plus longue justification débordait de la carte.

**Toute écriture juste est acceptée — et c'est une ÉNUMÉRATION, pas une
liste de réponses.** `dchSuites` donne toutes les lignes qu'une étape tire de
la précédente selon sa justification : Chasles décompose un vecteur en
passant par N'IMPORTE QUEL point de l'énoncé, ou réunit deux vecteurs qui
s'enchaînent (plusieurs à la fois si les cases l'exigent) ; l'ordre prend
n'importe quelle permutation ; les opposés remplacent deux vecteurs voisins
XY + YX par 0 ; le nul se retire ; la soustraction change tous les « − XY »
en « + YX » ; le parallélogramme remplace un ou plusieurs vecteurs par un
égal. `dchChaines` garde les rédactions complètes qui arrivent au membre de
droite (à l'ordre près pour la dernière ligne) : 24 pour l'exemple, 48 pour
MA + MC = MB + MD, une seule pour AB + AD = AC. **Une case est juste s'il
existe une rédaction complète qui la porte avec les cases justes avant
elle** (le principe de `cspRemplit`, 8.2.4) ; la correction prend la première
qui reste, celle du plan d'abord. Ainsi AB + CD = AC + CB + CA + AD (passer
par C puis par A) est juste autant que AD + DB + CB + BD.

**Une étape vraie qui ne mène nulle part est fausse, et le message le dit.**
Pour AB + AD = AC, remplacer AB par DC est une égalité juste, mais DC +
AD ne se réunit pas par Chasles : la rédaction s'arrête. Le plan a un nombre
de lignes fixé ; refuser cette ligne sans le dire serait un mensonge, la
compter juste laisserait l'élève dans une impasse. Le message : « … est une
étape juste, mais elle ne mène pas à AC avec les étapes qui suivent. Il
fallait par exemple AB + BC. »

**Une justification est juste dès qu'elle explique le passage** de la ligne
d'avant (corrigée si elle était fausse) à la sienne (`dchExplique`) :
AB + BA = 0 se justifie par les vecteurs opposés, ou par Chasles (AB + BA =
AA). Sa correction est celle du plan.

**Les pièges nommés** (`dchPourquoi`, sur la première case fausse) : un
vecteur illisible ou hors de l'énoncé ; une ligne qui ne vaut plus la
précédente (la somme se lit comme une combinaison de points, `dchComb`, et,
sur un parallélogramme, le quatrième sommet vaut P0 + P2 − P1 — sans quoi
AB + BC aurait « valu » autre chose que AB + AD) ; l'étape juste sans issue ;
une ligne égale mais pas l'étape demandée (un vecteur changé pendant un
changement d'ordre) ; la mauvaise justification. Chaque message dit ce que
fait la règle, avec les lettres de l'étape quand il les trouve (`dchExemple` :
« ici, AB = AD + DB »). La première version citait la PREMIÈRE
transformation de l'étape : sur MA + MC = MB + BA + MD + DA, elle disait
« ici, MA = MB + BA » — la moitié que l'élève avait juste. `dchChangements`
rend chaque transformation avec les places qu'elle occupe, et le message
cite celle qui couvre la case fausse : « ici, MC = MD + DC ». Vu en lisant
le message à l'écran.

**La mise en page est celle d'une copie** : le membre de gauche ouvre la
première ligne, les suivantes en portent une copie INVISIBLE pour que leurs
« = » tombent sous le premier (`.dch-fant`, retirée sur un téléphone), et la
justification se choisit au bout de la ligne, après « car ». Vecteurs, signes
et cases sont ceux du 8.1.3 (`.veg-v`, `.veg-eq`, `.veg-in`) ; la liste a sa
classe (`.dch-sel`) et les trois encres de verdict. Une case vide reçoit la
correction en vert (`corrChoix`), une liste vide aussi ; en soutien, rien ne
se révèle. Le vecteur nul s'écrit 0, ou une lettre répétée (AA).

**On range le plan, les lettres et la tournure** (`t`, `n`, `v`), jamais
les réponses : tout se recalcule. Le verdict reste à la page.

**Le banc** (`demontrerChasles`, banc principal) a un juge qui ne lit PAS les
plans : il donne aux points des coordonnées au hasard (le quatrième sommet
d'un parallélogramme par la règle du parallélogramme) et vérifie, en nombres,
sur 200 séances, que l'égalité à démontrer est vraie et que CHAQUE ligne de
CHAQUE rédaction acceptée vaut le membre de gauche ; il relit la forme de
chaque étape du plan selon sa justification (l'ordre ne change que l'ordre,
l'opposé fait apparaître un 0, le nul le retire…) ; il exige les douze plans
sortis, la première page de la demande, jamais deux fois le même plan. Puis,
par le bouton, sur l'exemple : l'énoncé, la liste sans parallélogramme (cinq
justifications), la copie juste (15 cases), une AUTRE rédaction juste en
minuscules avec AA pour le nul et Chasles pour justifier AC + CA = 0, cinq
pièges peints en rouge et nommés, le badge vert, la case et la liste vides en
correction, la copie vide sans rouge, le JSON, le soutien qui peint sans
révéler ni verrouiller ; sur un parallélogramme EFGH : l'énoncé, la
justification qui porte son nom, EF + FG = EG juste, HG + EH « ne mène pas » ;
enfin le contexte du modèle.

**Puis l'action a manqué de mémoire — et ce n'était pas le mémo.** Sur la
machine de travail (8 Go de tas), tout était vert ; sur l'action (4 Go), le
banc principal de la Seconde est tombé en « heap out of memory », bien après
le contrôle de l'exercice, deux fois au même endroit. Rejoué en local avec
`node --max-old-space-size=4096`, puis coupé en deux :
- `main` seule passe à 4 Go, mais tombe à 3,8 Go : **le banc de la Seconde a
  moins de 200 Mo de marge** ;
- la branche passe à 4 Go si l'on retire le seul contrôle `demontrerChasles`.

Premier soupçon, le mémo des rédactions, rangé par JEU DE LETTRES tirées
(sans borne, le banc tirant des centaines de séances) : corrigé — les
rédactions se calculent une fois par PLAN, sur ses propres lettres, puis se
renomment (`dchChaines`, douze entrées quoi qu'il arrive) — mais le banc
tombait toujours. La mesure, avec `--expose-gc` et `heapUsed` autour du
contrôle, a dit le reste : 400 séances tirées et jugées ne retiennent rien ;
**chaque rendu de l'écran retient près d'un Mo jusqu'à la fin du banc** (50
rendus : +42 Mo), avec ou sans vérification. Le contrôle redessinait la page
avant chaque copie, dix-huit fois. Il remet désormais les cases à blanc
(`vider()`) et ne redessine que là où le rendu est lui-même vérifié : trois
fois. Le pavage (8.1.9) et la somme sans étapes (8.2.10) retiennent chacun
plus de 40 Mo de la même façon.

**Et la cause a été trouvée ailleurs, le même jour** — par la session du
8.1.12, qui butait sur le même mur (`docs/journal/17-verification-et-bancs.md`,
« Un banc jsdom qui ne rend jamais la main garde chaque nœud retiré »). Ce
n'était pas une fuite de la page : les relevés des `MutationObserver` de la
page gardent en vie chaque nœud qu'un `innerHTML` retire, tant que le banc ne
rend pas la main — d'où le Mo « retenu par rendu » mesuré ici. Le harnais
délivre désormais ces relevés après chaque contrôle (`__viderObservateurs()`),
et le banc plafonne bien sous les 4 Go. La remise à blanc de ce contrôle
(`vider()`) reste : elle ne coûte rien et allège le contrôle.

Leçon pour le prochain exercice : **un banc se rejoue en local À LA LIMITE
DE L'ACTION** (`node --max-old-space-size=4096 tests/verifier.js
secondes.html`) — la machine de travail donne 8 Go de tas à Node, l'action
4 ; et un cache se borne par ce qui est fini (le plan), jamais par ce qui est
tiré.

**Puis le contrôle du réglage « Questions » a rougi — au hasard du tirage.**
Sur l'action, le banc a fini par aller au bout (936 contrôles), avec un seul
échec : « la séance passe de 4 à 6 questions, mais le barème reste 39 ». Ce
contrôle universel suppose qu'une séance plus longue pèse plus de points ;
c'est vrai quand chaque question a le même nombre de cases, pas ici : une
démonstration a de 4 à 20 cases selon son plan, et six démonstrations courtes
peuvent peser autant que quatre longues (15 + 4 + 4 + 4 + 4 + 8 = 15 + 12 + 4
+ 8 = 39). Le barème, lui, était juste : c'est la somme des cases réellement
tirées, et le contrôle de l'exercice le tient (`maxScore` = somme de
`dchCases`). L'exercice se déclare donc dans le profil
(`reglagesDevoirs.baremeParCases`, raison comprise) ; la déclaration rougit
si elle ne désigne plus un exercice qui s'allonge. Ce bord n'était sorti dans
aucune des exécutions locales : il ne sort que sur certains tirages.


## {lire-somme-dessin} — lire une somme de vecteurs sur un dessin (8.2.14, v536 — v528 à v535 et les numéros 8.2.11 à 8.2.13 pris pendant la rédaction, par le 8.2.9, le 8.1.10, le 8.2.5, le 8.2.8 et « Chasles : insérer un point »)

**La demande** (Turquet, octobre 2026). Parmi les idées d'exercices proposées
par Claude, Turquet a retenu l'idée n° 8, « lire une somme sur un dessin » :
une chaîne de flèches déjà tracée entre des points nommés, et deux questions
— « quel vecteur de la figure est égal à u⃗ + v⃗ ? » et « écris w⃗ comme somme
de deux vecteurs de la figure » —, toutes les écritures justes acceptées.
Ajouté en dernier du sous-thème « Somme de vecteurs » : 8.2.14, rien ne se
renumérote. Kind `lsd`, écran `scr-lsd`.

**Les choix faits sans redemander** (la consigne était de décider les
détails raisonnables) :
- **des cases de deux lettres, pas un QCM** : c'est l'écriture du 8.2.2
  (`.veg-in` sous une flèche), et un QCM aurait donné la réponse à choisir ;
- **u⃗, v⃗, w⃗ sont tracés À PART**, en orange, loin des points (au moins
  1,2 carreau de chaque point nommé, 1 carreau de la chaîne, 1,4 carreau l'un
  de l'autre) : si u⃗ était le nom d'une flèche de la chaîne, « u⃗ + v⃗ » se
  lirait sur les étiquettes sans regarder le dessin. Ici, l'élève doit
  reconnaître la flèche de la chaîne qui fait le même chemin que u⃗ ;
- **un quadrillage**, 16 × 10 carreaux : il permet de compter, et le juge
  du banc tranche au pixel près ;
- **quatre figures par séance** (`LSD_NB`, `dmNbQuestions`), trois cases
  chacune : barème 12.

**Le tirage** (`lsdGenQuestion`). Cinq points en chaîne, quatre flèches de
composantes au plus 3 ; deux flèches consécutives ne sont jamais alignées
(leur somme se lirait sans rien chercher), aucun trait ne frôle un point ou
un autre trait (0,9 carreau), deux points ne sont jamais voisins.
- **u⃗ + v⃗** : u⃗ et v⃗ sont égaux à deux flèches CONSÉCUTIVES (k, k + 1) —
  une fois sur deux dans l'ordre inverse (`sw`) : v⃗ + u⃗ se lit pareil, et le
  message le dit (« on peut changer l'ordre d'une somme »).
- **w⃗** est le raccourci de deux flèches (`m = 2`), ou de trois (`m = 3`, une
  fois sur trois environ) : l'écriture attendue passe alors par un vecteur
  que la chaîne ne trace pas (`XZ + ZT`). Jamais la somme de u⃗ + v⃗, ni son
  opposée, ni une flèche de la chaîne.
- **un sixième point, isolé**, est posé sept fois sur dix au bout d'un AUTRE
  vecteur égal à u⃗ + v⃗ : « toutes les écritures justes » ont alors quelque
  chose à accepter.
- Les lettres sont six au hasard (sans I, O, Q, ni U, V, W qui nomment les
  vecteurs libres) : la chaîne ne suit pas l'alphabet, il faut la lire.

**On range la figure et les indices, jamais les réponses** : `pts`, `ch`
(l'ordre de la chaîne), `uo`, `vo`, `wo` (l'origine des flèches libres), `k`,
`sw`, `j`, `m`. `lsdVecs` recalcule u⃗, v⃗, w⃗ ; `lsdJuge` les réponses.

**Le juge** (`lsdJuge`, sans le DOM : il prend les trois chaînes écrites).
- u⃗ + v⃗ : juste si le vecteur écrit fait le même chemin, quelles que soient
  ses lettres.
- w⃗ = … + … : les deux cases justes si la somme fait w⃗. Sinon la première
  est juste si un vecteur de la figure la COMPLÈTE (w⃗ − PQ en est un) : elle
  commence une écriture juste, et la correction écrit dans la seconde ce qui
  la complète — de préférence le vecteur qui part de sa fin (Chasles). À
  défaut, la seconde se juge de même. Un vecteur déjà égal à w⃗ ne se complète
  par aucun vecteur non nul : il est faux, et nommé.

**Les pièges nommés** (`lsdPourquoi`, sur la première case fausse) : le
vecteur illisible ; u⃗ + v⃗ à l'envers (« l'OPPOSÉ ») ; u⃗ seul, v⃗ seul ; la
différence u⃗ − v⃗ ou v⃗ − u⃗ ; w⃗ écrit en UN vecteur (« DEUX vecteurs ») ;
une somme opposée à w⃗ ; deux vecteurs qui s'enchaînent mais n'arrivent pas
au bout de w⃗ (« DK + KA = DA, et DA n'est pas égal à w ») — ou reviennent au
départ (le vecteur nul) ; le second vecteur qui ne complète pas un premier
juste. Le message est du texte brut : les vecteurs s'y écrivent sans flèche,
comme au 8.2.1 — la flèche combinante U+20D7 se dessinait décalée dans la
police du message (vu sur la capture, avant la PR).

**Le dessin montre une ligne à la fois** (`lsdMontrer`) : liseré violet, les vecteurs écrits par l'élève tracés en violet
pointillé. La page VERROUILLÉE : le juste en bleu, le faux en rouge, la
correction en vert. En soutien, rien ne se révèle (`test.locked`, comme au
8.1.9).

**Un clic sur un point écrit sa lettre** (`lsdClicPt`) dans la case choisie
(liseré violet, `lsd-cible`) ; deux lettres posées, la main passe à la case
vide suivante ; un clic dans une case pleine la recommence. Sur tablette,
c'est le geste qui évite le clavier du système.

**Le banc** (`lireSommeDessin`, banc principal) a un juge qui ne lit PAS les
données de la page : il relit le SVG comme du TEXTE (la leçon du 8.1.9) — les
points (le rond le plus proche de chaque lettre), les flèches de la chaîne et
les trois flèches libres (le début du trait, la pointe), leur nom (le texte
le plus proche du milieu). Sur 50 séances, il vérifie : la chaîne continue
d'un point nommé à l'autre ; u⃗ et v⃗ égaux à deux flèches consécutives ; les
flèches libres à plus de 30 px de chaque point ; pour CHACUN des 30 vecteurs
de la figure, le verdict de la page sur « u⃗ + v⃗ = … » contre celui du
dessin ; pour CHACUNE des 900 sommes de deux vecteurs, le verdict des deux
cases de w⃗ (et la correction, qui doit faire w⃗) ; que `m = 3`, `sw = 1` et
une seconde écriture de u⃗ + v⃗ sortent. Sur une figure fixe (K → D → M → A →
F, B isolé) : les copies justes écrites AUTREMENT (`ab`, `MK + KF`), les dix
pièges peints en rouge et nommés, l'ordre inverse, le badge vert, le dessin
de la correction, les cases vides en correction (et la seconde qui COMPLÈTE
une première juste : `MK` → `KF`), la copie vide sans rouge, les clics, le
redessin après le JSON, le soutien sans révélation, le contexte du modèle.

**Deux pièges du banc, pris à la première exécution.** Le juge cherchait LA
flèche de la chaîne égale à u⃗ (`findIndex`) : une chaîne sur onze a deux
flèches égales, et le juge accusait à tort u⃗ et v⃗ de ne pas être
consécutifs — il cherche maintenant TOUTES les flèches qui font le chemin.
Puis la figure fixe, relue à l'écran par `outerHTML`, a planté le juge : la
sérialisation réécrit `<line …/>` en `<line …></line>`, que l'expression
régulière écrite sur `lsdSvg` ne lisait pas. Les deux écritures se lisent.
Et la règle de la case ciblée, `.veg-in.lsd-cible:not(.ok):not(.bad):not(.sol)`,
a fait rougir « 9 bis » : un sélecteur qui NOMME une classe de verdict, même
dans `:not()`, est lu comme une règle de verdict, et son violet passait pour
du bleu. La case ciblée prend un halo (`box-shadow`), plus une bordure.

**Trois sabotages ont été attrapés** (le contrôle seul, joué dans Chromium) :
- la page n'accepte plus que SON écriture de u⃗ + v⃗ : « u + v = AB : la page
  dit faux, le dessin juste » ;
- le juge de w⃗ oublie qu'une case se complète : « w = DF + DH : la page dit
  false/false, le dessin false/true » ;
- le dessin jugé en soutien : « la vérification du soutien verrouille ou
  révèle ».

**Puis l'action a manqué de mémoire, et le contrôle a cessé de redessiner.**
Après la fusion du 8.2.11 « Chasles : insérer un point », le banc principal de
la Seconde est mort dans l'action (« JavaScript heap out of memory », 4 Go),
loin après ce contrôle, sur celui de `pourcentage-chaine`. Reproduit en local
sous `--max-old-space-size=4096` : sans ce contrôle, le banc passe ; avec, il
meurt au même endroit. Pourtant, joué seul, il ne retenait que 21 Mo, et
« pourcentage-chaine » après lui tenait en 200 Mo. La mémoire était RENDUE
dès que la page reprenait la main (75 Mo deux secondes plus tard) : jsdom
garde ce que le DOM a touché jusqu'à la fin de la tâche en cours, et le
banc enchaîne ses contrôles sans jamais rendre la main. Chaque contrôle qui
dessine ajoute donc sa part à un tas qui frôle déjà 4 Go. Ici, `poser()`
redessinait la figure fixe à chaque piège, une vingtaine de fois. Elle se
dessine maintenant une fois, et les cases se remettent à neuf entre deux
copies : 6 Mo retenus au lieu de 21, et les trois sabotages toujours attrapés.
La marge du banc reste mince pour tout le monde : un contrôle qui dessine
dessine le moins possible.

**Et l'allègement n'a pas suffi : la cause était ailleurs, et une autre PR
l'avait trouvée.** Le run suivant de l'action est mort de la même façon, et
`main` lui-même passait ou non selon le tirage (rouge après le 8.2.11, vert
après le 8.2.8). La PR #711 (8.1.11, l'antécédent par une translation) a nommé
la cause exacte : les relevés des `MutationObserver` ne sont délivrés qu'au
retour de la main, et chaque relevé garde en vie les nœuds RETIRÉS du DOM.
Son correctif — `tests/harnais.js` enveloppe `MutationObserver`, `evaluer()`
délivre les relevés après chaque contrôle — est porté ici À L'IDENTIQUE, pour
que celle des deux PR qui passe la seconde n'ait rien à résoudre. La chronique
du correctif est celle de la #711 (`docs/journal/17-verification-et-bancs.md`) ;
mesuré ici, ce contrôle ne retient plus que 1 à 2 Mo par passage.

**Puis la page en ligne a montré ce qu'aucun banc ne regardait : la chaîne
faisait demi-tour** (v537). Sur la capture de la v536 publiée, N → K puis
K → P : la seconde flèche repartait presque en arrière, se couchait sur la
première, et N semblait posé sur le trait K → P. Le tirage interdisait deux
flèches consécutives ALIGNÉES, pas un retour aigu. Mesuré sur 3 000 figures :
une sur deux avait un demi-tour de plus de 120°, une sur huit un point à moins
de 1,2 carreau d'une flèche qui ne le touche pas. Le tirage refuse maintenant
les deux (angle entre deux flèches consécutives au plus 120°, tout point à
1,2 carreau au moins de chaque flèche qui ne le touche pas) : 0 sur 3 000,
sans repli ni perte de variété. Le banc relit les deux règles sur le DESSIN ;
éprouvé par sabotage — sans la règle des 120°, « la chaîne fait demi-tour
entre les flèches 1 et 2 » ; avec les distances d'avant, « le point E est à
31 px d'une flèche de la chaîne qui ne le touche pas ».

**Puis l'énoncé a dit de répondre avec les flèches BLEUES, et u⃗, v⃗, w⃗ sont
devenus rouges** (v542 — v539 à v541 pris pendant les bancs par le 8.2.8, le 8.2.15 et le 7.12 ; demande de Turquet : « préciser qu'il faut répondre
avec des vecteurs bleus de la figure ; écrire u, v, w en rouge dans l'énoncé
et dans les questions ; les vecteurs bleus des réponses doivent être tracés,
ainsi que deux supplémentaires »). Jusque-là, la réponse à u⃗ + v⃗ était le
raccourci de deux flèches de la chaîne, que la figure ne traçait pas, et un
w⃗ de trois flèches passait par un vecteur invisible : l'élève devait écrire
deux lettres qu'aucun trait ne reliait.
- **Les réponses sont tracées** (`lsdBleues`) : la chaîne, le raccourci
  `ch[k] → ch[k+2]` de u⃗ + v⃗, et, pour m = 3, `ch[j] → ch[j+2]` — de la même
  encre que la chaîne (classe `lsd-bl`, que le juge du banc distingue de
  `lsd-ch`). Ces raccourcis se recalculent : seules les deux flèches de plus
  se rangent (`q.dx`, deux lettres chacune ; une question d'avant, sans `dx`,
  se redessine sans elles).
- **Deux flèches de plus**, entre deux des six points, qui ne servent à
  AUCUNE réponse, même retournées : ni ± (u⃗ + v⃗), ni ± w⃗, ni complétées en w⃗
  par une flèche bleue lue dans un sens ou dans l'autre — l'élève qui
  retourne une flèche écrit encore un vecteur de la figure, et la page le
  compterait juste. Pour la figure de secours, FB et BM se complétaient
  l'une l'autre (FB retourné, plus BM retourné, fait w⃗) : ce sont KA et MB.
- **Chaque trait ajouté** (`lsdTraitOk`) passe à 1 carreau au moins des
  points qu'il ne touche pas, ne croise ni ne frôle (0,7) un autre trait, et
  s'ouvre d'au moins 25° sur un trait dont il partage un bout ; u⃗, v⃗, w⃗ se
  posent loin de TOUS les traits bleus. Mesuré sur 3 000 figures : aucun
  repli sur la figure de secours, 7 ms par figure.
- **Le juge n'a pas changé** : tout vecteur juste de la figure est accepté,
  bleu ou non (le banc le tient toujours, vecteur par vecteur). Mais la
  correction écrit des flèches bleues : `lsdComplete` préfère une flèche
  bleue, puis celle qui s'enchaîne.
- **Le rouge** est un jeton de l'écran (`--lsd-uvw`, #D3202F), sur le dessin,
  dans l'énoncé (`.lsd-r`) et dans les questions (`.lsd-n`). Les mots
  « vecteurs bleus de la figure » sont écrits en bleu nuit : la règle de
  l'énoncé sur `b` les peignait d'abord en rouge — vu sur la capture, pas
  par un banc ; le sélecteur porte maintenant l'identifiant de l'énoncé.

Le banc relit les flèches bleues sur le DESSIN : chacune relie deux points
nommés, à 27 px au moins des autres ; la réponse à u⃗ + v⃗ et une écriture de
w⃗ y sont tracées ; parmi les flèches ajoutées à la chaîne, exactement DEUX
ne servent à rien (même retournées), aucune ne sert « seulement à
l'envers » ; la correction de la copie vide n'écrit que des flèches bleues ;
l'énoncé dit « vecteurs bleus de la figure », et les neuf u⃗, v⃗, w⃗ de
l'énoncé et des questions portent la classe rouge. Trois sabotages, le
contrôle joué seul dans Chromium : le raccourci de u⃗ + v⃗ retiré du dessin
(« la réponse à u + v n’est pas tracée en bleu ») ; les flèches de plus
tirées sans filtre (« 1 flèche(s) bleue(s) ne servent à aucune réponse, au
lieu de 2 », « une flèche bleue ajoutée ne sert qu’à l’envers ») ;
`lsdComplete` qui ne préfère plus les flèches bleues — passé VERT la
première fois : la copie vide se corrige par l'écriture de la page, déjà
bleue, et rien ne regardait la case seule. Le contrôle juge maintenant,
pour chaque flèche bleue écrite seule dans une case de w⃗, la flèche qui la
complète (« avec HP seul, la correction de w écrit MJ, qui n’est pas une
flèche bleue »).

## {somme-trois-vecteurs} — trois vecteurs bout à bout (8.2.15, v538 — commencé comme 8.2.11 en v528 ; les exercices du thème 8 fusionnés pendant les bancs ont pris tour à tour les numéros 8.2.11 à 8.2.14 et les versions v528 à v537)

**La demande** (Turquet, octobre 2026). Dans la liste d'idées d'exercices sur
les vecteurs, Turquet a retenu la n° 7 : « Trois vecteurs bout à bout ». Sur
un quadrillage, trois vecteurs u⃗, v⃗, w⃗ ; l'élève construit u⃗ + v⃗ + w⃗ en
les enchaînant bout à bout à partir d'un point, puis trace le vecteur somme.
De temps en temps, la somme revient au point de départ : c'est le vecteur
nul, et l'élève le déclare. Ajouté en dernier du sous-thème « Somme de
vecteurs » : 8.2.15, rien ne se renumérote.

**Un moteur à lui, les pièces du 8.2.1.** Kind `stv`, écran `scr-stv`. Le
geste est celui du 8.2.10 (glisser ET tracer ouverts à tout moment, rien ne
se fige ni ne verdit avant « Vérifier ») ; les pièces sont celles du 8.2.1 :
`svcFleche` (avec la géométrie `STV_GEO`), `svcNomPos`, `svcEcart`, la prise
`.svc-prise`, le point et la flèche qui suivent la souris (`#stvCurseur`,
`#stvVif`). Le 8.2.1 n'a pas été touché : ses questions, son écran et son
banc sont les mêmes. Le quadrillage est plus grand que le sien (14 × 10
carreaux de 34 unités) : trois flèches, un point et la construction doivent
y tenir sans se gêner.

**Les choix faits sans demander** (la consigne était de décider les détails
raisonnables) :
- **Le point de départ est donné** (`q.l`, tiré parmi A, B, E, M, P ; posé
  en croix, sa lettre dans le coin le plus loin des flèches qui le touchent,
  la recette du 8.2.9). « À partir d'un point » rend le chaînage jugeable :
  la première flèche part du point, chaque début sur la fin de la précédente,
  DANS L'ORDRE QUE L'ÉLÈVE VEUT (`stvChaine` essaie les six ordres).
- **Deux réponses notées par question** (`stvCases`, barème 12 pour six
  questions) : le chaînage (`stv-ch`) et la somme (`stv-sm`), jugées chacune
  SEULE. La somme est juste dès que la flèche tracée en est un représentant,
  où qu'elle soit — comme au 8.2.1 : on juge le vecteur, pas la place. Une
  somme juste tracée sans avoir bougé les flèches vaut son point ; le
  chaînage, vide, se corrige en vert.
- **w⃗ en pointillés serrés** (`.stv-w`), v⃗ en tirets comme au 8.2.1, u⃗ en
  trait plein : trois traits qu'on distingue sans les couleurs, qui restent
  à la vérification.
- **Le vecteur nul se déclare par un bouton**, « C'est le vecteur nul »,
  posé dans la consigne de la somme et offert à CHAQUE question : réservé aux
  sommes nulles, sa seule présence aurait donné la réponse. Appuyé, il
  s'encre en sombre avec une coche (`stv-nul-on`) — ni bleu, ni vert, ni
  rouge : c'est ce que l'élève a dit, pas un verdict. Déclarer efface la
  flèche tracée ; tracer efface la déclaration ; un second appui la retire.
  On range `q.dn` (0 ou 1).
- **Combien de sommes nulles** : une question sur six (`stvBuildQuestions` :
  `max(1, round(n / 6))`, aucune sous trois questions), à une place tirée —
  une séance normale de six en a exactement une. La place passe par le
  second argument de la fabrique de `distinctes()` (l'indice de la question).

**On range les flèches et le point, jamais la réponse** : `l`, `po`,
`uo`/`uc`, `vo`/`vc`, `wo`/`wc`, puis `up`/`vp`/`wp` (null tant qu'une
flèche n'a pas bougé), `sd`/`sf`, `dn`. La somme et sa nullité se
recalculent (`stvSomme`, `stvNulle`).

**Le tirage est lisible** (`stvGen`) : chemins de −4 à 4 carreaux (w⃗
jusqu'à 5 quand il compense u⃗ + v⃗), chacun d'au moins deux carreaux, deux
flèches jamais parallèles ni presque (|u⃗ × v⃗| ≥ 4 pour chaque paire : la
première capture d'une somme nulle montrait un triangle si plat qu'il se
lisait mal) ; une somme non
nulle d'au moins deux carreaux ; la construction u⃗, v⃗, w⃗ depuis le point
tient dans le quadrillage (la correction la dessine) ; les trois flèches à
plus de 1,2 carreau l'une de l'autre, leurs six extrémités à deux carreaux
et à un carreau du bord ; le point à un carreau et demi de chaque flèche,
aucune ne part déjà de lui. Simulé sous Node : 1 000 figures normales et
1 000 nulles, toutes différentes, le repli jamais atteint, quelques
millisecondes la figure.

**Les pièges nommés** (`stvPourquoi`) :
- la construction qui ne part pas du point (« pose le début d'une des
  flèches sur A ») ;
- deux DÉBUTS ensemble, deux FINS ensemble ;
- des flèches qui ne se suivent pas ;
- la somme déclarée nulle à tort ;
- une flèche tracée pour une somme nulle : « les trois flèches REVIENNENT à
  leur point de départ » ;
- la somme à l'envers ;
- la somme de deux vecteurs seulement : « tu as oublié le vecteur w ».
Tout message faux finit par le chemin des trois vecteurs et celui de la
somme (ou « on revient au point de départ »).

**La correction** : chaque case bleue, rouge, ou verte (`sol`) si elle était
vide. Le chaînage faux ou vide : les trois flèches recopiées en vert, en
pointillés, depuis le point, dans l'ordre u⃗, v⃗, w⃗ (`stvConstruction`) ;
la somme fausse ou vide : la flèche verte « u⃗ + v⃗ + w⃗ » du point au bout
de la construction — ou, nulle, un cercle vert autour du point
(`.stv-nul-sol`), et la phrase « La somme était le vecteur nul » quand la
case était vide. En soutien, le juste se fige (flèches ou somme), le faux
rougit et reste à reprendre, rien ne se révèle (`soutienEnDirect.sans`,
comme « svc »).

**Le banc** (`sommeTroisVecteurs`, banc principal) a son propre juge : sur
200 séances, sa propre arithmétique (pas `stvSomme`) — six questions, une
somme nulle exactement, à chaque place au fil des séances, les clés rangées,
flèches d'au moins deux carreaux et jamais parallèles, la construction dans
le quadrillage, aucune figure servie deux fois ; puis sur une figure fixe,
il relit le DESSIN — les lignes du quadrillage tracé, chaque flèche
dessinée ramenée à ses nœuds — et refait la somme lui-même pour juger la
flèche verte de la correction. Il tient aussi : la copie vide (deux `sol`,
trois copies et une somme vertes, rien de rouge, « Il te manquait 2
cases », 0 sur 2) ; la flèche retenue au bord ; la copie juste après le
JSON de la pause ; un autre ordre (w⃗, u⃗, v⃗) et la somme tracée ailleurs ;
les cinq pièges nommés ; la somme nulle (déclarer et tracer s'effacent l'un
l'autre ; déclarer est juste ; tracer est faux et nommé ; la copie vide
entoure le point en vert) ; le soutien ; le contexte du modèle.
**Le banc navigateur** (« 6 quadragies decies ») fait l'exercice à la
souris : les trois flèches glissées bout à bout depuis le point, le début de
la somme cliqué À TRAVERS la prise de u⃗ posée sur le point, la flèche qui
suit la souris, la fin, « Vérifier » (2 sur 2) ; puis une somme nulle
déclarée au bouton (le chaînage vide se trace en vert, rien ne rougit). Il
mesure aussi que les consignes se lisent au-dessus du dessin, qu'aucun nom
n'en sort et que les prises ne font pas défiler la page.

**Le piège du 8.1.9, retrouvé.** La première version du contrôle tirait
ses 200 séances par `TESTS[…].start()` : 200 figures posées dans le DOM.
Verte sur la machine de travail (dont le tas n'est pas plafonné), elle a
épuisé les 4 Go du banc de la Seconde sur l'action (« heap out of memory »,
plus loin, dans les contrôles Python). Le tirage passe désormais par
`stvBuildQuestions()`, sans dessin ; un seul démarrage réel reste, pour le
kind, le barème et le nombre de questions. Cela n'a pas suffi : main était
déjà au bord des 4 Go (rejoué en local sous ce plafond, son banc n'avait pas
fini en trente minutes). La cause — les observateurs de mutations du banc qui
gardaient chaque nœud retiré — a été trouvée et corrigée par le 8.1.12,
fusionné pendant les bancs ; le relèvement à 6 Go essayé ici a été retiré
(`17-verification-et-bancs.md`).

Quatre sabotages ont été attrapés par le banc principal, chacun nommé :
- une somme tracée À L'ENVERS acceptée par le juge (« la somme à l'envers :
  ok ») — le soutien, du même coup, s'est verrouillé sur une copie fausse ;
- le message « tu as oublié le vecteur w » retiré ;
- le cercle vert de la somme nulle retiré (la correction traçait une flèche
  du point au point) ;
- plus aucune somme nulle au tirage (« une séance a 0 somme(s) nulle(s) »).

Ce qu'aucun banc ne voit : le glisser au DOIGT sur tablette (celui du 8.2.1,
`touch-action:none`, jamais joué), et la place du nom « u⃗ + v⃗ + w⃗ ». La
première capture l'a montré posé sur la lettre du point : `stvCoteDehors`
compte désormais le point parmi ce qu'il faut fuir ; aucun banc ne mesure
ce chevauchement.

**Puis les étapes se sont encadrées (v540).** La demande (Turquet,
octobre 2026) : « mettre en bleu le cadre de l'étape à faire, le mettre en
vert quand il est réalisé et mettre en bleu le suivant ; s'il est réalisé, le
mettre en vert. Quand on doit réaliser l'étape 1, ne pas afficher de point à
l'extrémité de la souris ou sur le quadrillage. » La recette est celle du
8.2.16 (`cvpFaits`) : `stvFaits` pose `stv-cours` (cadre et fond bleus) sur
la première étape non faite, `stv-fait` (cadre, encre et fond verts, et sa
coche) sur chaque étape EFFECTUÉE — effectuée, pas juste : l'étape 1 est faite
quand les trois flèches sont bout à bout depuis le point (`stvEtape1`, la
même chaîne que le juge), l'étape 2 quand la somme est tracée ou déclarée
nulle. Une étape marquée par la vérification garde son verdict, et rien ne
reste sous le verrou. Défaire la chaîne remet l'étape 1 en cours.

**L'étape 2 attend l'étape 1** — c'est le prix de « aucun point pendant
l'étape 1 » : un clic qui poserait un point qu'on ne montre pas serait pire.
Tant que la chaîne n'est pas faite, le quadrillage porte `stv-etape1` (le
nœud survolé ne montre plus son rond), le point au bout de la souris ne
s'affiche pas, `stvPose` ne pose rien et « C'est le vecteur nul » est
grisé ; un début déjà posé se retire toujours, une déclaration déjà faite
aussi. Ce qui change donc : « une somme juste tracée sans avoir bougé les
flèches vaut son point » n'est plus possible — la somme ne se trace
qu'après la chaîne. Le barème ne bouge pas.

**Les bancs.** Le banc principal tient les cadres (`C/-` au départ, `F/C`
la chaîne faite, `F/F` la somme tracée, `C/F` la chaîne défaite, rien sous
le verdict) et le clic sans effet pendant l'étape 1 ; ses pièges sur la
somme font d'abord la chaîne. Le banc navigateur mesure la COULEUR des
cadres calculée par le navigateur, survole un nœud pendant l'étape 1 (ni
point au bout de la souris, ni rond sur le nœud), y clique sans rien poser,
puis voit le point revenir à l'étape 2 ; la somme nulle se déclare après
la chaîne, le bouton étant grisé avant.

**Le second vecteur de la somme passe à l'ORANGE (v539).** La demande
(Turquet, octobre 2026) : « dans le 8.2.8, mettre le dernier vecteur de
l'exercice dans une autre couleur ». AA′ avait déjà le sien (violet) ; c'est
BD, le second vecteur tracé, qui se confondait avec BC — gris ardoise en
pointillés à côté du bleu nuit. Il prend `--cps-v` (#D97706) : trait, pointe
(`cpsArr1`), point de départ, nom et sa flèche, et la flèche vive qui suit la
souris pendant son tracé — ni le bleu du juste, ni le rouge du faux, ni le
vert de la correction, ni le violet de AA′. Les règles sont bornées à
`.cps-svg` : le 8.7 et les autres hôtes de `svc-v` gardent leur gris. Jugée,
la flèche passe en bleu ou en rouge comme avant ; la règle ne nomme aucune
classe de verdict, « 9 bis » n'a pas à la lire.

## {vecteurs-criteres} et {vecteurs-egaux-justifier} — comparer deux vecteurs, puis égaux ou pas et pourquoi (8.1.13 et 8.1.14, v575 — v572 à v574 prises pendant les bancs par le 8.2.16, le 8.2.17 et le sous-thème 8.3)

**La demande** (Turquet, octobre 2026) : « créer un exercice dans égalité
de vecteurs, qui donne deux vecteurs et qui demande de compléter par vrai ou
faux les affirmations : même longueur, même direction (c'est-à-dire
parallèle) ; si c'est la même direction, demander : même sens ; puis comme
dernière affirmation : les vecteurs sont égaux. L'élève doit avoir
différents exemples complémentaires qui permettent de voir toutes les
situations possibles. Puis un deuxième exercice, qui donne deux vecteurs,
qui demande si l'affirmation “les vecteurs sont égaux” est vraie ou fausse ;
si c'est faux, on demande de choisir la bonne justification parmi : pas la
même longueur, pas la même direction (c'est-à-dire pas parallèles), pas le
même sens. Dans ces deux exercices, pour direction, on précisera que cela
signifie intuitivement parallèle. »

**Un moteur, deux écrans.** Les deux exercices tirent les mêmes questions
(`vcrBuildQuestions`) : deux vecteurs u et v sur un quadrillage de 14 × 7
carreaux, l'un dans la moitié gauche, l'autre dans la moitié droite — les
flèches ne se croisent jamais. On range les deux vecteurs (origine et
déplacement, en carreaux), jamais les réponses : `vcrCrit` relit chaque
critère en entiers (longueurs au carré, produit en croix, produit scalaire).
Le dessin reprend `svcFleche` du 8.2 — u violet (`--crd-a`), v ambre
(`--crd-b`), dans le dessin comme dans le texte ; aucune règle ne touche une
classe de verdict.

**Six situations, une par question** (`VCR_SITS`, ordre tiré ; un devoir
plus long recommence le cycle) : égaux ; opposés ; même direction et même
sens mais pas la même longueur ; même direction, sens contraire, pas la même
longueur ; même longueur, pas la même direction ; ni l'un ni l'autre. Deux
vecteurs de même longueur et de directions différentes ont les MÊMES nombres
de carreaux, échangés ou retournés : la longueur se compte sans Pythagore.
« Ni l'un ni l'autre » part de là et ajoute ou retire un carreau à une
étape : l'écart est petit, la longueur ne se devine pas au premier coup
d'œil. Aucune flèche ne fait moins de deux carreaux.

**La ligne du sens s'ouvre sur la réponse de L'ÉLÈVE, pas sur la vraie
direction.** Ouverte d'après la vérité, sa seule présence aurait donné la
réponse de la ligne d'avant. Elle s'ouvre donc quand l'élève répond « Vrai »
à la direction, se referme (et oublie son choix) s'il revient à « Faux »,
et les numéros suivent les lignes visibles (`vcrMajLignes`). À la
vérification, la page tranche : même direction mais ligne fermée, elle
s'ouvre et reçoit la correction en vert, comme une case vide ; pas la même
direction mais ligne ouverte, elle se grise, ne compte pas, et sa note dit
« sans objet : on ne compare pas leur sens ». Le barème suit : 4 cases
quand les vecteurs ont la même direction, 3 sinon (22 pour une séance de
six). La reprise après une pause remet les choix par `restoreBoxes`, qui ne
déclenche aucun événement : `resumeTest` rappelle donc `vcrMaj()` et
`vejMaj()`, sans quoi le sens choisi serait revenu dans une ligne cachée.

**Au 8.1.14, la justification suit la même règle**, ouverte par « Faux ».
Quand deux critères manquent (ni la même direction ni la même longueur ;
sens contraire et pas la même longueur), les deux justifications sont
justes, et la note les nomme toutes les deux. « Pas le même sens » n'est
JAMAIS une justification de deux vecteurs qui ne sont pas parallèles : le
sens ne se compare qu'entre deux vecteurs de même direction, et le message
le dit. Barème : 1 case pour deux vecteurs égaux, 2 sinon (11 pour six).

**Un piège de dessin, vu en ouvrant la page.** Les deux écrans gardent
chacun leur dessin, et les pointes de flèche étaient des `<marker>` de même
identifiant : au 8.1.14, `url(#vcrArru)` trouvait d'abord le marqueur du
8.1.13, dans un écran caché — et un marqueur pris dans un sous-arbre
`display:none` ne se dessine pas. Les flèches du 8.1.14 n'avaient plus de
pointe, sans aucune erreur. Les marqueurs portent maintenant le nom de
l'écran (`vcrArru`, `vejArru`). Aucun banc jsdom ne l'aurait vu : il ne
dessine rien.

**Le banc** (`vecteursCriteres`, banc principal) relit le DESSIN, pas la
question : le rond de départ et la pointe de chaque flèche, ramenés au
quadrillage, puis il juge lui-même chaque critère — 200 séances, chacune
doit montrer les six situations, chaque flèche dans le quadrillage, d'au
moins deux carreaux, sans chevaucher l'autre. Puis, par le bouton : la ligne
du sens fermée au départ, ouverte par « Vrai », refermée et vidée par
« Faux », la renumérotation ; la copie juste (4 cases, puis 3) ; la
direction dite fausse (le sens s'ouvre en vert) ; le sens ouvert à tort
(gris, sans objet, hors note) ; la copie vide sans rouge ; la reprise ; le
soutien ; au 8.1.14, les deux justifications acceptées, « pas le même sens »
refusé avec son message, la justification ouverte à tort sur deux vecteurs
égaux. Éprouvé par sabotage : un « égaux » qui oublie le sens, une
justification « sens » acceptée hors direction, une ligne du sens qui ne se
ferme plus, une situation retirée du tirage — chacun rougit.
## {translations-successives} — deux translations à la suite (8.2.16, v572)

**La demande** (Turquet, octobre 2026). Parmi les idées d'exercices proposées
par Claude, Turquet a retenu la n° 3, « Deux translations à la suite » : le
pont entre la translation (8.1) et la somme de vecteurs (8.2). Ajouté en
dernier du sous-thème « Somme de vecteurs » : 8.2.16, rien ne se renumérote.
Kind `tcp`, écran `scr-tcp`, préfixe réservé pour cette session — d'autres
sessions remplissaient le thème 8 le même jour. Écrit comme 8.2.11 en v528, publié comme 8.2.16 en
v572 (le 20 octobre) : pendant que les bancs tournaient, `main` a pris la v528 (le 8.2.9), la
v529 (le 8.1.10 et le 8.2.5), puis la v530 et le numéro 8.2.11
({chasles-inserer-point}), puis la v531 (le 8.2.9 et le 8.1.10) ; la pull request est ensuite restée
ouverte quatre jours, pendant lesquels `main` a reçu 327 commits (jusqu'à la
v571, et les 8.2.12 à 8.2.15).

**L'exercice.** Un quadrillage de 16 × 10, deux flèches u⃗ (trait plein) et
v⃗ (pointillés), un point A. Quatre cadres d'étape au-dessus du dessin, la
recette du 8.2.8 (le cadre à faire en bleu, `tcp-cours` ; un cadre fait en
vert avec sa coche, `tcp-fait`) :
- ① placer A′, image de A par la translation de vecteur u⃗ ;
- ② placer A″, image de A′ par la translation de vecteur v⃗ ;
- ③ « On passe directement de A à A″ par la translation de vecteur … » :
  une liste, u⃗ + v⃗, u⃗ − v⃗, v⃗ − u⃗, −u⃗ − v⃗, dans un ordre tiré et rangé
  (`q.ord`) ;
- ④ tracer le vecteur AA″ (son début, puis sa fin).

Barème 4 par question, quatre questions (`TCP_NB`, `dmNbQuestions`) : 16.

**« Fait » veut dire « le geste est fait », pas « juste »** (le 8.2.8 d'avant
la v517) : un A′ mal placé passe au vert comme un autre, seule la
vérification juge. Décidé ainsi pour que l'évaluation ne dise rien avant
« Vérifier » ; le prix est nommé : l'élève ne sait pas, avant de vérifier,
qu'il s'est trompé de sens.

**Chaque réponse se juge SEULE** (`tcpJuge`) — la règle « une case juste ne
rougit pas parce qu'une autre est fausse » :
- A′ est juste au nœud A + u⃗ ;
- A″ est juste s'il est l'image de l'A′ DE L'ÉLÈVE par v⃗ (`tcpA2De`) : un A′
  faux ne fait pas rougir un A″ bien construit à partir de lui ;
- la flèche AA″ est juste si elle part de A et arrive au A″ attendu — ou au
  A″ de l'élève, quand celui-ci est juste au sens précédent ;
- la liste n'a qu'une bonne réponse, u⃗ + v⃗.

**Les pièges nommés** (`tcpPourquoi`), tous de l'ordre ou du sens :
- A′ dans le SENS CONTRAIRE de u⃗, A′ qui suit v⃗ au lieu de u⃗, A′ qui fait les
  deux translations d'un coup ;
- A″ dans le sens contraire de v⃗, A″ « reparti de A » (A + v⃗ : l'image de A,
  pas de A′), A″ qui suit u⃗ une seconde fois ;
- u⃗ − v⃗ (v⃗ à l'envers), v⃗ − u⃗ (u⃗ à l'envers), −u⃗ − v⃗ (« le chemin du
  RETOUR ») ;
- AA″ à l'envers (de A″ vers A), AA″ qui ne part pas de A, qui n'arrive pas
  en A″.
Le message finit par le chemin en carreaux : u⃗, v⃗, puis leur somme.

**Le tirage** (`tcpGen`) : deux chemins d'au moins deux carreaux, jamais
parallèles ; la somme ET la différence d'au moins deux carreaux (un piège du
sens mène loin du bon nœud) ; A, A′ et A″ à un carreau du bord ; les flèches
dessinées à un carreau et demi de A, A′, A″, à un carreau au moins de la
construction, et l'une de l'autre. Deux questions d'une séance n'ont jamais
les mêmes vecteurs (la clé de `distinctes` est `[uc, vc]`).

**On range la figure et les gestes, jamais la réponse** : `uc`, `vc` (les
chemins — pas `v`, que `CLE_HORS` écarte), `uo`, `vo`, `a`, `ord`, puis `p1`,
`p2`, `ch` (l'indice choisi dans `TCP_OPTS`, `''` tant que rien), `d`, `f`.
`tcpA1`/`tcpA2` recalculent les points.

**Le geste.** Un clic n'importe où sur le quadrillage va au nœud le plus
proche (un seul écouteur sur l'hôte, aucune cible par nœud : la leçon
mémoire du 8.1.6 et du 8.1.9). Il pose A′, puis A″ (recliquer A′ avant de
poser A″ le retire), puis trace AA″ (recliquer le début seul le retire ; un
troisième clic recommence le tracé). « Effacer ma construction » reprend
tout, sauf ce que le soutien a figé juste. Le point à placer suit la souris
avec son nom (A′, puis A″) ; pendant le tracé, une flèche violette va du
début posé à la souris, sans croix sur la pointe (la leçon du 8.2.8, v527).

**La correction** : A′, A″ et AA″ de l'élève en bleu ou en rouge ; en vert la
construction attendue (u⃗ depuis A, v⃗ depuis A′) quand A′ ou A″ n'était pas
juste, les croix attendues, la flèche AA″ attendue, et la bonne translation
écrite à côté de la liste (`#tcpCor`) — ou mise DANS la liste quand elle était
vide. En soutien : le juste se fige, le faux rougit, rien ne se révèle. A″ ne
se fige que sur un A′ juste (figé sur un A′ faux, il deviendrait faux dès que
l'élève corrige A′).

**Le banc** (`translationsSuccessives`, banc principal) a un juge qui ne lit
pas les constantes de la page : il relit le SVG COMME DU TEXTE (`tcpSVG(q)`,
jamais posé dans le DOM pour les 600 questions tirées) — la géométrie du
quadrillage sur le cadre et le nombre de traits, u⃗ et v⃗ sur leurs flèches
(la pointe s'arrête 3 px avant le nœud : il la prolonge), A sur sa croix.
Sur 150 séances : A′ et A″ recalculés depuis le dessin, tout dans le
quadrillage, les chemins assez longs et non parallèles, aucune flèche
dessinée sur la construction, la bonne option qui mène de A à A″. Puis une
figure fixe à l'écran : la liste dans l'ordre rangé, la copie vide (quatre
sol, trois traits verts, rien de rouge, « Il te manquait 4 cases »), la
copie juste posée pas à pas avec le reclic qui retire A′ et la reprise
après JSON (4/4), quatre pièges à la fois (quatre rouges, quatre messages),
A′ faux avec A″ et AA″ cohérents (rouge, bleu, bleu, bleu), le soutien et
« Effacer », le contexte du modèle. **Le banc navigateur** (« 6 quadragies
undecies » — le numéral « novies » a été pris entre-temps par
{translation-antecedent}, sous la graphie « nonies ») pose A′ et A″ à la souris, d'un clic décalé, mesure la croix qui
suit la souris avec son nom, la flèche vive de A à la souris et son absence
de croix, choisit dans la vraie liste, vérifie 4/4, puis corrige une copie
vide sans rouge.

**Ce qu'aucun banc ne voit** : le doigt sur tablette (le clic y passe, la
croix qui suit la souris n'y vit pas), et la lisibilité de « u⃗ » dans la
liste déroulante — la flèche combinante U+20D7 dépend de la fonte du
système.

**Puis le banc de la Seconde a débordé ses 4 Go dans l'action, et le
correctif de #711 a été porté ici.** Mesurée contrôle par contrôle (un
`gc()` avant chaque relevé), la mémoire retenue culminait à 4 233 Mo sur
`main` SEUL et à 4 259 Mo avec cet exercice : la base dépassait déjà la
limite, le 8.2.12 n'y ajoutait que 26 Mo. La cause, trouvée par la pull
request #711 (8.1.12, fusionnée depuis sur `main`) : les relevés des `MutationObserver`
gardent en vie les nœuds retirés tant que le banc ne rend pas la main. Son
correctif (`tests/harnais.js` et `evaluer()` dans `tests/verifier.js`) est
porté tel quel, sans retouche, et se fondra sans conflit quand #711 arrivera
sur `main`. Le banc de la Seconde repasse sous 4 Go (`--max-old-space-size=4096`
en local : 935 contrôles verts).

## {regle-parallelogramme} — la règle du parallélogramme (8.2.17, v573 — fusionné après les 8.2.11 à 8.2.16 : sa pull request attendait que le banc de la Seconde cesse de manquer de mémoire)

**La demande** (Turquet, octobre 2026). Parmi les idées d'exercices proposées
sur la somme de vecteurs, Turquet a retenu la sixième : « la règle du
parallélogramme ». C'est la SECONDE méthode de construction de la somme, à
côté du « bout à bout » du 8.2.1 : u⃗ et v⃗ partent du MÊME point. Ajouté en
dernier du sous-thème « Somme de vecteurs » : 8.2.17, rien ne se renumérote.

**La figure.** Le quadrillage du 8.2.1 (12 carreaux sur 8, `SVC_*`, les
flèches de `svcFleche`) : trois croix A, B, C, u⃗ = AB⃗ en trait plein et
v⃗ = AC⃗ en pointillés, tous deux partant de A. Les lettres se posent dans le
coin le plus loin des segments de la figure ENTIÈRE — côtés ET diagonales
(`spgLettre`, la recette de `cvpLettre`) : rien de ce que l'élève trace
ensuite ne les recouvre. Les noms u et v se posent hors du parallélogramme
(`svcCoteDehors`, avec le côté opposé).

**Deux étapes, deux réponses** — les bandeaux bleus du 8.2.9, au-dessus du
dessin, qui SONT les réponses notées (`spg-pt`, `spg-sm`) :
- Étape 1 : « Place le point D tel que ABDC soit un parallélogramme : clique
  son nœud », et en petit « Les sommets se suivent dans l'ordre A, B, D, C ».
  Un clic pose D (un autre nœud le déplace, le même le retire) ; ses deux
  côtés [BD] et [CD] se tracent en pointillés.
- Étape 2, ouverte d'elle-même sous l'étape 1 dès que D est posé : « Trace le
  vecteur u⃗ + v⃗ : c'est UNE diagonale du parallélogramme ABDC ». Le mot est
  choisi : l'énoncé ne dit pas laquelle, choisir est l'exercice — c'est là
  que tombe le piège. Un clic pose le début, une flèche élastique le suit
  jusqu'à la pointe de la souris (la recette du 8.2.1, v520), un second clic
  fixe la fin ; un clic de plus recommence, recliquer le début seul le
  retire, Échap aussi.

Chaque étape EFFECTUÉE passe au vert (`spg-fait`, le geste et pas sa
justesse) ; la vérification peint ok bleu, bad rouge, sol vert.

**Revenir à D.** À l'étape 2, un clic trace : il ne peut plus déplacer D (la
fin de la diagonale tombe justement sur D). Le bouton « ↩ Déplacer le point
D », sous le dessin, ramène à l'étape 1 ; là, un clic sur un autre nœud
déplace D et rouvre l'étape 2, et « Garder ce point D » y revient sans rien
changer. L'étape en cours ne se range pas (`spgEtape` : D posé, c'est
l'étape 2) : la reprise d'une pause rouvre l'étape 2.

**Un seul écouteur de clic**, à l'hôte, qui va au nœud le plus proche (la
recette du 8.1.7) : aucune cible par nœud, rien de caché dans les 117 nœuds.
La croix qui suit la souris porte « D » à l'étape 1, rien à l'étape 2, et se
cache une fois la flèche finie. Ce que l'élève pose est VIOLET (`--crd-a`)
tant que rien n'est jugé : le bleu dit « juste » et le vert « correction »
depuis août 2026.

**On range la figure et les gestes, jamais la réponse** : `ao`, `uc`, `vc`,
`sel` (D), `sd`/`sf` (la flèche). `spgD(q)` recalcule D. Six questions par
séance (`SPG_NB`, `dmNbQuestions`), barème 12.

**Le tirage** (`spgGen`) : u⃗ et v⃗ de deux carreaux au moins, l'un au moins
en biais, un angle franc (sinus ≥ 0,35 : jamais un parallélogramme
aplati), les DEUX diagonales de deux carreaux au moins (le piège doit se
lire), A, B, C et D à un carreau du bord.

**Le juge** (`spgJuge`) : chaque réponse SEULE. D juste s'il est le sommet
opposé à A ; la flèche juste si elle va de A au VRAI D — quel que soit le D
posé : une diagonale juste ne rougit pas parce que le point est faux. **Un
choix est nommé** : un représentant de u⃗ + v⃗ tracé ailleurs qu'en A est
compté faux — l'exercice est la règle du parallélogramme, la diagonale ISSUE
DE A — mais son message le dit (« Ta flèche a bien le chemin de u + v, mais
la règle du parallélogramme la trace depuis A »). Si Turquet préfère
l'accepter, c'est une ligne dans `spgJuge`.

**Les pièges nommés** (`spgPourquoi`) :
- l'AUTRE diagonale : « le vecteur BC vaut v − u, pas u + v » (ou « CB vaut
  u − v ») — le piège de l'exercice ;
- ABCD au lieu de ABDC (D = A + v − u), ou ADBC (D = A + u − v) : « Ton point
  fait bien un parallélogramme avec A, B et C, mais pas ABDC » ;
- D du mauvais côté de A (A − u − v), D posé sur A, B ou C ;
- la diagonale à l'envers (DA), un côté au lieu de la diagonale, une flèche
  qui part de A sans arriver au sommet opposé.
Hors soutien, chaque message finit par le chemin (« BD = AC = v : depuis B, D
est à … », « u + v = AD fait … ») ; en soutien, le piège seul, sans chemin.

**Soutien** : la réponse juste se fige en bleu (D ne se déplace plus, la
flèche ne se retrace plus), la fausse rougit et reste à reprendre ; rien ne
se révèle. **Correction finale** : le vrai D en croix verte avec ses côtés et
sa lettre s'il manquait ou était ailleurs, la diagonale AD⃗ verte nommée
u⃗ + v⃗ si la flèche n'était pas elle.

**Le contexte du modèle** (`ctxSpg`) : la figure, la méthode (D opposé à A,
BD⃗ = AC⃗ = v⃗, la diagonale issue de A, l'autre vaut v⃗ − u⃗), et D sous
clause de secret.

**Les bancs.** Le principal (`regleParallelogramme`) a un juge qui ne lit
PAS la question : il relit le DESSIN comme du TEXTE (la leçon du 8.1.9 —
redessiner des centaines de figures dans jsdom épuise les 4 Go de l'action) :
les trois croix, la lettre posée près de chacune, les deux flèches, et
calcule D = B + C − A lui-même. Sur 120 séances (720 figures — la première version en tirait 200 ; l'action, dont le tas est borné à 4 Go quand une machine de travail en offre 8, a manqué de mémoire sur la PR, un peu plus loin dans le banc : à ce bord, chaque contrôle compte) : les clés
rangées, aucune question répétée, u de A à B et v de A à C sur le dessin, le
D de la page égal à celui du dessin, la construction relue acceptée par le
juge et l'autre diagonale refusée, les contraintes du tirage. Puis une
figure fixe — A (3 ; 2), u⃗ (4 ; 1), v⃗ (1 ; 3), D (8 ; 6) : l'énoncé, les
étapes au-dessus du dessin, l'étape 2 cachée ; la copie vide (deux sol, D,
ses côtés et AD⃗ en vert, rien de rouge, « Il te manquait 2 cases ») ; les
gestes (D, la flèche commencée, retirée, Échap, finie et nommée u + v, le
retour à l'étape 1, D déplacé puis retiré) ; la reprise après JSON ; la copie
juste (2) ; ABCD + BC, ADBC + CB, D juste + DA, D faux + AD juste (la flèche
juste reste bleue), le côté AB ; le soutien (faux nommé sans chemin, D juste
figé, puis tout juste) ; le contexte du modèle. **Le banc navigateur**
(« 6 quadragies novies ») joue tout à la vraie souris : la croix de D à
moins de 3 px de la pointe, un clic à un cinquième de maille, l'étape 2
ouverte entre l'étape 1 et le dessin, l'étape 1 verdie, les deux côtés
tracés, la flèche élastique mesurée du début à la pointe et qui suit, plus
rien qui suit une fois la flèche finie, « Déplacer le point D », la copie
juste (2) et la copie vide (trois traits verts, rien de rouge). Le doigt sur
tablette — un toucher par geste, sans croix ni flèche qui suivent — ne se
joue dans aucun banc.

## Le sous-thème 8.3 « Vecteurs colinéaires » — {construire-multiple-vecteur}, {identifier-multiple-vecteur}, {identifier-multiple-non-entier}, {vecteurs-colineaires-figure} (8.3.1 à 8.3.4, v574 — v572 et v573 prises par les 8.2.16 et 8.2.17 pendant la rédaction)

**La demande** (Turquet, octobre 2026) : « en seconde créer 4 exercices comme
sur le pdf qui seront dans le sous-thème vecteurs colinéaires du thème
vecteurs ». Le PDF est la « Fiche 1 : vecteurs colinéaires » : l'exercice 1
(construire 2u⃗, ½u⃗, −2u⃗, −⅓u⃗, ⅔u⃗, −⅚u⃗, 5/3 u⃗ à partir d'un u⃗ dessiné),
l'exercice 2 (u⃗, v⃗, w⃗ et dix vecteurs a. à j. : « chacun est obtenu en
multipliant u⃗, v⃗ ou w⃗ par un réel k ; identifier chacun d'entre eux » —
des k comme −1,5, ¾, −5/4), l'exercice 3 (une figure de vecteurs AB⃗, CD⃗…
et dix lignes « AB⃗ et GH⃗ ? □ Non □ Oui car AB⃗ = … GH⃗ »), et, page 2,
l'EXEMPLE 1 — l'exercice 2 avec des k entiers. Quatre exercices, dans l'ordre
qui monte : construire (8.3.1), l'exemple à k entiers (8.3.2), l'exercice 2
à k décimaux ou fractionnaires (8.3.3), colinéaires ou non (8.3.4). Un
troisième sous-thème du thème 8 : rien ne se renumérote.

**Trois moteurs pour quatre exercices.** Le 8.3.1 est le moteur du 8.1.7
(`tvx`), comme le 8.1.8 l'était déjà : même geste, même juge, même écran. La
question porte `q.ks` — trois coefficients `[numérateur, dénominateur]`,
rangés — et un seul vecteur donné, `q.vs[0]`. Tout ce qui change passe par
les fonctions que le 8.1.8 avait ouvertes : `tvxVec`/`tvxOrig` lisent u⃗
pour les trois flèches, `tvxCible` multiplie son chemin par le coefficient,
`tvxNom`/`tvxNomHTML` écrivent « ⅔u », et une seule nouvelle, `tvxTrace`,
pose le nom d'une flèche : `svcFleche` ne sait écrire que des lettres, le
nom « −⅚u⃗ » s'écrit à part (`kvSvgNom`), la fraction EMPILÉE (deux `tspan`
à 14 px et un trait `kv-barre` qui prend la couleur de la flèche par sa
classe `-f`), le signe droit, la petite flèche sur la seule lettre. Le nom
change de côté quand il sortirait du quadrillage (une flèche couchée sur le
bord du haut l'écrit dessous) — vu sur la première capture, où la
correction −⅔u⃗ posée sur la rangée du haut écrivait son nom hors du
dessin. Les 8.3.2 et 8.3.3 partagent `kvi` (`q.fr = 1` au 8.3.3, l'identité
suit `currentTestId`) ; le 8.3.4 est `kco`. Ce que les trois partagent est
nommé `kv…` : l'écriture d'un coefficient (`kvTxt` en texte, `kvMot` pour le
modèle, `kvSaisie` comme l'élève la tape, `kvHTML` à l'écran — la fraction
de `sfFracInner`, le signe centré sur son trait par un `inline-flex`), la
lecture d'une saisie (`kvLit` : « −1,5 », « -3/2 », « 1.5 », « .5 » ; « 1/0 »
et « 2/ » ne sont pas des nombres), le quadrillage et la pose des flèches.

**Le tirage du 8.3.1** (`tvxGenK`) : trois coefficients distincts parmi
vingt-deux (de −3 à 3, demis, tiers, quarts, ±5/6), au moins une fraction,
au moins un positif et un négatif ; u⃗ a pour composantes des multiples du
PPCM des dénominateurs (au plus 6), pour que chaque flèche tombe sur des
nœuds, et chaque flèche tient dans le quadrillage avec un carreau de
marge. Deux questions sont la même si u⃗ et les coefficients le sont, où que
u⃗ soit posé (`tvxCleK`). **Le juge** est celui du 8.1.7. **Les pièges
nommés** lisent le coefficient : à l'envers, « le coefficient est négatif,
donc ⅔u a le sens CONTRAIRE de u » (ou positif, le MÊME) ; la bonne
direction sans la bonne longueur, « ⅔u mesure 2/3 fois la longueur de u » ;
puis le chemin de u, celui de k u, celui de la flèche.

**Le 8.3.2 et le 8.3.3** (`kviGen`) : trois directions deux à deux non
parallèles, dont une horizontale ou verticale ; chaque vecteur donné est sa
direction multipliée par un entier choisi pour que ses coefficients tombent
sur des nœuds (2, 3 ou 4 au 8.3.3 pour une direction d'un carreau) ; six
vecteurs nommés, deux par vecteur donné, de coefficients différents, jamais
1 ; au 8.3.3, quatre au moins ne sont pas entiers. On range la figure
(`q.bs`, puis une ligne `[x, y, vecteur donné, numérateur, dénominateur]`
par vecteur nommé), jamais la réponse : le chemin se recalcule (`kviVec`).
**Deux réponses par vecteur nommé**, jugées chacune seule : le vecteur (une
liste u, v, w) et le coefficient (une case, `inputmode="numeric"` et la
touche « / » au pavé de la tablette, `data-pave-plus`). Le bon coefficient
devant le mauvais vecteur vaut une case sur deux. Deux pages par séance,
barème 24. Les vecteurs nommés et u⃗, v⃗, w⃗ sont dans deux dessins, comme sur
la fiche ; les lignes se rangent en grille.

**La ligne se lit « a⃗ = k × u⃗ »** (v576, demande de Turquet : « afficher
les flèches dans les cases représentant un nom de vecteur, rendre les cases
plus étroites et rajouter entre les cases le signe × ») : un « × » entre la
case du coefficient (64 px) et la liste du vecteur (52 px). Une `<option>`
ne prend pas de HTML, et la flèche combinante U+20D7 n'y est PAS dessinée
dans la case fermée (essayée, invisible dans Chromium) : la flèche est un
`::before` du cadre `.kv-vc` qui enveloppe la liste, effacé tant que « ? »
est choisi (`:has(option[value=""]:checked)`), de la couleur du verdict
(`:has(.ok/.bad/.sol)`). Le badge vert du bon vecteur posé par
`corrChoix` sort du cadre (sa flèche resterait centrée sur la liste ET le
badge) et s'écrit `tvxVecHTML`, flèche comprise. L'écart des lignes passe à
6 px : une ligne fausse, avec ses deux badges, se repliait — déjà avant.

**Le 8.3.4** (`kcoGen`) : trois directions, huit vecteurs (trois, trois et
deux par direction, chacun sa direction multipliée par un entier de −4 à
4), cinq paires dont deux à quatre colinéaires, le réel jamais 1. **Le piège
de la fiche est tiré exprès** : deux des trois directions sont PROCHES
(`kcoProches`, moins de 20° — (2 ; 1) et (3 ; 1), (1 ; 1) et (2 ; 1)), et les
paires non colinéaires se prennent d'abord parmi elles : des flèches presque
parallèles qui ne le sont pas. **Une réponse par ligne, et c'est la ligne
qui est la `pts-case`** : « Non » juste si les vecteurs ne sont pas
colinéaires, « Oui » juste s'ils le sont ET que le réel est le bon ; « Oui »
sans réel est faux. La case du réel ne prend AUCUNE classe de verdict —
elle serait une seconde réponse comptée par `ptsEcran()`, et une case vide
qui rougit — : c'est la ligne qui bleuit, rougit ou verdit, la bonne
réponse écrite à côté d'une ligne fausse (`mf-cor`), la ligne vide remplie
par la correction. Taper un réel enfonce « Oui ». Le bouton enfoncé est
rangé dans la question (`q.choisi`, que `CLE_HORS` écarte déjà de la clé de
`distinctes()`) : une pause le rend ; la case du réel revient par
`restoreBoxes`.

**Le soutien** ne juge qu'à la vérification, pour les deux nouveaux moteurs
(`soutienEnDirect.sans`) : trois vecteurs dans une liste, deux boutons —
colorer au choix, ce serait faire deviner. Les rappels (`RAP_KVX` par
identifiant, `RAP_KVI`, `RAP_KCO`) donnent la définition « il existe un
réel k tel que v⃗ = k u⃗ », le sens par le signe, la longueur par la valeur,
et la méthode des carreaux ; le contrôle des rappels a rougi au premier
passage sur « (−3/2) » écrit à plat : la fraction s'empile, et ce que
l'élève TAPE (« −3/2 ») est dans une balise `code`. Les messages en texte
écrivent les vecteurs sans flèche (« a », « AB ») : le caractère combinant
U+20D7 s'affichait comme un blanc dans le message du verdict — vu sur la
capture, invisible dans jsdom.
Le 8.3.3 s'appelait d'abord {identifier-multiple-fractions} : le contrôle des
fractions irréductibles démarre tout identifiant qui contient « fraction »,
et il a rougi au premier passage (« aucune fraction de départ reconnue ») —
à juste titre, ce n'est pas un calcul de fractions. L'identifiant est devenu
{identifier-multiple-non-entier} avant toute mise en ligne, plutôt qu'une
dispense qui aurait dit faux.

**Les bancs.** Le principal (`vecteursColineaires`, « vecteurs colinéaires ») :
les quatre places (8.3.1 à 8.3.4, les voisins immobiles, pas de bouton des
tables), les rappels et les questions à l'IA, `kvLit` sur onze écritures ;
au 8.3.1, deux cents tirages (clés rangées, coefficients, u⃗ dans le
quadrillage, chaque k u⃗ sur un nœud), le 8.1.7 et le 8.1.8 sans `ks`, une
figure fixe (u⃗ seul, ½ et −5/6 empilés dans l'énoncé et sous les flèches),
la copie juste après le JSON, puis 2u⃗ à l'envers, ½u⃗ trop long et le
dernier absent (bad, bad, sol, les deux pièges nommés, trois flèches
vertes) ; aux 8.3.2 et 8.3.3, deux cents tirages chacun (directions,
coefficients irréductibles et jamais 1, entiers ou non, flèches sur des
nœuds dans le quadrillage), la copie juste écrite à la virgule, au tiret et
en fraction, le rendu après JSON, la copie vide (douze corrections vertes,
rien de rouge), le bon coefficient devant le mauvais vecteur ; au 8.3.4,
deux cents tirages (paires distinctes, deux à quatre colinéaires, jamais 1,
une paire presque parallèle au moins, flèches dans le quadrillage), une
figure fixe, « Oui » enfoncé en tapant, les boutons rendus après le JSON, la
copie juste, puis « Oui » sans réel, « Non » sur des colinéaires et « Oui »
sur des presque parallèles (bad, bad, sol, bad, sol), aucune couleur de
verdict sur la case du réel, le pourquoi, la ligne vide remplie. Les
contrôles universels du banc navigateur (section 9) les visitent comme les
autres. Le geste du 8.3.1 à la vraie souris est celui du 8.1.7, que le banc
navigateur joue déjà (« 6 quadragies octies ») ; le nom empilé sous une
flèche, lui, ne se mesure qu'à l'œil.

**Puis le 8.3.1 a monté une échelle (v579 — v576 à v578 prises par les 8.3.2, 8.3.5 à 8.3.8 et 8.3.4 pendant les bancs).** Turquet, octobre 2026 : « en
seconde dans le 8.3.1, demander soit un multiple entier de u, et on doit
tracer k u, −u et −k u ; soit une fraction a/b de u, et on demande de tracer
1/b u puis −1/b u puis a/b u ». Les trois coefficients ne se tirent plus au
hasard parmi vingt-deux : ils forment une échelle, rangée dans `q.ks` DANS
L'ORDRE où ils se tracent (`tvxCourante` prend la première flèche sans
arrivée, l'ordre de la consigne suit). L'entier k va de 2 à 4
(`tvxKsEntier`) ; la fraction a/b est irréductible, b de 2 à 4, |a| de 2 à 5,
de signe tiré (`tvxKsFraction`) — ½, −½ puis −3/2, comme dans la demande.
`tvxGenK` lit le rang que lui passe `distinctes()` : l'entier aux questions
1, 3…, la fraction aux questions 2, 4… — une séance de trois questions a
toujours les deux sortes. u⃗ a pour composantes des multiples de b. L'énoncé
dit l'ordre (« un représentant du vecteur ½u⃗, puis du vecteur −½u⃗, puis… »),
et le rappel gagne un ⑤ : la fraction se construit par étapes. Rien d'autre
ne change — ni le juge, ni le geste, ni la clé (`tvxCleK`). Le banc principal
tient la nouvelle forme sur deux cents séances (l'échelle, et la sorte qui
suit le rang de la question).

**Puis le réel du 8.3.4 s'est écrit EMPILÉ** (demande de Turquet, octobre
2026, Seconde v578 : « dans le 8.3.4, il faut une écriture fractionnaire et
pas en ligne pour les fractions »). La case du réel était un `<input>` : l'élève
tapait « −3/4 » en ligne, à côté d'une correction (`mf-cor`) qui, elle,
empilait déjà. Elle est devenue une case MathLive (`pmMF('kco-in', …)`), où la
touche / pose le trait — la consigne le dit, et montre la fraction empilée au
lieu de « (−3/2) ». Trois endroits ont suivi, et en oublier un rendait la
fraction en ligne ou la réponse fausse :

* **la lecture** : `value` d'une case MathLive rend le texte de `toPlain`,
  « -(3)/(4) » ; `kvLit` retire les parenthèses, et lit aussi un `\frac{3}{4}`
  brut et le « {,} » décimal — le double du banc jsdom, qui ne convertit rien,
  rend le LaTeX tel quel ;
* **la correction** d'une ligne vide écrit `kvLatex(c)` (« -\frac{3}{4} »),
  plus `kvSaisie` : du texte posé dans MathLive s'y affiche en ligne ;
* **la reprise** d'une pause remet le texte rangé par `captureBoxes`
  (« -(3)/(4) ») : le setter de `pmAdapter` passe désormais par
  `pmVersLatex`, qui relève chaque « (a)/(b) » en `\frac{a}{b}`, du plus
  profond au plus large, et laisse intact un texte qui porte déjà du LaTeX.
  Ce setter sert toutes les cases `pm-mf` de la Seconde : une fraction tapée
  dans n'importe laquelle revenait en ligne après une pause, et revient
  empilée.

L'Entrée ne valide plus directement : comme dans toute case `pm-mf`, elle passe
à la case suivante, puis au bouton « Vérifier ». Le 8.3.3, dont les cases de
coefficient sont toujours des `<input>`, n'a pas changé — la demande ne
portait que sur le 8.3.4. Contrôles (banc principal) : la case du réel est un
`math-field`, la lecture de « -(3)/(4) », de `\frac` et de « 1{,}5 »,
`pmVersLatex`, et la correction écrite en `\frac`.

### Les 8.3.2 et 8.3.3 : la fraction s'EMPILE dans la case (v580 — v577 à v579 prises par les 8.3.5 à 8.3.8, le 8.3.4 et le 8.3.1)

Demande de Turquet, octobre 2026, sur le 8.3.3 : les flèches, les cases
étroites et le « × » (déjà faits en v576 par une session parallèle, voir
« La ligne se lit a⃗ = k × u⃗ » plus haut), et « une écriture fractionnaire
et pas en ligne pour les fractions ». Les deux travaux se sont croisés ;
la fusion garde celui-ci, qui reprend le cadre fléché (renommé `.kv-vsel`,
la flèche tracée en deux traits comme `.tpv-vc`, toujours effacée sur
« ? ») et remplace la case texte du coefficient. Le moteur `kvi` est
commun : le 8.3.2 suit.

* **Le coefficient est une case MathLive** (`pmMF('kv-mf', …)`) : la touche /
  EMPILE la fraction, et la case l'affiche empilée. Le travail croisait celui
  du 8.3.4 (v578, juste au-dessus) : à la fusion, ce moteur a pris les outils
  que le 8.3.4 venait de poser — `kvLit` qui lit « (−3)/(2) », `kvLatex` pour
  écrire la correction empilée, le setter de `pmAdapter` qui rend sa barre à
  une fraction reprise après une pause — et ses doublons (`kviLatex`, une
  retouche de `restoreBoxes`) sont partis. Le badge vert d'une case fausse,
  que `corrChoix` écrit en texte, est récrit en HTML par `kviBadge` (`kvHTML`
  pour le coefficient).
* **La liste du vecteur porte sa flèche DANS la case** : `.kv-vsel` l'enveloppe
  et trace la flèche par `::before`/`::after`, au-dessus de la lettre (un
  `<option>` n'a pas de HTML, et U+20D7 s'y affiche en blanc, voir plus haut).
  Elle prend la couleur du verdict (`:has(select.ok)`…). Le badge du vecteur
  sort de l'enveloppe, sans quoi la flèche se recentrerait sur les deux.
* **Les cases** : 50 px pour la liste, 46 px au moins pour le coefficient,
  qui grandit avec ce qu'on y écrit.
* **Le pourquoi s'écrit en HTML** : vecteurs fléchés (`tvxVecHTML`) et
  fractions empilées (`kvHTML`) ; la consigne du 8.3.3 empile son exemple.
Le banc principal exige les six lignes « case MathLive, ×, liste fléchée »
dans cet ordre, la fraction empilée de la consigne au 8.3.3, et la
fraction lue et écrite (`kvLatex`, `kvLit`). Vu dans Chromium : la fraction
tapée « −3/2 » s'empile, se juge, survit à la pause empilée.

### Les 8.3.2, 8.3.3 et 8.3.5 : les noms des flèches ne se chevauchent plus (v583 — v581 et v582 prises par les 8.3.1, 8.3.5, 8.3.6 et 8.3.9)

Demande de Turquet, octobre 2026, capture du 8.3.3 à l'appui : « il ne faut
pas que les écritures se chevauchent comme dans l'image avec a et b ». Deux
flèches verticales, a⃗ vers le haut et b⃗ vers le bas, posées à UNE colonne
l'une de l'autre : chacune écrit son nom à 17 px de son milieu, côté
perpendiculaire — a⃗ à droite de son trait, b⃗ à gauche du sien — et les deux
noms tombaient au même endroit. `kvPoser` ne tenait que l'écart des BOÎTES
des flèches, et son repli à un carreau (`kvPoser(…, 1)`) laissait passer ce
cas : 42 figures sur 3 000 tirages avaient deux noms l'un sur l'autre.

* **`kvPoser` prend un cinquième argument, `noms`** : chaque flèche n'est posée
  que si son nom (`kvNomCentre`, la position de `svcNomPos` en carreaux) se
  tient à l'écart des noms déjà posés (0,8 carreau en largeur, 0,9 en hauteur)
  et à un demi-carreau des traits déjà posés — et si aucun nom déjà posé ne
  touche son trait (`kvNomLibre`). Le 8.3.2/8.3.3 (`kvi`) et le 8.3.5 (`kss`)
  le passent ; le 8.3.4 (`kco`) écrit des lettres aux extrémités, pas des
  noms au milieu, et garde son placement.
* Après : 0 figure sur 3 000, et le repli de `kviGen` n'est jamais atteint.

Le banc principal (`vecteursColineaires`) relit, sur les deux cents tirages
de chaque exercice, les noms EN PIXELS par `svcNomPos`, comme le dessin les
pose : deux noms à moins de 24 × 27 px, ou un nom à moins de 15 px du trait
d'une autre flèche, et il rougit en nommant les deux lettres. Sur l'ancien
placement, 1,4 % de figures fautives par tirage : sur quatre cents tirages,
le contrôle l'attrape presque à coup sûr. Éprouvé par sabotage (le
placement d'avant rétabli au 8.3.2/8.3.3) : rouge, « 8.3.2 : le nom a sur
le trait de e ».

### Le 8.3.3 : une page d'entiers, PUIS des pages de fractions (v592 — v591 prise par le 8.3.7)

Demande de Turquet, octobre 2026 : « dans la 1re question mettre que des
multiplications avec des facteurs entiers positifs ou négatifs, puis dans
la deuxième question mettre des fractions comme coefficient multiplicateur
positif ou négatif ». Avant, chaque page mêlait les deux (quatre non
entiers au moins sur six).

* `kviBuildQuestions` lit le rang de la page (`distinctes` passe `i` à la
  fabrique) : la page 1 du 8.3.3 est tirée comme au 8.3.2 (`kviGen(false)`,
  sans `q.fr`, la consigne ne parle pas de fraction) ; les suivantes par
  `kviGen(true)`, qui n'admet plus aucun dénominateur 1. Les signes restent
  mêlés sur chaque page (le tirage l'exigeait déjà). Le repli des fractions
  a perdu son seul coefficient entier.
* Un devoir à plus de deux questions : la première en entiers, toutes les
  autres en fractions.
* Le 8.3.2 ne change pas ; la description du menu du 8.3.3 le dit.

Le banc principal relit chaque page de la séance (page 1 : que des entiers,
sans `q.fr` ; les suivantes : que des fractions, `q.fr`), et ses deux cents
tirages de `kviGen(true)` n'admettent plus un seul entier ; la copie juste
du 8.3.3 se joue sur la page de fractions. Mesuré à part : 3 000 tirages,
aucun entier sur une page de fractions, le repli jamais atteint.

### Le 8.3.1 : la flèche a/b u⃗ se DÉCOUPE en |a| morceaux (v582)

Demande de Turquet, octobre 2026 (écrite « 8.3.2 » — le seul exercice du
sous-thème où l'on DESSINE est le 8.3.1) : « quand on doit dessiner une
fraction d'un vecteur, par exemple a/b de u, découper le vecteur en question
en a morceaux à l'écran à l'aide de petits traits ». Chaque morceau vaut
1/b u⃗ — la flèche tracée en premier dans l'échelle — : −5/2 u⃗, ce sont cinq
−½u⃗ bout à bout, et l'élève le voit. `tvxGrad` pose |a| − 1 petits traits en
travers (14 px, classe `kv-grad`, la couleur de la flèche par son `-f`) sur
la flèche de l'élève, sur la correction verte, et sur la flèche qui suit la
souris pendant le tracé (`tvxVif`) — les traits se déplacent avec elle, et
chaque morceau se compare à la flèche 1/b u⃗ déjà posée. Rien pour un entier
ni pour ±1/b : un seul morceau. Le rappel ⑤ le dit. Contrôles (banc
principal, figure fixe) : la flèche −5/6 u⃗ de l'élève porte quatre traits,
ni 2u⃗ ni ½u⃗ n'en portent, et la correction verte −5/6 u⃗ en porte quatre
verts. Vu à l'œil dans Chromium (tracé en cours et après vérification).

**Puis u⃗ lui-même s'est découpé en b morceaux (v583 — v582 prise par le 8.3.5).** Turquet, le même
jour : « je veux que tu découpes aussi le vecteur u en b morceaux à l'écran ».
Le vecteur donné porte b − 1 petits traits à son encre (`svc-u-f`), posés par
`tvxSVG` dès l'affichage : le morceau 1/b u se lit sur u⃗ avant d'être tracé,
et se retrouve ensuite |a| fois sur la flèche a/b u⃗. b est le dénominateur
commun des trois coefficients (`tvxCoupes`, le découpage partagé avec
`tvxGrad`) : dans un vrai tirage, c'est celui de l'échelle ; la figure fixe
du banc (2, ½, −5/6) découpe u⃗ en six. Rien sur u⃗ à l'échelle des entiers.
Contrôle (banc principal) : cinq traits sur u⃗ dans la figure fixe. Vu à
l'œil dans Chromium (u⃗ en trois, −5/3 u⃗ en cinq).

## La suite du sous-thème 8.3, sans coordonnées — {colineaires-sens-longueur}, {placer-point-colineaire}, {phrase-relation-colineaire}, {milieux-parallele-vecteurs} (8.3.5 à 8.3.8, v577 — v576 prise par le 8.3.2 pendant la rédaction)

**La demande** (Turquet, octobre 2026) : sur quinze idées proposées pour
compléter la Fiche 1, « faire les 12, 13, 14 et 15 — je ne veux pas de
coordonnées de vecteurs ». Les idées à coordonnées (k u⃗ calculé, le
déterminant, l'alignement en repère) sont écartées ; les quatre retenues se
lisent sur un quadrillage, sur une figure ou sur une phrase. Rangées dans
l'ordre qui monte, à la suite du 8.3.4 : lire (8.3.5), construire (8.3.6),
traduire (8.3.7), démontrer (8.3.8). Rien ne se renumérote.

**Quatre moteurs, une même règle de jugement** : rien ne se colore avant
« Vérifier » (`soutienEnDirect.sans`) — des listes à deux ou trois choix,
des points à cliquer, une rédaction dont les cases se jugent ensemble. On
range les données, jamais la réponse ; tout se recalcule.

**8.3.5, même sens ou sens contraire ? plus long ou plus court ?** (`kss`).
Un u⃗ violet et quatre vecteurs dessinés qui lui sont colinéaires (le
tirage de `kviGen` : direction, multiple, réels dont le dénominateur divise
le multiple, `kvPoser`), puis trois vecteurs « sans dessin » donnés par leur
réel (e⃗ = −⅔u⃗). Deux listes par vecteur, quatorze cases par page, deux
pages. Les réels de chaque groupe montrent les quatre cas (`kssVarie`), et
le groupe sans dessin porte TOUJOURS un réel entre −1 et 0 : le piège visé
est « négatif donc plus court ». Le pourquoi lit le signe pour le sens, la
valeur sans le signe pour la longueur, et le nomme quand c'est lui.
Le contrôle a d'abord laissé passer un sabotage (« aussi long » jugé
« plus long ») : sa figure fixe n'avait pas de réel −1. Elle en a un.

**8.3.6, placer un point défini par une égalité** (`kpl`). Le geste, les
croix et les étiquettes du 8.1.12 (`tan`), d'où une géométrie de quadrillage
IDENTIQUE (écrite en nombres : `TAN_W` est déclaré plus bas dans la page, et
une constante lue avant sa déclaration lève une erreur au chargement). Deux
points A et B, AB⃗ d'au moins quatre carreaux — à deux carreaux, les trois
points se serraient sur un bout de droite (vu sur la première capture) —,
trois égalités `[origine, référence, numérateur, dénominateur]` : la
première page n'écrit que AM⃗ = kAB⃗, les suivantes partent aussi de B, ou
de BA⃗. Les pièges nommés : le mauvais côté (le signe), parti de l'autre
point, sur la droite à la mauvaise distance, hors de la droite. Les lettres
A et B se posent dans le prolongement de la flèche : à la place de celles du
8.1.12, la lettre de B tombait sur la pointe.

**Puis chaque point a eu son point de départ** (v581, demande de Turquet,
octobre 2026 : « pour chaque point M, N et P un point de départ différent C, D
et E ; les formules à trouver sont de la forme CM⃗ = kAB⃗ »). Trois points
C, D, E sont dessinés en plus de A et B, chacun tiré HORS de la droite (AB) :
M part de C, N de D, P de E, et le vecteur de référence reste AB⃗ (ou BA⃗
après la première page). M n'est donc plus sur (AB), mais sur la parallèle à
(AB) passant par C — le rappel, le pourquoi et le contexte du modèle le
disent ainsi. Une égalité se range `[référence, numérateur, dénominateur]`,
les départs dans `q.o` ; les jeux de lettres portent cinq lettres (A B C D E,
E F G H K, R S T U V, C D E F G). Le piège « parti de l'autre point » cherche
désormais parmi A, B et les deux autres départs. Un brouillon d'avant (sans
`q.o`) se tire à neuf au chargement plutôt que de planter. Le banc fixe la
figure A(3 ; 3), B(9 ; 3), C(2 ; 6), D(10 ; 8), E(5 ; 1) et éprouve la copie
juste, la mauvaise distance sur la parallèle, le départ pris en B, le mauvais
côté et le point hors de la parallèle.

**Puis le vecteur de l'élève s'est tracé** (v585, demande de Turquet,
octobre 2026 : « que le vecteur soit tracé entre le point de départ et le
point à placer quand l'élève déplace son point, et qu'il reste une fois le
point placé »). Pendant que la souris survole le quadrillage, une flèche
violette pâlie va du point de départ du point en cours au nœud survolé — le
nœud où le clic posera le point, pas la position exacte du pointeur
(`kplVif`, calque `#kplVif`). Une fois le point posé, sa flèche reste, violette
(`kplFlecheEleve`, dans `#kplEl`) ; à la vérification elle devient bleue si le
point est juste, rouge s'il est faux, à côté de la flèche verte de la
correction. Rien n'est tracé sur le point de départ lui-même (vecteur nul). Au
doigt, sans survol, la flèche n'apparaît qu'au point posé.

**Puis une égalité par question** (v593, demande de Turquet, octobre 2026 :
« faire une égalité par question et non trois ; une question avec une
multiplication par un entier positif, puis un entier négatif, puis une
fraction positive, puis une fraction négative ; on changera de vecteur et de
point de départ à chaque question »). La séance compte quatre questions
(`KPL_NB`), une famille de k chacune, dans cet ordre (`KPL_FAM` ; `kplGen(l,
f)`, f = i % 4) : 2 ou 3 ; −1, −2 ou −3 ; une fraction positive non entière ;
une fraction négative non entière. Chaque question a son jeu de trois lettres
(A B C, E F G, R S T, C D E), son vecteur et son point de départ, et un seul
point M à placer : CM⃗ = kAB⃗ (kBA⃗ possible après la première). AB⃗ peut
descendre à deux carreaux : avec k = 3, un vecteur de quatre carreaux
sortait du quadrillage. Le moteur garde ses tableaux (`q.o`, `q.r`, `q.p`),
de longueur 1, et lit tout sur `q.r.length` (`kplKs`) ; un brouillon à trois
égalités se tire à neuf au chargement. Le banc éprouve la famille de chaque
question sur deux cents tirages, la copie juste, le mauvais côté, le départ
pris en A, la mauvaise distance, le point hors de la parallèle, le point
vide et l'ancien brouillon.

**Puis la flèche dessinée a suivi l'égalité** (v595, demande de Turquet,
octobre 2026 : « le vecteur tracé sur le dessin doit correspondre à celui de
l'égalité de l'énoncé ; il aurait fallu tracer FE⃗ et non EF⃗ »). Quand
l'égalité prend BA⃗, la flèche des données va de B vers A ; sinon de A vers
B. Les lettres restent dans le prolongement du segment, de part et d'autre.
Le banc relit le sens de la flèche pour AB⃗ puis pour BA⃗.

**8.3.7, associer une phrase et une égalité** (`kph`). Treize phrases sur
trois points alignés, chacune son réel (milieu, tiers, quart, au-delà de B,
du côté opposé à B…), cinq par page ; six cartes AM⃗ = kAB⃗ lettrées a à f,
dont une de trop, prise de préférence comme l'OPPOSÉE d'un réel juste. Le
pourquoi traduit la phrase et la carte choisie en « côté de A, puis
longueur », côte à côte.

Puis les **dessins** (demande de Turquet, octobre 2026, v584) : chaque
égalité a le sien — A, B et M sur une droite horizontale, graduée au pas de
AB/d (d, dénominateur du réel), M en violet et nommé dessous. L'élève
associe chaque phrase à un dessin (I à VI), puis à une égalité : deux listes
par phrase, deux points ; le dessin de trop est celui de l'égalité de trop,
et l'ordre des dessins (`q.d`) se tire à part de celui des cartes. AB a la
même longueur dans les six dessins d'une page, celle qui loge le plus
large : à 90 px fixes, le leurre −3 sortait du cadre à la première capture
— le banc relit désormais l'abscisse de chaque nom, sur deux cents tirages.
Une pause d'avant les dessins n'a pas de `q.d` : `kphD()` en rend un ordre
fixe. Le même jour, un coefficient **sans fraction** (« 3 », « − », « −2 »)
s'est posé sur la ligne des lettres de son vecteur : `.kv-co` est en
`vertical-align:middle` pour centrer une fraction sur son trait, et un
entier seul descendait sous AB⃗ ; `kvHTML` lui ajoute `kv-ent`, aligné sur
la ligne de base — ce qui vaut pour tous les 8.3.

Puis **deux étapes** (demande de Turquet, octobre 2026, v591) : « demander
d'abord de faire correspondre chaque égalité au bon dessin en enlevant les
phrases ; quand toutes les égalités sont reliées au bon dessin, afficher
alors les phrases ». L'étape 1 : six égalités, une liste « dessin » chacune
(I à VI) — plus de dessin ni d'égalité de trop, la correspondance est
complète. Sa vérification compte ses six points mais NE VERROUILLE PAS : elle
range les choix dans la question (`q.e1`, `q.s1`), et la page se redessine à
l'étape 2 — chaque dessin porte alors son cas (« cas b · AM⃗ = −½AB⃗ »),
l'étape 1 reste à l'écran, corrigée et désactivée, et les cinq phrases
viennent dessous, une liste « cas » chacune ; le cas de trop est l'égalité de
trop. C'est la seconde vérification qui verrouille et pousse la réponse :
onze cases, 33 points sur trois questions. En soutien, l'étape 1 se
revérifie jusqu'à être juste ; en entraînement, la correction la complète en
vert. Pourquoi pas deux questions par page : la coupe d'un devoir
(`dmAppliquerNbQ`) garde les N premières ENTRÉES du tirage, elle aurait coupé
une paire en deux. Et pourquoi `q.e1` dans la question : une pause entre les
deux étapes reprend aux phrases, l'étape 1 telle que la vérification l'a
laissée, et un nouveau « Vérifier » n'y rejuge rien — le banc principal le
tient en rejouant la question depuis son JSON entre les deux étapes.

Puis **deux questions** (demande de Turquet, octobre 2026, v595) : « faire
cet exercice en 2 questions […] en laissant les égalités placées sur les
dessins avec les phrases juste en dessous ; on a donc supprimé de l'écran
les lignes a à f pour la question 2 ». La séance est une PAIRE sur un même
tirage : la question 1 (`q.et` 1) relie les égalités aux dessins ; la
question 2 (`q.et` 2) écrit chaque égalité sous son dessin (« cas b ·
AM⃗ = … ») et pose les cinq phrases dessous, sans les lignes a à f. Chacune
se vérifie, se verrouille et pousse sa réponse seule : 6 + 5 = 11 points.
`q.e1` et la vérification qui ne verrouillait pas disparaissent — la pause
redevient celle de tous les exercices. La coupe d'un devoir ne gêne plus :
chaque entrée se suffit à elle-même (la question 2 ne lit rien de la 1). Le
tirage fait ⌈N/2⌉ paires distinctes et garde N entrées ; le réglage
« Questions » compte donc les questions affichées.

**8.3.8, démontrer un parallélisme** (`kmi`). La démonstration du manuel,
en treize cases : IJ⃗ = IA⃗ + AJ⃗ = kBA⃗ + kAC⃗ = k(BA⃗ + AC⃗) = kBC⃗,
puis « colinéaires » et « parallèles ». Première page : les milieux (k = ½) ;
les suivantes, AI⃗ = kAB⃗ et AJ⃗ = kAC⃗, k tiré parmi ⅓, ⅔, ¼, ¾, 2, 3/2,
−½ (un k par page, `distinctes()` sur k). La figure est celle du 8.1.11
(`vmiSommets`), les côtés prolongés en pointillés quand I et J en sortent.
**Toute écriture juste est acceptée** : l'ordre des sommes, −kAB⃗ pour IA⃗,
−k(AB⃗ + CA⃗), −kCB⃗ ; une case de réel se juge avec le vecteur qu'elle
multiplie (devant AB⃗, IA⃗ attend −k). La première ligne doit passer par le
sommet : IB⃗ + BJ⃗ est vrai mais ne mène pas aux côtés, et le message le
dit. Sur la première capture, la conclusion écrivait ses vecteurs avec la
case-flèche des lignes (`.veg-v`) au milieu du texte : les flèches se
décalaient et la ligne se repliait ; elle les écrit en `.vgt-vec`.

**Les bancs.** Le principal (`vecteursColineairesSuite`) : les quatre
places et leurs voisins, les rappels et les questions à l'IA ; deux cents
tirages par moteur (réels, nœuds, quadrillage, points distincts, une carte
juste par phrase, k distincts) ; la copie juste après le JSON de la pause ;
la copie vide (rien de rouge, tout en vert) ; les pièges nommés ; au 8.3.8,
la rédaction du manuel ET une rédaction dans l'autre ordre avec les formes
opposées, chacune à 13 sur 13. Éprouvé par deux sabotages (un juge de
longueur faussé, une forme juste du 8.3.8 retirée), chacun attrapé.

### Le 8.3.8 : un exemple résolu avant l'énoncé, et les tiers, quarts et cinquièmes (v586 — v581 à v585 prises par les 8.3.1, 8.3.2, 8.3.3, 8.3.5, 8.3.6, 8.3.7 et 8.3.9 pendant les bancs)

**La demande** (Turquet, octobre 2026) : « mettre un exemple de démonstration
du même genre avant l'énoncé comme modèle pour l'élève, présenté avec les
mêmes étapes et les mêmes remarques à chaque étape que dans l'exercice » ; et
« des exercices avec 1/3 ou 1/4 ou 3/4, ou 1/5, 2/5, 3/5, 4/5, avec les mêmes
démonstrations ».

**L'exemple** (`kmiExemple`, `kmiExempleHTML`, posé dans `#kmiEx` juste avant
`#kmiInstr`) : un cadre violet en pointillés, étiqueté « Exemple », qui reprend
l'énoncé, une figure et les cinq lignes de la rédaction remplies, chacune avec
la remarque de la ligne correspondante de l'exercice (relation de Chasles,
chaque vecteur avec un côté du triangle, le réel en facteur, relation de
Chasles), puis la conclusion avec « colinéaires » et « parallèles ». Il n'a
aucune case et ne compte pas dans la note. Il se DÉDUIT de la question, sans
hasard : il ne change donc ni au redessin ni à la reprise d'une pause, et rien
de plus ne se range dans le brouillon. Le triangle est fixe ; ses lettres sont
les trois premières de `KMI_LETTRES` qui ne servent pas à la question ; ses
points sont l'autre paire (IJ ↔ MN) ; son réel est le suivant dans la même
famille que celui de la question (à la page des milieux, ce sont aussi des
milieux). Le modèle est donc le même geste, jamais la réponse recopiée. Le
contexte envoyé au modèle d'IA le mentionne, pour qu'il puisse y renvoyer
l'élève.

**Les réels** : trois familles (`KMI_FAM`). Page 1, les milieux ; page 2, un
tiers ou un quart (⅓, ⅔, ¼, ¾) ; page 3, un cinquième (⅕, ⅖, ⅗, ⅘) ; à partir
de la page 4, n'importe lequel des onze, y compris 2, 3/2 et −½ (les points
hors des côtés). `KMI_NB` passe de 3 à 4 démonstrations (52 cases au lieu de
39).

**Le banc** (`vecteursColineairesSuite`) : sur deux cents tirages, la page 2
dans la famille des tiers et des quarts, la page 3 dans celle des cinquièmes ;
l'exemple de chaque page a d'autres lettres, d'autres points et un autre réel
(des milieux à la page des milieux) ; à l'écran, l'exemple est placé juste
avant l'énoncé, a cinq lignes, quatre remarques, une figure, ses fractions
empilées et aucune case.

## {demontrer-colineaires} — démontrer un parallélisme, étape par étape (8.3.9, v581)

**La demande** (Turquet, octobre 2026) : « en seconde créer un exercice dans
vecteurs colinéaires comme le 8.2.13 mais avec en plus des multiplications de
vecteurs. La conclusion peut être donc les vecteurs sont colinéaires et donc
les droites sont parallèles. » Ajouté en dernier du sous-thème 8.3 : 8.3.9,
rien ne se renumérote. Les détails ci-dessous ont été décidés sans
aller-retour ; ils sont nommés pour pouvoir être repris.

**Ce qui le distingue du 8.3.8** ({milieux-parallele-vecteurs}), qui démontre
déjà IJ⃗ = kBC⃗ : la rédaction du 8.3.8 a ses étiquettes ÉCRITES au bout des
lignes ; celle-ci, comme au 8.2.13, fait CHOISIR la justification de chaque
ligne, et accepte toute rédaction juste qui suit le plan. Et elle a trois
plans, dont deux que le 8.3.8 n'a pas.

**Le moteur est celui du 8.2.13** (`dch`), recopié et non partagé : ses
lignes y sont des listes de vecteurs, elles sont ici des TERMES — un vecteur
seul, un réel et un vecteur (2BA⃗), un réel en facteur de deux vecteurs
(2(BA⃗ + AC⃗)). Chaque étape du plan dit sa justification et la FORME de sa
ligne (`'v'`, `'c'`, `'f'`), d'où les cases : la forme guide l'élève autant
qu'elle borne l'énumération.

**Trois plans** (`DCO_DEMOS`), sur le triangle ABC et les points D, E :
* **0** — AD⃗ = kAB⃗, AE⃗ = kAC⃗, k > 0 : DE⃗ = DA⃗ + AE⃗ = kBA⃗ + kAC⃗ =
  k(BA⃗ + AC⃗) = kBC⃗. La première page est l'exemple (k = 2, lettres ABCDE),
  la deuxième celle des MILIEUX (k = ½, l'énoncé dit « milieu du segment »,
  et DB⃗ = ½AB⃗ s'ajoute aux égalités) ;
* **1** — les mêmes avec k < 0 (la troisième page) : DA⃗ = |k|AB⃗ et
  AE⃗ = |k|CA⃗ ne s'enchaînent pas, il faut changer l'ordre avant de mettre
  en facteur : DE⃗ = |k|CB⃗ ;
* **2** — BD⃗ = kAB⃗, CE⃗ = kAC⃗ (la quatrième page) : DE⃗ = DB⃗ + BC⃗ + CE⃗
  (Chasles par DEUX points) = kBA⃗ + BC⃗ + kAC⃗ = BC⃗ + kBA⃗ + kAC⃗ =
  BC⃗ + k(BA⃗ + AC⃗) = BC⃗ + kBC⃗ = (1 + k)BC⃗ — « on additionne les réels
  devant un même vecteur ». C'est la ligne qui demande le plus : 30 cases.
Jamais k = −1 (DE⃗ = CB⃗ rendrait « de même longueur » vrai aussi), jamais
k = 1 au plan 2 (1BA⃗ + 1AC⃗ n'a pas de réel à mettre en facteur).

**Cinq justifications** (`DCO_JUST`) : relation de Chasles ; on utilise les
égalités de l'énoncé ; on change l'ordre de la somme ; on met le réel en
facteur ; on additionne les réels devant un même vecteur. Sans flèches dans
la liste, pour la même raison qu'au 8.2.13 (U+20D7 n'a pas de dessin dans la
police des `<option>`).

**Toute écriture juste qui suit le plan est acceptée** (`dcoChaines`, mémo
par plan et par réel, sur les lettres du plan) : Chasles passe par n'importe
quel point, par deux points d'un coup, ou réunit deux vecteurs qui
s'enchaînent, même entre parenthèses ; l'énoncé se lit dans les deux sens
(AD⃗ = 2AB⃗ donne DA⃗ = 2BA⃗) ; la dernière ligne, seule, s'écrit aussi
−kCB⃗. **Dans une somme, les réels sont positifs** — −2AB⃗ s'écrit 2BA⃗ — et
la consigne le dit : un « + −2AB⃗ » se lirait mal, et c'est exactement le
geste que le plan 1 fait travailler. Une case est juste s'il existe une
rédaction complète qui la porte avec les cases justes avant elle ; une
étape vraie qui ne mène nulle part (DE⃗ = DB⃗ + BE⃗ au plan 0) est fausse, et
le message le dit.

**Le réel est une case MathLive** (`pmMF('dco-co', …)`), comme aux 8.3.2 à
8.3.4 : la touche / empile la fraction ; la lecture passe par `kvLit`, la
correction d'une case vide par `kvLatex`, le badge d'une case fausse par
`kvHTML`. Le vecteur est la case fléchée du 8.1.11 (`.veg-in`), son badge
sort de la colonne flèche + case comme au 8.3.8. La conclusion reprend les
deux listes du 8.3.8 (`KMI_CONCL1`, `KMI_CONCL2`) : colinéaires, puis
parallèles.

**Les pièges nommés** (`dcoPourquoi`, sur la première case fausse) : le sens
oublié (DA⃗ = 2AB⃗ : « DA va dans le sens contraire de AD ») ; la ligne qui ne
vaut plus la précédente (lue en coordonnées libres, jamais montrées,
`dcoValeur`) ; l'étape juste sans issue ; l'égalité juste qui n'est pas
l'étape demandée ; la mauvaise justification ; un réel ou un vecteur
illisible ; la conclusion « égaux » ou « sécantes ».

**On range le plan, le réel, les lettres et la tournure** (`t`, `k`, `n`,
`v`, et `mil`), jamais les réponses. `distinctes()` sur (plan, réel,
milieux) : une séance ne pose jamais deux fois la même démonstration.

**Le banc** (`demontrerColineaires`, banc principal) a un juge qui ne lit
PAS les plans : il place A, B, C au hasard, construit D et E d'après
l'énoncé, et vérifie en nombres, sur 200 séances, que chaque ligne de chaque
rédaction acceptée vaut DE⃗, que la dernière est un réel fois BC⃗, qu'aucune
somme n'écrit de réel négatif, que k n'est jamais ±1 et que les trois plans
sortent. Puis, par le bouton : l'énoncé, la case MathLive, la copie juste
(17 cases), une autre écriture juste (minuscules, « (2)/(1) », −2CB⃗), sept
pièges peints en rouge et nommés, le badge, la case et la liste vides en
correction, la copie vide sans rouge, le JSON, le soutien qui peint sans
révéler ni verrouiller ; le plan à regrouper juste à 30 cases, et
« BC + 2BC = 2BC » nommé ; enfin le contexte du modèle.
Éprouvé par deux sabotages, chacun attrapé : l'énoncé lu sans changer le
sens d'un vecteur retourné (plus aucune rédaction acceptée), et le message
du sens oublié réécrit (le piège n'est plus nommé).

## 8.3.5 : la définition, puis vrai ou faux sur deux vecteurs — six situations en tête de séance (v582)

**La demande** (Turquet, octobre 2026) : « dans le 8.3.5, donner la
définition de deux vecteurs colinéaires, puis donner deux vecteurs à l'écran
et demander de compléter par vrai ou faux : ces deux vecteurs ont la même
direction ; ces vecteurs ont le même sens, quand on a donné deux vecteurs de
même direction ; ces vecteurs ont la même longueur ; ces vecteurs sont
colinéaires. On évaluera toutes les situations possibles. »

**Ajoutée, pas substituée.** Les deux pages du sens et de la longueur de
k u⃗ restent : elles SUIVENT. La séance s'ouvre sur six pages de vrai ou
faux (`q.t === 'vf'`), une par situation de `KSS_SIT`, dans un ordre tiré :
égaux ; même direction et même sens, autre longueur ; opposés ; même
direction, sens contraire, autre longueur ; directions différentes, même
longueur (v⃗ est u⃗ tourné d'un quart de tour ou retourné en miroir) ;
directions différentes, autres longueurs (une fois sur deux, deux flèches
PRESQUE parallèles — le piège du 8.3.4). Huit pages, 50 points :
4 × 4 + 2 × 3 = 22 pour le vrai ou faux, 28 pour la suite. Le réglage
« Questions » d'un devoir coupe dans cet ordre : à 3, trois situations
tirées ; au-delà de 8, des pages de k u⃗ en plus.

**La définition** s'écrit en tête de chaque page, encadrée de violet :
v⃗ = k u⃗, et pour deux vecteurs non nuls, la même direction. La quatrième
affirmation (« colinéaires ») a donc toujours la réponse de la première —
c'est le sujet de la page, et le pourquoi le dit (« par la définition… »).

**Le sens ne se demande qu'à deux vecteurs de même direction — et c'est un
piège pour la page elle-même.** Une ligne « même sens » posée d'office sur
les quatre pages de même direction, absente des deux autres, aurait donné
la réponse aux affirmations de direction et de colinéarité dès le premier
coup d'œil. Elle s'ouvre donc quand l'élève répond « Vrai » à la direction —
une règle CSS `:has(#kss-vd option[value="v"]:checked)`, sans variable : la
reprise d'une pause remet la valeur, la ligne se rouvre d'elle-même. La
vérification tranche ensuite : de même direction, la ligne s'ouvre
(`kss-on`) et se juge — laissée fermée par un « Faux », elle reçoit la
correction verte et ne compte pas juste ; de directions différentes, elle
se ferme (`kss-off`) et sort de la note (`kssVfCases` : trois cases).

**Le pourquoi** lit les chemins (`vecMots`) : un réel k commun pour la
direction, son signe pour le sens, sa valeur sans le signe pour la
longueur ; deux flèches de directions différentes se comparent par
Pythagore (« u mesure √20 carreaux »). Sous la page corrigée :
« v⃗ = −2u⃗ : ils sont colinéaires », ou « aucun réel k… ».

**Contrôlés** (`tests/verifier.js`, la section des 8.3.5 à 8.3.8) : sur deux
cents séances, les six situations en tête, chacune celle qu'elle dit, ses
flèches dans le quadrillage, le réel k qui donne bien v⃗ = k u⃗ ; la ligne
du sens fermée avant toute réponse, ouverte par « Vrai » ; une copie juste
à 4 points ; une copie vide qui ne rougit pas et rouvre la ligne du sens
pour la corriger ; « Vrai » à la direction de deux vecteurs non parallèles,
rouge, ligne du sens refermée et hors note ; le pourquoi par Pythagore.

## 8.3.5 : les deux vecteurs seulement, et le coefficient k u⃗ sur sa ligne (v587 — v583 à v586 prises par les 8.3.1, 8.3.2, 8.3.3, 8.3.5, 8.3.6, 8.3.7 et 8.3.8 pendant les bancs)

**La demande** (Turquet, octobre 2026, une capture de la correction
« v⃗ = 3u⃗ : ils sont colinéaires » à l'appui) : « dans la correction le
facteur est mal centré verticalement. Vérifier pour tous les exercices de
vecteur colinéaire qu'il n'y ait pas ce problème. » Puis : « supprimer les
questions 7 et 8. Je ne veux que les questions avec 2 vecteurs. »

**Le coefficient.** `kvHTML()` écrit « −3u⃗ » ou « ⅔u⃗ » dans un
`.kv-co`, un `inline-flex` centré (`align-items:center`,
`vertical-align:middle`) — fait pour poser le signe sur le trait d'une
fraction. Mais la lettre `.vec` réserve au-dessus d'elle la place de sa
flèche (`padding-top:.45em`) : centrée avec le 3, sa boîte montait le 3 et
descendait le u⃗ — 4 px sous le v⃗ dans la capture ; et « middle » posait
encore le tout 1 à 2 px sous la ligne. Même défaut partout où `kvHTML()`
écrit un réel avec ou sans lettre : 8.3.1 à 8.3.9, les rappels, les
corrections. Deux règles le tiennent : sans fraction, le `.kv-co` s'aligne
sur la ligne d'écriture (`align-items:baseline; vertical-align:baseline` —
le réel, le signe et la lettre retombent sur la ligne du texte, mesuré à
0 px) ; avec une fraction, la lettre se centre sur le trait sans compter sa
flèche (`margin-top:-.45em`, la flèche déborde vers le haut, dans la hauteur
de la fraction) — de 2,9 px à 0,9 px du trait.

**Contrôlé partout** (`tests/navigateur.js`, section 9, après la
vérification qui écrit les corrections) : sur chaque `.kv-co` visible, une
sonde vide posée dans chaque morceau — son bas EST la ligne d'écriture —
doit tomber à 1 px de celle du texte qui précède ; la lettre d'un
coefficient fractionnaire, à 2 px du trait. Un niveau sans `kvHTML` le
déclare non applicable.

**Les questions 7 et 8 retirées.** Les deux pages « u⃗ et sept vecteurs
colinéaires, dessinés ou donnés par leur réel » qui suivaient les six
situations du vrai ou faux ne se tirent plus : la séance est faite des six
situations, et d'elles seules (6 pages, 22 points). Un devoir qui demande
plus de six pages reprend les situations, sur d'autres vecteurs
(`distinctes()` l'assure). Le générateur `kssGen` et ses réels sont partis ;
le rendu et le juge de ces pages restent (`renderKssKu`, `kssCases`) : un
brouillon de pause d'avant peut en porter une, et le banc les tient encore.

## {demontrer-egalite-reels} — démontrer une égalité avec des réels (8.3.10, v596 — v595 prise sur main par les 8.3.6 et 8.3.7 pendant les bancs)

**La demande** (Turquet, octobre 2026) : « créer un exercice comme le 8.2.13
mais avec en plus, dans la formule à démontrer, des coefficients devant
certains vecteurs. Il faudra aussi présenter un dessin avec les vecteurs de
l'égalité à démontrer. » Rangé en dernier du sous-thème des vecteurs
colinéaires : c'est là que le produit d'un vecteur par un réel s'enseigne, et
le 8.3.9 y fait déjà le même geste. 8.3.10, rien ne se renumérote. Les détails
ci-dessous ont été décidés sans aller-retour ; ils sont nommés pour pouvoir
être repris.

**La mise en page est celle du 8.2.13, les lignes celles du 8.3.9.** On part
du membre de gauche ; chaque ligne a ses cases et sa justification à choisir ;
la dernière ligne est le membre de droite, déjà écrit (on sait où l'on va),
et n'a que sa justification. Les lignes sont des TERMES « réel × vecteur »
(`dcoT`, `dcoG`, partagés avec le 8.3.9), et la forme de chaque ligne (`'v'`,
`'c'`, `'f'`) donne ses cases. Les réels sont des entiers, dans une case
MathLive comme au 8.3.9 (`pmMF('dco-co', …)`, même règle CSS).

**Dix plans** (`DCR_DEMOS`), sur A, B, C (et D) :
* **0** — l'exemple, toujours en première page, avec ses lettres :
  3AB⃗ − 2CB⃗ = AB⃗ + 2AC⃗ — 3AB⃗ + 2BC⃗ = AB⃗ + 2AB⃗ + 2BC⃗ =
  AB⃗ + 2(AB⃗ + BC⃗) = AB⃗ + 2AC⃗ (17 cases) ;
* **1** — 2AB⃗ + BC⃗ = AB⃗ + AC⃗ ; **2** — 3AB⃗ + 3BC⃗ = 3AC⃗ ;
  **3** — 2AB⃗ + 3BC⃗ = 2AC⃗ + BC⃗ ; **4** — 2AB⃗ + BC⃗ + CD⃗ = AB⃗ + AD⃗
  (quatre points, deux rédactions) ; **5** — 3AB⃗ − AC⃗ = 2AB⃗ + CB⃗ (il faut
  changer l'ordre avant Chasles) ;
* **6** et **7**, sur un parallélogramme : 2AB⃗ + 2AD⃗ = 2AC⃗ ;
  2AB⃗ + BC⃗ = AC⃗ + DC⃗ ;
* **8** — 2(AB⃗ + BC⃗) = AB⃗ + AC⃗ + BC⃗ (on développe) ;
  **9** — AB⃗ + BC⃗ + 2AC⃗ = 3AC⃗ (on additionne les réels).
Les lettres se renomment (sans I, O ni Q), la tournure se tire ;
`distinctes()` avec le plan pour clé : jamais deux fois la même
démonstration dans une séance.

**Huit justifications** (`DCR_JUST`) : relation de Chasles ; on change l'ordre
de la somme ; soustraire un vecteur, c'est ajouter son opposé ; on écrit un
réel comme une somme (3 = 2 + 1) ; on additionne les réels devant un même
vecteur ; on met le réel en facteur ; on développe ; vecteurs égaux car ABCD
est un parallélogramme — la dernière n'est proposée que sur un
parallélogramme, et porte son nom. Sans flèches dans la liste, pour la raison
du 8.2.13.

**Toute écriture juste qui suit le plan est acceptée** (`dcrChaines`, mémo par
plan, sur les lettres du plan, puis renommé) : chaque ligne se tire de la
précédente par sa justification (`dcrSuites`) et a la forme demandée ; la
dernière étape doit mener au membre de droite, à l'ordre près. Une case est
juste s'il existe une rédaction complète qui la porte avec les cases justes
avant elle ; une justification l'est dès qu'elle explique le passage
(`dcrExplique`). **Dans une ligne, les réels sont positifs** : −2CB⃗ s'écrit
2BC⃗ — c'est le geste de la première ligne de l'exemple, et l'énoncé le dit.

**Les pièges nommés** (`dcrPourquoi`, sur la première case fausse) : le sens
oublié en passant à l'opposé (− 2CB⃗ devenu + 2CB⃗) ; un réel négatif dans une
ligne ; la ligne qui ne vaut plus le membre de gauche (lue en coordonnées
libres, jamais montrées) ; l'étape juste sans issue (sur le parallélogramme,
2AB⃗ → 2DC⃗ est vrai, mais 2(DC⃗ + AD⃗) ne se réunit pas) ; l'égalité juste qui
n'est pas l'étape demandée ; la mauvaise justification ; un réel ou un vecteur
illisible. Chaque règle est dite avec les lettres de la page (`dcrRegle`).

**Le dessin** (`dcrSvg`), au-dessus de la rédaction : les points de l'énoncé
et une flèche par vecteur de l'égalité, sans son réel — 3AB⃗ se lit sur la
flèche AB⃗ (pour l'exemple : AB⃗, CB⃗, AC⃗) ; sur un parallélogramme, ses côtés
en pointillés. La forme se tire parmi quelques gabarits (`DCR_FIG`, `q.f`),
retournée ou non (`q.m`) ; les lettres se posent à l'opposé du centre de la
figure.

**On range le plan, les lettres, la tournure et la figure** (`t`, `n`, `v`,
`f`, `m`), jamais les réponses.

**Le banc** (`demontrerEgaliteReels`, banc principal) a un juge qui ne lit PAS
les plans : il place les points au hasard (le quatrième sommet d'un
parallélogramme par la règle du parallélogramme) et vérifie, en nombres, sur
200 séances, que chaque égalité est vraie et porte un réel, que chaque ligne
de chaque rédaction acceptée vaut le membre de gauche, qu'aucune ligne n'a de
réel négatif, que les dix plans sortent et jamais deux fois. Puis, par le
bouton, sur l'exemple : l'énoncé, la figure (trois points, les flèches AB⃗,
AC⃗, CB⃗), la liste à sept justifications, la dernière ligne écrite, la copie
juste (17 cases), une autre écriture (minuscules, « (3)/(1) »), sept pièges
peints en rouge et nommés, le badge, la case et la liste vides en correction,
la copie vide sans rouge, le JSON, le soutien qui peint sans révéler ni
verrouiller ; sur le parallélogramme EFGH : l'énoncé, ses pointillés, la
justification qui porte son nom, la copie juste (10 cases), 2HG⃗ + 2EH⃗ « ne
mène pas » ; enfin le contexte du modèle. Le barème d'une séance dépend des
plans tirés (5 à 17 cases) : l'exercice se déclare dans
`reglagesDevoirs.baremeParCases`, comme le 8.2.13 et le 8.3.9.
