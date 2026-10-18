# Les dessins des exercices

Les images que les exercices affichent — le serpent des exercices Python, ses
déguisements d'Halloween (`<identifiant>-halloween.webp`, sous-thèmes 6.1, 6.2
et 6.3), le
schéma-bilan des ensembles de nombres — vivent ici, **en fichiers**, un dossier
par niveau :

```
dessins/secondes/<identifiant-de-l-exercice>.webp
```

**Pourquoi des fichiers, et plus des URL `data:`** (décision de Turquet,
octobre 2026). Jusque-là chaque dessin était écrit en base64 dans la page,
« pour que la page reste un seul fichier ». À 43 dessins, cela faisait 770 Ko
sur les 4,9 Mo de `secondes.html` — téléchargés et analysés par chaque élève à
chaque ouverture, y compris pour un exercice de fractions qui n'en montre
aucun. En fichier, un dessin ne part au navigateur que quand son exercice
s'ouvre, et la page a perdu 16 % de son poids d'un coup.

## Ajouter un dessin

1. Convertir l'image en **WebP** (un PNG pour un schéma à traits fins, comme le
   bilan des ensembles), détourée et recadrée, de l'ordre de 10 à 25 Ko.
2. La nommer d'après l'**identifiant** de l'exercice (la clé de `TESTS`), en
   minuscules ASCII, sans accent : `python-input-duree.webp`. Un exercice qui
   a plusieurs dessins les suffixe (`python-pile-face-a.webp`,
   `python-input-duree-fatigue.webp`) ; un dessin réutilisé par un second
   exercice garde le nom de son premier propriétaire.
3. La référencer par son **chemin relatif** depuis la page, comme les autres :
   `const PXX_IMG='dessins/secondes/python-xxx.webp';` puis
   `<img src="'+PXX_IMG+'" alt="…" width="…" height="…">`. Les attributs
   `width` et `height` évitent que l'écran saute quand l'image arrive.

Aucun autre branchement : les contrôles qui suivent couvrent un dessin ajouté
demain sans rien déclarer.

**Un dessin modifié se renomme.** GitHub Pages garde une ressource en cache dix
minutes : remplacé sous le même nom, l'ancien dessin peut rester visible chez
un élève pendant ce temps, et `APP_VERSION` n'y change rien. Un nom nouveau
(`python-xxx-2.webp`) et la référence mise à jour règlent la question.

## Ce que les bancs vérifient

- `npm test` (jsdom, section 1, sur les trois niveaux) : **aucune image n'est
  embarquée en base64** dans la page ; **chaque dessin référencé existe** dans
  le dépôt ; **aucun fichier du dossier n'est orphelin**. jsdom ne charge pas
  les images — il ne peut vérifier que l'existence du fichier.
- `npm run test:navigateur` (Chromium, section 9, sur chaque exercice visité
  dans les deux modes) : **chaque dessin est réellement chargé**
  (`naturalWidth > 0`), parce qu'un fichier manquant ne s'affiche que comme un
  cadre vide portant son `alt`, et que rien d'autre ne le verrait.

Le profil du niveau (`tests/profils.js`, clé `dessins`) déclare le dossier :
c'est le bord opposé des deux contrôles — un niveau qui déclare des dessins
doit en offrir au banc, un niveau qui n'en déclare pas s'affiche « non
applicable » plutôt que d'être tu.

## Les dessins des sous-thèmes 6.1 et 6.2 « variables »

Trente dessins thématiques (un accessoire par exercice) et trente-neuf serpents
d'Halloween ont d'abord été dessinés en SVG, puis convertis en WebP (octobre
2026). Ils ont ensuite été remplacés (v562) par une planche générée par
Turquet : 46 serpents ordinaires (une émotion et un objet chacun) et 16 serpents
d'Halloween, découpés et détourés. Les dessins thématiques portent le suffixe
`-2.webp` ; les serpents d'Halloween gardent leur nom `<identifiant>-halloween.webp`,
que le banc exige. Seize déguisements pour trente-neuf exercices : chacun sert
deux ou trois fois, une fois dans le 6.1 et au plus deux fois dans le 6.2. Ils
ne demandent aucun code par exercice : la table `DESSINS_VAR` (le dessin
thématique, posé au-dessus de l'énoncé) et `HW_SERPENTS` (le serpent
d'Halloween, posé à côté du dessin de l'exercice) suffisent, `dessinsVariables()`
les pose après chaque rendu. Pour remplacer un dessin par un autre, il suffit
de déposer le nouveau fichier sous un **nouveau nom** et de mettre la table à
jour.
