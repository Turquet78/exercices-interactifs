# AUDIT du site de mathématiques (Seconde, Première, Terminale spécialité)

Audit réalisé les 29 et 30 septembre 2026, en lecture seule, sur les dépôts `Turquet78/exercices-interactifs`
(branche `main` à `db7fa28` : `secondes.html` v240, `premiere-specifique.html` v273, `terminale.html` v352)
et `Turquet78/site-maths` (`524a91d`). **Aucun fichier des deux dépôts n'a été modifié ; seul ce rapport a été
ajouté.** Toutes les lignes citées sont celles de ces versions.

Conventions : **[EXE]** = défaut prouvé par exécution (générateur rejoué, copie passée au vrai juge, mesure dans un
Chromium réel) ; **[LEC]** = établi par lecture du code. Gravité : **critique** = un élève est induit en erreur
(énoncé, correction ou rappel faux) ou une bonne réponse est comptée fausse sur une part notable des tirages ;
**importante** = gêne réelle, règle du projet violée, note ou aide faussée ; **mineure** = imprécision, cas rare,
forme.

---

## 1. Architecture (résumé)

**Deux dépôts, quatre pages, une base.**

- `site-maths` — le portail public `https://turquet78.github.io/site-maths/` : un seul `index.html` (routeur par
  `#/niveau/…`), une liste de fiches PDF (`fiches/<Niveau>/<Matière>/*.pdf`, recensée par `build.mjs` dans
  `fiches.json` à chaque déploiement GitHub Pages), et la lecture des devoirs à la maison et des cours déposés
  depuis Supabase (tables `parametres*`, bucket public `cours`).
- `exercices-interactifs` — trois pages **monolithiques** (HTML + CSS + JS dans un seul fichier, sans compilation)
  publiées sur GitHub Pages depuis `main` : `secondes.html` (40 000 lignes, 2,75 Mo, 124 exercices),
  `premiere-specifique.html` (19 300 lignes, 1,37 Mo, 56 exercices), `terminale.html` (25 600 lignes, 1,74 Mo,
  49 exercices) ; plus `prof.html` (porte du professeur), `sw.js` (service worker sans cache, tablettes), trois
  manifestes et leurs icônes.
- **Un projet Supabase** commun : trois jeux de tables (`eleves*`, `resultats*`, `signalements*`, `parametres*`),
  authentification par compte (`<cle>@<domaine>` + code à 6 chiffres), politiques RLS (`supabase/migrations/`),
  deux fonctions Edge : `corriger-definition` (aide et vérification par IA, modèle `claude-haiku-4-5-20251001`, clé
  côté serveur) et `admin-eleve`.
- **Dépendances externes** : `@supabase/supabase-js@2` (jsDelivr), MathLive 0.110.0 (esm.run, feuille de style
  intégrée), polices Google (Fredoka, Nunito).
- **Dans chaque page**, un exercice = une entrée de `TESTS`, une place dans `THEMES` (d'où sa numérotation), un
  écran `<section class="screen">`, un générateur (tirage par `distinctes()`), un rendu, un juge, un rappel de cours
  (`RAPPELS`), des questions suggérées à l'IA (`QIA_SUGG`), un contexte envoyé au modèle (`conseilCtxCourant`).
  Deux modes : entraînement (note enregistrée) et soutien (correction pas à pas, aide IA).
- **Bancs de test** (`tests/`) : `npm test` (jsdom, ~1 250 contrôles), `npm run test:navigateur` (Chromium réel,
  chaque exercice ouvert dans les deux modes), `test:base` (PostgreSQL jetable), `test:fonction`, `test:version` ;
  action GitHub « Contrôles » sur chaque pull request.

## 2. Méthode et périmètre — ce qui a été vérifié, ce qui reste à faire

| Volet | Fait | Non fait |
|---|---|---|
| Bancs du dépôt | `npm test` exécuté : **vert** sur les trois pages (362 + 573 + 315 contrôles). `npm run test:navigateur` exécuté : Première et Terminale **vertes** (321 et 334 contrôles) ; Seconde rouge au premier passage (copie de MathLive tronquée par le téléchargement concurrent des trois bancs, voir T12) puis **verte** relancée seule (582 contrôles). | `test:base` (PostgreSQL absent du conteneur) et `test:fonction` n'ont pas été rejoués. |
| Mathématiques | Les **229 exercices** ont été répartis entre onze relecteurs (un par groupe de thèmes) : lecture du générateur, du rendu, du juge, de la correction, du rappel et du corrigé type ; **exécution** des générateurs (de 800 à 190 000 tirages par exercice, dans jsdom via `tests/harnais.js`) avec un juge indépendant (BigInt, fractions exactes, **Python 3 réel** pour le thème Algorithmique) ; copies justes, fausses et vides rejouées sur chaque juge dans les deux modes. Trois lots ont dû être relancés (interruption pour dépassement de quota) ; leurs rapports sont complets. | Les verdicts rendus par le **modèle d'IA** (exercices rédigés, définitions des ensembles, 2.1.2/2.1.5/4.4/4.5 de Terminale) ne sont pas exécutables hors ligne : seules les règles envoyées au modèle ont été relues. Le rendu MathLive réel des rédactions (LaTeX → texte) n'a pas été re-mesuré. |
| Technique | Ressources externes et pages publiées vérifiées (HTTP 200) ; poids des pages ; structure HTML ; duplication mesurée ; **banc mobile propre** (Playwright, Chromium, 380 × 800, tactile, `isMobile`) ouvrant les 229 exercices dans les deux modes : débordement, éléments hors écran, cibles tactiles, tailles de police, contrastes calculés, axe-core (WCAG 2.x A/AA), erreurs JavaScript ; portail testé de même. | L'application installée sur tablette (mode `standalone`), le clavier système Android/iOS et les vraies polices Google (coupées par le banc) n'ont pas été observés. |
| Accessibilité | Contrastes (calcul + axe-core), noms accessibles des cases, cibles tactiles, navigation clavier (analyse des éléments cliquables), lisibilité (polices, interlignage, textes < 12 px), régions vivantes. | Pas de test avec un vrai lecteur d'écran (NVDA/VoiceOver) ni avec des élèves. |

Le site est trop gros pour prétendre à une relecture humaine de chaque ligne : les constats ci-dessous sont ceux
qui ont été **prouvés** (exécution ou lecture, avec la ligne exacte). Chaque rapport de relecteur liste en outre
ses « doutes non tranchés » ; les plus utiles sont repris en section 7.

---

## 3. Tableau récapitulatif

Classé par gravité, puis par thème. M = mathématiques/validation, T = technique, A = accessibilité.

| N° | Fichier | Ligne(s) | Catégorie | Gravité | Description courte |
|---|---|---|---|---|---|
| M1 | secondes.html | 2934 (3776, 5845) | rappel de cours faux | **critique** | Le « Schéma des ensembles » affiche √2 = 1,14, √3 = 1,69, π = 3,414, 8/7 = 1,428… |
| M2 | secondes.html | 11493-11505, 11616, 11813, 11596 | correction fausse | **critique** | 3.2.3 Équations graphiques : S de f(x) ⋚ k faux quand la courbe touche k sans la traverser (86 % des séances) ; repli figé faux aussi |
| M3 | secondes.html | 13428-13436, 13678-13700 | correction fausse | **critique** | 3.1.5 Lecture de deux courbes : même défaut de tangence (17 %) |
| M4 | secondes.html | 14960-14969, 14997 | correction fausse | **critique** | 3.5.2 Synthèse, partie b : même défaut (0,8 %) |
| M5 | secondes.html / premiere-specifique.html | 23783, 23830 / 11521, 11568 | bonne réponse refusée | **critique** | Hausse suivie d'une hausse : la case « coefficient retrouvé » refuse 1,56 sur 17 paires sur 25 |
| M6 | premiere-specifique.html | 7277, 7343, 7383, 7388 | bonne réponse refusée + correction fausse | **critique** | 2.3.10 : 8 − 7,2 calculé en flottant ; « 0,8 » refusé, correction « 0,7999999999999998 € » |
| M7 | premiere-specifique.html | 6904, 7343, 3110 | bonne réponse refusée | **critique** | 2.2.11 / 2.3.10 : « 2,30 € » refusé (flottant × 100) alors que « toute écriture égale est acceptée » |
| M8 | secondes.html | 35733, 35585-35595, 4517 | bonne réponse refusée | **critique** | 5.11 Réviser les quatre règles : la fraction simplifiée est comptée fausse sur ses deux cases |
| M9 | secondes.html | 26739-26770, 7446-7452, 6935 | énoncé/rappel faux | **critique** | 6.1.4 : « prénom » enseigné et noté comme identifiant Python invalide — faux (PEP 3131) ; 6.1.5 l'accepte |
| M10 | terminale.html | 15556-15575, 15593, 24789-24791, 24635 | saisie impossible | **critique** (tablette) | 1.1 : la racine « e » ne peut pas être tapée (pavé sans lettre, clavier système bloqué) — 39 % des séances |
| M11 | secondes.html | 22541-22627, 22692-22720 | bonne réponse refusée | **critique** | Rédactions 4.2.10 / 4.3.9 / 4.5.2 : « (300 − 240)/300 = 0,2 » et « 240/0,8 = 300 » refusés, le juge prime sur le modèle |
| M12 | secondes.html | 21314-21315, 21338, 21348, 6809-6814 | correction fausse + refus | **critique** | 4.5.4 Synthèse sur les évolutions : « −20 » refusé pour une baisse, correction « soit une évolution de 20 % » |
| M13 | les trois pages | voir détail | règle universelle violée | importante | Une case VIDE rougit en mode soutien (et en évaluation en Première) dans ~35 exercices ; le banc ne le mesure qu'en entraînement |
| M14 | secondes.html / premiere / terminale | voir détail | case juste rougit | importante | Une case JUSTE rougit parce que sa jumelle (dénominateur, second terme, autre borne) est fausse ou vide |
| M15 | secondes.html / premiere-specifique.html | voir détail | réponse fausse acceptée | importante | `parseInt` sert de juge dans ~16 exercices : « 45,5 », « 12abc » comptés justes |
| M16 | premiere / terminale | 9761-9808 / 9451-9490, 10183-10215, 7422, 7819 | verdict confié au modèle | importante | 2.1.7 (1re), 2.1.2, 2.1.5, 4.4, 4.5 (Tle) : la note vient du seul modèle d'IA, sans juge local |
| M17 | premiere-specifique.html | 18540-18556, 17425-17431 | aide qui révèle la réponse | importante | Le corrigé type des synthèses est bâti sur la question en cours et envoyé comme « autres valeurs » |
| M18 | premiere-specifique.html | 9239-9251 | propositions absurdes | importante | Leurres impossibles par le sens (valeur initiale ≥ finale pour une hausse) dans 32 à 85 % des QCM |
| M19 | secondes.html | 36268, 36467-36468, 35954-35975 | bonne méthode refusée | importante | 5.13-5.15 : dénominateurs 2 et 4 non premiers entre eux, la route du PPCM rougit dix cases |
| M20 | secondes.html / premiere-specifique.html | 18991, 18868 / 5946, 3049, 5813 | réponse fausse acceptée | importante | « Fraction décimale » demandée, 9/4 accepté pour 2,25 |
| M21 | secondes.html | 14257, 14427, 14561, 14762 | notation programme | importante | Tableaux de signes bornés par −∞/+∞ alors que f est définie sur [−3 ; 3] ; le tableau de variation voisin dit −3/3 |
| M22 | secondes.html | 6243-6306 | aide aveugle | importante | 16 exercices (thèmes 1 et 3) n'envoient au modèle ni la courbe ni la réponse attendue |
| M23 | secondes.html | 35538-35580 | tirage | importante | 5.11 : « fractions » 2/2, 4/2, ÷ 3/3, × 1 dans plus de la moitié des questions |
| M24 | secondes.html | 13657-13658 | énoncé faux une fois sur deux | importante | 3.1.5 : « les bouts de S sont les bouts du domaine » affiché même quand S = [x1 ; x2] |
| M25 | secondes.html | 27598-27604, 27617 | diagnostic faux | importante | Python 6.1.7/6.1.8 : « le texte doit être entre guillemets » quand le texte commence par le nom de la variable |
| M26 | secondes.html | 27676, 27224-27230 | réponse fausse acceptée | importante | Python : `print("…", -note)` (opposé de la valeur) accepté |
| M27 | terminale.html | 14150, 14233-14241, 14299-14330 | bonne réponse refusée | importante | 5.1 : « y = x » vaut 0 parce qu'une case « 0 » est exigée (b = 0 : 7,7 %, f(a) = 0 : 20 %) |
| M28 | terminale.html | 15776-15779, 16671-16673, 12324-12327 | bonne réponse refusée | importante | 1.1, 1.4, 1.5, 5.4 : « 6/2 » refusé pour −6/−2, « 0/1 » refusé pour 0/−1 |
| M29 | terminale.html | 15903-15907, 16811 | doublon de séance | importante | 1.2 et 1.5 sans `distinctes()` : même trinôme deux fois (4,4 %) |
| M30 | secondes.html / premiere-specifique.html | 6862, 6868 / 17811, 17817 | rappel de cours trompeur | importante | « On multiplie par ce coefficient (1,2), puis on divise par 100 » |
| M31 | terminale.html | 6571, 4100 | énoncé faux | importante | 4.1 TVI : « sur ℝ » en dur alors que l'intervalle est [−3 ; 7] (89 % des questions) |
| M32 | terminale.html | 6788, 6779, 6754 | correction fausse | importante | 4.3 : « f n'est pas continue sur son ensemble de définition » — faux, f n'est pas définie en c |
| M33 | terminale.html | 16107, 9032, 16063-16076 | rappel incomplet/faux | importante | 4.4 : « compris entre les valeurs (ou limites) » donne la mauvaise réponse sur la limite non atteinte ; 4.2 : corrigé sans « k entre f(a) et f(b) » |
| M34 | terminale.html | 24047 | corrigé type faux | importante | 6.1.1 : « raison −3, car on ajoute toujours 3 » |
| M35 | terminale.html | 13352-13357 | rédaction fausse acceptée | importante | 6.2.4 : le juge accepte si f(m) et f(M) apparaissent quelque part ; 4 231 copies fausses sur 6 000 acceptées |
| M36 | terminale.html | 6539 | reprise après pause | importante | 4.1 : après une pause, les menus proposent « null » (les infinis ne survivent pas au JSON) |
| M37 | secondes.html | 7028-7058, 6584-6586 | orthographe | mineure | Rappels du thème 2 sans accents (« emboites », « Piege ») |
| M38 | secondes.html | 7033, 7050 | notation programme | mineure | ℚ défini sans « dénominateur non nul » |
| M39 | secondes.html | 3768 / 38145 | affichage | mineure | « Exercices parfaits 4 » pour un compte de cases |
| M40 | secondes.html | 25668, 25603, 25610 | grammaire | mineure | « 2 millier », « 3 dizaine » |
| M41 | secondes.html | 38080-38088, 36962-36971, 33370, 34791 | doublons | mineure | Même valeur deux fois (18/3 et 30/5) ; (a,b) puis (b,a) ; deux tirages sans `distinctes()` |
| M42 | secondes.html | 35351-35353 | énoncé | mineure | reduire-produit propose « 0 » comme coefficient de x × x |
| M43 | secondes.html | 5615-5616, 37444-37460 | message | mineure | reduire-somme : « Corrige les cases en rouge » sans case rouge |
| M44 | secondes.html | 25430, 25473, 25515 | couverture du tirage | mineure | 0, √4, √9, −√9 jamais tirés : toute racine affichée est irrationnelle |
| M45 | secondes.html | 6803, 20059-20063 | rappel/énoncé | mineure | RAP_PCTC décrit des cases disparues ; boîte « Filles » vs phrases « femmes » |
| M46 | secondes.html / premiere-specifique.html | 22924, 23367, 23528 / 10662, 11266, 11105 | refus marginal | mineure | Valeur de départ jugée par égalité de chaînes (« 300,0 » refusé) |
| M47 | secondes.html | 19890, 19910 | doublon | mineure | pourcentage-chaine : même couple deux fois (3 %) |
| M48 | secondes.html | 19724, 23217, 23229, 23165, 22797, 23142-23165 | contextes | mineure | Lycée de 9 000 élèves, « 61,2 licenciés », prix 9,5 € hors `nOk`, vitesse « s'accroît » |
| M49 | secondes.html | 5116-5131, 22983 | note | mineure | La note partielle compte les cases de la pose facultative |
| M50 | secondes.html | 18992 / 17864-17867 | note ≠ couleurs | mineure | fractions-decimales n3 : « −15/−10 » noté juste mais peint rouge |
| M51 | secondes.html / premiere-specifique.html | 17928-17930 / 4845-4847 | tirage trivial | mineure | Calcul mental : « 0 − 0 », « × 1 » |
| M52 | secondes.html | 36075, 36037, 36390, 36596, 7304-7309, 7633-7637 | correction non simplifiée | mineure | « 156 sur 66 » donné en vert comme réponse modèle ; rappels arrêtés à 3/90, 10/12 |
| M53 | secondes.html | 35889-35896 | refus marginal | mineure | `pfFracJuge` refuse « 104/44 » pour 26/11 |
| M54 | secondes.html | 18869, 18787-18792, 18975-18981 | énoncé | mineure | « fractions décimales » avec un facteur entier ; niveau 1 accepte « 1/2 » pour « forme décimale » |
| M55 | secondes.html | 33655 | code ≠ journal | mineure | Garde-fou de `divGen` que le journal dit retiré |
| M56 | secondes.html | 11792-11796, 12024, 11769 | énoncé | mineure | Domaine de g jamais énoncé alors que « le bout du dessin est toujours pris » |
| M57 | secondes.html | 7152, 7316, 7380, 12474 | rappel | mineure | « les bouts sont toujours pris » (faux pour une cloche) ; « touche la hauteur k à chaque bord » non exigé |
| M58 | secondes.html | 9880 | lecture laxiste | mineure | `lvReadInt` : « 2abc » → 2, « 1/2 » → 1, U+2212 → vide |
| M59 | secondes.html | 10787, 15864, 12351 | grammaire | mineure | « Les antécédents de 3 est 4 », « défini », « pour solution S = {a ; b} » |
| M60 | secondes.html | 9452, 11469, 11478-11487 | commentaires/paliers | mineure | Commentaires périmés ; palier de spline (4/4 000) |
| M61 | secondes.html | 32150-32154 | tirage | mineure | Python 6.2.6 : k = l (4,7 %), le piège de la réaffectation disparaît |
| M62 | secondes.html | 29438, 29353, 29363 | message/consigne | mineure | Le message propose le « − » typographique qu'il refuse ; « par » dans la consigne, « et » exigé |
| M63 | secondes.html | 26558, 27647, 25948, 26500, 27330, 27030-27044, 26012-26047 | Python ≠ page | mineure | « Python ne sait pas lire ; » (faux) ; indentation acceptée ; π refusé ; virgule finale refusée |
| M64 | secondes.html | 7440, 26574, 7500-7505, 5456, 28419 | rappels/messages | mineure | « la ligne nombre ne fait rien » (faux en carnet) ; RAP_PTV figé ; accolades « { c = a+b } » au menu ; « recopiée à la main » pour `note+0` |
| M65 | secondes.html | 6553-6640, 6662-6678, 22632, 22254 | branchement | mineure | diminuer-soustraction propose les questions IA de l'AUGMENTATION ; contexte IA dit « Première » |
| M66 | premiere-specifique.html | 6536-6537, 18235-18236, 6943, 7382 | notation | mineure | Point décimal « 0.6 » dans la correction et le contexte IA du 2.1.9 |
| M67 | premiere-specifique.html | 6191-6199, 6156-6166, 6592, 9269, 8508 | grammaire | mineure | « 1 élèves », « 1 hectares » |
| M68 | premiere-specifique.html | 17731, 17800, 17713, 17709, 17733-17752 | rappels | mineure | RAP_PDT se contredit (15 %, 25 %) ; rappels sur des valeurs jamais tirées (600, 400 €, 32 €, 50 €) |
| M69 | premiere-specifique.html | 5654 | refus marginal | mineure | « 12. » et « 15 % » refusés |
| M70 | premiere-specifique.html | 8827, 6871 | formulation | mineure | « l'augmentation est 5 % de 7000 € est ▢ € » |
| M71 | premiere-specifique.html | 18529-18538 | corrigé type | mineure | Échappements `\\\\(` et `\n` littéraux ; exemple d'un autre type que la question |
| M72 | premiere-specifique.html | 11586, 13621 | notation | mineure | « 1,26 − 1 = 26 % » |
| M73 | terminale.html | 14338-14340, 14348 | notation | mineure | « y = 1 x », « y = −1 x + 2 » |
| M74 | terminale.html | 3336, 10492-10495, 14198-14204 | doublon déguisé | mineure | f/g fait deux questions distinctes : même courbe deux fois (2,9 %) |
| M75 | terminale.html | 9610, 9635-9645, 6355 | case vide comptée juste | mineure | 2.1.1 : case vide de la ligne développée bleue quand a = 1 |
| M76 | terminale.html | 14424-14432, 14638, 15288 | refus | mineure | 5.2, 5.5, 2.2.2 : le coefficient 1 de e doit être tapé |
| M77 | terminale.html | 3208, 3354, 3347, 6246-6255, 6229-6230 | exercice historique | mineure | `derivees` et `suites` : injoignables mais encore branchés ; « + 0 » dans un énoncé |
| M78 | terminale.html | 9002-9008, 9132, 9024 | juge d'affichage laxiste | mineure | 4.2 : le signe des valeurs est ignoré (« 5 à −4 » reconnu pour « −5 à 4 ») |
| M79 | terminale.html | 8299, 8305, 7791, 7923, 3088-3096 | tolérance | mineure | Tolérance ±0,1 sur des limites et des solutions exactes (« 2,1 » accepté pour 2) |
| M80 | terminale.html | 8296, 8317, 6956 | notation | mineure | « ∞ » sans signe accepté en 3.2-3.4 et 4.6, refusé en 3.5 |
| M81 | terminale.html | 6769 | notation | mineure | Attendu envoyé au modèle : « k ∉ [−∞ ; 7] » (crochet fermé sur l'infini) |
| M82 | terminale.html | 6544-6546, 9034 | notation | mineure | « f(x) est continue » |
| M83 | terminale.html | 8525-8529 | notation | mineure | 3.3/3.4 famille ln : borne exclue sans double barre ni domaine |
| M84 | terminale.html | 17085-17089, 13693-13697, 17633-17638, 12917-12923, 18894, 20721, 20302-20305 | suites, divers | mineure | Type vide rougit en entraînement ; raison en fraction refusée ; k accepté ±0,1 ; « 8 + (0,75)^(n+1) » refusé ; majorant plus large refusé ; « 0 » deux fois dans la liste |
| T1 | secondes.html | 3777, 38108 | affichage mobile | importante | 2.1/2.2 : la rangée d'aide (`#ensActions`, inline-flex sans repli) fait 584 px : la page défile de 102 px, « Vérifier » hors écran |
| T2 | secondes.html | 1166-1169, 1190 | affichage mobile | importante | 5.1 Simplifier en coloriant : la barre « en 20 » fait 100 px, segments de 4 px impossibles à toucher |
| T3 | secondes.html | 18553 (écran `#scr-asptest`) | affichage mobile | importante | Addition posée : la colonne des unités et la case de droite sont coupées à 380 px (débord 5 px) |
| T4 | tests/navigateur.js | 84-96 | banc | mineure | Course entre les trois bancs parallèles sur le cache MathLive : un niveau échoue à tort au premier `npm run test:navigateur` |
| T5 | les trois pages | 1-26 | structure HTML | mineure | Pas de `<html lang="fr">`, `<head>`, `<body>` ; `<meta charset>` au-delà des 1 024 premiers octets |
| T6 | site-maths/index.html | 41 | CSS | mineure | `color:varA(--encre-douce)` — faute de frappe, déclaration ignorée |
| T7 | site-maths/index.html | DM_CFG (≈ l. 200-290) | données périmées | mineure | Table de repli des numéros d'exercices fausse pour la Seconde (8 écarts) et la Terminale (12 écarts) |
| T8 | les trois pages | — | poids | mineure | 2,75 / 1,37 / 1,74 Mo (763 / 382 / 514 Ko gzip) + MathLive 840 Ko + supabase-js 218 Ko, sans cache |
| T9 | les trois pages | — | duplication | mineure | 133 fonctions strictement identiques dans les trois fichiers (95 Ko), 308 dans deux (320 Ko), 575 règles CSS communes |
| T10 | les trois pages | 2787 / 1396 / 1775 | confidentialité | mineure | Le code à 6 chiffres se tape en clair (`#loginPin` sans masquage) |
| T11 | supabase/migrations/001…sql ; les trois pages | 159 ; 8443 / 4683 / 5091 | RGPD (choix documenté) | importante | Prénoms de la classe et clé `cle` de chaque élève lisibles par tout visiteur anonyme |
| T12 | terminale.html | `#testCtrls` | affichage mobile | mineure | Pas de libellés courts : les trois commandes flottantes prennent 24 % de l'écran sur trois lignes |
| A1 | les trois pages | `:root` l. 41 / 48 / 48 | contraste | importante | Vert `#1FA971` sur blanc = 3,01 ; rouge `#E23D52` = 4,18 (AA : 4,5) — scores, verdicts, mots en gras |
| A2 | les trois pages | — | nom accessible | importante | 370 cases sans étiquette et 352 menus sans nom (Tle), 772 `math-field` sans nom (2de) : un lecteur d'écran n'annonce pas quelle case |
| A3 | les trois pages | — | cibles tactiles | importante | Points de courbe 16×16, segments 80×12 ou 4×46, menus ↗↘ 48×23, cases 30×23 (< 24 px, WCAG 2.5.8) |
| A4 | secondes.html, terminale.html | — | clavier | importante | Points de courbe (`<g>` SVG) et segments à colorier sans `tabindex` : exercices infaisables au clavier |
| A5 | les trois pages | — | lisibilité | mineure | Graduations SVG à 10 px, exposants MathLive 11,6 px, `small` 10 px |
| A6 | les trois pages | — | lecteurs d'écran | mineure | Aucune région `aria-live` : verdict, score, « Bravo » non annoncés ; pas de `lang` |
| A7 | secondes.html, terminale.html | — | clavier | mineure | Tableaux dans des enveloppes défilantes non focusables (axe `scrollable-region-focusable`) |
| A8 | site-maths/index.html | 30, 41 | contraste | mineure | Orange Première `#b06a12` sur la carte = 4,20 ; « Mathématiques » à 11,5 px |

---

## 4. Détail — mathématiques et validation

### 4.1 Critiques

**M1 — Le « Schéma des ensembles » affiche quatre valeurs fausses.** [EXE]
`secondes.html:2934` (image PNG encodée en base64 dans `#bilanModal`), ouverte par le bouton « Schéma des
ensembles » (l. 3776, exercice 2.1 dans les deux modes) et par le rappel du 2.4 en soutien (l. 5845, via
`ouvrirBilanEns` l. 5760). La dernière ligne de l'image écrit « √2 = 1,14…… », « √3 = 1,69…… », « π = 3,414…… »
et la ligne ℚ « 8/7 = 1,42857 142857… ». Or √2 ≈ 1,414…, √3 ≈ 1,732… (1,69 est 1,3²), π ≈ 3,14159…,
8/7 = 1,142857… (1,428571… est 10/7). Le signe « = » est de plus employé pour des irrationnels. Image extraite,
décodée et agrandie ; lecture sans ambiguïté. Le reste du schéma (emboîtement, 0,1 ; −12,748 ; 3/2 = 1,5 ;
358/100 ; 1/3 = 0,333…) est juste.
*Correction* : refaire l'image (ou la remplacer par un schéma HTML/SVG que le banc pourra relire) avec
8/7 ≈ 1,142857…, √2 ≈ 1,414…, √3 ≈ 1,732…, π ≈ 3,14159… et « ≈ » pour les irrationnels.

**M2 — Équations graphiques (3.2.3) : l'ensemble des solutions de f(x) ⋚ k est faux dès que la courbe TOUCHE la
hauteur k sans la traverser (86 % des séances).** [EXE]
`secondes.html:11493-11505` (filtre `kc` de `eqgGen`), `11616-11633` (`eqgMilieuK`), `11813-11820`
(`eqgItvSpec`), `11706-11760` (cartes), `11981-12000`. Le tirage exige que k soit atteint exactement deux fois,
jamais traversé entre deux graduations et pas en deux points voisins, mais **pas que chaque solution soit un vrai
croisement** (vérifié dans le code : `pts.filter(v=>v===y).length!==2` et `ix[1]-ix[0]<2` seulement). Quand f
touche y = k en un sommet ou un creux, la page lit « le côté entre les deux solutions » et conclut « le milieu » ou
« l'extérieur ». Exemple rejoué dans le DOM : points [3, 1, 2, 3, 1, −1, −3], k = 1, « f(x) ≥ 1 » : f(−2) = 1 est
un creux (f(−3) = 3, f(−1) = 2), donc f ≥ 1 sur [−3 ; 1]. La page attend [−2 ; 1], note 4/5 la copie juste et
écrit « C'est le morceau entre les deux croisements, de −2 à 1 … Donc S = [−2 ; 1] ». Sur 2 000 séances, 1 728
portent une telle tangence. Le repli figé `EQG_REPLI` (l. 11596 : points [−3, −2, 0, 3, 2, −2, 3], k = −2, « < »)
a le même défaut : f(2) = −2 est un creux, f(x) < −2 n'est vrai que sur [−3 ; −2[, la page attend
[−3 ; −2[ ∪ ]2 ; 3] ; ce repli sort dans 2,15 % des séances (le commentaire l. 11469 « un essai sur 220 » est
périmé).
*Correction* : exiger un vrai croisement, `ix.every(x => (pts[x+2]-y)*(pts[x+4]-y) < 0)` comme le fait déjà
`eigGen` (l. 13836). Attention : ce seul filtre viderait le tirage (93 tirages admissibles sur 800) ; il faut
restructurer `eqgGen` en construisant f autour de k (comme `ingGen`), ou retirer la question `infk` de
`EQG_TYPES` (l. 11588) en attendant. Relever aussi un repli sain.

**M3 — Lecture de deux courbes (3.1.5), question « f(x) ⋚ k2 » : même défaut de tangence (17 % des séances).** [EXE]
`secondes.html:13428-13436` (`k2s`), `13332-13337`, `13470-13474`, `13678-13700` (`ifgWhy`). Exemple : ptsF =
[2, 1, −1, 1, 0, 3, 3], domaine [−3 ; 1], k2 = 1, « ≤ » : f(0) = 1 est un sommet, f ≤ 1 sur [−2 ; 1] ; la page
attend [−2 ; 0]. 256 séances sur 1 500.
*Correction* : dans `k2s` (l. 13433) ajouter `&& sF.every(x => (ptsF[x+2]-y)*(ptsF[x+4]-y) < 0)` ; 1 251 tirages
sur 1 500 offrent déjà un k2 à vrais croisements, le repli `IFG_FB` (l. 13454) est sain.

**M4 — Synthèse (3.5.2), partie b « f(x) ⋚ c » : même défaut (0,8 % des séances).** [EXE]
`secondes.html:14960-14969` (`cote`), `14974`, `14997`, `15158-15170`, `15205-15210`. Exemple : c = 4, « < »,
f(4) = 4 est un sommet ; f < 4 sur ]−5 ; 4[ ∪ ]4 ; 5], la page attend ]−5 ; 4[.
*Correction* : refuser c si `xs.some(x => (synY(q,x-1)-c)*(synY(q,x+1)-c) >= 0)`.

**M5 — « Hausse suivie d'une hausse » (Seconde 4.2.7, Première 2.2.7) : la case « coefficient retrouvé » refuse le
bon coefficient sur 17 des 25 paires (69 % des tirages).** [EXE, relu dans le code]
`secondes.html:23783` (correction en direct) et `23830` (vérification) ; `premiere-specifique.html:11521` et
`11568`. La case `hsVc` (préfixe « 1, ») est jugée par `decOk(id,'1,',q.prodNum,1000)`, comme si `prodNum` était
toujours en millièmes. Or `hsCoef` (l. 23643) réduit les coefficients : pour deux taux multiples de dix, 20 % et
30 % donnent 12/10 × 13/10, `prodNum = 156`, `prodDen = 100`, et la case attend 1,xx = 156/1000 = 0,156 — aucune
écriture commençant par « 1, » ne peut convenir. Copie entièrement juste rejouée : toutes les cases bleues sauf
`hsVc` rouge sur « 56 » ; 10 % + 10 % (1,21) idem ; seules les paires mixtes (5 % + 20 %, 50 % + 2 %) passent.
La case `hsDec` juste au-dessus, jugée avec `prodDen`, est bleue sur la même valeur. L'étape ④ est facultative et
hors note, mais la case juste rougit sous les yeux de l'élève.
*Correction* : `[['hsVp','0,',q.hausseNum,1000],['hsVc','1,',q.prodNum,q.prodDen]]` et
`decOk(p[0],p[1],p[2],p[3])` aux quatre endroits.

**M6 — Première 2.3.10 « Diminuer en passant par 10 % » : la bonne réponse est refusée et la correction affiche
0,7999999999999998 € (une séance sur huit).** [EXE]
`premiere-specifique.html:7277` (`total=N-baisse` en flottant), `7343` (juge `fr.n===val*fr.d`), `7383` et
`7388` (message et correction), `3110` (`liveColorDec`). Famille « nombre pair de 1 à 8 » (tirée une fois par
séance) avec P ∈ {70, 80, 90} : 8 − 7,2 = 0,7999999999999998, 4 − 2,8 = 1,2000000000000002 (12 couples sur 40).
Copie juste « 0,8 » : case rouge, score 0, feedback « prix diminué = 8 − 7.2 = 0.7999999999999998 € » ; en
soutien la case ne se déverrouille jamais. Le même flottant part au modèle d'IA.
*Correction* : calculer en centièmes entiers (`totalC = N*100 − N*P`) et juger par `fr.n*100 === totalC*fr.d` ;
idem pour `liveColorDec`.

**M7 — Première 2.2.11 et 2.3.10 (« en passant par 10 % ») : une réponse juste écrite avec deux décimales
(« 2,30 € ») est refusée alors que l'écran promet « toute écriture égale est acceptée ».** [EXE]
`premiere-specifique.html:6904`, `7343` (`egal`), `3110`. `val*fr.d` sur un flottant : 2,3 × 100 n'est pas
exact. Cas exhaustifs : 2,30 ; 4,60 ; 9,20 ; 10,20 (augmenter-dix), 5,10 et 1,80 (diminuer-dix). Un quart des
séances d'augmenter-dix expose le cas. *Correction* : même remède que M6.

**M8 — Seconde 5.11 « Réviser les quatre règles » : une fraction égale simplifiée est comptée fausse sur ses deux
cases (33 à 78 % des réponses attendues sont réductibles).** [EXE]
`secondes.html:35733` (`rvfJuste` : `el.value===c.bon`), `35585-35595` (`rvfReponse`), `4517` (consigne « Une
seule fraction à chaque fois, jamais réduite plus qu'il ne faut »). 1/4 + 1/4 → « 1/2 » vaut 1 point sur 3, « 2/4 »
3/3 ; 4/2 ÷ 3/4 → « 8/3 » 3/5, « 16/6 » 5/5 ; 1/2 + 1/4 par le PPCM 4 → 1/7 (six cases rouges), par le
croisement → 7/7. La consigne ne dit pas « n'écris pas la fraction simplifiée », et simplifier est le geste enseigné
trois exercices plus haut.
*Correction* : accepter toute fraction ÉGALE (la règle des promesses de `sfJuge`/`pfFracJuge` existe) ; sinon
écrire la consigne explicitement. Voir aussi M23 (tirage de cet exercice).

**M9 — Seconde 6.1.4 « Noms de variables en Python » : la page enseigne, note et fait dire au modèle que `prénom`
est un identifiant INVALIDE en Python — c'est faux, et l'exercice voisin 6.1.5 l'accepte.** [EXE avec python3]
`secondes.html:26739-26741`, `26754-26760` (`pvnDefauts`), `26770`, `7446-7452` (`RAP_PVN` règle 4 : « pas de
lettre accentuée : prénom est interdit »), `6935` (contexte IA), `6612`. Python 3 accepte les lettres accentuées
(PEP 3131) : onze noms de la banque des « incorrects » (`prénom`, `élève`, `âge`, `année`, `numéro`, `côté`,
`résultat`, `prix_à_payer`, `entrée`, `vérité`, `Élève`) sont valides (`str.isidentifier()` vrai,
`prénom = 3 ; print(prénom)` s'exécute). Le lexeur de la page (`pyLex` l. 25951) les accepte lui-même, et 6.1.5
(`pnvForme`) compte `prénom` correct. Éviter les accents est une convention de cours légitime ; l'énoncer comme
un fait de Python et la noter comme une erreur ne l'est pas.
*Correction* : reformuler la règle 4 et le message en convention (« dans ce cours, on n'utilise pas d'accent ;
Python 3 les accepte ») et remplacer « incorrect » par « à éviter », ou retirer ces onze noms ; mettre 6.1.5 en
cohérence ; corriger le contexte IA.

**M10 — Terminale 1.1 « Signe du 1er degré » : la racine « e » (f(x) = x − e) ne peut pas être tapée sur tablette
(≈ 39 % des séances).** [LEC + EXE partielle]
`terminale.html:15556-15575` (`genS1L1` : cas `'e'` → `rootAccept:['e']`), `15593` (`inputmode="numeric"`),
`24789-24791` (`paveBrancher` : sur écran tactile, `inputmode` devient `none`, le clavier du système est bloqué),
`24635` (`PAVE_TOUCHES` : chiffres, virgule, −, /, ⌫, ⏎ — aucune lettre), `2443-2446` (jetons du 1.1 : π, ⌨️, ☰,
pas de « e »). `s1RootOK('2,718', …)` → faux, `s1RootOK('e', …)` → vrai. P(e) = 2/9 par question de niveau 1,
deux questions de niveau 1 par séance. *Correction* : un jeton « e » à côté de π (`s1E()` sur le modèle de
`s1Pi()` l. 15648-15652), ou `data-pave-plus="e"` sur `s1-val`/`s1-root`.

**M11 — Rédactions de Seconde (4.2.10, 4.3.9, 4.5.2) : le juge local refuse les formules du programme, et son
refus prime sur le modèle.** [EXE]
`secondes.html:22541-22627` (`salJuge`), voie du quotient `22585-22600`, `22608` ; `22692-22720` (`checkSal` :
`if(juge.sait){ correct=juge.correct; … }`). Pour « retrouve le pourcentage » (300 → 240, proposition 20 % juste) :
« (300 − 240)/300 = 0,2 » REFUSÉ, « (240 − 300)/300 = −0,2 » REFUSÉ, « 300 − 240 = 60 ⏎ 60/300 = 0,2 » REFUSÉ,
avec le reproche « Recopier la proposition n'est pas justifier » ; pour la valeur initiale (240 après −20 %) :
« 240/0,8 = 300 » REFUSÉ. En regard « 240/300 = 0,8 » et « 1,6 × 500 = 800 » sont acceptés. Même chose à la
hausse (P = 60, N = 500 : « (800 − 500)/500 = 0,6 » refusé). Le juge ne connaît que trois voies (coefficient × N ;
VF/VI = coefficient ; part puis addition/soustraction) ; la définition du taux d'évolution du programme
t = (VA − VD)/VD n'en fait pas partie.
*Correction* : deux voies de plus dans `salJuge` — un morceau (VF − VI)/VI ou VF/VI − 1 égal à ±P/100, et un
morceau VF ÷ coefficient égal à VI — nommées dans `salVoiesTexte` (l. 22440) et dans l'attendu envoyé au modèle
(l. 22637-22668). À défaut, faire s'abstenir le juge (`sait:false`) quand la copie contient VF, VI et une
division. Vérifier le juge jumeau de la Première (`salJuge` l. 10447-10456), non éprouvé sur ce cas.

**M12 — Seconde 4.5.4 « Synthèse sur les évolutions » : la case « Pourcentage d'évolution » d'une BAISSE refuse
« −20 », et la correction écrit « soit une évolution de 20 % ».** [EXE, relu dans le code]
`secondes.html:21314-21315` (étiquette de `evbT`), `21338` (`parseInt(v('evbT'),10)===q.P`, P positif), `21348`
(texte « soit une évolution de ${q.P} % »), `6809-6814` (`RAP_EVB` : « le pourcentage s'en déduit en lui retirant
1 », donc 0,8 − 1 = −0,2). Pour 300 → 240 : « −20 » et « -20 » sont rouges, seul « 20 » passe ; la correction
affichée désigne une hausse. Le rappel de la page contredit son juge.
*Correction* : renommer la case « Pourcentage de baisse / de hausse » (mot tiré du sens, comme `evsMot`), ou
accepter la valeur signée selon `q.sens` ; corriger le texte (« soit une baisse de 20 % »).

### 4.2 Importantes

**M13 — Une case laissée VIDE rougit à la vérification en mode SOUTIEN (et en évaluation en Première) dans
environ 35 exercices des trois niveaux ; le contrôle universel ne mesure la règle qu'en entraînement.** [EXE]
Règle absolue du CLAUDE.md (« une case vide ne rougit jamais »), tenue en entraînement seulement parce que
`corTrain*` repeint le rouge en `sol` — c'est ce que mesure `tests/navigateur.js:11702` (`if(mode === 'train' …)`),
sur une copie entièrement vide. En soutien le rouge reste, avec le message « Corrige les cases en rouge » devant
des cases jamais remplies.
- Seconde, opérations posées : `18553` (addition-soustraction), `18652` (multiplication-posee), `19170`
  (mult-decimaux), `19303` (mult-dec-un) — `ok=(v!==''&&v===exp); el.classList.add(ok?'ok':'bad')`.
- Seconde, pourcentages : `20369` (fraction-pourcentage), `20520` (pourcentage-colonnes), `20781`
  (augmenter-addition), `21025` (augmenter-depart-addition, -taux-addition), `21738` (synthese-augmentations),
  `22955` (augmenter-pourcentage), `23395` (augmenter-depart, -taux), `23559` (diminuer-pourcentage et QCM),
  `24550` (lire-coefficient), `24689` (tableau-coefficients).
- Première : `7752-7753`, `7904`, `8992`, `9019`, `9033`, `9072`, `14143-14144`, `10693`, `11297`, `11133`,
  `8165`, `8409`, `8986` — 12 cases rouges sur un écran vide, en soutien comme en évaluation.
- Terminale : `15774-15800` (`checkS1`, 1.1), `15952-15975` (`checkS2`, 1.2), `14299-14330` (`checkTG`, 5.1),
  `6593-6595` (4.1 TVI : 11 cases sur 11), `17094` (`checkSU`, 6.1.1), `18460` (`checkSA`, 6.1.2), `17955`
  (`checkENC`, 6.2.1), `18222` (`checkREC`, 6.2.3 : jusqu'à 31 cases rouges) — non déclarés dans
  `casesVides.sans` (`tests/profils.js:1737`).
*Correction* : n'ajouter `bad` que si la case est écrite (motif `marqueSaufVide`, ou la garde de `checkTX`
l. 14484-14487 en Terminale) ; faire jouer le contrôle du banc en soutien et sur une copie à UNE case remplie.

**M14 — Une case JUSTE rougit parce que sa jumelle (dénominateur, second terme, autre borne) est vide ou
fausse.** [EXE]
Bord que le CLAUDE.md déclare « pas encore vérifié partout » ; voici les instances. Seconde : `22126-22129`
(pourcentage-depart/-taux), `20781-20783` (augmenter-addition, y compris les deux termes de l'addition),
`21025-21027`, `21777-21793` (synthese-augmentations, trois méthodes), `22955-22958`, `23395-23398`, `23560`
(diminuer-pourcentage : `mark('d1n',ok1); mark('d1d',ok1)`) — alors que `pourcentage` (l. 19640),
`hausses-successives`, `hausses-successives-cent` et `baisses-successives` (`marqueFracSaufVide` l. 25127,
`hscPaire` l. 24033) la tiennent. Première : `7748-7753`, `9019`, `9033/9072`, `14144`. Terminale :
`6584-6590` (4.1 : une borne d'encadrement juste rougit si l'autre est fausse, et n'est pas comptée : 10/12 au
lieu de 11/12). Exemple : numérateur juste P, dénominateur faux 10 → les deux cases rouges.
*Correction* : `marqueFracSaufVide` pour toutes les fractions, `hscPaire` pour les deux termes d'une addition, un
verdict par borne pour les encadrements.

**M15 — `parseInt` sert de juge dans une quinzaine d'exercices : une écriture décimale fausse dont la partie
entière est bonne est comptée juste.** [EXE]
Seconde : `19775`, `19780-19782` (pourcentage-boite : « 45,5 » → juste, « 225,5 » → juste), `19963`, `19974`
(pourcentage-chaine : « 12,5 »), `18075` (`submitAnswer`, calcul mental : « 12,7 », « 12abc »), `18335`
(`tmValider`, tables : « 42.5 »), `38561` (`fracEqual` reçoit des `parseInt`) via `23516-23525` (dim : d1n
« 20,5 », d4n « 24000,7 » → score 1), `23357-23364`, `23392` (augq), `20743-20744` (ag2), `20989-20992`
(ag2q), `21762-21805` (psyn), `24354-24362` (bs : « 70,7 », « 3,5 »), `24547` (lc : « 4,8 »), `24837` (ck),
`21334-21338` (evb : « 300,5 », « 240,9 », « 20,5 » → score 1). Première : `4993`, `5282`.
`pourcentage-schema` a `pcsEntier` (l. 20189) écrit exactement pour cela, et le journal le dit (l. 2766 :
« parseInt('6,5') rend 6 »).
*Correction* : `/^\d+$/` (ou `pcsEntier`) avant `parseInt`, ou `parseDecToFrac` contre `cible/1` (le `fracDec`
de la l. 24321 existe déjà).

**M16 — Cinq exercices confient tout le verdict au modèle d'IA, sans juge local, contre la règle du projet.**
[LEC ; EXE avec un modèle simulé pour la Terminale]
`premiere-specifique.html:9761-9808` (`checkPsl`, 2.1.7 : note = `res.correct===true` l. 9784) ;
`terminale.html:9451-9490` (`checkDexp2`, 2.1.2), `10183-10215` (`checkDexpQ2`, 2.1.5), `7422` (4.4 TVI —
nombre de solutions) et `7819` (4.5 TVI — solutions sur le graphique), alors que la page connaît la réponse
exacte de 4.4 et 4.5. Le journal 08 rapporte qu'un modèle a compté fausse une copie juste ; 2.5.2/2.5.6/2.5.7
(Première), 3.1 à 3.4 et 4.6 (Terminale) ont leur juge qui prime. Avec un modèle simulé sur 4.4/4.5 : une copie
fausse obtient 1/1 avec ses cases en rouge, une copie parfaite 0,75 ; en soutien l'élève reste bloqué (cases
justes verrouillées, « Revérifier » en boucle) ; en panne du service, rien n'est noté. La dernière ligne des
dérivées se juge en une ligne par `checkExprFn` (l. 9264), déjà utilisé par 2.1.1, 2.1.3, 2.1.4 et 5.5.
*Correction* : brancher `salJuge` (famille `pct`) sur 2.1.7 ; pré-juger localement la dernière ligne des 2.1.2 et
2.1.5 et les cases de 4.4/4.5, le modèle ne faisant que rédiger (motif de `libreJuge` du 4.5 de Seconde).

**M17 — Première : le « corrigé type » des synthèses est bâti sur la QUESTION EN COURS et envoyé au modèle comme
« exemple avec d'autres valeurs » : l'aide peut livrer la réponse.** [EXE]
`premiere-specifique.html:18540-18556` (`QIA_MODELES.syn`, `const q=act||genSyn()` l. 18542), `17425-17431`
(`qiaModeleExemple`). Question P = 3, N = 6000, inconnue « le pourcentage » : le modèle reçoit « Augmenter 6000
articles de 3 % … 103/100 × 6000 = 6180 » tout en étant sommé de garder la bonne proposition « STRICTEMENT
SECRÈTE ». La suggestion « Rédige-moi une correction similaire » est offerte dès l'entraînement. Concerne 2.2.9,
2.2.13, 2.3.8, 2.3.12, 2.5.1. *Correction* : passer par `qdmAutre` comme les autres modèles.

**M18 — Première : les propositions fausses des QCM sont impossibles par le sens dans 32 à 85 % des questions.** [EXE]
`premiere-specifique.html:9239-9251` (`leurresProches`), appels `8550`, `8554`, `10957`, `10986`, `8214`, `8272`.
« Un prix augmente de 4 % et atteint 520 € » avec 600 € et 700 € proposés ; N = 600, +2 % : propositions 512,
612, 712, 812. Le QCM se résout sans calcul. Fréquences : augmenter-depart 72 %, diminuer-depart 66 %, synthèses
inconnue « fin » 85 %. *Correction* : filtrer les leurres par le sens (hausse : initiale < finale, nouvelle >
départ).

**M19 — Seconde 5.13/5.14/5.15 : les dénominateurs de la parenthèse ne sont pas premiers entre eux, la route du
PPCM (enseignée) rougit dix cases.** [EXE]
`secondes.html:36268` (`pqdGen`, seul d = f est écarté), `36467-36468` (`qdbGen`), `35954-35975`
(`pfCroixJuge`), `36042-36060`. Avec 2 et 4, le croisement figé attend 8 alors que le PPCM est 4 :
« 1/5 × (1/2 − 1/4) » par le PPCM → score 0, message « la première fraction se multiplie par le dénominateur de
l'AUTRE ». 12 % des H et I, un quart des J. *Correction* : `if(gcd(d,f)!==1) continue;` (mode `premiers` de
`sfGen`).

**M20 — « Fraction décimale » demandée, toute fraction égale acceptée (Seconde 1.6 niveau 2, Première 1.6 niveau
2).** [EXE]
`secondes.html:18991`, `18868` ; `premiere-specifique.html:5946`, `3049`, `5813`. 2,25 → « 9/4 » et « 45/20 »
acceptés ; 0,5 → « 1/2 ». Les niveaux 4 et 5 exigent une puissance de 10 (`isPow10`). *Correction* :
`pow10=true` à ce niveau, ou changer la consigne.

**M21 — Seconde, tableaux de signes (3.3.3 à 3.3.6) : la ligne des x est bornée par −∞ et +∞ alors que f n'est
définie que sur [−3 ; 3] ; le tableau de variation du même écran porte −3 et 3.** [LEC]
`secondes.html:14257`, `14427`, `14561`, `14762`. Au programme, un tableau de signes se dresse sur l'ensemble de
définition ; `synthese-fonction` (l. 15100) écrit correctement les bornes. *Correction* : `numFmt(a)` /
`numFmt(b)` comme dans syn.

**M22 — Seconde : seize exercices envoient au modèle d'IA le texte visible de l'écran, sans la courbe ni la réponse
attendue — l'aide travaille à l'aveugle.** [LEC]
`secondes.html:6243-6306` (`conseilPaire`, repli `ctxVisible()` l. 6214-6226) : aucune branche pour lv, tvd, img,
pim, ant, adr, iqd, ls, lsv, gsv, syn (thème 3) ni asp, mp, fracp, md, u (thème 1) ; les réponses attendues vivent
dans des attributs `data-exp` invisibles à `textContent`. Point 12 de la liste des branchements ; `ctxMmx` montre le
modèle à suivre.

**M23 — Seconde 5.11 : le tirage montre des « fractions » réductibles à vue, des divisions par 3/3 et des
multiplications par 1.** [EXE]
`secondes.html:35538-35580` (`rvfTirage`). Séance réelle : « 2/2 × 6 = 12/2 », « 4/2 ÷ 3/4 = 16/6 »,
« 3/8 + 9/8 = 12/8 ». Fraction d'énoncé réductible dans 56 à 60 % des questions, ÷ par une fraction égale à 1 dans
11 % des divisions. *Correction* : `gcd(n,d)===1` sur chaque fraction tirée, `n2!==d2`, entiers ≥ 2.

**M24 — Seconde 3.1.5 : sous « S = … », une note affirme sans condition que « les bouts de S sont les bouts du
domaine », ce qui est faux une fois sur deux.** [LEC]
`secondes.html:13657-13658` ; `spec.un` l. 13652-13655. *Correction* : n'afficher la note que si `!spec.un`.

**M25 — Seconde 6.1.7 et 6.1.8 (Python) : diagnostic faux quand le texte à afficher commence par le nom de la
variable (« age : », « ville : », « taille en m : », « prix en euros : »).** [EXE]
`secondes.html:27598-27604` (`pyxTexteNu`), `27617`. `print("age :", age` (parenthèse jamais fermée) reçoit « Le
texte « age : » doit être entre guillemets ». *Correction* : ne retenir le premier mot que s'il n'est pas un nom de
variable du programme.

**M26 — Seconde 6.1.7, 6.1.8, 6.1.12, 6.1.13 (Python) : une ligne qui affiche l'OPPOSÉ de la valeur est acceptée
(« un caractère diffère »).** [EXE]
`secondes.html:27676` (`pyxAffiche`), `27224-27230` (`pyTexteProche`, garde des chiffres seuls).
`print("la note est :", -note)` → OK avec sortie « -12 ». *Correction* : exiger la valeur comme jeton entier et
signé.

**M27 — Terminale 5.1 « Équation de tangente » : une case « 0 » est exigée quand b = 0 ou f(a) = 0 ; « y = x »
complet et juste vaut 0.** [EXE]
`terminale.html:14150` (`tgBuild`), `14233-14241` (`tgFormHTML`), `14299-14330` (`checkTG`). f(1) = 1, f′(1) = 1 :
`tg-b` vide → score 0, note 12/13 ; f(a) = 0 → note 11/13. b = 0 dans 7,7 % des questions, f(a) = 0 dans 20,3 %.
Le 5.2 (`tangente-exp`, l. 14405) fait juste, et le journal consigne « une case pour écrire zéro n'apprend rien ».
*Correction* : ne pas rendre `tg-b` quand `ans.b===0` ; accepter vide = 0 pour `tg-fa2`/`tg-t2` quand f(a) = 0.

**M28 — Terminale 1.1 (niveaux 2–3), 1.4, 1.5, 5.4 : la racine −b/a n'est acceptée qu'avec les signes de b et de
a, jamais simplifiée ni avec le signe déplacé.** [EXE]
`terminale.html:15776-15779`, `15548-15553`, `15575-15580`, `16671-16673`, `16743`, `12324-12327`. −2x + 6 = 0 :
« −6 / −2 » accepté, « 6 / 2 = 3 » → deux cases rouges, note 5/7 ; f(x) = −x : « 0 / 1 » refusé (attendu −1).
a < 0 dans 51 % des questions de niveau 2 ; un facteur à a < 0 dans 76 % des séances du 1.4. *Correction* :
accepter (n, d) dès que d ≠ 0, n/d = racine et |n| = |b|, |d| = |a| ; accepter 0/1.

**M29 — Terminale 1.2 et 1.5 : tirage sans `distinctes()`, le même trinôme deux fois par séance (4,4 %).** [EXE]
`terminale.html:15903-15907` (`startS2Run`), `15881-15893` (le démarreur hors devoir n'affiche qu'un choix de
niveau, donc le contrôle des séances de `tests/verifier.js:6191-6225` ne voit jamais un tirage du 1.2), `16811`
(`startSPC` : `[genSPC(),genSPC()]`). *Correction* : `distinctes(n, (_,i)=>genS2Root(plan[i]))`,
`distinctes(2, genSPC)`.

**M30 — Rappels « Augmenter » et « Diminuer » (Seconde et Première) : « on multiplie la valeur de départ par ce
coefficient, puis on divise par 100 ».** [LEC]
`secondes.html:6862` (`RAP_AUG`), `6868` (`RAP_DIM`) ; `premiere-specifique.html:17811`, `17817`. La phrase suit
immédiatement « multiplier par 120/100 = 1,2 » (resp. « 70/100 = 0,7 ») : pris au mot, 300 × 1,2 ÷ 100 = 3,6 et
0,7 × 300 ÷ 100 = 2,1 au lieu de 360 et 210. La division par 100 ne vaut que si l'on a multiplié par 120 (ou 70).
*Correction* : « on multiplie par 120 puis on divise par 100 (ou directement par 1,2) ».

**M31 — Terminale 4.1 TVI : l'énoncé écrit « sur ℝ » en dur alors que le tableau et la case attendue portent un
intervalle borné (89 % des questions).** [EXE]
`terminale.html:6571` (`tviPrompt` : « admet une unique solution, notée α, sur ℝ. »), `4100`. Le tableau montre
par exemple [−3 ; 7] et la case « intervalle » attend « [−3 ; 7] ». *Correction* : écrire l'intervalle du tirage
dans l'énoncé.

**M32 — Terminale 4.3 « TVI — contre-exemples » : la correction affirme que f « n'est pas continue sur son ensemble
de définition ».** [EXE]
`terminale.html:6788`, `6779`, `6754`. Pour f non définie en c, f est continue sur son ensemble de définition
]a ; c[ ∪ ]c ; b[ ; ce qui manque au TVI, c'est que cet ensemble n'est pas un intervalle (ou que f n'est pas définie
sur [a ; b]). *Correction* : « le TVI ne s'applique pas car f n'est pas définie en c : ]a ; b[ privé de c n'est pas
un intervalle ».

**M33 — Terminale TVI : rappels et corrigé incomplets ou trompeurs.** [LEC + EXE]
- `16107` (rappel du 4.4) : « compris entre les valeurs (ou limites) » donne la mauvaise réponse sur le piège de la
  limite non atteinte (k égal à une limite : 0 solution), présent dans 397 séances sur 500.
- `9032` (`modelJustif`, 4.2) : le corrigé omet « k compris entre f(a) et f(b) », que `RAP_TVI` (l. 16076) exige.
- `16063-16069` (`RAP_LR`) : rien sur la limite en un réel ni sur l'asymptote, alors que 2 questions sur 5 du 3.5
  en portent une et que l'attendu dit « MENTION OBLIGATOIRE » ; `16070-16076` (`RAP_TVI`) : théorème sur [a ; b]
  seulement, alors que 8 tirages sur 9 du 4.1/4.2 ont une borne ouverte ou infinie (l'extension aux limites est
  dans `RAP_ECV`, pas ici).

**M34 — Terminale 6.1.1 : le corrigé type écrit « raison −3, car on ajoute toujours 3 ».** [EXE]
`terminale.html:24047` (`mdlSU` : `'ajoute toujours'` avec `suLatexNum(c.raison)` non signé dans la suite de la
phrase). L'écran, lui, dit « retranchant toujours 3 » (l. 17111). *Correction* : « on ajoute toujours −3 » ou
« on retranche 3 ».

**M35 — Terminale 6.2.4 « Récurrence — rédiger » : le juge local ACCEPTE (verdict prioritaire) une hérédité fausse
dès que f(m) et f(M) apparaissent quelque part.** [EXE]
`terminale.html:13352-13357` (`rrJuge` : `nbT`, `aT`, `images`, `verdict`). Quand f(m) = m ou f(M) = M (64 % des
tirages), ces nombres sont déjà écrits comme bornes : « 5 ≤ U(n+1) ≤ 9 » pour f(8) = 8 puis « ≤ 8 » est acceptée ;
« or 9 ≤ 8 » (comparaison fausse précédée d'un mot) n'est pas jugée. Sur 6 000 copies à image fausse : 4 231
acceptées, aucun refus. *Correction* : exiger les deux images adjacentes à U(n+1) dans une même ligne ; rétrograder
en « abstention » (jamais « accepte ») toute copie dont une ligne n'est pas lue.

**M36 — Terminale 4.1 : après une pause, les menus proposent une option « null ».** [EXE]
`terminale.html:6539` (`[c._k+1,c._k-1,0,c._vG,c._vD].forEach(x=>{ if(isFinite(x)) pool.add(numFmt(x)); })`) :
les valeurs ±∞ des bornes ne survivent pas à l'enregistrement JSON de la pause (`null`), et 101 questions sur 300
reprises affichent « null » dans la liste. *Correction* : sérialiser les infinis en chaîne (« +inf ») et les relire.

### 4.3 Mineures

- **M37** `secondes.html:7028-7058`, `6584-6586` — rappels `RAP_ENS`, `RAP_ENS2`, `RAP_DEF`, `RAP_PGE` et chips
  QIA du thème 2 sans accents (« emboites », « decimaux », « Piege », « c'est-a-dire »). [EXE]
- **M38** `secondes.html:7033`, `7050` — ℚ défini comme « fraction de deux entiers » sans « dénominateur non nul »
  (la fonction Edge l'écrit, la page non). [LEC]
- **M39** `secondes.html:3768` vs `38145` — l'écran des ensembles affiche « Exercices parfaits 4 » alors qu'il compte
  des cases (4/5). [EXE]
- **M40** `secondes.html:25668`, `25603`, `25610` — « 2 millier », « 4,5 centaine », « 3 dizaine » au singulier (18
  écritures sur 63 ; valeurs justes). [EXE]
- **M41** `secondes.html:38080-38088` — une séance d'ensembles pose deux écritures du même nombre (18/3 et 30/5)
  dans 7 % des cas ; `36962-36971` multiplier-relatifs tire (a,b) puis (b,a) dans 3,3 % ; `33370`, `34791`
  placer-intervalle et ordre-croissant sans `distinctes()`. [EXE]
- **M42** `secondes.html:35351-35353` — reduire-produit propose « 0 » comme coefficient de x × x. [EXE]
- **M43** `secondes.html:5615-5616`, `37444-37460` — reduire-somme en soutien : « Corrige les cases en rouge » alors
  qu'aucune case n'est rouge (la case réductible vide reste neutre). [EXE]
- **M44** `secondes.html:25430`, `25473`, `25515` — les pièges enseignés par le rappel (0, √4, √9, −√9) ne sont jamais
  tirés : toute racine affichée est irrationnelle. [EXE]
- **M45** `secondes.html:6803` — `RAP_PCTC` décrit des cases de boîtes qui n'existent plus ; `20059-20063` contexte
  « Entreprise » : boîte « Filles », phrases « femmes ». [EXE]
- **M46** `secondes.html:22924`, `23367`, `23528` ; `premiere-specifique.html:10662`, `11266`, `11105` — valeur de
  départ jugée par égalité de chaînes (« 300,0 » refusé) alors que les cases voisines acceptent toute écriture. [EXE]
- **M47** `secondes.html:19890`, `19910` — pourcentage-chaine : même couple (P1, P2) deux fois dans 3,1 % des
  séances. [EXE]
- **M48** `secondes.html:19724`, `23217`, `23229`, `23165`, `22797`, `23142-23165` — contextes aux bords : lycée de
  9 000 élèves (5,7 %), « Un prix… 10,4 € » et « 9,5 € » hors `nOk`, « 61,2 licenciés » dans un message, « Une
  vitesse s'accroît de 2 % » malgré le commentaire qui l'exclut. [EXE]
- **M49** `secondes.html:5116-5131`, `22983` — la note partielle enregistrée compte les cases de la pose FACULTATIVE
  (le commentaire l. 22959 dit le contraire). [EXE]
- **M50** `secondes.html:18992` vs `17864-17867` — fractions-decimales niveau 3 : la note accepte « −15/−10 » que la
  peinture rougit (« Parfait ! » sous deux cases rouges) ; `parseInt` accepte « 15abc/10 ». [EXE]
- **M51** `secondes.html:17928-17930` ; `premiere-specifique.html:4845-4847` — calcul mental : « 0 − 0 »,
  « 0 + x », « × 1 » sortent du tirage (1,4 à 6 %). [EXE]
- **M52** `secondes.html:36075`, `36037`, `36390`, `36596`, rappels `7304-7309`, `7633-7637` — la correction verte et
  les messages donnent le résultat NON simplifié comme réponse modèle (« 156 sur 66 ») ; RAP_TSF s'arrête à 3/90,
  RAP_RVF ④ à 10/12. [EXE]
- **M53** `secondes.html:35889-35896` — `pfFracJuge` : une fraction égale peut être refusée quand P/Q est réductible
  (« 104/44 » pour 26/11). [EXE]
- **M54** `secondes.html:18869`, `18787-18792` — « Multiplie ces fractions décimales » alors qu'un facteur peut être
  un entier ; `18975-18981` niveau 1 : « 1/2 » accepté pour la « forme décimale » de 5/10. [EXE]
- **M55** `secondes.html:33655` — garde-fou mort de `divGen` que le journal 07 dit retiré. [LEC]
- **M56** `secondes.html:11792-11796`, `12024`, `11769` — equation-graphique : le domaine de g n'est énoncé nulle
  part alors que « le bout du dessin est toujours pris ». [LEC]
- **M57** `secondes.html:7152`, `7316`, `7380`, `12474` — rappels RAP_ING/RAP_IFG (« les bouts sont toujours pris » :
  faux pour une cloche) et RAP_CFX/`cfxWhy` (« touche la hauteur k à chaque bord » : non exigé par le juge). [LEC]
- **M58** `secondes.html:9880` — `lvReadInt` (`parseFloat`) accepte « 2abc », « 1/2 » → 1, et rend nulle une valeur
  collée avec le moins typographique U+2212. [EXE]
- **M59** `secondes.html:10787` — « Les antécédents de 3 est 4 » ; `15864` « la fonction f, défini » ; `12351`
  « admet pour solution S = { a ; b } ». [LEC]
- **M60** `secondes.html:9452`, `11469` — commentaires périmés (9 valeurs / 7 ; « un essai sur 220 ») ;
  `11478-11487` paliers de spline (4/4 000). [EXE]
- **M61** `secondes.html:32150-32154` — python-pas-a-pas-multiplication : k = l dans 4,7 % des tirages, le piège de
  la réaffectation disparaît. [EXE]
- **M62** `secondes.html:29438` — message d'erreur Python écrit le moins typographique « − » qu'il vient de refuser ;
  `29353`/`29363` « quotient de a par b » dans la consigne, « et » exigé dans la ligne. [EXE]
- **M63** `secondes.html:26558`, `27647` — « Python ne sait pas lire « ; » » (faux ; 6.1.6 le dit bien) ; `25948`,
  `26500`, `27330` une ligne indentée est acceptée (CPython : `IndentationError`) ; `27030-27044` `π` refusé ;
  `26012-26047` virgule finale refusée. [EXE]
- **M64** `secondes.html:7440`, `26574` — « la ligne `nombre` ne fait rien » : vrai dans un script, faux dans un
  carnet ; `7500-7505` `RAP_PTV` figé sur 2x+3 ; `5456` la carte du menu affiche des accolades « { c = a+b } » ;
  `28419` message « recopiée à la main » pour `note+0`. [EXE]
- **M65** `secondes.html:6553-6640`, `6662-6678` — diminuer-soustraction propose les questions IA de l'AUGMENTATION
  (« Pourquoi calcule-t-on d'abord l'augmentation ? ») ; `22632`, `22254` le contexte envoyé au modèle dit « Exercice
  de mathématiques de Première » dans la page de Seconde. [EXE]
- **M66** `premiere-specifique.html:6536-6537`, `18235-18236` (et `6943`, `7382`, `18260`, `18277`) — point décimal
  dans la correction affichée et le contexte IA (« 10 % de 6 = 0.6 ») sur un tirage sur trois du 2.1.9. [EXE]
- **M67** `premiere-specifique.html:6191-6199`, `6156-6166`, `6592`, `9269`, `8508` — « 1 élèves », « 1 articles »,
  « 1 hectares » (R = 1, ~0,3 % des tirages). [EXE]
- **M68** `premiere-specifique.html:17731` — `RAP_PDT` : « se termine par un autre chiffre que 5 (15 % ou 25 %) » ;
  `17800`, `17713`, `17709` rappels sur des tirages devenus impossibles (30 % de 600, 400 €, 32 €) ; `17733-17738`,
  `17747-17752` `RAP_ADX`/`RAP_DDX` sur 50 €, jamais tiré. [EXE]
- **M69** `premiere-specifique.html:5654` — `parseDecToFrac` refuse « 12. » et « 15 % » (le signe est déjà écrit à
  côté). [EXE]
- **M70** `premiere-specifique.html:8827`, `6871` — « donc : l'augmentation est 5 % de 7000 € est ▢ € » (deux
  « est »). [EXE]
- **M71** `premiere-specifique.html:18529-18538` — `QIA_MODELES.augq` : échappements `\\\\(` et `'\\n'` littéraux ;
  exemple toujours de type « pourcentage » même sur « valeur initiale ». [EXE]
- **M72** `premiere-specifique.html:11586`, `13621` — « la hausse globale est 1,26 − 1 = 26 % » (0,26 = 26 %
  sous-entendu). [LEC]
- **M73** `terminale.html:14338-14340`, `14348` — « y = 1 x », « y = −1 x + 2 » dans la correction et la réponse
  enregistrée (le 5.2 formate juste). [EXE]
- **M74** `terminale.html:3336`, `10492-10495`, `14198-14204` — la lettre f/g fait deux questions différentes pour
  `distinctes()` : même courbe deux fois dans 2,9 % des séances du 1.3. [EXE]
- **M75** `terminale.html:9610`, `9635-9645`, `6355` — 2.1.1 : une case VIDE de la ligne développée passe au bleu
  quand a = 1, même sur une ligne fausse. [EXE]
- **M76** `terminale.html:14424-14432`, `14638`, `15288` — 5.2, 5.5, 2.2.2 : le coefficient 1 de e doit être tapé
  (« f(1) = [ ]e » vide vaut 0) alors que le 2.1 accepte partout le facteur 1 omis. [EXE]
- **M77** `terminale.html:3208`, `3354`, `3347`, `6246-6255` — `derivees` (historique) : injoignable par le menu et
  les devoirs, encore repli de `restartCurrentTest` et étiquette des vieux résultats ; `suites` de même (voulu,
  `tests/profils.js:1912`) ; `6229-6230` son énoncé peut écrire « uₙ₊₁ = 2×uₙ + 0 ». [EXE]
- **M78** `terminale.html:9002-9008` (`jHasVal`), `9132`, `9024` — 4.2 : le signe des valeurs est ignoré (« varie de
  5 à −4 » reconnu pour « −5 à 4 » ; « sur R » coche tout intervalle). Sans effet sur la note. [EXE]
- **M79** `terminale.html:8299`, `8305`, `7791`, `7923` (règle `TOL_NUM` `3088-3096`) — tolérance ±0,1 appliquée à
  des LIMITES et à des solutions exactes : « 2,1 » accepté pour 2, « −0,9 ; 3,1 » pour −1 ; 3. Décision globale,
  à trancher (`tol:0` sur ces cibles). [EXE]
- **M80** `terminale.html:8296`, `8317` vs `6956` — « ∞ » sans signe accepté pour +∞ en 3.2-3.4 et 4.6, refusé en
  3.5 (« doit être SIGNÉE »). [EXE]
- **M81** `terminale.html:6769` — l'attendu envoyé au modèle du 4.3 écrit « k ∉ [−∞ ; 7] » (781 attendus sur
  2 000). [EXE]
- **M82** `terminale.html:6544-6546`, `9034` — « f(x) est continue » (c'est f qui l'est ; le 4.6 écrit juste). [LEC]
- **M83** `terminale.html:8525-8529` — 3.3/3.4, famille ln : le tableau commence à « a » sans double barre ni mention
  du domaine ]a ; +∞[. [LEC]
- **M84** `terminale.html:17085-17089` (6.1.1 : le type vide rougit en entraînement) ; `13693-13697`, `13875-13876`,
  `13909` (6.1.4 : Vₙ = V₀ × (11/20)ⁿ refusé, seule la raison décimale est lue) ; `17633-17638` (6.1.2 : k = −0,25
  accepté à ±0,1) ; `12917-12923` (6.3.1 : « 8 + (0,75)^(n+1) » refusé) ; `18894`, `20721` (6.4.2, 6.4.3 : un
  majorant plus large, donc vrai, refusé — le 6.4.1 fait l'inverse) ; `20302-20305` (6.2.5 : « 0 » deux fois
  dans la liste des limites quand U₀ = 0). [EXE]

---

## 5. Détail — technique

**T1 (importante) — Seconde 2.1/2.2 « Ensembles de nombres » : la rangée d'aide déborde de l'écran à 380 px.** [EXE]
`secondes.html:3777` (`<span id="ensActions" style="display:inline-flex;gap:12px">`), `38108`
(`$('ensActions').innerHTML=conseilInlineBtn()+…`). Mesure Chromium 380 × 800 : la rangée « Rappel de cours ·
Conseil · Poser une question à l'IA · Vérifier » fait 584 px (gauche −102, droite 482), la page défile de 102 px
en soutien (47 px en entraînement), « Rappel de cours » et « Vérifier » sont hors écran, la commande « Mettre en
pause » est coupée. Capture : `scratchpad/mobile/resultats/captures/capture-secondes-ensembles-nombres-soutien.png`.
*Correction* : `flex-wrap:wrap; justify-content:center` sur `#ensActions` (les autres écrans passent par la rangée
générique `.pm-jetons`, qui se replie).

**T2 (importante) — Seconde 5.1 « Simplifier une fraction en coloriant deux barres » : à 380 px la barre « partagée
en 20 » fait 102 px de large, ses 20 segments 4 px chacun.** [EXE]
`secondes.html:1166-1169` (`.smp-bar{…flex:1 1 auto;max-width:1080px;height:62px}`, `.smp-seg{flex:1 1 0}`),
`1190` (règle étroite : hauteur 50 px seulement). L'étiquette « partagée en 20 » et les « … » à droite prennent la
largeur, la barre est comprimée : impossible de colorier au doigt (24 cibles de 2 à 4 px mesurées). Capture :
`capture-secondes-simplifier-barres-train.png`. *Correction* : empiler étiquette et barre en colonne sous 480 px
(`.smp-ligne{flex-direction:column}`), barre à 100 % de la carte.

**T3 (importante) — Seconde 1.1 « Additions et soustractions » : l'opération posée est coupée à droite à 380 px.**
[EXE]
Écran `#scr-asptest`, hôte `#aspHost.mp-op` : droite = 385 px pour une vue de 380, la page défile de 5 px ; la
colonne des unités (« 6 », « 5 ») et la case de résultat de droite sont rognées par le bord de la carte. Capture :
`secondes-addition-soustraction_train.png`. *Correction* : réduire la taille des cases/chiffres de la pose sous
400 px (`--mp-cell`), ou autoriser le défilement horizontal de la carte seule.

**T4 (mineure) — Course entre les trois bancs navigateur sur le cache MathLive.** [EXE]
`tests/navigateur.js:84-96` (`mathlive()` : `existsSync` puis lecture, téléchargement par `curl -o` non atomique).
`npm run test:navigateur` lance les trois niveaux EN PARALLÈLE ; au premier passage sur un dépôt frais, un banc lit
le fichier pendant qu'un autre l'écrit et sert un module tronqué : « Invalid or unexpected token » dès l'ouverture,
`<math-field>` non enregistré, 28 échecs sur la Seconde (`navigateur.log`), puis 582 contrôles verts en relançant
la Seconde seule. En CI chaque niveau a son runner, le cas n'y apparaît pas. *Correction* : télécharger dans un
fichier temporaire puis `renameSync`, et vérifier la taille avant de servir.

**T5 (mineure) — Structure des trois pages.** [LEC]
Aucune balise `<html lang="fr">`, `<head>` ni `<body>` (le navigateur les synthétise) : la langue n'est pas déclarée
(lecteurs d'écran, césure, correcteurs) ; `<meta charset>` est au-delà des 1 024 premiers octets (1 267 à 1 320) :
en ligne l'en-tête HTTP fixe l'encodage, mais ouvert localement (`file://`) une page peut être mal décodée.

**T6 (mineure) — `site-maths/index.html:41` : `color:varA(--encre-douce)`.** [LEC] Faute de frappe ; la déclaration
est ignorée et « Lycée · Mathématiques » prend la couleur héritée.

**T7 (mineure) — `site-maths/index.html`, `DM_CFG` : la table de repli des numéros d'exercices est périmée.** [EXE]
Comparée aux `THEMES` des pages : Seconde 8 écarts (ensembles-nombres 1.1 → 2.1, lecture-variations 2.3.1 → 3.3.1,
pourcentage 3.1 → 4.1.3, augmenter-pourcentage 3.2 → 4.2.1, diminuer-pourcentage 3.3 → 4.3.1…), Terminale 12 écarts
(derivee-exp 2.1 → 2.1.1, etude-fonction 5.2 → 5.3, etude-quotient 5.3 → 5.4, suite-explicite 6.1 → 6.1.1,
suites-encadrement 6.3 → 6.2.1, recurrence-complete 6.5 → 6.2.3…) ; Première à jour. La carte publiée par
l'application prime, le repli ne sert qu'aux devoirs enregistrés avant elle — mais le dernier commit du portail
annonce ce repli « à jour ».

**T8 (mineure) — Poids des pages.** [EXE] `secondes.html` 2,75 Mo (763 Ko gzip), `terminale.html` 1,74 Mo (514 Ko),
`premiere-specifique.html` 1,37 Mo (382 Ko), plus MathLive 840 Ko, supabase-js 218 Ko et les polices Google, sans
aucun cache (choix documenté de `sw.js`). Sur un téléphone en 4G, plusieurs secondes avant le premier écran ; la
feuille MathLive statique (240 Ko) et les commentaires-journaux (une part importante des 2,35 Mo de JS de la
Seconde) sont servis à chaque élève. Pistes : `<link rel="preload">` pour MathLive, une étape de minification
optionnelle à la publication (sans changer la source), ou un cache de version dans `sw.js` invalidé par
`APP_VERSION`.

**T9 (mineure) — Code dupliqué.** [EXE] 291 fonctions portent le même nom dans les trois fichiers, 133 ont un corps
strictement identique (95 Ko) ; 308 autres sont identiques entre deux fichiers (320 Ko) ; 575 règles CSS sont
communes aux trois feuilles. Exemples : `envoyerSignalement` (3 Ko), `dmMoyennesHTML`, `bexpCorrige` (3,9 Ko),
`paveBrancher`, le pavé numérique, le clavier mathématique, le tableau de bord, l'aide IA, les devoirs ; le moteur
des pourcentages est dupliqué Seconde/Première (M5, M13-M15, M30 et M46 existent en double). Un fichier
`commun.js` chargé par les trois pages (sans compilation) suffirait à corriger un défaut une seule fois.

**T10 (mineure) — Le code de l'élève se tape en clair.** [LEC] `#loginPin` (`secondes.html:2787`,
`premiere-specifique.html:1396`, `terminale.html:1775`) est un `<input>` texte (`inputmode="numeric"`) sans
`type="password"` ni `-webkit-text-security` : le code s'affiche en classe sur l'écran du voisin. Le champ du
professeur, lui, est masqué.

**T11 (importante, choix documenté) — Prénoms et clés des élèves lisibles sans connexion.** [LEC]
`supabase/migrations/001_comptes_et_verrouillage.sql:159` (`create policy p_%s_liste … for select to anon,
authenticated using (true)`) et les pages (`secondes.html:8443`, `premiere-specifique.html:4683`,
`terminale.html:5091` : `select('id,prenom,cle')` avant toute connexion). Tout visiteur lit la liste des prénoms
de mineurs et la clé qui forme l'adresse du compte ; le code n'a que 10⁶ valeurs et « la limitation de cadence de
Supabase est le seul rempart » (CLAUDE.md). C'est un choix assumé pour l'écran de connexion par prénom ; il mérite
d'être pesé au regard du RGPD (données de mineurs exposées publiquement) : une liste de prénoms servie par une
fonction Edge après un code d'établissement, ou des initiales, réduiraient l'exposition.

**T12 (mineure) — Terminale : commandes flottantes sans libellé court.** [EXE] `tc-court`/`tc-long` existent en
Seconde et Première (6 occurrences), pas en Terminale (0) : à 380 px, « Signaler un problème / Abandonner / Mettre
en pause » s'écrivent sur trois lignes et occupent ~180 px sur 740 (24 % de l'écran) en permanence. Le pavé
numérique compact chevauche ces commandes de 11 px, mais elles restent atteignables (`elementFromPoint`).

**Ressources et erreurs.** Toutes les ressources externes et les pages publiées répondent 200 (supabase-js, MathLive,
GitHub Pages, portail, `fiches.json`, PDF) ; `https://turquet78.github.io/exercices-interactifs/` répond 404 (pas
d'index, voulu — mais un élève qui tronque l'adresse tombe sur une 404 anglaise). **Aucune erreur JavaScript** n'a
été relevée sur les 229 exercices ouverts dans les deux modes à 380 px, ni sur le portail.

---

## 6. Détail — accessibilité

**A1 (importante) — Contrastes.** [EXE] Les couleurs de verdict de `:root` (`secondes.html:41`,
`premiere-specifique.html:48`, `terminale.html:48`) : vert `--green #1FA971` sur blanc = 3,01 (2,78 sur le papier
`#F7F6F1`), rouge `--red #E23D52` sur blanc = 4,18 ; AA exige 4,5 pour le texte courant. Le vert porte le score en
direct (« 0 / 10 »), les verdicts « bon », les pastilles ; le rouge les mots en gras des énoncés (« retenue »,
« facultatives » : 264 occurrences mesurées en Seconde), les messages d'erreur. axe-core : `color-contrast`
(serious) 86 nœuds en Seconde, 42 en Première, 10 en Terminale ; en Seconde aussi le vert Python `rgb(10,138,42)`
sur fond gris/bleu pâle (3,93 à 4,19). Portail : orange Première `#b06a12` sur la carte = 4,20. Le bleu `#2B50C8`
(6,8) et l'encre douce (5,6) sont bons. *Correction* : `--green:#178A5C` (≈ 4,6) et `--red:#C9304A` (≈ 5,3), ou
fond pâle sous ces textes.

**A2 (importante) — Cases sans nom accessible.** [EXE] axe-core : `label` (critical) 370 nœuds / 30 écrans en
Terminale, 77 / 18 en Seconde (`#s1-val`, `#img-c`, `#pim-fx`…) ; `select-name` (critical) 352 nœuds / 51 écrans en
Terminale (menus ↗↘ des tableaux de variation), 29 en Seconde ; `aria-input-field-name` (serious) sur toutes les
`math-field` (772 en Seconde, 583 en Première, 481 en Terminale : le `.ML__keyboard-sink[role=textbox]` de MathLive
n'a pas de nom). Un lecteur d'écran annonce « zone de texte » sans dire quelle case (numérateur ? dénominateur ?
f′(a) ?). *Correction* : `aria-label` porté par chaque case au rendu (le libellé existe déjà dans le HTML voisin),
`aria-labelledby` vers l'en-tête de colonne pour les tableaux ; pour `math-field`, `aria-label` sur l'élément (MathLive
le propage).

**A3 (importante) — Cibles tactiles trop petites (WCAG 2.5.8 : 24 × 24 px minimum).** [EXE à 380 px] Points
cliquables des graphiques `<g>` 16 × 16 (solutions-graphique et tvi-lecture-graphique : 22 cibles), segments à
colorier `div.fp-seg` 80 × 12 (fraction-pourcentage, pourcentage-colonnes : 20), `div.smp-seg` 2 à 4 × 46
(simplifier-barres, voir T2), menus `select.vt-sel2` 48 × 23 (tableaux de variation : Seconde 3.3.x, Terminale
1.3, 2.1.6-2.1.8, 2.2.1, 3.3, 5.3-5.5), cases `input.tg-in.tx-se` 30 × 23 (tangente-exp, etude-convexite,
tvi-alpha-signe, etude-exponentielle : jusqu'à 10 par écran, 75 sous 32 px), cases `sa2-in` 30 × 23 (suites 6.2.5,
6.2.6, 6.4.3), `math-field.rc-mf` 20 × 30 (recurrence-complete), `select.ec-sel` 200 × 21. *Correction* :
`min-height:32px` sur ces cases et menus, rayon de 14 px sur les points cliquables (zone invisible), segments d'au
moins 24 px.

**A4 (importante) — Navigation au clavier.** [LEC + EXE] Les points de courbe (`<g>` SVG avec gestionnaire de
clic) et les segments à colorier (`div.fp-seg`, `div.smp-seg`) n'ont ni `tabindex` ni rôle : les exercices
solutions-graphique, tvi-lecture-graphique, placer-image, antecedents-droite, fraction-pourcentage,
pourcentage-colonnes, simplifier-barres sont infaisables sans souris ni doigt. Les autres commandes sont des vrais
`<button>` (chips de prénoms, modes, Vérifier), le focus est rendu par une bordure colorée (`outline:none` remplacé,
acceptable). *Correction* : `tabindex="0"`, `role="button"`, `aria-pressed`, et une réponse à Entrée/Espace sur ces
éléments ; ou une saisie de secours au clavier (case « x = … »).

**A5 (mineure) — Textes sous 12 px.** [EXE] Graduations des axes SVG à 10 px (tous les graphiques : Seconde
thème 3, Terminale 2.x à 6.x — jusqu'à 27 textes par écran sur convexite-trois-courbes), `small « n→+∞ »` 10 px,
`tspan` 9 px (suite-vocabulaire), exposants et indices MathLive 11,2 à 11,8 px. Sur un téléphone, les graduations
sont le support même de la lecture graphique. *Correction* : 12 px minimum pour les graduations (`font-size` du
`<text>`), quitte à n'en écrire qu'une sur deux.

**A6 (mineure) — Lecteurs d'écran.** [LEC] Aucune région `aria-live` dans les trois pages : le verdict (case bleue
ou rouge), le score et les messages « Bravo » ne sont pas annoncés ; pas de `lang` (T5). Les verdicts combinent
couleur et pastilles ✓/✗, ce qui est bon pour les daltoniens.

**A7 (mineure) — Tableaux dans des enveloppes défilantes non focusables.** [EXE] axe `scrollable-region-focusable`
(serious) : `.lv-tblwrap`, `#tveTable`, `#tvfTable` (30 nœuds / 18 écrans en Seconde, 12 / 6 en Terminale) : à
380 px ces tableaux défilent horizontalement, sans être atteignables au clavier. *Correction* : `tabindex="0"` sur
l'enveloppe.

**A8 (mineure) — Portail.** [EXE] Orange Première sur la carte 4,20 ; étiquette « Mathématiques » à 11,5 px. Le
reste (grille à une colonne sous 640 px, cibles, hiérarchie) est correct à 380 px.

**Points positifs mesurés** : `prefers-reduced-motion` géré ; polices Nunito/Fredoka lisibles, interlignage 1,5,
aucun texte justifié ; police réduite à 90 % sur tablette par une règle unique ; le pavé numérique et le clavier
mathématique sont atteignables sur tout écran (contrôle universel du banc) ; aucune page ne déborde à 380 px hors
T1 à T3 ; les chips de prénoms et les commandes sont de vrais boutons.

---

## 7. Doutes non tranchés (à arbitrer, non comptés)

- **Verdicts du modèle d'IA** (definitions-ensembles, rédactions libres des trois niveaux, 2.1.2/2.1.5/4.4/4.5 de
  Terminale) : non exécutables hors ligne ; les règles envoyées ont été relues et sont justes, sauf M17, M81 et le
  contexte « Première » de M65.
- **Tolérance `TOL_NUM` (±0,1)** en Terminale : appliquée à des bornes d'encadrement (6.2.1, 6.2.2), à des limites et à
  des solutions exactes (M79, M84) — décision globale qui peut valider une inégalité fausse.
- **Sérialisation MathLive** (« oo » → ∞, `\exp`, `{,}` → `.`) : jsdom pose des chaînes ; le banc navigateur du dépôt
  couvre les cas qu'il nomme, pas `exp(x)` tapé dans une case de dérivée (Terminale 2.1).
- **`test.qId` périmé** sur six démarreurs de la Première (`startAug` 10591, `startDim` 11194, `startAdx` 6843,
  `startAtd` 7041, `startDdx` 7282, `startDdt` 7434) : après une synthèse rédigée, `augmenter-dix` tourne avec
  `test.qId='synthese-augmentations-libre'` ; aucun effet prouvé sur la note, la pause ou les devoirs.
- **Convention « numérateur seul »** : `hs`/`hsc` (« 20 » seul devant 20/100 → rouge) contre `pctq` (« 3 » seul devant
  30/100 → bleu) : deux règles documentées qui se contredisent sous les yeux d'un élève qui passe du 4.1.4 au 4.2.7.
- **Rédactions de fractions** (5.7, 5.9) : un résultat final non simplifié est accepté par le juge local alors que
  l'attendu envoyé au modèle annonce « déjà irréductible ».
- **Signe moins typographique (U+2212)** collé dans une case : refusé dans les cases Python du pas à pas et
  `lvReadInt` ; le pavé tactile insère bien « - ».
- **Contradiction apparente entre le journal et le code** : `soutienEnDirect.sans` (`tests/profils.js:839`) déclare lv,
  img, ant sans correction en direct alors que `lvLive`, `imgLive`, `antLive` existent.

## 8. Ce qui reste à faire

- Rejouer `npm run test:base` et `npm run test:fonction` (PostgreSQL et la fonction Edge n'ont pas pu être levés
  ici).
- Éprouver les rédactions avec le vrai modèle (une vingtaine de copies types par exercice rédigé) et mesurer M16 en
  conditions réelles.
- Ouvrir les trois pages sur une vraie tablette et un vrai téléphone (clavier système, mode installé) pour M10, T2
  et A3.
- Un passage avec NVDA ou VoiceOver sur trois écrans types (connexion, tableau de variation, opération posée).
- Étendre le contrôle universel « aucune case vide ne rougit » au mode soutien et à une copie partiellement remplie
  (M13) : c'est le trou par lequel la plupart des « importantes » de ce rapport sont passées.

## 9. Sources de l'audit

Les onze rapports de relecture (couverture exercice par exercice, preuves, scripts jsdom) et les mesures mobiles
(JSON par page, captures d'écran, journaux `npm test` et `npm run test:navigateur`) ont été produits dans l'espace
de travail de la session ; ils ne sont pas versionnés ici pour ne pas alourdir le dépôt. Chaque constat ci-dessus
peut être reproduit à partir des lignes citées et, pour les mesures d'écran, avec Playwright à 380 × 800 en mode
tactile sur les pages servies en `file://` avec le double Supabase du dépôt (`tests/faux-supabase.js`).
