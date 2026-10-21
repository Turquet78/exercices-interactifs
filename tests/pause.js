/* ============================================================================
   BANC DE LA PAUSE — une question corrigée ne se rejuge pas à la reprise
   ============================================================================
       node tests/pause.js <fichier.html>

   LE DÉFAUT QU'IL TIENT (octobre 2026, trouvé par l'inventaire du crédit
   partiel). Une question vérifiée puis mise en pause rouvrait DÉVERROUILLÉE :
   le brouillon ne rangeait pas le verrou, et captureBoxes rangeait aussi les
   corrections écrites par la page (classe sol), que restoreBoxes remettait
   dans les cases comme des saisies de l'élève. Une seconde vérification
   jugeait donc la correction de la page : une copie fausse devenait parfaite
   et la question comptait deux fois — 89 exercices en Seconde, 25 en
   Première, 9 en Terminale, en ligne. Et un enregistrement automatique
   différé insérait un SECOND brouillon après le retour au menu.

   CE QUE LE BANC FAIT, sur CHAQUE exercice du menu, en entraînement (en
   soutien, rien n'est poussé avant une copie juste) : le lancer par
   l'entonnoir d'un devoir posé en mémoire (deux questions), « Vérifier » sur
   une copie vide — un « 0 » dans chaque case si la page la refuse —, puis le
   VRAI geste de l'élève : pauseTest(), l'écran des modes du devoir, la
   reprise de l'entraînement. Exigé : aucune réponse ni aucun point de plus ;
   la question passe à la suite (la suivante, ou l'écran de fin) — ou, si elle
   reste à l'écran, un nouveau « Vérifier » n'y pousse rien ; et pendant la
   pause, au plus un brouillon inséré, aucun après le retour au menu.

   LES BORDS. Un exercice dont la copie ne se valide jamais n'atteint pas de
   question corrigée : il rougit s'il n'est pas déclaré (tests/profils.js,
   pauseReprise.horsAtteinte, raison comprise), et une déclaration qui ne sert plus
   rougit aussi. Le banc exige d'avoir mesuré : zéro question corrigée, c'est
   zéro mesure, et il le dit.

   AUCUN TEST NE TOUCHE LA VRAIE BASE : la page est ouverte par l'ouvrir() du
   banc navigateur, qui remplace supabase-js par le double en mémoire.

   NOTES_EXERCICES=id1,id2 restreint le banc (pour éprouver un sabotage) ;
   le verdict dit alors que ce n'est pas celui du niveau.
   Sortie 0 si tout passe, 1 sinon.
   ========================================================================== */
const { mathlive } = require('./mathlive-cache');
const { ouvrir, connecter, CIBLE, P } = require('./navigateur');

const DM = 'dm_controle_de_la_pause';
const DECLARES = ((P.pauseReprise || {}).horsAtteinte) || {};

let echecs = 0, controles = 0;
function verifier(intitule, condition, detail){
  controles++;
  if(condition){ console.log('   ✓ ' + intitule); }
  else { echecs++; console.log('   ✗ ' + intitule + (detail ? '  → ' + detail : '')); }
}

/* L'état de la séance, lu dans la page (« test » est un let de la page). */
const ETAT = () => {
  const r = document.getElementById('scr-results');
  const t = (typeof test !== 'undefined') ? test : {};
  return { n: (t.answers || []).length, score: t.score || 0, idx: t.idx || 0, locked: !!t.locked,
    fini: !!(r && r.classList.contains('on')), ecran: (document.querySelector('section.screen.on') || {}).id || '' };
};

/* Les écrans de départ (tables, calcul mental, niveaux, cours) — comme le
   banc des notes. */
const SAUT = () => {
  const on = document.querySelector('section.screen.on');
  if(!on) return false;
  const visible = e => { if(!e || e.hidden) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'; };
  const b = [...on.querySelectorAll('button')].filter(visible)
    .find(x => !x.disabled && /^(Commencer|Démarrer|C'est parti|Niveau 1|J’ai compris|Type 1\b)/.test(x.textContent.trim()));
  if(b){ b.click(); return true; }
  const r = [...on.querySelectorAll('button')].filter(visible)
    .find(x => !x.disabled && /exemple/i.test(x.textContent) && /^▶/.test(x.textContent.trim()));
  if(r){ r.click(); return true; }
  return false;
};

/* « Vérifier » — bouchon 1 : un « 0 » dans chaque case vide ; bouchon 2 : en
   plus, une phrase dans les rédactions. */
const VERIFIER = ({ bouchon }) => {
  const on = document.querySelector('section.screen.on');
  if(!on) return false;
  const visible = e => {
    if(!e || e.hidden || e.disabled) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
  };
  const txt = b => (b.textContent || '').replace(/\s+/g, ' ').trim();
  const v = [...on.querySelectorAll('button')].filter(visible).find(b => /^(Vérifier|Valider|Corriger)\b/.test(txt(b)));   /* « Vérifier cette ligne » compris */
  if(!v) return false;
  if(bouchon >= 1){
    on.querySelectorAll('input').forEach(i => { if(visible(i) && /^(text|number|)$/.test(i.type || '') && !String(i.value || '').trim()){ i.value = '0'; i.dispatchEvent(new Event('input', { bubbles: true })); } });
    on.querySelectorAll('select').forEach(s => { if(visible(s) && !s.value && s.options.length > 1){ s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    on.querySelectorAll('math-field').forEach(m => { if(visible(m) && !String(m.value || '').trim()){ try{ m.value = '0'; m.dispatchEvent(new Event('input', { bubbles: true })); }catch(e){} } });
    on.querySelectorAll('textarea').forEach(t => { if(visible(t) && !String(t.value || '').trim()){ t.value = '0'; t.dispatchEvent(new Event('input', { bubbles: true })); } });
  }
  if(bouchon >= 3){
    /* une proposition à choisir (« a) 8 % », « Une augmentation », une
       colonne…) : le premier bouton de l'écran qui n'est ni une commande ni
       une aide */
    const COMMANDE = /^(Vérifier|Valider|Corriger|Revérifier|Pause|Abandonner|Recommencer|Question suivante|Voir mes résultats|⌨|☰|✖|💬|,|−|-|▶|Aide|Rappel|Conseil|Exemple)/i;
    const choix = [...on.querySelectorAll('button')].filter(visible).find(b => { const t = txt(b); return t && t.length < 60 && !COMMANDE.test(t); });
    if(choix) choix.click();
    /* une colonne à colorier, une case à cocher : dans chaque groupe d'au moins
       deux éléments cliquables frères (des segments), le premier */
    const groupes = new Map();
    on.querySelectorAll('[onclick]:not(input):not(select)').forEach(e => {
      if(!visible(e) || (e.tagName === 'BUTTON' && COMMANDE.test(txt(e)))) return;
      const p = e.parentElement; if(!groupes.has(p)) groupes.set(p, []); groupes.get(p).push(e); });
    groupes.forEach(g => { if(g.length >= 2 && g[0] !== choix) g[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); });   /* un segment SVG n'a pas de click() */
  }
  if(bouchon === 2 || bouchon >= 3){
    /* une rédaction refuse un « 0 » (moins de 5 à 12 caractères selon
       l'exercice) : une phrase dans chaque zone de texte, une ligne de calcul
       dans chaque ligne de feuille */
    on.querySelectorAll('textarea').forEach(t => { if(visible(t) && String(t.value || '').trim().length < 12){ t.value = 'Je ne sais pas encore répondre.'; t.dispatchEvent(new Event('input', { bubbles: true })); } });
    on.querySelectorAll('math-field').forEach(m => { if(visible(m) && String(m.value || '').trim().length < 12){ try{ m.value = '1000+1000=2000'; m.dispatchEvent(new Event('input', { bubbles: true })); }catch(e){} } });
  }
  v.click();
  return true;
};

/* Un geste qui n'est pas une vérification mais l'ouvre : « ▶ Exécuter » un
   programme Python, ou passer à la ligne / l'étape suivante d'une question
   vérifiée par morceaux (jamais « Question suivante » : la question n'est
   pas encore corrigée). */
const EXECUTER = () => {
  const on = document.querySelector('section.screen.on');
  if(!on) return false;
  const vis = x => !x.disabled && x.getClientRects().length;
  const t = x => (x.textContent || '').replace(/\s+/g, ' ').trim();
  const b = [...on.querySelectorAll('button')].find(x => vis(x) && /^▶\s*Exécuter/.test(t(x)))
    || [...on.querySelectorAll('button')].find(x => vis(x) && t(x).length < 40 && /(ligne|étape|partie) suivante|^Continuer|^Passer au/i.test(t(x)) && !/Question suivante/i.test(t(x)));
  if(b){ b.click(); return true; }
  return false;
};

/* Les brouillons insérés dans la table des résultats depuis la marque k. */
const BROUILLONS = ({ k, table }) => window.__faux.journal.slice(k)
  .filter(e => e.op === 'insert' && e.table === table && Array.isArray(e.lignes))
  .reduce((n, e) => n + e.lignes.filter(l => l.details && l.details.state === 'paused').length, 0);

/* LE TIRAGE EST FIXÉ, EXERCICE PAR EXERCICE. Certaines pages refusent de
   vérifier tant qu'une première réponse n'est pas juste (le nombre de racines
   du {signe-second-degre}) : le bouchon y tombe juste ou non selon la séance
   tirée, et le verdict du banc changeait d'une exécution à l'autre — atteint
   ici, « hors d'atteinte » dans l'action. Un banc dont le verdict dépend du
   hasard ne dit rien, dans un sens comme dans l'autre (une déclaration
   deviendrait « morte » au tirage suivant). Math.random est donc remplacé, le
   temps de l'exercice, par un générateur à graine (mulberry32) dont la graine
   est l'identifiant de l'exercice : la même séance ici et dans l'action. Le
   double de Supabase numérote ses lignes avec un compteur, pas au hasard. */
function graine(id){ let h = 2166136261; for(const c of id){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const SEMER = g => {
  let a = g >>> 0;
  Math.random = function(){ a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};

async function mener(page, id){
  await page.evaluate(SEMER, graine(id));
  const lance = await page.evaluate(async a => {
    try{ await lancerDevoirExo(a.DM, a.id, 'train'); return ''; }
    catch(e){ return 'démarrage : ' + (e && e.message || e); }
  }, { id, DM });
  if(lance) return { raison: lance };
  await page.waitForTimeout(250);
  for(let hop = 0; hop < 3; hop++){
    if(!await page.evaluate(SAUT)) break;
    await page.waitForTimeout(400);
  }
  /* une question corrigée : verrouillée, et une réponse ou un point de plus */
  const e0 = await page.evaluate(ETAT);
  let corrige = null;
  /* jusqu'à douze gestes : une vérification ligne par ligne (« Vérifier cette
     ligne ») en demande plusieurs, et le bouchon monte d'un cran à chaque
     refus (des zéros, une phrase, une proposition) */
  for(let essai = 0; essai < 16 && !corrige; essai++){
    if(await page.evaluate(EXECUTER)){ await page.waitForTimeout(900); }
    if(!await page.evaluate(VERIFIER, { bouchon: Math.min(essai, 3) })){
      if(!await page.evaluate(EXECUTER)) break;
      await page.waitForTimeout(900);
      continue;
    }
    await page.waitForTimeout(700);
    const e = await page.evaluate(ETAT);
    if(e.locked && !e.fini && (e.n > e0.n || e.score > e0.score)){ corrige = e; corrige.bouchon = Math.min(essai, 3); }
    if(e.fini) return { raison: 'la séance s\'est close dès la première vérification' };
  }
  if(!corrige) return { raison: 'aucune question corrigée : la copie ne se valide pas, même remplie de zéros' };
  /* LA PAUSE — le vrai geste — puis l'attente d'un enregistrement différé */
  const k1 = await page.evaluate(() => window.__faux.journal.length);
  await page.evaluate(async () => { await pauseTest(); });
  const k2 = await page.evaluate(() => window.__faux.journal.length);
  await page.waitForTimeout(1500);
  const pendant = await page.evaluate(BROUILLONS, { k: k1, table: P.tableResultats });
  const apres = await page.evaluate(BROUILLONS, { k: k2, table: P.tableResultats });
  /* LA REPRISE — l'écran des modes du devoir, puis « Reprendre » */
  const repris = await page.evaluate(async a => {
    const ecran = window.openTestDevoirModes || window.openTestDevoir;
    if(typeof ecran !== 'function') return 'pas d\'écran des modes d\'un devoir';
    await ecran(a.DM, a.id);
    if(!pausedRows || !pausedRows.train) return 'la pause n\'a laissé aucun brouillon à reprendre';
    await resumeTest('train');
    return '';
  }, { id, DM });
  if(repris) return { raison: 'reprise : ' + repris, mesure: true, corrige, pendant, apres };
  await page.waitForTimeout(600);
  let e2 = await page.evaluate(ETAT);
  const toast = await page.evaluate(() => ((document.getElementById('toast') || {}).textContent || ''));
  let issue;
  if(e2.fini || e2.idx !== corrige.idx) issue = 'suite';
  else if(!e2.locked) issue = 'rouverte';   /* la question corrigée rouvre déverrouillée : c'est le défaut lui-même */
  else {
    /* restée à l'écran, verrouillée : l'élève revérifie avec la copie qui
       l'avait validée — rien ne doit partir. (Revérifier une copie VIDE ne
       prouvait rien : une page qui refuse le vide l'aurait refusée de toute
       façon — relecture d'octobre 2026.) */
    const avant = e2;
    await page.evaluate(VERIFIER, { bouchon: corrige.bouchon });
    await page.waitForTimeout(700);
    e2 = await page.evaluate(ETAT);
    issue = (e2.n === avant.n && e2.score === avant.score) ? 'sur place' : 'rejugée';
  }
  return { mesure: true, corrige, e2, issue, toast, pendant, apres };
}

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch(e){ console.error('Playwright est absent : npm install'); process.exit(2); }
  console.log('Banc de la pause — ' + CIBLE + '  (' + P.niveau + ')');
  console.log('\nUNE QUESTION CORRIGÉE NE SE REJUGE PAS À LA REPRISE');
  const s = await ouvrir(chromium, mathlive());
  const ecran = await connecter(s.page);
  if(ecran !== 'scr-space'){
    verifier('l\'élève d\'essai se connecte', false, 'écran atteint : ' + ecran);
    process.exit(1);
  }
  const tous = await s.page.evaluate(() => Object.keys(TEST_NUM));
  const seuls = (process.env.NOTES_EXERCICES || '').split(',').map(x => x.trim()).filter(Boolean);
  const ids = seuls.length ? tous.filter(x => seuls.includes(x)) : tous;
  if(seuls.length) console.log('   (restreint par NOTES_EXERCICES à ' + ids.length + ' exercice(s) : ce n\'est PAS le verdict du niveau)');
  await s.page.evaluate(a => { mesDevoirs = [{ id: a.DM, genre: 'dm', actif: true, num: 98, titre: 'Contrôle de la pause',
    exercices: a.ids.map(i => ({ id: i, nbQ: 2 })) }]; }, { DM, ids: tous });

  const bloques = [], mortes = [], rejugees = [], brouillons = [], reprises = [];
  let mesures = 0, suites = 0, surPlace = 0, annonces = 0;
  const debut = Date.now();
  for(const id of ids){
    const num = await s.page.evaluate(x => TEST_NUM[x], id);
    let r;
    try{ r = await Promise.race([mener(s.page, id), new Promise(z => setTimeout(() => z({ raison: 'plus de 30 s' }), 30000))]); }
    catch(e){ r = { raison: 'erreur du banc : ' + e.message }; }
    if(r.mesure){
      if(DECLARES[id]) mortes.push(num + ' ' + id + ' (déclaré : « ' + DECLARES[id] + ' »)');
      if(r.pendant > 1 || r.apres > 0) brouillons.push(num + ' ' + id + ' — ' + r.pendant + ' brouillon(s) inséré(s) pendant la pause, ' + r.apres + ' après le retour au menu');
    }
    if(r.raison && !r.issue){
      if(r.mesure) reprises.push(num + ' ' + id + ' — ' + r.raison);
      else if(!DECLARES[id]) bloques.push(num + ' ' + id + ' — ' + r.raison);
    } else if(r.issue){
      mesures++;
      if(r.issue === 'suite'){ suites++; if(/déjà corrigée/.test(r.toast)) annonces++; }
      else if(r.issue === 'sur place') surPlace++;
      if(r.issue === 'rejugée' || r.issue === 'rouverte' || r.e2.n !== r.corrige.n || r.e2.score !== r.corrige.score)
        rejugees.push(num + ' ' + id + ' — ' + r.corrige.n + ' réponse(s), ' + r.corrige.score + ' point(s) à la pause ; '
          + r.e2.n + ' et ' + r.e2.score + ' après la reprise'
          + (r.issue === 'rejugée' ? ', la question rouverte s\'est rejugée' : r.issue === 'rouverte' ? ', la question corrigée a rouvert déverrouillée' : ''));
    }
    await s.page.evaluate(() => { try{ clearTimeout(test.fbTimer); clearTimeout(test.qTimer); show('space'); }catch(e){} });
  }
  /* ---- LA MINUTERIE NE SURVIT PAS À LA REPRISE (relecture d'octobre 2026) ----
     Avec un temps par question, la reprise d'une question corrigée lançait
     DEUX chaînes de minuterie ; l'orpheline, que la pause ne coupait pas,
     validait seule les questions suivantes et finissait la séance — une note
     posée même après un abandon. Le geste de l'élève : valider, « Pause »
     pendant la correction, reprendre, « Pause » aussitôt, puis attendre plus
     longtemps que le temps par question. Rien ne doit bouger. */
  const MIN = (P.pauseReprise || {}).minuterie;
  let minuterie = null;
  /* l'exercice existe dans TESTS (les dérivées chronométrées de la Terminale
     ne sont plus au menu, mais leur minuterie est celle du calcul mental) */
  if(MIN && await s.page.evaluate(x => !!(typeof TESTS !== 'undefined' && TESTS[x]), MIN)){
    await s.page.evaluate(SEMER, graine(MIN));
    const k0 = await s.page.evaluate(() => window.__faux.journal.length);
    minuterie = await s.page.evaluate(async a => {
      await lancerDevoirExo(a.DM, a.id, 'train');
      return '';
    }, { DM, id: MIN });
    await s.page.waitForTimeout(300);
    for(let hop = 0; hop < 3; hop++){ if(!await s.page.evaluate(SAUT)) break; await s.page.waitForTimeout(400); }
    minuterie = await s.page.evaluate(async a => {
      if(typeof cfg === 'undefined' || !cfg) return 'pas de réglage cfg';
      cfg.secondsPerQuestion = 2;
      if(typeof renderQuestion === 'function') renderQuestion();   /* la question en cours, avec sa minuterie */
      await new Promise(r => setTimeout(r, 300));
      if(typeof submitAnswer !== 'function') return 'pas de submitAnswer';
      submitAnswer();                                               /* une réponse vide, validée */
      await new Promise(r => setTimeout(r, 150));
      if(!test.locked) return 'la question ne s\'est pas verrouillée';
      await pauseTest();                                            /* pendant le délai de correction */
      const ecran = window.openTestDevoirModes || window.openTestDevoir;
      await ecran(a.DM, a.id);
      if(!pausedRows || !pausedRows.train) return 'aucun brouillon à reprendre';
      await resumeTest('train');
      await new Promise(r => setTimeout(r, 200));
      const n = test.answers.length;
      await pauseTest();                                            /* aussitôt, sur la question suivante */
      await new Promise(r => setTimeout(r, 2000 + 3500));           /* plus que le temps par question */
      const fin = document.getElementById('scr-results');
      const finales = window.__faux.journal.slice(a.k0).filter(e => e.op === 'insert' && e.table === a.table && Array.isArray(e.lignes))
        .reduce((x, e) => x + e.lignes.filter(l => l.details && !l.details.state && !l.details.partiel).length, 0);
      return (test.answers.length !== n ? (test.answers.length - n) + ' réponse(s) poussée(s) après la pause ; ' : '')
        + (finales ? finales + ' note(s) finale(s) posée(s) après la pause ; ' : '')
        + (fin && fin.classList.contains('on') ? 'l\'écran des résultats a remplacé le menu' : '');
    }, { DM, id: MIN, k0, table: P.tableResultats });
    await s.page.evaluate(() => { try{ clearTimeout(test.fbTimer); clearTimeout(test.qTimer); show('space'); }catch(e){} });
  }

  /* ---- LA FIN D'UN NIVEAU DU PARCOURS (relecture d'octobre 2026) ----
     Une pause sur l'écran « Niveau N terminé » rouvrait la dernière question
     du niveau, déverrouillée : la suite du niveau réussi, goNextLevel, n'était
     pas reconnue. Le banc pose un niveau réussi (endLevel), met en pause,
     reprend : le niveau suivant, sans réponse ni niveau compté de plus. */
  const PARC = (P.pauseReprise || {}).parcours;
  let parcours = null;
  if(PARC && await s.page.evaluate(x => !!(typeof TESTS !== 'undefined' && TESTS[x]), PARC)){
    await s.page.evaluate(SEMER, graine(PARC));
    await s.page.evaluate(async a => { await lancerDevoirExo(a.DM, a.id, 'train'); }, { DM, id: PARC });
    await s.page.waitForTimeout(300);
    for(let hop = 0; hop < 3; hop++){ if(!await s.page.evaluate(SAUT)) break; await s.page.waitForTimeout(400); }
    parcours = await s.page.evaluate(async a => {
      if(typeof endLevel !== 'function' || !Array.isArray(test.levels)) return 'pas de parcours en niveaux';
      if(test.levels.length < 2) return 'un seul niveau';
      test.levelScore = test.passNeeded; test.idx = test.questions.length - 1; test.locked = true;
      endLevel();
      const l0 = test.levelIdx, n0 = test.answers.length, r0 = test.results.length;
      await pauseTest();
      const ecran = window.openTestDevoirModes || window.openTestDevoir;
      await ecran(a.DM, a.id);
      if(!pausedRows || !pausedRows.train) return 'aucun brouillon à reprendre';
      await resumeTest('train');
      await new Promise(r => setTimeout(r, 500));
      const pb = [];
      if(test.levelIdx !== l0 + 1) pb.push('la reprise rouvre le niveau ' + (test.levelIdx + 1) + ' au lieu du niveau ' + (l0 + 2));
      if(test.answers.length !== n0) pb.push((test.answers.length - n0) + ' réponse(s) de plus');
      if(test.results.length !== r0) pb.push('le niveau compté ' + (test.results.length - r0 + 1) + ' fois');
      return pb.join(' ; ');
    }, { DM, id: PARC });
    await s.page.evaluate(() => { try{ show('space'); }catch(e){} });
  }

  const duree = Math.round((Date.now() - debut) / 1000);
  console.log('   (' + mesures + ' question(s) corrigée(s) mises en pause sur ' + ids.length + ' exercice(s) : '
    + suites + ' passée(s) à la suite, dont ' + annonces + ' annoncée(s), ' + surPlace + ' restée(s) verrouillée(s) ; ' + duree + ' s)');

  verifier('chaque exercice du menu atteint une question corrigée, ou se déclare (pauseReprise.horsAtteinte)',
    bloques.length === 0, bloques.length + ' exercice(s) :\n        ' + bloques.join('\n        '));
  verifier('aucune déclaration morte : un exercice déclaré hors d\'atteinte n\'atteint pas de question corrigée',
    mortes.length === 0, mortes.join(' ; '));
  verifier('chaque déclaration (pauseReprise.horsAtteinte) désigne un exercice du menu',
    Object.keys(DECLARES).every(x => tous.includes(x)), Object.keys(DECLARES).filter(x => !tous.includes(x)).join(', '));
  verifier('le contrôle mesure : des questions corrigées ont été mises en pause',
    mesures > 0, 'aucune question corrigée : rien n\'a été mesuré');
  verifier('la reprise retrouve la séance mise en pause',
    reprises.length === 0, reprises.join('\n        '));
  verifier('une question corrigée puis mise en pause ne se rejuge pas à la reprise (ni réponse ni point de plus)',
    mesures > 0 && rejugees.length === 0, rejugees.length + ' exercice(s) :\n        ' + rejugees.join('\n        '));
  verifier('la reprise d\'une question corrigée qui passe à la suite le dit à l\'élève',
    annonces === suites, (suites - annonces) + ' reprise(s) sans le message « Question déjà corrigée »');
  if(minuterie === null) console.log('   ○ la minuterie ne survit pas à la reprise  — non applicable : ce niveau ne déclare pas d\'exercice à minuterie (pauseReprise.minuterie)');
  else verifier('la minuterie ne survit pas à la reprise : une pause après la reprise ne laisse rien tourner (' + MIN + ', 2 s par question)', minuterie === '', minuterie);
  if(parcours === null) console.log('   ○ la fin d\'un niveau du parcours passe au niveau suivant à la reprise  — non applicable : ce niveau ne déclare pas de parcours (pauseReprise.parcours)');
  else verifier('la fin d\'un niveau du parcours passe au niveau suivant à la reprise, sans rien recompter (' + PARC + ')', parcours === '', parcours);
  verifier('une pause n\'insère qu\'un brouillon, et aucun après le retour au menu',
    brouillons.length === 0, brouillons.join('\n        '));
  verifier('aucune erreur JavaScript pendant les séances', s.erreurs.length === 0, s.erreurs.slice(0, 5).join(' | '));
  await s.nav.close().catch(() => {});

  console.log('\n' + '─'.repeat(58));
  console.log(echecs === 0
    ? '✓ ' + controles + ' contrôles passés. Une question corrigée ne se rejuge pas à la reprise.'
    : '✗ ' + echecs + ' échec(s) sur ' + controles + ' contrôles. NE PAS mettre en ligne.');
  process.exit(echecs ? 1 : 0);
})();
