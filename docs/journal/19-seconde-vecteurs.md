# Seconde — le thème 8, Vecteurs

**Le thème est né en octobre 2026** (v472), à la demande de Turquet, d'après
la « Fiche 1 sur les vecteurs » — un document Word imprimé : deux exercices,
huit quadrillages chacun, trois points posés d'une croix sur chaque
quadrillage, et la consigne « En utilisant le quadrillage, construire le
point D tel que ABDC est un parallélogramme » (exercice 1), puis « … tel que
ABCD est un parallélogramme » (exercice 2). Au-dessus de chaque exercice, la
phrase à compléter : « ABDC est un parallélogramme signifie que : le chemin
qui va de ….. à ….. est le même que celui qui va de C à D. »

**Le thème vient EN DERNIER** (thème 8) : un thème ajouté à la fin ne
renumérote rien, et les sept premiers gardent leurs numéros. Il n'a pas de
sous-thème : un seul exercice, numéroté 8.1 — le jour où un second arrive,
il prend la place 8.2 sans que rien ne bouge.

## {parallelogramme-point} — le quatrième point d'un parallélogramme (8.1, v472)

**Une question = un quadrillage = trois cases.** Le quadrillage est celui de
la fiche : 9 carreaux sur 9, les nœuds de 0 à 9 dans chaque sens, les trois
points marqués d'une croix et d'une lettre — jamais le caractère « x », qui
tomberait sous la règle de l'inconnue en italique : la croix est deux traits
SVG. Les deux premières cases sont les deux lettres de la phrase (deux listes
A, B, C, D) ; la troisième est le nœud posé, qui doit être D exactement. La
séance tire six questions (`dmNbQuestions(6)`), la première moitié en ABDC
comme l'exercice 1 de la fiche, la seconde en ABCD comme l'exercice 2 ;
barème 18.

**La forme change la réponse, et c'est le piège de la fiche.** Dans ABDC les
sommets se suivent A, B, D, C : D est en face de A, et le chemin de A à B
est celui de C à D. Dans ABCD ils se suivent A, B, C, D : D est en face de
B, et le chemin de **B à A** est celui de C à D. La phrase attendue sort de
`vecChemin(q)`, le point de `vecQuatrieme(q)` — tous deux recalculés dans la
fonction qui corrige. **On range les trois points et la forme, jamais D.**

**Le tirage refuse trois choses**, cinq cents essais au plus : trois points
alignés (le déterminant est nul, il n'y a pas de parallélogramme) ; un D qui
sortirait du quadrillage — l'élève ne pourrait pas le poser ; deux points à
moins de deux carreaux l'un de l'autre, D compris, parce que leurs lettres se
chevaucheraient. Le repli, jamais atteint en pratique, est un
parallélogramme valable dans les deux formes. Les questions passent par
`distinctes()` : deux quadrillages d'une même séance n'ont jamais les mêmes
trois points dans la même forme.

**Le quadrillage ne peint rien au fil des clics.** Chaque nœud libre est une
cible — invisible, elle ne se montre qu'au survol —, avec la zone de touche
de 14 px à l'écran de {solutions-graphique} (un trait de longueur nulle à
bouts ronds, `vector-effect:non-scaling-stroke`, dans une couche dessinée
AVANT les cibles). Cliquer un nœud y pose D en bleu, cliquer un autre nœud
l'y déplace, re-cliquer le nœud posé le retire : un seul D à la fois. La
sélection vit dans la question (`q.selD`) : elle part avec la pause et
revient avec la reprise. Colorer le nœud au moment où on le pose dirait s'il
est juste avant même de vérifier : l'exercice est déclaré dans
`soutienEnDirect.sans`, raison écrite, comme « tvg ».

**Le soutien colore à la vérification, sans montrer D.** Les lettres passent
par `corrChoix` — la juste en bleu et figée, la fausse en rouge sans badge,
la vide neutre ; le nœud juste devient bleu et figé (`test.vecFige`), le
nœud faux rouge, à déplacer. Le message dit la méthode — compter le chemin
en carreaux, le refaire depuis C, relire l'ordre des lettres —, jamais les
deux lettres ni la position de D.

**La correction finale trace la figure.** Bleu pour ce qui est juste, rouge
pour ce qui est faux, vert pour la bonne réponse : la lettre attendue en
badge à côté d'une liste fausse (ou écrite dans la liste vide, classe
`sol`), D en vert sur le quadrillage s'il manquait ou était ailleurs, et par
dessus le parallélogramme en pointillés verts avec ses deux chemins égaux
fléchés — celui de la phrase, et celui de C à D. Le pourquoi ne parle que
des vraies fautes : l'ordre des lettres pour la phrase (« D est en face de
A »), le chemin compté en carreaux pour le point (« 3 carreaux vers la
droite puis 2 carreaux vers le haut ») ; une case vide passe par
`msgAvecVides`, qui dit d'abord ce qui manquait.

**Ce que le modèle sait** (`ctxVec`) : le quadrillage décrit par ses
coordonnées — il ne voit pas le dessin —, la forme, les trois points, ce que
l'élève a choisi et posé, et les réponses attendues sous clause de secret :
ni les deux lettres, ni la position de D. La méthode qu'il doit faire
appliquer est celle du rappel (`RAP_VEC`) : lire les lettres dans l'ordre,
repérer les côtés opposés, compter le chemin, le refaire depuis C.

**Le poids d'une question se lit par la convention de nommage** :
`vecCases(q)` rend ses trois identifiants, et un devoir qui coupe la séance
coupe le barème avec elle. Le nœud posé est une `pts-case` (le bloc de la
consigne b), peint `ok`, `bad` ou `sol`) : la note affichée compte bien
trois cases, pas deux.
