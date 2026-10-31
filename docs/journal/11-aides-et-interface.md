# Aides, rappels, mise en page et navigation

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Les identifiants, eux, ne se renomment jamais.** `'pourcentage'` n'est pas un
titre : c'est la clé sous laquelle les notes des élèves sont enregistrées
(`details.test`). Le renommer ferait disparaître toutes les notes passées de cet
exercice, du bilan de l'élève comme du tableau du professeur — sans rien casser.
Les noms se changent librement, tout en découle ; les identifiants restent.

**Sans balise `<form>`, le gestionnaire de mots de passe de Chrome fouille la
page entière.** Chrome cherche toujours l'identifiant qui accompagne un champ
`type="password"`. Sans frontière de formulaire, il n'a aucune limite : il se
rabat sur le premier champ texte venu — celui où l'élève tape sa réponse — et
pose sa bulle « Gérer les mots de passe » au milieu d'un exercice.
`autocomplete="off"` n'y peut rien, Chrome l'ignore délibérément pour son
gestionnaire depuis 2014. Le symptôme est intermittent — Chrome refait son
analyse à chaque chargement et ne retient pas toujours le même champ —, ce qui
le rend impossible à trouver par relecture. Les trois écrans qui portent une
identité sont donc des `<form onsubmit="return false">`, et celui du professeur
offre l'identifiant (`autocomplete="username"`, rempli depuis `COURRIEL_PROF`)
pour que Chrome n'ait plus aucune raison d'aller le chercher ailleurs. Ce champ
est hors écran mais **rendu** : `display:none` le ferait ignorer, et la fouille
reprendrait. Attention au piège d'à côté : un `<button>` sans `type` explicite
SOUMET le formulaire qui l'entoure, donc recharge la page. Un contrôle tient
les quatre bords sur les trois fichiers.

**Le bouton qui MÈNE à l'aide.** Pire que l'entrée manquante : l'aide entièrement
écrite et rien qui y conduise. « Le plus petit ensemble » (Seconde) construisait
ses boutons dans une fonction à part, qui avait oublié « Poser une question à
l'IA » et le rappel de cours, et qui ne rendait rien hors du soutien — l'exercice
était le seul du niveau sans aucune aide, alors que sa fiche `QIA_SUGG`, son
contexte `ctxPge()` et son rappel `RAP_PGE` existaient tous les trois. Un écran
qui construit ses boutons à part finit par diverger : il passe par
`conseilInlineBtn()` désormais, en gardant son bouton propre (« Schéma des
ensembles »).
Aucun contrôle statique ne pouvait le voir — le banc vérifie qu'une entrée
`QIA_SUGG` existe, pas qu'un bouton l'atteint, et un écran a le droit de poser
son bouton lui-même, comme le fait « Lecture graphique ». Le banc navigateur
OUVRE donc chaque exercice, dans les deux modes, et regarde ce qui s'affiche.
Trois pièges s'y sont montrés. Il faut **franchir les écrans de départ** — les
tables et le calcul mental passent par « Commencer », le signe du second degré
par un choix de niveau : mesurer avant, c'était constater l'absence de boutons
sur un écran de menu, et le contrôle criait sur quatre exercices corrects.
**Les exercices chronométrés n'ont pas d'aide IA, volontairement** : à quatre
secondes par calcul, une question n'a pas de sens. Ils sont déclarés dans
`tests/profils.js` (`aideIA.sans`) et nommés à l'exécution, jamais tus ; un
second contrôle exige que chacun existe encore, sans quoi une exemption
survivrait à l'exercice qu'elle protégeait. Enfin la liste des exercices se lit
dans `TEST_NUM`, jamais en aplatissant `THEMES` : un thème découpé en parties
porte ses identifiants dans `sous`, et la Première en a quatre.

**« Montre-moi un exemple de rédaction de cet exercice. » est proposée partout.**
C'est la première chose qu'un élève bloqué demande, et aucun exercice ne doit en
être privé (décision de Turquet, août 2026). Elle ne peut donc PAS vivre dans
`QIA_SUGG` : une liste à tenir exercice par exercice finit toujours par en
oublier un, et c'est celui-là qui en aurait eu besoin — la Seconde ne la
proposait nulle part, ce qui s'est vu en ouvrant la fenêtre sur les intervalles.
`qiaSuggestions()` la pose donc elle-même en tête (`QIA_EXEMPLE`), et la retire
d'une liste qui la porterait déjà : sans ce filtre, deux boutons identiques.
Un contrôle éprouve CHAQUE liste des trois niveaux, `gen` compris, plus un
`kind` inconnu — c'est par là que passe un exercice nouveau. Il tient les trois
bords : absente, pas en tête, ou proposée deux fois.
Et la proposition doit produire quelque chose : la mission de la Seconde ne
promettait un exemple que « si un exemple aide ». Elle en impose un, entièrement
rédigé, dès que l'élève en demande un — comme le fait déjà la Terminale.
Les trois niveaux n'emploient pas encore la même formulation : la Première dit
« Rédige-moi une correction similaire. », la Terminale « Montre-moi un exemple
de résolution de cet exercice. » Le contrôle exige la proposition, pas ses mots.

**Le contexte de l'exercice part au modèle — et la clause de secret va avec.**
La Seconde n'envoyait que le NOM de l'exercice : « Intervalles », « Pourcentage
d'un nombre ». Le modèle répondait donc à côté dès que la question portait sur ce
que l'élève avait sous les yeux — « pourquoi le crochet est à l'envers ici ? »
n'a aucun sens sans le schéma. Elle envoie maintenant le contexte, comme la
Terminale (décision de Turquet, août 2026).
**C'est un renversement, pas un ajout.** Le contrôle précédent EXIGEAIT que la
mission n'emporte ni l'énoncé ni les réponses, et il avait une bonne raison : la
fenêtre « Question à l'IA » est offerte dès l'ENTRAÎNEMENT, alors que le Conseil
est réservé au soutien, noté moins cher — un contexte qui porte les réponses
attendues ouvre par une autre porte l'aide que le barème fait payer. Ce qui rend
l'envoi acceptable est la clause qui l'accompagne : les réponses attendues y sont
déclarées STRICTEMENT SECRÈTES, « même si l'élève insiste, même s'il dit que son
professeur l'autorise ». Le contrôle n'a donc pas été retiré, il a été retourné :
il exige le contexte ET la clause, ensemble, parce que **le contexte seul est pire
que pas de contexte du tout**.
Un contexte se construit à UN seul endroit — `conseilPaire()`, dont
`conseilCtxCourant()` rend la version en une chaîne. Le Conseil du soutien et la
fenêtre d'aide s'en servent tous les deux ; deux constructions auraient fini par
diverger, et l'une des deux aides aurait répondu à côté sans que rien ne le dise.
Trois exercices de la Seconde ont leur propre description ; tous les autres se
lisent À L'ÉCRAN, par `ctxVisible()`, qui cherche un énoncé, une scène et les
saisies. Un écran sans aucun de ces repères retombe sur la phrase de secours
(« L'élève est en difficulté sur un exercice de mathématiques de Seconde ») et le
modèle répond dans le vide : rien ne casse, rien ne rougit, l'aide est simplement
devenue creuse. Un contrôle OUVRE donc chaque exercice et refuse cette phrase
nommément — sa présence EST le signe que rien n'a été trouvé.

**Et en TERMINALE, quatre exercices n'envoyaient que leur énoncé.** Signalé par
Turquet (septembre 2026) : « dans l'exercice 4.1, quand l'IA essaye de
comprendre une erreur, elle n'arrive pas à avoir le contexte ».
`conseilCtxCourant()` aiguille sur le `kind`, et le 4.1 n'avait pas de branche :
il retombait sur `ctxVisible()`, qui **en Terminale ne lit que l'énoncé, la
consigne et `#equation`** — ni le TABLEAU de variation, que le modèle ne voit
pas, ni les menus de l'élève, ni les réponses attendues. Les TROIS aides qui
passent par là — le Conseil du soutien, la fenêtre « Question à l'IA » et la
bulle « Comprendre mon erreur » — répondaient donc dans le vide.
**LA SONDE A MESURÉ AVANT TOUT CORRECTIF, ET ELLE A ÉLARGI LE SIGNALEMENT** :
QUATRE exercices étaient dans ce cas — le 1.1, le 4.1, le 5.1 et le 5.2, à 166,
134, 177 et 232 caractères, quand les quarante autres en envoient 591 à 3195. Un
défaut vu dans un coin se corrige PARTOUT.
**La Seconde et la Première ne sont pas concernées, et c'est MESURÉ, pas
supposé** : leur `ctxVisible()` lit les SAISIES de l'élève (input, textarea,
math-field, contenteditable), donc y retomber donne un contexte maigre mais
VRAI — aucun exercice de Première ne descend sous 421 caractères, et le contrôle
de la Seconde ci-dessus tient déjà ce bord. La Terminale est le seul niveau dont
le repli ne dit rien.
**Chaque contexte neuf dit les QUATRE mêmes choses**, celles que les branches
voisines disaient déjà : la DESCRIPTION exacte de ce que le modèle ne voit pas
(le tableau de variation du 4.1, le graphique et le point A du 5.1), les
RÉPONSES attendues déclarées strictement secrètes, l'ÉTAT des cases de l'élève
avec la marque de celles que la correction vient de compter fausses, et la
MÉTHODE à faire appliquer sans jamais donner le résultat.
**`dexpFeuilleCtx` a gagné un paramètre FACULTATIF plutôt qu'une jumelle** — sa
phrase de clôture, qui parle de dériver : appelée sans lui, le cas des cinq
exercices de dérivée, elle ne change pas d'un mot. Une liste de cases est la
même partout, la prose qui la referme ne l'est pas, et une seconde fabrique
aurait fini par diverger.
**ET LE CONTRÔLE NE MESURE PAS UNE LONGUEUR** : un seuil serait à régler et une
liste d'exceptions à tenir — les quatre défauts faisaient 134 à 232 caractères,
là où le contrôle de la Seconde se contente de 60. Il compare le contexte à ce
que `ctxVisible()` rend TOUT SEUL : égaux, l'exercice n'a pas de branche, et
c'est exact. Sans seuil, sans liste, et un exercice ajouté demain est couvert
sans rien déclarer. Il se DÉCLARE (`ctxChaqueExercice` dans `tests/profils.js`),
et les deux autres niveaux s'affichent « non applicable » en DISANT pourquoi.
**IL VIT DANS LA CHAÎNE ASYNCHRONE, et il le faut** : les démarreurs de la
Terminale font `cfg=await loadConfig()` AVANT de poser `test.kind`, quand ceux
de la Seconde posent tout avant leur premier `await`. Une boucle synchrone —
celle que porte le contrôle jumeau de la Seconde — y lit donc l'exercice
PRÉCÉDENT : mesuré, les 44 exercices rendaient le MÊME contexte de 72
caractères, et le contrôle serait resté VERT en parlant d'autre chose. D'où le
garde qui exige que les contextes VARIENT ; celui de la Seconde l'a reçu aussi,
où il rend bruyant ce qui n'y est aujourd'hui que latent.
**Et la campagne a montré deux défauts du BANC avant ceux de la page.** Un
contrôle voisin restaure `TEST_NUM[id]` après l'avoir forcé — mais le premier de
`TESTS` est en Terminale l'un des deux exercices gardés HORS de `THEMES`, donc
sans numéro : `TEST_NUM[id]=undefined` CRÉE alors la clé au lieu de la rendre, et
`Object.keys(TEST_NUM)` portait ensuite un exercice qui n'est pas au menu. Et
`signe-second-degre` n'ouvre qu'un ÉCRAN DE MENU : `test` étant global, il garde
le tirage de l'exercice précédent, si bien qu'il était mesuré sur le contexte
d'un AUTRE exercice. On le reconnaît à l'IDENTITÉ du tableau des questions — le
signal de `dmEnonce`, repris tel quel — et on le NOMME au lieu de le mesurer.
**Sept sabotages, et chacun dit quelque chose** : les quatre branches retirées
une par une rougissent en nommant leur exercice et sa longueur ; l'attente du
tirage débranchée rougit en disant « le contrôle ne mesure rien » ; le profil
qui ne déclare plus rien s'affiche « non applicable », le bord OPPOSÉ. Le
septième — le garde du démarreur de menu débranché — reste VERT, et son vert dit
vrai : ce qu'il écarte n'est pas un faux vert mais une FAUSSE ACCUSATION, et
cela se démontre autrement — la branche du 1.1 coupée accuse UN exercice avec
le garde, DEUX sans lui, dont un qui n'est pas en faute.
**Aucun contrôle du NAVIGATEUR, et le dire vaut mieux que de le taire** : un
contexte est une chaîne, assemblée et lue dans le DOM — jsdom la voit, un vrai
Chromium n'en dirait pas plus.

**Le modèle parle simplement, sans qu'on le lui demande.** Le conseil du soutien
et la réponse de la fenêtre « Question à l'IA » s'écrivent TOUJOURS en français
simple (décision de Turquet, août 2026) : ce n'est pas une faveur qu'un élève
réclame, c'est la façon de parler de la plateforme. Ces deux aides ont d'abord
porté un bouton « Explique-moi plus simplement », et le bouton était le défaut :
il supposait que l'élève sache qu'il a le droit de le demander — or celui qui en
a le plus besoin est justement celui qui n'ose pas.
La consigne dit des phrases courtes, une idée par phrase, des mots de tous les
jours, pas de subordonnée ni de tournure passive, le tutoiement. Le vocabulaire
mathématique est **gardé** et expliqué en trois ou quatre mots la première fois,
jamais remplacé : un élève à qui on épargne le mot « intervalle » ne le
connaîtra pas davantage le jour du contrôle. Et elle redit qu'écrire simplement
n'autorise à donner ni résultat ni réponse attendue — sans quoi « simplifier »
devient une porte vers ce que les garde-fous ferment.
**Et elle va à la ligne souvent** : une étape par ligne, un calcul par ligne, une
ligne VIDE entre deux parties, jamais un paragraphe de plus de deux phrases
(décision de Turquet, août 2026). Un pavé de texte décourage l'élève avant qu'il
ait commencé à lire.
Cette consigne a **deux moitiés, et la seconde est muette** : le modèle peut
obéir parfaitement pendant que la page réduit ses retours à la ligne à des
espaces. La Seconde pose la réponse en `textContent`, où `\n` ne vaut rien sans
`white-space:pre-wrap` ; la Première et la Terminale passent par `conseilHTML()`,
qui convertit les `\n` en `<br>`. Deux chemins différents pour une seule
promesse — et aucun banc hors navigateur ne sait où un texte va à la ligne. Le
banc navigateur MESURE donc le même texte avec et sans retours à la ligne, sur
les deux aides : s'ils comptent, la version qui en porte est plus haute. Éprouvé
en retirant `pre-wrap` d'un côté et la conversion de l'autre.
Le `pre-wrap` ne vise que `.mp-feedback.conseil` et `.qia-r`, jamais
`.mp-feedback` tout court : les retours des exercices sont des phrases courtes et
centrées, et le sont très bien.

Elle est posée par la PAGE et non dans `CONSEIL_SYS`, côté fonction Edge, pour
une raison déjà payée : la fonction ne se déploie qu'à la main, et la consigne
serait restée lettre morte jusqu'au redéploiement sans que rien ne le dise. Ici
elle part avec la page. **Un seul endroit la décrit** (`LANGUE_SIMPLE`), partagé
par les deux aides et par le bouton du rappel : deux descriptions auraient fini
par diverger, et l'une des aides aurait reparlé comme avant sans qu'on le voie.

**Un indice posé NU dans un conteneur flex remonte sur la ligne de sa lettre.**
Signalé par Turquet (septembre 2026) sur le 6.13, capture à l'appui : « les
indices n sont mal placés très souvent ». L'écran montrait « U n », « 5 − U n »,
« U n+1 ». Un `<sub>` ou un `<sup>` enfant DIRECT d'un conteneur flex en devient
un ITEM, et la spécification y IGNORE `vertical-align` : l'indice se pose sur la
ligne de la lettre, et le `gap` du conteneur l'en écarte par-dessus le marché.
« Uₙ » se lit alors « U n » — et « eˣ » se lit « e x », c'est-à-dire une
multiplication : ce n'est plus une laideur, c'est une autre opération.
**LA MESURE A ÉTÉ FAITE AVANT DE TOUCHER À QUOI QUE CE SOIT, et elle a ÉLARGI le
signalement** : 2,3 px AU-DESSUS de la ligne au lieu de 4,2 px en dessous, 4 à
7 px d'écart — et surtout **59 indices sur DIX exercices**. Le 6.13 (12) et le
6.15 (17) sont les plus visibles ; le 5.2 (8), le 4.6, le 6.3, le 6.5, le 6.6,
le 6.10, le 6.11 et le 4.5 le portaient aussi, depuis toujours, sans que rien ne
le dise. Un défaut vu dans un coin se corrige PARTOUT.
**La Seconde et la Première n'en posent AUCUN** (mesuré : 0 sur les deux
fichiers) — elles n'écrivent d'indices ni dans une grille ni dans une fraction.
La règle n'y est donc pas écrite : une règle qui n'écarte jamais rien fait croire
qu'on vérifie quelque chose. Le CONTRÔLE, lui, va partout.
**LE GAP N'EST PAS RECOPIÉ, IL EST RELU** : chacun des quatre conteneurs
(`.sa2-frac .num` et `.den`, `.svr-cel`, `.tg-line`, `.s1-line`) pose son écart
dans une variable que son PROPRE `gap` lit, et la marge négative de l'indice lit
la même — recopié, il aurait fini par diverger et l'écart serait revenu sans que
rien ne le dise.
**Deux corrections ont été mesurées, et la plus petite l'a emporté.** Envelopper
chaque indice au rendu donne le rendu NATIF, sans aucune valeur à caler — mais
elle touche le DOM de dix exercices après coup, là où vivent leurs badges de
correction et les comptes de cellules de leurs grilles. La règle CSS ne change
que la peinture, et la mesure départage : 3,8 px de descente contre 4,2 px pour
un indice ordinaire, écart nul. Le décalage est calé PAR LA MESURE et jugé sur
capture, jamais au jugé.
**Le contrôle est UNIVERSEL**, greffé sur la visite qui ouvre tous les exercices
des trois niveaux dans les deux modes : tout `<sub>`/`<sup>` posé dans un flex
doit porter la règle EN USAGE — jamais celle de la feuille de styles, qu'une
cascade peut battre (le piège du 2.1.2) — et sa marge doit annuler EXACTEMENT le
gap de son conteneur. L'exercice qu'on écrira demain rougit s'il pose un indice
dans un conteneur que la règle ne couvre pas encore, sans rien avoir à déclarer.
Son bord OPPOSÉ est déclaré (`indicesEnFlex` dans `tests/profils.js`, deux
sources) : le niveau qui annonce des indices en flex doit en offrir au banc, et
les deux autres s'affichent « non applicable » plutôt que d'être tus.
**Cinq sabotages, chacun rougissant en nommant son défaut** — la règle retirée
(« 20 cas — 4.6 : tg-line « − » posé sur la ligne de sa lettre »), la marge qui
annule le gap retirée (« écarté de sa lettre de 6px par le gap »), le décalage
mis à zéro, le gap RECOPIÉ au lieu d'être relu (« 6.13 — svr-cel : écarté de sa
lettre de 10px ») et les lignes tg sorties de la liste, qui ne rougit plus que
sur les exposants du 5.2 et du 4.6. Aucun contrôle voisin ne bouge sous ces
sabotages : le seul autre « ✗ » de la sortie est sa ligne de résumé — vérifié
plutôt que supposé, parce qu'un rouge qu'on n'explique pas est un rouge qu'on
n'a pas mesuré.

**Une case où l'élève écrit a la taille des nombres qui l'entourent.** Elle est
en mode math — un `<math-field>` —, et sa police fait la même taille que les
chiffres posés à côté (décision de Turquet, août 2026, **valable pour tout
exercice à saisie, présent ou futur**). Une case plus petite fait passer la
réponse de l'élève pour une note en bas de page au milieu du calcul ; c'est ce
que donnait {somme-fractions}, cases à 1,05 rem contre des chiffres à 2 rem.
La référence est l'écran des pourcentages de la Première, qui portait déjà la
règle en toutes lettres dans son commentaire : `font-size:1.9rem` quand les
voisins sont à 2 rem. La largeur suit la taille — à 62 px, une réponse à deux
chiffres débordait.
**« Autour » se mesure, et il a fallu deux essais pour le dire juste.** Le
premier relevé prenait n'importe quel chiffre d'un ancêtre proche : il attrapait
ceux de la multiplication POSÉE, dans le panneau d'à côté, et accusait
{mult-decimaux} et {mult-dec-un} d'un défaut qu'ils n'avaient pas. Un nombre est
« autour » d'une case s'il partage sa LIGNE — recouvrement vertical — ET s'il est
À CÔTÉ : au-delà de 120 px de vide horizontal, c'est un autre bloc. Avec cette
définition, aucune exemption n'est nécessaire nulle part, ce qui est le signe
qu'elle est la bonne : une règle qui demande une liste d'exceptions décrit mal ce
qu'elle mesure.
Le contrôle vit dans le banc navigateur, greffé sur la visite de TOUS les
exercices : un exercice ajouté demain est donc couvert sans rien déclarer. Il
donne le numéro de l'exercice et les deux tailles — « 4.1 — sf-a1 : 16.8px contre
32px ». Le mode math, lui, était déjà acquis partout : la Seconde et la Première
posent les mêmes `math-field`, seule la TAILLE divergeait.

**Une case MathLive grandit pour montrer tout ce qui y est écrit.** Demande de
Turquet (octobre 2026), sur une capture du 6.2.1 de la Terminale : dans
l'hérédité, l'exposant « n − 1 + 1 » se lisait « ı − 1 + 1 », la lettre coupée
par le bord de la case. La case d'exposant (`math-field.rf-mf.rf-exp`) portait
`max-width:64px` — un plafond posé pour tenir la mise en page À VIDE, et qui ne
savait rien de ce que l'élève écrirait. Il y en a des dizaines comme lui dans
les trois niveaux (`rc-mf-idx`, `sp-mf`, `pm-mf`, les cases des pourcentages…),
chacun posé dans son coin : corriger celui du 6.2.1 laissait tous les autres.
**Le remède est un FILET, pas une retouche** — `#cases-math-grandissent`, le
même texte dans les trois fichiers, juste avant `#italiquer-x` : dès que le
contenu d'une case déborde (`.ML__content`, `scrollWidth > clientWidth`), la
case reçoit `max-width:100%` en style posé — elle grandit jusqu'à la largeur de
sa ligne, et se resserre d'elle-même quand on efface, puisqu'une case MathLive
épouse son contenu.
**Le plafond n'était pas la seule retenue, et c'est le contrôle qui l'a dit** :
au premier passage, le filet ne relâchait que `max-width`, et 19 écrans restaient
coupés — les cases décimales de la Seconde et de la Première ont une largeur
FIXE (`.f-dec{width:120px}`, `130px` dans les pourcentages : « 92 px montrés sur
173 »), et la case d'opération de la résolution du 6.1.5 est un élément flex
(`flex:0 1 7em`), que sa base retient quelle que soit sa largeur permise. Le
filet relâche donc les TROIS ensemble (`width:auto`, `flex-basis:auto`,
`max-width:100%`), et pose la largeur d'origine en `min-width` : la case
effacée retrouve sa taille, jamais moins. Il marque la case (`data-grandit`),
et ne la relâche qu'une fois. Le plafond ne tombe QUE sur une case qui déborde : le lever
partout par une règle `!important` aurait étiré à vide toutes les cases en
`flex:1` jusqu'au bout de leur rangée. Il agit à la frappe (`input`, en
capture) ET quand la page écrit elle-même : `value`, `setValue`, `insert`,
`executeCommand` sont enveloppés sur le prototype de `math-field` — une reprise
de pause, une correction écrite, une touche du pavé ne passent pas par
`input`, et MathLive ne l'émet pas sur un `value =` (mesuré).
Le contrôle vit dans la visite de la section 9 du banc navigateur : sur chaque
exercice, les quatre premières cases vides de l'écran reçoivent
« 123+456+789 » ; chaque case doit alors montrer tout son contenu, ou sa
ligne ne plus avoir de place où grandir. « Plus de place » se mesure en
remontant les ancêtres : à chaque étage, les enfants qui chevauchent la case en
hauteur laissent-ils de la largeur libre ? Si oui, la case pouvait grandir.
Sinon on monte d'un étage, jusqu'à un conteneur arrivé à son propre plafond —
la flèche du schéma des évolutions (`.pctb-arrow{max-width:260px}`, Seconde
4.5.4 à 4.5.6, Première 2.5.5) est un choix de dessin, pas une retenue de la
case. Le premier jet ne regardait que le parent direct, et accusait ces six
écrans là où la case avait déjà pris toute la flèche. Son second bord : le filet doit avoir eu à agir quelque
part — sans quoi la réponse longue ne dépasse aucun plafond, et le contrôle ne
mesure rien.

**Une fraction se lit empilée, ou elle ne se lit pas.** Le modèle et les rappels
de cours écrivent leurs mathématiques en LaTeX entre `\(` et `\)` — les fractions
sont EMPILÉES, comme dans le cahier, et non couchées derrière une barre oblique.
La Terminale et la Première le faisaient depuis longtemps ; la Seconde posait la
réponse du modèle en `textContent` et lui demandait d'ailleurs d'écrire « sans
LaTeX ». Un élève y lisait donc « 3/4 » au mieux, « \frac{3}{4} » en toutes
lettres au pire — encore une leçon apprise dans un coin qui n'avait pas gagné les
autres, comme le résidu MathLive.
**Ce sont DEUX moitiés, et n'en tenir qu'une ne tient rien.** La page doit SAVOIR
RENDRE — `conseilHTML()`, jamais `textContent` : posée en texte, la plus belle
formule arrive avec ses antislashs. Et elle doit DEMANDER — sans la clause
`ECRITURE_MATHS`, le modèle répond « 3/4 » et il n'y a rien à rendre. Demander
sans savoir rendre est le PIRE des trois états : ça affiche les antislashs,
c'est-à-dire exactement le défaut qu'on corrige. Un contrôle exige les deux.
Le moteur (huit fonctions, deux constantes — `latexRepare`, `fracAuto`,
`iaMathAuto`, `iaTabCell`, `iaTableau`, `iaCoupe`, `iaDollars`, `conseilHTML`) est
le MÊME TEXTE dans les trois fichiers, et un contrôle les compare au caractère
près : une moitié modifiée d'un seul côté ferait diverger le rendu d'un niveau
sans que rien ne rougisse. Il ne dépend que d'`esc()` et de `window.mlDexp`.
**Un rappel de cours, lui, ne passe PAS par `conseilHTML()`** : c'est du HTML
écrit à la main, et `esc()` afficherait ses `<b>` en toutes lettres. `rapMaths()`
ne remplace que les segments `\( … \)`, et le fait à L'AFFICHAGE : les rappels
sont des constantes évaluées au chargement, quand MathLive n'est pas encore prêt
— une fraction rendue là serait vide.
Deux contrôles, et ils ne voient pas la même chose. Le STATIQUE lit les rappels et
refuse une fraction écrite « a/b » ; il cherche chiffres ET lettres, parce que le
premier jet ne voyait que `1/2` et laissait passer `P/100`, `x/100`, `100/b`,
`u/v` — ça ne s'est vu que sur une capture d'écran. Le NAVIGATEUR ouvre chaque
rappel qui porte une formule et exige qu'elle soit dessinée : lui seul voit qu'on
a débranché `rapMaths()`, le statique n'y verrait rien.
**Un tableau de l'IA s'affiche en tableau, quelle que soit son écriture.**
Signalé DEUX FOIS par Turquet (août 2026) sur un iPad, dans « Question à
l'IA » comme dans la rédaction d'un exercice : l'élève lisait
`begin{array}{c|ccc} x & −3 & … hline g(x) & + & 0` en toutes lettres. Le
moteur savait pourtant convertir `\begin{array}` en `<table class="qia-arr">`
— et c'est ce qui a fait manquer la cible du premier coup : la sonde ne
mesurait que les écritures auxquelles je pensais, toutes rendues.
**Le modèle en emploie TROIS, et une seule suffit à casser l'affichage.**
La sonde refaite sur ce qu'un modèle produit VRAIMENT a nommé les trous :
· le tableau **MARKDOWN** (`| x | −3 | … |` et sa ligne `|---|`) n'était pas
  converti du tout — et c'est la forme la plus courante ;
· `\begin {array}` avec une **espace** avant l'accolade n'était pas reconnu —
  l'affichage y perd ses antislashs, la signature exacte de la capture ;
· `\begin{array}[t]{c|c}` laissait traîner « [t]c∣c » dans le tableau.
Et le `\end{…}` est **facultatif** des deux côtés : une réponse coupée en
plein vol par la limite de longueur du serveur s'arrête au milieu du tableau,
et on rend alors les lignes REÇUES en marquant la coupure par « … » — la
doctrine d'`iaCoupe`, étendue aux tableaux, sur l'array comme sur le
markdown. Un tableau à moitié lu reste lisible ; du LaTeX nu ne l'est jamais.
**Le bord OPPOSÉ compte autant, et il est étroit** : une phrase qui porte des
barres verticales (« |x| est la distance à zéro ») ne doit pas devenir un
tableau, et un tableau markdown écrit SANS ligne de séparation — le modèle en
produit — ne doit pas rester du code brut. Ce qui fait un tableau est donc :
une ligne de séparation (`|---|`), OU deux lignes au moins qui commencent ET
finissent par une barre. Le premier jet n'ouvrait que la première porte, et
son sabotage ne pouvait pas l'atteindre — les phrases témoins ne commençaient
pas par une barre, la regex les écartait de toute façon : c'est la leçon du
sabotage IMPOSSIBLE, retombée telle quelle, et le témoin a été refait en même
temps que la règle. Le moteur étant le MÊME TEXTE dans les trois
fichiers, la correction y est portée à l'identique (le contrôle des huit
fonctions le vérifie).
**Deux fois le contrôle s'est pris en défaut avant la page** : ses chaînes
traversent le template littéral de `verifier.js` PUIS l'évaluation dans la
page — `\begin` y devient un caractère de contrôle, et une apostrophe
échappée `\'` y perd son antislash et casse la chaîne. Un contrôle qui pose
du LaTeX n'écrit donc AUCUN antislash littéral (`String.fromCharCode(92)`),
et double ses apostrophes échappées. La largeur, elle, a été mesurée : sur un
écran d'iPad (768 px), le tableau rendu fait 315 px et ne déborde ni de sa
boîte ni de la page.

Un piège de banc s'y est montré, et il vaut pour tout le dépôt : **comparer deux
fonctions en comptant les accolades ne marche pas ici**. Ces fonctions sont
pleines d'expressions régulières où `{ }` abondent ; un compteur naïf avalait
11 000 lignes au lieu de 60, et le contrôle criait sur des fonctions parfaitement
identiques. `corpsFonctions()` existe pour ça — il saute les chaînes, les
commentaires et les regex.

**Il n'y a plus aucun bouton « Explique-moi plus simplement ».** Ni sous le
conseil, ni sous la fenêtre d'aide — ils parlent simplement d'eux-mêmes —, ni
sous le rappel de cours (décision de Turquet, août 2026). Ce dernier est un
arbitrage assumé, pas un oubli : le rappel n'est PAS une réponse du modèle,
c'est du HTML écrit à la main que le modèle n'a jamais vu, et il reste donc tel
que le professeur l'a écrit. Le rendre simple demanderait de réécrire les
soixante rappels des trois niveaux — ce qui se fera peut-être un jour, à la
main, sous ses yeux, plutôt que par un modèle dont personne ne relit la sortie.
Un contrôle refuse que le bouton revienne, sous quelque aide que ce soit : deux
chemins vers la même chose finiraient par se contredire le jour où l'un des deux
changerait.

**Un bouton d'une fenêtre DÉTACHÉE ne trouve pas sa fonction tout seul.** C'est le
piège d'à côté, et il a mordu le jour même. Une fenêtre détachée est un AUTRE
document : un attribut `onclick` posé dans la carte y cherche sa fonction sur le
`window` de la POPUP, qui n'en a aucune. Le bouton ne fait alors rien du tout —
pas d'erreur, pas de trace, juste un bouton mort chez l'élève qui a détaché sa
fenêtre. `garnirFenetre()` recopie donc une **liste de noms** sur la popup, et une
liste tenue à la main est exactement ce qui dérive : « expliquerSimplement » y
manquait. Un contrôle ouvre désormais les deux cartes, y déclenche tout ce qui
pose un bouton, relève CHAQUE `onclick` et exige qu'il soit dans la liste — en
dispensant ce que la fenêtre détachée masque elle-même (le bouton « Détacher »),
lu dans sa propre feuille de styles plutôt que recopié.

**MathLive** — la feuille de styles statique (`<style id="ml-static-css">`) est
indispensable au rendu des fractions hors des champs de saisie. Sans elle,
`\frac{25}{100}` s'affiche « 10025 », dénominateur d'abord, dans l'ordre du DOM.

**Un cadre prend la largeur de son plus large enfant — souvent son énoncé.** Le
cadre de pose inséré dans les deux exercices de multiplication de décimaux
(`.pt-outil`) encadre une opération de 144 à 190 px, mais son énoncé tenait sur
une seule ligne de 700 à 830 px : le cadre suivait, quatre fois plus large que
ce qu'il contient. Sa largeur est donc bornée (500 px), l'énoncé se replie sur
deux lignes et le cadre se resserre. Le seuil est MESURÉ, pas choisi : à 490 px
l'énoncé le plus long repassait à trois lignes, et le repli au mot est trop
sensible aux métriques de police pour se tenir pile sur la limite. Un contrôle
du banc navigateur mesure la largeur rendue à 1400 px de fenêtre — aucun banc
hors navigateur ne sait où un texte se replie.

**Le bouton des tables n'est proposé que là où il SERT** (demande de Turquet,
août 2026) : là où l'élève a un calcul mental à faire. Ailleurs c'est une porte
qui ne mène nulle part, posée au milieu des aides qui, elles, servent.
**La liste est écrite en NÉGATIF, et ce sens compte** : en positif, un exercice
ajouté demain arriverait SANS le bouton et personne ne le remarquerait — une
aide absente ne se signale pas. En négatif il l'a par défaut, et on le retire
quand on a constaté qu'il ne sert pas. Le mauvais côté de l'erreur est celui
d'une aide offerte pour rien, pas celui d'une aide manquante.
**Deux exercices ont été GARDÉS contre l'intuition**, après lecture de leur
générateur : les trois exercices sur les ensembles présentent des fractions
comme 24/4, et décider que c'est un entier EST un calcul de table ;
{appartient-intervalle-2} demande si √15 tombe entre 3 et 4, ce qui suppose de
savoir que 3² = 9 et 4² = 16. Les six qui n'en ont pas ne demandent aucune
multiplication : écrire une définition, choisir un crochet, lire une courbe,
comparer 1,07 et 1,1.
**Le contrôle compare DEUX sources** : ce que la page affiche réellement,
relevé sur la visite de TOUS les exercices, et une liste écrite dans
`tests/profils.js`. Lire la liste de la page et la comparer à elle-même n'aurait
rien prouvé. Un exercice ajouté demain est donc couvert sans rien déclarer.
Et il faut les DEUX contrôles d'existence, un par liste : un sabotage qui
ajoutait un identifiant périmé à la liste de la PAGE est resté vert, l'exercice
n'étant jamais visité — le banc navigateur ne pouvait rien en dire. C'est
`npm test` qui tient ce bord-là.

**La fenêtre des tables de multiplication a deux bords opposés.** Le bouton est
sur TOUS les écrans d'exercice — y compris le calcul mental et les tables, qui
n'ont pas d'élément `…Actions` : leur point d'accroche est `.answer-zone`, et
sans ce repli le bouton manquait au calcul mental sans que rien ne le dise.
Ailleurs la fenêtre doit RESTER ouverte à côté de l'exercice — c'est tout
l'intérêt d'une fenêtre flottante ; sur l'exercice des tables elle devient une
antisèche, donc elle se referme dès qu'on revient au calcul. Corriger un seul
des deux côtés ne corrige rien. Elle s'ouvre en haut à droite et non au centre :
au centre elle recouvrirait l'ardoise et le champ, c'est-à-dire l'endroit exact
où l'élève doit revenir pour la refermer.
Deux pièges de banc s'y sont montrés. **jsdom n'implémente pas `PointerEvent`** :
un essai écrit avec `new PointerEvent` ne lève rien et laisse croire que la
fermeture ne marche pas — on émet un `Event` ordinaire du bon type, et le vrai
geste se vérifie dans le banc navigateur. Et **`testScreens` est une constante
locale à `show()`** : un contrôle qui la lit depuis la page boucle sur une liste
vide et passe au vert sur un bouton disparu. On la lit dans le SOURCE, comme le
fait le contrôle de l'énoncé, en refusant de continuer si la liste est
invraisemblable.

**Un enchaînement d'égalités se lit d'un trait.** « a × b = c = d » coupé en
trois blocs empilés se lit comme trois calculs sans rapport, alors que c'est le
même, poursuivi. Deux choses le provoquaient en Seconde, et il fallait les deux
pour le corriger.
*La colonne était trop étroite.* La Première élargit l'écran d'un exercice à
toute la fenêtre (`body.plein-ecran .wrap{max-width:none}`, posé par `show()`
sur les seuls écrans d'exercice) ; la Seconde n'avait ni la règle ni la bascule.
L'accueil, le rattrapage et les devoirs gardent leur colonne : c'est du texte,
et une ligne de 1400 px ne se lit pas (décision de Turquet, août 2026).
**L'écran « Exercices par thème », lui, prend TOUTE la largeur** et ses cartes
gagnent des colonnes — 2 par défaut, 3 dès 1000 px, 4 dès 1400 px (demande de
Turquet, août 2026, qui REMPLACE pour cet écran-là « le menu garde sa
colonne ») : une liste de cartes n'est pas du texte. La bascule `menu-large`
vit dans `show()`, à côté de celle du plein écran, et le contrôle du banc
navigateur tient les DEUX bords — le cadre large ET le nombre de colonnes
réellement rendues, parce qu'un cadre large dont la grille reste à 2 colonnes
n'a rien gagné — plus le retour : revenir à l'accueil rend la colonne de
lecture. En Première, les trois écrans du menu (thèmes, parties, exercices)
sont larges ; la Terminale garde son menu à 1200 px, inchangé.
**« Exercices par thème » n'est pas UN écran, et mesurer le premier ne mesure
rien en Première** : elle ouvre d'abord DEUX cartes de thème, et deux cartes ne
peuvent pas dessiner quatre colonnes, quelle que soit la grille — le contrôle
rougissait sur une page parfaitement réglée. Les cartes d'EXERCICE, celles dont
parle la demande, vivent deux écrans plus bas. Le contrôle PARCOURT donc tout
l'arbre du menu en suivant les cartes de thème (`.themecard`) : chaque écran
doit être large, chaque écran qui liste au moins 4 exercices doit les poser sur
4 colonnes, et un écran plus court ne doit pas empiler (autant de colonnes que
de cartes). Éprouvé sur les écrans profonds : retirer `soustheme` de la
bascule, ou ramener la grille à 3 colonnes, rougit en nommant l'écran fautif.
**Et la page des thèmes vient AVANT les exercices, en Seconde aussi.** Demande
de Turquet (septembre 2026) : « en seconde il faudrait une page pour afficher
les thèmes des exercices dans des cases avant d'afficher les exercices comme
en première ». La Seconde posait ses quarante-six exercices sur un seul écran,
thème par thème, à faire défiler ; « Exercices par thème » ne montre plus que
QUATRE cartes — une par thème, avec le nombre d'exercices et le nombre déjà
travaillés — et le détail vit sur sa propre page (`scr-theme`), ouverte par
`openTheme()`. C'est le motif de la Première et de la Terminale, porté tel
quel.
**SANS l'étage des parties, et c'est un arbitrage nommé** : la Première découpe
ses thèmes chargés en sous-thèmes (3.1, 3.2…), aucun thème de la Seconde n'en
déclare, et une branche qui n'a jamais rien à rendre ferait croire qu'on tient
quelque chose — le garde-fou mort, une fois de plus. Le jour où un thème en
aura, elle se portera avec lui. Le thème des Fonctions en compte vingt-quatre :
sur quatre colonnes, six rangées, et le dire vaut mieux que de le taire.
**« Retour » revient sur la page D'OÙ L'ON VIENT** — celle du thème, ou celle
de la partie là où le niveau en déclare : `openTest()` retient le thème de
l'exercice (`currentThemeNum`), et `retourChoix()` le relit. Sans lui, l'élève
qui enchaîne deux exercices d'un même thème redescendrait d'un étage à chaque
fois.
**Le contrôle qui manquait est celui de la NAVIGATION, et il est UNIVERSEL** :
le banc navigateur parcourait déjà cet arbre — il a couvert la Seconde sans
rien déclarer — mais il mesure la LARGEUR et les COLONNES, et une liste plate a
elle aussi quatre colonnes : il serait resté vert sur le retour en arrière. Le
contrôle jsdom exige donc que l'écran des thèmes ne porte QUE des cartes de
thème, une par thème, chacune ouvrant sa page, et que la page d'un thème liste
SES exercices (ou ses parties). Il passe sur les trois fichiers, la règle y
valant partout. Neuf sabotages, chacun rougissant en nommant son défaut — sept
au banc jsdom (la liste plate revenue, la carte qui n'ouvre rien, l'exercice
oublié, la page d'un autre thème, l'écran qui ne s'ouvre pas, le titre muet,
`themeOfTest` qui se trompe) et deux que seul le NAVIGATEUR voit : le retour
qui redescend à la liste des thèmes, et l'écran du thème redevenu étroit —
jsdom restant vert à bon droit sur l'un comme sur l'autre.
Le piège documenté de l'antislash a mordu à la première exécution : `\(` écrit
dans une expression régulière du contrôle ne survit pas au template littéral de
`verifier.js` — « Invalid regular expression: /openTheme(/ », sur les trois
niveaux d'un coup. Le contrôle compare des CHAÎNES, jamais une regex.

**Puis l'étage des PARTIES est venu, et c'est le thème des Fonctions qui l'a
réclamé.** Demande de Turquet (septembre 2026) : « dans le thème fonctions en
seconde créer des sous-thèmes "images et antécédents" ; "équations et
inéquations" ; "tableaux de signes et de variations" ; "maximum, minimum et
encadrement" ; "exercices de synthèses" ». Le paragraphe ci-dessus racontait
l'arbitrage avec les mots de son époque — « aucun thème de la Seconde n'en
déclare », et « le jour où un thème en aura, elle se portera avec lui » : ce
jour est arrivé, et la branche s'est portée telle quelle. Le thème avait
vingt-cinq exercices sur une seule page à faire défiler.
**RIEN N'EST RECOPIÉ : c'est le motif de la Première, porté** — `sous` dans
`THEMES`, la liste PLATE reconstruite juste après (`t.ids`), la numérotation à
deux ou trois niveaux selon que le thème déclare des parties, `scr-soustheme`,
`openSousTheme()`, `retourTheme()`, `sousThemeOfTest()`, et `soustheme` ajouté à
la bascule `menu-large`. **Tout le reste du fichier ne connaît que `t.ids`** —
le tableau du professeur, les devoirs, la progression, « À retravailler »,
`TEST_ORDER` — et n'a pas à savoir qu'il existe des parties : c'est ce qui rend
le découpage court. La carte d'un exercice est sortie dans `carteExo()`, la
MÊME sur la page d'un thème et sur celle d'une partie : deux fabriques auraient
fini par diverger, et le même exercice se serait lu autrement d'une page à
l'autre.
**LE DÉCOUPAGE SUIT LE SUJET, JAMAIS LE MOTEUR**, et c'est ce qui départage les
cas limites : {equation-graphique} et {lecture-deux-courbes} posent la même
sorte de question sur deux courbes — le premier s'appelle « Équations
graphiques » et va aux équations, le second « Lecture de deux courbes » et va
aux images et antécédents ; {maximum-minimum-tableau} LIT un tableau de
variation mais son sujet est le maximum, donc il quitte la partie des tableaux ;
{construire-max-min} construit comme {construire-fonction} mais ses six
consignes sont des maximums, des minimums et un encadrement, donc il les rejoint.
L'élève lit le nom de la carte, pas le nom du générateur.
**L'ORDRE À L'INTÉRIEUR DE CHAQUE PARTIE EST CELUI QU'ILS AVAIENT** : la
progression pédagogique ne bouge pas d'une ligne, seul le découpage est neuf.
Les notes déjà obtenues ne bougent pas non plus — elles portent l'IDENTIFIANT,
jamais le numéro — et les renvois écrits `{identifiant}` suivent d'eux-mêmes.
**CE QUE LE DÉCOUPAGE COÛTE SE NOMME** : trois contrôles exigeaient une
ADJACENCE dans la liste plate, et deux d'entre elles traversaient une frontière
de sujet — {construire-fonction} ne suit plus {ecrire-solutions}, et
{tableau-equations} ne suit plus {maximum-minimum-tableau}. Les trois ont été
RETOURNÉS vers la partie plutôt que retirés : {ecrire-solutions} suit
{solutions-graphique} et FERME sa partie, {maximum-minimum} OUVRE la sienne avec
{maximum-minimum-tableau} derrière lui, {tableau-equations} garde
{tableau-vrai-faux} derrière lui. Un bord retiré ne dit plus rien ; un bord
retourné dit la règle du jour.
**Et le contrôle de la NAVIGATION a gagné l'étage qui manquait — il manquait
aussi à la Première.** Il exigeait qu'une page de thème ne mêle pas parties et
exercices ; il exige maintenant qu'un thème qui DÉCLARE des parties les MONTRE
(sans ce bord, un `openTheme` revenu à la liste plate rend exactement le bon
nombre de cartes et passe au vert en parlant d'autre chose), que CHAQUE partie
ouvre sa page, qu'elle y liste SES exercices et rien d'autre, que « Retour »
remonte à la page du thème, que `sousThemeOfTest` désigne la bonne partie et
que `retourChoix` sache la rouvrir. Universel, donc la Première est couverte
sans rien déclarer. Huit sabotages au banc jsdom, chacun rougissant en nommant
son défaut, et un que seul le NAVIGATEUR voit : `soustheme` retiré de
`menu-large` — il nomme les cinq parties une par une (« openSousTheme(2,1) :
wrap 780 px »), jsdom restant vert à bon droit.
**Et les numéros ÉCRITS du banc ont été repris — en identifiants, pas en
numéros.** Vingt-cinq messages et noms de contrôle citaient un exercice du thème
par son numéro (« le tableau du 2.1 », « le tirage du 2.15 ») et la moitié
mentait déjà, figée sur une numérotation d'un autre mois. Ils s'écrivent
`{identifiant}`, comme les contrôles voisins le faisaient déjà : un contrôle qui
s'affiche sous le nom d'un autre est pire qu'un contrôle sans nom, et un numéro
recopié ment tôt ou tard. Les COMMENTAIRES du banc, eux, gardent les numéros de
leur époque — ils racontent l'histoire, comme les paragraphes de ce fichier.

*Et les étapes étaient écrites en blocs séparés.* Le pourcentage passe de trois
`pt-step` à un seul ; augmenter et diminuer de cinq à deux — le coefficient est
une AUTRE égalité, elle garde son bloc — plus la pose facultative, renvoyée à la
fin : elle coupait la chaîne en son milieu, entre le « × valeur » et son
résultat. Les libellés fusionnent avec le point médian de la Première :
« ② coefficient × valeur de départ · ③ multiplier les fractions · ④ le résultat ».

**UN « = » NE SE SÉPARE JAMAIS DE LA CASE QU'IL ANNONCE.** Demande de Turquet
(septembre 2026, Première), en deux temps. D'abord : « quand on affiche "= 0 ,"
avec une case à côté, si la case passe à la ligne je veux que le "= 0" passe
aussi à la ligne. » Puis, le même jour : « en fait dès qu'une case passe à la
ligne et qu'il y a un "=" devant, mettre le "=" aussi à la ligne. » La règle
vaut donc pour TOUT « = » posé devant une case, avec ou sans tête.
La rangée est un flex qui SE REPLIE — c'est ce qui l'empêche de déborder de
l'écran —, et le repli tombait ENTRE le signe et la case où l'élève répond :
mesuré à 600 px de fenêtre sur le 2.3.1, « 0, » restait en fin de ligne et sa
case tombait 111 px plus bas. Une virgule décimale coupée de ses décimales n'est
plus un nombre, et une égalité coupée en deux se lit comme deux calculs.
**LA SONDE A FAIT LA CARTE AVANT QU'ON NE TOUCHE À QUOI QUE CE SOIT**, et elle a
renversé l'ordre des priorités : sur les six largeurs et les trente exercices du
niveau, le premier à céder n'est pas un écran de pourcentages mais
{somme-fractions}, dès **820 px** — un iPad en portrait. Suivent les QCM et les
évolutions à 768 et 600, puis tout le reste à 390. Sans cette mesure, on aurait
groupé les rangées qu'on avait sous les yeux et manqué celle qui casse en
premier.
**UN SEUL ENDROIT ASSEMBLE LE GROUPE** (`fEqTete`, dont `fEq` est la forme sans
tête) : les trente-neuf groupes des dix-sept écrans y passent, et la rangée
qu'on écrira demain y passera sans rien avoir à déclarer. Le groupe est un flex
à lui (`.f-grp`), du MÊME écart que la rangée — un groupe plus serré ou plus
large se verrait tout de suite —, si bien que rien ne bouge tant que la ligne
tient et que tout passe à la ligne ensemble quand elle ne tient plus. La tête est
ce qui finit par la virgule : « 0, », « 1, », « 1 − 0, » ; le « = » vient avec
elle, parce qu'une chaîne qui se replie met son signe en tête de la nouvelle
ligne, jamais en fin de l'ancienne.
**Il n'y avait pas de solution en CSS seul** : dans un conteneur en flex, rien
ne défend à un repli de tomber entre deux éléments — `break-inside` ne parle
qu'à la pagination. C'est la STRUCTURE qui devait changer, et c'est pourquoi le
groupe est écrit au rendu plutôt qu'ajouté après coup : déplacer un
`<math-field>` déjà monté le débranche et le remonte, et MathLive n'en sort pas
toujours avec sa valeur.
**LA SECONDE A ÉTÉ TOUCHÉE, ET C'EST LE MOTEUR QUI L'EXIGE** : {somme-fractions}
tourne sur `renderSFTest`, le même TEXTE dans les deux fichiers, comparé au
caractère près. Le corriger pour la Première et pas pour la Seconde l'aurait
fait diverger — le contrôle des quatorze fonctions rougit au premier caractère
d'écart. La Seconde reçoit donc la fabrique, la règle `.f-grp` et la chaîne
groupée, et rien d'autre : ses rangées propres (2.2.1, 2.3.1…) restent à
grouper, le contrôle s'y affiche « non applicable », et c'est une décision à
prendre — pas un oubli.
**Un voisin a failli céder en silence** : `#sfHost .pt-row>.f-frac` vise l'enfant
DIRECT de la rangée, et le calcul écrit en tête d'une chaîne vit désormais un
cran plus bas, sous le groupe. Sans le sélecteur élargi, la fraction du maillon
« 3 = 3/1 » serait repassée à 1,45 rem devant des cases à 2 rem — le défaut
d'août 2026, au même endroit. Le contrôle du navigateur qui le tient regardait
lui aussi les seuls enfants directs : il descend maintenant d'un cran, sans quoi
il aurait mesuré moitié moins en restant vert.
**Deux bancs, la répartition habituelle.** jsdom tient ce que le texte dit : plus
AUCUN « = » écrit à la main devant une case dans la source — ni avec tête ni
sans —, la classe posée par la fabrique, la tête restée FACULTATIVE (sans quoi
le « = » nu n'aurait aucun chemin vers le groupe), la classe qui est bien un
flex (posée sans sa règle, elle ne tient rien ensemble et rien ne rougirait), le
même écart que la rangée, et le rendu qui pose vraiment ses groupes — un
contrôle qui n'a rien à mesurer ne mesure rien. Le NAVIGATEUR mesure ce que
jsdom ne peut pas, et il part des « = » ET NON DES GROUPES : un contrôle qui ne
regarderait que `.f-grp` resterait vert sur le « = » qu'on aurait oublié d'y
mettre, c'est-à-dire exactement sur le défaut. Chaque « = » visible suivi d'une
case doit partager sa ligne, jugé au RECOUVREMENT vertical et jamais à l'égalité
des « top » (une case et le texte qui la précède sont centrés l'un sur l'autre,
donc leurs hauts diffèrent toujours de quelques pixels — un compteur qui lirait
« top » crierait au repli sur des lignes parfaitement droites), à une largeur où
la rangée SE REPLIE pour de vrai, ce qu'il exige aussi.
**PUIS LA SECONDE A SUIVI, SUR SES PROPRES RANGÉES.** Demande de Turquet
(septembre 2026) : « fais la même chose en seconde ». La sonde a refait la carte
avant qu'on ne touche à quoi que ce soit, et elle a nommé QUATRE écrans :
{augmenter-pourcentage} et {diminuer-pourcentage} à 600 px, {diviser-fractions}
à 600, {simplifier-barres} à 390. {somme-fractions} n'y était plus — son moteur
partagé avait déjà reçu le groupe la veille, et c'est la preuve que le partage a
fonctionné dans les deux sens.
**LA RÈGLE S'EST SIMPLIFIÉE EN S'ÉLARGISSANT, et c'est le contrôle qui l'a
demandé** : reconnaître « un "=" devant une CASE » obligeait à énumérer les
fabriques locales qui rendent une case (frac, dec, mf, produit, quotient…) —
une liste, donc une dérive. Elle est devenue « TOUT "=" passe par la fabrique »,
parce qu'un « = » groupé avec ce qui le suit n'est jamais pire, et qu'une règle
sans liste ne peut pas oublier la rangée qu'on écrira demain. Il n'en reste
qu'UN seul écrit à la main dans chaque fichier : celui de la fabrique.
**ET L'ÉCART EST HÉRITÉ, PLUS RECOPIÉ** (`gap:inherit`). Les rangées de ces
fichiers n'ont pas toutes le même : 12 px pour `.pt-row`, 14 pour `.f-wrap` —
la fraction décimale du 1.6 —, 10 pour la conclusion de {simplifier-barres}. Un
12 figé écartait donc le groupe autrement que ce qui l'entoure sur deux d'entre
elles, visible à l'œil et invisible au code ; hérité, il ne peut plus diverger.
Le contrôle accepte `inherit` d'emblée et ne compare des pixels que s'ils sont
écrits — un écart figé ne protège que la rangée de référence, et il le dit.
**Un piège d'ancre s'y est montré, le même qu'ailleurs** : la conclusion de
{simplifier-barres} porte une espace INSÉCABLE que mon ancre écrivait en espace
ordinaire — le remplacement ne trouvait rien, et l'assertion l'a dit au lieu de
laisser passer un fichier à moitié transformé. La leçon du 6.10, retombée telle
quelle : un remplacement se pose sur les octets, pas sur ce qu'on croit lire.

**ET UN DÉFAUT EST PARTI EN LIGNE AVEC CE CORRECTIF — du CODE affiché à
l'élève.** La transformation qui a posé les groupes supposait que chaque rangée
était écrite dans un GABARIT (`` ` ``), et une seule ne l'était pas : le premier
niveau du 1.6 assemble sa ligne à guillemets SIMPLES. Le `${fEq(…)}` inséré là
n'est pas interpolé — il s'affiche en toutes lettres, et l'élève lisait
« ${fEq(` » autour de sa case pendant une mise en ligne entière.
**Aucun banc ne pouvait le voir, et c'est ce qui compte** : la case existait
quand même (l'`innerHTML` avait bien construit le `<math-field>` qui vivait
DANS le texte littéral), donc le rendu, la correction et la note étaient
justes ; seul le TEXTE autour était du code. Le contrôle voisin des accolades
ne vise que les `{identifiant}` CONNUS, et le banc jsdom ne lit pas ce qui
s'affiche. Un contrôle universel le tient désormais, greffé sur la visite qui
ouvre tous les exercices dans les deux modes : **aucun gabarit « ${…} » non
interprété ne reste affiché à l'élève** — l'exercice qu'on écrira demain est
couvert sans rien déclarer. La leçon est celle de la règle 3, une fois de
plus : une transformation mécanique se relit sur ce qu'elle PRODUIT, pas sur
ce qu'elle suppose de son entrée.

**Et le contrôle s'est pris en défaut deux fois avant la page.** Il lisait le
PREMIER `.f-whole` du groupe comme sa tête — or la case d'une somme de fractions
en contient elle-même, le numérateur écrit devant son multiplicateur, et il
accusait « la tête "1" ne finit pas par la virgule » sur une page juste : la tête
est l'enfant DIRECT du groupe, jamais le premier venu. Et une APOSTROPHE écrite
dans son message traversait deux analyseurs — le gabarit de `verifier.js` puis
l'évaluation dans la page — et refermait la chaîne : « missing ) after argument
list », le piège documenté de l'antislash sous un autre habit.

**Une somme de fractions s'écrit en une seule ligne, et l'entier est un maillon.**
{somme-fractions} passe de trois blocs à la chaîne du cahier :
`5/3 + 1/2 = (5×□)/(3×□) + (1×□)/(2×□) = (□ + □)/□ = □/□`. Quand un terme est un
ENTIER, le passage par le dénominateur 1 devient un maillon de la chaîne —
`3 + 1/2 = 3/1 + 1/2 = …` — et non une égalité posée à côté : écrire « 3 = 3/1 »
au milieu d'une somme dirait que 3 vaut la somme entière. Quand aucun des deux
termes n'est entier, ce maillon ne dirait rien de plus et disparaît.
Le moteur étant partagé avec la Première, les deux niveaux gagnent la même ligne
— et restent identiques au caractère près.
**Le piège d'à côté a mordu tout de suite** : sur une seule ligne, ce qui suit
une case n'est plus du vide mais le « + » ou le « = » suivant, et les
corrections en bleu se sont mises à les recouvrir. La place se réserve donc au
niveau du GROUPE (`.sf-prod`, `.sf-somme`), pas de la case : posée sur la case,
la marge élargirait le trait de fraction au lieu d'écarter le voisin.

**Et le CADRE lui-même prenait la colonne, pas l'écran.** Signalé par Turquet
(septembre 2026) : « en Seconde le cadre des exercices doit utiliser la largeur
maximale sur l'écran comme en Première ». L'écran était bien passé en pleine
largeur — `body.plein-ecran .wrap{max-width:none}` — mais la CARTE qui vit
dedans restait bridée à 600 px par `.lv-card` sur les quinze exercices à
dessin, quand la fenêtre en offrait 1360. Mesuré dans un vrai navigateur :
Première 0 cadre bridé sur 31 exercices, Terminale 0 sur 38, Seconde 15 sur 43.
**CE PLAFOND AVAIT DÉJÀ COÛTÉ TROIS CORRECTIFS, chacun sur une capture** — le
tableau à quatre segments du 2.15 caché derrière son défilement, l'union à huit
cases du 2.18, la rangée corrigée du 2.19 — et les élargissements successifs
(700, 920, 1300 px) ne faisaient que remonter vers la largeur que la fenêtre
offrait déjà. Les retirer tous les couvre a fortiori. Le dessin, lui, garde sa
propre largeur et reste centré : c'est le CADRE qui s'élargit, pas la courbe.
**Le contrôle d'à côté ne pouvait pas le voir** : il mesure le `.wrap`, qui
était large, et restait donc vert sur un cadre étroit — le défaut vivait
exactement dans l'angle mort. Un contrôle UNIVERSEL le tient désormais, greffé
sur la visite qui ouvre tous les exercices (« 9 ») : il mesure le CADRE contre
la largeur DISPONIBLE du conteneur — rembourrage déduit — et un exercice ajouté
demain est couvert sans rien déclarer.
**Mais il ne vaut PAS pour la Terminale, et le premier jet l'a appris en
l'accusant** : elle donne à ses cartes une largeur propre par une variable
unique (`--card-max`, paliers 560 / 780 / 1040 / 1200 px), avec une gouttière
voulue que son fichier écrit en toutes lettres et interdit de redéclarer. Le
contrôle, posé universel, a donc rougi sur ses trente-six exercices — sur un
DESSIN, pas sur un défaut. Il se DÉCLARE désormais (`cadrePleineLargeur` dans
`tests/profils.js`, Seconde et Première), et la Terminale l'affiche « non
applicable » plutôt que de le taire : un contrôle qui ne s'applique pas se
déclare, il ne se retire pas. Et sa mesure a changé du même coup — comparer à
la boîte EXTÉRIEURE du conteneur comptait son rembourrage comme un bridage.

**Le contrôle tient les deux bords, et n'en tenir qu'un ne tient rien** : la
carte doit être LARGE, et les rangées ne doivent PAS se replier. Une carte large
dont les rangées se replient quand même n'a rien gagné ; des rangées qui ne se
replient pas dans une carte étroite, c'est qu'elles étaient déjà courtes. Il
compte aussi les blocs empilés — c'est là que se voit la fusion — et vérifie que
le menu, lui, garde sa colonne. Il vit dans le banc navigateur : seul un vrai
navigateur sait où un contenu se replie.
Un piège de mesure s'y est montré : une rangée n'a pas replié parce que ses
enfants ont des « top » différents — une fraction et un « = » sont centrés l'un
sur l'autre, donc leurs hauts diffèrent toujours, et le premier compteur criait
au repli sur des lignes parfaitement droites. On compare la HAUTEUR de la rangée
à celle de son plus haut enfant.
**Et un sabotage IMPOSSIBLE n'est pas un contrôle mort.** Élargir les cases pour
faire déborder la rangée ne produit rien : `math-field` est plafonné à 150 px
(`math-field.pm-mf{max-width:150px}`), donc la rangée ne peut pas grossir par
là — le vert était juste, et c'est le sabotage qui ne disait rien. Le repli
s'éprouve en rétrécissant la FENÊTRE : à 760 px le banc signale « 1 rangée
repliée sur 1 ». Avant de conclure qu'un contrôle ne mesure rien, il faut
vérifier que le sabotage pouvait seulement l'atteindre.

**La fenêtre « Soutien » se saisit n'importe où.** Elle ne se déplaçait que par
sa barre de titre, un ruban d'une trentaine de pixels qu'il fallait viser
(décision de Turquet, août 2026). Sa poignée est donc la CARTE ENTIÈRE — et
c'est là que le piège se referme : **une carte qui prend tous les clics avale
ceux de ses propres boutons**, qui deviennent muets sans lever la moindre
erreur. La liste `GESTE_PROPRE` rend son geste à tout ce qui se clique, se tape
ou se choisit, et elle ne se limite pas à `<button>` : un lien dans un rappel de
cours, un champ, une liste suffiraient à rouvrir le trou.
Le glisser coupe la sélection du texte (`user-select`), et c'est posé dans
`rendreDeplacable()` plutôt que dans la feuille de styles, parce que la poignée
n'est plus toujours l'en-tête : saisir la fenêtre et sélectionner son texte sont
le même geste, et le navigateur ferait les deux à la fois. Le texte du conseil
n'est donc plus sélectionnable — prix assumé.
La Première et la Terminale DÉTACHENT le soutien dans une vraie fenêtre du
système dès que le pointeur est fin ; c'est alors le gestionnaire de fenêtres
qui la déplace, et la carte de la page n'existe plus. Le changement ne se voit
donc que là où le détachement n'est pas possible — et en Seconde, qui ne détache
pas le soutien.
**Le contrôle tient les deux bords ensemble, et n'en tenir qu'un ne tient
rien** : la fenêtre doit SUIVRE la souris saisie en plein texte, et ses boutons
doivent GARDER leur geste. Il vit dans le banc navigateur — jsdom n'a ni
PointerEvent ni mise en page, donc aucune position à mesurer.
Il s'est pris lui-même en défaut sur le bord le plus important. Il mesurait la
position APRÈS avoir relâché le bouton de la souris : or la carte suit le
curseur, donc le bouton reste dessous, le clic part quand même, « Fermer »
referme la fenêtre — et une fenêtre fermée n'a plus de rectangle. Le contrôle
se satisfaisait de ce « elle a bien agi » alors qu'elle venait d'être traînée de
quatre cents pixels. Il mesure maintenant POINTEUR ENCORE ENFONCÉ.

**Fenêtres d'aide détachées** — sur ordinateur, les fenêtres « Soutien » et
« Question à l'IA » s'ouvrent dans une fenêtre indépendante et leur carte y est
déplacée. `document.getElementById` ne les trouve plus : la fonction `$` doit
chercher aussi dans `window.__fenetresDetachees`.

**Une fenêtre d'aide FERMÉE doit se rouvrir — et « est-elle fermée ? » n'a pas
de réponse au moment où on la pose.** Signalé par Turquet (septembre 2026) sur
le 6.14 : « quand je clique sur soutien et que je ferme la fenêtre, impossible
de la rouvrir, même chose pour question à l'IA. Peut-être que ce problème se
retrouve ailleurs. » Il s'y retrouvait, et la sonde l'a MESURÉ avant qu'on ne
touche à quoi que ce soit : les CINQ fenêtres détachables des TROIS niveaux — la
Question à l'IA partout, le Soutien en Première et en Terminale — perdaient leur
carte, sur n'importe quel exercice et pas seulement le 6.14.
**LA CARTE EST DÉPLACÉE, elle n'est pas recopiée** : détacher, c'est
`adoptNode` — la page n'a plus sa carte, la fenêtre l'a. Fermée sans la rendre,
elle l'emporte ; `ouvrirSoutien` ne trouve alors plus rien à détacher et
l'écran montre une fenêtre VIDE, sans la moindre erreur nulle part.
**LA CAUSE EST UN MOMENT.** Au `pagehide`, la page demandait « la fenêtre
est-elle fermée ? » un tick plus tard, et ne rapatriait la carte que si la
réponse était oui. Or `window.closed` ne bascule qu'une fois le contexte
détruit : mesuré ENCORE à false un tick après la croix du système, et déjà à
true après un `close()` programmé — le bouton ✕ de la carte marchait donc, par
chance, et la croix perdait la carte. **On ne suppose plus rien du MOMENT** : la
carte revient dans la page SYNCHRONIQUEMENT, dans le `pagehide` lui-même, où
tout est encore atteignable. Et le remplacement de document (vieux Firefox) se
reconnaît à un document DIFFÉRENT, jamais à « closed », qui ment ici dans les
deux sens.
**LE SECOND BORD EST UN FILET, et il tient quelle que soit la cause** : la carte
est PRÊTÉE à la fenêtre, donc sa référence vit AUSSI sur le conteneur, qui est
dans la page et ne ferme jamais. `ramenerCarte()` la ramène AVANT d'ouvrir —
ramener une carte d'un document déjà DÉTRUIT fonctionne, mesuré en Chromium — si
bien qu'un navigateur qui ne lèverait pas `pagehide`, ou une fenêtre que le
système emporte, ne cassent plus rien. Le bord OPPOSÉ compte autant : on ne
reprend JAMAIS la carte d'une fenêtre VIVANTE, ce serait la lui prendre sous les
yeux de l'élève. Et `fermerQIA`/`fermerConseil` la REPRENNENT avant de fermer,
comme `reattacherFenetres` le faisait déjà : le rapatriement du `pagehide` est un
filet, pas un plan.
**Le moteur est le MÊME TEXTE dans les trois fichiers, et rien ne le
comparait** — il a fallu le corriger dans les trois d'un coup. Six fonctions
sont comparées au caractère près désormais ; `garnirFenetre` DIVERGE
volontairement, elle porte les ponts onclick propres à chaque niveau, et c'est
nommé plutôt que tu.
**Deux bancs, la répartition habituelle.** jsdom rejoue le MOMENT — `pagehide`
avec `closed` encore FAUX, le filet d'une fenêtre partie sans rien lever, le
bord opposé de la fenêtre vivante, et le ✕ qui rend la carte. Le NAVIGATEUR
rejoue le GESTE (« 6 octies bis », déclaré par `fenetresDetachees` dans
`tests/profils.js`, deux sources) : une VRAIE fenêtre du système, une vraie
croix, sur l'exercice SIGNALÉ en Terminale — et il faut un VRAI clic, sans
activation utilisateur Chromium bloque la pop-up et le contrôle mesurerait le
repli en page.
**Et ce contrôle-là s'est pris en défaut avant la page** : son locator prenait
le PREMIER bouton du document dont l'onclick appelle `conseilCourant` — c'est
`#cmConseilBtn`, celui du calcul mental, CACHÉ —, le clic expirait sur un
élément que personne ne voit, et la mesure accusait la page de n'ouvrir aucune
fenêtre. Une ancre se prend PROPRE à sa cible, sur l'écran VISIBLE ; et le
bouton est CENTRÉ avant le clic, les commandes du bas étant en position fixe.
**Sept sabotages, chacun rougissant en nommant son défaut** — six au banc jsdom
(le rapatriement remis dans un setTimeout, la référence perdue sur le conteneur,
la carte reprise à une fenêtre vivante, le filet retiré de l'ouverture, le ✕ qui
ne rend plus la carte, le moteur qui diverge d'un niveau à l'autre) et un au
NAVIGATEUR, le défaut d'origine remis. **Ce dernier a montré que les deux
moitiés se répondent** : c'est « fermée, la carte revient dans la page » qui
rougit, et non « on la rouvre » — le FILET la ramène à l'ouverture même quand le
rapatriement a échoué, et c'est exactement ce pour quoi il existe. Et deux
sabotages ont d'abord fait LEVER le contrôle jsdom au lieu de nommer quoi que ce
soit : privé de sa carte, `ouvrirQIA` va chercher `#qiaSugg`, qui vit DEDANS, et
meurt sur un null. Un contrôle qui lève ne nomme rien : il attrape, et il dit ce
qui manque.

**Le code de l'élève se tape masqué — par la feuille de styles, pas par
`type="password"` (audit d'octobre 2026, T10).** `#loginPin` s'affichait en
clair : en classe, le code se lisait sur l'écran du voisin. Le passer en
`password` aurait rouvert le piège « Sans balise `<form>` » par l'autre bout :
le formulaire de l'élève n'a aucun identifiant (le prénom est un bouton),
Chrome serait allé en chercher un et aurait proposé d'ENREGISTRER le code
d'un élève sur un poste partagé — et de le préremplir pour le suivant. Il est
donc masqué par `-webkit-text-security:disc` (Chrome, Edge, Safari ; un
navigateur qui l'ignore l'affiche en clair, comme avant) et reste un champ
texte `inputmode="numeric"` : le pavé numérique s'y attache toujours, le banc
navigateur s'y connecte toujours (`page.fill`). Tenu par deux bords dans
`tests/verifier.js` (masqué, et pas en password) et, au navigateur, par le
style calculé (`webkitTextSecurity` = `disc`, type `text`).

**Le décor d'Halloween, en Seconde seulement (demande de Turquet, octobre
2026, v456).** Ciel de nuit, guirlande de citrouilles, chauves-souris, toile
d'araignée dans le coin des cadres, boutons d'action orange. Il s'allume TOUT
SEUL du 15 octobre au 2 novembre (script `#decor-halloween`, juste avant
`#italiquer-x`) : hors de ces dates le script rend la main sans rien poser, et
il n'y a rien à retirer après la fête. Le bouton 🎃 de l'en-tête l'éteint ; le
choix est retenu (`localStorage`, clé `decor-halloween`, enveloppé). Trois
limites, tenues EXPRÈS :
* **aucune encre de verdict ne bouge** — `--blue`, `--red`, `--green` restent :
  le décor colore le fond, l'en-tête, les cadres et `.btn-primary`, jamais
  `.ok`, `.bad`, `.sol` ;
* **aucun positionnement ne bouge** — la toile et le fantôme des cartes sont des
  IMAGES DE FOND, le ciel est sous la page (`z-index:-1`). Le premier aperçu
  posait `position:relative` sur `.card` et un `z-index` sur `.wrap` : le
  premier aurait rattaché à la carte tout ce qui s'y accroche en absolu, le
  second aurait enfermé les commandes flottantes dans un contexte d'empilement ;
* **ce qui s'écrit HORS des cadres** passe en clair sur la nuit : le titre de
  l'exercice (`.exo-name`), son numéro, « Question n / N » (`.q-idx`), le
  numéro de version (`#appVer`, couleur en ligne, d'où le `!important`). Le
  premier aperçu les laissait sombres sur sombre : le titre était illisible.
Les animations disparaissent sous `prefers-reduced-motion`, et le décor à
l'impression. Le banc navigateur a été rejoué deux fois : à la date du jour
(décor absent) et sur une copie où la saison était forcée (décor posé).
**Et le banc navigateur, saison forcée, a trouvé ce que l'aperçu ne montrait
pas** : sur un téléphone de 320 px, le bouton 🎃 et la citrouille du titre
poussaient l'en-tête hors de l'écran — la page débordait de 47 px, et c'est le
contrôle de la liste des élèves (« les trois boutons d'un élève restent
atteignables ») qui l'a dit. L'en-tête qui porte le bouton passe désormais à la
ligne (`.mast:has(> .hw-bascule){flex-wrap:wrap}`, le bloc du titre en
`flex:1 1 180px`), et sous 480 px le titre rend sa citrouille. La leçon vaut
pour tout décor SAISONNIER : la CI le joue hors saison, donc décor ABSENT — un
banc à la date du jour ne le voit jamais ; c'est la copie à saison forcée qui
le mesure.

**Puis les SERPENTS D'HALLOWEEN sont venus sur le sous-thème « Input » (6.3)**
(demande de Turquet, octobre 2026, v479 — v472 à l'écriture, sept numéros pris
sur `main` entre-temps : « mettre dans les algo de seconde,
pour le sous-thème input, des serpents comme ceux des exercices d'algo, en
rapport avec Halloween ; ils peuvent faire peur »). Les serpents des fiches
sont les dessins de Turquet, en WebP ; ceux-ci sont DESSINÉS EN SVG par la
page (`hwSerpentSVG`, après `pyAvant`) : un même corps — une courbe tracée
trois fois, contour, vert, ventre, les taches posées dessus, la tête au
bout, le regard vers la bulle — et neuf déguisements, un par exercice,
rangés dans `HW_SERPENTS` avec la bulle et le texte de remplacement :
le sorcier (6.3.1, « Ton prénom… pour mon grimoire ! »), le vampire (6.3.2,
cape, crocs, yeux rouges qui battent), le fantôme (6.3.3, « Quel âge as-tu ?
Moi : 666 ans. BOUH ! »), la citrouille sculptée (6.3.4), la momie (6.3.5,
les bandelettes sont un trait en tirets par-dessus le corps — un seul
attribut `stroke-dasharray`), le squelette (6.3.6, côtes et crâne par le même
procédé), le zombie (6.3.7, l'œil qui pend, « La moyenne de mes deux
cerveaux ? »), l'araignée qui descend sur un serpent terrifié (6.3.8,
« L'araignée veut l'aire de sa toile ! ») et le diable à la fourche (6.3.9,
« Pommes et tomates… à prix d'enfer ! »). Chaque bulle parle de SON
exercice — c'est ce que font les bulles des fiches — et aucune n'écrit un
« x » isolé, que le filet `italiquerX` aurait penché jusque dans le SVG.
Trois décisions tiennent le reste :
* **à côté du dessin de la fiche, jamais à sa place** : `hwSerpentHTML(id)`
  s'ajoute DANS le cadre qui porte le dessin (`.pyi-fig`, `.pii-fig`,
  `.pia-fig`, `.pis-fig`, `.pmy-fig`, `.prc-fig`, `.pkg-fig`, `#pynFig`), à
  la même condition que lui (au premier écran seulement là où la fiche n'y
  est qu'au premier écran). Les contrôles de chaque fiche ne bougent pas ;
  le cadre passe à la ligne sous `body.halloween` (`flex-wrap`) quand les
  deux ne tiennent pas côte à côte — un téléphone de 360 px ;
* **le serpent suit le DÉCOR, pas la date** : le `<figure class="hw-serpent">`
  est toujours dans la page, et c'est la feuille de styles qui le cache
  (`display:none`) ou le montre (`body.halloween … display:flex`). Le bouton
  🎃 l'éteint donc avec le reste, sans redessiner l'écran, et hors saison il
  n'y a rien à retirer. Un `role="img"` et un `aria-label` sur la figure, le
  SVG en `aria-hidden` : un lecteur d'écran lit une phrase, pas neuf
  chemins ;
* **un exercice qui entre au 6.3 doit gagner son serpent** : le banc jsdom
  (`serpentsHalloween`, `tests/verifier.js`) lit le sous-thème dans
  `THEMES` — déclaré par `serpentsHalloween: { theme, sous }` dans
  `tests/profils.js` —, exige une entrée par identifiant, des déguisements
  tous différents, la bulle et l'alt ; puis OUVRE chaque exercice et relit
  l'écran : un serpent et un seul, à côté du dessin de la fiche, avant la
  zone de travail, en `display:none` sans la classe et `flex` avec.
Et le banc navigateur (« 9 quater ») force le décor — la CI joue hors
saison, leçon du paragraphe précédent — et MESURE, sur chaque exercice du
sous-thème : le serpent rendu à côté d'un dessin de fiche qui garde sa
largeur, le texte de la bulle dans son cadre (`getBBox` du texte contre
celui de la bulle — la première épreuve du prototype débordait, « Moi : 666
ans. BOUH ! » sortait du cadre, et c'est l'image qui l'a montré, pas le
code), rien qui sorte de la carte, et une page qui n'est pas plus LARGE
avec le décor que sans — à 1280 px puis à 360 px ; et, décor éteint, un
serpent de 0 × 0 px. Deux leçons de la première exécution : la bulle se
cherche par sa CLASSE (`.hw-bulle`, `.hw-bulle-texte`), parce que les
étoiles du sorcier sont aussi des `<text>` et les crocs du vampire un
`<path fill="#fff">` — le contrôle les prenait pour une bulle qui déborde ;
et la largeur de la page se compare AVEC et SANS décor, pas à l'écran, parce
que le 6.3.7 déborde déjà de 35 px à 360 px, décor éteint — un `<code>` de
son énoncé (« "la moyenne est de :" ») que rien ne fait plier —, défaut
d'avant les serpents, vu en les mesurant, nommé ici et pas corrigé dans ce
chantier. **Et la CI a trouvé ce que le banc local ne voyait pas** : Nunito
n'est servie à aucun banc, et le repli n'est pas le même — Inter ici, DejaVu
Sans (plus large) sur le serveur de GitHub —, si bien que trois bulles de
vingt caractères passaient en local et débordaient là-bas (« Moi : 666 ans.
BOUH ! », « sans les bandelettes. », « Pommes et tomates… »). Trois réponses,
qu'il faut toutes : les bulles s'écrivent en lignes COURTES (jusqu'à trois
lignes de 17 caractères au plus, tenu par le banc jsdom), dans un cadre plus
large et une police de 11 ; et le banc navigateur mesure le texte dans
DejaVu Sans — la plus large des polices de repli connues, installée des deux
côtés — avant de le comparer au cadre, pour voir ici ce que la CI verra.

**Puis le décor s'est allumé, et la CI a rougi à minuit.** Le 15 octobre à
00 h 10 (UTC, l'heure du serveur de GitHub), une pull request qui ne touchait
pas aux serpents a échoué sur « les textes des graphiques s'écrivent à 12 px
au moins » : `hw-bulle-texte 11 px`, sur les neuf exercices du 6.3, dans les
deux modes. `main` était vert la veille au soir. Rien n'avait changé dans le
code — c'est la DATE qui avait changé : hors saison, `.hw-serpent` est en
`display:none`, et ce contrôle commun (section 9) ne mesure que ce qui se
voit ; le premier jour du décor, les bulles se sont montrées à lui pour la
première fois. La police de 11 du paragraphe précédent violait donc une règle
universelle depuis le premier jour, sans qu'aucun banc ne puisse le voir avant
la saison — et l'élève, lui, la lisait en 11 dès ce matin. Deux réponses :
* **les bulles passent à 12 px** (interligne de 15) : mesurée dans DejaVu
  Sans gras, la ligne la plus large (« Pommes, tomates… ») fait 133,7 px pour
  142 utiles — et l'image le confirme, à une ligne comme à trois ;
* **le « 9 quater », qui force le décor, mesure aussi la taille des bulles**
  (12 px au moins) : la règle tient toute l'année, et un banc joué hors
  saison voit ce que la CI de la saison verra. Éprouvé par sabotage HORS
  saison (bulles remises à 11 px, et le décor éteint par la date) : le
  contrôle commun des 12 px reste vert, aveugle comme il l'était avant le
  15 octobre — et le 9 quater rougit seul, en nommant chaque bulle
  (« python-input-reponse : la bulle s'écrit sous 12 px (11 px « Ton
  prénom, pour »…) »). La leçon : un contrôle commun ne mesure que ce que
  l'écran montre ; ce que l'écran ne montre qu'à une date se force, ou il
  ne se mesure pas.

**Puis les serpents sont devenus des DESSINS — le corps en fichier, la bulle
en SVG.** (Demande de Turquet, octobre 2026, v548 : « on ne peut toujours pas
faire des dessins plus jolis avec Claude ? ».) Claude ne génère pas d'images ;
les dix-sept serpents SVG du 6.3, tracés courbe par courbe, restaient raides à
côté des dessins des fiches. Le partage retenu : Claude a rendu ses SVG en PNG
comme CROQUIS (le déguisement, les accessoires) et écrit les consignes d'un
générateur d'images, avec quatre serpents des fiches comme références de
STYLE ; Turquet a généré les dix-sept sur une seule planche, puis Claude les a
découpés (une cellule par serpent, chaque composante de la planche rangée dans
la cellule qui en a la plus grande part — la chauve-souris du vampire
touchait celle du fantôme et se nomme dans le script), détourés (le blanc du
papier relié au bord ; les trous de papier ENFERMÉS — entre le balai et la
sorcière, dans la toile — reconnus à leur blanc PUR, quand le drap du fantôme
et le blanc des yeux sont un peu cassés et restent) et passés en WebP :
`dessins/secondes/<identifiant>-halloween.webp`, 10 à 18 Ko chacun.
Trois décisions :
* **le générateur ne dessine ni texte ni bulle** : la bulle parle de SON
  exercice, et un générateur écrit encore mal. `hwBulleSVG` garde la bulle,
  ses lignes courtes et ses 12 px ; le dessin est un `<img class="hw-img">`
  posé par la feuille de styles sur la moitié GAUCHE du cadre de la bulle
  (`position:absolute`, en %) — il suit la bulle à toutes les largeurs. Un
  dessin plus large que haut (`large:true` : le chaudron, la chauve-souris)
  prend toute la largeur SOUS la bulle, sans quoi il tombait à 150 px ;
* **le chemin s'écrit EN CLAIR dans `HW_SERPENTS`** (`img:'dessins/…'`) : le
  banc jsdom relève les dessins par leur chemin dans le TEXTE de la page — un
  chemin composé (`'dessins/secondes/'+id+…`) aurait rendu les dix-sept
  fichiers « orphelins » ;
* **pas de `loading="lazy"`**, bien que le dessin soit caché hors saison :
  dans Chromium, `decode()` sur une image paresseuse en `display:none` ne
  rend JAMAIS la main (mesuré : pendu à 5 s), et le contrôle universel des
  dessins attend chaque `decode()` du document. Le prix est nommé : ouvrir un
  exercice du 6.3 hors saison charge son serpent (~13 Ko) pour rien.
Les contrôles suivent : le banc jsdom exige que chaque serpent montre SON
fichier (`<identifiant>-halloween.webp`), et le « 9 quater » le veut chargé,
rendu (plus de 100 × 120 px) et dans son cadre ; le dessin de la fiche se
cherche désormais par `img[src*="dessins/"]:not(.hw-img)` — sans quoi, sur un
écran sans fiche, le serpent se serait pris pour elle.

**Les dessins vivent en FICHIERS, jamais en base64 dans la page.** Jusqu'en
octobre 2026, chaque dessin d'exercice — le serpent du thème Python, le
schéma-bilan des ensembles de nombres — était écrit dans `secondes.html` en
URL `data:`, « pour que la page reste un seul fichier » : vingt-sept
commentaires le disaient, sur trente-trois lignes, et une trentaine de
contrôles l'exigeaient (« jamais un chemin de fichier »). À quarante-trois dessins, cela faisait 770 Ko sur
4,9 Mo — 16 % du fichier —, téléchargés et analysés par chaque élève à chaque
ouverture, y compris pour un exercice de fractions qui n'en montre aucun ; le
base64 se compresse mal, et la page pesait 1,76 Mo compressée. Mesurée dans un
vrai Chromium, réseau coupé, processeur ralenti quatre fois comme une tablette
d'entrée de gamme, elle mettait 3,2 s à devenir interactive, contre 0,6 s pour
la Première. Décision de Turquet (« sors les images de la Seconde dans des
fichiers » ; APP_VERSION 471 → 472) : les dessins vivent dans `dessins/secondes/<identifiant>.webp`
(le mode d'emploi est dans `dessins/LISEZMOI.md`), référencés par un chemin
RELATIF — la constante `PXX_IMG` garde son nom et tous ses usages, seule sa
valeur change —, et un dessin ne part au navigateur que quand son exercice
s'ouvre. La page passe de 4,94 à 4,17 Mo, et de 1,76 à 1,05 Mo compressée.
Rien d'autre ne bouge : un chemin relatif se résout contre l'adresse de la
page, sur GitHub Pages, sur l'aperçu Netlify et en `file://` dans le banc,
comme les icônes du dossier `icones/` depuis le premier jour ; le service
worker laisse passer les requêtes d'images sans intermédiaire, et le
schéma-bilan, seul dessin posé en HTML statique, reste chargé avec la page —
23 Ko, et un `loading="lazy"` sur un élément caché aurait rendu son
chargement dépendant du moment où le bilan s'ouvre.

**Quatre bords, et il les faut tous, tenus sur les TROIS niveaux sans rien
déclarer.** Au banc jsdom (section 1, structure du fichier) : aucune image en
base64 ne reste dans la page — un exercice ajouté demain avec son dessin en
`data:` rougit le jour même ; chaque fichier référencé existe dans le dépôt —
jsdom ne charge pas les images, un fichier manquant ne rougirait nulle part
ailleurs là ; aucun fichier du dossier n'est orphelin — un dessin qu'aucune
page ne référence est un poids mort qu'on croit vivant. Au banc navigateur
(section 9, chaque exercice dans les deux modes, au premier écran et après
les écrans de départ) : chaque dessin est RÉELLEMENT chargé — `decode()`
attend l'image et rejette si le fichier manque, `naturalWidth` tranche —,
parce qu'un fichier manquant ne s'affiche que comme un cadre vide portant son
`alt`, et que seul un vrai navigateur le voit. Le profil du niveau
(`dessins`, `tests/profils.js`) déclare le dossier : c'est le bord opposé —
un niveau qui déclare des dessins doit en offrir au banc, un niveau qui n'en
déclare pas s'affiche « non applicable » plutôt que d'être tu. Éprouvé avant
même l'extraction : sur la page encore intacte, le contrôle jsdom a rougi sur
les 43 images (« 43 image(s) : ligne 3627, ligne 32865… ») et sur « le profil
déclare des dessins et la page n'en référence aucun ». Puis, les fichiers en
place, un seul dessin renommé (`python-input-prix.webp`) : au banc jsdom, deux
rouges qui le nomment — « absent(s) : dessins/secondes/python-input-prix.webp »
et « orphelin : …python-input-prix.webp.absent » — et au banc navigateur un
seul, « 6.3.9 python-input-prix (train, premier écran) … non chargé (fichier
absent ?) », dans les deux modes, 624 autres contrôles verts autour. Ce
sabotage a aussi montré que le relevé du document entier renommait le même
fichier une troisième fois « hors écran visité » : il écarte désormais ce que
la visite a déjà nommé. Les commentaires de la
page et les contrôles par exercice qui disaient « jamais un chemin de
fichier » ont été réécrits — un commentaire qui contredit le code est pire
qu'aucun —, et les paragraphes plus anciens du journal du thème Python
(`06-seconde-python.md`) qui racontent « une URL `data:` — la page reste un
fichier unique » racontent l'histoire avec la convention de leur époque : le motif d'un dessin (découpé, détouré, WebP de
10 à 20 Ko, posé en tête de l'exercice) reste vrai, seul son rangement a
changé.

**L'onde d'une case juste, les confettis d'un sans-faute, le fondu depuis le
portail — sans rien télécharger** (demande de Turquet, octobre 2026 :
« embellir sans surcharger ni ralentir »). Un bloc `<style id="embellir">` en
fin d'en-tête et un script `#embellir-js` en fin de fichier, identiques dans
les trois pages.
· **L'onde** : une case qui DEVIENT juste s'éclaire d'une ombre bleue qui
s'efface (`Element.animate`, 0,65 s). Ni classe ni règle CSS ajoutée, donc
rien que le « 9 bis » des couleurs, la capture du brouillon ou un contrôle
qui compare `className` puisse relire ; une ombre ne déplace rien, donc
aucune mesure de taille ou d'alignement ne change. Elle part sur l'ARRIVÉE de
`ok` (un `MutationObserver` d'attribut, avec l'ancienne valeur) — jamais sur
une case CRÉÉE juste, sans quoi chaque redessin ferait clignoter l'écran. Le
garde de la case où l'élève écrit retire et repose `ok` : l'onde part donc à
la sortie de la case, avec la couleur.
· **Les confettis** : quand `#scr-results` s'ouvre et que `#resultScore` dit
une note égale au total (« 10 / 10 », « 7,5 / 7,5 »). Lus sur ce que l'élève
voit, parce que toutes les fins de séance y écrivent — un seul point
d'accroche au lieu de chaque `finishTest`. `pointer-events:none`, retirés
après 4 s.
· **Le fondu** : `@view-transition{navigation:auto}`, posé aussi sur le
portail ; le portail et les pages sont sur la même origine
(`turquet78.github.io`). Les ÉCRANS d'une page, eux, avaient déjà leur
apparition en fondu (`.screen{animation:rise}`).
Sous « moins d'animations », rien de tout cela. Le banc navigateur le tient
(« 9 quinquies ») : l'onde à l'arrivée et pas à la création ni au maintien,
les confettis au sans-faute et pas à « 9,5 / 10 », sans clic capté ni
défilement de côté, et rien sous `reducedMotion: 'reduce'`.
**Le mode sombre n'est PAS venu dans les pages d'exercices** : la Seconde
seule écrit plus de 1 300 couleurs en dur (feuille de styles, gabarits,
dessins SVG et images sur fond blanc). Un mode sombre à moitié — des cadres
blancs sur un fond noir — serait pire que pas de mode sombre ; il demande un
chantier à lui, page par page, avec un contrôle qui le tienne. Le portail,
construit sur des jetons, l'a reçu.
**Et un fondu ABANDONNÉ est une erreur — au hasard du minutage.** Première
action, premier rouge : « la page d'aiguillage ne lève aucune erreur
JavaScript → Transition was skipped », sur la Terminale seulement, vert en
local. « Quitter » un niveau mène à `prof.html` : la page de départ
s'inscrivait au fondu (`pageswap` portait une transition), la page d'arrivée
non — le navigateur l'abandonne et REJETTE ses promesses, que personne
n'attendait ; l'erreur ne remonte que si l'ancienne page vit encore à cet
instant. Mesuré en relevant `e.viewTransition` sur `pageswap`/`pagereveal` :
avant, « pageswap terminale true » puis « pagereveal prof false » ; après,
« pagereveal prof true ». Deux remèdes, il les faut tous les deux : `prof.html`
s'inscrit au fondu (le chemin ordinaire ne s'abandonne plus), et un script
`#embellir-garde` EN TÊTE de chaque page attrape les promesses de toute
transition (`pagereveal` part avant le premier rendu : en fin d'une page de
plusieurs mégaoctets, il serait posé trop tard). Une seconde navigation qui
coupe la première l'abandonne encore — attrapée, elle ne dit plus rien.

**Les cadres sont tracés au MARQUEUR BLEU, comme sur le portail — en petites
images de fond, jamais par-dessus la carte (décision de Turquet, octobre 2026 :
proposition « B », « bleu sur tous les niveaux » ; Seconde v620, Première
v351, Terminale v460 — v459 à l’écriture, prise par #889).** Trois maquettes avaient été montrées, posées sur la
vraie page de Seconde : A (tout au feutre, texte compris), B (cadres et titres
au feutre, le calcul en clair), C (le seul grand cadre). B a été retenue, en
bleu pour les trois niveaux plutôt qu'à la couleur de chaque niveau du
portail. Ce qui change : le cadre de chaque écran (`.screen > .card`) et les
cartes des menus (`.choices > .choice`) perdent leur bordure arrondie et leur
ombre, et reçoivent quatre coups de marqueur bleu (`--marqueur`, le `--blue`
de la page) ; les titres (`.mast h1`, `h2.title`, `.hello`, `.choice .ttl`) et
l'étiquette « Énoncé » s'écrivent en Kalam, la police du portail ; le logo de
l'en-tête disparaît. Les énoncés, les nombres et les cases gardent leur
écriture : aucune taille de case ne bouge, aucune encre de verdict non plus.
Le même jour, la page des PRÉNOMS a pris la proposition « 1 », les étiquettes
de cahier : chaque prénom est une étiquette beige écrite au feutre, posée un
peu de travers ; celle qu'on choisit est entourée au marqueur ; « Se
connecter » est surligné, le code s'écrit sur une ligne — et ses couleurs de
verdict (attente, valide, refus) restent, la règle neutre ne les couvre pas
(`#loginPin:not(.pin-attente,.pin-valide,.pin-refus)`).
**Pourquoi des images de fond, et pas le SVG posé dans la carte du portail.**
Le portail glisse un `<svg>` en `position:absolute` dans chaque cadre, ce qui
exige `position:relative` sur la carte — exactement ce que le décor
d'Halloween a refusé plus haut : tout ce qui s'accroche en absolu dans un
exercice se serait rattaché à la carte. Le script `#cadres-marqueur` (fin de
chaque page, identique sur les trois) peint donc chaque coup comme une IMAGE
DE FOND de la carte, une bande de la longueur du côté et d'une vingtaine de
pixels d'épaisseur, plus un dégradé uni pour le fond à l'intérieur du trait.
La carte ne bouge pas d'un pixel, rien n'est recouvert, et une image de fond
ne se refiltre pas à chaque frappe. Le trait est posé EN RETRAIT, dans la
marge intérieure, avec 8 px d'air avant le contenu : ses dépassements aux
coins restent dans l'image. Une carte sans assez de marge (moins de 10 px)
garde son ancien cadre. Le tracé suit les tailles (`ResizeObserver`) et les
listes qui se remplissent après coup (un `MutationObserver` par conteneur
`.choices`, enfants directs seulement) ; sans `ResizeObserver` (le banc jsdom)
le script ne pose rien. Pendant le décor d'Halloween, rien n'est tracé : le
décor garde ses cadres, et le bouton 🎃 retrace.
**Deux leçons du portail et des maquettes, tenues par la section « 5 bis » du
banc navigateur.** Sur tablette, le portail n'affichait AUCUN cadre : un seul
filtre de 4000 × 4000 px, partagé par tous, dépassait ce que Safari accepte de
filtrer à 2 ou 3 pixels par point, et un tracé dont le filtre échoue ne
s'affiche pas du tout (corrigé sur le portail en taillant un filtre par
cadre). Puis les maquettes ont perdu la moitié de leurs cadres en Chromium :
les filtres de deux écrans portaient le même identifiant, et l'URL résolvait
vers celui d'un écran caché, plus étroit — le trait s'arrêtait net à 780 px.
Ici chaque coup est sa propre image, son filtre est celui de l'image et a sa
taille. Le contrôle, sur un écran de tablette tactile, visite la connexion,
l'accueil, les thèmes, les modes et l'exercice témoin, et exige pour chaque
cadre et chaque carte de menu : quatre coups, chacun une image d'au plus
40 px d'épaisseur et pas plus grande que la carte, son filtre à la taille de
l'image ; chaque coup dans la marge intérieure de son côté ; la carte restée
`position:static` ; chaque image décodée. En saison, il exige aussi qu'aucun
cadre ne soit tracé sous le décor d'Halloween ; hors saison, il le dit.
Seul l'écran de calcul rapide (`scr-test`, l'ardoise noire) n'a pas de cadre
et n'en reçoit pas.

**Le trait de fraction couvre le produit qui le précède — comme la NumWorks.**
Demande de Turquet, octobre 2026 : « 3x4/2 qui s'affiche (3x4)/2 ». MathLive
coupait la fraction au dernier signe opératoire, et « × » en est un : `3*4/2`
donnait `3\times\frac{4}{2}`, `(1+2)/3` gardait ses parenthèses au numérateur.
L'éditeur de la NumWorks traite le produit comme un bloc. Le script
`#fraction-numworks` (fin de fichier, identique sur les trois niveaux)
reproduit les deux règles : la touche « / » emporte tout ce qui précède le
curseur, dans son groupe, jusqu'au premier `+` ou `−`, `=`, `<`, ponctuation
ou parenthèse ouvrante — les produits (×, ·, implicite), puissances, racines,
fractions, et la virgule DÉCIMALE (`2,5`, une virgule entre deux chiffres ne
borne pas) ; et une parenthèse seule devant « / » perd ses parenthèses. Une
seule porte : l'événement `beforeinput` que MathLive émet, annulable, avec
`data = "\frac{#@}{#?}"` AVANT d'insérer la fraction — le clavier physique,
la touche du clavier à l'écran et celle du pavé y passent tous les trois. Le
script annule, sélectionne le numérateur, insère `\frac{…}{#?}` : le curseur
tombe dans le dénominateur, et Ctrl+Z défait exactement comme avant (mesuré
pas à pas, avec et sans le script). Une sélection déjà faite, un curseur en
tête de groupe (rien à monter) : MathLive garde la main. Ce qui ne change pas,
parce que la NumWorks fait déjà pareil : dans un exposant, « / » reste dans
l'exposant (`x^2/3` → x^(2/3)) — on sort par →, puis `/` monte x² entier.
Le prix nommé : le script lit le modèle INTERNE de MathLive
(`_mathfield.model`, `at`, `leftSibling`, `offsetOf`) ; s'il change à une
montée de version, le script se tait et MathLive reprend sa coupe d'origine —
la section « 11 terdecies » du banc navigateur le dirait (six saisies au vrai
clavier, et la commande de la touche à l'écran). Les boutons « Fraction »
des feuilles (`\frac{#0}{#?}`) ne sont pas touchés : ils posent une fraction
vide, comme la touche fraction de la NumWorks sans rien devant. Les juges ne
voient rien : `\frac{3\times4}{2}` et `3\times\frac{4}{2}` ont la même valeur.
