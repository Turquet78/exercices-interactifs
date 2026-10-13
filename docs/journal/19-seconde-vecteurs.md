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

## {vecteurs-egaux} — retrouver les vecteurs égaux dans une figure (8.2, v474)

**Deux sessions ont créé le thème 8 le même jour** — la translation du 8.1
et cet exercice, chacune voyant un thème « Vecteurs » neuf sur sa branche,
chacune en v473, chacune avec SON `19-seconde-vecteurs.md` : le motif du
thème 7 (7.1 et 7.2, septembre 2026), à l'identique. La seconde arrivée sur
`main` prend la place 8.2 et le numéro 474, et les deux chroniques vivent
dans ce seul fichier. Les préfixes (`vtr`, `veg`) ne se sont pas heurtés ;
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
place (8.2 derrière la translation du 8.1, le thème 7 immobile, pas de bouton des tables) ; chaque forme
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
