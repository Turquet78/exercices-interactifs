# Terminale — géométrie dans l'espace (thème 7)

## {espace-coordonnees} (7.1.1) : coordonnées, milieu, vecteur, longueur

Demande de Turquet (octobre 2026), avec la fiche « vecteur 1 » : « en
terminale, créer un thème espace et un sous-thème vecteurs et droites de
l'espace, et y créer un exercice respectant la présentation du pdf joint ».

**Deux sessions, le même soir, le même thème.** Cet exercice et
{espace-milieu-longueurs} (fiche « vecteur 2 ») sont nés en parallèle, chacun
ouvrant un thème 7. L'autre a été fusionné le premier : son thème (« Géométrie
dans l'espace ») est resté, et la fiche « vecteur 1 » s'y est rangée DEVANT —
lire des coordonnées vient avant de s'en servir. {espace-milieu-longueurs} est
passé de 7.1.1 à 7.1.2 ; les notes portent l'identifiant, rien ne bouge.

**L'écran suit la fiche, de haut en bas.** Les *Définitions* en tête (milieu,
coordonnées de AB⃗ en colonne, longueur sous une racine) — dans un bloc
`aide-ecran`, que le DM sur papier tait —, puis l'énoncé, le repère dessiné, et
les quatre questions avec les trous de la fiche :
a) `A (… ; … ; …) et B (… ; … ; …)` ;
b) `I ((… + …)/2 ; (… + …)/2 ; (… + …)/2)  donc : I (… ; … ; …)` ;
c) `AB⃗ ( B − A )` en deux colonnes cerclées de pointillés, `B` et `A` au-dessus,
puis `AB⃗ (…)` en colonne ;
d) `AB = √((…)² + (…)² + (…)²) = √…`.
28 cases par question, trois questions par séance (`EPC_NBQ`, par
`distinctes()`).

**Le dessin dépend du tirage** : un SVG construit par la page (`epcDessinSVG`),
pas un fichier de `dessins/`, comme l'arbre du 6.1.1. Perspective de la
fiche : x vers le bas à droite (rouge), y vers le haut à droite (vert), z
vertical (bleu), la grille du plan (xOy) en pointillés ; chaque point a son
trait vertical jusqu'à son pied, les deux parallèles aux axes depuis le pied,
et le trait jusqu'à sa cote sur (Oz). Coordonnées entières de 1 à 4 ; deux
points ne partagent jamais leur pied (les verticales se confondraient), et
AB² ≥ 3. Le −1 n'est gradué que sur (Ox) et (Oz) : sur (Oy) il tombait sur
celui de (Ox), à l'origine.

**Le juge** (`epcEstJuste`) lit un entier, un décimal ou un quotient, signe
compris (« 3,5 », « 7/2 », « −2 »). Deux tolérances, et seulement deux : les
termes d'un numérateur du milieu se lisent dans les deux ordres (x_B + x_A),
et la parenthèse élevée au carré du d) au signe près ((x_A − x_B)² vaut
(x_B − x_A)²). Les colonnes de c), elles, ont leur ordre : B au-dessus de la
première, A de la seconde.

**Deux bords vus en ouvrant la page.** Un conteneur `flex` sépare `x` de son
`<sub>` et `( … )` de son `<sup>2</sup>` — chaque nœud devient un élément, et
l'indice retombe sur la ligne : le contenu d'une racine est donc enveloppé
dans un `<span>` unique. Et le radical (un SVG de rapport 14 × 100) imposait
SA hauteur à la ligne tant qu'il était en flux : il est posé en absolu dans sa
colonne, comme les parenthèses de `saParen`. Sur un téléphone (390 px), les
trois fractions du b) débordaient : police et cases resserrées sous 600 px, et
la ligne défile seule en dernier recours, jamais la page.

## 7.1.2 — milieu, longueurs, triangle rectangle (`espace-milieu-longueurs`, kind `elg`)

Demande de Turquet (octobre 2026) : « en terminale, créer dans le sous-thème
vecteurs et droites de l'espace un exercice respectant la présentation du pdf
joint » (fiche « vecteur 2 »). Le sous-thème n'existait pas : il ouvre un
**thème 7, « Géométrie dans l'espace »**, dont il est la première partie
(« Vecteurs et droites de l'espace »).

**La présentation est celle de la fiche, case pour case.**

* a) `I( (…+…)/2 ; (…+…)/2 ; (…+…)/2 )` — trois fractions empilées dans une
  parenthèse haute —, puis `donc : I(… ; … ; …)`.
* b) c) d) pour AB⃗, AC⃗, BC⃗ : la colonne des différences `… − …` entre deux
  grandes parenthèses, la colonne des coordonnées, puis
  `AB = √((…)² + (…)² + (…)²) = √…` avec la barre de la racine au-dessus.
* e) `AB² = (√…)² = …` pour les trois côtés, puis
  `Donc : …² + …² [= ou ≠] …²` (trois menus de côtés, un menu de signe) et
  `Donc : d'après [théorème], le triangle ABC [conclusion].`

Les parenthèses hautes sont des bords gauche et droit arrondis
(`border-radius:14px/50%`) : elles suivent la hauteur de ce qu'elles
enferment, une ligne de fractions comme une colonne de trois cases. La flèche
du vecteur est celle du 8.2 de la Seconde (`.vgt-vec`), reprise en
`.elg-vec`. Sur téléphone, la lettre ne se sépare pas de sa parenthèse
(`.elg-nw`), ni « AB = » de sa racine, et les cases maigrissent (34 px).

**Le tirage.** Trois triangles par séance : un rectangle, un qui ne l'est pas,
le troisième au hasard — l'ordre est mélangé, l'élève ne devine rien. Un
triangle rectangle se construit : deux vecteurs entiers orthogonaux, le second
étant le produit vectoriel du premier par un vecteur tiré, divisé par son
pgcd ; le sommet de l'angle droit est tiré. Un triangle quelconque est tiré,
puis écarté s'il a un angle droit, s'il est plat, si son plus grand côté n'est
pas unique (la conclusion doit nommer UN côté), ou si aucun milieu n'est
décimal (la fraction ne servirait à rien). Coordonnées entre −6 et 6, carrés
des côtés ≤ 110. Les trois passent par `distinctes()`.

**Le juge.** Une liste `elgCases(q)` — rendu, juge, correction et aide la
lisent toutes. Deux PAIRES sont libres d'ordre : les deux termes de chaque
numérateur du milieu (xA + xB ou xB + xA), et les deux petits côtés au e) ; la
correction d'une paire suit ce que l'élève a déjà mis dans l'autre case. La
colonne d'un vecteur, elle, a un ORDRE (`xB − xA`) : l'inverser est faux, et
le contrôle de 3 000 séances l'exige. Une coordonnée de milieu s'écrit en
décimal ou en fraction (`tgParseFrac`). La conclusion : un triangle rectangle
se conclut par **la réciproque** du théorème de Pythagore ; un triangle qui ne
l'est pas, par **le théorème de Pythagore** — ou **sa contraposée**, acceptée
aussi. Thalès est l'intrus du menu.

**Puis la réciproque et la contraposée sont sorties du menu** (Turquet,
octobre 2026 : « au lycée, la réciproque et la contraposée du théorème de
Pythagore sont incluses dans le théorème de Pythagore, donc on ne dit que
d'après le théorème de Pythagore »). Rectangle ou non, la seule bonne réponse
est `pyth` ; le menu offre deux intrus, Thalès et la relation de Chasles. Le
menu ne départage donc plus les deux cas : c'est le « = / ≠ » et la conclusion
qui le font. Le rappel, la correction et le contexte de l'IA disent la même
chose. Un brouillon d'avant qui avait `rec` ou `contra` retombe sur « … » à la
reprise : l'option n'existe plus.

**Le même jour, la racine en deux morceaux.** Le « √ » était un GLYPHE à
1,45 em posé devant un radicande à barre (`border-top`) : selon la police et
la hauteur de la rangée, le crochet ne rejoignait pas la barre — deux
morceaux, vus sur la capture de Turquet. Il est maintenant DESSINÉ : un SVG
étiré sur toute la hauteur du radicande (`preserveAspectRatio="none"`), trait
de 2 px non mis à l'échelle (`vector-effect`), dont l'extrémité haute tombe
au pixel près sur le début de la barre (SVG décalé d'1 px : le trait centré
couvre 0–2 px, comme la bordure).

**Éprouvé** : 3 000 séances tirées dans Chromium — chaque copie juste
acceptée, chaque copie aux paires inversées acceptée, chaque colonne de
vecteur inversée refusée, `q.r` toujours d'accord avec l'égalité des carrés,
chaque question sérialisable en JSON.

**Puis les trois carrés du e) ont pris chacun leur cadre** (Turquet, octobre
2026 : « les calculs de AB², AC² et BC² doivent être mieux séparés »). Posés
sur une rangée à 30 px les uns des autres, ils se lisaient comme une seule
chaîne d'égalités. Chaque `.elg-carre` est maintenant encadré (bordure
`--grid`, coins arrondis), à 22 px du suivant ; sur téléphone, ils s'empilent,
un cadre par ligne.

## 7.1.3 — équation paramétrique d'une droite (`espace-droite-parametrique`, kind `edp`)

Demande de Turquet (octobre 2026), avec la fiche « vecteurs 3 » : « créer un
exercice dans le sous-thème vecteur et droite comme le pdf. On présentera avec
toutes les étapes du pdf. »

**Deux formes de question, les deux exercices de la fiche.** La séance en tire
trois : une forme 1, une forme 2, la troisième au hasard, par `distinctes()`.

* Forme 1 — `A` et `u⃗` définissent `d` : a) le système `M ∈ d ⟺ {x = … … t}`,
  les deux colonnes cerclées de pointillés, « Point de départ » et « vecteur
  directeur » écrits dessous ; b) et c) deux points `B` et `C` — l'un est sur
  `d`, l'autre non, l'ordre est tiré.
* Forme 2 — `A` et `B` : a) `AB⃗ (… − …)  donc : AB⃗ (…)` ; b) le système de
  (AB), le point de départ `A` et le vecteur `AB⃗` IMPOSÉS dans la consigne
  (sans quoi `B` et `BA⃗`, justes aussi, changeraient toute la rédaction) ;
  c) « `C` est-il aligné avec `A` et `B` ? Ou encore : est-il sur [menu] ? »
  (la droite (AB), contre le segment [AB] et le plan (OAB)), puis la rédaction
  de la forme 1.

**La rédaction de l'appartenance, système après système, comme la fiche :**
`P ∈ d ⟺ P ∈ {x = xA + a t} ⟺ {xA + a t = xP} ⟺ {a t = xP  −xA} ⟺ {a t = …}
⟺ {t = …/… = …}  donc : [P ∈ d | P ∉ d]`. 22 cases par point. La seconde
case de « = … … » porte `−xA` AVEC son signe (« −2 », « +3 ») : c'est le terme
qui a changé de membre.

**Les membres de gauche sont des MIROIRS.** Écrire « 2 − 2t » en clair au b)
donnait la réponse du a) à lire. Les membres de gauche (`.edp-mir`) recopient
donc le système que l'élève a écrit au a), à chaque frappe (`edpMiroirs`,
branché sur `input` du formulaire, et rejoué après la remise des saisies d'une
reprise — `restoreBoxes` ne déclenche aucun `input`). Une case vide se lit
« … ». Après la correction, c'est le système JUSTE qui se recopie : les étapes
corrigées en vert partent de lui, jamais d'une saisie rouge. Ce ne sont pas
des cases : aucune note ne les compte.

**Le juge** (`edpCases`, une liste pour le rendu, le juge, la correction et
l'aide). Un coefficient de `t` se lit par `tgParseCoef` (« − » seul vaut −1) ;
la fraction `t = n/d` accepte aussi `(−n)/(−d)` ; la valeur de `t` en entier,
en fraction ou en décimal exact (la correction l'écrit en décimal quand il est
exact, en fraction irréductible sinon). Aucune coordonnée de `A` ni de `u⃗`
n'est nulle — « 0 t » rendrait la division absurde, et `−xA` vaudrait « +0 ».

**Le tirage.** Un point sur la droite : `A + t·u⃗`, `t` entier non nul. Un
point hors de la droite : une coordonnée prend un autre `t` entier, ou se
décale de 1 ou 2 (une valeur de `t` en fraction) — jamais trois valeurs égales.
Coordonnées bornées à 40 en valeur absolue.

**Le dessin.** Un système est une grille de trois lignes (`.edp-sys`,
`inline-grid`) : les colonnes s'alignent d'une ligne à l'autre comme sur la
fiche, et l'accolade est un SVG étiré sur les trois lignes (trait non mis à
l'échelle). Les deux cercles du a) sont des éléments de la grille posés sur
les trois lignes de leur colonne, derrière les cases.

**Éprouvé** : 3 000 séances tirées dans Chromium — chaque copie juste
acceptée, `(−n)/(−d)` accepté, la conclusion inversée et `xA` au lieu de `−xA`
refusés, une copie vide sans aucune case « remplie », chaque question
sérialisable en JSON, deux points de la forme 1 jamais du même côté.

**Puis le « + », la pilule et le coefficient 1 (Turquet, octobre 2026, v432).**
Quatre demandes sur le 7.1.3 :

* **Un « + » entre la colonne du point et celle du vecteur**, au système du
  a) : `x = 2 + (−2) t` — le coefficient s'écrit avec son signe dans la case
  du vecteur, ce que `tgParseCoef` lisait déjà.
* **Les colonnes cerclées comme au 7.1.1** (`.epc-cad`) : une pilule serrée
  autour des seules cases. Elle était un OVALE, pour deux raisons : la
  colonne du vecteur contenait aussi le « t », et les étiquettes « Point de
  départ » et « vecteur directeur », en `nowrap`, élargissaient leur colonne
  — avec `border-radius:999px`, une colonne aussi large que haute dessine un
  rond. Le « t » a sa propre colonne (`.tt`, collé à la pilule), et les
  étiquettes sont de largeur nulle (`width:0`, contenu centré qui déborde),
  sur deux lignes pour ne pas se chevaucher.
* **Un coefficient 1 ne s'écrit pas, et ne se divise pas.** Les miroirs
  écrivent « t », jamais « 1t » ; la dernière ligne de la rédaction n'a plus
  de fraction pour cette coordonnée — `t = …` tout court, la case sous les
  fractions des autres lignes, et `edpCases` ne crée plus les deux cases
  `h…n`/`h…d`. La structure se lit sur `q.u` (au tirage), les miroirs sur la
  saisie. **−1 garde son écriture et sa division** (« 1 − 1t », `t = n/(−1)`),
  demandé tel quel. Pour que les t restent l'un sous l'autre quand le « 1 »
  manque, les deux premiers systèmes écrivent le miroir en COLONNES —
  départ, signe, terme en t calé à droite (clés `d`, `g`, `a` ; `c` reste le
  terme signé des systèmes suivants).
* **Le nom du vecteur à mi-hauteur de sa colonne**, dans l'énoncé de la
  forme 1 (`.edp-vnom`, flex centré) : u⃗ était posé sur la ligne de base, en
  haut de la colonne.

## 7.1.4 — deux droites parallèles ? (`espace-droites-paralleles`, kind `epa`)

Demande de Turquet (octobre 2026), avec la fiche « vecteur 5 » : « créer un
exercice dans vecteur et droite de l'espace, comme le pdf joint. On acceptera
comme réponse pour les divisions une valeur approchée ou une fraction
simplifiée. »

**La rédaction de la fiche.** `d` et `d′` sont données par leurs équations
paramétriques (`t` et `t′`, le coefficient 1 écrit « 1t » comme sur la
fiche). Chaque question : la propriété (« leurs vecteurs directeurs sont
[colinéaires | orthogonaux | de même longueur] ») ; a) `u⃗` et `v⃗` en colonne ;
b) les trois quotients sous l'étiquette grise `(fin / début)` — coordonnée de
`v⃗` sur celle de `u⃗`, deux cases de fraction puis une case de valeur ; c) « les
droites [sont | ne sont pas] parallèles ». 17 cases par question.

**Le juge du quotient** (`epaQuoOk`) : la valeur exacte (entier, décimal
exact), une fraction IRRÉDUCTIBLE (« simplifiée » : `4/6` est refusé), ou,
quand le quotient n'est pas décimal, une valeur approchée au dixième près
(`|v − q| ≤ 0,05` : `0,7` et `0,67` valent `2/3`, `0,6` non). Un quotient
décimal exact ne s'approche pas (`0,6` refusé pour `1/2`). La fraction `n/d`
accepte aussi `(−n)/(−d)`.

**Le tirage.** Trois questions par `distinctes()`, au moins une parallèle et
une non. Parallèle : `v⃗ = k u⃗`, `k` parmi ±1, ±2, ±3, ±1/2, ±3/2, ±2/3. Non
parallèle : sept fois sur dix `k u⃗` dont UNE coordonnée change — deux
quotients égaux, le troisième non, le piège de la fiche — sinon `v⃗` au
hasard, jamais colinéaire. Aucune coordonnée nulle (ni de vecteur, ni de
point de départ).

## 7.1.5 — deux droites sécantes, le point d'intersection (`espace-droites-secantes`, kind `eds`)

Demande de Turquet (octobre 2026), avec la fiche « vecteurs 6 » : « l'élève
doit résoudre toutes les étapes avec des cases à remplir qui ne seront que
des nombres. »

**La rédaction de la fiche, tout en nombres.** « On veut » : le système
collé `{a + u t = b + v t′}` ①②③, les deux colonnes cerclées `d` et `d′`.
Puis, dans l'équation `s` où `t` est seul (coefficient 1 par construction) :
`t = [c0] [c1] t′` ; dans l'équation `r` : `a + u([c0] [c1] t′) = …` ⟺
`[e0] [e1] t′ = b + v t′` ⟺ `[f1] t′ = [f0]`, donc `t′ = […]`, puis
`t = [c0] [c1] × ([t′]) = [t]` ; « ATTENTION ! » dans l'équation `w` :
`a + u × ([t]) = b + v × ([t′])` ⟺ `[ ] = [ ]` ; la conclusion est écrite
(« les droites sont bien sécantes ») ; le point : `x = a₁ + u₁t = [ ]`… et
`I(…)` RECOPIE ces trois cases (`edsMiroirs`, pas une case, aucune note ne
le compte ; après la correction, le point juste). 20 cases par question.

**Le juge** : chaque case est un nombre (`tgParseFrac`) ; un coefficient
porte son signe dans sa case, sans « + » écrit devant (comme au 7.1.3). La
ligne `[f1] t′ = [f0]` accepte aussi l'écriture opposée (`−f1`, `−f0` : les
`t′` regroupés de l'autre côté) — les deux cases ensemble, jamais une seule.

**Le tirage.** `s`, `r`, `w` tirés (l'ordre ②, ①, ③ de la fiche est un cas
parmi six) ; `u_s = 1` ; `u⃗`, `v⃗` non colinéaires ; `t` entier non nul, `t′`
entier (0 permis, comme sur la fiche) ; le point `I = A + t u⃗`, puis
`B = I − t′ v⃗`. Écartés : une coordonnée de `B` nulle, `b_s − a_s = 0`
(« t = 0 + … »), et `u_r v_s − v_r = 0` (l'équation `r` ne donnerait pas
`t′`). Les deux droites sont donc toujours sécantes.

**Éprouvé** (les deux) : 3 000 séances tirées — chaque copie juste acceptée,
`(−n)/(−d)` et la paire opposée acceptés, une seule case de la paire
renversée refusée (sauf `f0 = 0`, où elle est juste), la conclusion inversée
refusée, une copie vide sans aucune case « remplie », `t = c0 + c1 t′`,
`f1 t′ = f0` et `I` sur `d′` toujours vrais, chaque question sérialisable en
JSON ; le juge du quotient sur onze écritures (`0,7`, `0,67`, `2/3`, `4/6`,
`0,6`, `−2,04`, `2/−3`…). Les deux écrans ouverts dans Chromium à 1 280 px et
à 390 px : sur téléphone, réduire l'écart des colonnes du système collé
faisait chevaucher le « = » et les cercles — la règle a été retirée.
