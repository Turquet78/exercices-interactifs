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

## {calcul-itere} — alterner somme et produit (7.3, v204)

**La demande** (Turquet, septembre 2026) : un nouvel exercice « dans le thème
calcul itéré », avec des nombres à un chiffre, jamais zéro, en alternant somme
et produit. Aucun thème ne portait ce nom : le premier jet a créé un thème 8
« Calcul itéré ». Puis `main` a renommé le thème 7 « Calcul littéral » le même
jour — c'était lui que la demande désignait (une dictée qui entend « itéré »
pour « littéral »). L'exercice y a pris la place 7.3, après les deux exercices
des relatifs ; aucun thème 8 n'a été publié. Quand un nom de thème demandé
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

**Le juge** (`tests/verifier.js`, « calcul itéré ») : la place (7.3, les
relatifs restent 7.1 et 7.2, bouton des tables présent), 500 séances tirées (cinq
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
