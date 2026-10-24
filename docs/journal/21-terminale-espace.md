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

**Puis le CHOIX est revenu à l'élève (Turquet, octobre 2026, v433).** « Quand
la droite passe par deux points, l'élève doit choisir d'abord son vecteur
directeur, AB ou BA, et il ne faut pas l'aider dans son choix ; quand il
donne l'équation paramétrique, il peut donner A ou B comme point de départ. »

* **Le a) commence par un menu** (`edp-vn`, « … », AB, BA — sans valeur par
  défaut), et le nom choisi se recopie devant les deux colonnes
  (`.edp-vnm`). Les options sont écrites « AB », « BA » : la flèche
  combinante U+20D7 sort en carré dans la police des menus.
* **Le b) ne dit plus « avec le point de départ A et le vecteur AB⃗ »** :
  « Donner une équation paramétrique de (AB) ». A ou B, u⃗ ou −u⃗.
* **Le choix se LIT dans la copie** (`edpChoix`) : le menu, ou à défaut la
  colonne « arrivée » ; le point que la colonne du point recopie le plus ;
  u⃗ ou −u⃗ selon la colonne du vecteur. `edpCases(q, ch)` et `edpEtude(q, p,
  ch)` en partent : le système attendu, toute la rédaction de
  l'appartenance (« − xB » quand le départ est B) et la correction en vert
  suivent le choix de l'élève, jamais un choix de la page. Le contexte
  envoyé au modèle lui interdit de recommander l'un ou l'autre.
* **Le coefficient 1 se lit dans ce que l'élève a ÉCRIT** (`ch.un`), plus
  dans `q.u` : un 1 de AB⃗ devient −1 avec BA⃗. Et la page ne doit pas
  souffler — la première version retirait la fraction avant toute saisie,
  et la forme de la ligne disait « ici le coefficient est 1 ». Toutes les
  cases sont désormais posées ; `edpForme()` masque la fraction d'une ligne
  où l'élève a écrit 1, et une case masquée ne garde aucune couleur
  (`ptsEcran` ne compte que les cases peintes). Les poser toutes, c'est
  aussi ce qui permet à une reprise de remettre les saisies.
* En soutien, la correction en direct écoute le formulaire et non chaque
  case : une case qui apparaît après coup est entendue.

**Éprouvé** dans Chromium : les huit copies justes (AB⃗/BA⃗ × A/B × u⃗/−u⃗)
acceptées, la fraction masquée exactement quand 1 est écrit, un vecteur
contraire au choix du menu refusé, la correction en vert partie du point B
et de BA⃗ choisis par la copie.

**Puis les flèches dans le choix, et des t entiers (Turquet, octobre 2026,
v436).**

* **« Je veux voir les flèches au-dessus des lettres quand on choisit AB ou
  BA. »** Une `<option>` ne sait pas dessiner une flèche au-dessus de deux
  lettres (la flèche combinante sort en carré). Le choix se fait donc par
  deux pastilles, `AB⃗` et `BA⃗` dessinées comme partout (`elgVec`) ; le
  menu `edp-vn` reste, CACHÉ, et porte l'état — c'est lui que lisent le
  juge, la pause (`captureBoxes`) et la note (`ptsEcran`). `edpPastilles()`
  recopie sur la pastille choisie la couleur du menu et son verrou. Piège vu
  à la capture : après la vérification, le menu caché RÉAPPARAISSAIT en tête
  de ligne — les règles `.tvi-sel.ok` / `:disabled` l'emportaient sur
  l'opacité ; le masquage passe par `#edpForm select.edp-vn-cache` et
  `!important`.
* **« Pour les points, des valeurs entières entre −3 et 3 pour les trois
  t. »** Quel que soit le choix de l'élève : depuis B, t devient t − 1, et
  BA⃗ en change le signe. Par deux points, t se tire donc entre −2 et 3
  (ni 0 ni 1 pour un point sur la droite, qui serait A ou B) ; avec un
  point et un vecteur, entre −3 et 3, sans 0. Un point HORS de la droite a
  trois t entiers tirés dans les mêmes bornes, pas tous égaux — il n'y a
  plus de t en fraction. Le repli sans tirage reprend les nombres de la
  fiche avec des t dans les bornes.

**Éprouvé** : 5 000 séances, 45 072 couples (point, choix) — chaque t entier
entre −3 et 3, trois t égaux exactement quand le point est sur la droite,
les deux points de la forme 1 jamais du même côté ; les huit copies justes
de nouveau acceptées.

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

## 7.1.6 — le cube : coordonnées, vecteurs, points à placer (`espace-cube`, kind `ecb`)

Demande de Turquet (octobre 2026), avec la fiche « vecteurs 4 » : « créer un
exercice dans vecteurs et droites de l'espace, comme le pdf joint. On pourra
avoir comme solution pour les coordonnées 0,25 ; 0,5 ; 0,75 ; 1 ; 1,25 ; 1,5
en positif ou négatif. Un point doit être sur une arête ou un prolongement
d'arête — dans ce cas il faut prolonger l'arête pour placer ou représenter ce
point. La base du repère sera toujours d'origine A puis avec B, D, E, mais le
point A peut être en bas à gauche et sur la face avant ou arrière du cube.
Pour les coordonnées de trois vecteurs, on présentera les calculs comme dans
le 7.3.2. » — il n'y a pas de 7.3.2 en Terminale : lu comme la présentation
commune du 7.1.2 et du 7.1.3, `XY⃗ (… − …)` en colonne, `donc : XY⃗ (…)`.

**Puis deux autres sessions, le même jour.** Né en 7.1.4, le cube est passé
en 7.1.6 à la fusion : les fiches « vecteur 5 » et « vecteurs 6 » (droites
parallèles, droites sécantes) avaient pris le 7.1.4 et le 7.1.5. Les notes
portent l'identifiant (`espace-cube`) : rien ne bouge.

**La fiche, de haut en bas.** La figure, puis a) les coordonnées de A, B, D,
E / C, F, H, G / I, J, K, L, quatre par ligne comme sur la fiche ; b) trois
vecteurs — sommet → sommet (jamais une arête), point → sommet, sommet →
point, comme ED⃗, JD⃗, EJ⃗ ; c) trois points M, N, O à placer. 66 cases par
cube (36 + 27 + 3), deux cubes par séance (`ECB_NBQ`, par `distinctes()`).

**Quatre dessins** (`q.cfg`) : A en bas à gauche sur la face arrière (la
fiche) ou avant, et l'arête horizontale de A mène à B ou à D ; E toujours
au-dessus de A. La perspective est cavalière, fuite en haut à droite
(`ECB_PROF`) : le sommet caché est toujours celui du bas, à gauche, à
l'arrière — A, B ou D selon le dessin —, ses trois arêtes en pointillés, et
la flèche de base qui en part aussi. AB⃗, AD⃗, AE⃗ sont en rouge, vert, bleu.

**Les points.** Deux coordonnées valent 0 ou 1 (elles désignent l'arête), la
troisième est dans {±0,25 ; ±0,5 ; ±0,75 ; −1 ; ±1,25 ; ±1,5} — 0 et 1 en
feraient un sommet. I, J, K, L : un ou deux sur un prolongement, les autres
sur l'arête ; quatre arêtes différentes, graduées en quarts jusqu'au point,
prolongées en pointillés fins. Trois écarts au tirage, chacun vu sur une
figure : un point loin des sommets (26 px), des autres points (34 px) et des
arêtes qui ne le portent pas (10 px) ; jamais au-delà du sommet caché sur une
arête cachée (le point serait derrière le cube) ; et jamais un prolongement
qui retombe DANS le dessin du cube (`ecbDansCube`, l'enveloppe des huit
sommets) — vu à la première ouverture : M(1 ; −1,5 ; 1), prolongé vers
l'avant depuis F, se posait au milieu de la face avant et se lisait comme un
point du cube.

**Les étiquettes** se posent à la place la plus dégagée parmi seize autour de
leur point (loin des traits, des points, des étiquettes déjà posées), puis
vers l'extérieur : à la première ouverture, L couvrait F et K couvrait I.

**Le placement (c).** Un bouton par point, le point actif en orange ; un clic
sur la figure pose le point au quart d'arête permis le plus proche (30 unités
au plus), prolongement dessiné jusqu'à lui, et passe au point suivant ; un
nouveau clic le déplace. À la souris, un fantôme montre où le clic posera.
Les positions vivent dans la question (`q.place`, du JSON) : la pause les
garde. `ecbPoser(L, P)` pose sans clic (jsdom n'a pas de mise en page). Un
point placé est une case (`.pts-case`) : juste en bleu, faux en rouge avec
la bonne position en vert à côté (sans `.pts-case` — elle ne compte pas deux
fois), non placé à la correction : montré en vert, `.pts-case.sol`. Le juge
accepte aussi une autre position qui tombe au même endroit du dessin (3 px).

**Le juge** (`ecbCases`, une liste pour le rendu, le juge, la correction et
l'aide) lit un entier, un décimal (virgule ou point) ou une fraction
(`tgParseFrac`). La colonne d'un vecteur a son ordre : `xY` au-dessus, `xX`
soustrait.

**Éprouvé** : 3 000 séances tirées — chaque copie juste acceptée, en décimal
comme en fraction (« −1/4 »), chaque colonne de vecteur inversée refusée, une
copie vide sans aucune case « remplie », chaque question sérialisable en JSON,
chaque point sur une droite d'arête avec une coordonnée permise, les quatre
dessins tirés à parts égales ; et dans Chromium, de vrais clics : un point
posé juste compté juste, un point posé ailleurs compté faux, un point oublié
montré en vert, « 21 cases justes sur 66 » pour 21 saisies justes.

**Puis deux vecteurs, et une seconde figure pour le c)** (Turquet, octobre
2026, v437 : « dans la question b ne demande que deux vecteurs, et dans la
question a que les points de ces deux vecteurs ; refaire une figure pour la
question c où on placera les trois points ; sur la première figure il n'y a
plus de point à tracer, et on gagne de la place entre l'énoncé et la
question a »). Le b) garde les deux vecteurs de la fiche qui passent par un
point : point → sommet, sommet → point (JD⃗, EJ⃗) — l'un part de I, l'autre
arrive en J, ou l'inverse, deux sommets différents. Le a) ne demande que
leurs quatre extrémités (`ecbPtsA`), dans l'ordre des vecteurs : 33 cases par
cube (12 + 18 + 3) au lieu de 66. Il n'y a plus que I et J sur la figure.

**Deux figures, deux cadres** (`ecbCadre(q, mode)`). La première (`'a'`) se
resserre sur le cube, I et J : elle n'a plus à réserver la place des points
du c), et descend à 400 px sous l'énoncé. La seconde (`'c'`, `#ecbFig2`), le
même cube sans I ni J, garde le cadre de TOUTES les places permises — un cadre
taillé sur M, N, O dirait où ils sont — et reçoit seule les clics. Les tirages
sont indépendants : M, N, O ne s'écartent plus de I et J, qui ne sont pas sur
leur dessin. Un brouillon d'avant (quatre points, trois vecteurs) se reprend
tel quel : tout se lit dans `q.vecs`.

**Éprouvé** : 3 000 séances — quatre points au a), deux vecteurs au b), 33
cases, copie juste acceptée, colonne inversée refusée ; dans Chromium, de
vrais clics sur la seconde figure : M juste compté juste, N posé ailleurs
compté faux, O oublié montré en vert.

**Puis les deux sens de la division, et plus d'étapes a), b), c) (Turquet,
octobre 2026, v438).** « Dans le 7.1.4, ne pas afficher les étapes a, b et
c ; dans les divisions, accepter v/u ou u/v avec des valeurs approchées ou
des fractions simplifiées dans le résultat. » Les trois intitulés ont
disparu : la propriété, les deux vecteurs, les quotients et la conclusion se
suivent sans titre (`margin-top` sur les rangées pour garder l'air). Chaque
quotient se divise dans le sens que l'élève choisit, fraction par fraction :
`epaVerdicts` lit le sens sur la copie — la fraction entière d'abord (`n/d`
ou `(−n)/(−d)`), puis le numérateur seul, le dénominateur seul, puis la
valeur ; à défaut, `v/u`, le sens de la fiche. La valeur se juge dans le
sens choisi (exacte, fraction irréductible, ou approchée au dixième si le
quotient n'est pas décimal), et la correction s'écrit dans ce sens : un
élève parti sur `u/v` ne reçoit pas une correction en `v/u`. Une valeur
`v/u` sous une fraction `u/v` est refusée. **Éprouvé** sur 3 000 séances :
le sens `u/v` complet accepté, sa valeur approchée acceptée, la valeur de
l'autre sens refusée, la correction d'une case vide en `v/u`, celle d'une
copie commencée en `u/v` dans ce sens.

**Puis le 7.1.5 a suivi la fiche au plus près (Turquet, octobre 2026,
v438).** Quatre demandes :

* **Une écriture déjà complétée se redonne, elle ne se redemande pas.** La
  parenthèse de « Devient : a + u(… + … t′) », le calcul « t = c0 + c1 × (t′) »,
  le « t = … et t′ = … » de la vérification et de la conclusion, le « × (t) »
  du point : ce sont des MIROIRS (`.eds-mir`, `edsMiroirs`) de ce que l'élève
  a écrit, à chaque frappe — l'écriture de l'élève, même fausse, jamais la
  bonne réponse. Une case vide se lit « … ». Après la correction, ce sont les
  valeurs justes qui se recopient. Les cases `r0`, `r1`, `h0`, `h1`, `h2`,
  `w1`, `w2` ont disparu : 13 cases au lieu de 20. Un brouillon d'avant qui
  les portait ne trouve plus leur case à la reprise, sans erreur.
* **Un membre resté identique en résolvant ne se redemande pas** : « = b + v t′ »
  est écrit sur la ligne développée (il l'était déjà).
* **Un « + » devant une case positive qui suit un terme** : `t = [c0] + [c1] t′`
  et `[e0] + [e1] t′` quand `c1` ou `e1` est positif ; négatif, rien n'est
  écrit et l'élève tape le signe. La demande montre donc le SIGNE de ces deux
  cases — c'est voulu, et la consigne le dit sous l'exercice.
* **t et t′ entiers entre −3 et 3** (t non nul ; t′ peut valoir 0, comme sur
  la fiche).

**Éprouvé** : 3 000 séances — 13 cases, bornes de t et t′ tenues, copies
justes acceptées, paire opposée de `[f1] t′ = [f0]` acceptée, copie vide sans
case remplie ; l'écran ouvert dans Chromium, saisies fausses recopiées dans
les miroirs puis remplacées par les valeurs justes à la correction.

**Puis le 7.1.5 a été repris en entier, sur la seconde version de la fiche
« vecteurs 6 » (Turquet, octobre 2026, v438 : « voilà le bon pdf, il faut
tout reprendre »).** La résolution suit maintenant ses lignes une à une :
`t = b + v t′ [−a] = v t′ [b − a]` (le membre de droite est recopié par la
page, l'élève écrit le nombre qui change de côté puis le nombre réduit) ;
`Devient : a + u(v t′ c0)` ; `⟺ a [e1] t′ [e0] = b + v t′` (le « a » reste,
écrit) ; `⟺ e1 t′ [g1] t′ = b [g0]` (le terme en t′ passe à gauche, les
nombres à droite) ; `⟺ [h1] t′ = [h0]` ; `⟺ t′ = h0/h1 = [t′]` ;
`Avec : t = v t′ c0 = v × (t′) c0 = [t]`. La vérification a trois lignes —
les miroirs de t et t′, puis `a [m1] = b [m2]`, puis `[ ] = [ ]` — et deux
menus : « l'équation ③ est [vérifiée] », « les droites sont bien
[sécantes] ». Le point d'intersection se calcule avec t dans `d` OU avec t′
dans `d′`, au choix de l'élève : un menu hors note (`.hors-note`) qui
réécrit les trois lignes `x = a + u t = a + u × (t) = [ ]` — les trois cases
valent les mêmes coordonnées dans les deux cas. 19 cases. Les règles de la
version précédente tiennent : miroirs de l'écriture de l'élève, « + » devant
une case positive qui suit un terme, t et t′ entre −3 et 3.

**Éprouvé** : 3 000 séances — chaque ligne vérifiée par le calcul (le
développement vaut le membre de droite pour t′, `h1 t′ = h0`, la
vérification égale, I sur `d′`), la copie juste acceptée, la paire opposée
`(−h1, −h0)` acceptée seule à seule refusée, les menus faux refusés, une
copie vide sans case remplie ; l'écran ouvert dans Chromium, saisies
fausses recopiées dans les miroirs puis remplacées par les justes.

**Puis le chemin depuis A, en pointillés, et une seconde figure plus grande**
(Turquet, octobre 2026, v441 : « quand on place un point pour la question c,
agrandir le dessin, et pour le point M(0 ; −0,5 ; 1), l'élève doit pouvoir
passer par le point (0 ; −0,5 ; 0)… avec des pointillés »). Trois gestes
étaient possibles — construire le point en trois clics (x, puis y, puis z),
en deux (le pied, puis la verticale), ou garder le clic sur l'arête et
montrer le chemin : Turquet a choisi le troisième. Le clic pose toujours le
point sur l'arête ou son prolongement ; la figure trace en plus, en
pointillés de la couleur du point, le chemin de A jusqu'à lui — x pas le long
de (AB), y pas parallèlement à (AD), z pas verticalement (`chemin` dans
`ecbSVG`, une étape nulle ne se trace pas). Le fantôme qui suit la souris le
montre AVANT le clic, la correction verte aussi. La seconde figure prend toute
la largeur de la carte (860 px au plus, contre 600).

## 7.1.7 — parallèles, sécantes ou non coplanaires (`espace-positions-droites`, kind `epo`)

Demande de Turquet (octobre 2026), avec la fiche « vecteur 7 » : « créer un
exercice dans vecteur et droite de l'espace comme le pdf joint. Pour chaque
question on tracera les deux droites. On pourra prendre des droites qui ne
sont pas des arêtes si on peut faire la différence sur le dessin entre
sécantes et non coplanaires de façon simple ou visible. »

**La fiche.** Un pavé droit ABCDEFGH (A en bas à gauche sur la face avant,
D caché derrière A), six phrases « (AB) et (CD) sont … » à compléter par
« parallèles », « sécantes » ou « non coplanaires ». Ici : une question par
écran, la figure avec SES deux droites (la première écrite en orange, la
seconde en violet, les noms de l'énoncé de la même couleur), et une liste des
trois mots. Six questions par `distinctes()`, deux de chaque sorte, dans le
désordre.

**Les droites** passent par deux sommets : 12 arêtes, 12 diagonales de face,
4 diagonales du pavé. Deux d'entre elles, sécantes, se coupent toujours en un
sommet, au centre d'une face ou au centre du pavé — jamais hors du dessin.
Les sécantes se tirent une fois sur deux en un sommet ; quatre fois sur dix,
la paire est faite de deux arêtes.

**Ce qui rend la différence visible : les pointillés, appliqués aux droites
comme aux arêtes.** Chaque morceau d'une droite caché par le pavé (dedans, ou
derrière une face) est en pointillés : `epoCache` regarde si le rayon vers
l'œil — le noyau de la projection cavalière — traverse l'intérieur du pavé.
Deux non coplanaires dont les tracés semblent se croiser ne sont gardées que
si, au croisement, l'une est pleine et l'autre en pointillés — (AC) et (BF)
de la fiche : la diagonale de la base passe derrière l'arête. Un croisement
plein × plein ou pointillés × pointillés se lirait comme un point commun : la
paire est écartée au tirage. Écartées aussi : deux non coplanaires qui
sembleraient parallèles (moins de 10°), deux sécantes trop rasantes (moins de
15°), deux parallèles à moins de 16 px l'une de l'autre sur le dessin. Le
tracé d'une droite ne frôle aucun sommet qui n'est pas sur elle (12 px) :
avec les premières proportions essayées, (AF) prolongée passait sur G et
(AG) sur F — les proportions du pavé (`EPO_X`, `EPO_Y`, `EPO_Z`) ont été
choisies, mesure à l'appui, pour que les 28 droites passent toutes. Restent
24 paires parallèles, 163 sécantes, 148 non coplanaires.

**La correction** dit pourquoi : le plan commun et la même direction
(« AB⃗ = HG⃗ ») pour deux parallèles ; le plan commun et le point commun
(« au centre de la face BCGF », marqué en vert sur la figure) pour deux
sécantes ; pour deux non coplanaires, un plan qui contient l'une et que
l'autre ne coupe qu'en un sommet hors de la première (« (BF) ne coupe le plan
(ABCD), qui contient (AC), qu'en B ») — trouvé parmi les vingt plans de trois
sommets (`EPO_PLANS` : six faces, six plans diagonaux, huit triangles).

**Éprouvé** : 3 000 séances tirées — six questions distinctes, deux de chaque
sorte, la position relue sur les noms écrits (l'ordre des lettres et des
droites est un habit, `q.ordre`), un plan commun pour chaque paire coplanaire,
un témoin pour chaque non coplanaire, aucune figure ni explication avec
`NaN` ou `undefined`, chaque question sérialisable en JSON.

**Puis la case du résultat s'élargit, et « ≈ » devant une valeur approchée
(Turquet, octobre 2026, v440).** « Dans le 7.1.4, dans le résultat des
divisions, la case doit s'agrandir si l'écriture dépasse ; mettre le
symbole « à peu près égal » si l'élève donne une valeur approchée » — et la
même chose au 7.1.5, sur la division `t′ = …/… = [ ]`. Deux aides
communes (`caseAjuster`, `signeQuotient`) :

* la case d'un résultat prend `calc(n ch + 18px)` au-delà de trois
  caractères, à chaque frappe, à la reprise d'une pause, et quand la
  correction écrit dans une case vide ;
* le signe devant la case se lit sur la copie : « ≈ » quand l'élève écrit un
  DÉCIMAL qui n'est pas exactement le quotient de SA fraction (n et d lus
  dans ses cases, jamais dans la réponse attendue) ; « = » pour une
  fraction, une valeur exacte, ou une ligne incomplète. Au 7.1.5, la
  fraction est le miroir `h0/h1` : ce sont les cases `h0` et `h1` qui
  comptent.

**Éprouvé** dans Chromium : `2/3 ≈ 0,67`, `2/1 = 2`, `5/−2 = −5/2` ; la
case de « 0,666666 » passe de 46 à 86 px sans couper le texte ; au 7.1.5,
`7/3 ≈ 2,33` puis `= 7/3`.

**Puis les « = » et les « ⟺ » alignés (Turquet, octobre 2026, v440).**
« Quand on exprime t en fonction de t′ à partir d'une des trois équations,
le signe = doit être aligné verticalement avec le = de l'équation choisie ;
quand on résout l'équation obtenue par substitution, les équivalences
alignées verticalement et les = aussi ; même chose pour la vérification. »
Les trois blocs du 7.1.5 s'écrivent en GRILLE (`.eds-gr`, six colonnes :
étiquette ou « ⟺ » calée à droite, membre de gauche calé à droite, « = »,
membre de droite calé à gauche, puis un second « = » et sa suite pour
`t = … = …`). L'équation choisie ouvre chaque bloc sur sa propre ligne
(« ③ : a + u t = b + v t′ »), pour que son « = » tombe au-dessus des autres
— elle n'est plus écrite dans la phrase d'introduction. Sur téléphone, un
bloc trop large défile dans son cadre (`.eds-lsys`) plutôt que de se
replier, ce qui casserait l'alignement.

**Puis deux étapes de plus (Turquet, octobre 2026, v440).** Sur une capture
de l'écran : « quand on a 2 + 12t′ + 21 = 7 + 4t′, rajouter une étape en
dessous avec 12t′ + …. = 7 + 4t′ ; quand on calcule t avec la valeur de t′,
laisser l'élève remplir la case de la valeur de t′ : t = −4t′ − 7 = −4 × ….
− 7 = ….. ». La ligne `⟺ e1 t′ [k0] = b + v t′` (k0 = a + e0, le nombre
seul du membre de gauche réduit ; `e1 t′` est le miroir) s'insère sous le
développement — la ligne suivante fait passer k0, et `g0 = −k0` n'a pas
changé. Dans « Avec : t = … × ( ) … », la valeur de t′ n'est plus un miroir
mais une case (`eds-tv`). 21 cases.
Le même jour : « quand on vérifie la 3ᵉ équation, laisser l'élève placer
les valeurs de t et t′ dans l'équation » — la ligne
`a + u × ([t]) = b + v × ([t′])` porte deux cases (`eds-wt`, `eds-wtp`) au
lieu des miroirs. 23 cases.
Puis : « quand on détermine le point d'intersection, laisser l'élève
remplir les cases avec la valeur de t ou de t′ » — chaque ligne du point
s'écrit `x = a + u t = a + u × ([ ]) = [ ]`. La case (`eds-p0…2`) se juge
selon le menu du choix : t avec `d`, t′ avec `d′` (`edsVerdicts` relit
`eds-ch`) ; la correction s'écrit dans le même sens. 26 cases.
Et : « laisser l'élève remplir les cases donnant les coordonnées du point
d'intersection » — `I([ ] ; [ ] ; [ ])` porte trois cases (`eds-j0…2`)
au lieu du miroir des lignes du point. 29 cases.

**Puis la fraction de t′ en cases, et le « + » devant zéro (Turquet,
octobre 2026, v442).** « Quand on calcule t′ = 0/6, laisser l'élève
compléter la division ; quand le résultat est 0 dans une case, mettre un
plus devant cette case. » La ligne `t′ = [h0]/[h1] = [t′]` porte deux
cases (`eds-qn`, `eds-qd`) au lieu des miroirs ; elle accepte aussi
`(−h0)/(−h1)`, comme la ligne au-dessus, et le « ≈ » se lit sur ces deux
cases. Le « + » d'une case qui suit un terme s'écrit désormais pour une
valeur positive OU NULLE (`P(v)` : `v >= 0`) — et le miroir d'une case vide
de même. 31 cases.

## 7.1.8 — le cube : droites parallèles, sécantes, triangle rectangle (`espace-cube-droites`, kind `ecd`)

Demande de Turquet (octobre 2026), avec la fiche « vecteur 8 » : « créer un
exercice dans vecteur et droite de l'espace comme le pdf joint ; rédiger en
respectant les consignes de présentation des exercices précédents qui
traitent des mêmes questions ».

**La fiche entière, en quatre parties.** Trois pages et près de deux cents
cases : une séance, quatre écrans (« Partie 1 / 4 », `ECD_NBQ`), la même
configuration sur les quatre (`q.n`, `q.cfg`), un point par partie parfaite.
Chaque question reprend la présentation de l'exercice qui la traite déjà :

1. a) les coordonnées des sommets utiles et de I (la fiche oubliait C,
   pourtant nécessaire à EC⃗ : il est demandé) ; b) le milieu O en fractions,
   les deux termes d'un numérateur dans l'ordre qu'on veut (7.1.2) ;
   c) AG⃗, EC⃗, OI⃗ en colonnes `… − …`, `donc : …` (7.1.6).
2. d) les équations de (EC), (AG), (OI) en t, l, k, les deux colonnes
   cerclées « un point de la droite » / « un vecteur de la droite » (7.1.3) —
   le point est l'un ou l'autre des deux points qui nomment la droite, le
   vecteur l'un ou l'autre sens, lus sur la colonne ; e) (OI) et (AG)
   parallèles ? les quotients « fin / début » du 7.1.4, dans le sens qu'on
   veut, sur les vecteurs u⃗ et v⃗ que l'élève a écrits (u⃗ ou −u⃗ chacun) ;
   la propriété encadrée ; f) coplanaires ?
3. g) (OI) et (EC) parallèles ? ; « pour la suite on considère… » : les
   équations IMPOSÉES de la fiche, point et vecteur cerclés ; h) le système
   collé ①②③, « deux équations identiques : on en supprime une », le système
   de deux équations, puis la résolution en grille du 7.1.5 :
   `t = [c0] + [c1]k`, `Devient : a + u(…)` (miroir), le développement, la
   réduction, `[h1]k = [h0]` (paire opposée acceptée), `k = [ ]/[ ] = [ ]`
   (« ≈ » devant une valeur approchée), `t = … × ([k]) = [t]`, et « inutile
   de la vérifier » pour l'équation supprimée ; i) la conclusion générale
   (parallèles ? sécantes ? coplanaires ?) ; j) le point S avec t dans (EC).
4. k) placer S au clic (7.1.6 : chemin depuis A en pointillés, le clic se
   cale sur les quarts des quatre segments tracés) ; l) OB⃗, BI⃗ ; m) les
   longueurs, « on peut supprimer les signes − » : la case accepte la valeur
   sans signe, ou le nombre négatif ENTRE PARENTHÈSES — jamais « −0,5 » nu
   (−0,5² = −0,25) ; n) les carrés dans leurs cadres, `…² + …² = …²` (les deux
   petits côtés dans l'ordre qu'on veut), « d'après le théorème de Pythagore,
   le triangle est rectangle en le point O ».

**Le tirage : la fiche transportée par une symétrie du cube.** Le repère
reste (A ; AB⃗ ; AD⃗ ; AE⃗) ; ce sont les RÔLES des sommets qui changent (le
« E » de la fiche peut être F, son « C » D…). Sur les 48 symétries, 18
gardent la rédaction : deux équations du système collé IDENTIQUES (pas
seulement équivalentes — « 1 − 1t = 0,5 − 0,5k » et « t = 0,5 + 0,5k » ne se
« suppriment » pas à vue), et un t de coefficient 1 dans une des deux
équations qui restent (`ECD_VAR`, calculé au chargement). Toutes les
valeurs sont des multiples de 0,25.

**Le dessin.** L'un des quatre dessins du 7.1.6, celui de la fiche d'abord,
mais il doit se LIRE : vu au premier essai, S(0,25 ; 0,75 ; 0,75) tombait pile
sur le dessin de l'arête [EF], et sur un dessin à AB⃗ fuyant (OI), (EC) et
(AG) se confondaient en un trait. `ecdLisible` écarte : S à moins de 12 px
d'une arête, de [AG] ou de [DB], à moins de 36 px d'un sommet (son étiquette
couvrait celle de G), ou à moins de 12 px d'une autre place de clic ; (OI) et
(EC) sous moins de 20°, (AG) et (EC) aussi ; (OI) et (AG), parallèles, à
moins de 16 px. Restent 8 couples (configuration, dessin), tous sur le dessin
de la fiche.

**Éprouvé** : 3 000 séances — chaque copie juste acceptée dans les quatre
parties, le point C et le vecteur CE⃗ acceptés au d), les quotients dans
l'autre sens acceptés, la paire `(−h1, −h0)` acceptée et une seule de ses
cases renversée refusée, « −0,5 » nu refusé et « (−0,5) » accepté au m), les
petits côtés inversés acceptés au n), une copie vide sans case remplie, S sur
les deux droites, `h1 k = h0` et l'égalité de Pythagore toujours vraies,
chaque question sérialisable en JSON ; les quatre écrans ouverts dans
Chromium à 1 280 px et 390 px, une copie juste comptée parfaite partout.
Deux défauts vus sur les captures et corrigés : les étiquettes des équations
imposées se chevauchaient (`.ecd-imp`, colonnes écartées), et l'accolade
d'un système de DEUX lignes, haute de trois, écartait ses lignes
(`.ecd-sys2`).
