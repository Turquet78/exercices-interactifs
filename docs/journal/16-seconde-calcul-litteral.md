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

## {reduire-somme} — réduire une somme de termes (7.4, v205)

**La demande** (Turquet, septembre 2026) : reprendre une fiche papier
« Réduire si possible » dans le thème « écriture littérale ». La fiche
prend UNE paire de nombres (2 et 3) et la décline sur dix expressions de deux
termes : 2x + 3x, 2x + 3, 2x − 3x, 2x − 3, −2x − 3x, −2x + 3x, −2x² + 3x²,
−2x² + 3x, −2x² + 3, −2x² − 3x². En tête, une phrase à compléter : « On ne
peut additionner que des termes … » — de même nature.

**La demande parlait du thème « écriture littérale »** : c'est le thème 7,
renommé « Calcul littéral » le même jour ({additionner-relatifs} et
{nombres-relatifs}). L'exercice s'y range en 7.4, après {multiplier-relatifs} (7.3, arrivé sur `main` le même après-midi) — un thème 8 « Écriture
littérale » à côté aurait fait deux thèmes pour une même idée. Il arrive en
dernier dans le thème : rien n'est renuméroté.

**Une page = une question = onze cases** : la liste de la règle (« de même
signe » / « de même nature » / « qui ont le même coefficient »), puis une case
par expression. Trois pages, barème 33. Les deux nombres d'une page vont de 2
à 9 et sont DIFFÉRENTS : avec a = b, −ax + ax vaut 0 ; avec 1, l'énoncé
écrirait « 1x ». La première page suit l'ordre de la fiche ; les suivantes
mélangent les lignes (`q.ordre`, hors de la clé de `distinctes()`), sans quoi
les quatre lignes qui ne se réduisent pas se reconnaîtraient à leur rang.

**Une expression qui ne se réduit pas se RECOPIE**, et c'est tout le piège de
la fiche : 2x + 3 = 5x, −2x² + 3x = x². La consigne le dit.

**La case lit une somme de termes, pas une chaîne** (`redLit`) : l'ordre des
termes est libre (3 + 2x), x² s'écrit « x² », « x^2 » ou « x2 », le moins
« - » ou « − », « x » vaut 1x et « 1x » est accepté. Une réponse de même
VALEUR mais non réduite (« 2x+3x », « 2x + 0 ») est fausse, et le message le
dit. Un bouton « x² » à côté de chaque case écrit x² au curseur : sur
tablette, ni « ² » ni « ^ » ne se trouvent sans chercher.

**On range les deux nombres et l'ordre, jamais les réponses** : `redLignes()`
recalcule les expressions et leur forme réduite dans la fonction qui corrige.

**Le juge** (`tests/verifier.js`, « réduire une somme de termes ») : la place
(7.4, le 7.1 à 7.3 inchangés, sept thèmes, un badge de mode qui est le sien, pas de bouton des tables), 500 séances
tirées (2 à 9, différents, pages distinctes, la fiche en tête, les lignes
mélangées ensuite), les 56 paires jugées par une SECONDE méthode — la valeur de
l'expression et celle de la réponse attendue, en trois valeurs de x ; une
réponse d'une ligne réductible a un seul terme, celle d'une ligne qui ne se
réduit pas est l'expression elle-même. Puis le bouton : la copie juste (11/11,
avec des ordres et des écritures variés), les pièges (règle « de même signe »,
2x + 3 = 5x, −2x² + 3x = x², 2x − 3x = x : rouges, leurs voisines justes
restent justes, le message dit « de même nature »), une réduction inachevée
rouge, « 1x » juste, deux cases vides (vertes, la correction écrit −x), une
écriture illisible rouge. Éprouvé par sabotage : une case qui accepte une
somme non réduite rougit le juge (« « 2x+3x » pour 2x + 3x est peint en
vert »).
