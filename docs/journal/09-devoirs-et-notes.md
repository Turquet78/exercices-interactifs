# Devoirs, fiches, notes et carnet du professeur

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Une case juste se marque `ok`, jamais `good`.** `ptsEcran()` calcule la note
affichée sous le retour de chaque question, et il ne connaît que trois classes :
`ok`, `bad` et `sol`. Une case juste marquée autrement n'est comptée nulle part —
elle sort du dénominateur en même temps que du numérateur. Une question réussie à
trois cases sur cinq annonçait donc « 0 case juste sur 2 », et une question TOUTE
juste n'affichait plus de note du tout, `ptsEcran()` ne trouvant plus une seule
case à compter. Deux exercices de la Seconde marquaient `good` : les ensembles de
nombres et la lecture graphique — la note enregistrée en base, elle, était juste ;
seule celle montrée à l'élève mentait, ce qui est précisément ce qui l'a laissée
passer. Rien ne rougissait, et le mot `good` est parfaitement sensé partout
ailleurs — il reste sur les pastilles ✓/✗, les retours et les boutons, que
`ptsEcran()` ne regarde pas. Un contrôle répond juste, pour de vrai, sur chaque
exercice à cases et relit ce que la page a compté.

**Deux exercices peuvent partager un moteur — mais pas leur identité.** Le
calcul mental et les additions-soustractions tournent sur le même `kind`
(`cm`), le même écran et la même ardoise : seul le tirage change. Trois choses
sont alors indexées par le `kind` et se retrouveraient partagées à tort — la
note, le rappel de cours et les questions à l'IA. La note passe donc par
`test.qId` comme partout ailleurs, le rappel par `RAPPELS_ID` (indexé par
identifiant), et `qiaSuggestions()` fait primer l'identifiant sur le `kind`
quand il a une entrée. Le contrôle des rappels IGNORAIT un identifiant qu'il ne
connaissait pas : un exercice ajouté sans rappel passait au vert. Il le signale
maintenant, comme le fait celui de la Seconde.

**Un devoir peut allonger la séance des tables, dans des bornes.** Le format
normal est `TM_NB` calculs — ce que l'élève trouve au menu. Un devoir peut en
demander davantage sur le niveau 1, et sur lui seul : le niveau 2 tire les
produits les plus ratés, sa liste a sa propre logique. Le réglage vit sur
l'entrée de l'exercice dans le devoir, à côté des modes, et n'est lu qu'à un
endroit (`tmNbDevoir()`) plutôt que rangé dans une variable de plus —
`currentPasse` avait montré ce que coûte un état parallèle qu'il faut penser à
remettre à zéro partout. L'affichage et la note, eux, lisent le TIRAGE
(`tmNb()`) et non le devoir : après une reprise de pause, c'est la séance
commencée qui fait foi, le devoir ayant pu changer entre-temps. `TM_NB_CHOIX`
borne les deux côtés, l'éditeur ET la relecture : le réglage est un simple
champ JSON qu'on peut éditer à la main dans la base, et une valeur bricolée
doit retomber sur le format normal plutôt que produire une séance de quatre
cents calculs. Un contrôle tient ces quatre bords.

**Les fiches de travail en classe sont des devoirs sous un autre nom — et
c'est UNE table qui le dit.** Seconde et Première ont une seconde famille de
devoirs (demande de Turquet, août 2026) : les fiches de travail en classe.
Même structure, même écran élève, même éditeur, mêmes notes — `details.dm`
porte l'identifiant, préfixé `fc_` au lieu de `dm_`. Tout ce qui change d'une
famille à l'autre tient dans `GENRE_DEVOIRS` (titres, badges, clé de stockage),
et nulle part ailleurs : deux moteurs auraient fini par diverger.
**Deux CLÉS de stockage, et c'est le point qui ne se voit pas** : le portail
(dépôt `site-maths`) lit `valeurs.devoirs` pour sa page publique « Devoirs ».
Une fiche rangée dedans y serait publiée. Les fiches vivent sous
`valeurs.fiches`, et l'enregistrement d'une famille ne touche JAMAIS l'autre —
il relit la configuration puis n'écrit que sa clé.
**Côté élève, les deux familles sont chargées dans UNE liste, étiquetées** :
le détail d'un devoir et le retour après un exercice n'arrivent qu'avec
l'identifiant, et c'est l'étiquette qui remet le bon titre en haut de l'écran.
Un sabotage l'a montré : sans elle, l'élève revenait d'un exercice de fiche
sur un écran titré « Devoirs à la maison ».
**Le contrôle vit DANS la chaîne séquentielle des contrôles asynchrones** —
entre `coursEnPdf` et `longueurContexteIA` — parce qu'il ré-injecte le double
de la base : lancé en parallèle, un autre contrôle lui reprenait `sb` en plein
vol (« panne simulée » au milieu d'une lecture). C'est le piège documenté des
deux contrôles qui se rendent `sb` à tour de rôle, retombé tel quel. Six
sabotages sur les deux niveaux ; le banc navigateur fait le trajet professeur →
élève en Première (la Seconde n'a jamais déclaré `devoirsEleve` — manque
antérieur à cette page, le banc principal couvre ses fiches).
**La liste des devoirs est COMPACTE : le numéro, le titre, la note s'il y en a
une** (demande de Turquet, août 2026) — et le CONTENU ne vit que sur la page du
devoir, ouverte au clic. La liste recopiait le contenu entier de chaque devoir,
exercice par exercice avec leurs pourcentages : les deux pages se ressemblaient
au point qu'on ne voyait plus laquelle était la liste. Une carte dit maintenant
« Devoir n°7 · le plus récent », le titre, « Note : 12,5 / 30 » quand quelque
chose a été fait et « À faire » sinon, et le nombre d'exercices. Le total de la
Première passe par `exercicesDevoir()`, comme sa page de détail — deux calculs
auraient donné deux totaux. Quatre bords au contrôle, chacun éprouvé par
sabotage : le contenu absent de la liste, « À faire » quand rien n'est fait, la
note quand elle existe, et le contenu bien PRÉSENT sur la page du devoir.

**Deux réglages par exercice d'un devoir : le nombre de questions, et le
plafond du soutien** (demande de Turquet, août 2026, les trois niveaux —
devoirs et fiches). Dans l'éditeur, chaque ligne d'exercice porte
« Questions » (vide = le format normal) et « Soutien » (la note maximale du
mode soutien : 5/10 par défaut, jusqu'à 10). Le réglage vit sur l'ENTRÉE de
l'exercice dans le devoir (`nbQ`, `smax`) — le motif de `tmNbDevoir` — et le
défaut ne s'écrit jamais : un devoir normal garde exactement la forme qu'il
avait avant que le réglage n'existe.
**La coupe ne sait que RÉDUIRE.** `lancerDevoirExo()` est l'entonnoir du
lancement depuis un devoir : il pose le contexte, démarre par la porte
normale, puis `dmAppliquerNbQ()` ne garde que les nbQ premières questions du
tirage et redessine par `afficherEcranDe()` — la table du rejeu et de la
reprise, donc un exercice ajouté demain est couvert dès qu'il y entre, et les
tables de multiplication (hors table) gardent leur réglage propre à elles.
Une valeur au-delà du format normal y retombe ; après une reprise de pause,
le tirage sauvegardé fait foi — il porte déjà la coupe. En Terminale,
l'ÉNONCÉ du circuit papier applique la même coupe AVANT la photographie : la
feuille du professeur doit montrer exactement la séance de l'élève.
**Le plafond du soutien entre dans `noteDevoirExo(…, smax)`** — 5 hors
devoir et par défaut, borné 6..10 sinon (un plafond bricolé dans le JSON
retombe sur 5) ; en Terminale la note POSÉE par le professeur prime
toujours. La carte du mode soutien DIT le plafond réglé — un élève à qui on
promet 5 quand le devoir en donne 8 ne tenterait pas le soutien. Un contrôle
par niveau tient les quatre bords (la note, la coupe et sa borne et sa
non-fuite hors devoir, la carte qui dit le plafond, l'éditeur qui emporte
les réglages sans jamais écrire le défaut), éprouvé par sept sabotages sur
les trois fichiers, chacun nommé.

**Sur le parcours du 1.6 (Première), « Questions » règle CHAQUE NIVEAU — la
coupe générique y faisait pire que rien.** Demande de Turquet (août 2026) :
« le nombre de questions que je fixe correspond au nombre de questions par
niveau dans cet exercice qui contient 5 niveaux ». L'exercice est un
PARCOURS : cinq niveaux qui RETIRENT chacun leurs questions (`goNextLevel`),
là où la coupe générique de `dmAppliquerNbQ` ne connaît qu'UN tableau. Elle
ne raccourcissait donc que le niveau 1 en laissant `perLevel` à 5 : l'écran
mentait (« Question 1 / 5 »), la fin de niveau (`idx===perLevel-1`)
n'arrivait jamais, et la 3ᵉ question lisait un tirage qui n'existe pas —
écran figé chez l'élève, sans erreur visible nulle part.
**Le démarreur lit donc le réglage LUI-MÊME** (`fracpNbDevoir()`, le motif de
`tmNbDevoir` : un kind dont le tirage a sa propre logique applique son
réglage à sa porte) : tous les niveaux tirent à cette taille, et la coupe
générique n'a plus rien à couper (`length <= n`) — elle devient inerte sans
qu'on l'ait touchée, comme pour les tables. **Le seuil de passage SUIT** :
« 4 sur 5 » n'a jamais été 80 %, c'est UNE erreur permise — `max(1, n−1)` —
sans quoi un niveau à 2 questions exigerait 4 justes et serait infaisable,
le pire défaut possible sous un autre habit. Une valeur hors du format
normal (1..5) retombe sur 5 — on ne sait que réduire — et hors devoir rien
ne change (`dmReglageExo()` rend null). La reprise de pause suit d'elle-même :
`perLevel` et `passNeeded` vivent dans `test`, que le brouillon photographie.
Et le message du niveau raté accorde son pluriel — « au moins 1 bonne
réponse », jamais « 1 bonnes réponses » : le seuil peut valoir 1 désormais.
Cinq bords au contrôle, et n'en tenir qu'un ne tient rien : la taille du
niveau 1, celle des niveaux SUIVANTS (le cœur — ils retirent), le seuil qui
suit, la valeur bricolée, la non-fuite hors devoir. Six sabotages, chacun
rougissant en nommant son défaut.

**LE BARÈME SUIT LA COUPE — sans quoi une copie PARFAITE est comptée fausse.**
Signalé par Turquet (septembre 2026) : « dans la fiche 3, les élèves ont 15/20
à l'exercice 1 alors que tout est bon ; c'est pareil pour le suivant ».
`dmAppliquerNbQ()` retirait des questions **sans toucher `test.maxScore`**,
calculé par le démarreur sur le tirage ENTIER : 3 questions réglées sur 4
tirées, et une copie sans faute valait 3/4 — 75 %, donc 7,5/10, donc **15/20**.
Le pire défaut du projet : l'exercice apprend l'inverse de ce qu'il enseigne.
**Le barème n'est LU pour la note que par la Seconde**, et le dire juste
importe — le premier jet de ce paragraphe annonçait « les TROIS niveaux »,
sans avoir regardé. Son `finishTest` fait `test.maxScore ||
test.questions.length` (son `enregistrerNotePartielle` aussi) ; ceux de la
Première et de la Terminale notent sur le nombre de QUESTIONS et sont donc
indemnes de ce défaut-là. Mais la COUPE, elle, lit `maxScore` partout : un
barème étranger lui fait refuser de couper, en silence, et le réglage
« Questions » du devoir cesse d'agir — c'est ce qui rend le second défaut
ci-dessous coûteux dans les trois fichiers.
**Trois voies, dans cet ordre.** Le poids exact d'une question se lit par la
CONVENTION DE NOMMAGE que les exercices à cases suivent déjà
(`xxxCases(q).length`, `xxxSubCount(q)`) — aucune table à tenir, un exercice
ajouté demain est couvert dès qu'il nomme sa fonction comme les autres. À
défaut, le poids HOMOGÈNE : `maxScore` divisé par le nombre de questions
tirées, le cas de tout exercice noté à la question. Et si ni l'un ni l'autre,
**on ne coupe pas** : mieux vaut une séance plus longue qu'une note fausse.
**La formule se vérifie sur le tirage ENTIER avant de servir**, et ce
garde-fou a été payé comptant : la convention rend des CASES, or
{somme-fractions} note à la QUESTION (9 cases, 1 point) — appliquée
directement, elle portait le barème de 4 à 27 et une copie parfaite tombait à
11 %. On ne s'en sert que si la somme des poids RETROUVE le `maxScore` posé
par le démarreur.
**Et un second défaut, latent, s'est montré en corrigeant le premier** :
`test` est global, et les démarreurs le RÉUTILISENT sans remettre `maxScore` —
celui de l'exercice PRÉCÉDENT survivait. Personne ne l'avait vu parce qu'il
fallait enchaîner deux exercices de familles différentes. Chaque démarreur
pose maintenant son barème, et le parcours du 1.6 — dont le total est ce qui
a été RÉPONDU — pose zéro, ce qui est sa vérité.
**La liste tenue à la main avait déjà dérivé de cinq démarreurs** (`startLR`,
`startSA2`, `startFracParcours`, `startTM`, `startTM2`) : cinquante-neuf
corrigés d'un côté, cinq oubliés de l'autre, et rien ne le disait. C'est la
leçon habituelle — **un contrôle qui passe PARTOUT est la seule chose qui
empêche une liste de dériver** : on pose un POISON dans `test.maxScore`, on
démarre chaque exercice, et on exige que le poison ait disparu. Un démarreur
qui n'ouvre qu'un ÉCRAN DE MENU ne tire rien et ne peut donc rien poser : on
le reconnaît à l'IDENTITÉ du tableau des questions — le signal de `dmEnonce`,
repris tel quel — et on le NOMME au lieu de l'accuser (la Terminale en a un,
le signe du 2nd degré). Sans cette distinction, le contrôle accusait une page
juste.
**Le contrôle est UNIVERSEL** — il passe sur CHAQUE exercice du niveau — et il
mesure sur UN SEUL tirage : il démarre l'exercice, note son barème, puis
appelle la coupe elle-même, parce que le tirage varie d'un lancement à
l'autre et que deux lancements ne se comparent pas (le premier jet accusait
{lecture-variations} d'un défaut qui n'était que son tirage aléatoire). Les
deux bords vivent dans une SEULE visite : les démarrages coûtent cher et se
partagent.
**Et l'EXACTITUDE ne s'exige que là où la bonne réponse se MESURE.** Le
premier jet déduisait l'homogénéité de la DIVISIBILITÉ du barème par le
nombre de questions — or le 2.7 pèse 5, 9, 5 et 17 cases, dont la somme (44)
se divise par 4 un tirage sur deux. Il accusait donc une page juste, un essai
sur trois, et l'action GitHub l'a montré là où trois exécutions locales
étaient passées : **un contrôle intermittent est un contrôle qui parle d'autre
chose.** Le second jet mesurait bien les poids, mais n'exigeait l'exactitude
que lorsqu'ils sont tous ÉGAUX — et la Terminale, qui n'a aucune fonction de
la convention, n'avait alors plus rien à mesurer : le contrôle rougissait en
le disant. C'est le bon réflexe et c'était le mauvais périmètre.
Deux familles, donc, et aucune ne se devine : les poids se LISENT et leur
somme retrouve le barème — l'attendu est la somme des n PREMIERS, même quand
les questions pèsent différemment, et c'est ce qui DÉPARTAGE les deux voies de
la page (le 2.7 rend 19 sur trois questions par la voie exacte, 27 par la voie
homogène) ; ou le barème ÉGALE le nombre de questions — un point par question,
arithmétique sur les nombres OBSERVÉS, sans rien demander à la page, et c'est
la famille de la Terminale et de la Première entières. Le reste (44 pour 4
questions dont les poids sont illisibles) n'a pas d'attendu mesurable : seul
le bord qui NOMME le défaut le tient — le barème du tirage entier ne survit
pas à la coupe.
Il vit dans la CHAÎNE séquentielle des contrôles asynchrones : il pose
`mesDevoirs` et `currentDM`, et lancé en parallèle il les faisait voler à son
voisin — le piège documenté, retombé tel quel. Neuf sabotages, chacun
rougissant en nommant son défaut — dont les deux gardes « le contrôle ne
mesure rien » : celui de la coupe débranchée, et celui d'un niveau où plus
aucun barème ne serait mesurable. Un dixième est resté vert et disait vrai :
retirer la ligne de la voie exacte laissait un `else if` orphelin, donc une
page qui ne se charge plus — **un sabotage qui casse la syntaxe ne dit rien du
contrôle visé**, il fallait débrancher la voie sans la retirer.

**Et les notes DÉJÀ enregistrées se réparent — celles qu'on peut PROUVER.**
Demande de Turquet (septembre 2026) : « peux-tu corriger les notes des élèves
en Seconde sur la fiche 3 ». `supabase/corriger-notes-coupe.sql` se colle dans
l'éditeur SQL, comme les migrations.
**Une copie SANS FAUTE vaut 100 %, et c'est exact.** Le score n'additionne que
des réponses justes : sans aucune faute il atteint EXACTEMENT le barème de la
séance réellement posée, quel que soit le poids des questions et sans qu'on ait
à connaître le réglage du devoir ni le tirage. Une copie sans faute à moins de
100 % porte donc, par construction, un barème qui n'est pas le sien : le score
EST le barème juste. **Le détecteur et la réparation sont la même chose** —
aucune ligne n'est corrigée sans que son propre contenu ne démontre qu'elle est
fausse — et c'est aussi ce qui donne l'IDEMPOTENCE sans aucun garde-fou :
réparée, la ligne porte total = score, donc elle ne peut plus être reprise.
**Ce qu'il REFUSE de faire compte autant.** Une copie qui a des fautes est
sous-notée elle aussi, et pourtant elle n'est pas touchée : son barème juste
n'est écrit nulle part. Le déduire de celui d'un camarade supposerait que les
questions pèsent toutes le même poids (faux pour plusieurs exercices — une
équation vaut 5 cases, une inéquation 17) ET que sa séance ait été coupée
pareil : deux choses que la ligne ne dit pas. **Un pourcentage remonté à tort
serait invisible et définitif, là où une note laissée trop basse se voit et se
rattrape** — l'élève refait l'exercice, la meilleure note l'emporte, le carnet
se corrige seul. C'est la doctrine des TROIS positions du juge des rédactions,
transposée : on ne répare que sur un fait prouvable, on s'abstient sinon. Une
première version réparait ces copies sur le barème d'un groupe ; elle a été
retirée avant le premier banc.
**Le second bord est de le DIRE** : les copies non réparées sont listées, avec
leur devoir, plutôt que tues — un carnet à moitié juste dont on ignore la
moitié serait pire. Et l'ancien barème est conservé dans la ligne
(`details.correction_bareme`), donc rien n'est perdu et le retour arrière tient
en une requête.
**Seule la Seconde est concernée**, comme le défaut lui-même.
**Deux sabotages sont restés verts, et ils ne disaient pas la même chose.**
Retirer « ignorer les lignes déjà réparées » ne changeait rien — HUITIÈME
garde-fou mort du projet, retiré : l'idempotence vient du détecteur. Mais
retirer « ignorer les brouillons de pause » ne changeait rien non plus, pour
une raison qui ne vit PAS dans ce fichier — une pause ne porte pas de `misses`,
et c'est `snapshotTest()` qui en décide, ailleurs. Ce garde-là RESTE, et le banc
sème désormais une pause qui porterait des `misses` pour rendre le bord
atteignable : **un garde inerte parce qu'une autre règle du même fichier le
couvre n'est pas un garde inerte par accident dans un fichier voisin.** Huit
sabotages en tout, chacun rougissant en nommant son défaut.
Le banc vit dans `npm run test:base`, seul endroit qui sache lever une vraie
base : copie parfaite réparée, copie fautive laissée ET nommée, note partielle
et brouillon de pause épargnés, note hors devoir intacte, Première intacte,
aucune note baissée, idempotence, retour arrière au caractère près.

**La note d'un DEVOIR ENTIER se pose à la main — en Terminale.** Demande de
Turquet (septembre 2026) : « je souhaite pouvoir fixer la note d'un DM sans
passer par les notes de chaque exercice ». Un devoir rendu sur papier, un oral,
un travail fait ailleurs : le professeur écrit UNE note dans la colonne
« Poser la note » du bilan de la classe, et elle PRIME sur tout le reste — le
total des exercices comme les notes posées exercice par exercice, qui restent
affichées et reprennent la main dès qu'on vide le champ. C'est la doctrine de
`noteForcee()` portée à l'étage du devoir : rien n'est réécrit, le travail de
l'élève reste dans `resultats`, intact, et la note vit à côté dans la
configuration du devoir (`notesDevoir`, « <id élève> » → `{note, sur}`).
**ELLE PORTE SON ÉCHELLE AVEC ELLE, et c'est le bord qui ne se devine pas** :
le maximum d'un devoir est 10 × son nombre d'exercices normaux, donc ajouter un
exercice à un devoir DÉJÀ noté ferait lire 24/40 une note écrite 24/30 — la note
de l'élève baisserait d'un quart, dans son bilan comme dans la moyenne de la
classe, sans que rien ne le dise. On garde donc le maximum du jour où elle a été
posée ; l'écran l'affiche, et le carnet ramène sur 20 avec lui. **La moyenne de
la classe se fait alors sur les RAPPORTS** et non sur les points bruts :
additionner un 24/30 avec un 18/20 ne voudrait rien dire — quand toutes les
échelles se valent, c'est exactement la moyenne d'avant.
**UN SEUL ENTONNOIR, `dmTotalEleve()`** : la liste des devoirs de l'élève, la
page du devoir, le bilan du professeur et le carnet des moyennes l'appellent
tous les quatre — c'est la leçon d'`exercicesDevoir()` et de `dmTotal()`, deux
lectures auraient donné deux notes, et le professeur aurait lu l'une dans le
tableau et l'autre dans le bilan juste en dessous.
**Elle déclare le devoir FAIT** — sans quoi le carnet continuerait de compter 0
pour un devoir que le professeur vient de noter — mais le compte des exercices
COMMENCÉS ne bouge pas : il dit ce que l'élève a fait en ligne, et le faire
mentir cacherait au professeur qui n'a rien rendu.
**Et l'ÉLÈVE la voit, en sachant qu'elle a été posée** : « 24 / 30 » au-dessus
d'exercices qui font 14 ferait dire à l'écran autre chose que la note. La carte
ajoute « posée par le professeur », la page du devoir dit la phrase entière avec
ce qu'il avait obtenu.
Elle est BORNÉE à 0..sur et une valeur illisible est IGNORÉE plutôt que
transformée en NaN (c'est un JSON qu'on peut éditer à la main) ; un nombre nu s'y
lit sur le maximum courant ; `ensureDevoir()` la RECOPIE, sans quoi elle
disparaîtrait au premier rechargement — le piège qui avait déjà emporté le
drapeau « bonus ».
**Et SUPPRIMER un tel devoir l'ARCHIVE, ce qui n'allait pas de soi** : la
décision se prenait sur le seul compte des lignes de `resultats`, or un devoir
de papier n'en a AUCUNE — ses notes vivent dans sa DÉFINITION, donc le supprimer
les emportait, et il serait parti sans un mot. `dmNotesPosees()` les compte
désormais, celles du devoir entier comme celles des exercices : les deux se
perdraient de la même façon. Un devoir vraiment vierge part toujours vraiment.
**Un piège de banc s'y est montré, et il visait le VOISIN** : le champ du devoir
partage la classe `dm-noteinput` avec celui d'un exercice et vit PLUS HAUT dans
la même page ; le banc navigateur prenait `document.querySelector('.dm-noteinput')`
— le premier venu — et tapait donc la note du DEVOIR en croyant poser celle d'un
exercice, puis accusait la page de ne rien enregistrer. Chacun se désigne
sans ambiguïté depuis (`dm-notedev`, `.dm-exrow .dm-noteinput`), et le banc
navigateur tape maintenant dans les DEUX champs — jsdom éprouve le juge,
l'échelle et la base, lui seul éprouve le GESTE : un `onchange` posé dans un
`innerHTML` traverse deux analyseurs.
**Vingt-quatre sabotages en tout**, vingt-et-un rougissant en nommant leur
défaut. Deux ont d'abord été IMPOSSIBLES, posés sur une ancre que la note par
exercice partage — un sabotage se pose sur une ancre PROPRE à sa cible, et
rejoués sur la leur ils rougissent. Et un est resté VERT au banc jsdom **à bon
droit** : la classe `dm-notedev` retirée ne change rien à ce que jsdom mesure —
c'est le banc NAVIGATEUR qui la nomme (« aucun champ dm-notedev dans le bilan de
la classe »), et il l'a fait.
**Rien de cela n'existe en Seconde ni en Première** : la demande nomme la
Terminale, `dmTotalEleve()` n'y est pas, et le contrôle s'y affiche « non
applicable » plutôt que d'être tu.

**Un exercice BONUS vaut 1 point, et ne fait jamais dépasser le maximum.**
Demande de Turquet (août 2026), devoirs ET fiches, les trois niveaux : une case
« Bonus (+1 pt) » sur la ligne de l'exercice dans l'éditeur. Un bonus vaut sa
note /10 ramenée sur 1, qui S'AJOUTE au total — et le total est PLAFONNÉ à la
note des exercices normaux (10 × leur nombre). Un élève à 19/20 qui réussit un
bonus a 20/20 ; à 20/20 il reste à 20/20.
**Le maximum ne compte QUE les exercices normaux**, et c'est le point qui ne se
devine pas : compter le bonus dedans donnerait 10 points de plus à trouver pour
1 point offert — le « bonus » rendrait le devoir plus dur. C'est ce bord qui
distingue un bonus d'un exercice de plus.
**Un devoir qui n'aurait QUE des bonus retombe sur le comportement normal** :
le plafond serait alors 0, et toute la note disparaîtrait. Un bonus n'a de sens
qu'en PLUS de quelque chose, et le tenir ici plutôt que de l'interdire dans
l'éditeur évite qu'un devoir bricolé dans le JSON n'affiche 0 partout.
**UN SEUL entonnoir, `dmTotal(parts)`** — la liste des devoirs, la page du
devoir et le tableau du professeur l'appellent tous : c'est la leçon
d'`exercicesDevoir()`, deux calculs auraient donné deux totaux, et c'est la
note qui en aurait fait les frais. En Terminale la note POSÉE par le professeur
y entre comme les autres (elle vaut déjà /10, un bonus posé à 8 ajoute 0,8).
**Un bonus est FACULTATIF, donc hors de la chaîne de l'ordre des fiches** : il
n'est jamais verrouillé, et un bonus non fait ne bloque jamais l'exercice
suivant — sans quoi la fiche à ordre imposé s'arrêterait sur un exercice qu'on
n'est pas obligé de faire. La carte et la porte partagent toujours
`dmVerrouille()`.
**L'écran le DIT** : ⭐ devant le titre, « Bonus : 0,8 / 1 » au lieu de
« Note : 8 / 10 », et la description explique ce que le bonus peut ajouter — un
élève qui lirait « 8 / 10 » sur une carte qui vaut 0,8 point ne comprendrait pas
son total. Le piège de la Première est qu'`exercicesDevoir()` NORMALISE les
entrées : sans y ajouter `bonus`, le drapeau était effacé entre l'éditeur et
l'écran, sans que rien ne le dise. Le défaut ne s'écrit jamais dans le JSON (un
devoir sans bonus garde exactement la forme qu'il avait avant que le réglage
n'existe). Onze sabotages, chacun rougissant en nommant son défaut.

**Puis le mot « BONUS » s'est ÉCRIT, et partout où l'exercice se montre.**
Demande de Turquet (septembre 2026, Terminale) : « je veux que l'on écrive
bonus pour les exercices qui sont en bonus quand on annonce le dm avec la
liste de tous les exercices et quand on fait cet exercice aussi ». L'annonce
du devoir — la liste des devoirs, qui montre chaque devoir avec TOUS ses
exercices — ne portait qu'une ÉTOILE, et un pictogramme ne dit rien à qui ne
connaît pas la convention ; surtout, **l'écran où l'élève travaille se
taisait** : la page du devoir disait « Bonus », puis l'exercice s'ouvrait et
plus rien ne rappelait qu'il était facultatif. C'est la leçon du numéro
d'exercice de `show()`, revenue au même endroit — le renseignement était
partout SAUF là où l'élève passe son temps.
**UN SEUL ENDROIT L'ÉCRIT** (`dmBonusBadge`), et quatre écrans le lisent :
l'annonce du devoir, l'énoncé du circuit papier, l'écran des modes et la
pastille de l'écran d'exercice — celle-ci par `show()`, l'unique porte vers un
écran d'exercice, donc celui qu'on ajoutera demain est couvert sans rien
déclarer. Deux libellés écrits séparément auraient fini par diverger, et le
même exercice se serait dit « bonus » d'un écran à l'autre dans deux mots
différents. Le contrôle l'exige en REMPLAÇANT la fabrique par un jeton : un
écran qui écrirait son propre mot ne le porte pas.
**La page du devoir garde son badge de BILAN** (« Bonus : 0,8 / 1 », « Bonus ·
à faire ») : il porte la NOTE, qui est sur 1 et non sur 10 — ce n'est pas le
même badge, et c'est nommé plutôt que tu. Le mot y est donc exigé par un bord
à lui, dans ses DEUX branches : le sabotage de la branche « faite » est
d'abord resté VERT, le contrôle ne rendant qu'un devoir vierge.
**L'encre est OR** — ni bleue, ni rouge, ni verte : ce n'est pas un verdict, et
la leçon du liseré de {croiser-denominateurs} vaut ici aussi.
**Le bord OPPOSÉ compte autant, et il en a deux** : l'exercice NORMAL du même
devoir ne porte jamais le mot, et un exercice fait HORS devoir non plus — un
badge posé sans condition passerait sinon pour un contrôle. Le bonus de
l'exercice en cours se lit par `dmReglageExo()`, l'entonnoir qui sert déjà la
coupe du nombre de questions : hors devoir il rend null.
**Deux bancs, la répartition habituelle.** jsdom tient le DOM — le mot sur le
bon exercice et sur lui seul, les deux bords opposés, le jeton de la fabrique,
et la pastille qui garde son numéro et son nom — en appelant `renderDevoirsList`,
`renderDevoirDetail`, `show()` et `openTestDevoirModes`, cette dernière lue
JUSQU'À SA PREMIÈRE ATTENTE (elle écrit son titre avant, le motif du bilan du
professeur). Le NAVIGATEUR (« 6 sexies bis », déclaré par `bonusEcrit` dans
`tests/profils.js`) tient ce que jsdom ne peut pas : le badge mesuré au
RECTANGLE — un CSS perdu le rendrait invisible sans qu'une erreur ne se lève —
et le TRAJET entier, l'énoncé du circuit papier compris, dont le titre ne
s'écrit qu'APRÈS le tirage.
**Onze sabotages, chacun rougissant en nommant son défaut** — neuf au banc
jsdom (l'annonce muette, l'annonce qui l'écrit sur tous, l'écran des modes,
l'écran de l'exercice, l'écran de l'exercice hors devoir, la page du devoir
dans ses deux branches, l'annonce qui écrit son propre mot, le badge qui chasse
le numéro et le nom) et deux que seul le NAVIGATEUR voit : le badge caché par
une règle CSS et l'énoncé du circuit papier redevenu muet.
**Le panneau de l'accueil (`renderDM`) n'a PAS été touché, et le dire vaut
mieux que de le taire** : il est MORT — aucun appelant, et son hôte `dmPanel`
n'existe dans aucune des trois pages. Y écrire le mot ferait croire que la
règle est tenue là où rien ne la montre.
**ET LA FUSION A REPAYÉ LA COLLISION D'`APP_VERSION` — sans qu'on puisse la
réparer, et c'est la leçon.** « Le clavier tient sur 3 lignes en paysage » est
arrivé sur `main` pendant la préparation de cette branche, **avec le même
v327**. Les deux changements coexistent sans rien casser : pas de conflit
`git`, pas de collision de numéro de section, les bancs et l'action verts —
ni la fusion, ni les bancs, ni l'action n'avaient rien à dire. C'est la
collision qu'aucune branche ne peut voir seule, celle des numéros d'exercice
et des sections du banc, transposée à la version.
**La règle habituelle — le premier arrivé garde, le second prend le suivant —
n'a PAS pu s'appliquer** : le temps qu'une branche de correction soit prête et
contrôlée, un TROISIÈME devoir (« trois choix sur la page des modes ») avait
pris 328. Renuméroter en 329 aurait changé le numéro de la page sans changer
une ligne de ce qu'elle affiche, et fabriqué une seconde ambiguïté pour en
réparer une première — la course était perdue par construction.
**On garde donc l'état de fait, et on l'écrit** : **v327 porte DEUX livraisons**
(le clavier en paysage et le mot « Bonus »). Ce que la règle 4 promet reste
vrai de ce qui est SERVI — `main` avance, la version en ligne désigne toujours
exactement la page en ligne —, et c'est l'historique seul qui est ambigu, sur
ce numéro-là. Le dire vaut mieux que de le taire.
**Ce qui manquait était un CONTRÔLE, et il existe depuis** (`npm run
test:version`, septembre 2026) : pour chaque page, il compare le fichier de
l'arbre de travail — dans l'action, le résultat de la fusion, donc exactement
ce qui serait publié — à celui de `main`, et exige que le numéro DÉPASSE le
sien dès que les octets diffèrent. Le paragraphe ci-dessus raconte l'époque où
la parade était de relire `APP_VERSION` à la main ; la règle qu'il enseigne
reste vraie, c'est le garde qui a changé.
**Le bord OPPOSÉ compte autant** : une page INCHANGÉE n'a aucun numéro à
incrémenter — une branche qui ne touche qu'un banc ou ce fichier passe sans
rien bouger. Un contrôle qui réclamerait un incrément à chaque poussée ferait
monter la version sans que rien ne change à l'écran, c'est-à-dire fabriquerait
l'ambiguïté qu'il corrige. Et la règle 4 est tenue par la même mesure, sans
qu'on ait à l'écrire deux fois : une page modifiée dont le numéro n'a pas
bougé porte celui de `main`, donc rouge.
**Il vit dans l'ACTION, et il ne pouvait pas vivre ailleurs** : le défaut
n'existe que dans la FUSION — chaque branche est juste de son côté —, et
l'action est le seul endroit qui tienne les deux à la fois. **Il RÉCUPÈRE `main`
avant de lire**, et c'est le point qui compte : une référence en retard
manquerait justement la collision qu'on cherche — hors ligne il se rabat sur le
`origin/main` déjà présent, en le DISANT, et jamais sur la branche locale
`main`, en retard par nature. Aucune profondeur n'est imposée, et c'est MESURÉ
plutôt que supposé : un `--depth=1` tronque l'historique du dépôt qui lance le
banc — 127 commits ramenés à 1 — quand une récupération ordinaire laisse la
borne où elle était ; un banc ne touche pas au dépôt de celui qui le lance.
Sans référence du tout, il REFUSE de mesurer bruyamment plutôt que de passer au
vert — le motif de `base.js` quand PostgreSQL manque. Il n'entre PAS dans `npm test`,
qui reste ce que la règle 2 décrit — les trois niveaux, chacun selon son
profil : un banc qui exigerait `git` et le réseau pour rendre son verdict
sur une page ne dirait plus la même chose.
**CE QU'IL NE VOIT PAS, et le dire vaut mieux que de le taire** : il compare à
`main` AU MOMENT OÙ IL TOURNE. Si `main` avance ensuite, son verdict devient
périmé sans qu'il le sache — rejouer l'action, ou reprendre `main` dans la
branche, le remet à jour, et c'est ce qu'on fait de toute façon avant de
fusionner. La renumérotation, elle, se fait toujours AVANT la fusion, pas
après : c'est le seul moment où la règle du premier arrivé s'applique encore.
**Éprouvé en rejouant la collision elle-même** : `main` remis à l'instant où le
clavier en paysage y posait v327, la page de la branche « Bonus » dans l'arbre
de travail — il rougit en la nommant (« v327 est DÉJÀ PRIS sur main »). Huit
bords éprouvés en tout, chacun rougissant en nommant son défaut : le numéro
déjà pris, le numéro qui RECULE, la page neuve, le dépôt absent, `main`
inatteignable, l'expression qui ne reconnaît plus la déclaration — et le garde
« ce banc ne mesure rien », montré vivant en le retirant : sans lui, une liste
de pages vide rend le banc VERT sur zéro comparaison.

**La Seconde et la Première ne changent pas, et c'est nommé** : elles ont les
mêmes exercices bonus et la même étoile nue, mais la demande porte sur la
Terminale. Les deux contrôles s'y affichent « non applicable » en DISANT
pourquoi — « ce niveau a bien les exercices bonus, mais n'écrit pas encore le
mot » — plutôt que de laisser croire qu'il n'y a rien à tenir : c'est une
décision à prendre, pas un oubli. Le `renderDM` de la Seconde est mort lui
aussi.

**Le carnet de notes du professeur : une moyenne par élève, un devoir par
colonne.** Le bilan d'un devoir ne montrait qu'UN devoir à la fois ; le
professeur voulait le tableau entier, rangé par ordre alphabétique, et
téléchargeable (demande de Turquet, août 2026 — devoirs ET fiches, les trois
niveaux). Il vit au-dessus du bilan, dans l'onglet « Devoir maison », et suit
la famille choisie : les fiches ont leur tableau, les devoirs le leur.
**Deux décisions de Turquet sont DANS les chiffres**, et chacune se voit :
un devoir **non fait compte 0** et reste au dénominateur — c'est la moyenne
d'un bulletin, elle dit le travail rendu autant que le niveau ; et chaque note
est **ramenée sur 20** avant d'être moyennée, sans quoi un devoir à 3
exercices (sur 30) pèserait une fois et demie un devoir à 2 (sur 20), et la
moyenne d'un élève changerait le jour où l'on ajoute un exercice à un vieux
devoir.
**Le zéro s'ÉCRIT « 0 », jamais « — ».** C'est la leçon des cases justes
comptées `good` : l'écran ne doit pas dire autre chose que la note. Un tiret
devant une moyenne qui compte 0 laisserait croire que le devoir est hors du
calcul, et le professeur chercherait longtemps d'où vient l'écart. La colonne
« faits » porte, elle, la différence entre un 0 obtenu et un 0 d'absence.
**Quels devoirs comptent** : un devoir JAMAIS montré aux élèves ne peut pas
avoir été fait — le compter 0 pour toute la classe serait un mensonge, et la
moyenne s'effondrerait à chaque brouillon créé dans l'éditeur. Un devoir entre
donc dans le tableau s'il est AFFICHÉ, **ou** si au moins un élève y a une
note : un devoir retiré après coup garde ainsi les notes qu'il a produites. Un
devoir sans exercice n'a pas de maximum et reste dehors.
**L'ordre alphabétique est tenu par la PAGE, pas par la base.**
`localeCompare` en français range « Émile » avec les E ; l'ordre d'un
`order('prenom')` dépend de la collation du serveur — invisible ici, et faux le
jour où elle change. Le banc sème exprès dans le désordre, accents compris.
**UN SEUL ENTONNOIR pour la note d'un devoir** : `dmNoteDevoir()`. Le bilan par
devoir, son détail par élève et le tableau des moyennes la lisent tous — deux
calculs auraient donné deux notes, et le professeur aurait lu l'une dans le
tableau et l'autre dans le bilan juste en dessous, sans que rien ne rougisse.
C'est la leçon d'`exercicesDevoir()` et de `dmTotal()`, une fois de plus. Le
reste du moteur est le **même texte dans les trois fichiers** et un contrôle le
compare au caractère près ; trois fonctions divergent volontairement et sont
NOMMÉES dans le contrôle — `dmNbExos()` et `dmNoteDevoir()` (la Première lit sa
liste par `exercicesDevoir()`, la Terminale ajoute la note POSÉE par le
professeur) et `renderDmMoyennes()`, qui nomme les tables du niveau.
**Le fichier EST le tableau.** Le CSV ne recalcule rien et ne relit pas la
base : il reprend `dmMoyDernier`, ce que le professeur a sous les yeux. Deux
calculs auraient donné deux tableaux, et c'est le FICHIER — celui qu'on garde —
qui aurait menti. Il sépare au **point-virgule** et non à la virgule : c'est le
séparateur de liste des Windows français, et Excel range sinon la ligne entière
dans une seule colonne ; le BOM en tête lui dit que le fichier est en UTF-8,
sans quoi « élève » s'affiche « Ã©lÃ¨ve ».
**L'export brut de tous les résultats a suivi** (décision de Turquet, août
2026) : il séparait à la virgule, et lui seul — deux conventions dans le même
tableau de bord finissent par se contredire, et c'est le fichier qu'on garde
qui en fait les frais. Il passe désormais par le MÊME entonnoir,
`csvTelecharger()`, qui pose les guillemets, le point-virgule, les fins de
ligne, le BOM et l'enregistrement. Deux contrôles le tiennent, et n'en tenir
qu'un ne tient rien : le STATIQUE exige que `exportCSV()` passe par
l'entonnoir — un export qui refabriquerait son fichier dans son coin
redeviendrait libre de sa ponctuation sans que rien ne le dise — et le
DYNAMIQUE lit le fichier qui sort vraiment. Une différence demeure, inévitable :
cet export LIT la base avant d'écrire, donc son enregistrement arrive après une
attente ; le carnet, lui, n'attend rien.
**Et le contrôle s'est fait prendre le `sb` en plein vol** — le piège
documenté, par une porte de plus : ce contrôle ATTEND (le rendu du bilan passe
par un `setTimeout`), et pendant une attente les MINUTEURS laissés par les
contrôles précédents s'exécutent. L'un d'eux remplace `sb` par un stub dont le
`from()` ne rend qu'un `insert()` — l'export échouait alors dans son propre
`catch`, et le banc accusait la page d'un défaut qu'elle n'avait pas. Le
contrôle garde son double sous la main et se le rend avant de mesurer.
Rien n'attend entre le clic et l'enregistrement — un `await`
glissé là ferait traiter le téléchargement comme une fenêtre surgissante, que
Chrome bloque sans un mot : le piège déjà payé sur l'ouverture des cours en PDF.
**Deux bords ne se voient que dans un navigateur**, et le banc navigateur les
tient : le téléchargement doit VRAIMENT avoir lieu (jsdom n'en a aucun ; on
CLIQUE et on attend l'événement du navigateur, puis on relit le fichier reçu),
et à douze devoirs le tableau est plus large que la carte — c'est LUI qui doit
défiler (`.dm-moywrap`), jamais la page, qui emmènerait tout le tableau de bord
en travers. Onze sabotages sur le banc principal, chacun rougissant en nommant
son défaut.
**Et un SEPTIÈME garde-fou mort y a été écrit, puis retiré** — celui-ci est
instructif parce qu'il est né d'une MESURE FAUSSE. Un premier sondage semait
les douze devoirs AVANT d'ouvrir l'onglet, or ouvrir l'onglet recharge la liste
depuis la configuration : le banc mesurait un tableau à UN devoir en croyant en
mesurer vingt, concluait que le tableau « s'écrasait », et un
`width:max-content` a été posé pour un défaut qui n'existait pas. C'est le
SABOTAGE qui l'a démasqué — le retirer ne faisait rougir personne —, puis la
mesure refaite proprement : sans lui le tableau défile déjà (990 px dans 648 à
douze devoirs, contre 1159 avec), la page ne déborde jamais et aucune cellule
ne rogne son contenu ; il ne gagnait que la largeur naturelle des en-têtes.
**Une mesure qui accuse la page mérite d'être mesurée elle-même avant qu'on
corrige quoi que ce soit** — et le contrôle qui manquait vraiment est celui de
la LISIBILITÉ : un tableau qui se comprime ne déborde nulle part, si bien que
le contrôle du défilement reste vert sur un écran illisible. Il exige donc
désormais qu'aucune cellule ne coupe son contenu.

**Supprimer un devoir ne perd plus ses notes : il s'ARCHIVE.** Demande de
Turquet (août 2026). La suppression n'effaçait déjà AUCUNE ligne de notes — le
message de confirmation le disait — mais elle effaçait la DÉFINITION du
devoir : ses exercices, son numéro, son titre. Les notes devenaient
orphelines, plus rien ne savait les lire, et elles quittaient d'un coup le
carnet, le bilan et le bilan de l'élève ; la moyenne de toute la classe
changeait. **Le message était vrai à la lettre et faux en pratique** — le
défaut que ce projet connaît sous « l'écran dit autre chose que la note ».
**Un devoir qui porte des notes est donc ARCHIVÉ** : il quitte la vue des
élèves et la liste de travail du professeur, mais reste une colonne du carnet,
marquée ⧉, et **il continue de compter dans les moyennes** (décision de
Turquet) — ranger un devoir ne doit pas changer la moyenne d'un élève. C'est
le bord qui dit vraiment « sans perdre les notes », et le contrôle compare les
moyennes AVANT et APRÈS : un contrôle qui vérifierait seulement que le drapeau
est posé passerait au vert sur un carnet vidé.
**Un devoir SANS aucune note est vraiment supprimé** (décision de Turquet) :
il n'y a rien à conserver, et sans cette règle la liste des archives se
remplirait des brouillons créés dans l'éditeur.
**Et l'archivage se DÉFAIT, en laissant MASQUÉ** : « Restaurer » remet le
devoir dans la liste sans jamais le republier aux élèves de soi-même. Sans ce
retour, archiver serait un aller simple — une autre façon de perdre un devoir.
**Le drapeau se perd par DEUX portes, et il fallait les deux** :
`ensureDevoir()` efface tout champ qu'elle ne nomme pas — c'est ainsi que
« bonus » s'était déjà perdu entre l'éditeur et l'écran de l'élève — et le
nettoyage de la Première (`clean`) est la seconde, où enregistrer un devoir
archivé l'aurait désarchivé sans un mot. Le défaut ne s'écrit jamais : un
devoir ordinaire, ou restauré, garde exactement la forme qu'il avait avant que
l'archivage n'existe.
**Une lecture ratée ARCHIVE au lieu de détruire.** Le compte des notes décide
du sort du devoir ; si la base ne répond pas, on ne sait pas compter, et un
doute se tranche du côté où rien n'est perdu.
**L'élève est écarté par `!archive` EN PLUS de `actif`**, alors qu'archiver
masque déjà : s'appuyer sur le seul `actif` ferait republier une archive au
premier drapeau remis à la main dans le JSON. Neuf sabotages, chacun
rougissant en nommant son défaut — et l'un d'eux a d'abord cassé la SYNTAXE au
lieu du comportement, ce qui ne prouve rien : un sabotage qui empêche la page
de se charger fait rougir tout le banc sans rien dire du contrôle visé.

**Une fiche de travail se fait DANS L'ORDRE ; un devoir reste tout ouvert.**
Les deux phrases sont deux décisions de Turquet, à un mois d'écart, et elles
ne se contredisent pas : à la maison chacun avance comme il veut, en classe le
professeur conduit la progression (demande de Turquet, août 2026 — « fixer
l'ordre des exercices et obliger les élèves à suivre cet ordre », pour les
fiches qu'il crée). La règle vit dans `GENRE_DEVOIRS` (`ordre:true` sur la
famille des fiches), comme toute différence entre les deux familles — écrite
ailleurs, elle aurait fini par fuir sur les devoirs.
**Le premier exercice non fait est le PROCHAIN** : il reste ouvert, tout ce
qui vient après lui est verrouillé (carte 🔒 grisée, rang écrit sur chaque
carte), et un exercice déjà fait se refait librement — « fait » est la
définition de la carte, `noteDevoirExo().fait`. **La carte et la porte
partagent la même définition, `dmVerrouille()`** — la leçon de
`memeBrouillon()` : ce que l'écran grise, `openTestDevoir()` le refuse, parce
qu'une carte se recrée par un vieux rendu et que la porte est l'entonnoir.
**L'ordre est l'ordre du tableau `exercices`** — celui-là même que la page de
l'élève lit — et l'éditeur le montre et le règle : un ruban « Ordre des
exercices de la fiche » avec des flèches ▲▼, sous la liste des exercices. Le
piège était en Seconde : sa relecture du formulaire (`readEditorIntoDevoir`)
réécrivait `exercices` dans l'ordre du MENU (`TEST_ORDER`) — l'ordre réglé
par le professeur aurait été écrasé à chaque enregistrement, sans erreur
nulle part. Pour une fiche elle PRÉSERVE l'ordre rangé et ajoute les nouveaux
cochés à la fin ; un devoir garde l'ordre du menu, comme avant. Un contrôle
par niveau tient les quatre bords (la définition, l'écran, la porte,
l'éditeur — et le débordement sur les devoirs), éprouvé par cinq sabotages,
chacun nommé. Le piège du SCRIPT DE VUE s'est remontré au passage : recopier
le rendu de l'éditeur dans l'écran visible duplique les ids, et
`getElementById` répond la copie — la flèche semblait morte alors que la page
était juste.

**Un devoir demande une fois chaque exercice, et tous sont ouverts.** Il a su
un temps en demander plusieurs passages et en verrouiller un tant que les
précédents n'étaient pas faits ; c'est retiré, éditeur compris (décision de
Turquet, août 2026 — le verrou des FICHES, ci-dessus, est une décision
POSTÉRIEURE et ne vaut que pour elles). La leçon reste : la liste des exercices d'un devoir est
calculée par `exercicesDevoir()`, partagée par l'écran de l'élève, le total du
devoir et le tableau du professeur — deux calculs auraient donné deux totaux.
Et un réglage retiré ne doit pas emporter les notes qu'il a produites : les
notes écrites du temps des passages portent encore un champ `passe`, que
`dmBest()` ne regarde plus. Elles comptent donc toutes, la meilleure l'emporte,
comme partout ailleurs — les ignorer aurait fait disparaître d'un devoir des
notes réellement obtenues. Un devoir enregistré alors porte encore `rep` et
`verrou` : ils sont ignorés, et le prochain enregistrement les retire. Deux
contrôles tiennent les deux bords — que le réglage ne revienne pas par
l'éditeur, et que les vieilles notes se lisent toujours.

**La note d'une FICHE se lit SUR 20 — celle d'un devoir reste en points
bruts.** Demande de Turquet (septembre 2026) : « en Première et Seconde il
faut que les notes des fiches de travail soient sur 20 ». Une fiche est une
note de classe, celle qu'on reporte dans un bulletin — « 24 / 30 » obligeait
à convertir de tête. La note est RAMENÉE proportionnellement à l'affichage
(18 points bruts sur 30 → « 12 / 20 »), et rien ne change en base : les
notes par exercice restent sur 10, et le carnet des moyennes ramenait déjà
tout sur 20 pour moyenner — cette demande aligne simplement ce que le
professeur et l'élève LISENT sur ce que la moyenne comptait déjà.
**La règle vit dans `GENRE_DEVOIRS` (`sur20:true` sur la famille des
fiches)**, comme l'ordre imposé — écrite ailleurs, elle aurait fini par fuir
sur les devoirs — et UN SEUL entonnoir convertit (`dmNoteAff`) : la liste de
l'élève, la page de la fiche et le bilan du professeur le lisent tous. Le
POURCENTAGE des badges reste calculé sur les points bruts : il est invariant
par la conversion. **Et l'écran DIT la règle** (« La note de la fiche est
ramenée sur 20 », sur la page de la fiche et le bilan) : un élève qui lit
« 12 / 20 » sous des exercices notés /10 doit savoir pourquoi — l'écran ne
dit pas autre chose que la note.
Le contrôle tient quatre bords : la conversion PROPORTIONNELLE et jamais un
plafonnement (le témoin 18/30 les distingue — plafonné dirait 18/20), la
page et sa phrase, le bilan du professeur SANS aucun point brut résiduel, et
le bord opposé — un devoir garde « 18 / 30 » partout, sans la phrase. Le
contrôle historique de la liste des fiches a été RETOURNÉ (« Note : 8 / 10 »
attendu est devenu « 16 / 20 »). Cinq sabotages, chacun rougissant en
nommant son défaut — et l'un d'eux a d'abord traversé en montrant un trou du
CONTRÔLE : le bilan porte la note de l'élève ET la moyenne, la moyenne
convertie suffisait à faire trouver « 12 / 20 » pendant que la note de
l'élève restait brute — le bilan d'une fiche ne doit plus montrer AUCUN
point brut, et c'est ce bord qui attrape l'affichage débranché de
l'entonnoir.

**L'ordre des exercices d'un DEVOIR se règle en Terminale — l'affichage,
jamais un verrou.** Demande de Turquet (septembre 2026) : « en Terminale je
n'arrive pas à changer l'ordre des exercices dans les devoirs maison comme en
1ère ». La Terminale n'avait alors pas de fiches : ses devoirs étaient sa seule
famille, et son éditeur ne réglait pas l'ordre — pire, sa relecture du formulaire
(`readEditorIntoDevoir`) réécrivait `exercices` dans l'ordre du MENU
(`TEST_ORDER`) : le piège payé par la Seconde sur ses fiches, au même
endroit — un ordre réglé aurait été écrasé à chaque enregistrement et à
chaque changement de devoir, sans erreur nulle part. La relecture PRÉSERVE
donc l'ordre rangé et ajoute les nouveaux cochés à la FIN ; le ruban ▲▼ de la
Première est porté sous la liste des exercices, et cocher un mode le met à
jour (`dmExoCoche` — sans ce re-rendu, l'exercice tout juste coché
n'apparaîtrait dans le ruban qu'au prochain changement de devoir).
**Rien d'autre n'a bougé, et c'est ce qui rend le geste sûr** : la liste de
l'élève, la page du devoir, l'énoncé papier et le carnet itèrent déjà le
tableau `exercices` — l'ordre les suit d'eux-mêmes, et `ensureDevoir()` garde
ce tableau tel quel. **Et AUCUN verrou n'en découle** : « un devoir reste
tout ouvert » (la décision d'août 2026, ci-dessus) tient — l'ordre réglé est
celui de l'AFFICHAGE, l'élève fait les exercices comme il veut, et le
contrôle exige ce bord-là aussi : aucune carte verrouillée sur la page du
devoir. Quatre bords au contrôle — la relecture qui préserve et le nouveau
coché en dernier, les flèches rendues (un ruban vidé garderait son `#dmOrdre`
et resterait vert sans ce compte), le déplacement que l'enregistrement
emporte tel quel, et l'écran de l'élève qui suit l'ordre du tableau — éprouvé
par quatre sabotages, chacun rougissant en nommant son défaut.

**Et la Seconde a suivi — le ruban vaut pour les DEUX familles, le verrou pour
une seule.** Demande de Turquet (septembre 2026) : « en seconde je souhaite
pouvoir choisir l'ordre des exercices pour les devoirs maison comme en
terminale ». Le ruban ▲▼ existait déjà dans son éditeur depuis août 2026,
mais derrière un `if(dmGenre==='fiche')` : les devoirs n'y avaient pas droit,
et leur relecture du formulaire les rabattait sur l'ordre du MENU — le piège
que les fiches avaient déjà payé, au même endroit. Les trois gardes de genre
tombent ensemble (le ruban, la relecture, `dmExoCoche`) : n'en retirer qu'une
ne tient rien — un ruban sans relecture préservante affiche un ordre que le
premier enregistrement écrase, une relecture sans re-rendu laisse l'exercice
tout juste coché hors du ruban jusqu'au prochain changement de devoir.
**CE QUI NE CHANGE PAS EST LE VERROU, et c'est tout l'arbitrage** : il vit où
il a toujours vécu, `dmOrdreImpose()` — donc `GENRE_DEVOIRS` — et ne dit oui
que sur les fiches. L'ordre réglé sur un devoir est celui de l'AFFICHAGE, et
un devoir reste tout ouvert (la décision d'août 2026 tient). **La PHRASE du
ruban suit donc `dmOrdreImpose`, jamais `dmGenre` recopié** : celle des fiches
(« un exercice ne se débloque que lorsque le précédent est fait ») posée sur
un devoir ferait croire au professeur qu'il impose un ordre aux élèves —
l'écran dirait autre chose que la règle. Les deux bords ont leur contrôle.
**Le contrôle existait et n'était ATTEINT qu'en Terminale** : `ordreDesDevoirs`
n'était appelé que par les chemins d'ABANDON d'`ordreDesFiches`, si bien que la
Seconde et la Première, où celui des fiches réussit, ne le jouaient jamais —
un contrôle écrit, vert, et jamais joué. Il est chaîné dans TOUS les chemins,
et il se déclare : `ordreDevoirs` dans `tests/profils.js` (Seconde et
Terminale), deux sources — un profil qui le déclare devant une page sans cet
éditeur rougit, un niveau qui ne le déclare pas s'affiche « non applicable »
et son bord OPPOSÉ (aucun ruban sur un devoir, l'ordre du menu) reste tenu par
le contrôle des fiches, juste au-dessus. **La Première n'est pas dans la
demande et ne change pas** — le dire vaut mieux que le taire.
**Et le contrôle CLIQUE au lieu d'appeler** : il déclenche l'événement `change`
de la case, c'est-à-dire l'attribut `onchange` que le professeur déclenche,
puis compte les rangs RENDUS dans le ruban. Le premier jet appelait
`readEditorIntoDevoir()` à la main : la garde de `dmExoCoche` ne se voyait
alors nulle part, et le sabotage qui la remet serait resté vert. Sept
sabotages, chacun rougissant en nommant son défaut — et l'un d'eux a d'abord
échoué à se poser : la lacune « le cadre de pose inséré… » est écrite au mot
près dans le profil de la Seconde ET dans celui de la Terminale, donc l'ancre
désignait deux endroits. Un sabotage se pose sur une ancre PROPRE à sa cible,
la leçon d'{antecedents-droite}, retombée dans un fichier de profils.

**Les TRAVAUX FACULTATIFS sont la seconde famille de devoirs de la Terminale —
gérés comme les devoirs, rangés à part.** Demande de Turquet (septembre
2026) : « une case "travaux facultatifs" dans la page où l'on a les cases
"choisir un exercice", "faire un devoir maison" — je peux donner une fiche de
travail comme les DM mais avec un titre ; les fiches sont gérées de la même
manière que les DM ». C'est le motif de la Seconde et de la Première
(`GENRE_DEVOIRS`), porté tel quel : même écran élève, même éditeur, mêmes
notes, même carnet — et deux CLÉS de stockage, parce que le portail lit
`valeurs.devoirs` et publierait une fiche rangée dedans ; les fiches vivent
sous `valeurs.fiches`, et `persistDevoirs()` n'écrit que la clé de SA famille.
Le préfixe de l'identifiant dit la famille (`fc_`), la carte de l'accueil mène
à `openDevoirsEleve('fiche')`, le professeur bascule par un sélecteur en tête
de l'onglet « Devoirs & travaux », et une famille vide reçoit une fiche de
départ MASQUÉE — rien ne doit paraître aux élèves avant qu'il ne l'ait voulu.
**Ce qui NE vient PAS avec : l'ordre imposé et la note sur 20.** Les deux
différences que les fiches de la Seconde et de la Première portent
(`ordre:true`, `sur20:true`) ne valent pas ici — « gérées de la même manière
que les DM » : tous les exercices ouverts, la note en points bruts. C'est le
seul endroit où les deux moitiés du projet divergent sur la même famille, et
c'est pourquoi le contrôle compare désormais DEUX sources : `tests/profils.js`
déclare, pour chaque niveau, le titre de la famille, son badge, le libellé de
la note, `ordre`, `sur20` et `compacte` (la Terminale garde sa liste
historique qui recopie les exercices), et le banc exige de la page ce que le
profil dit — une famille que la page porte sans que le profil la déclare, ou
l'inverse, rougit ; un `ordre:true` sans `dmVerrouille()`, ou un
`dmVerrouille()` sur une famille déclarée sans ordre, rougit aussi. Avant, ce
contrôle citait « Fiches de travail » et « 16 / 20 » en toutes lettres et ne
pouvait que rougir sur la Terminale ou être tu. Le mot de la famille au carnet
(`dmMoyFamille`) reste « fiche » : les travaux facultatifs SONT des fiches, et
la fonction est le même texte dans les trois fichiers.

**Un élève connecté dans un autre onglet CHASSE la session du professeur, et
la base répond 42501.** Signalé par Turquet (septembre 2026) sur la première
fiche des travaux facultatifs : « Enregistrer » dit « fait », il va voir en
tant qu'élève, ne voit pas la fiche, revient, ré-enregistre — « new row
violates row-level security policy for table "parametres" ». Deux choses,
et aucune n'était un défaut des fiches. La session Supabase vit dans le
stockage du navigateur, UNE par projet et par origine : se connecter comme
élève — dans cet onglet ou un autre, c'est le même stockage — remplace celle
du professeur, et le tableau de bord resté ouvert écrit désormais sous le
compte de l'élève : `est_prof()` dit non, PostgREST répond 42501. Et la
fiche ne se voyait pas parce qu'une fiche naît MASQUÉE — le professeur
n'avait pas coché « Afficher aux élèves », et « Fiche enregistrée ✓ » ne le
disait pas. **La page dit désormais les deux** : un refus de politique
d'accès nomme la session remplacée et le chemin du retour (la page du
professeur — jamais son nom de fichier entre guillemets, un contrôle
l'interdit hors de `quitToHome()`), en gardant le message et le code bruts ;
toute autre erreur reste brute, sans accuser la session ; et « Enregistrer »
dit si le devoir ou la fiche est AFFICHÉ aux élèves ou MASQUÉ, avec la case
à cocher. La première version (v297) avait seulement fait parler la page —
« Enregistrement impossible » nu couvrait la session, le réseau et la base
d'un même mot —, et c'est ce message qui a nommé la cause : le diagnostic
d'abord, le remède ensuite. Deux sabotages, chacun rougissant en nommant son
défaut ; un troisième essai a rougi sur le CONTRÔLE voisin, celui des
adresses vers la page d'aiguillage, et il avait raison.

**L'écran du bilan ne bouge plus quand le professeur pose une note.** Demande
de Turquet (septembre 2026) : « quand je modifie une note je souhaite que la
page réapparaisse exactement au même endroit ». Poser une note redessine le
bilan, et le bilan commençait par se réduire à « Chargement… » : mesuré en
Chromium, la page tombait de 8986 à 4346 px et le défilement était ramené de
8086 à 3446 — le professeur qui notait au bas de sa liste voyait tout partir.
Le navigateur finissait par le ramener à peu près, et c'est ce « à peu près »
qui trompait : la position revenait par l'ANCRAGE de Chrome, une heuristique
qui lâche dès que l'ancre disparaît avec le contenu — jamais par la page.
**ON NE VIDE PLUS UN ÉCRAN QU'ON VA REMPLIR AVEC LA MÊME CHOSE**
(`dmAttente`) : la boîte garde son contenu pendant la lecture et ne le
remplace qu'une fois le nouveau prêt. La hauteur ne bouge pas, donc rien ne
bouge — et c'est plus sûr que de rattraper le défilement APRÈS coup, qui
suppose de savoir où l'on était alors que le navigateur l'a déjà oublié.
**Le bord OPPOSÉ compte autant** : quand l'écran va dire AUTRE CHOSE — un
autre devoir, une autre famille —, garder l'ancien contenu ferait lire les
notes du devoir 1 sous le titre du devoir 2, et l'écran dirait autre chose
que la note. C'est une CLÉ posée sur la boîte qui départage les deux cas, et
une lecture ratée l'efface — sans quoi la tentative suivante repartirait sur
son propre échec au lieu d'attendre. Les DEUX boîtes la portent, le bilan et
le carnet des moyennes juste au-dessus : n'en réparer qu'une laisserait
l'autre coincée, et le sabotage l'a montré.
**Et le champ qui a le focus le garde** : le bilan est reconstruit à chaque
note posée, et le professeur qui passe d'une note à la suivante par Tab
voyait le clavier retomber sur la page. Le champ se repère par la CLÉ sous
laquelle sa note est rangée (`data-cle`) — jamais par son rang, que le rendu
recrée — et le focus n'est rendu que s'il était DANS cette boîte : ailleurs,
il appartient à ce que le professeur vient de cliquer, et le lui reprendre
serait pire que de l'avoir perdu.
**`poserNoteDevoir` ATTEND désormais son rendu.** Sans cela elle rend la main
pendant que le bilan se redessine encore, et qui l'attend mesure l'écran
d'AVANT — le premier contrôle s'y est pris, et il accusait la page de ne pas
relire la note qu'elle venait d'enregistrer.
**Deux bancs, la répartition habituelle.** jsdom mesure SANS minuteur :
`renderDevoirResultats` s'exécute jusqu'à sa PREMIÈRE attente avant de rendre
la main, et c'est là que la boîte se vidait — on l'appelle donc sans
attendre, on regarde ce qu'elle affiche, puis on attend ; aucune course. Le
NAVIGATEUR mesure ce que jsdom n'a pas, la hauteur et le défilement : un
observateur relève la hauteur de la page à CHAQUE changement de la boîte, si
bien que l'affaissement se voit même quand il ne dure qu'un tour de boucle —
retarder le double pour le rendre visible aurait fait mesurer l'attente au
lieu de la page. Il lui faut une page HAUTE (douze élèves, trois exercices) :
un devoir d'un seul exercice tient dans l'écran, et il n'y a alors rien à
déplacer — le contrôle le dit plutôt que de passer au vert.
**Deux pièges de SONDE s'y sont montrés, tous deux du banc**, et c'est la
règle « une mesure qui accuse la page se mesure elle-même d'abord » : sans
éditeur rendu, `readEditorIntoDevoir` relit du VIDE et efface les exercices
du devoir ; et un identifiant pris hors de `TEST_ORDER` n'a pas de case à
cocher, donc quitte le devoir au premier enregistrement. Dans les deux cas la
sonde accusait la page d'un défaut qui n'était que le sien.
**ET LE CONTRÔLE DE LA POSITION EST VIVANT, ce qui ne se devinait pas** :
l'écran vidé quand même ne le fait PAS rougir — l'ancrage de Chrome rattrape
la position finale, et c'est l'AFFAISSEMENT qui nomme alors le défaut. Ce
qu'il garde est le risque que le correctif introduit : `focus()` sur une case
hors de l'écran FAIT DÉFILER la page. Le focus envoyé sur le premier champ au
lieu du bon le montre — « la ligne notée est passée de 753 à 3107 px du haut
de l'écran » — et c'est le seul sabotage qui l'atteint.
Dix sabotages en tout, chacun rougissant en nommant son défaut : sept au
banc jsdom, trois que seul le navigateur voit. Et l'un d'eux a d'abord
frappé le VOISIN : le bloc d'erreur des MOYENNES n'est pas celui du BILAN,
et le sabotage restait vert à bon droit tant que l'ancre n'était pas propre
à sa cible — la leçon d'{antecedents-droite}, retombée telle quelle.

**Et la note du DEVOIR ENTIER est une note, elle aussi.** Elle est arrivée
par une autre branche le même jour, dans le même bilan et SANS clé : le
professeur qui la tapait perdait le focus à chaque note posée — exactement le
défaut signalé un étage plus bas, sur une famille de champs qui n'existait pas
encore quand le correctif a été écrit. Elle porte donc sa clé (`@dev|<élève>`,
qui ne peut pas se confondre avec le `<élève>|<exercice>` d'un exercice) et
`poserNoteDevoirEleve` ATTEND son rendu, comme `poserNoteDevoir`. Le contrôle
s'y est pris en défaut au passage : les deux familles partagent la classe
`dm-noteinput`, et la note du devoir vient AVANT dans le bilan — le contrôle
des exercices prenait donc SA clé pour celle d'un exercice, posait une note
dans le vide et accusait la page de ne pas la relire. Il vise
`.dm-noteinput:not(.dm-notedev)` désormais, et un onzième sabotage (la clé
retirée) rougit en nommant son défaut.
