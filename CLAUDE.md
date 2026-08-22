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
Elle est posée par la PAGE et non dans `CONSEIL_SYS`, côté fonction Edge, pour
une raison déjà payée : la fonction ne se déploie qu'à la main, et la consigne
serait restée lettre morte jusqu'au redéploiement sans que rien ne le dise. Ici
elle part avec la page. **Un seul endroit la décrit** (`LANGUE_SIMPLE`), partagé
par les deux aides et par le bouton du rappel : deux descriptions auraient fini
par diverger, et l'une des aides aurait reparlé comme avant sans qu'on le voie.

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
**Un seul favori pour trois niveaux : `prof.html`.** Une quatrième page, de
cent lignes, qui ne fait qu'aiguiller — trois liens vers `…#prof`. Elle ne
contient aucun secret et n'appelle pas Supabase. Deux bords, parce qu'elle vit
à côté des trois pages sans que rien ne l'y relie : *le fragment qu'elle pose
doit être celui que la page attend* — s'ils divergeaient, le bouton ouvrirait
la connexion des ÉLÈVES sans la moindre erreur nulle part —, et *aucune page
d'élève ne doit renvoyer vers elle*, ce qui remettrait par un autre chemin le
bouton retiré à dessein. Deux contrôles statiques les tiennent, niveau par
niveau ; et le banc navigateur OUVRE `prof.html`, CLIQUE le lien du niveau
contrôlé et regarde où il atterrit — un lien juste sur le papier qui tomberait
sur la connexion des élèves ne lèverait aucune erreur.

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
