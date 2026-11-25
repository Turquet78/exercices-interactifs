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

## {equation-resoudre-glisser} — résoudre ax + b = 0 en déplaçant les termes à la souris (Seconde, 9.2, novembre 2026)

**D'où il vient.** Demande de Turquet : « une équation du type ax + b = 0,
avec une solution entière et des nombres entiers ne dépassant pas 30 dans
tout l'exercice. L'élève peut déplacer avec sa souris soit ax soit + b
n'importe où dans l'équation : si le terme reste du même côté on ne change
pas le signe, sinon oui. Quand l'élève a écrit ax = −b ou b = −ax, lui faire
comprendre qu'il peut déplacer le facteur a ou −a ; tant qu'il ne le met pas
en bas de b ou −b (au dénominateur), dire que c'est impossible ; sinon écrire
x = −b/a ou b/−a = x en écriture fractionnaire, et demander à l'élève de
cliquer sur la fraction pour obtenir le résultat. » Kind `eqd`, ajouté après
le 9.1 : rien n'est renuméroté.

**Le tirage.** a de ±2 à ±9 (positif à la première question, négatif 3 fois
sur 10 ensuite), x entier non nul, b = −ax, et |ax| ≤ 30 : a, b et x ne
dépassent jamais 30. Une question sur quatre (sauf la première) s'écrit
b + ax = 0. `distinctes()` sur (a, b), cinq questions réglables par le devoir.

**L'état vit dans la question** (`q.st`, créé au premier rendu, jamais au
tirage : la clé de `distincte()` n'en voit rien) : les deux membres, chacun
une liste de termes `{t:'x'|'c', k}` — un membre vide s'écrit « 0 », et le 0
disparaît dès qu'un terme arrive —, la fraction posée, la fin. Du JSON : la
pause le range, la reprise le redessine.

**Le glisser** se fait aux événements `pointer` (souris, doigt, stylet). Le
membre visé est le côté du « = » où est le pointeur ; le rang, le nombre de
termes de ce membre dont le milieu est à gauche du pointeur ; un trait bleu
montre la place. Le fantôme qui suit le pointeur porte DÉJÀ le signe qu'il
aura en se posant : la règle 1 se voit avant de lâcher. Posé, le terme
change de signe s'il a changé de membre (le signe neuf flashe en jaune), et
la phrase sous l'équation dit ce qui s'est passé.

**Le facteur.** Dès qu'un membre ne contient que le terme en x et l'autre
que le nombre (`eqdIsole`), le terme en x se coupe : son coefficient, signe
compris (« 3 » ou « −3 »), devient une prise orange qui sautille, et la
phrase dit « x est multiplié par 3 : tu peux déplacer le facteur 3 ». Lâché
SOUS le nombre de l'autre membre (dans sa largeur ± 30 px, plus bas que son
milieu), il s'y pose en dénominateur : « x = −12/3 », ou « 12/−3 = x » si x
était à droite. Partout ailleurs : « Impossible : on ne peut pas poser le
facteur 3 ici. » Au deuxième refus, un indice s'ajoute (« de l'autre côté
du « = », une multiplication devient une division — pose 3 sous −12 »).
Un refus ne coûte rien.

**La note.** Un point par question, gagné au clic sur la fraction, qui écrit
« donc x = −4 » et la vérification (3 × (−4) + 12 = 0 ✓). « Vérifier » avant
la fin : en entraînement et en évaluation, la résolution s'écrit en vert
(`.eqd-cor`) et la question compte fausse ; en soutien, la page dit l'étape
suivante et attend. C'est aussi ce qui laisse le banc des notes mener
l'exercice jusqu'à sa fin par « Vérifier », comme les autres.
