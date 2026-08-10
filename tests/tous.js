/* ============================================================================
   Rejoue le banc sur les trois niveaux et rend un verdict d'ensemble.
       node tests/tous.js
   ============================================================================
   Les trois fichiers sont contrôlés jusqu'au bout, même si le premier échoue :
   savoir qu'un seul niveau est cassé n'aide pas si les deux autres n'ont pas
   été regardés. Sortie 1 dès qu'un niveau échoue.
   ========================================================================== */
const { spawnSync } = require('child_process');
const path = require('path');
const PROFILS = require('./profils');

const verifier = path.join(__dirname, 'verifier.js');
const resultats = Object.keys(PROFILS).map(fichier => {
  const r = spawnSync(process.execPath, [verifier, fichier], { stdio:'inherit' });
  return { fichier, ok: r.status === 0 };
});

console.log('\n' + '═'.repeat(58));
resultats.forEach(r => console.log((r.ok ? '✓ ' : '✗ ') + r.fichier));
const casses = resultats.filter(r => !r.ok);
console.log(casses.length === 0
  ? '\n✓ Les trois niveaux passent. Le site peut être mis en ligne.'
  : '\n✗ ' + casses.length + ' niveau(x) en échec. NE PAS mettre en ligne.');
process.exit(casses.length ? 1 : 0);
