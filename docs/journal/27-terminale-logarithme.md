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

### Puis la dérivée comme la fiche « ln dérivée » (v536)

Demande de Turquet (novembre 2026), avec la fiche « 2/(2x + 1) − 3 =
2/(2x + 1) − 3×(…)/1×(…) = ……/(2x + 1) = ……/(2x + 1) » : « demande la dérivée
d'abord de ln(ax + b), en écrivant la formule (ln u)′ avant ; puis mettre
directement f′(x) = …/… ; puis demander de dériver cx + d ; et ensuite demander
f′(x) et terminer le calcul comme sur le pdf joint ; on précisera si on souhaite
que la case soit un développement ou une réduction ; mettre en rouge quand les
cases sont fausses et en bleu sinon ».

La partie 1 n'a plus « On pose u, u′ » ni la ligne (a + c × (…))/(…) :
(ln u)′ = u′/u est écrite par la page, puis (ln(ax + b))′ = □/□, (cx + d)′ = □,
f′(x) = □/□ □ (le nombre avec son signe), puis la ligne de la fiche, écrite par
la page sauf les deux parenthèses — a/(ax + b) ∓ 1 × (□)/1 × (□) —, puis
= □/(ax + b) « ← développe le numérateur » et = □/(ax + b) « ← réduis le
numérateur ».

**Chaque case se juge SEULE** (`lnfDerVerdicts`) : plus de ligne jugée en bloc,
qui pouvait peindre en bleu une case fausse prise seule. Une fraction se juge
d'abord en entier (1/(x − 3) comme −1/(−x + 3)), sinon numérateur et
dénominateur chacun contre le sien. Le numérateur DÉVELOPPÉ doit valoir
−x + xs et s'écrire sans parenthèse ni produit (`lnfSansParenthese`) ; le
RÉDUIT, en plus, n'a qu'un terme en x et une constante (`lnfReduite`) :
« 1 − x + 3 » est juste dans la première case, faux dans la seconde.

Essayé dans Chromium : la copie faite des corrections est parfaite (28 cases sur
28) ; en soutien, des frappes réelles — 1 et x − 2 dans la fraction, −1, +1,
« 1 − x + 3 » dans les deux numérateurs — se peignent à la sortie de chaque case :
bleu, rouge, bleu, rouge, bleu, rouge.

### Puis f(x) rappelée au-dessus du maximum, des flèches des x vers les cases (v537)

Demande de Turquet (novembre 2026) : « dans la question 3, rappeler
l'expression de f(x) en présentant comme dans l'exercice de 1ère 1.10 avec des
flèches qui partent précisément des x pour arriver précisément sur les cases
correspondantes ». Le 1.10 de la Première est l'écriture décimale d'une somme,
sans flèches ; la présentation décrite est celle du 6.6 {image-second-degre}
(isdSchema, isdTrace) : c'est elle qui est reprise.

La première ligne de la question 3 devient une grille de huit colonnes
(`.lnf-grille`) : f(x) = ln( [signe] x [+ b )] [signe] x [+ d] au-dessus de
M = f(□) = ln( [signe] □ [+ b )] [signe] □ [+ d]. Chaque x est dans la MÊME
colonne que sa case, son signe dans la colonne d'avant : la flèche tombe
droite. Un SVG posé par-dessus (`lnfTrace`) tire chaque flèche du bas du x
(`#lnf-x1`, `#lnf-x2`) au haut de sa case (`lnf-d2`, `lnf-d3`), sur les
positions RENDUES ; il se retrace au rendu, aux polices chargées, au
redimensionnement (`ResizeObserver`, `resize`). Mesuré dans Chromium : centre
du x et centre de la case au même pixel, a = 1 et a = −1, à 1100 px comme à
390 px.
