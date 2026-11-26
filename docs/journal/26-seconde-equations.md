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

### Puis un terme de plus à chaque question, et les termes se regroupent (v732, novembre 2026)

**La demande.** « Dans l'exercice 9.2, compliquer les résolutions au fur et à
mesure en rajoutant un terme avec x ou sans x dans le membre de gauche ou de
droite à chaque question. Il faudrait 8 questions. »

**Le tirage.** `eqdFormes(n)` tire d'abord les FORMES : la question 1 est
ax + b = 0, chaque question suivante reprend la forme de la précédente et y
insère un terme — avec x ou sans x (le plus rare des deux a plus de chances),
à gauche ou à droite, à une place tirée parmi les termes de ce membre. Puis
`eqdNombres(forme, i)` remplit chaque forme de NOUVEAUX nombres : A (le
coefficient de x une fois tout regroupé à gauche) de ±2 à ±9 (±6 à partir de
la question 3), une solution entière non nulle de −10 à 10, B = −A × solution,
et les coefficients répartis au hasard, le dernier calculé. Huit questions
(`dmNbQuestions(8)`), de 2 à 9 termes. La question est rangée en `gi`, `di`
(les deux membres de départ) et `s` (la solution) ; une séance tirée avant
la v732 (a, b) se reprend telle quelle (`eqdDepart`).

**Plus de 30 nulle part, quel que soit l'ordre des gestes.** La somme des
valeurs absolues des coefficients en x ne dépasse pas 30, celle des nombres
non plus : toute somme partielle, donc tout regroupement fait dans n'importe
quel ordre, reste entre −30 et 30, et la fraction finale aussi. |A| ≥ 2 : le
facteur à déplacer n'est jamais 1. Éprouvé sur 300 séances (2 400 questions) :
nombre de termes, bornes, solution entière et distincte, aucune entorse.

**Le regroupement.** Un terme lâché SUR un terme de la même sorte (avec x sur
avec x, sans x sur sans x) s'y additionne : il change d'abord de signe s'il a
changé de membre, puis la somme remplace la cible (surlignée en jaune pendant
le glisser) ; une somme nulle disparaît — « + 3x et − 3x s'annulent ». La
phrase sous l'équation dit les deux temps : « + 2x est passé de l'autre côté
du « = » : il devient − 2x. + 5x et − 2x se regroupent : + 3x. » Lâché sur un
terme de l'autre sorte, ou entre deux termes, il s'insère comme avant. Le
facteur ne devient prenable que quand il ne reste qu'un terme de chaque côté.

**La largeur.** Neuf termes ne tiennent pas en 2,1 rem : `eqdAjuster()` fait
descendre la police de l'équation jusqu'à ce qu'elle tienne dans la carte,
sans jamais revenir à la ligne, et les marges des étiquettes sont en em pour
rétrécir avec elle. Mesuré sur un téléphone de 390 px : 9 termes en 12,6 px,
300 px pour 322 disponibles ; sur ordinateur, la police ne bouge pas.

**La vérification finale** remplace x dans l'équation de DÉPART, membre par
membre : « à gauche, 5 × 4 − 4 = 16 ; à droite, 2 × 4 + 8 = 16 ».

### Puis deux termes côte à côte se regroupent d'un clic, dans un cadre vert (v733, novembre 2026)

**La demande**, sur une capture de « 9x = −6 − 21 » : « il ne propose pas de
regrouper deux termes côte à côte compatibles ; le faire comme quand on
calcule la division à la fin, qui est en vert ». Le regroupement existait,
mais par un geste qu'on ne voit pas — poser un terme SUR un autre.

**Le cadre.** Dans chaque membre, deux termes voisins de la même sorte (avec x,
ou sans x) sont enveloppés d'un cadre vert (`.eqd-paire`, les couleurs de la
fraction cliquable) ; les paires se prennent de gauche à droite sans se
chevaucher (`eqdPaires`) : trois nombres de suite font une paire, le
troisième attend la suivante. Un clic sur le cadre — ou sur l'un de ses deux
termes, ou Entrée quand il a le focus — les additionne (`eqdCliquePaire`),
signes compris ; une somme nulle disparaît. La phrase sous l'équation le
propose dès qu'un cadre est à l'écran. Le facteur, lui, ne s'encadre jamais :
dans l'équation réduite, il n'y a plus de paire.

**Le piège évité.** Un terme d'une paire reste prenable au glisser : après un
glisser, le navigateur envoie quand même un « click » quand le pointeur est
lâché sur l'élément de départ — un glisser raté (lâché hors de l'équation)
aurait alors regroupé la paire. Le glisser note son heure (`eqdGlisseA`), et
un clic qui le suit de moins d'une demi-seconde est ignoré. Éprouvé dans
Chromium : glisser raté sans effet, clic qui regroupe, Entrée qui regroupe.

### Puis rien ne se regroupe au départ, et chaque geste écrit une ligne d'étape (v734, novembre 2026)

**La demande.** « Je veux qu'il n'y ait jamais de termes qui puissent se
regrouper au départ dans l'équation. On peut mettre des termes en x dans le
membre de droite. Passer à la ligne quand un déplacement est effectué, pour
faire afficher les étapes. »

**Le tirage.** Chaque membre de départ porte AU PLUS un terme en x et un
nombre : rien ne se regroupe avant que l'élève ait déplacé un terme. Le « un
terme de plus à chaque question » de la v732 ne pouvait donc plus durer
au-delà de quatre termes ; la difficulté monte désormais par la forme
(`EQD_FORMES`) : ax + b = 0, ax + b = c, ax = cx + d, ax + b = cx, puis
ax + b = cx + d, l'ordre de chaque membre tiré à partir de la question 6.
Les bornes de la v732 restent (sommes des valeurs absolues ≤ 30, solution
entière non nulle, |A| ≥ 2). Éprouvé sur 300 séances : aucun membre de départ
n'a deux termes de la même sorte.

**Les étapes.** Chaque geste qui change l'écriture — déplacement, regroupement
par dépôt ou par cadre vert, facteur posé — range l'équation d'avant dans
`st.hist` (`eqdNoter`). L'écran devient une résolution écrite : les étapes en
gris, ligne après ligne, la ligne vivante en dernier dans son cadre en
pointillés, puis la fraction, puis « x = 4 » en bleu. Une seule grille
(1fr | = | 1fr) porte toutes les lignes, si bien que les « = » s'alignent ;
sa largeur suit son contenu (`max-width:100%`, sans `width`) : les deux colonnes
prennent la largeur du plus large membre, le « = » reste au milieu. La zone
de dépôt et le trait bleu se mesurent sur la ligne vivante seule
(`eqdRangVivant`), jamais sur la grille entière.

**Le piège rencontré.** `eqdAjuster()` comparait la largeur de l'équation à
celle de la carte ; une grille à `width:100%` est toujours aussi large que la
carte, et la police descendait à 11 px à chaque dessin. Sans `width`, et avec
le test du débordement réel (`scrollWidth > clientWidth`), elle ne bouge plus
que si l'équation déborde vraiment.

**Un réglage au passage.** Le clic qui suit un glisser est ignoré pendant
300 ms (500 ms en v733) : assez pour le « click » parasite que le navigateur
envoie au lâcher, pas assez pour avaler le vrai clic d'un élève rapide.

## {equation-resoudre-etapes} — résoudre ax − b = 0 pas à pas, comme sur la fiche (Seconde, 9.3, novembre 2026, v735)

**D'où il vient.** Demande de Turquet, sur la fiche « Exercice 1 » (a) « Complète
l'égalité pour qu'elle soit vraie : 2 × … − 6 = 0 », b) « Résoudre 2x − 6 = 0 »
en quatre lignes) : « faire un exercice comme le pdf, il faudra des flèches et
les termes entourés et des accolades comme sur le pdf ; quand une case est
remplie et que c'est la même en dessous, la compléter automatiquement ». Kind
`eqf`, ajouté après le 9.2 : rien n'est renuméroté.

**La page suit la fiche.** a) l'égalité à trou « a × [ ] − b = 0 » ; b) la
résolution, dans une grille à six colonnes (« Donc : », membre de gauche, « = »,
membre de droite, « = », résultat) : « ax (− b) = 0 », le terme entouré de
pointillés ; « ax = 0 + [ ] », sous une accolade bleue dont la pointe descend
vers la ligne suivante ; « Donc : (ax) = [ ] », ax entouré ; « Donc : x =
[ ]/[ ] = [ ] ». Deux flèches en pointillés : du terme entouré à la case de la
ligne 2, et de « ax » entouré au dénominateur. Flèches et accolade sont un SVG
posé par-dessus (`eqfTracer`, sur le modèle d'`eqrTracer`), qui lit les
positions RENDUES et se retrace au redimensionnement, à l'arrivée des polices
et après la correction (la case verte d'à côté décale l'accolade). La flèche
du facteur part du bord gauche de « ax » (18 % de sa largeur) : partie du
milieu, elle traversait le « x » de la ligne 4.

**La recopie automatique** (`eqfMiroirs`) : une case dont la valeur attendue
est celle de la case du dessus est un miroir (`.eqf-mir`, `.hors-note`, du
texte en pointillés) — ni noté, ni réclamé par `#confirmer-vides`, recopié à
chaque frappe, après la correction (sa couleur suit la case : bleu, rouge ou
vert) et à la reprise d'une pause (`resumeTest` appelle `eqfMiroirs`, et le
rendu se relit à 0 et 300 ms, après `restoreBoxes`). Pour « ax − b = 0 », la
ligne 3 (0 + b = b) recopie la ligne 2 et le numérateur recopie la ligne 2 :
l'élève écrit 4 cases. Pour « ax + b = 0 », « 0 − b » ne s'écrit pas comme
« −b » : la ligne 3 est une vraie case, seul le numérateur la recopie (5 cases).
Le miroir d'une case fausse recopie la faute : la correction verte est sur la
case.

**Le tirage.** a de 2 à 9, solution entière de 2 à 9 en valeur absolue,
|b| = |a × s| ≤ 40 ; la première question est celle de la fiche (2x − 6 = 0),
la deuxième est encore « ax − b = 0 », ensuite une sur deux en moyenne est
« ax + b = 0 », de solution négative. `distincte()` sur (a, s), six questions
réglables par le devoir (`dmNbQuestions(6)`). On range a et s, jamais les
réponses (`eqfDonnees`).

**Le juge.** Un entier par case (« − », « – », « - » se valent). La ligne 2
attend le nombre seul : le signe « + » ou « − » est déjà écrit, et le pourquoi
le dit si l'élève en ajoute un. Le pourquoi du résultat rappelle que c'est le
même nombre qu'au a) ; une copie juste affiche la vérification
(« 2 × 3 − 6 = 6 − 6 = 0 »).

## {equation-resoudre-deux-membres} — résoudre ax + b = c + dx ligne par ligne, comme la fiche (Seconde, 9.4, novembre 2026)

**D'où il vient.** Demande de Turquet, sur la fiche des exercices 2 et 3
(6x − 1 = 15 − 2x, puis −1 + 6x = −2x + 15) : « faire un exercice comme le
pdf, il faudra des flèches et des accolades comme sur le pdf ; quand une case
est remplie et que c'est la même en dessous, la compléter automatiquement ».
Kind `eqm`, ajouté après le 9.3 (`eqf`, ax − b = 0 pas à pas, fusionné le même jour sous l’identifiant que ce travail portait d’abord) : rien n’est renuméroté.

**La page suit la fiche**, six lignes « Donc : » alignées sur le « = » :
l'équation, ses deux termes qui vont changer de côté ENTOURÉS dès le départ
(le nombre de gauche et le terme en x de droite — demande de Turquet, le même
jour : « il faudra aussi les termes entourés au départ ») ; puis
« ax = (membre de droite) [case] », le nombre déplacé signe compris, et le
terme en x de droite entouré ; puis le terme en x arrivé à gauche — APRÈS ax
s'il était en fin de membre (exercice 2), AVANT s'il était en tête
(exercice 3) —, une ACCOLADE bleue sous chaque membre ; puis « [case] x =
[case] » ; puis « A × x = C », le facteur entouré ; enfin « x = C / [case] =
[case] ». Une flèche en pointillés part de chaque terme entouré vers la case
où il arrive (`eqmTracer`, un seul SVG sur la grille, refait au
redimensionnement, quand les polices arrivent, à chaque frappe) : par le haut
pour les deux déplacements, par le côté pour le dénominateur, comme sur la
fiche. Les accolades sont en CSS (`.eqm-acc`, `::before` et `::after`) : elles
suivent la largeur du membre sans rien mesurer.

**« Compléter automatiquement » : les miroirs.** Le nombre déplacé à la
ligne 2 se recopie à la ligne 3, A et C de la ligne 4 se recopient à la
ligne 5, et C au numérateur de la ligne 6. Ce ne sont pas des cases : des
`span.eqm-mir` en lecture, ni jugés ni comptés, qui affichent « …… » à vide
et recopient la case source à chaque frappe (`eqmMiroirs`) — et deux fois
après le rendu, parce que `restoreBoxes()` remet les valeurs d'une pause sans
lever d'événement. Après la vérification, un miroir dont la source est fausse
recopie la bonne réponse, en vert. Le dénominateur, lui, reste une case :
c'est le geste que la flèche enseigne.

**Le tirage.** Questions 1 et 2 : les deux exercices de la fiche. Ensuite
l'ordre des termes de chaque membre au hasard, A = a − d de ±2 à ±9 (négatif
une fois sur quatre), une solution entière non nulle de −10 à 10, |a| et |d|
de 2 à 9, |b| ≤ 15, |c| ≤ 30, par `distincte()` sur (a, b, c, d, ordres).
Cinq questions, réglables par le devoir (`dmNbQuestions`).

**Le juge.** Six cases par question (`eqmCases`). Le nombre déplacé exige son
signe (« 1 » seul est faux, et le message le dit) ; le terme en x aussi, sauf
s'il est en tête de membre (exercice 3) ; « x » sans coefficient vaut 1.
Les autres cases sont des entiers relatifs.
