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

**Le calcul à étapes du 1.13 commence par « On doit calculer … » (v419).**
Demande de Turquet, novembre 2026 : « pour les calculs à étapes, je veux que
l'on écrive en premier sur la partie quadrillée "on doit calculer la somme de
3 et de la moitié de 5", avec la même police et la même taille que la suite
du calcul ». La phrase (`vocBut`, tirée de la consigne) est la première ligne
de `#vocHost`, en `.voc-lab` comme les étapes — mesuré dans Chromium : les
trois lignes à 21,6 px, Nunito. Contrôle : celui du 1.13 au banc principal
exige cette première ligne sur la somme de 3 et de la moitié de 5.
