# Vérification, bancs de test et numérotation des sections

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**La même erreur, huit fois, n'est pas huit mesures.** Une poussée a échoué huit
fois de suite sur `could not read Username`, et le message a été relu huit fois
comme s'il était neuf. Il ne l'était pas : il décrit ce que git constate au tout
dernier maillon — « je n'ai pas d'identifiant à présenter » — et ne dit rien de
la cause. Celle-ci était trois maillons plus haut, hors du dépôt : aucun compte
GitHub n'était lié au compte claude.ai. L'installation de l'application GitHub
côté dépôt, elle, était parfaite, si bien que la vérifier ne pouvait qu'innocenter
la mauvaise moitié de la chaîne.
Ce qui a fini par trancher, ce sont les outils qui contrôlent l'autorisation
EN AMONT et savent la nommer : `list_repos` répond `no GitHub account linked`,
`create_session` répond `github_repo_access_denied`. Ils ont été essayés en
dernier ; ils auraient dû l'être au deuxième échec. La règle : quand une erreur
revient à l'identique, cesser de la reproduire et changer de couche — remonter
la chaîne jusqu'au maillon capable d'expliquer, au lieu d'interroger celui qui
ne sait que constater. C'est la règle 3 appliquée au diagnostic : une
vérification qui ne prouve rien ne prouve pas davantage en la répétant.

**Deux bancs jsdom ne se lancent pas EN MÊME TEMPS.** `verifier.js` écrit ses
contrôles dans `ctrl<i>.js` sous le dossier temporaire du système, et deux
exécutions parallèles — `test:secondes` et `test:premiere` lancés côte à côte
pour gagner du temps, septembre 2026 — se prennent ces fichiers l'une à
l'autre : la seconde s'arrête sur « ENOENT … unlink /tmp/ctrl1.js », un échec
qui ressemble à un défaut de la page et n'en est pas un. `npm test` les
enchaîne, exprès. Une campagne de sabotage, qui relance le banc en boucle, se
joue seule sur la machine, sans banc à côté — sans quoi un banc interrompu
fait rougir un sabotage qui ne mesurait rien.

**Un bug trouvé devient un contrôle.** Sinon il reviendra. Les trois pannes qui
ont motivé ce banc de test y sont chacune couvertes par une ligne.

**Une clé écrite deux fois dans `tests/profils.js` ne casse rien — elle
gagne.** C'est un objet littéral : la seconde écrase la première, `node --check`
passe, et l'objet est parfaitement valide. Un `suivant` ainsi doublé a fait
attendre le banc navigateur sur un sélecteur absent de l'écran : quarante tours
de boucle, vingt minutes, et pas un mot — la boucle retombait chaque fois sur
« valider ». Deux gardes désormais : le banc s'arrête au premier tour si le
sélecteur « suivant » ne désigne rien, et un contrôle lit le SOURCE du profil
en suivant la profondeur des accolades pour nommer la clé en double. Trouvé en
nettoyant : `main` en portait déjà deux, arrivées par un script de restauration
qui réinsérait des entrées déjà présentes.

**Un NUMÉRO de section du banc ne désigne qu'une section — et un en-tête qui
n'imprime pas son titre est pire qu'un titre absent.** Les numéros
(« 6 vicies ter », « 11 quater ») ne pilotent rien : ils servent à RETROUVER
une section, dans la sortie du banc et dans les paragraphes de ce fichier qui
la citent. Trois étaient ambigus, et aucun ne cassait quoi que ce soit —
c'est pour cela qu'ils ont vécu des mois. « 6 octodecies » désignait la
récurrence rédigée ET {placer-image} ; « 6 vicies ter » le 4.6 ET
{solutions-graphique} ; et « 6 vicies quater » vivait dans l'en-tête de
{synthese-fonction} sans qu'aucun `titre()` ne l'imprime — ses quatre
contrôles se rangeaient donc sous le titre de la section d'AVANT (« 6 quater
ter. LES TROIS FORMES DU TABLEAU DE VARIATION »), pendant que ce même numéro
était imprimé, lui, par {ecrire-solutions}. **Un contrôle qui s'affiche sous
le nom d'un autre est pire qu'un contrôle sans nom** : le jour où il rougit,
on va corriger l'exercice qu'il ne mesure pas.
Les numéros GARDÉS sont ceux que `CLAUDE.md` citait déjà (le 4.6 garde
« 6 vicies ter », {ecrire-solutions} « 6 vicies quater ») ; les trois autres
sections ont pris le numéro libre suivant — {synthese-fonction}
« 6 vicies quinquies », {solutions-graphique} « 6 vicies sexies »,
{placer-image} « 6 vicies septies » —, et les deux citations concernées ont
suivi le jour même.
**La famille des « 6 … » n'est PAS remise dans l'ordre d'exécution, et le dire
vaut mieux que de le taire** : ses quarante-cinq numéros ont été attribués au
fil des demandes, si bien que « 6 quindecies » tourne entre « 6 sexies » et
« 6 septies ». Les remettre en ordre aurait réécrit vingt-et-une citations de
`CLAUDE.md` — sa mémoire — pour zéro gain de lecture : la sortie se lit de haut
en bas, pas par numéro. Ce qui est réparé est l'AMBIGUÏTÉ, qui trompe ; pas le
désordre, qui ne trompe personne.
**Et c'est un contrôle qui tient les bords, parce que la vigilance ne les
tiendra pas** : le banc navigateur lit sa PROPRE source au démarrage (section
« 0 ») et relève les numéros IMPRIMÉS par `titre()` comme ceux ANNONCÉS par un
en-tête de commentaire. **Il lit dans les DEUX SENS, et il a fallu les deux —
chacun laisse passer ce que l'autre attrape.** Un titre doit être annoncé par
l'en-tête JUSTE AU-DESSUS de lui : ce sens nomme la moitié renommée seule, et
l'ambiguïté d'origine (le titre d'une section annoncé par l'en-tête de la
précédente). Et tout en-tête doit IMPRIMER son titre : ce sens-là seul voit un
titre retiré — le sabotage l'a montré en restant VERT dans l'autre sens, à bon
droit, un en-tête devenu muet ne se distinguant plus d'un sous-bloc.
**Le premier jet ne tenait que ce second sens, et il a rougi sur du code
JUSTE** — « 1 bis » (dans la section 1) et « 12 » (dans la section 11) sont des
SOUS-BLOCS : leurs contrôles appartiennent à bon droit à la section qui les
entoure, et elle imprime son titre. Un essai faux se reconnaît à ce qu'il
rougit sur une page juste. Ils sont donc NOMMÉS dans le contrôle plutôt que de
faire taire le bord — la règle des exemptions du projet —, et un cinquième
contrôle exige que chaque nom désigne encore un en-tête, sans quoi une
exemption survivrait à ce qu'elle protégeait.
**Deux en-têtes ont dû gagner leur numéro pour que la mesure existe** : « 9
bis » et « 10 » portaient leur doctrine en commentaire mais pas leur numéro sur
la première ligne, et leur titre était donc rattaché à l'en-tête de la section
d'avant. Le filet d'un en-tête s'écrit « ===== » ici et « ---- » là : le
contrôle accepte les deux plutôt que d'imposer une convention de plus.
**Et il a resservi le jour même, sur `main`** : deux branches ont numéroté leur
section « 6 tricies ter » à trente-neuf minutes d'écart — le print de la Seconde
puis le vocabulaire des suites — et `main` s'est retrouvé ROUGE sur ses TROIS
bancs navigateur, un échec par niveau, sans qu'une seule page soit en cause. Le
contrôle avait fait exactement ce pour quoi il existe : nommer l'ambiguïté avant
qu'un contrôle ne s'affiche sous le nom d'un autre. Le numéro revient à qui l'a
pris EN PREMIER, le second prend le suivant (« 6 tricies quater »), et la
citation de `CLAUDE.md` suit le jour même — sans quoi la doctrine désignerait une
section qui n'existe plus.
**C'est la collision qu'aucune branche ne peut voir seule**, et c'est ce qui la
distingue de toutes les autres : le contrôle lit la source du banc, chaque
branche n'avait qu'UN de ces numéros, et les deux bancs étaient donc verts à
bon droit. Le défaut n'existe que sur `main`, et il s'y voit à la première
fusion. La règle qui en découle : au moment de refusionner `main`, on relit les
numéros de section comme on relit les numéros d'exercice et `APP_VERSION` —
c'est la même famille de collisions, et elle se règle de la même façon.
**Et elle a resservi seize secondes plus tard** : « 6 tricies quinquies »,
pris le même jour par la suite à la différence (Terminale) et par le
programme à deux lignes (Seconde), deux fusions à seize secondes d'écart. La
règle a tranché sans qu'on ait à réfléchir — le premier garde le numéro, le
second prend « 6 tricies sexies », la citation de `CLAUDE.md` suit — et c'est
la troisième fusion de suite à porter cette collision : ce n'est pas un
accident, c'est ce que produit un dépôt où plusieurs branches ajoutent une
section le même jour.
**Et la réparation s'est heurtée à la même chose** : deux sessions ont corrigé
ce numéro le même quart d'heure, chacune sur sa branche, et la seconde fusion
n'a plus rien apporté que son paragraphe — écrit à côté du premier, il racontait
deux fois le même épisode, ce que ce paragraphe-ci répare. Sur un `main` rouge,
on regarde d'abord si quelqu'un est déjà en train de le réparer.
Un dernier bord le garde honnête — il compte ce qu'il a trouvé et le DIT s'il
n'a rien à mesurer : une expression régulière qui cesserait de reconnaître les
titres le rendrait vert sur un banc entièrement dupliqué. Cinq sabotages,
chacun rougissant en nommant son défaut (un numéro imprimé deux fois, un
en-tête privé de son titre, une moitié renommée seule, la lecture des titres
débranchée, un sous-bloc déclaré qui n'existe plus).

**Un contrôle qui ne s'applique pas se déclare, il ne se retire pas.** Les trois
fichiers ne savent pas faire les mêmes choses : `tests/profils.js` dit pour
chacun ce que le banc doit piloter, et la liste `lacunes` de son profil énumère
ce qui lui manque. Ces manques s'affichent à chaque exécution. Un contrôle
supprimé en silence rend le banc vert sur un fichier qu'il ne vérifie plus.

**Une fonction déclarée deux fois au niveau global ÉCRASE la première, sans
une erreur.** Octobre 2026 : en reconstruisant {python-input-reponse} sur
`main` après une collision de noms avec {python-input}, un renommage
automatique (`pyi` → `pyn`) a laissé passer `ctxPyi` — le « P » majuscule.
La page déclarait donc deux `ctxPyi` ; la seconde gagnait, et le contexte
envoyé au modèle pour {python-input} devenait celui de l'exercice voisin.
Aucune erreur au chargement : c'est le contrôle propre de {python-input},
qui lit ce contexte, qui a planté. Le banc principal relit maintenant les
déclarations en colonne 0 (les fonctions locales, indentées, ne se heurtent
pas) et refuse tout doublon. Ceux qui préexistaient en Première (`fmtNote`,
`qiaEstExemple`, `qiaEstRedaction`) et en Terminale (`fmtNote`) sont une
dette nommée (`fonctionsEnDouble` dans `tests/profils.js`) — la liste ne
grandit jamais, et le second bord rougit dès qu'un doublon y est résolu sans
être retiré. Éprouvé par sabotage : `ctxPyi` remis en double rougit en le
nommant.

**Le MathLive en cache ne se lit qu'entier — et c'est le banc qui accusait la
page** (octobre 2026). Au premier lancement de `npm run test:navigateur` sur
un conteneur neuf, la Seconde est sortie en rouge sur trente contrôles :
« Unexpected token '}' », `<math-field>` jamais enregistré. La page était
saine (la CI, verte ; la Seconde relancée seule, verte). Le défaut était dans
le banc : `tous-navigateur.js` lance les trois niveaux EN MÊME TEMPS, chacun
voulait MathLive dans `tests/.cache/`, et curl écrivait directement à la place
définitive. Le fichier existait dès le premier octet : un second banc le
croyait prêt et lisait un MathLive coupé. La CI n'y est pas exposée — chaque
niveau y a sa machine.
Reproduit avant d'être corrigé : trois processus décalés de 0,3 s sur un cache
vide, curl bridé à 300 ko/s — deux sur trois lisaient 196 340 caractères au
lieu de 842 568. Le cache vit désormais dans `tests/mathlive-cache.js` : on
télécharge dans un fichier temporaire propre au processus, on le vérifie, puis
on le RENOMME (atomique : jamais un fichier à moitié écrit), et
`tous-navigateur.js` le remplit une fois avant de lancer les trois. La même
course rejouée : trois fois 842 568.
Un second bord s'est montré en éprouvant le premier : « entier » ne veut pas
dire « long ». Le seuil de 100 000 caractères laissait passer le fichier coupé
au quart, qui pèse le double. La lecture exige donc aussi que `node --check`
relise le module jusqu'au bout — éprouvé sur un fichier coupé à 196 340 et à
50 000 caractères : les deux sont retéléchargés.

**Les contrôles des « mineures » techniques et d'accessibilité (octobre 2026).**
La course sur le cache MathLive (T4) était déjà réglée (`tests/mathlive-cache.js`,
paragraphe précédent). Ce qui s'ajoute : au banc principal, la structure de la
page (`<html lang="fr">`, `<meta charset>` dans les 1 024 premiers octets,
`<head>`/`<body>` écrits), le code de connexion masqué sans être un mot de
passe, et les conteneurs du verdict, du score et du « Bravo » dans une région
`aria-live` (lu sur la page chargée, toutes familles confondues). Au banc
navigateur, § 1 : la page ouverte en `file://` se lit en UTF-8, en français, en
mode standard, et `#loginPin` est masqué ; § 5 : à 390 px les commandes du bas
tiennent sur une ligne, en libellés courts, cibles de 24 px au moins ; § 9,
greffés sur la visite de tous les exercices : les textes des graphiques à
12 px au moins (un indice d'étiquette de 14 px ou plus à 10), aucune
graduation sous le nom d'une courbe, toute enveloppe défilante d'un tableau
focusable. Les deux contrôles universels qui pourraient n'avoir rien à mesurer
le DISENT (« le contrôle ne mesure rien ») ; la Première, sans tableau
défilant, se déclare dans `tests/profils.js` (`defilants.aucun`), et la
déclaration rougit le jour où elle devient fausse.

**Le clavier du 6.7 se clique STABLE, lui aussi.** À la première exécution de
l'action GitHub sur l'intégration des constats mineurs (octobre 2026), le
banc navigateur de la Terminale a rougi sur « les touches ≤ ≥ < > = du
clavier à l'écran écrivent dans la ligne du {recurrence-redaction} » :
« touches trouvées : le lt gt », « = » et « ≥ » introuvables, la ligne lue
« ≤<> ». Trois passages locaux étaient verts, et le même contrôle était vert
sur `main` la veille : un runner chargé, et un clavier dont les deux couches
étaient encore en construction au moment du clic — 800 ms après le ⌨️, 200 ms
après la bascule, des DÉLAIS FIXES. La section 11 sexies avait appris la
même chose un mois plus tôt (« le clavier de la tablette est stable avant
qu'on le mesure ») : on attend que la couche visible garde le même jeu de
touches d'un quart de seconde au suivant, six secondes au plus, à
l'ouverture et après chaque bascule. Le contrôle exige toujours que les
cinq touches existent et écrivent ; il dit en plus « le clavier changeait
encore après 6 s » quand c'est ce qui l'a privé d'une touche. « Flake » n'est
pas un diagnostic : la cause est un délai fixe, et le correctif est
l'attente de l'état.

**Puis les trois bancs jsdom ont joué de front, chacun dans son dossier
temporaire.** La règle « deux bancs jsdom ne se lancent pas EN MÊME TEMPS »
tenait à un seul fichier : les scripts de la page, écrits dans
`/tmp/ctrl<i>.js` pour `node --check`, portaient le même nom d'un processus à
l'autre, et le second effaçait ce que le premier relisait. Elle coûtait cher :
`npm test` enchaînait les trois niveaux — une minute et demie, vingt-deux,
quatre —, et l'action GitHub faisait de même dans un seul travail, vingt-sept
minutes avant de pouvoir fusionner, pendant lesquelles `main` avançait (treize
pull requests par jour en octobre 2026) et le contrôle de version rougissait :
plus de deux reprises de `main` par livraison, comptées sur cinq jours
(décision de Turquet, octobre 2026 : « fais pareil pour le temps des
contrôles »). `verifier.js` écrit désormais ces fichiers dans un dossier
`mkdtemp` propre au processus, effacé à la fin ; `tests/tous.js` lance les
trois niveaux ensemble et recrache leurs sorties dans l'ordre, comme le banc
navigateur ; l'action donne une machine à chaque niveau (`controles
(secondes.html)`), au lieu d'une étape. L'attente tombe de la somme des trois
au plus long d'entre eux. Éprouvé sur l'ancien code, la Première et la Terminale
lancées à la même seconde : la Première meurt en section 1 sur « erreur
JavaScript non rattrapée → ENOENT: no such file or directory, unlink
/tmp/ctrl0.js » pendant que la Terminale passe ses sept scripts — le rouge
accuse une page qui n'a rien ; sur le nouveau, les trois niveaux lancés
ensemble par npm test finissent verts, chacun avec ses fichiers.

**Puis la Seconde a rendu dix minutes à chacun de ses deux bancs — mesurées
contrôle par contrôle, jamais devinées.** Le relevé horodaté du banc jsdom
(chaque ligne préfixée du temps écoulé depuis la précédente) a donné, sur
27,6 minutes, 14 minutes à un seul contrôle, « aucune séance ne pose deux fois
la même question » — 7 160 séances démarrées dans la fenêtre jsdom qui venait
d'encaisser toute la section 4 —, et 2,3 minutes de plus aux fractions
irréductibles, 900 séances dans la même fenêtre. Or une fenêtre FRAÎCHE
démarre les 183 exercices du menu en 7,8 s par tour, soit cinq minutes pour
quarante tours : la fenêtre usée démarrait un exercice près de trois fois plus
lentement. Les trois contrôles qui rejouent des séances (contexte de chaque
exercice, séances sans doublon, fractions irréductibles) tournent donc dans
une fenêtre neuve (`rejouerDansUneFenetreNeuve`, `tests/verifier.js`) : le
rejeu des séances passe de 839 à 295 s, les fractions de 138 à 60 s, le banc
de 27,6 à 16,5 minutes — mêmes 904 contrôles verts, mêmes quarante tours.
Côté navigateur, le relevé montrait 118 ouvertures de page (une par section),
chacune LANÇANT son propre Chromium puis attendant 3,5 s à plat : six à sept
secondes par ouverture, 93 lignes de plus de quatre secondes qui cumulaient
1 103 s sur 1 312. Le navigateur est lancé une fois pour tout le banc, chaque
ouverture reçoit un contexte neuf (rien n'est partagé d'une section à l'autre,
et c'est le contexte que `s.nav.close()` ferme), et l'attente est devenue une
CONDITION — page chargée, double de Supabase en place, `<math-field>`
enregistré — suivie de 400 ms de répit : la première ouverture passe de 7,1 à
1,3 s, le banc de 21,9 à 16,6 minutes, 625 contrôles verts. Ce qui reste, et
le dire vaut mieux que de le taire : la visite de tous les exercices de la
section 9 (459 s, des attentes fixes de 300, 650 et 700 ms par exercice et
par mode, que des conditions pourraient remplacer sans que rien ne le mesure
encore), le schéma à cases de {pourcentages-problemes} (178 s, 600 rendus), et
le rejeu des séances lui-même, cinq minutes pour quarante tours. Toutes les
durées ici sont celles d'une machine qui jouait deux bancs à la fois ;
l'action GitHub, une machine par banc, fera mieux.

**Puis l'action a donné la mesure propre, et le répit s'est allongé à 1,2 s.**
Sur la pull request #626, une machine par banc : jsdom de la Seconde 7 min 07
au lieu de 21 min 40, Première 1 min 35, Terminale 4 min 16 ; navigateur de
la Seconde 15 min 50 au lieu de 20, Première 9 min 48, Terminale 8 min 33 —
l'action entière en seize minutes au lieu de vingt-sept. Mais sur la machine
de la session, les trois bancs navigateur joués de front avec le banc jsdom,
le 4.6 de la Première a rougi une fois : « 1/2 + 1/2 × 3/2 = 10/8 = 5/4, tapé
au clavier, est compté faux ». Le script module de la page pose, APRÈS
l'enregistrement de `<math-field>` que l'attente de condition guette, des
réglages différés par `setTimeout` — les raccourcis de frappe à 0 et 350 ms,
le menu, l'ajustement du clavier jusqu'à 620 ms. À 400 ms de répit, sur une
machine chargée, la frappe partait avant les raccourcis ; l'ancien délai de
3,5 s les couvrait sans le savoir. Le répit passe à 1,2 s : les 118
ouvertures de la Seconde coûtent 1,6 minute de plus qu'à 400 ms, et 4,5 de
moins qu'avant. Une attente de condition n'attend que ce qu'elle nomme — ce
que le script fait ensuite, différé, reste à couvrir par le répit, et c'est
écrit à côté de lui.

**Le banc jsdom de la Seconde a reçu 6 Go de tas sur l'action (octobre 2026).**
Il garde UNE fenêtre jsdom ouverte pour tous ses exercices, et le plafond par
défaut de Node (4 Go) était atteint sur main même : le travail
« controles (secondes.html) » de la PR #710 a mis vingt minutes, rejoué en
local sous `--max-old-space-size=4096` il n'avait pas fini en trente — le
ramasse-miettes tournait en boucle. L'exercice suivant ({somme-trois-vecteurs},
8.2.12) a fait déborder le tas (« heap out of memory »), alors que son contrôle
ne dessine qu'une figure par geste (sa première version en dessinait 200 : la
leçon du 8.1.9, voir `19-seconde-vecteurs.md`). `controles.yml` lance désormais
`node --max-old-space-size=6144 tests/verifier.js` : le runner a 16 Go, aucun
contrôle n'est retiré ni allégé. Mesuré en local sous ce plafond : 935 contrôles
passés, 4,9 Go de mémoire au plus haut (RSS). Le prix est nommé : ce plafond recule le mur, il
ne l'abat pas. Chaque exercice ajouté à la Seconde garde la règle — un tirage
répété se fait SANS dessin (`xxxBuildQuestions()`, ou le SVG relu comme du
texte), un seul démarrage réel par contrôle.
