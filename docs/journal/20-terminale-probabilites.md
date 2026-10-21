# Terminale — probabilités (thème 6)

## {arbre-probabilites} (6.1.1) : l'arbre pondéré, tous les calculs

Demande de Turquet (octobre 2026) : « en terminale créer un thème probabilité
et un sous-thème arbre de probabilité ; créer un exercice permettant de tester
les élèves sur tous les types de calcul dans un arbre, comme sur le pdf ». Le
PDF n'était pas joint à la session : l'exercice suit les calculs classiques
d'un arbre pondéré de Terminale, et se reprendra sur la fiche si elle diffère.

**Le thème 6 « Probabilités » est découpé en parties dès sa naissance**, comme
ceux de l'Étude de fonction et des Suites : la partie 1 « Arbre de
probabilité » porte l'exercice, et la suivante s'ajoutera sans renuméroter.

**Trois questions par séance, une par FAMILLE — ce que l'énoncé DONNE change,
donc le chemin de calcul aussi.** Une situation concrète (usine, dépistage,
magasin, bus, lycée — chacune avec ses viviers de pourcentages, pour que la
scène reste vraisemblable : un test de dépistage positif à 90 % chez les
malades, pas à 15 %), deux événements, l'arbre A/Ā puis B/B̄ :

* **direct** — P(A), P_A(B), P_Ā(B) donnés : compléter l'arbre (somme 1 à
  chaque nœud), P(A∩B), P(Ā∩B̄) (multiplier le long d'un chemin), P(B)
  (probabilités totales), P_B(A) ≈ (remonter l'arbre) ;
* **inter** — P(A), P(A∩B), P_Ā(B) : la branche P_A(B) se retrouve par
  DIVISION, puis le reste, et P_B(Ā) ≈ ;
* **inverse** — P(A), P_A(B), P(B) : la branche P_Ā(B) se retrouve en
  soustrayant (P(Ā∩B) = P(B) − P(A∩B)) puis en divisant par P(Ā) ; la séance
  finit par une conditionnelle sachant B̄.

**Tout se calcule en entiers.** Les données sont des pourcentages entiers
(centièmes) ; intersections et probabilité totale sont des dix-millièmes
entiers (`apbVal`). Les réponses exactes sont des décimaux à quatre chiffres
au plus, jugées à 10⁻⁹ près — aucune erreur flottante ne peut rougir une copie
juste. Seule la dernière ligne, un quotient, porte « ≈ » : arrondi au
millième (l'arrondi de la saisie au millième doit être celui de la valeur, et
l'écart sous 0,0006) ; la valeur exacte en fraction y est acceptée aussi. Le
juge (`apbLireNb`) ne lit qu'un décimal ou un quotient de deux décimaux : un
produit tapé (« 0,4 × 0,3 ») n'est pas une réponse.

**L'arbre recopie les cases.** Les lignes qui remplissent une branche
(`br`) écrivent leur saisie sur le dessin pendant que l'élève tape (« … » tant
que la case est vide) ; à la vérification, chaque branche fausse ou vide y
prend la bonne valeur, en vert. L'arbre est un SVG construit par la page (pas
un fichier de `dessins/`) : comme celui du 3.9 de la Première, il dépend des
nombres tirés.

**Un bord vu en ouvrant la page sur un téléphone** : une case jamais tapée n'a
pas de largeur posée (`sa2Ajuster` ne joue qu'à la saisie), et la correction
écrite par `corrCase` non plus — l'input nu prenait sa largeur par défaut et
repliait sa rangée sous l'étiquette. Le rendu et la correction ajustent donc
chaque case.

## {arbre-probabilites-fiche} (6.1.2) : l'arbre de la fiche, les cinq situations

Demande de Turquet (octobre 2026), avec la « fiche 2 — tous les exercices avec
un arbre » : « les exercices ne donnent que les probabilités, comme dans les
exercices 2 à 5 du pdf — il n'y a donc pas de phrase ; la première question
est compléter l'arbre avec les probabilités données et les probabilités
contraires qu'il est possible de trouver ; l'arbre a la présentation du pdf,
P(A) = … et P_A(B) = … sur les branches, P(A ∩ B) = … au bout des quatre
chemins, P(B) = … avec l'accolade et le + ; les questions suivantes font
calculer comme les cinq exercices, dans un champ où l'élève écrit son
opération, les étapes s'il y en a, et le résultat — pas de formule avec des
lettres, sauf en fonction de x ; le clavier adapté ; les lettres varient ; les
cinq situations sont présentes ».

**La séance EST la fiche** : cinq questions, la situation k en question k
(`apfGenSession`). Ce que chacune donne, et ce qu'elle fait calculer :
1. P(A), P_A(B̄), P_Ā(B) → P(A∩B), P(Ā∩B), P(B), P_B(A) ;
2. P(A), P(A∩B), P(Ā∩B) → P_A(B), P_Ā(B), P(B), P_B(A) ;
3. P(A), P(B), P(A∩B) → P_A(B), P(Ā∩B), P_Ā(B) ;
4. P_A(B), P_Ā(B), P(A) = x → démontrer P(B) = (p − q)x + q, puis, P(B)
   donné, l'équation et x ;
5. P_A(B), P_Ā(B), P(B) → on pose P(A) = x : P(B) en fonction de x,
   l'équation, et P(A).
Les nombres de la fiche ne sont pas repris (celle du 5 est même incohérente :
P(B) = 0,18 avec P_A(B) = 0,9 et P_Ā(B) = 0,7 est impossible) ; ils sont
tirés en centièmes, de sorte que chaque division de la fiche tombe juste —
sauf P_B(A), qui s'arrondit (« ≈ »).

**Le a) n'ouvre que ce qui s'écrit sans calcul** (`apfArbreCases`) : les
données, à leur place sur l'arbre (une intersection donnée va au bout de son
chemin, P(B) donné dans la case de l'accolade), et leurs contraires. Les autres
cases restent « … ». En situation 4, P(A) = x et P(Ā) = 1 − x s'écrivent dans
l'arbre : ces deux cases-là lisent x.

**L'arbre est une grille, et ses traits se posent sur la grille rendue.**
Huit demi-rangées : Ω au milieu, A et Ā aux quarts, les quatre fins de chemin
aux huitièmes impairs ; chaque étiquette de branche est dans la demi-rangée
au-dessus (branche qui monte) ou au-dessous (branche qui descend) de son
trait, si bien qu'aucun trait ne la traverse. Les traits, les flèches et
l'accolade sont un SVG recalculé par `apfTraits()` sur les rectangles RENDUS,
à chaque changement de taille (ResizeObserver) : une case s'élargit avec la
saisie, la correction s'écrit à côté — un dessin à coordonnées fixes
décrocherait. Plus large qu'un téléphone, l'arbre défile dans son cadre ; la
page, elle, ne défile pas en largeur (mesuré à 390 px).

**Le juge d'une ligne de calcul** (`apfJugeChaine`) découpe la ligne aux « = »
et « ≈ », lit chaque membre (+ − × ÷ et parenthèses, la virgule, la
multiplication implicite ; « 0,4x0,9 » tapé au clavier est un produit) et
exige : chaque membre vaut la réponse (au 10⁻⁹ près ; après « ≈ », à la
précision des décimales écrites, deux au moins) ; le dernier est un nombre ou
une fraction ; et il y a un calcul — un résultat seul est refusé, la consigne
dit « en détaillant les étapes ». La raison s'affiche sous la vérification. En
fonction de x (`apfJugeDemo`), chaque membre est comparé à la cible en trois
valeurs de x, et le dernier doit être réduit ; l'équation (`apfJugeEq`) est
acceptée sous toute forme linéaire dont la solution est la bonne. Les
corrections que la page écrit passent par ce même juge — vérifié sur les cinq
situations : une copie faite des corrections est parfaite.

**Le clavier** : chaque case porte ses touches (`data-pave-plus`) — + × ( ) =
≈, et x là où l'on calcule en fonction de x — que le pavé des tablettes pose
sur sa seconde rangée ; et une rangée de jetons sous les calculs sert
l'ordinateur, dont le clavier n'a ni ×, ni ÷, ni ≈.

**Puis la barre des contraires est montée, et la résolution s'est écrite ligne
par ligne** (demande de Turquet, octobre 2026 : « les barres au-dessus des
lettres un peu plus haut ; quand on doit résoudre une équation pour trouver x,
des champs de la forme … = … par ligne, avec deux lignes ; Entrée crée une
nouvelle ligne »).
- La barre de `i.apb-nb` n'est plus un `text-decoration: overline`, que le
  navigateur colle au ras de la lettre : c'est un trait (`::before`) posé en
  haut d'une boîte `inline-block` rembourrée de 0,3 em — la recette de
  `i.pb-bar` en Première. Le 6.1.1 en profite aussi.
- Aux situations 4 et 5, « Équation : [ … ] » et « P(A) = x = [ … ] » sont
  devenus UN bloc de résolution (`t:'resol'`) : chaque ligne est
  « [ … ] = [ … ] », deux lignes au départ ; Entrée dans la case de gauche
  passe à droite, dans celle de droite passe à la ligne suivante — créée si
  c'est la dernière (le gestionnaire est en capture et arrête la touche :
  `navCases` l'aurait envoyée au bouton Vérifier). Le nombre de lignes est
  rangé dans la question (`q.nLig`), pour la reprise après une pause.
- Le juge du bloc (`apfJugeResol`) : chaque ligne remplie est une équation
  ÉQUIVALENTE à celle de l'énoncé — linéaire, même solution —, la dernière
  donne « x = nombre », et il en faut deux au moins (l'équation, puis sa
  solution : « x = 0,2 » seul ne démontre rien). Une ligne laissée vide n'est
  pas une faute ; il manque la conclusion ? la première ligne vide qui suit
  reçoit « x = … » en vert, et l'équation, si la ligne 1 est vide. Sous les
  lignes, la résolution entière s'écrit en vert.

**Puis les x TAPÉS se sont écrits en italique arrondi** (demande de Turquet,
octobre 2026 : « écrire les x en italique, pour avoir un caractère aux traits
arrondis »). Dans le texte, le filet `italiquerX` les tenait déjà ; restaient
les CASES — ce que l'élève tape, et les corrections que la page y écrit. Une
case de saisie ne met pas une lettre dans une balise : c'est la police qui le
fait. La police « ApfX » ne couvre que le caractère x (`unicode-range:
U+0078`) et le prend dans `KaTeX_Math-Italic.woff2`, déjà chargée pour
MathLive ; placée en tête de la pile des cases du 6.1.2, elle ne sert que le
x — chiffres et signes restent en Nunito, et le curseur suit le vrai texte
(rien n'est superposé à la case). Un piège pour le vérifier : le banc
navigateur sert la bibliothèque `mathlive@0.110.0` depuis son cache, et
TOUTES les fontes KaTeX y sont alors en échec — celle du texte comme
celle-ci. Pour voir le rendu, il faut servir le fichier de la fonte à la page
(`page.route`).

## {arbre-probabilites-bac} (6.1.3) : l'exercice de bac, la formule avant le calcul

Demande de Turquet (octobre 2026), avec la « fiche 5 — probabilité bac »
(fiabilité d'un test de dépistage : 5 % de malades, P_M(T) = 0,9,
P_M̄(T̄) = 0,8 ; démontrer P(T) = 0,235, P_T(M) à 0,01 près, la probabilité
d'un résultat erroné) : « quand on demande de compléter l'arbre, un arbre
présenté comme le 6.1.2 ; l'élève choisit d'abord l'événement de la première
branche, le programme complète alors toutes les formules littérales de
l'arbre avec les deux lettres de l'exercice ; puis l'élève complète l'arbre
avec les valeurs comme au 6.1.2. Pour chaque question suivante, l'élève
trouve la bonne formule littérale parmi des propositions, puis la réponse se
présente comme au 6.1.2. Une proposition peut être “en posant P(A) = x et en
exprimant P(B) en fonction de x” : on présente alors P(B) en fonction de x,
puis la résolution de l'équation, comme au 6.1.2. »

**Un énoncé en phrases, cinq mises en situation** (`APC_CTX`) : dépistage
(M/T), filtre anti-spam (S/F), contrôle de pièces (D/R), carte de fidélité
(C/A), pluie et bus (J/R). Chacune porte ses lettres, ses phrases (au
subjonctif après « la probabilité que », à l'indicatif après « sachant que »,
élidées par `apcQue` : « sachant qu'il pleut »), ses viviers de pourcentages,
et la forme de sa seconde donnée — P_Ā(B̄) comme sur la fiche, ou P_Ā(B).
Trois exercices par séance, trois mises en situation différentes.

**Les questions** : a) démontrer P(B) = … ; b) une conditionnelle à
« remonter », P_B(A) ou P_B̄(Ā), à 0,01 près ; c) la probabilité d'un
résultat erroné (là où la situation en a un) ou, une fois par séance au
moins, P(A) inconnue avec P(B) donné — la question « on pose x ».

**Un choix se juge au clic, parce qu'il ouvre la suite.** L'événement des
premières branches ouvre l'arbre (la grille du 6.1.2, factorisée :
`apfGrilleHTML(pre, …)`, `apfTraits(pre)`) ; la formule d'une question ouvre
ses lignes de calcul. Choisie juste : bleue ; fausse : rouge, et la bonne
montrée en vert, en tirets, avec une phrase qui dit pourquoi. En soutien,
l'élève rechoisit ; ailleurs, le premier choix est définitif. Chaque choix
compte UNE réponse dans la note (`pts-case` sur la carte choisie, la
correction montrée est `hors-note`) ; un choix jamais fait reçoit, à la
vérification, la bonne carte en `pts-case sol` — compté non juste — et ses
lignes s'ouvrent pour recevoir leur correction. L'état des choix vit dans la
question (`q.ch`) : la reprise après une pause les redessine, avec ce qu'ils
avaient ouvert.

**Les juges sont ceux du 6.1.2** : `apfJugeChaine` pour chaque calcul (« ≈ »
à deux décimales au moins pour un arrondi), `apfJugeDemo` pour P(B) en
fonction de x, et la résolution ligne par ligne par `apfJugeResolL(l, n,
pre)` — le juge du 6.1.2 sorti de ses identifiants. Les cases de l'arbre
acceptent aussi le pourcentage de l'énoncé : « 5 % » vaut 0,05. Une copie
faite des corrections de la page est parfaite (essayé dans Chromium, à
1280 px et à 390 px).

**Puis la question est devenue une phrase, et l'élève choisit l'ÉCRITURE,
plus la formule** (demande de Turquet, octobre 2026 : « des énoncés sous forme
de phrase, et l'élève doit simplement choisir la bonne écriture littérale,
par exemple P(L), P(L ∩ M) ou P_M(L), avant de faire les calculs »). Les
questions n'écrivent plus aucun P(…) : « Démontrer que la probabilité que le
test soit positif est égale à 0,235 », « Déterminer la probabilité que la
personne soit malade ». Les quatre cartes proposent l'écriture de la
probabilité cherchée, avec les pièges de la fiche 4 : la conditionnelle
retournée (P_M(T) pour P_T(M)), l'intersection pour la conditionnelle, la
probabilité seule ; pour l'erreur, les deux intersections « croisées »
contre les deux « droites ». La question où P(M) est inconnue se choisit
P(M), puis s'ouvre comme avant sur « on pose P(M) = x ». Le reste ne change
pas : le choix se juge au clic, compte une réponse, ouvre la ligne de calcul.

**Puis l'écriture s'est choisie DANS la ligne de calcul, devant le « = »**
(demande de Turquet, octobre 2026 : « que l'on écrive simplement …… = devant
le champ du calcul, les …… représentant une case étroite où l'on choisit la
bonne écriture littérale ; l'élève fait son calcul dans le champ derrière le
= »). Les quatre cartes ont disparu : la ligne est « [……] = [calcul] », et la
case étroite ouvre un petit menu des quatre écritures. Ce n'est pas une
liste `<select>` : une option de liste n'écrit ni indice ni barre, et P_T(M)
s'y lirait « P_T(M) ». La ligne de calcul est ouverte d'emblée (plus rien ne
la cache derrière le choix) ; le choix se juge à « Vérifier » comme une case
— en direct en soutien —, juste en bleu, faux en rouge avec la bonne écriture
en vert à côté (`mf-cor`), non choisi : la bonne écriture s'y écrit en vert.
Pour P(M) inconnue, la case est dans « On pose [……] = x ». Le choix de
l'événement des premières branches, lui, reste en cartes : il ouvre l'arbre.

**Puis la lettre de la première branche est devenue modifiable** (demande de
Turquet, octobre 2026 : « il faut pouvoir changer la lettre sur la première
branche si on le souhaite »). Le choix de l'événement n'est plus définitif au
clic : il se change jusqu'à « Vérifier », dans tous les modes, et ne se juge
qu'à ce moment-là — la carte choisie est seulement marquée (`apc-pris`). En
soutien, il se juge en direct et se fige quand il est juste. L'arbre SUIT la
lettre choisie : l'autre événement en tête, il est écrit dans l'autre sens,
et l'élève voit qu'il ne peut pas y placer les données ; changer de lettre le
redessine en gardant les nombres à leur place (`data-sens` sur la zone). Un
arbre dans le mauvais sens n'a aucune case juste ; à la vérification, il
reprend le bon sens, ses cases repartent vides et reçoivent la correction.

**Puis la valeur approchée s'est demandée SANS arrondi imposé, et la
formule a suivi l'écriture** (demande de Turquet, octobre 2026 : « ne pas
compter faux si un élève met le symbole = pour une valeur approchée, ne
demander que des valeurs approchées sans arrondi ; on accepte une valeur
approchée avec une autre précision mais on signale le problème ; quand un
élève choisit son écriture littérale, rajouter ensuite la formule littérale
qui permet de calculer cette probabilité »).

* Les conditionnelles à « remonter » ne disent plus « Arrondir à 0,01 près » :
  « (Donner une valeur approchée.) ». Leurs lignes portent `libre:true`, et
  `apfJugeChaine` y accepte une valeur approchée derrière « = » comme derrière
  « ≈ », à toute précision d'au moins UNE décimale — juste au sens de
  l'arrondi (écart ≤ ½ × 10⁻ᵈ). Une valeur finale à une autre précision que
  0,01 est juste, mais rend une `note`, affichée en orangé sous le verdict
  (« Attention : la valeur approchée 0,9 est juste, mais peu précise… ») ;
  elle ne coûte rien à la note. Un entier (« = 0 ») reste faux : à 0,5 près,
  il accepterait n'importe quelle probabilité. Le 6.1.2, qui partage le juge,
  ne change pas (pas de `libre`). La correction écrite par la page garde ses
  deux décimales.
* Derrière la case étroite, la formule de l'écriture CHOISIE s'écrit avant le
  « = » du calcul (`apcDev`, parallèle à `apcFormules`) : P(B) = P(A ∩ B) +
  P(Ā ∩ B) ; P_B(A) = P(B ∩ A) / P(B), empilée (`apcFr`) ; P(A ∩ B) =
  P(A) × P_A(B) ; la somme de l'erreur se développe terme à terme. Une
  probabilité de première branche n'en a pas, et la question « on pose x »
  n'en écrit aucune. Une écriture fausse montre la formule de ce qu'elle
  écrit — c'est ce qui la trahit ; à la clôture, la formule de la bonne
  écriture la remplace, en vert, à côté de la bonne écriture verte. Rien à
  ranger pour la pause : la formule se déduit de `q.ch`.

Essayé dans Chromium à 1280 et 390 px : « 0,38 ÷ (1 − 0,56) = 0,9 » bleu avec
l'avertissement de précision, « = 0,86 » bleu sans avertissement, « = 0,88 »
faux. Terminale v407.

**Puis la résolution s'est PRÉPARÉE en trois étapes, et l'arbre est resté en
haut de l'écran** (demande de Turquet, octobre 2026 : « quand il y a une
équation avec x, que les 3 étapes soient préparées quand l'élève a déterminé
avant l'expression en fonction de x, par exemple 0,2x − 0,1 = …, puis
0,2x = …, puis x = … » ; « que l'arbre reste en haut de l'écran, toujours
visible quand on fait défiler vers le bas »).

* Le bloc de lignes « [ … ] = [ … ] » à ajouter par Entrée a disparu du
  6.1.3 (le 6.1.2 le garde). Trois lignes fixes : le membre de GAUCHE est un
  texte écrit par la page — la forme réduite a·x + b, puis a·x, puis x —, le
  membre de droite une case (`apc-r1`, `apc-r2`, `apc-r3`). Les membres de
  gauche se lisent dans la ligne P(B) = … de l'élève (`apcExprEleve` : son
  dernier membre, s'il est réduit), à chaque frappe ; tant qu'il n'y en a
  pas, ils restent « …… ». Ils suivent l'expression de l'élève, même
  fausse — c'est la sienne qu'il résout ; à la clôture, les bons membres les
  remplacent, en vert là où ils diffèrent (`apcPreparer`). Rien à ranger pour
  la pause : la reprise relit la ligne P(B) remise en place.
* Le juge (`apcJugeResolCase`) : chaque case vaut sa cible — P(B), P(B) − b,
  puis la solution — et peut écrire le calcul qui y mène
  (« 0,42 − 0,1 = 0,32 ») ; le dernier membre est un nombre. Les cibles sont
  celles de la BONNE expression : une expression fausse rend fausses les
  étapes qui en dépendent. Trois réponses comptées, comme trois cases ; une
  case vide reçoit sa valeur en vert.
* L'arbre est collé en haut (`position:sticky`, classe `apc-fixe`). Un
  élément collé ne sort pas de son parent : `#apcArbre` et `#apcArbreSuite`
  passent en `display:contents`, et l'arbre colle dans le cadre de
  l'exercice, celui des questions. **Le piège** : `overflow-x:hidden` sur
  `html` ET `body` (la ceinture de la largeur) fait du body un conteneur de
  défilement qui ne défile jamais — l'arbre « collait » au body et partait
  avec la page (mesuré : -208 px). Sur cet écran, le body prend
  `overflow-x:clip`, qui coupe pareil sans créer de conteneur. Et
  `scroll-padding-top` réserve la hauteur de l'arbre (`--apc-arbre-h`, posée
  par `apfTraits`) : une case qui reçoit le focus ne passe pas dessous. Sous
  560 px de haut (téléphone couché), l'arbre ne colle pas : il couvrirait
  l'écran. Quand le clavier est ancré, il colle 56 px plus bas, sous les
  commandes montées en haut.

Mesuré dans Chromium : 768 × 1024 (arbre 363 px collé à 0, la case visée sous
lui), 390 × 844 (299 px), 1280 × 800 ; 844 × 390, non collé. Expression
fausse « 0,5x + 0,3 » : membres « 0,5x + 0,3 », « 0,5x », « x » préparés ; à
la clôture, « 0,8x + 0,1 » et « 0,8x » en vert. Terminale v409.

**Puis les lignes de calcul sont devenues des champs MathLive, le calcul
direct a été accepté partout, et la résolution peut se faire en une ligne**
(demande de Turquet, octobre 2026 : « accepter que l'élève écrive le calcul
avec les bonnes valeurs et donne directement le résultat, sans passer par les
résultats intermédiaires, pour toutes les questions ; les réponses doivent
présenter les calculs sous forme fractionnaire pour les divisions »).

* Les cases `apc-c…` (les calculs des questions) et `apc-r…` (les étapes de
  la résolution) sont des `<math-field class="dexp-mf apc-mf">` : une
  division s'y écrit en fraction EMPILÉE (touche « / », ou le bouton
  « fraction » de la barre « Insérer : » que `pmJetons` pose sous tout écran
  à champ mathématique — c'est elle qui porte aussi le bouton du clavier),
  « * » devient × et le x s'écrit de lui-même en italique arrondi. Les
  cases de l'ARBRE restent des `<input>` en texte : des nombres seuls, et le
  pavé des tablettes les sert (elles tiennent le contrôle
  `casesCalculTexte` du banc). Les jetons `×`, `+`, `−`, `(`, `)`, `=`,
  `≈`, `x` insèrent du LaTeX dans un champ MathLive (`APF_JETON_TEX`) ; le
  clavier A du 6.1.3 porte x et ≈ (`kbVarsFor`), et « ~= » tapé au clavier
  fait ≈.
* **Le juge lit du texte, pas du LaTeX** : `apcLire` aplatit la saisie par
  le `toPlain` de la page (`\frac{a}{b}` → `(a)/(b)`, `\times` → `*`),
  après avoir traduit `\approx` en « ≈ » et `\div` en « ÷ » — `toPlain` ne
  les connaît pas, et un `\approx` resté tel quel aurait fait d'une ligne
  juste « un calcul qui ne se lit pas ». `apfEstNombre` accepte la fraction
  aplatie « (9)/(47) » comme résultat, à côté de « 9/47 ». Les juges
  eux-mêmes (`apfJugeChaine`, `apfJugeDemo`, `apcJugeResolCase`) ne changent
  pas : ils acceptaient déjà « valeurs = résultat » sans étape
  intermédiaire, et le grand quotient direct
  « (0,05 × 0,9)/(0,05 × 0,9 + 0,95 × 0,2) ≈ 0,19 » passe.
* **La résolution directe** : si la dernière étape « x = … » est juste et
  que les deux premières sont restées vides, elles ne sont pas demandées —
  classe `hors-note` (que `ptsEcran` exclut), ni couleur ni correction, et
  la note compte 14 cases sur 14 au lieu de 14 sur 16. Dès qu'une des deux
  premières est écrite, ou que la dernière est fausse ou vide, les trois
  comptent comme avant. La consigne le dit : « étape par étape, ou
  directement dans la dernière ligne ».
* **Les corrections en fraction** : chaque ligne porte `tex` à côté de
  `corr`, et la dernière étape de la résolution `etapesTex` —
  `\frac{0,45}{0,75} = 0,6`. `apcCorrCase` écrit ce LaTeX dans la case vide
  (`setValue`, via `mlTexN` pour les virgules) et le dessine à côté de la
  case fausse (`mlTex`, dans le `.mf-cor`) ; une case en texte passe par
  `corrCase` comme avant. La reprise après une pause relit les champs par
  `captureBoxes`, qui sait déjà lire et écrire un `math-field` ; Entrée dans
  un champ passe à la case suivante puis au bouton Vérifier (`navCases` ne
  connaît que les `<input>`).

Essayé dans Chromium, à 1280 et 390 px, en entraînement et en soutien : une
copie faite des corrections est parfaite (13/13, 14/14 avec la résolution
directe, 16/16 étape par étape) ; une division fausse montre la fraction
verte à côté ; aucune erreur de page. Terminale v410.

**Puis la résolution s'est écrite COMME SUR LA FICHE, avec ses équivalences
et une phrase réponse** (demande de Turquet, octobre 2026, avec la fiche
« équation » : « 0,2x − 0,1 = 0,6 ; 0,2x = 0,6 …… ; 0,2x = …… ; x = ……/……
= …… » — « tu peux compléter avec des équivalences et une phrase réponse »).

* Quatre lignes, la première écrite par la page — l'équation entière,
  « a·x + b = P(B) » —, les trois suivantes ouvertes par « ⇔ » :
  « ⇔ a·x = P(B) [……] » (l'opération faite sur les deux membres, `apc-r1`,
  case étroite `apc-op`), « ⇔ a·x = [……] » (`apc-r2`), « ⇔ x = [……]/[……] =
  [……] » (une fraction de deux cases, `sa2Frac`, `apc-r3n` / `apc-r3d`, puis
  `apc-r3`) — des champs MathLive, comme les autres lignes depuis la veille
  (`apcResIn`). Le ⇔ est collé à son membre de gauche, les « = » restent
  alignés (`apc-mbw`). Puis la phrase : « Conclusion : la probabilité que … est égale à
  [……]. » (`apc-r4`, la phrase de la mise en situation, `C.s.A`). Six
  réponses comptées au lieu de trois.
* La résolution directe reste permise : si la valeur de x (`apc-r3`, qui
  peut porter « fraction = valeur ») est juste et que les quatre cases qui y
  mènent sont vides, elles sont hors note (`APC_RES_ETAPES`) ; la phrase
  réponse reste due.
* Les membres de gauche se préparent comme avant (`apcPreparer`, quatre
  membres : a·x + b, a·x, a·x, x), d'après l'expression de l'élève, et à la
  clôture les bons les remplacent, en vert.
* Le juge (`apcJugeResolCase(q, id, raw)`, cibles dans `apcResolCible`) :
  l'opération doit commencer par un signe et valoir −b (« − 0,1 ») ; un
  nombre sans signe est faux, avec la raison dite. Les autres cases gardent
  la règle d'avant : un nombre, ou un calcul qui y mène, terminé par un
  nombre. Le numérateur vaut P(B) − b, le dénominateur a. Les cibles restent
  celles de la BONNE expression.
* Sur téléphone (≤ 600 px), les membres de gauche perdent leur largeur
  réservée et les cases se resserrent : à 390 px, la ligne « x = fraction =
  [……] » sortait de l'écran, et la correction verte de la ligne 3 aussi.

Essayé dans Chromium à 1280 et 390 px : copie juste bleue, « 0,6 » faux à la
ligne 3 rouge avec « 0,044 » en vert à côté, phrase réponse vide remplie en
vert ; résolution directe « 0,56/0,8 = 0,7 » bleue, ses quatre étapes hors
note ; aucun défilement horizontal. Fusionné par-dessus les lignes MathLive
du même jour : Terminale v411.

**Puis la question « on pose x » a reçu SON arbre, avec x et 1 − x**
(demande de Turquet, octobre 2026 : « quand on doit exprimer en fonction de
x, si ce n'est pas déjà fait, demander avant d'exprimer en fonction de x de
compléter un arbre comme dans les consignes de cet exercice, sauf que l'élève
devra placer x et 1 − x sur les branches aussi ; s'il s'agit d'un deuxième
arbre, le premier ne doit plus rester forcément visible en entier, il peut
défiler vers le haut et être masqué partiellement ou totalement »). La
demande nommait « le 6.3.1 », qui n'existe pas : c'est le 6.1.3, le seul dont
la question en x vient APRÈS un premier arbre chiffré (au 6.1.2, l'arbre de
la situation 4 porte déjà x — « si ce n'est pas déjà fait »).

* Entre « On pose [……] = x » et « Exprime P(B) en fonction de x », un second
  arbre : la grille du premier (`apfGrilleHTML('apx', …)`), six cases
  (`apx-t-…`) — x et 1 − x sur les premières branches, puis les quatre
  conditionnelles de l'énoncé, qui ne changent pas ; intersections et P(B)
  restent « … ». x et 1 − x se jugent comme expressions (`apxJugeCase` :
  `apfParse` avec x, `apfEgal` — « -x+1 » vaut « 1 − x ») ; les
  conditionnelles par le juge du premier arbre (le pourcentage accepté). Les
  deux cases du haut offrent x au pavé (`data-pave-plus="x …"`), les autres
  non : un x y devient ×. Six réponses comptées de plus.
* Le second arbre est toujours écrit dans le BON sens, quelle que soit la
  lettre choisie au 1. a) : il n'a pas de choix à lui.
* **Il colle dans SA question, par-dessus le premier.** Classe `apc-fixe`
  (les mêmes règles collantes) et `apx-fixe` (z-index 6, un cran au-dessus) ;
  son parent est le bloc `.apc-q` de la question en x, si bien qu'il colle
  pendant toute la question — expression, résolution, phrase réponse — et
  repart ensuite, rendant la place au premier, qui colle dans tout le cadre.
  Le premier arbre n'est donc plus visible en entier pendant la question en
  x : le second monte sur lui, le masque en partie, puis entièrement.
  `--apc-arbre-h` (la réserve de `scroll-padding-top`) prend la hauteur du
  plus haut des deux.
* À la reprise, les cases des deux arbres reprennent la largeur de leur
  saisie (`sa2Ajuster`) — celles du premier ne la reprenaient pas non plus.

Essayé dans Chromium à 1280 × 900 et 390 × 844 : en bas de la résolution, le
premier arbre collé à 0, le second à 0 par-dessus (à 1280 px, la question
s'arrête plus tôt : le second s'arrête à 93 px et masque le bas du premier) ;
« x », « 1-x » bleus, une conditionnelle fausse rouge avec la bonne en vert à
côté, une case vide remplie en vert ; aucune erreur de page. Terminale v413.

**Puis l'arbre en x a ouvert sa case P(B), au bout de l'accolade** (demande
de Turquet, octobre 2026 — « le 6.3.1 » encore, c'est-à-dire le 6.1.3 :
« mettre aussi une case pour la probabilité extérieure à l'arbre qui
représente la somme des probabilités de deux chemins de cet arbre »).

* `APX_ARBRE` = les six branches + `B` : la case de l'accolade du second
  arbre devient `apx-t-B`. Sa valeur est la NOUVELLE P(B) que donne la
  question (`q.bx`), pas celle du premier arbre (`apcV(q).B`) : les deux
  diffèrent toujours, P(A) ayant changé. Le juge des cases est sorti de
  `apcV` (`apcJugeVal(cible, raw)`) pour la recevoir ; « 43 % » y vaut 0,43
  comme ailleurs.
* La consigne de l'arbre la nomme (« … et P(B), qui vaut maintenant 0,43 »),
  le contexte envoyé à l'IA aussi. Les intersections restent « … ». Sept
  réponses comptées de plus, au lieu de six.

Essayé dans Chromium à 1280 px : la case est au bout de la flèche de
l'accolade ; remplie juste, bleue ; la valeur du premier arbre, refusée ; les
cases vides reçoivent la correction en vert ; aucune erreur de page.
Terminale v414.

**Puis la question en x a DONNÉ sa cible : « Démontre que P(B) = … »**
(demande de Turquet, octobre 2026 : « quand on doit déterminer x, après
avoir complété l'arbre avec x et 1 − x, l'aide doit être par exemple :
démontrer que P(T) = 0,8x − 0,1 ; puis l'exercice continue comme prévu »).
Encore nommé « le 6.3.1 » : c'est le 6.1.3. La consigne « Exprime P(B) en
fonction de x, puis réduis » devient « Démontre que P(B) = a·x + b », la
forme réduite de la question (`apfLin(L[0].a, L[0].b, true)`, le x en
italique). Rien d'autre ne bouge : la ligne « P(B) = [……] » et son juge
(`apfJugeDemo` : le calcul en x, au moins deux membres, le dernier réduit),
la préparation des étapes, la résolution et la phrase réponse. La
description envoyée au modèle dit que cette expression est affichée, donc
pas secrète. Terminale v415.

## En portrait, le cadre d'un exercice prend la largeur de l'écran — les trois niveaux

Demande de Turquet (octobre 2026) : « en mode portrait, que le cadre blanc de
l'exercice soit plus large pour mieux exploiter la largeur de l'écran ;
vérifier que ce soit fait pour les autres exercices du site ».

**Mesuré avant** : en Terminale, la largeur des cartes suit `--card-max`
(560 / 780 / 1040 / 1200) — une tablette en portrait (768 à 834 px) tombait
sous le premier palier : un cadre de 560 px centré, plus de 200 px vides ; à
1024 px, la colonne de 780 px. La Seconde et la Première prenaient déjà la
largeur (`body.plein-ecran`), à 20 px de gouttière plus 26 px de rembourrage.

**La règle** : en portrait (jusqu'à 1100 px de large), sur un écran
d'exercice, la Terminale lève `--card-max` et la colonne (`body.ecran-exo`,
posé par `show()`) ; les trois niveaux ramènent la gouttière à 10 px et le
rembourrage du cadre à 20 px × 14 px. Les menus gardent leur colonne ; le
paysage et l'ordinateur ne changent pas. Mesuré sur chaque exercice des
trois menus dans Chromium : à 768 px, 748 px de cadre partout (Terminale :
560 avant ; Seconde et Première : 728) ; à 390 px, 370 ; aucune page ne
défile en largeur. Terminale v409, Seconde v571, Première v332.

**Ce que le banc navigateur a trouvé** à la première exécution : deux échecs,
aucun dans le 6.1.3. D'abord un défaut réel, que la nouvelle largeur a mis au
jour : à 600 et 390 px, au {recurrence-fractions} et au {recurrence-complete},
un « = » se séparait de sa case (`rfr-i4`, `rec-t2` ; puis, sur le
serveur de l'action, à 820 px, `rec-i-v` — « vrai car U₀ = … »). Dans un cadre de
560 px, le repli tombait ailleurs ; dans un cadre plus large, il tombait
entre eux. Les deux sont désormais collés par `tEq`, la fabrique qui le
faisait déjà pour `rfr-n0` juste à côté. Ensuite une mesure qui ne mesurait
plus rien : au {suite-variation-recurrence}, la grille de la démonstration
devait défiler « à 900 px », mesurée à 900 × 950 — un portrait, où elle tient
désormais. La mesure se fait à 900 × 700, en paysage, dans le cadre de
780 px qu'elle éprouvait.

## {proba-phrase-formule} (6.1.4, d’abord 6.2.1) : comprendre une question — associer phrase et formule

Demande de Turquet (octobre 2026), avec la « fiche 4 — Comprendre une
question en probabilité » : « créer un exercice comme le pdf qui permet
d'associer une phrase à une formule ; il faut voir toutes les phrases et les
formules sur l'écran sans avoir à faire défiler l'écran pour toutes les voir
(sur tablette aussi) ; varier les situations, les phrases possibles et les
formules — ce n'est pas grave si on ne peut pas évaluer toutes les formules
comme sur le pdf ». Il ouvre la partie 2 du thème, « Comprendre une
question » : 6.2.1 ; aucun numéro existant ne bouge.

**L'écran est celui de la fiche** : une situation, deux événements définis,
puis huit phrases numérotées à gauche et huit formules en désordre à droite,
chacune précédée d'un « ( … ) » — un menu où l'élève choisit le NUMÉRO de la
phrase, comme on l'écrit sur le papier. Une phrase déjà choisie pâlit
(`cqpMarquerPrises`) : on voit celles qui restent. Rien ne se calcule — les
données numériques de la fiche ne servent pas, la question est de LIRE.

**Une formule désigne un OBJET, et deux formules jamais le même.** Dix-sept
objets : P(X) pour les quatre littéraux, les quatre intersections, les huit
conditionnelles (dans les deux sens : P_M(T) et P_T(M)), et P(A ∪ B). Une
question en prend huit, dont toujours le « cœur » de la fiche — une
intersection et ses DEUX conditionnelles, les trois phrases que l'on confond —
et au plus deux probabilités sans condition. Les FORMES d'un même objet
(`f`) : P(T) ou sa somme des probabilités totales, P_M(T) ou
« P_M(T) = P(M ∩ T) / P(M) » empilé — jamais les deux formes d'un objet dans
la même question, puisqu'elles iraient avec la même phrase.

**Les phrases** : chaque situation (`CQP_CTX`, huit : dépistage, usine
jour/nuit, lycée, magasin, vaccin, auto-école, filtre à spams, bac) dit
chaque littéral de cinq façons — infinitif, verbe après le sujet,
subjonctif, groupe que l'on prend « parmi », individu que l'on choisit — et
les tournures (`v`) les assemblent : quatre pour P(X), trois pour une
intersection (plus « n'être ni … ni … » pour Ā ∩ B̄ là où la situation le dit
naturellement), six pour une conditionnelle (« sachant que », « parmi »,
« l'individu choisi … : quelle est sa probabilité », « on choisit un … »,
« on sait que … : quelle est la probabilité qu'il … », « quand … »), deux pour
la réunion. Les tournures d'un même genre se distribuent sans remise dans une
question. Trois questions par séance (`dmNbQuestions(3)`), trois situations
différentes.

**Tout se voit sans défiler.** Deux colonnes dès 700 px de large, les
formules sur deux colonnes à partir de 1100 px ; et l'en-tête de
l'application (logo, titre, numéro) prend à lui seul 230 px : si la zone des
phrases et des formules descend sous les commandes flottantes du bas,
`cqpCadrer()` remonte l'écran jusqu'à l'énoncé, qui tient alors avec toute
la zone. Mesuré dans Chromium : ordinateur 1280 × 720 et 1366 × 650, tablette
768 × 1024 et 1024 × 700, iPad Pro 1024 × 1366 — énoncé, huit phrases, huit
formules et bouton « Vérifier » à l'écran, sans défilement horizontal. Sur un
téléphone (390 px) les deux colonnes s'empilent et l'écran défile : la
demande portait sur la tablette.

**Le juge** est celui d'{associer-derivee-seconde} : chaque menu est juste
ou faux, une case vide n'est jamais rouge et reçoit le bon numéro en vert ;
un numéro faux reste rouge, le bon s'écrit à côté (`corrCase`), et le
pourquoi dit ce que la phrase attendue contenait — une condition, « et »,
« ou », ou rien (`cqpPourquoi`). En soutien, la correction est en direct.

## Le 6.2.1 rejoint l'arbre de probabilité : il devient le 6.1.4

Demande de Turquet (octobre 2026) : « mettre le 6.2.1 dans le thème arbre de
probabilité ». {proba-phrase-formule} passe en fin du sous-thème 6.1, après
l'exercice de bac : il devient le **6.1.4**. La partie « Comprendre une
question » (6.2), vidée, disparaît — une partie sans exercice afficherait un
titre sur rien. Les numéros naissent de `THEMES` : rien d'autre à renuméroter,
l'identifiant ne change pas, et les résultats déjà enregistrés le retrouvent.
Terminale v402.

## Une case de calcul en texte écrit « × », et le x en italique — partout

Demande de Turquet (octobre 2026) : « dans les exercices de probabilité en
Terminale, il faut pouvoir écrire une formule mathématique, avec un × pour le
*, la lettre x aux traits arrondis (italique) pour l'inconnue, un clavier
virtuel adapté pour le mode tablette, comme pour tous les exercices de ce
site ; il faudrait que cela soit signalé pour les prochains exercices ».

**Ce qui manquait, vu dans Chromium à 820 px** : au 6.1.2 et au 6.1.3, les
lignes de calcul sont des `<input>` de texte — pas des cases MathLive, dont le
raccourci « * » → `\times` est réglé pour tout le niveau. « 0,4*0,9 » restait
donc écrit avec l'astérisque ; et dans une ligne « pas de lettres », un x tapé
entre deux nombres — que le juge lisait déjà comme un produit (`apfNorm`)
— s'affichait en italique, comme l'inconnue qu'il n'était pas. Sur le pavé des
tablettes, la touche x s'écrivait droite, à côté de la touche ×.

**La règle n'est plus celle d'un exercice : c'est celle d'une SORTE de case.**
Une case en texte dont le pavé offre × (`data-pave-plus`) est une case de
calcul ; un gestionnaire `input` posé EN CAPTURE sur le document
(`caseCalculEcrire`) y réécrit « * » en « × » sous les doigts de l'élève — et,
si la case n'offre pas la touche x, le x aussi ; là où x est l'inconnue, un X
majuscule s'écrit x. Un caractère pour un caractère : le curseur ne bouge pas.
En capture, il passe avant `sa2Ajuster` et la correction en direct du
soutien, qui lisent déjà le ×. La police « ApfX » (le x de KaTeX_Math-Italic)
s'applique à toute case en texte qui offre x (`input[data-pave-plus~="x"]`),
plus seulement aux classes du 6.1.2 ; et `paveSup` écrit la touche x — et x²
en Seconde — en `<i>x</i>`. Les juges ne changent pas : ils lisaient déjà ×.

**Le contrôle va partout** (banc navigateur, section 9, « une case de calcul
en texte écrit « × » pour « * », et le x en italique ») : sur chaque exercice
visité, chaque case en texte qui offre × ou x est relevée ; le x doit s'y
écrire en italique (fonte du texte italique — les cases du calcul littéral de
la Seconde sont en Times italique — ou une fonte de tête qui prend son x dans
KaTeX_Math-Italic), la touche x du pavé doit porter un `<i>`, et sur la
première case à × le banc TAPE « 2*3x4 » au clavier : 2×3x4 attendu là où x
est offert, 2×3×4 ailleurs. Son bord opposé est le drapeau `casesCalculTexte`
de `tests/profils.js` (Terminale : avec des frappes de « * » ; Seconde : des
cases à x seulement ; la Première n'en a aucune, non applicable).

**Et le gestionnaire est entré dans le moteur du pavé**, que le banc principal
exige identique aux trois niveaux (`MOTEUR_PAVE`, « le pavé numérique est
identique à celui de la Terminale ») : c'est ce contrôle-là qui a rougi à la
première exécution, `paveSup` ayant changé en Terminale et en Seconde avec deux
commentaires différents, et pas du tout en Première. `paveSup` et
`caseCalculEcrire` sont désormais les mêmes, octet pour octet, dans les trois
pages : une case à × ajoutée demain en Seconde ou en Première écrit « × » sans
rien porter. Terminale v406, Seconde v569, Première v330.

**Puis la précision s'est IMPOSÉE, et la troncature est devenue juste**
(demande de Turquet, octobre 2026 : « préciser que l'on souhaite une valeur
approchée à 10⁻² près dans l'énoncé ; il faut accepter une valeur approchée
au centième près et pas forcément la valeur arrondie »). La capture jointe :
« 0,17 / 0,234 = 0,72 » rouge, devant une correction « ≈ 0,73 » — 0,72 est
pourtant à 0,01 près de 0,7265….

* Les deux conditionnelles à remonter disent « (Donner une valeur approchée à
  10⁻² près.) ».
* Sur une ligne `libre`, `apfJugeChaine` accepte toute valeur DÉCIMALE à 0,01
  près de la valeur exacte, derrière « = » comme derrière « ≈ » : l'arrondi
  (0,73), la troncature (0,72), une valeur plus précise (0,7265). 0,71 ou 0,7
  restent faux. La `note` de précision disparaît : la précision est dans
  l'énoncé, il n'y a plus rien à signaler. Une fraction non exacte reste
  fausse (ce n'est pas une valeur approchée décimale).
* Le 6.1.2 (sans `libre`) garde son juge : « ≈ » au sens de l'arrondi, au
  moins deux décimales. La correction garde ses deux décimales arrondies.
  Terminale v412.

## {arbre-probabilites-bac-types} (6.1.5) : sept exercices de bac, choisis par leur numéro

Demande de Turquet (octobre 2026), avec le PDF « Exercice arbre proba bac »
(sept sujets : tomates de deux fournisseurs, lames d'escrime de trois
fabricants, réacteurs nucléaires, planches de surf, transports en commun,
filles et études d'ingénieur, navire et cabines) : « faire un exercice qui
contienne les 7 types d'exercices du pdf ; l'élève choisit d'abord un numéro
entre 1 et 7 ; chaque exercice reprend les mêmes questions dans le même
ordre ; changer le thème et les valeurs numériques ; chaque question respecte
les consignes de présentation du 6.1.3 — quand il faut déterminer une
probabilité sur une branche intérieure connaissant la probabilité d'un
événement qui représente deux chemins de l'arbre, toujours proposer les
étapes : poser x = …, compléter l'arbre avec x et 1 − x et la probabilité en
fin d'arbre, démontrer par exemple P(T) = 0,5x − 0,1, puis résoudre
l'équation avec la même présentation ».

**Le choix d'abord.** L'écran s'ouvre sur sept cartes « Type 1 … Type 7 » ;
le tirage ne se fait qu'au clic (`aptChoisirType`). Tant que rien n'est
choisi, `test.questions` reste celui d'avant : la photo papier d'un devoir le
voit et dit « ne sait pas s'énoncer », le banc des séances distinctes ne le
mesure pas, et l'enregistrement automatique est coupé (`recoveryClosed`) —
sans quoi un brouillon aurait rangé la séance d'un AUTRE exercice sous ce
nom. Une séance tire `dmNbQuestions(1)` exercices du type choisi, sur des
thèmes différents. Les bancs (navigateur, notes, pause) franchissent ce
premier écran comme un « Commencer » : leur liste des boutons de départ
reconnaît « Type 1 ».

**Les mêmes questions, sur d'autres thèmes** (`APT_TYPES`, trois thèmes par
type, aucun repris du PDF). Les clés sont abstraites : A, B, C pour les
premières branches, E, F, G pour les secondes ; le thème leur donne leur
lettre (« -C » : C barre) et leurs phrases (subjonctif après « la probabilité
que », le même sans sujet après « et », indicatif après « sachant que », et
deux tournures pour les interprétations). Les nombres (`q.d`) sont des
dix-millièmes entiers, tirés par type sous contraintes : au 1, P(C) a au plus
une décimale en pourcentage et l'affirmation « k fois moins de chances » est
vraie une fois sur deux, exactement (le rapport vaut k) ou nettement fausse ;
au 4, la part en bon état est comparée à 3/4, 2/3, 7/10 ou 4/5, jamais à
moins de 0,01 du seuil ; au 6, les pourcentages ont deux décimales, comme
dans le sujet (33,75 %).

**Le plan d'un type** (`aptPlan`) écrit ses questions dans l'ordre du sujet,
avec quatre sortes de pièces : la ligne « [……] = formule = [calcul] » du
6.1.3 (écriture choisie dans la case étroite, ses trois pièges, sa formule) ;
l'arbre, ouvert par le choix de l'événement des premières branches ; des
cartes (une interprétation : la bonne phrase contre la conditionnelle et la
conditionnelle retournée ; une affirmation : Oui / Non) ; et la branche en x.

**La branche intérieure passe par x** (types 1, 3 et 7) : « On pose [……] = x »
(au 3, l'énoncé pose déjà x et le premier arbre l'écrit, l'élève y place
1 − x : ni second « on pose », ni second arbre), puis l'arbre en x — toutes
les branches, x et 1 − x sur celles du nœud inconnu, et la probabilité
totale au bout de l'accolade —, « Démontre que P(…) = a·x + b », la
résolution à quatre lignes du 6.1.3 avec ses ⇔ et une phrase réponse. Au 7,
x n'est pas décimal : la valeur de x et la phrase réponse acceptent toute
valeur à 10⁻² près (`aptResolTol`).

**Une exception, nommée** : au type 5, la proportion de la dernière question
est une branche intérieure, mais le sujet la fait DÉDUIRE de la question 3
(P(R̄ ∩ J) = P(J) − P(R ∩ J), puis la division par P(R̄)) : l'ordre des
questions du sujet l'emporte, et la ligne accepte la division de la valeur
exacte comme celle de l'arrondi (`vs`).

**L'arbre est une grille générale** (`aptGrilleHTML`, `aptTraits`) : celle du
6.1.2 n'a que deux branches par nœud, les types 2 et 3 en ont trois au
premier niveau, le 4 trois au second. Deux demi-rangées par fin de chemin ;
une étiquette au-dessus de sa branche quand elle monte, au-dessous quand elle
descend. Essayé dans Chromium : l'étiquette d'une branche du MILIEU, qui est
horizontale, chevauchait le trait montant vers la première (P(B) au 2,
P_Ā(J) au 4) ; elle se pose désormais au bout de sa branche (`apt-mil`). Le
choix de l'événement suit la règle du 6.1.3 : modifiable jusqu'à
« Vérifier », l'arbre écrit dans l'autre sens si la lettre est fausse (ses
cases ne sont jamais justes), remis dans le bon sens à la clôture.

**Les juges** : `aptJugeChaine` est celui du 6.1.3 avec la précision de la
question (10⁻² ou 10⁻³, l'arrondi comme la troncature) ; une donnée à lire
(1. a) du type 7) se contente du nombre seul, « 75 % » compris. Essayé dans
Chromium à 1280 et 390 px, les sept types : une copie faite des corrections
de la page est parfaite (27 cases sur 27 au type 1), une copie vide reçoit
toutes ses corrections en vert, aucune erreur de page. La case de
l'opération de la résolution, trop étroite pour « − 0,546 », a été élargie.
Terminale v416.
