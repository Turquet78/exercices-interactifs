/* ============================================================================
   MathLive en cache, pour le banc navigateur.
   ============================================================================
   Le banc sert MathLive depuis tests/.cache/ plutôt que depuis le CDN : sans
   lui, aucune case de calcul ne fonctionne, et le CDN n'est pas toujours
   joignable.

   LE FICHIER NE SE MONTRE QU'ENTIER. tests/tous-navigateur.js lance les trois
   niveaux EN MÊME TEMPS, et les trois lisent ce même fichier. Autrefois curl
   écrivait directement à sa place définitive : le fichier EXISTAIT dès le
   premier octet, si bien qu'un second banc, arrivé pendant le téléchargement,
   le croyait prêt et lisait un MathLive coupé en deux. La page levait alors
   « Unexpected token '}' » et <math-field> ne s'enregistrait pas — un rouge
   qui accusait la page alors que seul le banc était en faute (octobre 2026,
   au premier lancement sur un conteneur neuf ; jamais en CI, où chaque niveau
   a sa machine). Le téléchargement va donc dans un fichier temporaire PROPRE
   au processus, est vérifié, puis RENOMMÉ — un renommage est atomique : on
   voit l'ancien état ou le nouveau, jamais un fichier à moitié écrit.
   Et la lecture vérifie AUSSI que le fichier est entier (lireEntier) : un
   fichier coupé laissé par une version plus ancienne du banc ne doit pas être
   servi pour autant.

   tests/tous-navigateur.js appelle mathlive() UNE fois avant de lancer les
   trois niveaux : ils trouvent le cache prêt, et le téléchargement ne se fait
   pas trois fois. Le renommage atomique reste la vraie garde — il tient aussi
   deux `npm run test:navigateur:…` lancés à la main en même temps.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CACHE = path.join(__dirname, '.cache');
const ML_FICHIER = path.join(CACHE, 'mathlive-0.110.0.mjs');
const ML_URL = 'https://cdn.jsdelivr.net/npm/mathlive@0.110.0/mathlive.min.mjs';
const ML_MIN = 100000;                   /* en dessous, le paquet est coupé */

/* ENTIER veut dire : assez long, ET un module JavaScript qui se lit jusqu'au
   bout. La longueur seule ne suffisait pas — un fichier coupé au quart pèse
   déjà deux fois le seuil, et c'est ainsi qu'il passait. `node --check`
   relit la syntaxe sans rien exécuter ; l'extension .mjs lui dit que c'est un
   module. */
function lireEntier(fichier){
  try {
    const contenu = fs.readFileSync(fichier, 'utf8');
    if(contenu.length < ML_MIN) return null;
    execFileSync(process.execPath, ['--check', fichier], { stdio: 'pipe' });
    return contenu;
  } catch(e){ return null; }
}

function mathlive(){
  const deja = lireEntier(ML_FICHIER);
  if(deja) return deja;
  const temp = ML_FICHIER.replace(/\.mjs$/, '.' + process.pid + '.part.mjs');
  try {
    fs.mkdirSync(CACHE, { recursive: true });
    execFileSync('curl', ['-sfL', '--max-time', '120', '-o', temp, ML_URL], { stdio: 'pipe' });
    const contenu = lireEntier(temp);
    if(!contenu) throw new Error('paquet incomplet');
    fs.renameSync(temp, ML_FICHIER);
    return contenu;
  } catch(e){
    try { fs.unlinkSync(temp); } catch(e2){}
    return lireEntier(ML_FICHIER);       /* un banc voisin a pu le poser entre-temps */
  }
}

module.exports = { mathlive };
