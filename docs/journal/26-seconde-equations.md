# Seconde — thème 9, Équations

## {equation-deplacer-terme} — la règle 1 : déplacer un terme de l'autre côté du « = » (Seconde, 9.1, novembre 2026)

**D'où il vient.** Demande de Turquet, sur la fiche papier « Règle 1 » :
« en seconde créer un thème équation, et faire un exercice comme le pdf ;
dans les exemples qui illustrent la règle 1, faire une animation qui change
le signe des nombres déplacés ; l'animation doit se répéter ». Un thème neuf,
le 9 (« Équations »), ajouté EN DERNIER : rien n'est renuméroté. Kind `eqr`.

**La page suit la fiche.** En tête, la règle 1 : deux phrases à compléter
(une addition déplacée devient une soustraction, une soustraction devient une
addition), par deux listes — addition, soustraction, multiplication,
division. Elles ne se complètent qu'à la PREMIÈRE question (`q.regle`) ;
ensuite la règle s'écrit complétée. Puis les trois exemples de la fiche,
toujours les mêmes : x − 2 = 5, x + 2 = 5, 2 + x = 5. Puis l'exercice, en
trois colonnes comme le tableau de la fiche : l'opération à trou
(… − n = m, … + n = m, n + … = m), puis la même équation résolue par la
règle — « x = m …… » (le terme déplacé, SIGNE COMPRIS) et « x = …… ».

**Le tirage.** La première question est celle de la fiche (n = 2, m = 5) ;
les suivantes tirent n de 2 à 9 et m de n + 1 à 15, par `distincte()` avec une
clé sur (n, m) — sans quoi la question de la fiche, qui porte `regle`, ne se
reconnaissait pas dans un second tirage de (2, 5). Cinq questions, réglables
par le devoir (`dmNbQuestions`). Les opérations à trou restent dans les
entiers naturels.

**Le juge.** Une case par trou, par terme déplacé, par solution : 9 par
question, 11 à la première (`eqrCases(q)`, qui lit la règle DANS la question
pour que la coupe d'un devoir trouve le poids exact de chaque question —
`dmPoidsQuestion`). Le terme déplacé exige son signe : « 2 » seul est faux,
et le message le dit (« écris le signe devant 2 : c'est lui qui dit si on
ajoute ou si on retire »). « − », « – » et « - » se valent ; les espaces ne
comptent pas. Le message de la solution fausse rappelle que c'est le même
calcul que l'opération à trou : c'est l'idée de la fiche.

**L'animation.** En CSS, en boucle infinie (5,2 s) : dans les exemples, le
terme entouré est VIDE (`color:transparent`) — c'est un jeton mobile qui porte
son texte, part du cercle en pointillés, suit l'arc, se pose après le 5 de la
ligne du dessous, et change de signe en s'y posant (le nouveau signe grossit
sur fond jaune), puis s'efface et recommence. Seul le trajet se mesure :
`eqrTracer()` lit la place du terme entouré et celle de la case d'arrivée,
pose `--dx`/`--dy` sur le jeton et trace la flèche en pointillés de la fiche
(SVG). Elle se refait au redimensionnement, quand les polices arrivent, et
300 ms après le rendu.

**Le piège rencontré.** La première version mesurait l'arrivée sur le JETON :
`getBoundingClientRect` inclut la transformation de l'animation, si bien que
la flèche suivait le vol — mesurée au départ, elle tombait verticalement sur
le cercle. On mesure la CASE d'arrivée (`.eqr-dest`), que la transformation de
son enfant ne déplace pas.
