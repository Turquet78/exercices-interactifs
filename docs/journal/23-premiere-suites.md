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

## Puis : la pose facultative à côté de la case, et le pas selon le rang de l'exemple (novembre 2026, v422)

**Les demandes** (Turquet, le lendemain, en cinq messages) : « mettre l'addition
ou la soustraction posée, comme dans l'exercice 2.3 par exemple, en mode
facultatif, mais qui doit apparaître à côté de la case du tableau qui doit être
remplie quand on clique dessus ; l'opération posée disparaît quand on clique sur
une autre case » ; « quand il y a une addition ou une soustraction à la fin de
la question 2, poser aussi l'opération à côté de la case réponse » ; « dans la
question 3 pour trouver l'écart, poser la soustraction de manière facultative
aussi à côté de la case » ; « dans le premier exemple je veux que l'addition ou
la soustraction soit 10, 20 ou 30 » ; « pour le deuxième exercice on mettra une
addition ou une soustraction avec des multiples de 10 entre 40 et 90 ».

**Le moteur est celui des pourcentages.** `poseOpEleveMAJ` (le 2.2.2, le 2.3.2,
les 2.2.11 et suivants) sait déjà poser une addition ou une soustraction qui
suit les nombres de l'élève, dans le cadre « ✦ Facultatif » (`pt-opt`), et la
cacher quand rien ne se pose (une soustraction qui descendrait sous zéro). Il
lit ses deux termes dans des cases par leur identifiant : la pose du 7.1 lui
tend deux `<input type="hidden">` par case, remplis au moment de montrer. Ce qui
est à l'exercice, c'est le CHOIX DES TERMES (`suiPoseSpec`) et la PLACE
(`suiPosePlacer`).

**Les termes suivent les nombres de l'élève.** Pour une case du tableau — les
lignes 1 et 2 de la question ①, les lignes 2 à N de la méthode 1 — le premier
terme est la ligne remplie la plus proche AU-DESSUS : la valeur que l'élève y a
écrite, juste ou non (c'est une aide pour SON calcul, pas une révélation), ou
celle que la page a écrite (les lignes 0 et 1) ; le second, autant de pas que
de lignes franchies — une ligne sautée donne 2 × 20 = 40, trois lignes
sautées 80 : la pose reste disponible à qui saute, c'est le calcul qu'il fait
de tête. Pour le résultat de la question ② (`sui-res`), les termes sont le
départ et le produit que l'élève a écrits dans les phrases ; tant qu'il manque
l'un des deux, pas de pose. Pour l'écart de la question ③ (`sui-e`), les deux
nombres de l'énoncé, le plus grand moins le plus petit — une soustraction
dans les deux sens de variation. Un terme à virgule ne se pose pas (seuls les
entiers se lisent).

**Une pose par case, une seule visible.** Chaque case a son élément
(`suiPoseStep-<id>`), créé au premier focus et gardé : ce que l'élève y a écrit
survit quand il passe à une autre case et revient — à moins que les termes
n'aient changé (il a corrigé la ligne du dessus), auquel cas le moteur
reconstruit. Montrer une pose cache les autres. Deux portes en capture sur le
document la cachent quand le focus ou un clic va ailleurs — sauf dans la pose
elle-même, sur le clavier à l'écran, sur le pavé ou sur un bouton : « Vérifier »
doit pouvoir juger ce qu'on y a écrit, et la pose jugée reste visible après la
correction (les portes se taisent quand la question est verrouillée). La case
cliquée remontre la sienne : la porte du document passe en capture, l'écouteur
de la case passe après.

**Hors note, jugée comme au 2.2.2.** Les cases de la pose portent `.hors-note`
— `ptsEcran` ne les compte pas, la boîte des cases vides ne les réclame pas, la
flèche → les atteint comme des cases ordinaires (elles sont dans la couche
`#suiPoses`, en fin d'écran). À la vérification, une pose non entamée n'est pas
jugée ; une pose entamée se corrige au mot près du 2.2.2 : résultat bleu ou
rouge avec sa pastille, la bonne valeur en vert sur une case vide ou en badge
sous une case fausse, une retenue jugée seulement si elle est écrite. Le point
de la question ne dépend jamais de la pose.

**La place.** La couche est absolue dans `#suiHost` (`position:relative`) : la
pose se pose à droite de la case, à sa hauteur, 26 px au-dessus pour que
l'opération encadre la ligne ; si elle sortait du cadre à droite (tablette,
téléphone), elle descend sous le tableau ou la phrase de la case, alignée à
gauche. Elle couvre ce qui se trouve dessous — un clic dessous la cache, et
rend la place.

**Le pas selon le rang.** `SUI_PAS_RANGS` : le premier exemple de la séance
ajoute ou retire 10, 20 ou 30, le deuxième un multiple de 10 de 40 à 90, les
suivants puisent dans toute la liste. La séance choisit à chaque rang un
contexte qui sait tenir la plage (la piscine et la chaîne, qui ne descendent pas
à 30, n'ouvrent jamais la séance), sans remise tant qu'il reste des contextes ;
`suiTirer` reçoit la plage et filtre les familles. 300 séances : le premier
exemple à 30 au plus, le deuxième entre 40 et 90, six contextes distincts sur
dix-huit questions.

**Le contrôle** (`tests/verifier.js`, bloc « 4 bis ») : au focus de la ligne 1
de la question ①, la pose paraît, avec les termes u0 et r, le signe du sens,
des cases de résultat `.hors-note`, dans le cadre facultatif ; la ligne 2 lit
la valeur que l'élève a écrite à la ligne 1 ; la ligne 1 effacée, la pose de la
ligne 2 part de la ligne 0 avec deux pas ; le focus ailleurs cache tout ; en
question ②, la dernière ligne de la méthode 1 pose la ligne 1 avec N − 1 pas,
le résultat ne se pose qu'une fois départ et produit écrits ; en question ③,
l'écart pose le plus grand moins le plus petit ; une pose entamée d'un chiffre
faux rougit, garde sa pastille, ne coûte pas le point, ne compte pas dans
`ptsEcran`, et reste visible après la correction. Le bloc des 300 séances
relit le pas des deux premiers exemples. Ce qu'il ne voit pas : la place à
l'écran (jsdom n'a pas de géométrie) — elle se regarde en ligne.

## Puis la pose a trouvé sa place : à droite de tout l'écrit, dans le cadre (novembre 2026, v426)

**La demande** (Turquet, capture d'écran à l'appui) : « l'opération posée doit
être plus à droite et un peu plus haut pour rester sur le quadrillage de
l'exercice ; les opérations posées ne doivent pas être sur les écritures et
rester sur le quadrillage ».

**Ce qui se voyait.** La pose partait du bord de la CASE, 14 px plus loin : la
case est dans une cellule qui a sa marge, la pose couvrait donc la dernière
colonne du tableau (le 1 910 de la ligne 3 passait dessous). Et elle descendait
sous le cadre de l'exercice, sur les boutons « Vérifier » et « Poser une
question à l'IA » — la question ① n'a qu'un tableau de quatre lignes, plus
court que la pose.

**La place, désormais** (`suiPosePlacer`) : le bord droit de TOUT ce qui est
écrit sur la ligne de la case, 24 px plus loin — mesuré sur les rectangles des
fragments de texte et des cases (`Range.getClientRects`), pas sur les boîtes
des éléments : un paragraphe occupe toute la ligne même quand son texte est
court, et la pose aurait toujours cru la droite prise (le premier passage du
contrôle l'a montré sur la phrase de la question ②). À 34 px au-dessus de la
case, et SUR RIEN : si la pose y recouvrait une écriture du cadre, on la
descend au ras de sa ligne, et sinon SOUS tout le contenu de la question,
alignée à gauche de sa ligne. Le cadre (`#suiHost`) grandit par `min-height`
quand la pose en sort par le bas — le quadrillage reste derrière elle — et
reprend sa taille à chaque rendu.

**Le second passage a appris la règle à l'envers.** La première écriture
REMONTAIT la pose quand elle dépassait du cadre, pour la garder dedans : en
question ②, la pose du résultat remontait de deux cents pixels et se posait
sur le tableau de la méthode 1 et sur la phrase du dessus — « COUVRE case
sui-m1-3, COUVRE texte « jours elle lira » », a dit le contrôle, en nommant ce
qu'elle couvrait. Une pose ne remonte jamais au-dessus de sa ligne : c'est le
cadre qui descend.

**Le contrôle** vit dans le banc navigateur — seul un navigateur sait où tombe
la pose (« 11 quindecies », Première ; les autres niveaux se déclarent) : au
focus de la ligne 1 de la question ①, la pose est à droite du tableau entier
(8 px au moins après son bord), dans le cadre, et ne recouvre aucune écriture
du cadre (cases comprises) ni aucun bouton ; le résultat de la question ②,
départ et produit écrits, de même ; sur une tablette debout, la dernière ligne
de la méthode 1, qui n'a plus de place à droite, reste dans le cadre et ne
couvre ni le tableau ni les phrases de la méthode 2 qui suivent.

## Puis les questions en grand, les réponses en petit (novembre 2026, v428)

**La demande** (Turquet) : « je souhaite que l'on voie mieux les questions et
moins les textes de la réponse : agrandir la police des questions et mettre en
gras, réduire la police des réponses et ne pas mettre en gras, faire la même
chose pour les cases dans les phrases-réponses ».

**Ce qui change.** Les questions (`.sui-q` : « 1. Compléter le tableau. »,
« 2. Calculer… », « 3. À quelle heure… ») passent de 1,12 rem à 1,42 rem, en
gras ; les consignes de méthode (`.sui-meth`, « Méthode 1 : complète le
tableau… ») de 1,02 à 1,18 rem, en gras. Les phrases-réponses (`.sui-phr`)
descendent de 1,35 à 1,05 rem et perdent leur demi-gras (Fredoka 400) ; leurs
cases MathLive et le « = » qui les annonce suivent, à 1,05 rem — la règle
« une case a la taille des nombres qui l'entourent » tient toujours, c'est
l'entourage qui a rétréci (une règle plus précise, `#suiHost .sui-phr
math-field.pm-mf`, pour ne pas toucher aux cases du tableau, qui gardent la
taille de ses nombres). Sur un téléphone, les mêmes proportions, un cran plus
petit. Les miroirs (`.sui-mir`) héritent de la phrase.

**Ce qui le tient.** Le contrôle universel des tailles (banc navigateur,
section 9) mesure chaque case contre les nombres qui l'entourent — dans le
tableau comme dans les phrases ; le contrôle « 11 quindecies » remesure la
place de la pose, qui dépend de la hauteur des lignes.

## Puis la pose d'une case de tableau s'est alignée sur le tableau (novembre 2026, v431)

**La demande** (Turquet, capture à l'appui) : « mettre l'opération facultative
sur la même ligne que le tableau et un peu plus à gauche, pour la question 1 ».
La pose partait 34 px au-dessus de la case cliquée (la ligne 2) et dépassait
sous le tableau de quatre lignes, le cadre grandissant d'autant.

**Ce qui change** (`suiPosePlacer`) : pour une case de TABLEAU — la question ①
comme la méthode 1 de la question ② —, la pose s'aligne sur le haut du tableau
et le suit à 8 px (24 auparavant) : elle accompagne le tableau entier, pas la
ligne cliquée. Si cette place recouvrait une écriture, le repli reste le même :
au ras de la case, puis sous tout le contenu. Une case de phrase ne change pas.

**Et la question ③** (« mettre l'opération posée à côté du tableau, en bas,
alignée avec le tableau et pas trop près ») : l'écart n'a pas de tableau à
lui, sa phrase est en haut de l'écran et le tableau « pour mémoire » en bas ;
la pose s'ancre sur ce tableau — alignée sur son haut, 24 px après son bord
droit, « pas trop près » — plutôt qu'à droite de la phrase. Une case de
phrase sans tableau de rappel (le résultat de la question ②) garde sa règle.

**Le contrôle** (« 11 quindecies ») mesure maintenant, sur la question ③, que
la pose de l'écart a le haut du tableau « pour mémoire » à 2 px près et le
suit de 16 à 40 px ; sur la question ① et
sur le tableau de la méthode 1 de la question ② (« même chose pour les
opérations du deuxième tableau »), que le haut de la pose est celui du tableau
à 2 px près et que l'écart à sa droite ne dépasse pas 12 px — en question ②,
sans couvrir les phrases de la méthode 2 qui suivent : le tableau prolongé a
cinq ou six lignes, la pose tient dans sa hauteur.

## Puis le jour de départ s'est tiré, et les miroirs ont perdu leur pointillé (novembre 2026, v431)

**« Ne pas commencer un premier du mois forcément »** (Turquet). Le roman de
Léa et la cuve commençaient toujours le 1er : le jour de départ (`q.j0`, 1 à
20, `SUI_J0_MAX`) est tiré avec la question et rangé dedans — jamais à
l'affichage, la règle des énoncés —, et tout ce qui écrit une date le lit :
`suiMoment(c, n, j0)`, `suiMomentHTML` (qui ne garde « 1<sup>er</sup> » que
pour le 1), l'énoncé (`intro(u0, r, m0)`), les phrases (`p2(m, m0)`,
`p3(T, u0, m0, j0)` : « Donc ce sera le 5 + [k] = [fin] juin »), le tableau
prolongé, le contexte envoyé au modèle. Vingt au plus : avec p ≤ 10, la
question ③ reste dans le mois. Un brouillon d'avant lit 1. Le contrôle des
300 séances voit passer trois jours de départ au moins, aucun seuil après le
30, et relit sur une question épinglée au 5 l'énoncé, la phrase du seuil et
le moment calculé.

**« Ne pas mettre de pointillé en dessous »** (Turquet, capture à l'appui) :
les miroirs (`.sui-mir`, les cases suivantes d'une donnée, qui recopient la
première) étaient soulignés de pointillés pour dire qu'on n'y écrit pas ; le
pointillé est parti, le miroir se lit comme un nombre écrit, en bleu, sur un
fond nu. Les « … » du miroir vide restent.

## 7.2 {augmentation-tableau-libre} : le 7.1 rédigé, un seul champ par question

Demande de Turquet, novembre 2026 : « en première créer un exercice comme le
7.1, mais il n'y aura qu'un champ de saisie pour les réponses. On acceptera
toutes les méthodes possibles pour les réponses, avec une suite de nombres
(300 ; 350 ; 400…), avec des phrases comme “il y a 6 années donc 6 × 20 = 120”,
“je fais 500 − 120 = 380” ; on acceptera aussi le résultat brut donné
directement. C'est l'IA qui analysera les réponses. »

**Rien de neuf dans le tirage** : `suiBuildQuestions`, `SUI_CTX`, `suiVals`
sont lus, jamais recopiés — les mêmes contextes, les mêmes trois questions
(le tableau, la valeur au bout de N pas, le pas du seuil), les mêmes nombres à
un seul chiffre non nul. Kind `suil`, écran `scr-suil`. Ses questions s'écrivent en grand et en gras, comme celles du 7.1 (v428). La question ① montre
le tableau, ses lignes 1 et 2 marquées « ? » ; la ③ garde le tableau rempli
pour mémoire. Le champ unique est la feuille de RÉDACTION du 2.5.6
(`mlFeuille` en mode « redaction », `salEspaces`) : la barre d'espace écrit
une espace, les lettres sont sur le clavier B des tablettes, Entrée ajoute une
ligne.

**L'IA lit, mais la page juge l'arithmétique** (la règle du journal 08 : un
verdict arithmétique ne se confie pas à un modèle). `suilJuge`, à trois
positions comme `eslJuge` :
* il REFUSE sur un fait prouvable — une égalité « a op b = c » fausse (nommée,
  sans la bonne valeur), ou la bonne réponse absente d'une copie qui écrit des
  nombres (en ① : les deux valeurs) ;
* il ACCEPTE quand tout est positivement vérifié — la bonne réponse écrite, et
  c'est le dernier nombre de la copie hors étiquettes (« 400 arbres en 2031 »,
  « il faudra 10 ans donc en 2036 ») ; chaque égalité vraie ; chaque nombre
  explicable par la situation (une valeur de la suite u0 + j·r, un multiple du
  pas, un compte jusqu'à 60, une année) ;
* il S'ABSTIENT sinon, et le modèle juge seul : « 300 ; 350 ; 400 » sur un pas
  de 20 (350 n'est pas une valeur de la suite), l'enchaînement
  « 5 × 20 = 100 + 300 = 400 » (le résultat repris dans le calcul suivant —
  faux à la lettre, la page ne tranche pas), un calcul collé à une unité
  (« 8 h + 8 = 16 h »), un nombre écrit en lettres.
Quand il sait, son verdict prime, comme au 2.5.6 : le modèle ne rédige que les
acceptations sur lesquelles il est d'accord, la phrase du juge s'affiche sur
un refus, et en panne du service le juge répond seul.

La copie arrive de `toPlain` sans les espaces entre les mots et avec « * »
pour « × » : `suilNorm` relit « x » entre deux nombres comme « × », et recoud
les espaces de milliers (« 1 000 »). En entraînement, une réponse fausse
reçoit le corrigé des deux méthodes (`suilCorrection`) ; en soutien, on
revérifie (pas de correction au fil de la frappe : `soutienEnDirect.sans`).
Un point par question, la note par `finishTest` sous `test.qId`.

**Le prix** : comme toutes les rédigées de la Première, le texte de la
feuille n'est pas rangé par la pause (ses lignes n'ont pas d'identifiant) — la
reprise rouvre la question, champ vide.

**Puis la question ① est revenue dans le tableau** (demande de Turquet,
novembre 2026, v435 : « dans la question 1, laisser l'élève remplir les cases
du tableau sans faire un champ de saisie »). Ses deux cases sont celles du 7.1
(`suiTableau`, `sui-t1` et `sui-t2`) et son juge aussi (`checkSuilTableau` :
une bonne réponse par case, `corrChoix`, le soutien qui colore au fil de la
frappe par `liveColorDec` — `suil` a donc quitté `soutienEnDirect.sans` et
entre dans `liveCheckCurrent`). Ni feuille ni modèle pour cette question ; les
questions ② et ③ gardent leur champ unique, lu par le juge et l'IA. Les cases
ont un identifiant : la pause les range, contrairement à la feuille.

**Puis le deuxième exemple a ajouté ou retiré 60, 70, 80, 90 ou 110** (demande
de Turquet, novembre 2026, v436 : « pour le deuxième exercice dans le 7.1 et
7.2, mettre une addition ou soustraction parmi les nombres 60 ; 70 ; 80 ; 90 ;
110 »). `SUI_PAS_RANGS` porte désormais la LISTE des pas de chaque rang —
`[10, 20, 30]` puis `[60, 70, 80, 90, 110]` — et `suiFamilles(c, pas)` tire
dans cette liste ; 110 reste hors de `SUI_PAS` : c'est la seule exception à
« un seul chiffre non nul », et elle n'existe qu'au deuxième exemple. Le 7.2
tire par la même fonction, son juge lit 110 comme un autre pas (les multiples
du pas, les valeurs de la suite). Les textes qui promettaient « un seul
chiffre non nul » à l'élève (rappel, description, contexte de l'IA) disent
maintenant « des nombres ronds ». Le contrôle du tirage (banc principal)
exige un pas de la liste au deuxième exemple, et que 110 sorte en 300 séances.

**Puis la question 2 multiplie par 7 à 12, et ne part plus le 1er du mois
(v438).** Demande de Turquet, pour le 7.1 et le 7.2 : « pour la deuxième
question, je veux que ça ne commence pas le 1er du mois, et je veux qu'il
faille mettre entre 7 fois et 12 fois le nombre ». Le tirage est commun aux
deux exercices (`suiBuildQuestions`) :
- **N, le nombre de pas de la question 2, va de 7 à 12** (`SUI_N_MIN`,
  `SUI_N_MAX`) au lieu de 4 ou 5 — le tableau de la méthode 1 s'allonge
  d'autant (au plus treize lignes, dont deux écrites).
- **La règle « le seuil de la question 3 au moins deux fois plus loin »
  (p ≥ 2N) est gardée** : p va donc de 14 à 2N + 2 (`SUI_P_ECART`) — la
  question 3 sort de la table de 10, c'est la conséquence nommée (l'élève
  divise par exemple 1 440 par 60). p est borné par le contexte
  (`suiPMax`) : l'heure finit au plus à 23 h (l'imprimante et la piscine ne
  tirent donc que N = 7), la date au plus le 30.
- **Le jour de départ va de 2 à 20** (`SUI_J0_MIN`), et au plus 30 − p, pour
  que la date de la question 3 reste dans le mois.
Le banc principal a suivi (300 séances : N de 7 à 12, p ≥ 2N, jamais le 1er,
ni 24 h ni 31 juin) ; mesuré dans Chromium sur 4 000 questions : N de 7 à 12,
départ du 2 au 16, aucune heure ni date impossible, aucune valeur nulle.

**Puis le nombre de fois des questions 2 et 3, fixé couple par couple
(v440).** Demande de Turquet, qui remplace la règle de la v438 (« entre 7 et
12 fois », et le seuil au moins deux fois plus loin) : « pour la question 2,
le nombre de fois est 5 ou 6 ou 7 ; si c'est 5 à la question 2, faire 8 ou 9
fois pour la question 3 ; si c'est 6, faire 8 ou 9 ou 10 ; si c'est 7, faire
10 ». Une seule table le porte, `SUI_N_P = {5:[8,9], 6:[8,9,10], 7:[10]}`,
que `suiFamilles` parcourt ; `suiPMax` borne toujours p par le contexte
(heure au plus 23 h, date au plus le 30). La question 3 revient dans la
table de 10. Le jour de départ reste de 2 à 20. Le banc principal lit la
même table (300 séances). Mesuré dans Chromium sur 4 000 questions : les six
couples (5→8, 5→9, 6→8, 6→9, 6→10, 7→10) sortent chacun environ une fois sur
six, tous les contextes en tirent, aucune heure, date ou valeur impossible.
