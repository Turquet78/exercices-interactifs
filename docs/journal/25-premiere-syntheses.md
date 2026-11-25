# Première — thème 8, Synthèses

## {bac-blanc-automatismes} — les douze automatismes du bac blanc, rédigés, avec un coup de pouce en étapes (Première, 8.1, novembre 2026)

**D'où il vient.** Demande de Turquet, sur son sujet « bac blanc 1ère E-S,
décembre 2026 » : « en première dans un thème synthèses : fais un exercice
qui reprend toutes les questions de la première [partie], avec des exemples
différents de ceux sur la feuille ; on demandera à l'élève de rédiger sa
réponse, et on prendra, si ce type de question a déjà été traité en mode
rédaction, le même protocole avec le même type de valeurs numériques que ces
exercices ; et on mettra un bouton coup de pouce qui donnera une version avec
des étapes, avec des cases à remplir copiées sur les modèles déjà existants.
Pour l'exercice 3, on proposera la méthode à étapes où l'on part de 100 €.
Pour la question 5 en mode étapes, on présentera comme l'exercice 2.1.3 avec
deux étapes ; quand le premier résultat est calculé, on le mettra
automatiquement sur la seconde ligne pour l'étape 2 (tous les calculs
respectent les consignes de difficulté du 2.1.3). » Un thème neuf, le 8
(« Synthèses »), ajouté EN DERNIER : rien n'est renuméroté. Kind `bba`.

**Lecture arbitrée.** « La première » = la PREMIÈRE PARTIE du sujet (les
douze automatismes), et « l'exercice 3 » = sa question 3 (une hausse puis une
baisse de 20 %) : c'est elle que « partir de 100 € » désigne. Un point par
question, que la réponse soit rédigée ou donnée dans les cases du coup de
pouce — aucune pénalité n'a été demandée (même lecture que l'aide méthode du
2.5.8).

**Le motif du devoir blanc, repris.** Rien n'est recopié des exercices
modèles : chaque question porte son moteur (`q.moteur`), le coup de pouce
pose `q.aide` et affiche la MÊME question sur l'écran de l'exercice modèle
(`BBA_ECRAN_POUCE`), et le « suivant » de chaque moteur repris rend la main
au bac blanc. Le crochet du 2.5.8 (`if(test.kind==='dbp'){ nextDbp(); … }`)
est devenu `dbpSuite()`, qui répond pour les deux ; il est posé dans les
« suivant » de neuf moteurs de plus (`nextVocQuestion`, `nextTsfQuestion`,
`nextCKQuestion`, `nextImaQuestion`, `nextSdQuestion`, `nextEdsQuestion`,
`nextVapQuestion`, `nextRgcQuestion`). `dbpAideHTML()` rend « 👍 Coup de
pouce » sous le bac blanc (sur l'écran du 2.5.6), `dbpRetourHTML()` le bouton
de retour qui appelle `bbaRevenir()`. Pour les moteurs qui ne le posent pas
eux-mêmes, `renderBba()` met le retour en tête de la carte, et les
vérifications de ces moteurs le retirent (`dbpRetourRetirer()` après
`test.locked=true`). « Revenir à la version rédigée » ne redessine pas la
feuille : la rédaction tapée avant le coup de pouce est toujours là.

| # | sujet | rédigé (protocole) | coup de pouce |
|---|---|---|---|
| 1 | somme du double de 3 et de l'inverse de 4 | chaîne d'égalités, juge `bbaJugeChaine` | {vocabulaire-calcul-2}, forme G2 en étapes, ses nombres (`voc2Ok`) |
| 2 | 3/4 − 1/6 + 2/3 | **le 4.12** : feuille, départ écrit, juge `tsfrMath` (et `redNoteNonSimplifie`) | {trois-fractions-ppcm}, cas `tsf4Cas` (rien au-dessus de 20) |
| 3 | + 20 % puis − 20 % | **le 2.5.6** tel quel (écran, feuille, `eslJuge`) | le 2.5.4, `methFixe='cent'` : partir de 100 seul ; paires `HS_PAIRES` en multiples de 10 |
| 4 | coefficient d'une baisse de 37 % | chaîne, finit sur le coefficient décimal | {reconnaitre-coefficient}, `genCK('dim')` |
| 5 | 30 % de 70 % de 500 | une ligne par calcul, `bbaJugeProp` | le 2.1.3 en DEUX rangées, sur l'écran du bac blanc (`renderBbaProp`) |
| 6 | 160 € − 20 % | **le 2.3.13** : feuille de rédaction, `dbpEvoJuge` (le juge du 2.5.8) | {diminuer-soustraction} (2.3.2) |
| 7 | image de 2 lue sur la courbe | une phrase ou une égalité, `bbaJugeImg` | {lire-image-animation}, le chemin animé |
| 8 | nombre d'antécédents de 4 | « 4 a 2 antécédents », `bbaJugeAnt` | même moteur, le chemin inverse |
| 9 | 8 + 0,03 + 5/10 | chaîne après « A = », `bbaJugeDec` exige le décimal ET une fraction décimale | {ecriture-decimale-fractions}, niveau 7 avec la fraction (`fd`) |
| 10 | 10³ + 10⁻² | chaîne après « A = », les puissances lues par `bbaPrep` | {ecriture-decimale-somme}, gabarit 10ᵏ + 10⁻ᵐ |
| 11 | ordre de grandeur de 995 × 102 | lignes à « = » et « ≈ », `bbaJugeOdg` | {valeur-approchee}, partie 3 (11 × 99, 101 × 999) |
| 12 | ranger 1/5 ; 3/10 ; 0,19 | lignes, le rangement « a < b < c », `bbaJugeRang` | {ranger-croissant}, niveaux 4 et 5 |

Les questions 7 et 8 portent sur la MÊME courbe, comme sur le sujet (un
tirage `imaTirage(1,'mix')` partagé). Le moteur de l'image n'a pas de
parabole (`lvGenPts`, des valeurs entières dans [−3 ; 3]) : la courbe est
celle du 6.2, et l'écran rédigé la dessine sans point ni chemin.

**Le coup de pouce de la question 5.** La rangée du 2.1.3 (fraction × N =
fraction = décimal), deux fois. La seconde part du premier résultat, écrit
par la page dans `#bbaMir` — « … » tant que la case du premier résultat ne le
porte pas juste, la valeur dès qu'il l'est (sur « input ») ; à la
vérification il est écrit dans tous les cas. Le tirage (`bbaGenProp`) tient
les consignes du 2.1.3 aux DEUX étapes : P₁, P₂ dans `PCT_PCTS`, N dans
`PCT_VALEURS` (et N ≥ 100 : un club, un lycée), `pctCoupleOk` pour P₁ × N et
pour P₂ × r₁ (produits au plus 9999, multiples de 100 : deux résultats
entiers), r₁ ≥ 10.

**Les juges.** La règle « un verdict arithmétique ne se confie pas à un
modèle » : chaque rédaction est lue en rationnels exacts par la grammaire du
moteur rédigé (`salExpr`), après `bbaPrep` (puissances de 10 écrites en
décimal, « ≈ » et « < » normalisés) ; une écriture qu'elle ne sait pas lire
fait s'abstenir le juge, et le modèle lit alors la copie (`bbaEnonceIA`,
`bbaAttenduIA`, réponse sous clause de secret). Le juge prime, sa phrase
s'affiche sur un refus, il répond seul si le modèle est en panne — le
contrat de `checkDbp`. Un nombre seul n'est jamais une rédaction ; un refus
ne donne jamais la réponse ; une égalité fausse est citée comme l'élève la
lit (`bbaAff` : virgule, ×, a/b).

**Deux défauts vus en l'ouvrant.** Le « Coup de pouce » de l'écran rédigé,
caché, doublait celui de l'écran du 2.5.6 (même identifiant) : `renderBba()`
vide la rangée de l'écran rédigé quand un autre écran prend la main. Et le
retour depuis le coup de pouce de la question 5, qui vit sur le même écran,
recréait la feuille — la rédaction était perdue ; le contrôle l'a attrapé.

**Ce que les contrôles tiennent.** `tests/verifier.js`, « le bac blanc
(8.1) » : le tirage sur 30 séances (les moteurs dans l'ordre du sujet, la
méthode « partir de 100 » fixée, les valeurs du 2.1.3 aux deux étapes, la
même courbe pour 7 et 8, les cas du 4.12, les niveaux du 1.15), les juges sur
six séances (une copie juste acceptée, une fausse refusée, sans la réponse
hors de ce que l'élève a écrit), le coup de pouce et le retour sur les douze
questions sans recréer la feuille, le crochet dans les onze « suivant », la
clôture depuis le coup de pouce de la dernière question, l'identité (8.1,
« Synthèses », Recommencer, rappel, questions à l'IA, contexte). Éprouvé par
sabotage : un crochet retiré de `nextImaQuestion`, un juge du rangement qui
ne compare plus rien — rouge les deux fois. Au banc navigateur (essai
manuel), les douze questions ouvertes dans un vrai Chromium, une copie juste
et une fausse tapées dans MathLive pour chacune, le coup de pouce répondu
(Q1, Q5 avec le miroir, Q7, Q12) en entraînement et en soutien.
`APP_VERSION` 462.

---

## {bac-blanc-automatismes} — le retour à la version rédigée, juste avant « Vérifier », et qui reste (Première, 8.1, v463, novembre 2026)

**D'où ça vient.** Turquet, le lendemain de la mise en ligne : « il faut
pouvoir revenir à la version rédigée pour chaque question avec un bouton ».
Le bouton existait (en tête de la carte du coup de pouce), mais il
disparaissait dès la vérification des cases — la règle du 2.5.8. Question
posée : « garder le bouton après Vérifier », « le placer à côté de
Vérifier », ou les deux ? Réponse : les deux, « à côté du bouton Vérifier,
juste avant ».

**Où il vit.** Plus en tête de carte (`dbpRetourHTML()` ne sert plus que le
devoir blanc) : dans la rangée des boutons du moteur affiché, en PREMIER,
juste avant « Vérifier » (`bbaRetourSuivre`, `#bbaRetourBtn`). Chaque moteur
repris réécrit cette rangée à sa guise — « Revérifier », « Passer à la suite
(voir la correction) », « Question suivante » — : un `MutationObserver` posé
sur CETTE rangée y remet le bouton tant que la question est sur son coup de
pouce, et le coupe au changement de question (`bbaRetourArreter`, dans
`nextBba` et `bbaRevenir`).

**Après la vérification des cases.** Le bouton reste. La question est notée
(le point des cases) : revenir pose `q.rejeu`, rangé dans la question — il
tient donc aussi à la reprise d'une pause —, et la feuille rédigée revient
pour S'ENTRAÎNER : une phrase le dit (`#bbaRejeuNote`), « Vérifier ma
rédaction » juge la copie comme avant, mais ni le score ni les réponses
enregistrées ne bougent (`bbaRejeu()`, lu par `checkBba` et par `checkEsl`
pour la question 3), et « Question suivante » est offerte d'emblée. Plus de
coup de pouce ni de retour sur cette feuille-là.

**Ce que le contrôle tient de plus.** « le bac blanc (8.1) » : sur les douze
coups de pouce, le bouton de retour est juste avant « Vérifier », seul de
son nom ; après une vérification (la rangée réécrite comme le fait un
moteur), il est toujours là ; le retour mène à la feuille, marque la question
« déjà notée », dit que le point est compté, offre la suite, et ne compte
rien. Éprouvé par sabotage : sans l'observateur, rouge sur les douze. Le
banc jsdom livre l'observateur par `__viderObservateurs()`, comme le
navigateur au retour de la main — sans quoi il lisait la rangée trop tôt
(c'est la première exécution qui l'a montré). Au navigateur (essai manuel),
les douze questions : le bouton visible avant « Vérifier », puis avant
« Question suivante », le retour vers la feuille d'entraînement, et une
rédaction juste qui ne change ni le score ni les réponses.

---

## La fraction déjà sur le dénominateur commun s'écrit comme le reste du calcul (Première, 4.11 et 8.1, v464, novembre 2026)

Signalé par Turquet sur le coup de pouce de la question 2 (capture : « Calcule
A = 1/2 + 1/10 + 3/5 », la fraction 1/10 petite et bleue au milieu de la
ligne « A = 1 × □ / 2 × □ + … ») : « il faut que la fraction du milieu ait la
même police, couleur et taille que le reste de l'exercice — le corriger dans
toutes les questions ». La fraction qui n'a pas de « × » (`tsfFac`, novembre
2026 : aucune multiplication par 1 écrite) était posée par `sfTermeHTML`, la
fraction de l'ÉNONCÉ. Elle est désormais écrite comme ses voisines, avec les
chiffres du calcul (`f-whole` dans un `.f-frac-input.sf-prod.tsf-fixe`) :
mesuré au navigateur, 32 px, Fredoka, bleu nuit — à l'identique de « 1 × » et
« 2 × » à côté. La correction est dans le moteur du 4.11 (`tsfFicheHTML`) :
elle vaut pour le 4.11 lui-même et pour chaque question 2 du bac blanc. Le
contrôle « le bac blanc (8.1) » pose la question de la capture et exige les
deux chiffres en `f-whole`, et plus aucune `.f-frac` dans la fiche.

---

## Cinq retouches de présentation, sur captures (Première, 8.1, v465, novembre 2026)

Turquet, sur cinq captures du 8.1 en ligne :

- **Question 2, coup de pouce : les signes + et − entre les fractions trop
  petits.** La fiche du 4.11 ne prend ses tailles que sous le thème des
  Fractions (`.screen[data-theme="Fractions"]`), et `show()` posait le thème
  de l'exercice OUVERT — « Synthèses ». L'écran d'un coup de pouce porte
  désormais le thème de son exercice MODÈLE (`BBA_MODELE`, lu par `show()`
  quand `test.kind` vaut `'bba'`) : signes, chiffres et cases à la taille de
  la fiche (mesuré : 23,2 px partout).
- **Question 3, coup de pouce (partir de 100) : « mettre 100 dans la case au
  début », puis « quand la première évolution est calculée, mettre le résultat
  dans la case de la ligne du dessous ».** `bbaEssCent()` écrit 100 dans les
  cases de la valeur de départ (× 100, puis 100 + …), en lecture seule ; dès
  que la première nouvelle valeur est JUSTE, elle se recopie dans les cases
  qui partent d'elle (× …, puis … − …), une valeur fausse ne recopie rien. Les
  cases écrites par la page (`.bba-auto`, fond gris-bleu) sont jugées justes à
  la vérification, comme une case remplie. Le 2.5.4 lui-même ne change pas.
- **Question 5, coup de pouce : les chiffres tapés dans les cases trop petits
  devant les nombres qui les entourent.** Les cases du 2.1.3 tiennent leur
  taille de règles qui nomment ses écrans un par un (`#pHost …`) ; le coup de
  pouce (`#bbaPouce`) y est ajouté — 30,4 px dans la case, 32 px autour,
  comme au 2.1.3.
- **Questions 9 et 12, énoncé : les chiffres des fractions plus grands que le
  texte autour.** Les énoncés rédigés écrivent leurs fractions par `bbaFr()`
  (`.bba-fr`) : la police, la taille et l'encre du texte, un trait à la
  couleur du texte. La question 2 prend la même écriture, pour que les trois
  énoncés à fractions se lisent pareil.

Le contrôle « le bac blanc (8.1) » tient les cinq : le thème « Fractions » sur
l'écran du coup de pouce de la question 2 ; à la question 3, 100 écrit
d'emblée et en lecture seule, rien de recopié avant la nouvelle valeur ni
sur une valeur fausse, la valeur juste recopiée dans les deux cases ; les
énoncés 2, 9 et 12 en `bbaFr` sans fraction d'énoncé ancienne ; les règles de
taille du 2.1.3 étendues au coup de pouce de la question 5. Au navigateur
(essai manuel) : les mesures ci-dessus, la recopie au clavier, et une
vérification où les cases écrites par la page sont bleues.

---

## Question 9, coup de pouce : la fraction à la taille des nombres voisins (Première, 8.1, v466, novembre 2026)

Turquet, sur capture (« A = 10 + 3/10 + 0,09 = □ », l'écran du 1.11) : les
chiffres de la fraction doivent avoir la taille des caractères autour. La
fraction est une `.fr` du 1.11 (1,7 rem, 27,2 px) entre des `.f-whole`
(2 rem, 32 px). Une règle portée par l'IDENTIFIANT de l'écran
(`#scr-sdtest[data-exo="bac-blanc-automatismes"]`, posé par `show()`) met ses
chiffres à 2 rem : 32 px mesurés au navigateur, comme « 10 » et « 0,09 ». Le
1.11 lui-même ne change pas — la demande porte sur le coup de pouce. Le
contrôle « le bac blanc (8.1) » exige la règle.

---

## Question 12 : le rangement en fractions, et la feuille d'une autre séance (Première, 8.1, v472, novembre 2026)

Turquet, sur capture, en soutien : « 1/5 < 0.26 < 3/10 » refusé (« Ton
rangement n'est pas le bon »), et il veut que les écritures fractionnaires
soient acceptées dans la réponse rédigée.

Le juge (`bbaJugeRang`) les acceptait déjà : la feuille rend
`(1)/(5)<0.26<(3)/(10)`, lu en rationnels exacts — vérifié au navigateur.
La capture disait autre chose : l'énoncé portait 0,26 ; 3/10 ; 1/5, et la
correction écrite par la page 1/5 ; 0,21 ; 1/4. **La copie était jugée sur
une autre question que celle affichée.** Reproduit au navigateur : une
séance arrêtée sur le coup de pouce de la question 12, une AUTRE séance
reprise elle aussi sur ce coup de pouce, puis « Revenir à la version
rédigée » — `bbaRevenir` garde la feuille quand `bbaFeuilleIdx` vaut
l'index courant, et l'index seul ne disait pas de quelle séance elle était :
l'énoncé et la feuille de la séance d'avant restaient à l'écran.

Le remède : chaque séance porte un jeton (`test.bbaSeance`, rangé avec la
pause) ; `bbaSeanceVerifier()`, en tête de `renderBba` et de `bbaRevenir`,
oublie une feuille d'un autre jeton, et l'écran se redessine. La consigne
dit aussi désormais que chaque nombre peut s'écrire en fraction ou en
décimal (« Tu peux écrire d'abord chaque fraction en nombre décimal… »).

Contrôle « le bac blanc (8.1) » : le rangement écrit avec les fractions
telles quelles est accepté, à l'envers il est refusé ; une autre séance
reprise sur le coup de pouce de la question 12 montre SON énoncé après le
retour.

**La question 12 accepte une LISTE rangée sans « < », et la question 8 lit
« antécédents » mal écrit (novembre 2026).** Turquet : « accepter une liste
de nombres bien rangés sans le symbole < » et « -2 a 2 enhéEdant » doit
compter. `bbaListeRang` : quand aucune ligne n'a de signe d'ordre, la
dernière ligne sans « = » se lit comme une liste (séparateurs « ; », « , »,
« et », espace ; la virgule décimale arrive déjà en « . » par `toPlain`) ;
rangée, elle est juste ; à l'envers ou en désordre, refusée sans faire dire à
l'élève un « < » qu'il n'a pas écrit. Les questions 7 et 8 passent leur texte
par `salMotsProches(…, BBA_MOTS_LECTURE)` (« antecedent », « image » : chacun
est l'autre bord de l'autre). Contrôle : banc principal, « le bac blanc
(8.1) » — la liste rangée sous quatre séparateurs, à l'envers refusée ;
« enhéEdant », « antécédant », « antessedents » acceptés avec le bon nombre,
refusés avec un autre.

**Plus de « = » imposé en tête de ligne quand la rédaction n'est pas un seul
calcul (Turquet, novembre 2026, version 483).** La question « traduis les mots
en calcul » du bac blanc (moteur `voc` : « la somme du quadruple de 0,25 et du
triple de 6 ») avait la feuille en mode `calcul` : Entrée ouvrait une ligne qui
commençait par « = ». Or l'élève y écrit naturellement trois calculs
(« 4 × 0,25 = 1 », « 3 × 6 = 18 », « 1 + 18 = 19 ») — le « = » de tête les
soudait en une chaîne fausse. Elle passe en mode `lignes` (aucun préfixe) et se
juge par `bbaJugeChaineOuLignes` : une ligne que l'élève commence lui-même par
« = » continue la précédente, et s'il ne reste qu'une chaîne, `bbaJugeChaine`
juge comme avant ; sinon chaque ligne doit avoir des « = » vrais, une au moins
montrer un calcul, et la DERNIÈRE donner le résultat. Les autres feuilles à
« = » de tête des trois niveaux ont été relues une à une : fractions (`frac`,
2.x de la Seconde), coefficient, « A = … », pourcentage d'un nombre, f′(x) de la
Terminale — toutes sont UNE chaîne d'égalités, et gardent leur « = ».

**Le « … ÷ » du coup de pouce des fractions restait en pointillés, et
« Simplifie ta fraction. » s'écrit au-dessus de la division (novembre 2026,
v485 ; Seconde v728).** Capture de Turquet sur la question 2 : 14/10 écrit,
la division qui simplifie montrait « … ÷ 2 / 10 ÷ 2 ». Le coup de pouce tourne
sur l'écran du 4.11 sous `test.kind === 'bba'`, et `seSaisie` ne suivait la
saisie que sous `test.kind === kind` : la chaîne n'était recopiée qu'à la
vérification. `seKind()` rend le moteur de l'écran courant (`bbaEcran()` sur
le bac blanc) ; `seSaisie` et `restoreBoxes` (miroirs de la simplification et
du dénominateur commun) le lisent. Demande jointe : « préciser quand on a le
résultat et qu'il faut le réduire […] dans tous les exercices où c'est demandé
de la même façon » — `.simp-dire`, posé EN ABSOLU au-dessus de la première
division (`seEtapeHTML`, `rvfSimpHTML` en Première ; la division ③ de
`renderSFTest` en Seconde) : il ne prend aucune place dans la rangée, qui ne
peut donc pas se replier. Contrôle : banc principal, « le bac blanc (8.1) » —
12 tapé sur 10 dans le coup de pouce, la division recopie 12 et 10, et la
consigne est là.
