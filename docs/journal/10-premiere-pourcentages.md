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

**Puis la SYNTHÈSE des trois : deux évolutions, hausse OU baisse chacune, par
l'une des deux méthodes.** {synthese-evolutions-successives} (Première, 2.5.4,
demande de Turquet, septembre 2026 : « un exercice de synthèse qui permet de
faire deux évolutions successives, qui peuvent être chacune des deux une hausse
ou une baisse. Les énoncés ressembleront à ceux du 2.2.7, et on laissera le
choix à l'élève entre la méthode du 2.2.7 ou la méthode du 2.2.8. Le résultat
final doit être un pourcentage entier. ») ferme le sous-thème de la synthèse,
après {reconnaitre-coefficient} : rien n'a été renuméroté.
**CE QUE LA SYNTHÈSE AJOUTE, ET QU'AUCUN DES TROIS N'AVAIT : le SENS de
l'évolution globale n'est pas donné.** Deux hausses montent, deux baisses
descendent — mais « +20 % puis −5 % » ? L'élève le DIT, sur deux boutons (le
motif de {lire-coefficient}), puis écrit le pourcentage. Par les coefficients,
le sens se LIT sur le coefficient global — 1,14 est plus grand que 1 — ; en
partant de 100, sur la valeur finale — 114 est au-dessus de 100. Deux boutons
pour UNE décision, rangée dans la question (`q.choisi`), qu'une pause reprend ;
seul le bouton CHOISI se colore à la vérification, aucun choix ne colore rien
(la règle de la case vide, appliquée à un bouton), et en entraînement le bon
sens se montre en VERT. L'énoncé ne nomme jamais le sens du résultat : les six
tournures suivent `HS_ENONCES` une à une, chaque évolution avec son verbe, et
posent toutes la même question, « une hausse ou une baisse, et de quel
pourcentage ? » — le contrôle l'exige sur les quatre formes.
**LA MÉTHODE SE CHOISIT D'ABORD** (le motif du 2.5.1) : la chaîne apparaît dès
la méthode, en changer la reconstruit sans restaurer — les deux méthodes
n'écrivent pas le même calcul — et « Vérifier » sans méthode la demande, sans
verrouiller ni rougir. La méthode 1 est l'écran du 2.2.7 avec le signe de
chaque coefficient lu dans l'énoncé (« 1 + » ou « 1 − »), puis la LECTURE du
coefficient global ; la méthode 2 est l'écran du 2.2.8 avec, pour une baisse,
la SOUSTRACTION « valeur de départ − baisse », jugée DANS L'ORDRE (`essOrdre`)
là où l'addition garde l'ordre libre de `hscPaire` — la soustraction n'est pas
commutative, et « 50 − 100 » n'est pas défendable. L'étape ④ facultative du
2.2.7 est là aussi, et son signe suit le sens CHOISI : ses têtes sont réécrites
en place quand le sens change, sans redessin, pour ne rien effacer.
**TOUT EST REPRIS, RIEN N'EST RECOPIÉ, et c'est ce qui rend l'ajout court** :
le vivier est `HS_PAIRES` — celui du 2.2.7 et du 2.2.8, lu et non recopié —,
les mises en situation `BS_CTX`, le coefficient d'une hausse `hsCoef`, la pose
`buildPoseU` / `buildPose`, l'addition `hscPaire`. La question ne porte que
ses deux sens, ses deux taux, le contexte, la variante et les deux choix de
l'élève ; `essAns()` recalcule tout le reste, et le contrôle refuse tout autre
champ.
**L'ÉVOLUTION GLOBALE EST UN ENTIER, ET ÇA SE DÉMONTRE** — la règle des deux
décimales du 2.2.7, dans les quatre signes : (1 ± P1/100)(1 ± P2/100) =
1 ± P1/100 ± P2/100 ± P1·P2/10000, donc le global vaut ±P1 ± P2 ± P1·P2/100,
entier dès que P1·P2 est un multiple de 100 — ce que `HS_PAIRES` garantit
déjà. En partant de 100, la seconde évolution vaut (100 ± P1)·P2/100, entière
pour la même raison : toute la chaîne tombe sur des entiers. Le global n'est
jamais NUL sur ce vivier (P1 − P2 − P1·P2/100 = 0 exigerait
P1 = 100·P2/(100 − P2), qu'aucun taux à un seul chiffre non nul ne réalise) et
reste sous 100 % en valeur absolue (au plus +98 % pour deux hausses, −82 %
pour deux baisses, −78 % en mixte). AUCUN GARDE N'EST POSÉ dans la page : il
n'écarterait jamais rien, et ferait croire qu'on vérifie quelque chose — c'est
le CONTRÔLE qui exige les trois propriétés sur le vivier ENTIER, par sa propre
arithmétique, dans les quatre combinaisons de signes et les deux ordres, et
qui vérifie que les deux méthodes calculent le MÊME coefficient.
**LA POSE EN COLONNES PREND LA FORME QUE LES NUMÉRATEURS LUI DONNENT**, et
c'est le seul endroit où la synthèse a eu à décider : deux chiffres seuls
(deux baisses de dizaines, 8 × 6) — un fait de table, pas de pose, la leçon du
2.3.7 ; un facteur à un chiffre (105 × 8, 12 × 8) — `buildPose`, la pose du
2.2.1 ; deux facteurs d'au moins deux chiffres (95 × 12, 105 × 12) —
`buildPoseU`, la pose du 2.2.7, avec le coefficient de HAUSSE en bas : son
numérateur commence par 1 (1X ou 10X), la seule forme que `poseUDonnees` sache
écrire là — et sur ce vivier, un facteur de baisse à deux chiffres (95, 98) ne
rencontre jamais une hausse à trois. Le contrôle l'exige forme par forme (le
bas qui commence par 1, les produits partiels qui retombent sur le produit),
et exige que les TROIS formes sortent du vivier. Comme au 2.2.7, la pose est
un OUTIL : corrigée si l'élève s'en est servi, elle n'entre pas dans la
réussite du calcul.
**Les trois formes sortent chacune UNE fois par séance**, en ordre mélangé —
deux hausses, deux baisses, une de chaque dans un sens ou l'autre — le motif
de la Seconde ({evolutions-successives}, 4.5.5, la même question sur le
schéma à trois boîtes) : sans quoi trois hausses de suite auraient perdu le
signe, tout le sujet. Les paires sont tirées sans remise, comme au 2.2.8.
**Deux bancs, la répartition habituelle.** jsdom tient le vivier, la
propriété entière dans les quatre signes, les trois formes de pose, la
séance, les énoncés, le rendu de chaque méthode (rien avant le choix, puis les
cases EXACTES de chacune — `ESS_CASES`), la copie juste par les DEUX méthodes
sur deux questions ÉPINGLÉES (+20 % puis −5 % : +14 % ; −50 % puis +2 % :
−49 %), l'ordre libre du produit et de l'addition, l'ordre IMPOSÉ de la
soustraction, le sens (le bon vaut le point, le mauvais le refuse et ne rougit
que le bouton choisi, aucun choix ne colore rien), la leçon (la seconde
évolution refaite sur 100 est refusée), chaque case jugée seule, la case vide
sans rouge, le soutien qui ne révèle rien — ni la case, ni le sens —, la pose
fausse qui ne coûte pas le point, le sens qui change sans effacer les cases,
l'identité de « Recommencer », le rappel sur un tirage possible avec les
nombres des deux chaînes, et le contexte envoyé au modèle qui décrit les deux
méthodes. Un second contrôle lit la SOURCE : `genEss` et `essSeance` lisent
`HS_PAIRES`, aucun vivier propre ne revient, `essQuestion` tire dans `BS_CTX`,
`essCoef` lit `hsCoef`. Le NAVIGATEUR voit le reste par la visite universelle
(section 9) : le bouton d'aide, les cases à la taille des nombres, aucune
accolade, aucune case vide rougie. **Le contrôle s'est pris en défaut deux
fois avant la page** : sa lecture des tournures voyait « baisse » dans la
question commune — « une hausse ou une baisse » — et accusait deux hausses
d'en parler ; et son inversion de la soustraction visait la SECONDE opération
de « −50 % puis +2 % », qui est une addition. Un contrôle faux se reconnaît à
ce qu'il rougit sur une page juste ; les deux ont été corrigés, la page n'a
pas bougé. **Dix sabotages, huit rougissant d'emblée en nommant leur défaut**
— le vivier des baisses à la place de `HS_PAIRES`, le global par la somme
naïve, la soustraction à ordre libre, le sens retiré du verdict, les formes
tirées au hasard, la baisse en bas de la pose, la seconde évolution refaite
sur 100, la case vide rougie — **et deux restés VERTS en montrant un trou du
contrôle** : l'énoncé qui nomme « la hausse globale » passait, parce que la
lecture des tournures retirait la question commune AVANT de chercher le sens
— c'est précisément là qu'il se glissait ; et le bon sens révélé en soutien
passait, parce que le contrôle n'y choisissait que le BON sens, et rien
n'était à révéler. Le contrôle lit désormais la phrase entière, et choisit le
mauvais sens en soutien ; les deux sabotages rougissent.

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

**Puis {pourcentage-dix} a été repris entièrement, le jour même** (demande de
Turquet) : « je ne veux pas les mêmes énoncés que dans le 2.1.3, je veux les
mêmes thèmes de sujet mais uniquement pour 10 % » — le paragraphe précédent
décrit la PREMIÈRE version (tirage de {pourcentage} recopié tel quel, deux
divisions ① et ②, la multiplication ③) : elle a vécu quelques minutes en
production avant cette reprise, et le paragraphe reste pour l'histoire, à la
manière des couleurs de la vérification.
**Ce qui change :** {pourcentage-dix} ne reprend plus le TIRAGE de
{pourcentage} — `genPct10()` ne l'appelle plus — mais seulement ses THÈMES
(`CTX_PART`, pour la variété des unités : élèves, salariés, réservoir…), avec
un pourcentage FIGÉ à 10 % (`q.P=10`, jamais tiré dans `PCT_PCTS`). Une seule
case, une seule phrase, calquée au mot près sur la fiche de cours qui a fait
naître l'exercice (« Prendre 10 % de 300 € c'est calculer 300/10 = ..... € ») :
`q.dix` et `q.k` ont disparu avec le deuxième calcul qu'ils portaient — 10 %
ne contenant par construction qu'UNE seule fois 10 %, la case ② (« le nombre
de dizaines ») n'avait plus de raison d'exister.
**Toute la phrase à la MÊME taille de police** (demande explicite) : le
sous-thème entier oppose d'habitude un petit libellé (`.pt-lab`, ~1,35 rem) à
de grosses cases (`.pt-row`, 1,9 rem) — exactement l'inverse de ce qu'on
demandait ici. `.pct10-ligne` est une classe NEUVE, sans rapport avec
`.pt-step`/`.pt-lab` : mots, fraction (rendue par `mlTex`) et case y partagent
un seul `font-size` (1,6 rem, la taille de BASE de `.f-dec` — l'écran ne
rejoint donc PAS le groupe `#pHost, #qHost, #aHost…` qui l'aurait fait
remonter à 1,9 rem pour tous les autres). Le contrôle universel de la taille
des cases (section 9) ne compare qu'aux nombres BRUTS voisins (un texte qui
mélange lettres et chiffres n'en est pas un) : `<b>${q.N}</b>` reste une
feuille nue à côté de la case, ce qui suffit à le satisfaire, même si la
phrase entière autour est, elle, à la même taille pour l'œil.
**L'énoncé encadré (`pxPrompt`) redevient un simple TITRE**, jamais mis à jour
par tirage (« Prendre 10 % d'un nombre en divisant par 10. », toujours le
même) : la question — les nombres, le thème — vit désormais entièrement dans
la ligne de calcul en dessous. Le contrôle qui compte « un encadré Énoncé par
écran » ne regarde que la CLASSE, jamais le contenu : rien ne l'empêche d'être
générique, comme sur les écrans d'ardoise.
`conseilCtxCourant()` et `RAP_PCT10` ont suivi le même chemin, ramenés à
l'unique division — un rappel qui enseignerait encore une case ② disparue
mentirait à l'élève qui clique dessus.

---

## {pourcentage-boite} — le schéma en boîte de la fiche papier (Seconde,
## septembre 2026)

**D'où il vient.** Turquet a fourni une fiche PDF de trois exercices, chacun
avec le même dessin : deux rectangles reliés par une flèche, et sur la flèche
deux pointillés — l'un pour le pourcentage (« × …… % »), l'autre pour son
écriture décimale (« × …………… »). Les trois exercices de la fiche posent
chacun une seule inconnue (le résultat, puis la valeur initiale, puis le
pourcentage) sur un contexte unique (« le lycée »). La demande explicite était
de les MÉLANGER dans un seul exercice, avec plusieurs mises en situation et
des valeurs entières partout — y compris le pourcentage, qui n'est PAS
restreint aux multiples de dix comme le reste du thème.

**Pourquoi une table de contextes à part, et pas `CTX_PART`.** `CTX_PART`
porte déjà trois exercices (`pourcentage`, `pourcentage-depart`,
`pourcentage-taux`, plus les synthèses) et sert de vivier à `PCT_ENONCES`,
`QD_ENONCES_VAL` et `QD_ENONCES_PCT`. Y ajouter les deux libellés de boîte
(`tout`, `partie`) qu'aucun autre exercice ne lit aurait été un ajout sans
risque en apparence, mais un contexte mal choisi pour un exercice existant
— une nouvelle entrée y change le tirage pondéré de TROIS exercices en
production, et le seul moyen de le vérifier est de rejouer leurs contrôles un
par un. `CTX_BOITE` est une table neuve, sur le même modèle (`direct`,
`total`, `taux`, `nOk`) : sept mises en situation (lycée/demi-pensionnaires —
l'énoncé de la fiche, au mot près —, village, entreprise, bibliothèque,
concert, exploitation agricole, salle de sport), quatre d'entre elles sans
aucune condition sur `N` (village, entreprise, bibliothèque, concert : un
« village » ou une « entreprise » restent crédibles de 100 à 9000), ce qui
garantit qu'un contexte convient toujours, quel que soit le tirage —
`tirerContexte()` ne retombe donc jamais sur son repli d'index 0 par défaut
de correspondance.

**Le tirage.** `N=rand(1,9)*Math.pow(10,pick([2,3]))` (100…900 ou
1000…9000, motif déjà employé ailleurs dans ce fichier) et `P=rand(1,99)` —
un entier QUELCONQUE, pas tiré dans `PCT_PCTS`. Comme `N` est multiple de
100, `N×P/100` est toujours entier sans qu'aucune condition de divisibilité
supplémentaire (l'équivalent de `pctCoupleOk`) ne soit nécessaire — la
raison même pour laquelle la demande de Turquet (« un pourcentage
quelconque ») ne casse rien : la contrainte que multiples de dix desservait
ailleurs (couvrir P×N/100 entier avec des N eux-mêmes quelconques) est ici
déjà résolue par la forme de N.

**Les trois inconnues, mélangées.** `qdMelanger(['res','ini','pct'])` puis
`distinctes(3,(_,i)=>genPctBoite(incs[i%incs.length]))` — le même motif que
`startSyn`/`genSyn` pour la synthèse de Première, mais avec des clés
différentes (`res`/`ini`/`pct` plutôt que `fin`/`ini`/`pct`) puisque
`genPctBoite` est un générateur neuf, sans lien avec `genSyn`. Chaque
inconnue sort exactement une fois sur les trois questions, dans un ordre
mélangé. `distinctes()` n'a besoin d'aucun soin particulier ici : `inc` fait
partie de la clé de comparaison (il n'est pas dans `CLE_HORS`), et puisque les
trois tirages ont chacun un `inc` différent, ils sont automatiquement
distincts — contrairement à {pourcentage}, qui doit vraiment éviter de tirer
deux fois le même couple (P, N).

**Toutes les cases sont vides, même les nombres que l'énoncé donne déjà**
(la même convention que {pourcentage-synthese}, ci-dessus) : les 4 cases du
schéma — le tout, le pourcentage, son écriture décimale, la partie — se
jugent chacune SEULE contre sa valeur canonique, exactement comme les cases
①/②/③ de {pourcentage}. La case décimale accepte toute écriture égale à
P/100 (`parseDecToFrac`, la même fonction que `liveColorDec`/`corTrainDec`
ailleurs dans ce fichier) : « 0,45 » vaut le point, et rien n'exige la forme
la plus simple.

**Bords tenus par les contrôles universels, sans rien déclarer de plus.**
`pctb` a été ajouté à `testScreens` (sans quoi le banc de l'encadré Énoncé en
serait resté aveugle — le piège documenté dans `CLAUDE.md`) : à partir de là,
la taille des cases, le clavier mathématique atteignable, la case vide qui
ne rougit jamais, les couleurs de la vérification (§9 bis) et le cadre pleine
largeur (`cadrePleineLargeur`, déjà vrai pour toute la Seconde) se sont tous
vérifiés SANS qu'aucune liste ne cite `pourcentage-boite` par son nom. Trois
sources à deux endroits qui n'auraient pas suivi silencieusement : `THEMES`
(placé en fin du sous-thème 4.1 « Prendre un pourcentage » — il mélange les
trois inconnues de CE sous-thème, pas les trois familles prendre/augmenter/
diminuer du sous-thème 4.5), `QIA_SUGG['pctb']` (sans quoi la fenêtre d'aide
serait retombée sur les questions génériques), et surtout la table `cles` de
`RAPPELS_SECONDE` dans `tests/profils.js` — une SECONDE liste, à côté de
`RAPPELS`/`RAPPELS_ID` de la page elle-même, que `Object.keys(TESTS)` compare
un par un ; l'oublier aurait fait rougir « chaque exercice a son rappel de
cours » avec un message qui nomme exactement l'exercice fautif (« le
contrôle ne connaît pas son kind »).

**Pas de branche dédiée dans `conseilPaire()`.** Contrairement aux exercices
dont l'écran ne porte pas assez de texte lisible pour le modèle, `pctb` se
lit très bien par le repli générique `ctxVisible()` — l'énoncé complet (une
phrase de mise en situation, 90 à 130 caractères) plus les libellés des deux
boîtes suffisent largement au seuil de 60 caractères qu'exige « chaque
exercice a un contexte à envoyer au modèle ». Ce bord n'est vrai QU'EN
SECONDE et en Première (`ctxVisible()` y lit l'énoncé, la scène ET les
saisies) : la Terminale, qui a dû nommer une branche par exercice
(`ctxChaqueExercice`), n'aurait pas pu se permettre ce raccourci.

**Ce que le contrôle du contexte a fait remonter au premier essai** : avant
d'ajouter `pctb` à `QIA_SUGG`, la fenêtre d'aide restait fonctionnelle (le
repli `QIA_SUGG.gen` existe toujours) — rien ne cassait, l'aide devenait
simplement générique. C'est exactement le défaut que `CLAUDE.md` décrit au
point 11 : « rien ne s'affiche en rouge, l'aide est simplement devenue
inutile ». Le contrôle `chaque écran d'exercice a ses questions à l'IA` l'a
donc attrapé nommément, avant toute mise en ligne.

---

## {pourcentage-chaine} — composer deux pourcentages (Seconde, septembre 2026)

**D'où il vient.** Une deuxième fiche PDF de Turquet, un seul exercice cette
fois : « Dans un club de sport il y a 40 % de filles. Parmi les filles, 30 %
font du basket. Elles représentent quel % du club ? », avec le même schéma en
boîte que {pourcentage-boite} — mais à TROIS boîtes et DEUX flèches (le club,
les filles, les basketteuses), plus une case à part qui reprend « … × … = … »
en dessous, reliée par un trait au total et à la dernière boîte : le calcul en
un seul coup, celui qui va directement du total au dernier sous-groupe. C'est
le motif du chapitre « évolutions successives » — composer deux coefficients
par une multiplication, jamais une addition — appliqué à une population
plutôt qu'à une évolution dans le temps.

**Aucun nombre de population, contrairement à {pourcentage-boite}.** L'énoncé
du PDF n'en donne aucun : tout se lit en pourcentage DU TOTAL, qui vaut
toujours 100 %. Ce choix évite toute condition de divisibilité sur un effectif
N — le tirage de deux pourcentages dans `PCT_PCTS` (multiples de dix) suffit :
`P1=10a`, `P2=10b` ⇒ `P1×P2=100ab`, donc `P1×P2/100=ab` est toujours entier,
sans l'équivalent de `pctCoupleOk` que `PCT_VALEURS` réclame ailleurs.

**Six cases, jamais quatre.** Le tout (toujours 100, mais une case comme les
autres — la même convention que {pourcentage-boite} : « toutes les cases sont
vides, même les nombres que l'énoncé donne déjà », étendue ici à une valeur
qu'aucun énoncé ne donne, mais que le schéma suppose toujours vraie), les deux
écritures décimales des flèches, le premier sous-groupe, le second, et le
coefficient global de la deuxième rangée. `genPctChaine()` ne tire que P1 et
P2 ; toutes les autres valeurs (le total, le combiné, le coefficient global)
s'en déduisent au moment de vérifier, jamais au tirage — le motif déjà suivi
par `genPctBoite()`.

**Trois sens, comme {pourcentage-boite}, mais sans rien à résoudre à
l'exécution.** `inc='comb'` (le cas de la fiche : P1 et P2 sont donnés dans
l'énoncé, on cherche le combiné), `inc='p1'` et `inc='p2'` (le combiné et
l'un des deux taux sont donnés, on cherche l'autre). Comme P1, P2 et leur
produit sont tirés une seule fois par `genPctChaine()`, ces trois sens ne
changent JAMAIS les nombres du schéma — seule la PHRASE de `pctcEnonce()`
change ce qu'elle affirme et ce qu'elle demande, exactement la distinction que
{pourcentage-boite} pose déjà entre le tirage et l'énoncé. `qdMelanger(['comb',
'p1','p2'])` fait sortir chaque sens une fois sur les trois questions.

**Une table de contextes neuve, `CTX_CHAINE`, pas `CTX_BOITE`.** Six mises en
situation (club de sport — l'énoncé de la fiche, au mot près —, lycée,
village, entreprise, bibliothèque, festival), chacune avec trois libellés de
boîte (`total`, `niv1`, `niv2`) et trois phrases (`comb`, `p1`, `p2`). Aucune
condition `nOk` : sans nombre de population à couvrir, un contexte convient
toujours à n'importe quel tirage de P1, P2 — `tirerContexte()` n'a donc besoin
d'aucun filtre ici, à la différence de `CTX_BOITE` et `CTX_PART`.

**Bords tenus par les contrôles universels — un seul à ajouter à la main.**
`pctc` a rejoint `testScreens` (sans quoi le banc de l'encadré Énoncé en
serait resté aveugle, comme pour {pourcentage-boite}) ; `THEMES` (fin du
sous-thème 4.1, juste après {pourcentage-boite}) ; `QIA_SUGG['pctc']` ;
`RAPPELS_ID['pourcentage-chaine']` (`RAP_PCTC`) ; et la table `cles` de
`RAPPELS_SECONDE` dans `tests/profils.js`. **Le premier essai du banc
navigateur a rougi sur un bord que {pourcentage-boite} et
{synthese-evolutions} ne lèvent pas** : « chaque écran d'exercice réserve la
place des commandes flottantes » — `#scr-pctc`, le bas de la carte passait
sous `#testCtrls`. Les deux exercices voisins s'en tirent SANS la réserve
`padding-bottom:84px` parce que leur schéma tient sur une seule rangée ; le
mien en tient DEUX (la chaîne à trois boîtes, puis la rangée du coefficient
global), ce qui suffit à faire déborder la carte sur les écrans bas. La règle
de `CLAUDE.md` (point 5 de la liste des quinze branchements) le dit déjà :
elle n'a pas de condition sur le nombre de rangées, et ce premier essai est
la preuve qu'il ne fallait pas la supposer inutile parce que deux voisins
directs s'en passent.

**Les trois boîtes perdent leur case (Turquet, septembre 2026) : elles ne
portent plus que le nom de l'effectif.** Le schéma d'origine calquait
{pourcentage-boite} au pied de la lettre — « toutes les cases sont vides,
même les nombres que l'énoncé donne déjà » — et faisait donc remplir le
total (toujours 100), le premier sous-groupe et le second EN PLUS des deux
écritures décimales des flèches. Turquet a demandé l'inverse : aux
extrémités des flèches, plus aucune case, seulement le nom de la boîte
(`${ctx.total}`, `${ctx.niv1}`, `${ctx.niv2}`) — `boiteLab()` remplace
`boitePct()`, qui posait un `math-field` et un « % » à côté du libellé.
L'exercice ne juge donc plus `pctcT`/`pctcA`/`pctcB` ; il reste `pctcD1` et
`pctcD2` sur les deux petites flèches, tenus par le même critère qu'avant
(`parseDecToFrac` contre `P1/100` et `P2/100`).

**La rangée du coefficient global devient une vraie flèche, et une vraie
multiplication à trois cases.** L'ancienne rangée n'avait qu'un « × [case] »
sans premier facteur écrit — le libellé disait « en un seul calcul » sans
qu'aucun calcul ne soit visible. `.pctc-global` porte maintenant
`.pctc-global-shaft`, une grande flèche qui relie visuellement la première
boîte à la dernière (le même triangle CSS que `.pctb-shaft::after`, à
l'échelle de la rangée entière plutôt que d'un seul segment), puis
`.pctc-calc` : « `[pctcG1]` × `[pctcG2]` = `[pctcG]` » — les deux écritures
décimales REPRISES (même critère que `pctcD1`/`pctcD2`, une case à part qui
« reprend » le calcul déjà posé plus haut, jamais une lecture croisée des
deux premières cases) et leur produit, jugé comme `pctcG` l'était déjà. Le
barème ne change pas : une question reste juste ou fausse en bloc, et
`test.maxScore` ne compte que les questions, jamais les cases.

**Une phrase de conclusion ferme l'exercice (Turquet, même semaine) : elle
se termine par une case à compléter par le BON POURCENTAGE.** Le schéma en
boîte s'arrêtait sur le calcul (`pctcG`), sans jamais reformuler la réponse
en mots — l'élève pouvait trouver 0,12 sans jamais écrire « 12 % ». Chaque
contexte de `CTX_CHAINE` gagne un troisième champ, `ccl` (trois fonctions,
`comb`/`p1`/`p2`, comme `comb`/`p1`/`p2` eux-mêmes) : une phrase déclarative
qui reprend EN MOTS ce que la question de `pctcEnonce()` posait, avec un
trou à la place du nombre — « Donc les basketteuses représentent ▢ % des
membres du club. » pour `comb`, « Donc le club est composé de ▢ % de
filles. » pour `p1`, etc. Le motif « donc … est de ▢ % » est celui
qu'{augmenter-taux-dix} (2.2.12, Première) a introduit la même semaine pour
sa propre conclusion — même façon de clore un calcul par sa phrase, portée
ici à un exercice à trois inconnues au lieu d'une seule.

**Le trou ne recopie JAMAIS le nombre qu'une autre case demande déjà.**
Les trois sens (`comb`, `p1`, `p2`) ne cherchent pas le même pourcentage :
`pctcCible(q)` le calcule une fois (`q.P1`, `q.P2` ou `q.comb` selon
`q.inc` — exactement ce que `pctcEnonce()` pose en question, jamais ce
qu'elle donne), et une seule fonction sert la case (`pctcC`), la
correction en direct du soutien et le corrigé affiché en entraînement. La
case se juge comme les anciennes `pctcT`/`pctcA`/`pctcB` — un entier
comparé par `parseInt`, jamais `parseDecToFrac` (le trou est un
pourcentage en toutes lettres, pas une écriture décimale) — et suit le même
garde-fou universel : vide, elle ne rougit jamais.

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

---

**Et {pourcentage-dix-cascade} a suivi {pourcentage-dix} sur le nombre de
départ : trois familles, pas seulement les multiples de 20.** Demande de
Turquet, septembre 2026 : « je veux que le nombre de départ soit un multiple
de cent, ou un multiple de dix et pair, ou un chiffre des unités mais pair ».
Le paragraphe précédent décrit le PREMIER tirage (`N%20===0` sur
`PCT_VALEURS`) : il reste vrai pour l'histoire, mais `genPdc()` ne s'y limite
plus. La question, à chaque famille, est la même : que doit valoir N pour que
**5 % de N (N/20)** — la seule des sept lignes qui ne tombe pas déjà juste sur
un multiple de dix ou de cent — s'écrive PROPREMENT, sans jamais gagner une
décimale que la méthode enseignée (doubler, tripler, additionner) ne
produirait pas ailleurs :
- **multiple de CENT** : aucune contrainte de parité, N/20 = 5 × (N/100) est
  toujours entier — c'est la famille qui n'existait pas avant, parce que
  `PCT_VALEURS` ne montait qu'à 900 par pas de cent et que le filtre
  `N%20===0` les acceptait déjà TOUTES (100 à 900 sont tous multiples de 20) ;
  la nommer à part n'a rien changé au résultat, seulement à la LISIBILITÉ du
  tirage.
- **multiple de DIX (pas de cent), chiffre des dizaines PAIR** : exactement le
  seul cas que l'ancien filtre retenait (20, 40, 60, 80) — N/20 reste entier.
- **chiffre des UNITÉS non nul mais PAIR** (la famille NEUVE) : N n'est plus
  un multiple de dix du tout — 34,2 par exemple. 10 % de N s'écrit alors avec
  UNE décimale, et il faut que 5 % (sa moitié) en garde UNE SEULE : diviser
  par 2 un nombre pair ne change jamais le nombre de décimales, quand une
  unité impaire aurait donné un centième (34,15 pour 34,3) qu'aucune des
  opérations enseignées (×2, ×3, ×4, ÷2, additions) ne produit sur les six
  autres lignes — une case attendrait alors une précision que rien n'annonce.
**`genPdcN()` tire la famille avant la valeur** (`pick(['cent','dix','unites'])`
puis un `pick` dans la famille choisie), plutôt qu'un `pick` unique sur la
concaténation des trois viviers : à plat, les 36 valeurs de la famille
« unités » (9 dizaines × 4 unités paires) auraient écrasé les 9 multiples de
cent et les 4 multiples de dix neuf fois sur dix, et l'exercice aurait cessé
de ressembler à la fiche d'origine (qui ne connaît que des multiples de dix
ou de cent) la plupart du temps.
**Le même piège que {pourcentage-dix-cascade} n'avait pas encore payé, réglé
par la même fonction que {pourcentage-dix}.** Une valeur décimale de N pose la
même question que sur {pourcentage-dix} : « 3,2 élèves » ou « 3,2 articles »
n'a pas de sens. `pct10CtxDecOk` — déjà écrite pour `genPct10()`, qui écarte
les contextes `humain` et les articles dès que son N n'est pas multiple de
dix — est réutilisée TELLE QUELLE comme quatrième argument de
`tirerContexte(CTX_PART,N,null,…)`, appliqué seulement quand `N%10!==0` (les
deux autres familles gardent tous les contextes, comme avant) : rien n'est
recopié, la même fonction sert les deux exercices, et un contexte qui
changerait pour l'un suivrait pour l'autre sans rien à répéter.
`RAP_PDC` gagne une ligne d'exemple sur un nombre non multiple de dix (34 €),
sur le modèle de la ligne ajoutée à `RAP_PCT10` par {pourcentage-dix} — un
rappel qui ne montrerait que des multiples de dix mentirait sur la moitié des
tirages désormais possibles.

---

## {augmenter-taux-dix} — la 3ème méthode, appliquée à une augmentation
## (Première seulement, septembre 2026)

**D'où il vient.** Turquet a fourni deux pages d'une même fiche PDF, « 3ème
méthode retrouver un pourcentage » : la première pose la question sur une
proportion (12 élèves sur 30 ont la moyenne, quel pourcentage ?), la seconde
sur une augmentation de prix (60 € devient 84 €, quel pourcentage
d'augmentation ?). Demande explicite : « je veux uniquement le 10.5 [la
seconde page], tu peux oublier le 10.4 ». L'exercice ne porte donc QUE le
contexte de l'augmentation — la proportion d'un groupe n'a pas d'exercice
dédié à cette méthode, {pourcentage-dix-cascade} (2.1.9) la couvre déjà par
un autre biais (six pourcentages à la fois, un nombre donné, pas de valeur
finale).

**Le tirage du pourcentage cherché.** Règle donnée par Turquet, en toutes
lettres : « le résultat doit être un multiple de 10 strictement au-dessus de
10 et strictement inférieur à 100, ou bien un pourcentage multiple de 5 %
impair et inférieur ou égal à 25 % ». Deux familles à poids ÉGAL (`pick`
d'abord sur la famille, comme `genPdcN` le fait déjà pour le nombre de départ
de {pourcentage-dix-cascade}, sans quoi les huit valeurs de la famille « dix »
auraient écrasé les trois de la famille « cinq ») :
- **`ATD_PCTS_DIX = [20,30,40,50,60,70,80,90]`** : le pourcentage s'obtient en
  multipliant 10 % par un entier de 2 à 9.
- **`ATD_PCTS_CINQ = [5,15,25]`** : « dans le cas où le pourcentage se termine
  par un 5, demander à l'élève de trouver 5 % après le 10 %, pour ensuite
  multiplier par le bon nombre » (Turquet). 5 % est la moitié de 10 %, et le
  pourcentage cherché s'obtient en multipliant 5 % par 1, 3 ou 5.

**Le nombre de départ.** `genAtdN(besoinCinq)` : sans la case des 5 %, N suit
le même tirage que {augmenter-taux} (`rand(1,9)*10^k`, k de 1 à 3) — 10 % est
alors TOUJOURS entier, aucune autre condition n'est nécessaire. Avec la case
des 5 %, N doit rendre N/20 entier lui aussi : même condition, et le même
remède, que la famille « cinq % » de `genPdcN` (2.1.9) — un multiple de CENT
(aucune contrainte de parité) ou un multiple de DIX à dizaine PAIRE (20, 40,
60, 80). La famille « chiffre des unités pair » de `genPdcN`, qui rend 10 %
décimal, n'a pas de raison d'être reprise ici : rien dans la règle de Turquet
ne demande un pourcentage décimal, et une phrase à trois cases (l'écart, 10 %,
5 %) reste plus lisible avec des nombres entiers partout.

**Le contexte et l'énoncé sont RECOPIÉS, pas redéfinis.** `AUGQ_CTX`,
`AUGQ_EN_PCT`, `augqTirerCtx`, `augqCtx` — la table de sujets et la table de
tournures de {augmenter-taux-addition} (« Un prix passe de 60 € à 84 € »,
etc.) — sont réutilisées TELLES QUELLES : `q.N`, `q.fin`, `q.unit`, `q.ci`
suivent exactement la même forme, et un contexte ajouté à `AUGQ_CTX` pour
l'un des quatre exercices qui la lisent (`augmenter-depart`,
`augmenter-taux`, leurs jumeaux « addition », et maintenant `augmenter-taux-dix`)
vaut pour tous sans rien à répéter.

**Une seule phrase, une seule taille de police par ligne — la classe
`.pct10-ligne` de {pourcentage-dix} (2.1.8), reprise TELLE QUELLE sous un
nouveau sélecteur (`#atdHost .pct10-ligne`), pas redéfinie.** Chaque étape est
sa PROPRE ligne, jamais un mélange petit-label / grosse-case : l'écart
(« {sujet} a augmenté de {fin} − {N} = ▢ {unité} »), 10 % (« 10 % de {N}
{unité} = {N}/10 = ▢ {unité} »), 5 % quand il le faut, puis la ligne finale
(« Il y a donc eu une augmentation de ▢ % »). Aucune ligne ne recopie une
valeur déjà trouvée dans une AUTRE case : contrairement à la fiche papier
(qui redemande l'écart ET le pourcentage sur la même ligne « donc : ... % de
60€ = ... »), la version interactive ne pose CHAQUE nombre qu'UNE fois — deux
cases qui attendraient la même valeur n'auraient rien vérifié de plus,
seulement fait cliquer deux fois pour rien.

**La note est TOUT ou RIEN**, comme {pourcentage-dix-cascade} : les 3 ou 4
cases (`atd1` l'écart, `atd2` les 10 %, `atd3` les 5 % si besoin, `atd4` le
pourcentage) doivent être toutes justes pour que la question compte un point,
aucune case vide ne rougit, chacune se corrige en vert indépendamment des
autres (`corTrainDec`).

**`EVOL_NB` (3 questions), pas `PCT_NB`.** L'exercice n'appartient pas à la
famille « prendre un pourcentage » (2.1.x, `PCT_NB=4`) mais à la famille
« augmenter » (2.2.x) : il partage donc la même constante que
{augmenter-taux-addition} et ses dix-neuf voisins, DEUX sources (la page a
`EVOL_NB`, `tests/profils.js` compare à `nbQuestionsEvolutions`) — aucune des
deux n'a besoin d'être touchée, la constante existait déjà et vaut toujours 3.

**Ajouté en FIN du sous-thème « Augmenter d'un pourcentage »**, comme
{pourcentage-dix} et {pourcentage-dix-cascade} l'avaient été en fin du leur.
Visé au départ comme 2.2.11, juste après {synthese-augmentations-libre}
(2.2.10) — mais {augmenter-dix} a fusionné sur `main` entre-temps (PR #353,
même sous-thème, même position visée), prenant 2.2.11 le premier :
{augmenter-taux-dix} devient donc 2.2.12, après {augmenter-dix}. Aucun
exercice déjà noté n'est renuméroté — ni le sien, ni celui de personne
d'autre.

**`genAtd()` est déclaré AVANT `AUGQ_CTX`/`AUGQ_EN_PCT` dans le fichier**,
exactement comme {pourcentage-dix-cascade} avait appris à ne lire
`PCT_VALEURS` qu'à l'APPEL de `genPdc()`, jamais à la déclaration du script :
`genAtd()`, `renderAtd()` et `checkAtdAnswer()` ne LISENT ces tables que dans
leur CORPS, jamais au niveau du script — la fonction n'est appelée qu'au
clic, longtemps après que le script entier (et donc `AUGQ_CTX`, plus bas dans
le fichier) a fini de s'exécuter.

**`startAtd` ne rejoint PAS le contrôle des vingt-deux démarreurs des
évolutions** (`tests/verifier.js`, « les exercices sur les évolutions posent
3 questions »), pour la même raison que {pourcentage-dix} n'est pas dans le
contrôle jumeau des pourcentages (paragraphe plus haut) : cette liste et le
contrôle qui la parcourt sont PARTAGÉS avec `secondes.html`, et `startAtd`
n'existe que sur `premiere-specifique.html` — l'y ajouter ferait rougir la
Seconde sur un démarreur absent EXPRÈS. `tests/verifier.js` porte un
commentaire qui le dit explicitement, à l'endroit même où l'ajout aurait dû
se faire, pour qu'il ne soit pas tenté en silence une seconde fois. Le
tirage de {augmenter-taux-dix} reste couvert par le contrôle générique
« aucune séance ne pose deux fois la même question » (qui appelle
`startAtd` sans le nommer) et par le banc navigateur.

**Bords tenus par les contrôles universels, sans rien déclarer de plus** :
`atd` a rejoint `testScreens` (show), `afficherEcranDe` (reprise et rejeu),
`restartCurrentTest`, `liveCheckCurrent`, et la liste des fonctions de rendu
enveloppées en fin de script (jetons + boutons IA) — les cinq points que
CLAUDE.md nomme explicitement risqués à l'oubli. `RAPPELS_ID` porte
`'augmenter-taux-dix':RAP_ATD` (un rappel PROPRE à l'exercice, pas partagé
par kind) et `QIA_SUGG.atd` ses quatre questions proposées — sans quoi
`rappelDispo()` aurait averti en console, et la fenêtre d'aide serait
retombée sur les questions génériques.

---

**Et la troisième famille a été resserrée le jour même : pas un chiffre des
unités, un petit nombre.** Turquet, en relisant : « je veux que le nombre
[...] soit un multiple de cent, ou un multiple de dix avec le chiffre des
dizaines pair, ou bien un nombre entre 1 et 8 pair » — plus étroit que le
paragraphe précédent, qui avait compris « un chiffre des unités pair » comme
ANY nombre à deux chiffres dont l'unité est paire (12, 34, 342…). Le
paragraphe précédent reste pour l'histoire ; `genPdcN()`, lui, ne tire plus
dans cette famille-là. La troisième famille est maintenant `pick([2,4,6,8])`
tout court — un nombre ENTRE 1 ET 8, jamais un dizaine-plus-unité — et la
famille a changé de nom dans le code (`'unites'` → `'petit'`) pour ne pas
laisser un nom qui ne correspond plus à rien. La raison mathématique ne
bouge pas d'un pouce : 4/20 = 0,2 (une décimale, comme 4/10 = 0,4) quand
3/20 = 0,15 (deux décimales) — c'est la parité de N, pas son nombre de
chiffres, qui tient la propreté du calcul. `pct10CtxDecOk` reste le bon
filtre de contexte : un jeu à 4 € ou un trajet de 4 km passent, une classe
de 4 élèves ou 4 articles restent écartés, exactement comme avant.

**Et la première famille s'est ÉLARGIE, le même jour encore : « multiple de
cent » devient « trois chiffres, multiple de dix, dizaines paires ».**
Nouvelle relecture de Turquet : « je veux que le nombre [...] soit un nombre
de 3 chiffres multiple de 10 avec le chiffre des dizaines paire, ou bien un
nombre à deux chiffres multiple de 10 avec le chiffre des dizaines paire, ou
bien un nombre entre 1 et 8 pair ». Les DEUX paragraphes précédents restent
pour l'histoire ; seule la première famille change, une troisième fois dans
la même journée. Elle ne tire plus dans les neuf multiples de cent (100,
200… 900) mais dans les 45 nombres à trois chiffres dont le chiffre des
DIZAINES est pair (120, 340, 780…) — ce qui inclut les multiples de cent
comme cas particulier, puisque 0 est un chiffre pair : un multiple de cent
n'est jamais qu'un nombre à trois chiffres dont les dizaines valent 0.
`genPdcN()` tire donc `rand(1,9)*100+pick([0,2,4,6,8])*10` (un chiffre des
centaines quelconque, un chiffre des dizaines pair PARMI CINQ valeurs, dont
zéro) au lieu de `pick([1..9])*100` — et la famille change encore de nom
(`'cent'` → `'trois'`) pour dire ce qu'elle tire vraiment : un nombre à trois
chiffres, pas nécessairement un multiple de cent. La DEUXIÈME famille (deux
chiffres, dizaines paires — 20, 40, 60, 80) ne bouge pas : elle est le cas
`k=1` du même principe, avec un seul chiffre de dizaine possible avant la
virgule des centaines. La raison arithmétique ne change pas non plus : pour
N = 100a + 10b avec b pair, N/20 = 5a + b/2 reste entier quel que soit a — la
propriété qui fait tout l'exercice ne demandait jamais que b soit nul, elle
demandait seulement qu'il soit pair.

---

**{pourcentage-dix-taux} a gagné les flèches de sa fiche papier.** Turquet a
fourni la fiche source du 2.1.10 (« 3ème méthode retrouver un pourcentage ») :
deux traits courbes en pointillés relient le « 10 % » de départ au
pourcentage cherché, et sa valeur en unités de l'énoncé au nombre final déjà
donné dans l'énoncé — la même case de départ sert deux fois, une fois pour le
pourcentage, une fois pour la quantité, et c'est ce doublage qui montre que
c'est LE MÊME facteur des deux côtés. La demande : « je souhaite avoir des
flèches comme dans le pdf pour trouver la multiplication ou la division ».

Rien n'a changé dans le tirage ni dans la correction : la phrase « On
multiplie par ... » garde la seule case qui compte pour la note (`pdtK`), les
flèches ne sont qu'un appui visuel superposé, comme sur la fiche. Aucune
flèche quand le pourcentage cherché EST 5 % : il n'y a alors aucune opération
à montrer (la branche existante restait déjà telle quelle).

La technique est celle de {croiser-denominateurs} (Seconde) : des POSITIONS
MESURÉES dans la page — jamais des coordonnées supposées, qui se décaleraient
au premier changement de police, de largeur d'énoncé ou d'unité — via un SVG
superposé, redessiné à chaque question et au redimensionnement. Une seule
différence de géométrie : {croiser-denominateurs} croise deux flèches sur la
MÊME ligne (les deux fractions de départ) ; ici les deux flèches DESCENDENT
d'une ligne à l'autre (le « 10 % » ou le « 5 % » vers la ligne « donc »), donc
la courbe part de la verticale au lieu de l'aplatir au milieu. Nouvelle
couleur, `--pdt-fl` (le même violet que `--crd-a`, choisi pour ne pas se
confondre avec le bleu du juste, le vert de la correction ni le rouge du
faux) : un fichier différent, la même intention.

**Le piège qui ne s'est vu qu'en ouvrant vraiment la page.** Les deux
`setTimeout` qui laissent MathLive finir de poser ses cases (60 ms, 240 ms,
le même délai que {croiser-denominateurs}) peuvent se déclencher APRÈS que la
question suivante a déjà remplacé le DOM — si l'élève répond vite. Le
redessin retardé retrouvait alors `pdtP` et le nombre final de la NOUVELLE
question (ces deux-là existent sur TOUTE question, flèches ou pas) et
dessinait quand même, cette fois sur une case dont le pourcentage cherché EST
5 % — l'écran qui n'a justement rien à montrer. Aucun banc statique ne
pouvait le voir : rien n'y est faux, juste mal daté. Le garde tient sur la
classe `pdt-fl`, posée UNE FOIS par `renderPdt()` pour LA question qu'il
vient d'afficher — le seul repère qui date correctement, là où l'existence de
`pdtP` ou de la case du résultat ne le fait pas.

---

**{augmenter-dix} (2.2.11) reçoit la pose facultative de l'addition finale,
comme au 2.2.2** (demande de Turquet, septembre 2026). La dernière ligne de
l'exercice — `adxA` (le prix de départ) + `adxB` (l'augmentation trouvée)
= `adxC` (le nouveau prix) — est exactement la même forme que la ligne
« départ + augmentation » du 2.2.2 (`g4a`/`g4b`/`g4r`) : même case
`poseOpEleveMAJ` sait déjà tenir, sans rien y ajouter. `updateAdxStep6()`
l'appelle avec `aId:'adxA', bId:'adxB', neg:false` (l'exercice ne diminue
jamais, contrairement à {augmenter-addition}/{diminuer-soustraction} qui
partagent `startEvolAdd`) ; la pose vit dans un `pt-step pt-opt step-hidden`
neuf (`adxStep6`/`adxMul`), après la ligne du total, et reste — comme
partout ailleurs — bâtie sur ce que l'ÉLÈVE a écrit dans `adxA`/`adxB`, pas
sur la correction, cachée tant que les deux cases ne portent pas un entier
positif, et non comptée dans `allOk`. `checkAdxAnswer()` gagne le même bloc
de notation que `checkAG2Answer()` (cases jugées seulement si engagées,
retenues facultatives, correction affichée en entraînement) : les deux
exercices tiennent désormais le même bord par le même code, pas par deux
copies qui auraient fini par diverger.

---

**Et {synthese-evolutions} est arrivée en Seconde SEULE, à partir d'une fiche
papier.** Turquet a fourni une fiche d'exercices (« évolutions en % ») posant
treize calculs de hausse et de baisse, mélangés, avec le schéma en boîte —
ancien prix, coefficient \(1\pm P/100\), nouveau prix — et une demande en deux
mots : « diversifie les énoncés » et « le résultat doit être un entier ». Les
deux étaient déjà LA propriété du moteur partagé avant qu'on écrive une seule
ligne : `AUG_THEMES`/`DIM_ENONCES` tirent une mise en situation et une
tournure parmi des dizaines à chaque question (le vélo, le loyer, la
population, l'action cotée…), et `genSyn('aug'|'dim', …)` — le générateur
même de {synthese-augmentations} et {synthese-diminutions} — pose une valeur
de départ MULTIPLE DE 100 et un taux à un seul chiffre non nul : tout y tombe
sur un entier, propriété déjà tenue par le contrôle « le coefficient de
chaque transformation s'écrit avec au plus deux décimales » sur les deux
familles. **N'écrire aucune arithmétique neuve était donc le bon geste** :
réécrire la génération ici l'aurait fait diverger de ce que la page calcule
réellement, la leçon de {synthese-diminutions} reprise telle quelle.
**CE QUI MANQUAIT VRAIMENT, C'ÉTAIT LE MÉLANGE DES DEUX SENS DANS LA MÊME
SÉANCE.** {synthese-pourcentages} (2.5.1) mélange déjà « prendre »,
augmenter et diminuer ; {synthese-augmentations} et {synthese-diminutions}
gardent chacune un seul sens. Aucune des trois ne correspond à la fiche, où
CHAQUE calcul peut être une hausse ou une baisse, jamais un « prendre ». Le
nouveau démarreur `startSynEvol` appelle donc `genSyn` avec une famille
tirée question par question — jamais `'pct'` — et **garantit les deux sens
sur trois questions** : `fams=qdMelanger(['aug','dim',pick(['aug','dim'])])`
pose d'office une hausse et une baisse, la troisième étant tirée librement ;
sans cette garantie, une séance aurait pu poser trois hausses de suite et
perdre tout le sujet de la fiche. Les trois inconnues — résultat, valeur
initiale, pourcentage — sortent chacune une fois, en ordre mélangé, comme
dans les trois autres synthèses.
**TOUT LE RESTE EST REPRIS, RIEN N'EST RECOPIÉ** : l'écran (`scr-syntest`),
`renderSynTest`, `checkSynAnswer`, `synCouple`, `synQuoi`, `synTab`, le
rappel de cours (`RAPPELS.psyn`, partagé sans override — comme
{synthese-augmentations} et {synthese-diminutions} avant elle), le contexte
envoyé au modèle (`ctxPourcentages`, la branche `k==='psyn'`, déjà générique
sur `q.fam`) sont ceux du 2.5.1 : rien n'a eu à y changer, parce que rien
dans ce moteur ne dépend de l'identité de l'exercice, seulement de la
question tirée. Même moteur, pas même identité : `test.qId` porte
« synthese-evolutions », et « Recommencer » route dessus dans `restartPct()`.
**L'exercice n'existe qu'en Seconde**, contrairement au reste du thème
« porté tel quel » depuis septembre 2026 : la fiche qui l'a demandé ne
concernait que ce niveau, et rien n'oblige à porter en Première un exercice
que personne n'y a demandé. Le contrôle dédié (`syntheseEvolutions`, dans
`tests/verifier.js`) le sait : il se déclare « non applicable » sur le
fichier qui n'a pas `startSynEvol`, plutôt que de rougir sur une fonction
absente — la leçon de {pourcentage-dix}, à l'envers : un exercice qui
n'existe que d'un côté ne rejoint JAMAIS la liste partagée et non gardée des
vingt-deux démarreurs d'évolutions, sous peine de faire rougir l'autre
niveau sur une fonction qu'il n'a pas. Il tient trois bords propres à cet
exercice (jamais la famille « prendre », les deux sens garantis sur trois
questions, l'identité tenue par « Recommencer ») sur trente tirages, sans
remesurer l'entier du résultat — déjà exigé par ailleurs sur `genSyn('aug')`
et `genSyn('dim')`, remesurer ici aurait dupliqué un contrôle sans rien
prouver de plus.

---

## {augmenter-taux-dix} — refonte de la présentation (Première, septembre 2026)

**D'où ça vient.** Une fois {augmenter-taux-dix} en ligne (section ci-dessus),
Turquet a demandé que sa présentation suive plus fidèlement la fiche PDF, sur
le modèle de ce qui existait déjà pour {pourcentage-dix-taux} (2.1.10) : « je
veux que ce soit présenté comme le pdf deux lignes l'une en dessous de l'autre
avec des flèches et une multiplication à trouver et le % à compléter [...] la
ligne au-dessus des flèches serait "10 % de 9000 habitants est : ......." la
ligne en dessous serait "....% de 9000 habitant est 1800." ». Deux exigences
de plus, dans le même message : espacer un peu plus les lignes, et proposer la
soustraction posée en facultatif, « comme dans l'exercice 2.2.6 avec une
addition ».

**La bascule décisive : l'augmentation n'est plus une case à trouver.** Dans
la première version (ci-dessus), la toute première ligne demandait l'écart
`fin − N` dans une case. Sur l'exemple donné par Turquet, ce nombre (1800)
est écrit EN CLAIR dans la seconde ligne, pas dans une case — logique : la
fiche part de DEUX valeurs déjà connues (60 € et 84 €), et la méthode des 10 %
sert à retrouver le POURCENTAGE, jamais l'écart, qu'une simple soustraction
donne déjà à partir de ce que l'énoncé affiche. Retirer cette case a un
second effet, cherché lui aussi : elle libère la place pour la vraie demande
de la fiche, une case pour le FACTEUR par lequel on multiplie (`atdK`), que la
version précédente n'avait jamais proposée séparément.

**{augmenter-taux-dix} et {pourcentage-dix-taux} deviennent le MÊME écran,
sur un contexte différent.** `q.aug` (l'augmentation) joue ici exactement le
rôle de `q.result` en 2.1.10 (le P % cherché de N) : une fois ce
rapprochement vu, `atdPoints`/`atdDessinerFleches` sont des copies conformes
de `pdtPoints`/`pdtDessinerFleches` — jusqu'aux noms de variables — et
`atdArc` n'existe même pas : `pdtArc` ne dépend d'aucun nom propre au 2.1.10
(deux points, une couleur, un identifiant de marqueur), il se réutilise TEL
QUEL. Seuls les identifiants DOM changent de préfixe (`pdt*` → `atd*`), la
classe qui déclenche le dessin (`pdt-fl` → `atd-fl`) et l'espacement des
lignes, VOLONTAIREMENT plus grand ici (`margin:16px 0` contre `6px 0` en
2.1.10, demande explicite « espacer les lignes un peu plus ») : une phrase
plus longue (l'unité de l'énoncé, nommée en toutes lettres) et deux flèches
au lieu d'une paire courte ont besoin de plus de respiration. La case
`atdK` (le facteur) n'existe QUE quand une multiplication reste à faire —
jamais quand le pourcentage cherché EST 5 %, où trouver 5 % suffit déjà,
exactement comme `pdtK` en 2.1.10.

**La soustraction facultative ne suit personne : elle est déjà connue.** En
{augmenter-dix} (2.2.11) et {augmenter-taux-addition} (2.2.6), la pose
facultative suit des cases que l'ÉLÈVE remplit lui-même (`poseOpEleveMAJ`
relit `adxA`/`adxB` ou `g4a`/`g4b` à chaque frappe, parce que ces nombres
n'existent nulle part avant que l'élève les tape). Ici, les deux opérandes de
la soustraction (`q.fin` et `q.N`) sont connus dès le tirage de la question —
ils sont écrits dans l'énoncé lui-même. Passer par `poseOpEleveMAJ` aurait
donc fait suivre par la pose une saisie qui n'existe pas : `buildPoseSub`
est appelé UNE FOIS, à l'affichage de la question, avec les deux valeurs
connues, et la pose ne bouge plus ensuite — jamais cachée par un
`step-hidden`, contrairement aux trois exercices qui l'ont précédée. Elle
suit la même règle de notation que les trois : ses cases (`.mp-box`,
`.mp-carry`) ne comptent JAMAIS dans `allOk`, seulement si l'élève y touche
(`engaged`), avec les mêmes pastilles ✓/✗ et corrections `.mp-fix`/`.sol`.

**Les autres branchements n'ont pas bougé.** `test.kind` reste `'atd'`,
`genAtd`/`startAtd`/`checkAtdAnswer`/`nextAtdQuestion`/`finishAtd` gardent
leurs noms — seul `renderAtd` change de forme, et `checkAtdAnswer` note
désormais `atd0`/`atd5`/`atdK`/`atdP` au lieu de `atd1`/`atd2`/`atd3`/`atd4`.
`TESTS`, `THEMES`, `testScreens`, `afficherEcranDe`, `restartCurrentTest`,
`liveCheckCurrent`, `RAPPELS_ID` (le rappel de cours décrit la MÉTHODE, pas
les cases à l'écran : il reste juste tel quel), `QIA_SUGG` n'ont donc rien à
changer ; seule la branche `k==='atd'` de `conseilCtxCourant()` a suivi le
nouveau jeu de cases, pour ne jamais donner au modèle un identifiant qui
n'existe plus à l'écran.

---

**Puis Turquet a précisé : « je voulais qu'il soit présenté avec un schéma
exactement comme sur le pdf ».** Le paragraphe ci-dessus décrit le premier
jet — le moteur QCM+chaîne du 2.5.1, réutilisé tel quel — et il répondait à
la MAUVAISE lecture de la fiche : celle-ci ne fait choisir aucune
proposition, elle fait remplir un SCHÉMA EN BOÎTE, exactement comme
{pourcentage-boite} (ce paragraphe garde la trace du premier jet ; l'énoncé
diversifié et l'entier garanti, eux, n'ont pas changé — seul le RENDU était
faux). Le schéma refait : **[Avant]** → un oval « × (1 + …) » ou « × (1 − …) »
selon le sens, puis « × … » pour le coefficient → **[Après]** — et, pour
l'inconnue « pourcentage », une flèche « −1 » vers une case de plus, le
pourcentage retrouvé.
**KIND « evb », PROPRE À CET EXERCICE — plus « psyn » : la présentation
n'a plus rien de commun avec les trois synthèses à propositions.** Écran
neuf (`scr-evbtest`), rendu neuf (`renderEvbTest`/`checkEvbAnswer`), mais
**AUCUNE ARITHMÉTIQUE RÉÉCRITE** : `startSynEvol` continue d'appeler
`genSyn('aug'|'dim', …)` à l'identique — mêmes énoncés diversifiés
(`synTab`/`variante`, déjà partagés), même garantie d'entier — seul ce que la
page en FAIT change. Les cases sont TOUJOURS VIDES, même les nombres que
l'énoncé donne déjà — la convention de {pourcentage-boite}, portée ici : une
case qui pourrait deviner sa réponse dans l'énoncé n'aurait rien à montrer.
**« evb » suit {pourcentage-boite} jusque dans ce qu'il NE FAIT PAS** :
ni dans `PCT_KINDS` (le contexte envoyé au modèle retombe sur `ctxVisible()`,
la lecture générique de l'écran — {pourcentage-boite} n'y est pas non plus),
ni dans la table `RAPPELS` par kind (le rappel de cours passe par un
override `RAPPELS_ID['synthese-evolutions']`, comme
`RAPPELS_ID['pourcentage-boite']`) — et « Recommencer » route par le chemin
GÉNÉRIQUE de `restartCurrentTest()` (`TESTS[currentTestId].start()`), pas par
`restartPct()`, puisque « evb » n'y figure plus. Trois précédents suivis à la
lettre, pas trois oublis.
Le contrôle dédié a dû être REFAIT en entier — il vérifiait un QCM qui n'existe
plus — et tient désormais les CASES elles-mêmes : le signe affiché dans la
parenthèse (+ à la hausse, − à la baisse, lu dans le DOM, pas supposé), la
cinquième case qui n'apparaît que pour l'inconnue « pourcentage » (et son
absence sur les deux autres), et le verdict case par case sur deux copies
ÉPINGLÉES — une hausse, une baisse — juste puis fautive d'une seule case,
plus une case laissée vide qui ne rougit jamais.

**Et la flèche « −1 » a changé de bord une seconde fois (Turquet, septembre
2026, deuxième pose).** La première pose l'accrochait à la case du
coefficient (dans la même rangée `.pctb-af`, à sa droite) : lue au premier
degré, elle se lisait comme une annotation DE cette case-là, alors qu'elle
relie DEUX cases — celle du pourcentage au-dessus, celle du coefficient en
dessous. Le correctif la déplace dans `.pctb-shaft`, le trait de la grande
flèche qui sépare déjà les deux rangées, et la pose en absolu à sa droite
(`left:100%`, centrée verticalement sur le trait) : elle se lit maintenant
ENTRE les deux cases, exactement là où l'aller-retour qu'elle décrit a lieu.
Aucune case ni aucun jugement n'a bougé — seul le contrôle qui vérifiait sa
présence (`#evbHost .evb-rev-arrow`) continue de la trouver, où qu'elle soit
posée dans le DOM.

**Troisième pose, le même mois : « exactement entre la case du bas et la
case du haut, au milieu de la grande flèche noire ».** Turquet a joint la
capture : la deuxième pose mettait bien la flèche AU NIVEAU du trait, mais à
son bout droit (`left:100%`), c'est-à-dire collée à la boîte « Après » — lue
à l'écran, elle annotait la boîte d'arrivée, pas l'aller-retour entre les deux
cases du milieu. Le correctif la centre sur le trait dans les DEUX sens
(`left:50%; top:50%; transform:translate(-50%,-50%)`) : elle tombe à
l'aplomb des deux cases, entre elles. Deux conséquences, tenues ensemble :
un texte posé sur un trait est barré par lui — la flèche porte donc un fond
blanc, comme les cases du schéma sur le quadrillage — et le trait, à 4 px
des deux rangées, laissait la flèche mordre de 2 px sur le cadre de chaque
case ; `#evbHost .pctb-shaft` écarte le trait à 14 px, ce qui lui donne
11 px de jour de chaque côté (mesuré à 1280 px). L'écart vaut pour les trois
inconnues, pas seulement celle qui montre la flèche : le schéma garde la même
hauteur d'une question à l'autre.
**Et cette fois la pose se MESURE.** Deux poses avaient passé le banc jsdom
au vert, parce qu'il ne vérifie que la présence de `.evb-rev-arrow` — une
flèche posée n'importe où l'aurait contenté. Le banc navigateur gagne une
section (« 6 quater decies ») qui ouvre l'exercice, se place sur la question
à inconnue « pct » par `renderEvbTest()`, et mesure le rendu : centre de la
flèche sur celui du trait, horizontalement et verticalement, à 2 px près ;
flèche ENTRE les deux cases sans toucher leur cadre ; et à égale distance des
deux, à 3 px près. L'exercice se déclare dans `tests/profils.js`
(`syntheseEvolutions`) ; les deux autres niveaux, qui n'ont pas le schéma,
passent par `ignorer()`.

---

## {augmenter-taux-dix} — la ligne de l'écart, EN LIGNE, restaurée en tête (Première, septembre 2026)

**D'où ça vient.** Après la refonte en deux lignes fléchées (section
ci-dessus), Turquet a rouvert la fiche PDF et pointé sa toute première ligne,
absente du nouvel écran : « je veux qu'il y ait toujours la ligne au début de
la résolution du calcul de l'écart en ligne comme dans le pdf joint ». La
fiche s'ouvre en effet sur « Le prix à augmenter de ..... − ...... = ....... € »
AVANT même la ligne des 10 % — une phrase EN LIGNE (horizontale, comme le
reste de l'écran), pas la soustraction posée en colonnes.

**Une confusion à ne pas faire : « en ligne » ne veut pas dire « posée ».**
La refonte précédente avait retiré l'écart comme case à trouver, remplacé par
l'augmentation affichée EN CLAIR dans la ligne fléchée du bas, et avait ajouté
une soustraction FACULTATIVE mais POSÉE EN COLONNES (`atdSub`,
`buildPoseSub`). Cette dernière n'a rien à voir avec la demande : elle reste
en place, elle est POSÉE, jamais EN LIGNE, et jamais obligatoire. Ce qui
manquait, c'est la phrase que la fiche écrit AVANT toute case posée — une
ligne comme les autres de `.pct10-ligne`, dans la continuité du texte, avec
UNE seule case à compléter (le résultat ; N et fin restent en gras, jamais
retapés — la convention constante de tout le thème 2, jamais celle de la
fiche papier qui, elle, fait réécrire les deux opérandes).

**`atd1` revient, à la place exacte qu'il occupait avant la refonte, EN
PREMIÈRE ligne de l'écran** : « {sujet} a augmenté de **fin** − **N** = ▢
{unité} », de nouveau une case NOTÉE (elle rejoint `allOk`, avec sa
correction `corTrainDec` et sa coloration `liveColorDec`, comme avant la
refonte). Elle est numériquement REDONDANTE avec l'augmentation montrée en
clair dans la ligne fléchée du bas — et c'est voulu, pas un oubli : la fiche
fait exactement cela, calculer le même écart par deux chemins (une
soustraction directe, puis 10 % multiplié par le bon facteur) pour que
l'élève VÉRIFIE que les deux méthodes retombent sur le même nombre. Le même
motif existe déjà ailleurs dans le thème — {augmenter-dix} (2.2.11) fait
ÉCRIRE l'addition `N + augmentation = total` en ligne ET propose, EN PLUS,
la même addition posée en colonnes comme appui facultatif — seule la nature
de la redondance change : ici c'est le MÊME calcul refait par une AUTRE
méthode, pas le même calcul reposé sous une autre forme.

**Rien d'autre n'a bougé.** `orderIds` gagne `'atd1'` en tête (avant `'atd0'`),
la navigation au clavier et l'ordre de tabulation le suivent automatiquement,
puisqu'ils se construisent depuis ce tableau. `checkAtdAnswer` note `ok1`
comme les quatre autres cases, sans toucher au calcul de `allOk` au-delà d'y
ajouter ce cinquième terme. Le commentaire de tête de l'exercice et la
branche `k==='atd'` de `conseilCtxCourant()` ont suivi, pour que le contexte
envoyé au modèle décrive le même écran que celui que l'élève voit — la même
discipline que la refonte précédente.

## {augmenter-taux-dix} — plus de division devant les cases, conclusion recentrée sur le pourcentage (Première, septembre 2026)

**D'où ça vient.** Demande de Turquet : « je ne veux voir aucune division ou
fraction devant les cases à remplir quand on calcule 10 % ou 5 % d'un
nombre », et « remplacer la phrase de conclusion par "donc le pourcentage
d'augmentation est de ..... %" ». Les deux lignes fléchées écrivaient jusque
là `N/10 = ▢` et `N/20 = ▢` avant les cases (`frac10`, `frac20`, posées via
`mlTex`) — exactement ce que {pourcentage-dix-taux} (2.1.10), dont l'écran est
pourtant le jumeau par la PRÉSENTATION (section ci-dessus), ne fait déjà pas :
`renderPdt` n'a jamais affiché cette division. L'écart entre les deux jumeaux
n'était donc pas voulu, seulement hérité du tout premier jet de l'exercice.

**Les deux fractions retirées, sans toucher au calcul.** `frac10` et `frac20`
disparaissent ; les lignes deviennent « 10 % de N {unité} est : ▢ {unité} » et
« 5 % de N {unité} est : ▢ {unité} ». `mlTex` reste utilisé ailleurs dans le
fichier (2.1.8, 3.1.4) : rien à toucher là-bas, la fonction ne perd qu'un
appelant.

**La phrase de conclusion ne réaffiche plus l'augmentation.** Avant : « donc
▢ % de N {unité} est **aug** {unité}. » — la valeur de l'augmentation y était
VOLONTAIREMENT reprise en clair (section ci-dessus, « une ligne restaurée en
tête ») pour que l'élève vérifie que la soustraction directe (`atd1`, en tête
d'écran) et la méthode par les 10 % retombent sur le même nombre. Turquet a
tranché : cette redite disparaît, la ligne se limite à « donc le pourcentage
d'augmentation est de ▢ %. » (précédée de « On multiplie par ▢ : » quand une
multiplication reste à faire, comme avant). Le double calcul de l'écart
(`atd1` en tête, puis 10 % × le bon facteur) reste noté et vérifié exactement
comme avant — seul ce qui s'AFFICHE en fin de ligne change, `checkAtdAnswer`
et son message d'erreur ne bougent pas.

**Un piège en cascade : la disparition du `<span id="atdFlValDst">`.** La
seconde flèche de `atdPoints`/`atdDessinerFleches` reliait la case des 10 %
(ou 5 %) à ce span, pour montrer visuellement que sa valeur et l'augmentation
réaffichée coïncident. Le span n'existant plus, laisser `atdPoints` le
chercher aurait fait échouer CHAQUE lecture (`if(!srcVal || !dstVal) return
null`) et supprimé les DEUX flèches, y compris la première qui reste, elle,
pleinement valide. `atdPoints` et `atdDessinerFleches` sont donc réduits à une
seule flèche — du « 10 % »/« 5 % » de départ vers le pourcentage trouvé
(`atdP`) — plutôt que d'être copiés-collés avec une branche morte : la
présentation garde EXACTEMENT ce qu'il reste de sens à montrer.

## {synthese-augmentations-dix} — la synthèse des hausses, avec la méthode des 10 % (Première, septembre 2026)

**D'où ça vient.** Demande de Turquet : « en première faire un exercice comme
le 2.2.9, mais on rajoute la méthode "en passant par 10 %", qui sera
présentée comme le 2.2.11 quand on calcule la valeur finale et comme le
2.2.12 quand on cherche le % d'augmentation ». L'exercice arrive en fin de
sous-thème, {synthese-augmentations-dix} (2.2.13) : il suppose les deux
exercices de la méthode des 10 % déjà vus, et il ne touche pas au 2.2.9.

**Même moteur, pas même identité — pour la troisième fois.** Le motif du
2.3.8 : `startSynAugDix` épingle `test.qId`, « Recommencer » route par
l'identité, la note part sous `test.qId`, le rappel vit dans `RAPPELS_ID`
(le kind `syn` est partagé par quatre exercices, il ne peut porter le
rappel de celui-ci). `genSyn` a appris un TROISIÈME paramètre facultatif
(`{dix:true}`), après la famille et l'inconnue : un second générateur aurait
fini par diverger. Et c'est LA QUESTION qui porte le réglage (`q.dix`), pas
le démarreur : la reprise d'une pause relit la question, jamais le
démarreur — un troisième bouton accroché à `test.qId` aurait disparu à la
reprise, ou serait apparu sur un 2.2.9 repris sous une mauvaise identité.

**Le tirage : des taux que l'on RETROUVE depuis 10 %.** Le 2.2.9 tire ses
taux pour que le coefficient s'écrive court (un multiple de dix, ou un
chiffre) ; 3 % y est un bon taux, et il ne se retrouve pas depuis 10 %. Le
2.2.13 prend donc EXACTEMENT les formes des deux exercices qu'il cite : pour
CALCULER une valeur (la nouvelle valeur, ou la valeur initiale proposée),
les trois formes du 2.2.11 — un multiple de dix de 20 à 90, 5 % (la moitié
de 10 %), 15 % (10 % + 5 %) ; pour RETROUVER le pourcentage, les deux
familles du 2.2.12 — les mêmes multiples de dix, ou 5, 15, 25 par la moitié
de 10 % (`ATD_PCTS_DIX`, `ATD_PCTS_CINQ`, réutilisées telles quelles). Jamais
10 % lui-même : la ligne « 10 % de N » serait déjà la réponse. N reste un
multiple de 100 (10 % et 5 % tombent sur des entiers), les coefficients
restent à deux décimales (1,05 ; 1,15 ; 1,25 — la règle du 2.5.1 tient), et
les leurres du pourcentage viennent du même vivier, 10 % compris (le « 10 % »
de départ est le leurre naturel) — jamais 3 % ou 7 %, qu'aucune ligne de
l'écran ne saurait produire. Les leurres de la valeur initiale
(`leurresProches`) sont des multiples de dix : 10 % en reste entier, et 5 %
au pire à une décimale (90 → 4,5), ce que le 2.2.11 accepte déjà.

**Deux présentations, et deux JUGES — c'est là que la demande a demandé une
décision.** Les deux méthodes du 2.2.9 jugent le calcul SUR LA PROPOSITION
CHOISIE (`synCouple`) : un calcul juste sur une mauvaise proposition reste
juste, et c'est la vérification qui révèle que la proposition ne convient
pas. La méthode des 10 % pour CALCULER une valeur s'y plie sans effort — les
lignes du 2.2.11 (10 % de N avec sa fraction, l'augmentation ligne à ligne,
départ + augmentation) se lisent sur le couple testé : pour la valeur
INITIALE, on fait grandir la proposition, et la dernière case doit retomber
sur la valeur finale de l'énoncé ; les cases `y4a`/`y4b`/`y4r` sont celles
de la méthode directe, et la pose facultative de l'addition les suit sans
qu'on y touche. Mais la méthode des 10 % pour RETROUVER le pourcentage — les
lignes du 2.2.12 : l'écart en tête, 10 %, 5 % s'il le faut, « On multiplie
par ▢ : donc le pourcentage d'augmentation est de ▢ % » — est un calcul qui
PART DES DONNÉES et n'a aucune case où une proposition entrerait : il ne
connaît pas de proposition, il trouve LE pourcentage. Le juger « sur le
couple » aurait demandé à l'élève de recopier sa proposition dans la
dernière case et d'écrire un facteur qui ne mène à rien de vérifiable : ce
n'est pas une vérification. Ce chemin-là est donc jugé sur les données, et
le pourcentage TROUVÉ se compare ensuite au pourcentage CHOISI — en soutien,
« Ton calcul est juste : le pourcentage d'augmentation est 30 %, et ce n'est
pas la proposition que tu as choisie » ; en entraînement, « Calcul juste,
mais mauvaise proposition : le pourcentage trouvé est 30 % ». La flèche
courbe de la fiche (`synDessinerFleches`, sur `pdtArc` réutilisé tel quel),
la classe `syn-fl` posée par `renderSynTest` pour LA question affichée, et
la soustraction posée FACULTATIVE construite une fois (`buildPoseSub`, ses
deux termes sont ceux de l'énoncé) sont les copies conformes de
`renderAtd` — `updateSynPose` sait que cette pose-là ne se reconstruit pas.

**Ce que le contrôle tient** (`tests/verifier.js`, « 2.2.13 »), deux
contrôles, quatre bords : le tirage (hausses seules, les trois inconnues,
`q.dix`, les taux et leurres ci-dessus, les deux formes vues pour chaque
inconnue, « Recommencer ») ; le 2.2.9 qui NE CHANGE PAS (ni troisième
bouton, ni « 10 % » dans le message qui réclame une méthode) ; l'écran (les
lignes du 2.2.11 pour 15 %, les lignes du 2.2.12 pour 15 %, 5 % sans
facteur ni flèche, un multiple de dix sans ligne des 5 %, la soustraction
posée dès l'affichage) ; le juge (la copie juste vaut le point sur les trois
inconnues ; sur une proposition fausse, le calcul juste est dit juste — sur
la proposition pour la valeur initiale, sur les données pour le pourcentage,
le pourcentage trouvé nommé — et en soutien l'écran reste ouvert, puis la
bonne proposition vaut le point sans retaper le calcul). Les règles
universelles (taille des cases, case vide, bouton d'aide IA, clavier) sont
tenues par le banc navigateur sans rien déclarer : l'écran est celui du
2.2.9.

## {synthese-diminutions-dix} — le miroir sur les baisses (Première, septembre 2026)

**D'où ça vient.** Le jour même du 2.2.13 : « fais pareil pour les
diminutions (2.3.8, avec le 2.3.10 et le 2.3.11) ». L'exercice arrive en fin
de sous-thème, {synthese-diminutions-dix} (2.3.12) : la synthèse des baisses
du 2.3.8, avec le même troisième bouton « En passant par 10 % ».

**Rien de neuf dans le moteur, seulement le SENS.** Le tirage passe par
`genSyn('dim', inc, {dix:true})` — la porte `dix` était déjà indépendante du
sens, seuls ses commentaires nommaient les hausses. Le rendu et le juge de la
méthode des 10 % lisent `q.sens` là où le 2.3.10 et le 2.3.11 diffèrent de
leurs jumeaux : « donc : la baisse de P % de N est ▢ », « la valeur diminuée
est ▢ − ▢ = ▢ » (une soustraction s'écrit dans l'ordre, départ puis baisse —
la règle de la méthode directe, reprise telle quelle : pas de termes
inversés acceptés, pas de correction inversée), la soustraction posée en
pose facultative ; pour le pourcentage, l'écart « a diminué de N − fin = ▢ »
et « donc le pourcentage de baisse est de ▢ % », la soustraction posée
`N − fin`. Les messages (« le pourcentage de baisse est 30 % »), la preuve, le
contexte envoyé au modèle ({diminuer-dix}, {diminuer-taux-dix}), le corrigé
type et le rappel (`RAP_SDD`) suivent. Le tirage des leurres de la valeur
initiale est celui du 2.3.8 : des multiples de dix, 10 % en reste entier.

**Un seul contrôle, joué deux fois.** Le contrôle du 2.2.13 est devenu
`syntheseDix(w, P, CFG)`, appelé avec la configuration de chaque sens :
l'identité, le démarreur, la famille, le signe, la synthèse témoin qui ne
doit pas changer (2.2.9 / 2.3.8), et les mots à lire à l'écran (« la valeur
diminuée est », « la baisse de 15 % de N », l'écart dans le bon ordre, « a
diminué de », « le pourcentage de baisse est de »). Les quatre bords sont
donc tenus des deux côtés sans avoir été recopiés : un recopiage aurait fini
par diverger, c'est la leçon des générateurs, appliquée aux contrôles.

---

## {synthese-diminutions-libre-dix} — la synthèse rédigée des baisses qui accepte la méthode des 10 % (Première, septembre 2026)

**D'où ça vient.** Demande de Turquet : « en Première, faire un exercice
exactement comme le 2.3.9, mais où l'on accepte en plus la méthode en passant
par 10 % ». Et les MINIMUMS de rédaction, fixés par lui : quand on calcule
la valeur finale, « 10 % = … ; 70 % = … ; … + ou − … = … » ; quand on
cherche un pourcentage, la même méthode, ou bien « 10 % = … ; … − … ou
écart = … ; augmentation ou diminution de … % ». L'exercice arrive en fin de
sous-thème, {synthese-diminutions-libre-dix} (2.3.13), après le 2.3.12 comme
le 2.3.9 suit le 2.3.8 : la synthèse RÉDIGÉE des baisses, avec une voie de
plus. Le 2.3.9 ne change pas d'un iota — c'est un bord du contrôle.

**Le tirage est celui du 2.3.12, pas celui du 2.3.9** : `genSyn('dim', inc,
{dix:true})` — des taux qui se RETROUVENT depuis 10 % (multiples de dix,
jamais 10 lui-même ; 5, 15, 25). « Exactement comme le 2.3.9 » aurait tiré
3 % ou 7 %, que 10 % ne donne pas : l'exercice promettrait une voie que la
question interdit. Et `q.dix`, que `genSyn` range déjà dans la question, est
la porte que lit le juge — la reprise d'une pause relit la question, jamais
le démarreur ; le 2.3.9, dont les questions n'ont pas `q.dix`, garde son
juge d'avant.

**Le juge apprend à lire des lignes en POURCENTS et en MOTS.** La grammaire
des nombres (`salExpr`) ne lit ni « 10 % = 60 » ni « écart = 180 » ni
« diminution de 30 % » : ces lignes étaient des écritures inconnues, qui
livraient la copie entière au modèle — et un verdict arithmétique ne se
confie pas à un modèle. Trois lecteurs, gardés par `q.dix` :
`salDixPct` (« k % [de M] » en tête de ligne AFFIRME k % de M, M étant la
valeur initiale s'il n'est pas écrit), `salDixEcart` (« écart » ou
« différence » en tête de ligne AFFIRME l'écart), `salDixConclusion`
(« diminution/baisse/augmentation/hausse de k % » sur une ligne sans « = »
est la CONCLUSION, avec son sens et son pourcentage). `salDixLigne` lit les
deux premiers et rend un verdict de ligne : illisible (le juge s'abstient),
fausse (nommée), vraie — et c'est lui que `salPeindreLignes` appelle aussi,
pour que ces lignes se peignent comme les autres.
**Elles se lisent sur le texte tel que MathLive le rend**, mesuré au
navigateur avant d'écrire une ligne du juge : l'éditeur retire les espaces,
écrit le pourcent « \% », et « diminution » ressort « di\minution » parce
que « min » est un raccourci de MathLive (« in » en est un autre, qui devient
« ∈ » à l'aplatissement). `salDixNorm` retire donc barres et espaces, met en
minuscules sans accent, et rend « ∈ » à « in » : « di\minutionde30\% » se
lit « diminution de 30 % ». Le modèle est prévenu de la même chose dans
l'énoncé qu'on lui envoie.

**Les deux formes, et leurs minimums.** Pour une valeur (finale, ou
initiale choisie) : `dixOk` (« 10 % » de la valeur initiale, vrai) ET
`pctP` (« P % = … », P étant la proposition choisie) ET `addOk` (la
soustraction qui donne la valeur finale — déjà là) ; ou `dixOk` ET
`pctCoef` (« (100 − P) % = valeur finale » d'un coup). Pour un pourcentage :
la même, ou `dixOk` ET `ecartOk` ET `conclOk`. L'ÉCART se juge contre
l'ÉNONCÉ, pas contre la proposition : quand on cherche le pourcentage,
départ et arrivée sont tous deux dans l'énoncé, et « écart = 120 » écrit par
un élève qui a choisi 20 % est FAUX — c'est le fait prouvable qui le remet
sur la voie, sans lui donner le nombre. La CONCLUSION se juge sur deux
faits : son sens contre l'énoncé (« augmentation de 30 % » sur une baisse
est refusée en nommant le sens), son pourcentage contre la proposition
CHOISIE (« diminution de 20 % » avec 30 % coché : « mets-les d'accord »,
sans dire lequel a raison). Quand tout est vrai mais la proposition fausse
par l'écart, la phrase ne dit pas « ton calcul est cohérent » — il ne l'est
pas : « ton écart et tes 10 % sont justes, mais ta conclusion ne s'accorde
pas avec eux ». Sans la ligne « 10 % », ce n'est pas la méthode des 10 % —
et « 30 % = 180 » sans multiplication écrite n'est pas non plus la voie de
la diminution : le refus nomme les deux (« la ligne « 10 % = … », ou la
multiplication qui calcule la diminution »). Un refus sur la voie des 10 %
nomme ce qui manque À SA FORME, jamais la bonne proposition : le contrôle
passe cinq refus sur la mauvaise proposition au peigne du nombre juste.

**Tout ce qui nomme les voies a suivi**, par le troisième argument de
`salVoiesTexte(s, c, dix)` : l'étiquette de la feuille, le message de la
feuille vide, le refus du juge, le contexte de l'aide. La règle du modèle
compte QUATRE voies et écrit la quatrième avec les nombres de la proposition
choisie — et elle a frôlé la borne de la fonction Edge au premier passage
(3713 caractères pour 4000, marge exigée 300) : resserrée à 3581. L'indication
sous la feuille dit où est la touche « % » et que l'écart et la conclusion
s'écrivent en mots. Le rappel (`RAP_SDLD`), les questions à l'IA, le numéro
2.3.13 et la route de « Recommencer » font l'identité.

**Le contrôle** (`syntheseDimLibreDix`, banc principal) tient sept bords —
le tirage, le juge cas par cas sur des questions épinglées (les deux formes
acceptées, celles à qui il manque une ligne, la ligne fausse nommée, la
copie telle que MathLive l'aplatit, la conclusion contredite, la mauvaise
proposition), le 2.3.9 inchangé (ses lignes restent inconnues, son étiquette
et sa règle ne promettent rien), les refus qui ne donnent jamais la bonne
proposition, l'écran et la peinture, la règle et sa borne, l'identité.
Éprouvé par six sabotages, chacun rougissant en nommant son défaut : la
ligne « 10 % » plus exigée, le 2.3.9 qui tire des questions `q.dix`, les
barres de MathLive plus retirées, l'écart plus jugé contre l'énoncé, la
conclusion plus comparée au choix, la peinture qui ignore les lignes des
10 %.

**Puis la barre d'espace a ÉCRIT une espace** (demande de Turquet, le jour
même : « il faut afficher les espaces quand on appuie sur espace »). La
feuille du moteur `sal` est en mode « calcul », où MathLive AVALE l'espace :
sa convention veut qu'elle SORTE d'un indice ou d'une fraction, et n'écrive
rien ailleurs — ce qui convient à des lignes de nombres, pas à un élève qui
tape « diminution de 30 % » et voit « diminutionde30% ». `renderSal` pose
donc `mathModeSpace` (« `\;` ») sur chaque ligne quand la question porte
`q.dix` — les lignes qui existent, et celles que « Entrée » fera naître,
d'où `salEspaces` qui enveloppe `F.ajouterLigne` — SANS toucher à
`mlFeuille`, qui est le même texte dans les trois fichiers et qu'un contrôle
compare au caractère près. Le 2.3.9 ne change pas d'un iota : c'est un bord
du contrôle. Et l'espace SORT toujours d'une fraction : `mathModeSpace`
éteint cette convention, et c'est la leçon de la récurrence rédigée de la
Terminale (`rrEspace`) reprise telle quelle dans `salEspaceSort`, en capture
sur la feuille — un élève qui tape « 180/600 » resterait sinon prisonnier
du dénominateur, toute la suite de sa ligne tombant dedans. Le juge n'a rien
eu à apprendre : `toPlain` rendait déjà « `\;` » en une espace, `salDixNorm`
retire les espaces, et `salExpr` les saute — la copie ESPACÉE se lit comme
la copie collée, ce que le banc principal mesure sur le vrai `toPlain`
injecté depuis la source. La règle envoyée au modèle dit désormais que
l'éditeur « peut retirer les espaces » (l'élève n'en tape pas toujours), à
longueur égale — la borne de la fonction Edge ne laisse qu'une centaine de
caractères. Le banc navigateur (« la synthèse des pourcentages rédigée »,
étape 3) tape la copie sur un vrai MathLive : les espaces se voient dans la
lecture, la fraction se referme avant le « = », le juge accepte, la note
compte, les lignes se peignent. Deux pièges de banc en passant : le compte
des espaces d'une ligne à deux espaces fait TROIS morceaux, pas quatre ; et
le mot « espaces » est exigé dans la règle du modèle par un contrôle qui
existait déjà — une reformulation qui l'oublie rougit à bon droit.

**Puis le 2.3.9 a suivi, le lendemain** (« fais pareil pour le 2.3.9 »). Le
bord « le 2.3.9 ne change pas d'un iota » ne tenait que le JUGE et le
tirage : il les tient toujours. La feuille, elle, écrit désormais les
espaces aussi — non par la question, que `genSyn('dim', inc)` ne marque
pas, mais par l'IDENTITÉ de l'exercice : `SAL_ESPACES` nomme le 2.3.9, et
`salEspacesPour(q)` lit `q.dix` OU `test.qId`. `test.qId` est fiable à la
reprise : `resumeTest` recopie toutes les clés du brouillon dans `test`, et
« Recommencer » s'y fie déjà pour relancer le bon démarreur. Le 2.2.10 et le
2.5.2 gardent la feuille d'avant, et c'est le nouveau bord opposé du
contrôle (`startSynAugLibre`, `mathModeSpace` absent). Le banc navigateur
(étape 4) tape sur le 2.3.9 la voie de la diminution avec des espaces
autour des signes, sur un vrai MathLive, et relit la lecture, le verdict,
la note et la peinture.

**Puis « pareil pour le 2.2.10 et le 2.5.2 »** — et la porte par exercice
est tombée : `renderSal` pose les espaces sur les QUATRE exercices du moteur
rédigé, sans `SAL_ESPACES` ni `salEspacesPour`, qui n'ont vécu qu'une
version. Une porte qui laisse tout passer n'est plus une porte, et une
liste qu'on croit sélective est pire qu'aucune liste — c'est la leçon de
`MENU`. Les juges ne changent pas : `toPlain` rend « `\;` » en espace,
`salExpr` les saute, `salDixNorm` les retire. Le contrôle du banc
principal vérifie `mathModeSpace` et l'indication sur les quatre démarreurs
(`startSynAugLibre`, `startSynLibre` ont rejoint la liste, et le bord
« le 2.2.10 n'a pas changé » est devenu son contraire). Au banc navigateur,
le profil nomme le 2.3.9 et le 2.2.10 avec leur famille (`espacesAussi`),
l'étape 4 les tape l'un après l'autre avec des espaces autour des signes,
et l'étape 2 tape désormais le 2.5.2 de la même façon.

**Puis, sur tablette, le clavier B des lettres et la touche espace** (« il
faudrait un clavier B avec l'alphabet, et la touche espace sur le clavier
A et B », Turquet, septembre 2026). La feuille du 2.3.13 est devenue une
feuille de RÉDACTION — `renderSal` la crée en mode « redaction » quand la
question porte `q.dix` : la classe `mf-mots` que le clavier des lettres
cherche, et la liste blanche des raccourcis, si bien que « diminution » ne
s'écrit plus « di\minution » (le juge, lui, lisait déjà les deux). Le 2.3.9
garde sa feuille de calcul : c'est le bord opposé. La touche « espace » à
l'écran sort d'une fraction par `beforeinput`, l'autre porte que le
`keydown` de la barre physique. Le clavier lui-même, sa largeur et ses
bancs sont racontés dans `15-clavier-et-tablette.md` (« Puis la Première a
eu son clavier B »).

---

## {synthese-augmentations-libre-dix} — le jumeau du 2.3.13 sur les hausses (Première, septembre 2026)

**D'où ça vient.** Demande de Turquet : « en première fais le même exercice
que le 2.3.13 mais pour les augmentations ». L'exercice arrive en fin du
sous-thème 2.2, {synthese-augmentations-libre-dix} (2.2.14), après le 2.2.13
comme le 2.3.13 suit le 2.3.12 : la synthèse RÉDIGÉE des hausses (le
2.2.10), avec la voie des 10 % en plus. Le 2.2.10 ne change pas d'un iota —
c'est un bord du contrôle, comme le 2.3.9 l'était pour le 2.3.13.

**Presque rien à écrire, et c'est la mesure de ce que le 2.3.13 avait bien
fait.** Le moteur rédigé (`sal`) lit le SENS de la question par `salSens`
partout où le sens compte : `salVoiesTexte` (l'étiquette de la feuille, le
message de la feuille vide, le refus du juge, le contexte de l'aide),
l'indication sous la feuille (« l'addition », « augmentation de … % »), le
juge (`addOk` cherche un « + » sur une hausse, l'écart de l'énoncé est
« arrivée − départ », la conclusion « augmentation/hausse de k % » porte
son sens et se juge contre l'énoncé), la règle du modèle (`salAttenduIA`
écrit la quatrième voie avec « + » et « augmentation de P % »). Le tirage
est celui du 2.2.13 : `genSyn('aug', inc, {dix:true})` — des taux qui se
RETROUVENT depuis 10 %, et `q.dix` rangé dans la question. Ce qui a été
écrit : le démarreur (`startSynAugLibreDix`), l'entrée de `TESTS`, la
place dans `THEMES`, la route de « Recommencer », le rappel (`RAP_SALD` :
600 augmenté de 30 % = 780, dans les trois voies), les questions à l'IA —
l'identité, et rien du moteur.

**Une seule ligne du moteur ignorait le sens**, et c'est le jumeau qui l'a
montrée : l'énoncé envoyé au modèle (`salEnonceIA`) donnait ses exemples
de lignes aplaties en dur — « diminution de 30 % », « diminutionde30% » —
et aurait donc appris au modèle, sur une HAUSSE, à lire une conclusion
dans le mauvais sens. Elle suit le sens désormais, et le contrôle tient ce
bord (l'énoncé écrit « augmentation de 30 % » sur une hausse, jamais
« diminution de 30 % »).

**Le contrôle est CELUI du 2.3.13, joué deux fois** — pas une copie.
`syntheseDimLibreDix` est devenu `syntheseLibreDix(w, P, S)` sur une fiche
`SYN_LIBRE_DIX` qui porte, pour chaque jumeau, le sens, les nombres des cas
épinglés (600 diminué de 30 % = 420 ; 600 augmenté de 30 % = 780 ; 15 % :
510 et 690 ; la valeur finale d'un coup : « 70 % = 420 » et « 130 % =
780 » ; la mauvaise proposition à 20 % : 480 et 720 ; le quotient :
420/600 = 70/100 et 780/600 = 130/100), le mot de la conclusion et son
contraire, l'opération et son signe, l'identité (numéro, démarreur,
l'exercice « sans » qui ne doit pas changer, les autres exercices du moteur
qui écrivent les espaces). Les trente cas du juge, les refus qui ne donnent
jamais la bonne proposition, l'écran, la peinture, la règle et sa borne,
l'identité : tout se joue dans les deux sens. Trois bords sont venus avec
le jumeau, pour les deux : la feuille est une feuille de RÉDACTION
(`mf-mots`, celle que cherche le clavier B des lettres) et celle de
l'exercice « sans » ne l'est pas ; le rappel et la description parlent
dans le bon sens (le mot de l'exercice présent, « le contraire de … % »
absent) ; après « Recommencer », les questions sont de la bonne famille.
La raison de ne pas copier est celle de toujours : la même erreur, deux
fois, n'est pas deux mesures — et un juge qui lit le sens de la question
se contrôle dans les deux sens ou ne se contrôle pas. Éprouvé par deux
sabotages, chacun rougissant en nommant son défaut sur le 2.2.14 seul :
l'énoncé au modèle remis en dur sur « diminution » ; le 2.2.14 qui tire
des baisses.

**Au banc navigateur**, l'étape 3 de la synthèse rédigée (« sur le 2.3.13
et le 2.2.14, la barre d'espace écrit une espace… ») boucle sur
`syntheseRedigee.dix`, devenu une liste d'exercices avec leur famille et
le mot de leur conclusion : la même copie — « 10 % = … », « écart = … »,
« augmentation de … % », puis la fraction dont l'espace SORT — est tapée
sur chacun, dans un vrai MathLive, et relue : la lecture, le verdict, la
note, la peinture. Un bord de plus, né de la feuille de rédaction : le mot
de la conclusion ressort ENTIER (« augmentation de » en tête de ligne) —
c'est ce que la liste blanche des raccourcis promet, et rien d'autre ne le
mesurait. Le profil nomme aussi le 2.2.14 dans `clavierEcran.lettres`
(`exercices`, et le 2.2.10 dans `hors`) : le banc du clavier B tape sur le
premier de la liste, la liste dit où la feuille de rédaction vit.

---

## {evolutions-successives} — deux évolutions de suite, la synthèse des deux schémas (Seconde, septembre 2026)

**D'où il vient.** Une troisième fiche PDF de Turquet, un seul exercice :
« *Un commerçant augmente un prix de 20 % puis de 30 %. Déterminer le
pourcentage d'évolution global.* », avec le schéma à TROIS boîtes — valeur
initiale, valeur intermédiaire, valeur finale — reliées par deux flèches qui
portent chacune un oval « × (1 + ……) » puis « × …… », une flèche « −1 » entre
les deux ; en dessous, une grande accolade relie la première boîte à la
dernière par un troisième oval « × (1 + ……) » sur « …… × …… = …… », sa flèche
« −1 » aussi ; et la phrase de conclusion « *Le prix augmente globalement de
…… %* ». La demande, en trois points : « en variant les énoncés et avec des
augmentations ou des baisses », « l'évolution globale doit être un
pourcentage entier », « on présentera l'exercice en faisant une synthèse des
exercices 4.5.4 et 4.1.9 ».

**C'est la SYNTHÈSE de deux schémas déjà en place, et rien n'est réécrit.**
De {pourcentage-chaine} (4.1.9) : les trois boîtes sans case — seulement
leur nom, la fiche n'écrit aucun nombre, exactement la décision prise sur le
4.1.9 en septembre —, la grande flèche du dessous (`.pctc-global`,
`.pctc-global-shaft`) et sa multiplication à trois cases (`.pctc-calc`) qui
donne le coefficient global en un seul calcul. De {synthese-evolutions}
(4.5.4) : sur chaque flèche, « × (1 + …) » à la hausse, « × (1 − …) » à la
baisse — le signe LU dans l'énoncé, affiché par la page —, puis « × … », et
la flèche de retour « ↑ −1 » au milieu du trait (`.evb-rev-arrow`, sa
troisième pose). Kind « evs », propre à l'exercice ; identifiant
`evolutions-successives`, 4.5.5, juste après la synthèse des évolutions dont
il prolonge le schéma. La description sur la carte le dit : « la synthèse de
{synthese-evolutions} et de {pourcentage-chaine} ».

**Ce que la fiche AJOUTE, et que ni l'un ni l'autre n'avait : le SIGNE de
l'évolution globale n'est pas donné.** Deux hausses montent, deux baisses
descendent — mais « +20 % puis −30 % » ? C'est tout le sujet de l'exercice,
et le donner dans la parenthèse globale l'aurait vidé. La parenthèse globale
s'écrit donc « × (1 [+] [−] …) » : deux boutons, le motif de
{lire-coefficient} (`.pt-choix-btn`, en plus petit pour tenir dans la
parenthèse — `#evsHost .pt-choix-btn`), et l'élève CHOISIT. Le signe choisi
est rangé dans la question (`q.gs`, `null` au tirage) : une pause le
reprend, et la phrase de conclusion de la fiche prend son verbe — « Le prix
d'un vélo **augmente** globalement de … % » dès que « + » est choisi,
« **baisse** » pour « − », « *augmente ou baisse* » en italique tant que
rien ne l'est. Une seule décision, montrée à deux endroits : deux boutons
« augmente / baisse » sous la phrase auraient demandé deux fois la même
chose. Le verdict suit {lire-coefficient} : seul le bouton CHOISI se colore
(bleu s'il est juste, rouge sinon), aucun choix ne colore rien — la règle de
la case vide, appliquée à un bouton — et en entraînement le bon signe se
montre en VERT (`.sol`), le verbe de la conclusion avec lui.

**L'évolution globale est un entier, et ça se DÉMONTRE — comme la règle des
deux décimales de {hausses-successives}.** (1 ± P1/100)(1 ± P2/100) =
1 ± P1/100 ± P2/100 ± P1·P2/10000, donc le pourcentage global vaut
±P1 ± P2 ± P1·P2/100 : entier dès que P1·P2 est un multiple de 100. Le
tirage ne prend que ces paires-là (`EVS_PAIRES`, construite d'un coup depuis
`EVS_PCTS` = 5, 10, 15, 20, 25, 30, 40, 50 : 5 et 20, 25 et 40, 30 et 50…),
dans un ordre tiré (rien ne dit lequel vient d'abord, comme `genHausses`),
et rien d'autre — pas d'arrondi, jamais de « ≈ ». Deux exclusions, nommées :
le global NUL (+25 % puis −20 % fait exactement 0 — « augmente de 0 % » n'a
pas de verbe, la phrase de conclusion ne saurait pas se dire) et ce qui
atteint 100 % (+50 % puis +50 % ferait +125 %). Les coefficients (`q.c1`,
`q.c2`, en centièmes) et le global (`q.G`, signé) sont calculés au tirage,
et le contrôle les RECALCULE pour les comparer — la formule est dans le
contrôle, pas seulement dans la page.

**Les mises en situation sont celles de {hausses-successives} et
{baisses-successives}** (`BS_CTX` : un sujet et son genre) — aucune table
neuve. Les tournures (`EVS_ENONCES`), elles, devaient dire les DEUX sens
dans la même phrase : chacune lit `q.s1` et `q.s2` (« augmente de 20 %, puis
baisse de 30 % » ; « subit une hausse de …, puis une baisse de … » ; « en un
an … a augmenté de … ; l'année suivante, il a baissé de … » ; « est d'abord
augmentée de …, puis diminuée de … » ; « gagne … puis perd … »), et la
première est celle de la fiche, au mot près — « Un commerçant augmente le
prix d'un article de 20 % puis de 30 %. Déterminer le pourcentage
d'évolution global. » —, qui ne sort que sur un prix ou un tarif (`si`),
avec un poids double. Quand les deux sens sont les mêmes, le second verbe
s'efface (« puis de 30 % ») ; quand ils diffèrent, il s'écrit (« puis
baisse de 30 % »). Une séance pose les TROIS formes, chacune une fois en
ordre mélangé — deux hausses, deux baisses, une de chaque (dans un sens ou
l'autre) — sans quoi trois hausses de suite auraient perdu le signe, tout
le sujet.

**Neuf cases et un signe, jugés un par un, une question juste ou fausse en
bloc.** Les deux écritures décimales des pourcentages et les deux
coefficients sur les flèches, le pourcentage global en décimal dans la
parenthèse, les deux coefficients REPRIS dans la multiplication et leur
produit (jugé en dix-millièmes : `fr.n*10000 === c1*c2*fr.d`), le
pourcentage global entier dans la conclusion — tous par `parseDecToFrac`,
donc « 0,2 » et « 0,20 » valent pareil ; le signe contre celui de `q.G`. Le
barème ne compte que les questions (`test.maxScore = 3`), comme les deux
exercices dont il vient. Le message d'erreur écrit toute la chaîne :
« (1 + 0,2) × (1 − 0,3) = 1,2 × 0,7 = 0,84 = 1 − 0,16 : le prix d'un vélo
baisse globalement de 16 % ».

**Ce qui suit les précédents jusque dans ce qu'il NE FAIT PAS.** Hors de
`PCT_KINDS` (le contexte envoyé au modèle retombe sur `ctxVisible()`, la
lecture de l'écran — comme {pourcentage-boite} et {synthese-evolutions}),
rappel de cours par `RAPPELS_ID['evolutions-successives']` (`RAP_EVS`),
« Recommencer » par le chemin générique de `restartCurrentTest()`. Les
quinze branchements sont faits ; deux méritent d'être nommés : `#scr-evs`
a sa réserve du bas (`padding-bottom:84px`) d'emblée — le 4.1.9 avait rougi
sur ce bord, un schéma à deux rangées déborde sur les écrans bas — et
`evs` est dans `testScreens`, sans quoi le banc de l'encadré Énoncé en
serait resté aveugle.

**Un piège d'écriture s'est montré au premier passage du banc :** le bouton
de signe portait `onclick="evsChoisirSigne('${s}')"`, et le contrôle « toute
donnée mise dans un attribut d'événement passe par escJS » l'a vu — la
valeur est un « + » ou un « − » que la page écrit elle-même, mais la règle
ne fait pas d'exception, et elle a raison : le bouton lit maintenant son
signe sur son propre `data-s` (`evsChoisirSigne(this.dataset.s)`), rien
n'est interpolé dans l'attribut.

**Ce que le contrôle tient** (`tests/verifier.js`, `evolutionsSuccessives`,
absent-déclaré sur les niveaux qui n'ont pas `startEvolSucc`), deux
contrôles : le tirage sur trente séances (identité, kind, trois questions,
P1·P2 multiple de 100, le global recalculé — entier, non nul, sous 100 —,
les coefficients cohérents, le signe non choisi au tirage, l'énoncé sans
« undefined », les trois formes chacune une fois en ordre variable, aucun
doublon, « Recommencer ») ; puis le schéma sur des copies ÉPINGLÉES — la
fiche, +20 % puis +30 % → +56 %, et +20 % puis −30 % → −16 % : les signes
affichés dans les deux parenthèses lus dans le DOM, les trois flèches
« −1 », la copie juste bleue qui vaut le point sur les deux formes (la
conclusion disant « augmente » après le choix de « + »), le MAUVAIS signe
qui rougit, coûte le point, laisse les cases justes bleues et montre le bon
signe en vert, 1,2 × 1,3 = 1,5 (les pourcentages additionnés) qui rougit
seul, une case vide et un signe non choisi qui ne colorent rien. Les règles
universelles (taille des cases, case vide, bouton d'aide IA, clavier,
couleurs des verdicts) sont tenues par le banc navigateur sans rien
déclarer.

**Puis le signe a cessé d'être CHOISI : il se LIT (Turquet, septembre 2026,
le jour même).** « Écrire le symbole ± quand on ne sait pas si c'est une
augmentation ou une diminution sur le schéma ; quand l'élève a trouvé un
coefficient, écrire + ou − à la place ; et dans la phrase réponse, écrire
uniquement augmentation ou diminution. » Les deux boutons de la première
version demandaient une décision de plus, alors que la fiche n'en demande
aucune : le signe est DANS le coefficient global — plus grand que 1, c'est
une augmentation ; plus petit, une diminution. La parenthèse globale montre
donc « ± » (`#evsPM`, le + et le − l'un sur l'autre, en retrait) tant que la
case du coefficient global est vide ou vaut 1, puis « + » ou « − » dès que
l'élève y écrit un nombre — relu à CHAQUE frappe (`evsSigneMAJ`, sur
l'événement `input` de la case, le même que la correction en direct), jamais
rangé dans la question : c'est une lecture, pas un état. La phrase de
conclusion suit le même signe et dit le mot demandé, « … subit globalement
une **augmentation** de … % » ou « … une **diminution** de … % », en
pointillés tant que rien n'est lu. Plus rien à juger de ce côté : les neuf
cases suffisent, le signe faux n'existe plus qu'à travers un coefficient
global du mauvais côté de 1 — la case rougit, et en entraînement le bon
signe et le bon mot se montrent en VERT, comme une correction. L'ordre de
saisie a suivi la résolution : le produit d'abord (`evsG1 × evsG2 = evsG`),
puis la parenthèse globale et le pourcentage, qui s'en déduisent — on ne
peut plus « choisir » un signe avant d'avoir calculé. Le contrôle a été
refait sur ce bord : le « ± » initial et les pointillés, le signe et le mot
qui suivent la frappe (0,84 → « − » / « diminution », 1,56 → « + » /
« augmentation », la case effacée ou 1 → « ± »), l'absence de tout bouton,
les copies justes sans rien à choisir, 1,16 à la place de 0,84 (rouge, bon
signe et bon mot en vert), et la case vide en soutien qui ne rougit pas et
garde son « ± ». Les valeurs y sont posées COMME L'ÉLÈVE les tape — la
valeur, puis l'événement `input` —, sans quoi le contrôle appellerait la
relecture lui-même et ne prouverait pas qu'elle est branchée.
## {pourcentage-schema} — lire un schéma de pourcentages, le 4.1.9 pris à l'envers (Seconde, septembre 2026)

**D'où il vient.** Une fiche PDF de Turquet (« Exercice 2 — successives »,
trois exercices), et une demande en une ligne : « en seconde faire un
exercice comme le pdf en variant les énoncés, les % seront toujours des
entiers, et le schéma sera fait comme dans l'exercice 4.1.9 ». La fiche est
le MIROIR de {pourcentage-chaine} : là-bas l'énoncé donne les pourcentages en
mots et l'élève construit le schéma ; ici il n'y a PAS d'énoncé chiffré — les
nombres sont écrits SUR le schéma, et l'élève le complète, puis complète
trois phrases qui le lisent en pourcentages. « Club de sport → Filles →
Basket, × 0,30 puis × 0,20, …… × …… = …… ; Dans le club de sport il y a
…… % de filles. Parmi les filles, …… % font du basket. Dans le club de sport
il y a …… % de filles qui pratiquent le basket. » Les trois exercices de la
fiche sont les trois FORMES de l'exercice, une par question, en ordre
mélangé (`q.inc`, tiré par `qdMelanger(['comb','p1','p2'])` comme en 4.1.9) :

* `comb` (exercice 1) — les deux flèches sont écrites, la rangée
  « … × … = … » est vide ;
* `p2` (exercice 2) — la première flèche et le produit sont écrits
  (« 0,30 × … = 0,06 »), la seconde flèche et sa reprise dans le calcul sont
  à trouver ;
* `p1` (exercice 3) — la seconde flèche et le produit sont écrits
  (« … × 0,50 = 0,15 »), la première est à trouver.

**Le schéma est celui du 4.1.9, au pixel.** Mêmes classes (`.pctb-row`,
`.pctb-arrow`, `.pctc-global`, `.pctc-calc`), mêmes boîtes sans case (le
nom de l'effectif seulement), même grande flèche du dessous avec sa
multiplication à trois places. Ce qui change : une place DONNÉE n'est pas
une case, c'est un nombre écrit par la page — un `span.pcs-val` qui prend
exactement la place de la case et sa TAILLE (1,7 rem, les mêmes paliers de
tablette et de téléphone que `math-field.pm-mf`). Ce n'est pas un choix
d'esthétique : le contrôle universel « les cases de saisie ont la taille des
nombres qui les entourent » voit « 0,30 » comme un nombre qui entoure la
case voisine, et une case plus petite que lui rougirait le banc — à raison,
l'élève lirait sa réponse comme une note à côté d'une donnée. `renderPcsTest()`
décide place par place avec `pcsCases(q)` : ce qui est dans la liste est une
case, tout le reste est écrit — et JAMAIS les deux, le contrôle dédié le
mesure sur les trois formes en lisant le `tagName` de chaque place.

**Les trois phrases sont toujours à compléter, et leur ordre est tiré.** La
fiche met la phrase du global tantôt en dernier (exercice 1), tantôt en
premier (exercice 2) : `q.ordre` est une permutation de `[0,1,2]` tirée à la
génération, rangée dans la question (reprise après pause) et HORS de la clé
de `distinctes()` — `ordre` est déjà dans `CLE_HORS`, un ordre d'affichage
n'a jamais fait une autre question. Chaque phrase a deux tournures (« Dans
le club de sport, il y a … % de filles. » / « Les filles représentent … %
des membres du club. »), et la consigne en a trois ; ces quatre choix vont
dans `q.v`, un TABLEAU cette fois, lui aussi hors de la clé — des habits,
pas des données. Un pourcentage écrit dans une phrase se juge en ENTIER :
`pcsEntier()` n'accepte que des chiffres, parce que `parseInt('6,5')` rend 6
et aurait compté juste une réponse fausse — le contrôle dédié pose « 6,5 »
pour le voir rougir. Les écritures décimales des flèches et du calcul se
jugent comme en 4.1.9, par `parseDecToFrac` contre P/100 : 0,2 et 0,20 sont
le même nombre, et le contrôle le remesure sur la reprise du calcul.

**Les pourcentages sont toujours des entiers — et c'est la seule règle
arithmétique de l'exercice.** Le 4.1.9 tire dans `PCT_PCTS` (multiples de
dix) : le produit est alors toujours un multiple de 100. Ici, pour VARIER les
nombres comme la demande le veut, `PCS_PCTS` est le vivier des multiples de
5 de 5 à 95, et `genPcs()` tire P1 librement, puis P2 parmi les valeurs dont
le produit avec P1 est un multiple de 100 : un multiple de 10 accepte tout
multiple de 10 ; un multiple de 5 impair (15, 25, 35, …, 95) n'accepte que
20, 40, 60 et 80 — 0,25 × 0,40 = 0,10, 0,15 × 0,20 = 0,03, 0,95 × 0,20 =
0,19. La flèche à retrouver dans les formes `p1`/`p2` se déduit donc du
produit par une division EXACTE (0,06 ÷ 0,30 = 0,2), jamais approchée. Le
contrôle dédié remesure la règle sur le global lui-même (entier, de 1 à 99)
sur quarante séances, et exige qu'un multiple de 5 impair sorte au moins une
fois — sinon le vivier annoncé n'est pas atteint.

**Huit mises en situation, `CTX_PCS`.** Les trois de la fiche (club de
sport / filles / basket, classe / filles / moyenne, entreprise / femmes /
cadres — au mot près, la fiche dit « filles » pour une entreprise, la page
dit « femmes »), puis cinq qui reprennent les libellés de `CTX_CHAINE`
(lycée, village, bibliothèque, festival) et un cinéma, pour que le schéma
se lise avec les mêmes boîtes qu'en 4.1.9. Chaque contexte porte `intro`
(ce que sont les trois boîtes, dit dans la consigne, puisque aucun énoncé
chiffré ne le dit), et `s1`, `s2`, `s3` : deux tournures chacune, des
fonctions du champ, le champ posé AVANT le « % ». Pas de `nOk` : sans
nombre de population, tout contexte convient à tout tirage.

**Les quinze branchements, et un contrôle par forme.** `TESTS`
(`pourcentage-schema`, « Lire un schéma de pourcentages »), `THEMES` (4.1.10,
juste après {pourcentage-chaine}), l'écran `scr-pcs`, `testScreens`, la
réserve du bas (`#scr-pcs{padding-bottom:84px}` d'emblée : trois rangées, le
4.1.9 avait rougi avec deux), `liveCheckCurrent()` (`pcs`), `DISPATCH`
(reprise), la liste des rendus enveloppés (`renderPcsTest`),
`RAPPELS_ID['pourcentage-schema']` (`RAP_PCS`, qui dit comment LIRE une
flèche et retrouver celle qui manque par une division), `QIA_SUGG['pcs']`,
`details.test`, l'énoncé en `.mp-instr`, et la table `cles` de
`RAPPELS_SECONDE` dans `tests/profils.js`. « Recommencer » passe par
`TESTS[...].start`. Le contexte envoyé au modèle est `ctxVisible()`, comme
en 4.1.9 : il lit la consigne, le schéma (nombres écrits compris) et les
saisies.

**Ce que le contrôle tient** (`tests/verifier.js`, `pourcentageSchema`,
absent-déclaré sur les niveaux qui n'ont pas `startPcs`), deux contrôles :
le tirage sur quarante séances (identité, kind, trois questions, P1 et P2
multiples de 5 de 5 à 95, produit multiple de 100, global recalculé entier
de 1 à 99, les trois formes chacune une fois en ordre variable, l'ordre des
phrases une permutation qui varie, au moins un multiple de 5 impair,
l'énoncé sans « undefined » ni gabarit, aucun doublon, « Recommencer ») ;
puis le schéma sur des copies ÉPINGLÉES, les trois exercices de la fiche
(0,30 et 0,20 ; 0,30 × ? = 0,06 ; ? × 0,50 = 0,15) et 0,25 × ? = 0,10 : le
donné en `SPAN` avec son texte, le cherché en `MATH-FIELD`, six cases et
trois phrases dans l'ordre tiré, la copie juste bleue qui vaut le point sur
les trois formes, « 65 % » (les pourcentages additionnés) qui rougit SEUL
et reçoit sa correction « 15 » en vert, « 6,5 » refusé pour 6, et en
soutien deux cases vides qui ne rougissent pas pendant qu'une voisine
juste reste bleue. **Le premier passage a rougi sur le contrôle
lui-même**, pas sur la page : il cherchait « Compl » dans la consigne, et la
deuxième tournure dit « complète » en minuscule au milieu de sa phrase — un
contrôle qui exige un mot doit l'exiger sans casse. **Le banc navigateur a
rougi une fois, sur le rappel de cours** : « les fractions des rappels de
cours s'affichent empilées » ouvre CHAQUE rappel qui porte une formule et
exige qu'au moins une fraction y soit DESSINÉE — `RAP_PCS` n'écrivait que
des décimaux entre `\(…\)`, aucune fraction, et le contrôle ne distingue
pas « pas de fraction » de « fraction non dessinée ». Le rappel dit
maintenant que × 0,30 est × 30/100, en fraction empilée — ce qui est
d'ailleurs la bonne façon de le dire à un élève. Les règles universelles
(taille des cases, case vide, bouton d'aide IA, clavier, couleurs des
verdicts, énoncé encadré) sont tenues par le banc navigateur sans rien
déclarer.
## {evolutions-successives} — le schéma de la fiche porté en Première, et le mot de la conclusion écrit par l'élève (Première, septembre 2026)

**D'où il vient.** Demande de Turquet, septembre 2026 : « en première créer
un exercice comme le pdf, avec deux évolutions successives, où chacune peut
être une augmentation ou une diminution. Chaque pourcentage peut être un
multiple de 10 %. Le résultat doit être un pourcentage entier. Le clavier
doit être pour les tablettes comme celui de l'exercice 2.3.13. » Le PDF est
celui de la Seconde (« *Un commerçant augmente un prix de 20 % puis de 30 %.
Déterminer le pourcentage d'évolution global.* », le schéma à trois boîtes,
voir {evolutions-successives} plus haut) : l'exercice est donc PORTÉ de la
Seconde, kind « evs », même identifiant — les deux niveaux n'ont pas la même
table de résultats, et la Seconde a déjà pris ce chemin pour tout le thème.
Il arrive en **2.5.5**, au bout de la synthèse, comme le 4.5.5 de la
Seconde : il couvre les deux sens, il ne relève ni des hausses (2.2) ni des
baisses (2.3), et il ne déplace personne. **Il a été écrit EN MÊME TEMPS que
{synthese-evolutions-successives} (2.5.4, le paragraphe précédent), dans une
autre session, sur une autre demande** — « les énoncés ressembleront à ceux
du 2.2.7, choix entre la méthode du 2.2.7 ou du 2.2.8 » là-bas, « comme le
pdf, avec le clavier du 2.3.13 » ici. Les deux se sont croisés sur `main`
(la pull request de l'autre a fusionné la première, avec la version 265) :
la fusion a gardé les DEUX exercices, ce qui est le bon état — l'un fait
calculer par l'une des deux méthodes du 2.2.7 et du 2.2.8, l'autre fait
compléter le schéma de la fiche et écrire le mot —, celui-ci passant en
2.5.5 et la version en 266. Ce que la chronique de l'autre dit de ses
choix vaut pour lui seul ; rien n'est partagé entre les deux, sauf `BS_CTX`.

**Ce qui est REPRIS tel quel, et ce qui change — deux différences voulues.**
Le schéma est celui de la Seconde au pixel — trois boîtes sans case, deux
flèches à deux étages (« × (1 ± …) », « ↑ −1 », « × … »), la grande flèche
du coefficient global et sa multiplication à trois cases, le « ± » de la
parenthèse globale LU sur le coefficient global à chaque frappe (`evsSigneMAJ`
sur l'événement `input`, jamais rangé dans la question) — et la feuille de
styles des boîtes et des flèches (`.pctb-*`, `.pctc-*`, `.evb-rev-arrow`)
entre dans la Première avec lui, chaque taille de case et de signe portant
le facteur `--tab-nb` que le banc exige de toute règle de case (le 11 septies
et son contrôle jsdom : une règle `math-field.pm-mf` sans le facteur
rougit). Les tournures (`EVS_ENONCES`) sont celles de la Seconde, réécrites
en FONCTIONS pour `variante()` — la Première n'a pas l'objet `{f, si, poids}`
de la Seconde, sa table de variantes est une liste de fonctions dont la
condition et le poids se posent DESSUS (`Object.assign(fn, {si, poids})`),
comme `poids()` et `siEuros()` le font pour les autres exercices du fichier.
Les mises en situation sont `BS_CTX`, celles de {hausses-successives} et
{baisses-successives}. Ce qui change :

* **Les pourcentages sont des multiples de 10** (`EVS_PCTS`, de 10 à 90),
  et non les multiples de 5 de la Seconde. Le produit de deux multiples de 10
  est toujours un multiple de 100, donc le global est TOUJOURS entier —
  ±P1 ± P2 ± P1·P2/100 — sans qu'il faille construire une liste de paires :
  le tirage prend P1 et P2 librement, et n'écarte que le global nul (aucune
  paire de multiples de 10 ne le donne, mais la garde reste, et le contrôle
  l'exige) et ce qui atteint 100 % (+50 % puis +50 % ferait +125 %). Une
  séance pose les TROIS formes en ordre mélangé, par `distinctes(EVOL_NB, …)`
  — la Première n'a pas `dmNbQuestions()`, sa coupe passe par
  `dmAppliquerNbQ()` après le démarrage, comme pour ses voisins.
* **Le MOT de la conclusion est ÉCRIT par l'élève.** En Seconde, la page
  écrit « augmentation » ou « diminution » elle-même, lu sur le coefficient
  global. Ici la phrase de conclusion porte une CASE DE RÉDACTION
  (`#evsMot`, classe `mf-mots`, liste blanche `_motsFR` posée AVANT la greffe
  qui monte la case — c'est `configureField` qui la lit) : « … subit
  globalement une [ … ] de [ … ] % ». C'est ce qui donne son sens à la
  demande sur le clavier : le clavier B des lettres du 2.3.13 ne vient que
  là où un champ `mf-mots` est sur l'écran de l'exercice courant
  (`kbLettres`, aucune liste) — sans un mot à écrire, il n'aurait rien à
  faire sur ce schéma. Le juge (`evsMotOk`) normalise ce que MathLive rend
  (minuscules, sans accent, lettres seules : « \; » pour l'espace du clavier
  à l'écran, « \text{'} » pour l'apostrophe, les commandes sans leurs
  lettres) et accepte « augmentation » ou « hausse » pour une hausse,
  « diminution » ou « baisse » pour une baisse. Le mot se juge comme une
  case : bleu s'il est juste, rouge s'il est faux, rien s'il est vide ; en
  entraînement, la case vide reçoit le bon mot en VERT (`.sol`), la case
  fausse sa correction en `mf-cor` à côté — par `corTrainDec`, qui ne sait
  pas qu'il écrit un mot et n'a pas à le savoir. Le « ± » de la parenthèse,
  lui, se lit toujours sur le coefficient ; un coefficient du mauvais côté
  de 1 rougit sa case, et le bon signe se montre en vert.

**Les quinze branchements, et deux à nommer.** `TESTS`, `THEMES` (2.5.5),
l'écran `scr-evs` avec sa réserve du bas d'emblée (deux rangées de flèches
et une conclusion : le 4.1.9 avait rougi sur ce bord avec deux rangées),
`testScreens`, `liveCheckCurrent()`, `restartCurrentTest()`,
`afficherEcranDe()` (reprise et rejeu), la liste des rendus enveloppés
(`renderEvsTest`, sans quoi ni les jetons ni le bouton d'aide IA), `RAPPELS_ID`
(`RAP_EVS`, réécrit avec les voisins de la Première : {augmenter-pourcentage},
{diminuer-pourcentage}, {hausses-successives}, {baisses-successives},
{lire-coefficient} — les références de la Seconde, {synthese-evolutions} et
{pourcentage-chaine}, n'existent pas ici et seraient restées entre
accolades), `QIA_SUGG['evs']`, une branche `k==='evs'` dans
`conseilCtxCourant()` (la Seconde retombe sur `ctxVisible()` ; ici la
chaîne entière part au modèle, avec le mot attendu), `details.test`, et
l'énoncé en `.mp-instr`. Un détail de reprise : `restoreBoxes` remet les
saisies APRÈS le rendu, et le « ± » ne se relisait qu'à la frappe suivante —
`renderEvsTest` relit le signe une fois de plus, 200 ms après.

**Ce que le contrôle tient** (`tests/verifier.js`, `evolutionsSuccessives`,
absent-déclaré en Terminale) : UN contrôle pour les DEUX niveaux, et c'est le
profil qui dit lequel (`evolutionsSuccessives: { multiplesDe, mot }` dans
`tests/profils.js` — 5 et « lu » en Seconde, 10 et « ecrit » en Première ;
deux sources, la page a `EVS_PCTS`). Le tirage sur trente séances (identité,
kind, trois questions, P1 et P2 multiples de ce que le profil déclare, le
global recalculé — entier, non nul, sous 100 —, les trois formes en ordre
variable, aucun doublon, « Recommencer ») ; puis le schéma sur les copies
ÉPINGLÉES de la Seconde (+20 % puis +30 % → +56 % ; +20 % puis −30 % →
−16 %), où le mot se POSE comme une case quand le profil dit « ecrit » et se
LIT quand il dit « lu » ; et, pour la Première seule : la case du mot est un
`MATH-FIELD` qui porte `mf-mots` ET `_motsFR`, naît vide, et `kbLettres`
reconnaît l'écran ; « Hausse » accepté, « diminution\; » (l'espace du
clavier à l'écran) accepté, « baisse » accepté pour une baisse et rouge sur
deux hausses — le pourcentage juste d'à côté restant bleu —, le mot vide qui
ne vaut pas le point et reçoit « diminution » en vert, la correction
« diminution » en `mf-cor` à côté d'un « augmentation » faux, et en soutien
la case du mot vide qui ne rougit pas. **Éprouvé par deux sabotages** avant
la première fusion : le juge du mot qui accepte tout (« la copie juste ne
vaut pas le point » — parce que la copie POSE le mot et que le juge saboté
retournait vrai pour tout, y compris le mot faux qui aurait dû rougir —,
« le mot ne rougit pas », « la correction ne s'écrit pas ») et la classe
`mf-mots` retirée (« la case du mot ne porte pas la classe mf-mots : le
clavier B des lettres ne viendrait jamais sur tablette »).

**Et le NAVIGATEUR tape le mot sur une vraie tablette** (« 11 undecies »,
`tests/navigateur.js`, déclaré non applicable là où le profil ne dit pas
« ecrit ») : tablette tactile debout (820 px), l'exercice ouvert en
entraînement. D'ABORD une case à NOMBRES (`#evsP1`) : son clavier A porte
« clavier B » et « espace » — le clavier suit l'écran, pas la case. PUIS la
case du mot touchée, le clavier à l'écran stable, « clavier B » cliqué — les
chiffres partis, la touche « a » là —, « hausse » tapé touche par touche et
relu par le chemin du juge (`toPlain`) ; « clavier A » ramène les chiffres
avec « clavier B » ; ENFIN la copie complétée dans la page et VÉRIFIÉE :
« hausse » bleu, le point donné. **Le premier passage a rougi deux fois — sur
le BANC, la page étant juste** : le contrôle cherchait « clavier A » APRÈS la
vérification, quand le clavier s'est refermé (le verdict déplace le focus sur
« Question suivante »), puis ROUVRAIT l'exercice pour la case à nombres et n'y
trouvait aucun clavier rendu. L'ordre a été retourné — la vérification en
dernier, rien à rouvrir — et c'est la leçon du 11 decies prise de l'autre
côté : un clavier se mesure tant qu'une case le tient ouvert. Les règles
universelles (taille des cases, case vide, bouton d'aide IA, clavier
atteignable, couleurs des verdicts, énoncé encadré, aucune référence
{identifiant} affichée) sont tenues par la visite qui ouvre chaque exercice,
sans rien déclarer. L'exercice n'est PAS ajouté aux témoins
`clavierEcran.lettres.exercices` du profil : ce contrôle-là exige que TOUTES
les cases de l'écran soient des lignes de rédaction (c'est la feuille du
2.3.13 qu'il décrit), et ce schéma a neuf cases à nombres pour un mot.

Ce qu'aucun banc ne voit : une vraie tablette, avec son clavier système que
la greffe coupe — le banc mesure un Chromium tactile de 820 px, pas un iPad.
## {synthese-evolutions-successives} — la méthode 3, en passant par 10 % (Première, septembre 2026)

**D'où il vient.** Demande de Turquet, le lendemain de la mise en ligne du
2.5.4 et du 2.5.5, avec une fiche PDF (« 2_augmentation_methode_3_avec_10 ») :
« il manque la méthode 3 "en passant par 10 %" qui reprend la méthode comme
le pdf joint ». La fiche : « *Un prix augmente de 50 % puis de 20 %. Méthode
3 : en passant par 10 %. On prend 100 au départ. 1ère augmentation : 10 % de
100 est ……, 50 % de 100 est ……, donc la première augmentation donne …… +
…… = ……. 2ème augmentation : on a 10 % de …… est ……, donc 20 % de …… est ……,
donc le résultat après la 2ème augmentation est de …… + …… = ……. Conclusion :
donc est passé de 100 à ……, c'est une …… de …… %.* » Le 2.5.4 (celui de la
PR #412, né sur « le choix entre la méthode du 2.2.7 ou la méthode du 2.2.8 »)
n'offrait que ces deux-là : la méthode des 10 %, que la Première enseigne
déjà au 2.2.11 ({augmenter-dix}) et au 2.2.13, y manquait.

**Un troisième bouton, et la chaîne de la fiche ligne à ligne.** `q.meth`
prend la valeur « dix », à côté de « coef » et « cent » — rien d'autre ne
change dans la question, le contrôle refuse toujours tout autre champ.
L'écran suit la fiche au mot près, dans les rangées `.pt-row` du 2.2.11
(espacées par `#essHost .ess-dix .pt-row`, comme `.syn-dix` au 2.2.13) : ① « On
prend 100 au départ » — « 10 % de 100 est ▢ », « donc P1 % de 100 est ▢ »,
« donc la première hausse donne ▢ + ▢ = ▢ » ; ② « 10 % de ▢ est ▢ », « donc
P2 % de ▢ est ▢ », « donc le résultat après la 2ᵉ hausse est ▢ + ▢ = ▢ » — la
nouvelle valeur se RÉÉCRIT dans chaque ligne, comme les pointillés de la
fiche le demandent, et c'est ce qui empêche de refaire la seconde évolution
sur 100 (le bord que la méthode 2 tenait déjà avec `essc2m`) ; ③ « on est
passé de 100 à ▢, c'est [une hausse | une baisse] de ▢ % » — les deux boutons
du sens de l'exercice (`essSensHTML`), le bon sens jugé comme dans les deux
autres méthodes. Sur une baisse, le « + » devient « − » et le mot suit,
exactement comme la méthode 2 : la fiche est écrite pour deux hausses, et
l'exercice porte les quatre combinaisons.

**Ce que la fiche ne dit pas, et qu'il a fallu décider : 2 %, 4 %, 6 %, 8 %.**
Le vivier est `HS_PAIRES`, celui du 2.2.7 — lu, jamais recopié, le contrôle
l'exige — et il porte quatre paires où un taux n'est pas un multiple de 5 :
2, 4, 6 et 8 % avec 50 %. « 2 % de 150 » ne se déduit pas de « 10 % de
150 » par un facteur entier ni par une moitié. Plutôt que de faire
disparaître le bouton sur ces questions-là (un bouton qui va et vient
ressemble à une panne) ou de rétrécir le vivier (ce que les contrôles du
2.5.4 interdisent, à raison), une ligne s'intercale : « donc 1 % de 150 est
▢ » — 10 % divisé par 10 —, puis « 2 % de 150 est ▢ ». `essDixUn(P)` (`P % 5
≠ 0`) la déclenche, pour la première évolution comme pour la seconde, et là
seulement : sur +20 % puis −5 %, aucune ligne « 1 % » ; sur −50 % puis +2 %,
une seule, à la seconde évolution. Le contrôle mesure les deux bords, et son
sabotage (`essDixUn` rendu toujours faux) a rougi : « la ligne « 1 % de 50 »
manque — 2 % ne se déduit pas de 10 % ».

**Les dixièmes de la valeur intermédiaire ne sont pas toujours entiers, et le
juge compare des rationnels.** +5 % puis +20 % passe par 105 : 10 % de 105
est 10,5, et 1,05 pour 1 %. `essAns` range ces valeurs en
numérateur/dénominateur (`a.dix.d10b = {n:105, d:10}`), jamais en flottant :
le juge (`decOk(id, '', n, d)`, donc `parseDecToFrac`) accepte « 10,5 » et
« 10,50 », la correction en vert écrit « 10,5 » (`essDixStr`), et la
correction en direct du soutien passe par `liveColorDec(id, n, d)` avec le
même couple. Les additions à ordre libre (`hscPaire`) et les soustractions
dans l'ordre (`essOrdre`) sont celles de la méthode 2, réutilisées telles
quelles ; les cases sont listées dans `ESS_CASES.dix` — toutes, les trois
« 1 % » comprises —, le rendu et la navigation au clavier ne gardant que
celles de l'écran (`.filter(Boolean)` dans `essBrancher`).

**Le reste a suivi la méthode : le message d'erreur écrit la chaîne des 10 %
(avec ses lignes « 1 % » quand elles existent), le contexte envoyé au modèle
dit « Méthode 3 » avec ses nombres et la méthode choisie, `RAP_ESS` gagne son
paragraphe (20 % puis −5 % : 10, 20, 120, 12, 6, 114 — et la règle du 1 %),
`QIA_SUGG.ess` propose « passer par 10 % », la carte et le message « Choisis
d'abord ta méthode » disent trois méthodes.** `APP_VERSION` 268.

**Ce que le contrôle tient** (`tests/verifier.js`, le contrôle du 2.5.4,
désormais « trois méthodes ») : les cases EXACTES de la méthode 3 (aucune hors
de `ESS_CASES.dix`, les quatorze de base présentes), les six lignes de +20 %
puis −5 % lues dans le DOM (« 10 % de 100 est », « 20 % de 100 est », « la
première hausse donne », « 10 % de ▢ est », « 5 % de ▢ est », « le résultat
après la 2e baisse est »), la ligne « 1 % » absente là et présente sur −50 %
puis +2 % à la seconde évolution seulement, 50/10 et 50/100 rangés en
rationnels ; la copie juste sur les deux questions épinglées (ses cases
comptées par `ptsEcran`), l'addition dans l'autre ordre acceptée et la
soustraction à l'envers refusée, la seconde évolution recalculée sur 100
refusée (« 10 % de 100 » réécrit à la place de « 10 % de 120 » rougit
`essd10bm`) ; +5 % puis +20 % où « 10,5 » vaut le point, où « 10 » à sa place
rougit SEUL et reçoit « 10,5 » en `mf-cor`, et où en soutien la copie vide ne
rougit pas ; le rappel qui écrit « 12 » (10 % de 120) et présente la méthode
3 ; le contexte qui dit « Méthode 3 » et « 10 % de 120 est 12 ». Deux
sabotages avant la première fusion : la ligne « 1 % » supprimée (ci-dessus),
et la base de la seconde évolution jugée contre 100 au lieu de 120 (« la copie
juste rougit : essd10bm »). Les règles universelles (taille des cases, case
vide, bouton d'aide IA, clavier, couleurs, énoncé, aucune référence
{identifiant}) sont tenues par le banc navigateur sans rien déclarer — mais
la visite ouvre l'exercice AVANT tout choix de méthode, et aucun banc
navigateur ne clique le troisième bouton : ce que l'écran de la méthode 3
donne dans un vrai Chromium, jsdom l'a lu dans le DOM, personne ne l'a
regardé. C'est nommé, pas tu.
## {baisses-successives-dix} — deux baisses de suite, en passant par 10 % (Première, 2.3.14, septembre 2026)

**D'où il vient.** « Fais pareil pour les baisses en 2.3 » (Turquet, septembre
2026), juste après la méthode 3 du 2.5.4. Le sous-thème 2.3 n'avait qu'un
exercice à deux baisses, {baisses-successives} (2.3.7), par les coefficients
— là où le 2.2 en a deux, les coefficients (2.2.7) et « partir de 100 »
(2.2.8). « Pareil » est lu comme les paires 2.2.7/2.2.8 et 2.3.2/2.3.10 le
disent : UN EXERCICE PAR MÉTHODE dans un sous-thème, le choix de méthode
restant aux synthèses. Le 2.3.14 est donc la même question qu'en 2.3.7, par
la chaîne de la fiche « méthode 3 avec 10 % », écrite pour deux baisses :
on prend 100 au départ ; « 10 % de 100 est ▢ », « P1 % de 100 est ▢ »,
« la première baisse donne ▢ − ▢ = ▢ » ; « 10 % de ▢ est ▢ », « P2 % de ▢ est
▢ », « le résultat après la 2ᵉ baisse est ▢ − ▢ = ▢ » ; « la valeur est passée
de 100 à ▢, soit une baisse de ▢ pour 100, c'est-à-dire ▢ % » — le bilan du
2.2.8, mot pour mot, au signe près. Kind « bsd », écran `scr-bsd`, au bout du
2.3, derrière {synthese-diminutions-libre-dix} : rien n'est renuméroté.
L'autre lecture — un choix de méthode ajouté au 2.3.7 lui-même — aurait
changé le parcours d'un exercice en place (rien ne s'affiche avant le
choix) et ses contrôles ; elle reste possible si c'est ce qui était voulu.

**Le vivier est celui du 2.3.7, et c'est ce qui rend la chaîne entière.**
`BS_PAIRES` — lu, jamais recopié, tiré SANS REMISE par `bsdSeance` comme
`hscSeance` au 2.2.8 —, deux multiples de dix dont la baisse globale reste
au plus 90 %. Deux multiples de dix rendent TOUT entier : 10 % de 100 est 10,
la nouvelle valeur 100 − P1 est un multiple de dix, ses 10 % un entier, P2 %
un multiple de cet entier, la valeur finale et la baisse globale
(100 − c1·c2/100) des entiers. Jamais la ligne « 1 % » que le 2.5.4 doit
intercaler sur 2, 4, 6 et 8 % ; le contrôle exige d'ailleurs qu'aucune ne
s'affiche. Aucun garde n'est posé dans la page : le contrôle refait la
chaîne sur le vivier entier, dans les deux ordres, par sa propre
arithmétique. La question ne porte que ses deux taux, le contexte et la
variante (`BS_ENONCES`, les tournures du 2.3.7, partagées) ; `bsdAns()`
recalcule tout, et le rendu, le juge, la correction, le message et le
contexte envoyé au modèle le lisent.

**Le juge, ligne à ligne.** Chaque valeur seule (`decEst`), les deux
soustractions DANS L'ORDRE (`essOrdre`, celle de la méthode 2 du 2.5.4:
« 20 − 100 » rougit), la nouvelle valeur RÉÉCRITE en tête des lignes de la
seconde baisse — c'est elle qui refuse « 10 % de 100 » à la place de « 10 %
de 80 », le piège même de l'exercice. Une case fausse rougit seule et reçoit
sa correction ; la case vide ne rougit jamais et se complète en vert en
entraînement ; le soutien ne révèle rien. Le message d'erreur écrit la
chaîne et nomme l'erreur classique (« 52 %, et non 20 + 40 = 60 % »).
`#bsdHost` a rejoint `#bsHost` dans chaque règle de taille de la feuille de
styles (une case laissée à 1,05 rem devant des nombres à 2 rem, le contrôle
universel l'aurait vue), et ses rangées sont espacées comme celles du
2.2.11. Les quinze branchements : `TESTS`, `THEMES`, l'écran, `testScreens`,
la réserve du bas, `liveCheckCurrent()`, `restartCurrentTest()`,
`afficherEcranDe()`, les rendus enveloppés, `RAPPELS_ID` (`RAP_BSD` : 20 %
puis 40 % → 10, 20, 80, 8, 32, 48, 52), `QIA_SUGG.bsd`, la branche `bsd` de
`conseilCtxCourant()`, `details.test`, l'énoncé en `.mp-instr` ; et dans
`tests/profils.js`, `KINDS_PREMIERE` (le contexte part au modèle) et la
table des identifiants. `APP_VERSION` 269.

**Ce que le contrôle tient** (`tests/verifier.js`, `baissesSuccessivesDix`,
absent-déclaré en Seconde et en Terminale) : le vivier refait par une
seconde arithmétique et mesuré sur ce que la page TIRE (sans remise, les
32 paires, rien d'autre) ; la chaîne entière et la baisse globale sous 90 %
dans les deux ordres ; la séance (identité, trois questions, paires
distinctes, ordre tiré, la question sans autre champ, l'énoncé avec ses
deux taux) ; le rendu de −20 % puis −40 % (les cases EXACTES de `BSD_CASES`,
aucune ligne « 1 % », la consigne qui dit 10 %, les huit lignes lues dans le
DOM, aucune référence {identifiant}) ; la copie juste sur trois questions
épinglées, comptée par `ptsEcran` ; « 20 − 100 » refusé ; la seconde baisse
refaite sur 100 refusée ; « 60 % » (les baisses additionnées) qui rougit
seul avec un message disant 52 et 60 ; une case fausse seule avec sa
correction « 8 » ; la case vide complétée en vert en entraînement, jamais en
soutien, où la voisine juste reste bleue ; « Recommencer », le rappel dont
l'exemple est tirable et porte les nombres de la chaîne, `QIA_SUGG`, le
contexte (« 10 % de 80 est 8 », « 80 − 32 = 48 », « 52 % »). **Deux
sabotages** avant la première fusion : la seconde baisse jugée sur 100
(« la copie juste rougit : bsd10bm,bsdPbm ») et la soustraction rendue
commutative (« « baisse − valeur de départ » est accepté »). Les règles
universelles sont tenues par le banc navigateur, qui ouvre cet écran-là
comme les autres. **Un piège de profil, attrapé par `npm test` :** le kind
avait d'abord été ajouté à `KINDS_PREMIERE`, que la SECONDE dérive pour son
propre contrôle du contexte IA — elle a rougi (« manque : bsd ») sur un
démarreur qu'elle n'a pas, exprès. Un kind propre à la Première s'ajoute
dans la liste `ctx.kinds` de SON profil, là où `ess` l'avait déjà appris.

Ce qu'aucun banc ne voit : le 2.2 n'a pas son pendant « deux hausses en
passant par 10 % » — la demande disait « les baisses en 2.3 », et rien de
plus.


## {pourcentage-synthese} — la méthode se choisit : la fraction sur 100, ou le passage par 10 % (Première, septembre 2026)

**D'où ça vient.** Demande de Turquet : « dans le 2.1.6 donner le choix à
l'élève, quand il faut déterminer la valeur initiale ou finale, de prendre un
pourcentage comme le 2.1.3 ou sinon comme le 2.1.8 ; quand il s'agit de
trouver un %, de faire comme le 2.1.6 ou le 2.1.10 ». La synthèse
{pourcentage-synthese} arrive après les trois exercices de la méthode des
10 % ({pourcentage-dix}, {pourcentage-dix-cascade}, {pourcentage-dix-taux}),
et elle ne connaissait que la chaîne de la fraction — celle de {pourcentage}
et de {pourcentage-taux}. Elle gagne un étage « Ⓜ Choisis ta méthode de
vérification », deux boutons : « Avec la fraction sur 100 » et « En passant
par 10 % » — le même geste que la synthèse des évolutions
({synthese-augmentations-dix}), dont c'est la copie sur le sous-thème 2.1.

**Ce que « comme le 2.1.8 » veut dire quand P n'est pas 10.** Le 2.1.8 ne
prend jamais que 10 % ; pour 30 % de 40, c'est {pourcentage-dix-cascade}
(2.1.9) qui montre le chemin, et sa première ligne EST celle du 2.1.8 (10 % de
N, la fraction N/10 devant la case). Les lignes du passage par 10 % pour une
VALEUR sont donc celles du 2.1.9 : « On commence par 10 % de N = N/10 = ▢ »,
puis « donc : P % de N est ▢ » — sur le couple testé, comme la chaîne de la
fraction : pour la valeur INITIALE, le nombre est la proposition choisie
(« … » tant qu'il n'y en a pas), c'est de lui qu'on prend 10 %, et la
dernière case doit retomber sur le résultat de l'énoncé. Pour le POURCENTAGE,
les lignes du 2.1.10 : « On commence par déterminer 10 % de N : ▢ », « On
multiplie par ▢ : donc ▢ % de N = R », avec les deux flèches courbes de la
fiche (`qdDessinerFleches`, sur `pdtArc` réutilisé tel quel, la classe
`qd-fl` posée par `renderQTest` pour LA question affichée). Et ce chemin-là
est jugé sur les DONNÉES, jamais sur la proposition — la décision du 2.2.13,
reprise mot pour mot : il trouve LE pourcentage, qui se compare ensuite au
pourcentage choisi (« Ton calcul est juste : le pourcentage est 30 %, et ce
n'est pas la proposition que tu as choisie »).

**Quand P EST 10 %, une seule ligne.** Les viviers de la synthèse
(`PCT_PCTS`, 10 à 90) contiennent 10 %, que le 2.2.13 avait écarté de son
tirage (« la ligne 10 % de N serait déjà la réponse »). Ici le tirage est
celui de 2.1.3, 2.1.4 et 2.1.5, partagé, et il ne bouge pas : c'est l'écran
qui s'adapte, par la règle du 2.1.10 (« aucune case ne multiplie jamais par
1 ») — `qdDixRegl` rend `hasK:false`, la ligne « donc : 10 % de N est ▢ »
n'apparaît pas, et pour le pourcentage cherché ni facteur ni flèche, comme
le 2.1.10 quand le pourcentage cherché EST 5 %. Tout tombe juste sans garde :
P et N sont des multiples de dix (les viviers, et les leurres de
`leurresProches` — N = 10 est exclu de la valeur initiale), donc 10 % de N
est entier et le facteur aussi.

**C'est la question qui porte le choix.** `startPctSynthese` pose
`q.meth = null` sur chaque question tirée ; `qdMeth` lit `'frac'` quand la
clé est ABSENTE (2.1.4, 2.1.5, et une pause de la synthèse antérieure à ce
jour), et `null` veut dire « la synthèse attend le choix ». Rien n'est
accroché à `test.qId` : la reprise d'une pause relit la question, jamais le
démarreur — la leçon du 2.2.13. Changer de méthode redessine la chaîne
(`choisirQMeth`, sans restaurer les cases : elles n'ont pas le même sens
d'une méthode à l'autre) ; choisir une proposition la redessine EN gardant
les cases (`qcmRedessiner`, comme avant). Le verdict verrouille les boutons
de méthode comme ceux des propositions. Le rappel (`RAP_SYN21`) présente les
deux voies sur 30 % de 40 €, le contexte envoyé au modèle dit la méthode
choisie — ou qu'aucune ne l'est encore —, le corrigé type suit la méthode
(`QIA_MODELES.pctq`), et une question de plus est proposée dans la fenêtre
d'aide.

**Ce que le contrôle tient** (`tests/verifier.js`, « 2.1.6 : la méthode se
choisit ») : le tirage porte `q.meth = null` et 2.1.4 / 2.1.5 n'en portent
pas (ni boutons, ni message qui réclame une méthode) ; rien ne s'affiche
avant la méthode et « Vérifier » la réclame sans verrouiller ; la fraction
montre sa chaîne, `qN` comprise, et vaut le point ; le passage par 10 %
montre les lignes du 2.1.9 pour une valeur (une seule quand P EST 10 %), les
lignes du 2.1.10 pour le pourcentage (facteur et flèches quand il y a une
multiplication, jamais pour 10 %) ; la copie juste vaut le point dans les
trois types ; sur une proposition FAUSSE, le calcul juste est dit juste — sur
la proposition pour la valeur initiale, sur les données pour le pourcentage,
le pourcentage trouvé nommé — et en soutien l'écran reste ouvert puis la
bonne proposition vaut le point ; une case vide ne rougit jamais et la
correction d'entraînement la remplit ; changer de méthode reconstruit la
chaîne ; « Recommencer » relance la synthèse. Le contrôle des QCM (« la
vérification s'affiche avec les propositions ») choisit d'abord la méthode
pour la synthèse, et vérifie que la chaîne est CACHÉE avant. Trois sabotages
avant la première fusion : le pourcentage jugé sur la proposition au lieu des
données, le facteur affiché pour 10 %, la question tirée sans `q.meth`.
Les règles universelles sont tenues par le banc navigateur sans rien
déclarer — mais, comme pour le 2.2.13 et la méthode 3 du 2.5.4, la visite
ouvre l'exercice AVANT tout choix de méthode : les chaînes de la synthèse ne
sont vues dans un vrai Chromium qu'à travers leurs jumelles, celle de la
fraction en 2.1.4 / 2.1.5, celles des 10 % en 2.1.9 / 2.1.10, dont le DOM et
les classes sont les mêmes. C'est nommé, pas tu.

---

## {synthese-evolutions-successives-libre} — le 2.5.4 rédigé, sur la feuille du 2.2.14 (Première, septembre 2026)

**D'où il vient.** Demande de Turquet : « en Première faire un exercice comme
le 2.5.4, mais où l'élève doit tout rédiger avec la méthode qui lui convient,
le clavier virtuel sera comme celui du 2.2.14 ». Et les MINIMUMS, méthode par
méthode : « pour la 1ère méthode : accepter au minimum la multiplication de
deux coefficients qui donne le coefficient global, et ensuite le % d'évolution
global directement. Pour la méthode 2 qui part de 100 et qui multiplie par
les coefficients, accepter au minimum la valeur finale de la première
évolution directement, puis la multiplication de cette valeur par le
coefficient de la 2ème évolution, puis le % d'évolution global directement.
Pour la 3ème méthode, qui part de 100 aussi, accepter au minimum la valeur
finale de la première évolution puis "…% de ….. est ….." pour la deuxième
évolution avec la valeur finale ensuite de la 2ème évolution, puis le %
d'évolution global directement. » L'exercice ferme le sous-thème 2.5,
{synthese-evolutions-successives-libre} (2.5.6), après le 2.5.5 : rien n'a
été renuméroté — le motif du 2.2.14 et du 2.3.14, le nouveau venu à la fin de
son sous-thème.

**Presque rien n'est neuf sauf le juge, et c'est voulu.** Le tirage est
`essSeance` (les trois formes une fois chacune, les paires de `HS_PAIRES`
sans remise), les énoncés `ESS_ENONCES`, les nombres `essAns` — lus, jamais
recopiés, le contrôle lit la SOURCE et l'exige. La question ne porte que
`s1, s2, P1, P2, ci, v` : `startEsl` retire `meth` et `choisi`, ici tout
s'écrit. La feuille est `mlFeuille` en mode « redaction » (la liste blanche
des raccourcis, la classe `mf-mots` que `kbLettres` cherche pour poser le
clavier B sur tablette, la barre d'espace qui écrit une espace), et
`salEspaces` — qui ne connaissait que `salSheet` — prend désormais le nom de
sa feuille pour faire sortir l'espace d'une fraction sur `eslSheet` aussi.
Le kind est `esl`, l'écran `scr-esl`, les quinze branchements sont posés
(TESTS, THEMES, l'écran, `testScreens`, la réserve du bas, « Recommencer »,
`afficherEcranDe`, les enveloppes, `RAP_ESL`, `QIA_SUGG.esl`,
`conseilCtxCourant`, `details.test`) ; pas de correction en direct, comme
« sal » — la copie se relit à la vérification, et le profil le déclare
(`soutienEnDirect.sans`).

**Le juge (`eslJuge`) lit des rationnels exacts sur trois positions**, le
motif de `salJuge` : refuser sur un fait prouvable, accepter quand une
méthode est positivement montrée, s'abstenir quand une écriture lui échappe
(le modèle décide alors seul). Chaque ligne passe par `eslLireLigne`, qui
rend son TYPE : la conclusion (« hausse de 14 % », « diminution de 49 % »,
ou signée « +14 % », « évolution globale = +14 % »), une valeur seule
(« 120 »), un commentaire, une ligne « k % [de M] = … » (par `salDixPct`),
« écart = … », ou un calcul (par `salExpr`, avec ses TERMES — la liste des
facteurs de chaque produit). **La fiche s'écrit en mots, et la ligne se lit
comme l'élève la dit** : « est », « font », « vaut », « donne », « fait »
valent « = » (« 5 % de 120 est 6 ») ; une étiquette en tête (« 1ère
hausse : », « donc la première hausse donne », « coefficient global = ») est
retirée — un morceau sans nombre n'affirme rien, et « 2e baisse » n'est pas
un nombre — ; les mots qui précèdent un nombre (« donc 5 % de 120 ») aussi.
Un commentaire NEUTRE (« on prend 100 au départ », « méthode 2 ») ne force
pas l'abstention ; un commentaire qui porte d'autres nombres peut cacher la
méthode, et le juge s'abstient si aucune n'est montrée ailleurs.
**Les trois méthodes se reconnaissent sur les termes** par `eslPartage` : un
produit montre « X × Y » si ses facteurs se partagent en deux paquets dont
les produits valent X et Y — quel que soit l'ordre, et quelle que soit
l'écriture (1,2 ou 12/10, (1 + 0,2)). Méthode 1 : un terme qui se partage en
c1 et c2. Méthode 2 : un terme qui se partage en v1 et c2 — « 120 × 0,95 »,
mais aussi « 100 × 1,2 × 0,95 » et « 120 × 95/100 ». Méthode 3 : « P2 % de
v1 = aug2 » (ou un terme qui se partage en v1 et P2/100, ou « 95 % de 120 est
114 » d'un coup), ET une ligne à l'opération du bon signe qui vaut v2. La
conclusion doit porter le bon sens ET le bon pourcentage. Tout ce qui
s'écrit EN PLUS est lu et doit être vrai : une égalité fausse refuse la
copie en la nommant.
**Ce qui est refusé par leçon**, comme au 2.5.4 : la seconde évolution
refaite sur 100 (« 5 % de 100 est 5 » — vraie arithmétiquement, fausse de
méthode, détectée quand les deux taux diffèrent, et le refus dit sur quoi
elle porte), « 5 % = 6 » sans base (le refus demande « 5 % de quoi ? »), et
la conclusion qui additionne les pourcentages (le refus dit que les
évolutions ne s'additionnent pas). **Aucun refus n'écrit la réponse** — ni
la valeur finale, ni le pourcentage, ni le coefficient global : un refus
nomme la ligne fausse (celle de l'élève, qui peut la contenir), ou ce qui
manque à la méthode entamée (« il manque la valeur finale », « la ligne « 5 %
de … est … » »), ou dit de comparer le coefficient à 1 et la valeur finale à
100 quand le calcul est juste et la conclusion fausse. Le contrôle le
mesure sur chaque refus des cas épinglés, en retirant ce que le refus CITE.

**La vérification est celle de `checkSal`** : le juge d'abord, puis le
modèle avec la règle (`eslAttenduIA` — la réponse déclarée secrète, les trois
minimums avec les nombres, « écrite directement », le refus de la seconde
évolution sur 100, le VERDICT DE LA PAGE prioritaire) et l'énoncé
(`eslEnonceIA` — « est » vaut « = », les lignes aplaties par l'éditeur). Le
juge prime ; en panne du modèle il répond seul ; sur un refus, sa phrase
s'affiche toujours. La feuille se PEINT ligne à ligne (`eslPeindreLignes` :
les calculs vrais en bleu, faux en rouge, la conclusion, une valeur seule et
un commentaire sans couleur). En SOUTIEN, une copie fausse rouvre la feuille
(« Revérifier ») ; en ENTRAÎNEMENT, elle verrouille et le corrigé s'écrit en
VERT sous le verdict (`eslCorrection`, classe `.esl-cor` — la couleur de la
correction, jamais celle du juste). La note part sous
`synthese-evolutions-successives-libre`. Le rappel (`RAP_ESL`) écrit les
trois méthodes sur 20 % puis −5 % avec les lignes minimales en gras ; le
contexte de l'aide dit les trois minimums avec les nombres et l'erreur
classique ; les coefficients s'y écrivent COMPACTS (`eslCoefStr` : 1,2, pas
1,20 — c'est ce que l'élève tape). `APP_VERSION` 271.

**Ce que le contrôle tient** (`tests/verifier.js`, « les évolutions
successives rédigées : tirage du 2.5.4, juge sur trois méthodes, écran,
règle, identité ») : le tirage (identité, kind, trois questions, les trois
formes, les paires dans `HS_PAIRES`, sans remise, AUCUN autre champ que les
six) ; le juge sur quatre questions épinglées (+20 % puis −5 % ; −50 % puis
+2 % ; +20 % puis +20 %, où les deux taux sont égaux ; +5 % puis +20 %, où
10 % de 105 est 10,5) et quarante-quatre copies — les trois méthodes au
minimum dans toutes les écritures (décimaux, fractions, parenthèses,
« est », étiquettes, ordinaux, la fiche du 2.5.4 recopiée ligne à ligne, tel
que MathLive aplatit), les refus nommés, l'abstention sur « 1,14 = 114 % »,
la soustraction à l'envers refusée et l'addition dans l'autre ordre acceptée,
aucun refus qui écrive 114, 1,14 ou 14 hors de ce qu'il cite ; l'écran (la
feuille de rédaction et l'espace sur les lignes présentes et ajoutées,
`kbLettres` qui reconnaît l'écran, l'étiquette qui nomme les trois méthodes
et la conclusion SANS les nombres du calcul, l'indication qui dit « est », le
%, l'espace, la peinture ligne à ligne) ; la règle au modèle sur 120 tirages
(les trois minimums avec les nombres, « écrite directement », le refus sur
100, la borne de la fonction Edge) ; l'identité (2.5.6, et le 2.5.4 et le
2.5.5 qui gardent leur numéro, « Recommencer », la reprise, le rappel dont
l'exemple est tirable, les questions, la description, le contexte) ; et le
2.5.4 qui tire toujours ses deux choix, le 2.2.14 dont la feuille écrit
toujours l'espace. Un second contrôle lit la SOURCE : `startEsl` tire par
`essSeance`, `renderEsl` écrit `ESS_ENONCES` sur `mlFeuille` en mode
« redaction » avec `salEspaces`, `eslJuge` lit `essAns`, aucun vivier ni
énoncé propre. Un troisième, dans la chaîne séquentielle (« les évolutions
successives rédigées, cliquées »), CLIQUE « Vérifier » avec un modèle stubbé
qui se trompe : le juge prime dans les deux sens sans afficher la prose
contraire, le juge abstenu laisse le modèle décider sans bloc VERDICT, le
modèle en panne laisse le juge répondre seul (et la page rend le bouton
quand les deux se taisent), le soutien rouvre la feuille et la copie
corrigée vaut le point, l'entraînement verrouille et écrit le corrigé, la
feuille vide n'appelle pas le modèle, la fin de séance enregistre 1/1 sous
l'identifiant.
Deux bords sont venus du contrôle lui-même, à la première exécution : la
copie « tel que MathLive l'écrit » avait été épinglée avec `\times`, que la
feuille ne rend jamais (toPlain le fait « × ») — le cas est devenu « 1,2×0,95
=1,14 » sans espaces et « haussede14\% » — ; et le refus « il y a une
égalité fausse : « 6 − 120 = 114 » » rougissait la règle du secret en citant
la ligne de l'élève, qui contient 114 : la règle retire désormais ce que le
refus cite. Un troisième est venu du contexte de l'aide : `essCoefStr` écrit
« 1,20 », et le contrôle attendait « 1,2 » — c'est la page qui a changé, pas
le contrôle : l'élève tape 1,2.

**Au banc navigateur** (« 6 vicies octies », étape 5, sur
`syntheseRedigee.evolutions`) : la méthode 3 de la fiche est TAPÉE en mots
dans un vrai MathLive (« 120 », « 5 % de 120 est 6 », « 120 - 6 = 114 »,
« hausse de 14 % ») sur la question épinglée ; « de » et « est » doivent
ressortir entiers (la liste blanche de la feuille de rédaction — jsdom n'a
pas MathLive, c'est ici seul que la frappe se mesure), le juge lire « est »
comme « = », la note compter, les deux lignes de calcul se peindre en bleu,
la valeur seule et la conclusion ne rien recevoir. Le profil nomme aussi le
2.5.6 dans `clavierEcran.lettres.exercices` (le clavier B sur tablette), et
`aide.ctx.kinds` porte `esl` avec `genEss()`. Les règles universelles sont
tenues par la visite (section 9) sans rien déclarer.

## {synthese-generale-libre} — les énoncés du 2.5.2 et du 2.5.6 dans une même séance, sur la feuille du 2.3.13 (Première, septembre 2026)

**D'où il vient.** Demande de Turquet, le jour même de la mise en ligne du
2.5.6 : « en Première, fais un exercice de synthèse qui demande de rédiger à
l'élève ; on utilisera le clavier virtuel du 2.3.13 ; ce sera une synthèse
qui contiendra les énoncés du 2.5.2 et du 2.5.6 ; on vérifiera les rédactions
exactement comme le 2.5.5 et le 2.5.6 ». Le « 2.5.5 » de la demande est lu
comme le 2.5.2 : le 2.5.5 ({evolutions-successives}) est le schéma à cases de
la fiche, où rien ne se rédige, et les deux exercices dont la synthèse prend
les ÉNONCÉS sont le 2.5.2 et le 2.5.6 — vérifier « exactement comme » les
exercices d'origine est la seule lecture qui tienne. L'exercice ferme le
sous-thème 2.5, {synthese-generale-libre} (2.5.7), kind `sgl` : rien n'est
renuméroté.

**Rien n'est neuf que le tirage et l'aiguillage, et c'est le point.** Une
séance de six questions : trois du 2.5.2 (`genSyn(undefined, inc)` par
`distinctes()` — les trois familles au hasard, les trois inconnues une fois
chacune, les quatre propositions) et trois du 2.5.6 (`essSeance` — les trois
formes, les paires sans remise, `meth` et `choisi` retirés), MÉLANGÉES par
`qdMelanger` : l'élève doit reconnaître la question avant de rédiger. Chaque
question porte son MOTEUR (`q.moteur` : `'sal'` ou `'esl'`), et c'est la
QUESTION qui dit sur quel écran elle s'affiche et quel juge la lit — la
reprise d'une pause relit la question, jamais le démarreur. `renderSgl`
montre l'écran du moteur (`sglEcran()`, que la table d'`afficherEcranDe` lit
aussi) puis appelle `renderSal` ou `renderEsl` ; les boutons « Vérifier » de
ces écrans appellent `checkSal` et `checkEsl` — `salJuge` puis le modèle, le
juge prime ; `eslJuge` de même. La synthèse n'a ni juge, ni règle, ni énoncé
à elle : « exactement comme » se tient en ne recopiant rien, et le contrôle
lit la SOURCE pour l'exiger (aucune fonction `sglJuge`, `sglAttenduIA`,
`checkSgl`… ne doit exister ; `renderSgl` doit appeler les deux rendus). Ce
qui a bougé dans les moteurs tient en deux lignes : `nextSal` et `nextEsl`
rendent la main à `nextSgl` quand `test.kind` vaut `'sgl'` — c'est lui qui
enchaîne les écrans et qui clôt par `finishSgl`, la note partant sous
`synthese-generale-libre`, un point par question (le barème homogène que la
coupe d'un devoir sait lire). Le rappel (`RAP_SGL`) réunit ceux des deux
exercices d'origine derrière trois phrases ; les questions à l'IA
(`QIA_SUGG.sgl`) et le contexte de l'aide suivent la question affichée —
`conseilCtxCourant` aiguille `k` sur `q.moteur`, et c'est la branche du 2.5.2
ou du 2.5.6 qui parle. Pas de correction en direct, comme ses deux moteurs
(`soutienEnDirect.sans`).

**Le clavier est celui du 2.3.13, et c'est la seule chose que les questions
du 2.5.2 changent.** Les questions du 2.5.6 ont déjà la feuille de rédaction
(mode « redaction », classe `mf-mots`, liste blanche des raccourcis, la barre
d'espace qui écrit une espace, `salEspaces` sur `eslSheet`). Le 2.5.2, lui,
rédige sur une feuille de CALCUL : `renderSal` ne posait le mode « redaction »
que sur `q.dix` (le 2.3.13 et le 2.2.14). Il lit désormais `q.dix || q.mots`,
et `startSgl` pose `q.mots` sur ses trois questions du 2.5.2 — la feuille du
2.3.13, le clavier B des lettres sur tablette (`kbLettres` cherche `mf-mots`
sur l'écran courant, sans liste), l'indication sous la feuille qui dit
l'espace et le clavier B. Le JUGE, lui, ne change pas : `q.dix` n'est pas
posé, les lignes « 10 % = … » restent des écritures inconnues, et le juge du
2.5.2 rend sur une question de la synthèse exactement le verdict qu'il rend
sur la même question sans `q.mots` — le contrôle le mesure sur quatre copies
(le coefficient, l'augmentation puis l'addition, la voie des 10 %, une
égalité fausse). Le 2.5.2 lui-même garde sa feuille de calcul : `q.mots`
n'est posé qu'ici, et le profil le nomme désormais dans
`clavierEcran.lettres.hors` — le bord opposé.

**Ce que le contrôle tient** (`tests/verifier.js`, « la synthèse générale
rédigée : les énoncés du 2.5.2 et du 2.5.6 mélangés, la feuille du 2.3.13,
les juges d'origine, identité ») : le tirage sur 30 séances (identité, kind,
2 × `EVOL_NB` questions, le barème, trois de chaque moteur, les trois
inconnues du 2.5.2 avec `q.mots` et SANS `q.dix`, les quatre propositions, les
six champs du 2.5.6 plus le moteur, les trois formes, les paires de
`HS_PAIRES`, et l'ordre qui VARIE : la première question change de moteur,
l'ordre des six prend au moins trois formes) ; l'écran de chaque moteur
(`scr-sal` pour une question du 2.5.2, `scr-esl` pour une du 2.5.6, par
`renderSgl` comme par `afficherEcranDe('sgl')` — la reprise —, la feuille de
rédaction avec l'espace sur les lignes présentes et ajoutées, l'indication
qui dit le clavier B sans promettre les 10 %, les quatre propositions,
l'énoncé du 2.5.6, les boutons qui appellent `checkSal()` et `checkEsl()`, le
compteur qui dit « / 6 », aucune référence `{identifiant}`) ;
l'enchaînement (depuis chaque question, « suivant » passe à l'écran du moteur
suivant, déverrouillé ; depuis la dernière, il clôt par `finishSgl`, mesuré
en remplaçant la fonction) ; les juges à l'exécution (les mêmes verdicts avec
et sans `q.mots`, la ligne des 10 % inconnue, le juge du 2.5.6 inchangé) ;
l'identité (2.5.7, le 2.5.2 et le 2.5.6 gardent leur numéro, « Recommencer »,
le rappel — ni l'un ni l'autre des deux d'origine seuls, les trois méthodes,
le quotient, les trois références résolues à l'affichage —, `QIA_SUGG.sgl`,
la description, le contexte de l'aide sur une question de chaque moteur) ; et
le 2.5.2 et le 2.5.6 qui ne changent pas. Un second contrôle lit la SOURCE :
`renderSgl` appelle `renderSal()` et `renderEsl()`, `startSgl` tire par
`genSyn`, `essSeance` et `distinctes`, `nextSal` et `nextEsl` rendent la main
à `nextSgl`, `finishSgl` enregistre sous son identifiant, aucune fonction de
juge, de règle ou d'énoncé propre. Un troisième, dans la chaîne séquentielle
(« la synthèse générale rédigée, cliquée »), CLIQUE : sous un modèle stubbé
qui se trompe toujours, la justification du 2.5.2 est jugée par `checkSal`
(le point, la couleur, le verrou, la copie partie avec le verdict du juge),
« Question suivante » passe à l'écran du 2.5.6 déverrouillé, la rédaction du
2.5.6 est jugée par `checkEsl` avec la règle du 2.5.6, « Voir mes résultats »
enregistre 2/2 sous `synthese-generale-libre` et RIEN sous les identifiants
d'origine, le soutien rouvre la feuille sur une copie fausse du 2.5.2, et
l'entraînement écrit le corrigé vert sur une copie fausse du 2.5.6.
Deux pièges de banc en passant : `kbLettres` vit dans le module MathLive,
que jsdom n'exécute pas — l'exiger là rougit toujours, le contrôle du clavier
B le rejoue à part, et le contrôle de la synthèse ne le mesure que s'il
existe (le motif du 2.5.6) ; et un contrôle écrit dans un gabarit JavaScript
double ses barres obliques inverses (`\\n`, `\\'`, `\\b`), sans quoi le code
évalué reçoit un vrai retour à la ligne au milieu d'une expression régulière
(« Invalid regular expression: missing / ») — la première exécution l'a
attrapé.

**Au banc navigateur** (« 6 vicies octies », étape 6, sur
`syntheseRedigee.generale`) : une séance de DEUX questions épinglées — une
hausse du 2.5.2, puis +20 % puis −5 % du 2.5.6 —, et les deux copies TAPÉES
dans un vrai MathLive. La justification du 2.5.2 s'écrit ici en mode
RÉDACTION, ce que le 2.5.2 seul ne fait jamais : la liste blanche des
raccourcis doit laisser passer « * », « = » et les espaces (jsdom n'a pas
MathLive, c'est ici seul que la frappe se mesure). Puis « Vérifier » (le juge
du 2.5.2 prime sur le double, qui refuse toujours), « Question suivante »
(l'écran du 2.5.6 apparaît, déverrouillé), la méthode 3 en mots,
« Vérifier », « Voir mes résultats », et la note lue dans le double de
Supabase : 2/2 sous l'identifiant de la synthèse, rien sous ceux d'origine.
Le profil nomme aussi le 2.5.7 dans `clavierEcran.lettres.exercices` (les
deux écrans portent la feuille du 2.3.13), le 2.5.2 dans `hors`, `sgl` dans
`soutienEnDirect.sans` et dans `aide.ctx.kinds` (avec une question du 2.5.6
marquée de son moteur). Les règles universelles sont tenues par la visite
(section 9) sans rien déclarer. `APP_VERSION` 272.

---

## Seconde 4.6.1 — {tableau-proportions} : le tableau à double entrée de la fiche, et ses proportions

**Demandé par Turquet en septembre 2026**, d'après une fiche papier
« Compléter le tableau » : un tableau croisé 2 × 2 — garçons et filles, avec
ou sans lunettes — dont les quatre cases intérieures sont données (3, 6, 10,
11) et dont l'élève complète la ligne et la colonne « total dans la classe » ;
puis sept proportions à écrire en fraction, chacune en deux temps : « Ici on
étudie les élèves qui …… parmi …… », puis la fraction « nombre d'élèves qui …
et qui sont parmi … / nombre total d'élèves parmi … = …/… ». Deux consignes
avec la fiche : **des nombres plus petits ou égaux à 20 dans les cases
intérieures** — et donc pas forcément dans les cases de la ligne et de la
colonne total —, et **des énoncés variés**.

**Où il vit.** Une sixième partie du thème 4 « Pourcentages », « Proportions
dans un tableau », ajoutée EN DERNIER : rien ne se renumérote, les renvois
{identifiant} ne bougent pas. Une proportion vient avant le pourcentage, mais
l'insérer en tête aurait renuméroté les cinq parties portées de la Première.
Kind `tdp`, écran `scr-tdp`, pas de bouton des tables (on n'y multiplie rien :
`TABLES_SANS` et `tablesAide.sans` du profil).

**Le tirage.** Les quatre cases intérieures se tirent de 1 à `TDP_MAX` (20) ;
les totaux ne sont jamais tirés, ils se calculent. Huit mises en situation
(`TDP_CTX`) : la classe de la fiche, un club de sport (adultes/enfants ×
tennis/judo), un refuge (chiens/chats × adoptés/en attente), un parking
(voitures/motos × électriques/thermiques), une bibliothèque, une classe
droitiers/gauchers × avec/sans animal, un lycée (demi-pensionnaires/externes ×
bus/à pied), une salle de cinéma. Chaque contexte porte, pour chacun de ses
quatre groupes, une TÊTE de tableau (« Garçons »), un PRÉDICAT pour la liste
« qui » (« sont des garçons »), un NOM pour la liste « parmi » (« les
garçons ») et, pour les lignes, un QUALIFICATIF qui fabrique les quatre cases
(« sont des garçons » + « avec lunettes »). Quatre tournures de question
(`TDP_V`), tirées à la génération et rangées dans la question (`q.v`, `q.ci`)
— jamais au rendu, c'est la règle des énoncés.

**Une séance enchaîne des situations** : pour chacune, une question
« tableau » (cinq cases) puis TROIS proportions, une par famille et dans
l'ordre de la fiche — un groupe dans le tout (« les garçons dans la classe »),
une case dans le tout (« les garçons avec lunettes dans la classe »), un groupe
parmi l'autre axe (« ceux qui ont des lunettes parmi les garçons »). Huit
questions par défaut (deux situations, barème 2 × (5 + 3 × 4) = 34). Le
réglage « Questions » d'un devoir se lit au tirage (`dmNbQuestions`) et
allonge la séance situation par situation : réglé à 10, une troisième
situation apporte son tableau et une proportion. Les tables d'une séance
passent par `distincte()` — deux situations ne portent jamais les mêmes quatre
nombres — et les contextes d'une séance sont tirés sans remise.

**Les clés, jamais les réponses.** Une proportion range `gk` (qui l'on
étudie : `c0`, `c1` les colonnes, `l0`, `l1` les lignes, `xLC` une case) et
`rk` (parmi qui : `tout` ou un groupe d'un axe). `tdpCases()` recalcule les
totaux, le numérateur (l'effectif de gk ∩ rk) et le dénominateur (l'effectif
de rk) dans la fonction même qui corrige. Les deux listes attendent la
formulation CANONIQUE de la fiche : « ont des lunettes » parmi « les garçons »,
jamais « sont des garçons avec lunettes » parmi « les garçons » — la fiche
apprend précisément à nommer la partie et le tout.

**L'écran.** Un vrai `<table>` : les quatre effectifs écrits en `.tdp-nb`, les
totaux en `.tdp-in` du MÊME corps (1,45 rem) — la règle de la taille des cases
—, les cases « total » sur fond ambré. Sous le tableau de la proportion (le
tableau COMPLÉTÉ accompagne chaque question), la phrase « Ici, on étudie les
élèves qui [liste] parmi [liste] », puis la fraction en rangée flex centrée :
le « = » tombe sur le trait ; numérateur et dénominateur portent leur libellé,
où les mots choisis dans les listes se recopient en direct (`tdpLibelles`),
comme la fiche le fait écrire. Les mots de ces libellés, en `<i>` recolorés,
ne sont pas des italiques : `.tdp-lib i` remet le style droit.

**Le message d'erreur.** Sur la première case fausse du tableau, la somme qui
donne ce total-là (« Le total de la ligne « Sans lunettes » est la somme de
ses deux cases : 10 + 11 = 21 ») ; sur une proportion, la phrase entière
(« On étudie les élèves qui ont des lunettes parmi les garçons : ils sont 3
sur 13, la proportion est 3/13 »). Les cases vides passent par
`msgAvecVides` et `corrChoix`, comme toute la famille des listes.

**Le contrôle** (banc principal, « proportions dans un tableau : le tirage, la
correction et la place dans le thème Pourcentages ») : la place (4.6.1, six
parties, les numéros du thème 4 inchangés) ; 1 500 tirages (cases de 1 à 20,
huit questions, phases dans l'ordre, chaque proportion sur la table de SA
situation, tables et contextes distincts, aucun groupe parmi son propre axe,
au moins un total au-delà de 20, les quatre tournures et les huit contextes
vus) ; les réponses attendues contre des SOMMES écrites dans le banc, sur la
table de la fiche et ses seize couples (qui, parmi), dont les sept questions
de la fiche mot à mot (13/30, 17/30, 3/30, 11/30, 3/13, 6/17, 6/9) ; puis la
correction par le BOUTON — tableau juste (5 cases), totaux de lignes et de
colonnes ÉCHANGÉS (rouges, les voisins bleus), case vide (verte, remplie de
30), « 3O » illisible (rouge), proportion juste (4 cases), le piège de la fiche
(diviser par la classe entière quand la question dit « parmi les garçons » :
liste et dénominateur rouges, les deux autres bleues, le message écrit 3/13),
listes vides (vertes), identité `tableau-proportions`/`tdp`. Le banc
navigateur couvre l'écran par ses contrôles universels sans rien déclarer,
et la page a été ouverte dans Chromium à trois largeurs (1280, 820, 400 px) :
aucune erreur, aucun débordement.

**Deux faux pas du banc, à la première exécution** : `const th` déclaré deux
fois dans le même contrôle (le thème, puis le texte de l'écran) — jsdom lève
« Identifier 'th' has already been declared » ; et une lecture du tableau
complété par `/\b9\b/` sur `textContent`, qui colle les cellules sans
séparateur (« Avec lunettes369 ») — le contrôle lit désormais les `.tdp-nb` un
par un. Et le rappel de cours a rougi au contrôle des fractions empilées :
« 3/30 » et « 3/13 » s'écrivent en `\frac`, jamais à plat. `APP_VERSION` 241.

## Seconde 4.6.2 — {tableau-proportions-lettres} : le tableau du 4.6.1, rédigé avec des LETTRES comme la fiche

**Demandé par Turquet en septembre 2026** : « en seconde, fait un exercice comme
le 4.6.1 mais rédigé comme le pdf joint ». Le PDF est la fiche « Compléter le
tableau » dans sa rédaction d'origine, que le 4.6.1 avait paraphrasée : les
groupes du tableau portent des LETTRES — A = Garçons, B = Filles, C = Élèves
avec lunettes, D = Élèves sans lunettes — et toute la fiche se dit avec elles.

**Ce que dit la fiche, et ce que fait l'exercice** (une SITUATION = sept
questions, dans l'ordre de la fiche) :

1. **le tableau** — les quatre effectifs donnés, cinq totaux à écrire (5 cases) ;
2. **« Donner le nombre correspondant au total de A : … on dit que A = … »**,
   puis de C, puis « à A et C » — une question de trois lignes, DEUX cases par
   ligne (le nombre, puis le même nombre redit avec la notation) : 6 cases.
   La fiche ne dit pas ce que la seconde case attend ; l'exercice la lit comme
   le même effectif, dit avec « A = … ». À corriger si la fiche voulait autre chose ;
3. **cinq proportions** (5 × 4 cases), dans l'ordre de la fiche : A dans la
   classe, C dans la classe, « A et C » dans la classe, C parmi A, A parmi C.
   (La fiche numérote 1, 2, 3, 5, 6 : le 4 manque, l'exercice numérote 1 à 5.)
   Chacune : « Ici on étudie les élèves [A] parmi [la classe] », puis la
   fraction « nbr d'élèves [A] et qui sont parmi [la classe] / nombre total
   d'élèves parmi [la classe] = … / … ». Les deux listes se complètent
   « avec les lettres A ; C ; A et C ou la classe » (elles offrent toutes les
   lettres : A, B, C, D et les quatre croisements). Les mots du libellé
   (« [A] », « [la classe] ») se recopient depuis les listes, comme au 4.6.1 ;
   ce sont les DEUX effectifs, après le « = », qui sont des cases empilées.

**La question reste écrite en MOTS**, comme sur la fiche : « Calculer la
proportion <gris>des garçons</gris> <gras>dans la classe</gras>. » — le groupe
étudié en gris (`.tdl-g`), le tout en gras. Traduire les mots en lettres est le
travail de l'élève ; c'est aussi pourquoi le numéro de la question précède
l'énoncé (« 1) »).

**Ce qui est partagé avec le 4.6.1** : les huit mises en situation `TDP_CTX`,
le tirage des quatre cases (1 à 20, `tdpGenTable`, tables distinctes par
`distincte()`), les clés de groupes (`c0`, `c1`, `l0`, `l1`, `xLC`), `tdpEff`,
`tdpTotaux`, `tdpAlt` (« A et C » est aussi juste pour « C parmi A » : mêmes
élèves), `tdpJuste`, et les styles `.tdp-*`. **Ce qui est propre** : les lettres
(`tdlLettre`), la phase « nombre », `TDL_V` (quatre tournures, le gris et le
gras), la fraction de droite. Une situation choisit UNE colonne et UNE ligne
(`q.c`, `q.l`) : le tableau, les nombres et les cinq proportions parlent des
mêmes lettres. `q.v` range l'indice de la tournure, jamais le texte.

**Barème** : 5 + 6 + 5 × 4 = 31 cases par situation. Sept questions par défaut
(`TDL_NB`) ; le réglage « Questions » d'un devoir se lit au tirage
(`dmNbQuestions`) et allonge la séance situation par situation (au plus 10 :
la seconde situation est alors coupée). Pas de bouton des tables (`TABLES_SANS`
et `tablesAide.sans` du profil).

**Le contrôle** (banc principal, « proportions dans un tableau avec des lettres :
le tirage, la correction et la place dans le thème Pourcentages ») : la place
(4.6.2, le 4.6.1 et le 4.5.5 ne bougent pas) ; 1 000 tirages (sept questions, phases
dans l'ordre, cinq proportions telles que la fiche les pose, une seule
situation par séance, cases de 1 à 20) ; les réponses attendues contre des SOMMES
écrites dans le banc, sur la table de la fiche (13, 9 et 3 pour A, C, A et C ;
13/30, 9/30, 3/30, 3/13, 3/9) et sur les quarante croisements (qui, parmi) ;
puis la correction par le BOUTON — tableau juste et totaux échangés, phase
« nombre » juste, fausse et vide, proportion juste, mauvais « tout » (message
« 3 sur 13 »), « A et C » accepté, « B et C » refusé, cases vides. Le banc
navigateur couvre l'écran par ses contrôles universels sans rien déclarer.

## Seconde 4.6.3 — {tableau-proportions-lettres-tirees} : le 4.6.2, la paire de lettres TIRÉE

**Demandé par Turquet en septembre 2026** : « en seconde, un nouvel exercice
exactement comme le 4.6.2, mais il faudra choisir une lettre parmi A ou B puis
une lettre parmi C ou D au hasard, puis construire l'exercice avec ces deux
lettres ». Le 4.6.2 tirait déjà une colonne et une ligne par situation ; la
réponse de Turquet à la question posée : « une seule lettre par axe, tout le
reste sur elles » — donc le même moteur, et des proportions plus variées.

**Moteur partagé, identité propre** (journal 09) : même `kind` `tdl`, même
écran, même rendu et même correction ; seuls changent le tirage
(`tdlBuildQuestionsTirees`), le démarreur (`startTdlTirees` →
`demarrerTdl(qId, construire)`) et `test.qId`. Le rappel et les questions à
l'IA restent ceux du 4.6.2 (indexés par `kind`).

**Le tirage** : X (colonne A ou B) et Y (ligne C ou D) tirés une fois par
situation et rangés (`q.c`, `q.l`). Sept questions : tableau, nombres de X, Y,
« X et Y », puis cinq proportions — trois fixes dans la classe (X, Y, « X et Y »)
et DEUX tirées sans remise parmi quatre (`TDL_FIN`) : Y parmi X, X parmi Y,
« X et Y » parmi X, « X et Y » parmi Y. Aucune lettre hors de la paire ne sort.
Barème inchangé : 31 cases par situation.

**Contrôle** (`tableauProportionsTirees`) : 1 000 tirages (sept questions, phases
dans l'ordre, jamais une lettre hors paire, les quatre paires sortent, les deux
proportions finales diffèrent et varient), deux effectifs contre des sommes
écrites à part, une copie juste par le bouton (7 cases bleues).

## Seconde 4.6.4 — {tableau-proportions-directes} : le 4.6.3, la fraction DIRECTE

**Demandé par Turquet en octobre 2026** : « un exercice comme le 4.6.3, qui
demande de compléter un tableau de valeurs, mais qui ne demande plus les
valeurs des lettres (A ; C ; A et C). De plus, pour chaque question, on
demandera directement la valeur du petit effectif sur le grand effectif sans
rien afficher d'autre. »

**Moteur partagé, identité propre** (journal 09) : même `kind` `tdl`, même
écran, même tirage de paire que le 4.6.3 (`TDL_FIN`). Les questions portent
`q.dir=1`, et quatre endroits s'y règlent : `tdlCases` (deux cases seulement,
`tdl-num` et `tdl-den`), le rendu (le tableau complété, la question, puis la
fraction à deux cases empilées — ni « Ici on étudie… », ni les phrases
« nbr de … / nombre total de … »), le pourquoi (dit en mots, sans lettre) et
la copie enregistrée (`given` = « num/den »). Six questions par situation
(`TDLD_NB`) : le tableau, puis les cinq proportions, numérotées 1) à 5).
Barème : 5 + 5 × 2 = 15 cases.

**Contrôle** (`tableauProportionsDirectes`) : 1 000 tirages (six questions,
phases dans l'ordre, deux cases par proportion, jamais une lettre hors de la
paire, les quatre paires et les couples finaux varient), trois effectifs
contre des sommes écrites à part, l'écran (deux champs, aucune liste, aucune
phrase à trous), une copie juste (2 cases bleues, enregistrée juste) et un
dénominateur faux (le numérateur reste bleu, seul le dénominateur rougit).

## Seconde 4.6.5 — {tableau-proportions-parmi} : « C'est la proportion de … parmi … »

**Demandé par Turquet en octobre 2026**, avec une fiche PDF d'une demi-page :
« un exercice comme le 4.6.3, avec des valeurs plus petites ou égales à 10
dans les cases qui ne sont pas dans les lignes ou colonnes des totaux.
Demander de compléter le tableau, puis ne pas demander de déterminer les
effectifs des lettres. Les questions peuvent être en rapport avec n'importe
quelle colonne ou ligne. » La fiche dit quoi afficher après le tableau :
« C'est la proportion de …… parmi …… » (les …… sont les lettres A ; B ; C ;
D ou A et C ; A et D ; B et C ou B et D, ou tout), puis « en fonction de la
question » la fraction « A parmi C / parmi C = …/… » — ou « A parmi tout /
parmi tout », « A et C parmi tout / parmi tout ».

**Moteur partagé, identité propre** (journal 09) : même `kind` `tdl`, même
écran ; les questions portent `q.red=1`, et cinq endroits s'y règlent :
`tdlCases` (quatre cases : `tdl-qui`, `tdl-parmi`, `tdl-num`, `tdl-den`), le
prompt, le rendu, le pourquoi et la copie enregistrée ; l'aide IA (`ctxTdl`)
décrit la rédaction propre. Le rappel et `QIA_SUGG` restent ceux du `kind`.

**Le tirage** : cases intérieures de 1 à 10 (`TDLR_MAX`, `tdlrGenTable`) ;
les totaux se calculent et dépassent 10. Plus de paire de lettres : les
seize proportions possibles se rangent en trois familles, celles de la fiche
— une lettre parmi tout (4), un croisement parmi tout (4), une lettre parmi
une lettre de l'autre axe (8). Une de chaque, puis deux de plus tirées dans
le reste : cinq proportions DISTINCTES, ordre mélangé (`tdlrProportions`).
Six questions par situation (`TDLR_NB`) : le tableau, puis les cinq
proportions numérotées 1) à 5). Barème : 5 + 5 × 4 = 25 cases.

**La rédaction.** Les deux listes offrent les neuf choix de la fiche, dans
son ordre (`TDLR_LISTE` : A, B, C, D, A et C, A et D, B et C, B et D, tout).
« Afficher en fonction de la question » est LU comme : les libellés de la
fraction recopient EN DIRECT les choix de l'élève (`tdlLibellesR`, « … »
tant que rien n'est choisi) — écrire la bonne lettre à sa place aurait
donné la réponse des listes. À corriger si la fiche voulait l'inverse.
« A et C » est accepté pour « A parmi C » (`tdpAlt`, mêmes élèves).

**Contrôle** (`tableauProportionsParmi`) : la place (4.6.5, le 4.6.4 ne
bouge pas) ; 1 000 tirages (six questions, cases de 1 à 10 et les deux bornes
vues, quatre cases par proportion, les trois familles dans chaque situation,
aucune proportion deux fois ni impossible, les seize vues) ; quatre
effectifs contre des sommes écrites à part ; l'écran (les neuf choix dans
l'ordre de la fiche, la phrase, les libellés « A parmi D / parmi D » recopiés
après choix) ; une copie juste (4 cases bleues, enregistrée juste) ; le piège
« parmi tout » au lieu de « parmi D » (la liste « parmi » rougit, « de »
reste bleue, le message écrit la proportion).

## {pourcentage-phrases} — du texte au schéma, le 4.1.10 pris depuis les phrases (Seconde, septembre 2026, 4.1.11)

**D'où il vient.** Demande de Turquet : « en seconde, un nouvel exercice comme
le 4.1.10, modifié pour qu'il apparaisse comme sur le pdf, avec des cadres
supplémentaires, la phrase en gris et les nombres à placer dans le schéma pour
déterminer la case manquante dans la 3ème phrase ». **Le PDF n'était pas
joint à la session** : la mise en page est une LECTURE de cette phrase, à
corriger si la fiche dit autre chose (les phrases grises, l'ordre des cadres,
la phrase à trous toujours en troisième).

**Ce que fait l'exercice.** Le 4.1.10 lit un schéma pour écrire des phrases ;
celui-ci part des phrases. Un cadre gris porte les DEUX premières phrases,
données et écrites en gris (`.pcp-phrase.pcp-grise`, jamais une case), et la
troisième, à trou : la case `pcpS3`, un pourcentage entier. Sous ce cadre, le
schéma (boîtes et deux flèches) dans un cadre, puis le calcul global dans un
cadre en pointillé : six cases en tout, `pcpD1`, `pcpD2` (les flèches),
`pcpG1`, `pcpG2`, `pcpG` (le calcul), `pcpS3` (la phrase). Une seule forme :
il n'y a plus de flèche à retrouver, les nombres sont dans les phrases.

**Ce qui est partagé avec le 4.1.10** : `PCS_PCTS` (multiples de 5, produit
multiple de 100 — le global est toujours entier), `CTX_PCS` (les huit mises
en situation et leurs tournures `s1`/`s2`/`s3`), `pcsJuge`, `pcsAttendu`. Les
jugements sont donc les mêmes : 0,3 et 0,30 valent le même nombre, « 6,5 »
n'est pas « 6 ». Ce qui est propre : `genPcp`, `PCP_ENONCES`, `pcpCases`,
`renderPcpTest`, `checkPcpAnswer`, `RAP_PCP`, `QIA_SUGG.pcp`. `q.v` range les
habits (consigne, tournure des trois phrases), hors de la clé de `distinctes()`.

**Branchements** : les quinze, dont `THEMES` (4.1.11, après le 4.1.10), la
réserve du bas, `liveCheckCurrent()`, `DISPATCH`, `testScreens`, les rendus
enveloppés, `RAPPELS_ID` et la table `cles` de `tests/profils.js`.

**Contrôles** (`tests/verifier.js`, `pourcentagePhrases`, absent-déclaré hors
Seconde) : le tirage sur quarante séances (entiers, produit, global de 1 à 99,
énoncé sans « undefined », aucun doublon, « Recommencer »), puis l'écran sur
copies épinglées : deux phrases grises écrites et une phrase à case, six
cases, trois cadres, copie juste bleue qui vaut le point, « 50 % » (30 + 20)
rouge seul avec sa correction verte, « 6,5 » refusé, case vide jamais rouge.
Le premier passage a rougi sur le contrôle : la correction porte la classe
`mf-cor`, pas `sol`.
**Puis la case du croisement a été acceptée aussi** (demande de Turquet, le
lendemain : « accepte aussi « sont des garçons avec lunettes » parmi les
garçons »). Pour une proportion d'un groupe parmi l'autre axe, `tdpAlt(q)`
donne la clé de la case au croisement (`gk` = `l0`, `rk` = `c0` → `x00`), et
`tdpJuste` l'accepte dans la liste « qui » à côté de la formulation de la
fiche — la correction, elle, écrit toujours celle de la fiche (`bon` ne
change pas, c'est `alt` qui s'ajoute). Rien quand le tout est l'effectif
entier : « ont des lunettes » dans la classe n'est pas « sont des garçons
avec lunettes » dans la classe, la fraction n'est pas la même. Le contrôle
tient les deux bords : la case du croisement acceptée (3/13, bleue), une
autre case refusée (« sont des filles avec lunettes » parmi les garçons,
rouge), et aucune alternative quand le tout est la classe. `APP_VERSION` 242.

---

**La phrase à case est tirée — parfois le global est donné** (octobre 2026,
`APP_VERSION` 262). « Fais pareil » après le 4.1.13 (la demande disait
« 4.1.12 », mais le 4.1.12 ne donne aucun pourcentage dans ses phrases — et
donne déjà parfois le global dans son schéma : Turquet a confirmé le 4.1.11).
`genPcp` range `q.inc` (3 une fois sur deux ; 1 ou 2 sinon). Les deux phrases
données sont grises, la phrase à case (`pcpS1`, `pcpS2` ou `pcpS3`) ne l'est
pas ; l'ordre reste 1-2-3. Correction par division quand une petite flèche
manquait, rappel et consignes mis à jour. Contrôle (`pourcentagePhrases`) :
formes 1 et 2 épinglées, les trois formes sur 400 tirages ; la clé de
distinction du premier contrôle inclut désormais `inc`.

## {schema-evolution} — le schéma du 4.5.4 à coefficient donné (Seconde, 4.5.6, septembre 2026)

**D'où il vient.** Une image du schéma de {synthese-evolutions} et une
demande : « un exercice comme le schéma du 4.5.4. Il faut donner un
coefficient multiplicateur dans la case juste en bas de la flèche, et l'élève
doit compléter logiquement le schéma. Le résultat doit être un pourcentage
multiple de 10 ou inférieur à 10. » C'est le 4.5.4 PRIS À L'ENVERS : la page
écrit le coefficient sous la flèche (`span.sev-val`, à la taille d'une case,
le motif de `.pcs-val` — le contrôle « les cases de saisie ont la taille des
nombres qui les entourent » le compte parmi les nombres), et l'élève remonte
la flèche « ↑ −1 » : le pourcentage décimal dans la parenthèse (`sevP`,
jugé par `parseDecToFrac` : 0,3 et 0,30 valent pareil), le mot
hausse/baisse (`sevW`) et le pourcentage entier (`sevT`).

**Le signe de la parenthèse est écrit par la page**, comme sur l'image
(« × (1 − … ) ») : il se lit sur le coefficient. Les boîtes Avant/Après n'ont
pas de case — aucun nombre n'est donné pour elles, on n'en juge donc aucune
(le motif de {evolutions-successives}) ; c'est un choix à revoir si la
consigne voulait des cases libres.

**Les pourcentages** : 1 à 9, ou un multiple de 10 (jusqu'à 100 pour une
hausse — coefficient 2 —, 90 pour une baisse). Une séance pose une hausse et
une baisse d'office et, sur au moins une question, un pourcentage inférieur à
10 (`q.s`, `q.P`, `q.c` en centièmes ; `q.v` et `q.ci` hors de la clé de
`distinctes()`). Kind « sev », hors de `PCT_KINDS` (contexte au modèle =
`ctxVisible()`), rappel `RAP_SEV`, « Recommencer » générique.

**Ce que le contrôle tient** (`tests/verifier.js`, `schemaEvolution`,
absent-déclaré sans `startSchemaEvol`) : le tirage sur quarante séances
(pourcentage < 10 ou multiple de 10, coefficient cohérent, les deux sens,
un petit pourcentage au moins une fois, aucun doublon, « Recommencer ») ;
puis le schéma sur des copies épinglées (1,3 / 0,95 / 2) : coefficient écrit
et non saisissable, signe, flèche « −1 », copie juste bleue qui vaut le
point, mauvais mot rouge avec correction verte sans faire rougir les cases
justes, coefficient recopié (0,8 et 80 %) refusé, case vide jamais rouge.

---

## {pourcentage-schema-vide} — le 4.1.12 sans aucun nombre dans le schéma (Seconde, 4.1.13, septembre 2026)

**D'où il vient.** Demande de Turquet : « en seconde, un exercice comme le
4.1.12, mais on ne met aucun nombre dans le schéma ; on donne deux pourcentages
dans les phrases et on complète toutes les autres cases, présenté comme le
4.1.12 avec les cadres de couleurs ».

**Ce que fait l'exercice.** Même écran que `{pourcentage-schema-cadres}` : trois
boîtes cadrées (bleu plein, rouge tirets, vert pointillés), calcul global, trois
phrases cadrées. Les deux premières phrases DONNENT P1 et P2, écrits — ce ne
sont pas des cases ; le schéma est entièrement vide : `psvD1`, `psvD2` (les
flèches), `psvG1`, `psvG2`, `psvG` (le calcul global), plus `psvS3` (la
troisième phrase) — six cases. Une seule forme, la question n'a pas de flèche
à retrouver.

**Partagé avec le 4.1.12** : `CTX_PCC` (huit contextes et leurs cadres),
`PCC_PCTS` (multiples de 5, produit multiple de 100 : le global est entier),
`.cdr`. Propre : `genPsv`, `PSV_ENONCES`, `psvCases`, `renderPsvTest`,
`checkPsvAnswer`, `RAP_PSV`, `QIA_SUGG.psv`. Jugement identique (0,3 = 0,30,
« 6,5 » refusé).

**Piège : le préfixe.** Le premier jet s'appelait `pcv`. Or `pcv` est déjà le
kind de l'exercice Python (`RAPPELS.pcv`, `scr-pcv`, `pcvHost`, `pcvCases`…) :
le fichier chargeait avec une erreur « Identifier 'RAP_PCV' has already been
declared », et un préfixe qui n'aurait pas eu de const en double aurait
silencieusement remplacé l'autre exercice. Avant de choisir un préfixe :
`git show HEAD:secondes.html | grep -ic "<préfixe>"`. Retenu : `psv`.

**Contrôle** (`pourcentageSchemaVide`, `tests/verifier.js`) : sur les huit
contextes, six cases, aucun nombre écrit dans le schéma, phrases 1 et 2 sans
case et avec leur pourcentage, cadres sur boîtes et phrases ; puis « 65 % »
rouge seul, les cinq cases justes bleues, la copie juste vaut le point, la
case vide ne rougit pas. `APP_VERSION` 252.

**L'ordre des trois phrases est tiré** (septembre 2026, `APP_VERSION` 257).
Demande : « les 3 phrases en dessous du schéma dans un ordre aléatoire » pour
le 4.1.12 et le 4.1.13. Le 4.1.12 (`genPcc`) rangeait déjà `q.ordre`
(`qdMelanger([0,1,2])`) ; le 4.1.13 (`genPsv`) posait toujours les phrases dans
l'ordre 1-2-3. Il a maintenant le même `q.ordre`, rangé dans la question (on
range l'indice, jamais l'objet) et hors de la clé de `distinctes()` ; une pause
ancienne, sans `ordre`, se rouvre dans l'ancien ordre. Le contrôle
(`pourcentageSchemaVide`) impose trois ordres épinglés à l'écran et les six
ordres sur 300 tirages.

**La phrase à case est tirée — parfois le global est donné** (octobre 2026,
`APP_VERSION` 262). Demande : « les % donnés dans les phrases sous le schéma
ne concernent pas forcément les petites flèches ; il faut aussi donner de
temps en temps le % de la grande flèche ». `genPsv` range `q.inc`, le
pourcentage inconnu : 3 (le global, une fois sur deux — l'exercice d'avant),
1 ou 2 (une petite flèche ; la troisième phrase DONNE alors le global, et
l'élève retrouve la flèche par division, 0,06 ÷ 0,20 = 0,30). `inc` est une
donnée, pas un habit : il entre dans la clé de `distinctes()`. La case de
phrase s'appelle `psvS1`, `psvS2` ou `psvS3` selon la phrase qui la porte ;
une pause ancienne, sans `inc`, se rouvre en forme 3 (`psvInc`). Les
consignes ne disent plus « les deux premières phrases » — faux depuis que
l'ordre est tiré. Le rappel nomme la grande flèche et la division ; la
correction montre la division quand une petite flèche manquait. Contrôle
(`pourcentageSchemaVide`) : formes 1 et 2 épinglées (case à sa place, global
« 6 % » écrit, « 6 » recopié rouge, copie juste au point, case vide jamais
rouge), et les trois formes sur 400 tirages, le global inconnu entre 30 et
70 % des fois.

## {evolutions-successives-coef} — le 4.5.5 à coefficients donnés, puis trois phrases (Seconde, 4.5.7, septembre 2026)

**D'où il vient.** « Un exercice comme le 4.5.5, mais où l'on donne les deux
coefficients multiplicateurs du haut ; l'élève complète toutes les cases du
schéma logiquement, puis trois phrases qui demandent chacune l'une des trois
évolutions en pourcentage. » (image jointe : 0,70 et 1,10 écrits sous les
flèches, parenthèses « 1 − » et « 1 + » à compléter, calcul global vide.)

**Ce qui est repris, ce qui change.** Tirage, énoncés et boîtes viennent de
{evolutions-successives} (`genEvs` : le global est entier, non nul, sous 100 ;
trois formes de signes par séance). Les deux coefficients sont ÉCRITS par la
page (`.evc-val`, à la taille d'une case, le motif de `.sev-val`) et le signe
des parenthèses se lit sur eux. L'élève saisit : les deux pourcentages
décimaux, le calcul du coefficient global (les deux facteurs recopiés, le
produit), le pourcentage global décimal (le signe « ± » se lit sur le produit
écrit), puis trois phrases « Première évolution / Deuxième évolution /
Évolution globale : une [hausse|baisse] de … % ». Kind « evc », écran
`scr-evc`, rappel `RAP_EVC`. Les boîtes n'ont pas de case.

**Ce que le contrôle tient** (`tests/verifier.js`, `evolutionsSuccessivesCoef`,
absent-déclaré sans `startEvolSuccCoef`) : le tirage sur quarante séances
(global entier, coefficients cohérents, trois formes, « Recommencer ») ; le
schéma (coefficients écrits et non saisissables, « ± » avant la frappe, trois
menus) ; le verdict case par case sur des copies épinglées (−30 % puis +10 % ;
+20 % puis +30 %) : copie juste bleue qui vaut le point, faute isolée sans
faire rougir les cases justes, correction verte du mot, case vide jamais rouge.
Le navigateur voit le reste par la visite universelle (section 9).

## {evolutions-successives-phrases} — le 4.5.5 dont les deux premières phrases sont données (Seconde, 4.5.8, septembre 2026)

**D'où il vient.** « Un exercice comme le 4.5.7, mais où l'on donne dans les
phrases du bas les deux premiers pourcentages d'évolution, en précisant si
c'est une baisse ou une hausse à chaque fois ; l'élève complète ensuite le
schéma du dessus ainsi que la dernière phrase. »

**Ce qui est repris, ce qui change.** C'est le 4.5.7 retourné. Tirage, énoncés
et boîtes viennent de {evolutions-successives} (`genEvs` : le global est entier,
trois formes de signes par séance). Ce qui est donné n'est plus le coefficient
sous la flèche mais la phrase « Première évolution : une hausse de 20 % » (écrite
par la page, deux fois) : le signe de chaque parenthèse « × (1 + … » se lit
donc sur elle et la page l'écrit d'avance. L'élève saisit les deux pourcentages
décimaux, les deux coefficients (les deux cases sont saisies, contrairement au
4.5.7), le calcul du coefficient global, le pourcentage global décimal (« ± »
lu sur le produit écrit), puis la dernière phrase : mot choisi et pourcentage.
Kind « evp », écran `scr-evp`, rappel `RAP_EVP`, identité
`evolutions-successives-phrases`. Dix cases jugées, chacune seule : une case
juste ne rougit pas à côté d'une fausse, une case vide ne rougit jamais.

**Ce que le contrôle tient** (`tests/verifier.js`, `evolutionsSuccessivesPhrases`,
absent-déclaré sans `startEvolSuccPhrases`) : le tirage sur quarante séances ;
l'écran (deux phrases écrites au bon mot et au bon pourcentage, une seule à
compléter, signes des parenthèses, « ± » avant la frappe) ; le verdict sur des
copies épinglées (−30 % puis +10 % ; +20 % puis +30 %) : copie juste bleue qui
vaut le point, faute isolée sans faire rougir les autres, correction verte du
mot, case vide jamais rouge. `APP_VERSION` 254.

---

## {synthese-pourcentages-redigee} — la synthèse RÉDIGÉE des quatre schémas (Seconde, 4.5.9, octobre 2026)

**D'où il vient.** Demande de Turquet : « un exercice de synthèse sur les
pourcentages qui reprend de façon équilibrée toutes les questions possibles
des exercices 4.1.8, 4.1.9, 4.5.4 et 4.5.5, qui demande de rédiger une
solution avec une case comme le 4.2.10, et qui vérifie que l'élève a au moins
écrit une multiplication ou une division donnant la réponse. On ne demande
pas de détailler l'étape entre le % et le coefficient multiplicateur : si la
réponse est un pourcentage ou une évolution, « … % », « +… % » ou « −… % »
suffit. Sinon, un bouton “Aide schéma” affiche le schéma de la question et
reprend la résolution comme dans l'exercice associé ; l'élève termine
ensuite comme dans ces exercices. » Kind « spr », écran `scr-spr`, ajouté EN
DERNIER dans 4.5 : rien n'est renuméroté.

**Le tirage est celui des quatre exercices, et rien n'est recopié.**
`genPctBoite` (4.1.8, inconnues res/ini/pct), `genPctChaine` (4.1.9,
comb/p1/p2), `genSyn('aug'|'dim', …)` (4.5.4, fin/ini/pct) et `genEvs`
(4.5.5, deux hausses / deux baisses / une de chaque). Chaque séance pose UNE
question de chaque source (4 questions), en ordre mélangé ; un devoir qui
allonge fait tourner les inconnues de chaque source dans un ordre tiré une
fois — à 12 questions, chaque inconnue de chaque source sort exactement une
fois (le contrôle le mesure en remplaçant `dmNbQuestions`). La question garde
ses champs d'origine, plus `src` et `aide` : c'est ce qui permet de la
confier telle quelle au rendu de l'exercice d'origine.

**Le juge est dans la page et décide seul — aucun appel au modèle.** La
feuille est celle du 4.2.10 (`mlFeuille`, lignes indépendantes) ; chaque
ligne se découpe aux « = » et chaque membre se lit en rationnels exacts par
`salExpr`, le lecteur du 4.2.10. Il faut AU MOINS UN membre dont l'opération
du niveau haut est une multiplication ou une division, dans une ligne qui
écrit un résultat, et dont la valeur est la réponse. Pour une réponse en
pourcentage, cette valeur peut être le coefficient, l'écriture décimale ou le
pourcentage lui-même (« 360 ÷ 800 = 0,45 », « 600 ÷ 500 = 1,2 »,
« 0,4 × 0,3 = 0,12 »), puis la réponse s'écrit « … % » n'importe où dans la
copie. Un membre qui n'est QU'UN pourcentage CONCLUT et n'entre pas dans les
égalités : « 600 ÷ 500 = 1,2 = +20 % » est accepté (c'est exactement « on ne
détaille pas l'étape entre le % et le coefficient ») ; dans un calcul,
« 40 % » vaut 40/100 (« 40 % × 30 % = 12 % » passe). Le SIGNE : facultatif
pour une seule évolution (l'énoncé le dit déjà) mais un signe FAUX est
refusé ; EXIGÉ pour deux évolutions successives, dont c'est le sujet même
(4.5.5). Une égalité fausse est refusée en la NOMMANT ; une ligne que le juge
ne sait pas lire est un commentaire, ni comptée ni refusée. La voie
« augmentation puis addition » du 4.2.10 n'est PAS acceptée seule : la
demande exige une multiplication ou une division qui donne la réponse, et le
message le dit (« aucune de tes multiplications ou divisions ne donne
directement la réponse »). Après un échec, la page écrit UNE solution
(`sprSolution`), comme les schémas écrivent leur « Réponse : ».

**« Aide schéma » EMPRUNTE l'écran d'origine au lieu de recopier le schéma.**
Les quatre écrans d'origine ont la même charpente (`…Prompt`, `.mp-stage`
autour de `…Host`, `…Feedback`, `…Actions`) : `sprEmprunter` déplace la
scène, le verdict et les commandes de l'écran d'origine dans `#sprSch`, puis
appelle SON rendu (`renderPctBoiteTest`, `renderPctChaineTest`,
`renderEvbTest`, `renderEvsTest`) sur la question courante — mêmes
identifiants, même vérification, même correction en direct du soutien
(`liveCheckCurrent` → `sprLive` → le `check…(true)` d'origine), même
correction verte. `sprRestituer` rend les nœuds à leur place, et elle est
appelée par `show()` dès qu'on quitte `spr`, et par chaque rendu de `spr` :
un exercice d'origine ouvert ensuite retrouve sa zone intacte. Le seul
crochet posé chez les quatre exercices est une ligne dans leur
« Question suivante » (`if(test.kind==='spr') nextSpr()`). `#sprSch` précède
`#sprRed` dans le DOM pour que la rangée des jetons (et la touche du clavier
mathématique) se pose devant la zone VISIBLE : `pmJetons` la met devant le
premier `.mp-feedback` de l'écran. Le choix de l'aide est rangé dans la
question (`q.aide`) : une pause le reprend. La question aidée vaut le même
point ; le relevé envoyé au professeur la marque « [schéma] ».

**Ce qui n'est pas mesuré.** Le contrôle dédié (`syntheseRedigee`, banc
principal) tient le tirage, vingt copies épinglées du juge sur les quatre
sources (acceptées et refusées), et l'aller-retour de l'emprunt (venue,
point compté, « Question suivante » qui revient, zone rendue en quittant,
reprise). Le banc navigateur ouvre l'écran avec tous les autres (contrôles
universels) ; rien n'y frappe une copie dans une vraie MathLive — c'est
`toPlain` qui fournit au juge le texte qu'il lit, et les copies épinglées
sont écrites sous cette forme (« 360\div0.45=800 », « 45\% »).

**Puis le RETOUR à la rédaction** (octobre 2026). Demande de Turquet :
« il faut que l'élève puisse revenir à la version rédigée sans schéma s'il le
souhaite pour réaliser l'exercice ». Sous la zone empruntée, une rangée fixe de
`#sprSch` porte « ✍️ Revenir à la rédaction » (`sprRedaction`) : `q.aide`
repasse à faux, `renderSpr` rend la zone à son écran d'origine et remontre la
feuille. La rangée est le DERNIER enfant de `#sprSch` — `sprEmprunter` insère
la zone avant elle, et `sprRestituer` ne la déplace pas puisqu'elle n'est pas
empruntée. **La rédaction commencée n'est pas perdue** : `sprAideSchema` range
ses lignes en LaTeX dans `q.brouillon` (du JSON, donc une pause la garde), et
`renderSpr` les récrit dans la feuille au retour. Le schéma rempli ne se
gardait pas d'abord (l'aide redemandée repartait vide) — voir plus bas. **Le retour se ferme
dès que le schéma a donné son verdict** : `sprRedaction` ne fait rien quand
`test.locked`, et la rangée disparaît par CSS dès qu'un bouton « …Next » est
dans `#sprSch` (`:has`). En soutien, un schéma faux ne verrouille pas
(« Revérifier ») : le retour reste offert. Une question finie par la rédaction
après un aller-retour n'est pas marquée « [schéma] ». Le contrôle `t3` fait
l'aller-retour (zone rendue, feuille remontrée, aide redemandée, rangée sous la
zone) et vérifie que le retour est refusé après le verdict du schéma ; rien ne
mesure la feuille récrite, que jsdom ne sait pas lire (pas de MathLive).

**Puis le schéma rempli s'est GARDÉ, lui aussi** (octobre 2026, v288). Demande
de Turquet : « garde aussi le schéma rempli quand l'élève revient ».
`sprRedaction` lit, avant de rendre la zone, chaque case du schéma emprunté
par son identifiant (`sprSchemaLire` : `math-field` en LaTeX par `getValue`,
champ ou liste par `value`) et range l'objet dans `q.schema` ; `renderSpr`,
après le rendu de l'exercice d'origine, les récrit (`sprSchemaRecrire`). La
lecture passe par `querySelectorAll` sur le `…Host` de la source : un schéma
qui gagnerait une case demain est gardé sans rien déclarer. Les couleurs de
la vérification ne se gardent pas — le schéma revient neutre, sans
vert ni rouge, jusqu'à la prochaine vérification. Le contrôle `t3` remplit une
case, revient, redemande l'aide et la retrouve.

**Puis les CADRES du 4.1.13 dans l'aide schéma** (octobre 2026,
`APP_VERSION` 290). Demande de Turquet : « dans le 4.5.9, quand un élève
demande le schéma, faire en plus des cadres comme dans l'exercice 4.1.13 sur
le schéma et dans l'énoncé ». Les mêmes `.cdr` (bleu plein, rouge tirets,
vert pointillés), dans l'ordre des boîtes de gauche à droite, et dans
l'énoncé les mots ou le nombre qui désignent chaque boîte :
· 4.1.8 (`CTX_BOITE`) — le tout et sa valeur en bleu, la partie en rouge ;
  la question prend le cadre de la boîte qu'elle cherche ;
· 4.1.9 (`CTX_CHAINE`) — le total, le sous-groupe, le sous-groupe du
  sous-groupe, comme les phrases du 4.1.13 ; aussi la ligne du calcul global
  et la phrase de conclusion ;
· 4.5.4 — Avant en bleu, Après en rouge, la boîte « Pourcentage
  d'évolution » en vert. Ses tables d'énoncés sont partagées par tout le
  thème : on n'y touche pas, `cdrValeurs` cadre le `<b>nombre unité</b>`
  (sans « % ») qui vaut N ou la valeur finale, et « Retrouve … » prend le
  cadre de la boîte cherchée ;
· 4.5.5 (`EVS_ENONCES`) — le sujet (la valeur au départ) en bleu, la
  première évolution en rouge (elle mène à la boîte du milieu), la seconde en
  vert (elle mène à la boîte d'arrivée).
**Les cadres ne sortent que dans l'aide.** Chaque énoncé reçoit un jeu
`k` ; `cdrAide()` rend `CDR_AVEC` quand `test.kind` vaut « spr », `CDR_SANS`
(l'identité) sinon. Le 4.1.8, le 4.1.9, le 4.5.4 et le 4.5.5 ouverts pour
eux-mêmes sont INCHANGÉS — vérifié à la main au caractère près sur plus de
mille énoncés tirés, ancienne page contre nouvelle — et la rédaction du
4.5.9 (`sprEnonce`, sans `k`) reste sans cadre, comme le texte envoyé au
professeur. Contrôle `t4` (`syntheseRedigee`) : onze questions épinglées
(toutes les inconnues des quatre sources) — boîtes cadrées dans l'ordre,
cadres de l'énoncé, aucun cadre dans un cadre, texte sans cadres mot pour mot
celui de l'origine, rédaction sans cadre ; puis les quatre exercices
d'origine sans aucun cadre.

## {pourcentages-problemes} — des PROBLÈMES de pourcentages, rédigés (Seconde, 4.5.10, octobre 2026)

**D'où il vient.** Demande de Turquet, une fiche papier de perfectionnement
jointe : « en seconde fais un exercice comme le 4.5.9 de synthèse avec des
énoncés un peu plus complexes comme sur le pdf joint ». La fiche : une veste
augmentée de 20 %, la remise d'une casquette (prix payé et ancien prix, ou
réduction en euros), un sweat-shirt HT et TTC, l'ancien prix d'une chemise
soldée, des proportions de proportions (60 % de garçons dont 15 %… ; 40 % de
filles et, parmi les garçons, 30 %…), le taux d'évolution d'un salaire et
d'un nombre de buts, la cantine (fréquentation en baisse ET tarif en hausse),
la population de Rennes (une hausse, puis deux de suite). Kind « ppb », écran
`scr-ppb`, ajouté EN DERNIER dans 4.5 : rien n'est renuméroté.

**Quatre familles, treize situations.** `val` (une valeur après une
évolution : hausse, ancien prix, cantine, population), `pct` (un pourcentage
d'évolution : remise depuis le prix payé, réduction en euros, taxe HT/TTC,
taux d'évolution entre deux nombres), `prop` (produit de proportions,
complément « 40 % de filles » à convertir en garçons, quotient pour remonter
à la proportion intérieure), `deux` (deux évolutions de suite, TVA puis
remise ou deux évolutions sur un prix, prix de départ avant deux
évolutions). Une question par famille et par séance, en ordre mélangé ; un
devoir qui allonge fait tourner les situations de chaque famille — à 16
questions, toutes sortent (le contrôle le mesure). **Tout tombe juste** : les
prix sont tirés en CENTIMES, les populations en dixièmes de pour cent, et
chaque condition de divisibilité est posée au tirage (`c*(100+P)%100===0`…) —
aucun flottant n'entre dans un calcul. La cantine et la population donnent
une donnée QUI NE SERT PAS (le tarif quand on demande les élèves, une autre
année) : c'est la complexité demandée.

**Le juge est celui du 4.5.9**, à qui l'on passe désormais la CIBLE :
`sprJuge(q, texte, cible)`, la cible par défaut restant `sprCible(q)` — le
4.5.9 ne voit aucune différence (un contrôle le dit). La cible du 4.5.10
(`ppbCible`) est en rationnels exacts `{n,d}` puisque ses réponses ont des
centimes (50,40 €) ou une décimale (5,5 %) ; elle porte `signeExige` (taux
d'évolution, deux évolutions : l'énoncé ne dit pas le sens) ou `signeLibre`
(remise, taxe : l'énoncé le dit, un signe faux reste refusé), et sa propre
consigne.

**Une copie de problème écrit des unités et des mots** : « 42 × 1,2 =
50,40 € », « 39,52 ÷ 52 = 0,76 soit 24 % », « 546 ÷ 0,91 = 600 élèves ».
Le lecteur du 4.5.9 tenait de telles lignes pour des commentaires — la copie
juste était refusée. `ppbTexte` retire « € » et COUPE LA LIGNE à chaque mot :
un mot n'est jamais un nombre, et « soit » sépare naturellement le calcul de
sa conclusion. Un « x » tapé au clavier entre deux nombres redevient « × »
avant la coupe, sans quoi « 42x1,2 » se serait lu « 42 » puis « 1,2 ».

**« Aide schéma » ne peut PAS emprunter les schémas du 4.5.9** : leurs cases
se lisent par `parseInt`, et ces problèmes ont des centimes. L'aide DESSINE
le schéma en boîtes de la question (`ppbSchema` → `ppbSchemaHTML`, les
classes `.pctb-*` du 4.1.8), données écrites, inconnue en « ? », coefficient
sous la flèche — ou « × ? » quand c'est lui qu'on cherche. La rédaction reste
en place dessous ; le bouton bascule « Masquer le schéma ». Le choix est rangé
dans `q.aide` (une pause le reprend), et `q.vu` retient qu'il a été ouvert :
la réponse est marquée « [schéma] » pour le professeur, et vaut le même point.

**Ce qui est mesuré.** `problemesPourcentages` (banc principal) : le tirage
et la rotation ; **la solution que la page écrit après un échec passe son
propre juge**, sur 60 tirages de chacune des treize situations — et la même
copie au résultat faussé d'une unité est refusée (c'est ce bord qui garantit
qu'aucune situation ne pose une question à laquelle le juge ne sait pas dire
oui) ; 26 copies épinglées (unités, mots, « x », signe exigé ou facultatif,
voie « augmentation puis addition » refusée comme au 4.5.9, donnée inutile
employée) ; l'aide (dessinée, reprise, masquée, « [schéma] »). **Ce qui ne
l'est pas** : comme au 4.5.9, rien ne frappe une copie dans une vraie
MathLive — les copies épinglées sont écrites comme `toPlain` les rend.

**Puis l'aide schéma est devenue CELLE DU 4.5.9** (Turquet, octobre 2026 :
« je souhaite que le bouton aide schéma fonctionne exactement comme le 4.5.9,
avec les mêmes schémas et la même méthode de résolution »). Le schéma dessiné,
avec ses « ? », se regardait et ne se résolvait pas. Désormais la question
PASSE sur le schéma à cases de l'exercice qui pose la même question : le 4.5.4
pour une valeur ou un pourcentage après UNE évolution (hausse, ancien prix,
cantine, population, remise, taxe, taux — la flèche « ↑ −1 » et « C'est une
hausse/baisse de … % » pour un pourcentage), le 4.1.8 pour une réduction en
euros, le 4.1.9 pour une proportion de proportion (coefficient global et
phrase de conclusion), le 4.5.5 pour deux évolutions (parenthèse « ± » LUE sur
le coefficient global, conclusion « augmentation/diminution »). TVA puis
remise et prix de départ — un PRIX après deux évolutions, que le 4.5.9 ne
pose pas — prennent le schéma du 4.5.5 avec une case aux boîtes de départ et
d'arrivée, comme celles du 4.5.4, et sans conclusion. Le schéma REMPLACE la
rédaction, « Revenir à la rédaction » la rend tant qu'il n'a pas donné son
verdict, brouillon et schéma rempli sont gardés (`q.brouillon`, `q.schema`),
l'énoncé et les boîtes prennent les cadres du 4.1.13, la réponse est marquée
« [schéma] » — tout comme au 4.5.9, et le soutien corrige en direct (« ppb »
a quitté la liste des dispenses).

**Ce qui n'a PAS été emprunté : les juges.** Le 4.5.9 déplace la zone de
travail de l'écran d'origine et appelle son rendu et sa vérification ; ceux-ci
lisent leurs cases par `parseInt` et leurs énoncés dans leurs propres tables.
Les centimes (50,40 €), les dixièmes de pour cent (5,5 %) et les coefficients à
trois ou quatre décimales (1,055 ; 1,08) n'y passent pas. Le 4.5.10 écrit donc
ses schémas avec les MÊMES classes (`.pctb-*`, `.pctc-*`, `.evs-*`, `.evb-rev-*`)
et juge chaque case en rationnels exacts (`ppbSchemaCases` : identifiant →
`{n,d}`), toute écriture égale acceptée. Les quatre exercices d'origine n'ont
pas bougé d'une ligne.

**Ce qui est mesuré.** Le contrôle de l'aide (remplace la rédaction, aller-
retour avec le schéma rempli gardé, reprise après pause, case jugée seule,
« [schéma] », retour impossible après le verdict, signe lu sur le coefficient
global, correction en direct du soutien) ; et **chaque situation se résout sur
son schéma** : sur 25 tirages de chacune des treize, les valeurs attendues
écrites dans les cases valent le point, la même copie à la dernière case
faussée ne le vaut pas, les boîtes portent leurs cadres dans l'ordre et
l'énoncé, cadres ôtés, est mot pour mot celui de la rédaction.
