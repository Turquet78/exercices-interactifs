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
