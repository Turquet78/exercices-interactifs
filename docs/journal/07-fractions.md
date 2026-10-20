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

**Une RÉVISION n'est pas un neuvième pas-à-pas.** {revision-fractions} (5.11,
Seconde, septembre 2026) vient d'une fiche papier de Turquet, « Révision sur les
fractions », à cinq remarques : même dénominateur pour additionner ou
soustraire (①), produit terme à terme SANS jamais chercher un dénominateur
commun — qu'un facteur soit un entier ou non (② et ④, la MÊME règle), mise au
même dénominateur par le produit des deux quand ils diffèrent (③), et division
par l'inverse (⑤). {somme-fractions}, {multiplier-fractions} et
{diviser-fractions} enseignent déjà le détail pas à pas de ces gestes ; en
ouvrir un neuvième qui les répète aurait usé la même leçon deux fois sans
rien ajouter. Celui-ci teste autre chose : le RÉSULTAT final, en une seule
fraction à compléter, et le VOCABULAIRE de la règle qu'on vient d'appliquer,
dans une liste à trois choix — le motif de {additionner-relatifs} et
{soustraire-relatifs} (une liste, puis une case), pas celui des exercices de
fractions détaillés qui l'entourent dans le même thème.

**Huit questions, un ordre FIXE.** Une par sous-règle de la fiche — la
multiplication comptant deux fois puisque la fiche elle-même la répète, une
fois entre deux fractions, une fois avec un facteur entier — jamais mélangées :
c'est la règle qui doit se reconnaître à sa PLACE dans la révision, pas au
hasard d'un tirage. Seuls les nombres changent, à chaque lancement.
`distinctes()` n'a rien à faire ici : chacune des huit questions porte un champ
`type` qui lui est propre (`meme-add`, `meme-sub`, `mult-frac`, `mult-entier`,
`diff-add`, `diff-sub-entier`, `div-1`, `div-2`) et qui, à lui seul, empêche
toute confusion avec sa voisine dans le contrôle « aucune séance ne pose deux
fois la même question » — y compris entre {div-1} et {div-2}, qui posent
pourtant EXACTEMENT le même calcul avec des nombres tirés indépendamment.

**Les nombres sont à UN CHIFFRE, JAMAIS ZÉRO** (consigne de Turquet, comme
{additionner-relatifs}) : dénominateurs de 2 à 9, numérateurs et entiers de 1 à
9. Aucune simplification n'est demandée ni recherchée — ce n'est pas le sujet
ici, à la différence de {multiplier-fractions} — et le tirage n'écarte qu'un
résultat NUL là où il rendrait la case ambiguë : deux numérateurs distincts
pour `meme-sub` (sans quoi le résultat vaudrait 0, qui n'est l'erreur visée
d'aucune des trois options de la liste), et un numérateur final non nul pour
`diff-sub-entier` (`n1 − k×d1`, qui peut légitimement être négatif — un entier
soustrait à une fraction plus petite que lui est le cas normal, pas un cas à
éviter).

**On range les nombres tirés, jamais la réponse.** `rvfReponse(q)` la
recalcule à chaque correction à partir de `q.type` et des nombres — comme
`relLignes()` le fait pour {additionner-relatifs} — pour la même raison :
une réponse rangée à côté de la question finirait par la contredire si le
calcul changeait un jour.

**Le calcul de gauche réutilise `sfFracInner`/`sfTermeHTML` telles quelles**,
sans y toucher : ce sont des fonctions globales, pas spécifiques à
{somme-fractions}, et c'est exactement le motif qu'il fallait pour qu'un
facteur entier (`mult-entier`, `diff-sub-entier`) prenne la FORME d'une
fraction sans barre, à la hauteur de sa voisine, et que le signe qui le suit
tombe sur le bon trait — le contrôle universel « un signe posé à côté d'une
fraction tombe sur son trait » les mesure comme n'importe quel autre exercice,
sans rien déclarer.

**La case de réponse est un `<input>` de texte, pas un `math-field`** — la
réponse est un entier signé simple (numérateur, dénominateur), pas une
expression, et un champ mathématique n'aurait rien ajouté. Ce choix a une
conséquence sur les contrôles universels qu'il faut savoir lire : « les cases
de saisie ont la taille des nombres qui les entourent » et « le clavier
mathématique est atteignable » ne regardent QUE les `math-field` du DOM
(`querySelectorAll('math-field')`) — sur un écran qui n'en a aucun, comme
celui-ci, les deux contrôles n'ont rien à mesurer et passent trivialement, ce
qui n'est pas un trou : aucun clavier détaché n'est nécessaire puisqu'aucun
champ mathématique n'existe, et la taille de la case suit la même feuille de
styles (`.f-num,.f-den`) que partout ailleurs où elle est déjà correcte. Le
contrôle « aucune case laissée vide ne rougit » regarde en revanche les
`INPUT` au même titre que les `MATH-FIELD` et les `SELECT` : il s'applique
donc bien ici, et `corrChoix()` — la même fonction que {additionner-relatifs}
et {soustraire-relatifs} — le tient.

**Le badge de correction se pose hors du flux, comme chez {somme-fractions}.**
La case de réponse réutilise ses classes (`f-frac-input`, `sf-case`, `f-num`,
`f-den`) — mais `.sf-case{position:relative}` et son `.mf-cor` en
`position:absolute` sont des règles CSS scopées par hôte (`#sfHost .sf-case`,
`#mltHost .sf-case`, `#smpHost .sf-case`), jamais génériques : les copier
SANS les recopier pour `#rvfHost` aurait laissé le badge se poser dans le
flux et élargir le trait de la fraction, le défaut d'août 2026 revenu par une
porte neuve. Deux lignes suffisent, recopiées à l'identique.

**Cinq questions sur huit ont gagné une étape, en septembre 2026** (demande
de Turquet : « pour {mult-entier}, la phrase à compléter doit être "quand il
n'y a pas de dénominateur, le dénominateur est…", et l'élève complète
ensuite l'écriture de la multiplication en mettant 1 dans la case du
dénominateur » — puis, étendue : « pour toutes les opérations, je veux voir
les étapes intermédiaires comme dans {somme-fractions} ou {diviser-fractions}
quand il y en a »). Ce n'est PAS un retour sur « une révision n'est pas un
neuvième pas-à-pas » — le principe tient toujours, et {meme-add}, {meme-sub}
et {mult-frac} n'ont rien reçu, faute d'avoir quoi que ce soit à mettre au
même dénominateur ou à inverser. Mais cinq questions ont une VRAIE étape
avant leur résultat, et la cacher les réduisait à un vocabulaire réciter :

* {mult-entier} et {diff-sub-entier} partagent la MÊME case (`rvf-kden`),
  pour la MÊME raison : un entier n'a pas de dénominateur écrit, la phrase de
  la règle le dit maintenant explicitement (« quand il n'y a pas de
  dénominateur, le dénominateur est… », 1/0/lui-même — les trois mêmes
  options que {diff-sub-entier} portait déjà), et l'élève écrit lui-même le 1
  dans la case, plutôt que de le trouver déjà posé par `sfTermeHTML` comme
  avant. Le maillon `n/d × k` (donné) `= n/d × k/[case]` `= [num]/[den]` est
  la forme du passage « 3 = 3/1 » de {somme-fractions}, sauf que la case y
  est éditable : ce n'est plus donné, c'est demandé.
  **`mult-entier` a changé de phrase, pas de sujet.** L'ancienne demandait
  si le dénominateur change après la multiplication (« ne change pas ») ;
  la fiche de Turquet teste maintenant le passage PAR le dénominateur 1, une
  marche plus tôt dans le même raisonnement — `rvfPourquoi('mult-entier')` le
  dit dans l'ordre : « 2 = 2/1 » d'abord, la multiplication ensuite.
* {diff-add} ajoute les DEUX produits croisés (`rvf-a1`/`rvf-b1` valant d2,
  `rvf-a2`/`rvf-b2` valant d1) — la forme du `produit()` de
  {somme-fractions}, avec des cases `<input>` plutôt que des champs
  mathématiques. Contrairement à {somme-fractions}, le dénominateur commun
  n'est PAS au choix de l'élève : il est fixé au PRODUIT des deux, parce que
  c'est la méthode que la phrase de la règle enseigne elle-même
  (« produit des deux dénominateurs ») — une case à réponse libre aurait
  exigé de recalculer le résultat final sur le choix de l'élève, ce que cette
  révision, à la différence de {somme-fractions}, ne fait nulle part ailleurs.
* {div-1} et {div-2} ajoutent l'inverse écrit (`rvf-inv-n`=d2,
  `rvf-inv-d`=n2) — la forme du maillon `mlt-i1`/`mlt-i2` de
  {diviser-fractions}.

**Puis {diff-sub-entier} a gagné la mise au même dénominateur, en octobre
2026** (demande de Turquet, sur une capture de `1/7 − 7 = 1/7 − 7/[1] = ?/7` :
« il faut les étapes pour mettre au même dénominateur comme dans les autres
exercices »). L'entier écrit `k/1`, la réponse sautait directement à
`?/d1` : le passage `k/1 = (k×d1)/(1×d1)` — LE geste d'une soustraction de
dénominateurs différents — restait à faire de tête. La chaîne est désormais
`n1/d1 − k = n1/d1 − k/[1] = n1/d1 − (k×[d1])/(1×[d1]) = [num]/[den]`, avec
le `rvfProduitCaseHTML()` de {diff-add} sur le seul terme entier (l'autre a
déjà le bon dénominateur) ; `rvfExtra` y ajoute `rvf-ka`/`rvf-kb` (valant
d1), le libellé passe à trois étapes, et le barème total de 34 à 36.
{mult-entier} n'a rien reçu : une multiplication ne met jamais au même
dénominateur.

**Puis chaque produit s'est écrit CALCULÉ, dans sa case — toujours en
octobre 2026** (demande de Turquet, sur une capture de
`9/5 + 6/6 = (9×[6])/(5×[6]) + (6×[5])/(6×[5]) = ?/?` : « il faut toutes les
étapes intermédiaires, pour donner le résultat de chaque opération dans une
case »). La chaîne posait les produits, puis sautait directement à la somme :
`54/30 + 30/30` restait à faire de tête — deux multiplications et une
addition dans les mêmes deux cases. {diff-add} gagne donc un maillon
`= [n1·d2]/[d1·d2] + [n2·d1]/[d1·d2]` (`rvf-p1n`, `rvf-p1d`, `rvf-p2n`,
`rvf-p2d`), {diff-sub-entier} le maillon `= n1/d1 − [k·d1]/[d1]`
(`rvf-kpn`, `rvf-kpd`) ; leurs libellés comptent une étape de plus
(« effectuer les produits »), et le barème passe de 36 à 42. Les six
autres questions n'ont qu'UNE opération par case — leur case finale EST
déjà le résultat de l'opération — et n'ont rien reçu. Les valeurs attendues
sont uniques (le dénominateur commun est fixé au produit des deux), comme
le reste de cette révision.

**Le barème n'est plus `qs.length*3`.** `rvfExtra(q)` rend les cases propres
à chaque type (vide pour les trois qui n'en ont pas), `rvfCases()` les
insère entre la règle et le résultat, et `startRvf()` somme
`rvfCases(q).length` sur les huit questions plutôt que de multiplier par un
nombre fixe — un type à 4 cases et un type à 7 auraient sinon compté le même
poids. `rvfJuste()` et `checkRvfAnswer()` n'ont pas changé : ils lisent déjà
`rvfCases(q)` sans connaître le nombre de cases à l'avance, exactement comme
`relCases`/`srlCases` ailleurs dans le fichier.

**ENTRÉE avance à la case suivante, depuis ce jour.** Avant, elle vérifiait
la réponse dès qu'on l'appuyait dans une case numérique — sans conséquence
tant qu'il n'y avait que `rvf-num`/`rvf-den`. Avec jusqu'à cinq cases
supplémentaires, valider à la première case remplie aurait empêché d'écrire
les suivantes : `renderRvfTest()` construit maintenant l'ordre des cases de
la question (`rvfCases(q)`) et avance le focus dessus, ne vérifiant qu'à la
dernière — la même convention que `sfCases()`/`mltCases()`.

**Le bouton des tables était déjà là.** `revision-fractions` n'a jamais été
dans `TABLES_SANS`, et `conseilInlineBtn()` y ajoute `tablesBtnHTML()` sans
condition de mode : aucun changement n'était nécessaire de ce côté.

**{produit-difference-fractions} (5.13), {quotient-difference-fractions}
(5.14) et {quotient-double-fractions} (5.15) tenaient sur deux blocs
empilés — trois pour le dernier —, demande de Turquet (septembre 2026) :
« je veux que les calculs tiennent dans une même ligne d'égalité ».** La
parenthèse (le croisement, puis la différence ou la somme) vivait dans son
propre `.pt-step`, l'opération extérieure (le produit, ou la division) dans
un second ; {quotient-double-fractions} en ajoutait un troisième pour sa
seconde parenthèse. Trois cases séparées se lisent comme trois calculs
distincts — le défaut que « aucune rangée ne se replie » nomme déjà pour un
repli DANS une rangée, ici recopié entre deux rangées empilées. Les trois
sont désormais UNE seule chaîne, sur UNE seule rangée : la parenthèse
s'écrit, se résout par le croisement, puis l'opération extérieure continue
la MÊME ligne — `renderPqdTest()` et `renderQdbTest()` n'ouvrent plus qu'un
`.pt-step`.

**La division reprend le maillon de {diviser-fractions} (5.8) : le terme
extérieur réapparaît devant l'inverse.** `pfProduitHTML()` posait son
premier « = » nu — `... = [case de l'inverse]` — un signe sans rien
derrière lui pour dire ce qu'il annonce, parce que la case qui suit ne
vaut que le maillon (l'inverse, ou le produit) et jamais l'expression
extérieure entière. {diviser-fractions} évite ce défaut en réécrivant
`n1/d1 ×` devant la case : c'est la même réécriture qu'un nouveau
paramètre `tete` ajoute à `pfProduitHTML()`, collée au premier « = »
seulement — les suivants continuent de simplifier la même égalité, sans
rien répéter, exactement comme dans {diviser-fractions}.
{produit-difference-fractions}/{quotient-difference-fractions} passent
`a/b` en `tete` : c'est un terme LITTÉRAL, connu dès le tirage, sûr à
réécrire. {quotient-double-fractions} n'en a pas : ses deux opérandes sont
CHACUN une parenthèse — une case que l'élève vient de remplir, jamais un
nombre fixe — et réécrire sa VALEUR en texte aurait donné la réponse de la
case juste au-dessus. Son inverse reste donc introduit par un « = » nu,
comme avant la fusion ; seule la mise en une ligne a changé pour lui.

**`pleineLargeur` gagne les trois identifiants**, `exercices` et `chaine`
(à 1 bloc chacun) : sans cette déclaration, le banc navigateur ne les
visite pas du tout côté largeur et repli — c'est lui qui aurait dû voir la
coupure en plusieurs blocs, et ne la voyait pas. {quotient-double-fractions}
devient la chaîne la plus longue de l'application depuis cette fusion : deux
croisements complets avant même de diviser, sur une seule rangée.

**{produit-difference-fractions} (5.13) a reçu un second document de
Turquet (septembre 2026), le modèle « H » de la MÊME fiche papier — cette
fois en image, pas en texte — et une consigne : « présenter les calculs
comme le pdf joint ». Le modèle montrait une étape que le moteur sautait.**
Sur le papier, la parenthèse `2/3 − 4/5` se résout en QUATRE lignes : le
croisement (des cases à côté de chaque numérateur ET chaque dénominateur),
PUIS les deux fractions croisées VALENT chacune un nombre — deux fractions
SÉPARÉES, chacune sa propre barre, le même dénominateur commun ÉCRIT DEUX
FOIS —, PUIS seulement la soustraction sur une seule barre (`-2/15`), PUIS
le produit final. `pfCroixHTML()` sautait la troisième ligne : après le
croisement, elle posait directement `(n1 − n2)/d` sur UNE seule barre
partagée — juste avant de redemander, une case plus loin, ce même résultat
sous la forme `rn/rd`. Une étape du papier n'avait donc pas de case, et la
suivante en avait une de trop par rapport à lui.

**Un paramètre, jamais une deuxième fonction.** `pfCroixHTML()` sert aussi
{somme-produit-fractions} (G) et {quotient-double-fractions} (J), qui n'ont
reçu AUCUN modèle papier pour cette étape — leur présenter la nouveauté
aurait changé une leçon que personne n'a demandé de changer. Un dernier
paramètre `deux` (faux par défaut, donc silencieux pour G et J) fait basculer
CETTE seule étape entre les deux présentations : IDs `-n1`/`-n2`/`-d` groupés
sur une barre (l'ancienne, toujours celle de G et J), ou IDs `-n1`/`-d1`
et `-n2`/`-d2` sur deux barres séparées (la neuve, celle du papier).
{produit-difference-fractions} ET {quotient-difference-fractions} passent
`deux:true` — ils partagent le même moteur `pqd`, et la fiche montre la
même méthode pour H et pour I, seul le signe de l'opération extérieure
change. Le calcul JUGÉ ne bouge pas d'un chiffre : `pfCroixJuge()` teste
toujours que le dénominateur écrit vaut le produit croisé — une fois
(`-d`) ou deux fois séparément (`-d1` ET `-d2`, chacun sa propre case) —,
et la case `rn/rd` qui suit continue d'exiger la valeur EXACTE de la
parenthèse, comme avant. L'étape du produit extérieur (`pfProduitHTML()`,
la décomposition `a×Rn / b×Din`) ne bouge pas non plus : le papier
l'omet, mais le rappel de l'exercice (`RAP_PQD`) l'enseigne déjà comme une
écriture intermédiaire légitime — la retirer de l'écran l'aurait rendue
incohérente avec sa propre aide.

**{quotient-difference-fractions} (5.14, « I ») avait reçu ce même
resserrement d'abord, et H l'a rejoint le jour même par une demande
séparée** — deux sessions, chacune sa propre fiche papier (I = 5/2 ÷
(8/3 − 1/3), H = 5/2 × (2/3 − 4/5)), toutes deux à des chiffres de 1 à 5.
`pqdGen(inv)` a distingué un temps H et I par une borne haute différente
(9 pour H, 5 pour I, seul I relâché) ; la fusion des deux demandes a
remplacé cette distinction par UNE SEULE borne commune (1–5) et UN SEUL
relâchement, valable pour les deux : les six nombres tirés — a/b, c/d, e/f —
n'ont plus à être déjà irréductibles, et **le résultat final n'est plus
forcé irréductible** non plus. La case finale acceptait déjà — et accepte
toujours — n'importe quelle fraction ÉGALE à la réponse, simplifiée ou non
(`pfFracJuge`, `estFinal`) ; exiger en plus que le tirage LUI-MÊME tombe
toujours sur une fraction déjà réduite n'ajoutait rien à ce que l'élève peut
écrire, et écartait des tirages par ailleurs valides — resserré à 1–5, le
vivier en avait d'autant moins besoin. Le résultat continue de ne jamais
valoir 0, pour H comme pour I, comme avant. Le repli codé en dur de I
change de nombres pour rester dans le nouvel intervalle (5/2 ÷ (4/5 − 1/3)) ;
celui de H garde le sien, déjà dans l'intervalle (5/2 × (2/3 − 4/5), le
« H » de la fiche).

Éprouvé en ouvrant réellement l'exercice dans un Chromium (capture d'écran,
pas seulement le banc jsdom) : la parenthèse s'affiche bien sur deux
fractions séparées, chacune sa case de dénominateur, avant la barre unique
du résultat — et {somme-produit-fractions} et {quotient-double-fractions},
capturés à côté, gardent l'ancienne présentation groupée sans qu'aucune case
n'ait bougé.

**{quotient-double-fractions} (5.15) a reçu le même resserrement, par une
troisième session le même jour, sur SA fiche (« J » de « fraction révision
5 »).** Les huit nombres de l'énoncé (`a` à `h`) venaient de
`rand(1,9)`/`rand(2,9)` ; ils tirent maintenant de `rand(1,5)`/`rand(2,5)` —
le repère de la fiche papier, où « J » se calcule avec 5/2, 1/3, 2/3 et 1/4,
et qui se trouve être EXACTEMENT le repli de secours de `qdbGen()` (preuve
que le moteur avait déjà été construit sur cette fiche). Le résultat final
ne peut toujours pas valoir 0, et n'a plus à être irréductible — même
relâchement que G/H/I, par le même juge `pfFracJuge()` déjà accueillant.
Contrairement à pqd, `qdbGen()` GARDE ses quatre `gcd(...)!==1` sur les
fractions de DÉPART (`a/b`, `c/d`, `e/f`, `g/h`) : la demande de Turquet
portait ici sur le résultat que l'élève calcule, pas sur l'énoncé qu'on lui
donne — {quotient-double-fractions} ne partage pas le moteur `pqd` de H/I,
rien n'obligeait à leur faire dire la même chose au même mot près.

**« deux » sur pfCroixHTML avait résolu la moitié de l'écart avec le PDF —
l'autre moitié restait après la fusion, et Turquet l'a repointée sur une
capture d'écran du site en ligne.** Le modèle papier de H (5/2 × (2/3 −
4/5)) tient en QUATRE lignes après l'énoncé : le croisement, les deux
fractions croisées séparément, PUIS la parenthèse résolue en une seule
fraction — ENCORE précédée de « 5/2 × » sur cette même ligne —, et enfin le
résultat seul. Le moteur, lui, en comptait CINQ : après la parenthèse
résolue (`rn/rd`, sans le « 5/2 × » qui se serait pourtant lu juste à côté
sur le papier), une case de décomposition (`pfProduitHTML`, « les
numérateurs ensemble, les dénominateurs ensemble ») s'intercalait avant le
résultat — une étape que ni H ni son propre rappel (`RAP_PQD`) n'imposaient
d'écrire séparément une fois qu'on demande déjà le résultat.

**Le « 5/2 × » migre d'une ligne à l'autre, et la décomposition disparaît —
deux changements liés, un seul et même geste.** `pfCroixHTML()` gagne un
neuvième paramètre `teteRn` : collé (par `fEqTete`, déjà utilisé par
`pfProduitHTML`) au « = » qui précède `rn/rd`, il écrit « 5/2 × » ou
« 5/2 ÷ » — l'opérateur RÉEL, avant toute inversion — sur la ligne où la
parenthèse vient tout juste de se résoudre, exactement comme le papier.
`pfProduitHTML()` gagne un `direct` : il saute alors le `prodBox` (les
cases `h1/h2/b1/b2`) et enchaîne l'inverse (I seulement) puis `finalBox`
sans jamais redemander tete — déjà écrit sur la ligne d'avant. H et I
passent tous deux `direct:true` ; G et J, sans modèle papier pour cette
étape, gardent la décomposition par défaut (`direct` faux si omis).

**Un paramètre qui retire des cases du DOM en supprime aussi le JUGEMENT —
sans quoi l'exercice devient IMPOSSIBLE à réussir.** `pfProduitJuge()`
lisait avant `h1/h2/b1/b2` sans condition : sur un DOM qui ne les pose plus,
`pfLu()` y renvoie `NaN`, et `haut`/`bas` seraient retombés à FAUX pour
toujours — un exercice qu'aucune réponse ne peut plus valider. `direct`
saute cette lecture et pose `haut`/`bas` à VRAI d'office ; `pfProduitCases()`
retire ces mêmes IDs de la liste que lit `pfVide()`, sans quoi une case qui
n'existe plus aurait compté comme une case VIDE et bloqué la note à zéro
pour la même raison. `pfProduitPeindre()`/`pfProduitCorrection()`, eux,
n'ont pas eu besoin de ce garde : leurs `col()`/`corTrainDec()` ignorent
déjà silencieusement un ID absent du DOM (`if(!el) return;`) — un bloc
retiré du HTML n'a donc jamais besoin d'être retiré une seconde fois de
CES fonctions-là.

**`RAP_PQD` a perdu la même case que l'écran : sa ligne ③ montrait encore
la décomposition** (`\frac{5\times(-2)}{2\times 15}`) entre la parenthèse
résolue et le résultat — un rappel qui aurait alors enseigné un pas que
l'exercice ne demande plus. Réduite à `\frac{5}{2}\times\frac{-2}{15}=
\frac{-1}{3}`, la ligne dit exactement ce que l'écran demande, ni plus ni
moins.

**Éprouvé en remplissant RÉELLEMENT les cases dans un Chromium, MathLive
chargé depuis le cache local (`tests/.cache/`, jamais le CDN)** — une
capture d'écran seule ne suffisait plus, puisque c'est précisément une
capture d'écran qui avait révélé l'écart la première fois. Quatre copies
jouées sur H et I : une entièrement juste (note pleine, sans passer par
aucune case de décomposition — elle n'existe plus), une avec la fraction
finale fausse de 1 (correctement rejetée, message pointé sur la bonne
case), une avec la fraction finale ÉGALE mais NON simplifiée (×2 au
numérateur et au dénominateur — acceptée, `pfFracJuge()` continue de juger
par produit en croix). Un script de secours avait d'abord échoué en silence
sur les quatre copies : `el.value=…` sur un `<math-field>` non upgradé ne
lève aucune erreur mais n'écrit rien non plus (`pmAdapter()` route
l'écriture par `el.setValue()`, qui n'existe que si MathLive a fini de
charger) — la même leçon que « deux bancs jsdom ne se lancent pas en même
temps », version MathLive : un contrôle qui semble s'exécuter sans rien
mesurer est pire qu'un contrôle qui échoue.

**« Les égalités sont fausses, il manque des opérations » — Turquet,
septembre 2026, sur H, I et J relus en ligne après la fusion précédente.**
Le resserrement en UNE rangée (plus haut dans ce journal) avait déplacé le
« 5/2 × » de {pfProduitHTML} vers {pfCroixHTML}, mais seulement pour la
DERNIÈRE case de la parenthèse (`rn/rd`). Les étapes qui précèdent —
le croisement, puis la valeur de chaque fraction croisée — restaient
chaînées par un « = » nu juste après le « ) » que l'appelant refermait
tout de suite après l'énoncé. Lue au premier degré, la rangée affirmait
« 5/2 × (4/3 − 2/5) = 20/15 − 6/15 » : une égalité fausse d'un facteur
5/2, puisque le membre de droite ne vaut que la PARENTHÈSE, jamais
l'expression entière. {quotient-difference-fractions} (I) portait le même
défaut, en pire : après « 1/2 ÷ [parenthèse] », la case de l'inverse
arrivait nue elle aussi — « = [inverse] » sans jamais redire « 1/2 × » —,
un « = » qui n'annonçait plus RIEN. {quotient-double-fractions} (J)
cumulait les deux avec ses DEUX parenthèses : la case de l'inverse de la
parenthèse de droite ne redisait ni elle, ni celle de gauche.

**Le facteur extérieur ne doit reparaître qu'UNE fois — ni plus tôt, ni
nulle part.** La rustine la plus simple — réécrire « 5/2 × » devant
CHAQUE case — aurait réglé la vérité de chaque « = », mais au prix d'une
fraction à deux étages redessinée trois fois sur la même rangée : la carte
est déjà déclarée à UN seul bloc (`pleineLargeur.chaine`), et {somme-
produit-fractions} (G), qui fait déjà ça avec `a/b` (voir plus haut,
« ② la valeur du produit »), n'a jamais eu à tenir la contrainte des
brackets — H/I/J si. La correction déplace la PARENTHÈSE de l'appelant :
elle ne se referme plus tout de suite après l'énoncé, mais seulement après
que le croisement ET la valeur des fractions croisées ont été écrits — ce
qu'il y a entre les deux parenthèses reste alors STRICTEMENT la
résolution de ce qu'il y avait dedans, sans jamais prétendre valoir
l'expression entière. Le facteur extérieur ne revient qu'une fois la
parenthèse refermée, exactement là où il était déjà juste (la case
`rn/rd` pour H/I, la case de l'inverse pour I/J) — `pfCroixHTML()` gagne
un dixième paramètre `envolver` qui ne fait QUE déplacer ce « ) », sans
toucher une seule case ni le jugement d'aucune d'elles.

**{quotient-double-fractions} (J) ne pouvait pas réécrire la VALEUR de sa
parenthèse de gauche en tête de l'inverse — le même obstacle que la
décomposition, plus haut : ce serait donner la réponse de la case juste
au-dessus.** Elle réécrit l'ÉNONCÉ de la parenthèse (`a/b − c/d`, connu
dès le tirage, jamais calculé par l'élève) plutôt que sa valeur — sûr à
répéter, exactement comme `a/b` pour H et I, et mathématiquement
équivalent une fois sa PROPRE parenthèse refermée par le même `envolver`.

**Le paramètre `tete` de `pfProduitHTML()` existait déjà pour ça — sa
propre documentation le disait — et n'était simplement plus appelé
depuis la migration.** Rien n'a changé dans cette fonction : H continue
de ne rien lui passer (son unique case, la finale, suit directement la
case `rn/rd` déjà tête-collée par `pfCroixHTML()` — lui redonner une tête
aurait redit « 5/2 × » une seconde fois, en trop) ; I et J lui passent de
nouveau un `tete` — `a/b` pour I, l'énoncé de la parenthèse de gauche pour
J — qui se colle à la case de l'INVERSE, la seule qui en manquait.

**Éprouvé en ouvrant réellement les trois exercices dans un Chromium et en
lisant la rangée entière, pas seulement les cases : la fermeture tardive
de la parenthèse et le facteur réécrit devant l'inverse font maintenant de
chaque « = » une égalité vraie**, puis en remplissant les quatre copies
juste (H, I, J) pour vérifier qu'aucune case ni aucun jugement n'avait
bougé — la note reste pleine sans passer par une case qui n'existe plus,
exactement comme avant ce correctif.

**Et Turquet est revenu sur « le facteur extérieur ne doit reparaître
qu'UNE fois » (septembre 2026, troisième session sur H/I) — la solution qui
tenait la LARGEUR a fini par perdre la LECTURE.** Fermer la parenthèse
tard (paragraphe ci-dessus) rend chaque « = » vrai, mais seulement pour qui
sait lire une égalité qui vit ENTRE deux parenthèses encore ouvertes : au
premier degré, la rangée s'ouvre sur « a/b OP ( c/d − e/f » et n'affiche
« a/b OP » nulle part avant le troisième « = » — Turquet a demandé que
CHAQUE « = » remontre la multiplication, `a/b OP ( … )`, complète, et
qu'elle ne disparaisse qu'au DERNIER « = », celui où elle est enfin
EFFECTUÉE. C'est très exactement la « rustine la plus simple » que la
session précédente avait écartée pour la largeur — Turquet l'a redemandée
en connaissance de cause, budget de largeur compris (« quitte à rétrécir
encore »).

**`pfCroixHTML()`/`pfProduitHTML()` restent intacts : {somme-produit-
fractions} (G) et {quotient-double-fractions} (J) les utilisent encore
tels quels.** Une troisième fonction, `pqdRowHTML(q, inv)`, construit
désormais la rangée de H/I seule, en clair plutôt qu'en `envolver`/`teteRn`
empilés : cinq blocs `a/b OP ( … )` de suite — l'énoncé, le croisement, la
valeur des deux fractions croisées, la parenthèse réduite à une fraction
seule, puis (I seulement) son inverse —, et un dernier bloc nu, le
résultat, là où la multiplication est ENFIN effectuée. Les identifiants de
case (`pqd-x-a1`…`pqd-fn`/`pqd-fd`) sont EXACTEMENT ceux que lisent déjà
`pqdJuge`/`pqdCases`/`pqdPeindre`/`pqdCorrection` : rien n'a bougé côté
jugement, seule la mise en page change.

**Une parenthèse aussi haute que ce qu'elle contient, sans mesure JS.**
Écrire `a/b OP (` en texte brut, à côté d'une fraction empilée sur deux
étages, redonnait le même défaut que celui visé par la règle universelle
« les parenthèses sont aussi grandes que ce qu'elles contiennent » : un
« ( » de la hauteur d'un chiffre à côté d'un trait de fraction. `fParen()`
(fonction partagée, à côté de `fEq`/`fEqTete`) enveloppe son contenu dans un
groupe flex (`.f-pgrp`) qui s'étire à la hauteur de son plus grand enfant ;
ses deux bords (`.f-par`) s'étirent avec lui et empruntent leur courbe à un
`border-radius:50%` sur une boîte étroite et haute — un seul bord coloré
(gauche ou droit), les trois autres transparents. Aucune mesure : la
hauteur vient du flex, group par groupe, jamais d'un calcul après coup — et
un groupe voisin plus haut ou plus bas ne change rien à celui-ci.

**La largeur, elle, s'est bien reposée — et résolue par le même geste que la
première fois : rétrécir CE budget-là, pas ailleurs.** `#pqdHost .f-par`
règle sa PROPRE largeur de trait (5 px, 2 px de bord), plus étroite que le
défaut (9 px, 3 px) qui vaut pour tout le reste de la page — la même
doctrine que `#pqdHost .f-whole`/`.f-eq`/`.f-times` juste au-dessus, chacun
son budget. {quotient-difference-fractions} (I), qui ajoute le maillon de
l'inverse, redessine `a/b` CINQ fois sur sa rangée au lieu des quatre de H ;
c'est ce cas, le plus large des deux, qui a fixé le budget.

**Et deux défauts sont revenus sur la première pose de `fParen` (Turquet,
septembre 2026) : les parenthèses étaient trop plates, et le « − » de la
parenthèse ne tombait plus sur le trait des fractions qu'il sépare.**

Un rayon elliptique à 50 % est déjà le maximum que `border-radius` sache
donner — la COURBE ne peut pas s'arrondir davantage, seule sa PROFONDEUR le
peut, et elle dépend de la LARGEUR du trait (`.f-par`), pas de son rayon :
un trait de 5 px ne bombe que de 2,5 px, une courbe à peine perceptible à
côté d'une rangée de plusieurs dizaines de pixels de haut. Le remède est
donc le même geste que celui qui avait tenu la largeur — régler LE MÊME
budget, dans l'autre sens : `#pqdHost .f-par` passe de 5 px/2 px à 9 px/3 px
(le défaut, lui, de 9 px/3 px à 14 px/4 px, plus généreux puisqu'aucun autre
exercice ne partage encore son budget de largeur). Mesuré au banc navigateur,
la rangée tient toujours sous 1400 px avec ce trait plus large.

**Le second défaut venait du GROUPE, pas du trait.** `.f-pgrp` (le conteneur
flex de `fParen`) posait `align-items:stretch` sur LUI-MÊME : ses bords
(`.f-par`) en avaient besoin — c'est tout leur rôle, s'étirer à la hauteur du
contenu —, mais le réglage, posé au niveau du GROUPE, s'appliquait aussi à
tout ce que le groupe enveloppe : une case de croisement, une fraction, et le
signe « − » entre les deux. Étiré à la hauteur du groupe entier plutôt que
centré sur sa propre hauteur, un signe d'une seule ligne ne tombe plus au
milieu — exactement le défaut que la règle universelle « un signe posé à
côté d'une fraction tombe sur son trait » existe pour empêcher, sauf que son
contrôle ne mesure que `.sf-f .bar` (le terme littéral `a/b`), jamais
`.f-frac-input .f-fbar` (les cases de croisement) : un signe qui décroche
LÀ ne fait rougir aucun contrôle existant. La correction déplace
`align-self:stretch` du GROUPE vers ses seuls DEUX bords : `.f-pgrp` revient
à `align-items:center` — son réglage AVANT `fParen` —, et seul `.f-par`
garde `align-self:stretch`. Éprouvé en ouvrant réellement l'exercice dans un
Chromium et en mesurant le milieu du signe contre le milieu du trait sur les
quatre soustractions de la rangée : moins de 0,01 px d'écart, contre plusieurs
pixels avant la correction.

**{produit-difference-fractions} (5.13, « H ») reprend l'irréductibilité des
trois fractions de départ — demande de Turquet, septembre 2026, distincte de
celle qui l'avait retirée (« Les fractions tirées n'ont plus à être déjà
irréductibles », plus haut).** Cette demande-ci ne portait que sur H, pas sur
I : `pqdGen(inv)` ajoute `gcd(a,b)!==1 || gcd(c,d)!==1 || gcd(e,f)!==1` au
tirage, gardé par `!inv` pour ne toucher que le chemin de H — I
({quotient-difference-fractions}, 5.14) garde le relâchement de la fusion
précédente, personne ne l'ayant redemandé pour lui. Le résultat final,
inchangé, n'a toujours pas à être irréductible (la case finale accepte toute
fraction ÉGALE, `pfFracJuge`). Simulé sur 2000 tirages : la contrainte
n'écarte qu'environ les trois quarts des combinaisons, largement assez pour
que la boucle de secours ne se déclenche jamais en pratique ; le repli codé en
dur de H (5/2 × (2/3 − 4/5)) était déjà irréductible sur ses trois fractions,
aucun changement n'y était nécessaire.

**{quotient-difference-fractions} (5.14, « I ») a rejoint H le jour même :
« faire la même chose pour le 5.14 et 5.15 » (Turquet, septembre 2026).**
`pqdGen(inv)` perd le garde `!inv` qui réservait la contrainte à H : les
trois fractions de départ (a/b, c/d, e/f) doivent désormais être déjà
irréductibles pour I aussi, par le même test `gcd(...)!==1`, appliqué avant
le reste du tirage (le croisement, la parenthèse EXIGÉE positive pour I,
etc.). Simulé sur 2000 tirages : environ 12&nbsp;% passent toutes les
conditions d'I (irréductibilité ET parenthèse positive cumulées, plus strict
que H qui accepte une parenthèse négative) — assez pour que
`pqdBuildQuestions` tire ses quatre questions distinctes sans jamais
retomber sur le repli codé en dur, déjà irréductible lui aussi (5/2 ÷
(8/3 − 1/3)). **{quotient-double-fractions} (5.15, « J ») n'a, lui, rien eu à
changer** : `qdbGen()` imposait déjà `gcd(a,b)!==1||gcd(c,d)!==1||
gcd(e,f)!==1||gcd(g,h)!==1` sur ses quatre fractions de départ depuis le
resserrement à 1–5 (plus haut dans ce journal) — la demande y était donc
déjà satisfaite avant même d'être reposée.

**{quotient-double-fractions} (5.15, « J ») écrit à son tour des égalités
VRAIES, comme le 5.14 — « en seconde dans le 5.15 je veux que les égalités
soient vraies mathématiquement comme dans le 5.14 » (Turquet, septembre
2026).** J avait gardé la pose « fermeture tardive de la parenthèse »
(`envolver`, plus haut dans ce journal) que H/I avaient abandonnée à la
troisième session : lue au premier degré, sa rangée s'ouvrait sur
« ( 5/2 − 1/3 = 15/6 − 2/6 = … » — un « = » posé À L'INTÉRIEUR d'une
parenthèse encore ouverte, qui n'affirmait rien de vrai sur l'expression
entière, deux fois de suite, une par parenthèse. La correction est celle de
`pqdRowHTML` pour H/I, transposée à deux parenthèses : une fonction
`qdbRowHTML(q)` réécrit après CHAQUE « = » l'expression ENTIÈRE,
`( … ) ÷ ( … )`, et les DEUX parenthèses avancent DE FRONT — le croisement
des deux, puis la valeur des fractions croisées des deux, puis chacune
réduite à une fraction —, comme on l'écrit sur une copie. La division ne
disparaît qu'au maillon où elle est EFFECTUÉE : « ( a/b − c/d ) × inverse »,
où la parenthèse de gauche se réécrit par son ÉNONCÉ et jamais par sa
valeur, qui est la réponse de la case juste avant (le même obstacle, la
même issue que dans « J ne pouvait pas réécrire la VALEUR de sa parenthèse
de gauche », plus haut). Puis le produit, puis le résultat. Les 26 cases
gardent EXACTEMENT les identifiants de `pfCroixHTML`/`pfProduitHTML`
(`qdb-a-…`, `qdb-b-…`, `qdb-i1`…`qdb-fd`) : `qdbJuge`, `pfCroixPeindre`,
`pfCroixCorrection`, `pfProduitJuge` ne bougent pas d'une ligne. Ce qui
suit l'ordre de LECTURE a été réordonné avec elle : `qdbCases()` (la touche
Entrée passe à la case suivante DANS LA RANGÉE, gauche puis droite, maillon
par maillon — un contrôle du script de mesure a comparé cet ordre à celui du
DOM) et `qdbPourquoi()` (la première case fausse se cherche dans le même
ordre). L'étiquette des étapes passe de cinq à six numéros.

**Le prix, comme chaque fois sur cette rangée, s'est payé en LARGEUR — et
il a d'abord révélé un rognage qui préexistait.** Neuf paires de
parenthèses au lieu de trois : 1517 px mesurés à 1400 px de fenêtre, contre
1288 px de carte — la rangée se repliait, exactement ce que
`pleineLargeur.chaine` (tests/profils.js) interdit. Même geste que pour
`#pqdHost` : rétrécir le budget PROPRE de l'écran. `#qdbHost .f-par` passe
à 7 px/2 px (proportionné à des cases à .85rem comme 9 px/3 px l'est à
celles de pqd à 1.35rem). Puis les cases — et c'est là que la mesure a
parlé : en sondant chaque champ MathLive avec la valeur LA PLUS LONGUE que
`qdbGen` puisse y mettre (« −23 » dans la parenthèse de gauche et le
numérateur du produit, « −500 » dans le numérateur final), le texte d'un
champ commence 7 px après sa marge interne et un caractère y fait ~10 px ;
avec les 8 px de marge de la règle générale `body math-field.dexp-mf`, la
case de 38 px du produit rognait DÉJÀ « −14 » sur `main` — on n'y lisait
que le « − », capture à l'appui. `#qdbHost` règle donc sa marge interne à
2 px et la largeur de chaque case SUR SON CONTENU : 26 px pour les huit
multiplicateurs du croisement (un chiffre, classe `qdb-mult` posée par
`qdbRowHTML`), 46 px pour les cases à trois caractères, 56 px pour le seul
numérateur final. Résultat : 1257 px, sous la carte, et AUCUNE case ne
rogne sa valeur la plus longue (sonde `ML__latex` contre le bord du champ,
sur les 26 cases).

**Éprouvé dans un vrai Chromium avant le banc** : la rangée entière relue
sur capture — chaque « = » y écrit une égalité vraie —, puis une copie
JUSTE remplie case par case via `setValue()` de MathLive (jamais
`el.value=`, voir « un script de secours avait d'abord échoué en silence »
plus haut) : « Bravo, c'est juste ! », 26 cases `ok` sur 26, note 1/1 —
le jugement n'a pas bougé. Le commentaire de tête de l'exercice, qui
affirmait encore que l'écran n'était « PAS déclaré dans `pleineLargeur` »,
disait le contraire de `tests/profils.js` depuis la fusion en une rangée :
corrigé au passage.

**Une case trop étroite pour ce qu'elle contient fait mentir le juge
(5.15, octobre 2026).** Signalé par Turquet sur une capture : dans la
parenthèse de droite, les deux multiplicateurs « 3 » de la seconde fraction
étaient ROUGES, la correction verte à côté disait « 3 », et le message
« … ici 3 — en haut ET en bas ». Le juge avait raison : une des deux cases
contenait « 33 » (deux appuis), et `pfMult` exige que la paire porte le même
nombre — un seul « 33 » rougit les DEUX cases. Mais la case `.qdb-mult` était
FIGÉE à `width:26px`, posée pour tenir le budget de largeur de la rangée :
MathLive faisait défiler son contenu, et l'écran montrait « 3 ». Reproduit au
banc (Chromium, MathLive réel, « 33 » posé dans `qdb-b-b2`) : capture identique
à celle de l'élève. Correctif : `width:auto;min-width:26px;max-width:46px` —
26 px tant qu'il y a un chiffre (le budget de la rangée ne bouge pas, une copie
juste se dessine à l'identique), et la case GRANDIT dès que l'élève écrit plus,
jusqu'au plafond des autres cases de l'écran. C'était la seule case de
mathématiques à largeur figée des trois niveaux.

**Les fractions de DÉPART d'un calcul sont toujours irréductibles — en Seconde
et en Première, et c'est désormais UN contrôle qui le tient partout (octobre
2026).** Demande de Turquet : « pour les exercices sur les fractions, quand on
demande de faire une opération avec des fractions, toujours mettre des
fractions irréductibles au départ de l'exercice. » L'inventaire a montré que
la règle était déjà tenue par huit moteurs sur neuf, chacun à sa manière et
dans son coin : `sfGen` (tous les exercices du moteur sf, dans les deux
niveaux), `pfGen`, `spfGen`, `pqdGen`, `qdbGen`, `tsfGen` par un `gcd(…)!==1`
explicite, `mltGen` et `divGen` par l'irréductibilité du PRODUIT (un facteur
commun à n1 et d1 diviserait aussi P et Q — la condition du produit implique
celle des facteurs). Le neuvième, {revision-fractions} (5.11), tirait ses
huit questions sans aucune condition : « 6/8 + 3/8 », « 4/6 × 3/9 »
sortaient. `rvfTirage` écarte désormais toute fraction réductible de
l'énoncé, type par type (le dénominateur partagé de meme-add/meme-sub doit
être premier avec LES DEUX numérateurs) ; les replis codés en dur l'étaient
déjà. Le résultat attendu, lui, ne change pas : il reste le calcul direct,
non simplifié (`rvfReponse`).

**Le contrôle — « les fractions de départ d'un calcul de fractions sont
irréductibles » (`tests/verifier.js`, greffé après « aucune séance ne pose
deux fois la même question »)** démarre chaque exercice du thème
« Fractions » et chaque identifiant contenant « fraction », soixante fois, et
lit les questions TIRÉES : les paires (numérateur, dénominateur) suivent les
noms des moteurs (a/b … g/h ; n1/d1, n2/d2, n/d ; n1/d, n2/d). Deux bords :
un exercice où il ne reconnaît AUCUNE fraction rougit (un exercice ajouté
demain avec d'autres noms se fait voir au lieu de passer en silence), et une
dispense (`fractionsIrreductibles.sans`, `tests/profils.js`) qui ne désigne
plus d'exercice rougit aussi. Trois dispenses, raison comprise :
{simplifier-barres} (simplifier EST le sujet), {fractions-decimales} (30/100
est le sujet même) et {fraction-pourcentage} (aucune opération). La
Terminale ne déclare pas la règle : le banc l'affiche « non applicable ».
Éprouvé à l'envers : lancé avant le correctif, le contrôle a rougi sur le
5.11 et sur lui seul.

**{revision-fractions} : le RÉSULTAT accepte toute fraction égale.** L'audit
de septembre 2026 : « 1/2 » pour 1/4 + 1/4 valait 1 point sur 3, « 2/4 »
3/3 ; 4/2 ÷ 3/4 → « 8/3 » 3/5, « 16/6 » 5/5 — la consigne ne disait pas
« n'écris pas la fraction simplifiée », et simplifier est le geste enseigné
trois exercices plus haut. `rvfJuste` lit maintenant les deux cases du
résultat ensemble (`rvfResultatEgal` : produit en croix avec `rvfReponse`),
et seules ces deux cases y ont droit — les étapes intermédiaires gardent la
forme brute de la règle, c'est elle que l'exercice fait écrire. Éprouvé dans
jsdom : 8/9 + 1/9 répondu « 1/1 » vaut 3/3.

**Les « importantes » de l'audit, fractions (v422).** Au 5.13, 5.14 et
5.15, les dénominateurs d'une même parenthèse sont tirés premiers entre
eux : avec 2 et 4, le croisement figé attendait 8 quand le PPCM est 4, et la
route du PPCM — celle du cours — rougissait dix cases. Au 5.11, les entiers
tirés valent au moins 2 et aucune division ne se fait par une fraction égale
à 1 (les fractions, elles, sont irréductibles depuis la règle universelle).

**Le garde-fou mort de `divGen` était resté dans le code (audit d'octobre
2026, M55).** Le paragraphe plus haut le dit retiré — « ne pas diviser par 1 »
(`n2 !== d2`) n'écarte jamais rien —, mais la ligne était toujours là. Elle est
retirée, avec ses deux voisines mortes pour la même raison (d2 vaut au moins
2) : « 1 tout rond » (P = Q irréductible impose P = Q = 1, donc d2 = 1) et
« rien à multiplier en haut » (n1 = d2 = 1). Le tirage n'a pas changé d'un
seul résultat ; le contrôle de la division exigeait déjà les deux premiers
bords sur 2 000 tirages, et il exige maintenant le troisième.

**Les « mineures » de l'audit, fractions (Seconde, octobre 2026).**
{fractions-decimales} : la note et la peinture lisaient chacune leur case —
`parseInt` acceptait « 15abc/10 », et la note du niveau 3 comptait juste
« −15/−10 » sous deux cases rouges. `fracDecVerdict` lit par `entierDec`, et
la note des niveaux 2 à 5 EST le `.ok` que rend `marqueFracDec` : une seule
lecture. Le niveau 1 (« sous forme décimale ») n'accepte plus « 1/2 » pour
5/10 ; le niveau 4 dit « ce nombre entier et cette fraction décimale » quand
un facteur est entier. {produit-difference-fractions}, {quotient-difference-
fractions} et {quotient-double-fractions} : `pfFracJuge` refusait 104/44 pour
156/66 (une case « promettait » seulement si elle divisait P ou en était un
multiple) — elle promet désormais quand elle est un multiple de la fraction
IRRÉDUCTIBLE. La correction verte écrit la fraction irréductible (ou complète
la route d'une case juste : 312 en haut appelle 132), le message dit « 156 sur
66, soit 26 sur 11 une fois simplifiée ». `RAP_TSF` va jusqu'à 1/30 et le ④ de
`RAP_RVF` jusqu'à 5/6. Contrôles dans `seconde()` (banc principal).

**{revision-fractions} est passé en Première — thème 4 « Fractions », 4.1
(demande de Turquet, octobre 2026 : « mettre l'exercice de seconde 5.11 en
première dans un nouveau thème fraction ; les nombres au départ doivent être
entre 1 et 5, et comme d'habitude les fractions au départ doivent être
irréductibles »).** La Seconde le GARDE : « mettre en Première » a été lu
comme une copie, pas un déménagement — retirer l'exercice de la Seconde
aurait fait disparaître du menu des notes déjà obtenues. Le moteur est celui
de la Seconde, recopié au mot près, sauf trois écarts nommés dans son
en-tête. ① La borne des nombres de départ vit HORS du moteur, comme `SF_NB` :
`RVF_MAX`, 5 en Première, 9 en Seconde (la constante y a été posée le même
jour, sans rien changer à ses tirages) — dénominateurs de 2 à la borne,
numérateurs de 1 à la borne, entiers de 2 à la borne ; l'irréductibilité
écarte d'elle-même 5/5 et toute fraction égale à 1. Sur des nombres aussi
petits, {div-1} et {div-2} tombaient parfois sur le même calcul : le second
est retiré tant qu'il recopie le premier. ② La note se compte par question
PARFAITE : le `finishTest()` de la Première note sur le nombre de questions,
seule la Seconde lit `maxScore` — garder le barème aux cases (42) aurait
enregistré « 42 / 8 ». La note partielle de chaque question reste lue sur
l'écran (`ptsExo`), comme partout dans ce niveau. ③ Les boutons d'aide ne
s'écrivent pas dans la rangée : `iaBoutons()` les pose sous chaque écran.
Les cases sont des `<input inputmode="numeric">` : le pavé de la page les sert
sur tablette, signe moins compris (le résultat de {diff-sub-entier} est
négatif). `corrChoix()` et `msgAvecVides()` ont été portées avec lui, et les
cases `.f-num`/`.f-den` ont gagné leur règle `.sol` verte dans `#rvfHost` —
ce fichier n'en avait aucune.
Le contrôle `revisionFractions` (banc principal) court désormais sur les deux
niveaux : ce qui diffère se DÉCLARE dans le profil (`revisionFractions` :
numéro, borne, barème), et une seconde mesure tire trois cents séances pour
lire chaque nombre de départ contre la borne — et exige que la borne soit
atteinte, sans quoi elle ne mesurerait qu'un tirage trop étroit.

**Puis, en Première, le résultat du 4.1 s'est SIMPLIFIÉ, sur la même ligne
— octobre 2026** (demande de Turquet : « quand le résultat peut être
simplifié, demander à l'élève de compléter la division qui apparaîtra au
numérateur et au dénominateur du résultat ; s'il rentre un diviseur au
numérateur, l'écrire au dénominateur et inversement, et demander la fraction
simplifiée sur la même ligne d'égalité. Si le résultat peut être encore
simplifié, recommencer le processus »). La Seconde (5.11) n'a pas changé.
La rangée continue : `… = [a]/[b] = (a ÷ [k])/(b ÷ [k]) = [a′]/[b′] = …`.

* **Le diviseur est au choix de l'élève** : tout entier > 1 qui divise le
  numérateur ET le dénominateur est juste (case `kind:'div'`, `bon` = le
  PGCD, qui ne sert qu'à la correction). Diviser 6/12 par 2 est juste et
  laisse 3/6 : une nouvelle étape s'ouvre alors (`rvfMajSimp`, qui redessine
  la rangée en gardant toutes les saisies et la case où l'on écrit), jusqu'à
  la fraction irréductible. Un diviseur vide ou faux ferme la chaîne ; la
  correction y écrit le PGCD, qui finit d'un coup.
* **Le diviseur s'écrit deux fois, et se recopie** (`rvf-sI-dn` ↔
  `rvf-sI-dd`) ; l'ordre d'ENTRÉE saute la copie.
* **Les nombres divisés ne sont PAS écrits par la page** : ils recopient la
  fraction d'avant telle que l'élève l'a écrite (`rvfMiroirs`, « … » tant
  qu'elle est vide). Les écrire aurait donné la réponse des deux cases
  précédentes. `restoreBoxes()` rappelle `rvfMiroirs()` après une reprise.
* **Les diviseurs sont RANGÉS dans la question** (`q.sdiv`, des chaînes) :
  le nombre d'étapes dépend de ce que l'élève a écrit, et la reprise d'une
  pause doit redessiner les mêmes étapes AVANT que `restoreBoxes()` y remette
  les saisies — rangés ailleurs, les cases de la seconde étape n'existeraient
  pas encore au moment d'être remplies.
* **Le résultat brut devient une étape** : quand il se simplifie,
  `rvf-num`/`rvf-den` attendent le calcul direct (l'égalité de fractions
  n'y est plus acceptée — la simplification qui suit la fait). Un résultat
  irréductible garde l'ancienne règle, et aucune étape.
* Le libellé gagne « simplifier », même pour les trois types à une seule
  case ; l'énoncé, le rappel (⑤), le pourquoi et le contexte du modèle le
  disent aussi.

Contrôle : « le résultat se simplifie par étapes » (`tests/verifier.js`,
déclaré par `revisionFractions.simplifier` dans `tests/profils.js`) — deux
temps (÷2 puis ÷3), un temps (÷6), un diviseur faux (rouge, correction 6), un
diviseur vide (ne rougit pas), la reprise (`q.sdiv`), et un résultat
irréductible sans étape. Éprouvé par sabotage : la chaîne arrêtée après la
première division rougit sur six points.

**Puis la Première a perdu ses nombres négatifs — 4.1, quatrième écart
(octobre 2026, v304).** Demande de Turquet : « ne pas avoir de résultat
intermédiaire ou final négatif ». Deux types en donnaient. {meme-sub} tirait
deux numérateurs DISTINCTS, dans n'importe quel ordre : 1/5 − 4/5 sortait une
fois sur deux. Il tire désormais n1 > n2. {diff-sub-entier} était pire : sur
des nombres de 1 à 5, « n1/d1 − k » ôte un entier d'au moins 2 à une fraction
qui vaut au plus 5/2, et k×d1 vaut au moins 4 — le résultat n'était positif
que pour 5/2 − 2, la seule exception du tirage. Restreindre le tirage aurait
posé ce même calcul à chaque séance ; l'ordre s'est RETOURNÉ à la place :
« k − n1/d1 », entier devant. Les étapes restent les mêmes cases, dans le
même ordre d'écriture (k/1, puis (k×d1)/(1×d1), puis le produit calculé),
simplement posées à gauche du signe : seul le numérateur final change
(k×d1 − n1), et il est positif sauf quand k×d1 ≤ n1 (2×2 contre 5), que le
tirage écarte. Une question rangée en pause avant ce changement se rouvre
retournée, juste : on range les nombres, jamais la réponse. La Seconde garde
« n1/d1 − k » et ses négatifs : la demande ne la visait pas.
Le profil le DÉCLARE (`revisionFractions.positif`), et le contrôle
« aucun résultat intermédiaire ou final négatif » tire trois cents séances,
lit chaque case attendue de chaque question et recalcule le numérateur final
par sa propre arithmétique ; sans la déclaration, il se dit non applicable.
La copie juste fixe du contrôle des étapes (1 − 1/4) attend 3/4 en Première,
−3/4 en Seconde — la même fixture, lue selon le profil.

**Puis le thème 4 de la Première a reçu quatre exercices de la Seconde —
4.2 à 4.5 (octobre 2026, Première v307, Seconde v438).** Demande de Turquet :
« en première mettre les exercices de seconde 5.2 ; 5.3 ; 5.6 ; 5.8 dans le
thème fraction de première. Il faut que tous les nombres au départ soient
entre 1 et 5 ; qu'il n'y ait pas de résultat intermédiaire ou final en
négatif. Les fractions au début doivent être irréductibles ; si le résultat
peut être simplifié, proposer les simplifications comme dans l'exercice de
première 4.1. » Comme au 4.1, « mettre en Première » est une copie : la
Seconde garde ses quatre exercices, inchangés.

* **{croiser-denominateurs} (4.2) et {somme-fractions-2} (4.3)** tournent sur
  le moteur sf, PARTAGÉ au caractère près avec la Seconde (le contrôle « le
  moteur des fractions est identique dans les deux niveaux » le tient). Le 5.3
  de la Seconde s'appelle {somme-fractions}, mais cet identifiant vit déjà en
  Première au 1.9 (calcul mental) : un exercice ne vit que dans un thème, et
  ses notes portent l'IDENTIFIANT. Le 4.3 en a donc un neuf, et le 1.9 ne
  change pas (nombres de 1 à 9, pas de chaîne). Les flèches du croisement
  (`crdDecorer` et ses voisines) et leur feuille de styles sont recopiées.
* **{multiplier-fractions} (4.4) et {diviser-fractions} (4.5)** : le moteur
  mlt de la Seconde, RECOPIÉ — il n'existait pas en Première —, avec quatre
  écarts nommés dans son en-tête (borne, produit qui se simplifie, tirage par
  `distinctes(dmNbQuestions(MLT_NB), …)`, pas de version rédigée).
* **La borne** est un paramètre de `sfGen(op, mode, max)` (9 par défaut : la
  Seconde ne change pas d'un tirage) et `FRAC_MAX` (5) côté Première.
  **Rien de négatif** : `sfGen` écartait déjà les différences négatives ; un
  produit ou un quotient de fractions positives l'est. **Départ
  irréductible** : `sfGen` le tenait déjà, `mltGen`/`divGen` le testent
  désormais fraction par fraction — l'irréductibilité du PRODUIT, qui
  l'impliquait en Seconde, n'est plus exigée.
* **La simplification par étapes** reprend le geste du 4.1 (`rvfSimpPas`,
  `rvfMajSimp`) dans un module partagé par les deux moteurs, `se…` (Première
  seulement) : `… = [a]/[b] = (a ÷ [k])/(b ÷ [k]) = [a′]/[b′] = …`, diviseur au
  choix, recopié en haut et en bas, nombres divisés recopiés de la fraction
  d'avant, étape suivante tant que la fraction se simplifie, diviseur vide ou
  faux corrigé par le PGCD, fraction brute et diviseurs RANGÉS dans la
  question (`q.sbrut`, `q.sdiv`) pour la reprise. Le moteur sf l'appelle par
  des lignes gardées (`test.etapes && typeof seJuge==='function'`), exactement
  comme il appelait déjà `crdDecorer` : la Seconde ne pose jamais
  `test.etapes`, et ces lignes y sont lettre morte.
* **La fraction à simplifier d'une SOMME dépend de la route.** Avec des
  nombres de 1 à 5, une somme sur le PLUS PETIT dénominateur commun n'est
  jamais réductible (seul le couple 2 et 4 partage un diviseur, et
  n1/2 + n2/4 = (2·n1 + n2)/4 a un numérateur impair, n2 étant impair) — la
  chaîne ne naît donc que si l'élève prend un dénominateur plus grand :
  1/2 + 1/4 par 8 donne 6/8, qui se simplifie. Le dénominateur commun restant
  libre, la chaîne apparaît et disparaît PENDANT la saisie (`seMaj`, branché
  sur les évènements « input » de l'hôte). Pour un produit ou un quotient, la
  fraction brute ne dépend que de l'énoncé : la chaîne est posée d'emblée,
  comme au 4.1.
* **Quand la fraction obtenue se simplifie, la dernière case attend le calcul
  TEL QUEL** (6/8, pas 3/4) : c'est la chaîne qui simplifie. Une fraction
  irréductible garde la règle de la Seconde (toute fraction égale).

Contrôles : « le thème Fractions : nombres de 1 à 5, rien de négatif, et la
simplification par étapes » (`tests/verifier.js`, déclaré par
`fractionsEtapes` dans le profil de la Première) — deux cents séances par
exercice, lancées par les VRAIS démarreurs, chaque nombre de départ lu contre
la borne (et la borne atteinte), l'irréductibilité, et chaque nombre
intermédiaire recalculé par une arithmétique propre ; puis la chaîne de la
somme (par 4, 8 et 16), du produit et du quotient, par de vrais évènements
« input ». `multiplierFractions` se déclare désormais par niveau
(`multiplierFractions` : borne, simplification, version rédigée). Le banc
navigateur (« 6 terdecies bis ») TAPE la chaîne au clavier dans les vraies
cases MathLive — 1/2 + 1/4 par 8, 2/3 × 3/5 — et exige la note et aucune
case rouge ; « 6 terdecies » (les flèches qui se croisent) court maintenant
sur les deux niveaux.

**Puis le 5.12 de la Seconde est devenu le 4.6 de la Première —
{somme-produit-fractions} (octobre 2026, Première v308).** Demande de
Turquet : « reprendre le 5.12 de seconde et le mettre en première, les
nombres doivent être entre 1 et 5, les fractions au départ sont
irréductibles, dans les fractions intermédiaires les nombres ne peuvent pas
dépasser 6 et sont positifs. Si on peut simplifier la fraction à la fin,
présenter comme dans le 4.1 de première. De plus les cases où l'on place des
nombres doivent être plus petites à l'écran. » La Seconde garde son 5.12,
inchangé ; l'identifiant est le même, libre en Première.

* **« Pas plus de 6 » porte sur le PRODUIT.** La somme se met au même
  dénominateur en CROISANT : avec des dénominateurs d'au moins 2, et un
  produit dont le dénominateur vaut au moins 2 × 2 = 4, le dénominateur
  croisé vaut au moins 8. La borne ne pouvait donc pas tenir sur TOUTES les
  fractions intermédiaires ; la question a été posée, et Turquet a choisi
  « 6 sur le produit seul » (`SPF_INTER`). Le produit restant irréductible
  (comme en Seconde), il ne reste que des produits sur 4 ou sur 6 —
  1/2 × 3/2, 5/2 × 1/3… — et la variété vient de la première fraction.
* **La fin se simplifie comme au 4.1** : la case de la fraction obtenue
  attend le calcul TEL QUEL (10/8), puis la chaîne `se…` — une entrée de
  plus dans `SE_CFG`, `spf` — le simplifie sur la même ligne. La fraction
  brute ne dépend que de l'énoncé (le croisement est figé) : la chaîne est
  posée d'emblée, comme pour le produit. Un résultat irréductible garde la
  règle de la Seconde (toute fraction égale) ; un résultat entier est écarté.
* **Les cases plus petites** : la règle de tout exercice veut que la case ait
  la taille des nombres qui l'entourent — c'est donc toute la rangée qui
  descend d'un cran (1,45 rem au lieu de 2), cases, chiffres et signes, et le
  cadre de la case se resserre (`#spfHost`). C'est aussi la rangée la plus
  longue du thème.
* Les blocs `pfCroix…` et les lecteurs `pfLu`/`pfPaire`/`pfMult`/`pfVide`
  sont recopiés de la Seconde pour ce seul exercice, sans les variantes
  (`deux`, `teteRn`, `envolver`) que seuls H, I et J utilisent. Le peintre
  juge chaque case seule (la Seconde peignait la paire du haut d'un seul
  verdict en vérification).

Contrôle : « {somme-produit-fractions} : nombres de 1 à 5, produit borné à 6,
et la simplification par étapes » (`tests/verifier.js`, déclaré par
`sommeProduit` dans le profil de la Première) — deux cents séances par le
vrai démarreur, puis 1/2 + 1/2 × 3/2 = 10/8 = 5/4 tapé par de vrais
évènements « input ».

**Puis le 4.3 de la Première a reçu sa question RÉDIGÉE, sur la même page
(octobre 2026, Première v309, Seconde v471).** Demande de Turquet : « en
première dans le 4.3 ; après avoir fait une question, poser sur la même page
une nouvelle question avec les mêmes critères mais où il faut rédiger la
solution comme dans l'exercice 5.5 en seconde ; on mettra un "=" derrière le
calcul proposé dans la case de la rédaction. »

* **Les questions vont par PAIRES dans `test.questions`** (`sfrBuildQuestions`) :
  une guidée, puis une rédigée (`q.redac`), toutes deux tirées par `sfGen`
  avec la borne `FRAC_MAX` et la même opération — « les mêmes critères » —,
  toutes distinctes ; l'opération alterne d'une paire à l'autre. Chacune vaut
  un point et porte sa réponse : la note, la pause, la reprise et la coupe
  d'un devoir suivent la liste sans rien savoir des paires. La séance passe
  de 6 à 12 questions.
* **La rédigée s'ouvre SOUS la guidée** : deux lignes gardées du moteur sf
  (`test.redac && typeof sfrMonte/sfrRendu === 'function'`), écrites dans les
  deux fichiers pour que le moteur reste identique au caractère près — lettre
  morte en Seconde, comme les flèches du croisement. `sfrMonte` est appelée
  par `checkSFAnswer` une fois la guidée notée, à la place de « Question
  suivante » ; `sfrRendu`, en tête de `renderSFTest`, vide la zone sur une
  guidée et, à la reprise d'une pause posée sur une rédigée, ne montre que la
  rédaction (la guidée qui la précédait est déjà notée).
* **La feuille** est `mlFeuille` ; sa première ligne porte la somme SUIVIE
  DE « = » (`test.sfrDepart`), modifiable ; une copie où rien n'a été ajouté
  n'est pas lue.
* **Le juge** est celui du 5.5, `libreJuge` et ses voisines, RECOPIÉ sans
  retouche, genre « sfl » : étape du même dénominateur exigée, résultat
  irréductible, aucune égalité fausse ; le modèle ne rédige que le
  commentaire. Le résultat du 4.3 est irréductible sur le plus petit
  dénominateur commun : seul un dénominateur plus grand oblige à simplifier.
* **La réponse rédigée ne passe pas par `ptsExo()`** : l'écran porte encore
  les cases peintes de la guidée, qui ne sont pas cette réponse-là. Une
  rédaction vaut tout ou rien.
* Son énoncé (`#sfrPrompt`) se déclare `enonce-suite` : c'est le second
  énoncé du même écran.

Contrôles : le contrôle du tirage du thème (`tests/verifier.js`, ①) lit
désormais aussi les questions rédigées — mêmes bornes, mêmes
irréductibilités, sans rien déclarer ; le banc navigateur (« 6 terdecies
bis ») vérifie que la zone s'ouvre sous la guidée restée affichée, que la
feuille commence par la somme suivie de « = », qu'une copie juste
(1/2 + 1/3 = 3/6 + 2/6 = 5/6) vaut le point, et que la zone disparaît à la
guidée suivante.

**Puis les 4.4, 4.5 et 4.6 de la Première ont reçu la même question
rédigée (octobre 2026, Première v310).** Demande de Turquet : « faire la
même chose pour les 4.4 ; 4.5 et 4.6 en première ».

* **Un seul module pour trois moteurs** (sf, mlt, spf) : `RED_CFG` dit où vit
  chaque écran (les éléments de la zone portent le préfixe `sfr`, `mltr` ou
  `spfr` — les trois zones sont dans la page en même temps), `redMath(q)` dit
  la mathématique de chaque exercice : l'énoncé (texte, LaTeX, écran), le
  juge, et ce que lit le modèle. Les noms `sfr…` sont restés ceux du 4.3 :
  le moteur sf, partagé au caractère près avec la Seconde, les appelle ainsi.
  Les moteurs mlt et spf, propres à la Première, ont reçu les deux mêmes
  lignes gardées (`sfrRendu` en tête du rendu, `sfrMonte` après la note).
* **Les paires passent par `redPaires(n, générateur)`** :
  `mltBuildQuestions`, `divBuildQuestions` et `spfBuildQuestions` tirent
  désormais 12, 12 et 8 questions. **Le réglage « Questions » d'un devoir
  compte les rédigées** : k questions tirent ⌈k/2⌉ paires, et la coupe
  générique en garde k — c'est ce qui laisse passer le contrôle « la séance
  s'allonge exactement de deux ».
* **Le résultat final doit être irréductible partout** (`redIrreductible`).
  Le juge de la Seconde ne regardait que la VALEUR pour un produit ou un
  quotient — en Seconde le résultat tombait toujours irréductible. Ici
  2/3 × 3/5 = 6/15 doit aller jusqu'à 2/5.
* **Le 4.5 exige l'inverse écrit** (`libreJuge`, genre « dll ») : sans lui le
  juge s'abstient et le modèle décide, comme en Seconde.
* **Le 4.6 prend le juge du 5.10 de la Seconde** (`pfJuge`, recopié sous le
  nom `spfrJuge`) : une ligne qui vaut le produit intermédiaire n'est pas une
  égalité fausse, une addition faite avant la multiplication l'est ; l'étape
  du même dénominateur est exigée.

Contrôles : « les questions rédigées des 4.3 à 4.6 » (`tests/verifier.js`,
`fractionsRedigees`) lance les quatre démarreurs réels — alternance des
paires, nombre de questions, zone présente sur l'écran — puis écrit une
copie à la main par bord de chaque juge (juste, arrêtée sur une fraction
réductible, égalité fausse, quotient sans inverse, produit isolé sur sa
ligne, addition avant la multiplication), et vérifie qu'un devoir réglé à 5
questions en tire 6 pour en garder 5. Le banc navigateur (« 6 terdecies
bis ») ouvre la rédigée du produit sous sa guidée, et celle du 4.6 par la
reprise d'une pause, et y fait compter une copie juste.

**Puis les cases du 4.3, du 4.4 et du 4.5 ont été RÉDUITES (octobre 2026,
Première v311).** Demande de Turquet : « en première dans les exercices 4.3 ;
4.4 ; 4.5 réduire la taille des cases où l'on doit placer des nombres à
l'écran » — les mêmes mots que pour le 4.6, et donc la même réponse : la
mesure de `#spfHost`, reprise au chiffre près.

* **La rangée entière descend d'un cran**, pas la case seule : la règle de
  tout exercice veut que la case ait la taille des nombres qui l'entourent
  (le contrôle universel la mesure à 90 %). Chiffres et « = » à 1,45 rem au
  lieu de 2, signes à 1,15 rem, cases à 1,4 rem, cadre resserré (36 px de
  haut au lieu de 46, largeur au contenu avec un minimum de 40 px, trait à
  3 px, badge de correction à 0,95 rem avec ses marges réduites). Sur
  téléphone, un cran de moins encore, comme au 4.6. Le facteur de la
  tablette (`--tab-nb`) reste dans chaque règle.
* **Le 4.3 partage son écran avec le 4.2 et le 1.9** (`#sfHost`, moteur sf
  identique à la Seconde au caractère près) : une classe de plus dans le
  rendu aurait cassé l'identité du moteur, une règle sur `#sfHost` aurait
  réduit les trois. La règle se pose donc sur l'ÉCRAN, par l'exercice qu'il
  porte : `show()` écrit `currentTestId` dans `data-exo` de la section,
  au démarrage comme à la reprise après une pause (les deux passent par
  `show()`), et le sélecteur est
  `#scr-sf[data-exo="somme-fractions-2"] #sfHost …`. Le 4.2 et le 1.9
  gardent leurs cases pleines ; le 4.2 n'était pas dans la demande.
* **Le 4.4 et le 4.5** ont `#mltHost` pour eux seuls : leurs tailles y sont
  remplacées, et les deux requêtes média qui les rétrécissaient à 900 et
  520 px (1,5 rem, 76 et 62 px) disparaissent — la case est déjà au-dessous,
  et sa largeur suit son contenu.
* **Le 4.1** (`#rvfHost`) n'est pas touché : il n'était pas nommé.

Contrôle : « les cases réduites sont plus petites que celles du témoin, qui
garde les siennes » (banc navigateur, « 6 terdecies ter », déclaré par
`casesReduites` dans le profil de la Première : le témoin est le 4.2, les
réduits le 4.3, le 4.4, le 4.5 et le 4.6). Il MESURE à l'écran, en
entraînement, la police et la hauteur des cases de la rangée : réduites à
80 % au plus et 6 px de moins que le témoin ; le témoin à 1,8 rem et 44 px
au moins ; et chaque case réduite à la taille de ses nombres. Deux bords,
parce qu'un sélecteur trop large (`#sfHost` nu) réduirait le 4.2 sans que
le premier bord ne bouge — c'est le second qui l'attraperait. Éprouvé par
sabotage : la ligne `data-exo` retirée de `show()`, le 4.3 garde ses
grandes cases et le contrôle rougit sur lui seul.

**Puis le 4.6 a reçu une soustraction et ses colonnes (octobre 2026,
Première v312).** Demande de Turquet : « dans le 4.6 en première, il est
possible d'avoir une soustraction au lieu d'une addition, mais le résultat
doit être positif. De plus placer les signes "=" en début de ligne et
afficher les cases à remplir en dessous verticalement des nombres du dessus
correspondants au mieux. De plus il faut sur la même page une autre question
où il faut rédiger la solution comme dans l'exercice 4.3 de première. » Le
troisième point était déjà en ligne, par le module commun du paragraphe
précédent (v310) : la branche « spf » de `redMath` a seulement appris à lire
`q.op`. Deux branches avaient travaillé en même temps sur la même page ; la
fusion a gardé le module commun, et jeté le calque que l'autre avait écrit.

* **L'opération vit dans la question (`q.op`, « + » ou « − »)** et alterne
  d'une paire à l'autre : `spfGen(op, i)` lit le rang que `distinctes()` lui
  passe, si bien que `redPaires(SPF_NB, spfGen)` n'a rien à savoir — la
  guidée et sa rédigée posent la même opération. Le tirage écarte toute
  différence négative ou nulle — « le résultat doit être positif » —, et le
  croisement ne soustrait donc jamais au-dessous de zéro non plus
  (N1 − N2 = N > 0). Le juge, le peintre et la correction du croisement
  (`pfCroixJuge`, `pfCroixPeindre`, `pfCroixCorrection`) savaient déjà
  soustraire : ils venaient de la Seconde avec leur `op`, que le 5.12
  n'appelait qu'avec « + ». Le message « il reste à additionner » dit
  « soustraire » quand il faut ; le libellé des étapes, l'énoncé, le
  contexte envoyé à l'aide, la branche « spf » de `redMath` (énoncé, LaTeX,
  règle, contexte de la rédigée) et le rappel de cours (`RAP_SPF`) nomment
  la différence. La question porte aussi `Nr`/`Dr`, sa forme irréductible.
  Le juge de la rédigée (`spfrJuge`) n'a pas bougé : il compare des VALEURS,
  et « 3/2 − 1/2×3/2 » vaut 3/4 pour `libreEval`, qui connaît la priorité
  des opérations — la copie qui soustrait avant de multiplier écrit une
  égalité fausse, que le juge nomme.
* **Le calcul se lit EN COLONNES.** La rangée `.pt-row` de `#spfHost` est
  une GRILLE de quatre colonnes — le « = », le premier terme, le signe, le
  second terme —, une ligne par étape, `align-items`/`justify-items` au
  centre : la case tombe sous le nombre qu'elle remplace, « au mieux », et le
  « = » ouvre chaque ligne. La ligne de l'énoncé n'en a pas (sa première
  colonne reste vide). Les étapes à un seul terme — la somme, la fraction
  obtenue, la simplification — se posent dans la colonne du premier terme.
  Le HTML ne fait que NOMMER la colonne de chaque morceau (`spf-eq`,
  `spf-t1`, `spf-op`, `spf-t2`, posés par `spfCol`) ; `pfCroixHTML` écrit
  désormais ces trois lignes-là plutôt que la rangée de la Seconde — son
  juge n'a pas bougé d'une lettre. La simplification par étapes
  (`seEtapeHTML`) rend des groupes « = fraction » (`.f-grp.se-etape`) :
  `display:contents` les efface et leurs deux enfants prennent les colonnes 1
  et 2 — le moteur partagé n'a rien eu à apprendre. Un piège de grille à
  connaître : le placement automatique ouvre une nouvelle ligne dès qu'un
  morceau à colonne fixée recule (le « = » de la colonne 1 après un second
  terme de la colonne 4), et c'est ce qui range les étapes sans qu'aucune
  ligne soit déclarée.

Contrôles : le contrôle du tirage (`tests/verifier.js`, « nombres de 1 à 5,
produit borné à 6… ») exige les DEUX opérations en deux cents séances, le
résultat recalculé selon l'opération et strictement positif, `Nr`/`Dr`
rangés, les paires guidée PUIS rédigée de la même opération ; il joue la
soustraction 3/2 − 1/2 × 3/2 = 6/8 = 3/4 par de vrais évènements « input »,
et refuse 18/8 (additionné) avec le mot « soustraire » ; il compte les « = »
de la grille et vérifie que la ligne de l'énoncé n'en a pas. Le contrôle des
rédigées (`fractionsRedigees`) juge une soustraction rédigée juste, refuse
6/4 + 3/4 = 9/4 et la soustraction faite avant la multiplication, et relit
l'énoncé, le LaTeX, la règle et le contexte de la soustraction. Le banc
navigateur (« 6 terdecies bis », ③) MESURE la grille : chaque « = » est le
premier morceau de sa ligne, les centres des premiers termes, des signes et
des seconds termes tombent sur la même verticale à 2 px près, huit lignes,
rien ne déborde ; puis il tape la copie au clavier, ouvre la rédigée, y écrit
une soustraction juste, referme la zone, et rejoue la reprise sur une
rédigée.

**Puis le 4.6 a accepté un dénominateur commun plus petit (octobre 2026,
Première v313).** Demande de Turquet, sur une capture : « en première dans le
4.6 accepter la méthode où l'élève met un dénominateur commun plus petit. »
Sur 1/2 + 1/2 × 5/2 = 1/2 + 5/4, l'élève avait écrit 1 × 2 / 2 × 2 + 5 × 1 /
4 × 1 — le plus petit multiple commun, 4, la route du cours — et ses quatre
cases rougissaient, la correction écrivant 4 et 2 : le croisement, 8, que le
juge de la Seconde exigeait tel quel (`pfMult(a1,b1,s)`).

* **La règle est celle du 4.2 (`sfJuge`), recopiée dans `pfCroixJuge`.** Une
  paire se juge sur ce qu'elle PROMET (le dénominateur qu'elle produit doit
  être un multiple de l'autre), ×1 est une paire comme une autre, l'accord
  entre les deux paires n'est exigé que lorsque les deux mènent quelque part
  (×4 et ×1 — 8 et 4 — restent fausses toutes les deux), le dénominateur
  écrit est juste s'il est multiple des deux et ne contredit pas une paire
  qui tient, et les numérateurs se jugent sur la ROUTE de l'élève — le
  dénominateur écrit, sinon celui que les paires annoncent, sinon le
  croisement. Le juge rend la route (`Dc`, `m1`, `m2`, `N1`, `N2`, `R`) : le
  message (« sur 4, c'est × 2 ») et la correction en vert
  (`pfCroixCorrection(pref, cx)`) la suivent, et sur des cases vides c'est le
  croisement, comme avant.
* **La fraction brute à simplifier dépend donc de la route**, comme pour la
  somme du 4.2 : `SE_CFG.spf.brut` lit `spfJuge(q).se.F` (`spfBrut` et `pfMult`,
  qui exigeaient le croisement, ont disparu). Sur des cases vides la route est le croisement, donc 14/8 montre
  sa chaîne d'emblée — le contrôle de v308 le demande toujours — et elle
  disparaît quand l'élève passe par 4 (7/4 est irréductible) ; passé par 6,
  1/2 + 5/6 donne 8/6, et la chaîne naît là, sur la fraction de l'élève
  (`q.sbrut` = « 8/6 »). Un piège à connaître : `pfCroixJuge` décide lui-même
  si la fraction obtenue est exigée telle quelle (la route se simplifie et la
  chaîne est en service) — le drapeau `estFinal` qu'on lui passait d'avance
  ne pouvait plus l'être, puisque la route n'est connue qu'en lisant les
  cases.
* Le libellé de la rangée, la description du menu, le rappel de cours
  (`RAP_SPF`, un exemple par 4) et le contexte envoyé au modèle (`ctxSpf`,
  qui nomme aussi la somme sur le plus petit dénominateur commun) disent que
  les deux méthodes sont acceptées.

Contrôle : « {somme-produit-fractions} : nombres de 1 à 5, produit borné à 6,
et la simplification par étapes » (`tests/verifier.js`, ③) joue la capture —
2/4 + 5/4 = 7/4 vaut le point, aucune case ne rougit, la chaîne posée pour
14/8 a disparu —, la soustraction 6/4 − 5/4 = 1/4 par le même chemin, la
route par 6 de 1/2 + 5/6 (chaîne d'une étape sur 8/6, 4/3 tel quel refusé),
×3 sous 1/2 qui rougit seul à côté d'un ×1 bleu (message et correction sur
la route par 4, sans chaîne à 7/4), ×4 et ×1 qui rougissent ensemble, et la
correction du croisement sur des cases vides. Éprouvé par sabotage, le
contrôle rejoué sur la page de `main` (v312) : la copie de la capture y
rougissait ses neuf cases de croisement, le verdict disait « il manque des
cases » (la chaîne de 14/8 restait posée sous 7/4), et la route par 6 rangeait
16/12 au lieu de 8/6.

**Puis le thème 4 de la Première s'est écrit d'UNE SEULE ENCRE (octobre
2026, Première v315).** Demande de Turquet : « en première je veux que pour
tous les exercices dans le thème fraction, les nombres aient la même taille
et la même police, de l'énoncé jusqu'à la fin de l'exercice, et pour les
cases à remplir aussi ». Trois écritures se croisaient sur le même écran,
chacune héritée d'une décision prise dans son coin : l'énoncé écrivait ses
fractions en Fredoka à 1,33 rem (`.sf-f` à 0,92 em d'un `.f-frac` à 1,45)
entre des mots en Nunito ; la rangée en Fredoka à 2 rem (4.1, 4.2) ou
1,45 rem (4.3 à 4.6, les « cases réduites » de la veille) ; les cases
MathLive en Nunito GRAS — la règle `.ML__cmr` que `FIELD_FIX_CSS` injecte
dans chaque case, pour tout le niveau ; la feuille de la question rédigée à
2 rem ; le badge de correction à 0,95 rem.

* **Une police, une graisse, une taille, déclarées UNE fois** sur l'écran du
  thème (`.screen[data-theme="Fractions"]`, bloc « UNE SEULE ENCRE ») :
  Fredoka 600 — la police des nombres de tout le niveau — à 1,45 rem, la
  mesure des cases réduites, qui gagne le 4.1 et le 4.2 au passage. Tout ce
  qui porte un nombre ou un signe du calcul la lit : `.f-frac` et `.sf-f`
  (l'énoncé comme la rangée), `.f-whole`, `.f-eq`, `.f-times`, le `<b>`
  qui suit une fraction dans l'énoncé (le signe, jamais un mot — le 4.1 a
  des `<b>` de texte, sans fraction devant), le `b.spf-op` de la grille du
  4.6, les `<input>` du 4.1, les
  `math-field`, le badge `.mf-cor`, le préfixe « = » et le champ de la
  feuille rédigée. Les deux sortes de cases ont la même hauteur, bord
  compris (`--fx-case`, 42 px : la hauteur naturelle d'un champ MathLive à
  cette taille, donnée aux `<input>`).
* **La police ENTRE dans les cases par une variable.** Une règle de la page
  ne traverse pas le shadow DOM de MathLive ; une propriété personnalisée,
  si. `FIELD_FIX_CSS` écrit désormais
  `.ML__cmr{font-family:var(--mf-police, Nunito…);font-weight:var(--mf-graisse,700)}` :
  le thème pose `--mf-police`/`--mf-graisse` sur son écran, les cases les
  héritent ; partout ailleurs, la variable est absente et la case garde son
  Nunito gras. Le champ de la feuille rédigée (`dexp-mf`) y passe aussi.
* **L'écran porte le THÈME.** `show()` écrit le nom du thème de l'exercice
  dans `data-theme`, comme il écrit déjà l'identifiant dans `data-exo`.
  `#scr-sf` est partagé avec le 1.9, qui n'est pas du thème et garde ses
  tailles pleines ; un exercice ajouté demain au thème reçoit l'encre sans
  rien déclarer, sur un écran neuf comme sur un écran partagé. Les règles à
  IDENTIFIANT de `#sfHost` gagneraient sur celles du thème : elles lisent
  donc `--fx-base` (leur propre taille en repli), et les écrans propres au
  thème (rvf, mlt, spf) n'écrivent plus aucune taille — les blocs « cases
  réduites » et les tailles de `#spfHost` ont disparu.
* **Le facteur de la TABLETTE s'applique à l'énoncé aussi**, pour ce thème
  seul : « de l'énoncé jusqu'à la fin » ne tiendrait pas sur une tablette
  où la rangée descend de 15 % et l'énoncé non. `--tab-nb` est donc posé
  une seconde fois, sur l'écran entier du thème, à la même valeur et sous
  la même requête média que le stage — l'exception déclarée
  (`chaineTablette.ecransEntiers`) à « après l'énoncé », que le banc jsdom
  vérifie telle quelle (même valeur, même requête, sélecteur d'écran
  déclaré) et qu'il refuse ailleurs. Chaque règle de taille multiplie
  elle-même `--fx-base` par le facteur : un `--fx` composé une fois sur
  l'écran aurait été plus court, mais le contrôle exige que CHAQUE règle de
  case porte `var(--tab-nb` — et c'est lui qui l'a dit, à la première
  exécution.
* **Deux défauts d'à côté se sont vus en relevant l'encre.** L'énoncé du
  4.6 écrivait ses espaces en espaces ORDINAIRES dans une rangée flex :
  « Calcule2/3+5/2×1/3 », collé — la leçon du 4.3 (espaces insécables)
  n'avait pas été portée avec lui ; le « + » de sa rangée était un `<b>`
  nu, en Nunito à la taille du texte, seul signe du thème à ne pas
  s'écrire de l'encre des nombres — il est `.f-times` comme le « × ». Et
  **la zone de la question rédigée restait sur l'écran partagé** : ouverte
  par le 4.3, elle s'affichait encore, feuille comprise, sous la rangée du
  1.9 ou du 4.2 ouverts ensuite — seul `sfrRendu` la fermait, et seul un
  exercice à rédaction l'appelle. `show()` la ferme en arrivant sur un
  exercice sans `test.redac` (le test est posé avant l'affichage, au
  démarrage comme à la reprise).

Contrôle : « le thème des fractions s'écrit d'une seule police et d'une
seule taille, de l'énoncé à la fin, cases comprises » (banc navigateur,
« 6 terdecies ter », déclaré par `encreFractions` dans le profil de la
Première : thème, police, taille — deux sources —, témoin). Il remplace les
« cases réduites ». Pour chaque exercice du thème, lu dans `THEMES` de la
page, il RELÈVE à l'écran chaque nombre et chaque signe écrit par la page et
chaque case — sa police lue DANS son shadow DOM, sur le chiffre qu'on y a
tapé (« 97 », faux partout) —, à l'ouverture puis après la vérification, qui
pose un badge, écrit les corrections en vert et ouvre la question rédigée ;
tout doit porter l'encre déclarée, les cases la même hauteur, et chaque
sorte d'écriture (énoncé, signe, rangée, case, correction, feuille) doit
avoir été vue, sans quoi le contrôle le dit. L'autre bord : le 1.9, témoin
hors thème sur l'écran partagé, garde ses cases pleines — et ne porte plus
la zone rédigée d'un autre exercice. Éprouvé par le `<b>+</b>` du 4.6, que
le premier relevé a nommé avant qu'on l'ait cherché.

**Puis cette encre est devenue NOIRE (octobre 2026, Première v316).** Demande
de Turquet : « en première je veux que pour tous les exercices dans le thème
fraction, sauf le 4.2, tous les nombres et les barres de fractions soient
écrits en noir dans les énoncés et les exercices, sauf dans les cases. » Une
seule police et une seule taille, la veille — mais quatre encres se croisaient
encore sur le même calcul, chacune héritée d'une règle écrite dans son coin :
les fractions de l'énoncé et de la rangée en bleu nuit (`.f-frac`,
`.sf-times` : `--blue-dark`), le « = », les entiers (`.f-whole`) et le trait
de fraction (`.f-fbar`) dans l'encre de la page (`--ink`, un bleu sombre qui
n'est pas noir), et le signe de l'énoncé en ROUGE — la règle `.mp-instr b`
qui souligne les mots importants prenait le « + » et le « × » avec eux.

* **Une encre, déclarée une fois, sur l'écran du thème** : `--fx-encre`
  (`#000`), posée dans le bloc « UNE SEULE ENCRE » et lue par un second bloc,
  « … ET ELLE EST NOIRE », qui la donne à tout ce que la PAGE écrit —
  `.f-frac`, `.sf-f`, `.f-whole`, `.f-eq`, `.f-times`, `.sf-times`,
  `b.spf-op`, le `<b>` qui suit une fraction dans l'énoncé (le signe, jamais
  un mot : les mots en gras du 4.1 restent rouges), le préfixe « = » de la
  feuille rédigée — et au FOND du trait `.f-fbar` ; le trait de `.sf-f` est
  en `currentColor` et suit son texte.
* **Les cases n'en sont pas.** Ce que l'élève écrit garde son bleu, la
  vérification garde ses couleurs (juste en bleu, faux en rouge, correction
  en vert), et le badge `.mf-cor` est une correction : il reste vert — c'est
  la règle globale d'août 2026, tenue par le « 9 bis ».
* **Le 4.2 est l'exception, NOMMÉE.** Ses dénominateurs se colorent en violet
  et en orange pour dire où va chacun (`crd-a`, `crd-b`) ; le noir autour
  n'aurait rien changé à ce qu'il enseigne, et l'exercice garde son écriture
  entière. Le sélecteur l'écarte par `data-exo`, que `show()` écrit déjà sur
  l'écran avec `data-theme` — c'est ce qui permet d'épargner un exercice sur
  un écran partagé (`#scr-sf` porte le 1.9, le 4.2 et le 4.3). Le profil le
  déclare, raison comprise (`encreFractions.noir.sauf`) : deux sources.

Contrôle : le relevé du « 6 terdecies ter » (banc navigateur) lit désormais la
COULEUR de chaque nombre et de chaque signe qu'il relève, et celle de chaque
trait de fraction (un fond, pas un texte — une sorte d'écriture de plus,
« trait », qui doit avoir été vue), à l'ouverture et après la vérification ;
« ce que la page écrit dans le thème des fractions — nombres, signes, traits —
est noir, hors les cases et hors l'exercice dispensé » exige le noir partout
sauf sur le 4.2, et tient les deux autres bords : l'exercice dispensé a ENCORE
des couleurs (sans quoi la dispense ne dispense de rien), et le témoin hors
thème sur l'écran partagé — le 1.9 — garde ses nombres en couleur : le noir ne
déborde pas du thème. Le noir se mesure, il ne se devine pas : les trois
canaux sous 24, ce qui refuse `--ink` (30, 42, 74) comme le bleu nuit.
Éprouvé par sabotage des deux côtés, en une seule exécution : la règle du
fond de `.f-fbar` retirée (32 écarts, chaque trait de la rangée nommé « en
rgb(30, 42, 74) au lieu de noir », du 4.1 au 4.6, à l'ouverture comme après
la vérification) et un sélecteur trop large qui noircissait `#scr-sf` entier
(« 1.9 : 0 nombre(s) en couleur sur 18 »).

**Une case `<input>` n'a pas la largeur de son contenu quand on lui dit
`auto` (Première, 4.1, octobre 2026).** Signalé par Turquet sur deux
captures : au 4.1, les cases du diviseur (« 6 ÷ ▢ ») et du multiplicateur
(« 3 × ▢ ») s'étiraient sur 372 px quand les autres en faisaient 48. Le bloc
« UNE SEULE ENCRE » donne aux cases de `.sf-l` la largeur `--fx-l`, qui vaut
`auto` — la mesure du 4.6, dont ces cases sont des champs MathLive qui
suivent leur contenu. Le 4.1 y pose des `<input>`, et un `<input>` en `auto`
prend sa largeur par défaut, une vingtaine de caractères. Correctif : une
règle `.sf-l input.f-num/.f-den` à 48 px (42 sur téléphone), la largeur des
autres cases du thème. Le contrôle « 6 terdecies ter » relève désormais la
LARGEUR des cases `<input>` de chaque écran du thème (elles doivent être
égales à 4 px près, comme les hauteurs), et pose à coup sûr les deux maillons
du 4.1 qui ne sortent que selon le tirage (profil
`encreFractions.maillons`). Éprouvé par sabotage : sur la page d'avant, « des
cases de 48 à 372 px de large — rvf-s0-dn », au 4.1 seulement, aux quatre
moments mesurés.

**Puis les 4.4 et 4.5 de la Première ont accepté les deux raccourcis du
produit (octobre 2026, Première v321).** Demande de Turquet : « dans le 4.4
et le 4.5 pour les multiplications un élève a le droit d'enlever le même
facteur au numérateur et au dénominateur, et il a le droit de donner
directement le résultat d'une multiplication de fraction. » Deux copies
d'écran l'avaient montré : sur 5/2 × 3/5, l'élève qui barrait les 5 et
écrivait (1 × 3)/(2 × 1) = 3/2 voyait ses cases rougir et la chaîne de
15/10 corriger derrière lui ; sur la rédigée 4/5 × 1/2 = 4/10, le message
disait « juste… Bravo ! » en rouge.

* **La route du produit** (`mltRoute`) : quatre cases du produit qui
  DIVISENT chacune l'un des facteurs de leur étage, et dont le tout VAUT le
  produit, sont justes ensemble (`mltSimplifieAvant`). Les fractions de
  départ étant irréductibles, un facteur ne s'enlève qu'en croix : la valeur
  suffit à prouver qu'on a enlevé le même en haut et en bas. L'écriture
  classique en est le cas particulier.
* **Le résultat direct** : les quatre cases du produit VIDES et une fraction
  obtenue égale au produit — elle est jugée, les cases vides ne comptent
  pas comme un oubli, et la correction ne les remplit pas derrière lui.
  L'inverse du 4.5 reste exigé : c'est la division, pas la multiplication.
* **La fraction brute suit la route** (`SE_CFG.mlt.brut`) : la chaîne de
  simplification part de ce que l'élève a obtenu — elle disparaît sur 3/2,
  elle part de 15/10 donné directement —, et se redessine pendant la saisie
  comme celle de la somme. Des facteurs justes n'ont qu'un produit : la
  case l'attend exactement (1 × 3 sur 2 × 1 ne fait pas 15/10).
* **La rédigée** acceptait déjà les deux raccourcis (le juge `mll` compare
  des valeurs) ; la règle du modèle le dit désormais en toutes lettres. Le
  défaut était le MESSAGE : sur un résultat non simplifié, le modèle rendait
  « correct : false » avec une prose de félicitations. Le motif
  `simplifier` étant sûr, la page écrit elle-même la phrase (`redSecours`).

Contrôles : « le thème Fractions… et la simplification par étapes »
(`tests/verifier.js`) joue 5/2 × 3/5 au facteur enlevé (juste, chaîne
retirée, case du 1 peinte juste), son produit faux (15/10), un 5 enlevé d'un
seul côté, le résultat direct simplifié ou non, et au 4.5 le facteur enlevé
puis le résultat direct sans l'inverse (refusé). Le banc navigateur (« 6
terdecies bis ») tape au clavier la copie au facteur enlevé, puis la rédigée
15/10, refusée avec « pas simplifié ». Éprouvé par sabotage : la route
simplifiée et la route directe coupées, six écarts nommés.

**Puis le 5.7 et le 5.9 de la Seconde ont accepté un résultat ÉGAL mais NON
SIMPLIFIÉ (octobre 2026, option C).** Décision de Turquet, parmi quatre
options sur les rédigées de fractions : au 5.7 {multiplier-fractions-libre}
et au 5.9 {diviser-fractions-libre}, un résultat final égal à P/Q mais
réductible — la route du même dénominateur « 1/2 × 5/3 = 3/6 × 10/6 =
30/36 », ou au 5.9 « 3/5 ÷ 2/7 = 3/5 × 7/2 = 42/20 » — compte JUSTE, avec
un message « pense à simplifier ». Le 5.5 {somme-fractions-libre} ne change
pas : l'irréductible y reste exigé. Avant, le juge (`libreJuge`, genres
`mll`/`dll`) ne comparait que des VALEURS et acceptait déjà ces copies — sans
rien dire, pendant que les trois textes envoyés au modèle affirmaient « cette
fraction est déjà irréductible, il n'y a rien à simplifier » : vrai de P/Q,
faux de la copie, et le modèle félicitait 30/36 comme une forme finie.
Maintenant le verdict positif porte `reductible:true`, posé APRÈS toutes les
abstentions (l'inverse manquant au 5.9 s'abstient toujours, moins de deux
morceaux aussi) et après le refus `simplifier` du 5.5, qui reste ;
`libreVerdictIA` dit au modèle « réductible : dis-le en une phrase, sans
donner le nombre, sans le compter comme une faute » ; `libreSecours` écrit
« Ton calcul est juste. Le résultat peut encore se simplifier : cherche un
nombre qui divise le haut et le bas. » — en vert, c'est un point gagné —
quand le modèle est muet ou le contredit ; `mllAttenduIA` et `mllCtxTexte`
disent « toute fraction ÉGALE à P/Q est acceptée comme résultat final ; si
elle n'est pas simplifiée, le signaler en une phrase, sans réclamer la
simplification comme une faute ». Tenu par « le juge arithmétique des
rédactions » (30/36 et 42/20 justes ET réductibles, 5/6 sans drapeau, 42/20
sans inverse abstenu, 10/12 au 5.5 refusé, la phrase de secours, le verdict
et les quatre textes relus) et par « le verdict du juge arithmétique prime »
(30/36 CLIQUÉ sous un modèle en panne puis sous un modèle qui refuse : le
point, le vert, la phrase). Éprouvé par quatre sabotages : le drapeau retiré
du juge (deux contrôles rouges, cinq écarts), un seul des textes revenu à
« déjà irréductible » (trois écarts, le texte nommé), la phrase de secours
muette (les deux contrôles), et le refus du 5.5 retiré (« 10/12 : juste au
lieu de faux (simplifier) »).

**Sur un écran TACTILE, chaque barre du 5.1 a ses boutons « − » et « + »**
(décision de Turquet, octobre 2026, point T2/A3 de l'audit, option g — le
toucher direct de la barre reste). Une part de 40 fait 17 px sur une tablette
debout : aucun doigt n'en vise une, et {simplifier-barres} n'avait que ce
geste. Quand `tabletteActive()` est vrai, chaque barre reçoit sous elle deux
vrais `<button>` de 44 px, nommés (« une part de plus sur la barre partagée en
36 »), qui passent par le MÊME geste que le segment (`smpPas` → `smpClicL`) ;
la fraction lue suit, le verrouillage les grise ; sur ordinateur, rien ne
change (la barre est enveloppée dans `.smp-pile`, qui prend sa place). Deux
défauts partis avec : les gestes sont BORNÉS à [0, b] — `smpClicL(41)` posait
41 sur 40 parts —, sur le RÉSULTAT du geste et non l'argument (recliquer la
part 1 doit vider la barre) ; et le tirage lit `dmNbQuestions()` au lieu d'un
« 6 » en dur (profil `allonge`). Contrôles : le contrôle jsdom de l'exercice
(borne, boutons, pas, grisage) et le banc navigateur « 6 sexdecies » (contexte
tactile forcé comme en 11 bis : 44 px mesurés, bornes pressées, barre touchée,
768 px). Sept sabotages, chacun rouge sur son bord : borne retirée (« selL =
−1 », « 16/15 »), boutons jamais, boutons toujours, seuil à 480, boutons de
30 px, grisage retiré, pas sans redessin, « 6 » remis.
