# Première — probabilités (thème 3)

## {tableau-probabilites} (3.2, d'abord 3.1) : le tableau à double entrée

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

**La barre de Ā et B̄ est un trait DESSINÉ (v285).** Signalé par Turquet le
jour même, capture à l'appui : « on ne voit pas bien les barres au-dessus des
lettres ». La v284 posait `text-decoration: overline` sur la lettre italique
de KaTeX_Math : le navigateur traçait un trait fin, court, décalé vers la
gauche — sur la capture, à peine un accent posé à côté de la lettre. Mes
captures de contrôle ne le montraient pas : les polices de MathLive y étaient
coupées, et la lettre de repli, droite, recevait un soulignement correct. Le
défaut ne se voyait qu'avec la VRAIE fonte. `i.pb-bar` porte désormais un
`::before` : un trait d'au moins 2 px, décalé vers la droite comme la pente
de l'italique, un peu plus large que la lettre. Revu en capture avec les
polices réelles chargées (phrases, en-têtes, étiquettes du tableau, indice de
P_B̄). Les listes, elles, gardent le caractère combinant U+0305 (une
`<option>` ne se met pas en forme) : lisible dans Chromium, à surveiller sur
tablette.

**Puis les cases bleues, le « P » et la phrase (v286).** Deuxième capture de
Turquet, le même jour : « la ligne juste en dessous du tableau doit être
centrée aussi ; dans les écritures P(…) la lettre P est collée au symbole
“(” ; dans les cases bleues les barres au-dessus des lettres sont décalées ».
- La phrase « P(…) représente la probabilité d'avoir … parmi … » est centrée
  (`pb-centre`), comme le tableau et la chaîne de fractions. Les phrases
  contraires de la question 1 restent alignées à gauche, sous « A représente
  l'évènement ».
- Le P italique de KaTeX_Math penche vers la parenthèse : `i.pb-P` l'en
  écarte de 0,14 em.
- LES LISTES : une `<option>` ne se met pas en forme, et la barre y était le
  caractère combinant U+0305. La police du site ne l'a pas : le navigateur va
  la chercher ailleurs et la pose À CÔTÉ de la lettre. Dans Chromium Linux,
  la police de repli la plaçait bien — mes captures étaient justes, la
  tablette non : un rendu qui dépend des polices de l'appareil ne se juge pas
  sur un seul appareil. La liste fermée montre donc une VITRINE (`pb-aff`)
  posée par-dessus son texte rendu transparent : la même écriture que la
  page (`pbHTML`, barre dessinée), de la même encre que la liste (bleu juste,
  rouge faux, vert correction, par `.pb-sel.ok~.pb-aff`…). `pbAffMaj()` la
  refait à chaque choix et après chaque vérification — `corrCase` écrit la
  valeur sans déclencher « change » — et réécrit aussi le badge vert de la
  correction, qui portait le libellé de l'option. La liste DÉROULÉE garde le
  caractère combinant, avec une police à empattements (Cambria, Times) qui le
  pose correctement sur la plupart des appareils ; sur une tablette, le
  sélecteur du système peut l'ignorer.

**Puis toutes les phrases sont centrées (v287).** Troisième capture de
Turquet : « les 4 lignes avant le tableau doivent être centrées aussi ». Les
définitions de A et B et les deux phrases contraires de la question 1 ne
restent plus à gauche : `.pb-def` est centrée, pour toutes les phrases de
l'exercice. La v286 avait laissé ces quatre lignes à gauche exprès, « sous
A représente l'évènement » — c'était une supposition, et c'était la mauvaise :
dans cet exercice, tout se lit dans l'axe du tableau.

**Puis les totaux portent leur lettre (v288).** Nouvelle version de la fiche,
envoyée par Turquet : « rajoute les lettres en fin de ligne et de colonne ».
Les totaux de ligne et de colonne s'étiquettent comme les cases du milieu —
B, B̄ au bout des lignes, A, Ā au pied des colonnes (`nomsCase`). Le total
général reste sans lettre, comme sur la fiche. L'étiquette nomme aussi la
case pour un lecteur d'écran (« effectif de B »).

## {lire-probabilites} (3.1) : traduire une phrase en probabilité

Demande de Turquet (octobre 2026), d'après sa fiche papier « proba 2 » : « en
première fait un exercice comme le pdf en le présentant comme le 3.1 ». Il
prend la PREMIÈRE place du thème 3 ; {tableau-probabilites} devient 3.2
(la numérotation découle de `THEMES`, rien d'autre n'a été renuméroté).

**Ce qui change par rapport au 3.2.** Le tableau est DONNÉ, entier. Les
questions sont posées EN MOTS — « la probabilité d'avoir des lunettes parmi
les garçons », « sachant qu'on est un garçon », « on choisit un élève qui est
un garçon » — et l'élève doit les TRADUIRE : « c'est la probabilité d'avoir …
parmi … », puis le nom de la probabilité, P…(…), dont il choisit l'indice
(« rien » quand la phrase ne pose aucune condition) et l'évènement, puis les
trois fractions du 3.2 (« … parmi … / parmi … », lettres, effectifs).

**La séance est la fiche** : une question pour les deux phrases contraires
(`t:'phr'`), puis les huit de la fiche dans son ordre (`LP_ITEMS`) : P(B),
P(A), P(B̄), P(Ā), P_A(B), P_A(B̄), P_A(B) encore — dite autrement, c'est
l'objet même de la fiche — et P_Ā(B). Neuf questions.

**Les tournures** (`q.v`, tirées à la génération, `lpEnonce`) : trois pour
les probabilités sans condition, quatre pour les conditionnelles (« parmi
les … », « sachant que … », « on choisit … qui … », « Sachant que …,
quelle est … ? »). Les quatre conditionnelles se partagent les quatre
tournures, une chacune : la 5ᵉ et la 7ᵉ question, qui demandent la même
probabilité, ne se disent jamais de la même façon. Les mots viennent de
`PB_CTX`, qui a gagné l'infinitif (`iA`…), le groupe (`gA`…) et
l'article (`un`, `le`) de chaque contexte.

**Un moteur, deux identités** : même `kind` (`pb`), même écran, même juge
(`checkPBAnswer`) ; la note part sous `test.qId`, le rappel vit dans
`RAPPELS_ID` (`RAP_LP`), les questions dans `QIA_SUGG`, « Recommencer »
choisit le démarreur par `test.qId`. L'indice vide de P s'écrit `'0'`
(« rien » dans la liste et dans la vitrine).

Vérifié en l'ouvrant dans Chromium (bureau 1280 px, téléphone 390 px) :
copie juste comptée 9/9 en entraînement et en soutien ; dénominateur « tout »
au lieu de A rougi avec le badge A, 10 cases justes sur 11.

Publié en v289 : la v288 de `main` (les totaux du tableau portent leur
lettre, au 3.2) était arrivée pendant les contrôles. Elle vaut aussi pour le
3.1, qui dessine le même tableau (`pbTableHTML`).

**Puis le 3.2 a posé ses questions EN MOTS, comme le 3.1 (v290).** Demande
de Turquet, le même jour : « je veux que l'exercice soit présenté comme sur
le pdf, et que tout ce qui est similaire au 3.1 soit fait de la même façon.
Il faut donc une question sous forme de texte ; on fera varier les
différentes façons de poser ces questions. » Les douze probabilités du 3.2
(Partie A et Partie B) ne sont plus annoncées par leur nom — « Partie B :
probabilité conditionnelle », P_B(A) écrit d'avance — mais par une phrase
(`lpEnonce`, partagée avec le 3.1), et l'élève écrit lui-même P…(…) :
l'écran est désormais celui du 3.1. Les étiquettes « Partie A / Partie B »
sont parties avec : elles disaient d'avance s'il fallait un indice.
- Les tournures (`q.v`) : trois pour les six probabilités sans condition,
  quatre pour les six conditionnelles, mélangées deux fois
  (`[0,1,2,3,0,1,2,3]`) — aucune ne sort plus de deux fois.
- Une intersection se dit avec « et » : « d'être externe et de faire du
  sport en club » (P(A∩B)), « d'être un garçon et de ne pas avoir de
  lunettes » (P(A∩B̄)).
- Une pause prise AVANT la v290 n'a pas de `q.v` : la tournure 0 la reprend.
- Le rappel de cours (`RAP_PB`) a gagné « Lire la question ».

Vérifié dans Chromium (bureau et téléphone, entraînement et soutien) : copie
juste 13/13, indice de P laissé vide rempli en vert sans rougir (10 cases
justes sur 11).
