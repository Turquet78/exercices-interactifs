# Terminale — dérivées, suites, récurrences et TVI

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Associer f à f′, sans une seule formule.** {associer-derivee} (Terminale,
thème Dérivée, demande de Turquet, août 2026) est repris de la fiche 9 : a) une
courbe de f dont on déduit le tableau — signe de f′, variations —, b) une
courbe de f′ dont on déduit le MÊME tableau, c) la question de la fiche : ces
deux courbes sont-elles COMPATIBLES ? Une séance = deux paires, l'une
compatible et l'autre non — sans quoi l'élève apprendrait que la réponse est
toujours du même côté —, à rang mélangé, chacune en trois questions sur les
mêmes dessins conservés.
**Le dessin est le moteur de courbes de {lecture-variations} de la Seconde,
PORTÉ au caractère près** — cinq fonctions (lvPickSubset, lvGenPts, lvAnalyze,
lvTangents, lvPath) comparées entre les deux fichiers par un contrôle, la
leçon de mlFeuille — et le tableau est celui d'{etude-fonction} (efTableHTML,
efArrowChange, mêmes ids `ef-*`) : chaque rendu VIDE les hôtes des autres
écrans, le piège documenté du tableau fantôme. La bonne réponse n'est jamais
rangée à côté de la question : la question ne porte que les deux courbes, et
la compatibilité est la COMPARAISON des deux tables, recalculées par les
fonctions qui corrigent.
**L'incompatible se fabrique en MUTANT la vraie table de f** — signes opposés,
un zéro décalé, un zéro de plus ou de moins — puis la paire est REVÉRIFIÉE par
la fonction qui corrigera : une mutation qui ne mute rien ferait dire « non »
à un élève qui a raison. Les zéros de f′ changent de signe (un zéro sans
changement n'est pas un extremum), jamais voisins (le segment entier serait
posé sur l'axe — la leçon des solutions voisines d'{equation-graphique}),
jamais au bord.
**Une case vide ne rougit jamais — tenue ici dès le premier jour.** Le 5.2,
copié au départ, marque tout ce qu'il voit et vit pour cela dans la liste des
dispenses du banc navigateur (`casesVides.sans`) ; l'exercice neuf n'y entre
pas : rien n'est peint tant que la copie est vide, et une case vide ne reçoit
aucune couleur avant le verrouillage. C'est le contrôle universel du banc
navigateur qui l'a vu, à la première visite.
**Et la correction est celle de la convention COMMUNE (`corrCase`), pas la
révélation en vert du 5.2.** Le premier jet révélait tout en VERT : « 7 cases
justes sur 8 » sous un tableau entièrement vert — l'écran contredisait le
message, et on ne voyait plus quelle case reprendre (signalé par Turquet sur
une capture, août 2026). La case fausse RESTE rouge avec la saisie de
l'élève, la bonne réponse s'affiche en bleu à côté (badge `mf-cor`, calé près
de SON menu pour les flèches — inséré dans le flux, il s'empilait au coin du
tableau), la case vide est remplie en bleu. Et la famille `s1-in` n'avait
AUCUNE règle `.sol` : la leçon de `.itv-sel.sol`, revenue en Terminale — la
règle posée répare d'un coup tous les exercices qui remplissent une `s1-in`
vide. Éprouvé en le cassant treize fois — et le sabotage de la case vide est
d'abord resté vert : le bord n'est atteignable qu'en SOUTIEN, l'entraînement
le masque sous la correction — la leçon des sabotages impossibles, encore.

**Et le même savoir, à l'envers du QCM : choisir le tableau de f parmi
quatre.** {variations-depuis-derivee} (Terminale, thème Dérivée, demande de
Turquet, août 2026) est l'exercice 4 de la fiche 9 : la courbe de f′ donnée,
quatre tableaux de variations proposés, et les distracteurs sont les pièges
MÊMES de la fiche — celui qui lit les SOMMETS de f′ au lieu de ses zéros (le
« 3,25 » de la fiche est l'abscisse du sommet), celui qui INVERSE les sens,
celui dont un zéro manque ou s'est décalé. Des propositions qui différeraient
par autre chose se laisseraient éliminer sans lire la courbe — la leçon
d'{intervalles-inegalite}, et « à forme égale le rang change » aussi.
La question ne porte que la courbe, l'ordre et les indices des distracteurs
(on range l'indice, jamais l'objet) ; les quatre tableaux sont CONSTRUITS
depuis la courbe même, et la correction nomme le piège du tableau choisi.
Moteur d'{associer-derivee} réutilisé (afGraphSVG, afpZeros, afpCourbeDer),
tableau statique dessiné avec les classes du 5.2. Deux défauts attrapés par
le contrôle avant la mise en ligne : lvAnalyze compte les bords d'un PALIER
comme des sommets — le piège aurait listé un sommet que l'œil ne voit pas,
d'où afqSommets — et un garde-fou « sommet sur un zéro » qui n'écartait
jamais rien (une courbe traverse l'axe en montant, jamais en tournant) :
le cinquième garde-fou mort du projet, retiré, sabotage à l'appui. Éprouvé
en le cassant neuf fois.

**Le QCM de la fiche : le tableau de f′ ET de f, puis UNE SEULE affirmation vraie.**
{signe-derivee-qcm} (Terminale, thème Dérivée, demande de Turquet, septembre
2026 — « un exercice comme le pdf : l'élève complète le tableau de signe de
f'(x) avec les variations de f(x) sur la ligne suivante et répond au QCM, il
ne doit y avoir qu'une seule bonne réponse ») suit {variations-depuis-derivee}
au menu. On donne la COURBE de f′, l'élève complète le tableau — zéros, signes
de f′, flèches de f — puis choisit parmi quatre affirmations : « f admet un
minimum en 1 », « f admet un minimum en 0 », « f est décroissante sur
[−1 ; 1] », « f est décroissante sur [0 ; 2] », la fiche au mot près.
**Tout est repris, rien n'est recopié** : le dessin et la table lue sont ceux
d'{associer-derivee} (afGraphSVG, afpZeros, afpCourbeDer), le tableau celui du
5.3 (efTableHTML, ids ef-* partagés — un CINQUIÈME écran entre dans la règle
des hôtes vidés symétriquement, et le contrôle sème un fantôme pour l'exiger),
le sommet celui de {variations-depuis-derivee} (afqSommets).
**LES QUATRE NE DIFFÈRENT QUE PAR CE QUI FAIT L'ERREUR**, et ce sont les
pièges mêmes de la fiche : un extremum posé sur un SOMMET de f′ (c'est f′ qui
a un creux en 1, pas f — f′ ne s'y annule pas), le bon zéro pris pour le
mauvais GENRE (« minimum en 0 » là où f′ passe du + au − : un maximum), un
intervalle qui ENJAMBE un zéro (« décroissante sur [−1 ; 1] » quand f′ change
de signe en 0), le SENS inversé sur un bon intervalle. Deux affirmations sur
un extremum, deux sur un sens — la composition de la fiche — et la vraie est
tantôt de l'une, tantôt de l'autre famille, chaque visage deux fois par séance
en ordre mélangé ; à famille égale, son rang change.
**« UNE SEULE BONNE RÉPONSE » EST TENU PAR LA CONSTRUCTION, ET EXIGÉ PAR LE
CONTRÔLE — pas par un garde du tirage.** La question ne porte que la courbe
et les quatre affirmations — leur NATURE, jamais leur vérité ni le nom de
leur piège, qui seraient la réponse rangée à côté de la question — ;
sdqVrai() relit chacune sur la courbe pour juger l'élève, et sdqPourquoi()
retrouve le piège choisi de la même façon pour le NOMMER dans le retour.
Chaque famille de piège est fausse par définition (un sommet n'est pas un
zéro, l'autre genre au même zéro, un zéro strictement dans l'intervalle, le
signe contraire sur un morceau sans zéro) et les quatre sont distinctes par
construction : le garde qui relisait les quatre par sdqVrai avant de retenir
la question — le premier jet le portait — n'écartait donc JAMAIS rien, le
sabotage l'a montré en restant vert, et il est retiré, le QUINZIÈME garde-fou
mort du projet. Le contrôle refait la vérité de chaque affirmation par une
SECONDE arithmétique — sur les signes relus dans les valeurs de la courbe,
sans jamais appeler sdqVrai — et exige exactement une vraie sur chaque
tirage (une dérive de la construction, l'intervalle qui enjambe devenu un
vrai morceau, rougit en nommant les deux vraies), le piège du sommet sur
chaque question, la composition 2 + 2, les deux familles, le rang qui varie,
et construit sur le repli de la courbe les affirmations des deux familles
pour les juger de même : le premier repli, inventé à la main, posait son
« sommet » en −2 quand le creux de f′ est en −1 — la sonde l'a montré avant
le premier banc.
**Et la question ÉPINGLÉE du contrôle a dû porter la phrase de la fiche pour
atteindre le juge** : avec « croissante sur [−1 ; 1] », un sdqVrai qui
oublie le zéro intérieur restait vert en parlant d'autre chose — il lit le
signe au milieu, c'est-à-dire en 0, le zéro même, compté à droite, donc −,
et « croissante » y est fausse de toute façon. Avec « décroissante sur
[−1 ; 1] », la phrase de la fiche, le même sabotage fabrique deux vraies et
refuse la copie juste — la leçon du sabotage impossible, une fois de plus.
**« f admet un minimum en 2 » s'écrit comme sur la fiche**, sans « local » :
c'est la phrase du professeur, et le tableau ne dit rien des valeurs — l'élève
lit un changement de signe, la page juge la même chose.
**Le QCM se choisit au CLIC comme une carte** (la choisie s'entoure en encre
NEUTRE — jamais un verdict avant la vérification, à quatre propositions il
suffirait d'essayer, et la liste ne se colore pas en direct même en soutien,
là où les cases du tableau le font), la bonne choisie est bleue, la bonne
montrée verte, la fausse choisie rouge ; chaque case se juge seule, la case
vide ne rougit jamais, et le QCM COMPTE une case dans la note affichée
(6 cases sur la question épinglée : 5 du tableau, 1 du QCM). Les contrôles
universels des deux bancs ont couvert l'exercice au premier passage sans rien
déclarer. Dix sabotages, neuf rougissant en nommant leur défaut ; le dixième,
le garde mort ci-dessus, est resté vert et disait vrai.

**L'étiquette « Cf′ » se pose À CÔTÉ de la courbe, jamais dessus — et c'est
la courbe ÉCRITE qui décide de la place.** Signalé par Turquet (septembre
2026) sur le 2.8 : « le nom de la courbe Cf′ doit toujours être à côté de la
courbe et pas sur la courbe comme cela peut arriver de temps en temps ».
L'étiquette du dessin partagé des dérivées (`afGraphSVG` — le 2.6, le 2.7 et
le 2.8) était posée à une place FIXE, au-dessus du point d'abscisse −2 : chaque
fois que la courbe DESCEND entre −3 et −2, elle passe au-dessus de ce point,
exactement là où l'étiquette s'écrit. Mesuré avant tout correctif : 132
courbes sur 600 la portaient sur la courbe — « de temps en temps » était une
fois sur cinq.
**LA COURBE EST ÉCHANTILLONNÉE SUR LES BÉZIER MÊMES QUE `lvPath` ÉCRIT**
(`afEchantillons`, les tangentes de `lvTangents`) — aucune coordonnée
supposée, une échelle qui changerait resterait mesurée juste (la leçon du
schéma des intervalles) — et `afEtiquettePos` BALAIE le dessin par pas de
3 px : une place est bonne si sa boîte est dans le dessin, hors de l'axe des
x et de ses nombres, et À CÔTÉ de la courbe — entre 5 et 15 px de tout point
de la courbe, ni dessus ni loin ; parmi les bonnes, la plus proche du point où
la courbe ENTRE dans le dessin, là où l'œil la cherche.
**Le premier jet calait des places SUR LA HAUTEUR de la courbe, et la sonde
l'a renvoyé** : six abscisses, au-dessus puis au-dessous — 132 échecs sur 600
encore. Sur une courbe qui monte ou descend raide, une boîte de 30 px de large
calée sur un point est TRAVERSÉE par la courbe quelle que soit sa hauteur :
c'est à GAUCHE ou à DROITE de la courbe qu'il faut aller, et seul un balayage
le trouve. Sonde après correction, 600 courbes : distance minimale 5 px,
jamais plus de 15 px de la courbe, jamais plus de 32 px du point d'entrée,
0 recours au secours.
**La boîte de l'étiquette est celle que Chromium REND** — relevée par
`getBBox` sur du vrai Fredoka (17,5 px de large, 12,6 au-dessus de la ligne
de base, 5,5 dessous) et prise avec de la marge — jamais devinée : le premier
jet la supposait 12 px au-dessus, et le rendu débordait de 0,6 px.
**UN SEIZIÈME GARDE-FOU MORT y a été écrit, puis retiré** : la bande qui
écartait l'axe des y et ses nombres. L'étiquette se pose près du point
d'entrée, à 110 px de cet axe — retirer la bande n'a changé AUCUN placement
sur 3000 courbes, et le sabotage l'a montré en restant vert. C'est le
CONTRÔLE qui tient ce bord. La bande de l'axe des x, elle, est VIVANTE :
retirée, 44 étiquettes sur 400 tombent sur les nombres de l'axe.
**Deux bancs, la répartition habituelle.** jsdom ne fait AUCUNE confiance
au placement : il lit le SVG que la page ÉCRIT — la position du texte, le
chemin de la courbe, les lignes des axes —, rééchantillonne lui-même les
Bézier, et exige la boîte rendue à ≥ 3 px de la courbe (la marge moins la
tolérance de l'échantillonnage), ≤ 20 px (une étiquette posée dans un coin
ne nommerait plus rien), dans le dessin, hors des deux axes — sur 400 courbes,
le tirage du 2.8 et celui de la Seconde, dans les deux habillages. Le
NAVIGATEUR (« 6 tricies », déclaré par `etiquetteCourbe` dans
`tests/profils.js`) mesure ce que jsdom n'a pas — la POLICE : la boîte par
`getBBox`, la courbe par `getPointAtLength`, sur chacun des trois exercices
ouverts pour de vrai puis sur quarante courbes de plus dessinées par la
fonction même de la page, et une boîte non nulle (un CSS perdu rendrait
l'étiquette invisible sans qu'une erreur ne se lève).
Sept sabotages au banc jsdom, cinq rougissant en nommant leur défaut — la
place fixe d'avant (260 sur 400), la marge à zéro, la borne « ni loin »
retirée (« loin de la courbe (99 px) »), la bande de l'axe des x oubliée, la
courbe échantillonnée à ses seuls nœuds (201 sur 400 : la page se croit à
côté, le contrôle voit la courbe passer sous l'étiquette). **Les deux verts
disaient vrai** : le score inversé (« la plus loin possible ») reste vert
parce que la borne des 15 px tient « à côté » à elle seule — le score ne fait
qu'ORDONNER les bonnes places, et sans la borne il rougit ; et la bande de
l'axe des y est le garde mort ci-dessus. Un huitième ne rougit QU'AU
NAVIGATEUR : la police de l'étiquette doublée — jsdom, qui ne lit pas une
police, reste vert sur sa boîte supposée, et Chromium nomme la courbe sous
l'étiquette rendue.
**La Seconde portait le même défaut, et il a été corrigé depuis** (deux fois :
voir les deux paragraphes ci-dessous) : `lvGraphSVG` et `adrSVG` posaient leur
« Cf » à une place fixe — sondé : 160 courbes sur 300 le portaient sur la
courbe. La demande d'alors ne nommait que le 2.8 de la Terminale ; ce
paragraphe raconte l'histoire avec ce qu'on en savait ce jour-là.

**Puis la Seconde a suivi — par une AUTRE branche, le même jour, et avec un
contrôle qui va PARTOUT.** Une seconde capture de Turquet — le 5.4, « L'écriture
"Cf′" est toujours sur la courbe » — avait lancé une deuxième session sur le
même défaut pendant que la #253 corrigeait la Terminale : deux moteurs pour la
même étiquette sont nés le même jour. C'est celui de la #253, en ligne et
éprouvé, qui reste en Terminale ; la seconde branche n'a gardé que ce que la
#253 n'avait pas fait — la SECONDE, que le paragraphe ci-dessus laissait en
décision à prendre, et le contrôle universel.
**Le contrôle vit dans le banc navigateur, greffé sur la visite de TOUS les
exercices** (section « 9 ») : toute étiquette de courbe (« Cf », « Cf′ »,
« Cg » — classes `lv-cf`, `sv-cf`, `eqg-cg`) est mesurée contre les courbes
RENDUES de son dessin, chemins ET droites, parcourues au pas de 1,5 px
(`getPointAtLength`) ; aucun point ne doit tomber dans la boîte du texte,
rognée d'un pixel. Il ne remplace pas le « 6 tricies » de la #253 — qui tient
en plus « ni loin » et la boîte de la police — : il tient le bord COMMUN sur
les trois niveaux, les dessins que personne n'avait déclarés (`tvgSVG`, le
repère du 4.5) et l'exercice à courbe qu'on ajoutera demain. C'est la règle du
projet : un défaut vu dans un coin devient un contrôle qui va partout.
**Et il en a trouvé VINGT en Seconde à sa première visite**, sur deux dessins
qui posaient leur « Cf » à une place fixe — `lvGraphSVG` (9 px au-dessus du
deuxième nœud du morceau) et `adrSVG` (le grand dessin). La sonde a mesuré le
fichier en ligne avant d'y toucher : sur 150 tirages, 63 étiquettes sur la
courbe pour le petit dessin, 69 sur un morceau (et 51 posées sur une
GRADUATION), 39 et 46 pour le grand — un défaut sur trois ou quatre.
**La pose se CHOISIT** (`lvEchantillon`, `etqLibre`) : la spline que `lvPath`
ou `adrPath` trace est échantillonnée sur ses Bézier mêmes, et des places sont
CONSTRUITES 4 px au-dessus du point le plus HAUT de la courbe sur toute
l'étendue de la boîte (ou au-dessous du plus bas), à des abscisses candidates
— les bouts du MORCEAU d'abord (une courbe qui n'existe que de −1 à 2 n'a rien
à offrir en −3), puis vers le centre — ; la première qui tient dans le cadre
sans mordre un axe ni ses graduations est retenue. **C'est un AUTRE moteur que
celui de la Terminale, et c'est nommé plutôt que tu** : la #253 balaie le
dessin et cherche « à côté » — 5 à 15 px, près du point d'entrée — sur UNE
courbe de sept nœuds ; la Seconde a des morceaux, treize nœuds, et deux courbes
qui se disputent un dessin de 258 px. La leçon de la #253 sur les « places
calées sur la hauteur » ne s'applique pas ici : une place est construite
au-dessus du plus haut point sur toute la LARGEUR de la boîte, pas calée sur
un point — une courbe raide ne la traverse pas. Le contrôle universel tient la
règle commune aux deux moteurs, et le dire vaut mieux que de le taire.
**Une constante ne se hisse pas, une fonction si — et la page entière est
morte au chargement.** `ETQ_W` posée à côté du moteur de courbes tombait dans
sa zone morte : le rappel de cours du 2.4 (`RAP_ING`) DESSINE au chargement
avec `lvGraphSVG`, bien avant que la ligne de la constante ne s'exécute —
« Cannot access 'ETQ_W' before initialization », et le bloc de script
s'arrête là, tout ce qui suit n'existe plus. Le commentaire de `RAP_ING` le
disait déjà en toutes lettres (« toutes les fonctions appelées ici sont des
déclarations, donc hissées ») : la règle valait pour une constante ajoutée
quatre mille lignes plus loin, et rien d'autre que le banc ne pouvait le
voir — c'est `npm test` qui l'a nommé, à la première exécution, avant la sonde
(« RAPPELS_ID before initialization », la page entière rouge). La constante
vit donc AVANT `RAP_ING`.

**Puis « Cg » est venue à son tour, et l'AUTRE courbe est devenue un
obstacle.** Le banc navigateur l'a nommée le jour même où « Cf » a été
corrigée — « Cg posée sur sa courbe », sur {lecture-deux-courbes} et
{equation-graphique}. Les trois poses de la seconde courbe — la droite de g du
2.5 (`eqgExtra`) et de la synthèse (`synDessus`), la spline de g du 2.6
(`ifgExtra`) — choisissaient un point une fois pour toutes, un demi-carreau
au-dessus du bout droit ; et une étiquette libre de SA courbe peut tomber sur
l'AUTRE, ou sur « Cf ». La sonde a mesuré le fichier en ligne avant d'y
toucher, sur 150 tirages par dessin : au 2.5, « Cf » sur une courbe 105 fois
et « Cg » 71 ; au 2.6, 92 et 79, plus 51 « Cg » posées sur une graduation ; à
la synthèse, 61 et 65 — plus d'une étiquette sur deux, parce que le premier
correctif n'évitait que la courbe de f, jamais celle de g.
`etqLibre` apprend donc des OBSTACLES — un sixième paramètre, facultatif — :
la boîte ne recouvre ni un point de l'autre courbe ni l'étiquette déjà posée. Le
dessin reçoit la courbe de g en obstacle pour poser « Cf » (`lvGraphSVG` et
`adrSVG` ont gagné un dernier paramètre `obst`) et transmet la BOÎTE de
« Cf » à ce qui dessine par-dessus — le troisième argument des fonctions
`extra`/`dessus`, qu'un dessin sans étiquette ignore ; `cgEtiquette` pose
« Cg » par le même chemin, la courbe de f et cette boîte en obstacles, le
cadre RELU dans les sx/sy mêmes du dessin (`lvCadre`) plutôt que recopié.
**Le contrôle mesure aussi les DROITES** (`line.eqg-g`) : il ne regardait que
les chemins, et une « Cg » posée sur la droite du 2.5 lui échappait.
**Et le repli a dû devenir la place la MOINS MAUVAISE.** Cinq abscisses
candidates laissaient, au 2.6, une étiquette sur seize au repli — deux
courbes et deux étiquettes se disputent un dessin de 258 px —, et le repli
prenait la PREMIÈRE place, ramenée dans le cadre : sur la courbe, ou sur une
graduation (9 « Cf » et 9 graduations sur 150, mesurés après le premier
jet). Les candidats vont désormais par demi-graduation jusqu'au centre
(`etqCandidats`, les bouts d'abord — le droit pour « Cg », où elle a toujours
été), et faute de place libre `etqLibre` choisit la boîte qui contient le
moins de points de courbe, un axe recouvert comptant pour beaucoup.
Après correction, la sonde rend ZÉRO sur 300 tirages de chacun des quatre
dessins — la scène et les cartes du 2.5, le 2.6, la synthèse — : aucune
étiquette sur une courbe, aucune sur une graduation, aucune sur l'autre
étiquette, et le banc navigateur est vert sur les trois niveaux.
**Deux sabotages au banc navigateur, chacun rougissant en nommant son
défaut** — « Cg » posée en plein milieu de sa courbe, SANS hasard (le banc
nomme {lecture-deux-courbes}, {equation-graphique} et {synthese-fonction} :
l'ancienne pose, elle, n'atteignait sa cible qu'une fois sur deux, et un
sabotage intermittent ne dit rien du contrôle visé), et la droite de g
retirée des obstacles de « Cf », qui rougit sur {equation-graphique}. Mais
un obstacle retiré ne fait tomber l'étiquette dessus qu'un tirage sur deux
ou sur quatre : ces sabotages-là se COMPTENT à la sonde plutôt qu'au banc —
la droite de g retirée des obstacles de « Cf » remet 63 « Cf » sur 150 sur
une courbe au 2.5 ; les obstacles retirés de la pose de « Cg » en remettent
36 au 2.5, 30 au 2.6 et 18 à la synthèse, et une fois « Cg » sur « Cf ».
Compté sur 150 tirages, un sabotage dit exactement ce qu'il retire.

**Puis « à côté » a voulu dire À CÔTÉ, avec de l'air — et la boîte supposée
était le défaut.** Demande de Turquet (septembre 2026) : « même chose en
seconde », après le dessin des dérivées de la Terminale. **La sonde a mesuré
avant qu'on ne touche à quoi que ce soit, et elle a redressé la demande** :
les étiquettes de la Seconde ne se posaient DÉJÀ plus sur leur courbe — le
paragraphe ci-dessus tient, zéro sur 4 800 étiquettes — mais elles la
FRÔLAIENT : 684 sur 1200 à moins de 3 px, médiane 2,8 px sur le petit dessin,
minimum 1,1 px. Ce n'est pas la règle de la Terminale, qui garantit 5 px
d'air ; et le contrôle universel, qui demande « aucun point de courbe DANS la
boîte », restait vert à bon droit sur un dessin où le nom touche la courbe.
**LA CAUSE EST LA BOÎTE SUPPOSÉE, la leçon de la Terminale payée une seconde
fois.** `ETQ_W`/`ETQ_H` valaient 30 × 17 avec la ligne de base 13 px sous le
haut ; relevée au `getBBox` sur les VRAIES polices — Nunito 800 italique 15 px
pour « Cf », Fredoka 700 pour « Cg » —, l'encre fait 15,5 px de large, 15 px
AU-DESSUS de la ligne de base et 6,2 px dessous. La boîte qu'`etqLibre`
écartait était donc 2 px trop haute et 2,2 px trop basse : l'encre débordait
des deux côtés, et les 4 px d'air se réduisaient à moins de 2. Elle épouse
l'encre désormais (`ETQ_MONTEE`, `ETQ_DESCENTE`, et `ETQ_W` à 16), et l'air
est `ETQ_MARGE` — 5 px, la marge du dessin de la Terminale — et lui seul.
**Une largeur réservée plus LARGE que l'encre n'est pas une précaution** :
elle desserre en silence la borne « ni loin » du balayage, qui se mesure sur
la boîte réservée quand le contrôle mesure l'encre — 15 px garantis devenaient
17 mesurés, et le banc accusait une page juste. Le sabotage la remet, et il
rougit.
**LA BANDE HORIZONTALE COMPTAIT POUR 2 px, ET C'ÉTAIT LE SECOND TIERS DU
DÉFAUT.** Une place est construite `ETQ_MARGE` au-dessus du point le plus haut
de la courbe sur la LARGEUR de la boîte — mais cette largeur était élargie de
2 px seulement : un point JUSTE hors de la bande n'est contraint par rien
verticalement, il peut se poser à la hauteur de l'étiquette, et ces 2 px sont
alors tout ce qui l'en sépare. La bande s'élargit de `ETQ_MARGE`, et 28
étiquettes de plus quittent la courbe.
**UN ÉCHANTILLON DOUBLÉ Y A ÉTÉ ÉCRIT, PUIS RETIRÉ** — 60 points par segment
au lieu de 30. Il servait vraiment tant que le resserrement ci-dessous
existait : à marge 3, une étiquette sur 800 tombait à 2,8 px d'une courbe que
la page croyait à 3, l'écart entre le point échantillonné et le vrai extremum.
La marge revenue à 5 partout, ces 0,2 px ne coûtent plus rien : mesuré à
l'identique des deux côtés sur 14 600 étiquettes (minimum 5,0 px, zéro sous
3 px). Un garde-fou qui n'écarte plus rien fait croire qu'on vérifie quelque
chose ; son sabotage reste vert, et son vert dit vrai.
**ET LE BALAYAGE EST VENU DU CÔTÉ DE LA TERMINALE — c'est la part de la
demande qui se voit le mieux.** Les places d'`etqLibre` sont calées sur des
abscisses candidates (les bouts du morceau, puis vers le centre) ; sur le
dessin encombré du 2.6 — deux courbes et deux étiquettes dans 258 px —
aucune ne tenait à 5 px, et le REPLI prenait alors la place la moins
mauvaise, c'est-à-dire sans aucune marge garantie : elle tombait à côté par
chance, et une propriété heureuse n'est pas une propriété tenue. `etqLibre`
BALAIE donc le dessin avant de renoncer, comme le fait `afEtiquettePos` en
Terminale : pas de 4 px, la boîte à `ETQ_MARGE` au moins de toute courbe et
de tout obstacle, et parmi les places libres la plus proche du DÉBUT de la
courbe — là où l'œil cherche son nom. Il ne coûte rien d'ordinaire : sur
6 200 poses, il ne sert que 15 à 21 fois, toutes au 2.6, et le repli n'est
plus jamais atteint.
**Un RESSERREMENT de la marge y a été écrit, puis retiré — le garde-fou mort
de cette page.** Le premier jet réessayait à 4 px puis à 3 px avant de
renoncer, et il servait vraiment tant que le balayage n'existait pas (4
replis sur 300 dessins du 2.6, ramenés à zéro). Le balayage l'a rendu inutile
et même NUISIBLE : il trouve une place à 5 px là où les abscisses calées n'en
offrent aucune, si bien que le resserrement ne faisait plus que dégrader ce
qu'il croyait sauver — 3,4 px au plus juste au lieu de 5,0, mesuré sur 14 600
étiquettes, pour zéro repli des deux côtés. Son sabotage restait vert, et son
vert disait vrai.
**ET LA SONDE A ATTRAPÉ UN DÉFAUT DU BALAYAGE AVANT QUE LE MOINDRE TIRAGE NE
LE MONTRE** : il bornait la distance à TOUTES les courbes confondues, la
sienne et les obstacles. Une place à 6 px de la courbe de f et à 32 px de la
droite qu'elle nomme satisfaisait donc « ni loin » sans nommer quoi que ce
soit. **L'écart à SA courbe et l'écart aux AUTRES ne se mélangent pas** : le
premier est borné des deux côtés (entre `ETQ_MARGE` et `ETQ_MARGE` + 10), le
second seulement par le bas. Cela ne s'est vu qu'en FORÇANT le balayage — en
ne lui donnant aucune abscisse candidate —, jamais au tirage.
**Deux bancs, la répartition habituelle.** jsdom lit le SVG que la page ÉCRIT
— la position de CHAQUE étiquette, le chemin de CHAQUE courbe, les lignes des
axes —, rééchantillonne lui-même les Bézier et mesure la boîte RENDUE contre
toutes les courbes du dessin : ≥ 3 px, ≤ 17 px, dans le dessin, hors des deux
axes, sur les SIX dessins qui portent une étiquette (le petit, le grand, les
deux à deux courbes, la synthèse, les petites cartes du QCM), 800 étiquettes.
Il COMPTE les replis et les refuse — une pose sans marge garantie n'est pas
une pose —, et il ÉPROUVE LE BALAYAGE DIRECTEMENT, en le forçant : il ne sort
qu'un dessin sur 800 au tirage, et un contrôle qui l'attendrait ne mesurerait
à peu près jamais rien. La moitié des cas forcés le sont sur « Cg » du 2.6,
avec « Cf » déjà posée en obstacle : c'est là que la borne haute se joue.
Le NAVIGATEUR (« 6 tricies », déclaré par `etiquetteCourbe` dans
`tests/profils.js`) mesure ce que jsdom n'a pas — la POLICE : `getBBox` contre
`getPointAtLength`, sur trois exercices ouverts pour de vrai puis sur quarante
dessins de plus. **Sa mesure ne connaît plus aucun moteur** : toutes les
étiquettes du dessin contre toutes ses courbes, l'hôte étant le parent du
premier SVG affiché ; seul le redessin diffère, et le profil le NOMME
(`moteur`) — le même contrôle sert les deux niveaux, ce que « même chose en
seconde » voulait dire.
Après correction, sur 14 600 étiquettes des six dessins : minimum 5,0 px,
maximum 7,7 px pour une place calée et 15,4 px pour une place de BALAYAGE —
la fourchette que la page s'impose —, zéro à moins de 3 px, zéro repli.
**La borne du banc est à 17 px et non à 15** : la page mesure sa boîte
RÉSERVÉE, le contrôle mesure l'ENCRE, et les deux diffèrent de 0,8 px en bas —
15,4 px ont été mesurés sur une page juste, et une borne à 16 n'aurait laissé
que 0,6 px de marge à un banc, c'est-à-dire un contrôle intermittent en germe.
**Treize sabotages, dix rougissant en nommant leur défaut.** **Et la bande de l'axe des y, morte en
Terminale, est VIVANTE ici** : la retirer pose 12 étiquettes sur les nombres
de l'axe, parce que les morceaux du 2.6 amènent la courbe tout près de lui.
**Les TROIS verts disent chacun quelque chose, et aucun n'est un contrôle
faible.** Deux sont les garde-fous morts nommés ci-dessus — le resserrement de
la marge et l'échantillon doublé. Le troisième, la borne haute du balayage
retirée, ne rougit qu'une exécution sur trois : le balayage ne sort qu'un
dessin sur quelques centaines, le banc ne l'atteint donc pas à tous les coups,
et un sabotage intermittent ne dit rien du contrôle visé. **Il se compte à la
SONDE**, qui le chiffre sans ambiguïté : sans cette borne, le maximum du 2.6
passe de 15,4 à 21,0 px sur 2 400 étiquettes. C'est le motif déjà employé sur
les obstacles de « Cg » au paragraphe précédent.


**Le 1.3 (Signes & variations) suit la convention commune de correction.**
Signalé par Julien, transmis par Turquet (août 2026) : « toutes les cases
correctes, mais 0,9/1 ». L'écran RÉVÉLAIT tout en vert par-dessus la copie —
la convention abandonnée du 5.2 — si bien que l'élève ne voyait plus quelle
case était fausse, et que la note ne tenait qu'au garde-fou de `ptsRep`
(« 7 cases justes sur 8 » sur un écran tout vert : l'écran contredit le
message, le défaut déjà corrigé sur {associer-derivee}). `checkSV` passe par
`corrCase` : la case fausse reste rouge avec la réponse de l'élève et la
bonne s'affiche en bleu à côté (badge calé près de SON menu pour les
flèches — la leçon du 5.4), la case vide est remplie en bleu et ne rougit
jamais, même en soutien, et la note enregistrée compte les vraies cases. La
famille `vt-sel2` n'avait AUCUNE règle `.sol` — la leçon des familles de
listes, revenue une énième fois : la règle posée sert aussi au 5.4, qui
remplissait déjà des flèches vides en bleu invisible. Un contrôle tient ces
bords, éprouvé par deux sabotages.

**Le signe du premier degré pose 5 questions, et non plus 15** (demande de
Turquet, août 2026). Les trois niveaux restent TOUS représentés — 2 du
niveau 1, 2 du niveau 2 (la racine en fraction), 1 du niveau 3 (la racine
0) —, dans leur ordre. Le compte vit dans `S1_NB`, à côté de sa fabrique
`s1BuildQuestions()`, et le contrôle le compare à `tests/profils.js`
(`nbQuestionsSignePremier`) — deux sources, comme `SF_NB`. Il tient aussi la
COMPOSITION : un niveau qui disparaîtrait de la séance ne casserait rien, et
personne ne le verrait — une aide absente ne se signale pas.

**Le 1.1 a trois boutons, et chacun fait ce qu'il dit.** La racine du
niveau 1 peut être π — le SEUL symbole de toute la famille des tableaux de
signes, à taper dans des cases en texte brut : « pi » était accepté par
`s1RootOK` depuis toujours, mais rien ne le disait, et aucun clavier ne porte
π (demande de Turquet, août 2026 : « un bouton pour lettre pi, un bouton pour
le clavier virtuel math et le bouton pour les raccourcis »).
**Un bouton qui ne ferait rien serait pire que pas de bouton** — la doctrine
du bouton MORT — et c'est ce qui a décidé de chacun des trois :
· **π INSÈRE au curseur par `paveInserer`**, le moteur d'insertion du pavé,
  déjà éprouvé : il pose la sélection ET lève l'événement `input`, sans quoi la
  correction en direct du soutien ne verrait jamais la frappe — la leçon
  documentée du pavé, qui aurait été repayée ici. Cible : la case qui a le
  focus, sinon la dernière visitée, sinon celle de la racine — jamais une case
  verrouillée : l'écran vérifié reste figé.
· **⌨️ montre le clavier de la PAGE — le pavé — et non le clavier MathLive** :
  l'écran n'a aucun `math-field` (toute la famille des tableaux est en champs
  texte), et le clavier MathLive ne sait pas y écrire — un ⌨️ qui l'ouvrirait
  serait un bouton mort. `__paveManuel` ouvre au pavé une porte qu'il n'avait
  que sur écran tactile, et elle RESTE ouverte tant qu'on ne reclique pas : un
  clavier demandé reste demandé. Sur tablette, le pavé vient déjà tout seul —
  les cases du 1.1 sont enfin déclarées `inputmode="numeric"`, la convention
  de `spBox` qu'elles n'avaient jamais reçue : c'était le clavier du SYSTÈME,
  une moitié d'écran, qui s'ouvrait sur elles.
· **☰ dit les raccourcis VRAIS de cet écran** — « tape pi », le signe moins,
  la fraction à la barre, la virgule — dans sa propre fenêtre (`#s1help`, le
  cadre de `#kbhelp`) : la table MathLive de `mlDexp.showShortcuts()` n'a pas
  UNE ligne qui vaille dans un champ texte, l'afficher ici mentirait.
**Et « tape pi » se VOIT** : la valeur complète `pi` (ou `-pi`, à la casse
près) devient π sous les doigts, comme dans un champ MathLive — en phase de
CAPTURE, pour que la correction en direct, attachée en phase de bulle, lise la
case déjà convertie. On ne convertit que la valeur ENTIÈRE : un « p » seul
n'est jamais mangé, sans quoi taper « pi » deviendrait impossible.
La photo du circuit papier retire les rangées d'outils (`.s1-jetons`, et
`.sa-jetons` qui laissait traîner son « Insérer : » sans boutons). Neuf
sabotages, chacun rougissant en nommant son défaut — et le neuvième n'est vu
QUE par le banc navigateur : la règle `#s1help.open` retirée, jsdom lit la
classe et reste vert pendant que la fenêtre a un rectangle NUL — le piège
documenté de `[hidden]`, par la porte d'à côté.

**Au 1.4 et au 1.5, un + 0 inutile ne s'écrit pas — et l'écriture nue est
juste.** Signalé par Turquet (août 2026) sur deux captures : quand la racine
d'un facteur vaut 0, le tirage fabriquait « −x + 0 » et « 3x + 0 » — l'énoncé
les affichait tels quels, et l'élève qui recopiait « −x », l'écriture du
cahier, ROUGISSAIT (« la case rouge doit être bonne car +0 ne sert à rien »).
Une réponse juste comptée fausse : le pire défaut du projet, par la porte du
formatage.
**Deux faces, un entonnoir chacune.** `spFacteur()` écrit l'affine NUE quand
b = 0 — et comme l'énoncé, les étiquettes du tableau, la correction verte
(`spCorr`) et le rappel de cours lisent tous ses `tex`/`plain`, une seule
branche corrige les quatre affichages d'un coup. `spFactForms()` — le juge,
que `spMatchFact` et `spCarreOk` partagent, donc le 1.4 ET le 1.5 — accepte
l'écriture nue et GARDE les écritures au + 0 (« 3x+0 », « 0+3x », « 3x−0 ») :
une question mise en pause avant le changement affiche encore son « + 0 », et
la recopier doit rester juste — les formes se recalculent depuis a et b, pas
depuis les étiquettes rangées, c'est ce qui rend les vieilles pauses sûres.
**Le bord opposé compte autant** : quand b ≠ 0, la constante reste EXIGÉE —
« 3x » pour 3x − 6 est faux, et un contrôle qui ne tiendrait que
l'acceptation laisserait passer un juge devenu laxiste. Le contrôle épingle
les deux captures, tient les deux bords, balaie 400 tirages (aucune étiquette
au + 0, aucune constante perdue) et EXIGE que le tirage produise encore des
racines nulles — un contrôle qui n'a rien à mesurer ne mesure rien, et doit
le dire. Cinq sabotages, chacun rougissant en nommant son défaut.

**La tangente à (ax+b)eˣ démontre ce que l'énoncé annonce — et les deux lisent
la même fonction.** {tangente-exp} (Terminale, à côté d'{equation-tangente},
demande de Turquet, août 2026) est repris de la fiche papier : f(x) = (ax+b)eˣ
et sa dérivée sont DONNÉES, l'élève démontre f(0), f′(0), la tangente en 0,
puis f(1), f′(1) et la tangente en 1 — avec les mêmes étapes que l'exercice de
tangente : y = f′(a)(x−a) + f(a), substituée, remplacée, développée, réduite.
Le tirage suit la demande : a entier non nul entre −2 et 2, b entier entre −2
et 2, les trois fonctions d'une séance distinctes.
**Chaque « Démontre que » RÉVÈLE sa cible, et c'est la forme de la fiche** : le
travail noté est la route, pas le résultat. Le danger est donc l'énoncé qui
contredit sa correction — le pire défaut du projet, déjà vu sur les
intervalles. La question ne porte QUE a et b ; `txAns()` recalcule tout, et
l'énoncé comme la correction le lisent. Le contrôle recalcule ces valeurs par
sa PROPRE arithmétique et exige que les phrases les disent, puis que les cases
remplies avec elles passent toutes au vert.
**Les pentes ne sont jamais nulles** (a+b ≠ 0 et 2a+b ≠ 0) : une tangente
horizontale ferait disparaître le terme en x des lignes à remplir, comme
{equation-tangente} écarte déjà m = 0. Et **b = 0 retire la case du « + 0 »**
de la ligne réduite au lieu de l'exiger : une case pour écrire zéro n'apprend
rien, c'est la leçon des retenues de la soustraction.
**En 1, le « e » est écrit par la page et la case porte le coefficient** —
« [3]e » — sinon il aurait fallu analyser « 3e » tapé librement, et « −e »
s'écrit avec une case à −1. Les deux constantes de la ligne développée
s'acceptent dans les deux ordres, comme dans {equation-tangente}. Une case
vide ne rougit pas en soutien — l'exercice modèle le faisait, la règle de
partout l'emporte — et l'entraînement révèle les bonnes réponses en vert,
comme le modèle. Éprouvé en le cassant sept fois : a = 0 autorisé, pente
nulle, la réponse rangée dans la question, une case qui ne se juge plus, les
constantes à ordre imposé, l'énoncé qui contredit la correction, la case vide
rougie — chacun rougit en nommant son défaut.

**L'étude complète, c'est la fiche entière sur un seul écran — et trois moteurs
qui servent au lieu d'être recopiés.** {etude-exponentielle} (Terminale, 5.5,
demande de Turquet, août 2026) est repris de la fiche « étude de fonction
expo » : f(x) = (ax + ab)e^(−x), a = ±1, b entier de −4 à 4, et les sept
parties de la fiche dans son ordre — les intersections avec les axes, la
dérivée RÉDIGÉE dans la feuille du 2.2 (u, v, u′, v′ facultatifs, l'IA lit la
rédaction), le tableau de signes et de variations du 5.3 (`efTableHTML`,
`efSyntHTML`, `efArrowChange` — le même moteur, généralisé d'une ligne), la
valeur de l'extremum, f(1), f′(1), et la tangente en x = 1 avec les étapes du
5.2, écrites en FRACTIONS empilées sur e. Écrire la constante ab (et non b)
donne un zéro ENTIER (x = −b) et un extremum entier (x = 1 − b).
**La bonne réponse n'est jamais rangée à côté de la question** : elle ne porte
que a et b, et `ecAns()` — que l'énoncé, le rendu et la correction lisent
tous — recalcule tout ; le contrôle refait ces calculs par sa propre
arithmétique sur les 14 couples possibles. Le tirage écarte b = 0 (f′(1)
serait nulle : tangente horizontale, la leçon des pentes nulles) et b = −1
(f(1) = 0 : le point de tangence tomberait sur l'axe).
**Deux juges, une seule note.** 46 cases locales et une feuille dont le
verdict vient du modèle : la note les compte ensemble (47), et le contrôle
CLIQUE — la feuille vide arrête la vérification AVANT l'appel au modèle, la
dérivée refusée coûte exactement son point, les cases fausses sont révélées
en vert (la convention du 5.2) et une case vide ne rougit jamais en soutien.
**Les ids du tableau sont partagés avec l'écran du 5.3** : chaque rendu vide
l'hôte de l'autre écran, sans quoi `$()` lirait le tableau FANTÔME de l'écran
quitté. Éprouvé en le cassant treize fois — la réponse rangée dans la
question, b = 0 et b = −1 autorisés, `ecAns` faussée, le titre qui annonce
toujours un maximum, la case vide rougie, la paire de la tangente à ordre
imposé, la feuille vide envoyée au modèle, l'attendu faussé (chaque moitié),
la note qui ignore le verdict, la révélation débranchée, le tableau aux
signes inversés — chacun rougit en nommant son défaut. **Deux contrôles se
sont pris en défaut au premier essai** : « maximum » cherché dans tout
l'écran ne prouvait rien (le sélecteur min/max porte toujours les deux mots —
on vise le TITRE de la partie d), et la dérivée cherchée dans tout l'attendu
non plus (la moitié « autre ordre » la portait encore — on exige chaque
moitié).

**L'étude de la fiche, menée au TVI : la solution α et le signe.**
{tvi-alpha-signe} (Terminale, demande de Turquet, septembre 2026, repris de
la fiche « Exercice 2 : Étude de f(x) = (x + 2)e⁻ˣ ») ferme le thème TVI :
c'est la fiche MÊME du 5.5 (a = 1, b = 2), menée cette fois jusqu'au TVI —
a) conjecturer les limites en ±∞ et l'asymptote sur la COURBE, b) démontrer
f′(x) = (−x − 1)e⁻ˣ (la cible est révélée, la route est notée — la forme de
{tangente-exp}), c) le tableau de signes et de variations du 5.3, d) le
maximum M = e, e) f(x) = 0 admet une UNIQUE solution α sur la branche
monotone — les mots du 4.1 (« continue », « strictement croissante »,
« TVI », « unique ») —, α à la calculatrice, f) en déduire le tableau de
SIGNE de f, α en tête.
**Tout est repris, rien n'est recopié** : le tirage est `genECCase()` — le
générateur MÊME du 5.5 —, l'arithmétique `ecAns()`, le tableau
`ecTab()`/`efTableHTML`/`efArrowChange`, la courbe `ecGraphSVG()`, la lecture
des limites `lgLimOK()` du 3.2 (« inf » accepté), l'expression de la dérivée
`checkExprFn()` (toute écriture égale — « −(x+1) » vaut « −x−1 »), la
correction `corrCase()` et la phrase `msgCorrCouleurs()`. La séance montre
les DEUX visages, a = 1 et a = −1, chacun UNE fois en ordre mélangé, b jamais
le même — sans quoi l'élève apprendrait que le signe de f est toujours
« − puis + ». La bonne réponse n'est jamais rangée à côté de la question :
elle ne porte que (a, b), et le contrôle REFAIT l'arithmétique par ses
propres moyens — f numérique, dérivée par différence finie, e de Math :
f(−b) = 0 exactement, la stricte monotonie de la branche, M = a·e^(b−1), les
limites et les signes attendus comparés à la fonction même.
**La fiche se contredit — « f(x) = 0 » dans le titre de son e), « f(x) = 1 »
au milieu — et c'est f(x) = 0 qui est tenu** : le f) ne se déduit de α que si
f(α) = 0, et α = −b tombe alors sur un entier, que la calculatrice confirme
au lieu de le contredire.
**Un QUATRIÈME écran partage les ids ef-*, et jsdom a montré le piège avant
le navigateur** : dans un vrai navigateur l'ordre du document protégeait les
trois écrans amont du nouveau venu (posé en dernier), mais le cache d'id de
jsdom rend l'élément créé en PREMIER — le contrôle du 5.4 s'est mis à peindre
les cases du 4.6 restées dans leur hôte. Les hôtes se vident désormais
SYMÉTRIQUEMENT : chacun des quatre rendus vide les trois autres, et le
contrôle sème un fantôme pour l'exiger. Onze sabotages jsdom, chacun
rougissant en nommant son défaut — dont un d'abord à l'ancre NON UNIQUE (la
ligne de la case vide vit aussi dans `checkRF` : un sabotage se pose sur une
ancre PROPRE à sa cible, la leçon retombée telle quelle). Le banc NAVIGATEUR
(« 6 vicies ter », déclaré par `alphaSigne`) tient ce que jsdom ne voit pas :
les flèches du tableau DESSINÉES à une taille lisible, la page qui ne déborde
pas, et le bouton ∞ réellement CLIQUÉ — il écrit dans la case et lève
`input`, la doctrine du bouton mort — avec deux sabotages à lui, jsdom
restant vert à bon droit sur chacun.

**Puis la dérivée du 4.6 s'est présentée COMME AU 2.1** (demande de Turquet,
septembre 2026 : « je veux que le calcul de la dérivée soit présenté comme
dans l'exercice 2.1 ») : le b) n'est plus trois cases en texte — c'est la
chaîne du 2.1, en cases MathLive : « On pose u/v/u′/v′ », la formule
u′×v + u×v′, la substitution ( )×( )+( )×( ), le développement en
coefficients devant e⁻ˣ, la factorisation e⁻ˣ( … ). Douze cases au lieu de
trois (44 sur l'écran), et la cible reste RÉVÉLÉE dans l'énoncé — la forme
de la fiche, « Démontre que ».
**Le juge est TRANSPOSÉ de dexpVerdicts, pas recopié à moitié** :
`asgDerVerdicts` porte la doctrine entière du 2.1 — les DEUX ordres u/v
acceptés (l'ordre retenu est celui qui colle le mieux à la copie, et la
correction le suit), la substitution jugée d'abord en LIGNE entière puis par
paires LIBRES, le développement apparié aux termes attendus sans ordre
imposé, la case vide d'une ligne juste = le facteur 1 OMIS — elle compte
juste et ne manque pas, sans quoi une copie mathématiquement complète serait
comptée fausse —, et le terme ENTIER recopié dans une case de coefficient
NOMMÉ dans le message (le signalement de Julien, porté avec la
présentation). La CORRECTION reste la convention commune de l'écran :
`rfReveal` — l'entonnoir du 6.6 — pour les cases math (badge `mf-cor` à
l'exposant rendu, posé APRÈS la parenthèse fermante d'une case `dexp-pwrap`,
jamais dedans), `corrCase` pour le reste ; jamais la « bonne démarche » du
2.1, qui n'écrit pas dans les cases. Les cases math ne se colorent qu'à la
SORTIE (le répartiteur `dexpLiveCheck` route le focusout vers
`checkASG(true)`), la rangée « Clavier mathématique » naît avec l'écran
(`renderASG` enveloppé), et le banc navigateur TAPE « x+2 » dans la case u
pour de vrai — jsdom n'a pas la sérialisation réelle que le juge doit lire,
et le piège documenté du 6.8 a mordu à la première exécution : les
premières frappes tombaient dans le vide, la case n'avait pas fini de
prendre le focus. Huit sabotages, chacun rougissant en nommant son défaut —
celui de la case vide remplie en `sol` rougit chez le 6.6, la preuve que
`rfReveal` est bien l'entonnoir partagé et non une copie.

**Un exercice de devoir montre d'abord son énoncé — et le papier est un choix.**
En Terminale, un exercice lancé depuis un devoir affiche D'ABORD l'énoncé
complet, toutes les questions, puis demande : sur papier, ou sur l'ordinateur
(demande de Turquet, août 2026). Les énoncés étant TIRÉS au hasard, le
professeur ne peut corriger une feuille que s'il reçoit le tirage exact de
l'élève : c'est toute la raison du circuit.
**Le tirage montré est fait par la porte normale** (`TESTS[id].start()`), puis
photographié question par question par la porte du REJEU (`afficherEcranDe`) —
les cases de saisie deviennent des pointillés, les boutons disparaissent.
Réutiliser les rendus mêmes de l'exercice garantit qu'un énoncé ne peut pas
diverger de l'exercice, et un exercice ajouté demain est couvert sans rien
déclarer ; un exercice dont le kind est inconnu du rejeu retombe sur le chemin
d'avant au lieu d'enfermer l'élève sur un écran vide. Le minuteur d'un
exercice à chronomètre est COUPÉ après la capture — il aurait avancé tout seul
derrière l'écran d'énoncé.
**Le papier part par le canal des signalements** — la table existe, l'élève a
le droit d'y écrire, le professeur la lit déjà : aucune migration à jouer, la
leçon de la 003 prise à l'envers. La ligne porte le prénom dans son message,
la marque `dmPapier` et l'identifiant du devoir dans son contexte, et
l'instantané du tirage EXACT montré à l'élève. L'échec d'envoi se DIT et ne se
fait pas passer pour un succès (le refus muet, encore), et un second clic
n'envoie pas une seconde ligne.
**Côté professeur, la ligne se DISTINGUE d'un signalement** — pastille 📄,
« devoir sur papier », bouton « Voir l'énoncé complet » au lieu de « Rejouer
l'écran » — et l'énoncé s'affiche par le MÊME capteur que l'écran de l'élève :
deux rendus auraient fini par diverger. REJEU est posé avant la capture — la
boucle rejoue de vrais écrans d'exercice sous le compte du professeur.
**Les DEUX portes d'un exercice de devoir passent par l'énoncé** — le panneau
de l'accueil et la page du devoir : une seule porte détournée aurait laissé
l'autre lancer l'exercice sans le choix, et personne ne l'aurait vu. « Sur
l'ordinateur » rend exactement le chemin d'avant, reprises de pause comprises ;
le tirage de l'aperçu est jeté, c'est l'exercice qui se joue qui fait foi.
Éprouvé en le cassant dix fois : l'énoncé réduit à sa première question, les
cases restées interactives, le prénom absent, l'échec d'envoi avalé, le double
clic qui double la ligne, la marque dmPapier perdue, la porte qui contourne
l'énoncé, le verrou REJEU oublié, la ligne du professeur non distinguée, le
tirage envoyé qui n'est pas celui montré — chacun rougit en nommant son
défaut.
**Une photo ne porte AUCUN id — et jsdom était structurellement aveugle à ce
défaut.** Les conteneurs clonés dans l'énoncé (s1Res, s1Table, …) gardaient
leurs id, et l'écran d'énoncé vient AVANT les écrans d'exercice dans le
document : après « Le faire sur l'ordinateur », `getElementById` rendait le
CLONE — le rendu de l'exercice écrivait dans l'énoncé caché, l'élève
remplissait un écran que la vérification ne lisait pas, et « Vérifier »
répondait « Complète au moins une case » devant une copie pleine, sans une
couleur nulle part (signalé par Turquet sur une capture du signe du premier
degré, août 2026 — le défaut frappait TOUT exercice lancé depuis un devoir).
jsdom, lui, garde un cache d'id qui rend l'ORIGINAL : aucun banc jsdom ne
pouvait le voir, et c'est un vrai Chromium qui a tranché entre les deux
comportements. `dmEnonceQ` retire donc tous les id de la photo, quitter
l'écran d'énoncé VIDE son hôte (`dmeViderCorps`, par les deux sorties), et le
contrôle tient ces deux bords en STRUCTURE — jamais par `getElementById`, qui
ne mesurerait rien là où il tourne. Éprouvé par sabotage des deux côtés. Un piège d'outillage s'est montré dans le SCRIPT DE VUE, pas dans la
page : `Object.assign({id:'s1'}, ligne)` laissait l'id du double écraser celui
du script, et la vue accusait la page d'un défaut qu'elle n'avait pas.

**Un démarreur qui ne tire pas casse les trois promesses du circuit d'un
coup.** Signalé par Turquet (août 2026) sur le DM n°2, en trois symptômes qui
semblaient trois bugs : après avoir abandonné le 1.1, l'énoncé du 1.2
montrait des questions du PREMIER degré ; en commençant le devoir directement
par le 1.2, le choix papier/ordinateur n'était pas proposé ; et le 1.2 en
devoir posait 5 questions quand le devoir en réglait moins. Une seule cause :
`startS2()` n'ouvre qu'un écran de CHOIX DE NIVEAU — le tirage n'arrive que
dans `startS2Run(1)` — alors que les entonnoirs du devoir passent JUSTE APRÈS
`start()` en supposant le tirage fait. L'énoncé photographiait donc
`test.questions` resté de l'exercice PRÉCÉDENT (le 1.1 abandonné traînait là —
et à la première entrée, rien : le repli « kind inconnu » prenait le chemin
direct, d'où le choix papier absent), et la coupe `nbQ` tombait AVANT le vrai
tirage, qui repartait à 5.
**Dans un devoir, `startS2()` tire directement** : un seul niveau existe (le
2 est « bientôt disponible »), l'écran de choix n'y choisit rien. Hors
devoir, rien ne change.
**Et `dmEnonce` tient la promesse au lieu de la supposer** : il note
`test.questions` AVANT d'appeler `start()`, et si le tableau n'a pas changé
d'identité — un démarreur ajouté demain qui ouvrirait son menu sans tirer —
il retombe sur le chemin direct au lieu de photographier le tirage d'un
autre exercice : un énoncé qui ment est pire qu'un choix qui manque. Trois
sabotages, chacun rougissant avec les mots du signalement (« il photographie
ce qui restait du 1.1 », « le choix papier/ordinateur n'est pas proposé »,
« 5 question(s) au lieu des 2 réglées »), plus le menu qui s'interpose.
**Un piège de SONDE s'y est montré, le second en deux jours** : la trajectoire
rejouée en Chromium accusait la coupe nbQ de ne pas mordre — or les chemins de
devoir RECHARGENT `mesDevoirs` depuis `loadConfig()`, si bien qu'un réglage
semé dans le seul global de la page est écrasé par le double VIDE à la
première recharge. En production la recharge rend la vraie configuration ; la
sonde mesurait un devoir sans réglages, pas la page. Un réglage de devoir se
sème dans le DOUBLE (`__faux.semer('parametres', …)`), jamais dans le seul
global.

**Puis le CHOIX est venu avant l'énoncé : trois cartes, et le papier se
confirme.** Demande de Turquet (septembre 2026) : « en terminale pour les
devoirs maison, afficher plutôt la page quand on choisit un exercice : mode
soutien ; mode entraînement, sur papier ; si l'élève choisit papier alors on
affiche la version papier et on demande la confirmation avant d'envoyer le
document au professeur ». C'est un RENVERSEMENT du paragraphe ci-dessus :
l'énoncé ne vient plus EN PREMIER, il est devenu le contenu d'un des trois
choix — les deux paragraphes qui précèdent racontent le circuit de leur époque.
**CE QUE LE RENVERSEMENT CORRIGE SE MESURE** : l'élève qui venait s'entraîner
traversait la VERSION PAPIER de son exercice — l'énoncé entier, toutes les
questions — pour arriver à la question 1 ; et son exercice était TIRÉ deux
fois, le tirage de l'aperçu étant jeté aussitôt. La page des modes existait
déjà (soutien, entraînement) : elle gagne une troisième carte, et c'est là, et
là seulement, que le papier se décide.
**L'ENVOI NE SE DÉFAIT PAS, ET C'EST TOUTE LA RAISON DE LA CONFIRMATION** : le
professeur reçoit une ligne que l'élève ne peut pas retirer, et un clic parti
tout seul lui laisserait l'énoncé d'un devoir que personne ne rendra. C'est
`confirm()`, la convention du fichier pour un geste irréversible côté élève —
celle d'« Abandonner cet exercice » — et le bord OPPOSÉ compte autant : refusée,
RIEN ne part, rien n'est marqué « envoyé », et le bouton reste utilisable. Le
contrôle tient les deux.
**IL N'Y A QU'UNE PORTE, et la règle des « deux portes » mesurait un écran
DISPARU.** Le panneau des devoirs de l'accueil — `renderDM()` et
`lancerDevoir()` — écrivait dans un `#dmPanel` qui n'existe plus dans la page :
aucun appelant, aucun hôte, deux fonctions MORTES, et le contrôle qui exigeait
que « les deux portes passent par l'énoncé » les exerçait sans rien mesurer de
ce que l'élève voit. Elles sont retirées avec leur feuille de styles, et c'est
le CONTRÔLE qui tient désormais la propriété : l'entonnoir `lancerDevoirExo()`
n'est appelé QUE par les cartes de la page des modes — tout appel ailleurs est
une seconde porte, et il le NOMME. Au passage, la coupe « Questions » du devoir
manquait à ce chemin mort : l'accueil lançait la séance entière quand la page
du devoir la coupait.
**LE CONTRÔLE COMPTE SUR LA SOURCE SANS SES COMMENTAIRES**, et il a fallu le
lui apprendre : un commentaire a le droit de nommer la fonction qu'il
explique — celui de la porte unique le fait — et le premier jet comptait sa
propre doctrine comme une seconde porte.
**UN EXERCICE QUI NE SAIT PAS S'ÉNONCER LE DIT, et rend le choix.** Avant, le
repli enchaînait en SILENCE sur le chemin direct (« sur l'ordinateur ») ;
maintenant qu'il n'y a plus de suite, le silence laisserait l'élève dans l'écran
que le tirage vient d'afficher — un exercice qu'il n'a pas choisi. On revient
donc à la page des modes, avec un message qui dit pourquoi. Le minuteur d'un
exercice à chronomètre est coupé AVANT ce repli, et plus seulement avant
l'énoncé : sans quoi il avancerait tout seul derrière la page des modes.
**RIEN D'AUTRE NE BOUGE, et c'est ce qui rend le geste sûr** : la photo est
toujours `dmEnonceHTML()` — les rendus MÊMES de l'exercice, cases remplacées
par des pointillés, aucun id (le piège du clone) —, la coupe « Questions »
s'applique toujours AVANT la photographie, l'énoncé part toujours par le canal
des signalements avec le prénom et le tirage EXACT, et la vue du professeur —
ligne distinguée, énoncé rejoué, verrou REJEU — n'a pas changé d'une ligne.
**Le contrôle a été RETOURNÉ, pas retiré** : « l'énoncé d'abord, et il part
avec le prénom » est devenu « un choix de la page des modes, et l'envoi se
confirme », et ses neuf sections suivent le parcours entier — la page des modes
et ses trois cartes, l'exercice qui n'est PAS tiré avant le choix, l'énoncé
sans une case, la confirmation refusée puis acceptée, le second clic muet,
l'échec d'envoi DIT, la porte unique, la vue professeur, et le repli.
**Quatorze sabotages, chacun rougissant en nommant son défaut** — l'énoncé
revenu avant le choix, la carte papier retirée, la confirmation retirée puis
demandée-mais-ignorée, le bouton d'envoi laissé hors service après un refus, le
second envoi qui repart, le repli muet, le repli qui affiche un énoncé étranger,
le repli qui laisse l'élève dans l'exercice, la coupe « Questions » perdue, le
panneau mort revenu, une seconde porte, le tirage avant le choix, le tirage
envoyé qui n'est plus celui montré. **Et le premier jet de l'un d'eux ne
sabotait RIEN** : il ajoutait une ligne inerte au lieu de déplacer la
désactivation du bouton AVANT la confirmation — son vert ne disait rien du
contrôle visé, et rejoué sur la vraie ancre il rougit en nommant le bouton.
**Le parcours a été joué dans un vrai Chromium**, et lui seul montre la
confirmation comme l'élève la voit : la page du devoir, les trois cartes, la
version papier (deux questions — la coupe du devoir —, 61 pointillés, aucune
case), le dialogue REFUSÉ qui n'envoie rien, puis accepté.
**ET LE BADGE « BONUS » EST ARRIVÉ SUR LES MÊMES LIGNES, par une autre branche,
le jour même** : son contrôle du banc NAVIGATEUR suivait le trajet d'avant —
`openTestDevoir` menait à l'énoncé, puis `#dmeOrdiBtn` menait aux modes —, et
ce bouton n'existe plus. Il a été RETOURNÉ, pas retiré : les modes d'abord, la
carte « sur papier » ensuite, le retour au devoir puis l'entraînement par sa
carte — les trois écrans portent toujours le mot, et c'est la propriété que le
contrôle tient, jamais le chemin. Le titre de l'énoncé garde donc son badge, et
le passe en `innerHTML` avec `esc()` : le libellé d'un exercice est du texte, le
badge est du balisage, et poser l'un sans échapper l'autre est le piège que ce
fichier nomme ailleurs.

**La même démonstration, mais l'élève ne pose que des nombres.**
{suite-auxiliaire-2} (Terminale, 6.3, demande de Turquet, août 2026) est repris
de la fiche « Exercice suite Vn » : U₀ = 10 000, Uₙ₊₁ = 0,95 Uₙ + 200,
Vₙ = Uₙ − 4000, et les trois questions du papier — la chaîne qui montre que
(Vₙ) est géométrique, V₀, puis Vₙ et Uₙ en fonction de n.
**C'est le MOTEUR DE TIRAGE de {suite-auxiliaire}**, pas un second : `SA.mk`
lie a, b, k et U₀ par b = k(a−1), et `POOL_MODEL` portait DÉJÀ le cas exact de
la fiche. Un second générateur aurait fini par diverger, et deux exercices
voisins se seraient contredits sous les yeux de l'élève. Même moteur, pas même
identité : la note passe par `currentTestId`, le rappel par `RAPPELS.sa2`
(la même leçon), les questions par `QIA_SUGG.sa2`.
**Ce qui change est la SAISIE, et c'est tout le sujet** : là où {suite-auxiliaire}
fait écrire des expressions entières en écriture mathématique, celui-ci n'a que
des cases à un nombre ou un mot — la PAGE écrit les signes et les symboles.
Une case qui attendrait « + 200 » ferait buter sur la saisie du signe un élève
qui sait parfaitement d'où vient le 200, or ce n'est pas la saisie qu'on fait
travailler ici. Et « géométrique » se CHOISIT dans une liste : l'orthographe
n'est pas ce qu'on évalue, et « géometrique » ne doit pas compter faux.
**Le bord qui compte est arithmétique, et il est SILENCIEUX** : toute la fiche
ne tient que si b = k(a−1). Sans cette identité, la factorisation par a ne
retombe pas sur Uₙ + k, la chaîne de l'énoncé est FAUSSE avant que l'élève ne
commence, et la correction lui donne tort sur un calcul juste — le pire défaut
possible. Le contrôle REFAIT ce calcul par sa propre arithmétique sur chaque
tirage, plutôt que de faire confiance à `SA.mk`.
**Puis trois choses ont changé sur capture** (demande de Turquet, août 2026) :
· **la page n'écrit plus le signe devant une case** — c'est l'élève qui le
  pose, et la case porte le nombre SIGNÉ (« +200 », « −3800 »). Un signe
  imprimé faisait la moitié du travail : savoir si l'on ajoute ou si l'on
  retire EST une partie de la démonstration. Les seuls signes encore écrits
  sont ceux de l'ÉNONCÉ — la définition de Vₙ —, jamais ceux d'une réponse, et
  le contrôle lit le texte qui PRÉCÈDE chaque case pour l'exiger.
· **la case est étroite au repos et GRANDIT sous la frappe** : une case large
  laisse croire qu'on attend un long calcul, une case fixe couperait
  « 10 000 ». La largeur se pose en JavaScript — un input ne sait pas se
  dimensionner sur son contenu en CSS — et la CORRECTION la réajuste, sans quoi
  la réponse écrite en bleu serait tronquée ; ce dernier bord a son contrôle,
  parce que le premier ne le voit pas.
· **la raison est DÉCIMALE, strictement entre 0 et 1** — le 0,95 de la fiche.
  Le tirage puise dans le vivier de {suite-auxiliaire} plutôt que d'en écrire
  un second, mais il le FILTRE : une entrée à raison entière ajoutée demain à
  cette liste partagée n'entrerait pas ici en silence. Le contrôle exige la
  propriété sur le tirage plutôt que de faire confiance au vivier.

**Et le sabotage a trouvé un vrai défaut, que le contrôle ne regardait pas** :
une case laissée VIDE recevait `bad` à la vérification. L'entraînement le
masque — la correction en bleu repasse derrière — mais le SOUTIEN s'arrête
avant elle, et la case restait rouge. C'est la leçon des sabotages impossibles,
retombée telle quelle : éprouver ce bord en entraînement ne prouvait rien. La
coloration du soutien a d'ailleurs DEUX chemins — « Vérifier » et la frappe —
et n'en tenir qu'un ne tient rien : le sabotage du second est resté vert
pendant que le premier rougissait. Neuf sabotages en tout, chacun rougissant en
nommant son défaut.

**Puis l'encre des cases, la place du 2000, et la phrase qui porte ses
couleurs** (demande de Turquet, août 2026, sur une capture du 6.3). Trois
demandes, et aucune ne se mesure hors d'un navigateur.
· **La case écrit comme la rangée qui l'entoure** — même police, même taille,
  sans gras : `font:inherit`, là où Fredoka 600 faisait de la réponse une
  écriture d'un autre alphabet. La case d'INDICE reste plus petite (décision
  antérieure), mais garde famille et graisse. Le contrôle lit l'encre RÉSOLUE.
· **« une partie de 2000 est effacée »** : la largeur se pose en `ch`, et la
  page étant en `box-sizing:border-box`, ces ch comprenaient rembourrage et
  bordure — 16 px mangés sur le texte. La case passe en `content-box` : les ch
  redeviennent la place du TEXTE. Mesurer `scrollWidth > clientWidth` n'aurait
  rien dit — un input rend 1 px de plus même VIDE — : le contrôle mesure la
  largeur du texte au CANEVAS, dans la police effective de la case, et exige
  qu'il tienne avec une marge.
· **La phrase de la correction porte les couleurs qu'elle nomme** : « tes
  cases justes sont en bleu » en BLEU, « les fausses sont rouges » en ROUGE,
  « avec la bonne réponse en vert » en VERT, le reste en encre ordinaire. Elle
  vit dans un `.mp-feedback.bad`, où tout était rouge — elle annonçait le bleu
  en rouge. UN SEUL endroit l'écrit (`msgCorrCouleurs`), six écrans
  l'appellent : deux copies auraient fini par dire deux choses.
**Et le premier jet a payé une leçon de CASCADE que rien d'autre n'enseigne** :
il nommait ses fragments `fb-ok` — une classe qui désigne DÉJÀ les morceaux
[OK] du retour de l'IA, peints en VERT par une règle plus spécifique
(`.mp-feedback .fb-ok`) posée exactement là où la phrase vit. « tes cases
justes sont en bleu » s'écrivait donc en vert, sans qu'un caractère du HTML ne
le dise : la cascade trompait, pas le balisage, et AUCUN banc hors navigateur
ne pouvait le voir — le contrôle jsdom lisait les classes et restait vert. Le
banc navigateur, qui mesure l'encre résolue, l'a nommé à la première
exécution. Les classes sont à elle seule désormais (`msg-…`), un contrôle
refuse qu'une seconde règle les reprenne, et le navigateur compare chaque
fragment aux VARIABLES de la convention (`--blue`, `--red`, `--green`) — jamais
à une dominante : « le reste en noir » est #1E2A4A, un noir bleuté qu'aucune
dominante ne sait ranger, et il se compare à l'encre du texte ordinaire. Huit
sabotages, chacun rougissant en nommant son défaut — et la campagne elle-même
s'est prise en défaut : interrompue pendant qu'un banc tournait, elle n'avait
RIEN restauré (`execFileSync` bloque la boucle, le signal attend), et la
mesure suivante partait d'un fichier déjà saboté. Une campagne de sabotage
restaure depuis une COPIE PROPRE hors dépôt, jamais depuis sa mémoire.

**La chaîne du a) du 6.3 pose UNE étape par ligne, les « = » alignés.**
Demande de Turquet (août 2026, sur une capture) : la première rangée empilait
DEUX étapes — « Vₙ₊₁ = U… − k = a·Uₙ + b − k » — quand toutes les suivantes
n'en posaient qu'une. Le remplacement de Uₙ₊₁ descend sur sa propre ligne, et
son « = » tombe dans la colonne des « = » (`.sa2-eq`, largeur fixe alignée à
droite), sous celui de la ligne du dessus — la présentation du cahier, que
l'échelle portait déjà pour les étapes suivantes.
Deux bords, chacun chez le banc qui SAIT le voir : le banc principal tient la
STRUCTURE — six rangées, et aucun « = » hors de la colonne, sans quoi deux
étapes se recollent sans qu'un contrôle de calcul ne bronche — et le banc
navigateur mesure l'ALIGNEMENT au pixel, bord droit de chaque `.sa2-eq` :
une étiquette « Vₙ₊₁ = » qui déborderait de la largeur réservée enverrait son
« = » à droite des autres sans qu'aucune classe ne change — jsdom reste vert,
le navigateur nomme l'écart (55 px au sabotage). Éprouvé par deux sabotages.

**Démontrer une FORMULE par récurrence, dans le squelette guidé du 6.5.**
{recurrence-formule} (Terminale, fiche « Exercice 4 », demande de Turquet,
septembre 2026) suit {recurrence-encadrement} au menu : on donne U₀ et
Uₙ₊₁ = aUₙ + b, et la formule Uₙ = k ± aⁿ à démontrer — initialisation
CALCULÉE (rang, indice, exposant, valeur, « c'est vrai »), hypothèse et but
dont les EXPOSANTS n et n+1 s'écrivent dans des cases levées, puis la chaîne
de la fiche : substituer l'hypothèse dans a × ( … ) + b, développer, réduire.
**Le tirage part de l'ARRIVÉE** (la leçon de {simplifier-barres}) : a et k
sont choisis pour que b = k(1−a) soit ENTIER et u0 = k ± 1 — l'énoncé est
fait des nombres mêmes que la correction recalcule, il ne peut pas la
contredire, et le contrôle refait l'identité par sa propre arithmétique (la
leçon du 6.3). Les DEUX visages (k + aⁿ et k − aⁿ) sortent chacun une fois,
en ordre mélangé, jamais sur le même couple (a, k).
**Les deux lignes de calcul sont LIBRES et se jugent À LA VALEUR** (n = 0..3,
la doctrine de sarExprVal) : toute écriture égale est acceptée, l'égalité
fausse rougit sa case et elle seule. **La DERNIÈRE ligne exige en plus la
forme réduite** k ± a^(n+1), dans les deux ordres — le développement recopié
n'y suffit pas : c'est elle qui fait la démonstration. Une écriture à
l'exposant NON groupé (2 − 0,5^n + 1) est numériquement fausse et rougit à
bon droit. La lecture passe par compileExprExp après n → x, et un « − » de
tête devant une puissance est réécrit « 0− » : JS refuse -a**x nu — le
piège s'est montré à la sonde, avant le premier contrôle.
**Une case vide ne reçoit jamais de couleur** — tenue ici dès le premier
jour, là où le 6.5 vit encore dans la liste des dispenses — et l'entraînement
révèle par la convention COMMUNE : le rouge garde la saisie et la bonne
réponse s'affiche à côté (badge mf-cor), la case vide est remplie en sol.
Le contexte du modèle porte l'énoncé, les saisies et la clause anti-recopie.
Onze sabotages, chacun rougissant en nommant son défaut.

**Puis la touche morte « ^ » d'AZERTY, et le badge en écriture mathématique**
(signalé par Turquet, septembre 2026, sur le 6.6 : « quand je tape ^n il
rajoute le signe intersection », « il donne une correction à côté qui n'est
pas en écriture mathématique »). Sur un clavier AZERTY « ^ » est une touche
MORTE : le navigateur livre du TEXTE composé, jamais une frappe — et MathLive
AVALE le « ^ » (Windows : le n s'écrit sur la ligne, faux sans rien montrer)
ou GARDE le « ˆ » U+02C6 tel quel (Mac : le chapeau que l'élève lit comme un
signe ∩). Sondé sur du vrai MathLive AVANT tout correctif : seul
`beforeinput` (annulable) porte ce texte avant traitement. `chapeauMorte` —
posé sur le document en phase de capture, pour TOUS les champs mathématiques
de la Terminale : les dérivées tapent x^2 avec la même touche — remplace le
geste : le texte avant le chapeau s'insère tel quel, puis un vrai exposant
(insert('^{#?}') — le curseur tombe dedans), puis la suite. ON NE TOUCHE
QU'AU TEXTE TAPÉ NU : les dispatchs internes de MathLive portent
« #@^{#?} » et des accolades — les intercepter doublerait l'exposant de la
frappe directe QWERTY, qui marche déjà (sondé aussi). Et le badge `mf-cor`
du 6.6 écrit l'exposant RENDU (`rfCorHTML` : « ^(n+1) » devient un
`<sup>`) — un exposant n'empile rien, pas de LaTeX. Deux bancs, la
répartition habituelle : jsdom éprouve le gestionnaire NOMMÉ sur un champ
factice — sept bords, les opposés compris (le dispatch interne ignoré, la
case verrouillée figée, le champ non mathématique intouché) — et le
NAVIGATEUR tape les deux touches mortes ET la frappe directe dans la case
rf-s1, puis relit le LaTeX et le juge. Sept sabotages, chacun rougissant en
nommant son défaut — dont l'écouteur DÉBRANCHÉ, la fonction restée juste :
jsdom vert à bon droit, seul le navigateur voit le branchement.

**Rédiger une récurrence, c'est l'écrire EN ENTIER — et deux juges s'en
partagent la lecture.** {recurrence-redaction} (Terminale, 6.7, demande de
Turquet, septembre 2026) : « des énoncés comme le 6.5, mais la rédaction
entière dans une seule case comme celle du 2.2, sans le "f'(x) =" devant ».
Le tirage est celui du {recurrence-encadrement} — `genRCA` et `genRCH`,
appelés TELS QUELS : un second générateur aurait fini par diverger, et deux
exercices voisins se seraient contredits sous les yeux de l'élève. Même
moteur de tirage, pas la même identité (`currentTestId`, `RAPPELS.rr`,
`QIA_SUGG.rr`). Ce qui change est la SAISIE, et c'est tout le sujet : le 6.5
guide la démonstration case par case — il apprend le SQUELETTE ; celui-ci ne
donne rien, pas une amorce, et c'est à l'élève d'écrire les mots. La feuille
est `mlFeuille` en mode « rédaction », le composant du 3.5 : lignes libres,
sans préfixe, barre d'espace active et raccourcis MathLive réduits à une
liste blanche — sans quoi « on » deviendrait un symbole au milieu d'une
phrase.
**DEUX JUGES, ET ILS NE JUGENT PAS LA MÊME CHOSE.** La PAGE juge la
STRUCTURE : elle ne prononce que des faits PROUVABLES — un mot est écrit ou
il ne l'est pas, un nombre est là ou il n'y est pas. C'est la doctrine du
juge des rédactions de la Seconde et de la Première, transposée : un verdict
qu'on peut prouver ne se confie pas à un modèle. Le MODÈLE juge le CALCUL et
la logique, ce qu'aucune expression régulière ne saura lire. Sept critères
côté page — le mot « initialisation », sa vérification CHIFFRÉE (la valeur de
U au rang de départ, encadrée par les deux bornes), le mot qui la conclut
(« vrai », « bon », « vérifiée »…), le mot « hérédité », « on suppose… »,
« on montre que… », et la justification par la CROISSANCE de f — chacun
annoncé à l'écran AVANT que l'élève n'écrive : un critère qu'on mesure sans
l'avoir demandé donnerait tort à une copie honnête.
**Le verdict de la page PRIME dans le sens du REFUS**, et il part au modèle
avec l'énoncé : une structure incomplète ne peut pas valoir le point, quoi
qu'en dise la prose, et le modèle reçoit la liste de ce qui manque avec
l'ordre de ne pas la répéter — l'élève la lit déjà, en rouge, juste
au-dessus. Modèle en panne : on n'enregistre rien et on ne verrouille pas —
le bilan de la page reste vrai, mais la note se joue sur le calcul, que
personne n'a relu.
**Le bilan s'écrit en VERT pour ce qui va, en ROUGE pour ce qui manque**
(demande de Turquet) : ce sont `fb-ok` et `fb-ko`, les classes dont le retour
de l'IA se sert depuis toujours — la convention d'août 2026 (juste en bleu,
correction en vert) porte sur les CASES, et il n'y en a AUCUNE sur cet écran.
La couleur ne porte jamais seule : chaque ligne commence par ✓ ou ✗.
**LA LÉNIENCE EST DÉLIBÉRÉE.** Un faux NÉGATIF donne tort à un élève qui a
raison — le pire défaut du projet ; un faux positif ne coûte rien, le modèle
relit le calcul de toute façon. Les mots se cherchent donc sans accents, sans
espaces et sans ponctuation (« l'hérédité », « heredite » et « HÉRÉDITÉ » sont
le même mot), et l'ordre des moments est libre — une copie qui écrit
l'hérédité avant l'initialisation n'est pas fausse.
**Une seule ASYMÉTRIE dans le juge, et elle a sa raison** : « suppos » et
« heredit » sont des RACINES, « montre » ne peut pas en être une. L'énoncé dit
« Démontrer par récurrence », et un élève qui recopie ce titre en tête de sa
copie aurait satisfait le critère sans avoir énoncé le BUT de l'hérédité. On
exige donc les formes conjuguées (« montrons », « on montre », « montrer
que »…) — c'est le seul mot de la liste qui se trouve aussi dans l'énoncé, et
le contrôle épingle ce piège.
**Mais « hérédité » ANNONCE la partie, il ne la conclut pas.** Signalé par
Turquet (septembre 2026) sur une copie qui posait le mot tout seul à la
DERNIÈRE ligne : la page ne mesurait que sa PRÉSENCE, et laissait donc passer
un mot qui ne présentait plus rien. Il doit venir AVANT « on suppose » et
« on montre » — c'est le titre de la partie, et l'écran le demande en toutes
lettres (« écris le mot d'abord »).
**Le LIBELLÉ distingue les deux cas, et c'est la moitié qui compte** : un ✗
sur « le mot hérédité » devant une copie qui le porte serait un mensonge de
plus — l'élève chercherait un mot qu'il a écrit. Le bilan dit donc « il est
bien là, mais APRÈS ta démonstration : il doit l'annoncer », et le modèle
reçoit la même raison.
**Et quand il n'y a NI hypothèse NI but, on retombe sur la présence seule** :
sans aucun repère, il n'y a pas de position à juger, et accuser un placement
qu'on ne peut pas mesurer serait un faux négatif de plus. C'est la lénience
ci-dessus, appliquée un cran plus bas.

**Le modèle ne juge QUE les mathématiques — et il fallait le lui interdire en
toutes lettres.** Second signalement du même jour, sur une copie que Turquet
a jugée claire : le modèle a refusé en écrivant que « la rédaction est très
difficile à lire : les symboles ≤ et les indices sont mélangés ou mal
placés », puis a réclamé les calculs de f(2) et de f(4). Les deux reproches
sont hors sujet, et le second est faux : appliquer f aux trois membres et
poser les images obtenues EST la démonstration — détailler f(2) n'a jamais
été exigé.
**Ce qu'il lit n'est pas ce que l'élève voit**, et c'est la racine du premier
reproche : la copie lui arrive d'un champ mathématique APLATI en texte
(« U_(n) », « U_(n+1) »), une écriture parfaitement lisible qu'un modèle peut
prendre pour du charabia. La règle le lui dit, et lui INTERDIT de refuser
pour la présentation, pour des symboles « mal placés », ou pour des étapes
intermédiaires manquantes — l'orthographe, l'ordre et le découpage des lignes
y étaient déjà.
**Et tout refus doit NOMMER l'erreur mathématique précise** — quelle ligne,
quelle valeur, ce qu'elle devrait être ; s'il n'en trouve aucune, la réponse
est `correct:true`. Sans ce second bord, l'interdiction se contournerait par
un refus vague, qui est exactement la forme qu'avait le refus signalé.
Les deux clauses ont été FONDUES en une seule : écrites côte à côte, elles
répétaient la liste « ne compte pas faux » et la règle passait à 3446
caractères — 554 de marge sur la troncature. Fondues, elle en fait 3271, et
la marge est mesurée à chaque exécution.

**Puis la clause a échoué en production, et le verdict a changé de camp.** Le
lendemain de sa mise en ligne, le modèle a RE-refusé une copie juste — sept
critères verts à l'écran — en la disant « très difficile à lire : les
symboles ≤ et les indices sont mélangés », en réclamant les calculs de f(2)
et f(4) que la règle venait d'affranchir, et en exigeant une conclusion que
l'exercice ne demande pas (signalé par Turquet, septembre 2026). Une consigne
répétée n'est pas une seconde mesure — c'est la leçon du diagnostic,
transposée : **un verdict qu'on peut prouver ne se confie pas à un modèle**,
et il fallait le tenir dans les DEUX sens, pas seulement celui du refus.
**Le verdict de la page a maintenant TROIS positions**, la doctrine de
libreJuge et de salJuge transposée à la prose : elle REFUSE sur un fait
prouvable (structure incomplète, ou une comparaison numérique fausse) ; elle
ACCEPTE — et son verdict PRIME, part au modèle en tête (« VERDICT DE LA
PAGE, PRIORITAIRE ») et remplace toute prose qui le conteste — quand TOUT ce
que l'exercice annonce est positivement vérifié : les sept critères, les
IMAGES f(m) et f(M) écrites (les nombres que l'élève calcule, ceux que
l'énoncé ne donne pas), et aucune comparaison fausse ; elle S'ABSTIENT sinon,
et le modèle reste alors seul juge, comme avant. En panne, le juge répond
seul là où il a tout vérifié — la leçon de libreJuge — et continue de ne
rien compter là où il s'abstient. La copie de production est ÉPINGLÉE au
contrôle : si elle ne passe pas au juge, c'est le juge qui a tort.
**Le micro-juge des comparaisons ne lit que ce qu'il peut prouver** : sur
chaque ligne, les paires adjacentes d'une chaîne de ≤, <, ≥, > ou = dont les
DEUX côtés sont PUREMENT numériques — « 8 ≤ 7 » est faux et se nomme dans le
bilan, « f(8) = 7 » ne se juge pas, son côté gauche n'étant pas le nombre 8.
Ce garde n'est pas une précaution de papier : un extracteur laxiste lit
« 1 » dans l'INDICE de U₍ₙ₊₁₎ et fabrique « 3 ≤ 1 » sur la copie de
production elle-même — le sabotage l'a montré. Sur un refus que la page sait
prononcer, le modèle n'est pas appelé : la phrase du juge s'affiche, jamais
une prose (la leçon du quotient de la Première).
**Et la CONCLUSION n'est PAS exigée** (décision de Turquet, septembre 2026 :
« on n'oblige pas les élèves à faire une conclusion ») : la règle le dit en
toutes lettres et ne compte plus que TROIS moments, l'écran ne dit plus
« et conclus », et le conseil la présente comme facultative — un critère
exigé d'un côté et pas de l'autre ferait mentir l'écran. La démonstration de
référence, elle, GARDE sa ligne de conclusion : montrer mieux que le minimum
n'est pas l'exiger.
**Deux bords du contrôle ont été RETOURNÉS, pas retirés** : « le refus du
modèle prime sur structure complète » est devenu « il ne prime plus quand la
page a tout vérifié — et sa prose n'atteint plus l'écran », et la panne s'est
scindée en deux selon le verdict. Le banc navigateur exige en plus que le
verdict d'ACCEPTATION tienne sur du VRAI MathLive — la sérialisation réelle
ne doit ni cacher les images ni fabriquer une comparaison fausse, et c'est
exactement la surface par laquelle la production a échoué.
**Puis la barre a MONTÉ : le but porte la propriété au rang n+1, et la
croissance NOMME son intervalle** (demande de Turquet, septembre 2026, sur une
copie aux sept critères verts : « tu dis que c'est bon mais il manque la
propriété au rang n+1 après on montre », « je veux que l'élève précise sur
quel intervalle la fonction est croissante »). Deux faits prouvables de plus,
PLIÉS dans les critères existants « montre » et « croiss » plutôt qu'ajoutés à
côté : la barre de l'acceptation monte d'elle-même, et la copie d'hier aux
sept ✓ redevient un refus qui NOMME ses deux manques.
· La propriété au rang n+1 est une ligne qui porte U(n+1) — hors d'un f(…),
  sans quoi la ligne d'APPLICATION satisferait le critère — avec les DEUX
  bornes. N'IMPORTE quelle ligne : l'annonce après « on montre » comme
  l'élargissement final la portent, l'ordre des moments reste libre — la
  lénience de toujours, et le contrôle tient ce bord-là aussi.
· L'intervalle : après « croissant… », un MARQUEUR (« sur », « entre »,
  « [ ») puis les deux bornes. Le marqueur est ce qui empêche « croissante
  donc f(0) ≤ f(U(n)) ≤ f(6) » de passer — les bornes y suivent le mot sans
  que l'intervalle soit écrit, et c'est précisément la copie signalée.
Les libellés suivent la règle du mot « hérédité » : « on montre » est là mais
la propriété n'est écrite nulle part, « croissante » est là mais SANS son
intervalle — jamais « le mot manque » devant une copie qui le porte. L'écran
et la règle du modèle ANNONCENT les deux critères — un critère qu'on mesure
sans l'avoir demandé donnerait tort à une copie honnête — et la copie de
production épinglée a SUIVI la barre au lieu d'être retirée : sans
l'intervalle elle est désormais refusée sur « croiss » seul, et c'est sa
jumelle à intervalle qui doit passer au juge. Les témoins du banc NAVIGATEUR
l'ont suivie aussi — sa copie « un seul mot manque » écrivait « f est
croissante » nue, et deux lignes rougissaient au lieu d'une : la barre
levée s'est vue jusque sur le vrai MathLive, exactement là où elle devait.
Dix sabotages de plus, chacun rougissant en nommant son défaut.
**LA BARRE D'ESPACE SORT DE L'INDICE, et ce défaut-là n'a été trouvé qu'en
TAPANT.** Le mode « rédaction » pose une VRAIE espace (sans quoi « on suppose »
s'écrirait « onsuppose »), et la convention de MathLive — l'espace SORT d'un
indice — disparaît avec elle : un élève qui tapait « U_n » restait PRISONNIER
de l'indice, et toute la suite de sa phrase tombait dedans. La lecture rendait
« U_(0 =3 et 0 ≤ 3 ≤ 6 donc…) », une phrase illisible pour le modèle, sans la
moindre erreur nulle part. `rrEspace` lit la PROFONDEUR du curseur
(`getElementInfo(...).depth` vaut 0 au sommet, 1 dans un indice) plutôt que de
la deviner, et sort du groupe ; au sommet il laisse faire MathLive. L'écouteur
est posé en CAPTURE sur la feuille, UNE fois : les lignes naissent au fil des
« Entrée », et un écouteur posé ligne par ligne aurait laissé les suivantes
dehors. `mlFeuille` n'est pas touchée — c'est le MÊME TEXTE dans les trois
fichiers, et un contrôle le compare au caractère près. **Et l'écran le DIT** :
l'indication sous la feuille annonce la barre d'espace, comme la consigne du
1.6 annonce le « +1 » que la page pose.
**Les JETONS donnent les symboles, jamais les mots** : ≤, ≥, le U de DÉPART,
Uₙ et Uₙ₊₁ — qu'aucun clavier ne porte — sont sur des boutons ; « hérédité »
et « on suppose » ne le sont pas. Un bouton qui écrirait à la place de l'élève
exactement ce que l'exercice lui demande de savoir viderait l'exercice.
**Et le bouton U-DÉPART SUIT L'ÉNONCÉ** (demande de Turquet, septembre 2026 :
« les touches ≤ et ≥ et le bouton U0 ou U1 en fonction de l'énoncé ») : il dit
U₀ quand la suite démarre au rang 0, U₁ au rang 1 — et les deux rangs sortent
dans chaque séance, donc il CHANGE entre les deux questions. Le bord qui
compte est le bouton FIGÉ, le plus sournois — la leçon du numéro d'exercice de
`show()` : un U₀ écrit sous un énoncé qui commence à U₁ serait recopié tel
quel dans l'initialisation. Le libellé est posé par `renderRR()` et
l'insertion relit `q.n0` AU CLIC (`rrInsertU0`/`rrRangU0`) — la même source,
ils ne peuvent pas diverger — et le contrôle CLIQUE le vrai bouton sur les
DEUX rangs, libellé et insertion, plus ≥ (aucun antislash littéral dans ce
contrôle — le piège documenté des deux analyseurs, `String.fromCharCode(92)`).
Le banc navigateur clique ≥ et U₀ sur du VRAI MathLive et relit la ligne. La
photo du circuit papier les retire avec la rangée, sans rien déclarer. Quatre
sabotages de plus, chacun rougissant en nommant son défaut — le premier a
montré exactement la divergence visée : « le bouton dit U₀ et insère U_1 ».
**Et la lettre du juge a buté sur l'orthographe et sur la SAISIE de
l'indice** (capture de Turquet, septembre 2026) : deux ✗ sur une copie que
l'œil lit juste — le faux négatif, deux fois, par deux portes.
· « on supose » — un seul p — échappait à la racine « suppos » : elle
  s'écrit `sup+os` désormais, parce que l'orthographe n'est pas ce qu'on
  évalue — la règle du modèle le disait déjà, le juge de la page ne le
  faisait pas encore (la leçon de « géometrique », revenue par le juge
  maison). Le bord opposé est tenu : une copie sans aucune hypothèse liste
  toujours le manque.
· La propriété au rang n+1 tapée jeton Uₙ puis « +1 », ou U_n-espace-+1, se
  sérialise « U_(n)+1 » : le + est HORS de l'indice, et l'écran ne le montre
  pas — l'œil lit Uₙ₊₁. La SONDE sur vrai MathLive l'a nommé AVANT tout
  correctif : le témoin du banc, qui tape « U_n+1 » d'un trait, laisse le +1
  DANS l'indice (c'est l'espace suivante qui l'en sort) et passait déjà — le
  geste diffère, la sérialisation aussi, et corriger sur une supposition
  aurait visé à côté. Le motif accepte donc AUSSI la parenthèse d'indice
  FERMÉE puis « +1 », et rien d'autre : la prose « un + 1 » n'a pas cette
  parenthèse, « f(U_(n))+1 » ferme celle de f, et les deux bornes restent
  exigées — chaque bord opposé a son contrôle.
· Et la règle du modèle apprend à LIRE « U_(n)+1 » : sur une abstention, le
  modèle seul juge relirait « Uₙ plus un » dans un calcul juste et le
  refuserait — le refus halluciné de production, par une autre porte.
La capture est épinglée au contrôle (si elle ne passe pas au juge, c'est le
juge qui a tort), et le banc navigateur REFAIT le geste — le jeton Uₙ puis
« +1 », « supose » compris — puis relit la sérialisation qu'il croit mesurer
avant d'exiger le verdict. Quatre sabotages de plus, chacun rougissant en
nommant son défaut.
**Puis l'APLATISSEUR lui-même a été pris à mentir sur la copie** (capture de
Turquet, septembre 2026, v283) : ✗ « la propriété au rang n+1 n'est écrite
nulle part » sur une copie qui la portait — « mais c'est bien la !!! » — et
le modèle exigeait les calculs de f(0) et f(8) devant une ligne qu'il citait
« f(0)(Uₙ)(8) ». La sonde sur vrai MathLive a nommé les deux morsures, dans
`toPlain()` :
· un U STYLÉ — `mathbf`, `mathrm`, `text`, `mathbb`, l'habillage des
  variantes du clavier virtuel — perdait ses accolades et devenait
  `\mathbfU`, un faux nom de commande que le nettoyage aval efface AVEC son
  U : le juge cherchait un « u » qui n'existait plus ;
· « `\le` devant une lettre » mourait de la même mort : la suppression des
  espaces le RECOLLE au `f` suivant (`\lef`), effacé avec son f — les trois
  écritures (`\le`, `\leq`, `\leqslant`) perdaient le ≤ ET le f, et le
  modèle disait vrai sur ce qu'il recevait : c'est l'aplatissement qui
  mentait sur la copie.
Le correctif vit dans `toPlain`, AVANT la suppression des espaces — les
relations converties, l'habillage retiré et son argument gardé — et sert
d'un coup TOUS les juges et TOUS les envois au modèle des trois niveaux :
`toPlain` est le même texte dans les trois fichiers, et il était identique
par discipline seule — il a maintenant son contrôle d'identité
(`readArg`/`struct`/`toPlain`), comme `mlFeuille`. Le banc jsdom éprouve le
toPlain de la SOURCE (le double du harnais pose un mlDexp passe-plat — un
passe-plat mesuré passerait au vert en parlant d'autre chose), la capture
est épinglée en LATEX à travers la vraie chaîne toPlain → rrClair → rrJuge,
les bords opposés sont tenus (`\left(x\right)` reste `(x)`, `\ln` reste
`ln`), et le banc navigateur fait le trajet setValue → lecture réelle.
**Et la règle du modèle a gagné la décision de Turquet** (« on n'est pas
obligé de justifier le calcul de f(0) et f(8) si ils sont bien en dessous ») :
une CHAÎNE d'encadrements — « 0 ≤ 2 ≤ U(n+1) ≤ 8 » — écrit les images et
conclut d'un coup, le modèle n'exige jamais qu'elles soient posées sur une
ligne à part. Trois sabotages de plus, chacun rougissant en nommant son
défaut.
**Puis le clavier À L'ÉCRAN a gagné les quatre inégalités** (demande de
Turquet, septembre 2026 : « les touches inférieur ou égale et supérieur ou
égale… et strictement < et strictement > aussi ») : sur le 6.7, la première
rangée du clavier virtuel — celle que `kbVarsFor()` fait varier selon
l'exercice, Uₓ et n pour les suites — porte aussi ≤, ≥, < et >. La demande
nomme le 6.7, et la table de routage l'y tient : les touches ne fuient pas
sur les autres suites — le bord opposé a son contrôle. Les raccourcis
« <= » et « >= », eux, existaient déjà — la liste blanche du mode rédaction
les garde depuis le premier jour — : le contrôle les ÉPINGLE au lieu de les
supposer, et la fenêtre des raccourcis (☰) les DIT désormais, parce qu'un
raccourci que rien ne dit est une aide que personne ne demande. Deux bancs,
la répartition habituelle : jsdom ÉVALUE `kbVarsFor` depuis la SOURCE (le
clavier vit dans la greffe module, qu'il ne sait pas charger) — la vraie
table de routage, pas une recherche de texte ; le NAVIGATEUR ouvre le
clavier par le vrai bouton ⌨️, CLIQUE les quatre touches RENDUES et relit
la ligne aplatie — la doctrine du bouton mort —, tape « >= » et lit ≥, puis
REFERME le clavier : resté ouvert, il recouvrirait les boutons que la suite
du banc clique. Quatre sabotages de plus, chacun rougissant en nommant son
défaut.
**La reprise après une pause remet la rédaction.** Elle voyage DANS `test` —
que `snapshotTest` photographie en entier — et non dans `_boxes`, qui ne sait
restaurer que des cases à id : la feuille n'en a aucune. Le curseur revient AU
BOUT de ce qui est écrit, `setValue` le remettant au début — sans quoi l'élève
reprenait au milieu de sa propre phrase (vu à la sonde).
**Rien à redéployer chez Supabase** : la fonction Edge porte un correcteur
GÉNÉRIQUE, tout appel `verif` qui n'est pas l'un des deux exercices de dérivée
historiques décrit lui-même son énoncé et sa règle. La règle vit donc dans la
PAGE et part avec elle — la leçon de `MAX_CTX`. Mais la fonction TRONQUE
« attendu » en silence : la borne est LUE dans sa source, jamais recopiée, et
la marge s'affiche à chaque exécution (3867 caractères pour 4000, la règle
de l'acceptation mesurée avec celle du refus).
**Deux bancs, et ils ne voient pas la même chose.** Le PRINCIPAL éprouve le
juge critère par critère dans les deux sens, la lénience, le piège de l'énoncé
recopié, la règle envoyée au modèle, la note et la peinture — sur des chaînes
qu'il écrit lui-même. Le NAVIGATEUR TAPE une démonstration entière dans un
vrai MathLive : la prose française et ses accents ressortent telles quelles,
la barre d'espace sort de l'indice, Entrée ajoute une ligne, le jeton tombe
dans la ligne où l'élève écrit, et le bilan est mesuré à l'encre RÉSOLUE —
jamais à la classe, la leçon de la phrase des couleurs du 6.3. Soixante-huit
sabotages en tout (cinquante-neuf au banc principal, neuf au navigateur), chacun
rougissant en nommant son défaut ; deux sont d'abord restés VERTS et disaient
la même chose — l'un cassait la syntaxe (il ne dit rien du contrôle visé),
l'autre ne pouvait pas ATTEINDRE ce qu'il visait, `rrActiveMF` retombant sur
la dernière case visitée. La leçon du sabotage impossible, retombée telle
quelle.
**Et la photo du circuit papier retire enfin la rangée `.rc-jetons`** : elle
n'était pas dans la liste de `dmEnonceQ`, si bien qu'un « Insérer : » sans
boutons traînait sur la feuille du professeur — le défaut déjà corrigé pour
`.sa-jetons`, resté en place sur le 6.5. Un exercice ajouté à côté d'un
manque le fait voir.

**Et les suites auxiliaires se rédigent à leur tour : quatre questions,
quatre feuilles.** {suite-auxiliaire-redaction} (Terminale, demande de
Turquet, septembre 2026) : les suites du {suite-auxiliaire-2}, mais plus une
seule case — chaque question s'écrit dans une feuille libre du
{recurrence-redaction} : a) la chaîne Vₙ₊₁ = Uₙ₊₁ − k, le remplacement par
la récurrence, l'aboutissement à a × Vₙ ; b) V₀ ; c) la nature de la suite
et Vₙ en fonction de n ; d) la formule Vₙ = Uₙ − k pour retrouver Uₙ.
**Le tirage part de k et en dérive b** — la leçon de {simplifier-barres},
tirer depuis l'arrivée : le coefficient est STRICTEMENT entre 0,5 et 1 (une
baisse de 5 à 45 %, demande de Turquet), b = k·p/100 est alors un multiple
de 100 entre 100 et 10000 (« le plus simple possible »), et b = k(1 − a)
est une identité d'ENTIERS (b·100 = k·p) que le contrôle refait par sa
propre arithmétique — la leçon du 6.3 : sans elle, la chaîne du a) est
fausse avant que l'élève ne commence. U₀ est un multiple de 1000 strictement
au-dessus de k, et les deux questions d'une séance ne portent jamais la
même baisse.
**Le juge de la page juge chaque critère sur la feuille de SA question** —
huit faits prouvables : la définition en n+1 (avec k), le remplacement (a et
b sur une même ligne), l'aboutissement (a et Vₙ), V₀ à la bonne valeur, le
mot de la nature (racine `geometri` — jamais écrit dans un libellé, une
suggestion d'aide ni le conseil : c'est LA réponse du c)), l'expression
V₀ × aⁿ, la formule Uₙ/Vₙ/k, l'expression finale avec le « + k ». La
lénience du 6.7 est reprise porte à porte — « geometrique » sans accent,
l'écriture décimale au point, « V_(n)+1 » le + tapé hors de l'indice,
l'ordre commuté Vₙ × 0,95 — plus une porte NEUVE : « 10 000 » à l'espace
des MILLIERS est UN nombre (`sarNombres` le recolle) — les valeurs montent
à 20000 ici, et l'écriture du cahier avec.
**Le verdict a les trois positions du 6.7**, et l'abstention a un visage
précis : la factorisation directe a(Uₙ − k), parfaitement juste, n'écrit
jamais le nombre intermédiaire k − b (le « −3800 » de la fiche) — la page
accepte quand il y est, s'abstient quand il n'y est pas, et le modèle
décide alors seul. Le refus prime dans les deux sens, la règle nomme les
quatre parties et interdit le refus pour la forme, et une comparaison
fausse se prononce sans appeler le modèle.
**Deux pièges de banc s'y sont montrés, tous deux du BANC** : les deux
premières frappes d'une sonde tombent dans le vide si le champ n'est pas
CLIQUÉ avant de taper — la mesure accusait la page d'avaler « V_ » — et un
ré-épinglage qui ne remet pas `test.score` mesurait le point du passage
PRÉCÉDENT. Une mesure qui accuse la page se mesure elle-même d'abord. Cinq
sabotages, chacun rougissant en nommant son défaut — et les quinze
branchements de l'exercice neuf sont passés au premier coup : les contrôles
universels des deux bancs couvraient le 6.8 sans rien déclarer, exactement
ce pour quoi ils existent.
**Puis la structure a béni une chaîne FAUSSE, et le juge a appris à lire les
égalités** (capture de Turquet, septembre 2026 : « il y a un problème dans la
question a) et tu dis que c'est bon !!! »). La chaîne du a) portait
« 0,65 Uₙ + 2800 − 8000 = 0,65 Uₙ » — le − 5200 avalé — et la page affichait
trois ✓ sur le a) pendant que le modèle écrivait « Ta démonstration en (a)
est correcte » : les critères du a) sont des faits de PRÉSENCE, tous vrais
sur cette copie, et le calcul était confié au modèle — le refus halluciné de
production, dans l'autre sens. Un verdict arithmétique ne se confie pas à un
modèle, une fois de plus : `sarLinExpr` lit chaque morceau d'une chaîne en
expression LINÉAIRE en Uₙ — un couple (coefficient, constante), exact sous
les substitutions de l'énoncé — et `sarFaussesExpr` refuse, en la NOMMANT,
toute égalité entre deux morceaux lisibles qui ne valent pas la même chose ;
le modèle n'est plus appelé, c'est la phrase du juge qui s'affiche.
**Les trois positions valent pour le LECTEUR aussi** : un morceau qu'il ne
sait pas lire EN ENTIER — une puissance, une fraction, de la prose, deux
nombres côte à côte sans opérateur — ne se juge pas, parce que refuser une
écriture qu'on devine recréerait le faux négatif qu'on corrige. Les formes
« n+1 » s'essaient AVANT « n », la parenthèse d'indice fermée puis « +1 »
comprise : lue « Vₙ + 1 », la définition JUSTE du + tapé hors de l'indice
deviendrait fausse — le sabotage l'a montré en toutes lettres. Une ligne qui
COMMENCE par « = » poursuit la chaîne de la ligne du dessus — la
présentation du cahier, celle que le 6.3 enseigne — et une ligne SANS « = »
la rompt : recoller par-dessus la prose jugerait ensemble deux calculs qui
ne se suivent pas. La capture est ÉPINGLÉE au contrôle dans les DEUX styles
d'écriture (la chaîne d'un trait, et une étape par ligne), sa jumelle JUSTE
— le − 5200 écrit — doit passer au juge, et le banc navigateur rejoue la
chaîne fausse sur du VRAI MathLive : l'égalité nommée, le point refusé, le
modèle jamais interrogé. Trois sabotages de plus, chacun rougissant en
nommant son défaut.
**Puis Turquet a levé la barre — « il faut vérifier que chacune des égalités
est vraie » — et le lecteur linéaire est devenu un ÉVALUATEUR en trois
points** (septembre 2026). Le premier lecteur ne lisait que le linéaire en
Uₙ : les puissances du c) et du d) restaient des angles morts — « Uₙ =
6000 × 0,95ⁿ » sans son « + 4000 » ne rougissait pas, faute de savoir lire
l'exposant. `sarExprVal` évalue maintenant chaque morceau NUMÉRIQUEMENT en
n = 1, 2 et 3, sous les valeurs vraies de l'énoncé — Uₙ par la récurrence,
les puissances calculées telles qu'écrites, QUELLE QUE SOIT leur base : une
identité fausse en un point est fausse, et « 0,9ⁿ » à la place de « 0,95ⁿ »
se refuse en se nommant. Égaux aux trois points, l'égalité est VÉRIFIÉE — et
c'est la moitié qui change tout : **une égalité restée INVÉRIFIABLE interdit
l'acceptation forcée**. Le bloc « VERDICT DE LA PAGE, PRIORITAIRE » ne part
plus que si CHAQUE égalité écrite a été évaluée vraie ; un indice chiffré
(U₁), une lettre étrangère, « ^(n)+1 » dont rien ne dit si le +1 est dans
l'exposant (la leçon du 6.7 remontée à l'étage), la fraction élevée à une
puissance « (95)/(100)^(n) » dont l'aplatissement perd la portée — tout cela
retombe en ABSTENTION : le modèle juge seul, on n'accepte que ce qu'on a
vérifié. **Les MOTS coupent la chaîne comme les lignes** : « Vₙ = Uₙ − k
donc Uₙ = Vₙ + k » est deux égalités, chacune vérifiée — et la fausse
derrière un « donc » rougit, quand une phrase (« la raison est = 0,95 »)
n'affirme aucun calcul et ne bloque rien. Les milliers à l'espace, l'euro en
unité et le point final sont tolérés ; « 65% » ne l'est pas — le strip du %
ferait 65 ≠ 0,65, un faux flag sur une écriture juste, donc illisible. Le
banc épingle chaque bord des deux côtés, le navigateur évalue la puissance
sur la sérialisation réelle, et trois sabotages rougissent en nommant leur
défaut — l'acceptation forcée malgré l'invérifiable, les puissances
débranchées (la copie de la fiche même retombe en abstention : un contrôle
qui n'a rien à mesurer le dit), les mots qui ne coupent plus.

**La récurrence en FRACTIONS : la fiche à compléter, et une famille dont
l'identité se prouve en entiers.** {recurrence-fractions} (Terminale, 6.10,
demande de Turquet, septembre 2026 — « un exercice comme le pdf ») est
repris de la fiche « récurrence et fractions », Exemple 2 : U₀ = 3,
Uₙ₊₁ = (3Uₙ − 1)/(Uₙ + 1), et il faut montrer Uₙ = (n+3)/(n+1). a) On
VÉRIFIE la formule sur U₀, U₁, U₂ par les deux voies — la récurrence, puis
la formule explicite : les mêmes trois valeurs, deux fois. b) On DÉMONTRE
par récurrence en complétant la fiche : le rang du départ, l'initialisation
avec sa vérification chiffrée, l'hypothèse, le but, puis la CHAÎNE de la
fiche — six étapes, une par ligne, les « = » alignés dans la colonne du 6.3
(`.sa2-eq`) — avec ses six repères (1) à (6) en légende. L'élève ne tape que
des nombres et des expressions en n ; la page écrit les signes, les barres
de fraction et les coefficients de la récurrence. Trente-sept cases par
question, deux questions par séance. Son préfixe est `rfr` (kind `rfr`,
`#scr-rfr`, `startRFR`…) et non `rf` : {recurrence-formule}, arrivé sur
`main` le même jour par une autre branche, porte déjà `rf` — deux exercices
sous un même préfixe se seraient marché dessus (kind, écran, rappel,
questions), sans qu'aucune erreur ne le dise.
**La famille est CHOISIE pour que la fiche reste vraie, et l'identité se
prouve** : Uₙ = (n+a)/(n+b), avec d = a − b dans {2, 3, 4}, b dans {1, 2, 3}
et a, b premiers entre eux — six couples, dont celui de la fiche. La
récurrence est alors Uₙ₊₁ = ((d+1)Uₙ − 1)/(Uₙ + d − 1), et elle CONSERVE la
formule explicite : ((d+1)(n+a) − (n+b)) / ((n+a) + (d−1)(n+b)) =
(dn + d(a+1)) / (dn + d(b+1)) = (n+a+1)/(n+b+1). Sans cette identité, la
chaîne de l'énoncé serait fausse avant que l'élève ne commence — la leçon
du 6.3 — et le contrôle la REFAIT en produits croisés d'entiers, pour n de 0
à 6, sur chaque tirage, plutôt que de faire confiance au générateur. Le
tirage impose deux d DISTINCTS par séance : à d égal, la chaîne serait la
même à un nombre près. La question ne porte que a et b ; `rfrAttendu`
recalcule tout, et le contrôle refuse tout autre champ. Et l'énoncé AFFICHÉ
est comparé à celui que la correction suppose — un δ faux à l'écran ferait
mentir l'énoncé sans qu'aucune correction ne bronche.
**Deux juges, et une règle des paires.** Un NOMBRE (`rfrNb`) se lit entier,
décimal ou fraction, et se compare EXACTEMENT — « 1,67 » n'est pas 5/3,
« 10/6 » l'est. Une EXPRESSION en n (`rfrLin`) se juge comme une FONCTION :
évaluée en n = 0, 1, 2, elle doit être affine, et « 3(n+3) », « n + 1 + 3 »,
« 3+n » valent leurs jumelles — toute écriture égale est acceptée, comme
partout — quand « n^2 » n'est pas lu et « n·n + 3 » n'est pas affine. Les
caractères sont BORNÉS (chiffres, n, + − × ( )) : rien d'autre ne s'évalue.
L'avant-dernière étape est une PAIRE À FACTEUR LIBRE — (2n+8)/(2n+4) sur la
fiche, mais un élève qui simplifie par 2 un cran plus tôt écrit
(n+4)/(n+2), et il a raison : chaque case se juge sur sa PROMESSE (être
proportionnelle à l'expression attendue), puis les deux doivent partager
leur facteur — « n+4 » sur « 2n+4 » sont chacune défendables et fausses
ensemble, la règle des paires de {somme-fractions}. Une case seule qui
promet est juste, sa jumelle vide reçoit la correction.
**Tout le reste est celui du 6.3, repris et non recopié** : les cases
`sa2-in` qui grandissent sous la frappe (`sa2Ajuster`), les fractions
`sa2Frac` — IMBRIQUÉES ici, une fraction dont le haut et le bas sont des
fractions à cases —, la correction `corrCase` avec la bonne réponse en vert
à côté de la case fausse (et la case vide en `sol`, jamais rouge, en
soutien comme à la vérification), la phrase des couleurs `msgCorrCouleurs`,
la note par `ptsExo` (un point par question, les cases justes comptées
dans la note affichée). Le contexte du modèle nomme la méthode et déclare
les réponses STRICTEMENT SECRÈTES.
**Deux bancs.** Le PRINCIPAL tient le tirage, la fiche épinglée (U₀ = 3 :
U₂ = 5/3, « 3n+9 », « 2n+8 » sur « 2n+4 »…), la structure, la copie vide,
la copie juste, les écritures égales, les refus, la paire, le soutien, la
case qui grandit et les branchements. Le NAVIGATEUR (« 6 vicies bis »,
déclaré par `recurrenceFractions` dans `tests/profils.js`) tient ce que
jsdom ne voit pas : la barre EXTÉRIEURE d'une fraction imbriquée doit
envelopper les barres intérieures — trop courte, elle se lirait comme deux
fractions côte à côte —, aucune rangée de la chaîne ne défile, la case
grandit sous « 3n+9 » tapé pour de vrai, et la copie de la fiche TAPÉE case
par case, puis « Vérifier » cliqué, vaut le point. Vingt sabotages au banc
principal, chacun rougissant en nommant son défaut — et l'un d'eux a d'abord
frappé le VOISIN : la ligne « if(!ok) allOk=false; verd[id]=ok » est la
même, au caractère près, dans `checkSA2` du 6.3, et le remplacement de la
première occurrence a saboté le 6.3 pendant que le contrôle du 6.10 restait
vert à bon droit — un sabotage se pose sur une ancre PROPRE à sa cible, la
leçon d'{antecedents-droite}, retombée telle quelle. Un autre n'a d'abord
rien trouvé à saboter : la légende de la fiche s'écrit avec une espace
INSÉCABLE devant son « ! », et une ancre tapée à l'espace ordinaire ne la
désigne pas. Deux sabotages de plus ne rougissent QU'AU NAVIGATEUR — la
case qui ne grandit plus sous la frappe (« 57 px → 57 px, texte coupé »),
et la barre extérieure raccourcie (« 6 barres trop courtes, de 56 px ») —
jsdom restant vert à bon droit sur l'un comme sur l'autre.
**Puis le « − 1 × (n+b) » s'est DISTRIBUÉ dans la parenthèse** (demande de
Turquet, septembre 2026, sur une capture du 6.10 : « je veux que −1 soit
distribué dans le facteur n+1, il doit donc y avoir un plus entre 5n+25 et
le développement du −1 dans (n+1) »). La rangée F3 écrivait « [5n+25] −
[n+1] » — le signe posé par la page, la parenthèse laissée à l'élève ; elle
écrit « [5n+25] + [−n−1] » : c'est l'élève qui distribue le signe, et c'est
le geste du cahier que la première version lui épargnait. `rfrAttendu`
attend donc « −n−b » dans la seconde case (la lecture affine accepte
« -n-1 » au tiret comme au signe moins), l'ancienne écriture « n+1 » y est
REFUSÉE — le contrôle l'épingle parmi les refus, et exige le « + » rendu
entre les deux cases —, et la consigne, le message et le contexte du modèle
disent le nouveau geste. Le dénominateur, lui, portait déjà son « + ».

**Le sens de variation se conjecture sur un ESCALIER, puis se démontre par
récurrence.** {suite-variation-recurrence} (Terminale, 6.11, demande de
Turquet, septembre 2026, repris de la fiche « Exercice 2 ») ferme le thème
Suites : U₀ = 2, Uₙ₊₁ = 3/(4 − Uₙ), donc Uₙ₊₁ = f (Uₙ) avec f (x) = 3/(4 − x),
et les cinq questions de la fiche dans son ordre, sur un seul écran — a) tracer
les 3 premiers termes en escalier, b) calculer U₁, c) conjecturer le sens de
variation et la limite, d) étudier les variations de f, e) démontrer par
récurrence 1 ≤ Uₙ₊₁ ≤ Uₙ ≤ 2. Les quatre premières préparent la cinquième : le
dessin fait conjecturer, l'étude de f donne la CROISSANCE, et c'est elle qui
conserve les inégalités dans l'hérédité.
**L'ENCADREMENT DIT LE SENS ET LA BORNE D'UN SEUL COUP, et c'est ce qui le
distingue du {recurrence-encadrement}** : celui-là démontre m ≤ Uₙ ≤ M — la
suite est bornée, on ne sait rien de son sens ; celui-ci glisse Uₙ₊₁ dans la
chaîne, et la même récurrence rend la monotonie par-dessus le marché.
**LA FAMILLE, ET POURQUOI ELLE EST HONNÊTE** : f (x) = ℓL/(ℓ+L − x) a pour
points fixes EXACTEMENT ℓ et L, puisque x(ℓ+L−x) = ℓL s'écrit (x−ℓ)(x−L) = 0,
et elle est croissante partout où elle est définie. Le tirage place U₀ d'un
côté ou de l'autre du petit point fixe, et les DEUX VISAGES SORTENT DANS CHAQUE
SÉANCE, en ordre mélangé : ℓ < U₀ < L donne une suite DÉCROISSANTE minorée par
ℓ (le cas de la fiche), 0 ≤ U₀ < ℓ une suite CROISSANTE majorée par ℓ. Sans
eux, la réponse de c) serait toujours « décroissante » et l'élève répondrait
sans lire le dessin. Le contrôle ne suppose pas l'encadrement : il SIMULE la
suite sur trente rangs et le vérifie rang par rang — sans quoi l'énoncé serait
faux avant que l'élève ne commence, le pire défaut du projet (la leçon du 6.3).
**LA DERNIÈRE LIGNE A CINQ TERMES, ET C'EST LA FICHE QUI LE DIT** : on applique
f aux quatre termes de l'hypothèse, puis il faut ÉLARGIR pour retrouver la
propriété — à la décroissante le terme en trop est à DROITE
(1 ≤ Uₙ₊₂ ≤ Uₙ₊₁ ≤ U₁ ≤ U₀), à la croissante tout se retourne et il passe à
GAUCHE. Le terme qui élargit est f (U₀), c'est-à-dire U₁ — celui-là même que
l'élève vient de calculer en b). Le contrôle le REDÉRIVE par sa propre table
(f (ℓ) = ℓ, f (Uₙ) = Uₙ₊₁, f (Uₙ₊₁) = Uₙ₊₂, f (U₀) = U₁) plutôt que de le lire
dans la page.
**LES TERMES DE LA DÉMONSTRATION SE CHOISISSENT, ILS NE SE TAPENT PAS** :
« Un+1 » écrit dans un champ de texte est Uₙ₊₁ pour l'œil et Uₙ + 1 pour la
machine — le piège documenté du 6.7 et du 6.8 —, et une saisie libre y
recalerait une lecture juste. Les onze cases de la chaîne sont donc des listes
aux six mêmes options (ℓ, U₀, U₁, Uₙ, Uₙ₊₁, Uₙ₊₂), dont l'ORDRE est tiré par
question et conservé : à visage égal, le rang de la bonne varie. Les RANGS (les
petites cases d'indice) et les NOMBRES se tapent, eux, et sont lus par `rfrLin`
et `rfrNb`, les lecteurs MÊMES du 6.10 — « n+1 », « 1+n » et « n + 1 » valent
la même chose.
**L'ESCALIER SE CLIQUE, ET LES DEUX RAILS SONT DEUX CIBLES** : la courbe et la
droite y = x sont chacune doublées d'un chemin TRANSPARENT épais
(`pointer-events:stroke`), si bien que c'est le NAVIGATEUR qui dit sur quel
rail l'élève a cliqué — jamais une arithmétique de distance, qui hésiterait là
où les deux courbes se rapprochent. TROIS points, et c'est voulu : (U₀ ; U₁)
sur la courbe, (U₁ ; U₁) sur la droite, (U₁ ; U₂) sur la courbe — on lit alors
U₁ sous la droite et U₂ à hauteur du dernier point. Un quatrième demanderait de
cliquer en (U₂ ; U₂), où les rails sont déjà trop proches pour qu'on les
distingue du doigt : le tirage EXIGE un écart d'au moins 44 unités de dessin
aux abscisses cliquées, et ce garde-là est VIVANT — il écarte la moitié du
vivier brut (11 tirages décroissants et 19 croissants lui survivent).
**Les trois points sont des RÉPONSES, pas un décor** : `pts-case`, la classe de
{simplifier-barres} portée en Terminale — sans elle l'écran aurait annoncé
« 35 cases justes sur 35 » sur une question qui en vaut 38, le défaut de
« good » au lieu de « ok » par une autre porte. La MÉTHODE (l'escalier juste en
vert et les deux lectures d'axe) est dessinée à la VÉRIFICATION, jamais avant,
et rien n'est coloré au fil des clics (la règle de {solutions-graphique}) :
colorer une cible au moment où on la pose dirait laquelle est juste avant même
de vérifier. Le tracé de l'élève est VIOLET — ni bleu ni rouge ni vert, les
encres du verdict : la leçon du liseré de {croiser-denominateurs}.
**Les deux bornes de l'intervalle se jugent sur ce qu'elles PROMETTENT** : f
étant croissante partout où elle est définie, [0 ; 2] et [1 ; 2] sont tous deux
vrais, et refuser le second serait refuser une lecture juste. Le contrôle exige
les deux bords — la borne qui ne contient pas les termes, et celle qui franchit
l'asymptote, sont refusées.
**Deux défauts ne se sont vus que sur la capture** : « y = x » était posé PILE
sur la droite qu'il nomme et se lisait barré (les étiquettes portent un halo
désormais), et la chaîne de la conclusion se coupait en deux — une chaîne
d'inégalités coupée se lit comme deux chaînes.
Vingt-cinq sabotages au banc principal, chacun rougissant en nommant son
défaut — et DEUX sont d'abord restés VERTS en montrant des trous du CONTRÔLE :
il n'exerçait jamais la correction EN DIRECT (la branche « live » n'était pas
touchée, et une case vide colorée sous la frappe passait), et sa clause de
secret se cherchait en `/STRICTEMENT/i`, qui attrapait le « strictement
positive » que l'exercice écrit lui-même — un contrôle qui passe au vert sous
le sabotage parle d'autre chose. Un troisième était IMPOSSIBLE : ouvrir le
garde du côté de U₀ à U₀ = ℓ ne produit aucun tirage, l'écart des rails y
valant zéro. Le banc NAVIGATEUR (« 6 vicies nonies », déclaré par
`suiteVariation` dans `tests/profils.js`) tient ce que jsdom ne peut pas voir —
il n'a ni mise en page ni `getScreenCTM` : les trois points CLIQUÉS pour de
vrai aux coordonnées lues sur le SVG RENDU, le rail que le navigateur
départage, un clic entre les deux rails qui ne pose rien, le repère à une
taille lisible, l'escalier vert d'étendue non nulle et les trois rangées de la
démonstration d'un seul tenant.

**Puis la dérivée du 6.11 s'est présentée COMME AU 2.5.** Demande de Turquet
(septembre 2026) : « dans l'exercice 6.11 en terminale je veux que la question
sur le calcul de la dérivée soit présentée comme dans l'exercice 2.5 ». Le
d) faisait écrire f ′(x) dans UNE case de texte de 260 px — la dérivée d'un
quotient n'y tient pas, et rien n'y aidait à la trouver. Il porte maintenant
la présentation du 2.5, au mot près : le bloc « Facultatif — On pose (u =
numérateur, v = dénominateur) » et ses quatre champs mathématiques, puis la
FEUILLE ligne par ligne, préfixée « f ′(x) = » puis « = ». Les deux listes du
signe et des variations n'ont pas bougé.
**LA DEMANDE PORTE SUR LA PRÉSENTATION, PAS SUR LE JUGE, et c'est tout
l'arbitrage** : le 2.5 confie sa dérivée au modèle parce que c'est son sujet et
qu'il n'a rien d'autre à noter ; ici les trente-sept autres réponses de l'écran
se calculent, et **un verdict qu'on peut PROUVER ne se confie pas à un modèle**
(la doctrine de `libreJuge`, de `salJuge` et du 6.8). La dérivée reste donc lue
par `checkExprFn` — comme une FONCTION, en sept points —, exactement le juge de
la case qu'elle remplace : même sévérité, même tolérance, toute écriture égale
acceptée.
**CHAQUE LIGNE VAUT f ′(x), et c'est la leçon du 6.8** : les préfixes
l'affirment, l'écran le dit, donc une ligne qui ne vaut pas f ′(x) est une
égalité fausse. Elle rougit SEULE — la ligne juste d'à côté garde son bleu — et
la feuille entière porte le verdict de la RÉPONSE. Ne juger que la dernière
ligne aurait laissé passer « f ′(x) = 3/(4 − x) = 3/(4 − x)² », c'est-à-dire
« la structure a béni une chaîne FAUSSE », le signalement du 6.8 retombé tel
quel.
**LA FEUILLE EST UNE RÉPONSE, ET UNE SEULE** (`pts-case`, la classe des trois
points du tracé) : la note ne peut pas dépendre du NOMBRE de lignes écrites,
sans quoi l'élève qui détaille son calcul serait noté sur un autre total.
L'exercice vaut donc toujours 38 réponses — la case unique en a cédé une, la
feuille l'a reprise — et le contrôle le mesure sur une chaîne de trois lignes.
**LES QUATRE CASES FACULTATIVES SE PEIGNENT APRÈS LA MESURE** : elles sont
jugées localement (u = p, v = s − x, u′ = 0, v′ = −1) et ne valent AUCUN point,
comme au 2.5 — mais ici la note se lit à l'écran par `ptsEcran()`, qui compte
les `math-field` colorés : colorées avant `ptsExo()`, elles auraient changé le
total sous les yeux de l'élève, le défaut de « good » au lieu de « ok » par une
porte de plus. Une case facultative vide ne reçoit jamais de couleur.
**EN SOUTIEN, LA FEUILLE SE JUGE À LA SORTIE, JAMAIS À LA FRAPPE** : colorée au
fil des touches, « 3/ » déclarerait fausse une dérivée qu'on n'a pas fini
d'écrire — c'est la convention des champs mathématiques de la Terminale (le
`focusout` du 2.1), et les deux bords ont leur contrôle : sans le premier le
soutien ne corrigerait plus rien sur d), sans le second il mentirait.
**RIEN N'EST TOUCHÉ DANS `mlFeuille`** : le composant est le même texte dans les
trois fichiers et un contrôle le compare au caractère près — on s'en SERT
(mode « calcul », les préfixes en paramètre), on n'y touche pas. Et comme la
feuille n'a AUCUN id, `_boxes` ne sait pas la restaurer : elle voyage dans
`test.svrLignes`, que `snapshotTest` photographie — le motif du 6.7 —, et
`startSVR` l'efface, `test` étant global.
**`renderSVR` entre dans la liste des rendus enveloppés** : l'écran porte des
champs mathématiques désormais, donc il lui faut sa rangée « Clavier
mathématique » — le contrôle universel l'exige, et le banc navigateur la
mesure.
Le banc NAVIGATEUR TAPE la dérivée au clavier dans la vraie feuille MathLive
(jsdom n'a pas la sérialisation réelle que le juge doit lire), mesure la BOÎTE
du bloc facultatif et de la feuille — un CSS perdu les rendrait invisibles sans
qu'une erreur ne se lève — et relit l'encre RENDUE du verdict.
**ET UN DÉFAUT EST NÉ AVEC LA FEUILLE, que seule la SONDE a vu** : `mlFeuille`
donne le focus à sa première ligne — c'est ce que veut le 2.5, dont la feuille
EST l'exercice. Ici l'écran commence par le TRACÉ, et ce focus faisait descendre
la page de **485 px** à l'arrivée : le graphique de a) sortait par le haut, et
l'élève découvrait l'exercice sur la question d). **Sur TABLETTE la sonde a
mesuré pire** — 820 × 1180, écran tactile : 764 px de défilement, le graphique
370 px au-dessus du bord, et le clavier mathématique déployé tout seul avant
que l'élève n'ait rien fait ; avec le correctif, aucun défilement, pas de
clavier, le graphique à l'écran. `renderSVR` rend donc la main
— elle relit la position AVANT et la repose, et relâche le champ — à TROIS
instants, parce que MathLive reprend le focus après coup (le motif que
`mlFeuille` emploie déjà pour son curseur) : à un seul instant, la mesure
montrait le champ encore focalisé. `mlFeuille` n'est pas touchée — c'est
l'appelant qui reprend ce qu'il n'a pas demandé. Le contrôle vit au banc
navigateur, seul à avoir une mise en page et un défilement, et il tient les
trois bords : la page n'a pas défilé, le graphique de a) est à l'écran, et la
feuille ne garde pas le focus.

**Puis les « ≤ » du 6.11 sont tombés les uns SOUS les autres.** Demande de
Turquet (septembre 2026) : dans l'initialisation, que les deux termes de la
ligne « donc » soient alignés avec les « ≤ », leur VALEUR une ligne en
dessous, et les « ≤ » de cette ligne sous ceux de la première ; dans la
démonstration, que les « ≤ » soient alignés « pour que le résultat du dessus
soit juste en dessous à la ligne suivante ». Les chaînes étaient des rangées
flex indépendantes — l'étiquette « Initialisation — vrai pour n = 0 : » et le
« donc : » n'ont pas la même largeur, donc leurs « ≤ » ne pouvaient pas tomber
au même endroit, et la ligne « donc » empilait chaque terme SUR sa valeur
(`svrPile`), ce qui les désalignait encore. **Ce sont désormais deux GRILLES à
colonnes** (`.svr-grille`) : les termes aux colonnes IMPAIRES, les « ≤ » aux
colonnes PAIRES, chaque cellule placée en toutes lettres (rangée / colonne,
relues par les bancs en `data-r` / `data-c`). Un « ≤ » tombe sous un « ≤ »
par construction, pas par vigilance.
**Le visage CROISSANT décale les deux chaînes du dessus d'une colonne de
terme.** La dernière ligne a CINQ termes, et celui qui élargit est à DROITE
quand la suite décroît (1 ≤ Uₙ₊₂ ≤ Uₙ₊₁ ≤ U₁ ≤ U₀), à GAUCHE quand elle croît
(U₀ ≤ U₁ ≤ Uₙ₊₁ ≤ Uₙ₊₂ ≤ ℓ) : pour que f(U₀) reste au-dessus de U₁, les
lignes de l'hypothèse et des f(…) commencent une colonne de terme plus loin
dans ce second cas. Le contrôle exige que le terme qui élargit n'ait RIEN
au-dessus de lui, au bon bout.
**La justification a d'abord changé de place, puis Turquet l'a REMISE** :
« car f (x) est croissante sur [0 ; 2] » vivait au bout de la ligne des f(…).
Les colonnes se calant désormais sur le plus large de chaque colonne, cette
ligne débordait de la carte dès 1400 px — 66 px de trop quand la suite
décroît, 214 quand elle croît, mesurés — et la démonstration DÉFILAIT. Le
premier jet l'avait donc mise en tête du bloc, sur sa propre ligne (« f est
croissante sur [ 0 ; 2 ], et on l'applique à l'encadrement : »). Turquet a
tranché le lendemain : « je préfère que l'on écrive sur la même ligne que
f(…) ≤ f(…) ≤ f(…) ≤ f(…) « car f(x) est … sur [ ; ] » et enlever la 1re
ligne de la démonstration qui dit la même chose ». Elle est donc AU BOUT de
la ligne des f(…), et **c'est sa cellule qui cède, pas la démonstration** :
elle va jusqu'au bout de la grille — une dixième colonne SOUPLE
(`minmax(0,1fr)`) prend le reste de la ligne, et un élément qui enjambe une
piste souple ne compte pas dans la largeur des pistes — et elle SE REPLIE
(`flex-wrap`) quand la place manque, en DEUX morceaux insécables
(« car f(x) est [croissante] » / « sur [ 0 ; 2 ] », `.svr-morceau`) : le
premier repli libre coupait entre une borne et son crochet (« sur [ 0 ; » /
« 2 ] »), vu sur la capture. Mesuré à 1400 px : les deux morceaux font
534 px pour 575 de place quand la suite décroît — une ligne sur l'écran
neuf, deux dès que les badges de correction élargissent les colonnes du
dessous (la cellule perd 45 px) ; deux lignes quand la suite croît, deux à
1280 px dans les deux sens. La démonstration ne défile plus ni à 1400 ni à
1280, et la récurrence non plus — elle défilait de 22 px à 1280 avant que
les « ≤ » ne perdent 2 px de marge de chaque côté. La même colonne souple
porte le « c'est vrai » de l'initialisation.
**Chaque cellule est ENVELOPPÉE (`.svr-cel`), et il le faut** : `corrCase`
insère son badge de correction APRÈS la case, et un badge posé nu dans une
grille deviendrait une cellule de plus, qui décalerait tout ce qui suit. Le
contrôle pose une copie fausse et exige que chaque badge vive DANS sa cellule.
**Puis l'hérédité a suivi** (« fais la même chose pour les lignes de
l'hérédité », Turquet, le même jour) : ses trois lignes — « on suppose »,
« on montre », « donc » — ont trois étiquettes de largeurs différentes, donc
leurs « ≤ » ne pouvaient pas tomber au même endroit. Elles vivent dans la
MÊME grille que l'initialisation (`.svr-grec`, rangées 4 à 6), dont elles
partagent les colonnes : tous les « ≤ » de la récurrence tombent les uns
sous les autres, l'hérédité sous l'initialisation comprise — c'est la
conséquence de la grille unique, pas une demande de plus, et elle coûte à
l'initialisation une colonne d'étiquette élargie à celle de « Hérédité — on
suppose que c'est vrai pour n : ». Le premier jet de ce paragraphe disait
« l'hérédité n'est pas touchée » ; il racontait la première demande.
**Et la dernière rangée s'est fait TRANCHER ses indices, ce qui ne s'est vu que
sur la capture** : `overflow-x:auto` emporte `overflow-y`, donc ce qui
dépasse la boîte EN BAS est coupé — et l'indice d'un terme Uₙ descend sous
sa ligne (`.svr-sub`, `top:.32em`). Tant que la grille finissait par la
rangée des VALEURS, rien ne dépassait ; l'hérédité venue, la dernière rangée
porte des indices, et leurs cases sortaient de 4 px sous le bord. La boîte
garde une réserve de 10 px en bas. **Et le contrôle qui la tient a d'abord
mesuré autre chose** : un `Range` sur le contenu des cellules ne voit PAS
l'indice décalé (1899 contre 1903 pour la case, sondé), et restait à zéro
sur une grille tranchée ; il lit le DÉBORD VERTICAL de la boîte
(`scrollHeight − clientHeight`), le signal direct de ce qui est coupé.
**Deux bancs, la répartition habituelle.** jsdom lit la STRUCTURE : la même
colonne pour un terme de la ligne « donc » et son homologue de la première
ligne, pour chaque terme de l'hérédité et le sien, pour une valeur et son
terme (rangée 3 sous rangée 2), pour chaque
f(…) et son résultat — les deux visages, le croissant pris au vivier —, la
justification sur la ligne des f(…) en deux morceaux, le terme qui élargit
au bon bout, le badge dans sa cellule. Le NAVIGATEUR mesure le RENDU, que jsdom n'a pas : un `display:grid`
perdu laisse toutes les classes en place et met tout à la file — il exige que
les cellules d'une même colonne aient le même CENTRE d'une rangée à l'autre, que
chaque rangée soit d'un seul tenant, que les valeurs soient centrées SOUS
leur terme et une ligne plus bas, que la justification partage sa bande avec
les f(…), que rien ne défile à 1400 px et que la démonstration défile à
900 — une grille ne sait pas se replier. Il rend aussi le visage CROISSANT
à 1400 px : c'est lui qui manque de place au bout de la ligne des f(…), et
un repli débranché s'y voit (« la démonstration défile de 97 px »), pas sur
le décroissant.
**Vingt-quatre sabotages en tout, sur quatre jours de demandes** — treize au
banc jsdom (la ligne « donc » décalée, les valeurs remontées, les valeurs
croisées, le décalage oublié, le décalage au mauvais visage, la justification
remise en tête, les résultats posés nus, l'hérédité décalée, sa ligne « donc »
sortie de la grille, ses « ≤ » glissés, la justification en un seul morceau…)
et onze au navigateur —, **vingt-deux rougissant en nommant leur défaut**.
Les deux verts ont chacun appris quelque chose. Le premier a nommé un TROU
DU CONTRÔLE : « les cellules ne se centrent plus dans leur colonne »
restait vert parce que le banc mesurait la BOÎTE de la cellule — qui
s'étire sur toute sa colonne, donc a le centre de la colonne quoi qu'elle
fasse de son contenu ; il mesure le CONTENU (un `Range`, qui rend la boîte du
glyphe « ≤ » comme celle d'une liste), et le sabotage rejoué rougit (« la
colonne 4 de la récurrence n'est pas alignée : 18 px d'écart »). Le second
disait vrai : « le décalage du visage croissant est oublié » ne pouvait pas
atteindre un banc navigateur qui ne rendait alors que le visage décroissant,
où le décalage vaut zéro de toute façon — c'est jsdom qui tient ce bord et le
nomme (« croissante : le résultat svr-g2 n'est pas SOUS svr-f1 »), et le
navigateur rend le visage croissant depuis, pour la place et l'alignement.
Un troisième sabotage a manqué sa cible sans rester vert : la ligne « donc »
de l'hérédité sortie de la grille fait rougir jsdom (« une case de
l'hérédité n'est pas dans une cellule ») comme le navigateur (« la rangée 6
de la récurrence porte 0 « ≤ » au lieu de 3 : l'hérédité a quitté la
grille »).

**Le théorème de convergence monotone, puis la limite par passage à la
limite : la fiche, case par case.** {suite-tcm-limite} (Terminale, 6.12,
demande de Turquet, septembre 2026, repris de la fiche « suite TCM et
limite ») ferme le thème Suites — ajouté en DERNIER, il ne renumérote rien.
On DONNE une hypothèse — la chaîne m ≤ Uₙ ≤ Uₙ₊₁ ≤ M, ou les bornes et le
signe de Uₙ₊₁ − Uₙ, les deux écritures de la fiche — et ses trois questions :
a) en déduire les variations, b) « la suite est [croissante] et [majorée] par
[4], avec le [théorème de convergence monotone], elle admet une [limite]
finie (ou elle est [convergente]) », c) déterminer ℓ par passage à la limite
dans Uₙ₊₁ = f (Uₙ) : lim Uₙ = [ℓ] et lim Uₙ₊₁ = [ℓ], la relation devient
[ℓ] = 0,5 [ℓ] + 1, puis la résolution ligne par ligne, puis « Donc lim Uₙ = [2] ».
**Deux familles de récurrence, celles de la fiche** : l'AFFINE Uₙ₊₁ = a Uₙ + b
(0 < a < 1, ℓ = b/(1−a) entier — seize couples, calculés en centièmes ENTIERS
parce que 1 − 0,8 vaut 0,19999999999999996 en JavaScript) et la QUADRATIQUE
Uₙ₊₁ = Uₙ² − Uₙ + 1 de la fiche, généralisée en f(x) = x ± (x − r)² : le
passage à la limite donne ℓ² − 2rℓ + r² = 0, soit (ℓ − r)² = 0, une racine
DOUBLE — une seule limite possible.
**LE RISQUE PROPRE EST L'ÉNONCÉ QUI CONTREDIT SA CORRECTION, et la fiche
elle-même le porte** : son exemple 2 donne « 3 ≤ Uₙ ≤ 7 », une suite
DÉCROISSANTE, et trouve ℓ = 1 — or une suite décroissante minorée par 3 a une
limite au moins égale à 3 (la leçon du 2.18 et du 2.19 de la Seconde, la fiche
qui se contredit). Chaque tirage est HONNÊTE : il existe un U₀ pour lequel
l'hypothèse est vraie ET la limite est celle qu'on trouve — pour l'affine,
U₀ = m (croissante) ou M (décroissante) ; pour f(x) = x + (x − r)², f(x) ≤ r
exactement quand r − 1 ≤ x ≤ r, donc m = r − 1 ; pour f(x) = x − (x − r)²,
M = r + 1. Le contrôle ne suppose rien : il SIMULE la suite par sa propre
arithmétique sur chaque tirage — 5000 rangs, parce que la quadratique
converge LENTEMENT (l'écart à r suit 1/n) — et exige la monotonie annoncée,
les bornes, et la limite que la correction attend. L'exemple 2 est épinglé
dans sa version honnête (0 ≤ Uₙ ≤ Uₙ₊₁ ≤ 1, croissante, ℓ = 1).
**Les deux visages de chaque chose sortent dans chaque séance, en ordre
mélangé** : les deux familles, les deux SENS (sans quoi « croissante »
tomberait toujours juste) et les deux FORMES de l'hypothèse.
**Les mots se choisissent, les nombres se tapent** (le motif du 6.3 et du
6.11) : « croissante », « majorée », le nom du théorème, « limite »,
« convergente » et le symbole ℓ sont des listes ; les bornes et les
coefficients sont les cases étroites du 6.3, qui grandissent sous la frappe.
Deux justifications ÉQUIVALENTES sont acceptées en a) — « Uₙ ≤ Uₙ₊₁ » et
« Uₙ₊₁ − Uₙ ≥ 0 » disent la même chose, refuser l'une serait refuser une
lecture juste — et la correction écrit la forme de l'ÉNONCÉ ; « 1/2 » vaut
0,5 dans une case à nombre. Une case vide ne rougit jamais — en direct comme à
la vérification, et le bord opposé du 6.3 est tenu ici dès le premier jour :
« Vérifier » sur une copie vide ne fige aucune case. La bonne réponse n'est
jamais rangée à côté de la question (famille, sens, forme, coefficients,
bornes — le contrôle refuse tout autre champ) : `tclAns()` recalcule tout.
Le banc NAVIGATEUR (« 6 vicies quindecies », déclaré par `suiteTcmLimite`)
tient ce que jsdom ne voit pas : le « lim » qui porte son « n → +∞ » EN
DESSOUS, les rangées qui ne défilent pas, puis la copie de la fiche CHOISIE
dans les vraies listes et TAPÉE dans les vraies cases, « Vérifier » cliqué,
la note relue et l'encre RENDUE de la liste juste, sur les deux visages.
**Onze sabotages, neuf rougissant en nommant leur défaut** — les bornes qui
passent sous la limite (« la limite 3 n'est pas dans [4 ; 4] », le défaut de
la fiche à l'envers), la borne inversée, la case vide rougie par les deux
chemins, la justification équivalente refusée, les familles au même rang, la
limite affine faussée, la fraction refusée, le sens décroissant perdu, le
contexte sans clause. **Les deux verts disaient vrai**, et chacun a appris
quelque chose : élargir le MINORANT d'une suite croissante (m = r − 2) ne rend
pas l'énoncé faux — « minorée par r − 2 » reste vrai, le sabotage était
impossible et c'est celui du majorant qui l'atteint ; et retirer UNE des deux
phrases de secret du contexte laisse l'autre — la propriété est tenue une
phrase plus loin, et retirer les deux rougit. Un contrôle qui passe au vert
sous le sabotage n'est pas forcément un contrôle mort : il faut d'abord
vérifier que le sabotage pouvait l'atteindre.

**La même suite, par la DIFFÉRENCE : l'encadrement opération par opération,
puis le signe de Uₙ₊₁ − Uₙ.** {suite-variation-difference} (Terminale, 6.13,
demande de Turquet, septembre 2026, repris de la fiche « VARIATION
DIFFÉRENCE ») suit {suite-tcm-limite} au menu : la MÊME suite que le 6.11 —
U₀ = 0, Uₙ₊₁ = 3/(4 − Uₙ) — et l'AUTRE méthode. Là-bas la récurrence
démontre d'un coup le sens et la borne en appliquant f croissante ; ici elle
ne démontre que l'ENCADREMENT 0 ≤ Uₙ ≤ 1, en transformant les deux bornes
opération par opération — l'opposé ÉCHANGE, ajouter 4 conserve, l'inverse
ÉCHANGE, multiplier par 3 conserve, la discipline de {suites-encadrement} —,
puis le sens vient du SIGNE de Uₙ₊₁ − Uₙ, mis au même dénominateur
(Uₙ² − 4Uₙ + 3 sur 4 − Uₙ) et lu dans un tableau de signes. Six questions,
celles de la fiche dans son ordre : a) l'escalier, b) la conjecture, c) la
récurrence, d) la fraction, e) le signe, f) les variations.
**TOUT EST REPRIS, RIEN N'EST RECOPIÉ, et le REPÈRE est PARTAGÉ pour de bon** :
le tirage est `svrVivier` — le vivier même du 6.11, points fixes ℓ < L —,
l'arithmétique `svrAns`, et le repère, ses deux rails cliquables, la pose,
le juge des points et la méthode dessinée sont `svrSVG`, `svrPoser`,
`svrPtJuste`, appelés tels quels : `svrHote()` choisit l'hôte par le kind
(`svdGraph` ou `svrGraph`), et `svrClic` accepte les deux kinds — un second
repère aurait fini par diverger, et deux exercices voisins auraient dessiné
la même courbe autrement. Les grilles à colonnes du 6.11 (`.svr-grille`, les
« ≤ » les uns sous les autres — la demande de Turquet, tenue ici dès le
premier jour), les cases qui grandissent (`sa2In`), les fractions
(`sa2Frac`), les lecteurs du 6.10 (`rfrNb` : entier, décimal ou fraction,
comparé EXACTEMENT — « 1/3 » se tape en fraction ; `rfrLin` pour les rangs),
la correction commune (`corrCase`, `msgCorrCouleurs`) : rien de neuf.
**LES DEUX VISAGES sortent dans chaque séance**, en ordre mélangé : U₀ < ℓ
donne une suite CROISSANTE (le cas de la fiche, différence positive), ℓ < U₀
une suite DÉCROISSANTE (ℓ ≤ Uₙ ≤ U₀, différence négative) — sans eux l'élève
apprendrait que le signe est toujours « + ». L'encadrement est
[min(U₀, ℓ) ; max(U₀, ℓ)], et la DERNIÈRE ligne ÉLARGIT : quand la suite
croît, 0 ≤ 3/4 ≤ Uₙ₊₁ ≤ 1 (la fiche — le terme qui élargit est f(m) = U₁, à
GAUCHE) ; quand elle décroît, m ≤ Uₙ₊₁ ≤ U₁ ≤ M (à DROITE). Le contrôle
REFAIT la chaîne par sa propre arithmétique, vérifie que f envoie [m ; M]
dans lui-même (sans quoi l'hérédité mentirait), que (x − ℓ)(x − L)/(s − x) a
le signe annoncé sur tout l'intervalle, que ℓ et L sont bien les racines du
trinôme, et SIMULE la suite — la leçon du 6.11.
**LES FRACTIONS DE d) SE LISENT COMME DES FONCTIONS DE Uₙ** : les cases sont
des champs mathématiques, « Uₙ » tapé U_n, Un ou U devient la variable de
`checkExprFn` (le juge du 2.1), et toute écriture ÉGALE est acceptée —
3 − Uₙ(4 − Uₙ) comme 3 − 4Uₙ + Uₙ². La DERNIÈRE ligne exige en plus la forme
DÉVELOPPÉE (aucune parenthèse — l'exposant « ^(2) » que l'aplatissement
écrit n'en est pas une) : c'est elle que l'énoncé fait démontrer, et
recopier la ligne d'avant n'y suffit pas, la leçon de {recurrence-formule}.
Le clavier à l'écran offre Uₓ et n (`kbVarsFor`), et le contrôle l'ÉVALUE
depuis la source — le clavier vit dans la greffe module, que jsdom ne
charge pas, et une recherche dans l'`outerHTML` restait vide : le premier
jet du contrôle a rougi sur une page juste.
**LES PAIRES, ET LE SIGNE QUI SUIT SON ÉTIQUETTE** : les racines de e) et les
deux étiquettes du tableau (le numérateur, le dénominateur, parmi cinq
propositions à l'ordre tiré par question) suivent la règle des paires
d'{antecedent-nombre} — l'ordre est libre, le doublon défendable une fois et
faux la seconde —, et la case restée vide reçoit la valeur RESTANTE, jamais
la première. Le signe d'une ligne se juge sur l'étiquette CHOISIE dans cette
ligne, et sur sa promesse (être l'un des deux signes attendus) si
l'étiquette est fausse : c'est le visage décroissant qui rend ce bord
mesurable — le numérateur y est négatif et le dénominateur positif —, sur
la fiche les deux signes sont « + » et un juge qui ignorerait l'étiquette
resterait vert. Une case vide ne rougit jamais, chaque case se juge seule
(un refus ne rougit QUE sa case, le contrôle le compte), les trois points
du tracé sont des réponses (`pts-case` : 48 réponses par question), rien
n'est révélé en soutien, la méthode se dessine à la vérification, et les
champs mathématiques se jugent à la SORTIE, jamais à la frappe.
Le banc NAVIGATEUR (« 6 tricies quinquies », déclaré par
`suiteVariationDifference` dans `tests/profils.js`) tient ce que jsdom ne
voit pas : les trois clics qui posent dans le repère de CET écran et non
dans celui du 6.11, le trinôme TAPÉ pour de vrai (U, indice, exposant — la
sérialisation réelle relue comme une fonction ET comme une forme
développée), les deux grilles RENDUES au même centre par colonne sans rien
qui défile, le tableau de signes avec une boîte, et la copie juste cliquée
qui vaut le point, sur les deux visages.
**Vingt et un sabotages au banc jsdom, chacun rougissant en nommant son
défaut** — l'opposé qui ne renverse plus les bornes, f(M) à la place de f(m),
les deux visages perdus, la réponse rangée dans la question, la forme non
développée acceptée, le signe qui ne suit plus son étiquette, le doublon
compté deux fois, la case vide rougie (à la vérification, puis sous la
frappe), la méthode révélée en soutien, le champ mathématique jugé à la
frappe, le clic refusé sur le kind svd, le repère dessiné dans l'hôte du
6.11, Uₙ₊₁ hors de la colonne des termes, la valeur de U₀ posée à côté, le
badge en LaTeX nu, la racine restante confondue avec la première, le clavier
sans Uₓ, la clause anti-recopie retirée, les étiquettes à ordre figé, et le
`pts-case` retiré des points du tracé — ce dernier rougit AUSSI chez le 6.11
(« 35/35 au lieu de 38/38 »), la preuve que le repère est bien partagé et non
recopié. Les deux bancs ont couvert l'exercice au premier passage sans rien
déclarer — les contrôles universels, exactement ce pour quoi ils existent —
et le premier échec du banc était celui du contrôle, pas de la page.

**Le vocabulaire des suites se COCHE sur un dessin — et une borne plus large
est une phrase vraie.** {suite-vocabulaire} (Terminale, 6.14, demande de
Turquet, septembre 2026 : « créer un exercice en terminale comme le pdf sur
les suites », la fiche « Vocabulaire sur les suites ») ferme le thème
Suites : les termes U₀ à U₁₂ d'une suite en croix sur un quadrillage, et
l'élève coche ce qu'elle SEMBLE être, ligne par ligne comme sur le papier —
croissante / décroissante / non monotone ; majorée par … / minorée par … /
bornée ; a comme limite … / n'a pas de limite ; convergente / divergente.
Les neuf exemples de la fiche sont neuf VISAGES tirés au hasard (décroissante
ou croissante vers ℓ, vers +∞ ou −∞, non monotone vers l'infini, alternée
sans limite, oscillation amortie, oscillation qui s'amplifie), et une séance
en pose quatre : une croissante, une décroissante, deux non monotones
distinctes, les deux natures toujours présentes, en ordre mélangé — sans quoi
l'élève apprendrait que la réponse est toujours du même genre.
**LE JUGE EST LARGE SUR LA VALEUR ET EXACT SUR LA PROPRIÉTÉ** : « majorée
par 10 » devant une suite qui plafonne à 4 est VRAIE, et la refuser serait le
pire défaut du projet — toute borne au-delà du plus grand terme de la suite
ENTIÈRE (jamais des treize dessinés) est acceptée, la correction écrit la
plus serrée. Les extremums tombent sur des graduations par CONSTRUCTION
(U₀ et ℓ entiers, et pour l'oscillation amortie un couple (A, q) dont le
produit est entier), et la suite monotone convergente, dont les termes
n'atteignent jamais leur borne côté limite, reçoit la droite y = ℓ dessinée —
les exemples 1 et 2 de la fiche font exactement cela : sans elle, « majorée
par 4 » devant une suite qui tend vers 5 serait défendable sur treize termes
et fausse sur la suite. **Une limite infinie EST une limite** (« a comme
limite +∞ »), et la suite est alors divergente : c'est le rappel de la fiche,
et « inf » se lit par `lgLimOK`, le lecteur du 3.2.
**LES CASES COCHÉES VIVENT DANS LA QUESTION (`q.rep`)**, pas dans un état de
l'écran : `captureBoxes` ne photographie que la VALEUR d'un champ, et une case
à cocher n'en a pas — la pause aurait tout perdu. Trois groupes sont EXCLUSIFS
(le sens, la limite, la nature) et valent chacun UNE réponse ; la ligne des
bornes est un vrai choix multiple, trois réponses oui / non ; les valeurs
n'ouvrent qu'une fois leur case cochée. Une case NON cochée qui aurait dû
l'être est une case laissée VIDE : cochée en vert par la correction, jamais
rougie. Aucune correction au fil des clics, même en soutien — à trois options
par ligne il suffirait d'essayer, la règle du QCM du 2.8 — et le soutien ne
révèle rien. Les cases sont des `span` à rôle de case à cocher, pas des
boutons : la photo du circuit papier retire les boutons, et la fiche du
professeur doit garder ses cases. **Deux bancs, la répartition habituelle** :
jsdom refait le tirage par une SECONDE arithmétique sur les treize termes
(le sens sur les différences, une borne annoncée atteinte ou égale à la
limite, une suite « non majorée » qui s'échappe vraiment, une limite finie
approchée, la droite y = ℓ là et seulement là) et joue les gestes sur trois
questions ÉPINGLÉES ; le NAVIGATEUR (« 6 tricies quater », déclaré par
`suiteVocabulaire` dans `tests/profils.js`) CLIQUE les cases, lit l'encre
RÉSOLUE des verdicts, mesure la hauteur d'une RANGÉE rendue — un dessin de
cinq rangées est court sans être illisible, et le premier jet mesurait la
hauteur brute — et la fiche sous le dessin sur une tablette en portrait.
Treize sabotages, chacun rougissant en nommant son défaut ; l'un d'eux est
d'abord resté VERT en montrant un trou du contrôle — la copie de soutien ne
laissait aucune case oubliée, donc « rien n'est révélé » n'avait rien à
mesurer. Le premier jet du contrôle a rougi sur du code JUSTE (7 réponses
attendues là où l'écran en compte 8) : un essai faux se reconnaît à ce qu'il
rougit sur une page juste. L'exercice est placé en FIN de thème, en 6.14 :
ajouté en tête — où le vocabulaire aurait sa place — il aurait renuméroté les
onze autres, et les numéros écrits du banc avec.

**La fiche entière sur une suite dont f est un QUOTIENT : la synthèse.**
{suite-synthese-variations} (Terminale, 6.15, demande de Turquet, septembre
2026, repris de la fiche « FICHE 3 — Synthèse sur variations de suites ») ferme
le thème Suites — ajouté en DERNIER, il ne renumérote rien. C'est son
Exercice 2, en entier et dans son ordre, sur un seul écran : a) les premiers
termes à la calculatrice au centième près, b) le tracé en escalier, c) la
conjecture du sens, d) l'étude des variations de f, e) la récurrence qui
démontre l'encadrement, f) Uₙ₊₁ − Uₙ mis sur un dénominateur commun et le
signe de ce quotient, g) les variations de la suite, h) le théorème de
convergence monotone, i) la limite par PRODUIT EN CROIX. Chaque partie a son
exercice au menu — le tracé et la récurrence au {suite-variation-recurrence},
le théorème et le passage à la limite au {suite-tcm-limite} — ; celui-ci les
rassemble sur une seule suite, et c'est ce que « synthèse » veut dire.
**LA FAMILLE, ET POURQUOI ELLE EST HONNÊTE** : on prend l'homographique
f (x) = (a x − p)/(x + c) avec a = ℓ₁ + ℓ₂ + c et p = ℓ₁ℓ₂, si bien que les
points fixes sont EXACTEMENT ℓ₁ et ℓ₂ — x(x + c) = a x − p s'écrit
(x − ℓ₁)(x − ℓ₂) = 0. La fiche est le cas c = 0, ℓ₁ = 0,5, ℓ₂ = 2, U₀ = 1, et
le contrôle l'ÉPINGLE telle quelle. Trois conséquences, et ce sont les trois
questions que les exercices voisins n'ont pas : f ′(x) = (ac + p)/(x + c)² est
strictement positive, donc f croissante (d)) ; Uₙ₊₁ − Uₙ vaut
(− Uₙ² + s Uₙ − p)/(Uₙ + c), dont le numérateur est − (Uₙ − ℓ₁)(Uₙ − ℓ₂), donc
le signe se lit sur la position de Uₙ par rapport aux deux points fixes (f)) ;
et le passage à la limite redonne LE MÊME trinôme, donc DEUX solutions — c'est
l'encadrement démontré en e) qui dit laquelle garder (i)).
**LE RISQUE PROPRE EST L'ÉNONCÉ QUI CONTREDIT SA CORRECTION**, et il court sur
toute la fiche : si la suite tirée ne se comporte pas comme on l'annonce,
l'élève est compté faux sur une lecture juste. Le contrôle ne le suppose pas —
il refait l'identité des points fixes en arithmétique exacte, SIMULE la suite
sur quatre cents rangs et vérifie l'encadrement ET la monotonie rang par rang,
recompte le signe du trinôme sur l'intervalle, et redérive la mise au même
dénominateur (la leçon du 6.3, b = k(a−1)). Sonde : 0 défaut sur les 65
tirages du vivier.
**LES DEUX VISAGES SORTENT DANS CHAQUE SÉANCE**, en ordre mélangé : ℓ₁ < U₀ < ℓ₂
donne une suite CROISSANTE encadrée par U₀ ≤ Uₙ ≤ ℓ₂, U₀ > ℓ₂ une suite
DÉCROISSANTE encadrée par ℓ₂ ≤ Uₙ ≤ U₀. Sans eux, la réponse de c) serait
toujours « croissante » et l'élève répondrait sans lire le dessin. La limite
est ℓ₂ dans les deux cas, et c'est ℓ₁ qu'il faut écarter : la borne INFÉRIEURE
de l'encadrement est strictement au-dessus de lui, et le contrôle l'exige sur
chaque tirage — sans cette propriété, rien ne départagerait les deux solutions.
**LE DÉCALAGE c EST CE QUI OUVRE LE SECOND VISAGE, et c'est un arbitrage qui se
nomme** : à c = 0 — la forme exacte de la fiche — une suite décroissante
converge à la vitesse ℓ₁/ℓ₂, trop vite pour que le TROISIÈME point de
l'escalier se distingue de la droite ; la sonde n'a trouvé AUCUN tirage
décroissant à c = 0, et le meilleur écart de rails y valait 41 px pour 44
exigés. Le facteur de convergence vaut (a − ℓ₂)/(a − ℓ₁), donc il se rapproche
de 1 quand a grandit : c > 0 donne des marches visibles. Vivier mesuré : 13
tirages croissants (dont la fiche) et 52 décroissants, écart minimal des rails
45 px, fenêtre au plus 5,5 unités.
**TOUT EST REPRIS, ET DEUX MOTEURS ONT ÉTÉ EXTRAITS POUR CELA.** Le repère et
l'escalier du 6.11 deviennent `escSVG` / `escPtJuste` / `escAbscisse`, la
feuille de la dérivée du 2.5 devient `derLignes` / `derVerdict` / `derPeindre`
/ `derReveler` / `derVerrouiller` / `derPoseVerdicts` : deux copies auraient
fini par diverger, et la même construction se serait dessinée autrement d'un
écran à l'autre sous les yeux de l'élève. Le contrôle tient le bord du
refactor — les mêmes fonctions doivent encore servir le 6.11, sans quoi un
refactor qui cesse de servir son premier appelant est une copie qui recommence.
Le reste vient des voisins sans une ligne neuve : les listes du théorème et de
la limite sont celles du 6.12 (TCL_OPT_BORNE, TCL_OPT_THM, TCL_OPT_LIM,
TCL_OPT_L), les cases qui grandissent sous la frappe et les fractions empilées
du 6.3, les lecteurs de nombres et de rangs du 6.10, la correction la
convention commune (corrCase, msgCorrCouleurs).
**CE QUE L'ÉLÈVE TAPE, ET CE QU'IL CHOISIT** : les NOMBRES se tapent, les
TERMES se choisissent — « Un+1 » tapé dans un champ de texte est Uₙ₊₁ pour
l'œil et Uₙ + 1 pour la machine, le piège documenté du 6.7 et du 6.8, et une
saisie libre y recalerait une lecture juste. Les DEUX RACINES suivent la règle
des paires de {somme-fractions} : l'ordre est libre — rien ne dit laquelle est
ℓ₁ — et la même racine posée deux fois est défendable une fois, fausse la
seconde. **U₀ n'est PAS redemandé en a)** : il est écrit dans l'énoncé, et une
case pour le recopier n'apprendrait rien (la leçon des retenues de la
soustraction) — la fiche, elle, le demande. Une question vaut 47 cases, plus
les trois points du tracé et la feuille de la dérivée : 51 réponses, et la note
affichée les compte toutes.
**LE TRACÉ S'ARRÊTE À TROIS POINTS, comme au 6.11 et pour la même raison** : un
quatrième demanderait de cliquer là où les deux rails sont déjà trop proches
pour qu'on les distingue du doigt. La fiche en demande quatre ; le dire vaut
mieux que de le taire.
**L'EXERCICE 1 DE LA FICHE RESTE DEHORS, et c'est nommé** : f (x) = x/(x+1) a
un point fixe DOUBLE (0), donc pas de « deux solutions » à départager — c'est
la question même de l'Exercice 2, et c'est elle qui fait cet exercice.
Deux bancs, la répartition habituelle : jsdom tient le tirage honnête, la fiche
épinglée, la règle des paires, le centième de la calculatrice, la case qui se
juge SEULE, la case vide qui ne rougit jamais, le soutien qui ne révèle rien et
le PARTAGE des deux moteurs ; le NAVIGATEUR (« 6 tricies septies », déclaré
par `suiteSynthese` dans `tests/profils.js`) CLIQUE l'escalier pour de vrai —
c'est lui qui départage les deux rails —, TAPE la dérivée dans un vrai
MathLive, mesure les « ≤ » de la récurrence alignés en colonnes (un
`display:grid` perdu laisse toutes les classes en place et met tout à la file),
exige que les chaînes de f) et de i) tiennent sur UNE ligne — coupée en deux,
une chaîne d'égalités se lit comme deux calculs — et relit l'encre RENDUE des
verdicts.
**Dix-neuf sabotages au banc jsdom, tous rougissant en nommant leur défaut** —
mais DEUX ont dû être rejoués, et chacun a appris quelque chose. « Chaque case
ne se juge plus seule » est d'abord resté VERT en montrant un TROU DU
CONTRÔLE : en ENTRAÎNEMENT, `corrCase` repose la couleur de CHAQUE case depuis
son verdict, si bien qu'une peinture qui aurait débordé sur les voisines est
EFFACÉE avant qu'on la mesure — le bord se mesure en SOUTIEN, où rien ne
repeint derrière, et rejoué là il rougit en listant les quarante-six cases
teintes à tort. Et « le quatrième point se pose » n'a pas pu se poser : ses
deux lignes sont les mêmes, au caractère près, dans `svrPoser` — un sabotage se
pose sur une ancre PROPRE à sa cible (la leçon d'{antecedents-droite}), et
rejoué sur une ancre à trois lignes il rougit.
**ET LE BANC NAVIGATEUR A TROUVÉ DEUX DÉFAUTS RÉELS À SA PREMIÈRE
EXÉCUTION**, qu'aucun contrôle jsdom ne pouvait voir :
· **la courbe n'était pas coupée au cadre, et son PÔLE rendait le chemin
  invalide.** Une homographique a un pôle — f (x) = (a x − p)/x plonge vers
  −∞ en 0, c'est-à-dire au bord GAUCHE de la fenêtre —, et `Y(−∞)` écrit
  « Infinity » dans le chemin. Le navigateur cesse alors de le dessiner ET de
  le rendre cliquable À PARTIR DE LÀ : le premier point de l'escalier ne se
  posait plus (« trois clics posent 1 point »), et le dessin était faux. On
  saute les points hors du cadre en rouvrant un sous-chemin de l'autre côté ;
  le 6.11, dont la courbe reste dans la fenêtre, ne change pas d'un pixel.
  jsdom n'a pas de test de survol : il restait vert à bon droit.
· **la grille de e) DÉFILAIT de 46 px à 1400 px**, et une démonstration qui
  défile se lit en deux morceaux. Les étiquettes prennent maintenant les mots
  de la FICHE — « on suppose pour n », « on montre pour n + 1 » —, plus courts
  de cent dix pixels : le correctif rend l'écran plus fidèle au papier, pas
  seulement plus étroit.
**Et un troisième défaut était celui du CONTRÔLE, pas de la page** : « un clic
posé entre les deux rails » reprenait le repère du 6.11 — 90 px au-dessus de
la droite —, or la courbe passe ICI presque exactement là quand la suite
croît, et le banc accusait la page d'un défaut qui était le sien. Le point
« loin » se CHERCHE désormais : on balaie le cadre, on retient le plus éloigné
des deux rails RENDUS, et on exige que la distance soit franche — un contrôle
qui n'a rien à mesurer le dit.
**Trois sabotages au banc NAVIGATEUR, chacun rougissant en nommant son
défaut** — la grille de e) rendue en `display:block` (« la colonne 2 de la
récurrence n'est pas alignée : 2645 px d'écart »), une chaîne de i) forcée à se
replier (« 78 px pour un contenu de 36 »), et la coupe au cadre retirée, qui
ramène le pôle et son chemin invalide (« trois clics posent 1 point »). jsdom
reste vert à bon droit sur les trois : il n'a ni mise en page, ni test de
survol, ni police.
**ET LA FUSION DE `main` L'A RENUMÉROTÉ, avec une collision TRIPLE au banc.**
Deux exercices sont arrivés sur `main` pendant que celui-ci se faisait —
{suite-variation-difference} en 6.13 et la Seconde {python-deux-lignes} — et
le premier s'insère AVANT {suite-vocabulaire} : le vocabulaire passe en 6.14
et la synthèse en 6.15. Les notes déjà obtenues ne bougent pas (elles portent
l'IDENTIFIANT), les renvois écrits `{identifiant}` suivent d'eux-mêmes ; les
numéros ÉCRITS — les trois assertions du banc, les noms de contrôle, les
commentaires de la page — ont été repris à la main le jour même.
**Et les TROIS sections du banc navigateur portaient « 6 tricies
quinquies »** : la mienne, et les DEUX de `main`, qui se l'étaient prise l'une
à l'autre à quelques heures d'écart — `main` était donc déjà rouge sur le
contrôle des numéros de section, qui existe précisément pour cela. La règle
tranche sans rien peser : le numéro revient au premier arrivé
({suite-variation-difference}), la Seconde prend « sexies » et la synthèse,
dernière arrivée, « septies ».

**LE THÈME DES SUITES EST DÉCOUPÉ EN QUATRE PARTIES.** Demande de Turquet
(septembre 2026) : « en terminale, dans le thème des suites, créer les
sous-thèmes suite auxiliaire, démonstration par récurrence, étude de variation
d'une suite, déterminer la limite d'une suite ». Le thème avait quinze
exercices sur une seule page à faire défiler.
**RIEN N'EST INVENTÉ : c'est l'étage des parties de la Seconde et de la
Première, porté** (voir « Puis l'étage des PARTIES est venu » dans
`11-aides-et-interface.md`) — `sous` dans `THEMES`, la liste plate `t.ids`
reconstruite juste après, la numérotation à trois niveaux (6.2.1),
`scr-soustheme`, `openSousTheme()`, `retourTheme()`, `sousThemeOfTest()`,
`carteExo()`, et `retourChoix()` qui rouvre la partie. Le reste du fichier ne
connaît que `t.ids` et n'a pas bougé.
**Le rangement suit le SUJET**, dans l'ordre qu'avaient les exercices :
6.1 Suite auxiliaire — {suite-explicite}, {suite-auxiliaire},
{suite-auxiliaire-2}, {suite-auxiliaire-redaction} ; 6.2 Démonstration par
récurrence — {suites-encadrement} (il prépare l'hérédité), les cinq
« Récurrence — … » ; 6.3 Étude de variation — {suite-variation-recurrence},
{suite-variation-difference}, {suite-vocabulaire}, {suite-synthese-variations} ;
6.4 Déterminer la limite — {suite-tcm-limite}. Deux cas limites tranchés :
{suite-explicite} (type, raison, formule explicite) n'a pas de partie à son nom
et ouvre celle des suites auxiliaires, dont elle est le prérequis ;
{suite-vocabulaire} coche monotonie, bornes ET limite, et va aux variations,
qui en sont la première moitié.
**Ce que le découpage coûte se nomme** : trois contrôles ÉPINGLAIENT un numéro
(6.12, 6.14, 6.15) pour tenir « un exercice inséré avant renumérote ses
voisins ». Ils sont retournés vers les numéros neufs (6.4.1, 6.3.3, 6.3.4),
pas retirés : la propriété reste la même. Le contrôle universel de la
navigation (verifier.js) et le banc navigateur « 8. LE MENU EN DEUX ÉTAGES »
couvrent la Terminale dès qu'elle déclare `menu` dans son profil — c'est fait,
et `soustheme` a rejoint ses `ecransHorsExercice`.
