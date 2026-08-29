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
  await page.goto('file://' + path.join(RACINE, CIBLE) + (options.fragment || ''),
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
      const G = P.caseQuiGrandit;
      s = await ouvrir(chromium, ml, { viewport: { width: 1400, height: 900 } });
      await connecter(s.page);
      await s.page.evaluate(i => openTest(i), G.exercice);
      await s.page.waitForTimeout(400);
      await s.page.click('#modeChoices [onclick*="train"]');
      await s.page.waitForTimeout(900);
      const avant = await s.page.evaluate(a => {
        const el = document.getElementById(a.den);
        return el ? { l: el.getBoundingClientRect().width, police: parseFloat(getComputedStyle(el).fontSize) } : null;
      }, G);
      verifier('l\'écran s\'ouvre et la case est là', !!avant, 'pas de #' + G.den);
      verifier('la police de la case est celle des nombres qui l\'entourent',
        !!avant && avant.police >= 28,
        'police rendue ' + (avant && avant.police) + ' px — la réponse de l\'élève paraît secondaire');
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
      verifier('la case s\'élargit quand le nombre dépasse', apres.l > avant.l + 8,
        avant.l + ' px avant, ' + apres.l + ' px après « ' + G.grand + ' » — la largeur est restée figée');
      verifier('rien n\'est coupé dans la case', !apres.coupe, 'le contenu déborde de la case (« ' + G.grand + ' » tronqué)');
      verifier('la barre et l\'autre case suivent la plus large',
        apres.barre >= apres.l - 2 && apres.num >= apres.l - 2,
        'barre ' + Math.round(apres.barre) + ' px, numérateur ' + Math.round(apres.num) + ' px, dénominateur ' + Math.round(apres.l) + ' px');
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

      const avant = await s.page.evaluate(() => ({
        champs: document.querySelectorAll('.dm-noteinput').length,
        texte: (document.getElementById('dmResults') || {}).textContent || '',
      }));
      verifier('le champ pour poser une note est là', avant.champs > 0,
        avant.champs + ' champ(s) — ' + avant.texte.slice(0, 120));
      verifier('le total du devoir part de la note obtenue',
        /4\s*\/\s*10/.test(avant.texte.replace(/ /g, ' ')),
        'affiché : ' + avant.texte.slice(0, 160));

      /* on TAPE 9, comme le professeur */
      await s.page.evaluate(() => {
        const c = document.querySelector('.dm-noteinput');
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
        const c = document.querySelector('.dm-noteinput');
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
        'ce niveau n\'a pas d\'exercice à saisie libre');
      ignorer('le verdict de l\'IA fait la note', 'ce niveau n\'a pas d\'exercice à saisie libre');
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
      const sans = [], sansMode = [], accolades = [], petites = [], dechires = [], tetes = [], sansClavier = [], videsRouges = [];
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
             du second degré par un choix de niveau. Mesurer là revenait à
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
                .find(x => /^(Commencer|Démarrer|C'est parti|Niveau 1)/.test(x.textContent.trim()));
              if(b){ b.click(); return true; }
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
            const chiffres = [...on.querySelectorAll('*')].filter(x => x.children.length === 0
              && !x.closest('math-field')
              && /^[0-9]+([.,][0-9]+)?$/.test((x.textContent || '').trim())
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
              const fracs = [...row.children].filter(c => c.classList && c.classList.contains('f-frac')).filter(visible);
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
            const champsMaths = [...on.querySelectorAll('math-field')].filter(visible).length > 0;
            const boutonClavier = [...on.querySelectorAll('button')].filter(visible)
              .some(b => /clavier math/i.test(b.getAttribute('title') || ''));
            return {ia: textes.some(t => /question .* l.IA/i.test(t)), ecran: on.id,
                    clavier: !champsMaths || boutonClavier,
                    /* LE BOUTON DES TABLES N'EST PROPOSÉ QUE LÀ OÙ IL SERT.
                       On relève ce qui est AFFICHÉ, exercice par exercice ; la
                       liste attendue vit dans tests/profils.js et la page a la
                       sienne. Deux sources, donc un vrai contrôle : si elles
                       divergent, ça rougit. */
                    tables: [...on.querySelectorAll('.tables-btn')].filter(visible).length > 0,
                    accolades: [...new Set(connus)], cases: cases, signes: [...new Set(signes)],
                    debuts: [...new Set(debuts)]};
          });
          if(!vu.ia) sans.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + mode + ')');
          (vu.tables ? avecTables : sansTables).add(id);
          if(vu.accolades.length) accolades.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' : ' + vu.accolades.join(' '));
          if(mode === 'train' && vu.cases && vu.cases.length)
            petites.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' — ' + vu.cases[0]);
          if(mode === 'train' && vu.signes && vu.signes.length)
            dechires.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' — ' + vu.signes[0]);
          if(mode === 'train' && vu.debuts && vu.debuts.length)
            tetes.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' — ' + vu.debuts[0]);
          if(mode === 'train' && vu.clavier === false)
            sansClavier.push((await s.page.evaluate(i => TEST_NUM[i], id)) + ' (' + vu.ecran + ')');
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
      /* Un identifiant exempté qui n'existe plus est une exemption qui ne
         protège plus rien — et qui masquerait le jour où on le réutilise. */
      verifier('chaque exercice déclaré sans aide IA existe encore',
        inconnus.length === 0, 'identifiant(s) inconnu(s) dans aideIA.sans : ' + inconnus.join(', '));
      verifier('la visite de tous les exercices ne lève aucune erreur JavaScript',
        s.erreurs.length === 0, s.erreurs.slice(0, 2).join(' | '));
      await s.nav.close(); s = null;
    }

    /* ---- Les couleurs de la vérification : JUSTE en bleu, FAUX en rouge, la
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

    /* ---- Les retours à la ligne du modèle arrivent-ils à l'écran ? --------
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
      s = await ouvrir(chromium, ml, { viewport: { width: 820, height: 1180 } });
      if(await connecter(s.page) !== 'scr-space'){
        ignorer('le pavé numérique est petit, touchable, et il écrit', 'connexion impossible');
      } else {
        await s.page.evaluate(() => { window.__paveForce = true; paveObserver(); });
        await s.page.evaluate(i => openTest(i), P.pave.exercice);
        await s.page.waitForTimeout(300);
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('#modeChoices button')]
            .find(x => (x.getAttribute('onclick') || '').indexOf("train") >= 0);
          if(b) b.click();
        });
        await s.page.waitForTimeout(700);
        /* certains exercices ont un écran de départ à franchir */
        await s.page.evaluate(() => {
          const vis = e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0; };
          const b = [...document.querySelectorAll('button')].filter(vis)
            .find(x => /^(Commencer|Démarrer|C'est parti|Niveau 1)/.test(x.textContent.trim()));
          if(b) b.click();
        });
        await s.page.waitForTimeout(700);
        await s.page.focus(P.pave.champ);
        await s.page.waitForTimeout(400);
        const m = await s.page.evaluate(champ => {
          const el = document.querySelector(champ), pave = document.getElementById('paveNum');
          if(!pave) return { absent: true };
          const r = pave.getBoundingClientRect(), c = el.getBoundingClientRect();
          const touches = [...pave.querySelectorAll('.pave-t')].map(b => b.getBoundingClientRect());
          const ctrls = document.getElementById('testCtrls');
          const k = ctrls ? ctrls.getBoundingClientRect() : null;
          const chev = (a1, b2) => !!(a1 && b2 && b2.width > 0 && a1.left < b2.right && b2.left < a1.right && a1.top < b2.bottom && b2.top < a1.bottom);
          return { visible: !pave.hidden && r.height > 0, hauteur: Math.round(r.height),
                   petites: touches.filter(t => t.width < 40 || t.height < 40).length,
                   surCase: chev(r, c), surCommandes: chev(r, k),
                   mode: el.getAttribute('inputmode') };
        }, P.pave.champ);
        if(m.absent){
          verifier('le pavé numérique est petit, touchable, et il écrit', false, 'aucun pavé dans la page');
        } else {
          verifier('le pavé s\'ouvre quand une case numérique prend le focus', m.visible === true,
            'le pavé reste caché après le focus');
          verifier('le pavé est PETIT — c\'est toute sa raison d\'être', m.hauteur > 0 && m.hauteur <= 100,
            m.hauteur + 'px de haut : le clavier de la tablette en fait autant');
          verifier('chaque touche du pavé fait au moins 40 px — un doigt, pas une souris', m.petites === 0,
            m.petites + ' touche(s) trop petites');
          verifier('le pavé ne recouvre ni la case remplie ni les commandes du bas',
            !m.surCase && !m.surCommandes,
            m.surCase ? 'il recouvre la case qu\'on remplit' : 'il recouvre Pause/Abandonner');
          verifier('la case a perdu le clavier du système (inputmode="none")', m.mode === 'none',
            'inputmode=' + m.mode);
          /* la frappe vit dans le profil : les cases de la multiplication
             posée n'acceptent qu'UN chiffre, celles des courbes une décimale */
          for(const touche of P.pave.frappe){
            await s.page.click('#paveNum button[data-t="' + touche + '"]');
          }
          const t = await s.page.evaluate(champ => ({
            valeur: document.querySelector(champ).value,
            focus: document.activeElement === document.querySelector(champ),
          }), P.pave.champ);
          verifier('les touches écrivent dans la case sans lui voler le focus',
            t.valeur === P.pave.attendu && t.focus === true,
            '« ' + t.valeur + ' » au lieu de « ' + P.pave.attendu + ' », focus ' + (t.focus ? 'gardé' : 'perdu'));
        }
      }
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
