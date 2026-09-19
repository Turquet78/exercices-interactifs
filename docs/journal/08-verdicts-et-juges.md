# Verdicts, juges locaux et relecture par l'IA

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Les phrases qui commentent une vérification par l'IA sont VERTES quand c'est
bon, ROUGES quand c'est faux** (demande de Turquet, août 2026) — comme tous les
retours de l'application. Les trois exercices rédigés (4.5, 4.7, 4.9) posaient
leur verdict en encre neutre (`iafb` sans couleur) : le correct et le faux se
lisaient pareil. La classe `good`/`bad` suit maintenant le verdict, aux deux
endroits — `checkMLL` (4.7 et 4.9) et `checkSFL` (4.5) ; n'en corriger qu'un
n'aurait corrigé que la moitié des exercices. Le contrôle vit dans la chaîne
séquentielle des contrôles asynchrones (il remplace `sb` — le piège documenté),
stubbe le verdict du modèle ET la feuille (jsdom n'a pas MathLive), mais exerce
la vraie fonction qui peint et relit la COULEUR.

**Et la même règle était PERDUE en Première et en Terminale — par deux portes
différentes.** Demande de Turquet (septembre 2026) : « répare la couleur des
verdicts en première et terminale ». Le paragraphe ci-dessus raconte la Seconde
d'août 2026 ; les deux autres fichiers écrivaient toujours leur verdict en
NOIR, et il a fallu les deux correctifs — n'en tenir qu'un ne tient rien.
· **La CASCADE, en Première.** La page posait bien la classe
  (`'mp-feedback iafb '+(correct?'good':'bad')`), et la phrase s'écrivait quand
  même en noir : `.mp-feedback.iafb{color:var(--ink)}` a la MÊME spécificité
  que `.mp-feedback.good` et se déclare plus bas, donc il gagnait. La cascade
  trompait, pas le balisage — la leçon de la phrase des couleurs du 6.3,
  retombée telle quelle, et aucun banc jsdom ne pouvait la voir : le contrôle
  qui existait lit des CLASSES et restait vert. `.iafb` ne pose plus d'encre
  du tout ; sans elle le bloc hérite de l'encre ordinaire, exactement comme
  avant. Le 2.1.7, le 2.2.10, le 2.3.8 et le 2.5.2 retrouvent leur couleur
  d'un coup, et le 5.5 de la Terminale avec eux.
· **Les POSES, en Terminale.** Elle ne demandait simplement pas la couleur :
  vingt-trois écrans écrivaient `'mp-feedback '+(fbHTML?'iafb':'bad')` — donc
  VERT ou ROUGE quand le modèle se tait, NOIR dès qu'il répond, sur le même
  écran et pour le même verdict —, et les dérivées rédigées (2.2, 2.3) comme
  les bilans du 6.7 et du 6.8 posaient `iafb` seul. Ils portent tous leur
  verdict désormais. **Quatre poses restent neutres, et c'est voulu** : le
  bilan affiché AVANT de savoir (« L'IA relit ton calcul… ») et celui d'une
  relecture indisponible — rien n'est décidé, donc rien n'est peint, et les
  lignes ✓/✗ du bilan portent déjà leur propre couleur.
**Deux bancs, et chacun tient le bord que l'autre ne voit pas.** jsdom nomme la
CAUSE — aucune encre sur `.iafb` — et COMPTE les poses de `iafb` sans verdict,
comparées au profil (`verdictSansCouleur`, deux sources) : une pose qui
perdrait sa couleur fait monter ce compte et se NOMME. Le NAVIGATEUR
(« 9 ter ») mesure l'ENCRE RÉSOLUE de quatre témoins : `iafb good` vaut
`--green`, `iafb bad` vaut `--red`, un `iafb` SEUL reste l'encre ordinaire — le
bord opposé, sans lequel une règle qui peindrait tout en vert passerait — et à
l'intérieur d'un verdict coloré les phrases balisées par le modèle gardent LEUR
encre (`fb-ok` vert, `fb-ko` rouge), que remettre les règles dans un autre ordre
casserait. Il vaut pour les TROIS fichiers sans rien déclarer.
**Et l'encre neutre n'est PAS redéclarée sur `.mp-feedback`** : le bloc en
hérite, donc l'écrire serait un garde-fou de plus qui n'écarte jamais rien — et
le contrôle jsdom accepte que la règle `.iafb` n'existe pas du tout, ce qui est
le cas de la Seconde et explique qu'elle n'ait jamais eu ce défaut. Dix
sabotages, chacun rougissant en nommant son défaut — sept au banc jsdom, trois
que seul le navigateur voit.

**Un verdict arithmétique ne se confie pas à un modèle.** Le modèle a compté
faux une copie JUSTE en production : sur « 1/2 − 1/6 = 6/12 − 2/12 = 4/12 =
1/3 » — chaque égalité vraie, le dénominateur commun 12 autorisé en toutes
lettres par la règle — il a inventé une erreur sur la soustraction des
numérateurs (« 6 − 2 = 4, c'est juste, mais c'est faux en termes de calcul de
fractions »). Signalé par Turquet sur une capture, août 2026 : le pire défaut
possible, et structurel — la règle était claire, l'envoi était propre, le
modèle a simplement déraillé.
La page porte donc son JUGE (`libreJuge`), qui sert les trois rédactions —
4.5, 4.7, 4.9 — et calcule en entiers exacts : les morceaux découpés aux « = »
comme la règle le dit, chaque morceau évalué en rationnel, le résultat final
lu tel qu'écrit, l'étape exigée (même dénominateur au 4.5, l'inverse au 4.9)
reconnue par sa VALEUR au niveau zéro des parenthèses. Quand le juge sait lire
la copie, son verdict PRIME : le modèle reçoit ce verdict avec l'énoncé — pas
avec la règle, qui frôle sa borne de troncature ; l'énoncé a 3000 de marge, et
le contrôle de la borne mesure l'énoncé AVEC le bloc — et ne fait plus que
RÉDIGER. S'il CONTESTE le verdict, sa prose raconte l'autre verdict : elle est
remplacée par la phrase du juge. S'il est en panne, le juge répond seul au
lieu de bloquer l'élève.
**TROIS positions, pas deux, et c'est ce qui rend le juge sûr** : il ne REFUSE
que sur un fait prouvable (une égalité fausse, un résultat non simplifié) et
n'ACCEPTE que lorsque tout est positivement vérifié ; une étape qu'il ne
reconnaît pas, une écriture qui lui échappe, un résultat écrit comme un calcul
le font S'ABSTENIR — le modèle reste alors seul juge, comme avant. Refuser
localement une forme que le modèle aurait acceptée recréerait le défaut qu'on
corrige, dans l'autre sens.
Deux contrôles : l'un éprouve le juge cas par cas — la copie de production
d'abord : si elle ne passe pas au juge, c'est le juge qui a tort —, l'autre
CLIQUE avec un modèle stubbé qui SE TROMPE et lit la note et la couleur. Le
banc navigateur rejoue la copie de production sur du VRAI MathLive — jsdom n'a
pas la sérialisation réelle que le juge doit lire. Éprouvé en le cassant dix
fois, et **deux sabotages ont d'abord traversé** : l'inverse accepté sur
n'importe quel produit — l'égalité fausse attrapait tous les cas existants
avant lui, il fallait un produit VRAI qui n'est pas l'inverse — et la garde de
la prose retirée à moitié — le sabotage ne retirait que la copie du 4.7 quand
le contrôle ne regardait que le 4.5. Les questions des contrôles qui posent
des copies fixes sont désormais ÉPINGLÉES : une copie qui ne colle pas à la
question tirée serait refusée par le juge, à bon droit, et le contrôle
mesurerait autre chose que ce qu'il croit mesurer.

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

**Le terme entier recopié dans une case de coefficient se NOMME.** Signalé
par Julien, transmis par Turquet (août 2026) sur le 2.1 : « on me signale une
erreur alors que la correction est conforme à ce que j'ai écrit ». Dans la
ligne développée, chaque case attend le COEFFICIENT — la page écrit e^(kx)
juste après la case — et l'élève avait recopié le terme ENTIER (« 3xe^(−x) »)
dans la case : son terme affiché valait (3xe^(−x))·e^(−x), compté faux à bon
droit, mais la bonne démarche affichée (« +3xe^(−x) ») ressemblait trait pour
trait à ce qu'il avait tapé — il était convaincu d'une injustice. La
vérification détecte désormais ce cas précis (une case fausse dont le contenu
vaut un terme attendu ENTIER, exponentielle comprise) et le message le dit en
toutes lettres, en entraînement comme en soutien : « e^(…) est déjà écrit
APRÈS chaque case — écris seulement le coefficient ». Jamais sur une copie
juste. Le contrôle rejoue la copie du signalement — d'abord SANS l'erreur (si
elle ne passe pas, c'est le contrôle qui a tort), puis avec — éprouvé par
sabotage.
