# Cours en PDF, porte du professeur et portail

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

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

**Le portail, trois corrections de l'audit d'octobre 2026 (T6, T7, A8).** Une
faute de frappe, `color:varA(--encre-douce)`, faisait ignorer la couleur de
« Lycée · Mathématiques », qui prenait l'encre pleine : `var(…)`. La table de
REPLI des numéros d'exercices (`DM_CFG`, `exos`) était restée à l'ancienne
numérotation — 8 écarts en Seconde (ensembles 1.1 → 2.1, pourcentage 3.1 →
4.1.3…), 12 en Terminale (derivee-exp 2.1 → 2.1.1, recurrence-complete 6.5 →
6.2.3…). La carte publiée par l'application (`valeurs.exos`, écrite par
`carteExercices()`) prime ; le repli ne sert qu'aux devoirs enregistrés avant
elle — mais un devoir de ce temps-là affichait le mauvais numéro. Les trois
tables sont désormais la COPIE de `carteExercices()` lue dans jsdom sur les
trois pages (159, 57 et 50 exercices), régénérées par une sonde, jamais à la
main ; le commentaire du portail le dit. L'orange de la Première `#b06a12`
(4,20 sur la carte) devient `#94590d` : 5,6 sur la carte, 4,9 sur le papier,
4,6 sur la pastille teintée. L'étiquette « Mathématiques » des fiches (`.tag`,
11,5 px) et les badges (« Bientôt disponible », « Devoir n° », 11,2 px)
passent à 12 px. Mesuré dans Chromium à 380 px : plus aucun texte sous 12 px.
