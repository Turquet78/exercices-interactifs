# Opérations posées

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Une opération posée se juge à l'œil, pas au compte.** La grille des
opérations posées (`.mp-op`) est en flexbox à cellules de largeur fixe, et les
rangées sont alignées à droite. Une rangée qui n'a pas le MÊME nombre de
cellules que les autres décale donc le signe et les colonnes : l'opération n'est
plus posée, elle est de travers — et rien dans le code ne le dit. Chaque rangée
compte un `op` puis exactement `nCols` cellules, `nCols` valant 3 d'ordinaire et
4 quand l'addition déborde (999 + 99 = 1098) ; le trait suit la largeur. Les
cases du résultat suivent le RÉSULTAT et non une largeur fixe — une case en trop
se lirait comme un zéro à écrire, et 102 − 97 n'en demande qu'une. Deux
contrôles : l'un compte les cellules et les cases sur les quatre formes, l'autre
MESURE les positions dans un vrai navigateur — seul un navigateur sait où tombe
une colonne.
Les cases de retenue sont facultatives, et **ne sont posées que là où il y a
une retenue** : une case vide à remplir de rien n'apprend rien, et l'élève
finissait par se demander ce qu'on lui demandait (décision de Turquet, août
2026). C'est un arbitrage assumé — la présence d'une case dit désormais où la
retenue tombe. Le tirage garantit qu'il en reste toujours au moins une.
Les deux opérations **alternent**, en commençant par une addition : l'élève
passe d'une technique à l'autre à chaque calcul. Le tirage était auparavant
mélangé — même total, pas le même exercice.
**À la soustraction, la retenue s'écrit à DEUX endroits, pas un.** Méthode par
compensation : le petit `1` devant le chiffre du HAUT — 2 se lit alors 12 — et
la même retenue redescend en `+1` devant le chiffre du BAS de la colonne
suivante. C'est le geste du cahier. La première version n'en posait qu'une, sur
la rangée au-dessus, c'est-à-dire à l'endroit de l'ADDITION : même position,
deux sens opposés — la case s'ajoutait au nombre du bas alors qu'à l'addition
elle entre dans la colonne. Turquet, professeur de mathématiques, n'a pas su la
lire ; aucun élève ne l'aurait pu. L'énoncé le dit maintenant, et il change
selon l'opération. La soustraction n'a donc **que trois rangées** là où
l'addition en a quatre — un contrôle du navigateur qui en exigeait quatre
partout rougissait sur une soustraction parfaitement dessinée.
**Et la retenue du haut REDESCEND toute seule** (demande de Turquet, août
2026, Première) : les deux marques sont UNE retenue écrite deux fois, l'élève
ne l'écrit donc plus qu'en haut — la page pose le « +1 » du bas et l'efface
s'il efface. Le miroir copie la VALEUR écrite, juste ou non : un miroir qui
écrirait « 1 » sous un 7 corrigerait l'élève au lieu de le refléter. Il ne
lève AUCUN événement sur la case du bas — son écouteur générique y volerait le
focus — et l'avance automatique SAUTE ces cases : la page les remplit, le
curseur qui s'y parquerait laisserait l'élève devant une case déjà pleine
(elles restent atteignables au clic et à Tab). En soutien, la case remplie par
la page prend sa couleur à la sortie de la case, comme toute case non touchée
— et le premier jet du banc navigateur s'y est pris en défaut : il tabulait
UNE fois, atterrissait DANS la case du bas, et mesurait une case encore sous
le curseur, où le garde de la saisie diffère la couleur à bon droit. La
consigne dit le nouveau geste — une page qui pose le +1 pendant que la
consigne demande de l'écrire ferait chercher une case à remplir. Sept
sabotages, chacun rougissant en nommant son défaut.
Les colonnes de cet exercice sont plus larges (`--asp-col`, 78 px mesurés) :
il faut la place d'écrire une marque DEVANT le chiffre sans la poser dessus. La
largeur vit à un seul endroit, le trait la relit.

---

## Le thème « Calcul mental » porté en Seconde (septembre 2026)

**« Transfère aussi de la Première à la Seconde le thème 1, calcul mental »**
(demande de Turquet, septembre 2026, le jour même du portage des
pourcentages). Huit exercices : additions et soustractions posées, les deux
séances de tables, le calcul mental chronométré, la multiplication posée, le
parcours des fractions décimales et les deux multiplications de décimaux.
**Il ouvre le menu, comme en Première** — c'était le choix de Turquet — : les
cinq thèmes de la Seconde prennent un numéro de plus (Pourcentages 4, Python
6…). Les notes n'en souffrent pas, elles portent l'IDENTIFIANT. Les quinze
contrôles du thème Python, qui prenaient la numérotation des autres thèmes
pour témoin, suivent (6.1.1, 4.1.3, 5.1).
**{somme-fractions} n'a pas suivi** : la Seconde l'a déjà, dans son thème des
fractions, et un identifiant ne vit que dans un thème — le menu, le tableau du
professeur et le total d'un devoir se construisent tous depuis `THEMES`.

Même méthode que les pourcentages (`10-premiere-pourcentages.md`) : un script,
par plages de lignes, chaque ancre vérifiée. Ce qui était déjà en Seconde à
l'identique n'est pas recopié (`isPow10`, `parseDecToFrac`, `fracEqual`, les
couleurs en direct, la pose des hausses successives) ; ce qui y existait
AUTREMENT garde la version de la Seconde — `finishTest()`, qui enregistre sous
`currentTestId`, et `showResults()`.

**Quatre choses que la Seconde n'avait pas, et qui sont venues avec.**
* *Les réglages du calcul mental* (opérations, bornes, nombre de questions) :
  la Seconde n'a pas d'écran pour les changer, `DEFAULT_CFG` porte donc les
  valeurs par défaut de la Première.
* *Les écrans de rapidité sans aide.* Le calcul mental et les tables n'ont que
  le bouton des tables (`IA_ECRANS_SANS`), et la fenêtre des tables se referme
  dès que l'élève revient à son calcul sur l'exercice DES tables
  (`TABLES_REFERME`) — le bord que le profil de la Seconde déclarait jusque-là
  « non applicable », faute d'exercice de rapidité, et qu'il exige désormais.
* *Les tables de niveau 2* relisent l'historique des séances de l'élève :
  dans `resultats_2nde`, évidemment.
* *La pause garde les cases SANS identifiant* — les chiffres d'une opération
  posée, ses retenues — par leur rang dans l'écran, comme en Première. En
  Seconde elles se perdaient, et les poses des pourcentages portés le matin
  même en souffraient déjà.

**Le calcul mental ne pose plus de calcul trivial (audit, octobre 2026,
Première).** « 0 − 0 », « 0 + 7 », « 5 × 1 » ou « 9 ÷ 1 » sortaient de
`genQuestion` (1,4 à 6 % des calculs selon l'opération) et ne faisaient rien
calculer. Un terme d'une somme vaut désormais au moins 1, une différence aussi
(ni « a − 0 » ni « a − a ») ; un facteur, un diviseur et un quotient au moins
2 — sauf quand le professeur borne les tables à 5 : il ne resterait que 16
produits pour une séance qui peut en demander 20. Le contrôle « 1.4 : le
calcul mental ne pose aucun calcul trivial » tient les deux bords (20 000
tirages, puis le vivier des tables à 5) ; éprouvé par sabotage (« 0 + 14 »).

**Pas de calcul trivial au calcul mental (Seconde, audit d'octobre 2026).**
`genQuestion` tirait ses termes à partir de 0 (et ses facteurs à partir de
1) : « 0 − 0 », « 0 + 7 », « 6 × 1 », « 8 ÷ 1 » sortaient dans 1,4 à 6 % des
calculs. Les termes d'une addition ou d'une soustraction valent au moins 1
(et la différence aussi), les facteurs, diviseurs et quotients au moins 2 ;
une borne réglée trop bas est relevée plutôt que de figer le tirage. Tenu
par « le calcul mental ne tire aucun calcul trivial » (6 000 tirages, les
quatre opérations), rouge sur l'ancien tirage. La Première garde le sien
(lot séparé).

**L'écriture décimale d'une somme de puissances de 10 — {ecriture-decimale-somme}
(1.10, Première, novembre 2026).** Demande de Turquet, sur sa fiche
« puissance de 10 » : « donner l'écriture décimale de A », douze questions,
de A = 10⁻² à A = 1 + 0,1 + 10⁻⁴ — « on respectera l'ordre de difficulté des
questions comme sur le PDF ». Ajouté EN DERNIER au thème 1 : il ne renumérote
rien.
* *Le tirage* : chaque question de la fiche est devenue un GABARIT
  (`EDS_GABARITS`, douze, dans l'ordre de la fiche) qui garde sa forme et
  tire ses nombres là où la difficulté ne bouge pas — l'entier devant (le
  « 1 » de la fiche) de 1 à 9, l'exposant parmi ceux de la même marche. La
  question 9 reste 1 + 10⁻¹ + 10⁻³ (seul l'entier change) : c'est celle du
  RANG VIDE, où il faut écrire un 0, et la changer en rangs voisins l'aurait
  ramenée à la question 8. Un devoir qui règle un autre nombre de questions
  prend les gabarits à intervalles réguliers (`edsGabarit`) : la progression
  reste croissante, jamais mélangée. Le gabarit n'est PAS rangé dans la
  question — seuls les termes le sont : `distinctes()` compare alors les
  calculs eux-mêmes, et trois « 10⁻ᵏ » de suite ne se répètent pas.
* *Le juge* compare des fractions (`parseDecToFrac`) : « 1,010 » vaut
  « 1,01 » ; « 10^-2 » ou « 1/100 » ne sont pas une écriture décimale et
  restent faux. La correction écrite traduit chaque puissance avant la somme
  (« 10⁻¹ = 0,1 et 10⁻³ = 0,001, donc A = 1 + 0,1 + 0,001 = 1,101 »).
* *Le moteur* est celui du 2.1.8 ({pourcentage-dix}) : une case MathLive par
  question, la même ligne `.pct10-ligne`, les mêmes portes (soutien en
  direct, pause, rejeu, corrections vertes en entraînement).
* *Tenu par* trois contrôles du banc principal : les douze formes dans
  l'ordre de la fiche (300 séances), une difficulté croissante pour toute
  longueur de 1 à `DM_NBQ_MAX`, et des valeurs attendues exactes
  (1 + 10⁻¹ + 10⁻³ = 1,101, pas 1,11).

**Puis la SUITE de la fiche, ajoutée à la fin (novembre 2026).** « Rajouter à
la fin des exemples comme ceux qui se trouvent sur le PDF » — la fiche
« puissance de 10 suite » : 10², 10³, 10² + 10⁻¹, 10⁴ + 10² + 10⁻¹,
10² + 10⁻¹ + 10⁻³. Cinq gabarits de plus, APRÈS les douze premiers (la
séance passe à dix-sept questions, `EDS_NB` suit) ; un terme neuf,
`{t:'q',k}` = 10ᵏ, qui s'écrit « 1 suivi de k zéros » dans la correction et
n'entre pas dans le dénominateur du juge. Les bords tenus : 10⁴ + 10² + 10⁻¹
garde un rang vide entre ses deux puissances positives (10100,1 — l'écart
d'exposants vaut au moins 2), et la dernière question garde 10⁻¹ + 10⁻³, son
rang vide des centièmes. Le contrôle des formes lit désormais dix-sept formes,
et les valeurs exactes s'étendent aux exposants positifs (100,1 ; 10100,1 ;
100,101).
**Valeur approchée et ordre de grandeur — {valeur-approchee} (1.12, Première,
novembre 2026).** Demande de Turquet, sur sa fiche « valeur approchée » :
« créer un exercice en première comme le pdf en respectant l'ordre des
questions du pdf ». Ajouté EN DERNIER au thème 1 : il ne renumérote rien.
* *Le tirage* : les SEIZE lignes de la fiche, dans leur ordre, chacune
  devenue un gabarit (`VAP_GABARITS`) qui garde sa forme et tire ses nombres.
  Partie 1, « par quel nombre entier peut-on approcher… ? » : 8,001 ; 200,1 ;
  8,001 ; 200,1 (la fiche pose ces deux lignes DEUX fois : on les garde, avec
  d'autres nombres) ; 40 + 0,01 ; 3000 + 0,001 ; 10⁻² + 10 ; 10² + 10⁻².
  Partie 2, « calculer » : 100 × 1000 = …, puis 0,1 × 1000 = …/… × 1000 = … ;
  0,01 × 1000 ; 0,01 × 10 (la fraction décimale, puis le résultat — la
  dernière ligne donne un décimal, 0,1). Partie 3, « donner un ordre de
  grandeur » : 11 × 99 ≈ … × … ≈ … ; 101 × 999 ; 0,01 × 999 ; 0,1 × 101.
  Un devoir qui règle un autre nombre de questions prend les gabarits à
  intervalles réguliers (`vapGabarit`). Le gabarit n'est PAS rangé dans la
  question : les lignes 1 et 3 ont la même forme, et `distinctes()` doit
  comparer les nombres seuls — rangé, il aurait laissé passer deux « 8,001 ».
* *Le juge* tient toutes les valeurs en millièmes entiers (`VAP_D`), sans
  flottant. La fraction décimale accepte toute fraction égale de dénominateur
  10, 100, 1000… (`marqueFracDec`, comme au 1.11) ; les deux facteurs
  arrondis s'acceptent dans les deux ordres (`facteursCommutesDec`) ; un
  facteur arrondi est la puissance de 10 la plus proche (99 → 100), et 0,01
  ou 0,1 se recopient tels quels. Le « ≈ » qui annonce une case est groupé
  avec elle comme le « = » de `fEq()` (`vapApprox`).
* *Tenu par* trois contrôles du banc principal : les seize formes dans
  l'ordre de la fiche, jamais deux fois le même nombre aux lignes répétées
  (300 séances) ; l'ordre gardé pour toute longueur de 1 à `DM_NBQ_MAX` ;
  des attendus exacts (10⁻² + 10 ≈ 10, 0,01 × 10 = 0,1, 101 × 999 ≈ 100 000).

**Le 1.12 dit ce qu'une case attend, et accepte une fraction (v396).**
Demande de Turquet, novembre 2026 : « préciser dans l'énoncé que les cases
seront des nombres avec un seul chiffre 1 et des 0, comme 100 ; 10 ; 0,1 ; on
acceptera une écriture fractionnaire dans une case pour un nombre décimal, par
exemple 1/100 pour 0,01 ». La phrase (`VAP_AIDE_P10`) s'ajoute à l'énoncé des
parties 2 et 3 seulement : en partie 1, les réponses sont des entiers
quelconques (8, 200, 3000), et la phrase y mentirait. Le juge des cases
décimales (`vapVaut`) lit désormais par `vapLit` : un décimal, ou une fraction
— telle que MathLive la rend (`(1)/(100)`, `\frac{1}{100}`, `\dfrac`), ou
tapée `1/100` — dont numérateur et dénominateur sont des décimaux. La
correction en direct du soutien (`vapLive`) et l'ordre des deux facteurs
(`facteursCommutes` avec `vapVaut`) passent par le même juge : sans quoi le
soutien rougissait une fraction que la vérification aurait comptée juste.
Exécuté dans Chromium : « 1/10 » tapé dans la case résultat de 0,01 × 10, et
« 1/100 » dans le premier facteur de 0,01 × 99, se peignent en bleu et donnent
l'exercice parfait.

**La fraction de la partie 2 du 1.12 est FACULTATIVE (v401).** Demande de
Turquet, novembre 2026 : « quand on doit transformer l'écriture décimale en
fraction avec deux cases, il faut que cela soit facultatif ». Sur
« 0,1 × 100 = □/□ × 100 = □ », les deux cases de la fraction prennent la
présentation de la fraction du milieu de {pourcentage-fraction} : pointillés,
« facultatif » en rouge dessous (`.vap-fac`, `data-facultatif`, que la boîte
« Il reste des cases vides » ne compte pas). Le juge (`checkVapAnswer`) :
fraction entièrement vide, elle ne coûte rien — ni rouge, ni correction verte
(en entraînement les deux cases se ferment, neutres), et le point se joue sur
le résultat seul ; écrite, même à moitié, elle se juge comme avant
(`marqueFracDec`), et fausse elle coûte le point. Vides, ses cases n'ont
aucune classe : `ptsEcran()` ne les compte pas. Contrôle (banc principal) :
« en partie 2, la fraction est facultative — vide, elle ne coûte rien ;
écrite, elle se juge », éprouvé sur la page de v400, où il rougit des quatre
bords (pas de `data-facultatif`, point refusé, deux cases vides peintes `sol`).

**Le vocabulaire du calcul — {vocabulaire-calcul} (1.13, Première, v416).**
Demande de Turquet, novembre 2026, sur sa fiche « vocabulaire calcul » :
« créer un exercice dans calcul mental comme le pdf, on gardera les mêmes
nombres que dans le pdf », avec « un bouton pour afficher les écritures
décimales à connaître […] dans une fenêtre comme pour les tables de
multiplication ». AUCUN TIRAGE : la séance suit les lignes de la fiche, ses
nombres et son ordre (`VOC_LIGNES`) ; une question n'est que le rang de sa
ligne (`{n}`, l'indice, jamais l'objet). Une séance d'une autre longueur (un
devoir) prend les lignes à intervalles réguliers (`vocRang`).
*Partie 1, dix-sept phrases* : « Le double de 12 signifie que l'on doit
calculer 12 × 1 ; 12 × 2 ; … le résultat est : … ». L'élève CLIQUE le bon
calcul parmi ceux de la fiche — des étiquettes (`.voc-ch`), les fractions
empilées (12 sur 2, 1 sur −2) —, puis écrit le résultat dans une case
MathLive. La fiche pose deux fois « le dixième de 12 », à l'identique : la
ligne n'est posée qu'une fois (aucune séance ne pose deux fois la même
question), d'où 21 questions et non 22.
*Partie 2, quatre calculs en étapes* : une case par étape, les intitulés de la
fiche (« On commence par la moitié de 5 : … puis la somme de 3 et de la
moitié de 5 : … ») — la somme de 3 et de la moitié de 5, la somme du double
de 4 et de la moitié de 6, le double du tiers de 12, la somme de 3 et de
l'inverse de 2.
*Le juge* (`checkVocAnswer`) : la question est juste quand le calcul choisi
ET chaque case le sont ; un résultat s'écrit en décimal ou en fraction
(`vapLit` du 1.12 : 0,25 ou 1/4, 0,5 ou 1/2). L'étiquette choisie se peint
bleue (juste) ou rouge ; la bonne étiquette montrée par la page, verte
(`.sol`, en entraînement et en évaluation ; en soutien l'élève rechoisit).
Le calcul choisi vit dans `test.vocChoix` (rangé par la pause avec le
reste). *Le compte des cases* : `ptsEcran()` compte désormais un groupe
`[data-pts-choix]` pour UNE case, juste si l'étiquette choisie l'est — sans
quoi « 12 × 1 » choisi avec « 24 » écrit s'affichait « 0 case juste sur 1 ».
*La fenêtre des écritures décimales* (`#decOverlay`, `ouvrirDecimales`) :
celle des tables, mêmes classes, en haut à droite, déplaçable, les huit
écritures ½ = 0,5 ; ¼ = 0,25 ; 1/10 = 0,1 ; ¾ = 0,75 ; 1/5 = 0,2 ; 2/5 = 0,4 ;
3/5 = 0,6 ; 4/5 = 0,8, fractions empilées. Son bouton « ½ Écritures
décimales » rejoint la rangée des aides (`iaBoutons`) sur les écrans de
`DEC_ECRANS` seulement ; elle se ferme avec les autres fenêtres d'aide au
changement d'écran (`fermerFenetresIA`).
Contrôle (banc principal) : « {vocabulaire-calcul} : les lignes de la fiche,
ses nombres, son ordre, et un juge qui exige le calcul ET le résultat ».

**Le calcul à étapes du 1.13 commence par « On doit calculer … » (v421).**
Demande de Turquet, novembre 2026 : « pour les calculs à étapes, je veux que
l'on écrive en premier sur la partie quadrillée "on doit calculer la somme de
3 et de la moitié de 5", avec la même police et la même taille que la suite
du calcul ». La phrase (`vocBut`, tirée de la consigne) est la première ligne
de `#vocHost`, en `.voc-lab` comme les étapes — mesuré dans Chromium : les
trois lignes à 21,6 px, Nunito. Contrôle : celui du 1.13 au banc principal
exige cette première ligne sur la somme de 3 et de la moitié de 5.

**Le 1.13 finit par trois calculs SANS LES ÉTAPES (v425).** Demande de
Turquet, novembre 2026 : « à la fin rajouter les questions suivantes sans
afficher les étapes : le tiers de 6 plus la moitié de 7, la somme du double
de 10 et de l'inverse de 2, la différence entre 10 et l'inverse de 5 ». Une
partie 3 (`t:'di'`) : la phrase « On doit calculer … », puis une seule case
« Le résultat est : » — 5,5 ; 20,5 ; 9,8 (décimal ou fraction). Le moteur est
celui des étapes, avec une étape : même juge, même correction (« Le tiers de
6 plus la moitié de 7 : 2 + 3,5 = 5,5 »), même pause. La séance passe à 24
questions ; un devoir en prend au plus 20, à intervalles réguliers
(`vocRang`). Contrôle : celui du 1.13 au banc principal exige les trois
lignes, une seule case, la phrase en tête, et 9,8 accepté.

**Puis la retenue du haut a redescendu toute seule dans TOUTE soustraction
posée de la Première (novembre 2026, v429).** Demande de Turquet : « dans une
soustraction posée, pour tout le niveau Première, quand on met une retenue en
haut, afficher dans la case du bas +1 automatiquement ». Le 1.x le faisait
depuis août (`asp-ret`, le miroir de la retenue) ; les soustractions que
`buildPoseSub` construit — les poses facultatives des pourcentages (2.2.11,
2.3.2 et suivants, les synthèses) et celle du 7.1 — demandaient encore
d'écrire deux fois la même retenue. `buildPoseSub` apparie désormais la
retenue du haut (`sub-ret`, `data-ret` = sa colonne d'emprunt) et le « +1 »
du bas de la colonne suivante (`sub-retb`, même `data-ret`, en lecture seule,
hors tabulation) ; une seule porte en capture sur le document,
`#retenue-redescend` (fin de fichier), recopie la VALEUR écrite en haut —
juste ou non, un miroir n'est pas une correction — et l'efface avec elle ;
le focus qui arriverait sur la case du bas (l'avance automatique d'un
exercice, qui suit `data-mtab`, ou Tab) passe à la case suivante de la pose.
Les juges ne changent pas : une retenue du bas écrite se juge comme avant, et
elle vaut ce que vaut celle du haut. Le contrôle (`retenueRedescend`, banc
principal) construit 42 − 17, écrit 1 puis 7 puis rien en haut, relit le bas,
et pose le focus sur la case du bas pour le voir repartir.

**Une case du 1.13 accepte les calculs intermédiaires (v433).** Signalé par
Turquet sur une capture, novembre 2026 : « 2 + 3.5 = 5.5 » rougissait au
tiers de 6 plus la moitié de 7 — « on doit pouvoir mettre des calculs
intermédiaires ». Le juge (`vocVaut`) lit désormais une CHAÎNE d'égalités :
chaque membre est évalué en rationnel exact par `libreEval` (le juge
arithmétique des rédactions, rien de nouveau à croire) et doit valoir le
résultat ; le DERNIER membre est le résultat écrit comme un nombre (décimal
ou fraction, `vapLit`). Une égalité fausse en chemin (« 2 + 3 = 5,5 ») rend
la case fausse ; une expression sans résultat (« 2 + 3,5 ») aussi. Le LaTeX
de MathLive est ramené au texte (`vocTexteCalc` : \frac → (a)/(b), \times,
\div, {,}). Vaut pour toutes les cases du 1.13 ; la consigne de la partie 3
le dit. Exécuté dans Chromium, au clavier : « 2+3.5=5.5 » et
« 2×10+½=20,5 » se peignent en bleu et valent le point. Contrôle : celui du
1.13 au banc principal (six chaînes, dont trois refusées, et la copie de la
capture).

**Au 1.13, un résultat qui n'est pas entier s'écrit en NOMBRE DÉCIMAL (v439).**
Demande de Turquet, novembre 2026 : « il faudrait préciser que le résultat est
un nombre décimal quand c'est une fraction », puis, sur la question posée,
« exiger le décimal ». Quand le résultat attendu n'est pas entier (2,5 ; 0,25 ;
5,5…), la case l'annonce — « Le résultat est (en nombre décimal) : »
(`vocLabDec`) — et le juge (`vocVaut`) refuse une fraction en DERNIER membre :
5/2 pour la moitié de 5 rougit, et le message le dit, « Le résultat s'écrit en
nombre décimal : 2,5, pas en fraction » (`vocMsgFraction`, en soutien comme en
entraînement). Dans les calculs intermédiaires la fraction reste permise
(« 1/2 = 0,5 » est juste). Un résultat entier n'est pas concerné. Exécuté dans
Chromium : 5/2 rougit avec son message, 2,5 vaut le point. Contrôle : celui du
1.13 au banc principal (1/2 refusé et son message, 0,5 et « 1/2 = 0,5 »
acceptés, la mention présente sur un résultat non entier, absente sur 24).

**Le 1.14 {vocabulaire-calcul-2} : le 1.13 sans calcul à choisir, avec des nombres tirés (v441).**
Demande de Turquet, novembre 2026 : « un exercice comme le 1.13 mais sans
cases à sélectionner au début ; les résultats finaux et intermédiaires ne
seront que des nombres entiers compris entre 1 et 30, ou décimaux avec
uniquement 1, 2, 4, 5 ou 25 derrière la virgule et compris entre 0 et 5 ».
Lu ainsi : un nombre permis est un entier de 1 à 30, ou un décimal de 0 à 5
dont la partie décimale est ,1 ,2 ,25 ,4 ou ,5 (`voc2Ok`, en millièmes) — et
la règle vaut pour les DONNÉES aussi, pas seulement pour les étapes et le
résultat. Même moteur que le 1.13 (kind `voc`, écran `scr-voctest`, même
juge — calculs intermédiaires permis, décimal exigé —, même fenêtre des
écritures décimales), pas même identité : `test.qId`, que `startVoc()` remet
à `'vocabulaire-calcul'`, et « Recommencer » route par lui. Une question
tirée range ses données (`q.g` la forme, `q.p` la partie, les nombres) et
`vocL(q)` en refait la ligne par `voc2Ligne` : la reprise d'une pause relit
la question, jamais le tirage. Vingt questions (`VOC2_PLAN`) : douze phrases
(double, triple, quadruple, moitié, tiers, quart, dixième, inverse, somme,
produit, différence, quotient) avec la ligne « On doit calculer … » puis le
résultat ; quatre calculs en étapes sur les formes de la fiche (somme de a et
de U(x), somme de U(x) et de V(y), U du V(x), différence entre a et U(x)) ;
les mêmes quatre sans étapes. Le tirage refait jusqu'à tomber dans les bornes
et écarte 1 comme donnée (« le triple de 1 »). Grammaire de la fiche : « la
somme de 3 ET DE la moitié de 5 », « la somme DU double de 4 », mais « la
différence entre 10 ET l'inverse de 5 » — le premier essai écrivait « la
différence entre 23 et du quart de 4 », vu en relisant vingt tirages. Banc :
« {vocabulaire-calcul-2} : des nombres dans les bornes demandées… » (200
séances, chaque nombre de chaque question ; les bords de `voc2Ok` des deux
côtés ; ni choix de calcul, ni doublon ; identité et « Recommencer »).

**Le 1.15 {ranger-croissant} : ranger trois nombres dans l'ordre croissant, les cases en nombres décimaux (v447).**
Demande de Turquet, novembre 2026, sur sa fiche « Ranger dans l'ordre
croissant » : « faire un exercice comme le pdf. On prendra les mêmes valeurs.
On demandera aux élèves de compléter les cases avec des nombres décimaux. Il
y aura le bouton qui met les fractions les plus connues avec leur valeur
décimale ». Les cinq lignes de la fiche, ses nombres, son ordre
(`RGC_FICHE`) : 0,2 ; 0,1 ; 0,18 — 0,6 ; 0,5 ; 0,09 — 0,08 ; 0,81 ; 0,8 —
2/5 ; 0,39 ; 3/10 — 1/4 ; 0,29 ; 3/10. Une fraction s'écrit d'abord en
nombre décimal (« A = 2/5 = [ ] »), puis « [ ] < [ ] < [ ] » reçoit les trois
NOMBRES — ni lettre, ni fraction : `rgcVaut` n'accepte que `^\d+(,\d+)?$`, et
compare des valeurs en millièmes (0,40 vaut 0,4). Chaque case se juge seule ;
le message de méthode écrit les trois nombres avec le même nombre de
chiffres après la virgule (0,20 ; 0,10 ; 0,18), et nomme la lettre ou la
fraction écrite à la place d'un nombre. La fenêtre « ½ Écritures décimales »
du 1.13 y est posée (`DEC_ECRANS`). Le réglage « Questions » d'un devoir :
moins de cinq garde des lignes réparties dans l'ordre ; au-delà, la fiche
recommence, ses nombres redistribués entre A, B et C (`q.p`, une des six
permutations) — mêmes valeurs, jamais deux fois la même question. Sur un
téléphone, les trois nombres se replient entre eux, jamais au milieu de
« A = 2/5 = [ ] », et « [ ] < [ ] < [ ] » ne se coupe pas (les cases
maigrissent à 72 px). Banc : « {ranger-croissant} : la séance suit les cinq
lignes de la fiche… », « …ne pose jamais deux fois la même », « …une case
vaut un nombre décimal (0,40 = 0,4), jamais une lettre ni une fraction ».
Puis, le même jour (avant la mise en ligne) : « faire un bouton coup de pouce
en vert qui donne les valeurs décimales des fractions et qui rajoute des zéros
aux écritures décimales pour qu'ils aient le même nombre de chiffres derrière
la virgule ». Le bouton « 💡 Coup de pouce » (vert, `--green`) est posé entre
les nombres et le rangement ; un clic écrit dessous, dans un cadre vert,
« A = 2/5 = 0,4 = 0,40 ; B = 0,39 ; C = 3/10 = 0,3 = 0,30 » (`rgcPouceHTML`) et
le bouton disparaît. Il ne remplit aucune case, ne juge rien et ne coûte aucun
point ; ouvert, il le reste pour la question, pause comprise (`test.rgcPouce`).
Banc : « {ranger-croissant} : le coup de pouce écrit les fractions en décimal
et ajoute les zéros… ».
Puis, le lendemain : « ne pas mettre A =, B = et C = dans l'énoncé » (v448).
Les trois nombres s'écrivent nus (0,2   0,1   0,18 ; 2/5 = [ ]   0,39
3/10 = [ ]) ; les lettres quittent aussi le coup de pouce (2/5 = 0,4 = 0,40),
le message de méthode, le compte rendu, le contexte de l'aide et le corrigé
type. Le message « pas les lettres » tombe avec elles ; le juge, lui, ne
change pas — une case n'accepte toujours qu'un nombre décimal.
Puis, le même jour : « accepter qu'un élève ne donne pas la valeur décimale
d'une fraction, et accepter qu'un élève donne la fraction plutôt que la valeur
décimale dans le rangement ; on mettra l'écriture fractionnaire dans la case si
l'élève donne une fraction » (v448, avec le retrait des lettres). La case
« 2/5 = [ ] » devient FACULTATIVE (`data-facultatif`, `rgcFacultative`) : vide,
elle ne rougit pas, ne reçoit aucune correction et ne fait pas ouvrir « Il
reste des cases vides » ; écrite, elle se juge. Le rangement accepte un nombre
décimal OU une fraction égale (`rgcValeur` : 2/5, 4/10) ; la fraction tapée au
« / » s'empile dans la case (MathLive), et la case grandit pour la contenir
(`height:auto`, comme au 1.12). Piège vu en tapant pour de vrai au clavier :
la valeur d'une case MathLive de cette page rend la fraction en « (3)/(10) »,
pas en `\frac{3}{10}` — `rgcLire` lève les parenthèses autour d'un nombre
seul ; un contrôle qui aurait posé `\frac{3}{10}` par programme ne l'aurait
pas vu. Une fraction fausse du rangement est corrigée par la fraction de
l'énoncé quand le nombre attendu en est une, sinon par le décimal. Le message
« pas des fractions » est retiré ; l'énoncé dit « (facultatif) » et « des
nombres décimaux ou des fractions ».

Puis les valeurs sont TIRÉES (v450) : « tu peux changer les valeurs, mais il
faut des questions de niveau équivalent avec des nombres entre 0 et 1 et au
moins deux qui sont proches à moins d'un dixième près ». Cinq niveaux, un par
ligne de la fiche, chacun gardant le piège de sa ligne (`genRgcNiveau`) :
① deux dixièmes voisins et un centième entre eux (0,3 ; 0,39 ; 0,4) ;
② 0,t ; 0,tu ; 0,0d avec d > t — le nombre « long » est le plus petit
(0,3 ; 0,31 ; 0,06) ; ③ 0,0d ; 0,d ; 0,du (0,09 ; 0,9 ; 0,93) ; ④ deux
fractions de dixièmes voisins et un décimal entre elles (1/2 ; 0,59 ; 3/5) ;
⑤ 1/4 ou 3/4, une fraction de dixièmes à 0,05, un décimal entre les deux
(3/4 ; 0,78 ; 4/5). Chaque tirage passe par `rgcTirageOk` : trois valeurs
distinctes, strictement entre 0 et 1, et deux au moins à MOINS de 0,1 —
« à moins d'un dixième près » lu au sens strict : 0,5 et 0,6 ne comptent
pas, ce qui a fait passer la ligne ② de la fiche de 0,5 ; 0,6 à 0,t ; 0,tu.
L'ordre d'affichage est tiré (`q.nb`), le niveau se lit sur la place dans la
séance (`rgcNiveau`, comme au 1.11). `RGC_FICHE` reste : elle relit une séance
mise en pause avant le tirage (`q.f`). Le corrigé type de l'aide tire une
autre question du même niveau. Banc : « {ranger-croissant} : cinq niveaux
dans l'ordre de la fiche, nombres tirés entre 0 et 1, deux au moins à moins
d'un dixième » (3 000 tirages par niveau, la forme de chaque niveau ; l'ordre
des niveaux de 1 à DM_NBQ_MAX questions ; la relecture d'une séance d'avant).
Puis, à peine en ligne, un DOUBLON trouvé par le banc (v451) : relancé pour un
simple changement de version, le contrôle « une séance de 1 à DM_NBQ_MAX
questions ne pose jamais deux fois la même » a rougi — une fois, au hasard
d'un tirage ; l'action l'avait passé vert. Cause : `cleQuestion()`, la clé
de `distincte()`, écarte tout champ nommé `v` (`CLE_HORS` — la variante
d'énoncé des autres exercices), et la valeur de chaque nombre de `q.nb` en
est un. Deux questions d'un même niveau avaient donc la même clé : la
protection contre les répétitions ne faisait rien, et ne rendait la main
qu'au bout de ses 200 essais. Remède : la question porte aussi `txt`, le
texte de ses trois nombres, qui entre dans la clé. Le contrôle tient
désormais le bord au lieu de l'attendre : deux questions de textes
différents ont deux clés différentes (200 paires), et chaque longueur de
séance est tirée vingt fois. Éprouvé par sabotage — `txt` retiré : « 128
séances avec un doublon ». Le piège vaut pour tout exercice futur : un
champ de question nommé `v` est invisible à `distincte()`.

## {bonhomme-relatifs} : le bonhomme sur l'axe (1.9, novembre 2026, v736)

Demandé par Turquet : une somme de deux entiers relatifs non nuls, et un
bonhomme qui part de 0 sur un axe gradué — il **avance** pour un nombre
positif, il **recule en marche arrière** pour un nombre négatif. « ▶
Simulation » le fait marcher, le premier nombre puis le second ; l'élève
écrit le résultat dans la case, avec ou sans simulation. Les nombres vont de
−5 à 5 (d'abord −9 à 9, ramenés à −5 à 5 le jour même, à la demande de
Turquet) ; l'axe va de −10 à 10, tous les résultats y tiennent.

Kind `bhr`, en fin du thème 1. Une case par question, dix questions par
`distinctes(dmNbQuestions(10), …)`. La question ne range que `a` et `b`. Le
second nombre négatif s'écrit entre parenthèses : « −3 + (−4) ». La case
lit « 3 », « +3 », « −3 », « -3 » et « (−3) » (`bhrLu`) ; elle porte
`data-pave-plus="+"`, la correction n'écrit que le nombre.

Le bonhomme regarde toujours vers les positifs : la visière de sa casquette
et son œil le disent, et un « bip bip · marche arrière » s'affiche quand il
recule. Avancer et reculer ont leurs encres propres (`--bhr-av` sarcelle,
`--bhr-rc` orange) : ni bleu (juste), ni rouge (faux), ni vert (correction).
Chaque déplacement se dessine sous l'axe par un arc fléché avec sa valeur ;
la page n'écrit jamais le résultat, elle ne fait que poser le bonhomme sur
la graduation.

Une marche en cours s'arrête quand l'écran se redessine : un jeton
(`test.bhrJeton`, un nombre, donc du JSON pour la pause) est relu à chaque
image. Après une réponse fausse (hors soutien), la simulation se lance seule
pour montrer le chemin ; une case laissée vide reçoit la correction en vert
sans lancer la marche. Le retour dit si la question a été trouvée sans la
simulation, et `given` le range (« (avec simulation) » / « (sans
simulation) ») pour le professeur.
