# Seconde — intervalles et ordre des nombres

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Un schéma d'intervalle et son écriture sont la même chose, dite deux fois.**
L'exercice des intervalles de la Seconde montre une droite graduée et demande
d'écrire ce qu'elle montre — les crochets, l'inégalité, « ouvert / fermé en … » —
en choisissant dans des propositions, jamais en tapant : la fiche papier dont il
est repris fait exactement cela, et une saisie libre recalerait un élève qui
écrit « -2 » avec le tiret du clavier. Le crochet d'une borne EXCLUE **tourne le
dos à l'intervalle**, comme le fait le « ] » de ]−2 ; 3[ : le dessin EST la
notation, et c'est tout ce que l'exercice cherche à faire passer. Le retourner ne
casse rien — l'élève répond ce que le dessin lui montre, la page le corrige avec
l'autre version, et il croit s'être trompé ; c'est le défaut de la retenue de la
soustraction, au bon endroit dans le mauvais sens.
Un contrôle MESURE donc le schéma. Il y lit les graduations — aucune coordonnée
n'est recopiée, une échelle qui changerait resterait mesurée juste —, vérifie que
le trait rouge part d'une borne et s'arrête à l'autre, qu'une borne prise porte un
point plein et une borne exclue un crochet, et que les bras de ce crochet
s'écartent du trait rouge. Il tient aussi les bords de l'écriture : l'infini n'est
jamais fermé et n'a **pas** de case d'inégalité (« x ≤ +∞ » n'a pas de bonne
réponse), et les trois lignes se répondent l'une l'autre. Il a été éprouvé en le
cassant cinq fois.
Un piège d'à côté s'y est montré : la feuille pose `select{width:100%}`, si bien
que sans largeur EXPLICITE les quatre cases de l'intervalle s'étiraient chacune
sur toute la ligne et se posaient l'une sous l'autre — un `min-width` n'y peut
rien, c'est la largeur qu'il faut reprendre.

**Et le chemin inverse est un autre exercice.** {intervalles-inegalite} ne donne
que l'inégalité, et demande de retrouver le reste : le dessin, l'écriture, la
phrase « ouvert / fermé en … ». C'est le chemin du contrôle, et le plus dur des
deux — un dessin se lit, une inégalité se traduit.
C'est lui qui vient EN PREMIER dans le menu (décision de Turquet, août 2026) ;
{intervalles} le suit. Les deux descriptions se renvoient l'une à l'autre par
`{identifiant}`, jamais par un numéro écrit : un ordre qui change les renumérote
tous les deux, et les renvois suivent le jour même. Les notes déjà obtenues,
elles, ne bougent pas — elles portent l'IDENTIFIANT, pas le numéro.
Le schéma s'y CHOISIT parmi quatre, et les quatre ne diffèrent que par leurs
bornes : sur un intervalle borné, ce sont les quatre combinaisons de crochets sur
les mêmes nombres ; sur une demi-droite, ce sont les deux SENS × les deux
crochets. Un élève qui lit « −1 ≤ x » comme « x ≤ −1 » se trompe alors de dessin,
et c'est exactement l'erreur visée. Des propositions qui différeraient par autre
chose se laisseraient éliminer sans lire l'inégalité.
Tout le moteur est repris de l'exercice miroir — le tirage, le dessin, les listes
de propositions. En recopier une moitié aurait donné deux dessins à tenir, et le
jour où l'un des deux aurait changé de convention, les deux exercices se seraient
contredits sous les yeux de l'élève.
Quatre bords, tous silencieux, et un contrôle par bord : l'inégalité affichée qui
CONTREDIT l'intervalle attendu — l'énoncé est faux avant que l'élève ne commence,
et la correction lui donne tort sur une lecture juste ; deux propositions
identiques — deux bonnes réponses, une seule comptée ; « bon » qui ne désigne pas
la bonne ; et les quatre non MÉLANGÉES — rien ne casse, mais la bonne tombe
toujours au même rang et l'élève apprend le rang. Ce dernier a pris le banc en
défaut : compter les rangs toutes formes confondues ne prouvait rien, puisque
sans mélange la bonne tombe quand même à un rang différent selon la forme. Ce
qui compte est qu'à forme ÉGALE le rang change.
Le schéma se rend en DEUX tailles — les quatre propositions sont côte à côte, et
tout y est grossi dans le viewBox pour rester lisible une fois réduit. Le banc ne
mesurait que la grande : la moitié du dessin échappait au contrôle, et c'était
justement celle que l'élève compare case par case. Il mesure les deux.

**Une liste corrigée en bleu doit se VOIR en bleu — et le message doit dire les
cases vides avant tout.** Signalé par Turquet sur une capture (août 2026) :
« 6 cases justes sur 7 » avec toutes les réponses visiblement justes. La
septième était restée VIDE ; `corrChoix` l'avait remplie avec la classe `sol` —
qu'aucune règle CSS ne dessinait sur `.itv-sel`. C'est la leçon de `.plc-sel.sol`
et `.lv-in.sol`, revenue sur une TROISIÈME famille de listes : une règle apprise
sur une classe ne protège pas les autres, et chaque famille de sélecteurs doit
recevoir la sienne le jour où elle naît. La règle vaut pour les trois exercices
qui partagent `.itv-sel` — intervalles, inégalité, inéquation graphique.
Et le message rouge déroulait la solution entière comme si l'élève s'était
trompé — la leçon des sommes, encore : une case vide n'est pas une erreur de
calcul. `msgAvecVides()` dit d'abord « il te manquait N case(s) — la correction
les a remplies en bleu », puis l'explication SEULEMENT s'il y a une vraie
faute : expliquer une erreur qui n'existe pas donne tort à une lecture juste ;
et « Le reste est juste ! » quand rien d'autre ne cloche. Un contrôle tient les
quatre bords (la règle CSS, la case vide seule, la vraie faute, les deux
ensemble) puis rejoue le geste sur les trois exercices de la famille — une
famille corrigée à moitié ne serait pas corrigée. Éprouvé en le cassant six
fois.

**Et une case ROUGE porte la bonne réponse en VERT à côté.** Demande de
Turquet (août 2026, sur le 2.7) : la case fausse gardait le choix de l'élève
en rouge et rien ne disait la bonne réponse — elle ne vivait que dans le
texte du message. `corrChoix` pose maintenant le badge `mf-cor` de la
convention commune après chaque case fausse, ce qui la porte d'un coup à
TOUTE la famille des listes de la Seconde (intervalles, inéquations et
équations graphiques, appartenance, 2.7…) : la fonction partagée est
précisément ce qui empêche deux exercices voisins de se contredire. Le
badge écrit le LIBELLÉ de l'option, jamais sa valeur interne — la bonne
carte du 2.7 s'écrit « B », pas « 1 » ; le « oui » des inéquations s'écrit
« le prendre » ; ∈ garde son symbole. En ENTRAÎNEMENT seulement : en
soutien l'élève corrige lui-même, un badge lui soufflerait la réponse que
le barème fait payer. Trois sabotages nommés (le badge retiré, la valeur
interne au lieu du libellé, le badge qui fuit en soutien).

**« Appartient ou pas ? » : le risque est arithmétique, pas graphique.** Deux
exercices sur un seul moteur, repris de la fiche « Intervalles 2 » : un nombre,
un intervalle, l'élève dit ∈ ou ∉. Le niveau 1 tire quatre décimaux contre le
MÊME intervalle — le cas dedans, le cas dehors, la borne elle-même (c'est le
crochet qui tranche) et le voisin immédiat de la borne (2,09 contre 2,1). Le
niveau 2 tire des nombres qui ne disent pas leur valeur : √15, π, une fraction,
« 0,2 millier ».
Se tromper d'un cran sur une borne compterait l'élève faux sur une réponse juste,
sans que rien ne rougisse — c'est le pire défaut possible pour un exercice, il
apprend l'inverse de ce qu'il enseigne. Les rationnels sont donc comparés **en
entiers** : p/q contre m/10^k se décide par p·10^k contre m·q, égalité comprise.
Aux grandeurs de cet exercice une comparaison en virgule flottante donnerait le
même résultat — le banc a été mis au défi de les distinguer et n'y arrive pas —,
donc ce n'est pas un correctif : c'est le refus de dépendre d'une chance que rien
ne surveille le jour où quelqu'un ajoutera des fractions plus fines.
**La bonne réponse n'est jamais rangée à côté de l'intervalle** : elle est
calculée par la fonction même qui corrige l'élève, si bien qu'un énoncé ne peut
pas contredire sa correction.
Le contrôle compare la page à LA FICHE, item par item — les vingt items décimaux
du tableau et les douze cas d'irrationnels, de fractions et d'unités. Si le code
et le papier divergent, c'est le code qui a tort. Trois sabotages sur six l'ont
d'abord traversé : la comparaison des racines n'était éprouvée que sur des bornes
ENTIÈRES, où une erreur d'échelle est invisible, et deux « défauts » de virgule
flottante n'en étaient pas. Le contrôle balaie maintenant les racines contre des
bornes au centième.
**Un tirage penché se répond sans lire.** Le premier jet du niveau 2 centrait
l'intervalle sur la valeur : trois lignes sur quatre étaient ∈, et répondre ∈
partout donnait 75 %. Le tirage vise maintenant deux ∈ et deux ∉ — mais la
réponse reste CALCULÉE, jamais supposée, et c'est le compte final qui décide de
garder la question. Le niveau 1 refuse seulement les quatre lignes identiques.
Le piège de la fiche vaut d'être gardé : « 0,2 millier » contre [0,2 ; 0,3[.
L'intervalle est bâti autour de l'ÉCRITURE et non de la valeur, et l'élève qui
compare ce qu'il lit au lieu de ce que ça vaut répond ∈. Sans ce cas, l'exercice
ne posait la question qu'autour de 200 — là où le piège ne se referme jamais.

**Trois nombres, deux graduations, trois zones.** {placer-intervalle} est
repris de deux fiches manuscrites : une droite avec DEUX graduations, trois
nombres à placer — avant la première, entre les deux, après la seconde —, et
chaque zone reçoit exactement un nombre, comme sur le papier.
**Le risque n'est pas dans le dessin, il est arithmétique**, et c'est le même
que celui d'{appartient-intervalle} : face à 1,07 et 1,08, l'élève lit « 1,1 »
et le place AVANT, parce que 1 est plus petit que 08. Les négatifs en ajoutent
un second : −1,59 est APRÈS −1,6. Les comparaisons se font donc EN ENTIERS,
jamais en virgule flottante, et **la bonne réponse n'est jamais rangée à côté de
la question** : elle est calculée par `plcZone()`, la fonction même qui corrige
l'élève, si bien qu'un énoncé ne peut pas contredire sa correction.

**Le bouton des zéros est l'aide de la fiche** — celle que le professeur donne
au tableau (décision de Turquet, août 2026) : il réécrit les CINQ nombres avec
autant de décimales que celui qui en a le plus, et 1,07 / 1,08 / 1,1 deviennent
1,070 / 1,080 / 1,100. Il ne change QUE l'écriture ; la correction ne le regarde
pas, et un contrôle l'exige — un bouton qui déplacerait une réponse serait un
piège tendu à l'élève qui demande de l'aide, c'est-à-dire à celui qui en a le
plus besoin. Il ne redessine pas l'écran non plus, seulement les écritures :
refaire l'écran effacerait les réponses déjà données.

**Et l'aide ne dure QUE le temps de l'appui** (décision de Turquet, août 2026) :
on garde le bouton enfoncé pour jeter un œil, on relâche et les zéros s'en vont.
C'est ce qui la sépare d'un exercice où les zéros seraient déjà écrits — l'élève
voit la méthode, il ne travaille pas dessus. Le bouton s'écoute donc à l'APPUI
et au RELÂCHEMENT, jamais au clic : un clic n'arrive qu'une fois le doigt levé,
c'est-à-dire trop tard. Il se relâche aussi quand le pointeur quitte le bouton,
quand le geste est annulé et quand la page perd le focus — sans quoi le geste le
plus banal (appuyer, glisser un peu, lever) laisserait l'aide allumée pour de
bon, et l'aide serait devenue l'exercice. Au clavier, « maintenir » est la
touche enfoncée, sinon l'aide devient inatteignable à qui navigue sans souris.
**Ce sont DEUX états, pas un.** `plcAppui` dure le temps du doigt ;
`test.plcZeros` est posé par la CORRECTION et reste. Un seul drapeau ferait
disparaître la correction au premier appui suivi d'un relâchement — l'élève
aurait vu la méthode s'effacer juste au moment où on la lui montre.
Le banc principal appelle la fonction ; seul le banc navigateur APPUIE. C'est la
différence qui compte, et deux des six sabotages ne sont vus que par lui.
**Et la correction pose ces zéros elle-même** quand l'élève s'est trompé : elle
MONTRE la méthode au lieu de seulement la décrire. Jamais en soutien, où l'élève
corrige lui-même.

Le tirage garantit que le bouton ait toujours quelque chose à faire — les cinq
nombres n'ont jamais tous le même nombre de décimales — et s'arrête à trois
décimales, comme la fiche.

Le contrôle compare la page à LA FICHE, cas par cas, les trois tableaux
manuscrits y compris celui aux négatifs. Puis il balaie le tirage en jugeant
chaque comparaison par une SECONDE méthode, qui n'a rien en commun avec la
première : les deux écritures complétées de zéros, puis comparées comme des
chaînes. Une réimplémentation en entiers se serait trompée du même côté.
Éprouvé en le cassant onze fois, et **deux sabotages l'ont d'abord traversé**.
Le premier a montré un garde-fou MORT : « aucun nombre ne tombe sur une
graduation » n'a jamais rien à écarter, parce que `plcAuDela()` ne rend jamais
la borne — le retirer ne changeait rien, et le compteur restait à zéro sans
rien mesurer. Le contrôle éprouve donc `plcAuDela()` directement, sur les deux
sens et toutes les échelles. Le second était un faux sabotage de ma part :
décaler un nombre d'une unité de son propre rang ne lui fait presque jamais
changer de zone, et le vert était juste.

**Ranger trois nombres, c'est {placer-intervalle} sans la droite.**
{ordre-croissant} (Seconde) donne trois nombres décimaux à ranger du plus petit
au plus grand, choisis dans des listes séparées par « < » — jamais tapés, comme
partout où une saisie libre recalerait un élève sur un tiret de clavier.
**Les nombres sont tirés par le moteur de {placer-intervalle}** : `ordGen()`
appelle `plcGen()` et n'en garde que les trois nombres — mêmes pièges, mêmes
négatifs. Un second tirage aurait fini par diverger. Il n'ajoute qu'une
condition : les trois nombres n'ont jamais tous le même nombre de décimales,
sans quoi le bouton des zéros n'aurait rien à faire ici (plcGen ne le garantit
que sur les cinq, bornes comprises) — le sabotage l'a montré, les trois nombres
sortaient parfois tous à trois décimales.
**Le bouton des zéros est LE MÊME** — mêmes drapeaux (`plcAppui`,
`test.plcZeros`), même branchement (`plcBrancherZeros`), même fonction de
réécriture : l'aide ne dure que le temps de l'appui, et la correction pose les
zéros pour de bon quand l'élève s'est trompé. Le banc navigateur APPUIE sur les
deux boutons — `aideMaintenue` est devenu une liste, parce qu'un appui qui
marcherait sur l'un et pas sur l'autre ne se verrait nulle part ailleurs.
**Les listes portent l'INDICE du nombre, jamais son écriture.** C'est le piège
propre à cet exercice : le bouton réécrit les libellés sous le doigt de l'élève
(« 1,1 » devient « 1,100 »), et une liste qui porterait l'écriture comme VALEUR
changerait de réponse au moment où l'aide la réécrit. Un sabotage l'a joué :
toutes les cases rougissaient dès que la correction posait ses zéros.
**L'ordre est calculé en entiers** (`plcCmp`) par la fonction qui corrige, et le
contrôle le vérifie par une SECONDE méthode — les écritures complétées de zéros
comparées comme des chaînes, les négatifs à part, où « plus grand » s'inverse
sous le signe. Éprouvé en le cassant sept fois.
