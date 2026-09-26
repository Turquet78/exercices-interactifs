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
— au lieu de réécrire un lecteur d'expression à part. La case du coefficient
entier (phase détaillée) se lit par `citLit()` : un entier positif, sans
signe, sans espace.

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
rouge), une écriture illisible rouge, le barème de 60 (45 + 15).
