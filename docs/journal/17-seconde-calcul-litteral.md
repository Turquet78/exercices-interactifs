# Seconde — le thème du Calcul littéral

## 8.1 — Associer chaque expression à son résultat (`associer-expressions`, kind `asx`)

Demandé par Turquet en septembre 2026, d'après deux fiches papier : la
première avec le nombre 3 (3², 2 × 3, 3/3, 3 − 3 à associer à 0 ; 3 + 3 ; 1 ;
3 × 3), la seconde avec la lettre x, « un nombre différent de 0 ». La consigne :
**trois pages comme la première fiche, puis la seconde, une seule fois**. La
séance a donc quatre pages de quatre listes — barème 16.

Nouveau thème 8 « Calcul littéral », ajouté EN DERNIER : rien n'est renuméroté,
le 7.1 reste le 7.1. Le contrôle du 7.1 qui exigeait « les thèmes 1 à 7 » exige
désormais « 1 à 8 ».

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
