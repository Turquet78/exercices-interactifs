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

## {calcul-itere} — alterner somme et produit (7.4, v205)

**La demande** (Turquet, septembre 2026) : un nouvel exercice « dans le thème
calcul itéré », avec des nombres à un chiffre, jamais zéro, en alternant somme
et produit. Aucun thème ne portait ce nom : le premier jet a créé un thème 8
« Calcul itéré ». Puis `main` a renommé le thème 7 « Calcul littéral » le même
jour — c'était lui que la demande désignait (une dictée qui entend « itéré »
pour « littéral »). L'exercice y a pris la place 7.3, après les deux exercices
des relatifs, puis 7.4 quand {multiplier-relatifs} a été publié avant lui ; aucun thème 8 n'a été publié. Quand un nom de thème demandé
n'existe pas, on relit d'abord `main` : il a pu changer depuis que la branche
est partie.

**Une page = une chaîne** : un nombre de départ (1 à 9), puis quatre étapes
qui alternent « + chiffre » et « × chiffre ». Chaque ligne s'écrit comme une
égalité, « 7 × 5 = [  ] », où le 7 est le résultat de la ligne d'avant,
RECOPIÉ en tête de ligne dès que l'élève l'écrit (`citEcho`). Cinq pages,
quatre cases chacune, barème 20. La première page commence par une somme, la
deuxième par un produit, les suivantes tirent au sort. Pas de « × 1 » : il ne
demande aucun calcul (les sommes, elles, gardent le 1). Les pages passent par
`distinctes()`.

**Une erreur ne se paie qu'une fois.** Chaque ligne est jugée à partir du
nombre que l'élève a écrit à la ligne d'avant — celui qu'il voit recopié en
tête. Si cette case est vide ou illisible, on repart de ce que la correction y
écrit (`att`, pas la valeur juste : sans quoi la ligne suivante afficherait un
nombre et serait jugée sur un autre dès qu'une case plus haute est fausse).
Sans cette règle, 3 + 4 = 8 rougirait les quatre cases.

**On range les chiffres, jamais les réponses** : `citAttendus()` recalcule la
chaîne dans la fonction qui corrige. Les réponses s'écrivent en chiffres, les
espaces ne comptent pas (« 1 539 ») ; « 7, » est faux, pas vide. Les cases sont
`inputmode="numeric"`. Le bouton des tables reste proposé : on y multiplie.

**Le message** nomme la première ligne fausse, avec son calcul, et reconnaît
le piège de l'alternance : « Tu as ADDITIONNÉ : cette ligne est un PRODUIT »
(ou l'inverse).

**Le juge** (`tests/verifier.js`, « calcul itéré ») : la place (7.4, les
relatifs restent 7.1, 7.2 et 7.3, bouton des tables présent), 500 séances tirées (cinq
pages, départ et chiffres dans 1…9, jamais × 1, alternance tenue, les deux
premières pages dans l'ordre somme puis produit, les deux départs au-delà),
la chaîne recalculée par une boucle écrite à part, puis le bouton : la copie
juste (4/4, « 2 22 » accepté), l'écho de la ligne 1 en tête de la ligne 2,
l'erreur qui ne se paie qu'une fois (3 + 4 = 8, puis 40, 42, 252 : une seule
case rouge), le piège de l'alternance (7 + 5 au lieu de 7 × 5 : rouge, et le
message le dit), une case vide (correction verte « 35 », voisines justes
bleues), une réponse illisible (rouge).
Éprouvé par sabotage : une alternance rompue (`citEstProduit` qui ne regarde
plus le rang) rougit le juge en nommant l'étape et la chaîne fausse.

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

## {associer-expressions} — associer chaque expression à son résultat (7.5, v206)

Demandé par Turquet en septembre 2026, d'après deux fiches papier : la
première avec le nombre 3 (3², 2 × 3, 3/3, 3 − 3 à associer à 0 ; 3 + 3 ; 1 ;
3 × 3), la seconde avec la lettre x, « un nombre différent de 0 ». La consigne :
**trois pages comme la première fiche, puis la seconde, une seule fois**. La
séance a donc quatre pages de quatre listes — barème 16.

Écrit d'abord comme un thème 8 neuf — le thème 7 s'appelait encore « Rappels »
sur la branche —, il a rejoint le thème 7 à la fusion de `main`, qui venait de
le renommer « Calcul littéral » : c'est là que Turquet l'avait demandé. Il
devait y être le 7.3 ; le produit de relatifs (7.3) puis le calcul itéré (7.4)
sont arrivés sur `main` pendant que ses bancs tournaient, et l'association est
passée 7.5 à la troisième fusion — chaque fois avec un `APP_VERSION` de plus. Préfixe
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
