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

/* Le code de l'élève d'essai, et un code faux de même longueur. Les deux sont
   déduits de la longueur exigée par le fichier contrôlé — elle est passée de 4
   à 6 chiffres, et un banc qui l'aurait gardée en dur aurait continué à passer
   sans jamais éprouver la nouvelle. */
let CODE_CONTROLE = '', CODE_FAUX = '';
/* Le mot de passe du professeur d'essai : il ne vit que dans ce banc, et le
   double le compare lui-même — comme le ferait Supabase. */
const MDP_PROF = 'mot-de-passe-du-professeur-de-controle';
const MDP_PROF_FAUX = 'ce-n-est-pas-le-bon';
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

/* ---------- un serveur HTTP local, pour ce que file:// ne sait pas ----------
   Un service worker ne s'enregistre pas depuis file:// (origine « null ») :
   la section 11 bis sert donc la racine du dépôt en HTTP sur 127.0.0.1, le
   temps de la mesure. FERMER ce serveur coupe le réseau pour de vrai — c'est
   ainsi qu'on mesure « hors connexion », plutôt que par une émulation que le
   service worker, qui vit hors de la page, pourrait ne pas voir. Les
   connexions gardées ouvertes par le navigateur sont détruites avec lui,
   sans quoi « fermer » attendrait qu'elles expirent. */
function servirRacine(){
  const http = require('http');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                  '.webmanifest': 'application/manifest+json', '.json': 'application/json',
                  '.png': 'image/png', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
  const prises = new Set();
  const serveur = http.createServer((req, res) => {
    let fichier;
    try{ fichier = path.join(RACINE, path.normalize(decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname))); }
    catch(e){ fichier = ''; }
    if(!fichier.startsWith(RACINE + path.sep) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()){
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(fichier));
  });
  serveur.on('connection', p => { prises.add(p); p.on('close', () => prises.delete(p)); });
  return new Promise(resolve => serveur.listen(0, '127.0.0.1', () => resolve({
    url: 'http://127.0.0.1:' + serveur.address().port,
    fermer: () => new Promise(r => { prises.forEach(p => p.destroy()); serveur.close(() => r()); }),
  })));
}

/* ---------- ouverture d'une page ---------- */
async function ouvrir(chromium, ml, options){
  options = options || {};
  const nav = await chromium.launch({
    executablePath: chercherChromium(),
    /* bypass : sans lui, Chromium envoie AUSSI 127.0.0.1 au mandataire, qui
       répond 405 — la page servie en HTTP local (section 11 bis) arrivait
       vide, sans une erreur qui le dise. */
    proxy: (process.env.HTTPS_PROXY || process.env.https_proxy)
      ? { server: process.env.HTTPS_PROXY || process.env.https_proxy, bypass: '127.0.0.1,localhost' } : undefined,
  });
  /* hasTouch : un contexte TACTILE — MathLive y déploie son clavier complet au
     focus (politique « auto »), exactement ce que le pavé compact doit empêcher
     sur les cases qu'on lui confie ; la requête média pointer:coarse, elle,
     reste au navigateur (le banc force le pavé par window.__paveForce). */
  const ctx = await nav.newContext({ ignoreHTTPSErrors: true, viewport: options.viewport || { width: 1280, height: 900 },
                                     hasTouch: options.hasTouch === true });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(String(e.message)));

  /* les polices distantes ne changent rien à ce qu'on vérifie, et le réseau des
     tests peut ne pas les servir : on coupe court plutôt que d'attendre */
  await page.route('**/fonts.googleapis.com/**', r => r.abort().catch(() => {}));
  await page.route('**/fonts.gstatic.com/**', r => r.abort().catch(() => {}));

  /* supabase-js remplacé par le double : la vraie base n'est jamais contactée */
  const faux = fs.readFileSync(path.join(__dirname, 'faux-supabase.js'), 'utf8');

  /* Le code de l'élève ne vit plus dans la table : il vit dans son compte, et
     c'est le double qui le compare — comme le ferait Supabase. On sème donc les
     deux, et le prénom seul dans la table.
     Le domaine est LU dans le fichier contrôlé plutôt que recopié ici : s'il y
     change, le banc suit. Recopié, il aurait fini par diverger en silence et le
     banc aurait échoué à se connecter sans que rien n'explique pourquoi. */
  const source = fs.readFileSync(path.join(RACINE, CIBLE), 'utf8');
  const domaine = (source.match(/const DOMAINE_COMPTES\s*=\s*'([^']+)'/) || [])[1];
  if(!domaine) throw new Error('DOMAINE_COMPTES introuvable dans ' + CIBLE + ' — le banc ne peut pas connecter d’élève');
  /* Supabase refuse un mot de passe de moins de 6 caractères : la page envoie
     donc le code préfixé. Le préfixe est LU ici, jamais recopié — recopié, il
     aurait fini par diverger et le banc n'aurait plus rien connecté. */
  const prefixe = (source.match(/const PREFIXE_CODE\s*=\s*'([^']*)'/) || [])[1];
  if(prefixe === undefined) throw new Error('PREFIXE_CODE introuvable dans ' + CIBLE);
  /* « cle » et non « id » : l'adresse du compte en est dérivée, et « id » n'a
     pas le même type d'un niveau à l'autre — uuid en Terminale et en Seconde,
     bigint en Première. Le double acceptait n'importe quoi ; la vraie base,
     non. C'est le banc de la base qui couvre ce point (tests/base.js § 5). */
  const eleve = { id: 'eleve-controle', prenom: 'Contrôle',
                  cle: 'cle-controle', user_id: 'compte-controle' };
  /* La longueur du code est LUE dans le fichier, jamais recopiée : elle est
     passée de 4 à 6 chiffres, et un banc qui aurait gardé « 1234 » en dur
     n'aurait plus rien connecté — ou pire, aurait continué à passer sans
     éprouver la nouvelle longueur. */
  const nChiffres = parseInt((source.match(/const CHIFFRES_CODE\s*=\s*(\d+)/) || [])[1], 10);
  if(!nChiffres) throw new Error('longueur du code introuvable dans ' + CIBLE);
  CODE_CONTROLE = '123456789'.slice(0, nChiffres);
  CODE_FAUX     = '987654321'.slice(0, nChiffres);
  /* Le compte du professeur, et son inscription dans « professeurs » : la page
     d'aiguillage demande le mot de passe AVANT de montrer les trois niveaux, et
     les trois pages reprennent la session ouverte là-bas. Le courriel est LU
     dans le fichier, jamais recopié — recopié, il aurait fini par diverger. */
  const courrielProf = (source.match(/const COURRIEL_PROF\s*=\s*"([^"]+)"/) || [])[1];
  if(!courrielProf) throw new Error('COURRIEL_PROF introuvable dans ' + CIBLE);
  await page.route('**/supabase-js**', r => r.fulfill({
    contentType: 'application/javascript',
    body: faux
      + '\nwindow.__faux.semer(' + JSON.stringify(P.tableEleves) + ',' + JSON.stringify([eleve]) + ');'
      + '\nwindow.__faux.semerCompte(' + JSON.stringify(eleve.cle + '@' + domaine) + ','
        + JSON.stringify(prefixe + CODE_CONTROLE) + ',' + JSON.stringify(eleve.user_id) + ');'
      + '\nwindow.__faux.semerCompte(' + JSON.stringify(courrielProf) + ','
        + JSON.stringify(MDP_PROF) + ',' + JSON.stringify('compte-prof-controle') + ');'
      + '\nwindow.__faux.semer("professeurs",[{user_id:"compte-prof-controle"}]);',
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

  /* REMPART DUR. Le double ci-dessus suffit tant que l'interception fonctionne ;
     ce rempart-ci rend l'accident impossible plutôt qu'improbable. Si le motif
     d'URL cessait un jour de correspondre — changement de CDN, auto-hébergement,
     autre nom de fichier — le vrai client serait chargé, et le premier clic
     lirait la liste réelle des élèves avant que quoi que ce soit ne s'en
     aperçoive. Toute requête vers le projet de production est donc coupée net. */
  const projet = (fs.readFileSync(path.join(RACINE, CIBLE), 'utf8')
    .match(/https:\/\/([a-z0-9-]+)\.supabase\.co/) || [])[1];
  if(projet) await page.route('**' + projet + '.supabase.co**', r => r.abort().catch(() => {}));

  /* options.fragment ouvre la page comme le ferait un favori : « #prof » est la
     seule porte du professeur depuis qu'elle n'a plus de bouton. */
  /* options.adresse ouvre la page ailleurs qu'en file:// — servie en HTTP
     local par servirRacine(), pour ce que file:// ne sait pas faire. */
  await page.goto(options.adresse || ('file://' + path.join(RACINE, CIBLE) + (options.fragment || '')),
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(ml ? 3500 : 1500);

  /* Et on refuse de continuer si le double n'est pas en place : mieux vaut ne
     rien tester que tester en écrivant dans la vraie base. */
  if(!await page.evaluate(() => !!window.__faux)){
    await nav.close().catch(() => {});
    throw new Error('interception de supabase-js échouée — aucun test ne démarre');
  }
  return { nav, page, erreurs, eleve };
}

const ecranVisible = page => page.evaluate(() =>
  ([...document.querySelectorAll('section.screen')].find(s => s.classList.contains('on')) || {}).id || '(aucun)');

/* ---------- le parcours d'un élève ---------- */
async function connecter(page){
  /* La page s'ouvre DIRECTEMENT sur la connexion : l'écran « Choisis ton rôle »
     a disparu avec le bouton du professeur. Le banc n'a donc plus de premier
     clic à donner — et s'il en donnait un, il chercherait un écran absent. */
  await page.waitForSelector('#nameChips .chip', { timeout: 15000 });
  await page.click('#nameChips .chip');                        /* son prénom */
  await page.fill('#loginPin', CODE_CONTROLE);
  await page.click('#modeCo button.btn-primary');              /* « Entrer » */
  await page.waitForTimeout(500);
  return ecranVisible(page);
}

async function parcours(page, N){
  const espace = await connecter(page);

  /* Si la connexion n'a pas abouti, continuer ne mesure plus rien : openTest()
     puis le code de réponse travailleraient sur un état inexistant, et l'échec
     ressortirait en « Cannot read properties of undefined » à cinquante lignes
     de sa cause. On s'arrête ici, et les contrôles suivants disent ce qu'il en
     est. Depuis que le code est vérifié par le serveur, cette voie est bien
     plus facile à emprunter : une configuration Supabase incomplète suffit. */
  if(espace !== 'scr-space') return { espace, tours: 0, bloque: true };

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
      /* Un sélecteur « suivant » qui ne désigne rien ne casse pas : la boucle
         retombe sur « valider » quarante fois de suite, et le banc met vingt
         minutes à ne rien dire. On s'arrête au premier tour — le contrôle
         « l'exercice se déroule jusqu'à l'écran de résultats » rougit alors
         tout de suite. C'est arrivé sur un profil dont la clé « suivant »
         était écrite deux fois, la seconde l'emportant en silence. */
      const vu = await page.waitForSelector(N.suivant, { timeout: 4000 }).then(() => true).catch(() => false);
      if(!vu && tours === 1) break;
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

  /* ===== 0. la numérotation du banc =====
     Les numéros de section (« 6 vicies ter », « 11 quater ») ne pilotent rien :
     ils servent à RETROUVER une section, dans cette sortie et dans les
     paragraphes de CLAUDE.md qui la citent. Deux d'entre eux désignaient donc
     deux sections à la fois — « 6 octodecies » et « 6 vicies ter » —, et un
     TROISIÈME, « 6 vicies quater », vivait dans l'en-tête de la synthèse sans
     qu'aucun titre() ne l'imprime : ses quatre contrôles se rangeaient sous le
     titre de la section d'AVANT. Rien ne cassait, et c'est précisément pour ça
     que personne ne l'avait vu — un contrôle qui s'affiche sous le nom d'un
     autre est pire qu'un contrôle sans nom : on va corriger l'exercice qu'il ne
     mesure pas.
     Le banc lit donc sa PROPRE source, dans les DEUX SENS — et il a fallu
     les deux, chacun laissant passer ce que l'autre attrape. Un titre est
     ANNONCÉ par l'en-tête juste au-dessus de lui : ce sens nomme la moitié
     renommée seule, et l'ambiguïté d'origine (le titre d'une section annoncé
     par l'en-tête de la précédente). Et tout en-tête IMPRIME son titre : ce
     sens-là seul voit un titre retiré — pris dans l'autre sens, un en-tête
     devenu muet ne se distingue plus d'un sous-bloc et le sabotage reste vert.
     Les SOUS-BLOCS sont donc NOMMÉS ici plutôt que de faire taire le bord :
     « 1 bis » vit dans la section 1 et « 12 » dans la section 11, leurs
     contrôles appartiennent à bon droit à la section qui les entoure. Un
     sous-bloc ajouté demain rougit et se déclare ici — et le second contrôle
     de la liste exige que chaque nom désigne encore un en-tête, sans quoi une
     exemption survivrait à ce qu'elle protégeait.
     Un contrôle qui n'a rien à mesurer le DIT plutôt que de passer. */
  titre('0. LA NUMÉROTATION DU BANC');
  {
    const src = fs.readFileSync(__filename, 'utf8');
    /* les en-têtes ANNONCÉS et les titres IMPRIMÉS, dans l'ordre de la source ;
       le filet d'un en-tête s'écrit « ===== » ou « ---- » selon l'endroit. */
    const ev = [];
    let m;
    const reC = /\/\*[ \t]*(?:=+|-+)[ \t]*([0-9]+(?: [a-z]+)*)\. /g;
    while((m = reC.exec(src))) ev.push({ p: m.index, t: 'a', n: m[1] });
    const reT = /titre\(.([0-9]+(?: [a-z]+)*)\. /g;
    while((m = reT.exec(src))) ev.push({ p: m.index, t: 'T', n: m[1] });
    ev.sort((a, b) => a.p - b.p);
    const imprimes = ev.filter(e => e.t === 'T').map(e => e.n);
    const annonces = ev.filter(e => e.t === 'a').length;
    const doubles = imprimes.filter((v, i) => imprimes.indexOf(v) !== i);
    const orphelins = [];
    for(let i = 0; i < ev.length; i++){
      if(ev[i].t !== 'T') continue;
      let j = i - 1; while(j >= 0 && ev[j].t !== 'a') j--;
      const an = j >= 0 ? ev[j].n : '(aucun)';
      if(an !== ev[i].n) orphelins.push('« ' + ev[i].n + ' » annoncé par « ' + an + ' »');
    }
    verifier('le banc a des numéros de section à mesurer',
      imprimes.length >= 40 && annonces >= 40,
      annonces + ' en-tête(s), ' + imprimes.length + ' titre(s)');
    verifier('aucun numéro ne désigne deux sections',
      doubles.length === 0,
      'numéro(s) imprimé(s) deux fois : ' + doubles.map(v => '« ' + v + ' »').join(', '));
    verifier('chaque titre est annoncé par l\'en-tête juste au-dessus de lui',
      orphelins.length === 0,
      orphelins.join(' | '));
    /* les sous-blocs : un en-tête numéroté qui vit DANS une section et dont les
       contrôles s'affichent, à bon droit, sous le titre de celle-ci. */
    const SOUS_BLOCS = ['1 bis', '12'];
    const muets = [];
    for(let i = 0; i < ev.length; i++){
      if(ev[i].t !== 'a') continue;
      let j = i + 1; while(j < ev.length && ev[j].t !== 'T') j++;
      if(j >= ev.length || ev[j].n !== ev[i].n) muets.push(ev[i].n);
    }
    const inattendus = muets.filter(v => SOUS_BLOCS.indexOf(v) < 0);
    const perimes = SOUS_BLOCS.filter(v => !ev.some(e => e.t === 'a' && e.n === v));
    verifier('chaque en-tête de section imprime bien son titre',
      inattendus.length === 0,
      'en-tête(s) sans titre : ' + inattendus.map(v => '« ' + v + ' »').join(', ')
      + ' — un sous-bloc se déclare dans SOUS_BLOCS');
    verifier('chaque sous-bloc déclaré désigne encore un en-tête',
      perimes.length === 0,
      'nom(s) périmé(s) dans SOUS_BLOCS : ' + perimes.map(v => '« ' + v + ' »').join(', '));
  }

  /* ===== 1. la page s'ouvre ===== */
  titre('1. OUVERTURE DE LA PAGE');
  let s = null;
  try {
    s = await ouvrir(chromium, ml);
    const version = await s.page.evaluate(() => (typeof APP_VERSION !== 'undefined') ? APP_VERSION : null);
    verifier('la page s\'ouvre sans erreur JavaScript', s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
    verifier('le numéro de version s\'affiche', /^\d+$/.test(String(version)), 'APP_VERSION = ' + version);
    verifier('l\'élève arrive sur l\'accueil, pas sur l\'écran d\'installation',
      (await ecranVisible(s.page)) !== 'scr-setup',
      'écran affiché : ' + (await ecranVisible(s.page)));

    /* ===== 1 bis. la porte du professeur ===== */
    /* Elle n'a plus de bouton : elle s'ouvre par « …#prof », mis en favori.
       Deux bords opposés, et corriger un seul ne corrige rien : l'élève ne doit
       trouver AUCUNE porte, et le professeur doit trouver LA SIENNE. Le second
       est le plus coûteux — un fragment qui cesserait d'aiguiller enfermerait
       le professeur dehors, sans autre chemin, et sans erreur nulle part. */
    const porte = await s.page.evaluate(() => {
      const vu = ((document.querySelector('.screen.on') || {}).id) || '(aucun)';
      const mots = document.body.innerText.toLowerCase();
      /* ce que l'élève VOIT : le texte des écrans affichés, pas le HTML entier */
      return { ecran: vu, professeur: mots.indexOf('je suis le professeur') >= 0,
               boutons: [...document.querySelectorAll('.screen.on button')].length };
    });
    verifier('l\'élève arrive directement sur sa connexion, sans écran de rôles',
      porte.ecran === 'scr-login', 'écran affiché : ' + porte.ecran);
    verifier('aucun bouton « professeur » ne s\'offre à l\'élève',
      porte.professeur === false, 'le texte affiché propose encore la porte du professeur');

    /* Et maintenant le favori du professeur, ouvert comme il l'ouvrira. */
    const q = await ouvrir(chromium, ml, { fragment: '#prof' });
    const parProf = await q.page.evaluate(() => ({
      ecran: ((document.querySelector('.screen.on') || {}).id) || '(aucun)',
      champ: !!document.getElementById('teacherPass'),
      focus: document.activeElement ? document.activeElement.id : '',
    }));
    verifier('l\'adresse « #prof » ouvre la connexion du professeur',
      parProf.ecran === 'scr-teacher-login' && parProf.champ,
      'écran affiché : ' + parProf.ecran + ' — champ mot de passe : ' + parProf.champ);
    verifier('le curseur est déjà dans le champ du mot de passe',
      parProf.focus === 'teacherPass', 'élément actif : « ' + (parProf.focus || '(aucun)') + ' »');
    verifier('la porte du professeur ne lève aucune erreur JavaScript',
      q.erreurs.length === 0, q.erreurs.slice(0, 2).join(' | '));

    /* Et le favori unique : prof.html, ouverte et CLIQUÉE. Le contrôle statique
       dit que le lien est écrit avec le bon fragment ; celui-ci dit qu'il mène
       quelque part. Un lien juste sur le papier qui atterrirait sur la
       connexion des élèves ne lèverait aucune erreur — il faut regarder où l'on
       tombe. */
    await q.page.goto('file://' + path.join(RACINE, 'prof.html'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await q.page.waitForTimeout(600);
    const lien = 'a[href="' + CIBLE + '#prof"]';
    const profVisible = async () => q.page.evaluate(sel => {
      const a = document.querySelector(sel);
      if(!a) return null;
      const r = a.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }, lien);

    /* Le bord qui compte : les trois portes ne s'ouvrent qu'APRÈS le mot de
       passe. Livrées visibles, elles s'offriraient à qui tombe sur l'adresse,
       et rien ne rougirait nulle part. */
    const profAvant = await profVisible();
    verifier('avant le mot de passe, la page d\'aiguillage ne montre aucun niveau',
      profAvant === false, profAvant === null ? 'aucun lien « ' + lien +' » dans prof.html'
                                      : 'le lien du niveau est déjà visible');

    /* et un mauvais mot de passe ne les ouvre pas non plus */
    await q.page.fill('#profPass', MDP_PROF_FAUX);
    await q.page.click('#profEntrer');
    await q.page.waitForTimeout(700);
    const profApresFaux = await profVisible();
    const profDit = await q.page.evaluate(() => (document.getElementById('profErreur') || {}).textContent || '');
    verifier('un mauvais mot de passe est refusé, et la page le dit',
      profApresFaux === false && profDit.trim() !== '', 'message affiché : « ' + profDit.trim() + ' »');

    await q.page.fill('#profPass', MDP_PROF);
    await q.page.click('#profEntrer');
    await q.page.waitForTimeout(900);
    const profApresBon = await profVisible();
    verifier('le bon mot de passe ouvre les trois niveaux', profApresBon === true,
      'le lien du niveau reste caché après un mot de passe accepté');

    if(profApresBon !== true){
      verifier('la page d\'aiguillage mène au tableau de bord de ce niveau', false,
        'les niveaux ne se sont pas affichés : rien à cliquer');
    } else {
      await q.page.click(lien);
      await q.page.waitForTimeout(2500);
      const arrivee = await q.page.evaluate(() => ({
        fichier: location.pathname.split('/').pop(),
        ecran: ((document.querySelector('.screen.on') || {}).id) || '(aucun)',
      }));
      /* La session est partagée : le professeur ne redonne pas son mot de
         passe en arrivant. Un lien juste sur le papier qui atterrirait sur la
         connexion des ÉLÈVES ne lèverait aucune erreur — il faut regarder où
         l'on tombe. */
      verifier('la page d\'aiguillage mène au tableau de bord de ce niveau',
        arrivee.fichier === CIBLE && arrivee.ecran === 'scr-teacher',
        'atterrissage : ' + arrivee.fichier + ' / ' + arrivee.ecran);

      /* et « Quitter » ramène à la page des trois niveaux, toujours ouverte */
      if(arrivee.ecran === 'scr-teacher'){
        await q.page.click('#scr-teacher .topbar button');
        await q.page.waitForTimeout(2000);
        const profRetour = await q.page.evaluate(() => ({
          fichier: location.pathname.split('/').pop(),
          carte: !((document.getElementById('carte-niveaux') || {}).hidden !== false),
        }));
        verifier('« Quitter » un niveau ramène à la page des trois niveaux',
          profRetour.fichier === 'prof.html', 'atterrissage : ' + profRetour.fichier);
        verifier('le retour ne redemande pas le mot de passe',
          profRetour.fichier === 'prof.html' && profRetour.carte === true,
          'la page d\'aiguillage redemande le mot de passe après « Quitter »');
      }
    }
    verifier('la page d\'aiguillage ne lève aucune erreur JavaScript',
      q.erreurs.length === 0, q.erreurs.slice(0, 2).join(' | '));
    await q.nav.close();

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
            .map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), y: r.top, l: r.width }; });
          const num = parties.find(p => p.t === '25'), den = parties.find(p => p.t === '100');
          hote.remove();
          return num && den ? { num: num.y, den: den.y, ln: num.l, ld: den.l } : null;
        });
        verifier('une fraction s\'affiche numérateur au-dessus du dénominateur',
          !!frac && frac.num < frac.den && frac.ln > 0 && frac.ld > 0,
          frac ? ('numérateur à ' + Math.round(frac.num) + 'px (large de ' + Math.round(frac.ln) + 'px), '
                + 'dénominateur à ' + Math.round(frac.den) + 'px (large de ' + Math.round(frac.ld) + 'px)')
               : 'les deux parties de la fraction n\'ont pas été trouvées dans le rendu');
      } else {
        ignorer('une fraction s\'affiche numérateur au-dessus du dénominateur',
          'ce niveau n\'a pas la feuille ml-static-css (voir les manques du profil)');
      }
    }

    /* ===== 3. un élève fait l'exercice ===== */
    titre('3. UN ÉLÈVE FAIT UN EXERCICE');

    /* D'abord avec un mauvais code. L'ancienne version refusait aussi les
       mauvais codes — elle les comparait dans la page. Ce qui change, et que ce
       contrôle regarde, c'est QUI refuse : le serveur, ou une ligne de
       JavaScript que n'importe quel élève peut réécrire dans sa console. */
    await s.page.waitForSelector('#nameChips .chip', { timeout: 15000 });
    await s.page.click('#nameChips .chip');
    await s.page.fill('#loginPin', CODE_FAUX);
    await s.page.click('#modeCo button.btn-primary');
    await s.page.waitForTimeout(500);
    const apresFaux = await ecranVisible(s.page);
    const tentatives = await s.page.evaluate(() =>
      window.__faux.operations(null, 'auth').filter(e => e.op === 'signIn'));
    verifier('un code faux n’ouvre pas l’espace de l’élève', apresFaux !== 'scr-space',
      'écran atteint : ' + apresFaux);
    verifier('c’est le serveur qui refuse le code, pas la page',
      tentatives.length > 0 && tentatives.every(e => e.ok === false),
      tentatives.length ? JSON.stringify(tentatives)
                        : 'aucune authentification tentée — le code a été jugé dans la page');

    /* On repart d'une page neuve : le double se resème au chargement. */
    await s.page.reload({ waitUntil: 'domcontentloaded' });
    await s.page.waitForTimeout(3500);

    const p = await parcours(s.page, N);
    verifier('l\'élève se connecte par l\'interface', p.espace === 'scr-space', 'écran après connexion : ' + p.espace);

    /* Le contrôle ci-dessus dit que l'élève est entré. Il ne dit pas COMMENT.
       Tant que le code était comparé dans la page, il passait aussi — et deux
       lignes dans la console suffisaient à entrer sous n'importe quel prénom.
       Les deux contrôles qui suivent regardent le mécanisme, pas le résultat. */
    const journalAuth = await s.page.evaluate(() => window.__faux.operations(null, 'auth').map(e => ({ op:e.op, ok:e.ok })));
    verifier('la connexion est passée par le serveur, pas par une comparaison locale',
      journalAuth.some(e => e.op === 'signIn' && e.ok),
      journalAuth.length ? 'opérations vues : ' + JSON.stringify(journalAuth)
                         : 'aucun appel d’authentification — le code a été jugé dans la page');

    /* La table des élèves ne doit plus jamais être lue en entier : c'est
       select('*') qui rapportait la colonne des codes, toute la classe d'un
       coup. Le double consigne les colonnes réellement demandées. */
    const lectures = await s.page.evaluate(t =>
      window.__faux.operations('select', t).map(e => e.colonnes), P.tableEleves);
    const entieres = lectures.filter(c => c === '*');
    verifier('la table des élèves n’est jamais lue en entier',
      lectures.length > 0 && entieres.length === 0,
      lectures.length === 0 ? 'aucune lecture observée — le contrôle ne prouve rien'
                            : entieres.length + ' lecture(s) select(*) sur ' + lectures.length);
    verifier('l\'exercice se déroule jusqu\'à l\'écran de résultats',
      (await ecranVisible(s.page)) === 'scr-results',
      'écran atteint : ' + (await ecranVisible(s.page)) + ' après ' + p.tours + ' question(s)');

    /* ===== l'élève remplace le code que son professeur lui a donné ===== */
    /* Un code tiré au hasard ne se retient pas : l'élève doit pouvoir le
       changer. On l'exerce vraiment — deux prompt(), puis on regarde ce que le
       double a réellement enregistré, et on se reconnecte avec le nouveau. */
    /* ===== le code provisoire s'impose à la connexion ===== */
    /* Un élève qui a choisi son code lui-même ne doit RIEN se voir demander :
       la connexion qui vient d'avoir lieu ne devait ouvrir aucune boîte. */
    let boites = 0;
    const compter = d => { boites++; d.dismiss(); };
    s.page.on('dialog', compter);
    await s.page.evaluate(() => ouvrirEspace());
    await s.page.waitForTimeout(400);
    s.page.off('dialog', compter);
    verifier('sans code provisoire, rien n’est demandé à l’élève', boites === 0,
      boites + ' boîte(s) ouverte(s) alors que l’élève a choisi son code');

    /* On pose le marqueur comme le ferait la fonction Edge en donnant un code. */
    const poser = () => s.page.evaluate(() => {
      const c = window.__faux.comptes[Object.keys(window.__faux.comptes)[0]];
      c.app_metadata = { code_provisoire: true };
      window.__faux.session.user.app_metadata = { code_provisoire: true };
    });

    /* Un élève qui renonce ne doit PAS entrer : la demande barre l'entrée. */
    await poser();
    const refuser = d => d.dismiss();
    s.page.on('dialog', refuser);
    await s.page.evaluate(() => ouvrirEspace());
    await s.page.waitForTimeout(500);
    s.page.off('dialog', refuser);
    const apresRefus = await ecranVisible(s.page);
    verifier('un élève qui refuse de choisir un code n’entre pas',
      apresRefus !== 'scr-space', 'écran atteint : ' + apresRefus);

    /* Et maintenant le tour complet : il choisit, ça change vraiment, et il
       peut se reconnecter avec.
       Le refus ci-dessus a appelé logout(), qui vide currentEleve : on remonte
       la session comme le fait connexionEleve, sans quoi l'espace s'ouvrirait
       sur un élève inexistant. C'est le banc qui l'a signalé. */
    const NOUVEAU = '765432'.slice(0, CODE_CONTROLE.length);
    await s.page.evaluate(async (args) => {
      await sb.auth.signInWithPassword({ email: courrielDe(args.cle),
                                         password: motDePasseDe(args.c) });
      selectedEleve = args.eleve;
      currentEleve  = args.eleve;
    }, { c: CODE_CONTROLE, cle: s.eleve.cle, eleve: s.eleve });
    await poser();
    const repondre = d => d.accept(NOUVEAU);
    s.page.on('dialog', repondre);
    await s.page.evaluate(() => ouvrirEspace());
    await s.page.waitForTimeout(600);
    s.page.off('dialog', repondre);

    /* Voulu, et non subi : l'élève est renvoyé à l'écran des prénoms pour se
       reconnecter AVEC son nouveau code. Il découvre ainsi tout de suite s'il
       l'a mal noté, plutôt que le lendemain sans personne pour l'aider.
       (décision de Turquet, août 2026) */
    verifier('après avoir choisi son code, l’élève est renvoyé aux prénoms',
      (await ecranVisible(s.page)) === 'scr-login',
      'écran atteint : ' + (await ecranVisible(s.page)));

    /* Et la session doit être vraiment refermée : le renvoi ne servirait à
       rien si l'élève restait connecté derrière. */
    const sessionFermee = await s.page.evaluate(() => window.__faux.session === null);
    verifier('la session est refermée avant le renvoi', sessionFermee,
      'la session est restée ouverte : l’élève suivant en hériterait');

    const enregistre = await s.page.evaluate(() => {
      const c = window.__faux.comptes[Object.keys(window.__faux.comptes)[0]];
      return c ? c.motDePasse : null;
    });
    const attendu = await s.page.evaluate(n => motDePasseDe(n), NOUVEAU);
    verifier('le nouveau code est bien celui que Supabase retiendra',
      enregistre === attendu, 'enregistré : ' + enregistre + ' — attendu : ' + attendu);

    const rentre = await s.page.evaluate(async a => {
      await sb.auth.signOut();
      const { error } = await sb.auth.signInWithPassword({
        email: courrielDe(a.cle), password: motDePasseDe(a.n) });
      return !error;
    }, { cle: s.eleve.cle, n: NOUVEAU });
    verifier('l’élève se reconnecte avec son nouveau code', rentre);

    /* Le marqueur retiré, la demande ne doit plus revenir. */
    const marqueur = await s.page.evaluate(() => {
      const c = window.__faux.comptes[Object.keys(window.__faux.comptes)[0]];
      return c && c.app_metadata ? c.app_metadata.code_provisoire : null;
    });
    verifier('le code ne lui sera pas redemandé à la prochaine connexion',
      marqueur === false, 'marqueur = ' + JSON.stringify(marqueur));

    const notes = await s.page.evaluate(t => window.__faux.operations('insert', t)
      .flatMap(e => e.lignes).filter(l => l.details && !l.details.state && !l.details.partiel), P.tableResultats);
    verifier('une seule note est enregistrée', notes.length === 1, notes.length + ' note(s) écrite(s)');
    if(notes.length === 1){
      verifier('la note porte le bon exercice', notes[0].details.test === N.exercice,
        'details.test = ' + JSON.stringify(notes[0].details.test));
      verifier('la durée envoyée est un entier', Number.isInteger(notes[0].duration_sec),
        'duration_sec = ' + notes[0].duration_sec);
      /* L'élève fictif répond juste à chaque question : la note doit le dire.
         Sans ce contrôle, une application qui compte toutes les réponses fausses
         — ou un pilote qui ne remplit plus rien — passait au vert. */
      verifier('l\'élève qui répond juste obtient toutes ses réponses justes',
        notes[0].score === notes[0].total && notes[0].percent === 100,
        'score ' + notes[0].score + '/' + notes[0].total + ', ' + notes[0].percent + ' %');
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
    /* toast() ne vide jamais son texte : au bout de 2,6 s il retire seulement la
       classe. Sans ce nettoyage, un vieux message — venu du brouillon, et invisible
       depuis longtemps — pouvait satisfaire le contrôle à la place de celui qu'on
       attend. On efface, puis on exige un message VISIBLE et parlant de la note. */
    await s.page.evaluate(() => { const t = document.getElementById('toast'); if(t){ t.textContent = ''; t.className = ''; } });
    await parcours2(s.page, N);
    const avertissement = await s.page.evaluate(() => {
      const t = document.getElementById('toast');
      return t ? { texte: t.textContent, classe: t.className } : null;
    });
    verifier('l\'élève est prévenu que sa note n\'est pas enregistrée',
      !!avertissement && /r\u00e9sultat non enregistr/i.test(avertissement.texte)
        && /show/.test(avertissement.classe) && /err/.test(avertissement.classe),
      avertissement ? ('message « ' + avertissement.texte + ' », classe « ' + avertissement.classe + ' »') : 'aucun message');

    /* ===== 5. sur un téléphone ===== */
    await s.nav.close(); s = null;
    titre('5. SUR UN TÉLÉPHONE');
    s = await ouvrir(chromium, ml, { viewport: { width: 390, height: 844 } });
    const mesurer = () => s.page.evaluate(() =>
      ({ page: document.documentElement.scrollWidth, vue: document.documentElement.clientWidth }));
    const accueil = await mesurer();
    verifier('l\'accueil ne déborde pas latéralement', accueil.page <= accueil.vue + 1,
      accueil.page + 'px de large pour un écran de ' + accueil.vue + 'px');
    /* et surtout l'écran où l'élève passe tout son temps */
    await connecter(s.page);
    await s.page.evaluate(id => openTest(id), N.exercice);
    await s.page.waitForTimeout(400);
    await s.page.click('#modeChoices [onclick*="train"]');
    await s.page.waitForTimeout(800);
    const exercice = await mesurer();
    verifier('l\'écran de l\'exercice ne déborde pas latéralement', exercice.page <= exercice.vue + 1,
      exercice.page + 'px de large pour un écran de ' + exercice.vue + 'px');
    await s.nav.close(); s = null;

    /* ===== 6. l'encadré « Énoncé », tel qu'il s'affiche ===== */
    /* Le contrôle structurel lit le fichier ; celui-ci lit l'écran. La
       différence n'est pas théorique : deux énoncés sont posés par JavaScript,
       dans des chaînes, et le contrôle structurel a laissé passer une légende
       de tableau étiquetée « Énoncé » et une deuxième étiquette sur le même
       écran. Seul le navigateur voit ce que l'élève voit.
       L'exercice piloté ici est déclaré à part : celui du parcours principal
       peut être un exercice sur ardoise, sans énoncé texte. */
    titre('6. L\'ENCADRÉ « ÉNONCÉ »');
    const AVISITER = (P.enonce && P.enonce.navigateur) || [];
    if(!AVISITER.length){
      ignorer('l\'énoncé s\'affiche encadré, avec son étiquette',
        'aucun exercice à énoncé texte n\'est déclaré pour ce niveau');
    } else {
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      for(const exo of AVISITER){
        await s.page.evaluate(id => openTest(id), exo);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="train"]');
        await s.page.waitForTimeout(1200);
        const vu = await s.page.evaluate(classes => {
          const sel = classes.map(c => '.screen.on .' + c).join(',');
          const el = document.querySelector(sel);
          const etiquettes = [...document.querySelectorAll('.screen.on *')]
            .filter(x => (getComputedStyle(x, '::before').content || '').indexOf('Énoncé') >= 0).length;
          if(!el) return { absent: true, etiquettes };
          const c = getComputedStyle(el), av = getComputedStyle(el, '::before');
          return { texte: el.textContent.trim(), bord: parseFloat(c.borderTopWidth) || 0,
                   fond: c.backgroundColor, etiquette: av.content, etiquettes };
        }, P.enonce.classes);
        verifier(exo + ' : l\'énoncé est là, et non vide', !vu.absent && !!vu.texte,
          vu.absent ? 'aucun élément d\'énoncé sur l\'écran' : 'énoncé vide');
        verifier(exo + ' : il est encadré', !vu.absent && vu.bord >= 1.5, 'bordure : ' + vu.bord + 'px');
        verifier(exo + ' : l\'étiquette « Énoncé » s\'affiche',
          !vu.absent && /Énoncé/.test(String(vu.etiquette)), 'contenu du ::before : ' + vu.etiquette);
        /* Le vert veut dire « juste » partout ailleurs : un énoncé sur fond vert
           se lit comme une réponse déjà validée. On mesure la couleur RENDUE,
           pas la déclaration CSS. */
        verifier(exo + ' : son fond n\'est pas le vert des réponses justes',
          !vu.absent && !/228,\s*245,\s*238/.test(String(vu.fond)), 'fond rendu : ' + vu.fond);
        verifier(exo + ' : une seule étiquette « Énoncé » sur l\'écran', vu.etiquettes === 1,
          vu.etiquettes + ' étiquette(s) — les parties a)/b) se déclarent « enonce-suite »');
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 bis. la fenêtre des tables de multiplication ===== */
    /* Elle s'ouvre depuis tous les exercices. Sur l'exercice DES tables, elle
       doit se refermer dès que l'élève revient à son calcul — sinon c'est une
       antisèche posée à côté du chronomètre. Ailleurs, elle doit RESTER
       ouverte, sinon une fenêtre flottante ne sert à rien.
       Ce contrôle ne peut vivre QUE dans un vrai navigateur : jsdom
       n'implémente pas PointerEvent, et un premier essai écrit avec
       « new PointerEvent » n'y levait rien — il laissait croire que la
       fermeture ne marchait pas alors qu'aucun événement n'était parti. */
    titre('6 bis. LA FENÊTRE DES TABLES DE MULTIPLICATION');
    if(!P.tablesAide){
      ignorer('la fenêtre des tables s\'ouvre et se referme au bon moment',
        'ce niveau n\'a pas la fenêtre des tables de multiplication');
    } else {
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      const ouvrirExo = async (id) => {
        await s.page.evaluate(i => openTest(i), id);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="train"]');
        await s.page.waitForTimeout(900);
      };
      /* a) l'exercice des tables : elle se referme au retour.
         Un niveau peut porter la fenêtre SANS avoir d'exercice où elle
         devient une antisèche — la Seconde n'a aucun exercice de rapidité.
         Il le déclare en n'écrivant pas « referme », et le banc le dit
         plutôt que de le taire : une exemption muette survivrait à
         l'exercice qu'elle dispense. */
      if(!P.tablesAide.referme){
        ignorer('revenir au calcul la referme, sur l\'exercice des tables',
          'ce niveau n\'a pas d\'exercice où la fenêtre deviendrait une antisèche');
      } else {
      await ouvrirExo(P.tablesAide.referme);
      const btn = await s.page.$('.screen.on .tables-btn');
      verifier('le bouton des tables est là, sur l\'exercice des tables', !!btn,
        'aucun bouton .tables-btn sur l\'écran');
      if(btn){
        await btn.click();
        await s.page.waitForTimeout(300);
        const vu = await s.page.evaluate(() => {
          const ov = document.getElementById('tablesOverlay');
          return { ouverte: !!(ov && ov.classList.contains('on')),
                   visible: !!(ov && getComputedStyle(ov).display !== 'none'),
                   blocs: document.querySelectorAll('#tablesCorps .tables-bloc').length };
        });
        verifier('elle s\'ouvre et s\'affiche vraiment', vu.ouverte && vu.visible,
          'ouverte=' + vu.ouverte + ' affichée=' + vu.visible);
        verifier('elle montre les 8 tables, de 2 à 9', vu.blocs === 8, vu.blocs + ' table(s)');
        /* Un VRAI clic sur l'exercice : retour au calcul. On vise l'ardoise et
           non le champ — sur l'écran « Prêt ? » le champ est DÉSACTIVÉ, et un
           clic dessus n'aurait jamais lieu (Playwright l'a signalé en attendant
           trente secondes qu'il devienne cliquable). L'ardoise, elle, est le
           geste naturel : c'est là que le calcul s'affiche. */
        await s.page.click('.screen.on .ardoise');
        await s.page.waitForTimeout(250);
        const apres = await s.page.evaluate(() =>
          !!document.getElementById('tablesOverlay').classList.contains('on'));
        verifier('revenir au calcul la referme, sur l\'exercice des tables', !apres,
          'elle est restée ouverte à côté du chronomètre');
      }
      }
      /* b) un autre exercice : elle doit rester ouverte */
      await ouvrirExo(P.tablesAide.reste);
      const btn2 = await s.page.$('.screen.on .tables-btn');
      verifier('le bouton des tables est là, sur un autre exercice', !!btn2,
        'aucun bouton .tables-btn sur ' + P.tablesAide.reste);
      if(btn2){
        await btn2.click();
        await s.page.waitForTimeout(300);
        /* Cliquer SUR L'EXERCICE, pas sur la fenêtre. Le banc visait « .enonce,
           sinon l'écran entier » : en Première l'énoncé tombe à côté de la
           fenêtre et le clic passait, en Seconde il n'y en a pas à cet
           endroit-là et Playwright visait le CENTRE de l'écran — c'est-à-dire
           sous la fenêtre, qui interceptait. Trente secondes d'attente, puis un
           échec qui accusait la page alors que le banc n'avait jamais cliqué
           l'exercice. On calcule donc un point de l'écran hors du rectangle de
           la fenêtre, et on clique là. */
        const point = await s.page.evaluate(() => {
          const sc = document.querySelector('.screen.on');
          const ov = document.querySelector('#tablesOverlay .tables-card') || document.getElementById('tablesOverlay');
          if(!sc || !ov) return null;
          const a = sc.getBoundingClientRect(), b = ov.getBoundingClientRect();
          /* on descend le long du bord gauche de l'écran jusqu'à sortir de la
             fenêtre : elle s'ouvre en haut à droite, la place est en bas */
          const x = a.left + Math.min(40, a.width / 4);
          for(let y = a.top + 8; y < Math.min(a.bottom, window.innerHeight) - 4; y += 12){
            if(x < b.left || x > b.right || y < b.top || y > b.bottom) return { x: x, y: y };
          }
          return null;
        });
        if(!point){
          verifier('ailleurs, elle reste ouverte à côté de l\'exercice', false,
            'aucun point de l\'écran n\'échappe à la fenêtre : le contrôle ne mesure rien');
        } else {
          await s.page.mouse.click(point.x, point.y);
          await s.page.waitForTimeout(250);
          const reste = await s.page.evaluate(() =>
            !!document.getElementById('tablesOverlay').classList.contains('on'));
          verifier('ailleurs, elle reste ouverte à côté de l\'exercice', reste,
            'elle s\'est refermée : la fenêtre flottante ne sert plus à rien');
        }
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 ter. une opération posée est-elle vraiment alignée ? =====
       La grille est en flexbox à cellules de largeur fixe : une rangée qui n'a
       pas le même nombre de cellules que les autres décale le signe et les
       colonnes. Le contrôle structurel compte les cellules ; lui seul mesure
       les POSITIONS réelles, c'est-à-dire ce que l'élève voit. */
    titre('6 ter. L\'OPÉRATION POSÉE EST ALIGNÉE');
    if(!P.operationPosee){
      ignorer('les colonnes de l\'opération posée s\'alignent',
        'ce niveau n\'a pas d\'addition-soustraction posée');
    } else {
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.operationPosee.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const vu = await s.page.evaluate(hote => {
        const h = document.getElementById(hote);
        if(!h) return { absent: true };
        const rangees = [...h.querySelectorAll('.mp-row')];
        /* Le centre de chaque cellule, rangée par rangée : deux rangées bien
           posées ont EXACTEMENT les mêmes centres de colonnes. */
        const centres = rangees.map(r => [...r.children].map(c => {
          const b = c.getBoundingClientRect();
          return Math.round(b.left + b.width / 2);
        }));
        const ref = centres[0] || [];
        const decales = centres.filter(c =>
          c.length !== ref.length || c.some((x, i) => Math.abs(x - ref[i]) > 1)).length;
        /* La case des unités du résultat doit tomber sous le chiffre des unités
           du nombre du haut : c'est la définition d'une opération posée. */
        const der = r => { const k = [...r.children]; return k[k.length - 1].getBoundingClientRect(); };
        const uHaut = der(rangees[1]), uRes = der(rangees[rangees.length - 1]);
        /* Une ADDITION a quatre rangées — retenues, deux nombres, résultat ;
           une SOUSTRACTION n'en a que trois : ses retenues ne sont pas sur une
           rangée à part, elles s'écrivent devant les chiffres. Exiger 4 partout
           faisait rougir le banc sur une soustraction parfaitement dessinée. */
        const q = test.questions[test.idx];
        return { absent:false, rangees: rangees.length, attendu: q.plus ? 4 : 3, decales,
                 ecartUnites: Math.round(Math.abs((uHaut.left+uHaut.width/2) - (uRes.left+uRes.width/2))) };
      }, P.operationPosee.hote);
      verifier('l\'opération posée est bien dessinée', !vu.absent && vu.rangees === vu.attendu,
        vu.absent ? 'aucune grille trouvée' : vu.rangees + ' rangée(s) au lieu de ' + vu.attendu);
      verifier('toutes les rangées ont les mêmes colonnes', !vu.absent && vu.decales === 0,
        vu.decales + ' rangée(s) décalée(s) — le signe et les colonnes ne tombent plus en face');
      verifier('la case des unités tombe sous le chiffre des unités',
        !vu.absent && vu.ecartUnites <= 1, 'écart de ' + vu.ecartUnites + ' px');
      await s.nav.close(); s = null;
    }

    /* ===== 6 quater. le cadre de pose reste resserré =====
       Un cadre prend la largeur de son plus large enfant. Ici l'énoncé faisait
       700 à 830 px sur une seule ligne, alors que l'opération qu'il encadre
       n'en fait que 144 à 190 : le cadre était quatre fois trop large. La
       largeur est donc bornée, l'énoncé se replie, et le cadre se resserre.
       Aucun banc hors navigateur ne mesure une largeur RENDUE — celle-ci
       dépend de la police, du repli au mot et de la fenêtre. */
    titre('6 quater. LE CADRE DE POSE RESTE RESSERRÉ');
    if(!P.cadrePose){
      ignorer('le cadre de la pose ne suit pas la longueur de son énoncé',
        'ce niveau n\'a pas de cadre de pose inséré');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      for(const [exo, hote] of P.cadrePose.exercices){
        await s.page.evaluate(i => openTest(i), exo);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="train"]');
        await s.page.waitForTimeout(900);
        const vu = await s.page.evaluate(h => {
          const host = document.getElementById(h);
          const o = host && host.querySelector('.pt-outil');
          if(!o) return { absent: true };
          const op = o.querySelector('.mp-op');
          const ro = o.getBoundingClientRect(), rp = op ? op.getBoundingClientRect() : null;
          return { absent:false, cadre: Math.round(ro.width),
                   deborde: !!rp && (rp.left < ro.left - 1 || rp.right > ro.right + 1),
                   page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
        }, hote);
        verifier(exo + ' : le cadre de pose est là', !vu.absent, 'aucun .pt-outil dans #' + hote);
        verifier(exo + ' : il reste resserré', !vu.absent && vu.cadre <= P.cadrePose.largeurMax,
          'largeur rendue ' + vu.cadre + ' px (maximum ' + P.cadrePose.largeurMax + ') — l\'énoncé l\'étire de nouveau');
        verifier(exo + ' : l\'opération tient dedans', !vu.absent && !vu.deborde,
          'la pose déborde du cadre');
        verifier(exo + ' : la page ne défile pas en largeur', !vu.absent && !vu.page,
          'débordement horizontal de la page');
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 quater ter. les trois formes du tableau de variation, et chacune tient dans sa carte =====
       Demande de Turquet (septembre 2026) : « dans l'exercice 2.15 je veux
       avoir 3 variations différentes ». Une séance pose donc trois graphiques,
       un par forme (2, 3 et 4 segments). Le banc jsdom tient le TIRAGE ; lui
       seul ne voit pas ce que le tableau à quatre segments a montré sur
       capture : 617 px dans une carte de 600, la borne et la dernière case
       cachées derrière le défilement du .lv-tblwrap. On compte les formes sur
       les flèches RENDUES, et on mesure chaque tableau contre son cadre. */
    titre('6 quater ter. LES TROIS FORMES DU TABLEAU DE VARIATION TIENNENT DANS LEUR CARTE');
    if(!P.grandsTableaux){
      ignorer('les trois formes du tableau de variation tiennent dans leur carte',
        'ce niveau n\'a pas l\'exercice des deux tableaux en grand');
    } else {
      const G = P.grandsTableaux;
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), G.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const n = await s.page.evaluate(() => test.questions.length);
      verifier('une séance d\'entraînement pose trois graphiques', n === 3, n + ' graphique(s)');
      const formes = [], debords = [];
      for(let i = 0; i < n; i++){
        const vu = await s.page.evaluate(async ({ i, corps, rendu }) => {
          test.idx = i; window[rendu]();
          await new Promise(r => setTimeout(r, 400));          /* la géométrie des flèches se pose après le rendu */
          const c = document.getElementById(corps);
          const card = c.closest('.card') || c;
          const cr = card.getBoundingClientRect();
          const fleches = c.querySelectorAll('select.vt-sel2').length;
          const tables = [...c.querySelectorAll('.lv-tblwrap')].map(w => {
            const t = w.querySelector('table'); const tr = t ? t.getBoundingClientRect() : cr;
            return { cache: w.scrollWidth > w.clientWidth + 1, sort: tr.right > cr.right + 1, table: Math.round(tr.width), cadre: w.clientWidth };
          });
          return { fleches, tables, page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
        }, { i, corps: G.corps, rendu: G.rendu });
        formes.push(vu.fleches);
        vu.tables.forEach((t, k) => { if(t.cache || t.sort) debords.push('graphique ' + (i + 1) + ', tableau ' + (k + 1) + ' : ' + t.table + ' px dans ' + t.cadre); });
        if(vu.page) debords.push('graphique ' + (i + 1) + ' : la page défile en largeur');
      }
      verifier('les trois formes du tableau sont rendues, chacune une fois (' + G.formes.join(', ') + ' segments)',
        formes.slice().sort().join(',') === G.formes.slice().sort().join(','),
        'flèches rendues par graphique : ' + formes.join(', '));
      verifier('aucun tableau ne déborde de sa carte ni ne se cache derrière un défilement', debords.length === 0,
        debords.join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies quinquies. LA SYNTHÈSE : un seul dessin, dix questions =====
       Demande de Turquet (septembre 2026, fiche « Synthèse fonction »). jsdom
       tient le tirage et le juge ; seul un navigateur sait ce que le dessin
       MONTRE — la courbe tracée sur son seul domaine, ses deux bouts marqués,
       la droite de g par-dessus — et où une ligne se replie : une solution
       coupée en deux se lirait comme deux solutions (la leçon du 2.18). Les
       mesures se font contre les GRADUATIONS RENDUES, jamais sur une
       coordonnée recopiée (la leçon du schéma des intervalles). */
    titre('6 vicies quinquies. LA SYNTHÈSE : UN SEUL DESSIN, DIX QUESTIONS');
    if(!P.syntheseFonction){
      ignorer('la synthèse : la courbe s\'arrête à son domaine, et la ligne de solution ne se replie pas',
        'ce niveau n\'a pas l\'exercice de synthèse');
    } else {
      const SY = P.syntheseFonction;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), SY.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      /* le DESSIN : la courbe part de la borne gauche et s'arrête à la borne
         droite, les deux bouts sont marqués, et la droite de g est là */
      const vu = await s.page.evaluate(() => {
        const q = test.questions[test.idx], svg = document.querySelector('#synGraph svg');
        if(!svg) return { absent: true };
        const vx = [];
        svg.querySelectorAll('line.lv-grid').forEach(l => {
          if(l.getAttribute('x1') === l.getAttribute('x2')) vx.push(parseFloat(l.getAttribute('x1')));
        });
        vx.sort((a, b) => a - b);
        const path = svg.querySelector('path.lv-curve');
        const d = path ? path.getAttribute('d') : '';
        const nb = d.replace(/[A-Za-z]/g, ' ').trim().split(/\s+/).map(Number).filter(v => !isNaN(v));
        const xs = nb.filter((v, i) => i % 2 === 0);
        const gx = (x) => vx[x + 6];                     /* la graduation RENDUE */
        return { absent: false,
                 a: q.ia - 6, b: q.ib - 6, grads: vx.length,
                 debut: Math.min.apply(null, xs), fin: Math.max.apply(null, xs),
                 attDebut: gx(q.ia - 6), attFin: gx(q.ib - 6),
                 bouts: svg.querySelectorAll('circle.ifg-bout').length,
                 droite: svg.querySelectorAll('line.eqg-g').length,
                 legende: !!document.querySelector('#synLeg .fg-leg'),
                 largeur: Math.round(svg.getBoundingClientRect().width) };
      });
      verifier('la courbe de la synthèse est tracée sur son SEUL ensemble de définition, ses deux bouts marqués',
        !vu.absent && vu.grads === 13 && vu.bouts === 2 && vu.droite === 1 && vu.legende
          && Math.abs(vu.debut - vu.attDebut) <= 2 && Math.abs(vu.fin - vu.attFin) <= 2,
        vu.absent ? 'aucun dessin' : (vu.grads !== 13 ? vu.grads + ' graduations' :
          vu.bouts !== 2 ? vu.bouts + ' bout(s) marqué(s)' :
          vu.droite !== 1 ? 'la droite de g n\'est pas dessinée' :
          !vu.legende ? 'la légende f/g manque' :
          'la courbe va de ' + vu.debut + ' à ' + vu.fin + ' px pour un domaine [' + vu.a + ' ; ' + vu.b
            + '] qui tombe à ' + vu.attDebut + ' et ' + vu.attFin + ' px'));
      /* les QUATRE parties : on remplit la copie juste, on CLIQUE « Valider »,
         et on relit ce que la page a peint — la leçon des sommes : les
         contrôles lisaient le verdict, l'élève regarde la couleur. */
      const parties = [];
      for(let p = 0; p < 4; p++){
        const r = await s.page.evaluate(async () => {
          const q = test.questions[test.idx];
          synCheckPart(q).subs.forEach(s2 => { const el = document.getElementById(s2.id); if(el && s2.val != null) el.value = String(s2.val); });
          document.getElementById('synValidate').click();
          await new Promise(r2 => setTimeout(r2, 250));
          const subs = synCheckPart(q).subs;
          const peintes = subs.filter(s2 => { const el = document.getElementById(s2.id); return el && (el.className || '').indexOf('ok') >= 0; }).length;
          /* la ligne de solution ne se REPLIE pas : une seule rangée de boîtes */
          const lignes = [...document.querySelectorAll('#synBody .img-line')].map(l => ({
            boites: l.getClientRects().length,
            defile: l.scrollWidth > l.clientWidth + 1
          }));
          const corps = document.getElementById('synBody'), card = corps.closest('.card');
          const tbl = [...corps.querySelectorAll('.lv-tblwrap')].map(wr => ({
            cache: wr.scrollWidth > wr.clientWidth + 1,
            sort: wr.getBoundingClientRect().right > card.getBoundingClientRect().right + 1
          }));
          const mark = (document.getElementById('synMark').textContent || '').trim();
          return { part: q.part, n: subs.length, peintes, mark, lignes, tbl,
                   page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
        });
        parties.push(r);
        if(p < 3){
          await s.page.evaluate(() => document.getElementById('synValidate').click());
          await s.page.waitForTimeout(400);
        }
      }
      const rates = parties.filter(r => r.mark !== '✓' || r.peintes !== r.n);
      verifier('la copie juste passe au vert sur les quatre parties de la synthèse',
        rates.length === 0,
        rates.map(r => 'partie ' + r.part + ' : ' + r.peintes + '/' + r.n + ' peintes, marque « ' + r.mark + ' »').join(' | '));
      const replis = [];
      parties.forEach(r => {
        r.lignes.forEach((l, i) => { if(l.boites > 1) replis.push('partie ' + r.part + ', ligne ' + (i + 1) + ' repliée en ' + l.boites + ' morceaux');
                                     if(l.defile) replis.push('partie ' + r.part + ', ligne ' + (i + 1) + ' défile'); });
        r.tbl.forEach((t, i) => { if(t.cache || t.sort) replis.push('partie ' + r.part + ', tableau ' + (i + 1) + ' hors de sa carte'); });
        if(r.page) replis.push('partie ' + r.part + ' : la page défile en largeur');
      });
      verifier('aucune ligne de solution ne se replie, aucun tableau ne sort de sa carte',
        replis.length === 0, replis.slice(0, 3).join(' | '));
      verifier('la synthèse ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 quater quater. le maximum et le minimum : le dessin lisible, et
       l'encadrement d'un seul tenant =====
       Le banc jsdom tient le tirage, le jugement et la méthode dessinée — il
       lit le SVG comme une chaîne. Ce qu'il ne voit pas : un CSS perdu qui
       rendrait le grand dessin minuscule sans qu'aucune erreur ne se lève, et
       « □ ≤ f (x) ≤ □ » coupé en deux par un repli, qui se lirait comme deux
       morceaux de phrase (la leçon des unions du 2.11, mesurée cette fois sur
       une SPAN et non sur une rangée). Et les deux anneaux verts de la
       correction sont mesurés contre les GRADUATIONS du dessin rendu : aucune
       coordonnée recopiée, une échelle qui changerait resterait mesurée juste. */
    titre('6 quater quater. LE MAXIMUM ET LE MINIMUM : LE DESSIN ET L\'ENCADREMENT');
    if(!P.maxMin){
      ignorer('le maximum et le minimum : le dessin lisible et l\'encadrement d\'un seul tenant',
        'ce niveau n\'a pas l\'exercice du maximum et du minimum');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.maxMin.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const vu = await s.page.evaluate(() => {
        const svg = document.querySelector('#mmxGraph svg');
        const enc = document.querySelector('.mmx-enc');
        const r = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
        return {
          dessin: { l: Math.round(r.width), h: Math.round(r.height) },
          /* getClientRects() rend UNE boîte par ligne : deux boîtes = la
             ligne s'est repliée entre les deux cases de l'encadrement */
          lignesEnc: enc ? enc.getClientRects().length : -1,
          page: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });
      verifier('le grand dessin est rendu à une taille lisible',
        vu.dessin.l >= 400 && vu.dessin.h >= 200, vu.dessin.l + '×' + vu.dessin.h + ' px');
      verifier('l\'encadrement « … ≤ f (x) ≤ … » tient sur une seule ligne',
        vu.lignesEnc === 1, vu.lignesEnc + ' ligne(s) rendue(s)');
      verifier('la page ne défile pas en largeur sur cet écran', !vu.page, 'la page déborde');
      /* la correction : les deux anneaux verts tombent SUR les graduations du
         maximum et du minimum, mesurés dans le dessin rendu */
      const corr = await s.page.evaluate(async () => {
        const q = test.questions[test.idx], r = mmxAns(q);
        ['mmx-M','mmx-xM','mmx-m','mmx-xm','mmx-lo','mmx-hi'].forEach((id, i) => {
          document.getElementById(id).value = String([r.M, r.xM, r.m, r.xm, r.m, r.M][i]);
        });
        submitMMX();
        await new Promise(x => setTimeout(x, 250));
        const svg = document.querySelector('#mmxGraph svg');
        const vx = [], hy = [];
        svg.querySelectorAll('line.lv-grid').forEach(l => {
          const b = l.getBoundingClientRect();
          if(l.getAttribute('x1') === l.getAttribute('x2')) vx.push((b.left + b.right) / 2);
          else hy.push((b.top + b.bottom) / 2);
        });
        vx.sort((a, b) => a - b); hy.sort((a, b) => a - b);   /* hy[0] = la graduation +6 */
        const anneaux = [...svg.querySelectorAll('.pim-sol')].map(c => {
          const b = c.getBoundingClientRect();
          return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2, taille: Math.round(b.width) };
        });
        const ecart = (att, obt) => Math.abs(att - obt);
        const vise = [{ x: vx[r.xM + 6], y: hy[6 - r.M] }, { x: vx[r.xm + 6], y: hy[6 - r.m] }];
        const loin = vise.filter(p => !anneaux.some(a => ecart(a.x, p.x) < 3 && ecart(a.y, p.y) < 3));
        return { n: anneaux.length, minuscules: anneaux.filter(a => a.taille < 8).length,
                 loin: loin.length, note: test.score, grille: vx.length + '/' + hy.length };
      });
      verifier('la correction pose les deux anneaux verts sur les graduations du maximum et du minimum',
        corr.n === 2 && corr.loin === 0 && corr.minuscules === 0,
        corr.n + ' anneau(x), ' + corr.loin + ' hors graduation, ' + corr.minuscules + ' minuscule(s), grille ' + corr.grille);
      verifier('la copie juste vaut les six cases de la question', corr.note === 6, 'note ' + corr.note);
      await s.nav.close(); s = null;
    }

    /* ===== 6 quater quinquies. le tableau de variation se LIT =====
       Le banc jsdom tient le tirage, le jugement et la structure du tableau —
       il lit les positions dans l'attribut « style ». Ce qu'il ne voit pas :
       un tableau qui déborde de sa carte ou se cache derrière un défilement
       (la leçon du 2.15), et des valeurs RENDUES qui ne monteraient pas avec
       leurs flèches — jsdom n'a pas de mise en page, un « top » écrit n'est
       pas un « top » rendu. */
    titre('6 quater quinquies. LE TABLEAU DE VARIATION SE LIT');
    if(!P.maxMinTableau){
      ignorer('le tableau de variation se lit, et tient dans sa carte',
        'ce niveau n\'a pas l\'exercice du maximum et du minimum sur tableau');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.maxMinTableau.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const vu = await s.page.evaluate(() => {
        const hote = document.getElementById('mmtTable');
        const card = hote.closest('.card') || hote;
        const t = hote.querySelector('table');
        const cr = card.getBoundingClientRect(), tr = t ? t.getBoundingClientRect() : cr;
        const q = test.questions[test.idx], a = gsvAnalyze(q.pts);
        /* les valeurs RENDUES : une flèche qui monte doit poser sa valeur de
           départ PLUS BAS que celle d'arrivée */
        const mil = j => { const e = document.getElementById('mmt-v-val-' + j);
          if(!e) return null; const r = e.getBoundingClientRect();
          return r.width && r.height ? (r.top + r.bottom) / 2 : null; };
        const travers = [];
        a.segments.forEach((sg, i) => {
          const y0 = mil(i), y1 = mil(i + 1);
          if(y0 == null || y1 == null){ travers.push('valeur ' + i + ' invisible'); return; }
          const monte = sg.dir === 'croissante';
          if(monte ? !(y0 > y1) : !(y0 < y1))
            travers.push('segment ' + i + ' (' + sg.dir + ') : ' + Math.round(y0) + ' puis ' + Math.round(y1));
        });
        const enc = document.querySelector('#scr-mmt .mmx-enc');
        return {
          cases: hote.querySelectorAll('input, select').length,
          fleches: hote.querySelectorAll('.vt-shaft').length, segments: a.segments.length,
          travers: travers,
          cache: hote.scrollWidth > hote.clientWidth + 1,
          sort: tr.right > cr.right + 1,
          largeur: Math.round(tr.width), cadre: hote.clientWidth,
          lignesEnc: enc ? enc.getClientRects().length : -1,
          page: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });
      verifier('le tableau est rendu rempli, sans une seule case à remplir',
        vu.cases === 0, vu.cases + ' case(s) de saisie dans le tableau');
      verifier('chaque segment a sa flèche tracée',
        vu.fleches === vu.segments, vu.fleches + ' flèche(s) pour ' + vu.segments + ' segment(s)');
      verifier('les valeurs rendues montent et descendent avec leurs flèches',
        vu.travers.length === 0, vu.travers.join(' | '));
      verifier('le tableau ne déborde pas de sa carte ni ne se cache derrière un défilement',
        !vu.cache && !vu.sort && !vu.page, vu.largeur + ' px dans ' + vu.cadre);
      verifier('l\'encadrement « … ≤ f (x) ≤ … » tient sur une seule ligne',
        vu.lignesEnc === 1, vu.lignesEnc + ' ligne(s) rendue(s)');
      await s.nav.close(); s = null;
    }

    /* ===== 6 quater sexies. l'union « S = [ ; ] ∪ [ ; ] » d'un seul tenant =====
       {tableau-equations} : le banc jsdom tient le tirage, la cohérence des
       abscisses données et le jugement. Ce qu'il ne voit pas : la ligne de
       réponse à huit cases qui se REPLIERAIT — une solution coupée en deux
       se lit comme deux solutions (la leçon du 2.11) — ou qui défilerait à
       la largeur d'un écran d'ordinateur, et le tableau qui déborderait de
       sa carte. Seul un navigateur sait où une rangée se replie. Il CHOISIT
       aussi les huit cases pour de vrai et relit les couleurs. */
    titre('6 quater sexies. L\'UNION D\'UN SEUL TENANT');
    if(!P.tableauEquations){
      ignorer('l\'union à huit cases tient sur une seule rangée',
        'ce niveau n\'a pas l\'exercice des équations sur tableau de variation');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.tableauEquations.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      /* la première question (les comptes) : on la joue juste, par les
         fonctions de la page, puis on passe à l'inéquation */
      const vu1 = await s.page.evaluate(() => {
        const q = test.questions[0], nodes = tveNoeuds(q.pts);
        q.ks.forEach((k, i) => { document.getElementById('tve-n-' + i).value = String(tveNbSol(nodes, k)); });
        submitTVE();
        const hote = document.getElementById('tveTable');
        return { score: test.score, cases: hote.querySelectorAll('input, select').length,
                 fleches: hote.querySelectorAll('.vt-shaft').length };
      });
      verifier('les quatre comptes justes valent 4', vu1.score === 4, 'note ' + vu1.score);
      verifier('le tableau est rendu rempli, sans une seule case à remplir', vu1.cases === 0, vu1.cases + ' case(s)');
      verifier('les trois flèches sont tracées', vu1.fleches === 3, vu1.fleches + ' flèche(s)');
      await s.page.click('#tveValidate');
      await s.page.waitForTimeout(500);
      const vu2 = await s.page.evaluate(() => {
        const sels = Array.from(document.querySelectorAll('#tveBody .tve-sol select'));
        const tops = sels.map(e => Math.round(e.getBoundingClientRect().top));
        const wrap = document.querySelector('#tveBody .tve-solwrap');
        const hote = document.getElementById('tveTable'), card = hote.closest('.card');
        const t = hote.querySelector('table').getBoundingClientRect(), cr = card.getBoundingClientRect();
        return { n: sels.length, tops: tops, unLigne: new Set(tops).size === 1,
                 defile: wrap.scrollWidth > wrap.clientWidth + 1, largeur: wrap.scrollWidth, cadre: wrap.clientWidth,
                 tableSort: t.right > cr.right + 1 || hote.scrollWidth > hote.clientWidth + 1,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 type: test.questions[test.idx].type };
      });
      verifier('la seconde question est une inéquation à huit cases', vu2.type === 'ineq' && vu2.n === 8, vu2.type + ', ' + vu2.n + ' case(s)');
      verifier('les huit cases de l\'union sont sur une seule rangée', vu2.unLigne, 'hauts : ' + vu2.tops.join(','));
      verifier('la rangée de l\'union ne défile pas à 1400 px', !vu2.defile && !vu2.page, vu2.largeur + ' px dans ' + vu2.cadre);
      verifier('le tableau ne déborde pas de sa carte', !vu2.tableSort, '');
      /* on CHOISIT la solution pour de vrai, dans les listes */
      const bonnes = await s.page.evaluate(() => {
        const q = test.questions[test.idx], S = tveSolve(tveNoeuds(q.pts), q.k, q.op, q.cr);
        const spec = iv => [iv.aOuv ? ']' : '[', String(iv.a), String(iv.b), iv.bOuv ? '[' : ']'];
        return spec(S[0]).concat(spec(S[1]));
      });
      for(let i = 0; i < 8; i++) await s.page.selectOption('#' + ['tve-co1','tve-b1','tve-b2','tve-cf1','tve-co2','tve-b3','tve-b4','tve-cf2'][i], bonnes[i]);
      await s.page.click('#tveValidate');
      await s.page.waitForTimeout(400);
      const vu3 = await s.page.evaluate(() => ({
        ok: document.querySelectorAll('#tveBody select.ok').length, score: test.score,
        bleu: getComputedStyle(document.querySelector('#tveBody select.ok') || document.body).borderColor
      }));
      verifier('les huit cases choisies justes sont peintes ok et valent 8', vu3.ok === 8 && vu3.score === 12, vu3.ok + ' ok, note ' + vu3.score);
      await s.nav.close(); s = null;
    }

    /* ===== 6 quater septies. l'affirmation et sa justification d'un seul tenant =====
       {tableau-vrai-faux} : le banc jsdom tient le tirage, la décidabilité
       et le jugement. Ce qu'il ne voit pas : la rangée d'une affirmation —
       « 1) f (−5) est positif. [Vrai] car sur [ −6 ; −1 ], la fonction est
       comprise entre [ −4 ] et [ 1 ] » — qui se REPLIERAIT, la justification
       tombant sous son affirmation, ou qui défilerait à la largeur d'un
       écran d'ordinateur, surtout une fois les badges de la correction
       posés. Seul un navigateur sait où une rangée se replie. Il CHOISIT
       aussi les trente-deux cases pour de vrai, sur les deux pages — trois
       fausses exprès —, et relit les couleurs et la note. */
    titre('6 quater septies. L\'AFFIRMATION ET SA JUSTIFICATION D\'UN SEUL TENANT');
    if(!P.tableauVraiFaux){
      ignorer('chaque affirmation tient sur une seule rangée',
        'ce niveau n\'a pas l\'exercice du vrai ou faux sur tableau de variation');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.tableauVraiFaux.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const mesurer = () => s.page.evaluate(() => {
        const lignes = Array.from(document.querySelectorAll('#tvfBody .tvf-ligne'));
        const replis = lignes.map((l, i) => {
          const tops = Array.from(l.querySelectorAll('select, .tvf-aff, .tvf-num')).map(e => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2));
          return (Math.max(...tops) - Math.min(...tops) > 8) ? (i + 1) : 0;
        }).filter(Boolean);
        const defile = Array.from(document.querySelectorAll('#tvfBody .tvf-wrap')).filter(w => w.scrollWidth > w.clientWidth + 1).length;
        const hote = document.getElementById('tvfTable'), card = hote.closest('.card');
        const t = hote.querySelector('table').getBoundingClientRect(), cr = card.getBoundingClientRect();
        return { n: lignes.length, sels: document.querySelectorAll('#tvfBody select').length, replis, defile,
                 tableSort: t.right > cr.right + 1 || hote.scrollWidth > hote.clientWidth + 1,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 cases: hote.querySelectorAll('input, select').length, fleches: hote.querySelectorAll('.vt-shaft').length };
      });
      const vu1 = await mesurer();
      verifier('la première page pose quatre affirmations d encadrement à vingt cases (5 + 5 + 5 + 5)', vu1.n === 4 && vu1.sels === 20, vu1.n + ' rangée(s), ' + vu1.sels + ' case(s)');
      verifier('le tableau est rendu rempli, ses trois flèches tracées', vu1.cases === 0 && vu1.fleches === 3, vu1.cases + ' case(s), ' + vu1.fleches + ' flèche(s)');
      verifier('chaque affirmation tient sur une seule rangée', vu1.replis.length === 0, 'rangée(s) repliée(s) : ' + vu1.replis.join(','));
      verifier('aucune rangée ne défile à 1400 px, ni la page', vu1.defile === 0 && !vu1.page, vu1.defile + ' rangée(s) qui défile(nt)');
      verifier('le tableau ne déborde pas de sa carte', !vu1.tableSort, '');
      /* on CHOISIT les réponses pour de vrai, dans les listes, sur les deux
         pages — et sur la première, TROIS cases de la rangée 1 sont choisies
         FAUSSES exprès : ce sont les badges verts de la correction qui
         élargissent une rangée, et une rangée d'encadrement (cinq cases) est
         la plus longue de l'écran. Une rangée juste ne mesure rien de cela. */
      const jouer = async (fautes) => {
        const bonnes = await s.page.evaluate(() => {
          const q = test.questions[test.idx], nodes = tvfNoeuds(q.pts);
          /* la justification suit le TYPE : l'encadrement pour un signe ou une
             comparaison à k, le sens pour une comparaison de deux images */
          return q.aff.map((af, j) => { const v = tvfVerite(nodes, af);
            return af.t === 'cmp'
              ? [['tvf-vf-' + j, v.vrai ? 'V' : 'F'], ['tvf-s-' + j, v.sens === 'croissante' ? 'c' : 'd'], ['tvf-a-' + j, String(v.a)], ['tvf-b-' + j, String(v.b)]]
              : [['tvf-vf-' + j, v.vrai ? 'V' : 'F'], ['tvf-a-' + j, String(v.a)], ['tvf-b-' + j, String(v.b)], ['tvf-m-' + j, String(v.lo)], ['tvf-M-' + j, String(v.hi)]]; }).flat();
        });
        for(const [id, val] of bonnes){
          let choix = val;
          if((fautes || []).indexOf(id) >= 0){
            const autres = await s.page.$$eval('#' + id + ' option', (os, v) => os.map(o => o.value).filter(x => x && x !== v), val);
            choix = autres[0];
          }
          await s.page.selectOption('#' + id, choix);
        }
        await s.page.click('#tvfValidate');
        await s.page.waitForTimeout(400);
        return s.page.evaluate(() => ({ ok: document.querySelectorAll('#tvfBody select.ok').length, bad: document.querySelectorAll('#tvfBody select.bad').length, badges: document.querySelectorAll('#tvfBody .mf-cor').length, score: test.score, idx: test.idx }));
      };
      const j1 = await jouer(['tvf-vf-0', 'tvf-a-0', 'tvf-m-0']);
      verifier('dix-sept cases justes et trois fausses sur la première page : 17 ok, 3 bad, note 17', j1.ok === 17 && j1.bad === 3 && j1.score === 17, j1.ok + ' ok, ' + j1.bad + ' bad, note ' + j1.score);
      const vuC = await mesurer();
      verifier('la rangée corrigée porte ses trois badges verts d\'un seul tenant, sans défiler', j1.badges === 3 && vuC.replis.length === 0 && vuC.defile === 0 && !vuC.page, j1.badges + ' badge(s), repli : ' + vuC.replis.join(',') + ', ' + vuC.defile + ' rangée(s) qui défile(nt)');
      await s.page.click('#tvfValidate');
      await s.page.waitForTimeout(500);
      const vu2 = await mesurer();
      const num = await s.page.evaluate(() => (document.getElementById('tvfBody').textContent.indexOf('5)') >= 0));
      verifier('la seconde page pose trois affirmations numérotées à la suite, d\'un seul tenant', vu2.n === 3 && vu2.sels === 12 && num && vu2.replis.length === 0, vu2.n + ' rangée(s), ' + vu2.sels + ' case(s), 5) ' + (num ? 'présent' : 'absent') + ', repli : ' + vu2.replis.join(','));
      const j2 = await jouer();
      verifier('les douze cases justes de la seconde page (trois comparaisons, le sens) portent la note à 29', j2.ok === 12 && j2.score === 29, j2.ok + ' ok, note ' + j2.score);
      await s.nav.close(); s = null;
    }

    /* ===== 6 quater octies. les cinq tableaux du QCM écrivent leurs images,
       et chacun tient dans sa carte =====
       Demande de Turquet (septembre 2026) : « il faudrait que la valeur des
       images sur les extrémités des flèches soient affichées ». Le banc jsdom
       tient le tirage, les cinq natures et le jugement — il lit le rendu
       comme une chaîne. Ce qu'il ne voit pas, c'est la LEÇON DU 2.15 : un
       tableau de l'exercice va jusqu'à 617 px, et une carte de la grille à
       deux colonnes n'en offre autant que si la fenêtre est large — sinon il
       se cache derrière le défilement de son conteneur à overflow-x:auto, sans
       que rien ne le signale. C'est ainsi qu'il a trouvé, le jour où il a été
       écrit, 617 px de tableau dans 280 px de carte sur les CINQ cartes des
       trois questions — un défaut qui vivait en ligne depuis le premier jour.
       On mesure donc chaque tableau contre sa carte, sur les trois questions, et
       on exige que chaque image soit RENDUE : un CSS perdu sur .vt-lect les
       rendrait invisibles sans qu'aucune erreur ne se lève, et l'exercice
       reviendrait à celui d'avant la demande. */
    titre('6 quater octies. LES CINQ TABLEAUX ÉCRIVENT LEURS IMAGES, ET TIENNENT DANS LEUR CARTE');
    if(!P.qcmTableauVariation){
      ignorer('les cinq tableaux écrivent leurs images et tiennent dans leur carte',
        'ce niveau n\'a pas le QCM du tableau de variation');
    } else {
      const Q = P.qcmTableauVariation;
      /* DEUX largeurs, et c'est la seconde qui tient le bord : à 1400 px les
         cinq cartes tiennent côte à côte, à 1280 — l'écran d'un ordinateur
         portable ordinaire — deux colonnes ne peuvent plus porter un tableau
         de 617 px, et la grille doit passer à UNE colonne. Mesurer la seule
         largeur confortable laisserait le point de bascule libre de dériver. */
      for(const L of [1400, 1280]){
        s = await ouvrir(chromium, ml, { viewport: { width: L, height: 900 } });
        await connecter(s.page);
        await s.page.evaluate(id => openTest(id), Q.exercice);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="train"]');
        await s.page.waitForTimeout(900);
        const n = await s.page.evaluate(() => test.questions.length);
        const muets = [], manquantes = [], etroits = [];
        for(let i = 0; i < n; i++){
          const vu = await s.page.evaluate(async i => {
            test.idx = i; renderVtq();
            await new Promise(r => setTimeout(r, 300));
            return [...document.querySelectorAll('#vtqHost .vtq-carte')].map(c => {
              const cr = c.getBoundingClientRect();
              const wrap = c.querySelector('div[style*="overflow-x"]');
              const t = c.querySelector('table.lv-vartbl2');
              const tr = t ? t.getBoundingClientRect() : { width: 0, right: 0 };
              /* une image RENDUE : une boîte non nulle, pas seulement une balise */
              const vals = [...c.querySelectorAll('.vt-lect')].filter(e => {
                const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.textContent.trim() !== '';
              }).length;
              return { lettre: (c.querySelector('.itq-lettre') || {}).textContent || '?',
                       x: c.querySelectorAll('td.vnx').length, vals,
                       table: Math.round(tr.width), cadre: wrap ? wrap.clientWidth : Math.round(cr.width),
                       cache: !!wrap && wrap.scrollWidth > wrap.clientWidth + 1,
                       sort: tr.right > cr.right + 1 };
            });
          }, i);
          if(vu.length !== Q.cartes) manquantes.push('question ' + (i + 1) + ' : ' + vu.length + ' carte(s) au lieu de ' + Q.cartes);
          vu.forEach(c => {
            if(c.vals !== c.x) muets.push('question ' + (i + 1) + ', carte ' + c.lettre + ' : ' + c.vals + ' image(s) rendue(s) pour ' + c.x + ' abscisse(s)');
            if(c.cache || c.sort) etroits.push('question ' + (i + 1) + ', carte ' + c.lettre + ' : ' + c.table + ' px dans ' + c.cadre);
          });
        }
        const page = await s.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        verifier('à ' + L + ' px, les ' + Q.cartes + ' cartes sont rendues sur chaque question', manquantes.length === 0, manquantes.join(' | '));
        verifier('à ' + L + ' px, chaque tableau écrit une image à chaque extrémité de flèche', muets.length === 0, muets.join(' | '));
        verifier('à ' + L + ' px, aucun tableau ne déborde de sa carte ni ne se cache derrière un défilement', etroits.length === 0, etroits.join(' | '));
        verifier('à ' + L + ' px, la page ne défile pas en largeur', !page, 'la page déborde');
        verifier('à ' + L + ' px, le QCM du tableau de variation ne lève aucune erreur JavaScript', s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
        await s.nav.close(); s = null;
      }
    }

    /* ===== 6 quater bis. les cases d'une fraction grandissent avec la saisie =====
       Demande de Turquet (août 2026, sur une capture du 1.7) : une case à
       largeur figée coupait « 100000 » et n'en montrait qu'un morceau —
       l'élève ne pouvait plus se relire — et sa police était deux fois plus
       petite que la correction d'à côté. Les cases des multiplications ont
       rejoint le groupe de référence des pourcentages : même taille que les
       nombres autour, largeur qui suit ce qui est écrit, et dans une
       fraction les deux cases et la barre prennent la largeur de la plus
       large. Seul un navigateur mesure une largeur RENDUE. */
    titre('6 quater bis. LES CASES D\'UNE FRACTION GRANDISSENT AVEC LA SAISIE');
    if(!P.caseQuiGrandit){
      ignorer('la case s\'élargit et rien n\'est coupé', 'ce niveau n\'a pas d\'écran déclaré pour ce contrôle');
    } else {
      /* une LISTE d'écrans désormais (le 1.6 l'a rejointe, demande de Turquet,
         août 2026) : une case qui grandirait sur l'un et pas sur l'autre ne se
         verrait nulle part ailleurs. Le 1.6 s'ouvre sur son niveau 1, sans
         fraction : « niveauFracp » dit quel niveau poser avant de mesurer. */
      const LG = Array.isArray(P.caseQuiGrandit) ? P.caseQuiGrandit : [P.caseQuiGrandit];
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      for(const G of LG){
        const ou = ' (' + G.exercice + ')';
        await s.page.evaluate(i => openTest(i), G.exercice);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="train"]');
        await s.page.waitForTimeout(900);
        if(G.niveauFracp){
          await s.page.evaluate(n => {
            test.levels=[n]; test.level=n; test.levelIdx=0; test.idx=0; test.locked=false;
            test.questions=Array.from({length:test.perLevel},()=>genFrac(n));
            renderFTest();
          }, G.niveauFracp);
          await s.page.waitForTimeout(400);
        }
        const avant = await s.page.evaluate(a => {
          const el = document.getElementById(a.den);
          return el ? { l: el.getBoundingClientRect().width, police: parseFloat(getComputedStyle(el).fontSize) } : null;
        }, G);
        verifier('l\'écran s\'ouvre et la case est là' + ou, !!avant, 'pas de #' + G.den);
        if(!avant) continue;
        verifier('la police de la case est celle des nombres qui l\'entourent' + ou,
          avant.police >= 22,
          'police rendue ' + avant.police + ' px — la réponse de l\'élève paraît secondaire');
        /* MathLive redessine de façon ASYNCHRONE : mesurer dans le même
           evaluate que l'écriture lit la largeur d'avant — le contrôle s'est
           pris en défaut ainsi à sa première exécution (96 px avant, 96 après,
           sur une page qui grandissait très bien). On écrit, on attend, on
           mesure. */
        await s.page.evaluate(a => { document.getElementById(a.den).value = a.grand; }, G);
        await s.page.waitForTimeout(600);
        const apres = await s.page.evaluate(a => {
          const el = document.getElementById(a.den);
          const r = el.getBoundingClientRect();
          const num = document.getElementById(a.num);
          const barre = el.closest('.f-frac-input') && el.closest('.f-frac-input').querySelector('.f-fbar');
          return { l: r.width, coupe: el.scrollWidth > el.clientWidth + 2,
                   num: num ? num.getBoundingClientRect().width : 0,
                   barre: barre ? barre.getBoundingClientRect().width : 0 };
        }, G);
        verifier('la case s\'élargit quand le nombre dépasse' + ou, apres.l > avant.l + 8,
          avant.l + ' px avant, ' + apres.l + ' px après « ' + G.grand + ' » — la largeur est restée figée');
        verifier('rien n\'est coupé dans la case' + ou, !apres.coupe, 'le contenu déborde de la case (« ' + G.grand + ' » tronqué)');
        verifier('la barre et l\'autre case suivent la plus large' + ou,
          apres.barre >= apres.l - 2 && apres.num >= apres.l - 2,
          'barre ' + Math.round(apres.barre) + ' px, numérateur ' + Math.round(apres.num) + ' px, dénominateur ' + Math.round(apres.l) + ' px');
      }
      await s.nav.close(); s = null;
    }


    /* ===== 6 quater nonies. associer le coefficient : trois phrases d'un seul tenant =====
       {associer-coefficient} (2.4.2) répond par une LISTE, et c'est le seul
       écran de ce niveau qui le fasse : trois choses ne se voient donc nulle
       part ailleurs, et aucune ne se voit hors d'un navigateur.
       · LA FEUILLE POSE « select{width:100%} ». Sans largeur propre, chaque
         liste s'étire sur toute la ligne et les trois phrases se posent l'une
         sous l'autre — la solution se lirait en trois morceaux. Le banc
         principal exige la règle CSS ; ici on mesure la liste RENDUE, parce
         qu'une règle peut être écrite et perdue dans la cascade (le piège du
         2.1.2, où « .pcol-phrase math-field » perdait contre un sélecteur plus
         spécifique et ne faisait rien du tout).
       · UNE CASE A LA TAILLE DES NOMBRES QUI L'ENTOURENT. Le contrôle
         universel ne mesure que les « math-field » : une liste écrite plus
         petit que sa phrase lui échappe entièrement.
       · LES TROIS VERDICTS DOIVENT SE VOIR. Une règle perdue sur « .ac-sel.ok »
         laisserait la vérification muette sans qu'aucune erreur ne se lève, et
         jsdom, qui lit la classe, resterait vert en parlant d'autre chose.
       On CHOISIT donc dans les vraies listes — jsdom pose une valeur, seul un
       navigateur voit qu'une liste écrit — puis on lit l'encre RENDUE. */
    titre('6 quater nonies. ASSOCIER LE COEFFICIENT : TROIS PHRASES D\'UN SEUL TENANT');
    if(!P.associerCoefficient){
      ignorer('les trois phrases tiennent chacune sur une ligne',
        'ce niveau n\'a pas l\'exercice d\'association des coefficients');
    } else {
      const A = P.associerCoefficient;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(i => openTest(i), A.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);

      const vu = await s.page.evaluate(() => {
        const bloc = document.getElementById('acHost');
        if(!bloc) return null;
        const r = e => e.getBoundingClientRect();
        const six = [...bloc.querySelectorAll('.ac-c')];
        const lignes = [...bloc.querySelectorAll('.ac-ligne')].map(L => {
          const enfants = [...L.children].filter(c => r(c).width > 0);
          const haut = Math.max(...enfants.map(c => r(c).height));
          const sel = L.querySelector('.ac-sel'), ph = L.querySelector('.ac-phrase');
          return { h: Math.round(r(L).height), enfant: Math.round(haut), l: Math.round(r(L).width),
                   sel: sel ? Math.round(r(sel).width) : 0,
                   police: sel ? parseFloat(getComputedStyle(sel).fontSize) : 0,
                   phrase: ph ? parseFloat(getComputedStyle(ph).fontSize) : 0 };
        });
        return { six: six.length,
                 /* une seule ligne : les six se comparent d'un coup d'œil */
                 bandes: new Set(six.map(e => Math.round(r(e).top))).size,
                 lignes: lignes };
      });
      verifier('l\'écran s\'ouvre, le banc des six et les trois phrases sont là',
        !!vu && vu.six === 6 && vu.lignes.length === 3,
        vu ? (vu.six + ' coefficient(s) affiché(s), ' + vu.lignes.length + ' phrase(s)') : 'pas de #acHost');
      if(vu && vu.six === 6 && vu.lignes.length === 3){
        verifier('les six coefficients se lisent sur UNE seule bande',
          vu.bandes === 1, vu.bandes + ' bande(s) : le banc se replie, les six ne se comparent plus d\'un coup d\'œil');
        /* une rangée n'a pas replié parce que ses enfants ont des hauteurs
           différentes : on compare la hauteur de la RANGÉE à celle de son plus
           haut enfant (la méthode du contrôle de pleine largeur). */
        const replies = vu.lignes.filter(L => L.h > L.enfant + 6);
        verifier('aucune des trois phrases ne se replie à 1400 px',
          replies.length === 0,
          replies.map(L => 'rangée de ' + L.h + ' px pour un enfant de ' + L.enfant).join(' | '));
        const etirees = vu.lignes.filter(L => L.sel > L.l * 0.5);
        verifier('la liste ne s\'étire pas sur toute la ligne (select{width:100%})',
          etirees.length === 0,
          etirees.map(L => 'liste de ' + L.sel + ' px dans une rangée de ' + L.l).join(' | '));
        const petites = vu.lignes.filter(L => L.police < L.phrase - 0.5);
        verifier('la liste a la taille de la phrase qui l\'entoure',
          petites.length === 0,
          petites.map(L => 'liste à ' + L.police + 'px contre une phrase à ' + L.phrase + 'px').join(' | '));
      }

      /* la copie JUSTE, choisie dans les vraies listes, puis l'encre rendue */
      const FAMS = ['pre', 'aug', 'dim'];
      const bons = await s.page.evaluate(() => { const q = test.questions[test.idx];
        return ['pre','aug','dim'].map(f => String(q.ordre.indexOf(ckCoef({fam:f, P:q.P})))); });
      for(let i = 0; i < FAMS.length; i++) await s.page.selectOption('#ac-' + FAMS[i], bons[i]);
      const retenus = await s.page.evaluate(() => { const q = test.questions[test.idx];
        return ['pre','aug','dim'].map(f => q.rep[f]); });
      verifier('choisir dans la liste arrive bien jusqu\'à la page',
        retenus.every((v, i) => String(v) === bons[i]),
        'la page a retenu ' + JSON.stringify(retenus) + ' au lieu de ' + JSON.stringify(bons));
      await s.page.click('#acActions button.btn-primary');
      await s.page.waitForTimeout(400);
      const juste = await s.page.evaluate(() => {
        const t = document.createElement('span'); document.body.appendChild(t);
        const parVar = v => { t.style.color = 'var(' + v + ')'; return getComputedStyle(t).color; };
        const ref = { bleu: parVar('--blue'), rouge: parVar('--red'), vert: parVar('--green') };
        t.remove();
        return { encres: ['pre','aug','dim'].map(f => getComputedStyle(document.getElementById('ac-' + f)).color),
                 ref: ref, note: (document.querySelector('#acFeedback .note-exo') || {}).textContent || '' };
      });
      verifier('une copie juste peint les trois listes en BLEU',
        juste.encres.every(c => c === juste.ref.bleu),
        'encres rendues : ' + juste.encres.join(' | ') + ' — le bleu de la convention est ' + juste.ref.bleu);
      verifier('la note de l\'écran compte les trois lignes',
        /3 cases justes sur 3/.test(juste.note), 'note affichée : « ' + juste.note.trim() + ' »');

      /* UNE SEULE ligne fausse : elle rougit, la bonne réponse se montre en
         VERT à côté — et le badge doit avoir une BOÎTE, jamais seulement une
         balise : un CSS perdu le rendrait invisible sans qu'une erreur ne se
         lève (la leçon de « [hidden] », par la porte d'à côté). */
      const faux = await s.page.evaluate(() => {
        test.locked = false; test.answers = []; renderACTest();
        const q = test.questions[test.idx];
        return String(q.ordre.findIndex(c => c !== ckCoef({fam:'aug', P:q.P})));
      });
      /* les trois réponses passent par les VRAIES listes, celle qui est fausse
         comme les deux autres : poser un choix dans l'objet de la question
         laisserait la liste affichée vide, et le banc mesurerait la couleur
         d'un état qu'aucun élève ne peut produire. */
      for(let i = 0; i < FAMS.length; i++)
        await s.page.selectOption('#ac-' + FAMS[i], FAMS[i] === 'aug' ? faux : bons[i]);
      await s.page.click('#acActions button.btn-primary');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(() => {
        const t = document.createElement('span'); document.body.appendChild(t);
        const parVar = v => { t.style.color = 'var(' + v + ')'; return getComputedStyle(t).color; };
        const ref = { bleu: parVar('--blue'), rouge: parVar('--red'), vert: parVar('--green') };
        t.remove();
        const sel = document.getElementById('ac-aug');
        const bd = sel && sel.nextElementSibling;
        const r = bd ? bd.getBoundingClientRect() : { width: 0, height: 0 };
        return { fausse: getComputedStyle(sel).color,
                 justes: ['pre','dim'].map(f => getComputedStyle(document.getElementById('ac-' + f)).color),
                 badge: bd ? { l: Math.round(r.width), h: Math.round(r.height),
                               encre: getComputedStyle(bd).color, texte: bd.textContent.trim() } : null,
                 ref: ref };
      });
      verifier('la ligne fausse rougit, ses voisines restent bleues',
        apres.fausse === apres.ref.rouge && apres.justes.every(c => c === apres.ref.bleu),
        'fausse ' + apres.fausse + ', voisines ' + apres.justes.join(' | '));
      verifier('la bonne réponse se montre en VERT à côté, avec une vraie boîte',
        !!apres.badge && apres.badge.l > 0 && apres.badge.h > 0 && apres.badge.encre === apres.ref.vert,
        apres.badge ? ('badge « ' + apres.badge.texte + ' » de ' + apres.badge.l + '×' + apres.badge.h
                       + ' px, encre ' + apres.badge.encre) : 'aucun badge à côté de la liste fausse');
      await s.nav.close(); s = null;
    }
    /* ===== 6 quinquies. l'étiquette de la colonne de gauche ===== */
    /* Elle doit nommer le dénominateur de la fraction étudiée : « pour 5 »
       devant 2/5. C'est ce qui met les deux colonnes en regard — « 2 pour 5 »
       d'un côté, « 40 pour 100 » de l'autre. L'étiquette est posée depuis une
       chaîne JavaScript, invisible à un contrôle qui ne lirait que le HTML ;
       et une étiquette figée (« pour 1 ») passerait tous les contrôles de
       structure sans qu'aucun ne la regarde. On ouvre donc l'exercice, on
       relit la question tirée, et on compare à ce qui est AFFICHÉ. Plusieurs
       questions d'affilée : une seule ne dirait pas si l'étiquette suit. */
    titre('6 quinquies. LA COLONNE DE GAUCHE NOMME LE DÉNOMINATEUR');
    if(!P.colonneFraction){
      ignorer('l\'étiquette de la colonne suit le dénominateur',
        'ce niveau n\'a pas l\'exercice « Fraction et pourcentage »');
    } else {
      const C = P.colonneFraction;
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      await s.page.evaluate(i => openTest(i), C.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(700);
      let vues = 0, ecarts = [];
      for(let i = 0; i < 4; i++){
        const vu = await s.page.evaluate(h => {
          const host = document.getElementById(h);
          const labs = host ? [...host.querySelectorAll('.fp-lab')].map(e => e.textContent.trim()) : [];
          const q = (typeof test !== 'undefined' && test.questions) ? test.questions[test.idx] : null;
          const col = host ? host.querySelectorAll('#fpColL .fp-seg').length : 0;
          return { labs, a: q && q.a, b: q && q.b, col };
        }, C.hote);
        if(!vu.b) break;
        vues++;
        if(vu.labs[0] !== 'pour ' + vu.b)
          ecarts.push('fraction ' + vu.a + '/' + vu.b + ' → étiquette « ' + vu.labs[0] + ' » au lieu de « pour ' + vu.b + ' »');
        if(vu.labs[1] !== C.droite)
          ecarts.push('colonne de droite « ' + vu.labs[1] + ' » au lieu de « ' + C.droite + ' »');
        if(vu.col !== vu.b)
          ecarts.push('fraction ' + vu.a + '/' + vu.b + ' → ' + vu.col + ' parts dessinées, l\'étiquette annonce ' + vu.b);
        await s.page.evaluate(() => { if(typeof nextFPQuestion === 'function'){ test.locked = false; nextFPQuestion(); } });
        await s.page.waitForTimeout(350);
      }
      verifier('l\'exercice s\'ouvre et tire des fractions', vues >= 2,
        'seulement ' + vues + ' question(s) lue(s) — l\'écran ne s\'est pas ouvert');
      verifier('l\'étiquette nomme le dénominateur sur chaque question', vues >= 2 && !ecarts.length,
        ecarts.join(' ; '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 sexies. le devoir à la maison arrive-t-il jusqu'à l'élève ? ===== */
    titre('6 sexies. LE DEVOIR À LA MAISON, DU PROFESSEUR À L\'ÉLÈVE');
    if(!P.devoirsEleve){
      ignorer('l\'espace élève dit ce qu\'il a pu lire', 'ce niveau n\'a pas de devoir à la maison');
    } else {
      const D = P.devoirsEleve;
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      const lire = () => s.page.evaluate(async () => {
        await openDevoirsEleve();
        await new Promise(r => setTimeout(r, 250));
        return document.getElementById('devoirsBody').textContent.replace(/\s+/g, ' ').trim();
      });

      /* 1. la ligne des réglages est invisible — ce que fait un refus de RLS */
      await s.page.evaluate(t => { window.__faux.tables[t] = []; }, D.table);
      const muet = await lire();
      verifier('une ligne de réglages illisible ne passe pas pour « aucun devoir »',
        muet.indexOf(D.aveu) >= 0,
        'l\'élève lit « ' + muet.slice(0, 90) + ' » — rien ne dit que la page n\'a rien pu lire');

      /* 2. la ligne est lue, et ne porte aucun devoir affiché : là, c'est vrai */
      await s.page.evaluate(t => window.__faux.semer(t, [{ id: 1, valeurs: { devoirs: [] } }]), D.table);
      const vide = await lire();
      verifier('une liste vraiment vide se dit vide, sans alarmer',
        vide.indexOf('Aucun devoir') >= 0 && vide.indexOf(D.aveu) < 0,
        'l\'élève lit « ' + vide.slice(0, 90) + ' »');

      /* 3. un devoir affiché arrive bien jusqu'à l'élève */
      await s.page.evaluate(a => window.__faux.semer(a.t, [{ id: 1, valeurs: { devoirs: [
        { id: 'dm_c', num: 7, actif: true, titre: 'Devoir de contrôle', cours: '',
          exercices: [{ id: a.ex, modes: ['train'] }] }] } }]), { t: D.table, ex: D.exercice });
      const vu = await lire();
      verifier('un devoir affiché arrive jusqu\'à l\'élève',
        vu.indexOf('Devoir de contrôle') >= 0 && vu.indexOf('n°7') >= 0,
        'l\'élève lit « ' + vu.slice(0, 110) + ' »');

      /* 4. masqué par le professeur : il disparaît, et sans faux aveu */
      await s.page.evaluate(a => window.__faux.semer(a.t, [{ id: 1, valeurs: { devoirs: [
        { id: 'dm_c', num: 7, actif: false, titre: 'Devoir de contrôle', cours: '',
          exercices: [{ id: a.ex, modes: ['train'] }] }] } }]), { t: D.table, ex: D.exercice });
      const masque = await lire();
      verifier('un devoir masqué disparaît, sans faire croire à une panne',
        masque.indexOf('Devoir de contrôle') < 0 && masque.indexOf(D.aveu) < 0,
        'l\'élève lit « ' + masque.slice(0, 90) + ' »');

      /* 5. LA SECONDE FAMILLE : les fiches de travail en classe (Seconde et
         Première). Chaque page montre LA SIENNE — mélangées, l'élève ferait
         deux fois le même travail, et une fiche rangée sous « devoirs » serait
         publiée par le portail, qui lit cette clé-là. */
      const aFiches = await s.page.evaluate(() => typeof GENRE_DEVOIRS !== 'undefined');
      if(!aFiches){
        ignorer('une fiche de travail s\'affiche dans SA page, et nulle part ailleurs',
          'ce niveau n\'a pas les fiches de travail en classe');
      } else {
        await s.page.evaluate(a => window.__faux.semer(a.t, [{ id: 1, valeurs: {
          devoirs: [{ id: 'dm_c', num: 7, actif: true, titre: 'Devoir de contrôle', cours: '',
                      exercices: [{ id: a.ex, modes: ['train'] }] }],
          fiches:  [{ id: 'fc_c', num: 2, actif: true, titre: 'Fiche de contrôle', cours: '',
                      exercices: [{ id: a.ex, modes: ['train'] }] }] } }]),
          { t: D.table, ex: D.exercice });
        const lireFiches = () => s.page.evaluate(async () => {
          await openDevoirsEleve('fiche');
          await new Promise(r => setTimeout(r, 250));
          return document.getElementById('devoirsTitle').textContent + ' | '
               + document.getElementById('devoirsBody').textContent.replace(/\s+/g, ' ').trim();
        });
        const pageFiches = await lireFiches();
        verifier('une fiche de travail s\'affiche dans SA page, et nulle part ailleurs',
          pageFiches.indexOf('Fiches de travail en classe') >= 0
          && pageFiches.indexOf('Fiche de contrôle') >= 0
          && pageFiches.indexOf('Fiche n°2') >= 0
          && pageFiches.indexOf('Devoir de contrôle') < 0,
          'l\'élève lit « ' + pageFiches.slice(0, 120) + ' »');
        const pageDevoirs = await lire();
        verifier('et la page des devoirs ne montre pas la fiche',
          pageDevoirs.indexOf('Devoir de contrôle') >= 0 && pageDevoirs.indexOf('Fiche de contrôle') < 0,
          'l\'élève lit « ' + pageDevoirs.slice(0, 120) + ' »');
        /* le bouton de l'accueil : sans lui, la page existe et rien n'y mène —
           c'est le défaut du « bouton qui MÈNE à l'aide », transposé */
        const bouton = await s.page.evaluate(() => {
          const b = document.querySelector('#scr-space .choice.fiche');
          return b ? b.textContent : '';
        });
        verifier('l\'accueil de l\'élève a le bouton des fiches de travail',
          /Fiches de travail en classe/.test(bouton), 'aucun bouton .choice.fiche sur l\'accueil');
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 sexies bis. LE MOT « BONUS » EST ÉCRIT, ET IL SE VOIT =====
       Demande de Turquet (septembre 2026) : « je veux que l'on écrive bonus
       pour les exercices qui sont en bonus quand on annonce le dm avec la
       liste de tous les exercices et quand on fait cet exercice aussi ».
       Le banc jsdom tient le DOM — le mot est là, sur le bon exercice et sur
       lui seul, écrit à un seul endroit. Il ne peut pas tenir deux choses :
       le badge RENDU (une règle CSS perdue le rendrait invisible sans qu'une
       erreur ne se lève, le piège déjà payé sur les images du 2.20) et le
       TRAJET entier — l'énoncé du circuit papier, dont le titre ne s'écrit
       qu'APRÈS le tirage, donc après une attente que jsdom ne franchit pas.
       Le bord OPPOSÉ est mesuré dans le même trajet : l'exercice NORMAL du
       même devoir ne porte jamais le badge, nulle part. */
    titre('6 sexies bis. LE MOT « BONUS » : L\'ANNONCE DU DEVOIR, ET L\'ÉCRAN OÙ ON LE FAIT');
    if(!P.bonusEcrit){
      ignorer('le mot « Bonus » se voit sur l\'annonce du devoir et sur l\'écran de l\'exercice',
        'ce niveau a bien les exercices bonus, mais n\'écrit pas encore le mot : la demande ne porte que la Terminale');
    } else {
      const BO = P.bonusEcrit;
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      /* un devoir de DEUX exercices : le premier coché bonus, le second non */
      await s.page.evaluate(o => {
        window.__faux.tables[o.table] = [{ id:1, valeurs:{ devoirs:[
          { id:'dm-bonus', num:9, actif:true, titre:'Devoir du banc', cours:'',
            exercices:[{ id:o.bonus, modes:['train'], bonus:true },
                       { id:o.normal, modes:['train'] }] }] } }];
      }, { table:BO.table, bonus:BO.bonus, normal:BO.normal });

      /* La mesure d'un badge : son texte, sa BOÎTE et son encre RÉSOLUE — on ne
         se contente jamais de la balise, qu'un display:none laisserait en
         place. */
      const badge = sel => s.page.evaluate(q => {
        const e = document.querySelector(q);
        if(!e) return null;
        const r = e.getBoundingClientRect();
        return { mot:(e.textContent || '').replace(/\s+/g, ' ').trim(),
                 l:Math.round(r.width), h:Math.round(r.height) };
      }, sel);
      const vu = b => !!b && b.l > 0 && b.h > 0;

      /* L'ANNONCE : la liste des devoirs, avec tous ses exercices. */
      const annonce = await s.page.evaluate(async () => {
        await openDevoirsEleve();
        await new Promise(r => setTimeout(r, 400));
        return [...document.querySelectorAll('#devoirsBody .dl-ex')]
          .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim());
      });
      verifier('l\'annonce du devoir liste bien ses deux exercices', annonce.length === 2,
        annonce.length + ' ligne(s) : ' + annonce.join(' ¦ ').slice(0, 140));
      const bAnnonce = await badge('#devoirsBody .dl-ex .dm-bonus');
      verifier('l\'annonce du devoir ÉCRIT « ' + BO.mot +' », et on le voit',
        vu(bAnnonce) && bAnnonce.mot.indexOf(BO.mot) >= 0,
        bAnnonce ? 'badge « ' + bAnnonce.mot + ' » de ' + bAnnonce.l + '×' + bAnnonce.h + ' px'
                 : 'aucun badge .dm-bonus dans l\'annonce — l\'élève lit : ' + annonce.join(' ¦ ').slice(0, 120));
      verifier('et l\'exercice qui n\'est pas un bonus ne le porte pas',
        annonce.length === 2 && annonce[1].indexOf(BO.mot) < 0,
        'la seconde ligne dit : ' + (annonce[1] || '(aucune)'));

      /* LE TRAJET : écran des modes, énoncé du circuit papier, écran de travail.
         L'ORDRE A SUIVI LA DEMANDE de septembre 2026 : le choix vient AVANT
         l'énoncé, qui n'est plus qu'une des trois cartes. Le contrôle est
         RETOURNÉ, pas retiré — les trois écrans portent toujours le mot. */
      await s.page.evaluate(() => ouvrirDevoirDetail('dm-bonus'));
      await s.page.waitForTimeout(600);
      await s.page.evaluate(o => openTestDevoir('dm-bonus', o.bonus), { bonus:BO.bonus });
      await s.page.waitForTimeout(900);
      const surModes = await s.page.evaluate(() => {
        const e = document.querySelector('.screen.on'); return e ? e.id : '(aucun)'; });
      verifier('l\'exercice du devoir s\'ouvre sur la page des modes', surModes === 'scr-mode',
        'écran affiché : ' + surModes);
      const bModes = await badge('#modeTitle .dm-bonus');
      verifier('la page des modes dit que l\'exercice est un bonus',
        vu(bModes) && bModes.mot.indexOf(BO.mot) >= 0,
        bModes ? 'badge de ' + bModes.l + '×' + bModes.h + ' px' : 'aucun badge dans le titre des modes');

      await s.page.click('#modeChoices [onclick*="dmePapierOuvrir"]');
      await s.page.waitForTimeout(2000);
      const surEnonce = await s.page.evaluate(() => {
        const e = document.querySelector('.screen.on'); return e ? e.id : '(aucun)'; });
      verifier('la carte « sur papier » ouvre l\'énoncé complet', surEnonce === 'scr-dmenonce',
        'écran affiché : ' + surEnonce);
      const bEnonce = await badge('#dmeTitre .dm-bonus');
      verifier('l\'énoncé du devoir le dit aussi',
        vu(bEnonce) && bEnonce.mot.indexOf(BO.mot) >= 0,
        bEnonce ? 'badge de ' + bEnonce.l + '×' + bEnonce.h + ' px' : 'aucun badge dans le titre de l\'énoncé');

      /* retour au devoir, puis l\'entraînement par la carte : c\'est le chemin
         de l\'élève qui a lu son énoncé et préfère finalement l\'ordinateur */
      await s.page.evaluate(() => dmeRetour());
      await s.page.waitForTimeout(700);
      await s.page.evaluate(o => openTestDevoir('dm-bonus', o.bonus), { bonus:BO.bonus });
      await s.page.waitForTimeout(900);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1200);
      const bExo = await badge('.screen.on .exo-title .dm-bonus');
      const pastille = await s.page.evaluate(() => {
        const t = document.querySelector('.screen.on .exo-title');
        return t ? (t.textContent || '').replace(/\s+/g, ' ').trim() : '(aucune pastille)'; });
      verifier('et l\'écran où l\'élève FAIT l\'exercice le dit encore',
        vu(bExo) && bExo.mot.indexOf(BO.mot) >= 0,
        'la pastille dit : « ' + pastille + ' »');
      verifier('le badge n\'a chassé ni le numéro ni le nom de l\'exercice',
        /\S/.test(pastille) && pastille.replace(bExo ? bExo.mot : '', '').trim().length > 2,
        'la pastille dit : « ' + pastille + ' »');

      /* LE BORD OPPOSÉ, dans le même trajet. */
      await s.page.evaluate(o => lancerDevoirExo('dm-bonus', o.normal, 'train'), { normal:BO.normal });
      await s.page.waitForTimeout(1200);
      const bNormal = await badge('.screen.on .exo-title .dm-bonus');
      const pastille2 = await s.page.evaluate(() => {
        const t = document.querySelector('.screen.on .exo-title');
        return t ? (t.textContent || '').replace(/\s+/g, ' ').trim() : '(aucune pastille)'; });
      verifier('un exercice normal du même devoir ne porte jamais le badge', !bNormal,
        'la pastille dit : « ' + pastille2 + ' »');
      await s.nav.close(); s = null;
    }

    /* ===== 6 quindecies. Le professeur POSE une note sur un devoir ===== */
    /* Turquet doit pouvoir corriger la note d'un exercice pour un élève. Le
       banc principal éprouve le CALCUL — la note posée remplace, elle est
       bornée, elle survit au rechargement. Il ne peut pas éprouver le GESTE :
       taper une note dans le champ, et voir le total du devoir bouger.
       C'est la différence qui compte ici. Le champ vit dans un tableau rendu en
       innerHTML, son « onchange » traverse deux analyseurs, et l'enregistrement
       passe par la base. Rien de tout cela ne se voit hors d'un navigateur.
       TROIS BORDS : la note s'écrit et TIENT (elle part vraiment en base), le
       TOTAL du devoir la suit — sans quoi le même écran porterait deux
       vérités —, et vider le champ REND la note obtenue. */
    titre('6 quindecies. LE PROFESSEUR POSE UNE NOTE SUR UN DEVOIR');
    if(!P.notesDevoir){
      ignorer('le professeur pose une note, elle tient, et le total la suit',
        'ce niveau n\'a pas de note posée par le professeur');
    } else {
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      const N = P.notesDevoir;
      /* L'ÉLÈVE EST CELUI DU BANC, pas un identifiant inventé. Un résultat semé
         sous « e1 » n'appartient à personne : le tableau du professeur ne le
         montre nulle part, et le contrôle accusait alors la page d'un défaut
         qui n'existait pas. On lit donc l'identifiant dans la table. */
      const eleveId = await s.page.evaluate(t => ((window.__faux.tables[t] || [])[0] || {}).id,
        P.tableEleves);
      /* un devoir d'un exercice, et un résultat d'élève à 40 % en entraînement
         — donc 4 sur 10 obtenus */
      await s.page.evaluate(o => {
        window.__faux.tables[o.params] = [{ id:1, valeurs:{ devoirs:[
          { id:'dm-banc', num:7, actif:true, titre:'Devoir du banc',
            exercices:[{ id:o.exo, modes:['train'] }] }] } }];
        window.__faux.tables[o.res] = [{ id:'r1', eleve_id:o.eleve, percent:40, score:4, total:10,
          created_at:new Date(0).toISOString(), details:{ test:o.exo, mode:'train', dm:'dm-banc' } }];
        show('teacher');
      }, { params:N.tableParametres, res:N.tableResultats, exo:N.exercice, eleve:eleveId });
      await s.page.evaluate(() => teacherTab('devoir'));
      await s.page.waitForTimeout(1200);

      /* « .dm-exrow .dm-noteinput » et non « .dm-noteinput » : le bilan de la
         classe porte, plus haut dans la même page, le champ de la note du
         DEVOIR ENTIER — il partage la même classe, et prendre le premier venu
         revenait à taper là en croyant poser la note d'un exercice. Le contrôle
         accusait alors la page de ne rien enregistrer. */
      const avant = await s.page.evaluate(() => ({
        champs: document.querySelectorAll('.dm-exrow .dm-noteinput').length,
        texte: (document.getElementById('dmResults') || {}).textContent || '',
      }));
      verifier('le champ pour poser une note est là', avant.champs > 0,
        avant.champs + ' champ(s) — ' + avant.texte.slice(0, 120));
      verifier('le total du devoir part de la note obtenue',
        /4\s*\/\s*10/.test(avant.texte.replace(/ /g, ' ')),
        'affiché : ' + avant.texte.slice(0, 160));

      /* on TAPE 9, comme le professeur */
      await s.page.evaluate(() => {
        const c = document.querySelector('.dm-exrow .dm-noteinput');
        c.value = '9';
        c.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await s.page.waitForTimeout(900);
      const apres = await s.page.evaluate(o => ({
        texte: (document.getElementById('dmResults') || {}).textContent || '',
        enBase: (((window.__faux.tables[o.params] || [])[0] || {}).valeurs || {}).devoirs,
      }), { params:N.tableParametres });
      const posee = apres.enBase && apres.enBase[0] && apres.enBase[0].notes;
      verifier('la note posée part vraiment en base',
        !!posee && posee[eleveId + '|' + N.exercice] === 9,
        'notes enregistrées : ' + JSON.stringify(posee || null));
      verifier('le total du devoir suit la note posée',
        /9\s*\/\s*10/.test(apres.texte.replace(/ /g, ' ')),
        'affiché : ' + apres.texte.slice(0, 160));
      verifier('la note obtenue reste lisible à côté',
        /obtenu/i.test(apres.texte), 'affiché : ' + apres.texte.slice(0, 160));

      /* et vider le champ REND la note obtenue */
      await s.page.evaluate(() => {
        const c = document.querySelector('.dm-exrow .dm-noteinput');
        c.value = '';
        c.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await s.page.waitForTimeout(900);
      const rendu = await s.page.evaluate(o => ({
        texte: (document.getElementById('dmResults') || {}).textContent || '',
        notes: ((((window.__faux.tables[o.params] || [])[0] || {}).valeurs || {}).devoirs || [{}])[0].notes,
      }), { params:N.tableParametres });
      verifier('vider le champ rend la note obtenue',
        /4\s*\/\s*10/.test(rendu.texte.replace(/ /g, ' '))
          && !(rendu.notes && rendu.notes[eleveId + '|' + N.exercice] !== undefined),
        'affiché : ' + rendu.texte.slice(0, 160) + ' — notes : ' + JSON.stringify(rendu.notes || null));
      /* ET LA NOTE DU DEVOIR ENTIER, tapée dans SON champ. Le banc jsdom éprouve
         le juge, l'échelle et la base ; il ne peut pas éprouver le GESTE — un
         « onchange » posé dans un innerHTML traverse deux analyseurs, et un
         identifiant mal échappé y ferait un bouton mort sans la moindre erreur.
         Le bord qui compte : la note du devoir part dans SA case (notesDevoir)
         et non dans celle des exercices, et le total la suit pendant que
         l'exercice garde la note obtenue. */
      if(!N.devoirEntier){
        ignorer('la note du devoir entier part dans sa propre case',
          'ce niveau ne pose pas la note d\'un devoir entier');
      } else {
        /* LE CHAMP EST NOMMÉ S'IL MANQUE. Sans ce garde, un champ disparu lève
           une erreur JavaScript dans la page et le contrôle parle d'autre chose
           au lieu de dire ce qui manque. */
        const trouve = await s.page.evaluate(() => {
          const c = document.querySelector('.dm-notedev');
          if(!c) return false;
          c.value = '7';
          c.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        });
        await s.page.waitForTimeout(900);
        const dev = await s.page.evaluate(o => {
          const d = ((((window.__faux.tables[o.params] || [])[0] || {}).valeurs || {}).devoirs || [{}])[0];
          return { texte: (document.getElementById('dmResults') || {}).textContent || '',
                   notesDevoir: d.notesDevoir, notes: d.notes };
        }, { params:N.tableParametres });
        const pd = dev.notesDevoir && dev.notesDevoir[eleveId];
        verifier('la note du devoir entier part dans sa propre case',
          trouve && !!pd && pd.note === 7 && pd.sur === 10
            && !(dev.notes && Object.keys(dev.notes).length),
          !trouve ? 'aucun champ « .dm-notedev » dans le bilan de la classe'
            : 'notesDevoir : ' + JSON.stringify(dev.notesDevoir || null)
              + ' — notes des exercices : ' + JSON.stringify(dev.notes || null));
        verifier('le total du devoir suit la note du devoir, la note obtenue restant lisible',
          /7\s*\/\s*10/.test(dev.texte.replace(/ /g, ' '))
            && /obtenu\s*4\s*\/\s*10/.test(dev.texte.replace(/ /g, ' ')),
          'affiché : ' + dev.texte.replace(/\s+/g, ' ').slice(0, 200));
      }
      /* ---- ET L'ÉCRAN NE BOUGE PAS (demande de Turquet, septembre 2026) ----
         « quand je modifie une note je souhaite que la page réapparaisse
         exactement au même endroit ». Le bilan commençait par se réduire à
         « Chargement… » : la page tombait de 8986 à 4346 px et le défilement
         était ramené de 8086 à 3446 — mesuré ici même. Le navigateur finissait
         par rattraper la position, mais c'est une heuristique d'ancrage, pas la
         page : elle lâche dès que l'ancre disparaît avec le contenu.
         LA MESURE NE DÉPEND D'AUCUN MINUTEUR : un observateur relève la HAUTEUR
         de la page à chaque changement de la boîte, si bien que l'affaissement
         se voit même quand il ne dure qu'un tour de boucle — retarder le double
         pour le rendre visible aurait fait mesurer l'attente au lieu de la
         page. Et il faut une page HAUTE : un devoir d'un exercice et d'un seul
         élève tient dans l'écran, et il n'y a alors rien à déplacer. */
      await s.page.evaluate(o => {
        const eleves = (window.__faux.tables[o.tEleves] || []).slice(0, 1);
        for(let i = 0; i < 12; i++)
          eleves.push({ id:'b'+i, prenom:'Banc '+i, cle:'cb'+i, user_id:'ub'+i });
        window.__faux.tables[o.tEleves] = eleves;
        window.__faux.tables[o.params] = [{ id:1, valeurs:{ devoirs:[
          { id:'dm-banc', num:7, actif:true, titre:'Devoir du banc',
            exercices:o.exos.map(function(id){ return { id:id, modes:['train'] }; }) }] } }];
        teacherTab('devoir');
      }, { tEleves:P.tableEleves, params:N.tableParametres,
           exos:[N.exercice].concat(await s.page.evaluate(x => TEST_ORDER.filter(i => i !== x).slice(0, 2), N.exercice)) });
      await s.page.waitForTimeout(1400);

      const haut = await s.page.evaluate(() => {
        const champs = document.querySelectorAll('#dmResults .dm-noteinput');
        if(champs.length < 12) return { assez:false, n:champs.length };
        const c = champs[champs.length - 1];
        c.scrollIntoView({ block:'center' });
        window.__etapes = [];
        const o = new MutationObserver(() => window.__etapes.push({
          h: Math.round(document.documentElement.scrollHeight),
          y: Math.round(window.scrollY) }));
        o.observe(document.getElementById('dmResults'), { childList:true });
        return { assez:true, n:champs.length, cle:c.getAttribute('data-cle'),
                 hauteur: Math.round(document.documentElement.scrollHeight),
                 y: Math.round(window.scrollY), top: Math.round(c.getBoundingClientRect().top) };
      });
      if(!haut.assez){
        verifier('poser une note ne déplace pas la page', false,
          'le bilan ne pose que ' + haut.n + ' champ(s) : rien à faire défiler, le contrôle ne mesure rien');
      } else {
        await s.page.evaluate(cle => {
          const c = [].slice.call(document.querySelectorAll('#dmResults .dm-noteinput'))
            .filter(x => x.getAttribute('data-cle') === cle)[0];
          c.focus(); c.value = '6'; c.dispatchEvent(new Event('change', { bubbles:true }));
        }, haut.cle);
        await s.page.waitForTimeout(1200);
        const bas = await s.page.evaluate(cle => {
          const c = [].slice.call(document.querySelectorAll('#dmResults .dm-noteinput'))
            .filter(x => x.getAttribute('data-cle') === cle)[0];
          const a = document.activeElement;
          return { etapes: window.__etapes || [], y: Math.round(window.scrollY),
                   top: c ? Math.round(c.getBoundingClientRect().top) : null,
                   valeur: c ? c.value : null,
                   focus: a && a.getAttribute ? a.getAttribute('data-cle') : null };
        }, haut.cle);
        const creux = bas.etapes.length ? Math.min.apply(null, bas.etapes.map(e => e.h)) : haut.hauteur;
        verifier('l\'écran ne s\'affaisse pas pendant que la note s\'enregistre',
          bas.etapes.length > 0 && creux >= haut.hauteur - 200,
          !bas.etapes.length ? 'la boîte n\'a pas été redessinée : le contrôle ne mesure rien'
            : 'la page est tombée à ' + creux + ' px (elle en faisait ' + haut.hauteur + ') — '
              + JSON.stringify(bas.etapes));
        verifier('la page réapparaît exactement au même endroit',
          bas.top !== null && Math.abs(bas.top - haut.top) <= 8 && Math.abs(bas.y - haut.y) <= 8,
          bas.top === null ? 'le champ a disparu du bilan'
            : 'la ligne notée est passée de ' + haut.top + ' à ' + bas.top + ' px du haut de l\'écran'
              + ' (défilement ' + haut.y + ' → ' + bas.y + ')');
        verifier('le champ noté garde le focus, avec sa note',
          bas.focus === haut.cle && bas.valeur === '6',
          'focus sur « ' + String(bas.focus) + ' » (attendu « ' + haut.cle + ' ») — le champ dit « '
            + String(bas.valeur) + ' »');
      }

      verifier('poser une note ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 septies. le cours en PDF, déposé puis ouvert ===== */
    /* Trois choses qu'aucun banc hors navigateur ne sait voir ensemble : un
       VRAI sélecteur de fichier reçoit un VRAI fichier, la liste du professeur
       se redessine, et surtout le clic de l'élève OUVRE un onglet. Ce dernier
       point est le seul qui compte vraiment : window.open() appelé après un
       await est bloqué par Chrome comme une fenêtre surgissante — l'élève
       cliquerait, et rien ne s'ouvrirait, sans la moindre erreur. jsdom n'a pas
       de bloqueur : il ne peut donc rien en dire. */
    titre('6 septies. LE COURS EN PDF, DÉPOSÉ PAR LE PROFESSEUR');
    if(!P.coursPdf){
      ignorer('le professeur dépose un PDF', 'ce niveau n\'a pas de dépôt de cours');
    } else {
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);

      /* 1. le professeur dépose, par le sélecteur de fichier du navigateur */
      await s.page.evaluate(() => { show('teacher'); teacherTab('cours'); });
      await s.page.setInputFiles('#coursFichier', {
        name: 'Chapitre 3 — pourcentages.pdf', mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 fichier de contrôle') });
      await s.page.fill('#coursTitre', "Cours n°3 — pourcentages");
      await s.page.click('#coursDeposer');
      await s.page.waitForTimeout(800);

      const cote = await s.page.evaluate(t => ({
        fichiers: Object.keys((window.__faux.fichiers || {}).cours || {}),
        enregistres: ((((window.__faux.tables[t] || [])[0] || {}).valeurs || {}).cours || []).length,
        affiche: (document.getElementById('coursListeProf') || {}).textContent || '',
      }), P.coursPdf.table);
      verifier('le professeur dépose un PDF et le voit dans sa liste',
        cote.fichiers.length === 1 && cote.enregistres === 1 && /Cours n°3/.test(cote.affiche),
        'fichiers : ' + cote.fichiers.join(',') + ' — enregistrés : ' + cote.enregistres +
        ' — affiché : « ' + cote.affiche.replace(/\s+/g, ' ').trim().slice(0, 90) + ' »');

      /* 2. LE CLIC, depuis la liste du professeur. L'onglet doit vraiment
         s'ouvrir : window.open() appelé APRÈS un await est bloqué par Chrome
         comme une fenêtre surgissante, et jsdom, qui n'a pas de bloqueur, ne
         peut rien en dire. L'adresse du double ne mène nulle part — le DNS
         échoue et onglet.url() devient « chrome-error://… ». On écoute donc ce
         que le navigateur a DEMANDÉ, ce qui est justement la preuve cherchée :
         l'onglet est né, et il est parti chercher le PDF. */
      const demandes = [];
      s.page.context().on('request', r => demandes.push(r.url()));
      const [onglet] = await Promise.all([
        s.page.waitForEvent('popup', { timeout: 8000 }).catch(() => null),
        s.page.click('#coursListeProf button'),
      ]);
      await s.page.waitForTimeout(800);
      const demandee = demandes.filter(u => /exemple\.invalid\/cours\//.test(u))[0] || '';
      verifier('cliquer « Ouvrir » ouvre vraiment un onglet, sur l\'adresse du stockage',
        !!onglet && !!demandee,
        !onglet ? 'aucun onglet ne s\'est ouvert — window.open() appelé après l\'attente, Chrome l\'a bloqué'
                : 'onglet ouvert, mais aucune demande vers le stockage : ' + demandes.slice(-3).join(' , '));
      if(onglet) await onglet.close().catch(() => {});

      /* 3. Et l'élève ne doit RIEN voir ici : les cours vivent sur le portail
         (décision de Turquet, août 2026). Un panneau qui reviendrait par
         mégarde afficherait les mêmes PDF à deux endroits, avec deux vérités
         possibles le jour où l'un des deux cesserait d'être à jour. */
      await s.page.evaluate(async () => { await openThemes(); });
      await s.page.waitForTimeout(600);
      const cotEleve = await s.page.evaluate(() => ({
        panneau: !!document.getElementById('coursPanel'),
        texte: (document.querySelector('.screen.on') || document.body).innerText,
      }));
      verifier('la page des exercices ne montre aucun cours à l\'élève',
        !cotEleve.panneau && cotEleve.texte.indexOf('Cours n°3') < 0,
        cotEleve.panneau ? 'le panneau #coursPanel est revenu dans la page'
                         : 'le titre du cours s\'affiche encore à l\'élève');

      verifier('le dépôt et l\'ouverture n\'ont levé aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }


    /* ===== 6 septies bis. LE PROFESSEUR RENOMME UN ÉLÈVE, POUR DE VRAI ===== */
    /* Le banc principal exerce renameStudent() avec un prompt() postiche : il
       dit que la fonction fait ce qu'il faut, pas qu'on peut l'atteindre. Ici
       on CLIQUE le bouton, on répond à la vraie fenêtre du navigateur, et on
       relit la liste — c'est la règle « ne jamais livrer sans avoir exécuté ».
       Et il MESURE la rangée : elle porte trois boutons depuis aujourd'hui, et
       seul un vrai navigateur sait si le troisième reste atteignable. Le bord
       est un PETIT téléphone — 320 px : au-delà, rien ne se voit (mesuré). Ce
       qui cède là n'est pas la rangée mais la PAGE, qui s'élargit sous l'écran
       et emporte « Retirer » à droite, hors de portée, sans que rien ne
       rougisse nulle part. */
    titre('6 septies bis. LE PROFESSEUR RENOMME UN ÉLÈVE');
    if(!/async function renameStudent\(/.test(fs.readFileSync(path.join(RACINE, CIBLE), 'utf8'))){
      ignorer('le professeur renomme un élève depuis sa liste', 'ce niveau n\'a pas renameStudent()');
    } else {
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      await s.page.evaluate(t => {
        window.__faux.semer(t, [
          { id: 'e1', prenom: 'Theo', cle: 'cle-1', user_id: 'compte-1' },
          { id: 'e2', prenom: 'Léa',  cle: 'cle-2', user_id: 'compte-2' }]);
        show('teacher'); teacherTab('students');
      }, P.tableEleves);
      await s.page.waitForTimeout(600);

      /* 1. LA RANGÉE TIENT, y compris sur un petit téléphone. On mesure avant
         de cliquer : un bouton qu'on ne peut pas atteindre n'a pas besoin
         d'être juste.
         ET LE PREMIER JET MESURAIT AUTRE CHOSE : il comparait chaque bouton à
         SA rangée, et restait vert sous les deux sabotages. En flex, une
         rangée qui ne se replie pas ne laisse pas déborder ses boutons — elle
         GRANDIT avec eux. C'est la PAGE qui déborde alors, et « Retirer » qui
         sort de l'écran par la droite. Le bord est plus bas qu'on ne croit :
         mesuré, à 420 px le repli des boutons ne change RIEN ; c'est à 320 px
         que la page passe à 341 px et que « Retirer » devient inatteignable. */
      const mesurer = () => s.page.evaluate(() => {
        const vue = window.innerWidth, hors = [], vides = [];
        document.querySelectorAll('#rosterList li button').forEach(b => {
          const r = b.getBoundingClientRect();
          if(r.width < 1) vides.push(b.textContent.trim());
          else if(r.right > vue + 1 || r.left < -1) hors.push(b.textContent.trim());
        });
        return { debord: document.documentElement.scrollWidth - vue, hors: hors, vides: vides,
                 rangees: document.querySelectorAll('#rosterList li').length,
                 boutons: document.querySelectorAll('#rosterList li:first-child button').length };
      });
      const large = await mesurer();
      await s.page.setViewportSize({ width: 320, height: 900 });
      await s.page.waitForTimeout(400);
      const etroit = await mesurer();
      const plainte = (m, ou) => (m.debord > 1 || m.hors.length || m.vides.length)
        ? (ou + ' : ' + (m.debord > 1 ? 'la page déborde de ' + m.debord + ' px' : '') +
           (m.hors.length ? ' — hors de l\'écran : ' + m.hors.join(', ') : '') +
           (m.vides.length ? ' — bouton sans surface : ' + m.vides.join(', ') : '')) : '';
      verifier('les trois boutons d\'un élève restent atteignables, même sur un petit téléphone',
        large.rangees === 2 && large.boutons === 3
          && !plainte(large, '1280 px') && !plainte(etroit, '320 px'),
        large.rangees !== 2 ? (large.rangees + ' rangée(s) affichée(s) au lieu de 2')
          : large.boutons !== 3 ? ('boutons sur la première rangée : ' + large.boutons)
          : (plainte(large, 'à 1280 px') + ' ' + plainte(etroit, 'à 320 px')).trim());
      await s.page.setViewportSize({ width: 1280, height: 900 });
      await s.page.waitForTimeout(300);

      /* 2. LE CLIC, et la vraie fenêtre du navigateur. prompt() n'existe pas
         dans jsdom : c'est ici, et seulement ici, que le chemin entier se
         parcourt — le bouton, la question posée au professeur, l'écriture en
         base, et la liste redessinée. */
      let demande = '';
      s.page.on('dialog', d => { demande = d.message(); d.accept('Théo').catch(() => {}); });
      /* Playwright 1.6x n'a plus page.$ : on vise par localisateur. Et on vise
         la RANGÉE de Theo, pas la première venue — la liste est triée par
         prénom, « Léa » y passe devant, et le banc renommait l'autre élève. */
      const cible = s.page.locator('#rosterList li').filter({ hasText: 'Theo' })
                          .first().locator('button', { hasText: 'Renommer' });
      if(await cible.count() === 0){
        verifier('cliquer « Renommer » change le prénom, et la liste le montre', false,
          'aucun bouton « Renommer » dans la liste du professeur');
      } else {
        await cible.click();
        await s.page.waitForTimeout(800);
        const apresClic = await s.page.evaluate(t => ({
          base: (window.__faux.tables[t] || []).map(l => l.prenom).join(','),
          affiche: (document.getElementById('rosterList') || {}).textContent || '',
        }), P.tableEleves);
        verifier('cliquer « Renommer » change le prénom, et la liste le montre',
          apresClic.base === 'Théo,Léa' && /Théo/.test(apresClic.affiche),
          'en base : « ' + apresClic.base + ' » — affiché : « ' +
          apresClic.affiche.replace(/\s+/g, ' ').trim().slice(0, 80) + ' »');
        verifier('la question posée au professeur nomme l\'élève et le rassure sur son code',
          /Theo/.test(demande) && /code/i.test(demande),
          'le navigateur a demandé : « ' + String(demande).replace(/\s+/g, ' ').slice(0, 90) + ' »');
      }

      verifier('renommer n\'a levé aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }


    /* ===== 6 septies ter. LE CARNET DE NOTES, ET SON FICHIER ===== */
    /* Le banc principal exerce le calcul et lit le contenu du Blob : il dit que
       le tableau est juste, pas qu'on peut le télécharger. Ici on CLIQUE le
       bouton et on attend le vrai téléchargement du navigateur — jsdom n'en a
       aucun, c'est donc le seul banc qui puisse le voir.
       Et il MESURE : à vingt devoirs le tableau est plus large que la carte.
       C'est LUI qui doit défiler, jamais la page — une page qui part en travers
       emmène tout le tableau de bord avec elle, et rien ne rougirait. */
    titre('6 septies ter. LE CARNET DE NOTES DU PROFESSEUR');
    const srcMoy = fs.readFileSync(path.join(RACINE, CIBLE), 'utf8');
    const LISTE_DM = (srcMoy.match(/dmMoyDernier\s*=\s*dmMoyennes\(\s*([A-Za-z_$][\w$]*)\s*,/) || [])[1];
    if(!LISTE_DM){
      ignorer('le professeur télécharge les moyennes de sa classe',
        'ce niveau n\'a pas le tableau des moyennes');
    } else {
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      /* L'ONGLET D'ABORD, et il faut l'attendre : l'ouvrir RECHARGE la liste
         des devoirs depuis la configuration, et une liste semée avant se
         ferait écraser en silence — le banc mesurait alors un tableau à un
         seul devoir en se croyant à douze. On ouvre l'onglet par le panneau
         qui porte le tableau, jamais par son nom : il s'appelle « devoir »
         ici et « devoirs » en Première. */
      await s.page.evaluate(() => {
        show('teacher');
        const pane = document.getElementById('dmMoyennes').closest('.tpane');
        teacherTab(pane.id.replace('pane-', ''));
      });
      await s.page.waitForTimeout(700);
      await s.page.evaluate(async ([tEleves, tRes, liste]) => {
        const ids = Object.keys(TESTS).slice(0, 2);
        const devoirs = [];
        /* VINGT et non douze : la carte du professeur n'a pas la même largeur
           d'un niveau à l'autre — 648 px en Seconde et en Première, 1068 en
           Terminale (mesuré) — et à douze devoirs le tableau TIENT là-bas.
           Le contrôle ne mesurait alors plus rien, et il l'a dit plutôt que
           de passer au vert. Vingt déborde partout. */
        for(let n = 20; n >= 1; n--)          /* semés à l'envers : ils doivent sortir rangés */
          devoirs.push({ id:'d'+n, num:n, actif:true, titre:'Devoir '+n,
                         exercices:[{id:ids[0],modes:['train']},{id:ids[1],modes:['train']}] });
        /* « dmList » est déclarée en `let` : ce n'est PAS une propriété de
           window, et lui en poser une ne toucherait rien. L'affectation passe
           donc par un eval DIRECT, seul à voir la liaison lexicale globale. */
        eval(liste + ' = devoirs; dmSelId = "d1";');
        window.__faux.semer(tEleves, [
          { id:'z', prenom:'Zoé',   cle:'c-z', user_id:'u-z' },
          { id:'e', prenom:'Émile', cle:'c-e', user_id:'u-e' },
          { id:'a', prenom:'alice', cle:'c-a', user_id:'u-a' }]);
        window.__faux.semer(tRes, [
          { id:'r1', eleve_id:'e', percent:100, score:10, total:10,
            created_at:'2026-08-01T10:00:00Z',
            details:{ test:ids[0], mode:'train', dm:'d1' } }]);
        await renderDmMoyennes();
      }, [P.tableEleves, P.tableResultats, LISTE_DM]);
      await s.page.waitForTimeout(700);

      const vu = await s.page.evaluate(() => {
        const tbl = document.querySelector('#dmMoyennes table');
        const wrap = document.querySelector('#dmMoyennes .dm-moywrap');
        if(!tbl || !wrap) return { rendu:false };
        return {
          rendu: true,
          colonnes: [].slice.call(tbl.querySelectorAll('thead th')).map(t => t.textContent.trim()).join('|'),
          eleves: [].slice.call(tbl.querySelectorAll('tbody tr td.name')).map(t => t.textContent.trim()).join(','),
          /* la carte déborde-t-elle ? et est-ce le TABLEAU qui défile ? */
          debordPage: document.documentElement.scrollWidth - window.innerWidth,
          large: wrap.scrollWidth > wrap.clientWidth + 1,
          /* ET LE TABLEAU EST-IL LISIBLE ? Un tableau qui se COMPRIME au lieu
             de défiler ne déborde nulle part : il rogne ses cellules, et le
             contrôle du défilement reste vert sur un écran illisible. C'est le
             sabotage de « width:max-content » qui l'a montré. On mesure donc
             ce qui compte vraiment : aucune cellule ne coupe son contenu. */
          rognees: [].slice.call(tbl.querySelectorAll('td, th'))
            .filter(c => c.scrollWidth > c.clientWidth + 1)
            .map(c => c.textContent.trim() || '(vide)').slice(0, 4),
        };
      });
      verifier('le carnet range les devoirs par numéro et les élèves par ordre alphabétique',
        vu.rendu === true && /^Élève\|n°1\|n°2\|/.test(String(vu.colonnes || ''))
          && vu.eleves === 'alice,Émile,Zoé,Moyenne de la classe',
        !vu.rendu ? 'aucun tableau rendu'
                  : 'colonnes : ' + String(vu.colonnes || '').slice(0, 60) + ' — élèves : ' + vu.eleves);
      verifier('à vingt devoirs, c\'est le tableau qui défile, pas la page',
        vu.rendu === true && vu.large === true && vu.debordPage <= 1,
        !vu.rendu ? 'aucun tableau rendu'
          : (vu.large ? '' : 'le tableau ne déborde pas : le contrôle ne mesure rien à cette largeur — ')
            + 'la page déborde de ' + vu.debordPage + ' px');
      verifier('et aucune cellule ne rogne son contenu : le tableau défile, il ne se comprime pas',
        vu.rendu === true && (vu.rognees || []).length === 0,
        !vu.rendu ? 'aucun tableau rendu'
                  : 'cellule(s) coupée(s) : ' + (vu.rognees || []).join(' , '));

      /* LE TÉLÉCHARGEMENT, pour de vrai : le navigateur doit recevoir un
         fichier. Un « download » posé sur une adresse blob: est exactement ce
         que Chrome bloque quand il arrive après une attente — ici il ne doit
         rien y avoir entre le clic et l'enregistrement. */
      const [fichier] = await Promise.all([
        s.page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
        s.page.click('#dmMoyennes button'),
      ]);
      let contenu = '';
      if(fichier){
        try{ contenu = fs.readFileSync(await fichier.path(), 'utf8'); }catch(e){ contenu = ''; }
      }
      const lignesF = contenu.replace(/^﻿/, '').split('\r\n');
      verifier('cliquer « Télécharger en CSV » enregistre vraiment un fichier',
        !!fichier && /^moyennes-(devoirs|fiches)\.csv$/.test(fichier ? fichier.suggestedFilename() : ''),
        !fichier ? 'aucun téléchargement n\'a été proposé par le navigateur'
                 : 'nom du fichier : ' + fichier.suggestedFilename());
      verifier('le fichier téléchargé porte le tableau, dans le même ordre',
        !!contenu && /^"Élève";"n°1/.test(lignesF[0] || '')
          && /^"alice";/.test(lignesF[1] || '') && /^"Émile";"10";/.test(lignesF[2] || '')
          && /^"Zoé";/.test(lignesF[3] || ''),
        !contenu ? 'le fichier est vide ou illisible'
                 : 'lignes lues : ' + lignesF.slice(0, 3).join('  ·  ').slice(0, 140));

      verifier('le carnet de notes n\'a levé aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }


    /* ===== 6 septies quater. LES CASES D'INDICE DU 6.3 ===== */
    /* Une case d'INDICE ne porte qu'un « n+1 » ou un « 0 », posés en indice
       derrière un U. À la taille des autres cases elle écrasait ce U (demande
       de Turquet, août 2026). Elle a donc une police et une largeur à elle —
       et seul un vrai navigateur sait ce que ça donne à l'écran : jsdom n'a
       pas de mise en page, et la règle CSS y resterait une intention.
       Le bord OPPOSÉ compte autant : elle doit continuer de GRANDIR sous la
       frappe, comme les autres. Une case rapetissie qui aurait perdu son
       élasticité couperait « n+1 » — le défaut qu'on venait de corriger. */
    titre('6 septies quater. LES CASES D\'INDICE DU 6.3');
    if(!/function sa2Ajuster\(/.test(fs.readFileSync(path.join(RACINE, CIBLE), 'utf8'))){
      ignorer('les cases d\'indice sont plus petites que les autres, et grandissent quand même',
        'ce niveau n\'a pas la suite auxiliaire à compléter');
    } else {
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      await s.page.evaluate(async () => {
        currentEleve = { id:'e1', prenom:'Contrôle' }; currentMode = 'train';
        await startSA2();
        test.questions = [SA._t.mk(0.95, -4000, 10000)]; test.idx = 0; renderSA2();
      });
      await s.page.waitForTimeout(500);
      const t = await s.page.evaluate(() => {
        const m = id => { const e = document.getElementById(id); if(!e) return null;
          const r = e.getBoundingClientRect();
          return { p: parseFloat(getComputedStyle(e).fontSize), l: Math.round(r.width) }; };
        const av = m('sa2-i1');
        const e = document.getElementById('sa2-i1');
        if(e){ e.value = 'n+1'; e.dispatchEvent(new Event('input', { bubbles:true })); }
        const ap = m('sa2-i1');
        return { idx: av, ordinaire: m('sa2-a1'), idxPlein: ap };
      });
      /* « Plus petite » se MESURE, et il a fallu un sabotage pour le dire juste.
         Le premier jet demandait seulement « plus étroite que les autres » : la
         police réduite y suffisait à elle seule, si bien que retirer la largeur
         minimale dédiée aux indices ne faisait rougir personne — un garde-fou
         qu'on croit tenir et qui ne tient rien. On compare donc les largeurs :
         au repos l'indice fait 58 % d'une case ordinaire (25 px contre 43),
         contre 74 % (32 px) si on lui rend le minimum commun. Le seuil est
         posé entre les deux, avec de la marge des deux côtés. */
      const rapport = (t.idx && t.ordinaire && t.ordinaire.l) ? t.idx.l / t.ordinaire.l : 1;
      verifier('la case d\'indice a une police ET une largeur plus petites que les autres',
        !!t.idx && !!t.ordinaire && t.idx.p < t.ordinaire.p && rapport <= 0.65,
        !t.idx ? 'case d\'indice introuvable'
               : 'indice ' + t.idx.p + 'px / ' + t.idx.l + 'px — ordinaire '
                 + t.ordinaire.p + 'px / ' + t.ordinaire.l + 'px (rapport '
                 + Math.round(rapport * 100) + ' %, attendu au plus 65 %)');
      verifier('mais elle grandit quand même sous la frappe',
        !!t.idxPlein && t.idxPlein.l > t.idx.l,
        !t.idxPlein ? 'mesure impossible'
                    : 'au repos ' + t.idx.l + 'px, avec « n+1 » ' + t.idxPlein.l + 'px');
      verifier('le 6.3 n\'a levé aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 septies quinquies. la réponse du professeur, chez l'élève ===== */
    /* Le professeur peut répondre à un signalement (demande de Turquet, août
       2026), et la réponse se lit sur l'accueil de l'élève. Deux bords ne se
       voient QUE dans un navigateur :

       — LES RETOURS À LA LIGNE. Une réponse s'écrit volontiers en plusieurs
         lignes ; sans « white-space:pre-wrap » elles se réduisent à des
         espaces, et le professeur ne le saura jamais. C'est la leçon du
         conseil du modèle, sur une troisième famille de textes — et aucun banc
         hors navigateur ne sait où un texte va à la ligne ;

       — LE PANNEAU QUI NE DEVRAIT PAS ÊTRE LÀ. On mesure son RECTANGLE et non
         sa propriété « hidden » : [hidden] pose display:none depuis la feuille
         du NAVIGATEUR, qu'un display: écrit dans la page bat — c'est le piège
         déjà payé sur la zone de copie d'écran, où le banc lisait « true » sur
         une zone parfaitement visible. */
    titre('6 septies quinquies. LA RÉPONSE DU PROFESSEUR ARRIVE CHEZ L\'ÉLÈVE');
    if(!/function chargerReponsesProf\(/.test(fs.readFileSync(path.join(RACINE, CIBLE), 'utf8'))){
      ignorer('l\'élève lit la réponse de son professeur', 'ce niveau n\'a pas chargerReponsesProf()');
    } else {
      s = await ouvrir(chromium, ml, {});
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('l\'élève lit la réponse de son professeur', 'connexion impossible — rien à mesurer');
      } else {
        const m = await s.page.evaluate(async exo => {
          const AVEC = 'Regarde le rappel de cours.\nPuis refais la question 3.\n\nOn en reparle lundi.';
          const SANS = AVEC.replace(/\n+/g, ' ');
          const attendre = ms => new Promise(r => setTimeout(r, ms));
          const haut = el => el ? Math.round(el.getBoundingClientRect().height) : 0;
          const res = {};
          const id = currentEleve && currentEleve.id;
          res.eleve = !!id;
          const semer = rep => {
            window.__faux.tables[TABLE_SIG] = [{
              id: 's1', created_at: '2026-08-01T10:00:00Z', eleve_id: id, exercice: exo,
              numero: '1.1', mode: 'train', message: 'la case reste rouge alors que j\'ai bon',
              reponse: rep, repondu_at: rep ? '2026-08-02T10:00:00Z' : null }];
          };
          /* 1. aucune réponse écrite : rien ne doit occuper l'accueil */
          semer(null);
          await chargerReponsesProf(); await attendre(60);
          res.vide = haut(document.getElementById('repProf'));
          /* 2. la même réponse, avec puis sans ses retours à la ligne */
          for(const [cle, txt] of [['avec', AVEC], ['sans', SANS]]){
            semer(txt);
            await chargerReponsesProf(); await attendre(60);
            const t = document.querySelector('#repProf .rep-texte');
            res['eleve_' + cle] = t ? Math.round(t.getBoundingClientRect().height) : 0;
            res['lu_' + cle] = t ? t.textContent : '';
            res['panneau_' + cle] = haut(document.getElementById('repProf'));
          }
          /* 3. la MÊME règle sur la carte du professeur : le bloc CSS est
             commun, mais deux familles de classes y vivent — en mesurer une
             seule laisserait l'autre libre de perdre ses lignes. */
          show('teacher'); teacherTab('signalements'); await attendre(300);
          for(const [cle, txt] of [['avec', AVEC], ['sans', SANS]]){
            /* on repasse par chargerSignalements(), la vraie porte : poser
               mesSignalements à la main se faisait écraser par la lecture que
               l'ouverture de l'onglet avait lancée, et les deux mesures
               tombaient sur le MÊME texte — un contrôle qui parle d'autre
               chose, resté vert par accident. */
            semer(txt);
            await chargerSignalements(); await attendre(60);
            const t = document.querySelector('#sigListe .sig-rep');
            res['prof_' + cle] = t ? Math.round(t.getBoundingClientRect().height) : 0;
          }
          return res;
        }, P.navigateur.exercice);

        verifier('l\'accueil ne porte aucun panneau tant qu\'aucune réponse n\'est écrite',
          m.eleve === true && m.vide === 0,
          m.eleve ? 'le panneau occupe ' + m.vide + ' px alors qu\'aucune réponse n\'existe'
                  : 'aucun élève connecté : le contrôle ne mesure rien');
        verifier('l\'élève lit la réponse de son professeur sur son accueil',
          m.panneau_avec > 0 && String(m.lu_avec || '').indexOf('rappel de cours') >= 0,
          'panneau : ' + m.panneau_avec + ' px — lu : « ' + String(m.lu_avec || '').slice(0, 60) + ' »');
        /* Deux hauteurs nulles ne veulent pas dire « les retours sont perdus » :
           elles veulent dire que RIEN n'a été mesuré. */
        const juge = (intitule, a, b) => {
          const A = m[a] || 0, B = m[b] || 0;
          if(!A && !B){ verifier(intitule, false, 'aucune réponse affichée : le contrôle ne mesure rien'); return; }
          verifier(intitule, A - B > 8,
            'même hauteur avec et sans retours à la ligne (' + A + ' px contre ' + B +
            ') : la page les réduit à des espaces');
        };
        juge('les retours à la ligne de la réponse se voient chez l\'élève', 'eleve_avec', 'eleve_sans');
        juge('et se voient aussi dans la carte du professeur', 'prof_avec', 'prof_sans');
        verifier('la réponse n\'a levé aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 septies sexies. la case où l'élève écrit ne se colore pas ===== */
    /* Décision de Turquet (août 2026) : en SOUTIEN, une case ne devient ni rouge
       ni bleue tant que l'élève y écrit. Elle attend qu'il la QUITTE — case
       suivante, clic ailleurs — ou qu'il vérifie.

       LE CONTRÔLE TAPE POUR DE VRAI, et c'est tout son intérêt. Le banc
       principal éprouve le garde sur une case d'essai et une correction
       d'essai ; ici on ouvre un exercice, on clique dans sa case, on frappe au
       clavier et on lit la couleur — le garde doit tenir contre du vrai code de
       correction, celui qui repeint l'écran entier à chaque touche.

       DEUX BORDS, et le second empêche le premier d'être creux : la case ne
       doit rien porter pendant la frappe, MAIS la couleur doit avoir été
       CALCULÉE (retenue) — sans cette exigence, le contrôle resterait vert sur
       une case que personne ne juge, en parlant d'autre chose. Puis la touche
       Tab, qui est le geste « je passe à la suivante », doit la faire paraître. */
    titre('6 septies sexies. LA CASE OÙ L\'ÉLÈVE ÉCRIT NE SE COLORE PAS');
    if(!P.gardeSaisie){
      ignorer('en soutien, la case où l\'élève écrit ne se colore pas',
        'ce niveau ne déclare pas de case témoin pour le garde de la saisie');
    } else {
      s = await ouvrir(chromium, ml, {});
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('en soutien, la case où l\'élève écrit ne se colore pas',
          'connexion impossible — rien à mesurer');
      } else {
        const G = P.gardeSaisie;
        await s.page.evaluate(id => openTest(id), G.exercice);
        await s.page.waitForTimeout(400);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='soutien'") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(700);
        const boite = s.page.locator(G.champ).first();
        const etat = () => boite.evaluate(el => ({
          classes: ['ok','bad'].filter(c => el.classList.contains(c)).join(','),
          retenue: (el.dataset && el.dataset.couleurDifferee) || '',
          focus: document.activeElement === el,
        }));
        let pendant = null, apres = null, rejuge = null, souci = '';
        try{
          await boite.waitFor({ timeout: 8000 });
          await boite.click();
          await boite.type(G.valeur, { delay: 40 });
          await s.page.waitForTimeout(120);
          pendant = await etat();
          /* Tab : « je passe à la case suivante » — l'un des trois gestes que
             Turquet a nommés, et le seul qui ne demande pas de savoir où
             cliquer sans tomber sur une autre case. */
          await s.page.keyboard.press('Tab');
          await s.page.waitForTimeout(200);
          apres = await etat();
          /* et une case DÉJÀ jugée se re-juge sous les doigts : sans ce bord,
             l'élève qui corrige son rouge devrait cliquer ailleurs pour savoir
             s'il a réussi. */
          await boite.click();
          await s.page.keyboard.press('Control+a');
          await s.page.keyboard.type('1', { delay: 40 });
          await s.page.waitForTimeout(120);
          rejuge = await etat();
        }catch(e){ souci = e.message; }

        verifier('la case témoin du garde est bien celle qu\'on croit tenir',
          !!pendant && pendant.focus === true,
          souci || 'la case « ' + G.champ + ' » de ' + G.exercice + ' n\'a pas reçu le focus : rien n\'est mesuré');
        verifier('pendant la frappe, la case ne se colore pas — mais la couleur est calculée',
          !!pendant && pendant.classes === '' && pendant.retenue !== '',
          souci || 'classes : « ' + (pendant && pendant.classes) + ' », couleur retenue : « ' +
                   (pendant && pendant.retenue) + ' » (vide = personne ne juge cette case, le contrôle ne mesure rien)');
        verifier('en passant à la case suivante, la couleur arrive',
          !!apres && apres.classes !== '',
          souci || 'classes après Tab : « ' + (apres && apres.classes) + ' »');
        verifier('une case déjà jugée se re-juge sous les doigts',
          !!rejuge && rejuge.classes !== '' && rejuge.focus === true,
          souci || 'classes en frappant dans une case déjà jugée : « ' + (rejuge && rejuge.classes) + ' »');

        /* ----- la bulle « Comprendre mon erreur » (demande de Turquet,
           septembre 2026) : la même case témoin, quittée FAUSSE, doit faire
           paraître la bulle — mesurée au RECTANGLE, jamais à la propriété
           hidden ([hidden] pose display:none depuis la feuille du NAVIGATEUR,
           le piège documenté). Deux chiffres différents ne peuvent pas être
           justes tous les deux dans la même case : on essaie « 9 » puis « 4 »
           pour obtenir un rouge GARANTI — un contrôle qui mesurerait une case
           parfois juste serait intermittent, le péché documenté. Puis le clic
           du bouton obtient la réponse du double (« Indice de contrôle. »),
           et la MODIFIER l'efface — y entrer, non : la page pose elle-même le
           curseur dans la première case rouge après une vérification. ----- */
        let bulle = null, bulleClic = null, bulleEntre = null, bulleReprise = null, bulleSouci = '';
        try{
          let rouge = false;
          for(const v of ['9', '4']){
            await boite.click();
            await s.page.keyboard.press('Control+a');
            await s.page.keyboard.type(v, { delay: 40 });
            await s.page.keyboard.press('Tab');
            await s.page.waitForTimeout(350);
            const c = await etat();
            if(c.classes === 'bad'){ rouge = true; break; }
          }
          if(rouge){
            bulle = await s.page.evaluate(sel => {
              const b = document.getElementById('bexpBulle');
              if(!b) return { la: false };
              const r = b.getBoundingClientRect();
              const t = b.querySelector('[data-bexp-btn]');
              const cmd = document.getElementById('testCtrls');
              const rc = cmd ? cmd.getBoundingClientRect() : null;
              const chev = (a, o) => !(a.right <= o.left || a.left >= o.right ||
                                       a.bottom <= o.top || a.top >= o.bottom);
              const cas = document.querySelector(sel);
              const rk = cas ? cas.getBoundingClientRect() : null;
              const cote = b.dataset.bexpCote || '';
              /* AUCUNE case recouverte : c'est l'objection qui avait imposé le
                 coin fixe, et elle est tenue autrement — pas abandonnée. */
              const couvertes = [...document.querySelectorAll(
                  '.screen.on input,.screen.on select,.screen.on textarea,' +
                  '.screen.on math-field,.screen.on .pts-case')]
                .filter(e => e !== cas && !e.contains(cas))
                .map(e => e.getBoundingClientRect())
                .filter(o => o.width > 0 && o.height > 0 && chev(r, o)).length;
              /* la flèche est-elle DESSINÉE ? on lit le pseudo-élément : un CSS
                 perdu la ferait disparaître sans qu'une erreur ne se lève, et la
                 bulle serait « à côté » sans rien désigner. */
              const bord = { droite:'Right', gauche:'Left', haut:'Top', bas:'Bottom' }[cote] || '';
              const ps = cote ? getComputedStyle(b, '::before') : null;
              const pa = cote ? getComputedStyle(b, '::after') : null;
              const fx = parseFloat(getComputedStyle(b).getPropertyValue('--bexp-fx')) || 0;
              /* la POINTE est LUE SUR LE PSEUDO-ÉLÉMENT, jamais recalculée depuis
                 --bexp-fx : la recalculer, c'est mesurer sa propre arithmétique et
                 rester vert sur une feuille de styles qui dessine la flèche
                 ailleurs — le sabotage du « - 10px » l'a montré. Le triangle est
                 une boîte de 20 px dont la pointe tombe 10 px dedans, du côté de
                 la case ; getComputedStyle rend les décalages EN USAGE, donc top
                 et left valent l'offset réel même là où la règle pose bottom ou
                 right. */
              let ecart = null, surLaCase = null, pointe = null;
              let ecartCentre = null, fxBorne = null;
              if(cote && rk && ps){
                const nb = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };
                let bx = nb(ps.left), by = nb(ps.top);
                if(bx === null){ const rr = nb(ps.right); if(rr !== null) bx = r.width - rr - 20; }
                if(by === null){ const bb = nb(ps.bottom); if(bb !== null) by = r.height - bb - 20; }
                if(bx !== null && by !== null){
                  const gx = r.left + bx, gy = r.top + by;   /* coin de la boîte du triangle */
                  let px, py, d, bas, haut;
                  if(cote === 'droite'){ px = gx + 10; py = gy + 10; d = px - rk.right;  bas = rk.top;  haut = rk.bottom; }
                  if(cote === 'gauche'){ px = gx + 10; py = gy + 10; d = rk.left - px;   bas = rk.top;  haut = rk.bottom; }
                  if(cote === 'haut'){   px = gx + 10; py = gy + 10; d = rk.top - py;    bas = rk.left; haut = rk.right; }
                  if(cote === 'bas'){    px = gx + 10; py = gy + 10; d = py - rk.bottom; bas = rk.left; haut = rk.right; }
                  ecart = Math.round(d);
                  const long = (cote === 'droite' || cote === 'gauche') ? py : px;
                  surLaCase = long >= bas - 2 && long <= haut + 2;
                  pointe = Math.round(px) + ',' + Math.round(py);
                  /* « dans l'étendue » est un bord TROP LÂCHE : sur une case de
                     40 px, une pointe déplacée de 10 px y tombe encore, et le
                     sabotage du « - 10px » restait vert. La promesse est plus
                     étroite — la pointe suit le CENTRE de la case —, sauf quand
                     la bulle a dû BORNER fx pour ne pas sortir de ses coins
                     arrondis : là elle vise d'aussi près que la borne permet, et
                     c'est l'étendue qui redevient le seul bord mesurable. */
                  ecartCentre = Math.round(Math.abs(long - (bas + haut) / 2));
                  const lim = (cote === 'droite' || cote === 'gauche') ? r.height : r.width;
                  fxBorne = Math.abs(fx - 18) < 0.5 || Math.abs(fx - (lim - 18)) < 0.5;
                }
              }
              return {
                la: true, l: Math.round(r.width), h: Math.round(r.height),
                bouton: !!t && !t.hidden, cote: cote, couvertes: couvertes,
                ecart: ecart, surLaCase: surLaCase, pointe: pointe,
                ecartCentre: ecartCentre, fxBorne: fxBorne,
                fleche: ps ? Math.round(parseFloat(ps['border' + bord + 'Width']) || 0) : 0,
                encre: ps ? ps['border' + bord + 'Color'] : '',
                fond: pa ? pa['border' + bord + 'Color'] : '',
                surCommandes: rc ? chev(r, rc) : false,
              };
            }, G.champ);
            await s.page.click('#bexpBulle [data-bexp-btn]');
            await s.page.waitForTimeout(400);
            bulleClic = await s.page.evaluate(() => {
              const fb = document.querySelector('#bexpBulle [data-bexp-r]');
              return { texte: (fb && fb.textContent) || '',
                       visible: !!fb && fb.getBoundingClientRect().height > 0 };
            });
            /* ENTRER dans la case ne l'efface plus : après une vérification,
               la page pose elle-même le curseur dans la première case rouge,
               et la bulle s'éteindrait 40 ms après être née. La MODIFIER
               l'efface — reprendre sa case, c'est la CORRIGER. */
            const cachee = () => s.page.evaluate(() => {
              const b = document.getElementById('bexpBulle');
              return !b || b.getBoundingClientRect().height === 0;
            });
            await boite.click();
            await s.page.waitForTimeout(150);
            bulleEntre = !(await cachee());
            await s.page.keyboard.press('Control+a');
            await s.page.keyboard.type('7', { delay: 40 });
            await s.page.waitForTimeout(250);
            bulleReprise = await cachee();
          }
        }catch(e){ bulleSouci = e.message; }
        verifier('en soutien, une case rouge quittée fait paraître la bulle « Comprendre mon erreur »',
          !!bulle && bulle.la && bulle.l > 0 && bulle.h > 0 && bulle.bouton,
          bulleSouci || (!bulle ? 'aucune case rouge obtenue : le contrôle ne mesure rien'
                                : 'bulle mesurée : ' + JSON.stringify(bulle)));
        verifier('la bulle ne recouvre pas les commandes du bas',
          !!bulle && bulle.surCommandes === false,
          (bulle && bulle.surCommandes) ? 'la bulle chevauche #testCtrls — la leçon du pavé numérique, et le clic d\'à côté part dans la bulle'
                                        : (bulleSouci || 'la bulle n\'a pas été mesurée'));
        /* ----- la bulle est À CÔTÉ de la case, une flèche pointée sur elle
           (demande de Turquet, septembre 2026). jsdom mesure le CHOIX sur des
           rectangles posés à la main ; ici c'est le RENDU — la flèche vraiment
           dessinée, sa pointe sur la case, et aucune case recouverte. ----- */
        verifier('la bulle s\'ancre à CÔTÉ de la case, jamais au coin quand la place existe',
          !!bulle && ['droite', 'gauche', 'haut', 'bas'].indexOf(bulle.cote) >= 0,
          bulleSouci || 'côté retenu : « ' + ((bulle && bulle.cote) || '') +
            ' » (vide = repli au coin : aucun des quatre côtés n\'était libre sur cet écran)');
        verifier('sa flèche est DESSINÉE, à l\'encre du cadre doublée du fond',
          !!bulle && bulle.fleche >= 8 && /\d/.test(bulle.encre) && /\d/.test(bulle.fond) &&
            bulle.encre !== bulle.fond,
          bulleSouci || 'flèche mesurée : ' + (bulle && bulle.fleche) + ' px, encre « ' +
            (bulle && bulle.encre) + ' », fond « ' + (bulle && bulle.fond) + ' »');
        verifier('sa pointe touche la case, et tombe sur son CENTRE',
          !!bulle && bulle.ecart !== null && bulle.ecart >= 0 && bulle.ecart <= 8 &&
            bulle.surLaCase === true &&
            (bulle.fxBorne === true || bulle.ecartCentre <= 3),
          bulleSouci || 'pointe RENDUE en ' + (bulle && bulle.pointe) + ', à ' +
            (bulle && bulle.ecart) + ' px de la case, dans son étendue : ' +
            (bulle && bulle.surLaCase) + ', à ' + (bulle && bulle.ecartCentre) +
            ' px de son centre' + ((bulle && bulle.fxBorne) ? ' (fx borné)' : ''));
        verifier('elle ne recouvre AUCUNE autre case — l\'objection du coin fixe, tenue',
          !!bulle && bulle.couvertes === 0,
          bulleSouci || (bulle && bulle.couvertes) + ' case(s) recouverte(s) : le clic de l\'élève partirait dans la bulle');
        verifier('le bouton de la bulle obtient une explication du modèle, affichée dedans',
          !!bulleClic && bulleClic.visible && bulleClic.texte.indexOf('Indice de contrôle') >= 0,
          bulleSouci || 'réponse affichée : « ' + ((bulleClic && bulleClic.texte) || '') + ' »');
        verifier('entrer dans la case n\'efface plus la bulle ; la MODIFIER l\'efface',
          bulleEntre === true && bulleReprise === true,
          bulleSouci || 'à l\'entrée dans la case : ' + bulleEntre + ', après la frappe : ' + bulleReprise);

        verifier('le garde de la saisie n\'a levé aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 septies decies. la bulle que lève la VÉRIFICATION ===== */
    /* Demande de Turquet (septembre 2026) : « en mode soutien, pour la partie
       algorithme en Seconde, je veux qu'il y ait des bulles qui apparaissent
       dès qu'une case est fausse, comme ça devrait être la règle pour tous
       les exercices. » Un exercice SANS correction en direct ne peint qu'au
       clic sur « Vérifier », et l'élève n'y quitte alors aucune case : la
       bulle n'y paraissait JAMAIS.

       jsdom mesure le MÉCANISME sur des cases posées à la main ; ici c'est le
       GESTE — un vrai exercice de la partie Algorithmique et Python, une copie
       fausse choisie dans les vraies listes, un vrai clic sur « Vérifier » —
       et le RECTANGLE, jamais la propriété hidden ([hidden] pose display:none
       depuis la feuille du NAVIGATEUR, le piège documenté).

       ET LE BORD QUE SEUL UN NAVIGATEUR VOIT EST LE CURSEUR : la page pose
       elle-même le curseur dans la première case rouge, 40 ms après la
       vérification. La bulle doit y SURVIVRE — c'est pour cela que « reprendre
       sa case » est devenu « la CORRIGER ». */
    titre('6 septies decies. LA VÉRIFICATION LÈVE LA BULLE « COMPRENDRE MON ERREUR »');
    if(!P.bulleVerification){
      ignorer('la vérification lève la bulle « Comprendre mon erreur »',
        'ce niveau ne déclare pas d\'exercice témoin sans correction en direct');
    } else {
      const BV = P.bulleVerification;
      s = await ouvrir(chromium, ml, {});
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('la vérification lève la bulle « Comprendre mon erreur »',
          'connexion impossible — rien à mesurer');
      } else {
        await s.page.evaluate(id => openTest(id), BV.exercice);
        await s.page.waitForTimeout(400);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='soutien'") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(800);
        let posees = 0, m = null, apres = null, suit = null, souci = '';
        try{
          await s.page.waitForSelector(BV.cases, { timeout: 8000 });
          posees = await s.page.evaluate(code => eval(code), BV.faux);
          await s.page.click(BV.valider);
          /* on mesure APRÈS le curseur que la page pose elle-même (40 ms) */
          await s.page.waitForTimeout(700);
          m = await s.page.evaluate(() => {
            const b = document.getElementById('bexpBulle');
            const r = b ? b.getBoundingClientRect() : null;
            const rouges = [...document.querySelectorAll('.screen.on .bad')];
            const cas = rouges[0] || null;
            const btn = b && b.querySelector('[data-bexp-btn]');
            const cmd = document.getElementById('testCtrls');
            const rc = cmd ? cmd.getBoundingClientRect() : null;
            const chev = (a, o) => !(a.right <= o.left || a.left >= o.right ||
                                     a.bottom <= o.top || a.top >= o.bottom);
            const recouvre = sel => (!r || !cas) ? -1 : [...document.querySelectorAll(sel)]
              .filter(e => e !== cas && !e.contains(cas))
              .map(e => e.getBoundingClientRect())
              .filter(o => o.width > 0 && o.height > 0 && chev(r, o)).length;
            const couvertes = recouvre('.screen.on input,.screen.on select,' +
              '.screen.on textarea,.screen.on math-field,.screen.on .pts-case');
            /* et aucun BOUTON : la bulle paraît au moment précis où la rangée
               d'actions dit « Revérifier » — posée dessus, elle le rendrait
               incliquable, et l'élève ne pourrait plus rien vérifier. */
            const boutons = recouvre('.screen.on button');
            return {
              rouges: rouges.length,
              verrou: !!(typeof test !== 'undefined' && test.locked),
              visible: !!r && r.width > 0 && r.height > 0,
              l: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
              bouton: !!btn && !btn.hidden,
              surLaPremiere: !!cas && bexpCase === cas,
              curseur: !!cas && document.activeElement === cas,
              cote: (b && b.dataset.bexpCote) || '',
              couvertes: couvertes, boutons: boutons,
              surCommandes: (r && rc) ? chev(r, rc) : false,
            };
          });
          /* LA BULLE SUIT LA CASE QUE L'ÉLÈVE REGARDE (demande de Turquet,
             septembre 2026). Une vérification n'en lève qu'UNE, sur la
             première case rouge : toutes les autres restaient sans rien à
             côté d'elles — une question du 3.2 de la Terminale en porte
             jusqu'à douze, et l'élève qui regardait sa limite fausse n'avait
             rien à cliquer. On CLIQUE la DEUXIÈME case rouge, comme il le
             ferait, et la bulle doit l'y suivre. */
          const rouges2 = await s.page.evaluate(() => {
            const r = [...document.querySelectorAll('.screen.on .bad')]
              .filter(e => ['INPUT','SELECT','TEXTAREA','MATH-FIELD'].indexOf(e.tagName) >= 0);
            if(r.length < 2) return 0;
            r[1].setAttribute('data-banc-cible', '1');
            return r.length;
          });
          if(rouges2 >= 2){
            await s.page.click('[data-banc-cible]');
            await s.page.waitForTimeout(400);
            suit = await s.page.evaluate(() => {
              const b = document.getElementById('bexpBulle');
              const c = document.querySelector('[data-banc-cible]');
              const r = b ? b.getBoundingClientRect() : null;
              return { visible: !!r && r.width > 0 && r.height > 0, surElle: bexpCase === c };
            });
          }
          /* et la MODIFIER l'efface : c'est ça, reprendre sa case. On agit sur
             la case de la BULLE, quelle qu'elle soit — une liste en Seconde, un
             champ MATHÉMATIQUE en Terminale : modifier la première case du
             profil changerait une case dont la bulle ne parle pas, et le
             contrôle passerait au vert en parlant d'autre chose. */
          const genre = await s.page.evaluate(() => {
            if(!bexpCase) return '';
            bexpCase.setAttribute('data-banc-bulle', '1');
            return bexpCase.tagName;
          });
          if(genre === 'SELECT'){
            const cible = s.page.locator('[data-banc-bulle]');
            const choix = await cible.evaluate(e => {
              const l = [].slice.call(e.options);
              for(let i = 0; i < l.length; i++){
                if(!l[i].disabled && l[i].value !== '' && i !== e.selectedIndex) return i;
              }
              return -1;
            });
            if(choix >= 0) await cible.selectOption({ index: choix });
          } else if(genre){
            await s.page.click('[data-banc-bulle]');
            await s.page.keyboard.type('9');
          }
          if(genre){
            await s.page.waitForTimeout(400);
            apres = await s.page.evaluate(() => {
              const b = document.getElementById('bexpBulle');
              return !b || b.getBoundingClientRect().height === 0;
            });
          }
        }catch(e){ souci = e.message; }

        verifier('la copie fausse est posée et la vérification laisse des cases rouges',
          posees > 0 && !!m && m.rouges > 0 && m.verrou === false,
          souci || 'cases faussées : ' + posees + ', cases rouges après vérification : ' +
            (m && m.rouges) + ', écran verrouillé : ' + (m && m.verrou) +
            ' (rien de rouge = le contrôle ne mesure rien)');
        verifier('la bulle paraît à la VÉRIFICATION, sur la première case rouge, bouton offert',
          !!m && m.visible === true && m.l > 0 && m.h > 0 && m.bouton === true && m.surLaPremiere === true,
          souci || 'bulle mesurée : ' + JSON.stringify(m || {}));
        if(!BV.curseurPose){
          ignorer('la page pose le curseur dans la case rouge, et la bulle y SURVIT',
            'ce niveau ne pose pas le curseur dans la première case rouge après la vérification');
        } else {
          verifier('la page pose le curseur dans la case rouge, et la bulle y SURVIT',
            !!m && m.curseur === true && m.visible === true,
            souci || (m && m.curseur === false
              ? 'la page n\'a pas posé le curseur dans la case rouge : le bord n\'est pas mesuré'
              : 'la bulle s\'est éteinte au moment où la page a posé le curseur'));
        }
        verifier('la bulle SUIT la case que l\'élève regarde — sinon les autres cases rouges restent muettes',
          !!suit && suit.visible === true && suit.surElle === true,
          souci || (suit === null
            ? 'moins de deux cases rouges après la vérification : le contrôle ne mesure rien'
            : 'bulle visible : ' + suit.visible + ', posée sur la case cliquée : ' + suit.surElle));
        verifier('elle ne recouvre ni les commandes du bas, ni une autre case, ni un BOUTON',
          !!m && m.surCommandes === false && m.couvertes === 0 && m.boutons === 0,
          souci || ((m && m.couvertes === -1)
            ? 'aucune bulle à mesurer : le contrôle d\'au-dessus dit pourquoi'
            : 'commandes recouvertes : ' + (m && m.surCommandes) +
              ', cases recouvertes : ' + (m && m.couvertes) +
              ', boutons recouverts : ' + (m && m.boutons) +
              ' (un bouton sous la bulle, c\'est « Revérifier » devenu incliquable)'));
        verifier('changer la réponse efface la bulle — reprendre sa case, c\'est la CORRIGER',
          apres === true,
          souci || 'la bulle reste affichée alors que l\'élève vient de changer sa réponse');
        verifier('la bulle de la vérification n\'a levé aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 septies septies. les cases du 6.3 : l'encre et la place ===== */
    /* Deux demandes de Turquet (août 2026), et les deux ne se mesurent que
       dans un navigateur.

       L'ENCRE. Les cases étaient en Fredoka 1,2 rem GRASSE au milieu d'un texte
       en Nunito 20 px maigre : une écriture d'un autre alphabet posée au milieu
       du calcul. Elles prennent maintenant la police de la rangée qui les
       entoure — famille, taille et graisse — et « font:inherit » ne se vérifie
       qu'en lisant ce que le navigateur a RÉSOLU.

       LA PLACE. « une partie de 2000 est effacée » : la largeur est posée en
       « ch », et la page étant en « box-sizing:border-box », ces ch
       comprenaient le rembourrage et la bordure — le texte était amputé de
       16 px. On mesure donc la LARGEUR DU TEXTE dans la police effective de la
       case (un canevas, jamais une estimation) et on exige que le contenu tienne
       avec une marge. Mesurer « scrollWidth > clientWidth » n'aurait rien dit :
       un input rend 1 px de plus même VIDE, et ce bruit noierait le défaut. */
    titre('6 septies septies. LE 6.3 : L\'ENCRE, LA PLACE ET LA PHRASE');
    if(!/function sa2Ajuster\(/.test(fs.readFileSync(path.join(RACINE, CIBLE), 'utf8'))){
      ignorer('les cases du 6.3 prennent la police de leur rangée', 'ce niveau n\'a pas le 6.3');
    } else {
      s = await ouvrir(chromium, ml, {});
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('les cases du 6.3 prennent la police de leur rangée', 'connexion impossible — rien à mesurer');
      } else {
        await s.page.evaluate(() => openTest('suite-auxiliaire-2'));
        await s.page.waitForTimeout(400);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='train'") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(800);
        const m = await s.page.evaluate(() => {
          const res = { cases: 0, encre: [], serre: [] };
          const rangee = document.querySelector('#scr-sa2 .sa2-row');
          if(!rangee) return res;
          const sr = getComputedStyle(rangee);
          res.rangee = sr.fontFamily.split(',')[0].replace(/["']/g, '') + ' ' + sr.fontSize + ' ' + sr.fontWeight;
          const ctx = document.createElement('canvas').getContext('2d');
          const large = (el, txt) => {
            const st = getComputedStyle(el);
            ctx.font = st.fontStyle + ' ' + st.fontWeight + ' ' + st.fontSize + ' ' + st.fontFamily;
            return ctx.measureText(txt).width;
          };
          [...document.querySelectorAll('#scr-sa2 .sa2-in')].forEach(el => {
            res.cases++;
            const st = getComputedStyle(el);
            const idx = el.classList.contains('sa2-mot');
            /* une case de NOMBRE écrit comme sa rangée ; une case d'INDICE est
               volontairement plus petite (décision antérieure de Turquet) mais
               garde la même famille et la même graisse. */
            const memeFamille = st.fontFamily.split(',')[0].replace(/["']/g, '')
                              === sr.fontFamily.split(',')[0].replace(/["']/g, '');
            const grasse = parseInt(st.fontWeight, 10) >= 600;
            const memeTaille = idx ? true : st.fontSize === sr.fontSize;
            if(!memeFamille || grasse || !memeTaille)
              res.encre.push(el.id + ' : ' + st.fontFamily.split(',')[0] + ' ' + st.fontSize + ' ' + st.fontWeight);
            /* la place : le contenu doit tenir, marge comprise */
            ['2000', '10000', '\u22123800', 'n+1', '0,8'].forEach(v => {
              el.value = v; sa2Ajuster(el);
              const s2 = getComputedStyle(el);
              const dispo = el.clientWidth - (parseFloat(s2.paddingLeft) || 0) - (parseFloat(s2.paddingRight) || 0);
              const texte = large(el, v);
              if(dispo < texte + 2)
                res.serre.push(el.id + ' « ' + v + ' » : ' + Math.round(dispo) + ' px pour ' + Math.round(texte));
            });
            el.value = ''; sa2Ajuster(el);
          });
          return res;
        });

        verifier('les cases du 6.3 sont bien là pour être mesurées',
          m.cases >= 10, 'seulement ' + m.cases + ' case(s) trouvée(s) : le contrôle ne mesure rien');
        verifier('les cases du 6.3 écrivent comme la rangée qui les entoure, sans gras',
          m.cases >= 10 && m.encre.length === 0,
          'rangée : ' + m.rangee + ' — cases qui s\'en écartent : ' + m.encre.slice(0, 4).join(' | '));
        verifier('aucune case du 6.3 ne rogne ce qu\'on y écrit',
          m.cases >= 10 && m.serre.length === 0,
          'trop serrées : ' + m.serre.slice(0, 4).join(' | '));
        /* UNE ÉTAPE PAR LIGNE, LES « = » ALIGNÉS (demande de Turquet, août
           2026). Le banc principal tient la structure — aucun « = » hors de
           la colonne — mais l'ALIGNEMENT est une affaire de pixels : chaque
           « = » de la chaîne du a) est right-aligné dans sa colonne .sa2-eq,
           et si l'étiquette « Vₙ₊₁ = » débordait de la largeur réservée, son
           « = » partirait à droite des autres sans qu'aucune classe ne
           change. On mesure donc le bord DROIT de chaque .sa2-eq. */
        const al = await s.page.evaluate(() => {
          const eqs = [...document.querySelectorAll('#sa2LadderA .sa2-eq')];
          const droits = eqs.map(e => Math.round(e.getBoundingClientRect().right * 10) / 10);
          return {
            n: eqs.length,
            finissentPar: eqs.every(e => /=\s*$/.test(e.textContent)),
            droits: droits,
            ecart: droits.length ? Math.max(...droits) - Math.min(...droits) : 999,
          };
        });
        verifier('la chaîne du a) du 6.3 : un « = » par ligne, tous dans la colonne',
          al.n === 6 && al.finissentPar,
          al.n + ' rangée(s) à « = » — chacune doit finir par « = »');
        verifier('les « = » de la chaîne du a) sont alignés, celui du haut compris',
          al.ecart <= 1.5,
          'bords droits : ' + al.droits.join(' / ') + ' (écart ' + Math.round(al.ecart) + ' px)');

                verifier('les cases du 6.3 n\'ont levé aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));

        /* LA PHRASE DE LA CORRECTION PORTE LES COULEURS QU'ELLE NOMME.
           Troisième demande de Turquet sur cette capture : « les cases justes
           sont en bleu » doit s'écrire en BLEU, « les fausses sont rouges » en
           ROUGE, « avec la bonne réponse en vert » en VERT, le reste en noir.
           Lire les classes dans le HTML ne prouverait RIEN : la phrase vit dans
           un « .mp-feedback », et une règle plus SPÉCIFIQUE posée là pour une
           autre famille de textes bat la nôtre sans que le HTML change d'un
           caractère — c'est exactement ce qui est arrivé avec « fb-ok », déjà
           pris par les morceaux [OK] du retour de l'IA. On mesure donc l'encre
           RÉSOLUE.
           Et on la compare à l'encre des CASES, jamais à une dominante :
           « bleu » n'est pas un intervalle de teintes, c'est la couleur que la
           page donne à une case juste. Une convention qui tournerait
           emmènerait les deux du même côté, et « le reste en noir » se dit
           « la même encre que le texte ordinaire » — #1E2A4A est un noir bleuté
           qu'aucune dominante ne sait ranger. */
        const c = await s.page.evaluate(() => {
          const q = test.questions[test.idx];
          const att = sa2Attendu(q);
          /* une seule case, FAUSSE : c'est le chemin qui écrit la phrase */
          const id = SA2_IDS.find(x => document.getElementById(x)
                                    && document.getElementById(x).tagName === 'INPUT');
          const el = document.getElementById(id);
          el.value = String(att[id][1]) + '9';        /* jamais la bonne réponse */
          checkSA2();
          const fb = document.getElementById('sa2Feedback');
          /* LES ENCRES DE RÉFÉRENCE SONT LES VARIABLES DE LA CONVENTION, pas
             une teinte recopiée : « --blue » est la couleur que la feuille
             donne au JUSTE, « --red » au faux, « --green » à la correction —
             les mêmes que relit « 9 bis » sur les règles de verdict. Le jour
             où la convention tourne, la phrase tourne avec elle et le contrôle
             reste juste. (Prendre la couleur du TEXTE d'une case ne dirait
             rien : sur un « input », ce sont la bordure et le fond qui
             changent, l'encre reste celle du texte ordinaire.)
             On résout chaque variable en peignant un témoin : la feuille rend
             « #2B50C8 » là où le navigateur rend « rgb(43, 80, 200) ». */
          const encre = (e) => getComputedStyle(e).color;
          const temoin = document.createElement('span');
          document.body.appendChild(temoin);
          const parVar = (v) => { temoin.style.color = 'var(' + v + ')'; return encre(temoin); };
          const ref = { ok: parVar('--blue'), bad: parVar('--red'), sol: parVar('--green') };
          temoin.style.color = '';
          ref.ordinaire = encre(temoin);
          temoin.remove();
          const lis = (sel) => { const t = fb.querySelector(sel); return t ? encre(t) : 'absent'; };
          return {
            ecrite: /cases justes/.test(fb.textContent),
            ok: lis('.msg-ok'), bad: lis('.msg-bad'), sol: lis('.msg-sol'),
            neutre: lis('.msg-neutre'), ref: ref,
            texte: fb.textContent.slice(0, 60),
          };
        });
        verifier('la phrase de la correction est bien celle qu\'on mesure',
          c.ecrite, 'texte affiché : « ' + c.texte + ' »');
        verifier('« tes cases justes sont en bleu » prend le BLEU de la convention',
          c.ok === c.ref.ok, 'la phrase écrit ' + c.ok + ', le bleu de la convention est ' + c.ref.ok);
        verifier('« les fausses sont rouges » prend le ROUGE de la convention',
          c.bad === c.ref.bad, 'la phrase écrit ' + c.bad + ', le rouge de la convention est ' + c.ref.bad);
        verifier('« avec la bonne réponse en vert » prend le VERT de la convention',
          c.sol === c.ref.sol, 'la phrase écrit ' + c.sol + ', le vert de la convention est ' + c.ref.sol);
        verifier('le reste de la phrase garde l\'encre ordinaire du texte',
          c.neutre === c.ref.ordinaire,
          'la phrase écrit ' + c.neutre + ', le texte ordinaire ' + c.ref.ordinaire);
        verifier('les trois encres de la phrase sont bien DISTINCTES',
          c.ok !== c.bad && c.bad !== c.sol && c.ok !== c.sol,
          'juste ' + c.ok + ' | faux ' + c.bad + ' | correction ' + c.sol);
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 septies octies. les trois boutons du 1.1 ===== */
    /* Demande de Turquet (août 2026) : la racine du 1.1 peut être π, tapée
       dans des cases en texte brut — π s'insère au jeton, ⌨️ montre le clavier
       de la PAGE (le pavé), ☰ dit les raccourcis vrais de l'écran. Le banc
       principal exerce les fonctions ; ici on CLIQUE les vrais boutons et on
       mesure au RECTANGLE — jsdom n'a pas de mise en page, et une fenêtre
       « ouverte » chez lui peut être invisible ici (le piège documenté de
       [hidden] battu par un display de la page). */
    titre('6 septies octies. LES TROIS BOUTONS DU 1.1');
    if(!/function s1Pi\(/.test(fs.readFileSync(path.join(RACINE, CIBLE), 'utf8'))){
      ignorer('les trois boutons du 1.1 font ce qu\'ils disent', 'ce niveau n\'a pas les boutons du 1.1');
    } else {
      s = await ouvrir(chromium, ml, {});
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('les trois boutons du 1.1 font ce qu\'ils disent', 'connexion impossible — rien à mesurer');
      } else {
        await s.page.evaluate(() => openTest('signe-premier-degre'));
        await s.page.waitForTimeout(400);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='train'") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(600);

        /* le jeton π, CLIQUÉ, écrit dans la case qui a le focus */
        const rect = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const jeton = async (fn) => {
          const b = await s.page.$('#scr-s1 .s1-jetons button[onclick*="' + fn + '("]');
          if(b) await b.click();
          return b;
        };
        await s.page.focus('#s1-val');
        const bPi = await jeton('s1Pi');
        const m1 = await s.page.evaluate(() => ({
          val: (document.getElementById('s1-val') || {}).value,
          focusGarde: document.activeElement && document.activeElement.id === 's1-val',
        }));
        verifier('le jeton π écrit π dans la case, sans lui voler le focus',
          !!bPi && m1.val === 'π' && m1.focusGarde,
          bPi ? ('lu « ' + m1.val + ' », focus sur ' + (m1.focusGarde ? 'la case' : 'autre chose')) : 'jeton π introuvable');

        /* « tape pi » devient π sous les doigts — au vrai clavier */
        await s.page.evaluate(() => { const el = document.getElementById('s1-root'); el.value = ''; el.focus(); });
        await s.page.keyboard.type('pi');
        const m2 = await s.page.evaluate(() => (document.getElementById('s1-root') || {}).value);
        verifier('« pi » tapé au clavier devient π sous les doigts', m2 === 'π', 'lu « ' + m2 + ' »');

        /* ⌨️ montre le pavé — au RECTANGLE — et une touche cliquée écrit */
        await jeton('s1KB');
        await s.page.waitForTimeout(150);
        const m3 = await s.page.evaluate(() => {
          const p = document.getElementById('paveNum');
          if(!p) return { la: false };
          const r = p.getBoundingClientRect();
          return { la: true, visible: r.width > 0 && r.height > 0 };
        });
        let ecrit = '';
        if(m3.la && m3.visible){
          await s.page.evaluate(() => { const el = document.getElementById('s1-val'); el.value = ''; el.focus(); });
          const t3 = await s.page.$('#paveNum button[data-t="3"]');
          if(t3) await t3.click();
          ecrit = await s.page.evaluate(() => (document.getElementById('s1-val') || {}).value);
        }
        verifier('⌨️ montre le clavier de la page, et ses touches écrivent dans la case',
          m3.la && m3.visible && ecrit === '3',
          !m3.la ? 'le pavé n\'existe pas' : !m3.visible ? 'le pavé est là mais invisible (rectangle nul)' : 'touche « 3 » : lu « ' + ecrit + ' »');
        await jeton('s1KB');   /* refermé pour la suite */

        /* ☰ ouvre la fenêtre des raccourcis — au RECTANGLE — et ✕ la referme */
        await jeton('s1Raccourcis');
        await s.page.waitForTimeout(150);
        const m4 = await s.page.evaluate(() => {
          const w = document.getElementById('s1help');
          if(!w) return { la: false };
          const r = w.getBoundingClientRect();
          return { la: true, visible: r.width > 0 && r.height > 0, pi: /pi/.test(w.textContent) && w.textContent.indexOf('π') >= 0 };
        });
        let ferme = false;
        if(m4.la && m4.visible){
          await s.page.click('#s1help .kbwin-close');
          await s.page.waitForTimeout(100);
          ferme = await s.page.evaluate(() => {
            const r = document.getElementById('s1help').getBoundingClientRect();
            return !(r.width > 0 && r.height > 0);
          });
        }
        verifier('☰ ouvre les raccourcis de l\'écran — « pi → π » — et ✕ la referme',
          m4.la && m4.visible && m4.pi && ferme,
          !m4.la ? 'la fenêtre n\'existe pas' : !m4.visible ? 'fenêtre invisible (rectangle nul)'
            : !m4.pi ? 'la fenêtre ne dit plus « pi → π »' : '✕ ne la referme pas (rectangle encore non nul)');

        verifier('les trois boutons du 1.1 n\'ont levé aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 septies nonies. la retenue qui redescend toute seule ===== */
    /* Demande de Turquet (août 2026, Première) : à la soustraction posée, le
       petit 1 écrit en haut redescend TOUT SEUL en « +1 » devant le chiffre
       du bas de la colonne suivante — une retenue, deux inscriptions, une
       seule écrite par l'élève. Le banc principal exerce le miroir à
       l'événement ; ici on TAPE au vrai clavier — parce que le bord le plus
       sournois est le FOCUS : un miroir qui lèverait input sur la case du bas
       déclencherait son avance automatique et volerait le curseur à l'élève
       en plein geste. Et en SOUTIEN, la case remplie par la page reçoit sa
       couleur à la sortie de la case, comme toute case non touchée. */
    titre('6 septies nonies. LA RETENUE QUI REDESCEND TOUTE SEULE');
    if(!/function renderASPTest\(/.test(fs.readFileSync(path.join(RACINE, CIBLE), 'utf8'))){
      ignorer('la retenue du haut redescend toute seule', 'ce niveau n\'a pas la soustraction posée');
    } else {
      s = await ouvrir(chromium, ml, {});
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('la retenue du haut redescend toute seule', 'connexion impossible — rien à mesurer');
      } else {
        const poserSoustraction = async (mode) => {
          await s.page.evaluate(() => openTest('addition-soustraction'));
          await s.page.waitForTimeout(300);
          await s.page.evaluate((m) => {
            const b = [...document.querySelectorAll('#modeChoices button')]
              .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='" + m + "'") >= 0);
            if(b) b.click();
          }, mode);
          await s.page.waitForTimeout(400);
          /* la question ÉPINGLÉE du banc principal : 432 − 87, les deux retenues */
          await s.page.evaluate(() => {
            test.kind = 'asp'; test.idx = 0; test.locked = false;
            test.questions = [{ plus: false, a: 432, b: 87, ua: 2, da: 3, ha: 4, ub: 7, db: 8,
              ret: { d: 1, h: 1, m: 0 }, res: [3, 4, 5], text: '432 - 87', answer: 345 }];
            renderASPTest();
          });
          await s.page.waitForTimeout(200);
        };

        await poserSoustraction('train');
        await s.page.focus('#aspHost .asp-ret[data-ret="d"]:not([data-bas])');
        await s.page.keyboard.type('1');
        await s.page.waitForTimeout(100);
        const m1 = await s.page.evaluate(() => {
          const bas = document.querySelector('#aspHost .asp-ret[data-bas][data-ret="d"]');
          const a = document.activeElement;
          return { bas: bas ? bas.value : '(case absente)',
                   suivante: !!(a && a.getAttribute && a.getAttribute('data-ret') === 'h' && !a.hasAttribute('data-bas')) };
        });
        verifier('le 1 tapé en haut redescend en « +1 » sous les doigts',
          m1.bas === '1', 'case du bas : « ' + m1.bas + ' »');
        verifier('le curseur file à la retenue suivante, jamais sur la case que la page remplit',
          m1.suivante, 'le focus n\'est pas sur la retenue des dizaines');

        await s.page.focus('#aspHost .asp-ret[data-ret="d"]:not([data-bas])');
        await s.page.keyboard.press('Backspace');
        await s.page.waitForTimeout(100);
        const m2 = await s.page.evaluate(() =>
          (document.querySelector('#aspHost .asp-ret[data-bas][data-ret="d"]') || {}).value);
        verifier('la retenue effacée en haut s\'efface en bas',
          m2 === '', 'case du bas : « ' + m2 + ' »');

        /* en soutien : la couleur arrive à la sortie de la case, sur les DEUX.
           On quitte les retenues en CLIQUANT une case du résultat — le geste
           réel de l'élève qui continue son calcul. Le premier jet tabulait UNE
           fois : le focus atterrissait DANS la case du bas, où le garde de la
           saisie diffère la couleur — la page avait raison, le banc mesurait
           une case encore sous le curseur. */
        await poserSoustraction('soutien');
        await s.page.focus('#aspHost .asp-ret[data-ret="d"]:not([data-bas])');
        await s.page.keyboard.type('1');
        await s.page.click('#aspHost .mp-box');
        await s.page.waitForTimeout(250);
        const m3 = await s.page.evaluate(() => {
          const haut = document.querySelector('#aspHost .asp-ret[data-ret="d"]:not([data-bas])');
          const bas = document.querySelector('#aspHost .asp-ret[data-bas][data-ret="d"]');
          return { haut: haut ? haut.className : '?', bas: bas ? bas.className : '?' };
        });
        verifier('en soutien, la retenue redescendue prend sa couleur à la sortie de la case',
          /\bok\b/.test(m3.haut) && /\bok\b/.test(m3.bas),
          'classes — haut : « ' + m3.haut + ' », bas : « ' + m3.bas + ' »');

        verifier('la retenue qui redescend n\'a levé aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 decies. l'écran d'exercice prend toute la largeur ===== */
    /* Un enchaînement d'égalités se lit d'un trait : « a × b = c = d ». Coupé
       en blocs empilés, il se lit comme des calculs séparés — et c'est une
       colonne trop étroite qui l'y force. L'écran d'un exercice prend donc
       toute la largeur (décision de Turquet, août 2026), et les étapes d'une
       même égalité tiennent sur une seule ligne.
       Deux bords, et n'en tenir qu'un ne tient rien : la carte doit être LARGE,
       et les rangées ne doivent PAS se replier. Une carte large dont les
       rangées se replient quand même n'a rien gagné ; des rangées qui ne se
       replient pas dans une carte étroite, c'est qu'elles étaient déjà courtes.
       Seul un vrai navigateur sait où un contenu se replie. */
    titre('6 decies. L\'ÉCRAN D\'EXERCICE PREND TOUTE LA LARGEUR');
    if(!P.pleineLargeur){
      ignorer('l\'écran d\'un exercice prend toute la largeur',
        'ce niveau ne déclare pas d\'exercice à mesurer en largeur');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      /* le menu, lui, garde sa colonne : c'est du texte, et une ligne de
         1400 px ne se lit pas */
      const menu = await s.page.evaluate(() => {
        const w = document.querySelector('.wrap');
        return { large: Math.round(w.getBoundingClientRect().width),
                 plein: document.body.classList.contains('plein-ecran') };
      });
      verifier('hors exercice, la page garde sa colonne de lecture',
        !menu.plein && menu.large < 900, 'wrap ' + menu.large + ' px, plein-ecran:' + menu.plein);
      /* L'ÉCRAN « EXERCICES PAR THÈME », lui, prend TOUTE la largeur et gagne
         des colonnes (demande de Turquet, août 2026 — elle remplace, pour cet
         écran seulement, « le menu garde sa colonne »). Les deux bords vont
         ensemble et n'en tenir qu'un ne tient rien : un cadre large dont la
         grille reste à 2 colonnes n'a rien gagné, et compter les colonnes se
         fait sur les POSITIONS rendues — seul un navigateur les connaît.
         Et « exercices par thème » n'est pas UN écran : la Première ouvre
         d'abord deux cartes de THÈME, puis des parties, et les cartes
         d'EXERCICE — celles dont parle la demande — vivent deux écrans plus
         bas. Mesurer le premier écran ne mesurait donc rien chez elle : deux
         cartes ne peuvent pas dessiner quatre colonnes, quelle que soit la
         grille. Le contrôle PARCOURT tout l'arbre du menu en suivant les
         cartes de thème : chaque écran doit être large, et chaque écran qui
         liste au moins 4 exercices doit les poser sur 4 colonnes. */
      const themes = await s.page.evaluate(async () => {
        const mesurer = () => {
          const w = document.querySelector('.wrap');
          const grille = document.querySelector('.screen.on .theme-list .choices');
          const enfants = grille ? [...grille.children]
            .filter(c => c.getBoundingClientRect().width > 0) : [];
          const gauches = [...new Set(enfants.map(c => Math.round(c.getBoundingClientRect().left)))];
          return { large: Math.round(w.getBoundingClientRect().width),
                   menuLarge: document.body.classList.contains('menu-large'),
                   colonnes: gauches.length, enfants: enfants.length,
                   cartesTheme: enfants.length > 0 && enfants.every(c => c.classList.contains('themecard')),
                   descentes: enfants.filter(c => c.classList.contains('themecard'))
                     .map(c => c.getAttribute('onclick')) };
        };
        const aVisiter = ['openThemes()'];
        const ecrans = [];
        while (aVisiter.length && ecrans.length < 40) {
          const appel = aVisiter.shift();
          await new Function('return (async()=>{ await ' + appel + '; })()')();
          await new Promise(r => setTimeout(r, 250));
          const m = mesurer();
          ecrans.push({ appel, large: m.large, menuLarge: m.menuLarge,
                        colonnes: m.colonnes, enfants: m.enfants, cartesTheme: m.cartesTheme });
          if (m.cartesTheme) aVisiter.push(...m.descentes);
        }
        return ecrans;
      });
      const etroits = themes.filter(e => !e.menuLarge || e.large <= 1300);
      verifier('l\'écran des exercices par thème prend toute la largeur',
        themes.length > 0 && etroits.length === 0,
        themes.length === 0 ? 'aucun écran visité'
          : etroits.map(e => e.appel + ' : wrap ' + e.large + ' px, menu-large:' + e.menuLarge).join(' ; '));
      const ecransExos = themes.filter(e => !e.cartesTheme && e.enfants > 0);
      const mauvaisesColonnes = ecransExos.filter(e =>
        e.enfants >= 4 ? e.colonnes !== 4 : e.colonnes !== e.enfants);
      verifier('et ses cartes gagnent des colonnes : 4 à 1400 px',
        ecransExos.some(e => e.enfants >= 4) && mauvaisesColonnes.length === 0,
        !ecransExos.some(e => e.enfants >= 4)
          ? 'aucun écran d\'exercices à 4 cartes ou plus n\'a été atteint'
          : mauvaisesColonnes.map(e => e.appel + ' : ' + e.colonnes + ' colonne(s) pour '
              + e.enfants + ' carte(s)').join(' ; '));
      /* et en revenant à l'accueil, la colonne de lecture revient */
      const retour = await s.page.evaluate(() => {
        show('space');
        const w = document.querySelector('.wrap');
        return { large: Math.round(w.getBoundingClientRect().width),
                 menuLarge: document.body.classList.contains('menu-large') };
      });
      verifier('revenir à l\'accueil rend la colonne de lecture',
        !retour.menuLarge && retour.large < 900,
        'wrap ' + retour.large + ' px, menu-large:' + retour.menuLarge);
      /* ET « RETOUR » DEPUIS UN EXERCICE REVIENT SUR LA PAGE D'OÙ IL VIENT —
         la page de son thème, ou celle de sa partie là où le niveau en
         déclare : l'élève qui enchaîne deux exercices du même thème
         redescendrait sinon d'un étage à chaque fois. C'est un GESTE, donc il
         se mesure ici, en cliquant le vrai bouton. La sonde DESCEND l'arbre
         tant qu'elle rencontre des cartes de thème — la Première ouvre des
         parties avant ses exercices, et viser le premier étage n'y aurait
         rien trouvé à ouvrir. */
      const depart = await s.page.evaluate(async () => {
        const titre = () => { const h = document.querySelector('.screen.on .topbar .title');
                              return h ? h.textContent : ''; };
        const cartes = () => [...document.querySelectorAll('.screen.on .choice')];
        await openThemes();
        for(let garde = 0; garde < 6; garde++){
          const c = cartes()[0];
          if(!c) return null;
          if(!c.classList.contains('themecard')){
            const o = c.getAttribute('onclick') || '';
            const i = o.indexOf("openTest('"), j = i < 0 ? -1 : o.indexOf("'", i + 10);
            if(j < 0) return null;
            return { ecran: (document.querySelector('.screen.on')||{}).id, titre: titre(),
                     exo: o.slice(i + 10, j) };
          }
          await new Function('return (async()=>{ await ' + (c.getAttribute('onclick')||'') + '; })()')();
          await new Promise(r => setTimeout(r, 200));
        }
        return null;
      });
      if(!depart || !depart.exo){
        verifier('« Retour » depuis un exercice revient sur la page d\'où il vient', false,
          'aucun exercice atteignable en descendant depuis les cartes de thème');
      } else {
        await s.page.evaluate(id => openTest(id), depart.exo);
        await s.page.waitForTimeout(500);
        await s.page.click('#scr-mode .topbar .btn-link');
        await s.page.waitForTimeout(900);
        const apres = await s.page.evaluate(() => {
          const h = document.querySelector('.screen.on .topbar .title');
          return { ecran: (document.querySelector('.screen.on')||{}).id || '(aucun)',
                   titre: h ? h.textContent : '' };
        });
        verifier('« Retour » depuis un exercice revient sur la page d\'où il vient',
          apres.ecran === depart.ecran && apres.titre === depart.titre,
          'écran ' + apres.ecran + ' « ' + apres.titre + ' » au lieu de '
            + depart.ecran + ' « ' + depart.titre + ' »');
      }
      for(const exo of P.pleineLargeur.exercices){
        await s.page.evaluate(id => openTest(id), exo);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="train"]');
        await s.page.waitForTimeout(1100);
        const m = await s.page.evaluate(() => {
          const w = document.querySelector('.wrap');
          const rows = [...document.querySelectorAll('.screen.on .pt-row')];
          /* Une rangée a REPLIÉ si elle est plus haute que son plus haut
             enfant. Comparer les « top » ne prouverait rien : une fraction et
             un « = » sont centrés l'un sur l'autre, donc leurs hauts diffèrent
             toujours, et le compteur crierait au repli sur des lignes droites. */
          const replis = rows.filter(r => {
            const k = [...r.children].filter(x => x.getBoundingClientRect().height > 0);
            if(k.length < 2) return false;
            const h = r.getBoundingClientRect().height;
            const hmax = Math.max(...k.map(x => x.getBoundingClientRect().height));
            return h > hmax + 8;
          }).length;
          return { large: Math.round(w.getBoundingClientRect().width),
                   plein: document.body.classList.contains('plein-ecran'),
                   rangees: rows.length, replis: replis,
                   deborde: document.documentElement.scrollWidth > window.innerWidth + 1 };
        });
        verifier(exo + ' : l\'écran prend toute la largeur',
          m.plein && m.large > 1200, 'wrap ' + m.large + ' px, plein-ecran:' + m.plein);
        verifier(exo + ' : aucune rangée ne se replie',
          m.replis === 0, m.replis + ' rangée(s) repliée(s) sur ' + m.rangees);
        verifier(exo + ' : la page ne défile pas en largeur', !m.deborde,
          'la carte déborde de la fenêtre');
      }
      /* et le nombre de blocs empilés : c'est là que se voit la fusion des
         étapes en une seule égalité */
      if(P.pleineLargeur.chaine){
        for(const [exo, max] of P.pleineLargeur.chaine){
          await s.page.evaluate(id => openTest(id), exo);
          await s.page.waitForTimeout(400);
          await s.page.click('#modeChoices [onclick*="train"]');
          await s.page.waitForTimeout(1100);
          const n = await s.page.evaluate(() =>
            document.querySelectorAll('.screen.on .pt-step:not(.step-hidden)').length);
          verifier(exo + ' : les étapes d\'une même égalité tiennent en ' + max + ' bloc(s)',
            n <= max, n + ' blocs empilés — la chaîne est coupée');
        }
      }
      verifier('mesurer la largeur ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 decies bis. « = » passe à la ligne avec ce qu'il annonce ===== */
    /* Demande de Turquet (septembre 2026), en deux temps puis étendue aux trois
       niveaux : « quand on affiche "= 0 ," avec une case à côté, si la case
       passe à la ligne je veux que le "= 0" passe aussi à la ligne », puis
       « dès qu'une case passe à la ligne et qu'il y a un "=" devant, mettre le
       "=" aussi à la ligne ».
       LA MESURE NE CONNAÎT AUCUNE FABRIQUE, ET C'EST CE QUI LA REND
       UNIVERSELLE. Le premier jet partait des groupes « .f-grp » : il serait
       resté vert sur le « = » qu'on aurait oublié d'y mettre — c'est-à-dire
       sur le défaut — et il ne voyait RIEN de la Terminale, qui n'a pas cette
       classe : elle écrit ses égalités avec six classes différentes (eq,
       sa2-eq, tg-eq, su-eq, rf-eq…) et parfois en texte nu au milieu d'une
       phrase. On part donc de CHAQUE case rendue et on lit ce qui la précède
       IMMÉDIATEMENT, élément ou nœud de texte ; si cela finit par « = » ou par
       la virgule décimale, les deux doivent partager leur ligne.
       MÊME LIGNE se juge au RECOUVREMENT vertical, jamais à l'égalité des
       « top » : une case et le texte qui la précède sont centrés l'un sur
       l'autre, donc leurs hauts diffèrent toujours de quelques pixels — un
       compteur qui lirait « top » crierait au repli sur des lignes
       parfaitement droites.
       Et la mesure doit avoir lieu là où le défaut existe : sans repli, aucune
       rangée ne peut couper quoi que ce soit, et le vert ne dirait rien. */
    titre('6 decies bis. LE « = » PASSE À LA LIGNE AVEC CE QU\'IL ANNONCE');
    if(!P.teteCollee){
      ignorer('un « = » et ce qu\'il annonce restent sur la même ligne',
        'ce niveau ne déclare pas de « = » collé à sa case');
    } else {
      const TC = P.teteCollee;
      const largeurs = TC.largeurs || [[TC.largeur, TC.hauteur]];
      const separes = [];
      let repliees = 0, mesures = 0;
      for(const [lw, lh] of largeurs){
        s = await ouvrir(chromium, ml, { viewport: { width: lw, height: lh }, hasTouch: true });
        await connecter(s.page);
        for(const exo of TC.exercices){
          await s.page.evaluate(id => openTest(id), exo);
          await s.page.waitForTimeout(400);
          await s.page.click('#modeChoices [onclick*="train"]');
          await s.page.waitForTimeout(1200);
          const m = await s.page.evaluate(() => {
            /* le rectangle d'un nœud, élément OU texte */
            const rectDe = n => {
              if(n.nodeType === 1) return n.getBoundingClientRect();
              const r = document.createRange(); r.selectNodeContents(n);
              const rs = r.getClientRects(); return rs.length ? rs[rs.length - 1] : null;
            };
            const texteDe = n => (n.nodeType === 1 ? n.textContent : n.nodeValue || '').trim();
            const casse = [];
            let vues = 0, replis = 0;
            const cases = [...document.querySelectorAll('.screen.on math-field, .screen.on input, .screen.on select')];
            for(const c of cases){
              const rc = c.getBoundingClientRect();
              if(rc.height === 0 || c.type === 'hidden') continue;
              let p = c.previousSibling;
              while(p && p.nodeType === 3 && !(p.nodeValue || '').trim()) p = p.previousSibling;
              if(!p) continue;
              const t = texteDe(p);
              /* ce qui ANNONCE une case : un « = », ou une tête finissant par
                 la virgule décimale (« 0, », « 1 − 0, »). Court, sinon c'est
                 une phrase entière qui a le droit de se replier en elle-même. */
              if(!/[=,]$/.test(t) || t.length > 24) continue;
              const rp = rectDe(p);
              if(!rp || rp.height === 0) continue;
              vues++;
              if(!(rc.top < rp.bottom - 2 && rp.top < rc.bottom - 2))
                casse.push('« ' + t + ' » → ' + (c.id || (c.className || '').split(' ')[0])
                  + ' (' + Math.round(rc.top - rp.top) + ' px plus bas)');
            }
            /* et combien de rangées se replient vraiment à cette largeur */
            for(const r of document.querySelectorAll('.screen.on .pt-row, .screen.on .s1-line, .screen.on .tg-line, .screen.on .rec-ligne, .screen.on .sa-lrow, .screen.on .sa2-row, .screen.on .f-wrap')){
              const k = [...r.children].filter(x => x.getBoundingClientRect().height > 0);
              if(k.length < 2) continue;
              const hmax = Math.max(...k.map(x => x.getBoundingClientRect().height));
              if(r.getBoundingClientRect().height > hmax + 8) replis++;
            }
            return { casse, vues, replis };
          });
          mesures += m.vues; repliees += m.replis;
          m.casse.forEach(d => separes.push(lw + ' px, ' + exo + ' : ' + d));
        }
        verifier('mesurer à ' + lw + ' px ne lève aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
        await s.nav.close(); s = null;
      }
      verifier('un « = » et ce qu\'il annonce restent sur la même ligne',
        separes.length === 0, separes.slice(0, 4).join(' | '));
      verifier('le contrôle a bien des « = » à mesurer',
        mesures >= TC.minimum, mesures + ' « = » suivis d\'une case, ' + TC.minimum + ' attendus au moins');
      verifier('aux largeurs mesurées, les rangées se replient pour de vrai',
        repliees > 0, 'aucune rangée repliée : le contrôle ne mesure rien à ces largeurs');
    }


    /* ===== 6 octies bis. la fenêtre d'aide FERMÉE se rouvre ===== */
    /* Sur ordinateur, « Soutien » et « Question à l'IA » s'ouvrent dans une
       VRAIE fenêtre du système et leur carte y est DÉPLACÉE : la page ne l'a
       plus. Signalé par Turquet (septembre 2026) sur le 6.14 — fermer cette
       fenêtre, puis recliquer, n'ouvrait plus rien.
       SEUL UN VRAI NAVIGATEUR VOIT CE DÉFAUT : il faut une vraie fenêtre, une
       vraie fermeture, et le vrai pagehide que le navigateur lève alors. Le
       banc jsdom rejoue le MOMENT (pagehide avec closed encore faux) ; celui-ci
       rejoue le GESTE. Et il faut un VRAI clic : sans activation utilisateur,
       Chromium bloque la pop-up, et le contrôle mesurerait le repli en page. */
    titre('6 octies bis. LA FENÊTRE D\'AIDE FERMÉE SE ROUVRE');
    if(!P.fenetresDetachees){
      ignorer('la fenêtre d\'aide fermée se rouvre',
        'ce niveau ne déclare aucune fenêtre d\'aide détachable');
    } else {
      const FD = P.fenetresDetachees;
      s = await ouvrir(chromium, ml);
      if(await connecter(s.page) !== 'scr-space'){
        verifier('la fenêtre d\'aide fermée se rouvre', false, 'connexion impossible — rien à mesurer');
      } else {
        await s.page.evaluate(id => openTest(id), FD.exercice);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="soutien"]');
        await s.page.waitForTimeout(900);
        const contexte = s.page.context();
        /* On clique le VRAI bouton de l'écran, celui que l'élève a sous la
           souris, et on attend la fenêtre que Chromium ouvre. */
        const ouvrirFenetre = async nom => {
          /* Le bouton de l'ÉCRAN, et lui seul : « le premier du document » résout
             #cmConseilBtn, le bouton CACHÉ du calcul mental, et le clic expire
             sur un élément que personne ne voit — la mesure accusait alors la
             page de ne pas ouvrir de fenêtre. Une ancre se prend PROPRE à sa
             cible. Et on le CENTRE avant de cliquer : les commandes du bas sont
             en position fixe et avalent le clic, le piège déjà payé sur la
             grille de {construire-fonction}. */
          const loc = s.page.locator('section.screen.on button[onclick*="' + nom + '"]:visible').first();
          if(await loc.count() === 0) return null;
          await loc.evaluate(b => b.scrollIntoView({ block: 'center' })).catch(() => {});
          const [pop] = await Promise.all([
            contexte.waitForEvent('page', { timeout: 8000 }).catch(() => null),
            loc.click({ timeout: 5000 }).catch(() => {}),
          ]);
          await s.page.waitForTimeout(700);
          return pop;
        };
        const carteDe = async (pop, sel) => {
          if(!pop || pop.isClosed()) return null;
          return pop.evaluate(x => {
            const c = document.querySelector(x);
            if(!c) return null;
            const r = c.getBoundingClientRect();
            return { l: Math.round(r.width), h: Math.round(r.height) };
          }, sel).catch(() => null);
        };
        for(const F of FD.fenetres){
          const pop1 = await ouvrirFenetre(F.bouton);
          const vue1 = await carteDe(pop1, F.carte);
          verifier(F.nom + ' : la fenêtre s\'ouvre détachée, carte comprise',
            !!(vue1 && vue1.l > 2 && vue1.h > 2),
            pop1 ? 'la fenêtre s\'est ouverte sans sa carte : le contrôle ne mesure rien'
                 : 'aucune fenêtre du système : le contrôle ne mesure rien');
          if(!vue1) continue;
          /* LA CROIX DU SYSTÈME — le geste signalé. */
          await pop1.close();
          await s.page.waitForTimeout(800);
          const rendue = await s.page.evaluate(x => !!document.querySelector(x), F.carte);
          verifier(F.nom + ' : fermée, la carte revient dans la page', rendue,
            'la carte est partie avec la fenêtre : plus rien ne peut la rouvrir');
          const pop2 = await ouvrirFenetre(F.bouton);
          const vue2 = await carteDe(pop2, F.carte);
          verifier(F.nom + ' : on la rouvre, et elle montre sa carte',
            !!(vue2 && vue2.l > 2 && vue2.h > 2),
            pop2 ? 'la fenêtre rouverte est VIDE' : 'rien ne se rouvre (le défaut signalé sur le 6.14)');
          if(pop2 && !pop2.isClosed()){ await pop2.close(); await s.page.waitForTimeout(500); }
        }
        verifier('ouvrir, fermer et rouvrir ne lève aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ===== 6 nonies. les zéros ne durent que le temps de l'appui ===== */
    /* Le bouton d'aide de « Placer des nombres sur une droite graduée » réécrit
       les cinq nombres à la même longueur — mais SEULEMENT tant qu'on le garde
       enfoncé (décision de Turquet, août 2026) : on jette un œil, on relâche,
       et c'est à l'élève de comparer.
       Le banc principal appelle la fonction ; lui seul APPUIE vraiment. C'est
       la différence qui compte : un bouton branché sur « click » se déclenche
       au relâchement, donc trop tard, et jsdom ne le verrait jamais. */
    titre('6 nonies. LES ZÉROS NE DURENT QUE LE TEMPS DE L\'APPUI');
    /* DEUX exercices peuvent porter le bouton — {placer-intervalle} et
       {ordre-croissant} partagent le drapeau et le branchement. Le banc APPUIE
       sur chacun : un appui qui marcherait sur l'un et pas sur l'autre ne se
       verrait nulle part ailleurs. Le profil déclare une liste ; une entrée
       seule reste acceptée. */
    const aidesM = Array.isArray(P.aideMaintenue) ? P.aideMaintenue
                 : (P.aideMaintenue ? [P.aideMaintenue] : []);
    if(!aidesM.length){
      ignorer('les zéros s\'affichent à l\'appui et s\'effacent au relâchement',
        'ce niveau n\'a pas d\'aide qui se maintient');
    } else {
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      for(const AIDE of aidesM){
      await s.page.evaluate(id => openTest(id), AIDE.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const lire = () => s.page.evaluate(sel => {
        const n = [...document.querySelectorAll(sel)];
        return n.map(e => e.textContent.trim()).join(' ');
      }, AIDE.nombres);
      const bouton = await s.page.$('#' + AIDE.bouton);
      verifier('le bouton d\'aide est sur l\'écran de ' + AIDE.exercice, !!bouton,
        'aucun #' + AIDE.bouton);
      if(bouton){
        const nu = await lire();
        const b = await bouton.boundingBox();
        const bx = Math.round(b.x + b.width / 2), by = Math.round(b.y + b.height / 2);
        await s.page.mouse.move(bx, by);
        await s.page.mouse.down();
        await s.page.waitForTimeout(200);
        const tenu = await lire();                       /* bouton ENCORE enfoncé */
        await s.page.mouse.up();
        await s.page.waitForTimeout(200);
        const relache = await lire();
        verifier('bouton maintenu, les zéros s\'affichent (' + AIDE.exercice + ')',
          tenu !== nu && tenu.length > nu.length,
          'rien n\'a changé pendant l\'appui : « ' + nu + ' » → « ' + tenu + ' »');
        verifier('bouton relâché, les zéros s\'effacent (' + AIDE.exercice + ')', relache === nu,
          'ils sont restés : « ' + relache + ' » au lieu de « ' + nu + ' »');
        /* Relâcher AILLEURS que sur le bouton doit aussi les effacer : sans
           cela, le geste le plus banal — appuyer, glisser un peu, lever —
           laisserait l'aide allumée pour de bon. */
        await s.page.mouse.move(bx, by);
        await s.page.mouse.down();
        await s.page.waitForTimeout(150);
        await s.page.mouse.move(bx + 200, by - 120, { steps: 5 });
        await s.page.mouse.up();
        await s.page.waitForTimeout(200);
        verifier('relâché hors du bouton, les zéros s\'effacent aussi (' + AIDE.exercice + ')',
          (await lire()) === nu,
          'l\'aide est restée allumée après un relâchement à côté');
      }
      }
      verifier('l\'aide maintenue ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 octies. la fenêtre « Soutien » se saisit N'IMPORTE OÙ ===== */
    /* Elle ne se déplaçait que par sa barre de titre, un ruban de trente pixels
       qu'il fallait viser (décision de Turquet, août 2026 : on la saisit
       n'importe où). La poignée est donc la CARTE ENTIÈRE — et c'est là que le
       piège se referme : une carte qui prend tous les clics avale ceux de ses
       propres boutons, qui deviennent muets sans lever la moindre erreur.
       Les deux bords vont ensemble, et n'en tenir qu'un ne tient rien : la
       fenêtre doit SUIVRE la souris saisie en plein texte, et ses boutons
       doivent GARDER leur geste.
       Ce contrôle ne peut vivre que dans un vrai navigateur : jsdom n'a ni
       PointerEvent, ni mise en page, donc aucune position à mesurer. */
    titre('6 octies. LA FENÊTRE « SOUTIEN » SE SAISIT N\'IMPORTE OÙ');
    if(!P.fenetreSoutien){
      ignorer('la fenêtre « Soutien » se déplace en la saisissant n\'importe où',
        'ce niveau ne déclare pas d\'exercice où ouvrir le soutien');
    } else {
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.fenetreSoutien.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      /* La Première et la Terminale DÉTACHENT le soutien dans une vraie fenêtre
         du système dès que le pointeur est fin : c'est alors le gestionnaire de
         fenêtres qui la déplace, et la carte de la page n'existe plus. On coupe
         donc le détachement — la carte flottante est justement le seul cas où
         « saisir n'importe où » veut dire quelque chose. */
      await s.page.evaluate(() => {
        if(typeof detachementPossible === 'function') window.detachementPossible = function(){ return false; };
        for(const n of ['ouvrirRappelSeul', 'ouvrirSoutien', 'conseilCourant']){
          if(typeof window[n] === 'function'){ window[n](); return; }
        }
        const m = document.getElementById('conseilModal'); if(m) m.hidden = false;
      });
      await s.page.waitForTimeout(700);
      /* de quoi la saisir ailleurs que sur sa barre de titre */
      await s.page.evaluate(() => {
        const b = document.getElementById('conseilBody');
        if(b && !b.textContent.trim()) b.textContent = 'Un conseil assez long pour offrir une prise ailleurs que sur la barre de titre. '.repeat(3);
      });
      await s.page.waitForTimeout(200);
      const carte = await s.page.$('#conseilModal .conseil-card');
      verifier('la fenêtre « Soutien » s\'ouvre dans la page', !!carte,
        'aucune .conseil-card : le contrôle ne mesure rien');
      if(carte){
        const rect = () => s.page.evaluate(() => {
          const c = document.querySelector('#conseilModal .conseil-card');
          const r = c.getBoundingClientRect();
          return { x: Math.round(r.left), y: Math.round(r.top) };
        });
        const glisser = async (px, py, dx, dy) => {
          await s.page.mouse.move(px, py);
          await s.page.mouse.down();
          await s.page.mouse.move(px + dx / 2, py + dy / 2, { steps: 5 });
          await s.page.mouse.move(px + dx, py + dy, { steps: 5 });
          await s.page.mouse.up();
          await s.page.waitForTimeout(150);
        };
        /* a) saisie en plein milieu du texte : la fenêtre suit */
        let r0 = await rect();
        const cible = await s.page.evaluate(() => {
          const b = document.getElementById('conseilBody');
          const r = b.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        });
        await glisser(cible.x, cible.y, 120, 70);
        let r1 = await rect();
        verifier('saisie en plein texte, elle suit la souris',
          Math.abs((r1.x - r0.x) - 120) <= 3 && Math.abs((r1.y - r0.y) - 70) <= 3,
          'déplacée de (' + (r1.x - r0.x) + ', ' + (r1.y - r0.y) + ') au lieu de (120, 70)');
        /* b) la barre de titre n'a rien perdu */
        r0 = await rect();
        const tete = await s.page.evaluate(() => {
          const h = document.querySelector('#conseilModal .notes-head h3');
          if(!h) return null;
          const r = h.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        });
        if(tete){
          await glisser(tete.x, tete.y, -90, 40);
          r1 = await rect();
          verifier('la barre de titre la déplace toujours',
            Math.abs((r1.x - r0.x) + 90) <= 3 && Math.abs((r1.y - r0.y) - 40) <= 3,
            'déplacée de (' + (r1.x - r0.x) + ', ' + (r1.y - r0.y) + ') au lieu de (-90, 40)');
        } else {
          ignorer('la barre de titre la déplace toujours', 'cette fenêtre n\'a pas de titre');
        }
        /* c) LE BORD QUI COMPTE : un bouton garde son geste. On vise le premier
           qui a vraiment un rectangle — « Détacher » est masqué par display:none
           quand le détachement est impossible, et sa boîte est alors nulle. */
        r0 = await rect();
        const bb = await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#conseilModal .conseil-card button')]
            .find(x => { const r = x.getBoundingClientRect(); return r.width > 2 && r.height > 2; });
          if(!b) return null;
          const r = b.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), nom: b.textContent.trim() };
        });
        if(!bb){
          verifier('un glisser parti d\'un bouton ne déplace pas la fenêtre', false,
            'aucun bouton visible dans la fenêtre : le contrôle ne mesure rien');
        } else {
          /* On mesure POINTEUR ENCORE ENFONCÉ. Relâcher d'abord fausse tout :
             la carte suit le curseur, donc le bouton reste dessous, le clic
             part quand même et « Fermer » referme la fenêtre — une fenêtre
             fermée n'a plus de rectangle, et le contrôle se satisfaisait de ce
             « elle a bien agi » alors qu'elle venait d'être traînée de 400 px.
             C'est ainsi que le bord le plus important passait au vert. */
          await s.page.mouse.move(bb.x, bb.y);
          await s.page.mouse.down();
          await s.page.mouse.move(bb.x + 30, bb.y + 15, { steps: 5 });
          await s.page.mouse.move(bb.x + 60, bb.y + 30, { steps: 5 });
          const r2 = await rect();
          await s.page.mouse.up();
          await s.page.waitForTimeout(150);
          verifier('un glisser parti d\'un bouton ne déplace pas la fenêtre',
            Math.abs(r2.x - r0.x) <= 1 && Math.abs(r2.y - r0.y) <= 1,
            'le bouton « ' + bb.nom +' » l\'a déplacée de (' + (r2.x - r0.x) + ', ' + (r2.y - r0.y) + ')');
          /* et il agit VRAIMENT : « Fermer » ferme */
          await s.page.evaluate(() => { const m = document.getElementById('conseilModal'); if(m) m.hidden = false; });
          await s.page.waitForTimeout(200);
          const fb = await s.page.evaluate(() => {
            const b = [...document.querySelectorAll('#conseilModal .conseil-card button')]
              .find(x => /Fermer/i.test(x.textContent));
            if(!b) return null;
            const r = b.getBoundingClientRect();
            return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
          });
          if(fb){
            await s.page.mouse.click(fb.x, fb.y);
            await s.page.waitForTimeout(300);
            verifier('« Fermer » ferme bien la fenêtre',
              await s.page.evaluate(() => !!document.getElementById('conseilModal').hidden),
              'elle est restée ouverte : le bouton est devenu muet');
          } else {
            ignorer('« Fermer » ferme bien la fenêtre', 'cette fenêtre n\'a pas de bouton « Fermer »');
          }
        }
      }
      verifier('déplacer la fenêtre ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 7. signaler un problème ===== */
    /* Le seul retour que la page donne au professeur. Il traverse trois choses
       qu'aucun contrôle de structure ne voit ensemble : le bouton doit être là
       PENDANT l'exercice, la modale doit s'ouvrir, et la ligne doit partir dans
       la bonne table avec l'instantané dedans. Le banc le fait en cliquant. */
    titre('7. SIGNALER UN PROBLÈME');
    if(!P.signalement){
      ignorer('l\'élève signale un problème depuis son exercice',
        'ce niveau n\'a pas déclaré sa table de signalements');
    } else {
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.signalement.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(700);

      const barre = await s.page.evaluate(() => {
        const b = document.getElementById('signalBtn');
        if(!b) return { absent: true };
        const c = getComputedStyle(b);
        return { visible: c.display !== 'none' && c.visibility !== 'hidden', texte: b.textContent };
      });
      verifier('le bouton « Signaler » est là pendant l\'exercice',
        !barre.absent && barre.visible, barre.absent ? 'bouton absent' : 'bouton masqué');

      await s.page.click('#signalBtn');
      await s.page.waitForTimeout(250);
      const modale = await s.page.evaluate(() => {
        const m = document.getElementById('sigModal');
        return { ouverte: !!m && !m.hidden, quoi: (document.getElementById('sigQuoi')||{}).textContent || '' };
      });
      verifier('la modale s\'ouvre et nomme l\'exercice',
        modale.ouverte && /\S/.test(modale.quoi), JSON.stringify(modale));

      /* ===== la copie d'écran, COLLÉE comme le ferait un élève =====
         C'est le geste réel : Impr. écran (ou Win+Maj+S), puis Ctrl+V dans la
         fenêtre. jsdom ne peut pas le voir — il n'a ni presse-papiers, ni
         canvas, donc ni collage ni réduction d'image. Ce banc-ci a les deux.
         Deux bords : l'image doit être REÇUE (l'aperçu s'affiche), et elle doit
         être RÉDUITE avant l'envoi — une capture brute de 2000 px pèse des
         méga-octets, et le quota du plan gratuit est d'un giga. */
      const colle = await s.page.evaluate(async () => {
        /* une « capture d'écran » de 2000×1200, fabriquée sur place */
        const c = document.createElement('canvas'); c.width = 2000; c.height = 1200;
        const x = c.getContext('2d');
        x.fillStyle = '#123456'; x.fillRect(0, 0, 2000, 1200);
        x.fillStyle = '#fff'; x.font = '90px sans-serif'; x.fillText('2 + 4x + 4', 90, 600);
        const blob = await new Promise(r => c.toBlob(r, 'image/png'));
        const f = new File([blob], 'capture.png', { type: 'image/png' });
        const dt = new DataTransfer(); dt.items.add(f);
        const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true });
        window.dispatchEvent(ev);
        await new Promise(r => setTimeout(r, 700));
        const vue = document.getElementById('sigApercu');
        const zone = document.getElementById('sigZone');
        /* « sigCapture » et non « window.sigCapture » : un let de haut niveau
           n'atterrit pas sur window, et le contrôle lisait 0 sur une capture
           parfaitement reçue. */
        const cap = (typeof sigCapture !== 'undefined' && sigCapture) ? sigCapture : null;
        let large = 0;
        if(cap && cap.blob){
          try{ const bm = await createImageBitmap(cap.blob); large = bm.width; }catch(e){}
        }
        return { brut: f.size, reduite: (cap && cap.blob && cap.blob.size) || 0, large: large,
                 type: (cap && cap.blob && cap.blob.type) || '',
                 apercu: !!(vue && !vue.hidden && vue.querySelector('img')),
                 /* le RECTANGLE, pas la propriété : « display:flex » écrit dans
                    la feuille bat le « display:none » que [hidden] pose depuis
                    celle du navigateur. La zone restait à l'écran sous l'aperçu
                    pendant que zone.hidden valait true, et le banc passait au
                    vert sur un écran faux. */
                 zoneCachee: !!zone && zone.getBoundingClientRect().height === 0 };
      });
      verifier('une copie d\'écran collée est reçue et montrée à l\'élève',
        colle.apercu && colle.zoneCachee && colle.reduite > 0,
        'aperçu:' + colle.apercu + ' zone masquée:' + colle.zoneCachee + ' taille:' + colle.reduite);
      /* La garantie qui compte est la LARGEUR, pas le nombre d'octets : une
         image de démonstration en aplat se comprime si bien que comparer les
         poids ne prouverait rien — alors qu'une capture d'un vrai écran, elle,
         pèse des méga-octets tant qu'on ne l'a pas rétrécie. */
      verifier('elle est réduite avant l\'envoi (1600 px au plus, en JPEG)',
        colle.large > 0 && colle.large <= 1600 && /jpeg/.test(colle.type),
        '2000 px à l\'origine, ' + colle.large + ' px après, type « ' + colle.type + ' »');

      /* Un message avec une apostrophe : c'est le piège « O'Brien », qui a déjà
         tué un bouton du professeur en traversant deux analyseurs. */
      await s.page.fill('#sigInput', "ça dit faux alors que j'ai bon");
      await s.page.click('#sigSend');
      await s.page.waitForTimeout(600);

      const parti = await s.page.evaluate(t => {
        const ops = window.__faux.operations('insert', t);
        if(!ops.length) return { rien: true };
        const l = ops[ops.length-1].lignes ? ops[ops.length-1].lignes[0] : ops[ops.length-1].ligne;
        return { ligne: l || null };
      }, P.signalement.table);
      verifier('le signalement part dans sa table', !parti.rien && !!parti.ligne,
        parti.rien ? 'aucune écriture dans ' + P.signalement.table : 'ligne vide');
      if(parti.ligne){
        const l = parti.ligne;
        verifier('il emporte le message de l\'élève, apostrophe comprise',
          /j'ai bon/.test(String(l.message||'')), 'message : ' + l.message);
        verifier('il emporte l\'instantané de l\'exercice',
          !!l.contexte && !!l.contexte.kind && Array.isArray(l.contexte.questions) && l.contexte.questions.length > 0,
          'contexte : ' + JSON.stringify(l.contexte).slice(0, 120));
        verifier('il emporte les saisies en cours et la version',
          !!l.contexte && !!l.contexte._boxes && typeof l.version === 'number',
          'boxes/version : ' + JSON.stringify(l.contexte && l.contexte._boxes) + ' / ' + l.version);
      }

      /* et la copie d'écran est réellement PARTIE : un chemin dans la ligne, et
         un fichier dans le bucket. Le chemin commence par l'identifiant de
         l'élève — c'est ce que la politique du bucket exige (migration 007) ;
         un chemin qui cesserait de le porter serait refusé par la base, chez
         l'élève, sans que rien ne rougisse ici. */
      const depot = await s.page.evaluate(() => {
        const ops = window.__faux.operations('upload', 'signalements');
        return { n: ops.length, chemin: ops.length ? ops[ops.length-1].chemin : '' };
      });
      const cheminLigne = (parti.ligne && parti.ligne.capture) || '';
      verifier('la copie d\'écran est déposée, et son chemin voyage avec le signalement',
        depot.n === 1 && cheminLigne === depot.chemin && /\//.test(depot.chemin),
        depot.n + ' dépôt(s), chemin déposé « ' + depot.chemin + ' », chemin écrit « ' + cheminLigne + ' »');
      verifier('elle est déposée dans le dossier de l\'élève, jamais ailleurs',
        depot.chemin.indexOf(s.eleve.id + '/') === 0,
        'chemin « ' + depot.chemin + ' » — attendu sous « ' + s.eleve.id + '/ »');

      const aucuneNote = await s.page.evaluate(t => window.__faux.operations('insert', t).length, P.tableResultats);
      verifier('signaler n\'enregistre aucune note', aucuneNote === 0, aucuneNote + ' note(s) écrite(s)');

      verifier('signaler n\'a levé aucune erreur JavaScript', s.erreurs.length === 0, s.erreurs.slice(0,2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 undecies. un résidu invisible ne rend pas fausse une réponse juste ===== */
    /* Le pire défaut possible pour un exercice : compter faux un élève qui a raison.
       Il apprend l'inverse de ce qu'on lui enseigne, et rien ne rougit nulle part.
       Un élève de Terminale l'a signalé en août 2026 sur le 2.1 : sa copie était
       juste d'un bout à l'autre, « 2 » et « 4x » étaient rouges, « 4 » vert, note
       10 cases sur 12. Les deux cases fautives portaient un exposant VIDE — « 2^{} » —
       laissé par une touche effleurée. À l'écran il n'y a rien à voir : MathLive
       n'affiche pas un exposant vide. Seul l'évaluateur le voit, et il refuse.
       Le lecteur du niveau est le seul endroit où ce résidu peut être arrêté ;
       c'est donc lui que ce contrôle éprouve, sur un vrai <math-field>. */
    titre('6 undecies. UN RÉSIDU INVISIBLE NE REND PAS FAUSSE UNE RÉPONSE JUSTE');
    if(!P.residuMathlive){
      ignorer('les résidus de fin de saisie sont ignorés à la lecture',
        'ce niveau ne déclare pas de lecteur de case mathématique');
    } else if(!ml){
      ignorer('les résidus de fin de saisie sont ignorés à la lecture',
        'MathLive absent : un <math-field> ne s\'enregistre pas');
    } else {
      s = await ouvrir(chromium, ml);
      await connecter(s.page);
      /* Les cinq formes de résidu, telles que MathLive les laisse. Chacune est
         INVISIBLE : la case affiche « 2 », et c'est bien « 2 » qu'il faut lire. */
      const RESIDUS = ['^{}', '^{\\placeholder{}}', '\\times', '+', '\\,'];
      const lu = await s.page.evaluate(([lire, residus]) => {
        const fn = eval(lire);
        const hote = document.createElement('div');
        hote.style.cssText = 'position:fixed;left:-9999px;top:0';
        hote.innerHTML = '<math-field id="ctrl-residu"></math-field>';
        document.body.appendChild(hote);
        const mf = hote.firstChild;
        const essai = v => { mf.setValue(v); return String(fn('ctrl-residu')); };
        const out = { propre: essai('2'), avec: residus.map(r => [r, essai('2' + r)]),
                      signe: essai('+'), vide: essai('') };
        hote.remove();
        return out;
      }, [P.residuMathlive.lire, RESIDUS]);
      verifier('une case propre se lit telle quelle', lu.propre === '2', 'lu « ' + lu.propre +' »');
      for(const [r, v] of lu.avec){
        verifier('le résidu « ' + r + ' » est ignoré : la case vaut toujours 2',
          v === '2', 'lu « ' + v + ' »');
      }
      /* le bord opposé, et il compte autant : un signe SEUL n'est pas un résidu.
         Dans une case de coefficient, « + » vaut +1 — le nettoyer viderait la case
         et changerait la réponse de l'élève. */
      verifier('un signe seul n\'est pas nettoyé (« + » = coefficient +1)',
        lu.signe === '+', 'lu « ' + lu.signe + ' »');
      verifier('une case vide se lit vide', lu.vide === '', 'lu « ' + lu.vide + ' »');

      /* et la copie de l'élève, jouée de bout en bout */
      const C = P.residuMathlive.copie;
      if(!C){
        ignorer('la copie signalée est comptée juste malgré les résidus',
          'ce niveau ne déclare pas de copie à rejouer');
      } else {
        let largeursPropres = null;
        for(const avecResidu of [false, true]){
          const quoi = avecResidu ? 'avec les résidus de l\'élève' : 'sans résidu (contrôle du contrôle)';
          await s.page.evaluate(id => openTest(id), C.exercice);
          await s.page.waitForTimeout(400);
          await s.page.click('#modeChoices [onclick*="train"]');
          await s.page.waitForTimeout(1100);
          await s.page.evaluate(q => { (new Function(q))(); }, C.question);
          await s.page.waitForTimeout(700);
          const rendu = await s.page.evaluate(([cases, residus, avec]) => {
            Object.keys(cases).forEach(id => {
              const el = document.getElementById(id); if(!el) return;
              const sup = (avec && residus.includes(id)) ? '^{}' : '';
              el.setValue(cases[id] + sup);
            });
            /* ce que l'élève VOIT doit être le même dans les deux passes :
               un résidu qui se verrait ne serait pas ce défaut-là */
            return residus.map(id => {
              const el = document.getElementById(id);
              return el ? Math.round(el.getBoundingClientRect().width) : 0;
            });
          }, [C.cases, C.residus, avecResidu]);
          await s.page.waitForTimeout(500);
          await s.page.click(C.valider);
          await s.page.waitForTimeout(700);
          const etat = await s.page.evaluate(cases => {
            const ids = Object.keys(cases);
            const rouges = ids.filter(id => { const el = document.getElementById(id);
              return el && el.classList.contains('bad'); });
            const verts = ids.filter(id => { const el = document.getElementById(id);
              return el && el.classList.contains('ok'); });
            const f = document.getElementById('dexpFeedback');
            return { rouges, verts, total: ids.length, retour: f ? f.textContent.trim().slice(0, 60) : '' };
          }, C.cases);
          verifier('la copie de l\'élève est comptée juste — ' + quoi,
            etat.rouges.length === 0 && etat.verts.length === etat.total,
            etat.verts.length + '/' + etat.total + ' cases vertes'
              + (etat.rouges.length ? ', rouges : ' + etat.rouges.join(', ') : '')
              + ' — « ' + etat.retour + ' »');
          if(avecResidu){
            verifier('le résidu ne se voit pas à l\'écran (largeur des cases inchangée)',
              !!largeursPropres && rendu.every((w, i) => Math.abs(w - largeursPropres[i]) <= 2),
              'largeurs ' + rendu.join('/') + ' contre ' + (largeursPropres || []).join('/'));
          } else { largeursPropres = rendu; }
        }
      }
      verifier('lire une case ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 duodecies. {somme-fractions} : rien ne rougit à tort, et la ligne est droite ===== */
    /* Deux défauts signalés par Turquet en août 2026, sur le même écran.
       LE PREMIER est le pire qui puisse arriver : une case JUSTE comptée fausse.
       En soutien, l'élève tapait 1 dans « 2 × □ », passait à la case du dessous,
       et la première virait au ROUGE — parce que sa jumelle était encore vide et
       qu'une paire de multiplicateurs ne veut rien dire à moitié écrite. La note
       finale, elle, était juste : seule la couleur mentait, ce qui est
       exactement ce qui l'a laissée passer. On tape donc une copie JUSTE case
       par case, et AUCUNE ne doit rougir en chemin.
       LE SECOND est d'écriture : un terme entier s'écrivait à 2rem quand les
       chiffres d'une fraction sont à 1,33rem, dans une autre couleur — « 7/6 + 9 »
       avait un 9 deux fois plus gros que le 7, et le « + » ne tombait pas sur le
       trait. On mesure les deux, dans l'énoncé ET au début de la ligne.
       Seul un vrai navigateur peut voir tout cela : jsdom n'a pas MathLive, donc
       aucune case ne se remplit et rien n'a de position. */
    titre('6 duodecies. LES FRACTIONS : RIEN NE ROUGIT À TORT, ET LA LIGNE EST DROITE');
    if(!P.sommeFractions){
      ignorer('aucune case juste ne rougit pendant la saisie',
        'ce niveau n\'a pas l\'exercice de somme de fractions');
      ignorer('un terme entier s\'écrit comme une fraction, et le signe tombe sur le trait',
        'ce niveau n\'a pas l\'exercice de somme de fractions');
    } else if(!ml){
      ignorer('aucune case juste ne rougit pendant la saisie', 'MathLive absent : aucune case ne se remplit');
      ignorer('un terme entier s\'écrit comme une fraction, et le signe tombe sur le trait', 'MathLive absent');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.sommeFractions.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(1200);
      /* La question du signalement : 2/5 + 5. Un terme ENTIER, parce que c'est
         là que les deux défauts se voyaient. */
      await s.page.evaluate(() => {
        test.questions[test.idx] = {n1:2,d1:5,n2:5,d2:1,op:'+',D:5,k1:1,k2:5,N1:2,N2:25,N:27};
        renderSFTest();
      });
      await s.page.waitForTimeout(800);
      const COPIE = [['sf-a1','1'],['sf-b1','1'],['sf-a2','5'],['sf-b2','5'],
                     ['sf-num1','2'],['sf-num2','25'],['sf-den','5'],['sf-fn','27'],['sf-fd','5']];
      const rouges = [];
      for(const [id, v] of COPIE){
        await s.page.evaluate(i => { const el = document.getElementById(i); if(el) el.focus(); }, id);
        await s.page.waitForTimeout(70);
        await s.page.keyboard.type(v, { delay: 20 });
        /* on quitte la case : c'est le blur qui déclenche la correction en direct */
        await s.page.evaluate(() => { const e = document.querySelector('.screen.on'); if(e) e.click(); });
        await s.page.waitForTimeout(200);
        const vus = await s.page.evaluate(ids => ids.filter(i => {
          const el = document.getElementById(i); return el && el.classList.contains('bad');
        }), COPIE.map(c => c[0]));
        if(vus.length) rouges.push('après « ' + id + ' = ' + v +' » : ' + vus.join(', '));
      }
      verifier('aucune case juste ne rougit pendant la saisie',
        rouges.length === 0, rouges.slice(0, 2).join(' | '));

      const m = await s.page.evaluate(() => {
        const px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const mil = e => { const r = e.getBoundingClientRect(); return Math.round((r.top + r.bottom) / 2 * 10) / 10; };
        const dans = rac => {
          const h = document.getElementById(rac); if(!h) return null;
          const frac = h.querySelector('.sf-f:not(.sf-ent)');
          const ent = h.querySelector('.sf-f.sf-ent .n');
          const bar = frac ? frac.querySelector('.bar') : null;
          /* Nommer ce qui manque plutôt que hausser les épaules : un entier
             écrit « f-whole » — la grosse écriture d'avant — est le défaut
             même qu'on mesure, pas une mesure impossible. */
          if(!frac || !ent || !bar)
            return { manque: h.querySelector('.f-whole') ? 'l\'entier est écrit en « f-whole », la grosse écriture'
                                                         : 'il manque une fraction ou un entier à mesurer' };
          const signe = [...h.querySelectorAll('.f-times, b')]
            .find(x => /^[+−]$/.test((x.textContent || '').trim()));
          return { fraction: px(frac.querySelector('.n')), entier: px(ent),
                   ecartMilieu: Math.abs(mil(ent) - mil(bar)),
                   ecartSigne: signe ? Math.abs(mil(signe) - mil(bar)) : null };
        };
        return { enonce: dans('sfPrompt'), ligne: dans('sfHost') };
      });
      const juge = (ou, o) => {
        if(!o || o.manque) return (ou + ' : ' + (o ? o.manque : 'écran introuvable'));
        if(o.entier !== o.fraction) return (ou + ' : entier à ' + o.entier + 'px contre ' + o.fraction + 'px');
        if(o.ecartMilieu > 2) return (ou + ' : l\'entier est décalé de ' + o.ecartMilieu + 'px du trait');
        if(o.ecartSigne === null) return (ou + ' : aucun signe trouvé');
        if(o.ecartSigne > 3) return (ou + ' : le signe est à ' + o.ecartSigne + 'px du trait');
        return '';
      };
      const dits = [juge('énoncé', m.enonce), juge('ligne', m.ligne)].filter(Boolean);
      verifier('un terme entier s\'écrit comme une fraction, et le signe tombe sur le trait',
        dits.length === 0, dits.join(' | '));
      verifier('cet écran ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 quaterdecies. La saisie LIBRE : la feuille de calcul ===== */
    /* L'élève écrit son calcul lui-même, une étape par ligne, et c'est l'IA qui
       le lit. Rien de cet écran n'existe hors d'un vrai navigateur : jsdom n'a
       pas MathLive, donc pas de champ où écrire, pas d'événement « change »
       quand on appuie sur Entrée, et « lire() » rend une chaîne vide.
       QUATRE BORDS.
       · Entrée AJOUTE une ligne. C'est tout ce qui permet d'écrire plusieurs
         étapes ; sans lui l'exercice se réduit à une seule ligne, et la règle
         envoyée au modèle exige justement une étape intermédiaire.
       · Ce qui PART au modèle porte les préfixes. Une lecture qui perdrait le
         « = » de tête donnerait au correcteur des lignes sans lien entre elles,
         et il refuserait des copies justes.
       · Le VERDICT de l'IA fait la note. C'est le seul exercice de la Seconde
         où la note ne vient pas de cases colorées : si le « correct » du modèle
         cessait d'être lu, la note serait fausse sans que rien ne rougisse.
       · Les JETONS visent la feuille. La rangée « Insérer : , − ▯/▯ » s'affiche
         sur cet écran ; elle ne connaissait que les cases « pm-mf » et n'aurait
         rien inséré du tout — des boutons morts, sans erreur. */
    titre('6 quaterdecies. LA SAISIE LIBRE : LA FEUILLE DE CALCUL');
    if(!P.saisieLibre){
      ignorer('la feuille de calcul écrit, ajoute des lignes, et sa lecture part au modèle',
        'ce niveau n\'a pas la feuille de somme de fractions (sfl) que ce contrôle pilote');
      ignorer('le verdict de l\'IA fait la note',
        'ce niveau n\'a pas la feuille de somme de fractions (sfl) que ce contrôle pilote');
    } else if(!ml){
      ignorer('la feuille de calcul écrit, ajoute des lignes, et sa lecture part au modèle', 'MathLive absent');
      ignorer('le verdict de l\'IA fait la note', 'MathLive absent');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.saisieLibre.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1300);
      /* on capte ce qui part vraiment, et on choisit le verdict rendu */
      await s.page.evaluate(() => {
        window.__envoye = null; window.__verdict = false;
        const vrai = sb.functions.invoke.bind(sb.functions);
        sb.functions.invoke = function(nom, opts){
          if(opts && opts.body && opts.body.action === 'verif'){
            window.__envoye = opts.body;
            return Promise.resolve({ data:{ correct: window.__verdict, feedback:'Retour de contrôle.' }, error:null });
          }
          return vrai(nom, opts);
        };
        test.questions[test.idx] = {n1:9,d1:2,n2:5,d2:6,op:'+',D:6,k1:3,k2:1,N1:27,N2:5,N:32,Nr:16,Dr:3};
        renderSFL();
      });
      await s.page.waitForTimeout(900);
      /* LA SOMME EST DÉJÀ TAPÉE DANS LE CHAMP, et l'élève peut la modifier
         (demande de Turquet, août 2026). On relève donc d'abord ce qui s'y
         trouve, puis on écrit À LA SUITE — ce qui éprouve du même coup la
         rédaction EN LIGNE, celle qui enchaîne les « = » sans aller à la
         ligne : elle doit être acceptée comme l'autre. */
      const depart = await s.page.evaluate(() => {
        const m = sflFeuille.lignes[0].mf;
        return { latex: m.getValue(), attendu: String(test.sflDepart || ''),
                 modifiable: !m.readOnly,
                 plain: (window.mlDexp ? window.mlDexp.toPlain(m.getValue()) : '').trim() };
      });
      verifier('la somme est écrite dans le champ, et reste modifiable',
        depart.latex !== '' && depart.latex === depart.attendu && depart.modifiable,
        'champ : ' + JSON.stringify(depart.latex) + ', attendu ' + JSON.stringify(depart.attendu)
          + ', modifiable : ' + depart.modifiable);
      await s.page.evaluate(() => { const m = sflFeuille.lignes[0].mf; m.focus();
        try{ m.executeCommand('moveToMathfieldEnd'); }catch(e){} });
      await s.page.waitForTimeout(150);
      /* LES ESPACES SORTENT DE LA FRACTION, et sans elles le banc écrivait du
         charabia : « 27/6+5/6 » tapé d'un trait donne 27/(6+5/6), tout ce qui
         suit tombant dans le dénominateur. C'est la convention de MathLive, et
         l'indication sous la feuille la dit — mais un contrôle qui tape sans
         elles n'éprouve PAS la rédaction en ligne : il vérifie qu'on sait
         envoyer n'importe quoi. Vu en photographiant l'écran, pas dans le
         code. */
      await s.page.keyboard.type('=27/6 +5/6 =32/6 ', { delay: 40 });
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(400);
      await s.page.keyboard.type('16/3', { delay: 40 });
      await s.page.waitForTimeout(300);
      const vu = await s.page.evaluate(() => {
        /* LE JETON DOIT TOMBER DANS LA LIGNE OÙ L'ÉLÈVE ÉCRIT, pas dans la
           première venue. Demander seulement « pmActiveMF rend un champ de la
           feuille » ne suffisait pas : la fonction a trois chemins, et son
           dernier repli rend le PREMIER champ de l'écran. Un élève posé sur la
           troisième ligne aurait vu sa virgule atterrir sur la première, sans
           que rien ne rougisse — et le sabotage passait au vert. On INSÈRE donc
           pour de bon, et on regarde où ça tombe. */
        const avant = sflFeuille.lignes.map(L => { try{ return L.mf.getValue(); }catch(e){ return ''; } });
        let ou = -1;
        try{
          const L = sflFeuille.lignes[sflFeuille.lignes.length - 1];
          L.mf.focus();
          pmInsert(',');
          const apres = sflFeuille.lignes.map(M => { try{ return M.mf.getValue(); }catch(e){ return ''; } });
          for(let i = 0; i < apres.length; i++) if(apres[i] !== avant[i]) { ou = i; break; }
          L.mf.setValue(avant[avant.length - 1]);
        }catch(e){}
        return {
          lignes: sflFeuille.lignes.length,
          lu: sflFeuille.lire(),
          jetons: !!document.querySelector('.screen.on .rc-jetons'),
          jetonLigne: ou, derniere: sflFeuille.lignes.length - 1,
        };
      });
      verifier('Entrée ajoute une ligne à la feuille', vu.lignes >= 2,
        vu.lignes + ' ligne(s) après un appui sur Entrée');
      verifier('la feuille se lit d\'un trait, la somme comprise',
        vu.lu.indexOf(depart.plain) === 0 && /\n= /.test(vu.lu) && vu.lu.indexOf('=') > 0,
        'lu : ' + JSON.stringify(vu.lu) + ' — attendu au début : ' + JSON.stringify(depart.plain));
      verifier('un jeton tombe dans la ligne où l\'élève écrit',
        vu.jetons && vu.jetonLigne === vu.derniere,
        'jetons affichés : ' + vu.jetons + ', inséré dans la ligne ' + vu.jetonLigne
          + ' au lieu de ' + vu.derniere);
      /* un « correct » donne le point — ici le juge de la page et le modèle
         stubbé disent la même chose, c'est le circuit entier qu'on éprouve */
      await s.page.evaluate(() => { window.__verdict = true; });
      await s.page.click('#sflActions .btn-primary');
      await s.page.waitForTimeout(700);
      const juste = await s.page.evaluate(() => ({
        envoye: window.__envoye ? window.__envoye.reponse : null,
        regle: window.__envoye ? (window.__envoye.attendu || '').length : 0,
        score: test.score, note: test.answers[test.answers.length-1].correct,
      }));
      verifier('la copie de l\'élève part au modèle, la somme comprise',
        !!juste.envoye && juste.envoye.indexOf(depart.plain) === 0 && juste.regle > 500,
        'envoyé : ' + JSON.stringify(juste.envoye) + ', règle : ' + juste.regle + ' caractères');
      /* La rédaction EN LIGNE — plusieurs « = » dans une même ligne — doit
         arriver entière au modèle : c'est la façon d'écrire de Turquet, et
         c'est celle que la règle de décision doit accepter. */
      verifier('une rédaction écrite en ligne arrive entière au modèle',
        !!juste.envoye && (juste.envoye.split('\n')[0].match(/=/g) || []).length >= 2,
        'première ligne envoyée : ' + JSON.stringify((juste.envoye || '').split('\n')[0]));
      verifier('un « correct » du modèle donne le point',
        juste.score === 1 && juste.note === true,
        'score ' + juste.score + ', note ' + juste.note);
      /* et un refus ne le donne pas */
      await s.page.click('#sflActions .btn-primary');   /* question suivante */
      await s.page.waitForTimeout(900);
      await s.page.evaluate(() => { window.__verdict = false; sflFeuille.lignes[0].mf.setValue('\\frac{1}{2}'); });
      await s.page.waitForTimeout(200);
      await s.page.click('#sflActions .btn-primary');
      await s.page.waitForTimeout(700);
      const faux = await s.page.evaluate(() => ({ score: test.score, note: test.answers[test.answers.length-1].correct }));
      verifier('un refus du modèle ne donne pas le point',
        faux.score === 1 && faux.note === false, 'score ' + faux.score + ', note ' + faux.note);
      /* LA COPIE DE PRODUCTION, sur du VRAI MathLive : le modèle refuse une
         copie juste — le défaut signalé par Turquet — et la page donne quand
         même le point, parce que son juge arithmétique a vérifié chaque
         égalité en entiers. jsdom ne peut pas voir ce bord : il n'a pas
         MathLive, donc pas la sérialisation réelle que le juge doit lire. */
      await s.page.click('#sflActions .btn-primary');   /* question suivante */
      await s.page.waitForTimeout(900);
      await s.page.evaluate(() => {
        test.questions[test.idx] = {n1:1,d1:2,n2:1,d2:6,op:'−',D:6,N1:3,N2:1,N:2,Nr:1,Dr:3};
        renderSFL();
      });
      await s.page.waitForTimeout(700);
      const lina = await s.page.evaluate(() => {
        sflFeuille.lignes[0].mf.setValue(
          '\\frac{1}{2}-\\frac{1}{6}=\\frac{1\\times6}{2\\times6}-\\frac{1\\times2}{6\\times2}=\\frac{6}{12}-\\frac{2}{12}=\\frac{4}{12}=\\frac{1}{3}');
        window.__verdict = false;
        const q = test.questions[test.idx];
        const j = libreJuge(q, sflFeuille.lire(), 'sfl');
        return { lu: sflFeuille.lire(), sait: j.sait, correct: j.correct, avant: test.score };
      });
      verifier('le juge lit la sérialisation réelle de MathLive',
        lina.sait === true && lina.correct === true,
        'juge sur ' + JSON.stringify(lina.lu) + ' : sait ' + lina.sait + ', correct ' + lina.correct);
      await s.page.click('#sflActions .btn-primary');
      await s.page.waitForTimeout(700);
      const sauve = await s.page.evaluate(() => ({ score: test.score,
        note: test.answers[test.answers.length-1].correct,
        classe: document.getElementById('sflFeedback').className }));
      verifier('le modèle refuse une copie juste : le juge de la page donne quand même le point',
        sauve.score === lina.avant + 1 && sauve.note === true && /\bgood\b/.test(sauve.classe),
        'score ' + sauve.score + ' (avant : ' + lina.avant + '), note ' + sauve.note + ', classe ' + JSON.stringify(sauve.classe));
      verifier('la saisie libre ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 octodecies. LA RÉCURRENCE RÉDIGÉE : LA PROSE FRANÇAISE DANS UN
       CHAMP MATHÉMATIQUE =====
       L'élève écrit sa démonstration ENTIÈRE dans la feuille MathLive : des
       phrases françaises, des accents, et des indices au milieu. Rien de tout
       cela ne se mesure hors d'un vrai MathLive — jsdom n'en a pas, et le juge
       de la page y est éprouvé sur des chaînes que le banc écrit lui-même.
       Ici on TAPE, comme un élève, et on regarde ce que la page a vraiment lu.

       Le premier passage de cette sonde a trouvé un défaut que rien d'autre ne
       pouvait voir : en mode « rédaction », mlFeuille pose une VRAIE espace
       (sans quoi « on suppose » s'écrirait « onsuppose »), et la convention de
       MathLive — l'espace SORT d'un indice — disparaît avec elle. Un élève qui
       tapait « U_n » restait prisonnier de l'indice, et toute la suite de sa
       phrase tombait DEDANS : la lecture rendait « U_(0 =3 et 0 ≤ 3 ≤ 6 donc…) »,
       une phrase illisible pour le modèle, sans la moindre erreur nulle part.

       Cinq bords, et n'en tenir qu'un ne tient rien :
       — la prose FRANÇAISE ressort telle qu'elle est entrée, accents compris ;
       — la barre d'espace SORT de l'indice, et écrit une espace ailleurs ;
       — Entrée ajoute une ligne, et la feuille se lit d'un trait ;
       — les jetons (≤, Uₙ, Uₙ₊₁) tombent dans la ligne où l'élève écrit ;
       — le bilan est PEINT : vert ce qui va, rouge ce qui manque — mesuré à
         l'encre RÉSOLUE, jamais à la classe, la leçon de la phrase du 6.3. */
    titre('6 octodecies. LA RÉCURRENCE RÉDIGÉE : LA PROSE DANS UN CHAMP MATHÉMATIQUE');
    if(!P.recurrenceRedigee){
      ignorer('la feuille rend la prose française telle qu\'elle est écrite',
        'ce niveau n\'a pas l\'exercice de récurrence rédigée');
      ignorer('le bilan de la page est peint : vert ce qui va, rouge ce qui manque',
        'ce niveau n\'a pas l\'exercice de récurrence rédigée');
    } else if(!ml){
      ignorer('la feuille rend la prose française telle qu\'elle est écrite', 'MathLive absent');
      ignorer('le bilan de la page est peint : vert ce qui va, rouge ce qui manque', 'MathLive absent');
    } else {
      const R = P.recurrenceRedigee;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), R.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1400);
      /* La question est ÉPINGLÉE : la copie qu'on tape doit coller à l'énoncé
         tiré, sinon le juge refuserait à bon droit et le contrôle mesurerait
         autre chose que ce qu'il croit mesurer. */
      await s.page.evaluate(() => {
        window.__verdict = true; window.__envoye = null;
        const vrai = sb.functions.invoke.bind(sb.functions);
        sb.functions.invoke = function(nom, opts){
          if(opts && opts.body && opts.body.action === 'verif'){
            window.__envoye = opts.body;
            return Promise.resolve({ data:{ correct: window.__verdict, feedback:'Retour de contrôle.' }, error:null });
          }
          return vrai(nom, opts);
        };
        test.questions[test.idx] = { fam:'aff', n0:0, a:0.5, b:3, m:0, M:6, u0:3, fm:3, fM:4.5,
          fTex:'0{,}5x+3', recTex:'0{,}5U_{n}+3', fPlain:'0,5x + 3', recPlain:'0,5Uₙ + 3' };
        delete test.rrLignes; renderRR();
      });
      await s.page.waitForTimeout(900);
      /* on tape la démonstration, ligne par ligne, exactement comme un élève */
      await s.page.evaluate(() => rrFeuille.lignes[0].mf.focus());
      const COPIE = [
        'Initialisation : U_0 = 3 et 0 <= 3 <= 6 donc la propriete est vraie au rang 0',
        'Hérédité : on suppose que 0 <= U_n <= 6. On montre que 0 <= U_n+1 <= 6',
        'f est croissante sur [0 ; 6] donc 3 <= U_n+1 <= 4,5 <= 6',
        'Conclusion : pour tout n >= 0 la propriete est vraie'
      ];
      for(let i = 0; i < COPIE.length; i++){
        await s.page.keyboard.type(COPIE[i], { delay: 12 });
        if(i < COPIE.length - 1){ await s.page.keyboard.press('Enter'); await s.page.waitForTimeout(260); }
      }
      await s.page.waitForTimeout(400);
      const vu = await s.page.evaluate(() => {
        const txt = rrTexte(), j = rrJuge(test.questions[test.idx], txt);
        /* le jeton doit tomber dans la ligne où l'élève écrit, pas dans la
           première venue — la leçon de la feuille de la Seconde */
        const avant = rrFeuille.lignes.map(L => L.mf.getValue());
        let ou = -1;
        try{
          const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
          L.mf.focus(); rrInsert('U_{n+1}');
          const apres = rrFeuille.lignes.map(M => M.mf.getValue());
          for(let i = 0; i < apres.length; i++) if(apres[i] !== avant[i]){ ou = i; break; }
          L.mf.setValue(avant[avant.length - 1]);
        }catch(e){}
        return { lignes: rrFeuille.lignes.length, txt: txt, crit: j.crit.map(x => (x.ok ? '' : x.cle)).filter(Boolean),
                 verdict: j.verdict, fausses: (j.fausses || []).join(', '),
                 jetonLigne: ou, derniere: rrFeuille.lignes.length - 1,
                 clavier: [...document.querySelectorAll('#scr-rr button')]
                   .some(b => /clavier math/i.test(b.getAttribute('title') || '')) };
      });
      verifier('la feuille rend la prose française telle qu\'elle est écrite',
        /Hérédité/.test(vu.txt) && /on suppose que/.test(vu.txt) && /croissante/.test(vu.txt),
        'lu : ' + JSON.stringify(vu.txt.slice(0, 160)));
      /* LE BORD QUI A SERVI : la barre d'espace sort de l'indice. Sans lui,
         « U_n <= 6 » s'écrit « U_(n ≤ 6) » et la phrase entière tombe dans
         l'indice de U. On exige donc l'indice FERMÉ puis la suite DEHORS. */
      verifier('la barre d\'espace sort de l\'indice, et la phrase continue dehors',
        /U_\(n\)\s*≤/.test(vu.txt) && !/U_\(n[^)]*≤/.test(vu.txt),
        'lu : ' + JSON.stringify(vu.txt.slice(0, 200)));
      verifier('Entrée ajoute une ligne, et la feuille se lit d\'un trait',
        vu.lignes === 4 && vu.txt.split('\n').length === 4,
        vu.lignes + ' ligne(s), lecture en ' + vu.txt.split('\n').length + ' morceau(x)');
      verifier('la copie tapée passe les sept critères de la page',
        vu.crit.length === 0, 'refusée sur : ' + vu.crit.join(', '));
      /* LE VERDICT D'ACCEPTATION TIENT SUR DU VRAI MATHLIVE — c'est le bord
         que la production a payé : la copie arrive au juge APLATIE par la
         vraie sérialisation, et celle-ci ne doit ni cacher les images par f
         ni fabriquer une comparaison numérique fausse. jsdom l'éprouve sur
         des chaînes qu'il écrit lui-même ; seul un vrai MathLive écrit les
         siennes. */
      verifier('le juge accepte la copie tapée : le modèle ne peut plus la refuser',
        vu.verdict === 'accepte',
        'verdict « ' + vu.verdict + ' », comparaisons relevées : [' + vu.fausses + ']');
      verifier('un jeton tombe dans la ligne où l\'élève écrit',
        vu.jetonLigne === vu.derniere && vu.clavier,
        'inséré dans la ligne ' + vu.jetonLigne + ' au lieu de ' + vu.derniere
          + ', bouton clavier : ' + vu.clavier);
      /* LES BOUTONS ≥ ET U-DÉPART, CLIQUÉS POUR DE VRAI (demande de Turquet,
         septembre 2026) : un bouton mort ne se voit qu'au clic réel, et seul
         un vrai MathLive dit ce que l'insertion écrit. La question épinglée
         démarre au rang 0 : le bouton doit dire U₀ et écrire U_0. On restaure
         la ligne ensuite — la copie tapée sert encore aux contrôles suivants. */
      await s.page.evaluate(() => {
        const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
        window.__rrAvantBtn = L.mf.getValue(); L.mf.focus();
      });
      const btns = await s.page.$$('#rrOutils button');
      const btnTxt = await Promise.all(btns.map(h => h.evaluate(b => b.textContent.trim())));
      const iGe = btnTxt.indexOf('≥'), iU0 = btnTxt.indexOf('U₀');
      if(iGe >= 0) await btns[iGe].click();
      if(iU0 >= 0) await btns[iU0].click();
      await s.page.waitForTimeout(200);
      const insere = await s.page.evaluate(() => {
        const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
        const v = L.mf.getValue();
        L.mf.setValue(window.__rrAvantBtn || '');
        return v;
      });
      verifier('les boutons ≥ et U-départ écrivent au clic — et U-départ dit U₀ au rang 0',
        iGe >= 0 && iU0 >= 0 && /\\ge/.test(insere) && /U_\{?0\}?/.test(insere),
        'boutons [' + btnTxt.join(' ') + '], la ligne a reçu : ' + JSON.stringify(insere.slice(-80)));
      /* LE GESTE DE LA CAPTURE (Turquet, septembre 2026) : le jeton Uₙ suivi
         de « +1 » écrit le +1 HORS de l'indice — « U_(n)+1 » à la lecture,
         que l'œil ne distingue pas de Uₙ₊₁ à l'écran — et « on supose » perd
         un p. Seul un vrai MathLive produit cette sérialisation ; le témoin
         tapé plus haut (U_n+1 d'un trait) laisse le +1 DANS l'indice, il ne
         passe pas par ce chemin-là. On REFAIT donc le geste, on relit ce que
         la page reçoit — le contrôle mesure ce qu'il croit mesurer — et on
         exige que le juge n'y voie plus deux manques. La ligne d'essai est
         retirée ensuite : la copie tapée sert encore aux contrôles suivants. */
      await s.page.evaluate(() => rrFeuille.lignes[rrFeuille.lignes.length - 1].mf.focus());
      await s.page.keyboard.press('End');
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      await s.page.keyboard.type('on supose que 0 <= ', { delay: 12 });
      const iUn = btnTxt.indexOf('Uₙ');
      const rejouer = async () => {
        if(iUn >= 0) await btns[iUn].click();
        await s.page.waitForTimeout(150);
        await s.page.evaluate(() => rrFeuille.lignes[rrFeuille.lignes.length - 1].mf.focus());
        await s.page.keyboard.press('End');
      };
      await rejouer();
      await s.page.keyboard.type(' <= 6 et on montre 0 <= ', { delay: 12 });
      await rejouer();
      await s.page.keyboard.type('+1 <= 6', { delay: 12 });
      await s.page.waitForTimeout(300);
      const geste = await s.page.evaluate(() => {
        const lignes = rrTexte().split('\n');
        const derniere = lignes[lignes.length - 1];
        const rate = rrJuge(test.questions[test.idx], derniere)
          .crit.filter(x => !x.ok).map(x => x.cle);
        rrFeuille.lignes[rrFeuille.lignes.length - 1].mf.setValue('');
        return { derniere: derniere,
                 forme: /U_\(n\)\s*\+\s*1/.test(derniere) && /supose/.test(derniere),
                 suppose: rate.indexOf('suppos') < 0, montre: rate.indexOf('montre') < 0 };
      });
      await s.page.evaluate(() => rrFeuille.lignes[rrFeuille.lignes.length - 1].mf.focus());
      await s.page.keyboard.press('Backspace');
      await s.page.waitForTimeout(300);
      const apresRetrait = await s.page.evaluate(() => rrFeuille.lignes.length);
      verifier('le geste de la capture — le jeton Uₙ puis « +1 », et « supose » — passe au juge',
        geste.forme && geste.suppose && geste.montre && apresRetrait === 4,
        'lu : ' + JSON.stringify(geste.derniere.slice(0, 120))
          + (geste.forme ? '' : ' (la sérialisation mesurée n’est pas « U_(n)+1 » — le contrôle parlerait d’autre chose)')
          + ', suppos ' + (geste.suppose ? 'accepté' : 'REFUSÉ') + ', montre ' + (geste.montre ? 'accepté' : 'REFUSÉ')
          + ', ' + apresRetrait + ' ligne(s) après retrait');
      /* LE U STYLÉ ET LE ≤ DU CLAVIER VIRTUEL (capture de Turquet, septembre
         2026, v283) : \mathbf{U} perdait son U et « \le f » perdait les deux
         à l'aplatissement — le juge et le modèle lisaient « f(0)(Uₙ)(8) ».
         Seul un vrai MathLive fait le trajet setValue -> lecture réelle :
         jsdom éprouve toPlain sur des chaînes qu'il écrit lui-même, ici la
         valeur passe par le champ. La ligne est restaurée ensuite. */
      await s.page.evaluate(() => {
        const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
        window.__rrAvantStyle = L.mf.getValue();
        L.mf.setValue('on\\;montre\\;0\\;\\leqslant\\;\\mathbf{U}_{n+1}\\;\\leqslant\\;6');
      });
      await s.page.waitForTimeout(150);
      const style = await s.page.evaluate(() => {
        const lignes = rrTexte().split('\n');
        const derniere = lignes[lignes.length - 1];
        const rate = rrJuge(test.questions[test.idx], derniere)
          .crit.filter(x => !x.ok).map(x => x.cle);
        const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
        L.mf.setValue(window.__rrAvantStyle || '');
        return { derniere: derniere, montre: rate.indexOf('montre') < 0 };
      });
      verifier('le U stylé et le ≤ du clavier virtuel survivent à l\'aplatissement',
        /U_\(n\+1\)/.test(style.derniere) && /≤/.test(style.derniere) && style.montre,
        'lu : ' + JSON.stringify(style.derniere.slice(0, 120))
          + ', montre ' + (style.montre ? 'accepté' : 'REFUSÉ'));
      /* LES TOUCHES ≤ ≥ < > DU CLAVIER À L'ÉCRAN (demande de Turquet, septembre
         2026), PLUS « = » (seconde demande du même mois — elle manquait aux
         trois claviers, et sur tablette le clavier du système est coupé) : une
         touche se prouve en la CLIQUANT sur le clavier RENDU — la doctrine du
         bouton mort ; jsdom lit déjà la table de la greffe. On ouvre par le
         vrai bouton ⌨️ du 6.7, on clique les cinq touches, on relit la ligne
         APLATIE, puis on tape « >= » — le raccourci jumeau du « <= » que le
         témoin tient déjà. Le clavier est REFERMÉ ensuite : ouvert, il
         recouvrirait les boutons que la suite du banc clique. */
      await s.page.evaluate(() => {
        const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
        window.__rrAvantKb = L.mf.getValue();
        L.mf.setValue(''); L.mf.focus();
      });
      await s.page.click('#rrOutils button[aria-label^="Afficher ou masquer le clavier"]');
      await s.page.waitForTimeout(800);
      /* les touches se cherchent parmi les ENFANTS DIRECTS des rangées : la
         touche de bascule ne porte pas la classe « keycap » de MathLive, et un
         sélecteur qui la manque ferait échouer la mesure sur la page juste. */
      const trouverCap = async (txt) => s.page.evaluate(t => {
        const caps = Array.from(document.querySelectorAll('#kbwin .MLK__rows > .MLK__row > *, body > .ML__keyboard .MLK__rows > .MLK__row > *'));
        const c = caps.find(k => k.textContent.trim() === t);
        if(!c) return null; const r = c.getBoundingClientRect();
        return (r.width > 4 && r.height > 4) ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
      }, txt);
      const cliquerCap = async (txt) => { const p = await trouverCap(txt);
        if(p){ await s.page.mouse.click(p.x, p.y); await s.page.waitForTimeout(140); } return !!p; };
      const kbRects = { ouvert: await s.page.evaluate(() => !!(window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible)) };
      /* et la touche « clavier B » (les mots vivent dans le profil), dans la
         fenêtre FLOTTANTE de l'ordinateur : un libellé de neuf lettres dans
         une touche rembourrée de 12 px de chaque côté — à 1,5 unité il y
         était coupé, mesuré ici ; le téléphone a sa propre mesure (11 ter) */
      const basculeBureau = P.clavierEcran ? await s.page.evaluate(t => {
        const els = [...document.querySelectorAll('#kbwin .MLK__rows > .MLK__row > *, body > .ML__keyboard .MLK__rows > .MLK__row > *')];
        const el = els.find(c => c.textContent.trim() === t); if(!el) return { absent: true };
        const r = el.getBoundingClientRect();
        return { absent: false, w: Math.round(r.width), coupe: el.scrollWidth > el.clientWidth + 1, visible: r.width > 4 && r.height > 4 };
      }, P.clavierEcran.versB) : null;
      if(basculeBureau) verifier('dans la fenêtre flottante de l\'ordinateur, « ' + P.clavierEcran.versB + ' » tient dans sa touche',
        !basculeBureau.absent && basculeBureau.visible && !basculeBureau.coupe,
        basculeBureau.absent ? 'aucune touche « ' + P.clavierEcran.versB + ' »' : basculeBureau.coupe ? 'libellé coupé (touche de ' + basculeBureau.w + ' px)' : 'touche sans surface');
      /* « = » d'abord : cliqué après « > », un raccourci « >= » pourrait les
         fondre en ≥ et la mesure parlerait d'autre chose. Et les touches vivent
         désormais sur les DEUX couches (demande de Turquet, septembre 2026) :
         « = » sur le clavier A, ≤ ≥ < > avec les variables sur le clavier B —
         on bascule au milieu, par la touche même, et on revient. */
      kbRects.eq = await cliquerCap('=');
      kbRects.versB = await cliquerCap(P.clavierEcran ? P.clavierEcran.versB : 'clavier B');
      await s.page.waitForTimeout(200);
      kbRects.le = await cliquerCap('≤'); kbRects.ge = await cliquerCap('≥');
      kbRects.lt = await cliquerCap('<'); kbRects.gt = await cliquerCap('>');
      await cliquerCap(P.clavierEcran ? P.clavierEcran.versA : 'clavier A');
      await s.page.waitForTimeout(200);
      const kbTape = await s.page.evaluate(() => {
        const lignes = rrTexte().split('\n');
        return lignes[lignes.length - 1];
      });
      await s.page.evaluate(() => {
        const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
        L.mf.setValue(''); L.mf.focus();
      });
      await s.page.keyboard.type('n>=1', { delay: 40 });
      await s.page.waitForTimeout(250);
      const kbRacc = await s.page.evaluate(() => {
        const lignes = rrTexte().split('\n');
        return lignes[lignes.length - 1];
      });
      await s.page.click('#rrOutils button[aria-label^="Afficher ou masquer le clavier"]');
      await s.page.waitForTimeout(400);
      const kbFerme = await s.page.evaluate(() => {
        const vk = window.mathVirtualKeyboard;
        const w = document.getElementById('kbwin');
        const L = rrFeuille.lignes[rrFeuille.lignes.length - 1];
        L.mf.setValue(window.__rrAvantKb || '');
        return !(vk && vk.visible) && !(w && w.classList.contains('open'));
      });
      verifier('les touches ≤ ≥ < > = du clavier à l\'écran écrivent dans la ligne du 6.7',
        kbRects.ouvert && kbRects.le && kbRects.ge && kbRects.lt && kbRects.gt && kbRects.eq
          && kbTape.indexOf('≤') >= 0 && kbTape.indexOf('≥') >= 0
          && kbTape.indexOf('<') >= 0 && kbTape.indexOf('>') >= 0
          && kbTape.indexOf('=') >= 0 && kbFerme,
        (kbRects.ouvert ? '' : 'le clavier ne s\'ouvre pas au ⌨️ ; ')
          + (kbRects.versB ? '' : 'la touche de bascule est introuvable ; ')
          + 'touches trouvées : ' + ['le', 'ge', 'lt', 'gt', 'eq'].filter(t => kbRects[t]).join(' ')
          + ', ligne lue : ' + JSON.stringify(kbTape.slice(0, 60))
          + (kbFerme ? '' : ' — ET LE CLAVIER RESTE OUVERT'));
      verifier('le raccourci « >= » écrit ≥ dans la feuille du 6.7',
        /n≥1/.test(kbRacc),
        'lu : ' + JSON.stringify(kbRacc.slice(0, 60)));
      /* LE BILAN PEINT, à l'encre RÉSOLUE : une classe posée ne prouve rien —
         une règle plus spécifique peut la repeindre, et c'est arrivé sur la
         phrase des couleurs du 6.3 sans qu'un caractère du HTML ne le dise. */
      await s.page.click('#rrActions .btn-primary');
      await s.page.waitForTimeout(900);
      const tout = await s.page.evaluate(() => {
        const b = document.querySelector('#rrFeedback .rr-crit');
        const enc = e => getComputedStyle(e).color;
        return { score: test.score, envoye: (window.__envoye || {}).reponse || '',
                 verts: b ? [...b.querySelectorAll('.fb-ok')].map(enc) : [],
                 rouges: b ? [...b.querySelectorAll('.fb-ko')].map(enc) : [] };
      });
      /* la copie est complète : sept lignes vertes, aucune rouge */
      const dominante = c => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(c || ''); if(!m) return '?';
        const r = +m[1], v = +m[2], b = +m[3];
        return (v > r + 20 && v > b + 20) ? 'vert' : (r > v + 20 && r > b + 20) ? 'rouge' : 'autre'; };
      verifier('une copie complète : sept lignes VERTES, aucune rouge',
        tout.verts.length === 7 && tout.rouges.length === 0
          && tout.verts.every(c => dominante(c) === 'vert'),
        tout.verts.length + ' verte(s) ' + JSON.stringify(tout.verts.slice(0, 1))
          + ', ' + tout.rouges.length + ' rouge(s)');
      verifier('la copie tapée part au modèle telle qu\'elle est lue',
        tout.envoye.indexOf('Initialisation') === 0 && tout.envoye.split('\n').length === 4 && tout.score === 1,
        'envoyé : ' + JSON.stringify(tout.envoye.slice(0, 120)) + ', score ' + tout.score);
      /* et le bord opposé : une copie à qui il manque un mot se peint EN ROUGE
         sur cette ligne-là, et en vert sur les autres. Le témoin a SUIVI la
         barre de septembre 2026 : « croissante » porte son intervalle, sans
         quoi deux lignes rougiraient et le contrôle mesurerait la barre au
         lieu du mot manquant. */
      await s.page.evaluate(() => {
        delete test.rrLignes; test.locked = false; test.score = 0; test.answers = [];
        renderRR();
      });
      await s.page.waitForTimeout(800);
      await s.page.evaluate(() => rrFeuille.lignes[0].mf.focus());
      await s.page.keyboard.type('Initialisation : U_0 = 3 et 0 <= 3 <= 6 donc vrai au rang 0. '
        + 'On suppose que 0 <= U_n <= 6. On montre que 0 <= U_n+1 <= 6. f est croissante sur [0 ; 6].', { delay: 10 });
      await s.page.waitForTimeout(300);
      await s.page.click('#rrActions .btn-primary');
      await s.page.waitForTimeout(900);
      const manque = await s.page.evaluate(() => {
        const b = document.querySelector('#rrFeedback .rr-crit');
        const enc = e => getComputedStyle(e).color;
        return { score: test.score,
                 verts: b ? b.querySelectorAll('.fb-ok').length : 0,
                 rouges: b ? [...b.querySelectorAll('.fb-ko')].map(enc) : [] };
      });
      verifier('le bilan de la page est peint : vert ce qui va, rouge ce qui manque',
        manque.rouges.length === 1 && manque.verts === 6
          && dominante(manque.rouges[0]) === 'rouge' && manque.score === 0,
        manque.verts + ' verte(s), ' + manque.rouges.length + ' rouge(s) '
          + JSON.stringify(manque.rouges) + ', score ' + manque.score
          + ' — attendu 6 vertes, 1 rouge (le mot « hérédité »), et aucun point');
      verifier('la récurrence rédigée ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 novodecies. {suite-auxiliaire-redaction} : les quatre feuilles sur du VRAI MathLive ===== */
    /* Le 6.8 rédige ses QUATRE questions dans quatre feuilles : seul un vrai
       MathLive fait le trajet frappe → sérialisation → juge. On TAPE la
       définition de la question a) — V_n puis « +1 », le + sorti de l'indice
       par la barre d'espace, la leçon du 6.7 — et on relit ce que le juge en
       fait ; puis la copie de la fiche est posée dans les quatre feuilles,
       « Vérifier » est CLIQUÉ (modèle stubbé) et la note se lit sur ce que le
       bouton enregistre. Le bord opposé : la feuille c) vidée rougit ses deux
       critères en se NOMMANT, et le point n'est pas donné malgré l'accord du
       modèle stubbé — le refus de la page prime. */
    titre('6 novodecies. LA SUITE AUXILIAIRE RÉDIGÉE : QUATRE FEUILLES, UN JUGE');
    if(!P.suiteAuxRedigee){
      ignorer('le 6.8 : le geste tapé et la copie de la fiche passent sur du vrai MathLive',
        'ce niveau n\'a pas l\'exercice de suite auxiliaire rédigée');
      ignorer('le 6.8 : la partie c) vidée rougit en se nommant, sans le point',
        'ce niveau n\'a pas l\'exercice de suite auxiliaire rédigée');
    } else if(!ml){
      ignorer('le 6.8 : le geste tapé et la copie de la fiche passent sur du vrai MathLive', 'MathLive absent');
      ignorer('le 6.8 : la partie c) vidée rougit en se nommant, sans le point', 'MathLive absent');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.suiteAuxRedigee.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1400);
      /* la question est ÉPINGLÉE (le cas de la fiche : p=5, k=4000, U₀=10000),
         et le modèle stubbé — la copie doit coller à l'énoncé tiré, sinon le
         juge refuserait à bon droit */
      const C0 = { p: 5, a: 0.95, b: 200, k: 4000, u0: 10000, v0: 6000 };
      await s.page.evaluate(c => {
        window.__envoye = null;
        sb.functions.invoke = async function(nom, opts){
          if(opts && opts.body && opts.body.action === 'verif'){
            window.__envoye = opts.body;
            return { data: { correct: true, feedback: 'Retour du modèle stubbé.' } };
          }
          return { data: {} };
        };
        test.questions[0] = c; test.idx = 0; renderSAR();
      }, C0);
      await s.page.waitForTimeout(600);
      /* LE GESTE : V_n, la barre d'espace qui sort de l'indice, « +1 ». Le
         champ se CLIQUE avant de taper — un focus() posé pendant que MathLive
         s'installe avale les premières frappes, et la mesure accuserait la
         page d'un défaut qu'elle n'a pas. */
      await s.page.click('#sarSheetA math-field');
      await s.page.waitForTimeout(400);
      await s.page.keyboard.type('V_n +1 = U_n +1 - 4000', { delay: 30 });
      await s.page.waitForTimeout(250);
      const geste = await s.page.evaluate(() => {
        const l = sarTexteDe('a').split('\n')[0];
        const j = sarJuge(test.questions[0], { a: sarTexteDe('a'), b: '', c: '', d: '' });
        return { ligne: l, def: j.crit[0].ok };
      });
      /* LA COPIE DE LA FICHE, posée dans les quatre feuilles, puis le CLIC */
      const COPIE = {
        a: ['V_{n+1}=U_{n+1}-4000', '=0.95U_n+200-4000', '=0.95U_n-3800', '=0.95(U_n-4000)', '=0.95V_n'],
        b: ['V_0=U_0-4000=10000-4000=6000'],
        c: ['(V_n)\\;est\\;une\\;suite\\;geometrique\\;de\\;raison\\;0.95\\;et\\;de\\;premier\\;terme\\;6000', 'V_n=6000\\times0.95^n'],
        d: ['V_n=U_n-4000\\;donc\\;U_n=V_n+4000', 'U_n=6000\\times0.95^n+4000']
      };
      const poserTout = cp => s.page.evaluate(c => {
        ['a', 'b', 'c', 'd'].forEach(p => {
          const F = sarFeuilles[p];
          while(F.lignes.length < c[p].length) F.ajouterLigne(F.lignes.length - 1);
          F.lignes.forEach((L, i) => L.mf.setValue(c[p][i] || ''));
        });
      }, cp);
      await poserTout(COPIE);
      await s.page.waitForTimeout(300);
      await s.page.click('#sarActions .btn-primary');
      await s.page.waitForTimeout(900);
      const plein = await s.page.evaluate(() => ({
        ok: document.querySelectorAll('#sarFeedback .fb-ok').length,
        ko: document.querySelectorAll('#sarFeedback .fb-ko').length,
        score: test.score, locked: test.locked,
        regle: !!(window.__envoye && String(window.__envoye.attendu || '').indexOf('RÈGLE DE DÉCISION') >= 0)
      }));
      verifier('le 6.8 : le geste tapé et la copie de la fiche passent sur du vrai MathLive',
        geste.def && plein.ok === 8 && plein.ko === 0 && plein.score === 1 && plein.locked && plein.regle,
        'geste lu : ' + JSON.stringify(geste.ligne.slice(0, 60)) + (geste.def ? '' : ' — la définition tapée n\'est pas reconnue')
          + ' ; copie pleine : ' + plein.ok + ' verte(s), ' + plein.ko + ' rouge(s), score ' + plein.score
          + (plein.regle ? '' : ', la règle ne part pas au modèle'));
      /* LE BORD OPPOSÉ : c) vidée — deux critères rouges qui se NOMMENT, et le
         refus de la page prime sur l'accord du modèle stubbé */
      await s.page.evaluate(c => { test.questions[0] = c; test.idx = 0; test.score = 0; test.answers = []; renderSAR(); }, C0);
      await s.page.waitForTimeout(600);
      await poserTout({ ...COPIE, c: [''] });
      await s.page.waitForTimeout(300);
      await s.page.click('#sarActions .btn-primary');
      await s.page.waitForTimeout(900);
      const sansC = await s.page.evaluate(() => {
        const kos = [...document.querySelectorAll('#sarFeedback .fb-ko')].map(e => e.textContent);
        return { ko: kos.length, nomme: kos.every(t => t.trim().indexOf('✗ c)') === 0), score: test.score };
      });
      verifier('le 6.8 : la partie c) vidée rougit en se nommant, sans le point',
        sansC.ko === 2 && sansC.nomme && sansC.score === 0,
        sansC.ko + ' rouge(s)' + (sansC.nomme ? ' (les deux disent « c) »)' : ' — les croix ne nomment pas c)')
          + ', score ' + sansC.score);
      /* LA CAPTURE DE PRODUCTION (Turquet, septembre 2026) : la chaîne du a)
         avale le − 3800 (« … + 200 − 4000 » suivi de « = 0,95 Uₙ ») — une
         égalité FAUSSE que la structure ne voit pas, les trois critères du a)
         étant des faits de présence. Sur la sérialisation RÉELLE de MathLive,
         le juge d'égalités la nomme, le point n'est pas donné, et le modèle —
         stubbé pour dire « correct » — n'est même plus interrogé. */
      await s.page.evaluate(c => { window.__envoye = null; test.questions[0] = c; test.idx = 0; test.score = 0; test.answers = []; renderSAR(); }, C0);
      await s.page.waitForTimeout(600);
      await poserTout({ ...COPIE, a: COPIE.a.map(l => l === '=0.95U_n-3800' ? '=0.95U_n' : l) });
      await s.page.waitForTimeout(300);
      await s.page.click('#sarActions .btn-primary');
      await s.page.waitForTimeout(900);
      const fausse = await s.page.evaluate(() => {
        const kos = [...document.querySelectorAll('#sarFeedback .fb-ko')].map(e => e.textContent.trim());
        /* la sérialisation réelle écrit l'indice « u_(n) » ou « u_n » selon le
           chemin (frappe ou setValue) : le contrôle accepte les deux graphies,
           il exige l'ÉGALITÉ fautive — « … = 0.95 Uₙ » — nommée en clair */
        return { ko: kos.length, ok: document.querySelectorAll('#sarFeedback .fb-ok').length,
          nomme: kos.some(t => t.indexOf('c’est faux') >= 0 && /= 0[.,]95 ?u_\(?n\)? ?»/.test(t)),
          texte: kos.length ? kos[0].slice(0, 140) : '(aucune croix rouge)',
          score: test.score, correct: test.answers.length ? test.answers[0].correct : null,
          modele: window.__envoye !== null };
      });
      verifier('le 6.8 : la chaîne fausse de la capture rougit en se nommant, sans appeler le modèle',
        fausse.ko === 1 && fausse.ok === 8 && fausse.nomme && fausse.score === 0 && fausse.correct === false && !fausse.modele,
        fausse.ok + ' verte(s), ' + fausse.ko + ' rouge(s)'
          + (fausse.nomme ? ' (l’égalité fausse est nommée)' : ' — l’égalité fausse n’est pas nommée : « ' + fausse.texte + ' »')
          + ', score ' + fausse.score + (fausse.modele ? ', et le modèle a été appelé' : ''));
      /* CHAQUE égalité se vérifie, PUISSANCES comprises, sur la sérialisation
         RÉELLE de MathLive (demande de Turquet, septembre 2026) : le « + 4000 »
         avalé dans « Uₙ = 6000 × 0,95ⁿ » rougit en se nommant — l'évaluation
         en trois points lit l'exposant que le lecteur linéaire ne lisait
         pas — et le modèle n'est pas appelé. */
      await s.page.evaluate(c => { window.__envoye = null; test.questions[0] = c; test.idx = 0; test.score = 0; test.answers = []; renderSAR(); }, C0);
      await s.page.waitForTimeout(600);
      await poserTout({ ...COPIE, d: ['V_n=U_n-4000\\;donc\\;U_n=V_n+4000', 'U_n=6000\\times0.95^n'] });
      await s.page.waitForTimeout(300);
      await s.page.click('#sarActions .btn-primary');
      await s.page.waitForTimeout(900);
      const puiss = await s.page.evaluate(() => {
        const kos = [...document.querySelectorAll('#sarFeedback .fb-ko')].map(e => e.textContent.trim());
        return { ko: kos.length,
          nomme: kos.some(t => t.indexOf('c’est faux') >= 0 && /0\.95\^\(?n\)?/.test(t)),
          texte: kos.length ? kos[kos.length - 1].slice(0, 140) : '(aucune croix rouge)',
          score: test.score, modele: window.__envoye !== null };
      });
      verifier('le 6.8 : la puissance s’évalue sur la sérialisation réelle — le + 4000 avalé rougit en se nommant',
        puiss.nomme && puiss.score === 0 && !puiss.modele,
        puiss.ko + ' rouge(s)' + (puiss.nomme ? ' (l’égalité de la puissance est nommée)' : ' — l’égalité de la puissance n’est pas nommée : « ' + puiss.texte + ' »')
          + ', score ' + puiss.score + (puiss.modele ? ', et le modèle a été appelé' : ''));
      verifier('la suite auxiliaire rédigée ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 novodecies bis. LA TOUCHE MORTE « ^ » ÉCRIT UN EXPOSANT ===== */
    /* Signalé par Turquet sur le 6.6 (septembre 2026) : « quand je tape ^n il
       rajoute le signe intersection ». Sur un clavier AZERTY « ^ » est une
       touche MORTE : le navigateur livre du TEXTE composé — « ^ » (Windows,
       que MathLive AVALE : le n s'écrit sur la ligne, faux sans rien montrer)
       ou « ˆ » U+02C6 (Mac, que MathLive garde tel quel — le chapeau que
       l'élève lit comme un signe ∩). `chapeauMorte` remplace ce texte par un
       vrai exposant au `beforeinput`. Rien de tout cela ne se voit hors d'un
       vrai MathLive : jsdom n'a ni composition ni exposant — il n'éprouve que
       le gestionnaire sur un champ factice. On TAPE donc les deux variantes
       dans la case rf-s1 — insertText, le chemin même d'une touche morte — et
       on exige le LaTeX en exposant ET le juge au vert ; puis la frappe
       DIRECTE (QWERTY), qui doit rester intacte : l'intercepter aussi
       doublerait son exposant. */
    titre('6 novodecies bis. LA TOUCHE MORTE « ^ » ÉCRIT UN EXPOSANT');
    if(!P.chapeauMorte){
      ignorer('la touche morte ^ écrit un exposant dans un champ mathématique',
        'ce niveau ne déclare pas chapeauMorte (le gestionnaire vit en Terminale)');
    } else if(!ml){
      ignorer('la touche morte ^ écrit un exposant dans un champ mathématique', 'MathLive absent');
    } else {
      s = await ouvrir(chromium, ml, {});
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.chapeauMorte.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1200);
      /* la question est ÉPINGLÉE (la fiche même) : le juge doit pouvoir dire
         vrai sur ce qu'on tape, sinon le contrôle mesurerait un tirage */
      await s.page.evaluate(() => {
        test.questions[test.idx] = { a: 0.5, k: 2, b: 1, c: -1, u0: 1, n0: 0 };
        renderRF();
      });
      await s.page.waitForTimeout(500);
      const taperRF = async gestes => {
        await s.page.evaluate(() => { const el = document.getElementById('rf-s1'); el.setValue(''); el.focus(); });
        await s.page.waitForTimeout(150);
        await gestes();
        await s.page.waitForTimeout(200);
        return s.page.evaluate(() => {
          const el = document.getElementById('rf-s1');
          const q = test.questions[test.idx];
          return { latex: el.value, juge: rfOkCase(q, rfCases(q).find(k => k.id === 'rf-s1'), dexpCellValue('rf-s1')) };
        });
      };
      const morteW = await taperRF(async () => {
        await s.page.keyboard.type('2-0,5');
        await s.page.keyboard.insertText('^');           /* la touche morte de Windows */
        await s.page.keyboard.press('n');
      });
      const morteM = await taperRF(async () => {
        await s.page.keyboard.type('2-0,5');
        await s.page.keyboard.insertText('ˆ');           /* la touche morte du Mac : U+02C6 */
        await s.page.keyboard.press('n');
      });
      const directe = await taperRF(async () => {
        await s.page.keyboard.type('2-0,5');
        await s.page.keyboard.press('^');                /* la frappe directe QWERTY */
        await s.page.keyboard.press('n');
      });
      verifier('la touche morte ^ (Windows et Mac) écrit un exposant, et le juge dit vrai',
        /\^\{n\}/.test(morteW.latex) && morteW.juge
          && /\^\{n\}/.test(morteM.latex) && morteM.juge && morteM.latex.indexOf('ˆ') < 0,
        'Windows : ' + JSON.stringify(morteW.latex) + ' (juge ' + morteW.juge + '), '
          + 'Mac : ' + JSON.stringify(morteM.latex) + ' (juge ' + morteM.juge + ')');
      verifier('la frappe directe ^ reste intacte : un seul exposant, le juge dit vrai',
        /\^\{n\}/.test(directe.latex) && directe.juge && directe.latex.indexOf('^{^') < 0,
        'lu : ' + JSON.stringify(directe.latex) + ' (juge ' + directe.juge + ')');
      verifier('la touche morte ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies bis. {recurrence-fractions} : des fractions IMBRIQUÉES à cases ===== */
    /* Le 6.10 pose la chaîne de la fiche « récurrence et fractions » — une
       fraction dont le numérateur et le dénominateur sont eux-mêmes des
       fractions à cases. Le banc jsdom tient le tirage, la fiche et les deux
       juges ; ce qu'il ne voit pas : la barre EXTÉRIEURE qui doit envelopper
       les barres intérieures (une barre trop courte se lit comme deux
       fractions côte à côte), une rangée de la chaîne qui DÉFILERAIT, et la
       case qui doit grandir sous « 3n+9 ». Puis le banc TAPE la copie de la
       fiche pour de vrai, case par case, et clique « Vérifier » : la note se
       lit sur ce que le bouton enregistre. */
    titre('6 vicies bis. LA RÉCURRENCE EN FRACTIONS : LES BARRES IMBRIQUÉES ET LA COPIE TAPÉE');
    if(!P.recurrenceFractions){
      ignorer('le 6.10 : la barre extérieure enveloppe les barres intérieures, rien ne défile',
        'ce niveau n\'a pas l\'exercice de récurrence en fractions');
      ignorer('le 6.10 : la copie de la fiche tapée pour de vrai vaut le point',
        'ce niveau n\'a pas l\'exercice de récurrence en fractions');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1280, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.recurrenceFractions.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      /* la question est ÉPINGLÉE sur le cas de la fiche (a = 3, b = 1) : la
         copie tapée doit coller à l'énoncé tiré */
      await s.page.evaluate(() => { test.questions = [{ a: 3, b: 1 }, { a: 5, b: 2 }]; test.idx = 0; test.score = 0; test.answers = []; renderRFR(); });
      await s.page.waitForTimeout(500);
      const mesurer = () => s.page.evaluate(() => {
        const cases = [...document.querySelectorAll('#scr-rfr input.rfr-in')];
        const visibles = cases.filter(e => { const r = e.getBoundingClientRect(); return r.width > 10 && r.height > 10; }).length;
        const rows = [...document.querySelectorAll('#rfrPartA .sa2-row, #rfrPartB .sa2-row')];
        const defile = rows.filter(r => r.scrollWidth > r.clientWidth + 1).length;
        /* chaque fraction IMBRIQUÉE : la barre du dehors doit couvrir, à
           gauche comme à droite, chaque barre du dedans */
        const imbriquees = [...document.querySelectorAll('.rfr-chaine .sa2-frac')].filter(f => f.querySelector('.sa2-frac'));
        const ecarts = imbriquees.map(f => {
          const barre = f.querySelector(':scope > .bar'), B = barre.getBoundingClientRect();
          return [...f.querySelectorAll('.sa2-frac .bar')].filter(b => b !== barre).map(b => { const r = b.getBoundingClientRect(); return Math.round(Math.max(B.left - r.left, r.right - B.right)); });
        }).flat();
        return { n: cases.length, visibles, rows: rows.length, defile, imbriquees: imbriquees.length,
                 barreCourte: ecarts.filter(x => x > 1).length, pire: ecarts.length ? Math.max(...ecarts) : null,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      });
      const vu = await mesurer();
      verifier('le 6.10 : les trente-sept cases sont rendues et visibles, la chaîne a ses six rangées',
        vu.n === 37 && vu.visibles === 37 && vu.rows >= 8, vu.n + ' case(s), ' + vu.visibles + ' visible(s), ' + vu.rows + ' rangée(s)');
      verifier('le 6.10 : la barre extérieure enveloppe les barres intérieures, rien ne défile',
        vu.imbriquees >= 2 && vu.barreCourte === 0 && vu.defile === 0 && !vu.page,
        vu.imbriquees + ' fraction(s) imbriquée(s), ' + vu.barreCourte + ' barre(s) trop courte(s)' + (vu.pire !== null && vu.pire > 1 ? ' (de ' + vu.pire + ' px)' : '') + ', ' + vu.defile + ' rangée(s) qui défile(nt)' + (vu.page ? ', la page déborde' : ''));
      /* la case GRANDIT : « 3n+9 » tapé pour de vrai dans la case du
         numérateur regroupé, mesurée avant et après */
      const avant = await s.page.$eval('#rfr-c13', e => e.getBoundingClientRect().width);
      await s.page.click('#rfr-c13');
      await s.page.keyboard.type('3n+9', { delay: 20 });
      await s.page.waitForTimeout(200);
      const apres = await s.page.$eval('#rfr-c13', e => ({ l: e.getBoundingClientRect().width, coupe: e.scrollWidth > e.clientWidth + 1 }));
      verifier('le 6.10 : la case grandit sous « 3n+9 » et rien n\'est coupé',
        apres.l > avant + 8 && !apres.coupe, Math.round(avant) + ' px → ' + Math.round(apres.l) + ' px' + (apres.coupe ? ', texte coupé' : ''));
      /* LA COPIE DE LA FICHE, tapée case par case, puis le CLIC */
      const copie = await s.page.evaluate(() => {
        const att = rfrAttendu(test.questions[0]);
        return RFR_IDS.map(id => { const x = att[id];
          return [id, x[0] === 'nb' ? rfrFrStr(x[2], x[3]) : x[0] === 'lin' ? rfrLinStr(x[1], x[2]) : rfrLinStr(x[2], x[2] * x[1])]; });
      });
      for(const [id, val] of copie){
        await s.page.fill('#' + id, '');
        await s.page.click('#' + id);
        await s.page.keyboard.type(val, { delay: 10 });
      }
      await s.page.click('#rfrActions .btn-primary');
      await s.page.waitForTimeout(500);
      const bilan = await s.page.evaluate(() => ({
        ok: document.querySelectorAll('#scr-rfr input.rfr-in.ok').length,
        bad: document.querySelectorAll('#scr-rfr input.rfr-in.bad').length,
        score: test.score, locked: test.locked,
        suivant: (document.querySelector('#rfrActions .btn-primary') || {}).textContent || '' }));
      const vuC = await mesurer();
      verifier('le 6.10 : la copie de la fiche tapée pour de vrai vaut le point',
        bilan.ok === 37 && bilan.bad === 0 && bilan.score === 1 && bilan.locked,
        bilan.ok + ' ok, ' + bilan.bad + ' bad, note ' + bilan.score + (bilan.locked ? '' : ', écran non verrouillé'));
      verifier('le 6.10 : une fois vérifiée, la chaîne ne défile toujours pas',
        vuC.defile === 0 && !vuC.page && vuC.barreCourte === 0, vuC.defile + ' rangée(s) qui défile(nt), ' + vuC.barreCourte + ' barre(s) trop courte(s)');
      verifier('la récurrence en fractions ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies. L'ÉTIQUETTE Cf′ SE POSE À CÔTÉ DE LA COURBE ===== */
    /* Signalé par Turquet (septembre 2026) sur le 2.8 : « le nom de la courbe
       Cf′ doit toujours être à côté de la courbe et pas sur la courbe ». La
       page choisit la place en échantillonnant sa propre courbe ; le banc
       jsdom relit le SVG écrit et refait l'arithmétique. Ce que jsdom ne
       peut PAS voir, c'est la boîte que la POLICE donne à l'étiquette —
       Fredoka 14 px en Terminale, Nunito 800 italique 15 px en Seconde,
       l'indice 10 px posé 3 px plus bas — et le chemin tel que Chromium le
       trace : la boîte est mesurée ici par getBBox, la courbe par
       getPointAtLength, sur chacun des exercices ouverts pour de vrai, puis
       sur quarante dessins de plus faits dans le même hôte par la fonction
       même de la page. Trois bords : jamais SUR la courbe (≥ 3 px), jamais
       LOIN (≤ 22 px), et une boîte non nulle — un CSS perdu rendrait
       l'étiquette invisible sans qu'une erreur ne se lève.
       LA MESURE NE CONNAÎT PLUS AUCUN MOTEUR : elle prend toutes les
       étiquettes du dessin (« Cf », et « Cg » en Seconde) contre toutes ses
       courbes, et l'hôte est le parent du premier SVG de courbe affiché. Seul
       le redessin des quarante dessins diffère, et le profil le nomme
       (« moteur ») — c'est le même contrôle pour les deux niveaux, ce que la
       demande « même chose en seconde » voulait dire (Turquet, septembre
       2026). */
    titre('6 tricies. L\'ÉTIQUETTE DE COURBE SE POSE À CÔTÉ DE LA COURBE (BOÎTE RENDUE)');
    if(!P.etiquetteCourbe){
      ignorer('l\'étiquette rendue reste à côté de sa courbe, jamais dessus',
        'ce niveau n\'a aucun dessin de courbe à étiquette');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1280, height: 1000 } });
      await connecter(s.page);
      for(const id of P.etiquetteCourbe.exercices){
        await s.page.evaluate(id => openTest(id), id);
        await s.page.waitForTimeout(400);
        await s.page.click('#modeChoices [onclick*="train"]');
        await s.page.waitForTimeout(700);
        const r = await s.page.evaluate(moteur => {
          /* LA MESURE EST LA MÊME POUR LES DEUX MOTEURS : toutes les étiquettes
             du dessin (« Cf » et, en Seconde, « Cg ») contre toutes ses courbes
             (la spline, et la droite ou la seconde spline). Une étiquette libre
             de SA courbe peut tomber sur l'autre. */
          const mesure = function(svg){
            const ts = svg.querySelectorAll('.lv-cf, .eqg-cg');
            const cs = svg.querySelectorAll('.lv-curve, .eqg-g');
            if(!ts.length || !cs.length) return [{ err: 'pas d\'étiquette ou pas de courbe' }];
            const vb = svg.viewBox.baseVal;
            const out = [];
            ts.forEach(function(t){
              const bb = t.getBBox();
              if(!(bb.width > 8 && bb.height > 8)){ out.push({ err: 'boîte de l\'étiquette nulle (' + bb.width.toFixed(0) + '×' + bb.height.toFixed(0) + ')' }); return; }
              const B = { l: bb.x, r: bb.x + bb.width, t: bb.y, b: bb.y + bb.height };
              let dm = Infinity;
              cs.forEach(function(path){
                const L = path.getTotalLength();
                for(let u = 0; u <= L; u += 1){ const q = path.getPointAtLength(u);
                  const dx = Math.max(B.l - q.x, 0, q.x - B.r), dy = Math.max(B.t - q.y, 0, q.y - B.b); dm = Math.min(dm, Math.hypot(dx, dy)); }
              });
              const dedans = B.l >= vb.x && B.r <= vb.x + vb.width && B.t >= vb.y && B.b <= vb.y + vb.height;
              const nom = t.textContent.replace(/\s+/g, '');
              if(dm < 3) out.push({ err: nom + ' : SUR la courbe (' + dm.toFixed(1) + ' px)' });
              else if(dm > 22) out.push({ err: nom + ' : loin de la courbe (' + dm.toFixed(1) + ' px)' });
              else if(!dedans) out.push({ err: nom + ' : hors du dessin' });
              else out.push({ d: dm });
            });
            return out;
          };
          const ecran = [];
          document.querySelectorAll('.screen.on svg.lv-svg').forEach(function(svg){ ecran.push.apply(ecran, mesure(svg)); });
          /* puis quarante courbes de plus, dessinées dans le MÊME hôte par la
             fonction même de la page : l'exercice ouvert n'en montre qu'une ou
             deux, et c'est le TIRAGE qui doit tenir, pas ce tirage-là */
          const hote = document.querySelector('.screen.on svg.lv-svg');
          const host = hote ? hote.parentElement : null;
          const tirage = [];
          if(host){
            for(let i = 0; i < 40; i++){
              if(moteur === 'lv'){
                host.innerHTML = (i % 2) ? lvGraphSVG(lvGenPts(i % 3 ? 2 : 3).pts) : adrSVG({ pts: adrGenPts() });
              } else {
                const roots = (i % 2) ? [[-2, -1, 0, 1, 2][i % 5]] : [-2, [0, 1, 2][i % 3]];
                host.innerHTML = afGraphSVG(afpCourbeDer(roots, (i % 4 < 2) ? 1 : -1), i % 3 !== 0);
              }
              tirage.push.apply(tirage, mesure(host.querySelector('svg')));
            }
          }
          return { ecran: ecran, tirage: tirage };
        }, P.etiquetteCourbe.moteur || 'af');
        const fautesE = r.ecran.filter(m => m.err).map(m => m.err), fautesT = r.tirage.filter(m => m.err).map(m => m.err);
        verifier(id + ' : l\'étiquette rendue de l\'exercice ouvert est à côté de sa courbe (' + r.ecran.length + ' étiquette(s))',
          r.ecran.length >= 1 && fautesE.length === 0, fautesE.slice(0, 2).join(' ; '));
        verifier(id + ' : sur 40 dessins de plus, l\'étiquette rendue reste à côté (≥ 3 px, ≤ 22 px), boîte non nulle',
          r.tirage.length >= 40 && fautesT.length === 0, fautesT.length + ' défaut(s) : ' + fautesT.slice(0, 2).join(' ; '));
      }
      verifier('l\'étiquette de courbe : aucune erreur JavaScript', s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies ter. LE 4.6 : LE TABLEAU RENDU, LES FLÈCHES ET LE BOUTON ∞ ===== */
    /* L'étude menée au TVI réutilise le tableau du 5.3 (ids ef-*) : jsdom lit
       les classes, seul un navigateur voit les flèches DESSINÉES à une taille
       lisible et une page qui déborde. Et le bouton ∞ se juge à la doctrine du
       bouton mort : on le CLIQUE pour de vrai — il doit écrire ∞ dans la case
       ET lever l'événement input, sans quoi la correction en direct du soutien
       ne verrait jamais la frappe. */
    titre('6 vicies ter. LE 4.6 : LE TABLEAU RENDU, LES FLÈCHES ET LE BOUTON ∞');
    if(!P.alphaSigne){
      ignorer('le 4.6 : le tableau du 5.3 se dessine, la page ne déborde pas',
        'ce niveau n\'a pas l\'étude menée au TVI');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1280, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.alphaSigne.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(700);
      /* la question est ÉPINGLÉE sur la fiche même (a = 1, b = 2) */
      await s.page.evaluate(() => { test.questions = [{ a: 1, b: 2 }, { a: -1, b: 3 }]; test.idx = 0; test.score = 0; test.answers = []; renderASG(); });
      await s.page.waitForTimeout(400);
      /* le bouton ∞, cliqué pour de vrai */
      await s.page.evaluate(() => { window.__asgInput = 0; document.getElementById('asg-lb').addEventListener('input', () => { window.__asgInput++; }); });
      await s.page.click('#asg-lb + button.lg-inf');
      await s.page.waitForTimeout(150);
      /* la case est un champ MathLive depuis que le clavier du 3.5 la sert :
         on lit par la porte du JUGE (limLire), jamais le LaTeX brut */
      const inf = await s.page.evaluate(() => ({ v: limLire('asg-lb'), ev: window.__asgInput }));
      verifier('le 4.6 : le bouton ∞ écrit dans la case et lève input',
        inf.v.indexOf('∞') >= 0 && inf.ev === 1,
        'valeur ' + JSON.stringify(inf.v) + ', ' + inf.ev + ' événement(s) input');
      /* le b) est présenté comme au 2.1 : des cases MathLive. La première
         (u =) est TAPÉE pour de vrai — jsdom n'a pas la sérialisation réelle
         que le juge doit lire — puis relue par dexpCellValue. */
      await s.page.click('#asg-bu');
      await s.page.waitForTimeout(400);   /* le piège documenté du 6.8 : les premières frappes tombent dans le vide si la case n'a pas fini de prendre le focus */
      await s.page.evaluate(() => document.getElementById('asg-bu').focus());
      await s.page.waitForTimeout(300);
      await s.page.keyboard.type('x+2', { delay: 60 });
      await s.page.waitForTimeout(300);
      const tape = await s.page.evaluate(() => dexpCellValue('asg-bu'));
      verifier('le 4.6 : « x+2 » tapé dans la case u se relit tel quel',
        tape === 'x+2', 'lu : ' + JSON.stringify(tape));
      /* la copie de la fiche, remplie depuis l'attendu de la page, puis le CLIC */
      await s.page.evaluate(() => {
        const q = test.questions[0];
        const sol = asgDerVerdicts(q).sol;   /* u déjà posé en polynôme : l'ordre 1, le canonique */
        asgCases(q).forEach(x => { const el = document.getElementById(x.id); if (!el) return;
          if (el.tagName === 'MATH-FIELD') el.setValue(asgML(x.type === 'der' ? sol[x.id] : String(asgVal(q, x))));
          else el.value = String(asgVal(q, x)); });
        efArrowChange();   /* poser une valeur par script ne lève pas onchange */
      });
      await s.page.click('#asgActions .btn-primary');
      await s.page.waitForTimeout(400);
      const vu = await s.page.evaluate(() => {
        const oks = document.querySelectorAll('#asgForm .ok').length, bads = document.querySelectorAll('#asgForm .bad').length;
        const ov = document.getElementById('ef-var-ov');
        const fleches = ov ? [...ov.querySelectorAll('path,line,polygon')].filter(e => { try { const r = e.getBBox(); return r.width > 4 || r.height > 4; } catch (err) { return false; } }).length : 0;
        const ovr = ov ? ov.getBoundingClientRect() : { width: 0, height: 0 };
        const page = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        return { oks, bads, score: test.score, locked: test.locked, fleches, ovW: Math.round(ovr.width), ovH: Math.round(ovr.height), page };
      });
      verifier('le 4.6 : la copie de la fiche remplie vaut le point — 44 cases au vert',
        vu.oks === 44 && vu.bads === 0 && vu.score === 1 && vu.locked,
        vu.oks + ' ok, ' + vu.bads + ' bad, note ' + vu.score + (vu.locked ? '' : ', écran non verrouillé'));
      verifier('le 4.6 : les flèches du tableau sont DESSINÉES à une taille lisible',
        vu.fleches >= 2 && vu.ovW > 200 && vu.ovH > 60,
        vu.fleches + ' flèche(s) dessinée(s), bande ' + vu.ovW + '×' + vu.ovH + ' px');
      verifier('le 4.6 : la page ne déborde pas',
        !vu.page, 'la page défile horizontalement');
      verifier('l\'étude menée au TVI ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies octies. LA SYNTHÈSE DES POURCENTAGES RÉDIGÉE =====
       Le 2.5.2 : le 2.5.1 posé sur le moteur rédigé du 2.2.10. Deux choses ne
       se voient QUE dans un vrai navigateur, et elles portent l'exercice.
       · LA SÉRIALISATION RÉELLE DE MATHLIVE. La voie que Turquet a nommée —
         « une simplification de fraction pour trouver un % suffit » — passe
         par une FRACTION tapée au clavier, que la page relit par toPlain
         avant de la donner à son juge. Une barre de fraction qui ressortirait
         autrement, et le juge s'ABSTIENDRAIT : le modèle déciderait seul,
         sans que rien ne rougisse. jsdom n'a pas MathLive : il pose des
         chaînes qu'il a écrites lui-même, donc il ne mesure pas cela.
       · LE JUGE DE LA PAGE PRIME. Le double du banc répond toujours
         « correct:false » : une copie juste doit valoir son point quand même,
         et c'est la phrase du juge qui s'affiche, jamais la prose du modèle.
       On tape donc pour de vrai les deux voies — le quotient sur « prendre
       P % », le coefficient puis l'addition sur une hausse — et on relit le
       verdict, la note et la couleur des lignes. */
    titre('6 vicies octies. LA SYNTHÈSE DES POURCENTAGES RÉDIGÉE : LA FEUILLE LUE PAR LE JUGE');
    if(!P.syntheseRedigee){
      ignorer('la fraction tapée est lue par le juge, et le juge prime sur le modèle',
        'ce niveau n\'a pas la synthèse des pourcentages rédigée');
      ignorer('la voie du coefficient puis de l\'addition vaut aussi son point',
        'ce niveau n\'a pas la synthèse des pourcentages rédigée');
    } else if(!ml){
      ignorer('la fraction tapée est lue par le juge, et le juge prime sur le modèle', 'MathLive absent');
      ignorer('la voie du coefficient puis de l\'addition vaut aussi son point', 'MathLive absent');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.syntheseRedigee.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1300);

      /* ÉTAPE 1 : « prendre P % », retrouver le pourcentage — le QUOTIENT.
         La question est un VRAI tirage (genSyn), pas une question inventée :
         une copie qui ne collerait pas à la question tirée serait refusée à
         bon droit, et le banc mesurerait autre chose. On cherche seulement un
         résultat ENTIER, pour que le banc tape ce qu'un élève tape. */
      const q1 = await s.page.evaluate(() => {
        let q = null;
        for(let i = 0; i < 400; i++){ const c = genSyn('pct', 'pct'); if(Number.isInteger(c.result)){ q = c; break; } }
        if(!q) return { manque: 'aucun tirage « prendre P % » à résultat entier en 400 essais' };
        test.questions[test.idx] = q; test.locked = false; renderSal();
        return { N: q.N, P: q.P, res: q.result, bon: q.bon };
      });
      await s.page.waitForTimeout(800);
      let dits1 = [];
      if(q1.manque){ dits1.push(q1.manque); }
      else {
        await s.page.click('#salc' + q1.bon);
        await s.page.waitForTimeout(150);
        await s.page.evaluate(() => { const m = salFeuille.lignes[0].mf; m.focus();
          try{ m.executeCommand('moveToMathfieldEnd'); }catch(e){} });
        await s.page.waitForTimeout(150);
        /* L'ESPACE SORT DE LA FRACTION — la convention de MathLive, déjà payée
           sur la feuille du 4.5 : sans elle, tout ce qui suit tombe dans le
           dénominateur et le banc écrit du charabia en accusant la page. */
        await s.page.keyboard.type(q1.res + '/' + q1.N + ' =' + q1.P + '/100 ', { delay: 40 });
        await s.page.waitForTimeout(350);
        const lu = await s.page.evaluate(() => {
          const t = salFeuille.lire();
          return { texte: t, lisible: !!salExpr(String(t).split('=')[0] || '') };
        });
        if(!lu.lisible) dits1.push('la fraction tapée ressort illisible pour le juge : « ' + lu.texte + ' »');
        await s.page.click('#salActions .btn-primary');
        await s.page.waitForTimeout(1200);
        const v1 = await s.page.evaluate(() => {
          const fb = document.getElementById('salFeedback');
          const l0 = salFeuille.lignes[0].mf;
          return { classe: fb ? fb.className : '', texte: fb ? String(fb.textContent || '') : '',
                   score: test.score, ligne: l0 ? l0.className : '' };
        });
        if(v1.classe.indexOf('good') < 0)
          dits1.push('le quotient tapé n\'est pas accepté : « ' + v1.texte.slice(0, 120) + ' »');
        if(v1.score !== 1) dits1.push('la note ne compte pas la question : score ' + v1.score);
        if(/Réponse de contrôle/.test(v1.texte))
          dits1.push('c\'est la prose du modèle qui s\'affiche, alors qu\'il conteste le verdict de la page');
        if(v1.ligne.indexOf('ok') < 0)
          dits1.push('la ligne juste ne se peint pas en bleu : classes « ' + v1.ligne + ' »');
      }
      verifier('la fraction tapée est lue par le juge, et le juge prime sur le modèle',
        dits1.length === 0, dits1.slice(0, 3).join(' | '));

      /* ÉTAPE 2 : une HAUSSE — le coefficient, puis l'addition sur deux lignes. */
      let dits2 = [];
      const q2 = await s.page.evaluate(() => {
        const q = genSyn('aug', 'fin');
        test.questions[test.idx] = q; test.locked = false; test.salBusy = false; renderSal();
        q.choisi = q.bon;
        const c = salCouple(q);
        return { bon: q.bon, N: c.N, pDec: c.pDecStr, aug: c.augStr, fin: c.finStr };
      });
      await s.page.waitForTimeout(800);
      await s.page.click('#salc' + q2.bon);
      await s.page.waitForTimeout(150);
      await s.page.evaluate(() => { const m = salFeuille.lignes[0].mf; m.focus();
        try{ m.executeCommand('moveToMathfieldEnd'); }catch(e){} });
      await s.page.waitForTimeout(150);
      await s.page.keyboard.type(q2.pDec + '*' + q2.N + '=' + q2.aug, { delay: 30 });
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(350);
      await s.page.keyboard.type(q2.N + '+' + q2.aug + '=' + q2.fin, { delay: 30 });
      await s.page.waitForTimeout(300);
      const lu2 = await s.page.evaluate(() => salFeuille.lire());
      if(String(lu2).split('\n').filter(function(l){ return l.trim() !== ''; }).length < 2)
        dits2.push('Entrée n\'a pas ajouté de seconde ligne : « ' + String(lu2).replace(/\n/g, ' ⏎ ') + ' »');
      await s.page.click('#salActions .btn-primary');
      await s.page.waitForTimeout(1200);
      const v2 = await s.page.evaluate(() => {
        const fb = document.getElementById('salFeedback');
        return { classe: fb ? fb.className : '', texte: fb ? String(fb.textContent || '') : '', score: test.score };
      });
      if(v2.classe.indexOf('good') < 0)
        dits2.push('la voie du coefficient puis de l\'addition n\'est pas acceptée : « ' + v2.texte.slice(0, 120) + ' »');
      verifier('la voie du coefficient puis de l\'addition vaut aussi son point',
        dits2.length === 0, dits2.slice(0, 3).join(' | '));
      verifier('l\'écran de la synthèse rédigée ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 terdecies. {croiser-denominateurs} : le croisement se VOIT ===== */
    /* L'exercice ne dit pas seulement « multiplie par le dénominateur de
       l'autre » — il le MONTRE : chaque dénominateur est coloré, les cases qui
       prendront sa valeur portent son liseré, et deux flèches partent de l'un
       pour arriver sur l'autre en se CROISANT. Ce croisement est toute l'idée.
       Rien de tout cela ne se lit dans le code : la couleur d'un liseré vient
       d'une feuille de styles, et une flèche est un chemin posé sur des
       positions MESURÉES après le rendu. Un banc hors navigateur n'a ni l'une
       ni l'autre.
       Quatre bords, et le premier est le plus sournois : si un liseré prenait
       la couleur de SA PROPRE fraction, le dessin dirait exactement l'inverse
       de la règle — et l'élève apprendrait le contraire de ce qu'on enseigne,
       sans que rien ne rougisse. */
    titre('6 terdecies. CROISER LES DÉNOMINATEURS : LE CROISEMENT SE VOIT');
    if(!P.croisement){
      ignorer('les flèches se croisent, et les couleurs disent le croisement',
        'ce niveau n\'a pas l\'exercice du croisement');
    } else if(!ml){
      ignorer('les flèches se croisent, et les couleurs disent le croisement', 'MathLive absent');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.croisement.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1600);
      const c = await s.page.evaluate(() => {
        const hote = document.getElementById('sfHost');
        if(!hote) return { manque: 'l\'écran n\'a pas de sfHost' };
        const R = hote.getBoundingClientRect();
        const rangee = hote.querySelector('.pt-row');
        if(!rangee) return { manque: 'la ligne de calcul est absente' };
        const coul = e => getComputedStyle(e).color;
        const blocs = [...rangee.querySelectorAll('.sf-prod')];
        if(blocs.length < 2) return { manque: 'moins de deux fractions à croiser' };
        const srcL = b => { const l = b.querySelectorAll('.sf-l');
          return l.length > 1 ? l[1].querySelector('.f-whole') : null; };
        if(!srcL(blocs[0]) || !srcL(blocs[1])) return { manque: 'les dénominateurs de la ligne sont introuvables' };
        const src = blocs.map(b => ({ t: srcL(b).textContent.trim(), c: coul(srcL(b)) }));
        /* le liseré d'une case : la couleur du box-shadow */
        const lis = b => [...b.querySelectorAll('.sf-case')]
          .map(x => (getComputedStyle(x).boxShadow.match(/rgba?\([^)]*\)/) || [''])[0]);
        const arcs = [...hote.querySelectorAll('[data-crd-arc]')].map(p => {
          const d = (p.getAttribute('d') || '').match(/M ([\d.]+) ([\d.]+) Q [\d.]+ [\d.]+ ([\d.]+) ([\d.]+)/);
          return d ? { x0: +d[1], x1: +d[3] } : null;
        }).filter(Boolean);
        const cx = e => { const r = e.getBoundingClientRect(); return (r.left + r.right) / 2 - R.left; };
        return { src: src, lis1: lis(blocs[0]), lis2: lis(blocs[1]), arcs: arcs,
                 xs: [cx(srcL(blocs[0])), cx(srcL(blocs[1]))], xb: [cx(blocs[0]), cx(blocs[1])],
                 consigne: (hote.querySelector('.pt-lab') || {}).textContent || '' };
      });
      const dits = [];
      if(c.manque) dits.push(c.manque);
      else {
        /* 1. chaque case porte le liseré de L'AUTRE dénominateur */
        const a = c.src[0].c, b = c.src[1].c;
        if(a === b) dits.push('les deux dénominateurs ont la même couleur : le croisement ne se voit pas');
        if(!c.lis1.length || !c.lis1.every(x => x === b))
          dits.push('les cases de la 1re fraction ne portent pas la couleur du 2e dénominateur');
        if(!c.lis2.length || !c.lis2.every(x => x === a))
          dits.push('les cases de la 2de fraction ne portent pas la couleur du 1er dénominateur');
        /* 2. deux flèches, et elles se croisent : l'une part à droite, l'autre
              à gauche, et leurs trajets se recouvrent. */
        if(c.arcs.length !== 2) dits.push(c.arcs.length + ' flèche(s) au lieu de 2');
        else {
          const [f, g] = c.arcs;
          const versDroite = f.x1 > f.x0, versGauche = g.x1 < g.x0;
          const recouvre = Math.min(f.x1, Math.max(g.x0, g.x1)) > Math.max(f.x0, Math.min(g.x0, g.x1));
          if(!(versDroite && versGauche && recouvre))
            dits.push('les deux flèches ne se croisent pas : ' + JSON.stringify(c.arcs));
          /* et chacune part d'un dénominateur pour arriver sur l'AUTRE bloc */
          const pres = (u, v) => Math.abs(u - v) < 40;
          if(!pres(f.x0, c.xs[0]) || !pres(f.x1, c.xb[1]))
            dits.push('la 1re flèche ne va pas du 1er dénominateur vers la 2de fraction');
          if(!pres(g.x0, c.xs[1]) || !pres(g.x1, c.xb[0]))
            dits.push('la 2de flèche ne va pas du 2d dénominateur vers la 1re fraction');
        }
        /* 3. et la consigne le dit EN TOUTES LETTRES : la couleur ne porte
              jamais seule — un écran mal réglé, ou un élève qui distingue mal
              les couleurs, doit pouvoir faire l'exercice quand même. */
        if(!/dénominateur de l’AUTRE|dénominateur de l'AUTRE/.test(c.consigne))
          dits.push('la consigne ne dit pas le croisement en toutes lettres : « ' + c.consigne.slice(0, 60) + ' »');
      }
      verifier('les flèches se croisent, et les couleurs disent le croisement',
        dits.length === 0, dits.slice(0, 2).join(' | '));
      verifier('l\'écran du croisement ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 sexdecies. SIMPLIFIER EN COLORIANT : LA MÊME LONGUEUR =====
       Tout l'exercice tient dans une chose qu'aucun banc hors navigateur ne
       peut voir : les deux barres VONT EXACTEMENT AUSSI LOIN. Si l'une était
       dessinée plus courte que l'autre, ou si elles ne partaient pas du même
       bord, ou si le remplissage ne suivait pas la fraction, le dessin dirait
       l'inverse de ce qu'on enseigne — et rien ne rougirait nulle part, la
       correction, elle, comparant des nombres.
       Il tient aussi le défaut trouvé le jour même en ouvrant la page à la
       taille d'un ordinateur portable : les deux dessins doivent tenir tout
       entiers à l'écran, et une part rester assez large pour être cliquée. */
    titre('6 sexdecies. SIMPLIFIER EN COLORIANT : LES DEUX BARRES VONT AUSSI LOIN');
    if(!P.barresSimplifier){
      ignorer('les deux barres vont exactement aussi loin',
        'ce niveau n\'a pas l\'exercice des deux barres');
    } else {
      /* L'écran d'un ordinateur portable ordinaire, et non le grand format des
         autres contrôles : c'est cette taille-là qui a montré le défaut. */
      s = await ouvrir(chromium, ml, { viewport: { width: 1366, height: 768 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.barresSimplifier.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(1200);

      const dits = [];
      /* 1. LES DEUX DESSINS SONT ENTIERS À L'ÉCRAN, et une part se clique. */
      const pli = await s.page.evaluate(() => {
        const L = document.getElementById('smpBarL'), R = document.getElementById('smpBarR');
        if(!L || !R) return { manque: 'les barres sont absentes' };
        const a = L.getBoundingClientRect(), b = R.getBoundingClientRect();
        const segs = [...L.querySelectorAll('.smp-seg')];
        return { bas: Math.round(Math.max(a.bottom, b.bottom)), fenetre: window.innerHeight,
                 lSeg: segs.length ? Math.round(segs[0].getBoundingClientRect().width * 10) / 10 : 0,
                 parts: segs.length };
      });
      if(pli.manque) dits.push(pli.manque);
      else {
        if(pli.bas > pli.fenetre)
          dits.push('le bas d\'une barre tombe sous le pli : ' + pli.bas
            + 'px pour une fenêtre de ' + pli.fenetre + 'px');
        /* La largeur d'une part et la borne du tirage vont ENSEMBLE : élargir
           le tirage sans élargir la barre rendrait les parts introuvables. */
        if(pli.lSeg < 20)
          dits.push('une part ne fait que ' + pli.lSeg + 'px de large (' + pli.parts + ' parts)');
      }

      /* 2. LES DEUX BARRES ONT LA MÊME LONGUEUR, PARTENT DU MÊME BORD, et une
            fois la bonne réponse donnée, sont COLORIÉES SUR LA MÊME LONGUEUR.
            C'est l'exercice tout entier. */
      const vu = await s.page.evaluate(() => {
        const q = test.questions[test.idx];
        smpClicL(q.a); smpClicR(q.n);
        const L = document.getElementById('smpBarL'), R = document.getElementById('smpBarR');
        const plein = c => { const on = [...c.querySelectorAll('.smp-seg.on')];
          if(!on.length) return 0;
          const r = c.getBoundingClientRect();
          return Math.round((Math.max(...on.map(e => e.getBoundingClientRect().right)) - r.left) * 10) / 10; };
        const a = L.getBoundingClientRect(), b = R.getBoundingClientRect();
        return { lG: Math.round(a.width), lD: Math.round(b.width),
                 xG: Math.round(a.left), xD: Math.round(b.left),
                 remplG: plein(L), remplD: plein(R),
                 partsG: L.querySelectorAll('.smp-seg').length,
                 partsD: R.querySelectorAll('.smp-seg').length,
                 q: q.a + '/' + q.b + ' = ' + q.n + '/' + q.d,
                 sousG: (document.getElementById('smpValL') || {}).textContent.replace(/\s/g, ''),
                 sousD: (document.getElementById('smpValR') || {}).textContent.replace(/\s/g, '') };
      });
      if(vu.lG !== vu.lD)
        dits.push('les deux barres n\'ont pas la même longueur : ' + vu.lG + 'px contre ' + vu.lD + 'px');
      /* Le bord le plus sournois : deux barres de même longueur mais décalées
         l\'une par rapport à l\'autre ne se comparent plus du tout, et rien
         d\'autre ne le dirait. C\'est l\'étiquette à largeur fixe qui le tient. */
      if(vu.xG !== vu.xD)
        dits.push('les deux barres ne commencent pas au même endroit : ' + vu.xG + 'px contre ' + vu.xD + 'px');
      if(vu.partsG === vu.partsD)
        dits.push('les deux barres sont partagées pareil (' + vu.partsG + ') : il n\'y a rien à simplifier');
      /* Le bord qui compte : la longueur COLORIÉE, pas le nombre de parts. */
      if(Math.abs(vu.remplG - vu.remplD) > 2)
        dits.push('sur ' + vu.q + ' les deux coloriages ne vont pas aussi loin : '
          + vu.remplG + 'px contre ' + vu.remplD + 'px');
      if(!vu.remplG || !vu.remplD)
        dits.push('une barre reste vide après le clic : ' + vu.remplG + ' / ' + vu.remplD);
      /* et l'élève LIT à côté de chaque barre ce qu'il vient de colorier */
      const att = vu.q.split(' = ');
      if(vu.sousG !== att[0]) dits.push('à côté de la 1re barre on lit « ' + vu.sousG + ' » au lieu de ' + att[0]);
      if(vu.sousD !== att[1]) dits.push('à côté de la 2de barre on lit « ' + vu.sousD + ' » au lieu de ' + att[1]);

      verifier('les deux barres vont exactement aussi loin',
        dits.length === 0, dits.slice(0, 3).join(' | '));
      verifier('l\'écran des deux barres ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 septdecies. construire une fonction : la grille se CLIQUE ===== */
    /* jsdom n'a pas de mise en page : un rectangle de SVG y vaut zéro, et le
       calcul clic → nœud (la seule porte de l'exercice) est invisible à tout
       banc hors navigateur. On clique donc pour de vrai : chaque colonne à
       la hauteur du témoin, le retrait d'un point, la vérification 5/5, puis
       une copie fausse pour voir le témoin vert. */
    titre('6 septdecies. CONSTRUIRE UNE FONCTION : LA GRILLE SE CLIQUE');
    if(!P.construireFonction){
      ignorer('la grille se clique : poser, enlever, vérifier',
        'ce niveau n\'a pas l\'exercice de construction');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1366, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.construireFonction.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* mouse.click ne fait pas défiler : la rangée du bas (y = −4) tombait
         hors de la fenêtre et le clic se perdait sans erreur — on centre la
         grille d'abord, et on relit le rectangle à CHAQUE clic */
      const clicNoeud = async (x, y) => {
        const pos = await s.page.evaluate(([x, y]) => {
          const svg = document.getElementById('cfxGrille');
          svg.scrollIntoView({ block: 'center' });
          const r = svg.getBoundingClientRect();
          return { px: r.left + cfxSx(x) * r.width / 620, py: r.top + cfxSy(y) * r.height / 430 };
        }, [x, y]);
        await s.page.mouse.click(pos.px, pos.py);
      };
      const q0 = await s.page.evaluate(() => JSON.parse(JSON.stringify(test.questions[test.idx])));
      for(let i = 0; i < 11; i++) await clicNoeud(-5 + i, q0.w[i]);
      const pose = await s.page.evaluate(() => ({
        rep: (test.questions[test.idx].rep || []).join(','),
        points: document.querySelectorAll('#cfxGrille .cfx-pt').length,
        courbe: !!document.querySelector('#cfxGrille .cfx-courbe')
      }));
      if(pose.rep !== q0.w.join(','))
        dits.push('les clics ne posent pas les points visés : ' + pose.rep + ' au lieu de ' + q0.w.join(','));
      if(pose.points !== 11) dits.push(pose.points + ' point(s) dessiné(s) au lieu de 11');
      if(!pose.courbe) dits.push('la courbe ne se dessine pas à travers les points posés');
      /* le RETRAIT : recliquer un point l'enlève */
      await clicNoeud(-5, q0.w[0]);
      const ote = await s.page.evaluate(() => ({
        v: String(test.questions[test.idx].rep[0]),
        points: document.querySelectorAll('#cfxGrille .cfx-pt').length
      }));
      if(ote.v !== 'null' || ote.points !== 10)
        dits.push('recliquer un point ne l\'enlève pas (' + ote.v + ', ' + ote.points + ' points)');
      await clicNoeud(-5, q0.w[0]);
      /* la vérification : 5/5, les consignes bleues */
      await s.page.evaluate(() => checkCfxAnswer());
      await s.page.waitForTimeout(200);
      const fin = await s.page.evaluate(() => ({
        score: test.score,
        ok: document.querySelectorAll('#cfxHost .cfx-consigne.ok').length,
        sol: !!document.querySelector('#cfxHost .cfx-sol')
      }));
      if(fin.score !== 5 || fin.ok !== 5) dits.push('le témoin cliqué ne fait pas 5/5 (' + fin.score + ', ' + fin.ok + ' consignes bleues)');
      if(fin.sol) dits.push('la courbe verte s\'affiche sur une copie toute juste');
      /* le tracé suivant, une copie FAUSSE : le témoin vert se montre */
      await s.page.evaluate(() => nextCfxQuestion());
      await s.page.waitForTimeout(400);
      const q1 = await s.page.evaluate(() => JSON.parse(JSON.stringify(test.questions[test.idx])));
      for(let i = 0; i < 11; i++) await clicNoeud(-5 + i, q1.w[i]);
      const casse = (q1.a1 + 5);
      await clicNoeud(q1.a1, q1.w[casse]);                     /* on retire la bonne valeur… */
      await clicNoeud(q1.a1, q1.w[casse] > -4 ? q1.w[casse] - 1 : q1.w[casse] + 1);   /* …et on en pose une fausse */
      await s.page.evaluate(() => checkCfxAnswer());
      await s.page.waitForTimeout(200);
      const faux = await s.page.evaluate(() => ({
        bad: document.querySelectorAll('#cfxHost .cfx-consigne.bad').length,
        sol: !!document.querySelector('#cfxHost .cfx-sol')
      }));
      if(!faux.bad) dits.push('la copie faussée ne rougit aucune consigne');
      if(!faux.sol) dits.push('le témoin vert ne se montre pas sur la copie fausse');
      verifier('la grille se clique : poser, enlever, vérifier', !dits.length, dits.slice(0,3).join(' | '));
      verifier('l\'écran de construction ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies sexies. solutions de f(x) = k : les cibles se CLIQUENT ===== */
    /* {solutions-graphique}, porté du 4.5 de la Terminale : les points de la
       courbe et les abscisses de l'axe se cliquent sur le dessin — ronds et
       carrés à zone de saisie invisible —, et les couleurs du verdict se
       lisent à l'encre RENDUE (bleu juste, rouge en trop, vert oublié). jsdom
       n'a pas de mise en page : le clic et l'encre ne se voient qu'ici. Le
       banc principal, lui, appelle les bascules à la main. */
    titre('6 vicies sexies. SOLUTIONS DE f(x) = k : LES CIBLES SE CLIQUENT');
    if(!P.solutionsGraphique){
      ignorer('les cibles se cliquent sur le dessin, le verdict se lit à l\'encre',
        'ce niveau n\'a pas l\'exercice des solutions sur le graphique');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1366, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.solutionsGraphique.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      const dominante = c => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(c || ''); if(!m) return '?';
        const r = +m[1], v = +m[2], b = +m[3], max = Math.max(r, v, b);
        return b >= max && b > r + 20 ? 'bleu' : (v >= max && v > r + 20 ? 'vert' : (r >= max && r > v + 20 ? 'rouge' : 'autre')); };
      /* la première question à solutions — on l'épingle en tête plutôt que
         de traverser la séance : le tirage mélange les familles */
      const q0 = await s.page.evaluate(() => {
        const i = test.questions.findIndex(q => q.sols.length > 0);
        test.idx = i; renderTVG();
        const q = test.questions[i];
        return { sols: q.sols.slice(), k: q.kL, fam: q.family, idx: i };
      });
      /* le dessin est rendu à une taille lisible, et chaque cible se laisse
         viser au doigt : sa zone de saisie fait au moins 20 px */
      const mes = await s.page.evaluate(() => {
        const svg = document.querySelector('#tvgGraph svg'); if(!svg) return { absent: true };
        svg.scrollIntoView({ block: 'center' });
        const r = svg.getBoundingClientRect();
        const cibles = [...svg.querySelectorAll('.tvg-t')].map(g => g.getBoundingClientRect());
        return { absent: false, largeur: Math.round(r.width), n: cibles.length,
                 petites: cibles.filter(c => c.width < 20 || c.height < 20).length };
      });
      if(mes.absent) dits.push('aucun dessin sur l\'écran');
      else {
        if(mes.largeur < 380) dits.push('le dessin ne fait que ' + mes.largeur + ' px de large');
        if(!mes.n) dits.push('aucune cible cliquable sur le dessin');
        if(mes.petites) dits.push(mes.petites + ' cible(s) de moins de 20 px : introuvables au doigt');
      }
      /* la copie JUSTE, cliquée pour de vrai : chaque solution sur la courbe
         puis sur l'axe, l'écriture tapée, la vérification */
      for(const sol of q0.sols){
        await s.page.click('#tvgp' + (sol + 5));
        await s.page.click('#tvgx' + (sol + 5));
        await s.page.waitForTimeout(80);
      }
      const pose = await s.page.evaluate(() => {
        const q = test.questions[test.idx];
        return { pts: q.selPts.slice().sort((a, b) => a - b).join(','), xs: q.selXs.slice().sort((a, b) => a - b).join(',') };
      });
      const attendu = q0.sols.slice().sort((a, b) => a - b).join(',');
      if(pose.pts !== attendu) dits.push('les clics sur la courbe ne posent pas les cibles visées : ' + pose.pts + ' au lieu de ' + attendu);
      if(pose.xs !== attendu) dits.push('les clics sur l\'axe ne posent pas les cibles visées : ' + pose.xs + ' au lieu de ' + attendu);
      await s.page.fill('#tvgSol', q0.sols.map(v => String(v)).join(' ; '));
      await s.page.click('#tvgValidate');
      await s.page.waitForTimeout(300);
      const fin = await s.page.evaluate(() => {
        const dot = document.querySelector('#tvgGraph .tvg-t.okc .dot');
        const cons = document.getElementById('tvg-ca');
        const inp = document.getElementById('tvgSol');
        const kg = document.getElementById('tvgKgrp');
        const kr = kg ? kg.getBoundingClientRect() : null;
        return { score: test.score,
                 dot: dot ? getComputedStyle(dot).fill : null,
                 cons: cons ? getComputedStyle(cons).borderTopColor : null,
                 inp: inp ? getComputedStyle(inp).borderTopColor : null,
                 droite: !!(kr && kr.width > 100),
                 vertRouge: !!document.querySelector('#tvgGraph .missc, #tvgGraph .badc') };
      });
      if(fin.score !== 3) dits.push('la copie juste cliquée vaut ' + fin.score + ' au lieu de 3');
      if(dominante(fin.dot) !== 'bleu') dits.push('la cible juste n\'est pas peinte en bleu : ' + fin.dot);
      if(dominante(fin.cons) !== 'bleu') dits.push('la ligne a) juste n\'est pas bordée de bleu : ' + fin.cons);
      if(dominante(fin.inp) !== 'bleu') dits.push('l\'écriture juste n\'est pas bordée de bleu : ' + fin.inp);
      if(!fin.droite) dits.push('la droite y = k ne se dessine pas après la vérification');
      if(fin.vertRouge) dits.push('une cible est verte ou rouge sur une copie toute juste');
      /* la question SUIVANTE à solutions, faussée : un point en trop sur la
         courbe (rouge), une abscisse oubliée sur l'axe (verte) */
      /* il faut AU MOINS DEUX solutions pour en oublier une sur l'axe tout en
         gardant une sélection — sur une seule, la vérification refuserait la
         copie (« sélectionne… ») et le banc mesurerait un écran jamais jugé */
      const q1 = await s.page.evaluate(i0 => {
        const i = test.questions.findIndex((q, k) => k !== i0 && q.sols.length >= 2);
        if(i < 0) return null;
        test.idx = i; test.locked = false; renderTVG();
        const q = test.questions[i], f = tvgFn(q);
        /* une cible EN TROP qui se laisse cliquer : loin de l'axe, sans quoi
           le carré de l'axe, dessiné par-dessus, prendrait le clic — un point
           posé sur l'axe n'est jamais une solution (k ≠ 0), personne n'a à
           le viser */
        let trop = null;
        for(let n = -5; n <= 5 && trop === null; n++){
          if(q.sols.indexOf(n) < 0 && Math.abs(f(n)) > 0.6 && document.getElementById('tvgp' + (n + 5))) trop = n;
        }
        return { sols: q.sols.slice(), trop };
      }, q0.idx);
      if(!q1) dits.push('aucune seconde question à deux solutions dans la séance');
      else {
        for(const sol of q1.sols) await s.page.click('#tvgp' + (sol + 5));
        if(q1.trop !== null) await s.page.click('#tvgp' + (q1.trop + 5));
        for(const sol of q1.sols.slice(0, -1)) await s.page.click('#tvgx' + (sol + 5));
        await s.page.fill('#tvgSol', q1.sols.map(v => String(v)).join(' ; '));
        await s.page.click('#tvgValidate');
        await s.page.waitForTimeout(300);
        const faux = await s.page.evaluate(([trop, oublie]) => {
          const rouge = document.querySelector('#tvgp' + (trop + 5) + ' .dot');
          const vert = document.querySelector('#tvgx' + (oublie + 5) + ' .dot');
          const cons = document.getElementById('tvg-cb');
          return { score: test.score,
                   rouge: rouge ? getComputedStyle(rouge).fill : null,
                   vert: vert ? getComputedStyle(vert).stroke : null,
                   cons: cons ? getComputedStyle(cons).borderTopColor : null };
        }, [q1.trop, q1.sols[q1.sols.length - 1]]);
        const attenduF = 3 + (q1.trop === null ? 2 : 1);   /* sans cible en trop disponible, a) reste juste */
        if(faux.score !== attenduF) dits.push('la copie faussée porte le score à ' + faux.score + ' au lieu de ' + attenduF);
        if(q1.trop !== null && dominante(faux.rouge) !== 'rouge') dits.push('le point en trop n\'est pas peint en rouge : ' + faux.rouge);
        if(dominante(faux.vert) !== 'vert') dits.push('l\'abscisse oubliée n\'est pas montrée en vert : ' + faux.vert);
        if(dominante(faux.cons) !== 'rouge') dits.push('la ligne b) fausse n\'est pas bordée de rouge : ' + faux.cons);
      }
      /* la question SANS solution : le bouton ∅ écrit l'ensemble vide, et la
         copie vaut 3/3 sans rien cliquer */
      const q2 = await s.page.evaluate(() => {
        const i = test.questions.findIndex(q => !q.sols.length);
        if(i < 0) return false;
        test.idx = i; test.locked = false; renderTVG(); return true;
      });
      if(!q2) dits.push('aucune question sans solution dans la séance');
      else {
        await s.page.click('#tvgBody .tvg-vide');
        const ecrit = await s.page.evaluate(() => document.getElementById('tvgSol').value);
        if(ecrit !== '∅') dits.push('le bouton ∅ écrit « ' + ecrit + ' »');
        const avant = await s.page.evaluate(() => test.score);
        await s.page.click('#tvgValidate');
        await s.page.waitForTimeout(300);
        const apres = await s.page.evaluate(() => test.score);
        if(apres - avant !== 3) dits.push('∅ sur une équation sans solution vaut ' + (apres - avant) + ' au lieu de 3');
      }
      verifier('les cibles se cliquent sur le dessin, le verdict se lit à l\'encre', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran des solutions sur le graphique ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies quater. ÉCRIRE L'ENSEMBLE DES SOLUTIONS ===============
       {ecrire-solutions} : la réponse se TAPE en entier à côté de « S = ».
       Deux choses ne se voient pas hors d'un vrai navigateur, et ce sont
       exactement les deux que la demande de Turquet nomme :
       · la rangée de touches AU-DESSUS du champ, CLIQUÉE pour de vrai — un
         bouton mort n'écrirait rien sans qu'aucune erreur ne se lève ;
       · le PAVÉ des tablettes, qui doit porter les six mêmes symboles sur une
         SECONDE rangée (data-pave-plus) : jsdom lit l'attribut, seul un
         navigateur voit la touche rendue et le rectangle qu'elle occupe.
       Et la MÉTHODE dessinée à la validation se mesure ici aussi : un CSS
       perdu rendrait les morceaux verts invisibles sans qu'une erreur ne se
       lève, et l'exercice ne montrerait plus rien. */
    titre('6 vicies quater. ÉCRIRE L\'ENSEMBLE DES SOLUTIONS');
    if(!P.ecrireSolutions){
      ignorer('les six touches écrivent dans la case, et la méthode se dessine',
        'ce niveau n\'a pas l\'exercice d\'écriture des solutions');
    } else {
      const T = P.ecrireSolutions.touches;
      const dits = [];
      const dominante = c => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(c || ''); if(!m) return '?';
        const r = +m[1], v = +m[2], b = +m[3], max = Math.max(r, v, b);
        return b >= max && b > r + 20 ? 'bleu' : (v >= max && v > r + 20 ? 'vert' : (r >= max && r > v + 20 ? 'rouge' : 'autre')); };
      s = await ouvrir(chromium, ml, { viewport: { width: 1366, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.ecrireSolutions.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      /* on épingle une inéquation dont S est une RÉUNION : c'est elle qui
         demande le U, les quatre crochets et deux morceaux de courbe */
      const q0 = await s.page.evaluate(() => {
        const i = test.questions.findIndex(q => q.rel !== '=' && ecsAns(q).its.length >= 2);
        if(i < 0) return null;
        test.idx = i; test.locked = false; renderECS();
        return { att: ecsEcrire(ecsAns(test.questions[i])), rel: test.questions[i].rel };
      });
      if(!q0) dits.push('aucune inéquation à deux intervalles dans la séance');
      else {
        /* le dessin est rendu à une taille lisible */
        const mes = await s.page.evaluate(() => {
          const svg = document.querySelector('#ecsGraph svg'); if(!svg) return { absent: true };
          svg.scrollIntoView({ block: 'center' });
          const r = svg.getBoundingClientRect();
          const bt = [...document.querySelectorAll('.ecs-jetons .ecs-jt')].map(b => {
            const q = b.getBoundingClientRect();
            return { t: b.getAttribute('data-t'), w: Math.round(q.width), h: Math.round(q.height) };
          });
          const inp = document.getElementById('ecsSol').getBoundingClientRect();
          return { absent: false, largeur: Math.round(r.width), bt,
                   champ: { w: Math.round(inp.width), h: Math.round(inp.height) },
                   methode: !!document.querySelector('#ecsGraph .ecs-k') };
        });
        if(mes.absent) dits.push('aucun dessin sur l\'écran');
        else {
          if(mes.largeur < 500) dits.push('le dessin ne fait que ' + mes.largeur + ' px de large');
          if(mes.methode) dits.push('la droite y = k est tracée AVANT la vérification');
          if(mes.bt.map(b => b.t).join(' ') !== T.join(' ')) dits.push('la rangée au-dessus du champ porte [' + mes.bt.map(b => b.t).join(' ') + ']');
          const petites = mes.bt.filter(b => b.w < 36 || b.h < 34);
          if(petites.length) dits.push(petites.length + ' touche(s) de moins de 36 px : introuvables au doigt');
          if(mes.champ.w < 200) dits.push('la case de réponse ne fait que ' + mes.champ.w + ' px');
        }
        /* LES BOUTONS, CLIQUÉS POUR DE VRAI : chacun écrit son symbole */
        await s.page.evaluate(() => { document.getElementById('ecsSol').value = ''; });
        for(const t of T) await s.page.click('.ecs-jetons .ecs-jt[data-t="' + t + '"]');
        const ecrit = await s.page.evaluate(() => document.getElementById('ecsSol').value);
        if(ecrit !== T.join('')) dits.push('les boutons au-dessus du champ écrivent « ' + ecrit +' » au lieu de « ' + T.join('') + ' »');
        /* la copie JUSTE, tapée : la case bleuit et la méthode se dessine */
        await s.page.fill('#ecsSol', q0.att);
        await s.page.click('#ecsValidate');
        await s.page.waitForTimeout(300);
        const fin = await s.page.evaluate(() => {
          const inp = document.getElementById('ecsSol');
          const k = document.querySelector('#ecsGraph .ecs-k');
          const parts = [...document.querySelectorAll('#ecsGraph .ecs-part')].map(p => p.getBoundingClientRect());
          const cros = [...document.querySelectorAll('#ecsGraph .ecs-cro')].map(p => p.getBoundingClientRect());
          const ax = [...document.querySelectorAll('#ecsGraph .ecs-ax')].map(p => p.getBoundingClientRect());
          return { score: test.score, inp: getComputedStyle(inp).borderTopColor,
                   droite: k ? Math.round(k.getBoundingClientRect().width) : 0,
                   parts: parts.length, partsVides: parts.filter(r => r.width < 4).length,
                   partCouleur: parts.length ? getComputedStyle(document.querySelector('#ecsGraph .ecs-part')).stroke : null,
                   cros: cros.length, crosVides: cros.filter(r => r.width < 3 || r.height < 8).length,
                   ax: ax.length, axVides: ax.filter(r => r.width < 4).length,
                   cor: !!document.querySelector('.ecs-solzone .mf-cor') };
        });
        if(fin.score !== 1) dits.push('la copie juste tapée vaut ' + fin.score + ' au lieu de 1');
        if(dominante(fin.inp) !== 'bleu') dits.push('l\'écriture juste n\'est pas bordée de bleu : ' + fin.inp);
        if(fin.droite < 300) dits.push('la droite y = k ne se dessine pas après la vérification (' + fin.droite + ' px)');
        if(fin.parts !== 2) dits.push(fin.parts + ' morceau(x) de courbe tracé(s) au lieu de 2');
        if(fin.partsVides) dits.push(fin.partsVides + ' morceau(x) de courbe d\'étendue nulle');
        if(dominante(fin.partCouleur) !== 'vert') dits.push('les morceaux de la solution ne sont pas verts : ' + fin.partCouleur);
        if(fin.cros !== 4) dits.push(fin.cros + ' crochet(s) sur l\'axe au lieu de 4');
        if(fin.crosVides) dits.push(fin.crosVides + ' crochet(s) d\'étendue nulle : le dessin ne dit plus la notation');
        if(fin.ax !== 2 || fin.axVides) dits.push('l\'ensemble S n\'est pas posé sur l\'axe en deux segments visibles');
        if(fin.cor) dits.push('une écriture juste reçoit quand même la correction en vert');
        /* une copie FAUSSE : la case rougit et la bonne réponse s'écrit à côté */
        const q1 = await s.page.evaluate(() => {
          const i = test.questions.findIndex((q, j) => j !== test.idx && q.rel !== '=');
          if(i < 0) return false;
          test.idx = i; test.locked = false; renderECS(); return true;
        });
        if(!q1) dits.push('aucune seconde inéquation dans la séance');
        else {
          await s.page.fill('#ecsSol', '[ -6 ; 6 ]');
          await s.page.click('#ecsValidate');
          await s.page.waitForTimeout(300);
          const faux = await s.page.evaluate(() => {
            const inp = document.getElementById('ecsSol'), c = document.querySelector('.ecs-solzone .mf-cor');
            const r = c ? c.getBoundingClientRect() : null;
            return { inp: getComputedStyle(inp).borderTopColor,
                     cor: c ? c.textContent : null, vu: !!(r && r.width > 10 && r.height > 6),
                     couleur: c ? getComputedStyle(c).color : null };
          });
          if(dominante(faux.inp) !== 'rouge') dits.push('l\'écriture fausse n\'est pas bordée de rouge : ' + faux.inp);
          if(!faux.vu) dits.push('la bonne réponse ne s\'affiche pas à côté de la case fausse');
          else if(dominante(faux.couleur) !== 'vert') dits.push('la correction n\'est pas écrite en vert : ' + faux.couleur);
        }
      }
      verifier('les six touches écrivent dans la case, et la méthode se dessine', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran d\'écriture des solutions ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;

      /* ---- et le PAVÉ des tablettes porte les six mêmes symboles ---------- */
      const ditsP = [];
      s = await ouvrir(chromium, ml, { viewport: { width: 820, height: 1180 }, hasTouch: true });
      await connecter(s.page);
      await s.page.evaluate(() => { window.__paveForce = true; paveObserver(); });
      await s.page.evaluate(id => openTest(id), P.ecrireSolutions.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      await s.page.evaluate(() => { const e = document.getElementById('ecsSol'); e.scrollIntoView({ block: 'center' }); e.focus(); });
      await s.page.waitForTimeout(300);
      const pav = await s.page.evaluate(() => {
        const p = document.getElementById('paveNum');
        if(!p) return { absent: true };
        const r = p.getBoundingClientRect();
        const plus = [...p.querySelectorAll('.pave-plus')].map(b => ({ t: b.getAttribute('data-t'),
          w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height),
          top: Math.round(b.getBoundingClientRect().top) }));
        const base = [...p.querySelectorAll('.pave-t')].filter(b => !b.classList.contains('pave-plus'))
          .map(b => Math.round(b.getBoundingClientRect().top));
        const c = document.getElementById('ecsSol').getBoundingClientRect();
        const ctrls = document.getElementById('testCtrls');
        const k = ctrls ? ctrls.getBoundingClientRect() : null;
        const chev = (a, b) => !!(a && b && b.width > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
        return { absent: false, visible: !p.hidden && r.height > 0, plus, base,
                 deborde: p.scrollWidth > p.clientWidth + 2,
                 couvreCase: chev(r, c), couvreCmd: chev(r, k) };
      });
      if(pav.absent) ditsP.push('aucun pavé sur la page');
      else {
        if(!pav.visible) ditsP.push('le pavé ne s\'ouvre pas quand la case reçoit le focus');
        if(pav.plus.map(b => b.t).join(' ') !== T.join(' ')) ditsP.push('le pavé porte [' + pav.plus.map(b => b.t).join(' ') + '] au lieu de [' + T.join(' ') + ']');
        if(pav.plus.some(b => b.w < 30 || b.h < 30)) ditsP.push('une touche supplémentaire du pavé est trop petite pour le doigt');
        if(pav.deborde) ditsP.push('le pavé DÉFILE : des touches se cachent au lieu de passer à la ligne');
        if(pav.couvreCase) ditsP.push('le pavé recouvre la case qu\'on remplit');
        if(pav.couvreCmd) ditsP.push('le pavé recouvre les commandes du bas');
        /* une touche du pavé, CLIQUÉE : elle écrit sans voler le focus */
        await s.page.evaluate(() => { document.getElementById('ecsSol').value = ''; });
        await s.page.click('#paveNum .pave-plus[data-t="' + T[0] + '"]');
        await s.page.click('#paveNum .pave-t[data-t="3"]');
        await s.page.waitForTimeout(120);
        const apres = await s.page.evaluate(() => ({
          v: document.getElementById('ecsSol').value,
          focus: document.activeElement === document.getElementById('ecsSol') }));
        if(apres.v !== T[0] + '3') ditsP.push('les touches du pavé écrivent « ' + apres.v + ' »');
        if(!apres.focus) ditsP.push('une touche du pavé vole le focus de la case');
      }
      verifier('le pavé des tablettes porte les six mêmes symboles, et elles écrivent', !ditsP.length, ditsP.slice(0, 3).join(' | '));
      await s.nav.close(); s = null;

      /* ---- et en PAYSAGE, où tout tiendrait sur une seule ligne ----------
         C'est là que le saut de ligne compte : en portrait la rangée déborde
         de l'écran et se replie d'elle-même, en paysage les vingt touches
         tiendraient côte à côte — et le pavé, qui NE DÉFILE JAMAIS, sortirait
         par la droite ou recouvrirait les commandes du bas. */
      const ditsL = [];
      s = await ouvrir(chromium, ml, { viewport: { width: 1180, height: 820 }, hasTouch: true });
      await connecter(s.page);
      await s.page.evaluate(() => { window.__paveForce = true; paveObserver(); });
      await s.page.evaluate(id => openTest(id), P.ecrireSolutions.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      await s.page.evaluate(() => { const e = document.getElementById('ecsSol'); e.scrollIntoView({ block: 'center' }); e.focus(); });
      await s.page.waitForTimeout(300);
      const pay = await s.page.evaluate(() => {
        const p = document.getElementById('paveNum');
        if(!p) return { absent: true };
        const r = p.getBoundingClientRect();
        const tops = t => { const v = []; t.forEach(x => { if(!v.some(y => Math.abs(y - x) < 6)) v.push(x); }); return v.length; };
        const plus = [...p.querySelectorAll('.pave-plus')].map(b => b.getBoundingClientRect());
        const base = [...p.querySelectorAll('.pave-t')].filter(b => !b.classList.contains('pave-plus')).map(b => b.getBoundingClientRect());
        const ctrls = document.getElementById('testCtrls');
        const k = ctrls ? ctrls.getBoundingClientRect() : null;
        const chev = (a, b) => !!(a && b && b.width > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
        return { absent: false, rangees: tops([...base, ...plus].map(q => Math.round(q.top))),
                 deborde: p.scrollWidth > p.clientWidth + 2,
                 sort: r.right > window.innerWidth + 1 || r.left < -1,
                 couvreCmd: chev(r, k),
                 petites: [...base, ...plus].filter(q => q.width < 28 || q.height < 28).length };
      });
      if(pay.absent) ditsL.push('aucun pavé en paysage');
      else {
        if(pay.deborde) ditsL.push('en paysage le pavé DÉFILE : des touches se cachent');
        if(pay.sort) ditsL.push('en paysage le pavé sort de l\'écran');
        if(pay.couvreCmd) ditsL.push('en paysage le pavé recouvre les commandes du bas');
        if(pay.petites) ditsL.push(pay.petites + ' touche(s) de moins de 28 px en paysage');
      }
      verifier('en paysage, le pavé porte ses vingt touches sans déborder ni recouvrir les commandes', !ditsL.length, ditsL.slice(0, 3).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies septies. placer le point, lire l'image : le graphe se CLIQUE ===== */
    /* Le calcul clic → nœud est calibré sur les GRADUATIONS du SVG rendu —
       la seule façon de le voir est de cliquer pour de vrai (la leçon de
       {construire-fonction} : jsdom n'a pas de mise en page). D'abord la
       DROITE VERTICALE (demande de Turquet, septembre 2026) : on la fait
       GLISSER et on la relâche à un tiers de maille — elle s'accroche à la
       graduation la plus proche — puis on passe en mode point. On clique le
       BON nœud, un point décalé d'un tiers de maille (il s'accroche au plus
       proche), on vérifie 4/4 ; puis un point FAUX pour voir le bon point en
       vert ; et le retrait, qui redésactive les cases sans les vider. */
    titre('6 vicies septies. PLACER LE POINT, LIRE L\'IMAGE : LE GRAPHE SE CLIQUE');
    if(!P.placerImage){
      ignorer('le point se pose au clic, les cases attendent le point',
        'ce niveau n\'a pas l\'exercice du point à placer');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1366, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.placerImage.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* l'énoncé dit la DEMANDE (« Déterminer l'image de … »), le mode
         d'emploi du geste se lit après en PLUS PETIT — mesuré à l'encre
         RENDUE : jsdom lit la règle, seul le navigateur voit la taille
         résolue (la leçon de la cascade du 6.3) */
      const enonceMes = await s.page.evaluate(() => {
        const instr = document.getElementById('pimInstr');
        const sous = instr && instr.querySelector('.pim-sous');
        if(!instr || !sous) return { manque: true };
        return { manque: false,
          debut: instr.textContent.trim().slice(0, 30),
          fsInstr: parseFloat(getComputedStyle(instr).fontSize),
          fsSous: parseFloat(getComputedStyle(sous).fontSize) };
      });
      if(enonceMes.manque) dits.push('l\'énoncé ou son bloc .pim-sous manque à l\'écran');
      else {
        if(enonceMes.debut.indexOf('Déterminer l’image de') !== 0)
          dits.push('l\'énoncé ne commence pas par « Déterminer l\'image de … » : ' + enonceMes.debut);
        if(!(enonceMes.fsSous < enonceMes.fsInstr))
          dits.push('le mode d\'emploi ne se rend pas plus petit que la demande (' + enonceMes.fsSous + 'px contre ' + enonceMes.fsInstr + 'px)');
      }
      /* la position d'un nœud, lue dans les graduations du SVG rendu — et le
         rectangle est relu à CHAQUE clic, la grille étant redessinée */
      const posNoeud = async (x, y, dx, dy) => await s.page.evaluate(([x, y, dx, dy]) => {
        const svg = document.querySelector('#pimGraph .lv-svg');
        svg.scrollIntoView({ block: 'center' });
        const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
        const vx = [], hy = [];
        svg.querySelectorAll('line.lv-grid').forEach(l => {
          if(l.getAttribute('x1') === l.getAttribute('x2')) vx.push(parseFloat(l.getAttribute('x1')));
          else hy.push(parseFloat(l.getAttribute('y1')));
        });
        const pasX = (vx[1] - vx[0]) * r.width / vb.width, pasY = (hy[0] - hy[1]) * r.height / vb.height;
        return { px: r.left + vx[x + 3] * r.width / vb.width + (dx || 0) * pasX,
                 py: r.top + hy[y + 3] * r.height / vb.height + (dy || 0) * pasY };
      }, [x, y, dx || 0, dy || 0]);
      const clicNoeud = async (x, y, dx, dy) => { const p = await posNoeud(x, y, dx, dy); await s.page.mouse.click(p.px, p.py); await s.page.waitForTimeout(120); };
      const etat = async () => await s.page.evaluate(() => ({
        rep: JSON.stringify(test.questions[test.idx].rep),
        pt: !!document.querySelector('#pimGraph .pim-pt'),
        sol: !!document.querySelector('#pimGraph .pim-sol'),
        fxOff: document.getElementById('pim-fx').disabled,
        fx: document.getElementById('pim-fx').value
      }));
      const q0 = await s.page.evaluate(() => { const q = test.questions[test.idx]; return { x0: q.x0, y0: q.pts[q.x0 + 3] }; });
      /* le point attend la DROITE, les cases attendent le point */
      let e = await etat();
      if(!e.fxOff) dits.push('les cases s\'écrivent avant que le point soit posé');
      if(!(await s.page.evaluate(() => document.getElementById('pimModePoint').disabled)))
        dits.push('« Placer le point » s\'ouvre avant que la droite soit posée');
      /* le GLISSER de la droite verticale : on enfonce loin de la bonne
         abscisse, on glisse, on relâche un TIERS de maille à côté — elle
         s'accroche à la graduation la plus proche */
      const glisserDroite = async (cibleX) => {
        const depart = cibleX >= 0 ? -2 : 2;
        let p = await posNoeud(depart, 0);
        await s.page.mouse.move(p.px, p.py);
        await s.page.mouse.down();
        await s.page.waitForTimeout(120);
        p = await posNoeud(cibleX, 0, cibleX > depart ? -0.3 : 0.3, 0);
        await s.page.mouse.move(p.px, p.py, { steps: 5 });
        await s.page.waitForTimeout(120);
        await s.page.mouse.up();
        await s.page.waitForTimeout(200);
      };
      await glisserDroite(q0.x0);
      e = await s.page.evaluate(() => ({
        vl: test.questions[test.idx].vl,
        niv: !!document.querySelector('#pimGraph .adr-niv'),
        ptsOff: document.getElementById('pimModePoint').disabled
      }));
      if(e.vl !== q0.x0) dits.push('le glisser relâché à un tiers de maille pose la droite sur ' + e.vl + ' au lieu de ' + q0.x0);
      if(!e.niv) dits.push('la droite posée ne se dessine pas');
      if(e.ptsOff) dits.push('« Placer le point » reste fermé une fois la droite posée');
      await s.page.click('#pimModePoint');
      /* le clic pose le nœud visé, et les cases s\'ouvrent */
      await clicNoeud(q0.x0, q0.y0);
      e = await etat();
      if(e.rep !== JSON.stringify({ x: q0.x0, y: q0.y0 })) dits.push('le clic ne pose pas le nœud visé : ' + e.rep);
      if(!e.pt) dits.push('le point posé ne se dessine pas');
      if(e.fxOff) dits.push('les cases restent désactivées une fois le point posé');
      /* recliquer RETIRE, et les cases se redésactivent sans se vider */
      await s.page.evaluate(() => { document.getElementById('pim-fx').value = '7'; });
      await clicNoeud(q0.x0, q0.y0);
      e = await etat();
      if(e.rep !== 'null') dits.push('recliquer le point ne le retire pas : ' + e.rep);
      if(!e.fxOff) dits.push('retirer le point ne redésactive pas les cases');
      if(e.fx !== '7') dits.push('retirer le point vide la case (elle portait 7)');
      /* un clic à un TIERS de maille s\'accroche au nœud le plus proche */
      await clicNoeud(q0.x0, q0.y0, 0.33, -0.3);
      e = await etat();
      if(e.rep !== JSON.stringify({ x: q0.x0, y: q0.y0 })) dits.push('le clic décalé d\'un tiers de maille ne s\'accroche pas au nœud le plus proche : ' + e.rep);
      /* la copie juste : 4/4 — la droite est une réponse */
      await s.page.evaluate(([x, y]) => {
        document.getElementById('pim-fx').value = String(x);
        document.getElementById('pim-fv').value = String(y);
      }, [q0.x0, q0.y0]);
      await s.page.click('#pimValidate');
      await s.page.waitForTimeout(300);
      const fin = await s.page.evaluate(() => ({ score: test.score, sol: !!document.querySelector('#pimGraph .pim-sol') }));
      if(fin.score !== 4) dits.push('la copie juste cliquée vaut ' + fin.score + ' au lieu de 4');
      if(fin.sol) dits.push('le bon point se montre sur une copie toute juste');
      /* question suivante, point FAUX : le bon point se montre en vert, d\'étendue non nulle */
      await s.page.evaluate(() => nextPimQuestion());
      await s.page.waitForTimeout(400);
      const q1 = await s.page.evaluate(() => { const q = test.questions[test.idx]; return { x0: q.x0, y0: q.pts[q.x0 + 3] }; });
      await glisserDroite(q1.x0);
      await s.page.click('#pimModePoint');
      await clicNoeud(q1.x0, q1.y0 === 3 ? 2 : q1.y0 + 1);
      await s.page.evaluate(([x, y]) => {
        document.getElementById('pim-fx').value = String(x);
        document.getElementById('pim-fv').value = String(y);
      }, [q1.x0, q1.y0]);
      await s.page.click('#pimValidate');
      await s.page.waitForTimeout(300);
      const faux = await s.page.evaluate(() => {
        const sol = document.querySelector('#pimGraph .pim-sol');
        const r = sol ? sol.getBoundingClientRect() : null;
        return { sol: !!sol, large: r ? r.width > 4 : false,
                 bad: !!document.querySelector('#pimGraph .pim-pt.bad'),
                 score: test.score };
      });
      if(!faux.sol) dits.push('le bon point ne se montre pas sur un point faux');
      else if(!faux.large) dits.push('le bon point vert est dessiné mais d\'étendue nulle');
      if(!faux.bad) dits.push('le point faux de l\'élève ne rougit pas sur le dessin');
      if(faux.score !== 7) dits.push('le point faux ne coûte pas exactement son point (score ' + faux.score + ' au lieu de 7)');
      verifier('le point se pose au clic, les cases attendent le point', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran du point à placer ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 undevicies. antécédents : la droite se fait GLISSER ===== */
    /* {antecedents-droite} : le geste central est un GLISSER — la droite suit
       le pointeur enfoncé et s'accroche à la graduation la plus proche — puis
       les points se posent au clic SUR la droite. jsdom n'a pas de mise en
       page (un rectangle de SVG y vaut zéro) : le glisser, le calibrage
       geste → nœud sur la grille DOUBLÉE (13 graduations) et l'ouverture des
       cases ne se voient qu'ici. Le banc principal, lui, pose dr et rep à la
       main — c'est la répartition de {placer-image}. */
    titre('6 undevicies. ANTÉCÉDENTS : LA DROITE SE FAIT GLISSER');
    if(!P.antecedentsDroite){
      ignorer('la droite se fait glisser, les points se posent sur elle',
        'ce niveau n\'a pas l\'exercice des antécédents à droite posée');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1366, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.antecedentsDroite.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* la position d'un nœud, lue dans les graduations du SVG rendu — le
         rectangle est relu à CHAQUE geste, le dessin étant réécrit */
      const posNoeud = async (x, y, dx, dy) => await s.page.evaluate(([x, y, dx, dy]) => {
        const svg = document.querySelector('#adrGraph .lv-svg');
        svg.scrollIntoView({ block: 'center' });
        const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
        const vx = [], hy = [];
        svg.querySelectorAll('line.lv-grid').forEach(l => {
          if(l.getAttribute('x1') === l.getAttribute('x2')) vx.push(parseFloat(l.getAttribute('x1')));
          else hy.push(parseFloat(l.getAttribute('y1')));
        });
        const pasX = (vx[1] - vx[0]) * r.width / vb.width, pasY = Math.abs(hy[1] - hy[0]) * r.height / vb.height;
        return { px: r.left + vx[x + 6] * r.width / vb.width + (dx || 0) * pasX,
                 py: r.top + hy[y + 6] * r.height / vb.height + (dy || 0) * pasY };
      }, [x, y, dx || 0, dy || 0]);
      const clicNoeud = async (x, y, dx, dy) => { const p = await posNoeud(x, y, dx, dy); await s.page.mouse.click(p.px, p.py); await s.page.waitForTimeout(120); };
      const q0 = await s.page.evaluate(() => { const q = test.questions[test.idx]; return { y0: q.y0, ants: adrAnts(q) }; });
      /* le dessin porte bien la grille DOUBLÉE, et les cases attendent la droite */
      let e = await s.page.evaluate(() => ({
        grille: document.querySelectorAll('#adrGraph line.lv-grid').length,
        vOff: document.getElementById('adr-v').disabled,
        ptsOff: document.getElementById('adrModePoints').disabled,
        niv: !!document.querySelector('#adrGraph .adr-niv')
      }));
      if(e.grille !== 26) dits.push('le dessin rendu porte ' + e.grille + ' lignes de grille au lieu de 26 (13 + 13)');
      if(!e.vOff) dits.push('la phrase se remplit avant que la droite soit posée');
      if(!e.ptsOff) dits.push('« Placer les points » s\'ouvre avant que la droite soit posée');
      if(e.niv) dits.push('une droite est dessinée avant que l\'élève la pose');
      /* le GLISSER : on enfonce loin de la bonne hauteur, on glisse, on
         relâche un TIERS de maille à côté — la droite s'accroche à la
         graduation la plus proche */
      const depart = q0.y0 >= 0 ? -4 : 4;
      let p = await posNoeud(0, depart);
      await s.page.mouse.move(p.px, p.py);
      await s.page.mouse.down();
      await s.page.waitForTimeout(120);
      p = await posNoeud(0, q0.y0, 0, q0.y0 > depart ? 0.3 : -0.3);
      await s.page.mouse.move(p.px, p.py, { steps: 6 });
      await s.page.waitForTimeout(120);
      await s.page.mouse.up();
      await s.page.waitForTimeout(200);
      e = await s.page.evaluate(() => ({
        dr: test.questions[test.idx].dr,
        vOff: document.getElementById('adr-v').disabled,
        ptsOff: document.getElementById('adrModePoints').disabled,
        niv: !!document.querySelector('#adrGraph .adr-niv')
      }));
      if(e.dr !== q0.y0) dits.push('le glisser relâché à un tiers de maille pose la droite en ' + e.dr + ' au lieu de ' + q0.y0);
      if(!e.niv) dits.push('la droite posée ne se dessine pas');
      if(e.vOff) dits.push('la phrase reste fermée une fois la droite posée');
      if(e.ptsOff) dits.push('« Placer les points » reste fermé une fois la droite posée');
      /* les points : on passe en mode points, on clique chaque croisement —
         et un point recliqué se retire */
      await s.page.click('#adrModePoints');
      for(const x of q0.ants) await clicNoeud(x, q0.y0);
      if(q0.ants.length){
        await clicNoeud(q0.ants[0], q0.y0);          /* retiré… */
        e = await s.page.evaluate(() => ({ rep: JSON.stringify(test.questions[test.idx].rep.slice().sort((a, b) => a - b)) }));
        if(e.rep === JSON.stringify(q0.ants)) dits.push('recliquer un point ne le retire pas');
        await clicNoeud(q0.ants[0], q0.y0);          /* …et reposé */
      }
      e = await s.page.evaluate(() => ({
        rep: JSON.stringify(test.questions[test.idx].rep.slice().sort((a, b) => a - b)),
        pts: document.querySelectorAll('#adrGraph .pim-pt').length
      }));
      if(e.rep !== JSON.stringify(q0.ants)) dits.push('les clics ne posent pas les croisements visés : ' + e.rep + ' au lieu de ' + JSON.stringify(q0.ants));
      if(e.pts !== q0.ants.length) dits.push(e.pts + ' point(s) dessiné(s) pour ' + q0.ants.length + ' posé(s)');
      /* la phrase, puis la vérification : toutes les réponses comptées */
      await s.page.evaluate(ants => {
        document.getElementById('adr-v').value = ants.length === 0 ? 'aucun' : (ants.length === 1 ? 'est' : 'sont');
        ants.forEach((x, i) => { document.getElementById('adr-n-' + i).value = String(x); });
      }, q0.ants);
      await s.page.click('#adrValidate');
      await s.page.waitForTimeout(300);
      const fin = await s.page.evaluate(() => ({
        score: test.score,
        sol: !!document.querySelector('#adrGraph .adr-sol') || !!document.querySelector('#adrGraph .pim-sol')
      }));
      if(fin.score !== 3 + q0.ants.length) dits.push('la copie juste au geste vaut ' + fin.score + ' au lieu de ' + (3 + q0.ants.length));
      if(fin.sol) dits.push('la correction verte s\'affiche sur une copie toute juste');
      /* question suivante, la droite posée UNE graduation trop haut : elle
         rougit sur le dessin, la bonne hauteur se montre en vert pointillé,
         et elle ne coûte qu'UN point — les points restent justes */
      await s.page.evaluate(() => nextAdrQuestion());
      await s.page.waitForTimeout(400);
      const q1 = await s.page.evaluate(() => { const q = test.questions[test.idx]; return { y0: q.y0, ants: adrAnts(q) }; });
      const faux = q1.y0 < 6 ? q1.y0 + 1 : q1.y0 - 1;
      p = await posNoeud(0, faux);
      await s.page.mouse.move(p.px, p.py); await s.page.mouse.down();
      await s.page.waitForTimeout(120); await s.page.mouse.up();
      await s.page.waitForTimeout(200);
      await s.page.click('#adrModePoints');
      for(const x of q1.ants) await clicNoeud(x, faux);
      const av = await s.page.evaluate(() => test.score);
      await s.page.evaluate(ants => {
        document.getElementById('adr-v').value = ants.length === 0 ? 'aucun' : (ants.length === 1 ? 'est' : 'sont');
        ants.forEach((x, i) => { document.getElementById('adr-n-' + i).value = String(x); });
      }, q1.ants);
      await s.page.click('#adrValidate');
      await s.page.waitForTimeout(300);
      const f2 = await s.page.evaluate(() => {
        const sol = document.querySelector('#adrGraph .adr-sol');
        const r = sol ? sol.getBoundingClientRect() : null;
        return { score: test.score, sol: !!sol, large: r ? r.width > 40 : false,
                 bad: !!document.querySelector('#adrGraph .adr-niv.bad') };
      });
      if(f2.score - av !== 2 + q1.ants.length) dits.push('la droite mal posée coûte ' + (3 + q1.ants.length - (f2.score - av)) + ' point(s) au lieu de 1');
      if(!f2.sol) dits.push('la bonne hauteur ne se montre pas en vert quand la droite est fausse');
      else if(!f2.large) dits.push('la droite verte est dessinée mais d\'étendue presque nulle');
      if(!f2.bad) dits.push('la droite fausse ne rougit pas sur le dessin');
      verifier('la droite se fait glisser, les points se posent sur elle', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran des antécédents à droite posée ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies nonies. la suite monotone : l'escalier se CLIQUE ===== */
    /* {suite-variation-recurrence} : le tracé en escalier se pose au CLIC, et
       c'est le NAVIGATEUR qui décide sur quel rail l'élève a cliqué — chaque
       courbe est doublée d'un chemin transparent épais (pointer-events:stroke).
       jsdom n'a pas de mise en page : un SVG y a un rectangle nul, et
       getScreenCTM n'existe pas — le banc principal éprouve svrPoser(), seul
       celui-ci CLIQUE. On lit les coordonnées sur le SVG RENDU (aucune
       coordonnée recopiée : la même transformation que le dessin), on pose les
       trois points, on vérifie, et on mesure ce que jsdom ne peut pas voir :
       le repère à une taille lisible, l'escalier vert d'étendue non nulle, et
       les « ≤ » de l'initialisation et de la démonstration alignés en colonnes. */
    titre('6 vicies nonies. LA SUITE MONOTONE : L\'ESCALIER SE CLIQUE');
    if(!P.suiteVariation){
      ignorer('le tracé en escalier se pose au clic, sur le bon rail',
        'ce niveau n\'a pas l\'exercice du sens de variation par récurrence');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 950 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.suiteVariation.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* on ÉPINGLE le cas de la fiche : la mesure ne doit pas dépendre du tirage */
      await s.page.evaluate(() => {
        test.questions[test.idx] = { l:1, L:3, U0:2, sens:'dec',
          ordre:['l','un1','u1','un','u0','un2'], ordreLim:['u0','l','zero','L'], pts:[] };
        renderSVR();
      });
      await s.page.waitForTimeout(600);
      /* L'ÉCRAN S'OUVRE SUR LE TRACÉ, PAS SUR LA FEUILLE. mlFeuille donne le
         focus à sa première ligne — c'est ce que veut le 2.5, dont la feuille
         EST l'exercice ; ici l'écran commence par le graphique de a), et ce
         focus faisait DESCENDRE la page de 485 px : l'élève arrivait sur d)
         sans avoir vu le dessin. Sur TABLETTE la sonde a mesuré pire — 764 px
         de défilement et le clavier mathématique déployé tout seul. jsdom n'a
         ni mise en page ni défilement : seul ce banc peut le voir. */
      { const arrivee = await s.page.evaluate(() => {
          const g = document.getElementById('svrGraph').getBoundingClientRect();
          const sh = document.getElementById('svrSheet'), a = document.activeElement;
          return { y: Math.round(window.scrollY), top: Math.round(g.top),
                   dansFeuille: !!(sh && a && sh.contains(a)) }; });
        if(arrivee.y > 8) dits.push('l\'écran s\'ouvre en ayant défilé de ' + arrivee.y + ' px : la feuille de d) a pris le focus');
        if(arrivee.top < 0) dits.push('le graphique de a) est déjà sorti par le haut (' + arrivee.top + ' px)');
        if(arrivee.dansFeuille) dits.push('la feuille de d) garde le focus à l\'arrivée : la première touche frappée écrirait dedans'); }
      /* le repère est RENDU à une taille lisible — un CSS perdu le réduirait
         sans qu'aucune erreur ne se lève, et les graduations deviendraient
         illisibles */
      const geo = await s.page.evaluate(() => {
        const svg = document.querySelector('#svrGraph svg');
        if(!svg) return { manque: true };
        const r = svg.getBoundingClientRect();
        const hits = [...document.querySelectorAll('#svrGraph .svr-hit')].map(h => ({
          rail: h.getAttribute('data-rail'),
          ep: parseFloat(getComputedStyle(h).strokeWidth),
          pe: getComputedStyle(h).pointerEvents }));
        return { manque: false, w: Math.round(r.width), h: Math.round(r.height), hits };
      });
      if(geo.manque) dits.push('aucun repère rendu');
      else {
        if(geo.w < 420 || geo.h < 420) dits.push('le repère est rendu à ' + geo.w + ' × ' + geo.h + ' px : les graduations ne se lisent plus');
        if(geo.hits.length !== 2) dits.push(geo.hits.length + ' rail(s) cliquable(s) au lieu de 2');
        geo.hits.forEach(hh => {
          if(hh.pe !== 'stroke') dits.push('le rail ' + hh.rail + ' ne reçoit pas les clics (pointer-events : ' + hh.pe + ')');
          if(!(hh.ep >= 10)) dits.push('la zone de clic du rail ' + hh.rail + ' ne fait que ' + hh.ep + ' px');
        });
      }
      /* le point d'un rail, lu sur le SVG RENDU : on repasse par la
         transformation du dessin, jamais par une constante recopiée */
      const posRail = async (rail, x) => await s.page.evaluate(([rail, x]) => {
        const svg = document.querySelector('#svrGraph svg');
        svg.scrollIntoView({ block: 'center' });
        const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
        const k = r.width / vb.width;
        const a = svrAns(test.questions[test.idx]);
        const y = (rail === 'c') ? svrFn(a)(x) : x;
        return { px: r.left + (SVR_PADL + x * SVR_PLOT / a.W) * k,
                 py: r.top + (SVR_PADT + SVR_PLOT - y * SVR_PLOT / a.W) * k };
      }, [rail, x]);
      const clicRail = async (rail, x) => { const p = await posRail(rail, x); await s.page.mouse.click(p.px, p.py); await s.page.waitForTimeout(140); };
      const A = await s.page.evaluate(() => { const a = svrAns(test.questions[test.idx]); return { U0: a.U0, U1: a.U1, U2: a.U2, W: a.W }; });
      /* LE RAIL EST CELUI QU'ON A CLIQUÉ : à l'abscisse U1, la droite et la
         courbe portent chacune un point attendu — c'est le navigateur qui les
         départage, et c'est tout ce que ce contrôle mesure ici */
      await clicRail('c', A.U0);
      await clicRail('d', A.U1);
      await clicRail('c', A.U1);
      const poses = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = svrAns(q);
        return { pts: q.pts.slice(), verd: [0,1,2].map(i => svrPtJuste(a, i, q.pts[i])),
                 dessines: document.querySelectorAll('#svrGraph .svr-pt').length };
      });
      if(poses.pts.length !== 3) dits.push('trois clics posent ' + poses.pts.length + ' point(s)');
      else {
        const rails = poses.pts.map(p => p.r).join('');
        if(rails !== 'cdc') dits.push('les clics tombent sur les rails « ' + rails +' » au lieu de « cdc » : le navigateur ne départage pas les deux courbes');
        if(!poses.verd.every(Boolean)) dits.push('les trois points cliqués sont jugés ' + JSON.stringify(poses.verd));
      }
      if(poses.dessines !== 3) dits.push(poses.dessines + ' point(s) dessiné(s) après trois clics');
      /* un clic LOIN des deux rails ne pose rien */
      await s.page.evaluate(() => { test.questions[test.idx].pts = []; svrDessiner(); });
      { const p = await posRail('d', A.W * 0.5);
        await s.page.mouse.click(p.px, p.py - 90);            /* bien au-dessus de la droite, loin de la courbe */
        await s.page.waitForTimeout(140);
        const n = await s.page.evaluate(() => test.questions[test.idx].pts.length);
        if(n) dits.push('un clic posé entre les deux rails pose quand même un point'); }
      /* d) EST PRÉSENTÉE COMME LE 2.5 (demande de Turquet, septembre 2026) :
         le bloc facultatif u/v/u′/v′ et la feuille ligne par ligne. jsdom lit
         des classes ; seul un navigateur voit qu'elles ont une BOÎTE — un CSS
         perdu les rendrait invisibles sans qu'une erreur ne se lève. */
      let feuilleVue = true;
      { const d = await s.page.evaluate(() => {
          const b = sel => { const e = document.querySelector(sel); if(!e) return null;
            const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
          return { fac: b('#svrPartD .dexp-facblock'), sheet: b('#svrSheet'),
                   mf: [...document.querySelectorAll('#svrPartD .dexp-facblock math-field')].length,
                   pfx: String((document.querySelector('#svrSheet .dexp2-prefix') || {}).textContent || '').replace(/\s/g, ''),
                   clavier: [...document.querySelectorAll('#scr-svr .rc-jetons button')]
                     .some(b2 => /clavier/i.test(b2.getAttribute('title') || '')) };
        });
        if(!d.fac || d.fac.w < 100 || d.fac.h < 20) dits.push('le bloc facultatif u/v/u′/v′ de d) n\'a pas de boîte');
        if(d.mf !== 4) dits.push(d.mf + ' champ(s) facultatif(s) au lieu de 4');
        if(!d.sheet || d.sheet.w < 100 || d.sheet.h < 20){ dits.push('la feuille de d) n\'a pas de boîte'); feuilleVue = false; }
        if(d.pfx.indexOf('′(x)=') < 0) dits.push('la feuille de d) ne porte pas le préfixe « f ′(x) = » (« ' + d.pfx + ' »)');
        if(!d.clavier) dits.push('l\'écran porte des champs mathématiques sans bouton « Clavier mathématique »'); }
      /* LA DÉRIVÉE EST TAPÉE POUR DE VRAI : jsdom n'a pas la sérialisation
         réelle que le juge doit lire — c'est le seul bord qui dise que ce que
         l'élève écrit à la main est bien relu comme une fonction. */
      /* on ne TAPE que dans une feuille qui a une boîte : sans elle le clic
         expire au bout de trente secondes et le banc rend une panne de
         Playwright à la place du défaut qu'il venait de mesurer — un
         contrôle qui s'affiche sous le nom d'un autre. */
      if(feuilleVue){
        await s.page.click('#svrSheet math-field');
        await s.page.waitForTimeout(400);   /* le piège documenté du 6.8 : les premières frappes tombent dans le vide */
        await s.page.keyboard.type('3/(4-x)^2', { delay: 50 });
        await s.page.waitForTimeout(300);
        const t = await s.page.evaluate(() => {
          const lg = svrDerLignes(), a = svrAns(test.questions[test.idx]);
          return { plain: lg.length ? lg[0].plain : '', ok: lg.length ? checkExprFn(lg[0].plain, svrDer(a)) : false }; });
        if(!t.ok) dits.push('la dérivée TAPÉE dans la feuille n\'est pas relue comme juste (lu : « ' + t.plain + ' »)');
      }
      /* la copie juste, puis la vérification : la méthode se DESSINE, avec une
         étendue non nulle — un CSS perdu la rendrait invisible sans erreur */
      await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = svrAns(q);
        q.pts = []; svrDessiner();
        svrCases(q).forEach(x => { const e = document.getElementById(x.id); if(e) e.value = svrCorrVal(a, x); });
        svrPtsAttendus(a).forEach(e => svrPoser(e.r, e.x));
      });
      await s.page.click('#svrActions button.btn-primary');
      await s.page.waitForTimeout(400);
      const fin = await s.page.evaluate(() => {
        const boite = sel => { const e = document.querySelector(sel); if(!e) return null;
          const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
        const pt = document.querySelector('#svrGraph .svr-pt.ok circle');
        return { score: test.score, note: ptsEcran(),
                 esc: boite('#svrGraph .svr-esc-sol'), lect: document.querySelectorAll('#svrGraph .svr-lect').length,
                 bleus: document.querySelectorAll('#svrGraph .svr-pt.ok').length,
                 encre: pt ? getComputedStyle(pt).fill : '' };
      });
      if(fin.score !== 1) dits.push('la copie juste cliquée ne vaut pas le point (score ' + fin.score + ')');
      if(!fin.note || fin.note.justes !== fin.note.cases) dits.push('la note affichée compte ' + (fin.note ? fin.note.justes + '/' + fin.note.cases : 'rien'));
      if(!fin.esc || fin.esc.w < 20 || fin.esc.h < 20) dits.push('l\'escalier vert de la méthode est dessiné mais d\'étendue presque nulle');
      if(fin.lect !== 2) dits.push(fin.lect + ' trait(s) de lecture au lieu de 2 (U1 sur l\'axe, U2 en hauteur)');
      if(fin.bleus !== 3) dits.push(fin.bleus + ' point(s) peint(s) en bleu au lieu de 3');
      /* la feuille de d) porte le verdict de la réponse, et son encre se MESURE :
         une classe posée pendant qu'une règle la peint autrement est un défaut
         de PEINTURE, et seul un navigateur le voit. */
      { const f = await s.page.evaluate(() => {
          const sh = document.getElementById('svrSheet'), L = document.querySelector('#svrSheet .dexp2-line');
          return { sh: sh ? sh.className : '', l: L ? L.className : '',
                   bord: sh ? getComputedStyle(sh).borderTopColor : '',
                   filet: L ? getComputedStyle(L).borderLeftColor : '' }; });
        if(f.sh.indexOf('ok') < 0) dits.push('copie juste : la feuille de d) n\'est pas marquée juste (« ' + f.sh + ' »)');
        if(f.l.indexOf('ok') < 0) dits.push('copie juste : la ligne de la feuille n\'est pas marquée juste (« ' + f.l + ' »)');
        [['la bordure de la feuille', f.bord], ['le filet de la ligne juste', f.filet]].forEach(([quoi, enc]) => {
          const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(enc || '');
          if(!m) { dits.push(quoi + ' n\'a pas d\'encre lisible'); return; }
          const c = [+m[1], +m[2], +m[3]];
          if(!(c[2] >= Math.max(c[0], c[1]) && c[2] - Math.min(c[0], c[1]) >= 30))
            dits.push(quoi + ' n\'est pas bleu : ' + enc); }); }
      { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(fin.encre || '');
        if(m){ const c = [+m[1], +m[2], +m[3]];
          if(!(c[2] >= Math.max(c[0], c[1]))) dits.push('le point juste n\'est pas peint en bleu : ' + fin.encre); } }
      /* LES « ≤ » TOMBENT LES UNS SOUS LES AUTRES (demande de Turquet, septembre
         2026) : l'initialisation et la démonstration sont des GRILLES à colonnes,
         et jsdom n'a pas de mise en page — seul un navigateur sait où tombe une
         colonne. On lit les cellules RENDUES (data-r / data-c), jamais la feuille
         de styles : un display:grid perdu laisse toutes les classes en place et
         met tout à la file. Trois bords, et n'en tenir qu'un ne tient rien :
         chaque rangée d'un seul tenant (une bande verticale commune), les « ≤ »
         et les termes d'une même colonne au même CENTRE d'une rangée à l'autre,
         et les valeurs de l'initialisation SOUS leur terme, une ligne plus bas.
         Puis le défilement : à 1400 px rien ne défile, à 900 px la démonstration
         DÉFILE dans sa boîte — une grille ne sait pas se replier, mais un contenu
         qui aurait « trouvé la place ailleurs » dirait qu'elle n'en est plus une. */
      const mesurerGrilles = async () => await s.page.evaluate(() => {
        const lire = g => {
          /* on mesure le CONTENU de la cellule, jamais sa boîte : une cellule de
             grille s'étire sur toute sa colonne, donc son centre est celui de la
             colonne quoi qu'elle fasse de son contenu — un « ≤ » poussé à gauche
             (justify-content perdu) passait au vert en parlant d'autre chose ;
             le sabotage l'a montré. Un Range sur le contenu rend la boîte du
             glyphe comme celle d'une liste. */
          const cels = [...g.querySelectorAll('.svr-cel')].map(c => {
            const rg = document.createRange(); rg.selectNodeContents(c);
            const r = rg.getBoundingClientRect();
            return { r: +c.dataset.r, c: +c.dataset.c, x: (r.left + r.right) / 2, top: r.top, bot: r.bottom,
                     le: c.classList.contains('svr-le'), val: c.classList.contains('svr-val'),
                     libre: c.classList.contains('svr-just') || c.classList.contains('svr-lib') || c.classList.contains('svr-suite') };
          });
          const sc = g.parentElement;
          return { cels, debord: Math.round(sc.scrollWidth - sc.clientWidth), coupe: Math.round(sc.scrollHeight - sc.clientHeight) };
        };
        const gi = document.querySelector('#svrPartE .svr-grec'), gd = document.querySelector('#svrPartE .svr-gdemo');
        return { init: gi ? lire(gi) : null, demo: gd ? lire(gd) : null };
      });
      const jugerGrilles = (m, large) => {
        const L = large ? 1400 : 900;
        if(!m.init) { dits.push('la récurrence (initialisation et hérédité) n\'est pas une grille à colonnes (.svr-grec)'); return; }
        if(!m.demo) { dits.push('la démonstration n\'est pas une grille à colonnes (.svr-gdemo)'); return; }
        [['la récurrence', m.init], ['la démonstration', m.demo]].forEach(([nom, g]) => {
          const rangs = {}; g.cels.forEach(c => { (rangs[c.r] = rangs[c.r] || []).push(c); });
          Object.keys(rangs).forEach(r => {
            const cs = rangs[r], haut = Math.max(...cs.map(c => c.top)), bas = Math.min(...cs.map(c => c.bot));
            if(haut >= bas - 4) dits.push('à ' + L + ' px, la rangée ' + r + ' de ' + nom + ' n\'est pas d\'un seul tenant : ses cellules ne partagent aucune bande verticale');
          });
          /* même colonne → même centre, d'une rangée à l'autre (les cellules libres — étiquette, suite, justification — ne sont pas des colonnes) */
          const cols = {}; g.cels.filter(c => !c.libre).forEach(c => { (cols[c.c] = cols[c.c] || []).push(c); });
          Object.keys(cols).forEach(c => {
            const xs = cols[c].map(k => k.x), ecart = Math.max(...xs) - Math.min(...xs);
            if(ecart > 3) dits.push('à ' + L + ' px, la colonne ' + c + ' de ' + nom + ' n\'est pas alignée : ' + Math.round(ecart) + ' px d\'écart entre ses cellules');
          });
          if(large && g.debord > 2) dits.push(nom + ' défile de ' + g.debord + ' px à 1400 px de large');
          /* overflow-x:auto emporte overflow-y : ce qui dépasse la boîte EN BAS est coupé, et
             l'indice d'un terme U_n descend sous sa ligne — la dernière rangée en porte. On lit
             le DÉBORD VERTICAL de la boîte (scrollHeight − clientHeight) : un Range sur les
             cellules ne voit pas l'indice décalé, la sonde l'a montré (1899 contre 1903). */
          if(g.coupe > 0) dits.push('à ' + L + ' px, le bas de ' + nom + ' est coupé par sa boîte : ' + g.coupe + ' px (les indices de la dernière rangée)');
        });
        /* la récurrence : trois « ≤ » sur chacune de ses cinq lignes de chaîne — les
           deux de l'initialisation, les trois de l'hérédité (rangées 4, 5, 6) —, et
           les deux valeurs SOUS leur terme, une ligne plus bas */
        { [1, 2, 4, 5, 6].forEach(r => { const n = m.init.cels.filter(c => c.le && c.r === r).length;
            if(n !== 3) dits.push('la rangée ' + r + ' de la récurrence porte ' + n + ' « ≤ » au lieu de 3' + (r >= 4 ? ' : l\'hérédité a quitté la grille' : '')); });
          const vals = m.init.cels.filter(c => c.val);
          if(vals.length !== 2) dits.push(vals.length + ' valeur(s) sous les termes de l\'initialisation au lieu de 2');
          vals.forEach(v => {
            const t = m.init.cels.find(c => c.r === 2 && c.c === v.c && !c.le);
            if(!t) { dits.push('la valeur de la colonne ' + v.c + ' n\'a aucun terme au-dessus d\'elle'); return; }
            if(Math.abs(t.x - v.x) > 3) dits.push('la valeur n\'est pas centrée sous son terme (' + Math.round(t.x - v.x) + ' px)');
            if(v.top < t.bot - 2) dits.push('la valeur n\'est pas une ligne EN DESSOUS de son terme (haut ' + Math.round(v.top) + ', bas du terme ' + Math.round(t.bot) + ')');
          }); }
        /* la démonstration : chaque f(…) a son résultat juste en dessous — même colonne, rangée suivante — et chaque « ≤ » le sien
           (la justification « car f(x) est … » vit au bout de la rangée des f(…) : elle n'est pas un terme) */
        { const f = m.demo.cels.filter(c => c.r === 2 && !c.le && !c.libre), res = m.demo.cels.filter(c => c.r === 3 && !c.le);
          if(f.length !== 4) dits.push(f.length + ' f(…) au lieu de 4 dans la démonstration');
          if(res.length !== 5) dits.push(res.length + ' terme(s) au lieu de 5 sur la dernière ligne de la démonstration');
          f.forEach(k => {
            const r = res.find(c => c.c === k.c);
            if(!r) dits.push('le f(…) de la colonne ' + k.c + ' n\'a aucun résultat sous lui');
            else if(Math.abs(r.x - k.x) > 3 || r.top < k.bot - 2) dits.push('le résultat n\'est pas juste sous son f(…) (' + Math.round(r.x - k.x) + ' px de côté)');
          });
          const le2 = m.demo.cels.filter(c => c.le && c.r === 2), le3 = m.demo.cels.filter(c => c.le && c.r === 3);
          le2.forEach(k => { if(!le3.some(c => c.c === k.c && Math.abs(c.x - k.x) <= 3)) dits.push('un « ≤ » de la ligne des f(…) n\'a pas de « ≤ » sous lui (colonne ' + k.c + ')'); });
          /* la justification est SUR la ligne des f(…) : sa cellule et les f(…) partagent une bande verticale */
          const just = m.demo.cels.find(c => c.libre && c.r === 2);
          if(!just) dits.push('« car f(x) est … » n\'est pas sur la ligne des f(…)');
          else if(f.length && !(Math.max(just.top, ...f.map(c => c.top)) < Math.min(just.bot, ...f.map(c => c.bot)) - 4)) dits.push('« car f(x) est … » ne partage pas sa ligne avec les f(…)');
          if(!large && m.demo.debord <= 2) dits.push('à 900 px la démonstration ne défile pas : elle a trouvé la place ailleurs'); }
      };
      jugerGrilles(await mesurerGrilles(), true);
      await s.page.setViewportSize({ width: 900, height: 950 });
      await s.page.waitForTimeout(300);
      jugerGrilles(await mesurerGrilles(), false);
      /* LE VISAGE CROISSANT, rendu pour de vrai à 1400 px : c'est lui que le décalage
         d'une colonne de terme concerne, et lui qui manque de place au bout de la
         ligne des f(…) — 214 px de trop avant que la justification ne sache se
         replier. Le banc jsdom tient la STRUCTURE du décalage ; ici on mesure que
         la grille rendue tient dans sa boîte et reste alignée. */
      await s.page.setViewportSize({ width: 1400, height: 950 });
      await s.page.evaluate(() => {
        const vc = svrVivier('cro')[0];
        test.questions[test.idx] = { l: vc.l, L: vc.L, U0: vc.U0, sens: 'cro', pts: [] }; test.locked = false;
        renderSVR();
      });
      await s.page.waitForTimeout(500);
      { const avant = dits.length; jugerGrilles(await mesurerGrilles(), true);
        for(let i = avant; i < dits.length; i++) dits[i] = 'suite croissante : ' + dits[i]; }
      verifier('le tracé en escalier se pose au clic, sur le bon rail', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran de la suite monotone ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }


    /* ===== 6 tricies septies. {suite-synthese-variations} : la fiche 3 entière =====
       Le banc jsdom tient le tirage HONNÊTE (la suite simulée par sa propre
       arithmétique), la fiche épinglée, la règle des paires et les deux juges.
       Ce qu'il ne voit pas : l'escalier CLIQUÉ pour de vrai — c'est le
       NAVIGATEUR qui décide sur quel rail l'élève a cliqué, jamais une
       arithmétique de distance —, le repère à une taille lisible, la dérivée
       TAPÉE dans un vrai MathLive (jsdom n'a pas la sérialisation réelle que le
       juge doit lire), les « ≤ » de la récurrence alignés en colonnes (un
       display:grid perdu laisse toutes les classes en place et met tout à la
       file), les chaînes de f) et de i) d'un seul tenant — une chaîne coupée en
       deux se lit comme deux calculs —, et l'encre RENDUE des verdicts. */
    titre('6 tricies septies. LA SYNTHÈSE SUR LES VARIATIONS : L\'ESCALIER, LA GRILLE ET LES CHAÎNES');
    if(!P.suiteSynthese){
      ignorer('la synthèse : l\'escalier se clique, la grille s\'aligne, les chaînes tiennent sur une ligne',
        'ce niveau n\'a pas l\'exercice de synthèse sur les variations de suites');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 950 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.suiteSynthese.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* on ÉPINGLE la fiche : la mesure ne doit pas dépendre du tirage */
      await s.page.evaluate(() => {
        test.questions[test.idx] = { l1: 0.5, l2: 2, c: 0, U0: 1, sens: 'cro',
          ordre: ['M', 'un', 'm', 'un1', 'u1'], pts: [] };
        renderSSV();
      });
      await s.page.waitForTimeout(700);
      /* L'ÉCRAN S'OUVRE SUR LE TRACÉ, PAS SUR LA FEUILLE : mlFeuille donne le
         focus à sa première ligne, et la page descendrait jusqu'à d) — l'élève
         arriverait sur la dérivée sans avoir vu le graphique. jsdom n'a ni mise
         en page ni défilement : seul ce banc peut le voir (la leçon du 6.11). */
      { const arrivee = await s.page.evaluate(() => {
          const g = document.getElementById('ssvGraph').getBoundingClientRect();
          const sh = document.getElementById('ssvSheet'), a = document.activeElement;
          return { y: Math.round(window.scrollY), top: Math.round(g.top),
                   dansFeuille: !!(sh && a && sh.contains(a)) }; });
        if(arrivee.y > 8) dits.push('l\'écran s\'ouvre en ayant défilé de ' + arrivee.y + ' px : la feuille de d) a pris le focus');
        if(arrivee.top < 0) dits.push('le graphique de b) est déjà sorti par le haut (' + arrivee.top + ' px)');
        if(arrivee.dansFeuille) dits.push('la feuille de d) garde le focus à l\'arrivée : la première touche frappée écrirait dedans'); }
      /* le repère est RENDU à une taille lisible, et ses deux rails reçoivent les clics */
      { const geo = await s.page.evaluate(() => {
          const svg = document.querySelector('#ssvGraph svg');
          if(!svg) return { manque: true };
          const r = svg.getBoundingClientRect();
          return { manque: false, w: Math.round(r.width), h: Math.round(r.height),
                   hits: [...document.querySelectorAll('#ssvGraph .svr-hit')].map(h => ({
                     rail: h.getAttribute('data-rail'), ep: parseFloat(getComputedStyle(h).strokeWidth),
                     pe: getComputedStyle(h).pointerEvents })) }; });
        if(geo.manque) dits.push('aucun repère rendu');
        else {
          if(geo.w < 420 || geo.h < 420) dits.push('le repère est rendu à ' + geo.w + ' × ' + geo.h + ' px : les graduations ne se lisent plus');
          if(geo.hits.length !== 2) dits.push(geo.hits.length + ' rail(s) cliquable(s) au lieu de 2');
          geo.hits.forEach(hh => {
            if(hh.pe !== 'stroke') dits.push('le rail ' + hh.rail + ' ne reçoit pas les clics (pointer-events : ' + hh.pe + ')');
            if(!(hh.ep >= 10)) dits.push('la zone de clic du rail ' + hh.rail + ' ne fait que ' + hh.ep + ' px'); });
        } }
      /* le point d'un rail, lu sur le SVG RENDU : on repasse par la
         transformation du dessin, jamais par une constante recopiée */
      const posRail = async (rail, x) => await s.page.evaluate(([rail, x]) => {
        const svg = document.querySelector('#ssvGraph svg');
        svg.scrollIntoView({ block: 'center' });
        const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
        const k = r.width / vb.width;
        const a = ssvAns(test.questions[test.idx]);
        const y = (rail === 'c') ? ssvF(a)(x) : x;
        return { px: r.left + (SVR_PADL + x * SVR_PLOT / a.W) * k,
                 py: r.top + (SVR_PADT + SVR_PLOT - y * SVR_PLOT / a.W) * k };
      }, [rail, x]);
      const clicRail = async (rail, x) => { const p = await posRail(rail, x); await s.page.mouse.click(p.px, p.py); await s.page.waitForTimeout(140); };
      const A = await s.page.evaluate(() => { const a = ssvAns(test.questions[test.idx]); return { U0: a.U0, U1: a.U1, W: a.W }; });
      /* LE RAIL EST CELUI QU'ON A CLIQUÉ : à l'abscisse U1, la droite et la
         courbe portent chacune un point attendu — c'est le navigateur qui les
         départage, et c'est tout ce que ce contrôle mesure ici */
      await clicRail('c', A.U0);
      await clicRail('d', A.U1);
      await clicRail('c', A.U1);
      { const poses = await s.page.evaluate(() => {
          const q = test.questions[test.idx], a = ssvAns(q);
          return { pts: q.pts.slice(), verd: [0, 1, 2].map(i => ssvPtJuste(a, i, q.pts[i])),
                   dessines: document.querySelectorAll('#ssvGraph .svr-pt').length }; });
        if(poses.pts.length !== 3) dits.push('trois clics posent ' + poses.pts.length + ' point(s)');
        else {
          const rails = poses.pts.map(p => p.r).join('');
          if(rails !== 'cdc') dits.push('les clics tombent sur les rails « ' + rails + ' » au lieu de « cdc » : le navigateur ne départage pas les deux courbes');
          if(!poses.verd.every(Boolean)) dits.push('les trois points cliqués sont jugés ' + JSON.stringify(poses.verd));
        }
        if(poses.dessines !== 3) dits.push(poses.dessines + ' point(s) dessiné(s) après trois clics'); }
      /* UN CLIC LOIN DES DEUX RAILS NE POSE RIEN — et le point « loin » se
         CHERCHE plutôt que de se supposer : « 90 px au-dessus de la droite »,
         le repère du 6.11, tombe ICI presque exactement sur la courbe (elle
         passe au-dessus de la diagonale quand la suite croît), et le contrôle
         accusait la page d'un défaut qui était le sien. On balaie le cadre et
         on retient le point le plus éloigné des DEUX rails RENDUS, puis on
         exige que cette distance soit franche — un contrôle qui n'a rien à
         mesurer le dit. */
      await s.page.evaluate(() => { test.questions[test.idx].pts = []; ssvDessiner(); });
      { const loin = await s.page.evaluate(() => {
          const svg = document.querySelector('#ssvGraph svg');
          svg.scrollIntoView({ block: 'center' });
          const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = r.width / vb.width;
          const a = ssvAns(test.questions[test.idx]), f = ssvF(a), u = SVR_PLOT / a.W;
          const X = x => r.left + (SVR_PADL + x * u) * k, Y = y => r.top + (SVR_PADT + SVR_PLOT - y * u) * k;
          const rails = [];
          for(let m = 0; m <= 240; m++){ const x = a.W * m / 240, y = f(x);
            rails.push([X(x), Y(x)]);                       /* la droite y = x */
            if(isFinite(y) && y >= -0.3 && y <= a.W + 0.3) rails.push([X(x), Y(y)]); }
          let best = null;
          for(let i = 1; i < 20; i++) for(let j = 1; j < 20; j++){
            const px = X(a.W * i / 20), py = Y(a.W * j / 20);
            let d = Infinity;
            rails.forEach(q => { const dd = Math.hypot(px - q[0], py - q[1]); if(dd < d) d = dd; });
            if(!best || d > best.d) best = { px, py, d: d };
          }
          return best; });
        if(!loin || loin.d < 40) dits.push('aucun point du cadre n\'est à 40 px des deux rails : le contrôle du clic hors rail ne mesure rien');
        else {
          await s.page.mouse.click(loin.px, loin.py);
          await s.page.waitForTimeout(140);
          const n = await s.page.evaluate(() => test.questions[test.idx].pts.length);
          if(n) dits.push('un clic posé à ' + Math.round(loin.d) + ' px des deux rails pose quand même un point');
        } }
      /* d) EST PRÉSENTÉE COMME LE 2.5 : jsdom lit des classes, seul un
         navigateur voit qu'elles ont une BOÎTE — un CSS perdu les rendrait
         invisibles sans qu'une erreur ne se lève. */
      let feuilleVue = true;
      { const d = await s.page.evaluate(() => {
          const b = sel => { const e = document.querySelector(sel); if(!e) return null;
            const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
          return { fac: b('#ssvPartD .dexp-facblock'), sheet: b('#ssvSheet'),
                   mf: [...document.querySelectorAll('#ssvPartD .dexp-facblock math-field')].length,
                   pfx: String((document.querySelector('#ssvSheet .dexp2-prefix') || {}).textContent || '').replace(/\s/g, ''),
                   clavier: [...document.querySelectorAll('#scr-ssv .rc-jetons button')]
                     .some(b2 => /clavier/i.test(b2.getAttribute('title') || '')) }; });
        if(!d.fac || d.fac.w < 100 || d.fac.h < 20) dits.push('le bloc facultatif u/v/u′/v′ de d) n\'a pas de boîte');
        if(d.mf !== 4) dits.push(d.mf + ' champ(s) facultatif(s) au lieu de 4');
        if(!d.sheet || d.sheet.w < 100 || d.sheet.h < 20){ dits.push('la feuille de d) n\'a pas de boîte'); feuilleVue = false; }
        if(d.pfx.indexOf('′(x)=') < 0) dits.push('la feuille de d) ne porte pas le préfixe « f ′(x) = » (« ' + d.pfx + ' »)');
        if(!d.clavier) dits.push('l\'écran porte des champs mathématiques sans bouton « Clavier mathématique »'); }
      /* LA DÉRIVÉE EST TAPÉE POUR DE VRAI : jsdom n'a pas la sérialisation
         réelle que le juge doit lire. */
      if(feuilleVue){
        await s.page.click('#ssvSheet math-field');
        await s.page.waitForTimeout(400);   /* le piège documenté du 6.8 : les premières frappes tombent dans le vide */
        await s.page.keyboard.type('1/x^2', { delay: 50 });
        await s.page.waitForTimeout(300);
        const t = await s.page.evaluate(() => {
          const lg = derLignes(ssvFeuille), a = ssvAns(test.questions[test.idx]);
          return { plain: lg.length ? lg[0].plain : '', ok: lg.length ? checkExprFn(lg[0].plain, ssvDer(a)) : false }; });
        if(!t.ok) dits.push('la dérivée TAPÉE dans la feuille n\'est pas relue comme juste (lu : « ' + t.plain + ' »)');
      }
      /* LES « ≤ » DE LA RÉCURRENCE TOMBENT LES UNS SOUS LES AUTRES : e) est une
         GRILLE à colonnes, et jsdom n'a pas de mise en page. On lit les cellules
         RENDUES (data-r / data-c), jamais la feuille de styles. On mesure le
         CONTENU de la cellule et non sa boîte : une cellule de grille s'étire sur
         toute sa colonne, donc son centre est celui de la colonne quoi qu'elle
         fasse de son contenu (la leçon du 6.11). */
      const mesurerGrille = async () => await s.page.evaluate(() => {
        const g = document.querySelector('#ssvPartE .ssv-grille'); if(!g) return null;
        const cels = [...g.querySelectorAll('.ssv-cel')].map(c => {
          const rg = document.createRange(); rg.selectNodeContents(c);
          const r = rg.getBoundingClientRect();
          return { r: +c.dataset.r, c: +c.dataset.c, x: (r.left + r.right) / 2, top: r.top, bot: r.bottom,
                   le: c.classList.contains('svr-le'),
                   libre: c.classList.contains('ssv-lib') || c.classList.contains('ssv-suite') || c.classList.contains('ssv-just') }; });
        const sc = g.parentElement;
        return { cels, debord: Math.round(sc.scrollWidth - sc.clientWidth),
                 coupe: Math.round(sc.scrollHeight - sc.clientHeight) };
      });
      { const m = await mesurerGrille();
        if(!m) dits.push('la récurrence de e) n\'est pas une grille à colonnes (.ssv-grille)');
        else {
          const rangs = {}; m.cels.forEach(c => { (rangs[c.r] = rangs[c.r] || []).push(c); });
          Object.keys(rangs).forEach(r => {
            const cs = rangs[r], haut = Math.max(...cs.map(c => c.top)), bas = Math.min(...cs.map(c => c.bot));
            if(haut >= bas - 4) dits.push('la rangée ' + r + ' de la récurrence n\'est pas d\'un seul tenant : ses cellules ne partagent aucune bande verticale'); });
          const cols = {}; m.cels.filter(c => !c.libre).forEach(c => { (cols[c.c] = cols[c.c] || []).push(c); });
          Object.keys(cols).forEach(c => {
            const xs = cols[c].map(k => k.x), ecart = Math.max(...xs) - Math.min(...xs);
            if(ecart > 3) dits.push('la colonne ' + c + ' de la récurrence n\'est pas alignée : ' + Math.round(ecart) + ' px d\'écart'); });
          /* les quatre lignes d'encadrement portent deux « ≤ » chacune, la
             chaîne des f(…) et celle des images aussi */
          [1, 2, 3, 4, 5, 6].forEach(r => { const n = m.cels.filter(c => c.le && c.r === r).length;
            if(n !== 2) dits.push('la rangée ' + r + ' de la récurrence porte ' + n + ' « ≤ » au lieu de 2'); });
          /* chaque f(…) a son image juste en dessous — même colonne, rangée suivante */
          { const f = m.cels.filter(c => c.r === 5 && !c.le && !c.libre), im = m.cels.filter(c => c.r === 6 && !c.le && !c.libre);
            if(f.length !== 3) dits.push(f.length + ' f(…) au lieu de 3 dans la démonstration');
            f.forEach(k => { const im2 = im.find(c => c.c === k.c);
              if(!im2) dits.push('le f(…) de la colonne ' + k.c + ' n\'a aucune image sous lui');
              else if(Math.abs(im2.x - k.x) > 3 || im2.top < k.bot - 2) dits.push('l\'image n\'est pas juste sous son f(…) (' + Math.round(im2.x - k.x) + ' px de côté)'); }); }
          if(m.debord > 2) dits.push('la récurrence défile de ' + m.debord + ' px à 1400 px de large');
          if(m.coupe > 0) dits.push('le bas de la récurrence est coupé par sa boîte : ' + m.coupe + ' px (les indices de la dernière rangée)');
        } }
      /* LES CHAÎNES DE f) ET DE i) TIENNENT SUR UNE LIGNE : coupée en deux, une
         chaîne d'égalités se lit comme deux calculs sans rapport. On compare la
         HAUTEUR de la rangée à celle de son plus haut enfant — jamais les
         « top », qu'une fraction et un signe centrés l'un sur l'autre rendent
         toujours différents (le piège documenté du contrôle de pleine largeur). */
      { const replis = await s.page.evaluate(() => {
          const out = [];
          ['#ssvPartF', '#ssvPartI'].forEach(sel => {
            [...document.querySelectorAll(sel + ' .sa2-row')].forEach((row, i) => {
              const r = row.getBoundingClientRect();
              let h = 0; [...row.children].forEach(k => { const b = k.getBoundingClientRect(); if(b.height > h) h = b.height; });
              if(h && r.height > h + 10) out.push(sel + ' rangée ' + (i + 1) + ' : ' + Math.round(r.height) + ' px pour un contenu de ' + Math.round(h));
            });
          });
          return out; });
        replis.forEach(r => dits.push('une chaîne se replie — ' + r)); }
      /* LA COPIE JUSTE, CLIQUÉE : la méthode se DESSINE, et l'encre des verdicts
         se MESURE — une classe posée pendant qu'une règle la peint autrement est
         un défaut de PEINTURE, et seul un navigateur le voit. */
      await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = ssvAns(q);
        q.pts = []; ssvDessiner();
        ssvCases(q).forEach(x => {
          const e = document.getElementById(x.id); if(!e) return;
          if(x.t === 'sel') e.value = x.v;
          else if(x.t === 'nb') e.value = ssvN(x.v);
          else if(x.t === 'cent') e.value = String(Math.round(x.v * 100) / 100).replace('.', ',');
          else if(x.t === 'rang') e.value = svrRangStr(x.v);
          else if(x.t === 'paire') e.value = ssvN(/1$/.test(x.id) ? x.v[0] : x.v[1]);
        });
        ssvPtsAttendus(a).forEach(e => ssvPoser(e.r, e.x));
      });
      await s.page.click('#ssvActions button.btn-primary');
      await s.page.waitForTimeout(500);
      { const fin = await s.page.evaluate(() => {
          const boite = sel => { const e = document.querySelector(sel); if(!e) return null;
            const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
          const pt = document.querySelector('#ssvGraph .svr-pt.ok circle');
          const sel1 = document.getElementById('ssv-c1');
          return { score: test.score, note: ptsEcran(),
                   esc: boite('#ssvGraph .svr-esc-sol'), lect: document.querySelectorAll('#ssvGraph .svr-lect').length,
                   bleus: document.querySelectorAll('#ssvGraph .svr-pt.ok').length,
                   encrePt: pt ? getComputedStyle(pt).fill : '',
                   encreSel: sel1 ? getComputedStyle(sel1).borderColor : '',
                   feuille: (document.getElementById('ssvSheet') || {}).className || '' }; });
        if(fin.score !== 1) dits.push('la copie juste cliquée ne vaut pas le point (score ' + fin.score + ')');
        if(!fin.note || fin.note.justes !== fin.note.cases) dits.push('la note affichée compte ' + (fin.note ? fin.note.justes + '/' + fin.note.cases : 'rien'));
        if(!fin.esc || fin.esc.w < 20 || fin.esc.h < 20) dits.push('l\'escalier vert de la méthode est dessiné mais d\'étendue presque nulle');
        if(fin.lect !== 2) dits.push(fin.lect + ' trait(s) de lecture au lieu de 2 (U1 sur l\'axe, U2 en hauteur)');
        if(fin.bleus !== 3) dits.push(fin.bleus + ' point(s) peint(s) en bleu au lieu de 3');
        if(fin.feuille.indexOf('ok') < 0) dits.push('copie juste : la feuille de d) n\'est pas marquée juste (« ' + fin.feuille + ' »)');
        [['le point juste du tracé', fin.encrePt], ['la liste juste', fin.encreSel]].forEach(([quoi, enc]) => {
          const m2 = /(\d+)\D+(\d+)\D+(\d+)/.exec(enc || '');
          if(!m2){ dits.push(quoi + ' n\'a pas d\'encre lisible'); return; }
          const c = [+m2[1], +m2[2], +m2[3]];
          if(!(c[2] >= Math.max(c[0], c[1]) && c[2] - Math.min(c[0], c[1]) >= 30)) dits.push(quoi + ' n\'est pas peint en BLEU : ' + enc); }); }
      verifier('la synthèse : l\'escalier se clique, la grille s\'aligne, les chaînes tiennent sur une ligne', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran de la synthèse ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies quindecies. {suite-tcm-limite} : la fiche choisie et tapée pour de vrai =====
       Le banc jsdom tient le tirage HONNÊTE (la suite simulée par sa propre
       arithmétique), la fiche épinglée et les deux juges. Ce qu'il ne voit pas :
       le « lim » qui porte son « n → +∞ » EN DESSOUS (un CSS perdu le mettrait
       à la suite, sur la ligne), les rangées de la fiche qui ne DÉFILENT pas
       et une page qui ne déborde pas, puis la copie de la fiche CHOISIE dans
       les vraies listes et TAPÉE dans les vraies cases, « Vérifier » cliqué,
       la note relue sur ce que le bouton enregistre et l'encre RENDUE de la
       liste juste — bleue, jamais lue à la classe. */
    titre('6 vicies quindecies. LA CONVERGENCE MONOTONE : LA FICHE CHOISIE ET TAPÉE POUR DE VRAI');
    if(!P.suiteTcmLimite){
      ignorer('le 6.12 : le « lim » est empilé, rien ne défile',
        'ce niveau n\'a pas l\'exercice du théorème de convergence monotone');
      ignorer('le 6.12 : la copie de la fiche choisie et tapée pour de vrai vaut le point',
        'ce niveau n\'a pas l\'exercice du théorème de convergence monotone');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1280, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.suiteTcmLimite.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      /* la question est ÉPINGLÉE sur l'exemple 1 de la fiche, puis le second
         visage (quadratique, décroissante) : la copie tapée doit coller à
         l'énoncé tiré */
      await s.page.evaluate(() => {
        test.questions = [{ fam: 'aff', sens: 'cr', forme: 'chaine', a: 0.5, b: 1, m: 1, M: 4 },
                          { fam: 'quad', sens: 'de', forme: 'diff', r: 2, m: 1, M: 3 }];
        test.idx = 0; test.score = 0; test.answers = []; renderTCL();
      });
      await s.page.waitForTimeout(500);
      const dominante = c => { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(c || ''); if(!m) return '?';
        const r = +m[1], v = +m[2], b = +m[3], max = Math.max(r, v, b);
        return b >= max && b > r + 20 ? 'bleu' : (v >= max && v > r + 20 ? 'vert' : (r >= max && r > v + 20 ? 'rouge' : 'autre')); };
      const mesurer = () => s.page.evaluate(() => {
        const ids = tclIds(test.questions[test.idx]);
        const cases = ids.map(id => document.getElementById(id)).filter(Boolean);
        const visibles = cases.filter(e => { const r = e.getBoundingClientRect(); return r.width > 10 && r.height > 10; }).length;
        const rows = [...document.querySelectorAll('#scr-tcl .sa2-row')];
        const defile = rows.filter(r => r.scrollWidth > r.clientWidth + 1).length;
        /* le « lim » : le mot et son « n → +∞ » sont l'un SOUS l'autre */
        const lims = [...document.querySelectorAll('#scr-tcl .tcl-lim')].map(l => {
          const petit = l.querySelector('small'); const L = l.getBoundingClientRect(), p = petit ? petit.getBoundingClientRect() : null;
          return p ? { empile: p.top >= L.top + L.height * 0.4 && p.height > 3, largeur: L.width } : { empile: false, largeur: 0 };
        });
        return { n: ids.length, cases: cases.length, visibles, rows: rows.length, defile, lims: lims.length,
                 limsPlats: lims.filter(l => !l.empile).length,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      });
      const vu = await mesurer();
      verifier('le 6.12 : les dix-huit cases sont rendues et visibles, les trois « lim » sont empilés',
        vu.n === 18 && vu.cases === 18 && vu.visibles === 18 && vu.lims === 3 && vu.limsPlats === 0,
        vu.cases + ' case(s) sur ' + vu.n + ', ' + vu.visibles + ' visible(s), ' + vu.lims + ' « lim » dont ' + vu.limsPlats + ' à plat');
      verifier('le 6.12 : le « lim » est empilé, rien ne défile',
        vu.defile === 0 && !vu.page && vu.rows >= 10, vu.defile + ' rangée(s) qui défile(nt) sur ' + vu.rows + (vu.page ? ', la page déborde' : ''));
      /* LA COPIE DE LA FICHE, choisie et tapée pour de vrai, puis le CLIC */
      const jouerCopie = async () => {
        const copie = await s.page.evaluate(() => {
          const q = test.questions[test.idx], att = tclAttendu(q);
          return tclIds(q).map(id => [id, att[id][0], att[id][0] === 'choix' ? att[id][1][0] : String(att[id][1]).replace('.', ',')]);
        });
        for(const [id, type, val] of copie){
          if(type === 'choix') await s.page.selectOption('#' + id, val);
          else { await s.page.fill('#' + id, ''); await s.page.click('#' + id); await s.page.keyboard.type(val, { delay: 10 }); }
        }
        await s.page.click('#tclActions .btn-primary');
        await s.page.waitForTimeout(500);
        return s.page.evaluate(() => {
          const ids = tclIds(test.questions[test.idx]);
          const cl = c => ids.filter(id => (document.getElementById(id) || { classList: { contains: () => false } }).classList.contains(c)).length;
          const sel = document.getElementById('tcl-thm'), inp = document.getElementById('tcl-fin');
          return { ok: cl('ok'), bad: cl('bad'), sol: cl('sol'), score: test.score, locked: test.locked,
                   encreSel: sel ? getComputedStyle(sel).borderColor : '', encreInp: inp ? getComputedStyle(inp).borderColor : '',
                   note: ((document.querySelector('#tclFeedback .note-exo') || {}).textContent || '').replace(/\s+/g, ' '),
                   suivant: ((document.querySelector('#tclActions .btn-primary') || {}).textContent || '') };
        });
      };
      const b1 = await jouerCopie();
      verifier('le 6.12 : la copie de la fiche choisie et tapée pour de vrai vaut le point',
        b1.ok === 18 && b1.bad === 0 && b1.sol === 0 && b1.score === 1 && b1.locked && /18 cases justes sur 18/.test(b1.note),
        b1.ok + ' ok, ' + b1.bad + ' bad, ' + b1.sol + ' sol, note ' + b1.score + ', « ' + b1.note + ' »' + (b1.locked ? '' : ', écran non verrouillé'));
      verifier('le 6.12 : la liste juste et la case juste sont peintes en BLEU, à l\'encre rendue',
        dominante(b1.encreSel) === 'bleu' && dominante(b1.encreInp) === 'bleu',
        'liste : ' + b1.encreSel + ' (' + dominante(b1.encreSel) + '), case : ' + b1.encreInp + ' (' + dominante(b1.encreInp) + ')');
      /* le second visage — quadratique, décroissante — par le vrai bouton « Question suivante » */
      verifier('le 6.12 : le bouton propose la question suivante', /suivante/.test(b1.suivant), '« ' + b1.suivant + ' »');
      await s.page.click('#tclActions .btn-primary');
      await s.page.waitForTimeout(500);
      const vu2 = await mesurer();
      const b2 = await jouerCopie();
      verifier('le 6.12 : la quadratique décroissante se rend et se joue de même — rien ne défile, le point est accordé',
        vu2.n === 18 && vu2.visibles === 18 && vu2.defile === 0 && !vu2.page && vu2.limsPlats === 0 && b2.ok === 18 && b2.bad === 0 && b2.score === 2 && /résultats/.test(b2.suivant),
        vu2.visibles + ' case(s) visibles, ' + vu2.defile + ' rangée(s) qui défile(nt), ' + b2.ok + ' ok, ' + b2.bad + ' bad, note ' + b2.score + ', « ' + b2.suivant + ' »');
      verifier('la convergence monotone ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies quater. {suite-vocabulaire} : la fiche se COCHE =====
       Le banc jsdom tient le tirage (refait sur les termes montrés), le juge
       et les gestes. Ce qu'il ne voit pas : le quadrillage RENDU à une taille
       lisible avec ses treize croix et la droite y = ℓ d'étendue non nulle,
       les cases à cocher CLIQUÉES pour de vrai et leur encre RÉSOLUE — juste
       en bleu, cochée à tort en rouge, oubliée en vert —, le badge de la bonne
       borne mesuré au RECTANGLE, et la page qui ne déborde ni à 1400 px ni sur
       une tablette en portrait, où la fiche passe sous le dessin. */
    titre('6 tricies quater. VOCABULAIRE SUR LES SUITES : LA FICHE SE COCHE');
    if(!P.suiteVocabulaire){
      ignorer('la fiche du vocabulaire se coche, et ses couleurs disent le verdict',
        'ce niveau n\'a pas l\'exercice du vocabulaire sur les suites');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 950 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.suiteVocabulaire.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(700);
      const dits = [];
      /* on ÉPINGLE l'exemple 1 de la fiche : la mesure ne doit pas dépendre du tirage */
      await s.page.evaluate(q => { test.questions[test.idx] = q; test.locked = false; renderSVQ(); },
        { fam: 'decconv', L: 1, A: 3, q: 0.8, rep: {} });
      await s.page.waitForTimeout(300);
      const geo = await s.page.evaluate(() => {
        const svg = document.querySelector('#svqGraph svg'); if(!svg) return { manque: true };
        const r = svg.getBoundingClientRect();
        const croix = [...svg.querySelectorAll('.svq-terme')].filter(g => { const b = g.getBoundingClientRect(); return b.width > 4 && b.height > 4; }).length;
        const lim = svg.querySelector('.svq-lim'); const lr = lim ? lim.getBoundingClientRect() : null;
        /* la hauteur d'une RANGÉE rendue, lue entre les graduations de l'axe des
           ordonnées : un dessin de cinq rangées est court sans être illisible */
        const ys = [...svg.querySelectorAll('.svq-ax[text-anchor="end"]')].map(t => t.getBoundingClientRect().top).sort((a, b) => a - b);
        const rangee = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : 0;
        return { manque: false, w: Math.round(r.width), h: Math.round(r.height), croix, lim: lr ? Math.round(lr.width) : 0,
                 rangee: Math.round(rangee), deborde: document.documentElement.scrollWidth > window.innerWidth + 1 };
      });
      if(geo.manque) dits.push('aucun quadrillage rendu');
      else {
        if(geo.w < 420) dits.push('le quadrillage est rendu à ' + geo.w + ' px de large : les graduations ne se lisent plus');
        if(geo.rangee < 24) dits.push('une rangée du quadrillage fait ' + geo.rangee + ' px : les graduations ne se lisent plus');
        if(geo.croix !== 13) dits.push(geo.croix + ' croix rendues au lieu de 13');
        if(geo.lim < 300) dits.push('la droite y = 1 n\'a pas d\'étendue (' + geo.lim + ' px)');
        if(geo.deborde) dits.push('la page déborde à 1400 px');
      }
      /* les cases se COCHENT au clic, et la valeur ne s'ouvre qu'avec sa case */
      const coche = async (grp, val) => {
        await s.page.click('#svqForm .svq-coche[data-grp="' + grp + '"]' + (val ? '[data-val="' + val + '"]' : '')); };
      const ferme = await s.page.$eval('#svq-maj', e => e.disabled);
      await coche('sens', 'dec'); await coche('maj'); await coche('min'); await coche('lim', 'a'); await coche('nat', 'div');
      const ouvert = await s.page.$eval('#svq-maj', e => !e.disabled);
      if(!ferme || !ouvert) dits.push('la valeur du majorant n\'est pas fermée avant le clic sur « majorée » et ouverte après');
      await s.page.fill('#svq-maj', '3'); await s.page.fill('#svq-min', '1'); await s.page.fill('#svq-lim', '1');
      await s.page.click('#svqActions button.btn-primary');
      await s.page.waitForTimeout(400);
      /* l'encre RÉSOLUE, comparée aux variables de la convention — jamais à une classe */
      const enc = await s.page.evaluate(() => {
        const probe = document.createElement('span'); document.body.appendChild(probe);
        const par = v => { probe.style.color = 'var(' + v + ')'; return getComputedStyle(probe).color; };
        const ref = { bleu: par('--blue'), rouge: par('--red'), vert: par('--green') }; probe.remove();
        const box = sel => { const e = document.querySelector(sel + ' .svq-box'); if(!e) return null;
          const cs = getComputedStyle(e); return { bord: cs.borderTopColor, fond: cs.backgroundColor, style: cs.borderTopStyle }; };
        const badge = document.querySelector('#svq-maj + .mf-cor'); const br = badge ? badge.getBoundingClientRect() : null;
        return { ref, juste: box('#svq-g-sens .svq-coche[data-val="dec"]'), tort: box('#svq-g-nat .svq-coche[data-val="div"]'),
                 oubli: box('#svq-c-bor'), bonne: box('#svq-g-nat .svq-coche[data-val="conv"]'),
                 badge: br ? { w: Math.round(br.width), txt: badge.textContent } : null,
                 score: test.score, cases: (test.answers[0] || {}).cases };
      });
      if(enc.score !== 0) dits.push('la copie fausse vaut le point');
      if(enc.cases !== 9) dits.push('la note compte ' + enc.cases + ' cases au lieu de 9');
      if(!enc.juste || enc.juste.bord !== enc.ref.bleu) dits.push('la case cochée juste n\'a pas le bord BLEU de la convention (' + (enc.juste && enc.juste.bord) + ')');
      if(!enc.tort || enc.tort.fond !== enc.ref.rouge) dits.push('la case cochée à tort n\'a pas le fond ROUGE de la convention (' + (enc.tort && enc.tort.fond) + ')');
      if(!enc.oubli || enc.oubli.bord !== enc.ref.vert || enc.oubli.style !== 'dashed') dits.push('la case oubliée « bornée » n\'a pas le bord VERT pointillé de la correction');
      if(!enc.bonne || enc.bonne.bord !== enc.ref.vert) dits.push('la bonne nature non choisie n\'est pas montrée en vert');
      if(!enc.badge || enc.badge.w < 8 || enc.badge.txt.trim() !== '4') dits.push('la bonne borne (4) ne s\'affiche pas à côté de la valeur fausse');
      /* sur une tablette en portrait, la fiche passe sous le dessin sans déborder */
      await s.page.setViewportSize({ width: 820, height: 1180 });
      await s.page.waitForTimeout(300);
      const tab = await s.page.evaluate(() => {
        const g = document.querySelector('#svqGraph svg').getBoundingClientRect(), f = document.getElementById('svqForm').getBoundingClientRect();
        return { deborde: document.documentElement.scrollWidth > window.innerWidth + 1, svgW: Math.round(g.width), dessous: f.top >= g.bottom - 2 };
      });
      if(tab.deborde) dits.push('la page déborde sur une tablette en portrait');
      if(tab.svgW > 820 || tab.svgW < 300) dits.push('sur tablette le quadrillage fait ' + tab.svgW + ' px');
      if(!tab.dessous) dits.push('sur tablette la fiche ne passe pas sous le dessin');
      verifier('la fiche du vocabulaire se coche, et ses couleurs disent le verdict', !dits.length, dits.slice(0, 3).join(' | '));

      /* ----- ET LA BULLE « COMPRENDRE MON ERREUR » SE POSE À CÔTÉ DE LA CASE
         COCHÉE (demande de Turquet, septembre 2026 : « faire aussi la bulle
         pour le 6.14 »). jsdom tient le MÉCANISME sur une case posée à la
         main ; ici c'est le GESTE — le mode soutien, les vraies cases
         cliquées, un vrai clic sur « Vérifier » — et le RECTANGLE, jamais la
         propriété hidden ([hidden] pose display:none depuis la feuille du
         NAVIGATEUR, le piège documenté). Le bord qui compte est celui du pavé
         numérique : les trois choix d'un groupe vivent sur UNE rangée, et une
         bulle posée sur la case d'à côté rendrait incliquable celle que
         l'élève doit corriger. ----- */
      await s.page.setViewportSize({ width: 1400, height: 950 });
      await s.page.waitForTimeout(200);
      const dits2 = [];
      await s.page.evaluate(() => { bexpMasquer(); currentMode = 'soutien'; test.locked = false; });
      await s.page.evaluate(id => openTest(id), P.suiteVocabulaire.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(700);
      /* on ÉPINGLE le même exemple : la mesure ne dépend pas du tirage */
      await s.page.evaluate(q => { test.questions[test.idx] = q; test.locked = false; renderSVQ(); },
        { fam: 'decconv', L: 1, A: 3, q: 0.8, rep: {} });
      await s.page.waitForTimeout(300);
      /* une seule réponse, FAUSSE : « croissante » sur une suite décroissante */
      await s.page.click('#svqForm .svq-coche[data-grp="sens"][data-val="cro"]');
      await s.page.click('#svqActions button.btn-primary');
      await s.page.waitForTimeout(600);
      const bul = await s.page.evaluate(() => {
        const b = document.getElementById('bexpBulle');
        const r = b ? b.getBoundingClientRect() : null;
        const anc = (typeof bexpCase !== 'undefined') ? bexpCase : null;
        const ra = anc ? anc.getBoundingClientRect() : null;
        const chev = (a, o) => !(a.right <= o.left || a.left >= o.right ||
                                 a.bottom <= o.top || a.top >= o.bottom);
        /* aucune AUTRE case à cocher, aucune case, aucun bouton sous la bulle */
        const couvertes = (!r || !anc) ? -1 : [...document.querySelectorAll(
          '.screen.on input,.screen.on select,.screen.on math-field,' +
          '.screen.on [role="checkbox"],.screen.on .pts-case,.screen.on button')]
          .filter(e => e !== anc && !e.contains(anc) && !b.contains(e))
          .map(e => e.getBoundingClientRect())
          .filter(o => o.width > 0 && o.height > 0 && chev(r, o)).length;
        const cmd = document.getElementById('testCtrls');
        const rc = cmd ? cmd.getBoundingClientRect() : null;
        /* LA POINTE EST LUE SUR LE PSEUDO-ÉLÉMENT, jamais recalculée depuis
           --bexp-fx : la recalculer, c'est mesurer sa propre arithmétique et
           rester vert sur une feuille de styles qui dessine la flèche
           ailleurs — le piège documenté du « - 10px ». Le triangle est une
           boîte de 20 px dont la pointe tombe 10 px dedans ; getComputedStyle
           rend les décalages EN USAGE, donc top et left valent l'offset réel
           même là où la règle pose bottom ou right. */
        const cote = (b && b.dataset.bexpCote) || '';
        const ps = (b && cote) ? getComputedStyle(b, '::before') : null;
        let pointe = null;
        if(r && cote && ps){
          const nb = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };
          let bx = nb(ps.left), by = nb(ps.top);
          if(bx === null){ const rr = nb(ps.right); if(rr !== null) bx = r.width - rr - 20; }
          if(by === null){ const bb = nb(ps.bottom); if(bb !== null) by = r.height - bb - 20; }
          if(bx !== null && by !== null) pointe = { x: r.left + bx + 10, y: r.top + by + 10 };
        }
        const btn = b && b.querySelector('[data-bexp-btn]');
        return {
          role: anc ? (anc.getAttribute('role') || '') : '',
          grp: anc ? (anc.getAttribute('data-grp') || '') + '=' + (anc.getAttribute('data-val') || '') : '',
          rouge: !!anc && anc.classList.contains('bad'),
          visible: !!r && r.width > 0 && r.height > 0,
          l: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
          bouton: !!btn && !btn.hidden, val: (typeof bexpVal !== 'undefined') ? bexpVal : '',
          cote: cote, couvertes: couvertes,
          surCommandes: (r && rc) ? chev(r, rc) : false,
          ecart: (pointe && ra) ? Math.round(Math.max(0,
            Math.max(ra.left - pointe.x, pointe.x - ra.right, ra.top - pointe.y, pointe.y - ra.bottom))) : -1,
          centre: (pointe && ra) ? Math.round(Math.abs(
            ((cote === 'droite' || cote === 'gauche') ? pointe.y - (ra.top + ra.bottom) / 2
                                                     : pointe.x - (ra.left + ra.right) / 2))) : -1,
          /* et la flèche DESSINÉE : un CSS perdu la ferait disparaître sans
             qu'une erreur ne se lève, et la bulle serait « à côté » sans rien
             désigner. */
          fleche: ps ? Math.round(parseFloat(
            ps['border' + ({ droite:'Right', gauche:'Left', haut:'Top', bas:'Bottom' }[cote] || 'Top') + 'Width']) || 0) : 0,
        };
      });
      if(bul.role !== 'checkbox') dits2.push('la bulle n\'est pas ancrée sur une case à cocher (role « ' + bul.role + ' »)');
      if(!bul.rouge) dits2.push('la case ancre n\'est pas rouge : le contrôle ne mesure rien');
      if(!bul.visible) dits2.push('la bulle n\'a aucun rectangle : elle ne s\'affiche pas');
      if(!bul.bouton) dits2.push('le bouton « Comprendre mon erreur » n\'est pas offert');
      if(bul.val !== 'Croissante.') dits2.push('la saisie lue est « ' + bul.val + ' » et non le libellé de la case cochée');
      if(!bul.cote) dits2.push('la bulle est retombée au COIN : sa flèche ne désigne plus la case');
      if(bul.couvertes !== 0) dits2.push(bul.couvertes + ' case(s) ou bouton(s) sous la bulle');
      if(bul.surCommandes) dits2.push('la bulle recouvre les commandes du bas');
      if(bul.cote && (bul.ecart < 0 || bul.ecart > 8)) dits2.push('la pointe tombe à ' + bul.ecart + ' px de la case cochée');
      if(bul.cote && (bul.centre < 0 || bul.centre > 3)) dits2.push('la pointe est à ' + bul.centre + ' px du centre de la case');
      if(bul.cote && bul.fleche < 8) dits2.push('la flèche n\'est pas dessinée (' + bul.fleche + ' px)');
      verifier('en soutien, la bulle « Comprendre mon erreur » se pose à côté de la case COCHÉE, flèche sur elle',
        !dits2.length, dits2.slice(0, 3).join(' | ') + ' — mesuré ' + JSON.stringify(bul));

      verifier('l\'écran du vocabulaire sur les suites ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies quinquies. la suite par la DIFFÉRENCE : le repère partagé, la fraction tapée ===== */
    /* {suite-variation-difference} : le repère et ses deux rails sont ceux du
       6.11, servis dans un AUTRE hôte (svrHote choisit par le kind) — jsdom ne
       clique pas, seul celui-ci voit que le clic pose bien dans cet écran-là.
       Puis ce que jsdom ne peut pas lire : la fraction de d) TAPÉE dans un vrai
       MathLive (U, indice, exposant — la sérialisation réelle que le juge doit
       relire comme une fonction de Uₙ), les deux grilles à colonnes RENDUES
       (les « ≤ » au même centre d'une rangée à l'autre, Uₙ₊₁ sous les termes,
       rien qui défile à 1400 px), le tableau de signes avec une BOÎTE, et la
       copie juste cliquée qui vaut le point. */
    titre('6 tricies quinquies. LA SUITE PAR LA DIFFÉRENCE : LE REPÈRE PARTAGÉ, LA FRACTION TAPÉE');
    if(!P.suiteVariationDifference){
      ignorer('la suite par la différence : le clic pose dans son repère, la fraction tapée se relit',
        'ce niveau n\'a pas l\'exercice du sens de variation par la différence');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 950 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.suiteVariationDifference.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* on ÉPINGLE le cas de la fiche : U0 = 0, 0 ≤ Un ≤ 1, la suite croît */
      await s.page.evaluate(() => {
        test.questions[test.idx] = { l:1, L:3, U0:0, sens:'cro', ordreLab:['un','num','cst','den','un1'], pts:[] };
        renderSVD();
      });
      await s.page.waitForTimeout(600);
      { const g = await s.page.evaluate(() => {
          const svg = document.querySelector('#svdGraph svg'), autre = document.querySelector('#svrGraph svg');
          const r = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
          return { w: Math.round(r.width), h: Math.round(r.height), rails: document.querySelectorAll('#svdGraph .svr-hit').length,
                   autre: !!autre, deborde: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 }; });
        if(g.w < 420 || g.h < 420) dits.push('le repère est rendu à ' + g.w + ' × ' + g.h + ' px dans l\'hôte svd');
        if(g.rails !== 2) dits.push(g.rails + ' rail(s) cliquable(s) dans l\'hôte svd au lieu de 2');
        if(g.autre) dits.push('le repère s\'est dessiné dans l\'hôte du 6.11 (svrGraph) au lieu du sien');
        if(g.deborde) dits.push('la page déborde horizontalement à 1400 px'); }
      const posRail = async (rail, x) => await s.page.evaluate(([rail, x]) => {
        const svg = document.querySelector('#svdGraph svg');
        svg.scrollIntoView({ block: 'center' });
        const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = r.width / vb.width;
        const a = svrAns(test.questions[test.idx]);
        const y = (rail === 'c') ? svrFn(a)(x) : x;
        return { px: r.left + (SVR_PADL + x * SVR_PLOT / a.W) * k, py: r.top + (SVR_PADT + SVR_PLOT - y * SVR_PLOT / a.W) * k };
      }, [rail, x]);
      const clicRail = async (rail, x) => { const p = await posRail(rail, x); await s.page.mouse.click(p.px, p.py); await s.page.waitForTimeout(140); };
      const A = await s.page.evaluate(() => { const a = svdAns(test.questions[test.idx]); return { U0: a.U0, U1: a.U1 }; });
      await clicRail('c', A.U0); await clicRail('d', A.U1); await clicRail('c', A.U1);
      { const p = await s.page.evaluate(() => {
          const q = test.questions[test.idx], a = svdAns(q);
          return { n: (q.pts || []).length, rails: (q.pts || []).map(x => x.r).join(''),
                   verd: [0, 1, 2].map(i => svrPtJuste(a, i, (q.pts || [])[i])), dessines: document.querySelectorAll('#svdGraph .svr-pt').length }; });
        if(p.n !== 3) dits.push('trois clics sur le repère de cet écran posent ' + p.n + ' point(s)');
        else { if(p.rails !== 'cdc') dits.push('les clics tombent sur les rails « ' + p.rails + ' » au lieu de « cdc »');
               if(!p.verd.every(Boolean)) dits.push('les trois points cliqués sont jugés ' + JSON.stringify(p.verd)); }
        if(p.dessines !== 3) dits.push(p.dessines + ' point(s) dessiné(s) dans l\'hôte svd après trois clics'); }
      /* LA FRACTION DE d) EST TAPÉE POUR DE VRAI : U, son indice, l'exposant — la
         sérialisation réelle de MathLive, que jsdom n'a pas, doit se relire comme
         une fonction de Uₙ, et comme une forme DÉVELOPPÉE */
      { const boite = await s.page.evaluate(() => { const e = document.getElementById('svd-e4n'); if(!e) return null;
          const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), police: parseFloat(getComputedStyle(e).fontSize) }; });
        if(!boite || boite.w < 60 || boite.h < 20) dits.push('le champ de la dernière ligne de d) n\'a pas de boîte');
        else {
          if(boite.police < 18) dits.push('le champ de d) écrit à ' + boite.police + ' px, plus petit que sa rangée');
          await s.page.click('#svd-e4n');
          await s.page.waitForTimeout(400);   /* le piège documenté du 6.8 : les premières frappes tombent dans le vide */
          await s.page.keyboard.type('U_n', { delay: 50 }); await s.page.keyboard.press('ArrowRight');
          await s.page.keyboard.type('^2', { delay: 50 }); await s.page.keyboard.press('ArrowRight');
          await s.page.keyboard.type('-4U_n', { delay: 50 }); await s.page.keyboard.press('ArrowRight');
          await s.page.keyboard.type('+3', { delay: 50 });
          await s.page.waitForTimeout(300);
          const t = await s.page.evaluate(() => { const a = svdAns(test.questions[test.idx]);
            const plain = svdMfPlain('svd-e4n'); return { plain, fn: svdFnOk(plain, svdTrin(a)), dev: svdDevOk(plain, svdTrin(a)) }; });
          if(!t.fn) dits.push('le trinôme TAPÉ n\'est pas relu comme une fonction de Uₙ (lu : « ' + t.plain + ' »)');
          else if(!t.dev) dits.push('le trinôme TAPÉ, développé, est refusé comme non développé (lu : « ' + t.plain + ' »)');
        } }
      /* LES GRILLES RENDUES : même colonne → même centre, chaque rangée d'un seul
         tenant, rien ne défile à 1400 px (un display:grid perdu laisse toutes les
         classes en place et met tout à la file) */
      const mesurer = async () => await s.page.evaluate(() => {
        const lire = g => {
          const cels = [...g.querySelectorAll('.svr-cel')].map(c => {
            const rg = document.createRange(); rg.selectNodeContents(c); const r = rg.getBoundingClientRect();
            return { r: +c.dataset.r, c: +c.dataset.c, x: (r.left + r.right) / 2, top: r.top, bot: r.bottom,
                     libre: c.classList.contains('svr-lib') || c.classList.contains('svr-suite') || c.classList.contains('svr-just') }; });
          const sc = g.parentElement;
          return { cels, debord: Math.round(sc.scrollWidth - sc.clientWidth), coupe: Math.round(sc.scrollHeight - sc.clientHeight) }; };
        const gi = document.querySelector('#svdPartC .svd-grec'), gd = document.querySelector('#svdPartC .svd-gdemo');
        const tbl = document.querySelector('#svdPartE table.svd-tbl');
        const tr = tbl ? tbl.getBoundingClientRect() : null;
        return { init: gi ? lire(gi) : null, demo: gd ? lire(gd) : null, tbl: tr ? { w: Math.round(tr.width), h: Math.round(tr.height) } : null,
                 sg: [...document.querySelectorAll('#svdPartE select.svd-sg')].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.width * r.height); }) };
      });
      const juger = (m, nom) => {
        if(!m.init) { dits.push(nom + ' : la récurrence n\'est pas une grille à colonnes (.svd-grec)'); return; }
        if(!m.demo) { dits.push(nom + ' : la démonstration n\'est pas une grille à colonnes (.svd-gdemo)'); return; }
        [['la récurrence', m.init], ['la démonstration', m.demo]].forEach(([quoi, g]) => {
          const rangs = {}; g.cels.forEach(c => { (rangs[c.r] = rangs[c.r] || []).push(c); });
          Object.keys(rangs).forEach(r => { const cs = rangs[r], haut = Math.max(...cs.map(c => c.top)), bas = Math.min(...cs.map(c => c.bot));
            if(haut >= bas - 4) dits.push(nom + ' : la rangée ' + r + ' de ' + quoi + ' n\'est pas d\'un seul tenant'); });
          const cols = {}; g.cels.filter(c => !c.libre).forEach(c => { (cols[c.c] = cols[c.c] || []).push(c); });
          Object.keys(cols).forEach(c => { const xs = cols[c].map(k => k.x), ecart = Math.max(...xs) - Math.min(...xs);
            if(ecart > 3) dits.push(nom + ' : la colonne ' + c + ' de ' + quoi + ' n\'est pas alignée : ' + Math.round(ecart) + ' px d\'écart'); });
          if(g.debord > 2) dits.push(nom + ' : ' + quoi + ' défile de ' + g.debord + ' px à 1400 px');
          if(g.coupe > 0) dits.push(nom + ' : le bas de ' + quoi + ' est coupé par sa boîte (' + g.coupe + ' px)');
        });
        if(!m.tbl || m.tbl.w < 200 || m.tbl.h < 60) dits.push(nom + ' : le tableau de signes n\'a pas de boîte');
        if(m.sg.length !== 3 || m.sg.some(a => a < 400)) dits.push(nom + ' : les trois listes de signe ne sont pas toutes rendues (' + m.sg.join(', ') + ')');
      };
      juger(await mesurer(), 'suite croissante');
      /* la copie juste, CLIQUÉE : la note se lit sur ce que le bouton enregistre */
      await s.page.evaluate(() => {
        const q = test.questions[test.idx], V = svdVerdicts(q), a = svdAns(q);
        SVD_IDS.forEach(id => { if(id === 'svd-e4n') return; const e = document.getElementById(id); if(!e) return;
          if(e.tagName === 'MATH-FIELD') e.setValue(V.cor[id].tex); else e.value = V.cor[id]; });
        q.pts = []; svrPtsAttendus(a).forEach(e => svrPoser(e.r, e.x));
      });
      await s.page.click('#svdActions button.btn-primary');
      await s.page.waitForTimeout(400);
      { const fin = await s.page.evaluate(() => {
          const boite = sel => { const e = document.querySelector(sel); if(!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
          const rouges = SVD_IDS.filter(id => document.getElementById(id).classList.contains('bad'));
          const sel = document.getElementById('svd-s3');
          return { score: test.score, note: ptsEcran(), rouges, esc: boite('#svdGraph .svr-esc-sol'),
                   bleus: document.querySelectorAll('#svdGraph .svr-pt.ok').length, encre: sel ? getComputedStyle(sel).borderTopColor : '' }; });
        if(fin.score !== 1) dits.push('la copie juste cliquée ne vaut pas le point (score ' + fin.score + (fin.rouges.length ? ', rouges : ' + fin.rouges.slice(0, 3).join(', ') : '') + ')');
        if(!fin.note || fin.note.justes !== fin.note.cases) dits.push('la note affichée compte ' + (fin.note ? fin.note.justes + '/' + fin.note.cases : 'rien'));
        if(!fin.esc || fin.esc.w < 20 || fin.esc.h < 20) dits.push('l\'escalier vert de la méthode n\'a pas d\'étendue');
        if(fin.bleus !== 3) dits.push(fin.bleus + ' point(s) peint(s) en bleu au lieu de 3');
        { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(fin.encre || '');
          if(m){ const c = [+m[1], +m[2], +m[3]]; if(!(c[2] >= Math.max(c[0], c[1]))) dits.push('la liste juste du tableau de signes n\'est pas bordée de bleu : ' + fin.encre); } } }
      /* LE VISAGE DÉCROISSANT, rendu pour de vrai : c'est lui dont la dernière ligne
         déborde à DROITE (m ≤ Uₙ₊₁ ≤ f(M) ≤ M) */
      await s.page.evaluate(() => {
        const vd = svrVivier('dec')[0];
        test.questions[test.idx] = { l: vd.l, L: vd.L, U0: vd.U0, sens: 'dec', pts: [] }; test.locked = false;
        renderSVD();
      });
      await s.page.waitForTimeout(500);
      juger(await mesurer(), 'suite décroissante');
      verifier('la suite par la différence : le clic pose dans son repère, la fraction tapée se relit', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran de la suite par la différence ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies decies. {python-affichage} : prédire, puis exécuter =====
       Le banc jsdom tient l'interpréteur (comparé à un vrai CPython), le
       tirage, le juge et les portes. Ce qu'il ne voit pas : le code et la
       console RENDUS à chasse fixe (une police perdue dans la cascade ferait
       lire un programme en Nunito), le bouton « Exécuter » vraiment inerte
       sous un VRAI clic tant que rien n'est vérifié, la page qui ne déborde
       pas, et la console mesurée au RECTANGLE une fois exécutée — jamais à
       une propriété. Il CHOISIT dans les trois listes pour de vrai, clique
       Vérifier puis Exécuter, relit la sortie à l'écran, puis rejoue le bord
       du soutien : une copie fausse laisse le bouton verrouillé. */
    titre('6 vicies decies. QU\'AFFICHE CE PROGRAMME ? PRÉDIRE, PUIS EXÉCUTER');
    if(!P.pythonAffichage){
      ignorer('le programme se prédit, puis s\'exécute', 'ce niveau n\'a pas l\'exercice Python');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonAffichage.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const avant = await s.page.evaluate(() => {
        const code = document.querySelector('#pyHost .py-code'), cons = document.getElementById('pyConsole'), run = document.getElementById('pyRun');
        const fam = el => getComputedStyle(el).fontFamily;
        const cr = code.getBoundingClientRect(), kr = cons.getBoundingClientRect(), rr = run.getBoundingClientRect();
        return { police: fam(code), codeVisible: cr.width > 200 && cr.height > 60, consoleVisible: kr.height > 20,
                 runDisabled: run.disabled, runVisible: rr.width > 40 && rr.height > 20,
                 texte: code.textContent, src: test.questions[0].src,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 listes: document.querySelectorAll('#pyHost select.py-sel').length };
      });
      verifier('le code est rendu à chasse fixe, à une taille lisible', /mono|menlo|consolas|courier/i.test(avant.police) && avant.codeVisible, avant.police);
      verifier('le code affiché est le programme de la question', avant.texte === avant.src, JSON.stringify(avant.texte));
      verifier('« Exécuter » est visible et verrouillé tant que rien n\'est vérifié', avant.runDisabled && avant.runVisible, '');
      verifier('la phrase porte ses trois listes, et la page ne déborde pas à 1400 px', avant.listes === 3 && !avant.page, avant.listes + ' liste(s)');
      /* un VRAI clic sur le bouton verrouillé ne fait rien */
      await s.page.click('#pyRun', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const cons0 = await s.page.evaluate(() => document.getElementById('pyConsole').textContent);
      verifier('un clic sur le bouton verrouillé ne remplit pas la console', cons0 === '', JSON.stringify(cons0));
      /* on CHOISIT juste, dans les vraies listes */
      const bon = await s.page.evaluate(() => pyAns(test.questions[0]));
      await s.page.selectOption('#py-s-t', bon.texte);
      await s.page.selectOption('#py-s-v', bon.valeur);
      await s.page.selectOption('#py-s-n', bon.variable);
      await s.page.click('#pyValidate');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(() => ({
        ok: document.querySelectorAll('#pyHost select.ok').length, score: test.score,
        runDisabled: document.getElementById('pyRun').disabled,
        focus: document.activeElement && document.activeElement.id,
        suivant: !!document.getElementById('pyNext') }));
      verifier('les trois listes choisies justes sont peintes ok et valent 3', apres.ok === 3 && apres.score === 3, apres.ok + ' ok, note ' + apres.score);
      verifier('« Exécuter » se débloque et reçoit le focus', !apres.runDisabled && apres.focus === 'pyRun', 'focus sur ' + apres.focus);
      verifier('« Question suivante » attend l\'exécution', !apres.suivant, '');
      await s.page.click('#pyRun');
      await s.page.waitForTimeout(300);
      const fin = await s.page.evaluate(() => {
        const cons = document.getElementById('pyConsole'), r = cons.getBoundingClientRect();
        return { texte: cons.textContent, attendu: pyRun(test.questions[0].src).out.trim(), visible: r.height > 20 && r.width > 100,
                 police: getComputedStyle(cons).fontFamily, suivant: !!document.getElementById('pyNext'),
                 runDisabled: document.getElementById('pyRun').disabled };
      });
      verifier('la console montre la sortie du programme, à chasse fixe, dans un cadre visible',
        fin.texte === fin.attendu && fin.visible && /mono|menlo|consolas|courier/i.test(fin.police), JSON.stringify(fin.texte) + ' / ' + fin.police);
      verifier('après l\'exécution, « Question suivante » apparaît et « Exécuter » se referme', fin.suivant && fin.runDisabled, '');
      /* le bord du soutien : une copie fausse laisse le bouton verrouillé — la sortie EST la réponse */
      await s.page.evaluate(id => openTest(id), P.pythonAffichage.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const faux = await s.page.evaluate(() => { const q = test.questions[0], a = pyAns(q); return { t: a.texte, v: q.opt.v.filter(x => x !== a.valeur)[0], n: a.variable }; });
      await s.page.selectOption('#py-s-t', faux.t); await s.page.selectOption('#py-s-v', faux.v); await s.page.selectOption('#py-s-n', faux.n);
      await s.page.click('#pyValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => ({ bad: document.querySelectorAll('#pyHost select.bad').length,
        runDisabled: document.getElementById('pyRun').disabled, console: document.getElementById('pyConsole').textContent }));
      verifier('en soutien, la copie fausse rougit sa case et laisse « Exécuter » verrouillé', sout.bad === 1 && sout.runDisabled && sout.console === '',
        sout.bad + ' rouge(s), verrouillé : ' + sout.runDisabled);
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies undecies. {python-types} : le cours en trois cadres, puis type() =====
       Le banc jsdom tient l'interpréteur (type() comparé à un vrai CPython),
       le tirage, le juge et les portes. Ce qu'il ne voit pas : les trois
       cadres du cours RENDUS — mesurés au rectangle, une règle CSS perdue les
       ferait disparaître sans qu'aucune classe ne manque —, le code et la
       console à chasse fixe, le bouton « Exécuter » vraiment inerte sous un
       VRAI clic, et la page qui ne déborde ni à 1400 px ni à la largeur d'un
       téléphone, où les trois cadres s'empilent. Il CHOISIT dans les trois
       listes pour de vrai, clique Vérifier puis Exécuter, relit les trois
       <class '…'> à l'écran, puis rejoue le bord du soutien. */
    titre('6 vicies undecies. INT, FLOAT OU STR ? LE COURS EN TROIS CADRES, PUIS TYPE()');
    if(!P.pythonTypes){
      ignorer('le cours en trois cadres, puis type()', 'ce niveau n\'a pas l\'exercice des types Python');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonTypes.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const avant = await s.page.evaluate(() => {
        const code = document.querySelector('#ptyHost .py-code'), cons = document.getElementById('ptyConsole'), run = document.getElementById('ptyRun');
        const cadres = [...document.querySelectorAll('#ptyHost .pty-type')].map(e => e.getBoundingClientRect());
        const fam = el => getComputedStyle(el).fontFamily;
        const cr = code.getBoundingClientRect(), kr = cons.getBoundingClientRect(), rr = run.getBoundingClientRect();
        const lignes = [...document.querySelectorAll('#ptyHost .pty-ligne')].map(e => e.getBoundingClientRect());
        return { police: fam(code), codeVisible: cr.width > 200 && cr.height > 60, consoleVisible: kr.height > 20,
                 runDisabled: run.disabled, runVisible: rr.width > 40 && rr.height > 20,
                 texte: code.textContent, src: test.questions[0].src,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 cadres: cadres.map(r => Math.round(r.width) + 'x' + Math.round(r.height)),
                 cadresVisibles: cadres.length === 3 && cadres.every(r => r.width > 200 && r.height > 60),
                 cadresCoteACote: cadres.length === 3 && Math.abs(cadres[0].top - cadres[2].top) < 4,
                 lignes: lignes.length, lignesHautes: lignes.every(r => r.height > 30 && r.height < 120),
                 listes: document.querySelectorAll('#ptyHost select.py-sel').length };
      });
      verifier('les trois cadres du cours sont rendus côte à côte, à une taille lisible', avant.cadresVisibles && avant.cadresCoteACote, avant.cadres.join(' / '));
      verifier('le code est rendu à chasse fixe, à une taille lisible', /mono|menlo|consolas|courier/i.test(avant.police) && avant.codeVisible, avant.police);
      verifier('le code affiché est le programme de la question', avant.texte === avant.src, JSON.stringify(avant.texte));
      verifier('« Exécuter » est visible et verrouillé tant que rien n\'est vérifié', avant.runDisabled && avant.runVisible, '');
      verifier('les trois lignes « … est de type » portent leur liste, chacune d\'un seul tenant, et la page ne déborde pas à 1400 px',
        avant.listes === 3 && avant.lignes === 3 && avant.lignesHautes && !avant.page, avant.listes + ' liste(s), ' + avant.lignes + ' ligne(s)');
      /* un VRAI clic sur le bouton verrouillé ne fait rien */
      await s.page.click('#ptyRun', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const cons0 = await s.page.evaluate(() => document.getElementById('ptyConsole').textContent);
      verifier('un clic sur le bouton verrouillé ne remplit pas la console', cons0 === '', JSON.stringify(cons0));
      /* on CHOISIT juste, dans les vraies listes */
      const bon = await s.page.evaluate(() => { const q = test.questions[0], a = ptyAns(q); return ptyCases(q).map(c => ({ id: c.id, t: a.types[c.nom] })); });
      for(const c of bon) await s.page.selectOption('#' + c.id, c.t);
      await s.page.click('#ptyValidate');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(() => ({
        ok: document.querySelectorAll('#ptyHost select.ok').length, score: test.score,
        runDisabled: document.getElementById('ptyRun').disabled,
        focus: document.activeElement && document.activeElement.id,
        suivant: !!document.getElementById('ptyNext') }));
      verifier('les trois listes choisies justes sont peintes ok et valent 3', apres.ok === 3 && apres.score === 3, apres.ok + ' ok, note ' + apres.score);
      verifier('« Exécuter » se débloque et reçoit le focus', !apres.runDisabled && apres.focus === 'ptyRun', 'focus sur ' + apres.focus);
      verifier('« Question suivante » attend l\'exécution', !apres.suivant, '');
      await s.page.click('#ptyRun');
      await s.page.waitForTimeout(300);
      const fin = await s.page.evaluate(() => {
        const cons = document.getElementById('ptyConsole'), r = cons.getBoundingClientRect();
        return { texte: cons.textContent, attendu: pyRun(test.questions[0].src).out.trim(), visible: r.height > 40 && r.width > 100,
                 police: getComputedStyle(cons).fontFamily, suivant: !!document.getElementById('ptyNext'),
                 runDisabled: document.getElementById('ptyRun').disabled };
      });
      verifier('la console montre les trois <class \'…\'> de Python, à chasse fixe, dans un cadre visible',
        fin.texte === fin.attendu && (fin.texte.match(/<class '/g) || []).length === 3 && fin.visible && /mono|menlo|consolas|courier/i.test(fin.police),
        JSON.stringify(fin.texte) + ' / ' + fin.police);
      verifier('après l\'exécution, « Question suivante » apparaît et « Exécuter » se referme', fin.suivant && fin.runDisabled, '');
      /* à la largeur d'un téléphone, les cadres s'empilent et rien ne déborde */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const cadres = [...document.querySelectorAll('#ptyHost .pty-type')].map(e => e.getBoundingClientRect());
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 empiles: cadres.length === 3 && cadres[1].top >= cadres[0].bottom - 1 && cadres[2].top >= cadres[1].bottom - 1,
                 larges: cadres.every(r => r.width > 250 && r.right <= 391) };
      });
      verifier('sur un téléphone, les trois cadres s\'empilent sur toute la largeur et la page ne déborde pas', !tel.page && tel.empiles && tel.larges, JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* le bord du soutien : une copie fausse laisse le bouton verrouillé */
      await s.page.evaluate(id => openTest(id), P.pythonTypes.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const faux = await s.page.evaluate(() => { const q = test.questions[0], a = ptyAns(q); return ptyCases(q).map((c, i) => ({ id: c.id, t: i ? a.types[c.nom] : PTY_TYPES.filter(t => t !== a.types[c.nom])[0] })); });
      for(const c of faux) await s.page.selectOption('#' + c.id, c.t);
      await s.page.click('#ptyValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => ({ bad: document.querySelectorAll('#ptyHost select.bad').length,
        runDisabled: document.getElementById('ptyRun').disabled, console: document.getElementById('ptyConsole').textContent,
        cadres: document.querySelectorAll('#ptyHost .pty-type').length }));
      verifier('en soutien, la copie fausse rougit sa case, laisse « Exécuter » verrouillé, et le cours reste affiché', sout.bad === 1 && sout.runDisabled && sout.console === '' && sout.cadres === 3,
        sout.bad + ' rouge(s), verrouillé : ' + sout.runDisabled);
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies duodecies. {python-afficher-variable} : le programme se complète, s'exécute, se vérifie =====
       Le banc jsdom tient le juge (copie par copie, contre CPython), le
       tirage, les portes et le soutien. Ce qu'il ne voit pas : la zone où
       l'élève écrit, RENDUE à chasse fixe et à la taille de la ligne de code
       qu'elle prolonge — une case plus petite ferait passer le programme de
       l'élève pour une note en bas de page —, le cours rendu au rectangle,
       une VRAIE frappe au clavier dans la zone, un vrai clic sur « Exécuter »
       et la console qui suit, l'encre RÉSOLUE des verdicts (rouge, puis bleu)
       et la correction verte à côté, et la page qui ne déborde ni à 1400 px
       ni à la largeur d'un téléphone. Puis le bord du soutien : la zone
       rougit, le retour nomme la ligne et le mot, aucune correction verte, et
       la copie corrigée passe au bleu. */
    titre('6 vicies duodecies. AFFICHE LA VARIABLE ! LE PROGRAMME SE COMPLÈTE, S\'EXÉCUTE, SE VÉRIFIE');
    if(!P.pythonAfficherVariable){
      ignorer('le programme se complète, s\'exécute, se vérifie', 'ce niveau n\'a pas l\'exercice « afficher une variable »');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonAfficherVariable.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const avant = await s.page.evaluate(() => {
        const cours = document.querySelector('#pycHost .pyc-cours'), l1 = document.getElementById('pycL1'), ta = document.getElementById('pyc-in');
        const run = document.getElementById('pycRun'), cons = document.getElementById('pycConsole');
        const r = e => e ? e.getBoundingClientRect() : { width: 0, height: 0 };
        const cs = e => getComputedStyle(e);
        return { cours: r(cours), coursTexte: cours ? cours.textContent : '',
                 l1: l1 && l1.textContent, l1Taille: l1 ? parseFloat(cs(l1).fontSize) : 0,
                 taTaille: ta ? parseFloat(cs(ta).fontSize) : 0, taPolice: ta ? cs(ta).fontFamily : '', ta: r(ta),
                 runDisabled: !run || run.disabled, run: r(run), cons: r(cons),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 src: test.questions[0].nom + ' = ' + test.questions[0].lit };
      });
      verifier('le cours « comment afficher une variable » est rendu, lisible, et montre print', avant.cours.width > 400 && avant.cours.height > 60 && /print/.test(avant.coursTexte) && /guillemets/.test(avant.coursTexte),
        Math.round(avant.cours.width) + 'x' + Math.round(avant.cours.height));
      verifier('la première ligne est écrite par la page, et la zone où l\'élève écrit est rendue à chasse fixe, à la taille de cette ligne',
        avant.l1 === avant.src && avant.ta.width > 300 && avant.ta.height > 30 && /mono|menlo|consolas|courier/i.test(avant.taPolice) && Math.abs(avant.taTaille - avant.l1Taille) < 0.5,
        JSON.stringify(avant.l1) + ' ; zone ' + avant.taTaille + 'px contre ' + avant.l1Taille + 'px, ' + avant.taPolice);
      verifier('« Exécuter » est libre dès le départ, la console est là, et la page ne déborde pas à 1400 px',
        !avant.runDisabled && avant.run.width > 40 && avant.cons.height > 20 && !avant.page, '');
      /* une VRAIE frappe : la copie fausse, exécutée, puis vérifiée */
      await s.page.click('#pyc-in');
      await s.page.keyboard.type('print("note")');
      await s.page.click('#pycRun');
      await s.page.waitForTimeout(250);
      const exec1 = await s.page.evaluate(() => ({ console: document.getElementById('pycConsole').textContent, rep: test.questions[0].rep,
        police: getComputedStyle(document.getElementById('pycConsole')).fontFamily }));
      verifier('la frappe se range dans la question, et un vrai clic sur « Exécuter » montre ce que fait la copie (note), à chasse fixe',
        exec1.rep === 'print("note")' && exec1.console === 'note' && /mono|menlo|consolas|courier/i.test(exec1.police), JSON.stringify(exec1));
      await s.page.click('#pycValidate');
      await s.page.waitForTimeout(400);
      const faux = await s.page.evaluate(() => {
        const t = document.createElement('span'); document.body.appendChild(t);
        const parVar = v => { t.style.color = 'var(' + v + ')'; return getComputedStyle(t).color; };
        const ref = { bleu: parVar('--blue'), rouge: parVar('--red'), vert: parVar('--green') };
        t.remove();
        const ta = document.getElementById('pyc-in'), badge = ta.nextElementSibling;
        const br = badge ? badge.getBoundingClientRect() : { width: 0, height: 0 };
        return { ref: ref, encre: getComputedStyle(ta).color, badge: badge && badge.classList.contains('mf-cor') ? badge.textContent : null,
                 badgeEncre: badge ? getComputedStyle(badge).color : '', badgeVisible: br.width > 30 && br.height > 12,
                 fb: document.getElementById('pycFeedback').textContent, score: test.score, suivant: !!document.getElementById('pycNext') };
      });
      verifier('la copie fausse vérifiée est peinte en ROUGE (encre résolue), et le retour nomme la ligne 2 et les guillemets',
        faux.encre === faux.ref.rouge && /ligne 2/.test(faux.fb) && /guillemets/.test(faux.fb), faux.encre + ' / ' + faux.fb.slice(0, 90));
      verifier('la ligne attendue est écrite en VERT à côté, dans une boîte visible, et « Question suivante » est proposé',
        faux.badge === 'print(note)' && faux.badgeEncre === faux.ref.vert && faux.badgeVisible && faux.suivant && faux.score === 0,
        JSON.stringify(faux.badge) + ' ' + faux.badgeEncre);
      /* à la largeur d'un téléphone, rien ne déborde */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const ta = document.getElementById('pyc-in').getBoundingClientRect(), c = document.querySelector('#pycHost .pyc-cours').getBoundingClientRect();
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth, ta: ta.right <= 391 && ta.width > 200, cours: c.right <= 391 };
      });
      verifier('sur un téléphone, le cours et la zone tiennent dans l\'écran et la page ne déborde pas', !tel.page && tel.ta && tel.cours, JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* le bord du soutien : OÙ est l'erreur, sans la réponse, puis la copie corrigée */
      await s.page.evaluate(id => openTest(id), P.pythonAfficherVariable.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      await s.page.click('#pyc-in');
      await s.page.keyboard.type('Print(note)');
      await s.page.click('#pycValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => {
        const t = document.createElement('span'); document.body.appendChild(t);
        t.style.color = 'var(--red)'; const rouge = getComputedStyle(t).color; t.remove();
        const ta = document.getElementById('pyc-in'), fb = document.getElementById('pycFeedback').textContent;
        return { rouge: rouge, encre: getComputedStyle(ta).color, badge: !!(ta.nextElementSibling && ta.nextElementSibling.classList.contains('mf-cor')),
                 fb: fb, disabled: ta.disabled, locked: test.locked, revoir: /Rev/.test((document.getElementById('pycValidate') || {}).textContent || '') };
      });
      verifier('en soutien, la copie fausse rougit la zone sans correction verte ni verrou, et le retour dit « Erreur repérée à la ligne 2 » avec le mot fautif — jamais la réponse',
        sout.encre === sout.rouge && !sout.badge && !sout.disabled && !sout.locked && sout.revoir && /^Erreur repérée à la ligne 2/.test(sout.fb) && /Print/.test(sout.fb) && sout.fb.indexOf('print(note)') < 0,
        sout.encre + ' / ' + sout.fb.slice(0, 90));
      await s.page.fill('#pyc-in', 'print(note)');
      await s.page.click('#pycRun');
      await s.page.waitForTimeout(250);
      await s.page.click('#pycValidate');
      await s.page.waitForTimeout(400);
      const fin = await s.page.evaluate(() => {
        const t = document.createElement('span'); document.body.appendChild(t);
        t.style.color = 'var(--blue)'; const bleu = getComputedStyle(t).color; t.remove();
        return { bleu: bleu, encre: getComputedStyle(document.getElementById('pyc-in')).color, console: document.getElementById('pycConsole').textContent,
                 score: test.score, note: (document.querySelector('#pycFeedback .note-exo') || {}).textContent || document.getElementById('pycFeedback').textContent };
      });
      verifier('la copie corrigée s\'exécute (12) et passe au BLEU, pour 1 case juste', fin.encre === fin.bleu && fin.console === '12' && fin.score === 1, fin.encre + ' / ' + fin.console + ' / ' + fin.note.slice(0, 60));
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies terdecies. {python-noms-variables} : correct, incorrect, et pourquoi =====
       Le banc jsdom tient la banque (par une seconde méthode), le tirage, la
       porte de la justification, la copie juste et la copie fausse. Ce qu'il
       ne voit pas : chaque rangée « (1) prix achat est [ ? ] car [ … ] »
       d'un seul tenant à 1400 px — repliée, la raison se lirait sous un autre
       nom —, le nom RENDU à chasse fixe (une espace dans « prix achat » ne se
       voit qu'à cette police), la justification VRAIMENT inerte sous un vrai
       clic tant que le nom n'est pas déclaré incorrect (Playwright refuse de
       choisir dans une liste désactivée — c'est le bord qu'on mesure), et
       l'encre RENDUE du verdict. On choisit dans les vraies listes, on clique
       Vérifier, puis on rejoue le bord du soutien. */
    titre('6 vicies terdecies. NOMS DE VARIABLES EN PYTHON : CORRECT, INCORRECT, ET POURQUOI');
    if(!P.pythonNoms){
      ignorer('les noms de variables se jugent et se justifient', 'ce niveau n\'a pas l\'exercice des noms de variables');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonNoms.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const avant = await s.page.evaluate(() => {
        const rows = [...document.querySelectorAll('#pvnHost .pvn-row')];
        const replis = rows.filter(r => {
          const kids = [...r.children].filter(k => k.getBoundingClientRect().width > 0);
          const h = Math.max(...kids.map(k => k.getBoundingClientRect().height));
          return r.getBoundingClientRect().height > h * 1.6;
        }).length;
        const nom = document.querySelector('#pvnHost .pvn-nom');
        const r0 = document.getElementById('pvn-r0');
        return { rangees: rows.length, replis, police: nom ? getComputedStyle(nom).fontFamily : '',
                 nomVisible: nom && nom.getBoundingClientRect().width > 20,
                 espace: [...document.querySelectorAll('#pvnHost .pvn-nom')].some(e => / /.test(e.textContent)),
                 whiteSpace: nom ? getComputedStyle(nom).whiteSpace : '',
                 raisonFermee: r0 && r0.disabled && parseFloat(getComputedStyle(r0).opacity) < 0.7,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 verdicts: document.querySelectorAll('#pvnHost select.pvn-verdict').length };
      });
      verifier('la question pose ses ' + P.pythonNoms.par + ' rangées, chacune d\'un seul tenant à 1400 px, et la page ne déborde pas',
        avant.rangees === P.pythonNoms.par && avant.replis === 0 && !avant.page && avant.verdicts === P.pythonNoms.par,
        avant.rangees + ' rangée(s), ' + avant.replis + ' repliée(s)');
      verifier('le nom est rendu à chasse fixe et garde ses espaces', /mono|menlo|consolas|courier/i.test(avant.police) && avant.nomVisible && avant.whiteSpace === 'pre', avant.police + ' / ' + avant.whiteSpace);
      verifier('la justification est visible mais fermée et grisée avant tout verdict', !!avant.raisonFermee, '');
      /* un VRAI choix dans la liste fermée est refusé par le navigateur */
      let refuse = false;
      try{ await s.page.selectOption('#pvn-r0', { index: 1 }, { timeout: 1500 }); }catch(e){ refuse = true; }
      verifier('choisir une raison AVANT de déclarer le nom incorrect est impossible', refuse, 'la liste fermée a accepté un choix');
      /* on répond JUSTE, dans les vraies listes */
      const bon = await s.page.evaluate(() => test.questions[0].noms.map(n => ({ v: pvnCorrect(n) ? 'ok' : 'ko', r: pvnRaison(n) })));
      for(let i = 0; i < bon.length; i++){
        await s.page.selectOption('#pvn-v' + i, bon[i].v);
        if(bon[i].r){ await s.page.selectOption('#pvn-r' + i, bon[i].r); }
      }
      const ouverte = await s.page.evaluate(() => [...document.querySelectorAll('#pvnHost .pvn-raison')].filter(r => !r.disabled).length);
      verifier('déclarer un nom incorrect ouvre sa justification, et elle seule', ouverte === bon.filter(b => b.r).length, ouverte + ' ouverte(s) pour ' + bon.filter(b => b.r).length + ' incorrect(s)');
      await s.page.click('#pvnValidate');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(() => {
        const ok = [...document.querySelectorAll('#pvnHost select.ok')];
        const bleu = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim();
        const dom = c => { const m = c.match(/\d+/g) || []; return m.length >= 3 ? (Math.max(+m[0], +m[1], +m[2]) === +m[2] ? 'bleu' : (Math.max(+m[0], +m[1], +m[2]) === +m[0] ? 'rouge' : 'vert')) : '?'; };
        return { ok: ok.length, cases: pvnCases(test.questions[0]).length, score: test.score,
                 encres: [...new Set(ok.map(e => dom(getComputedStyle(e).color)))],
                 suivant: !!document.getElementById('pvnNext'), note: (document.querySelector('#pvnFeedback .note-exo') || {}).textContent || '' };
      });
      verifier('la copie juste choisie dans les listes peint toutes ses cases en BLEU et vaut toutes ses cases',
        apres.ok === apres.cases && apres.score === apres.cases && apres.encres.length === 1 && apres.encres[0] === 'bleu',
        apres.ok + ' ok sur ' + apres.cases + ', note ' + apres.score + ', encres ' + apres.encres.join(','));
      verifier('« Question suivante » apparaît et la note affichée compte toutes les cases', apres.suivant && new RegExp(apres.cases + ' cases justes sur ' + apres.cases).test(apres.note), apres.note.trim());
      /* le bord du soutien : un incorrect déclaré correct rougit, sans révéler sa raison */
      await s.page.evaluate(id => openTest(id), P.pythonNoms.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const plan = await s.page.evaluate(() => { const q = test.questions[0]; const iKo = q.noms.findIndex(n => !pvnCorrect(n));
        return { iKo, rep: q.noms.map((n, i) => ({ v: (i === iKo) ? 'ok' : (pvnCorrect(n) ? 'ok' : 'ko'), r: (i === iKo) ? null : pvnRaison(n) })) }; });
      for(let i = 0; i < plan.rep.length; i++){
        await s.page.selectOption('#pvn-v' + i, plan.rep[i].v);
        if(plan.rep[i].r){ await s.page.selectOption('#pvn-r' + i, plan.rep[i].r); }
      }
      await s.page.click('#pvnValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(i => {
        const v = document.getElementById('pvn-v' + i), r = document.getElementById('pvn-r' + i);
        const dom = c => { const m = c.match(/\d+/g) || []; return m.length >= 3 ? (Math.max(+m[0], +m[1], +m[2]) === +m[0] ? 'rouge' : 'autre') : '?'; };
        return { bad: document.querySelectorAll('#pvnHost select.bad').length, encre: dom(getComputedStyle(v).color),
                 badge: !!(v.nextElementSibling && v.nextElementSibling.classList.contains('mf-cor')),
                 raison: r.value, fermee: r.disabled, locked: test.locked,
                 rev: (document.getElementById('pvnValidate') || {}).textContent || '' };
      }, plan.iKo);
      verifier('en soutien, l\'incorrect déclaré correct rougit à l\'encre rendue, sans badge, sa raison reste fermée et vide, et « Revérifier » est proposé',
        sout.bad === 1 && sout.encre === 'rouge' && !sout.badge && sout.raison === '' && sout.fermee && !sout.locked && /Rev/.test(sout.rev),
        sout.bad + ' rouge(s), encre ' + sout.encre + ', badge ' + sout.badge + ', raison « ' + sout.raison + ' »');
      /* il corrige : le verdict passe à « incorrect », la porte s'ouvre pour de vrai, il choisit — tout est juste */
      await s.page.selectOption('#pvn-v' + plan.iKo, 'ko');
      const raison = await s.page.evaluate(i => pvnRaison(test.questions[0].noms[i]), plan.iKo);
      await s.page.selectOption('#pvn-r' + plan.iKo, raison);
      await s.page.click('#pvnValidate');
      await s.page.waitForTimeout(400);
      const fin = await s.page.evaluate(() => ({ ok: document.querySelectorAll('#pvnHost select.ok').length, cases: pvnCases(test.questions[0]).length, score: test.score, locked: test.locked }));
      verifier('la copie corrigée en soutien vaut toutes ses cases', fin.ok === fin.cases && fin.score === fin.cases && fin.locked, fin.ok + ' ok sur ' + fin.cases + ', note ' + fin.score);
      await s.nav.close(); s = null;
    }

    /* ===== 6 vicies quaterdecies. {python-nom-variable} : un nom par grandeur, puis le programme =====
       Le banc jsdom tient le juge (comparé à un vrai CPython), le tirage, le
       doublon, les portes et le soutien. Ce qu'il ne voit pas : la cellule du
       carnet RENDUE — chaque phrase et sa case sur UNE ligne à chasse fixe, la
       case à la taille de la phrase qui la précède —, la frappe dans de VRAIES
       cases, l'encre du verdict, le programme et la console rendus, et la
       page qui ne déborde ni à 1400 px ni à la largeur d'un téléphone, où la
       phrase du carnet se REPLIE au lieu de sortir de l'écran. */
    titre('6 vicies quaterdecies. NOMMER UNE VARIABLE : UN NOM PAR GRANDEUR, PUIS LE PROGRAMME');
    if(!P.pythonNomVariable){
      ignorer('un nom par grandeur, puis le programme', 'ce niveau n\'a pas l\'exercice des noms de variables');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonNomVariable.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const avant = await s.page.evaluate(() => {
        const li = [...document.querySelectorAll('#pnvHost .pnv-enonce li')].map(e => e.getBoundingClientRect());
        const lignes = [...document.querySelectorAll('#pnvHost .pnv-ligne')].map(l => {
          const code = l.querySelector('code'), inp = l.querySelector('input.pnv-in');
          const cr = code.getBoundingClientRect(), ir = inp.getBoundingClientRect();
          return { police: getComputedStyle(inp).fontFamily, memeTaille: getComputedStyle(inp).fontSize === getComputedStyle(code).fontSize,
                   taille: getComputedStyle(inp).fontSize + ' / ' + getComputedStyle(code).fontSize,
                   memeLigne: ir.top < cr.bottom && ir.bottom > cr.top && ir.left >= cr.right - 2,
                   caseVisible: ir.width > 80 && ir.height > 24 };
        });
        return { grandeurs: li.length, grandeursVisibles: li.every(r => r.width > 100 && r.height > 14),
                 lignes: lignes.length, monospace: lignes.every(l => /mono|menlo|consolas|courier/i.test(l.police)),
                 memeTaille: lignes.every(l => l.memeTaille), tailles: lignes.map(l => l.taille).join(' ; '),
                 memeLigne: lignes.every(l => l.memeLigne), casesVisibles: lignes.every(l => l.caseVisible),
                 run: !!document.getElementById('pnvRun'), code: !!document.querySelector('#pnvHost .py-code'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('les quatre grandeurs de l\'énoncé sont rendues', avant.grandeurs === P.pythonNomVariable.parQ && avant.grandeursVisibles, avant.grandeurs + ' grandeur(s)');
      verifier('les quatre lignes du carnet sont à chasse fixe, et chaque case écrit à la taille de la phrase qui la précède', avant.lignes === P.pythonNomVariable.parQ && avant.monospace && avant.memeTaille, avant.tailles);
      verifier('à 1400 px, chaque phrase et sa case tiennent sur UNE ligne, la case visible, et la page ne déborde pas', avant.memeLigne && avant.casesVisibles && !avant.page, JSON.stringify(avant));
      verifier('ni programme ni « Exécuter » avant la vérification', !avant.run && !avant.code, '');
      /* on TAPE dans les vraies cases */
      const noms = ['nb_filles_2nde', 'tarifRepas', 'aire_figure', 'note_devoir'];
      for(let i = 0; i < noms.length; i++) await s.page.fill('#pnv-s-' + i, noms[i]);
      await s.page.click('#pnvValidate');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(noms => {
        const ins = [...document.querySelectorAll('#pnvHost input.pnv-in')];
        const rgb = c => (c.match(/\d+/g) || []).map(Number);
        const bleues = ins.filter(i => { const c = rgb(getComputedStyle(i).color); return i.classList.contains('ok') && c[2] > c[0] && c[2] > c[1]; }).length;
        const code = document.getElementById('pnvCode'), run = document.getElementById('pnvRun');
        const cr = code && code.getBoundingClientRect();
        return { ok: ins.filter(i => i.classList.contains('ok')).length, bleues, score: test.score,
                 codeVisible: !!code && cr.width > 300 && cr.height > 100, police: code && getComputedStyle(code).fontFamily,
                 nomsDansCode: !!code && noms.every(n => code.textContent.indexOf(n + ' = ') >= 0),
                 runOk: !!run && !run.disabled, focus: document.activeElement && document.activeElement.id,
                 suivant: !!document.getElementById('pnvNext') };
      }, noms);
      verifier('les quatre noms tapés sont peints ok, à l\'encre BLEUE, et valent 4', apres.ok === 4 && apres.bleues === 4 && apres.score === 4, apres.ok + ' ok, ' + apres.bleues + ' bleues, note ' + apres.score);
      verifier('le programme rendu porte les noms de l\'élève, à chasse fixe, dans un cadre visible', apres.codeVisible && apres.nomsDansCode && /mono|menlo|consolas|courier/i.test(apres.police || ''), JSON.stringify(apres));
      verifier('« Exécuter » est cliquable et reçoit le focus ; « Question suivante » attend l\'exécution', apres.runOk && apres.focus === 'pnvRun' && !apres.suivant, 'focus sur ' + apres.focus);
      await s.page.click('#pnvRun');
      await s.page.waitForTimeout(300);
      const fin = await s.page.evaluate(noms => {
        const cons = document.getElementById('pnvConsole'), r = cons.getBoundingClientRect();
        return { lignes: cons.textContent.split('\n').length, visible: r.height > 60 && r.width > 300,
                 police: getComputedStyle(cons).fontFamily, suivant: !!document.getElementById('pnvNext'),
                 texte: cons.textContent };
      }, noms);
      verifier('la console montre les quatre valeurs, à chasse fixe, dans un cadre visible, et « Question suivante » apparaît',
        fin.lignes === 4 && fin.visible && /mono|menlo|consolas|courier/i.test(fin.police) && fin.suivant, JSON.stringify(fin.texte));
      /* à la largeur d'un téléphone, la phrase du carnet se replie et rien ne déborde */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const lignes = [...document.querySelectorAll('#pnvHost .pnv-ligne')].map(l => {
          const code = l.querySelector('code'), inp = l.querySelector('input.pnv-in');
          const cr = code.getBoundingClientRect(), ir = inp.getBoundingClientRect(), lh = parseFloat(getComputedStyle(code).lineHeight);
          return { replie: cr.height > lh * 1.5, caseDedans: ir.right <= 391 && ir.left >= 0 && ir.width > 60 };
        });
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 replies: lignes.every(l => l.replie), cases: lignes.every(l => l.caseDedans) };
      });
      verifier('sur un téléphone, la phrase du carnet se replie, la case reste dans l\'écran, et la page ne déborde pas', !tel.page && tel.replies && tel.cases, JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* le bord du soutien : l'espace rougit à la sortie de la case, sans badge, et rien ne se débloque */
      await s.page.evaluate(id => openTest(id), P.pythonNomVariable.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      await s.page.click('#pnv-s-0');
      await s.page.keyboard.type('nb filles');
      const pendant = await s.page.evaluate(() => document.getElementById('pnv-s-0').className);
      await s.page.keyboard.press('Tab');
      await s.page.waitForTimeout(300);
      const sorti = await s.page.evaluate(() => {
        const i = document.getElementById('pnv-s-0'), c = (getComputedStyle(i).borderColor.match(/\d+/g) || []).map(Number);
        return { classe: i.className, rouge: c[0] > c[1] && c[0] > c[2], badge: !!(i.nextElementSibling && i.nextElementSibling.classList.contains('mf-cor')) };
      });
      verifier('en soutien, la case où l\'élève écrit ne se colore pas, et l\'espace rougit à la SORTIE de la case, sans badge',
        !/\b(ok|bad)\b/.test(pendant) && /\bbad\b/.test(sorti.classe) && sorti.rouge && !sorti.badge, 'pendant : « ' + pendant + ' », sorti : ' + JSON.stringify(sorti));
      await s.page.fill('#pnv-s-1', 'tarif');
      await s.page.click('#pnvValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => ({ bad: document.querySelectorAll('#pnvHost input.bad').length, ok: document.querySelectorAll('#pnvHost input.ok').length,
        run: !!document.getElementById('pnvRun'), code: !!document.getElementById('pnvCode'), locked: test.locked,
        badge: !!document.querySelector('#pnvHost .mf-cor') }));
      verifier('en soutien, la copie fausse vérifiée rougit sa case, garde la juste bleue, ne montre ni programme ni « Exécuter », et ne verrouille rien',
        sout.bad === 1 && sout.ok === 1 && !sout.run && !sout.code && !sout.locked && !sout.badge, JSON.stringify(sout));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies bis. {python-print} : écrire un print, l'exécuter, le faire vérifier =====
       Le banc jsdom tient le diagnostic cas par cas, le juge (la sortie de
       pyRun comparée à CPython), les portes et la note. Ce qu'il ne voit
       pas : la zone de texte RENDUE — à chasse fixe, large comme la console,
       une règle CSS perdue la ferait écrire en Nunito sur 20 caractères —,
       les trois cadres du cours au rectangle, l'ENCRE des verdicts (le rouge
       de l'erreur dans la console, le bleu de la copie juste, le rouge du
       soutien), et le geste : TAPER au clavier dans la vraie zone, cliquer le
       vrai bouton « Exécuter », lire la console, corriger, revérifier. Il
       joue le trajet d'un élève qui se trompe deux fois avant de réussir. */
    titre('6 tricies bis. ÉCRIRE UN PRINT : L\'EXÉCUTER, LE FAIRE VÉRIFIER, ET LE SOUTIEN QUI EXPLIQUE');
    if(!P.pythonPrint){
      ignorer('écrire un print, l\'exécuter, le faire vérifier', 'ce niveau n\'a pas l\'exercice d\'écriture d\'un print');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonPrint.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      /* L'encre d'un verdict se compare à la VARIABLE de la convention (--blue,
         --red), jamais à une dominante : le bord de REPOS de la zone est déjà
         un bleu clair, et une règle .ok qui ne peindrait rien serait passée à
         la dominante — le sabotage l'a montré en restant vert. La dominante
         reste pour dire « pas de rouge » sur une console saine. */
      const dominante = 'const encre = tok => { const p = document.createElement("i"); document.body.appendChild(p); p.style.color = tok; const c = getComputedStyle(p).color; p.remove(); return c; };'
        + ' const dominante = c => { const m = String(c).match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/); if(!m) return null;'
        + ' const r = +m[1], g = +m[2], b = +m[3], max = Math.max(r, g, b), min = Math.min(r, g, b);'
        + ' if(max < 100 || max - min < 30) return null; return b >= max ? "bleu" : (g >= max ? "vert" : "rouge"); };';
      const avant = await s.page.evaluate(() => {
        const ta = document.getElementById('pyp-prog'), cons = document.getElementById('pypConsole'), run = document.getElementById('pypRun');
        const cible = document.getElementById('pypCible');
        const cadres = [...document.querySelectorAll('#pypHost .pyp-regle')].map(e => e.getBoundingClientRect());
        const tr = ta.getBoundingClientRect(), kr = cons.getBoundingClientRect(), rr = run.getBoundingClientRect();
        return { police: getComputedStyle(ta).fontFamily, taille: parseFloat(getComputedStyle(ta).fontSize),
                 zone: Math.round(tr.width) + 'x' + Math.round(tr.height), zoneVisible: tr.width > 500 && tr.height > 60,
                 memeLargeur: Math.abs(tr.width - kr.width) < 4 && Math.abs(tr.left - kr.left) < 4,
                 runLibre: !run.disabled && rr.width > 40 && rr.height > 20,
                 cible: cible && cible.textContent, texte: test.questions[0].texte, 
                 cadres: cadres.map(r => Math.round(r.width) + 'x' + Math.round(r.height)),
                 cadresVisibles: cadres.length === 3 && cadres.every(r => r.width > 200 && r.height > 60),
                 cadresCoteACote: cadres.length === 3 && Math.abs(cadres[0].top - cadres[2].top) < 4,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('les trois cadres du cours de print sont rendus côte à côte, à une taille lisible', avant.cadresVisibles && avant.cadresCoteACote, avant.cadres.join(' / '));
      verifier('la phrase à afficher est celle de la demande, et elle est à l\'écran', avant.cible === avant.texte && avant.texte === P.pythonPrint.premier, JSON.stringify(avant.cible));
      verifier('la zone où l\'élève écrit est rendue à chasse fixe, large comme la console, à une taille lisible',
        /mono|menlo|consolas|courier/i.test(avant.police) && avant.zoneVisible && avant.memeLargeur && avant.taille >= 16, avant.police + ' — ' + avant.zone);
      verifier('« Exécuter » est libre dès le départ, et la page ne déborde pas à 1400 px', avant.runLibre && !avant.page, '');
      /* on TAPE une copie fausse, on l'exécute : l'erreur se lit en rouge */
      await s.page.click('#pyp-prog');
      await s.page.keyboard.type('Print("' + P.pythonPrint.premier + '")');
      await s.page.click('#pypRun');
      await s.page.waitForTimeout(250);
      const err = await s.page.evaluate(new Function(dominante + ' const c = document.getElementById("pypConsole"); const st = getComputedStyle(c);'
        + ' return { texte: c.textContent, encre: st.color === encre("var(--red)") ? "rouge" : dominante(st.color), bord: st.borderTopColor === encre("var(--red)") ? "rouge" : dominante(st.borderTopColor), locked: test.locked, prog: test.questions[0].prog };'));
      verifier('exécuter une copie fausse écrit l\'erreur de Python dans la console, en rouge, sans rien verrouiller',
        /^Erreur/.test(err.texte) && err.encre === 'rouge' && err.bord === 'rouge' && !err.locked, JSON.stringify(err.texte) + ' — encre ' + err.encre);
      verifier('ce qui est tapé au clavier voyage dans la question (la pause le garde)', err.prog === 'Print("' + P.pythonPrint.premier + '")', JSON.stringify(err.prog));
      /* on corrige au clavier, on réexécute : la phrase s'affiche */
      await s.page.fill('#pyp-prog', 'print("' + P.pythonPrint.premier + '")');
      await s.page.click('#pypRun');
      await s.page.waitForTimeout(250);
      const ok1 = await s.page.evaluate(new Function(dominante + ' const c = document.getElementById("pypConsole"); const st = getComputedStyle(c);'
        + ' return { texte: c.textContent, encre: dominante(st.color), bord: dominante(st.borderColor), police: st.fontFamily, visible: c.getBoundingClientRect().height > 40 };'));
      verifier('réexécuté après correction, le programme affiche la phrase dans la console, à chasse fixe, sans rouge',
        ok1.texte === P.pythonPrint.premier && ok1.encre !== 'rouge' && ok1.bord !== 'rouge' && ok1.visible && /mono|menlo|consolas|courier/i.test(ok1.police),
        JSON.stringify(ok1.texte) + ' — encre ' + ok1.encre + ', bord ' + ok1.bord);
      await s.page.click('#pypValidate');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(new Function(dominante + ' const ta = document.getElementById("pyp-prog"), st = getComputedStyle(ta);'
        + ' return { ok: ta.classList.contains("ok"), bord: st.borderTopColor === encre("var(--blue)") ? "bleu" : "autre (" + st.borderTopColor + ")", score: test.score, locked: test.locked, lecture: ta.readOnly,'
        + ' suivant: !!document.getElementById("pypNext"), focus: document.activeElement && document.activeElement.id,'
        + ' runDisabled: document.getElementById("pypRun").disabled, note: (document.querySelector("#pypFeedback .note-exo") || {}).textContent || "" };'));
      verifier('vérifiée, la copie juste est peinte ok en BLEU, vaut 1, se verrouille, et « Question suivante » reçoit le focus',
        apres.ok && apres.bord === 'bleu' && apres.score === 1 && apres.locked && apres.lecture && apres.suivant && apres.focus === 'pypNext' && apres.runDisabled,
        'bord ' + apres.bord + ', note ' + apres.score + ', focus ' + apres.focus);
      verifier('la note affichée compte le programme comme UNE case juste sur 1', /1 case juste sur 1/.test(apres.note), JSON.stringify(apres.note));
      /* à la largeur d'un téléphone : les cadres s'empilent, la zone tient, rien ne déborde */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const cadres = [...document.querySelectorAll('#pypHost .pyp-regle')].map(e => e.getBoundingClientRect());
        const tr = document.getElementById('pyp-prog').getBoundingClientRect();
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 empiles: cadres.length === 3 && cadres[1].top >= cadres[0].bottom - 1 && cadres[2].top >= cadres[1].bottom - 1,
                 larges: cadres.every(r => r.width > 250 && r.right <= 391), zone: tr.width > 250 && tr.right <= 391 };
      });
      verifier('sur un téléphone, les trois cadres s\'empilent, la zone de texte tient dans l\'écran et la page ne déborde pas', !tel.page && tel.empiles && tel.larges && tel.zone, JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* le SOUTIEN : deux erreurs nommées, puis la réussite */
      await s.page.evaluate(id => openTest(id), P.pythonPrint.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      await s.page.click('#pyp-prog');
      await s.page.keyboard.type('print(' + P.pythonPrint.premier + ')');
      await s.page.click('#pypValidate');
      await s.page.waitForTimeout(400);
      const sout1 = await s.page.evaluate(new Function(dominante + ' const ta = document.getElementById("pyp-prog"), st = getComputedStyle(ta), fb = document.getElementById("pypFeedback");'
        + ' const M = "print(" + String.fromCharCode(34) + test.questions[0].texte + String.fromCharCode(34) + ")";'
        + ' return { bad: ta.classList.contains("bad"), bord: st.borderTopColor === encre("var(--red)") ? "rouge" : "autre (" + st.borderTopColor + ")", fond: dominante(st.backgroundColor), locked: test.locked, lecture: ta.readOnly,'
        + ' message: fb.textContent, encreMsg: dominante(getComputedStyle(fb).color), revele: document.getElementById("pypHost").textContent.indexOf(M) >= 0 || fb.textContent.indexOf(M) >= 0,'
        + ' rev: (document.getElementById("pypValidate") || {}).textContent || "", modele: !!document.querySelector("#pypModele .sol") };'));
      verifier('en soutien, la copie fausse rougit (bord rouge), reste modifiable, et le message explique en rouge ce qui ne va pas — les guillemets manquent',
        sout1.bad && sout1.bord === 'rouge' && !sout1.locked && !sout1.lecture && /guillemets/.test(sout1.message) && sout1.encreMsg === 'rouge',
        'bord ' + sout1.bord + ' — ' + JSON.stringify(sout1.message));
      verifier('et il ne révèle jamais le programme modèle : « Revérifier » est proposé', !sout1.revele && !sout1.modele && /Rev/.test(sout1.rev), sout1.rev);
      await s.page.fill('#pyp-prog', 'print("' + P.pythonPrint.premier + '"');
      await s.page.click('#pypValidate');
      await s.page.waitForTimeout(400);
      const sout2 = await s.page.evaluate(() => ({ message: document.getElementById('pypFeedback').textContent, locked: test.locked }));
      verifier('la seconde erreur — la parenthèse fermante — est nommée à son tour, sans verrouiller', /fermante/.test(sout2.message) && !sout2.locked, JSON.stringify(sout2.message));
      await s.page.fill('#pyp-prog', 'print("' + P.pythonPrint.premier + '")');
      await s.page.click('#pypValidate');
      await s.page.waitForTimeout(400);
      const sout3 = await s.page.evaluate(new Function(dominante + ' const ta = document.getElementById("pyp-prog"), st = getComputedStyle(ta);'
        + ' return { ok: ta.classList.contains("ok"), bord: st.borderTopColor === encre("var(--blue)") ? "bleu" : "autre (" + st.borderTopColor + ")", score: test.score, console: document.getElementById("pypConsole").textContent };'));
      verifier('la copie corrigée en soutien est peinte ok en bleu, vaut 1, et la console montre la phrase',
        sout3.ok && sout3.bord === 'bleu' && sout3.score === 1 && sout3.console === P.pythonPrint.premier, 'bord ' + sout3.bord + ', note ' + sout3.score + ', console ' + JSON.stringify(sout3.console));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies ter. {python-completer} : la ligne 2 se tape, s'exécute, puis se vérifie =====
       Le banc jsdom tient le juge (les lignes justes et fausses, chacune
       avec son diagnostic), les portes et le soutien. Ce qu'il ne voit pas :
       le COURS qui ouvre la séance rendu au rectangle, son exemple à chasse
       fixe, un VRAI clic sur « J'ai compris » fermé qui ne franchit rien,
       l'ÉNONCÉ rendu dans sa boîte sous UNE seule étiquette « Énoncé » — et
       qui ne dit pas la même chose sur les deux écrans —, le coup de pouce
       qui s'OUVRE au clic (jsdom lit un attribut, pas un geste), la
       ligne 1 et la case de la ligne 2 à
       chasse fixe et à la MÊME taille (une case plus petite que le code
       qu'elle prolonge se lirait comme une note), la case qui ne s'étire pas
       hors de l'écran, un VRAI clic sur « Vérifier » fermé qui ne fait rien,
       la ligne TAPÉE au clavier — Entrée exécute —, la console et le verdict
       à l'encre RENDUE, l'erreur de Python en rouge dans la console, et la
       page qui ne déborde pas à la largeur d'un téléphone. Puis il rejoue le
       soutien : la ligne fausse rougit, le message dit où est l'erreur, la
       correction tapée referme puis rouvre le bouton. */
    titre('6 tricies ter. AFFICHER UN TEXTE SUIVI D\'UNE VARIABLE : LA LIGNE SE TAPE, S\'EXÉCUTE, SE VÉRIFIE');
    if(!P.pythonCompleter){
      ignorer('la ligne 2 se tape, s\'exécute, puis se vérifie', 'ce niveau n\'a pas l\'exercice du print à compléter');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonCompleter.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      /* LE COURS OUVRE LA SÉANCE, et son exemple est un VRAI programme
         (demande de Turquet, septembre 2026). jsdom tient les états ; ce
         qu'il ne voit pas, c'est le cours rendu à une taille lisible,
         l'exemple à chasse fixe, et un VRAI clic sur une porte fermée —
         une porte tenue par le seul « disabled » se franchit au clic si une
         règle CSS la laisse cliquable. */
      const cours = await s.page.evaluate(() => {
        const c = document.querySelector('#pyxHost .pyx-cours'), ex = document.querySelector('#pyxHost .pyx-prog');
        const l = [...document.querySelectorAll('#pyxHost .pyx-prog .pyx-l1')];
        const run = document.getElementById('pyxExRun'), b = document.getElementById('pyxCompris'), cons = document.getElementById('pyxExConsole');
        const r = c ? c.getBoundingClientRect() : null, er = ex ? ex.getBoundingClientRect() : null;
        return { coursVisible: !!r && r.width > 400 && r.height > 60, texte: c ? c.textContent : '',
                 lignes: l.map(x => x.textContent), police: l[0] ? getComputedStyle(l[0]).fontFamily : '',
                 exVisible: !!er && er.width > 200 && er.height > 30, runOk: !!run && !run.disabled,
                 porteFermee: !!b && b.disabled, console: cons ? cons.textContent : null,
                 question: !!document.getElementById('pyx-in'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('le cours ouvre la séance à une taille lisible, il nomme la virgule et les guillemets, son exemple est à chasse fixe, et la question n\'est pas encore là',
        cours.coursVisible && /virgule/.test(cours.texte) && /guillemets/.test(cours.texte)
        && cours.lignes.length === 2 && /^annee = /.test(cours.lignes[0]) && /print\(/.test(cours.lignes[1])
        && /mono|menlo|consolas|courier/i.test(cours.police) && cours.exVisible && cours.runOk
        && cours.porteFermee && cours.console === '' && !cours.question && !cours.page, JSON.stringify(cours));
      /* L'ÉNONCÉ SUIT L'ÉCRAN (demande de Turquet, septembre 2026), et
         jsdom ne voit ni sa BOÎTE ni son ÉTIQUETTE : un énoncé vidé de son
         texte garderait son élément dans le DOM, et le contrôle universel
         « 6 » ne visite pas cet exercice. On mesure donc le rectangle rendu
         et l'étiquette « Énoncé » réellement dessinée, sur les DEUX écrans —
         plus le fait que les deux ne disent pas la même chose. */
      const enonce = () => s.page.evaluate(() => {
        const el = document.getElementById('pyxInstr'), r = el ? el.getBoundingClientRect() : null;
        const et = [...document.querySelectorAll('.screen.on *')]
          .filter(x => (getComputedStyle(x, '::before').content || '').indexOf('\u00c9nonc\u00e9') >= 0).length;
        return { texte: el ? el.textContent.trim() : '', boite: !!r && r.width > 200 && r.height > 12, etiquettes: et };
      });
      const enonCours = await enonce();
      verifier('l\'\u00e9nonc\u00e9 du cours est RENDU dans sa bo\u00eete, sous une seule \u00e9tiquette \u00ab \u00c9nonc\u00e9 \u00bb, et dit de lire le cours et d\'ex\u00e9cuter le programme',
        enonCours.boite && enonCours.etiquettes === 1 && /cours/i.test(enonCours.texte)
        && /ex[\u00e9e]cut/i.test(enonCours.texte) && !/compl[\u00e8e]t/i.test(enonCours.texte), JSON.stringify(enonCours));
      /* ON CENTRE LE BOUTON AVANT DE CLIQUER : les commandes du bas
         (« Signaler », « Abandonner », « Pause ») sont en position FIXE, et un
         clic posé sur les coordonnées d'un bouton qui passe dessous atteint la
         barre — ici il ouvrait la modale de signalement, qui interceptait
         ensuite tout ce qui suivait, et le banc accusait la page. L'élève, lui,
         fait défiler : la réserve du bas (84 px) lui rend le bouton. C'est le
         piège déjà payé sur la grille de {construire-fonction}. */
      const centrer = () => s.page.evaluate(() => { const b = document.getElementById('pyxCompris'); if(b) b.scrollIntoView({ block: 'center' }); });
      await centrer(); await s.page.waitForTimeout(150);
      await s.page.click('#pyxCompris', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      verifier('un clic sur « J\'ai compris » fermé ne montre pas la question',
        await s.page.evaluate(() => !document.getElementById('pyx-in')), 'la question s\'ouvre sans que l\'exemple ait tourné');
      await s.page.click('#pyxExRun');
      await s.page.waitForTimeout(300);
      const exemple = await s.page.evaluate(() => ({
        console: document.getElementById('pyxExConsole').textContent,
        police: getComputedStyle(document.getElementById('pyxExConsole')).fontFamily,
        porteOuverte: !document.getElementById('pyxCompris').disabled }));
      verifier('l\'exemple exécuté affiche « ' + P.pythonCompleter.exemple + ' » à chasse fixe, et ouvre « J\'ai compris »',
        exemple.console === P.pythonCompleter.exemple && /mono|menlo|consolas|courier/i.test(exemple.police) && exemple.porteOuverte, JSON.stringify(exemple));
      await centrer(); await s.page.waitForTimeout(150);
      await s.page.click('#pyxCompris');
      await s.page.waitForTimeout(400);
      const avant = await s.page.evaluate(() => {
        const l1 = document.querySelector('#pyxHost .pyx-l1'), inp = document.getElementById('pyx-in');
        const cons = document.getElementById('pyxConsole'), run = document.getElementById('pyxRun'), val = document.getElementById('pyxValidate');
        const fam = el => getComputedStyle(el).fontFamily, px = el => Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
        const ir = inp.getBoundingClientRect(), rr = run.getBoundingClientRect(), vr = val.getBoundingClientRect();
        return { coursParti: !document.querySelector('#pyxHost .pyx-cours') && !document.getElementById('pyxExRun'),
                 policeL1: fam(l1), policeIn: fam(inp), pxL1: px(l1), pxIn: px(inp),
                 l1: l1.textContent, inVisible: ir.width > 200 && ir.height > 28 && ir.right <= document.documentElement.clientWidth,
                 runOk: !run.disabled && rr.width > 40 && rr.height > 20, valFerme: val.disabled && vr.width > 40,
                 consoleVisible: cons.getBoundingClientRect().height > 20,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('« J\'ai compris » ouvre la question, et le cours comme son exemple quittent l\'écran', avant.coursParti, JSON.stringify(avant));
      verifier('la ligne 1 « note = 12 » et la case de la ligne 2 sont à chasse fixe, à la même taille',
        avant.l1 === 'note = 12' && /mono|menlo|consolas|courier/i.test(avant.policeL1) && /mono|menlo|consolas|courier/i.test(avant.policeIn) && Math.abs(avant.pxL1 - avant.pxIn) < 0.6,
        avant.policeIn + ' — ' + avant.pxL1 + 'px / ' + avant.pxIn + 'px');
      verifier('la case tient dans l\'écran, « Exécuter » est ouvert, « Vérifier » est fermé, et la page ne déborde pas à 1400 px',
        avant.inVisible && avant.runOk && avant.valFerme && avant.consoleVisible && !avant.page, JSON.stringify(avant));
      const enonQ = await enonce();
      const cible = await s.page.evaluate(() => { const q = test.questions[test.idx]; return { texte: q.texte, nom: q.nom, ligne: pyxAns(q).ligne }; });
      verifier('l\'\u00e9nonc\u00e9 de la question est RENDU dans sa bo\u00eete, sous une seule \u00e9tiquette, dit de compl\u00e9ter, nomme le TEXTE et la VARIABLE de SA question, et ne redit pas le cours',
        enonQ.boite && enonQ.etiquettes === 1 && /compl[\u00e8e]t/i.test(enonQ.texte)
        && enonQ.texte.indexOf(cible.texte) >= 0 && enonQ.texte.indexOf(cible.nom) >= 0
        && enonQ.texte !== enonCours.texte, JSON.stringify(enonQ) + ' / attendu ' + JSON.stringify(cible));
      /* LE COUP DE POUCE S'OUVRE AU CLIC (demande de Turquet, septembre
         2026) — un « details » dont la page aurait cach\u00e9 le r\u00e9sum\u00e9 serait un
         bouton mort, et jsdom ne le dirait pas : il lit un attribut, pas un
         geste. Et il dit la FORME sans jamais \u00e9crire la ligne attendue. */
      await s.page.click('#pyxHost .pyd-pouce summary');
      await s.page.waitForTimeout(200);
      const pouce = await s.page.evaluate(() => {
        const l = [...document.querySelectorAll('#pyxHost .pyd-pouce')], p = l[0], t = p && p.querySelector('p');
        return { combien: l.length, ouvert: !!p && p.open, texte: t ? t.textContent : '', haut: t ? t.getBoundingClientRect().height : 0 };
      });
      verifier('un seul coup de pouce, repli\u00e9, qui s\'ouvre au clic et dit la FORME \u2014 les guillemets, la virgule \u2014 sans \u00e9crire la ligne attendue',
        pouce.combien === 1 && pouce.ouvert && pouce.haut > 10 && /guillemets/.test(pouce.texte)
        && /virgule/.test(pouce.texte) && pouce.texte.indexOf(cible.ligne) < 0, JSON.stringify(pouce));
      /* un VRAI clic sur « Vérifier » fermé ne fait rien */
      await s.page.click('#pyxValidate', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const rien = await s.page.evaluate(() => ({ fb: document.getElementById('pyxFeedback').textContent, cl: document.getElementById('pyx-in').className }));
      verifier('un clic sur « Vérifier » fermé ne juge rien', rien.fb === '' && !/ok|bad/.test(rien.cl), JSON.stringify(rien));
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      /* on TAPE d'abord une ligne FAUSSE (la variable entre guillemets), et
         Entrée l'exécute : en entraînement, la ligne juste doit s'écrire en
         VERT et SOUS la case — posée en ligne, elle se rangeait à droite,
         vu sur une capture, et jsdom n'a pas de mise en page */
      await s.page.click('#pyx-in');
      await s.page.keyboard.type('print("la note est :", "note")');
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#pyxValidate');
      await s.page.waitForTimeout(400);
      const faux1 = await s.page.evaluate(() => {
        const inp = document.getElementById('pyx-in'), b = inp.nextElementSibling;
        const ri = inp.getBoundingClientRect(), rb = b ? b.getBoundingClientRect() : null;
        return { bad: inp.classList.contains('bad'), encre: getComputedStyle(inp).color, badge: !!(b && b.classList.contains('mf-cor')),
                 texte: b && b.textContent, encreBadge: b ? getComputedStyle(b).color : '', dessous: !!rb && rb.top >= ri.bottom - 1 && rb.width > 100,
                 dedans: !!rb && rb.right <= document.documentElement.clientWidth, fb: document.getElementById('pyxFeedback').textContent,
                 score: test.score, suivant: !!document.getElementById('pyxNext') };
      });
      verifier('la ligne fausse vérifiée rougit (encre rouge rendue), le message nomme l\'erreur, et la ligne juste s\'écrit en VERT, SOUS la case, dans l\'écran',
        faux1.bad && dom(faux1.encre) === 'rouge' && faux1.badge && faux1.texte === 'print("la note est :", note)' && dom(faux1.encreBadge) === 'vert'
        && faux1.dessous && faux1.dedans && /TEXTE/.test(faux1.fb) && faux1.score === 0 && faux1.suivant, JSON.stringify(faux1));
      /* question 2 : on TAPE la ligne juste de CE tirage, et Entrée l'exécute */
      await s.page.click('#pyxNext');
      await s.page.waitForTimeout(300);
      const q2 = await s.page.evaluate(() => { const a = pyxAns(test.questions[test.idx]); return { ligne: a.ligne, sortie: a.sortie.trim(), idx: test.idx }; });
      await s.page.click('#pyx-in');
      await s.page.keyboard.type(q2.ligne);
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      const exec = await s.page.evaluate(() => {
        const cons = document.getElementById('pyxConsole'), r = cons.getBoundingClientRect();
        return { texte: cons.textContent, visible: r.height > 20 && r.width > 100, police: getComputedStyle(cons).fontFamily,
                 valOuvert: !document.getElementById('pyxValidate').disabled, valeur: document.getElementById('pyx-in').value };
      });
      verifier('question 2 : Entrée exécute la ligne tapée, la console montre la sortie attendue à chasse fixe, et « Vérifier » s\'ouvre',
        q2.idx === 1 && exec.texte === q2.sortie && exec.visible && /mono|menlo|consolas|courier/i.test(exec.police) && exec.valOuvert,
        JSON.stringify(exec) + ' / attendu ' + JSON.stringify(q2.sortie));
      await s.page.click('#pyxValidate');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(() => {
        const inp = document.getElementById('pyx-in');
        const cs = getComputedStyle(inp);
        return { ok: inp.classList.contains('ok'), score: test.score, encre: cs.color, verrou: inp.disabled, badge: !!(inp.nextElementSibling && inp.nextElementSibling.classList.contains('mf-cor')),
                 suivant: !!document.getElementById('pyxNext'), focus: document.activeElement && document.activeElement.id };
      });
      verifier('la ligne juste vérifiée est peinte ok, à l\'encre BLEUE rendue, sans ligne verte, vaut 1, se verrouille, et « Question suivante » reçoit le focus',
        apres.ok && apres.score === 1 && dom(apres.encre) === 'bleu' && !apres.badge && apres.verrou && apres.suivant && apres.focus === 'pyxNext', JSON.stringify(apres));
      /* à la largeur d'un téléphone, rien ne déborde et la case reste dans l'écran */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const inp = document.getElementById('pyx-in').getBoundingClientRect(), prog = document.querySelector('#pyxHost .pyx-prog').getBoundingClientRect();
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth, caseDedans: inp.right <= 391 && inp.width > 150, progDedans: prog.right <= 391 };
      });
      verifier('sur un téléphone, la case et le programme restent dans l\'écran et la page ne déborde pas', !tel.page && tel.caseDedans && tel.progDedans, JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* le soutien : la ligne fausse rougit, la page dit OÙ est l'erreur, la correction rouvre la porte */
      await s.page.evaluate(id => openTest(id), P.pythonCompleter.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      await s.page.click('#pyxExRun');
      await s.page.waitForTimeout(250);
      await centrer(); await s.page.waitForTimeout(150);
      await s.page.click('#pyxCompris');
      await s.page.waitForTimeout(400);
      await s.page.click('#pyx-in');
      await s.page.keyboard.type('print(la note est :, note)');
      await s.page.click('#pyxRun');
      await s.page.waitForTimeout(300);
      const err = await s.page.evaluate(() => { const c = document.getElementById('pyxConsole'); return { texte: c.textContent, encre: getComputedStyle(c).color, valOuvert: !document.getElementById('pyxValidate').disabled }; });
      verifier('en soutien, l\'erreur de Python s\'affiche dans la console, en rouge, et « Vérifier » s\'ouvre quand même', /^Erreur/.test(err.texte) && dom(err.encre) === 'rouge' && err.valOuvert, JSON.stringify(err));
      await s.page.click('#pyxValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => {
        const inp = document.getElementById('pyx-in'), fb = document.getElementById('pyxFeedback');
        return { bad: inp.classList.contains('bad'), encre: getComputedStyle(inp).color, badge: !!(inp.nextElementSibling && inp.nextElementSibling.classList.contains('mf-cor')),
                 fb: fb.textContent, fbVisible: fb.getBoundingClientRect().height > 10, verrou: inp.disabled,
                 rev: (document.getElementById('pyxValidate') || {}).textContent || '' };
      });
      verifier('la ligne fausse rougit (encre rouge rendue), sans ligne juste en vert, et le message dit où est l\'erreur — les guillemets — puis propose Revérifier',
        sout.bad && dom(sout.encre) === 'rouge' && !sout.badge && /Où est l’erreur/.test(sout.fb) && /guillemets/.test(sout.fb) && sout.fbVisible && !sout.verrou && /Rev/.test(sout.rev), JSON.stringify(sout));
      /* la correction tapée referme le bouton, l'exécution le rouvre, Revérifier vaut le point */
      await s.page.fill('#pyx-in', 'print("la note est :", note)');
      await s.page.waitForTimeout(150);
      const modif = await s.page.evaluate(() => ({ bad: document.getElementById('pyx-in').classList.contains('bad'), valFerme: document.getElementById('pyxValidate').disabled, console: document.getElementById('pyxConsole').textContent }));
      verifier('la ligne modifiée perd son rouge, referme Revérifier et vide la console', !modif.bad && modif.valFerme && modif.console === '', JSON.stringify(modif));
      await s.page.press('#pyx-in', 'Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#pyxValidate');
      await s.page.waitForTimeout(400);
      const fin = await s.page.evaluate(() => ({ ok: document.getElementById('pyx-in').classList.contains('ok'), score: test.score, suivant: !!document.getElementById('pyxNext') }));
      verifier('la correction exécutée puis revérifiée vaut 1 en soutien et propose la suite', fin.ok && fin.score === 1 && fin.suivant, JSON.stringify(fin));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies sexies. {python-deux-lignes} : deux lignes se tapent, s'exécutent, se vérifient =====
       Le banc jsdom tient le juge (la règle des paires, les deux erreurs
       propres à l'exercice, chaque diagnostic), les portes, la ligne vide et
       le soutien. Ce qu'il ne voit pas : la consigne à puces et les deux
       coups de pouce RENDUS — repliés au départ, et qui S'OUVRENT au clic —,
       les quatre lignes écrites du programme et les deux cases à chasse fixe
       et à la MÊME taille, un VRAI clic sur « Vérifier » fermé qui ne juge
       rien, les deux lignes TAPÉES au clavier dans l'ordre inverse des puces
       — Entrée exécute —, l'encre RENDUE des deux verdicts sur la même
       question (l'une bleue, l'autre rouge : c'est la règle « chaque ligne se
       juge seule », et seule une couleur rendue la montre), la ligne juste en
       VERT et SOUS la case fausse, et la page qui ne déborde pas sur un
       téléphone. Puis le soutien, où rien ne se révèle. */
    titre('6 tricies sexies. COMPLÉTER À PLUSIEURS VARIABLES : DEUX LIGNES SE TAPENT, S\'EXÉCUTENT, SE VÉRIFIENT');
    if(!P.pythonDeuxLignes){
      ignorer('les deux lignes se tapent, s\'exécutent, puis se vérifient', 'ce niveau n\'a pas l\'exercice des deux affichages à compléter');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonDeuxLignes.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      const avant = await s.page.evaluate(() => {
        const host = document.getElementById('pydHost');
        const puces = [...host.querySelectorAll('.pyd-puces li')], pouces = [...host.querySelectorAll('.pyd-pouce')];
        const l = [...host.querySelectorAll('.pyx-l1')], in0 = document.getElementById('pyd-in0'), in1 = document.getElementById('pyd-in1');
        const run = document.getElementById('pydRun'), val = document.getElementById('pydValidate'), cons = document.getElementById('pydConsole');
        const fam = e => getComputedStyle(e).fontFamily, px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const r = e => e.getBoundingClientRect();
        return { puces: puces.length, pucesVisibles: puces.every(p => r(p).width > 100 && r(p).height > 8),
                 pouces: pouces.length, pouceOuvert: pouces.some(p => p.open),
                 pouceVisible: pouces.every(p => r(p).width > 200 && r(p).height > 14),
                 lignes: l.map(e => e.textContent), policeL: l.map(fam), pxL: l.map(px),
                 policeIn: [fam(in0), fam(in1)], pxIn: [px(in0), px(in1)],
                 casesVisibles: [in0, in1].every(e => r(e).width > 200 && r(e).height > 28 && r(e).right <= document.documentElement.clientWidth),
                 runOk: !run.disabled && r(run).width > 40, valFerme: val.disabled && r(val).width > 40,
                 consoleVisible: r(cons).height > 20,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('la consigne à puces et les deux coups de pouce sont rendus, repliés au départ',
        avant.puces === 2 && avant.pucesVisibles && avant.pouces === 2 && !avant.pouceOuvert && avant.pouceVisible, JSON.stringify(avant).slice(0, 300));
      verifier('les quatre lignes écrites du programme et les deux cases sont à chasse fixe, à la même taille',
        avant.lignes.length === 4 && avant.policeL.every(f => /mono|menlo|consolas|courier/i.test(f))
        && avant.policeIn.every(f => /mono|menlo|consolas|courier/i.test(f))
        && Math.max(...avant.pxL.concat(avant.pxIn)) - Math.min(...avant.pxL.concat(avant.pxIn)) < 0.6,
        JSON.stringify({ l: avant.lignes, pxL: avant.pxL, pxIn: avant.pxIn }));
      verifier('les deux cases tiennent dans l\'écran, « Exécuter » est ouvert, « Vérifier » est fermé, et la page ne déborde pas à 1400 px',
        avant.casesVisibles && avant.runOk && avant.valFerme && avant.consoleVisible && !avant.page, JSON.stringify(avant).slice(0, 300));
      /* un coup de pouce s'OUVRE au clic — un « details » sans marqueur reste
         un bouton mort si la page a caché son résumé */
      await s.page.click('#pydHost .pyd-pouce summary');
      await s.page.waitForTimeout(200);
      const pouce = await s.page.evaluate(() => {
        const p = document.querySelector('#pydHost .pyd-pouce'), t = p.querySelector('p');
        return { ouvert: p.open, texte: t.textContent, haut: t.getBoundingClientRect().height };
      });
      verifier('un coup de pouce s\'ouvre au clic et dit la MÉTHODE — print, les guillemets, la virgule',
        pouce.ouvert && pouce.haut > 10 && /guillemets/.test(pouce.texte) && /virgule/.test(pouce.texte), JSON.stringify(pouce));
      /* un VRAI clic sur « Vérifier » fermé ne juge rien */
      await s.page.click('#pydValidate', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const rien = await s.page.evaluate(() => ({ fb: document.getElementById('pydFeedback').textContent,
        c0: document.getElementById('pyd-in0').className, c1: document.getElementById('pyd-in1').className }));
      verifier('un clic sur « Vérifier » fermé ne juge rien', rien.fb === '' && !/ok|bad/.test(rien.c0) && !/ok|bad/.test(rien.c1), JSON.stringify(rien));
      /* LE TÉLÉPHONE SE MESURE SUR LA QUESTION 1 — la fiche du carnet, dont la
         ligne modèle est LONGUE par construction (34 caractères à chasse fixe
         pour un cadre de 285 px). Mesuré sur un tirage au hasard, « la ligne
         qui ne tient pas » n'existerait pas toujours, et le contrôle serait
         INTERMITTENT : il parlerait d'autre chose une fois sur deux. */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const in0 = document.getElementById('pyd-in0').getBoundingClientRect(), boite = document.querySelector('#pydHost .pyx-prog');
        const prog = boite.getBoundingClientRect(), pouce = document.querySelector('#pydHost .pyd-pouce').getBoundingClientRect();
        /* UNE LIGNE ÉCRITE DU PROGRAMME NE SE LAISSE PAS COUPER : elle DÉFILE.
           Mesuré à 390 px, la ligne modèle fait 300 px dans un cadre de 285, et
           sa fin — « note1) » — disparaissait sans que rien ne le dise. */
        const l = [...document.querySelectorAll('#pydHost .pyx-l1')].map(e => {
          const r = e.getBoundingClientRect();
          return { t: e.textContent, deborde: r.right > prog.right + 1,
                   longue: e.scrollWidth > e.clientWidth + 1, ovf: getComputedStyle(e).overflowX };
        });
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 caseDedans: in0.right <= 391 && in0.width > 120, progDedans: prog.right <= 391, pouceDedans: pouce.right <= 391,
                 progDefile: boite.scrollWidth > boite.clientWidth + 1, lignes: l };
      });
      verifier('sur un téléphone, les cases, le programme et les coups de pouce restent dans l\'écran et la page ne déborde pas',
        !tel.page && tel.caseDedans && tel.progDedans && tel.pouceDedans, JSON.stringify(tel).slice(0, 300));
      verifier('sur un téléphone, aucune ligne écrite du programme ne déborde de son cadre — celle qui n\'y tient pas DÉFILE au lieu d\'être coupée',
        !tel.progDefile && tel.lignes.every(x => !x.deborde) && tel.lignes.some(x => x.longue)
        && tel.lignes.every(x => /auto|scroll/.test(x.ovf)),
        JSON.stringify(tel.lignes));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      await s.page.waitForTimeout(300);
      /* on TAPE la ligne du MODÈLE dans la première case — l'erreur que vise
         l'exercice — et la ligne juste de l'autre puce dans la seconde */
      const q1 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pydAns(q);
        return { modele: pydModLigne(q), lignes: a.map(x => x.ligne), sorties: a.map(x => x.sortie) };
      });
      await s.page.click('#pyd-in0');
      await s.page.keyboard.type(q1.modele);
      await s.page.click('#pyd-in1');
      await s.page.keyboard.type(q1.lignes[1]);
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#pydValidate');
      await s.page.waitForTimeout(400);
      const mix = await s.page.evaluate(() => {
        const in0 = document.getElementById('pyd-in0'), in1 = document.getElementById('pyd-in1'), b = in0.nextElementSibling;
        const r0 = in0.getBoundingClientRect(), rb = b ? b.getBoundingClientRect() : null;
        return { c0: in0.className, c1: in1.className, e0: getComputedStyle(in0).color, e1: getComputedStyle(in1).color,
                 badge: !!(b && b.classList.contains('mf-cor')), texte: b && b.textContent, encreBadge: b ? getComputedStyle(b).color : '',
                 dessous: !!rb && rb.top >= r0.bottom - 1 && rb.width > 100, dedans: !!rb && rb.right <= document.documentElement.clientWidth,
                 badge1: !!(in1.nextElementSibling && in1.nextElementSibling.classList.contains('mf-cor')),
                 fb: document.getElementById('pydFeedback').textContent, score: test.score, suivant: !!document.getElementById('pydNext') };
      });
      verifier('chaque ligne se juge SEULE : la ligne du modèle recopiée rougit (encre rouge rendue) pendant que l\'autre reste BLEUE, la ligne juste s\'écrit en VERT et SOUS la case fausse — et elle seule',
        /bad/.test(mix.c0) && dom(mix.e0) === 'rouge' && /ok/.test(mix.c1) && dom(mix.e1) === 'bleu'
        && mix.badge && mix.texte === q1.lignes[0] && dom(mix.encreBadge) === 'vert' && mix.dessous && mix.dedans && !mix.badge1
        && /déjà écrite/.test(mix.fb) && mix.score === 1 && mix.suivant, JSON.stringify(mix));
      /* question 2 : on TAPE les deux lignes justes, DANS L'ORDRE INVERSE des
         puces — la règle des paires ne se voit qu'ici, au clavier */
      await s.page.click('#pydNext');
      await s.page.waitForTimeout(300);
      const q2 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pydAns(q), s = pydModAns(q).sortie + a[1].sortie + a[0].sortie;
        return { lignes: a.map(x => x.ligne), console: s.slice(0, s.length - 1), idx: test.idx };
      });
      await s.page.click('#pyd-in0');
      await s.page.keyboard.type(q2.lignes[1]);
      await s.page.click('#pyd-in1');
      await s.page.keyboard.type(q2.lignes[0]);
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      const exec = await s.page.evaluate(() => {
        const c = document.getElementById('pydConsole'), r = c.getBoundingClientRect();
        return { texte: c.textContent, visible: r.height > 20 && r.width > 100, police: getComputedStyle(c).fontFamily,
                 valOuvert: !document.getElementById('pydValidate').disabled };
      });
      verifier('question 2 : Entrée exécute le programme entier, la console montre les TROIS lignes affichées à chasse fixe, et « Vérifier » s\'ouvre',
        q2.idx === 1 && exec.texte === q2.console && exec.visible && /mono|menlo|consolas|courier/i.test(exec.police) && exec.valOuvert,
        JSON.stringify(exec) + ' / attendu ' + JSON.stringify(q2.console));
      await s.page.click('#pydValidate');
      await s.page.waitForTimeout(400);
      const apres = await s.page.evaluate(() => {
        const in0 = document.getElementById('pyd-in0'), in1 = document.getElementById('pyd-in1');
        return { ok: /ok/.test(in0.className) && /ok/.test(in1.className), e0: getComputedStyle(in0).color, e1: getComputedStyle(in1).color,
                 score: test.score, verrou: in0.disabled && in1.disabled,
                 badge: !!(in0.nextElementSibling && in0.nextElementSibling.classList.contains('mf-cor')),
                 suivant: !!document.getElementById('pydNext'), focus: document.activeElement && document.activeElement.id };
      });
      verifier('les deux lignes justes écrites dans l\'AUTRE ORDRE sont peintes ok, à l\'encre BLEUE rendue, sans ligne verte, valent 2, verrouillent, et « Question suivante » reçoit le focus',
        apres.ok && dom(apres.e0) === 'bleu' && dom(apres.e1) === 'bleu' && apres.score === 3 && apres.verrou && !apres.badge && apres.suivant && apres.focus === 'pydNext', JSON.stringify(apres));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* le soutien : la ligne fausse rougit, la page dit OÙ est l'erreur, rien ne se révèle */
      await s.page.evaluate(id => openTest(id), P.pythonDeuxLignes.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const q3 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pydAns(q);
        return { faux: 'print("' + q.att[0].texte + '", ' + q.mod.nom + ')', variable: q.mod.nom, lignes: a.map(x => x.ligne) };
      });
      await s.page.click('#pyd-in0');
      await s.page.keyboard.type(q3.faux);
      await s.page.click('#pyd-in1');
      await s.page.keyboard.type(q3.lignes[1]);
      await s.page.click('#pydRun');
      await s.page.waitForTimeout(300);
      await s.page.click('#pydValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => {
        const in0 = document.getElementById('pyd-in0'), fb = document.getElementById('pydFeedback');
        return { bad: /bad/.test(in0.className), encre: getComputedStyle(in0).color,
                 badge: !!(in0.nextElementSibling && in0.nextElementSibling.classList.contains('mf-cor')),
                 fb: fb.textContent, fbVisible: fb.getBoundingClientRect().height > 10, verrou: in0.disabled,
                 rev: (document.getElementById('pydValidate') || {}).textContent || '' };
      });
      verifier('en soutien, la ligne fausse rougit (encre rouge rendue), sans ligne juste en vert, le message dit où est l\'erreur — la variable prise à la place — puis propose Revérifier',
        sout.bad && dom(sout.encre) === 'rouge' && !sout.badge && /Où est l’erreur/.test(sout.fb)
        && sout.fb.indexOf(q3.variable) >= 0 && sout.fb.indexOf(q3.lignes[0]) < 0 && sout.fbVisible && !sout.verrou && /Rev/.test(sout.rev), JSON.stringify(sout));
      await s.page.fill('#pyd-in0', q3.lignes[0]);
      await s.page.waitForTimeout(150);
      const modif = await s.page.evaluate(() => ({ bad: /bad/.test(document.getElementById('pyd-in0').className),
        valFerme: document.getElementById('pydValidate').disabled, console: document.getElementById('pydConsole').textContent }));
      verifier('la ligne modifiée perd son rouge, referme Revérifier et vide la console', !modif.bad && modif.valFerme && modif.console === '', JSON.stringify(modif));
      await s.page.press('#pyd-in0', 'Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#pydValidate');
      await s.page.waitForTimeout(400);
      const fin2 = await s.page.evaluate(() => ({ ok: /ok/.test(document.getElementById('pyd-in0').className),
        score: test.score, suivant: !!document.getElementById('pydNext') }));
      verifier('la correction exécutée puis revérifiée vaut 2 en soutien et propose la suite', fin2.ok && fin2.score === 2 && fin2.suivant, JSON.stringify(fin2));
      await s.nav.close(); s = null;
    }
    /* ===== 6 tricies octies. {python-placer-variables} : les noms se tapent dans la ligne de print =====
       Le banc jsdom tient le tirage, le juge, le diagnostic, les portes, la
       case vide et le soutien. Ce qu'il ne voit pas : la ligne de print
       RENDUE — ses cases à la chasse et à la taille du code qui les entoure,
       et la ligne d'un seul tenant, jamais repliée —, un VRAI clic sur
       « Vérifier » fermé qui ne juge rien, les noms TAPÉS au clavier (Entrée
       exécute), la console qui montre la phrase INTERVERTIE — celle qui ne
       lève aucune erreur et qui est tout le sujet —, l'encre RENDUE des deux
       verdicts sur la même question (l'une bleue, l'autre rouge : c'est la
       règle « chaque case se juge seule », et seule une couleur rendue la
       montre), la bonne variable en VERT à côté de la case fausse, et le
       téléphone, où la ligne DÉFILE au lieu d'être coupée. Puis le soutien,
       où rien ne se révèle.
       TOUT SE MESURE SUR LA QUESTION 1, la fiche du carnet, ÉPINGLÉE : sur un
       tirage au hasard, la longueur de la ligne et le nombre de cases
       changeraient d'une exécution à l'autre, et le contrôle serait
       INTERMITTENT. */
    titre('6 tricies octies. PLACER LES VARIABLES : LES NOMS SE TAPENT DANS LA LIGNE DE PRINT');
    if(!P.pythonPlacerVariables){
      ignorer('les noms des variables se tapent dans la ligne de print', 'ce niveau n\'a pas l\'exercice des variables à placer dans un print');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonPlacerVariables.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      const avant = await s.page.evaluate(() => {
        const host = document.getElementById('pyvHost');
        const l = [...host.querySelectorAll('.pyx-l1')], ligne = host.querySelector('.pyv-l');
        const cases = [...host.querySelectorAll('.pyv-in')];
        const run = document.getElementById('pyvRun'), val = document.getElementById('pyvValidate'), cons = document.getElementById('pyvConsole');
        const fam = e => getComputedStyle(e).fontFamily, px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const r = e => e.getBoundingClientRect();
        const rl = r(ligne);
        return { affectations: l.map(e => e.textContent), texte: ligne.textContent,
                 cases: cases.length, pxL: px(ligne), pxIn: cases.map(px),
                 policeL: fam(ligne), policeIn: cases.map(fam),
                 /* UNE LIGNE DE CODE NE SE REPLIE JAMAIS : sa hauteur est celle
                    d'une seule ligne, et ses cases partagent cette ligne. */
                 hautLigne: Math.round(rl.height), hautCase: Math.round(r(cases[0]).height),
                 memeLigne: cases.every(c => Math.abs(r(c).top - r(cases[0]).top) < 2),
                 dedans: cases.every(c => r(c).right <= host.querySelector('.pyx-prog').getBoundingClientRect().right + 1),
                 defile: ligne.scrollWidth > ligne.clientWidth + 1, ovf: getComputedStyle(ligne).overflowX,
                 runOk: !run.disabled && r(run).width > 40, valFerme: val.disabled && r(val).width > 40,
                 consoleVisible: r(cons).height > 20, policeCons: fam(cons),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('les deux affectations et la ligne de print à trous sont rendues, avec ses deux cases',
        avant.affectations.length === 2 && /note = 14/.test(avant.affectations[0]) && avant.cases === 2
        && /print\(/.test(avant.texte) && /sur 20/.test(avant.texte), JSON.stringify(avant).slice(0, 300));
      verifier('les cases écrivent à la chasse et à la taille du code qui les entoure',
        /mono|menlo|consolas|courier/i.test(avant.policeL) && avant.policeIn.every(f => /mono|menlo|consolas|courier/i.test(f))
        && avant.pxIn.every(p => Math.abs(p - avant.pxL) < 0.6),
        JSON.stringify({ pxL: avant.pxL, pxIn: avant.pxIn, policeL: avant.policeL, policeIn: avant.policeIn }));
      /* LA CASE A LA PLACE DU NOM LE PLUS LONG DU PROGRAMME. Sa largeur se
         pose en « ch », et la page étant en box-sizing:border-box ces ch
         comprendraient le rembourrage et la bordure — seize pixels mangés sur
         le texte, et « prenom » se serait affiché coupé sans qu'aucune erreur
         ne se lève (la leçon du 5.5, et sa mesure celle du 6.3). On mesure le
         texte au CANEVAS, dans la police EFFECTIVE de la case. */
      const place = await s.page.evaluate(() => {
        const ctx = document.createElement('canvas').getContext('2d'), serre = [], marges = [];
        const noms = pyvNoms(test.questions[test.idx]);
        [...document.querySelectorAll('#pyvHost .pyv-in')].forEach(el => {
          const st = getComputedStyle(el);
          ctx.font = st.fontStyle + ' ' + st.fontWeight + ' ' + st.fontSize + ' ' + st.fontFamily;
          const dispo = el.clientWidth - (parseFloat(st.paddingLeft) || 0) - (parseFloat(st.paddingRight) || 0);
          noms.forEach(n => { const w = ctx.measureText(n).width;
            marges.push(dispo - w);
            if(dispo < w + 2) serre.push(el.id + ' : ' + Math.round(dispo) + ' px pour « ' + n + ' » (' + Math.round(w) + ' px)'); });
        });
        return { serre: serre, marge: Math.round(Math.min.apply(null, marges) * 10) / 10 };
      });
      verifier('chaque case a la place d\'écrire le nom le plus long du programme, rembourrage déduit',
        place.serre.length === 0, place.serre.join(' | '));
      /* La marge s'AFFICHE à chaque exécution : en border-box elle tombe à
         4,6 px (mesuré) — la page ne coupe pas le nom pour autant, mais elle
         ne tient plus que par chance. En content-box, 20,6 px. */
      console.log('   · la case la plus serrée : ' + place.marge + ' px de marge autour du nom le plus long');
      verifier('la ligne de print tient sur UNE ligne — les deux cases y partagent la ligne du code, et rien n\'en déborde à 1400 px',
        avant.memeLigne && avant.hautLigne < avant.hautCase * 2 && avant.dedans && !avant.defile && !avant.page,
        JSON.stringify(avant).slice(0, 300));
      verifier('« Exécuter » est ouvert, « Vérifier » est fermé, la console est rendue à chasse fixe',
        avant.runOk && avant.valFerme && avant.consoleVisible && /mono|menlo|consolas|courier/i.test(avant.policeCons), JSON.stringify(avant).slice(0, 300));
      /* un VRAI clic sur « Vérifier » fermé ne juge rien */
      await s.page.click('#pyvValidate', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const rien = await s.page.evaluate(() => ({ fb: document.getElementById('pyvFeedback').textContent,
        c0: document.getElementById('pyv-in0').className, c1: document.getElementById('pyv-in1').className }));
      verifier('un clic sur « Vérifier » fermé ne juge rien', rien.fb === '' && !/ok|bad/.test(rien.c0) && !/ok|bad/.test(rien.c1), JSON.stringify(rien));
      /* ON TAPE L'INTERVERSION — l'erreur que vise l'exercice : Python ne lève
         AUCUNE erreur, et c'est la phrase qui ne dit plus rien. */
      const q1 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pyvAns(q);
        return { noms: a.map(x => x.variable), phrase: pyvSortie(q).replace(/\n$/, ''),
                 inverse: pyRun(pyvProg(q, [a[1].variable, a[0].variable])).out.replace(/\n$/, '') };
      });
      await s.page.click('#pyv-in0');
      await s.page.keyboard.type(q1.noms[1]);
      await s.page.click('#pyv-in1');
      await s.page.keyboard.type(q1.noms[0]);
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      const inverse = await s.page.evaluate(() => {
        const c = document.getElementById('pyvConsole');
        return { texte: c.textContent, erreur: c.classList.contains('pyx-err'),
                 valOuvert: !document.getElementById('pyvValidate').disabled };
      });
      verifier('Entrée exécute : la console montre la phrase INTERVERTIE, sans la moindre erreur — et « Vérifier » s\'ouvre',
        inverse.texte === q1.inverse && !inverse.erreur && inverse.valOuvert,
        JSON.stringify(inverse) + ' / attendu ' + JSON.stringify(q1.inverse));
      /* on corrige la PREMIÈRE case et on laisse la seconde fausse : chaque
         case se juge seule, et seule une couleur rendue le montre */
      await s.page.fill('#pyv-in0', q1.noms[0]);
      await s.page.waitForTimeout(150);
      await s.page.click('#pyvRun');
      await s.page.waitForTimeout(300);
      await s.page.click('#pyvValidate');
      await s.page.waitForTimeout(400);
      const mix = await s.page.evaluate(() => {
        const in0 = document.getElementById('pyv-in0'), in1 = document.getElementById('pyv-in1'), b = in1.nextElementSibling;
        const r1 = in1.getBoundingClientRect(), rb = b ? b.getBoundingClientRect() : null;
        return { c0: in0.className, c1: in1.className, e0: getComputedStyle(in0).color, e1: getComputedStyle(in1).color,
                 badge: !!(b && b.classList.contains('mf-cor')), texte: b && b.textContent, encreBadge: b ? getComputedStyle(b).color : '',
                 aCote: !!rb && rb.left >= r1.right - 1 && Math.abs(rb.top - r1.top) < r1.height,
                 dedans: !!rb && rb.width > 8 && rb.right <= document.documentElement.clientWidth,
                 badge0: !!(in0.nextElementSibling && in0.nextElementSibling.classList.contains('mf-cor')),
                 fb: document.getElementById('pyvFeedback').textContent, score: test.score, suivant: !!document.getElementById('pyvNext') };
      });
      verifier('chaque case se juge SEULE : la case intervertie rougit (encre rouge rendue) pendant que l\'autre reste BLEUE, la bonne variable s\'écrit en VERT À CÔTÉ de la case fausse — et d\'elle seule',
        /bad/.test(mix.c1) && dom(mix.e1) === 'rouge' && /ok/.test(mix.c0) && dom(mix.e0) === 'bleu'
        && mix.badge && mix.texte === q1.noms[1] && dom(mix.encreBadge) === 'vert' && mix.aCote && mix.dedans && !mix.badge0
        && mix.score === 1 && mix.suivant, JSON.stringify(mix));
      /* question 2 : on TAPE la copie juste, et la console dit la phrase */
      await s.page.click('#pyvNext');
      await s.page.waitForTimeout(300);
      const q2 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pyvAns(q);
        return { noms: a.map(x => x.variable), phrase: pyvSortie(q).replace(/\n$/, ''), idx: test.idx, cases: pyvCases(q).length };
      });
      for(let i = 0; i < q2.noms.length; i++){
        await s.page.click('#pyv-in' + i);
        await s.page.keyboard.type(q2.noms[i]);
      }
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#pyvValidate');
      await s.page.waitForTimeout(400);
      const juste = await s.page.evaluate(() => {
        const cases = [...document.querySelectorAll('.pyv-in')];
        return { ok: cases.every(c => /ok/.test(c.className)), encres: cases.map(c => getComputedStyle(c).color),
                 console: document.getElementById('pyvConsole').textContent, score: test.score,
                 verrou: cases.every(c => c.disabled), badge: cases.some(c => c.nextElementSibling && c.nextElementSibling.classList.contains('mf-cor')),
                 fb: document.getElementById('pyvFeedback').textContent,
                 suivant: !!document.getElementById('pyvNext'), focus: document.activeElement && document.activeElement.id };
      });
      verifier('question 2 : les noms TAPÉS à la bonne place sont peints ok à l\'encre BLEUE rendue, la console montre la phrase, la copie vaut ses cases, verrouille, sans rien en vert, et « Question suivante » reçoit le focus',
        q2.idx === 1 && juste.ok && juste.encres.every(e => dom(e) === 'bleu') && juste.console === q2.phrase
        && juste.score === 1 + q2.cases && juste.verrou && !juste.badge && juste.suivant && juste.focus === 'pyvNext',
        JSON.stringify(juste).slice(0, 320) + ' / phrase attendue ' + JSON.stringify(q2.phrase));
      /* LE TÉLÉPHONE SE MESURE SUR LA FICHE — sa ligne de print est LONGUE par
         construction. Une ligne de code ne se replie jamais : elle DÉFILE. */
      await s.page.evaluate(id => openTest(id), P.pythonPlacerVariables.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const ligne = document.querySelector('#pyvHost .pyv-l'), boite = document.querySelector('#pyvHost .pyx-prog');
        const rl = ligne.getBoundingClientRect(), rp = boite.getBoundingClientRect();
        const in0 = document.getElementById('pyv-in0').getBoundingClientRect();
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 progDedans: rp.right <= 391, ligneDedans: rl.right <= rp.right + 1,
                 progDefile: boite.scrollWidth > boite.clientWidth + 1,
                 longue: ligne.scrollWidth > ligne.clientWidth + 1, ovf: getComputedStyle(ligne).overflowX,
                 caseVisible: in0.width > 40 && in0.height > 20 };
      });
      verifier('sur un téléphone, la page ne déborde pas et la ligne de print, trop longue pour le cadre, DÉFILE au lieu d\'être coupée',
        !tel.page && tel.progDedans && tel.ligneDedans && !tel.progDefile && tel.longue && /auto|scroll/.test(tel.ovf) && tel.caseVisible,
        JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      await s.page.waitForTimeout(300);
      /* le soutien : la case fausse rougit, la page dit OÙ est l'erreur, et la
         variable attendue ne s'écrit NULLE PART */
      await s.page.evaluate(id => openTest(id), P.pythonPlacerVariables.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const q3 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pyvAns(q);
        return { noms: a.map(x => x.variable), textes: a.map(x => x.texte.trim()) };
      });
      await s.page.click('#pyv-in0');
      await s.page.keyboard.type(q3.noms[1]);
      await s.page.click('#pyv-in1');
      await s.page.keyboard.type(q3.noms[1]);
      await s.page.click('#pyvRun');
      await s.page.waitForTimeout(300);
      await s.page.click('#pyvValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => {
        const in0 = document.getElementById('pyv-in0'), fb = document.getElementById('pyvFeedback');
        return { bad: /bad/.test(in0.className), encre: getComputedStyle(in0).color,
                 badge: !!(in0.nextElementSibling && in0.nextElementSibling.classList.contains('mf-cor')),
                 fb: fb.textContent, fbVisible: fb.getBoundingClientRect().height > 10, verrou: in0.disabled,
                 rev: (document.getElementById('pyvValidate') || {}).textContent || '' };
      });
      verifier('en soutien, la case fausse rougit (encre rouge rendue), sans bonne variable en vert, le message renvoie au texte qui précède la case SANS nommer la variable attendue, puis propose Revérifier',
        sout.bad && dom(sout.encre) === 'rouge' && !sout.badge && /Où est l’erreur/.test(sout.fb)
        && sout.fb.indexOf(q3.textes[0]) >= 0 && sout.fb.indexOf(q3.noms[0]) < 0 && sout.fbVisible && !sout.verrou && /Rev/.test(sout.rev), JSON.stringify(sout));
      await s.page.fill('#pyv-in0', q3.noms[0]);
      await s.page.waitForTimeout(150);
      const modif = await s.page.evaluate(() => ({ bad: /bad/.test(document.getElementById('pyv-in0').className),
        valFerme: document.getElementById('pyvValidate').disabled, console: document.getElementById('pyvConsole').textContent }));
      verifier('la case modifiée perd son rouge, referme Revérifier et vide la console', !modif.bad && modif.valFerme && modif.console === '', JSON.stringify(modif));
      await s.page.press('#pyv-in0', 'Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#pyvValidate');
      await s.page.waitForTimeout(400);
      const fin2 = await s.page.evaluate(() => ({ ok: /ok/.test(document.getElementById('pyv-in0').className),
        score: test.score, suivant: !!document.getElementById('pyvNext') }));
      verifier('la correction exécutée puis revérifiée vaut ses cases en soutien et propose la suite', fin2.ok && fin2.score === 2 && fin2.suivant, JSON.stringify(fin2));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies nonies. le tableau de valeurs se remplit en exécutant ===== */
    /* {python-tableau-valeurs} : ce que jsdom ne peut pas voir — le programme
       et le tableau RENDUS, la case de x posée DANS la ligne 1 à la chasse et
       à la taille du code, une VRAIE frappe au clavier puis un VRAI clic sur
       « Exécuter », les colonnes fermées qui se VOIENT (grisées, en
       pointillés), l'encre RENDUE des verdicts et de la valeur juste en vert,
       et la page qui ne déborde pas sur un téléphone. */
    titre('6 tricies nonies. LE TABLEAU DE VALEURS SE REMPLIT EN EXÉCUTANT LE PROGRAMME');
    if(!P.pythonTableauValeurs){
      ignorer('le tableau de valeurs se remplit en exécutant le programme', 'ce niveau n\'a pas l\'exercice du tableau de valeurs');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonTableauValeurs.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      /* LES TROIS ENCRES DE LA CONVENTION, résolues par le navigateur : l'encre
         de REPOS d'une case est déjà un bleu nuit, si bien qu'une règle « .ok »
         qui ne peindrait plus rien passerait pour du bleu à la dominante — le
         piège payé sur {python-print}. On compare à la VARIABLE. */
      const encres = await s.page.evaluate(() => {
        const t = document.createElement('span'); document.body.appendChild(t);
        const lire = v => { t.style.color = 'var(' + v + ')'; return getComputedStyle(t).color; };
        const o = { blue: lire('--blue'), red: lire('--red'), green: lire('--green'), ink: lire('--ink') };
        t.remove(); return o;
      });
      const q = await s.page.evaluate(() => {
        const q = test.questions[test.idx];
        return { dep: String(q.dep), xs: q.ns.map(n => ptvX(n)), fr: q.ns.map(n => ptvXfr(n)),
                 sorties: q.ns.map(n => ptvSortie(q, ptvX(n))), depSortie: ptvSortie(q, String(q.dep)), calcul: ptvMaths(q) };
      });
      const avant = await s.page.evaluate(() => {
        const host = document.getElementById('ptvHost'), r = e => e.getBoundingClientRect();
        const fam = e => getComputedStyle(e).fontFamily, px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const l = [...host.querySelectorAll('.pyx-l1')], x = document.getElementById('ptv-x');
        const cases = [...host.querySelectorAll('.ptv-in')], tab = host.querySelector('.ptv-tab');
        const boite = host.querySelector('.ptv-wrap');
        return { lignes: l.length, policeL: l.map(fam), pxL: l.map(px),
                 xVisible: r(x).width > 30 && r(x).height > 20, policeX: fam(x), pxX: px(x),
                 /* la case de x vit DANS la ligne 1, à sa hauteur : posée
                    ailleurs, le programme ne se lirait plus d'un trait */
                 xDansLigne: Math.min(r(x).bottom, r(l[0]).bottom) - Math.max(r(x).top, r(l[0]).top) > 5,
                 cases: cases.length, fermees: cases.filter(e => e.disabled).length,
                 /* une colonne fermée SE VOIT : elle n'a pas l'encre d'une case
                    ouverte, et son cadre est en pointillés */
                 fondFerme: getComputedStyle(cases[0]).backgroundColor, traitFerme: getComputedStyle(cases[0]).borderTopStyle,
                 policeC: cases.map(fam), pxC: cases.map(px),
                 rangees: tab.querySelectorAll('tr').length, colonnes: tab.querySelectorAll('tr')[0].querySelectorAll('td').length,
                 tabVisible: r(tab).width > 300 && r(tab).height > 60,
                 tabDefile: boite.scrollWidth > boite.clientWidth + 1,
                 run: !document.getElementById('ptvRun').disabled && r(document.getElementById('ptvRun')).width > 40,
                 etat: document.getElementById('ptvEtat').textContent,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('le programme est rendu en trois lignes à chasse fixe, et la case de x vit DANS la ligne 1, à sa taille',
        avant.lignes === 3 && avant.policeL.every(f => /mono|menlo|consolas|courier/i.test(f))
        && /mono|menlo|consolas|courier/i.test(avant.policeX) && avant.xVisible && avant.xDansLigne
        && Math.abs(avant.pxX - Math.max(...avant.pxL)) < 0.6, JSON.stringify(avant).slice(0, 300));
      verifier('le tableau est rendu : deux rangées, ' + P.pythonTableauValeurs.cols + ' colonnes, sans défilement à 1400 px — et ses ' + P.pythonTableauValeurs.cols + ' cases sont FERMÉES et se VOIENT fermées',
        avant.rangees === 2 && avant.colonnes === P.pythonTableauValeurs.cols && avant.tabVisible && !avant.tabDefile
        && avant.cases === P.pythonTableauValeurs.cols && avant.fermees === P.pythonTableauValeurs.cols
        && avant.traitFerme === 'dashed' && dom(avant.fondFerme) === 'autre'
        && avant.run && !avant.page, JSON.stringify(avant).slice(0, 360));
      /* a) UN VRAI CLIC SUR « EXÉCUTER » : la console répond, rien ne s'ouvre */
      await s.page.click('#ptvRun');
      await s.page.waitForTimeout(300);
      const aa = await s.page.evaluate(() => {
        const c = document.getElementById('ptvConsole'), r = c.getBoundingClientRect();
        return { texte: c.textContent, visible: r.height > 20 && r.width > 100, police: getComputedStyle(c).fontFamily,
                 fermees: [...document.querySelectorAll('#ptvHost .ptv-in')].filter(e => e.disabled).length };
      });
      verifier('a) le programme s\'exécute au clic : la console affiche « ' + q.depSortie + ' » à chasse fixe, et aucune colonne ne s\'ouvre sur une valeur qui n\'est pas la sienne',
        aa.texte === q.depSortie && aa.visible && /mono|menlo|consolas|courier/i.test(aa.police)
        && aa.fermees === P.pythonTableauValeurs.cols, JSON.stringify(aa));
      /* LA VIRGULE, TAPÉE POUR DE VRAI : le tableau écrit 0,5 et Python veut 0.5 */
      await s.page.click('#ptv-x');
      await s.page.keyboard.press('Control+a');
      await s.page.keyboard.type(q.fr[0]);
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      const virg = await s.page.evaluate(() => {
        const c = document.getElementById('ptvConsole');
        return { texte: c.textContent, encre: getComputedStyle(c).color,
                 fermees: [...document.querySelectorAll('#ptvHost .ptv-in')].filter(e => e.disabled).length };
      });
      verifier('la virgule tapée dans la case de x reçoit la RÈGLE, en rouge rendu, et n\'ouvre aucune colonne',
        /POINT/.test(virg.texte) && virg.texte.indexOf(q.xs[0]) >= 0 && virg.encre === encres.red
        && virg.fermees === P.pythonTableauValeurs.cols, JSON.stringify(virg));
      /* LA PORTE : on TAPE la valeur d'une colonne, Entrée exécute, elle s'ouvre */
      await s.page.click('#ptv-x');
      await s.page.keyboard.press('Control+a');
      await s.page.keyboard.type(q.xs[2]);
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(300);
      const porte = await s.page.evaluate(() => {
        const cases = [...document.querySelectorAll('#ptvHost .ptv-in')];
        return { texte: document.getElementById('ptvConsole').textContent,
                 ouvertes: cases.filter(e => !e.disabled).map((e, i) => e.id), ouverte2: !cases[2].disabled,
                 fond: getComputedStyle(cases[2]).backgroundColor, trait: getComputedStyle(cases[2]).borderTopStyle,
                 focus: document.activeElement && document.activeElement.id,
                 etat: document.getElementById('ptvEtat').textContent };
      });
      verifier('la colonne dont on a exécuté la valeur s\'OUVRE — elle seule —, se voit ouverte, et reçoit le focus',
        porte.texte === q.sorties[2] && porte.ouverte2 && porte.ouvertes.length === 1
        && porte.trait === 'solid' && porte.focus === 'ptv-c2' && /1/.test(porte.etat), JSON.stringify(porte));
      /* on remplit le tableau en entier — une case FAUSSE, pour lire les trois encres */
      for(let i = 0; i < q.xs.length; i++){
        await s.page.click('#ptv-x');
        await s.page.keyboard.press('Control+a');
        await s.page.keyboard.type(q.xs[i]);
        await s.page.keyboard.press('Enter');
        await s.page.waitForTimeout(150);
        await s.page.click('#ptv-c' + i);
        await s.page.keyboard.type(i === 1 ? '99' : q.sorties[i]);
      }
      await s.page.waitForTimeout(200);
      const pret = await s.page.evaluate(() => ({
        ouvertes: [...document.querySelectorAll('#ptvHost .ptv-in')].filter(e => !e.disabled).length,
        etat: document.getElementById('ptvEtat').textContent }));
      verifier('les ' + P.pythonTableauValeurs.cols + ' colonnes s\'ouvrent une à une et le restent — l\'état le dit',
        pret.ouvertes === P.pythonTableauValeurs.cols && /complète/.test(pret.etat), JSON.stringify(pret));
      await s.page.click('#ptvValidate');
      await s.page.waitForTimeout(400);
      const verd = await s.page.evaluate(() => {
        const cases = [...document.querySelectorAll('#ptvHost .ptv-in')];
        const b = cases[1].parentNode.querySelector('.mf-cor'), rb = b ? b.getBoundingClientRect() : null;
        const r1 = cases[1].getBoundingClientRect();
        return { classes: cases.map(e => e.className.replace('ptv-in', '').trim()),
                 encres: cases.map(e => getComputedStyle(e).color),
                 badge: !!b, texte: b && b.textContent, encreBadge: b ? getComputedStyle(b).color : '',
                 dessous: !!rb && rb.top >= r1.bottom - 1 && rb.width > 10,
                 dedans: !!rb && rb.right <= document.documentElement.clientWidth,
                 autresBadges: cases.filter((e, i) => i !== 1 && e.parentNode.querySelector('.mf-cor')).length,
                 score: test.score, verrou: cases.every(e => e.disabled), suivant: !!document.getElementById('ptvNext'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('chaque case se juge SEULE, à l\'encre RENDUE : la fausse porte l\'encre --red, les autres --blue, et la valeur juste s\'écrit en --green sous la case fausse — elle seule',
        verd.encres[1] === encres.red && /bad/.test(verd.classes[1])
        && [0, 2, 3, 4].every(i => verd.encres[i] === encres.blue && /ok/.test(verd.classes[i]))
        && verd.badge && verd.texte === q.sorties[1] && verd.encreBadge === encres.green
        && verd.dessous && verd.dedans && verd.autresBadges === 0
        && verd.score === P.pythonTableauValeurs.cols - 1 && verd.verrou && verd.suivant && !verd.page,
        JSON.stringify(verd).slice(0, 400));
      /* SUR UN TÉLÉPHONE : le tableau ne tient pas en largeur — il DÉFILE dans
         sa boîte, jamais la page, qui emmènerait tout l'écran de travers. */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const host = document.getElementById('ptvHost'), boite = host.querySelector('.ptv-wrap');
        const prog = host.querySelector('.pyx-prog').getBoundingClientRect();
        const x = document.getElementById('ptv-x').getBoundingClientRect();
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 progDedans: prog.right <= 391, xDedans: x.right <= 391,
                 boiteDedans: boite.getBoundingClientRect().right <= 391,
                 boiteDefile: boite.scrollWidth > boite.clientWidth + 1,
                 ovf: getComputedStyle(boite).overflowX };
      });
      verifier('sur un téléphone, le programme et sa case restent dans l\'écran, et le tableau DÉFILE dans sa boîte au lieu de faire déborder la page',
        !tel.page && tel.progDedans && tel.xDedans && tel.boiteDedans && /auto|scroll/.test(tel.ovf), JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* LE SOUTIEN : la case fausse rougit, et RIEN ne se révèle */
      await s.page.evaluate(id => openTest(id), P.pythonTableauValeurs.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const qs = await s.page.evaluate(() => {
        const q = test.questions[test.idx];
        return { xs: q.ns.map(n => ptvX(n)), sorties: q.ns.map(n => ptvSortie(q, ptvX(n))) };
      });
      for(let i = 0; i < qs.xs.length; i++){
        await s.page.click('#ptv-x');
        await s.page.keyboard.press('Control+a');
        await s.page.keyboard.type(qs.xs[i]);
        await s.page.keyboard.press('Enter');
        await s.page.waitForTimeout(150);
        await s.page.click('#ptv-c' + i);
        await s.page.keyboard.type(i === 0 ? '0' : qs.sorties[i]);
      }
      await s.page.click('#ptvValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => {
        const cases = [...document.querySelectorAll('#ptvHost .ptv-in')];
        return { classe: cases[0].className, encre: getComputedStyle(cases[0]).color,
                 badges: cases.filter(e => e.parentNode.querySelector('.mf-cor')).length,
                 fb: document.getElementById('ptvFeedback').textContent,
                 verrou: cases[0].disabled, score: test.score,
                 bouton: (document.getElementById('ptvValidate') || {}).textContent || '' };
      });
      verifier('en soutien : la case fausse rougit à l\'encre rendue, AUCUNE valeur verte, rien n\'est verrouillé, et « Revérifier » est proposé',
        /bad/.test(sout.classe) && sout.encre === encres.red && sout.badges === 0
        && sout.fb.indexOf(qs.sorties[0]) < 0 && !sout.verrou && sout.score === 0
        && /Rev/.test(sout.bouton), JSON.stringify(sout));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies decies. {python-changer-valeurs} : les valeurs se changent, le programme suit =====
       Le banc jsdom tient la fiche du carnet, le tirage, le juge, les trois
       portes et la phrase de prédiction qui suit les valeurs. Ce qu'il ne voit
       pas : les six lignes du programme RENDUES à chasse fixe avec les deux
       cases de valeur à la MÊME taille que le code qui les entoure, la case de
       prédiction à la taille des nombres de sa phrase — le contrôle universel
       ne mesure que les math-field, et celles-ci sont des input —, un VRAI clic
       sur « Exécuter » verrouillé qui ne fait rien, les valeurs TAPÉES au
       clavier et la phrase qui les suit sous les doigts, l'encre RENDUE des
       verdicts, la console, et la page qui ne déborde pas sur un téléphone. */
    titre('6 tricies decies. CHANGER LES VALEURS : LE PROGRAMME SUIT, ET LA PHRASE AUSSI');
    if(!P.pythonChangerValeurs){
      ignorer('les valeurs se changent et tout ce qui se calcule suit', 'ce niveau n\'a pas l\'exercice des valeurs qu\'on change');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonChangerValeurs.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      /* ---- question 1 : la fiche du carnet, valeurs DONNÉES ---- */
      const un = await s.page.evaluate(() => {
        const host = document.getElementById('pcvHost');
        const l = [...host.querySelectorAll('.pyx-l1')], pred = [...host.querySelectorAll('.pcv-ligne')];
        const s0 = document.getElementById('pcv-s'), p0 = document.getElementById('pcv-p');
        const run = document.getElementById('pcvRun'), cons = document.getElementById('pcvConsole');
        const fam = e => getComputedStyle(e).fontFamily, px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const r = e => e.getBoundingClientRect();
        /* la case de prédiction a la taille des nombres qui l'entourent : ceux
           de sa propre phrase, mis en gras par la page */
        const voisins = pred.map(d => px(d.querySelector('.pcv-txt b')));
        return { lignes: l.map(e => e.textContent), policeL: l.map(fam), pxL: l.map(px),
                 pred: pred.length, texte: pred.map(d => d.querySelector('.pcv-txt').textContent),
                 pxIn: [px(s0), px(p0)], voisins: voisins,
                 casesVisibles: [s0, p0].every(e => r(e).width > 50 && r(e).height > 28 && r(e).right <= document.documentElement.clientWidth),
                 runFerme: run.disabled && r(run).width > 40, consoleVide: cons.textContent === '',
                 policeC: fam(cons), pasDeValeur: !document.getElementById('pcv-a'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('les six lignes du programme sont rendues à chasse fixe, à la même taille',
        un.lignes.length === 6 && un.policeL.every(f => /mono|menlo|consolas|courier/i.test(f))
        && Math.max(...un.pxL) - Math.min(...un.pxL) < 0.6, JSON.stringify({ l: un.lignes, px: un.pxL }));
      verifier('la phrase de prédiction reprend les DEUX lignes du programme, et sa case a la taille des nombres qui l\'entourent',
        un.pred === 2 && /La somme de/.test(un.texte[0]) && /Le produit de/.test(un.texte[1])
        && un.casesVisibles && un.voisins.every((v, i) => Math.abs(v - un.pxIn[i]) < 0.6),
        JSON.stringify({ t: un.texte, pxIn: un.pxIn, voisins: un.voisins }));
      verifier('au visage DONNÉ il n\'y a aucune case de valeur, « Exécuter » est verrouillé, la console est vide et à chasse fixe, et la page ne déborde pas à 1400 px',
        un.pasDeValeur && un.runFerme && un.consoleVide && /mono|menlo|consolas|courier/i.test(un.policeC) && !un.page, JSON.stringify(un).slice(0, 300));
      /* un VRAI clic sur « Exécuter » verrouillé ne fait rien */
      await s.page.click('#pcvRun', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const rien = await s.page.evaluate(() => ({ console: document.getElementById('pcvConsole').textContent,
        suivant: !!document.getElementById('pcvNext') }));
      verifier('un clic sur « Exécuter » verrouillé n\'exécute rien', rien.console === '' && !rien.suivant, JSON.stringify(rien));
      /* on TAPE une prédiction FAUSSE sur la somme et la juste sur le produit */
      const att1 = await s.page.evaluate(() => { const q = test.questions[test.idx]; const a = pcvAns(q, q.va, q.vb); return { s: a.somme, p: a.produit, sortie: a.sortie }; });
      await s.page.click('#pcv-s');
      await s.page.keyboard.type(String(Number(att1.s) + 1));
      await s.page.click('#pcv-p');
      await s.page.keyboard.type(att1.p);
      await s.page.click('#pcvValidate');
      await s.page.waitForTimeout(400);
      const mix = await s.page.evaluate(() => {
        const s0 = document.getElementById('pcv-s'), p0 = document.getElementById('pcv-p'), b = s0.nextElementSibling;
        return { c0: s0.className, c1: p0.className, e0: getComputedStyle(s0).color, e1: getComputedStyle(p0).color,
                 badge: !!(b && b.classList.contains('mf-cor')), texte: b && b.textContent,
                 encreBadge: b ? getComputedStyle(b).color : '', badgeVisible: b ? b.getBoundingClientRect().width > 8 : false,
                 badge1: !!(p0.nextElementSibling && p0.nextElementSibling.classList.contains('mf-cor')),
                 score: test.score, run: !document.getElementById('pcvRun').disabled };
      });
      verifier('chaque case se juge SEULE : la prédiction fausse rougit (encre rouge rendue) pendant que la juste reste BLEUE, et la bonne valeur s\'écrit en VERT à côté de la fausse — et d\'elle seule',
        /bad/.test(mix.c0) && dom(mix.e0) === 'rouge' && /ok/.test(mix.c1) && dom(mix.e1) === 'bleu'
        && mix.badge && mix.texte === att1.s && dom(mix.encreBadge) === 'vert' && mix.badgeVisible && !mix.badge1
        && mix.score === 1 && mix.run, JSON.stringify(mix));
      await s.page.click('#pcvRun');
      await s.page.waitForTimeout(300);
      const cons1 = await s.page.evaluate(() => { const c = document.getElementById('pcvConsole');
        return { t: c.textContent, h: c.getBoundingClientRect().height, suivant: !!document.getElementById('pcvNext') }; });
      verifier('« Exécuter » montre ce que le programme affiche vraiment, puis « Question suivante » paraît',
        cons1.t === att1.sortie.replace(/\n$/, '') && cons1.h > 20 && cons1.suivant, JSON.stringify(cons1));
      /* ---- question 2 : les valeurs se CHANGENT au clavier ---- */
      await s.page.click('#pcvNext');
      await s.page.waitForTimeout(400);
      const q2 = await s.page.evaluate(() => { const q = test.questions[test.idx]; return { na: q.na, nb: q.nb, va: q.va, vb: q.vb }; });
      const deux = await s.page.evaluate(() => {
        const a = document.getElementById('pcv-a'), l = [...document.querySelectorAll('#pcvHost .pyx-l1')];
        const px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        return { valeur: a ? a.value : null, police: a ? getComputedStyle(a).fontFamily : '',
                 pxA: a ? px(a) : 0, pxCode: px(l[l.length - 1]),
                 pred: document.getElementById('pcvPred').textContent };
      });
      verifier('au visage À CHANGER, la case de valeur est pré-remplie, à chasse fixe et à la taille du code qui l\'entoure',
        deux.valeur === String(q2.va) && /mono|menlo|consolas|courier/i.test(deux.police)
        && Math.abs(deux.pxA - deux.pxCode) < 0.6 && deux.pred.indexOf(String(q2.va)) >= 0, JSON.stringify(deux));
      /* LA PHRASE SUIT SOUS LES DOIGTS : c'est le risque propre, et seul un
         vrai clavier montre qu'elle se réécrit à la frappe */
      const neuf = q2.va + 7;
      await s.page.fill('#pcv-a', '');
      await s.page.click('#pcv-a');
      await s.page.keyboard.type(String(neuf));
      await s.page.waitForTimeout(250);
      const suit = await s.page.evaluate(() => ({ pred: document.getElementById('pcvPred').textContent,
        focus: document.activeElement && document.activeElement.id }));
      verifier('la phrase de prédiction se réécrit sous les doigts : elle dit la valeur TAPÉE, jamais l\'ancienne',
        suit.pred.indexOf('de ' + neuf + ' et ' + q2.vb) >= 0 && suit.pred.indexOf('de ' + q2.va + ' et') < 0,
        JSON.stringify(suit) + ' / tapé ' + neuf + ', attendu « de ' + neuf + ' et ' + q2.vb + ' »');
      const att2 = await s.page.evaluate(n => { const a = pcvAns(test.questions[test.idx], n, test.questions[test.idx].vb); return { s: a.somme, p: a.produit, sortie: a.sortie }; }, neuf);
      await s.page.click('#pcv-s');
      await s.page.keyboard.type(att2.s);
      await s.page.click('#pcv-p');
      await s.page.keyboard.type(att2.p);
      await s.page.keyboard.press('Enter');
      await s.page.waitForTimeout(400);
      const juste = await s.page.evaluate(() => {
        const s0 = document.getElementById('pcv-s'), p0 = document.getElementById('pcv-p'), a = document.getElementById('pcv-a');
        return { ok: /ok/.test(s0.className) && /ok/.test(p0.className), e0: getComputedStyle(s0).color,
                 verrou: s0.disabled && p0.disabled && a.disabled, score: test.score,
                 badge: !!(s0.nextElementSibling && s0.nextElementSibling.classList.contains('mf-cor')),
                 run: !document.getElementById('pcvRun').disabled };
      });
      verifier('Entrée vérifie : la copie juste sur les valeurs CHANGÉES est bleue, verrouille les trois cases, vaut 2 et débloque « Exécuter »',
        juste.ok && dom(juste.e0) === 'bleu' && juste.verrou && juste.score === 3 && !juste.badge && juste.run, JSON.stringify(juste));
      await s.page.click('#pcvRun');
      await s.page.waitForTimeout(300);
      const cons2 = await s.page.evaluate(() => document.getElementById('pcvConsole').textContent);
      verifier('la console exécute le programme AUX VALEURS DE L\'ÉLÈVE',
        cons2 === att2.sortie.replace(/\n$/, '') && cons2.indexOf('de ' + neuf + ' et') >= 0, JSON.stringify(cons2));
      /* ---- le téléphone ---- */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const tel = await s.page.evaluate(() => {
        const boite = document.querySelector('#pcvHost .pyx-prog'), prog = boite.getBoundingClientRect();
        const l = [...document.querySelectorAll('#pcvHost .pyx-l1')].map(e => ({
          deborde: e.getBoundingClientRect().right > prog.right + 1,
          longue: e.scrollWidth > e.clientWidth + 1, ovf: getComputedStyle(e).overflowX }));
        const pred = [...document.querySelectorAll('#pcvHost .pcv-ligne')].map(e => e.getBoundingClientRect().right);
        return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                 progDedans: prog.right <= 391, progDefile: boite.scrollWidth > boite.clientWidth + 1,
                 predDedans: pred.every(r => r <= 391), lignes: l };
      });
      verifier('sur un téléphone la page ne déborde pas, le programme et la phrase restent dans l\'écran, et la ligne qui n\'y tient pas DÉFILE au lieu d\'être coupée',
        !tel.page && tel.progDedans && !tel.progDefile && tel.predDedans
        && tel.lignes.every(x => !x.deborde) && tel.lignes.some(x => x.longue)
        && tel.lignes.every(x => /auto|scroll/.test(x.ovf)), JSON.stringify(tel).slice(0, 300));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* ---- le soutien : rien ne se révèle ---- */
      await s.page.evaluate(id => openTest(id), P.pythonChangerValeurs.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const att3 = await s.page.evaluate(() => { const q = test.questions[test.idx]; const a = pcvAns(q, q.va, q.vb); return { s: a.somme, p: a.produit }; });
      await s.page.click('#pcv-s');
      await s.page.keyboard.type(String(Number(att3.s) + 1));
      await s.page.click('#pcv-p');
      await s.page.keyboard.type(att3.p);
      await s.page.click('#pcvValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => {
        const s0 = document.getElementById('pcv-s'), fb = document.getElementById('pcvFeedback');
        return { bad: /bad/.test(s0.className), encre: getComputedStyle(s0).color,
                 badge: !!(s0.nextElementSibling && s0.nextElementSibling.classList.contains('mf-cor')),
                 fb: fb.textContent, fbVisible: fb.getBoundingClientRect().height > 10,
                 verrou: s0.disabled, run: !document.getElementById('pcvRun').disabled,
                 rev: (document.getElementById('pcvValidate') || {}).textContent || '' };
      });
      verifier('en soutien la prédiction fausse rougit (encre rouge rendue) sans que la bonne valeur ne s\'écrive, rien n\'est verrouillé, « Exécuter » reste fermé et « Revérifier » est proposé',
        sout.bad && dom(sout.encre) === 'rouge' && !sout.badge && sout.fb.indexOf(att3.s) < 0
        && sout.fbVisible && !sout.verrou && !sout.run && /Rev/.test(sout.rev), JSON.stringify(sout));
      await s.page.fill('#pcv-s', att3.s);
      await s.page.waitForTimeout(150);
      const repris = await s.page.evaluate(() => ({ bad: /bad/.test(document.getElementById('pcv-s').className) }));
      verifier('la prédiction reprise perd son rouge', !repris.bad, JSON.stringify(repris));
      await s.page.click('#pcvValidate');
      await s.page.waitForTimeout(400);
      const fin = await s.page.evaluate(() => ({ ok: /ok/.test(document.getElementById('pcv-s').className),
        score: test.score, run: !document.getElementById('pcvRun').disabled }));
      verifier('la prédiction corrigée vaut 2 en soutien et débloque « Exécuter »', fin.ok && fin.score === 2 && fin.run, JSON.stringify(fin));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies undecies. {python-operations} : a et b se changent, les quatre lignes se tapent =====
       Le banc jsdom tient le juge (les deux familles de cases, la seconde
       méthode qui rejoue sous d'autres valeurs, la règle des paires), le
       tirage, les portes, la case vide et le soutien. Ce qu'il ne voit pas :
       le programme du cours RENDU avec ses deux cases de valeur, une VRAIE
       frappe dans a et b puis un vrai clic sur « Exécuter » qui ouvre la
       porte, la consigne à puces et les coups de pouce repliés qui S'OUVRENT
       au clic, les dix lignes du programme à chasse fixe et à la MÊME taille,
       la case COURTE du calcul posée sur la ligne de son nom — jsdom n'a
       aucune mise en page —, un VRAI clic sur « Vérifier » fermé qui ne juge
       rien, les quatre lignes TAPÉES au clavier, l'encre RENDUE des verdicts
       sur la même question (l'une bleue, l'autre rouge : c'est la règle
       « chaque case se juge seule », et seule une couleur rendue la montre),
       le rejeu sous d'autres valeurs mesuré au RECTANGLE, et la page qui ne
       déborde pas sur un téléphone. Puis le soutien, où rien ne se révèle. */
    titre('6 tricies undecies. LES QUATRE OPÉRATIONS : a ET b SE CHANGENT, LES QUATRE LIGNES SE TAPENT');
    if(!P.pythonOperations){
      ignorer('les quatre lignes se tapent, s\'exécutent, puis se vérifient', 'ce niveau n\'a pas l\'exercice des quatre opérations');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.pythonOperations.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      /* ---- le cours : le a) et le b) de la fiche ---- */
      const cours = await s.page.evaluate(() => {
        const host = document.getElementById('popHost'), r = e => e.getBoundingClientRect();
        const ia = document.getElementById('pop-a'), ib = document.getElementById('pop-b');
        const cadre = host.querySelector('.pyx-cours'), b = document.getElementById('popCompris');
        return { cadre: cadre ? Math.round(r(cadre).width) : 0, cadreHaut: cadre ? Math.round(r(cadre).height) : 0,
                 cases: !!ia && !!ib && r(ia).width > 40 && r(ia).height > 24 && r(ib).width > 40,
                 memeLigne: !!ia && !!ib && Math.abs(r(ia).top - r(ia.previousElementSibling).top) < 30,
                 valeurs: [ia && ia.value, ib && ib.value],
                 ferme: !!b && b.disabled, console: document.getElementById('popDecConsole').textContent };
      });
      verifier('le cours est rendu avec son cadre, ses deux cases de valeur sur la ligne de leur nom, et « J\'ai compris » fermé',
        cours.cadre > 300 && cours.cadreHaut > 40 && cours.cases && cours.memeLigne && cours.console === '' && cours.ferme, JSON.stringify(cours));
      /* un VRAI clic sur « J'ai compris » fermé ne mène nulle part */
      await s.page.click('#popCompris', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const bloque = await s.page.evaluate(() => document.getElementById('popIdx').textContent);
      verifier('un clic sur « J\'ai compris » fermé ne mène pas à la question', bloque === 'Le cours', bloque);
      await s.page.click('#popDecRun');
      await s.page.waitForTimeout(300);
      const un = await s.page.evaluate(() => ({ console: document.getElementById('popDecConsole').textContent,
        ferme: document.getElementById('popCompris').disabled,
        hint: document.getElementById('popDecHint').textContent }));
      verifier('une PREMIÈRE exécution affiche la somme et le produit, laisse « J\'ai compris » fermé, et demande de changer a et b',
        un.console.split('\n').length === 2 && /somme/i.test(un.console) && un.ferme && /CHANGE/.test(un.hint), JSON.stringify(un).slice(0, 260));
      /* on CHANGE a et b au clavier, pour de vrai — c'est le b) de la fiche */
      await s.page.fill('#pop-a', '');
      await s.page.type('#pop-a', '7');
      await s.page.fill('#pop-b', '');
      await s.page.type('#pop-b', '4');
      await s.page.press('#pop-b', 'Enter');
      await s.page.waitForTimeout(300);
      const deux = await s.page.evaluate(() => ({ console: document.getElementById('popDecConsole').textContent,
        ouvert: !document.getElementById('popCompris').disabled }));
      verifier('une SECONDE exécution, à d\'autres valeurs, fait suivre les résultats et ouvre « J\'ai compris »',
        /11/.test(deux.console) && /28/.test(deux.console) && deux.ouvert, JSON.stringify(deux));
      await s.page.click('#popCompris');
      await s.page.waitForTimeout(400);
      /* ---- la question ---- */
      const avant = await s.page.evaluate(() => {
        const host = document.getElementById('popHost'), r = e => e.getBoundingClientRect();
        const puces = [...host.querySelectorAll('.pyd-puces li')], pouces = [...host.querySelectorAll('.pyd-pouce')];
        const l = [...host.querySelectorAll('.pyx-l1')], lbl = [...host.querySelectorAll('.pop-lbl')];
        const ex = [document.getElementById('pop-ex0'), document.getElementById('pop-ex1')];
        const pr = [document.getElementById('pop-pr0'), document.getElementById('pop-pr1')];
        const fam = e => getComputedStyle(e).fontFamily, px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const tous = l.concat(lbl).concat(ex).concat(pr);
        return { idx: document.getElementById('popIdx').textContent,
                 enonce: document.getElementById('popInstr').textContent,
                 puces: puces.length, pucesVisibles: puces.every(p => r(p).width > 100 && r(p).height > 8),
                 pouces: pouces.length, pouceOuvert: pouces.some(p => p.open),
                 lignes: l.length, lignesTexte: l.map(e => e.textContent),
                 police: tous.map(fam), tailles: tous.map(px),
                 exSurLigne: ex.every((e, i) => Math.abs(r(e).top - r(lbl[i]).top) < 30 && r(e).left > r(lbl[i]).left),
                 exCourte: ex.every(e => r(e).width > 80 && r(e).width < 320),
                 prLarge: pr.every(e => r(e).width > 300 && r(e).right <= document.documentElement.clientWidth),
                 runOk: !document.getElementById('popRun').disabled,
                 valFerme: document.getElementById('popValidate').disabled,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('la question porte son énoncé, trois puces de consigne et deux coups de pouce repliés',
        /Question 1/.test(avant.idx) && /diff|quotient|somme|produit/i.test(avant.enonce)
        && avant.puces === 3 && avant.pucesVisibles && avant.pouces === 2 && !avant.pouceOuvert, JSON.stringify(avant).slice(0, 300));
      verifier('les six lignes écrites, les deux étiquettes et les quatre cases sont à chasse fixe et à la MÊME taille',
        avant.lignes === 6 && avant.police.every(f => /mono|menlo|consolas|courier/i.test(f))
        && Math.max(...avant.tailles) - Math.min(...avant.tailles) < 0.6,
        JSON.stringify({ l: avant.lignesTexte, t: avant.tailles }).slice(0, 300));
      verifier('la case du calcul est COURTE et posée sur la ligne de son nom, celle de l\'affichage prend la ligne entière, et la page ne déborde pas à 1400 px',
        avant.exSurLigne && avant.exCourte && avant.prLarge && avant.runOk && avant.valFerme && !avant.page, JSON.stringify(avant).slice(0, 300));
      /* un coup de pouce s'OUVRE au clic */
      await s.page.click('#popHost .pyd-pouce summary');
      await s.page.waitForTimeout(200);
      const pouce = await s.page.evaluate(() => {
        const p = document.querySelector('#popHost .pyd-pouce'), t = p.querySelector('p');
        return { ouvert: p.open, texte: t.textContent, haut: t.getBoundingClientRect().height };
      });
      verifier('un coup de pouce s\'ouvre au clic et dit la MÉTHODE — les quatre signes de Python',
        pouce.ouvert && pouce.haut > 10 && /\+/.test(pouce.texte) && /\//.test(pouce.texte), JSON.stringify(pouce));
      /* un VRAI clic sur « Vérifier » fermé ne juge rien */
      await s.page.click('#popValidate', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const rien = await s.page.evaluate(() => ({ fb: document.getElementById('popFeedback').textContent,
        c: ['pop-ex0', 'pop-ex1', 'pop-pr0', 'pop-pr1'].map(i => document.getElementById(i).className) }));
      verifier('un clic sur « Vérifier » fermé ne juge rien', rien.fb === '' && rien.c.every(c => !/ok|bad/.test(c)), JSON.stringify(rien));
      /* ---- on TAPE les quatre lignes : trois justes, une fausse ---- */
      const att = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = popAns(q);
        return { ex: a.map(x => x.expr), lignes: a.map(x => x.ligne), val: a.map(x => x.valeur), val2: a.map(x => x.valeur2), cle: q.ecrire };
      });
      await s.page.click('#pop-ex0');
      await s.page.keyboard.type(att.val[0]);            /* le résultat écrit à la main : faux */
      await s.page.click('#pop-ex1');
      await s.page.keyboard.type(att.ex[1]);
      await s.page.click('#pop-pr0');
      await s.page.keyboard.type(att.lignes[1]);         /* dans l'AUTRE ORDRE : la règle des paires */
      await s.page.click('#pop-pr1');
      await s.page.keyboard.type(att.lignes[0]);
      await s.page.click('#popRun');
      await s.page.waitForTimeout(300);
      await s.page.click('#popValidate');
      await s.page.waitForTimeout(400);
      const mele = await s.page.evaluate(() => {
        const e = i => document.getElementById(i), r = x => x.getBoundingClientRect();
        const ids = ['pop-ex0', 'pop-ex1', 'pop-pr0', 'pop-pr1'], c = ids.map(e);
        const cor = [...document.querySelectorAll('#popHost .mf-cor')];
        return { classes: c.map(x => x.className), encres: c.map(x => getComputedStyle(x).color),
                 score: test.score, verrou: c.every(x => x.disabled),
                 cor: cor.length, corTexte: cor.map(x => x.textContent), corEncre: cor.map(x => getComputedStyle(x).color),
                 corSous: cor.length === 1 && r(cor[0]).top >= r(c[0]).bottom - 1 && r(cor[0]).left < r(c[0]).right && r(cor[0]).right <= document.documentElement.clientWidth,
                 rejeu: !!document.querySelector('#popFeedback .pop-rejeu') };
      });
      verifier('le calcul faux rougit SEUL (encre rouge rendue) pendant que les trois autres cases restent bleues — chaque case se juge seule, et seule une couleur rendue le montre',
        /bad/.test(mele.classes[0]) && dom(mele.encres[0]) === 'rouge'
        && mele.classes.slice(1).every(c => /ok/.test(c)) && mele.encres.slice(1).every(e => dom(e) === 'bleu')
        && mele.score === 3 && mele.verrou, JSON.stringify(mele).slice(0, 320));
      verifier('la bonne écriture s\'affiche en VERT sous la case fausse, et sous elle SEULEMENT',
        mele.cor === 1 && mele.corTexte[0] === att.ex[0] && dom(mele.corEncre[0]) === 'vert' && mele.corSous && !mele.rejeu,
        JSON.stringify({ cor: mele.corTexte, encre: mele.corEncre, sous: mele.corSous, att: att.ex[0] }));
      /* ---- la question suivante, toute juste : le d) de la fiche s'affiche ---- */
      await s.page.click('#popNext');
      await s.page.waitForTimeout(400);
      const att2 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = popAns(q), A = popAutres(q);
        return { ex: a.map(x => x.expr), lignes: a.map(x => x.ligne), val2: a.map(x => x.valeur2), A: A };
      });
      for(const [id, v] of [['pop-ex0', att2.ex[0]], ['pop-ex1', att2.ex[1]], ['pop-pr0', att2.lignes[0]], ['pop-pr1', att2.lignes[1]]]){
        await s.page.click('#' + id);
        await s.page.keyboard.type(v);
      }
      await s.page.press('#pop-pr1', 'Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#popValidate');
      await s.page.waitForTimeout(400);
      const juste = await s.page.evaluate(() => {
        const r = e => e.getBoundingClientRect(), rej = document.querySelector('#popFeedback .pop-rejeu');
        const pre = rej && rej.querySelector('pre');
        return { ok: ['pop-ex0', 'pop-ex1', 'pop-pr0', 'pop-pr1'].every(i => /ok/.test(document.getElementById(i).className)),
                 score: test.score, rejeu: !!rej, rejeuHaut: rej ? Math.round(r(rej).height) : 0,
                 rejeuLarge: rej ? Math.round(r(rej).width) : 0,
                 lignes: pre ? pre.textContent.split('\n').length : 0, texte: pre ? pre.textContent : '',
                 suivant: !!document.getElementById('popNext') };
      });
      verifier('la copie toute juste vaut 4 de plus et MONTRE le programme rejoué sous d\'autres valeurs — le d) de la fiche, dans une boîte qui a un rectangle',
        juste.ok && juste.score === 7 && juste.rejeu && juste.rejeuHaut > 60 && juste.rejeuLarge > 200
        && juste.lignes === 4 && att2.val2.every(v => juste.texte.indexOf(v) >= 0) && juste.suivant, JSON.stringify(juste).slice(0, 320));
      /* ---- le téléphone ---- */
      await s.page.setViewportSize({ width: 390, height: 780 });
      await s.page.waitForTimeout(400);
      const tel = await s.page.evaluate(() => {
        const host = document.getElementById('popHost'), r = e => e.getBoundingClientRect();
        const cadre = host.querySelector('.pyx-prog');
        const lignes = [...host.querySelectorAll('.pyx-l1')];
        return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                 cadre: Math.round(r(cadre).width),
                 deborde: lignes.filter(e => r(e).right > r(cadre).right + 2).length,
                 defile: lignes.filter(e => e.scrollWidth > e.clientWidth + 1).length,
                 cases: ['pop-ex0', 'pop-ex1', 'pop-pr0', 'pop-pr1'].map(i => Math.round(r(document.getElementById(i)).right))
                   .filter(x => x > document.documentElement.clientWidth).length };
      });
      verifier('sur un téléphone de 390 px, la page ne déborde pas, aucune ligne ne sort du cadre — celle qui n\'y tient pas DÉFILE — et les quatre cases restent dans l\'écran',
        tel.page <= 1 && tel.deborde === 0 && tel.defile > 0 && tel.cases === 0, JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* ---- le soutien : rien ne se révèle ---- */
      await s.page.evaluate(id => openTest(id), P.pythonOperations.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      await s.page.click('#popDecRun');
      await s.page.waitForTimeout(250);
      await s.page.fill('#pop-a', '8');
      await s.page.press('#pop-a', 'Enter');
      await s.page.waitForTimeout(250);
      await s.page.click('#popCompris');
      await s.page.waitForTimeout(400);
      const att3 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = popAns(q);
        return { ex: a.map(x => x.expr), lignes: a.map(x => x.ligne), cle: q.ecrire };
      });
      await s.page.click('#pop-ex0');
      await s.page.keyboard.type(att3.ex[1] === att3.ex[0] ? '0' : att3.ex[1]);   /* la mauvaise opération */
      await s.page.click('#pop-ex1');
      await s.page.keyboard.type(att3.ex[1]);
      await s.page.click('#pop-pr0');
      await s.page.keyboard.type(att3.lignes[0]);
      await s.page.click('#pop-pr1');
      await s.page.keyboard.type(att3.lignes[1]);
      await s.page.click('#popRun');
      await s.page.waitForTimeout(300);
      await s.page.click('#popValidate');
      await s.page.waitForTimeout(400);
      const sout = await s.page.evaluate(() => {
        const e0 = document.getElementById('pop-ex0'), fb = document.getElementById('popFeedback');
        return { bad: /bad/.test(e0.className), encre: getComputedStyle(e0).color,
                 cor: document.querySelectorAll('#popHost .mf-cor').length,
                 rejeu: !!fb.querySelector('.pop-rejeu'), fb: fb.textContent,
                 fbVisible: fb.getBoundingClientRect().height > 10, verrou: e0.disabled,
                 rev: (document.getElementById('popValidate') || {}).textContent || '' };
      });
      verifier('en soutien, le calcul faux rougit (encre rouge rendue), rien ne se révèle — ni bonne écriture ni rejeu —, le message dit OÙ est l\'erreur, et Revérifier est proposé',
        sout.bad && dom(sout.encre) === 'rouge' && sout.cor === 0 && !sout.rejeu
        && /Où est l’erreur/.test(sout.fb) && sout.fb.indexOf(att3.ex[0]) < 0 && sout.fbVisible && !sout.verrou && /Rev/.test(sout.rev), JSON.stringify(sout).slice(0, 320));
      await s.page.fill('#pop-ex0', att3.ex[0]);
      await s.page.waitForTimeout(150);
      const modif = await s.page.evaluate(() => ({ bad: /bad/.test(document.getElementById('pop-ex0').className),
        valFerme: document.getElementById('popValidate').disabled, console: document.getElementById('popConsole').textContent }));
      verifier('le calcul corrigé perd son rouge, referme Revérifier et vide la console', !modif.bad && modif.valFerme && modif.console === '', JSON.stringify(modif));
      await s.page.press('#pop-ex0', 'Enter');
      await s.page.waitForTimeout(300);
      await s.page.click('#popValidate');
      await s.page.waitForTimeout(400);
      const fin3 = await s.page.evaluate(() => ({ ok: /ok/.test(document.getElementById('pop-ex0').className),
        score: test.score, rejeu: !!document.querySelector('#popFeedback .pop-rejeu'), suivant: !!document.getElementById('popNext') }));
      verifier('la copie corrigée, exécutée puis revérifiée, vaut 4 en soutien, montre le rejeu et propose la suite',
        fin3.ok && fin3.score === 4 && fin3.rejeu && fin3.suivant, JSON.stringify(fin3));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies terdecies. {python-double-triple-carre} : trois calculs, trois affichages, et a qui change =====
       Le banc jsdom tient la fiche épinglée, le GARDE du tirage, la seconde
       méthode, le juge cas par cas, la règle des paires portée à trois, les
       portes, la case vide et le soutien. Ce qu'il ne voit pas : le programme
       RENDU à chasse fixe et à la MÊME taille, la case COURTE du calcul posée
       sur la ligne de son nom — jsdom n'a aucune mise en page —, un VRAI clic
       sur « Vérifier » fermé qui ne juge rien, les coups de pouce repliés qui
       S'OUVRENT au clic, les six lignes TAPÉES au clavier, l'encre RENDUE des
       verdicts sur la même question (une rouge et cinq bleues : c'est la règle
       « chaque case se juge seule », et seule une couleur rendue la montre),
       la bonne écriture en VERT SOUS la case et non à DROITE — le défaut que
       le 5.12 a payé sur une capture, une liste de sélecteurs tenue à la main
       dérivant toujours —, le b) mesuré au RECTANGLE avec un vrai changement
       de a au clavier, et la page qui ne déborde pas sur un téléphone. */
    titre('6 tricies terdecies. LE DOUBLE, LE TRIPLE ET LE CARRÉ : TROIS CALCULS, TROIS AFFICHAGES, ET a QUI CHANGE');
    if(!P.pythonDoubleTripleCarre){
      ignorer('les trois calculs et les trois affichages se tapent, s\'exécutent, puis se vérifient', 'ce niveau n\'a pas l\'exercice du double, du triple et du carré');
    } else {
      const DD = P.pythonDoubleTripleCarre;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), DD.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      const ids = await s.page.evaluate(() => pdcCases(test.questions[test.idx]).map(c => c.id));
      /* ---- l'écran de la question 1, la fiche du carnet ---- */
      const avant = await s.page.evaluate(idsIn => {
        const host = document.getElementById('pdcHost'), r = e => e.getBoundingClientRect();
        const puces = [...host.querySelectorAll('.pyd-puces li')], pouces = [...host.querySelectorAll('.pyd-pouce')];
        const l = [...host.querySelectorAll('.pyx-l1')], lbl = [...host.querySelectorAll('.pop-lbl')];
        const c = idsIn.map(i => document.getElementById(i));
        const ex = c.slice(0, lbl.length), pr = c.slice(lbl.length);
        const fam = e => getComputedStyle(e).fontFamily, px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const tous = l.concat(lbl).concat(c);
        return { idx: document.getElementById('pdcIdx').textContent,
                 enonce: document.getElementById('pdcInstr').textContent,
                 enonceVisible: r(document.getElementById('pdcInstr')).height > 8,
                 puces: puces.length, pucesVisibles: puces.every(p => r(p).width > 100 && r(p).height > 8),
                 pouces: pouces.length, pouceOuvert: pouces.some(p => p.open),
                 cases: c.length, tousInput: c.every(e => e && e.tagName === 'INPUT'),
                 police: tous.map(fam), tailles: tous.map(px),
                 exSurLigne: ex.every((e, i) => Math.abs(r(e).top - r(lbl[i]).top) < 30 && r(e).left > r(lbl[i]).left),
                 exCourte: ex.every(e => r(e).width > 80 && r(e).width < 320),
                 prLarge: pr.every(e => r(e).width > 300 && r(e).right <= document.documentElement.clientWidth),
                 runOk: !document.getElementById('pdcRun').disabled,
                 valFerme: document.getElementById('pdcValidate').disabled,
                 pasDeB: !document.getElementById('pdcB'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      }, ids);
      verifier('la question porte son énoncé rendu, ses puces de consigne et deux coups de pouce REPLIÉS — et le b) n\'est pas encore là',
        /Question 1/.test(avant.idx) && /double|triple|carr/i.test(avant.enonce) && avant.enonceVisible
        && avant.puces === 4 && avant.pucesVisibles && avant.pouces === 2 && !avant.pouceOuvert && avant.pasDeB, JSON.stringify(avant).slice(0, 320));
      verifier('les lignes écrites, les trois étiquettes et les ' + DD.casesFiche + ' cases sont à chasse fixe et à la MÊME taille',
        avant.cases === DD.casesFiche && avant.tousInput && avant.police.every(f => /mono|menlo|consolas|courier/i.test(f))
        && Math.max(...avant.tailles) - Math.min(...avant.tailles) < 0.6,
        JSON.stringify({ t: avant.tailles, p: avant.police[0] }).slice(0, 300));
      verifier('la case du calcul est COURTE et posée sur la ligne de son nom, celle de l\'affichage prend la ligne entière, et la page ne déborde pas à 1400 px',
        avant.exSurLigne && avant.exCourte && avant.prLarge && avant.runOk && avant.valFerme && !avant.page, JSON.stringify(avant).slice(0, 320));
      /* un coup de pouce s'OUVRE au clic */
      await s.page.click('#pdcHost .pyd-pouce summary');
      await s.page.waitForTimeout(200);
      const pouce = await s.page.evaluate(() => {
        const p = document.querySelector('#pdcHost .pyd-pouce'), t = p.querySelector('p');
        return { ouvert: p.open, texte: t.textContent, haut: t.getBoundingClientRect().height };
      });
      verifier('un coup de pouce s\'ouvre au clic et dit la MÉTHODE — dont le « ^ » qui n\'est pas la puissance',
        pouce.ouvert && pouce.haut > 10 && /\^/.test(pouce.texte) && /\*/.test(pouce.texte), JSON.stringify(pouce).slice(0, 240));
      /* un VRAI clic sur « Vérifier » fermé ne juge rien */
      await s.page.click('#pdcValidate', { force: true }).catch(() => {});
      await s.page.waitForTimeout(200);
      const rien = await s.page.evaluate(idsIn => ({ fb: document.getElementById('pdcFeedback').textContent,
        c: idsIn.map(i => document.getElementById(i).className) }), ids);
      verifier('un clic sur « Vérifier » fermé ne juge rien', rien.fb === '' && rien.c.every(c => !/\bok\b|\bbad\b/.test(c)), JSON.stringify(rien));
      /* ---- on TAPE les six lignes : un calcul faux, les affichages dans l'AUTRE ORDRE ---- */
      const att = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pdcAns(q);
        return { ex: a.map(x => x.expr), lignes: a.map(x => x.ligne), val: a.map(x => x.valeur), a: q.a };
      });
      await s.page.click('#' + ids[0]);
      await s.page.keyboard.type(att.val[0]);              /* le résultat écrit à la main : faux */
      for(let i = 1; i < att.ex.length; i++){ await s.page.click('#' + ids[i]); await s.page.keyboard.type(att.ex[i]); }
      const ordre = [2, 0, 1];                             /* un AUTRE ordre que les puces : la règle des paires */
      for(let i = 0; i < ordre.length; i++){ await s.page.click('#' + ids[att.ex.length + i]); await s.page.keyboard.type(att.lignes[ordre[i]]); }
      await s.page.click('#pdcRun');
      await s.page.waitForTimeout(350);
      await s.page.click('#pdcValidate');
      await s.page.waitForTimeout(450);
      const mele = await s.page.evaluate(idsIn => {
        const e = i => document.getElementById(i), r = x => x.getBoundingClientRect();
        const c = idsIn.map(e), cor = [...document.querySelectorAll('#pdcHost .mf-cor')];
        return { classes: c.map(x => x.className), encres: c.map(x => getComputedStyle(x).color),
                 score: test.score, verrou: c.every(x => x.disabled),
                 cor: cor.length, corTexte: cor.map(x => x.textContent), corEncre: cor.map(x => getComputedStyle(x).color),
                 corSous: cor.length === 1 && r(cor[0]).top >= r(c[0]).bottom - 1 && r(cor[0]).left < r(c[0]).right + 2
                   && r(cor[0]).right <= document.documentElement.clientWidth,
                 corADroite: cor.length === 1 && r(cor[0]).left >= r(c[0]).right - 1,
                 pasDeB: !document.getElementById('pdcB'),
                 suivantLibre: !!document.getElementById('pdcNext') && !document.getElementById('pdcNext').disabled };
      }, ids);
      verifier('le calcul faux rougit SEUL (encre rouge rendue) pendant que les cinq autres cases restent bleues — les affichages écrits dans l\'AUTRE ORDRE compris',
        /\bbad\b/.test(mele.classes[0]) && dom(mele.encres[0]) === 'rouge'
        && mele.classes.slice(1).every(c => /\bok\b/.test(c)) && mele.encres.slice(1).every(e => dom(e) === 'bleu')
        && mele.score === DD.casesFiche - 1 && mele.verrou, JSON.stringify(mele).slice(0, 320));
      verifier('la bonne écriture s\'affiche en VERT SOUS la case fausse — jamais à DROITE, d\'où elle sortirait de l\'écran d\'un téléphone — et sous elle seulement',
        mele.cor === 1 && mele.corTexte[0] === att.ex[0] && dom(mele.corEncre[0]) === 'vert'
        && mele.corSous && !mele.corADroite, JSON.stringify({ cor: mele.corTexte, encre: mele.corEncre, sous: mele.corSous, droite: mele.corADroite, att: att.ex[0] }));
      verifier('sur une copie fausse, le b) ne s\'ouvre pas — on ne teste pas un programme qui ne marche pas — et « Question suivante » reste libre',
        mele.pasDeB && mele.suivantLibre, JSON.stringify({ b: !mele.pasDeB, suivant: mele.suivantLibre }));
      /* ---- la question suivante, toute juste : le b) de la fiche s'ouvre ---- */
      await s.page.click('#pdcNext');
      await s.page.waitForTimeout(450);
      const ids2 = await s.page.evaluate(() => pdcCases(test.questions[test.idx]).map(c => c.id));
      const att2 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pdcAns(q);
        /* LE PROGRAMME ENTIER suit a, et pas seulement les lignes de l'élève : la
           question 2 en écrit DEUX, la page écrivant la troisième — le b) de la fiche
           ne les distingue pas, et un attendu calé sur les seules lignes de l'élève
           mesurerait autre chose (le premier jet de ce contrôle s'y est pris). */
        const A = pdcAutre(q.a);
        return { ex: a.map(x => x.expr), lignes: a.map(x => x.ligne), a: q.a, A: A,
                 sorties2: PDC_Q.map(o => pdcSortie(A, o.cle).replace(/\n$/, '')) };
      });
      for(let i = 0; i < att2.ex.length; i++){ await s.page.click('#' + ids2[i]); await s.page.keyboard.type(att2.ex[i]); }
      for(let i = 0; i < att2.lignes.length; i++){ await s.page.click('#' + ids2[att2.ex.length + i]); await s.page.keyboard.type(att2.lignes[i]); }
      await s.page.press('#' + ids2[ids2.length - 1], 'Enter');
      await s.page.waitForTimeout(350);
      await s.page.click('#pdcValidate');
      await s.page.waitForTimeout(450);
      const juste = await s.page.evaluate(idsIn => {
        const r = e => e.getBoundingClientRect(), b = document.getElementById('pdcB');
        const ia = document.getElementById('pdc-a'), n = document.getElementById('pdcNext');
        return { ok: idsIn.every(i => /\bok\b/.test(document.getElementById(i).className)),
                 score: test.score, b: !!b, bHaut: b ? Math.round(r(b).height) : 0, bLarge: b ? Math.round(r(b).width) : 0,
                 caseA: !!ia && r(ia).width > 40 && r(ia).height > 20, valeurA: ia && ia.value,
                 memeLigne: !!ia && Math.abs(r(ia).top - r(ia.previousElementSibling).top) < 30,
                 suivantFerme: !!n && n.disabled, hint: (document.getElementById('pdcBHint') || {}).textContent || '' };
      }, ids2);
      verifier('la copie toute juste vaut ' + DD.casesAutres + ' de plus et OUVRE le b) — une boîte qui a un rectangle, sa case de a sur la ligne de son nom, et « Question suivante » FERMÉE',
        juste.ok && juste.score === DD.casesFiche - 1 + DD.casesAutres && juste.b && juste.bHaut > 60 && juste.bLarge > 200
        && juste.caseA && juste.memeLigne && juste.valeurA === String(att2.a) && juste.suivantFerme
        && /valeur/i.test(juste.hint), JSON.stringify(juste).slice(0, 320));
      /* on CHANGE a au clavier, pour de vrai — c'est le b) de la fiche */
      await s.page.fill('#pdc-a', '');
      await s.page.type('#pdc-a', String(att2.A));
      await s.page.press('#pdc-a', 'Enter');
      await s.page.waitForTimeout(350);
      const essai1 = await s.page.evaluate(() => ({ console: document.getElementById('pdcBConsole').textContent,
        valeur: document.getElementById('pdc-a').value, combien: document.querySelectorAll('#pdc-a').length,
        vus: (test.pdcVus || []).join('|'),
        suivantFerme: document.getElementById('pdcNext').disabled }));
      verifier('une VRAIE frappe dans a, puis Entrée, fait SUIVRE les TROIS résultats — celui que la page a écrit compris — et un seul essai ne suffit pas à ouvrir la suite',
        att2.sorties2.every(v => essai1.console.indexOf(v) >= 0) && essai1.console.split('\n').length === att2.sorties2.length
        && essai1.combien === 1 && (DD.essais < 2 || essai1.suivantFerme),
        JSON.stringify(Object.assign({}, essai1, { a: att2.a, A: att2.A, sorties2: att2.sorties2 })).slice(0, 460));
      const autres = await s.page.evaluate(n => { const o = []; for(let x = PDC_MIN; x <= PDC_MAX && o.length < n; x++) if(x !== test.questions[test.idx].a) o.push(String(x)); return o; }, DD.essais);
      for(const v of autres){ await s.page.fill('#pdc-a', ''); await s.page.type('#pdc-a', v); await s.page.click('#pdcBRun'); await s.page.waitForTimeout(220); }
      const ouvert = await s.page.evaluate(() => ({ suivant: !document.getElementById('pdcNext').disabled,
        hint: document.getElementById('pdcBHint').textContent }));
      verifier('après ' + DD.essais + ' valeurs différentes de a, « Question suivante » s\'ouvre et la page dit ce que le b) a montré',
        ouvert.suivant && /SUIVI/.test(ouvert.hint), JSON.stringify(ouvert).slice(0, 240));
      /* ---- le téléphone ---- */
      await s.page.setViewportSize({ width: 390, height: 780 });
      await s.page.waitForTimeout(450);
      const tel = await s.page.evaluate(idsIn => {
        const host = document.getElementById('pdcHost'), r = e => e.getBoundingClientRect();
        const cadre = host.querySelector('.pyx-prog');
        const lignes = [...host.querySelectorAll('.pyx-l1')];
        return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                 cadre: Math.round(r(cadre).width),
                 deborde: lignes.filter(e => r(e).right > r(cadre).right + 2).length,
                 defile: lignes.filter(e => e.scrollWidth > e.clientWidth + 1).length,
                 cases: idsIn.map(i => Math.round(r(document.getElementById(i)).right))
                   .filter(x => x > document.documentElement.clientWidth).length };
      }, ids2);
      verifier('sur un téléphone de 390 px, la page ne déborde pas, aucune ligne ne sort du cadre — celle qui n\'y tient pas DÉFILE — et les cases restent dans l\'écran',
        tel.page <= 1 && tel.deborde === 0 && tel.defile > 0 && tel.cases === 0, JSON.stringify(tel));
      await s.page.setViewportSize({ width: 1400, height: 900 });
      /* ---- le soutien : rien ne se révèle ---- */
      await s.page.evaluate(id => openTest(id), DD.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      const ids3 = await s.page.evaluate(() => pdcCases(test.questions[test.idx]).map(c => c.id));
      const att3 = await s.page.evaluate(() => {
        const q = test.questions[test.idx], a = pdcAns(q);
        return { ex: a.map(x => x.expr), lignes: a.map(x => x.ligne), val: a.map(x => x.valeur) };
      });
      await s.page.click('#' + ids3[0]);
      await s.page.keyboard.type(att3.val[0]);             /* le résultat écrit à la main */
      for(let i = 1; i < att3.ex.length; i++){ await s.page.click('#' + ids3[i]); await s.page.keyboard.type(att3.ex[i]); }
      for(let i = 0; i < att3.lignes.length; i++){ await s.page.click('#' + ids3[att3.ex.length + i]); await s.page.keyboard.type(att3.lignes[i]); }
      await s.page.click('#pdcRun');
      await s.page.waitForTimeout(350);
      await s.page.click('#pdcValidate');
      await s.page.waitForTimeout(450);
      const sout = await s.page.evaluate(idsIn => {
        const e0 = document.getElementById(idsIn[0]), fb = document.getElementById('pdcFeedback');
        return { bad: /\bbad\b/.test(e0.className), encre: getComputedStyle(e0).color,
                 cor: document.querySelectorAll('#pdcHost .mf-cor').length,
                 b: !!document.getElementById('pdcB'), fb: fb.textContent,
                 fbVisible: fb.getBoundingClientRect().height > 10, verrou: e0.disabled,
                 rev: (document.getElementById('pdcValidate') || {}).textContent || '' };
      }, ids3);
      verifier('en soutien, le calcul faux rougit (encre rouge rendue), rien ne se révèle — ni bonne écriture ni b) —, le message dit OÙ est l\'erreur sans l\'écrire, et Revérifier est proposé',
        sout.bad && dom(sout.encre) === 'rouge' && sout.cor === 0 && !sout.b
        && /Où est l’erreur/.test(sout.fb) && sout.fb.indexOf(att3.ex[0]) < 0 && sout.fbVisible && !sout.verrou && /Rev/.test(sout.rev), JSON.stringify(sout).slice(0, 320));
      await s.page.fill('#' + ids3[0], att3.ex[0]);
      await s.page.waitForTimeout(180);
      const modif = await s.page.evaluate(idsIn => ({ bad: /\bbad\b/.test(document.getElementById(idsIn[0]).className),
        valFerme: document.getElementById('pdcValidate').disabled, console: document.getElementById('pdcConsole').textContent }), ids3);
      verifier('le calcul corrigé perd son rouge, referme Revérifier et vide la console', !modif.bad && modif.valFerme && modif.console === '', JSON.stringify(modif));
      await s.page.press('#' + ids3[0], 'Enter');
      await s.page.waitForTimeout(350);
      await s.page.click('#pdcValidate');
      await s.page.waitForTimeout(450);
      const fin3 = await s.page.evaluate(idsIn => ({ ok: /\bok\b/.test(document.getElementById(idsIn[0]).className),
        score: test.score, b: !!document.getElementById('pdcB'), suivant: !!document.getElementById('pdcNext') }), ids3);
      verifier('la copie corrigée, exécutée puis revérifiée, vaut ' + DD.casesFiche + ' en soutien, ouvre le b) et propose la suite',
        fin3.ok && fin3.score === DD.casesFiche && fin3.b && fin3.suivant, JSON.stringify(fin3));
      await s.nav.close(); s = null;
    }
    /* ===== 6 vicies. inéquation : la droite se glisse, le dessin suit la réponse ===== */
    /* {inequation-droite} : la droite orange se fait GLISSER (jsdom n'a pas
       de mise en page — seul un navigateur voit le geste), puis la partie
       rouge se colorie SELON LA RÉPONSE de l'élève dès que les deux choix de
       la phrase sont faits — mesurée ici sur les morceaux RENDUS, avec leur
       étendue. */
    titre('6 vicies. INÉQUATION : LA DROITE SE GLISSE, LE DESSIN SUIT LA RÉPONSE');
    if(!P.inequationDroite){
      ignorer('la droite se glisse et le dessin suit la réponse',
        'ce niveau n\'a pas l\'exercice de l\'inéquation à droite posée');
    } else {
      s = await ouvrir(chromium, ml, { viewport: { width: 1366, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), P.inequationDroite.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      const posY = async (y, dy) => await s.page.evaluate(([y, dy]) => {
        const svg = document.querySelector('#iqdGraph .lv-svg');
        svg.scrollIntoView({ block: 'center' });
        const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
        const vx = [], hy = [];
        svg.querySelectorAll('line.lv-grid').forEach(l => {
          if(l.getAttribute('x1') === l.getAttribute('x2')) vx.push(parseFloat(l.getAttribute('x1')));
          else hy.push(parseFloat(l.getAttribute('y1')));
        });
        const pasY = Math.abs(hy[1] - hy[0]) * r.height / vb.height;
        return { px: r.left + vx[3] * r.width / vb.width,
                 py: r.top + hy[y + 3] * r.height / vb.height + (dy || 0) * pasY };
      }, [y, dy || 0]);
      const q0 = await s.page.evaluate(() => { const q = test.questions[test.idx];
        return { k: q.k, op: q.op, b: iqdBornes(q), dessus: iqdSens(q.op).dessus, touche: iqdSens(q.op).touche }; });
      let e = await s.page.evaluate(() => ({
        posOff: document.getElementById('iqd-pos').disabled,
        niv: !!document.querySelector('#iqdGraph .adr-niv'),
        rouges: document.querySelectorAll('#iqdGraph .ing-rouge').length
      }));
      if(!e.posOff) dits.push('la phrase se remplit avant que la droite soit posée');
      if(e.niv) dits.push('une droite est dessinée avant que l\'élève la pose');
      if(e.rouges) dits.push('la partie rouge est dessinée avant toute lecture');
      /* le glisser, relâché à un tiers de maille : la droite s'accroche */
      const depart = q0.k >= 0 ? -2 : 2;
      let p = await posY(depart);
      await s.page.mouse.move(p.px, p.py);
      await s.page.mouse.down();
      await s.page.waitForTimeout(120);
      p = await posY(q0.k, q0.k > depart ? 0.3 : -0.3);
      await s.page.mouse.move(p.px, p.py, { steps: 5 });
      await s.page.waitForTimeout(120);
      await s.page.mouse.up();
      await s.page.waitForTimeout(200);
      e = await s.page.evaluate(() => ({ dr: test.questions[test.idx].dr, niv: !!document.querySelector('#iqdGraph .adr-niv') }));
      if(e.dr !== q0.k) dits.push('le glisser relâché à un tiers de maille pose la droite en ' + e.dr + ' au lieu de ' + q0.k);
      if(!e.niv) dits.push('la droite posée ne se dessine pas');
      /* la lecture OPPOSÉE d'abord : le dessin doit suivre la réponse, pas la bonne */
      const choisir = async (pos, tou) => await s.page.evaluate(([pos, tou]) => {
        const p = document.getElementById('iqd-pos'), t = document.getElementById('iqd-tou');
        p.value = pos; p.dispatchEvent(new Event('change', { bubbles: true }));
        t.value = tou; t.dispatchEvent(new Event('change', { bubbles: true }));
      }, [pos, tou]);
      await choisir(q0.dessus ? 'dessous' : 'dessus', q0.touche ? 'non' : 'oui');
      let d = await s.page.evaluate(() => {
        const rs = Array.prototype.map.call(document.querySelectorAll('#iqdGraph .ing-rouge'),
          el => el.getBoundingClientRect().width);
        return { n: rs.length, larges: rs.filter(w => w > 8).length };
      });
      if(d.n !== 2) dits.push('la lecture opposée ne colorie pas les deux morceaux extérieurs (' + d.n + ' morceau(x))');
      else if(d.larges !== 2) dits.push('les morceaux rouges de la lecture opposée sont d\'étendue presque nulle');
      /* puis la bonne lecture : un seul morceau, d'étendue non nulle */
      await choisir(q0.dessus ? 'dessus' : 'dessous', q0.touche ? 'oui' : 'non');
      d = await s.page.evaluate(() => {
        const rs = Array.prototype.map.call(document.querySelectorAll('#iqdGraph .ing-rouge'),
          el => el.getBoundingClientRect().width);
        return { n: rs.length, larges: rs.filter(w => w > 8).length };
      });
      if(d.n !== 1) dits.push('la bonne lecture ne colorie pas le morceau du milieu (' + d.n + ' morceau(x))');
      else if(d.larges !== 1) dits.push('le morceau rouge de la bonne lecture est d\'étendue presque nulle');
      /* la conclusion, puis la vérification : toutes les réponses comptées */
      await s.page.evaluate(([co, b1, b2, cf]) => {
        [['iqd-co', co], ['iqd-b1', b1], ['iqd-b2', b2], ['iqd-cf', cf]].forEach(([id, v]) => {
          const el = document.getElementById(id);
          el.value = v; el.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }, [q0.touche ? '[' : ']', String(q0.b[0]), String(q0.b[1]), q0.touche ? ']' : '[']);
      await s.page.click('#iqdValidate');
      await s.page.waitForTimeout(300);
      const fin = await s.page.evaluate(() => ({
        score: test.score, sol: !!document.querySelector('#iqdGraph .adr-sol')
      }));
      if(fin.score !== 7) dits.push('la copie juste au geste vaut ' + fin.score + ' au lieu de 7');
      if(fin.sol) dits.push('la correction verte s\'affiche sur une copie toute juste');
      verifier('la droite se glisse et le dessin suit la réponse', !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran de l\'inéquation à droite posée ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies duodecies. UNE CASE DE LIMITE : LE RACCOURCI, LE BOUTON ∞, LE VERDICT ===== */
    /* La case est un champ MathLive depuis que le clavier du 3.5 la sert
       (demande de Turquet, septembre 2026). jsdom pose une CHAÎNE et la relit ;
       seul un vrai MathLive montre qu'un élève qui TAPE « inf » écrit ∞, qu'une
       touche ∞ écrit vraiment — la doctrine du bouton mort — et que le juge
       accepte ce que la sérialisation réelle lui rend. */
    titre('6 tricies duodecies. UNE CASE DE LIMITE : LE RACCOURCI, LE BOUTON ∞, LE VERDICT');
    if(!P.casesLimite || !P.casesLimite.navigateur){
      ignorer('la case de limite : « inf » écrit ∞, le bouton ∞ écrit, et le juge relit',
        'ce niveau ne déclare aucune case de limite');
    } else {
      const L = P.casesLimite.navigateur;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), L.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="' + (L.mode || 'train') + '"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* le RACCOURCI : l'élève tape « inf », MathLive écrit ∞ — c'est ce que
         l'indication de l'écran lui promet */
      await s.page.click('#' + L.case);
      await s.page.waitForTimeout(400);   /* le piège documenté du 6.8 : les premières frappes tombent dans le vide si la case n'a pas fini de prendre le focus */
      await s.page.keyboard.type('-inf', { delay: 70 });
      await s.page.waitForTimeout(300);
      const tape = await s.page.evaluate(id => ({ lu: limLire(id), juge: lgLimOK({ lim: '−∞' }, limLire(id)) }), L.case);
      if(tape.lu.indexOf('∞') < 0) dits.push('« inf » tapé au clavier n\'écrit pas ∞ dans la case (' + JSON.stringify(tape.lu) + ')');
      if(!tape.juge) dits.push('le juge ne reconnaît pas la limite tapée au clavier (' + JSON.stringify(tape.lu) + ')');
      /* la case se VIDE, puis le BOUTON ∞ écrit — et lève « input » une seule
         fois : executeCommand le lève déjà, le doubler ferait deux événements
         pour une touche */
      await s.page.evaluate(id => { document.getElementById(id).setValue(''); window.__limIn = 0;
        document.getElementById(id).addEventListener('input', () => { window.__limIn++; }); }, L.case);
      await s.page.click(L.bouton);
      await s.page.waitForTimeout(250);
      const bouton = await s.page.evaluate(id => ({ lu: limLire(id), ev: window.__limIn }), L.case);
      if(bouton.lu.indexOf('∞') < 0) dits.push('le bouton ∞ n\'écrit pas dans la case (' + JSON.stringify(bouton.lu) + ')');
      if(bouton.ev !== 1) dits.push('le bouton ∞ lève ' + bouton.ev + ' événement(s) input au lieu d\'un seul');
      /* et la case rendue : une boîte non nulle, à la taille du texte qui
         l'entoure — un CSS perdu la rendrait invisible sans qu'une erreur ne
         se lève */
      const boite = await s.page.evaluate(id => { const e = document.getElementById(id);
        const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }, L.case);
      if(boite.w < 40 || boite.h < 20) dits.push('la case rendue fait ' + boite.w + 'x' + boite.h + ' px');
      verifier('la case de limite : « inf » écrit ∞, le bouton ∞ écrit, et le juge relit',
        !dits.length, dits.slice(0, 3).join(' | '));
      verifier('l\'écran d\'une case de limite ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies quaterdecies. {python-pas-a-pas} : les deux colonnes, la rangée choisie et tapée =====
       Le banc jsdom tient la fiche, le tirage et ses trois visages, l'état de
       la mémoire refait par une seconde arithmétique, le juge, la porte de la
       ligne suivante, la rangée à moitié remplie et le soutien. Ce qu'il ne
       voit pas : les DEUX colonnes RENDUES côte à côte — le programme et le
       tableau des cases, la disposition de la fiche —, le REPÈRE ▶ sur la
       ligne qu'on exécute, le tableau qui GRANDIT d'une rangée à chaque
       étape — et dont la rangée QUITTÉE porte la mémoire VRAIE, à l'encre
       RENDUE : le défaut que la capture a montré, où elle gardait la saisie
       fausse en rouge et donnait DEUX nombres pour une même case —, les deux
       cases à la chasse et à la taille du code qu'elles
       lisent, un VRAI choix dans la liste (Playwright refuse de choisir dans
       une liste fermée, et c'est le bord qu'on tient) suivi d'une VRAIE
       frappe, l'encre RENDUE des deux verdicts sur la même rangée — l'une
       bleue, l'autre rouge : c'est la règle « chaque case se juge seule », et
       seule une couleur rendue la montre —, la bonne réponse en VERT SOUS la
       case et non à côté (dans une cellule de tableau, un badge en ligne
       sortirait de sa cellule), et le téléphone, où les deux colonnes
       S'EMPILENT au lieu de faire déborder la page.
       TOUT SE MESURE SUR LA QUESTION 1, la fiche ÉPINGLÉE : sur un tirage au
       hasard, le nombre de lignes et les valeurs changeraient d'une exécution
       à l'autre, et le contrôle serait INTERMITTENT. */
    titre('6 tricies quaterdecies. LE PROGRAMME PAS À PAS : LES DEUX COLONNES, LA RANGÉE CHOISIE ET TAPÉE');
    if(!P.pythonPasAPas){
      ignorer('le programme pas à pas : les deux colonnes rendues, la rangée choisie et tapée',
        'ce niveau n\'a pas l\'exercice du programme pas à pas');
    } else {
      const A = P.pythonPasAPas, nL = A.fiche.prog.length;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), A.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      const dits = [];
      /* 1. LES DEUX COLONNES, LE REPÈRE, ET LA PREMIÈRE RANGÉE */
      const vu = await s.page.evaluate(() => {
        const host = document.getElementById('papHost');
        const cols = [...host.querySelectorAll('.pap-col')], prog = host.querySelector('.pyx-prog');
        const lignes = [...host.querySelectorAll('.pyx-ligne')], mem = host.querySelector('.pap-mem');
        const ne = document.getElementById('pap-nom-0'), ve = document.getElementById('pap-val-0');
        const r = e => e.getBoundingClientRect(), px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const fam = e => getComputedStyle(e).fontFamily;
        return { cols: cols.length,
                 /* côte à côte : la seconde colonne commence à DROITE de la première, sur sa ligne */
                 aCote: cols.length === 2 && r(cols[1]).left >= r(cols[0]).right - 1 && Math.abs(r(cols[1]).top - r(cols[0]).top) < 40,
                 lignes: lignes.map(e => e.textContent.replace(/\s+/g, ' ').trim()),
                 reperes: lignes.map(e => (e.querySelector('.pap-repere') || {}).textContent || ''),
                 ici: lignes.map(e => e.classList.contains('pap-ici')),
                 rangees: mem ? mem.querySelectorAll('tr').length : 0,
                 memBoite: mem ? { w: Math.round(r(mem).width), h: Math.round(r(mem).height) } : null,
                 nom: ne ? { tag: ne.tagName, opts: [...ne.options].length, px: px(ne), fam: fam(ne), w: Math.round(r(ne).width) } : null,
                 val: ve ? { tag: ve.tagName, px: px(ve), fam: fam(ve), w: Math.round(r(ve).width) } : null,
                 pxProg: px(prog.querySelector('.pyx-l1')), famProg: fam(prog.querySelector('.pyx-l1')),
                 /* les deux cases de la rangée partagent sa ligne */
                 memeLigne: ne && ve && Math.abs(r(ne).top - r(ve).top) < r(ne).height,
                 bouton: (document.getElementById('papValidate') || {}).textContent,
                 step: !!document.getElementById('papStep'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      if(vu.cols !== 2 || !vu.aCote) dits.push('les deux colonnes ne sont pas côte à côte (' + vu.cols + ' colonne(s))');
      if(vu.lignes.length !== nL) dits.push(vu.lignes.length + ' ligne(s) de programme rendues au lieu de ' + nL);
      if(!A.fiche.prog.every((c, i) => (vu.lignes[i] || '').indexOf(c) >= 0))
        dits.push('le programme rendu : ' + JSON.stringify(vu.lignes));
      /* LE REPÈRE : ▶ sur la ligne qu'on exécute, et sur elle seule */
      if(vu.reperes[0].indexOf('▶') < 0 || vu.reperes.slice(1).some(t => t.indexOf('▶') >= 0))
        dits.push('le repère de la ligne courante : ' + JSON.stringify(vu.reperes));
      if(!vu.ici[0] || vu.ici.slice(1).some(Boolean)) dits.push('la ligne surlignée : ' + JSON.stringify(vu.ici));
      /* LE TABLEAU : l'en-tête et UNE rangée — il grandira d'une rangée par étape */
      if(vu.rangees !== 2) dits.push(vu.rangees + ' rangée(s) de mémoire au lieu de 2 (en-tête + la ligne en cours)');
      if(!vu.memBoite || vu.memBoite.w < 120 || vu.memBoite.h < 40) dits.push('le tableau de la mémoire rendu : ' + JSON.stringify(vu.memBoite));
      if(!vu.nom || vu.nom.tag !== 'SELECT' || vu.nom.opts !== nL + 1) dits.push('la liste des cases : ' + JSON.stringify(vu.nom));
      if(!vu.val || vu.val.tag !== 'INPUT') dits.push('la case du contenu : ' + JSON.stringify(vu.val));
      /* les deux cases écrivent à la chasse et à la taille du code qu'elles lisent */
      if(!/mono|menlo|consolas|courier/i.test(vu.famProg)) dits.push('le programme n\'est pas à chasse fixe : ' + vu.famProg);
      if(!vu.nom || !/mono|menlo|consolas|courier/i.test(vu.nom.fam) || Math.abs(vu.nom.px - vu.pxProg) > 0.6)
        dits.push('la liste des cases n\'écrit pas comme le code : ' + JSON.stringify(vu.nom) + ' contre ' + vu.pxProg + 'px ' + vu.famProg);
      if(!vu.val || !/mono|menlo|consolas|courier/i.test(vu.val.fam) || Math.abs(vu.val.px - vu.pxProg) > 0.6)
        dits.push('la case du contenu n\'écrit pas comme le code : ' + JSON.stringify(vu.val));
      if(!vu.memeLigne) dits.push('les deux cases de la rangée ne partagent pas sa ligne');
      if(!/^V/.test(vu.bouton || '')) dits.push('le bouton de la rangée : ' + JSON.stringify(vu.bouton));
      if(vu.step) dits.push('« Passer à la ligne suivante » est là avant toute réponse');
      if(vu.page) dits.push('la page déborde en largeur à 1400 px');
      verifier('les deux colonnes rendues côte à côte, le repère ▶ sur la ligne qu\'on exécute, et la rangée à la chasse du code',
        !dits.length, dits.slice(0, 3).join(' | '));
      /* 2. LA RANGÉE SE CHOISIT ET SE TAPE POUR DE VRAI, et chaque case se juge SEULE */
      const bons = await s.page.evaluate(() => { const q = test.questions[test.idx];
        return q.lignes.map((l, k) => papAns(q, k)); });
      const faux = await s.page.evaluate(() => { const q = test.questions[test.idx], a = papAns(q, 0);
        return q.ordre.filter(n => n !== a.nom)[0]; });
      const gestes = [];
      /* on choisit la MAUVAISE case et on tape la BONNE valeur : les deux
         verdicts tombent sur la même rangée, l'un bleu et l'autre rouge */
      await s.page.selectOption('#pap-nom-0', faux);
      await s.page.click('#pap-val-0');
      await s.page.keyboard.type(bons[0].val, { delay: 60 });
      await s.page.waitForTimeout(150);
      await s.page.click('#papValidate');
      await s.page.waitForTimeout(400);
      const mix = await s.page.evaluate(() => {
        const ne = document.getElementById('pap-nom-0'), ve = document.getElementById('pap-val-0');
        const b = ne.nextElementSibling, r = e => e.getBoundingClientRect();
        const rb = b ? r(b) : null, rn = r(ne);
        return { cn: ne.className, cv: ve.className, en: getComputedStyle(ne).color, ev: getComputedStyle(ve).color,
                 badge: !!(b && b.classList && b.classList.contains('mf-cor')), texte: b ? b.textContent : '',
                 encre: b ? getComputedStyle(b).color : '',
                 /* SOUS la case, jamais à côté : dans une cellule de tableau un
                    badge en ligne sortirait de sa cellule */
                 dessous: !!rb && rb.top >= rn.bottom - 2 && rb.width > 4,
                 dedans: !!rb && rb.right <= document.documentElement.clientWidth,
                 badgeVal: !!(ve.nextElementSibling && ve.nextElementSibling.classList && ve.nextElementSibling.classList.contains('mf-cor')),
                 score: test.score, step: (document.getElementById('papStep') || {}).textContent,
                 lu: ve.value, page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      if(mix.lu !== bons[0].val) gestes.push('la valeur tapée au clavier n\'est pas arrivée : ' + JSON.stringify(mix.lu));
      if(!/bad/.test(mix.cn) || dom(mix.en) !== 'rouge') gestes.push('la case choisie fausse n\'est pas rouge : ' + mix.cn + ' / ' + mix.en);
      if(!/ok/.test(mix.cv) || dom(mix.ev) !== 'bleu') gestes.push('la valeur juste n\'est pas bleue : ' + mix.cv + ' / ' + mix.ev);
      if(!mix.badge || mix.texte !== bons[0].nom || dom(mix.encre) !== 'vert')
        gestes.push('la bonne case en vert : ' + JSON.stringify({ badge: mix.badge, texte: mix.texte, encre: mix.encre }));
      if(!mix.dessous || !mix.dedans) gestes.push('le badge n\'est pas SOUS la case, dans sa cellule');
      if(mix.badgeVal) gestes.push('un badge s\'affiche aussi à côté de la case juste');
      if(mix.score !== 1) gestes.push('note ' + mix.score + ' au lieu de 1');
      if(!/ligne 2/.test(mix.step || '')) gestes.push('le bouton de la ligne suivante : ' + JSON.stringify(mix.step));
      if(mix.page) gestes.push('la page déborde après la correction');
      verifier('la rangée se CHOISIT et se TAPE pour de vrai : les deux verdicts tombent sur la même rangée, l\'un bleu et l\'autre rouge, et la bonne case s\'écrit en VERT SOUS la case fausse',
        !gestes.length, gestes.slice(0, 3).join(' | '));
      /* 3. LE TABLEAU GRANDIT, ET LA MÉMOIRE PERSISTE À L'ÉCRAN */
      await s.page.click('#papStep');
      await s.page.waitForTimeout(400);
      const grandi = [];
      const g = await s.page.evaluate(() => {
        const mem = document.getElementById('papHost').querySelector('.pap-mem');
        const lignes = [...document.querySelectorAll('#papHost .pyx-ligne')];
        const n0 = document.getElementById('pap-nom-0'), n1 = document.getElementById('pap-nom-1');
        return { rangees: mem.querySelectorAll('tr').length,
                 ligne0: (n0 || {}).value, classe0: (n0 || {}).className, fige0: !!(n0 && n0.disabled),
                 encre0: n0 ? getComputedStyle(n0).color : '',
                 badges: document.querySelectorAll('#papHost .mf-cor').length,
                 rang1: !!n1, vide1: n1 ? n1.value : 'ABSENTE',
                 reperes: lignes.map(e => (e.querySelector('.pap-repere') || {}).textContent || ''),
                 defile: mem.parentElement.scrollWidth > mem.parentElement.clientWidth + 1,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      if(g.rangees !== 3) grandi.push(g.rangees + ' rangée(s) au lieu de 3 après être passé à la ligne 2');
      if(!g.rang1 || g.vide1 !== '') grandi.push('la nouvelle rangée n\'est pas vide : ' + JSON.stringify(g.vide1));
      /* LA RANGÉE QUITTÉE PORTE LA MÉMOIRE VRAIE — le défaut que la capture a
         montré : elle gardait la saisie FAUSSE en rouge avec la correction en
         vert à côté, donc DEUX nombres pour une même case dans un tableau qui
         s'appelle « la mémoire de l'ordinateur ». Ici la case du nom était
         fausse : elle porte le nom VRAI, en vert (sol), et plus aucun badge ne
         traîne. Seule une encre RENDUE le montre. */
      if(g.ligne0 !== bons[0].nom || !/sol/.test(g.classe0 || '') || dom(g.encre0) !== 'vert' || !g.fige0)
        grandi.push('la rangée quittée ne porte pas la mémoire vraie : ' + JSON.stringify({ v: g.ligne0, c: g.classe0, e: g.encre0, d: g.fige0 }) + ' au lieu de ' + bons[0].nom + ' en vert');
      if(g.badges) grandi.push(g.badges + ' badge(s) de correction traînent sur une rangée quittée');
      if(g.reperes[0].indexOf('✓') < 0 || g.reperes[1].indexOf('▶') < 0)
        grandi.push('les repères après une étape : ' + JSON.stringify(g.reperes));
      if(g.defile || g.page) grandi.push('le tableau ou la page déborde à 1400 px');
      verifier('le tableau GRANDIT d\'une rangée à chaque étape, la rangée d\'avant reste posée et peinte, et le ✓ passe sur la ligne exécutée',
        !grandi.length, grandi.slice(0, 3).join(' | '));
      /* 4. SUR UN TÉLÉPHONE, LES DEUX COLONNES S'EMPILENT */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(400);
      const tel = await s.page.evaluate(() => {
        const cols = [...document.querySelectorAll('#papHost .pap-col')];
        const mem = document.getElementById('papHost').querySelector('.pap-mem');
        const r = e => e.getBoundingClientRect();
        return { empilees: cols.length === 2 && r(cols[1]).top >= r(cols[0]).bottom - 2,
                 memDedans: r(mem).right <= document.documentElement.clientWidth + 1
                            || mem.parentElement.scrollWidth > mem.parentElement.clientWidth,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('sur un téléphone, les deux colonnes S\'EMPILENT et la page ne déborde pas en largeur',
        tel.empilees && tel.memDedans && !tel.page, JSON.stringify(tel));
      verifier('l\'écran du programme pas à pas ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies quindecies. {python-valeur-case} : le nom ÉCRIT, la valeur TAPÉE =====
       Le banc jsdom tient le tirage, le barème, le juge, la porte de la ligne
       suivante, la case vide, le soutien, la rangée quittée, le bilan de la
       fin, la reprise et les branchements. Ce qu'il ne voit pas : les DEUX
       colonnes RENDUES côte à côte — la disposition du 5.14, partagée —, le
       nom de la case ÉCRIT par la page à la place de la liste du 5.14 (c'est
       la différence même entre les deux exercices, et seule une page rendue
       montre qu'aucune liste n'y traîne), la case unique à la chasse et à la
       taille du code qu'elle lit, une VRAIE frappe au clavier, l'encre RENDUE
       du verdict — bleue quand c'est juste —, le tableau qui GRANDIT d'une
       rangée à chaque étape pendant que la rangée d'avant reste posée et
       peinte, le BILAN de la mémoire écrit à la fin du programme, et le
       téléphone, où les deux colonnes S'EMPILENT au lieu de faire déborder la
       page.
       TOUT SE MESURE SUR LA QUESTION 1, la fiche ÉPINGLÉE : sur un tirage au
       hasard, le nombre de lignes et les valeurs changeraient d'une exécution
       à l'autre, et le contrôle serait INTERMITTENT. */
    titre('6 tricies quindecies. LA VALEUR DE LA CASE MÉMOIRE : LE NOM ÉCRIT, LA VALEUR TAPÉE');
    if(!P.pythonValeurCase){
      ignorer('la valeur de la case mémoire : les deux colonnes rendues, le nom écrit et la valeur tapée',
        'ce niveau n\'a pas l\'exercice de la valeur de la case mémoire');
    } else {
      const A = P.pythonValeurCase, nL = A.fiche.prog.length;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), A.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      const dits = [];
      /* 1. LES DEUX COLONNES, LE NOM ÉCRIT, LA CASE UNIQUE */
      const vu = await s.page.evaluate(() => {
        const host = document.getElementById('pvmHost');
        const cols = [...host.querySelectorAll('.pap-col')], prog = host.querySelector('.pyx-prog');
        const lignes = [...host.querySelectorAll('.pyx-ligne')], mem = host.querySelector('.pap-mem');
        const ve = document.getElementById('pvm-val-0'), nm = host.querySelector('.pvm-nom');
        const r = e => e.getBoundingClientRect(), px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        const fam = e => getComputedStyle(e).fontFamily;
        return { cols: cols.length,
                 aCote: cols.length === 2 && r(cols[1]).left >= r(cols[0]).right - 1 && Math.abs(r(cols[1]).top - r(cols[0]).top) < 40,
                 lignes: lignes.map(e => e.textContent.replace(/\s+/g, ' ').trim()),
                 reperes: lignes.map(e => (e.querySelector('.pap-repere') || {}).textContent || ''),
                 ici: lignes.map(e => e.classList.contains('pap-ici')),
                 rangees: mem ? mem.querySelectorAll('tr').length : 0,
                 /* LE NOM EST ÉCRIT, PAS CHOISI : aucune liste dans l'écran */
                 listes: host.querySelectorAll('select').length,
                 nom: nm ? { txt: nm.textContent.trim(), px: px(nm), fam: fam(nm) } : null,
                 cases: host.querySelectorAll('input').length,
                 val: ve ? { tag: ve.tagName, px: px(ve), fam: fam(ve), w: Math.round(r(ve).width) } : null,
                 pxProg: px(prog.querySelector('.pyx-l1')), famProg: fam(prog.querySelector('.pyx-l1')),
                 memeLigne: ve && nm && Math.abs(r(ve).top - r(nm).top) < r(ve).height,
                 bilan: !!host.querySelector('.pvm-bilan'),
                 bouton: (document.getElementById('pvmValidate') || {}).textContent,
                 step: !!document.getElementById('pvmStep'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      if(vu.cols !== 2 || !vu.aCote) dits.push('les deux colonnes ne sont pas côte à côte (' + vu.cols + ' colonne(s))');
      if(vu.lignes.length !== nL) dits.push(vu.lignes.length + ' ligne(s) de programme rendues au lieu de ' + nL);
      if(!A.fiche.prog.every((c, i) => (vu.lignes[i] || '').indexOf(c) >= 0))
        dits.push('le programme rendu : ' + JSON.stringify(vu.lignes));
      if(vu.reperes[0].indexOf('▶') < 0 || vu.reperes.slice(1).some(t => t.indexOf('▶') >= 0))
        dits.push('le repère de la ligne courante : ' + JSON.stringify(vu.reperes));
      if(!vu.ici[0] || vu.ici.slice(1).some(Boolean)) dits.push('la ligne surlignée : ' + JSON.stringify(vu.ici));
      if(vu.rangees !== 2) dits.push(vu.rangees + ' rangée(s) de mémoire au lieu de 2 (en-tête + la ligne en cours)');
      /* CE QUI DISTINGUE CET EXERCICE DU 5.14 : le nom est ÉCRIT */
      if(vu.listes) dits.push(vu.listes + ' liste(s) de propositions dans l\'écran : le nom se choisit encore');
      if(!vu.nom || vu.nom.txt !== A.fiche.memoire[0][0]) dits.push('le nom de la case écrit par la page : ' + JSON.stringify(vu.nom));
      if(vu.cases !== 1) dits.push(vu.cases + ' case(s) de saisie au lieu d\'une seule');
      if(!vu.val || vu.val.tag !== 'INPUT') dits.push('la case de la valeur : ' + JSON.stringify(vu.val));
      if(vu.bilan) dits.push('le bilan de la mémoire est affiché avant la fin du programme');
      /* le nom et la case écrivent à la chasse et à la taille du code qu'ils lisent */
      if(!/mono|menlo|consolas|courier/i.test(vu.famProg)) dits.push('le programme n\'est pas à chasse fixe : ' + vu.famProg);
      if(!vu.nom || !/mono|menlo|consolas|courier/i.test(vu.nom.fam) || Math.abs(vu.nom.px - vu.pxProg) > 0.6)
        dits.push('le nom de la case n\'écrit pas comme le code : ' + JSON.stringify(vu.nom) + ' contre ' + vu.pxProg + 'px');
      if(!vu.val || !/mono|menlo|consolas|courier/i.test(vu.val.fam) || Math.abs(vu.val.px - vu.pxProg) > 0.6)
        dits.push('la case de la valeur n\'écrit pas comme le code : ' + JSON.stringify(vu.val));
      if(!vu.memeLigne) dits.push('le nom et la case ne partagent pas la ligne de leur rangée');
      if(!/^V/.test(vu.bouton || '')) dits.push('le bouton de la rangée : ' + JSON.stringify(vu.bouton));
      if(vu.step) dits.push('« Passer à la ligne suivante » est là avant toute réponse');
      if(vu.page) dits.push('la page déborde en largeur à 1400 px');
      verifier('les deux colonnes rendues côte à côte, le NOM de la case ÉCRIT (aucune liste) et une seule case à la chasse du code',
        !dits.length, dits.slice(0, 3).join(' | '));
      /* 2. LA VALEUR SE TAPE POUR DE VRAI, et le verdict s'encre en BLEU */
      const bons = await s.page.evaluate(() => { const q = test.questions[test.idx];
        return q.lignes.map((l, k) => papAns(q, k)); });
      const gestes = [];
      await s.page.click('#pvm-val-0');
      await s.page.keyboard.type(bons[0].val, { delay: 60 });
      await s.page.waitForTimeout(150);
      await s.page.click('#pvmValidate');
      await s.page.waitForTimeout(400);
      const juge = await s.page.evaluate(() => {
        const ve = document.getElementById('pvm-val-0');
        return { lu: ve.value, cv: ve.className, ev: getComputedStyle(ve).color, fige: ve.disabled,
                 badges: document.querySelectorAll('#pvmHost .mf-cor').length,
                 score: test.score, step: (document.getElementById('pvmStep') || {}).textContent,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      if(juge.lu !== bons[0].val) gestes.push('la valeur tapée au clavier n\'est pas arrivée : ' + JSON.stringify(juge.lu));
      if(!/ok/.test(juge.cv) || dom(juge.ev) !== 'bleu') gestes.push('la valeur juste n\'est pas bleue : ' + juge.cv + ' / ' + juge.ev);
      if(!juge.fige) gestes.push('la case jugée reste modifiable');
      if(juge.badges) gestes.push(juge.badges + ' badge(s) de correction sur une case juste');
      if(juge.score !== 1) gestes.push('note ' + juge.score + ' au lieu de 1');
      if(!/ligne 2/.test(juge.step || '')) gestes.push('le bouton de la ligne suivante : ' + JSON.stringify(juge.step));
      if(juge.page) gestes.push('la page déborde après la correction');
      verifier('la valeur se TAPE pour de vrai et le verdict s\'encre en BLEU sur la case, sans badge de correction',
        !gestes.length, gestes.slice(0, 3).join(' | '));
      /* 3. LE TABLEAU GRANDIT, ET LA MÉMOIRE PERSISTE À L'ÉCRAN */
      await s.page.click('#pvmStep');
      await s.page.waitForTimeout(400);
      const grandi = [];
      const g = await s.page.evaluate(() => {
        const host = document.getElementById('pvmHost'), mem = host.querySelector('.pap-mem');
        const lignes = [...host.querySelectorAll('.pyx-ligne')];
        const v0 = document.getElementById('pvm-val-0'), v1 = document.getElementById('pvm-val-1');
        return { rangees: mem.querySelectorAll('tr').length,
                 noms: [...host.querySelectorAll('.pvm-nom')].map(e => e.textContent.trim()),
                 val0: (v0 || {}).value, classe0: (v0 || {}).className, fige0: !!(v0 && v0.disabled),
                 encre0: v0 ? getComputedStyle(v0).color : '',
                 rang1: !!v1, vide1: v1 ? v1.value : 'ABSENTE',
                 reperes: lignes.map(e => (e.querySelector('.pap-repere') || {}).textContent || ''),
                 defile: mem.parentElement.scrollWidth > mem.parentElement.clientWidth + 1,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      if(g.rangees !== 3) grandi.push(g.rangees + ' rangée(s) au lieu de 3 après être passé à la ligne 2');
      if(!g.rang1 || g.vide1 !== '') grandi.push('la nouvelle rangée n\'est pas vide : ' + JSON.stringify(g.vide1));
      if(g.noms.join(',') !== A.fiche.memoire.slice(0, 2).map(r => r[0]).join(','))
        grandi.push('les noms de cases écrits : ' + JSON.stringify(g.noms));
      if(g.val0 !== bons[0].val || !/ok/.test(g.classe0 || '') || dom(g.encre0) !== 'bleu' || !g.fige0)
        grandi.push('la rangée quittée ne garde pas sa valeur juste en bleu : ' + JSON.stringify({ v: g.val0, c: g.classe0, e: g.encre0, d: g.fige0 }));
      if(g.reperes[0].indexOf('✓') < 0 || g.reperes[1].indexOf('▶') < 0)
        grandi.push('les repères après une étape : ' + JSON.stringify(g.reperes));
      if(g.defile || g.page) grandi.push('le tableau ou la page déborde à 1400 px');
      verifier('le tableau GRANDIT d\'une rangée à chaque étape, la rangée d\'avant reste posée et peinte, et le ✓ passe sur la ligne exécutée',
        !grandi.length, grandi.slice(0, 3).join(' | '));
      /* 4. LA FIN VÉRIFIE LA MÉMOIRE ENTIÈRE */
      const fin = [];
      for(let k = 1; k < nL; k++){
        await s.page.click('#pvm-val-' + k);
        await s.page.keyboard.type(bons[k].val, { delay: 40 });
        await s.page.click('#pvmValidate');
        await s.page.waitForTimeout(350);
        if(k < nL - 1){ await s.page.click('#pvmStep'); await s.page.waitForTimeout(350); }
      }
      const bilan = await s.page.evaluate(() => {
        const host = document.getElementById('pvmHost'), b = host.querySelector('.pvm-bilan');
        return { n: host.querySelectorAll('.pvm-bilan').length,
                 txt: b ? b.textContent.replace(/\s+/g, ' ').trim() : '',
                 suivant: (document.getElementById('pvmNext') || {}).textContent,
                 score: test.score,
                 note: ((document.getElementById('pvmFeedback') || {}).textContent || ''),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      if(bilan.n !== 1) fin.push(bilan.n + ' bilan(s) de mémoire à la fin au lieu d\'un');
      A.fiche.memoire.forEach(r => {
        if(bilan.txt.indexOf(r[0]) < 0 || bilan.txt.indexOf(r[1]) < 0)
          fin.push('le bilan ne dit pas que ' + r[0] + ' contient ' + r[1] + ' : ' + bilan.txt.slice(0, 140));
      });
      if(bilan.score !== nL) fin.push('note ' + bilan.score + ' au lieu de ' + nL);
      if(!bilan.suivant) fin.push('pas de bouton « Question suivante » à la fin du programme');
      if(!new RegExp(nL + ' cases justes sur ' + nL).test(bilan.note)) fin.push('la note affichée : ' + bilan.note.trim());
      if(bilan.page) fin.push('la page déborde après le bilan');
      verifier('à la dernière ligne, la page VÉRIFIE la mémoire entière — chaque case nommée avec sa valeur d\'arrivée',
        !fin.length, fin.slice(0, 3).join(' | '));
      /* 5. SUR UN TÉLÉPHONE, LES DEUX COLONNES S'EMPILENT */
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(400);
      const tel = await s.page.evaluate(() => {
        const cols = [...document.querySelectorAll('#pvmHost .pap-col')];
        const mem = document.getElementById('pvmHost').querySelector('.pap-mem');
        const r = e => e.getBoundingClientRect();
        return { empilees: cols.length === 2 && r(cols[1]).top >= r(cols[0]).bottom - 2,
                 memDedans: r(mem).right <= document.documentElement.clientWidth + 1
                            || mem.parentElement.scrollWidth > mem.parentElement.clientWidth,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      verifier('sur un téléphone, les deux colonnes S\'EMPILENT et la page ne déborde pas en largeur',
        tel.empilees && tel.memDedans && !tel.page, JSON.stringify(tel));
      verifier('l\'écran de la valeur de la case mémoire ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies sedecies. {python-pas-a-pas-calcul} : quand une ligne CALCULE =====
       Le moteur (papProg, papEtat, papAns, papProgHTML) et la disposition
       (deux colonnes, le nom ÉCRIT) sont ceux du 5.15 — déjà mesurés ci-
       dessus — et ne sont pas remesurés ici. Ce que ce banc mesure est ce qui
       est PROPRE au 5.16 : une ligne comme « c = a+b » se juge, se corrige et
       se bilan-te comme une ligne de CALCUL, pas comme une recopie. Aucune
       seconde arithmétique n'est rejouée : la fiche ÉPINGLÉE porte des
       valeurs CONNUES (10, 2, 12), lues dans tests/profils.js — la même
       garantie qu'un tirage aléatoire donnerait, sans avoir à recalculer. */
    titre('6 tricies sedecies. LE PROGRAMME PAS À PAS, QUAND UNE LIGNE CALCULE');
    if(!P.pythonPasAPasCalcul){
      ignorer('le programme pas à pas : une ligne de calcul se juge, se corrige et se bilan-te comme un calcul',
        'ce niveau n\'a pas l\'exercice du programme pas à pas avec calcul');
    } else {
      const A = P.pythonPasAPasCalcul, nL = A.fiche.prog.length;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), A.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      const dits = [];
      /* 1. LA FICHE ÉPINGLÉE, AVEC SA LIGNE DE CALCUL VISIBLE */
      const vu = await s.page.evaluate(() => {
        const host = document.getElementById('ppcHost');
        const lignes = [...host.querySelectorAll('.pyx-ligne')];
        const nm = host.querySelector('.ppc-nom'), ve = document.getElementById('ppc-val-0');
        return { lignes: lignes.map(e => e.textContent.replace(/\s+/g, ' ').trim()),
                 listes: host.querySelectorAll('select').length,
                 nom: nm ? nm.textContent.trim() : null,
                 case: ve ? ve.tagName : null,
                 bilan: !!host.querySelector('.ppc-bilan') };
      });
      if(vu.lignes.length !== nL) dits.push(vu.lignes.length + ' ligne(s) de programme rendues au lieu de ' + nL);
      if(!A.fiche.prog.every((c, i) => (vu.lignes[i] || '').indexOf(c) >= 0))
        dits.push('le programme rendu : ' + JSON.stringify(vu.lignes));
      if(vu.listes) dits.push(vu.listes + ' liste(s) de propositions dans l\'écran : le nom se choisit encore');
      if(vu.nom !== A.fiche.memoire[0][0]) dits.push('le nom de la case écrit par la page : ' + JSON.stringify(vu.nom));
      if(vu.case !== 'INPUT') dits.push('la case de la valeur : ' + JSON.stringify(vu.case));
      if(vu.bilan) dits.push('le bilan de la mémoire est affiché avant la fin du programme');
      verifier('la fiche épinglée (a = 10, b = 2, c = a+b) est rendue, avec le nom de la case ÉCRIT',
        !dits.length, dits.slice(0, 3).join(' | '));
      /* 2. LES DEUX LIGNES LITTÉRALES SE TAPENT ET SE JUGENT COMME AVANT */
      for(let k = 0; k < nL - 1; k++){
        await s.page.click('#ppc-val-' + k);
        await s.page.keyboard.type(A.fiche.memoire[k][1], { delay: 50 });
        await s.page.waitForTimeout(120);
        await s.page.click('#ppcValidate');
        await s.page.waitForTimeout(300);
        await s.page.click('#ppcStep');
        await s.page.waitForTimeout(300);
      }
      const avant = await s.page.evaluate(() => ({ score: test.score }));
      verifier('les deux premières lignes (littérales) se jugent comme au 5.15',
        avant.score === nL - 1, 'note ' + avant.score + ' après les deux lignes littérales, au lieu de ' + (nL - 1));
      /* 3. LA LIGNE DE CALCUL, RÉPONDUE FAUX D'ABORD : LE MESSAGE NOMME UN CALCUL */
      const gestes = [];
      await s.page.click('#ppc-val-' + (nL - 1));
      await s.page.keyboard.type('102', { delay: 50 });   /* l'erreur d'un élève qui concatène au lieu d'additionner */
      await s.page.waitForTimeout(120);
      await s.page.click('#ppcValidate');
      await s.page.waitForTimeout(400);
      const faux = await s.page.evaluate((idx) => {
        const ve = document.getElementById('ppc-val-' + idx);
        const b = ve ? ve.nextElementSibling : null;
        return { classe: ve ? ve.className : '', encre: ve ? getComputedStyle(ve).color : '',
                 badgeTxt: b ? b.textContent : '', badgeEncre: b ? getComputedStyle(b).color : '',
                 feedback: (document.getElementById('ppcFeedback') || {}).textContent || '',
                 bilan: (document.getElementById('ppcHost').querySelector('.ppc-bilan') || {}).textContent || '' };
      }, nL - 1);
      if(!/bad/.test(faux.classe) || dom(faux.encre) !== 'rouge') gestes.push('la case fausse n\'est pas rouge : ' + faux.classe + ' / ' + faux.encre);
      if(faux.badgeTxt.trim() !== A.fiche.memoire[nL - 1][1] || dom(faux.badgeEncre) !== 'vert')
        gestes.push('la correction en vert : ' + JSON.stringify({ t: faux.badgeTxt, e: faux.badgeEncre }));
      if(!/CALCUL/.test(faux.feedback)) gestes.push('le message ne nomme pas un CALCUL, il dit : ' + faux.feedback.slice(0, 160));
      /* LE BILAN PORTE LA VALEUR VRAIE, MÊME QUAND L'ÉLÈVE S'EST TROMPÉ */
      A.fiche.memoire.forEach(r => {
        if(faux.bilan.indexOf(r[0]) < 0 || faux.bilan.indexOf(r[1]) < 0)
          gestes.push('le bilan ne dit pas que ' + r[0] + ' contient ' + r[1] + ' : ' + faux.bilan.slice(0, 160));
      });
      verifier('une ligne de CALCUL fausse se corrige en vert avec la vraie valeur, le message NOMME un calcul (pas une recopie), et le bilan garde la valeur vraie',
        !gestes.length, gestes.slice(0, 3).join(' | '));
      verifier('l\'écran du programme pas à pas avec calcul ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies septdecies. {python-pas-a-pas-chaine} : un calcul qui en lit un autre =====
       Le moteur (papProg, papEtat, papAns, papProgHTML) et la disposition
       (deux colonnes, le nom ÉCRIT) sont ceux du 5.15/5.16 — déjà mesurés
       ci-dessus — et ne sont pas remesurés en détail ici, sinon dans leur
       présence sur CETTE fiche à quatre lignes. Ce que ce banc mesure est ce
       qui est PROPRE au 5.17 : la ligne « d = c+a » lit une case (c) qui est
       elle-même le résultat d'un calcul, et non un littéral — le message
       d'une réponse fausse doit encore nommer un CALCUL, jamais une recopie,
       et le bilan final doit porter la valeur VRAIE de d (22) même après une
       erreur. Aucune seconde arithmétique n'est rejouée : la fiche ÉPINGLÉE
       porte des valeurs CONNUES (10, 2, 12, 22), lues dans tests/profils.js. */
    titre('6 tricies septdecies. LE PROGRAMME PAS À PAS, QUAND UN CALCUL EN LIT UN AUTRE');
    if(!P.pythonPasAPasChaine){
      ignorer('le programme pas à pas : un calcul qui lit une case déjà calculée se juge, se corrige et se bilan-te comme un calcul',
        'ce niveau n\'a pas l\'exercice du calcul qui en lit un autre');
    } else {
      const A = P.pythonPasAPasChaine, nL = A.fiche.prog.length;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), A.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dits = [];
      /* 1. LA FICHE ÉPINGLÉE, SES QUATRE LIGNES, LES DEUX COLONNES ET LE ▶ */
      const vu = await s.page.evaluate(() => {
        const host = document.getElementById('ppdHost');
        const cols = [...host.querySelectorAll('.pap-col')];
        const lignes = [...host.querySelectorAll('.pyx-ligne')];
        const nm = host.querySelector('.ppd-nom'), ve = document.getElementById('ppd-val-0');
        const r = e => e.getBoundingClientRect();
        return { cols: cols.length,
                 aCote: cols.length === 2 && r(cols[1]).left >= r(cols[0]).right - 1,
                 lignes: lignes.map(e => e.textContent.replace(/\s+/g, ' ').trim()),
                 reperes: lignes.map(e => (e.querySelector('.pap-repere') || {}).textContent || ''),
                 listes: host.querySelectorAll('select').length,
                 nom: nm ? nm.textContent.trim() : null,
                 case: ve ? ve.tagName : null,
                 bilan: !!host.querySelector('.ppd-bilan') };
      });
      if(vu.cols !== 2 || !vu.aCote) dits.push('les deux colonnes ne sont pas côte à côte (' + vu.cols + ' colonne(s))');
      if(vu.lignes.length !== nL) dits.push(vu.lignes.length + ' ligne(s) de programme rendues au lieu de ' + nL);
      if(!A.fiche.prog.every((c, i) => (vu.lignes[i] || '').indexOf(c) >= 0))
        dits.push('le programme rendu : ' + JSON.stringify(vu.lignes));
      if(vu.reperes[0].indexOf('▶') < 0 || vu.reperes.slice(1).some(t => t.indexOf('▶') >= 0))
        dits.push('le repère de la ligne courante : ' + JSON.stringify(vu.reperes));
      if(vu.listes) dits.push(vu.listes + ' liste(s) de propositions dans l\'écran : le nom se choisit encore');
      if(vu.nom !== A.fiche.memoire[0][0]) dits.push('le nom de la case écrit par la page : ' + JSON.stringify(vu.nom));
      if(vu.case !== 'INPUT') dits.push('la case de la valeur : ' + JSON.stringify(vu.case));
      if(vu.bilan) dits.push('le bilan de la mémoire est affiché avant la fin du programme');
      verifier('la fiche épinglée (a = 10, b = 2, c = a+b, d = c+a) est rendue en DEUX colonnes, le repère ▶ sur la première ligne, et le nom de la case ÉCRIT',
        !dits.length, dits.slice(0, 3).join(' | '));
      /* 2. LES TROIS PREMIÈRES LIGNES SE TAPENT ET SE JUGENT, LE ▶ AVANCE, LE TABLEAU GRANDIT */
      const marche = [];
      for(let k = 0; k < nL - 1; k++){
        await s.page.click('#ppd-val-' + k);
        await s.page.keyboard.type(A.fiche.memoire[k][1], { delay: 50 });
        await s.page.waitForTimeout(120);
        await s.page.click('#ppdValidate');
        await s.page.waitForTimeout(300);
        await s.page.click('#ppdStep');
        await s.page.waitForTimeout(300);
        const g = await s.page.evaluate(() => {
          const host = document.getElementById('ppdHost');
          const lignes = [...host.querySelectorAll('.pyx-ligne')];
          return { rangees: host.querySelectorAll('.pap-mem tr').length - 1,
                   reperes: lignes.map(e => (e.querySelector('.pap-repere') || {}).textContent || '') };
        });
        if(g.rangees !== k + 2) marche.push('après la ligne ' + (k + 1) + ' : ' + g.rangees + ' rangée(s) au lieu de ' + (k + 2));
        if(g.reperes[k].indexOf('✓') < 0 || g.reperes[k + 1].indexOf('▶') < 0)
          marche.push('les repères après la ligne ' + (k + 1) + ' : ' + JSON.stringify(g.reperes));
      }
      const avant = await s.page.evaluate(() => ({ score: test.score }));
      if(avant.score !== nL - 1) marche.push('note ' + avant.score + ' après les trois premières lignes, au lieu de ' + (nL - 1));
      verifier('les trois premières lignes se jugent, le repère ▶ avance d\'une ligne à chaque étape, et le tableau de la mémoire GRANDIT d\'une rangée',
        !marche.length, marche.slice(0, 3).join(' | '));
      /* 3. LA LIGNE 4 LIT UNE CASE ELLE-MÊME CALCULÉE : RÉPONDUE FAUX, LE MESSAGE NOMME UN CALCUL */
      const gestes = [];
      await s.page.click('#ppd-val-' + (nL - 1));
      await s.page.keyboard.type('20', { delay: 50 });   /* l'erreur d'un élève qui recalcule a+a au lieu de lire c (=12) puis d'ajouter a */
      await s.page.waitForTimeout(120);
      await s.page.click('#ppdValidate');
      await s.page.waitForTimeout(400);
      const faux = await s.page.evaluate((idx) => {
        const ve = document.getElementById('ppd-val-' + idx);
        const b = ve ? ve.nextElementSibling : null;
        return { classe: ve ? ve.className : '',
                 badgeTxt: b ? b.textContent : '',
                 feedback: (document.getElementById('ppdFeedback') || {}).textContent || '',
                 bilan: (document.getElementById('ppdHost').querySelector('.ppd-bilan') || {}).textContent || '' };
      }, nL - 1);
      if(!/bad/.test(faux.classe)) gestes.push('la case fausse n\'est pas rouge : ' + faux.classe);
      if(faux.badgeTxt.trim() !== A.fiche.memoire[nL - 1][1]) gestes.push('la correction en vert : ' + JSON.stringify(faux.badgeTxt));
      if(!/CALCUL/.test(faux.feedback)) gestes.push('le message ne nomme pas un CALCUL, il dit : ' + faux.feedback.slice(0, 160));
      /* LE BILAN PORTE LA VALEUR VRAIE DE TOUTES LES CASES, MÊME APRÈS L'ERREUR */
      A.fiche.memoire.forEach(r => {
        if(faux.bilan.indexOf(r[0]) < 0 || faux.bilan.indexOf(r[1]) < 0)
          gestes.push('le bilan ne dit pas que ' + r[0] + ' contient ' + r[1] + ' : ' + faux.bilan.slice(0, 160));
      });
      verifier('la ligne « d = c+a », qui lit une case ELLE-MÊME calculée, se corrige en vert avec la vraie valeur, le message NOMME un calcul, et le bilan garde les quatre valeurs vraies malgré l\'erreur',
        !gestes.length, gestes.slice(0, 3).join(' | '));
      verifier('l\'écran du calcul qui en lit un autre ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 6 tricies duodevicies. {python-echange-variables} : échanger deux
       variables, puis EXPLIQUER =====
       Le moteur (papProg, papEtat, papAns, papProgHTML) et la disposition
       (deux colonnes, le nom ÉCRIT, une seule case) sont ceux du 5.15 — déjà
       mesurés ci-dessus — et ne sont pas remesurés ici. Ce que ce banc mesure
       est ce qui est PROPRE au 5.18 : les CINQ lignes du PDF (dont a et b sont
       RÉAFFECTÉS), et la question OUVERTE qui suit le pas à pas, jugée par un
       modèle STUBBÉ — une fois avec un verdict correct, une fois avec un
       verdict faux — puisque aucun juge local ne pourrait remplacer le
       modèle sur une idée en langage naturel (docs/journal/08). Ce numéro
       était « 6 tricies septendecies » (17e), le même 5.17 qu'affichait
       alors cet exercice ; la fusion de main (septembre 2026) a fait
       arriver {python-pas-a-pas-chaine} en premier sur CE numéro — « 6
       tricies septdecies » — et ce bloc a donc pris le suivant, 18e, comme
       l'exercice lui-même est passé de 5.17 à 5.18 (même collision, même
       règle : premier arrivé, premier servi). */
    titre('6 tricies duodevicies. ÉCHANGER DEUX VARIABLES, PUIS EXPLIQUER');
    if(!P.pythonEchangeVariables){
      ignorer('la fiche épinglée se trace ligne par ligne, puis une question OUVERTE se juge par le modèle',
        'ce niveau n\'a pas l\'exercice de l\'échange de deux variables');
    } else {
      const A = P.pythonEchangeVariables, nL = A.fiche.prog.length;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), A.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const dom = c => { const m = String(c).match(/(\d+)\D+(\d+)\D+(\d+)/); if(!m) return ''; const [r, g, b] = [+m[1], +m[2], +m[3]]; return b > r && b > g ? 'bleu' : (r > g && r > b ? 'rouge' : (g > r && g > b ? 'vert' : 'autre')); };
      const dits = [];
      /* 1. LA FICHE ÉPINGLÉE DU PDF, CINQ LIGNES, LE NOM ÉCRIT */
      const vu = await s.page.evaluate(() => {
        const host = document.getElementById('pevHost');
        const lignes = [...host.querySelectorAll('.pyx-ligne')];
        const nm = host.querySelector('.pev-nom'), ve = document.getElementById('pev-val-0');
        return { lignes: lignes.map(e => e.textContent.replace(/\s+/g, ' ').trim()),
                 listes: host.querySelectorAll('select').length,
                 nom: nm ? nm.textContent.trim() : null,
                 case: ve ? ve.tagName : null,
                 cases: host.querySelectorAll('input').length,
                 bilan: !!host.querySelector('.pev-bilan'),
                 exp: !!document.getElementById('pev-exp') };
      });
      if(vu.lignes.length !== nL) dits.push(vu.lignes.length + ' ligne(s) de programme rendues au lieu de ' + nL);
      if(!A.fiche.prog.every((c, i) => (vu.lignes[i] || '').indexOf(c) >= 0))
        dits.push('le programme rendu : ' + JSON.stringify(vu.lignes));
      if(vu.listes) dits.push(vu.listes + ' liste(s) de propositions dans l\'écran : le nom se choisit encore');
      if(vu.nom !== A.fiche.memoire[0][0]) dits.push('le nom de la case écrit par la page : ' + JSON.stringify(vu.nom));
      if(vu.case !== 'INPUT') dits.push('la case de la valeur : ' + JSON.stringify(vu.case));
      if(vu.cases !== 1) dits.push(vu.cases + ' case(s) de saisie au lieu d\'une seule');
      if(vu.bilan) dits.push('le bilan de la mémoire est affiché avant la fin du programme');
      if(vu.exp) dits.push('la question ouverte est affichée avant la fin du pas à pas');
      verifier('la fiche épinglée (a = 10, b = 2, c = a, a = b, b = c) est rendue, avec le nom de la case ÉCRIT et aucune question ouverte avant la fin',
        !dits.length, dits.slice(0, 3).join(' | '));
      /* 2. LES CINQ LIGNES SE TAPENT ET SE JUGENT, a ET b RÉAFFECTÉS COMPRIS */
      for(let k = 0; k < nL; k++){
        await s.page.click('#pev-val-' + k);
        await s.page.keyboard.type(A.fiche.memoire[k][1], { delay: 40 });
        await s.page.waitForTimeout(120);
        await s.page.click('#pevValidate');
        await s.page.waitForTimeout(300);
        if(k < nL - 1){ await s.page.click('#pevStep'); await s.page.waitForTimeout(300); }
      }
      const apres = await s.page.evaluate(() => {
        const host = document.getElementById('pevHost'), b = host.querySelector('.pev-bilan');
        return { score: test.score,
                 bilan: b ? b.textContent.replace(/\s+/g, ' ').trim() : '',
                 exp: !!document.getElementById('pev-exp'),
                 suivant: !!document.getElementById('pevNext'),
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      const lignes = [];
      if(apres.score !== nL) lignes.push('note ' + apres.score + ' après les cinq lignes, au lieu de ' + nL);
      A.fiche.memoire.forEach(r => {
        if(apres.bilan.indexOf(r[0]) < 0 || apres.bilan.indexOf(r[1]) < 0)
          lignes.push('le bilan ne dit pas que ' + r[0] + ' contient ' + r[1] + ' : ' + apres.bilan.slice(0, 160));
      });
      if(!apres.exp) lignes.push('la question ouverte n\'apparaît pas une fois le pas à pas terminé');
      if(apres.suivant) lignes.push('« Question suivante » apparaît avant l\'explication');
      if(apres.page) lignes.push('la page déborde après le bilan');
      verifier('les cinq lignes se jugent (a et b réaffectés compris), le bilan porte la mémoire VRAIE, et la question ouverte succède au pas à pas sans « Question suivante »',
        !lignes.length, lignes.slice(0, 3).join(' | '));
      /* 3. LA QUESTION OUVERTE NOMME LES DEUX CASES ÉCHANGÉES */
      const enonce = await s.page.evaluate(() => (document.querySelector('.pev-exp-q') || {}).textContent || '');
      if(enonce.indexOf(A.fiche.memoire[0][0]) < 0 || enonce.indexOf(A.fiche.memoire[1][0]) < 0)
        verifier('la question ouverte nomme les deux cases échangées', false, 'question : ' + JSON.stringify(enonce));
      else verifier('la question ouverte nomme les deux cases échangées', true, '');
      /* 4. LE MODÈLE STUBBÉ JUGE FAUX, EN ENTRAÎNEMENT : rouge, aucun point,
         mais la question se VERROUILLE quand même — un seul essai suffit en
         entraînement, la règle de {definitions-ensembles} (checkDef), jamais
         de retour en arrière possible une fois le verdict rendu. Le SOUTIEN,
         qui rouvre la question sur un verdict faux, est éprouvé séparément
         plus bas — les deux modes ne se mesurent pas dans la même passe. */
      await s.page.click('#pev-exp');
      await s.page.keyboard.type('je ne sais pas', { delay: 30 });
      const faux = await s.page.evaluate(async () => {
        window.__envoye = null; window.__verdict = false;
        const vrai = sb.functions.invoke.bind(sb.functions);
        sb.functions.invoke = function(nom, opts){
          if(opts && opts.body && opts.body.action === 'verif'){
            window.__envoye = opts.body;
            return Promise.resolve({ data:{ correct: window.__verdict, feedback:'Retour de contrôle faux.' }, error:null });
          }
          return vrai(nom, opts);
        };
        checkPEVExp();
        const attendre = ms => new Promise(r => setTimeout(r, ms));
        for(let i = 0; i < 20 && !window.__envoye; i++) await attendre(50);
        await attendre(150);
        const fb = document.getElementById('pevFeedback'), ta = document.getElementById('pev-exp');
        return { envoye: window.__envoye, fbTxt: (fb || {}).textContent || '', fbClasse: (fb || {}).className || '',
                 fbEncre: fb ? getComputedStyle(fb).color : '', taFige: !!(ta && ta.disabled),
                 suivant: !!document.getElementById('pevNext'), score: test.score, locked: test.locked };
      });
      const gestes = [];
      if(!faux.envoye || faux.envoye.action !== 'verif') gestes.push('rien n\'est parti par l\'action verif : ' + JSON.stringify(faux.envoye));
      else {
        if((faux.envoye.question || '').indexOf(A.fiche.prog.join('\n')) < 0) gestes.push('la question envoyée ne porte pas le programme');
        if(!/ÉCHANG/i.test(faux.envoye.attendu || '')) gestes.push('la règle envoyée ne parle pas d\'échange : ' + (faux.envoye.attendu || '').slice(0, 160));
        if((faux.envoye.reponse || '') !== 'je ne sais pas') gestes.push('la réponse envoyée : ' + JSON.stringify(faux.envoye.reponse));
      }
      if(!/bad/.test(faux.fbClasse) || dom(faux.fbEncre) !== 'rouge') gestes.push('le verdict faux n\'est pas rouge : ' + faux.fbClasse + ' / ' + faux.fbEncre);
      if(!faux.taFige) gestes.push('la case d\'explication reste modifiable alors que la question s\'est verrouillée');
      if(!faux.suivant) gestes.push('« Question suivante » n\'apparaît pas après l\'unique essai d\'entraînement');
      if(faux.score !== nL) gestes.push('note ' + faux.score + ' au lieu de ' + nL + ' après un verdict faux : un essai faux ne doit jamais compter de point');
      if(!faux.locked) gestes.push('la question ne se verrouille pas après l\'unique essai d\'entraînement');
      verifier('un verdict FAUX (modèle stubbé), en ENTRAÎNEMENT, peint le retour en ROUGE, ne compte aucun point, mais verrouille la question dès ce premier essai — la règle de {definitions-ensembles}',
        !gestes.length, gestes.slice(0, 4).join(' | '));
      verifier('l\'écran de l\'échange de deux variables ne lève aucune erreur JavaScript (entraînement)',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
      /* 5. LE SOUTIEN, LUI, ROUVRE LA QUESTION SUR UN VERDICT FAUX — et ne la
         verrouille que sur un verdict JUSTE. Une session neuve, en soutien :
         les cinq lignes doivent être justes pour avancer (la porte du pas à
         pas), donc on y tape directement les valeurs de la fiche. */
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 1000 } });
      await connecter(s.page);
      await s.page.evaluate(id => openTest(id), A.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="soutien"]');
      await s.page.waitForTimeout(900);
      for(let k = 0; k < nL; k++){
        await s.page.click('#pev-val-' + k);
        await s.page.keyboard.type(A.fiche.memoire[k][1], { delay: 40 });
        await s.page.waitForTimeout(120);
        await s.page.click('#pevValidate');
        await s.page.waitForTimeout(300);
        if(k < nL - 1){ await s.page.click('#pevStep'); await s.page.waitForTimeout(300); }
      }
      await s.page.click('#pev-exp');
      await s.page.keyboard.type('je ne sais pas', { delay: 30 });
      const rouvre = await s.page.evaluate(async () => {
        window.__envoye = null; window.__verdict = false;
        const vrai = sb.functions.invoke.bind(sb.functions);
        sb.functions.invoke = function(nom, opts){
          if(opts && opts.body && opts.body.action === 'verif'){
            window.__envoye = opts.body;
            return Promise.resolve({ data:{ correct: window.__verdict, feedback:'Retour de contrôle faux.' }, error:null });
          }
          return vrai(nom, opts);
        };
        checkPEVExp();
        const attendre = ms => new Promise(r => setTimeout(r, ms));
        for(let i = 0; i < 20 && !window.__envoye; i++) await attendre(50);
        await attendre(150);
        const fb = document.getElementById('pevFeedback'), ta = document.getElementById('pev-exp');
        return { fbClasse: (fb || {}).className || '', fbEncre: fb ? getComputedStyle(fb).color : '',
                 taFige: !!(ta && ta.disabled), suivant: !!document.getElementById('pevNext'),
                 score: test.score, locked: test.locked };
      });
      const rGestes = [];
      if(!/bad/.test(rouvre.fbClasse) || dom(rouvre.fbEncre) !== 'rouge') rGestes.push('le verdict faux n\'est pas rouge : ' + rouvre.fbClasse + ' / ' + rouvre.fbEncre);
      if(rouvre.taFige) rGestes.push('la case d\'explication se verrouille en SOUTIEN sur un verdict faux');
      if(rouvre.suivant) rGestes.push('« Question suivante » apparaît en SOUTIEN alors que le verdict est faux');
      if(rouvre.score !== nL) rGestes.push('note ' + rouvre.score + ' au lieu de ' + nL + ' après un verdict faux');
      if(rouvre.locked) rGestes.push('la question se verrouille en SOUTIEN alors que le verdict est faux');
      verifier('en SOUTIEN, un verdict FAUX (modèle stubbé) rougit le retour SANS verrouiller la question ni montrer « Question suivante » — l\'élève reprend',
        !rGestes.length, rGestes.slice(0, 4).join(' | '));
      /* puis un verdict JUSTE referme la porte : vert, un point, la suite */
      const juste = await s.page.evaluate(async () => {
        window.__envoye = null; window.__verdict = true;
        const ta = document.getElementById('pev-exp');
        if(ta) ta.value = 'les cases a et b ont échangé leurs valeurs';
        checkPEVExp();
        const attendre = ms => new Promise(r => setTimeout(r, ms));
        for(let i = 0; i < 20 && !window.__envoye; i++) await attendre(50);
        await attendre(150);
        const fb = document.getElementById('pevFeedback');
        return { fbClasse: (fb || {}).className || '', fbEncre: fb ? getComputedStyle(fb).color : '',
                 taFige: !!(ta && ta.disabled), suivant: !!document.getElementById('pevNext'),
                 score: test.score, locked: test.locked,
                 page: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      const bons = [];
      if(!/good/.test(juste.fbClasse) || dom(juste.fbEncre) !== 'vert') bons.push('le verdict juste n\'est pas vert : ' + juste.fbClasse + ' / ' + juste.fbEncre);
      if(!juste.taFige) bons.push('la case d\'explication ne se verrouille pas alors que le verdict est juste');
      if(!juste.suivant) bons.push('« Question suivante » n\'apparaît pas alors que le verdict est juste');
      if(juste.score !== nL + 1) bons.push('note ' + juste.score + ' au lieu de ' + (nL + 1) + ' après un verdict juste');
      if(!juste.locked) bons.push('la question ne se verrouille pas alors que le verdict est juste');
      if(juste.page) bons.push('la page déborde après le verdict');
      verifier('en SOUTIEN, un verdict JUSTE (modèle stubbé) peint le retour en VERT, ajoute un point, verrouille la question et affiche « Question suivante »',
        !bons.length, bons.slice(0, 4).join(' | '));
      verifier('l\'écran de l\'échange de deux variables ne lève aucune erreur JavaScript (soutien)',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 8. le menu en deux étages ===== */
    /* Un thème découpé en parties ne montre plus ses exercices sur sa page :
       elle pose une carte par partie (3.1, 3.2, …) et les exercices s'ouvrent
       sur la page de la partie choisie. Rien de tout cela ne se voit d'une
       lecture du fichier : une carte sans onclick, un écran manquant de la
       liste de show(), un retour qui saute un étage — tout passe au vert. Le
       banc clique donc les deux étages comme le ferait un élève, et repart
       en arrière. */
    titre('8. LE MENU EN DEUX ÉTAGES');
    if(!P.menu){
      ignorer('le thème s\'ouvre sur ses parties, puis sur ses exercices',
        'aucun thème de ce niveau n\'est découpé en parties');
    } else {
      s = await ouvrir(chromium, ml);
      const entre = await connecter(s.page);
      verifier('l\'élève entre dans son espace', entre === 'scr-space', 'écran : ' + entre);

      await s.page.evaluate(() => openThemes());
      await s.page.waitForSelector('#testChoices .themecard', { timeout: 10000 });
      await s.page.click('#testChoices [onclick="openTheme(' + P.menu.theme + ')"]');
      await s.page.waitForTimeout(300);
      const etage1 = await s.page.evaluate(() => ({
        ecran: ([...document.querySelectorAll('section.screen')].find(x => x.classList.contains('on')) || {}).id,
        parties: [...document.querySelectorAll('#themeChoices .themecard')]
          .map(b => (b.querySelector('.ttl') || {}).textContent || ''),
        exercices: document.querySelectorAll('#themeChoices [onclick^="openTest"]').length,
      }));
      verifier('la page du thème s\'ouvre', etage1.ecran === 'scr-theme', 'écran : ' + etage1.ecran);
      verifier('elle montre une carte par partie, et aucun exercice',
        etage1.parties.length === P.menu.parties && etage1.exercices === 0,
        etage1.parties.length + ' partie(s) attendues ' + P.menu.parties + ', ' + etage1.exercices + ' exercice(s) affichés');
      verifier('chaque partie s\'annonce par son numéro',
        etage1.parties.length > 0 && etage1.parties.every((t, i) => t.indexOf(P.menu.theme + '.' + (i + 1) + ' :') === 0),
        etage1.parties.join(' | '));

      await s.page.click('#themeChoices .themecard');            /* la partie .1 */
      await s.page.waitForTimeout(300);
      const etage2 = await s.page.evaluate(() => ({
        ecran: ([...document.querySelectorAll('section.screen')].find(x => x.classList.contains('on')) || {}).id,
        titre: ((document.getElementById('sousThemeTitle') || {}).textContent || ''),
        exercices: [...document.querySelectorAll('#sousThemeChoices [onclick^="openTest"]')]
          .map(b => b.getAttribute('onclick')),
      }));
      verifier('la page de la partie s\'ouvre', etage2.ecran === 'scr-soustheme', 'écran : ' + etage2.ecran);
      verifier('elle porte le numéro et le nom de la partie',
        etage2.titre.indexOf(P.menu.theme + '.1 : ') === 0, 'titre : « ' + etage2.titre + ' »');
      verifier('elle montre les exercices de cette partie, et eux seuls',
        etage2.exercices.length > 0 && etage2.exercices.some(o => o.indexOf("'" + P.menu.exercice + "'") >= 0),
        etage2.exercices.length + ' exercice(s) : ' + etage2.exercices.join(' | '));

      await s.page.click('#sousThemeRetour');                    /* « ← Thème 3 » */
      await s.page.waitForTimeout(300);
      verifier('le retour ramène à la page du thème', await ecranVisible(s.page) === 'scr-theme',
        'écran : ' + await ecranVisible(s.page));

      /* Et une fois l'exercice quitté, l'élève doit retomber sur la page de sa
         partie — pas sur celle du thème, qui lui redemanderait de choisir. */
      await s.page.evaluate(id => openTest(id), P.menu.exercice);
      await s.page.waitForTimeout(400);
      await s.page.evaluate(() => retourChoix());
      await s.page.waitForTimeout(1200);
      verifier('quitter l\'exercice ramène sur la page de sa partie',
        await ecranVisible(s.page) === 'scr-soustheme', 'écran : ' + await ecranVisible(s.page));
      verifier('la navigation n\'a levé aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ===== 9. L'AIDE EST ATTEIGNABLE SUR CHAQUE EXERCICE =====
       « Le plus petit ensemble » (Seconde) construisait ses boutons à part,
       et cette fonction-là avait oublié « Poser une question à l'IA » et le
       rappel de cours — elle ne rendait même rien hors du soutien. L'exercice
       était le seul du niveau sans aucune aide, alors que sa fiche QIA_SUGG,
       son contexte et son rappel existaient déjà : l'aide était écrite, rien
       n'y menait.
       Aucun contrôle statique ne pouvait le voir. Le banc de tests vérifie
       qu'une entrée QIA_SUGG existe, pas qu'un bouton l'atteint ; et un écran
       a parfaitement le droit de poser son bouton lui-même, comme le fait
       « Lecture graphique ». Seul l'écran dit la vérité : on OUVRE chaque
       exercice et on regarde ce qui s'affiche. */
    titre('9. L\'AIDE EST ATTEIGNABLE SUR CHAQUE EXERCICE');
    s = await ouvrir(chromium, ml);
    if(await connecter(s.page) !== 'scr-space'){
      ignorer('le bouton d\'aide IA est présent sur chaque exercice',
        'connexion impossible — rien à mesurer');
    } else {
      /* La liste des exercices se lit dans TEST_NUM et non dans THEMES : un
         thème découpé en parties porte ses identifiants dans « sous », pas
         dans « ids » (la Première en a quatre). Parcourir THEMES à plat y
         donnerait un « undefined » par thème découpé — openTest(undefined)
         ouvrirait n'importe quoi. TEST_NUM est construit des deux formes. */
      const tous = await s.page.evaluate(() => Object.keys(TEST_NUM));
      /* Les exercices chronométrés n'ont pas d'aide IA, et c'est voulu : voir
         « aideIA.sans » dans tests/profils.js. On les nomme à l'écran plutôt
         que de les taire — un manque silencieux finit par se croire normal. */
      const exemptes = (P.aideIA && P.aideIA.sans) || [];
      const inconnus = exemptes.filter(id => tous.indexOf(id) < 0);
      const ids = tous.filter(id => exemptes.indexOf(id) < 0);
      const sans = [], sansMode = [], accolades = [], gabarits = [], petites = [], dechires = [], tetes = [], sansClavier = [], videsRouges = [], etroits = [], surCourbe = [];
      const indicesPlats = []; let nIndicesFlex = 0;
      const sansClavierLim = []; let nLimCases = 0;
      const avecTables = new Set(), sansTables = new Set();
      for(const id of ids){
        for(const mode of ['train', 'soutien']){
          /* La rangée GÉNÉRIQUE survit aux redessins d'un écran PARTAGÉ : le
             2.1 la posait pour toute la famille des dérivées, et le 2.2 —
             dont le rendu n'était pas enveloppé — passait au vert sans avoir
             gagné la sienne. Un élève qui arrive DIRECTEMENT au 2.2 n'a rien
             (signalé par Turquet, capture, août 2026). On la retire donc avant
             chaque exercice : chacun doit la faire naître lui-même. */
          await s.page.evaluate(() => document.querySelectorAll('.pm-jetons').forEach(x => x.remove()));
          await s.page.evaluate(i => openTest(i), id);
          await s.page.waitForTimeout(300);
          /* Le mode se choisit sur sa carte. On lit l'attribut plutôt qu'un
             sélecteur : « [onclick*="train"] » attraperait aussi la carte
             « Reprendre l'entraînement » d'une pause. */
          const pris = await s.page.evaluate(m => {
            const b = [...document.querySelectorAll('#modeChoices button')]
              .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='" + m + "'") >= 0);
            if(b){ b.click(); return true; } return false;
          }, mode);
          if(!pris){ sansMode.push(id + '/' + mode); continue; }
          await s.page.waitForTimeout(650);
          /* Certains exercices n'ouvrent pas directement leur écran : les
             tables et le calcul mental passent par un « Commencer », le signe
             du second degré par un choix de niveau, {python-completer} par son
             COURS et l'exemple qu'on y exécute. Mesurer là revenait à
             constater l'absence de boutons d'aide sur un écran de départ — le
             contrôle criait sur quatre exercices parfaitement corrects. On
             franchit donc ces écrans avant de regarder. */
          for(let hop = 0; hop < 3; hop++){
            const passe = await s.page.evaluate(() => {
              const on = document.querySelector('section.screen.on');
              if(!on) return false;
              const visible = e => {
                if(!e || e.hidden) return false;
                const r = e.getBoundingClientRect();
                return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none';
              };
              const b = [...on.querySelectorAll('button')].filter(visible)
                .find(x => !x.disabled && /^(Commencer|Démarrer|C'est parti|Niveau 1|J’ai compris)/.test(x.textContent.trim()));
              if(b){ b.click(); return true; }
              /* {python-completer} ouvre sur son COURS, et sa porte ne s'ouvre
                 qu'une fois l'exemple exécuté (demande de Turquet, septembre
                 2026) : on lance l'exemple, et le tour suivant franchit
                 « J'ai compris ». On vise le bouton de l'EXEMPLE et lui seul —
                 celui de l'exercice dit « le programme », pas « l'exemple ». */
              const r = [...on.querySelectorAll('button')].filter(visible)
                .find(x => !x.disabled && /exemple/i.test(x.textContent) && /^▶/.test(x.textContent.trim()));
              if(r){ r.click(); return true; }
              return false;
            });
            if(!passe) break;
            await s.page.waitForTimeout(700);
          }
          const vu = await s.page.evaluate(() => {
            const on = document.querySelector('section.screen.on');
            if(!on) return {ia: false, ecran: '(aucun)'};
            const visible = e => {
              if(!e || e.hidden) return false;
              const r = e.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none';
            };
            const textes = [...on.querySelectorAll('button')].filter(visible).map(b => b.textContent);
            /* Un « {identifiant} » resté à l'écran est une référence que
               numeros() n'a pas résolue : l'élève lit l'accolade au lieu du
               numéro. numeros() ne passe que par cardHTML, rappelHTML et le
               contexte du modèle — un innerHTML posé par un rendu y échappe. */
            const brut = (on.textContent || '').match(/\{[a-z0-9-]+\}/g) || [];
            const connus = brut.filter(m => TESTS[m.slice(1, -1)]);
            /* ET AUCUN GABARIT NON INTERPRÉTÉ NE DOIT ATTEINDRE L'ÉLÈVE.
               Une expression « ${…} » écrite dans une chaîne à guillemets
               SIMPLES n'est pas interpolée : elle s'affiche en toutes lettres.
               Payé comptant — le 1.6 a servi « ${fEq(` » autour de sa case
               pendant une mise en ligne, et aucun contrôle ne l'a vu : la case
               existait (innerHTML l'avait bien construite), le verdict était
               juste, seul le TEXTE autour était du code. Le contrôle des
               accolades d'à côté ne visait que les {identifiant} connus.
               On mesure ICI, sur tous les exercices visités, dans les deux
               modes : celui qu'on écrira demain est couvert sans rien
               déclarer. */
            const gabarits = [...new Set(((on.textContent || '')
              .match(/\$\{[^}]{0,40}\}?|`\)\}/g) || []).map(x => x.slice(0, 30)))];
            /* Une case où l'élève écrit s'écrit à la MÊME TAILLE que les nombres
               qui l'entourent (décision de Turquet, août 2026, valable pour tout
               exercice à saisie) : une case plus petite fait passer la réponse de
               l'élève pour une note en bas de page au milieu du calcul.
               « Autour » se mesure, et il a fallu deux essais pour le dire juste.
               Le premier prenait n'importe quel chiffre d'un ancêtre proche : il
               attrapait ceux du panneau d'à côté (la multiplication posée) et
               accusait des écrans parfaitement corrects. Un nombre est « autour »
               s'il partage la LIGNE de la case — recouvrement vertical — ET s'il
               est À CÔTÉ : au-delà de 120 px de vide horizontal, c'est un autre
               bloc, pas un voisin. */
            const px = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
            /* UN NOMBRE ÉCRIT PAR LA PAGE N'EST PAS TOUJOURS UN NOMBRE NU.
               Le premier relevé n'acceptait que « 90 » ou « 1,5 » : au 2.5.3 de
               la Première, les voisins d'une case s'écrivent « 1 + », « 1 + 0, »
               et « 1, » — la page y posait des cases à 1,05 rem devant des
               nombres à 2 rem, et le contrôle passait au vert en regardant
               ailleurs (signalé en mesurant la chaîne de tablette, septembre
               2026). On accepte donc un morceau COURT qui porte un chiffre et
               aucune lettre : le signe et la virgule qui l'accompagnent font
               partie du calcul écrit, pas d'un autre bloc. Les étiquettes
               (« Question 1 / 4 ») portent des lettres, et ce qui vit ailleurs
               à l'écran est déjà écarté par la ligne partagée et les 120 px. */
            const chiffres = [...on.querySelectorAll('*')].filter(x => x.children.length === 0
              && !x.closest('math-field')
              && (function(t){ return t.length <= 12 && /\d/.test(t) && !/\p{L}/u.test(t); })((x.textContent || '').trim())
              && x.getBoundingClientRect().width > 0);
            const cases = [];
            for(const mf of [...on.querySelectorAll('math-field')].filter(visible)){
              const r = mf.getBoundingClientRect();
              const voisins = chiffres.filter(x => {
                const q = x.getBoundingClientRect();
                if(Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) <= Math.min(r.height, q.height) * 0.5) return false;
                return Math.max(0, Math.max(r.left, q.left) - Math.min(r.right, q.right)) <= 120;
              });
              if(!voisins.length) continue;
              const gros = Math.max(...voisins.map(px));
              if(px(mf) < gros * 0.9)
                cases.push((mf.id || '(sans id)') + ' : ' + px(mf) + 'px contre ' + gros + 'px');
            }
            /* UN SIGNE POSÉ À CÔTÉ D'UNE FRACTION TOMBE SUR SON TRAIT.
               En texte ordinaire, « vertical-align:middle » place chaque terme
               selon SA hauteur : un « + » d'un étage et une fraction de deux
               n'ont pas le même milieu, et le signe monte au-dessus du trait.
               {somme-fractions} l'avait appris en août 2026 — sa ligne d'énoncé
               était passée en rangée flex centrée —, et le défaut est revenu
               tel quel sur l'écran suivant, qui n'avait pas reçu la règle :
               signalé par Turquet, sur une capture. Une leçon apprise dans un
               coin ne protège pas les autres, donc on mesure ICI, sur TOUS les
               exercices visités : celui qu'on ajoutera demain est couvert sans
               rien déclarer.
               « À côté » se mesure comme pour la taille des cases : le signe
               doit chevaucher la fraction en hauteur et n'en être séparé que
               par moins de 120 px de vide. */
            const mil = e => { const r = e.getBoundingClientRect(); return (r.top + r.bottom) / 2; };
            const signes = [];
            for(const frac of [...on.querySelectorAll('.sf-f')].filter(visible)){
              const bar = frac.querySelector('.bar'); if(!bar) continue;
              const rf = frac.getBoundingClientRect();
              for(const sg of [...on.querySelectorAll('.f-times, .f-eq, b')].filter(visible)){
                if(!/^[+−=]$/.test((sg.textContent || '').trim())) continue;
                if(sg.closest('math-field')) continue;
                const rs = sg.getBoundingClientRect();
                if(Math.min(rf.bottom, rs.bottom) - Math.max(rf.top, rs.top) <= Math.min(rf.height, rs.height) * 0.5) continue;
                if(Math.max(0, Math.max(rf.left, rs.left) - Math.min(rf.right, rs.right)) > 120) continue;
                const d = Math.round(Math.abs(mil(sg) - mil(bar)) * 10) / 10;
                if(d > 3) signes.push('« ' + sg.textContent.trim() + ' » à ' + d + 'px du trait');
              }
            }
            /* LE CALCUL ÉCRIT EN TÊTE DE RANGÉE A LA TAILLE DE LA RANGÉE
               (demande de Turquet, août 2026) : « .f-frac » vaut 1,45 rem
               partout ailleurs, et les fractions de l'énoncé se lisaient comme
               une note de bas de page devant des cases à 1,9 rem. Le 4.1 avait
               reçu le réglage, pas les quatre autres écrans — une leçon
               apprise dans un coin ne protège pas les autres, donc on mesure
               ICI, sur TOUS les exercices visités : toute fraction posée en
               enfant direct d'une rangée doit être au moins aussi grande que
               les cases de cette rangée. */
            const debuts = [];
            for(const row of on.querySelectorAll('.pt-row')){
              /* Depuis que le « = » et sa case forment un groupe (.f-grp), une
                 fraction du calcul peut vivre un cran plus bas : ne regarder
                 que les enfants DIRECTS de la rangée en laisserait passer la
                 moitié, et le contrôle mesurerait moins en restant vert. */
              const enfants = [...row.children].flatMap(c =>
                (c.classList && c.classList.contains('f-grp')) ? [...c.children] : [c]);
              const fracs = enfants.filter(c => c.classList && c.classList.contains('f-frac')).filter(visible);
              const mfs = [...row.querySelectorAll('math-field')].filter(visible);
              if(!fracs.length || !mfs.length) continue;
              const boxPx = Math.max(...mfs.map(px));
              for(const f of fracs){
                if(px(f) < boxPx) debuts.push('fraction du calcul à ' + px(f) + 'px contre des cases à ' + boxPx + 'px');
              }
            }
            /* LE CLAVIER MATHÉMATIQUE EST ATTEIGNABLE SUR TOUT ÉCRAN À CHAMP
               MATHÉMATIQUE. Huit exercices de la Terminale n'offraient aucun
               bouton — chaque famille posait sa rangée dans son coin, et les
               autres restaient nues ; sur tablette, l'indice « clic droit »
               ne mène nulle part (signalé par Turquet, août 2026). On mesure
               ICI, sur tous les exercices visités : celui qu'on ajoutera
               demain est couvert sans rien déclarer. */
            /* AUCUNE ÉTIQUETTE DE COURBE NE TOMBE SUR SA COURBE (signalé par
               Turquet sur une capture du 5.4, septembre 2026 : « Cf′ » posée en
               travers de la courbe de f′). Toute étiquette « Cf », « Cf′ », « Cg »
               d'un dessin visible est mesurée contre les courbes RENDUES du même
               dessin : on parcourt chaque chemin de courbe au pas de 1,5 px et
               aucun point ne doit tomber dans la boîte du texte (rognée d'un
               pixel — un contact au bord n'est pas une superposition). Sur tous
               les exercices visités : l'exercice ajouté demain est couvert. */
            const etiquettes = [];
            for(const svg of on.querySelectorAll('svg')){
              if(!visible(svg)) continue;
              const labs = [...svg.querySelectorAll('text.lv-cf, text.sv-cf, text.eqg-cg')].filter(visible);
              const courbes = [...svg.querySelectorAll('path[class*="curve"], path[class*="courbe"], path.eqg-g, line.eqg-g')];
              for(const t of labs){
                const b = t.getBoundingClientRect(); let touche = 0;
                for(const p of courbes){
                  let L = 0; try{ L = p.getTotalLength(); }catch(e){ continue; }
                  const M = p.getScreenCTM(); if(!M) continue;
                  for(let d = 0; d <= L; d += 1.5){
                    const q = p.getPointAtLength(d), X = M.a * q.x + M.c * q.y + M.e, Y = M.b * q.x + M.d * q.y + M.f;
                    if(X >= b.left + 1 && X <= b.right - 1 && Y >= b.top + 1 && Y <= b.bottom - 1) touche++;
                  }
                }
                if(touche) etiquettes.push('« ' + t.textContent.replace(/\s+/g, '') + ' » posée sur sa courbe (' + touche + ' point(s) de la courbe dans la boîte du texte)');
              }
            }
            const champsMaths = [...on.querySelectorAll('math-field')].filter(visible).length > 0;
            /* UN INDICE POSÉ NU DANS UN CONTENEUR FLEX REMONTE SUR SA LIGNE.
               Un <sub> ou un <sup> enfant DIRECT d'un conteneur flex en devient
               un ITEM : la spécification y IGNORE vertical-align — l'indice se
               pose sur la ligne de la lettre — et le gap du conteneur l'en
               écarte par-dessus le marché, si bien que « Uₙ » se lit « U n » et
               « eˣ » « e x », c'est-à-dire autre chose (signalé par Turquet,
               septembre 2026, sur le 6.13 ; mesuré : 59 indices sur DIX
               exercices, le 6.13 n'en étant que le plus visible). La page rend
               sa place à ces indices-là ; on EXIGE ici qu'elle le fasse, sur
               tous les exercices visités et sur les trois niveaux — celui qu'on
               écrira demain rougit s'il pose un indice dans un conteneur que la
               règle ne couvre pas encore. On mesure la RÈGLE EN USAGE, jamais
               la feuille de styles : une règle écrite mais perdue dans la
               cascade laisserait le contrôle vert, le piège du 2.1.2. */
            const indices = []; let nIndices = 0;
            for(const sb of [...on.querySelectorAll('sub,sup')]){
              const pa = sb.parentElement;
              if(!pa || !visible(sb)) continue;
              const cp = getComputedStyle(pa);
              if(!/flex/.test(cp.display)) continue;
              nIndices++;
              const cs = getComputedStyle(sb);
              const dec = parseFloat(sb.tagName === 'SUB' ? cs.top : cs.bottom);
              const gap = parseFloat(cp.columnGap) || 0;
              const mg = parseFloat(cs.marginInlineStart || cs.marginLeft) || 0;
              const quoi = (pa.className || pa.tagName).toString().split(' ')[0]
                + ' : « ' + (sb.textContent || '').trim().slice(0, 8) + ' »';
              if(cs.position !== 'relative' || !(dec > 0))
                indices.push(quoi + ' — posé sur la ligne de sa lettre');
              else if(gap > 0 && Math.abs(mg + gap) > 0.5)
                indices.push(quoi + ' — écarté de sa lettre de ' + gap + 'px par le gap');
            }
            const boutonClavier = [...on.querySelectorAll('button')].filter(visible)
              .some(b => /clavier math/i.test(b.getAttribute('title') || ''));
            /* UN ÉCRAN QUI POSE UNE LIMITE OFFRE LE CLAVIER DU 3.5 — ∞ et ⟶
               sur son CLAVIER A (demande de Turquet, septembre 2026 : « pour
               les cases où on doit déterminer des limites, je veux le même
               clavier que dans l'exercice 3.5 »). La disposition vit dans la
               greffe module, que jsdom ne charge pas : seul un navigateur la
               lit. On mesure ICI, sur tous les exercices visités — celui qu'on
               posera demain est couvert sans rien déclarer. */
            const limCases = [...on.querySelectorAll('math-field.lim-mf')].filter(visible).length;
            let limKb = null;
            if(limCases){
              try{
                const vk = window.mathVirtualKeyboard;
                const l0 = vk && vk.layouts && vk.layouts[0] && vk.layouts[0].layers && vk.layouts[0].layers[0];
                const touches = l0 ? [].concat.apply([], l0.rows || []).map(k => String((k && (k.latex || k.insert || k.label)) || '')) : [];
                limKb = { infini: touches.indexOf('\\infty') >= 0,
                          vers: touches.indexOf('\\longrightarrow') >= 0, n: touches.length };
              }catch(e){ limKb = { infini: false, vers: false, n: 0 }; }
            }
            return {ia: textes.some(t => /question .* l.IA/i.test(t)), ecran: on.id,
                    clavier: !champsMaths || boutonClavier,
                    /* LE BOUTON DES TABLES N'EST PROPOSÉ QUE LÀ OÙ IL SERT.
                       On relève ce qui est AFFICHÉ, exercice par exercice ; la
                       liste attendue vit dans tests/profils.js et la page a la
                       sienne. Deux sources, donc un vrai contrôle : si elles
                       divergent, ça rougit. */
                    tables: [...on.querySelectorAll('.tables-btn')].filter(visible).length > 0,
                    /* LE CADRE D'UN EXERCICE PREND TOUTE LA LARGEUR. La
                       Seconde bridait quinze écrans à 600 px quand la fenêtre
                       en offrait 1360 (signalé par Turquet, septembre 2026) ;
                       le contrôle d'à côté ne mesurait que le .wrap, qui était
                       large — il restait donc vert sur un cadre étroit. On
                       mesure le CADRE, et sur tous les exercices : celui qu'on
                       ajoutera demain est couvert sans rien déclarer. */
                    cadre: (function(){ const c=on.querySelector('.card'), w=document.querySelector('.wrap');
                      if(!c||!w) return null;
                      /* la largeur DISPONIBLE, rembourrage déduit : comparer à
                         la boîte extérieure accusait la Terminale, dont le
                         conteneur porte une gouttière voulue. */
                      const cs=getComputedStyle(w);
                      return { c:Math.round(c.getBoundingClientRect().width),
                               w:Math.round(w.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) }; })(),
                    accolades: [...new Set(connus)], gabarits: gabarits, cases: cases, signes: [...new Set(signes)],
                    debuts: [...new Set(debuts)], etiquettes: etiquettes,
                    indices: [...new Set(indices)], nIndices: nIndices,
                    limCases: limCases, limKb: limKb};
          });
          if(!vu.ia) sans.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + mode + ')');
          (vu.tables ? avecTables : sansTables).add(id);
          if(vu.accolades.length) accolades.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' : ' + vu.accolades.join(' '));
          if(vu.gabarits && vu.gabarits.length) gabarits.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + mode + ') : ' + vu.gabarits.join(' '));
          /* 8 px de marge : on compare à la largeur DISPONIBLE, donc un cadre
             plein vaut exactement celle-ci, aux arrondis près. */
          if(mode === 'train' && vu.cadre && vu.cadre.c < vu.cadre.w - 8)
            etroits.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' — ' + vu.cadre.c + ' px dans ' + vu.cadre.w);
          if(mode === 'train' && vu.cases && vu.cases.length)
            petites.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' — ' + vu.cases[0]);
          if(mode === 'train' && vu.signes && vu.signes.length)
            dechires.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' — ' + vu.signes[0]);
          if(mode === 'train' && vu.debuts && vu.debuts.length)
            tetes.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' — ' + vu.debuts[0]);
          if(mode === 'train' && vu.clavier === false)
            sansClavier.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + vu.ecran + ')');
          if(vu.etiquettes && vu.etiquettes.length)
            surCourbe.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + mode + ') — ' + vu.etiquettes[0]);
          nLimCases += (vu.limCases || 0);
          if(vu.limKb && !(vu.limKb.infini && vu.limKb.vers))
            sansClavierLim.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + mode + ') — '
              + (vu.limKb.n ? ('clavier A de ' + vu.limKb.n + ' touches, sans ' + (vu.limKb.infini ? '⟶' : '∞')) : 'aucune disposition installée'));
          nIndicesFlex += (vu.nIndices || 0);
          if(vu.indices && vu.indices.length)
            indicesPlats.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + mode + ') — ' + vu.indices[0]);
          /* UNE CASE VIDE NE ROUGIT JAMAIS — sur TOUS les exercices.
             C'est la règle que la Seconde a réapprise trois fois en une seule
             journée d'août 2026, chaque fois sur un exercice différent, et
             chaque fois corrigée dans son coin. Une règle valable partout doit
             être tenue par un contrôle qui va PARTOUT : on clique « Vérifier »
             sur une copie entièrement vide, et aucune case ne doit être rouge.
             Rouge veut dire FAUX ; une case que l'élève n'a pas remplie n'est
             pas une erreur de calcul, elle reçoit la correction en bleu. */
          if(mode === 'train' && (!P.casesVides || (P.casesVides.sans || []).indexOf(id) < 0)){
            const r = await s.page.evaluate(() => {
              const on = document.querySelector('section.screen.on'); if(!on) return null;
              const visible = e => { if(!e || e.hidden) return false;
                const q = e.getBoundingClientRect();
                return q.width > 0 && q.height > 0 && getComputedStyle(e).display !== 'none'; };
              const b = [...on.querySelectorAll('button')].filter(visible)
                .find(x => /^(Vérifier|Valider|Corriger)/.test(x.textContent.trim()));
              if(!b) return null;
              b.click();
              return true;
            });
            if(r){
              await s.page.waitForTimeout(500);
              const rouges = await s.page.evaluate(() => {
                const on = document.querySelector('section.screen.on'); if(!on) return [];
                return [...on.querySelectorAll('.bad')]
                  .filter(e => /^(MATH-FIELD|INPUT|SELECT)$/.test(e.tagName))
                  .map(e => e.id || '(sans id)');
              });
              if(rouges.length)
                videsRouges.push((await s.page.evaluate(i => TEST_NUM[i], id))
                  + ' — ' + rouges.slice(0, 3).join(', '));
            }
          }
        }
      }
      verifier('les cases de saisie ont la taille des nombres qui les entourent',
        petites.length === 0, petites.slice(0, 3).join(' | '));
      verifier('un signe posé à côté d\'une fraction tombe sur son trait',
        dechires.length === 0, dechires.slice(0, 3).join(' | '));
      verifier('le calcul en tête de rangée s\'écrit à la taille de sa rangée',
        tetes.length === 0, tetes.slice(0, 3).join(' | '));
      verifier('le clavier mathématique est atteignable sur tout écran à champ mathématique',
        sansClavier.length === 0, sansClavier.join(', ') + ' — aucun bouton « Clavier mathématique »');
      /* ET UN ÉCRAN QUI POSE UNE LIMITE OFFRE LE CLAVIER DU 3.5 : ∞ et ⟶ sur
         son clavier A. Son bord OPPOSÉ est le garde « ce contrôle ne mesure
         rien » — le niveau qui déclare des cases de limite doit en offrir au
         banc ; celui qui n'en déclare pas s'affiche « non applicable » plutôt
         que d'être tu. */
      verifier('le clavier du 3.5 s\'ouvre sur tout écran qui pose une limite (∞ et ⟶ sur le clavier A)',
        sansClavierLim.length === 0, sansClavierLim.slice(0, 3).join(' | '));
      if(P.casesLimite)
        verifier('des cases de limite sont bien posées (le contrôle du clavier mesure quelque chose)',
          nLimCases > 0, nLimCases + ' case(s) de limite relevée(s) sur toute la visite');
      else
        ignorer('des cases de limite sont bien posées (le contrôle du clavier mesure quelque chose)',
          'ce niveau ne pose aucune case de limite');
      /* Une étiquette de courbe posée SUR sa courbe se lit barrée (capture de
         Turquet, 5.4, septembre 2026) : mesurée ici sur toute étiquette de tout
         dessin visité, contre les courbes RENDUES. */
      /* le COMPTE et la liste ENTIÈRE des exercices touchés (numéro et étiquette), pas
         trois cas : un quatrième resterait caché derrière les trois premiers */
      /* le COMPTE et la liste : un onzième exercice resterait caché derrière
         les dix premiers, et « un contrôle qui dit moins que ce qu'il sait
         fait croire qu'on a fini ». */
      verifier('aucun indice ne remonte sur la ligne de sa lettre',
        indicesPlats.length === 0, indicesPlats.length + ' cas — ' + indicesPlats.slice(0, 3).join(' | '));
      /* LE BORD OPPOSÉ : un contrôle qui n'a rien à mesurer ne mesure rien, et
         doit le dire. Le niveau qui DÉCLARE poser des indices dans un flex doit
         en offrir au banc ; celui qui n'en déclare pas s'affiche « non
         applicable » plutôt que d'être tu. */
      if(P.indicesEnFlex)
        verifier('des indices sont bien posés dans un conteneur flex (le contrôle mesure quelque chose)',
          nIndicesFlex > 0, nIndicesFlex + ' indice(s) relevé(s) sur toute la visite');
      else
        ignorer('aucun indice ne remonte sur la ligne de sa lettre',
          'ce niveau ne déclare aucun indice posé dans un conteneur flex (mesuré : ' + nIndicesFlex + ')');
      verifier('aucune étiquette de courbe ne tombe sur sa courbe',
        surCourbe.length === 0, surCourbe.length + ' cas — ' + surCourbe.slice(0, 2).join(' | ')
          + ' — exercices : ' + [...new Set(surCourbe.map(c => c.replace(/ \((train|soutien)\).*« (.+?) ».*/, ' $2')))].join(', '));
      /* Le COMPTE d'abord : la liste était tronquée à quatre, et un cinquième
         exercice fautif est resté caché derrière les quatre premiers jusqu'à
         ce qu'ils soient corrigés. Un contrôle qui dit moins que ce qu'il sait
         fait croire qu'on a fini. */
      /* Ce qui est DÉCLARÉ est nommé à l'écran, jamais tu : un contrôle qui
         saute des exercices en silence rend le banc vert sur ce qu'il ne
         vérifie plus. */
      const dispenses = (P.casesVides && P.casesVides.sans) || [];
      verifier('aucune case laissée vide ne rougit à la vérification',
        videsRouges.length === 0,
        videsRouges.length + ' exercice(s) : ' + videsRouges.slice(0, 6).join(' | '));
      if(dispenses.length && !videsRouges.length)
        console.log('   · ' + dispenses.length + ' exercice(s) déclarés hors de ce contrôle : '
          + dispenses.join(', '));
      /* LE BOUTON DES TABLES : proposé là où il y a un calcul mental à faire,
         et NULLE PART ailleurs (demande de Turquet, août 2026). Le contrôle est
         greffé sur la visite de TOUS les exercices — celui qu'on ajoutera
         demain est donc couvert sans rien déclarer.
         Il compare deux sources : ce que la page AFFICHE et la liste écrite
         ici. Lire la liste de la page et la comparer à elle-même n'aurait rien
         prouvé du tout. */
      if(P.tablesAide && P.tablesAide.sans){
        const attendu = P.tablesAide.sans;
        const inconnusT = attendu.filter(x => tous.indexOf(x) < 0);
        const enTrop = [...sansTables].filter(x => attendu.indexOf(x) < 0);
        const manquants = attendu.filter(x => avecTables.has(x));
        verifier('le bouton des tables n\'est proposé que là où il y a un calcul à faire',
          enTrop.length === 0 && manquants.length === 0,
          (enTrop.length ? 'sans bouton alors qu\'il devrait l\'avoir : ' + enTrop.join(', ') + '. ' : '')
          + (manquants.length ? 'avec bouton alors qu\'il est déclaré sans : ' + manquants.join(', ') : ''));
        /* Une exemption qui ne protège plus rien masquerait le jour où on
           réutilise l'identifiant. */
        verifier('chaque exercice déclaré sans les tables existe encore',
          inconnusT.length === 0, 'identifiant(s) inconnu(s) : ' + inconnusT.join(', '));
        console.log('   · ' + attendu.length + ' exercice(s) sans les tables : ' + attendu.join(', '));
      } else {
        ignorer('le bouton des tables n\'est proposé que là où il y a un calcul à faire',
          'ce niveau ne déclare pas où les tables servent');
      }
      verifier('le bouton d\'aide IA est présent sur chaque exercice',
        sans.length === 0,
        sans.length ? 'absent sur : ' + sans.join(', ')
                    : (exemptes.length ? exemptes.length + ' exercice(s) chronométré(s) déclarés sans aide IA'
                                       : (sansMode.length ? sansMode.length + ' mode(s) indisponible(s)' : '')));
      /* Une référence {identifiant} affichée telle quelle est un numéro que
         numeros() n'a pas résolu. Trouvé sur une capture de 2.3.7, jamais par
         un contrôle : le banc statique interdit les numéros EN DUR, pas les
         accolades restées visibles. */
      verifier('aucune référence {identifiant} ne reste affichée à l\'élève',
        accolades.length === 0, accolades.join(' | '));
      /* Le même défaut par l'autre porte : du CODE affiché à l'élève. */
      verifier('aucun gabarit « ${…} » non interprété ne reste affiché à l\'élève',
        gabarits.length === 0, gabarits.join(' | '));
      /* La Terminale donne à ses cartes une largeur propre (--card-max, avec
         ses paliers) : elle ne déclare pas ce contrôle, et le banc le dit au
         lieu de le taire — un contrôle qui ne s'applique pas se déclare. */
      if(P.cadrePleineLargeur){
        verifier('le cadre d\'un exercice prend toute la largeur offerte',
          etroits.length === 0, 'cadre(s) bridé(s) : ' + etroits.join(' | '));
      } else {
        ignorer('le cadre d\'un exercice prend toute la largeur offerte',
          'ce niveau donne à ses cartes une largeur propre (--card-max)');
      }
      /* Un identifiant exempté qui n'existe plus est une exemption qui ne
         protège plus rien — et qui masquerait le jour où on le réutilise. */
      verifier('chaque exercice déclaré sans aide IA existe encore',
        inconnus.length === 0, 'identifiant(s) inconnu(s) dans aideIA.sans : ' + inconnus.join(', '));
      verifier('la visite de tous les exercices ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ---- 9 bis. Les couleurs de la vérification : JUSTE en bleu, FAUX en rouge, la
       CORRECTION en vert (décision de Turquet, août 2026). Les classes ne
       suffisent pas : « ok » peut rester posé pendant qu'une feuille de styles
       le peint encore en vert — c'est un défaut de PEINTURE, et seul un
       navigateur voit la peinture. On relit donc chaque règle CSS qui vise une
       classe de verdict (.ok, .bad, .sol, et le badge .mf-cor), on résout ses
       var(--…), et on classe chaque encre par sa dominante : une règle .ok qui
       porte une encre verte, ou une règle .sol qui porte une encre bleue,
       rougit en nommant son sélecteur. Les encres presque blanches (fonds
       adoucis) ne disent rien et sont ignorées. Les exceptions sont NOMMÉES :
       .dm-go (bouton de devoir), .review et #toast (récapitulatif, message),
       .mp-tag et .mark (pastilles ✓/✗) sont des verdicts d'à-côté, restés
       verts — la demande porte sur les cases. Une famille de cases ajoutée
       demain entre dans la feuille de styles, donc dans ce contrôle, sans
       rien déclarer. */
    titre('9 bis. LES COULEURS DE LA VÉRIFICATION : BLEU JUSTE, ROUGE FAUX, VERT CORRECTION');
    s = await ouvrir(chromium, ml);
    {
      const teintes = await s.page.evaluate(() => {
        const probe = document.createElement('div'); document.body.appendChild(probe);
        const rgb = tok => { probe.style.color = ''; probe.style.color = tok;
          const m = getComputedStyle(probe).color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [+m[1], +m[2], +m[3]] : null; };
        const dominante = c => { const [r, g, b] = c;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          if(max < 100 || max - min < 30) return null;   /* encre neutre : fond adouci, blanc, gris */
          return b >= max ? 'bleu' : (g >= max ? 'vert' : 'rouge'); };
        const resoudre = tok => { const m = tok.match(/var\((--[\w-]+)\)/);
          return m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() : tok; };
        const soucis = [], vusOk = [], vusSol = [];
        const exceptions = /\.dm-go|\.review|#toast|\.mp-tag|\.mark(?![\w-])/;
        const lireRegle = r => {
          /* CSS imbriqué : TOUTE règle porte un cssRules (souvent vide mais
             truthy) — on descend dedans ET on lit la règle elle-même, sinon
             la récursion avale tout et le contrôle mesure zéro règle. */
          if(r.cssRules) for(const q of r.cssRules) lireRegle(q);
          if(!r.selectorText || !r.style) return;
          const sel = r.selectorText;
          const quoi = /\.mf-cor(?![\w-])/.test(sel) ? 'sol'
            : /\.sol(?![\w-])/.test(sel) ? 'sol'
            : /\.ok(?![\w-])/.test(sel) ? 'ok'
            : /\.bad(?![\w-])/.test(sel) ? 'bad' : null;
          if(!quoi || exceptions.test(sel)) return;
          const encres = [];
          for(const p of ['color', 'background-color', 'border-color', 'border-top-color',
                          'border-bottom-color', 'border-left-color', 'border-right-color', 'fill', 'stroke']){
            const v = r.style.getPropertyValue(p); if(!v) continue;
            const c = rgb(resoudre(v)); if(!c) continue;
            const d = dominante(c); if(d) encres.push(d);
          }
          if(!encres.length) return;
          const interdits = quoi === 'ok' ? ['vert'] : quoi === 'sol' ? ['bleu'] : ['vert', 'bleu'];
          const attendu = quoi === 'ok' ? 'bleu' : quoi === 'sol' ? 'vert' : 'rouge';
          for(const d of encres) if(interdits.indexOf(d) >= 0)
            soucis.push(sel + ' porte une encre ' + d + ' (attendu : ' + attendu + ')');
          if(quoi === 'ok' && encres.indexOf('bleu') >= 0) vusOk.push(sel);
          if(quoi === 'sol' && encres.indexOf('vert') >= 0) vusSol.push(sel);
        };
        for(const feuille of document.styleSheets){
          let regles; try{ regles = feuille.cssRules; }catch(e){ continue; }
          for(const r of regles) lireRegle(r);
        }
        probe.remove();
        return { soucis: [...new Set(soucis)], nbOk: vusOk.length, nbSol: vusSol.length };
      });
      verifier('les règles .ok sont bleues, .sol et .mf-cor vertes, .bad rouges',
        teintes.soucis.length === 0, teintes.soucis.slice(0, 4).join(' | '));
      /* Sans ce second bord, une feuille de styles VIDÉE de ses règles de
         verdict passerait au vert : un contrôle qui n'a rien à mesurer ne
         mesure rien. */
      verifier('la convention des couleurs a des règles à tenir',
        teintes.nbOk > 0 && teintes.nbSol > 0,
        teintes.nbOk + ' règle(s) .ok bleue(s), ' + teintes.nbSol + ' règle(s) .sol verte(s)');
      verifier('la lecture des couleurs ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ---- 9 ter. Le verdict d'une vérification par l'IA porte SA couleur ----
       « Les phrases qui commentent une vérification par l'IA sont VERTES quand
       c'est bon, ROUGES quand c'est faux » (demande de Turquet, août 2026).
       La classe était bien posée et la phrase s'écrivait quand même en NOIR :
       « .mp-feedback.iafb » portait une encre neutre, de même spécificité que
       « .mp-feedback.good » et déclarée plus bas — la cascade trompait, pas le
       balisage, et AUCUN banc hors navigateur ne pouvait le voir (la leçon de
       la phrase des couleurs du 6.3, retombée telle quelle : le contrôle jsdom
       lit des classes et reste vert).
       On MESURE donc l'encre RÉSOLUE de trois témoins, et les trois bords
       comptent : le verdict juste vaut --green, le faux vaut --red, et un
       « iafb » SEUL reste l'encre ordinaire — sans ce dernier bord, une règle
       qui peindrait tout en vert passerait. Un quatrième tient la promesse
       d'à côté : à l'intérieur d'un verdict coloré, les phrases balisées par
       le modèle gardent LEUR encre (fb-ok vert, fb-ko rouge), que remettre les
       règles dans un autre ordre casserait. */
    titre('9 ter. LE VERDICT DE L\'IA PORTE SA COULEUR (ENCRE RÉSOLUE)');
    s = await ouvrir(chromium, ml);
    {
      const encres = await s.page.evaluate(() => {
        const jeton = t => getComputedStyle(document.documentElement).getPropertyValue(t).trim();
        const rgb = v => { const d = document.createElement('div'); d.style.color = v;
          document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
        const hote = document.createElement('div');
        hote.innerHTML = '<div class="mp-feedback iafb good" id="_t1">juste <span class="fb-ko">manque</span></div>'
          + '<div class="mp-feedback iafb bad" id="_t2">faux <span class="fb-ok">acquis</span></div>'
          + '<div class="mp-feedback iafb" id="_t3">en cours</div>'
          + '<div class="mp-feedback" id="_t4">neutre</div>';
        document.body.appendChild(hote);
        const lu = id => getComputedStyle(document.getElementById(id)).color;
        const luSpan = id => getComputedStyle(document.querySelector('#' + id + ' span')).color;
        const r = { vert: rgb(jeton('--green')), rouge: rgb(jeton('--red')),
          t1: lu('_t1'), t2: lu('_t2'), t3: lu('_t3'), t4: lu('_t4'),
          s1: luSpan('_t1'), s2: luSpan('_t2') };
        hote.remove();
        return r;
      });
      const pbs = [];
      if(!encres.vert || !encres.rouge) pbs.push('les jetons --green / --red ne se résolvent pas : rien à mesurer');
      if(encres.t1 !== encres.vert) pbs.push('un verdict « iafb good » s\'écrit ' + encres.t1 + ' au lieu du vert ' + encres.vert);
      if(encres.t2 !== encres.rouge) pbs.push('un verdict « iafb bad » s\'écrit ' + encres.t2 + ' au lieu du rouge ' + encres.rouge);
      if(encres.t3 !== encres.t4) pbs.push('un « iafb » seul s\'écrit ' + encres.t3 + ' quand l\'encre ordinaire est ' + encres.t4);
      if(encres.s1 !== encres.rouge) pbs.push('une phrase [KO] dans un verdict vert s\'écrit ' + encres.s1 + ' au lieu du rouge');
      if(encres.s2 !== encres.vert) pbs.push('une phrase [OK] dans un verdict rouge s\'écrit ' + encres.s2 + ' au lieu du vert');
      verifier('le verdict de l\'IA porte sa couleur, et les phrases balisées gardent la leur',
        pbs.length === 0, pbs.slice(0, 3).join(' | '));
      verifier('la mesure des encres de verdict ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ---- 10. Les retours à la ligne du modèle arrivent-ils à l'écran ? ----
       Le modèle a pour consigne d'aller à la ligne souvent — une étape par
       ligne, une ligne vide entre deux parties. Cette consigne a DEUX moitiés,
       et la seconde est muette : le modèle peut obéir parfaitement pendant que
       la page réduit ses retours à la ligne à des espaces. La Seconde pose la
       réponse en textContent, où « \n » ne vaut rien sans white-space:pre-wrap ;
       la Première et la Terminale passent par conseilHTML(), qui convertit.
       Deux chemins différents, une seule promesse — et aucun banc hors
       navigateur ne sait où un texte va à la ligne.
       On MESURE donc : le même texte, avec et sans retours à la ligne. S'ils
       comptent, la version qui en porte est plus haute. */
    titre('10. LES RETOURS À LA LIGNE DU MODÈLE ARRIVENT À L\'ÉCRAN');
    s = await ouvrir(chromium, ml);
    if(await connecter(s.page) !== 'scr-space'){
      ignorer('les retours à la ligne de l\'IA se voient à l\'écran', 'connexion impossible — rien à mesurer');
    } else {
      const N = P.navigateur;
      await s.page.evaluate(i => openTest(i), N.exercice);
      await s.page.waitForTimeout(300);
      await s.page.evaluate(() => {
        const b = [...document.querySelectorAll('#modeChoices button')]
          .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='soutien'") >= 0);
        if(b) b.click();
      });
      await s.page.waitForTimeout(800);
      /* le modèle est remplacé par un double qui rend le texte demandé */
      const mesure = await s.page.evaluate(async () => {
        const AVEC = 'Etape 1 : tu prends le nombre.\nEtape 2 : tu le divises par cent.\n\nExemple : 30 % de 40.';
        const SANS = AVEC.replace(/\n+/g, ' ');
        const vrai = sb.functions.invoke;
        const poser = txt => { sb.functions.invoke = () => Promise.resolve({ data:{ feedback: txt }, error:null }); };
        const attendre = ms => new Promise(r => setTimeout(r, ms));
        const haut = el => el ? Math.round(el.getBoundingClientRect().height) : 0;
        const res = {};
        /* 1. le conseil du soutien */
        /* $ et non getElementById : sur ordinateur la carte du soutien est
           DÉPLACÉE dans une fenêtre indépendante, et le document principal ne
           la contient plus. La sonde y lisait 0 px contre 0 et accusait la page
           de perdre les retours à la ligne. */
        for(const [cle, txt] of [['avec', AVEC], ['sans', SANS]]){
          poser(txt); conseilBusy = false;
          const fb = $('conseilBody');
          if(fb){ fb.textContent = ''; fb.innerHTML = ''; }
          try{ conseilCourant(); }catch(e){ res.erreurConseil = e.message; }
          await attendre(150);
          res['conseil_' + cle] = haut($('conseilBody'));
        }
        try{ fermerConseil(); }catch(e){}
        /* 2. la fenêtre « Question à l'IA » */
        try{ ouvrirQIA(); }catch(e){ res.erreurQIA = e.message; }
        await attendre(120);
        for(const [cle, txt] of [['avec', AVEC], ['sans', SANS]]){
          poser(txt); qiaBusy = false;
          const inp = $('qiaInput'); if(inp) inp.value = 'Comment on fait ?';
          try{ await qiaEnvoyer(); }catch(e){ res.erreurQIA = e.message; }
          await attendre(120);
          const bulles = [...$('qiaDialog').querySelectorAll('.qia-r')];
          res['qia_' + cle] = haut(bulles[bulles.length - 1]);
        }
        sb.functions.invoke = vrai;
        return res;
      });
      /* Deux hauteurs nulles ne veulent pas dire « les retours sont perdus » :
         elles veulent dire que RIEN n'a été mesuré. Les distinguer évite
         d'accuser la page d'un défaut qu'elle n'a pas — et évite surtout de
         croire le contrôle utile alors qu'il ne regarde rien. */
      const juge = (intitule, a, b, erreur) => {
        const A = mesure[a] || 0, B = mesure[b] || 0;
        if(!A && !B){ verifier(intitule, false, 'aucune réponse affichée : le contrôle ne mesure rien'
          + (erreur ? ' — ' + erreur : '')); return; }
        verifier(intitule, A - B > 8,
          'même hauteur avec et sans retours à la ligne (' + A + ' px contre ' + B +
          ') : la page les réduit à des espaces' + (erreur ? ' — ' + erreur : ''));
      };
      juge('les retours à la ligne se voient dans le conseil du soutien',
        'conseil_avec', 'conseil_sans', mesure.erreurConseil);
      juge('les retours à la ligne se voient dans la fenêtre « Question à l\'IA »',
        'qia_avec', 'qia_sans', mesure.erreurQIA);
      /* ===== 11. les écritures mathématiques du modèle s'affichent EMPILÉES ===== */
      /* Le modèle écrit \(\frac{3}{4}\) ; l'élève doit voir une fraction, pas
         une commande. Posée en textContent, la formule arrive à l'écran avec
         ses antislashs — c'est ce que lisaient les élèves de Seconde.
         Seul un vrai navigateur peut le voir : jsdom n'a pas MathLive, donc
         rien à empiler et rien à mesurer. Deux bords, et n'en tenir qu'un ne
         tient rien : la fraction doit être DESSINÉE (un .ML__mfrac dans le
         rendu), et le « \frac » ne doit PLUS être lisible en toutes lettres. */
      const rendu = await s.page.evaluate(async () => {
        const TXT = 'Tu prends \\(\\frac{3}{4}\\) du nombre, puis tu conclus.';
        const vrai = sb.functions.invoke;
        sb.functions.invoke = () => Promise.resolve({ data: { feedback: TXT }, error: null });
        const attendre = ms => new Promise(r => setTimeout(r, ms));
        const lire = el => el ? { frac: el.querySelectorAll('.ML__mfrac').length,
                                  texte: (el.textContent || '') } : null;
        const res = {};
        conseilBusy = false;
        const fb = $('conseilBody');
        if(fb){ fb.textContent = ''; fb.innerHTML = ''; }
        try{ conseilCourant(); }catch(e){ res.erreurConseil = e.message; }
        await attendre(300);
        res.conseil = lire($('conseilBody'));
        try{ fermerConseil(); }catch(e){}
        try{ ouvrirQIA(); }catch(e){ res.erreurQIA = e.message; }
        await attendre(150);
        qiaBusy = false;
        const inp = $('qiaInput'); if(inp) inp.value = 'Comment on fait ?';
        try{ await qiaEnvoyer(); }catch(e){ res.erreurQIA = e.message; }
        await attendre(300);
        const bulles = [...$('qiaDialog').querySelectorAll('.qia-r')];
        res.qia = lire(bulles[bulles.length - 1]);
        sb.functions.invoke = vrai;
        return res;
      });
      const jugeMath = (intitule, o, erreur) => {
        if(!o || !o.texte.trim()){
          verifier(intitule, false, 'aucune réponse affichée : le contrôle ne mesure rien'
            + (erreur ? ' — ' + erreur : '')); return;
        }
        const nu = /\\frac|\\\(|\\\)/.test(o.texte);
        verifier(intitule, o.frac > 0 && !nu,
          o.frac === 0 ? 'aucune fraction empilée dans le rendu — l\'élève lit « ' + o.texte.trim().slice(0, 60) + ' »'
                       : 'du LaTeX reste lisible à l\'écran : « ' + o.texte.trim().slice(0, 60) + ' »');
      };
      if(!ml){
        ignorer('la fraction du modèle s\'affiche empilée dans le conseil', 'MathLive absent');
        ignorer('la fraction du modèle s\'affiche empilée dans la fenêtre d\'aide', 'MathLive absent');
      } else {
        jugeMath('la fraction du modèle s\'affiche empilée dans le conseil', rendu.conseil, rendu.erreurConseil);
        jugeMath('la fraction du modèle s\'affiche empilée dans la fenêtre d\'aide', rendu.qia, rendu.erreurQIA);
      }

      /* ===== 12. les fractions des rappels de cours s'affichent EMPILÉES ===== */
      /* Un rappel de cours est du HTML écrit à la main. Une fraction s'y écrit
         \(\frac{1}{2}\) et c'est rapMaths(), à l'AFFICHAGE, qui la dessine — au
         chargement, MathLive n'est pas prêt et la fraction serait vide.
         Le défaut à empêcher est franc : si rapMaths() n'est pas branché, l'élève
         lit « \frac{1}{2} » en toutes lettres. On ouvre donc CHAQUE rappel du
         niveau et on regarde ce qui s'affiche — un rappel ajouté demain est
         couvert sans rien déclarer nulle part. */
      const rappels = await s.page.evaluate(() => {
        if(typeof RAPPELS === 'undefined' || typeof rappelHTML !== 'function') return null;
        const hote = document.createElement('div');
        hote.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px';
        document.body.appendChild(hote);
        const out = [];
        const cles = Object.keys(RAPPELS).map(k => ({ kind: k, id: null }))
          .concat(Object.keys(typeof RAPPELS_ID === 'undefined' ? {} : RAPPELS_ID)
            .map(i => ({ kind: null, id: i })));
        const kSauve = test ? test.kind : null, iSauve = currentTestId;
        const dessins = [];
        for(const c of cles){
          if(c.kind && test) test.kind = c.kind;
          currentTestId = c.id;
          const brut = c.id ? RAPPELS_ID[c.id] : RAPPELS[c.kind];
          const aFormule = String(brut || '').indexOf('\\(') >= 0;
          const aDessin  = String(brut || '').indexOf('<svg') >= 0;
          if(!aFormule && !aDessin) continue;   /* ce rappel n'écrit ni formule ni dessin */
          hote.innerHTML = rappelHTML();
          /* un rappel qui porte un DESSIN doit le dessiner, à taille lisible —
             seul un vrai navigateur sait quelle place un SVG occupe vraiment */
          if(aDessin){
            const svgs = hote.querySelectorAll('svg');
            let minW = 1e9, minH = 1e9;
            svgs.forEach(sv => { const r = sv.getBoundingClientRect();
              minW = Math.min(minW, r.width); minH = Math.min(minH, r.height); });
            let rouges = 0;
            hote.querySelectorAll('.ing-rouge').forEach(p => {
              try{ const bb = p.getBBox(); if(bb.width > 5) rouges++; }catch(e){} });
            dessins.push({ nom: c.id || c.kind, n: svgs.length,
                           minW: Math.round(minW), minH: Math.round(minH), rouges: rouges });
          }
          if(!aFormule) continue;
          out.push({ nom: c.id || c.kind,
                     frac: hote.querySelectorAll('.ML__mfrac').length,
                     nu: /\\frac|\\\(|\\\)/.test(hote.textContent || ''),
                     extrait: (hote.textContent || '').trim().slice(0, 70) });
        }
        if(test) test.kind = kSauve; currentTestId = iSauve;
        hote.remove();
        return { out: out, dessins: dessins,
                 ingAttendu: !!(typeof RAPPELS !== 'undefined' && RAPPELS.ing) };
      });
      const rappelsDessins = rappels && rappels.dessins;
      const rappelsOut = rappels && rappels.out;
      if(!ml){
        ignorer('les fractions des rappels de cours s\'affichent empilées', 'MathLive absent');
      } else if(rappels === null){
        verifier('les fractions des rappels de cours s\'affichent empilées', false,
          'RAPPELS ou rappelHTML() introuvable : le contrôle ne mesure rien');
      } else if(!rappelsOut.length){
        ignorer('les fractions des rappels de cours s\'affichent empilées',
          'aucun rappel de ce niveau n\'écrit de formule');
      } else {
        const muets = rappelsOut.filter(r => r.frac === 0 || r.nu);
        verifier('les fractions des rappels de cours s\'affichent empilées (' + rappelsOut.length + ' rappels)',
          muets.length === 0,
          muets.map(r => r.nom + ' : « ' + r.extrait + ' »').slice(0, 2).join(' | '));
      }
      /* ===== 12b. les dessins des rappels sont réellement DESSINÉS ===== */
      /* Le rappel de l'inéquation graphique montre les quatre dessins de
         l'exercice : chacun doit occuper une vraie place à l'écran (un CSS
         perdu les rendrait minuscules ou invisibles sans qu'aucune erreur ne
         se lève), et ses morceaux rouges doivent avoir une étendue. Un rappel
         à dessins ajouté demain est couvert sans rien déclarer.
         Seule la Seconde a ce rappel : sur un niveau qui ne déclare pas
         RAPPELS.ing, le contrôle s'affiche « non applicable » au lieu
         d'exiger un dessin qui n'a aucune raison d'exister — la première
         version rougissait sur la Première et la Terminale, parfaitement
         saines, et c'est l'action Contrôles qui l'a montré. */
      if(rappels === null){
        /* déjà signalé au contrôle des fractions */
      } else if(!rappelsDessins || !rappelsDessins.length){
        if(rappels.ingAttendu)
          verifier('un rappel qui porte un dessin le dessine, à taille lisible', false,
            'le rappel de l\'inéquation graphique ne porte aucun dessin');
        else
          ignorer('un rappel qui porte un dessin le dessine, à taille lisible',
            'aucun rappel de ce niveau ne porte de dessin');
      } else {
        const petits = rappelsDessins.filter(d => d.minW < 180 || d.minH < 90);
        const ing = rappelsDessins.find(d => d.nom === 'ing');
        const fautes = [];
        if(petits.length) fautes.push(petits.map(d => d.nom + ' : ' + d.minW + '×' + d.minH + ' px').join(', '));
        if(rappels.ingAttendu && !ing) fautes.push('le rappel de l\'inéquation graphique ne porte aucun dessin');
        if(ing){
          if(ing.n !== 4) fautes.push('le rappel de l\'inéquation graphique montre ' + ing.n + ' dessin(s) au lieu de 4');
          if(ing.rouges !== 6) fautes.push(ing.rouges + ' morceau(x) rouge(s) visibles au lieu de 6 (1+1+2+2)');
        }
        verifier('un rappel qui porte un dessin le dessine, à taille lisible (' + rappelsDessins.length + ' rappel(s))',
          fautes.length === 0, fautes.slice(0, 2).join(' | '));
      }

      verifier('mesurer la mise en page de l\'IA ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ---- 11. Le pavé numérique compact, mesuré en tactile ------------------
       Seul un vrai navigateur sait où tombe un rectangle : on force le mode
       tactile (window.__paveForce — la requête média, elle, appartient au
       navigateur), on ouvre l'exercice déclaré dans tests/profils.js par le
       vrai chemin, on donne le focus à une case, et on MESURE : le pavé est
       petit — c'est toute sa raison d'être —, ses touches sont touchables, il
       ne recouvre ni la case qu'on remplit ni les commandes du bas, et une
       touche cliquée écrit dans la case sans lui voler le focus. */
    titre('11. LE PAVÉ NUMÉRIQUE COMPACT (ÉCRANS TACTILES)');
    if(!P.pave){
      ignorer('le pavé numérique est petit, touchable, et il écrit', 'ce fichier ne déclare pas de pavé');
    } else {
      /* ouvre l'exercice par le vrai chemin, en entraînement, et franchit son
         écran de départ s'il en a un */
      const ouvrirExoPave = async (page, exercice) => {
        await page.evaluate(() => { window.__paveForce = true; paveObserver(); });
        await page.evaluate(i => openTest(i), exercice);
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
          if(b) b.click();
        });
        await page.waitForTimeout(700);
        await page.evaluate(() => {
          const vis = e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0; };
          const b = [...document.querySelectorAll('button')].filter(vis)
            .find(x => /^(Commencer|Démarrer|C'est parti|Niveau 1)/.test(x.textContent.trim()));
          if(b) b.click();
        });
        await page.waitForTimeout(700);
      };
      /* la géométrie du pavé, mesurée au RECTANGLE : position, rangées et
         colonnes des douze touches nommées (chiffres, virgule, moins),
         recouvrements avec la case remplie et les commandes du bas */
      const mesurerPave = (champ) => {
        const el = document.querySelector(champ), pave = document.getElementById('paveNum');
        if(!pave) return { absent: true };
        const r = pave.getBoundingClientRect(), c = el.getBoundingClientRect();
        const touches = [...pave.querySelectorAll('.pave-t')];
        const rects = touches.map(b => b.getBoundingClientRect());
        const nommees = touches.filter(b => /^[0-9,−]$/.test(b.getAttribute('data-t'))).map(b => b.getBoundingClientRect());
        const distinct = (xs) => { const v = []; xs.forEach(x => { if(!v.some(y => Math.abs(y - x) < 4)) v.push(x); }); return v.length; };
        const ctrls = document.getElementById('testCtrls');
        const k = ctrls ? ctrls.getBoundingClientRect() : null;
        const chev = (a1, b2) => !!(a1 && b2 && b2.width > 0 && a1.left < b2.right && b2.left < a1.right && a1.top < b2.bottom && b2.top < a1.bottom);
        return { visible: !pave.hidden && r.height > 0, hauteur: Math.round(r.height), largeur: Math.round(r.width),
                 gauche: Math.round(r.left), droite: Math.round(r.right), haut: Math.round(r.top), bas: Math.round(r.bottom),
                 fenetre: { w: window.innerWidth, h: window.innerHeight },
                 /* les commandes du bas (Pause, Abandonner, Signaler), au RECTANGLE :
                    leur écart au bas de l'écran, leur largeur, et si le pavé
                    partage leur ligne (recouvrement vertical, pavé à gauche) */
                 cmd: k && k.width > 0 ? { bas: Math.round(window.innerHeight - k.bottom), haut: Math.round(k.top),
                                            largeur: Math.round(k.width), gauche: Math.round(k.left),
                                            hauteur: Math.round(k.height),
                                            memeLigne: r.top < k.bottom && k.top < r.bottom && r.right <= k.left } : null,
                 petites: rects.filter(t => t.width < 40 || t.height < 40).length,
                 /* la LARGEUR des touches et l'étendue de la rangée RENDUE :
                    une boîte étirée dont les touches restent à 40 px laisse le
                    vide DANS le pavé, et la boîte, elle, s'étire toujours */
                 toucheEtroite: rects.length ? Math.round(Math.min(...rects.map(t => t.width))) : 0,
                 toucheLarge: rects.length ? Math.round(Math.max(...rects.map(t => t.width))) : 0,
                 rangeeG: rects.length ? Math.round(Math.min(...rects.map(t => t.left))) : 0,
                 rangeeD: rects.length ? Math.round(Math.max(...rects.map(t => t.right))) : 0,
                 /* un pavé qui DÉFILE cache ses dernières touches (−, ⌫, ⏎) */
                 deborde: pave.scrollWidth > pave.clientWidth + 1,
                 surCase: chev(r, c), surCommandes: chev(r, k),
                 nommees: nommees.length, rangees: distinct(nommees.map(q => q.top)), colonnes: distinct(nommees.map(q => q.left)),
                 mode: el.getAttribute('inputmode') };
      };
      const frapper = async (page, champ, frappe) => {
        for(const touche of frappe) await page.click('#paveNum button[data-t="' + touche + '"]');
        return page.evaluate(ch => ({
          valeur: document.querySelector(ch).value,
          focus: document.activeElement === document.querySelector(ch),
        }), champ);
      };

      s = await ouvrir(chromium, ml, { viewport: { width: 820, height: 1180 } });
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('le pavé numérique est petit, touchable, et il écrit', 'connexion impossible');
      } else {
        await ouvrirExoPave(s.page, P.pave.exercice);
        await s.page.focus(P.pave.champ);
        await s.page.waitForTimeout(400);
        const m = await s.page.evaluate(mesurerPave, P.pave.champ);
        if(m.absent){
          verifier('le pavé numérique est petit, touchable, et il écrit', false, 'aucun pavé dans la page');
        } else {
          verifier('le pavé s\'ouvre quand une case numérique prend le focus', m.visible === true,
            'le pavé reste caché après le focus');
          verifier('le pavé est PETIT — c\'est toute sa raison d\'être', m.hauteur > 0 && m.hauteur <= 100,
            m.hauteur + 'px de haut : le clavier de la tablette en fait autant');
          verifier('en PORTRAIT, le pavé est une seule rangée en bas de l\'écran',
            m.rangees === 1 && m.bas > m.fenetre.h * 0.7,
            m.rangees + ' rangée(s), bas du pavé à ' + m.bas + 'px sur ' + m.fenetre.h);
          verifier('chaque touche du pavé fait au moins 40 px — un doigt, pas une souris', m.petites === 0,
            m.petites + ' touche(s) trop petites');
          verifier('le pavé ne recouvre ni la case remplie ni les commandes du bas',
            !m.surCase && !m.surCommandes,
            m.surCase ? 'il recouvre la case qu\'on remplit' : 'il recouvre Pause/Abandonner');
          verifier('la case a perdu le clavier du système (inputmode="none")', m.mode === 'none',
            'inputmode=' + m.mode);
          /* la frappe vit dans le profil : les cases de la multiplication
             posée n'acceptent qu'UN chiffre, celles des courbes une décimale */
          const t = await frapper(s.page, P.pave.champ, P.pave.frappe);
          verifier('les touches écrivent dans la case sans lui voler le focus',
            t.valeur === P.pave.attendu && t.focus === true,
            '« ' + t.valeur + ' » au lieu de « ' + P.pave.attendu + ' », focus ' + (t.focus ? 'gardé' : 'perdu'));

          /* ---- les commandes du bas, sur tablette (demande de Turquet, septembre 2026) ----
             Déclaré par niveau (pave.commandes) : la Première et la Seconde
             descendent « Signaler », « Abandonner », « Mettre en pause » au
             ras du bas en portrait, le pavé juste au-dessus ; en paysage les
             trois commandes sont resserrées et le pavé tient sur LEUR ligne.
             Tout se mesure au RECTANGLE — jamais à une classe : une règle CSS
             perdue laisserait la classe en place et l'écran d'avant. */
          if(!P.pave.commandes){
            ignorer('en portrait, les commandes du bas sont au ras de l\'écran et le pavé juste au-dessus', 'ce niveau garde ses commandes à leur place');
            ignorer('en paysage, les commandes sont resserrées et le pavé tient sur leur ligne', 'ce niveau garde ses commandes à leur place');
          } else {
            verifier('en portrait, les commandes du bas sont au ras de l\'écran et le pavé juste au-dessus',
              !!m.cmd && m.cmd.bas <= 12 && m.bas <= m.cmd.haut && m.bas >= m.cmd.haut - 16,
              !m.cmd ? 'aucune commande visible' : ('commandes à ' + m.cmd.bas + 'px du bas, pavé fini à ' + m.bas + 'px pour des commandes qui commencent à ' + m.cmd.haut + 'px'));
          }

          /* ---- en PAYSAGE aussi : une seule rangée, en bas — universel ----
             Le paysage de la Première et de la Seconde a porté un temps un
             rectangle 4 × 3 posé à droite ; Turquet l'a retiré (septembre
             2026 : « en format paysage, mettre le clavier sur une ligne
             aussi »). Le bord qui compte est la GRILLE qui reviendrait : une
             règle @media oubliée ou remise redonnerait quatre rangées à
             droite sans qu'aucune classe ne change — seul un navigateur le
             voit, et il le mesure sur les trois niveaux. */
          await s.page.setViewportSize({ width: 1180, height: 820 });
          await s.page.waitForTimeout(300);
          /* on quitte la case puis on y revient : la réserve du bas se
             remesure sur le pavé rendu dans la nouvelle orientation */
          await s.page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
          await s.page.waitForTimeout(100);
          await s.page.focus(P.pave.champ);
          await s.page.waitForTimeout(400);
          const p = await s.page.evaluate(mesurerPave, P.pave.champ);
          verifier('en PAYSAGE aussi, le pavé est une seule rangée en bas de l\'écran',
            p.visible && p.nommees === 12 && p.rangees === 1 && p.bas > p.fenetre.h * 0.7,
            !p.visible ? 'le pavé reste caché' : p.nommees !== 12 ? p.nommees + ' touches nommées au lieu de 12'
              : (p.rangees + ' rangée(s) × ' + p.colonnes + ' colonne(s), bas du pavé à ' + p.bas + 'px sur ' + p.fenetre.h));
          verifier('en paysage, le pavé ne recouvre ni la case remplie ni les commandes du bas, et ses touches restent touchables',
            !p.surCase && !p.surCommandes && p.petites === 0,
            p.surCase ? 'il recouvre la case qu\'on remplit' : p.surCommandes ? 'il recouvre Pause/Abandonner' : p.petites + ' touche(s) trop petites');
          /* on efface ce que la frappe portrait a écrit, puis on retape */
          const eff = []; for(let i = 0; i < P.pave.attendu.length; i++) eff.push('⌫');
          const t2 = await frapper(s.page, P.pave.champ, eff.concat(P.pave.frappe));
          verifier('en paysage, les touches écrivent dans la case sans lui voler le focus',
            t2.valeur === P.pave.attendu && t2.focus === true,
            '« ' + t2.valeur + ' » au lieu de « ' + P.pave.attendu + ' », focus ' + (t2.focus ? 'gardé' : 'perdu'));

          /* ---- LE PAVÉ EST AUSSI LARGE QUE L'ÉCRAN LE PERMET ----
             Demande de Turquet (septembre 2026) : « en mode paysage, faire en
             sorte que le clavier soit le plus large possible en fonction de la
             définition de l'écran ». Il faisait 634 px sur toutes les
             tablettes. Deux mesures, et n'en tenir qu'une ne tient rien : la
             RANGÉE va jusqu'au bord libre (les commandes quand elles partagent
             sa ligne, sinon l'écran), et les TOUCHES ont grandi avec elle —
             une boîte étirée dont les touches restent à 40 px laisserait le
             vide dans le pavé, et la boîte s'étire de toute façon. */
          const bordLibre = (q) => (q.cmd && q.cmd.memeLigne) ? q.cmd.gauche : q.fenetre.w;
          const LP = P.pave.largeurPaysage;
          verifier('en paysage à 1180 px, la rangée de touches occupe toute la largeur libre',
            p.rangeeG <= 20 && p.rangeeD >= bordLibre(p) - 28,
            'la rangée va de ' + p.rangeeG + 'px à ' + p.rangeeD + 'px pour un bord libre à ' + bordLibre(p) + 'px');
          verifier('en paysage à 1180 px, les touches ont grandi (au moins ' + LP.plancher + 'px, au plus ' + LP.toucheMax + ')',
            p.toucheEtroite >= LP.plancher && p.toucheLarge <= LP.toucheMax + 1,
            'touches de ' + p.toucheEtroite + ' à ' + p.toucheLarge + 'px');
          if(P.pave.commandes){
            /* la MÊME ligne : le pavé et les commandes se recouvrent
               verticalement, le pavé à gauche des commandes ; et les
               commandes sont plus ÉTROITES qu'en portrait — le seul bord
               qui distingue « resserrées » de « déplacées » */
            verifier('en paysage, les commandes sont resserrées et le pavé tient sur leur ligne',
              !!p.cmd && !!m.cmd && p.cmd.memeLigne === true && p.cmd.largeur < m.cmd.largeur - 20 && p.cmd.bas <= 24,
              !p.cmd ? 'aucune commande visible'
                : !p.cmd.memeLigne ? ('pavé ' + p.haut + '→' + p.bas + 'px, commandes ' + p.cmd.haut + '→' + (p.fenetre.h - p.cmd.bas) + 'px, pavé fini à ' + p.droite + 'px pour des commandes qui commencent à ' + p.cmd.gauche + 'px')
                : ('commandes larges de ' + p.cmd.largeur + 'px en paysage contre ' + m.cmd.largeur + ' en portrait, à ' + p.cmd.bas + 'px du bas'));
            /* les bords ÉTROITS. Le pavé ne doit JAMAIS défiler — ses
               dernières touches (−, ⌫, ⏎) seraient cachées — et c'est ce
               que Turquet a vu sur sa tablette : à 1024 px la mesure tenait
               de justesse, la sienne défilait. On mesure donc à 1024 (iPad
               classique), à 960 (tablette Android à 1,33) et à 853 (tablette
               Android 8 pouces à 1,5 — là où les libellés courts ne tiennent
               plus et où seules les ICÔNES laissent le pavé entier : à 960,
               avec la police de repli du banc, le palier des icônes retiré
               restait vert, le sabotage n'atteignait rien) : pavé entier, à
               côté des commandes ; et à 800 (téléphone couché) : le pavé
               repasse AU-DESSUS des commandes, entier lui aussi. */
            const etroits = {};
            for(const [w, h] of [[1024, 768], [960, 600], [853, 533]]){
              await s.page.setViewportSize({ width: w, height: h });
              await s.page.waitForTimeout(300);
              await s.page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
              await s.page.waitForTimeout(100);
              await s.page.focus(P.pave.champ);
              await s.page.waitForTimeout(400);
              const q = await s.page.evaluate(mesurerPave, P.pave.champ);
              etroits[w] = q;
              verifier('en paysage à ' + w + ' px, la rangée de touches occupe toute la largeur libre',
                q.rangeeG <= 20 && q.rangeeD >= bordLibre(q) - 28,
                'la rangée va de ' + q.rangeeG + 'px à ' + q.rangeeD + 'px pour un bord libre à ' + bordLibre(q) + 'px');
              verifier('en paysage à ' + w + ' px, le pavé tient en entier à côté des commandes, sans défiler',
                q.visible && !q.deborde && !q.surCommandes && !!q.cmd && q.cmd.memeLigne === true && q.petites === 0,
                !q.visible ? 'le pavé reste caché' : q.deborde ? ('le pavé défile : ' + q.largeur + 'px de large, commandes dès ' + (q.cmd ? q.cmd.gauche : '?') + 'px')
                  : q.surCommandes ? 'il recouvre les commandes' : q.petites ? (q.petites + ' touche(s) trop petites') : 'le pavé et les commandes ne sont plus sur la même ligne');
            }
            /* une ROTATION sans quitter la case : le pavé reste ouvert et la
               place disponible a changé — ici les commandes repassent des
               ICÔNES aux libellés courts, donc elles s'élargissent. Sans
               remesure, le pavé garderait la largeur d'avant et s'étendrait
               PAR-DESSUS elles. On ne refocalise donc pas : c'est l'écouteur
               du moteur qui doit agir. */
            await s.page.setViewportSize({ width: 1366, height: 1024 });
            await s.page.waitForTimeout(500);
            const qr = await s.page.evaluate(mesurerPave, P.pave.champ);
            verifier('après une rotation, le pavé se remesure sans qu’on quitte la case',
              qr.visible && !qr.surCommandes && qr.rangeeG <= 20 && qr.rangeeD <= bordLibre(qr) - 4 && qr.rangeeD >= bordLibre(qr) - 40,
              !qr.visible ? 'le pavé s’est refermé' : qr.surCommandes ? 'il recouvre les commandes'
                : 'la rangée va de ' + qr.rangeeG + 'px à ' + qr.rangeeD + 'px pour un bord libre à ' + bordLibre(qr) + 'px');
            /* les touches SUIVENT la définition de l'écran : plus larges à
               1180 qu'à 853 — c'est le bord qui attrape un pavé revenu à sa
               largeur fixe, où elles mesurent 40 px partout. */
            verifier('les touches du pavé suivent la définition de l’écran',
              p.toucheEtroite > etroits[853].toucheEtroite + 4,
              'touches de ' + etroits[853].toucheEtroite + 'px à 853 px et de ' + p.toucheEtroite + 'px à 1180 px');
            /* Le bord OPPOSÉ : sur un écran très large, une touche ne devient
               pas une BARRE — elle s'arrête au plafond et la rangée se centre. */
            await s.page.setViewportSize({ width: 1600, height: 900 });
            await s.page.waitForTimeout(300);
            await s.page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
            await s.page.waitForTimeout(100);
            await s.page.focus(P.pave.champ);
            await s.page.waitForTimeout(400);
            const q16 = await s.page.evaluate(mesurerPave, P.pave.champ);
            verifier('sur un très grand écran, les touches s’arrêtent à ' + LP.toucheMax + 'px et la rangée se centre',
              q16.toucheLarge <= LP.toucheMax + 1 && Math.abs((q16.rangeeG - q16.gauche) - (q16.droite - q16.rangeeD)) <= 12,
              'touches de ' + q16.toucheLarge + 'px, rangée à ' + (q16.rangeeG - q16.gauche) + 'px du bord gauche du pavé et '
                + (q16.droite - q16.rangeeD) + 'px du droit');
            await s.page.setViewportSize({ width: 800, height: 600 });
            await s.page.waitForTimeout(300);
            await s.page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
            await s.page.waitForTimeout(100);
            await s.page.focus(P.pave.champ);
            await s.page.waitForTimeout(400);
            const q8 = await s.page.evaluate(mesurerPave, P.pave.champ);
            verifier('en paysage à 800 px, la rangée de touches occupe toute la largeur de l’écran',
              q8.rangeeG <= 20 && q8.rangeeD >= q8.fenetre.w - 28,
              'la rangée va de ' + q8.rangeeG + 'px à ' + q8.rangeeD + 'px sur ' + q8.fenetre.w + 'px');
            verifier('en paysage à 800 px, le pavé repasse entier au-dessus des commandes',
              q8.visible && !q8.deborde && !q8.surCommandes && !!q8.cmd && q8.bas <= q8.cmd.haut && q8.rangees === 1,
              !q8.visible ? 'le pavé reste caché' : q8.deborde ? 'le pavé défile' : q8.surCommandes ? 'il recouvre les commandes'
                : ('pavé fini à ' + q8.bas + 'px, commandes dès ' + (q8.cmd ? q8.cmd.haut : '?') + 'px, ' + q8.rangees + ' rangée(s)'));
          }
        }
      }
      await s.nav.close(); s = null;

      /* ---- les cases MATHÉMATIQUES confiées au pavé, sur un contexte TACTILE ----
         Là où le niveau confie ses cases MathLive au pavé (PAVE_MF), le clavier
         MathLive complet ne doit PAS se déployer au focus — c'est un contexte
         à hasTouch, où sa politique « auto » l'ouvrirait —, le pavé s'ouvre à
         sa place, ses touches écrivent DANS la case (la valeur lue par la
         page, et l'événement input que la correction en direct écoute), le
         bouton ⌨️ ouvre toujours le clavier complet — et le pavé se tait tant
         qu'il est déployé, puis revient. */
      if(!P.pave.maths){
        ignorer('sur une case MathLive confiée au pavé, c\'est le pavé qui s\'ouvre, pas le clavier complet',
          'ce fichier ne confie aucune case mathématique au pavé');
      } else {
        s = await ouvrir(chromium, ml, { viewport: { width: 820, height: 1180 }, hasTouch: true });
        if(await connecter(s.page) !== 'scr-space'){
          ignorer('sur une case MathLive confiée au pavé, c\'est le pavé qui s\'ouvre, pas le clavier complet', 'connexion impossible');
        } else {
          await ouvrirExoPave(s.page, P.pave.maths.exercice);
          const pret = await s.page.evaluate(ch => {
            const el = document.querySelector(ch);
            if(!el || el.tagName !== 'MATH-FIELD') return { absent: true };
            window.__pvInputs = 0; window.__pvChanges = 0;
            el.addEventListener('input', () => { window.__pvInputs++; });
            el.addEventListener('change', () => { window.__pvChanges++; });
            return { absent: false, marquee: el.hasAttribute('data-pave'), politique: el.mathVirtualKeyboardPolicy };
          }, P.pave.maths.champ);
          if(pret.absent){
            verifier('sur une case MathLive confiée au pavé, c\'est le pavé qui s\'ouvre, pas le clavier complet', false,
              'la case ' + P.pave.maths.champ + ' n\'est pas un <math-field> de cet écran');
          } else {
            await s.page.focus(P.pave.maths.champ);
            await s.page.waitForTimeout(600);
            const k = await s.page.evaluate(ch => {
              const el = document.querySelector(ch), pave = document.getElementById('paveNum');
              const vk = window.mathVirtualKeyboard;
              const kb = document.querySelector('body > .ML__keyboard');
              const kr = kb ? kb.getBoundingClientRect() : null;
              const pr = pave ? pave.getBoundingClientRect() : null;
              return { paveVisible: !!(pave && !pave.hidden && pr.height > 0),
                       complet: !!(vk && vk.visible) || !!(kr && kr.height > 0 && kr.bottom > 0 && kr.top < window.innerHeight),
                       focus: document.activeElement === el, politique: el.mathVirtualKeyboardPolicy };
            }, P.pave.maths.champ);
            verifier('sur une case MathLive confiée au pavé, c\'est le pavé qui s\'ouvre, pas le clavier complet',
              pret.marquee && k.paveVisible && !k.complet,
              !pret.marquee ? 'la case n\'est pas marquée data-pave' : !k.paveVisible ? 'le pavé reste caché'
                : 'le clavier MathLive complet est déployé (politique « ' + k.politique + ' »)');
            const t3 = await frapper(s.page, P.pave.maths.champ, P.pave.maths.frappe);
            /* MathLive lève « input » APRÈS coup, jamais dans le tour de la
               commande : lu tout de suite, le compteur accusait la page d'un
               événement manquant (sondé : 0 tout de suite, 3 après 150 ms) */
            await s.page.waitForTimeout(300);
            const ev = await s.page.evaluate(() => ({ inputs: window.__pvInputs, changes: window.__pvChanges }));
            verifier('les touches écrivent dans la case MathLive — valeur lue par la page, événement input, focus gardé',
              t3.valeur === P.pave.maths.attendu && t3.focus === true && ev.inputs >= P.pave.maths.frappe.length,
              '« ' + t3.valeur + ' » au lieu de « ' + P.pave.maths.attendu + ' », focus ' + (t3.focus ? 'gardé' : 'perdu')
              + ', ' + ev.inputs + ' événement(s) input sur ' + P.pave.maths.frappe.length);
            /* ⌨️ : le clavier complet reste atteignable, le pavé se tait, puis revient */
            await s.page.evaluate(() => { pmKB(); });
            await s.page.waitForTimeout(500);
            const o = await s.page.evaluate(() => {
              const pave = document.getElementById('paveNum'), vk = window.mathVirtualKeyboard;
              const pr = pave.getBoundingClientRect();
              return { complet: !!(vk && vk.visible), paveVisible: !pave.hidden && pr.height > 0 };
            });
            await s.page.evaluate(ch => { window.mathVirtualKeyboard.hide(); document.querySelector(ch).focus(); }, P.pave.maths.champ);
            await s.page.waitForTimeout(500);
            const o2 = await s.page.evaluate(() => {
              const pave = document.getElementById('paveNum'), vk = window.mathVirtualKeyboard;
              const pr = pave.getBoundingClientRect();
              return { complet: !!(vk && vk.visible), paveVisible: !pave.hidden && pr.height > 0 };
            });
            verifier('⌨️ ouvre encore le clavier MathLive complet ; le pavé se tait tant qu\'il est déployé, et revient ensuite',
              o.complet && !o.paveVisible && !o2.complet && o2.paveVisible,
              !o.complet ? '⌨️ n\'ouvre plus le clavier complet' : o.paveVisible ? 'deux claviers à la fois : le pavé reste ouvert sous le clavier complet'
                : o2.complet ? 'le clavier complet ne se referme pas' : 'le pavé ne revient pas une fois le clavier complet refermé');
            /* ⏎ sur une case MathLive : l'événement change, celui qui fait passer à la case suivante */
            await s.page.click('#paveNum button[data-t="⏎"]');
            await s.page.waitForTimeout(200);
            const ev2 = await s.page.evaluate(() => window.__pvChanges);
            verifier('⏎ sur une case MathLive lève l\'événement change — la case suivante', ev2 >= 1, 'aucun événement change');
          }
        }
        await s.nav.close(); s = null;
      }
    }

    /* ---- 11 bis. Le manifeste d'application, tablettes seulement ---------
       Ce que jsdom ne voit pas : l'ADRESSE réelle du manifeste, dérivée de
       celle de la page ouverte (jsdom n'en a aucune), le fichier que cette
       adresse désigne, et les icônes telles que Chromium les DÉCODE — un PNG
       tronqué ou une taille fausse rendrait le site non installable sans
       qu'aucune erreur ne se lève. On ouvre la page au pointeur fin (aucun
       manifeste ne doit paraître), on force le tactile, et on relit tout
       depuis ce que la page a posé.
       La page est servie en HTTP local, pas en file:// : un service worker
       ne s'enregistre pas depuis file://, et c'est lui que la tablette de
       Turquet réclamait — Chrome y proposait un RACCOURCI au lieu d'une
       installation, avec un manifeste que Chromium déclarait sans défaut
       (septembre 2026). Trois mesures de plus, dans l'ordre : le service
       worker actif, le verdict d'installabilité de CHROMIUM LUI-MÊME
       (protocole DevTools — le pipeline entier, manifeste, page de départ,
       icônes ; « in-incognito » est écarté, un contexte Playwright l'est
       toujours et l'installation n'y est pas le sujet), puis le serveur
       FERMÉ et la page redemandée : le service worker doit répondre « Pas de
       connexion », jamais l'erreur brute du navigateur. */
    titre('11 bis. LE MANIFESTE D\'APPLICATION (TABLETTES SEULEMENT)');
    const serveurM = await servirRacine();
    const adresseM = serveurM.url + '/' + CIBLE;
    s = await ouvrir(chromium, ml, { adresse: adresseM });
    const avantM = await s.page.evaluate(() => ({
      lien: !!document.querySelector('link[rel="manifest"]'),
      tactile: typeof tabletteActive === 'function' ? tabletteActive() : null,
    }));
    verifier('sur ordinateur, aucun manifeste n\'est déclaré',
      !avantM.lien && avantM.tactile === false,
      avantM.lien ? 'un <link rel="manifest"> est déjà posé au pointeur fin'
                  : 'tabletteActive() rend ' + avantM.tactile + ' au pointeur fin');
    const apresM = await s.page.evaluate(() => {
      window.__tabletteForce = true; manifesteTablette();
      const l = document.querySelector('link[rel="manifest"]');
      return { href: l ? l.href : null, page: location.pathname };
    });
    let manif = null, cheminM = null;
    try{ cheminM = path.join(RACINE, decodeURIComponent(new URL(apresM.href).pathname)); manif = JSON.parse(fs.readFileSync(cheminM, 'utf8')); }
    catch(e){ manif = null; }
    verifier('en tactile, le lien posé désigne un manifeste du dépôt, lisible',
      !!manif, apresM.href ? 'lien ' + apresM.href + ' : fichier absent ou illisible' : 'aucun lien posé');
    const departM = manif && manif.start_url ? new URL(manif.start_url, apresM.href).pathname : null;
    /* Le mode d'affichage vit dans tests/profils.js — deux sources. La
       Première demande « fullscreen » : Chrome cache alors la barre de
       navigation d'Android, celle que Turquet voulait retirer. */
    const displayM = P.manifeste && P.manifeste.display;
    verifier('le manifeste ouvre CETTE page en mode application ' + JSON.stringify(displayM),
      !!manif && departM === apresM.page && !!displayM && manif.display === displayM,
      !manif ? 'pas de manifeste' : !displayM ? 'ce niveau ne déclare pas « manifeste » dans tests/profils.js'
        : 'start_url mène à ' + departM + ' (page : ' + apresM.page + '), display ' + JSON.stringify(manif.display)
          + ' (attendu : ' + JSON.stringify(displayM) + ')');
    const iconesM = manif && Array.isArray(manif.icons) ? manif.icons.map(i => ({
      src: new URL(i.src, apresM.href).href, sizes: String(i.sizes || '') })) : [];
    const decodees = await s.page.evaluate(async (liste) => {
      const out = [];
      for(const ic of liste){
        await new Promise(r => {
          const im = new Image();
          im.onload = () => { out.push({ src: ic.src, sizes: ic.sizes, w: im.naturalWidth, h: im.naturalHeight }); r(); };
          im.onerror = () => { out.push({ src: ic.src, sizes: ic.sizes, w: 0, h: 0 }); r(); };
          im.src = ic.src;
        });
      }
      return out;
    }, iconesM);
    const fautives = decodees.filter(d => d.w + 'x' + d.h !== d.sizes);
    verifier('chaque icône du manifeste se décode dans Chromium à la taille annoncée',
      decodees.length > 0 && fautives.length === 0,
      decodees.length === 0 ? 'aucune icône' : fautives.map(d => d.src.split('/').pop() + ' : ' + d.w + '×' + d.h + ' pour ' + d.sizes).join(' ; '));
    const swM = await s.page.evaluate(() => Promise.race([
      navigator.serviceWorker.ready.then(r => ({ script: r.active ? r.active.scriptURL : null, scope: r.scope })),
      new Promise(res => setTimeout(() => res(null), 10000)),
    ]));
    const porteeM = new URL('./', adresseM).href;
    verifier('en tactile, le service worker sw.js est enregistré et actif sur le dossier de la page',
      !!swM && /\/sw\.js$/.test(String(swM.script || '')) && swM.scope === porteeM,
      !swM ? 'aucun service worker actif après 10 s' : 'script ' + swM.script + ', portée ' + swM.scope + ' (attendue : ' + porteeM + ')');
    let installM;
    try{
      const cdp = await s.page.context().newCDPSession(s.page);
      const r = await cdp.send('Page.getInstallabilityErrors');
      installM = (r.installabilityErrors || []).map(e => e.errorId).filter(id => id !== 'in-incognito');
      await cdp.detach();
    } catch(e){ installM = ['protocole DevTools indisponible : ' + e.message]; }
    verifier('Chromium lui-même ne trouve aucun défaut d\'installabilité (manifeste, page de départ, icônes)',
      installM.length === 0, installM.join(', '));
    verifier('déclarer le manifeste ne lève aucune erreur JavaScript',
      s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
    await serveurM.fermer();
    let horsM;
    try{
      const rep = await s.page.goto(adresseM, { waitUntil: 'domcontentloaded', timeout: 20000 });
      horsM = { status: rep ? rep.status() : null,
                texte: await s.page.evaluate(() => document.body ? document.body.textContent : ''),
                page: await s.page.evaluate(() => typeof APP_VERSION) };
    } catch(e){ horsM = { status: null, texte: '', page: 'undefined', erreur: e.message }; }
    verifier('hors connexion, la page installée montre « Pas de connexion » au lieu de l\'erreur du navigateur',
      horsM.status === 200 && /Pas de connexion/.test(horsM.texte) && horsM.page === 'undefined',
      horsM.erreur ? 'la navigation échoue : ' + horsM.erreur
                   : 'statut ' + horsM.status + (horsM.page !== 'undefined' ? ', la page ELLE-MÊME est servie hors connexion (un cache ?)' : ', texte : ' + String(horsM.texte).trim().slice(0, 80)));
    await s.nav.close(); s = null;

    /* ---- 11 ter. Le clavier mathématique à l'écran sur un TÉLÉPHONE en portrait --
       Demande de Turquet (septembre 2026) : « sur les portables, au format
       portrait, réduire la taille des touches », et nommer les deux couches
       « clavier A » / « clavier B ». jsdom lit la DISPOSITION (les libellés,
       la largeur déclarée) ; seul un navigateur sait quelle hauteur une touche
       PREND, si son libellé y tient sans être coupé, et si la couche change
       au clic. On ouvre la page à la taille d'un téléphone (390 × 844,
       tactile), l'exercice déclaré, on déploie le clavier ANCRÉ, on mesure
       les touches RENDUES contre les plafonds du profil, on clique
       « clavier B » puis « clavier A », puis on élargit la fenêtre à la
       taille d'une tablette : les touches doivent y REGRANDIR — une règle
       qui réduirait partout ne serait pas la règle demandée. */
    titre('11 ter. LE CLAVIER MATHÉMATIQUE SUR UN TÉLÉPHONE EN PORTRAIT');
    if(!(P.clavierEcran && P.clavierEcran.portrait)){
      ignorer('sur un téléphone en portrait, les touches du clavier mathématique sont réduites',
        'ce fichier ne déclare pas de clavier à mesurer');
    } else {
      const K = P.clavierEcran, KP = K.portrait;
      s = await ouvrir(chromium, ml, { viewport: { width: 390, height: 844 }, hasTouch: true });
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('sur un téléphone en portrait, les touches du clavier mathématique sont réduites', 'connexion impossible');
      } else {
        await s.page.evaluate(i => openTest(i), KP.exercice);
        await s.page.waitForTimeout(300);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(800);
        /* le clavier se déploie par la case (politique « auto » en tactile),
           sinon par le vrai bouton ⌨️ — jamais les deux : le bouton BASCULE */
        await s.page.click(KP.champ);
        await s.page.waitForTimeout(700);
        const deploye = await s.page.evaluate(() => !!(window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible));
        if(!deploye){ await s.page.click(KP.bouton); await s.page.waitForTimeout(900); }
        /* la géométrie du clavier ANCRÉ, au RECTANGLE : la touche « 5 » de la
           couche visible, la plus grande police qui s'y rend, les deux touches
           de bascule et leur libellé coupé ou non, le débord à droite */
        const mesurerKb = ({ versA, versB }) => {
          const kb = document.querySelector('body > .ML__keyboard');
          const vk = window.mathVirtualKeyboard;
          if(!kb) return { absent: true, visible: !!(vk && vk.visible) };
          const vis = el => { const q = el.getBoundingClientRect(); return q.width > 2 && q.height > 2; };
          const caps = [...kb.querySelectorAll('.MLK__rows > .MLK__row > *')].filter(vis);
          const de = t => caps.find(c => c.textContent.trim() === t) || null;
          const info = el => { if(!el) return null; const q = el.getBoundingClientRect();
            return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2),
                     w: Math.round(q.width), h: Math.round(q.height), coupe: el.scrollWidth > el.clientWidth + 1 }; };
          const police = el => { if(!el) return 0; let m = parseFloat(getComputedStyle(el).fontSize) || 0;
            el.querySelectorAll('*').forEach(x => { m = Math.max(m, parseFloat(getComputedStyle(x).fontSize) || 0); }); return Math.round(m * 10) / 10; };
          /* le clavier ANCRÉ occupe toute la fenêtre (son fond) : sa hauteur
             utile est celle de la plaque des touches */
          const cinq = de('5'), kr = (kb.querySelector('.MLK__plate') || kb).getBoundingClientRect();
          const hauteurs = []; caps.forEach(c => { const h = Math.round(c.getBoundingClientRect().height); if(hauteurs.indexOf(h) < 0) hauteurs.push(h); });
          return { visible: !!(vk && vk.visible), fenetre: { w: window.innerWidth, h: window.innerHeight },
                   clavier: { h: Math.round(kr.height), part: Math.round(100 * kr.height / window.innerHeight) },
                   touche: info(cinq), police: police(cinq), hauteurs: hauteurs.sort((a, b) => a - b),
                   debord: Math.round(Math.max(0, ...caps.map(c => c.getBoundingClientRect().right)) - window.innerWidth),
                   versA: info(de(versA)), versB: info(de(versB)), fn: !!de('fn'), n123: !!de('123') };
        };
        const tel = await s.page.evaluate(mesurerKb, { versA: K.versA, versB: K.versB });
        verifier('sur un téléphone en portrait, les touches du clavier mathématique sont réduites',
          !tel.absent && tel.visible && tel.touche && tel.touche.h <= KP.hauteurMax && tel.police <= KP.policeMax
            && tel.debord <= 1,
          tel.absent ? 'aucun clavier ancré dans la page' + (tel.visible ? '' : ' (le clavier ne se déploie pas)')
            : !tel.visible ? 'le clavier ne se déploie pas'
            : !tel.touche ? 'la touche « 5 » est introuvable sur la couche visible'
            : 'touche « 5 » : ' + tel.touche.w + '×' + tel.touche.h + ' px (plafond ' + KP.hauteurMax + '), police ' + tel.police + ' px (plafond ' + KP.policeMax + ')'
              + ', hauteurs ' + tel.hauteurs.join('/') + ', clavier ' + tel.clavier.h + ' px = ' + tel.clavier.part + ' % de l\'écran'
              + (tel.debord > 1 ? ', DÉBORDE de ' + tel.debord + ' px à droite' : ''));
        /* la bascule : « clavier B » mène à la seconde couche (les chiffres
           disparaissent), « clavier A » en revient — cliquées pour de vrai */
        let apresB = null, apresA = null;
        if(tel.versB){
          await s.page.mouse.click(tel.versB.x, tel.versB.y); await s.page.waitForTimeout(350);
          apresB = await s.page.evaluate(mesurerKb, { versA: K.versA, versB: K.versB });
          if(apresB.versA){
            await s.page.mouse.click(apresB.versA.x, apresB.versA.y); await s.page.waitForTimeout(350);
            apresA = await s.page.evaluate(mesurerKb, { versA: K.versA, versB: K.versB });
          }
        }
        verifier('« clavier B » mène à la seconde couche, « clavier A » en revient, et leurs libellés tiennent dans leur touche',
          !!tel.versB && !tel.versB.coupe && !tel.fn && !tel.n123
            && !!apresB && !!apresB.versA && !apresB.versA.coupe && !apresB.touche && !apresB.fn && !apresB.n123
            && !!apresA && !!apresA.touche && !!apresA.versB,
          !tel.versB ? 'aucune touche « ' + K.versB + ' » sur la première couche' + (tel.fn ? ' (une touche dit encore « fn »)' : '')
            : tel.versB.coupe ? 'le libellé « ' + K.versB + ' » est coupé dans sa touche (' + tel.versB.w + ' px de large)'
            : (tel.fn || tel.n123) ? 'une touche dit encore « fn » ou « 123 »'
            : !apresB.versA ? 'après « ' + K.versB + ' », aucune touche « ' + K.versA + ' »' + (apresB.n123 ? ' (une touche dit encore « 123 »)' : '')
            : apresB.versA.coupe ? 'le libellé « ' + K.versA + ' » est coupé dans sa touche (' + apresB.versA.w + ' px de large)'
            : apresB.touche ? 'après « ' + K.versB + ' », les chiffres sont toujours là : la couche n\'a pas changé'
            : !(apresA && apresA.touche) ? 'après « ' + K.versA + ' », les chiffres ne reviennent pas'
            : 'une touche dit encore « fn » ou « 123 » sur la seconde couche');
        /* et sur une tablette, la même page, le même clavier : les touches
           reprennent leur taille — la règle vise le téléphone, pas le tactile */
        await s.page.setViewportSize({ width: 820, height: 1180 });
        await s.page.waitForTimeout(700);
        const tab = await s.page.evaluate(mesurerKb, { versA: K.versA, versB: K.versB });
        verifier('sur une tablette en portrait, les touches reprennent leur taille',
          !!(tab.touche && tel.touche) && tab.visible && tab.touche.h >= tel.touche.h + 8 && tab.police >= tel.police + 3,
          !tab.visible ? 'le clavier s\'est refermé au changement de taille'
            : !tab.touche ? 'la touche « 5 » est introuvable'
            : 'touche « 5 » : ' + tab.touche.h + ' px sur tablette contre ' + (tel.touche ? tel.touche.h : '?') + ' sur téléphone, police '
              + tab.police + ' contre ' + tel.police);
        verifier('le clavier du téléphone ne lève aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ---- 11 sexies. Le clavier de la TABLETTE : deux couches, touches réduites ----
       Demande de Turquet (septembre 2026), sur le clavier du 6.9 : « faire
       passer les touches U.., n, inf, --> et l'intégrale sur le clavier B ; une
       ligne en moins dans le clavier A ; et réduire légèrement la taille des
       touches ». jsdom lit la DISPOSITION déclarée ; seul un navigateur sait
       combien de rangées se RENDENT, quelle hauteur une touche prend sur une
       tablette, et ce qui apparaît vraiment quand on change de couche. On ouvre
       l'exercice déclaré sur une tablette tactile, on déploie le clavier ANCRÉ,
       on compte les rangées du clavier A et on y CHERCHE les touches parties —
       puis on clique « clavier B » et on exige de les y trouver. */
    titre('11 sexies. LE CLAVIER DE LA TABLETTE : DEUX COUCHES, TOUCHES RÉDUITES');
    if(!(P.clavierEcran && P.clavierEcran.tablette)){
      ignorer('sur une tablette, le clavier A tient sur moins de rangées et ses touches sont réduites',
        'ce fichier ne déclare pas de clavier de tablette');
    } else {
      const K = P.clavierEcran, KT = K.tablette, KC = K.couches || {};
      /* La tablette du banc est DEBOUT (820 × 1180) : quand le fichier déclare
         une forme de portrait, c'est elle qui doit s'y rendre — les rangées
         attendues viennent de là. La forme normale est reprise plus bas, la
         fenêtre tournée en paysage. */
      const KP = KC.courte || null;
      const attA = KP ? KP.rangeesA : (KC.rangeesA || 4), attB = KP ? KP.rangeesB : (KC.rangeesB || 4);
      s = await ouvrir(chromium, ml, { viewport: { width: 820, height: 1180 }, hasTouch: true });
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('sur une tablette, le clavier A tient sur moins de rangées et ses touches sont réduites', 'connexion impossible');
      } else {
        await s.page.evaluate(i => openTest(i), KT.exercice);
        await s.page.waitForTimeout(300);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(900);
        await s.page.click(KT.champ);
        await s.page.waitForTimeout(700);
        const deploye = await s.page.evaluate(() => !!(window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible));
        if(!deploye){ await s.page.click(KT.bouton); await s.page.waitForTimeout(900); }
        /* On mesure un clavier STABLE, jamais à délai fixe : ce contrôle a rougi
           une fois sur trois exécutions (« encore sur le clavier A : n »), sous
           forte charge — trois bancs et deux campagnes en parallèle —, et dix
           ouvertures isolées n'ont rien reproduit. Un délai fixe mesure ce qui se
           trouve là à cet instant, un clavier en cours de (re)construction
           compris ; on attend que la couche visible garde le MÊME jeu de touches
           d'un quart de seconde au suivant, et on le dit si elle n'y arrive pas. */
        const stable = await s.page.evaluate(async () => {
          const sig = () => { const kb = document.querySelector('body > .ML__keyboard'); if(!kb) return '';
            return [...kb.querySelectorAll('.MLK__layer.is-visible .MLK__rows > .MLK__row > *')]
              .filter(el => { const q = el.getBoundingClientRect(); return q.width > 2 && q.height > 2; })
              .map(el => el.textContent.trim()).join('|'); };
          const vk = window.mathVirtualKeyboard; const t0 = Date.now(); let a = sig();
          while(Date.now() - t0 < 6000){
            await new Promise(r => setTimeout(r, 250));
            const b = sig(); if(vk && vk.visible && b && b === a) return { ok: true, ms: Date.now() - t0 };
            a = b;
          }
          return { ok: false, ms: Date.now() - t0 };
        });
        verifier('le clavier de la tablette est stable avant qu\'on le mesure', stable.ok,
          'la couche visible change encore après ' + stable.ms + ' ms');
        /* la couche RENDUE — celle que MathLive déclare visible (is-visible), pas
           tout ce qui a un rectangle — : ses rangées, sa touche témoin, et qui s'y trouve */
        const mesurerCouche = ({ versA, versB }) => {
          const kb = document.querySelector('body > .ML__keyboard');
          const vk = window.mathVirtualKeyboard;
          if(!kb) return { absent: true, visible: !!(vk && vk.visible) };
          const vis = el => { const q = el.getBoundingClientRect(); return q.width > 2 && q.height > 2; };
          const caps = [...kb.querySelectorAll('.MLK__layer.is-visible .MLK__rows > .MLK__row > *')].filter(vis);
          /* Une touche se reconnaît à son TEXTE… sauf celles que MathLive dessine
             au lieu de les écrire : « ⟶ » (\longrightarrow) est une flèche
             étirable, composée de morceaux, et son textContent est VIDE. On
             accepte donc aussi la valeur que MathLive pose sur la touche — sans
             quoi le contrôle chercherait une touche bien présente et dirait
             qu'elle manque. */
          const val = c => c.getAttribute('data-keycap-value') || c.getAttribute('aria-label') || '';
          const de = t => caps.find(c => c.textContent.trim() === t || val(c) === t) || null;
          const info = el => { if(!el) return null; const q = el.getBoundingClientRect();
            return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2),
                     w: Math.round(q.width), h: Math.round(q.height) }; };
          const police = el => { if(!el) return 0; let m = parseFloat(getComputedStyle(el).fontSize) || 0;
            el.querySelectorAll('*').forEach(x => { m = Math.max(m, parseFloat(getComputedStyle(x).fontSize) || 0); }); return Math.round(m * 10) / 10; };
          const tops = []; caps.forEach(c => { const t = Math.round(c.getBoundingClientRect().top);
            if(!tops.some(v => Math.abs(v - t) < 6)) tops.push(t); });
          const cinq = de('5');
          /* DEUX touches d'UNE unité posées sur des rangées DIFFÉRENTES : elles
             doivent faire la même largeur. C'est ainsi que se voit une rangée
             qui s'est rétrécie SEULE — MathLive ne déborde pas, il resserre la
             rangée trop large et laisse les autres à leur taille, et l'élève a
             deux tailles de touches sur le même écran. */
          const large = el => el ? Math.round(el.getBoundingClientRect().width) : null;
          const plaque = kb.querySelector('.MLK__plate');
          return { visible: !!(vk && vk.visible), rangees: tops.length,
                   unite: [large(de('∞')), large(de('π'))],
                   touche: info(cinq), police: police(cinq),
                   plaque: Math.round((plaque || kb).getBoundingClientRect().height),
                   uniteA: [large(de('7')), large(de('1'))],
                   debord: Math.round(Math.max(0, ...caps.map(c => c.getBoundingClientRect().right)) - window.innerWidth),
                   inf: !!de('∞'), integ: !!de('∫'), n: !!de('n'), cinqLa: !!cinq,
                   f: !!de('f'), x: !!de('x'), vers: !!de('\\longrightarrow'),
                   versA: info(de(versA)), versB: info(de(versB)) };
        };
        const cA = await s.page.evaluate(mesurerCouche, { versA: K.versA, versB: K.versB });
        verifier('sur une tablette, le clavier A tient sur ' + attA + ' rangées et ses touches sont réduites',
          !cA.absent && cA.visible && cA.rangees === attA
            && !!cA.touche && cA.touche.h <= KT.hauteurMax && cA.police <= KT.policeMax && cA.debord <= 1,
          cA.absent ? 'aucun clavier ancré dans la page'
            : !cA.visible ? 'le clavier ne se déploie pas'
            : cA.rangees !== attA ? cA.rangees + ' rangée(s) rendue(s) au lieu de ' + attA
            : !cA.touche ? 'la touche « 5 » est introuvable sur le clavier A'
            : 'touche « 5 » : ' + cA.touche.w + '×' + cA.touche.h + ' px (plafond ' + KT.hauteurMax + '), police '
              + cA.police + ' px (plafond ' + KT.policeMax + ')'
              + (cA.debord > 1 ? ', DÉBORDE de ' + cA.debord + ' px à droite' : ''));
        verifier('les touches ∞, ∫ et la variable n ont quitté le clavier A',
          !cA.inf && !cA.integ && !cA.n && cA.cinqLa,
          !cA.cinqLa ? 'le clavier A n\'a même plus ses chiffres'
            : 'encore sur le clavier A : ' + [cA.inf ? '∞' : '', cA.integ ? '∫' : '', cA.n ? 'n' : ''].filter(Boolean).join(' '));
        /* et on les trouve sur le clavier B, cliqué pour de vrai */
        let cB = null;
        if(cA.versB){ await s.page.mouse.click(cA.versB.x, cA.versB.y); await s.page.waitForTimeout(400);
          cB = await s.page.evaluate(mesurerCouche, { versA: K.versA, versB: K.versB }); }
        verifier('elles sont sur le clavier B, qui tient sur ' + attB + ' rangées',
          !!cB && cB.inf && cB.integ && cB.n && !cB.cinqLa && cB.rangees === attB && cB.debord <= 1,
          !cA.versB ? 'aucune touche « ' + K.versB +' » sur le clavier A'
            : !cB ? 'la seconde couche ne se rend pas'
            : cB.cinqLa ? 'les chiffres sont toujours là : la couche n\'a pas changé'
            : (!cB.inf || !cB.integ || !cB.n) ? 'manque sur le clavier B : '
                + [cB.inf ? '' : '∞', cB.integ ? '' : '∫', cB.n ? '' : 'n'].filter(Boolean).join(' ')
            : cB.rangees + ' rangée(s) rendue(s) au lieu de ' + (attB)
              + (cB.debord > 1 ? ', et il DÉBORDE de ' + cB.debord + ' px' : ''));
        /* LA TABLETTE TOURNÉE EN PAYSAGE : la forme COURTE aussi, et des touches
           PLUS PETITES (demande de Turquet, septembre 2026 — « en mode paysage,
           les touches doivent être plus petites de façon à tenir sur 3 lignes »).
           En paysage l'écran est COURT, et la plaque de quatre rangées y prenait
           un quart de ce que l'élève a devant lui : c'est la HAUTEUR de la plaque
           qu'on mesure, pas seulement le compte de rangées — trois rangées de
           grosses touches ne rendraient rien. Le clavier se reconstruit à la
           rotation (kbOnRotate) et revient sur le clavier A ; s'il restait sur B,
           on l'y ramène par sa touche. */
        if(KP){
          await s.page.setViewportSize({ width: 1180, height: 820 });
          await s.page.waitForTimeout(1200);
          let cL = await s.page.evaluate(mesurerCouche, { versA: K.versA, versB: K.versB });
          if(!cL.cinqLa && cL.versA){
            await s.page.mouse.click(cL.versA.x, cL.versA.y); await s.page.waitForTimeout(400);
            cL = await s.page.evaluate(mesurerCouche, { versA: K.versA, versB: K.versB });
          }
          const PY = KT.paysage || {};
          verifier('tournée en paysage, la tablette garde les ' + attA + ' rangées et réduit ses touches',
            cL.visible && cL.cinqLa && cL.rangees === attA && cL.debord <= 1
              && !!cL.touche && (!PY.hauteurMax || cL.touche.h <= PY.hauteurMax)
              && (!PY.policeMax || cL.police <= PY.policeMax)
              && (!PY.plaqueMax || cL.plaque <= PY.plaqueMax),
            !cL.visible ? 'le clavier s\'est refermé à la rotation'
              : !cL.cinqLa ? 'le clavier A ne revient pas à la rotation'
              : cL.rangees !== attA ? cL.rangees + ' rangée(s) rendue(s) en paysage au lieu de ' + attA
              : !cL.touche ? 'la touche « 5 » est introuvable en paysage'
              : 'touche « 5 » : ' + cL.touche.w + '×' + cL.touche.h + ' px (plafond ' + PY.hauteurMax
                + '), police ' + cL.police + ' px (plafond ' + PY.policeMax + '), plaque ' + cL.plaque
                + ' px (plafond ' + PY.plaqueMax + ')'
                + (cL.debord > 1 ? ', DÉBORDE de ' + cL.debord + ' px' : ''));
          /* et le bord opposé de la mesure : le paysage réduit VRAIMENT, il ne
             reprend pas la taille du portrait — une règle média qui cesserait de
             s'appliquer laisserait les trois rangées et des touches de 48 px */
          verifier('les touches du paysage sont plus petites que celles du portrait',
            !!cA.touche && !!cL.touche && cL.touche.h < cA.touche.h && cL.plaque < cA.plaque,
            (cA.touche && cL.touche)
              ? 'debout ' + cA.touche.h + ' px de haut (plaque ' + cA.plaque + '), couché ' + cL.touche.h + ' px (plaque ' + cL.plaque + ')'
              : 'la touche « 5 » est introuvable');
          console.log('   · la plaque du clavier : ' + cA.plaque + ' px debout, ' + cL.plaque
            + ' px couché ; touche « 5 » ' + (cA.touche ? cA.touche.w + '×' + cA.touche.h : '?')
            + ' px debout, ' + (cL.touche ? cL.touche.w + '×' + cL.touche.h : '?') + ' px couché');
        }
        /* UN EXERCICE SUR LES LIMITES : les quatre touches sur le clavier A,
           mesurées sur la couche RENDUE (demande de Turquet, septembre 2026 —
           « quand c'est un exercice sur les limites, mettre les touches inf,
           -->, x, f sur le clavier A »). jsdom lit la disposition déclarée ;
           seul un navigateur dit ce qui s'affiche vraiment quand l'élève ouvre
           l'exercice, et si la rangée qui s'est allongée tient encore dans
           l'écran. On reste en PAYSAGE : c'est là que la place manque. */
        const KL = KT.limites;
        if(KL){
          await s.page.evaluate(i => openTest(i), KL.exercice);
          await s.page.waitForTimeout(400);
          await s.page.evaluate(() => {
            const b = [...document.querySelectorAll('#modeChoices button')]
              .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
            if(b) b.click();
          });
          await s.page.waitForTimeout(1200);
          try{ await s.page.click(KL.champ, { timeout: 6000 }); }catch(e){}
          await s.page.waitForTimeout(700);
          if(!await s.page.evaluate(() => !!(window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible))){
            try{ await s.page.click(KL.bouton, { timeout: 5000 }); }catch(e){}
            await s.page.waitForTimeout(900);
          }
          const cX = await s.page.evaluate(mesurerCouche, { versA: K.versA, versB: K.versB });
          verifier('sur un exercice sur les limites, ∞, ⟶, f et x sont sur le clavier A',
            !cX.absent && cX.visible && cX.cinqLa && cX.inf && cX.vers && cX.f && cX.x
              && !cX.integ && cX.rangees === attA && cX.debord <= 1,
            cX.absent ? 'aucun clavier ancré dans la page'
              : !cX.visible ? 'le clavier ne se déploie pas'
              : !cX.cinqLa ? 'ce n\'est pas le clavier A qui est affiché'
              : cX.integ ? 'l\'intégrale est passée sur le clavier A avec elles'
              : (!cX.inf || !cX.vers || !cX.f || !cX.x) ? 'manque sur le clavier A : '
                  + [cX.inf ? '' : '∞', cX.vers ? '' : '⟶', cX.f ? '' : 'f', cX.x ? '' : 'x'].filter(Boolean).join(' ')
              : cX.rangees + ' rangée(s) rendue(s) au lieu de ' + attA
                + (cX.debord > 1 ? ', et il DÉBORDE de ' + cX.debord + ' px' : ''));
          /* ET LA RANGÉE QUI S'EST ALLONGÉE N'A PAS RÉTRÉCI SEULE : les deux
             touches d'une unité prises sur des rangées différentes du clavier A
             font la même largeur. C'est le bord que --kb-unites tient — et il
             se mesure DEBOUT, pas couché. Mesuré : en PAYSAGE, un compte figé
             trop bas ne fait pas deux tailles de touches, MathLive resserrant
             la plaque ENTIÈRE (toutes les touches à 92 px) — le plafond de
             96 px absorbe l'écart, et le sabotage y reste vert à bon droit. En
             PORTRAIT la largeur mord : les rangées de onze font 70 px et celle
             de douze 64, deux tailles sur le même écran. On tourne donc la
             tablette avant de mesurer. */
          await s.page.setViewportSize({ width: 820, height: 1180 });
          await s.page.waitForTimeout(1200);
          const cP = await s.page.evaluate(mesurerCouche, { versA: K.versA, versB: K.versB });
          const uA = cP.uniteA || [];
          verifier('debout, la rangée allongée n\'a pas rétréci seule : les touches d\'une unité font la même largeur',
            cP.visible && cP.cinqLa && !!uA[0] && !!uA[1] && Math.abs(uA[0] - uA[1]) <= 1,
            !cP.visible ? 'le clavier s\'est refermé à la rotation'
              : !cP.cinqLa ? 'le clavier A ne revient pas à la rotation'
              : (!uA[0] || !uA[1]) ? 'les touches témoins « 7 » et « 1 » sont introuvables sur le clavier A'
              : '« 7 » fait ' + uA[0] + ' px et « 1 » ' + uA[1] + ' px : une rangée s\'est rétrécie seule');
          console.log('   · sur les limites, le clavier A : ' + cX.rangees + ' rangées, touche « 5 » '
            + (cX.touche ? cX.touche.w + '×' + cX.touche.h : '?') + ' px couché, '
            + (cP.touche ? cP.touche.w + '×' + cP.touche.h : '?') + ' px debout ; plaque ' + cX.plaque + ' px couché');
        }
        /* et AUCUNE rangée ne s'est rétrécie seule : les deux touches d'une
           unité prises sur des rangées différentes du clavier B font la même
           largeur. Sans la règle de largeur de la tablette, la rangée la plus
           longue du clavier A se resserre toute seule et celles du clavier B
           restent larges — deux tailles de touches sur un écran. */
        if(KP) verifier('aucune rangée ne se rétrécit seule : les touches d\'une unité font toutes la même largeur',
          !!cB && cB.unite[0] && cB.unite[1] && Math.abs(cB.unite[0] - cB.unite[1]) <= 1,
          !cB ? 'la seconde couche ne se rend pas'
            : (!cB.unite[0] || !cB.unite[1]) ? 'les touches témoins ∞ et π sont introuvables sur le clavier B'
            : '∞ fait ' + cB.unite[0] + ' px et π ' + cB.unite[1] + ' px : une rangée s\'est rétrécie seule');
        verifier('le clavier de la tablette ne lève aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ---- 11 quinquies. Sur une tablette en PAYSAGE, le clavier mathématique tient sur deux rangées, et ⏎ valide ----
       Signalé et demandé par Turquet (septembre 2026) sur le 2.2.10 : « la touche
       valider ne fonctionne pas et ne permet pas de passer à la ligne », et
       « en paysage, le clavier doit prendre moins de place en hauteur ». jsdom
       évalue les dispositions ; seul un navigateur sait combien de rangées se
       RENDENT, et ce que fait la touche cliquée. Tablette tactile en paysage :
       on ouvre l'exercice déclaré, on touche sa feuille (le clavier se déploie
       de lui-même, politique « auto »), on compte les rangées rendues, on
       exige des touches encore touchables et aucun débord, on CLIQUE la vraie
       touche ⏎ — une ligne de plus, le curseur dedans, le clavier toujours
       là — puis on tourne en PORTRAIT, où le clavier prend sa forme de portrait
       (trois rangées sur une tablette, demande de Turquet, septembre 2026 :
       « en mode portrait, que le clavier tienne sur 3 lignes au lieu de 4 »),
       et enfin on rétrécit à la taille d'un TÉLÉPHONE, où les rangées
       d'origine reviennent : la forme courte ne doit pas y fuir. */
    titre('11 quinquies. LE CLAVIER MATHÉMATIQUE SUR UNE TABLETTE EN PAYSAGE');
    if(!(P.clavierEcran && P.clavierEcran.paysage)){
      ignorer('sur une tablette en paysage, le clavier mathématique tient sur moins de rangées', 'ce fichier ne déclare pas de clavier de paysage');
    } else {
      const K = P.clavierEcran, KL = K.paysage;
      s = await ouvrir(chromium, ml, { viewport: { width: 1024, height: 768 }, hasTouch: true });
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('sur une tablette en paysage, le clavier mathématique tient sur moins de rangées', 'connexion impossible');
      } else {
        await s.page.evaluate(i => openTest(i), KL.exercice);
        await s.page.waitForTimeout(300);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(800);
        await s.page.click(KL.champ);
        await s.page.waitForTimeout(900);
        const mesurerRangees = ({ entree, lignes }) => {
          const kb = document.querySelector('body > .ML__keyboard');
          const vk = window.mathVirtualKeyboard;
          if(!kb) return { absent: true, visible: !!(vk && vk.visible) };
          const vis = el => { const q = el.getBoundingClientRect(); return q.width > 2 && q.height > 2; };
          const rangees = [...kb.querySelectorAll('.MLK__rows > .MLK__row')].filter(vis);
          const caps = [...kb.querySelectorAll('.MLK__rows > .MLK__row > *')].filter(vis);
          const plaque = (kb.querySelector('.MLK__plate') || kb).getBoundingClientRect();
          const ent = caps.find(c => c.textContent.trim() === entree) || null;
          const q = ent && ent.getBoundingClientRect();
          const ls = [...document.querySelectorAll(lignes)];
          return { visible: !!(vk && vk.visible), rangees: rangees.length, touches: caps.length,
                   plaque: Math.round(plaque.height), part: Math.round(100 * plaque.height / window.innerHeight),
                   hMin: Math.round(Math.min(...caps.map(c => c.getBoundingClientRect().height))),
                   debord: Math.round(Math.max(0, ...caps.map(c => c.getBoundingClientRect().right)) - window.innerWidth),
                   entree: ent ? { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2) } : null,
                   lignes: ls.length,
                   focus: ls.findIndex(l => l.contains(document.activeElement)) };
        };
        const arg = { entree: K.entree, lignes: KL.lignes };
        const pay = await s.page.evaluate(mesurerRangees, arg);
        verifier('sur une tablette en paysage, le clavier mathématique tient sur ' + KL.rangees + ' rangées, touches touchables, sans débord',
          !pay.absent && pay.visible && pay.rangees === KL.rangees && pay.hMin >= 36 && pay.debord <= 1,
          pay.absent ? 'aucun clavier ancré dans la page' + (pay.visible ? '' : ' (le clavier ne se déploie pas)')
            : !pay.visible ? 'le clavier ne se déploie pas'
            : pay.rangees + ' rangée(s) rendue(s) (' + pay.touches + ' touches, plaque ' + pay.plaque + ' px = ' + pay.part + ' % de l\'écran)'
              + ', touche la plus basse ' + pay.hMin + ' px' + (pay.debord > 1 ? ', DÉBORDE de ' + pay.debord + ' px à droite' : ''));
        let apres = null;
        if(pay.entree && pay.lignes >= 1){
          await s.page.mouse.click(pay.entree.x, pay.entree.y); await s.page.waitForTimeout(600);
          apres = await s.page.evaluate(mesurerRangees, arg);
        }
        verifier('la touche « ' + K.entree + ' » cliquée ajoute une ligne à la feuille, le curseur dedans, le clavier toujours déployé',
          !!apres && apres.lignes === pay.lignes + 1 && apres.focus === pay.lignes && apres.visible,
          !pay.entree ? 'aucune touche « ' + K.entree + ' » sur le clavier rendu'
            : !apres ? 'la feuille n\'a aucune ligne (' + KL.lignes + ')'
            : apres.lignes !== pay.lignes + 1 ? pay.lignes + ' ligne(s) avant, ' + apres.lignes + ' après : la touche ne passe pas à la ligne'
            : apres.focus !== pay.lignes ? 'la nouvelle ligne n\'a pas le curseur (ligne active : ' + apres.focus + ')'
            : 'le clavier s\'est refermé');
        /* et tournée en PORTRAIT, la forme du portrait : trois rangées sur une
           tablette (clavierEcran.portraitTablette, deux sources), les rangées
           de la forme normale là où rien n'est déclaré */
        await s.page.setViewportSize({ width: 768, height: 1024 });
        await s.page.waitForTimeout(1200);
        const KP = K.portraitTablette || null;
        const por = await s.page.evaluate(mesurerRangees, arg);
        verifier(KP ? 'tournée en portrait, la tablette tient sur ' + KP.rangees + ' rangées, touches touchables, sans débord'
                    : 'tournée en portrait, la tablette retrouve les rangées de la forme normale du clavier',
          por.visible && !!por.entree && por.debord <= 1
            && (KP ? (por.rangees === KP.rangees && por.hMin >= 36) : por.rangees > KL.rangees),
          !por.visible ? 'le clavier s\'est refermé à la rotation'
            : por.rangees + ' rangée(s) rendue(s) en portrait (' + KL.rangees + ' en paysage), '
              + por.touches + ' touches, plaque ' + por.plaque + ' px = ' + por.part + ' % de l\'écran'
              + ', touche la plus basse ' + por.hMin + ' px'
              + (por.entree ? '' : ', et plus de touche « ' + K.entree + ' »')
              + (por.debord > 1 ? ', DÉBORDE de ' + por.debord + ' px' : ''));
        console.log('   · la plaque du clavier : ' + pay.plaque + ' px en paysage (' + pay.rangees + ' rangées), '
          + por.plaque + ' px en portrait (' + por.rangees + ' rangées), sur un écran de ' + por.part + ' %');
        /* le bord opposé, et il compte autant : un TÉLÉPHONE en portrait garde
           les rangées d'origine — huit touches sur une rangée de 390 px ne se
           toucheraient plus. Une forme courte qui fuirait sur le téléphone
           passerait inaperçue sans cette mesure. */
        if(KP){
          await s.page.setViewportSize({ width: 390, height: 844 });
          await s.page.waitForTimeout(1200);
          const tel = await s.page.evaluate(mesurerRangees, arg);
          verifier('sur un téléphone en portrait, les ' + KP.telephone + ' rangées d\'origine reviennent : la forme courte ne fuit pas',
            tel.visible && tel.rangees === KP.telephone && tel.debord <= 1,
            !tel.visible ? 'le clavier s\'est refermé au changement de taille'
              : tel.rangees + ' rangée(s) rendue(s) sur un téléphone en portrait (' + KP.telephone + ' attendues)'
                + (tel.debord > 1 ? ', DÉBORDE de ' + tel.debord + ' px' : ''));
          /* et on REND la tablette : ce qui suit mesure la tablette, et l'a
             mesurée à 390 px de large tant que ce détour n'était pas défait —
             une feuille restée grande parce que la page était devenue un
             téléphone. */
          await s.page.setViewportSize({ width: 768, height: 1024 });
          await s.page.waitForTimeout(700);
        }
        /* la feuille écrit plus PETIT sur la tablette (feuilleTablette) : police
           rendue de la case au plus pxMax — et, sur un ordinateur ouvert au même
           exercice, plus grande : une règle qui réduirait partout ne serait pas
           la règle demandée */
        if(P.feuilleTablette){
          const policeDe = sel => { const el = document.querySelector(sel); if(!el) return null;
            return { px: Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10, h: Math.round(el.getBoundingClientRect().height) }; };
          const tab = await s.page.evaluate(policeDe, KL.champ);
          let bur = null;
          const s2 = await ouvrir(chromium, ml, { viewport: { width: 1280, height: 800 } });
          try{
            if(await connecter(s2.page) === 'scr-space'){
              await s2.page.evaluate(i => openTest(i), KL.exercice);
              await s2.page.waitForTimeout(300);
              await s2.page.evaluate(() => {
                const b = [...document.querySelectorAll('#modeChoices button')]
                  .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
                if(b) b.click();
              });
              await s2.page.waitForTimeout(800);
              bur = await s2.page.evaluate(policeDe, KL.champ);
            }
          } finally { await s2.nav.close(); }
          verifier('sur la tablette, la feuille de calcul écrit plus petit que sur l\'ordinateur (au plus ' + P.feuilleTablette.pxMax + ' px)',
            !!tab && !!bur && tab.px <= P.feuilleTablette.pxMax && tab.px < bur.px - 3,
            !tab ? 'la feuille est introuvable sur la tablette (' + KL.champ + ')'
              : !bur ? 'la feuille est introuvable sur l\'ordinateur'
              : 'police ' + tab.px + ' px sur la tablette (plafond ' + P.feuilleTablette.pxMax + ') contre ' + bur.px + ' px sur l\'ordinateur'
                + ' — ligne de ' + tab.h + ' px contre ' + bur.h);
        } else {
          ignorer('sur la tablette, la feuille de calcul écrit plus petit que sur l\'ordinateur', 'ce fichier ne déclare pas de feuille de tablette');
        }
        verifier('le clavier de la tablette en paysage ne lève aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ---- 11 septies. Sur tablette, la chaîne à nombres écrit plus petit ----
       Demande de Turquet (septembre 2026) : « pour les exercices avec des cases
       à remplir avec des nombres, sur les tablettes, après l'énoncé, les
       écritures avant et après une case ainsi que les cases elles-mêmes ont une
       police légèrement plus petite ». jsdom lit les règles ; seul un navigateur
       sait ce que la page MESURE une fois la requête média évaluée. Deux écrans,
       et il les faut tous les deux : la tablette, où la chaîne réduit de la
       police de la page ET du facteur, et l'ordinateur, où elle n'a pas bougé —
       une règle qui réduirait partout ne serait pas la règle demandée.
       Et TROIS bords, parce qu'en tenir un seul ne tient rien : la CASE réduit,
       les ÉCRITURES qui l'entourent réduisent d'AUTANT — sans quoi la case
       rétrécirait seule au milieu de nombres restés grands, exactement ce que la
       règle « une case a la taille des nombres qui l'entourent » interdit —, et
       l'ÉNONCÉ, lui, ne suit QUE la police de la page : la demande dit « après
       l'énoncé ». */
    titre('11 septies. SUR TABLETTE, LA CHAÎNE À NOMBRES ÉCRIT PLUS PETIT');
    if(!P.chaineTablette || !P.policeTablette){
      ignorer('sur tablette, la chaîne à nombres écrit plus petit que sur l\'ordinateur', 'ce fichier ne déclare pas de chaîne de tablette');
    } else {
      const T = P.chaineTablette;
      const mesurer = ({ champ, ecriture, enonce }) => {
        const on = document.querySelector('section.screen.on');
        if(!on) return null;
        const px = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10 : 0;
        const vis = e => { if(!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const c = on.querySelector(champ);
        /* Les écritures se relèvent sur l'ÉCRAN, hors de l'énoncé — pas dans le
           stage : cherchées dans le stage, un stage disparu rendrait « aucune
           écriture » et le contrôle rougirait en disant « mesure impossible »
           au lieu de nommer le défaut, c'est-à-dire une chaîne qui n'a pas
           rétréci. On retient donc à part si le stage à cases est là. */
        const st = [...on.querySelectorAll('.mp-stage')].find(x => x.querySelector('math-field.pm-mf'));
        const ecr = [...on.querySelectorAll(ecriture)].filter(e => vis(e) && !e.closest('.mp-instr'));
        return { ecran: on.id, racine: parseFloat(getComputedStyle(document.documentElement).fontSize), stage: !!st,
                 casePx: vis(c) ? px(c) : 0, ecrPx: ecr.length ? Math.max(...ecr.map(px)) : 0, nEcr: ecr.length,
                 enoncePx: px(on.querySelector(enonce)) };
      };
      const ouvrirExo = async (page) => {
        await page.evaluate(i => openTest(i), T.exercice);
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("currentMode='train'") >= 0);
          if(b) b.click();
        });
        await page.waitForTimeout(800);
      };
      const arg = { champ: T.champ, ecriture: T.ecriture, enonce: T.enonce };
      let bureau = null, tablette = null;
      s = await ouvrir(chromium, ml, { viewport: { width: 1280, height: 900 } });
      if(await connecter(s.page) === 'scr-space'){ await ouvrirExo(s.page); bureau = await s.page.evaluate(mesurer, arg); }
      await s.nav.close(); s = null;
      /* une tablette en PAYSAGE (1180 px) : au-dessus de la borne de 900 px, où
         deux écrans resserrent déjà leurs cases — on mesure le facteur, pas le
         réglage d'écran étroit. */
      s = await ouvrir(chromium, ml, { viewport: { width: 1180, height: 820 }, hasTouch: true });
      if(await connecter(s.page) === 'scr-space'){ await ouvrirExo(s.page); tablette = await s.page.evaluate(mesurer, arg); }
      const attendu = (P.policeTablette / 100) * T.facteur;
      const rap = (a, b) => (a && b) ? Math.round(1000 * a / b) / 1000 : 0;
      const complet = bureau && tablette && bureau.casePx && bureau.ecrPx && bureau.enoncePx && tablette.nEcr;
      verifier('sur tablette, la case à nombres écrit plus petit que sur l\'ordinateur (facteur ' + attendu.toFixed(3) + ')',
        !!complet && Math.abs(rap(tablette.casePx, bureau.casePx) - attendu) < 0.02,
        !complet ? 'mesure impossible (' + (bureau ? 'case ' + bureau.casePx + ' px, ' + (tablette ? tablette.nEcr : 0) + ' écriture(s)' : 'ordinateur injoignable') + ')'
          : 'case ' + tablette.casePx + ' px sur tablette contre ' + bureau.casePx + ' sur ordinateur (rapport '
            + rap(tablette.casePx, bureau.casePx) + ', attendu ' + Math.round(attendu * 1000) / 1000 + ')'
            + (tablette.stage ? '' : ' — et aucun .mp-stage à cases sur cet écran : le facteur n\'a rien où se poser'));
      verifier('les écritures qui l\'entourent réduisent d\'autant — la case ne rétrécit pas seule',
        !!complet && Math.abs(rap(tablette.ecrPx, bureau.ecrPx) - attendu) < 0.02
          && tablette.casePx >= tablette.ecrPx * 0.9,
        !complet ? 'mesure impossible'
          : 'écritures ' + tablette.ecrPx + ' px contre ' + bureau.ecrPx + ' (rapport ' + rap(tablette.ecrPx, bureau.ecrPx)
            + ', attendu ' + Math.round(attendu * 1000) / 1000 + ') ; sur la tablette la case fait ' + tablette.casePx
            + ' px pour des nombres à ' + tablette.ecrPx);
      verifier('l\'énoncé, lui, ne suit que la police de la page — la demande dit « après l\'énoncé »',
        !!complet && Math.abs(rap(tablette.enoncePx, bureau.enoncePx) - P.policeTablette / 100) < 0.02,
        !complet ? 'mesure impossible'
          : 'énoncé ' + tablette.enoncePx + ' px contre ' + bureau.enoncePx + ' (rapport ' + rap(tablette.enoncePx, bureau.enoncePx)
            + ', attendu ' + P.policeTablette / 100 + ')');
      verifier('la chaîne réduite ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ---- 11 nonies. Le clavier ancré déployé ne recouvre plus les commandes ----
       Signalé par Turquet (septembre 2026) : « occupe-toi du clavier qui
       recouvre les commandes ». Mesuré avant tout correctif sur les TROIS
       niveaux, dans les deux orientations : « Signaler », « Abandonner » et
       « Mettre en pause » vivaient ENTIÈREMENT sous le clavier ancré et y
       étaient INTOUCHABLES (elementFromPoint rend une touche du clavier) —
       aucune erreur nulle part, le bouton ne répondait simplement pas.
       jsdom lit la règle et la classe ; seul un navigateur sait OÙ tombe un
       bouton. Trois bords, et il les faut tous les trois : clavier déployé,
       aucune commande sous lui et toutes atteignables ; aucune ne recouvre la
       CASE où l'élève écrit — c'est ce qui a écarté la place « juste au-dessus
       du clavier », la leçon de la bulle « Comprendre mon erreur » ; et
       clavier REFERMÉ, elles redescendent au bas de l'écran, sans quoi une
       règle qui les monterait pour de bon passerait au vert. */
    titre('11 nonies. LE CLAVIER ANCRÉ DÉPLOYÉ NE RECOUVRE PLUS LES COMMANDES');
    {
      const KE = P.clavierEcran || {};
      const E = [KE.paysage, KE.tablette, KE.portrait].find(x => x && x.exercice && x.champ);
      if(!E){
        ignorer('le clavier ancré déployé ne recouvre plus les commandes du bas',
                'ce fichier ne déclare aucun écran à clavier mathématique');
      } else {
        /* ce que chaque commande devient : sous le clavier ? atteignable ?
           par-dessus la case où l'élève écrit ? */
        const mesurer = () => {
          const H = innerHeight;
          const kb = document.querySelector('body > .ML__keyboard .MLK__backdrop');
          const haut = kb ? kb.getBoundingClientRect().top : null;
          const a = document.activeElement;
          const c = (a && a.tagName === 'MATH-FIELD') ? a.getBoundingClientRect() : null;
          const tc = document.getElementById('testCtrls');
          const out = { deploye: !!(window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible),
                        haut: haut === null ? null : Math.round(haut), casePresente: !!c,
                        sous: [], sourdes: [], surCase: [], bas: [] };
          if(tc && !tc.hidden) [...tc.querySelectorAll('button')].forEach(b => {
            const r = b.getBoundingClientRect();
            if(r.width < 2 || r.height < 2) return;
            out.bas.push(Math.round(H - r.bottom));
            if(haut !== null && r.bottom > haut) out.sous.push('« ' + b.id + ' » dépasse de ' + Math.round(r.bottom - haut) + ' px sous le haut du clavier');
            const e = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
            if(!(e === b || b.contains(e))) out.sourdes.push('« ' + b.id + ' » recouverte par ' + ((e && (e.className || e.tagName)) || '?').toString().trim().slice(0, 30));
            if(c && !(r.right < c.left || r.left > c.right || r.bottom < c.top || r.top > c.bottom))
              out.surCase.push('« ' + b.id + ' » recouvre la case où l\'élève écrit');
          });
          return out;
        };
        for(const vue of [{ n: 'paysage', w: 1024, h: 768 }, { n: 'portrait', w: 768, h: 1024 }]){
          s = await ouvrir(chromium, ml, { viewport: { width: vue.w, height: vue.h }, hasTouch: true });
          if(await connecter(s.page) !== 'scr-space'){
            ignorer('le clavier ancré déployé ne recouvre plus les commandes du bas (' + vue.n + ')', 'connexion impossible');
          } else {
            await s.page.evaluate(i => openTest(i), E.exercice);
            await s.page.waitForTimeout(300);
            await s.page.evaluate(() => {
              const b = [...document.querySelectorAll('#modeChoices button')]
                .find(x => (x.getAttribute('onclick') || '').indexOf('train') >= 0);
              if(b) b.click();
            });
            await s.page.waitForTimeout(800);
            await s.page.click(E.champ);
            await s.page.waitForTimeout(900);
            const ouvert = await s.page.evaluate(mesurer);
            verifier('clavier déployé (' + vue.n + ') : aucune commande sous le clavier, toutes atteignables, aucune sur la case',
              ouvert.deploye && ouvert.haut !== null && ouvert.bas.length > 0
                && ouvert.sous.length === 0 && ouvert.sourdes.length === 0 && ouvert.surCase.length === 0,
              !ouvert.deploye ? 'le clavier ne se déploie pas' : ouvert.haut === null ? 'aucun clavier rendu'
                : !ouvert.bas.length ? 'aucune commande affichée'
                : [].concat(ouvert.sous, ouvert.sourdes, ouvert.surCase).slice(0, 3).join(' ; '));
            /* LE BORD OPPOSÉ : refermé, le clavier leur rend le bas de l'écran.
               Sans cette mesure, des commandes montées pour de bon passeraient. */
            await s.page.evaluate(() => { try{ mathVirtualKeyboard.hide(); }catch(e){} document.activeElement.blur(); });
            await s.page.waitForTimeout(600);
            const ferme = await s.page.evaluate(mesurer);
            verifier('clavier refermé (' + vue.n + ') : les commandes redescendent au bas de l\'écran',
              !ferme.deploye && ferme.bas.length > 0 && Math.max.apply(null, ferme.bas) <= 120,
              ferme.deploye ? 'le clavier ne se referme pas' : !ferme.bas.length ? 'aucune commande affichée'
                : 'la plus haute est à ' + Math.max.apply(null, ferme.bas) + ' px du bas : elles ne sont pas redescendues');
          }
          await s.nav.close(); s = null;
        }
      }
    }

    /* ---- 11 octies. En mode application, la bande du bas est rendue au système ----
       Signalé par Turquet (septembre 2026) sur une tablette Samsung, la page
       posée sur l'écran d'accueil : « la ligne la plus basse du clavier virtuel
       ne fonctionne pas, les caractères ne s'affichent pas — en portrait comme
       en paysage ». Mesuré avant tout correctif : cette rangée-là vivait à
       7..49 px du bord BAS de l'écran en paysage (7..67 en portrait), c'est-à-dire
       dans les 48 dp qu'Android se réserve pour le geste de retour à l'accueil —
       le système y prend les touches, et rien n'arrive à la page. La Première
       est le seul niveau à demander « fullscreen » : elle dessine jusqu'au bord
       physique, quand un onglet ou un niveau « standalone » s'arrête au-dessus
       de la barre du système.
       jsdom lit les règles et la classe ; seul un navigateur sait OÙ une touche
       tombe une fois la page rendue. Trois mesures, et il les faut toutes : en
       mode application, plus rien de ce qui se touche ne descend dans la bande
       — ni le clavier ancré, ni les commandes, ni le pavé — et les touches
       restent atteignables ; et SANS mode application, la rangée du bas y
       descend toujours, sans quoi la règle coûterait 48 px à tout le monde et
       ne serait pas la règle demandée. */
    titre('11 octies. EN MODE APPLICATION, LA BANDE DU BAS EST RENDUE AU SYSTÈME');
    if(!P.basSysteme){
      ignorer('en mode application, rien de ce qui se touche ne descend dans la bande du système',
              'ce niveau ne demande pas le plein écran');
    } else {
      const B = P.basSysteme;
      /* ce qui descend dans les « px » derniers pixels de l'écran, et ce qui
         n'est plus atteignable au doigt (elementFromPoint sur le centre) */
      const mesurer = px => {
        const H = window.innerHeight, dans = [], sourds = [];
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
        const regarde = (nom, el, doigt) => {
          const r = el.getBoundingClientRect(), reste = Math.round(H - r.bottom);
          if(reste < px) dans.push(nom + ' à ' + reste + ' px du bord');
          if(doigt){
            const e = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
            if(!(e === el || el.contains(e))) sourds.push(nom);
          }
        };
        const kb = document.querySelector('body > .ML__keyboard');
        let touches = 0;
        if(kb) [...kb.querySelectorAll('.MLK__rows > .MLK__row > *')].filter(vis).forEach(c => {
          touches++; regarde('la touche « ' + (c.textContent || '?').trim().slice(0, 3) + ' »', c, true); });
        const tc = document.getElementById('testCtrls');
        let commandes = 0;
        if(tc && !tc.hidden) [...tc.querySelectorAll('button')].filter(vis).forEach(b => {
          commandes++; regarde('la commande « ' + b.id + ' »', b, false); });
        const pv = document.getElementById('paveNum');
        let pave = 0;
        if(pv && !pv.hidden) [...pv.querySelectorAll('.pave-t')].filter(vis).forEach(b => {
          pave++; regarde('la touche « ' + b.textContent.trim() + ' » du pavé', b, true); });
        /* le FOND du clavier : ce qui se voit. Il doit rester collé au bord
           pendant que les touches remontent — sans quoi l'élève a une bande
           de page sous son clavier (le « trou » signalé en septembre 2026). */
        const fd = kb && kb.querySelector('.MLK__backdrop');
        const fond = fd ? Math.round(H - fd.getBoundingClientRect().bottom) : null;
        return { H, touches, commandes, pave, dans, sourds, fond,
                 modeApp: document.body.classList.contains('mode-app'),
                 clavier: !!(window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible) };
      };
      s = await ouvrir(chromium, ml, { viewport: { width: 1024, height: 768 }, hasTouch: true });
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('en mode application, rien de ce qui se touche ne descend dans la bande du système', 'connexion impossible');
      } else {
        await s.page.evaluate(i => openTest(i), B.exercice);
        await s.page.waitForTimeout(300);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(800);
        await s.page.click(B.champ);
        await s.page.waitForTimeout(900);
        /* LE BORD OPPOSÉ D'ABORD, dans un onglet : la rangée du bas descend
           bien dans la bande — la réserve ne coûte rien à qui n'est pas en
           mode application. Sans cette mesure, une réserve posée pour tout le
           monde passerait au vert. */
        const onglet = await s.page.evaluate(mesurer, B.px);
        verifier('hors mode application, la page descend jusqu\'au bord — la réserve ne coûte rien à un onglet',
          onglet.clavier && !onglet.modeApp && onglet.touches > 0 && onglet.dans.length > 0,
          !onglet.clavier ? 'le clavier ne se déploie pas' : onglet.modeApp ? 'la page se croit déjà en mode application'
            : !onglet.touches ? 'aucune touche rendue' : 'rien ne descend dans les ' + B.px + ' derniers pixels : la réserve s\'applique partout');
        await s.page.evaluate(() => { window.__appForce = true; modeAppSuivre(); });
        await s.page.waitForTimeout(400);
        const pay = await s.page.evaluate(mesurer, B.px);
        verifier('en mode application, paysage : aucune touche du clavier ne descend dans les ' + B.px + ' px du système, et toutes restent atteignables',
          pay.modeApp && pay.clavier && pay.touches > 0 && pay.dans.length === 0 && pay.sourds.length === 0,
          !pay.modeApp ? 'la classe « mode-app » n\'est pas posée' : !pay.clavier ? 'le clavier s\'est refermé'
            : !pay.touches ? 'aucune touche rendue'
            : (pay.dans.length ? pay.dans.length + ' dans la bande : ' + pay.dans.slice(0, 3).join(', ') : '')
              + (pay.sourds.length ? ' ; ' + pay.sourds.length + ' touche(s) recouverte(s) : ' + pay.sourds.slice(0, 3).join(', ') : ''));
        /* et en portrait, où la rangée du bas est une autre (0 , = % ⏎) */
        await s.page.setViewportSize({ width: 768, height: 1024 });
        await s.page.waitForTimeout(1400);
        const por = await s.page.evaluate(mesurer, B.px);
        verifier('en mode application, portrait : la rangée du bas du clavier est hors de la bande du système',
          por.modeApp && por.clavier && por.touches > 0 && por.dans.length === 0 && por.sourds.length === 0,
          !por.clavier ? 'le clavier s\'est refermé à la rotation'
            : (por.dans.length ? por.dans.length + ' dans la bande : ' + por.dans.slice(0, 3).join(', ') : '')
              + (por.sourds.length ? ' ; ' + por.sourds.length + ' touche(s) recouverte(s) : ' + por.sourds.slice(0, 3).join(', ') : ''));
        /* ET LE FOND DU CLAVIER RESTE AU RAS DU BORD, dans les deux
           orientations. C'est ce qui sépare ce correctif de la v221, qui
           remontait le clavier EN BLOC : les touches étaient déjà hors de la
           bande, mais une bande de page se voyait dessous. Une marge revenue
           sur le fond fait rougir ce contrôle-ci et passer les deux autres —
           c'est exactement le défaut signalé. */
        verifier('en mode application, le fond du clavier reste collé au bord de l\'écran : aucun trou sous le clavier',
          pay.fond !== null && por.fond !== null && pay.fond <= 1 && por.fond <= 1,
          pay.fond === null || por.fond === null ? 'aucun fond de clavier rendu'
            : 'trou sous le clavier : ' + pay.fond + ' px en paysage, ' + por.fond + ' px en portrait');

        /* LES DEUX AUTRES MEUBLES DU BAS : les commandes et le pavé numérique.
           Le clavier ancré les recouvre tant qu'il est déployé — on ouvre donc
           un exercice à cases, où c'est le pavé compact qui paraît, et en
           PAYSAGE, la seule orientation où il descend au ras du bas. */
        let pv = null;
        if(P.pave && P.pave.maths){
          await s.page.setViewportSize({ width: 1024, height: 768 });
          await s.page.waitForTimeout(600);
          await s.page.evaluate(() => { try{ mathVirtualKeyboard.hide(); }catch(e){} });
          await s.page.evaluate(i => openTest(i), P.pave.maths.exercice);
          await s.page.waitForTimeout(300);
          await s.page.evaluate(() => {
            const b = [...document.querySelectorAll('#modeChoices button')]
              .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
            if(b) b.click();
          });
          await s.page.waitForTimeout(800);
          await s.page.evaluate(() => { window.__paveForce = true; window.__appForce = true; paveObserver(); modeAppSuivre(); });
          await s.page.click(P.pave.maths.champ);
          await s.page.waitForTimeout(500);
          pv = await s.page.evaluate(mesurer, B.px);
        }
        verifier('en mode application, le pavé numérique et les commandes du bas sortent eux aussi de la bande',
          !!pv && pv.modeApp && pv.pave > 0 && pv.commandes > 0 && pv.dans.length === 0 && pv.sourds.length === 0,
          !pv ? 'ce niveau ne confie aucune case mathématique au pavé'
            : !pv.pave ? 'le pavé ne s\'ouvre pas sur la case déclarée'
            : !pv.commandes ? 'aucune commande du bas affichée'
            : (pv.dans.length ? pv.dans.length + ' dans la bande : ' + pv.dans.slice(0, 3).join(', ') : '')
              + (pv.sourds.length ? ' ; ' + pv.sourds.length + ' touche(s) recouverte(s) : ' + pv.sourds.slice(0, 3).join(', ') : ''));
        verifier('la réserve du mode application ne lève aucune erreur JavaScript',
          s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      }
      await s.nav.close(); s = null;
    }

    /* ---- 11 quater. Sur tablette, la police de la page est réduite ----------
       Décision de Turquet (septembre 2026) : « dans la page, règle fixe sur
       tablette ». jsdom lit la règle ; seul un navigateur sait ce que la racine
       MESURE une fois la requête média évaluée. Trois écrans, et il les faut
       tous : la tablette (tactile, 820 px) où la racine vaut le pourcentage du
       profil, l'ordinateur (pointeur fin) et le téléphone (tactile, 390 px) où
       elle reste entière — une règle qui réduirait partout ne serait pas la
       règle demandée. Et une touche du pavé, réglée en pixels, garde sa taille. */
    titre('11 quater. SUR TABLETTE, LA POLICE DE LA PAGE EST RÉDUITE');
    if(!P.policeTablette){
      ignorer('sur tablette, la racine de la page est réduite au pourcentage déclaré', 'ce fichier ne déclare pas de police de tablette');
    } else {
      const racine = () => ({
        px: parseFloat(getComputedStyle(document.documentElement).fontSize),
        texte: (function(){ const e = document.querySelector('#nameChips .chip, h1, .brand'); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; })(),
      });
      s = await ouvrir(chromium, ml, {});
      const bureau = await s.page.evaluate(racine);
      await s.nav.close(); s = null;
      s = await ouvrir(chromium, ml, { viewport: { width: 820, height: 1180 }, hasTouch: true });
      const tablette = await s.page.evaluate(racine);
      await s.page.setViewportSize({ width: 390, height: 844 });
      await s.page.waitForTimeout(300);
      const telephone = await s.page.evaluate(racine);
      const attendu = P.policeTablette / 100;
      const ratio = (a, b) => (a && b) ? Math.round(100 * a / b) / 100 : 0;
      verifier('sur tablette, la racine de la page est réduite au pourcentage déclaré',
        bureau.px > 0 && Math.abs(ratio(tablette.px, bureau.px) - attendu) < 0.02
          && Math.abs(ratio(tablette.texte, bureau.texte) - attendu) < 0.03,
        'racine ' + tablette.px + ' px sur tablette contre ' + bureau.px + ' sur ordinateur (rapport ' + ratio(tablette.px, bureau.px)
          + ', attendu ' + attendu + ') ; texte ' + tablette.texte + ' contre ' + bureau.texte);
      verifier('sur ordinateur et sur téléphone, la police de la page reste entière',
        bureau.px >= 15.5 && Math.abs(telephone.px - bureau.px) < 0.1,
        'ordinateur ' + bureau.px + ' px, téléphone ' + telephone.px + ' px');
      verifier('la règle de la tablette ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

  } catch(e){
    verifier('le parcours se déroule sans incident', false, e.message);
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
