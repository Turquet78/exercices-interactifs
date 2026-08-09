/* ============================================================================
   BANC NAVIGATEUR — la page est ouverte pour de vrai, et un exercice est fait
   ============================================================================
       node tests/navigateur.js <fichier.html>

   Le banc principal (tests/verifier.js) charge les pages dans jsdom : un DOM
   sans mise en page, sans MathLive, sans un pixel calculé. Il attrape beaucoup,
   mais pas ce qui ne se voit qu'à l'écran. Celui-ci ouvre un vrai Chromium,
   exécute le VRAI MathLive, connecte un élève en cliquant, fait l'exercice
   question par question et regarde ce qui s'affiche.

   Deux précautions valent d'être dites :

   1. AUCUN TEST NE TOUCHE LA VRAIE BASE. La requête vers supabase-js est
      interceptée et remplacée par tests/faux-supabase.js, qui tient les lignes
      en mémoire. Le projet Supabase des élèves n'est jamais contacté, et aucune
      note fantôme ne peut apparaître dans leur progression.

   2. MathLive est servi depuis une copie locale (tests/.cache/), téléchargée à
      la première exécution. Sans elle, l'élément <math-field> ne s'enregistre
      pas et les contrôles de rendu ne veulent rien dire : ils se déclarent alors
      « non applicable » au lieu de passer au vert sans rien vérifier.

   Sortie 0 si tout passe, 1 sinon.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PROFILS = require('./profils');

const RACINE = path.resolve(__dirname, '..');
const CACHE = path.join(__dirname, '.cache');
const ML_FICHIER = path.join(CACHE, 'mathlive-0.110.0.mjs');
const ML_URL = 'https://cdn.jsdelivr.net/npm/mathlive@0.110.0/mathlive.min.mjs';

const CIBLE = process.argv[2] || 'premiere-specifique.html';
const P = PROFILS[CIBLE];
if(!P || !P.navigateur){
  console.error('Aucun profil « navigateur » pour « ' + CIBLE + ' ». Voir tests/profils.js.');
  process.exit(2);
}

let echecs = 0, controles = 0, ignores = 0;
function verifier(intitule, condition, detail){
  controles++;
  if(condition){ console.log('   ✓ ' + intitule); }
  else { echecs++; console.log('   ✗ ' + intitule + (detail ? '  → ' + detail : '')); }
}
function ignorer(intitule, raison){
  ignores++;
  console.log('   ○ ' + intitule + '  — non applicable : ' + raison);
}
function titre(t){ console.log('\n' + t); }

/* ---------- Chromium ---------- */
function chercherChromium(){
  if(process.env.CHROMIUM) return process.env.CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dossier = fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
    if(dossier){
      const bin = path.join(base, dossier, 'chrome-linux', 'chrome');
      if(fs.existsSync(bin)) return bin;
    }
  } catch(e){}
  return undefined;                      /* Playwright cherchera son propre navigateur */
}

/* ---------- MathLive en cache ---------- */
function mathlive(){
  if(fs.existsSync(ML_FICHIER)) return fs.readFileSync(ML_FICHIER, 'utf8');
  try {
    fs.mkdirSync(CACHE, { recursive: true });
    execFileSync('curl', ['-sL', '--max-time', '120', '-o', ML_FICHIER, ML_URL], { stdio: 'pipe' });
    const contenu = fs.readFileSync(ML_FICHIER, 'utf8');
    if(contenu.length < 100000) throw new Error('paquet trop court');
    return contenu;
  } catch(e){
    try { fs.unlinkSync(ML_FICHIER); } catch(e2){}
    return null;
  }
}

/* ---------- ouverture d'une page ---------- */
async function ouvrir(chromium, ml, options){
  options = options || {};
  const nav = await chromium.launch({
    executablePath: chercherChromium(),
    proxy: (process.env.HTTPS_PROXY || process.env.https_proxy)
      ? { server: process.env.HTTPS_PROXY || process.env.https_proxy } : undefined,
  });
  const ctx = await nav.newContext({ ignoreHTTPSErrors: true, viewport: options.viewport || { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(String(e.message)));

  /* les polices distantes ne changent rien à ce qu'on vérifie, et le réseau des
     tests peut ne pas les servir : on coupe court plutôt que d'attendre */
  await page.route('**/fonts.googleapis.com/**', r => r.abort().catch(() => {}));
  await page.route('**/fonts.gstatic.com/**', r => r.abort().catch(() => {}));

  /* supabase-js remplacé par le double : la vraie base n'est jamais contactée */
  const faux = fs.readFileSync(path.join(__dirname, 'faux-supabase.js'), 'utf8');
  const eleve = { id: 'eleve-controle', prenom: 'Contrôle', pin: '1234' };
  await page.route('**/supabase-js**', r => r.fulfill({
    contentType: 'application/javascript',
    body: faux + '\nwindow.__faux.semer(' + JSON.stringify(P.tableEleves) + ',' + JSON.stringify([eleve]) + ');',
  }));

  /* MathLive servi depuis le cache ; les polices restent au réseau (elles ne
     changent pas l'ordre des éléments, seulement leur dessin) */
  if(ml){
    await page.route('**/mathlive@0.110.0**', r => {
      const url = r.request().url();
      if(/\.(woff2?|css|json)(\?|$)/.test(url) || /\/fonts\//.test(url)) return r.abort().catch(() => {});
      return r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: ml });
    });
    await page.route('**/esm.run/mathlive**', r =>
      r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: ml }));
  }

  await page.goto('file://' + path.join(RACINE, CIBLE), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(ml ? 3500 : 1500);
  return { nav, page, erreurs, eleve };
}

const ecranVisible = page => page.evaluate(() =>
  ([...document.querySelectorAll('section.screen')].find(s => s.classList.contains('on')) || {}).id || '(aucun)');

/* ---------- le parcours d'un élève ---------- */
async function connecter(page){
  await page.click('#scr-home button.choice.eleve');           /* « Je suis élève » */
  await page.waitForSelector('#nameChips .chip', { timeout: 15000 });
  await page.click('#nameChips .chip');                        /* son prénom */
  await page.fill('#loginPin', '1234');
  await page.click('#modeCo button.btn-primary');              /* « Entrer » */
  await page.waitForTimeout(500);
  return ecranVisible(page);
}

async function parcours(page, N){
  const espace = await connecter(page);

  await page.evaluate(id => openTest(id), N.exercice);        /* la page des modes de l'exercice */
  await page.waitForTimeout(400);
  await page.click('#modeChoices [onclick*="train"]');        /* « M’entraîner » */
  await page.waitForTimeout(600);

  let tours = 0;
  while(tours++ < 40){
    const fini = await page.evaluate(() =>
      document.getElementById('scr-results') && document.getElementById('scr-results').classList.contains('on'));
    if(fini) break;
    const pose = await page.evaluate(code => eval(code), N.repondre);
    if(!pose) break;
    await page.click(N.valider);
    if(N.suivant){
      await page.waitForSelector(N.suivant, { timeout: 4000 }).catch(() => {});
      await page.click(N.suivant).catch(() => {});
      await page.waitForTimeout(150);
    } else {
      await page.waitForTimeout(1800);                        /* le moteur enchaîne tout seul */
    }
  }
  return { espace, tours };
}

/* ---------- déroulement ---------- */
(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch(e){
    console.error('Playwright n\'est pas installé : npm install');
    process.exit(2);
  }
  const ml = mathlive();
  console.log('Navigateur réel — ' + CIBLE + '  (' + P.niveau + ')');
  const N = P.navigateur;

  /* ===== 1. la page s'ouvre ===== */
  titre('1. OUVERTURE DE LA PAGE');
  let s = await ouvrir(chromium, ml);
  try {
    const version = await s.page.evaluate(() => (typeof APP_VERSION !== 'undefined') ? APP_VERSION : null);
    verifier('la page s\'ouvre sans erreur JavaScript', s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
    verifier('le numéro de version s\'affiche', /^\d+$/.test(String(version)), 'APP_VERSION = ' + version);
    verifier('l\'élève arrive sur l\'accueil, pas sur l\'écran d\'installation',
      (await ecranVisible(s.page)) !== 'scr-setup',
      'écran affiché : ' + (await ecranVisible(s.page)));

    /* ===== 2. MathLive, pour de vrai ===== */
    titre('2. RENDU MATHÉMATIQUE');
    if(!ml){
      ignorer('l\'élément <math-field> s\'enregistre', 'MathLive n\'a pas pu être mis en cache (réseau)');
      ignorer('une fraction s\'affiche numérateur au-dessus du dénominateur', 'MathLive absent');
    } else {
      verifier('l\'élément <math-field> s\'enregistre',
        await s.page.evaluate(() => !!customElements.get('math-field')),
        'sans lui, aucune case de calcul ne fonctionne');

      if(P.aide.mlStatic){
        /* la panne v46 : sans la feuille statique, 25/100 s'affichait « 10025 »,
           dénominateur d'abord, dans l'ordre du DOM */
        const frac = await s.page.evaluate(() => {
          const hote = document.createElement('div');
          hote.style.cssText = 'position:fixed;left:0;top:0';
          hote.innerHTML = (window.mlDexp && window.mlDexp.tex) ? (window.mlDexp.tex('\\frac{25}{100}') || '') : '';
          document.body.appendChild(hote);
          const parties = [...hote.querySelectorAll('.ML__mfrac span')]
            .filter(e => /^(25|100)$/.test(e.textContent.trim()))
            .map(e => ({ t: e.textContent.trim(), y: e.getBoundingClientRect().top }));
          const num = parties.find(p => p.t === '25'), den = parties.find(p => p.t === '100');
          hote.remove();
          return num && den ? { num: num.y, den: den.y } : null;
        });
        verifier('une fraction s\'affiche numérateur au-dessus du dénominateur',
          !!frac && frac.num < frac.den,
          frac ? ('numérateur à ' + Math.round(frac.num) + 'px, dénominateur à ' + Math.round(frac.den) + 'px')
               : 'les deux parties de la fraction n\'ont pas été trouvées dans le rendu');
      } else {
        ignorer('une fraction s\'affiche numérateur au-dessus du dénominateur',
          'ce niveau n\'a pas la feuille ml-static-css (voir les manques du profil)');
      }
    }

    /* ===== 3. un élève fait l'exercice ===== */
    titre('3. UN ÉLÈVE FAIT UN EXERCICE');
    const p = await parcours(s.page, N);
    verifier('l\'élève se connecte par l\'interface', p.espace === 'scr-space', 'écran après connexion : ' + p.espace);
    verifier('l\'exercice se déroule jusqu\'à l\'écran de résultats',
      (await ecranVisible(s.page)) === 'scr-results',
      'écran atteint : ' + (await ecranVisible(s.page)) + ' après ' + p.tours + ' question(s)');

    const notes = await s.page.evaluate(t => window.__faux.operations('insert', t)
      .flatMap(e => e.lignes).filter(l => l.details && !l.details.state && !l.details.partiel), P.tableResultats);
    verifier('une seule note est enregistrée', notes.length === 1, notes.length + ' note(s) écrite(s)');
    if(notes.length === 1){
      verifier('la note porte le bon exercice', notes[0].details.test === N.exercice,
        'details.test = ' + JSON.stringify(notes[0].details.test));
      verifier('la durée envoyée est un entier', Number.isInteger(notes[0].duration_sec),
        'duration_sec = ' + notes[0].duration_sec);
    }
    verifier('aucune erreur JavaScript pendant l\'exercice', s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
    await s.nav.close(); s = null;

    /* ===== 4. la base tombe pendant l'enregistrement ===== */
    titre('4. QUAND LA BASE REFUSE');
    s = await ouvrir(chromium, ml);
    await connecter(s.page);
    await s.page.evaluate(id => openTest(id), N.exercice);
    await s.page.waitForTimeout(400);
    await s.page.click('#modeChoices [onclick*="train"]');
    await s.page.waitForTimeout(600);
    await s.page.evaluate(() => { window.__faux.panne = true; });   /* la base refuse tout, à partir d'ici */
    await parcours2(s.page, N);
    const avertissement = await s.page.evaluate(() => {
      const t = document.getElementById('toast');
      return t ? { texte: t.textContent, classe: t.className } : null;
    });
    verifier('l\'élève est prévenu que sa note n\'est pas enregistrée',
      !!avertissement && /non enregistr/i.test(avertissement.texte),
      avertissement ? ('message affiché : « ' + avertissement.texte + ' »') : 'aucun message');

    /* ===== 5. sur un téléphone ===== */
    await s.nav.close(); s = null;
    titre('5. SUR UN TÉLÉPHONE');
    s = await ouvrir(chromium, ml, { viewport: { width: 390, height: 844 } });
    const debord = await s.page.evaluate(() =>
      ({ page: document.documentElement.scrollWidth, vue: document.documentElement.clientWidth }));
    verifier('la page ne déborde pas latéralement', debord.page <= debord.vue + 1,
      debord.page + 'px de large pour un écran de ' + debord.vue + 'px');
    await s.nav.close(); s = null;

  } finally {
    if(s && s.nav) await s.nav.close().catch(() => {});
  }

  console.log('\n' + '─'.repeat(58));
  const suffixe = ignores ? ' (' + ignores + ' non applicable' + (ignores > 1 ? 's' : '') + ')' : '';
  console.log(echecs === 0
    ? '✓ ' + controles + ' contrôles passés' + suffixe + '. La page se comporte bien dans un vrai navigateur.'
    : '✗ ' + echecs + ' échec(s) sur ' + controles + ' contrôles' + suffixe + '. NE PAS mettre en ligne.');
  process.exit(echecs ? 1 : 0);
})();

/* Comme parcours(), mais sans la connexion : l'exercice est déjà lancé. */
async function parcours2(page, N){
  let tours = 0;
  while(tours++ < 40){
    const fini = await page.evaluate(() =>
      document.getElementById('scr-results') && document.getElementById('scr-results').classList.contains('on'));
    if(fini) break;
    const pose = await page.evaluate(code => eval(code), N.repondre);
    if(!pose) break;
    await page.click(N.valider);
    if(N.suivant){
      await page.waitForSelector(N.suivant, { timeout: 4000 }).catch(() => {});
      await page.click(N.suivant).catch(() => {});
      await page.waitForTimeout(150);
    } else {
      await page.waitForTimeout(1800);
    }
  }
}
