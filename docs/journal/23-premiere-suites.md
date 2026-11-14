# Première — suites (thème 7)

## {augmentation-tableau} — augmentation régulière : tableau et calculs (7.1, v405)

**La demande** (Turquet, novembre 2026), d'après sa fiche papier « Exercice
augmentation tableau » — un salaire de 1 800 € qui augmente de 70 € par an :
compléter le tableau des années 0 à 3 (la ligne 3 donnée), calculer le
salaire en 2036, trouver l'année où il dépasse 3 200 €, chaque question par
des phrases à compléter — : « en première faire un exercice comme le pdf
joint. Il faudra des thèmes différents que de l'argent sur un compte. Il
faudra des calculs très simples, faciles à faire de tête, avec des nombres
ayant un seul chiffre différent de zéro dans toutes les étapes de
l'exercice. Pour les phrases à compléter, à chaque question, quand une
donnée est complétée, la mettre sur les cases suivantes qui concernent la
même donnée dans cette question. »

**Un thème neuf, ajouté en dernier.** « Suites » est le thème 7 ; l'exercice
est le 7.1, kind `sui`. Rien ne renumérote (le contrôle l'épingle : 5.1,
2.1.3, 3.9, 6.1 immobiles). Le thème 6 « Étude de fonction » est arrivé
le même jour, sur une autre branche : l'exercice, d'abord écrit en 6.1, a
pris la place suivante en reprenant `main`.

**La séance est la fiche, par contextes entiers.** `SUI_NB` contextes (deux,
copié dans `tests/profils.js`), chacun en TROIS questions dans l'ordre de la
fiche : ① le tableau (deux cases, la ligne 3 donnée pour se vérifier), ② la
valeur au bout de N pas (« Calculer le nombre d'arbres en 2031 »), ③ le pas
où un seuil est atteint (« En quelle année le parc comptera-t-il 1 000
arbres ? »). Six questions, un point chacune — la note de la Première se
compte par question parfaite. Le réglage « Questions » d'un devoir coupe ou
allonge la séance par contextes entiers (`suiBuildQuestions(dmNbQuestions(…))`,
le tirage arrondi au contexte, puis tronqué) ; les contextes sortent sans
remise tant qu'il y en a (six), et le tirage d'un contexte est distinct de
ceux déjà tirés (`distincte`, dont la clé ignore `ci`).

**Un seul chiffre non nul, à toutes les étapes — c'est le tirage qui le
garantit, pas la relecture.** La valeur de départ est a·10^k, le pas b·10^k
(signé par le contexte : une batterie se vide, un parc se peuple).
`suiFamilles(c)` énumère les (a, b, k, N, p) qui tiennent la règle partout :
les lignes 1 à 3 du tableau, N·b, a ± N·b, p·b, a ± p·b, tous dans
{1, …, 9, 10} — 10 compris, qui multiplié par 10^k s'écrit 1 000 —, N et p
de 4 à 9 (au-delà du tableau) et différents. En pratique b vaut 1 : avec
b = 2, N et p ne peuvent valoir que 4, et la règle « différents » tombe. Les
étiquettes de temps (2031, 2035, 13 h, 17 h, le 9 juin) ne sont pas des
nombres à calculer : la fiche écrit 2036 et 2046 de la même façon. Le
contrôle tire 300 séances et relit chaque nombre de `suiVals` au regex
`^[1-9]0*$`.

**Six contextes, sans argent** (`SUI_CTX`) : les arbres du parc (par année),
les feuilles de l'imprimante (par heure ; c'était d'abord la batterie du
téléphone en %, retirée le lendemain — voir plus bas), le
remplissage de la piscine (par heure, des milliers de litres), le roman de
Léa (pages restantes, par jour, des dates de juin), la cuve d'eau de pluie
(par jour, des dates de juillet), les abonnés de la chaîne (par année). Un
contexte écrit lui-même ses phrases, avec des JETONS : `[n]`, `[r]`, `[p]`,
`[u0]`, `[res]` pour la question ②, `[e]`, `[r]`, `[k]`, `[fin]` pour la ③.
Le contrôle refuse un contexte dont l'énoncé parle d'euros, de salaire ou de
prix.

**Les cases suivantes recopient la donnée déjà écrite — la demande.**
`suiPhrase()` lit les jetons DANS L'ORDRE DU TEXTE : la première occurrence
d'une donnée dans la question est une case MathLive (`sui-n`, `sui-r`…), les
suivantes des miroirs (`.sui-mir`, soulignés de pointillés, « … » tant que la
case est vide) qui la recopient à chaque frappe (`suiMiroirs`). Le premier
jet remplaçait d'abord les « = [x] » puis les autres jetons : dans « Chaque
année il y a [r] arbres de plus. Comme [e] = [r] × [k] », le SECOND r
devenait la case et le premier le miroir — l'ordre du texte est le seul
juge. Un miroir n'est pas une case : il ne se juge pas, ne compte pas dans la
note (`ptsEcran` ne lit que les classes de verdict), ne se capture pas à la
pause (`captureBoxes` ne lit que les `math-field[id]`). Après la reprise
d'une pause, `restoreBoxes` remet les saisies puis appelle `suiMiroirs()`,
comme `rvfMiroirs` pour le 4.1 — sans quoi les miroirs reviendraient à « … »
devant des cases pleines. Après la vérification, les miroirs suivent aussi
la correction écrite en vert.

**« = » collé à sa case.** Les jetons précédés de « = » passent par la
fabrique `fEq` (la règle du niveau, tenue par le banc jsdom : aucun
`<span class="f-eq">` à la main). Dans une phrase en texte courant, `.f-grp`
est un flex de BLOC et casserait la ligne : `.sui-phr .f-grp` le remet en
ligne (`inline-flex`).

**Les phrases sont du texte courant, pas une rangée flex** — la leçon du
3.2 : sur téléphone, une rangée flex séparait « Ā » de sa phrase. La case, le
« = » et le texte ont la même taille (1,35 rem, 1,15 sur téléphone), par le
facteur de tablette ; le contrôle « les cases ont la taille des nombres qui
les entourent » le mesure au navigateur.

**Le juge.** Chaque case a UNE bonne réponse qui ne dépend d'aucune autre
(`suiCases(q)` : l'entier attendu), lue par `parseDecToFrac` — « 6 000 »,
« 6000 », « 50 % » sont lus pareil. `corrChoix` pose les verdicts : juste en
bleu, faux en rouge avec la bonne réponse en vert à côté, vide remplie en
vert ; en soutien, rien n'est révélé et « Revérifier » reste. Le soutien
colore au fil de la frappe (`liveColorDec`). Le message d'une copie
incomplète dit la vérité (`msgAvecVides`) ; le pourquoi est le calcul de
CETTE question, étape par étape (`suiPourquoi`). Le contrôle joue une copie
juste (1 point, cinq cases bleues), une copie vide (quatre cases vertes,
aucune rouge, rien compté), une copie fausse (la case juste reste juste, la
fausse rougit avec son badge), le soutien, puis la reprise d'une pause par
`afficherEcranDe('sui')` et `restoreBoxes`.

**Les branchements**, tous tenus : `TESTS`, `THEMES`, l'écran `scr-sui`,
`testScreens`, la réserve du bas, `liveCheckCurrent`, `restartCurrentTest`,
`afficherEcranDe`, le rendu enveloppé (`renderSuiTest`), `RAPPELS_ID`
(`RAP_SUI`, la méthode de la fiche sans ses nombres), `QIA_SUGG.sui`,
`conseilCtxCourant` (`ctxSui`, réponses secrètes, et ce que l'élève a écrit),
`test.qId='augmentation-tableau'` à l'enregistrement, l'énoncé en
`.mp-instr`. Le contexte IA est déclaré dans `tests/profils.js`
(`aide.ctx.kinds`, `['sui','genSui()']`, en Première seulement, comme le
2.5.4).

**Le portail** (`site-maths`) a reçu le même exercice en PDF imprimable et
en page HTML autonome le même jour, avant que la demande ne précise « sur le
site de maths » : c'est ici, dans les exercices interactifs, qu'il vit. Les
deux fichiers du portail ont été retirés le lendemain, à la demande de
Turquet.

## Puis la question ② a gagné une méthode 1 : le tableau prolongé (novembre 2026, v409)

**La demande** (Turquet, le lendemain de la mise en ligne) : « pour la
question 2, proposer une autre méthode qui passera en méthode 1, avec un
tableau qui affiche les résultats de la question précédente, avec comme
première colonne "année" avec 2036, 2037… puis comme deuxième colonne nombre
d'années avec 0 ; 1 ; 2, et qui demande de compléter jusqu'à 2036. On
acceptera si l'élève saute des cases. La méthode déjà existante passera en
méthode 2. Les deux méthodes seront obligatoires. Inutile d'afficher le
tableau pour la méthode 2 finalement. »

**Méthode 1, le tableau prolongé** (`suiTableauM1`) : trois colonnes — le
moment réel (2026, 2027, … ; 8 h, 9 h, … ; 1<sup>er</sup> juin, 2 juin, …,
`suiMomentHTML`), le nombre de pas écoulés (0, 1, 2, …), la valeur. Les
lignes 0 à 3 sont ÉCRITES — les résultats de la question ①, pas la copie de
l'élève — ; les lignes 4 à N sont des cases (`sui-m1-4` … `sui-m1-N`), une
par ligne, jusqu'au pas N de la question. Le tableau « pour mémoire » qui
suivait les phrases a disparu de la question ② (la méthode 1 le contient) ;
la question ③ garde le sien.

**« On acceptera si l'élève saute des cases ».** Seule la dernière ligne est
attendue ; les lignes intermédiaires sont facultatives (`opt` dans
`suiCases`) : laissées vides, elles ne rougissent pas, ne comptent pas comme
oubliées dans le message (`comptees` exclut les lignes sautées de
`msgAvecVides`) et la correction les remplit en vert, pour que le tableau se
lise entier ; écrites, elles se jugent comme les autres — une ligne
intermédiaire FAUSSE refuse la question (`allOk = ok || (opt && vide)`). Elles
portent `.hors-note` : `ptsEcran()` ne les compte pas dans la note affichée
ni dans le crédit partiel d'une évaluation, et la boîte « Il reste des cases
vides » ne les relève pas. La convention est celle du 4.1 (la simplification
qu'on n'avait pas à écrire) ; `.hors-note` sur une case MathLive se pose par
le premier argument de `pmMF`.

**Les deux méthodes sont obligatoires** : une seule vérification, la question
est parfaite quand la dernière ligne du tableau ET les cinq cases des phrases
sont justes. Le pourquoi (`suiPourquoi`) et le contexte du modèle (`ctxSui`)
disent les deux méthodes ; le rappel de cours aussi (« les deux méthodes
donnent le même résultat : c'est une vérification »).

**Un commentaire non refermé a avalé une ligne.** Le premier jet écrivait
`const comptees = … ;   /* les lignes sautées ne « manquent » pas` sans `*/` :
le commentaire courait jusqu'au `*/` de la ligne suivante, et `suiMiroirs()`
— l'appel qui fait suivre les miroirs à la correction — était devenu du
commentaire, sans une erreur de syntaxe. C'est le contrôle de l'exercice qui
l'a vu (« après la correction, le miroir ne montre pas la valeur écrite en
vert »), à la question ③ qui n'avait pas changé : un contrôle écrit pour un
autre jour tient le lendemain.

**Le contrôle** (`tests/verifier.js`, bloc « question 2, deux méthodes
obligatoires ») : le tableau a N + 1 lignes et trois colonnes, sa ligne 3
écrit le résultat de la question ① et n'est pas une case, les cases 4 à N − 1
portent `.hors-note` et la dernière non, plus de tableau « pour mémoire » ;
une copie qui remplit la dernière ligne et les phrases en sautant les
intermédiaires vaut 1 point, sans rouge, les lignes sautées en vert hors
note, `ptsEcran` ne comptant que les cases attendues, le message ne disant
rien de « manquant » ; une ligne intermédiaire fausse refuse la question,
rougit, reçoit sa correction en vert ; le tableau entier juste vaut le point.

## Puis : plus de pourcentage, et le seuil au moins deux fois plus loin (novembre 2026, v412)

**La demande** (Turquet) : « ne pas mettre d'exemple avec des %, dans la
question 3 il faut que l'on demande un résultat qui soit au moins deux fois
plus loin que la question 2. »

**Plus de pourcentage.** La batterie du téléphone (100 %, −10 % par heure) était
le seul contexte en % : elle laisse place aux **feuilles de l'imprimante** (à
8 h, 100 ou 1 000 feuilles dans le bac, 10 ou 100 de moins par heure) — même
sens, mêmes heures, une unité qui se compte. Le contrôle refuse désormais un
contexte dont l'énoncé, les en-têtes ou les phrases écrivent « % ».

**Le seuil au moins deux fois plus loin** : dans `suiFamilles`, p ≥ 2N remplace
p ≠ N. Avec la règle du chiffre unique (p·b ≤ 9, donc p ≤ 9) et N ≥ 4 (au-delà
du tableau), N vaut toujours 4 et p vaut 8 ou 9 : la question ② porte sur
quatre pas (2030, 12 h, le 5 juin), la question ③ sur huit ou neuf (2034 ou
2035, 16 h ou 17 h, le 9 ou le 10 juin). La variété vient des contextes, de la
valeur de départ (100 ou 200 ; 1 000 ou 2 000 ; 900 ou 1 000) et de
l'échelle. Les familles restent assez nombreuses pour que `distincte` tienne
(trois à six par contexte, deux contextes par séance). Le contrôle vérifie
p ≥ 2N sur 300 séances.

## Puis : au moins trois lignes à compléter dans la méthode 1 (novembre 2026, v417)

**La demande** (Turquet) : « dans la méthode 1 l'élève doit compléter au moins
trois lignes pour arriver au résultat ».

**Ce que le tirage interdit.** La méthode 1 écrivait les lignes 0 à 3 (les
résultats de la question ①) et demandait les lignes 4 à N. Or N vaut toujours
4 : le chiffre unique borne p à 9, et le seuil au moins deux fois plus loin
impose p ≥ 2N — la question ② ne peut pas porter plus loin que le pas 4 sans
casser l'une des deux règles précédentes (pousser N à 6 demanderait p ≥ 12,
donc p = 20 et une valeur d'arrivée à deux chiffres non nuls, quel que soit le
départ). La méthode 1 n'offrait donc qu'UNE ligne à remplir : la dernière.

**Le remède est du côté des lignes écrites, pas du tirage.** Le tableau de la
méthode 1 n'écrit plus que les lignes 0 et 1 — le départ et le premier pas, qui
montrent de combien on avance — et l'élève complète les lignes 2 à N : trois au
moins, puisque N ≥ 4 (`SUI_M1_ECRITES`, une constante lue par `suiCases`,
`suiTableauM1`, `suiPourquoi` et le contexte envoyé au modèle). Les lignes 2 et
3 sont celles que l'élève a déjà trouvées à la question ① : il les reporte, puis
poursuit — c'est bien « compléter le tableau », ligne à ligne. La règle
d'octobre tient : seule la dernière ligne est attendue, les intermédiaires
restent `.hors-note` et une ligne sautée ne manque pas ; une ligne écrite fausse
refuse toujours la question.

**Le contrôle** (`tests/verifier.js`, bloc « question 2, deux méthodes
obligatoires ») lit les lignes 0 et 1 écrites (la valeur de départ, le premier
pas) sans case, compte les cases du tableau — au moins trois, exactement N − 1,
du pas 2 au pas N — et vérifie la présence de chaque case `sui-m1-2` à
`sui-m1-N` ; le bloc des 300 séances exige à chaque tirage au moins trois cases
de méthode 1. Le reste du bloc (copie aux lignes sautées, ligne intermédiaire
fausse, tableau entier) tourne inchangé sur les nouvelles cases.

## Puis : le pas est un multiple de 10, ou 25, ou 110, 120, 150 (novembre 2026, v417)

**La demande** (Turquet, le même jour) : « il faut que l'addition ou soustraction
à faire soit un multiple de 10 quand il est inférieur à 100 ou sinon 25, et
110 ; 120 ou 150 quand il est supérieur à 100. »

**Ce que la règle remplace.** Jusque-là, chaque nombre de chaque étape n'avait
qu'un seul chiffre non nul : le pas valait 1, 2 ou 3 fois une puissance de dix,
la valeur de départ 1 à 10 fois la même puissance, et toute la combinatoire
(`suiFamilles`, `suiUn`) tenait cette règle. Un pas de 25, de 110 ou de 150 ne
peut pas la respecter : la règle du chiffre unique s'efface, et c'est la liste
du pas qui gouverne — `SUI_PAS` : 10 à 90 de dix en dix, 25, 100 (multiple de
10 posé sur la frontière, gardé), 110, 120, 150. Les valeurs du tableau en
découlent (1 000, 1 110, 1 220… ; 700, 630, 560… ; 100, 125, 150…) et restent
des additions ou des soustractions qui se font de tête.

**La valeur de départ** est un nombre rond choisi par le contexte (`u0`, une
liste par contexte : centaines pour les arbres et le roman, jusqu'à 2 000
feuilles, milliers pour la piscine et les abonnés) ; un contexte borne son pas
quand la situation l'exige (`rMin`, `rMax` : le tuyau de la piscine apporte au
moins 100 L par heure, Léa ne lit pas 150 pages par jour, une chaîne gagne au
moins 50 abonnés). Une quantité qui diminue ne tombe jamais à zéro au seuil.

**N et p.** Le seuil reste au moins deux fois plus loin (p ≥ 2N) et entre dans
la table de 10 (`SUI_P_MAX`) : N vaut 4 ou 5, p de 8 à 10. La question ② peut
donc porter sur cinq pas, la méthode 1 offrir quatre lignes à compléter — trois
au moins dans tous les cas. 1 809 combinaisons sur les six contextes (80 pour la
piscine, la plus contrainte) : `distincte` a de quoi tirer.

**La question range `u0` et `r`**, plus `(a, b, k)` : `suiVals` lit encore un
brouillon de pause rangé avant la v416 (`q.u0` absent → a·10^k), pour qu'une
reprise le jour de la publication ne casse pas.

**Le contrôle** (`tests/verifier.js`, bloc des 300 séances) ne cherche plus le
chiffre unique : il relit chaque pas dans la liste de la demande — écrite en
dur dans le banc, pas lue dans la page —, la valeur de départ parmi les valeurs
rondes de son contexte et multiple de 100, p ≤ 10, le seuil au moins deux fois
plus loin, rien de nul ni de négatif, et toujours au moins trois lignes de
méthode 1.

## Puis : le pas est uniquement un multiple de 10, de 10 à 100 (novembre 2026, v420)

**La demande** (Turquet, l'après-midi) : « finalement enlever ou ajouter
uniquement un multiple de 10 compris entre 10 et 100 inclus ».

La liste du matin (dizaines, 25, 110, 120, 150) se resserre : `SUI_PAS` ne
garde que 10, 20, …, 100. Rien d'autre ne bouge — la valeur de départ ronde du
contexte, N à 4 ou 5, le seuil au moins deux fois plus loin dans la table de
10, les trois lignes au moins de la méthode 1. Le tuyau de la piscine, qui
exigeait un pas d'au moins 100 L par heure quand 110, 120 et 150 existaient,
descend à 50 L par heure (`rMin:50`) pour garder six pas possibles au lieu
d'un seul ; Léa reste à 90 pages par jour au plus, la chaîne à 50 abonnés au
moins. 1 414 combinaisons sur les six contextes.

**Le contrôle** (`tests/verifier.js`, bloc des 300 séances) relit le pas dans
la liste « 10 à 100 de dix en dix », écrite en dur dans le banc.
