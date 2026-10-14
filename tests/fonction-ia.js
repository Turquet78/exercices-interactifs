#!/usr/bin/env node
/* ============================================================================
   BANC DE LA FONCTION EDGE — corriger-definition, réellement exécutée
   ============================================================================
   Cette fonction porte TOUTE l'aide IA des trois niveaux : les conseils, les
   questions à l'IA, la vérification des réponses rédigées, les rédactions du
   TVI, les définitions des ensembles de nombres. Elle tient la clé du modèle,
   et c'est elle qui décide de ce que l'élève lit — un indice, un verdict, ou
   une erreur.

   Et jusqu'en octobre 2026 AUCUN banc ne l'exécutait. Le banc navigateur
   remplace Supabase par un double et ne l'appelle jamais ; des contrôles de
   tests/verifier.js LISENT sa source (la borne MAX_CTX, les troncatures de
   « question », « attendu » et « reponse »), mais aucun ne la fait tourner.
   Le passage de Claude Haiku 4.5 à Claude Haiku 5.5 (décision de Turquet,
   octobre 2026) l'a rendu intenable : Haiku 5.5 refuse d'un 400 ce que Haiku
   4.5 acceptait, réfléchit AVANT de répondre — la réponse commence par un bloc
   « thinking » —, et peut décliner une demande par un HTTP 200 sans un mot de
   texte. Rien de cela ne se voit à la relecture.

   Comme tests/fonction-edge.js pour admin-eleve, ce banc la charge dans Node
   avec le minimum de substitutions : l'import de supabase-js, Deno.serve, et
   Deno.env. Le reste du fichier est exécuté TEL QUEL — c'est le vrai code qui
   répond, pas une copie.

   Il double AUSSI le réseau : fetch vers api.anthropic.com est servi par un
   FAUX MODÈLE, qui note chaque requête (corps et en-têtes) et rend la réponse
   que le contrôle a écrite — la réflexion en premier, toujours, comme Haiku 5.5
   la rend. Tout autre fetch fait échouer le banc, bruyamment : aucun contrôle
   ne doit approcher le vrai modèle ni le vrai projet Supabase, et il n'y a de
   toute façon aucune clé ici.

   CE QU'IL NE VOIT PAS, et le dire vaut mieux que de le taire : ce qui est
   DÉPLOYÉ chez Supabase (la fonction ne se met jamais à jour toute seule —
   après toute modification, redéployer), et la QUALITÉ réelle des réponses du
   modèle. Il tient la forme de ce qui part et de ce qui revient ; il ne juge
   pas un indice.
   ========================================================================== */
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'supabase/functions/corriger-definition/index.ts');
const SRC    = fs.readFileSync(SOURCE, 'utf8');

/* Le modèle EXIGÉ. Il est écrit ici et dans la fonction, et nulle part
   ailleurs : changer de modèle se fait aux deux endroits, et un changement fait
   d'un seul côté fait rougir ce banc — c'est voulu. Un identifiant de modèle ne
   se devine pas : celui-ci n'a pas de suffixe de date. */
const MODELE_EXIGE = 'claude-haiku-5-5';

/* Un compteur de PROCESSUS, pas d'état : Node met en cache les modules par
   chemin. Deux chargements sous le même nom de fichier et le second ne
   s'exécute pas — la fonction n'enregistre rien, et le banc croit qu'elle a
   changé de forme. */
let nCharge = 0;

let echecs = 0, controles = 0;
function verifier(intitule, ok, detail){
  controles++;
  console.log('   ' + (ok ? '✓' : '✗') + ' ' + intitule + (ok || !detail ? '' : '  → ' + detail));
  if(!ok) echecs++;
}
function titre(t){ console.log('\n' + t); }

/* Les bornes de la fonction se LISENT dans sa source, jamais ne se recopient :
   une borne recopiée ici resterait vraie le jour où la fonction change, et le
   contrôle mesurerait une fonction qui n'existe plus. Introuvable, elle se dit. */
function lireBorne(nom){
  const m = SRC.match(new RegExp('const ' + nom + '\\s*=\\s*(\\d+)'));
  return m ? parseInt(m[1], 10) : null;
}
const DAILY_LIMIT_PER_ELEVE = lireBorne('DAILY_LIMIT_PER_ELEVE');
const HOURLY_GLOBAL_LIMIT   = lireBorne('HOURLY_GLOBAL_LIMIT');
const MAX_CTX               = lireBorne('MAX_CTX');
const ORIGINE = (SRC.match(/ALLOWED_ORIGINS\s*=\s*\[\s*"([^"]+)"/) || [])[1] || null;

/* ---------------------------------------------------------------------------
   Un faux Supabase : les tables d'élèves des trois niveaux, et corrections_ia,
   la table qui sert à la fois de journal (le professeur y lit ce que l'IA a
   répondu) et de compteur (les quotas comptent ses lignes). Le compte rendu
   par corrections_ia est RÉGLÉ par le contrôle : c'est ainsi qu'on joue un
   quota atteint sans écrire cent lignes.
   ------------------------------------------------------------------------- */
function faireSupabase(etat){
  return function createClient(){
    function table(nom){
      const filtres = [];
      let op = null, charge = null, compte = false;

      function executer(){
        if(op === 'insert'){
          etat.journal.push({ table: nom, ligne: charge });
          return { data: null, error: null };
        }
        if(nom === 'corrections_ia'){
          /* La fonction ne lit corrections_ia que pour COMPTER. Toute autre
             lecture n'est pas modélisée, et doit se voir plutôt que de passer
             pour vraie. */
          if(!compte) throw new Error('lecture de corrections_ia sans « count » : non modélisée');
          const parEleve = filtres.some(f => f[0] === 'eleve_id');
          return { data: null, count: parEleve ? etat.compteEleve : etat.compteGlobal, error: null };
        }
        const lignes = etat.tables[nom];
        /* Comme le vrai : une table absente rend une erreur, sans lever. */
        if(!lignes) return { data: null, error: { message: 'relation "' + nom + '" does not exist' } };
        return { data: lignes.filter(x => filtres.every(f =>
          f[1] !== '=' || String(x[f[0]]) === String(f[2]))), error: null };
      }

      const b = {
        select(_cols, opts){
          op = op || 'select';
          if(opts && opts.count === 'exact' && opts.head) compte = true;
          return b;
        },
        insert(x){ op = 'insert'; charge = x; return b; },
        eq(c, v){ filtres.push([c, '=', v]); return b; },
        gte(c, v){ filtres.push([c, '>=', v]); return b; },
        maybeSingle(){
          const r = executer();
          return Promise.resolve({ data: (r.data || [])[0] || null, error: r.error || null });
        },
        then(ok, ko){ return Promise.resolve().then(executer).then(ok, ko); },
      };
      return b;
    }
    return { from: table };
  };
}

/* ---------------------------------------------------------------------------
   Le FAUX MODÈLE. Il remplace fetch : une requête vers api.anthropic.com est
   notée (corps, en-têtes) puis servie par le scénario du contrôle ; toute
   autre adresse est un appel réseau que rien ne devait faire. La fonction
   l'avalerait en « Impossible de joindre l'IA » : le banc le crie donc dès le
   premier, puis le compte UNE fois en fin de banc — la même erreur répétée à
   chaque appel n'est pas autant de mesures.
   ------------------------------------------------------------------------- */
const etrangers = [];
/* DEUX blocs de réflexion par défaut, pas un : la réponse de Haiku 5.5
   « peut commencer par un ou plusieurs blocs thinking ». Avec un seul, lire
   content[1] — la « correction » naïve d'une migration, « puisque le texte est
   maintenant le second bloc » — passait tout le banc (relecture d'octobre
   2026). Le texte de la réflexion, s'il y en a, va sur le dernier. */
function reponseModele(texte, opts){
  const o = opts || {};
  const n = o.nReflexions == null ? 2 : o.nReflexions;
  const contenu = [];
  for(let i = 0; i < n; i++)
    contenu.push({ type: 'thinking', thinking: i === n - 1 ? (o.reflexion || '') : '', signature: 'sig' + i });
  if(texte !== null) contenu.push({ type: 'text', text: texte });
  return { id: 'msg_banc', type: 'message', role: 'assistant', model: MODELE_EXIGE,
           stop_reason: o.stop || 'end_turn', stop_details: o.details || null, content: contenu,
           usage: { input_tokens: 10, output_tokens: 10 } };
}
function faireFetch(etat){
  return async function fetch(url, init){
    const u = String(url && url.url || url);
    if(!/^https:\/\/api\.anthropic\.com\//.test(u)){
      if(!etrangers.length) console.log('   ! fetch inattendu vers ' + u + ' — compté en fin de banc');
      etrangers.push(u);
      throw new Error('fetch inattendu vers ' + u);
    }
    const entetes = {};
    new Headers((init && init.headers) || {}).forEach((v, k) => { entetes[k] = v; });
    let corps = null;
    try{ corps = JSON.parse(init && init.body); }catch(e){ corps = { __illisible: String(init && init.body) }; }
    etat.requetes.push({ url: u, methode: init && init.method, entetes, corps });

    const sc = etat.scenario(corps);
    if(sc.leve) throw new Error(sc.leve);
    if(sc.statut) return new Response(sc.corps || '', { status: sc.statut });
    return new Response(JSON.stringify(sc.reponse), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

/* ---------------------------------------------------------------------------
   Charger la VRAIE fonction, avec le minimum de substitutions
   ------------------------------------------------------------------------- */
async function charger(etat){
  /* Le faux fetch est posé AVANT l'import : un appel réseau lancé au chargement
     de la fonction partirait sinon par le fetch natif de Node — vers le vrai
     service, sans être compté. */
  globalThis.fetch = faireFetch(etat);
  let src = SRC;
  src = src.replace(/^import \{ createClient \}.*$/m,
                    'const createClient = globalThis.__createClient;');
  src = src.replace(/Deno\.serve\(/, 'globalThis.__poser(');
  if(src === SRC || /^import /m.test(src) || /Deno\.serve\(/.test(src))
    throw new Error('substitutions impossibles : la fonction a changé de forme');

  globalThis.__createClient = faireSupabase(etat);
  let recu = null;
  globalThis.__poser = h => { recu = h; };

  const f = path.join(os.tmpdir(), 'edge-ia-' + process.pid + '-' + (++nCharge) + '.ts');
  fs.writeFileSync(f, src);
  try{ await import('file://' + f); } finally { fs.unlinkSync(f); }
  if(!recu) throw new Error('la fonction n\'a rien enregistré : Deno.serve introuvable');
  return recu;
}

function etatNeuf(){
  return {
    env: { SUPABASE_URL: 'https://x.supabase.co',
           SUPABASE_SERVICE_ROLE_KEY: 'CLE-DE-SERVICE',
           ANTHROPIC_API_KEY: 'CLE-DU-MODELE-banc' },
    /* Un élève par niveau : la fonction cherche dans les trois tables, et la
       Première a des identifiants entiers. */
    tables: { eleves_2nde: [{ id: 'e2' }], eleves_1ere: [{ id: 17 }], eleves: [{ id: 't1' }] },
    compteEleve: 0, compteGlobal: 0,
    journal: [], requetes: [], traces: [],
    scenario: () => ({ reponse: reponseModele('{"correct": true, "feedback": "Juste."}') }),
  };
}

/* Un appel à la fonction. Deno.env et fetch sont posés pour CET état à chaque
   appel : plusieurs chargements coexistent dans le processus, et chacun doit
   lire son environnement, pas celui du dernier chargé. Les traces de la
   fonction (console.warn / console.error) sont recueillies plutôt
   qu'imprimées : elles font partie de ce qu'on vérifie. */
async function appel(h, etat, corps, opts){
  const o = opts || {};
  globalThis.Deno  = { env: { get: n => etat.env[n] } };
  globalThis.fetch = faireFetch(etat);
  const enTete = { 'Content-Type': 'application/json' };
  if(o.origine !== null) enTete.Origin = o.origine || ORIGINE;
  const req = new Request('https://f/', {
    method: o.methode || 'POST', headers: enTete,
    body: (o.methode === 'OPTIONS') ? undefined : JSON.stringify(corps),
  });
  const w = console.warn, e = console.error;
  console.warn  = (...a) => etat.traces.push(['warn'].concat(a.map(String)).join(' '));
  console.error = (...a) => etat.traces.push(['error'].concat(a.map(String)).join(' '));
  let r;
  try{ r = await h(req); } finally { console.warn = w; console.error = e; }
  const texte = await r.text();
  let json = null;
  try{ json = JSON.parse(texte); }catch(_e){ json = null; }
  return { statut: r.status, json, texte, entetes: r.headers };
}

/* Les quatre actions, chacune avec un élève d'un niveau différent. */
const DEMANDES = {
  conseil:    { eleve_id: 'e2', action: 'conseil', contexte: 'Calcule 3/4 + 1/6 et donne le résultat sous forme irréductible.' },
  verif:      { eleve_id: '17', action: 'verif', question: 'Résoudre 2x = 6.',
                attendu: 'x = 3. RÈGLE : correct si et seulement si la réponse vaut 3.', reponse: 'x = 3' },
  redaction:  { eleve_id: 't1', action: 'redaction', balises: true,
                question: 'f continue et strictement croissante sur [0 ; 2], de -1 à 5 ; k = 2.',
                reponse: 'f est continue et strictement croissante sur [0;2], elle varie de -1 à 5, donc f(x) = 2 admet une unique solution.' },
  definition: { eleve_id: 'e2', action: 'definition', ensemble: 'N',
                texte: 'Ce sont les nombres entiers positifs 0, 1, 2, 3 et ainsi de suite.' },
};
const TEXTES = {
  conseil:    'Commence par chercher un dénominateur commun à 4 et à 6.',
  verif:      '{"correct": true, "feedback": "Bravo, x = 3 est juste."}',
  redaction:  '{"criteres":{"variation":true,"continuite":true,"monotonie":true,"unicite":true},"correct":true,"feedback":"Tout y est."}',
  definition: '{"correct": true, "feedback": "Ta définition est juste."}',
};

/* Et dès le départ, avant le moindre chargement : le fetch natif n'est
   jamais à portée de la fonction. */
globalThis.fetch = faireFetch({ requetes: [], scenario: () => { throw new Error('fetch hors d\'un appel'); } });

/* LES QUESTIONS D'ÉLÈVE, telles que les trois pages les envoient. La fenêtre
   « Pose ta question à l'IA » part en action « conseil », mais exige souvent
   un exemple numérique complet : la fonction la reconnaît au marqueur que
   chaque page pose en tête du contexte (« MISSION « réponse à une question
   d'élève » »), et l'envoie à un effort plus haut que l'indice. Le marqueur
   est LU dans les pages, jamais recopié : une page qui le reformulerait
   ferait retomber ses questions à l'effort de l'indice, sans que rien ne le
   dise — sauf ce banc. */
const QUESTIONS = ['secondes.html', 'premiere-specifique.html', 'terminale.html'].map(f => {
  let texte = null;
  try{
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const m = src.match(/const mission="(MISSION[^"\\]{0,60})/);
    if(m) texte = JSON.parse('"' + m[1] + '"');
  }catch(e){ texte = null; }
  return { page: f, texte };
});

/* ========================================================================== */
(async () => {
console.log('\n══════════════════════════════════════════════════════════');
console.log('BANC DE LA FONCTION EDGE — corriger-definition (aide IA)');
console.log('══════════════════════════════════════════════════════════');

/* Les bornes lues dans la source : si l'une manque, les contrôles qui s'en
   servent n'ont rien à mesurer, et cela se dit ici plutôt que de passer. */
titre('0. CE QUE LE BANC LIT DANS LA FONCTION');
verifier('les bornes DAILY_LIMIT_PER_ELEVE, HOURLY_GLOBAL_LIMIT et MAX_CTX se lisent dans la source',
  DAILY_LIMIT_PER_ELEVE > 0 && HOURLY_GLOBAL_LIMIT > 0 && MAX_CTX > 0,
  'lu : DAILY=' + DAILY_LIMIT_PER_ELEVE + ', HOURLY=' + HOURLY_GLOBAL_LIMIT + ', MAX_CTX=' + MAX_CTX);
verifier('la première origine autorisée se lit dans la source', !!ORIGINE, 'ALLOWED_ORIGINS introuvable');

/* ---------------------------------------------------------------------------
   1. CE QUI PART AU MODÈLE
   -------------------------------------------------------------------------
   Haiku 5.5 rejette d'un 400 un échantillonnage réglé, un préremplissage, un
   budget de réflexion, une liste de replis : chacun de ces 400 se lirait chez
   l'élève « L'IA a renvoyé une erreur (code 400) », sur TOUTE l'aide des trois
   niveaux. Un appel par action, et chaque propriété tenue sur les quatre. */
titre('1. CE QUI PART AU MODÈLE');
{
  const e = etatNeuf();
  const h = await charger(e);
  const parAction = {};
  for(const action of Object.keys(DEMANDES)){
    e.scenario = () => ({ reponse: reponseModele(TEXTES[action]) });
    const avant = e.requetes.length;
    await appel(h, e, DEMANDES[action]);
    if(e.requetes.length > avant) parAction[action] = e.requetes[e.requetes.length - 1];
  }
  const vues = Object.keys(parAction);

  /* Le second bord : un contrôle qui n'a rien à mesurer ne mesure rien, et
     doit le dire — sans quoi une fonction qui n'appelle plus le modèle
     passerait tous les contrôles ci-dessous sans en avoir subi un seul. */
  verifier('les quatre actions (conseil, verif, redaction, definition) ont bien interrogé le modèle',
    vues.length === 4, 'requêtes notées pour : ' + (vues.join(', ') || 'aucune — rien mesuré'));

  function surChaque(intitule, defaut){
    if(!vues.length){ verifier(intitule, false, 'rien mesuré : aucune requête notée par le faux modèle'); return; }
    const fautes = vues.map(a => { const d = defaut(parAction[a], a); return d ? a + ' : ' + d : null; }).filter(Boolean);
    verifier(intitule, fautes.length === 0, fautes.join(' | '));
  }

  surChaque('la requête part en POST vers https://api.anthropic.com/v1/messages', q =>
    (q.url === 'https://api.anthropic.com/v1/messages' && q.methode === 'POST') ? null : q.methode + ' ' + q.url);
  surChaque('le modèle demandé est exactement « ' + MODELE_EXIGE + ' »', q =>
    q.corps.model === MODELE_EXIGE ? null : 'model = ' + JSON.stringify(q.corps.model));
  surChaque('aucun paramètre d\'échantillonnage (temperature, top_p, top_k) : Haiku 5.5 les refuse', q => {
    const l = ['temperature', 'top_p', 'top_k'].filter(k => k in q.corps);
    return l.length ? l.map(k => k + ' = ' + JSON.stringify(q.corps[k])).join(', ') : null;
  });
  surChaque('la conversation finit par un message « user » : aucun préremplissage', q => {
    const m = q.corps.messages;
    if(!Array.isArray(m) || !m.length) return 'messages absent ou vide';
    return m[m.length - 1].role === 'user' ? null : 'dernier message : ' + m[m.length - 1].role;
  });
  surChaque('la réflexion est absente ou adaptative, sans budget_tokens', q => {
    const t = q.corps.thinking;
    if(t === undefined) return null;
    return (t && t.type === 'adaptive' && !('budget_tokens' in t)) ? null : 'thinking = ' + JSON.stringify(t);
  });
  surChaque('l\'effort vaut « low » pour l\'indice du bouton Conseil, « medium » pour verif, redaction et definition', (q, a) => {
    const voulu = a === 'conseil' ? 'low' : 'medium';
    const vu = q.corps.output_config && q.corps.output_config.effort;
    return vu === voulu ? null : 'output_config.effort = ' + JSON.stringify(vu) + ', attendu « ' + voulu + ' »';
  });
  surChaque('max_tokens laisse place à la réflexion (≥ 8000)', q =>
    (typeof q.corps.max_tokens === 'number' && q.corps.max_tokens >= 8000) ? null : 'max_tokens = ' + JSON.stringify(q.corps.max_tokens));
  surChaque('aucun repli demandé : ni champ « fallbacks », ni en-tête anthropic-beta de repli', q => {
    const d = [];
    if('fallbacks' in q.corps) d.push('fallbacks = ' + JSON.stringify(q.corps.fallbacks));
    if(/fallback/i.test(q.entetes['anthropic-beta'] || '')) d.push('anthropic-beta = ' + q.entetes['anthropic-beta']);
    return d.length ? d.join(', ') : null;
  });
  surChaque('la clé part dans x-api-key, et nulle part dans le corps', q => {
    const d = [];
    if(q.entetes['x-api-key'] !== e.env.ANTHROPIC_API_KEY) d.push('x-api-key = ' + JSON.stringify(q.entetes['x-api-key']));
    if(JSON.stringify(q.corps).includes(e.env.ANTHROPIC_API_KEY)) d.push('la clé est dans le corps');
    return d.length ? d.join(', ') : null;
  });
  surChaque('les en-têtes anthropic-version (2023-06-01) et content-type (application/json) sont envoyés', q => {
    const d = [];
    if(q.entetes['anthropic-version'] !== '2023-06-01') d.push('anthropic-version = ' + JSON.stringify(q.entetes['anthropic-version']));
    if(!/^application\/json/.test(q.entetes['content-type'] || '')) d.push('content-type = ' + JSON.stringify(q.entetes['content-type']));
    return d.length ? d.join(', ') : null;
  });

  /* La question d'élève de CHAQUE page, avec son vrai marqueur. */
  const sansMarqueur = QUESTIONS.filter(x => !x.texte).map(x => x.page);
  const efforts = [];
  for(const x of QUESTIONS.filter(x => x.texte)){
    e.scenario = () => ({ reponse: reponseModele('Voici un exemple complet.') });
    const avant = e.requetes.length;
    await appel(h, e, { eleve_id: 'e2', action: 'conseil', contexte: x.texte + ' Sa question : « montre-moi un exemple ».' });
    const q = e.requetes.length > avant ? e.requetes[e.requetes.length - 1] : null;
    efforts.push(x.page + ' → ' + (q ? JSON.stringify(q.corps.output_config && q.corps.output_config.effort) : 'aucune requête'));
    if(!q || !q.corps.output_config || q.corps.output_config.effort !== 'medium') sansMarqueur.push(x.page + ' (effort ' + (q ? JSON.stringify(q.corps.output_config && q.corps.output_config.effort) : 'non mesuré') + ')');
  }
  verifier('une question d\'élève (marqueur MISSION lu dans les trois pages) part à l\'effort « medium », l\'indice reste à « low »',
    sansMarqueur.length === 0 && efforts.length === 3,
    sansMarqueur.length ? 'en défaut : ' + sansMarqueur.join(', ') : efforts.join(' | '));
}

/* ---------------------------------------------------------------------------
   2. CE QUI REVIENT À L'ÉLÈVE
   -------------------------------------------------------------------------
   Haiku 5.5 rend sa réflexion AVANT sa réponse : content[0] est un bloc
   « thinking », dont le texte est vide par défaut. Lire content[0] comme la
   réponse, c'est rendre du vide à l'élève — et sur un verdict, rendre
   « correct: false » à une réponse juste. Les blocs se lisent par TYPE. */
titre('2. CE QUI REVIENT À L\'ÉLÈVE');
{
  const e = etatNeuf();
  const h = await charger(e);
  const lignes = [];
  async function jouer(action, texte, opts){
    e.scenario = () => ({ reponse: reponseModele(texte, opts) });
    const n = e.journal.length;
    const r = await appel(h, e, DEMANDES[action]);
    lignes.push({ action, eleve: DEMANDES[action].eleve_id, nouvelles: e.journal.slice(n) });
    return r.json || {};
  }

  let j = await jouer('conseil', TEXTES.conseil);
  verifier('conseil : l\'élève reçoit le texte du bloc « text », pas la réflexion',
    j.feedback === TEXTES.conseil, JSON.stringify(j));

  /* La réflexion résumée (display « summarized ») porte du texte : il ne doit
     pas davantage arriver à l'élève. */
  j = await jouer('conseil', TEXTES.conseil, { reflexion: 'RÉFLEXION-INTERNE : la réponse est 11/12.' });
  verifier('conseil : une réflexion qui porte du texte ne part pas à l\'élève',
    j.feedback === TEXTES.conseil && !/RÉFLEXION-INTERNE|11\/12/.test(JSON.stringify(j)), JSON.stringify(j));

  j = await jouer('verif', TEXTES.verif);
  verifier('verif : un JSON « correct: true » placé APRÈS un bloc thinking rend { correct: true, feedback }',
    j.correct === true && j.feedback === 'Bravo, x = 3 est juste.', JSON.stringify(j));

  j = await jouer('verif', TEXTES.verif, { nReflexions: 3 });
  verifier('verif : trois blocs thinking avant le texte rendent encore { correct: true }',
    j.correct === true && j.feedback === 'Bravo, x = 3 est juste.', JSON.stringify(j));

  j = await jouer('verif', '{"correct": false, "feedback": "Revois la division par 2."}');
  verifier('verif : un JSON « correct: false » rend correct: false et son feedback',
    j.correct === false && j.feedback === 'Revois la division par 2.', JSON.stringify(j));

  j = await jouer('redaction', TEXTES.redaction);
  const tous = { variation: true, continuite: true, monotonie: true, unicite: true };
  verifier('redaction : les quatre critères sont rendus, et correct vaut true quand ils sont vrais',
    j.correct === true && JSON.stringify(j.criteres) === JSON.stringify(tous) && j.feedback === 'Tout y est.',
    JSON.stringify(j));

  /* Le modèle peut se contredire ; c'est la fonction qui tranche, critère
     par critère. */
  j = await jouer('redaction', '{"criteres":{"variation":true,"continuite":true,"monotonie":false,"unicite":true},"correct":true,"feedback":"Presque."}');
  verifier('redaction : un critère faux rend correct: false, même si le modèle dit true',
    j.correct === false && j.criteres && j.criteres.monotonie === false, JSON.stringify(j));

  j = await jouer('definition', TEXTES.definition);
  verifier('definition : correct et feedback sont rendus',
    j.correct === true && j.feedback === 'Ta définition est juste.', JSON.stringify(j));

  /* Une ligne par appel, au nom de l'élève : c'est elle que comptent les
     quotas, et elle que lit le professeur. */
  const fautes = lignes.filter(l => l.nouvelles.length !== 1
      || l.nouvelles[0].table !== 'corrections_ia'
      || String(l.nouvelles[0].ligne.eleve_id) !== String(l.eleve))
    .map(l => l.action + ' : ' + JSON.stringify(l.nouvelles));
  verifier('chaque appel réussi écrit UNE ligne dans corrections_ia, au nom de l\'élève',
    lignes.length > 0 && fautes.length === 0, lignes.length ? fautes.join(' | ') : 'rien mesuré');
}

/* ---------------------------------------------------------------------------
   3. REFUS ET COUPURES
   -------------------------------------------------------------------------
   Deux fins de Haiku 5.5 rendent un HTTP 200 sans réponse exploitable : le
   REFUS d'un classificateur de sécurité (stop_reason « refusal », content
   souvent vide, et aucun repli côté serveur), et la COUPURE (stop_reason
   « max_tokens »), parfois avant le moindre texte. Dans les deux cas l'élève
   doit lire une ERREUR — jamais un « correct: true », jamais le texte de
   secours « Je n'ai pas de conseil », jamais un JSON coupé recopié brut. Les
   pages affichent d.error, et pour « verif » basculent sur leur juge local. */
titre('3. REFUS, COUPURES ET RÉPONSES ILLISIBLES');
{
  const e = etatNeuf();
  const h = await charger(e);
  /* Chaque cas exige trois choses : la réponse du faux modèle a bien été
     SERVIE (une requête de plus — sinon une erreur rendue AVANT le modèle, par
     une garde, satisferait le contrôle sans qu'il ait rien mesuré), le message
     PROPRE au cas, et jamais un « correct: true ». */
  async function cas(action, scenario, opts){
    e.scenario = scenario;
    const n = e.journal.length, t = e.traces.length, q = e.requetes.length;
    const corps = (opts && opts.corps) || DEMANDES[action];
    const r = await appel(h, e, corps);
    return { r, j: r.json || {}, servi: e.requetes.length === q + 1,
             lignes: e.journal.slice(n), traces: e.traces.slice(t) };
  }
  function exiger(intitule, c, message, autres){
    const d = [];
    if(!c.servi) d.push('rien mesuré : la réponse du faux modèle n\'a pas été servie');
    if(typeof c.j.error !== 'string' || !message.test(c.j.error)) d.push('message : ' + c.r.texte);
    if(c.j.correct === true) d.push('correct: true rendu');
    (autres || []).forEach(a => { if(a) d.push(a); });
    verifier(intitule, d.length === 0, d.join(' ; '));
  }
  const REFUS = /n.a pas pu (relire|donner|répondre)/;
  const refus = details => ({ id: 'msg_banc', type: 'message', role: 'assistant', model: MODELE_EXIGE, content: [],
                              stop_reason: 'refusal', stop_details: details, usage: { input_tokens: 10, output_tokens: 0 } });
  const GH = { type: 'refusal', category: 'general_harms', explanation: 'déclinée' };

  /* Le REFUS, sous ses trois formes : content vide (avant toute sortie),
     content partiel (après un début de réflexion — ou de texte), et
     stop_details à null. Une fonction qui guetterait « content vide » au lieu
     de stop_reason, ou lirait stop_details sans garde, passait le banc
     (relecture d'octobre 2026). */
  let c = await cas('verif', () => ({ reponse: refus(GH) }));
  exiger('un refus du modèle sur « verif » rend une erreur qui le dit, jamais correct: true', c, REFUS);
  verifier('le refus est journalisé dans corrections_ia, catégorie comprise',
    c.lignes.length === 1 && c.lignes[0].table === 'corrections_ia'
      && /refus/i.test(c.lignes[0].ligne.feedback || '') && /general_harms/.test(c.lignes[0].ligne.feedback || '')
      && String(c.lignes[0].ligne.eleve_id) === DEMANDES.verif.eleve_id,
    JSON.stringify(c.lignes));
  verifier('le refus laisse une trace dans les journaux de la fonction, catégorie comprise',
    c.traces.some(x => /general_harms/.test(x)), JSON.stringify(c.traces));

  c = await cas('verif', () => ({ reponse: reponseModele(null, { stop: 'refusal', details: GH }) }));
  exiger('un refus survenu APRÈS la réflexion (content partiel) rend la même erreur', c, REFUS);

  c = await cas('verif', () => ({ reponse: reponseModele('{"correct": true, "feedback": "Bravo', { stop: 'refusal', details: GH }) }));
  exiger('un refus survenu au milieu du texte ne montre rien de ce texte', c, REFUS,
    [/Bravo/.test(c.r.texte) ? 'le texte partiel est montré à l\'élève' : null]);

  c = await cas('verif', () => ({ reponse: refus(null) }));
  exiger('un refus sans stop_details rend la même erreur, et se journalise', c, REFUS,
    [c.lignes.length === 1 && /refus/i.test(c.lignes[0].ligne.feedback || '') ? null : 'journal : ' + JSON.stringify(c.lignes)]);

  /* Le message suit ce que l'élève a fait : l'indice est fabriqué par la page,
     l'élève n'a rien à reformuler. */
  c = await cas('conseil', () => ({ reponse: refus(GH) }));
  exiger('un refus sur l\'indice du bouton Conseil dit qu\'aucun indice n\'a pu être donné, sans texte de secours', c, /n.a pas pu donner d.indice/,
    [/pas de conseil/.test(c.r.texte) ? 'le texte de secours « Je n\'ai pas de conseil » est rendu' : null]);
  const question = QUESTIONS.find(x => x.texte);
  if(question){
    c = await cas('conseil', () => ({ reponse: refus(GH) }), { corps: { eleve_id: 'e2', action: 'conseil', contexte: question.texte + ' Sa question : « pourquoi ? »' } });
    exiger('un refus sur une question d\'élève l\'invite à la reformuler', c, /n.a pas pu répondre à cette question/);
  }else verifier('un refus sur une question d\'élève l\'invite à la reformuler', false, 'rien mesuré : aucun marqueur MISSION lu dans les pages');

  /* La COUPURE : la réflexion a pris toute la borne, ou le JSON d'un verdict
     s'arrête au milieu, le « true » déjà écrit. Ni le deviner, ni le montrer. */
  c = await cas('conseil', () => ({ reponse: reponseModele(null, { stop: 'max_tokens' }) }));
  exiger('une coupure (max_tokens, la réflexion seule) rend une erreur qui le dit', c, /coupée/,
    [c.lignes.length === 1 && /coup/i.test(c.lignes[0].ligne.feedback || '') ? null : 'journal : ' + JSON.stringify(c.lignes)]);
  c = await cas('verif', () => ({ reponse: reponseModele('{"correct": true, "feedb', { stop: 'max_tokens' }) }));
  exiger('une coupure au milieu du JSON de « verif » rend une erreur, ni correct: true ni le JSON brut', c, /coupée/,
    [/feedb/.test(c.r.texte) ? 'le JSON coupé est montré à l\'élève' : null]);

  /* La réponse ILLISIBLE : un 200 sans texte, ou un texte qui n'est pas le
     JSON demandé. La fonction rendait jusqu'ici un verdict « faux » de
     secours — ou la prose du modèle (« bravo ! ») comptée fausse : copie
     verrouillée en Terminale, juge local de la Seconde et de la Première
     court-circuité. Une erreur, comme le refus. */
  c = await cas('verif', () => ({ reponse: reponseModele(null) }));
  exiger('une réponse sans texte sur « verif » rend une erreur, jamais un verdict', c, /illisible/,
    ['correct' in c.j ? 'un verdict est rendu : correct = ' + c.j.correct : null,
     c.lignes.length === 1 && /illisible/.test(c.lignes[0].ligne.feedback || '') ? null : 'journal : ' + JSON.stringify(c.lignes)]);
  c = await cas('verif', () => ({ reponse: reponseModele('Ta réponse x = 3 est correcte, bravo !') }));
  exiger('un texte qui n\'est pas le JSON demandé, sur « verif », rend une erreur, jamais correct: false', c, /illisible/,
    ['correct' in c.j ? 'un verdict est rendu : correct = ' + c.j.correct : null]);
  c = await cas('redaction', () => ({ reponse: reponseModele('{"correct": true, "feedback": "Tout y est."}') }));
  exiger('une rédaction jugée sans ses critères rend une erreur', c, /illisible/);
  c = await cas('conseil', () => ({ reponse: reponseModele(null) }));
  exiger('un indice sans texte rend une erreur, pas le texte de secours', c, /illisible/,
    [/pas de conseil/.test(c.r.texte) ? 'le texte de secours est rendu' : null]);

  /* Les erreurs HTTP : une SURCHARGE se réessaie (Haiku 5.5 n'a aucun repli
     côté serveur), une erreur de CONFIGURATION concerne le professeur ; aucune
     des deux ne demande à l'élève de vérifier une clé d'API. Le code reste
     dans le message : c'est lui que la notice apprend à lire. */
  c = await cas('verif', () => ({ statut: 529, corps: '{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}' }));
  exiger('une surcharge (HTTP 529) dit de réessayer, et cite le code', c, /sollicitée.*529/,
    [/clé API/.test(c.r.texte) ? 'l\'élève lit « clé API »' : null]);
  c = await cas('verif', () => ({ statut: 404, corps: '{"type":"error","error":{"type":"not_found_error","message":"model"}}' }));
  exiger('une erreur de configuration (HTTP 404) dit de prévenir le professeur, et cite le code', c, /mal configurée.*404/,
    [/clé API/.test(c.r.texte) ? 'l\'élève lit « clé API »' : null]);

  c = await cas('conseil', () => ({ leve: 'ECONNRESET' }));
  exiger('un fetch qui lève rend « Impossible de joindre l\'IA »', c, /Impossible de joindre l.IA/);
}

/* ---------------------------------------------------------------------------
   4. LES GARDES AVANT LE MODÈLE
   -------------------------------------------------------------------------
   Chaque garde doit arrêter la demande AVANT le modèle : zéro requête au faux
   modèle. Le témoin, d'abord : le même appel, sans garde, l'atteint bien —
   sans lui, « zéro requête » ne prouverait rien. Et là où une borne se joue,
   ses deux bords : à la borne, refusé ; juste en dessous, servi. */
titre('4. LES GARDES AVANT LE MODÈLE');
{
  async function garde(intitule, preparer, corps, opts, attendu){
    const e = etatNeuf();
    preparer(e);
    const h = await charger(e);
    const r = await appel(h, e, corps, opts);
    const j = r.json || {};
    const n = e.requetes.length;
    if(attendu === 'servi'){
      verifier(intitule, n === 1 && !j.error, n + ' requête(s) au modèle — ' + r.texte);
    }else{
      verifier(intitule, n === 0 && typeof j.error === 'string' && j.error.length > 0,
        n + ' requête(s) au modèle — ' + r.texte);
    }
  }
  const rien = () => {};

  await garde('témoin : sans garde, le même appel atteint le modèle', rien, DEMANDES.verif, {}, 'servi');

  await garde('un élève inconnu n\'atteint pas le modèle', rien,
    Object.assign({}, DEMANDES.verif, { eleve_id: 'inconnu' }), {}, 'refuse');

  if(DAILY_LIMIT_PER_ELEVE > 0){
    await garde('quota journalier atteint (' + DAILY_LIMIT_PER_ELEVE + ', lu dans la source) : rien ne part',
      e => { e.compteEleve = DAILY_LIMIT_PER_ELEVE; }, DEMANDES.verif, {}, 'refuse');
    await garde('juste sous le quota journalier (' + (DAILY_LIMIT_PER_ELEVE - 1) + '), l\'appel passe',
      e => { e.compteEleve = DAILY_LIMIT_PER_ELEVE - 1; }, DEMANDES.verif, {}, 'servi');
  }else verifier('quota journalier', false, 'rien mesuré : DAILY_LIMIT_PER_ELEVE introuvable dans la source');

  if(HOURLY_GLOBAL_LIMIT > 0){
    await garde('plafond horaire atteint (' + HOURLY_GLOBAL_LIMIT + ', lu dans la source) : rien ne part',
      e => { e.compteGlobal = HOURLY_GLOBAL_LIMIT; }, DEMANDES.verif, {}, 'refuse');
    await garde('juste sous le plafond horaire (' + (HOURLY_GLOBAL_LIMIT - 1) + '), l\'appel passe',
      e => { e.compteGlobal = HOURLY_GLOBAL_LIMIT - 1; }, DEMANDES.verif, {}, 'servi');
  }else verifier('plafond horaire', false, 'rien mesuré : HOURLY_GLOBAL_LIMIT introuvable dans la source');

  await garde('une origine étrangère n\'atteint pas le modèle', rien, DEMANDES.verif,
    { origine: 'https://exemple.invalid' }, 'refuse');

  if(MAX_CTX > 0){
    await garde('un contexte de conseil au-delà de MAX_CTX (' + MAX_CTX + ', lu dans la source) n\'atteint pas le modèle', rien,
      Object.assign({}, DEMANDES.conseil, { contexte: 'a'.repeat(MAX_CTX + 1) }), {}, 'refuse');
    await garde('un contexte de conseil de MAX_CTX caractères tout juste est servi', e => {
      e.scenario = () => ({ reponse: reponseModele(TEXTES.conseil) });
    }, Object.assign({}, DEMANDES.conseil, { contexte: 'a'.repeat(MAX_CTX) }), {}, 'servi');
  }else verifier('borne MAX_CTX', false, 'rien mesuré : MAX_CTX introuvable dans la source');

  await garde('sans clé ANTHROPIC_API_KEY, rien ne part', e => { delete e.env.ANTHROPIC_API_KEY; },
    DEMANDES.verif, {}, 'refuse');

  /* Le préflight du navigateur : sans un 200, la page ne peut même pas
     poser sa question. */
  {
    const e = etatNeuf();
    const h = await charger(e);
    const r = await appel(h, e, null, { methode: 'OPTIONS' });
    verifier('la requête OPTIONS de préflight rend 200, sans rien demander au modèle',
      r.statut === 200 && e.requetes.length === 0
        && r.entetes.get('access-control-allow-origin') === ORIGINE,
      'statut ' + r.statut + ', ' + e.requetes.length + ' requête(s), allow-origin '
        + r.entetes.get('access-control-allow-origin'));
  }
}

verifier('aucun appel réseau n\'est sorti du faux modèle', etrangers.length === 0,
  etrangers.length + ' appel(s) vers ' + Array.from(new Set(etrangers)).join(', '));

console.log('\n──────────────────────────────────────────────────────────');
if(echecs){
  console.log('✗ ' + echecs + ' échec(s) sur ' + controles + ' contrôles. NE PAS déployer.');
  process.exit(1);
}
console.log('✓ ' + controles + ' contrôles passés. La fonction peut être déployée.');
})().catch(e => { console.error('\n' + (e && e.stack || e)); process.exit(1); });
