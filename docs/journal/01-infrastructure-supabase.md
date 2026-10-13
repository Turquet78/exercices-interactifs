# Infrastructure, comptes et base de données

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

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

**Renommer un élève ne passe PAS par la fonction Edge, et c'est la leçon du
paragraphe précédent prise à l'envers.** Le professeur peut changer le prénom
d'un élève depuis sa liste (demande de Turquet, août 2026) : jusqu'ici le seul
chemin était de le retirer et de le recréer, ce qui emportait TOUT son
historique. Les trois autres gestes — nouveau code, ajout, retrait — passent par
`admin-eleve` parce qu'ils touchent `auth.users` et réclament la clé de service.
Celui-ci n'y touche pas : la politique `p_eleves…_prof_modif` ouvre déjà
l'UPDATE au professeur, et le prénom n'est pas un secret — l'écran de connexion
l'affiche sans être connecté. Le faire passer par la fonction Edge aurait coûté
un redéploiement à la main, et le bouton serait arrivé en ligne MORT en
attendant, sans que rien ne le dise. C'est le raisonnement du devoir sur papier,
qui part par le canal des signalements pour la même raison.
**Rien d'autre ne bouge, et c'est ce qui rend le geste sûr** : le compte
Supabase de l'élève est dérivé de `cle`, jamais du prénom — son code et sa
connexion ne changent pas — et ses notes le désignent par `eleve_id` : elles
suivent le nouveau nom d'elles-mêmes, dans son bilan comme dans le tableau du
professeur. Le contrôle EXIGE ces trois propriétés plutôt que de les supposer,
et il compte les appels à la fonction Edge : zéro.
**Une mise à jour que RLS refuse n'est pas une erreur** — PostgREST rend
« 0 ligne », exactement comme pour une suppression, le piège le plus coûteux du
projet. On redemande donc les lignes touchées (`.select('id')`) et on les
COMPTE, sans quoi la page annonce « Prénom modifié ✓ » sur un prénom qui n'a
pas bougé.
**Et l'autre bord du droit vit dans le banc de la BASE**, seul endroit qui voie
les règles d'accès : `npm test` remplace Supabase par un double sans RLS, donc
il ne peut ni prouver que le professeur a le droit, ni qu'un élève ne l'a pas.
Le banc exigeait déjà « il renomme un élève » côté professeur ; il exige
maintenant les deux refus qui vont avec — un élève ne renomme ni un camarade ni
lui-même. Sans eux, un prénom volé sur l'écran de connexion suffirait à se faire
passer pour un autre, et rien ne rougirait. Éprouvé en ouvrant la politique
d'UPDATE à tous : le banc de la base le nomme.
**Le contrôle de doublon laisse passer l'élève LUI-MÊME.** Deux prénoms
identiques ne se distinguent plus sur l'écran de connexion et l'un prendrait la
place de l'autre : le prénom d'un autre est donc refusé, à la casse près, comme
à la création de compte. Mais un contrôle qui refuserait toute correspondance
interdirait à « marie » de devenir « Marie » — le sabotage l'a montré, et les
deux bords sont tenus.
**Et le contrôle de la mise en page mesurait d'abord autre chose.** La rangée
d'un élève porte trois boutons depuis ce jour-là ; le premier jet comparait
chaque bouton à SA rangée et restait vert sous les deux sabotages. En flex, une
rangée qui ne se replie pas ne laisse pas déborder ses boutons — elle GRANDIT
avec eux : c'est la PAGE qui déborde, et « Retirer » qui sort de l'écran par la
droite. Le bord est aussi plus bas qu'il n'y paraît : à 420 px le repli des
boutons (`.acts{flex-wrap:wrap}`) ne change RIEN ; à 320 px, sans lui, la page
fait 341 px et « Retirer » devient inatteignable. Mesuré des deux côtés — ce
n'est donc pas un garde-fou mort, contrairement aux six qu'a comptés le projet,
et c'est le sabotage qui l'a établi, pas la relecture. Onze sabotages en tout,
chacun rougissant en nommant son défaut.

**Une sauvegarde remise en place casse la Première le lendemain.** Réinsérer des
lignes avec leurs identifiants d'origine ne fait pas avancer la séquence qui les
produit : elle repart de 1, et c'est le *premier élève ajouté après* la
restauration qui se heurte à un identifiant déjà pris. Rien ne se voit le jour
de la restauration. Deux autres pièges du même genre : `user_id` pointe vers des
comptes Supabase disparus — la clé étrangère refuse la ligne — et les notes
désignent un élève, donc `eleves…` passe avant `resultats…`. `supabase/restaurer.sql`
désamorce les trois, et `npm run test:base` rejoue la restauration entière sur
un PostgreSQL jetable.

**Un élève dé-relié se connecte parfaitement — et tout ce qui est à lui est
refusé.** La restauration remet `user_id` à VIDE, volontairement (compte
d'avant le sinistre peut-être disparu) ; mais les comptes vivent dans
`auth.users`, que la restauration ne touche pas. Quand ils ont survécu,
l'élève tape son code, Supabase le reconnaît — et sa LIGNE n'est plus
rattachée à rien : chaque politique « sa propre ligne » (`user_id =
auth.uid()`) le refuse. Un élève de Terminale l'a rencontré en cliquant « Le
faire sur papier » (signalé par Turquet, août 2026) : « new row violates
row-level security policy for table "signalements" » — le premier geste
BRUYANT de la liste, les autres refus (notes, pause) étant muets, le piège
documenté. `supabase/relier-comptes.sql` recalcule le lien par l'adresse
dérivée de la clé — sans toucher aux codes ni aux comptes — et NOMME les
élèves dont le compte a disparu, pour qui « Nouveau code » est le seul chemin.
Le domaine des comptes y vit une TROISIÈME fois, et le contrôle qui comparait
la page à la fonction Edge compare maintenant les trois. `npm run test:base`
rejoue le défaut (l'élève dé-relié refusé), le reliage, le témoin intact et
l'idempotence — et sa sortie sur le vrai projet est un DIAGNOSTIC : « 0 sans
lien » partout veut dire que la cause est ailleurs (session expirée, par
exemple), pas que le script a échoué.

**La liste des prénoms ne se lit plus sans être connecté.** La migration 001
avait posé sur `eleves`, `eleves_1ere` et `eleves_2nde` une politique
`p_<table>_liste` « for select to anon, authenticated using (true) », avec
pour toute défense ce commentaire de son étape 4 : « la liste des prénoms
doit rester lisible sans être connecté, c'est l'écran de connexion qui la
demande ». C'était vrai : l'écran affichait les prénoms de la classe en
pastilles (`#nameChips`, `renderLoginNames()`), l'élève cliquait la sienne et
tapait son code. Et c'était le prix : la clé anonyme de Supabase est dans la
page, donc n'importe qui, sans compte, depuis n'importe où sur Internet,
lisait les prénoms de trois classes de mineurs — et la colonne `cle` avec eux,
dont l'adresse de connexion `<cle>@DOMAINE_COMPTES` est dérivée : la moitié de
l'identifiant, offerte, il ne restait qu'un code à six chiffres à deviner.
Décision de Turquet (octobre 2026, premier point de « on peut faire quoi
d'autre ») : cette lecture se ferme.
**Le dessin : l'élève TAPE son prénom, et la page n'obtient que ce qu'il faut
pour le connecter.** Un champ texte `#loginPrenom` remplace les pastilles
(Seconde v480, Première v316, Terminale v384 — même diff mot pour mot, seules
la table et la version diffèrent). La page appelle
`sb.rpc('cles_de_connexion', { niveau: NIVEAU, prenom })` ; la fonction SQL
(migration 009) est `security definer`, comme `est_prof()` — elle lit la table
SANS repasser par la RLS, sans quoi le visiteur qui l'appelle ne verrait plus
rien — et rend les clés d'UN prénom exact, cinq au plus, triées : ni
l'identifiant, ni le prénom, ni la liste, et son type de retour (`setof text`)
est la preuve que rien d'autre ne peut en sortir. « Exact » se lit sans
accent, sans casse et sans espace double : `public.normaliser_prenom` en SQL
(`lower`, `btrim`, `regexp_replace('\s+')`, `translate` des accents —
majuscules accentuées comprises, parce que sous une locale « C » `lower()`
laisse « É » tel quel, et une règle qui dépend de la locale n'est pas une
règle) et `normaliserPrenom` dans la page (NFD, combinants retirés,
`toLowerCase`, `trim`, espaces réduits) DOIVENT rester équivalentes : l'une
sert au repli et à la création de compte, l'autre à la fonction ; si elles
divergeaient, un prénom passerait d'un côté et pas de l'autre. La page essaie
son code sur chaque clé rendue — deux homonymes dans une classe, c'est
courant, et c'est le code qui départage —, puis, connectée, relit SA ligne
(`.select('id,prenom,cle').eq('cle', cle).single()`) : c'est elle qui porte
l'identifiant sous lequel ses notes s'enregistrent. Un compte sans ligne
referme sa session et lit « Compte introuvable — préviens ton professeur »
(cette branche-là n'est tenue par aucun contrôle, et le dire vaut mieux que
de le taire). La création de compte passe par la même porte :
`creerCompte()` demandait `ilike('prenom')`, qui ne voyait pas l'accent et
lisait une table désormais fermée ; elle demande `clesDuPrenom()`, et un
second « Léa » écrit « lea » est refusé — sinon les deux se confondraient à
la connexion. Côté base, la politique garde son NOM (`p_<table>_liste`,
d'autres scripts peuvent le citer) et perd `anon` : remplacée, pas doublée,
parce que deux permissives se combinent par un OU (la leçon de la 002).
**Un élève CONNECTÉ lit donc toujours la liste entière de sa classe**, et
c'est nommé plutôt que glissé : le tableau du professeur, les signalements et
le bilan lisent `eleves….id, prenom` pour nommer chaque ligne. Restreindre
l'élève à sa propre ligne est l'étape suivante, NON FAITE, et la raison de ne
pas la faire en passant est au paragraphe précédent : après une restauration,
les lignes dé-reliées (`user_id` vide) ne seraient plus lisibles par leur
propriétaire, et la connexion ÉCHOUERAIT — « Compte introuvable » à toute une
classe — au lieu de refuser en silence geste par geste jusqu'au reliage.
Passer d'un refus muet à une porte fermée se décide ; ça ne s'hérite pas
d'une migration qui parlait d'autre chose.
**L'ORDRE EST IMPÉRATIF : LA PAGE D'ABORD EN LIGNE, LA MIGRATION ENSUITE** —
l'inverse des 003, 007 et 008, et pour une raison qui ne se devine pas. Tant
que la 009 n'est pas jouée, la fonction n'existe pas : PostgREST répond 404,
supabase-js rend `error.code === 'PGRST202'`, et dans ce cas, et dans ce cas
SEULEMENT, `clesDuPrenom()` se replie sur l'ancienne lecture —
`select('cle,prenom')` puis le filtre dans la page — qui marche tant que
l'ancienne politique est là. Dès que la 009 est passée, la fonction répond et
le repli n'est plus appelé : il s'éteint tout seul, il ne reste rien à
retirer. Dans l'autre ordre, l'ancienne page demanderait, avant toute
authentification, une liste que la base vient de fermer : « Aucun compte pour
l'instant » à trois classes, personne n'entre. Et le repli a DEUX bords, n'en
tenir qu'un ne tient rien : s'il disparaissait, la page mise en ligne avant
la migration ne connecterait plus personne ; s'il se prenait sur TOUTE
erreur, chaque incident de la fonction relirait la liste entière sans que
personne ne voie la panne — c'est pourquoi la garde
`if(error.code!=='PGRST202') return` PRÉCÈDE le repli, et qu'un contrôle
exige cet ordre.
**Ce que chaque banc tient.** Le banc de la BASE (`npm run test:base`), seul
à voir les règles d'accès, rejoue la 009 (« 009 s'applique, et son contrôle
final ne trouve rien à redire », « 009 ferme la liste sur les trois tables
d'élèves », « plus aucune politique de lecture des élèves ne nomme anon »,
« elle REMPLACE la politique de lecture au lieu d'en ajouter une seconde »,
« la fonction de connexion existe et lit SANS la RLS (security definer) »,
« elle verrouille son search_path », « et le visiteur a le droit de
l'appeler : c'est tout ce qu'il lui reste », « rejouer 009 ne fait plus
rien »), puis met le banc des rôles dans la peau du VISITEUR : « il ne voit
PLUS la liste des prénoms (0) », « il obtient la clé d'un prénom qu'il
connaît, et elle seule (cle-alice) » — « et elle seule » est le bord qui
compte, une fonction qui rendrait toute la colonne passerait le précédent
sans peine —, « sans accent ni majuscule, le prénom se reconnaît quand même
(cle-chloe|cle-alice|cle-chloe) » (« CHLOE », «   alice  », « CHLOÉ »), « un
prénom inconnu ne rend rien (0) », « un prénom vide ne rend rien (0) », « un
niveau inconnu est refusé », « la fonction ne rend que des clés : ni prénom
ni identifiant (text (setof)) » ; du PROFESSEUR : « il voit la liste des
prénoms de sa classe (3) » ; et il éprouve les deux retours en arrière les
plus tentants, « détectée : la liste des élèves redevient lisible sans
connexion » (remettre `anon` sur la politique « pour que l'ancienne page
marche encore ») et « détectée : la fonction de connexion perd SECURITY
DEFINER » (par `alter function … security invoker` : même corps, mêmes
droits, seul l'attribut change, pour que le banc ne rougisse que de la bonne
cause). La démonstration « sans 002, rien ne protège » joue désormais 001
PUIS 009 avant le banc des rôles, sinon l'échec viendrait d'une fonction
absente et ne démontrerait rien : « 009 refuse de se déclarer faite tant que
la porte de 002 est ouverte, et la nomme » et « et c'est bien la liste
ouverte qui le fait rougir, pas une fonction absente » tiennent la bonne
cause. Le banc NAVIGATEUR (section 3) tape le prénom de contrôle au lieu de
cliquer une pastille, et exige : « un prénom inconnu ne tente aucune
connexion, et le dit », « le prénom se reconnaît sans accent ni majuscule »
(« CONTROLE » pour « Contrôle » — et le contrôle rougit aussi si le prénom de
contrôle n'avait ni accent ni minuscule : il ne mesurerait rien), « sans la
fonction SQL, la page se replie sur l'ancienne liste — tant que la 009 n'est
pas jouée » (`window.__faux.sansRpc = true` fait répondre PGRST202 à tout
`rpc` du double : la fonction a été demandée, la liste lue, l'élève entré —
les trois pas), « un prénom déjà pris, même écrit sans accent, ne crée pas
de second compte », « avant la connexion, la page ne lit aucune ligne de la
table des élèves » (un `rpc cles_de_connexion` avant le premier `signIn`,
aucun `select` sur la table avant lui ; sans `signIn` au journal, « le
contrôle n'a rien mesuré »). Le banc PRINCIPAL lit la source — « l'écran de
connexion n'affiche plus de liste de prénoms » : plus de `#nameChips`,
`#loginPrenom` en `autocomplete="off"` dans le `<form id="modeCo"
autocomplete="off">`, `connexionEleve()` et `creerCompte()` passent par
`clesDuPrenom()`, qui appelle `sb.rpc('cles_de_connexion', { niveau:
NIVEAU, … })`, le repli `select('cle,prenom')` EXISTE et la garde PGRST202 le
PRÉCÈDE — et il exécute la connexion dans jsdom, le double de Supabase
injecté à la place de supabase-js (« 2 ter », « la connexion par prénom
ouvre l'espace sans lire la table avant le signIn »). Le double
(`tests/faux-supabase.js`) a gagné `rpc(nom, args)` pour cela : il
journalise l'appel, rend pour `cles_de_connexion` ce que rend la fonction,
`PGRST202` pour un nom inconnu — et pour tout appel sous `sansRpc`.
**Éprouvé par sabotage, chaque bord par sa ligne rouge.** Base : la politique
remise `to anon, authenticated` dans la 009 — « ✗ 009 s'applique, et son
contrôle final ne trouve rien à redire → … ERROR: la liste des prénoms reste
lisible sans connexion : eleves.p_eleves_liste (pour anon+authenticated) —
jouez 002 si cette politique n'est pas à vous », et avec elle « plus aucune
politique de lecture des élèves ne nomme anon → 3 politique(s) encore
ouverte(s) aux visiteurs » et « il ne voit PLUS la liste des prénoms (3) » ;
`security definer` retiré — « … n'est pas SECURITY DEFINER : elle ne
rendrait rien à un visiteur », « la fonction de connexion existe et lit SANS
la RLS (security definer) → false|search_path=public, pg_temp|true », « il
obtient la clé d'un prénom qu'il connaît, et elle seule (∅) » ; le filtre de
prénom remplacé par `where $1 is not null` — « il obtient la clé d'un prénom
qu'il connaît, et elle seule (cle-alice,cle-bob,cle-chloe) » ; l'attente du
visiteur remise à `n = 3` — « il ne voit PLUS la liste des prénoms (0) », et
le second bord avec : « détectée : la liste des élèves redevient lisible sans
connexion → le banc est resté vert alors que la base est ouverte ». Pages
(sur la Seconde) : un `select('id,prenom')` glissé en tête de
`connexionEleve()` — navigateur « ✗ avant la connexion, la page ne lit
aucune ligne de la table des élèves → 1 lecture(s) de eleves_2nde avant la
connexion : select(id,prenom) », et le jsdom « ✗ la connexion par prénom
ouvre l'espace sans lire la table avant le signIn » avec le même message ;
le repli retiré — navigateur « → aucune lecture select('cle,prenom') de
eleves_2nde : la page ne se replie pas (écran atteint : scr-login) »,
source « → le repli sur l'ancienne liste (select('cle,prenom')) a disparu :
mise en ligne avant la migration 009, la page ne connecterait plus
personne » ; la garde PGRST202 retirée — source « → le repli se prend sur
TOUTE erreur, pas seulement sur PGRST202 : une panne de la fonction relirait
la liste entière sans que rien ne le dise » ; l'ancien `ilike` remis dans
`creerCompte()` — « ✗ un prénom déjà pris, même écrit sans accent, ne crée
pas de second compte → 1 inscription(s) : un second compte a été créé sous le
même prénom ». Remise en état vérifiée chaque fois (`cmp`, `md5sum -c`).
**Et la première exécution du banc de la base a trouvé un piège que personne
n'avait écrit** : « il ne peut pas poser de note » insérait par
`insert … select … from eleves_2nde` sous `anon` — qui n'y voit plus rien
depuis la 009 : zéro ligne insérée, aucun refus, contrôle rouge sans avoir
rien mesuré, et les neuf mutations « détectées » pour cette seule raison. UN
`insert … select` QUI PASSE PAR UNE TABLE FERMÉE N'INSÈRE RIEN ET N'EST
REFUSÉ PAR RIEN : l'identifiant d'Alice se lit désormais en superutilisateur
AVANT `set local role anon`, et l'insert le présente en dur — la seule façon
de PRÉSENTER une ligne à la politique d'écriture, et donc d'obtenir d'elle un
refus.
**Ce qu'aucun banc ne voit** : le projet réel. Que la 009 y soit jouée, et
dans le bon ordre — Turquet la colle à la main dans l'éditeur SQL, après
avoir LU v480/v316/v384 dans l'en-tête des trois pages en ligne
(`supabase/LISEZMOI.md`, 3 nonies) ; que le cache de schéma de PostgREST
connaisse la fonction une fois créée (il se recharge seul, mais pas à la
seconde) ; que supabase-js rende bien `PGRST202` sur une fonction absente, et
que `.single()` après `signIn` passe sous la politique `authenticated` ; que
`security definer` y traverse la RLS, le `postgres` de Supabase n'étant pas
superutilisateur — le mécanisme d'`est_prof()`, déjà en production, mais à
constater au premier essai de connexion. Et ce qui RESTE ouvert, nommé : un
visiteur peut toujours demander si « Léa » a un compte dans une classe, cinq
clés à la fois — la fonction est un oracle d'existence, sans autre cadence
que celle de PostgREST ; le code, lui, reste vérifié par Supabase seul, et sa
limitation de cadence reste le seul rempart (paragraphe « Les codes font
6 chiffres »). Les paragraphes plus haut qui disent que « le prénom n'est pas
un secret — l'écran de connexion l'affiche sans être connecté » (« Renommer
un élève ne passe PAS par la fonction Edge »), que « deux prénoms identiques
ne se distinguent plus sur l'écran de connexion » (« Le contrôle de doublon
laisse passer l'élève LUI-MÊME »), et le commentaire de l'étape 4 de la
migration 001, racontent l'état d'avant octobre 2026 : ce qu'ils enseignent —
le renommage sans la fonction Edge, le doublon refusé à la création — reste
vrai, seul l'écran a changé.

**Le plan gratuit de Supabase ne sauvegarde rien.** L'action
`.github/workflows/sauvegarde.yml` exporte les données chaque nuit du samedi au
dimanche, les chiffre et les conserve 90 jours. Le chiffrement est
obligatoire : le dépôt est public et les artefacts y sont téléchargeables par
n'importe qui, alors que le fichier contient des prénoms d'élèves mineurs
associés à leurs résultats. Les codes ne sont pas sauvegardés — ils sont
hachés — et se redonnent après restauration.

**Supabase ne rend jamais plus de 1000 lignes par requête — et il coupe EN
SILENCE.** Signalé par Turquet (septembre 2026) : « en Seconde, quand un élève
travaille sur la fiche 5, je n'ai pas la même note dans la page du prof que
dans la page élève ». Les deux écrans passaient pourtant par le MÊME calcul
(`noteDevoirExo`, `dmTotal`, `dmNoteAff`) : c'étaient les DONNÉES qui
différaient. L'élève lit ses propres lignes (`eq('eleve_id', …)`), quelques
centaines au plus ; le professeur lisait la table ENTIÈRE d'un seul
`select('*')`, et PostgREST plafonne toute réponse à 1000 lignes (`max_rows`,
réglage du projet) sans erreur ni avertissement. Passé mille résultats pour la
classe, les plus RÉCENTS n'arrivaient plus au bilan — précisément la fiche du
jour, d'où « la fiche 5 » et pas les fiches 1 à 4. La sauvegarde du dimanche,
elle, paginait déjà (`sauvegarde.mjs`) ; les pages non.
**Ce n'était pas qu'en Seconde, ni qu'au bilan.** Les trois niveaux lisaient
leur table de résultats de la même façon, à six portes du tableau de bord : le
bilan d'un devoir, le carnet des moyennes, le tableau général, la fiche d'un
élève, l'export CSV — et la DÉCISION D'ARCHIVER, la plus grave : un devoir dont
les notes tombaient hors de la page passait pour vierge, et « Supprimer » le
supprimait avec elles au lieu de l'archiver. Côté élève, la liste lue par
ordre de date aurait perdu, le jour où un élève assidu dépasse mille lignes,
ses résultats les plus récents.
**UN SEUL ENTONNOIR, `lireToutes()`**, même texte dans les trois fichiers : il
lit page par page dans un ordre STABLE (date puis identifiant — sans ordre,
deux pages peuvent se recouvrir), et ne s'arrête qu'à la page VIDE — pas à la
première page incomplète, car le plafond est un réglage du serveur : s'il
descendait sous la taille de page, on couperait de nouveau sans le dire. Il
prend une FONCTION qui rend une requête neuve, parce qu'une requête Supabase ne
se rejoue pas. Les 34 lectures des trois fichiers y passent.
**Le banc ne pouvait pas le voir** : son double de Supabase rendait tout, et
une classe de test n'a jamais mille lignes. Le double plafonne désormais comme
le vrai (`maxLignes`, 1000), connaît `.range()` et enchaîne ses tris. Deux
contrôles : un contrôle de SOURCE exige que toute lecture d'une table de
résultats passe par `lireToutes()` (une lecture écrite demain sans l'entonnoir
rougit en nommant sa ligne), et un contrôle d'EXÉCUTION baisse le plafond à 4,
sème une classe qui le dépasse — les lignes de l'élève les plus récentes en
dernier —, puis exige la même note chez l'élève, au bilan du professeur, au
carnet des moyennes, et que la décision de suppression voie les notes. Un bord
le garde honnête : la classe semée doit dépasser le plafond, sinon il le dit.
Deux sabotages, chacun rougissant en nommant son défaut : l'entonnoir réduit à
sa première page (l'élève perd ses lignes récentes), le bilan du professeur
rendu à son `select('*')` d'origine (la ligne nommée, et « 18 / 30 » absent du
bilan).
**Les notes enregistrées n'ont rien à réparer** : rien n'était faux en base,
seule la LECTURE du professeur était tronquée. Recharger le tableau de bord
suffit.
