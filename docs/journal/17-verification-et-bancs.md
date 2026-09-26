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
