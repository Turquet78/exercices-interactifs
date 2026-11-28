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
## {ln-resoudre-exp} (9.3.1, v539) : résoudre e^(…) − k = 0 avec ln

Demande de Turquet (novembre 2026), avec la fiche « Résoudre e^x − 2 = 0 sur
ℝ ; e^(x−3) − 2 = 0 ; e^(−2x) − 3 = 0 » : « créer un exercice dans ln, comme
le pdf ; on fera comme dans le 9.2.1, un mode avec étapes ou sans étape ; pour
le mode sans étape on acceptera toutes les équations équivalentes, et on
pourra sauter des étapes ». Nouvelle partie 3 « Équations » du thème 9.

**Quatre familles** (`lnxGenFam`), la séance de six questions dans l'ordre
x, xb, ax, xb, ax, axb, par `distinctes()` — k ∈ {2, …, 8, 10} :

| famille | équation | étapes de la fiche | solution |
|---|---|---|---|
| `x` | e^x − k = 0 | e^x = □, ln(e^x) = ln(□) | x = ln k |
| `xb` | e^(x−c) − k = 0 | … puis x − c = ln(□) | x = c + ln k |
| `ax` | e^(ax) − k = 0 | … puis ax = ln(□) | x = ln k / a |
| `axb` | e^(ax+b) − k = 0 | … puis ax + b = ln(□), ax = ln(□) ∓ □ | x = (ln k − b)/a |

La fiche écrit « e^x = …… » sous e^(x−3) − 2 = 0 : une coquille, la page écrit
e^(x−3) = □. La quatrième famille n'est pas sur la fiche : c'est la suite
naturelle des trois exemples, une seule question par séance.

**Deux façons, comme au 9.2.1** (`test.lnxMode`, gardé pour la séance et la
pause) : « Avec les étapes » — des cases de nombres (le k, le b de la
dernière ligne sans son signe, que la page écrit), puis x = [case MathLive] ;
« Sans étape » — la feuille `mlFeuille`, chaque ligne préfixée de ⟺, les
lignes voyageant dans `test.lnxLignes`.

**Le juge des équations** (`lnxJugerLigne`, `lnxEquivalente`) : une ligne
« A = B » (ou « A = B ⟺ C = D ») est lue par `lndLire` — qui lit désormais la
lettre x, sans rien changer au 9.2.1 où elle donne NaN, donc faux — et elle
est acceptée si elle est ÉQUIVALENTE à l'équation de départ : la solution x₀
la vérifie, g = A − B n'est pas identiquement nul, et le balayage de
[−15 ; 15] (pas de 0,025) ne trouve aucune autre annulation — une valeur
nulle loin de x₀, ou un changement de signe qu'une dichotomie confirme
(un saut d'asymptote ne compte pas). « (x − 3)² = (ln 2)² » est rejetée (deux
solutions), « 0 = 0 » aussi, « 2x = 6 + 2 ln 2 » acceptée. La ligne est FINIE
quand elle s'écrit x = valeur EXACTE : un membre « x » seul, l'autre sans x ni
e et avec un ln ; « x = 3,69 » est rejeté, « x = ln(2e³) » est juste mais pas
fini. La case finale des étapes (`lnxJugerFinal`) suit la même règle ; une
valeur approchée à 0,01 près y reçoit en soutien « donne la valeur exacte ».

**Essayé dans Chromium** : une copie faite des corrections est parfaite aux six
questions (3, 4, 4, 4, 4, 6 cases) ; une copie à une case juste, une fausse et
les autres vides reçoit le bleu, le rouge avec sa correction à côté, et les
corrections vertes ; en soutien « sans étape », des frappes réelles
(e^x = 10, Entrée, x = ln 10) se peignent en bleu à la sortie de la feuille, et
« Vérifier » rend « Bravo ! » ; une ligne « x = 2 » rougit seule. Un défaut vu
à la première capture : « −2 x » s'écrivait avec un blanc — chaque morceau de
texte de la ligne était un élément flex séparé ; ils sont regroupés
(`.lnx-t`).
