# Terminale — géométrie dans l'espace

## 7.1.1 — milieu, longueurs, triangle rectangle (`espace-milieu-longueurs`, kind `elg`)

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

**Éprouvé** : 3 000 séances tirées dans Chromium — chaque copie juste
acceptée, chaque copie aux paires inversées acceptée, chaque colonne de
vecteur inversée refusée, `q.r` toujours d'accord avec l'égalité des carrés,
chaque question sérialisable en JSON.
