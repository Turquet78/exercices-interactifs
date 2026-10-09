# Première — probabilités (thème 3)

## {tableau-probabilites} (3.1) : le tableau à double entrée

Demande de Turquet (octobre 2026), d'après sa fiche papier « proba 1 » : « en
première faire un exercice comme le pdf, avec 4 nombres différents plus petits
que 10 à l'intérieur du tableau mais pas forcément dans la ligne ou la colonne
du total. Les pointillés correspondent aux lettres A ; B ; non A ; non B ;
A inter B ; A inter non B ; … ; tout — sauf à la fin des questions où ils
correspondent aux effectifs du tableau. »

**La séance EST la fiche, dans son ordre.** Treize questions sur UN tableau :
la question 1 fait compléter les deux phrases contraires (Ā, B̄) et les cases
manquantes du tableau ; les questions 2 à 7 sont la Partie A (P(A), P(Ā), P(B),
P(B̄), P(A∩B), P(A∩B̄)), les questions 8 à 13 la Partie B (P_B(A), P_A(B),
P_B̄(A), P_A(B̄), P_B̄(Ā), P_Ā(B̄)). Les questions portent le même tableau et
diffèrent par la probabilité demandée (`it`) : `distincte()` les voit donc
différentes. C'est une forme fixe — le réglage « Questions » d'un devoir ne
peut que la COUPER (les premières questions : le tableau, puis la Partie A).

**Le tirage.** Les quatre cases du milieu sont quatre nombres différents de 1
à 9 (comme sur la fiche : 4, 3, 5, 8). Les QUATRE NOMBRES DONNÉS à l'élève
sont tirés parmi les jeux de quatre cases (sur les neuf, totaux compris) qui :
- portent des nombres différents et plus petits que 10 — « pas forcément dans
  la ligne ou la colonne du total » : un total peut en être ;
- se résolvent PAS À PAS : une ligne ou une colonne où il ne manque qu'un
  nombre, puis une autre (`pbResoluble`) ;
- n'ont aucune ligne déjà pleine — trois nombres d'une même ligne n'en font
  que deux, et le tableau ne serait plus déterminé.
Les quatre cases du milieu forment toujours un jeu valable : la liste n'est
jamais vide.

**Les pointillés.** Dans « la probabilité d'avoir … parmi … » et dans les
deux premières fractions, l'élève CHOISIT une lettre dans une liste — toujours
les neuf mêmes, dans le même ordre : A, Ā, B, B̄, A∩B, A∩B̄, Ā∩B, Ā∩B̄, tout.
La dernière fraction s'écrit avec les EFFECTIFS, dans des cases MathLive, sans
simplification. La fraction en lettres d'une probabilité conditionnelle écrit
toujours A d'abord : P_A(B̄) = A∩B̄ / A (`pbInter`).

**Le juge.** Chaque case a UNE bonne réponse qui ne dépend d'aucune autre :
elles se jugent seules, et une case juste ne rougit jamais pour une voisine.
En entraînement et en évaluation, `corrCase` (bleu, rouge + badge vert, vide
remplie en vert) ; en soutien, la case juste se verrouille, la fausse rougit,
la vide reste sans couleur.

**Pas de correction au fil des clics** (`soutienEnDirect.sans` : `pb`) : la
règle de {associer-coefficient} — colorer une liste au moment du choix
donnerait la bonne lettre par élimination.

**Mise en page.** Les nombres écrits du tableau et les cases d'effectifs ont
la même taille (1,5 rem). Les phrases sont du texte courant où la liste prend
place (pas une rangée flex) : sur téléphone, une rangée flex séparait « Ā »
de sa phrase. Les listes des phrases contraires prennent la largeur de leur
plus longue fin de phrase (« est demi-pensionnaire ») ; celles des lettres ont
une largeur fixe.

**Contextes** (`PB_CTX`) : garçons / lunettes (la fiche), externes / sport en
club, bus / cantine. Le contexte est tiré à la séance (`ci`), le même pour les
treize questions.

Vérifié en l'ouvrant dans Chromium (bureau 1280 px, téléphone 390 px,
entraînement et soutien) : copie juste comptée parfaite (9/9), dénominateur
« tout » au lieu de B rougi avec le badge B et l'effectif 10 à côté, cases
vides remplies en vert sans rougir.
