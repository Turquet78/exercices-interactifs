# Fractions (Seconde et Première)

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Simplifier, ça se VOIT : deux barres qui vont aussi loin.**
{simplifier-barres} (Seconde) donne une fraction à simplifier et la fait dire
deux fois. Méthode 1 : deux barres de même longueur, la première partagée en
`b` parts, la seconde en `d` — l'élève colorie la fraction sur la première,
puis la même LONGUEUR sur la seconde, et lit à côté ce qu'il vient de colorier.
Méthode 2 : `a ÷ □` sur `b ÷ □` `= □` sur `d`. Quand tout est vérifié, la page
écrit la conclusion : « donc a/b = n/d » (demande de Turquet, août 2026).
L'idée est celle du 2.1.1 de la Première, qui posait déjà deux dessins de même
taille partagés différemment ; le chemin des nombres est celui de la dernière
étape de {simplifier-fractions}.

**Le dessin est COUCHÉ, et c'est le partage qui l'a décidé.** Le dénominateur de
départ va de 4 à 40 (demande de Turquet, août 2026), et une colonne verticale ne
peut pas dépasser 250 px : au-delà son BAS tombe sous le pli d'un écran
d'ordinateur portable, or on colorie du bas vers le haut — l'élève cliquerait ce
qu'il ne voit pas. 40 parts dans 250 px font des segments de 6 px, incliquables.
Couchée, la barre dispose de la largeur entière que ces écrans prennent déjà :
1080 px découpés en 40 font des parts de 27 px. **La borne du tirage et la
largeur de la barre vont ensemble** — élargir l'une sans l'autre rend les parts
introuvables, et un contrôle du banc navigateur mesure la part rendue.
La première version était en colonnes, et le défaut ne s'est vu qu'en ouvrant la
page à 1366×768 : à la hauteur de la Première (320 px), le bas des colonnes
passait déjà sous le pli avec un partage de 14.

**Les deux barres doivent COMMENCER AU MÊME ENDROIT.** Deux barres de même
longueur mais décalées ne se comparent plus, et c'est tout ce que l'exercice
enseigne. « partagée en 40 » et « partagée en 5 » n'ayant pas la même longueur,
l'étiquette a une largeur FIXE. Rien d'autre ne dirait ce défaut : le banc
navigateur mesure donc le bord gauche des deux barres, en plus de leur longueur
et de la longueur coloriée.

**La première barre ne demande rien de plus que de recopier l'énoncé, et c'est
pour ça qu'elle existe.** Sans elle il n'y aurait aucune longueur à retrouver, et
la seconde ne serait qu'un second exercice de calcul. C'est la longueur COMMUNE
qui enseigne : simplifier ne change pas la valeur, seulement l'écriture.

**Le dénominateur d'arrivée est DONNÉ des deux côtés** — la seconde barre est
partagée en `d` parts, et la méthode 2 écrit `= □/d`. C'est ce qui rend
l'exercice décidable : le diviseur est alors forcément le PGCD, et il n'y a pas
de « juste mais pas fini » à arbitrer. La correction ne peut donc jamais compter
faux un élève qui a raison — la question ne laisse pas cette place. C'est
l'inverse de {simplifier-fractions}, où le dénominateur commun reste libre
jusqu'au bout : là le diviseur se CALCULE sur ce que l'élève a écrit, ici il est
déterminé par l'énoncé.

**Le tirage part de la fraction d'ARRIVÉE.** On tire `n/d` irréductible, puis on
la « dé-simplifie » en multipliant par `k` : le PGCD de `a/b` vaut alors
exactement `k`, puisque pgcd(nk, dk) = k × pgcd(n, d) = k. Partir de `a/b` et
calculer son PGCD aurait obligé à jeter les tirages sans simplification
possible, et à espérer que le PGCD tombe sous 10 — la borne demandée. Il en
découle que **la bonne réponse n'est jamais rangée à côté de la question** : `n`,
`d` et `k` sont les nombres MÊMES dont l'énoncé est fait, un énoncé ne peut donc
pas contredire sa correction.

**Une barre est une RÉPONSE, pas un décor — et la note affichée doit le savoir.**
Chaque question vaut cinq réponses : les deux coloriages et les trois cases.
`ptsEcran()` ne connaissait que les `math-field`, les `select` et les `input` :
l'écran annonçait « 3 cases justes sur 3 » sur une question qui en vaut 5,
pendant que la note enregistrée en comptait bien 5. C'est le défaut de `good` au
lieu de `ok`, par une autre porte — la note enregistrée juste, celle montrée à
l'élève fausse, et rien qui rougisse. Une classe le dit désormais : `pts-case`,
que `ptsEcran()` compte comme une case. Toute réponse qui n'est ni un champ ni
une liste peut la porter.

**Et une barre laissée vide ne rougit pas**, comme une case : elle reçoit la
correction en bleu — le trait à la bonne mesure — et la bordure passe en
pointillés. La règle valait déjà partout pour les cases de saisie ; elle vaut
ici dès le premier jour, sur un élément qui n'est pas un champ. Le contrôle
universel du banc navigateur, lui, ne regarde que les `MATH-FIELD`, `INPUT` et
`SELECT` : il ne verrait pas une barre rouge. C'est un contrôle du banc de
l'exercice qui tient ce bord.

**Un garde-fou MORT y a été écrit, puis retiré.** `allOk = justes===5 && !vide`
n'écartait jamais rien : aucune des cinq réponses ne peut être juste ET vide —
une barre non coloriée vaut 0, une case vide se lit NaN. {simplifier-fractions}
en avait besoin parce que chacune de ses étapes se juge sur ce que l'élève a
écrit et pouvait donc être verte à moitié ; ici chaque réponse est comparée à UNE
valeur. Le sabotage l'a montré en restant vert, et il avait raison.

**Le bloc CSS est RECOPIÉ, pas greffé sur `#sfHost`.** Les réglages qui posent
le badge de correction hors du flux vivent sur `#sfHost`, dans un bloc qui est
le même texte dans les deux niveaux — et la Première n'a pas cet écran. Les
étendre aurait fait diverger ce bloc ; sans eux, le badge se poserait DANS le
flux et élargirait le trait de fraction, le défaut d'août 2026 au même endroit.

**Croiser les dénominateurs, c'est le MÊME moteur avec une image en plus.**
{croiser-denominateurs} (Seconde) partage tout avec {somme-fractions} — écran,
correction, chaîne d'égalités — et n'ajoute qu'une chose : il MONTRE d'où vient
chaque multiplicateur. Chaque dénominateur est coloré, les cases qui prendront
sa valeur portent son liseré, et deux flèches partent de l'un pour arriver sur
l'autre en se CROISANT (demande de Turquet, août 2026).
C'est la règle « deux exercices peuvent partager un moteur, mais pas leur
identité » : la note passe par `test.qId`, le rappel par `RAPPELS_ID`, les
questions par `QIA_SUGG_ID` — et `qiaSuggestions()` fait primer l'identifiant
sur le `kind`, comme la Terminale le fait déjà. Le moteur, lui, ne gagne qu'une
ligne (`if(test.crd && typeof crdDecorer==='function')`), écrite à l'identique
dans les deux fichiers : la Première n'a pas cette fonction et ne s'en aperçoit
jamais.
**Les dénominateurs sont PREMIERS ENTRE EUX**, et c'est ce qui rend l'exercice
honnête. Le croisement donne alors exactement le PPCM : la méthode montrée et
la méthode libre tombent d'accord. Avec 4 et 6, le croisement donnerait 24
contre 12, et l'élève qui simplifie aurait raison tout en rougissant. On retire
l'ambiguïté au TIRAGE, jamais à la correction — qui reste celle de
{somme-fractions} et accepte tout dénominateur commun : les flèches sont un
appui, pas une contrainte.
**La couleur ne porte jamais seule.** La consigne dit le croisement en toutes
lettres et les flèches le montrent : un écran mal réglé, ou un élève qui
distingue mal les couleurs, doit pouvoir faire l'exercice. Le violet et
l'orange sont choisis pour ne pas se confondre avec le bleu, le vert et le
rouge de la correction — ni entre eux pour un daltonien, qui confond justement
le vert et le rouge. (Le liseré fut bleu tant que le bleu n'était pas une
couleur de verdict ; il est passé au violet quand le bleu a pris « juste ».)
Les flèches sont posées sur des positions MESURÉES après le rendu, et
redessinées quand la fenêtre change : un trait posé sur des coordonnées
supposées se décale au premier changement de police, et personne ne le voit.
Elles partent du dénominateur écrit DANS la ligne — le « 5 » de « 5 × □ » — et
non de la fraction de départ, restée loin à gauche : le premier jet traversait
toute l'égalité et passait sur le « = ».
Un contrôle du banc navigateur mesure les quatre bords, et le premier est le
plus sournois : un liseré qui prendrait la couleur de SA PROPRE fraction ferait
dire au dessin l'inverse de la règle, et l'élève apprendrait le contraire de ce
qu'on enseigne, sans que rien ne rougisse.

**Multiplier, c'est le miroir de la somme SANS le même dénominateur — et c'est
tout le sujet.** {multiplier-fractions} (4.6) et {multiplier-fractions-libre}
(4.7), demandés par Turquet en août 2026, sont au produit ce que
{somme-fractions} et {somme-fractions-libre} sont à la somme : un guidé, un
rédigé, les mêmes nombres. Le guidé pose une seule chaîne —
`n1/d1 × n2/d2 = (□ × □)/(□ × □) = □/□` — et **l'erreur qu'il vise est celle de
l'élève qui vient de passer trois exercices à mettre au même dénominateur et
croit devoir le faire encore**. Le message la nomme en toutes lettres quand elle
se produit, plutôt que de dire seulement « faux ».

**Les quatre premières cases ne demandent aucun calcul, et c'est voulu**
(décision de Turquet, août 2026) : elles demandent de PLACER les numérateurs
ensemble et les dénominateurs ensemble. Poser le produit à la place de l'élève —
« (5 × 1)/(3 × 2) » écrit par la page — ne lui laisserait que l'arithmétique,
alors que l'arithmétique n'est pas la difficulté ici.

**L'ORDRE DES DEUX FACTEURS EST LIBRE**, et il le faut : rien à l'écran ne dit
quelle case appartient à quelle fraction, et la multiplication est commutative.
Chaque case se juge donc sur ce qu'elle PROMET — être l'un des deux nombres
attendus — puis les deux doivent former la paire : deux cases portant toutes
deux 5 quand on attend 5 et 1 sont chacune défendable et fausses ensemble.
C'est la règle des paires de {somme-fractions}, transposée.

**AUCUNE SIMPLIFICATION** (décision de Turquet, août 2026), et ça se paie au
TIRAGE : le produit doit être irréductible. **`pgcd(n1,d1)=1` et `pgcd(n2,d2)=1`
NE SUFFISENT PAS** — 2/3 × 3/2 a ses deux fractions irréductibles et donne 6/6.
C'est bien le PRODUIT qu'il faut tester, et un sabotage l'a montré en sortant
35/15. Sans cette condition, l'élève qui simplifie — ce qui est juste — écrirait
une fraction que la correction compterait fausse ; et l'exercice poserait la
question « faut-il simplifier ? » que 4.3 et 4.5 traitent déjà. Deux leçons dans
un même exercice rendent la faute illisible.

**La correction en bleu recouvrait le signe ×.** Le badge se pose hors du flux à
droite de sa case, et ici la case a un voisin immédiat sur la MÊME ligne : la
ligne du bas se lisait « 35 7 35 5 ». C'est le défaut d'août 2026 sur la somme,
au même endroit et pour la même raison ; la place se réserve sur la case qui
porte une correction, et seulement sur elle. Ça ne s'est vu que sur une capture.

**Un sabotage restait vert sans que le contrôle soit faible : il regardait le
mauvais MODE.** « Une case vide rougit » ne se voit pas en entraînement — la
correction en bleu repasse derrière et efface le rouge. Le bord n'est atteignable
qu'en SOUTIEN, où rien n'efface. C'est la même leçon que le sabotage impossible
de la pleine largeur : avant de conclure qu'un contrôle ne mesure rien, il faut
vérifier que le sabotage pouvait seulement l'atteindre.

**Diviser, c'est multiplier par l'inverse — et l'exercice fait ÉCRIRE ce
passage.** {diviser-fractions} (4.8) et {diviser-fractions-libre} (4.9),
demandés par Turquet en août 2026, sont aux quotients ce que 4.6 et 4.7 sont aux
produits, avec un maillon de plus au début :

    n1/d1 ÷ n2/d2 = n1/d1 × d2/n2 = (n1 × d2)/(d1 × n2) = P/Q

**C'est le MÊME moteur que la multiplication**, avec un drapeau `test.inv` —
exactement comme `test.simp` chez les sommes. Le tirage range les facteurs
EFFECTIFS (`a1 a2 / b1 b2`) : ceux de l'énoncé pour un produit, ceux de l'énoncé
APRÈS inversion pour un quotient. C'est ce qui permet au juge, au rendu et à la
correction d'être les mêmes ; un moteur recopié aurait fini par diverger sous
les yeux de l'élève. Les deux exercices partagent donc l'écran, mais pas leur
identité : la note passe par `test.qId`, le rappel par `RAPPELS_ID`, les
questions par `QIA_SUGG_ID`.

**Les deux cases de l'inverse ne forment PAS une paire.** Le haut doit valoir
`d2` et le bas `n2` — chacune une seule valeur, jugée seule. Une case qui
porterait l'autre nombre n'a pas inversé, et c'est précisément la faute visée :
le message la nomme (« Il faut RETOURNER la seconde fraction »).

**Le libre n'exige PAS la ligne des produits**, seulement le passage à
l'inverse : « 3/5 × 7/2 = 21/10 » est une rédaction parfaitement correcte, et
refuser une copie juste apprend l'inverse de ce qu'on enseigne.

**Et depuis août 2026, le 4.7 n'exige plus RIEN** (décision de Turquet) : sa
règle n'a que deux conditions — le résultat juste, aucune égalité fausse — et
AUTORISE en toutes lettres la rédaction directe « 3/5 × 7/2 = 21/10 ». C'est le
seul exercice rédigé sans étape obligatoire : la somme (4.5) exige le même
dénominateur, le quotient (4.9) exige l'inverse. Tout ce qui disait l'ancienne
obligation a changé avec la règle — la consigne à l'écran, l'indice sous la
feuille, le contexte de la fenêtre d'aide, les consignes de feedback (qui
interdisent maintenant de reprocher l'absence de l'étape) : une règle changée
côté juge et pas côté consigne aurait fait mentir l'écran. Le contrôle s'est
retourné, et tient les deux bords : un troisième point revenu dans la règle, ou
l'autorisation disparue, rougissent l'un comme l'autre.

**Un garde-fou MORT y a été écrit, puis retiré** — le troisième du projet, et
toujours pour la même raison. « ne pas diviser par 1 » (`n2 !== d2`) n'écartait
jamais rien : si `n2 = d2 = k`, le quotient vaut `n1·k/(d1·k)` et son PGCD vaut
au moins `k ≥ 2`, donc la condition d'irréductibilité l'avait déjà écarté. Le
sabotage l'a montré en restant vert. C'est le CONTRÔLE qui exige la propriété
sur le tirage.

**Et un vrai trou dans le contrôle, qu'un sabotage a ouvert** : une copie dont
l'INVERSE est faux mais dont les six autres cases sont justes valait le point
entier. Les produits se jugent sur les facteurs inversés, indépendamment de ce
que l'élève a écrit dans les cases de l'inverse — le contrôle lisait le verdict
de `mltJuge`, jamais la NOTE que le bouton enregistre. Il CLIQUE désormais.

**Deux fractions ne s'additionnent qu'au même dénominateur — et le commun n'est
pas imposé.** {somme-fractions} vit en Seconde ET en Première, sur un moteur
unique : le tirage, la pose et la correction sont le même texte dans les deux
fichiers. Une moitié recopiée aurait donné deux exercices qui se contredisent le
jour où l'un des deux change de convention. Les deux niveaux ne diffèrent que par
deux lignes, nommées comme telles : la rangée d'aide (`sfBoutonsAide()` — la
Seconde la pose dans son `…Actions`, la Première la fait poser par `iaBoutons()`)
et l'emballage du contexte (`sfCtxTexte()` rend UNE chaîne, la Seconde en fait une
paire `{nombre, contexte}`, la Première la range dans son `att`).
Le moteur ne s'appuie donc sur aucune aide propre à un niveau : la Seconde a
`ensFracInner`, la Première rend ses fractions par MathLive — il écrit les
siennes (`sfFracInner`).

L'élève complète les multiplications de la mise au même dénominateur, écrit la
somme sur ce dénominateur, puis donne la fraction finale. Trois étapes, celles du
cahier. Un des deux termes peut être un ENTIER : l'étape le montre alors écrit
« 3 = 3/1 » avant les multiplications — le passage par le dénominateur 1 est
DONNÉ, il ne se devine pas.

**Le dénominateur commun n'est pas imposé, et c'est une promesse.** La correction
vérifie que les multiplicateurs de l'élève donnent le MÊME dénominateur des deux
côtés, puis que la suite s'y tient. Multiplier 1/2 et 1/3 par 12 et 8 au lieu de
6 et 4 est une méthode juste, et l'exercice le dit. Comparer au PPCM aurait compté
faux un élève qui a raison — un exercice qui punit une méthode correcte apprend
l'inverse de ce qu'il enseigne. Le multiplicateur, lui, va en haut ET en bas :
c'est ce qui ne change pas la fraction, et c'est tout le sens de l'étape.

**Le tirage écarte quatre questions piégées**, chacune silencieuse. Deux
dénominateurs égaux : il n'y a plus rien à mettre au même. Une fraction de DÉPART
réductible (6/2) : l'élève qui la simplifie d'abord — ce qui est juste — écrit des
multiplicateurs que la correction, calée sur les nombres de l'énoncé, compte faux.
Un résultat négatif ou nul, hors sujet. Un résultat réductible, qui poserait la
question « faut-il simplifier ? » que l'exercice ne traite pas. La dernière étape,
elle, accepte toute fraction ÉGALE, comme partout ailleurs.

Le contrôle EXERCE la vraie correction en posant des valeurs dans les vraies
cases, jamais une réimplémentation — qui se serait trompée du même côté. Il a été
éprouvé en le cassant dix fois, et **deux sabotages l'ont d'abord traversé** :
retirer « le même multiplicateur en haut et en bas », et faire lire 1 dans une
case vide. Les deux étaient masqués par la règle du même dénominateur, qui
rougissait la première. Il fallait des cas choisis pour que TOUT LE RESTE soit
juste — ×5 en haut et ×3 en bas donne encore 6 au dénominateur, et une case vide
ne se voit que là où le multiplicateur attendu vaut 1.

**Une case juste ne doit pas rougir parce qu'une AUTRE est vide.** La correction
en direct du mode soutien ne juge un groupe qu'une fois TOUTES ses cases
remplies. L'élève tapait 1 dans « 2 × □ », passait à la case du dessous, et la
première virait au rouge : sa jumelle était encore vide, donc la paire ne se
jugeait pas — mais elle se colorait quand même. La note finale, elle, était
juste ; **seule la couleur mentait**, ce qui est exactement ce qui l'a laissée
passer. Et l'étape ① est UN groupe de QUATRE cases, pas deux paires : la règle
qu'elle vérifie — le même dénominateur des deux côtés — parle des deux fractions
à la fois, et juger la première pendant que la seconde est vide, c'est la
déclarer fausse parce qu'il manque une case ailleurs. La Terminale avait déjà
appris cette règle sur ses groupes du 6.1 ; elle n'avait pas gagné la Seconde.

**Et la VÉRIFICATION portait le même défaut, en pire.** La correction en direct
avait été réparée, pas celle du bouton « Vérifier » : là, une case juste rougissait
toujours parce qu'une autre était vide. Sur « 8/5 + 4/9 », l'élève écrit 9 et 9
sous la première fraction, vérifie avant d'avoir rempli le reste — ses deux cases
deviennent ROUGES et la note annonce « 0 case juste sur 9 ». Elles ne l'étaient
que parce que `memeD` réclame les DEUX paires : une case comptée fausse à cause
d'une case restée vide AILLEURS. Cette fois **la note mentait aussi**, et elle
partait en base. Rien ne rougissait nulle part ; c'est Turquet qui l'a vu en
cliquant, ce que ni `npm test` ni le banc navigateur ne faisaient — les deux
remplissaient toujours TOUTES les cases avant de vérifier.
Une paire seule se juge donc sur ce qu'elle PROMET : le dénominateur qu'elle
produit doit pouvoir devenir commun, c'est-à-dire être un multiple de l'autre
dénominateur. 5 × 9 = 45 est un multiple de 9, la paire tient ; 5 × 2 = 10 n'en
est pas un, elle ne mène nulle part et rougit. **Aucun dénominateur commun n'est
imposé pour autant** — 90 passe comme 45, c'est la promesse de l'exercice. Quand
les deux paires sont posées, elles doivent redevenir d'accord entre elles. Et
l'étape ② se juge de même sur SA ligne : le dénominateur commun est celui que
l'élève a ÉCRIT, les deux numérateurs doivent le suivre, et une paire de l'étape
① déjà posée doit s'y accorder.
Le message aussi mentait : « Il faut le MÊME dénominateur des deux côtés »
devant une copie dont il manquait sept cases. Une case vide n'est pas une erreur
de calcul, et la correction le dit maintenant avant tout le reste.
Cinq bords contrôlés, et n'en tenir qu'un ne tient rien : la paire seule qui MÈNE
quelque part est juste, celle qui ne mène nulle part reste fausse — sans ce
second bord, « toujours vrai » passerait —, deux paires divergentes restent
fausses toutes les deux, l'étape ② ne suit pas une étape ① qui dit autre chose,
et les cases vides se voient.

**Et une TROISIÈME fois, un cran à côté : la paire juste qui paie pour sa
voisine.** Signalé par Turquet en août 2026 sur une capture de « 8/5 − 1/8 » :
l'élève écrit ×1 sous la première fraction et ×5 sous la seconde, et les QUATRE
cases rougissent. Or ×5 est JUSTE — 8 × 5 = 40 est un multiple de 5, la paire
mène à un dénominateur commun parfaitement valable ; seule la paire ×1 n'aboutit
à rien, 5 n'étant pas un multiple de 8.
Les deux corrections précédentes n'avaient ouvert que le cas où l'autre paire est
**vide** : dès qu'elle était remplie ET fausse, `memeD` reprenait la main et
redemandait l'accord des deux. **Une case juste ne rougit pas parce qu'une autre
est fausse, pas plus que parce qu'une autre est vide** — c'est la même règle, et
elle vaut à tous les degrés de remplissage, pas seulement au vide.
Chaque paire se juge donc sur ce qu'elle PROMET, que sa voisine soit vide,
juste ou fausse. **L'accord entre les deux n'est exigé que lorsque les deux
mènent quelque part**, et ce second bord compte autant que le premier : ×8 d'un
côté (40) et ×10 de l'autre (80) sont chacune défendables et ne se rejoignent
pas — les déclarer justes dirait à l'élève que sa mise au même dénominateur est
faite alors qu'elle ne l'est pas. Sans ce bord, « toujours vrai » passerait, et
un sabotage l'a vérifié.
**Le message aussi a gagné une moitié.** Devant une copie où une paire est juste
et l'autre non, « il faut le MÊME dénominateur des deux côtés » est vrai mais
aveugle : l'élève ne sait pas laquelle reprendre, et peut croire qu'il doit tout
refaire alors que la moitié de son écran est verte. Il nomme donc la paire à
reprendre et le dénominateur à viser. Le premier essai du contrôle mesurait
autre chose : une case VIDE passe avant tout le reste dans le message — « il
manque des cases », et c'est la bonne priorité —, si bien qu'il faut une copie
ENTIÈREMENT remplie pour éprouver cette phrase-là.

**Et il vivait ENCORE dans les étapes suivantes : trois cases, un seul
verdict.** Turquet a demandé « la même chose pour le 4.2 et le 4.3 » (août
2026), et il y avait bien quelque chose à faire — mais pas là où on l'attendait.
Le moteur étant partagé, l'étape ① des trois exercices était déjà réparée. Ce qui
ne l'était pas, c'est que `checkSFAnswer` peignait des GROUPES : les deux
numérateurs ET le dénominateur commun d'un seul `ok3`, la fraction recopiée d'un
seul `okS`, la fraction finale d'un seul `ok4`. Un numérateur faux rougissait
donc les deux autres cases, justes. **Ce qui est peint ensemble doit être ce qui
se juge ensemble, et rien de plus** : les deux cases d'un multiplicateur sont une
vraie paire — le même nombre en haut et en bas —, le diviseur du 4.3 aussi ; les
numérateurs, le dénominateur et la fraction finale sont des réponses distinctes.
Deux règles sont CONSERVÉES, parce qu'elles ne sont pas ce défaut. Une étape ②
ne peut pas contredire une étape ① **cohérente** — mais une étape ① qui dit deux
choses différentes ne dit rien, et l'étape ② se juge alors seule. Et sur la
fraction finale de {somme-fractions}, où toute fraction ÉGALE est acceptée,
chaque case se juge d'abord sur sa promesse (numérateur multiple de N,
dénominateur multiple de D) puis les deux doivent se rejoindre : 6 et 40 sont
chacun défendables et 6/40 ne vaut pas 3/40.

**QUATRE SABOTAGES SUR SEPT SONT D'ABORD PASSÉS AU VERT, et tous disaient la
même chose : les contrôles lisaient le VERDICT, l'élève regarde la COULEUR.**
On pouvait donc reconnecter trois cases sur un seul `mark()` sans qu'aucun
contrôle ne bronche — le défaut signalé était précisément un défaut de peinture.
Les contrôles CLIQUENT désormais « Vérifier » et relisent les classes posées, sur
les deux exercices. Un cinquième essai a rougi sur une erreur du CONTRÔLE et non
de la page : il exigeait le refus de 6/80, qui vaut exactement 3/40. Un essai
faux se reconnaît à ce qu'il rougit sur du code juste.

**Et le même défaut vivait une couche plus bas : DANS la paire.** Corrigé le
matin entre les deux fractions, il a été resignalé l'après-midi : sur
« 1/5 − 1/8 », l'élève écrit 8 dans la case du HAUT, laisse sa jumelle vide,
vérifie — et son 8, le bon multiplicateur, rougit. La paire réclamait ses DEUX
cases pour se juger, et posait quand même du rouge sans avoir tranché. Corriger
un seul des deux étages ne corrigeait rien.
La règle vaut donc à toutes les profondeurs : **un groupe se juge sur les cases
que l'élève a ÉCRITES**. Un multiplicateur se met en haut comme en bas, donc
les deux cases portent le même nombre — une seule suffit à le désigner, et se
juge sur ce qu'elle promet. L'étape ② se juge sur le dénominateur écrit, à
défaut sur celui que l'étape ① annonce. La fraction finale à moitié écrite se
juge de même : le résultat étant irréductible, toute fraction égale s'écrit
N×t sur D×t. Et **une case vide ne reçoit plus aucune couleur** — elle reçoit
la correction en bleu, ce qui est autre chose.
**Un garde-fou va avec, et sans lui le correctif ouvre un trou** : chaque étape
se jugeant sur ce qui est écrit, une demi-copie peut passer aux quatre verdicts
verts. Elle vaudrait alors le point entier, et ses cases vides ne recevraient
même pas la correction — l'application les tenant pour terminées. `allOk`
exige donc aussi qu'aucune case ne soit vide.
Trois sabotages sont d'abord passés au vert, et chacun disait la même chose :
le contrôle ne mesurait pas ce qu'il avait l'air de mesurer. Le report du
dénominateur depuis l'étape ① n'était éprouvé que par des copies qui écrivaient
ce dénominateur ; le garde-fou de la demi-copie n'était éprouvé que sur `vide`,
jamais sur la note ; et l'accord des deux étapes n'avait aucun cas où elles se
contredisent. **Un contrôle qui passe au vert sous le sabotage n'est pas un
contrôle trop faible : c'est un contrôle qui parle d'autre chose.**

**Et un troisième exercice sur le même moteur : simplifier à la fin.**
{simplifier-fractions} est {somme-fractions} avec deux dénominateurs qui
PARTAGENT un diviseur et une somme qui se simplifie — la chaîne gagne deux
maillons : `(□ ÷ □)/(□ ÷ □) = □/□`. La division se pose comme la multiplication
de l'étape ①, en haut ET en bas, parce que c'est le même geste dans l'autre
sens. C'est la chaîne la plus longue de l'application : six égalités sur une
seule rangée, et seul un vrai navigateur sait si elle se replie — le contrôle
de pleine largeur la mesure (1288 px de rangée dans une carte de 1360 à
1400 px de fenêtre).
**Le dénominateur commun reste libre jusqu'au bout, et c'est ce qui rend la
dernière étape intéressante** : qui prend 12 au lieu de 6 obtient 64/12 au lieu
de 32/6, divise ensuite par 4 au lieu de 2, et retombe sur la même fraction. Le
diviseur est donc CALCULÉ sur ce que l'élève a écrit, jamais rangé à côté de la
question ; seul le résultat réduit ne dépend pas du chemin, et c'est lui qu'on
range (`Nr`, `Dr`).
**Le PGCD n'est jamais nommé.** On n'exige pas « divise par le PGCD » : on exige
que la fraction finale soit IRRÉDUCTIBLE, ce qui revient au même sans réclamer
un mot que l'élève n'a pas encore. Diviser par 2 quand on pouvait diviser par 6
n'est pas une faute de calcul — c'est un travail non terminé, et le message le
dit ainsi.
**Le tirage a DEUX conditions, et n'en tenir qu'une ne tient rien** : des
dénominateurs qui partagent un diviseur, et une somme réductible sur le PPCM.
1/6 + 1/4 ont bien 2 en commun et donnent pourtant 5/12, irréductible : sans la
seconde, la dernière étape n'aurait rien à diviser. La première, elle, est
IMPLIQUÉE par la seconde — avec des dénominateurs premiers entre eux la somme
est toujours irréductible —, et le garde-fou qui la répétait n'écartait donc
jamais rien. Il a été retiré : un garde-fou qui n'écarte jamais rien fait croire
qu'on vérifie quelque chose. C'est le contrôle qui EXIGE la propriété sur le
tirage, et le sabotage l'a montré en passant au vert.
**Le repli sur la voie de référence.** Une case écrite alors que les cases
d'AVANT sont vides ne peut pas être jugée sur la route de l'élève — il n'en a
pas choisi. On la juge alors sur la voie du PPCM, qui est exactement celle que
la correction en bleu écrira à côté. Sans ce repli, une case juste rougirait
parce que les précédentes sont vides : le défaut d'août 2026, une troisième
fois, une case plus loin encore. **Rouge veut dire FAUX, jamais « je ne peux pas
savoir ».**

**Et un quatrième : le même calcul, mais l'élève écrit tout.**
{somme-fractions-libre} tire les MÊMES nombres que {simplifier-fractions} et
retire toutes les cases : l'élève écrit son calcul dans une feuille ligne par
ligne — l'éditeur du 2.2 de la Terminale (`mlFeuille`), **porté au caractère
près** et comparé par un contrôle —, et c'est l'IA qui le lit. Le préfixe de la
première ligne porte la somme de l'énoncé, les suivantes un « = » : c'est une
seule égalité poursuivie, comme au cahier. Entrée ajoute une ligne, retour
arrière sur une ligne vide la supprime.
**Ce que change la saisie libre.** Les trois autres exercices guident le geste :
les cases disent où va chaque nombre. Ici rien ne le dit, et c'est le but —
l'élève décide seul d'écrire l'étape du même dénominateur, puis de simplifier.
La règle de décision envoyée au modèle EXIGE donc trois choses, et n'en tenir
qu'une ne tient rien : au moins une ligne où les deux fractions portent le même
dénominateur, un résultat final irréductible, et aucune ligne fausse. Écrire
directement la bonne réponse ne suffit pas — c'est l'étape qu'on fait
travailler, pas le résultat.
**Rien à redéployer chez Supabase.** La fonction Edge porte depuis longtemps un
correcteur GÉNÉRIQUE : tout appel `verif` qui n'est pas l'un des deux exercices
de dérivée historiques décrit lui-même son énoncé et sa règle. La règle vit donc
dans la PAGE et part avec elle — c'est la leçon de `MAX_CTX`, qui était restée
lettre morte côté fonction faute de redéploiement.
**Mais la fonction TRONQUE en silence à 4000 caractères.** Une règle coupée en
son milieu ne lève rien : le modèle corrige avec la moitié qu'il a reçue, et
l'exercice se met à accepter des copies sans étape. La borne est LUE dans la
source de la fonction, jamais recopiée, et la marge s'affiche à chaque exécution
(3213 caractères pour 4000, 787 de marge).
**Trois contrôles de prose sont d'abord passés au vert sous le sabotage**, et
c'est la même leçon qu'ailleurs : chercher « même dénominateur » ou
« irréductible » dans TOUT le texte ne prouve rien, ces mots y reviennent
partout. On découpe donc la règle en ses trois points numérotés et on regarde
CHACUN. Un contrôle qui passe au vert sous le sabotage parle d'autre chose.
**Et quatre bords ne se voient que dans un navigateur** : Entrée qui ajoute
vraiment une ligne, la lecture qui garde ses préfixes (sans eux le correcteur
reçoit des lignes sans lien et refuse des copies justes), le verdict du modèle
qui fait la note — c'est le seul exercice de la Seconde dont la note ne vient
pas de cases colorées —, et la rangée de jetons, qui ne connaissait que les
cases `pm-mf` et n'aurait rien inséré du tout dans la feuille : des boutons
morts, sans erreur.

**Le moteur `sf` est le même TEXTE dans les deux niveaux, et un contrôle le
vérifie.** Quatorze fonctions comparées au caractère près entre `secondes.html`
et `premiere-specifique.html`. Rien ne les comparait jusqu'en août 2026 — celui
qui existait ne regardait que le moteur d'écritures mathématiques —, et la
correction des fractions a été reprise trois fois en une journée, à la main,
dans les deux fichiers. Deux fonctions divergent VOLONTAIREMENT et sont nommées
dans le contrôle plutôt que tues : `sfBoutonsAide()` et `sfCtxTexte()`.

**Le NOMBRE de questions vit HORS du moteur, et c'est ce qui permet aux deux
niveaux de différer sans diverger.** Les huit exercices de fractions de la
Seconde (4.2 à 4.9) posent 4 questions, la Première en garde 6 (demande de
Turquet, août 2026). Écrire « 4 » dans `sfBuildQuestions` aurait cassé
l'identité du moteur — le sabotage l'a montré, le contrôle des quatorze
fonctions rougit — : la fonction lit `SF_NB`, une constante posée à CÔTÉ du
moteur, 4 dans un fichier et 6 dans l'autre. Le tirage des multiplications a
la sienne (`MLT_NB`, ses DEUX boucles la lisent — un 6 oublié dans le tirage
de secours aurait rallongé l'exercice en silence). Le contrôle compare à
`tests/profils.js` (`nbQuestionsFractions`), jamais à la constante de la page :
lire la page et la comparer à elle-même ne prouverait rien.

**Un terme ENTIER s'écrit avec la même encre qu'une fraction.** Écrit en
`f-whole` — 2 rem, une autre couleur — il dépassait des fractions voisines :
« 7/6 + 9 » avait un 9 deux fois plus gros que le 7, et le « + » ne tombait plus
sur le trait. On lui donne donc la FORME d'une fraction sans barre
(`.sf-f.sf-ent`) : même colonne, même centrage, son milieu tombe là où tomberait
le trait, et le signe s'aligne dessus tout seul. L'énoncé, lui, passe en rangée
flex centrée : en texte ordinaire, `vertical-align:middle` place chaque terme
selon SA hauteur, et un terme à un étage n'a pas le même milieu qu'un terme à
deux — le signe tombait 15 px au-dessus du trait. Les espaces y sont
INSÉCABLES : dans une rangée flex, une espace ordinaire entre deux éléments
disparaît. Le banc navigateur mesure les deux endroits, l'énoncé et le début de
la ligne ; aucun banc hors navigateur ne sait où tombe un trait.

**Les deux opérations alternent, en commençant par une addition** (décision de
Turquet, août 2026) — comme les opérations posées, et pour la même raison :
tiré au hasard, le même total sortait, mais pas le même exercice. Le repli du
tirage suit l'opération demandée ; rendre une addition là où l'alternance attend
une soustraction la romprait sans que rien ne le dise.

**Une correction en bleu posée dans une fraction en déplace le trait.**
`corTrainDec()` insère son badge juste après la case. Nu dans une fraction, il
élargissait le trait ; sous le dénominateur commun, il tombait carrément hors de
la fraction, une ligne plus bas. Chaque case est donc ENVELOPPÉE (`.sf-case`),
et le badge s'y pose hors du flux. La place à droite du premier numérateur n'est
prise que LÀ OÙ une correction existe (`:has(.mf-cor)`) : l'écran de l'élève qui
travaille reste serré, et un navigateur sans `:has` retombe sur un petit écart,
pas sur la superposition. Un banc MESURE tout cela dans un vrai Chromium — aucun
chevauchement entre un badge et de l'encre, et un trait aussi large que ce qu'il
sépare.

**Une fraction empilée se lit « 83 » quand on la met à plat.** La Première envoie
l'ÉCRAN au modèle, aplati en texte : « Calcule 1 + 83 » contredisait, dans le même
message, le « 1 + 8/3 » que le contexte venait de dire. La barre oblique est donc
écrite dans le HTML et cachée à l'œil (`.sf-lu`).

**La fenêtre des tables de multiplication est arrivée en Seconde** avec cet
exercice. Elle n'y a pas de bord « antisèche » : la Seconde n'a aucun exercice de
rapidité, donc aucun écran où la fenêtre devrait se refermer. Ce manque est
DÉCLARÉ (`tablesAide` sans `referme`), et le banc affiche « non applicable » sur
ce seul bord en continuant d'exiger l'autre. Le contrôle du navigateur s'y est
d'ailleurs pris en défaut lui-même : pour vérifier que la fenêtre RESTE ouverte,
il cliquait « l'énoncé, sinon l'écran entier » — en Seconde il n'y a pas d'énoncé
à cet endroit, Playwright visait le CENTRE de l'écran, c'est-à-dire sous la
fenêtre, qui interceptait. Trente secondes d'attente, puis un échec qui accusait
la page alors que le banc n'avait jamais cliqué l'exercice. Il calcule maintenant
un point de l'écran HORS du rectangle de la fenêtre.

**La priorité des opérations devient le sujet, et non plus un mot appris à
part.** {priorite-fractions} (4.10, demandé par Turquet en septembre 2026,
d'après une fiche papier) pose une somme où un terme est un PRODUIT de deux
fractions — `a/b + c/d × e/f` — et où la difficulté n'est plus la fraction
elle-même mais l'ORDRE du calcul : la multiplication d'abord, comme avec des
nombres seuls (2+3×4 fait 14, pas 20).

**Le moteur est une COUTURE de deux moteurs existants, jamais une
réécriture.** Le produit `c/d × e/f` est tiré comme dans {multiplier-fractions}
(irréductible — `pgcd(P1,Q1)=1`, la même condition que `mltGen`), la somme
finale comme dans {somme-fractions} (résultat irréductible — la même condition
que le tirage principal). Deux leçons déjà enseignées ailleurs, combinées dans
un seul calcul plutôt que réenseignées à part.

**Un modèle FIXE reste affiché à côté**, comme sur la fiche papier
(« Modèles » / « Calculer comme les modèles ») : les mêmes six nombres à chaque
question — le « G » de la fiche, entièrement résolu en cinq lignes —, quand le
tirage, lui, change à chaque question. Il ne se colore jamais et ne se
verrouille jamais : ce n'est pas une réponse, et un contrôle universel
(`enonce`) ne le confond pas avec l'énoncé parce qu'il vit hors de la classe
`mp-instr`.

**La saisie est libre**, comme {somme-fractions-libre} et
{multiplier-fractions-libre} : aucune case, l'élève écrit son calcul dans une
feuille ligne par ligne, et c'est l'IA qui le lit. Rien à redéployer chez
Supabase — la leçon de `MAX_CTX`, apprise sur {somme-fractions-libre}.

**Un JUGE LOCAL DÉDIÉ, pas `libreJuge()` — et c'est la vraie difficulté de cet
exercice.** Les trois exercices rédigés existants exigent que CHAQUE morceau de
la copie vaille la réponse FINALE, parce que tout leur calcul EST cette
réponse. Ici ce n'est plus vrai : un élève peut isoler le produit sur sa propre
ligne — « 2/3 × 4/5 = 8/15 » —, exactement comme le modèle le montre en trois
temps, avant de reprendre la somme. Ce morceau-là ne vaut PAS la réponse finale
(91/30 dans l'exemple), et `libreJuge()` l'aurait déclaré faux À TORT — un
verdict qui PRIME sur celui, pourtant juste, que l'IA aurait rendu. `pfJuge()`
accepte donc chaque morceau qui vaut soit le produit intermédiaire (`P1/Q1`)
soit la réponse finale (`P/Q`), et n'exige la réponse finale que sur le DERNIER
morceau — ce qui laisse justement voir la faute de priorité : un élève qui
additionne AVANT de multiplier écrit un morceau qui ne vaut NI l'un NI l'autre,
et le juge le nomme au modèle plutôt que de le laisser deviner.

**L'étape du même dénominateur reste exigée**, comme en
{somme-fractions-libre} : c'est elle qui prouve que la somme a bien été
reprise après le produit, et pas seulement que le résultat final tombe juste
par hasard. `libreEtapeMemeDeno()` est réutilisée telle quelle — elle compare
les dénominateurs par VALEUR, pas par écriture, donc
`(a×Q1)/(b×Q1) + (P1×b)/(Q1×b)` s'y reconnaît sans rien ajouter au juge.

**Le tirage porte quatre garde-fous, chacun écartant un piège silencieux** :
le produit doit être irréductible (comme {multiplier-fractions}), il ne doit
pas valoir exactement 1 (écriture ambiguë), les deux numérateurs du produit ne
sont pas tous les deux 1 (rien à travailler en haut), et le premier
dénominateur ne doit pas déjà égaler celui du produit (rien à croiser). Le
résultat final, lui, doit être irréductible — comme {somme-fractions} —, sans
quoi l'exercice poserait la question « faut-il simplifier ? » que
{simplifier-fractions} traite déjà : deux leçons dans un même calcul rendraient
la faute illisible.

**Le bouton des tables de multiplication s'affiche sans rien déclarer** :
l'exercice n'est PAS ajouté à `TABLES_SANS`, la liste en négatif de
`tablesBtnHTML()` — et il en a besoin, pour le produit `d×f` du dénominateur.
