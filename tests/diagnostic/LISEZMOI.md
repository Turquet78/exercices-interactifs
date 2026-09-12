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

Sur la tablette de Turquet (Chrome 140, septembre 2026), les trois pages ont
reçu `beforeinstallprompt`, la vraie page aussi, et l'adresse des élèves a
proposé « Installer » : le refus antérieur venait de l'appareil (page en
cache, ancien raccourci), pas du code. Pour mesurer la VRAIE page à son tour,
il suffit de lui ajouter, sur une branche de brouillon, un crochet qui charge
un script de mesure quand l'adresse porte `?diag` — voir l'historique de la
pull request #191.
