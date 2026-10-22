# Terminale — géométrie dans l'espace (thème 7)

## {espace-coordonnees} (7.1.1) : coordonnées, milieu, vecteur, longueur

Demande de Turquet (octobre 2026), avec la fiche « vecteur 1 » : « en
terminale, créer un thème espace et un sous-thème vecteurs et droites de
l'espace, et y créer un exercice respectant la présentation du pdf joint ».

**Le thème 7 « Espace » est découpé en parties dès sa naissance**, comme
celui des Probabilités : la partie 1 « Vecteurs et droites de l'espace » porte
l'exercice, la suivante s'ajoutera sans renuméroter.

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
