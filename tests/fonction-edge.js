#!/usr/bin/env node
/* ============================================================================
   BANC DE LA FONCTION EDGE — admin-eleve, réellement exécutée
   ============================================================================
   Cette fonction porte les gestes les plus lourds de conséquences : donner un
   code, ajouter un élève, en retirer un, effacer une classe. Elle tient la clé
   de service, celle qui traverse toutes les règles d'accès.

   Et jusqu'ici AUCUN banc ne l'exécutait. Le banc navigateur remplace Supabase
   par un double et ne l'appelle jamais ; le banc de base ne connaît que
   PostgreSQL. Elle n'était vérifiée que par la relecture — et c'est ainsi qu'un
   défaut bloquant est passé : « Nouveau code » refusait tous les élèves créés
   AVANT la bascule, faute de compte Supabase. Sept élèves sur huit inutilisables.

   Elle tourne chez Deno ; ce banc la charge dans Node. Trois substitutions
   suffisent : l'import de supabase-js, Deno.serve, et Deno.env. Le reste du
   fichier est exécuté TEL QUEL — c'est le vrai code qui répond, pas une copie.
   ========================================================================== */
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'supabase/functions/admin-eleve/index.ts');

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

/* ---------------------------------------------------------------------------
   Un faux Supabase : il tient les lignes et les comptes en mémoire, et note
   ce qu'on lui demande. Il distingue la clé de service de la clé publique,
   comme le vrai — c'est ce qui rend le contrôle « qui appelle » significatif.
   ------------------------------------------------------------------------- */
function faireSupabase(etat){
  return function createClient(url, cle, opts){
    const commeService = (cle === 'CLE-DE-SERVICE');
    const entete = opts && opts.global && opts.global.headers
                 && opts.global.headers.Authorization;

    /* Le constructeur de requêtes de supabase-js : l'opération est DIFFÉRÉE
       jusqu'à l'attente. C'est ce qui permet .update({…}).eq('id', x).
       La première version de ce double appliquait la modification tout de
       suite, puis rendait une promesse — donc .eq() n'existait plus, ET la
       modification touchait TOUTES les lignes. Un double qui ment ainsi est
       pire qu'un banc absent : il valide ce qu'il vient lui-même de casser. */
    function table(nom){
      const filtres = [];
      let op = null, charge = null;
      const lignes = () => (etat.tables[nom] = etat.tables[nom] || []);
      const colle = x => filtres.every(([c, v]) =>
        String(x[c]).toLowerCase() === String(v).toLowerCase());

      function executer(){
        if(op === 'insert'){
          etat.journal.push({ op: 'insert', table: nom, ligne: charge });
          lignes().push(Object.assign({ id: 'n' + (++etat.suivant) }, charge));
          return { data: null, error: null };
        }
        if(op === 'update'){
          const touchees = lignes().filter(colle);
          touchees.forEach(x => Object.assign(x, charge));
          etat.journal.push({ op: 'update', table: nom, chg: charge, n: touchees.length });
          return { data: null, error: null };
        }
        if(op === 'delete'){
          const gardees = lignes().filter(x => !colle(x));
          etat.journal.push({ op: 'delete', table: nom, n: lignes().length - gardees.length });
          etat.tables[nom] = gardees;
          return { data: null, error: null };
        }
        return { data: lignes().filter(colle), error: null };
      }

      const b = {
        select(){ op = op || 'select'; return b; },
        insert(x){ op = 'insert'; charge = x; return b; },
        update(x){ op = 'update'; charge = x; return b; },
        delete(){ op = 'delete'; return b; },
        eq(c, v){ filtres.push([c, v]); return b; },
        ilike(c, v){ filtres.push([c, v]); return b; },
        neq(){ return b; },
        maybeSingle(){
          const r = executer();
          return Promise.resolve({ data: (r.data || [])[0] || null, error: null });
        },
        then(ok, ko){ return Promise.resolve().then(executer).then(ok, ko); },
      };
      return b;
    }

    return {
      from: table,
      auth: {
        async getUser(){
          /* Le vrai GoTrue lit le jeton porté par l'en-tête. Le double aussi :
             sans cela, « qui appelle » ne voudrait rien dire. */
          const jeton = String(entete || '').replace(/^Bearer /, '');
          const u = etat.comptes[jeton];
          return u ? { data: { user: { id: u.id } }, error: null }
                   : { data: { user: null }, error: { message: 'bad jwt' } };
        },
        admin: {
          async createUser(a){
            if(!commeService) throw new Error('createUser sans la clé de service');
            if(Object.values(etat.comptes).some(c => c.email === a.email))
              return { data: null, error: { message: 'User already registered' } };
            const id = 'auth' + (++etat.suivant);
            etat.comptes['jeton-' + id] = { id, email: a.email, mdp: a.password,
                                            app_metadata: a.app_metadata || {} };
            etat.journal.push({ op: 'createUser', email: a.email, mdp: a.password,
                                app_metadata: a.app_metadata || {} });
            return { data: { user: { id } }, error: null };
          },
          async updateUserById(id, a){
            if(!commeService) throw new Error('updateUserById sans la clé de service');
            const c = Object.values(etat.comptes).find(x => x.id === id);
            if(!c) return { data: null, error: { message: 'User not found' } };
            if(a.password) c.mdp = a.password;
            if(a.app_metadata) c.app_metadata = Object.assign({}, c.app_metadata, a.app_metadata);
            etat.journal.push({ op: 'updateUserById', id, a });
            return { data: { user: { id } }, error: null };
          },
          async deleteUser(id){ etat.journal.push({ op: 'deleteUser', id }); return { error: null }; },
        },
      },
    };
  };
}

/* ---------------------------------------------------------------------------
   Charger la VRAIE fonction, avec le minimum de substitutions
   ------------------------------------------------------------------------- */
async function charger(etat){
  let src = fs.readFileSync(SOURCE, 'utf8');
  const avant = src;
  src = src.replace(/^import \{ createClient \}.*$/m,
                    'const createClient = globalThis.__createClient;');
  src = src.replace(/Deno\.serve\(/, 'globalThis.__poser(');
  if(src === avant) throw new Error('substitutions impossibles : la fonction a changé de forme');

  globalThis.Deno = { env: { get: n => etat.env[n] } };
  globalThis.__createClient = faireSupabase(etat);
  let recu = null;
  globalThis.__poser = h => { recu = h; };

  const f = path.join(os.tmpdir(), 'edge-' + process.pid + '-' + (++nCharge) + '.ts');
  fs.writeFileSync(f, src);
  await import('file://' + f);
  fs.unlinkSync(f);
  if(!recu) throw new Error('la fonction n\'a rien enregistré : Deno.serve introuvable');
  return recu;
}

function etatNeuf(){
  return {
    env: { SUPABASE_URL: 'https://x.supabase.co',
           SUPABASE_SERVICE_ROLE_KEY: 'CLE-DE-SERVICE',
           SUPABASE_ANON_KEY: 'CLE-PUBLIQUE' },
    tables: {}, comptes: {}, journal: [], suivant: 0,
  };
}
const appel = (h, corps, jeton) => h(new Request('https://f/', {
  method: 'POST',
  headers: Object.assign({ 'Content-Type': 'application/json' },
                         jeton ? { Authorization: 'Bearer ' + jeton } : {}),
  body: JSON.stringify(corps),
}));

/* ========================================================================== */
(async () => {
console.log('\n══════════════════════════════════════════════════════════');
console.log('BANC DE LA FONCTION EDGE — admin-eleve');
console.log('══════════════════════════════════════════════════════════');

/* --- 1. qui a le droit de demander quoi ---------------------------------- */
titre('1. QUI A LE DROIT');
{
  const e = etatNeuf();
  e.comptes['jeton-prof']  = { id: 'idprof',  email: 'p@x' };
  e.comptes['jeton-eleve'] = { id: 'ideleve', email: 'e@x' };
  e.tables.professeurs = [{ user_id: 'idprof' }];
  const h = await charger(e);

  let r = await appel(h, { action: 'nouveau-code', niveau: 'secondes', eleveId: 'x' });
  verifier('sans jeton, tout est refusé', r.status === 401, 'statut ' + r.status);

  r = await appel(h, { action: 'nouveau-code', niveau: 'secondes', eleveId: 'x' }, 'jeton-inconnu');
  verifier('un jeton inconnu est refusé', r.status === 401, 'statut ' + r.status);

  r = await appel(h, { action: 'nouveau-code', niveau: 'secondes', eleveId: 'x' }, 'jeton-eleve');
  verifier('un élève ne peut pas donner de code', r.status === 403, 'statut ' + r.status);

  r = await appel(h, { action: 'ajouter', niveau: 'inconnu', prenom: 'X' }, 'jeton-prof');
  verifier('un niveau inconnu est refusé', r.status === 400, 'statut ' + r.status);
}

/* --- 2. le seul geste d'un élève : retirer SON marqueur ------------------- */
titre('2. LE SEUL GESTE D\'UN ÉLÈVE');
{
  const e = etatNeuf();
  e.comptes['jeton-a'] = { id: 'ida', email: 'a@x', app_metadata: { code_provisoire: true } };
  e.comptes['jeton-b'] = { id: 'idb', email: 'b@x', app_metadata: { code_provisoire: true } };
  const h = await charger(e);

  const r = await appel(h, { action: 'code-choisi', niveau: 'secondes' }, 'jeton-a');
  verifier('un élève retire son marqueur sans être professeur', r.status === 200, 'statut ' + r.status);
  verifier('le marqueur de CET élève est retiré',
    e.comptes['jeton-a'].app_metadata.code_provisoire === false);

  /* Le point qui compte : la fonction ne doit JAMAIS viser l'identifiant que
     le client envoie, mais celui que porte son jeton. Sinon un élève
     débloquerait le compte d'un camarade depuis sa console. */
  const maj = e.journal.filter(j => j.op === 'updateUserById');
  verifier('elle vise l’identifiant du jeton, pas celui envoyé',
    maj.length === 1 && maj[0].id === 'ida', JSON.stringify(maj.map(m => m.id)));
  verifier('le marqueur du camarade n’a pas bougé',
    e.comptes['jeton-b'].app_metadata.code_provisoire === true);
}

/* --- 3. donner un nouveau code ------------------------------------------- */
titre('3. DONNER UN NOUVEAU CODE');
{
  const e = etatNeuf();
  e.comptes['jeton-prof'] = { id: 'idprof', email: 'p@x' };
  e.tables.professeurs = [{ user_id: 'idprof' }];
  e.comptes['jeton-lea'] = { id: 'idlea', email: 'cle-lea@eleves.exercices-interactifs.invalid', mdp: 'exo-000000' };
  e.tables.eleves_2nde = [
    { id: 1, prenom: 'Lea',  cle: 'cle-lea', user_id: 'idlea' },
    /* Zoé existait AVANT la bascule : la migration lui a ajouté user_id, mais
       vide. C'est le cas de tous les élèves déjà en base — sept sur huit chez
       Turquet le 12 août 2026. */
    { id: 2, prenom: 'Zoe',  cle: null,      user_id: null },
  ];
  const h = await charger(e);

  let r = await appel(h, { action: 'nouveau-code', niveau: 'secondes', eleveId: 1 }, 'jeton-prof');
  let j = await r.json();
  verifier('un élève qui a un compte reçoit un nouveau code',
    r.status === 200 && /^\d{6}$/.test(String(j.code || '')), JSON.stringify(j));
  verifier('son mot de passe a bien changé',
    e.comptes['jeton-lea'].mdp === 'exo-' + j.code, e.comptes['jeton-lea'].mdp);
  verifier('son code est marqué provisoire',
    e.comptes['jeton-lea'].app_metadata.code_provisoire === true);

  /* LE contrôle qui manquait. */
  r = await appel(h, { action: 'nouveau-code', niveau: 'secondes', eleveId: 2 }, 'jeton-prof');
  j = await r.json();
  verifier('un élève SANS compte en reçoit un, au lieu d’être refusé',
    r.status === 200 && /^\d{6}$/.test(String(j.code || '')),
    'statut ' + r.status + ' — ' + JSON.stringify(j));

  const cree = e.journal.filter(x => x.op === 'createUser');
  verifier('un compte lui a été créé', cree.length === 1, cree.length + ' création(s)');
  const ligne = (e.tables.eleves_2nde || []).find(x => x.prenom === 'Zoe');
  verifier('sa ligne reçoit une clé et un identifiant de compte',
    !!(ligne && ligne.cle && ligne.user_id),
    'cle=' + (ligne && ligne.cle) + ' user_id=' + (ligne && ligne.user_id));
  if(cree.length === 1 && ligne && ligne.cle){
    verifier('l’adresse du compte est dérivée de cette clé',
      cree[0].email === ligne.cle + '@eleves.exercices-interactifs.invalid', cree[0].email);
    verifier('le code affiché est bien celui du compte',
      cree[0].mdp === 'exo-' + j.code, cree[0].mdp);
  }
}

/* --- 4. ajouter un élève ------------------------------------------------- */
titre('4. AJOUTER UN ÉLÈVE');
{
  const e = etatNeuf();
  e.comptes['jeton-prof'] = { id: 'idprof', email: 'p@x' };
  e.tables.professeurs = [{ user_id: 'idprof' }];
  e.tables.eleves_2nde = [{ id: 1, prenom: 'Lea', cle: 'c1', user_id: 'u1' }];
  const h = await charger(e);

  let r = await appel(h, { action: 'ajouter', niveau: 'secondes', prenom: 'Tom' }, 'jeton-prof');
  let j = await r.json();
  verifier('un nouvel élève est créé avec un code à 6 chiffres',
    r.status === 200 && /^\d{6}$/.test(String(j.code || '')), JSON.stringify(j));

  r = await appel(h, { action: 'ajouter', niveau: 'secondes', prenom: 'lea' }, 'jeton-prof');
  verifier('un prénom déjà pris est refusé, quelle que soit la casse',
    r.status === 409, 'statut ' + r.status);

  r = await appel(h, { action: 'ajouter', niveau: 'secondes', prenom: '  ' }, 'jeton-prof');
  verifier('un prénom vide est refusé', r.status === 400, 'statut ' + r.status);
}

/* --- 5. les variables d'environnement ------------------------------------ */
titre('5. LES DEUX GÉNÉRATIONS DE CLÉS SUPABASE');
{
  const e = etatNeuf();
  e.env = { SUPABASE_URL: 'https://x.supabase.co',
            SUPABASE_SECRET_KEY: 'CLE-DE-SERVICE',        /* noms récents */
            SUPABASE_PUBLISHABLE_KEY: 'CLE-PUBLIQUE' };
  e.comptes['jeton-prof'] = { id: 'idprof', email: 'p@x' };
  e.tables.professeurs = [{ user_id: 'idprof' }];
  e.tables.eleves_2nde = [];
  const h = await charger(e);
  const r = await appel(h, { action: 'ajouter', niveau: 'secondes', prenom: 'Ana' }, 'jeton-prof');
  verifier('les noms récents (SECRET / PUBLISHABLE) sont acceptés',
    r.status === 200, 'statut ' + r.status);

  const e2 = etatNeuf();
  e2.env = { SUPABASE_URL: 'https://x.supabase.co' };     /* rien d'autre */
  const h2 = await charger(e2);
  const r2 = await appel(h2, { action: 'ajouter', niveau: 'secondes', prenom: 'Ana' }, 'jeton-prof');
  const j2 = await r2.json();
  verifier('leur absence est dite explicitement',
    r2.status === 500 && /environnement/.test(String(j2.erreur || '')), JSON.stringify(j2));
}

console.log('\n──────────────────────────────────────────────────────────');
if(echecs){
  console.log('✗ ' + echecs + ' échec(s) sur ' + controles + ' contrôles. NE PAS déployer.');
  process.exit(1);
}
console.log('✓ ' + controles + ' contrôles passés. La fonction peut être déployée.');
})().catch(e => { console.error('\n' + (e && e.stack || e)); process.exit(1); });
