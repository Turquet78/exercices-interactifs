/* ============================================================================
   BANC DE LA SORTIE — « Sortie » remplace Pause et Abandonner, et la reprise
   demande « Continuer » ou « Recommencer »
   ============================================================================
       node tests/sortie.js <fichier.html>

   Le VRAI geste de l'élève, dans un vrai Chromium, sur l'exercice témoin du
   profil (P.navigateur.exercice) : la page des modes, « M'entraîner », une
   question à l'écran ; plus de « Pause » ni d'« Abandonner » ; le lien
   « Sortie » en haut à droite, cliqué : retour à la page des modes, la carte
   « Reprendre » ; cliquée : la boîte demande ; « Continuer » rouvre la séance
   gardée (mêmes questions) ; on ressort, « Recommencer » efface le brouillon
   et relance une séance neuve. La base est le double en mémoire.
   Sortie 0 si tout passe, 1 sinon.
   ========================================================================== */
const { mathlive } = require('./mathlive-cache');
const { ouvrir, connecter, CIBLE, P } = require('./navigateur');

let echecs = 0;
function verifier(intitule, condition, detail){
  if(condition) console.log('   ✓ ' + intitule);
  else { echecs++; console.log('   ✗ ' + intitule + (detail ? '  → ' + detail : '')); }
}
const ecran = page => page.evaluate(() => (document.querySelector('section.screen.on') || {}).id || '');
const brouillons = page => page.evaluate(t => (window.__faux && window.__faux.tables && window.__faux.tables[t] || [])
  .filter(r => r.details && r.details.state === 'paused').length, P.tableResultats);

(async () => {
  console.log('Banc de la sortie — ' + CIBLE + '  (' + P.niveau + ')');
  const { chromium } = require('playwright');
  for(const vp of [{ width: 1280, height: 900 }, { width: 390, height: 780 }]){
  console.log(' — fenêtre ' + vp.width + ' × ' + vp.height);
  const s = await ouvrir(chromium, mathlive(), { viewport: vp });
  const page = s.page;
  try{
    const espace = await connecter(page);
    verifier('l\'élève est connecté', espace === 'scr-space', espace);
    const id = P.navigateur.exercice;
    await page.evaluate(i => openTest(i), id);
    await page.waitForTimeout(400);
    verifier('hors exercice, « Sortie » ne se montre pas', await page.isHidden('#sortieLien'));
    await page.click('#modeChoices [onclick*="train"]');
    await page.waitForTimeout(800);
    const scr = await ecran(page);
    verifier('l\'exercice est ouvert', scr && scr !== 'scr-mode', scr);
    verifier('plus de bouton « Mettre en pause » ni « Abandonner »',
      await page.evaluate(() => !document.getElementById('pauseBtn') && !document.getElementById('abandonBtn')
        && ![...document.querySelectorAll('#testCtrls button')].some(b => /pause|abandon/i.test(b.textContent))));
    verifier('« Signaler » reste', await page.isVisible('#signalBtn'));
    const pos = await page.evaluate(() => { const r = document.getElementById('sortieLien').getBoundingClientRect();
      const m = document.querySelector('.mast').getBoundingClientRect();
      return { x: r.right, y: r.top, bord: m.right, t: document.getElementById('sortieLien').textContent }; });
    verifier('le lien « Sortie » est en haut à droite de la page', pos.y < 120 && Math.abs(pos.bord - pos.x) < 2 && /Sortie/.test(pos.t), JSON.stringify(pos));
    const q1 = await page.evaluate(() => JSON.stringify(test.questions));
    await page.click('#sortieLien');
    await page.waitForTimeout(900);
    verifier('« Sortie » ramène à la page précédente (les modes)', await ecran(page) === 'scr-mode', await ecran(page));
    verifier('l\'exercice est gardé (un brouillon)', await brouillons(page) === 1, String(await brouillons(page)));
    const carte = await page.$('#modeChoices .resume');
    verifier('la carte « Reprendre » est proposée', !!carte);
    if(carte){
      await carte.click(); await page.waitForTimeout(300);
      verifier('« Reprendre » demande : continuer ou recommencer', await page.isVisible('#choixReprise')
        && await page.isVisible('#crContinuer') && await page.isVisible('#crRecommencer'));
      verifier('…et l\'exercice ne s\'est pas encore rouvert', await ecran(page) === 'scr-mode');
      await page.click('#crContinuer'); await page.waitForTimeout(800);
      const s2 = await ecran(page);
      verifier('« Continuer » rouvre l\'exercice gardé, mêmes questions', s2 === scr
        && await page.evaluate(() => JSON.stringify(test.questions)) === q1, s2);
      await page.click('#sortieLien'); await page.waitForTimeout(900);
      verifier('ressorti : toujours un seul brouillon', await brouillons(page) === 1, String(await brouillons(page)));
      await page.click('#modeChoices .resume'); await page.waitForTimeout(300);
      await page.click('#crRecommencer'); await page.waitForTimeout(1200);
      const s3 = await ecran(page);
      verifier('« Recommencer » relance l\'exercice', s3 === scr, s3);
      verifier('…depuis le début', await page.evaluate(() => (test.idx || 0) === 0 && !(test.answers || []).length));
      verifier('…et l\'ancien brouillon est effacé', await brouillons(page) === 0, String(await brouillons(page)));
    }
    /* DANS UN DEVOIR : « Recommencer » repasse par la page des modes du devoir,
       et la séance neuve porte toujours le devoir */
    const DM = 'dm_controle_de_la_sortie';
    await page.evaluate(a => { mesDevoirs = [{ id: a.DM, genre: 'dm', actif: true, num: 97, titre: 'Contrôle de la sortie',
      exercices: [{ id: a.id, nbQ: 2, modes: ['train'] }] }]; }, { DM, id });
    await page.evaluate(a => openTestDevoir(a.DM, a.id), { DM, id });
    await page.waitForTimeout(600);
    await page.click('#modeChoices [onclick*="train"]'); await page.waitForTimeout(900);
    verifier('devoir : l\'exercice est ouvert, rattaché au devoir', await page.evaluate(d => currentDM === d, DM));
    await page.click('#sortieLien'); await page.waitForTimeout(900);
    verifier('devoir : « Sortie » ramène à la page des modes du devoir', await ecran(page) === 'scr-mode', await ecran(page));
    const avantD = await brouillons(page);
    await page.click('#modeChoices .resume'); await page.waitForTimeout(300);
    await page.click('#crRecommencer'); await page.waitForTimeout(1200);
    verifier('devoir : « Recommencer » relance l\'exercice dans le devoir, depuis le début',
      await ecran(page) !== 'scr-mode' && await page.evaluate(d => currentDM === d && (test.idx || 0) === 0 && !(test.answers || []).length, DM));
    verifier('devoir : le brouillon du devoir est effacé', await brouillons(page) === avantD - 1, avantD + ' → ' + await brouillons(page));
  }catch(e){ echecs++; console.log('   ✗ exception : ' + (e && e.stack || e)); }
  await s.nav.close().catch(()=>{});
  }
  console.log(echecs ? '\n✗ ' + echecs + ' échec(s)' : '\n✓ tout passe');
  process.exit(echecs ? 1 : 0);
})();
