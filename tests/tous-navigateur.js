/* ============================================================================
   Ouvre les trois niveaux dans un vrai navigateur, l'un après l'autre.
       node tests/tous-navigateur.js
   ============================================================================
   Les trois sont menés jusqu'au bout même si le premier échoue : savoir qu'un
   niveau est cassé n'aide pas si les deux autres n'ont pas été regardés.
   Sortie 1 dès qu'un niveau échoue.
   ========================================================================== */
const { spawnSync } = require('child_process');
const path = require('path');
const PROFILS = require('./profils');

const banc = path.join(__dirname, 'navigateur.js');
const resultats = Object.keys(PROFILS).filter(f => PROFILS[f].navigateur).map(fichier => {
  const r = spawnSync(process.execPath, [banc, fichier], { stdio: 'inherit' });
  return { fichier, ok: r.status === 0 };
});

console.log('\n' + '═'.repeat(58));
resultats.forEach(r => console.log((r.ok ? '✓ ' : '✗ ') + r.fichier));
const casses = resultats.filter(r => !r.ok);
console.log(casses.length === 0
  ? '\n✓ Les trois niveaux se comportent bien dans un vrai navigateur.'
  : '\n✗ ' + casses.length + ' niveau(x) en échec. NE PAS mettre en ligne.');
process.exit(casses.length ? 1 : 0);
