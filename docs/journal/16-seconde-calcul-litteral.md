# Seconde — le thème 7, Calcul littéral

**Le thème s'est d'abord appelé « Rappels »** (v201) ; Turquet l'a renommé
« Calcul littéral » le jour même (v203). Le nom ne vit que dans `THEMES` : les
notes portent l'IDENTIFIANT des exercices, rien d'autre n'a bougé. Et c'est
le jour où deux sessions ont fait, à partir de la MÊME fiche papier, deux
exercices différents — chacune voyant un thème 7 neuf sur sa branche, et
chacune nommant ses fonctions `startRel`, `relLignes`… La seconde arrivée a
pris le préfixe `rgp` et la place 7.2 : deux exercices qui partageraient un
nom de fonction ne se contredisent pas, le second ÉCRASE le premier, sans une
erreur.

## {additionner-relatifs} — additionner deux relatifs, le signe d'abord (7.1, v201)

**La demande** (Turquet, septembre 2026) : reprendre une fiche papier dans un
nouveau thème « Rappels », avec des nombres à un chiffre, jamais zéro. La fiche
prend UNE paire de chiffres (3 et 2) et la décline sur les quatre signes :
+3 + 2, +3 − 2, −3 + 2, −3 − 2. Pour chacune, trois gestes : le signe du
résultat, le calcul à faire sans les signes (« 3 + 2 » ou « 3 − 2 »), le
résultat. En tête, la règle : « le signe du plus fort », jamais la règle des
signes — c'est l'erreur que la fiche veut déloger (−3 − 2 donnerait +5).

**Le thème vient EN DERNIER** (thème 7) : un thème ajouté à la fin ne
renumérote rien. Mais quatorze contrôles jsdom du thème Python cherchaient
« le DERNIER thème » et exigeaient qu'il soit le 6 : ils ont rougi tous
ensemble le jour où un septième thème est apparu, sans qu'aucun exercice
Python ait bougé. Ils cherchent désormais le thème par son NUMÉRO. Un contrôle
qui désigne une chose par sa position rougit le jour où une autre chose
arrive à côté.

**Une page = une question = treize cases** : la règle, puis signe, calcul et
résultat pour chacune des quatre sommes. Trois pages, barème 39. Les deux
chiffres d'une page sont DIFFÉRENTS : avec 3 et 3, −3 + 3 vaut 0, qui n'a pas
de signe, et la première case n'aurait pas de réponse. La première page suit
la fiche (le premier nombre est le plus fort) ; les suivantes tirent l'ordre,
sans quoi « le plus fort » se lirait toujours en tête. Trois paires distinctes.

**On range les deux chiffres, jamais les réponses** : `relLignes()` recalcule
signes, calculs et résultats dans la fonction qui corrige. Le résultat
s'écrit « 5 » ou « +5 » (le + est facultatif), « −1 » ou « -1 » ; « 5, » est
faux, pas vide. La case du résultat est `inputmode="numeric"` : le pavé des
tablettes s'y attache, et il porte le signe moins.

**Le juge** (`tests/verifier.js`, « additionner deux relatifs ») : la place
(7.1, thèmes 1 à 7 inchangés, pas de bouton des tables), 1 500 tirages (un
chiffre, jamais zéro, deux chiffres différents, paires distinctes, le plus
fort pas toujours devant), les 72 paires jugées par l'arithmétique de
JavaScript sur la somme elle-même, puis le bouton : la copie juste (13/13),
le piège de la règle des signes (rouge sur la règle, le signe et le résultat
de −3 − 2, le calcul juste de la même ligne reste juste, le message nomme le
plus fort), deux cases vides (vertes, sans faire rougir leurs voisines).
Éprouvé par sabotage : un signe du résultat figé à « + » rougit le juge en nommant les sommes fausses (« +1 − 2 : signe + »).

## {nombres-relatifs} — gagner et perdre (7.2, v203)

**La demande** (Turquet, septembre 2026) : la même fiche « relatifs_1 », prise
par son autre bout — ce que le 7.1 CALCULE, celui-ci le fait LIRE. Quatre
situations d'argent (on gagne puis on gagne, on gagne puis on perd, on perd
puis on gagne, on perd puis on perd), dites en MOTS — « au final on … … € » —
puis en ÉCRITURE MATHÉMATIQUE — « +3 − 2 = … … ». La fiche fait compléter avec
« gagne ; perd ; des nombres ; + ; − » : chaque ligne porte deux LISTES
(gagne/perd, puis le signe) et deux CASES numériques (le nombre, deux fois).
Seize cases par page, trois pages. Kind `rgp`, écran `scr-rgp`.

**Un chiffre, jamais zéro — le résultat compris** : a + b ≤ 9 (sinon
« on perd 8 € et on perd 7 € » ferait écrire 15) et a ≠ b (sinon 0, que ni
« gagne » ni « perd » ne sait dire). Page 1 : le gain plus grand (comme la
fiche) ; page 2 : la perte plus grande ; page 3 : libre ; trois paires
distinctes. La question ne range que a et b : `rgpLignes()` recalcule tout.

**Le juge** : chaque case seule (`corrChoix`), une case vide reçoit la
correction en vert et ne rougit jamais, un « + » tapé devant le nombre ne
compte pas contre l'élève (le signe a sa liste). Le message ne parle que des
lignes qui ont une VRAIE faute (`msgAvecVides`), en mots puis en signes :
« la perte est plus grande que le gain, il reste une perte de 3 − 2 = 1 €.
Donc −3 + 2 = −1. » En soutien, correction au fil de la saisie.

**Sur un téléphone**, la case du nombre tombait seule à la ligne suivante,
loin du « = » qui l'annonce : le calcul, sa liste et sa case forment un bloc
insécable (`.rgp-grp`). Vu sur capture à 390 px, pas au banc.

**Le contrôle** (`tests/verifier.js`, « gagner et perdre ») : la place (7.2,
pas de bouton des tables), 400 séances jugées par une SECONDE méthode —
l'écriture affichée (« +3 − 2 ») évaluée comme un calcul, sans passer par les
signes de `rgpLignes` —, puis le bouton : la copie juste (16/16, avec un
« +5 » tapé), une seule faute (−3 + 2 = +1 : seul le signe rougit, le message
explique cette ligne-là et aucune autre), une case vide (verte, remplie), et
le soutien en direct. Sabotage : un tirage qui laisse passer 5 + 8 rougit en
nommant « le nombre 13 n'a pas un seul chiffre ».

## {multiplier-relatifs} — multiplier deux relatifs, la règle des signes (7.3, v204)

**La demande** (Turquet, septembre 2026) : la fiche papier suivante, dans le
même thème (demandée « dans le nouveau thème Rappels », renommé entre-temps
« Calcul littéral » — elle y prend la place 7.3, après {nombres-relatifs}), avec des nombres à un chiffre, jamais zéro, et un bouton pour les
tables de multiplication. La fiche est la sœur de celle du 7.1, prise dans
l'autre sens. En tête, on choisit la règle, et cette fois la bonne est la
**règle des signes**, jamais « le signe du plus fort ». Ensuite, la règle des
signes à compléter : (+)×(+), (+)×(−), (−)×(+), (−)×(−). Enfin, pour une même
paire (3 et 2 sur la fiche), les quatre produits (+3)×(+2) … (−3)×(−2), avec
pour chacun le signe du résultat et le résultat final.

**Une page = 13 cases** : la règle, les quatre signes de la règle, puis le
signe et le résultat de chacun des quatre produits. Trois pages, barème 39.
**À la différence du 7.1, deux chiffres égaux sont permis** : un produit n'est
jamais nul, et (−3)×(+3) = −9 a bien un signe. Les trois paires d'une séance
sont distinctes.

**Le bouton des tables est proposé** (l'identifiant n'est PAS dans
`TABLES_SANS`) : le résultat final est un produit de table. Le juge exige que
le bouton reste.

**On range les deux chiffres, jamais les réponses** : `mrlLignes()` recalcule
les produits dans la fonction qui corrige. Le résultat s'écrit « 6 », « +6 »
ou « (+6) », et « −6 », « -6 » ou « (−6) » : le + et les parenthèses sont
facultatifs, puisque le produit lui-même s'écrit entre parenthèses. « 6 »
pour (+3)×(−2) est faux : la valeur absolue seule ne suffit pas.
L'écran reprend les classes de mise en page du 7.1 (`rel-regle`, `rel-bloc`,
`rel-in`…) : ces deux exercices se lisent côte à côte, ils ont la même forme.

**Le juge** (`tests/verifier.js`, « multiplier deux relatifs ») vérifie
d'abord la place de l'exercice : 7.3 après le 7.1 et le 7.2, avec le bouton des
tables. Il fait ensuite 500 séances tirées : un chiffre de 1 à 9, les neuf
chiffres atteints des deux côtés, trois paires distinctes. Il contrôle les
81 paires par l'arithmétique de JavaScript, sur le produit lui-même. Puis il
passe par le bouton :
- la copie juste compte 13/13, avec « 6 », « −6 », « (-6) » et « +6 » ;
- le piège du plus fort, (−3)×(−2) = −6, est rouge, et les cases justes
  voisines ne rougissent pas ;
- (−)×(−) = (−) est rouge, et le message dit « PAREILS » ;
- deux cases vides sont remplies par la correction sans faire rougir leurs
  voisines ;
- « 6, » et « 6 » sont faux.

Éprouvé par sabotage : une règle des signes qui attend « + » partout rougit
le juge sur `mrl-rs-1` et `mrl-rs-2`.

## {calcul-itere} — somme et produit de deux relatifs (7.4, v210)

**La demande** (Turquet, septembre 2026) : un exercice « dans le thème calcul
itéré » — une dictée qui entendait « itéré » pour « littéral » —, avec des
nombres à un chiffre, jamais zéro, en ALTERNANT somme et produit.

**Le premier jet (v205) avait mal lu « alterner »** : il ENCHAÎNAIT les
calculs, chaque résultat devenant le départ du suivant (3 + 4 = 7, 7 × 5 = 35…).
Turquet, le lendemain : « quand je disais alterné, c'était en ayant des calculs
disjoints et pas qui se suivent ». Deux questions ont levé le reste : les
nombres sont des RELATIFS, et la somme et le produit portent sur la MÊME paire.
L'exercice a été réécrit en place (v210). **L'identifiant reste
`calcul-itere`** alors que le calcul n'a plus rien d'itéré : un identifiant ne
se renomme jamais, les notes et les devoirs le portent. Les notes posées entre
v205 et v210 sous cet identifiant sont celles de la chaîne, sur 20 ; les
suivantes sont sur 24. Seuls le nom affiché et le moteur ont changé.
Leçon : un mot de la demande qui admet deux lectures (« alterner » : d'une
ligne à l'autre, ou d'un résultat au suivant ?) se demande AVANT d'écrire un
moteur, pas après l'avoir publié.

**Une page = quatre paires = huit cases.** Chaque paire tient dans un bloc de
deux lignes, « (−3) + (−5) = [  ] » puis « (−3) × (−5) = [  ] » : l'élève
change de règle à chaque ligne — le signe du plus fort pour la somme, la règle
des signes pour le produit —, et la paire commune met les deux règles face à
face. Les quatre paires d'une page couvrent les quatre combinaisons de signes
(+,+), (+,−), (−,+), (−,−), dans un ordre tiré. Les deux chiffres d'une paire
sont DIFFÉRENTS (avec −3 et +3, la somme vaut 0 et « le plus fort » n'existe
pas), et deux paires d'une page n'ont pas les mêmes chiffres. Trois pages par
`distinctes()`, barème 24. Le bouton des tables reste : on y multiplie.
Sur téléphone, l'étiquette « Somme / Produit » se tait sous 520 px : elle se
tassait sous le calcul, et le signe + ou × dit déjà l'opération.

**On range les paires signées, jamais les réponses** : `citLignes()`
recalcule sommes et produits dans la fonction qui corrige. Les réponses se
lisent comme au 7.1 (`relLit`) : « 2 », « +2 », « −2 », « -2 » ; « 8, » est
faux, pas vide.

**Le message** part de la première case fausse et reconnaît le piège croisé :
« (−3) + (−5) = +8 » reçoit « … le signe est celui du plus fort … La règle des
signes, c'est pour MULTIPLIER » ; « (−3) × (+5) = +15 » reçoit « … c'est la
règle des signes … Le signe du plus fort, c'est pour ADDITIONNER ».

**Le juge** (`tests/verifier.js`, « somme et produit de deux relatifs ») : la
place (7.4, bouton des tables présent), 500 séances tirées (trois pages, quatre
paires, les quatre combinaisons de signes, chiffres dans 1…9 et différents,
paires distinctes, l'alternance « + × + × … »), les attendus contre
l'arithmétique de JavaScript, puis le bouton : la copie juste (8/8, « +15 »,
« −15 » et « 2 » acceptés), les deux pièges croisés (rouges, le produit juste de
la même paire reste bleu, le message nomme la bonne règle), deux cases vides
(correction verte « −3 », voisines justes bleues), une réponse illisible.
Éprouvé par sabotage, deux fois : un produit qui prend le signe du plus fort
rougit le juge en nommant les produits faux, des lignes qui cessent d'alterner
le rougissent en montrant « ×××××××× ».

**La fusion qui recoud deux ajouts au même endroit laisse la fin commune au
second seul.** Le 7.2 et le 7.3 ajoutaient chacun un écran après celui du 7.1
et un moteur après celui du 7.1 : git les a vus comme UN conflit, dont la fin —
`</div></div></section>` pour l'écran, `return …; }` pour le contexte envoyé
au modèle — était commune. Mettre les deux blocs bout à bout a donc fermé le
second et laissé le premier ouvert : l'écran 7.3 vivait DANS l'écran 7.2
(invisible, des cases de 0 × 0 px), et `ctxCit` DANS `ctxRgp`. Le banc jsdom
a vu le second (« chaque corps de fonction est découpé entier ») ; le premier,
seule la page ouverte dans Chromium l'a montré. Et le résolveur écrit pour
l'occasion s'est d'abord pris au filet `=====` d'un en-tête de commentaire,
qu'il a lu comme le séparateur de conflit : un séparateur se reconnaît à ce
qu'il est SEUL sur sa ligne.

## {reduire-somme} — réduire une somme de termes (7.5, v206)

**La demande** (Turquet, septembre 2026) : reprendre une fiche papier
« Réduire si possible » dans le thème « écriture littérale ». La fiche
prend UNE paire de nombres (2 et 3) et la décline sur dix expressions de deux
termes : 2x + 3x, 2x + 3, 2x − 3x, 2x − 3, −2x − 3x, −2x + 3x, −2x² + 3x²,
−2x² + 3x, −2x² + 3, −2x² − 3x². En tête, une phrase à compléter : « On ne
peut additionner que des termes … » — de même nature.

**La demande parlait du thème « écriture littérale »** : c'est le thème 7,
renommé « Calcul littéral » le même jour ({additionner-relatifs} et
{nombres-relatifs}). L'exercice s'y range en 7.5, après {multiplier-relatifs} (7.3) et {calcul-itere} (7.4), arrivés sur `main` le même après-midi — un thème 8 « Écriture
littérale » à côté aurait fait deux thèmes pour une même idée. Il arrive en
dernier dans le thème : rien n'est renuméroté.

**Une page = une question = onze cases** : la liste de la règle (« de même
signe » / « de même nature » / « qui ont le même coefficient »), puis une case
par expression. Trois pages, barème 33. Les deux nombres d'une page vont de 2
à 9 et sont DIFFÉRENTS : avec a = b, −ax + ax vaut 0 ; avec 1, l'énoncé
écrirait « 1x ». La première page suit l'ordre de la fiche ; les suivantes
mélangent les lignes (`q.ordre`, hors de la clé de `distinctes()`), sans quoi
les quatre lignes qui ne se réduisent pas se reconnaîtraient à leur rang.

**Une expression qui ne se réduit pas laisse la case VIDE** (décision de
Turquet, septembre 2026) : la consigne à l'écran le dit désormais — « ne
complète une case que si tu peux réduire l'écriture » — et une case vide sur
une de ces lignes est la bonne réponse, peinte `ok` comme n'importe quelle
autre case juste, pas `sol` comme une case oubliée. Avant cette décision,
l'élève devait RECOPIER l'expression ; la recopie reste acceptée, `redJuste`
la traite comme n'importe quelle autre écriture de même valeur, mais elle
n'est plus exigée. C'est tout le piège de la fiche qui reste : 2x + 3 = 5x,
−2x² + 3x = x². `msgAvecVides` ne doit compter, dans « il te manquait X
cases », que les cases VRAIMENT manquantes (une ligne réductible laissée
vide) — pas celles qui sont vides à bon droit ; `checkRedAnswer` calcule donc
`vide` comme `(case vide) ET (pas déjà juste)`, jamais la seule emptiness.

**Le x que l'élève tape est le x de l'expression affichée devant sa case**
(demande de Turquet, septembre 2026) : `.red-in` passait par « Fredoka »,
la police du reste de la page, qui n'a pas d'italique réelle (seules les
graisses 400 à 700 sont chargées) — un italique simulé penche le x mais ne
lui donne pas la même forme que celui de l'énoncé. `.red-expr i` bascule déjà
en Times New Roman pour cette raison ; la case suit désormais la même
police et le même style, plutôt que d'italiciser Fredoka. Ça italicise aussi
les chiffres que l'élève tape (2x + 3 s'écrit tout en italique dans la case,
quand seul le x l'est devant elle) : un compromis accepté plutôt qu'une
case en deux polices, impossible à obtenir dans un `<input>` simple sans
passer par MathLive.

**La case lit une somme de termes, pas une chaîne** (`redLit`) : l'ordre des
termes est libre (3 + 2x), x² s'écrit « x² », « x^2 » ou « x2 », le moins
« - » ou « − », « x » vaut 1x et « 1x » est accepté. Une réponse de même
VALEUR mais non réduite (« 2x+3x », « 2x + 0 ») est fausse, et le message le
dit. Un bouton « x² » à côté de chaque case écrit x² au curseur : sur
tablette, ni « ² » ni « ^ » ne se trouvent sans chercher.

**On range les deux nombres et l'ordre, jamais les réponses** : `redLignes()`
recalcule les expressions et leur forme réduite dans la fonction qui corrige.

**Le juge** (`tests/verifier.js`, « réduire une somme de termes ») : la place
(7.5, le 7.1 à 7.4 inchangés, sept thèmes, un badge de mode qui est le sien, pas de bouton des tables), 500 séances
tirées (2 à 9, différents, pages distinctes, la fiche en tête, les lignes
mélangées ensuite), les 56 paires jugées par une SECONDE méthode — la valeur de
l'expression et celle de la réponse attendue, en trois valeurs de x ; une
réponse d'une ligne réductible a un seul terme, celle d'une ligne qui ne se
réduit pas est l'expression elle-même. Puis le bouton : la copie juste (11/11,
avec des ordres et des écritures variés), les pièges (règle « de même signe »,
2x + 3 = 5x, −2x² + 3x = x², 2x − 3x = x : rouges, leurs voisines justes
restent justes, le message dit « de même nature »), une réduction inachevée
rouge, « 1x » juste, deux cases vides SUR DES LIGNES RÉDUCTIBLES (correction
verte, pas comptées justes), les quatre lignes NON réductibles laissées vides
(11/11, peintes `ok` — pas la correction), une vraie case manquante à côté
d'une case vide correcte (le message ne compte que celle qui manque vraiment),
une écriture illisible rouge. Éprouvé par sabotage : une case qui accepte une
somme non réduite rougit le juge (« « 2x+3x » pour 2x + 3x est peint en
vert »).

## {associer-expressions} — associer chaque expression à son résultat (7.6, v207)

Demandé par Turquet en septembre 2026, d'après deux fiches papier : la
première avec le nombre 3 (3², 2 × 3, 3/3, 3 − 3 à associer à 0 ; 3 + 3 ; 1 ;
3 × 3), la seconde avec la lettre x, « un nombre différent de 0 ». La consigne :
**trois pages comme la première fiche, puis la seconde, une seule fois**. La
séance a donc quatre pages de quatre listes — barème 16.

Écrit d'abord comme un thème 8 neuf — le thème 7 s'appelait encore « Rappels »
sur la branche —, il a rejoint le thème 7 à la fusion de `main`, qui venait de
le renommer « Calcul littéral » : c'est là que Turquet l'avait demandé. Il
devait y être le 7.3 ; le produit de relatifs, le calcul itéré puis la réduction
d'une somme sont arrivés sur `main` pendant que ses bancs tournaient, et
l'association est passée 7.6 à la quatrième fusion — chaque fois avec un `APP_VERSION` de plus. Préfixe
`asx`, distinct de `rel` et de `rgp` (la leçon du paragraphe d'ouverture).

**Le tirage.** Un nombre de 3 à 9 par page, trois nombres différents
(`distinctes()` — l'ordre des résultats, rangé dans `ordre`, n'en fait pas une
autre question). Ni 1 ni 2 : avec 2, 2² = 2 × 2 = 2 + 2 = 4, et le carré aurait
deux bonnes réponses ; avec 1, 1² = 1 × 1 = 1/1 = 1. La première page suit la
fiche (résultats dans l'ordre 0 ; n + n ; 1 ; n × n), les suivantes les
mélangent, pour qu'on les cherche au lieu de les lire au même rang. La page de
x vient toujours en dernier, et une seule fois ; son énoncé ajoute « x
représente un nombre différent de 0 » — sans quoi x/x n'existe pas.

**Le juge.** On range le nombre et l'ordre, jamais les réponses : ce que
chaque liste attend se déduit de la clé de l'expression (`asxLignes`). Chaque
liste a son verdict (`corrChoix`) : une case juste ne rougit pas pour sa
voisine, une case vide reçoit la correction en vert. Le pourquoi parle de la
PREMIÈRE expression fausse avec le nombre de la page (« 3² = 3 × 3 = 9 : le
carré, c'est le nombre multiplié par LUI-MÊME — pas par 2 ») ; sur la page de x,
il ajoute que c'est la même règle qu'avec les nombres des pages précédentes.

**L'affichage.** La ligne est une rangée flex centrée : le « = » posé à côté
de n/n (fraction empilée, `fracBox`) tombe sur le trait. Le rappel de cours
écrit ses fractions en `\frac` — le contrôle des rappels a rougi au premier
jet sur « 3/3 » écrit en ligne.

**Le contrôle jsdom** (`associerExpressions`) juge par une seconde méthode :
la VALEUR de chaque expression et de chaque résultat, calculée par le banc, et
exige qu'une seule valeur corresponde — c'est ce qui tient l'exclusion de 1
et de 2. Il rejoue ensuite la correction par le bouton : copie juste sur les
quatre pages, le carré pris pour le double (rouge, les deux autres restent
justes, le message dit « 3 × 3 »), une case vide qui reçoit la correction.

**Puis l'ordre des EXPRESSIONS s'est mélangé, et la page de x s'est dédoublée
en trois lettres** (demande de Turquet, septembre 2026, v209). Deux
changements distincts. D'abord, les quatre expressions (n², 2n, n/n, n − n)
se lisaient toujours dans le même ordre, sur les quatre pages : seul l'ordre
des RÉSULTATS proposés bougeait. `asxLignes` range désormais ses quatre
lignes selon `q.ordreExpr`, une seconde liste mélangée exactement comme
`ordre` — sur la première page, elle suit la fiche (n² ; 2n ; n/n ; n − n),
sur les autres elle est tirée par `asxMelange`, désormais générique
(`asxMelange(tableau)` au lieu de mélanger `ASX_RES` en dur, pour servir les
deux listes). Ensuite, la seule page de x est devenue TROIS pages, une par
lettre — x, puis a, puis b, toujours dans cet ordre-là (pas mélangé : c'est
la lettre qui distingue chaque page, pas une position tirée au sort) — après
les trois pages à nombre. La séance compte donc SIX pages, barème 24.
`asxN`/`asxT` ne testent plus `q.n==='x'` mais `typeof q.n==='string'`
(`asxLettre`), pour que « différent de 0 » et l'italique s'appliquent aux
trois lettres, pas à x seule.

**Le piège du dédoublonnage.** `distinctes()` écarte deux pages à nombre qui
tireraient le même `n`, mais compare les questions par `cleQuestion`, qui
ignore la clé `ordre` — CETTE clé est déjà dans `CLE_HORS`, posée là parce
que l'ordre des résultats est aléatoire et ne doit pas rendre deux pages
« différentes » aux yeux du dédoublonnage. `ordreExpr` est arrivée à côté
sans y être ajoutée : deux pages tirant le même nombre mais un ordre
d'expressions différent passaient alors pour deux questions distinctes, et
`distinctes()` laissait passer un nombre répété — le contrôle jsdom l'a
rougi tout de suite (« deux pages tirent le même nombre : 4 4 3 »). Toute
clé qui varie sans changer l'identité d'une question doit rejoindre
`CLE_HORS`, comme `ordre` l'a fait avant elle ; l'oublier ne casse rien à la
lecture du code, seul un tirage répété — ou le contrôle qui le cherche — le
montre.

## {soustraire-relatifs} — soustraire un relatif, c'est additionner son opposé (7.7, v208)

**La demande** (Turquet, septembre 2026) : reprendre une fiche papier
(« relatifs_4 ») dans le thème du calcul littéral, avec des nombres à un
chiffre, jamais zéro. Il vient en 7.7, à la suite des six premiers.
Écrit d'abord comme un thème 8 « Calcul littéral » — le 7 s'appelait encore
« Rappels » —, il a rejoint le 7 quand {nombres-relatifs} l'a renommé. Puis
cinq autres sessions ont ajouté un exercice au même thème le même
après-midi, et chacune de leurs fusions l'a repoussé d'un rang : 7.3, 7.4,
7.5, 7.6, 7.7. Le premier à fusionner garde le numéro, et la branche a été
refaite sur `main` à chaque fois plutôt que fusionnée à la main : les
conflits tombaient tous dans les mêmes listes, où chaque côté ajoutait son
entrée au même endroit.

**La fiche** prend UNE paire (3 et 2) et la décline sur les quatre signes, en
une chaîne d'égalités : +3 − (+2) = +3 + ( … 2) = …… ; en tête, la règle à
compléter : « il suffit d'additionner son …… ». La page reprend la chaîne à
l'identique : le signe dans la parenthèse est une liste (+ / −), le résultat
une case `inputmode="numeric"` ; la règle est une liste « opposé / inverse /
double » — l'inverse est la confusion de vocabulaire que la fiche vise.
**Neuf cases par page, trois pages, barème 27.**

**La chaîne est une égalité poursuivie** : trois groupes insécables
(`.srl-grp`), si bien qu'un écran étroit la replie ENTRE deux « = », jamais
entre un « = » et la case qu'il annonce.

**Le tirage** : deux chiffres DIFFÉRENTS de 1 à 9 (avec 3 et 3, deux lignes
vaudraient 0) ; la première page suit la fiche (le premier nombre est le plus
fort), les suivantes tirent l'ordre. Deux pages ne portent jamais la même
paire, DANS UN ORDRE OU DANS L'AUTRE — plus strict que `distinctes()`, qui
compare les paires dans l'ordre : 3 et 2 puis 2 et 3 poseraient les mêmes
calculs. On range les deux chiffres, jamais les réponses (`srlLignes()`). Les
aides (vérification, résultat, lecteur de nombres) sont celles du 7.1 :
`relMoins()`, `relLit()`, `corrChoix()`.

**Le juge** (`tests/verifier.js`, « soustraire un relatif ») : la place (7.7,
thèmes 1 à 7, les 7.1 à 7.6 immobiles, pas de bouton des tables), 1 500 tirages, les
72 paires jugées par l'arithmétique de JavaScript (le signe de l'opposé est
celui de −y, et x + (−y) redonne x − y), la ligne de la fiche écrite à
l'écran, puis le bouton : la copie juste (9/9), le piège « garder le signe »
(+3 − (−2) = +3 + (−2) = 1) avec « inverse » pour la règle — rouge sur les
trois cases, les voisines justes restent justes, le message parle de
l'opposé et réécrit la ligne fausse —, deux cases vides (correction, pas de
rouge), « 1, » faux et non vide. Éprouvé par sabotage : un signe d'opposé
inversé dans `srlLignes()` rougit le juge en nommant les quatre lignes.

## {reduire-produit} — réduire chaque produit avec x (7.8, v210)

**La demande** (Turquet, septembre 2026, d'après une fiche papier « Réduire
chaque produit ») : quinze produits de deux facteurs (a à o), chacun un
nombre ou la lettre x — jamais x², jamais deux nombres seuls, puisque le
thème est l'écriture littérale. **En deux temps** : d'abord chaque produit se
décompose en trois cases — le signe du résultat, son coefficient entier, puis
si l'écriture se termine par x ou par x² — ; ensuite, une seconde page
demande directement le résultat réduit, comme {reduire-somme}. Deux pages,
deux écritures de la même chose, plutôt que trois pages identiques.

**« On mettra autant de x sans coefficient que dans le pdf »** : neuf des
trente facteurs de la fiche s'écrivent NUS — « x », « -x » — sans aucun
chiffre devant, et le tirage garde ce compte exactement, facteur par facteur.
`RPD_MODELES` fixe la FORME de chaque lettre (X0 un facteur nu, Xc un
coefficient de 2 à 9, N un nombre, X1 un coefficient figé à 1) ; seuls les
nombres et les signes sont retirés à chaque page, jamais la forme. Un seul
facteur de la fiche écrit un coefficient de 1 en toutes lettres — le second
de « m », -5x × 1x — exprès, pour distinguer « 1x » de « x » : c'est la
seule lettre qui porte X1, et lui seul le porte.

**Le résultat est toujours en x ou en x²**, jamais un nombre seul : chaque
produit porte au moins un facteur en x. Le degré du résultat se déduit du
nombre de facteurs en x (1 ou 2), jamais tiré à part.

**Un produit réduit EST un terme, comme une somme réduite** : `rpdLignes()`
réutilise telles quelles les fonctions de {reduire-somme} — `redEcrit` pour
écrire le résultat, `redLit` et `redMeme` pour lire et juger la page directe
— au lieu de réécrire un lecteur d'expression à part.

**Le bouton des tables est proposé** (l'identifiant n'est PAS dans
`TABLES_SANS`) : comme {multiplier-relatifs}, le résultat est un vrai
produit à calculer.

**On range les deux facteurs de chaque produit, jamais les réponses** :
`rpdLignes()` recalcule signe, coefficient, degré et écriture réduite dans
la fonction même qui corrige.

**Le juge** (`tests/verifier.js`, « réduire chaque produit avec x ») : la
place (7.8, les 7.1 à 7.7 immobiles, bouton des tables présent), le compte
des facteurs nus (neuf, comme la fiche), 300 tirages (chaque facteur dans la
forme que dicte `RPD_MODELES`, les magnitudes de 2 à 9 pour Xc et N, figées à
1 pour X0 et X1), les réponses jugées par une SECONDE méthode — une écriture
du résultat reconstruite dans le contrôle, indépendante de `redEcrit` —, puis
le bouton sur la fiche elle-même (x × 3, x × x, …, -x × -x) : la copie juste
des deux phases (45/45 puis 15/15), un piège de degré (15x² écrit 15x, faute
de carré) rouge sans toucher ses voisines, une case vide (correction, jamais
rouge), une écriture illisible rouge sur la page directe, le barème de 60
(45 + 15).

**L'inconnue x en italique, et le coefficient en trois choix (v216,
septembre 2026)** : deux défauts remontés par Turquet sur cet exercice
précisément. D'abord, l'énoncé de chaque produit affichait un x DROIT — la
seule case de tout le thème Calcul littéral à ne pas suivre la convention de
{reduire-somme} (`.red-expr i` en Times New Roman, x et x² du reste du
thème). `rpdEcritFacteur(f, html)` gagne donc un second paramètre : `false`
garde le x nu pour tout ce qui reste du texte brut (aria-label, messages,
réponses enregistrées), `true` le sort en `<i>x</i>` sous un nouveau champ
`exprH`, posé en innerHTML — jamais dans `esc(l.expr)`, qui aurait affiché
les balises en toutes lettres. Ensuite, la case du coefficient entier
(phase détaillée) était une saisie libre : Turquet a demandé qu'elle
propose trois valeurs, la bonne et ses deux voisines (+1 et -1), comme un
QCM — `rpdCoefOpts()` les mélange avec `ensShuffle()`. Les trois cases de
cette phase (signe, coefficient, fin d'écriture) sont donc maintenant TOUTES
des listes, plus aucune n'est une saisie : la règle « case à la taille des
nombres » (`docs/journal/11-aides-et-interface.md`) ne les vise plus, comme
elle ne visait déjà pas le signe de {soustraire-relatifs} — elles peuvent
donc rester petites, et l'égalité (lettre, produit, signe, coefficient, fin
d'écriture) tient sur une seule ligne au lieu des deux rangées empilées
d'avant. Le juge en jsdom ne peut plus taper « 3, » dans une liste : le test
d'une réponse fausse-mais-proposée bascule sur la voisine +1 (`rpd-c-0` à
4 au lieu de 3), et un nouveau test lit les trois `<option>` du premier
coefficient pour vérifier qu'elles sont bien la bonne valeur et ses deux
voisines.

**(3, 7) puis (7, 3), c'est deux fois la même page (audit d'octobre 2026,
M41).** {multiplier-relatifs} retirait une paire déjà tirée, mais la clé était
ORDONNÉE : (3, 7) et (7, 3) posent les quatre mêmes produits, et c'est
arrivé dans 3 % des séances. La clé de `mrlGen` est la paire non ordonnée ; le
contrôle de l'exercice, qui comparait des paires ordonnées, compare
maintenant les paires triées (l'ancien code rougit : « 4-6 9-2 6-4 »).

**« 0 » n'est pas un coefficient de x² (M42).** Au 7.8 en phase détaillée,
le coefficient se propose avec ses deux voisines ; pour x × x (coefficient
1), la voisine du dessous était 0 — un piège qui n'en est pas un. Un
coefficient de 1 se propose désormais avec 2 et 3 (`rpdCoefOpts`). Le
contrôle de l'exercice lit les options de la ligne b. (x × x) de la fiche.

**« Corrige les cases en rouge » sans case rouge (M43).** En soutien, une
case laissée vide reste neutre ; une page de {reduire-somme} dont il ne
manquait qu'une ligne réductible recevait pourtant « Presque ! Corrige les
cases en rouge ». `soutienAgain()` — partagée par 66 écrans — cherche le rouge
dans tout l'écran (message excepté) avant de le nommer, et dit sinon
« Complète ta réponse, puis revérifie. », la phrase du 1.6. Le contrôle de
{reduire-somme} joue les deux bords en soutien : une case vide seule, puis une
case fausse.

## {developper-distributivite} — développer avec la distributivité (7.9, v513)

**La demande** (Turquet, octobre 2026, d'après la fiche papier « Fiche sur
développer et factoriser », exercice 1) : « créer un exercice comme le pdf 1 ;
je veux voir les termes entourés à peu près comme dans le pdf, avec des
flèches qui indiquent la distribution, et les accolades en dessous des
produits ». La fiche entoure le facteur k en ROUGE (pointillés), le premier
terme de la parenthèse en BLEU NUIT (pointillés), le second en VERT (trait
plein) ; deux flèches partent de k. Ligne 2 : « k × a + k × b », bulles vides
des mêmes couleurs, flèches redessinées, une accolade sous chaque produit.
Ligne 3 : le résultat de chaque produit, sous son accolade.

**Six pages, les formes de la fiche, dans son ordre** : k × (x + b),
k × (ax − b), −k × (ax − b), x × (ax − b), kx × (ax − b), puis
k × (ax − b) − k′ × (a′x − b′) — la page F de la fiche, avec ses quatre
produits, quatre accolades et sa ligne réduite (« le terme en x d'abord, puis
le nombre »). Seuls les nombres sont tirés ; la forme de chaque page est
fixe, une famille par page : la séance ne peut pas poser deux fois la même
question, et le tirage n'a pas besoin de `distinctes()` (`dvlBuildQuestions`
remplit un tableau, pas de « .map( » sur `test.questions`). Sur F, ni les x ni
les nombres ne s'annulent à la réduction (le tirage recommence). La première
page montre l'EXEMPLE de la fiche, rempli : 5 × (x + 3) = 5x + 15 — sans
aucune case.

**Les flèches et les accolades sont un `<svg>` posé PAR-DESSUS le texte**
(`dvlTrace`) : les bulles sont du vrai texte et de vraies cases, le dessin lit
leurs positions RENDUES (arc de k vers le haut de chaque terme, pointe en bas ;
accolade sous chaque groupe `k × a`). Il se retrace au rendu, après les
polices, à chaque correction (un badge déplace les bulles) et à chaque
changement de taille (`ResizeObserver`, plus `resize`). Les lignes 2 et 3
sont une GRILLE : chaque résultat est dans la colonne de son produit, donc
sous son accolade, sans calcul de position.

**Le verdict peint le FOND de la case, la bulle garde son anneau** : un anneau
rouge est la couleur du facteur k, pas une faute. Le badge vert d'une case
fausse se pose À CÔTÉ de la bulle (`dvlCorr`) — et pour un résultat, DANS sa
cellule : posé après la cellule, il devenait une cellule de plus de la grille
et tombait sous la ligne (vu sur la première capture).

**Le terme qui en suit un autre garde son signe** : « 5x +15 », jamais
« 5x 15 » — c'est ce que la fiche fait écrire, et c'est là que le signe se
perd. Un « 15 » nu en deuxième position est rouge, et le message le nomme
(« Le résultat est juste, mais il suit un autre terme : il garde son signe,
+15. »). Le premier terme d'une ligne s'en passe ; dans une bulle, « −3 »
s'écrit avec ou sans parenthèses, et « 2 » vaut « +2 ». La lecture d'un terme
réutilise `redLit` de {reduire-somme} (« x² », « x^2 », « x2 »), avec un
bouton « x² » qui écrit dans la dernière case touchée.

**Le bouton des tables est proposé** (pas dans `TABLES_SANS`) : chaque produit
se calcule.

**Sur téléphone**, la police du schéma descend à 1 rem et les bulles
maigrissent : les pages à un produit tiennent dans la largeur ; la page F
(huit bulles) défile dans son cadre.

**Le juge** (`tests/verifier.js`, « développer avec la distributivité ») : la
place (7.9, les 7.1 à 7.8 immobiles, bouton des tables présent), 300 tirages
(les six formes dans l'ordre, les bornes de chaque nombre, F jamais annulée),
puis la fiche elle-même au bouton — 4 × (x + 2), 4 × (2x − 1), −3 × (2x − 5),
x × (2x − 1), 3x × (2x − 5), 3 × (2x − 1) − 2 × (4x − 5) —, avec les réponses
écrites À LA MAIN dans le contrôle : la copie juste de chaque page (6, 6, 6, 6,
6 et 14 cases), les flèches et accolades déclarées (4 et 2 par produit),
l'exemple sur la première page seulement et sans case ; puis les pièges : le
second terme sans son signe (rouge seul, message qui le nomme), « 4 » dans la
bulle bleue de x (rouge), « 2x » pour x × 2x (rouge), deux cases vides (la
correction, jamais rouge), la forme réduite sans signe puis non réduite
(rouges), le barème de 44.

## {developper-double} — développer avec la double distributivité (7.10, v518)

**La demande** (Turquet, octobre 2026, d'après la fiche papier « Développer »,
exercice 4) : « faire un exercice présenté comme le 7.9 mais qui suit le pdf
joint ». La fiche développe (a + b) × (c + d) : le premier terme de la
première parenthèse entouré en ROUGE (pointillés), le second en NOIR
(pointillés) ; dans la seconde, le premier en BLEU (pointillés fins), le
second en VERT (trait plein). Deux flèches partent du rouge PAR-DESSUS vers le
bleu et le vert, deux du noir PAR-DESSOUS. Ligne 2 : les quatre produits
« rouge × bleu + rouge × vert + noir × bleu + noir × vert », bulles vides des
mêmes couleurs, une flèche et une accolade par produit. Ligne 3 : les quatre
résultats, et une GRANDE accolade sous les deux termes en x. Ligne 4 : la
forme réduite — le x² sous le premier produit, le terme en x sous la grande
accolade, le nombre sous le dernier.

**Quatre pages, les formes de la fiche** : (ax − b)(cx − d) deux fois (A et
B), (x − b)(cx − d), (ax − b)(cx + d). A et B ont la même forme : elles sont
tirées par `distincte()` avec une clé qui lit les NOMBRES (`[f1, f2]`), pas la
lettre de la page — la clé par défaut lit `forme`, qui diffère toujours, et
n'aurait rien empêché. Le terme en x ne s'annule jamais (le tirage
recommence ; il ne le peut que sur D) : la forme réduite a toujours ses trois
cases. La première page montre l'EXEMPLE de la fiche, rempli :
(4x − 3)(2x − 5) = 8x² − 20x − 6x + 15 = 8x² − 26x + 15.

**Le moteur est celui du 7.9**, partagé, pas recopié : `dvlLit`, `dvlJuste`,
`dvlCorr`, `dvlSuivre` et `dvlTrace`. Ce dernier a appris deux gestes, sans
rien changer au 7.9 : une flèche marquée `'bas'` passe par-dessous (pointe
vers le haut), et une accolade déclarée par une PAIRE d'identifiants
s'étend sous les deux. Les lignes 2 à 4 sont une seule grille de huit
colonnes ; la ligne réduite place ses cases par `grid-column` (2, 4 / 7, 8),
si bien que le terme en x tombe au milieu de la grande accolade sans calcul de
position.

**Le bleu s'éclaire en 7.10** (`.dvd-schema .dvl-bul.dvl-a`) : le bleu nuit du
7.9, à côté du noir, ne s'en distinguait plus à l'écran (vu sur la première
capture). Il passe en bleu franc et en pointillés fins, comme sur la fiche ;
le 7.9, qui n'a pas de noir, garde le sien.

**Le terme qui en suit un autre garde son signe**, en ligne 3 comme en
ligne 4 (« −20x », « +15 ») — même règle et même message que le 7.9. Le
pourquoi suit la flèche (« le produit 2 relie la bulle rouge à la bulle
verte »), le produit, ou la réduction (« sous la grande accolade, les deux
termes en x se regroupent »).

**Le juge** (`tests/verifier.js`, « développer avec la double
distributivité ») : la place (7.10, le 7.9 immobile), 400 tirages (les quatre
formes dans l'ordre, les bornes, A ≠ B, terme en x jamais nul), puis la fiche
elle-même au bouton — (4x − 3)(2x − 5), (3x − 4)(5x − 3), (x − 2)(8x − 1),
(3x − 2)(2x + 5) — avec les réponses écrites À LA MAIN : la copie juste de
chaque page (15 cases), 8 flèches dont 2 par-dessous, 5 accolades dont la
grande, trois bulles noires ; l'exemple sur la première page seulement, sans
case ; puis les pièges : « 15 » sans son signe (rouge seul, message qui le
nomme), −15 pour (−3) × (−5), 2x dans la bulle verte (message qui suit la
flèche), « −20x−6x » non réduit et −14x (message de la grande accolade), 8x
pour 4x × 2x, deux cases vides (la correction, jamais rouge), le barème de 60.

## {developper-double-nu} — la double distributivité sans les flèches (7.11, v524)

**La demande** (Turquet, octobre 2026) : « en seconde faire le même exercice
que le 7.10 mais sans afficher les flèches, les formes qui entourent les
nombres et sans les accolades ». C'est le 7.10 sans son échafaudage : les
mêmes quatre pages, les mêmes quinze cases à la même place, le même juge et le
même exemple — seul le dessin tombe.

**Un moteur, deux identités.** Le 7.11 n'a rien recopié : les fonctions du
7.10 lisent leur préfixe sur `test.kind` (`dvdP()` : « dvd » ou « dvn ») —
cases `dvn-f-…`, `dvn-t-…`, `dvn-r-…`, écran `scr-dvn` —, `startDvd('dvn')`
pose `kind:'dvn'` et `qId:'developper-double-nu'`, et `dvdSchema(…, nu)`
remplace chaque bulle par un simple `.dvl-nb`, sans `<svg>` ni `data-fl` /
`data-acc`. `dvlSuivre` n'est pas appelé : il n'y a rien à tracer. Le barème
se calcule APRÈS l'`Object.assign` du kind, puisque `dvdCases` le lit.

**Sans bulle, la case d'un facteur prend le cadre des autres**
(`.dvn-schema .dvl-in.dvl-f`) : la case ronde sans bordure du 7.10 ne se
voyait que dans sa bulle. La place que prenaient les flèches (46 px au-dessus,
70 px sous la première ligne) et les accolades (30 px entre les rangées) se
rend.

**Ce qui parlait du dessin se reformule** : la consigne ne nomme plus ni
couleur ni flèche (« le premier terme par le premier, puis par le second ; le
second terme par le premier, puis par le second ») ; le pourquoi d'un facteur
faux nomme les termes (« Le produit 2 multiplie le premier terme de la
première parenthèse par le second terme de la seconde ») ; celui de la
réduction ne parle plus de grande accolade. Dans l'exemple, un facteur
négatif qui suit un « × » ou ouvre un produit prend ses parenthèses
(« + (−3) × (−5) ») : la bulle ne les délimite plus. Les cases, elles,
acceptent « −5 » comme « (−5) ».

**Le juge** (`tests/verifier.js`, « développer avec la double distributivité
sans les flèches ») : la place (7.11, le 7.10 immobile), l'identité (kind,
qId, écran, barème de 60), puis la fiche du 7.10 au bouton avec des réponses
écrites à la main — la copie juste de chaque page (15 cases), AUCUN dessin
(ni `.dvl-bul`, ni `svg`, ni flèche ni accolade déclarée, ni mot de couleur),
une consigne sans « flèche », « bulle » ni « accolade » ; l'exemple sans case,
avec « (−3) × 2x » ; les pièges : « 15 » sans son signe (rouge seul, message
nommé), le produit croisé (message qui nomme les termes, jamais la flèche),
−14x (message sans accolade), deux cases vides (la correction) ; enfin le
7.10 relancé garde ses bulles et ses cases `dvd-…`.

## « x^2 » s'écrit x² dans la case — 7.9, 7.10 et 7.11 (v526)

**La demande** (Turquet, octobre 2026, capture du 7.10) : l'élève qui tape
« x^2 » voyait « x^2 » dans la bulle et dans la case du résultat, pas un 2 en
exposant ; et « x**2 » devait servir aussi de raccourci. Le juge les lisait
déjà (`redLit` change `**` en `^`) : seul l'AFFICHAGE manquait.

**La case se réécrit à la frappe** (`dvlExposant`, appelé en tête de
l'écouteur `input` du 7.9 et du 7.10/7.11) : « ^2 » et « **2 » deviennent
« ² », le curseur recalé de ce que la conversion a retiré. Un « ^ » seul
attend son 2 (« 15x^ » reste tel quel le temps de taper). Sous le bouton
« x² », une mention le dit : « ou tape x^2, x**2 ».

**Le juge** (`tests/verifier.js`, dans le contrôle du 7.11) : « 8x^2 »,
« -3x**2 », « x**2 » tapés avec un vrai événement `input` s'affichent
« 8x² », « -3x² », « x² » dans une case du 7.11, du 7.10 et du 7.9 ;
« 15x^ » ne bouge pas ; la case convertie se lit toujours 8x².

## {vrai-faux-calcul} — vrai ou faux sur des erreurs d'élèves (7.12, v541 — v539 et v540 prises par le 8.2.8 et le 8.2.15)

**La demande** (Turquet, octobre 2026) : « un vrai ou faux sur des erreurs
d'élèves. Par exemple 2x + 3x = 5x², −(x − 2) = −x − 2, 3(x + 4) = 3x + 4.
L'élève dit "faux" et corrige. On retrouve l'esprit de 8.1.10 (le vrai ou
faux sur une figure à pièges). » Ajouté en dernier du thème 7 : 7.12, rien ne
se renumérote. Kind `vfl`, écran `scr-vfl`.

**Huit familles d'erreur** (`VFL_ERREURS`), chacune avec son tirage, son
membre de gauche, sa bonne réponse et son erreur EXACTE :
- `expo` — 2x + 3x = 5x² (les exposants s'ajoutent) ;
- `nature` — 2x + 5 + 3x = 10x (un nombre mêlé aux x) ;
- `produit` — 2x × 3x = 6x ou 5x² (x × x oublié, ou les coefficients
  ajoutés) ;
- `moins` — −(x − 2) = −x − 2 (le moins ne change que le premier signe) ;
- `distrib` — 3(x + 4) = 3x + 4 (le facteur oublie le second terme) ;
- `distribNeg` — −2(x − 3) = −2x − 6 (la règle des signes du second
  produit) ;
- `soustr` — 5x − (2x + 3) = 3x + 3 (le nombre ne change pas de signe) ;
- `signes` — −3x − 2x = 5x (« moins par moins » appliqué à une somme).

**Six égalités par page, six familles différentes, trois pages**
(`VFL_L`, `VFL_NB`, `dmNbQuestions`). De 1 à 3 sont vraies (`VFL_VRAIES`) :
la vraie et la fausse d'une famille ne diffèrent que par l'erreur, et le
nombre de vraies change d'une page à l'autre — « tout est faux » ne se
devine pas. Le tirage passe par `distinctes()`, la clé lit les familles et
leurs nombres. On range la famille, les nombres et le verdict (`t`, `n`,
`v`) ; `vflLignes()` recalcule les écritures.

**L'élève dit « Faux » et corrige.** Chaque ligne a sa liste « ? / Vrai /
Faux » (`itvSelHTML`, `TVF_OPT_VF`, comme au 8.1.10) et sa case de
correction « LHS = … », avec le bouton x² du 7.5. La case n'apparaît que
quand la liste dit « Faux » — par la règle CSS `:has(option[value="F"]:checked)`,
pas par un écouteur : la reprise d'une pause repose les valeurs SANS
événement, et la case revient d'elle-même. Toutes les lignes ont leur case,
vraies comprises : une case réservée aux lignes fausses trahirait le
verdict.

**Une ligne fausse vaut deux cases, une vraie une seule** : la case de
correction d'une ligne vraie n'est ni jugée ni peinte (elle ne compte donc
pas dans `ptsEcran`), et se ferme à la vérification (`vfl-ferme`). Celle
d'une ligne fausse s'ouvre (`vfl-montre`), quoi que l'élève ait choisi : une
fausse crue vraie reçoit sa correction en vert, comme une case vide. Barème
de la séance = 6 × 3 + le nombre de lignes fausses (`vflBareme`).

**La correction se juge sur la valeur** (`redLit`, `redMeme` du 7.5) : réduite
et égale au membre de gauche. « 2 − x » vaut « −x + 2 », « 12 + 3x » vaut
« 3x + 12 » ; « 3x + 2x » est juste mais pas réduite, et le message le dit.
« x^2 » s'écrit x² à la frappe (`dvlExposant`).

**Le pourquoi** (`vflPourquoi`), sur la première vraie faute : la règle de
la famille (« x RESTE x. Le carré vient d'un PRODUIT », « un moins devant une
parenthèse change le signe de TOUS les termes »…) ; pour une vraie jugée
fausse, « l'élève n'a pas fait d'erreur ici — vérifie en remplaçant x par
2 ». Sous chaque ligne, une fois la page corrigée : « Faux : 2x + 3x = 5x, et
non 5x². » ou « Vrai : … ».

**Ce qui a été décidé sans demander** : les cinq familles ajoutées aux trois
de la demande, six lignes par page, la case de correction présente sur
TOUTES les lignes, et l'acceptation de toute écriture réduite de même
valeur.

**Le juge** (`tests/verifier.js`, `vraiFauxCalcul`) ne lit pas les familles :
il évalue le TEXTE affiché de chaque membre en quatre valeurs de x. Sur 300
séances : trois pages, six familles distinctes par page, de 1 à 3 vraies (et
chacun des trois comptes sort), le verdict de la page égal à celui du calcul,
la correction égale au membre de gauche et réduite, aucune égalité posée
deux fois, les huit familles tirées. Puis les trois exemples de Turquet au
bouton (avec 2x × 3x = 6x², −3x − 2x = −5x vraies et 2x + 5 + 3x = 10x
fausse) : les écritures affichées, la copie juste (10/10) et d'autres
écritures justes, l'erreur crue vraie (rouge, correction en vert, message
qui nomme les exposants), l'erreur recopiée, la correction non réduite, la
vraie jugée fausse (sa case de correction jamais peinte), la case vide, la
copie vide sans rouge, « 6x^2 » → « 6x² », le JSON, le soutien, le contexte
du modèle.

Deux défauts trouvés par le juge à sa première exécution : 2x × 2x avec
l'erreur « coefficients ajoutés » donnait 4x², qui est JUSTE (2 + 2 = 2 × 2 —
les deux coefficients d'un produit sont désormais différents) ; et une même
égalité revenait d'une page à l'autre (la clé de `distinctes()` lit la page
entière : `vflGen` écarte maintenant tout membre de gauche déjà posé dans la
séance). Deux sabotages éprouvent le contrôle : une correction non réduite
acceptée (« une correction juste non réduite : … Le reste est juste ! ») et
l'erreur du moins remplacée par la bonne réponse (« −(2x − 7) = −2x + 7 : la
page dit faux, le calcul vrai »).
## {valeur-expression} — calculer une expression pour une valeur (7.13, v543 — le 7.12 et la v541 pris le même jour par {vrai-faux-calcul}, la v542 par le 8.2.14 et le calcul global)

**La demande** (Turquet, octobre 2026) : « créer un exercice dans calcul
littéral sur calculer une expression pour une valeur, par exemple
3x² − 2x + 1 pour x = −2 — c'est le réinvestissement direct de 7.1 à 7.4,
avec le piège (−2)² contre −2² ».

**Une page = une valeur de x = trois blocs = huit cases.** x est toujours
NÉGATIF (−2 à −5) : c'est là que vivent le piège et la règle des signes.
① Le piège, face à face, sans expression autour : (−k)² puis −k². ② A =
ax² + bx + c (a de 2 à 5, b de ±2 à ±7, c de ±1 à ±9, jamais nul) : la
valeur de ax², celle de bx, puis A, sur une ligne qui écrit la substitution
entière (« A = 3 × (−2)² − 2 × (−2) + 1 = »). ③ B = −x² + b′x + c′ : le
même piège, cette fois DANS une expression (−x² = −(−2)² = −4), puis b′x,
puis B. Chaque case est un geste des 7.1 à 7.4 : le carré (produit de deux
relatifs égaux), les produits (règle des signes), la somme (signe du plus
fort). Trois pages par `distinctes(dmNbQuestions(3), …)`, barème 24 ; la
séance s'allonge depuis un devoir. Le bouton des tables reste : on y
multiplie.

**La page écrit la substitution, l'élève écrit les valeurs.** Une case de
saisie libre pour « 3 × (−2)² − 2 × (−2) + 1 » demanderait un juge
d'écriture ; c'est l'en-tête de chaque ligne qui montre la valeur remplacée
AVEC ses parenthèses — le modèle à imiter —, et les cases ne prennent que des
entiers, lus par `relLit` comme au 7.1.

**On range les nombres, jamais les réponses** : `{k, a, b, c, b2, c2}` ;
`cvlCases` recalcule chaque attendu dans la fonction qui corrige (son nom
suit la convention que lit le barème d'un devoir).

**Le message part de la première case fausse et nomme le piège** : −2² = 4
(« il n'y a pas de parenthèses : le carré ne porte que sur 2 ») ;
(−2)² = −4 (« la parenthèse met le signe AU CARRÉ ») ; −x² = 4 (« le − de
−x² n'est pas au carré — c'est le piège du premier bloc ») ; 3x² = 36
(« le carré ne porte que sur (−2) ») ; x² lu comme 2x ; le signe du plus
fort pris pour un produit ; la somme des termes, réécrite valeur par valeur.

**Le juge** (`tests/verifier.js`, « calculer une expression pour une
valeur ») : la place (7.13, les 7.4, 7.11 et 7.12 immobiles, bouton des tables
présent), 500 séances tirées (bornes de chaque nombre, trois pages
distinctes, huit attendus contre `Math.pow`), puis la fiche témoin au
bouton — x = −2, A = 3x² − 2x + 1, B = −x² + 5x − 3 — avec la copie juste
écrite à la main (4, −4, 12, +4, 17, −4, −10, −17), le texte de l'écran
(chaque substitution, avec ses parenthèses), les cinq pièges (rouges, leur
voisine juste reste bleue, le message les nomme), deux cases vides (la
correction, jamais rouge), une réponse illisible, le barème de 24.

## {developper-reduire} — développer puis réduire une somme de produits (7.14, v545 — le 7.12 et le 7.13, les v541 à v544 pris le même jour par {vrai-faux-calcul}, {valeur-expression}, le 8.2.14, le calcul global et le 6.3)

**La demande** (Turquet, octobre 2026) : « créer un exercice dans calcul
littéral sur Développer puis réduire une somme de produits. Par exemple
(x + 2)(x − 3) − 2x(x + 1) : on enchaîne 7.11 et 7.5 dans la même rangée
d'égalités. » Kind `dvr`, écran `scr-dvr`.

**UNE rangée d'égalités** : `A = (x + 2)(x − 3) − 2x(x + 1) = [6 cases] =
[3 cases]`. Le premier « = » annonce les six termes du développement (quatre
de la double distributivité, deux de la simple — le signe devant le produit
compris), le second les trois termes de la forme réduite (x², x, nombre).
Chaque « = » passe par `fEq` avec SES cases (`.dvr-termes`, insécable) : sur
un écran étroit la rangée se replie avant un « = », jamais entre le signe et
ses cases. La forme intermédiaire du 7.11 (les produits « a × c ») n'y est
pas : six produits de plus auraient fait trois lignes, et la demande voulait
une rangée.

**Quatre pages, quatre formes** (`dvrGen`) : (x ± b)(x ± d) − kx(x ± f) — la
forme de l'exemple —, (ax ± b)(cx ± d) + kx(ex ± f), (ax ± b)(cx ± d) − k(ex ± f),
et kx(ex ± f) − (x ± b)(cx ± d), où le « − » change le signe des QUATRE termes.
Aucun terme de la forme réduite ne s'annule (le tirage recommence) : toujours
neuf cases, barème 36. La première page montre l'exemple de la demande, rempli :
… = x² − 3x + 2x − 6 − 2x² − 2x = −x² − 3x − 6.

**Les termes développés se lisent dans N'IMPORTE QUEL ORDRE** (`dvrJuger`) :
rien ne les ordonne dans la rangée, et x² + 2x − 3x − 6 est aussi juste que
x² − 3x + 2x − 6. Chaque case remplie prend un terme attendu encore libre de
même valeur ; les cases fausses ou vides reçoivent, en correction, les termes
restés libres. La forme réduite, elle, s'ordonne (x², x, nombre) : écrite
dans le désordre, elle est fausse. Le terme qui en suit un autre garde son
signe, comme au 7.9 ; la lecture d'un terme (`dvlLit`), la correction d'une
case (`dvlCorr`) et « x^2 » → x² à la frappe (`dvlExposant`) sont ceux du 7.9.

**Le message** part de la première case fausse : le signe oublié (« il garde
son signe, +5x »), le « − » devant un produit appliqué au premier terme
seulement (« Le signe « − » devant 3x(x − 2) change le signe de CHACUN de ses
termes : − 3x(x − 2) = −3x² + 6x »), un produit mal développé (chaque produit
développé), une réduction fausse (« On regroupe les termes en x : −2x + 3x −
8x = −7x »).

**Le juge** (`tests/verifier.js`, « développer puis réduire une somme de
produits ») : la place (7.14, les 7.11 à 7.13 immobiles), 400 pages tirées jugées par
une SECONDE méthode — la valeur de l'expression, du développement et de la
forme réduite en x = −2, 1 et 3 —, six termes, trois termes réduits non nuls ;
puis quatre pages écrites à la main, au bouton : une seule rangée, deux
groupes « = » de 6 puis 3 cases, l'expression affichée, la copie juste
(9/9, « x**2 » et « x^2 » compris) ; l'exemple sur la première page seulement,
sans case ; les termes dans un autre ordre (justes) ; le « − » oublié sur le
second terme (rouge seul, message nommé, correction +6x) ; « 5x » sans son
signe ; la réduction fausse ; la forme réduite dans le désordre ; deux cases
vides (la correction, jamais rouge).

## {developper-signe-moins} — le signe − devant une parenthèse (7.15, v551)

**La demande** (Turquet, octobre 2026) : « en seconde faire un exercice avec
le signe − devant une parenthèse comme le 7.9 ». Le schéma est celui du 7.9
— bulles, flèches, accolades — et ce qu'il donne à voir, c'est que le « − »
devant la parenthèse est un FACTEUR : −(a + b) = (−1) × a + (−1) × b. Sur la
première ligne, le « − » lui-même est entouré en rouge et les deux flèches en
partent (aucun « × » ne le suit) ; sur la deuxième, l'élève écrit −1 dans les
bulles rouges. « − » seul dans une bulle rouge est faux, et le message le
nomme (« dans la bulle rouge, on écrit −1 ») : c'est tout l'exercice.

**Six pages, une forme chacune** : −(x + b), −(ax − b), −(−ax + b),
c − (ax + b), ax − (bx − c), k × (ax − b) − (a′x − b′). Seuls les nombres
sont tirés ; une famille par page, comme le 7.9 (`dvmBuildQuestions`, pas de
`distinctes()`). Les trois dernières se réduisent, et rien ne s'y annule : le
tirage recommence si c = b (D), si a = b (E), si ka = a′ ou kb = b′ (F). La
première page montre l'exemple rempli, −(x + 4) = −x − 4 ; la page A ne tire
jamais b = 4.

**Le terme écrit DEVANT la parenthèse est donné** (`q.seul`, D et E) : il se
recopie sur chaque ligne, dans sa propre colonne de la grille, suivi d'un « + »
sur la ligne des produits (7 − (3x + 2) = 7 + (−1) × 3x + (−1) × (+2)) — il
ne compte aucune case. Avec lui, le premier résultat suit déjà un terme : il
garde son signe, comme le second.

**Le moteur est celui du 7.9** : `dvlLit`, `dvlJuste`, `dvlCorr`,
`dvlExposant`, `dvlTrace` et `dvlSuivre`, sans y toucher. Seuls le calcul des
lignes (`dvmLignes`) et la mise en page (`dvmSchema`) sont propres : un terme
seul n'est pas un produit, et `dvlLignes` n'avait pas à l'apprendre. L'écouteur
`resize` du 7.9 retrace aussi `#scr-dvm`.

**Le pourquoi** de la première case fausse : le −1 caché (bulle rouge), la
flèche suivie (bulle bleue ou verte), le produit — « multiplier par −1 change
le signe du terme ; chaque terme de la parenthèse change de signe, le second
aussi », l'erreur type −(2x − 5) = −2x − 5 —, le signe oublié, ou la
réduction.

**Le juge** (`tests/verifier.js`, « le signe − devant une parenthèse ») : la
place (7.15, les 7.9 à 7.14 immobiles, bouton des tables présent), 300 tirages
(les six formes dans l'ordre, les bornes, rien qui s'annule), puis six pages
au bouton — −(x + 3), −(2x − 5), −(−3x + 4), 9 − (2x + 5), 7x − (3x − 2),
3 × (2x − 1) − (4x − 5) —, réponses écrites À LA MAIN : la copie juste de
chaque page (6, 6, 6, 8, 8 et 14 cases), flèches et accolades déclarées, la
bulle rouge de l'énoncé qui porte « − » sans « × », le terme de devant écrit
trois fois ; l'exemple sur la première page seulement, sans case ; puis les
pièges : « − » seul dans la bulle rouge (rouge seul, message du −1), −5 pour
(−1) × (−5) (message du signe qui change), −3x pour (−1) × (−3x), « 5 » sans
son signe, 10x pour 7x − 3x, « 9-5 » non réduit, deux cases vides (la
correction +5 et −1, jamais rouge), le barème de 48 ; enfin le 7.9 relancé
garde ses bulles chiffrées.

## {developper-signe-moins-nu} — le signe − devant une parenthèse, sans les flèches (7.16, v559)

**La demande** (Turquet, octobre 2026) : « en seconde fais le même exercice
sans les flèches et sans les cercles qui entourent les nombres, sans les
accolades, et sans l'étape avec des multiplications ». C'est le 7.15 sans
son échafaudage : les mêmes six pages, le même tirage, le même juge ; l'élève
écrit directement le développement terme par terme (le terme de devant,
donné, recopié en tête), puis la forme réduite. Vingt cases : 2, 2, 2, 4, 4
et 6.

**Un moteur, deux identités**, comme le 7.11 pour le 7.10 : `dvmP()` lit le
préfixe sur `test.kind` (« dvm » ou « dvs »), `dvmCases` saute les cases de
facteur en « dvs », `dvsSchema` écrit l'expression en clair et une case par
terme, sans `<svg>` ni `data-fl` / `data-acc` ; `dvlSuivre` n'est pas appelé.
`startDvm('dvs')` pose `kind:'dvs'` et `qId:'developper-signe-moins-nu'`, et
le barème se calcule APRÈS l'`Object.assign` du kind, puisque `dvmCases` le
lit. Le préfixe « dvz » était déjà pris par l'exemple du 7.11 : d'où « dvs ».

**Ce qui parlait du dessin se reformule** : la consigne dit que le signe −
change le signe de chaque terme, sans flèche ni bulle ; le pourquoi d'un
terme faux reste « (−1) × (−5) = 5 : multiplier par −1 change le signe du
terme », qui ne nomme aucun dessin.

**Le juge** (`tests/verifier.js`, « le signe − devant une parenthèse sans les
flèches ») : la place (7.16, le 7.15 immobile), l'identité (kind, qId, écran,
barème de 20), puis les six pages du 7.15 au bouton avec des réponses écrites
à la main — la copie juste de chaque page, AUCUN dessin ni case de facteur,
une consigne sans « flèche », « bulle » ni « accolade » ; l'exemple sans case ;
les pièges : −5 pour −(−5) (rouge seul, message du signe qui change), « 5 »
sans son signe, 10x pour 7x − 3x, une case vide (la correction +5) ; enfin le
7.15 relancé garde ses bulles, ses cases de facteur et son barème de 48.
