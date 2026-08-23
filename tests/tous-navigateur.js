/* ============================================================================
   Ouvre les trois niveaux dans un vrai navigateur, EN PARALLÈLE.
       node tests/tous-navigateur.js
   ============================================================================
   Les trois sont menés jusqu'au bout même si l'un échoue : savoir qu'un niveau
   est cassé n'aide pas si les deux autres n'ont pas été regardés.
   Sortie 1 dès qu'un niveau échoue.

   POURQUOI EN PARALLÈLE. Chaque niveau prend environ trois minutes — il ouvre
   tous ses exercices dans un vrai Chromium, dans les deux modes. En série, ce
   banc faisait attendre une dizaine de minutes avant chaque mise en ligne, et
   c'est lui qui décide de la mise en ligne. Les trois niveaux sont
   indépendants : chacun ouvre SON fichier dans SON navigateur et ne partage
   rien avec les autres. Les mener de front ne retire donc aucun contrôle.

   LA SORTIE EST GARDÉE PUIS RECRACHÉE DANS L'ORDRE. Trois bancs qui écrivent
   en même temps sur le même terminal entrelacent leurs lignes, et un rapport
   illisible est un rapport qu'on cesse de lire — c'est ainsi qu'un rouge se
   fait manquer. On capture donc chaque niveau, et on l'affiche entier quand il
   a fini, l'un après l'autre.
   ========================================================================== */
const { spawn } = require('child_process');
const path = require('path');
const PROFILS = require('./profils');

const banc = path.join(__dirname, 'navigateur.js');
const fichiers = Object.keys(PROFILS).filter(f => PROFILS[f].navigateur);

function lancer(fichier){
  return new Promise(resolve => {
    let sortie = '';
    const p = spawn(process.execPath, [banc, fichier]);
    p.stdout.on('data', d => { sortie += d; });
    p.stderr.on('data', d => { sortie += d; });
    p.on('close', code => resolve({ fichier, ok: code === 0, sortie }));
  });
}

(async () => {
  const resultats = await Promise.all(fichiers.map(lancer));
  resultats.forEach(r => process.stdout.write(r.sortie));

  console.log('\n' + '═'.repeat(58));
  resultats.forEach(r => console.log((r.ok ? '✓ ' : '✗ ') + r.fichier));
  const casses = resultats.filter(r => !r.ok);
  console.log(casses.length === 0
    ? '\n✓ Les trois niveaux se comportent bien dans un vrai navigateur.'
    : '\n✗ ' + casses.length + ' niveau(x) en échec. NE PAS mettre en ligne.');
  process.exit(casses.length ? 1 : 0);
})();
