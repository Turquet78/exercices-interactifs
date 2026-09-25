# Seconde — le thème des Rappels

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

## {multiplier-relatifs} — multiplier deux relatifs, la règle des signes (7.2, v203)

**La demande** (Turquet, septembre 2026) : la fiche papier suivante, dans le
même thème, avec des nombres à un chiffre, jamais zéro, et un bouton pour les
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
d'abord la place de l'exercice : 7.2 juste après le 7.1, avec le bouton des
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
