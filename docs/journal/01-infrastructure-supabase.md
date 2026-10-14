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

**L'aide par IA tourne sur Claude Haiku 5.5, et sa fonction Edge a un banc qui
l'exécute.** Décision de Turquet (octobre 2026, deuxième point de « on peut
faire quoi d'autre ») : `corriger-definition`, qui porte TOUTE l'aide par IA
des trois niveaux — l'indice du bouton « Conseil », la fenêtre « Pose ta
question à l'IA », la vérification des réponses rédigées, les rédactions du
TVI, les définitions des ensembles —, quitte Claude Haiku 4.5
(`claude-haiku-4-5-20251001`) pour Claude Haiku 5.5, `claude-haiku-5-5`, SANS
suffixe de date. Elle parle toujours au modèle en HTTP brut, par `fetch` : il
s'agissait de changer de modèle, pas de réécrire le client.
**Ce que Haiku 5.5 change, et ce que la fonction en fait.** Il refuse d'un 400
un réglage d'échantillonnage (`temperature`, `top_p`, `top_k`), un
préremplissage, un budget de réflexion (`budget_tokens`) : la fonction n'en
envoyait aucun, n'en envoie toujours aucun, et un contrôle le tient désormais.
Il RÉFLÉCHIT avant de répondre, par défaut, et cette réflexion se décompte de
`max_tokens` — où le même texte pèse en outre environ 30 % de tokens de plus.
À 900, la borne d'avant, la réflexion pouvait la consommer entière : réponse
arrêtée sur « max_tokens » sans un mot, l'élève sans rien. `MAX_TOKENS` passe à
16000, et ce n'est PAS la longueur de ce que lit l'élève — celle-ci est tenue
par les consignes, le coût par les quotas, qui n'ont pas bougé. La profondeur
de la réflexion se règle par l'EFFORT (`output_config.effort`), jamais par une
phrase de consigne : « low » pour l'indice du bouton « Conseil » (deux ou trois
phrases, l'élève attend), « medium » pour les VERDICTS (`verif`, `redaction`,
`definition`), où l'exactitude passe avant la vitesse — et « medium » aussi
pour la QUESTION D'UN ÉLÈVE. Celle-là part en action `conseil` comme l'indice,
mais elle exige souvent un EXEMPLE NUMÉRIQUE COMPLET calculé jusqu'au résultat,
la sortie la plus calculatoire de l'application ; le premier jet l'envoyait à
« low » sur la foi d'un postulat faux (« un conseil, c'est deux ou trois
phrases »), et c'est la relecture qui l'a vu. La fonction la reconnaît au
marqueur que les trois pages posent en tête du contexte, « MISSION « réponse à
une question d'élève » » (sans accents en Seconde), comme elle reconnaît les
deux dérivées historiques à leur attendu. Enfin la réponse COMMENCE par un ou
plusieurs blocs `thinking`, au texte vide : la fonction lisait déjà les blocs
par type, jamais `content[0]` — ce bord n'était tenu que par la forme du code,
il l'est maintenant par des contrôles.
**`stop_reason` se lit AVANT le contenu, et ce qui n'est pas une réponse rend
une ERREUR, jamais un verdict.** Trois fins rendent un HTTP 200 inutilisable.
Le REFUS d'un classificateur de sécurité (`stop_reason: "refusal"`,
`stop_details.category` — `cyber`, `bio`, `frontier_llm`, `general_harms` —,
`content` vide ou partiel), sans AUCUN repli côté serveur pour Haiku 5.5 : le
paramètre `fallbacks` n'est pas envoyé (une liste y serait un 400). La COUPURE
(`stop_reason: "max_tokens"`), la réflexion ayant tout pris ou la borne tombant
au milieu du JSON d'un verdict. La réponse ILLISIBLE : un 200 sans texte, un
texte qui n'est pas le JSON demandé, un JSON sans « correct » booléen — ou une
rédaction sans ses critères. La fonction d'avant rendait, dans ces trois cas,
un verdict « faux » de secours (« Je n'ai pas pu analyser ta réponse… »,
`correct: false`), la prose brute du modèle (« Ta réponse x = 3 est correcte,
bravo ! », comptée FAUSSE), « Je n'ai pas de conseil pour l'instant », ou le
JSON coupé recopié sous les yeux de l'élève. Sans `error`, rien ne disait aux
pages que ce n'était pas un verdict : en Terminale, le TVI rédigé (`checkTVI3`)
et la lecture graphique des limites (`checkLR`) comptaient la copie fausse et
VERROUILLAIENT la question hors soutien, là où une erreur n'est « ni comptée ni
verrouillée » et propose « Réessayer » ; en Seconde et en Première, le juge
local ne prenait pas la main (`(!res || res.error) && juge.sait`). Désormais :
une erreur, journalisée dans `corrections_ia` (`[refus du modèle :
<catégorie>]`, `[réponse coupée]`, `[réponse illisible] …` — la ligne compte
dans les quotas, et le professeur la lit), avec une trace `console.warn` dans
les journaux de la fonction. Le message suit ce que l'élève a fait : un refus
sur l'indice dit « L'IA n'a pas pu donner d'indice sur cet exercice » (l'élève
n'a rien écrit, il n'a rien à reformuler), sur une question « L'IA n'a pas pu
répondre à cette question. Reformule-la… », sur un verdict « L'IA n'a pas pu
relire ta réponse » (ne pas l'inviter à changer une réponse peut-être juste).
Et une erreur HTTP ne dit plus à l'élève de « vérifier la clé API » : une
SURCHARGE (429, 529, toute 5xx — sans repli serveur, elle arrive telle quelle)
dit « L'IA est très sollicitée, réessaie dans un instant (code N) », une erreur
de CONFIGURATION (400, 401, 403, 404…) dit « L'aide IA est mal configurée
(code N) : préviens ton professeur » ; le code reste dans le message, c'est lui
que la notice apprend à lire.
**Le banc : `tests/fonction-ia.js`.** `npm run test:fonction` le joue avec
celui d'`admin-eleve` par un petit lanceur, `tests/fonctions.js`, qui mène les
DEUX bancs au bout et échoue si l'un échoue — le premier jet les enchaînait par
`&&`, et un `admin-eleve` rouge taisait l'état de l'aide IA. Même méthode que
`tests/fonction-edge.js` : la vraie fonction chargée dans Node avec trois
substitutions (l'import de supabase-js, `Deno.serve`, `Deno.env`). Un faux
Supabase porte les trois tables d'élèves et `corrections_ia`, qui ne sait que
compter et noter ses insertions. `fetch` est servi par un FAUX MODÈLE qui note
chaque requête, corps et en-têtes, et rend la réponse écrite par le contrôle :
DEUX blocs de réflexion d'abord, toujours — avec un seul, lire `content[1]`,
« puisque le texte est maintenant le second bloc », passait tout le banc. Le
faux `fetch` est posé avant le moindre chargement : aucun code de la fonction
ne voit jamais le `fetch` natif, et tout appel hors `api.anthropic.com` fait
échouer le banc, compté une seule fois. Les bornes et l'origine se LISENT dans
la source ; le marqueur des questions d'élève se LIT dans les trois pages ; le
modèle exigé est écrit deux fois, dans la fonction et dans le banc, exprès.
Cinquante-deux contrôles, en cinq sections. 0, CE QUE LE BANC LIT DANS LA
FONCTION. 1, CE QUI PART AU MODÈLE — les quatre actions relues requête par
requête, avec leur second bord (« rien mesuré : aucune requête notée par le
faux modèle ») : « le modèle demandé est exactement « claude-haiku-5-5 » »,
« aucun paramètre d'échantillonnage (temperature, top_p, top_k) : Haiku 5.5 les
refuse », « la conversation finit par un message « user » : aucun
préremplissage », « la réflexion est absente ou adaptative, sans
budget_tokens », « l'effort vaut « low » pour l'indice du bouton Conseil,
« medium » pour verif, redaction et definition », « max_tokens laisse place à
la réflexion (≥ 8000) », « aucun repli demandé : ni champ « fallbacks », ni
en-tête anthropic-beta de repli », « la clé part dans x-api-key, et nulle part
dans le corps », « les en-têtes anthropic-version (2023-06-01) et content-type
(application/json) sont envoyés », « une question d'élève (marqueur MISSION lu
dans les trois pages) part à l'effort « medium », l'indice reste à « low » ».
2, CE QUI REVIENT À L'ÉLÈVE — le texte du bloc `text` et jamais la réflexion,
« verif : trois blocs thinking avant le texte rendent encore { correct: true } »,
les critères de la rédaction tranchés par la fonction (« un critère faux rend
correct: false, même si le modèle dit true »), une ligne de journal par appel.
3, REFUS, COUPURES ET RÉPONSES ILLISIBLES — chaque contrôle y exige que la
réponse du faux modèle ait été SERVIE (une erreur rendue avant le modèle ne le
satisfait plus) et le message PROPRE au cas ; le refus sous ses trois formes
(« un refus du modèle sur « verif » rend une erreur qui le dit, jamais
correct: true », « un refus survenu APRÈS la réflexion (content partiel) rend la
même erreur », « un refus survenu au milieu du texte ne montre rien de ce
texte », « un refus sans stop_details rend la même erreur, et se journalise »),
ses trois messages, les deux coupures, quatre réponses illisibles (« une
réponse sans texte sur « verif » rend une erreur, jamais un verdict », « un
texte qui n'est pas le JSON demandé, sur « verif », rend une erreur, jamais
correct: false », « une rédaction jugée sans ses critères rend une erreur »,
« un indice sans texte rend une erreur, pas le texte de secours »), la
surcharge et la configuration (« une surcharge (HTTP 529) dit de réessayer, et
cite le code », « une erreur de configuration (HTTP 404) dit de prévenir le
professeur, et cite le code »). 4, LES GARDES AVANT LE MODÈLE — ZÉRO requête
exigée pour chacune, chaque borne jouée à la limite ET juste en dessous, un
témoin d'abord : élève inconnu, quota journalier (100, lu dans la source),
plafond horaire (600), origine étrangère, contexte au-delà de `MAX_CTX`, clé
absente, préflight OPTIONS. Les contrôles de `tests/verifier.js` qui LISENT la
source (`MAX_CTX`, les troncatures) retrouvent leur valeur.
**Éprouvé par sabotage, et par deux relectures.** Joué sur la fonction d'avant,
le banc rougit vingt fois sur cinquante-deux. Douze sabotages, joués sur une
copie, rougissent chacun sur le contrôle visé : l'ancien modèle (« ✗ le modèle
demandé est exactement « claude-haiku-5-5 » → conseil : model =
"claude-haiku-4-5-20251001" | … »), `temperature: 0`, `MAX_TOKENS` à 900,
`content[1]` au lieu du filtre par type (treize rouges), le refus guetté par
« content vide » (« ✗ un refus survenu APRÈS la réflexion (content partiel)
rend la même erreur → message : {"error":"La réponse de l'IA est illisible.
Réessaie."} »), `stop_details` lu sans garde (« ✗ un refus sans stop_details rend
la même erreur, et se journalise → message : {"error":"Impossible de joindre
l'IA (réseau ou clé). Réessaie."} ; journal : [] »), `anthropic-version` faux,
`content-type` retiré, la réponse illisible rendue en verdict (« ✗ un texte qui
n'est pas le JSON demandé, sur « verif », rend une erreur, jamais correct: false
→ message : {"correct":false,"feedback":"Ta réponse x = 3 est correcte, bravo
!"} »), le marqueur des questions cassé (« ✗ une question d'élève (marqueur
MISSION lu dans les trois pages) part à l'effort « medium », l'indice reste à
« low » → en défaut : secondes.html (effort "low"), … »), un message de refus
unique, l'ancien message HTTP. Cinq de ces sabotages passaient au vert sur le
premier jet du banc, que la seconde relecture a renforcé : un banc qui annonce
tenir « les blocs se lisent par type » et ne sert jamais qu'un seul bloc de
réflexion ne tient que `content[0]`.
**Ce qu'aucun banc ne voit, et le dire vaut mieux que de le taire.** La
fonction DÉPLOYÉE : elle ne se met jamais à jour toute seule (paragraphe
précédent), et tant qu'elle n'est pas redéployée à la main l'aide tourne sur
Haiku 4.5 — `supabase/LISEZMOI.md` (5 bis) dit le geste, la vérification et le
retour arrière. Que l'API accepte réellement ce corps : il n'y a aucune clé
ici, c'est voulu, et seule la référence de l'API le tient. La qualité réelle
des réponses et des verdicts à ces efforts : aucune copie n'a été jugée par le
vrai Haiku 5.5, et le point de l'audit « éprouver les rédactions avec le vrai
modèle » reste ouvert. La fréquence réelle des refus, des coupures et des
réponses illisibles : les lignes `[refus …]`, `[réponse coupée]` et `[réponse
illisible]` de `corrections_ia` la diront. Le coût réel : le tarif par token de
Haiku 5.5 est bien plus bas que celui de Haiku 4.5, mais la réflexion ajoute
des tokens de sortie ; le bilan se lit dans la console Anthropic. La durée :
la réflexion à l'effort « medium » ajoute quelques secondes avant le texte, non
mesurées.

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
(Seconde v483, Première v317, Terminale v384 — même diff mot pour mot, seules
la table et la version diffèrent). La page appelle
`sb.rpc('cles_de_connexion', { niveau: NIVEAU, prenom })` ; la fonction SQL
(migration 009) est `security definer`, comme `est_prof()` — elle lit la table
SANS repasser par la RLS, sans quoi le visiteur qui l'appelle ne verrait plus
rien — et rend les clés d'UN prénom exact, cinq au plus, triées : ni
l'identifiant, ni le prénom, ni la liste, et son type de retour (`setof text`)
est la preuve que rien d'autre ne peut en sortir. « Exact » se lit sans
accent, sans casse et sans espace double : `normaliserPrenom` dans la page
(NFD, combinants retirés, `toLowerCase`, `trim`, espaces réduits) et
`public.normaliser_prenom` en SQL DOIVENT rester équivalentes : l'une sert au
repli et à la création de compte, l'autre à la fonction ; si elles
divergeaient, un prénom passerait d'un côté et pas de l'autre. **Et elles
divergeaient** : la première table SQL ne traduisait que les accents du
français, et la relecture a mesuré onze écarts sur trente et un prénoms —
« seyma » pour Şeyma, « natasa » pour Nataša, « nguyen » pour Nguyễn entraient
avant la migration (repli, filtré par la page) et auraient lu « Prénom
inconnu » après ; une tabulation ou un insécable en bordure, que `trim()`
retire, restaient en SQL. Une table de `translate` GÉNÉRÉE depuis NFD a
suivi — et la seconde relecture l'a prise en défaut à son tour, en balayant
le plan de base entier : une table traduit le précomposé, elle ne retire pas
un accent DÉJÀ décomposé (« e » suivi d'un accent combinant, ce qu'un collage
produit), ni Ǿ et ǣ, ni ё et έ. La règle est donc celle de la page, mot pour
mot, par ce que PostgreSQL sait faire depuis sa version 13 : `normalize(p,
NFD)`, puis les combinants U+0300 à U+036F retirés ; il ne reste que les
minuscules, où `lower()` dépend de la locale du serveur — une table de 772
majuscules non décomposables (Ł, Ø, Æ, les capitales grecques et
cyrilliques…) vers leur minuscule l'en affranchit, et `lower()` ne traite
plus que l'ASCII. Les blancs sont ceux que `\s` et `trim()` voient en
JavaScript, insécable compris ; on réduit, puis on rogne. Zéro divergence
sur le plan de base, en émulation, locale « C » comprise. Et la règle a gagné
son contrôle : le banc de la base RELIT `normaliserPrenom` dans les trois
pages et `normaliser` dans le double, les exécute dans Node sur trente-trois
sondes (« Ayşe », « Nguyễn », « İsmail », « Chloé » dont l'accent est
décomposé, « Ǿystein », « Ёлена », « ŁUKASZ », « Alice » suivi d'une
tabulation, un insécable, trois espaces) et exige, sonde par sonde, le
résultat que rend `normaliser_prenom` sur la base jetable (« secondes.html
normalise le prénom comme la base », et ses trois jumeaux) — avec un bord qui
le garde honnête : la moitié au moins des sondes doit changer sous la règle,
sinon il le dit. La page essaie
son code sur chaque clé rendue — deux homonymes dans une classe, c'est
courant, et c'est le code qui départage —, puis, connectée, relit SA ligne
(`.select('id,prenom,cle').eq('cle', cle).single()`) : c'est elle qui porte
l'identifiant sous lequel ses notes s'enregistrent. Un compte sans ligne
referme sa session et lit « Compte introuvable — préviens ton professeur »
(cette branche-là n'est tenue par aucun contrôle, et le dire vaut mieux que
de le taire). Et seul un CODE REFUSÉ (statut 400, `invalid_credentials`)
passe à la clé suivante : une limitation de cadence — 429, le seul rempart
devant les codes, et une classe entière derrière l'adresse de
l'établissement —, une coupure, un compte non confirmé ne sont pas un code
faux ; dire « Code incorrect », vider la case et faire retaper aggraverait la
cadence. La page s'arrête, écrit « Connexion impossible — réessaie dans une
minute », garde le code dans sa case, et le dit en console (« une erreur de
cadence n'est pas un code faux : la page s'arrête à la première clé, le dit
et garde le code », le double sait rendre 429 par `window.__faux.cadence`).
Pas « tout statut 400 » — la seconde relecture l'a vu : un compte non
confirmé répond 400 aussi (`email_not_confirmed`, le réglage de confirmation
par courriel qu'aucun banc ne voit), et lisait « Code incorrect », case
vidée ; seul `invalid_credentials` est un code faux (« un compte non
confirmé n'est pas un code faux : pas de « Code incorrect », et le code
reste », `window.__faux.nonConfirme`). Et les homonymes — la raison d'être
de la boucle sur les clés — n'étaient exercés par aucun banc : un seul élève
semé, un `break` après le premier refus passait tout ; la section 3 sème
maintenant un second « Contrôle » à un autre code (« deux homonymes : c'est
le code qui départage, et la seconde clé entre après le refus de la
première »), et le contrôle de cadence mesure alors vraiment l'arrêt à la
première clé. Les avertissements que la page écrit en console sont tenus
aussi : le banc navigateur les collecte (`s.avertissements`) et les exige
sur la panne et la cadence. La fonction ne rend jamais une
clé VIDE non plus (`and e.cle is not null`) : une ligne créée à la main sans
clé aurait donné un « null » que la page aurait changé en adresse « null@… »
(« la fonction ne rend jamais une clé vide »). La création de compte passe par la même porte :
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
`if(error.code!=='PGRST202')` PRÉCÈDE le repli, qu'un contrôle de source
exige cet ordre, et qu'un contrôle d'exécution le double : sous
`window.__faux.panne`, le rpc du double rend une erreur qui n'est pas
PGRST202, et la page ne doit ni relire la liste, ni tenter une connexion
(« une panne de la fonction SQL n'ouvre ni le repli ni une connexion, et le
dit ») — et elle l'écrit en console, pour que la panne se lise sans ouvrir
l'onglet Réseau.
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
cause). ET LA CAUSE EST ÉCRITE : la relecture a retiré la 009 de la boucle
des mutations, et huit mutations sont restées « détectées » — pour une
fonction absente, pas pour la faille jouée ; un banc vert sur huit détections
qui ne mesuraient rien. Chaque mutation porte donc la ligne ÉCHEC qu'elle
doit produire (« il ne voit aucune note (2) », « elle ne peut pas noter à la
place de Bob », … « il obtient la clé d'un prénom qu'il connaît, et elle
seule (∅) »), une erreur « does not exist » n'est jamais une détection, et
une mutation sans cause attendue rougit d'elle-même. La démonstration « sans 002, rien ne protège » joue désormais 001
PUIS 009 avant le banc des rôles, sinon l'échec viendrait d'une fonction
absente et ne démontrerait rien : « 009 refuse de se déclarer faite tant que
la porte de 002 est ouverte, et la nomme » et « et c'est bien la liste
ouverte qui le fait rougir, pas une fonction absente » tiennent la bonne
cause. Le banc NAVIGATEUR (section 3) tape le prénom de contrôle au lieu de
cliquer une pastille, et exige : « un prénom inconnu ne tente aucune
connexion, et le dit », « le prénom se reconnaît sans accent ni majuscule »
(« CONTROLE » pour « Contrôle » — et le contrôle rougit aussi si le prénom de
contrôle n'avait ni accent ni minuscule : il ne mesurerait rien), « sans la
fonction SQL, la page se replie sur l'ancienne liste et y reconnaît le prénom
sans accent — tant que la 009 n'est pas jouée » (`window.__faux.sansRpc =
true` fait répondre PGRST202 à tout `rpc` du double : la fonction a été
demandée, la liste lue, l'élève entré — les trois pas ; et le prénom y est
tapé « CONTROLE », parce que dans le repli c'est la normalisation de la PAGE
qui filtre, et qu'une première version tapait le prénom exact — une page qui
ne normalisait plus passait tout le banc, sabotage prouvé par la relecture),
« une panne de la fonction SQL n'ouvre ni le repli ni une connexion, et le
dit », « une erreur de cadence n'est pas un code faux : la page le dit et
garde le code », « un prénom déjà pris, même écrit sans accent, ne crée pas
de second compte », « avant la connexion, la page ne lit aucune ligne de la
table des élèves » (un `rpc cles_de_connexion` avant le premier `signIn`,
aucun `select` sur la table avant lui ; sans `signIn` au journal, « le
contrôle n'a rien mesuré »). Chaque retour à l'état de départ y est
inconditionnel (`logout()` ramène de n'importe quel écran) : un retour qui
dépendait de l'écran lu 500 ms plus tôt avait fait avorter tout le banc sur
un clic de trente secondes vers un bouton caché, pendant un sabotage. Le banc PRINCIPAL lit la source — « l'écran de
connexion n'affiche plus de liste de prénoms » : plus de `#nameChips`,
`#loginPrenom` en `autocomplete="off"` dans le `<form id="modeCo"
autocomplete="off">`, `connexionEleve()` et `creerCompte()` passent par
`clesDuPrenom()`, qui appelle `sb.rpc('cles_de_connexion', { niveau:
NIVEAU, … })`, le repli `select('cle,prenom')` EXISTE et la garde PGRST202 le
PRÉCÈDE — et il exécute la connexion dans jsdom, le double de Supabase
injecté à la place de supabase-js (« 2 ter », « la connexion par prénom
ouvre l'espace sans lire la table avant le signIn », puis un second passage
sous `sansRpc` avec « CONTROLE » : « et sans la fonction SQL, le repli
reconnaît le prénom tapé sans accent (jsdom) ») ; et il relit les numéros que
la migration et sa notice citent pour cette page : « les numéros de version
cités par la migration 009 et sa notice ne dépassent pas celui de la page »
— par une constante de la page, `VERSION_CONNEXION_PRENOM`, le numéro qui a
apporté le champ et ne bouge plus quand `APP_VERSION` avance : chaque mention
doit lui être ÉGALE (trop haut, Turquet attendrait une version qui n'arrive
jamais ; trop bas, il croirait une page en ligne déjà passée au champ), et
la constante ne dépasse pas la page. Éprouvé : « Seconde v484 » glissé
dans l'en-tête de la 009 — « ✗ les numéros de version cités par la migration
009 et sa notice sont ceux de la page → supabase/migrations/009_connexion_
sans_liste.sql cite Seconde v484 au lieu de v483 ». Le double
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
Puis, après la relecture, sur des COPIES de la Seconde dans le scratchpad
(section 3 seule, une minute chacune) : la page qui ne normalise plus (plus
de NFD) — « ✗ sans la fonction SQL, la page se replie sur l'ancienne liste et
y reconnaît le prénom sans accent — tant que la 009 n'est pas jouée → écran
atteint : scr-login », le contrôle que la relecture avait vu passer au vert
sur ce même sabotage tant qu'il tapait le prénom exact ; toute erreur de
connexion traitée comme un code faux — « ✗ une erreur de cadence n'est pas un
code faux : la page le dit et garde le code → le code a été effacé («  ») » ;
le repli pris sur toute erreur — « ✗ une panne de la fonction SQL n'ouvre ni
le repli ni une connexion, et le dit → écran atteint : scr-space ». Un seul
rouge par sabotage, sur le contrôle visé, les 48 autres verts. Côté base, la
boucle des mutations joue elle-même ses sabotages, et la 009 est confiée à
un propriétaire sans droit de traverser la RLS — « 009 refuse une fonction
dont le propriétaire ne traverse pas la RLS — mesuré, pas lu sur
l'attribut » — avant d'être rendue à postgres.
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
avoir VU le champ « Ton prénom » sur les trois pages en ligne
(`supabase/LISEZMOI.md`, 3 nonies). Le repère est l'écran, pas un numéro :
les numéros cités d'abord (v480, v316) étaient faux avant même la mise en
ligne, `main` ayant avancé pendant le travail — et « v316 » désignait une
Première EN LIGNE qui ne connaissait pas la fonction. Que le cache de schéma
de PostgREST connaisse la fonction une fois créée : le fichier lui demande de
se recharger (`notify pgrst, 'reload schema'`), Supabase le fait aussi de
lui-même, mais pas à la seconde, et pendant cette fenêtre la page se replie
sur une liste fermée — « Prénom inconnu » à tout le monde, et il faut
attendre, pas rejouer. Que supabase-js rende bien `PGRST202` sur une fonction
absente, et que `.single()` après `signIn` passe sous la politique
`authenticated`. Que `security definer` y traverse la RLS, le `postgres` de
Supabase n'étant pas superutilisateur : le fichier ne se contente plus de
lire l'attribut, il MESURE — il prend le rôle `anon`, demande un prénom
présent dans chaque table, et échoue si la fonction ne rend rien ; la
relecture avait montré que l'attribut seul passait au vert sur une base où la
fonction, confiée à un propriétaire sans droit de traverser la RLS, ne
rendait rien à personne. Une table vide, ou un rôle qu'on ne peut pas
prendre, se déclare dans la sortie — et la seconde relecture a resserré la
mesure deux fois : le témoin est un prénom que la fonction PEUT rendre (une
ligne au prénom blanc mais à clé, créée à la main, se classait première et
bloquait la migration entière en accusant la RLS), et seule la prise de rôle
est protégée par le gestionnaire d'exception — une erreur de droit levée
DANS la fonction fait échouer le fichier au lieu de se déguiser en « rôle
impossible à prendre » (« 009 échoue sur une fonction dont le propriétaire
n'a aucun droit, au lieu de se déclarer faite »). Le rejeu se mesure sur des
tables pleines, comme sur le projet (« et rejouée sur des tables pleines,
elle mesure encore son effet trois fois »). Et ce qui RESTE ouvert, nommé : un
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

**La liste des prénoms s'affiche de nouveau avant le code, et le prix est
nommé.** Décision de Turquet, le 14 octobre 2026 — le lendemain de la mise en
ligne de l'écran à prénom tapé (#638) : « revenir à la liste des élèves qui
s'affichent à l'écran avant de rentrer son mot de passe ». Les pastilles
reviennent, comme avant #638 : `#nameChips` sous « Choisis ton prénom »,
dessinées par `renderLoginNames()` qu'appelle `accueil()`, depuis
`select('id,prenom,cle').order('prenom')` ; la pastille cliquée pose
`selectedEleve`, prend `.sel`, fait paraître `#pinRow` (caché jusque-là), vide
le code et lui donne le focus 60 ms plus tard (Seconde v488, Première v319,
Terminale v385 — même diff aux trois pages, à la table et à la version près).
Ce qui RESTE de #638, et c'est voulu : `normaliserPrenom` et `clesDuPrenom`,
avec sa garde PGRST202 et son `console.warn` ; la création de compte qui
refuse « lea » quand « Léa » existe ; la boucle sur les clés, où seul un code
refusé (`invalid_credentials`) passe à la clé suivante — cadence, coupure ou
compte non confirmé disent « Connexion impossible — réessaie dans une minute »
et gardent le code ; la relecture de SA ligne après `signIn` (`.eq('cle',
cle).single()`), et « Compte introuvable » qui referme la session.
`VERSION_CONNEXION_PRENOM` reste 483, 317 et 384 : il nomme la version qui a
APPORTÉ le champ, que la 009 et sa notice citent toujours, et le contrôle qui
l'exige (« les numéros de version cités par la migration 009 et sa notice sont
ceux de la page ») n'a pas bougé — c'est pourquoi la notice de la 010 ne cite
AUCUN numéro de page : « Seconde v484 » écrit dans `supabase/LISEZMOI.md`
aurait fait rougir ce contrôle, et l'ordre étant indifférent, le repère y est
l'écran.
**Le prix, nommé — et ce que disait le paragraphe précédent reste VRAI.** La
clé anonyme de Supabase est dans la page : n'importe qui, sans compte, depuis
n'importe où sur Internet, lit de nouveau les prénoms de trois classes de
mineurs ET la clé de chacun, dont l'adresse `<cle>@DOMAINE_COMPTES` est
dérivée. La moitié de l'identifiant est offerte ; le code à six chiffres et la
limitation de cadence de Supabase redeviennent le seul rempart (« Les codes
font 6 chiffres »). Rien de ce que mesurait le paragraphe précédent n'a changé
: c'est la décision qui a changé, prise en connaissance de ce prix, et la
page, la 010 et sa notice l'écrivent chacune. L'oracle d'existence par prénom
de la 009 s'en va avec elle — remplacé par la liste entière, qui en dit plus.
Et les paragraphes que le précédent rangeait dans « l'état d'avant octobre
2026 » (« le prénom n'est pas un secret — l'écran de connexion l'affiche », «
deux prénoms identiques ne se distinguent plus sur l'écran de connexion »)
redeviennent vrais à la lettre.
**LE PIÈGE : personne ne sait dans quel état est la base.** Turquet colle les
migrations à la main, et rien ne dit si la 009 a été jouée. Trois états
existent, et la page doit connecter dans les trois sans rien attendre de
personne : A, la 009 jamais jouée — la liste se lit, `cles_de_connexion`
n'existe pas (le rpc rend `PGRST202`) ; B, la 009 jouée, pas la 010 — la liste
revient VIDE au visiteur, zéro ligne SANS erreur (c'est la RLS), et la
fonction existe ; C, la 010 jouée — la liste se lit, les deux fonctions ont
disparu. Une marche arrière naïve — rendre aux pages leur code d'avant #638 —
marchait en A et en C, et en B fermait la porte à TOUTE la classe : liste
vide, « Aucun compte pour l'instant », aucun chemin pour entrer. Et elle
ouvrait la porte aux comptes en double : la création de compte d'avant
cherchait le prénom par `ilike('prenom')` dans cette même liste, qui en B ne
voit personne — chaque élève, lisant « Aucun compte », aurait recréé le sien,
une seconde ligne sous le même prénom, ses notes coupées en deux, et deux
pastilles « Léa » le jour où la 010 passe. Une liste vide sans erreur ne se
distingue pas d'une classe vide : c'est « Une suppression que RLS refuse n'est
pas une erreur », côté lecture.
**Le repli de transition : sur une liste VIDE, et seulement alors, la page
demande à la base si la fonction existe** — `sb.rpc('cles_de_connexion', {
niveau: NIVEAU, prenom: '' })`, un prénom vide, qui ne rend rien par
construction. `PGRST202` : c'est A ou C, la classe est vraiment vide, « Aucun
compte pour l'instant. Crée le tien avec « Créer mon compte ». », sans champ.
Toute autre réponse — aucune erreur, ou une erreur d'un autre code — : c'est
B, la liste est fermée exprès ; `#chipsRow` se cache, `#prenomRow` (le champ «
Ton prénom » d'hier, `hidden` par défaut) et `#pinRow` paraissent, et l'élève
entre par le prénom tapé, exactement comme depuis #638. `connexionEleve()`
choisit dans cet ordre : une pastille choisie, et sa clé ; sinon `#prenomRow`
visible, et `clesDuPrenom()` ; sinon « Choisis ton prénom ». Puis la MÊME
boucle. `creerCompte()` garde `clesDuPrenom()` — la fonction si elle existe,
la liste filtrée par `normaliserPrenom` sinon — et refuse le doublon sans
accent dans les trois états. Le repli S'ÉTEINT de lui-même : la 010 rouvre la
liste, qui revient pleine, et le sondage n'est plus fait ; il ne restera rien
à retirer. Trois choses nommées : l'enveloppe `#chipsRow` existe parce que
`.chips{display:flex}` l'emporte sur un `hidden` posé directement sur
`#nameChips` ; en B, une classe VRAIMENT vide voit le champ « Ton prénom » au
lieu de « Aucun compte » — un visiteur n'a aucun moyen de les distinguer, et «
Créer mon compte » reste à côté ; une exception levée par le sondage lui-même
tombe dans le `catch` de `renderLoginNames()` (« Connexion impossible. Vérifie
ta configuration. »), branche qu'aucun banc n'exerce.
**La 010 (`supabase/migrations/010_retour_de_la_liste.sql`, notice 3 decies)
se joue dans N'IMPORTE QUEL ORDRE** — la seule migration du dossier dont on
puisse le dire, et c'est le repli qui le permet : avant ou après la mise en
ligne, que la 009 ait été jouée ou non. Elle remet `p_<table>_liste` « for
select to anon, authenticated using (true) » sur les trois tables (`drop
policy if exists` puis `create`, même nom : remplacée, pas doublée), supprime
`cles_de_connexion(text, text)` et `normaliser_prenom(text)` sans cascade, et
demande à PostgREST de recharger son cache. Supprimer la fonction n'est pas du
ménage : son ABSENCE est le signal que lisent les pages ; laissée, elle ferait
afficher « Ton prénom » à une classe vide, et masquerait un jour une liste
refermée par erreur. Page d'avant ou d'après, base A, B ou C, chaque
combinaison connecte : la page de #638 restée en cache sur une tablette
appelle la fonction, reçoit `PGRST202` dès la 010 passée, et se replie sur la
liste, rouverte par le même fichier. La 010 dit d'abord l'ÉTAT TROUVÉ (« la
009 avait été jouée », ou « pas de cles_de_connexion »), puis se contrôle
bruyamment (`raise exception`) : une seule politique de lecture par table, qui
nomme `anon` et `authenticated` et laisse tout lire ; les deux fonctions
absentes ; et l'EFFET MESURÉ — pour chaque table non vide, sous `set local
role anon` (seule la prise de rôle dans un sous-bloc `insufficient_privilege`,
le rôle d'avant rendu par `execute format('set local role %I', ancien)`), le
visiteur lit `id, prenom, cle` et doit compter autant de lignes que le rôle
qui joue le fichier ; une table vide ou un rôle impossible à prendre se
DÉCLARE par un `raise notice`. Un écart au contrat, voulu : un second
gestionnaire entoure la LECTURE sous `anon`, non pour la sauter mais pour
relever son refus en clair (« un visiteur n'a pas le droit de lire id, prénom
et clé… un droit de colonne retiré à anon ? ») au lieu d'un « permission
denied » nu.
**Ce que chaque banc tient.** Le banc de la BASE (`npm run test:base`) a gagné
« 1 septies. LA MIGRATION 010 — LE RETOUR DE LA LISTE » : « 010 s'applique
après la 009, et son contrôle final ne trouve rien à redire », « elle
reconnaît la base où la 009 a été jouée », « 010 rouvre la liste sur les trois
tables d'élèves », « 010 mesure son effet en tant que visiteur, sur les trois
tables », « plus aucune des deux fonctions de la 009 (aucune) », « exactement
une politique de lecture par table d'élèves, et elle nomme anon », « un
visiteur lit de nouveau la liste entière des trois classes (1/1/1, comme le
superutilisateur) », « rejouer 010 ne fait plus rien », « et rejouée, elle
sait qu'il n'y a plus de fonction à retirer, et mesure encore son effet trois
fois », « 010 demande à PostgREST de recharger son cache de schéma » — puis
l'état A, sur une base neuve : « sur une base où la 009 n'a JAMAIS été jouée,
010 s'applique aussi sans erreur », « elle y reconnaît qu'il n'y a aucune
fonction à retirer », « et elle y mesure son effet trois fois, une politique
de lecture par table, ouverte à anon ». La démonstration « sans 002, rien ne
protège » gagne « 010 refuse de se déclarer faite tant que la porte de 002 est
ouverte, et la nomme », et sa cause attendue devient « et c'est bien la fuite
des notes qui le fait rougir, pas une autre cause ». L'état B reste éprouvé,
parce qu'il peut exister sur le projet : les contrôles du visiteur de la 009
quittent le banc des rôles (joué désormais sur l'état final, 009 PUIS 010) et
se rejouent sous `set role anon` juste après la 009 — « en état B, la liste
revient VIDE au visiteur — zéro ligne, sans erreur (0) », « il obtient la clé
d'un prénom qu'il connaît, et elle seule », « la fonction ne rend jamais une
clé vide », « sans accent ni majuscule, le prénom se reconnaît quand même », «
un prénom inconnu ne rend rien », « un prénom vide ne rend rien », « un niveau
inconnu est refusé », « la fonction ne rend que des clés : ni prénom ni
identifiant » —, et avec eux la question même que posent les pages, le niveau
relu dans le `const NIVEAU` de chacune : « la sonde de secondes.html (niveau «
secondes », prénom vide) répond sans erreur, et ne rend rien », et ses deux
jumeaux. Le banc des rôles (`tests/base-controles.sql`, 46 contrôles annoncés
au lieu de 52) voit le visiteur : « il voit la liste des prénoms (3) », « il
lit aussi la clé de chacun, dont la pastille dérive l'adresse de connexion (3)
» — un seul select des trois colonnes, comme la page, et un refus affiché «
(refusée) » au lieu d'avorter. La boucle des mutations monte l'état final
avant chaque mutation, et si la 010 refuse, chacune sort « non mesurée :
l’état final (009 puis 010) ne se monte pas » au lieu de faire tomber le banc
; « la liste des élèves redevient lisible sans connexion » et « la fonction de
connexion perd SECURITY DEFINER » en sortent — la première est maintenant
l'état EXIGÉ —, « la liste se referme aux visiteurs » (cause attendue « ÉCHEC
: il voit la liste des prénoms (0) ») et « la clé ne se lit plus sans
connexion (droit de colonne retiré) » (cause « … (refusée) ») y entrent :
garder la liste et cacher les clés est le durcissement le plus tentant, et il
couperait la connexion de tout le monde. Le banc NAVIGATEUR (section 3) joue
les trois états par les interrupteurs du double — la liste ouverte ;
`window.__faux.listeFermee`, nouveau (zéro ligne sans erreur à un visiteur, la
fonction, security definer, lisant quand même) ; `sansRpc` — et exige : « la
liste des prénoms s'affiche, une pastille par élève, et une pastille connecte
» (une « Anaïs » semée passe devant « Contrôle » : un écran qui connecterait
toujours la première pastille ne passe pas), « liste fermée par la 009 : la
page propose de taper son prénom, sans pastille, et l'élève entre » (tapé «
CONTROLE »), « liste vide sans la fonction (classe vide, ou 010 jouée) : «
Aucun compte pour l'instant », sans champ de prénom », « un prénom déjà pris,
même écrit sans accent, ne crée pas de second compte — liste fermée (état B),
par la fonction SQL » et « … — fonction absente (états A et C), par la liste
», « la liste ne demande que id, prenom et cle », « avec la liste ouverte, la
page n'interroge pas la fonction de connexion ». Rejoués sur la pastille : «
un code faux n’ouvre pas l’espace de l’élève », « c’est le serveur qui refuse
le code, pas la page », « une erreur de cadence n'est pas un code faux : la
page le dit et garde le code », « un compte non confirmé n'est pas un code
faux : pas de « Code incorrect », et le code reste ». Rejoués en état B : « un
prénom inconnu ne tente aucune connexion, et le dit », « deux homonymes :
c'est le code qui départage, et la seconde clé entre après le refus de la
première », « une erreur de cadence n'est pas un code faux : la page s'arrête
à la première clé, le dit et garde le code », « une panne de la fonction SQL
n'ouvre ni le repli ni une connexion, et le dit ». Retirés : « avant la
connexion, la page ne lit aucune ligne de la table des élèves » (elle la lit :
c'est la liste), « sans la fonction SQL, la page se replie sur l'ancienne
liste et y reconnaît le prénom sans accent — tant que la 009 n'est pas jouée »
(remplacé par l'état C, où le doublon éprouve la normalisation de la PAGE), «
le prénom se reconnaît sans accent ni majuscule » (fondu dans l'entrée en B).
`connecter()` clique la pastille de `PRENOM_CONTROLE` (`cliquerPastille`, qui
rend `false` au lieu de lever), chaque contrôle part de `logout()` et remet
ses interrupteurs dans un `finally`. Le banc PRINCIPAL lit la source — «
l’écran de connexion affiche la liste des prénoms, et ne se replie sur le
prénom tapé que si la liste est fermée », deux bords nommés : la liste qui
s'affiche et la pastille qui connecte ; le repli qui ne s'ouvre que sur une
liste fermée (le sondage n'existe QUE dans la branche « liste vide », découpée
par accolades appariées, et `#prenomRow` ne s'ouvre que sur « pas d'erreur, ou
un autre code que PGRST202 ») — et exécute dans jsdom (« 2 ter ») : « liste
ouverte : une pastille cliquée ouvre l’espace, sans appeler la fonction de
connexion (jsdom) » et « liste fermée par la 009 : le champ du prénom
s’affiche, et « CONTROLE » tapé ouvre l’espace (jsdom) ».
**Éprouvé par sabotage, sur des copies.** Pages (Seconde) : le sondage retiré
— « ✗ liste fermée par la 009 : la page propose de taper son prénom, sans
pastille, et l'élève entre → la liste vide n'a pas fait sonder la fonction : «
Aucun compte pour l'instant. Crée le tien avec « Créer mon compte ». » », les
quatre contrôles d'état B qui ne trouvent plus de champ, « ✗ liste vide sans
la fonction (classe vide, ou 010 jouée) : … → la fonction n'a pas été sondée :
la réponse PGRST202 n'a pas été lue, le contrôle ne mesure rien », la source
(« → aucun sondage de cles_de_connexion sur une liste vide : la 009 jouée, la
page dirait « Aucun compte » à toute la classe ») et le jsdom ; le sondage qui
conclut « fermée » sur PGRST202 — « → un champ « Ton prénom » s'affiche alors
que la fonction n'existe pas : le sondage conclut « fermée » sur PGRST202 » ;
`selectedEleve` ignoré par `connexionEleve()` — « ✗ la liste des prénoms
s'affiche, une pastille par élève, et une pastille connecte → écran atteint :
scr-login », « ✗ un compte non confirmé n'est pas un code faux … → message :
{"texte":"Choisis ton prénom","classe":"show"} », la source « →
connexionEleve() ne se sert pas de selectedEleve : la pastille cliquée ne
connecte personne », le jsdom « → aucune connexion tentée : le contrôle n'a
rien mesuré » ; `creerCompte()` rendu à `ilike` — les deux doublons « → 1
inscription(s) : un second compte a été créé sous le même prénom » ; le
sondage sorti de la branche vide — « ✗ avec la liste ouverte, la page
n'interroge pas la fonction de connexion → 1 appel(s) rpc avant la connexion :
cles_de_connexion {"niveau":"secondes","prenom":""} » ; la liste lue par
`select('*')` — « ✗ la liste ne demande que id, prenom et cle → 1 lecture(s)
d'autres colonnes : select(*) » ; `#prenomRow` sans `hidden` — « → #prenomRow
n’est pas caché par défaut : le champ du prénom s’afficherait à côté des
pastilles » ; et la page de #638 elle-même — « → la liste des prénoms
(#nameChips) n’est pas dans le formulaire de connexion ». Base : la 010 qui
oublie `anon` — « ✗ 010 s'applique après la 009, et son contrôle final ne
trouve rien à redire → ERROR: la liste des prénoms reste fermée aux visiteurs
: eleves.p_eleves_liste (pour authenticated) — l'écran de connexion n'aurait
plus de pastilles » ; la 010 qui garde la fonction — « → ERROR:
public.cles_de_connexion(text, text) existe encore : les pages la lisent comme
le signe d'une liste fermée exprès » ; la mesure ET le contrôle « nomme anon »
retirés de la 010 : elle passe d'elle-même, et le banc rougit ailleurs — « ✗
010 mesure son effet en tant que visiteur, sur les trois tables → 0 table(s)
mesurée(s) sur 3 », « un visiteur lit de nouveau la liste entière … → 0/0/0
pour 1/1/1 » ; le banc des rôles qui attend encore zéro prénom — « ✗ et c'est
bien la fuite des notes qui le fait rougir, pas une autre cause → ERROR: ÉCHEC
: il voit la liste des prénoms (3) », et huit mutations « rougit, mais pas là
où la mutation frappe » ; le contrôle de la clé retiré — « ✗ détectée : la clé
ne se lit plus sans connexion (droit de colonne retiré) → le banc est resté
vert alors que la base est ouverte » ; un droit de colonne retiré à `anon`
avant la 010 — « → ERROR: eleves_1ere : un visiteur n'a pas le droit de lire
id, prénom et clé (permission denied for table eleves_1ere) — la page ne
pourrait pas afficher les pastilles : un droit de colonne retiré à anon ? » ;
`NIVEAU='premieres'` dans une copie de la Première — « ✗ la sonde de
premiere-specifique.html (niveau « premieres », prénom vide) répond sans
erreur, et ne rend rien → erreur : ERROR: niveau inconnu : premieres ». Un
piège de banc, en passant : le PostgreSQL jetable tourne sous `postgres`, qui
ne lit pas le scratchpad (0700) — les sabotages de la base se jouent depuis un
miroir dans `/tmp`, effacé à chaque passage.
**Puis la relecture du premier jet a trouvé deux trous sur les pastilles, et
des contrôles qui ne tenaient qu'un bord.** Deux « Léa » font deux pastilles
pareilles : la page n'essayait que la clé de la pastille CLIQUÉE, et l'élève
qui touchait celle de sa voisine lisait « Code incorrect » avec son propre
code juste. `connexionEleve()` essaie désormais la clé de la pastille cliquée,
puis celles du même prénom normalisé, déjà lues avec la liste (`listeEleves`,
gardée par `renderLoginNames()`, vidée à chaque redessin) — aucune requête de
plus, et c'est le code qui départage, comme dans le repli. Une ligne SANS CLÉ
(un élève ajouté à la main dans la table, jamais relié) a sa pastille, mais
aucune adresse : la page tentait « null@… » et répondait « Code incorrect » à
tout code ; elle dit maintenant « Ton compte n'est pas encore relié —
préviens ton professeur » sans rien tenter (« Nouveau code » de l'onglet
Élèves pose la clé : `admin-eleve` fait `eleve.cle || crypto.randomUUID()`).
Le repli de `clesDuPrenom()` sur la liste et la fonction du double écartent
les clés vides, comme la vraie fonction (`and e.cle is not null`). Côté
bancs : `ecranConnexion()` jugeait la visibilité à l'attribut `hidden` — un
bloc caché par la feuille de styles passait pour visible ; il la juge au
RENDU (`getClientRects()` et `visibility`) ; « un code faux n’ouvre pas
l’espace de l’élève » passait sur tout écran autre que `scr-space`, y compris
quand aucune pastille n'avait été cliquée ; il exige `scr-login`, et dit «
rien n’a été tenté » quand l'entrée a échoué avant le code ; le pavé du code
à 390 et 360 px vérifie le retour de `cliquerPastille` au lieu de poser le
focus sur une case cachée. Trois contrôles naissent en section 3 : « deux
homonymes sur les pastilles : la pastille cliquée d'abord, puis son
homonyme, et c'est le code qui départage » (la clé de la pastille cliquée est
LUE, pas supposée, et le banc tape le code de l'AUTRE), « une pastille sans
clé ne tente aucune connexion, et dit que le compte n'est pas relié », « liste
fermée et sondage en panne : la page propose le prénom tapé, pas « Aucun
compte » » (la branche `sonde.code !== 'PGRST202'` du sondage, exécutée). Et
trois au banc de la base, chacun sur sa base neuve : « un droit de colonne
retiré à anon fait échouer 010, qui le nomme », « le droit rendu, 010 passe
et mesure ses trois tables », « sur trois tables vides, 010 passe et dit
trois fois « table vide, effet non mesuré », sans rien prétendre mesurer » —
183 contrôles. Éprouvés par sabotage, sur une copie de la Seconde, chacun
rougissant SEUL sur la section 3 : les homonymes retirés de
`connexionEleve()` — « ✗ deux homonymes sur les pastilles : … → écran atteint
: scr-login — tentatives : refus:cle-controle@eleves.exercices-interactifs.invalid
» ; la garde de la ligne sans clé retirée — « ✗ une pastille sans clé … →
message : {"texte":"Code incorrect","classe":"show err"} » ; le sondage qui
ne conclut « fermée » que sans erreur (`if(!sonde)`) — « ✗ liste fermée et
sondage en panne : … → la page annonce « Aucun compte pour l'instant. Crée le
tien avec « Créer mon compte ». » sur une panne du sondage ». Et les deux
bords du banc lui-même : `#pinRow{visibility:hidden}` — invisible pour
l'élève, visible pour l'ancien `vu` — fait rougir chaque contrôle qui tape
un code (« → la case du code reste cachée après le clic ») ; les pastilles
renommées (`className='puce'`) font dire au contrôle du code faux « →
rien n’a été tenté : (aucune pastille « Contrôle » à cliquer) », là où il
passait au vert ; et devant les mêmes pastilles renommées, le pavé du code
rougit aux deux largeurs de téléphone (« → aucune pastille « Contrôle » à
cliquer : la case du code n'est pas atteignable »), là où il posait sans
le dire le focus sur une case cachée.
**Puis une seconde relecture, adversariale — quatre relecteurs, un sceptique
derrière chacun — a confirmé dix constats, tous mineurs, et tous corrigés.**
Côté pages. La pastille SANS CLÉ disait « pas encore relié » à partir de la
ligne LUE à l'ouverture : le professeur clique « Nouveau code », l'élève
revient sur la même tablette, et le message se répète alors que le compte
existe ; `connexionEleve()` RELIT désormais la ligne de la pastille sans clé
(`select('cle').eq('id', …).maybeSingle()`) au moment de valider, et entre si
la clé est là. La même pastille, quand un HOMONYME est relié, essayait la clé
de l'homonyme et répondait « Code incorrect » à tout code — le message
complet est « Code incorrect — ou ton compte n'est pas encore relié :
préviens ton professeur ». Le filtre des clés vides ajouté au premier tour
rendait la création de compte AVEUGLE aux lignes sans clé, en A et en C :
l'élève non relié qui « recrée » son compte en faisait une seconde ligne, ses
notes restées sur la première — régression sur `main`, qui la voyait ;
`clesDuPrenom(prenom, avecLignesSansCle)` garde le filtre pour SE CONNECTER et
l'ôte pour REFUSER UN DOUBLON (`creerCompte` passe `true`). En B, la fonction
de la 009 ne voit pas ces lignes non plus (`and e.cle is not null`) : limite
d'avant, nommée dans la 010 et la 3 decies. « Ce prénom existe déjà —
connecte-toi » renvoyait à une liste lue AVANT la création faite ailleurs,
sans la pastille : `creerCompte` rappelle `renderLoginNames()`, qui relit la
liste et revient à la connexion. Et l'ÉTAT B', que personne n'avait compté :
la 009 offrait, « possible, non fait », de retirer à `anon` le DROIT de lire
la table. Appliqué, PostgREST rend une ERREUR 42501, pas une liste vide — la
page tombait dans `catch` (« Connexion impossible. Vérifie ta
configuration. ») à toute la classe, et la 010 collée pour réparer échouait à
sa propre mesure, tout annulé. La page lit désormais 42501 comme une liste
fermée (le même sondage, et un `console.warn('liste des prénoms : …')`) ; la
010 rend `grant select (id, prenom, cle) … to anon` — ces trois colonnes
SEULES : si le droit de table avait été retiré, `user_id` et `created_at`
restent fermés au visiteur ; sinon le `grant` ne change rien. Le message de
sa mesure dit maintenant ce qui reste possible : « le grant de l'étape 1 n'a
pas pris — jouez ce fichier en tant que propriétaire des tables » (un rôle
sans droit de donner reçoit un AVERTISSEMENT de PostgreSQL, pas une erreur).
Côté bancs. Le chemin des pastilles se jouait sur le double par défaut — la
liste lisible ET la fonction qui répond, un état que la base ne connaît
jamais : en A et en C la fonction manque, en B la liste est fermée. Tout le
bloc des pastilles se joue maintenant sous `sansRpc`, comme la première passe
jsdom de « 2 ter ». Le contrôle des homonymes cliquait toujours la PREMIÈRE
pastille, qui était aussi la tête de liste : une page qui suivrait l'ordre de
la liste au lieu du clic passait ; il clique la SECONDE, exige qu'elle ne soit
pas la tête de liste (sinon « le contrôle ne mesure rien »), et qu'aucun
`rpc` ne soit fait. Cinq contrôles naissent en section 3 : « une pastille lue
sans clé, reliée depuis par le professeur, connecte sans recharger la page »,
« une pastille sans clé dont l'homonyme est relié : un code refusé dit aussi
« pas encore relié », et le code de l'homonyme entre », « un prénom dont la
ligne n'a pas de clé ne crée pas de second compte (états A et C) », « un
prénom pris ailleurs depuis l'ouverture : refusé à la création, et l'écran
revient à la connexion avec sa pastille », et en état B « liste refusée par
un droit retiré à anon (42501) : la page sonde, propose le prénom tapé, et
l'élève entre » — le double gagne `window.__faux.listeRefusee` (42501 à tout
select d'une table d'élèves sans session). Le banc de la base remplace « un
droit de colonne retiré à anon fait échouer 010 » — devenu faux, puisque la
010 rend le droit — par l'état B' sur sa propre base, la 009 jouée puis le
`revoke` : « l'état B' se monte : le visiteur est REFUSÉ, pas servi d'une
liste vide », « dans l'état B', 010 rend le droit de lire id, prénom et clé,
et passe en mesurant ses trois tables », « le visiteur y lit de nouveau id,
prénom et clé des trois classes (1/1/1) », « et rien de plus : user_id et
created_at restent refusés au visiteur », « rejouée dans l'état B', 010 ne
fait plus rien et mesure encore ses trois tables » — 186 contrôles. Trois
textes corrigés : la 3 decies affirmait qu'une 009 rejouée par erreur après
la 010 laissait « la connexion marcher encore » — faux dans la minute du
cache de PostgREST, où la page dit « Aucun compte » et la création de compte
ne voit plus les prénoms pris ; l'en-tête de la 010 promettait de refuser
toute politique « for all » revenue, alors qu'il ne relit que les tables
d'élèves (« rejouez la 002, dont le filet contrôle les neuf ») ; et la limite
de l'état B pour les lignes sans clé est écrite. Éprouvé par sabotage. Base,
sur des copies : le `grant` retiré de la 010 — « ✗ dans l'état B', 010 rend
le droit de lire id, prénom et clé, et passe en mesurant ses trois tables →
… ERROR: eleves : un visiteur n'a pas le droit de lire id, prénom et clé
(permission denied for table eleves) — … le grant de l'étape 1 n'a pas pris
— jouez ce fichier en tant que propriétaire des tables (postgres, dans
l'éditeur SQL) », avec le visiteur et le rejeu (la branche d'exception de la
mesure, que rien d'autre n'atteint, y est exercée) ; le droit rendu sur la
TABLE entière — « ✗ et rien de plus : user_id et created_at restent refusés
au visiteur → 0 ; 1 ». Pages, sur une copie de la
Seconde, section 3 seule, chacun sur son contrôle — le dernier sur deux : la relecture de la
pastille sans clé retirée — « ✗ une pastille lue sans clé, reliée depuis par
le professeur, connecte sans recharger la page → écran atteint : scr-login —
la ligne n'a pas été relue, la clé posée depuis est ignorée » ; le message
réduit à « Code incorrect » — « ✗ une pastille sans clé dont l'homonyme est
relié : … → message : {"texte":"Code incorrect","classe":"show err"} » ;
`creerCompte` rendu à `clesDuPrenom(prenom)` — « ✗ un prénom dont la ligne
n'a pas de clé ne crée pas de second compte (états A et C) → 1
inscription(s) : une seconde ligne « Zélie » a été créée » ; la relecture
après « existe déjà » retirée — « ✗ un prénom pris ailleurs depuis
l'ouverture : … → l'écran reste sur « Créer mon compte » : la liste des
pastilles n'est pas visible » ; le 42501 rendu au `catch` — « ✗ liste
refusée par un droit retiré à anon (42501) : … → la page annonce « Connexion
impossible. Vérifie ta configuration. » : le refus est pris pour une panne de
configuration » ; les homonymes pris dans l'ordre de la liste au lieu du clic
— « ✗ deux homonymes sur les pastilles : … → tentatives :
ok:cle-controle@eleves.exercices-interactifs.invalid », que l'ancien
contrôle laissait passer ; et un `rpc('cles_de_connexion')` glissé dans
`connexionEleve()` — « → 1 appel(s) à cles_de_connexion sur le chemin des
pastilles : la fonction n'existe pas dans les états A et C », avec « ✗ avec
la liste ouverte, la page n'interroge pas la fonction de connexion ».
**Ce qu'aucun banc ne voit.** L'état réel du projet : la 009 y a-t-elle été
jouée ? La sortie de la 010, « état trouvé », le dira. Le cache de schéma de
PostgREST dans la minute qui suit la 010 : il peut tenter encore une fonction
disparue — la page de #638 dirait alors « Connexion impossible », la création
de compte « Vérification du prénom impossible » ; il faut attendre, pas
rejouer (les pastilles, elles, ne passent pas par la fonction). Les tablettes
qui garderaient l'ancienne page quelques minutes après la mise en ligne : elle
connecte dans les trois états — par la fonction en B, par son propre repli
PGRST202 en A et en C —, sauf pendant cette fenêtre. Que le vrai PostgREST
rende `[]` sans erreur pour un prénom vide, et `PGRST202` pour une fonction
absente — les deux réponses sur lesquelles repose le sondage : elles ne sont
mesurées que sur le double et sur la base jetable. De même pour l'état B' : que
PostgREST transmette à supabase-js le code `42501` du « permission denied »
de PostgreSQL — c'est son comportement documenté, mais seul le double le
rend ici. Et que l'éditeur SQL de
Supabase laisse prendre `set local role anon`, sous un `postgres` qui traverse
la RLS : la même hypothèse que la 009, et un refus s'y déclare au lieu de
passer au vert.

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
