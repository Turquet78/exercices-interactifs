# Seconde — le thème du Calcul itéré

## {calcul-itere} — alterner somme et produit (8.1, v203)

**La demande** (Turquet, septembre 2026) : un nouvel exercice « dans le thème
calcul itéré », avec des nombres à un chiffre, jamais zéro, en alternant somme
et produit. Le thème n'existait pas : il est créé EN DERNIER (thème 8), et ne
renumérote donc rien. Le contrôle des relatifs exigeait que les numéros de
thèmes soient exactement « 1 à 7 » : il vérifie désormais que les SEPT
PREMIERS ne bougent pas — la leçon du thème 7, appliquée d'avance.

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

**Le juge** (`tests/verifier.js`, « calcul itéré ») : la place (8.1, les
relatifs restent 7.1, bouton des tables présent), 500 séances tirées (cinq
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
