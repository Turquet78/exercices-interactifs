#!/usr/bin/env node
/* ============================================================================
   BANC DE LA BASE DE DONNÉES — les politiques protègent-elles vraiment ?
   ============================================================================
   Les trois autres bancs ne voient pas Supabase : ils le remplacent par un
   double en mémoire, exprès, pour qu'aucun test ne touche les comptes réels.
   Ce choix a un angle mort — aucun d'eux ne peut dire si les règles d'accès de
   la base tiennent. C'est justement là que vivaient les trois fuites.

   Ce banc comble l'angle mort sans jamais approcher le vrai projet : il lève un
   PostgreSQL jetable, y recrée l'état d'AVANT (colonne « pin » en clair, aucune
   RLS), y joue la VRAIE migration, puis se met tour à tour dans la peau d'un
   visiteur, de deux élèves et du professeur pour vérifier ce que chacun obtient.

   Ce que ce banc ne voit pas, et qu'il faut donc vérifier à la main une fois sur
   le projet : la configuration de l'authentification Supabase (confirmation par
   courriel désactivée, inscriptions ouvertes). Elle ne vit pas dans le schéma.
   ========================================================================== */
const { execFileSync, spawnSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const PORT   = process.env.PORT_BASE || '55433';
const DOSSIER = path.join(os.tmpdir(), 'banc-base-' + process.pid);

/* Sur cette machine, initdb refuse de tourner en root : il faut passer par un
   utilisateur ordinaire. Sur une machine de développement et sur l'intégration
   continue, on est déjà un utilisateur ordinaire et le détour est inutile. */
const ROOT = typeof process.getuid === 'function' && process.getuid() === 0;

function trouverBin(){
  const direct = spawnSync('which', ['initdb'], { encoding:'utf8' });
  if(direct.status === 0 && direct.stdout.trim()) return path.dirname(direct.stdout.trim());
  const base = '/usr/lib/postgresql';
  if(fs.existsSync(base)){
    const versions = fs.readdirSync(base).sort((a,b) => parseInt(b,10) - parseInt(a,10));
    for(const v of versions){
      const bin = path.join(base, v, 'bin');
      if(fs.existsSync(path.join(bin, 'initdb'))) return bin;
    }
  }
  return null;
}

const BIN = trouverBin();
if(!BIN){
  console.error('\n╔══════════════════════════════════════════════════════════╗');
  console.error('║  CE CONTRÔLE N\'A PAS PU ÊTRE EXÉCUTÉ                     ║');
  console.error('╚══════════════════════════════════════════════════════════╝');
  console.error('PostgreSQL est introuvable, donc les règles d\'accès de la base');
  console.error('n\'ont été vérifiées PAR RIEN. Le reste du banc ne les voit pas.');
  console.error('');
  console.error('  Debian / Ubuntu : sudo apt-get install -y postgresql');
  console.error('  macOS (brew)    : brew install postgresql@16');
  console.error('');
  console.error('Pour passer outre en connaissance de cause : SANS_BASE=1');
  process.exit(process.env.SANS_BASE ? 0 : 1);
}

function sh(cmd, args, opts){
  const o = Object.assign({ encoding:'utf8', stdio:'pipe' }, opts || {});
  if(ROOT){
    /* su -c prend UNE chaîne : on cite chaque morceau. */
    const ligne = [path.join(BIN, cmd)].concat(args).map(a => "'" + String(a).replace(/'/g, "'\\''") + "'").join(' ');
    return execFileSync('su', ['postgres', '-c', ligne], o);
  }
  return execFileSync(path.join(BIN, cmd), args, o);
}

/* psql écrit ses NOTICE sur la sortie d'ERREUR, pas sur la sortie standard.
   La première version de ce banc ne lisait que la sortie standard : la section
   « ce que chaque rôle obtient » n'affichait donc rien du tout — et passait
   pour verte, puisque rien n'avait échoué. Un banc muet qui se déclare vert
   est précisément la panne que ce dépôt cherche à ne plus revoir. */
function shTout(cmd, args){
  const cible = ROOT ? 'su' : path.join(BIN, cmd);
  const argv  = ROOT
    ? ['postgres', '-c', [path.join(BIN, cmd)].concat(args)
        .map(a => "'" + String(a).replace(/'/g, "'\\''") + "'").join(' ')]
    : args;
  const r = spawnSync(cible, argv, { encoding:'utf8' });
  return { code: r.status, texte: String(r.stdout || '') + String(r.stderr || '') };
}

let demarre = false;
function arreter(){
  if(!demarre) return;
  demarre = false;
  try{ sh('pg_ctl', ['-D', path.join(DOSSIER, 'data'), '-m', 'immediate', 'stop']); }catch(e){}
  try{ fs.rmSync(DOSSIER, { recursive:true, force:true }); }catch(e){}
}
process.on('exit', arreter);
['SIGINT','SIGTERM'].forEach(s => process.on(s, () => { arreter(); process.exit(130); }));

console.log('\n══════════════════════════════════════════════════════════');
console.log('BANC DE LA BASE — règles d\'accès');
console.log('══════════════════════════════════════════════════════════');
console.log('PostgreSQL : ' + BIN);

fs.mkdirSync(DOSSIER, { recursive:true });
if(ROOT){
  /* le serveur tourne sous « postgres » : il lui faut le dossier ET le chemin */
  fs.chmodSync(DOSSIER, 0o777);
  execFileSync('chown', ['-R', 'postgres', DOSSIER]);
}

try{
  /* « -U postgres » n'est pas décoratif : sans lui, initdb nomme le
     superutilisateur d'après l'utilisateur système. Ici il s'appelle postgres
     et tout marche ; sur l'intégration continue il s'appelle runner, et toutes
     les connexions « -U postgres » échouent. Le banc était vert sur cette
     machine et rouge sur GitHub. */
  sh('initdb', ['-D', path.join(DOSSIER, 'data'), '--auth=trust', '-E', 'UTF8', '-U', 'postgres']);
  sh('pg_ctl', ['-D', path.join(DOSSIER, 'data'),
                '-o', '-p ' + PORT + ' -k ' + DOSSIER,
                '-l', path.join(DOSSIER, 'serveur.log'), '-w', 'start']);
  demarre = true;
}catch(e){
  console.error('\nLe serveur d\'essai n\'a pas démarré :');
  console.error(String(e.stderr || e.message));
  try{ console.error(fs.readFileSync(path.join(DOSSIER, 'serveur.log'), 'utf8')); }catch(_){}
  process.exit(1);
}

function psql(bd, args, tolerant){
  const r = shTout('psql', ['-h', DOSSIER, '-p', PORT, '-U', 'postgres', '-d', bd,
                            '-v', 'ON_ERROR_STOP=1', '-q'].concat(args));
  if(r.code !== 0){
    if(tolerant) return { erreur: r.texte };
    console.error('\n' + r.texte);
    throw new Error('psql a échoué');
  }
  return r.texte;
}

function monter(bd){
  psql('postgres', ['-c', 'drop database if exists ' + bd]);
  psql('postgres', ['-c', 'create database ' + bd]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/000_socle_de_controle.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'tests/base-avant.sql')]);
  return bd;
}

let echecs = 0;
function bilan(intitule, ok, detail){
  console.log('   ' + (ok ? '✓' : '✗') + ' ' + intitule + (ok || !detail ? '' : '  → ' + detail));
  if(!ok) echecs++;
}

/* ---------------------------------------------------------------------------
   1. La migration s'applique sur l'état réel, et se rejoue sans dégât
   ------------------------------------------------------------------------- */
console.log('\n1. LA MIGRATION');
const MIG = path.join(RACINE, 'supabase/migrations/001_comptes_et_verrouillage.sql');
monter('banc');
const avant = psql('banc', ['-tAc',
  "select count(*) from information_schema.columns where table_schema='public' and column_name='pin'"]).trim();
bilan('l\'état de départ a bien des codes en clair (' + avant + ' colonnes pin)', avant === '3');

const ouvertes = psql('banc', ['-tAc',
  "select count(*) from pg_policies where schemaname='public' and policyname not like 'p\\_%' and coalesce(qual,'true')='true'"]).trim();
bilan('l\'état de départ a bien les 9 politiques grandes ouvertes du projet (' + ouvertes + ')', ouvertes === '9');

let sortie = psql('banc', ['-f', MIG]);
bilan('elle s\'applique sur les tables telles qu\'elles sont aujourd\'hui', true);
bilan('elle affiche l\'état antérieur avant d\'y toucher', /ÉTAT AVANT MIGRATION/.test(sortie));

const r2 = psql('banc', ['-f', MIG], true);
bilan('la rejouer ne casse rien', !r2.erreur, r2.erreur);

/* ---------------------------------------------------------------------------
   1 bis. La démonstration : 001 SEULE ne protège rien
   -------------------------------------------------------------------------
   PostgreSQL combine les politiques permissives par un OU. Les neuf politiques
   « for all using(true) » que portait le projet annulent donc toutes celles que
   001 pose à côté. Ce contrôle l'exige plutôt que de l'affirmer : joué après la
   seule migration 001, le banc des rôles DOIT échouer. S'il passait, c'est que
   ce banc ne mesure pas ce qu'il croit mesurer. */
const avec001 = psql('banc', ['-f', path.join(RACINE, 'tests/base-controles.sql')], true);
bilan('avec 001 seule, la protection ne tient PAS (c\'est ce qui justifie 002)',
  !!avec001.erreur,
  'le banc des rôles est passé alors que les politiques ouvertes sont encore là');

/* On repart d'une base neuve : le banc des rôles vient d'y écrire. */
monter('banc');
psql('banc', ['-f', MIG]);
const MIG2 = path.join(RACINE, 'supabase/migrations/002_retirer_politiques_ouvertes.sql');
const s2 = psql('banc', ['-f', MIG2]);
bilan('002 retire les neuf politiques en les nommant une par une',
  (s2.match(/RETIRÉE/g) || []).length === 9,
  (s2.match(/RETIRÉE/g) || []).length + ' retirée(s) sur 9');
const r3 = psql('banc', ['-f', MIG2], true);
bilan('rejouer 002 ne fait plus rien', !r3.erreur, r3.erreur);

/* ---------------------------------------------------------------------------
   1 ter. La migration 003 — les tables de signalements
   -------------------------------------------------------------------------
   Elle ne crée pas ses colonnes au hasard : « eleve_id » doit avoir, sur chaque
   niveau, le type de l'identifiant de ce niveau — uuid en Terminale et en
   Seconde, bigint en Première. Une colonne écrite en dur marcherait sur deux
   niveaux et casserait le troisième, exactement comme la création de compte
   l'avait fait. Le contrôle le vérifie table par table plutôt que de croire la
   migration sur parole. */
const MIG3 = path.join(RACINE, 'supabase/migrations/003_signalements.sql');
const s3 = psql('banc', ['-f', MIG3]);
bilan('003 crée les trois tables de signalements',
  (s3.match(/: prête/g) || []).length === 3,
  (s3.match(/: prête/g) || []).length + ' créée(s) sur 3');

const types = psql('banc', ['-tAc',
  `select c.relname || '=' || format_type(a.atttypid, a.atttypmod)
     from pg_attribute a join pg_class c on c.oid = a.attrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname like 'signalements%' and a.attname='eleve_id'
    order by c.relname`]).trim().split('\n').filter(Boolean);
const attendus = psql('banc', ['-tAc',
  `select c.relname || '=' || format_type(a.atttypid, a.atttypmod)
     from pg_attribute a join pg_class c on c.oid = a.attrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname like 'resultats%' and a.attname='eleve_id'
    order by c.relname`]).trim().split('\n').filter(Boolean)
  .map(l => l.replace(/^resultats/, 'signalements'));
bilan('eleve_id a partout le type de l\'identifiant de son niveau',
  types.length === 3 && types.join('|') === attendus.join('|'),
  types.join(', ') + '  ≠  ' + attendus.join(', '));

const r4 = psql('banc', ['-f', MIG3], true);
bilan('rejouer 003 ne fait plus rien', !r4.erreur, r4.erreur);

/* ---------------------------------------------------------------------------
   1 quater. La migration 004 — la pause de l'élève
   -------------------------------------------------------------------------
   La 001 n'avait donné à l'élève que le droit d'INSÉRER dans la table des
   résultats. Or la mise en pause y fait trois gestes : insérer la ligne, la
   faire avancer à chaque réponse, puis la supprimer à la fin du test ou à
   l'abandon. Les deux derniers étaient refusés — et refusés SANS ERREUR, parce
   qu'une ligne que RLS cache est une ligne qui n'existe pas : PostgREST répond
   « 0 ligne », pas « refusé ». La page croyait donc avoir effacé.
   Le contrôle des rôles, plus bas, exerce les deux bords : la pause doit
   avancer et s'effacer, et une note obtenue doit rester intouchable. */
const MIG4 = path.join(RACINE, 'supabase/migrations/004_pause_de_l_eleve.sql');
const s4 = psql('banc', ['-f', MIG4]);
bilan('004 ouvre la pause sur les trois tables de résultats',
  (s4.match(/avance et s'efface/g) || []).length === 3,
  (s4.match(/avance et s'efface/g) || []).length + ' table(s) sur 3');
const r5 = psql('banc', ['-f', MIG4], true);
bilan('rejouer 004 ne fait plus rien', !r5.erreur, r5.erreur);

/* ---------------------------------------------------------------------------
   2. Ce que chaque rôle peut réellement faire
   ------------------------------------------------------------------------- */
console.log('\n2. CE QUE CHAQUE RÔLE OBTIENT DE LA BASE');
const ctrl = psql('banc', ['-f', path.join(RACINE, 'tests/base-controles.sql')], true);
if(ctrl.erreur){
  const ligne = (String(ctrl.erreur).match(/ÉCHEC : (.*)/) || [])[1] || String(ctrl.erreur).split('\n')[0];
  bilan('les politiques tiennent', false, ligne);
}else{
  let lus = 0;
  String(ctrl).split('\n').forEach(brut => {
    const t = brut.replace(/^psql:[^\s]*\s*/, '').replace(/^NOTICE:\s*/, '').trim();
    if(/^\d\.\s+[A-ZÉÈÀ]/.test(t)) console.log('\n   ' + t);
    else if(/^OK\s+/.test(t)){ lus++; bilan(t.replace(/^OK\s+/, ''), true); }
  });
  /* Le fichier SQL annonce lui-même combien de contrôles il a exécutés. Si le
     banc n'en a pas lu autant, c'est qu'il en a perdu en route — sortie mal
     captée, fichier interrompu — et il ne doit surtout pas conclure au vert. */
  const annonce = parseInt((String(ctrl).match(/CONTROLES EXECUTES\s*:\s*(\d+)/) || [])[1], 10);
  bilan('tous les contrôles annoncés ont bien été lus (' + lus + '/' + (annonce || '?') + ')',
    !!annonce && lus === annonce,
    !annonce ? 'le fichier SQL n’est pas allé jusqu’au bout' : lus + ' lus pour ' + annonce + ' exécutés');
}

/* ---------------------------------------------------------------------------
   3. Les contrôles voient-ils quelque chose ? (mutations)
   ------------------------------------------------------------------------- */
/* Un banc de sécurité qui ne rougit jamais est pire qu'aucun banc : il donne
   la tranquillité sans la protection. On casse donc la base exprès, de deux
   façons plausibles, et on exige que les contrôles s'en aperçoivent. */
console.log('\n3. LE BANC VOIT-IL QUAND LA BASE EST MAL VERROUILLÉE ?');
const MUTATIONS = [
  ['la RLS n’a pas pris sur une table (migration à moitié appliquée)',
   ['alter table public.resultats_2nde disable row level security']],
  ['la politique d’écriture ne vérifie plus à qui appartient la note',
   ['drop policy p_resultats_2nde_ecriture on public.resultats_2nde',
    'create policy p_resultats_2nde_ecriture on public.resultats_2nde for insert to authenticated with check (true)']],
  ['la liste des élèves redevient lisible en écriture par n’importe qui',
   ['drop policy p_eleves_2nde_prof_suppr on public.eleves_2nde',
    'create policy p_eleves_2nde_prof_suppr on public.eleves_2nde for delete to authenticated using (true)']],
  /* Le cas réel, trouvé sur le projet le 11 août 2026 : une seule politique
     « for all using(true) » oubliée suffit à annuler les trente autres, parce
     que PostgreSQL les combine par un OU. C'est le défaut que 002 corrige, et
     ce banc doit le voir revenir si jamais une politique de ce genre était
     recréée un jour dans la console Supabase. */
  ['une seule politique grande ouverte oubliée annule tout le reste',
   ['create policy "acces classe - resultats_2nde" on public.resultats_2nde for all to anon using (true) with check (true)']],
  /* Un signalement porte le prénom d'un mineur et un texte libre qu'il a tapé.
     Le rendre lisible par toute la classe est le genre d'erreur qui se commet
     en voulant « laisser l'élève relire ce qu'il a envoyé ». */
  ['les signalements deviennent lisibles par toute la classe',
   ['drop policy p_signalements_2nde_lecture on public.signalements_2nde',
    'create policy p_signalements_2nde_lecture on public.signalements_2nde for select to authenticated using (true)']],
];
MUTATIONS.forEach(([nom, sqls], i) => {
  const bd = 'mut' + i;
  monter(bd);
  psql(bd, ['-f', MIG]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/002_retirer_politiques_ouvertes.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/003_signalements.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/004_pause_de_l_eleve.sql')]);
  sqls.forEach(q => psql(bd, ['-c', q]));
  const r = psql(bd, ['-f', path.join(RACINE, 'tests/base-controles.sql')], true);
  bilan('détectée : ' + nom, !!r.erreur, r.erreur ? '' : 'le banc est resté vert alors que la base est ouverte');
  psql('postgres', ['-c', 'drop database if exists ' + bd]);
});

/* ---------------------------------------------------------------------------
   4. La restauration d'une sauvegarde
   -------------------------------------------------------------------------
   Une sauvegarde qu'on n'a jamais remise en place n'est pas une sauvegarde :
   c'est un fichier dont on espère qu'il servira. Cette section joue le sinistre
   en entier — base neuve, migrations, puis les lignes d'une sauvegarde — et
   vérifie ce qui, sinon, ne se découvrirait qu'à ce moment-là.

   La sauvegarde d'essai ci-dessous a la forme exacte de celle que produit
   supabase/sauvegarde.mjs : identifiants bigint en Première et uuid en Seconde,
   un user_id qui pointe vers un compte disparu, et un prénom à apostrophe. */
console.log('\n4. REMETTRE UNE SAUVEGARDE EN PLACE');

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
const SAUVEGARDE = {
  eleves_1ere: [
    { id:3, prenom:"Léa",      created_at:'2026-06-01T08:00:00Z', user_id:U1, cle:'c-lea' },
    { id:7, prenom:"O'Brien",  created_at:'2026-06-02T08:00:00Z', user_id:U2, cle:'c-obrien' },
  ],
  resultats_1ere: [
    { id:11, eleve_id:3, score:8, total:10, percent:80, duration_sec:42,
      details:{ test:'dexp' }, created_at:'2026-06-03T08:00:00Z' },
  ],
  eleves_2nde: [
    { id:'33333333-3333-3333-3333-333333333333', prenom:'Sam',
      created_at:'2026-06-01T08:00:00Z', user_id:null, cle:'c-sam' },
  ],
  parametres_1ere: [ { id:1, valeurs:{ devoirs:[] } } ],
};

function restaurer(bd, table, lignes, tolerant){
  const f = path.join(DOSSIER, 'restauration.sql');
  fs.writeFileSync(f, 'select public.restaurer(' + "'" + table + "'" + ', $j$\n'
    + JSON.stringify(lignes) + '\n$j$::json);\n');
  return psql(bd, ['-f', f], tolerant);
}

monter('rest');
psql('rest', ['-f', MIG]);
psql('rest', ['-f', MIG2]);
const pose = psql('rest', ['-f', path.join(RACINE, 'supabase/restaurer.sql')], true);
bilan('l\'outil de restauration s\'installe sur la base migrée', !pose.erreur, pose.erreur);

/* L'ordre n'est pas un détail de présentation : les notes désignent un élève.
   Le banc l'exige plutôt que de le recommander. */
const inverse = restaurer('rest', 'resultats_1ere', SAUVEGARDE.resultats_1ere, true);
bilan('les notes avant les élèves : refus franc, pas de note orpheline', !!inverse.erreur);

restaurer('rest', 'eleves_1ere',    SAUVEGARDE.eleves_1ere);
restaurer('rest', 'resultats_1ere', SAUVEGARDE.resultats_1ere);
restaurer('rest', 'eleves_2nde',    SAUVEGARDE.eleves_2nde);
restaurer('rest', 'parametres_1ere',SAUVEGARDE.parametres_1ere);

const revenus = psql('rest', ['-tAc',
  "select string_agg(prenom || '#' || id, ',' order by id) from public.eleves_1ere"]).trim();
bilan('les élèves reviennent avec leur prénom et leur identifiant d\'origine',
  revenus === "Léa#3,O'Brien#7", revenus);

const cles = psql('rest', ['-tAc',
  "select count(*) from public.eleves_1ere where cle is not null"]).trim();
bilan('la clé du compte revient aussi (« Nouveau code » s\'en sert)', cles === '2', cles);

/* Le compte Supabase d'avant le sinistre n'existe plus. Restaurer user_id tel
   quel ferait refuser la ligne par la clé étrangère vers auth.users — et si la
   contrainte manquait, l'élève resterait rattaché à un compte fantôme, donc
   sans code et sans moyen d'en obtenir un. */
const orphelins = psql('rest', ['-tAc',
  "select count(*) from public.eleves_1ere where user_id is not null"]).trim();
bilan('aucun élève ne revient rattaché à un compte disparu', orphelins === '0', orphelins);

const notes = psql('rest', ['-tAc',
  "select count(*) from public.resultats_1ere r join public.eleves_1ere e on e.id = r.eleve_id"]).trim();
bilan('les notes retrouvent leur élève', notes === '1', notes);

const secondes = psql('rest', ['-tAc',
  "select count(*) from public.eleves_2nde"]).trim();
bilan('la Seconde revient aussi, malgré ses identifiants d\'un autre type', secondes === '1', secondes);

/* LE PIÈGE QUI NE SE VOIT PAS LE JOUR DE LA RESTAURATION. Réinsérer des lignes
   avec leurs identifiants d'origine ne fait pas avancer la séquence : elle
   repart de 1, et c'est le PREMIER élève ajouté le lendemain qui tombe sur un
   identifiant déjà pris. Tout paraît réussi jusque-là. */
const ajout = psql('rest', ['-tAc',
  "insert into public.eleves_1ere (prenom) values ('Nouvelle') returning id"], true);
bilan('un élève ajouté après la restauration ne heurte pas un identifiant déjà pris',
  !ajout.erreur && parseInt(String(ajout).trim(), 10) > 7,
  ajout.erreur ? String(ajout.erreur).split('\n').find(l => /erreur|ERROR/i.test(l)) || 'échec'
               : 'identifiant obtenu : ' + String(ajout).trim());

/* Une copie coupée en deux se rejoue en entier, sans doubler ce qui est passé. */
restaurer('rest', 'eleves_1ere', SAUVEGARDE.eleves_1ere);
const apres = psql('rest', ['-tAc', 'select count(*) from public.eleves_1ere']).trim();
bilan('rejouer la restauration ne duplique rien', apres === '3', apres);

/* Une table d'une seule ligne arrive comme un objet nu : Windows PowerShell 5.1
   déballe les tableaux d'un élément, et son ConvertTo-Json n'a pas l'option qui
   l'en empêche. Exiger PowerShell 7 le jour d'un sinistre n'est pas une option
   sérieuse — l'outil accepte donc les deux formes. */
restaurer('rest', 'parametres_2nde', { id:1, valeurs:{ devoirs:[] } });
const seul = psql('rest', ['-tAc', 'select count(*) from public.parametres_2nde']).trim();
bilan('une table d\'une seule ligne passe, même déballée par PowerShell 5.1',
  seul === '1', seul);

const prof = restaurer('rest', 'professeurs', [{ user_id:U1 }], true);
bilan('« professeurs » est refusée avec le motif, plutôt que restaurée de travers',
  !!prof.erreur && /identifiant/.test(String(prof.erreur)), prof.erreur ? '' : 'acceptée');
psql('postgres', ['-c', 'drop database if exists rest']);

/* ---------------------------------------------------------------------------
   5. Le cas courant : une note perdue, une note falsifiée, base vivante
   -------------------------------------------------------------------------
   C'est l'usage réel de la sauvegarde — pas le sinistre total. La base tourne,
   les élèves travaillent, et une note manque ou paraît fausse. Deux gestes s'y
   opposent : remettre ce qui manque sans rien écraser, et défaire une valeur
   modifiée. Les confondre coûterait le travail fait depuis dimanche.

   Le geste est le plus dangereux du dépôt : il écrit dans la base vivante. */
console.log('\n5. RÉCUPÉRER DES NOTES PERDUES OU FALSIFIÉES, BASE VIVANTE');
monter('vive');
psql('vive', ['-f', MIG]);
psql('vive', ['-f', MIG2]);
psql('vive', ['-f', path.join(RACINE, 'supabase/restaurer.sql')]);

/* La sauvegarde de dimanche : trois notes. */
const DIMANCHE = [
  { id:11, eleve_id:3, score:8,  total:10, percent:80, duration_sec:42,
    details:{ test:'dexp' }, created_at:'2026-06-03T08:00:00Z' },
  { id:12, eleve_id:3, score:6,  total:10, percent:60, duration_sec:55,
    details:{ test:'dexp' }, created_at:'2026-06-04T08:00:00Z' },
  { id:13, eleve_id:7, score:10, total:10, percent:100, duration_sec:30,
    details:{ test:'dexp' }, created_at:'2026-06-05T08:00:00Z' },
];
restaurer('vive', 'eleves_1ere', SAUVEGARDE.eleves_1ere);
restaurer('vive', 'resultats_1ere', DIMANCHE);

/* Ce qui s'est passé depuis : la 12 a été effacée, la 13 mise à 20/10 par une
   main peu scrupuleuse, et la 14 passée normalement lundi. */
psql('vive', ['-c', 'delete from public.resultats_1ere where id = 12']);
psql('vive', ['-c', 'update public.resultats_1ere set score = 20, percent = 200 where id = 13']);
psql('vive', ['-c', "insert into public.resultats_1ere (id, eleve_id, score, total, percent, duration_sec, details) "
                  + "values (14, 7, 9, 10, 90, 33, '{\"test\":\"dexp\"}')"]);

function comparer(bd, table, lignes){
  const f = path.join(DOSSIER, 'comparaison.sql');
  fs.writeFileSync(f, 'select * from public.comparer(' + "'" + table + "'" + ', $j$\n'
    + JSON.stringify(lignes) + '\n$j$::json);\n');
  return String(psql(bd, ['-tA', '-f', f]));
}
const vu = comparer('vive', 'resultats_1ere', DIMANCHE);
bilan('la comparaison voit la note effacée', /MANQUANTE\s+id=12/.test(vu), vu);
bilan('la comparaison voit la note modifiée, et dit en quoi',
  /DIFFÉRENTE id=13/.test(vu) && /score : base=20 sauvegarde=10/.test(vu), vu);
bilan('elle signale la note ajoutée depuis, sans en faire une alerte',
  /EN TROP\s+id=14/.test(vu), vu);
bilan('elle ne crie pas sur la note intacte (1 identique)', /1 identique/.test(vu), vu);

/* Un score « 8 » relu « 8.0 », un instant écrit dans un autre fuseau : deux
   écritures de la même valeur. Une comparaison qui les signalerait noierait le
   vrai écart parmi trente faux — et on cesserait de la lire. */
psql('vive', ['-c', "update public.resultats_1ere set score = 8.0 where id = 11"]);
const bruit = comparer('vive', 'resultats_1ere',
  [Object.assign({}, DIMANCHE[0], { score:8, created_at:'2026-06-03T10:00:00+02:00' })]);
bilan('8 et 8.0, deux fuseaux pour le même instant : aucun faux écart',
  /1 identique/.test(bruit) && !/DIFFÉRENTE/.test(bruit), bruit);

/* Le geste no 1 : remettre ce qui manque, sans rien écraser. */
restaurer('vive', 'resultats_1ere', DIMANCHE);
const apresDouce = psql('vive', ['-tAc',
  'select (select count(*) from public.resultats_1ere) || \'/\' || '
  + '(select score from public.resultats_1ere where id = 13) || \'/\' || '
  + '(select score from public.resultats_1ere where id = 14)']).trim();
bilan('la note perdue revient, la note falsifiée et celle de lundi ne bougent pas',
  apresDouce === '4/20/9', apresDouce);

/* Le geste no 2 : défaire la falsification. */
const f2 = path.join(DOSSIER, 'ecrasement.sql');
fs.writeFileSync(f2, 'select public.restaurer(\'resultats_1ere\', $j$\n'
  + JSON.stringify(DIMANCHE) + '\n$j$::json, true);\n');
psql('vive', ['-f', f2]);
const apresDure = psql('vive', ['-tAc',
  'select (select score from public.resultats_1ere where id = 13) || \'/\' || '
  + '(select score from public.resultats_1ere where id = 14) || \'/\' || '
  + '(select count(*) from public.resultats_1ere)']).trim();
bilan('avec écrasement, la note falsifiée reprend sa valeur d\'origine',
  apresDure.startsWith('10/'), apresDure);
bilan('l\'écrasement ne touche pas la note passée depuis la sauvegarde',
  apresDure === '10/9/4', apresDure);

/* Une note dont l'élève a été supprimé ne peut pas revenir. Le dire à la
   comparaison, pas au moment où l'insertion échoue. */
psql('vive', ['-c', 'delete from public.eleves_1ere where id = 7']);
const orphelin = comparer('vive', 'resultats_1ere', DIMANCHE);
bilan('une note dont l\'élève a disparu est signalée comme telle',
  /MANQUANTE\s+id=13.*n'est plus dans la base/.test(orphelin), orphelin);
psql('postgres', ['-c', 'drop database if exists vive']);

/* ------------------------------------------------------------------------- */
console.log('\n──────────────────────────────────────────────────────────');
if(echecs){
  console.log('✗ ' + echecs + ' échec(s). NE PAS appliquer cette migration.');
  arreter();
  process.exit(1);
}
console.log('✓ Les règles d\'accès tiennent, et le banc s\'en aperçoit quand elles cèdent.');
console.log('\nCe banc ne voit PAS la configuration de l\'authentification Supabase');
console.log('(confirmation par courriel, inscriptions) : elle est à vérifier à la main.');
arreter();
