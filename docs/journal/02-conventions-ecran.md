# Conventions d'écran : énoncé, numéro, saisie, signalement

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**La classe de l'énoncé pose une étiquette « Énoncé ».** `.enonce`,
`.mp-instr`, `.lv-instr` et `.tvi-prompt` dessinent un cadre bleu et posent
l'étiquette en pastille. La mettre sur autre chose — une légende de tableau, la
partie b) d'une question — affiche donc un deuxième « Énoncé » sur le même
écran, comme s'il y avait deux exercices. Une **suite** d'énoncé se déclare avec
`enonce-suite` : même cadre, pas d'étiquette. Une **légende** prend une autre
classe (`.tvi-legende`, `.tvi-instr`).
Deux énoncés sont posés depuis des chaînes JavaScript, invisibles à un contrôle
qui ne lirait que le HTML : le banc compte donc les occurrences dans tout le
fichier et exige autant d'énoncés étiquetés que d'écrans d'exercice. Le banc
navigateur, lui, compte les étiquettes réellement affichées sur deux écrans
choisis pour cela.

**Le numéro de l'exercice est en tête de son écran, et c'est `show()` qui l'y
met.** Il apparaissait déjà partout ailleurs — la carte du menu, l'écran des
modes, les résultats, le signalement — mais PAS là où l'élève passe son temps.
La Seconde, portée depuis la Terminale, n'avait jamais reçu ce morceau : ses dix
exercices s'ouvraient sans dire lequel on faisait. Rien ne cassait, et c'est
pour ça que personne ne l'avait vu pendant des mois.
Le contrôle vise `show()`, et elle seule : c'est l'unique porte vers un écran
d'exercice, donc l'y vérifier une fois les couvre tous — y compris celui qu'on
ajoutera demain. Deux bords : la pastille qui MANQUE, et le numéro FIGÉ. Le
second est le plus sournois, parce qu'un numéro capturé une fois pour toutes
enverrait l'élève au mauvais exercice le jour d'une réorganisation, sans erreur
nulle part.

**Les numéros d'exercice n'existent nulle part.** `3.1.1` se déduit de la
POSITION dans `THEMES` : réordonner un thème les décale tous. Vingt-cinq phrases
en citaient un en toutes lettres — « les 3 étapes de l'exercice 3.1.1 » — dans
les descriptions, les rappels de cours et le contexte envoyé au modèle. Aucune
ne se recalculait : le jour d'une réorganisation, elles renvoyaient l'élève au
mauvais exercice, sans erreur nulle part. Elles s'écrivent maintenant
`{identifiant}`, résolu à l'affichage par `numeros()` dans les trois fichiers —
deux entonnoirs, `cardHTML` et `rappelHTML`. Un contrôle interdit qu'un numéro
en dur y revienne, un autre vérifie que le numéro **suit** une renumérotation et
que la carte de l'élève est bien branchée. Le contexte envoyé au modèle est hors
de portée du contrôle : il est truffé de décimales — coordonnées de tracé, bornes
d'intervalle — qu'aucune règle ne distingue d'une référence. Une substitution
mécanique y avait d'ailleurs transformé 105 décimales en identifiants, dans les
illustrations de la Terminale.

**Une copie d'écran jointe est FACULTATIVE, et tout le reste en découle.**
L'élève peut ajouter une image à son signalement — il la COLLE (Ctrl+V, le
réflexe après Impr. écran ou Win+Maj+S), la dépose, ou clique pour la choisir ;
sur tablette ce dernier geste ouvre la galerie. Trois gestes, parce qu'un seul
en laisserait la moitié dehors. Le collage s'écoute sur la FENÊTRE et non sur la
zone : au moment du Ctrl+V le curseur est dans le champ de texte, et un écouteur
posé sur la zone ne recevrait jamais rien.
L'instantané reste le principal — il REJOUE l'écran, ce qu'une image ne fera
jamais. La capture sert là où l'instantané est aveugle : un défaut d'affichage,
un écran de téléphone, un dérangement hors de l'exercice.
**Un envoi d'image qui échoue ne fait pas perdre le signalement** : le texte part
seul, et la page le dit. Le pire serait qu'un élève qui veut aider reparte les
mains vides. À l'inverse, une image déposée dont l'écriture échoue ensuite est un
ORPHELIN — invisible et décompté du quota : elle est retirée, comme pour les PDF
de cours.
**L'image est réduite dans le navigateur avant l'envoi** (1600 px, JPEG) : une
capture brute pèse 1 à 3 Mo, le plan gratuit offre un giga-octet, et le réseau
d'un lycée n'aime pas les gros envois. Le contrôle mesure la LARGEUR et non le
poids : une image d'essai en aplat se comprime si bien que comparer les octets ne
prouverait rien.
**Le bucket est PRIVÉ** (migration 007), contrairement à celui des cours : c'est
l'écran d'un mineur, avec son prénom dessus. Le professeur le lit par une adresse
signée. Le chemin commence par l'identifiant de l'élève, et la politique n'accepte
que son propre dossier — un chemin qui cesserait de le porter serait refusé par la
base, chez l'élève, sans que rien ne rougisse au banc. L'élève n'a même pas le
droit de RELIRE ce qu'il vient d'envoyer : le droit qu'on ne donne pas est celui
qu'on n'a pas à surveiller. Supprimer un signalement emporte son image, et le
refus muet s'y applique — `remove()` rend une liste VIDE quand les droits
manquent : on la compte, sinon la ligne partirait pendant que l'image resterait.
**La migration se joue AVANT la mise en ligne, pas après.** C'est la leçon de la
003, et elle se répète : la page écrit la colonne `capture`, et sans elle l'élève
reçoit une erreur au moment où il essaie d'aider.
**Deux pièges de banc s'y sont montrés.** Deux contrôles ASYNCHRONES qui se
rendent `sb` à tour de rôle se le reprennent l'un l'autre en plein vol : le
second lisait le double du premier et accusait la page. Ils vivent dans un seul
contrôle, séquentiel. Et surtout : `[hidden]` pose `display:none` depuis la
feuille du NAVIGATEUR, qu'un `display:flex` écrit dans la page bat — la zone
restait affichée sous l'aperçu pendant que `zone.hidden` valait `true`. Le banc
lisait la propriété, passait au vert, et l'écran était faux. Il mesure le
RECTANGLE désormais. Ça ne s'est vu que sur une capture.

**Un signalement d'élève est du texte libre tapé par un mineur, et le rejeu se
fait sous le compte du professeur.** Le bouton « Signaler un problème » envoie
l'INSTANTANÉ de l'exercice — celui que la pause enregistre — et non une capture
d'écran : `mailto:` ne sait pas joindre de fichier, et une image ne se rejoue
pas. Deux pièges en découlent. Le message s'affiche chez le professeur : `esc()`
pour le texte, `escJS()` près de tout attribut d'événement. Et surtout, le
professeur qui rejoue l'écran est connecté à SON compte : terminer l'exercice
poserait une note sur un élève. Le verrou (`REJEU`) est posé sur le client
Supabase lui-même, dans `poserGardeRejeu()`, et non sur une fonction
d'enregistrement — la Première en a une, la Seconde écrit ses notes depuis sept
endroits et la Terminale depuis quatre. Un contrôle par niveau l'exige, et il
vérifie aussi que le verrou ne bloque RIEN hors rejeu.
La table écran/rendu (`afficherEcranDe`) est partagée entre la reprise après
pause et le rejeu : elle était née en double, et la copie du rejeu désignait
`renderA2QTest`, qui n'existe pas. En Seconde et en Terminale, le rejeu doit
appeler `rehydrateQuestions()` avant de dessiner — les questions reviennent du
JSON sans les fonctions de leurs courbes.
La migration `003` se joue à la main chez Supabase, comme les autres : jouée
après coup, le bouton renvoie une erreur à l'élève.

**Le professeur RÉPOND à un signalement, et c'est la lecture qu'il a fallu
renverser.** Demande de Turquet (août 2026) : « je voudrais pouvoir répondre à
un élève qui me signale un problème ». Un signalement partait jusque-là sans
retour possible — l'élève écrivait, et n'entendait plus rien.
**Écrire la réponse ne demandait rien** : la politique `p_…_prof_modif` ouvre
déjà l'UPDATE au professeur, c'est elle qui porte « Marquer lu » depuis
toujours. Rien ne passe donc par la fonction Edge — le raisonnement du
renommage et du devoir sur papier, pris tel quel : y faire passer la réponse
aurait coûté un redéploiement à la main, et le bouton serait arrivé en ligne
MORT en attendant, sans que rien ne le dise.
**Ce qui bloquait était la LECTURE, et la migration 008 la renverse.** La 003
la réservait au professeur et le disait en toutes lettres — « SEUL LE
PROFESSEUR LIT » —, si bien qu'une réponse aurait été parfaitement enregistrée
et parfaitement invisible ; la page insère d'ailleurs « à sec », sans demander
la ligne en retour, précisément parce que la demander échouait. La raison de la
003 ne disparaît pas pour autant : l'élève lit **sa propre ligne, et elle
seule** — jamais celle d'un camarade —, exactement le motif que `resultats`
emploie depuis la 001. C'est un renversement, comme le contexte envoyé au
modèle, et le contrôle n'a pas été retiré mais retourné : le banc de la base
exigeait « elle ne relit aucun signalement », il exige maintenant qu'elle
relise les siens, qu'elle lise la réponse qu'on lui a écrite, et qu'elle ne
voie ni celle de Bob ni la ligne de Bob.
**Aucun droit d'écriture ne lui est donné** : pas de marque « j'ai lu », pas de
réponse à la réponse. La table porte un UPDATE ouvert à tout compte connecté au
niveau des DROITS, et seule la politique le restreint au professeur — lui
ouvrir une politique d'UPDATE, fût-ce sur sa propre ligne, le laisserait
réécrire son message ou la réponse elle-même. Le droit qu'on ne donne pas est
celui qu'on n'a pas à surveiller, et deux contrôles du banc de la base
l'exigent (la réponse, et le message). Conséquence assumée : la réponse reste
sur l'accueil de l'élève tant que le professeur ne supprime pas le signalement,
et il n'y a pas de « nouveau » à afficher — un état de lecture aurait demandé
ce droit-là.
**La migration se joue AVANT la mise en ligne**, comme la 003 et la 007 — mais
le coût d'un retard change de côté, et c'est le seul endroit du projet où c'est
le cas : côté ÉLÈVE le panneau se TAIT sur une erreur de lecture (la colonne
n'existe pas encore) et l'accueil retombe simplement sur ce qu'il était, tandis
que côté PROFESSEUR le bouton « Répondre » renvoie une erreur qui se voit.
**Répondre, c'est lire** : la réponse pose `lu` du même geste, sans quoi la
pastille des non-lus compterait encore un signalement qu'on vient de traiter.
**Une mise à jour que RLS refuse n'est pas une erreur** — PostgREST rend
« 0 ligne », comme pour une suppression : on redemande les lignes touchées
(`.select('id')`) et on les COMPTE, sinon la page annonce « Réponse envoyée ✓ »
sur une réponse qui n'est jamais partie. Effacer le texte puis envoyer RETIRE
la réponse ; une réponse vide sur une ligne qui n'en a pas est refusée.
**La réponse déjà écrite se repose en VALEUR dans le champ, jamais dans le
HTML** — un `</textarea>` tapé dedans refermerait la balise — et le message
rappelé à l'élève, tapé par un mineur, passe par `esc()` des deux côtés. Un
sabotage a montré que le contrôle ne mesurait d'abord que la carte du
professeur : la moitié « élève » de l'échappement lui échappait.
**Deux bords ne se voient que dans un navigateur** : les retours à la ligne
(`white-space:pre-wrap` — une réponse en plusieurs lignes se lirait d'un bloc
sans lui, la leçon du conseil du modèle sur une troisième famille de textes),
et le panneau qui ne devrait pas être là, mesuré au RECTANGLE et jamais à la
propriété `hidden` — `[hidden]` pose `display:none` depuis la feuille du
NAVIGATEUR, qu'un `display:` écrit dans la page bat, le piège déjà payé sur la
zone de copie d'écran. Un piège de banc s'y est montré : ouvrir l'onglet des
signalements LANCE une lecture, qui écrasait le `mesSignalements` posé à la
main — les deux mesures tombaient sur le même texte et le contrôle restait vert
en parlant d'autre chose ; il repasse par `chargerSignalements()`, la vraie
porte. Treize sabotages en tout, chacun rougissant en nommant son défaut, plus
deux mutations au banc de la base (la lecture redevenue réservée au professeur,
et l'élève reçu au droit d'écrire).

**La case où l'élève ÉCRIT ne se colore pas.** Décision de Turquet (août
2026) : en SOUTIEN, une case ne devient ni rouge ni bleue tant qu'il y écrit.
Elle attend qu'il la QUITTE — case suivante, clic ailleurs — ou qu'il vérifie.
Colorée à la frappe, elle déclare fausse une réponse qu'il n'a pas fini
d'écrire : « 1 » rougit le temps qu'on tape « 12 », et l'élève apprend à se
méfier d'une couleur qui ment.
**UN SEUL ENDROIT, ET IL NE CONNAÎT AUCUN EXERCICE.** Les corrections en direct
sont des dizaines, réparties dans les trois fichiers, et chacune juge l'écran
ENTIER sans savoir quelle case porte le curseur : les rebrancher une par une
aurait laissé dehors celles qu'on ajoutera demain. Le garde SURVEILLE donc la
case qui a le curseur, lui RETIRE toute couleur qui s'y pose, et la REPOSE
telle quelle à la sortie — la couleur reposée est celle que la correction avait
CALCULÉE, donc aucune correction ne tourne deux fois et le verdict ne peut pas
diverger de celui de la frappe. Le motif existait déjà, dans le moteur de fiche
de la Terminale (`F.mf` : `focusout` juge, `input` ne re-juge qu'une case déjà
marquée) — une leçon apprise dans un coin qui n'avait pas gagné les autres,
encore.
**Et c'est un OBSERVATEUR, pas une micro-tâche après la frappe.** Le premier jet
effaçait la couleur juste après l'événement, en supposant que la correction
avait déjà peint. Beaucoup peignent en effet tout de suite — mais pas toutes :
certaines passent par un minuteur, et leur couleur arrivait APRÈS le ménage. Le
banc NAVIGATEUR l'a montré du premier coup sur {image-nombre} (la case restait
rouge sous les doigts) pendant que jsdom, où la correction d'essai peint
synchroniquement, passait au vert : **le contrôle jsdom disait vrai sur son
propre montage et faux sur la page.** On ne suppose plus rien du MOMENT.
**Trois bords, et n'en tenir qu'un ne tient rien** : une case DÉJÀ jugée quand
on y entre se re-juge à chaque frappe (sinon l'élève qui corrige son rouge
devrait cliquer ailleurs pour savoir s'il a réussi) ; la couleur retenue SE
PÉRIME quand la correction efface sans repeindre — l'élève a vidé sa case —, un
compteur distinguant cet effacement-là de celui que le garde vient de faire ;
et la VÉRIFICATION passe outre. Ce dernier a DEUX chemins : un clic sur
« Vérifier » donne le focus au bouton, donc le garde rend la main de lui-même,
mais la touche ENTRÉE ne déplace rien — le calcul mental et les opérations
posées valident ainsi — et le garde y rend la main explicitement ; le mode et
`test.locked` sont en plus relus À CHAQUE observation, si bien qu'une
vérification qui verrouille l'écran reprend la main au milieu de la
surveillance.
Le garde est le **même texte dans les trois fichiers**, comparé bloc à bloc par
un contrôle. Les champs mathématiques n'étaient déjà colorés qu'à la sortie
(la greffe MathLive appelle `dexpLiveCheck` sur `focusout`) : le garde est
inerte pour eux, et c'est le signe qu'il dit la même chose qu'eux.
Deux bancs, et ils ne voient pas la même chose. Le PRINCIPAL pose une case
d'essai et une correction d'essai — il n'ouvre aucun exercice, exprès : le garde
agit sur le RÉSULTAT de n'importe quelle correction, pas sur son branchement. Le
NAVIGATEUR, lui, TAPE dans un vrai exercice (déclaré par niveau dans
`tests/profils.js`, `gardeSaisie`) et exige qu'une couleur ait bien été CALCULÉE
— sans quoi il resterait vert sur une case que personne ne juge, en parlant
d'autre chose. Un piège de banc s'y est montré : mesurer avec un `setTimeout`
laissait tourner les minuteurs des contrôles précédents, l'un d'eux volait le
focus de la case d'essai, le garde croyait qu'on la quittait — et la mesure
accusait la page. On avance d'une MICRO-tâche.

**La case rouge propose de COMPRENDRE l'erreur — et l'explication ne part que
sur un clic.** Demande de Turquet (septembre 2026) : en soutien, quand une case
devient rouge, expliquer l'erreur à l'aide de l'IA, dans une bulle, sans donner
la réponse. La bulle « 💡 Comprendre mon erreur » paraît quand l'élève QUITTE
une case comptée fausse — le moment où le garde de la saisie pose la couleur —
et l'appel au modèle n'a lieu QUE si l'élève clique : automatique, il aurait
coûté un appel par case rouge et répondu avec des secondes de retard, quand
l'élève est déjà ailleurs.
**UN SEUL ENDROIT, ET IL NE CONNAÎT AUCUN EXERCICE** — le motif du garde : un
écouteur `focusout` en phase de BULLE, donc après le garde (qui repose la
couleur en phase de capture) et après les corrections attachées au champ ; un
exercice ajouté demain est couvert sans rien déclarer. Les corrections qui
peignent APRÈS la sortie — le minuteur que la Première pose sur `focusout` —
sont rattrapées par un second regard, un instant plus tard.
**La bulle fut FIXE en bas à droite, au-dessus des commandes** — jusqu'à ce
que Turquet la demande à CÔTÉ de la case (paragraphe ci-dessous) ; l'objection
qui l'avait mise au coin, elle, n'a pas été abandonnée mais tenue autrement.
Ancrée n'importe où, elle aurait recouvert la case d'EN DESSOUS — le
dénominateur d'une fraction, la rangée suivante d'un tableau — et le clic de
l'élève serait parti dans la bulle : la leçon du pavé numérique, qui ne
recouvre ni la case qu'on remplit ni les commandes du bas. Elle s'efface quand
l'élève REPREND sa case — il corrige, elle reviendra s'il ressort en faux — et
jamais quand il passe simplement à la case suivante : quitter une case, c'est
presque toujours en prendre une autre, et la bulle s'éteindrait au moment
précis où elle vient de naître.
**Le verdict reste celui de la PAGE, le modèle ne fait qu'EXPLIQUER** — la
doctrine du juge, prise du bon côté : la case est rouge parce que la correction
locale l'a jugée, et rien de ce que dit le modèle ne change une couleur ni une
note. Le contexte part par la voie du Conseil (`conseilCtxCourant` +
`lancerConseil`, donc `LANGUE_SIMPLE` et les clauses existantes), enrichi de la
SAISIE fautive — le libellé pour une liste, jamais la valeur interne — et de
l'ordre de ne JAMAIS donner la réponse : le contexte seul serait pire que pas
de contexte du tout. Le bloc est le MÊME TEXTE dans les trois fichiers ; seul
l'adaptateur `bexpLancer` diverge, VOLONTAIREMENT (la signature de
`lancerConseil` n'est pas la même selon les niveaux), et un contrôle exige
qu'il passe par `lancerConseil` — un appel qui partirait tout seul perdrait les
garde-fous du Conseil sans que rien ne le dise. Jamais en entraînement, jamais
sur un écran verrouillé, jamais sur une case remplie par la page (`sol`).
Deux bancs, la répartition habituelle : jsdom pose la case d'essai du garde,
ENVELOPPE l'invoke du double pour lire ce qui part vraiment — l'action, la
saisie, la clause — et le rend en sortant (le piège documenté du `sb` volé) ;
le navigateur mesure la bulle au RECTANGLE — jamais à la propriété `hidden` —
sur la case témoin du garde quittée FAUSSE (deux chiffres différents ne
peuvent pas être justes tous les deux dans la même case : le rouge est
GARANTI, jamais intermittent), clique le vrai bouton, lit la réponse du double
et vérifie qu'elle ne recouvre pas les commandes du bas. Sept sabotages,
chacun rougissant en nommant son défaut — dont un que seul le navigateur
voit : la bulle descendue sur les commandes, où le clic d'à côté part dans la
bulle et le bouton devient incliquable.

**Puis la bulle est venue À CÔTÉ de la case, une flèche pointée sur elle.**
Demande de Turquet (septembre 2026) : « en mode soutien, il faudrait que la
bulle qui apparaît "comprendre mon erreur" quand une case est rouge soit à
côté de la case avec une flèche vers cette case. » C'est un RENVERSEMENT du
coin fixe, et l'objection qui l'y avait mise reste VRAIE — ancrée n'importe
où, la bulle recouvre la case d'EN DESSOUS et le clic de l'élève part
dedans, la leçon du pavé numérique. **Elle est donc tenue AUTREMENT, pas
abandonnée** : `bexpPlacer` essaie les quatre côtés dans l'ordre — droite,
gauche, dessus, dessous —, la zone testée COMPRENANT la flèche, et ne retient
que le premier qui ne chevauche AUCUNE autre case de l'écran ni les commandes
du bas. Faute de place, le coin d'avant, et alors SANS flèche : une flèche qui
ne désigne rien mentirait. La flèche est DEUX triangles — le cadre, puis le
fond posé 2 px en dedans pour couvrir la couture — et sa pointe suit le CENTRE
de la case, bornée à 18 px des coins arrondis. La bulle se replace au
défilement (écouté en CAPTURE : un conteneur qui défile ne lève rien sur la
fenêtre), au redimensionnement, et quand la réponse du modèle la fait GRANDIR
(`ResizeObserver`).
**UN SEUL BORD PAR AXE, et c'est la leçon que seul le navigateur a pu
donner** : vider une propriété en ligne (`b.style.right=''`) ne la retire
pas — elle rend la main à la FEUILLE DE STYLES, qui repose `right:16px` et
`bottom:92px`. Les deux bords posés, le navigateur ÉTIRE la boîte — 360×488 au
lieu de 288×69 —, sa taille change donc avec sa place, l'observateur de taille
rappelle le placement, aucun côté ne tient plus à cette taille, retour au coin
où elle redevient petite : la boucle tournait sans fin. Playwright l'a nommée
(« element is not stable ») et la sonde l'a chiffrée ; on écrit `'auto'`, et un
bord du banc jsdom l'y retient désormais, où il coûte une ligne.
**Deux bancs, la répartition habituelle** : jsdom mesure le CHOIX — il n'a
aucune mise en page, mais un rectangle POSÉ À LA MAIN se juge exactement comme
un vrai, et l'obstacle de chaque tour est placé pour écarter UN SEUL candidat,
sans quoi le contrôle passerait sans dire lequel il mesure ; le NAVIGATEUR
mesure le RENDU — la flèche dessinée à deux encres, sa pointe LUE sur le
pseudo-élément à moins de 8 px de la case et sur son CENTRE, et aucune autre
case recouverte, l'objection du coin fixe tenue par la mesure. La sonde a relevé les côtés réellement employés
sur les 45 exercices de la Seconde : gauche 9, droite 10, dessus 7 — jamais le
dessous, et jamais le COIN.
**Dix-huit sabotages, seize rougissant en nommant leur défaut** — treize au
banc jsdom, cinq au navigateur —, et les deux verts ont chacun appris quelque
chose. Le premier a nommé un TROU DU CONTRÔLE : la pointe était recalculée
depuis `--bexp-fx` et le rectangle de la bulle, c'est-à-dire sa propre
arithmétique, si bien que le « - 10px » retiré de la feuille de styles
déplaçait la flèche sans rien faire rougir ; elle se lit désormais sur le
décalage EN USAGE du pseudo-élément, et le bord « dans l'étendue de la case »
— trop lâche, une pointe déplacée de 10 px tombe encore sur une case de
40 px — est devenu le CENTRE à 3 px près, sauf quand fx a été borné pour
rester hors des coins arrondis. Le second, lui, disait vrai : retirer l'appel
à `bexpPlacer` au moment où la bulle paraît ne change rien parce que
l'observateur de TAILLE couvre le même instant — mesuré en le débranchant à
son tour, et la bulle retombe alors au coin. L'appel reste : il est le chemin
lisible, et le seul là où `ResizeObserver` manque.
**Et le garde de l'ancre a perdu une moitié REDONDANTE** : `Node.contains` est
vrai pour l'élément lui-même, donc `e===anc ||` ne filtrait rien — le sabotage
l'a montré en restant vert, quand retirer le garde ENTIER rougit (« obstacles
comptés : 4 sans l'ancre, 4 avec »). Ce n'est pas un garde-fou mort de plus :
la propriété est tenue, par l'autre moitié, une opérande plus loin.

**Puis la bulle GLISSE, et se RESSERRE plutôt que de retourner au coin.**
Signalé par Turquet (septembre 2026) : « quand une case est rouge, le premier
"comprendre mon erreur" s'affiche en bas à droite et pas à côté de la case
rouge ». Le coin est le REPLI documenté du paragraphe ci-dessus, et il tombait
bien trop souvent : la sonde a compté **25 à 29 replis sur 207 bulles** en
Seconde (1366 × 768), dont les quatre dernières cases du 2.2.1 et du 2.3.1 —
deux des exercices les plus faits.
**LA MESURE A ÉTÉ FAITE AVANT DE TOUCHER À QUOI QUE CE SOIT, et elle a
corrigé le diagnostic** : le repli n'est PAS lié au « premier ». Une page
NEUVE par exercice donne exactement les mêmes côtés qu'une séance déjà
commencée, la bulle recréée à chaque fois aussi — ce n'est donc pas la
création de l'élément, ni l'observateur de taille, ni un état qui traîne :
c'est de la GÉOMÉTRIE, et le repli tombe sur les cases serrées, où qu'elles
soient dans la séance. Le dire vaut mieux que de le taire : « le premier »
reste inexpliqué, et c'est le repli lui-même qui a été corrigé.
**DEUX CAUSES, ET N'EN TENIR QU'UNE NE TIENT RIEN.**
· La bulle était forcée d'être CENTRÉE sur sa case : un obstacle qui mordait
  de deux pixels suffisait à perdre le côté entier. Elle GLISSE désormais le
  long du côté (`bexpGlissades`, pas de 6 px, la centrée d'abord puis de part
  et d'autre), tant que la flèche atteint encore le centre de la case — la
  plage est exactement la portée de la flèche, `[centre − D + 18, centre −
  18]`. Onze replis sur vingt-neuf n'avaient pas d'autre cause.
· Une chaîne de cases n'offre NULLE PART 288 px de libre — mesuré case par
  case : à côté du `a4n` du 2.2.1, seul un rectangle de 96 × 44 tient. Faute
  de place à sa taille normale, la bulle se RESSERRE donc (`bexp-mini`, même
  texte, 187 × 39 mesurés) et reste à côté de la case, flèche comprise, avant
  de renoncer. Neuf replis de plus disparaissent.
**Le coin reste, et c'est honnête** : sur les tableaux les plus denses il n'y
a de place pour rien, même resserré. Après correction : **7 replis sur 198 à
1366 × 768, 2 sur 211 à 1920 × 1080** — contre 25 à 29 avant.
**Et le format resserré ne fait pas boucler l'observateur de taille** — le
piège payé sur `right`/`bottom` : `bexpPlacer` repart TOUJOURS de la taille
normale (la classe retirée d'entrée), si bien que le choix ne dépend que de la
case et des obstacles, jamais de l'état où la bulle se trouvait. Le placement
est donc déterministe, l'observateur retombe sur la même conclusion, et la
taille finale ne change plus.
**UN QUATORZIÈME GARDE-FOU MORT y a été écrit, puis retiré** : le
`Math.min/max` qui bornait le décalage de la flèche à 18 px des coins
n'écartait plus rien — la plage du glissement EST cette borne, donc
`f = centre − y` y tombe par construction. Le retirer a rendu le sabotage
« le glissement dépasse la portée » VISIBLE (la flèche sort de la bulle,
`fx: -18px`) là où le garde le masquait.
Cinq sabotages au banc jsdom, chacun rougissant en nommant son défaut — le
glissement débranché (« elle change de côté au lieu de glisser »), le format
resserré débranché, le coin qui garde le format resserré, la flèche qui ne
suit plus le centre, et le glissement hors portée. Ce dernier n'est devenu
atteignable qu'en resserrant l'obstacle du banc : posé trop grand, il bloquait
aussi les places hors portée, et le sabotage restait vert en parlant d'autre
chose.

**Puis la VÉRIFICATION a levé la bulle — et c'est la partie Algorithmique qui
l'a montré.** Demande de Turquet (septembre 2026) : « en mode soutien pour la
partie algorithme en seconde je veux qu'il y ait des bulles qui apparaissent
dès qu'une case est fausse, comme ça devrait être la règle pour tous les
exercices ». La bulle ne paraissait qu'à la SORTIE d'une case — le moment où
le garde de la saisie pose la couleur — or un exercice SANS correction en
direct ne peint qu'au clic sur « Vérifier », et l'élève n'y quitte alors
aucune case : les HUIT exercices Python de la Seconde n'en voyaient JAMAIS une
seule, non plus que la lecture graphique, les antécédents, la définition ou
l'écriture des solutions — les seize `kind` que `soutienEnDirect.sans`
déclare. Le défaut vivait exactement dans l'angle mort du contrôle, qui posait
sa case d'essai et la QUITTAIT.
**UN SEUL ENDROIT, ET IL NE CONNAÎT AUCUN EXERCICE** — le motif du garde, tenu
une fois de plus : un observateur de classes posé sur le document, et dès
qu'une correction laisse une case FAUSSE, la bulle se pose sur la PREMIÈRE
d'entre elles. Il n'y avait PAS d'entonnoir de vérification à greffer —
`soutienAgain` n'en sert que dix-neuf sur quarante-six, et les Python écrivent
chacun leur message pour compter les cases vides —, et une liste d'appels à
tenir aurait laissé dehors l'exercice qu'on ajoutera demain.
**LE MOMENT SE RECONNAÎT SANS CONNAÎTRE AUCUN EXERCICE** : une correction en
direct tourne pendant que l'élève ÉCRIT — l'événement qui la déclenche part de
la case qui porte le curseur —, une vérification tourne quand il a quitté ses
cases, le clic parti sur un bouton. Tant qu'une case de l'écran porte le
curseur, on ne lève donc rien : c'est le domaine du garde, et la sortie de
case s'en charge. Deux autres bords, et n'en tenir qu'un ne tient rien : seules
comptent les cases que la correction vient de TOUCHER — une case rouge que
personne ne vient de regarder n'appelle rien, et une correction qui ne repeint
qu'une case ne fait donc pas surgir de bulle à l'autre bout de l'écran — et une
bulle DÉJÀ ouverte sur une case ENCORE fausse ne saute pas ailleurs : elle
emporterait l'explication que l'élève est en train de lire.
**ET ELLE S'EFFACE QUAND IL MODIFIE SA CASE, PLUS QUAND IL Y ENTRE.** C'est un
renversement, et c'est la demande qui l'exige : après une vérification, la page
pose ELLE-MÊME le curseur dans la première case rouge (`soutienAgain`, et les
Python font de même, 40 ms plus tard). L'ancienne règle éteignait donc la bulle
au moment précis où elle venait de naître, sans qu'aucune erreur ne le dise.
Reprendre sa case, c'est la CORRIGER : une frappe, un choix dans une liste — la
promesse ne change pas, elle revient s'il ressort en faux ou à la vérification
suivante. Les deux bancs ont RETOURNÉ leur contrôle plutôt que de le retirer.
**Et une ZONE DE TEXTE est une case comme une autre** : `bexpCible` ne
connaissait que les champs et les listes, quand {python-afficher-variable} et
{python-print} font écrire le programme dans un `textarea` que la correction
peint `bad` — deux exercices sur huit seraient restés dehors même une fois le
moment trouvé.
**Et les BOUTONS de l'écran sont devenus des obstacles** : la bulle paraît
maintenant au moment précis où la rangée d'actions dit « Revérifier », et posée
dessus elle rendrait incliquable le bouton dont l'élève a besoin — la leçon du
pavé numérique, au même endroit. Le coût est MESURÉ plutôt que supposé : sur
les deux écrans témoins du banc navigateur, la bulle trouve toujours un côté et
ne retombe pas au coin.
**Le bloc est le MÊME TEXTE dans les trois fichiers**, comparé au caractère
près : la règle vaut donc pour les trois niveaux, ce que « pour tous les
exercices » demandait.
Deux bancs, la répartition habituelle : jsdom mesure le MÉCANISME sur des cases
posées à la main — une liste, une zone de texte et un champ, les quatre bords,
et les trois refus (copie juste, entraînement, écran verrouillé) — ; le
NAVIGATEUR mesure le GESTE sur le 5.1, déclaré par `bulleVerification` dans
`tests/profils.js` : une copie fausse choisie dans les vraies listes, un vrai
clic sur « Vérifier », la bulle au RECTANGLE — jamais à la propriété `hidden` —
et le bord que lui seul voit : la page pose le curseur dans la case rouge, et
la bulle y SURVIT.
Onze sabotages, chacun rougissant en nommant son défaut — neuf au banc jsdom
(l'observateur débranché, n'importe quelle case rouge au lieu de celles que la
correction a touchées, la bulle qui saute, le garde « l'élève écrit » retiré,
la zone de texte sortie des cibles, le mode et le verrou non relus, la DERNIÈRE
case fausse au lieu de la première, entrer qui efface à nouveau, modifier qui
n'efface plus) et deux au navigateur, dont celui qui nomme le défaut d'origine
en toutes lettres : « la bulle s'est éteinte au moment où la page a posé le
curseur ».

**Et une CASE À COCHER est une case comme une autre.** Demande de Turquet
(septembre 2026) : « faire aussi la bulle pour le 6.14 ».
{suite-vocabulaire} répond par des `<span role="checkbox">` — ni un champ, ni
une liste, ni une zone de texte —, et `bexpCible` ne connaissait que ces
trois-là : la bulle n'y paraissait JAMAIS, à aucun moment. C'est le manque de
la zone de texte des Python, une FAMILLE DE RÉPONSES plus loin.
**TROIS ENDROITS BOUGENT ENSEMBLE, ET N'EN TENIR QU'UN NE TIENT RIEN.**
· La CIBLE : c'est le RÔLE qui désigne une case à cocher (`role="checkbox"`),
  jamais une classe propre à un exercice — la bulle ne connaît aucun exercice,
  et {suite-vocabulaire} n'est nommé nulle part dans son bloc.
· La SAISIE : un `<span>` n'a pas de `.value`, et sans cette moitié la bulle
  enverrait au modèle une saisie VIDE en lui demandant d'expliquer l'erreur.
  Elle lit donc le LIBELLÉ — « Croissante. », la règle du badge de
  `corrChoix` —, la COCHE retirée : celle-ci est un ornement (`aria-hidden`)
  dont le texte ne dit rien, ✓ ou rien du tout selon la feuille de styles.
· Les OBSTACLES : les trois choix d'un groupe vivent sur UNE rangée, et une
  bulle posée sur la case d'à côté rendrait incliquable celle que l'élève doit
  corriger — la leçon du pavé numérique, au même endroit. Le garde de l'ancre
  (`contains`) écarte en effet la RANGÉE entière, donc sans ce bord la place
  de ses voisines redevient libre.
**LA RANGÉE N'EST PAS UNE CIBLE, et c'est le bord silencieux** : elle porte
elle aussi le verdict du groupe — `svqPeindre` peint le `<div>` ET la case — et
elle PRÉCÈDE la case dans le document, donc c'est elle que la bulle
choisirait, flèche pointée sur trois choix à la fois. Le RÔLE la départage :
un conteneur n'en a pas.
**Et le contexte dit COCHER, non « écrire »** : « l'élève vient d'écrire
"Croissante." » ferait parler le modèle d'une saisie qui n'a jamais eu lieu, et
il répondrait à côté. La clause de secret ne bouge pas — elle nomme seulement
l'autre façon de livrer la réponse (« la case à cocher » au lieu de « la valeur
à écrire dans cette case »).
**Le bloc est le MÊME TEXTE dans les trois fichiers**, comparé au caractère
près : la Seconde et la Première ne posent aujourd'hui aucun `role="checkbox"`
(mesuré : 0 dans les deux fichiers), le changement y est donc inerte — et
c'est le signe qu'il ne connaît aucun exercice, pas une raison de ne l'écrire
qu'en Terminale.
Deux bancs, la répartition habituelle : jsdom mesure le MÉCANISME sur une case
posée à la main DANS sa rangée — la cible, le libellé la coche retirée, le
contexte, et l'obstacle par la GÉOMÉTRIE seule (sans la case à cocher la bulle
est à droite, avec elle à gauche) ; le NAVIGATEUR mesure le GESTE sur le 6.14
même — le mode soutien, la case cochée à tort, un vrai clic sur « Vérifier »,
la bulle au RECTANGLE (jamais à la propriété `hidden`) et sa pointe LUE sur le
décalage EN USAGE du pseudo-élément, à moins de 8 px de la case et sur son
CENTRE.
**ET CE QUE LA MESURE A MONTRÉ VAUT D'ÊTRE DIT** : sur cet écran la bulle se
pose à GAUCHE du groupe, c'est-à-dire SUR le quadrillage — un dessin n'est pas
une case, donc pas un obstacle. Les trois choix d'un groupe prennent toute la
largeur de la fiche, et il n'y a nulle part ailleurs les 288 px qu'il faut.
Faire du dessin un obstacle renverrait la bulle au COIN, où sa flèche ne
désigne plus rien, et toucherait les quinze exercices à dessin des trois
niveaux : c'est une décision à prendre, pas une correction technique.
**Sept sabotages, chacun rougissant en nommant son défaut** — le rôle retiré de
`bexpCible` (quatre rouges d'un coup : la bulle ne se pose plus, la saisie part
vide, le contexte reparle d'écrire), le libellé perdu parce qu'on relit
`.value` sur un `<span>`, la coche laissée dans le libellé
(« ☑Croissante. »), la RANGÉE rendue cible elle aussi (« ancrée sur la rangée
entière : true »), les cases à cocher retirées de la requête des obstacles (la
bulle repasse à droite, sur la case d'à côté), le contexte qui dit « écrire »
devant une case qu'on coche, et la clause de secret retirée.
**Et le premier sabotage a montré un DÉTAIL DE MESSAGE qui ne nommait rien** :
« ancrée sur la rangée entière : false » est vrai des deux défauts opposés — la
bulle posée sur la rangée, et la bulle qui ne se pose nulle part. Le détail dit
les DEUX états désormais (« sur la rangée : false, sur la case : false »), et le
sabotage qui débranche la cible se distingue de celui qui déplace l'ancre.

**`numeros()` ne passe que par trois entonnoirs.** Les références s'écrivent
`{identifiant}` et sont résolues par `cardHTML`, `rappelHTML` et
`conseilCtxCourant` — pas ailleurs. Un libellé posé dans un `innerHTML` par une
fonction de rendu y échappe donc entièrement : « Baisse suivie d'une baisse »
affichait à l'élève « comme dans {diminuer-pourcentage} », accolades comprises,
sur deux étapes. Aucun banc ne pouvait le voir — celui qui existait interdit les
numéros EN DUR, exactement l'inverse. Ça ne s'est vu que sur une capture de
l'écran. Le rendu passe maintenant par `numeros()`, et le banc navigateur
refuse toute accolade `{…}` désignant un exercice connu qui resterait affichée.
