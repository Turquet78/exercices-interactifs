# Conventions du projet

Exercices de mathématiques interactifs pour trois niveaux, hébergés sur GitHub
Pages. Trois fichiers HTML **monolithiques** — HTML, CSS et JavaScript dans le
même fichier, sans étape de compilation :

| Fichier | Niveau | Tables Supabase |
|---|---|---|
| `secondes.html` | Seconde | `eleves_2nde`, `resultats_2nde`, `signalements_2nde` |
| `premiere-specifique.html` | Première | `eleves_1ere`, `resultats_1ere`, `signalements_1ere` |
| `terminale.html` | Terminale | `eleves`, `resultats`, `signalements` |

Les trois partagent un seul projet Supabase et la même fonction Edge
`corriger-definition` (aide par IA). Communication en français.

---

## Règles absolues

**1. `main` publie immédiatement — et seul Turquet décide du moment.** GitHub
Pages sert `main` : toute fusion met le site sous les yeux des élèves dans la
minute. Le travail se fait toujours sur une branche, puis passe par une pull
request que Claude prépare et teste (action « Contrôles » verte, modification
réellement exécutée — règle 3). Claude annonce alors « prêt à mettre en
ligne » et **attend que Turquet dise explicitement « mets en ligne »** (ou un
équivalent clair) dans la conversation ; Claude fusionne à ce moment-là,
vérifie la publication, et jamais avant (décision de Turquet, août 2026).
Jamais de poussée directe sur `main`.

**Et Claude joint le fichier HTML de la branche à cette annonce, toujours**
(décision de Turquet, août 2026). Pas une capture d'écran : le fichier, que
Turquet ouvre dans son navigateur pour cliquer lui-même. Les pages sont
monolithiques et sans étape de compilation — le fichier de la branche EST la
page, il suffit de l'ouvrir. Une capture ne montre qu'un écran choisi par
Claude ; le fichier laisse regarder ce que Claude n'a pas pensé à montrer, et
c'est précisément là que se logent les défauts qu'un banc ne voit pas.
Deux avertissements l'accompagnent, parce qu'ils ne se devinent pas : le
fichier porte l'adresse du VRAI projet Supabase, donc naviguer est sans danger
mais **terminer un exercice écrit une vraie note sur un vrai élève** ; et un
aperçu hébergé ne remplacerait pas le fichier — les appels sortants y sont
bloqués, ni Supabase ni MathLive ne répondraient.

**2. `npm test` avant toute proposition.** Aucune modification n'est poussée si
les contrôles échouent. `npm test` contrôle **les trois niveaux**, chacun selon
son profil (`tests/profils.js`). L'action GitHub `.github/workflows/controles.yml`
les rejoue tous les trois sur chaque pull request, une étape par fichier : elle
doit être verte avant fusion. Voir `tests/LISEZMOI.md`.

**3. Ne jamais livrer sans avoir exécuté.** Une vérification de syntaxe ne prouve
rien. Trois pannes en production sont passées à travers des contrôles statiques
parfaitement verts — leur point commun était que personne n'avait ouvert la page.
`npm run test:navigateur` ouvre les trois pages dans un vrai Chromium et fait un
exercice de bout en bout : c'est le seul banc qui voit ce qui s'affiche.

**4. Incrémenter `APP_VERSION`** à chaque modification. Ce numéro s'affiche dans
l'en-tête et permet de savoir d'un coup d'œil quelle version est ouverte.

---

## Pièges éprouvés

Chacun a coûté une panne en production. Ils ne se voient pas à la relecture.

**Bloc CSS tronqué** — une règle coupée déséquilibre les accolades et les
panneaux flottants restent affichés en permanence. Contrôlé par `npm test`.

**Supabase renvoie ses erreurs sans lever d'exception.** Toujours tester `error`
explicitement. Les colonnes `integer` échouent silencieusement si on y insère une
durée décimale : arrondir avant l'envoi.

**`<!DOCTYPE html>`** — son absence déclenche le mode quirks et casse la mise en
page sur mobile.

**`esc()` ne protège pas un attribut `onclick`.** Une chaîne posée là traverse
deux analyseurs : l'analyseur HTML décode `&#39;` en `'` *avant* que JavaScript
ne lise la chaîne, et l'apostrophe la referme. Le prénom étant choisi librement
par l'élève, « O'Brien » tuait le bouton du professeur et « `',alert(1),'` » y
exécutait du code. Toute interpolation dans un attribut d'événement passe par
`escJS()`, jamais `esc()` ; `esc()` reste correct pour le texte et pour les
attributs ordinaires. Deux contrôles le vérifient — l'un que `escJS` est appelé,
l'autre qu'il protège vraiment.

**L'authentification vit dans Supabase, pas dans la page.** Le code d'un élève
est haché par Supabase et vérifié par lui : `signInWithPassword`, jamais une
comparaison en JavaScript. Le mot de passe du professeur est celui d'un compte
Supabase ordinaire, et l'appartenance à la table `professeurs` est revérifiée
après la connexion. Ne jamais lire la table des élèves avec `select('*')` : c'est
ainsi que tous les codes de la classe partaient dans le navigateur. Les gestes
qui demandent des droits — nouveau code, ajout, retrait — passent par la fonction
Edge `admin-eleve`. Le socle SQL et sa notice sont dans `supabase/`.

**Les trois niveaux n'ont pas le même type d'identifiant.** `eleves.id` et
`eleves_2nde.id` sont des `uuid`, `eleves_1ere.id` est un `bigint`. Un code qui
écrit un `uuid` dans `id` marche donc sur deux niveaux et casse le troisième.
L'application n'écrit plus `id` — la base le produit — et l'adresse du compte
Supabase est dérivée de la colonne `cle`, indépendante du type.
`tests/base-avant.sql` reproduit la structure **relevée sur le projet**, pas
supposée : c'est une reconstitution de mémoire qui a laissé passer ce défaut.

**Une suppression que RLS refuse n'est pas une erreur.** C'est le piège le plus
coûteux du projet : une ligne qu'on n'a pas le droit de toucher est une ligne
qui n'existe pas, et PostgREST répond « 0 ligne » — pas « refusé ». La migration
001 n'avait donné à l'élève que le droit d'INSÉRER dans la table des résultats,
alors que la mise en pause y fait trois gestes : insérer, faire avancer, effacer.
Les deux derniers étaient donc refusés en silence. Le brouillon n'avançait
jamais, il n'était jamais supprimé — ni à la fin d'un test ni à l'abandon —,
l'exercice restait proposé « à reprendre » indéfiniment pendant que la page
annonçait « Exercice abandonné ✓ », et chaque tentative laissait une ligne
fantôme de plus. Aucun banc ne pouvait le voir : `npm test` remplace Supabase
par un double sans règles d'accès, et `npm run test:base` n'exigeait que des
REFUS — jamais qu'un geste normal de l'application marche. `004` ouvre le droit,
étroitement (`state='paused'` et sa propre ligne : une note reste intouchable),
le banc de la base exerce désormais les deux bords, et `clearRecovery()` relit
la base après avoir effacé pour que le prochain refus muet se voie tout de suite.

**Une politique RLS grande ouverte annule toutes les autres.** PostgreSQL
combine les politiques permissives par un OU : une seule
`for all … using (true)` suffit à rendre inutiles les trente qui l'entourent.
Le projet en portait neuf, une par table, sous trois conventions de nommage
différentes — un correctif qui aurait filtré sur `_all` en aurait raté six.
`supabase/migrations/002` les retire en les nommant. Le banc le démontre : joué
après la seule migration 001, le contrôle des rôles **doit échouer**.

**Un élève prévenu trop tard n'est pas prévenu.** « Attention : Note ton code
dans le carnet de liaison. » s'affiche aux DEUX endroits où un élève se
donne un code — la création de compte et le changement imposé après un code
provisoire (décision de Turquet, août 2026). N'en couvrir qu'un ne couvre
rien : un code oublié se perd aussi bien dans un cas que dans l'autre, et c'est
le second qui arrive le plus souvent, précisément parce que l'élève avait déjà
oublié le premier. Elle dit « ton code » et non « ton mot de passe » : la page
n'emploie que le mot « code », d'un bout à l'autre, et un élève qui lirait deux
mots pour une seule chose se demanderait lequel on lui réclame (décision de
Turquet, août 2026). Elle est posée AVANT le bouton
« Créer mon compte » : sous le bouton elle était parfaitement visible et
parfaitement inutile — l'élève clique, puis lit. Ce défaut ne s'est vu qu'en
regardant la page, pas le code. Quatre contrôles : la phrase, sa mise en
évidence (un style qui reprendrait la couleur du texte courant les
satisferait tous sans rien changer), sa position avant le bouton, et sa
présence dans `imposerChoixCode()`.

**Supabase refuse tout mot de passe de moins de 6 caractères.** L'application
envoie donc `PREFIXE_CODE + code`. Ce préfixe ne protège rien et ne prétend pas
le faire : il satisfait une longueur minimale.

**Les codes font 6 chiffres, et la limitation de cadence de Supabase est le
seul rempart.** Il n'existe aucun verrouillage par compte : la limite est par
adresse IP, et une classe entière partage l'IP de l'établissement. À 200
tentatives par 5 minutes — le réglage qu'exige une classe de 30 —, un code à 4
chiffres se devinait en deux heures ; à 6 chiffres il faut des jours. La
longueur vit à deux endroits : `/^\d{6}$/` dans les trois pages, et
`CHIFFRES_CODE` dans la fonction Edge. Deux contrôles les comparent, et
vérifient que les champs de saisie ne tronquent pas.

**`DOMAINE_COMPTES` et `PREFIXE_CODE` sont écrits à deux endroits que rien ne
relie** — les trois
fichiers HTML et `supabase/functions/admin-eleve/index.ts`. S'ils divergent, les
comptes créés d'un côté deviennent introuvables de l'autre, ou le code affiché
au professeur ne fonctionne pas : l'élève reçoit « Code incorrect » avec le bon
code, sans la moindre erreur nulle part. Deux contrôles les comparent.

**La fonction Edge portait les gestes les plus lourds sans qu'aucun banc ne
l'exécute.** Elle tient la clé de service. `npm run test:fonction` la charge
dans Node — trois substitutions seulement : l'import de supabase-js, `Deno.serve`
et `Deno.env` ; le reste du fichier est exécuté tel quel. C'est ainsi qu'a été
trouvé le défaut qui rendait « Nouveau code » inutilisable pour tout élève
inscrit avant la bascule : la migration ajoute `user_id`, mais vide.

**Une borne posée côté serveur coupe l'aide sans le dire.** L'aide par IA passe
par `corriger-definition`, qui refuse tout contexte plus long que `MAX_CTX` et
répond « Demande de conseil invalide. » — un message qui n'explique rien et que
la page se contente d'afficher. À 8000, cette borne privait d'aide **11 des 30
exercices de la Terminale**, qui envoie 6650 caractères de consignes avant même
le contexte de l'exercice ; la Seconde (1100) et la Première (4900) passaient,
ce qui a d'abord fait soupçonner une différence de payload entre les niveaux —
la Première envoie deux champs de plus. C'était faux : seule la LONGUEUR
comptait. Elle ne protégeait rien, la question de l'élève étant déjà plafonnée à
300 caractères par la page ; elle est à 20000.
La source de la fonction vit désormais dans le dépôt, comme `admin-eleve` : elle
portait l'aide des trois niveaux sans qu'aucun banc ne puisse la lire. Un
contrôle OUVRE chaque exercice, mesure ce qui partirait vraiment et le compare à
`MAX_CTX` lu dans ce fichier — il affiche à chaque exécution le contexte le plus
long et sa marge. Comme pour `admin-eleve`, il compare deux fichiers du dépôt :
il ne voit pas ce qui tourne chez Supabase. Après toute modification, redéployer.

**La fonction Edge ne se met jamais à jour toute seule.** GitHub Pages publie
les trois pages à chaque fusion ; `admin-eleve` se déploie à la main chez
Supabase et peut rester en arrière indéfiniment. Le contrôle qui compare la
longueur des codes lit les *fichiers du dépôt* — il ne voit pas ce qui tourne.
Le seul garde-fou qui le voie est dans la page : elle vérifie la longueur des
codes reçus et avertit. Après toute modification de la fonction, redéployer.

**Une sauvegarde remise en place casse la Première le lendemain.** Réinsérer des
lignes avec leurs identifiants d'origine ne fait pas avancer la séquence qui les
produit : elle repart de 1, et c'est le *premier élève ajouté après* la
restauration qui se heurte à un identifiant déjà pris. Rien ne se voit le jour
de la restauration. Deux autres pièges du même genre : `user_id` pointe vers des
comptes Supabase disparus — la clé étrangère refuse la ligne — et les notes
désignent un élève, donc `eleves…` passe avant `resultats…`. `supabase/restaurer.sql`
désamorce les trois, et `npm run test:base` rejoue la restauration entière sur
un PostgreSQL jetable.

**Le plan gratuit de Supabase ne sauvegarde rien.** L'action
`.github/workflows/sauvegarde.yml` exporte les données chaque nuit du samedi au
dimanche, les chiffre et les conserve 90 jours. Le chiffrement est
obligatoire : le dépôt est public et les artefacts y sont téléchargeables par
n'importe qui, alors que le fichier contient des prénoms d'élèves mineurs
associés à leurs résultats. Les codes ne sont pas sauvegardés — ils sont
hachés — et se redonnent après restauration.

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

**Une opération posée se juge à l'œil, pas au compte.** La grille des
opérations posées (`.mp-op`) est en flexbox à cellules de largeur fixe, et les
rangées sont alignées à droite. Une rangée qui n'a pas le MÊME nombre de
cellules que les autres décale donc le signe et les colonnes : l'opération n'est
plus posée, elle est de travers — et rien dans le code ne le dit. Chaque rangée
compte un `op` puis exactement `nCols` cellules, `nCols` valant 3 d'ordinaire et
4 quand l'addition déborde (999 + 99 = 1098) ; le trait suit la largeur. Les
cases du résultat suivent le RÉSULTAT et non une largeur fixe — une case en trop
se lirait comme un zéro à écrire, et 102 − 97 n'en demande qu'une. Deux
contrôles : l'un compte les cellules et les cases sur les quatre formes, l'autre
MESURE les positions dans un vrai navigateur — seul un navigateur sait où tombe
une colonne.
Les cases de retenue sont facultatives, et **ne sont posées que là où il y a
une retenue** : une case vide à remplir de rien n'apprend rien, et l'élève
finissait par se demander ce qu'on lui demandait (décision de Turquet, août
2026). C'est un arbitrage assumé — la présence d'une case dit désormais où la
retenue tombe. Le tirage garantit qu'il en reste toujours au moins une.
Les deux opérations **alternent**, en commençant par une addition : l'élève
passe d'une technique à l'autre à chaque calcul. Le tirage était auparavant
mélangé — même total, pas le même exercice.
**À la soustraction, la retenue s'écrit à DEUX endroits, pas un.** Méthode par
compensation : le petit `1` devant le chiffre du HAUT — 2 se lit alors 12 — et
la même retenue redescend en `+1` devant le chiffre du BAS de la colonne
suivante. C'est le geste du cahier. La première version n'en posait qu'une, sur
la rangée au-dessus, c'est-à-dire à l'endroit de l'ADDITION : même position,
deux sens opposés — la case s'ajoutait au nombre du bas alors qu'à l'addition
elle entre dans la colonne. Turquet, professeur de mathématiques, n'a pas su la
lire ; aucun élève ne l'aurait pu. L'énoncé le dit maintenant, et il change
selon l'opération. La soustraction n'a donc **que trois rangées** là où
l'addition en a quatre — un contrôle du navigateur qui en exigeait quatre
partout rougissait sur une soustraction parfaitement dessinée.
Les colonnes de cet exercice sont plus larges (`--asp-col`, 78 px mesurés) :
il faut la place d'écrire une marque DEVANT le chiffre sans la poser dessus. La
largeur vit à un seul endroit, le trait la relit.

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

**Croiser les dénominateurs, c'est le MÊME moteur avec une image en plus.**
{croiser-denominateurs} (Seconde) partage tout avec {somme-fractions} — écran,
correction, chaîne d'égalités — et n'ajoute qu'une chose : il MONTRE d'où vient
chaque multiplicateur. Chaque dénominateur est coloré, les cases qui prendront
sa valeur portent son liseré, et deux flèches partent de l'un pour arriver sur
l'autre en se CROISANT (demande de Turquet, août 2026).
C'est la règle « deux exercices peuvent partager un moteur, mais pas leur
identité » : la note passe par `test.qId`, le rappel par `RAPPELS_ID`, les
questions par `QIA_SUGG_ID` — et `qiaSuggestions()` fait primer l'identifiant
sur le `kind`, comme la Terminale le fait déjà. Le moteur, lui, ne gagne qu'une
ligne (`if(test.crd && typeof crdDecorer==='function')`), écrite à l'identique
dans les deux fichiers : la Première n'a pas cette fonction et ne s'en aperçoit
jamais.
**Les dénominateurs sont PREMIERS ENTRE EUX**, et c'est ce qui rend l'exercice
honnête. Le croisement donne alors exactement le PPCM : la méthode montrée et
la méthode libre tombent d'accord. Avec 4 et 6, le croisement donnerait 24
contre 12, et l'élève qui simplifie aurait raison tout en rougissant. On retire
l'ambiguïté au TIRAGE, jamais à la correction — qui reste celle de
{somme-fractions} et accepte tout dénominateur commun : les flèches sont un
appui, pas une contrainte.
**La couleur ne porte jamais seule.** La consigne dit le croisement en toutes
lettres et les flèches le montrent : un écran mal réglé, ou un élève qui
distingue mal les couleurs, doit pouvoir faire l'exercice. Le bleu et l'orange
sont choisis pour ne pas se confondre avec le vert et le rouge de la
correction — ni entre eux pour un daltonien, qui confond justement le vert et
le rouge.
Les flèches sont posées sur des positions MESURÉES après le rendu, et
redessinées quand la fenêtre change : un trait posé sur des coordonnées
supposées se décale au premier changement de police, et personne ne le voit.
Elles partent du dénominateur écrit DANS la ligne — le « 5 » de « 5 × □ » — et
non de la fraction de départ, restée loin à gauche : le premier jet traversait
toute l'égalité et passait sur le « = ».
Un contrôle du banc navigateur mesure les quatre bords, et le premier est le
plus sournois : un liseré qui prendrait la couleur de SA PROPRE fraction ferait
dire au dessin l'inverse de la règle, et l'élève apprendrait le contraire de ce
qu'on enseigne, sans que rien ne rougisse.

**Deux fractions ne s'additionnent qu'au même dénominateur — et le commun n'est
pas imposé.** {somme-fractions} vit en Seconde ET en Première, sur un moteur
unique : le tirage, la pose et la correction sont le même texte dans les deux
fichiers. Une moitié recopiée aurait donné deux exercices qui se contredisent le
jour où l'un des deux change de convention. Les deux niveaux ne diffèrent que par
deux lignes, nommées comme telles : la rangée d'aide (`sfBoutonsAide()` — la
Seconde la pose dans son `…Actions`, la Première la fait poser par `iaBoutons()`)
et l'emballage du contexte (`sfCtxTexte()` rend UNE chaîne, la Seconde en fait une
paire `{nombre, contexte}`, la Première la range dans son `att`).
Le moteur ne s'appuie donc sur aucune aide propre à un niveau : la Seconde a
`ensFracInner`, la Première rend ses fractions par MathLive — il écrit les
siennes (`sfFracInner`).

L'élève complète les multiplications de la mise au même dénominateur, écrit la
somme sur ce dénominateur, puis donne la fraction finale. Trois étapes, celles du
cahier. Un des deux termes peut être un ENTIER : l'étape le montre alors écrit
« 3 = 3/1 » avant les multiplications — le passage par le dénominateur 1 est
DONNÉ, il ne se devine pas.

**Le dénominateur commun n'est pas imposé, et c'est une promesse.** La correction
vérifie que les multiplicateurs de l'élève donnent le MÊME dénominateur des deux
côtés, puis que la suite s'y tient. Multiplier 1/2 et 1/3 par 12 et 8 au lieu de
6 et 4 est une méthode juste, et l'exercice le dit. Comparer au PPCM aurait compté
faux un élève qui a raison — un exercice qui punit une méthode correcte apprend
l'inverse de ce qu'il enseigne. Le multiplicateur, lui, va en haut ET en bas :
c'est ce qui ne change pas la fraction, et c'est tout le sens de l'étape.

**Le tirage écarte quatre questions piégées**, chacune silencieuse. Deux
dénominateurs égaux : il n'y a plus rien à mettre au même. Une fraction de DÉPART
réductible (6/2) : l'élève qui la simplifie d'abord — ce qui est juste — écrit des
multiplicateurs que la correction, calée sur les nombres de l'énoncé, compte faux.
Un résultat négatif ou nul, hors sujet. Un résultat réductible, qui poserait la
question « faut-il simplifier ? » que l'exercice ne traite pas. La dernière étape,
elle, accepte toute fraction ÉGALE, comme partout ailleurs.

Le contrôle EXERCE la vraie correction en posant des valeurs dans les vraies
cases, jamais une réimplémentation — qui se serait trompée du même côté. Il a été
éprouvé en le cassant dix fois, et **deux sabotages l'ont d'abord traversé** :
retirer « le même multiplicateur en haut et en bas », et faire lire 1 dans une
case vide. Les deux étaient masqués par la règle du même dénominateur, qui
rougissait la première. Il fallait des cas choisis pour que TOUT LE RESTE soit
juste — ×5 en haut et ×3 en bas donne encore 6 au dénominateur, et une case vide
ne se voit que là où le multiplicateur attendu vaut 1.

**Une case juste ne doit pas rougir parce qu'une AUTRE est vide.** La correction
en direct du mode soutien ne juge un groupe qu'une fois TOUTES ses cases
remplies. L'élève tapait 1 dans « 2 × □ », passait à la case du dessous, et la
première virait au rouge : sa jumelle était encore vide, donc la paire ne se
jugeait pas — mais elle se colorait quand même. La note finale, elle, était
juste ; **seule la couleur mentait**, ce qui est exactement ce qui l'a laissée
passer. Et l'étape ① est UN groupe de QUATRE cases, pas deux paires : la règle
qu'elle vérifie — le même dénominateur des deux côtés — parle des deux fractions
à la fois, et juger la première pendant que la seconde est vide, c'est la
déclarer fausse parce qu'il manque une case ailleurs. La Terminale avait déjà
appris cette règle sur ses groupes du 6.1 ; elle n'avait pas gagné la Seconde.

**Et la VÉRIFICATION portait le même défaut, en pire.** La correction en direct
avait été réparée, pas celle du bouton « Vérifier » : là, une case juste rougissait
toujours parce qu'une autre était vide. Sur « 8/5 + 4/9 », l'élève écrit 9 et 9
sous la première fraction, vérifie avant d'avoir rempli le reste — ses deux cases
deviennent ROUGES et la note annonce « 0 case juste sur 9 ». Elles ne l'étaient
que parce que `memeD` réclame les DEUX paires : une case comptée fausse à cause
d'une case restée vide AILLEURS. Cette fois **la note mentait aussi**, et elle
partait en base. Rien ne rougissait nulle part ; c'est Turquet qui l'a vu en
cliquant, ce que ni `npm test` ni le banc navigateur ne faisaient — les deux
remplissaient toujours TOUTES les cases avant de vérifier.
Une paire seule se juge donc sur ce qu'elle PROMET : le dénominateur qu'elle
produit doit pouvoir devenir commun, c'est-à-dire être un multiple de l'autre
dénominateur. 5 × 9 = 45 est un multiple de 9, la paire tient ; 5 × 2 = 10 n'en
est pas un, elle ne mène nulle part et rougit. **Aucun dénominateur commun n'est
imposé pour autant** — 90 passe comme 45, c'est la promesse de l'exercice. Quand
les deux paires sont posées, elles doivent redevenir d'accord entre elles. Et
l'étape ② se juge de même sur SA ligne : le dénominateur commun est celui que
l'élève a ÉCRIT, les deux numérateurs doivent le suivre, et une paire de l'étape
① déjà posée doit s'y accorder.
Le message aussi mentait : « Il faut le MÊME dénominateur des deux côtés »
devant une copie dont il manquait sept cases. Une case vide n'est pas une erreur
de calcul, et la correction le dit maintenant avant tout le reste.
Cinq bords contrôlés, et n'en tenir qu'un ne tient rien : la paire seule qui MÈNE
quelque part est juste, celle qui ne mène nulle part reste fausse — sans ce
second bord, « toujours vrai » passerait —, deux paires divergentes restent
fausses toutes les deux, l'étape ② ne suit pas une étape ① qui dit autre chose,
et les cases vides se voient.

**Et le même défaut vivait une couche plus bas : DANS la paire.** Corrigé le
matin entre les deux fractions, il a été resignalé l'après-midi : sur
« 1/5 − 1/8 », l'élève écrit 8 dans la case du HAUT, laisse sa jumelle vide,
vérifie — et son 8, le bon multiplicateur, rougit. La paire réclamait ses DEUX
cases pour se juger, et posait quand même du rouge sans avoir tranché. Corriger
un seul des deux étages ne corrigeait rien.
La règle vaut donc à toutes les profondeurs : **un groupe se juge sur les cases
que l'élève a ÉCRITES**. Un multiplicateur se met en haut comme en bas, donc
les deux cases portent le même nombre — une seule suffit à le désigner, et se
juge sur ce qu'elle promet. L'étape ② se juge sur le dénominateur écrit, à
défaut sur celui que l'étape ① annonce. La fraction finale à moitié écrite se
juge de même : le résultat étant irréductible, toute fraction égale s'écrit
N×t sur D×t. Et **une case vide ne reçoit plus aucune couleur** — elle reçoit
la correction en bleu, ce qui est autre chose.
**Un garde-fou va avec, et sans lui le correctif ouvre un trou** : chaque étape
se jugeant sur ce qui est écrit, une demi-copie peut passer aux quatre verdicts
verts. Elle vaudrait alors le point entier, et ses cases vides ne recevraient
même pas la correction — l'application les tenant pour terminées. `allOk`
exige donc aussi qu'aucune case ne soit vide.
Trois sabotages sont d'abord passés au vert, et chacun disait la même chose :
le contrôle ne mesurait pas ce qu'il avait l'air de mesurer. Le report du
dénominateur depuis l'étape ① n'était éprouvé que par des copies qui écrivaient
ce dénominateur ; le garde-fou de la demi-copie n'était éprouvé que sur `vide`,
jamais sur la note ; et l'accord des deux étapes n'avait aucun cas où elles se
contredisent. **Un contrôle qui passe au vert sous le sabotage n'est pas un
contrôle trop faible : c'est un contrôle qui parle d'autre chose.**

**Un terme ENTIER s'écrit avec la même encre qu'une fraction.** Écrit en
`f-whole` — 2 rem, une autre couleur — il dépassait des fractions voisines :
« 7/6 + 9 » avait un 9 deux fois plus gros que le 7, et le « + » ne tombait plus
sur le trait. On lui donne donc la FORME d'une fraction sans barre
(`.sf-f.sf-ent`) : même colonne, même centrage, son milieu tombe là où tomberait
le trait, et le signe s'aligne dessus tout seul. L'énoncé, lui, passe en rangée
flex centrée : en texte ordinaire, `vertical-align:middle` place chaque terme
selon SA hauteur, et un terme à un étage n'a pas le même milieu qu'un terme à
deux — le signe tombait 15 px au-dessus du trait. Les espaces y sont
INSÉCABLES : dans une rangée flex, une espace ordinaire entre deux éléments
disparaît. Le banc navigateur mesure les deux endroits, l'énoncé et le début de
la ligne ; aucun banc hors navigateur ne sait où tombe un trait.

**Les deux opérations alternent, en commençant par une addition** (décision de
Turquet, août 2026) — comme les opérations posées, et pour la même raison :
tiré au hasard, le même total sortait, mais pas le même exercice. Le repli du
tirage suit l'opération demandée ; rendre une addition là où l'alternance attend
une soustraction la romprait sans que rien ne le dise.

**Une correction en bleu posée dans une fraction en déplace le trait.**
`corTrainDec()` insère son badge juste après la case. Nu dans une fraction, il
élargissait le trait ; sous le dénominateur commun, il tombait carrément hors de
la fraction, une ligne plus bas. Chaque case est donc ENVELOPPÉE (`.sf-case`),
et le badge s'y pose hors du flux. La place à droite du premier numérateur n'est
prise que LÀ OÙ une correction existe (`:has(.mf-cor)`) : l'écran de l'élève qui
travaille reste serré, et un navigateur sans `:has` retombe sur un petit écart,
pas sur la superposition. Un banc MESURE tout cela dans un vrai Chromium — aucun
chevauchement entre un badge et de l'encre, et un trait aussi large que ce qu'il
sépare.

**Une fraction empilée se lit « 83 » quand on la met à plat.** La Première envoie
l'ÉCRAN au modèle, aplati en texte : « Calcule 1 + 83 » contredisait, dans le même
message, le « 1 + 8/3 » que le contexte venait de dire. La barre oblique est donc
écrite dans le HTML et cachée à l'œil (`.sf-lu`).

**La fenêtre des tables de multiplication est arrivée en Seconde** avec cet
exercice. Elle n'y a pas de bord « antisèche » : la Seconde n'a aucun exercice de
rapidité, donc aucun écran où la fenêtre devrait se refermer. Ce manque est
DÉCLARÉ (`tablesAide` sans `referme`), et le banc affiche « non applicable » sur
ce seul bord en continuant d'exiger l'autre. Le contrôle du navigateur s'y est
d'ailleurs pris en défaut lui-même : pour vérifier que la fenêtre RESTE ouverte,
il cliquait « l'énoncé, sinon l'écran entier » — en Seconde il n'y a pas d'énoncé
à cet endroit, Playwright visait le CENTRE de l'écran, c'est-à-dire sous la
fenêtre, qui interceptait. Trente secondes d'attente, puis un échec qui accusait
la page alors que le banc n'avait jamais cliqué l'exercice. Il calcule maintenant
un point de l'écran HORS du rectangle de la fenêtre.

**Un résidu invisible rend fausse une réponse juste.** C'est le pire défaut
possible : l'exercice apprend l'inverse de ce qu'il enseigne, et rien ne rougit
nulle part. Un élève de Terminale l'a signalé en août 2026 sur le 2.1 — sa copie
était juste d'un bout à l'autre, « 2 » et « 4x » étaient rouges, « 4 » vert, note
« 10 cases justes sur 12 ». Les deux cases fautives portaient un exposant VIDE
(`2^{}`), laissé par une touche effleurée : MathLive n'affiche RIEN pour un
exposant vide, si bien qu'il n'y a strictement rien à voir à l'écran ; seul
l'évaluateur le voit, et `new Function('return (2**())')` lève, donc la case ne
compile pas, donc elle est rouge. La troisième case, propre, restait verte — d'où
la signature ✗ ✗ ✓, qui a d'abord fait chercher une erreur d'appariement des
termes alors que le défaut était dans la LECTURE.
Le nettoyage existait déjà — `saClean()`, écrit pour le 6.2, dont le commentaire
disait mot pour mot « sans quoi une bonne réponse comme "3" suivie d'un résidu
invisible est comptée fausse ». Il n'avait simplement jamais été branché sur les
autres lecteurs : `dexpCellValue()` en Terminale (66 appels, toute la famille des
dérivées), `pmPlain()` en Seconde et en Première (la greffe qui donne `.value` à
chaque `math-field`). Une leçon apprise dans un coin ne protège pas les autres.
**Un signe seul n'est pas un résidu** : dans une case de coefficient, « + » vaut
+1, et le nettoyer viderait la case — donc si le nettoyage rend une chaîne vide,
on garde ce que l'élève a écrit. Les deux bords sont contrôlés, et n'en tenir
qu'un ne tient rien.
Le contrôle vit dans le banc navigateur : jsdom n'a pas MathLive, donc aucun
résidu à produire. Il éprouve le lecteur de chaque niveau sur un vrai
`<math-field>`, résidu par résidu, et rejoue en Terminale la copie de l'élève de
bout en bout — d'ABORD sans résidu (si elle ne passe pas au vert ainsi, c'est le
contrôle qui a tort, pas la page), puis avec. Le sabotage rend le signalement au
mot près : « 10/12 cases vertes, rouges : dexp-s3a, dexp-s3b ».

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

**Un devoir demande une fois chaque exercice, et tous sont ouverts.** Il a su
un temps en demander plusieurs passages et en verrouiller un tant que les
précédents n'étaient pas faits ; c'est retiré, éditeur compris (décision de
Turquet, août 2026). La leçon reste : la liste des exercices d'un devoir est
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

**`numeros()` ne passe que par trois entonnoirs.** Les références s'écrivent
`{identifiant}` et sont résolues par `cardHTML`, `rappelHTML` et
`conseilCtxCourant` — pas ailleurs. Un libellé posé dans un `innerHTML` par une
fonction de rendu y échappe donc entièrement : « Baisse suivie d'une baisse »
affichait à l'élève « comme dans {diminuer-pourcentage} », accolades comprises,
sur deux étapes. Aucun banc ne pouvait le voir — celui qui existait interdit les
numéros EN DUR, exactement l'inverse. Ça ne s'est vu que sur une capture de
l'écran. Le rendu passe maintenant par `numeros()`, et le banc navigateur
refuse toute accolade `{…}` désignant un exercice connu qui resterait affichée.

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
Le menu, lui, garde sa colonne : c'est du texte, et une ligne de 1400 px ne se
lit pas (décision de Turquet, août 2026).
*Et les étapes étaient écrites en blocs séparés.* Le pourcentage passe de trois
`pt-step` à un seul ; augmenter et diminuer de cinq à deux — le coefficient est
une AUTRE égalité, elle garde son bloc — plus la pose facultative, renvoyée à la
fin : elle coupait la chaîne en son milieu, entre le « × valeur » et son
résultat. Les libellés fusionnent avec le point médian de la Première :
« ② coefficient × valeur de départ · ③ multiplier les fractions · ④ le résultat ».

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

**Portage depuis `terminale.html`** — ne jamais extraire par script en filtrant
sur `function`, `const` et `let` : les affectations comme
`window.__fenetresDetachees = […]` et les redéfinitions de `$` sont invisibles à
ce filtre. Deux pannes sont nées exactement de là.

**Un brouillon de pause désigne quatre choses, pas une.** L'exercice, le mode,
le devoir, et — en Première — le passage. Trois endroits en avaient chacun leur
idée : l'écran des modes en montre deux, un par mode, mais ne regardait pas le
devoir ; l'écran d'un devoir n'en montre qu'un, celui de ce devoir et de ce
passage ; et l'effacement ne regardait ni le devoir ni le passage. Un seul
abandon emportait donc la pause de tous les autres passages, des autres devoirs
et du travail libre — du travail en cours perdu, sans le moindre message ; et le
menu libre proposait de reprendre un brouillon né dans un devoir, si bien qu'y
« reprendre » relançait en douce une tentative de devoir. `memeBrouillon()` en
décide maintenant seule, et les trois écrans la partagent — **ce que l'écran
montre et ce que l'effacement retire doivent être la même chose**, sans quoi
corriger un seul des deux côtés ne corrige rien.

**Abandonner ne pose aucune note, et n'efface que la pause de son mode.** Le
même bouton faisait trois choses selon l'endroit : rien en Première, une note
partielle « sur ce qui a été fait » en Seconde et en Terminale, et la note des
calculs déjà sus aux tables de multiplication — un élève qui renonçait repartait
donc avec une note qu'il n'avait pas demandée. Abandonner ne touche plus à la
progression (décision de Turquet, août 2026) ; `tmAbandon()` a disparu et
`tmFinir()` ne sert plus qu'à la vraie fin, tous les calculs sus. Le mode, lui,
n'est jamais élargi : l'entraînement et le soutien sont deux travaux distincts,
que l'écran des modes montre côte à côte, et abandonner l'un ne jette pas
l'autre. Et l'abandon **dit la vérité** : si la base refuse d'effacer,
l'exercice est toujours en pause, et l'élève l'apprend au lieu de lire
« abandonné ✓ » puis de retrouver sa pause intacte. Le contrôle du mode tient
les deux bords, parce que chacun a son défaut : trop étroit, l'exercice reste en
pause dans le mode qu'on vient d'abandonner ; trop large, il emporte le travail
d'à côté. Celui de la note en a deux aussi — l'un exerce la vraie fonction
contre le double de la base, l'autre lit le corps d'`abandonTest()` pour qu'une
branche propre à un exercice ne puisse pas y ramener une note sans être vue.

**Cinq oublis silencieux en ajoutant un exercice.** Cinq des quinze
branchements n'étaient contrôlés par rien. Aucun ne casse quoi que ce soit : ils
retirent une aide, une correction ou une note, et personne ne s'en aperçoit
avant qu'un élève ne bute dessus un soir. Trois d'entre eux avaient déjà laissé
passer un manque, trouvé le jour où le contrôle a été écrit.

*Hors de `THEMES`, un exercice est inatteignable.* `TESTS` dit ce qu'il est,
`THEMES` où il se trouve, et rien ne les relie : absent de `THEMES`, il
n'apparaît ni dans le menu de l'élève, ni dans le tableau du professeur, ni dans
le total d'un devoir, et il n'a pas de numéro — le numéro EST sa position. Un
exercice volontairement retiré du menu mais gardé dans `TESTS` pour que ses
vieilles notes gardent un nom se déclare (`horsThemes` ; la Terminale en a deux).

*La réserve du bas.* `#testCtrls` — « Pause », « Abandonner » — est en position
fixe en bas de l'écran. Sans `padding-bottom:84px` sur l'écran de l'exercice, il
recouvre la dernière ligne : la case est là, l'élève ne peut ni la lire ni la
toucher. La liste des écrans est écrite à la main en CSS, à côté de
`testScreens`, et les trois fichiers avaient divergé — la Seconde nommait huit
écrans de la Terminale, dont aucun n'existe chez elle, et ne couvrait donc aucun
de ses propres exercices.

*`liveCheckCurrent()`.* L'oublier laisse un exercice où le mode soutien ne
corrige plus rien pendant la saisie : l'élève remplit tout, ne voit aucune
couleur, et croit l'exercice cassé. Un exercice qui corrige autrement se déclare
(`soutienEnDirect.sans`) plutôt que d'affaiblir le contrôle pour tout le monde.

*`QIA_SUGG`.* Sans entrée, la fenêtre « Question à l'IA » retombe sur deux
questions passe-partout, sans rapport avec ce que l'élève a sous les yeux :
l'aide est là, elle ne sert plus à rien. Trois écrans de la Terminale étaient
dans ce cas. Une clé sans écran reste licite — la Première en a une, `dimq`,
choisie à la volée.

*`details.test`.* Le plus coûteux : la note part sous l'identifiant d'un autre
exercice, ou sous un identifiant que rien n'affiche. Elle est bien en base,
l'élève voit son résultat, et elle a disparu de son bilan comme du tableau du
professeur. Un contrôle vaut pour les trois fichiers — aucun identifiant écrit
dans une note ne doit être étranger à `TESTS` ; l'autre ne vaut que pour la
Première, seule à épingler l'identifiant dans chacune de ses quatorze fins de
test (les deux autres enregistrent sous `currentTestId`, celui du menu, où tout
exercice est atteignable par construction). Huit identifiants de la Première ne
sont atteignables que par le paramètre d'un démarreur partagé —
`startA2Q('augmenter-taux-addition', …)` — : les chercher comme littéraux en
aurait manqué le tiers.

**Un PDF déposé vit à deux endroits, et le second se perd en silence.** Le
professeur dépose ses cours depuis l'onglet « Cours en PDF » de son tableau de
bord. Le FICHIER va dans un bucket Supabase ; ses MÉTADONNÉES vont dans
`parametres_….valeurs.cours`, à côté des devoirs — même ligne, mêmes droits,
aucune table de plus. Le lien entre les deux n'est tenu par rien, d'où quatre
bords.
*La suppression que RLS refuse*, encore : `storage.remove()` rend la liste de ce
qui a été retiré, et un refus est une liste VIDE, sans erreur. On la compte,
sinon la page annonce « supprimé ✓ » sur un fichier toujours en ligne.
*L'orphelin* : un dépôt qui réussit suivi d'un enregistrement qui échoue
laisserait un fichier en ligne que plus rien ne désigne — invisible, et
décompté du quota ; il est retiré, et si ce retrait échoue à son tour, on le
dit. *Les devoirs d'à côté* : l'enregistrement relit la configuration avant
d'écrire, sans quoi il effacerait les devoirs de la classe sans un mot.
*L'onglet avant l'attente*, enfin : `window.open()` appelé APRÈS un `await` est
bloqué par Chrome comme une fenêtre surgissante — le professeur clique, rien ne
s'ouvre, aucune erreur nulle part. L'onglet naît donc AVANT la demande
d'adresse et la reçoit ensuite ; seul un vrai navigateur peut le voir, jsdom
n'ayant pas de bloqueur.

**Ces PDF ne s'affichent PAS dans cette application, mais sur le portail**
(dépôt `Turquet78/site-maths`, `turquet-math974.netlify.app`), dans « Cours et
exercices » du niveau, à côté des fiches versées dans `fiches/` (décision de
Turquet, août 2026). Le panneau qui les montrait à l'élève dans la page des
exercices a donc été retiré ; un contrôle du banc navigateur exige qu'il ne
revienne pas — les mêmes PDF à deux endroits, ce sont deux vérités possibles le
jour où l'une des deux cesse d'être à jour.
**Le bucket est PUBLIC depuis la migration 006, et il devait l'être** : le
portail n'a aucun élève connecté, donc aucun moyen de demander une adresse
signée. Un bucket privé y afficherait des cartes qui n'ouvrent rien. Ces PDF
sont ainsi au même niveau d'exposition que les fiches du dépôt, publiques
elles aussi ; l'écriture, elle, reste au seul professeur, et la migration 006
échoue bruyamment si une politique d'écriture s'ouvrait à `anon`.
**Deux dépôts que rien ne relie, et c'est le piège qui reste.** Le portail
reconstruit l'adresse du PDF lui-même —
`…/storage/v1/object/public/cours/<chemin>` — à partir du nom du bucket et du
chemin rangé dans `valeurs.cours`. Renommer le bucket, ou changer la forme des
chemins produits par `coursChemin()`, laisserait des cartes qui n'ouvrent plus
rien : aucun banc ne le verrait, les deux moitiés vivant dans des dépôts
séparés. Le portail, lui, tient ses deux sources séparément : les fiches
s'affichent dès que `fiches.json` arrive, sans attendre Supabase, et une base
muette ne doit jamais emporter l'autre source.

**La porte du professeur n'a plus de poignée.** L'écran « Choisis ton rôle » et
son bouton « Je suis le professeur » ont disparu : la page s'ouvre directement
sur la connexion de l'élève, et le tableau de bord s'atteint par l'adresse
`…#prof`, que le professeur met en favori (décision de Turquet, août 2026).
**Ce n'est pas une protection, et le croire serait le vrai danger** : le mot de
passe du compte Supabase et la table `professeurs`, revérifiée après la
connexion, restent le seul verrou — l'adresse traîne dans l'historique du
tableau blanc de la classe. Ce que ça retire, c'est l'invitation.
Trois bords, tenus par cinq contrôles. *Aucun attribut d'événement ne doit
mener à `teacher-login`* : un bouton remis « pour dépanner » rouvrirait la porte
à la classe entière sans que rien ne le dise. *Le fragment est le même sur les
trois niveaux* — le professeur n'a qu'une habitude, pas trois — et le banc
navigateur OUVRE la page avec, parce qu'un fragment qui cesserait d'aiguiller
enfermerait le professeur dehors, sans autre chemin et sans erreur nulle part.
*Et l'écran supprimé ne doit plus être nommé nulle part* : `show('home')` ne
lève pas une erreur discrète, il cherche un écran absent, `$('scr-home')` vaut
`null`, et la navigation se fige sur place — le banc l'a montré tout de suite
sur deux contrôles qui s'en servaient comme d'un écran quelconque.
**Un seul favori pour trois niveaux : `prof.html`, et le mot de passe AVANT
les trois portes.** Une quatrième page qui ne fait qu'aiguiller — trois liens
vers `…#prof` —, mais elle demande d'abord le mot de passe et ne montre les
niveaux qu'ensuite (décision de Turquet, août 2026). **Ce n'est pas un verrou
de plus : c'est le MÊME, posé un cran plus tôt.** Elle appelle donc Supabase
comme les trois pages — `signInWithPassword`, puis l'appartenance à
`professeurs` revérifiée après la connexion — et **le mot de passe n'est pas
écrit dedans** : le dépôt est public, un code posé là serait lisible par
n'importe qui. Un contrôle refuse qu'un mot de passe y revienne, sous forme de
constante comme de comparaison.
Ce que ça retire, c'est la vue : un élève qui tombe sur l'adresse ne voit plus
les trois portes du tableau de bord. Ce que ça ne retire pas : rien du verrou,
qui reste entier et côté serveur.
**La session est partagée par les quatre pages** — même domaine, même projet.
Cliquer un niveau ouvre son tableau de bord directement, sans redemander le mot
de passe (`reprendreSessionProf()`, qui demande son avis au SERVEUR, jamais à la
page), et **« Quitter » un niveau ramène à `prof.html`** avec les trois liens
toujours ouverts. C'est un arbitrage assumé : « Quitter » ne ferme plus la
session — sans quoi passer de la Terminale à la Seconde redemanderait le mot de
passe à chaque fois. C'est « Se déconnecter », sur la page d'aiguillage, qui la
ferme vraiment, et la page le dit en toutes lettres.
Le contrôle qui interdisait TOUT lien vers `prof.html` depuis une page d'élève
n'a pas été retiré, il a été rétréci : le seul retour autorisé part de
`quitToHome()`, c'est-à-dire du tableau de bord, c'est-à-dire de quelqu'un qui a
déjà donné le mot de passe. Et il ne compte que les `prof.html` ENTRE
GUILLEMETS : une adresse qu'on suit, pas un commentaire qui la nomme.
Cinq bords en tout, parce que la page vit à côté des trois autres sans que rien
ne l'y relie : le fragment qu'elle pose, les trois valeurs de configuration
qu'elle écrit une QUATRIÈME fois (adresse du projet, clé publique, courriel du
compte — divergentes, elle refuserait le bon mot de passe, ou pire ouvrirait une
session sur un autre projet, sans rien dire), la carte des niveaux livrée
cachée, le retour réservé au tableau de bord, et ce retour qui ne doit pas
fermer la session. Le banc navigateur, lui, joue le trajet entier : il OUVRE
`prof.html`, vérifie qu'aucun niveau ne se voit, essaie un MAUVAIS mot de passe,
donne le bon, CLIQUE le niveau contrôlé, exige d'atterrir sur le tableau de bord
et non sur la connexion des élèves, puis clique « Quitter » et exige de revenir
sur les trois niveaux SANS retaper. Éprouvé en le cassant neuf fois.
Un piège de banc s'y est montré : le double de Supabase gardait sa session en
MÉMOIRE, si bien qu'elle disparaissait au changement de page et qu'aucun
contrôle ne pouvait éprouver ce partage. Il la range maintenant dans le stockage
du navigateur, comme le vrai client.

Le changement de fragment sur une page DÉJÀ ouverte est écouté aussi
(`hashchange`) : sans cela, taper « #prof » dans la barre d'adresse ne ferait
rien du tout, un navigateur ne rechargeant pas une page pour un simple
fragment. Tout ce qui ramenait à l'accueil — « Retour », « Quitter », le
démarrage — passe par `accueil()`, un seul entonnoir : trois chemins séparés
auraient fini par diverger, comme l'ont fait la réserve du bas et `testScreens`.

---

## Ajouter un exercice

Quinze points de branchement. En oublier un ne provoque aucune erreur visible
— l'exercice fonctionne, mais l'aide, la reprise ou la note manquent.

1. `TESTS` — nom, icône, description, fonction de démarrage
2. `THEMES` — l'identifiant dans le bon sous-thème (la numérotation en découle,
   et le tableau du professeur en découle aussi)
3. l'écran `<section class="screen" id="scr-…">`
4. `show()` — ajouter l'écran à `testScreens`
5. la réserve du bas en CSS — `#scr-…{padding-bottom:84px}`, sinon les
   commandes flottantes recouvrent la dernière ligne de l'exercice
6. `liveCheckCurrent()` — correction en direct du mode soutien
7. `restartCurrentTest()` — bouton « Recommencer »
8. `resumeTest()` / `afficherEcranDe()` — reprise après une pause, et rejeu
9. la liste des fonctions de rendu enveloppées en fin de fichier (jetons + boutons IA)
10. `RAPPELS` — rappel de cours, obligatoire ; un `console.warn` signale l'oubli
11. `QIA_SUGG` — questions proposées dans la fenêtre d'aide
12. `conseilCtxCourant()` — description de l'exercice envoyée au modèle
13. `QIA_MODELES` — corrigé type généré par l'application (facultatif)
14. `details.test` à l'enregistrement du résultat, avec l'identifiant exact
15. l'énoncé dans un élément de classe `enonce` — il prend l'encadré et
    l'étiquette. Deux contrôles l'exigent ; un exercice dont l'énoncé est
    l'ardoise se déclare dans `tests/profils.js` (`enonce.ardoise`)

Le point 4 est le seul dont l'oubli rendait le banc **aveugle** au lieu de le
faire rougir : `testScreens` est la liste que parcourt le contrôle de l'énoncé,
si bien qu'un écran absent en sortait au lieu d'y être signalé. Un contrôle
l'exige désormais, à partir des écrans de menu déclarés dans `tests/profils.js`
(`ecransHorsExercice`) : ajouter un exercice ne demande rien là-bas, ajouter un
écran de menu si.

Les points 2, 5, 6, 11 et 14 n'étaient contrôlés nulle part : les cinq trous ont
été fermés en août 2026, et trois d'entre eux ont trouvé un manque déjà en place
(voir « Cinq oublis silencieux » plus haut). Il n'y a plus de constante `MENU` :
elle listait les exercices pour le tableau du professeur, mais celui-ci se
construit depuis `THEMES` — elle ne servait plus à rien, et une liste morte qu'on
croit vivante est pire qu'aucune liste.

Puis `npm test`.

---

## Énoncés

Chaque exercice tire sa formulation dans une table de variantes, et son contexte
concret dans une table de mises en situation. Deux principes :

**La variante et le contexte sont tirés à la génération**, puis rangés dans la
question (`q.v` et `q.ci`). Jamais au moment de l'affichage : l'énoncé changerait
sous les yeux de l'élève à chaque redessin, et à la reprise d'une pause.

**On range l'indice, jamais l'objet.** Les questions partent en base de données
pour la reprise après pause : elles doivent rester du JSON, sans fonction.

Une variante peut porter une condition (`si`) et un poids (`poids`) — les
tournures de soldes ne sortent qu'en euros, les mises en situation sortent plus
souvent que les formulations abstraites. Un contexte peut porter `nOk`, qui
écarte les nombres rendant la scène absurde : un loyer à 44 €, une classe de
9 000 élèves.

---

## Fiches imprimées (`.docx`)

Les fiches d'exercices sur papier ne vivent pas dans le dépôt et aucun script du
projet ne les produit : elles se modifient à la main, dans le XML du `.docx`.
Deux règles les tiennent (décisions de Turquet, août 2026).

**Les traits de fraction sont épais.** Une barre de fraction fine s'imprime
grise et se confond avec le cadre des cases. Il y en a de deux sortes, et n'en
traiter qu'une ne traite rien : les fractions IMPRIMÉES sont des formules Word
(`m:f`), leur barre suit le `m:ctrlPr` de la fraction — on y pose `<w:b/>`, Word
épaissit alors la barre sans toucher aux chiffres ; les fractions que l'ÉLÈVE
écrit sont deux cases empilées, et leur barre n'est que le côté partagé de deux
cadres, à 1 pt comme les trois autres côtés — rien ne disait que c'était une
barre. Ce trait-là est à 2,25 pt en bleu nuit (`w:sz="18"`, `1F3864`, la couleur
du trait des opérations posées), posé sur le `bottom` du numérateur ET le `top`
du dénominateur : Word garde le plus épais des deux, en oublier un laisse le
résultat à la merci du sens de résolution.

**Les exercices se suivent sur la même page.** Aucun `<w:pageBreakBefore/>` sur
les titres d'exercice : un exercice qui s'arrête au tiers de la page laisse
deux tiers de papier blanc, et la fiche passe de trois pages à quatre. Mais
retirer les sauts ne suffit pas — c'est là que le piège se referme. Le saut de
page cachait ce qu'il empêchait : dès que le texte s'enchaîne, une
multiplication posée se coupe en deux, l'opération en bas d'une page et ses
cases de résultat en haut de la suivante. Trois solidarités le tiennent, et il
les faut toutes les trois : `keepNext` sur toutes les rangées d'un tableau sauf
la dernière (le tableau ne se coupe plus), sur l'intitulé
« *3. Calcule 92 × 0,5.* » (il reste avec sa ligne de fractions), et sur la
consigne
« *✎ Pose la multiplication…* » (elle reste avec l'opération qu'elle annonce).
Ces solidarités repoussent les blocs et regagnent une page à elles seules : la
place se reprend sur les paragraphes VIDES qui séparent deux questions — un
paragraphe vide coûte une ligne entière (~15 pt) en plus de son espacement. On
le retire et on reporte son `after` sur le `before` du bloc suivant :
l'intervalle reste, la ligne perdue disparaît. Jamais sur la hauteur des cases,
qui est la place où l'élève écrit.

**Une fiche se juge en l'ouvrant, comme une page.** `soffice --convert-to pdf`
suffit à voir la pagination (`apt-get install libreoffice-writer` — le conteneur
n'a que le noyau, sans les filtres Writer, et sans eux la conversion répond
« *source file could not be loaded* », ce qui ressemble à un fichier corrompu
alors que le fichier est parfait). Deux réserves à connaître : LibreOffice
IGNORE le gras sur la barre des fractions OMML — les barres imprimées y restent
fines même quand le fichier est correct, seul Word tranche — et il dessine les
`=` des formules en `¿`. La pagination, elle, est fiable à une ligne près ; les
solidarités rendent cet écart sans conséquence.

---

## Vérifier

```bash
npm install          # une seule fois
npm test             # les trois niveaux
npm run test:secondes # un seul, quand on travaille dessus
npm run test:navigateur # les trois pages ouvertes dans un vrai Chromium
npm run test:base    # les règles d'accès de la base, sur un PostgreSQL jetable
npm run test:fonction # la fonction Edge admin-eleve, réellement exécutée
```

`npm test` et `npm run test:navigateur` remplacent Supabase par un double en
mémoire — exprès : aucun contrôle ne doit approcher les comptes réels. Ils sont
donc **aveugles aux règles d'accès de la base**, et c'est là qu'étaient les
fuites. `npm run test:base` comble ce trou sans jamais toucher au projet : il
lève un PostgreSQL jetable, y recrée l'état d'avant, y joue la vraie migration,
puis joue chaque rôle — visiteur, deux élèves, professeur — et vérifie ce que
chacun obtient. Il exige PostgreSQL installé localement ; à défaut il le dit
bruyamment plutôt que de passer au vert.

Ce qu'aucun banc ne voit, et qui reste à vérifier à la main sur le projet : le
réglage de l'authentification Supabase, le déploiement de la fonction Edge, et
le fait que `COURRIEL_PROF` désigne un compte réel. Voir `supabase/LISEZMOI.md`.

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

**Un contrôle qui ne s'applique pas se déclare, il ne se retire pas.** Les trois
fichiers ne savent pas faire les mêmes choses : `tests/profils.js` dit pour
chacun ce que le banc doit piloter, et la liste `lacunes` de son profil énumère
ce qui lui manque. Ces manques s'affichent à chaque exécution. Un contrôle
supprimé en silence rend le banc vert sur un fichier qu'il ne vérifie plus.
