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

## {ln-demontrer-egalite} (9.2.1, v536) : démontrer une égalité avec ln

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
