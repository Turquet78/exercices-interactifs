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

### Puis f(x) rappelée au-dessus du maximum, des flèches des x vers les cases (v538)

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

## {ln-demontrer-egalite} (9.2.1, v537) : démontrer une égalité avec ln

Demande de Turquet (novembre 2026), avec la fiche « Démontrer que ln 8 +
ln 10 + ln(1/40) = ln 2 » : « créer un exercice avec des exemples comme dans
le pdf ; on proposera à l'élève de le faire avec des étapes données comme
dans l'exemple au début de l'exercice, ou sans étape, et l'élève devra écrire
des égalités dans un champ de saisie jusqu'à la réponse ; on acceptera toute
égalité correcte, l'élève pourra sauter des étapes ». Nouvelle partie 2
« Propriétés algébriques » du thème 9.

**Six familles, une par exemple de la fiche, dans son ordre** — la séance les
pose toutes, une fois chacune, sur des nombres tirés (`lndGenFam`, par
`distinctes()`) :

| famille | forme | la fiche |
|---|---|---|
| `mod` | ln 2^p + ln 10 + ln(1/(5·2^k)) = (p + 1 − k) ln 2, k ≥ 2 | le modèle (p = 3, k = 3) |
| `pui` | ln c^p + ln c^r − ln(c^s) = (p + r − s) ln c, c ∈ {2, 3} | le a) |
| `let` | ln(a^m/b) + ln(b^n/a^k) = (n − 1) ln b + (m − k) ln a | le b) |
| `exp` | ln(e^p) − ln(e^r) = p − r | le c) |
| `rac` | ln(e^p √e) − ln(1/e^t) = p + 1/2 + t | le d) |
| `sqr` | ln(c^p) + ln(√c/c) + ln(1/c^q) = (p − q − 1/2) ln c, c ∈ {2, 3, 5} | le réel a |

k ≥ 2 au modèle : avec k = 1, ln(1/10) annule ln 10 et il ne reste rien à
démontrer — vu à la première capture.

**Deux façons, au choix de l'élève**, par deux boutons en tête de la
question ; le choix (`test.lndMode`) vaut pour la suite de la séance et
voyage dans la pause :

* **Avec les étapes** — la chaîne à trous du modèle de la fiche
  (`lndAns().lignes`) : des cases de nombres (exposants compris, `tx-se`),
  la paire ln(2) + ln(5) dans l'ordre que l'on veut (la paire `grp`, jugée
  dans l'ordre qui donne le plus de cases justes), une case accepte « 1/2 »,
  « 0,5 » ou « ½ » ; puis la forme finale dans une case MathLive.
* **Sans étape** — la feuille commune `mlFeuille` (mode calcul, chaque ligne
  préfixée de « = ») : chaque ligne — chaque membre si l'élève écrit
  « A = B » d'un trait — doit VALOIR l'expression de départ, et la dernière
  doit être écrite sous la forme de l'énoncé. La feuille n'a aucun id :
  ses lignes voyagent dans `test.lndLignes`, comme au 6.11. La feuille
  entière est UNE réponse (`pts-case`) ; les lignes se colorent une à une
  (bleu juste, rouge faux), à la sortie de la feuille en soutien.

**Le juge ne croit aucune écriture.** `lndLire` lit le LaTeX de MathLive en
un arbre (ln, √, \frac — `\frac12` compris —, puissances, e, a, b, la
multiplication sous-entendue ; « ln 2^3 » est ln(2³)), `lndEval` le calcule,
en trois couples (a, b) > 0 pour la famille à lettres. `lndForme` dit si une
écriture est FINIE : un nombre seul (ou un quotient) pour `exp` et `rac` ;
sinon des ln dont chaque argument est un atome de la cible (le nombre
premier, ou a, b), jamais deux fois le même, sans √ ni puissance.
« 2(ln b − ln a) » et « (−ln 3)/2 » sont finies ; « ln 8 », « ln 2 + ln 2 −
ln 2 » et « ln(b²/a²) » sont justes mais pas finies — l'élève qui s'arrête
là lit en soutien « tes égalités sont justes — continue jusqu'à la forme de
l'énoncé ».

**Essayé dans Chromium** : une copie juste des étapes du modèle vaut 18
cases sur 18 ; une copie à une case juste sur 7 reçoit ses corrections
vertes, la fausse rouge avec sa correction à côté ; en « Sans étape », une
ligne fausse rougit seule, la juste bleuit, et la conclusion attendue
s'écrit en vert sous la feuille.

## {ln-resoudre-equation} (9.3.1, v538) : résoudre une équation avec ln

Demande de Turquet (novembre 2026), avec la fiche « Résoudre ln(−x + 2) +
ln(x) = 0 sur ]0 ; 2[ ⟺ ln[(…)×(…)] = 0 ⟺ (…)×(…) = … ⟺ … = … ⟺ … = 0 ⟺
x = … avec Δ = … » et sa « Question 2 : ln x + ln(x − 10) = ln 3 + ln 7 » :
« créer un exercice dans ln, comme le pdf ; les solutions seront entières et
relatives ; on fera comme dans le 9.2.1, un mode avec étapes ou sans étape ;
dans les étapes on écrira si on attend un développement ; pour le mode sans
étape on acceptera toutes les équations équivalentes, et on pourra sauter des
étapes ». Nouvelle partie 3 « Équations » du thème 9.

**La forme** : ln(a₁x + b₁) + ln(a₂x + b₂) = 0, = ln K ou = ln p + ln s, sur
l'intervalle I où les deux ln existent — donné par l'énoncé, comme sur la
fiche. a₁, a₂ = ±1 : le produit est un trinôme de coefficient ±1, ses racines
sont entières dès que Δ est un carré de la bonne parité. `lneCandidats`
énumère toutes les équations dont au moins une racine est dans I, aucune
au-delà de 12 en valeur absolue (b de −6 à 6). La Question 2 de la fiche
elle-même n'en fait pas partie : x² − 10x − 21 = 0 a Δ = 184, ses racines ne
sont pas entières.

| famille | second membre | I | ce qu'elle montre |
|---|---|---|---|
| `zero` | 0 | borné | Δ = 0, racine double — la fiche, ]0 ; 2[ ; avec a = ±1 c'est le SEUL visage possible de « = 0 » (11 équations) |
| `som` | ln p + ln s | non borné | une racine dans I, l'autre écartée — la Question 2 |
| `int` | ln K | borné, Δ > 0 | une ou deux solutions dans I |
| `mix` | ln K ou ln p + ln s | l'un ou l'autre | |

**Avec les étapes** — la chaîne de la fiche, chaque ligne nommant ce qu'elle
attend à droite : ln[(□) × (□)] = ln(□) « ← ln a + ln b = ln(a × b) », puis
(□) × (□) = □ « ← ln A = ln B ⟺ A = B » (ou « ln A = 0 ⟺ A = 1 »), puis
□ = □ « ← **développe** le membre de gauche », □ = 0 « ← passe tout dans le
membre de gauche, puis **réduis** », Δ = □, x₁ = □ et x₂ = □ (x₀ quand Δ = 0),
et S = {□} « ← ne garde que les racines qui sont dans I ». Les facteurs et
les trinômes sont des cases MathLive, les nombres des cases en texte.
Chaque case se juge seule (`lneVerdictsEtapes`) : un facteur vaut u ou v
(la paire dans l'ordre que l'on veut, « 2 − x » pour « −x + 2 ») ; le
DÉVELOPPÉ vaut u × v et n'est qu'une somme de monômes (`lneMonomes` : une
parenthèse qui porte une somme le refuse) ; le RÉDUIT vaut λ(u × v − K), un
terme par degré — λ libre, si bien que « x² − 2x + 1 = 0 » est juste là où
la fiche attend « −x² + 2x − 1 = 0 », et Δ est alors attendu à λ² près.

**Sans étape** — la feuille commune (`mlFeuille`), chaque ligne préfixée de
« ⟺ » (`test.lneLignes` voyage dans la pause, comme au 9.2.1). Une ligne est
juste quand l'équation qu'elle écrit est ÉQUIVALENTE sur I : vraie en chaque
solution, fausse en une grille de points de I écartés des racines (41 points
d'un intervalle borné ; 46 d'une demi-droite, jusqu'à 211 unités du bord).
Les membres sont lus par `lndLire`, celui du 9.2.1, ouvert à d'autres lettres
(`lndLire(lx, 'xe')` ; son défaut reste « abe ») ; « A = B = C » demande que
les trois membres soient égaux. Une ligne peut écrire « … ou … » (union),
« ⟺ » à l'intérieur (chaque morceau jugé), « Δ = … » (le Δ du trinôme, ou
λ²Δ pour λ entier ; un membre en a, b, c est la formule, sauté), « x₁ = … »
(une racine du trinôme, même hors de I), « S = {…} ». La dernière ligne doit
donner les solutions : « x = n », « x = n ou x = m », « S = {…} » — ni plus,
ni moins : « x = −3 ou x = 3 » est juste sur ]2 ; +∞[ (−3 n'y est pas) mais
n'est pas la conclusion.

**Le mot « ou » a son bouton.** Tapé au clavier, il se colle aux lettres
(« −1oux », vu à la première capture) : le bouton « ou » insère
`\text{ ou }` dans la ligne où était le curseur et remet le champ en mode
mathématique — sans ce `mode='math'`, « x = 4 » tapé ensuite s'écrivait dans
le texte. Le juge lit aussi « ou » tapé lettre à lettre.

**Essayé dans Chromium** : une copie juste des étapes vaut 11 cases sur 11
(Δ = 0) ; une copie où seule la case Δ est remplie, fausse, la rougit avec
100 à côté, et les douze autres reçoivent leur correction en vert ; en « Sans
étape », trois lignes tapées au clavier (« −x² + 4x + 5 = 5 », « −x² + 4x
= 0 », « x = 0 ou x = 4 » par le bouton) sont bleues et la question parfaite ;
une ligne « x = 100 » seule rougit, et « S = { … } : x = … » s'écrit en vert
sous la feuille.
