#!/usr/bin/env node
/* ============================================================================
   LES DEUX FONCTIONS EDGE, CONTRÔLÉES JUSQU'AU BOUT
   ============================================================================
   `npm run test:fonction` joue les bancs de admin-eleve (tests/fonction-edge.js)
   et de corriger-definition (tests/fonction-ia.js). Enchaînés par « && », un
   banc rouge empêchait le second de tourner : on ne savait plus rien de l'aide
   IA dès que l'administration des comptes rougissait (relecture d'octobre
   2026). C'est le principe de tests/tous.js : chaque banc va au bout, sa sortie
   est imprimée en entier, et le lanceur échoue si l'UN d'eux échoue.
   ========================================================================== */
const { spawnSync } = require('child_process');
const path = require('path');

const BANCS = ['fonction-edge.js', 'fonction-ia.js'];
const rouges = [];
for(const b of BANCS){
  const r = spawnSync(process.execPath, ['--experimental-strip-types', path.join(__dirname, b)],
                      { stdio: 'inherit' });
  if(r.status !== 0) rouges.push(b + (r.signal ? ' (' + r.signal + ')' : ''));
}
console.log('\n══════════════════════════════════════════════════════════');
if(rouges.length){
  console.log('✗ ' + rouges.length + ' banc(s) de fonction Edge en échec : ' + rouges.join(', '));
  process.exit(1);
}
console.log('✓ Les deux fonctions Edge passent leurs bancs.');
