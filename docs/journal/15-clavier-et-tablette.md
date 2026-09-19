# Clavier mathématique, pavé numérique et tablettes

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Huit écrans de la Terminale n'offraient aucun bouton pour le clavier
mathématique.** Les cinq dérivées, le 3.5, le 5.3 et le 6.1 — signalé par
Turquet en août 2026 : chaque famille d'exercices posait sa rangée de jetons
dans son coin (sa, rc, sp, enc), et les autres restaient nues ; l'indice
« clic droit sur le champ » ne mène nulle part sur tablette. La rangée
générique de la Seconde et de la Première — qui était née « convention
terminale » — est revenue à la maison : `pmJetons()` se greffe sur tout écran
à champ mathématique qui n'a pas déjà SA rangée (`.rc-jetons`/`.sa-jetons`),
par l'enveloppement des rendus concernés, et l'ancre `.mp-feedback` étant
statique, la rangée survit aux redessins.
**Envelopper la table de reprise ne suffit pas** : `startDexp2()` appelle
`renderDexp2()` en DIRECT, et n'envelopper que `renderDexp` laissait le 2.2
sans rangée pour l'élève qui y arrive en premier — signalé par Turquet sur une
capture, le lendemain de la mise en ligne. Le banc n'y voyait rien : sa visite
séquentielle passait par le 2.1 d'abord, qui posait la rangée sur l'écran
PARTAGÉ de la famille, et le 2.2 en héritait. La rangée générique porte donc
une classe à elle (`pm-jetons`) et le banc la RETIRE avant chaque exercice :
chacun doit la faire naître lui-même. Les HUIT rendus appelés par un démarreur
de ces écrans sont enveloppés, et le sabotage nomme le 2.2. Les rangées spécialisées gardent
leurs jetons propres (Uₙ, x², …). Le contrôle est UNIVERSEL — greffé sur la
visite de tous les exercices des trois niveaux : tout écran à champ
mathématique doit offrir un bouton « Clavier mathématique », et un exercice
ajouté demain est couvert sans rien déclarer. Éprouvé en débranchant la
greffe : il nomme les huit écrans.

**Sur tablette, le clavier du système recouvre la moitié de l'écran pour taper
trois chiffres.** Le pavé numérique compact (demande de Turquet, août 2026) le
remplace sur les écrans tactiles — et sur eux seulement : une rangée d'environ
60 px dessinée par la page, chiffres, virgule, signe moins, effacer, Entrée.
Le moteur est le MÊME TEXTE dans les trois fichiers (six fonctions comparées au
caractère près) ; la liste des touches vit HORS du moteur, comme `SF_NB` —
`PAVE_TOUCHES`, la Terminale y ajoute « / » pour ses fractions p/q — et un
contrôle la compare à `tests/profils.js` : deux sources.
**Le pavé ne s'attache qu'aux cases DÉCLARÉES numériques**
(`inputmode="numeric"`), une liste en POSITIF — contrairement au bouton des
tables, et le sens compte ici aussi : le mauvais bord n'est pas le même. Un
pavé sans lettres attaché à un champ de texte rendrait le champ INUTILISABLE
sur tablette, quand une case numérique oubliée garde simplement le clavier du
système. Un observateur convertit les cases au fil des rendus : un exercice
ajouté demain est couvert dès que ses cases se déclarent. Les `math-field`
sont hors sujet — MathLive a son propre clavier.
**Trois pièges, chacun tenu par un contrôle.** Le signe moins doit insérer le
TIRET du clavier, jamais « − » : `lvReadInt()` passe par `parseFloat`, qui ne
connaît que le tiret — la touche aurait écrit une réponse illisible par la
correction. Chaque touche doit lever l'événement `input`, sans quoi la
correction en direct du soutien ne voit jamais la frappe. Et la touche « ⏎ »
envoie la touche Entrée : le calcul mental et les opérations posées valident
au clavier, et sans elle un élève sur tablette n'aurait plus AUCUN moyen de
valider — le clavier du système qui portait Entrée ne s'ouvre plus.
**Enfoncer une touche ne vole pas le focus de la case** (`pointerdown`
neutralisé — le piège classique des claviers dessinés), et le banc navigateur
MESURE en mode tactile forcé (`window.__paveForce` — la requête média
`pointer: coarse`, elle, appartient au navigateur) : le pavé est PETIT — c'est
toute sa raison d'être —, ses touches font 40 px, il ne recouvre ni la case
qu'on remplit ni les commandes du bas, et une touche cliquée écrit dans la
case sans lui voler le focus. Éprouvé en le cassant sept fois.

**Le pavé compact de la Première sert aussi ses cases MathLive — et change de
forme avec l'orientation.** Demande de Turquet (septembre 2026) : « en Première,
pour les exercices où il n'y a que des cases à remplir avec des nombres, sur
une tablette uniquement, un clavier avec les 10 chiffres, la virgule, le
signe − ; en portrait sur une ligne en bas de l'écran, en paysage un pavé
rectangulaire de 4 × 3 à droite et en bas ». Le pavé existait — mais il ne
servait que les `input` déclarés numériques (quatre exercices), quand les
cases de la Première sont presque toutes des `math-field` : sur tablette,
c'était le clavier MathLive COMPLET — quatre rangées sur toute la largeur —
qui se déployait pour écrire trois chiffres, et c'est lui que la demande vise.
**Le moteur reste le même texte dans les trois fichiers** (huit fonctions
comparées désormais) ; ce qui diffère vit À CÔTÉ, comme `PAVE_TOUCHES` :
`PAVE_MF`, le sélecteur des cases MathLive confiées au pavé — `math-field.pm-mf`
en Première, où TOUTES ces cases n'attendent qu'un nombre (numérateur,
dénominateur, écriture décimale), et la feuille de calcul libre (`dexp2-mf`),
qui attend des expressions, n'en fait pas partie ; vide en Terminale, qui ne
change pas (la Seconde a suivi la Première, voir ci-dessous). Le contrôle compare `PAVE_MF` à
`tests/profils.js` (`pave.champsMaths`) — deux sources — et tient les deux
bords : la case confiée marquée, la feuille libre jamais, et un niveau qui ne
confie rien qui ne marque aucune case mathématique.
**Une case confiée reçoit la politique « manual »** : MathLive ne déploie plus
son clavier au focus ; elle est posée par le moteur ET par `configureField()`,
parce que les deux greffes ne s'exécutent pas dans un ordre garanti et qu'une
politique posée APRÈS le premier focus arrive trop tard. Le pavé écrit par
`executeCommand` — `insert`, `deleteBackward`, et `commit` pour ⏎, l'événement
`change` que `pmAdapter` traduit en « case suivante » : un ⏎ qui ne ferait
rien sur une case MathLive serait un bouton mort. **Le bouton ⌨️ ouvre toujours
le clavier complet** — la règle « atteignable sur tout écran à champ
mathématique » tient — et tant qu'il est déployé le pavé se tait (deux
claviers à la fois ne s'écrivent pas), puis revient dès qu'on le referme
(`virtual-keyboard-toggle`).
**Puis la Seconde a suivi** (« fais la même chose pour la Seconde »,
septembre 2026) : ses cases `pm-mf` sont toutes des numérateurs, des
dénominateurs ou des écritures décimales — pourcentages, évolutions, les
quatre exercices de fractions guidés —, le même sélecteur les confie au pavé,
sa `configureField()` pose la même politique, sa feuille de styles porte les
mêmes deux formes, et son profil déclare `champsMaths`, `paysage` et `maths`
(la case `#p3` du pourcentage, tapée en contexte tactile). Seule la Terminale
garde `PAVE_MF` vide : ses cases attendent des expressions.
**La FORME est affaire de feuille de styles, propre à la Première et à la
Seconde** : en
portrait la rangée d'avant, en bas, au-dessus des commandes Pause/Abandonner
(elles vivent en bas À DROITE, `#testCtrls`, ce qui interdit de descendre le
pavé plus bas) ; en paysage (`@media (orientation:landscape)`) une grille de
4 rangées × 3 colonnes — 1 2 3 / 4 5 6 / 7 8 9 / 0 , − — posée à droite,
au-dessus des commandes, ⌫ et ⏎ en quatrième colonne sur deux rangées
chacune : les douze touches que la demande nomme font le rectangle, les deux
commandes restent parce que sans ⏎ un élève sur tablette ne validerait plus
et sans ⌫ n'effacerait plus. **La réserve du bas se MESURE sur le pavé rendu**
(`paveCale`) au lieu des 180 px supposés : un rectangle de quatre rangées est
deux fois plus haut qu'une rangée, et la dernière ligne de l'exercice doit
pouvoir remonter au-dessus de lui.
Le banc navigateur mesure les deux orientations au RECTANGLE (une rangée en
portrait ; en paysage douze touches nommées sur quatre rangées et trois
colonnes, à droite, en bas, les commandes à côté, sans recouvrir la case ni
Pause/Abandonner, et une touche qui écrit) et tape la case MathLive dans un
contexte TACTILE (`hasTouch`) — le seul où la politique « auto » ouvrirait le
clavier complet : le pavé s'ouvre, le clavier complet non, la valeur lue par
la page est juste, ⌨️ l'ouvre encore et le pavé se tait puis revient, ⏎ lève
`change`. **Un piège de banc s'y est montré : MathLive lève `input` APRÈS
coup**, jamais dans le tour de la commande — lu tout de suite, le compteur
accusait la page d'un événement manquant (sondé : 0 tout de suite, 3 après
150 ms). On attend avant de compter. Neuf sabotages, chacun rougissant en
nommant son défaut — six au banc jsdom, trois que seul le navigateur voit :
la grille paysage retirée (« 1 rangée × 12 colonnes »), la politique
« manual » retirée des deux greffes (le clavier complet se déploie sur la
tablette et le pavé reste caché), et le pavé qui ignore le clavier complet
(« deux claviers à la fois »).

**Puis le paysage est revenu à UNE rangée** (demande de Turquet, septembre
2026, le même mois : « en Première et Seconde, pour les tablettes, avec les
exercices ayant uniquement des cases avec des nombres à placer, en format
paysage mettre le clavier sur une ligne aussi »). Le rectangle 4 × 3 posé à
droite est RETIRÉ des deux feuilles de styles — plus aucune règle
`@media (orientation:landscape)` sur `#paveNum` — et le pavé est une seule
rangée en bas de l'écran dans les deux orientations, sur les trois niveaux.
Le moteur n'a pas bougé d'un caractère (la forme était affaire de feuille de
styles, et c'est ce qui rend le retour sûr) ; `paveCale` continue de mesurer
la réserve du bas sur le pavé rendu. Le bord qui compte est la GRILLE qui
reviendrait — une règle remise ou oubliée redonnerait quatre rangées à droite
sans qu'aucune classe ne change —, et seul un navigateur le voit : le contrôle
paysage du banc navigateur n'est plus déclaré niveau par niveau (`paysage`
a quitté `tests/profils.js`), il est UNIVERSEL et mesure la rangée en paysage
sur les trois fichiers. Les paragraphes ci-dessus racontent la grille avec
les mots de leur époque ; le sabotage « la grille paysage retirée » a changé
de sens en même temps que la règle — c'est la grille REMISE qui rougit.

**Puis les commandes du bas ont rejoint le pavé** (demande de Turquet,
septembre 2026, Première et Seconde, tablettes : « en mode portrait baisser
les boutons "signaler un problème", "abandonner", "mettre en pause" plus bas
au maximum et baisser aussi le clavier ; en mode paysage, ces boutons moins
larges avec le clavier en ligne sur la même ligne »). Sur un écran tactile
le moteur pose `body.pave-actif` — une classe, pas une requête média, pour
que le banc puisse la forcer comme il force le pavé — et la feuille de
styles du niveau range alors « Signaler », « Abandonner », « Mettre en
pause » au ras du bas (6 px) avec le pavé juste au-dessus en portrait ; en
paysage les trois commandes passent en libellés COURTS (« Signaler »,
« Pause » — deux spans, `.tc-long`/`.tc-court`, rien ne lit le texte de ces
boutons, seuls leurs ids servent), en police et rembourrage réduits, et le
pavé tient sur LEUR ligne, à gauche : sa largeur s'arrête à la leur —
`--ctrls-w`, MESURÉE par `paveCale` et posée sur le pavé, jamais supposée,
les libellés changeant de largeur avec la police — et il défile plutôt que
de les recouvrir si l'écran est trop étroit. La Terminale ne déclare rien
(`pave.commandes` dans `tests/profils.js`) et garde sa mise en page ; le
moteur, lui, reste le même texte dans les trois fichiers.
**Le bord étroit ne s'est vu que sur une capture, à 1024 px** — l'iPad
classique en paysage : avec les libellés entiers resserrés, il ne restait au
pavé que 567 px sur les 703 qu'il demandait, et « − », « ⌫ », « ⏎ »
disparaissaient derrière un défilement que rien ne signalait ; à 1180 px
tout tenait et le banc était vert. D'où les libellés courts, les touches à
40 px et l'espacement réduit en paysage (634 px), et une mesure de plus au
banc navigateur, à 1024 × 768. Tout se mesure au RECTANGLE — la classe
`pave-actif` en place et une règle CSS perdue laisseraient l'écran d'avant.
**Puis Turquet l'a vu défiler quand même, sur SA tablette** (« le clavier
numérique doit être plus large pour afficher toutes les touches »). La mesure
à 1024 px tenait de JUSTESSE, et deux choses la faisaient basculer hors du
banc : les tablettes Android font souvent 960 px de large en paysage (1280
pixels à 1,33), et la police réelle des boutons — que le banc n'attend pas —
les élargit. Le premier jet bornait la largeur du pavé à celle qui restait à
côté des commandes (`--ctrls-w`, mesurée par le moteur) et le laissait
DÉFILER : c'était choisir le mauvais côté. **Le pavé ne défile plus jamais**
— toutes ses touches se voient, c'est ce qui fait qu'un élève peut écrire —,
il garde sa largeur entière (634 px), et ce sont les COMMANDES qui cèdent,
par paliers de requête média : sous 1024 px elles ne gardent que leur icône
(⚑ ✕ ⏸, avec `aria-label` et `title`), un peu plus grande ; sous 820 px la
ligne ne peut plus porter les deux et le pavé repasse AU-DESSUS des
commandes, comme en portrait. La mesure `--ctrls-w` du moteur n'avait plus
de lecteur : retirée — un garde-fou sans lecteur fait croire qu'on tient
quelque chose. Le banc navigateur mesure désormais QUATRE largeurs de
paysage — 1180, 1024, 960 et 853 (pavé entier, sans défilement, sur la
ligne des commandes) et 800 (pavé entier au-dessus). **Et le premier
sabotage est resté VERT** : le palier des icônes retiré, à 960 px les
libellés courts tenaient encore à côté du pavé — avec la police de REPLI du
banc, qui coupe les polices distantes ; c'est la police réelle qui les
élargit chez Turquet. Le sabotage n'atteignait pas ce qu'il visait, la leçon
du sabotage impossible : le banc mesure aussi à 853 px (une tablette Android
8 pouces, 1280 pixels à 1,5), où les libellés courts ne peuvent plus tenir
quelle que soit la police, et là le palier retiré rougit en nommant le
recouvrement.

**Puis le pavé est devenu AUSSI LARGE QUE L'ÉCRAN LE PERMET.** La demande
d'origine (Turquet, septembre 2026) disait « en mode paysage, faire en sorte
que le clavier soit le plus large possible en fonction de la définition de
l'écran » ; elle n'avait été servie qu'à MOITIÉ — « toutes les touches se
voient » (le pavé ne défile plus, les commandes cèdent) — et le pavé gardait
une largeur FIXE de 634 px sur toutes les tablettes, la moitié de l'écran
restant vide à 1180 px. Deux choses, et n'en tenir qu'une ne tient rien : la
BOÎTE s'étire (ses deux bords posés, `left` ET `right`, au lieu d'une largeur
de contenu) et les TOUCHES grandissent avec elle (`flex`) — une boîte étirée
dont les touches restent à 40 px laisse le vide DANS le pavé, et la boîte,
elle, s'étire de toute façon : c'est la touche RENDUE qu'il faut mesurer, pas
le rectangle du pavé.
**Le bord droit est celui des commandes, et il est MESURÉ** : là où elles
partagent la ligne du pavé (Première et Seconde), `paveCale` écrit leur
largeur dans `--ctrls-w` et la feuille de styles la lit — leurs libellés
changent de largeur avec la police, et la supposer était précisément ce qui
avait fait défiler le pavé sur la tablette de Turquet. La mesure avait été
retirée un mois plus tôt faute de lecteur ; elle revient AVEC son lecteur, et
le contrôle exige les deux — un lecteur sans mesure étirerait le pavé
par-dessus les commandes, une mesure sans lecteur serait un garde-fou mort de
plus. La Terminale, qui ne range pas ses commandes avec le pavé, prend toute
la largeur de l'écran.
**Le plafond est l'autre bord** : les touches s'arrêtent à 80 px et la rangée
se CENTRE au-delà — sans lui, un très grand écran ferait des barres et non des
touches. Il vit dans `tests/profils.js` (`pave.largeurPaysage`), deux sources.
**Et la ROTATION remesure**, sans qu'on quitte la case : l'écouteur du moteur
(le même texte dans les trois fichiers) rappelle `paveCale` tant que le pavé
est ouvert. Ce garde-là est né MORT et le sabotage l'a montré : le premier
contrôle tournait de 1600 à 1024 px, où l'écart de largeur des commandes
passait sous la tolérance — il restait vert. Refait d'un écran à ICÔNES vers
un écran à libellés (853 → 1366 px), c'est-à-dire dans le sens où les
commandes S'ÉLARGISSENT, il nomme le défaut : « il recouvre les commandes ».
Deux bancs, la répartition habituelle : jsdom lit les règles `@media` du
fichier (la boîte étirée, le `flex` des touches, le plafond comparé au profil,
la mesure et son lecteur — la MESURE, pas le commentaire qui la nomme : un
premier sabotage retirait l'écriture en gardant le commentaire, et le contrôle
restait vert en parlant d'autre chose), et le NAVIGATEUR mesure la rangée
RENDUE à 1180, 1024, 960, 853 et 800 px (elle va jusqu'au bord libre, les
touches ont grandi), la croissance elle-même (plus larges à 1180 qu'à 853 —
le bord qui attrape un pavé revenu à sa largeur fixe), le plafond à 1600 px
et la rotation. Huit sabotages, chacun rougissant en nommant son défaut.

**La touche « ⏎ » du clavier à l'écran VALIDE — et en paysage, le clavier
tient sur DEUX rangées.** Signalé par Turquet (septembre 2026) sur le 2.2.9
de la Première : « la touche valider ne fonctionne pas et ne permet pas de
passer à la ligne ». La touche « ✓ » du clavier de la Première ne faisait
que CACHER le clavier (`hideVirtualKeyboard`) : sur tablette, l'élève
croyait valider et rien ne se passait — un bouton mort, sans erreur, sur la
seule touche qui ressemblait à « Entrée ». Elle est devenue « ⏎ » et exécute
`commit`, la commande qui lève l'événement `change` : `mlFeuille` y ajoute
une ligne (c'est ainsi qu'Entrée au clavier physique passait déjà à la
ligne), `pmAdapter` y passe à la case suivante — la même touche que porte
le clavier de la Terminale depuis toujours. Il n'y a plus de touche qui
cache : sur tablette le clavier se referme en quittant la case (politique
« auto »), et ⌨️ le bascule.
**Puis « en mode paysage, le clavier doit prendre moins de place en hauteur,
plus de touches sur une même ligne »** (même message) : `buildKbTerm(vars,
compact)` rend une forme COMPACTE à deux rangées — les chiffres de 1 à 0
avec la virgule et ⌫ sur la première, les opérations, les parenthèses, =, %,
les flèches et ⏎ sur la seconde — soit 132 px de plaque contre 232 pour les
quatre rangées, mesuré à 1024 × 768. La forme se DÉCIDE dans une seule
fonction (`kbCompact` : clavier ANCRÉ et orientation paysage), et
`applyKbLayout` la mémorise dans sa clé : une rotation (`kbOnRotate`
réapplique avant de reconstruire), un changement d'exercice ou un rendu
reprennent la bonne forme. La fenêtre flottante de l'ordinateur — toujours
« en paysage » — garde ses quatre rangées : c'est pourquoi `setupKeyboard`
choisit flottant ou ancré AVANT d'appliquer la première forme. Deux bancs :
jsdom ÉVALUE les deux formes depuis la source — la touche ⏎ qui commit sur
chaque couche de chaque forme, aucune touche qui ne fait que cacher, le
nombre de rangées déclaré (`clavierEcran.paysage.rangees` dans
`tests/profils.js`, deux sources), le MÊME jeu de touches d'une forme à
l'autre (une touche perdue serait intapable dans une orientation, sans
erreur) — et la table de routage elle-même, `kbCompact` + `applyKbLayout`
évaluées sur un faux clavier dans les trois cas (ancré paysage, ancré
portrait, flottant). Le NAVIGATEUR (« 11 quinquies ») ouvre la synthèse
rédigée des hausses sur
une tablette tactile en paysage, compte les rangées RENDUES, exige des
touches d'au moins 36 px sans débord, CLIQUE la vraie touche ⏎ — une ligne
de plus, le curseur dedans, le clavier toujours là — puis tourne en portrait
où les quatre rangées reviennent. Huit sabotages, chacun rougissant en
nommant son défaut — sept en jsdom (⏎ redevenu « cacher », ⏎ ou % absent
de la forme compacte, trois rangées, `kbCompact` toujours faux, la fenêtre
flottante oubliée, le portrait visé), et un que seul le navigateur voit :
`kbOnRotate` qui ne réapplique plus la forme — « 2 rangée(s) rendue(s) en
portrait », jsdom restant vert à bon droit. La Seconde porte le même
clavier, avec le même « ✓ » : elle n'est pas dans la demande et n'est pas
touchée — le dire vaut mieux que le taire.

**Puis, en PORTRAIT sur une tablette, le clavier tient sur TROIS rangées.**
Demande de Turquet (septembre 2026), sur les pourcentages de la Première :
« sur les tablettes, pour le clavier virtuel en mode portrait, fais en sorte
que le clavier tienne sur 3 lignes au lieu de 4 ». Le paysage avait sa forme
compacte ; debout, la plaque reprenait ses quatre rangées et 232 px — 23 % de
l'écran d'une tablette, avant même l'énoncé. `buildKbTerm(vars, compact,
portrait)` rend une TROISIÈME forme, `prem-portrait` : 182 px, 18 % de
l'écran, mesurés à 768 × 1024. Les chiffres y GARDENT leurs colonnes — 7 8 9,
4 5 6, 1 2 3 : l'élève qui tourne sa tablette retrouve le même pavé, et c'est
la seule chose qu'une rangée en moins pouvait lui coûter. Ce qui tenait sur la
quatrième rangée remonte : les parenthèses à côté de la fraction, les flèches à
côté des opérations, et le 0 rejoint le 1 2 3 avec la virgule, le `=`, le `%`
et le `⏎`. La forme se décide dans `kbPortraitTablette`, à côté de `kbCompact`
et sur le même patron : clavier ANCRÉ, hors paysage, et l'écran tactile d'au
moins 600 px qui définit la tablette dans TOUTE la page (la police, la chaîne
à nombres, la feuille de calcul). Un TÉLÉPHONE en portrait garde donc ses
quatre rangées — huit touches sur une rangée de 390 px ne se toucheraient
plus —, et la fenêtre flottante de l'ordinateur les garde aussi.
Les deux bancs suivent. jsdom ÉVALUE la troisième forme depuis la source : le
nombre de rangées déclaré (`clavierEcran.portraitTablette` dans
`tests/profils.js`, deux sources), le MÊME jeu de touches que la forme normale,
le `⏎` qui commit sur sa couche — et les QUATRE cases de la table de routage,
là où il y en avait trois : paysage, portrait de TABLETTE, portrait de
TÉLÉPHONE, fenêtre flottante. Son faux écran répond désormais à deux requêtes,
l'orientation et la largeur minimale, et ne répond rien aux autres : un routage
qui s'appuierait sur autre chose se verrait. Le NAVIGATEUR (« 11 quinquies »)
tourne la tablette en portrait, compte les rangées RENDUES, exige des touches
d'au moins 36 px sans débord, puis RÉTRÉCIT la fenêtre à la taille d'un
téléphone où les quatre rangées reviennent — et lui REND sa largeur de tablette
avant de continuer, sans quoi le contrôle suivant mesurait la feuille de calcul
sur un téléphone et rougissait sur une page juste : c'est arrivé au premier
essai, et c'est le genre de détour qui laisse une section verte mesurer autre
chose que ce qu'elle nomme. Six sabotages, chacun rougissant en nommant son
défaut — cinq en jsdom (une quatrième rangée dans la forme portrait, le `%`
retiré, le `⏎` redevenu « cacher », la forme courte qui fuit sur le téléphone,
la forme portrait jamais construite), et le dernier repris au navigateur
(`kbPortraitTablette` toujours faux : « 4 rangée(s) rendue(s) en portrait »,
plaque revenue à 232 px). Le contrôle jsdom a changé de nom avec sa portée —
« le clavier ancré tient sur moins de rangées avec les mêmes touches » —, et la
phrase du paragraphe précédent, « puis tourne en portrait où les quatre rangées
reviennent », raconte le banc d'avant ce jour-là.

**Puis la Seconde, le jour même : « fais pareil pour la Seconde ».** Son
clavier était le même à la lettre près — jusqu'aux couches nommées
`prem-base` et `prem-paysage` — et il reçoit la même troisième forme, la
même `kbPortraitTablette`, la même déclaration
`clavierEcran.portraitTablette` dans son profil : 182 px de plaque contre
232, mesurés sur la feuille du 4.5. Les cinq sabotages de jsdom ont été
rejoués sur elle, et rougissent de même. Ce qui distingue les deux niveaux
reste ce qui les distinguait : la Première s'installe en plein écran, la
Seconde garde la barre de navigation d'Android. La TERMINALE, ce jour-là,
n'était pas dans la demande — elle l'a été le lendemain, au paragraphe
suivant ; elle reste le seul niveau sans forme compacte en PAYSAGE.

**Et la TERMINALE, le lendemain : « fais pareil pour la terminale ».** Elle ne
pouvait pas recevoir le même correctif à la lettre, et c'est le chiffre qui l'a
dit : son **clavier A fait TRENTE unités** — la Première et la Seconde n'en ont
que vingt-trois. Sur trois rangées il en faut **dix par rangée**, or la règle de
la tablette donnait aux touches un HUITIÈME de la largeur, et le fichier disait
déjà pourquoi : « la rangée la plus chargée en compte huit, et sans cela elle se
rétrécirait SEULE ». Deux sorties se présentaient — des touches plus étroites,
ou déménager six unités du clavier A vers le clavier B. **Turquet a choisi les
touches plus étroites** : aucune touche ne bouge, l'élève retrouve le clavier
qu'il connaît. Une règle média de plus, `(pointer:coarse) and (min-width:600px)
and (orientation:portrait)`, pose `--keycap-width` sur DIX unités : la touche
passe de 92 à **74 px de large** sur une tablette de 820, la hauteur (48 px) et
la police (24 px) ne bougent pas. Le PAYSAGE n'est pas concerné — il garde ses
quatre rangées de huit unités, et sa largeur y est de toute façon plafonnée à
96 px. `buildKbTerm(vars, portrait)` décrit désormais ses touches **une seule
fois**, dans un objet `K`, et les deux formes s'y composent ; les deux couches
gardent leurs identifiants d'une forme à l'autre, si bien que « clavier A » et
« clavier B » basculent sans rien savoir de la forme. En portrait, le clavier A
tient sur `7 8 9 / e √ ( ) exposant ⌫`, puis `4 5 6 × ln − + = ← →`, puis
`1 2 3 0 , espace ⏎ clavierB` ; le clavier B sur les variables + ∞ ⟶ ⌫, puis
∫ π ∈ indice sin cos tan espace, puis arcsin arccos arctan clavierA ← → ⏎.
Le contrôle des deux couches mesure maintenant les DEUX formes — comptes de
rangées, partage `surA`/`surB`, place des variables, largeur maximale, et le
MÊME jeu de touches d'une forme à l'autre —, plus les quatre cases de la table
de routage (tablette debout, tablette couchée, téléphone, fenêtre flottante).
Le faux écran des contrôles de forme est devenu commun aux deux familles de
clavier (`fauxEcran`) : il honore l'orientation, la largeur minimale et le
tactile, et ne répond rien à une requête inconnue.
**Un sabotage a rougi l'idée que je me faisais du rendu, et c'est le meilleur
moment de ce correctif.** Retirer la règle CSS des dix unités ne faisait pas
déborder le clavier : MathLive **resserre tout seul** la rangée trop large — la
touche « 5 » passait de 74 à 77 px — et laisse les autres rangées à 96 px. Le
contrôle du navigateur, qui ne mesurait qu'UNE touche, restait vert sur une
page fautive : deux tailles de touches sur le même écran, exactement ce que la
règle du fichier interdit. Il mesure donc maintenant DEUX touches d'une unité
posées sur des rangées DIFFÉRENTES du clavier B (∞ et π) et les exige égales —
sans la règle, ∞ fait 92 px et π 87. Huit sabotages en tout, chacun rougissant
en nommant son défaut : six en jsdom (une quatrième rangée en portrait, une
rangée de onze unités, le `ln` retiré, le `=` sorti du clavier A, la forme
courte qui fuit partout, la forme portrait jamais appliquée) et deux que seul
le navigateur voit (`kbOnRotate` qui ne réapplique plus la forme — « 3 rangée(s)
rendue(s) en paysage au lieu de 4 » — et la règle CSS retirée). Les trois
niveaux ont maintenant leur forme de portrait.

**Sur tablette, la feuille de calcul libre écrit plus petit.** Demande de
Turquet (septembre 2026), toujours sur le 2.2.9 : « la case d'édition du
calcul peut-elle avoir une police plus petite ». La feuille (`.dexp2-sheet`,
partagée par le 2.1.7, le 2.2.10 et le 2.3.9) écrit à 2 rem : une ligne
faisait 55 px de haut sur un écran que le clavier réduit déjà. Sous la
requête média de la tablette — la même que la police de la page, écran
tactile d'au moins 600 px — elle passe à 1,4 rem (20 px rendus, une ligne
de 40 px), et le PRÉFIXE suit : une case a la taille des nombres qui
l'entourent, sur tablette aussi. La valeur vit dans `tests/profils.js`
(`feuilleTablette`, deux sources). jsdom exige la règle sous cette requête,
à cette valeur, plus PETITE que la taille normale — une règle qui ne réduit
rien passerait sinon ; le navigateur (« 11 quinquies ») mesure la police
RENDUE de cette feuille sur la tablette et l'exige plus petite que sur
un ordinateur ouvert au même exercice — une règle qui réduirait partout ne
serait pas la règle demandée. Cinq sabotages, chacun rougissant en nommant
son défaut — et le premier essai du contrôle a rougi sur une page JUSTE :
son expression régulière coupait le bloc `@media` à la première accolade
fermante, et cherchait ensuite une accolade qui n'y était plus. Un essai
faux se reconnaît à ce qu'il rougit sur du code juste ; c'est le contrôle
qui a été corrigé.
**Puis la Seconde a suivi** (« même chose en Seconde », Turquet, septembre
2026) : elle portait le même clavier avec le même « ✓ » qui cache, et la
même feuille (4.5, 4.7, 4.9 et la synthèse). `buildKbTerm`, `kbCompact` et
`applyKbLayout` y sont recopiés au caractère près depuis la Première (le
portage l'a vérifié), la règle de la feuille aussi, et le profil déclare
`clavierEcran` et `feuilleTablette` — le banc navigateur y mesure le 4.5,
dont la première ligne porte la somme de l'énoncé en préfixe : c'est
précisément là que « le préfixe suit la même taille » se voit. Seule la
Terminale garde son clavier à deux couches et sa feuille à 2 rem.

**La touche « = » est sur le clavier mathématique à l'écran** (demande de
Turquet, septembre 2026 : « dans le clavier qui apparaît sur les tablettes il
manque le = »). Aucun des trois claviers virtuels (`buildKbTerm`) ne la
portait, et la greffe coupe le clavier du SYSTÈME sur chaque champ
mathématique (`inputmode="none"`) : sur tablette, une égalité était
INTAPABLE — dans les rédactions, c'est le caractère central — et rien ne
cassait nulle part. Le pavé numérique compact, lui, ne la reçoit PAS : ses
cases attendent des nombres seuls, un « = » y écrirait une réponse fausse —
la doctrine du bouton qui ne sert pas. Le contrôle ÉVALUE `buildKbTerm`
depuis la SOURCE de chaque fichier (le clavier vit dans la greffe module,
invisible à jsdom) et balaie TOUTES ses couches — un clavier presque vide se
signale au lieu de passer : un contrôle qui n'a rien à mesurer le dit. Le
banc navigateur CLIQUE la touche rendue sur le 6.7, avec ≤ ≥ < et > — « = »
en premier, parce que cliqué après « > » un raccourci pourrait les fondre en
≥ et la mesure parlerait d'autre chose. Trois sabotages, un par fichier,
chacun rougissant en nommant son défaut.

**Sur un TÉLÉPHONE en portrait, les touches du clavier mathématique sont
RÉDUITES — et ses deux couches se nomment « clavier A » et « clavier B ».**
Demande de Turquet (septembre 2026) : « sur les portables, pour tous les
exercices qui utilisent le même clavier que celui de l'exercice 6.2, au
format portrait, réduire la taille des touches ; écrire "clavier B" pour la
touche "fn" et "clavier A" pour la touche "123" ». Le clavier du 6.2 est
celui de TOUS les champs mathématiques de la Terminale (`buildKbTerm` — seule
sa première rangée varie avec l'exercice) : la règle vaut donc partout d'un
coup, et la Seconde comme la Première, dont le clavier n'a qu'une couche, ne
sont pas concernées.
**Un téléphone, pas une tablette** : la règle est une requête média
`(orientation:portrait) and (max-width:600px)` — un iPad mini en portrait
fait 768 px — posée sur le clavier ANCRÉ (`body > .ML__keyboard`), jamais
sur la fenêtre flottante de l'ordinateur, le périmètre de la règle du
paysage. Mesuré sur 390 × 844 : la touche passe de 55 à 34 px de haut, sa
police de 21,5 à 17 px, le clavier de 35 % à 22 % de l'écran ; sur une
tablette (820 px) rien ne change, 58 px et 30 px.
**Un piège de MathLive s'y est montré, et il vaut pour la règle du paysage
aussi** : `--keycap-max-width` n'est lu QUE lorsque `--keycap-width` n'est
pas posée — or la page la pose sur `:root`. La règle du paysage écrit donc
un `--keycap-max-width:46px` qui ne fait rien ; celle du portrait règle
`--keycap-width` directement (`min(48px, …)`).
**Et le libellé était COUPÉ, ce qui ne s'est vu qu'au banc** : MathLive
rembourre chaque touche de 12 px de chaque côté, si bien que « clavier B »
(49 px de texte à 11 px) n'avait que 45 px de place dans une touche d'une
unité et demie sur le téléphone, et 70 px pour 72 de texte à 16 px dans la
fenêtre de l'ordinateur — jsdom, qui lit la disposition, n'y voyait rien.
Les deux touches font DEUX unités (le banc jsdom l'exige, deux sources : les
mots vivent dans `tests/profils.js`, `clavierEcran`) et le rembourrage
horizontal de leur classe `kb-couche` est ramené à 4 px — celui-ci n'est
qu'une MARGE : sans lui, la rangée la plus chargée (le 6.7, dix unités que
le navigateur RÉTRÉCIT pour tenir dans les 390 px) laisse encore 52 px pour
49 de texte, et le sabotage qui le retire reste vert à bon droit.
**Deux bancs, la répartition habituelle.** jsdom ÉVALUE `buildKbTerm`
depuis la source (comme pour la touche « = ») : la touche qui MÈNE à la
seconde couche dit « clavier B », celle qui en REVIENT dit « clavier A » —
deux libellés échangés enverraient l'élève au clavier qu'il quitte sans
qu'aucune touche ne manque —, aucune ne dit plus « fn » ni « 123 », et la
largeur est de deux unités. Le NAVIGATEUR (« 11 ter », déclaré par
`clavierEcran.portrait`) ouvre le 6.2 à la taille d'un téléphone, déploie
le clavier, mesure la touche « 5 » RENDUE contre les plafonds du profil
(36 px, 18 px), vérifie que « clavier B » tient dans sa touche
(`scrollWidth`), la CLIQUE — les chiffres disparaissent —, clique
« clavier A » — ils reviennent —, puis élargit la fenêtre à la taille d'une
tablette et exige que les touches REGRANDISSENT : une règle qui réduirait
partout ne serait pas la règle demandée. Le contrôle du 6.7 à 1280 px mesure
en plus le libellé dans la fenêtre flottante. Un piège de mesure : le
clavier ancré occupe TOUTE la fenêtre (son fond), sa hauteur utile est celle
de la plaque des touches (`.MLK__plate`). Huit sabotages : sept rougissent
en nommant leur défaut, le huitième (le rembourrage) reste vert et dit vrai.

**Puis le clavier de la Terminale s'est partagé en deux couches lisibles, et
ses touches ont maigri sur tablette.** Demande de Turquet (septembre 2026), sur
le clavier du 6.9 : « faire passer les touches U.., n, inf, --> et l'intégrale
sur le clavier B ; je veux qu'il y ait une ligne en moins dans le clavier A ; et
réduire légèrement la taille des touches ». Le clavier A garde les NOMBRES et les
OPÉRATIONS — quatre rangées au lieu de cinq — et le clavier B porte les
VARIABLES de l'exercice, ∞, ⟶ et l'intégrale, à côté des fonctions qu'il avait
déjà. Le « = » descend d'une rangée pour faire place à la bascule.
**La rangée des variables est la même pour tous les exercices de la Terminale**
(`buildKbTerm` — seule cette rangée varie, par `kbVarsFor`) : la déplacer déplace
donc aussi les ≤ ≥ < > du 6.7, qui restent sur le clavier à l'écran mais une
touche plus loin. C'est la conséquence assumée d'« une ligne en moins », et le
banc navigateur du 6.7 bascule désormais au milieu de sa mesure — il clique
« = » sur A, « clavier B », puis les quatre inégalités.
**Huit unités par rangée au plus, et ce n'est pas une coquetterie** : la règle de
la tablette donne aux touches la largeur de l'écran divisée par HUIT, et une
rangée plus large se rétrécirait SEULE — le clavier aurait deux tailles de
touches sur le même écran. Le maximum vit dans `tests/profils.js`
(`clavierEcran.couches`), avec les comptes de rangées, les touches qui doivent
être sur B et celles qui doivent RESTER sur A : sans ce dernier bord, déménager
les chiffres eux aussi passerait au vert.
**Les touches réduites sont une règle de plus, au même périmètre que les deux
précédentes** : le clavier ANCRÉ (`body > .ML__keyboard`), jamais la fenêtre
flottante de l'ordinateur, sous la borne de la tablette (600 px, celle de la
police de la page). 58 px de haut et 30 px de police deviennent 48 et 24 — et le
contrôle jsdom exige que ces valeurs RÉDUISENT vraiment, comparées au réglage
général : une règle qui reprendrait la taille d'origine ne réduirait rien.
Deux bancs, la répartition habituelle : jsdom ÉVALUE `buildKbTerm` depuis la
source avec des variables RECONNAISSABLES et regarde où chaque touche tombe ; le
NAVIGATEUR (« 11 sexies », déclaré par `clavierEcran.tablette`) ouvre le 6.9 sur
une tablette tactile, compte les rangées RENDUES, mesure la touche « 5 », exige
que ∞, ∫ et n aient quitté le clavier A — puis CLIQUE « clavier B » et exige de
les y trouver. Un piège de banc s'y est montré : la touche de bascule ne porte
pas la classe « keycap » de MathLive, et le sélecteur qui la manquait faisait
échouer la mesure du 6.7 sur une page juste — on cherche parmi les enfants
DIRECTS des rangées. Huit sabotages, chacun rougissant en nommant son défaut.
**Et ce contrôle a rougi UNE fois sur trois exécutions, sans que la page ait
changé** (« encore sur le clavier A : n », septembre 2026) — sous forte
charge : trois bancs et deux campagnes de sabotage tournaient en même temps
sur la machine. Dix ouvertures isolées du 6.9 sur tablette n'ont rien
reproduit : la couche visible portait ses 28 touches, sans n. Le banc mesurait
à DÉLAI FIXE — 700 ms après le clic dans la case —, c'est-à-dire ce qui se
trouvait là à cet instant, un clavier en cours de (re)construction compris.
Il attend désormais un clavier STABLE (la couche visible garde le même jeu de
touches d'un quart de seconde au suivant, six secondes au plus, et il le DIT
si elle n'y arrive pas) et ne lit que la couche que MathLive déclare visible
(`.MLK__layer.is-visible`), jamais tout ce qui a un rectangle. La cause
exacte n'est pas établie — le dire vaut mieux que de le taire — ; ce qui est
établi est qu'un contrôle intermittent parle d'autre chose que de la page, et
qu'un délai fixe est la première chose qu'une machine chargée fait mentir.

**Puis la TABLETTE COUCHÉE a pris la forme courte, et un exercice sur les
limites a rendu ses quatre touches au clavier A.** Demande de Turquet
(septembre 2026) : « en terminale sur une tablette, pour le clavier virtuel de
l'exercice 2.2, mais qui est sans doute utilisé ailleurs aussi, en mode
paysage, les touches doivent être plus petites de façon à tenir sur 3 lignes.
Quand c'est un exercice sur les limites, mettre les touches "inf" ; "-->" ;
"x" ; "f" sur le clavier A. » Deux demandes, et la seconde a décidé de la
forme que prend la première.
**LA MESURE A ÉTÉ FAITE AVANT DE TOUCHER À QUOI QUE CE SOIT, et elle a élargi
le signalement** : le clavier de la Terminale est celui de TOUS ses champs
mathématiques (seule sa rangée de variables change avec l'exercice), donc le
2.2 n'est qu'une porte d'entrée. Couchée, la plaque de quatre rangées faisait
**208 px sur un écran de 768 — plus d'un quart** de ce que l'élève a devant
lui, quand elle en prend 156 debout ; après, 132 px, soit 16 à 17 %. La forme
COURTE à trois rangées existait déjà pour le portrait depuis la demande du
mois précédent : elle sert maintenant la tablette DEBOUT COMME COUCHÉE
(`kbPortraitTablette` est devenue `kbTablette`), et la règle CSS du paysage ne
touche que la HAUTEUR et la POLICE — 48 px et 24 px deviennent 40 et 20 : en
paysage la largeur ne manque pas, c'est l'écran qui est COURT.
**Un TÉLÉPHONE COUCHÉ y gagne plus que la tablette, et ce n'était pas
demandé** : à 844 × 390 il est « large d'au moins 600 px », donc il prend la
forme courte lui aussi — sa plaque passe de 208 px à 132, de 53 % de l'écran
à 34 %. Le dire vaut mieux que de le taire : c'est une conséquence de la
borne, pas un cas traité.
**LES QUATRE TOUCHES DES LIMITES SONT LA RANGÉE DES VARIABLES, et elle revient
d'où elle était partie** : f, x, ∞ et ⟶ vivaient en tête du clavier A jusqu'en
septembre 2026, où « une ligne en moins dans le clavier A » les a envoyées sur
le B. Sur un exercice sur les limites — là où l'on écrit « x ⟶ +∞ » à chaque
ligne — elles reviennent sur A, et le clavier B perd sa première rangée, le ⌫
qu'elle portait passant sur la suivante. **Le JEU de touches ne change pas
d'une variante à l'autre, seul son PARTAGE change**, et le contrôle compare
les jeux : 43 touches des deux côtés, dans les quatre formes.
**LA PAGE NE TIENT AUCUNE LISTE D'EXERCICES** : `kbLimites` lit le THÈME
auquel l'exercice appartient (et l'identifiant qui nomme lui-même la limite),
si bien qu'un exercice ajouté demain au thème des limites est couvert sans
rien déclarer. Le prix de cette souplesse est qu'un thème RENOMMÉ ferait
repartir ∞ sur le clavier B en silence : des témoins déclarés dans
`tests/profils.js` l'attrapent — et le bord OPPOSÉ avec eux, trois exercices
qui ne sont PAS sur les limites et doivent garder le clavier d'avant.
**ET C'EST LA LARGEUR DES TOUCHES QUI A DÛ CHANGER DE SOURCE.** Le clavier A
n'a plus une taille mais quatre : 8 unités par rangée sur la forme normale,
10 sur la courte, 9 et 12 avec les variables revenues. Or la feuille de styles
RECOPIAIT ce compte (`(100cqw - 32px) / 8`, `/ 10`), et une rangée plus large
que ce que la largeur prévoit se rétrécit SEULE dans le navigateur — l'élève
aurait eu deux tailles de touches sur le même écran, la leçon déjà payée en
septembre. La page POSE donc `--kb-unites` depuis la disposition qu'elle vient
d'installer (`kbUnites` : la rangée la plus large), et une formule unique
(`--keycap-auto`) s'y règle : une source, pas une liste — la règle de largeur
propre au portrait de tablette a disparu avec le compte qu'elle portait.
**Le coût est mesuré et nommé** : sur un TÉLÉPHONE les touches passent de
45 px à 41 px de large, parce que la formule compte enfin les 8 unités réelles
de la rangée la plus chargée au lieu de 7. La rangée y tenait par chance ;
elle tient maintenant par construction.
**UN PIÈGE DE BANC s'y est montré** : la touche ⟶ (`\longrightarrow`) est une
flèche ÉTIRABLE, que MathLive dessine en morceaux — son `textContent` est
VIDE. Le banc navigateur, qui reconnaissait ses touches au texte, cherchait une
touche bien présente et disait qu'elle manquait ; il lit aussi
`data-keycap-value` désormais. Aucun contrôle ne pouvait le voir avant, ⟶
n'ayant jamais été cherchée nommément.
**Dix-huit sabotages, chacun rougissant en nommant son défaut** — quinze au
banc jsdom (le paysage revenu aux quatre rangées, la forme courte qui fuit sur
le téléphone, la variante des limites jamais demandée par `applyKbLayout`, ∞
resté sur le clavier B, les variables restées sur B, le ⌫ parti du clavier B,
`kbLimites` qui ne reconnaît plus son thème, qui ne lit plus l'identifiant, qui
dit oui partout, `--kb-unites` jamais posée, `kbUnites` qui rend la première
rangée au lieu de la plus large, une règle de largeur revenue à un compte en
dur, la règle CSS du paysage retirée, la même qui ne réduit rien, une rangée de
treize unités) et trois que seul le NAVIGATEUR voit : la règle du paysage
retirée (« touche « 5 » : 92×48 px, plaque 156 px »), la variante des limites
débranchée (« manque sur le clavier A : ∞ ⟶ f x ») et `--kb-unites` figée à
dix, où la rangée de douze se rétrécit seule.
**QUATRE D'ENTRE EUX SONT D'ABORD RESTÉS VERTS, et chacun a nommé un trou du
CONTRÔLE plutôt qu'un défaut de la page.**
· **Le FAUX ÉCRAN du banc modélisait un téléphone comme « pas tactile »** : il
  répondait `pointer: coarse` en même temps que `min-width`, si bien qu'un
  routage qui aurait cessé de regarder la LARGEUR restait vert — le téléphone
  du banc n'était coarse pour personne. Un téléphone est tactile ET étroit, une
  tablette tactile et large : les deux réponses sont séparées, et le sabotage
  rougit (« téléphone ancré en portrait : 3 rangée(s) au lieu de 4 »).
· **Le ⌫ retiré du clavier B ne perdait aucune touche** — il est aussi sur le
  clavier A, donc le JEU restait complet et la comparaison des jeux disait vrai.
  Mais l'élève qui écrit sur le B devrait changer de couche pour reprendre une
  lettre : la propriété que le sabotage cassait n'était tenue nulle part. Chaque
  COUCHE porte de quoi effacer, désormais, et le contrôle l'exige.
· **La moitié « thème » de `kbLimites` n'était mesurée par personne** : les
  quatre témoins déclarés portaient tous « limite » dans leur identifiant, donc
  la première ligne de la fonction répondait avant elle. `equation-droite-h-v`
  (le 3.1) est le témoin qui l'éprouve — son identifiant ne dit rien de la
  limite, seul son thème le dit —, et `suite-tcm-limite` éprouve l'autre moitié,
  puisqu'il vit dans le thème des Suites. Un contrôle qui n'a rien à mesurer ne
  mesure rien.
· **Et « la rangée de douze se rétrécit seule » se mesure DEBOUT, pas
  couché** — c'est le seul des quatre dont le vert disait VRAI. Mesuré plutôt
  que supposé : en PAYSAGE, un `--kb-unites` figé trop bas ne fait pas deux
  tailles de touches, MathLive resserrant la plaque ENTIÈRE — toutes les
  touches à 92 px —, et le plafond de 96 px absorbe l'écart. En PORTRAIT la
  largeur mord : les rangées de onze font 70 px et celle de douze 64, deux
  tailles sur le même écran. Le contrôle tourne donc la tablette avant de
  mesurer ce bord-là, et le sabotage rougit en nommant l'écart. Un sabotage
  qui reste vert à la largeur où rien ne peut le voir parle d'autre chose —
  la leçon du sabotage impossible, à une orientation près.

**Une case où l'élève écrit une LIMITE est un champ mathématique — le clavier
du 3.5.** Demande de Turquet (septembre 2026) : « en terminale, pour les cases
où on doit déterminer des limites, je veux le même clavier que dans l'exercice
3.5 ». Le 3.5 rédige dans la feuille MathLive, donc le clavier à l'écran — ∞ et
⟶ sur son clavier A — s'y ouvre ; les cases de limite, elles, étaient des
`<input>` de TEXTE, où aucun clavier mathématique ne sait écrire : sur tablette
c'est le clavier du SYSTÈME qui s'ouvrait, une demi-page pour écrire « +∞ », et
le symbole ne s'atteignait que par le petit bouton d'à côté.
**UN SEUL ENDROIT, ET IL NE CONNAÎT AUCUN EXERCICE** : une case de limite est
une case jugée par `lgLimOK` — le juge des limites, partagé depuis le 3.2 —, et
toutes passent par `limHTML` / `limLire`. Le contrôle tient ce bord sur la
SOURCE : **aucun appel à `lgLimOK` ne lit un « .value »**, la signature d'un
champ de texte, si bien qu'un exercice ajouté demain qui lirait une limite dans
un `<input>` rougit sans rien avoir à déclarer.
**LE PÉRIMÈTRE EST CELUI DU JUGE, et il traverse trois thèmes** : le 3.2, le 3.3
(ses sous-questions ET les valeurs de son tableau de variation), le 3.4, puis le
4.6 et le 6.14, qui posent une limite HORS du thème des limites. Les limites
FINIES que d'autres exercices font taper en nombre (le ℓ du 6.12, par exemple)
restent dehors : elles ne passent pas par `lgLimOK`, aucun ∞ ne s'y écrit, et
étendre le périmètre à « tout ce qui s'appelle une limite » aurait demandé une
liste. C'est un arbitrage nommé, pas un oubli.
**LE CLAVIER SUIT LES CASES, PLUS SEULEMENT LE NOM.** `kbLimites` lisait
l'identifiant et le THÈME ; le 4.6 et le 6.14 n'ont ni l'un ni l'autre, et ∞
serait reparti sur le clavier B. Elle lit donc aussi l'ÉCRAN — une case de
limite affichée suffit — avec un garde qui compte : `id === currentTestId`,
sans quoi un écran de limites resté sur la page rendrait « vrai » pour
n'importe quel exercice, et le sabotage l'a montré en nommant les cinq.
**ET LE 3.2 N'AVAIT JAMAIS EU CE CLAVIER — mesuré, pas supposé** : la variante
des limites existe depuis septembre 2026, mais `applyKbLayout` ne tourne que
sur `mlDexp.upgrade()`, et aucun écran du 3.2, du 3.3 ni du 3.4 ne portait de
champ mathématique — la page connaissait la règle et ne la servait jamais là.
La sonde a relevé le clavier d'avant sur le 3.2 : ni ∞ ni ⟶ sur le clavier A.
**LE JUGE N'A PAS BOUGÉ D'UNE LIGNE, et c'est ce qui rend la bascule sûre** :
`limLire` passe par `dexpCellValue` — `saClean` retire les résidus MathLive de
fin de saisie (le piège documenté de l'exposant vide), puis `toPlain` rend le
clair que `lgLimOK` sait lire depuis toujours (« +∞ », « -∞ », « 3,5 »). Un
élève qui tape « inf » écrit ∞ par le raccourci du champ, celui que l'indication
de l'écran lui promettait déjà.
**LE BOUTON ∞ RESTE, et il lève « input » UNE seule fois** : sur ordinateur le
clavier est une fenêtre qu'il faut ouvrir, et le raccourci ne se devine pas.
`executeCommand` lève l'événement lui-même, `setValue` non — le relais n'est
posé que sur la seconde voie, et le banc navigateur COMPTE les événements :
doublé, la correction en direct du soutien verrait deux frappes pour une touche.
**Et `corrCase` sait écrire dans un champ mathématique.** Sa moitié « vide » est
celle qui compte — elle relit la case par le même chemin que le juge ; sa moitié
« écriture » est une CEINTURE, et c'est mesuré : dans un vrai Chromium,
`mf.value = '−∞'` rend exactement le même dessin que `setValue('-\infty')`.
Elle est gardée parce qu'elle écrit comme `rfReveal`, l'entonnoir voisin, et le
dire vaut mieux que de le taire. Ce qui est VIVANT est que la correction écrive
quelque chose que le juge relise, et le sabotage qui la débranche rougit en
nommant les vingt cases.
**Deux pièges du BANC s'y sont montrés, et aucun n'était un défaut de la
page.** Le double du harnais rendait `toPlain` en passe-plat : une case écrite
par la page (le bouton ±∞, la correction) se relisait alors en LaTeX et le juge
la refusait — le double convertit désormais `\infty` et `{,}`, les deux seules
commandes que la PAGE ÉCRIT dans une case avant qu'un juge ne la relise, et le
contrôle qui mesure `toPlain` lit la SOURCE, pas ce double. Et sa première
écriture est tombée dans le piège documenté de l'antislash : le substitut du
harnais vit dans un GABARIT, où `\\infty` devient `\infty` — la regex ne
cherchait plus qu'« infty » et mangeait le mot sans sa barre.
**Deux bancs, la répartition habituelle.** jsdom tient la SOURCE (le bord sans
liste), puis MONTE chaque témoin déclaré dans `tests/profils.js` — deux sources,
et elles doivent se répondre : une page qui pose des limites sans témoin rougit,
un témoin sans page aussi. Les démarreurs étant asynchrones (ils attendent
`loadConfig`), le témoin déclare une `pose` qui passe par le vrai générateur :
un contrôle synchrone aurait mesuré l'écran d'avant. Le NAVIGATEUR mesure ce que
jsdom n'a pas — la disposition du clavier RÉELLEMENT installée, ∞ et ⟶ sur le
clavier A, sur TOUT écran visité qui pose une limite (greffé sur la visite
universelle : l'exercice qu'on posera demain est couvert sans rien déclarer),
puis « 6 tricies duodecies » TAPE « inf » au clavier, CLIQUE le bouton ∞ et
mesure la boîte rendue.
**Quatorze sabotages, chacun rougissant en nommant son défaut** — neuf au banc
jsdom (la case redevenue un `<input>`, un `lgLimOK` relisant un `.value`, le
6.14 revenu à sa case numérique, `limLire` relisant le LaTeX brut, la correction
qui n'écrit plus rien dans les vingt cases, la case privée de `dexp-mf` donc de
la greffe, les deux moitiés de `kbLimites`, le profil vidé de ses témoins) et
cinq au navigateur (le raccourci « inf » retiré du champ, le bouton ∞ muet, le
bouton qui lève deux événements, `kbLimites` sourde à l'écran — il nomme le 4.6
et le 6.14, les deux exercices qui n'ont que l'écran pour se faire
reconnaître —, la case réduite à rien par une règle CSS). **Et un quinzième n'a
rien pu dire** : la même case mise en `display:none` fait mourir le banc sur son
PARCOURS, trente secondes avant d'atteindre le contrôle visé — un sabotage qui
casse le banc ne dit rien du contrôle qu'il vise, et rejoué en réduisant la case
au lieu de l'effacer, il la nomme (« 16x44 px »).
**Ce qui NE bouge pas se dit aussi** : le juge, la note, les messages, la
correction en badges verts et la mise en page — comparée avant/après dans un
vrai navigateur, à la question près du tirage. Un seul geste change de main : la
chaîne d'Entrée entre les cases (`navCasesListe`) ne connaît que les `input` et
les `select`, donc elle saute désormais les cases de limite — c'est déjà le
sort de TOUS les champs mathématiques de la Terminale, Tab et le clic restent,
et le corriger toucherait les dix-huit autres écrans pour un besoin qui n'a pas
été demandé.
**ET LA COLLISION QUI A SUIVI N'ÉTAIT PAS CELLE D'UN NUMÉRO : Turquet avait
répondu LUI-MÊME à la demande, sur `main`, pendant que la branche attendait.**
Quarante-deux minutes après l'annonce « prêt à mettre en ligne », une v330
poussée directement sur `main` déclarait ces mêmes cases `inputmode="numeric"`
avec `data-pave-plus="+ ∞"` : elles restaient des `<input>` de texte, servies
par le PAVÉ numérique compact au lieu du clavier du système. Deux réponses à
une seule question, dans les mêmes lignes — le conflit que `git` signale et
qu'aucun banc ne pouvait voir, chaque côté étant juste de son côté.
**LA RÈGLE QUI TRANCHE EST LA CHRONOLOGIE DES INSTRUCTIONS, pas la date des
commits** : « mets en ligne » est postérieur à la v330, et il désigne la
branche — donc la résolution va vers la branche, et la v330 est SUPERSÉDÉE là
où elle portait sur une case de limite. Ce n'est pas un aller simple : un
pavé rendu à ces cases tient en un commit, la mécanique existant déjà
(`PAVE_MF` et `pave.champsMaths`, vides en Terminale parce que « ses cases
attendent des expressions » — une case de limite, elle, attend `+∞`, `−∞` ou
un nombre).
**CE QUI SURVIT DE LA v330 SE DIT, parce que ce n'est pas rien** : son
`inputmode="numeric"` reste sur les cases d'ÉQUATION d'asymptote (`lg-eq`,
`<pfx>-eq`), qui ne sont pas des cases de limite et que la branche ne touche
pas — la fusion automatique les a gardées, et le contrôle qui compte les
appels à `lgLimOK` ne les regarde pas non plus. Une fusion se relit sur ce
qu'elle GARDE autant que sur ce qu'elle remplace.
**Et le banc des versions a fait exactement ce pour quoi il existe** : parti
d'un `main` à 328, la branche écrivait 329 ; `main` étant passé à 330, la
page va en **331** — la collision silencieuse d'`APP_VERSION` (deux écritures
du MÊME nombre ne font aucun conflit textuel) ne pouvait plus se produire,
puisque le banc compare à `main` au moment où il tourne.

**Sur tablette, la page s'installe comme une application — et sur tablette
seulement.** Demande de Turquet (septembre 2026) : gagner la place que la
barre d'adresse et les onglets de Chrome prennent sur l'écran d'une tablette,
« uniquement pour les tablettes ». Un site posé sur l'écran d'accueil s'ouvre
sans aucune barre de navigateur à une condition : qu'il déclare un
MANIFESTE d'application. Chaque page a le sien, à côté d'elle
(`secondes.webmanifest`, `premiere-specifique.webmanifest`,
`terminale.webmanifest`), avec ses icônes dans `icones/` — rendues par
Chromium depuis un dessin, jamais retouchées à la main.
**Le manifeste n'est DÉCLARÉ qu'aux écrans tactiles**, et c'est ce qui tient
« uniquement » : écrit en dur dans le `<head>`, Chrome sur ordinateur
proposerait lui aussi d'installer la page. `manifesteTablette()` pose donc le
`<link rel="manifest">` au démarrage, sous la garde de `pointer: coarse` —
Chrome lit le lien au moment où l'on demande l'installation, le poser après le
chargement suffit. Le nom du fichier est DÉRIVÉ de l'adresse de la page :
trois niveaux, trois manifestes, une seule règle, aucune constante à tenir par
niveau, et le bloc est le même texte dans les trois fichiers.
`window.__tabletteForce` joue le rôle de `window.__paveForce` : le banc force
l'écran tactile, la requête média reste au navigateur.
**Ce qu'un manifeste faux fait de pire est de ne rien dire** : une icône
absente, un PNG dont la taille n'est pas celle annoncée, une `start_url` qui
ouvre une autre page, et Chrome pose un simple raccourci qui rouvre le
navigateur avec sa barre — l'élève a « installé », et rien n'a changé. Le
banc jsdom tient les deux bords de la garde (rien sur ordinateur, le lien une
fois en tactile, la balise d'écran d'accueil de Safari avec) et LIT les
fichiers : le JSON, la page de départ, les dimensions des PNG dans leur
en-tête, l'icône « maskable », et trois identités distinctes — deux niveaux
sous le même `id` seraient pour Android la même application, installer l'un
remplacerait l'autre. Le banc navigateur (« 11 bis ») fait ce que jsdom ne
peut pas : il ouvre la page à son adresse RÉELLE, relit le lien que la page
a posé, ouvre le fichier qu'il désigne et fait DÉCODER chaque icône par
Chromium à la taille annoncée.
**Deux limites, à dire plutôt qu'à taire.** Aucun banc n'installe vraiment la
page : l'installation est un geste du système, hors de portée d'un navigateur
piloté — c'est le fichier joint et la tablette qui tranchent. Et `prof.html`
n'a pas de manifeste : le professeur travaille sur ordinateur, et un tableau
de bord installé sur la tablette d'un élève n'aurait rien à y faire.

**Sur tablette, la police de TOUTE la page est réduite à 90 % — par une seule
règle.** Décision de Turquet (septembre 2026), après la question « sur une
tablette peut-on diminuer la taille des polices sur une page ? » : « dans la
page, règle fixe sur tablette ». Les trois pages écrivent leurs tailles en
`rem` (plus de deux cents par fichier) et ne posaient aucune taille sur la
racine : `@media (pointer:coarse) and (min-width:600px){ html{font-size:90%} }`
réduit donc énoncés, cases, boutons et titres d'un coup, dans les mêmes
proportions — la règle « une case a la taille des nombres qui l'entourent »
tient d'elle-même. Le clavier mathématique et le pavé numérique sont réglés
en PIXELS : ils ne bougent pas, et c'est voulu — une touche doit rester
touchable. **Une tablette, pas un téléphone** : la borne de 600 px est celle
du clavier réduit du téléphone, prise dans l'autre sens ; un téléphone a
déjà peu de place, et sa police reste entière.
**Le pourcentage vit dans `tests/profils.js`** (`policeTablette`), deux
sources : le contrôle jsdom exige la règle avec CE pourcentage, une borne qui
distingue encore une tablette d'un téléphone (500 à 800 px), et **une seule**
règle `html{font-size}` dans tout le fichier — une seconde, hors de la
requête média, réduirait aussi l'ordinateur ou annulerait la tablette, sans
qu'aucune erreur ne se lève. jsdom n'évalue pas une requête média : le banc
NAVIGATEUR (« 11 quater ») mesure la racine RENDUE sur trois écrans —
tablette (tactile, 820 px : 90 %), ordinateur (100 %) et téléphone (tactile,
390 px : 100 %) — parce qu'une règle qui réduirait partout ne serait pas la
règle demandée. Playwright pose `pointer:coarse` avec `hasTouch`, ce qui
rend la requête mesurable pour de vrai. Six sabotages, chacun rougissant en
nommant son défaut.

**Puis, sur tablette, la CHAÎNE À NOMBRES a écrit plus petit que le reste —
la case et ce qui l'entoure, du même facteur.** Demande de Turquet (septembre
2026, Première) : « pour les exercices avec des cases à remplir avec des
nombres, sur les tablettes, après l'énoncé, les écritures avant et après une
case à remplir ont une police légèrement plus petite, ainsi que la police des
cases ». Les 90 % de la page ne suffisaient pas : sur une tablette, le clavier
mange déjà la moitié de l'écran, et une chaîne d'égalités à 2 rem se replie —
or une égalité coupée en deux se lit comme deux calculs.
**UN SEUL FACTEUR, ET IL VIT À UN SEUL ENDROIT.** Les tailles de la page sont
toutes en `rem`, donc ancrées à la racine : aucune règle posée sur un
conteneur ne les réduit, et la solution naïve — recopier chaque taille dans un
second bloc de tablette — aurait donné DEUX listes à tenir. Le jour où l'une
des deux aurait dérivé, c'est la case OU son voisin qui aurait rétréci seul,
c'est-à-dire exactement le défaut que « une case a la taille des nombres qui
l'entourent » interdit. Le facteur voyage donc dans une variable que les règles
MÊMES portent (`calc(… * var(--tab-nb,1))`), et la requête média de la tablette
le pose à un seul endroit. Case et écritures rétrécissent alors du même
facteur, par construction et non par vigilance.
**POSÉ SUR LE STAGE, PAS SUR LA PAGE, et c'est ce qui dit « après l'énoncé »** :
`.mp-stage` est ce qui vient après le `p.mp-instr` de l'énoncé, qui vit
au-dessus et garde donc sa taille sans qu'on ait rien à lui retirer. Et
`:has(math-field.pm-mf)` restreint aux stages qui portent VRAIMENT une case à
nombres — la feuille de rédaction libre (2.1.7, 2.2.10, 2.3.9, 2.5.2) a déjà sa règle
de tablette et n'est pas touchée ; elle est NOMMÉE dans le profil plutôt que
tue, sans quoi le contrôle rougirait sur un écran voulu. Un navigateur qui ne
connaîtrait pas `:has` retombe sur la taille d'avant — jamais sur un écran
cassé.
**Ce qui NE bouge pas est un choix, pas un oubli** : la case générique à
1,05 rem (les colonnes du 3.1.4) est déjà la plus petite du niveau et reste une
cible qu'on touche du doigt ; les étiquettes d'étape et les
boutons de propositions ne sont pas des écritures de la chaîne. Sur un
TÉLÉPHONE rien ne change non plus — la demande dit les tablettes, et le
facteur vaut 1 sous 600 px.
**Le contrôle jsdom tient la mécanique, pas l'apparence** : CHAQUE règle qui
donne sa taille à une case à nombres doit passer par le facteur — un écran
ajouté demain avec sa propre taille de case garderait sinon des cases grandes
au milieu d'écritures rétrécies, et aucun écran ne le dirait —, les écritures
nommées dans `tests/profils.js` (`chaineTablette`, deux sources) aussi, le
facteur n'est déclaré qu'à UN endroit et jamais sur `:root`, `html` ou `body`
— posé là, il emporterait l'énoncé et toute la page —, et l'énoncé ne le porte
pas. Le banc NAVIGATEUR (« 11 septies ») mesure ce que jsdom ne sait pas :
les polices RENDUES sur une tablette en paysage et sur un ordinateur — la case
et ses voisins réduits du facteur, l'énoncé réduit de la seule police de la
page.

**Et un défaut d'à côté s'est vu en mesurant : le 2.5.2 écrivait ses cases
trois fois plus petites que ses nombres.** Ses cases étaient restées à la
taille générique (1,05 rem) devant des écritures à 2 rem — « 1 − ▢/▢ = 1 − 0,▢
= 0,▢ » — alors que son jumeau le 2.2.1, dont il reprend la chaîne au caractère
près, les écrit à 1,9 rem : la réponse de l'élève passait pour une note en bas
de page au milieu du calcul, c'est-à-dire exactement ce que la règle « une case
a la taille des nombres qui l'entourent » interdit. Corrigé sur demande de
Turquet (septembre 2026) : `#ckHost` rejoint le groupe des pourcentages dans
les cinq listes qui vont ensemble — la taille, les deux largeurs, le trait de
fraction et le repli du téléphone — plutôt que de recevoir un réglage à lui,
qui aurait fini par diverger de celui du 2.2.1.
**MAIS LE VRAI DÉFAUT ÉTAIT DANS LE CONTRÔLE, et c'est lui qui a été
réparé** : le contrôle universel ne comptait comme « nombre autour » qu'un
morceau de texte ENTIÈREMENT numérique (« 90 », « 1,5 »). Or la page n'écrit
presque jamais un nombre tout nu dans une chaîne : elle écrit « 1 − »,
« 1 − 0, », « 0, ». Le 2.5.2 n'avait donc AUCUN voisin aux yeux du banc, qui
passait au vert en regardant ailleurs — un contrôle qui ne mesure rien ne
mesure rien, et celui-là a vécu des mois. Est désormais un voisin tout morceau
COURT (12 caractères au plus) qui porte un chiffre et aucune lettre : le signe
et la virgule font partie du calcul écrit. Les étiquettes (« Question 1 / 4 »)
portent des lettres, et ce qui vit ailleurs à l'écran reste écarté par la ligne
partagée et les 120 px — les trois niveaux passent sans une seule exemption, ce
qui est le signe que la définition est la bonne. Éprouvé en remettant le 2.5.2
en défaut : le banc le NOMME (« 2.5.2 — ck1p : 16.8px contre 32px »), là où il
restait vert avant.
**Et il en a trouvé un SECOND en naissant, par intermittence — ce qui est la
pire façon pour un contrôle de dire vrai.** Le 2.1.2 écrivait lui aussi sa case
à 1,05 rem au milieu d'une phrase à 1,35 rem (« 20 % de 100 km est ▢ »), et le
banc ne le nommait que lorsque le tirage posait un nombre sur la ligne de la
case : vert un tirage sur deux. La case prend la taille de sa phrase, et la
SONDE — le contrôle rejoué sur quatre tirages, les trois niveaux — remplace la
chance par une mesure : zéro case plus petite que ses voisins. Un piège de
cascade s'y est montré, le même qu'ailleurs : `.pcol-phrase math-field` (une
classe, un type) PERD contre `body math-field.dexp-mf` (une classe, deux
types), et la règle ne faisait rien — mesurée, pas relue : la case restait à
16,8 px pendant que la feuille de styles disait 1,35 rem.
**Et le contrôle s'est pris en défaut avant la page, deux fois.** Le premier
jet cherchait le bloc média d'un seul coup de regex, en exigeant qu'il ne
contienne QUE la règle du facteur : trois de ses bords devenaient alors
inatteignables — le facteur posé sur la racine, l'énoncé rétréci et le facteur
déclaré deux fois rougissaient tous les trois en disant « aucune règle », donc
en parlant d'autre chose que de leur défaut. Il lit maintenant la feuille règle
par règle, en retenant la requête média qui entoure chacune. Et son filtre des
écritures ne regardait que le début ou la fin d'un sélecteur : le calcul écrit
en TÊTE de rangée (`#sfHost .pt-row>.f-frac`) lui échappait, et aurait pu
perdre le facteur sans que rien ne rougisse — il vise le JETON de classe
désormais, sans attraper `.f-frac-input`, qui n'est pas la même classe. Onze
sabotages, chacun rougissant en nommant son défaut : dix au banc jsdom, et un
que seul le NAVIGATEUR voit — le `.mp-stage` retiré de l'écran, où le facteur
n'a plus rien où se poser pendant que la feuille de styles, elle, reste
parfaite.

**Puis la tablette a proposé un RACCOURCI, pas une installation — et le
manifeste n'y était pour rien.** Signalé par Turquet le jour de la mise en
ligne (septembre 2026) : « chrome propose seulement un raccourci, pas
d'installation ». Avant de toucher au manifeste, on a demandé son avis à
Chromium LUI-MÊME (`Page.getInstallabilityErrors`, le protocole DevTools) :
zéro défaut — manifeste, page de départ, icônes, tout lui convenait. Le
critère manquant est propre à Chrome sur Android : jusqu'à la version 108,
une page ne s'INSTALLE que si un **service worker** répond à `fetch`, y
compris hors connexion ; sans lui, « Ajouter à l'écran d'accueil » ne pose
qu'un raccourci, et rien à l'écran ne dit lequel des critères manque. Les
versions plus récentes s'en passent, mais la tablette d'un élève n'est pas
forcément à jour.
**`sw.js` existe donc pour cette seule raison, et il ne met RIEN en cache.**
C'est le premier réflexe d'un service worker, et ce serait ici une faute :
`main` publie immédiatement (règle 1), un cache servirait une vieille page
après une mise en ligne, sans que rien ne le dise. Toute requête ordinaire
passe au navigateur sans intermédiaire ; seule une NAVIGATION est relayée,
et si le réseau la refuse, l'élève lit « Pas de connexion » au lieu de
l'erreur brute du navigateur — c'est exactement le critère d'avant la 108.
Il est enregistré par `manifesteTablette()`, au même moment que le lien et
sous la même garde : sur ordinateur il n'existe pas, et un refus (`file://`,
navigateur ancien) est sans conséquence.
**Le banc navigateur sert la page en HTTP local pour le mesurer** : un
service worker ne s'enregistre pas depuis `file://`, où le banc ouvre toutes
ses pages. Trois mesures de plus en « 11 bis » : le service worker ACTIF sur
le dossier de la page, le verdict d'installabilité de Chromium (le pipeline
entier ; « in-incognito » est écarté — un contexte Playwright l'est toujours),
puis le serveur FERMÉ et la page redemandée, qui doit rendre « Pas de
connexion » et jamais la page elle-même (ce qui trahirait un cache). Fermer
le serveur coupe le réseau pour de vrai, là où une émulation pourrait ne pas
atteindre un service worker qui vit hors de la page. Deux pièges de banc s'y
sont montrés : avec un mandataire réglé sur Chromium, `127.0.0.1` y passait
AUSSI et la page arrivait vide sans une erreur (`bypass`) ; et un serveur
qu'on ferme attend les connexions que le navigateur garde ouvertes — on les
détruit. Le banc jsdom tient la garde (jamais enregistré sur ordinateur, une
fois en tactile, `sw.js`) et lit le fichier : les trois écouteurs, la page
hors connexion, et aucune API de cache dans le CODE — le commentaire a le
droit de nommer ce qu'il refuse. Dix sabotages, chacun rougissant en
nommant son défaut — six en jsdom, quatre que seul le navigateur voit : le
service worker jamais actif, l'erreur brute hors connexion, la page
elle-même servie hors connexion (« un cache ? »), et le manifeste en
`display: browser`, que Chromium nomme lui-même
(`manifest-display-not-supported`). La limite ci-dessus tient toujours :
le geste d'installation lui-même reste hors de portée de tout banc.

**Puis « ne marche toujours pas » — et la tablette a fini par dire le
contraire, à condition de lui demander à ELLE.** Après le service worker,
Turquet a signalé (septembre 2026) que Chrome 140 proposait encore le seul
raccourci, quand Squoosh s'installait sur la même tablette : la page était
donc en cause, et aucun banc d'ici ne pouvait dire pourquoi — Chromium
sur ordinateur trouvait zéro défaut. Ce qui a tranché, ce sont TROIS PAGES
DE MESURE (`tests/diagnostic/`), servies par la prévisualisation Netlify
d'une pull request de brouillon et ouvertes SUR la tablette : chacune
affiche ce que Chrome en pense — `pointer: coarse`, le lien manifeste, le
manifeste et ses icônes tels que la tablette les charge, les service
workers, et surtout l'événement `beforeinstallprompt`, le verdict de Chrome
lui-même, avant tout menu. A pose le lien en dur, B le pose par le code
MÊME de la vraie page (copié tel quel), C élargit la portée au dossier.
Les trois ont reçu l'événement ; la vraie page, mesurée de la même façon
sur la même prévisualisation, aussi ; et « Ajouter à l'écran d'accueil »
sur l'adresse des élèves a proposé **Installer** — la page B installée
s'ouvre sans barre d'adresse. Le code, le manifeste, la portée et la garde
étaient hors de cause ; le refus antérieur venait de la tablette — page
mise en cache (GitHub Pages sert `max-age=600`) ou raccourci des essais
précédents —, et aucune relecture du code n'aurait pu le voir. La règle du
diagnostic vaut ici encore : quand une erreur revient à l'identique, on
change de couche — on demande son avis à Chrome SUR l'appareil, au lieu de
reproduire depuis ici ce qu'il ne fait pas. Deux traces restent dans le
dépôt : les pages de mesure, pour la prochaine tablette qui refusera, et
la règle d'en-tête de `netlify.toml` qui sert `.webmanifest` avec son type
sur les prévisualisations — Netlify le servait en `octet-stream`, GitHub
Pages en `application/manifest+json`, et mesurer sur un hébergement qui
diffère du vrai sur ce point aurait parlé d'autre chose.

**Puis la barre du bas a disparu — en PREMIÈRE seulement, et le prix est
nommé.** Demande de Turquet (septembre 2026, sur sa tablette Samsung) :
« peut-on supprimer la bande en bas de l'écran qui permet de réduire la
fenêtre et voir toutes les applications ouvertes ». Cette bande est la barre
de navigation d'ANDROID, pas un morceau de la page : **aucune ligne de HTML,
de CSS ni de JavaScript ne peut la cacher** — seul le MANIFESTE le peut, en
demandant `display: fullscreen` au lieu de `standalone`. Chrome lance alors
l'application installée en plein écran, sans barre système.
**Le geste RESTE, et c'est voulu** : un balayage depuis le bas fait revenir
la barre, puis l'accueil — l'élève peut toujours sortir, ce n'est pas un
verrou de classe, et prétendre le contraire serait mentir sur ce que le
manifeste sait faire.
**Le prix est assumé et se DIT** : l'heure, la batterie et le wifi
disparaissent avec la barre du bas — Android cache les deux barres ensemble
ou aucune, on ne choisit pas. C'est un arbitrage, pas un oubli.
**Et il ne prend effet qu'à la RÉINSTALLATION** : Chrome relit le manifeste
d'une application déjà posée à son rythme, et le mode d'affichage est
précisément ce qu'il garde le plus longtemps. On retire l'icône de l'écran
d'accueil et on réinstalle — sinon rien ne change, sans que rien ne le dise.
**Seule la Première est concernée** : la demande la nomme, la Seconde et la
Terminale gardent `standalone` — et ce bord OPPOSÉ est TENU, non supposé. Le
mode d'affichage vit dans `tests/profils.js` (`manifeste.display`, deux
sources), et le contrôle compare les TROIS manifestes à leur profil à chaque
exécution, quel que soit le niveau contrôlé : le plein écran ne peut pas
fuir sur un niveau qui ne l'a pas demandé. Le banc navigateur, lui, garde le
seul juge qui compte — `Page.getInstallabilityErrors` : un mode d'affichage
que Chromium refuserait rendrait la page non installable, et il le NOMME
(c'est ainsi que `display: browser` avait été attrapé). Trois sabotages,
chacun rougissant en nommant son défaut : la Première revenue à
`standalone`, le plein écran qui fuit sur la Seconde, le profil qui ne
déclare plus rien.
**Et la tablette a son propre réglage, qui ne passe pas par le dépôt** :
Paramètres → Affichage → Barre de navigation → Gestes de balayage, puis
« Indicateur de geste » décoché, cache la barre pour TOUTES les
applications. Le dire vaut mieux que le taire — c'est le seul chemin si le
plein écran de l'application ne suffit pas.

**Et la bande du bas appartient au SYSTÈME : la Première y descendait.**
Signalé par Turquet (septembre 2026), tablette Samsung, la page ouverte depuis
l'écran d'accueil : « pour les exercices de Première où il faut rédiger une
justification avec les pourcentages, par exemple le 2.3.9, la ligne la plus
basse du clavier virtuel ne fonctionne pas — les caractères ne s'affichent
pas, que ce soit en portrait ou en paysage ».
**La sonde a mesuré avant qu'on ne touche à quoi que ce soit** : cette
rangée-là vit à 7..49 px du bord BAS de l'écran en paysage (7..67 en
portrait), et le CENTRE de ses touches à 28 px et 37 px du bord — les rangées
du dessus, elles, sont à 78 et 97 px, et personne ne s'en est jamais plaint.
Or Android se réserve les 48 dp du bas pour le geste de retour à l'accueil,
que l'indicateur de geste de Samsung occupe en plus : le système y prend les
touches, et rien n'arrive à la page. Aucune erreur nulle part — la touche ne
répond simplement pas.
**POURQUOI LA PREMIÈRE, ET POURQUOI EN APPLICATION SEULEMENT** : c'est le seul
niveau dont le manifeste demande « fullscreen » (la demande du paragraphe
ci-dessus), donc le seul qui dessine jusqu'au bord PHYSIQUE de l'écran. Dans
un onglet, et dans les deux autres niveaux restés en « standalone », le
navigateur ou la barre du système occupent cette bande et la page ne
l'atteint jamais. Les trois conditions du signalement — Samsung, mode
application, Première — sont chacune une moitié de la cause, et c'est la
demande d'hier qui a produit le défaut d'aujourd'hui.
**ON REND DONC LA BANDE, en mode application seulement** : rien de ce qui se
touche n'y descend plus — le clavier mathématique ancré, les commandes du bas
(Signaler / Abandonner / Pause) et le pavé numérique, qui vivait lui aussi à
6 px du bord en paysage et serait devenu le signalement suivant. La réserve
vit à UN SEUL endroit (`--bas-systeme`, 48 px, déclarée aussi dans
`tests/profils.js` — deux sources) et la classe est posée par le script comme
`pave-actif` : la requête média reste au navigateur, le banc force par
`window.__appForce`, et la classe se RETIRE à la sortie du plein écran — sans
quoi un onglet mis puis sorti du plein écran garderait la mise en page de
l'application.
**Le clavier a d'abord remonté EN BLOC (v221), et c'est la mesure qui l'a
décidé** : une bordure ou un rembourrage posés sur son fond n'ont RIEN donné —
sa hauteur est ÉCRITE par MathLive en BOÎTE DE BORDURE et sa plaque de touches
est accrochée au HAUT du fond, si bien que les touches n'avaient pas bougé d'un
pixel et débordaient simplement de leur boîte. C'est une marge qui l'a remonté,
et on l'a su en mesurant, pas en relisant.
**MAIS UNE MARGE LAISSE UN TROU, et Turquet l'a dit le lendemain** (« le trou
sous le clavier me gêne ») : le fond opaque s'arrêtait 48 px au-dessus du bord,
et une bande de page se voyait dessous. Il ne demandait pas de redescendre les
touches — la question était « peut-on mettre le clavier tout en bas ? », et la
réponse est NON tant qu'on veut des touches qui répondent : la bande appartient
à Android. **Les deux se tiennent pourtant, en posant le rembourrage sur les
RANGÉES et non sur le fond** (v222) : le fond GRANDIT d'autant, son décalage et
sa translation suivent tout seuls, il reste collé au bord — et les touches
montent avec lui. La sonde a départagé les quatre essais plutôt que de les
supposer : le fond passe de 247 à 295 px et la rangée du bas de 7 à 55 px du
bord (les 48 de la réserve plus les 8 de marge que les rangées avaient déjà),
quand une MARGE sur ces mêmes rangées ne rendait que 47 px — elle REMPLACE la
marge de 8 au lieu de s'y ajouter, et passait SOUS la réserve. Le pavé et les
commandes gardent la leur : ce sont des cartes flottantes à coins arrondis,
elles n'ont aucun bord à épouser, et aucun trou ne se voit sous elles.
**Le contrôle du trou est au NAVIGATEUR, et lui seul peut le voir** : il mesure
le bas du fond du clavier contre le bord de l'écran, dans les deux
orientations. **Cinq sabotages de plus, et les deux du navigateur se
répondent** — trois au banc jsdom (la marge revenue sur le fond, le
rembourrage retiré, le profil resté sur `.MLK__backdrop`) ; et au navigateur,
la marge revenue sur le fond ne fait rougir QUE le contrôle du trou (« trou
sous le clavier : 48 px en paysage, 48 px en portrait ») pendant que les deux
contrôles des touches restent verts — c'est exactement le défaut signalé —,
quand le rembourrage retiré fait l'INVERSE (« 11 dans la bande : la touche
« + » à 7 px du bord ») en laissant le contrôle du trou vert. Les deux
propriétés se mesurent séparément, et aucune ne couvre l'autre.
**Le bord OPPOSÉ compte autant, et il a son contrôle** : un niveau en
« standalone » ne doit RIEN porter de tout cela — 48 px coûtés pour rien —, et
un niveau qui passerait en plein écran sans réserve rougit aussitôt : le
contrôle lit `manifeste.display` et `basSysteme` dans le MÊME profil et exige
qu'ils aillent ensemble.
**Deux bancs, la répartition habituelle.** jsdom tient les règles et la classe
(la valeur comparée au profil, une seule déclaration non nulle et portée par
la classe, chacun des trois meubles qui la LIT, la classe posée et retirée
dans les deux sens, l'écouteur de la requête média). Le NAVIGATEUR
(« 11 octies ») mesure ce que jsdom ne peut pas : il ouvre l'exercice SIGNALÉ,
déploie le clavier et regarde ce qui reste dans la bande, en paysage puis en
portrait, touche par touche et au RECTANGLE — plus `elementFromPoint` sur
chaque centre, sans quoi une touche remontée mais RECOUVERTE passerait au
vert. Et il mesure d'abord le bord opposé, dans un onglet : la rangée du bas y
descend toujours à 7 px du bord — sans cette mesure, une réserve posée pour
tout le monde passerait au vert.
**CE QU'AUCUN BANC D'ICI NE PEUT DIRE, C'EST LA HAUTEUR DE LA BANDE.** 48 px
est la valeur d'Android, pas une mesure prise sur la tablette de Turquet —
aucun navigateur piloté ne reproduit ce que le système intercepte.
`tests/diagnostic/bande-basse.html` existe pour cela, comme les trois pages de
l'installation avant elle : son manifeste demande « fullscreen » comme la
Première, elle empile sept barres à des hauteurs connues du bord et affiche le
point le plus bas qu'une touche ait atteint. Si la première barre qui répond
est plus haut que 48 px, c'est la réserve qu'il faut relever ; si tout répond
dès le bord, la cause est ailleurs. C'est la règle du diagnostic, déjà payée
sur l'installation : quand l'appareil dit le contraire du banc, on change de
couche et on demande son avis à l'appareil.
**Et la gêne d'à côté a été traitée le lendemain** (« occupe-toi du clavier
qui recouvre les commandes ») — paragraphe ci-dessous.
Quatorze sabotages, chacun rougissant en nommant son défaut — dix au banc
jsdom (la réserve à zéro, à 24 px, chacun des trois meubles débranché, la
classe posée partout, la classe qui ne se retire plus, `__appForce` ignoré,
l'écouteur retiré, le profil qui ne déclare plus rien, la réserve qui fuit sur
la Seconde) et quatre au navigateur, qui nomment la touche ET sa distance au
bord (« la touche « + » à 7 px du bord »). Le sabotage du seul clavier laisse
le contrôle du pavé VERT, et c'est la preuve que les trois meubles se mesurent
séparément.

**LE CLAVIER ANCRÉ PREND LE BAS, LES COMMANDES MONTENT EN HAUT.** Demande de
Turquet (septembre 2026) : « occupe-toi du clavier qui recouvre les
commandes ». La gêne était plus large que ce que j'en avais dit : la sonde l'a
mesurée avant tout correctif, et « Signaler », « Abandonner » et « Mettre en
pause » vivent ENTIÈREMENT sous le clavier ancré dès qu'il est déployé — sur
les TROIS niveaux, dans les DEUX orientations, en mode application comme dans
un onglet, et non « en paysage » seulement. Elles n'y sont pas seulement
cachées : `elementFromPoint` rend une touche du clavier, donc elles sont
INTOUCHABLES. Aucune erreur nulle part, le bouton ne répond simplement pas.
**LA PLACE ÉVIDENTE A ÉTÉ ÉCARTÉE PAR LA MESURE** : posées juste AU-DESSUS du
clavier, les commandes deviennent atteignables — mais elles recouvrent la
ligne où l'élève écrit, 4 mesures sur 6. La case d'une rédaction est pleine
largeur et MathLive l'amène au ras du clavier : il n'y a pas de place entre
les deux. C'est l'objection de la bulle « Comprendre mon erreur », qui ne
recouvre ni la case qu'on remplit ni les commandes du bas — ici elle écarte un
correctif qui marchait.
**LE COIN HAUT EST LE SEUL LIBRE, et c'est mesuré, pas supposé** : dix-huit
configurations (trois niveaux × deux orientations × onglet et mode
application), page défilée comme remontée, rien sous les commandes et jamais
de chevauchement avec la case. Une seule CLASSE suffit donc
(`body.clavier-ouvert`), sans mesurer la hauteur du clavier : le haut est
libre quelle que soit sa forme, compacte ou non.
**La fenêtre FLOTTANTE de l'ordinateur ne les déplace pas** : elle ne recouvre
rien (`window.__kbFloating`). Et la classe est posée dans `pinKbToViewport`
plutôt que sur un écouteur de plus — elle est déjà rappelée à chaque instant
où la géométrie du clavier change (déploiement, repli, `geometrychange`,
redimensionnement, rotation) : un écouteur de plus aurait été une seconde
liste à tenir.
**L'ORDRE de la règle CSS compte, et c'est le bord silencieux** : à
spécificité égale (`body.pave-actif #testCtrls` et `body.clavier-ouvert
#testCtrls` pèsent pareil), c'est la position dans la feuille qui tranche.
Écrite plus haut, notre règle ne ferait RIEN — aucune erreur, aucune classe
manquante, les commandes simplement restées sous le clavier. Le contrôle jsdom
l'exige donc explicitement.
**Deux bancs, la répartition habituelle.** jsdom tient la mécanique : la règle
existe et pose `top` et `bottom:auto`, elle vient après celles de
`pave-actif`, la classe suit le clavier dans les deux sens et jamais sur la
fenêtre flottante (`clavierHaut` ÉVALUÉE depuis la source — le clavier vit
dans la greffe module, que jsdom ne sait pas charger), et `pinKbToViewport`
l'APPELLE : une fonction juste que personne n'appelle est la moitié morte du
correctif. Le NAVIGATEUR (« 11 nonies ») mesure ce que jsdom ne peut pas
voir — clavier déployé, aucune commande sous lui, toutes atteignables au
centre, aucune sur la case — et le bord OPPOSÉ : clavier refermé, elles
redescendent au bas de l'écran, sans quoi des commandes montées pour de bon
passeraient au vert.
**Neuf sabotages, chacun rougissant en nommant son défaut** — six au banc
jsdom, trois au navigateur, dont celui de la place écartée, qui répond
« recouvre la case où l'élève écrit », et celui de la règle retirée, qui
chiffre la rechute (« signalBtn dépasse de 125 px sous le haut du clavier »,
231 px en portrait). **Et l'un d'eux a renforcé le contrôle AVANT la page** :
« la classe reste posée une fois le clavier refermé » passait au VERT parce
que le double du banc repartait d'une mémoire de classes NEUVE à chaque tour —
une fonction qui ne saurait qu'AJOUTER y était inatteignable. La séquence se
joue sur un seul état désormais, et le faux `classList` connaît `add` et
`remove` en plus de `toggle` : sans eux, le sabotage échouait sur une méthode
absente du double et nommait un autre défaut que le sien. Un dernier a
d'abord semblé ne frapper que le VOISIN — la classe posée en permanence
déplace les commandes sur tous les écrans, et les contrôles du pavé rougissent
les premiers : rejoué en lisant TOUTES les lignes rouges, le contrôle visé
rougit bien lui aussi (« la plus haute est à 730 px du bas : elles ne sont pas
redescendues »).
