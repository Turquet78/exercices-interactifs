# Seconde — le thème 8, Vecteurs

**Le thème vient EN DERNIER** (thème 8, v473) : un thème ajouté à la fin ne
renumérote rien — les sept premiers gardent leurs numéros, et aucun renvoi
{identifiant} ne bouge. Le contrôle de l'exercice relit les numéros de 2.1,
5.1, 6.1.1, 7.1 et 7.8 pour le prouver.

## {translation-grille} — image d'un point par une translation (8.1, v473)

**La demande** (Turquet, octobre 2026) : « en seconde créer un exercice comme
l'image », une fiche papier. En haut, huit vecteurs dessinés, v₁ à v₈ : vers
le haut, vers le bas, vers la gauche, vers la droite, puis les quatre
diagonales (haut-gauche, haut-droite, bas-droite, bas-gauche). Dessous, une
grille de six colonnes et quatre lignes, un point nommé à chaque croisement,
les lettres en serpentin : A B C D E F, puis L K J I H G, puis M N O P Q R,
puis X W V U T S. Enfin un tableau de six lignes « … a pour image … par la
translation de vecteur … » : quatre lignes donnent le point et le vecteur et
demandent l'image ; deux donnent le point et son image et demandent le
vecteur.

**La fiche, relue par le juge** : L → A par v₁, L → M par v₂, N → M par v₃,
H → G par v₄, puis I → O (une case vers le bas et une vers la gauche : v₈) et
T → P (une case vers le haut et une vers la gauche : v₅). C'est la copie
témoin du contrôle, posée telle quelle sur la première page.

**Trois pages, six cases par page, barème 18** — et le nombre de pages suit
le réglage « Questions » du devoir (`dmNbQuestions(3)`, tirage par
`distinctes()`). Chaque page tire **six directions différentes** sur les huit,
dans l'ordre de la fiche (quatre images, puis deux vecteurs), et pour chacune
un point de départ dont l'image **reste sur la grille** : un point du bord ne
part jamais vers l'extérieur. Un point peut servir deux fois, comme L sur la
fiche.

**La numérotation des vecteurs est tirée par page** (`q.ordre`, une
permutation des huit directions) : la première page suit la fiche — v₁ vers
le haut, v₂ vers le bas… —, les suivantes mélangent, pour que l'élève relise
la figure plutôt que de retenir « v₁, c'est le haut ». L'ordre ne fait pas
une autre question (`ordre` est dans `CLE_HORS`) : deux pages qui posent les
mêmes déplacements sont la même page.

**On range les indices, jamais les réponses** : une ligne porte le point de
départ (`p`, ligne × 6 + colonne), la direction (`d`, 0 à 7) et ce qu'on
demande (`t`) ; `vtrLignes()` recalcule l'image et le numéro du vecteur dans
la fonction qui corrige. Les deux figures sont des SVG écrits par la page
(`vtrSvgVecteurs`, `vtrSvgGrille`) : les flèches des vecteurs sont **à
l'échelle d'une case** (chaque composante vaut la même longueur, une
diagonale est donc plus longue qu'un côté — c'est un vrai vecteur de la
grille, pas un pictogramme), et les textes font 17 px, 12 px pour l'indice
d'un vecteur, ce que le contrôle des graphiques exige.

**La case de l'image est une saisie d'une lettre**, à la taille des lettres
qui l'entourent (`.vtr-in` et `.vtr-pt` ont le même corps), jugée sans tenir
compte de la casse — « a » vaut « A ». **Le vecteur se choisit dans une
liste** v₁ à v₈ (`.plc-sel.vtr-sel`, en italique à empattements comme la
lettre d'un vecteur). La correction passe par `corrChoix` — une case vide
reçoit la réponse en vert et ne rougit jamais, une liste fausse reçoit le
badge « v₈ » à côté d'elle (`.vtr-x`, comme `.rpd-x` au 7.8) —, et le message
dit le déplacement de la première case fausse : « Le vecteur v₁ déplace d'une
case vers le haut : en partant de L, on arrive en A. »

**La flèche au-dessus de la lettre v** est posée par CSS (`.vtr-fl::before`),
dans les lignes comme dans le rappel ; dans une `<option>`, qui ne porte pas
de balise, le vecteur s'écrit « v₁ » avec un indice Unicode (`vtrVecTxt`),
et c'est cette écriture que reprennent les messages, la note enregistrée et
le contexte envoyé au modèle.

**Le juge** (`tests/verifier.js`, « image d'un point par une translation ») :
la place (8.1, thème « Vecteurs », les autres thèmes inchangés, pas de bouton
des tables), la grille et les huit déplacements de la fiche, 300 séances
tirées (trois pages, six lignes, directions distinctes, image sur la grille,
quatre images puis deux vecteurs, première page dans l'ordre de la fiche,
pages distinctes, 900 pages dont au moins 200 différentes, aucune fonction
rangée), 200 pages dont les images et numéros sont **reconstruits à part**
(une grille et des déplacements écrits dans le contrôle), puis le bouton sur
la fiche : la copie juste (6/6, score 6, les deux figures, huit flèches,
vingt-quatre lettres, la liste de v₁ à v₈), la minuscule acceptée, le piège
du sens inversé (M au lieu de A pour v₁ : rouge, les cinq autres restent
justes, le message nomme « vers le haut » et « arrive en A »), le piège sur
un vecteur (v₇ au lieu de v₈ : rouge, badge « v₈ »), deux cases vides (vertes,
remplies, « il te manquait 2 cases »), la copie entièrement vide (rien ne
rougit), et le soutien au fil de la saisie (peint sans verrouiller).

## {translation-quadrillage} — déplacer un point en suivant le chemin u⃗ (8.2, v474)

**La demande** (Turquet, octobre 2026, une autre conversation que celle du 8.1 :
« en seconde créer un exercice comme le pdf joint ») : la *fiche 2 sur les
vecteurs*. Un quadrillage où une flèche u⃗ est dessinée, des points A, B, C,
D, E, et la consigne « déplacer le point A en suivant le chemin u⃗ et appeler
le nouveau point A′ » ; puis le même quadrillage sans flèche, où le chemin
est « celui qui va de A à B » (le vecteur AB⃗), et des points C, D, E, F, G à
déplacer. En bas de la fiche, la phrase à retenir : « *l'image de A par la
translation de vecteur u⃗ est le point A′* ». Les deux conversations ont
créé le thème 8 le même jour ; celle-ci a repris `main` et s'est rangée
DERRIÈRE le 8.1 — ajouté en dernier, l'exercice ne renumérote rien.

**{translation-quadrillage} (8.2) : les deux exercices de la fiche sont les
deux FORMES du tirage.** `q.forme` vaut `'u'` (la flèche dessinée, nommée u⃗,
les points à déplacer sont A, B et C) ou `'ab'` (deux points A et B SANS
flèche — lire le chemin fait partie du travail —, les points à déplacer sont
C, D et E). Trois images par question, quatre questions par séance
(`TRL_NB`, et `dmNbQuestions()` quand un devoir règle autrement), tirées par
`distinctes()` sur la clé des données : le vecteur s'appelle `vec`, pas `v` —
`v` est la tournure, que la clé écarte, et deux questions aux vecteurs
différents auraient passé pour la même.

**Le tirage est garanti LISIBLE, et le contrôle le relit sur deux cents
séances.** Tous les points — les trois sources, leurs trois images, et A et B
ou les deux bouts de la flèche — sont dans le quadrillage (13 colonnes sur 9
lignes), deux à deux NON VOISINS (distance de Tchebychev ≥ 2 : deux
étiquettes côte à côte se liraient l'une sur l'autre), et aucun point nommé ne
tombe sur la flèche u⃗ (ses nœuds intermédiaires se comptent par le pgcd des
composantes). Le chemin fait au moins deux carreaux. La question ne porte que
`forme`, `vec`, `o` (l'origine de la flèche, ou le point A), `src` et `rep`
(trois `null` au tirage) ; elle survit au JSON de la pause. Éprouvé par
sabotage : des points seulement « distincts » au lieu de « non voisins » ont
rougi dès le premier tirage, quatre paires nommées.

**La bonne réponse n'est jamais rangée à côté de la question.** L'image de
chaque point se recalcule (`trlImage`) depuis la source et le vecteur — les
données MÊMES qui dessinent le quadrillage —, par la fonction qui corrige
(`trlCheck`), par le dessin de la correction et par le contexte du modèle. Une
image calculée de travers (le `−` à la place du `+` sur la seconde
composante) a rougi au tirage même, avant d'atteindre le juge.

**Le geste est celui de {placer-image}, avec trois stylos.** Le point se POSE
au clic sur un nœud ; l'écouteur est DÉLÉGUÉ à l'hôte, le SVG étant réécrit à
chaque pose ; `trlNoeud()` relit la géométrie dans le SVG RENDU (`data-m`,
`data-c`, `data-w`, `data-h`) et s'accroche au nœud le plus proche — aucune
coordonnée recopiée. Trois images, donc trois stylos « ● Placer A′ », « ●
Placer B′ », « ● Placer C′ » (`trlChoisir`) : poser un point passe au stylo
suivant encore vide, recliquer sur un de ses points le RETIRE et rend son
stylo, cliquer ailleurs avec le même stylo le déplace. jsdom n'a pas de mise
en page : le clic, le stylo qui avance et le reclic qui retire ne se mesurent
que dans le banc navigateur (« 6 quadragies bis »), qui clique le bon nœud,
un nœud décalé d'un tiers de maille, et retire au reclic. Le banc principal,
lui, pose `rep` à la main — la répartition de {placer-image}.

**La demande en énoncé, le mode d'emploi en plus petit.** « Déplace les points
A, B et C en suivant le chemin u⃗ : place les points A′, B′ et C′, images de
A, B et C par la translation de vecteur u⃗. » est l'énoncé (`.lv-instr`, qui
prend l'encadré) ; le geste — choisir le stylo, cliquer le nœud, déplacer,
retirer — se lit après, dans `.trl-sous`, à 0,85 rem contre 1,04. Le nom d'un
vecteur est une lettre coiffée d'une flèche : la classe `.vec`, dont le
`::before` porte la flèche, dans l'énoncé, le rappel et les corrections ; sur
le dessin, un « u » en fonte mathématique sous un petit trait fléché.

**Chaque image se juge SEULE, et une image manquante ne rougit jamais.** La
copie juste vaut 3 ; une image fausse coûte son point et pas celui des deux
autres ; une image NON POSÉE n'est pas une erreur : sa pastille (`pts-case`,
comptée par `ptsEcran`) ne rougit pas — en entraînement elle devient `sol`
(verte) et le dessin montre l'image attendue en vert : un anneau, son
étiquette, et le chemin depuis la source en pointillés ; en soutien rien ne
se révèle et rien ne se verrouille tant que la copie n'est pas juste, la
pastille et le point se colorent à la pose (`trlLive`). Vérifier sans AUCUN
point ne peint rien et ne verrouille rien : le message redit le geste. Les
encres suivent la convention commune — le point de l'élève est bleu, rouge
quand il est faux, la correction verte (`.trl-sol`, le motif de `.pim-sol`) —
et le banc « 9 bis » les relit comme toutes les autres. Éprouvé par sabotage
des deux côtés : une pastille vide peinte en rouge a rougi (« n'est pas sol,
elle est bad »), et un soutien qui verrouille une copie fausse a rougi trois
fois (verrouillage, révélation, copie corrigée).

**Le contexte envoyé au modèle dit le chemin en carreaux.** « 3 carreaux vers
la droite et 2 carreaux vers le bas » (`trlChemin`), les points en (colonne ;
ligne) comptées depuis le coin bas gauche, ce que l'élève a posé (juste, FAUX,
pas encore posé), et les images attendues derrière `CTX_SECRET`. La même
phrase en carreaux sert la correction écrite à l'élève. Le bouton des tables
n'est pas proposé : on n'y multiplie rien (`TABLES_SANS`, et `tablesAide.sans`
dans le profil — deux sources, donc un vrai contrôle).

**Ce qu'aucun banc ne voit** : la fiche 1 (construire le point D tel que ABDC
soit un parallélogramme) n'est pas portée — Turquet a précisé que la fiche 2
était « le bon fichier » ; et la phrase à compléter « l'image de B par la
translation de vecteur … est le point … » de la fiche est dite dans la
correction et le rappel, pas demandée dans une case.
