/* ============================================================================
   Rejoue le banc sur les trois niveaux et rend un verdict d'ensemble.
       node tests/tous.js
   ============================================================================
   Les trois fichiers sont contrôlés jusqu'au bout, même si le premier échoue :
   savoir qu'un seul niveau est cassé n'aide pas si les deux autres n'ont pas
   été regardés. Sortie 1 dès qu'un niveau échoue.

   LES TROIS NIVEAUX DE FRONT (octobre 2026). Ils s'enchaînaient, exprès :
   deux bancs lancés en même temps se prenaient leurs fichiers temporaires
   ctrl<i>.js l'un à l'autre (journal 17, « Deux bancs jsdom ne se lancent pas
   EN MÊME TEMPS »). Depuis que chaque processus écrit dans son propre dossier
   temporaire (verifier.js, section 1), rien n'est partagé, et l'attente
   tombe de la SOMME des trois bancs au plus long d'entre eux — la Seconde.
   Chaque niveau tourne dans son propre processus, comme avant.

   LA SORTIE EST GARDÉE PUIS RECRACHÉE DANS L'ORDRE, comme pour le banc
   navigateur : trois bancs qui écrivent en même temps sur le même terminal
   entrelacent leurs lignes, et un rapport illisible est un rapport qu'on
   cesse de lire — c'est ainsi qu'un rouge se fait manquer. On capture donc
   chaque niveau, et on l'affiche entier quand tous ont fini, dans l'ordre des
   profils. Pour suivre un seul niveau en direct : npm run test:secondes.
   ========================================================================== */
const { spawn } = require('child_process');
const path = require('path');
const PROFILS = require('./profils');

const verifier = path.join(__dirname, 'verifier.js');

function lancer(fichier){
  return new Promise(resolve => {
    let sortie = '';
    const p = spawn(process.execPath, [verifier, fichier]);
    p.stdout.on('data', d => { sortie += d; });
    p.stderr.on('data', d => { sortie += d; });
    p.on('close', code => resolve({ fichier, ok: code === 0, sortie }));
  });
}

(async () => {
  const resultats = await Promise.all(Object.keys(PROFILS).map(lancer));
  resultats.forEach(r => process.stdout.write(r.sortie));

  console.log('\n' + '═'.repeat(58));
  resultats.forEach(r => console.log((r.ok ? '✓ ' : '✗ ') + r.fichier));
  const casses = resultats.filter(r => !r.ok);
  console.log(casses.length === 0
    ? '\n✓ Les trois niveaux passent. Le site peut être mis en ligne.'
    : '\n✗ ' + casses.length + ' niveau(x) en échec. NE PAS mettre en ligne.');
  process.exit(casses.length ? 1 : 0);
})();
