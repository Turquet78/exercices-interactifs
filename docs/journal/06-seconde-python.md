# Seconde — algorithmique et Python

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Un programme Python se PRÉDIT avant de s'EXÉCUTER — et il s'exécute dans
la page, sans rien charger.** {python-affichage} (Seconde, thème 5
« Algorithmique et Python », demande de Turquet, septembre 2026 : « est-il
possible de créer un exercice qui donne le programme Python comme dans le
PDF et qui affiche le résultat quand on l'exécute ? », puis « prédire
d'abord, puis le bouton exécuter se débloque ») est repris de l'exercice 9
du carnet : trois variables, un print, et « Le programme affiche le texte …
puis … qui est la valeur de la variable … ». L'ordre du carnet — a)
exécuter, b) qu'affiche-t-il ? — est RENVERSÉ : sur un notebook le
professeur est à côté ; ici, un bouton cliquable avant la réponse
transformerait la question en recopie. « Exécuter » ne se débloque qu'une
fois la réponse VÉRIFIÉE — la chaîne de portes de {placer-image}, tenue par
l'ÉTAT du bouton et non par une consigne —, et « Question suivante » attend
l'exécution : voir le programme tourner est le a) de la fiche, pas une
option. En soutien, une copie fausse le laisse verrouillé : la sortie EST la
réponse.
**Trois chemins mesurés pour « exécuter », et le plus petit l'a emporté** :
Pyodide (un vrai CPython en WASM, 9,6 + 2,2 Mo — neuf fois la page),
Brython (1,1 Mo depuis un CDN), ou un interpréteur MAISON du sous-ensemble
d'une première séance — affectations, nombres, textes, + − × / // % **,
print à plusieurs arguments, str/int/float — en cent lignes et zéro réseau.
Les deux premiers sont une dépendance de plus dont la panne rend
« Exécuter » MORT sans une erreur, sur le réseau d'un lycée ; le troisième
est éprouvé : 0 écart avec CPython 3.11 sur 1 600 programmes tirés.
**Le risque propre est l'interpréteur qui MENT, et il ne se relit pas** :
sur 27 cas limites choisis exprès, le premier prototype divergeait 7 fois —
`round()` (Python arrondit AU PAIR : round(2.5) vaut 2), l'écriture des
flottants extrêmes (1e16 et 0.00001 basculent en exponentielle à d'autres
seuils qu'en JavaScript), la priorité de « ** » (2 ** 3 ** 2 vaut 512,
−2 ** 2 vaut −4). L'élève aurait prédit juste, la page aurait affiché sa
propre erreur et l'aurait compté faux — le pire défaut du projet, par la
porte d'un exécuteur. TROIS POSITIONS, la doctrine du juge : ce que
l'interpréteur sait faire, il le fait comme CPython (l'écriture des
flottants réécrite aux seuils de Python — 100.0 s'affiche 100.0, 4 / 2
s'affiche 2.0) ; ce qu'il ne sait pas faire — round, un entier au-delà de
2^53 — il le REFUSE en nommant, plutôt que de répondre à côté ; et le
tirage n'emploie ni **, ni round, ni /. **Le banc compare la page à un VRAI
python3**, tirage après tirage (240 programmes) et sur les cas limites
épinglés avec la sortie de CPython 3.11 — la seconde méthode qui n'a rien
en commun avec la première. python3 est sur ubuntu-latest ; sans lui,
l'intégration continue ROUGIT (« la sortie n'a été comparée à RIEN ») et
une machine de développement le dit en « non applicable » — le motif de
base.js, pris du bon côté.
**La sortie affichée et la correction sortent de la MÊME fonction** : le
bouton, le juge (`pyAns`) et le message lisent tous `pyRun(q.src)` ; la
question ne porte que le programme, le visage tiré et l'ordre des
propositions — le contrôle refuse tout autre champ.
**Les quatre visages sortaient chacun UNE fois par séance, en ordre
mélangé** : entier, décimal (Python l'écrit avec un point), texte (il
s'affiche sans ses guillemets), variable RÉAFFECTÉE — c'est la DERNIÈRE
valeur qui compte, et l'ancienne est proposée. Le quatrième a été RETIRÉ
le mois suivant (paragraphe ci-dessous). Les propositions ne
diffèrent que par ce qui fait l'erreur (la leçon d'{intervalles-inegalite})
: le texte AVEC ses guillemets, le NOM de la variable à la place de sa
valeur, la valeur d'une AUTRE variable. Tout se choisit dans des listes —
à chasse fixe, ce sont des morceaux de code —, jamais tapé. Aucune
correction au fil des clics, et c'est déclaré (`soutienEnDirect.sans`) : à
quatre propositions, il suffirait d'essayer.
**Le thème 5 vient EN DERNIER, et c'est ce qui rend l'ajout sûr** : un
thème ajouté à la fin ne renumérote rien, et le contrôle exige que le
pourcentage reste 3.1. **Et le rappel de cours ne cite AUCUN décimal** : le
contrôle des numéros en dur lit tout « chiffres.chiffres » d'un rappel
comme un numéro d'exercice, et « 15.5 » l'aurait fait rougir — la règle du
point s'y dit en mots.
Deux bancs, la répartition habituelle : jsdom tient la fiche épinglée, la
place au menu, le tirage (400 séances), la copie juste CLIQUÉE, la copie
fausse, le soutien, les branchements et CPython ; le NAVIGATEUR (« 6 vicies
decies », déclaré par `pythonAffichage` dans `tests/profils.js`) mesure ce
que jsdom ne voit pas — le code et la console RENDUS à chasse fixe, un VRAI
clic sur le bouton verrouillé qui ne fait rien, les trois listes choisies
pour de vrai, la console au RECTANGLE, et le soutien. Les contrôles
universels des deux bancs ont couvert l'exercice au premier passage sans
rien déclarer, exactement ce pour quoi ils existent. Seize sabotages au banc jsdom, chacun rougissant en nommant son défaut — les
deux mensonges de l’interpréteur (« 2 » pour 2.0, « ** » associé à gauche),
`round` imité au lieu d’être refusé, « Exécuter » cliquable d’emblée, le
soutien qui débloque sur une copie fausse, « Question suivante » avant
l’exécution, la réaffectation perdue, le piège des guillemets retiré des
propositions, la case vide rougie, la copie juste à un point, la séance à
trois questions, le thème disparu, le décimal dans le rappel, la correction
au fil des clics, le bouton des tables revenu, la sortie rangée à côté du
programme. Et un dix-septième que seul le NAVIGATEUR voit : la chasse fixe
retirée du code et de la console — jsdom, qui ne lit pas une police, reste
vert à bon droit, et le navigateur nomme l’encre (« Nunito, system-ui… »).
La campagne a restauré la page depuis une copie propre hors dépôt à chaque
tour, et le sabotage du navigateur s’est joué dans une copie de travail
séparée, pendant que la page propre passait son propre banc.

**Puis la variable RÉAFFECTÉE a quitté le tirage : une variable ne s'affecte
qu'UNE fois par programme.** Demande de Turquet (septembre 2026) : « en
seconde dans l'exercice 5.1 je ne veux pas qu'il y ait deux fois la même
variable dans les égalités, par exemple age = 14 puis age = 15 ». C'était le
quatrième visage — la réaffectation, avec l'ancienne valeur proposée en
piège. Il est retiré des trois endroits qui le portaient, parce que n'en
tenir qu'un ne tient rien : le TIRAGE (`PY_VISAGES` n'a plus que l'entier,
le décimal et le texte, et `pyTirage` n'insère plus de seconde affectation),
le MESSAGE de correction (la phrase « c'est sa DERNIÈRE valeur qui
s'affiche » n'a plus d'occasion) et les AIDES — la règle ④ du rappel, la
question à l'IA « que se passe-t-il si la variable change de valeur avant
le print ? » et la clause du contexte : un rappel qui enseigne un cas que
l'élève ne rencontrera jamais est la leçon du 2.2.8 (« un rappel qui montre
un tirage impossible »), et la question à l'IA est remplacée par l'écriture
du nombre à virgule, qui EST un des trois visages.
**La séance garde ses QUATRE questions** (`PY_NB`, deux sources) : les trois
visages sortent chacun au moins une fois, la quatrième question reprend l'un
d'eux au hasard, ordre mélangé — le motif de {pourcentage-synthese}
(« chacun au moins une fois, mélangés »). Raccourcir la séance n'était pas
demandé, et l'interpréteur, lui, sait toujours réaffecter (`x = x + 1` reste
un cas limite épinglé contre CPython) : ce qui change est ce que le tirage
POSE, pas ce que la page sait exécuter.
**Le contrôle EXIGE la propriété sur chaque tirage plutôt que de la
supposer** : il relit chaque ligne d'affectation du programme et rougit en
nommant la variable affectée deux fois — une réaffectation revenue par une
autre porte ne casserait rien, et personne ne la verrait avant un élève. Le
bord OPPOSÉ compte autant : les trois visages doivent encore sortir tous, et
le rappel ne doit plus enseigner la réaffectation. Trois sabotages, chacun
rougissant en nommant son défaut — la seconde affectation remise dans le
tirage (« la variable « points » est affectée deux fois »), le visage texte
perdu, la règle ④ remise dans le rappel.

**Les trois types de variables s'EXPLIQUENT sur l'écran, puis se TESTENT —
et c'est Python qui a le dernier mot.** {python-types} (Seconde, 5.2,
demande de Turquet, septembre 2026 : « créer un exercice qui explique les 3
types de variables et qui teste les élèves ») est repris de la page « Types
de variables » du cours : 15 est un `int` (un entier relatif), 15.5 un
`float` (un nombre à virgule, écrit avec un point), "15H30" un `str` (une
chaîne de caractères — il y a le H, qui n'est pas un chiffre) et "Thomas"
aussi (ce n'est pas un nombre). Les trois cadres du cours sont SUR l'écran,
à chaque question — l'exercice explique avant de tester, c'est la demande —,
puis un programme de trois affectations, et le type de chacune à choisir
parmi int / float / str. Puis « Exécuter », qui ne se débloque qu'après la
vérification (la chaîne de portes de {python-affichage}) : le programme
porte un `print(type(…))` par variable, et c'est l'interpréteur de la page
qui répond `<class 'int'>` — il a appris `type()` pour l'occasion, écrit
comme CPython l'écrit, et refuse en nommant toute opération sur un type.
**LE TYPE ATTENDU N'EST JAMAIS RANGÉ À CÔTÉ DE LA QUESTION** : il est lu dans
l'état final de `pyRun`, la fonction MÊME qui exécute le programme sous le
bouton, si bien que la correction ne peut pas contredire la console. La
question ne porte que le programme et le visage, et le contrôle refuse tout
autre champ.
**Quatre visages, chacun une fois par séance, en ordre mélangé, et deux
d'entre eux sont des CONTRASTES** — le même nombre sous deux écritures,
c'est le contraste qui enseigne : le trio du COURS (le jeu de
{python-affichage} : un entier, un décimal, un texte) ; les GUILLEMETS
("2026" contre 2026 — ce sont les guillemets qui décident, pas les
chiffres) ; le POINT (15.0 contre 15 — un point fait un float, même à partie
décimale nulle) ; le MÉLANGE ("15H30", une lettre parmi des chiffres, et
−3, négatif mais entier). Le nombre de types par question VARIE d'un visage
à l'autre — un élève qui aurait appris « un de chaque » se tromperait, et le
contrôle exige cette variation — et les noms des variables des pièges ne
disent rien de leur type. Le message de la correction nomme ce qui décide —
les guillemets, le point, le signe — et la bonne réponse se montre en vert à
côté de la case rouge, en entraînement seulement ; aucune correction au fil
des clics (`soutienEnDirect.sans`) : à trois propositions, il suffirait
d'essayer.
**Un nombre dans une balise `code` n'est pas un numéro d'exercice.** Le
rappel de cours doit montrer 15.5 et 15.0 — un rappel sur les types sans un
seul décimal n'enseignerait pas le float —, et le contrôle des numéros en
dur lisait « 15.5 » comme le numéro d'un exercice. Il retire désormais le
contenu des balises `<code>` AVANT de chercher : du code est du code, pas de
la prose, et une référence à un exercice ne s'écrit jamais dans une balise
code. Le bord opposé est tenu par sabotage : « (voir l'exercice 5.1) » écrit
dans la PROSE du même rappel rougit toujours.
Deux bancs, la répartition habituelle : jsdom tient la page du cours
épinglée, la place au menu (5.2, rien d'autre ne bouge), le tirage (400
séances), la copie juste cliquée, la copie fausse sur le visage des
guillemets et sa raison, le soutien, les branchements, et `type()` comparé à
un vrai CPython sur 172 programmes ; le NAVIGATEUR (« 6 vicies undecies »,
déclaré par `pythonTypes` dans `tests/profils.js`) mesure ce que jsdom ne
voit pas — les trois cadres RENDUS côte à côte, au rectangle, puis empilés
sur toute la largeur d'un téléphone, le code et la console à chasse fixe, le
vrai clic sur le bouton verrouillé, les trois listes choisies pour de vrai et
les trois `<class '…'>` à l'écran. Dix-sept sabotages au banc jsdom, chacun rougissant en nommant son
défaut — `type()` retiré de l’interpréteur, `<class int>` sans les
apostrophes de CPython, « Exécuter » cliquable d’emblée, le soutien qui
débloque sur une copie fausse, « Question suivante » avant l’exécution, la
case vide rougie, le contraste des guillemets perdu, le `.0` du point perdu,
un type de chaque à toutes les questions, le type rangé dans la question, les
cadres retirés de l’écran, la copie juste à un point, l’exercice hors du
thème, la correction au fil des clics, le bouton des tables revenu, le numéro
d’exercice dans la prose du rappel, le message qui ne nomme plus les
guillemets — et un dix-huitième que seul le NAVIGATEUR voit : les trois cadres
cachés par une règle CSS (`display:none`). jsdom lit le DOM, où les cadres
existent, et reste vert à bon droit ; le navigateur les mesure au rectangle et
nomme le vide (« 0x0 / 0x0 / 0x0 »). La campagne a restauré la page depuis une
copie propre hors dépôt à chaque tour, et le sabotage du navigateur s’est joué
dans une copie de travail séparée, pendant que la page propre passait son
propre banc.

**Afficher une variable, c'est la première ligne de Python que l'élève ÉCRIT —
et le juge l'EXÉCUTE au lieu de la comparer.** {python-afficher-variable}
(Seconde, 5.3, demande de Turquet, septembre 2026 : « expliquer comment on
affiche une variable en python, puis l'élève doit compléter un programme qui
commence par note = 12 pour qu'il affiche la valeur de cette variable ; il
peut exécuter ce programme ; il faut vérifier le résultat et en mode soutien
expliquer où se trouve l'erreur ») ferme le thème 5 : le 5.1 fait LIRE un
programme, le 5.2 fait CLASSER des variables, celui-ci fait ÉCRIRE. Le cours —
comment on affiche une variable — est SUR l'écran, avant le programme, sur une
variable qui ne sort jamais du tirage (« nombre ») : l'élève transpose, il ne
recopie pas. La première ligne (« note = 12 ») est écrite par la page ; l'élève
écrit la suite dans une zone à chasse fixe, à la taille de la ligne qu'elle
prolonge.
**LA PREMIÈRE QUESTION EST CELLE DE LA DEMANDE — note = 12, toujours —**, puis
les trois types du 5.2 chacun une fois, en ordre mélangé : un décimal
s'affiche avec son point, un texte s'affiche SANS ses guillemets — et c'est
lui qui tend le piège print("prenom"). Le contrôle exige les deux : la
demande en tête, et les types mélangés derrière.
**LE JUGE NE COMPARE JAMAIS À UNE LIGNE ATTENDUE : il exécute la copie** avec
`pyRun`, l'interpréteur même du bouton « Exécuter » — la console et la
correction ne peuvent donc pas se contredire — et exige que la sortie soit la
valeur de la variable, et elle seule. Puis LA SECONDE MÉTHODE, celle qui
distingue « afficher 12 » d'« afficher la variable » : il change la valeur de
la première ligne (note = 47) et rejoue la copie — un programme qui affiche la
VARIABLE la suit, print(12) ne la suit pas, et le message le dit avec ce
nombre-là. print(note), print( note ), x = note puis print(x), print(str(note))
passent ; print(12), print("12"), print("note"), print("la note est", note),
deux print, le nom écrit tout seul sont refusés — chacun pour SA raison. Toute
écriture juste est acceptée, la leçon d'{ecrire-solutions} : refuser une
écriture juste serait le pire défaut du projet, par la porte d'un exécuteur.
**ET IL DIT OÙ.** Chaque refus porte le LIEU de l'erreur — la ligne (la ligne 1
est celle que la page écrit, la première de l'élève est donc la ligne 2) et le
mot — et sa RAISON, jamais la réponse : c'est ce que le soutien affiche
(« Erreur repérée à la ligne 2, dans le mot « Print ». Python ne connaît pas
« Print » : le mot s'écrit print, tout en minuscules. »), et l'entraînement y
ajoute la ligne attendue en vert à côté (badge `mf-cor`). Les diagnostics de
FORME passent avant l'exécution — Print, print sans parenthèses, la parenthèse
jamais refermée ou de trop, le guillemet seul, les guillemets typographiques,
la première ligne RÉÉCRITE (une variable ne s'affecte qu'une fois par
programme : la règle du 5.1, retournée vers l'élève) — parce que
l'interpréteur les nommerait moins bien ; puis l'interpréteur, rejoué ligne à
ligne pour trouver celle qui l'arrête, nomme Note pour note (« Python
distingue les majuscules des minuscules »), une variable inconnue, un mot que
Python ne connaît pas ; puis la SORTIE se lit — le mot au lieu de la valeur,
du texte autour, deux lignes, rien. Le contrôle épingle dix-sept copies avec
leur raison ET leur ligne, et exige que le message ne contienne jamais
print(note) — sauf pour CITER la ligne de l'élève, qui a le droit de la
contenir : le premier jet du contrôle prenait cette citation pour la réponse.
**« EXÉCUTER » EST LIBRE, ET C'EST L'INVERSE DU 5.1** : là-bas le bouton se
débloque après la réponse parce que la sortie EST la réponse ; ici c'est le
programme de l'ÉLÈVE qu'il fait tourner, et il ne peut rien révéler qu'il
n'ait écrit — voir ce que fait sa ligne (« note » pour print("note"), « Erreur :
la variable « Note » n'existe pas ») est la façon même d'apprendre à
programmer, en soutien surtout. La console se vide à la frappe suivante : une
sortie périmée sous un programme modifié mentirait. « Question suivante »
n'attend pas l'exécution : « il peut exécuter », dit la demande.
**L'INTERPRÉTEUR A APPRIS DEUX CHOSES, comparées à CPython** : une ligne qui
n'est qu'une EXPRESSION (« note » tout seul) s'évalue et n'affiche RIEN, comme
dans un script — c'est ce que le cours fait VOIR en exécutant, là où le
5.1 refusait la ligne ; et « print note » reçoit l'erreur de CPython
(« il manque les parenthèses après print »). Une seule divergence, nommée dans
le code : un « print » NU, qui vaut la fonction en CPython et n'affiche rien,
reçoit ici la même erreur — mieux vaut une erreur qu'un silence sur une ligne
inutile. Le banc compare au vrai python3 ce que le juge accepte ET ce qu'il
refuse : 600 programmes tirés (print(nom), print(valeur), print("nom"), le nom
seul, une variable inconnue) et vingt-et-une copies épinglées — même sortie,
ou plantage des deux côtés.
**La copie VIDE n'est pas vérifiée** : rien n'est peint, rien n'est verrouillé,
le message redemande la ligne (la règle de {placer-image}). Aucune correction
au fil de la frappe (`soutienEnDirect.sans`) : une ligne de code à moitié
tapée est toujours fausse. La zone est une `pts-case` : la note affichée la
compte (« 1 case juste sur 1 »), et la copie voyage dans la question (`q.rep`)
— `captureBoxes` ne connaît pas les textarea, c'est la question que la pause
photographie, et le rendu la remet. Le banc NAVIGATEUR (« 6 vicies
duodecies », déclaré par `pythonAfficherVariable` dans `tests/profils.js`)
tient ce que jsdom ne voit pas : la zone rendue à chasse fixe et à la taille
de la ligne qu'elle prolonge, une VRAIE frappe au clavier, un vrai clic sur
« Exécuter » et la console qui suit, l'encre RÉSOLUE des verdicts et la
correction verte dans une boîte visible, la page qui ne déborde pas sur un
téléphone, puis le soutien qui nomme la ligne et le mot sans écrire la réponse.

**Le nom d'une variable se juge, et l'incorrect se JUSTIFIE.**
{python-noms-variables} (Seconde, 5.4, demande de Turquet, septembre 2026 —
« un exercice qui rappelle ce que l'on peut mettre pour le nom d'une variable
en Python et faire un exercice comme le 4 ; il faudra compléter une
justification si c'est faux ») suit {python-afficher-variable} au menu, repris de la
fiche « Noms de variables en Python » : le RAPPEL porte ses quatre règles
dans son ordre et avec ses exemples (lettres, chiffres et `_` seulement ; pas
de chiffre en tête ; majuscules et minuscules distinguées ; pas d'accent), et
l'exercice pose des noms — `prix achat`, `prix_achat`, `2ndeG`, `SecondeG`,
`Seconde:G`, `dix-huit`… — dont l'élève dit pour chacun s'il est correct ou
incorrect, et, s'il est incorrect, POURQUOI, en choisissant la règle dans une
liste. Trois questions de six noms, de deux à quatre incorrects par question.
**LA JUSTIFICATION EST UNE PORTE, tenue par l'ÉTAT de la case** (le motif de
{placer-image}) : la liste des raisons est visible mais grisée et fermée tant
que le nom n'est pas déclaré incorrect, s'ouvre dès qu'il l'est, se referme
et se vide si l'élève revient sur « correct ». Le navigateur le mesure sous un
VRAI choix : Playwright refuse de choisir dans une liste fermée, et c'est le
bord qu'on tient. Après une reprise de pause les valeurs reviennent APRÈS le
rendu : `pvnPortes()` rouvre un instant plus tard les justifications des noms
déjà déclarés incorrects — sans quoi l'élève reprenait devant une liste morte.
**LA BONNE RÉPONSE N'EST JAMAIS RANGÉE À CÔTÉ DE LA QUESTION** : celle-ci ne
porte que les noms et l'ordre des raisons ; `pvnDefauts(nom)` — la fonction
qui corrige — relit le nom lui-même, et le contrôle refait la correction par
une SECONDE méthode (l'expression régulière d'un identifiant, et des tests de
caractères qui n'ont rien en commun avec ceux de la page) sur toute la banque.
**UN NOM INCORRECT N'A QU'UN SEUL DÉFAUT, et c'est la banque qui le
garantit** : « 2ème » — un chiffre en tête ET un accent — aurait deux bonnes
justifications dont une seule comptée, une lecture juste comptée fausse. Les
accents ont LEUR règle, la 4 de la fiche, et non la règle 1 : « é » est une
lettre, la raison « caractère interdit » nomme les symboles (espace, -, :, =).
**LES RAISONS NE DIFFÈRENT QUE PAR CE QUI FAIT L'ERREUR** (la leçon
d'{intervalles-inegalite}) : trois vraies règles, et trois PIÈGES qui ne
justifient jamais rien — « il contient une majuscule », « il contient un
chiffre », « il contient le caractère _ » —, les erreurs réelles de l'élève
qui confond « contient » et « commence par », et le message y RÉPOND en
nommant la règle. L'ordre des raisons est tiré par question et le même sur ses
rangées : à forme égale, le rang de la bonne varie. Chaque séance montre les
trois défauts ET les trois pièges parmi les noms corrects (un avec majuscule,
un avec chiffre, un avec `_`) — la composition même de la fiche.
**CHAQUE CASE SE JUGE SEULE** : le verdict d'un nom, et sa justification s'il
est incorrect — un nom correct n'en a pas à compter, sa liste reste sans
couleur. Un nom incorrect déclaré « correct » perd ses deux cases : sa
justification, restée fermée, reçoit la correction en vert, mais elle n'est
pas une case OUBLIÉE et le message ne la compte pas parmi les manquantes
(`induit`) — le premier jet du contrôle s'y est pris, en exigeant « 2 cases
manquantes » sur une page qui disait juste. La case vide ne rougit jamais.
Aucune correction au fil des clics, et c'est déclaré (`soutienEnDirect.sans`)
: à deux propositions, il suffirait d'essayer ; en soutien la case juste se
verrouille en bleu, la fausse rougit sans badge, et la porte se rouvre quand
l'élève corrige son verdict. Le rappel est en HTML pur — rien n'y empile — et
n'écrit aucun « chiffre.chiffre » (le contrôle des numéros en dur lirait un
numéro d'exercice). Deux bancs, la répartition habituelle : jsdom tient la
fiche épinglée, la place au menu, la banque, le tirage (400 séances), la
porte, la copie juste et la copie fausse cliquées, le soutien et les
branchements ; le NAVIGATEUR (« 6 vicies terdecies », déclaré par
`pythonNoms` dans `tests/profils.js`) mesure les rangées d'un seul tenant à
1400 px, le nom rendu à chasse fixe avec ses espaces, la liste fermée qui
refuse un vrai choix, l'encre RENDUE du verdict, et le soutien. Treize
sabotages au banc jsdom, chacun rougissant en nommant son défaut — le juge
qui ignore les accents, « 2ème » glissé dans la banque, la porte ouverte au
rendu, le soutien qui touche la justification fermée, la séance sans ses
trois défauts, le piège de la majuscule tu, la justification fermée comptée
manquante, la règle 3 perdue, le bouton des tables revenu, l'ordre des
raisons figé, le verdict vide rougi, la porte qui ne se rouvre plus après une
reprise, l'exercice sorti du thème 5.

**Nommer une variable, c'est la fiche « Exercice 5 » — et il n'y a pas UNE
bonne réponse, ce qui décide de tout.** {python-nom-variable} (Seconde, 5.5,
demande de Turquet, septembre 2026 : « en seconde créer un exercice comme le
pdf ») suit {python-noms-variables} au menu : quatre grandeurs — le nombre de filles de
Seconde, le tarif d'un repas, l'aire d'une figure, la note à un devoir — et
pour chacune un nom de variable à proposer, dans la cellule du carnet (« La
variable représentant "…" peut être nommée par : … »). nb_filles, nbFilles,
filles et effectif_filles sont tous justes.
**Le juge ne tient donc que ce qui se PROUVE — la FORME du nom — et chaque
règle est ANNONCÉE à l'écran avant que l'élève n'écrive** (la doctrine des
trois positions, prise du côté du refus prouvable ; un critère mesuré sans
avoir été demandé donnerait tort à une copie honnête) : lettres, chiffres et
tiret bas seulement — pas d'espace (la remarque de la fiche), pas de tiret,
pas d'apostrophe —, ne commence pas par un chiffre, n'est ni un mot réservé de
Python ni le nom d'une fonction du cours (print, type, int…), au moins 2
caractères — un nom d'une lettre ne dit pas ce qu'il stocke —, au plus 20
(« pas trop long »). **La longueur minimale a été RETIRÉE** (paragraphe
ci-dessous) : ce paragraphe raconte le juge de son époque. Deux grandeurs d'une même question ne portent pas le
MÊME nom — ce serait une seule variable —, et c'est la règle des paires : la
seconde occurrence est fausse, la première reste défendable ; « Note » et
« note » sont deux noms, comme en Python. La PERTINENCE du nom n'est pas
prouvable : elle est expliquée (le rappel, le contexte du modèle), jamais
notée. Chaque refus se NOMME avec la saisie de l'élève (« le caractère « - »
n'est pas autorisé dans « nb-filles » »), et la correction écrit UN nom
possible en vert, en disant que ce n'est qu'un exemple.
**Les refus sont de DEUX familles, et le banc les départage par un vrai
CPython** : l'espace, le chiffre en tête, le caractère étranger et le mot
réservé sont des refus de Python — sur chacun, `nom = 1` doit lever une
SyntaxError ; la fonction du cours, la lettre seule et le nom trop long sont
des règles de l'EXERCICE, et le banc exige que Python, lui, les ACCEPTE :
c'est ce qui en fait des règles annoncées et non des faits de syntaxe.
L'alphabet du juge est celui de l'INTERPRÉTEUR de la page (pyLex : lettres
latines, accents compris, chiffres, tiret bas), parce que la page ÉCRIT
ensuite le programme avec les noms de l'élève — « nb_filles = 14 » puis
« print("le nombre de filles de Seconde :", nb_filles) » — et « Exécuter »
ne se débloque qu'après la vérification, la chaîne de portes de
{python-affichage} : Python accepte les noms, et l'élève le voit. Le nom faux
ou vide y est remplacé par l'exemple de la correction : un programme qui
reprendrait « nb filles » ne s'exécuterait pas.
**La séance : trois questions de quatre grandeurs, les quatre de la fiche
TOUJOURS dans la séance**, mélangées aux huit autres tirées dans le vivier —
la fiche entière, sans que la première question soit toujours elle ; la
question ne porte que les INDICES des grandeurs (on range l'indice, jamais
l'objet), et le contrôle refuse tout autre champ. Le soutien corrige en
DIRECT — la forme, sans badge, jamais sur une case vide, sous le garde de la
saisie qui retient la couleur tant que la case a le curseur — et la copie
fausse vérifiée ne verrouille rien et ne montre pas le programme.
Deux bancs, la répartition habituelle : jsdom tient la fiche épinglée
(« nb filles » refusé pour l'espace), la place au menu, le tirage (400
séances), le juge cas par cas, le doublon, la copie juste tapée et le
programme aux noms de l'ÉLÈVE, la copie fausse, le soutien, les branchements
et CPython ; le NAVIGATEUR (« 6 vicies quaterdecies », déclaré par
`pythonNomVariable` dans `tests/profils.js`) mesure ce que jsdom ne voit
pas — la cellule du carnet RENDUE, chaque phrase et sa case sur UNE ligne à
chasse fixe et à la même taille, la frappe dans de vraies cases, l'encre bleue
du verdict, le programme et la console rendus, la phrase qui se REPLIE sur un
téléphone au lieu de sortir de l'écran, et l'espace qui rougit à la SORTIE de
la case, jamais pendant la frappe. Les contrôles universels des deux bancs ont
couvert l'exercice au premier passage sans rien déclarer. Deux essais du
contrôle ont d'abord rougi sur une page JUSTE : la recherche de l'exemple
attrapait « aire = » dans « mon3_aire = » — on cherche en tête de ligne —, et
le témoin CPython faisait `print(print)` après avoir renommé print. Un essai
faux se reconnaît à ce qu'il rougit sur du code juste.
**Et un défaut de mise en page ne s'est vu qu'au banc navigateur, à sa
première exécution** : la phrase la plus longue du carnet fait 82 caractères à
chasse fixe (830 px), et dans les 960 px de la cellule Python la case tombait
SOUS sa phrase — une réponse qu'on cherche à la ligne suivante. La cellule de
cet écran est élargie à 1160 px ; sur un téléphone la phrase se replie, et
c'est mesuré aussi. Quatorze sabotages au banc jsdom, chacun rougissant en
nommant son défaut — l'espace accepté, le doublon accepté, le mot réservé, le
tiret et « print » acceptés (les deux premiers nommés aussi par CPython), le
programme écrit avec les exemples au lieu des noms de l'élève, la case vide
rougie, la fiche perdue ou toujours en première question, le soutien
débranché, le badge qui fuit en soutien, « Question suivante » avant
l'exécution, l'exercice sorti de sa place au menu. La campagne a joué dans
une copie séparée du dépôt pendant que le banc navigateur mesurait la page
propre.

**Puis la longueur minimale est tombée : une lettre est un nom.** Signalé par
Turquet sur une capture (septembre 2026) : ses quatre réponses — `v` pour la
vitesse, `l` pour la longueur, `r` pour le rayon, `abs` pour une valeur
absolue — rougissaient toutes les quatre, « il faut accepter les variables que
j'ai placées dans les cases aussi ». Deux règles distinctes les refusaient, et
**une seule est tombée** : la longueur minimale (`PNV_MIN`, retirée). La liste
des fonctions de Python reste, `abs` avec elle — le rappel ④ la couvre
(« Pas un mot de Python : for, if, print, type… »), et c'est une décision à
prendre à part.
**LE GARDE TENAIT SA PROPRIÉTÉ À L'ENVERS, et c'est ce qui l'a fait tomber.** Il
prétendait tenir le ① du rappel (« un nom dit ce qu'il stocke — pas x, qui ne
dit rien ») en COMPTANT des caractères : il refusait donc `v` et `r`, les
notations MÊMES du cours de maths, et acceptait `xy`, qui ne dit rien. Un garde
qui refuse du juste et accepte du faux ne tient pas ce qu'il annonce — et la
doctrine de l'exercice le disait déjà en toutes lettres, une ligne plus bas :
« la PERTINENCE du nom n'est pas prouvable : elle est expliquée, jamais notée ».
La longueur minimale était la seule chose qui la notait, à moitié.
**CE QU'ON PERD EST NOMMÉ, parce que c'est réel** : `a`, `b`, `c`, `d` valent
désormais 12/12 sur la séance entière. C'est le prix du refus de noter ce qu'on
ne prouve pas, et l'explication prend le relais — le rappel ① dit la
préférence (« en informatique on préfère un nom qui se lit ») et le contexte du
modèle l'autorise à la conseiller. Rien d'autre ne bouge : `v = 90` puis son
print s'exécutent dans l'interpréteur de la page comme dans un vrai CPython, le
doublon interdit toujours deux `v` dans la même question, et les notes déjà
enregistrées ne bougent pas — elles portent l'identifiant.
**QUATRE ENDROITS BOUGENT ENSEMBLE, sinon l'écran ment** : le juge, le rappel ①,
le commentaire de doctrine et le contexte envoyé au modèle. Et le rappel ① DIT
maintenant qu'une lettre est ACCEPTÉE — sans cette moitié, l'écran promettrait
un refus que le juge ne prononce plus, et le modèle, lui, répondrait à l'élève
que son `v` est faux. Les deux ont leur contrôle.
**Le banc est RETOURNÉ, pas retiré** : les refus épinglés `x` et `n` passent dans
la liste des ACCEPTÉS (avec `v`, `l`, `r`), le nom du contrôle le dit, et la
partition CPython perd le code `court` — sa seconde famille (fonction, long)
garde quatre candidats, donc son garde « le contrôle ne mesure rien » a encore
quelque chose à compter. Un piège d'outillage s'y est montré à l'écriture, le
piège documenté de l'antislash : le premier jet du bord « le contexte n'annonce
plus de longueur minimale » s'écrivait en expression régulière, et son `\d`
traverse le gabarit de `verifier.js` PUIS l'évaluation dans la page — il y
serait devenu un `d`, et le contrôle aurait mesuré zéro en restant vert. C'est
une recherche de chaîne, sans un seul antislash.

**Puis l'élève a ÉCRIT son premier print — et c'est la SORTIE qui le juge.**
{python-print} (Seconde, 5.6, demande de Turquet, septembre 2026 : « un
exercice qui explique le fonctionnement de print avec un texte entre "", puis
demander à l'élève d'écrire un programme qui affiche "je suis en seconde" ; il
peut l'exécuter ; le programme doit ensuite vérifier la solution ; en mode
soutien, expliquer ce qui ne va pas dans le programme ») ferme le thème 5 —
{python-afficher-variable}, {python-noms-variables} et {python-nom-variable},
arrivés sur `main` le même jour par trois autres branches, ont pris le 5.3, le
5.4 et le 5.5, et la fusion a donné 5.6 à celui-ci, en dernier :
c'est le chemin INVERSE de {python-affichage} — là on LIT un print, ici on
l'ÉCRIT, dans une zone de texte libre, le premier programme entier tapé sur
la page. Le cours est SUR l'écran (le motif de {python-types}) : trois
cadres — print et ses parenthèses, le texte entre guillemets qui s'affiche
SANS eux, les guillemets DROITS du clavier. Une séance = trois programmes : la
phrase de la demande d'abord, TOUJOURS, puis deux phrases tirées pour refaire
le geste plutôt que le recopier — c'est un arbitrage nommé, la demande ne
parlait que d'une phrase, et un exercice d'une seule question aurait noté 0
ou 10.
**« EXÉCUTER » EST LIBRE, et c'est ce qui le distingue des deux autres** : au
5.1 et au 5.2 le bouton attend la vérification parce que la sortie EST la
réponse ; ici la sortie est l'OUTIL — l'élève exécute, lit ce qui s'affiche ou
l'erreur que Python lui rend, corrige, réexécute, comme sur un vrai notebook.
**LE JUGE EST LA SORTIE, JAMAIS L'ÉCRITURE** : `pypDiag` lit `pyRun(prog)` —
la fonction MÊME qui répond sous le bouton — et compare ce qui s'affiche à la
phrase demandée. `print("je suis", "en seconde")`, `print('…')` ou `x = "…"`
puis `print(x)` sont donc justes : on demande un programme qui AFFICHE la
phrase, pas une écriture. Comparer au programme modèle aurait compté faux un
élève qui a raison, le pire défaut du projet ; le modèle ne sert qu'à la
correction en vert, en entraînement. Les espaces aux deux bouts de la ligne
sont ignorées — invisibles à l'écran — ; la casse, les accents, une ligne de
trop, des guillemets affichés comptent, et se DISENT.
**LE DIAGNOSTIC NE PRONONCE QUE DES FAITS PROUVABLES**, dans les mots de
l'élève : print en majuscules ou mal orthographié (à deux lettres près),
parenthèses absentes ou dépareillées, guillemets absents, non fermés,
dépareillés ou TYPOGRAPHIQUES (« » et “ ” — le piège d'un clavier français),
puis, si le programme tourne, ce que sa sortie a de différent. Il lit le
TEXTE du programme d'abord, les chaînes bien formées RETIRÉES — sans quoi
l'apostrophe de « c'est » passerait pour un guillemet dépareillé, et le
contrôle tient ce bord — et l'erreur de l'interpréteur ensuite, traduite, pour
ce que l'analyse n'explique pas. En SOUTIEN c'est ce diagnostic qui s'affiche
et rien d'autre : jamais le programme modèle, l'élève corrige et revérifie,
et la frappe efface le rouge d'avant. En ENTRAÎNEMENT la question se
verrouille à 0 ou 1, et un programme qui convient s'écrit en vert (`sol`).
Une zone VIDE ne rougit jamais : en entraînement elle reçoit le modèle en
`sol`, en soutien rien.
**Le point-virgule est la divergence ASSUMÉE avec CPython** : `print("…");`
passe en Python, l'interpréteur de la page le refuse (« caractère inattendu »)
et le diagnostic le dit en toutes lettres plutôt que d'imiter. Le contrôle
l'épingle comme tel, et compare à un vrai python3 dix-huit programmes qu'un
élève écrit — même sortie pour les justes, REFUS des deux côtés pour les
faux : un interpréteur qui accepterait ce que Python refuse ferait mentir le
diagnostic.
**Le programme est une RÉPONSE et voyage dans la QUESTION** : `pts-case` (la
leçon des barres de {simplifier-barres}) pour que la note affichée le compte
« 1 case juste sur 1 », et `q.prog` parce que `captureBoxes` ne connaît que
les input, select et math-field — une zone de texte y serait perdue à la
pause. La zone refuse la correction automatique du clavier (`autocapitalize`,
`autocorrect`, `spellcheck`) : sur tablette, « print » deviendrait « Print »
sous les doigts — l'erreur même que le diagnostic nomme, fabriquée par la
page. Aucune correction au fil de la frappe (`soutienEnDirect.sans`) : juger un
programme qu'on n'a pas fini d'écrire dirait « faux » sur `print("`.
Deux bancs, la répartition habituelle : jsdom tient la demande épinglée (la
phrase, les écritures que le juge DOIT accepter), la place au menu, le
tirage, le diagnostic cas par cas, la copie juste TAPÉE (le bouton libre, la
console, la note), les copies fausse et vide, le soutien, les branchements et
CPython ; le NAVIGATEUR (« 6 tricies bis », déclaré par `pythonPrint`
dans `tests/profils.js`) TAPE au clavier dans la vraie zone, clique le vrai
bouton, lit l'erreur en ROUGE dans la console puis la phrase après correction,
mesure le bleu de la copie juste et le rouge du soutien à l'encre RENDUE, la
zone à chasse fixe et large comme la console, les cadres empilés sur un
téléphone — et joue le trajet d'un élève qui se trompe deux fois avant de
réussir.
**Dix-neuf sabotages, dix-huit rougissant en nommant leur défaut** — seize au
banc jsdom (la casse ignorée, le juge qui compare au modèle, la réponse sans
`pts-case`, « Exécuter » verrouillé, le programme qui ne voyage plus, le
soutien qui révèle, la zone vide rougie, la phrase changée, les chaînes non
retirées, les tables revenues, la correction automatique laissée, l'exercice
hors du thème, la majuscule tue, la clause de secret perdue, le soutien qui
juge à la frappe, le point-virgule imité), trois au navigateur. **Deux ont
appris quelque chose.** Le bleu de la copie juste se mesurait d'abord à la
DOMINANTE : le bord de REPOS de la zone est déjà un bleu clair, et une règle
`.ok` qui ne peignait plus rien passait au vert en parlant d'autre chose — un
verdict se compare à la VARIABLE de la convention (`--blue`, `--red`), la
leçon de la phrase des couleurs du 6.3, et le sabotage rejoué rougit en
nommant l'encre (« rgb(187, 208, 247) »). Et le dix-neuvième est resté VERT
à bon droit : la chasse fixe retirée de la feuille de styles ne change rien,
parce qu'une zone de texte est à chasse fixe par défaut dans le navigateur —
la propriété est tenue, par la feuille du NAVIGATEUR, la règle écrite n'est
qu'une ceinture. Un dernier a frappé le VOISIN : `checkPYP` contient
`checkPY`, et le contrôle du 5.1 rougissait sous le nom du 5.1 pour un
défaut du 5.3 — son ancre est devenue « checkPY( ».

**Puis l'élève a ÉCRIT sa première ligne de code : afficher un texte suivi
d'une variable.** {python-completer} (Seconde, 5.7, demande de Turquet,
septembre 2026 : « un exercice Python où on explique comment afficher du
texte suivi d'une variable ; on donne un programme qui commence par
note = 12 et l'élève doit compléter le programme pour qu'il affiche le texte
"la note est :" suivi de la valeur de la variable ; l'élève peut ensuite
exécuter le programme puis on doit vérifier le résultat ; en mode soutien le
programme doit être capable d'expliquer où se trouve l'erreur ») suit
{python-print} au menu et FERME le thème 5. Quatre exercices Python sont
arrivés sur `main` le même jour par d'autres branches :
{python-afficher-variable} (#255), qui fait afficher la VALEUR seule — celui-ci
fait écrire le TEXTE suivi de la variable, l'étape d'après —, puis
{python-noms-variables} (#252), {python-nom-variable} (#254) et
{python-print} (#256), qui fait écrire un print de TEXTE seul. Son préfixe est `pyx`
et non `pyc`, que #255 porte déjà : deux exercices sous un même préfixe se
seraient marché dessus (kind, écran, rappel, questions), sans qu'aucune
erreur ne le dise — la leçon du 6.10.
**Et la fusion elle-même a laissé un piège que seul le banc a vu** : deux
exercices ajoutés au MÊME endroit font des hunks « les deux côtés ont
ajouté », et les lignes COMMUNES qui suivent un hunk — la `</section>` de
l'écran, la fin d'une fonction, la ligne `RAPPELS` — n'appartiennent qu'à UN
des deux blocs une fois qu'on garde les deux. L'écran de #255 n'était plus
refermé, les écrans suivants vivaient DEDANS, et son verdict comptait « 17
cases » sur une copie d'une case ; une fonction de #255 restait ouverte, et
`RAPPELS` était déclaré deux fois. Aucun marqueur de conflit ne le disait :
c'est `npm test` qui a nommé les trois, et la zone a été reconstruite depuis
les blocs COMPLETS de chaque côté plutôt que hunk par hunk. La seconde fusion du
même jour (#252 entre-temps) a été faite AINSI d'emblée — le fichier de `main`
plus mes blocs à des ancres nommées — et l'extraction du bloc CSS s'est
arrêtée sur un commentaire INTERNE : sept règles perdues, dont la ligne verte
sous la case et la console rouge. jsdom restait vert ; seul le banc NAVIGATEUR
les a nommées, à l'encre rendue. Un bloc s'extrait entre deux ancres qu'on
VÉRIFIE, jamais « jusqu'au prochain commentaire ». **Et la troisième fusion du même
jour a montré le bord d'à côté** : une entrée posée juste après la ligne
`pythonNomVariable: {` de `tests/profils.js` est tombée DANS cet objet, qui
tient sur dix lignes — `P.pythonCompleter` valait alors `undefined`, et mes
onze contrôles se sont affichés « non applicable » au lieu de rougir. C'est
exactement ce pour quoi cette mention existe : **un contrôle qui n'a rien à
mesurer le DIT**, et c'est ce qui l'a fait voir. Une ancre d'insertion se
choisit par la STRUCTURE (avant le bloc suivant, jamais après la ligne qui
OUVRE le voisin), et le compte des contrôles — 343 puis 354 — le confirme. Le 5.1 fait PRÉDIRE un print, le 5.2 fait
RECONNAÎTRE un type ; ici il faut PRODUIRE la ligne — dans une case de code
à chasse fixe, sous la ligne 1 écrite par la page. Le cours est SUR l'écran,
avant le programme (le motif des trois cadres du 5.2), et son exemple n'est
aucune des questions.
**LA CHAÎNE DES PORTES EST CELLE DE LA DEMANDE : écrire, EXÉCUTER, puis
vérifier.** « Vérifier » ne s'ouvre qu'une fois la ligne exécutée telle
qu'elle est écrite, et se referme sur une ligne modifiée — la console se vide
avec lui, sans quoi elle montrerait la sortie d'une ligne qui n'est plus celle
écrite. L'élève voit ce que SA ligne affiche, le compare à ce qui est demandé
(l'écran le dit : « c'est-à-dire : la note est : 12 »), et demande le verdict
ensuite. C'est le geste du carnet, tenu par l'ÉTAT du bouton et non par une
consigne (la leçon de {placer-image}) ; Entrée dans la case exécute. Et
« Vérifier » exécute LUI-MÊME une ligne qui ne l'aurait pas été : la console
montre toujours ce que le juge a lu.
**LA SORTIE AFFICHÉE ET LA CORRECTION SORTENT DE LA MÊME FONCTION** : le
bouton, le juge (`pyxJuge`) et le diagnostic lisent tous `pyRun` sur le
programme de l'élève — l'interpréteur du 5.1, comparé à un vrai CPython par
le banc, ici sur 974 programmes : les témoins ET huit lignes d'élève par
question, justes et fausses, refus pour refus. Le témoin est ÉCRIT depuis la
question (`pyxAns`), jamais rangé à côté : elle ne porte que le nom, la
valeur, le texte et le visage, et le contrôle refuse tout autre champ.
**Le verdict compare la SORTIE — et exige la variable EMPLOYÉE.** Toute
écriture qui affiche la même chose est juste : les guillemets simples,
`"la note est :" + " " + str(note)`, un commentaire au bout. Mais
`print("la note est :", 12)` affiche la bonne chose sans rien apprendre — la
valeur est recopiée à la main —, et le message le dit : c'est un fait
prouvable sur la ligne (aucun jeton `note` hors guillemets), pas une opinion.
**LE DIAGNOSTIC NOMME OÙ EST L'ERREUR, en soutien comme en entraînement.**
Il ne prononce que des faits PROUVABLES sur la ligne, dans un ordre qui
compte : le guillemet ouvert et jamais fermé d'abord — sans lui, tout ce qui
suit passerait pour du texte nu — ; le texte posé SANS guillemets (Python le
prend pour des noms de variables, et c'est l'erreur la plus fréquente) ;
`Print` en majuscule ; « afficher » à la place de print ; la parenthèse
ouvrante manquante ; la parenthèse jamais fermée, COMPTÉE hors guillemets
(l'interpréteur ne dit que « SyntaxError ligne 2 » sur ce cas-là — le
premier jet du diagnostic l'a appris au premier banc) ; la variable en
majuscule, ou inconnue ; la virgule manquante entre le texte et la variable ;
le « + » entre un texte et un nombre. Puis, sur une ligne qui s'exécute : la
variable entre guillemets (c'est son NOM qui s'affiche), l'ordre inversé,
l'espace en trop ou manquante, le « : » oublié, la majuscule dans le texte,
un calcul à la place de la variable, trois choses au lieu de deux, une ligne
qui n'affiche rien. Ce qu'il ne sait pas nommer, il le MONTRE : « ton
programme affiche X au lieu de Y ». Vingt-cinq lignes fausses sont ÉPINGLÉES
au contrôle, chacune avec le mot que son diagnostic doit porter — un
diagnostic qui dirait autre chose que l'erreur serait pire que « faux ».
**En entraînement la ligne juste s'écrit en VERT SOUS la case** (un badge en
ligne, à droite, sortirait de l'écran sur un téléphone) et la question se
verrouille ; **en soutien, jamais** : la case rougit, le message dit « Où est
l'erreur ? », l'élève corrige — le rouge s'en va dès la première frappe, le
bouton se referme, il ré-exécute et revérifie. La ligne VIDE n'est jamais
peinte : elle est redemandée. La première question est celle de la demande,
ÉPINGLÉE (note = 12, « la note est : ») ; les trois suivantes tirent les
trois visages du 5.1 — un entier, un décimal, un texte — dans ses jeux de
variables (`PY_JEUX`, partagé, pas recopié), en ordre mélangé. Aucune
correction au fil de la frappe (`soutienEnDirect.sans`) : une ligne de code
se juge écrite, pas lettre par lettre. Une case par question, `pyxCases` pour
la coupe d'un devoir.
**Un défaut ne s'est vu que sur la capture** : la ligne juste en vert se
posait À DROITE de la case au lieu de dessous — la rangée du programme est
un flex, et un badge `display:block` y reste un élément de la rangée. Elle
occupe désormais toute la rangée (`flex:0 0 100%`) et tombe sous la case ;
le banc navigateur mesure les deux rectangles, parce que jsdom n'a pas de
mise en page.
Le banc NAVIGATEUR (« 6 tricies ter », déclaré par `pythonCompleter`
dans `tests/profils.js`) tient ce que jsdom ne voit pas : le cours rendu, la
ligne 1 et la case à chasse fixe et à la MÊME taille, un VRAI clic sur
« Vérifier » fermé qui ne juge rien, la ligne fausse TAPÉE au clavier et sa
ligne juste en VERT SOUS la case, la ligne juste de la question suivante
tapée puis exécutée par Entrée, l'encre RENDUE du verdict, l'erreur de Python
en rouge dans la console, la page qui ne déborde pas sur un téléphone, puis
le soutien joué de bout en bout. Les contrôles universels des deux bancs ont
couvert l'exercice au premier passage sans rien déclarer. Douze sabotages au
banc jsdom, chacun rougissant en nommant son défaut — et la campagne a
elle-même payé la règle « une campagne de sabotage se joue seule sur la
machine » : lancée pendant que le banc NAVIGATEUR tournait encore, elle lui
a fait mesurer la page sabotée (« le soutien verrouille une copie fausse »),
et ses deux rouges accusaient une page juste. Rejoué seul, il est vert.

**Puis le cours a pris son PROPRE écran, avec un exemple qui S'EXÉCUTE.**
Demande de Turquet (septembre 2026) : « dans l'exercice 5.7 en seconde je
souhaite que le cours soit affiché avec un programme à exécuter d'un exemple
du cours ; l'élève clique quand il pense avoir compris ; et on voit après
l'énoncé du programme à compléter comme c'est déjà le cas ; et on continue sur
l'énoncé suivant du programme à compléter. » Le cours était POSÉ en tête de
chacune des quatre questions — lu ou non, et redit trois fois de trop — et son
exemple n'était qu'une phrase qui donnait sa propre réponse (« … affiche nous
sommes en 2026 »). Il OUVRE maintenant la séance, sur son écran à lui, et cet
exemple est un vrai programme que l'élève fait TOURNER ; les quatre questions
s'enchaînent ensuite, chacune avec son seul énoncé.
**LE COURS QUITTE L'ÉCRAN DE LA QUESTION, et c'est le « après » de la
demande** — il reste à un clic, par « 📘 Rappel de cours », que l'écran porte
déjà. Le garder en tête de chaque question aurait fait de la porte une
décoration : on aurait cliqué « J'ai compris » sur un cours qu'on relit juste
en dessous.
**LA PORTE EST TENUE PAR L'ÉTAT DU BOUTON** (la leçon de {placer-image}) :
« J'ai compris » ne s'ouvre qu'une fois l'exemple EXÉCUTÉ. C'est un arbitrage
assumé — la demande dit QUAND l'élève clique, elle ne dit pas qu'il peut sauter
l'exemple, et un exemple qu'on n'exécute pas rend l'écran à ce qu'il était
avant la demande ; c'est déjà la règle du 5.1, où « voir le programme tourner
est le a) de la fiche, pas une option ». Le garde vit sur le BOUTON et nulle
part ailleurs : `pyxCompris()` n'en porte pas — un second garde, que le premier
rend inatteignable, serait un garde-fou mort de plus.
**LA SORTIE DE L'EXEMPLE VIENT DE `pyRun`**, la fonction même qui exécutera la
ligne de l'élève, jamais une chaîne écrite à côté : un cours qui annoncerait
autre chose que ce que l'interpréteur affiche enseignerait le faux. Le cours ne
DIT donc plus ce que l'exemple affiche, il le MONTRE — et le contrôle tient les
deux bords, la phrase retirée du cours ET la sortie lue dans la source. Le
rappel (RAP_PYX), lui, garde sa phrase entière : il se lit hors de l'écran, où
il n'y a aucun programme à lancer. Et l'exemple n'est AUCUNE des questions :
« annee » n'est dans aucun jeu de `PY_JEUX`, et le contrôle l'exige plutôt que
de le supposer. Son programme entre en plus dans la comparaison à un vrai
CPython : il tourne chez l'élève, sa sortie se compare comme les autres.
**Le bord qu'aucun écran ne dirait est celui du devoir sur PAPIER** : la photo
de l'énoncé et la reprise d'une pause passent toutes deux par
`afficherEcranDe`, qui appelle `renderPYX` — donc la QUESTION. Un cours rendu
là serait photographié sur la feuille du professeur à la place de l'exercice,
et rien ne le dirait.
**Et le contrôle UNIVERSEL a dû apprendre la porte** : la visite du banc
navigateur qui ouvre TOUS les exercices dans les deux modes franchissait déjà
les écrans de départ (« Commencer », le choix de niveau) ; elle exécute
maintenant l'exemple, puis franchit « J'ai compris » — sans quoi elle aurait
mesuré un écran de cours en croyant mesurer un exercice, et le bouton d'aide,
les accolades, le gabarit non interprété et le cadre pleine largeur n'auraient
plus rien dit du 5.7. Elle ne clique que des boutons ACTIFS désormais, et vise
le bouton de l'EXEMPLE et lui seul — celui de l'exercice dit « le programme »,
pas « l'exemple ».
**Onze sabotages, chacun rougissant en nommant son défaut** — neuf au banc
jsdom (le cours qui ne s'ouvre plus, la porte ouverte d'emblée, la porte qui
reste fermée après l'exécution, le cours resté en tête de la question,
l'exemple quitté de l'écran, sa sortie écrite à la main, sa variable prise à
une question, le cours qui redit ce que l'exemple affiche, `afficherEcranDe`
qui rend le cours), deux que seul le NAVIGATEUR voit (le cours caché par une
règle CSS, la chasse fixe retirée des lignes de programme). **Et deux d'entre
eux ont d'abord montré un défaut du CONTRÔLE, pas de la page** : privé de
l'écran du cours, il LEVAIT sur une console absente au lieu de nommer quoi que
ce soit — un contrôle qui lève ne nomme rien, il dit maintenant ce qui manque
et s'arrête ; et le sabotage de la variable ne changeait que la PREMIÈRE ligne
de l'exemple, si bien que le programme tombait en erreur et que le contrôle
parlait d'autre chose. Rejoué sur un programme valide, il nomme la variable.

**Puis l'ÉNONCÉ a suivi l'écran, et un coup de pouce est venu.** Demande de
Turquet (septembre 2026) : « je veux que le 1er énoncé soit par exemple : lis
le cours et exécute le programme pour comprendre ; et les énoncés suivants
sont : complète le programme pour qu'il affiche "la note de simon est :" suivi
du contenu de la variable note. Rajouter aussi un coup de pouce comme dans
5.8. » L'écran portait UN énoncé écrit dans le HTML, le même sur les deux
écrans : il annonçait la ligne à compléter devant un cours qu'on n'avait pas
encore lu, et il redisait la demande sous une étiquette du programme qui la
disait déjà.
**L'ÉNONCÉ EST ÉCRIT PAR LE RENDU, ET PAR LUI SEUL** : le `<p class="mp-instr">`
de l'écran est VIDE, `pyxRenderCours()` y pose la phrase du cours et
`renderPYX()` celle de la question. Un texte laissé dans le HTML « au cas
où » aurait été une SECONDE source — celle qui dérive sans que rien ne le
dise : le sabotage « le rendu ne pose plus l'énoncé du cours » serait resté
VERT, couvert par le texte statique, et c'est ce premier jet qui l'a montré.
**L'ÉNONCÉ DE LA QUESTION NOMME LES NOMBRES DE SA QUESTION** — son texte et sa
variable, lus dans `q` —, et **le bord qui compte est l'énoncé FIGÉ**, le plus
sournois : « la note est : » écrit en dur nommerait un texte que la question
ne porte pas, sans qu'aucune correction ne bronche — la leçon du numéro
d'exercice de `show()`, transposée. Le contrôle rend donc DEUX questions
ÉPINGLÉES (« la note de Simon est : » / note, puis « le prix est : » / total,
la seconde ayant sa variable ABSENTE de son texte, sans quoi le texte seul
satisferait les deux mesures) et relit les deux pastilles `<code>`.
**ET LA DEMANDE N'EST DITE QU'UNE FOIS** : l'étiquette au-dessus du programme
ne garde que ce qu'il doit afficher (« Ton programme doit afficher : … »), et
le contrôle COMPTE les occurrences de « complèt » sur l'écran — exactement
une. Deux phrases qui disent la même chose finissent par n'en dire plus
qu'une à moitié.
**UN SEUL COUP DE POUCE, et c'est un arbitrage nommé** : le 5.8 en a DEUX
parce que son programme porte une ligne MODÈLE à imiter — le premier dit de la
regarder ; le 5.7 n'en a pas, et un second coup de pouce n'aurait plus eu que
la réponse à donner. Il dit la FORME (`print("texte", variable)`, les
guillemets, la virgule, le nom sans guillemets) et jamais la ligne attendue :
le contrôle exige que `pyxAns(q).ligne` ne s'y trouve pas.
**LE CADRE DES COUPS DE POUCE EST PARTAGÉ, PAS RECOPIÉ** (`pyPoucesHTML`) :
un seul endroit écrit le repli et ses classes, chaque exercice n'écrit que ses
mots — deux fabriques auraient fini par diverger, et deux exercices voisins se
seraient dessinés différemment sous les yeux de l'élève. Les classes gardent le
préfixe `pyd-` de l'exercice où le cadre est né, comme le 5.8 garde les classes
`pyx-` du programme : la convention de `pyx-prog`, prise dans l'autre sens.
Douze sabotages au banc jsdom, chacun rougissant en nommant son défaut —
l'énoncé du cours retiré, l'énoncé du cours qui parle déjà de compléter,
l'énoncé de la question retiré, l'énoncé FIGÉ, la variable qui n'est plus
nommée, l'étiquette qui redit la demande, l'écran qui ne montre plus la sortie
attendue, le coup de pouce disparu, déplié d'emblée, muet sur la forme, qui
écrit la ligne, et le 5.8 sorti de la fabrique partagée.
**Et le banc NAVIGATEUR tient ce que jsdom ne voit pas** : l'énoncé rendu dans
sa BOÎTE sous UNE seule étiquette « Énoncé » — le contrôle universel « 6 » ne
visite pas cet exercice, et un énoncé vidé garderait son élément dans le DOM —,
les deux écrans qui ne disent pas la même chose, et le coup de pouce qui
S'OUVRE au clic : jsdom lit un attribut, pas un geste. Deux sabotages de plus,
chacun rougissant en nommant son défaut et laissant jsdom VERT à bon droit —
l'énoncé caché par une règle CSS (« boite: false », le texte toujours dans le
DOM) et le clic du coup de pouce avalé par un `preventDefault`. Ce dernier
rougit AUSSI chez {python-deux-lignes} : c'est la preuve que le cadre est
partagé et non recopié.
**ET LE BANC S'EST PRIS EN DÉFAUT AVANT LA PAGE** : son clic FORCÉ sur
« J'ai compris » fermé tombait sur les commandes du bas, en position FIXE —
il ouvrait la modale de signalement, qui interceptait ensuite tout, et le banc
accusait la page. L'élève, lui, fait défiler : la réserve du bas (84 px) lui
rend le bouton, mesuré. Le banc CENTRE donc le bouton avant de cliquer — le
piège déjà payé sur la grille de {construire-fonction}, et la règle « une
mesure qui accuse la page se mesure elle-même d'abord ».

**Un texte presque bon est un texte bon.** Décision de Turquet (septembre
2026) : « en seconde pour les algorithmes qui affichent un texte, accepter les
textes qui sont presque bons. Dans le texte des espaces en trop ou en moins ne
sont pas pénalisés, un ou 2 caractères faux ou en trop ne sont pas
pénalisés. » Les deux exercices qui font AFFICHER un texte — {python-print},
où l'élève écrit le print entier, et {python-completer}, où il écrit le texte
suivi de la valeur d'une variable — comptaient faux « je suis en séconde », ou
« la note est » sans les deux points : ce qu'ils évaluent est print, les
guillemets et la virgule, pas la dactylographie.
**UN SEUL ENDROIT, ET IL NE CONNAÎT AUCUN EXERCICE** : `pyTexteProche` compare
ce que le programme AFFICHE à ce qu'on demande, et les deux juges l'appellent.
Deux tolérances auraient fini par diverger, et le même texte aurait été
accepté d'un côté et refusé de l'autre, sous les yeux de l'élève.
**DEUX GARDES, ET N'EN TENIR QU'UN NE TIENT RIEN.**
· **Les CHIFFRES comptent toujours.** « la note est : 13 » n'est pas « la note
  est : 12 » à un caractère près : c'est une autre note. Sans ce garde,
  `print("la note est :", note + 1)` passerait, et l'exercice enseignerait
  l'inverse de ce qu'il dit. Il est VIVANT : le sabotage qui le retire fait
  accepter deux lignes fausses du contrôle.
· **Un caractère par tranche de quatre, deux au plus.** Le plus court texte
  des deux exercices affiche « age : 16 » — six caractères une fois les
  espaces retirées : deux fautes n'y seraient plus une faute de frappe mais un
  autre texte. Et ce plus court texte est MESURÉ sur les deux tirages plutôt
  que supposé (`toleranceTexte.plusCourt` dans `tests/profils.js`, deux
  sources) : un texte de deux lettres ajouté demain rougit en se nommant.
Les espaces, elles, ne comptent JAMAIS — c'est la demande, et elle va plus
loin qu'une espace de trop : « la note est:12 » est accepté. Un retour à la
ligne n'est pas une espace : deux print restent deux lignes, et c'est un autre
défaut.
**ET LA VALEUR N'EST JAMAIS PRESQUE BONNE** : au 5.7 elle doit se lire dans la
sortie telle que Python l'écrit. Les espaces ne comptant plus,
`print("la note est :", note // 10, note % 10)` affiche « la note est : 1 2 »
et passerait sans ce garde-là — le sabotage qui le retire le nomme.
**ET LA PAGE DIT CE QU'ELLE A TOLÉRÉ.** Sans cette moitié, l'élève croirait
avoir écrit le texte exact : le « Bravo » nomme l'écart (« attention aux
majuscules », « il y a une espace en trop ou en moins », « les guillemets ne
s'affichent pas ») et redonne le texte demandé. Les messages qui nommaient ces
défauts n'ont donc pas disparu — ils ont CHANGÉ DE CÔTÉ, du refus vers
l'acceptation —, et les branches du diagnostic qu'ils occupaient sont
RETIRÉES : devenues inatteignables, aucun sabotage ne pouvait plus les faire
rougir. Les contrôles qui les épinglaient ont été retournés, pas supprimés :
la même copie, le même mot, du côté des copies acceptées. Ce qui reste au
diagnostic est ce qui reste faux — la casse d'un bout à l'autre
(« JE SUIS EN SECONDE »), et un texte qui n'est plus celui-là.
**{python-afficher-variable} RESTE DEHORS, et c'est un arbitrage nommé** : sa
sortie EST la valeur de la variable — il n'y a aucun texte à mal taper, et un
caractère de tolérance y accepterait une autre valeur. Le contrôle tient ce
bord : une espace de plus après la valeur y est refusée. Un sabotage l'a
montré en restant VERT à bon droit — la tolérance posée sur sa seule
comparaison de sortie ne change rien, sa SECONDE méthode (la première ligne
change de valeur, l'affichage doit suivre) tenant le bord toute seule ; la
fuite complète, elle, rougit.
**Aucun contrôle du NAVIGATEUR, et le dire vaut mieux que le taire** : la
tolérance est une affaire de chaînes, et le message qui nomme l'écart se lit
dans le DOM — jsdom le voit, un vrai Chromium n'en dirait pas plus. Treize
sabotages, douze rougissant en nommant leur défaut.

**La suite du 5.7 : un modèle DÉJÀ écrit, et deux lignes à compléter.**
{python-deux-lignes} (Seconde, 5.8, demande de Turquet, septembre 2026 : « en
seconde créer un exercice comme le pdf ») est l'exercice 9 (suite et fin) du
carnet, et il ferme le thème 5 — ajouté en dernier, il ne renumérote rien.
Trois variables sont affectées, UNE ligne d'affichage est déjà écrite, et
l'élève complète le programme pour qu'il affiche deux autres textes suivis de
deux autres variables. « Vérifier en l'exécutant », dit la fiche, et la chaîne
des portes du 5.7 le tient : écrire, EXÉCUTER, puis vérifier — « Vérifier » ne
s'ouvre qu'une fois le programme exécuté tel qu'il est écrit, et se referme
dès qu'une ligne change.
**CE QU'IL AJOUTE AU 5.7 EST LE MODÈLE, et c'est tout le sujet** : là-bas il
n'y a qu'UNE variable et aucun modèle — la page explique, l'élève applique.
Ici le programme porte TROIS variables qui se ressemblent (note1, note2,
prenom) et une ligne d'affichage déjà écrite : l'élève TRANSPOSE, et le seul
vrai risque est de recopier cette ligne sans changer la variable. C'est la
première chose que le diagnostic NOMME (« tu as recopié la ligne déjà écrite :
elle affiche la valeur de note1 »), la seconde étant la variable voisine prise
à la place (« ta ligne affiche la valeur de note1, alors qu'on demande celle
de note2 »). Sans ces deux branches, le juge du 5.7 aurait répondu à côté : le
texte étant juste, il aurait comparé « la 2ème note vaut » à lui-même.
**TOUT EST REPRIS, RIEN N'EST RECOPIÉ** : le jeu de variables est `PY_JEUX` —
partagé avec {python-affichage} et {python-completer}, et dont la première
entrée EST celle du carnet (note1, note2, prenom) —, l'interpréteur est
`pyRun`, la tolérance des textes `pyTexteProche` et `pyEcart`, et les
diagnostics sont `pyxDiagErreur` et `pyxDiagSortie`, les fonctions MÊMES du
5.7, à qui l'on passe la ligne à juger et sa cible. Le programme se dessine
avec les classes du 5.7 (`pyx-prog`, `pyx-ligne`, `pyx-in`) : deux feuilles de
styles auraient fini par diverger, et deux exercices voisins se seraient
dessinés différemment sous les yeux de l'élève. `pyxDiagErreur` a seulement
appris la LISTE des variables du programme (`q.noms`) — « les variables sont
note1, note2 et prenom » au lieu de « la seule variable est celle de la ligne
1 » — et appelée sans elle, le cas du 5.7, elle ne change pas d'un mot.
**L'ORDRE DES DEUX LIGNES EST LIBRE**, et il le faut : rien à l'écran ne dit
quelle case porte laquelle, et un programme qui affiche les deux choses
demandées est juste — refuser une écriture juste serait le pire défaut du
projet. C'est la règle des paires d'{antecedent-nombre} : chaque ligne se juge
sur ce qu'elle PROMET — afficher l'un des deux affichages attendus — et la
liste les prend une fois chacune ; la même ligne écrite deux fois est
défendable une fois, fausse la seconde, et le message le dit.
**CHAQUE LIGNE SE JUGE SEULE** : deux cases dans la note, six pour la séance.
Une ligne fausse ne fait pas rougir sa voisine, et la ligne juste s'écrit en
VERT sous la fausse SEULEMENT — en entraînement, jamais en soutien, où l'élève
corrige et revérifie. **Une ligne VIDE n'est jamais peinte** : la vérification
la redemande, sans rien colorer ni verrouiller — rouge veut dire FAUX, jamais
« pas fini » (la règle de {placer-image}).
**LA SÉANCE** : la fiche du carnet en tête, ÉPINGLÉE (note1 = 15,
note2 = 15.5, prenom = "Louane", le modèle sur note1), puis les DEUX autres
visages en modèle, chacun une fois, sur deux jeux distincts. Chaque visage
sert donc de modèle une fois et s'écrit deux fois — un entier, un décimal
(Python l'écrit avec un point) et un texte (il s'affiche sans ses guillemets).
Le compte n'est pas un réglage : c'est la structure de la séance, et
`tests/profils.js` en est la seconde source.
**LES DEUX COUPS DE POUCE sont ceux du carnet**, repliés : ils disent la
MÉTHODE — la forme de la ligne, le nom de la variable sans guillemets — et
jamais la réponse, que l'énoncé porte déjà. Le contrôle l'exige : aucune des
deux lignes attendues ne s'y écrit.
**LE RISQUE SILENCIEUX EST LA CONFUSION DES DEUX LIGNES** : si deux affichages
attendus se ressemblaient à un caractère près, la tolérance des textes ferait
passer l'un pour l'autre et la règle des paires perdrait son sens. Le tirage
ne porte AUCUN garde là-dessus — sondé, la propriété tient d'elle-même sur
1 200 questions, et un garde qui n'écarte jamais rien ferait croire qu'on
vérifie quelque chose —, et c'est le CONTRÔLE qui l'exige, tirage après
tirage, sur les deux lignes entre elles ET sur la ligne du modèle.
Deux bancs, la répartition habituelle : jsdom tient la fiche épinglée (si elle
ne passe pas au juge, c'est le juge qui a tort), la place au menu, le tirage
(400 séances), le juge sur des écritures JUSTES variées et sur vingt-quatre
lignes FAUSSES — chacune avec le mot que son diagnostic doit porter —, les
portes, la ligne vide, le soutien, les branchements, et compare l'interpréteur
à un vrai CPython sur 822 programmes ; le NAVIGATEUR (« 6 tricies sexies »,
déclaré par `pythonDeuxLignes` dans `tests/profils.js`) mesure ce que jsdom ne
voit pas — la consigne à puces et les coups de pouce RENDUS, repliés puis
OUVERTS au clic, les quatre lignes écrites du programme et les deux cases à
chasse fixe et à la MÊME taille, un VRAI clic sur « Vérifier » fermé qui ne
juge rien, les deux lignes TAPÉES au clavier dans l'ordre inverse des puces,
l'encre RENDUE des deux verdicts sur la même question — l'une bleue, l'autre
rouge, ce que seule une couleur rendue montre —, la ligne verte SOUS la case
fausse, et la page qui ne déborde pas sur un téléphone.
**ET UN DÉFAUT NE S'EST VU QUE SUR LA CAPTURE, à la largeur d'un téléphone** :
la ligne du MODÈLE fait 300 px à chasse fixe quand le cadre du programme en
offre 285, et sa fin — « note1) » — était simplement COUPÉE, sans rien qui le
dise (mesuré : 312 px de contenu dans 285, la page ne débordant pas). Le 5.7 ne
pouvait pas le montrer : sa ligne 1, « note = 12 », tient partout. Une ligne de
code ne se replie JAMAIS — un calcul coupé en deux se lit de travers — donc
elle DÉFILE, chacune dans sa propre bande (`.pyx-l1{overflow-x:auto}`). **Et sa
base de flex vaut ZÉRO, pas « auto »** : à `auto`, la ligne trop longue passe
SOUS son numéro avant même de rétrécir — dans une rangée flex le repli arrive
avant le rétrécissement —, et c'est la capture refaite qui l'a montré. Le banc
NAVIGATEUR tient les deux bords (aucune ligne ne déborde du cadre, celle qui
n'y tient pas peut défiler) et il les mesure sur la QUESTION 1, la fiche
épinglée, dont la ligne modèle est longue par construction : mesuré sur un
tirage au hasard, « la ligne qui ne tient pas » n'existerait pas toujours et le
contrôle serait INTERMITTENT.
**Vingt-trois sabotages, chacun rougissant en nommant son défaut** — dix-neuf
au banc jsdom (l'ordre imposé, le doublon accepté, la variable employée qui
n'est plus exigée, chacune des trois branches du diagnostic débranchée, la
liste des variables perdue, la fiche qui n'ouvre plus la séance, les visages
modèles au hasard, la ligne vide peinte, la ligne juste qui fuit en soutien,
« Vérifier » cliquable d'emblée, les deux cases jugées ENSEMBLE, l'exercice
sorti du thème 5, le rappel qui n'enseigne plus la variable à choisir, le
bouton des tables revenu, le soutien qui juge à la frappe, le contexte sans
clause de secret, un coup de pouce qui écrit la réponse) et quatre que seul le
NAVIGATEUR voit — la chasse fixe retirée des cases (il nomme l'encre :
« Arial »), la ligne verte rangée À DROITE au lieu de dessous, les coups de
pouce dépliés d'emblée, et la ligne écrite qui ne défile plus —, jsdom restant
vert à bon droit sur ces quatre-là. Un sabotage a montré un trou du CONTRÔLE
avant la page : « la ligne juste fuit en soutien » faisait LEVER le contrôle
sur un bouton disparu (« Cannot read properties of null ») au lieu de nommer
quoi que ce soit — un contrôle qui plante ne dit rien du défaut visé, et il
garde son bouton désormais.

**Le print est écrit en entier, et seuls les NOMS des variables manquent.**
{python-placer-variables} (Seconde, 5.9, demande de Turquet, septembre 2026 :
« créer un exercice comme le pdf ») est l'exercice 10 du carnet, et il FERME
le thème 5 — ajouté en dernier, il ne renumérote rien. « On considère la
variable prenom="Mathéo" et la variable note=14. Compléter LOGIQUEMENT avec
les noms des variables note et prenom le programme ci-dessous et l'exécuter. »
Le programme est donné entier, print compris ; l'élève ne tape que les noms,
dans les trous de `print("la note de ", …, " est de ", …, "sur 20")`.
**CE QU'IL AJOUTE AUX AUTRES EST LA LECTURE** : le 5.1 fait PRÉDIRE ce qu'un
print affiche, le 5.7 et le 5.8 font ÉCRIRE la ligne entière ; ici la ligne est
écrite, et ce qui se travaille n'est plus la forme de print — les guillemets,
la virgule, les parenthèses — mais le TEXTE juste avant une case, qui dit
laquelle des variables on attend là.
**LE RISQUE PROPRE EST L'INTERVERSION, ET ELLE EST SILENCIEUSE** : deux
variables échangées donnent un programme qui s'exécute SANS la moindre erreur
et qui affiche « la note de  14  est de  Mathéo sur 20 ». Rien ne rougit côté
Python — c'est la PHRASE qui n'a plus de sens, et c'est exactement pourquoi la
fiche demande de l'exécuter. La chaîne des portes est donc celle de la fiche
(compléter, EXÉCUTER, puis vérifier — le motif du 5.7), et exécuter ne révèle
rien que l'élève n'ait posé : il LIT la phrase que ses variables produisent.
**LE DIAGNOSTIC NE DONNE JAMAIS LA RÉPONSE, et c'est ce qui le sépare de celui
du 5.8** : là-bas la consigne nomme déjà la variable de chaque ligne, ici elle
EST la réponse. L'interversion se nomme donc par son fait prouvable — « à cet
endroit il affiche « 14 », juste après « la note de » » — et jamais par la
variable attendue ; les autres refus, qui portent sur l'ÉCRITURE et non sur le
choix, disent tout : la valeur recopiée à la main, le nom entre guillemets, la
majuscule, la variable inconnue, le calcul, la virgule dans la case. Le contrôle
exige ce bord sur chaque tirage, SAUF là où le texte de l'énoncé nomme
lui-même la variable (« ans, taille : » annonce taille) — c'est l'énoncé qui le
veut, et le taire aurait fait rougir une page juste.
**TOUT EST REPRIS, RIEN N'EST RECOPIÉ** : les variables et leurs valeurs
viennent de PY_JEUX — le jeu partagé avec le 5.1, le 5.7 et le 5.8 —,
l'interpréteur est pyRun, la coloration pyColorie, l'écriture des valeurs
pyRep, le cadre et les numéros du programme ceux du 5.7 (pyx-prog, pyx-ligne,
pyx-num). Les PHRASES, elles, sont propres à l'exercice : les libellés de
PY_JEUX nomment une variable isolée, quand il faut ici une phrase dont chaque
morceau annonce le trou qui le suit. Deux par jeu au moins, et elles ne
commencent pas par la même variable — sans quoi l'élève apprendrait le rang au
lieu de lire (sonde sur 1800 questions tirées : un texte en premier 53 fois sur
100, un nombre 47).
**LES TEXTES DE LA FICHE SONT REPRIS AU CARACTÈRE PRÈS, espaces comprises** :
« la note de » et « est de » y portent leurs espaces de frappe, si bien que
Python affiche DEUX espaces là où le carnet en a écrit une de trop. C'est ce
que le carnet donne, c'est ce que l'élève tape chez lui, et la page doit montrer
ce que Python fait vraiment ; les phrases du tirage, elles, sont écrites
proprement — l'espace que print met entre deux arguments suffit. Un arbitrage
nommé, pas un oubli.
**LE JUGE COMPARE LA VALEUR AFFICHÉE, ET EXIGE UNE VARIABLE** : chaque case est
exécutée SEULE — les affectations, puis print(ce que la case porte) — et sa
valeur doit être celle qu'on attend à cet endroit ; le jeton doit être un NOM
nu, sans quoi « 14 » recopié à la main afficherait la bonne chose sans rien
apprendre (la leçon du 5.7). Juger sur la VALEUR et non sur le nom est ce qui
rend le verdict honnête : deux variables de même valeur seraient toutes deux
défendables, et la page les accepterait toutes deux.
**ET C'EST LE CONTRÔLE QUI EXIGE QUE LE TIRAGE LES GARDE DISTINCTES** : un garde
n'y écarterait JAMAIS rien — un entier, un décimal à décimale non nulle et un
texte ne s'écrivent jamais pareil (0 sur 2400 questions mesurées) — et un
garde-fou qui n'écarte rien fait croire qu'on vérifie quelque chose. Le banc
exige de même, tirage après tirage, qu'un texte précède chaque trou et que
chaque variable du programme paraisse exactement une fois dans la phrase : sans
le premier, rien ne dirait quelle variable on attend ; sans le second, l'énoncé
parlerait d'une variable qu'il n'a pas.
Une case VIDE n'est jamais peinte : la vérification la redemande, sans rien
colorer ni verrouiller (la règle de {placer-image}) — et le programme incomplet,
lui, ne s'exécute pas : la console montre l'erreur de Python et l'indication dit
combien de cases manquent. Aucune correction au fil de la frappe
(`soutienEnDirect.sans`) : un nom se juge écrit, pas lettre par lettre — « not »
serait déclaré faux le temps de taper « note ».
Deux bancs, la répartition habituelle : jsdom tient la fiche épinglée — si elle
ne passe pas au juge, c'est le juge qui a tort —, le tirage (400 séances), le
juge et son diagnostic cas par cas, les portes, la case vide, le soutien, les
branchements, et compare l'interpréteur à un vrai python3 sur 807 programmes,
l'INTERVERSION comprise : un programme que CPython accepte doit être accepté par
la page, et c'est là tout le piège. Le NAVIGATEUR (« 6 tricies octies », déclaré
par `pythonPlacerVariables` dans `tests/profils.js`) mesure ce que jsdom ne voit
pas — la ligne de print RENDUE d'un seul tenant, ses cases à la chasse et à la
taille du code qui les entoure, un VRAI clic sur « Vérifier » fermé qui ne juge
rien, les noms TAPÉS au clavier (Entrée exécute), la console qui montre la phrase
intervertie sans la moindre erreur, l'encre RENDUE des deux verdicts sur la même
question (l'une bleue, l'autre rouge : c'est la règle « chaque case se juge
seule », et seule une couleur rendue la montre), la bonne variable en VERT à côté
de la case fausse, et le téléphone, où la ligne DÉFILE au lieu d'être coupée. Les
contrôles universels des deux bancs ont couvert l'exercice au premier passage
sans rien déclarer.

**ET LA CASE A LA PLACE DU NOM LE PLUS LONG — la leçon du 5.5, reprise avant
qu'elle ne coûte quoi que ce soit** : sa largeur se pose en « ch », et la page
étant en `box-sizing:border-box` ces ch comprendraient le rembourrage et la
bordure. Mesuré dans un vrai Chromium : 81 px de place pour un nom de 60,4 px
en `content-box` (20,6 px de marge), 65 px en border-box (4,6 px). La page ne
coupait donc RIEN — le sabotage du box-sizing reste vert et dit vrai —, mais
elle ne tenait que par ces 4,6 px : en content-box, les ch redeviennent la
place du TEXTE. Le banc navigateur mesure le nom au CANEVAS, dans la police
EFFECTIVE de la case (la mesure du 6.3), et AFFICHE la marge la plus serrée à
chaque exécution : une police ou un nom plus long la verront fondre avant de
la faire rougir.

**Vingt-cinq sabotages, vingt-trois rougissant en nommant leur défaut** —
dix-neuf au banc jsdom (le juge qui n'exige plus la bonne valeur, celui qui n'exige plus
une VARIABLE, le diagnostic qui donne la réponse, un texte de la fiche changé,
la case vide peinte, la bonne variable qui fuit en soutien, « Vérifier »
cliquable d'emblée, les trois jeux tirés avec remise, la fiche qui n'ouvre plus
la séance, deux variables de même valeur, un trou sans texte devant lui, une
phrase qui perd une variable, le contexte sans clause de secret, l'exercice
sorti du thème, le bouton des tables revenu, le soutien qui juge à la frappe, le
rappel qui n'enseigne plus l'interversion, une case qui cesse d'être comptée,
les cases jugées ENSEMBLE) et quatre que seul le NAVIGATEUR voit — la chasse
fixe retirée des cases, la ligne de print qui se REPLIE au lieu de défiler, la
bonne variable posée SOUS la case au lieu d'à côté, et la cellule rétrécie, où
la ligne ne tient plus à 1400 px —, jsdom restant vert à bon droit sur ces
quatre-là.
**LES DEUX VERTS DISENT VRAI, et chacun apprend quelque chose.** Le box-sizing
de la case, ci-dessus : la page ne coupait rien, elle ne tenait qu'à 4,6 px près.
Et le profil qui cesse de déclarer l'exercice ne fait pas rougir le banc jsdom,
il le fait s'afficher « non applicable » — c'est la convention du projet (« un
contrôle qui ne s'applique pas se déclare, il ne se retire pas »), la ligne est
IMPRIMÉE à chaque exécution, et les contrôles universels couvrent l'exercice
quoi qu'il arrive.
**Quatre leçons de campagne, toutes déjà écrites ailleurs et toutes repayées
ici.** Quatre sabotages se sont posés sur des lignes que le 5.8 porte AU
CARACTÈRE PRÈS — la garde des cases vides, la branche du soutien, la ligne de
`pyvMaj`, la peinture des verdicts : un sabotage se pose sur une ancre PROPRE à
sa cible, et le mot « case » (le 5.8 dit « ligne ») suffit à la rendre unique.
Un cinquième était écrit avec des apostrophes TYPOGRAPHIQUES : il posait un
texte littéral au lieu d'interpoler la variable, et ne mesurait rien. Un sixième
était IMPOSSIBLE — il retirait de `checkPYV` un garde que rien n'atteint, quand
le contrôle mesure le BRANCHEMENT dans `liveCheckCurrent` ; rejoué là, il
rougit.
**Et le dernier a frappé le VOISIN, exactement comme le 5.6 en son temps** :
`checkPYV` contient `checkPY`, et le contrôle du 5.1 — dont l'ancre était le
nom NU — rougissait sous SON nom pour un défaut du 5.9. Son ancre vise
désormais l'APPEL, parenthèse comprise. Un contrôle qui s'affiche sous le nom
d'un autre est pire qu'un contrôle sans nom.
**Changer les valeurs, et tout ce qui se calcule SUIT.** {python-changer-valeurs}
(Seconde, 5.11, demande de Turquet, septembre 2026 — « en seconde faire un
exercice comme le pdf ») est l'exercice 12 du carnet : `a = 6`, `b = 5`,
`somme = a + b`, `produit = a * b`, deux `print`, et ses deux consignes —
« a) Exécuter le programme ci-dessous. b) Changer les valeurs des variables
a et b et exécuter à nouveau. » **Il a FERMÉ le thème 5, et ce bord a été
RETOURNÉ plutôt que retiré** — le QUATRIÈME à l'être, après le 5.8, le 5.9 et
le 5.10 : {python-operations} le suit depuis septembre 2026, et il vit
désormais en 5.11, entre {python-tableau-valeurs} et lui.
**CE QU'IL FAIT TRAVAILLER EST LA VARIABLE CALCULÉE, et aucun exercice du
thème ne la posait** : partout ailleurs une variable reçoit un LITTÉRAL
(`note = 12`, `prenom = "Louane"`). Ici `somme = a + b` range le RÉSULTAT du
calcul, pas le calcul — et tout ce qui en découle suit quand a et b changent.
C'est ce que le b) du carnet fait voir, et c'est la moitié la plus importante
de l'exercice.
**L'ORDRE DU CARNET EST RENVERSÉ, comme au 5.1** : sur un notebook le
professeur est à côté ; ici, un bouton cliquable avant la réponse
transformerait la question en recopie. L'élève PRÉDIT ce que le programme va
afficher — la somme et le produit, dans deux cases —, puis « Exécuter » se
débloque et il voit. « Question suivante » attend l'exécution : voir le
programme tourner est le a) de la fiche, pas une option ; et en soutien une
copie fausse le laisse verrouillé, la sortie ÉTANT la réponse.
**DEUX VISAGES, LES DEUX TEMPS DE LA FICHE** : « donne » (le a) — a et b sont
ÉCRITS par la page ; « change » (le b) — les deux premières lignes portent des
CASES, pré-remplies avec les valeurs d'origine, et c'est l'élève qui les
change, comme on modifie une ligne dans un notebook. La séance ouvre sur la
fiche du carnet épinglée (visage « donne », a = 6 et b = 5), les suivantes
sont en « change » : l'ordre du carnet, et PCV_NB en est la structure, pas un
réglage — `tests/profils.js` en est la seconde source.
**LA CONSIGNE « CHANGE LES VALEURS » EST TENUE PAR L'ÉTAT DU BOUTON** (le
motif de {placer-image}) : « Vérifier » ne juge RIEN tant que les deux cases
ne portent pas un entier, ou tant qu'aucune des deux valeurs n'a bougé — et le
message dit lequel des deux manque, sans rien peindre : rouge veut dire FAUX,
jamais « pas fini ». Les valeurs de a et b ne sont PAS des réponses et ne
comptent dans aucune note : la fiche dit « changer », elle ne dit pas
« changer en 12 ».
**LE RISQUE PROPRE EST SILENCIEUX** : la phrase de prédiction reprend le texte
des `print` AVEC LES VALEURS COURANTES, et elle se réécrit à chaque frappe.
Figée, elle ferait prédire sur des valeurs que le programme ne porte plus —
une lecture juste comptée fausse, le pire défaut du projet : la leçon du
numéro d'exercice de `show()`, transposée. Le banc jsdom l'exige, et le banc
navigateur la mesure sous un VRAI clavier.
**LA VALEUR ATTENDUE N'EST JAMAIS RANGÉE À CÔTÉ DE LA QUESTION** : elle est
lue dans `pyRun(pcvProg(…)).env` — la fonction MÊME qui exécute le programme
sous le bouton —, si bien que la correction ne peut pas contredire la console.
La question ne porte que les noms, les valeurs de départ et le visage ; le
contrôle refuse tout autre champ. Et **la valeur n'est jamais presque bonne**
— la doctrine de `pyTexteProche` prise du côté des nombres : les espaces ne
comptent pas, un chiffre de trop est FAUX.
**LES ZÉROS DE TÊTE SONT REFUSÉS, et c'est une divergence évitée plutôt que
subie** : `007` est une erreur de syntaxe en Python 3, quand l'interpréteur de
la page, lui, l'accepterait — le banc, qui compare à un vrai CPython, l'aurait
nommée. Une valeur est donc un entier de quatre chiffres au plus, signe
compris : le produit le plus grand reste très en deçà de ce que l'interpréteur
sait faire, et un négatif ou un zéro restent du Python valide, que l'exercice
accepte.
**LE BOUTON DES TABLES EST LÀ, et c'est le seul exercice Python qui l'ait** :
`produit = a * b` est un calcul de table, et le bouton n'est proposé que là où
il SERT. Les sept autres sont dans `TABLES_SANS` ; celui-ci n'y entre pas, et
les deux sources le disent.
**Aucune correction au fil de la frappe** (`soutienEnDirect.sans`) : colorer
la prédiction pendant qu'on la tape la transformerait en tâtonnement — l'élève
corrigerait jusqu'au bleu sans jamais prédire, et prédire EST l'exercice.
C'est l'argument du 5.1 (« à quatre propositions, il suffirait d'essayer »),
transposé à une case qu'on tape.
Deux bancs, la répartition habituelle : jsdom tient la fiche épinglée (si elle
ne passe pas au juge, c'est le juge qui a tort), la lecture d'une valeur, le
tirage et ses deux visages, les trois portes, la phrase qui suit, la case vide
jamais peinte, le soutien, les branchements, et compare l'interpréteur à un
vrai CPython ; le NAVIGATEUR (« 6 tricies decies », déclaré par
`pythonChangerValeurs` dans `tests/profils.js`) mesure ce que jsdom ne voit
pas — les six lignes du programme RENDUES à chasse fixe avec les cases de
valeur à la MÊME taille que le code, la case de prédiction à la taille des
nombres de sa phrase (le contrôle universel ne mesure que les `math-field`, et
celles-ci sont des `input`), un VRAI clic sur « Exécuter » verrouillé qui ne
fait rien, les valeurs TAPÉES au clavier et la phrase qui les suit sous les
doigts, l'encre RENDUE des verdicts, la console, et la page qui ne déborde pas
sur un téléphone.
**Vingt-trois sabotages au banc jsdom et trois au navigateur**, vingt-cinq
rougissant en nommant leur défaut. **Deux sont d'abord restés VERTS, et aucun
des deux n'était un contrôle mort** : « la correction au fil de la frappe »
posait sa copie avec une case VIDE, or une case vide arrête la vérification
avant toute peinture — le sabotage ne pouvait pas atteindre ce qu'il visait,
et la copie du contrôle est ENTIÈRE depuis ; et « la phrase ne se replie plus
sur un téléphone » disait vrai — à 390 px la phrase la plus longue tient sans
repli, le `flex-wrap` est une ceinture et non un garde-fou éprouvé. Le dire
vaut mieux que de le taire.
**DEUX DÉFAUTS ONT ÉTÉ TROUVÉS EN RELECTURE, qu'aucun banc n'aurait
nommés** : la description de la carte passe par `esc(numeros(desc))`, donc les
balises `<code>` que j'y avais écrites se seraient affichées EN TOUTES LETTRES
à l'élève — le contrôle universel des gabarits ne vise que `${…}` et les
`{identifiant}` connus ; et le signe moins TYPOGRAPHIQUE, celui qu'affiche le
pavé des tablettes, était refusé par le juge, ce qui aurait compté fausse une
réponse juste.
**ET TROIS FUSIONS DE `main` L'ONT RENUMÉROTÉ, avec les trois collisions
que le projet connaît.** {python-placer-variables} puis
{python-tableau-valeurs} sont arrivés sur `main` pendant la préparation de la
branche et ont pris le 5.9 et le 5.10 : celui-ci ferme le thème en **5.11**, et
la section du banc navigateur est descendue de « nonies » à « **decies** », le
numéro revenant chaque fois au premier arrivé. **`APP_VERSION` est la collision
la plus silencieuse des trois** : elle a monté à 179, puis 180, puis **181**
quand la bulle « Comprendre mon erreur » l'a posée à 180 de son côté — or deux
écritures du MÊME nombre ne font aucun conflit textuel, et rien ne le dit. Les
trois numéros se relisent donc À LA MAIN à chaque fusion : celui de l'exercice,
celui de la section du banc, et celui de la version.
**Et les deux pièges de la fusion « les deux côtés ont ajouté » sont retombés
tels quels** : la ligne `RAPPELS` s'est retrouvée
DÉCLARÉE DEUX FOIS et l'écran de {python-placer-variables} n'était plus
REFERMÉ — ses trois lignes de fermeture étaient communes aux deux blocs, et
« garder les deux » ne les a gardées qu'une fois. Aucun marqueur de conflit ne
le disait ; c'est `npm test` qui a nommé les deux. **Un troisième s'y est
ajouté, et c'est le piège d'ETQ_W** : `RAP_PCV` s'est retrouvé APRÈS le
`RAPPELS` qui le lit — une constante ne se hisse pas, et la page entière
mourait au chargement. **Et mon propre remplacement a frappé le VOISIN** : le
libellé « il FERME le thème 5 » est le même, au caractère près, dans le
contrôle de {python-placer-variables} — un remplacement se pose sur une ancre
PROPRE à sa cible, la leçon d'{antecedents-droite}, retombée dans un fichier
de banc. Le bord du 5.9 a été RETOURNÉ, pas retiré : il ne ferme plus le
thème, il vit après {python-deux-lignes} — et celui du 5.10 l'a été à son tour
à la fusion suivante.

**Un libellé qui promet un CALCUL ment sur la variable qu'il annonce.**
Signalé par Turquet (septembre 2026) sur le 5.9 : « je ne comprends pas
pourquoi il y a "sa moyenne" dans la phrase ». Le jeu des notes écrivait
« la 1ère note de Maëlys est 16 et sa moyenne est 18.4 sur 20 » — or `note2`
est la 2ème note, et 18,4 n'est la moyenne de rien : la page affirmait une
fausseté arithmétique dans un cours de mathématiques.
**LA SONDE A MESURÉ AVANT TOUT CORRECTIF, ET ELLE A ÉLARGI LE SIGNALEMENT** :
le mensonge vivait dans QUATRE exercices, par le même libellé de `PY_JEUX` —
400 questions sur 400 au 5.9 (ses DEUX phrases du jeu des notes), 92 sur 400
séances au 5.1 (« la moyenne est : 16.8 » sous un « note1 = 13 » affiché deux
lignes plus haut), 64 au 5.7 et 134 au 5.8. Un défaut vu dans un coin se
corrige PARTOUT.
**AU 5.9 IL EST PIRE QU'AILLEURS, et c'est ce que le signalement dit** : le
texte devant la case EST la question — « et sa moyenne est » réclame une
grandeur qu'AUCUNE variable ne porte, et l'élève qui raisonne juste ne peut pas
répondre. Les deux phrases du jeu disent maintenant « et sa 2ème note est » et
« 1ère note : … 2ème note : », et le libellé partagé « la deuxième note est : ».
**LES NOMS NE BOUGENT PAS, et c'est un arbitrage nommé** : renommer `note2` en
`moyenne` aurait rendu la phrase vraie et DÉTRUIT le piège du 5.8, dont tout le
sujet est de transposer une ligne modèle entre trois variables qui SE
RESSEMBLENT (note1, note2, prenom). On corrige les LIBELLÉS, jamais les
variables — les notes déjà obtenues ne bougent pas non plus, elles portent
l'identifiant.
**DEUX BORDS AU CONTRÔLE, ET N'EN TENIR QU'UN NE TIENT RIEN** : aucun libellé
des quatre exercices ne nomme une grandeur CALCULÉE (moyenne, somme, total,
produit, différence, écart) ; et aucun programme tiré ne porte d'opérateur —
c'est ce second bord qui DONNE SA RAISON au premier et l'empêche d'être une
liste noire : ces programmes affectent puis affichent, donc toute valeur montrée
est une valeur DONNÉE, jamais dérivée d'une autre. Le jour où un tirage
calculerait vraiment, il rougirait, et la règle serait à revoir plutôt qu'à
contourner. Le contrôle COMPTE ce qu'il relit — 44 libellés, 600 programmes —
et le DIT s'il n'a rien à mesurer : une collecte devenue muette le rendrait vert
sur un mensonge.
**Aucun contrôle du NAVIGATEUR, et le dire vaut mieux que de le taire** : un
libellé est une chaîne, et la phrase se lit dans le DOM — jsdom la voit, un vrai
Chromium n'en dirait pas plus. Six sabotages, chacun rougissant en nommant son
défaut : le libellé de `PY_JEUX` remis (« PY_JEUX[0] note2 promet un calcul que
le programme ne fait pas »), chacune des DEUX phrases du 5.9 remise (il nomme
`PYV_PHRASES[0][0]` puis `[0][1]` — n'en tenir qu'une ne tiendrait rien), un
programme qui calcule (le bord opposé, qui nomme l'opérateur ET le programme),
et les deux gardes « le contrôle ne mesure rien » — la collecte des phrases
débranchée (23 libellés au lieu de 44) et une source de programmes débranchée
(480 au lieu de 600).
**ET LA FUSION A LAISSÉ DEUX PAGES SOUS LE MÊME NUMÉRO — la collision qu'un
`git merge` ne signale pas.** Pendant que cette branche se faisait,
{python-changer-valeurs} est arrivé sur `main` en **v181** ; la branche, partie
d'un `main` à 180, avait bumpé vers 181 elle aussi. Les deux côtés écrivant la
MÊME valeur sur la MÊME ligne, git n'a vu aucun conflit : la fusion est passée
sans un mot, et 181 a désigné deux pages de Seconde différentes — exactement ce
que la règle 4 interdit (« ce numéro permet de savoir d'un coup d'œil quelle
version est ouverte »). La règle des collisions du projet tranche sans rien
peser : le premier arrivé garde, le second prend le suivant — cette page passe
en **182**.
**ET C'EST LA VÉRIFICATION DE LA PUBLICATION QUI L'A NOMMÉE, pas un banc** :
`APP_VERSION` lu sur la page en ligne disait déjà 181 AVANT que GitHub Pages
n'ait reconstruit, si bien qu'il ne prouvait RIEN — c'est en cherchant le
LIBELLÉ corrigé que la publication s'est constatée, et la contradiction (181
avec les anciens libellés) qui a mis la collision au jour. **On ne vérifie pas
une mise en ligne sur un numéro qu'on vient de poser** : on la vérifie sur ce
que la modification a CHANGÉ. Un numéro qui n'a pas bougé passe pour une page
qui n'a pas bougé, et l'inverse est tout aussi vrai.

**Les quatre opérations dans un programme : on exécute, on CHANGE a et b, puis
on complète.** {python-operations} (Seconde, 5.12, demande de Turquet, septembre
2026 : « faire un exercice en seconde comme les 2 images ») ferme le thème 5 —
ajouté en dernier, il ne renumérote rien. C'est l'exercice 12 du carnet et sa
suite, en quatre temps : a) exécuter un programme qui calcule la SOMME et le
PRODUIT de deux variables ; b) CHANGER les valeurs de a et de b et exécuter à
nouveau ; c) le compléter pour qu'il affiche EN PLUS la différence et le
quotient de a par b ; d) le tester en changeant les valeurs.
**CE QU'IL AJOUTE AUX DEUX EXERCICES D'AVANT EST TOUT LE SUJET** : le 5.7 et le
5.8 font écrire des lignes d'AFFICHAGE sur des variables déjà affectées ; ici la
variable naît d'un CALCUL — `difference = a - b` —, et c'est la première fois
que l'élève écrit une opération dans un programme. D'où DEUX familles de cases :
l'EXPRESSION à droite du signe égal (la page écrit le nom, comme le carnet, qui
n'y laisse que des points de suspension) et la LIGNE D'AFFICHAGE entière, sur le
modèle des deux déjà écrites.
**LE COURS EST LE a) ET LE b) DE LA FICHE, SUR SON PROPRE ÉCRAN** (le motif du
5.7) : le programme de la première image, dont a et b sont deux CASES.
« J'ai compris » ne s'ouvre qu'après DEUX exécutions à valeurs DIFFÉRENTES — le
b) est tenu par l'ÉTAT du bouton et non par une consigne qu'on peut ne pas lire
(la leçon de {placer-image}). Exécuter une fois ne montre rien : c'est le
CHANGEMENT qui fait voir que le programme calcule au lieu de recopier. Une
valeur qui n'est pas un nombre reçoit l'erreur de Python, comme dans un vrai
carnet, et ne compte pas pour un essai.
**LE JUGE NE COMPARE JAMAIS À UNE ÉCRITURE : il EXÉCUTE.** Une expression est
juste si la variable prend la bonne valeur — `a - b`, `a-b`, `(a-b)`,
`0 + a - b` passent toutes. Refuser une écriture juste serait le pire défaut du
projet, par la porte d'un exécuteur.
**ET LA SECONDE MÉTHODE EST LE d) DE LA FICHE** : on rejoue le calcul avec un
AUTRE couple (a, b) et on exige qu'il SUIVE. `difference = 8` donne la bonne
valeur une fois et ne suit pas ; `print("La différence de",10,"et",2,…)` non
plus. C'est la doctrine de {python-afficher-variable}, et c'est exactement ce
que le d) demande à l'élève de faire — **la page le lui MONTRE d'ailleurs une
fois sa copie juste**, son programme rejoué sous d'autres valeurs. Le second
couple est CHERCHÉ et non supposé : il faut que les QUATRE valeurs changent,
sans quoi le rejeu n'écarterait rien (avec a = 10 et b = 2, le couple 9 / 3
garde la somme 12), et le contrôle l'exige tirage après tirage.
**CHAQUE CASE SE JUGE SEULE** : une ligne d'affichage est jugée sur les calculs
TÉMOINS, jamais sur ceux de l'élève — sans quoi une expression fausse ferait
rougir l'affichage qui la lit, et l'élève paierait deux fois la même erreur. Les
deux lignes d'affichage suivent la règle des paires d'{antecedent-nombre}
(`pydApparier`, la fonction MÊME de {python-deux-lignes}) : rien à l'écran ne dit
quelle case porte laquelle, l'ordre est donc libre. Les deux EXPRESSIONS, elles,
sont ancrées à leur nom, que la page écrit devant la case.
**LE PROGRAMME DU JUGE D'UNE EXPRESSION S'ARRÊTE À LA LIGNE JUGÉE**, et la sonde
l'a montré avant le premier contrôle : `difference = somme` levait une NameError
sur une variable qui existe pourtant trois lignes plus haut, et le diagnostic
accusait une majuscule (« la variable s'appelle « somme », pas « somme » »). Les
calculs qui PRÉCÈDENT sont là, ceux qui suivent non — c'est ce que Python voit à
cet endroit — et le diagnostic nomme alors la vraie erreur : le calcul donne la
somme. La même sonde a montré un second défaut : `"a - b"` entre guillemets
recevait « ton calcul ne suit pas quand a et b changent » alors qu'il ne donne
même pas la bonne valeur ; ce message-là ne se prononce plus que sur une valeur
JUSTE, et le texte entre guillemets a sa branche.
**LE TIRAGE GARANTIT QUE a EST UN MULTIPLE DE b**, et ce n'est pas une
coquetterie : le quotient tombe alors juste et Python l'écrit quand même avec un
point — `5.0` — ce qui EST la leçon du visage décimal du {python-affichage} ;
sans cette garantie, `7 / 3` afficherait 2.3333333333333335 et la question ne
parlerait plus que de flottants. La fiche du carnet respecte d'elle-même la
règle (a = 10, b = 2), et elle est ÉPINGLÉE en première question. Les deux
autres questions écrivent les deux opérations restantes, si bien que chacune des
quatre est écrite au moins une fois dans la séance et sert de modèle au moins
une fois ; les trois paires restent deux à deux distinctes, et les trois couples
(a, b) aussi. Sonde : 400 séances, 58 couples distincts, aucun tirage sans
second couple.
**TOUT EST REPRIS, RIEN N'EST RECOPIÉ** : l'interpréteur est `pyRun`, la
tolérance des textes `pyTexteProche` et `pyEcart`, les erreurs d'une ligne
`pyxDiagErreur` (à qui l'on passe la liste des variables du programme, le
paramètre que le 5.8 lui avait appris), la règle des paires `pydApparier`, le
cadre des coups de pouce `pyPoucesHTML`, et le programme se dessine avec les
classes du 5.7 (`pyx-prog`, `pyx-ligne`, `pyx-num`, `pyx-l1`, `pyx-in`) : trois
feuilles de styles auraient fini par diverger, et trois exercices voisins se
seraient dessinés différemment sous les yeux de l'élève.
**ET C'EST LÀ QUE LE BANC NAVIGATEUR A TROUVÉ UN DÉFAUT QUE jsdom NE POUVAIT PAS
VOIR** : la règle qui pose la bonne écriture en vert SOUS la case — celle que le
5.7 avait gagnée sur une capture — nomme ses hôtes un par un
(`#pyxHost`, `#pydHost`), et l'écran neuf n'y était pas : le badge se rangeait à
DROITE de la case, d'où il sort de l'écran sur un téléphone. Une liste de
sélecteurs tenue à la main dérive, et c'est le RECTANGLE rendu qui l'a dit.
**Deux contrôles d'à côté ont bougé, et aucun n'a été retiré.** Celui des
fractions plates des rappels rougissait sur `a / b` : **une barre de division
dans une balise `code` est du CODE, pas une fraction** — c'est l'opérateur que
l'élève tape, et l'empiler serait lui montrer autre chose que ce qu'il écrira.
Il retire donc les balises `code` avant de chercher, exactement comme le
contrôle des numéros en dur le fait depuis {python-types} ; une vraie fraction
posée dans la PROSE rougit toujours. Et le bord du 5.8 (« il FERME le thème 5 »)
a été RETOURNÉ, pas retiré : il vit maintenant entre {python-completer} et
{python-operations} — un bord retiré ne dit plus rien, un bord retourné dit la
règle du jour.
**Et la fusion de `main` a présenté les TROIS collisions que ce fichier nomme,
ensemble** : {python-placer-variables} est arrivé en 5.9 pendant la préparation
de la branche — celui-ci ferme le thème en 5.10 ; `APP_VERSION` y était déjà à
178, le numéro que cette branche écrivait aussi (deux écritures du MÊME nombre
ne font aucun conflit textuel, git garde la valeur et rien ne le dirait) → 179 ;
et le numéro de section du banc navigateur « 6 tricies octies » était pris → le
mien prend « nonies », le numéro revenant au premier arrivé. Le bord « il FERME
le thème 5 » de {python-placer-variables} a été RETOURNÉ à son tour, comme celui
du 5.8 l'avait été avant lui. La zone n'a PAS été recousue hunk par hunk : on
repart du fichier de `main` et on y REPOSE ses blocs COMPLETS, à des ancres
vérifiées une par une — c'est ce qui a montré que la ligne `const RAPPELS` est
COMMUNE aux deux blocs et qu'un « garder les deux » l'aurait déclarée DEUX fois.
Et mon propre remplacement a frappé le VOISIN : le libellé « il FERME le thème 5,
numéroté 5.9 » est le même, au caractère près, dans le contrôle de
{python-placer-variables} — une ancre se choisit PROPRE à sa cible, ici le corps
qui lit `RAPPELS.pop`.
**Puis une SECONDE fusion a présenté les TROIS MÊMES collisions, et la règle a
tranché sans qu'on ait à réfléchir** : {python-tableau-valeurs} est arrivé en
5.10 — celui-ci ferme donc le thème en **5.11** —, `APP_VERSION` était passée à
180 → 181, et « 6 tricies nonies » était pris → « decies », le numéro revenant
au premier arrivé. Le bord « il FERME le thème 5 » de {python-tableau-valeurs} a
été RETOURNÉ à son tour — il est le TROISIÈME à l'être, après le 5.8 et le 5.9 :
un bord retiré ne dit plus rien, un bord retourné dit la règle du jour. Et
l'ancre a frappé le VOISIN une seconde fois, au même endroit : « il FERME le
thème 5, numéroté 5.10 après {python-placer-variables} » était le même libellé,
au caractère près, dans les DEUX contrôles — l'assertion du script l'a refusé
(« trouvé 2 fois, attendu 1 ») au lieu de saboter le voisin, et le remplacement
se pose désormais dans la TRANCHE de chaque contrôle, bornée par sa propre
`function`. Deux branches qui ajoutent un exercice au même thème le même jour
produisent cette collision à CHAQUE fois : ce n'est pas un accident, c'est ce
qu'il faut relire au moment de refusionner `main`.
**Puis une TROISIÈME fusion, et la règle n'a plus rien coûté** :
{python-changer-valeurs} est arrivé en 5.11 — celui-ci ferme donc le thème en
**5.12** —, `APP_VERSION` était passée à 181 → 182, et « 6 tricies decies »
était pris → « undecies ». Le bord « il FERME le thème 5 » de
{python-changer-valeurs} a été RETOURNÉ à son tour, le QUATRIÈME. **Et la
CINQUIÈME collision du même jour n'est pas une collision de plus, c'est la
même** : deux exercices écrits sur le même carnet, le 12, arrivés par deux
branches — le nôtre le prolonge (c) et d)), l'autre s'arrête à son b). Les deux
gardent leur place, et les deux lignes du carnet se lisent à la suite dans le
menu. La leçon qui reste est celle des blocs COMPLETS : à la troisième fusion,
les huit conflits de `secondes.html` se sont résolus sans une seule recouture
hunk par hunk — le `const RAPPELS` commun aux deux blocs, la ligne
`return {nombre:'', contexte:c};` commune aux deux contextes et la liste des
rendus enveloppés étaient exactement là où les deux fusions précédentes les
avaient laissées.
**Deux bancs, la répartition habituelle.** jsdom tient les deux programmes des
images épinglés (s'ils ne passent pas au juge, c'est le juge qui a tort), le
juge cas par cas — quinze calculs faux et quatorze lignes d'affichage fausses,
chacun avec le mot que son diagnostic doit porter —, la seconde méthode, le
tirage sur 400 séances, les portes, la case vide, le soutien, le contexte du
modèle, et il compare l'interpréteur à un vrai CPython sur 671 programmes. Le
NAVIGATEUR (« 6 tricies undecies », déclaré par `pythonOperations` dans
`tests/profils.js`) mesure ce que jsdom ne voit pas : les deux cases de valeur
du cours sur la ligne de leur nom, une VRAIE frappe dans a et b puis un vrai
clic qui ouvre la porte, les coups de pouce qui S'OUVRENT au clic, les six
lignes écrites et les quatre cases à chasse fixe et à la MÊME taille, la case
COURTE du calcul posée sur la ligne de son nom, un VRAI clic sur « Vérifier »
fermé qui ne juge rien, l'encre RENDUE des verdicts sur la même question — une
rouge et trois bleues, ce que seule une couleur rendue montre —, le rejeu mesuré
au RECTANGLE, et la page qui ne déborde pas sur un téléphone.
**Vingt et un sabotages, chacun rougissant en nommant son défaut** — dix-huit au
banc jsdom (le second couple qui reprend une valeur, chacune des deux secondes
méthodes débranchée, la variable employée qui n'est plus exigée, la règle des
paires débranchée, a qui n'est plus multiple de b, les quatre opérations perdues,
la fiche qui n'ouvre plus la séance, la porte ouverte après une exécution, une
exécution en erreur comptée pour un essai, « Vérifier » cliquable d'emblée, la
case vide peinte, le soutien qui révèle, le rejeu retiré, un affichage jugé sur
les calculs de l'élève, l'exercice sorti du thème 5, la clause de secret perdue,
le diagnostic de la division entière retiré) et trois que seul le NAVIGATEUR
voit. **Deux d'entre eux ont d'abord échoué à se poser** : la ligne de la règle
des paires et celle de la case vide sont écrites au caractère près dans
{python-deux-lignes} — un sabotage se pose sur une ancre PROPRE à sa cible (la
leçon d'{antecedents-droite}), et reposé sur une ancre unique chacun rougit.
**Et le premier essai du contrôle navigateur a rougi sur du code juste** : il
comparait les bords GAUCHES de la case et du badge, alors que la case d'un
calcul est décalée par le nom que la page écrit devant elle. Corrigé pour
mesurer le vrai bord — SOUS la case, jamais à DROITE —, il a alors nommé le
défaut RÉEL de la page.
**Et un troisième est d'abord resté VERT parce qu'il ne pouvait pas ATTEINDRE
sa cible** : donner à la case du calcul une base flex de 100 % ne la fait pas
passer à la ligne — la taille hypothétique d'un élément flex est CLAMPÉE par son
`max-width` avant que le repli ne se décide, et la case en a un. Posé sur
l'étiquette, qui n'en a pas, il rougit en nommant les deux écrans (le cours et
la question). Avant de conclure qu'un contrôle ne mesure rien, il faut vérifier
que le sabotage pouvait seulement l'atteindre.

**Le double, le triple et le carré : trois calculs, trois affichages, et a qui
CHANGE.** {python-double-triple-carre} (Seconde, 5.13, demande de Turquet,
septembre 2026 : « créer un exercice comme l'image ») est l'exercice 13 du
carnet. **Il a FERMÉ le thème 5, et ce bord a été RETOURNÉ dès le lendemain** —
le SIXIÈME à l'être, après le 5.8, le 5.9, le 5.10, le 5.11 et le 5.12 :
{python-pas-a-pas} le suit depuis, et celui-ci vit en 5.13, entre
{python-operations} et lui. Un bord retiré ne dit plus rien ; un bord retourné
dit la règle du jour.
Le programme commence par `a = 8` ; l'élève écrit les trois calculs
(`double = …`, `triple = …`, `carre = …`) puis les trois lignes d'affichage
sur le modèle `print("Le double de", a, "est égal à ", double)`, exécute, et
vérifie. Puis le b) du carnet : « Tester votre programme plusieurs fois en
changeant la valeur de la variable a. »

**CE QU'IL AJOUTE AUX DOUZE AUTRES EST LA VARIABLE QUI SERT DEUX FOIS** : au
5.11 une variable calculée dépend de deux autres et les SUIT ; ici c'est la
MÊME variable a qui nourrit trois calculs, et le b) le fait voir — un élève
qui écrit `double = 16` obtient la bonne sortie une fois et rien de juste
ensuite. C'est aussi la première fois qu'il écrit TROIS lignes d'affichage à
la suite.

**LE JUGE NE COMPARE JAMAIS À UNE ÉCRITURE : IL EXÉCUTE** — et sa SECONDE
MÉTHODE est le b) DE LA FICHE, fait par la page. Un calcul est juste si la
variable prend la bonne valeur pour le a de l'énoncé ET pour un AUTRE a
(`pdcAutre`) : `a + a`, `2 * a`, `a * 2`, `0 + 2 * a` passent tous ; `16`
recopié à la main tombe juste une fois et se voit refusé à la seconde, avec
la phrase qui le dit (« ton calcul tombe juste pour a = 8, mais plus quand a
change »). C'est la doctrine de {python-afficher-variable} et du 5.12,
reprise : ce qu'on demande est un CALCUL, pas un résultat.

**L'ORDRE DES TROIS LIGNES D'AFFICHAGE EST LIBRE** — rien à l'écran ne dit
quelle case porte laquelle — et c'est la règle des paires
d'{antecedent-nombre}, portée à TROIS par `pydApparier`, la fonction MÊME du
5.8 : chaque ligne se juge sur ce qu'elle PROMET (afficher l'un des trois
affichages attendus) et la liste les prend une fois chacune ; la même ligne
écrite deux fois est défendable une fois, fausse la seconde. Les
EXPRESSIONS, elles, sont ancrées à leur nom, que la page écrit devant la
case.

**LE GARDE DU TIRAGE PROTÈGE LE DIAGNOSTIC, ET NON LE VERDICT — mesuré
plutôt que supposé.** Les trois valeurs sont deux à deux distinctes, donc
a = 2 (double et carré valent 4) et a = 3 (triple et carré valent 9) sont
écartés. Le premier jet du contrôle justifiait ce garde par le VERDICT, et
la sonde l'a renvoyé : sur ces valeurs, un `carre = 2 * a` est quand même
REFUSÉ — la seconde méthode le rejoue sous un autre a. Ce qui casse est la
PHRASE : à a = 3, « double = a * a » se voit répondre « ton calcul donne le
TRIPLE » alors que l'élève a écrit le carré, et la page lui apprend une
fausseté sur sa propre ligne. **Un diagnostic qui dit autre chose que
l'erreur est pire que « faux »** (la leçon du 5.7). Relevé sur les bornes :
70 diagnostics nomment ce que l'élève a écrit, et les 2 seuls qui se
trompent sont exactement a = 2 et a = 3. Le contrôle EXIGE les deux bords —
le garde vivant, et le mensonge sur les valeurs écartées.

**TOUT EST REPRIS, RIEN N'EST RECOPIÉ** : l'interpréteur est `pyRun`, les
diagnostics d'une ligne `pyxDiagErreur` et `pyxDiagSortie`, la tolérance des
textes `pyTexteProche` et `pyEcart`, la règle des paires `pydApparier`, le
cadre des coups de pouce `pyPoucesHTML`, les variables `PY_JEUX` ; le
programme se dessine avec les classes du 5.7 (`pyx-prog`, `pyx-ligne`,
`pyx-num`, `pyx-in`) et la case COURTE du calcul reprend `.pop-lbl` et
`.pop-ex` du 5.12 — quatre feuilles de styles auraient fini par diverger.
Ne vit ici que le b) (`.pdc-b`).

**LA CHAÎNE DES PORTES EST CELLE DU CARNET : écrire, EXÉCUTER, vérifier,
puis TESTER.** « Vérifier » ne s'ouvre qu'une fois le programme exécuté tel
qu'il est écrit et se referme sur une ligne modifiée (le motif du 5.7) ; et
« Question suivante » attend le b) — deux valeurs de a AUTRES que celle de
l'énoncé, exécutées sans erreur. **Le b) ne s'ouvre que sur une copie
JUSTE** : on ne teste pas un programme qui ne marche pas, et sur une copie
fausse « Question suivante » reste libre. Une valeur qui n'est pas un nombre
reçoit l'erreur de Python, comme dans un vrai carnet, et ne compte pas pour
un essai.

Une case VIDE n'est jamais peinte — la vérification la redemande, sans rien
colorer ni verrouiller ; chaque case se juge SEULE (six cases sur la fiche,
quatre sur les autres questions, une des trois quantités étant alors DONNÉE
par la page) ; la bonne écriture s'affiche en VERT SOUS la case fausse, en
entraînement seulement ; en soutien le message dit « Où est l'erreur ? » et
l'élève revérifie. Aucune correction au fil de la frappe
(`soutienEnDirect.sans`) : une ligne de code se juge écrite, pas lettre par
lettre.

**Deux bancs, la répartition habituelle.** jsdom tient la fiche du carnet
ÉPINGLÉE (si elle ne passe pas au juge, c'est le juge qui a tort), le garde
du tirage et le mensonge du diagnostic sur les valeurs qu'il écarte, la
seconde méthode, les deux juges cas par cas, la règle des paires sur les
trois lignes, la place au menu, le tirage sur 400 séances, la copie juste,
la copie fausse, la case vide, le soutien, les branchements, et il compare
l'interpréteur à un vrai CPython — la divergence ASSUMÉE du « ^ » comprise.
Le NAVIGATEUR (« 6 tricies terdecies », déclaré par
`pythonDoubleTripleCarre` dans `tests/profils.js`) mesure ce que jsdom ne
voit pas : les six lignes TAPÉES au clavier, la case COURTE du calcul sur la
ligne de son nom, un VRAI clic sur « Vérifier » fermé qui ne juge rien,
l'encre RENDUE des verdicts — une rouge et cinq bleues sur la même question,
ce que seule une couleur rendue montre —, la ligne verte SOUS la case fausse
et jamais à droite, le panneau du b) mesuré au RECTANGLE, une VRAIE frappe
dans a suivie d'Entrée, et la page qui ne déborde pas sur un téléphone.

**ET LE PREMIER JET DU CONTRÔLE NAVIGATEUR A ACCUSÉ LA PAGE À TORT** : il
exigeait que la console rende autant de lignes que l'élève en a écrites — or
sur les questions autres que la fiche l'élève n'en écrit que DEUX, la page
écrivant la troisième, et le programme en affiche trois quoi qu'il arrive.
La mesure instrumentée l'a nommé en une exécution (`sorties2` à deux entrées
devant une console à trois lignes) : c'est « une mesure qui accuse la page
se mesure elle-même d'abord », retombée telle quelle. Le contrôle en est
sorti PLUS fort — il exige désormais que les TROIS sorties suivent a, celle
que la page a écrite comprise, et que le b) ne soit inséré qu'une fois.

**Et le bord « il FERME le thème 5 » de {python-operations} a été RETOURNÉ
plutôt que retiré** — le CINQUIÈME à l'être, après le 5.8, le 5.9, le 5.10 et
le 5.11 : il ne ferme plus le thème, il vit entre {python-changer-valeurs} et
{python-double-triple-carre}. Un bord retiré ne dit plus rien, un bord
retourné dit la règle du jour.

**Dix-sept sabotages, chacun rougissant en nommant son défaut** — quinze au
banc jsdom (la seconde méthode débranchée, la règle des paires, le garde du
tirage, la case vide peinte, le soutien qui révèle, « Vérifier » cliquable
d'emblée, « Question suivante » ouverte sans le b), le b) ouvert sur une copie
fausse, le « ^ » imité, l'exercice sorti du thème 5, le bouton des tables
revenu, la clause de secret perdue, la séance raccourcie, la fiche qui n'ouvre
plus la séance, la variable EMPLOYÉE) et deux que seul le NAVIGATEUR voit.
**ET LE QUINZIÈME EST D'ABORD RESTÉ VERT, en nommant un trou du CONTRÔLE** :
retirer `pyxUtilise` — l'exigence que la ligne d'affichage emploie la
VARIABLE — ne faisait rougir personne, parce que le banc n'éprouvait que la
valeur RECOPIÉE à la main (`…, 16`), que la seconde méthode écarte déjà en la
rejouant sous un autre a. C'est la valeur RECALCULÉE (`…, 2 * a`) qui départage :
elle SUIT quand a change, et seul `pyxUtilise` la refuse. Le cas ajouté, le
sabotage rougit en nommant sa ligne — et le garde n'était donc pas mort. **Avant
de conclure qu'un contrôle ne mesure rien, il faut vérifier que le sabotage
pouvait seulement l'atteindre.**

**ET LA FUSION DE `main` A REPRÉSENTÉ LA COLLISION DES NUMÉROS DE SECTION,
celle qu'aucune branche ne peut voir seule** : « 6 tricies duodecies » avait
été pris par la case de limite de la Terminale pendant que celle-ci se
faisait, et les deux bancs étaient verts à bon droit — chaque branche n'avait
qu'UN de ces numéros. C'est le contrôle de la section « 0 », qui lit la source
du banc, qui l'a nommée à la première exécution d'après la fusion. La règle
tranche sans rien peser : le numéro revient au premier arrivé, et cette
section prend « 6 tricies terdecies ». Les deux autres collisions de la
famille n'avaient rien à dire cette fois — `main` ne touchait ni au thème 5 ni
à `APP_VERSION` de la Seconde — mais elles se relisent à chaque fusion, comme
celle-ci.

**Une variable est une CASE de la mémoire, et ça ne se voit qu'en exécutant pas
à pas.** {python-pas-a-pas} (Seconde, 5.14, demande de Turquet, septembre
2026 : « en seconde faire un exercice comme le pdf joint ») est la fiche
« variable pas à pas » — « Exécuter le programme ci-dessous en mode pas à
pas », le programme `a = 10 ; b = 2 ; c = b`, puis l'exécution ligne par ligne,
chaque ligne suivie du tableau des cases MÉMOIRE de l'ordinateur et d'un
« appuyez pour passer à l'étape suivante », et enfin les phrases à compléter
(« a = 10 signifie que le nombre 10 va dans la case mémoire appelée … »). Il
ferme le thème 5, en 5.14 — ajouté en dernier, il ne renumérote rien.
**CE QU'IL AJOUTE AU THÈME est la marche qui manquait** : le 5.1 fait PRÉDIRE
ce qu'un programme affiche, le 5.2 fait RECONNAÎTRE un type, et les dix autres
font ÉCRIRE du code. Aucun ne montre ce qu'une variable EST — une case qui
porte un nom et garde une valeur —, et c'est précisément ce qu'on ne voit
jamais en exécutant un programme d'un bloc.
**LA FICHE MONTRE L'EXÉCUTION, ICI C'EST L'ÉLÈVE QUI LA PRODUIT.** Sur le
papier les trois tableaux de mémoire sont DONNÉS et seules les phrases finales
sont à compléter ; une page qui se contenterait de les afficher ne demanderait
rien. L'élève avance donc ligne par ligne et REMPLIT la rangée que la ligne
ajoute : la case qui reçoit la valeur, et ce qu'elle contient. Ce sont
exactement les deux blancs des phrases de la fiche — « va dans la case mémoire
appelée … » et « le nombre dans la case b qui est … » —, posés là où ils se
lisent : dans le tableau de la mémoire. **Les phrases finales ne sont pas
reposées à part**, et c'est un arbitrage : elles disent en mots ce que les deux
cases de chaque rangée disent déjà, et les redemander ferait taper trois fois
la même réponse. Leur VOCABULAIRE, lui, est celui de l'écran — « case
mémoire », « ce qu'elle contient » — parce que c'est le mot de la fiche que
l'élève doit retenir.
**LA VÉRIFICATION EST PAR LIGNE, et c'est ce qui rend chaque case honnête.**
Une fois la ligne jugée, la page pose la rangée VRAIE : la copie de la ligne
suivante lit donc la mémoire telle qu'elle EST, jamais celle que l'élève
croyait. Sans cela, un élève qui s'est trompé sur b paierait DEUX fois la même
erreur — sur b, puis sur le c qui le recopie —, ce que le 5.12 nomme déjà
(« une ligne d'affichage est jugée sur les calculs TÉMOINS, jamais sur ceux de
l'élève »). La porte de la ligne suivante est tenue par l'ÉTAT du bouton (le
motif de {placer-image}) : « Passer à la ligne suivante » n'existe qu'une fois
la ligne jugée. En SOUTIEN elle attend une rangée TOUTE juste — on n'exécute
pas la ligne d'après quand on s'est trompé sur celle-ci —, et rien n'est
révélé : l'élève reprend et revérifie.
**TROIS VISAGES, CHACUN UNE FOIS PAR SÉANCE, et le premier est la fiche** : la
copie prend la case JUSTE au-dessus (`c = b`, les valeurs 10 et 2 du papier) ;
elle va chercher la PREMIÈRE case, deux lignes plus haut — l'erreur visée est
de recopier la case la plus proche ; ou c'est une copie de COPIE, où il faut
suivre deux sauts et où la valeur d'origine se retrouve dans trois cases. Les
deux derniers sont en ordre mélangé ; sans eux, la copie serait toujours le
même geste.
**AUCUNE RÉAFFECTATION, et ce n'est pas un oubli** : « une variable ne
s'affecte qu'UNE fois par programme » est la règle du 5.1 (demande de Turquet,
septembre 2026), que le diagnostic du 5.3 retourne déjà vers l'élève, et la
fiche n'en porte pas non plus. **Aucun calcul non plus** : {python-operations}
enseigne la variable qui reçoit le RÉSULTAT d'un calcul, et deux leçons dans un
même exercice rendent la faute illisible (la leçon de {multiplier-fractions}).
Une case reçoit un NOMBRE ou le CONTENU d'une autre case — rien d'autre, comme
sur la fiche — et le contrôle exige les deux propriétés sur chaque tirage.
**LA VALEUR N'EST JAMAIS RANGÉE À CÔTÉ DE LA QUESTION** : elle est lue dans
`pyRun(papProg(q, k)).env` — l'interpréteur MÊME du 5.1, arrêté après la ligne
k —, si bien que la correction ne peut pas contredire le programme affiché. La
question ne porte que les LIGNES, le visage et l'ORDRE des propositions (on
range l'ordre, jamais la réponse) ; le contrôle refuse tout autre champ.
**LE NOM DE LA CASE SE CHOISIT, SA VALEUR SE TAPE.** Une saisie libre du nom
recalerait sur la casse — « A » nomme une AUTRE case en Python, et ce sont le
5.2 et le 5.4 qui évaluent cela, pas celui-ci —, donc c'est une liste. Elle
offre TOUTES les variables du programme, dans un ordre TIRÉ par question et
conservé : rangées dans l'ordre des lignes, la bonne tomberait au rang de
l'étape et l'élève apprendrait le rang (la leçon d'{intervalles-inegalite}). La
valeur, elle, n'est jamais presque bonne : on compare exactement, les espaces
retirées, et « − » comme « – » valent le tiret du clavier.
**ET UN DÉFAUT NE S'EST VU QUE SUR LA CAPTURE, comme toujours** : la rangée
d'une ligne QUITTÉE gardait la saisie fausse de l'élève en rouge, avec la
correction en vert à côté — la convention commune de `corrCase`. Dans un
tableau qui s'appelle « la mémoire de l'ordinateur », cela faisait DEUX nombres
pour une même case : `b` y contenait 77 et 2 à la fois, et la copie « c = b »
de la ligne suivante n'avait plus de source sûre. C'est la famille du défaut
que le projet nomme « l'écran dit autre chose que la note », par la porte du
tableau. **La rangée qu'on vient de juger garde la convention** — c'est le
moment où l'élève regarde son verdict — **et celles qu'on a QUITTÉES portent la
valeur VRAIE** : la case juste garde son bleu, la fausse reçoit la valeur et le
VERT de la correction, la convention des révélations de la Terminale. En
soutien la question ne se pose pas : on ne quitte pas une rangée fausse. Le
banc était VERT sur ce défaut — c'est un bord de plus, pas un contrôle
resserré —, et le jsdom comme le navigateur le tiennent désormais des deux
côtés.
**UNE RANGÉE À MOITIÉ REMPLIE EST REDEMANDÉE, jamais peinte** : rouge veut dire
FAUX, jamais « pas fini » (la règle de {placer-image}). Les deux cases d'une
rangée disent UNE seule chose — « cette ligne met telle valeur dans telle
case » —, et une moitié n'en dit rien. **La règle `.sol` est née avec la
famille** — la leçon de `.itv-sel.sol`, de `.lv-in.sol` et de `.s1-in.sol`,
tenue avant le signalement cette fois — et elle est VIVANTE : c'est l'encre
d'une rangée quittée que l'élève avait fausse. Chaque case se juge SEULE, la note
affichée compte les 2 × lignes réponses de la question (`ptsEcran` voit les
listes et les champs des rangées déjà posées, qui restent à l'écran plutôt que
d'être remplacées par du texte), et le poids exact de la question se lit par la
convention `papCases` — la coupe d'un devoir tombe donc sur la voie EXACTE.
**Aucune correction au fil des clics, et c'est déclaré**
(`soutienEnDirect.sans`) : la case du nom est une liste de trois ou quatre
propositions, et la colorer au choix la ferait essayer jusqu'au bleu. **Le
bouton des tables n'y est pas** : on ne multiplie rien, on lit une valeur et on
la recopie.
**Deux bancs, la répartition habituelle.** jsdom tient la fiche épinglée (si
elle ne passe pas au juge, c'est le juge qui a tort), le tirage et ses trois
visages sur 400 séances, le juge cas par cas, la vérification par ligne et sa
porte, la rangée à moitié remplie, le soutien, la reprise après une pause et
les branchements — et il REFAIT l'état de la mémoire par une SECONDE
arithmétique qui n'a rien en commun avec l'interpréteur (un dictionnaire tenu à
la main, sans lexer ni évaluateur), puis compare l'interpréteur à un vrai
CPython en faisant suivre chaque tranche d'un `print` de la case remplie — sans
ce print, deux sorties VIDES se compareraient et le contrôle ne mesurerait
rien. Le NAVIGATEUR (« 6 tricies quaterdecies », déclaré par `pythonPasAPas` dans
`tests/profils.js`) mesure ce que jsdom ne voit pas : les DEUX colonnes rendues
côte à côte — la disposition de la fiche —, le repère ▶ sur la ligne qu'on
exécute et le ✓ sur celles qui sont passées, le tableau qui GRANDIT d'une
rangée à chaque étape pendant que la rangée d'avant reste posée et peinte, les
deux cases à la chasse et à la taille du code qu'elles lisent, un VRAI choix
dans la liste suivi d'une VRAIE frappe, l'encre RENDUE des deux verdicts sur la
MÊME rangée — l'une bleue, l'autre rouge, ce que seule une couleur rendue
montre —, la bonne case en VERT SOUS la case fausse (dans une cellule de
tableau, un badge en ligne sortirait de sa cellule — la leçon de
{python-tableau-valeurs}), et le téléphone, où les deux colonnes S'EMPILENT.
**UN GARDE-FOU MORT y a été écrit, puis retiré** : `papNet` normalisait le
signe moins typographique, celui du pavé des tablettes — or les valeurs tirées
sont des entiers POSITIFS, et la touche « − » du pavé insère le TIRET du
clavier. Rien dans l'application ne pouvait donc en poser un ici. C'est le
CONTRÔLE qui exige désormais la propriété (toute valeur écrite est un entier
positif de deux chiffres au plus), et le sabotage qui glisse un négatif dans le
tirage rougit en le nommant : le jour où un négatif entrerait vraiment, refuser
le signe du pavé compterait fausse une réponse juste, et ce bord le dit AVANT.
**Et le bord « il FERME le thème 5 » de {python-double-triple-carre} a été
RETOURNÉ, pas retiré** — le SIXIÈME à l'être, après le 5.8, le 5.9, le 5.10, le
5.11 et le 5.12 : il vit entre {python-operations} et celui-ci. Un bord retiré
ne dit plus rien ; un bord retourné dit la règle du jour.
**ET LA FUSION A PRÉSENTÉ LES TROIS COLLISIONS DU PROJET, ENSEMBLE** :
{python-double-triple-carre} est arrivé sur `main` pendant que la branche
attendait le « mets en ligne », et il a pris le **5.13**, l'`APP_VERSION`
**183** et le numéro de section du banc navigateur « **6 tricies terdecies** »
— les trois que cette branche écrivait aussi. La règle tranche sans rien
peser, et elle a tranché trois fois : le premier arrivé garde, le second prend
le suivant — 5.14, v184, « 6 tricies quaterdecies ». Celle d'`APP_VERSION` est
la plus silencieuse des trois, deux écritures du MÊME nombre ne faisant aucun
conflit textuel ; c'est `npm run test:version` qui la nomme, en comparant à
`main` au moment où il tourne, et celle des sections est nommée par le
contrôle de la section « 0 », qui lit la source du banc. La zone n'a PAS été
recousue hunk par hunk : on repart du fichier de `main` et on y REPOSE ses
blocs COMPLETS, à des ancres vérifiées une par une — quatorze dans
`secondes.html`, chacune trouvée UNE fois, et c'est ce qui a montré que la
ligne `const RAPPELS` est COMMUNE aux deux blocs et qu'un « garder les deux »
l'aurait déclarée DEUX fois.
**PUIS UNE QUATRIÈME FUSION A DÉCOUPÉ LA CHRONIQUE ELLE-MÊME, et la doctrine
y a survécu sans une ligne de plus** : `main` a sorti onze mille lignes de
`CLAUDE.md` vers `docs/journal/`, c'est-à-dire exactement la zone où ce
paragraphe vivait. `git` ne pouvait rien en dire — un côté ajoute un
paragraphe, l'autre déplace le fichier entier : le conflit porte sur onze
mille lignes, et le résoudre hunk par hunk aurait remis la chronique dans
`CLAUDE.md`. On repart donc du fichier de `main` — `CLAUDE.md` réduit à la
RÈGLE — et on REPOSE les deux blocs dans `docs/journal/06-seconde-python.md`,
à deux ancres vérifiées une par une : le bord du 5.13 retourné, et ce
paragraphe. C'est la même doctrine qu'un fichier de page, appliquée à un
fichier de doctrine. **Et un renvoi y est devenu faux sans que rien ne le
dise** : « ce que ce fichier nomme « l'écran dit autre chose que la note » »
désignait le monolithe, où la phrase citée vivait quelques milliers de lignes
plus haut ; elle vit maintenant dans `09-devoirs-et-notes.md`, et le renvoi
dit « le projet » — un renvoi qui désigne le mauvais fichier est pire qu'un
renvoi absent, et aucun banc ne le voit.
**ET UNE CINQUIÈME FUSION A REPRIS LA COLLISION D'`APP_VERSION`, ENCORE** :
pendant que cette branche attendait toujours son « mets en ligne », une
troisième branche (la bulle « Comprendre mon erreur » étendue aux cases à
cocher) a fusionné — et elle portait elle-même la trace d'une collision sur ce
même numéro, réglée avant elle. `main` est ainsi passé de 184 à **185** sans
que cette branche-ci n'en sache rien : deux écritures du même nombre ne font
toujours aucun conflit textuel, et seul `npm run test:version`, comparé à
`main` au moment où il tourne, aurait pu le dire. Le vrai conflit, lui, est
resté sur la seule ligne qui écrit le nombre en dur — `const APP_VERSION` —
et **cette branche prend 186**, la règle ne changeant pas d'un mot pour
autant se répéter : le premier arrivé garde, le second prend le suivant. Rien
d'autre du fichier n'entrait en collision.

**Puis la MÊME marche, une question en moins : la valeur seule.**
{python-valeur-case} (Seconde, 5.15, demande de Turquet, septembre 2026 :
« il doit exécuter le programme pas à pas, dans le tableau à côté le nom de la
case mémoire apparaît et l'élève doit donner la valeur de cette case mémoire.
Quand c'est fait, on passe à la ligne suivante. ainsi de suite. à la fin il
faut vérifier que les cases mémoire ont les bonnes valeurs. ») ferme le
thème 5 — ajouté en dernier, il ne renumérote rien.
**CE QU'IL AJOUTE N'EST PAS UN DOUBLON, C'EST UNE MARCHE.** Le 5.14 demande
DEUX choses à chaque ligne — quelle case, et quelle valeur —, et un élève qui
se trompe de case ne sait plus si c'est la copie qu'il n'a pas comprise ou la
lecture du signe égal : deux leçons dans une même faute la rendent illisible,
la leçon de {multiplier-fractions}. Ici la case est DONNÉE, écrite par la page
dans la rangée que la ligne ajoute ; il ne reste que la valeur, c'est-à-dire
la seule chose que « pas à pas » enseigne — une case garde ce qu'on y a rangé,
et un NOM à droite du signe égal veut dire « ce que cette case contient ». On
le fait AVANT le 5.14, ou à sa place quand les deux questions à la fois sont
trop.
**LA FIN VÉRIFIE LA MÉMOIRE ENTIÈRE, parce que c'est la demande** : une fois
la dernière ligne jugée, la page écrit ce que chaque case contient à
l'arrivée, lu dans l'état FINAL de l'interpréteur et jamais dans ce que
l'élève a tapé. **Aucune phrase à compléter** — la fiche papier en pose, le
5.14 a déjà tranché cela (elles disent en mots ce que les cases disent en
chiffres), et la redemander ici ferait écrire trois fois la même réponse.
**LE MOTEUR EST CELUI DU 5.14, L'IDENTITÉ NE L'EST PAS** — la règle du projet,
« deux exercices peuvent partager un moteur, mais pas leur identité ». Sont
PARTAGÉS le tirage des programmes et ses trois visages (`PAP_FICHE`,
`PAP_JEUX`, `papGen`, `papValeurs`), la lecture de la mémoire (`papProg`,
`papEtat`, `papAns` — donc `pyRun`, l'interpréteur MÊME du 5.1), la
comparaison des valeurs (`papNet`), la question « cette ligne recopie-t-elle
une case ? » (`papCopie`) et le cadre du programme avec son repère ▶
(`papProgHTML`) ; la feuille de styles aussi (`pap-cols`, `pap-mem`,
`pap-val` et ses trois encres) — une cinquième aurait fini par diverger, et
deux exercices voisins se seraient dessinés différemment sous les yeux de
l'élève. Sont PROPRES son identifiant, son kind (`pvm`), son écran, son
rappel de cours, ses questions à l'IA, son contexte, son tirage, son tableau,
son juge, sa reprise et son poids (`pvmCases`) : tout ce par quoi une note,
une pause ou un signalement DÉSIGNE un exercice. **Le rappel, en particulier,
n'est PAS celui du 5.14** — celui-là enseigne à trouver la case à gauche du
signe égal, ce qu'on ne demande plus ici : un rappel partagé aurait fait lire
à l'élève la consigne d'un exercice qu'il n'a pas sous les yeux, et un
contrôle l'interdit.
**UNE SEULE CASE PAR LIGNE, et c'est ce qui change tout le reste.** La rangée
à moitié remplie du 5.14 n'existe pas : une case vide est simplement
redemandée, jamais peinte — rouge veut dire FAUX, jamais « pas fini » (la
règle de {placer-image}), et trois espaces valent une case vide. La porte de
la ligne suivante reste tenue par l'ÉTAT du bouton : « Passer à la ligne
suivante » n'existe qu'une fois la ligne jugée, et en SOUTIEN qu'une fois la
ligne JUSTE, sans que rien ne soit révélé. La rangée QUITTÉE porte la mémoire
VRAIE — bleue si l'élève l'avait juste, verte (`sol`) s'il l'avait fausse —,
la leçon que la capture du 5.14 avait coûtée : dans un tableau qui s'appelle
« la mémoire de l'ordinateur », deux nombres pour une même case privent la
copie de la ligne suivante de toute source sûre.
**Deux bancs, la répartition habituelle.** jsdom tient le tirage et ses trois
visages sur 300 séances (et le fait que la question ne porte QUE le visage et
les lignes — pas d'ordre de propositions, puisqu'il n'y a plus de liste), le
barème d'UNE réponse par ligne, la vérification par ligne et sa porte, le
bilan de la fin, la case vide, le soutien, la rangée quittée, la reprise après
une pause et les branchements. Le NAVIGATEUR (« 6 tricies quindecies »,
déclaré par `pythonValeurCase` dans `tests/profils.js`) mesure ce que jsdom ne
voit pas : les deux colonnes rendues côte à côte, **le nom de la case ÉCRIT et
AUCUNE liste dans l'écran — c'est la différence même entre les deux exercices,
et seule une page rendue montre qu'il n'en traîne pas une**, la case unique à
la chasse et à la taille du code qu'elle lit, une VRAIE frappe au clavier,
l'encre RENDUE du verdict, le tableau qui grandit d'une rangée à chaque étape,
le bilan écrit à la fin du programme, et le téléphone où les deux colonnes
s'empilent.
**Et le bord « il FERME le thème 5 » du 5.14 a été RETOURNÉ, pas retiré** — le
septième à l'être, après le 5.8, le 5.9, le 5.10, le 5.11, le 5.12 et le
5.13 : le 5.14 vit désormais entre {python-double-triple-carre} et celui-ci.
Un bord retiré ne dit plus rien ; un bord retourné dit la règle du jour.
**Ce qu'un sabotage éprouve**, et les deux qui ont servi : retirer le bilan de
la fin (le banc rougit en disant « aucun bilan de la memoire a la fin du
programme ») et peindre en rouge une case laissée vide (il rougit dans les
DEUX modes, « 1 case(s) peinte(s) sur une rangee vide »). Restent à portée du
même geste : rendre le nom de la case choisissable — le navigateur compte les
`select` de l'écran —, partager le rappel du 5.14, et laisser la rangée
quittée garder la saisie fausse de l'élève.

**Puis la marche suivante : quand une ligne CALCULE.**
{python-pas-a-pas-calcul} (Seconde, 5.16, inspiré du PDF fourni par Turquet,
septembre 2026 : le programme « a = 10 ; b = 2 ; c = a+b », exécuté ligne par
ligne avec le tableau des cases mémoire à droite) est la troisième marche du
pas à pas. Le 5.14 apprend à repérer LA CASE, le 5.15 à retenir LA VALEUR
d'une recopie — jamais de calcul dans l'un ni l'autre, par décision assumée
(la leçon de {multiplier-fractions} : deux leçons dans une même faute la
rendent illisible). Ici l'élève lit une ligne qui CALCULE, et non plus
seulement une qui recopie : le carnet passe de « une case garde ce qu'on y a
rangé » à « une case peut CONTENIR le résultat d'un calcul sur d'autres
cases ».
**CE QU'IL AJOUTE N'EST PAS UN TROISIÈME DOUBLON, C'EST LA MARCHE QUE LES
DEUX AUTRES PRÉPARENT.** Le 5.15 a déjà réduit la question à UNE seule
réponse par ligne (la case est DONNÉE). Le 5.16 REPREND cette disposition
telle quelle et change seulement ce qu'une ligne PEUT être : un littéral
(`a = 10`), une recopie (comme au 5.15), ou désormais un CALCUL (`c = a+b`,
`z = x-y`) qui lit ce que d'AUTRES cases contiennent. Un élève qui sait déjà
lire une recopie n'a qu'UNE chose de plus à apprendre : que la mémoire, pas
l'énoncé, nourrit le calcul.
**LE MOTEUR EST CELUI DU 5.14 ET DU 5.15, L'IDENTITÉ NE L'EST PAS** — la
règle du projet, répétée une troisième fois dans ce thème. Sont PARTAGÉS la
lecture de la mémoire (`papProg`, `papEtat`, `papAns` — donc `pyRun`,
l'interpréteur MÊME du 5.1, qui sait déjà calculer : {python-operations} s'en
sert pour ça, et rien n'est réécrit ici), la comparaison des valeurs
(`papNet`), le cadre du programme avec son repère ▶ (`papProgHTML`) et le jeu
de lettres des questions tirées (`PAP_JEUX`) ; la feuille de styles aussi
(`pap-cols`, `pap-mem`, `pap-val` et ses trois encres). Sont PROPRES son
identifiant, son kind (`ppc`), son écran, son rappel de cours, ses questions
à l'IA, son contexte, sa FICHE (`PPC_FICHE` : a = 10, b = 2, c = a+b — PAS
celle du 5.14/5.15, qui recopie plutôt que calculer), son tirage (`ppcGen`,
`ppcBuildQuestions`), son juge (`checkPPC`), sa reprise (`ppcReposer`) et son
poids (`ppcCases`).
**`papCopie` NE POUVAIT PAS SERVIR TEL QUEL, et c'est le piège du moteur
partagé pris à revers.** Elle ne distingue qu'un littéral (« commence par un
chiffre ») d'autre chose, et pour le 5.14/5.15 « autre chose » ne pouvait être
qu'une recopie — une seule alternative, jamais fausse. Une ligne de calcul
(`a+b`) ne commence pas non plus par un chiffre : `papCopie` l'aurait donc
prise pour une recopie, avec le message qui va avec (« va LIRE ce qu'elle
contient ») — un message qui MENT sur une ligne qui doit CALCULER.
`ppcNature(expr)` distingue les TROIS natures — littéral, recopie, calcul —
et `ppcExplique(q, k)` porte le bon message pour chacune. C'est le bord que
partager un moteur sans relire ce qu'il suppose aurait fait manquer : le
5.14/5.15 n'avait jamais eu qu'une alternative à trancher, le 5.16 en a trois.
**TROIS VISAGES, épinglés dans l'ordre où la marche se lit** : la FICHE
elle-même (a = 10, b = 2, c = a+b — une addition de deux littéraux) ;
« soustraction » (deux littéraux, puis leur différence — le PLUS GRAND tiré
en premier, pour ne JAMAIS produire de résultat négatif : le clavier tactile
de ce niveau n'entre que le tiret du clavier sur la touche « − », et la
Seconde n'affiche jamais de signe moins dans cette famille, la même réserve
que le 5.14/5.15 avait posée sur ses valeurs) ; « copie-addition » (deux
littéraux, une RECOPIE du second, puis une ADDITION qui LIT la case recopiée
— et non le littéral d'origine : la valeur additionnée doit être retrouvée
dans la mémoire, pas relue sur la ligne d'avant). C'est cette dernière rangée
qui tient, dans une SEULE question, le bord « certaines lignes recopient,
d'autres calculent ». Aucune multiplication ni division : les valeurs tirent
entre 2 et 99, et un produit de deux tels nombres sortirait du calcul de tête
que la Seconde manipule — ce serait la leçon du 5.9, pas celle-ci.
**LA MÊME DISPOSITION QUE LE 5.15, ET LES MÊMES BORDS TENUS** : la case est
DONNÉE, l'élève ne tape que la VALEUR ; la vérification est PAR LIGNE, la
porte de la suivante tenue par l'ÉTAT du bouton ; une case vide est
redemandée, jamais peinte ; la rangée qu'on vient de juger garde la
convention commune (`corrCase`), celle qu'on QUITTE porte la mémoire VRAIE —
bleue si l'élève l'avait juste, verte (`sol`) s'il l'avait fausse ou vide —
même pour une case de CALCUL, où la valeur vraie sort de `pyRun` et jamais
d'une réévaluation de ce que l'élève a tapé ; la fin vérifie la mémoire
ENTIÈRE, avec le total VRAI même quand une ligne a été manquée. Aucune
correction au fil des clics (`soutienEnDirect.sans`), aucun bouton des tables
(`TABLES_SANS`, `tests/profils.js`) : les calculs restent des additions et
soustractions à un chiffre, rien à consulter.
**Il FERME le thème 5, en 5.16 — ajouté en dernier, il ne renumérote rien —
et le bord « il ferme le thème 5, en 5.15 » de {python-valeur-case} a été
RETOURNÉ, pas retiré** : le huitième à l'être, après le 5.8, le 5.9, le 5.10,
le 5.11, le 5.12, le 5.13 et le 5.14. Le 5.15 vit désormais entre
{python-pas-a-pas} et celui-ci. Le contrôle jsdom qui portait ce bord (dans
la section 8 de {python-valeur-case}, « la place au menu et les branchements
») a été retouché EN PLACE plutôt que dupliqué : il vérifie maintenant que le
thème se ferme sur `python-pas-a-pas-calcul`, que {python-valeur-case} reste
juste AVANT le fermeur, et que {python-pas-a-pas} reste juste avant lui — un
bord retiré ne dit plus rien, un bord retourné dit la règle du jour.
**Deux bancs, une répartition VOLONTAIREMENT ASYMÉTRIQUE, et le dire vaut
mieux que de le taire.** Contrairement au 5.14 et au 5.15, {python-pas-a-
pas-calcul} n'a PAS de fonction jsdom dédiée qui rejoue le tirage par une
SECONDE arithmétique indépendante — pour les lignes littérales et les
recopies cette seconde méthode est triviale (recopier la même valeur), mais
pour la ligne de CALCUL elle demanderait de réimplémenter l'addition et la
soustraction hors de `pyRun`, un chantier à part, remis à plus tard (demande
de Turquet : « c'est un autre sujet »). `tests/profils.js` le DÉCLARE dans
« lacunes » plutôt que de le taire, et sa déclaration `pythonPasAPasCalcul`
est volontairement RÉDUITE : ni `nb` ni `bareme`, qui ne serviraient qu'à
cette fonction absente — un champ que personne ne lit est une liste morte
qu'on croit vivante.
Le banc NAVIGATEUR (« 6 tricies sedecies »), lui, couvre l'exercice en
EXÉCUTION RÉELLE, sur la fiche ÉPINGLÉE à valeurs CONNUES (10, 2, 12) — nul
besoin d'arithmétique indépendante quand la fiche est fixe. Il ouvre
l'exercice, vérifie que le nom de la case est ÉCRIT (aucune liste, comme au
5.15) et qu'aucun bilan ne paraît avant la fin, tape au clavier les deux
lignes littérales et vérifie la note, puis tape une réponse FAUSSE sur la
ligne de calcul (« 102 », l'erreur d'un élève qui concatène 10 et 2 au lieu
d'additionner) et vérifie que la case rougit, que la correction s'écrit en
VERT avec la vraie valeur (12), que le MESSAGE nomme un CALCUL — et non une
recopie, la distinction que `ppcNature`/`ppcExplique` existent pour tenir —,
et que le BILAN de fin porte la valeur VRAIE de chaque case même quand
l'élève s'est trompé sur l'une d'elles. Les contrôles UNIVERSELS des deux
bancs (section 9 du banc principal, section 9 bis des couleurs de
vérification) couvrent le reste — taille des cases, case vide jamais rouge,
`.ok` jamais `.good`, bouton d'aide IA, pas d'accolades affichées, pas de
repli de rangée, clavier atteignable, couleurs juste-bleu/correction-verte —
sans qu'il ait fallu les déclarer : c'est précisément ce pour quoi elles
existent.

**Puis la marche encore suivante : quand un CALCUL en lit un AUTRE.**
{python-pas-a-pas-chaine} (Seconde, 5.17, demande de Turquet, septembre
2026 : « en essayant d'utiliser le moins de tokens possible sans toucher à la
qualité du résultat, fait un exercice de seconde en t'appuyant sur le modèle
du 5.15 comme le pdf joint ») porte le 4e PDF de la série : « a = 10 ; b = 2 ;
c = a+b ; d = c+a ». Le 5.16 apprend qu'une ligne peut CALCULER au lieu de
recopier ; ici, la ligne 4 calcule AVEC une case (c) qui est elle-même le
résultat d'un calcul, et non un littéral ni une simple recopie. Le carnet
passe de « une case peut contenir le résultat d'un calcul » à « une case
CALCULÉE peut à son tour nourrir un calcul » — la mémoire se relit, jamais
l'expression qui l'a produite.

**LE MOTEUR EST CELUI DU 5.14/5.15/5.16, L'IDENTITÉ NE L'EST PAS** — la règle
du projet, répétée une quatrième fois dans ce thème. Sont PARTAGÉS papProg,
papEtat, papAns (donc pyRun), papNet, papProgHTML, PAP_JEUX, la feuille de
styles du moteur (pap-cols, pap-mem, pap-val) — et surtout **ppcNature et
ppcExplique, réutilisées SANS Y TOUCHER**. Le brief demandait de le vérifier
plutôt que de le supposer : `ppcNature('c+a')` ne commence pas par un chiffre
et porte un `+`, elle rend donc déjà `'calcul'`, que la case citée (c) soit
elle-même un littéral ou le fruit d'un calcul — la fonction ne regarde que
la FORME de l'expression, jamais la provenance de la valeur qu'elle lira. Le
message de `ppcExplique` (« prends ce que CONTIENT chaque case citée ») dit
déjà la bonne chose sans un mot de plus. Zéro ligne du moteur n'a donc bougé.
Sont PROPRES son identifiant, son kind (`ppd`), son écran, son rappel
(RAP_PPD), ses questions à l'IA, son contexte, sa FICHE (PPD_FICHE, les
quatre lignes du PDF au caractère près), son tirage (`ppdGen`,
`ppdBuildQuestions`), son juge (`checkPPD`), sa reprise (`ppdReposer`) et son
poids (`ppdCases`).

**TROIS VISAGES** : la FICHE (a=10, b=2, c=a+b, d=c+a) ; « chaine-addition »
(deux littéraux tirés, c = a+b, puis d = c+a — la même forme que la fiche,
des lettres et des valeurs différentes) ; « chaine-soustraction » (le plus
grand littéral tiré en premier, c = a−b, puis d = c+a — jamais de résultat
négatif, la réserve déjà posée par le 5.14/5.15/5.16 sur la touche « − » du
pavé tactile). Les deux tirées sont en ordre mélangé. **MÊME DISPOSITION,
MÊMES BORDS QUE LE 5.15/5.16** : la case est DONNÉE, l'élève ne tape que la
VALEUR ; vérification PAR LIGNE, porte tenue par l'ÉTAT du bouton ; case vide
redemandée, jamais peinte ; la rangée qu'on VIENT de juger garde `corrCase`,
celle qu'on QUITTE porte la mémoire VRAIE (`ok` bleu si juste, `sol` vert
sinon) ; la fin vérifie la mémoire ENTIÈRE. Aucune correction au fil des
clics, aucun bouton des tables (`TABLES_SANS` **et** `tests/profils.js` —
deux sources, et la seconde a d'abord été oubliée : voir plus bas).

**DEUX BANCS, et CETTE FOIS une fonction jsdom dédiée.** Contrairement au
5.16, {python-pas-a-pas-chaine} a sa fonction propre dans `verifier.js`
(`pythonPasAPasChaine`) : elle ne reconstruit PAS l'arithmétique par une
seconde méthode indépendante — le chantier resté ouvert par le 5.16 — mais
tient les INVARIANTS du tirage sur 300 séances (aucune valeur négative,
chaque littéral distinct, les lignes 3 et 4 classées `calcul` par `ppcNature`,
et la ligne 4 qui cite bien le NOM posé par la ligne 3 — la chaîne même que
l'exercice enseigne), plus la copie juste ligne par ligne, la porte, le
bilan, la case vide, le soutien, la rangée quittée, la reprise et les
branchements. Ce qui distingue cette fonction de celles du 5.14/5.15 : elle
ne rejoue pas la valeur des visages TIRÉS par un second calcul indépendant —
seule la fiche, à valeurs connues, est comparée à `tests/profils.js` au
caractère près. Le banc NAVIGATEUR (« 6 tricies septdecies ») couvre le
reste en exécution RÉELLE sur la fiche épinglée (10, 2, 12, 22) : les deux
colonnes rendues, le repère ▶ qui avance et le tableau qui GRANDIT à chaque
étape, puis une réponse FAUSSE sur la ligne 4 — celle qui lit la case
CALCULÉE — dont le message doit nommer un CALCUL, jamais une recopie, et dont
le bilan final doit garder les quatre valeurs VRAIES malgré l'erreur.

**LE BOUTON DES TABLES A DEUX SOURCES, et une a été oubliée au premier
passage.** La page décide d'après `TABLES_SANS` (son propre tableau) ; le
banc navigateur juge d'après `tests/profils.js` (`tablesAide.sans`), une
liste ÉCRITE À LA MAIN, indépendante de la page — lire la liste de la page et
la comparer à elle-même n'aurait rien prouvé. Le premier passage n'a ajouté
l'exercice qu'à `TABLES_SANS` : le banc a rougi en le nommant exactement
(« sans bouton alors qu'il devrait l'avoir : python-pas-a-pas-chaine »), la
preuve que les deux sources sont réellement indépendantes plutôt qu'une
façade. L'ajouter à `tablesAide.sans` a suffi.

**Et le bord « il FERME le thème 5, en 5.16 » de {python-pas-a-pas-calcul} a
été RETOURNÉ, pas retiré** — le NEUVIÈME à l'être, après le 5.8, le 5.9, le
5.10, le 5.11, le 5.12, le 5.13, le 5.14 et le 5.15 : {python-pas-a-pas-calcul}
vit désormais entre {python-valeur-case} et celui-ci. Le contrôle jsdom qui
portait ce bord (dans la section 8 de {python-valeur-case}, retouchée déjà une
fois pour le 5.16) a été retouché EN PLACE une seconde fois : {python-valeur-
case} n'est plus « juste avant le fermeur » — {python-pas-a-pas-calcul} s'est
glissé entre les deux — mais sa place reste STABLE, entre {python-pas-a-pas}
et {python-pas-a-pas-calcul}, et c'est ce que le contrôle vérifie désormais
par l'INDEX plutôt que par la fin du thème. Le nouveau fermeur porte son
PROPRE contrôle de position (section 8 de sa fonction dédiée), qui vérifie
qu'il ferme bien le thème 5, juste après {python-pas-a-pas-calcul}.

**Ce qu'un sabotage éprouve** : une case QUITTÉE qui garderait la saisie
fausse de l'élève au lieu de la mémoire vraie (le bloc 6 rougit en le
nommant) ; un test qui appellerait `document.getElementById("ppd-val-2")`
sans avoir d'abord rempli les lignes 0 et 1 se serait heurté lui-même à une
case absente — la même leçon que « une rangée à moitié remplie n'existe pas
tant que les précédentes ne sont pas jugées » vue à l'envers, côté banc
cette fois.

**Puis la marche suivante : quand une ligne MULTIPLIE — et le PDF lui-même a dû
être corrigé.** {python-pas-a-pas-multiplication} (Seconde, 5.19, inspiré du
PDF « variable_pas_a_pas_7 » fourni par Turquet, septembre 2026 : le programme
« k = 10 ; l = 2 ; m = 2l ; l = m-k », exécuté pas à pas « comme la version
n° 1 », avec la consigne de recommencer avec d'autres valeurs de k et l si la
réponse ne correspond pas) est la quatrième marche du calcul, après la
recopie (5.15), l'addition/soustraction (5.16) et la chaîne de calculs
(5.17, {python-pas-a-pas-chaine}) : {python-pas-a-pas-calcul} avait déjà
réservé ce terrain — « éventuellement * du brief reste ouvert pour un jeu
futur aux valeurs bornées plus bas » — et c'est ce jeu-là. Elle arrive sur
`main` par DEUX fusions séparées, coup sur coup : {python-pas-a-pas-chaine}
(5.17) a pris le numéro 5.17, le numéro de section « 6 tricies septdecies »
et `APP_VERSION` 189 pendant que cette branche attendait son « mets en
ligne » — la même famille de collisions que CLAUDE.md documente pour les
sections du banc, réglée de la même façon : le premier arrivé garde, le
second prend le suivant (d'abord 5.18, « 6 tricies duodevicies », v190).
**PUIS UNE SECONDE COLLISION, sur ce même numéro 5.18** : une TROISIÈME
session, {python-echange-variables}, avait réclamé 5.18 en parallèle et
fusionné la première dans `main` — la règle a tranché une seconde fois de la
même façon, et cet exercice a dû reprendre un cran : 5.19, « 6 tricies
undevicies » (le numéral « duodevicies » étant pris), `APP_VERSION` v191.

**LE PDF, PRIS AU PIED DE LA LETTRE, ENFREINT DEUX RÈGLES DÉJÀ ÉTABLIES DANS
CE THÈME, et il a fallu choisir entre suivre le papier et suivre la
doctrine.** « l » y est réaffectée (l = 2 PUIS l = m-k), alors qu'une
variable ne s'affecte qu'une fois par programme depuis le 5.1 — une règle que
{python-pas-a-pas} (5.14) avait déjà retournée vers le pas à pas lui-même. Et
m-k = 4-10 = -6 est négatif, alors que cette famille n'affiche jamais de signe
moins : le clavier tactile de ce niveau n'entre que le tiret du clavier sur la
touche « − », la même réserve posée par le 5.14 sur ses valeurs et par le 5.16
sur sa soustraction. La FICHE épinglée garde donc le programme du papier au
plus près — même k = 10, même l = 2, même doublement — mais range la
différence dans une QUATRIÈME case (n) plutôt que de réaffecter l, et calcule
k-m (10-4 = 6) plutôt que m-k, pour rester positive : k = 10, l = 2, m = l*2,
n = k-m. Le PDF disait déjà, en substance, ce que la fiche fait : « recommencer
avec d'autres valeurs de k et l » est exactement ce qu'une case vide ou fausse
provoque déjà dans cette famille — rien à ajouter de ce côté-là.

**LA MULTIPLICATION S'ÉCRIT « l*2 », JAMAIS « 2*l » — un piège de moteur
partagé, pas de mathématiques.** `ppcNature(expr)`, la fonction du 5.16 qui
distingue littéral / recopie / calcul, ne regarde que le PREMIER caractère
pour repérer un littéral (`/^[0-9]/`) : une expression commençant par un
chiffre suivi d'une case, comme « 2*l », serait prise pour un littéral, et le
message qui l'accompagnerait mentirait (« range tel quel » pour une ligne qui
CALCULE). Écrire la case EN PREMIER lève l'ambiguïté sans toucher à
`ppcNature`, et c'est cohérent avec le carnet : une variable qu'on multiplie
s'écrit `variable * facteur`, comme le 5.13 écrit déjà `n * n * n`.

**LE MOTEUR EST CELUI DU 5.14, DU 5.15, DU 5.16 ET DU 5.17, L'IDENTITÉ NE
L'EST PAS** — la règle du projet, répétée encore dans ce thème. `ppcNature`
et `ppcExplique`, nées avec le 5.16, sont réutilisées TELLES QUELLES — déjà
réutilisées SANS Y TOUCHER par {python-pas-a-pas-chaine} (5.17), la même
décision prise indépendamment des deux côtés de la même fusion. Elles
étaient déjà entièrement génériques — aucune des deux ne nomme une opération
précise —, et ce TROISIÈME exercice qui les réutilise à son tour est
exactement ce que « partager un moteur » veut dire, comme `papProg` l'est
déjà par QUATRE exercices avant celui-ci ({python-pas-a-pas},
{python-valeur-case}, {python-pas-a-pas-calcul}, {python-pas-a-pas-chaine}).
Sont PROPRES son identifiant, son kind (`ppm`), son
écran, son rappel, ses questions à l'IA, son contexte, sa FICHE (adaptée
ci-dessus), son tirage (`ppmGen`, `ppmBuildQuestions`), son juge (`checkPPM`),
sa reprise (`ppmReposer`) et son poids (`ppmCases`).

**TROIS VISAGES, épinglés dans l'ordre où la marche se lit** : la FICHE
elle-même (k = 10, l = 2, m = l*2, n = k-m — un doublement puis une
soustraction) ; « triple » (deux littéraux, une ligne qui MULTIPLIE PAR 3 —
contraste assumé avec le doublement de la fiche, le vocabulaire même de
{python-double-triple-carre} —, puis une soustraction du plus grand littéral
tiré POUR NE JAMAIS produire de résultat négatif, la même réserve que le 5.16
sur sa soustraction) ; « copie-double » (une recopie, puis une ligne qui
MULTIPLIE PAR 2 la case RECOPIÉE, jamais le littéral d'origine — la valeur
doublée doit être retrouvée dans la mémoire, la leçon de la « copie-addition »
du 5.16 prise à l'endroit multiplicatif). Les deux derniers sont en ordre
mélangé ; sans cela, le calcul serait toujours la même opération au même rang.

**LA MÊME DISPOSITION QUE LE 5.15 ET LE 5.16, ET LES MÊMES BORDS TENUS** : la
case est DONNÉE, l'élève ne tape que la VALEUR ; la vérification est PAR
LIGNE, la porte de la suivante tenue par l'ÉTAT du bouton ; une case vide est
redemandée, jamais peinte ; la rangée qu'on vient de juger garde la
convention commune (`corrCase`), celle qu'on QUITTE porte la mémoire VRAIE —
bleue si l'élève l'avait juste, verte (`sol`) s'il l'avait fausse ou vide —
même pour une case de MULTIPLICATION, où la valeur vraie sort de `pyRun` et
jamais d'une réévaluation de ce que l'élève a tapé ; la fin vérifie la
mémoire ENTIÈRE, avec le total VRAI même quand une ligne a été manquée.
Aucune correction au fil des clics (`soutienEnDirect.sans`).

**LE BOUTON DES TABLES N'EST PAS DANS `TABLES_SANS` CETTE FOIS, contrairement
au 5.14, au 5.15, au 5.16 et au 5.17** : cet exercice MULTIPLIE pour de vrai
(le double, le triple d'une case), et le bouton peut SERVIR — c'est le bord
OPPOSÉ de « le bouton des tables n'est proposé que là où il sert » (voir
`docs/journal/11-aides-et-interface.md`).

**Il FERME le thème 5, en 5.19 — et le bord « il ferme le thème 5 » de
{python-echange-variables} (5.18) a été RETOURNÉ à son tour, pas retiré** :
le onzième retournement dans ce thème, après le 5.8, le 5.9, le 5.10, le
5.11, le 5.12, le 5.13, le 5.14, le 5.15, {python-pas-a-pas-chaine} (5.17)
et {python-echange-variables} (5.18) lui-même. {python-pas-a-pas-calcul}
(5.16), {python-pas-a-pas-chaine} (5.17) et {python-echange-variables} (5.18)
vivent désormais entre {python-valeur-case} et celui-ci — et
{python-valeur-case} lui-même n'est donc plus « juste avant le fermeur » : le
contrôle jsdom qui portait ce bord (section 8 de {python-valeur-case}) lit la
position RELATIVEMENT à l'exercice (`th.ids[i+1]==='python-pas-a-pas-calcul'`),
comme {python-pas-a-pas} le fait déjà pour {python-valeur-case}, plutôt que
relativement à la fin du tableau — qui bouge à chaque ajout, et n'a donc pas
eu à bouger ici non plus.

**Un piège de banc, propre à ce moteur : une rangée jugée FAUSSE en
ENTRAÎNEMENT se VERROUILLE, elle ne se corrige pas.** Le premier jet du banc
navigateur tapait une réponse fausse sur la ligne de multiplication, vérifiait
le message et la correction en vert — puis essayait de RETAPER la bonne
valeur dans la même case, en entraînement. `corrCase` désactive toujours la
case une fois jugée (`el.disabled=true`), juste ou fausse ; seule la branche
SOUTIEN de `checkPPM` (`if(!ok && isSoutien())`) laisse une case fausse
modifiable, avec un bouton « Revérifier ». Le banc s'est arrêté sur
« page.click: Timeout … element is not enabled » — un défaut de BANC, pas de
page : la page fait exactement ce que le 5.15 et le 5.16 font déjà en
entraînement. Corrigé en passant directement à la ligne suivante après la
réponse fausse, sans retenter la case verrouillée ; le bilan de fin reste
juste quoi qu'il arrive, puisqu'il sort de `pyRun` sur le PROGRAMME, jamais de
la saisie de l'élève.

**Deux bancs, une répartition VOLONTAIREMENT ASYMÉTRIQUE, comme au 5.16, et
pour la même raison — contrairement au 5.17, qui a repris ce chantier pour sa
propre marche.** {python-pas-a-pas-multiplication} n'a PAS de fonction jsdom
dédiée qui rejoue le tirage par une SECONDE arithmétique indépendante : pour
les lignes littérales et les recopies cette seconde méthode est triviale,
mais pour les lignes de MULTIPLICATION et de soustraction elle demanderait de
réimplémenter ces deux opérations hors de `pyRun`, le même chantier que le
5.16 avait remis à plus tard et que le 5.17 a refermé pour SON invariant à
lui (aucune valeur négative, littéraux distincts, la nature des lignes),
mais pas pour la multiplication. `tests/profils.js` le DÉCLARE dans
« lacunes » plutôt que de le taire, et sa déclaration
`pythonPasAPasMultiplication` est volontairement RÉDUITE, comme celle du
5.16 : ni « nb » ni « bareme », qui ne serviraient qu'à cette fonction
absente.
Le banc NAVIGATEUR (« 6 tricies undevicies » — « 6 tricies septdecies »
ayant été pris par {python-pas-a-pas-chaine}, puis « 6 tricies duodevicies »
par {python-echange-variables}, sur `main` pendant que cette branche était en
cours, la même collision réglée de la même façon deux fois de suite) couvre
l'exercice en
EXÉCUTION RÉELLE, sur la fiche ÉPINGLÉE à valeurs CONNUES (10, 2, 4, 6) : il
ouvre l'exercice, vérifie que le nom de la case est ÉCRIT (aucune liste) et
qu'aucun bilan ne paraît avant la fin, tape les deux lignes littérales et
vérifie la note, tape une réponse FAUSSE sur la ligne de multiplication
(« 22 », l'erreur d'un élève qui concatène 2 et 2 au lieu de les multiplier)
et vérifie que la case rougit, que la correction s'écrit en VERT avec la
vraie valeur (4), que le MESSAGE nomme un CALCUL, passe à la ligne suivante
sans retenter la case verrouillée, tape la dernière ligne (la soustraction),
et vérifie que le BILAN de fin porte la valeur VRAIE de chaque case — y
compris celle qui a été multipliée — même quand l'élève s'est trompé dessus.
Les contrôles UNIVERSELS des deux bancs (section 9 du banc principal, section
9 bis des couleurs de vérification) couvrent le reste — taille des cases,
case vide jamais rouge, `.ok` jamais `.good`, bouton d'aide IA, pas
d'accolades affichées, pas de repli de rangée, clavier atteignable, couleurs
juste-bleu/correction-verte — sans qu'il ait fallu les déclarer.

**PUIS TURQUET A OUVERT LE FICHIER : « je ne vois pas cet exercice », « celui
que je veux correspond au PDF du début ».** Tout ce qui précède décrit la
PREMIÈRE version de {python-pas-a-pas-multiplication}, mise en ligne puis
corrigée le jour même (septembre 2026) : elle avait gardé le PROGRAMME du
PDF « variable_pas_a_pas_7 » mais pas sa CONSIGNE. Le PDF, relu au mot près,
demande « Deviner la valeur de la variable l à la fin de l'exécution », PUIS
« exécuter le programme pas à pas comme dans la version pas à pas n°1 » pour
vérifier, et si la prédiction ne correspond pas, « recommencer avec des
valeurs de k et l différentes ». La première version sautait la prédiction
entièrement — elle demandait de rejouer chaque ligne comme au 5.14, jamais de
deviner d'abord — ce qui explique le malentendu : l'exercice EXISTAIT bien
sur le site, mais ne ressemblait pas à ce que le PDF décrit.
**LA MÊME LECTURE AVAIT AUSSI FAIT ÉVITER DEUX CHOSES QUI N'ÉTAIENT PAS DES
IMPÉRATIFS TECHNIQUES.** La fiche adaptée range la différence dans une
QUATRIÈME case plutôt que de réaffecter `l`, « pour respecter qu'une variable
ne s'affecte qu'une fois » — mais {python-echange-variables} (5.18) réaffecte
déjà des cases dans ce même thème : ce n'était plus une règle de la FAMILLE,
seulement de ses trois premiers membres. Et elle calculait `k-m` plutôt que
`m-k` « pour rester positive » — mais `papNet` ne normalise le signe moins
que parce qu'aucun exercice n'en avait jamais eu besoin, pas parce qu'il en
serait incapable : il suffit que le signe traverse le clavier intact. Deviner
la valeur de `l` n'a de sens QUE PARCE QUE `l` est réécrite et que le
résultat (m-k = 4-10 = -6 sur la fiche) peut être négatif — retirer ces deux
traits avait retiré la prédiction elle-même.
**LA CORRECTION AJOUTE DEUX PHASES (`test.ppmPhase`), PAS UNE MARCHE DE
PLUS.** Phase « deviner » : le programme entier s'affiche SANS repère ▶ ni ✓
(`papProgHTML(q,-1)`, rien n'est encore exécuté), une seule case demande la
valeur finale de `l`. Phase « verifier » : exactement la disposition du 5.14,
avec un bandeau permanent rappelant la prédiction et si elle était juste —
reconstruit à CHAQUE rendu depuis `test.ppmGuessVal`/`ppmGuessOk`
(`ppmGuessHTML`), jamais peint une fois par un effet de bord qui disparaîtrait
au premier changement de ligne. Une prédiction FAUSSE mène quand même au pas
à pas complet (la vérification a lieu dans tous les cas), puis à
`ppmRecommencer()` plutôt qu'à la question suivante : un NOUVEAU tirage de
k et l, le MÊME programme, et retour à la phase « deviner ». Cette fonction
retire d'abord les points gagnés aux LIGNES de la tentative jetée et l'entrée
qu'elle venait de pousser dans `test.answers` — sans quoi une prédiction
fausse suivie d'une bonne compterait deux fois les points des lignes pour une
seule question. Seule la tentative qui gagne (prédiction juste ET les quatre
lignes justes) est donc comptée, exactement une fois par question, comme
partout ailleurs dans l'application.
**UN SIGNE MOINS PEUT DÉSORMAIS S'ÉCRIRE ICI** : la case de prédiction et la
dernière ligne (celle qui réécrit `l`) n'imposent plus `inputmode="numeric"`,
qui masquerait la touche « - » sur certains claviers tactiles — la réserve
même qui avait fait éviter le signe moins dans la première version. Les
autres lignes, toujours positives, le gardent.
**Le banc navigateur a dû être réécrit entièrement** pour mesurer les deux
phases plutôt qu'une seule marche de calcul : une prédiction vide redemandée,
une prédiction fausse peinte en rouge avec la vraie valeur en vert, le pas à
pas complet, le bouton « Recommencer », le score qui revient à 0 une fois la
tentative jetée, un second tirage ALÉATOIRE dont le banc lit k et l sur la
page pour calculer sa propre prédiction juste (il ne peut pas la deviner à
l'avance), et la question suivante atteinte avec le score complet. `TESTS`,
le rappel de cours et les questions à l'IA ont été réécrits dans le même
mouvement — l'identifiant, lui, n'a pas bougé (« les identifiants ne se
renomment jamais »).

**Le nom d'une variable se juge, et l'incorrect se JUSTIFIE.**
{python-noms-variables} (Seconde, 5.4, demande de Turquet, septembre 2026 —
« un exercice qui rappelle ce que l'on peut mettre pour le nom d'une variable
en Python et faire un exercice comme le 4 ; il faudra compléter une
justification si c'est faux ») suit {python-afficher-variable} au menu, repris de la
fiche « Noms de variables en Python » : le RAPPEL porte ses quatre règles
dans son ordre et avec ses exemples (lettres, chiffres et `_` seulement ; pas
de chiffre en tête ; majuscules et minuscules distinguées ; pas d'accent), et
l'exercice pose des noms — `prix achat`, `prix_achat`, `2ndeG`, `SecondeG`,
`Seconde:G`, `dix-huit`… — dont l'élève dit pour chacun s'il est correct ou
incorrect, et, s'il est incorrect, POURQUOI, en choisissant la règle dans une
liste. Trois questions de six noms, de deux à quatre incorrects par question.
**LA JUSTIFICATION EST UNE PORTE, tenue par l'ÉTAT de la case** (le motif de
{placer-image}) : la liste des raisons est visible mais grisée et fermée tant
que le nom n'est pas déclaré incorrect, s'ouvre dès qu'il l'est, se referme
et se vide si l'élève revient sur « correct ». Le navigateur le mesure sous un
VRAI choix : Playwright refuse de choisir dans une liste fermée, et c'est le
bord qu'on tient. Après une reprise de pause les valeurs reviennent APRÈS le
rendu : `pvnPortes()` rouvre un instant plus tard les justifications des noms
déjà déclarés incorrects — sans quoi l'élève reprenait devant une liste morte.
**LA BONNE RÉPONSE N'EST JAMAIS RANGÉE À CÔTÉ DE LA QUESTION** : celle-ci ne
porte que les noms et l'ordre des raisons ; `pvnDefauts(nom)` — la fonction
qui corrige — relit le nom lui-même, et le contrôle refait la correction par
une SECONDE méthode (l'expression régulière d'un identifiant, et des tests de
caractères qui n'ont rien en commun avec ceux de la page) sur toute la banque.
**UN NOM INCORRECT N'A QU'UN SEUL DÉFAUT, et c'est la banque qui le
garantit** : « 2ème » — un chiffre en tête ET un accent — aurait deux bonnes
justifications dont une seule comptée, une lecture juste comptée fausse. Les
accents ont LEUR règle, la 4 de la fiche, et non la règle 1 : « é » est une
lettre, la raison « caractère interdit » nomme les symboles (espace, -, :, =).
**LES RAISONS NE DIFFÈRENT QUE PAR CE QUI FAIT L'ERREUR** (la leçon
d'{intervalles-inegalite}) : trois vraies règles, et trois PIÈGES qui ne
justifient jamais rien — « il contient une majuscule », « il contient un
chiffre », « il contient le caractère _ » —, les erreurs réelles de l'élève
qui confond « contient » et « commence par », et le message y RÉPOND en
nommant la règle. L'ordre des raisons est tiré par question et le même sur ses
rangées : à forme égale, le rang de la bonne varie. Chaque séance montre les
trois défauts ET les trois pièges parmi les noms corrects (un avec majuscule,
un avec chiffre, un avec `_`) — la composition même de la fiche.
**CHAQUE CASE SE JUGE SEULE** : le verdict d'un nom, et sa justification s'il
est incorrect — un nom correct n'en a pas à compter, sa liste reste sans
couleur. Un nom incorrect déclaré « correct » perd ses deux cases : sa
justification, restée fermée, reçoit la correction en vert, mais elle n'est
pas une case OUBLIÉE et le message ne la compte pas parmi les manquantes
(`induit`) — le premier jet du contrôle s'y est pris, en exigeant « 2 cases
manquantes » sur une page qui disait juste. La case vide ne rougit jamais.
Aucune correction au fil des clics, et c'est déclaré (`soutienEnDirect.sans`)
: à deux propositions, il suffirait d'essayer ; en soutien la case juste se
verrouille en bleu, la fausse rougit sans badge, et la porte se rouvre quand
l'élève corrige son verdict. Le rappel est en HTML pur — rien n'y empile — et
n'écrit aucun « chiffre.chiffre » (le contrôle des numéros en dur lirait un
numéro d'exercice). Deux bancs, la répartition habituelle : jsdom tient la
fiche épinglée, la place au menu, la banque, le tirage (400 séances), la
porte, la copie juste et la copie fausse cliquées, le soutien et les
branchements ; le NAVIGATEUR (« 6 vicies terdecies », déclaré par
`pythonNoms` dans `tests/profils.js`) mesure les rangées d'un seul tenant à
1400 px, le nom rendu à chasse fixe avec ses espaces, la liste fermée qui
refuse un vrai choix, l'encre RENDUE du verdict, et le soutien. Treize
sabotages au banc jsdom, chacun rougissant en nommant son défaut — le juge
qui ignore les accents, « 2ème » glissé dans la banque, la porte ouverte au
rendu, le soutien qui touche la justification fermée, la séance sans ses
trois défauts, le piège de la majuscule tu, la justification fermée comptée
manquante, la règle 3 perdue, le bouton des tables revenu, l'ordre des
raisons figé, le verdict vide rougi, la porte qui ne se rouvre plus après une
reprise, l'exercice sorti du thème 5.

**Python devient un OUTIL : le tableau de valeurs se remplit en EXÉCUTANT.**
{python-tableau-valeurs} (Seconde, 5.10, demande de Turquet, septembre 2026 :
« faire un exercice comme le pdf, puis qui demande de compléter un tableau de
valeurs, avec x en 1ère ligne et des nombres décimaux avec 1 chiffre après la
virgule et un chiffre devant la virgule ; le calcul du programme en 2e ligne,
ici 2x+3 ; dire à l'élève de compléter le tableau en modifiant x dans le
programme du dessus et en l'exécutant ») vit en fin de thème 5 — ajouté en
dernier, il n'a rien renuméroté ; {python-operations} l'a suivi le jour même, et
son bord « il FERME le thème 5 » a été RETOURNÉ plutôt que retiré, comme celui du
5.8 et celui du 5.9 avant lui. **Et la fusion de `main` l'a renuméroté** :
{python-placer-variables} est arrivé en 5.9 pendant la préparation de la
branche, `APP_VERSION` y était déjà à 178, et le numéro de section du banc
« 6 tricies octies » était pris — les trois collisions que ce fichier nomme,
réglées de la même façon : le premier arrivé garde, le second prend le suivant
(5.10, v179, « 6 tricies nonies »). Le bord « il FERME le thème 5 » du 5.9 a
été RETOURNÉ plutôt que retiré, comme celui du 5.8 avant lui. C'est l'exercice 11 du carnet (« a) Exécuter le nouveau
programme ci-dessous ») prolongé par le tableau de valeurs.
**CE QU'IL AJOUTE AUX HUIT AUTRES** : le 5.1 fait PRÉDIRE ce qu'un programme
affiche, le 5.6, le 5.7 et le 5.8 le font ÉCRIRE ; ici on s'en SERT. Le
programme est donné, entier et juste ; l'élève n'en change qu'UNE chose — la
valeur de x — et lit le résultat. C'est le premier exercice où Python est un
OUTIL et non le sujet.
**LA DEMANDE EST TENUE PAR L'ÉTAT DES CASES, PAS PAR UNE CONSIGNE QU'ON PEUT NE
PAS LIRE** (le motif de {placer-image}) : une colonne du tableau ne s'ouvre que
lorsque le programme a été EXÉCUTÉ avec SA valeur de x, et elle reste ouverte
ensuite. « Modifier x dans le programme et l'exécuter » n'est donc pas une
phrase à croire : c'est le seul chemin vers la case. L'état sous le tableau dit
ce qu'il reste à faire, en écriture PYTHON — jamais les résultats.
**LE RISQUE PROPRE EST SILENCIEUX, ET IL EST ÉNORME** : a×x+b se calcule en
VIRGULE FLOTTANTE, et Python affiche alors « -3.5999999999999996 » là où la
valeur exacte est −3,6. L'élève recopierait ce que la machine affiche — ce que
la consigne lui demande — et serait compté faux, le pire défaut du projet.
**Le garde est VIVANT, et mesuré plutôt que supposé** : sur les 12 960 triplets
(a, b, x) possibles, **4 156 — un sur trois — s'affichent ainsi**. Le tirage
n'admet que les valeurs dont la sortie de `pyRun` est l'écriture décimale
EXACTE, et le contrôle refait la propriété sur chaque tirage par sa propre
arithmétique — en DIXIÈMES entiers, là où la page passe par l'interpréteur. Les
deux sorties sales sont ÉPINGLÉES au contrôle avec celles de CPython : le
risque est prouvé chez Python lui-même, pas supposé.
**ET LE PREMIER REPLI, INVENTÉ À LA MAIN, PORTAIT EXACTEMENT CE DÉFAUT** — deux
sorties sales sur cinq (« -0.20000000000000018 » pour x = 1.2). La règle « un
repli RÉEL, relevé sur le générateur » existe précisément pour ça, et c'est la
sonde qui l'a nommé avant le premier banc ; celui qui est figé repasse par les
gardes mêmes, et le contrôle l'exige.
**LA SORTIE AFFICHÉE ET LA CORRECTION SORTENT DE LA MÊME FONCTION** : le bouton
« Exécuter », le juge (`ptvJuste`) et la correction lisent tous
`pyRun(ptvProg(q, x))`. La question ne porte que le calcul (a, b), la valeur de
départ et les abscisses en DIXIÈMES — on range l'entier, jamais l'écriture — et
le contrôle refuse tout autre champ.
**LE JUGE EST LARGE SUR L'ÉCRITURE ET EXACT SUR LA VALEUR** : la console écrit
« 4.0 » (un flottant garde son point, la leçon du 5.2) et le tableau est
français, donc « 4 », « 4.0 » et « 4,0 » valent tous le point — refuser une
écriture juste serait le pire défaut du projet ; en revanche la VALEUR est
comparée exactement, en entiers, jamais en virgule flottante.
**LA VIRGULE EST LE PIÈGE DE L'EXERCICE, et il s'enseigne** : le tableau écrit
« 0,5 » et le programme veut « 0.5 ». Une virgule tapée dans la case de x ne
reçoit pas la SyntaxError brute de l'interpréteur mais la phrase qui nomme la
règle — c'est le « un float s'écrit avec un point » du 5.2, rencontré là où il
coûte quelque chose. Et la comparaison qui ouvre une colonne est EXACTE :
« 0.2+0.1 » n'ouvre rien, parce que sa sortie ne serait pas celle que le garde
du tirage a validée.
**LA SÉANCE** : le programme de la demande en tête, ÉPINGLÉ (x = 2,
fonction = 2*x+3), puis un « + » et un « − » — 3*x-1 est la forme du carnet —
en ordre mélangé, les trois coefficients distincts. Ce dernier point est une
mesure, pas une précaution : un tirage libre donnait deux fois le même « a »
une séance sur deux, et trois programmes qui commencent tous par « 2*x » se
lisent comme un seul. La valeur de DÉPART est un entier et jamais une colonne
du tableau — elle donne d'ailleurs un `int` (« 7 ») là où une abscisse décimale
donne un `float` (« 4.0 »), ce qui est le a) de la fiche.
Chaque case se juge SEULE, la case vide ne rougit jamais (une colonne encore
fermée est vide elle aussi, et le message dit alors le geste qui l'ouvre), la
valeur juste s'écrit en VERT sous la case fausse — jamais en soutien, où
l'élève reprend et revérifie. Aucune correction au fil de la frappe
(`soutienEnDirect.sans`) : la valeur cherchée est DÉJÀ à l'écran, dans la
console, et « 4 » tapé avant « .5 » se déclarerait faux au milieu d'un nombre
juste.
Deux bancs, la répartition habituelle : jsdom tient le programme épinglé, le
GARDE refait par une seconde arithmétique (400 séances), le repli, le juge cas
par cas, les portes des colonnes, la copie juste, la copie fausse, le soutien,
la reprise après une pause et les branchements, et compare l'interpréteur à un
vrai python3 ; le NAVIGATEUR (« 6 tricies octies », déclaré par
`pythonTableauValeurs` dans `tests/profils.js`) mesure ce que jsdom ne voit
pas — la case de x posée DANS la ligne 1 à la chasse et à la taille du code, le
tableau rendu, les colonnes fermées qui SE VOIENT fermées (grisées, en
pointillés), une VRAIE frappe au clavier puis un VRAI clic sur « Exécuter »,
l'encre RENDUE des trois verdicts comparée aux VARIABLES de la convention (le
piège du 5.6 : l'encre de repos d'une case est déjà un bleu nuit, et une règle
`.ok` qui ne peindrait plus rien passerait pour du bleu à la dominante), et le
tableau qui DÉFILE dans sa boîte sur un téléphone au lieu de faire déborder la
page. Les contrôles universels des deux bancs ont couvert l'exercice au premier
passage sans rien déclarer.
**Vingt-deux sabotages, chacun rougissant en nommant son défaut** — mais SIX
n'y sont arrivés qu'au second essai, et chacun a appris quelque chose.
· **Un TROU DU CONTRÔLE, réel** : les abscisses collées restaient vertes parce
  que le banc lisait `PTV_ECART` DANS la page et le comparait à lui-même — la
  doctrine des deux sources, oubliée sur cette seule ligne. L'écart minimal est
  déclaré dans `tests/profils.js`, et le banc exige en plus que la page porte
  CET écart : la divergence se nomme.
· **Deux sabotages IMPOSSIBLES**, qui mesuraient autre chose. « Une valeur
  approchée ouvre une colonne » était éprouvé par « 0.2+0.1 », qui ne vaut 0,3
  que si 0,3 est une colonne du tirage — la valeur voisine se construit
  désormais sur une abscisse RÉELLE de la question. Et « l'énoncé est figé sur
  2x + 3 » était mesuré sur la question de la FICHE, dont le calcul EST 2x + 3 :
  le banc rend maintenant une seconde question épinglée à un autre calcul, en
  DERNIER — ce bord remplace le tirage, et tout ce qui précède en dépend.
· **Trois ancres PARTAGÉES** : `if(!allOk && isSoutien()){` vit seize fois dans
  le fichier, la ligne des cases vides deux fois — un sabotage se pose sur une
  ancre PROPRE à sa cible, la leçon d'{antecedents-droite}, retombée telle
  quelle.
**Et la fusion a repayé le piège des deux exercices ajoutés au MÊME endroit** :
quatorze hunks « les deux côtés ont ajouté », dont les lignes communes
n'appartiennent qu'à un des deux blocs. La zone n'a pas été recousue hunk par
hunk : on repart du fichier de `main` et on y REPOSE ses blocs COMPLETS, à des
ancres vérifiées une par une — la méthode que le 5.8 avait déjà éprouvée.

**Puis la marche s'est arrêtée sur une RAISON, pas sur une quatrième valeur :
pourquoi échanger deux variables demande une troisième.**
{python-echange-variables} (Seconde, 5.18 — 5.17 à l'origine, demande de
Turquet, septembre 2026, PDF « variable pas à pas 5 » : « Exécuter le
programme ci-dessous en mode pas à pas. Et compléter les cases mémoire
correspondantes », le programme `a = 10 ; b = 2 ; c = a ; a = b ; b = c`,
puis « Expliquer ce qui s'est passé pour les cases a et b entre le début et
la fin du programme » — « l'IA acceptera toute explication à peu près
correcte comme "ça inverse", "ça permute", "ça échange", "l'ordre change"…
même avec des fautes d'orthographe ») ferme le thème 5 à son tour.
**UNE COLLISION DE NUMÉRO L'A FAIT PASSER DE 5.17 À 5.18** : ouvert en pull
request pendant que {python-pas-a-pas-chaine} — développé indépendamment,
sur une autre session — fusionnait dans `main` sous le MÊME numéro 5.17,
chacun croyant fermer le thème 5 en dernier. `APP_VERSION` est entré en
collision de la même façon (188→189 des deux côtés), tout comme le numéro de
section du banc navigateur (« 6 tricies septendecies » ici, « 6 tricies
septdecies » côté `main` — deux orthographes du 17e, la preuve que la
collision ne se limite pas au numéro d'exercice). La règle du projet a
tranché sans ambiguïté (voir CLAUDE.md, « premier arrivé, premier servi ») :
{python-pas-a-pas-chaine}, fusionné en premier dans `main`, garde 5.17 ; cet
exercice prend 5.18, `APP_VERSION` prend 189→190, et le banc navigateur
prend « 6 tricies duodevicies » (18e). **CALQUÉ EXPLICITEMENT SUR
{python-valeur-case} (5.15)**, la
demande le dit : la MÊME disposition — la case DONNÉE, l'élève n'écrit que la
VALEUR, la fin vérifie la mémoire ENTIÈRE — pour un programme différent.
**CE QU'IL AJOUTE N'EST NI UNE QUATRIÈME VALEUR TIRÉE NI UN QUATRIÈME
VISAGE : c'est la première fois que ce programme RÉAFFECTE une case déjà
remplie.** Les trois marches précédentes (5.14, 5.15, 5.16) n'emploient
chacune un nom qu'UNE fois par programme — une règle assumée, éprouvée en
5.1 (« une variable ne s'affecte qu'une fois par programme »). Ici `a` et `b`
sont réécrits (`a = b`, `b = c`), et c'est PRÉCISÉMENT la leçon : sans case
tierce, `a = b` PUIS `b = a` perdrait la valeur d'origine de `a` dès la
première ligne — la fiche « Noms de variables » n'avait jamais eu l'occasion
de le montrer, et c'est ce que l'algorithme classique de permutation par
variable auxiliaire enseigne. Le moteur du pas à pas PORTE cette
réaffectation sans qu'une ligne bouge : `papMemHTML` pose une RANGÉE PAR
LIGNE, jamais par nom de case, si bien qu'une case réécrite y occupe deux
rangées successives avec sa valeur de l'instant — exactement ce qu'un tableau
« mémoire de l'ordinateur » doit montrer.
**LE MOTEUR EST CELUI DU 5.14/5.15/5.16, L'IDENTITÉ NE L'EST PAS** — la
règle du projet, répétée une cinquième fois dans ce thème. Sont PARTAGÉS la
lecture de la mémoire (`papProg`, `papEtat`, `papAns` — donc `pyRun`,
l'interpréteur du 5.1), la comparaison des valeurs (`papNet`), la question
« cette ligne recopie-t-elle une case ? » (`papCopie`, qui n'a besoin
d'AUCUNE modification : une réaffectation qui recopie reste une recopie) et
le cadre du programme avec son repère ▶ (`papProgHTML`) ; la feuille de
styles aussi (`pap-cols`, `pap-mem`, `pap-val` et ses trois encres). Sont
PROPRES son identifiant, son kind (`pev`), son écran, son rappel, ses
questions à l'IA, son contexte, sa FICHE (`PEV_FICHE` : le programme du PDF,
au caractère près), son tirage (`pevGen`, `pevBuildQuestions` — deux visages
tirés, les jeux de lettres de `PAP_JEUX` et deux valeurs distinctes de
`papValeurs`), son juge par ligne (`checkPEV`) et son poids (`pevCases`).

**PUIS UNE QUESTION OUVERTE, une fois le pas à pas terminé — nouveau dans
cette famille.** « Explique ce qui s'est passé pour les cases a et b entre le
début et la fin du programme » n'a pas UNE bonne réponse à comparer : c'est
une IDÉE à reconnaître dans une phrase en langage naturel, tolérante à la
formulation ET à l'orthographe — la demande le dit en toutes lettres.
**CE N'EST PAS UN VERDICT ARITHMÉTIQUE, et c'est le bord qui décide de tout**
(la doctrine de `docs/journal/08-verdicts-et-juges.md`, « un verdict
arithmétique ne se confie pas à un modèle » — le modèle a un jour compté
fausse une soustraction de fractions pourtant juste). Cette interdiction
protège un CALCUL qu'un juge local peut trancher en entiers exacts ; ici il
n'y a rien à calculer, seulement une idée à reconnaître dans une prose libre
— et c'est très exactement le terrain sur lequel un modèle de langage est
meilleur juge qu'une expression régulière. Aucun juge local n'est donc écrit
: le modèle EST le juge, la position que la doctrine réserve à ce qu'un
calcul ne sait pas trancher, jamais rétractée. L'appel passe par l'action
`verif`, DÉJÀ générique dans la fonction Edge (question / attendu / réponse
— la même que {somme-fractions-libre} et {multiplier-fractions-libre}
emploient) : aucune fonction Edge n'est modifiée, et `pevAttenduIA` écrit la
RÈGLE DE DÉCISION avec les vraies valeurs de la question tirée, jamais une
phrase générique — le modèle applique, il ne devine pas.
**LA CHAÎNE DES PORTES A UN MAILLON DE PLUS.** Les cinq lignes se vérifient
UNE À UNE comme au 5.15 : case vide jamais peinte, porte de la ligne suivante
tenue par l'ÉTAT du bouton, en soutien une ligne fausse ne laisse pas passer
à la suivante. Le BILAN de la mémoire entière ne paraît qu'à la dernière
ligne jugée — ALORS SEULEMENT la question ouverte apparaît, jamais avant :
un élève ne peut pas expliquer un échange qu'il n'a pas encore tracé. Le
verrou de la question ENTIÈRE (`test.locked`) n'arrive donc plus après la
dernière ligne, comme au 5.15/5.16, mais après ce SECOND jugement — et
« Question suivante » suit la même règle qu'un exercice rédigé
({definitions-ensembles}) : verrouillée quand l'explication est juste, ou
après UN SEUL essai en entraînement ; en soutien, une explication fausse ne
conclut rien, l'élève reprend et revérifie, sans jamais recevoir la phrase
attendue.
**LES PHRASES DU VERDICT SUIVENT LA RÈGLE DU PROJET** : vertes quand
l'explication est acceptée, rouges quand elle ne l'est pas (`docs/journal/
08-verdicts-et-juges.md`) — la même classe `mp-feedback good/bad` que partout
ailleurs, sans encre neutre à retenir.
Deux bancs, la répartition habituelle : jsdom tient la fiche épinglée, ses
cinq rangées, la vérification par ligne et sa porte, le bilan de la fin, la
case vide jamais peinte, la rangée quittée qui porte la mémoire vraie même
quand `a` ou `b` est réécrit, la porte de la question ouverte (elle
n'apparaît pas avant la fin du pas à pas, ne se verrouille pas sur un
verdict faux en soutien, se verrouille après un seul essai en entraînement),
le contenu envoyé au modèle (`pevEnonceIA`, `pevAttenduIA` — le programme,
la règle de décision AVEC les vraies valeurs, jamais une phrase générique),
la reprise après une pause et les branchements ; le NAVIGATEUR
(« 6 tricies duodevicies », déclaré par `pythonEchangeVariables` dans
`tests/profils.js`) mesure ce que jsdom ne peut pas mesurer honnêtement — un
VRAI appel réseau STUBBÉ plutôt qu'un double local, puisqu'AUCUNE seconde
méthode ne pourrait rejouer un jugement de langage naturel : il ouvre la
fiche épinglée, tape les cinq valeurs au clavier, vérifie que la question
ouverte ne paraît qu'à la fin et nomme les deux bonnes cases, puis stubbe
l'action `verif` deux fois — un verdict FAUX d'abord (la case ne se
verrouille pas, « Question suivante » n'apparaît pas, le retour est rouge),
un verdict JUSTE ensuite (la note grimpe, la question se verrouille, « 
Question suivante » paraît, le retour est vert) — et relit à chaque fois ce
qui est VRAIMENT parti au modèle (le programme, la règle nommant
l'échange, la réponse tapée).
**Ni « nb » ni « bareme » dans sa déclaration de `tests/profils.js`, et c'est
volontaire, comme au 5.16** — mais pour une raison DIFFÉRENTE, et le dire
vaut mieux que de le taire. Le 5.16 manque d'une seconde arithmétique parce
que réimplémenter un calcul hors de `pyRun` est un chantier remis à plus
tard ; ici, une seconde méthode locale ne SERAIT PAS le même genre de
garantie qu'ailleurs — juger une phrase en langage naturel n'est pas une
opération qu'un contrôle indépendant peut rejouer en entiers exacts, la
doctrine même qui justifie de confier le verdict au modèle. Le banc
NAVIGATEUR comble ce trou par la seule méthode honnête : stubber la réponse
du modèle et éprouver ce que la PAGE fait de chaque verdict possible, jamais
ce que le modèle AURAIT dû répondre.
**Il ferme le thème 5, en 5.18 — et le bord « il ferme le thème 5, en 5.17 »
de {python-pas-a-pas-chaine} a été RETOURNÉ, pas retiré** : le dixième à
l'être, après le 5.8, le 5.9, le 5.10, le 5.11, le 5.12, le 5.13, le 5.14, le
5.15 et le 5.16 (ce dernier retourné par {python-pas-a-pas-chaine} lui-même,
dans SA propre chronique — le bord « il ferme le thème 5, en 5.16 » de
{python-pas-a-pas-calcul} n'est donc PAS retourné une seconde fois ici, il
l'était déjà). {python-pas-a-pas-chaine} vit désormais entre
{python-pas-a-pas-calcul} et celui-ci. Le contrôle jsdom qui portait ce bord
(dans la section 8 de `pythonPasAPasChaine`, « la place au menu et les
branchements ») a été réécrit pour tenir une POSITION RELATIVE (`indexOf`)
plutôt qu'une distance à la fin du thème : un contrôle qui compte depuis la
fin doit être réécrit à CHAQUE nouveau fermeur, un contrôle qui compare des
voisins survit au suivant — la leçon même que cette marche du thème répète
depuis le 5.8, et que la collision de numéro vient de rappeler une fois de
plus : ce contrôle-ci n'a pas eu à bouger quand le fermeur a changé de main
en pleine fusion.
**Et le fermeur a changé de main une ONZIÈME fois, le jour même** :
{python-pas-a-pas-multiplication} a réclamé le numéro 5.18 EN PARALLÈLE, sur
une troisième session — la même collision que celle qui vient d'être décrite
avec {python-pas-a-pas-chaine}, mais retombée une seconde fois sur le MÊME
numéro. Cet exercice-ci, fusionné le premier dans `main`, garde 5.18 ; l'autre
prend 5.19 et devient le nouveau fermeur — le bord « il ferme le thème 5, en
5.18 » ci-dessus est donc RETOURNÉ à son tour, dans la chronique de
{python-pas-a-pas-multiplication}.
Trois sabotages ont servi à éprouver le banc navigateur, chacun rougissant en
nommant son défaut : la question ouverte affichée AVANT la fin du pas à
pas — repérée par « la question ouverte est affichée avant la fin du
programme » —, un verdict FAUX qui verrouille quand même la question
(entraînement, premier essai) — repérée par « la question se verrouille
alors que le verdict est faux » —, et l'encre du verdict juste laissée en
noir plutôt qu'en vert — repérée à la dominante RENDUE, jamais à la classe
seule, la leçon de `docs/journal/08-verdicts-et-juges.md` retombée telle
quelle sur un neuvième exercice.

**Puis échanger deux valeurs PAR LES LETTRES — un exercice différent de
{python-echange-variables}, et le nom le dit.** {python-echange-par-lettres}
(Seconde, 5.20, demande de Turquet, septembre 2026, sur un PDF transcrit :
« Compléter le programme uniquement avec les lettres k, l ou m pour que la
valeur de k = 10 et l = 2 soient échangées » — `k = 10`, `l = 2`, `m = .....`,
`..... = .....`, `..... = ......`, un bouton exécuter, « si faux, demander de
modifier les cases du programme, avant de réexécuter, jusqu'à ce que cela
fonctionne ») ferme le thème 5, en 5.20 — ajouté en dernier, il ne renumérote
rien.

**Il a été implémenté une première fois sous le nom `{echanger-variables}`,
abandonné par erreur AVANT d'être fusionné, pendant qu'une session parallèle
donnait ENTRE-TEMPS ce même nom de famille à un exercice DIFFÉRENT.**
{python-echange-variables} (5.18), arrivé sur `main` pendant l'absence du
premier, fait ÉCRIRE la VALEUR d'une case déjà nommée, ligne après ligne — le
moteur même du pas à pas (5.14 à 5.17), la marche de plus que
`docs/journal/06-seconde-python.md` décrit juste au-dessus. Le PDF de Turquet
ne demande PAS cela : il demande de CHOISIR la LETTRE qui va à chaque
emplacement d'un programme à trous, parmi un petit alphabet imposé (k, l, m)
— jamais une valeur numérique. Reconstruire le premier exercice sous son nom
d'origine aurait recréé une confusion permanente entre deux identifiants
presque jumeaux (`echanger-variables` / `python-echange-variables`) portant
deux mécaniques opposées ; il a donc été reconstruit sous un troisième nom,
sans ambiguïté avec aucun des deux : `python-echange-par-lettres` — la
famille `python-…` comme tous ses voisins du thème, et « par-lettres » qui
nomme la mécanique (choisir la lettre) plutôt que l'action (échanger), déjà
prise.

**CE N'EST PAS UNE MARCHE DE PLUS DU PAS À PAS (5.14 à 5.19), et c'est un
arbitrage nommé avant même d'écrire une ligne.** Les exercices précédents
font LIRE une mémoire déjà écrite, ligne après ligne, avec une porte qui
n'ouvre la ligne suivante qu'une fois celle-ci jugée — le motif même de
`papProg`/`papEtat`/`papAns`, repris tel quel jusque dans
{python-echange-variables} (5.18) et {python-pas-a-pas-multiplication}
(5.19). Le PDF ne décrit rien de tel : une question UNIQUE, un programme à
trois lignes À TROUS, un bouton « Exécuter » qui juge tout à la fois, et une
boucle de correction qui n'avance QUE quand le programme entier fonctionne.
Réutiliser le moteur du pas à pas aurait fait lire à l'élève un tableau de
mémoire qui grandit ligne par ligne — une fiction que le PDF ne demande pas —
pour une leçon qui n'a rien à voir : le pas à pas enseigne CE QU'EST une
variable, celui-ci enseigne qu'échanger deux valeurs prend une case DE PLUS.

**CINQ CASES, UN SEUL VERDICT — et c'est le cœur de la conception.** La ligne
3 (`m = .....`) ne porte qu'UNE case à choix : `m` est FIXÉ à gauche par
l'énoncé, seule sa valeur se choisit. Les lignes 4 et 5 (`..... = .....`) en
portent chacune DEUX : rien à l'écran ne dit plus quelle case reçoit quoi.
**LE PROGRAMME ENTIER EST JUGÉ COMME UNE SEULE `pts-case`** (`pel-prog`, sur
le CADRE lui-même — la leçon de {python-print} et {python-completer}, un
programme entier qui ne se compare jamais à une écriture attendue), et
c'est un choix FORCÉ par les mathématiques du problème : il existe DEUX
façons justes de permuter — `m = k` puis `k = l` puis `l = m`, OU `m = l`
puis `l = k` puis `k = m` — et un juge qui noterait chaque case séparément
aurait dû DEVINER laquelle des deux l'élève vise, donnant tort à la moitié
des copies justes (l'énumération exhaustive des 3 × 9 × 9 combinaisons
possibles, faite avant d'écrire le juge, ne montre QUE ces deux solutions).
Peindre les cinq cases séparément (`pel-ok`/`pel-bad`, jamais `.ok`/`.bad` —
sans quoi `ptsEcran()` les compterait EN PLUS du cadre, et une séance de
trois questions vaudrait 18 cases au lieu de 3) reste un confort visuel, pas
une note : la note se lit sur le cadre, et lui seul.

**LE JUGE SIMULE, IL NE COMPARE JAMAIS À UNE LIGNE ATTENDUE** — la doctrine
de {python-print} reprise sur un programme entier plutôt qu'une ligne :
`pelJuge` construit le texte du programme avec les CINQ lettres choisies et
l'exécute avec `pyRun`, l'interpréteur MÊME du bouton « Exécuter » du 5.1,
puis regarde si la case de la première variable contient la valeur de départ
de la seconde et réciproquement. Toute suite d'affectations qui y parvient
est acceptée, y compris une variante que personne n'a prévue — c'est la
seule méthode robuste dès qu'un énoncé accepte plusieurs bonnes réponses, et
comparer à UNE ligne canonique aurait compté fausse une copie qui permute
correctement par l'autre chemin, le pire défaut du projet.

**LE PETIT ALPHABET SE CHOISIT, IL NE SE TAPE JAMAIS** — dans l'esprit du nom
de case du 5.14 (une liste, jamais une saisie libre), mais pour une raison
différente : là-bas une saisie libre recalerait sur la casse, ici l'énoncé
lui-même IMPOSE les trois seules lettres possibles (« uniquement avec les
lettres k, l ou m »), et une case texte libre aurait accepté n'importe quel
autre caractère sans qu'aucune règle ne le dise à l'écran.

**UNE CASE LUE AVANT D'ÊTRE REMPLIE LÈVE UNE VRAIE ERREUR PYTHON, ET C'EST
L'INTERPRÉTEUR QUI RÉPOND** — la doctrine des trois positions : choisir `m`
comme valeur de la ligne 3 (`m = m`) lit une case qui n'existe pas encore, et
`pyRun` lève la même `NameError` que pour toute variable inconnue. Le message
qui en sort ne dit jamais la réponse : il NOMME le fait (« ta ligne essaie de
lire ce que contient la case « m » avant qu'elle n'ait reçu de valeur »),
comme {python-pas-a-pas-calcul} le fait déjà pour ses calculs.

**« BOUTON EXÉCUTER. SI FAUX, MODIFIER LES CASES, RÉEXÉCUTER, JUSQU'À CE QUE
ÇA FONCTIONNE » est la chaîne même du mode SOUTIEN, déjà universelle dans ce
projet** — rien à inventer : une copie fausse rougit le CADRE entier sans
rien révéler, les cinq cases restent choisissables, changer l'une d'elles
efface le rouge (`pelSaisie`, le motif de `pvmModifiee`), et l'élève
réexécute jusqu'à réussir. En ENTRAÎNEMENT le premier essai verrouille les
cinq listes, et un programme qui convient s'écrit en VERT en dessous —
jamais celui que l'élève a tenté, la leçon d'{ecrire-solutions} (refuser une
écriture juste serait le pire défaut du projet, et ici une écriture JUSTE
mais DIFFÉRENTE du modèle affiché aurait pu faire douter l'élève à tort :
le modèle porte la mention qu'il n'est qu'un exemple, comme {python-nom-variable}).

**TROIS QUESTIONS, LA FICHE DU PDF TOUJOURS EN TÊTE** (`PEL_FICHE` :
k = 10, l = 2, m), puis deux jeux de lettres TIRÉS et distincts de k, l, m
(`PEL_JEUX` : p/q/r, x/y/z, e/f/g, u/v/w — la fiche resterait sinon
reconnaissable au hasard) avec deux valeurs entières distinctes tirées entre
2 et 99 (`papValeurs`, la fonction MÊME du pas à pas — « tout est repris, rien
n'est recopié »). L'ORDRE des trois lettres dans chaque liste déroulante est
tiré par question et conservé (le motif du 5.14) : à case égale, le rang de
la bonne varie.

**Deux bancs, la répartition habituelle.** jsdom tient le tirage (la fiche
au caractère près, les jeux distincts, 300 séances), le juge par une SECONDE
simulation INDÉPENDANTE de `pyRun` (un dictionnaire tenu à la main, 500
tirages au hasard parmi les 3⁵ combinaisons possibles, comparé case par cas
au verdict de la page), les deux solutions ÉPINGLÉES acceptées, l'échange
direct sans intermédiaire REFUSÉ, la case lue avant d'être remplie qui lève
une erreur, la case vide dans les deux modes, le verrou et l'encre en
entraînement, la boucle de correction en soutien, la reprise après une pause
(générique, via `captureBoxes`/`restoreBoxes` — cinq `<select>` comme les
autres, rien à écrire de propre), les branchements — par POSITION RELATIVE
(`indexOf`), la convention désormais établie dans ce thème depuis
{python-pas-a-pas-chaine} — et le contexte envoyé au modèle. Le NAVIGATEUR
(« 6 tricies vicies ») mesure ce que jsdom ne voit pas : les CINQ `<select>`
RENDUS à la chasse et à la taille du code des deux lignes écrites au-dessus,
un VRAI choix dans chacun (Playwright refuse un select désactivé, et c'est
le bord qu'on tient), le CADRE ENTIER peint en rouge ou en bleu à l'encre
RENDUE — jamais case par case —, la boucle même du PDF rejouée pour de vrai
(un choix faux, « Exécuter », le rouge, un choix corrigé, « Exécuter », le
bleu), puis, dans une session neuve, le verrou de l'entraînement et le
modèle VERT rendu, et le téléphone (390 px) qui ne déborde pas.

**Ce qu'un sabotage éprouve** : comparer à UNE ligne canonique plutôt que
simuler (il rougit sur la moitié des copies justes — `m = l`, `l = k`,
`k = m` — en disant « une façon juste de permuter est refusée »), peindre
les cinq cases avec `.ok`/`.bad` au lieu de `.pel-ok`/`.pel-bad` (le compte
de `ptsEcran()` double aussitôt, « la note affichée : 6 cases sur 6 » au lieu
de 1 sur 1), révéler le modèle en soutien, verrouiller une case dès la
première exécution fausse en soutien, laisser `m = m` s'exécuter sans erreur,
et retirer la clause de secret du contexte envoyé au modèle.
