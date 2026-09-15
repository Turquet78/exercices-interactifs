# Diagnostic d'installation sur tablette

Trois pages qui ne servent qu'à MESURER, sur la tablette elle-même, ce que
Chrome Android pense d'un manifeste — elles ne sont liées à rien et ne se
mettent pas en ligne pour les élèves. Elles s'ouvrent depuis la
prévisualisation Netlify d'une pull request :
`https://deploy-preview-<n>--turquet-math.netlify.app/tests/diagnostic/statique.html`
(et `script.html`, `dossier.html`).

Chaque page affiche ce qu'aucun banc ne peut lire d'ici : la requête média
`pointer: coarse`, le lien manifeste présent ou non, le manifeste et ses
icônes tels que la tablette les charge, les service workers enregistrés, et
l'événement `beforeinstallprompt` — le verdict de Chrome lui-même, avant
tout menu.

| Page | Lien manifeste | Portée | Service worker |
|---|---|---|---|
| A `statique.html` | écrit en dur | le fichier | non |
| B `script.html` | posé par le code MÊME de la vraie page | le fichier | oui (`sw.js`) |
| C `dossier.html` | écrit en dur | le dossier `./` | non |

## La bande du bas de l'écran

`bande-basse.html` mesure autre chose, et pour un autre signalement (septembre
2026 : « la ligne la plus basse du clavier virtuel ne fonctionne pas, les
caractères ne s'affichent pas », tablette Samsung, page en mode application).
En « fullscreen » la page dessine jusqu'au bord physique de l'écran, où
Android se réserve la zone du geste de retour à l'accueil : les touches qui y
tombent n'arrivent jamais à la page. La Première réserve donc 48 px
(`--bas-systeme`), une valeur prise sur la documentation d'Android — pas
mesurée sur l'appareil, parce qu'aucun banc d'ici ne le peut.

Cette page-là le mesure : son manifeste demande « fullscreen », comme la
Première ; installée puis ouverte depuis l'icône, elle empile sept barres à
des hauteurs connues du bord bas, et affiche le point le plus bas qu'une
touche ait atteint. La première barre qui répond donne la hauteur de la bande
perdue, en portrait comme en paysage. Si elle est au-dessus de 48 px, c'est la
réserve de la page qu'il faut relever ; si tout répond dès le bord, la cause
est ailleurs.

Sur la tablette de Turquet (Chrome 140, septembre 2026), les trois pages ont
reçu `beforeinstallprompt`, la vraie page aussi, et l'adresse des élèves a
proposé « Installer » : le refus antérieur venait de l'appareil (page en
cache, ancien raccourci), pas du code. Pour mesurer la VRAIE page à son tour,
il suffit de lui ajouter, sur une branche de brouillon, un crochet qui charge
un script de mesure quand l'adresse porte `?diag` — voir l'historique de la
pull request #191.
