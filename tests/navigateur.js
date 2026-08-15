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
      /* a) l'exercice des tables : elle se referme au retour */
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
      /* b) un autre exercice : elle doit rester ouverte */
      await ouvrirExo(P.tablesAide.reste);
      const btn2 = await s.page.$('.screen.on .tables-btn');
      verifier('le bouton des tables est là, sur un autre exercice', !!btn2,
        'aucun bouton .tables-btn sur ' + P.tablesAide.reste);
      if(btn2){
        await btn2.click();
        await s.page.waitForTimeout(300);
        await s.page.click('.screen.on .enonce, .screen.on');
        await s.page.waitForTimeout(250);
        const reste = await s.page.evaluate(() =>
          !!document.getElementById('tablesOverlay').classList.contains('on'));
        verifier('ailleurs, elle reste ouverte à côté de l\'exercice', reste,
          'elle s\'est refermée : la fenêtre flottante ne sert plus à rien');
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
        return { absent:false, rangees: rangees.length, decales,
                 ecartUnites: Math.round(Math.abs((uHaut.left+uHaut.width/2) - (uRes.left+uRes.width/2))) };
      }, P.operationPosee.hote);
      verifier('l\'opération posée est bien dessinée', !vu.absent && vu.rangees >= 4,
        vu.absent ? 'aucune grille trouvée' : vu.rangees + ' rangée(s)');
      verifier('toutes les rangées ont les mêmes colonnes', !vu.absent && vu.decales === 0,
        vu.decales + ' rangée(s) décalée(s) — le signe et les colonnes ne tombent plus en face');
      verifier('la case des unités tombe sous le chiffre des unités',
        !vu.absent && vu.ecartUnites <= 1, 'écart de ' + vu.ecartUnites + ' px');
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

      const aucuneNote = await s.page.evaluate(t => window.__faux.operations('insert', t).length, P.tableResultats);
      verifier('signaler n\'enregistre aucune note', aucuneNote === 0, aucuneNote + ' note(s) écrite(s)');

      verifier('signaler n\'a levé aucune erreur JavaScript', s.erreurs.length === 0, s.erreurs.slice(0,2).join(' | '));
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
