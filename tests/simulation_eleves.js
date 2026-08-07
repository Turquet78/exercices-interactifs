/* ============================================================================
   SIMULATION EN CONDITIONS RÉELLES — 5 élèves sur la VRAIE base Supabase.
   Vraie page (premiere-specifique.html), vrais parcours (inscription, connexion,
   exercices, pause/reprise), vraie base : les requêtes supabase.co du navigateur
   sont relayées par curl (proxy et certificat de l'environnement respectés).
   À la fin : vérification en base puis NETTOYAGE des seuls comptes créés ici.

   PRÉPARATION (une seule fois, depuis la racine du dépôt) :
     npm install --no-save playwright-core mathlive @supabase/supabase-js
   LANCEMENT :
     node tests/simulation_eleves.js             simulation puis nettoyage
     node tests/simulation_eleves.js --garder    conserve comptes et résultats
                                                 en base pour les consulter
     node tests/simulation_eleves.js --nettoyer  retire les comptes Test-* d'une
                                                 exécution --garder (obligatoire
                                                 avant de relancer la simulation :
                                                 un prénom déjà pris fait échouer
                                                 l'inscription)
   Nécessite un environnement dont la politique réseau autorise *.supabase.co
   (le script s'arrête proprement avec un message clair sinon).
   ========================================================================== */
const { chromium } = require('playwright-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const RACINE = path.join(__dirname, '..');
const PAGE = 'file://' + path.join(RACINE, 'premiere-specifique.html');

/* dépendances servies localement au navigateur (le CDN peut être fermé) */
function resoudre(candidats, nom){
  for(const c of candidats){
    const f=path.join(RACINE,'node_modules',c);
    if(fs.existsSync(f)) return f;
  }
  console.log('✗ Dépendance manquante : ' + nom + ' — lance : npm install --no-save playwright-core mathlive @supabase/supabase-js');
  process.exit(2);
}
const MATHLIVE = resoudre(['mathlive/mathlive.min.mjs'], 'mathlive');
const SUPA_UMD = resoudre(['@supabase/supabase-js/dist/umd/supabase.js'], '@supabase/supabase-js');
const FONTS = path.join(RACINE,'node_modules','mathlive','fonts');
const CHROME = (()=>{
  const base='/opt/pw-browsers';
  if(fs.existsSync(base)){
    const d=fs.readdirSync(base).find(x=>/^chromium-\d+$/.test(x));
    if(d) return path.join(base,d,'chrome-linux','chrome');
  }
  return undefined;          /* laisser playwright-core trouver son navigateur */
})();
const html = fs.readFileSync(path.join(RACINE, 'premiere-specifique.html'), 'utf8');
const SUPABASE_URL = html.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)/)[1];
const KEY = html.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)/)[1];

/* ---- relais curl : le navigateur ne sort jamais lui-même ---- */
function curlJSON(method, chemin, corps, entetes) {
  const args = ['-sS', '--max-time', '30', '-X', method,
    SUPABASE_URL + chemin,
    '-H', 'apikey: ' + KEY, '-H', 'Authorization: Bearer ' + KEY,
    '-H', 'Content-Type: application/json',
    '-w', '\n%{http_code}'];
  for (const [nom, v] of Object.entries(entetes || {})) args.push('-H', nom + ': ' + v);
  if (corps !== undefined) args.push('--data', JSON.stringify(corps));
  const brut = execFileSync('curl', args, { encoding: 'utf8' });
  const idx = brut.lastIndexOf('\n');
  return { status: Number(brut.slice(idx + 1)), body: brut.slice(0, idx) };
}

const GARDER = process.argv.includes('--garder');
const NETTOYER_SEUL = process.argv.includes('--nettoyer');

const ELEVES = [
  { prenom: 'Test-Lea',  pin: '1111', plan: 'pct-train-juste' },
  { prenom: 'Test-Tom',  pin: '2222', plan: 'mp-train-erreurs' },
  { prenom: 'Test-Zoe',  pin: '3333', plan: 'pctq-soutien' },
  { prenom: 'Test-Max',  pin: '4444', plan: 'pct-pause-reprise' },
  { prenom: 'Test-Eva',  pin: '5555', plan: 'pctq-eval-erreur' },
];

(async () => {
  /* 0. La base est-elle joignable ? */
  let ping;
  try { ping = curlJSON('GET', '/rest/v1/eleves_1ere?select=id&limit=1'); }
  catch (e) { ping = { status: 0, body: String(e.message).split('\n')[0] }; }
  if (ping.status !== 200) {
    console.log('✗ RÉSEAU FERMÉ : la base Supabase est injoignable depuis cet environnement.');
    console.log('  Réponse : HTTP ' + ping.status + ' — ' + ping.body.slice(0, 120));
    console.log('  → Ouvrir la politique réseau de l’environnement à *.supabase.co, puis relancer.');
    process.exit(2);
  }
  /* --nettoyer : retirer les comptes Test-* d'une exécution --garder, sans simuler */
  if (NETTOYER_SEUL) {
    console.log('✓ Base joignable. Retrait des comptes de test.\n');
    for (const e of ELEVES) {
      const rows = JSON.parse(curlJSON('GET', '/rest/v1/eleves_1ere?select=id&prenom=eq.' + encodeURIComponent(e.prenom)).body);
      for (const r of rows) {
        curlJSON('DELETE', '/rest/v1/resultats_1ere?eleve_id=eq.' + r.id);
        curlJSON('DELETE', '/rest/v1/eleves_1ere?id=eq.' + r.id);
        console.log('  ✓ ' + e.prenom + ' supprimé, résultats compris');
      }
      if (!rows.length) console.log('  · ' + e.prenom + ' : déjà absent');
    }
    const reste = JSON.parse(curlJSON('GET', '/rest/v1/eleves_1ere?select=id,prenom').body);
    console.log('\nComptes restants en base : ' + reste.length + ' → ' + reste.map(x => x.prenom).join(', '));
    process.exit(0);
  }

  console.log('✓ Base joignable (HTTP 200). Démarrage de la simulation.\n');

  /* garde-fou : on note les prénoms déjà présents pour ne JAMAIS y toucher */
  const avant = JSON.parse(curlJSON('GET', '/rest/v1/eleves_1ere?select=id,prenom').body);
  const dejaLa = new Set(avant.map(e => e.id));
  console.log('Comptes déjà en base avant simulation : ' + avant.length);

  const browser = await chromium.launch({
    ...(CHROME?{executablePath: CHROME}:{}),
    args: ['--no-sandbox']
  });

  const erreursJS = [];
  async function nouvellePage() {
    const p = await browser.newPage();
    p.on('pageerror', e => erreursJS.push(String(e)));
    await p.route('**/*', async route => {
      const u = route.request().url();
      if (u.startsWith('file://')) return route.continue();
      if (u.includes('mathlive')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(MATHLIVE, 'utf8') });
      if (u.includes('/fonts/')) {
        const f = path.join(FONTS, u.split('/fonts/')[1].split('?')[0]);
        if (fs.existsSync(f)) return route.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(f) });
        return route.fulfill({ status: 404, body: '' });
      }
      if (u.includes('cdn.jsdelivr.net') && u.includes('supabase')) {
        return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(SUPA_UMD, 'utf8') });
      }
      if (u.startsWith(SUPABASE_URL)) {
        /* relais réel : méthode, chemin, corps et en-têtes PostgREST transmis.
           Accept est indispensable : .single() n'obtient un objet que par lui */
        const req = route.request();
        const chemin = u.slice(SUPABASE_URL.length);
        const tous = await req.allHeaders();
        const entetes = {};
        for (const nom of ['accept', 'prefer', 'range', 'content-profile', 'accept-profile']) {
          if (tous[nom]) entetes[nom] = tous[nom];
        }
        const corps = req.postData();
        try {
          const r = curlJSON(req.method(), chemin, corps === null ? undefined : JSON.parse(corps), entetes);
          return route.fulfill({ status: r.status, contentType: 'application/json', body: r.body || '[]' });
        } catch (e) {
          return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ message: String(e.message) }) });
        }
      }
      return route.fulfill({ status: 404, body: '' });
    });
    await p.goto(PAGE);
    await p.waitForTimeout(1200);
    return p;
  }

  const dit = (nom, cond, det) => console.log((cond ? '  ✓ ' : '  ✗ ') + nom + (cond || !det ? '' : '  → ' + det));
  const crees = [];   /* ids créés ici — seuls candidats au nettoyage */

  /* ---------- helpers de jeu, exécutés DANS la page ---------- */
  /* après un clic « suivant », attendre que la question change ou que l'écran se
     ferme : la clôture insère en base (~1 s via le relais) avant de basculer
     l'écran, et recliquer le bouton resté affiché rejouerait la clôture —
     l'appli n'a pas de garde-fou de réentrance, chaque clic ferait un doublon */
  async function attendreTransition(page, ecran, idxAvant) {
    try {
      await page.waitForFunction(([ecran, idxAvant]) =>
        !document.getElementById(ecran).classList.contains('on') || test.idx !== idxAvant,
        [ecran, idxAvant], { timeout: 15000, polling: 200 });
    } catch (e) { /* la boucle constatera l'état au tour suivant */ }
  }
  const JOUER = {
    /* remplit et valide l'exercice 2.1 (pourcentage) jusqu'au bout ou jusqu'à nStop questions */
    pct: async (page, { faux = false, nStop = 99 } = {}) => {
      for (let k = 0; k < nStop; k++) {
        const fini = await page.evaluate(() => !document.getElementById('scr-ptest').classList.contains('on'));
        if (fini) break;
        const idx = await page.evaluate(() => test.idx);
        await page.evaluate((faux) => {
          const q = test.questions[test.idx];
          document.getElementById('p1n').value = String(q.P);
          document.getElementById('p1d').value = '100';
          document.getElementById('p2n').value = String(q.prod);
          document.getElementById('p2d').value = '100';
          document.getElementById('p3').value = faux ? String(q.result + 1) : String(q.result);
          document.querySelector('#pActions button').click();
        }, faux && k === 0);           /* au plus la première question fausse */
        await page.waitForTimeout(250);
        const next = await page.$('#pNext');
        if (next) { await page.evaluate(() => document.getElementById('pNext').click()); await attendreTransition(page, 'scr-ptest', idx); }
        else break;                     /* mode soutien : boucle de correction */
      }
    },
    mp: async (page, { fauxPremiere = true } = {}) => {
      for (let k = 0; k < 99; k++) {
        const fini = await page.evaluate(() => !document.getElementById('scr-mtest').classList.contains('on'));
        if (fini) break;
        const idx = await page.evaluate(() => test.idx);
        await page.evaluate((faux) => {
          document.querySelectorAll('#mpHost .mp-box').forEach((b, i) => {
            const exp = b.dataset.exp;
            b.value = (faux && i === 0) ? String((Number(exp) + 1) % 10) : exp;
          });
          document.querySelector('#mpActions button').click();
        }, fauxPremiere && k === 0);
        /* attendre le bouton plutôt qu'un délai fixe : 250 ms ont déjà manqué */
        await page.waitForSelector('#mpNext', { timeout: 3000 }).catch(() => {});
        const next = await page.$('#mpNext');
        if (next) { await page.evaluate(() => document.getElementById('mpNext').click()); await attendreTransition(page, 'scr-mtest', idx); }
      }
    },
    pctq: async (page, { mauvaisChoix = false } = {}) => {
      for (let k = 0; k < 99; k++) {
        const fini = await page.evaluate(() => !document.getElementById('scr-qtest').classList.contains('on'));
        if (fini) break;
        const idx = await page.evaluate(() => test.idx);
        await page.evaluate((mauvais) => {
          const q = test.questions[test.idx];
          const choix = mauvais ? (q.bon + 1) % 4 : q.bon;
          const btn = document.getElementById('qc' + choix); if (btn) btn.click();
        }, mauvaisChoix && k === 0);
        await page.waitForTimeout(200);
        await page.evaluate(() => {
          const q = test.questions[test.idx];
          const c = qdCouple(q), prod = c.P * c.N;
          document.getElementById('q1n').value = String(c.P);
          document.getElementById('q1d').value = '100';
          document.getElementById('q2n').value = String(prod);
          document.getElementById('q2d').value = '100';
          document.getElementById('q3').value = String(prod / 100).replace('.', ',');
          document.querySelector('#qActions button').click();
        });
        await page.waitForTimeout(250);
        /* soutien + mauvaise proposition : l'appli rouvre le choix — deuxième tour correct */
        const encore = await page.evaluate(() => {
          const n = document.getElementById('qNext'); if (n) { n.click(); return false; }
          return document.getElementById('scr-qtest').classList.contains('on');
        });
        if (!encore) { await attendreTransition(page, 'scr-qtest', idx); continue; }
        await page.waitForTimeout(350);
      }
    },
  };

  /* ---------- les cinq élèves ---------- */
  for (const e of ELEVES) {
    console.log('\n— ' + e.prenom + ' (' + e.plan + ')');
    const page = await nouvellePage();
    /* un incident chez un élève ne doit ni arrêter les suivants ni sauter le
       nettoyage final : un arrêt brutal ici laisserait la base sale */
    try {

    /* inscription par le vrai formulaire */
    await page.evaluate(() => { show('login'); loginMode('cr'); });
    await page.fill('#newPrenom', e.prenom);
    await page.fill('#newPin', e.pin);
    await page.fill('#newPin2', e.pin);
    await page.evaluate(() => creerCompte());
    await page.waitForTimeout(900);
    const inscrit = await page.evaluate(() => currentEleve && currentEleve.prenom);
    dit('inscription et ouverture de l’espace', inscrit === e.prenom, String(inscrit));
    if (inscrit !== e.prenom) { await page.close(); continue; }
    const id = await page.evaluate(() => currentEleve.id);
    crees.push({ id, prenom: e.prenom });

    /* poser currentTestId comme le fait openTest() : pauseTest() et les rappels
       en dépendent — sans lui, le brouillon de pause part avec test: null */
    if (e.plan === 'pct-train-juste') {
      await page.evaluate(() => { currentTestId = 'pourcentage'; currentMode = 'train'; TESTS['pourcentage'].start(); });
      await page.waitForTimeout(600);
      await JOUER.pct(page, {});
    } else if (e.plan === 'mp-train-erreurs') {
      await page.evaluate(() => { currentTestId = 'multiplication-posee'; currentMode = 'train'; TESTS['multiplication-posee'].start(); });
      await page.waitForTimeout(600);
      await JOUER.mp(page, { fauxPremiere: true });
    } else if (e.plan === 'pctq-soutien') {
      await page.evaluate(() => { currentTestId = 'pourcentage-taux'; currentMode = 'soutien'; TESTS['pourcentage-taux'].start(); });
      await page.waitForTimeout(600);
      await JOUER.pctq(page, {});
    } else if (e.plan === 'pct-pause-reprise') {
      await page.evaluate(() => { currentTestId = 'pourcentage'; currentMode = 'train'; TESTS['pourcentage'].start(); });
      await page.waitForTimeout(600);
      await JOUER.pct(page, { nStop: 2 });                    /* 2 questions puis pause */
      await page.evaluate(() => pauseTest());
      await page.waitForTimeout(900);
      /* déconnexion puis vraie reconnexion par prénom + code */
      await page.evaluate(() => { currentEleve = null; show('login'); renderLoginNames(); });
      /* la liste des prénoms arrive de la base : attendre la pastille du bon
         prénom plutôt qu'un délai fixe — le délai a déjà trahi une fois */
      await page.waitForFunction((prenom) =>
        [...document.querySelectorAll('#nameChips .chip')].some(c => c.textContent === prenom),
        e.prenom, { timeout: 15000, polling: 200 });
      await page.evaluate((prenom) => {
        [...document.querySelectorAll('#nameChips .chip')].find(c => c.textContent === prenom).click();
      }, e.prenom);
      await page.fill('#loginPin', e.pin);
      await page.evaluate(() => connexionEleve());
      await page.waitForTimeout(900);
      const relog = await page.evaluate(() => currentEleve && currentEleve.prenom);
      dit('reconnexion par prénom + code', relog === e.prenom, String(relog));
      /* vrai parcours de reprise : openTest() recharge les brouillons depuis la
         base et propose la carte « Reprendre », qui appelle resumeTest() */
      await page.evaluate(() => openTest('pourcentage'));
      await page.waitForTimeout(600);
      const carte = await page.evaluate(() => !!(pausedRows && pausedRows.train));
      dit('brouillon retrouvé — carte « Reprendre » proposée', carte);
      await page.evaluate(() => resumeTest('train'));
      await page.waitForTimeout(900);
      const repris = await page.evaluate(() => test.idx);
      dit('reprise à la question ' + (repris + 1) + ' (attendu ≥ 2)', repris >= 1, String(repris));
      await JOUER.pct(page, {});
    } else if (e.plan === 'pctq-eval-erreur') {
      await page.evaluate(() => { currentTestId = 'pourcentage-depart'; currentMode = 'eval'; TESTS['pourcentage-depart'].start(); });
      await page.waitForTimeout(600);
      await JOUER.pctq(page, { mauvaisChoix: true });
    }

    const resultats = await page.evaluate(() => document.getElementById('scr-results').classList.contains('on'));
    dit('écran de résultats atteint', resultats);

    } catch (err) {
      console.log('  ✗ incident de simulation — parcours interrompu : ' + String(err.message || err).split('\n')[0]);
    }
    await page.close();
  }

  /* ---------- vérification en base ---------- */
  console.log('\n══ VÉRIFICATION EN BASE (vraie base Supabase) ══');
  const ids = crees.map(c => '"' + c.id + '"').join(',');
  const el = JSON.parse(curlJSON('GET', '/rest/v1/eleves_1ere?select=id,prenom&id=in.(' + crees.map(c => c.id).join(',') + ')').body);
  console.log('Comptes créés en base : ' + el.length + '/5 → ' + el.map(x => x.prenom).join(', '));
  const res = JSON.parse(curlJSON('GET', '/rest/v1/resultats_1ere?select=eleve_id,score,total,percent,details&eleve_id=in.(' + crees.map(c => c.id).join(',') + ')').body);
  const parEleve = {};
  res.forEach(r => {
    const p = (crees.find(c => c.id === r.eleve_id) || {}).prenom || '?';
    const d = r.details || {};
    (parEleve[p] = parEleve[p] || []).push(`${d.test} [${d.mode || '?'}] ${r.score}/${r.total} (${r.percent} %)${d.state === 'paused' ? ' — BROUILLON RESTANT' : ''}`);
  });
  Object.keys(parEleve).forEach(p => console.log('  ' + p + ' : ' + parEleve[p].join(' | ')));
  const brouillons = res.filter(r => r.details && r.details.state === 'paused').length;
  console.log('Brouillons de pause restants (attendu 0, nettoyés à la fin des tests) : ' + brouillons);

  /* ---------- nettoyage : UNIQUEMENT les ids créés par cette simulation ---------- */
  console.log('\n══ NETTOYAGE ══');
  if (GARDER) {
    console.log('--garder : comptes et résultats de test CONSERVÉS en base pour consultation.');
    console.log('Tant qu\'ils y restent, les prénoms Test-* apparaissent sur l\'écran de');
    console.log('connexion du site et l\'inscription de la prochaine simulation échouerait.');
    console.log('Les retirer : node tests/simulation_eleves.js --nettoyer');
  } else {
    for (const c of crees) {
      if (dejaLa.has(c.id)) { console.log('  ⚠ ' + c.prenom + ' existait avant : non touché'); continue; }
      curlJSON('DELETE', '/rest/v1/resultats_1ere?eleve_id=eq.' + c.id);
      curlJSON('DELETE', '/rest/v1/eleves_1ere?id=eq.' + c.id);
    }
    const verif = JSON.parse(curlJSON('GET', '/rest/v1/eleves_1ere?select=id&id=in.(' + crees.map(c => c.id).join(',') + ')').body);
    const verifR = JSON.parse(curlJSON('GET', '/rest/v1/resultats_1ere?select=id&eleve_id=in.(' + crees.map(c => c.id).join(',') + ')').body);
    const apres = JSON.parse(curlJSON('GET', '/rest/v1/eleves_1ere?select=id').body);
    /* comparer avant/après fait partie du verdict : une inscription passée
       inaperçue (crees vide) ne doit plus produire un « base propre » à tort */
    const propre = verif.length + verifR.length === 0 && apres.length === avant.length;
    console.log('Comptes de test restants : ' + verif.length + ' | résultats de test restants : ' + verifR.length);
    console.log('Comptes en base après simulation : ' + apres.length + ' (avant : ' + avant.length + ')' + (propre ? '  → base propre ✓' : '  → NETTOYAGE INCOMPLET ✗ — supprimer à la main les comptes Test-*'));
  }

  console.log('\nErreurs JavaScript pendant toute la simulation : ' + (erreursJS.length === 0 ? 'aucune ✓' : erreursJS.join(' | ')));
  await browser.close();
})();
