# Terminale — probabilités (thème 6)

## {arbre-probabilites} (6.1.1) : l'arbre pondéré, tous les calculs

Demande de Turquet (octobre 2026) : « en terminale créer un thème probabilité
et un sous-thème arbre de probabilité ; créer un exercice permettant de tester
les élèves sur tous les types de calcul dans un arbre, comme sur le pdf ». Le
PDF n'était pas joint à la session : l'exercice suit les calculs classiques
d'un arbre pondéré de Terminale, et se reprendra sur la fiche si elle diffère.

**Le thème 6 « Probabilités » est découpé en parties dès sa naissance**, comme
ceux de l'Étude de fonction et des Suites : la partie 1 « Arbre de
probabilité » porte l'exercice, et la suivante s'ajoutera sans renuméroter.

**Trois questions par séance, une par FAMILLE — ce que l'énoncé DONNE change,
donc le chemin de calcul aussi.** Une situation concrète (usine, dépistage,
magasin, bus, lycée — chacune avec ses viviers de pourcentages, pour que la
scène reste vraisemblable : un test de dépistage positif à 90 % chez les
malades, pas à 15 %), deux événements, l'arbre A/Ā puis B/B̄ :

* **direct** — P(A), P_A(B), P_Ā(B) donnés : compléter l'arbre (somme 1 à
  chaque nœud), P(A∩B), P(Ā∩B̄) (multiplier le long d'un chemin), P(B)
  (probabilités totales), P_B(A) ≈ (remonter l'arbre) ;
* **inter** — P(A), P(A∩B), P_Ā(B) : la branche P_A(B) se retrouve par
  DIVISION, puis le reste, et P_B(Ā) ≈ ;
* **inverse** — P(A), P_A(B), P(B) : la branche P_Ā(B) se retrouve en
  soustrayant (P(Ā∩B) = P(B) − P(A∩B)) puis en divisant par P(Ā) ; la séance
  finit par une conditionnelle sachant B̄.

**Tout se calcule en entiers.** Les données sont des pourcentages entiers
(centièmes) ; intersections et probabilité totale sont des dix-millièmes
entiers (`apbVal`). Les réponses exactes sont des décimaux à quatre chiffres
au plus, jugées à 10⁻⁹ près — aucune erreur flottante ne peut rougir une copie
juste. Seule la dernière ligne, un quotient, porte « ≈ » : arrondi au
millième (l'arrondi de la saisie au millième doit être celui de la valeur, et
l'écart sous 0,0006) ; la valeur exacte en fraction y est acceptée aussi. Le
juge (`apbLireNb`) ne lit qu'un décimal ou un quotient de deux décimaux : un
produit tapé (« 0,4 × 0,3 ») n'est pas une réponse.

**L'arbre recopie les cases.** Les lignes qui remplissent une branche
(`br`) écrivent leur saisie sur le dessin pendant que l'élève tape (« … » tant
que la case est vide) ; à la vérification, chaque branche fausse ou vide y
prend la bonne valeur, en vert. L'arbre est un SVG construit par la page (pas
un fichier de `dessins/`) : comme celui du 3.9 de la Première, il dépend des
nombres tirés.

**Un bord vu en ouvrant la page sur un téléphone** : une case jamais tapée n'a
pas de largeur posée (`sa2Ajuster` ne joue qu'à la saisie), et la correction
écrite par `corrCase` non plus — l'input nu prenait sa largeur par défaut et
repliait sa rangée sous l'étiquette. Le rendu et la correction ajustent donc
chaque case.
