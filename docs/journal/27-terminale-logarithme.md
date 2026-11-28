# Terminale — logarithme népérien (thème 9)

## {ln-etude-fonction} (9.1.1, v535) : l'étude de ln(ax + b) + cx + d

Demande de Turquet (novembre 2026) : « faire un exercice comme le 4.4.2, dans
le nouveau thème logarithme népérien ; il faudra étudier une fonction de la
forme ln(ax + b) + cx + d avec −b/a entier et (−b + 1)/a entier aussi ; on ne
fera que les questions b, c et d ; il y aura un graphique au début ; la dérivée
sera présentée avec toutes les étapes comme dans le 4.1.1 ; le tableau avec la
dérivée doit être complété comme dans le 4.4.2 ; la dérivée sera mise au même
dénominateur avant le tableau de signes ». Nouveau thème 9 « Logarithme
népérien », partie 1 « Étude de fonction ».

**Les deux conditions fixent a et c.** −b/a et (1 − b)/a entiers : leur
différence 1/a l'est aussi, donc a = ±1. f′(x) = a/(ax + b) + c s'annule là où
ax + b = −a/c ; pour qu'elle s'annule en (1 − b)/a — là où ln(ax + b) = 0, ce
que la seconde condition annonce —, il faut c = −a. Alors
f′(x) = (−x + xs)/(ax + b), xs = (1 − b)/a, et le maximum
M = f(xs) = ln 1 − a·xs + d est entier. f est concave : l'extremum est
TOUJOURS un maximum, le tableau toujours « + puis − ». Le tirage porte
(a, b, M) — b de −3 à 3, M dans {−2, −1, 1, 2, 3} —, d = M + a·xs s'en déduit ;
la séance montre les deux visages a = 1 et a = −1, en ordre mélangé, b jamais
le même. La bonne réponse n'est jamais rangée : `lnfAns()` recalcule tout.

**Trois parties, chacune prise à l'exercice qui la traite :**

* 1 — f′ en cases MathLive, la chaîne du 4.1.1 : on pose u(x) et u′(x), la
  formule (ln u)′ = u′/u, la substitution u′/u + c, puis le MÊME
  DÉNOMINATEUR (a + c × (ax + b))/(ax + b), puis la forme réduite (la cible
  révélée, « Démontre que », comme au 4.4.2). Le juge (`lnfDerVerdicts`) lit
  chaque LIGNE entière d'abord — sa valeur est-elle f′ ? —, ce qui accepte
  toute écriture équivalente ; sinon chaque case contre ce qu'elle porte, la
  paire c × (ax + b) dans l'ordre que l'on veut, le facteur 1 omis devant la
  parenthèse d'une ligne juste. Les signes de c s'écrivent DANS la case (aucun
  « + » imprimé devant) : « 1/(x − 3) + −1 » ne se lit pas.
* 2 — le tableau du 4.4.2 (`efTableHTML`, `efSyntHTML`, `efArrowChange`,
  `lnfTab`) : bornes de l'ensemble de définition, racine, signes du
  numérateur, du dénominateur (strictement positif sur I) et de f′, flèches,
  « maximum atteint en x = ». Les ids ef-* sont partagés avec cinq autres
  écrans : les SIX rendus se vident mutuellement (`lnfForm` ajouté aux cinq
  listes), le piège du tableau fantôme.
* 3 — la valeur du maximum, la ligne du d) du 4.4.2 : M = f([ ]) = ln(…[ ]…) …,
  M = ln([ ]) [±…] (le nombre avec son signe, « + » au pavé), ln 1 = [ ], M = [ ].

**Le graphique** (`lnfGraphSVG`) : la courbe tracée depuis f, l'asymptote
verticale en pointillés, la fenêtre élargie jusqu'à l'axe des ordonnées et
calée sur le maximum (de M − 4,5 à M + 1,5, l'axe des abscisses toujours
dedans), quadrillée à l'unité.

**Essayé dans Chromium** : une copie faite des corrections de la page est
parfaite (29 cases sur 29) ; une copie où une seule case est remplie (fausse)
reçoit ses 28 corrections en vert, la fausse en rouge avec sa correction à
côté. Un défaut vu à la première capture : les corrections des cases en texte
de la partie 3 restaient grises — la règle `.tg-in.sol` est propre à chaque
écran (`#scr-lnf .tg-in.sol`).
