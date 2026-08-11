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
  await page.route('**/supabase-js**', r => r.fulfill({
    contentType: 'application/javascript',
    body: faux
      + '\nwindow.__faux.semer(' + JSON.stringify(P.tableEleves) + ',' + JSON.stringify([eleve]) + ');'
      + '\nwindow.__faux.semerCompte(' + JSON.stringify(eleve.cle + '@' + domaine) + ','
        + JSON.stringify(prefixe + CODE_CONTROLE) + ',' + JSON.stringify(eleve.user_id) + ');',
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

  await page.goto('file://' + path.join(RACINE, CIBLE), { waitUntil: 'domcontentloaded', timeout: 60000 });
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
  await page.click('#scr-home button.choice.eleve');           /* « Je suis élève » */
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
  let s = null;
  try {
    s = await ouvrir(chromium, ml);
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
    await s.page.click('#scr-home button.choice.eleve');
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
    /* Le bouton ne doit PAS être offert par défaut : un élève qui a choisi son
       code lui-même n'a rien à changer. Il n'apparaît qu'après un code donné
       par le professeur — marqueur que seul le service peut écrire. */
    const offertDAbord = await s.page.evaluate(() => {
      const z = document.getElementById('zoneChangerCode');
      return !!z && !z.hidden;
    });
    verifier('le bouton « Choisir mon code » reste caché sans code provisoire', !offertDAbord,
      'il est offert alors que l’élève a choisi son code lui-même');

    /* On pose le marqueur comme le ferait la fonction Edge, puis on rouvre
       l'espace : le bouton doit apparaître. */
    await s.page.evaluate(() => {
      const c = window.__faux.comptes[Object.keys(window.__faux.comptes)[0]];
      c.app_metadata = { code_provisoire: true };
      window.__faux.session.user.app_metadata = { code_provisoire: true };
    });
    await s.page.evaluate(() => ouvrirEspace());
    await s.page.waitForTimeout(300);
    const offertApres = await s.page.evaluate(() => {
      const z = document.getElementById('zoneChangerCode');
      return !!z && !z.hidden;
    });
    verifier('il apparaît quand le professeur vient de donner un code', offertApres);

    const NOUVEAU = '765432'.slice(0, CODE_CONTROLE.length);
    const repondre = d => d.accept(NOUVEAU);
    s.page.on('dialog', repondre);
    await s.page.evaluate(() => { show('space'); });
    await s.page.waitForTimeout(200);
    const bouton = await s.page.$('#scr-space button[onclick*="changerMonCode"]');
    verifier('l’élève trouve le bouton pour changer son code', !!bouton,
      'aucun bouton « Changer mon code » sur l’espace élève');
    if(bouton){
      await bouton.click();
      await s.page.waitForTimeout(400);
      const enregistre = await s.page.evaluate(() => {
        const c = window.__faux.comptes[Object.keys(window.__faux.comptes)[0]];
        return c ? c.motDePasse : null;
      });
      const attendu = await s.page.evaluate(n => motDePasseDe(n), NOUVEAU);
      verifier('le nouveau code est bien celui que Supabase retiendra',
        enregistre === attendu, 'enregistré : ' + enregistre + ' — attendu : ' + attendu);

      /* Et surtout : l'élève peut-il VRAIMENT se reconnecter avec ? Vérifier
         l'enregistrement ne suffit pas — c'est le tour complet qui compte. */
      const rentre = await s.page.evaluate(async n => {
        await sb.auth.signOut();
        const { error } = await sb.auth.signInWithPassword({
          email: courrielDe(selectedEleve.cle), password: motDePasseDe(n) });
        return !error;
      }, NOUVEAU);
      verifier('l’élève se reconnecte avec son nouveau code', rentre);

      /* Et le bouton doit s'être refermé : sans le retrait du marqueur, il
         serait réoffert à chaque connexion, indéfiniment. */
      const marqueur = await s.page.evaluate(() => {
        const c = window.__faux.comptes[Object.keys(window.__faux.comptes)[0]];
        return c && c.app_metadata ? c.app_metadata.code_provisoire : null;
      });
      verifier('le marqueur « code provisoire » est retiré après le changement',
        marqueur === false, 'marqueur = ' + JSON.stringify(marqueur));
    }
    s.page.off('dialog', repondre);

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
