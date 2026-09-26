# Première — pourcentages, évolutions et coefficients

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**La synthèse d'un pourcentage, c'est ne plus savoir d'avance ce qu'on
cherche.** {pourcentage-synthese} (Première 2.1.6, demande de Turquet, août
2026) reprend le MOTEUR de {pourcentage-depart} et {pourcentage-taux} — quatre
propositions a/b/c/d, puis la vérification en 3 étapes — et y ajoute le
troisième type : retrouver le RÉSULTAT, c'est-à-dire le calcul même de
{pourcentage} posé en propositions. Le tirage sert les trois types, chacun au
moins une fois sur les six questions, mélangés : c'est tout ce que la synthèse
ajoute, et c'est l'exercice — repérer ce que l'énoncé donne avant de calculer.
Même moteur, pas même identité : la note sous `test.qId`, le rappel dans
`RAPPELS_ID`, les questions dans `QIA_SUGG` sous l'identifiant.
**Toutes les cases sont vides, même le nombre de départ** (demande de Turquet) :
là où 2.1.4 et 2.1.5 écrivent le nombre dans la chaîne (`f-whole`), la synthèse
pose une case `qN`, jugée comme les autres et comptée dans la note. Le bord
opposé est contrôlé aussi : en 2.1.4, le nombre doit RESTER écrit par la page.
**Le type « résultat » a un piège à lui : l'aide et les messages parlaient du
résultat.** « Tu dois retrouver 12 € » sous une question dont 12 EST la réponse
la donnerait ; l'aide rappelle donc la proposition CHOISIE. Et le message
« calcul juste, mais fait 12, et non 12 » était un non-sens : pour ce type, il
renvoie l'élève à sa proposition. La règle générale reste : le calcul se juge
sur la proposition choisie pour val/pct, sur l'ÉNONCÉ pour res — c'est son
résultat qui départage les propositions, et il n'est jamais révélé.
**Et deux défauts du moteur partagé sont tombés au passage**, parce que la règle
vaut à toutes les profondeurs : une case VIDE rougissait à la vérification (le
bord n'est atteignable qu'en soutien — en entraînement la correction bleue
repasse derrière), et une case SEULE dans sa fraction rougissait parce que sa
jumelle était vide. Elle se juge maintenant sur sa PROMESSE — 30 seul promet
30/100, 7 seul ne promet rien — la note, elle, exige toujours la paire
complète. C'est le bug des sommes de fractions, par une autre porte, et il
vivait en production dans 2.1.4 et 2.1.5.
Un contrôle tient ces bords (tirage mélangé et bonne réponse calculée — à type
égal, le rang de la bonne varie —, cases vides, `qN` jugée et comptée, cases
vides sans couleur, promesse des cases seules, aide muette sur le résultat,
message sans non-sens, « Recommencer » qui relance la bonne identité), éprouvé
en le cassant neuf fois. Un piège d'outillage s'y est montré : un sabotage qui
RETIRE une ligne ne se « remet » pas par `replace('', ligne)` — ça prépende en
tête de fichier, et les sabotages suivants mesurent un fichier déjà cassé.

**Et la même synthèse, mais l'élève JUSTIFIE.** {pourcentage-synthese-libre}
(Première 2.1.7, demande de Turquet, août 2026) reprend le tirage de
{pourcentage-synthese} — les trois types, quatre propositions — et remplace la
chaîne de cases par la feuille de calcul ligne par ligne de la Terminale,
VIDE : c'est l'IA qui lit la justification. C'est le premier exercice rédigé de
la Première, et le portage a apporté trois choses d'un coup : `mlFeuille`
(reprise au caractère près — le contrôle d'identité avec `terminale.html`
couvre désormais les TROIS fichiers), le bloc CSS `dexp2`, et le piège documenté
des jetons évité au moment du portage — `pmEstCase()` accepte les deux familles
de champs, sans quoi la rangée « Insérer » aurait visé le vide.
**La règle envoyée au modèle nomme la voie attendue avec les nombres MÊMES de
la question** — commencer par le pourcentage en fraction × le nombre
(P/100 × N) — dit que les étapes suivantes sont FACULTATIVES, ACCEPTE tout
calcul différent qui fonctionne, et REFUSE la copie sans étape : recopier la
proposition n'est pas justifier. N'en tenir qu'un ne tient rien. Le point 1
tranche selon la proposition réellement choisie, la bonne est déclarée
STRICTEMENT SECRÈTE, et les bornes de troncature de la fonction Edge sont LUES
dans sa source — la marge s'affiche à chaque exécution.
**Deux contrôles se sont pris en défaut au premier sabotage**, et c'est la
leçon habituelle : chercher « P/100 × N » dans TOUTE la règle ne prouvait rien
— la ligne d'égalité, plus haut, porte la même écriture — on cherche APRÈS
« RÈGLE DE DÉCISION » ; et l'identité de « Recommencer » se mesurait sur un
`test.qId` que `startTest()` ne touche pas — l'identifiant restait par inertie,
il faut une sentinelle. Éprouvé en le cassant sept fois.
**« Retrouver le pourcentage » a DEUX voies, et la règle nomme les deux.**
Signalé par Turquet sur une copie (août 2026) : « 32/40 = 16/20 = 80/100 » —
la part sur le tout, amenée au dénominateur 100 — est une justification
parfaitement correcte pour retrouver un pourcentage, mais la règle ne
connaissait que « P/100 × N = résultat » et demandait d'« arriver à 32 » : une
route qui arrive à 80/100 risquait le refus, et la clause « tout calcul
différent est accepté » ne suffit pas à protéger une voie aussi centrale — ce
qui doit être accepté se NOMME, avec les nombres mêmes de la question. La
consigne à l'écran et le contexte de la fenêtre d'aide nomment aussi cette
voie, pour ce type de question seulement. Le contrôle l'exige, sabotage à
l'appui.

**Une feuille ne se crée pas dans un écran caché.** `mlFeuille` donne le focus
à sa première ligne dès sa création, et MathLive lève « reading 'options' »
sur un champ encore invisible — la feuille du 2.1.7 a d'abord vécu derrière le
choix de la proposition (`step-hidden`), un état que la Seconde et la
Terminale ne connaissent pas : leurs feuilles naissent toujours visibles. Seul
le banc navigateur pouvait le voir — jsdom n'a pas MathLive — et il l'a vu à
la première visite. Depuis août 2026 cet état caché n'existe plus (paragraphe
suivant) : la feuille du 2.1.7 naît elle aussi toujours visible, dès le rendu,
et `mlFeuille` reste intouchée. La leçon demeure pour toute feuille future.

**La justification s'écrit AVANT ou APRÈS le choix de la proposition** —
au gré de l'élève (décision de Turquet, août 2026). La feuille du 2.1.7 est
donc visible et servie dès le rendu, sous les propositions, sans qu'aucune
soit choisie ; l'élève peut écrire son calcul d'abord et valider sa
proposition ensuite. Le piège est dans le CHOIX : `choisirPsl` redessinait
l'écran, ce qui recréait la feuille — choisir après avoir rédigé aurait
EFFACÉ la justification au moment précis où l'élève valide, sans erreur nulle
part. Choisir ne touche plus qu'aux boutons, jamais à l'écran. Le contrôle
tient les deux bords — la feuille existe avant tout choix, et choisir ne la
recrée pas (l'identité de l'objet ET la ligne toujours dans le document : le
texte vit dans ses éléments, les préserver le préserve) — plus deux gardes :
« Vérifier » sans proposition le demande sans verrouiller, et la marque
`sel` suit le choix. Éprouvé par sabotage des deux côtés.

**La vérification s'affiche AVEC les propositions, dans tous les QCM à chaîne
de vérification** (décision de Turquet, août 2026) : pourcentages 2.1.4, 2.1.5
et 2.1.6, les quatre « retrouver » des évolutions, leurs variantes
addition/soustraction, et la synthèse des évolutions. L'élève écrit les étapes
AVANT de choisir s'il veut ; les valeurs connues de l'ÉNONCÉ s'affichent tout
de suite, celle qui dépend de la proposition s'écrit « … » tant qu'aucune
n'est choisie. **Choisir — ou changer — ne détruit jamais ce que l'élève a
écrit** : `qcmRedessiner()` redessine l'écran (libellés, nombre écrit par la
page et pose suivent la proposition) puis restaure chaque case et le focus —
SAUF les cases de la POSE, dérivées de la proposition : leurs chiffres ne
veulent rien dire sous une autre. Et la pose facultative ne se révèle jamais
VIDE : elle n'existe qu'une proposition choisie, ses trois gardes le
vérifient. La synthèse des évolutions a son bord propre : la méthode se
choisit AVANT la proposition, la chaîne apparaît dès la méthode — changer de
MÉTHODE, en revanche, reconstruit la chaîne sans restaurer : les deux
méthodes n'écrivent pas le même calcul. Le 2.4.1 (lire un coefficient) reste
volontairement en dehors : son « choix » est le SENS, et le signe de chaque
ligne en dépend — une vérification sans sens n'existe pas. Un contrôle tient
ces bords sur les quatre moteurs, éprouvé par quatre sabotages. **Il est
SYNCHRONE, exprès** : les démarreurs de ces exercices n'attendent rien, et un
contrôle asynchrone laissait les minuteurs en attente des contrôles
précédents s'exécuter à chaque await — un exercice chronométré avançait et
verrouillait `test` en plein vol, le piège documenté par une autre porte.

**Du 2.1.3 au 2.1.7, quatre questions par exercice** (demande de Turquet, août
2026). Deux constantes, à côté de leurs fabriques : `PCT_NB` pour le 2.1.3,
`QD_NB` pour les quatre suivants — et un contrôle à deux sources qui appelle
les CINQ vrais démarreurs et compare à `tests/profils.js`
(`nbQuestionsPourcentages`) : un nombre changé dans une fabrique ne dit rien
des autres.

**La pose facultative de la multiplication suit les nombres de L'ÉLÈVE**
(décision de Turquet, août 2026). Dans les quatre écrans de la Première qui
posent la multiplication des numérateurs comme le 2.2.1 — augmenter,
diminuer, les QCM « retrouver », la synthèse en méthode coefficient —, la
pose est bâtie sur ce que l'élève a ÉCRIT dans la ligne coefficient ×
valeur, zéros finaux retirés, même si ses nombres ne sont pas ceux de la
correction : c'est une aide pour SON calcul, pas une révélation — et ses
cases attendent donc les chiffres de SON produit. Elle est proposée dès
qu'un facteur garde au moins 2 chiffres différents de zéro, et seulement
là : un fait de table ne se pose pas (la leçon du 2.3.7). Dans les QCM,
elle n'attend plus la proposition. `poseEleveMAJ()` la reconstruit quand
les facteurs CHANGENT, et jamais sinon — reconstruire à chaque frappe
effacerait ce que l'élève y écrit — et retourne les facteurs si c'est
l'autre sens qui rentre dans la pose (3 chiffres × 1 chiffre). Un contrôle
tient ces bords sur les quatre écrans, éprouvé par sabotage des deux côtés.
Après une reprise de pause, la pose se reconstruit depuis les facteurs
restaurés ; les chiffres qui y avaient été posés ne sont pas conservés —
c'est un brouillon d'aide, pas une réponse.

**Et la pose de l'addition/soustraction de la méthode directe suit l'élève
AUSSI** — d'abord tenue hors de la demande (« la demande ne porte que sur
la multiplication »), elle y est entrée sur une capture du 2.2.2 (Turquet,
août 2026) : l'élève avait écrit 6000 + 300 dans la ligne « départ +
augmentation », et la pose en colonnes montrait 70 + 63 — les nombres de la
CORRECTION posés sous les siens. `poseOpEleveMAJ()` bâtit la pose des trois
écrans de la méthode directe (2.2.2/2.3.2, les QCM addition/soustraction,
la synthèse en méthode directe) sur les termes ÉCRITS, sur le motif de
`poseEleveMAJ` — reconstruite quand les termes changent, jamais sinon, et
dans les QCM elle n'attend plus la proposition. Deux différences avec la
multiplication, et elles ont leur raison : PAS de zéros finaux retirés —
dans une addition posée, chaque zéro tient sa colonne (6000 + 300 se pose
sur quatre colonnes, c'est le calcul même) — et les colonnes ne posent que
des ENTIERS, une soustraction qui ne descend pas sous zéro : sinon la pose
se cache au lieu de mentir. Le cas de la capture est épinglé au contrôle,
cinq sabotages nommés.

**La synthèse des augmentations est la synthèse des évolutions, HAUSSES
seules.** {synthese-augmentations} (2.2.8, demande de Turquet, août 2026)
reprend le moteur du 2.5.1 — même écran, même correction, mêmes méthodes —
et n'en garde que les hausses : même moteur, pas même identité (`test.qId`,
le motif du calcul mental ; « Recommencer » route par l'identité, la clé du
rappel vit dans `tests/profils.js`, la note part sous
`test.qId||'synthese-pourcentages'` — le motif maison des fins partagées).
Les trois inconnues — le résultat, la valeur initiale, le pourcentage —
sortent chacune UNE fois sur les trois questions, en ordre mélangé : sans
quoi l'élève apprendrait que la question est toujours du même genre.
`genSyn` a simplement appris deux paramètres facultatifs (famille,
inconnue) ; un second tirage aurait fini par diverger.

**La synthèse des augmentations, RÉDIGÉE : deux voies, un juge dans la page.**
{synthese-augmentations-libre} (2.2.9, demande de Turquet, août 2026) reprend
le tirage de {synthese-augmentations} — hausses seules, les trois inconnues
chacune une fois en ordre mélangé — et remplace la chaîne de cases par la
feuille libre du 2.1.7 : l'élève choisit sa proposition et JUSTIFIE en
écrivant sa vérification. Deux voies, toutes deux exigées PAR LEUR FORME :
le coefficient (au moins une multiplication `1,xx × valeur initiale = …` qui
arrive au bon résultat final) ou l'augmentation (au moins une multiplication
`0,xx × valeur initiale = …` ET au moins une addition qui arrive à la valeur
finale). Un calcul qui ne montre aucune des deux est refusé — c'est la
demande, et elle diffère du 2.1.7 où toute méthode juste passe.
**Un verdict arithmétique ne se confie pas à un modèle** — la leçon de la
Seconde, appliquée dès le premier jour : la page porte son juge (`salJuge`),
qui lit les lignes en rationnels exacts (les décimales deviennent des
fractions, jamais de virgule flottante), enregistre chaque produit avec la
LISTE de ses facteurs (voir plus bas — les paires ont refusé une copie
juste en production), et décide sur TROIS positions — refuser sur un fait
prouvable (égalité fausse NOMMÉE, voie absente, multiplication noyée dans un
autre calcul qui n'arrive pas au résultat), accepter quand tout est vérifié,
s'ABSTENIR quand une écriture lui échappe (le modèle décide alors seul).
Quand le juge sait lire, son verdict PRIME et part AVEC la règle (« VERDICT
DE LA PAGE, PRIORITAIRE ») : le modèle ne fait que rédiger, et une prose qui
le contredit — ou un modèle en panne — est remplacée par la phrase du juge.
**Chaque ligne de la feuille est un calcul INDÉPENDANT**, contrairement au
2.1.7 où les lignes poursuivent une seule égalité : la voie de l'augmentation
demande DEUX égalités (la multiplication, puis l'addition), et le préfixe
« = » automatique les aurait soudées en une égalité fausse. Le calcul se juge
sur la proposition CHOISIE — elle remplace l'inconnue, et c'est la
vérification qui révèle qu'une proposition ne convient pas. Éprouvé en le
cassant neuf fois (le résultat final lâché, les égalités fausses avalées,
l'addition oubliée, la mauvaise proposition passée, la voie retirée de la
règle, le verdict non transmis, le juge qui ne prime plus, les familles qui
fuient, les 6 questions revenues) — chacun rougit en nommant son défaut. Un
défaut d'écriture s'est montré au premier passage : `salAttenduIA` bâtissait
sa règle et ne la RENDAIT pas — un `return` oublié ne casse rien, la règle
partait simplement vide.

**Et le miroir sur les BAISSES : même moteur, troisième identité.**
{synthese-diminutions-libre} (2.3.9, demande de Turquet, août 2026) est la
synthèse rédigée des hausses portée aux diminutions : le MÊME moteur `sal` — écran, feuille, juge,
règle — a appris le SENS (`q.sens`, déjà porté par `genSyn`). Le coefficient
d'une baisse s'écrit `0,xx` (1 − P/100), et la seconde voie s'achève par une
SOUSTRACTION : le juge distingue l'addition de la soustraction au niveau haut
de l'expression, et une addition qui retombe sur la valeur finale ne remplace
pas la soustraction — le cas est au contrôle. Quand P = 50, le coefficient et
le pourcentage décimal valent tous deux 0,5 : les deux voies calculent alors
la même chose, et le juge accepte l'une comme l'autre, à bon droit. Les fins
partagées épinglent `test.qId` (le motif maison), « Recommencer » route par
l'identité, et chaque identité a son rappel et ses questions à l'IA —
`qiaSuggestions()` fait primer l'identifiant sur le `kind`. Éprouvé par six
sabotages, chacun nommé.

**Et la synthèse À CASES des baisses est arrivée la dernière — l'asymétrie
était le manque.** {synthese-diminutions} (Première, 2.3.8, demande de
Turquet, septembre 2026 : « faire un exercice de synthèse sur les diminutions
rédigé comme le 2.2.9 ») est le MIROIR de {synthese-augmentations} sur les
baisses. Le sous-thème des hausses avait ses DEUX synthèses — celle à cases
(2.2.9) et la rédigée (2.2.10) — quand celui des baisses n'avait que la
rédigée : c'est cette moitié manquante que la demande nomme, la synthèse
rédigée des baisses existant depuis août.
**TOUT EST REPRIS, RIEN N'EST RECOPIÉ, et c'est ce qui rend l'ajout court** :
`genSyn('dim', …)` est le générateur MÊME du 2.2.9 et du 2.5.1 — un second
aurait fini par diverger, et deux exercices voisins se seraient contredits
sous les yeux de l'élève —, l'écran (`scr-syntest`), la correction
(`checkSynAnswer`), la pose facultative et le contexte envoyé au modèle sont
déjà GÉNÉRIQUES sur `q.fam` (« une baisse ») et sur `q.sens` : pas une ligne
n'a eu à y changer. Le démarreur et deux entrées de table sont tout l'ajout.
**Même moteur, pas même identité** (le motif du calcul mental) : la note part
sous `test.qId`, « Recommencer » route par l'identité — la route est devenue
une TABLE, un `if` de plus aurait fini par en oublier une —, et la clé du
rappel vit dans `tests/profils.js` comme celle du 2.2.9, sur `RAPPELS.syn`
qui couvre les deux sens. Lui donner un rappel dédié aurait créé une
asymétrie avec son miroir, qui n'en a pas.
Les trois inconnues — le résultat, la valeur initiale, le pourcentage —
sortent chacune UNE fois sur les trois questions, en ordre mélangé : sans
quoi l'élève apprendrait que la question est toujours du même genre.
**Le contrôle des synthèses a été ÉTENDU, pas doublé** : il tient désormais
les TROIS à cases, et le sens de chacune est un bord RÉEL — un `genSyn('aug')`
recopié dans le démarreur des baisses poserait des hausses sous un titre de
baisses, et rien à l'écran ne le dirait. L'ordre d'appel compte : le nouveau
démarreur passe AVANT `startSynAug` dans la boucle, le contrôle d'identité qui
la suit lisant l'état du DERNIER appelé. Huit sabotages, chacun rougissant en
nommant son défaut — le sens inversé, l'identité non épinglée, « Recommencer »
mal routé, les inconnues au hasard, leur ordre figé, l'exercice hors de
THEMES, le rappel non déclaré, la séance allongée.
**Et la numérotation a bougé avec lui**, comme toujours :
{synthese-diminutions-libre} passe en 2.3.9. Les références écrites
`{identifiant}` ont suivi d'elles-mêmes ; les numéros ÉCRITS — la liste des
démarreurs du contrôle d'EVOL_NB, les messages qui nomment ces exercices, et
les commentaires que l'insertion du 2.2.8 avait déjà laissés en arrière — ont
été repris à la main le jour même. Un contrôle qui s'affiche sous le nom d'un
autre est pire qu'un contrôle sans nom.

**Une multiplication n'est pas une paire : c'est une liste de facteurs.**
Signalé par Turquet en production sur une capture (août 2026) : sur le 2.2.9,
« 100 × 140/100 = 140 » — le coefficient écrit en FRACTION, posé APRÈS la
valeur initiale — était compté faux, le message réclamant la voie même que la
copie montrait. Le juge enregistrait les multiplications par PAIRES, de
gauche à droite : dans 100 × 140/100 il voyait (100 ; 140) puis « ÷ 100 »,
et la paire (valeur initiale ; coefficient) n'existait jamais quand le
coefficient s'écrit en fraction. C'est le pire défaut du projet — une
réponse juste comptée fausse — passé par une écriture que personne n'avait
posée au banc. `salExpr` collecte désormais, pour chaque terme, la LISTE de
ses facteurs (un « ÷ y » devient un facteur 1/y), et une voie est montrée si
l'un des facteurs vaut la valeur initiale et que le PRODUIT DE TOUS LES
AUTRES vaut la cible — quel que soit l'ordre, quelle que soit l'écriture
(1,4 ou 140/100). La copie de production est ÉPINGLÉE au contrôle : si elle
ne passe pas au juge, c'est le juge qui a tort.
**Et la vérification PEINT la feuille** (même signalement : « on écrit en
rouge ce qui ne va pas et en vert ce qui est correct ») — sous la convention
d'août 2026 : la ligne dont toutes les égalités sont vraies passe en BLEU
(`ok`), celle qui porte une égalité fausse en rouge (`bad`), et une ligne
que le juge ne sait pas lire ne reçoit RIEN — ne pas savoir n'est pas faux.
`salPeindreLignes()` lit chaque ligne par la voie de la feuille (toPlain sur
la vraie MathLive) et retombe sur `mf.value` quand MathLive n'est pas là :
c'est ce repli qui rend la peinture mesurable au banc, sur une feuille
adossée à de VRAIS éléments. Deux sabotages, chacun nommé : la peinture
débranchée, et le retour aux paires — la copie de production rougit alors en
toutes lettres.

**Le quotient est une TROISIÈME voie, et le modèle ne rédige plus les
refus.** Seconde copie de production (signalée par Turquet, août 2026) :
« 936/900 = 104/100 » puis « donc coef 1.04 » sur « 900 devient 936,
retrouve le pourcentage » — refusée, avec une prose qui se contredisait
(« l'égalité est fausse… Donc c'est vrai ! »). Trois défauts, trois
corrections, toutes deux copies épinglées au contrôle :
· **La voie du QUOTIENT suffit** (demande de Turquet) : la valeur finale
  divisée par la valeur initiale EST le coefficient — la leçon du 2.1.7
  (« la part sur le tout »), revenue au 2.2.10/2.3.9. Il faut un morceau qui
  ÉCRIT le quotient (un facteur 1/valeur-initiale, produit = coefficient) et
  un AUTRE morceau qui vaut le coefficient sans être la même écriture —
  « 936/900 = 936/900 » ne nomme rien, sauf quand la valeur initiale est
  100, où l'écriture du quotient EST le coefficient sur 100. La voie se
  NOMME partout : la règle du modèle, la consigne à l'écran, le message de
  la feuille vide, la phrase du juge.
· **Une ligne SANS « = » que le juge ne sait pas lire est un COMMENTAIRE**
  (« donc coef 1.04 ») : elle n'affirme aucune égalité et ne force plus
  l'abstention — c'est elle qui livrait la copie ENTIÈRE au modèle seul, qui
  a divagué. Mais si aucune voie lisible n'est trouvée, la voie est
  peut-être écrite EN MOTS dans ce commentaire : refuser ne serait pas un
  fait prouvable, le juge s'abstient — les deux bords sont au contrôle.
· **Sur un refus que le juge sait prononcer, SA phrase s'affiche toujours**
  — le modèle ne rédige plus que les acceptations, et seulement s'il est
  d'accord : une prose de refus qui dit « faux puis vrai » n'a plus de
  chemin vers l'écran. Éprouvé par quatre sabotages nommés (la voie
  retirée, le commentaire qui re-force l'abstention, la prose du modèle
  reprise sur un refus, la tautologie acceptée).

**Et la TROISIÈME famille est entrée dans le moteur rédigé : la synthèse
entière.** {synthese-pourcentages-libre} (Première, 2.5.2, demande de Turquet,
septembre 2026 : « un exercice comme le 2.5.1 mais où il faut rédiger la
justification dans une case comme dans le 2.2.9 ») suit {synthese-pourcentages}
au menu : le tirage du 2.5.1 — `genSyn` SANS famille imposée, donc prendre,
augmenter et diminuer, et les trois inconnues chacune UNE fois en ordre
mélangé — posé sur l'écran, la feuille et le juge du 2.2.10. Même moteur de
tirage, même moteur de rédaction, pas même identité : la note part sous
`test.qId`, le rappel vit dans `RAPPELS_ID`, les questions dans `QIA_SUGG`,
et « Recommencer » route par l'identifiant — le repli d'un `qId` inconnu
reste le 2.2.9.
**CE QUI ARRIVE VRAIMENT ICI, C'EST « PRENDRE P % » : le juge ne connaissait
que les évolutions.** `salSens` lui donne le sens 0, son « coefficient » est
P/100 et sa valeur finale EST la part — si bien que les deux voies de
l'évolution se confondent, ce qui est exact : il n'y a qu'une multiplication
à montrer. Les justifications acceptées sont celles que Turquet a nommées :
la multiplication par le bon coefficient qui arrive au résultat, la hausse ou
la baisse calculée d'abord puis l'addition ou la soustraction, et **la
simplification de fraction qui retrouve un pourcentage** — la voie du
quotient, déjà là depuis le signalement d'août 2026, qui sur cette famille
s'écrit 180/600 = 3/10 = 30/100.
**AUCUN GARDE N'EST POSÉ SUR `voieOk`, ET C'EST DÉLIBÉRÉ : il serait MORT.**
Le premier jet y écrivait `!part && augProd && addOk` pour interdire
l'addition sur « prendre P % » — mais pour cette famille `augProd` et
`coefOk` testent exactement la même chose, donc une copie qui montre l'une
est déjà acceptée par l'autre, et retirer le garde ne change rien. La
propriété est tenue autrement, et elle l'est : une addition SEULE ne passe
par aucune des deux voies. Le garde VIT en revanche dans le MESSAGE — une
soustraction seule rend `addOk` vrai, et nommer « la diminution » devant un
élève à qui on ne demande aucune évolution serait un message qui ment ; le
sabotage le montre en toutes lettres.
**L'ÉCRAN DIT CE QUE LE JUGE ACCEPTE, et un seul endroit l'écrit.**
`salVoiesTexte` nomme les voies ; l'étiquette de la feuille, le message de la
feuille vide et le refus du juge la lisent tous — trois phrases écrites
séparément auraient fini par promettre à l'écran autre chose que ce que le
juge accepte. La table d'énoncés est partagée de la même façon
(`synTab`) : le rédigé pose exactement la question du guidé.
**Deux bancs, la répartition habituelle.** jsdom tient le tirage (les trois
inconnues, les trois familles — une synthèse qui n'en tirerait qu'une aurait
perdu son sujet), le juge cas par cas sur des questions ÉPINGLÉES, le bord
OPPOSÉ dans le même exercice (une hausse et une baisse gardent leur voie par
l'addition et la soustraction), la règle envoyée au modèle et sa borne de
troncature (3244 caractères pour 4000). Le NAVIGATEUR tient ce que jsdom ne
peut pas voir : il TAPE la fraction dans la vraie feuille MathLive — la voie
du quotient n'existe que si la sérialisation réelle repasse par le juge, et
jsdom pose des chaînes qu'il écrit lui-même — puis relit le verdict, la note
et la couleur des lignes ; le double du banc répondant toujours
« correct:false », c'est aussi le bord du JUGE QUI PRIME.
Dix-sept sabotages au banc jsdom, chacun rougissant en nommant son défaut —
et l'un d'eux est d'abord resté VERT en montrant un TROU DU CONTRÔLE : il
lisait l'écran ENTIER, où l'indication sous la feuille parle elle aussi
d'addition, si bien qu'une étiquette qui aurait cessé de nommer les voies
serait passée inaperçue. Il lit l'ÉTIQUETTE désormais, et garde l'écran
entier pour son bord à lui — rien n'y promet d'addition sur « prendre P % ».
**Et l'intégration continue a nommé un contrôle INTERMITTENT, venu d'une
autre branche le même jour.** « Un « = » et la case qu'il annonce restent sur
la même ligne » exigeait que CHAQUE groupe `.f-grp` porte un `math-field` —
or la somme de fractions pose le maillon « 3 = 3/1 » dès qu'un terme est un
ENTIER, et la page l'ÉCRIT : ce groupe-là n'a aucune case à saisir. Le banc
rougissait donc **une exécution sur trois**, sur une page parfaitement juste,
et trois exécutions locales étaient passées avant que l'action GitHub ne le
montre — la leçon du barème de la coupe, retombée telle quelle.
**La mesure qui accuse la page a été mesurée elle-même avant qu'on corrige
quoi que ce soit** : le défaut se reproduit sur `main` SEUL, sans une ligne
de la branche.
**Et la correction est venue de l'autre côté, la meilleure des deux.** Cette
branche avait fait prendre au contrôle la case saisie, ou à défaut ce que la
page a écrit ; `main` a fait mieux pendant ce temps — « la mesure du « = » ne
connaît plus aucune fabrique » : elle ne part plus des groupes mais de CHAQUE
case visible, remonte au texte qui la précède, et exige qu'un « = » ou une
tête finissant par la virgule partage sa ligne, à trois largeurs. Le maillon
écrit n'a alors plus rien à mesurer, et l'intermittence disparaît avec la
question. La fusion a donc gardé la version de `main` entière, et le
`entierEcrit` qui rendait l'ancienne mesure déterministe est parti avec elle :
un réglage sans lecteur ferait croire qu'on tient quelque chose.

**Et {reconnaitre-coefficient} est passé de 2.5.2 à 2.5.3**, la numérotation
se déduisant de la position : les notes déjà obtenues ne bougent pas — elles
portent l'IDENTIFIANT — et les renvois suivent, écrits `{identifiant}`. Les
paragraphes plus anciens de ce fichier qui l'appellent « 2.5.2 » racontent
l'histoire avec le numéro de leur époque.

**Le dénominateur vide ne condamne personne.** Signalé par Turquet sur une
capture (août 2026, le 1.7 en soutien) : sur « 0,04 × 17 », le 4 tapé au
numérateur ROUGISSAIT pendant que l'élève écrivait son dénominateur. Quatre
exercices de la Première acceptent un facteur ENTIER en laissant son
dénominateur vide (vide vaut 1 au contrôle final : le 17 de 0,04 × 17) —
1.7, 1.8, 2.2.7, 2.3.7 — et leur correction en direct appliquait cette
convention au numérateur en cours de frappe : 4/1 se comparait à 4/100, et
rougissait. La règle des paires, encore, une case plus loin : un numérateur
seul se juge sur sa PROMESSE — « ok » s'il est déjà juste en entier, RIEN
s'il peut encore mener à une fraction égale, rouge seulement s'il ne mène
nulle part (aux fractions « toute écriture égale acceptée », presque tout
numérateur positif mène quelque part : c'est le silence qui est honnête,
pas le vert). Et à la VÉRIFICATION, une case restée vide ne reçoit jamais
de couleur — `marqueSaufVide`, partagé par les quatre exercices : rouge
veut dire faux, pas « pas fini ». Le cas de la capture est épinglé au
contrôle ; trois sabotages nommés (le vide qui revaut 1 en direct, la case
vide repeinte à la vérification, un exercice qui revient à l'ancienne
marque).

**La paire fausse ne rougit que sa case fautive.** Seconde capture de
Turquet sur le 1.7 (août 2026) : sur 0,08 × 0,77, le produit écrit
616/100000 rougissait ses DEUX cases — « la case 616 ne doit pas être rouge
car correct ». Un seul verdict de paire peignait les deux cellules d'une
fraction, et le code portait même la doctrine en commentaire (« les 2 cases
d'une même étape partagent le même état ») — renversée ce jour-là : quand la
paire ne fait pas la bonne fraction, chaque case se juge SEULE contre la
valeur CANONIQUE, celle que l'énoncé fait écrire — 616 reste juste, seul
100000 rougit, et le miroir vaut aussi (1232/10000 : le dénominateur reste
juste). Toute fraction ÉGALE reste acceptée, comme avant.
**L'ancre canonique ne joue que si l'AUTRE case est ÉCRITE** : un numérateur
seul garde la convention du facteur entier — vide vaut 1, « 4 » seul dit 4,
faux devant 0,04 — c'est le bord du paragraphe précédent, et le premier jet
du correctif l'écrasait : le contrôle existant l'a rattrapé à la première
exécution. `marqueFracSaufVide` porte la règle à la vérification (1.7, 1.8,
2.2.7, 2.3.7), `liveColorFrac` et `liveColorFracPow10` en direct — dans les
DEUX fichiers, la Seconde ayant les mêmes fonctions — et la vérification du
2.1.3 des deux niveaux suit. La capture est épinglée au contrôle, cinq
sabotages nommés — et l'un d'eux est d'abord resté VERT : la vérification
du 2.1.3 revenue au verdict de paire, parce que le contrôle générique ne
mesurait que le DIRECT et qu'aucun ne cliquait « Vérifier » sur ce chemin.
Le bord est tenu (« à la vérification aussi, seule la case fautive
rougit »), sabotage rejoué à l'appui.
**Et les cases des multiplications ont rejoint le groupe de référence des
pourcentages** (même capture : « je veux que la police soit aussi grande…
et que les cases s'agrandissent si le nombre dépasse ») : police 1,9 rem,
`width:auto` qui suit la saisie, la barre et l'autre case alignées sur la
plus large — les trois règles écrites en commentaire du bloc CSS des
pourcentages, qui valaient partout et n'étaient appliquées que là. Le
plafond générique `max-width:110px` des paires est relevé à 320. Le banc
navigateur MESURE (« 6 quater bis ») : la police rendue, la case qui
s'élargit sur « 100000 », rien de coupé, la barre qui suit — seul un
navigateur sait où un nombre se coupe.

**La fraction décimale du 1.6 se juge case par case, à l'ancre canonique.**
Demande de Turquet (août 2026), ses exemples pour 2,3 → 23/10 pris tels
quels : le 1.6 peignait encore la PAIRE entière — 23/100 rougissait ses deux
cases — et ses cases gardaient une largeur FIXE pendant que tous les autres
écrans à fractions suivaient la saisie. Deux corrections, un juge :
· **UN SEUL juge pour le direct et la vérification** (`fracDecVerdict`, servi
  par `fracDecLive` et `marqueFracDec`) : deux verdicts auraient fini par se
  contredire sous les yeux de l'élève. Toute écriture ÉGALE reste acceptée —
  230/100 vaut le point, « même si ce n'est pas la fraction décimale la plus
  simple » — ; quand la paire ne colle pas, chaque case se juge SEULE contre
  la valeur canonique (23/100 : le 23 bleu, le 100 rouge ; 230/10 : le 230
  rouge, le 10 bleu) — la règle du 616/100000, enfin appliquée ici. Une case
  SEULE ne dépend pas de l'autre : 23 en haut ou 10 en bas est bleu sans que
  sa voisine soit remplie ; 230 seul ne reçoit RIEN — il attend son 100, le
  silence est honnête — et rougit seulement quand il ne mène nulle part (24).
  Le cadran `pow10` restreint promesse et paire aux dénominateurs en
  puissance de 10 pour les étapes des niveaux 4 et 5.
· **En entraînement, la case vide reçoit la complétion de la ROUTE de
  l'élève** quand sa case écrite y mène — 230 seul appelle 100, jamais 10 :
  écrire 10 en vert sous son 230 lui donnerait tort sur une idée juste — et
  la canonique sinon. Le message du soutien ne parle de « cases en rouge »
  que s'il y en a.
· **Les cases grandissent avec la saisie** : le groupe `#fHost` a rejoint la
  règle des autres écrans (`width:auto`, plafond `pm-mf` relevé, barre
  étirée) — et le contrôle a pris le premier jet en défaut à sa première
  exécution : le dénominateur grandissait, la barre suivait, le NUMÉRATEUR
  restait à 76 px — dans une colonne flex centrée, « l'autre case suit la
  plus large » exige `align-self:stretch`, et seul un navigateur le mesure.
Le contrôle épingle les cinq exemples de Turquet au CLIC et en DIRECT, plus
les bords de la doctrine ; la liste `caseQuiGrandit` du banc navigateur est
devenue une LISTE (la leçon d'aideMaintenue) et mesure les deux écrans. Huit
sabotages, chacun rougissant en nommant son défaut — le huitième (la
croissance CSS retirée) ne rougit qu'au navigateur, jsdom restant vert.
**Un piège de sonde s'y est montré, hors banc** : écrire `.value` sur un
math-field AVANT que MathLive ne soit chargé tombe dans le vide — la greffe
définit l'accès, le module absent ne rend rien — et la capture d'écran
accusait la page d'ignorer une copie qu'elle n'avait jamais reçue. Le banc,
lui, sert le VRAI MathLive depuis son cache : ses mesures disaient vrai.

**Les exercices sur les ÉVOLUTIONS posent 3 questions** — hausses 2.2.1 à
2.2.8, baisses 2.3.1 à 2.3.7, ET la synthèse 2.5.1 (demande de Turquet, août
2026, en trois temps : les hausses seules, « pour les diminutions aussi »,
puis « pour la synthèse 2.5.1 aussi »). Le 2.5.1 a suivi le motif du 2.2.8 en
y passant : ses trois inconnues sortent chacune UNE fois, en ordre mélangé —
à trois questions, un tirage au hasard répéterait souvent le même genre — et
ses FAMILLES restent mélangées, sous contrôle : une synthèse qui ne tirerait
plus qu'une famille aurait perdu son sujet. `SYN_NB` a disparu avec ce
changement, comme `AUGQ_NB` avant lui.
Le nombre vit dans `EVOL_NB`, une seule constante à côté des démarreurs —
le paramètre de comptage qu'avaient gagné les démarreurs partagés
(`startEvolAdd`, `startA2Q`, `startAUGQ`) pour tenir les deux familles à
des réglages différents a été RETIRÉ avec la différence qui le justifiait,
et `AUGQ_NB` avec lui : un paramètre qui ne varie plus est une porte à
divergence. Le contrôle compare les QUINZE démarreurs à `tests/profils.js`
(`nbQuestionsEvolutions`) — deux sources, comme `SF_NB` — compte SEIZE
démarreurs, et ses sabotages rougissent en nommant l'exercice (« 2.3.7 : 6
questions au lieu de 3 », puis « 2.5.1 » à son tour).

**Reconnaître un coefficient, c'est d'abord déjouer trois pièges.**
{reconnaitre-coefficient} (2.5.2, demande de Turquet, août 2026) : une
transformation donnée — augmenter de P %, diminuer de P %, prendre P % — et
QUATRE coefficients proposés, dont les pièges qui font l'exercice : le
coefficient de l'AUTRE sens, « prendre P % » à la place d'une évolution, et
la VIRGULE décalée (1,03 pour +30 %). L'élève choisit, puis VÉRIFIE sa
proposition en calculant le coefficient dans des cases — l'étape du 2.2.1 :
1 + 30/100 = 1 + 0,30 = 1,30, et P/100 = 0,PP pour « prendre », qui n'a pas
de maillon « 1 ± ». Les trois familles sortent chacune UNE fois sur les
trois questions, en ordre mélangé — le motif des synthèses — et à famille
égale le rang de la bonne varie.
**La bonne réponse n'est jamais rangée à côté de la question** : la question
ne porte que la famille et P — un contrôle refuse tout autre champ — et
`ckCoef()`, que l'énoncé, les propositions et la correction lisent tous, la
recalcule. La chaîne de vérification est VISIBLE dès le rendu (la règle des
QCM à chaîne) : rien n'y dépend du choix, donc choisir ne redessine jamais
l'écran — les cases écrites survivent. La bonne CHOISIE est bleue, la bonne
MONTRÉE est verte, une case vide ne reçoit aucune couleur, et le piège
CHOISI se NOMME dans le retour (le motif d'{variations-depuis-derivee}).
Le tirage écarte P = 50, où le coefficient d'une baisse rejoint « prendre »
(0,50 = 0,50) : deux propositions égales seraient deux bonnes réponses dont
une seule comptée. Éprouvé en le cassant sept fois — les familles au hasard,
les propositions non mélangées, la bonne rangée dans la question, le choix
qui redessine, la bonne qui ne se montre plus, la case vide rougie, le piège
tu — chacun rougit en nommant son défaut.

**Un coefficient se lit sur son écart à 1.** L'exercice 2.4.1 fait le chemin
inverse de {augmenter-pourcentage} et {diminuer-pourcentage} : on donne le
coefficient, l'élève dit le sens puis le pourcentage. Le piège qu'il vise est
franc — 0,96 n'est pas « −96 % » mais « −4 % », parce que ce qui compte est ce
qui MANQUE pour arriver à 1. Le sens se choisit sur deux boutons ; le
pourcentage s'écrit (décision de Turquet, août 2026) : lire 0,96 et en déduire
4 % EST l'exercice, et quatre propositions se laisseraient éliminer.
**Le signe affiché à la vérification suit le sens CHOISI, pas le bon.** C'est
tout ce qui fait qu'une vérification vérifie quelque chose : un élève qui a
répondu « augmentation » devant 0,96 se voit proposer « 1 + …/100 = … = 1,… »
et bute sur le « 1, » qu'il ne peut pas remplir. Corriger sur le bon signe
aurait donné une vérification qui tombe juste quelle que soit la réponse.
Changer de sens redessine l'étape : les cases déjà écrites ne veulent plus rien
dire sous l'autre signe. Le pourcentage garde un seul chiffre non nul, si bien
que le coefficient n'a jamais plus de deux chiffres différents de zéro —
36 valeurs en tout, de 0,1 à 1,9.
**Et la chaîne S'ARRÊTE à l'écriture décimale du coefficient** (décision de
Turquet, septembre 2026) : elle redemandait ensuite sa forme FRACTIONNAIRE —
1 − 4/100 = 1 − 0,04 = 0,96 = 96/100 — et ce dernier maillon ne sert à rien
ICI. En 2.2.1 et 2.3.1 il sert, et c'est ce qui départage les deux cas : la
fraction du coefficient y est celle qu'on multiplie ensuite par la valeur de
départ, à l'étape ②. Le 2.4.1 n'a pas d'étape suivante — la vérification est
finie dès qu'on retombe sur le coefficient DONNÉ, écrit en décimal dans
l'énoncé. Le rappel de cours le montrait déjà ainsi
(\(1-\frac{4}{100}=1-0{,}04=0{,}96\)) : l'écran dit enfin la même chose que
lui. **Trois choses s'arrêtent ensemble, et n'en arrêter qu'une ne tient
rien** : la chaîne, le message de correction et le contexte envoyé au modèle —
raccourcie d'un côté et pas de l'autre, la question dirait autre chose que
l'écran. La question passe de 7 cases à 5, et la note affichée le dit
(« 5 cases justes sur 5 ») ; la note enregistrée, elle, vaut 1 point par
question et ne bouge pas. Le contrôle tient les trois bords — le maillon
retiré (aucune fraction du coefficient nulle part), les maillons GARDÉS (P/100
et l'écriture décimale du pourcentage, sans quoi « on a tout retiré »
passerait aussi) et la note. Sept sabotages, chacun rougissant en nommant son
défaut.

**Et le chemin direct, en SIX propositions : associer chaque transformation à
son coefficient.** {associer-coefficient} (Première, demande de Turquet,
septembre 2026 — « dans lire un coefficient, créer un exercice qui permet
d'associer à prendre un %, ou augmenter d'un % ou diminuer d'un % le bon
coefficient multiplicateur parmi 6 coefficients ») suit {lire-coefficient} dans
le même sous-thème : celui-ci LIT un coefficient donné, l'autre le FABRIQUE.
Une question = un seul pourcentage et les TROIS phrases à la fois, chacune avec
sa liste des six.
**LES SIX NE DIFFÈRENT QUE PAR CE QUI FAIT L'ERREUR, et c'est tout
l'exercice** : ce sont les trois familles pour P, puis les trois familles pour
P la VIRGULE DÉCALÉE d'un rang — pour P = 30 : 0,30 / 1,30 / 0,70, puis
0,03 / 1,03 / 0,97. Deux axes, donc six cases, et les deux pièges du 2.5.2 (la
famille confondue, la virgule déplacée) sont présents SUR CHAQUE LIGNE à la
fois : aucune proposition ne s'élimine sans raisonner. Des propositions qui
différeraient par autre chose se laisseraient écarter sans lire la phrase — la
leçon d'{intervalles-inegalite}, transposée.
**TOUT EST REPRIS DU 2.5.2, RIEN N'EST RECOPIÉ** : `ckCoef` (le coefficient
d'une transformation), `ckStr` (son écriture), `ckMots` (le verbe et le signe)
et `ckPiege` (le NOM de l'erreur) sont les fonctions MÊMES du QCM des
coefficients — un second jeu aurait fini par diverger, et deux exercices
voisins se seraient contredits sous les yeux de l'élève. Les six propositions
sont exactement celles que `ckPiege` sait nommer, si bien que chacune des cinq
erreurs possibles d'une ligne reçoit son explication sans qu'on ait rien à
écrire de plus. Même moteur de nombres, pas la même identité : la note part
sous `test.qId`, le rappel vit dans `RAPPELS_ID`, les questions dans
`QIA_SUGG`.
**P = 5 EST LE SEUL TIRAGE ÉCARTÉ, et c'est le seul garde du générateur** : sa
virgule décalée vaut 50, et « prendre 50 % » comme « diminuer de 50 % » donnent
0,50 — deux propositions identiques seraient deux bonnes réponses dont une
seule comptée. Le garde est donc VIVANT, et le contrôle le démontre plutôt que
de le supposer : il vérifie que P = 5 produit bien une collision, et qu'aucun
tirage ne le rend. Les bornes, elles, n'ont AUCUN garde — un coefficient hors
de ]0 ; 2[ est impossible par construction, et un garde qui n'écarte jamais
rien fait croire qu'on vérifie quelque chose : c'est le CONTRÔLE qui exige la
propriété sur chaque tirage.
**La bonne réponse n'est jamais rangée à côté de la question** : celle-ci ne
porte que P, l'ORDRE des six et les choix de l'élève — le contrôle refuse tout
autre champ — et `ckCoef()` recalcule chaque ligne. L'ordre des six est tiré
par question et le MÊME dans les trois listes et dans le banc affiché : à ligne
égale, le rang de la bonne varie.
**CHAQUE LIGNE SE JUGE SEULE** : une association fausse coûte exactement son
point et ne fait pas rougir ses voisines, la note de l'écran le dit (« 2 cases
justes sur 3 » — `ptsEcran` voit les listes sans qu'on ait rien à lui ajouter),
et le point de la question reste l'exercice PARFAIT, la convention que la barre
du haut annonce en toutes lettres. Une ligne laissée VIDE n'est pas une faute :
la vérification la redemande, sans rien peindre ni verrouiller — rouge veut
dire faux, jamais « pas fini ».
**AUCUNE CORRECTION AU FIL DES CLICS, et c'est déclaré**
(`soutienEnDirect.sans`) : colorer une ligne au moment où l'élève la choisit lui
dirait si elle est juste avant même qu'il vérifie, et il n'aurait plus qu'à
essayer les six — la règle de {solutions-graphique} en Seconde. En soutien, la
ligne juste se verrouille en bleu, la fausse rougit et reste à reprendre, et
RIEN ne révèle la bonne réponse ; en entraînement, `corrCase` — l'entonnoir de
la convention commune, qui savait déjà traiter une liste — pose le bleu, le
rouge et le badge VERT portant le LIBELLÉ de l'option, jamais son rang.
**LA LISTE A UNE LARGEUR EXPLICITE, et il la faut** : la feuille pose
`select{width:100%}`, si bien qu'une liste sans largeur propre s'étire sur
toute la ligne et les trois phrases se lisent l'une sous l'autre — le piège
déjà payé sur les quatre cases des intervalles, en Seconde. Et ses trois
verdicts doivent EXISTER dans la feuille de styles : c'est le premier écran de
ce niveau qui réponde par une liste, donc sans ces règles la vérification
serait parfaitement enregistrée et parfaitement invisible.
**Deux bancs, la répartition habituelle.** Le PRINCIPAL tient le tirage, les
champs de la question, le rendu, la correction cliquée, le soutien et
l'identité ; le NAVIGATEUR (« 6 quater nonies », déclaré par
`associerCoefficient` dans `tests/profils.js`) mesure ce que jsdom ne voit
pas — les six sur UNE bande, aucune des trois phrases repliée à 1400 px, la
liste qui ne s'étire pas (la règle peut être écrite et perdue dans la cascade,
le piège du 2.1.2), sa police à la taille de sa phrase (le contrôle universel
ne mesure que les `math-field`), puis il CHOISIT dans les vraies listes et lit
l'encre RENDUE, badge compris, mesuré au RECTANGLE.
**Dix-sept sabotages, seize rougissant d'emblée en nommant leur défaut** — et
le dix-septième a montré un TROU DU CONTRÔLE : son témoin portait les six
DÉJÀ RANGÉS par ordre croissant, si bien que trier le banc ne changeait rien et
que le sabotage passait au vert en parlant d'autre chose. Le témoin est
mélangé désormais, et il rougit. Un dix-huitième n'a pas pu se poser : son
ancre citait une apostrophe typographique là où le commentaire de la page en
porte une droite — un sabotage se pose sur une ancre PROPRE à sa cible, au
caractère près.

**Puis une élève a eu DEUX FOIS LE MÊME ÉNONCÉ** (Seconde, 4.4.2, signalé par
Turquet, septembre 2026). Les trois questions d'une séance étaient tirées
chacune de son côté, `Array.from({length:AC_NB},genAC)`, sur un vivier de
seize pourcentages : deux questions sur le même P sortaient dans près d'une
séance sur cinq. Et le doublon exact n'est pas le seul : P et sa virgule
décalée (30 et 3) proposent les MÊMES six coefficients, seules les phrases
changent — c'est le même énoncé, à peine déguisé, et avec lui une séance sur
trois environ était touchée. `genAC(deja)` reçoit désormais les questions déjà
tirées et écarte P ET sa virgule décalée ; huit paires pour trois questions,
le vivier ne s'épuise pas. Les deux niveaux ont le même moteur, les deux sont
corrigés. Le contrôle du tirage l'exige sur ses trente séances, et le
sabotage (l'ancien tirage remis) a rougi à la première en nommant « 2, 20,
20 » — exactement le cas signalé.

**Deux hausses non plus — mais l'écart part dans l'autre sens.** L'exercice
2.2.7 est le miroir de 2.3.7 : +40 % puis +4 % fait +45,6 %, soit PLUS que 44,
parce que la seconde hausse porte sur la valeur déjà augmentée ; à la baisse on
trouve moins que la somme (42,4). C'est la paire qui est instructive, pas
chacun pris seul.
**La pose n'est pas la même, et ne pouvait pas l'être.** Les coefficients de
hausse valent 1,4 et 1,04 : leurs numérateurs sont 14 et 104, soit trois
chiffres × deux, quand {mult-decimaux} ne sait poser que deux chiffres × un.
C'est {mult-dec-un} qui sait cette pose-là — deux produits partiels et un
décalage —, et elle vivait en ligne dans son rendu. `buildPoseU()` la partage
désormais entre les deux exercices, avec `poseUDonnees()` pour les chiffres.
L'extraction a été PROUVÉE plutôt que relue : le HTML rendu est identique au
caractère près sur 4000 tirages et sur les trois formes (2×2, 3×2, 3×3), et
l'arithmétique sur les 324 couples que produit `uFactor()`. Une pose se juge à
l'œil, donc on ne la déplace pas sans preuve.

**Et le coefficient global s'écrit avec au plus DEUX décimales.** Demande de
Turquet (septembre 2026) : « je ne veux que des pourcentages qui ne donnent
comme coefficient global uniquement 2 ou 1 chiffres après la virgule », son
exemple étant 1,02 × 1,50 = 1,53. Le paragraphe ci-dessus raconte l'exercice
avec les nombres de son époque : +40 % puis +4 % donnait 1,456 et la hausse
globale se lisait « 45,6 % » — ce tirage-là n'existe plus, et la hausse globale
est désormais un nombre ENTIER de pourcent.
**LA CONDITION SE DÉMONTRE, elle ne se tâtonne pas** :
(100+P1)(100+P2) = 10000 + 100(P1+P2) + P1·P2, donc le coefficient global a au
plus deux décimales SI ET SEULEMENT SI P1·P2 est un multiple de 100. C'est très
restrictif : le produit doit apporter le 4 et le 25 de 100, donc — avec la
règle de 2.3.7, un seul chiffre non nul par taux — soit 50 % avec un chiffre
PAIR (50 et 2, 4, 6, 8), soit 5 % avec un multiple PAIR de dix (5 et 20, 40,
60, 80), soit DEUX multiples de dix, qui conviennent toujours. 25 paires en
tout, comptées et non devinées. D'où une LISTE construite une fois pour toutes
plutôt qu'un do/while : un rejet en boucle sur un vivier aussi maigre ne dit
jamais combien de paires il reste. Et les questions d'une séance portent des
paires DISTINCTES — sur un vivier fini, deux fois le même calcul dans la même
séance se verrait.
**LES DEUX FAMILLES SONT NÉCESSAIRES, et le contrôle les exige** : sans la
mixte (50 % puis 2 %), plus aucune pose « trois chiffres × deux » ; sans les
deux multiples de dix (20 % puis 30 %), l'un des deux taux serait TOUJOURS 5 %
ou 50 %, et l'élève apprendrait le motif au lieu du calcul.
**UN GARDE-FOU A ÉTÉ RETIRÉ AVEC SA RAISON** : « au moins une retenue dans la
pose » écartait, sur ce vivier-là, exactement les paires les plus parlantes —
10 % puis 10 % fait 21 %, et non 20 % — et ne laissait des deux multiples de
dix que ceux dont la hausse globale dépasse 100 %. {mult-dec-un}, d'où
`buildPoseU()` est extraite, n'a jamais eu cette garde ; le décalage, l'autre
enjeu de la pose, reste partout. Sonde sur 20 000 tirages : 68 % de poses
2×2, 32 % de 3×2, 48 % sans aucune retenue, 23 hausses globales différentes
de 21 % à 98 %.
**LA HAUSSE GLOBALE RESTE SOUS 100 %**, comme avant : le tirage d'alors
plafonnait à +107,1 % (90 % puis 9 %), et sans cette borne deux multiples de
dix monteraient à +261 % (90 % puis 90 %) — aucune scène de `BS_CTX` ne porte
une hausse pareille.
**ET LA HAUSSE EST RANGÉE EN MILLIÈMES, l'unité d'avant** : c'est ce qui rend
la bascule sûre. La correction la relit sur 10 pour le pourcentage et sur 1000
pour l'écriture décimale de l'étape ④, si bien qu'aucune ligne de
`checkHSAnswer` ne bouge — et un brouillon de pause d'avant la bascule se
reprend sans rien savoir de la nouvelle liste.
**Le rappel de cours a suivi**, parce qu'un rappel qui montre un tirage
impossible apprend la méthode sur un cas que l'élève ne rencontrera jamais :
il montre maintenant +20 % puis +30 % = +56 %, un cas réellement tiré, et dont
l'écart avec 50 saute aux yeux mieux que celui de 45,6 avec 44.
Le contrôle REFAIT la liste par sa propre arithmétique — sur les pourcentages
bruts là où la page passe par les fractions réduites —, exige les deux
familles, relit la hausse en millièmes, vérifie que le bas de la pose reste un
1 suivi de zéros et d'un chiffre (la seule forme que `poseUDonnees` sache
écrire), puis CLIQUE « Vérifier » sur une copie juste. Neuf sabotages, chacun
rougissant en nommant son défaut.
**Deux hausses de suite, en PARTANT DE 100 : la même question, l'autre chemin.**
{hausses-successives-cent} (Première, 2.2.8, demande de Turquet, septembre 2026,
repris de la fiche « 2 augmentations — méthode 2 ») suit {hausses-successives}
au menu. Au lieu de multiplier deux coefficients, on CHOISIT une valeur de
départ — et on prend **100**, parce que « ce qu'on a gagné pour 100 » EST le
pourcentage : il n'y a plus rien à relire à la fin, le nombre cherché est écrit
sur l'écran.
**Tout est repris, rien n'est recopié** : les énoncés sont ceux du 2.2.7
(`HS_ENONCES` et `BS_CTX`, PARTAGÉS — deux listes auraient fini par diverger, et
deux exercices voisins auraient posé la même question dans des mots
différents), et chaque hausse se calcule comme dans {augmenter-addition} — la
fraction, le produit, l'écriture décimale, puis l'addition « départ +
augmentation ». Ce n'est donc pas une méthode de plus : c'est le 2.2.2 fait DEUX
FOIS, la seconde sur la valeur déjà augmentée, et c'est exactement ce que la
fiche veut faire voir.
**LA CONTRAINTE DE TURQUET N'EST PAS COSMÉTIQUE — c'est elle qui fait tomber
toute la chaîne sur des ENTIERS.** Il ne veut que des pourcentages dont le
coefficient global a 1 ou 2 chiffres après la virgule (« exemple :
1,02 × 1,50 »). Cette contrainte ÉQUIVAUT à « P1 × P2 divisible par 100 » —
(100+P1)(100+P2) = 10000 + 100(P1+P2) + P1×P2, donc le produit est divisible par
100 si et seulement si P1×P2 l'est — et la sonde l'a vérifié sur les 99 × 99
couples : aucun désaccord entre les deux écritures. Or la seconde hausse vaut
(100+P1)×P2/100, entière exactement quand P1 × P2 l'est : un élève qui suit la
fiche n'écrit jamais une décimale, ni à la hausse, ni à l'addition, ni au bilan.
Le contrôle refait la propriété par une SECONDE arithmétique, qui n'a rien en
commun avec celle de la page : il COMPTE les chiffres après la virgule (quatre,
moins les zéros de fin du produit) là où la page décide par deux divisibilités.
**Les deux gardes du tirage sont VIVANTS, et le contrôle le démontre plutôt que
de le supposer** : le couple de la fiche ELLE-MÊME (90 % puis 4 %) est REFUSÉ —
son coefficient a trois décimales —, et 25 % puis 60 % aussi, le seul couple qui
donne 2 tout rond quand Turquet a écrit « 1 ou 2 chiffres après la virgule ». Il
reste 114 couples, et la hausse globale DÉPASSE toujours la somme des deux taux
(l'écart vaut P1 × P2 / 100, donc au moins 1) : la leçon du 2.2.7 tient ici
aussi, et le message la nomme.
**Le multiplicande de l'étape ③ est une CASE, et c'est le seul écart avec la
fiche.** Sur le papier, le professeur écrit « on calcule la hausse pour 190
Watts » : le nombre est donné, parce que la feuille est un exemple traité. Ici
l'élève vient de le trouver à l'étape ②, et l'écrire reviendrait à ranger la
réponse d'une étape à côté de la suivante — dire soi-même que la seconde hausse
porte sur la valeur DÉJÀ augmentée EST la leçon de l'exercice. C'est ce que fait
déjà le 2.2.7, dont l'étape ② redemande les deux coefficients de l'étape ①, et
le contrôle tient le bord : une copie qui refait la seconde hausse sur 100 est
refusée en le nommant.
**L'ORDRE DE L'ADDITION EST LIBRE**, et la règle des paires d'{antecedent-nombre}
le tient : elle est commutative, et refuser « 90 + 100 » apprendrait l'inverse de
ce qu'on enseigne. Chaque case se juge donc sur ce qu'elle PROMET, et la liste
des deux valeurs attendues les prend UNE FOIS CHACUNE — « 100 + 100 » est
défendable une fois, faux la seconde. Sans cela une case juste rougirait parce
que sa jumelle est fausse, le défaut signalé trois fois sur {somme-fractions}.
Le MÊME juge sert la frappe et la vérification : deux verdicts auraient fini par
se contredire sous les yeux de l'élève. Et « reste » porte ce qu'aucune case n'a
pris, si bien que la correction en vert respecte l'ordre déjà choisi.
**Pas de pose en colonnes, contrairement au 2.2.2** : la fiche n'en a pas, et
avec ce tirage les deux additions tombent sur des entiers à trois chiffres.
L'écran porte déjà vingt et une cases, et le bouton « Tables de multiplication »
y est comme partout — le dire vaut mieux que de le taire, c'est un arbitrage, pas
un oubli.
La bonne réponse n'est jamais rangée à côté de la question : elle ne porte que
P1, P2, le contexte et la variante — le contrôle refuse tout autre champ — et
`hscAns()`, que l'énoncé, le rendu, la correction, le message et le contexte
envoyé au modèle lisent tous, recalcule le reste. Dix-sept sabotages, chacun
rougissant en nommant son défaut — et deux ont d'abord raté leur cible : celui
de la séance qui tire AVEC remise est resté VERT à bon droit (sur 114 couples,
trois tirages ne se heurtent que 2,6 fois sur 100, et un contrôle qui ne rougit
qu'une fois sur trois parle d'autre chose — il demande donc le vivier ENTIER,
qui doit sortir en entier, chaque couple une fois), et celui de l'ordre imposé
visait une fonction qui n'existe pas : il cassait le code au lieu de mesurer, et
un sabotage qui casse la syntaxe ne dit rien du contrôle visé.
**Et la NUMÉROTATION a bougé avec lui**, comme toujours : {synthese-augmentations}
passe en 2.2.9 et {synthese-augmentations-libre} en 2.2.10. Les références
écrites `{identifiant}` ont suivi d'elles-mêmes ; les numéros ÉCRITS du banc — la
liste des démarreurs du contrôle d'EVOL_NB, les libellés et les messages qui
nomment ces deux exercices — ne se recalculent pas, et ont été repris à la main
le jour même. Un contrôle qui s'affiche sous le nom d'un autre est pire qu'un
contrôle sans nom.

**Puis le VIVIER est devenu celui du 2.2.7, partagé et non recopié.** Demande de
Turquet (septembre 2026) : « pour le 2.2.8 il faut les mêmes règles pour le choix
des pourcentages que dans le 2.2.7 ». Les deux exercices posent LA MÊME question
par deux chemins, et ils tiraient dans deux listes différentes : le 2.2.7 dans
ses paires (un seul chiffre non nul par taux), le 2.2.8 dans les 114 couples
que ses propres gardes laissaient passer. Le paragraphe ci-dessus raconte
l'exercice avec les nombres de son époque — 25 % puis 4 % était un tirage
possible, il ne l'est plus.
**C'est l'argument des énoncés, mot pour mot** : deux listes auraient fini par
diverger, et c'est exactement ce que la demande interdit. Le 2.2.8 lit donc
`HS_PAIRES` — la liste du 2.2.7 — sans en écrire une seconde, comme il lit déjà
`HS_ENONCES` et `BS_CTX`, et l'ORDRE de la paire est tiré comme là-bas : rien ne
dit lequel des deux taux vient d'abord, et ici l'ordre change le CHEMIN sans
changer la réponse (100 → 102 → 153 d'un côté, 100 → 150 → 153 de l'autre). La
séance tire sans remise sur la PAIRE et non sur le couple ordonné : l'ordre ne
fait pas une question de plus, c'est le même calcul.
**Le vivier rétrécit, et c'est le prix assumé de l'accord** : 25 paires au lieu
de 59, soit 50 couples au lieu de 114 — 34 paires perdues, toutes celles dont
un taux porte deux chiffres non nuls (4 % puis 25 %, 15 % puis 20 %…). Trois
questions par séance y puisent largement ; la sonde relève 17 paires de deux
multiples de dix et 8 mixtes, 23 hausses globales différentes de 21 % à 98 %, et
198 pour plus grand nombre que l'élève ait à écrire.
**LA RESTRICTION DES TAUX VIENT DE LA POSE DU 2.2.7, qui n'existe pas ici** :
son numérateur doit garder la forme 1X ou 10X, la seule que `poseUDonnees` sache
écrire en bas. Elle est donc SUBIE et non nécessaire — mais les deux exercices
doivent tirer les mêmes nombres, et c'est la règle du 2.2.7 qui fait foi. Le
dire vaut mieux que de le taire.
**DEUX GARDES SONT DEVENUS INERTES, ET RETIRÉS AVEC LEUR RAISON** — les
douzième et treizième du projet. Ils ne sont pas nés morts : ils écartaient
vraiment quelque chose sur l'ancien vivier de 114 couples, et c'est le vivier
rétréci qui les prive de tout emploi. La hausse globale de `HS_PAIRES` est
STRICTEMENT sous 100 %, donc le coefficient global est strictement entre 1 et 2 :
il n'est JAMAIS entier, et le garde « pas 0 décimale » — celui qui écartait
25/60 et 60/25, et que le paragraphe ci-dessus déclarait vivant — n'a plus rien
à écarter ; le plafond `HSC_HMAX` non plus. Un garde-fou qui n'écarte jamais rien
fait croire qu'on vérifie quelque chose : c'est le CONTRÔLE qui exige les deux
propriétés sur le tirage.
**Et le contrôle mesure le vivier que la page TIRE, jamais une constante qu'elle
nommerait** : `hscSeance` tirant sans remise, une séance de la taille du vivier
le rend en entier — un filtre resserré en douce se voit alors comme une paire
manquante, une règle relâchée comme une paire de trop, et la seconde
arithmétique du 2.2.7 (les pourcentages bruts là où la page passe par les
fractions réduites) dit laquelle. Quatre couples sont épinglés, un par règle :
90 % puis 4 % (le couple de la fiche, trois décimales), 25 % puis 4 % (deux
chiffres non nuls — le seul des quatre que l'ancien vivier acceptait), 25 % puis
60 % (coefficient 2 tout rond) et 50 % puis 50 % (hausse globale de 125 %). Un
second contrôle tient le PARTAGE lui-même : les deux portes du tirage lisent
`HS_PAIRES`, et aucun vivier propre ne revient sous son ancien nom — cherché
comme une DÉFINITION et jamais comme un nom nu, le commentaire de la page ayant
le droit de nommer les deux gardes qu'il vient de retirer.
**ET LE RAPPEL DE COURS MONTRAIT UN TIRAGE DEVENU IMPOSSIBLE** : « gagner 20 %
puis 25 % », que le nouveau vivier ne rend jamais — un rappel qui enseigne la
méthode sur un cas que l'élève ne rencontrera pas, la leçon du 2.3.7 retombée
telle quelle. Il montre maintenant 20 % puis 30 %, c'est-à-dire l'exemple MÊME
du rappel du 2.2.7 : les deux méthodes trouvent 56 % sur les mêmes nombres, ce
qui est précisément ce que l'exercice veut faire voir. **Aucun contrôle ne le
disait, et c'est le contrôle qui manquait** : il lit les DEUX rappels, exige que
chaque « X % puis Y % » soit tirable, et pour le 2.2.8 que la chaîne écrite soit
celle que `hscAns` calcule — un rappel dont les pourcentages changent sans que
son arithmétique suive ferait mentir l'écran. Sept sabotages, chacun rougissant
en nommant son défaut.

**Puis les libellés ① et ③ ont dit SUR QUOI on calcule.** Demande de Turquet
(septembre 2026) : « le n°1 en dessous de l'énoncé doit afficher : on calcule
d'abord …% de 100 ; le n°3 doit afficher : on calcule …% du résultat
précédent. » Ils disaient jusque-là « La hausse pour 100, et le résultat pour
une hausse de 20 % » et « La hausse pour la valeur que tu viens de trouver,
et le résultat pour une hausse de 30 % » — une phrase qui nomme d'abord ce
qu'on cherche et seulement ensuite le taux, quand l'élève, lui, lit sa ligne
de gauche à droite : le pourcentage, puis ce sur quoi il porte.
**CE N'EST PAS UN HABILLAGE — c'est LA leçon de l'exercice**, celle que le
message de correction nomme déjà en toutes lettres : la seconde hausse ne
porte PAS sur 100, et un libellé qui le laisserait croire enseignerait
l'erreur même que l'exercice combat. Le gras est resté sur la BASE du calcul
(**100**, puis le **résultat précédent**) : c'est le seul mot qui change d'une
étape à l'autre. Le renvoi à {augmenter-addition} est GARDÉ sur le ① — il dit
d'où vient la méthode, et il est écrit `{identifiant}`, donc il suit une
renumérotation.
**Le bord qui compte est le libellé FIGÉ**, et c'est le plus sournois : un
pourcentage écrit en dur nommerait un taux que la question ne porte pas, sans
qu'aucune correction ne bronche — la leçon du numéro d'exercice de `show()`,
transposée. Le contrôle rend donc DEUX questions ÉPINGLÉES aux taux ÉCHANGÉS
(2 % puis 50 %, puis l'inverse) et exige que les deux libellés suivent ; il
refuse en plus que le ③ écrive « % de 100 ». Cinq sabotages, chacun rougissant
en nommant son défaut — le taux de ① figé, le ③ ramené sur 100, le ③ qui
nomme le taux de la PREMIÈRE hausse, le mot « d'abord » retiré, et le ① qui ne
dit plus sur quoi on calcule.

**Deux baisses ne s'additionnent pas.** L'exercice 2.3.7 est là pour ça :
−20 % puis −40 % fait −52 %, pas −60 %, parce que la seconde baisse porte sur
la valeur DÉJÀ baissée. Son énoncé ne donne aucune valeur de départ (décision
de Turquet, août 2026) : le résultat n'en dépend pas, et un nombre inutile posé
là inviterait à le faire entrer dans le calcul.
**Le COEFFICIENT de chaque baisse n'a qu'un seul chiffre différent de zéro, et
c'est un dixième** — 1 − 0,20 = 0,8 (décision de Turquet, août 2026). Les deux
baisses sont donc des multiples de dix, et les numérateurs sont deux chiffres
seuls. **Il n'y a plus de multiplication posée** : 8 × 6 est un fait de table,
et la case de retenue que `buildPose()` dessinerait au-dessus d'un chiffre seul
ne voudrait rien dire — le bouton « Tables de multiplication » est sur l'écran,
il suffit. On écarte 90 % (coefficient 0,1) : multiplier par 1 n'est pas un
calcul. La baisse globale tombe alors toujours sur un nombre ENTIER de pourcent,
et `baisseNum` porte ce pourcentage lui-même : la première version comptait en
dixièmes (424 pour 42,4 %) et changer l'un sans l'autre a fait rougir quatre
cases à la première exécution.
Chaque coefficient s'écrit en trois temps — `1 − 20/100 = 1 − 0,20 = 0,8` — et
la vérification finale en trois temps aussi : `1 − 52/100 = 1 − 0,52 = 0,48`
(décision de Turquet, août 2026). Le passage par l'écriture décimale du
pourcentage est l'étape que l'élève saute, et c'est celle qui fait écrire 0,2 au
lieu de 0,20 quand la baisse est de 20 %.
Le piège d'à côté a mordu : `v()` était déclarée APRÈS le bloc « live », si bien
que la coloration en direct la touchait dans sa zone morte et que le mode
soutien plantait à la première frappe. Une déclaration de commodité se met en
tête de fonction, pas au milieu.

**Et la règle du coefficient global y était DÉJÀ vraie — mais tenue par rien.**
« fais la même chose pour le 2.3.7 » (Turquet, septembre 2026), après la règle
posée sur le 2.2.7. La sonde a MESURÉ avant qu'on ne touche à quoi que ce soit :
sur 50 000 tirages, jamais plus de deux décimales au coefficient global, jamais
une baisse globale non entière. C'est une conséquence de la décision d'août 2026
— un seul chiffre non nul par baisse, et c'est un dixième : les deux numérateurs
sont des chiffres seuls, leur produit est un entier de deux chiffres, et il se
lit sur 100.
**UNE PROPRIÉTÉ HEUREUSE N'EST PAS UNE PROPRIÉTÉ TENUE.** Rien ne l'exigeait :
un taux à un chiffre remis dans le tirage — ce que l'exercice faisait AVANT août
2026 — rendrait 0,96 × 0,6 = 0,576 sans qu'aucun contrôle ne rougisse. Le
contrôle refait donc la propriété par une SECONDE arithmétique, sur les
pourcentages bruts là où la page passe par les numérateurs réduits :
(100−P1)(100−P2) doit être divisible par 100. Il tient aussi la baisse ENTIÈRE
(c'est elle que l'élève écrit à l'étape ③), le piège de l'exercice (la baisse
globale reste INFÉRIEURE à la somme des deux taux), les taux multiples de dix,
et il CLIQUE « Vérifier » sur une copie juste.
**Le rappel de cours n'a rien eu à changer** — il montrait déjà 20 % puis 40 %,
un tirage réellement possible —, mais DEUX commentaires du code racontaient
encore l'exercice d'avant : l'en-tête (« −40 % puis −4 % fait −42,4 % », un
tirage devenu impossible) et celui de `fracDec`, qui justifiait sa tolérance par
une baisse décimale. La tolérance, elle, RESTE utile : la baisse est entière,
mais l'élève garde le droit d'écrire 5,2/10 pour 52/100, et `fracEqual` lirait
« 5,2 » comme 5.
**UN SABOTAGE EST RESTÉ VERT EN DISANT VRAI, et il a montré un garde non
tenu** : retirer « un produit d'au moins deux chiffres » ne change RIEN aux
décimales — 0,06 en a deux — et le contrôle passait à bon droit. Ce que ce
garde protège n'est pas l'écriture mais la TAILLE : sans lui, 0,2 × 0,3 = 0,06
ferait une baisse globale de 94 %, un prix divisé par seize qu'aucune scène de
`BS_CTX` ne porte. Le contrôle exige donc aussi que la baisse globale reste au
plus 90 %, et la justification écrite dans la page — qui parlait de décimales —
a été corrigée avec lui. Six sabotages, chacun rougissant en nommant son
défaut ; le sixième seulement après que le contrôle a gagné ce bord.

**Puis la MÉCANIQUE du choix a rejoint celle du 2.2.7 — et le vivier n'a pas
bougé d'une paire.** « fais la même chose pour le 2.3.7 » (Turquet, septembre
2026), cette fois après le vivier PARTAGÉ du 2.2.8. La sonde a d'abord mesuré,
et elle a tranché la question que la demande posait : **les critères du 2.2.7
étaient déjà tenus ici** — un seul chiffre non nul, le produit des taux
multiple de 100, la baisse globale entière, le plafond —, et ce qui manquait
était la FAÇON de tirer. Le do/while est devenu une LISTE (`BS_TAUX`,
`bsCoef`, `BS_PAIRES`, écrits comme au 2.2.7 pour que les deux exercices se
lisent côte à côte) et la séance la tire SANS REMISE : rien n'empêchait deux
fois le même calcul dans la même séance — **une séance sur dix, mesurée**.
**LE VIVIER EST LE MÊME À LA PAIRE PRÈS** (32, taux de 10 à 80, baisses de 19
à 90 %), vérifié avant/après : c'est ce qui rend la bascule sûre, et un
brouillon de pause d'avant se reprend sans rien savoir de la liste.
**ADOPTER LE VIVIER DU 2.2.7 AURAIT ÉTÉ AUTRE CHOSE, et le dire vaut mieux que
de le taire** : `HS_TAUX` admet les taux à UN chiffre, dont le coefficient de
baisse porte trois chiffres (5 % → 95/100). Les 8 paires que cela ajouterait
(2/50, 4/50, 5/20, 5/40, 5/60, 5/80, 6/50, 8/50) réclament toutes une
multiplication POSÉE — 95 × 8 n'est pas un fait de table — c'est-à-dire
exactement ce que la décision d'août 2026 a retiré de cet exercice. Le 2.2.7,
lui, a sa pose. La restriction des taux du 2.3.7 vient donc de son COEFFICIENT,
celle du 2.2.7 de sa POSE : les deux règles ne sont pas la même, et le
`for(a=10;a<=80;a+=10)` du contrôle est l'endroit qu'il faudrait rouvrir pour
changer d'avis.
**LE FILTRE (P1·P2) MULTIPLE DE 100 N'EST PAS ÉCRIT DANS LA PAGE** : les deux
taux étant des multiples de dix, il n'écarterait jamais rien — un garde-fou qui
n'écarte jamais rien fait croire qu'on vérifie quelque chose. C'est le CONTRÔLE
qui exige la propriété, par une seconde arithmétique sur les pourcentages bruts
là où la page passe par les numérateurs en dixièmes. Celui du produit à deux
chiffres, lui, est VIVANT : il retire 4 paires des 36 (80/80, 80/70, 80/60,
70/70), et le contrôle pin ces quatre-là dans sa PROPRE arithmétique, sans quoi
son bord pourrait glisser en silence.
**Le contrôle mesure le vivier que la page TIRE, jamais la constante qu'elle
nomme** (le motif du 2.2.8) : `genBaisses` tirant sans remise, une séance de la
taille du vivier le rend en entier — un filtre resserré en douce se voit comme
une paire manquante, une règle relâchée comme une paire de trop. Et il mesure
le DÉMARREUR en plus du tirage (la leçon du 2.15) — **en rendant le hasard
MUET**, `pick` prenant toujours le premier : trois tirages indépendants ne se
heurtent qu'une séance sur dix, et un contrôle qui ne rougit qu'une fois sur
dix parle d'autre chose ; le vrai `pick` est rendu en sortant, le piège
documenté du double volé au voisin.
Neuf sabotages, sept rougissant en nommant leur défaut — et **les deux verts
disaient vrai**. Le premier a montré que « 90 % n'est pas dans la liste » est
REDONDANT : toute paire qui le porterait a un produit de numérateurs au plus
égal à 9, donc le garde du plafond l'écarte déjà — la propriété est tenue une
opérande plus loin, comme la moitié `e===anc ||` du garde de l'ancre. Le second
visait `baisseNum`, dont l'écriture générique (`100 − prodNum × 100 / prodDen`)
est identique à l'ancienne tant que `prodDen` vaut 100 ; elle est gardée parce
qu'elle est la plus sûre de deux écritures équivalentes — sous le sabotage qui
change `bsCoef`, c'est elle qui tient encore. Deux sabotages ont d'abord raté
leur cible, sur une ancre que le 2.2.7 partage au caractère près (la ligne de
l'ordre tiré, celle de la clef de la paire) : un sabotage se pose sur une ancre
PROPRE à sa cible, la leçon d'{antecedents-droite}, retombée deux fois dans le
même fichier.

**Et au 2.5.1, la règle ne porte plus que sur UN coefficient — vraie elle
aussi, tenue par rien elle aussi.** « fais la même chose pour le 2.5.1 »
(Turquet, septembre 2026), après le 2.2.7, le 2.3.7 et le 2.2.8. La synthèse
ne pose qu'UNE transformation par question : son « coefficient global » est le
coefficient tout court, 1 ± P/100 pour une évolution, P/100 pour « prendre ».
**LA SONDE A MESURÉ AVANT QU'ON NE TOUCHE À QUOI QUE CE SOIT** : 900 tirages
passés par les TROIS portes du générateur et par les trois inconnues, chacun
relu sur ses QUATRE propositions — aucun coefficient à plus de deux décimales,
aucune valeur de la chaîne qui ne soit entière. **Rien à changer au tirage,
donc** : la propriété tient par le choix des taux (un seul chiffre non nul :
un multiple de dix, ou un chiffre ; « prendre P % » puise dans `PCT_PCTS`, qui
n'a que des multiples de dix) et par une valeur de départ multiple de 100. Ce
qui manquait est le CONTRÔLE.
**Le contrôle d'à côté serait resté vert**, et c'est ce qui rend celui-ci
nécessaire : « générateur genSyn : 8000 questions conformes » n'exige que
l'ENTIER — or 12,5 % de 800 font 100, un entier parfait, avec un coefficient
1,125 à trois décimales. Une propriété heureuse n'est pas une propriété tenue,
la leçon du 2.3.7 retombée telle quelle.
**Il refait la propriété par une SECONDE arithmétique** — en centièmes ENTIERS
là où la page divise par 100 — et la relit une TROISIÈME fois sur l'écriture
que la page PRODUIT (`synCouple().coefDec`), puis une QUATRIÈME sur ce que la
CORRECTION écrit à l'élève : après un vrai clic sur « Vérifier », la phrase
« car 1 + 7/100 = 1,07 = 107/100, puis… » ne doit porter aucun nombre à plus
de deux décimales. C'est là que l'élève LIT le coefficient.
**Et il passe par les TROIS portes du tirage**, la libre et les deux
imposées : `genSyn` sert six exercices — le 2.5.1, le 2.2.9, le 2.3.8 et les
rédigées 2.2.10, 2.3.9 et 2.5.2 —, et un `famVoulu` ignoré poserait des
hausses sous un titre de baisses.
**AUCUN GARDE N'EST POSÉ DANS LA PAGE** : il n'écarterait jamais rien, et
ferait croire qu'on vérifie quelque chose. La raison, elle, est ÉCRITE là où
le tirage la tient — sans quoi le prochain taux ajouté la romprait sans que
rien ne le dise.
**Un essai s'est pris en défaut AVANT la page** : « la valeur de départ est un
multiple de 100 » est vrai du TIRAGE et faux des PROPOSITIONS — les leurres de
la valeur initiale valent 70, 50, 90…, et la chaîne y tombe juste quand même,
le taux étant alors un multiple de dix. Le contrôle mesure donc la propriété
qui compte (P × N tombe sur un entier de centièmes), pas celle qu'on croyait :
un essai faux se reconnaît à ce qu'il rougit sur une page juste.
**Et DEUX sabotages ont appris quelque chose de plus.** L'un s'est montré
INTERMITTENT, ce qui ne se devinait pas : faire écrire à la correction le
coefficient divisé par 300 ne produit une longue décimale que deux fois sur
trois — 105/300 fait 0,35 tout rond, et le contrôle restait vert à bon droit.
Un sabotage qui n'atteint sa cible qu'une fois sur deux ne dit rien du contrôle
visé, exactement comme un sabotage posé sur une ancre partagée ; divisé par
1000, il rougit à tous les coups. L'autre est resté VERT en disant vrai :
retirer les taux à un chiffre du TIRAGE ne prive le contrôle de rien, parce que
les LEURRES de « retrouve le pourcentage » en offrent encore — et c'est exact,
l'élève vérifie la proposition qu'il a choisie, donc un coefficient à deux
décimales lui reste sous les yeux. Retirés des deux côtés, le bord « le
contrôle ne mesure qu'une seule forme » rougit. Dix sabotages en tout, neuf
rougissant en nommant leur défaut.

**Et au 2.1.3, la règle est vraie plus largement qu'elle ne demande.**
« fais la même chose pour le 2.1.3 » (Turquet, septembre 2026), après le
2.2.7, le 2.3.7, le 2.2.8 et le 2.5.1. « Prendre P % », c'est multiplier par
P/100 : voilà le coefficient de cet exercice-là.
**LA SONDE A MESURÉ AVANT QU'ON NE TOUCHE À QUOI QUE CE SOIT** : sur 20 000
tirages de `genPercent`, le coefficient a TOUJOURS une seule décimale, et tout
ce qui vient après lui — le produit de l'étape ②, le résultat de l'étape ③ —
est ENTIER. **Rien à changer au tirage, donc**, et le 2.1.3 n'écrit d'ailleurs
jamais son coefficient en décimal : l'étape ① l'écrit en FRACTION, et ce que
l'élève écrit en décimal est le résultat, qui n'a aucune décimale.
**CE QUI LA TIENT EST QUE LE TAUX EST UN ENTIER DE POURCENT**, et c'est la
seule chose qui puisse la rompre. 12,5 % — un taux d'école, 1/8 — donnerait
0,125, trois décimales, et **passerait tous les gardes de la page** : 12,5 × 80
fait 1000, donc un résultat parfaitement entier, et le contrôle voisin
(« générateur genPercent : 5000 questions conformes ») n'exige que l'ENTIER —
il serait resté vert. Une propriété heureuse n'est pas une propriété tenue, la
leçon du 2.3.7 et du 2.5.1 retombée telle quelle.
**AUCUN GARDE N'EST POSÉ DANS LA PAGE** : P est entier par construction, un
garde n'écarterait jamais rien. La raison est ÉCRITE là où le tirage la tient —
à côté de `PCT_PCTS`, dans le bloc même qui invite à élargir la plage — et
c'est le contrôle qui EXIGE la propriété, sur le VIVIER (tout taux est un
entier de pourcent, toute valeur est entière) comme sur chaque tirage, par une
seconde arithmétique en entiers là où la page divise par 100. Le vivier étant
partagé — le 2.1.2, le 2.1.4, le 2.1.5 et les deux évolutions y puisent
aussi —, l'exiger sur le vivier les tient a fortiori.
**ET LA MOITIÉ « P × N divisible par 100 » DE `pctCoupleOk` N'ÉCARTE RIEN** :
mesuré exhaustivement, 162 couples possibles, 104 retenus, 58 écartés par
`PCT_MAXPROD` et ZÉRO par cette divisibilité — les deux viviers n'ayant que des
multiples de dix, le produit est toujours un multiple de 100. Elle RESTE, et le
dire vaut mieux que de le taire : elle est exactement le filtre qui tiendrait
l'intégralité le jour où `PCT_VALEURS` s'ouvrirait (15 y ferait écarter 30 %
mais pas 20 %), et la propriété, elle, est désormais exigée par le banc. Le
sabotage le démontre plutôt que de le supposer : la retirer laisse le contrôle
vert, à bon droit ; la retirer ET ouvrir `PCT_VALEURS` le fait rougir.
**Et le contrôle lit une TROISIÈME fois, sur ce que la PAGE écrit** : la copie
juste est cliquée sur la question du RAPPEL de cours — prise au vrai générateur,
parce qu'un rappel qui enseigne la méthode sur un cas impossible est la leçon du
2.2.8 — puis une copie fausse, et la phrase de correction (« Réponse : 30/100 ×
40 = 1200/100 = 12 ») ne doit porter aucun nombre à virgule : c'est le seul
endroit où l'élève LIT le résultat en décimal.
Dix sabotages, neuf rougissant en nommant leur défaut ; le dixième est celui de
la moitié inerte ci-dessus, vert à bon droit. **Et un onzième n'a rien pu dire** :
réduire `PCT_PCTS` à un seul taux FIGE la page — deux générateurs voisins bouclent
sur « au moins quatre pourcentages admissibles » — et un sabotage qui fige la page
ne dit rien du contrôle visé, comme celui qui en casse la syntaxe. Rejoué à quatre
taux, sous le seuil du garde, il rougit (« le vivier des pourcentages est vide, le
contrôle ne mesure rien »).

---

## Le thème entier porté en Seconde (septembre 2026)

**« Je veux que tous les thèmes des pourcentages en Première soient copiés en
Seconde »** (demande de Turquet, septembre 2026). Les trente et un exercices du
thème 2 de la Première — ses cinq sous-thèmes, dans le même ordre — sont
devenus le thème 3 de la Seconde, qui n'en avait que trois (prendre, augmenter,
diminuer), trois copies anciennes de ceux de la Première. Ces trois-là ont été
REMPLACÉS par le moteur de la Première, pas doublés : mêmes identifiants, donc
les notes et les devoirs déjà posés en Seconde les retrouvent ; seuls leurs
numéros changent (3.1 → 3.1.3, 3.2 → 3.2.1, 3.3 → 3.3.1), et c'est la règle —
une note porte l'IDENTIFIANT, jamais le numéro. Une pause prise avant le
portage se reprend : ses questions n'ont ni variante ni contexte, et
`variante()` retombe déjà sur la première tournure (« q.v absent : anciennes
pauses »).

**Le portage est fait par un script, par PLAGES de lignes, jamais par un filtre
sur `function`/`const`** (la leçon du portage depuis la Terminale, dans
`12-seances-et-branchements.md`) : le moteur de la Première, d'un bloc, puis
les branchements un par un — `TESTS`, `THEMES`, les écrans, la réserve du bas,
`show()`, `liveCheckCurrent()`, `afficherEcranDe()`, la reprise, les rappels,
les questions à l'IA, le contexte du modèle et la liste des rendus enveloppés.
Chaque ancre doit exister exactement une fois, sans quoi le script s'arrête :
un remplacement qui ne trouve rien ne casse rien, et c'est ce qui le rend
dangereux.

**Deux collisions de noms, qu'aucune erreur n'aurait signalées.** La Seconde
avait déjà un moteur « syn » — la synthèse des FONCTIONS — et une
`nextSynQuestion()`. Le moteur des synthèses de pourcentages s'appelle donc
« psyn » en Seconde (et `nextPsynQuestion`, `RAP_PSYN`) : garder « syn » aurait
envoyé la reprise d'une synthèse de fonctions sur l'écran des pourcentages, et
la seconde `function nextSynQuestion` aurait silencieusement remplacé la
première — la synthèse des fonctions aurait avancé en appelant le rendu des
pourcentages. Le contexte des synthèses envoyé au modèle, leurs rappels et
leurs questions suivent le nouveau nom.

**Ce qui diffère volontairement de la Première, et pourquoi.**
* *La rangée d'aide.* La Seconde met ses boutons d'aide dans la rangée
  « …Actions » (`conseilInlineBtn()`), la Première les pose APRÈS le rendu dans
  une `.ia-row` (`iaBoutons()`). Les écrans portés gardent la manière de la
  Première — leurs vérifications réécrivent la rangée « …Actions » —, et
  l'`iaBoutons()` de la Seconde remplit la `.ia-row` avec les boutons de la
  Seconde. `soutienAgain()` ne rajoute pas ses boutons quand l'écran a déjà sa
  rangée : sinon l'aide s'affichait deux fois au premier « Presque ! ».
* *« Recommencer ».* La Seconde relance l'exercice du menu (`currentTestId`) ;
  les moteurs de pourcentages sont PARTAGÉS (un moteur, plusieurs identifiants)
  et se relancent comme en Première, par `test.kind` et `test.qId`
  (`restartPct()`). Les contrôles de la Première l'ont exigé au premier
  passage : ils posent une sentinelle dans `currentTestId`, précisément pour
  qu'une identité qui ne tiendrait que par inertie se voie.
* *Les références à des exercices absents.* Trois textes citaient
  {mult-dec-un} et {mult-decimaux}, que la Seconde n'a pas : `numeros()` laisse
  un identifiant inconnu tel quel, l'élève aurait LU les accolades. Les
  libellés disent la chose au lieu de la citer (« en posant la
  multiplication », « en fractions décimales ») ; le script refuse d'écrire la
  page s'il en reste une.
* *La police des tablettes.* Les règles de la Première écrivent
  `calc(1.9rem * var(--tab-nb,1))` ; la Seconde n'a pas `--tab-nb`, les tailles
  sont portées nues.
* *`liveColorFrac()`* a pris la version de la Première : un numérateur seul s'y
  juge sur sa PROMESSE (le « 4 » qui rougissait sous le doigt de l'élève). Elle
  sert aussi les fractions de la Seconde, qui en bénéficient.
* *`enregistrerResultat()`* : l'entonnoir des notes de la Première, écrit dans
  `resultats_2nde` ; le verrou du rejeu y est doublé par celui que la Seconde
  pose déjà sur le client.

**Les contrôles de la Première se sont allumés d'eux-mêmes sur la Seconde** :
ils détectent le moteur (`typeof startPctSynthese==='function'`…), pas le
niveau. Le profil de la Seconde déclare ce que la Première déclare — les
dispenses du soutien en direct (« psl », « sal », « ac »), le nombre de
questions (4, 3, 3), les moteurs dont le contexte envoyé au modèle est mesuré —,
et quinze contrôles du thème Python, qui prenaient « pourcentage » = 3.1 pour
témoin d'une numérotation inchangée, attendent désormais 3.1.3 : le numéro a
changé parce que le thème a changé, pas parce qu'un exercice ajouté l'aurait
bousculé.

**Une troisième méthode, Première seulement : passer par 10 %.**
{pourcentage-dix} (2.1.8, demande de Turquet, septembre 2026, à partir d'une
fiche de cours qui calcule 10 % de 300 €, 32 € et 4 € en divisant par 10) est
un TWIN de {pourcentage}, comme {pourcentage-colonnes} l'est déjà par les
colonnes : `genPct10()` appelle `genPercent()` sans rien recopier — même
tirage P/N (PCT_PCTS, PCT_VALEURS, `pctCoupleOk`), mêmes tournures
(`PCT_ENONCES`), même mise en situation (`CTX_PART`) — et n'ajoute que
`q.dix` (10 % de N, `N/10`) et `q.k` (le nombre de dizaines dans P, `P/10`).
La méthode enseignée diffère : à la place de la fraction P/100, on divise
DEUX FOIS par 10 — une fois sur le nombre, une fois sur le pourcentage — puis
on multiplie les deux résultats. Elle ne fonctionne que parce que
`PCT_PCTS` ne contient QUE des multiples de dix (10 à 90) : le journal des
verdicts l'avait déjà noté pour `associer-coefficient` et `synthese-*`, elle
vaut ici pour la même raison, à la source.
**La case ③ ne montre JAMAIS les valeurs de ① et ②** : son libellé cite « ①
× ② » et non les nombres eux-mêmes — les écrire aurait donné la réponse des
deux premières cases par simple lecture de la troisième, un piège que la
chaîne de {pourcentage} n'a pas puisque son étape ② réutilise le NOMBRE DE
L'ÉNONCÉ (toujours connu), jamais le résultat d'une case précédente.
**Même moteur de tirage, pas la même identité** : la note part sous
`'pourcentage-dix'` (littéral, dans `finishPct10`), le rappel dédié
(`RAP_PCT10`) reprend l'exemple même de {pourcentage} (30 % de 40 = 12) pour
montrer que les deux méthodes s'accordent, et `test.kind='pct10'` est un
identifiant NEUF — le confondre avec `'pct'` aurait fait relire par
{pourcentage} un écran qui n'est pas le sien.
**Ajouté en FIN de sous-thème plutôt qu'à la suite de {pourcentage}** :
l'insérer juste après aurait décalé la numérotation de {pourcentage-depart},
{pourcentage-taux} et des deux synthèses — renumérotation que la convention
autorise, mais qui aurait exigé de reprendre à la main une douzaine de
références écrites en toutes lettres (`tests/verifier.js`, `tests/profils.js`,
les commentaires de la page) sans qu'aucun contrôle ne les tienne toutes à la
fois. L'ajouter en 2.1.8 ne déplace aucun exercice déjà noté.
**La Seconde ne le porte PAS** : contrairement au reste du thème, cette
troisième méthode est restée un ajout de la Première seulement — la liste
figée des cinq démarreurs que compare `nbQuestionsPourcentages` (« 2.1.3 » à
« 2.1.7 ») ne cite donc pas `startPct10`, sans quoi le même contrôle,
partagé par la Seconde, aurait cherché sur son fichier une fonction qui n'y
existe pas et aurait rougi à sa place. Le nombre de questions de
{pourcentage-dix} (`PCT_NB`, la même constante que {pourcentage}) reste
mesuré par les contrôles génériques qui parcourent TOUT `TESTS` — la
distinction ne prive l'exercice d'aucune vérification, elle évite seulement
de le nommer là où il ferait rougir un fichier qui ne le connaît pas.

**Une quatrième méthode, twin de {pourcentage-dix} : retrouver PLUSIEURS
pourcentages, sans qu'aucun ne soit donné à l'avance.**
{pourcentage-dix-cascade} (2.1.9, demande de Turquet, septembre 2026, à
partir d'une fiche de cours qui calcule 10 % de 400 € en divisant par 10,
puis en déduit 20 %, 30 %, 40 %, 5 %, 15 % et 25 % sans repasser par une
fraction sur 100) reprend le MÊME tirage et la MÊME mise en situation que
{pourcentage} (`CTX_PART`, `tirerContexte`) — mais l'énoncé (`PDC_ENONCES`)
ne cite AUCUN pourcentage : c'est justement ce que la fiche demande, chaque
ligne du tableau porte le sien. `genPdc()` tire N dans un sous-ensemble de
`PCT_VALEURS`, filtré aux multiples de 20 (`N%20===0`) — condition qui
suffit à rendre entiers les SEPT dérivés (10 %, 20 %, 30 %, 40 %, 5 %, 15 %,
25 %) : 5 % de N vaut N/20, 15 % vaut 3N/20, 25 % vaut N/4, et les trois
exigent tous que N soit multiple de 20 ; `PCT_VALEURS` elle-même n'étant que
des multiples de dix (10 à 90, 100 à 900), la moitié de ses valeurs à un
chiffre (10, 30, 50, 70, 90) en sont exclues.
**Le filtre ne se lit qu'à l'APPEL de `genPdc()`, jamais à la déclaration du
script.** `PCT_VALEURS` n'est définie que plus bas dans le fichier (§ pour
{pourcentage}) : un `const PDC_VALEURS = PCT_VALEURS.filter(...)` posé au
niveau du script, comme {pourcentage-dix-cascade} vit AVANT cette
déclaration, aurait levé « Cannot access 'PCT_VALEURS' before
initialization » et cassé la page entière au chargement — une leçon que
{pourcentage-dix} avait déjà apprise en ne lisant `PCT_PCTS`/`PCT_VALEURS`
qu'en appelant `genPercent()`, jamais au niveau du script.
**La note est TOUT ou RIEN, comme {pourcentage} et {pourcentage-dix}** : les
sept cases (`pdc0` pour 10 %, `pdcP20`…`pdcP25` pour les six dérivés)
doivent être toutes justes pour que la question compte un point — aucune
case vide ne rougit, chacune se corrige en vert à l'écran (`corTrainDec`)
indépendamment des autres.
**Les lignes reprennent le gabarit `.pt-row`/`.f-whole` de {pourcentage-dix}**
(le même que mesure le contrôle universel « les cases de saisie ont la
taille des nombres qui les entourent ») : `#pdcHost` a donc rejoint la même
liste de sélecteurs CSS que `#pxHost` (taille des `math-field.pm-mf`, largeur
des `.f-dec`, aux deux tailles d'écran) — l'omettre aurait laissé les cases
à la taille par défaut (1,05 rem) contre des nombres à 2 rem, et le contrôle
générique l'aurait vu.
