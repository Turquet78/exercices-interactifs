/* ============================================================================
   BANC DES NOTES — la note enregistrée est celle qui s'affiche
   ============================================================================
       node tests/notes.js <fichier.html>

   CLAUDE.md la rangeait parmi les règles « qui ne se vérifient pas encore
   partout » : le contrôle des cases justes compare ce que la page PEINT, il ne
   relit pas ce qui part en base. Ce banc la tient PARTOUT : chaque exercice du
   menu, mené jusqu'à son écran de fin, et la ligne que la page insère dans la
   table des résultats comparée, nombre à nombre, à ce que l'élève lit.

   COMMENT UN EXERCICE EST MENÉ À SA FIN SANS QUE LE BANC SACHE Y RÉPONDRE.
   Il est lancé par l'entonnoir de production d'un devoir (lancerDevoirExo),
   dans un devoir que le banc pose en mémoire, réglé à DEUX questions : la
   coupe de la page raccourcit la séance là où elle sait le faire, et la note
   porte l'étiquette du devoir. Puis, question par question, « Vérifier » sur
   une copie VIDE — en entraînement, une copie vide se valide, se corrige, et
   ouvre « Question suivante » —, jusqu'au bouton « Voir mes résultats ».
   Juste avant ce dernier clic, le banc rend la séance NON TRIVIALE : la
   première réponse juste, la dernière à 2 cases justes sur 7 (crédit
   partiel), le score AJUSTÉ d'autant — jamais réécrit : un exercice qui
   compte ses cases dans test.score doit garder son unité —, et le mode de
   la fin tourné entre
   entraînement, soutien et évaluation, d'un exercice à l'autre. Une note 0/N
   partout ne mesurerait rien : les arrondis ne mordent que sur des fractions.
   Là où une copie vide ne se valide pas (une colonne à colorier, une
   rédaction, une table au clavier contre la montre), le banc appelle
   lui-même la fonction de fin de l'exercice sur la même séance synthétique
   — « la fin directe », plus bas.

   CE QUI EST COMPARÉ, pour chaque exercice : exactement UNE note finale en
   base (ni brouillon ni note de pause) ; son étiquette (exercice, mode,
   devoir) ; un pourcentage entier entre 0 et 100 ; le score affiché
   (#resultScore) égal à la note de la ligne — details.note quand la page en
   pose une (crédit partiel), le score sinon — et à son total ; la note
   affichée (#resultPct), en pourcentage (« 65 % ») ou sur 10 (« 6,4 / 10 »),
   égale à ce que tout autre écran relira de la ligne : percent, ou
   percent / 10 ; et en soutien, la note que le devoir en tirera —
   percent × plafond / 100, sur 10 (noteDevoirExo, plafondSoutien).

   LE CRÉDIT PARTIEL COMPTE (décision de Turquet, octobre 2026 : la note
   finale compte ce que chaque question montre sur 1). La séance synthétique
   vaut 1 + 2/7 de point ; là où une question vaut un point (total = nombre
   de questions), la note enregistrée doit valoir 1,29 — pas 1. Un exercice
   où une réponse n'a pas de cases à compter se dispense, raison comprise
   (notes.sansCreditPartiel), et une dispense qui compte quand même rougit.

   LES DEUX BORDS. Un exercice qui n'atteint pas sa fin le dit, et rougit s'il
   n'est pas DÉCLARÉ (tests/profils.js, notes.horsAtteinte, raison comprise) ;
   un exercice déclaré qui atteint sa fin rougit aussi — la déclaration est
   morte. Et le contrôle exige des notes non triviales : s'il n'en mesure
   aucune, il ne mesure rien, et le dit.

   AUCUN TEST NE TOUCHE LA VRAIE BASE : la page est ouverte par l'ouvrir() du
   banc navigateur (tests/navigateur.js), qui remplace supabase-js par le
   double en mémoire et coupe toute requête vers le projet.

   Sortie 0 si tout passe, 1 sinon.
   ========================================================================== */
const { mathlive } = require('./mathlive-cache');
const { ouvrir, connecter, CIBLE, P } = require('./navigateur');

const DM = 'dm_controle_des_notes';
/* Le plafond du soutien que le devoir du banc règle : ni le défaut (5), ni le
   maximum (10) — sans quoi « ignorer le réglage » et « le lire » se
   confondraient. noteDevoirExo() en tirera percent × 7 / 100. */
const PLAFOND = 7;
const MODES = ['train', 'soutien', 'eval'];
const DECLARES = ((P.notes || {}).horsAtteinte) || {};

let echecs = 0, controles = 0;
function verifier(intitule, condition, detail){
  controles++;
  if(condition){ console.log('   ✓ ' + intitule); }
  else { echecs++; console.log('   ✗ ' + intitule + (detail ? '  → ' + detail : '')); }
}

/* Une étape de séance, jouée DANS la page : le geste suivant que ferait un
   élève pressé. Rend ce qui a été fait. */
const ETAPE = ({ modeFin, bouchon }) => {
  const res = document.getElementById('scr-results');
  if(res && res.classList.contains('on')) return 'fini';
  const on = document.querySelector('section.screen.on');
  if(!on) return 'aucun écran';
  const visible = e => {
    if(!e || e.hidden || e.disabled) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
  };
  const txt = b => (b.textContent || '').replace(/\s+/g, ' ').trim();
  const boutons = [...on.querySelectorAll('button')].filter(visible);
  const fin = boutons.find(b => /^Voir mes r[ée]sultats/.test(txt(b)));
  if(fin){
    /* LA SÉANCE NON TRIVIALE : première réponse juste, dernière à 2 cases
       sur 7 ; le score suit. Seuls les champs que lisent les fins sont
       touchés : correct, pts, cases, justes, et test.score. */
    /* « test » est un let de la page : il n'est PAS une propriété de window */
    const seance = (typeof test !== 'undefined') ? test : null;
    const ans = (seance && seance.answers) || [];
    /* le score est AJUSTÉ, jamais réécrit : un exercice qui compte ses
       cases dans test.score (une étude de fonction, 102 cases) doit garder
       son unité, sans quoi le banc masquerait ce qu'il cherche */
    let delta = 0;
    if(ans.length >= 1){ if(!ans[0].correct) delta++; ans[0].correct = true; delete ans[0].pts; }
    if(ans.length >= 2){ const a = ans[ans.length - 1]; if(a.correct) delta--; a.correct = false; a.pts = 2 / 7; a.cases = 7; a.justes = 2; }
    if(seance && ans.length) seance.score = Math.max(0, (seance.score || 0) + delta);
    /* ce que la note DOIT valoir si le crédit partiel compte : 1 + 2/7 */
    window.__notesBanc = (ans.length >= 2 && seance.questions && seance.questions.length === ans.length)
      ? { n: ans.length, attendu: 1 + 2 / 7 } : null;
    currentMode = modeFin;
    fin.click();
    return 'résultats';
  }
  const suivant = boutons.find(b => txt(b).length < 40 && /\bsuivante?\b/i.test(txt(b)));
  if(suivant){ suivant.click(); return 'suivant'; }
  const verifier = boutons.find(b => /^(Vérifier|Valider|Corriger)\b/.test(txt(b)));
  if(verifier){
    if(bouchon){
      /* une copie vide refusée sans verrou : un « 0 » dans chaque case vide,
         la première option de chaque liste, puis on revérifie */
      on.querySelectorAll('input').forEach(i => { if(visible(i) && /^(text|number|)$/.test(i.type || '') && !String(i.value || '').trim()){ i.value = '0'; i.dispatchEvent(new Event('input', { bubbles: true })); } });
      on.querySelectorAll('select').forEach(s => { if(visible(s) && !s.value && s.options.length > 1){ s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); } });
      on.querySelectorAll('math-field').forEach(m => { if(visible(m) && !String(m.value || '').trim()){ try{ m.value = '0'; m.dispatchEvent(new Event('input', { bubbles: true })); }catch(e){} } });
      on.querySelectorAll('textarea').forEach(t => { if(visible(t) && !String(t.value || '').trim()){ t.value = '0'; t.dispatchEvent(new Event('input', { bubbles: true })); } });
    }
    verifier.click();
    return 'vérifier';
  }
  return 'rien';
};

/* Les écrans de départ (tables, calcul mental, niveaux, cours d'un exercice
   Python) : franchis comme le fait la visite de la section 9 du banc
   navigateur. */
const SAUT = () => {
  const on = document.querySelector('section.screen.on');
  if(!on) return false;
  const visible = e => { if(!e || e.hidden) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'; };
  const b = [...on.querySelectorAll('button')].filter(visible)
    .find(x => !x.disabled && /^(Commencer|Démarrer|C'est parti|Niveau 1|J’ai compris)/.test(x.textContent.trim()));
  if(b){ b.click(); return true; }
  const r = [...on.querySelectorAll('button')].filter(visible)
    .find(x => !x.disabled && /exemple/i.test(x.textContent) && /^▶/.test(x.textContent.trim()));
  if(r){ r.click(); return true; }
  return false;
};

/* LA FIN DIRECTE. Une copie vide n'atteint pas toujours la fin : une
   rédaction refuse d'être vérifiée vide (« Écris ta justification d'abord »),
   un tableau de signes veut ses cases, une colonne veut être coloriée, une
   table de multiplication se joue au clavier contre la montre. Là, le banc
   appelle lui-même la fonction de fin de l'exercice, sur une séance
   synthétique de la longueur du tirage : la comparaison base / écran porte
   alors sur le même code que si l'élève avait fini, et l'exercice est compté
   à part (« par la fin directe »).
   QUELLE fonction de fin : celle que le profil nomme pour cet exercice
   (notes.finDe, rangé par fonction) ; sinon la SEULE fonction finish…() de la
   page qui écrit l'identifiant de l'exercice en toutes lettres ; sinon celle
   du niveau (notes.finDirecte — la Terminale n'en a qu'une, finishTest ; la
   Seconde range sous currentTestId tout exercice sans fin à lui). Une fin
   mal choisie ne passe pas inaperçue : elle range la note sous un autre
   identifiant, et le juge le dit. */
const FIN_DIRECTE = ({ id, declaree, defaut, modeFin }) => {
  let fin = declaree;
  if(!fin){
    const lit = Object.keys(window).filter(k => /^(finish\w*|tmFinir)$/.test(k) && typeof window[k] === 'function'
      && window[k].toString().includes("'" + id + "'"));
    fin = lit.length === 1 ? lit[0] : defaut;
  }
  if(!fin) return 'pas de fin directe pour cet exercice';
  if(typeof window[fin] !== 'function') return 'pas de fonction ' + fin + ' dans la page';
  if(typeof test === 'undefined' || !Array.isArray(test.questions) || !test.questions.length) return 'pas de séance ouverte';
  const n = test.questions.length;
  test.answers = (test.answers || []).slice(0, n);
  while(test.answers.length < n) test.answers.push({ q: '(banc des notes)', given: '', answer: '', correct: false });
  let delta = 0;   /* ajusté, jamais réécrit : voir ETAPE */
  if(!test.answers[0].correct) delta++;
  test.answers[0].correct = true; delete test.answers[0].pts;
  if(n >= 2){ const a = test.answers[n - 1]; if(a.correct) delta--; a.correct = false; a.pts = 2 / 7; a.cases = 7; a.justes = 2; }
  test.score = Math.max(0, (test.score || 0) + delta);
  window.__notesBanc = n >= 2 ? { n, attendu: 1 + 2 / 7 } : null;
  test.idx = n - 1; test.locked = true;
  currentMode = modeFin;
  window[fin]();
  return '';
};

async function mener(page, id, modeFin){
  const lance = await page.evaluate(async a => {
    try{ await lancerDevoirExo(a.DM, a.id, 'train'); return ''; }
    catch(e){ return 'démarrage : ' + (e && e.message || e); }
  }, { id, DM });
  if(lance) return lance;
  await page.waitForTimeout(250);
  for(let hop = 0; hop < 3; hop++){
    if(!await page.evaluate(SAUT)) break;
    await page.waitForTimeout(500);
  }
  let precedent = '', repete = 0, bouchon = false, rien = 0;
  for(let tour = 0; tour < 40; tour++){
    const fait = await page.evaluate(ETAPE, { modeFin, bouchon });
    if(fait === 'fini') return '';
    if(fait === 'résultats'){
      try{ await page.waitForFunction(() => { const r = document.getElementById('scr-results'); return r && r.classList.contains('on'); }, null, { timeout: 4000 }); return ''; }
      catch(e){ return 'clic sur « Voir mes résultats » sans écran de fin'; }
    }
    if(fait === 'rien' || fait === 'aucun écran'){
      if(++rien > 8) return 'bloqué : aucun bouton à cliquer (' + fait + ')';
      await page.waitForTimeout(400);
      continue;
    }
    rien = 0;
    repete = (fait === precedent && fait === 'vérifier') ? repete + 1 : 0;
    precedent = fait;
    if(repete >= 1 && !bouchon){ bouchon = true; }
    else if(repete >= 3) return 'bloqué : la copie ne se valide pas, même remplie de zéros';
    await page.waitForTimeout(fait === 'vérifier' ? 450 : 300);
  }
  return 'bloqué : 40 gestes sans atteindre la fin';
}

/* Ce que l'écran de fin affiche, et ce que la page a inséré depuis le repère. */
const LIRE = ({ k, table }) => {
  const lignes = window.__faux.journal.slice(k)
    .filter(e => e.op === 'insert' && e.table === table)
    .flatMap(e => e.lignes || [])
    .filter(l => l && l.details && !l.details.state && !l.details.partiel);
  const t = id => ((document.getElementById(id) || {}).textContent || '').replace(/\s+/g, ' ').trim();
  return { lignes: JSON.parse(JSON.stringify(lignes)), score: t('resultScore'), pct: t('resultPct'), banc: window.__notesBanc || null };
};

const nombre = s => parseFloat(String(s).replace(',', '.').replace('−', '-'));

function juger(id, modeFin, lu, plafond){
  if(lu.lignes.length !== 1) return lu.lignes.length + ' note(s) finale(s) en base au lieu d\'une';
  const l = lu.lignes[0], d = l.details || {};
  if(d.test !== id) return 'la note est rangée sous « ' + d.test + ' »';
  if(d.mode !== modeFin) return 'mode « ' + d.mode + ' » en base, « ' + modeFin + ' » à la fin';
  if(d.dm !== DM) return 'étiquette de devoir « ' + d.dm + ' » au lieu de « ' + DM + ' »';
  if(!(Number.isInteger(l.total) && l.total > 0)) return 'total ' + l.total;
  if(!(Number.isInteger(l.percent) && l.percent >= 0 && l.percent <= 100)) return 'pourcentage ' + l.percent + ' en base';
  if(!(l.score >= 0 && l.score <= l.total)) return 'score ' + l.score + ' sur ' + l.total + ' en base';
  /* le score affiché : la note de la ligne (crédit partiel) ou son score */
  const note = (typeof d.note === 'number') ? d.note : l.score;
  const m = /^([−\-\d.,]+) \/ (\d+)$/.exec(lu.score);
  if(!m) return 'score affiché illisible : « ' + lu.score + ' »';
  if(parseInt(m[2], 10) !== l.total) return 'total affiché ' + m[2] + ', ' + l.total + ' en base';
  if(Math.abs(nombre(m[1]) - note) > 0.05 + 1e-9) return 'score affiché « ' + lu.score + ' », note ' + note + ' en base';
  /* le pourcentage de la ligne et la note qu'elle porte disent la même chose */
  const ecart = Math.abs(l.percent - note / l.total * 100);
  if(ecart > (Number.isInteger(note) ? 0.5 : 1) + 1e-9) return 'pourcentage ' + l.percent + ' en base pour une note de ' + note + ' / ' + l.total;
  /* la note affichée : en pourcentage, ou sur 10 — et en soutien, la note
     que noteDevoirExo() en tirera : percent × plafond / 100, sur 10 */
  const sur10 = /^([−\-\d.,]+) \/ 10$/.exec(lu.pct), enPct = /^(\d+) %$/.exec(lu.pct);
  if(modeFin === 'soutien'){
    const attendu = l.percent / 100 * plafond;
    if(!sur10) return 'en soutien, l\'écran affiche « ' + lu.pct + ' » au lieu de la note plafonnée ('
      + String(Math.round(attendu * 10) / 10).replace('.', ',') + ' / 10, plafond ' + plafond + ')';
    if(Math.abs(nombre(sur10[1]) - attendu) > 0.05 + 1e-6)
      return 'en soutien, l\'écran affiche « ' + lu.pct + ' », la note de soutien vaudra '
        + String(Math.round(attendu * 100) / 100).replace('.', ',') + ' / 10 (percent ' + l.percent + ', plafond ' + plafond + ')';
  } else if(sur10){
    const attendu = Math.round(l.percent) / 10;
    if(Math.abs(nombre(sur10[1]) - attendu) > 1e-9)
      return 'l\'écran affiche « ' + lu.pct + ' », la base relira ' + String(attendu).replace('.', ',') + ' / 10 (percent ' + l.percent + ')';
  } else if(enPct){
    if(parseInt(enPct[1], 10) !== l.percent) return 'l\'écran affiche « ' + lu.pct + ' », ' + l.percent + ' % en base';
  } else return 'note affichée illisible : « ' + lu.pct + ' »';
  return '';
}

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch(e){ console.error('Playwright est absent : npm install'); process.exit(2); }
  console.log('Banc des notes — ' + CIBLE + '  (' + P.niveau + ')');
  console.log('\nLA NOTE ENREGISTRÉE EST CELLE QUI S\'AFFICHE');
  const ml = mathlive();
  const s = await ouvrir(chromium, ml);
  const ecran = await connecter(s.page);
  if(ecran !== 'scr-space'){
    verifier('l\'élève d\'essai se connecte', false, 'écran atteint : ' + ecran);
    process.exit(1);
  }
  const tous = await s.page.evaluate(() => Object.keys(TEST_NUM));
  /* NOTES_EXERCICES=id1,id2 : ne mener que ceux-là — pour éprouver un
     sabotage en deux minutes au lieu de sept. Le verdict le dit. */
  const seuls = (process.env.NOTES_EXERCICES || '').split(',').map(x => x.trim()).filter(Boolean);
  const ids = seuls.length ? tous.filter(x => seuls.includes(x)) : tous;
  if(seuls.length) console.log('   (restreint par NOTES_EXERCICES à ' + ids.length + ' exercice(s) : ce n\'est PAS le verdict du niveau)');
  /* le devoir du banc, en mémoire : deux questions par exercice, et un
     plafond de soutien RÉGLÉ (PLAFOND) — une page qui garderait le défaut de
     5 au lieu de lire le réglage du devoir se verrait */
  await s.page.evaluate(a => { mesDevoirs = [{ id: a.DM, genre: 'dm', actif: true, num: 99, titre: 'Contrôle des notes',
    exercices: a.ids.map(i => ({ id: i, nbQ: 2, smax: a.PLAFOND })) }]; }, { DM, ids, PLAFOND });
  const plafond = PLAFOND;

  const ecarts = [], bloques = [], mortes = [];
  let menes = 0, nonTriviaux = 0, directs = 0, partielsMesures = 0;
  const partielsManques = [], partielsMorts = [];
  /* notes.sansCreditPartiel : { exercice: 'raison' } — là où une réponse
     n'a pas de cases à compter (une table de multiplication est sue ou ne
     l'est pas) */
  const SANS_PARTIEL = (P.notes || {}).sansCreditPartiel || {};
  const FIN = (P.notes || {}).finDirecte || '';
  /* notes.finDe : { finishX: ['exercice', …] } — retourné en exercice → fin */
  const FIN_DE = {};
  Object.entries((P.notes || {}).finDe || {}).forEach(([f, l]) => l.forEach(x => { FIN_DE[x] = f; }));
  /* une déclaration (fin, dispense) qui nomme un exercice ABSENT du menu ne
     dispense rien : elle survit à un renommage sans que rien ne le dise */
  const finsMortes = [].concat(
    Object.keys(FIN_DE).filter(x => !tous.includes(x)).map(x => x + ' (finDe)'),
    Object.keys(DECLARES).filter(x => !tous.includes(x)).map(x => x + ' (horsAtteinte)'),
    Object.keys(SANS_PARTIEL).filter(x => !tous.includes(x)).map(x => x + ' (sansCreditPartiel)'));
  const debut = Date.now();
  for(let i = 0; i < ids.length; i++){
    const id = ids[i], modeFin = MODES[i % MODES.length];
    const num = await s.page.evaluate(x => TEST_NUM[x], id);
    const k = await s.page.evaluate(() => { window.__notesBanc = null; return window.__faux.journal.length; });
    let raison;
    try{ raison = await Promise.race([mener(s.page, id, modeFin), new Promise(r => setTimeout(() => r('bloqué : plus de 25 s'), 25000))]); }
    catch(e){ raison = 'erreur du banc : ' + e.message; }
    if(raison){
      const r2 = await s.page.evaluate(FIN_DIRECTE, { id, declaree: FIN_DE[id] || '', defaut: FIN, modeFin });
      if(!r2){
        try{ await s.page.waitForFunction(() => { const r = document.getElementById('scr-results'); return r && r.classList.contains('on'); }, null, { timeout: 4000 }); raison = ''; directs++; }
        catch(e){ raison += ' ; puis la fin directe n\'a pas ouvert l\'écran de fin'; }
      } else raison += ' ; ' + r2;
    }
    if(raison){
      if(!DECLARES[id]) bloques.push(num + ' ' + id + ' — ' + raison);
      await s.page.evaluate(() => { try{ show('space'); }catch(e){} });
      continue;
    }
    if(DECLARES[id]) mortes.push(num + ' ' + id + ' (déclaré : « ' + DECLARES[id] + ' »)');
    menes++;
    const lu = await s.page.evaluate(LIRE, { k, table: P.tableResultats });
    const e = juger(id, modeFin, lu, plafond);
    if(e) ecarts.push(num + ' ' + id + ' (' + modeFin + ') — ' + e);
    if(lu.lignes.length === 1 && lu.lignes[0].percent > 0 && lu.lignes[0].percent < 100) nonTriviaux++;
    /* LE CRÉDIT PARTIEL COMPTE : la séance synthétique vaut 1 + 2/7 là où
       une question vaut un point (total = nombre de questions) */
    if(lu.banc && lu.lignes.length === 1 && lu.lignes[0].total === lu.banc.n){
      const l = lu.lignes[0], d = l.details || {};
      const note = (typeof d.note === 'number') ? d.note : l.score;
      const compte = Math.abs(note - lu.banc.attendu) <= 0.01;
      if(SANS_PARTIEL[id]){ if(compte) partielsMorts.push(num + ' ' + id); }
      else {
        partielsMesures++;
        if(!compte) partielsManques.push(num + ' ' + id + ' (' + modeFin + ') — note ' + String(note).replace('.', ',') + ' / ' + l.total
          + ', le crédit partiel vaudrait ' + String(Math.round(lu.banc.attendu * 100) / 100).replace('.', ','));
      }
    }
    await s.page.evaluate(() => { try{ show('space'); }catch(e){} });
  }
  const duree = Math.round((Date.now() - debut) / 1000);
  console.log('   (' + menes + ' exercice(s) menés à la note sur ' + ids.length + (directs ? ', dont ' + directs + ' par la fin directe' : '')
    + ', ' + nonTriviaux + ' note(s) non triviale(s), crédit partiel mesuré sur ' + partielsMesures + ', ' + duree + ' s)');

  verifier('chaque exercice du menu atteint son écran de fin, ou se déclare (notes.horsAtteinte)',
    bloques.length === 0, bloques.length + ' exercice(s) :\n        ' + bloques.join('\n        '));
  verifier('aucune déclaration morte : un exercice déclaré hors d\'atteinte n\'atteint pas sa fin',
    mortes.length === 0, mortes.join(' ; '));
  verifier('chaque déclaration du profil (notes.finDe, horsAtteinte, sansCreditPartiel) désigne un exercice du menu',
    finsMortes.length === 0, finsMortes.join(', '));
  verifier('le contrôle mesure des notes non triviales (ni 0 ni 100 %)',
    nonTriviaux > 0 && nonTriviaux >= Math.floor(menes / 2), nonTriviaux + ' non triviale(s) sur ' + menes + ' note(s)');
  verifier('la note enregistrée est celle qui s\'affiche, sur chaque exercice mené à sa fin',
    menes > 0 && ecarts.length === 0, menes ? ecarts.length + ' écart(s) :\n        ' + ecarts.join('\n        ') : 'aucun exercice mené : rien n\'a été mesuré');
  verifier('le crédit partiel d\'une question compte dans la note finale (2 cases justes sur 7 valent 2/7 de point)',
    partielsMesures > 0 && partielsManques.length === 0,
    partielsMesures ? partielsManques.length + ' exercice(s) :\n        ' + partielsManques.join('\n        ') : 'aucune note mesurée : rien n\'a été vérifié');
  verifier('aucune dispense morte : un exercice dispensé du crédit partiel ne le compte pas',
    partielsMorts.length === 0, partielsMorts.join(', '));
  verifier('aucune erreur JavaScript pendant les séances', s.erreurs.length === 0, s.erreurs.slice(0, 5).join(' | '));
  await s.nav.close().catch(() => {});

  console.log('\n' + '─'.repeat(58));
  console.log(echecs === 0
    ? '✓ ' + controles + ' contrôles passés. Les notes enregistrées sont celles qui s\'affichent.'
    : '✗ ' + echecs + ' échec(s) sur ' + controles + ' contrôles. NE PAS mettre en ligne.');
  process.exit(echecs ? 1 : 0);
})();
