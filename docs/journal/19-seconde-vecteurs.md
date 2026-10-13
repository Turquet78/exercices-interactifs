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
