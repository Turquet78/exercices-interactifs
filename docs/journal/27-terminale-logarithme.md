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

## {ln-etude-carre} (9.1.2, v539) : l'étude de ax(ln x)²

Demande de Turquet (novembre 2026) : « faire le même exercice que le 9.1.1
avec une fonction de la forme f(x) = (ax + b) ln(x)² ; les abscisses des
extremums doivent être entières ou de la forme ln e avec e entier » — lu
comme e^k, k entier.

**La condition fixe b = 0.** f′(x) = ln x × (ax ln x + 2ax + 2b)/x : x = 1
annule toujours ln x ; la seconde racine x = e^k demande
a e^k (k + 2) + 2b = 0, soit b = −a e^k (k + 2)/2 — entier seulement pour
k = −2, b = 0 ; une racine entière n ≥ 2 voudrait ln n rationnel. Reste
f(x) = ax(ln x)², f′(x) = a ln x (ln x + 2), extremums en e⁻² (valeur
4a e⁻²) et en 1 (valeur 0). |a| de 2 à 4 (la ligne « signe de a » du
tableau ne lit jamais « signe de 1 ») ; la séance pose a > 0 et a < 0, en
ordre mélangé.

**Trois parties, celles du 9.1.1 :**

* 1 — la dérivée d'un produit comme au 4.1.1 : u et v posés par la page,
  u′(x) = □, (w²)′ = 2 × w′ × w écrite, v′(x) = 2 × □ × □ (1/x et ln x,
  dans l'ordre que l'on veut, la paire jugée d'abord en entier),
  f′(x) = □ × □ + □ × □ (la ligne jugée en entier, sinon par paires libres,
  les deux produits échangeables), « = □ ← simplifie par x » (la valeur de
  f′, sans fraction), « = ln(x) × (□) », « = □ ln(x)(ln(x) + □) ».
* 2 — le tableau du 4.4.2 : signe de a, de ln x, de ln x + 2, de f′ ; les
  deux racines et les deux abscisses de la synthèse sont des champs
  MathLive (la chaîne de efTableHTML/efSyntHTML, ses `<input>` remplacés au
  rendu), jugés comme des nombres : e^{−2}, 1/e², \exponentialE^{−2}.
* 3 — f(x) rappelée au-dessus de f(e⁻²), les flèches des deux x vers leurs
  cases (le schéma et `lnfTrace` du 9.1.1, partagés), puis ln(e⁻²) = □,
  f(e⁻²) = a × e⁻² × (□)² = □ e⁻², f(1) = □.

**Le juge lit ln.** `compileExprExp` ne le lisait pas : `compileExprLn`
écrit « ln » en un jeton « £ » que l'analyseur commun `exprLire` lit
désormais (ln(…), ln x, ln^2 x), et « e » seul en constante.
`compileExprExp` refuse toujours « £ » : son alphabet n'a pas changé. Les
comparaisons se font sur des x positifs (`LNQ_PTS`), jamais sur les points
négatifs de `cmpFns`.

**Essayé dans Chromium** : une copie juste — e écrit \exponentialE, 1/e²,
ln x sans parenthèses, les facteurs dans l'autre ordre — est parfaite, aux
deux visages ; une copie d'une seule case fausse reçoit ses corrections en
vert et sa case fausse en rouge, la correction à côté. Les hôtes du tableau
partagé (ids ef-*) se vident désormais à sept.

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

### Puis les parenthèses ont encadré les cases, et la même case en dessous s'est remplie seule (v538)

Demande de Turquet (novembre 2026) : « faire en sorte que les parenthèses
encadrent mieux les cases verticalement ; quand une case est remplie et que
c'est la même pour la suite, la remplir automatiquement ».

* **Les parenthèses** qui touchent une case (`ln( [ ] )`, `( [ ] )`) sont
  des `span.lnd-par` à 1,75 em, posés par `lndParens` sur le texte des
  étapes : elles couvrent la hauteur de la case au lieu de s'arrêter à
  mi-hauteur.
* **Les miroirs** (`A.miroirs`, clé `m` dans `lndAns`) : une case qui reprend
  INCHANGÉ un terme d'une ligne du dessus est un `<input readonly
  class="dq-mirror">` recopié à chaque frappe (`lndMiroirs`), hors note et
  hors de `#confirmer-vides`, comme à la Seconde (le 9.x des équations).
  Après la vérification, un miroir suit la couleur de sa source juste, et
  prend la correction verte si la source est fausse ou vide. Seul le modèle
  en a : « p ln 2 + ln(2) + ln(5) » des lignes 3 et 4 recopie la ligne 2, et
  l'exposant k de « ln 2^k » recopie celui de « ln(5 × 2^k) ». Une case dont
  la ligne APPLIQUE une propriété (ln 2³ → 3 ln 2, ln e^p → p) n'est jamais
  un miroir : ce passage est ce que l'élève apprend. Le modèle passe de
  17 cases notées à 10, plus la forme finale.
