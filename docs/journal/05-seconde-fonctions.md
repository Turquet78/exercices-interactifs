# Seconde — fonctions, courbes et tableaux

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Une question vérifiée ATTEND l'élève — plus aucun écran ne s'enfuit.**
Signalé par Turquet (août 2026) : « quand on a vérifié une question, il n'y a
pas de bouton suivant » sur le 2.2. Les trois exercices de courbes (2.1, 2.2,
2.3) avançaient TOUT SEULS — 0,9 s après une copie juste, 2,4 s après une
fausse — un héritage de leur premier portage : le temps de rien, la
correction, le badge et le trait de la méthode s'effaçaient sous les yeux de
l'élève, précisément quand il en avait besoin. Le bouton « Valider » devient
« Question suivante » après la vérification (« Voir mes résultats » sur la
dernière), reçoit le focus, et le RENDU le réarme à chaque question — sans le
réarmement, un clic de plus sauterait une question, et c'est le bord le plus
sournois. Plus aucun minuteur (`fbTimer` n'est plus jamais posé sur ces
trois écrans). Un contrôle tient les quatre bords sur les trois exercices —
le minuteur qui reviendrait, le bouton éteint, le texte du bouton, le
réarmement — éprouvé par trois sabotages nommés.

**L'image d'un nombre se lit dans la courbe — au sens propre.** {image-nombre}
(Seconde, thème Fonctions) est repris de la fiche papier : une courbe sur
quadrillage, et « L'image de X est la hauteur de X. C'est … f(…) = … » plus le
tableau de valeurs à une colonne. Tout le dessin est celui de
{lecture-variations} — `lvGenPts`, `lvGraphSVG`, la spline, les cases `lv-in`
et `lvMarkFields` : un second moteur aurait fini par diverger. `lvGraphSVG` a
seulement gagné un paramètre (`extra`) pour dessiner par-dessus.
**La MÉTHODE est le trait vertical, et la page le DESSINE.** Il part de X sur
l'axe des abscisses, monte ou descend jusqu'à la courbe, puis rejoint l'axe des
ordonnées à l'horizontale — le geste de la fiche, montré à la VALIDATION et
jamais avant : affiché pendant la recherche, il donnerait la hauteur qu'on
demande de lire. Le contrôle mesure le trait contre les GRADUATIONS du dessin
même — il retrouve l'étiquette qui porte l'abscisse demandée et exige que le
trait en parte : aucune coordonnée recopiée, une échelle qui changerait
resterait mesurée juste (la leçon du schéma des intervalles).
**La bonne réponse n'est jamais rangée à côté de la question** : l'image est
`q.pts[x0+3]` — les données MÊMES qui dessinent la courbe — lue par `imgCheck`,
la fonction qui corrige, si bien qu'un énoncé ne peut pas contredire sa
correction. La question ne porte QUE la courbe et l'abscisse, et le contrôle
refuse tout autre champ.
**Le tirage écarte deux questions muettes** : x = 0 (le trait vertical n'y a
rien à tracer) et une image nulle (le trait serait invisible) — pour la
seconde, on retire la COURBE, pas l'abscisse, afin que les quatre abscisses
restent distinctes. Éprouvé en le cassant sept fois : x = 0 autorisé, abscisses
répétées, la réponse rangée dans la question, une case qui ne se juge plus, la
case vide colorée en soutien, le trait absent, le trait parti de 0 — chacun
rougit en nommant son défaut.
Et un manque d'à côté s'y est vu : `lvMarkFields` posait la classe `sol` depuis
toujours, mais aucune règle CSS ne dessinait `.lv-in.sol` — la correction en
bleu d'une case vide s'écrivait avec l'encre d'une saisie ordinaire, sur
{lecture-variations} aussi. La règle est posée maintenant, et elle répare les
deux exercices d'un coup.

**Placer le point AVANT de lire l'image — le même dessin, le geste en plus.**
{placer-image} (Seconde, Fonctions, demande de Turquet, septembre 2026 — « il
faut que l'élève place le point sur le graphique avant de donner le résultat »)
suit {image-nombre} dans le menu : même courbe, même « f(…) = … », mais l'élève
POSE d'abord le point sur le graphique, au clic, et les cases n'ouvrent
qu'ensuite.
**Le tirage est PARTAGÉ, pas recopié** : `imgTirage()` est extrait de
`startImg` et sert les deux exercices — un second tirage aurait fini par
diverger, et deux exercices voisins se seraient contredits sous les yeux de
l'élève. Le dessin et la peinture des cases sont ceux de {lecture-variations}
(`lvGraphSVG`, `lvMarkFields`), comme pour toute la famille.
**La question ne porte que la courbe, l'abscisse et le point posé — et c'est
la PROJECTION de `startPim` qui le tient** : elle recopie `{pts, x0, rep}` et
JETTE tout champ étranger. Le sabotage l'a montré des deux côtés : `y0` rangé
dans le TIRAGE partagé rougit chez {image-nombre} et ne peut pas atteindre
pim — la projection l'écarte, le vert disait vrai, c'est le sabotage
impossible documenté — ; le sabotage utile vise la projection elle-même, et
le contrôle de pim refuse alors le champ en le nommant.
**Les cases ATTENDENT le point.** Désactivées tant qu'aucun point n'est posé,
ouvertes dès qu'il l'est, redésactivées SANS être vidées quand l'élève retire
son point (re-clic sur le même nœud) ; « Vérifier » sans point ne peint rien
et ne verrouille rien — le message demande le point. La demande de l'exercice
(« place le point AVANT de donner le résultat ») est tenue par l'ÉTAT des
cases, pas par une consigne qu'on peut ne pas lire.
**Le clic est DÉLÉGUÉ à l'hôte et calibré sur les GRADUATIONS.** Le SVG est
réécrit à chaque pose — un écouteur posé dessus mourrait avec lui, la leçon
de {construire-fonction} — et `pimNoeud()` lit les lignes du quadrillage dans
le SVG RENDU pour convertir le clic en nœud : aucune coordonnée recopiée, une
échelle qui changerait resterait mesurée juste (la leçon du schéma des
intervalles). Un clic décalé s'accroche au nœud le plus proche. jsdom n'a pas
de mise en page — un rectangle de SVG y vaut zéro — : seul le banc navigateur
CLIQUE pour de vrai, et son sabotage à lui inverse l'axe des y dans le
calibrage — « le point se pose au clic » rougit, preuve que le scénario
mesure le clic et non un état posé à la main.
**Le point est une RÉPONSE** (`pts-case`, la leçon des barres de
{simplifier-barres}) : chaque question vaut trois réponses — le point et les
deux cases — et la pastille sous le dessin dit l'état (« Place d'abord le
point… », puis « Point posé en (2 ; 3) »). Le point faux reste ROUGE et le
bon point se montre en VERT à côté (l'anneau `pim-sol`) — jamais en soutien,
où l'élève corrige lui-même — et une case vide ne rougit jamais.
**Et le rappel de cours est en HTML pur, sans un seul `\(`.** Sa seule
« formule » est f(2) = 3, qui n'a pas besoin de LaTeX — or le contrôle
navigateur des fractions empilées OUVRE tout rappel qui porte une formule et
exige qu'une fraction s'y DESSINE : une formule sans fraction le laisse sans
rien à mesurer, ce qu'il refuse — il ne sait pas la distinguer d'un
`rapMaths()` débranché. Une formule qui n'empile rien s'écrit sans LaTeX.
Éprouvé en le cassant six fois — cinq au banc principal, un au navigateur —,
chacun rougissant en nommant son défaut.

**Puis la droite verticale est devenue un GESTE, avant le point.** Demande de
Turquet (septembre 2026) : « demander d'abord à l'élève de déplacer une droite
verticale au bon endroit sur la courbe avant de placer le point ». C'est le
motif d'{antecedents-droite}, transposé à la verticale, et REPRIS plutôt que
réinventé : mêmes classes (la droite déplaçable est ORANGE, `.adr-niv` ; la
correction en vert pointillé, `.adr-sol`), mêmes deux modes explicites
(« Déplacer la droite » / « Placer le point »), même chaîne de portes — le
mode point et donc le point attendent la droite, les cases attendent le point,
et chaque « Vérifier » prématuré redit le geste manquant sans rien peindre ni
verrouiller. **Quatre réponses désormais** (la droite, le point, les deux
cases), et chacune se juge SEULE : une droite mal posée est comptée fausse une
fois, elle ne fait pas payer le point une seconde fois. La branche verrouillée
ne porte AUCUN garde `isSoutien()` sur les révélations : en soutien on n'y
arrive qu'avec une copie toute juste — le garde-fou mort d'{antecedents-droite}
n'a pas été réécrit ici, et le contrôle tient le bord par la branche du
soutien. Le contrôle jsdom a été ÉTENDU (la projection accepte `vl`, la copie
juste vaut 4, la droite fausse coûte exactement son point, la verticale verte
se montre en entraînement seulement) et le banc navigateur GLISSE la droite
pour de vrai — relâchée à un tiers de maille, elle s'accroche — avant de
cliquer le point, sur les deux questions qu'il joue.

**Et le chemin inverse de l'image est un autre exercice : les antécédents.**
{antecedent-nombre} (Seconde, 2.3, demande de Turquet, août 2026) est repris de
la fiche papier : on donne une HAUTEUR, et il faut retrouver le ou les nombres
de départ. La méthode est le **trait horizontal — la ligne de niveau** : chaque
point où il coupe la courbe donne un antécédent, lu en descendant sur l'axe des
abscisses. La page le dessine à la VALIDATION, jamais avant — affiché pendant
la recherche, il montrerait les croisements qu'on demande de trouver. Le dessin
est celui de {lecture-variations}, comme pour l'image : un troisième moteur
aurait fini par diverger.
**Le risque propre à cet exercice est la hauteur ILLISIBLE.** La courbe est une
spline qui passe par des points entiers : une hauteur strictement comprise
entre deux valeurs voisines est traversée par la ligne de niveau ENTRE deux
graduations — l'élève voit un croisement qu'il ne peut pas lire, et sa réponse
juste serait comptée fausse, le pire défaut possible. `antCibles()` écarte ces
hauteurs au TIRAGE, et le contrôle recompte les traversées par sa propre
arithmétique sur chaque tirage.
**L'ordre des antécédents est LIBRE**, et il le faut : rien à l'écran ne dit
quelle case porte lequel. Chaque case se juge sur ce qu'elle PROMET — être l'un
des antécédents attendus — et la liste les prend une fois chacun : le même
antécédent posé deux fois est défendable une fois, faux la seconde. C'est la
règle des paires de {somme-fractions}, transposée. Les cases restées sans
correspondance reçoivent en partage les antécédents restants — la valeur que la
correction en bleu écrira dedans.
**La séance montre toujours les deux visages** : au moins une hauteur à UN
antécédent (dite au singulier — « L'antécédent de 3 est … »), au moins une à
PLUSIEURS — sans quoi l'élève apprend que la réponse est toujours du même
genre. Éprouvé en le cassant huit fois : la hauteur illisible autorisée, la
réponse rangée dans la question, une case qui ne se juge plus, l'ordre imposé,
le doublon compté deux fois, la case vide colorée en soutien, la ligne absente,
la ligne posée à la mauvaise hauteur — chacun rougit en nommant son défaut.

**Et les antécédents en GRAND : c'est l'élève qui place la droite.**
{antecedents-droite} (Seconde, demande de Turquet, septembre 2026) suit
{antecedent-nombre} dans le menu : le même style de dessin que le 2.4, mais la
grille est DOUBLÉE — 13 graduations en abscisse ET en ordonnée (−6..6) contre
7 — et la droite horizontale n'est plus dessinée par la page : l'élève la FAIT
GLISSER à la hauteur demandée, puis — la droite posée — marque au clic le ou
les points où elle coupe la courbe, OU RIEN s'il n'y en a pas, puis complète
la phrase « Les antécédents de k [est / sont / n'existent pas] … ; … ; … ».
**Le moteur lv n'est PAS réutilisé tel quel, et c'est un arbitrage nommé** :
lvGenPts, lvPath et lvGraphSVG sont figés sur 7 graduations et comparés au
caractère près avec terminale.html — les généraliser aurait touché la
Terminale pour un besoin de Seconde. Seul le cœur mathématique est partagé
(lvTangents, lvPickSubset, génériques en longueur) : la spline est donc la
même, et le reste est réécrit à l'échelle 13 dans le seul bloc `adr`.
**La séance montre les TROIS visages, chacun UNE fois, en ordre mélangé** :
aucun antécédent, un seul, plusieurs — c'est LA question de l'exercice, et
c'est pourquoi les TROIS cases de nombres sont toujours affichées : des cases
au nombre exact révéleraient la réponse qu'on fait chercher. Une case en trop
restée vide n'est ni fausse ni comptée ; les nombres suivent la règle des
paires d'{antecedent-nombre} (ordre libre, le doublon défendable une fois).
**Deux gestes sur un seul dessin, donc deux MODES explicites** (« Déplacer
la droite » / « Placer les points »), le second fermé tant que la droite
n'est pas posée — comme la phrase et ses cases : la demande « la droite
d'abord » est tenue par l'ÉTAT des cases, le motif de {placer-image}. Les
points vivent SUR la droite (ils la suivent quand elle bouge) et se jugent
sur les ABSCISSES qu'ils désignent : une droite mal posée est comptée fausse
UNE fois, elle ne fait pas payer les points une seconde fois — chaque réponse
se juge seule. « n'existent pas » ferme les cases de nombres sans les vider.
**Le repli du tirage est RÉEL, relevé sur le générateur** (0 échec sur 2000,
0 recours au repli sur 300 tirages mesurés), et le contrôle l'éprouve par les
gardes mêmes du tirage : il assèche le générateur et rejoue ses contrôles sur
ce qui sort alors. La hauteur reste LISIBLE (recomptée par la propre
arithmétique du contrôle), et la question ne range que la courbe, la hauteur
et les réponses de l'élève (dr, rep).
**Un garde-fou mort y a été écrit, puis retiré** — dans la branche verrouillée
de la vérification, un `!isSoutien()` protégeait la révélation verte : on n'y
arrive en soutien qu'avec une copie toute juste (la branche du soutien
incomplet passe avant), donc il n'écartait jamais rien — le sabotage l'a
montré en restant vert, et le contrôle tient ce bord par la branche du
soutien. **Et un sabotage a d'abord frappé le VOISIN** : les trois lignes du
filtre de lisibilité d'adrCibles sont identiques à celles d'antCibles, et le
remplacement de la « première occurrence » a saboté le 2.3 pendant que le
contrôle du nouvel exercice restait vert à bon droit — un sabotage se pose
sur une ancre PROPRE à sa cible, sans quoi il mesure autre chose. Neuf
sabotages en tout, chacun rougissant en nommant son défaut. Le banc
navigateur, lui, GLISSE pour de vrai — jsdom n'a pas de mise en page : le
geste central de l'exercice ne se voit que là — relâche la droite à un tiers
de maille (elle s'accroche), clique les croisements, retire un point, et
relit la note et les couleurs.

**Lire une inéquation, c'est d'abord dire ce qu'elle SIGNIFIE — et le dessin
suit la réponse.** {inequation-droite} (Seconde, demande de Turquet, septembre
2026) vient juste avant {inequation-graphique}, comme premier pas : l'élève
PLACE la droite horizontale (le glisser d'{antecedents-droite}, mêmes classes
orange/verte), puis complète la phrase — « f (x) ≥ k signifie que f (x) est
[au-dessus / en dessous] de cette droite, et f (x) peut toucher cette droite :
[oui / non] » —, le dessin se colorie alors SELON SA RÉPONSE (la règle du
2.4.1 : un dessin qui montrerait d'office la bonne partie ferait la lecture à
sa place ; il passe à la lecture corrigée à la vérification, quand la phrase
aussi porte les bonnes réponses), et il conclut S = … en choisissant crochets
et nombres — les accolades { } sont OFFERTES et toujours fausses : l'erreur de
l'élève qui confond avec une équation, et elle doit pouvoir se commettre.
**La signification ne dépend que du SIGNE**, et c'est pourquoi les quatre
signes sortent chacun UNE fois par séance, en ordre mélangé — sans quoi
« au-dessus » tomberait toujours juste. **S est toujours UN SEUL intervalle,
et c'est le tirage qui le garantit** : la courbe est la cloche du 2.4 (ingGen,
réutilisé tel quel) pour ≥ et >, son MIROIR en vallée (valeurs et hauteur
passées à l'opposé — les garanties du 2.4 se conservent par symétrie) pour
≤ et < : le morceau demandé est toujours celui du milieu, [x1 ; x2], la forme
même que la conclusion à quatre cases demande. Les portes s'enchaînent : la
phrase attend la droite, la conclusion attend la phrase ; chaque réponse se
juge seule (la droite mal posée coûte son point et rien d'autre), corrChoix
porte badges et cases vertes, msgAvecVides dit les cases vides avant tout.
Sept sabotages jsdom (les signes non mélangés, la vallée perdue — S devenait
une union —, la droite qui fait payer le reste, le dessin montré d'office,
la conclusion qui n'attend plus, la case vide rougie, le dessin qui ne passe
plus à la lecture corrigée) et un sabotage navigateur (le dessin qui inverse
la lecture — mesuré sur les morceaux RENDUS et leur étendue), chacun
rougissant en nommant son défaut.

**Résoudre une inéquation, c'est d'abord choisir le dessin qui la montre.**
{inequation-graphique} (Seconde, 2.4, demande de Turquet, août 2026) est repris
de la fiche papier : UNE courbe, la droite y = k, et quatre dessins qui ne
diffèrent que par leur partie rouge — au-dessus ou au-dessous de la droite,
croisements en point PLEIN (pris) ou rond VIDE (exclu) — puis quatre
sous-questions dans l'ordre de la fiche (≥, >, ≤, <) : choisir le dessin, dire
où la partie rouge commence et s'arrête (et s'il faut prendre ces nombres),
écrire S. Tout se choisit dans des propositions, jamais tapé — la règle des
intervalles. Le dessin est celui de {lecture-variations}, comme l'image et les
antécédents ; `lvPath` a seulement appris à ne dessiner qu'un MORCEAU de la
courbe, les tangentes restant calculées sur la courbe entière pour que le rouge
se superpose exactement au noir.
**L'ordre des quatre dessins est tiré UNE fois par séance et CONSERVÉ pour les
quatre sous-questions** (demande de Turquet, août 2026). Les deux bords sont
tenus, parce que chacun a son défaut : re-tiré à chaque question, le dessin (a)
de la question 2 ne serait plus celui de la question 1 — le tableau changerait
sous les yeux de l'élève ; figé dans le code, le dessin de ≥ tomberait toujours
au même rang et l'élève apprendrait le rang — la leçon d'{intervalles-inegalite},
« à forme égale le rang change », transposée à la séance.
**La bonne réponse n'est jamais rangée à côté de la question** : elle ne porte
que la courbe, la hauteur, l'ordre et le signe ; `ingBornes()` relit les deux
croisements dans les données mêmes qui dessinent la courbe, et le contrôle
refuse tout autre champ. Le tirage pose les croisements PILE sur des
graduations — la spline est monotone entre deux points voisins, c'est la leçon
d'`antCibles()` —, jamais au bord (un morceau du dessous serait vide), et
jamais k = 0 : la droite serait posée SUR l'axe des abscisses, invisible, ses
marques sur les étiquettes — vu sur une capture, pas au banc.
**L'ordre des DEUX morceaux du dessous est libre**, phrases et solution
indépendamment : rien à l'écran ne dit si la première phrase décrit le morceau
de gauche ou celui de droite. Chaque groupe de quatre cases se juge sur le
morceau qu'il décrit le MIEUX, et les deux ne peuvent pas décrire le même —
la règle des paires, transposée aux groupes. Le contrôle MESURE les quatre
dessins contre les graduations du dessin même (aucune coordonnée recopiée),
exige la même courbe noire sur les quatre, puis CLIQUE « Vérifier » — la leçon
des sommes : les contrôles lisaient le verdict, l'élève regarde la couleur.
Éprouvé en le cassant onze fois : l'ordre non mélangé, l'ordre re-tiré à chaque
question, le croisement au bord, la réponse rangée dans la question, les
marques inversées, le morceau rouge décalé, la case vide rougie, l'ordre des
morceaux imposé, la case qui accepte l'un OU l'autre morceau, les bouts de la
courbe sans leurs points, la droite sur l'axe — chacun rougit en nommant son
défaut. Un défaut de mise en page ne s'est vu que sur une capture : dans la
colonne de 560 px des intervalles, « il faut [le prendre] » se repliait sous sa
phrase — les lignes de cet écran sont élargies.

**Et son rappel de cours MONTRE les quatre dessins** (demande de Turquet, août
2026) : la méthode est visuelle, la décrire en mots ne suffisait pas. Les
dessins sont ceux de l'EXERCICE — `lvGraphSVG` et `ingRouge`, les mêmes
fonctions, sur UN exemple fixe (`RAP_ING_EX`) — et chaque légende écrit sa
solution par `ingPlain()`, la fonction même qui l'écrit dans la correction :
une légende ne peut pas contredire son dessin, et le contrôle le vérifie quand
même — il lit le signe DANS la légende et exige que le dessin le dise aussi,
morceaux et marques. Illustrer le rappel illustre les TROIS aides d'un coup :
le bouton « Rappel de cours », le conseil du soutien (« Voir le rappel ») et la
fenêtre « Question à l'IA » (« Faire un rappel de cours ») affichent tous
`rappelHTML()`, et la fenêtre détachée reçoit les styles par `garnirFenetre()`.
**Deux pièges de banc s'y sont montrés.** Le contrôle des numéros en dur lisait
la chaîne BRUTE des rappels : les coordonnées de tracé du dessin (« 70.4 »)
sont devenues autant de faux numéros — le piège documenté des décimales
d'illustration, revenu par le rappel. Il lit maintenant le texte balises
retirées — remplacées par une ESPACE, parce que le premier essai (textContent)
collait deux paragraphes voisins et fabriquait « 1.2 » avec la fin de « n+1. »
et le début de « 2. Remplacer », dans un rappel de la Terminale que personne
n'avait touché. Un numéro écrit dans le texte reste attrapé, sabotage à
l'appui. Et le banc navigateur mesure les dessins RENDUS — quatre figures à
taille lisible, six morceaux rouges d'étendue non nulle — parce qu'un CSS
perdu les rendrait minuscules sans qu'aucune erreur ne se lève ; un rappel à
dessins ajouté demain est couvert sans rien déclarer.

**Deux courbes sur un dessin, et quatre questions qui se répondent.**
{equation-graphique} (Seconde, 2.5, demande de Turquet, août 2026 — « au moins
10 dessins possibles ») est repris de la fiche « équation et inéquation » : la
courbe de f en trait plein, la droite de g en POINTILLÉS, et quatre questions
dans l'ordre de la fiche sur le MÊME tirage conservé — lire f(a) et g(b),
résoudre f(x) = k, résoudre f(x) = g(x), puis f(x) signe g(x) écrit en
intervalle. Les croisements de la question 3 SONT les bornes de la question 4 :
c'est la progression de la fiche. Tout le dessin est celui de
{lecture-variations} ; les solutions à deux nombres suivent la règle des paires
d'{antecedent-nombre} (ordre libre, le doublon défendable une fois) ; l'union
de l'inéquation suit la règle des deux morceaux d'{inequation-graphique}
(jugés au mieux, bords ±3 toujours pris) ; la sauvegarde ne part que sur un
GESTE de l'élève — programmée au rendu, elle fusait à vide dans le contrôle du
signalement, qui l'a vue.
**Le risque propre est le croisement illisible, et il a changé de nature** :
f moins une droite PENCHÉE n'est pas monotone entre deux graduations — la
garantie d'antCibles ne suffit plus seule. Ce qui la remplace est la MARGE :
à toute graduation qui n'est pas un croisement, f est à au moins 1 de la
droite, du côté annoncé. Un échantillonnage de la courbe rendue posé en
garde-fou dans le tirage n'a jamais rien écarté (0 sur 2000) — le quatrième
garde-fou mort du projet, retiré ; c'est le CONTRÔLE qui exige la propriété,
en relisant les courbes de Bézier que lvPath écrit, tirage après tirage.
**Et ce contrôle a pris le tirage en défaut à sa première exécution** : deux
solutions de f(x) = k sur des graduations VOISINES font un segment de spline
CONSTANT à la hauteur k — valeurs égales, tangentes nulles — et la vraie
solution est un intervalle entier, pas deux nombres : l'énoncé mentait avant
que l'élève ne commence. Le tirage les écarte, et le bord est tenu en DISCRET
(l'écart des deux solutions), pas par une mesure : mesurée, la proximité à k
criait sur les SOMMETS, où la courbe plate reste proche sans retraverser — un
contrôle qui parle d'autre chose. Éprouvé en le cassant treize fois : le
croisement au bord, f du mauvais côté, le tirage re-tiré, la réponse dans la
question, k traversé, les solutions voisines, les dessins figés, l'ordre
imposé, le doublon compté deux fois, la méthode montrée avant la
vérification, g(b) hors du dessin, le signe figé, le bord 3 lâché — chacun
rougit en nommant son défaut.

**Puis le 2.5 a gagné g(x) = k et ses quatre dessins par question** (demande
de Turquet, août 2026) : CINQ questions désormais — lire f(a) et g(b),
f(x) = k, g(x) = k, f(x) = g(x), f(x) signe g(x) — et chaque question
d'équation ou d'inéquation fait d'abord CHOISIR le bon dessin parmi quatre,
comme au 2.7 et au 2.4 ; seule la lecture d'images garde le dessin nu et son
trait de méthode. Les formes d'équation sont celles du 2.7 (bon, un point
OUBLIÉ, un point EN TROP) plus le piège propre à DEUX courbes : la
CONFUSION — pour f(x) = k, les points posés aux croisements de f et g ; pour
g(x) = k, le point lu sur la COURBE au lieu de la droite ; pour f(x) = g(x),
la ligne horizontale de f(x) = k avec ses points. Chaque confusion est
l'erreur réelle de l'élève qui mélange les questions, et chacune se DESSINE
sans nouvelle contrainte lourde : les croisements et les solutions sont déjà
sur des graduations. Deux gardes de tirage l'accompagnent — la hauteur kg
est PRISE SUR LA DROITE (g(xg) pour un xg entier intérieur hors croisements,
donc la solution se lit, et « lu sur f » reste à au moins 1 de la ligne par
la marge du tirage) et aucun croisement de f et g ne tombe à la hauteur k,
sans quoi le piège « croisements » se confondrait avec le bon dessin.
L'inéquation propose les quatre coloriages du 2.4 (permI), les trois
équations partagent permE — tirés une fois par séance, conservés, à forme
égale le rang varie. g(x) = k n'a qu'UNE solution — une droite ne croise la
ligne qu'une fois, et l'énoncé le dit — d'où sa forme « oubli » : la ligne
sans aucun point. La bonne carte CHOISIE est bleue, la bonne MONTRÉE est
verte (en soutien, seulement une fois tout juste) ; le choix du dessin
compte une case dans la note. Éprouvé en le cassant neuf fois de plus —
g(x) = k retiré, la réponse rangée dans la question, kg pris n'importe où,
le piège rendu invisible, les dessins non mélangés, la carte qui ne compte
plus, la bonne carte qui ne se montre plus, le tirage re-tiré, la ligne
horizontale sur toutes les cartes — chacun rougit en nommant son défaut.

**Puis les antécédents et les inéquations à k, et le 2.5 est devenu la fiche
entière : HUIT questions** (demande de Turquet, août 2026) — images,
antécédents de ka par f ET par g, f(x) = k puis f(x) signe k, g(x) = kg puis
g(x) signe kg, f(x) = g(x), f(x) signe g(x) : chaque équation est SUIVIE de
son inéquation à la même hauteur (la progression du 2.7), et chacune fait
choisir le bon dessin parmi quatre. Les antécédents ont leurs quatre cartes
sur permE (l'oubli est le point de G — l'élève qui ne regarde que f) ;
f(x) signe k partage permI avec f(x) signe g(x) (les mêmes quatre
coloriages, contre la ligne au lieu de la droite) ; g(x) signe kg a gagné
permG — quatre demi-droites, côté × marque — parce qu'une droite ne croise
la ligne qu'une fois : sa solution est TOUT UN CÔTÉ de xg, un seul
intervalle, jamais d'union. Deux leçons de tirage payées comptant :
**les solutions de f(x) = k sont INTÉRIEURES désormais** — l'union
« [−3 ; x1] ∪ [x2 ; 3] » de la nouvelle inéquation mentirait si une solution
tombait au bord, et le repli qui venait d'être figé avait exactement ce
défaut ; et **la hauteur des antécédents accepte UN antécédent par f** (un
sommet) — exiger deux hauteurs à deux solutions rendait le tirage exsangue
(0,03 % d'essais viables, le repli sortait une séance sur trois, mesuré
deux fois), quand le singulier est un visage que {lecture-deux-courbes}
cultive déjà ; on préfère deux quand la courbe les offre, et le contrôle
exige que les deux visages sortent. ka se choisit AVANT k — choisir k
d'abord volait la seule hauteur lisible sur g. Le tirage fait 4 000 essais
(un sur ~400 est viable), et les DEUX tirages épinglés du contrôle — le
repli au pluriel, un second au singulier — passent par les mêmes gardes que
le tirage. Éprouvé par les sabotages nommés du contrôle réécrit.

**Deux courbes, chacune sur SON domaine — et le garde-fou d'échantillonnage
est VIVANT cette fois.** {lecture-deux-courbes} (Seconde, 2.6, demande de
Turquet, août 2026) est repris de la fiche « images et antécédents avec f et
g » : f en trait plein et g en POINTILLÉS — une vraie courbe, plus une
droite —, chacune sur son propre domaine (les bouts sont marqués d'un point :
sans domaines distincts, la question des domaines n'enseignerait rien), et
SEPT questions dans l'ordre de la fiche sur le MÊME tirage conservé : les
domaines, quatre images, les antécédents de k par f ET par g, f(x) = k et
g(x) = k, f(x) signe k, f(x) = g(x), f(x) signe g(x). `lvGraphSVG` a
seulement appris le morceau (ia, ib), comme `lvPath` l'avait appris — et
l'étiquette Cf suit le début du morceau.
**Le risque propre a changé de nature : spline contre SPLINE.** La garantie
de la droite penchée du 2.5 ne tient plus — deux splines monotones entre deux
graduations peuvent se refrôler même écartées de 1 aux deux bouts. Le tirage
échantillonne donc l'écart des deux cubiques de Hermite (`ifgSpline`, les
mêmes que `lvPath` écrit en Bézier) et rejette la séance qui frôle : mesuré à
**16 rejets sur 316** — le garde-fou est VIVANT, contrairement à celui du
2.5, mort à 0 sur 2000 et retiré. Le contrôle relit en plus les Bézier
réellement écrites, tirage après tirage.
**Le palier est un piège de PLUS, aux antécédents comme aux équations.** La
leçon des « solutions voisines » du 2.5 vaut pour TOUTE hauteur interrogée,
sur f comme sur g : deux antécédents voisins seraient un segment entier posé
à cette hauteur, et l'énoncé mentirait. g n'a jamais de palier (ses pas sont
non nuls) ; f, si — le tirage écarte la hauteur, et c'est le REPLI de secours
qui l'a montré : le premier repli proposé par le tirage portait un palier de
f à la hauteur k1, invisible aux contrôles d'alors, qui partageaient l'angle
mort. Un repli s'éprouve par les mêmes contrôles que le tirage.
**Les bornes d'une union ne sont plus jamais −3 et 3 d'office** : pour
f(x) signe k ce sont les bouts du domaine de f, pour f(x) signe g(x) les
bouts du domaine COMMUN — on ne compare f et g que là où les deux existent,
et c'est une leçon de la fiche elle-même. Les antécédents demandent f ET g
sur la même hauteur, avec les deux visages dans la même question (un
singulier d'un côté, un pluriel de l'autre) ; les listes suivent la règle des
paires, l'union se juge au mieux, et les cases suivent la convention commune
(`corrChoix`, `msgAvecVides`). Éprouvé en le cassant dix fois — l'ordre de la
fiche perdu, le tirage re-tiré, la réponse rangée dans la question, le
croisement au bord, l'échantillonnage débranché (le frôlement se voit alors
sur les Bézier), l'alternance des côtés cassée, le doublon compté deux fois,
la méthode montrée avant la vérification, les deux visages lâchés, le palier
autorisé, les bornes redevenues −3 et 3 — chacun rougit en nommant son
défaut. Et un FAUX sabotage s'est montré : passer la marge de 1 à 0,5 ne
change rien, les valeurs étant entières — un écart nul EST un croisement, la
marge aux graduations est tenue par le compte des croisements.

**Deux bleus ne font pas deux courbes.** Signalé par Turquet (août 2026) sur
le 2.5 et le 2.6 : « on a du mal quelquefois à savoir quelle est la courbe f
et quelle est la courbe g ». f était en bleu vif et g en bleu ardoise
(#4a5a80) — deux bleus, que seuls les pointillés et de petites étiquettes
séparaient, illisibles surtout sur les petites cartes des propositions. g est
passée à l'ORANGE de {croiser-denominateurs} (#C2410C), choisi jadis pour ne
pas se confondre avec les verdicts ni avec le bleu pour un daltonien ;
l'étiquette Cg est grandie, et une LÉGENDE s'affiche sous le titre des deux
exercices — cartes comprises, puisqu'elle vit au niveau de l'écran. Ses
échantillons sont dessinés avec les CLASSES mêmes des courbes (`lv-curve`,
`eqg-g`) : une légende à couleurs propres pourrait contredire le dessin le
jour où l'une des deux change. Et la couleur ne porte jamais seule : les
pointillés restent, et la légende dit « trait plein / pointillés » avec des
mots. Un contrôle tient les trois bords — dominantes OPPOSÉES des deux encres
(étiquette Cg et bouts de g compris), légende sur les deux exercices,
échantillons par les classes — éprouvé par cinq sabotages nommés.

**Résoudre, c'est d'abord choisir le dessin — équations et inéquations sur
les mêmes quatre cartes.** {resolutions-graphiques} (Seconde, 2.7, demande de
Turquet, août 2026) est repris de la fiche « Exercice 2 » : UNE courbe, deux
droites horizontales à tracer, et quatre questions sur le MÊME tirage
conservé — équation puis inéquation à chaque hauteur, la plus basse d'abord
(l'ordre de la fiche : f(x) = −3 avant f(x) = 0). Pour chaque question,
QUATRE dessins proposés (demande de Turquet). Une INÉQUATION propose les
quatre coloriages d'{inequation-graphique} — milieu/extérieur × pris/exclu —
généralisés au CÔTÉ réel de f entre les croisements (`eigSide`) : la courbe
n'est plus la cloche du 2.4. Une ÉQUATION propose la ligne horizontale et ses
points, et les quatre dessins ne diffèrent que par ce qui fait l'erreur : le
bon, la ligne à l'AUTRE hauteur avec SES points, un point OUBLIÉ, un point EN
TROP posé sur la ligne là où la courbe ne passe pas — la règle
d'{intervalles-inegalite}, transposée. Puis les phrases : les abscisses des
points (« dans l'ordre que tu veux » — la règle des paires, le doublon
défendable une fois) et S = { … ; … } aux ACCOLADES écrites par la page —
quelques nombres, pas un intervalle ; l'inéquation garde les phrases et
l'intervalle du 2.4. k = 0 est AUTORISÉ, la fiche l'exige (f(x) = 0) : la
droite bleue se pose SUR l'axe noir et doit s'y voir — jugé sur capture.
**Le risque propre est la TANGENCE, et il a été trouvé en relisant le tirage
AVANT le premier contrôle** : une hauteur qui TOUCHE la courbe en un
extremum sans la traverser a bien deux « solutions », mais l'inéquation n'a
alors AUCUN des quatre dessins — le côté extérieur n'est plus l'opposé du
milieu, et l'énoncé mentirait. Le tirage exige donc que chaque solution soit
un vrai CROISEMENT (les voisins de part et d'autre de la hauteur), en plus
des bords déjà connus — jamais traversée entre deux graduations, jamais au
bord. **Et ce filtre a tué un garde-fou en naissant** — le sixième du
projet : « écart ≥ 2 entre les solutions » (le palier du 2.5) n'écartait
plus rien, un voisin ÉGAL à la hauteur donnant un produit NUL, jamais
négatif — le sabotage l'a montré en restant vert, le garde-fou est retiré et
c'est le contrôle qui exige la propriété sur le tirage. Les deux ordres des
cartes (`permE`, `permI`) sont tirés une fois par séance et conservés ; à
forme égale le rang varie.
La bonne réponse n'est jamais rangée à côté de la question — elle ne porte
que la courbe, les deux hauteurs, les deux signes, les deux abscisses du
point en trop et les deux ordres, le contrôle refuse tout autre champ — et le
REPLI du tirage est éprouvé par les mêmes contrôles que le tirage (la leçon
d'IFG_FB), validateur indépendant à l'appui : 400 tirages, 0 recours au
repli. Éprouvé en le cassant dix fois — la tangence autorisée, le garde-fou
mort ci-dessus, le tirage re-tiré, la réponse dans la question, les dessins
non mélangés, l'ordre des abscisses imposé, le doublon compté deux fois, la
case vide rougie, la bonne carte qui ne se montre plus, le soutien qui peint
le vide — chacun rougit en nommant son défaut, sauf celui du garde-fou mort,
dont le vert disait vrai.

**Le tableau de signes s'apprend en trois marches, sur UNE courbe conservée.**
{lecture-signes} (Seconde, demande de Turquet, septembre 2026 — « un exercice
comme le 2.1 mais pour les tableaux de signes ») vient juste AVANT
{tableau-signes-graphique} : le cycle du 2.1 — une courbe gardée, des
questions qui montent — transposé au signe : a) résoudre f(x) = 0, b) dire le
signe de f sur chaque intervalle, c) construire le tableau ENTIER, racines et
zéros compris.
**Tout est repris, rien n'est recopié** : le tirage est celui du 2.8
(`tsgGen` — racines lisibles garanties, le contrôle les recompte par sa
propre arithmétique), le dessin et les peintures ceux du 2.1 (`lvGraphSVG`,
`lvMarkFields`), le tableau les classes du 2.8. La question ne porte que la
courbe et la partie (`pts, part, gnum, gtot`) : `tsgSols`/`tsgSide` — les
fonctions mêmes qui corrigent le 2.8 — recalculent tout, et le contrôle
refuse tout autre champ.
**Deux différences avec le 2.8, chacune voulue** : la courbe est NUE — le 2.8
peint le dessus en rouge et le dessous en bleu pour ENSEIGNER la
correspondance, ici on la fait LIRE sans aide ; et le tableau ne donne RIEN —
les racines s'écrivent, et les CINQ cases de la ligne du signe offrent toutes
+, − et 0 : savoir que le 0 va sous une racine EST évalué, des cases qui ne
l'offriraient que sous les racines révéleraient la réponse.
**Les racines se jugent DEUX fois, sous DEUX règles, et c'est le cœur** :
dans S = { … ; … } l'ordre est LIBRE (la règle des paires, le doublon
défendable une fois) ; dans le tableau elles sont À LEUR PLACE, la plus
petite à gauche — un tableau se lit de gauche à droite, l'ordre en fait
partie, et les racines échangées sont fausses toutes les deux.
**Les deux visages (+ − + et − + −) sortent dès que la séance a deux
graphiques** ; le soutien n'en a qu'un, rien à équilibrer — le motif du 2.8.
Et la famille `.lv-sel` a gagné sa règle `.sol` EN NAISSANT — la leçon des
familles de listes, tenue avant le signalement cette fois : la règle posée
répare du même coup la partie b du 2.1, dont `lvMarkFields` remplissait les
listes vides en bleu invisible depuis toujours. Dix sabotages, chacun
rougissant en nommant son défaut.

**Le tableau de signes se lit sur une courbe à deux encres.**
{tableau-signes-graphique} (Seconde, 2.8, demande de Turquet, août 2026) : une
courbe du style de {resolutions-graphiques}, la partie AU-DESSUS de l'axe en
ROUGE (f(x) > 0), EN DESSOUS en BLEU (f(x) < 0). L'élève complète les deux
phrases couleur/signe, place les signes dans un tableau « comme en
Terminale » — SEULS les signes se placent, les racines et les zéros sont
donnés — puis résout f(x) = 0 (S = { … ; … }), f(x) > 0 et f(x) < 0. Cinq
questions, chacune son tirage.
**Tout est repris, rien n'est recopié** : la courbe est celle de
{lecture-variations} (`lvGraphSVG`, `lvPath` par morceaux — les deux encres
sont deux morceaux posés par-dessus, à la même épaisseur, découpés aux
racines) ; le filtre du tirage est celui du 2.7 posé à la hauteur zéro
(exactement deux racines intérieures, chacune un vrai CROISEMENT — la
tangence et les racines voisines mentiraient —, zéro jamais traversé entre
deux graduations) ; les cases sont les sélecteurs de la famille `.itv-sel`
(`corrChoix`, `msgAvecVides`), S = { ; } suit la règle des paires, et l'union
de l'inéquation est jugée au MIEUX, ses deux intervalles à ordre libre.
**Les inégalités sont STRICTES, et les crochets le disent** : les racines
sont EXCLUES (crochet ouvert), les bords du domaine (−3 et 3), où f n'est
jamais nulle, sont toujours pris. **Les DEUX visages sortent dans chaque
séance** (+ − + et − + −) — sans quoi l'élève apprendrait que le tableau est
toujours le même ; la sonde a mesuré le tirage (12,7 % des courbes brutes
passent le filtre — le repli, RÉEL et relevé sur le générateur, ne sert à
peu près jamais) et les côtés sortent moitié-moitié. La question ne porte
QUE la courbe (`pts`) : le contrôle refuse tout autre champ.
**Le piège s'est montré sur la capture, pas au banc : « bleu » écrit en
ROUGE.** La règle `.mp-instr b{color:var(--red)}` peint tous les gras d'un
énoncé en rouge — le mot « bleu » de l'énoncé s'écrivait donc à l'encre
rouge, dans l'exercice même qui enseigne la correspondance couleur↔signe.
**Et il vivait un mot plus loin**, ce que la seconde capture a montré :
« en dessous » restait en gras, donc en ROUGE, juste avant « en bleu ».
Les QUATRE mots portent LEUR encre (`.tsg-mot-rouge`, `.tsg-mot-bleu` — la
leçon de la phrase des couleurs du 6.3), aucun `<b>` ne subsiste dans cet
énoncé, et le contrôle exige les trois choses : les mots présents, les
dominantes opposées lues dans la feuille de styles (le motif du 2.6), et
aucun gras restant — sans quoi le prochain mot ajouté repasserait en rouge
sans que rien ne le dise. Douze sabotages, chacun rougissant en nommant son
défaut — dont la copie juste qui ne vaut plus 21, le doublon compté deux
fois, l'union à ordre imposé, la peinture échangée (rouge en dessous), et
chacun des deux mots revenu au gras ordinaire.
**Et DEUX défauts de mise en page ne se sont vus que sur la capture**, tous
deux hérités d'un conteneur emprunté :
· le dessin était posé dans la grille des QUATRE propositions
  (`.ing-cartes`) alors qu'il est SEUL et sert de support de lecture : il
  s'affichait au quart de la largeur (280 px), graduations illisibles. Il vit
  dans le cadre de {lecture-variations} (`.lv-graph`, fond opaque — la leçon
  de {construire-fonction}), et il a fallu `width:100%` en plus de la
  `max-width` : dans une colonne flex, un enfant prend sa largeur
  INTRINSÈQUE, exactement l'`align-self:stretch` du 1.6 — 280 px sont
  devenus 600. Le contrôle tient la STRUCTURE (le dessin dans le cadre de
  lecture, jamais dans la grille des cartes) ;
· l'union à huit cases se REPLIAIT dans la colonne de 560 px des
  intervalles, et une solution coupée en deux se lit comme deux solutions
  (`#scr-tsg .itv-ligne{max-width:1160px}`, comme le 2.4, le 2.5 et le 2.7).
  **Le contrôle universel « aucune rangée ne se replie » ne l'a pas vu** : il
  ne mesure que les rangées `.pt-row` des exercices déclarés dans
  `pleineLargeur`, jamais la famille `.itv-ligne` — la règle est universelle,
  son contrôle ne l'est pas encore. Le dire vaut mieux que le taire.

**Les deux tableaux d'une même courbe, complétés DIRECTEMENT.**
{signes-variations} (Seconde, demande de Turquet, septembre 2026 — « un
exercice avec un dessin comme le 2.11 ou le 2.1 qui demande directement de
compléter un tableau de signes et un tableau de variation sur la même
page ») suit {tableau-signes-graphique} au menu : la synthèse, quand les
deux tableaux ont été appris — plus de marches, une courbe nue, et les DEUX
tableaux d'un coup sur le même écran.
**Une seule courbe sert les deux tableaux, et c'est le tirage qui le
permet** : `tsgGen()` garantit les racines lisibles (le filtre du 2.8), et
`lvGenPts` ne produit JAMAIS de palier — ses segments sont strictement
monotones par construction —, donc le tableau de variation a toujours un
sens à dire. Le contrôle refait les DEUX propriétés par sa propre
arithmétique sur chaque tirage, plutôt que de les supposer.
**Tout est repris, rien n'est recopié** : le tableau de signes est celui de
{lecture-signes} (jugé par `tsgSols`/`tsgSide`), le tableau de variation
celui du 2.1 (jugé par `lvAnalyze`), et la GÉOMÉTRIE des flèches est
désormais partagée — `varArrowsCore(a, préfixe)`, extraite de
`lvArrowChange` : deux copies auraient fini par diverger, et les deux
tableaux se seraient dessinés différemment sous les yeux de l'élève. Le
contrôle tient le bord du refactor : la même géométrie doit encore servir
le 2.1, flèche dessinée et valeur qui la suit.
**Toutes les abscisses sont À LEUR PLACE** — les racines du tableau de
signes comme les changements de sens du tableau de variation : un tableau
se lit de gauche à droite, l'ordre en fait partie, et les racines échangées
sont fausses toutes les deux. Chaque case se juge SEULE : une flèche fausse
coûte exactement son point. Les deux visages du signe sortent dès que la
séance a deux graphiques (le motif du 2.11) ; le soutien n'en a qu'un. Une
séance = deux pages (13 à 16 cases chacune). Dix sabotages, chacun
rougissant en nommant son défaut — et le premier essai du contrôle a rougi
sur du code JUSTE (la valeur du départ d'une flèche ↘ monte en HAUT de la
case) : un essai faux se reconnaît à ce qu'il rougit sur une page juste.

**Le tableau de variation du 2.1, complété directement — et la case ↗/↘
posée SUR la flèche.** {tableau-variation} (Seconde, demande de Turquet,
septembre 2026 — « compléter directement un tableau de variation en utilisant
des dessins de l'exercice 2.1 et en présentant le tableau de variation comme
dans le 2.1 ») suit {lecture-variations} au menu : son c) sans les marches.
**« Présenté comme dans le 2.1 » est tenu par une FONCTION, pas par une
promesse** : le tableau est rendu par `varTableHTML(a, préfixe, onchange)` et
jugé par `varTableSubs(a, préfixe)`, extraites du c) du 2.1 — le 2.1, le 2.13
{signes-variations} et l'exercice neuf passent tous trois par elles (le
contrôle lit le SOURCE de la page pour l'exiger, jamais `String(renderLV)` :
les rendus sont ENVELOPPÉS par la greffe des jetons, et la chaîne d'une
enveloppe parle d'autre chose — le premier jet du contrôle s'y est pris). La
correction écrite est `lvCorrectionHTML` — la fonction même du 2.1, sa branche
« tableau ». Le tirage est `lvGenPts`, le générateur MÊME du 2.1 ; les DEUX
formes du tableau (un ou deux changements de sens) sortent dans chaque séance
d'entraînement, en ordre mélangé, et le soutien garde la forme simple (k=2),
comme le 2.1.
**Et la case ↗/↘ est posée SUR la flèche bleue, à son milieu** (demande de
Turquet, septembre 2026 : « comme en terminale avec l'exercice 5.5, pas en
dessous comme actuellement ») : la convention d'`efArrowSel` — `top` au milieu
de la bande, le halo `box-shadow` qui détache la case du trait — portée par
`varTableHTML`, donc aux TROIS tableaux d'un coup ; la bande des flèches
prend la hauteur de la Terminale (22..98, constantes partagées `VT_*` entre
la géométrie et le tableau), et la consigne du 2.1 disait déjà « au milieu de
chaque flèche » — l'écran dit enfin ce que la consigne promettait. Le
contrôle MESURE contre la page même : le `top` de la case doit être le milieu
des deux extrémités que prennent les valeurs, sur l'exercice neuf ET sur le
2.1 rendu — aucune coordonnée recopiée. Onze sabotages, chacun rougissant en
nommant son défaut — la flèche jugée à l'envers dans `varTableSubs` rougit
chez {signes-variations} ET ici, la preuve que la fonction est bien partagée ;
la mesure de la flèche s'est prise en défaut avant la page : elle passait par
une pose qui SOUMET, et la correction remplissait les flèches avant la mesure.

**Les deux tableaux sur la GRANDE grille : −6..6 en abscisse et en
ordonnée.** {signes-variations-grand} (Seconde, demande de Turquet, septembre
2026 — « un exercice avec des dessins qui vont de -6 a 6 en abscisse et
ordonnée qui demande de faire un tableau de signe et de variation comme les
autres exercices ») suit {signes-variations} au menu : le même exercice, sur
le grand dessin d'{antecedents-droite} — 13 graduations dans les deux sens.
**Tout est repris, rien n'est recopié, et chaque moitié vient de son
exercice** : le tirage est `adrGenPts()` — le générateur MÊME
d'{antecedents-droite}, segments strictement monotones, jamais de palier —
FILTRÉ à la discipline du 2.8 portée à l'échelle 13 (`gsvOkPts` : exactement
deux racines intérieures, chacune un vrai croisement, zéro jamais traversé
entre deux graduations — sonde relevée : 9,1 % des tirages bruts passent,
pire cas 53 essais, le repli RÉEL relevé sur le générateur ne sert à peu
près jamais et passe par les gardes mêmes, LUS dans la source par le
contrôle). Le dessin est `adrSVG()`, la fonction même, appelée NUE (pas de
droite, pas de points — le contrôle mesure la grille 13×13 rendue ET
l'absence de `.adr-niv`). Le tableau de variation est rendu et jugé par
`varTableHTML`/`varTableSubs` — les fonctions mêmes du 2.1, entièrement
génériques sur l'objet d'analyse — sur `gsvAnalyze`, l'analyse à l'échelle
13 : `lvAnalyze` est figée sur 7 graduations et comparée au caractère près
avec la Terminale, la leçon d'{antecedents-droite}, donc l'échelle 13 vit
dans le seul bloc gsv. Le tableau de signes est celui de {signes-variations},
aux ids près, bornes −∞/+∞ comprises.
Les racines et les abscisses sont À LEUR PLACE, chaque case se juge SEULE,
les deux visages du signe sortent dès deux graphiques, la case vide ne
rougit jamais — les règles de la famille, tenues par le contrôle dédié ET
par les contrôles universels, qui ont couvert l'exercice au premier passage
sans rien déclarer. Le rappel est RAP_LSV sous sa propre clé (le précédent
`ord:RAP_PLC`) : même leçon, pas même identité. Douze sabotages, chacun
rougissant en nommant son défaut — la flèche jugée à l'envers dans
`varTableSubs` rougit chez {signes-variations}, {tableau-variation} ET ici,
la preuve que la fonction est partagée trois fois.

**Puis les TROIS formes du tableau de variation, chacune UNE fois par
séance.** Demande de Turquet (septembre 2026) : « dans l'exercice 2.15 je
veux avoir 3 variations différentes ». La sonde a d'abord MESURÉ ce que le
tirage donnait : filtré par `gsvOkPts`, `adrGenPts` sortait la forme simple —
un seul changement de sens — 84 fois sur 100, et les formes à deux et trois
changements 8 fois chacune. À deux graphiques par séance, l'élève voyait donc
presque toujours deux fois le même tableau, et n'apprenait qu'une seule
taille de tableau. Une séance d'entraînement pose maintenant TROIS
graphiques, un par forme (2, 3 et 4 segments), en ordre mélangé — le motif
du 2.2 (« les DEUX formes… en ordre mélangé ») porté à trois ; le soutien
garde un graphique, forme au hasard, comme avant.
**La forme s'IMPOSE au générateur plutôt que de se trier après coup** :
`adrGenPts` a gagné un paramètre facultatif, le nombre de segments, et
appelé sans argument — le cas d'{antecedents-droite} — il ne change pas
d'une ligne ; `gsvGen(nseg)` le lui passe. Trier des tirages libres jusqu'à
tomber sur la forme rare aurait fait la même chose en plus lent, sans le
dire. Mesuré, forme imposée : 400 séances sur 400 aboutissent pour chaque
forme, pire cas 474 essais (trois segments : 1,4 % des tirages bruts) — à
2000 essais le repli ne sert à peu près jamais.
**Et le repli est UN PAR FORME** (`GSV_REPLI`), chacun RÉEL, relevé sur le
générateur : un repli unique aurait rendu la forme simple à une séance qui
en demandait trois, sans que rien ne le dise. L'équilibre des deux visages
du signe retire À FORME ÉGALE — sans quoi il déferait l'équilibre des
formes, et le sabotage l'a montré (2,2,4).
Le contrôle tient chaque bord : trois questions, les trois formes chacune
une fois sur 100 séances, la forme simple qui change de rang, les deux
visages toujours, un devoir coupé à deux graphiques à deux formes
distinctes, chaque repli passé par les gardes ET par sa forme, `gsvGen` qui
lit `GSV_REPLI`, le générateur mis à sec qui rend encore la forme demandée —
et le DÉMARREUR lui-même, trois graphiques en entraînement et un en soutien :
le contrôle du tirage seul n'aurait pas vu un `startGSV` revenu à deux. Sept
sabotages, chacun rougissant en nommant son défaut.
**Et un défaut de mise en page ne s'est vu que sur la capture, le jour où la
forme rare a cessé de l'être** : le tableau à quatre segments (5 valeurs,
4 flèches) fait 617 px, et la carte du 2.15 en faisait 600 — dans son
`.lv-tblwrap` à `overflow-x:auto`, la borne 6 et la dernière case se
cachaient derrière un défilement que rien ne signalait. À 8 séances sur 100
personne ne l'avait vu ; à toutes les séances il se voyait tout de suite.
La carte de ce seul écran passe à 700 px (`#scr-gsv .lv-card`) : le 2.14
n'est pas concerné, son tableau le plus large fait 487 px. Le banc
NAVIGATEUR tient ce bord (« 6 quater ter », déclaré par `grandsTableaux`
dans `tests/profils.js`) : trois graphiques par séance, les trois formes
comptées sur les flèches RENDUES — jamais sur le tirage —, et chaque tableau
mesuré contre son cadre, ni caché derrière le défilement ni sorti de la
carte. jsdom n'a pas de mise en page : seul un navigateur sait où un
tableau déborde — la règle retirée, il rougit en nommant l'écart
(« graphique 1, tableau 2 : 617 px dans 546 ») pendant que le banc jsdom
reste vert à bon droit.

**Choisir le BON tableau parmi quatre, puis parmi cinq — le QCM de la
grande courbe.**
{choisir-tableau-variation} (Seconde, demande de Turquet, septembre 2026 —
« une courbe entre −6 à 6 avec 2 ; 3 ; 4 variations possibles, proposer 4
tableaux de variations différents et l'élève doit choisir le bon tableau »)
suit {tableau-vrai-faux} au menu — le dernier des exercices sur
tableau de la grande grille : c'est le motif de
{variations-depuis-derivee} de la Terminale, transposé à la lecture DIRECTE
de la courbe.
**Tout est repris, rien n'est recopié** : le tirage est `adrGenPts()` — le
générateur même du grand dessin, qui produit DÉJÀ 2, 3 ou 4 segments
monotones — filtré par NOMBRE de segments (sonde : 24 % / 51 % / 25 %, pire
cas 18 essais — le repli, RÉEL et relevé sur le générateur, un par visage,
ne sert jamais et repasse par les gardes du contrôle) ; la table vraie est
lue par `gsvAnalyze()`, la fonction qui corrige le 2.15 — un énoncé ne peut
pas contredire sa correction ; le dessin est `adrSVG()` appelée nue ; les
flèches des tableaux sont dessinées par `lvArrowSVG()` sur la
géométrie `VT_*` du 2.1 — les propositions ont le visage du tableau que
l'élève connaît.
**Les tableaux ne diffèrent que par ce qui fait l'erreur** — la leçon
d'{intervalles-inegalite} : le vrai ; les sens INVERSÉS ; un changement de
sens DÉCALÉ d'une graduation ; le mauvais NOMBRE de variations (un
changement en plus ou en moins — le cœur de la demande : compter). Ils n'ont
d'abord porté AUCUNE valeur, comme les tableaux du QCM de la Terminale : des
valeurs auraient rendu l'inversion éliminable en lisant UN nombre, ou
incohérente avec ses propres flèches — sans lire les variations, qui sont ce
qu'on évalue. **Cette règle-là a été RENVERSÉE le mois suivant** (paragraphe
ci-dessous) : les valeurs s'écrivent, une cinquième carte en dépend, et
l'objection est tenue autrement — par la cohérence de chaque carte avec ses
propres flèches. Les mutations mutent TOUJOURS (quatre signatures deux à deux
distinctes par construction) et l'espacement ≥ 2 des tournants rend le
décalage toujours lisible : ces gardes seraient MORTS dans le tirage (sonde
0 sur 3000), c'est le CONTRÔLE qui exige les propriétés.
**Les trois visages — 2, 3 et 4 variations — sortent chacun UNE fois par
séance, en ordre mélangé**, et à visage égal le rang de la bonne varie. La
question ne porte que la courbe, l'ordre et les indices des mutations (on
range l'indice, jamais l'objet) ; le contrôle refuse tout autre champ. La
carte se choisit au CLIC comme dans la liste (le geste tablette du QCM de la
Terminale), le piège CHOISI se NOMME dans le retour, le badge porte le
LIBELLÉ (« B », jamais « 1 »), la bonne carte choisie est bleue, la bonne
MONTRÉE est verte — jamais en soutien, où l'élève corrige lui-même — et la
case vide ne rougit jamais. Quinze sabotages, chacun rougissant en nommant
son défaut.

**Puis les IMAGES se sont écrites au bout des flèches, et une CINQUIÈME carte
est née.** Demande de Turquet (septembre 2026) : « il faudrait que la valeur
des images sur les extrémités des flèches soient affichées. Ce qui permet de
différencier deux tableaux qui ont les mêmes variations aux mêmes abscisses
mais pas les mêmes images. Il faudrait que ce cas apparaisse aussi dans les
exemples donnés. » La demande porte sa propre raison : tant que les quatre
cartes se départageaient sur les seules VARIATIONS, une valeur ne servait à
rien et pouvait trahir ; dès qu'un tableau se distingue par une IMAGE, elle
devient la question. La carte `images` — les BONNES variations aux BONNES
abscisses, UNE image fausse — est le cinquième piège, et son message le
nomme : « lis la hauteur de chaque bout de flèche sur la courbe ».
**L'objection de l'ancienne règle est TENUE, pas abandonnée** : aucune carte
ne doit pouvoir s'éliminer en lisant UN nombre, donc chacune est COHÉRENTE
avec ses propres flèches — une flèche qui monte va toujours d'une valeur plus
petite à une plus grande, sur les cinq. L'INVERSE écrit les valeurs opposées
(tout a tourné, et le tableau redit exactement ses flèches à lui) ; la
DÉCALÉE garde les VRAIES valeurs — elle ne s'écarte que sur son abscisse, le
défaut même qu'elle enseigne ; celle du mauvais NOMBRE reçoit un zigzag entre
le minimum et le maximum de la courbe, dont chaque nœud est placé par
`varTopPour` — la fonction MÊME qui décide où une valeur se pose dans la
bande des flèches, si bien qu'un tableau ne peut pas écrire une valeur
ailleurs que là où son rôle la met ; et l'image fausse est tirée parmi les
valeurs qui ne contredisent NI la flèche de gauche NI celle de droite
(`vtqValsPossibles` — sonde : 21 possibilités au minimum, 32 en moyenne sur
3000 tirages, donc un garde ici n'écarterait jamais rien et c'est le contrôle
qui exige la propriété). Les trois replis ont été REPRIS sur le générateur,
chacun avec l'image qu'il fait varier, et le contrôle exige ce champ : un
repli muet là-dessus rendrait une carte `images` identique au vrai.
**Les cinq tableaux sont rendus par `varTableHTML` en mode LECTURE** — la
fonction MÊME qui rend le tableau qu'on remplit au 2.1 et celui qu'on lit au
2.17 : une proposition ne peut pas se dessiner autrement que le tableau que
l'élève connaît, valeurs comprises. Les lettres, elles, sont LOCALES
(`VTQ_LETTRES`, A à E) : `ITQ_LETTRES` sert les QCM à QUATRE cartes — le 2.4,
le 2.5, le 2.7 — et l'étendre leur aurait offert une cinquième option qui ne
désigne rien.
**Un garde-fou MORT y a été écrit, puis retiré** — le NEUVIÈME du projet :
`vtqSignature`, qui devait empêcher deux propositions identiques, n'avait
aucun appelant, et le contrôle calcule la signature LUI-MÊME (il le doit :
lire la fonction de la page et la comparer à elle-même ne prouverait rien).
Le sabotage l'a montré en restant vert, et son vert disait vrai ; la
propriété, elle, est bien tenue — le contrôle rougit dès que la carte des
images ne mute plus rien (« deux propositions identiques »).
**Et le banc NAVIGATEUR a trouvé un défaut qui vivait en ligne depuis le
premier jour** (« 6 quater octies », déclaré par `qcmTableauVariation` dans
`tests/profils.js`) : la carte de l'écran valait les 600 px de `.lv-card`, si
bien que chacune des cartes de la grille à deux colonnes n'offrait que 280 px
à un tableau qui en fait jusqu'à 617 — tout se cachait derrière le défilement
de son conteneur, sans que rien ne le signale. C'est la leçon du 2.15, au même
endroit, et jsdom ne pouvait pas la voir. Les IMAGES rendent ce défaut
coûteux : la dernière colonne cachée emporte justement la réponse qu'on fait
comparer.
**Et la cause en était le PLAFOND de 600 px, que `main` a retiré le même
jour** — « le cadre d'un exercice prend toute la largeur, comme en Première » :
les deux branches se sont donc rejointes sur la même ligne, et la résolution
est allée du côté de `main`. Aucun réglage de carte propre au 2.20 n'a
survécu : lui en donner un aurait REBRIDÉ ce que `main` venait de libérer, et
le contrôle universel du cadre l'aurait nommé. Ce qui reste de ce côté-ci est
le point de BASCULE de la grille : deux tableaux de 617 et leurs rembourrages
réclament 1288 px, donc en dessous de 1360 la grille passe à UNE colonne — un
tableau qu'on ne peut pas lire n'est pas une proposition. Le maximum de 617
n'est pas supposé : à quatre segments, le
tirage ne sait que RETIRER une variation (`nseg===4?'del'`), donc jamais plus
de cinq valeurs. Le contrôle mesure les DEUX largeurs, 1400 et 1280 px —
mesurer la seule largeur confortable laisserait le point de bascule libre de
dériver — et exige que chaque image ait une BOÎTE non nulle, jamais seulement
une balise : un CSS perdu sur `.vt-lect` les rendrait invisibles sans qu'une
erreur ne se lève, et l'exercice reviendrait à celui d'avant la demande.
Douze sabotages au banc principal et trois au navigateur, chacun rougissant
en nommant son défaut.

**Le maximum et le minimum se lisent sur un MORCEAU de courbe — et le risque
est l'extremum PARTAGÉ.** {maximum-minimum} (Seconde, demande de Turquet,
septembre 2026, repris de la fiche « LE MAXIMUM ET LE MINIMUM ») suit
{signes-variations-grand} au menu : le grand dessin d'{antecedents-droite},
UNE courbe gardée, et les cinq questions de la fiche — l'intervalle entier
[−6 ; 6], chaque moitié, puis un petit intervalle dans chacune. À chaque
fois : « le maximum de la fonction est M = … atteint pour x = … », « le
minimum … m = … atteint pour x = … », puis « un encadrement de la fonction
est … ≤ f (x) ≤ … ». Six cases par question, trente pour la séance.
**Tout est repris, rien n'est recopié** : le tirage est `adrGenPts()`, le
générateur MÊME d'{antecedents-droite} (13 valeurs entières, segments
strictement monotones), le dessin est `adrSVG()`, la fonction même, appelée
NUE — elle a seulement gagné le paramètre « dessus », la convention de
l'`extra` de `lvGraphSVG`, pour que la méthode se trace par-dessus —, et la
peinture des cases est `lvMarkFields`, la lecture `lvReadInt`, le bouton
`lvBoutonSuivant`.
**Le risque propre est SILENCIEUX** : si deux abscisses de l'intervalle
portent la même hauteur maximale, « atteint pour x = … » a DEUX réponses et
la page en compterait une fausse — une lecture juste comptée fausse, le pire
défaut du projet. Le tirage exige donc l'unicité du maximum ET du minimum sur
CHACUN des cinq intervalles, et le contrôle la recompte par sa propre
arithmétique, tirage après tirage.
**Les extremums tombent sur des graduations, et le contrôle ne le suppose
pas** : entre deux graduations la spline est monotone et les segments le sont
aussi, donc elle ne peut ni dépasser ni redescendre — le banc relit les
Bézier qu'`adrPath` écrit, converties par les GRADUATIONS lues dans le SVG
rendu (aucune coordonnée recopiée), et exige que la courbe dessinée ne monte
jamais au-dessus du maximum annoncé. Sabotage à l'appui : les tangentes
multipliées par 4 le font rougir en nommant l'écart.
**Les deux visages sortent dans chaque séance** : un petit intervalle où la
courbe est MONOTONE — les deux extremums sont aux bornes — et un où elle
TOURNE, un extremum à l'intérieur. Sans eux, l'élève apprendrait que la
réponse est toujours du même genre. Le côté qui porte le tournant est TIRÉ :
à visage égal, le rang change. Sonde : 69 % des courbes passent l'unicité des
trois grands intervalles, 67 % offrent les deux visages ; 2,0 essais en
moyenne, pire cas 11 sur 400 séances, 0 recours au repli — lequel est RÉEL,
relevé sur le générateur, et passe par les gardes mêmes du tirage (le premier,
inventé à la main, perdait les deux visages : le contrôle l'a nommé).
**L'encadrement REPREND le minimum et le maximum trouvés, et la consigne le
DIT** : sans cette phrase, « −6 ≤ f (x) ≤ 6 » serait un encadrement lui aussi
et une lecture juste serait comptée fausse — c'est ce qui rend la question
décidable, la leçon du dénominateur donné de {simplifier-barres}. Un contrôle
exige la phrase.
**La méthode est dessinée à la VALIDATION, jamais avant** : les deux bords de
l'intervalle, la bande verte entre le minimum et le maximum — l'encadrement,
dessiné — et les deux anneaux aux points où ils sont atteints. Affichée
pendant la recherche, elle donnerait les hauteurs qu'on demande de lire.
La bonne réponse n'est jamais rangée à côté de la question : elle ne porte que
la courbe et l'intervalle (le contrôle refuse tout autre champ), et `mmxAns()`
— que la correction, le message et le dessin de la méthode lisent tous — la
recalcule. Chaque case se juge SEULE, la case vide ne rougit jamais, et le
soutien peint au fil de la frappe. Dix-sept sabotages, chacun rougissant en
nommant son défaut. Le banc NAVIGATEUR (« 6 quater quater », déclaré par
`maxMin` dans `tests/profils.js`) tient les deux bords que jsdom ne voit pas :
le grand dessin rendu à une taille lisible, et « … ≤ f (x) ≤ … » d'un seul
tenant — une SPAN mesurée par le nombre de boîtes qu'elle rend, deux voulant
dire qu'elle s'est repliée et qu'une solution se lit en deux morceaux ; il
mesure aussi les deux anneaux verts contre les graduations rendues.

**Et le même exercice SANS dessin : le tableau de variation se lit.**
{maximum-minimum-tableau} (Seconde, demande de Turquet, septembre 2026 —
« comme le 2.16 mais à partir d'un tableau de variation et non d'un
graphique ») suit {maximum-minimum} au menu : mêmes questions, même écriture,
mais l'élève ne lit plus une courbe — il lit un TABLEAU DE VARIATION déjà
rempli. Quatre questions sur le même tableau : le domaine entier d'abord,
puis trois morceaux.
**Ce qu'il fait travailler est une idée, pas une lecture** : entre deux
flèches, f ne fait que monter (ou que descendre), donc les extremums d'un
morceau sont forcément parmi les valeurs ÉCRITES — sur un morceau croissant
le minimum est à gauche et le maximum à droite, et quand le morceau contient
un changement de sens, l'un des deux est ce sommet ou ce creux.
**Tout est repris, rien n'est recopié** : le tirage est `adrGenPts()`,
l'analyse `gsvAnalyze` (l'échelle 13 du 2.15), et les réponses sont données
par `mmxAns()` — la fonction MÊME qui corrige le 2.16, si bien que les deux
exercices ne peuvent pas se contredire ; l'unicité (`mmxUnique`), les visages
(`mmxInterieur`), l'écriture de l'intervalle et la peinture des cases sont
les siennes aussi.
**LE RISQUE PROPRE EST LA QUESTION ILLISIBLE, et il est silencieux** : un
tableau ne donne la valeur de f QU'AUX abscisses écrites — demander le
maximum sur [−5 ; −2] quand le tableau ne connaît que −6, −4, 1 et 6, c'est
réclamer une hauteur que rien ne dit, et l'élève ne peut que deviner. Les
bornes de chaque intervalle sont donc des abscisses DU TABLEAU, et le
contrôle recalcule ces abscisses par sa propre arithmétique plutôt que de
faire confiance à la page. L'unicité du maximum et du minimum est exigée
comme au 2.16, et les deux visages sortent dans chaque séance — un morceau
monotone, un morceau qui tourne. Sonde : 76 % (trois segments) et 67 %
(quatre) des courbes conviennent, 1,4 essai en moyenne, pire cas 5 sur 400
séances, 0 recours au repli — lequel est RÉEL, relevé sur le générateur, et
passe par les gardes mêmes (le premier, inventé à la main, plaçait une borne
hors du tableau : le contrôle l'a nommé, comme au 2.16).
**Le tableau est rendu par `varTableHTML` en mode LECTURE** — la fonction
MÊME qui rend le tableau qu'on REMPLIT au 2.1, au 2.13, au 2.14 et au
2.15 : les deux ne peuvent donc pas se dessiner différemment. La hauteur
d'une valeur dans la bande des flèches vit désormais à un seul endroit
(`varTopPour`), lu par le tableau qui se remplit comme par celui qui se lit.
**Et le BORD OPPOSÉ compte autant** : un mode lecture qui fuirait viderait
d'un coup les quatre exercices qui complètent ce tableau. Le premier jet du
contrôle demandait « au moins une case » et restait VERT sous le sabotage
qui change les VALEURS en texte — les abscisses et les flèches restaient des
cases, et il parlait d'autre chose ; pire, aucun autre banc ne le voyait,
jsdom laissant poser une valeur sur n'importe quel élément, si bien que les
copies témoins des quatre exercices continuaient de passer. Le contrôle
regarde donc la BALISE de chaque case, une par une.
**La méthode est montrée à la VALIDATION** : les deux colonnes des bornes se
soulignent en vert, et les deux valeurs cherchées prennent l'anneau vert.
Montrée pendant la recherche, elle désignerait les nombres qu'on demande de
trouver.
Dix-neuf sabotages, chacun rougissant en nommant son défaut. Un piège
d'outillage s'y est montré, jumeau de celui de l'antislash : un ACCENT GRAVE
écrit dans un commentaire du contrôle referme le template littéral de
`verifier.js` — le code évalué se coupe en son milieu, et le banc s'arrête
sur « erreur JavaScript non rattrapée » au lieu de nommer quoi que ce soit.
Le banc NAVIGATEUR (« 6 quater quinquies », déclaré par `maxMinTableau`)
tient ce que jsdom ne voit pas : le tableau rendu sans une seule case, ses
flèches tracées, ses valeurs qui montent et descendent avec elles — mesurées
sur les RECTANGLES rendus, jamais sur un « top » écrit — et le tableau qui
tient dans sa carte.

**Le RAISONNEMENT du tableau : combien de solutions, et où f est au-dessus.**
{tableau-equations} (Seconde, demande de Turquet, septembre 2026, repris de
la fiche « raisonnement tableau de variation », Exercice 8) suit
{maximum-minimum-tableau} au menu : un tableau de variation, et rien
d'autre — 1) à 4) « L'équation f(x) = k a combien de solutions ? », 5) et 6)
« On donne f(−5) = 0 et f(2) = 0. Résoudre f(x) ≥ 0. S = … ». Une séance =
TROIS questions sur le même tableau : les quatre comptes de la fiche sur un
seul écran, puis deux inéquations.
**Ce qu'il fait travailler** : entre deux valeurs écrites, une flèche dit que
f ne fait que monter (ou que descendre), donc qu'elle passe EXACTEMENT UNE
fois par chaque hauteur strictement comprise entre ses deux bouts — et
jamais par une autre ; une valeur ÉCRITE se compte une seule fois, même si
deux flèches en partent. C'est le piège de la fiche — trois de ses quatre
hauteurs sont des valeurs écrites du tableau — et le tirage l'impose : au
moins une hauteur écrite, et les quatre comptes prennent au moins trois
valeurs différentes (sonde : les comptes 0, 1, 2 et 3 sortent tous).
**Tout est repris, rien n'est recopié** : le tirage est `adrGenPts(3)` — la
forme de la fiche, trois flèches, la seule où les quatre comptes sont tous
possibles et où une inéquation donne deux morceaux dans les deux sens —,
l'analyse `gsvAnalyze`, le tableau `varTableHTML` en mode LECTURE (la
fonction même du 2.17), les cases de l'union les sélecteurs de la famille
`.itv-sel` (`corrChoix`, `msgAvecVides`), l'union jugée au MIEUX à ordre
libre (le motif du 2.11).
**LE RISQUE PROPRE EST L'ÉNONCÉ QUI CONTREDIT SON TABLEAU — et la fiche
elle-même le porte.** Sa question 6 donne « f(3) = 1 et f(5) = 1 » alors que
le tableau fait DESCENDRE f de 3 à 2 sur [4 ; 6] : f(5) ne peut pas valoir
1, et l'élève qui suit la donnée écrit un S que le tableau dément. Une
abscisse donnée est donc tirée strictement À L'INTÉRIEUR d'une flèche que
k traverse strictement, une par flèche traversée, et le contrôle refait
cette vérification par sa propre arithmétique sur chaque tirage — c'est le
bord qu'il nomme « le défaut de la question 6 de la fiche ».
**Les deux inéquations d'une séance sont de SENS opposés et de STRICTESSE
opposée** : sans quoi l'élève apprendrait que le crochet est toujours le
même. Chacune a EXACTEMENT deux morceaux — la forme de la fiche, et la
seule qui laisse la ligne de réponse constante : des cases au nombre exact
révéleraient combien de morceaux chercher (la leçon des trois cases
d'{antecedents-droite}). k n'est jamais une valeur écrite (un morceau réduit
à un point n'a pas sa place dans « [ ; ] ∪ [ ; ] » — c'est aussi ce que la
question 6 de la fiche aurait donné, {−6} ∪ …). Les bornes se CHOISISSENT
dans une liste qui offre les bords du tableau, les abscisses données ET les
abscisses écrites du tableau — le piège : les prendre pour bornes alors que
f n'y vaut pas k. Le crochet est ouvert à une abscisse donnée si l'inégalité
est stricte, toujours fermé aux bords −6 et 6.
**Le contrôle compare la page à LA FICHE** — ses réponses 2, 1, 2, 2 et son
S = [−6 ; −5] ∪ [2 ; 6] — et refait le tirage par une SECONDE arithmétique,
qui compte sur les treize valeurs de la grille et non sur les nœuds : deux
méthodes qui n'ont rien en commun doivent tomber d'accord. Sonde : 95 % des
courbes à trois flèches conviennent, 1,05 essai en moyenne, pire cas 3 sur
400 séances, 0 recours au repli — lequel est RÉEL, relevé sur le
générateur, et passe par les gardes mêmes (le premier, inventé à la main,
donnait un seul morceau à chaque inéquation : le contrôle l'a nommé). Le
banc NAVIGATEUR (« 6 quater sexies », déclaré par `tableauEquations`)
tient ce que jsdom ne voit pas : l'union à huit cases sur UNE SEULE rangée,
sans défilement à 1400 px — coupée en deux, elle se lirait comme deux
solutions —, et il CHOISIT les huit cases pour de vrai avant de relire les
couleurs. La carte de cet écran fait 920 px pour cette ligne ; sur un écran
plus étroit elle DÉFILE au lieu de se replier.
Vingt sabotages, chacun rougissant en nommant son défaut — la valeur écrite
comptée deux fois, le crochet fermé sur une inégalité stricte, l'abscisse
donnée hors de sa flèche (le contrôle répond « le défaut de la question 6 de
la fiche »), la hauteur écrite, la strictesse jumelle, le compte toujours le
même, le morceau unique, la réponse rangée dans la question, le tableau
redevenu à remplir, la case vide peinte en soutien, le repli inventé, les
abscisses écrites retirées des listes, les deux morceaux qui ne se recollent
plus, le bord du tableau ouvert… **Et l'un d'eux a d'abord frappé le
VOISIN** : la ligne « jugé au mieux » de l'union est la même, au caractère
près, dans le 2.6 — `replace` a saboté {lecture-deux-courbes} pendant que
le contrôle du 2.18 restait vert à bon droit. Un sabotage se pose sur une
ancre PROPRE à sa cible, sans quoi il mesure autre chose ; rejoué sur la
ligne d'au-dessus, il rougit (« les deux morceaux dans l'autre ordre valent
0 au lieu de 8 »). Et un défaut de mise en page ne s'est vu que sur la
capture : sur deux colonnes, « a combien de solutions ? » se repliait et la
case tombait seule à la ligne suivante — la phrase est plus courte, et « ? »
reste soudé à sa case.

**Vrai ou faux, en JUSTIFIANT — et la fiche pose une question qu'on ne peut
pas trancher.** {tableau-vrai-faux} (Seconde, demande de Turquet, septembre
2026, repris de la fiche « tableau de variation V/F », Exercice 9) suit
{tableau-equations} au menu : un tableau de variation, et SEPT affirmations —
« f(−5) est positif », « f(3) ≤ 6 », « f(1) ≤ f(2) » — à dire vraies ou
fausses en justifiant : « car la fonction est [croissante / décroissante]
sur [ … ; … ] ». Sept affirmations sur DEUX écrans (quatre, puis trois)
numérotées à la suite comme sur la fiche, 32 cases — la composition de la
fiche est gardée : deux signes, deux comparaisons à un nombre, trois
comparaisons de deux images.
**LA JUSTIFICATION DÉPEND DU TYPE, et c'est Turquet qui l'a redressée sur la
première mise en ligne** (septembre 2026 : « la justification n'est pas la
variation de la fonction mais le fait que les images sont comprises entre 3
et 6 sur l'intervalle [1 ; 4] »). Le premier jet faisait justifier toute
affirmation par le sens de f — or le sens ne prouve rien sur « f(3) est
négatif » : ce qui le prouve, c'est l'ENCADREMENT que la flèche donne. Un
signe ou une comparaison à k se justifie donc par « car sur [ 1 ; 4 ], la
fonction est comprise entre 3 et 6 » — cinq cases : Vrai/Faux, les deux
bornes, les deux valeurs (la paire à ordre LIBRE, « entre 6 et 3 » vaut
« entre 3 et 6 », la règle des paires) ; une comparaison de deux images garde
le sens — « croissante sur [ −1 ; 4 ] », quatre cases — parce qu'un
encadrement ne dit rien de f(a) ≤ f(b). Les valeurs proposées sont les
valeurs ÉCRITES du tableau : la valeur lue sur une AUTRE flèche est le piège,
et elle ne coûte que son point.
**Ce qu'il fait travailler est le raisonnement du 2.18 poussé jusqu'à la
preuve** : entre deux valeurs écrites, f ne fait que monter (ou que
descendre), donc f(a) est STRICTEMENT entre les deux valeurs écrites aux
bouts de sa flèche — on ne connaît pas f(a), on sait entre quoi et quoi il
est — et f(a) ≤ f(b) se lit dans le SENS de la flèche.
**LE RISQUE PROPRE EST L'AFFIRMATION INDÉCIDABLE, et la fiche elle-même le
porte** : sa question 2 demande si f(5) est positif alors que f DESCEND de 5
à −2 sur [4 ; 6] — f(5) est strictement entre −2 et 5, il peut être positif
comme négatif, et ni « Vrai » ni « Faux » n'est une réponse juste : l'élève
qui répond ce que le tableau lui permet de dire serait compté faux, le pire
défaut du projet. Chaque affirmation est donc tirée DÉCIDABLE — le signe sur
une flèche qui ne traverse pas 0, la comparaison à k pour un k hors de la
flèche (et à deux unités au plus d'un de ses bouts : « f(3) ≤ 6 » quand f
monte jusqu'à 5, le k de la fiche), f(a) ≤ f(b) pour a et b sur la MÊME
flèche —, `tvfVerite` rend null plutôt que de trancher, et le contrôle EXIGE
ce null sur la question 2 de la fiche, épinglée. Sonde : 35 % des courbes à
trois flèches conviennent — le facteur limitant est la flèche sans 0 —,
2,8 essais en moyenne, pire cas 17 sur 400 séances, 0 recours au repli,
lequel est RÉEL, relevé sur le générateur.
**La bonne réponse n'est jamais rangée à côté de la question** : elle ne
porte que la courbe et les affirmations (type, nombres, variante — le
contrôle refuse tout autre champ), et `tvfVerite`, la fonction même qui
corrige, recalcule tout. **Le contrôle la refait par une SECONDE méthode qui
n'a rien en commun avec la page** : a étant entier, f(a) est la valeur
`pts[a+6]` de la GRILLE — la page, elle, ne lit que les nœuds du tableau, et
ne connaît jamais f(a). La vérité par la grille et la vérité par le tableau
doivent tomber d'accord, tirage après tirage (0 désaccord sur 400).
**Tout est repris, rien n'est recopié** : le tirage est `adrGenPts(3)`,
l'analyse `gsvAnalyze` — ses segments disent « croissante » et
« décroissante », les mots mêmes que la justification demande —, le tableau
`varTableHTML` en mode lecture (la fonction même du 2.17), les cases les
sélecteurs de la famille `.itv-sel` (`corrChoix`, `msgAvecVides`). Chaque
case se juge SEULE : un « Vrai » faux ne fait pas payer une justification
juste, et la borne 6 prise pour −1 — l'intervalle qui ENJAMBE un changement
de sens, le piège des bornes proposées — coûte exactement son point. Au
moins trois vraies et trois fausses par séance, les deux sens parmi les
justifications, jamais deux affirmations sur le même nombre : la sonde a vu
sortir « f(5) est positif » ET « f(5) est négatif » dans la même séance —
l'une répond à l'autre. Le message n'explique que les affirmations qui
portent une VRAIE faute, la case vide d'abord (`msgAvecVides`).
**Deux défauts ne se sont vus que sur la capture.** `String(renderTVF)`
dans le contrôle du partage lisait l'ENVELOPPE de la greffe des jetons — le
piège documenté du 2.14, retombé tel quel : on lit la SOURCE. Et à la
largeur du 2.18 (920 px), la rangée corrigée DÉFILAIT : les badges verts de
la correction l'élargissent, et la bonne borne se cachait derrière le
défilement — la carte est passée à 1040 px, puis à 1300 quand la
justification a gagné sa cinquième case : à 1040, UN seul badge sur une
rangée d'encadrement cachait déjà la dernière valeur. Vu sur la sonde, pas
au banc — celui-ci ne jouait qu'une copie JUSTE, donc sans aucun badge, et
une rangée juste ne mesure rien de la largeur corrigée : il choisit
désormais TROIS cases fausses sur la première rangée et mesure la rangée
une fois ses badges posés. À 1300 la rangée absorbe trois badges sur un
écran de 1280 px, et cinq à 1400 ; au-delà elle DÉFILE (`.tvf-wrap`) au
lieu de se replier. Le banc NAVIGATEUR (« 6 quater
septies », déclaré par `tableauVraiFaux`) tient ce que jsdom ne voit pas :
chaque affirmation et sa justification sur UNE rangée — coupée en deux, la
justification se lirait sans son affirmation —, sans défilement à 1400 px,
et il CHOISIT les trente-deux cases pour de vrai sur les deux pages — et
c'est lui qui a repris mon compte : je les avais comptées 18 + 14, la
composition de la copie ÉPINGLÉE du banc jsdom (types mêlés), quand le
tirage réel pose quatre encadrements puis trois comparaisons, 20 + 12. Un
compte recopié d'un banc à l'autre n'est pas une mesure.
Vingt-quatre sabotages, chacun rougissant en nommant son défaut — sauf un, qui
rougit sans rien nommer : k tiré n'importe où ET le garde des indécidables
retiré fait tomber le TIRAGE en erreur avant que le contrôle ne mesure quoi
que ce soit. Un sabotage qui casse la page ne dit rien du contrôle visé ; le
bord de l'indécidable est tenu par le repli inventé à la main (une
affirmation sur une flèche qui traverse 0), que le contrôle nomme.

**La SYNTHÈSE : dix questions sur un seul dessin.** {synthese-fonction}
(Seconde, demande de Turquet, septembre 2026, repris de la fiche « Synthèse
fonction ») ferme le thème Fonctions : la courbe de f sur son ensemble de
définition et la droite de g sur le MÊME graphique conservé, et les dix
questions de la fiche dans son ordre, sur quatre écrans — a) le domaine et
quatre images, b) les antécédents d'une hauteur, l'équation f(x) = c et
l'inéquation, c) le tableau de variation et le tableau de signes, d) f contre
g, le maximum et le minimum. Chaque question a son exercice au menu ; celui-ci
les rassemble.
**Tout est repris, rien n'est recopié** : le tirage est `gsvGen()` — le
générateur du 2.15, deux racines intérieures, chacune un vrai croisement,
jamais de palier ; le dessin est `adrSVG()`, la fonction même, à qui l'on donne
le MORCEAU du domaine et la droite par son crochet « dessus » ; l'analyse des
variations est `gsvAnalyze()`, REMISE À SA PLACE (la tranche repart de −6, on
la décale) ; les deux tableaux sont ceux de {signes-variations-grand}
(`varTableHTML` / `varTableSubs`, les fonctions mêmes du 2.1) ; le maximum et
le minimum viennent de `mmxAns()`, la fonction qui corrige le 2.16 ; les listes
d'intervalle sont la famille `.itv-sel` et la légende f/g est `fgLegende()`.
**Trois généralisations d'un TOKEN chacune, et leur bord opposé est tenu par
les exercices voisins** : `adrCibles` boucle sur la longueur du tableau (pour
lire les hauteurs sur la TRANCHE du domaine), `adrPath` et `adrSVG` acceptent
un morceau (ia, ib) et marquent ses deux bouts — la convention de `lvPath` au
2.6. Appelées sans eux, les trois exercices d'avant ne changent pas d'un pixel,
et leurs contrôles le disent.
**LE SENS DE CHAQUE INÉQUATION SUIT LA COURBE, la strictesse est tirée.** La
première version exigeait f EN DESSOUS entre les deux croisements (et f
au-dessus de g) : le tirage coûtait 1187 essais et échouait 15 fois sur 300 —
le repli serait sorti une séance sur vingt. En laissant le SENS suivre le côté
où f se trouve (`f(x) < c` ou `f(x) > c`, `f(x) > g(x)` ou `f(x) < g(x)`), S
reste UN SEUL intervalle — la forme que la ligne de réponse demande — et le
tirage tombe à 202 essais, 300 séances sur 300 (sonde, septembre 2026). Le
crochet, lui, suit la strictesse, tirée : sans quoi l'élève apprendrait que le
crochet est toujours le même (la leçon du 2.18).
**Les risques propres sont ceux de la famille, réunis** : une hauteur traversée
entre deux graduations (illisible), un croisement de f et g hors graduation, un
extremum atteint deux fois, une racine hors du domaine — le tableau de signes
n'aurait pas ses deux racines et l'énoncé mentirait. Le tirage les écarte et le
contrôle les RECOMPTE par sa propre arithmétique, tirage après tirage, en
relisant la spline que le dessin trace pour compter les traversées.
**La bonne réponse n'est jamais rangée à côté de la question** : elle ne porte
que la courbe, le domaine, la droite, les deux hauteurs, les sens, la
strictesse et les quatre abscisses — le contrôle refuse tout autre champ — et
tout le reste est recalculé par les fonctions qui corrigent. Le MÊME graphique
sert les quatre parties, et le contrôle l'exige : un dessin qui changerait en
route ferait de la synthèse quatre exercices sans rapport.
**Deux défauts ne se sont vus que sur la capture** : le dessin restait au
réglage général (460 px) alors qu'il porte DIX questions — ses graduations
n'étaient plus lisibles —, et la droite de g, tracée d'un bord à l'autre du
cadre, SORTAIT du quadrillage par le haut, son étiquette posée sur les
graduations. Elle est coupée au cadre, et le dessin passe à 760 px.
Le banc NAVIGATEUR (« 6 vicies quinquies », déclaré par `syntheseFonction`) tient
ce que jsdom ne voit pas : la courbe qui s'arrête à son domaine — mesurée
contre les GRADUATIONS RENDUES, aucune coordonnée recopiée —, ses deux bouts
marqués, la droite et la légende, la copie juste CLIQUÉE sur les quatre
parties, et la ligne de solution qui ne se replie pas.
Treize sabotages, chacun rougissant en nommant son défaut — et **le
treizième est d'abord resté VERT, en montrant un contrôle INTERMITTENT** :
la règle des paires se mesure en reposant les antécédents dans l'autre
ordre, or 85 % des tirages n'en donnent qu'UN (sonde : 170 sur 200), et
renverser une liste d'un élément ne renverse rien — l'ordre imposé passait
donc, à bon droit, quatre fois sur cinq. Le contrôle CHERCHE désormais une
séance au pluriel et le DIT s'il n'en trouve pas : un contrôle qui n'a rien
à mesurer ne mesure rien. Rejoué sur une séance à deux antécédents, le
sabotage rougit (« les antécédents dans l'autre ordre ne valent que 0/3 »).

**Construire une fonction, c'est toute la lecture graphique à l'ENVERS — et
le juge ne compare jamais au témoin.** {construire-fonction} (Seconde,
Fonctions, demande de Turquet, août 2026, repris de la fiche « BONUS ») :
cinq consignes — une valeur, une image, un antécédent, l'équation
f(x) = 0 avec S = { … }, une inéquation f(x) signe k avec S en
intervalles — et c'est l'ÉLÈVE qui trace : un point entier par colonne sur
[−5 ; 5] × [−4 ; 4], posé et retiré au clic, la courbe (les cubiques de
`lvTangents`, monotones entre deux graduations) se dessinant à travers ses
points au fil de la pose.
**Le tirage fabrique un TÉMOIN, en dérive les consignes, puis le juge
l'oublie** : il ne relit que les consignes sur la courbe de l'élève —
beaucoup de courbes différentes sont justes, et le contrôle épingle une
copie ALTERNATIVE acceptée à 5/5, le bord qui attraperait un juge qui
comparerait au témoin. Le témoin ne sert qu'à la correction VERTE (jamais
en soutien). L'exactitude des ensembles passe par le refus des TRAVERSÉES :
entre deux graduations la spline est monotone, donc tout bord d'ensemble
vit sur une graduation — une courbe qui plonge à travers la hauteur k entre
deux colonnes change S, et le juge le voit (un « faux sabotage » l'a
montré : la copie que je croyais valide créait une traversée, et le 4/5
disait vrai).
**Le témoin est SANS PALIER** (deux valeurs voisines égales feraient un
segment plat — l'équation et l'antécédent y perdraient leur sens), et sans
palier un changement de signe passe forcément PAR un zéro : 0 n'est jamais
traversé entre deux graduations. 2-3 zéros, l'antécédent unique, S de
l'inéquation en 1-2 intervalles jamais réduits à un point ni au domaine
entier, les colonnes des consignes disjointes, et une valeur donnée jamais
nulle (elle répéterait l'équation). Le premier repli, inventé À LA MAIN,
était invalide (k traversé) — la règle « un repli RÉEL, relevé sur le
générateur » existe précisément pour ça ; celui qui est figé passe par les
gardes mêmes du contrôle.
**Chaque consigne est une RÉPONSE** (`pts-case`, la leçon des barres de
{simplifier-barres}) : cinq cases dans la note, peintes ok/bad à la
vérification — et une courbe INCOMPLÈTE ne reçoit aucune couleur : une
courbe à moitié tracée n'est pas fausse, le message compte les colonnes
manquantes. L'écouteur des clics est DÉLÉGUÉ à l'hôte : le SVG est réécrit
à chaque pose, un écouteur posé dessus mourrait avec lui. Et jsdom n'ayant
pas de mise en page (un rectangle de SVG y vaut zéro), le calcul
clic → nœud ne se voit qu'au banc navigateur, qui clique pour de vrai :
poser les 11 colonnes, retirer un point, vérifier 5/5, fausser une copie et
voir le témoin vert. Un piège de banc s'y est montré : `mouse.click` ne fait
pas défiler, et le clic sur la rangée du bas (y = −4) tombait hors de la
fenêtre — perdu sans erreur ; la grille se centre avant de cliquer. Éprouvé
par DIX sabotages nommés, dont un que seul le navigateur voit : l'écouteur
posé sur le SVG au lieu de l'hôte ne pose qu'un point, puis meurt avec la
première réécriture.
**Le fond de la grille est OPAQUE.** Signalé par Turquet (août 2026) : « le
quadrillage de l'exercice ne doit pas se superposer au quadrillage du graphique
que l'on doit dessiner ». La page porte un quadrillage décoratif en fond, et le
SVG était transparent : les deux trames se croisaient, et l'élève ne savait plus
quelle ligne était une graduation. La grille reçoit donc le cadre de
`.lv-graph` — fond `--surface`, bordure, coins arrondis. Ça ne se voit que sur
une capture : aucun banc ne mesure la lisibilité de deux trames superposées.

**Et le MÊME geste avec les consignes de la fiche du maximum : {construire-max-min}.**
(Seconde, Fonctions, demande de Turquet, septembre 2026, repris de la fiche
« Exercice 10 » — « créer une fonction max et min ») suit {construire-fonction}
au menu. C'est {maximum-minimum} et {maximum-minimum-tableau} pris à L'ENVERS :
là on LIT un maximum sur un dessin, ici on DESSINE une courbe dont le maximum
est imposé. Six conditions, celles de la fiche : f croissante sur un
intervalle, un encadrement sur ce même intervalle, un maximum sur la moitié
gauche, un minimum sur la moitié droite, le maximum et le minimum du domaine
entier.
**LE MOTEUR EST PARTAGÉ, PAS RECOPIÉ** : même grille [−5 ; 5] × [−4 ; 4], même
geste (un point par colonne, posé et retiré au clic), même écran, même dessin,
même écouteur délégué, même note. Seules les CONSIGNES changent, et la famille
voyage dans la QUESTION (`q.fam`) — donc la reprise après une pause la retrouve
sans rien de plus, et les trois fonctions aiguillées (consignes, juge,
explication) restent PURES : le contrôle leur passe une question qu'il écrit
lui-même. Même moteur, pas même identité : la note part sous `currentTestId`,
le rappel par `RAPPELS_ID`, les questions par `QIA_SUGG_ID`.
**LE CŒUR EST L'INTERACTION DES QUATRE CONSIGNES DE MAXIMUM ET DE MINIMUM** :
le maximum de la moitié gauche est STRICTEMENT plus petit que celui du domaine,
donc le sommet ne peut pas être à gauche ; le minimum de la moitié droite est
STRICTEMENT plus grand que celui du domaine, donc le creux ne peut pas être à
droite. Sans ces deux inégalités les consignes se répéteraient et l'exercice
n'apprendrait rien — le tirage les EXIGE, et le contrôle les recompte.
**TOUT SE JUGE AUX GRADUATIONS, et c'est exact** : entre deux colonnes la
spline de `lvTangents` est monotone, donc elle ne dépasse ni ne redescend — le
maximum, le minimum et la croissance de la courbe DESSINÉE sont ceux des points
posés. La croissance est STRICTE : un palier est constant, pas croissant.
L'encadrement, lui, n'exige PAS d'atteindre ses bornes — c'est un encadrement,
pas une égalité ; le maximum, si : une courbe qui plafonne plus bas est fausse,
et c'est le bord opposé de « ne pas dépasser ».
**LE JUGE NE COMPARE JAMAIS AU TÉMOIN**, comme dans l'autre famille : le tirage
construit une courbe, en DÉRIVE les six consignes, et le juge ne relit que les
consignes. La sonde l'a mesuré plutôt que supposé — 6 courbes au moins ne
diffèrent du témoin que d'une colonne et valent 6/6, 12 en médiane — et le
contrôle épingle l'une d'elles : c'est le bord qui attraperait un juge
paresseux.
**LE REPLI EST LA FICHE ELLE-MÊME** : ses six conditions au mot près
(« f est croissante sur [−2 ; 2] », « −3 ≤ f (x) ≤ 4 sur [−2 ; 2] », « 2 est le
maximum sur [−5 ; 0] », « −2 est le minimum sur [0 ; 5] », « 4 est le maximum
sur [−5 ; 5] », « −4 est le minimum sur [−5 ; 5] »), et il passe par les gardes
MÊMES du tirage — il en est un tirage possible, vérifié garde par garde plutôt
que supposé. Le contrôle compare la page à LA FICHE, condition par condition.
Sonde : 0 recours au repli sur 400 séances.
**Et le premier jet du contrôle a rougi sur du code JUSTE** : trois de ses
motifs épinglés étaient faux — abaisser une colonne DANS l'intervalle de
croissance casse aussi la montée, et j'avais compté une seule consigne fausse
là où il y en avait deux. Un essai faux se reconnaît à ce qu'il rougit sur une
page juste ; les cas ont été choisis pour n'en casser QU'UNE, ce qui prouve
bien mieux que chaque consigne se juge seule.
**Dix-huit sabotages, dix-sept rougissant en nommant leur défaut**, et le
dernier reste VERT à bon droit : ouvrir le partage jusqu'au bord du domaine ne
produit aucun tirage: à s = −5 la moitié droite EST le domaine, donc son
minimum égale celui du domaine et la garde du cœur écarte le tirage. La
propriété « le partage est intérieur » est donc TENUE par les deux inégalités
du cœur, et la liste `[-1, 0, 1]` n'est pas un garde-fou mais un choix de
présentation — le partage reste près du milieu, comme sur la fiche.

**Le 4.5 de la Terminale est descendu en Seconde — même tirage, autre juge.**
{solutions-graphique} (Seconde, Fonctions, juste avant {ecrire-solutions},
demande de Turquet, septembre 2026 : « mettre l'exercice 4.5 de terminale en
seconde avec les fonctions ») est {tvi-lecture-graphique} sans le mot TVI : une
courbe, une hauteur k, et trois gestes — cliquer sur la courbe le ou les points
vérifiant f(x) = k (ronds), cliquer sur l'axe les solutions (carrés), écrire les
solutions séparées par des points-virgules, ou ∅ quand la droite y = k ne
rencontre pas la courbe. Son kind est `tvg`, comme là-haut.
**Le tirage est celui de la Terminale, au caractère près, et un contrôle
l'exige** — dix fonctions (le tirage des cinq familles, la spline, la
densification, le dessin, la lecture de l'écriture) comparées entre les deux
fichiers par `corpsFonctions`, la leçon du moteur de courbes du 5.4 : un second
moteur aurait fini par diverger, et deux niveaux se seraient contredits sur la
même courbe. Le premier passage l'a montré pour une APOSTROPHE : deux
commentaires recopiés au tiret droit là où la Terminale écrit ’, et le contrôle
a nommé les deux fonctions. Cinq familles, chacune une fois par séance en ordre
mélangé — droite, parabole (deux solutions, ou une seule quand k est la valeur
du sommet), parabole que y = k ne rencontre pas, courbe à deux extremums (trois
solutions, ou deux quand k est la valeur d'un extremum). Toutes les solutions
tombent sur des abscisses ENTIÈRES, les cibles, et aucun autre point entier ne
frôle k ; le contrôle RECOMPTE les solutions sur la fonction reconstruite et
balaie la courbe au dixième pour refuser toute traversée de k hors d'une
solution — un `sols` qui ne serait plus celui de la courbe ferait mentir la
correction sans qu'aucune correction ne bronche.
**Ce qui change est le JUGE.** La Terminale confie le verdict au modèle
(action `verif`) et ne note pas sans lui ; ici tout se calcule — l'ensemble des
points cliqués, l'ensemble des abscisses cliquées, l'écriture — et **un verdict
qu'on peut prouver ne se confie pas à un modèle** (la leçon de `libreJuge`,
appliquée au portage) : la page juge seule, sans appel réseau, et l'aide du
modèle reste là où elle est partout ailleurs. TROIS réponses par question,
chacune jugée SEULE — les lignes a) et b) sont des `pts-case`, l'écriture une
case —, quinze pour la séance ; `tvgCases` les nomme pour la coupe d'un
devoir. Juste en bleu, en trop en rouge, oublié en VERT sur le dessin même
(`okc`, `badc`, `missc`), et l'écriture fausse reçoit la bonne à côté (badge
`mf-cor`) — en entraînement seulement. **Le soutien colore sans révéler** : à
la vérification, les cibles justes se verrouillent en bleu, les fausses
rougissent à retirer, et rien ne dit ce qui manque ; l'élève revérifie. Aucune
correction au fil des clics, et c'est déclaré (`soutienEnDirect.sans`) :
colorer une cible au moment où on la pose dirait laquelle est juste avant même
de vérifier. Une copie sans écriture, ou sans sélection alors qu'elle n'écrit
pas ∅, n'est pas vérifiée : rien n'est peint, une case vide ne rougit jamais.
Écrire ∅ SANS rien sélectionner est une RÉPONSE — « il n'y a pas de point » —
et se juge comme telle. Le bouton des tables n'y est pas : on ne multiplie
rien, on lit.
**Le banc navigateur CLIQUE les cibles pour de vrai** (« 6 vicies sexies »,
déclaré par `solutionsGraphique` dans `tests/profils.js`) — ronds et carrés à
zone de saisie invisible, d'au moins 20 px chacune — et lit le verdict à
l'encre RENDUE : la cible juste bleue, le point en trop rouge, l'abscisse
oubliée verte, la droite y = k dessinée après la vérification, le bouton ∅ qui
écrit l'ensemble vide. Un piège de banc s'y est montré : un point de la courbe
posé SUR l'axe (f(n) = 0, jamais une solution puisque k ≠ 0) est recouvert par
le carré de l'axe, dessiné après lui, et Playwright refusait le clic — le banc
choisit sa cible « en trop » loin de l'axe, là où un élève aurait à cliquer.
Et un second piège de banc, du même banc : pour oublier une abscisse sur
l'axe tout en gardant une sélection, il faut une question à DEUX solutions au
moins — sur une seule, la vérification refuse la copie (« sélectionne… ») et
le banc mesurait un écran jamais jugé, en accusant la page. Vingt sabotages
au banc principal, chacun rougissant en nommant son défaut — dont un qui est
d'abord resté VERT à bon droit : peindre la copie APRÈS les gardes ne touche
jamais une copie vide, le sabotage était impossible ; posé AVANT le garde, il
rougit. Deux sabotages de plus ne rougissent QU'AU NAVIGATEUR — la cible
juste peinte en rouge sous sa classe `okc`, les zones de saisie réduites à
8 px —, jsdom restant vert à bon droit sur l'un comme sur l'autre.

**Et l'ensemble des solutions s'ÉCRIT, en entier, dans une seule case.**
{ecrire-solutions} (Seconde, Fonctions, demande de Turquet, septembre 2026 :
« un exercice sur les inéquations ou équations de la forme résoudre f(x)=k ou
f(x)>k ou f(x)>=k ou f(x)<k ou f(x)<=k avec un graphique de −6 à 6 en
abscisse et ordonnée. L'élève doit donner sa réponse dans une case à côté de
"S=", il doit tout taper, et sur le clavier des tablettes il doit y avoir
[ ] ; U { } — et sur des boutons au-dessus du champ de saisie aussi ») suit
{solutions-graphique} au menu : là on CLIQUE les solutions d'une équation,
ici on ÉCRIT l'ensemble — et l'inéquation vient avec.
**TOUT EST REPRIS, RIEN N'EST RECOPIÉ** : le tirage est `adrGenPts()`, le
générateur MÊME du grand dessin (13 valeurs entières, segments strictement
monotones, jamais de palier) ; le dessin est `adrSVG()`, la fonction même,
appelée NUE — elle a seulement son paramètre « dessus », la convention de
l'`extra` de `lvGraphSVG`, pour que la méthode se trace par-dessus ; et les
morceaux de courbe de la solution passent par `adrPath(pts, sx, sy, ia, ib)`,
le MÊME chemin que la courbe noire, donc ils s'y superposent exactement.
**LA SAISIE LIBRE EST TOUT LE SUJET.** Partout ailleurs (le 2.4, le 2.7, le
2.8, le 2.18) les crochets et les bornes se CHOISISSENT dans des listes :
l'élève RECONNAÎT une écriture. Ici il l'ÉCRIT — c'est le geste du contrôle,
et le seul qui fasse travailler la notation elle-même. La contrepartie est
que le juge doit être LARGE sur l'écriture et EXACT sur l'ensemble : espaces
libres, « - » comme « − », « u » comme « U » comme « ∪ », intervalles dans
l'ordre qu'on veut, doublon d'un ensemble compté une fois — et en revanche la
bonne borne, le bon crochet, le bon nombre d'intervalles. Refuser une
écriture juste serait le pire défaut du projet ; accepter une réunion pour
une équation en serait un autre, et la consigne DIT donc le geste (accolades
pour des nombres, crochets pour un intervalle, U entre deux) sans dire lequel
s'applique ici — c'est encore à l'élève de choisir.
**LE RISQUE PROPRE EST LA BORNE ILLISIBLE, et il est SILENCIEUX** : une
hauteur k traversée ENTRE deux graduations donnerait à S une borne qui ne se
lit pas sur le dessin, et une lecture juste serait comptée fausse ; et une
racine qui TOUCHE la courbe sans la traverser ferait de S autre chose qu'une
réunion d'intervalles (] a ; c [ U ] c ; b [ pour une inégalité stricte) — un
énoncé auquel la ligne de réponse ne sait pas répondre. Le tirage exige donc
que k soit atteinte, jamais traversée entre deux graduations, et que CHAQUE
racine soit un vrai CROISEMENT INTÉRIEUR (la discipline du 2.7 et du 2.8) —
ce qui écarte du même geste les racines posées au BORD, où un intervalle se
réduirait à un point. Les bords du domaine, eux, sont TOUJOURS pris : f n'y
vaut pas k.
**Le contrôle refait l'ensemble par une SECONDE méthode qui n'a rien en
commun avec la page** : la spline est ÉCHANTILLONNÉE au centième et les
morceaux relevés là où l'inégalité tient, quand la page ne regarde que les
graduations — un côté inversé ou une borne fausse se voient alors tout de
suite ; les crochets, eux, se vérifient par la propriété (ouverts aux racines
si et seulement si l'inégalité est stricte, fermés aux bords du domaine).
**Une séance montre les CINQ formes, chacune UNE fois, en ordre mélangé** (le
motif d'{inequation-droite}) — sans quoi l'élève apprendrait que la réponse
est toujours du même genre — et parmi les quatre inéquations, au moins une
dont S est UN intervalle et au moins une dont S en a DEUX : sans ce second
visage le U ne servirait jamais. Sonde : 400 séances sur 400, 1,1 essai en
moyenne, 0 recours au repli — lequel est RÉEL, relevé sur le générateur, et
repasse par les gardes MÊMES du tirage.
La bonne réponse n'est jamais rangée à côté de la question : elle ne porte que
la courbe, la hauteur et le signe (`pts`, `k`, `rel`) — `ecsAns()`, que
l'énoncé, le juge, le message et le dessin de la méthode lisent tous, la
recalcule — et le contrôle refuse tout autre champ.
**LES SIX TOUCHES VIVENT À UN SEUL ENDROIT** (`ECS_TOUCHES`), lu par la
rangée au-dessus du champ ET par le pavé des tablettes : deux listes auraient
fini par diverger, et le clavier d'un élève sur tablette aurait perdu un
symbole que l'ordinateur offre encore. Le banc compare cette liste à
`tests/profils.js` — deux sources. Les boutons passent par `paveInserer`, le
moteur d'insertion déjà éprouvé : ils posent la sélection ET lèvent
« input », sans quoi ils seraient des boutons MORTS pour la correction en
direct.
**Le pavé apprend les touches que la CASE demande, pas le niveau.** Ajouter
`[ ] ; U { }` à `PAVE_TOUCHES` les aurait offertes à toutes les cases
numériques de la Seconde, où elles n'écriraient qu'une réponse fausse — la
doctrine du bouton qui n'est proposé que là où il SERT. La case les NOMME
(`data-pave-plus`), et `paveSup()` — une neuvième fonction du moteur, donc le
même texte dans les TROIS fichiers, et le contrôle d'identité la compare — les
pose au bout de la rangée ; la rangée se replie alors (`pave-2r`) plutôt que
de laisser des touches sortir de l'écran : **le pavé ne défile jamais.** Les
niveaux qui ne déclarent aucune touche supplémentaire ne changent pas d'un
pixel.
**La MÉTHODE est dessinée à la VALIDATION, jamais avant** : la droite y = k,
les croisements, les traits qui descendent sur l'axe, les morceaux de courbe
qui vérifient l'inégalité, et S posé sur l'axe avec ses crochets — un crochet
de borne EXCLUE tourne le dos à l'intervalle, la convention d'{intervalles} :
le dessin EST la notation. Affichée pendant la recherche, elle donnerait la
réponse.
**Deux garde-fous MORTS y ont été écrits, puis retirés** — les dixième et
onzième du projet, tous deux montrés par le sabotage, qui est resté vert en
disant vrai. Le `!isSoutien()` posé par réflexe sur la révélation de la bonne
réponse n'écartait jamais rien : en soutien une copie fausse repart par la
branche du dessus, avec son « Revérifier » — on n'arrive à la révélation, en
soutien, qu'avec une copie JUSTE, et c'est la branche du soutien qui tient le
bord. Et le saut de ligne FORCÉ du pavé (`.pave-br`) n'écartait rien non
plus : la rangée se replie d'elle-même exactement quand elle ne tient pas —
c'est le CONTRÔLE qui exige la propriété (le pavé ne défile pas, ne recouvre
ni la case ni les commandes, ses touches restent touchables).
**Vingt sabotages au banc principal et trois au navigateur**, chacun
rougissant en nommant son défaut. Le banc NAVIGATEUR (« 6 vicies quater »,
déclaré par `ecrireSolutions` dans `tests/profils.js`) tient ce que jsdom ne
voit pas : les six boutons CLIQUÉS pour de vrai — jsdom lit un attribut, seul
un navigateur voit qu'un bouton écrit —, leur taille au doigt, les morceaux
verts et les quatre crochets RENDUS avec une étendue non nulle (un CSS perdu
les rendrait invisibles sans qu'une erreur ne se lève), et le pavé des
tablettes en portrait comme en paysage.
