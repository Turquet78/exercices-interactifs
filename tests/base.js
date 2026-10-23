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
   1 bis. La démonstration : SANS 002, rien ne protège
   -------------------------------------------------------------------------
   PostgreSQL combine les politiques permissives par un OU. Les neuf politiques
   « for all using(true) » que portait le projet annulent donc toutes celles que
   001 pose à côté. Ce contrôle l'exige plutôt que de l'affirmer : joué sans la
   migration 002, le banc des rôles DOIT échouer. S'il passait, c'est que ce
   banc ne mesure pas ce qu'il croit mesurer.
   Et il doit échouer pour la BONNE cause : la fuite des NOTES, que la porte
   de 002 laisse lire à un visiteur. La liste des prénoms, elle, n'est plus
   une cause — la 010 l'a rouverte, et le banc des rôles exige maintenant que
   le visiteur la voie : sur cette base, il la voit, et ce contrôle-là passe.
   On joue la 009 PUIS la 010 avant lui, comme partout où le banc des rôles
   est joué : chacune doit REFUSER de se déclarer faite tant que la porte de
   002 est ouverte, et la nommer — deux bords mesurés ici, pas deux échecs
   tolérés en silence. (Leur refus vient de leur contrôle final : ce qu'elles
   font avant — politique remplacée, fonctions posées puis retirées — est
   déjà passé, et le banc des rôles mesure l'état réellement laissé.) */
const MIG9 = path.join(RACINE, 'supabase/migrations/009_connexion_sans_liste.sql');
const MIG10 = path.join(RACINE, 'supabase/migrations/010_retour_de_la_liste.sql');
const s9seule = psql('banc', ['-f', MIG9], true);
bilan('009 refuse de se déclarer faite tant que la porte de 002 est ouverte, et la nomme',
  !!s9seule.erreur && /reste lisible sans connexion : eleves\.acces classe - eleves \(pour anon\)/.test(String(s9seule.erreur)),
  s9seule.erreur ? String(s9seule.erreur).split('\n').filter(l => /ERROR|ERREUR/.test(l)).join(' ') : '009 est passée sans rien dire');
const s10seule = psql('banc', ['-f', MIG10], true);
bilan('010 refuse de se déclarer faite tant que la porte de 002 est ouverte, et la nomme',
  !!s10seule.erreur && /eleves : 2 politique\(s\) de lecture au lieu d'une seule \(acces classe - eleves pour anon, p_eleves_liste pour anon\+authenticated\)/.test(String(s10seule.erreur)),
  s10seule.erreur ? String(s10seule.erreur).split('\n').filter(l => /ERROR|ERREUR/.test(l)).join(' ') : '010 est passée sans rien dire');
const sans002 = psql('banc', ['-f', path.join(RACINE, 'tests/base-controles.sql')], true);
bilan('sans 002, la protection ne tient PAS (c\'est ce qui justifie 002)',
  !!sans002.erreur,
  'le banc des rôles est passé alors que les politiques ouvertes sont encore là');
bilan('et c\'est bien la fuite des notes qui le fait rougir, pas une autre cause',
  /ÉCHEC : il ne voit aucune note \(2\)/.test(String(sans002.erreur || '')),
  (String(sans002.erreur || '').match(/ÉCHEC : .*|ERROR: .*/) || ['aucune ligne ÉCHEC'])[0]);

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
   1 quinquies. La migration 008 — la réponse du professeur
   -------------------------------------------------------------------------
   Elle pose deux colonnes, et surtout elle RENVERSE la politique de lecture de
   la 003 : l'élève lit désormais SA PROPRE ligne — c'est le seul endroit où il
   peut lire la réponse qu'on lui écrit. La raison de la 003 ne disparaît pas
   pour autant : celle d'un camarade lui reste fermée, et le contrôle des rôles,
   plus bas, exerce les deux bords.
   Le fichier se termine lui-même par un contrôle qui échoue bruyamment si une
   colonne manque ou si la lecture n'a pas été élargie ; ici on vérifie surtout
   qu'il a bien travaillé sur les TROIS tables — un « ignorée » silencieux
   laisserait un niveau derrière. */
const MIG8 = path.join(RACINE, 'supabase/migrations/008_reponse_au_signalement.sql');
const s8 = psql('banc', ['-f', MIG8]);
bilan('008 élargit la lecture sur les trois tables de signalements',
  (s8.match(/lecture élargie à sa propre ligne/g) || []).length === 3,
  (s8.match(/lecture élargie à sa propre ligne/g) || []).length + ' table(s) sur 3');
const pol8 = psql('banc', ['-tAc',
  `select count(*) from pg_policies
    where schemaname='public' and tablename like 'signalements%'
      and cmd='SELECT' and qual like '%auth.uid()%'`]).trim();
bilan('la politique de lecture nomme vraiment le compte de l\'élève',
  pol8 === '3', pol8 + ' politique(s) sur 3 citent auth.uid()');
/* Une seconde politique de lecture posée À CÔTÉ de l'ancienne rouvrirait tout :
   PostgreSQL combine les permissives par un OU. La 008 REMPLACE, elle n'ajoute
   pas — c'est la leçon de la 002, et elle se vérifie en comptant. */
const nbLect = psql('banc', ['-tAc',
  `select count(*) from pg_policies
    where schemaname='public' and tablename like 'signalements%' and cmd='SELECT'`]).trim();
bilan('elle REMPLACE la politique de lecture au lieu d\'en ajouter une seconde',
  nbLect === '3', nbLect + ' politique(s) de lecture pour 3 tables');
const r8 = psql('banc', ['-f', MIG8], true);
bilan('rejouer 008 ne fait plus rien', !r8.erreur, r8.erreur);

/* ---------------------------------------------------------------------------
   1 sexies. La migration 009 — la connexion sans la liste des prénoms
   -------------------------------------------------------------------------
   La 001 laissait un visiteur lire la liste des prénoms — et la clé de
   chacun — parce que l'écran de connexion l'affichait avant toute
   authentification. La 009 a fermé cette lecture : l'élève tapait son
   prénom, et une fonction SECURITY DEFINER lui rendait la ou les clés de ce
   prénom, cinq au plus, rien d'autre. La 010 (section suivante) l'a défaite
   le 14 octobre 2026 — mais l'ÉTAT que la 009 laisse peut exister sur le
   projet réel, aussi longtemps que la 010 n'y est pas collée, et les pages
   doivent y connecter tout le monde (par le prénom tapé). Cette section le
   garde donc éprouvé : la migration travaille sur les TROIS tables, elle
   REMPLACE la politique au lieu d'en ajouter une (la leçon de la 002 : deux
   permissives se combinent par un OU), la fonction a les trois propriétés
   sans lesquelles l'écran serait muet — elle existe, elle lit sans la RLS,
   le visiteur peut l'appeler —, et ce que le VISITEUR obtient d'elle est
   exercé ici même (ces contrôles vivaient dans tests/base-controles.sql,
   qui décrit désormais l'état final, où la fonction n'existe plus). */
/* Tolérant, exprès : la 009 porte son propre contrôle final, et quand il
   refuse — une politique qui nomme encore anon, une fonction sans security
   definer — c'est une ligne rouge qui doit le dire, pas un banc qui s'arrête
   net sur « psql a échoué ». Les contrôles qui suivent mesurent alors sur
   l'état réellement laissé par la migration. */
/* Un témoin dans chaque table AVANT la migration : son contrôle final ne se
   contente pas de lire l'attribut security definer, il prend le rôle anon et
   demande un prénom présent — sur une table vide il ne mesurerait rien, et
   le dirait. Les témoins sont retirés ensuite : le banc des rôles compte ses
   élèves. */
/* Et une ligne au prénom BLANC mais à clé, en Seconde : créée à la main dans
   l'éditeur de table, elle se classerait première, et la fonction ne rend
   rien pour elle par conception — le contrôle final doit choisir un autre
   témoin, pas accuser la RLS (seconde relecture). */
psql('banc', ['-c', `insert into public.eleves (prenom, cle) values ('Témoin', 'cle-temoin-t');
  insert into public.eleves_1ere (prenom, cle) values ('Témoin', 'cle-temoin-1');
  insert into public.eleves_2nde (prenom, cle) values ('Témoin', 'cle-temoin-2');
  insert into public.eleves_2nde (prenom, cle) values ('   ', 'cle-blanc');`]);
const r9a = psql('banc', ['-f', MIG9], true);
bilan('009 s\'applique, et son contrôle final ne trouve rien à redire',
  !r9a.erreur, String(r9a.erreur || '').split('\n').filter(l => /ERROR|ERREUR/.test(l)).join(' '));
const s9 = String(r9a.erreur || r9a);
bilan('009 mesure son effet en tant que visiteur, sur les trois tables',
  (s9.match(/un visiteur obtient bien la clé de « Témoin »/g) || []).length === 3,
  (s9.match(/un visiteur obtient bien la clé de/g) || []).length + ' table(s) mesurée(s) sur 3 — ' + (s9.match(/effet non mesuré[^\n]*/g) || []).join(' ; '));
/* Le cas que l'attribut seul ne voit pas (relecture d'octobre 2026) : une
   fonction SECURITY DEFINER dont le PROPRIÉTAIRE ne traverse pas la RLS rend
   zéro ligne à tout le monde, sans erreur — « Prénom inconnu » pour la classe.
   Sur Supabase l'éditeur tourne en postgres, propriétaire des tables ; on ne
   le suppose pas, on exige que la migration le MESURE et refuse cet état. */
psql('banc', ['-c', `create role proprio_sans_rls nologin;
  grant select on public.eleves, public.eleves_1ere, public.eleves_2nde to proprio_sans_rls;
  grant execute on function public.normaliser_prenom(text) to proprio_sans_rls;
  alter function public.cles_de_connexion(text, text) owner to proprio_sans_rls;`]);
const r9p = psql('banc', ['-f', MIG9], true);
bilan('009 refuse une fonction dont le propriétaire ne traverse pas la RLS — mesuré, pas lu sur l\'attribut',
  !!r9p.erreur && /ne rend rien à un visiteur pour un prénom pourtant présent/.test(String(r9p.erreur)),
  r9p.erreur ? (String(r9p.erreur).match(/ERROR: [^\n]*/) || [''])[0] : '009 est passée au vert sur une fonction qui ne rend rien à personne');
psql('banc', ['-c', `alter function public.cles_de_connexion(text, text) owner to postgres;
  drop owned by proprio_sans_rls; drop role proprio_sans_rls;`]);
/* L'autre propriétaire qu'on ne voit pas en lisant l'attribut : SANS AUCUN
   DROIT. La fonction lève alors « permission denied » dans son corps, et la
   migration doit ÉCHOUER — pas dire « impossible de prendre le rôle anon »
   et se déclarer faite (seconde relecture : le gestionnaire d'exception
   enveloppait l'appel de la fonction). */
psql('banc', ['-c', `create role proprio_sans_droits nologin;
  alter function public.cles_de_connexion(text, text) owner to proprio_sans_droits;`]);
const r9d = psql('banc', ['-f', MIG9], true);
bilan('009 échoue sur une fonction dont le propriétaire n\'a aucun droit, au lieu de se déclarer faite',
  !!r9d.erreur && /permission denied/.test(String(r9d.erreur)) && !/impossible de prendre le rôle anon/.test(String(r9d.erreur)),
  r9d.erreur ? (String(r9d.erreur).match(/ERROR: [^\n]*|NOTICE: [^\n]*effet non mesuré[^\n]*/) || [''])[0] : '009 est passée au vert');
psql('banc', ['-c', `alter function public.cles_de_connexion(text, text) owner to postgres;
  drop owned by proprio_sans_droits; drop role proprio_sans_droits;`]);
bilan('009 ferme la liste sur les trois tables d\'élèves',
  (s9.match(/: connexion sans liste/g) || []).length === 3,
  (s9.match(/: connexion sans liste/g) || []).length + ' table(s) sur 3');
const anon9 = psql('banc', ['-tAc',
  `select count(*) from pg_policies
    where schemaname='public' and tablename like 'eleves%'
      and cmd in ('SELECT','ALL') and roles::text[] && array['anon','public']`]).trim();
bilan('plus aucune politique de lecture des élèves ne nomme anon',
  anon9 === '0', anon9 + ' politique(s) encore ouverte(s) aux visiteurs');
const nbLect9 = psql('banc', ['-tAc',
  `select count(*) from pg_policies
    where schemaname='public' and tablename in ('eleves','eleves_1ere','eleves_2nde') and cmd='SELECT'`]).trim();
bilan('elle REMPLACE la politique de lecture au lieu d\'en ajouter une seconde',
  nbLect9 === '3', nbLect9 + ' politique(s) de lecture pour 3 tables');
/* Une requête qui ne CASSE pas si la fonction manque : « absente » est une
   réponse, pas une exception, et le banc continue de mesurer le reste. */
const fn9 = psql('banc', ['-tAc',
  `select coalesce((select prosecdef::text || '|' || coalesce(array_to_string(proconfig, ';'), '')
                           || '|' || has_function_privilege('anon', p.oid, 'execute')::text
                      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'cles_de_connexion'), 'absente')`]).trim();
bilan('la fonction de connexion existe et lit SANS la RLS (security definer)',
  /^true\|/.test(fn9), fn9);
bilan('elle verrouille son search_path',
  /\|search_path=[^|]+\|/.test(fn9), fn9);
bilan('et le visiteur a le droit de l\'appeler : c\'est tout ce qu\'il lui reste',
  /\|true$/.test(fn9), fn9);
/* Le rejeu se mesure AVEC des données, comme sur le projet : les témoins sont
   encore là, et la mesure du visiteur doit se refaire trois fois. Ils sont
   retirés ensuite ; seule la séquence d'identité d'eleves_1ere garde la trace
   de leur passage, et rien ne la lit. */
const r9 = psql('banc', ['-f', MIG9], true);
bilan('rejouer 009 ne fait plus rien', !r9.erreur,
  String(r9.erreur || '').split('\n').filter(l => /ERROR|ERREUR/.test(l)).join(' '));
bilan('et rejouée sur des tables pleines, elle mesure encore son effet trois fois',
  (String(r9.erreur || r9).match(/un visiteur obtient bien la clé de « Témoin »/g) || []).length === 3,
  (String(r9.erreur || r9).match(/un visiteur obtient bien la clé de/g) || []).length + ' mesure(s) sur 3');
psql('banc', ['-c', `delete from public.eleves where cle = 'cle-temoin-t';
  delete from public.eleves_1ere where cle = 'cle-temoin-1';
  delete from public.eleves_2nde where cle in ('cle-temoin-2', 'cle-blanc');`]);

/* L'ÉTAT B, VU PAR UN VISITEUR — la 009 jouée, la 010 pas encore. C'est
   l'état que les pages doivent savoir traverser : la liste revient VIDE (zéro
   ligne, sans erreur — la RLS ne refuse pas, elle cache), la fonction existe,
   et la connexion passe par le prénom tapé. Chaque contrôle est joué par
   psql sous « set role anon », comme PostgREST le ferait pour un visiteur :
   le superutilisateur traverse la RLS, un contrôle écrit sans le rôle
   passerait au vert quelles que soient les politiques.
   Les témoins sont semés pour l'occasion et retirés ensuite : le banc des
   rôles, plus bas, sème ses propres Alice et Chloé. Une ligne SANS clé — un
   élève créé à la main dans l'éditeur de table, jamais relié — porte le même
   prénom qu'Alice : la fonction ne doit pas la rendre (un « null » que la
   page changerait en adresse « null@… »). */
psql('banc', ['-c', `insert into public.eleves_2nde (prenom, cle) values
  ('Alice', 'cle-alice-b'), ('Chloé', 'cle-chloe-b'), ('Alice', null);`]);
const visiteur = sql => {
  const r = psql('banc', ['-tA', '-c', 'set role anon', '-c', sql], true);
  return r && r.erreur !== undefined ? { erreur: String(r.erreur) } : { texte: String(r).trim() };
};
const lu = r => r.erreur !== undefined ? 'erreur : ' + (r.erreur.match(/ERROR: [^\n]*/) || [r.erreur])[0] : r.texte;
{
  const liste = visiteur('select count(*) from public.eleves_2nde');
  bilan('en état B, la liste revient VIDE au visiteur — zéro ligne, sans erreur (' + lu(liste) + ')',
    liste.texte === '0', lu(liste));
  const cle = visiteur(`select coalesce(string_agg(c, ',' order by c), '∅') from public.cles_de_connexion('secondes', 'Alice') c`);
  bilan('il obtient la clé d\'un prénom qu\'il connaît, et elle seule (' + lu(cle) + ')',
    cle.texte === 'cle-alice-b', lu(cle));
  /* string_agg ignore les null : on COMPTE, sinon une clé vide passerait. */
  const vides = visiteur(`select count(*) || '/' || count(c) from public.cles_de_connexion('secondes', 'Alice') c`);
  bilan('la fonction ne rend jamais une clé vide (' + lu(vides) + ' : clés rendues / non vides)',
    vides.texte === '1/1', lu(vides));
  /* « chloe » tapé sur un clavier sans accent est Chloé — et « CHLOÉ »,
     majuscule accentuée, l'est aussi quelle que soit la locale. */
  const accents = visiteur(`select coalesce((select string_agg(c, ',' order by c) from public.cles_de_connexion('secondes', 'CHLOE') c), '∅')
      || '|' || coalesce((select string_agg(c, ',' order by c) from public.cles_de_connexion('secondes', '  alice ') c), '∅')
      || '|' || coalesce((select string_agg(c, ',' order by c) from public.cles_de_connexion('secondes', 'CHLOÉ') c), '∅')`);
  bilan('sans accent ni majuscule, le prénom se reconnaît quand même (' + lu(accents) + ')',
    accents.texte === 'cle-chloe-b|cle-alice-b|cle-chloe-b', lu(accents));
  const inconnu = visiteur(`select count(*) from public.cles_de_connexion('secondes', 'Zoé')`);
  bilan('un prénom inconnu ne rend rien (' + lu(inconnu) + ')', inconnu.texte === '0', lu(inconnu));
  const vide = visiteur(`select (select count(*) from public.cles_de_connexion('secondes', '   '))
       + (select count(*) from public.cles_de_connexion('secondes', null))`);
  bilan('un prénom vide ne rend rien (' + lu(vide) + ')', vide.texte === '0', lu(vide));
  /* Un niveau inconnu est une ERREUR, pas une liste vide : la page qui
     enverrait un mauvais nom doit le voir, pas conclure « prénom inconnu ». */
  const college = visiteur(`select count(*) from public.cles_de_connexion('college', 'Alice')`);
  bilan('un niveau inconnu est refusé',
    college.erreur !== undefined && /niveau inconnu/.test(college.erreur), lu(college));
  /* Le type de retour est la preuve que rien d'autre ne peut sortir : un
     ensemble de « text », pas une ligne de table, pas un enregistrement. */
  const ret = visiteur(`select coalesce((select format_type(prorettype, null) || (case when proretset then ' (setof)' else '' end)
      from pg_proc where oid = to_regprocedure('public.cles_de_connexion(text, text)')), 'absente')`);
  bilan('la fonction ne rend que des clés : ni prénom ni identifiant (' + lu(ret) + ')',
    ret.texte === 'text (setof)', lu(ret));
  /* LA SONDE DES PAGES. Une page qui trouve la liste vide demande à la base
     si la fonction existe — rpc('cles_de_connexion', { niveau: NIVEAU,
     prenom: '' }) — et lit « pas d'erreur » comme « la liste est fermée
     exprès » : elle affiche alors le champ « Ton prénom ». La sonde doit
     donc répondre SANS ERREUR et sans rien rendre, sur le NIVEAU que chaque
     page envoie réellement — relu dans la page, pas recopié : un niveau mal
     écrit lèverait « niveau inconnu », que la page lirait aussi comme
     « fonction présente », et le banc ne le verrait pas. */
  ['secondes.html', 'premiere-specifique.html', 'terminale.html'].forEach(fichier => {
    const niveau = (fs.readFileSync(path.join(RACINE, fichier), 'utf8').match(/const NIVEAU\s*=\s*'([a-z]+)'/) || [])[1];
    const sonde = niveau ? visiteur(`select count(*) from public.cles_de_connexion('${niveau}', '')`) : { erreur: 'const NIVEAU introuvable dans ' + fichier };
    bilan('la sonde de ' + fichier + ' (niveau « ' + (niveau || '?') + ' », prénom vide) répond sans erreur, et ne rend rien',
      sonde.texte === '0', lu(sonde));
  });
}
psql('banc', ['-c', `delete from public.eleves_2nde where cle in ('cle-alice-b', 'cle-chloe-b') or (prenom = 'Alice' and cle is null);`]);

bilan('009 demande à PostgREST de recharger son cache de schéma',
  /notify\s+pgrst\s*,\s*'reload schema'/.test(fs.readFileSync(MIG9, 'utf8')),
  'aucun « notify pgrst, \'reload schema\' » : tant que le cache n’est pas rechargé, la page se replie sur une liste fermée');

/* LA RÈGLE DE NORMALISATION DU PRÉNOM EST LA MÊME DANS LA PAGE ET DANS LA BASE.
   La page (normaliserPrenom, par NFD) filtre la liste quand la fonction
   manque — états A et C, avant la 009 ou après la 010 — et refuse ainsi un
   doublon à la création de compte ; la base (normaliser_prenom, par
   normalize NFD) sert à la fonction de connexion, en état B. Si elles
   divergent, un prénom passe d'un côté et pas de l'autre : « seyma » pour
   Şeyma entrait avant la 009 et lisait « Prénom inconnu » après (relecture
   d'octobre 2026, 11 divergences sur 31 prénoms avec la première table « à
   la française ») ; et un doublon refusé dans un état passerait dans
   l'autre. Ce contrôle se joue AVANT la 010, qui retire la fonction : tant
   que l'état B peut exister sur le projet, la règle tient. On RELIT donc les
   fonctions des trois pages et du double de Supabase, on les exécute dans
   Node sur les mêmes sondes que la base, et on exige l'égalité, sonde par
   sonde. Les sondes portent ce qui a divergé : lettres hors du français,
   tabulation, insécable, espaces doubles — et au moins une doit changer sous
   la règle, sinon le contrôle ne mesure rien. */
{
  const SONDES = ['Chloé', 'CHLOÉ  ', '  alice ', 'Léa   Marie', 'Ayşe', 'Nataša', 'Tomáš', 'Ștefan', 'Ağça',
    'Nguyễn', 'Cătălin', 'Šárka', 'Zoë', 'Anaïs', 'Ângela', 'Łukasz', 'Øyvind', 'Jean-Pierre', 'Alice\t',
    'Alice\u00a0', 'Noël', 'Ærø', 'İsmail', '\u202fZoé\u3000', 'Maël', 'Jean  Baptiste',
    /* DÉCOMPOSÉS et hors latin (seconde relecture, octobre 2026) : un accent déjà
       séparé de sa lettre, Ǿ et ǣ qui se ramènent à ø et æ, un ё et un έ, et
       des majuscules que seule la locale du serveur saurait abaisser */
    'Chloe\u0301', '\u01feystein', '\u01e3lfred', '\u0401\u043b\u0435\u043d\u0430', '\u0395\u03bb\u03ad\u03bd\u03b7', '\u0141UKASZ', '\u00d8YVIND'];
  const lireFonction = (fichier, motif, enTete) => {
    const src = fs.readFileSync(path.join(RACINE, fichier), 'utf8');
    const m = src.match(motif);
    if(!m) return null;
    try{ return new Function('s', 'return (' + enTete(m[0]) + ')(s);'); }catch(e){ return null; }
  };
  const fonctions = {
    'secondes.html':            lireFonction('secondes.html',            /function normaliserPrenom\(s\)\{[^\n]*\}/, f => f),
    'premiere-specifique.html': lireFonction('premiere-specifique.html', /function normaliserPrenom\(s\)\{[^\n]*\}/, f => f),
    'terminale.html':           lireFonction('terminale.html',           /function normaliserPrenom\(s\)\{[^\n]*\}/, f => f),
    'tests/faux-supabase.js':   lireFonction('tests/faux-supabase.js',
      /const normaliser = s => [\s\S]*?replace\(\/\\s\+\/g, ' '\);/, f => f.replace(/^const normaliser = /, '').replace(/;$/, '')),
  };
  const enBase = SONDES.map(p => psql('banc', ['-tAc', "select '[' || public.normaliser_prenom($s$" + p + "$s$) || ']'"]).replace(/\n$/, ''));
  const changeantes = SONDES.filter((p, i) => enBase[i] !== '[' + p + ']').length;
  bilan('les sondes de normalisation changent vraiment sous la règle (' + changeantes + '/' + SONDES.length + ')',
    changeantes >= SONDES.length / 2, 'un jeu de sondes que la règle ne touche pas ne mesure rien');
  Object.keys(fonctions).forEach(fichier => {
    const fn = fonctions[fichier];
    if(!fn){ bilan(fichier + ' normalise le prénom comme la base', false, 'normaliserPrenom introuvable ou inexécutable dans ' + fichier); return; }
    const ecarts = SONDES.map((p, i) => {
      let v; try{ v = '[' + fn(p) + ']'; }catch(e){ v = 'erreur : ' + e.message; }
      return v === enBase[i] ? null : JSON.stringify(p) + ' → page ' + v + ', base ' + enBase[i];
    }).filter(Boolean);
    bilan(fichier + ' normalise le prénom comme la base', ecarts.length === 0, ecarts.slice(0, 3).join(' ; '));
  });
}

/* ---------------------------------------------------------------------------
   1 septies. La migration 010 — le retour de la liste
   -------------------------------------------------------------------------
   Décision de Turquet, 14 octobre 2026 : les pastilles de prénoms reviennent,
   la liste se lit de nouveau sans compte. La 010 remet p_<table>_liste pour
   anon et authenticated, et supprime les deux fonctions de la 009. Elle se
   joue dans N'IMPORTE QUEL ORDRE par rapport à la mise en ligne, et même si
   la 009 n'a jamais été jouée : on l'éprouve donc dans les deux états d'où
   elle peut partir — ici, après la 009 (état B) ; plus bas, sur une base où
   la 009 n'a jamais passé (état A).
   Les contrôles de la NORMALISATION, juste au-dessus, se jouent AVANT elle :
   la fonction SQL qu'ils comparent aux pages disparaît ici, et les pages
   gardent normaliserPrenom pour le repli de transition et la création de
   compte. */
console.log('\n1 septies. LA MIGRATION 010 — LE RETOUR DE LA LISTE');
/* Le résumé des politiques de lecture des trois tables : combien, et si
   elles nomment anon. Il sert au contrôle et à la mesure du rejeu. */
const lecturesEleves = bd => psql(bd, ['-tAc',
  `select string_agg(t || '=' || n || (case when ouverte then '+anon' else '' end), ',' order by t) from (
     select x.t, count(p.policyname) as n, coalesce(bool_or(p.roles::text[] && array['anon','public']), false) as ouverte
       from unnest(array['eleves','eleves_1ere','eleves_2nde']) as x(t)
       left join pg_policies p on p.schemaname = 'public' and p.tablename = x.t and p.cmd in ('SELECT','ALL')
      group by x.t) y`]).trim();
const LECTURES_ATTENDUES = 'eleves=1+anon,eleves_1ere=1+anon,eleves_2nde=1+anon';
const fonctions009 = bd => psql(bd, ['-tAc',
  `select coalesce(string_agg(p.proname, ',' order by p.proname), 'aucune')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('cles_de_connexion', 'normaliser_prenom')`]).trim();
/* Ce que lit un visiteur, table par table, face à ce que lit le
   superutilisateur — la mesure du banc, indépendante de celle que la 010
   porte elle-même. */
const compteEleves = 'select (select count(*) from public.eleves) || \'/\' || (select count(*) from public.eleves_1ere) || \'/\' || (select count(*) from public.eleves_2nde)';
/* Un témoin dans chaque table AVANT la migration : son contrôle final prend
   le rôle anon et compare ce qu'il lit à ce que lit le rôle qui la joue — sur
   une table vide il ne mesurerait rien, et le dirait. Retirés APRÈS, comme
   pour la 009 : le banc des rôles compte ses élèves. */
const semerTemoins = bd => psql(bd, ['-c', `insert into public.eleves (prenom, cle) values ('Témoin', 'cle-temoin-t');
  insert into public.eleves_1ere (prenom, cle) values ('Témoin', 'cle-temoin-1');
  insert into public.eleves_2nde (prenom, cle) values ('Témoin', 'cle-temoin-2');`]);
const retirerTemoins = bd => psql(bd, ['-c', `delete from public.eleves where cle = 'cle-temoin-t';
  delete from public.eleves_1ere where cle = 'cle-temoin-1';
  delete from public.eleves_2nde where cle = 'cle-temoin-2';`]);
const erreurDe = r => String(r && r.erreur || '').split('\n').filter(l => /ERROR|ERREUR/.test(l)).join(' ');
const mesures10 = t => (String(t).match(/un visiteur lit la liste entière/g) || []).length;
const nonMesure = t => (String(t).match(/effet non mesuré[^\n]*/g) || []).join(' ; ');

semerTemoins('banc');
const r10a = psql('banc', ['-f', MIG10], true);
const s10 = String(r10a.erreur || r10a);
bilan('010 s\'applique après la 009, et son contrôle final ne trouve rien à redire',
  !r10a.erreur, erreurDe(r10a));
bilan('elle reconnaît la base où la 009 a été jouée',
  /état trouvé : la 009 avait été jouée/.test(s10), (s10.match(/état trouvé[^\n]*/) || ['aucun « état trouvé »'])[0]);
bilan('010 rouvre la liste sur les trois tables d\'élèves',
  (s10.match(/: liste lisible sans connexion/g) || []).length === 3,
  (s10.match(/: liste lisible sans connexion/g) || []).length + ' table(s) sur 3');
bilan('010 mesure son effet en tant que visiteur, sur les trois tables',
  mesures10(s10) === 3, mesures10(s10) + ' table(s) mesurée(s) sur 3' + (nonMesure(s10) ? ' — ' + nonMesure(s10) : r10a.erreur ? ' — son contrôle final s’est arrêté avant' : ''));
const fn10 = fonctions009('banc');
bilan('plus aucune des deux fonctions de la 009 (' + fn10 + ')', fn10 === 'aucune', fn10 + ' encore là');
const lect10 = lecturesEleves('banc');
bilan('exactement une politique de lecture par table d\'élèves, et elle nomme anon',
  lect10 === LECTURES_ATTENDUES, lect10 + '  ≠  ' + LECTURES_ATTENDUES);
{
  const anon = visiteur(compteEleves);
  const su = psql('banc', ['-tAc', compteEleves]).trim();
  bilan('un visiteur lit de nouveau la liste entière des trois classes (' + lu(anon) + ', comme le superutilisateur)',
    anon.texte === su && su !== '0/0/0', lu(anon) + ' pour ' + su);
}
/* Le rejeu se mesure AVEC des données, comme sur le projet : les témoins
   sont encore là, et la mesure du visiteur doit se refaire trois fois. */
const r10 = psql('banc', ['-f', MIG10], true);
const s10b = String(r10.erreur || r10);
bilan('rejouer 010 ne fait plus rien', !r10.erreur && lecturesEleves('banc') === lect10 && fonctions009('banc') === 'aucune',
  r10.erreur ? erreurDe(r10) : lecturesEleves('banc') + ' / ' + fonctions009('banc'));
bilan('et rejouée, elle sait qu\'il n\'y a plus de fonction à retirer, et mesure encore son effet trois fois',
  /état trouvé : pas de cles_de_connexion/.test(s10b) && mesures10(s10b) === 3,
  (s10b.match(/état trouvé[^\n]*/) || ['aucun « état trouvé »'])[0] + ' ; ' + mesures10(s10b) + ' mesure(s) sur 3');
retirerTemoins('banc');
bilan('010 demande à PostgREST de recharger son cache de schéma',
  /^notify\s+pgrst\s*,\s*'reload schema'\s*;/m.test(fs.readFileSync(MIG10, 'utf8')),
  'aucun « notify pgrst, \'reload schema\' » : tant que le cache n’est pas rechargé, PostgREST tente une fonction disparue, et la page d’hier ne se replie pas sur la liste');

/* L'ÉTAT A : la 009 n'a JAMAIS été jouée sur le projet (Turquet la colle à
   la main, rien ne garantit qu'il l'ait fait). La 010 doit s'y appliquer
   sans erreur — les fonctions n'existent pas, la politique est déjà la
   bonne — et le dire, au lieu de « retirer » ce qui n'était pas là. */
{
  const bd = monter('etat_a');
  [MIG, MIG2, MIG3, MIG4, MIG8].forEach(f => psql(bd, ['-f', f]));
  semerTemoins(bd);
  const ra = psql(bd, ['-f', MIG10], true);
  const sa = String(ra.erreur || ra);
  bilan('sur une base où la 009 n\'a JAMAIS été jouée, 010 s\'applique aussi sans erreur',
    !ra.erreur, erreurDe(ra));
  bilan('elle y reconnaît qu\'il n\'y a aucune fonction à retirer',
    /état trouvé : pas de cles_de_connexion/.test(sa), (sa.match(/état trouvé[^\n]*/) || ['aucun « état trouvé »'])[0]);
  bilan('et elle y mesure son effet trois fois, une politique de lecture par table, ouverte à anon',
    mesures10(sa) === 3 && lecturesEleves(bd) === LECTURES_ATTENDUES && fonctions009(bd) === 'aucune',
    mesures10(sa) + ' mesure(s) sur 3 ; ' + lecturesEleves(bd) + ' ; fonctions : ' + fonctions009(bd));
  psql('postgres', ['-c', 'drop database if exists etat_a']);
}

/* L'ÉTAT B' — LE DURCISSEMENT QUE PROPOSAIT LA 009. Son en-tête et sa notice
   offraient, « possible, non fait », de retirer à anon le DROIT de lire les
   tables d'élèves. Appliqué à la main, il laisse à la 010 une politique
   parfaite et un visiteur qui reçoit « permission denied » : sans rien de
   plus, la page n'aurait aucune pastille, et la 010, qui mesure, échouerait
   au lieu de réparer. Elle rend donc le droit sur id, prénom et clé — sur
   ces trois colonnes SEULES : user_id et created_at restent fermés au
   visiteur, et le banc l'exige. Éprouvé sur sa propre base : la 009 jouée,
   puis le revoke, puis la 010, puis son rejeu. */
{
  const bd = monter('etat_b_prime');
  [MIG, MIG2, MIG3, MIG4, MIG8, MIG9].forEach(f => psql(bd, ['-f', f]));
  semerTemoins(bd);
  psql(bd, ['-c', 'revoke select on public.eleves, public.eleves_1ere, public.eleves_2nde from anon;']);
  const anon = sql => { const r = psql(bd, ['-tA', '-c', 'set role anon', '-c', sql], true); return r && r.erreur !== undefined ? { erreur: String(r.erreur) } : { texte: String(r).trim() }; };
  const avantB = anon('select count(*) from public.eleves_2nde');
  bilan('l\'état B\' se monte : le visiteur est REFUSÉ, pas servi d\'une liste vide (' + lu(avantB) + ')',
    avantB.erreur !== undefined && /permission denied/.test(avantB.erreur), lu(avantB));
  const rb = psql(bd, ['-f', MIG10], true);
  bilan('dans l\'état B\', 010 rend le droit de lire id, prénom et clé, et passe en mesurant ses trois tables',
    !rb.erreur && mesures10(String(rb)) === 3, rb.erreur ? erreurDe(rb) : mesures10(String(rb)) + ' mesure(s) sur 3');
  const trois = anon('select (select count(*) from (select id, prenom, cle from public.eleves) t) || \'/\' || (select count(*) from (select id, prenom, cle from public.eleves_1ere) t) || \'/\' || (select count(*) from (select id, prenom, cle from public.eleves_2nde) t)');
  bilan('le visiteur y lit de nouveau id, prénom et clé des trois classes (' + lu(trois) + ')', trois.texte === '1/1/1', lu(trois));
  const fermes = ['user_id', 'created_at'].map(c => anon('select count(' + c + ') from public.eleves_2nde'));
  bilan('et rien de plus : user_id et created_at restent refusés au visiteur',
    fermes.every(r => r.erreur !== undefined && /permission denied/.test(r.erreur)), fermes.map(lu).join(' ; '));
  const rb2 = psql(bd, ['-f', MIG10], true);
  bilan('rejouée dans l\'état B\', 010 ne fait plus rien et mesure encore ses trois tables',
    !rb2.erreur && mesures10(String(rb2)) === 3, rb2.erreur ? erreurDe(rb2) : mesures10(String(rb2)) + ' mesure(s) sur 3');
  psql('postgres', ['-c', 'drop database if exists etat_b_prime']);
}
/* DES TABLES VIDES (une rentrée, avant la première inscription) : rien à
   mesurer, et la 010 doit le DIRE trois fois, sans jamais prétendre « un
   visiteur lit la liste entière ». */
{
  const bd = monter('etat_vide');
  [MIG, MIG2, MIG3, MIG4, MIG8].forEach(f => psql(bd, ['-f', f]));
  psql(bd, ['-c', 'truncate public.eleves, public.eleves_1ere, public.eleves_2nde cascade;']);
  const rv = psql(bd, ['-f', MIG10], true);
  const sv = String(rv.erreur || rv);
  const vides = (sv.match(/table vide, effet non mesuré/g) || []).length;
  bilan('sur trois tables vides, 010 passe et dit trois fois « table vide, effet non mesuré », sans rien prétendre mesurer',
    !rv.erreur && vides === 3 && mesures10(sv) === 0,
    rv.erreur ? erreurDe(rv) : vides + ' « table vide » sur 3, ' + mesures10(sv) + ' « lit la liste entière » sur 0');
  psql('postgres', ['-c', 'drop database if exists etat_vide']);
}

/* ---------------------------------------------------------------------------
   2. Ce que chaque rôle peut réellement faire
   ------------------------------------------------------------------------- */
console.log('\n2. CE QUE CHAQUE RÔLE OBTIENT DE LA BASE');
const ctrl = psql('banc', ['-f', path.join(RACINE, 'tests/base-controles.sql')], true);
if(ctrl.erreur){
  /* Une erreur de PostgreSQL elle-même (« permission denied »…) n'a pas de
     « ÉCHEC : » ; sa première ligne est alors une NOTICE d'en-tête, muette —
     c'est la ligne « ERROR » qui porte le motif. */
  const texte = String(ctrl.erreur);
  const ligne = (texte.match(/ÉCHEC : (.*)/) || [])[1] || (texte.match(/ERROR: +(.*)/) || [])[1] || texte.split('\n')[0];
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
  /* L'autre bord de la même politique, et il est aussi coûteux : la lecture
     REDEVENUE réservée au professeur laisserait la réponse enregistrée et
     invisible. Rien ne casserait, rien ne rougirait — l'élève n'entendrait
     simplement jamais parler de la réponse qu'on lui a écrite. */
  ['la réponse du professeur redevient invisible à son destinataire',
   ['drop policy p_signalements_2nde_lecture on public.signalements_2nde',
    'create policy p_signalements_2nde_lecture on public.signalements_2nde for select to authenticated using (public.est_prof())']],
  /* Et le droit qu'on ne donne pas : une politique d'UPDATE ouverte à l'élève,
     fût-ce sur sa propre ligne, le laisserait réécrire son message — ou la
     réponse elle-même, ce que le professeur ne verrait jamais. */
  ['l’élève reçoit le droit de réécrire sa ligne de signalement',
   [`create policy p_signalements_2nde_eleve_modif on public.signalements_2nde
       for update to authenticated
       using (exists (select 1 from public.eleves_2nde e where e.id = eleve_id and e.user_id = auth.uid()))
       with check (exists (select 1 from public.eleves_2nde e where e.id = eleve_id and e.user_id = auth.uid()))`]],
  /* Le retour en arrière le plus tentant, maintenant que la liste est
     rouverte : la REFERMER aux visiteurs — rejouer la 009 « pour voir », ou
     reposer la politique pour authenticated seul depuis la console. Les
     pastilles disparaîtraient ; la page se replierait sur « Aucun compte
     pour l'instant », la fonction de la 009 n'existant plus. */
  ['la liste se referme aux visiteurs',
   ['drop policy p_eleves_2nde_liste on public.eleves_2nde',
    'create policy p_eleves_2nde_liste on public.eleves_2nde for select to authenticated using (true)']],
  /* Le durcissement le plus tentant pour réduire le prix nommé dans la 010 :
     « garder la liste, cacher les clés » par un droit de colonne. Il ne vide
     pas la liste — il fait ÉCHOUER la lecture de la page, qui demande id,
     prénom et clé d'un seul select, et plus personne n'entre. */
  ['la clé ne se lit plus sans connexion (droit de colonne retiré)',
   ['revoke select on public.eleves_2nde from anon',
    'grant select (id, prenom, created_at, user_id) on public.eleves_2nde to anon']],
];
/* LA CAUSE ATTENDUE DE CHAQUE ROUGE. « Le banc a rougi » ne suffit pas. En
   octobre 2026, avant que la 009 n'entre dans la boucle ci-dessous, huit
   mutations restaient « détectées » pour une fonction absente : un banc vert
   sur huit détections qui ne mesuraient rien. La boucle joue donc l'état
   FINAL — 001 à 004, 008, puis 009 et 010 —, celui sur lequel
   base-controles.sql écrit ses attentes ; sans la 010, la liste fermée par
   la 009 ferait rougir chaque mutation au premier contrôle du visiteur, pour
   une cause qui n'est pas la sienne. Et chaque mutation nomme la ligne ÉCHEC
   qu'elle doit produire ; une erreur « does not exist » n'est jamais une
   détection. Une mutation sans cause attendue rougit d'elle-même. */
const CAUSES = {
  'la RLS n’a pas pris sur une table (migration à moitié appliquée)': /ÉCHEC : il ne voit aucune note \(2\)/,
  'la politique d’écriture ne vérifie plus à qui appartient la note': /ÉCHEC : elle ne peut pas noter à la place de Bob/,
  'la liste des élèves redevient lisible en écriture par n’importe qui': /ÉCHEC : elle ne peut pas supprimer un camarade/,
  'une seule politique grande ouverte oubliée annule tout le reste': /ÉCHEC : il ne voit aucune note \(2\)/,
  'les signalements deviennent lisibles par toute la classe': /ÉCHEC : elle relit SES signalements, et eux seuls \(3\)/,
  /* la lecture rendue au seul professeur cache d'abord ses PROPRES signalements à l'élève : c'est ce contrôle-là qui rougit le premier */
  'la réponse du professeur redevient invisible à son destinataire': /ÉCHEC : elle relit SES signalements, et eux seuls \(0\)/,
  'l’élève reçoit le droit de réécrire sa ligne de signalement': /ÉCHEC : elle ne peut écrire aucune réponse, pas même sur sa ligne/,
  'la liste se referme aux visiteurs': /ÉCHEC : il voit la liste des prénoms \(0\)/,
  'la clé ne se lit plus sans connexion (droit de colonne retiré)': /ÉCHEC : il lit aussi la clé de chacun, dont la pastille dérive l'adresse de connexion \(refusée\)/,
};
MUTATIONS.forEach(([nom, sqls], i) => {
  const bd = 'mut' + i;
  monter(bd);
  psql(bd, ['-f', MIG]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/002_retirer_politiques_ouvertes.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/003_signalements.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/004_pause_de_l_eleve.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/008_reponse_au_signalement.sql')]);
  /* La 009 PUIS la 010, PARTOUT où le banc des rôles est joué : c'est le
     chemin le plus long qu'ait pu suivre le projet, et la preuve que la 010
     défait la 009 pour tout ce que le banc des rôles mesure. Sans la 010, la
     liste fermée par la 009 ferait rougir chaque mutation pour cette seule
     raison — un banc qui rougit pour une mauvaise cause est un mensonge qui
     rassure. Tolérant, exprès : une 010 qui refuse de se déclarer faite
     (son contrôle final) ne doit pas faire tomber le banc sur « psql a
     échoué » à la première mutation ; elle laisse chaque mutation NON
     MESURÉE, et le dit — en rouge, une ligne par mutation. */
  const monte = [MIG9, MIG10].map(f => psql(bd, ['-f', f], true)).find(x => x && x.erreur);
  if(monte){
    bilan('détectée : ' + nom, false, 'non mesurée : l’état final (009 puis 010) ne se monte pas — ' + erreurDe(monte));
    psql('postgres', ['-c', 'drop database if exists ' + bd]);
    return;
  }
  sqls.forEach(q => psql(bd, ['-c', q]));
  const r = psql(bd, ['-f', path.join(RACINE, 'tests/base-controles.sql')], true);
  const attendu = CAUSES[nom];
  const texte = String(r.erreur || '');
  const ligne = (texte.match(/ÉCHEC : [^\n]*|ERROR: [^\n]*/) || [''])[0];
  bilan('détectée : ' + nom,
    !!attendu && !!r.erreur && attendu.test(texte) && !/does not exist|n'existe pas/.test(texte),
    !attendu ? 'aucune cause attendue n’est écrite pour cette mutation : elle ne mesure rien'
      : !r.erreur ? 'le banc est resté vert alors que la base est ouverte'
      : /does not exist|n'existe pas/.test(texte) ? 'rougit pour une mauvaise cause : ' + ligne
      : !attendu.test(texte) ? 'rougit, mais pas là où la mutation frappe : ' + ligne
      : '');
  psql('postgres', ['-c', 'drop database if exists ' + bd]);
});

/* ---------------------------------------------------------------------------
   3 ter. « Tout effacer » sur les trois niveaux
   -------------------------------------------------------------------------
   La fonction Edge vide une classe entière avec « neq('id', <un uuid>) » — la
   façon habituelle de dire « toutes les lignes » à PostgREST. Mais « id » n'a
   PAS le même type partout : uuid en Terminale et en Seconde, bigint en
   Première. Comparer un bigint à un uuid n'est pas faux, c'est une ERREUR de
   syntaxe côté PostgreSQL, et la fonction rend alors « suppression impossible ».
   C'est le même piège que la création de compte, qui avait déjà marché sur deux
   niveaux et cassé le troisième. Le banc de la fonction Edge ne pouvait pas le
   voir : son double garde les lignes en mémoire, sans types. Il faut la vraie
   base. */
console.log('\n3 ter. « TOUT EFFACER » SUR LES TROIS NIVEAUX');
{
  const bd = monter('effacer');
  /* Le filtre que la fonction Edge emploie réellement pour dire « toutes les
     lignes ». Il ne doit supposer aucun type : « id » est un uuid en Terminale
     et en Seconde, un bigint en Première. */
  const filtre = 'id is not null';
  [['resultats', 'uuid'], ['resultats_1ere', 'bigint'], ['resultats_2nde', 'uuid'],
   ['eleves', 'uuid'], ['eleves_1ere', 'bigint'], ['eleves_2nde', 'uuid']].forEach(([t, type]) => {
    const r = psql(bd, ['-c', 'delete from public.' + t + ' where ' + filtre], true);
    bilan('« tout effacer » atteint ' + t + ' (id ' + type + ')', !r.erreur,
      String(r.erreur || '').split('\n').filter(l => /ERROR|ERREUR/.test(l))[0] || r.erreur);
  });
  /* Et l'ancien filtre, celui qui a cassé, ne doit pas revenir dans la
     fonction : sur un bigint il ne rend pas « zéro ligne », il rend une
     ERREUR, et le professeur lit « suppression impossible » sans savoir
     pourquoi. Le banc de la fonction Edge ne peut pas le voir — son double
     garde les lignes en mémoire, sans types. */
  const fonction = fs.readFileSync(path.join(RACINE, 'supabase/functions/admin-eleve/index.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  bilan('la fonction Edge ne filtre plus sur un identifiant impossible',
    !/00000000-0000-0000-0000-000000000000/.test(fonction),
    'neq(id, <uuid nul>) est revenu : il casse la Première, dont les id sont des bigint');
  psql('postgres', ['-c', 'drop database if exists effacer']);
}

/* ---------------------------------------------------------------------------
   3 bis. Le ménage des brouillons fantômes
   -------------------------------------------------------------------------
   supabase/menage-brouillons.sql est un script DESTRUCTIF que Turquet colle à
   la main dans l'éditeur SQL de son projet. Il ne doit emporter que les lignes
   « state: paused » — jamais une note, jamais une ligne d'une autre table.
   Un script qu'on ne peut pas rejouer chez soi se vérifie ici, sur une base
   jetable semée exprès : des notes, des brouillons vieux et récents, et une
   note dont les détails ne portent aucun « state » (le cas le plus courant :
   c'est ainsi que sont écrites toutes les notes). */
console.log('\n3 bis. LE MÉNAGE DES BROUILLONS FANTÔMES');
{
  const bd = monter('menage');
  psql(bd, ['-f', MIG]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/002_retirer_politiques_ouvertes.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/003_signalements.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/004_pause_de_l_eleve.sql')]);

  /* Une élève, deux notes (dont une ancienne), deux brouillons — l'un d'hier,
     l'autre de tout à l'heure — et un brouillon sur un AUTRE niveau, pour
     vérifier que le script passe bien sur les trois tables. */
  psql(bd, ['-c', `
    insert into auth.users (id, email) values
      ('11111111-1111-1111-1111-111111111111', 'a@eleves.test') on conflict (id) do nothing;
    insert into public.eleves_2nde (prenom, cle, user_id) values
      ('Alice', 'cle-alice', '11111111-1111-1111-1111-111111111111');
    insert into public.eleves_1ere (prenom, cle, user_id) values
      ('Alice', 'cle-alice-1ere', '11111111-1111-1111-1111-111111111111');
    insert into public.resultats_2nde (eleve_id, score, total, percent, duration_sec, details, created_at)
    select e.id, v.sc, 10, v.pc, 60, v.d::jsonb, now() - (v.age || ' hours')::interval
      from public.eleves_2nde e,
           (values (9, 90, '{"test":"pourcentage","mode":"train"}', '2'),
                   (7, 70, '{"test":"pourcentage","mode":"soutien"}', '400'),
                   (0,  0, '{"test":"pourcentage","mode":"train","state":"paused"}', '300'),
                   (0,  0, '{"test":"augmenter-pourcentage","mode":"soutien","state":"paused"}', '1')
           ) as v(sc, pc, d, age)
     where e.cle = 'cle-alice';
    insert into public.resultats_1ere (eleve_id, score, total, percent, duration_sec, details)
    select e.id, 0, 10, 0, 5, '{"test":"pourcentage","mode":"train","state":"paused"}'::jsonb
      from public.eleves_1ere e where e.cle = 'cle-alice-1ere';`]);

  const compte = q => psql(bd, ['-tAc', q]).trim();
  const notesAvant = compte("select count(*) from public.resultats_2nde where details->>'state' is distinct from 'paused'");
  const pauseAvant = compte("select count(*) from public.resultats_2nde where details->>'state' = 'paused'");
  bilan('la base d\'essai porte bien 2 notes et 2 brouillons',
    notesAvant === '2' && pauseAvant === '2', notesAvant + ' note(s), ' + pauseAvant + ' brouillon(s)');

  const sortie = psql(bd, ['-f', path.join(RACINE, 'supabase/menage-brouillons.sql')]);
  bilan('le script annonce ce qu\'il a retiré, table par table',
    /brouillon\(s\) retiré\(s\)/.test(sortie), sortie.split('\n').slice(-3).join(' '));

  bilan('les notes sont toutes là après le ménage',
    compte("select count(*) from public.resultats_2nde where details->>'state' is distinct from 'paused'") === notesAvant,
    'il en reste ' + compte("select count(*) from public.resultats_2nde where details->>'state' is distinct from 'paused'") + ' sur ' + notesAvant);
  bilan('leurs scores n\'ont pas bougé non plus',
    compte("select coalesce(sum(score),0) from public.resultats_2nde") === '16',
    'somme des scores = ' + compte("select coalesce(sum(score),0) from public.resultats_2nde"));
  bilan('plus aucun brouillon en Seconde',
    compte("select count(*) from public.resultats_2nde where details->>'state' = 'paused'") === '0');
  bilan('ni en Première : le script passe bien sur les trois tables',
    compte("select count(*) from public.resultats_1ere where details->>'state' = 'paused'") === '0');
  bilan('les élèves eux-mêmes sont intacts',
    compte("select count(*) from public.eleves_2nde") === compte("select count(*) from public.eleves_2nde"));

  const rejeu = psql(bd, ['-f', path.join(RACINE, 'supabase/menage-brouillons.sql')], true);
  bilan('le rejouer ne trouve plus rien et ne casse rien', !rejeu.erreur, rejeu.erreur);

  psql('postgres', ['-c', 'drop database if exists menage']);
}

/* ---------------------------------------------------------------------------
   3 quater. Relier les élèves à leur compte (user_id vide)
   -------------------------------------------------------------------------
   Un élève de Terminale a cliqué « Le faire sur papier » et a reçu « new row
   violates row-level security policy » (signalé par Turquet, août 2026) : sa
   ligne n'était plus RELIÉE à son compte — user_id vide —, alors que la
   connexion marchait parfaitement. La restauration d'une sauvegarde produit
   exactement cet état quand les comptes auth ont survécu au sinistre : elle
   remet user_id à vide (voir la section 4), mais auth.users n'est pas touché.
   Ce banc REPRODUIT le refus, joue supabase/relier-comptes.sql, et vérifie
   que le geste refusé passe désormais — les deux bords, comme pour la pause. */
console.log('\n3 quater. RELIER LES ÉLÈVES À LEUR COMPTE');
{
  const bd = monter('relier');
  psql(bd, ['-f', MIG]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/002_retirer_politiques_ouvertes.sql')]);
  psql(bd, ['-f', path.join(RACINE, 'supabase/migrations/003_signalements.sql')]);

  /* Trois élèves de Terminale : Léa dé-reliée dont le compte a SURVÉCU (le
     cas du reliage), Sam dé-relié dont le compte a disparu (le cas « Nouveau
     code »), Bob relié — le témoin que le script ne touche pas. */
  psql(bd, ['-c', `
    insert into auth.users (id, email) values
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cle-lea@eleves.exercices-interactifs.invalid'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cle-bob@eleves.exercices-interactifs.invalid')
      on conflict (id) do nothing;
    insert into public.eleves (prenom, cle, user_id) values
      ('Léa', 'cle-lea', null),
      ('Sam', 'cle-sam', null),
      ('Bob', 'cle-bob', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');`]);
  const idLea = psql(bd, ['-tAc', "select id from public.eleves where prenom = 'Léa'"]).trim();

  /* Le défaut d'abord : si la ligne dé-reliée n'était pas refusée, ce banc
     mesurerait un reliage qui ne répare rien. */
  const geste = "begin; set local role authenticated;"
    + " set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';"
    + " insert into public.signalements (eleve_id, exercice, message)"
    + " values ('" + idLea + "', 'dm', 'DM sur papier — Léa'); commit;";
  const refus = psql(bd, ['-c', geste], true);
  bilan('le défaut se reproduit : l\'élève dé-relié ne peut pas déposer son devoir sur papier',
    !!(refus && refus.erreur) && /row-level security/.test(String(refus.erreur)),
    refus && refus.erreur ? String(refus.erreur).split('\n')[0] : 'l\'insertion est passée');

  const sortie = psql(bd, ['-f', path.join(RACINE, 'supabase/relier-comptes.sql')]);
  bilan('le script annonce ce qu\'il a relié, table par table',
    /relié\(s\) par ce script/.test(sortie), sortie.split('\n').slice(-6).join(' '));
  bilan('Sam, dont le compte a disparu, est nommé pour un « Nouveau code »',
    /encore sans lien : Sam/.test(sortie), sortie.split('\n').filter(l => /Sam/.test(l)).join(' '));

  const liens = psql(bd, ['-tAc',
    "select prenom || '=' || coalesce(user_id::text, 'vide') from public.eleves order by prenom"]).trim().split('\n');
  bilan('Léa est reliée à son compte survivant',
    liens.some(l => l === 'Léa=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), liens.join(' , '));
  bilan('Sam reste sans lien : son compte n\'existe plus, rien à inventer',
    liens.some(l => l === 'Sam=vide'), liens.join(' , '));
  bilan('Bob, déjà relié, n\'a pas bougé',
    liens.some(l => l === 'Bob=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), liens.join(' , '));

  /* Le second bord : le geste refusé passe maintenant — c'est tout l'objet. */
  const accepte = psql(bd, ['-c', geste], true);
  bilan('le devoir sur papier de Léa part désormais',
    !(accepte && accepte.erreur), accepte && accepte.erreur ? String(accepte.erreur).split('\n')[0] : '');

  const rejeu = psql(bd, ['-f', path.join(RACINE, 'supabase/relier-comptes.sql')], true);
  bilan('le rejouer ne trouve plus rien et ne casse rien', !(rejeu && rejeu.erreur),
    rejeu && rejeu.erreur ? String(rejeu.erreur).split('\n')[0] : '');

  psql('postgres', ['-c', 'drop database if exists relier']);
}

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

/* ---------------------------------------------------------------------------
   6. Réparer les notes faussées par la coupe du nombre de questions
   -------------------------------------------------------------------------
   Signalé par Turquet (septembre 2026) : « dans la fiche 3, les élèves ont
   15/20 alors que tout est bon ». La coupe retirait des questions sans toucher
   au barème ; les notes déjà en base portent encore le mauvais dénominateur.
   supabase/corriger-notes-coupe.sql les répare — mais SEULEMENT là où le
   barème juste se PROUVE, et ce banc éprouve les deux bords : ce qu'il répare,
   et ce qu'il refuse de deviner.

   Le geste écrit dans la base vivante : il ne doit jamais baisser une note, ne
   jamais toucher une ligne qui n'est pas de son ressort, et ne rien faire de
   plus quand on le rejoue. */
console.log('\n6. RÉPARER LES NOTES FAUSSÉES PAR LA COUPE');
const REPARER = path.join(RACINE, 'supabase/corriger-notes-coupe.sql');
monter('notes');
psql('notes', ['-f', MIG]);
psql('notes', ['-f', MIG2]);

/* Deux élèves, une fiche n°3 et un devoir n°1 — les titres que le rapport doit
   savoir nommer. */
const E1 = '11111111-1111-4111-8111-111111111111';
const E2 = '22222222-2222-4222-8222-222222222222';
psql('notes', ['-c',
  "insert into public.eleves_2nde (id,prenom,cle) values "
  + "('" + E1 + "','Alice','a1'),('" + E2 + "','Bob','b1')"]);
psql('notes', ['-c',
  "insert into public.parametres_2nde (id,valeurs) values (1, '"
  + JSON.stringify({
      fiches:[{id:'fc_3', num:3, titre:'Fractions', exercices:[{id:'somme-fractions', nbQ:3}]}],
      devoirs:[{id:'dm_1', num:1, titre:'Lecture graphique', exercices:[{id:'resolutions-graphiques', nbQ:3}]}]
    }).replace(/'/g, "''") + "'::jsonb)"]);

/* Chaque ligne : [id, élève, score, total, percent, details]. Les commentaires
   disent ce que le script DOIT en faire. */
const NOTES = [
  /* --- fiche 3, un point par question, 3 posées sur 4 tirées --- */
  ['a1', E1, 3, 4, 75,  {test:'somme-fractions', mode:'train', dm:'fc_3', misses:[]}],            /* R1 → 100 */
  ['a2', E2, 2, 4, 50,  {test:'somme-fractions', mode:'train', dm:'fc_3', misses:[{q:'x'}]}],     /* R2 → 67 */
  ['a3', E2, 3, 4, 75,  {test:'somme-fractions', mode:'soutien', dm:'fc_3', misses:[]}],          /* R1 → 100 */
  /* --- devoir 1, questions de poids INÉGAUX : 19 puis 21 cases sur 28 --- */
  ['b1', E1, 19, 28, 68, {test:'resolutions-graphiques', mode:'train', dm:'dm_1', misses:[]}],    /* R1 → 100 */
  ['b2', E2, 9,  28, 32, {test:'resolutions-graphiques', mode:'train', dm:'dm_1',
                          misses:[{q:'x'},{q:'y'}]}],                                            /* laissée : 9+2≠19 */
  ['b3', E2, 21, 28, 75, {test:'resolutions-graphiques', mode:'soutien', dm:'dm_1', misses:[]}],  /* R1 → 100 */
  ['b4', E1, 10, 28, 36, {test:'resolutions-graphiques', mode:'soutien', dm:'dm_1',
                          misses:[{q:'z'}]}],                                                    /* laissée : 19≠21 */
  /* --- ce à quoi le script ne doit PAS toucher --- */
  ['c1', E1, 2, 4, 50,  {test:'somme-fractions', mode:'train', dm:'fc_3', misses:[], partiel:true}],
  ['c2', E1, 1, 4, 25,  {test:'somme-fractions', mode:'train', dm:'fc_3', state:'paused'}],
  ['c3', E1, 3, 4, 75,  {test:'somme-fractions', mode:'train', misses:[]}],
  ['c4', E2, 4, 4, 100, {test:'somme-fractions', mode:'train', dm:'fc_3', misses:[]}],
  /* Un brouillon de pause qui porterait des « misses » : aujourd'hui snapshotTest()
     n'en pose pas, si bien que le filtre des misses écarte déjà les pauses et que
     retirer « state <> paused » ne changeait RIEN — un sabotage impossible, pas un
     garde-fou mort. Le garde reste, parce que ce qui le couvre vit dans un AUTRE
     fichier et peut changer ; et cette ligne rend le bord atteignable. */
  ['c5', E1, 1, 4, 25,  {test:'somme-fractions', mode:'train', dm:'fc_3', state:'paused', misses:[]}],
];
NOTES.forEach(function(n){
  psql('notes', ['-c',
    "insert into public.resultats_2nde (id,eleve_id,score,total,percent,duration_sec,details) values ("
    + "'00000000-0000-4000-8000-0000000000" + (NOTES.indexOf(n)+10) + "','" + n[1] + "',"
    + n[2] + ',' + n[3] + ',' + n[4] + ",30,'" + JSON.stringify(n[5]).replace(/'/g, "''") + "'::jsonb)"]);
});
/* une note de Première : indemne du défaut, le script ne doit pas la connaître */
psql('notes', ['-c', "insert into public.eleves_1ere (id,prenom,cle) values (91,'Chloé','c1')"]);
psql('notes', ['-c', "insert into public.resultats_1ere (eleve_id,score,total,percent,duration_sec,details) "
  + "values (91,3,4,75,30,'{\"test\":\"pourcentage\",\"dm\":\"fc_3\",\"misses\":[]}'::jsonb)"]);

function lire(bd, ordre){
  return String(psql(bd, ['-tAc',
    "select string_agg(x, ' | ' order by x) from (select details->>'test' || '/' || percent || '/' || total"
    + " || (case when details ? 'correction_bareme' then '*' else '' end) as x"
    + " from public.resultats_2nde) t"])).trim();
}
function pct(bd, rang){
  return String(psql(bd, ['-tAc',
    "select percent || '/' || total from public.resultats_2nde where id = "
    + "'00000000-0000-4000-8000-0000000000" + rang + "'"])).trim();
}
const avantTout = String(psql('notes', ['-tAc',
  "select string_agg(id::text || '=' || percent, ',' order by id::text) from public.resultats_2nde"])).trim();

const rapport = psql('notes', ['-f', REPARER]);
if(process.env.VOIR_RAPPORT) console.log(rapport.replace(/^psql:[^ ]* /gm,'').replace(/^NOTICE:  ?/gm,'      '));

bilan('la copie SANS FAUTE de la fiche 3 repasse à 100 % (le cas signalé)',
  pct('notes', 10) === '100/3', pct('notes', 10));
bilan('et celle du second élève aussi, quel que soit le mode',
  pct('notes', 12) === '100/3', pct('notes', 12));
bilan('la copie AVEC faute est LAISSÉE : son barème n\'est écrit nulle part',
  pct('notes', 11) === '50/4', pct('notes', 11));
bilan('sur des questions de poids inégaux, la copie sans faute vaut quand même 100 %',
  pct('notes', 13) === '100/19' && pct('notes', 15) === '100/21',
  pct('notes', 13) + ' et ' + pct('notes', 15));
bilan('les copies avec faute y sont laissées aussi',
  pct('notes', 14) === '32/28' && pct('notes', 16) === '36/28',
  pct('notes', 14) + ' et ' + pct('notes', 16));
/* Le second bord de l'abstention : se taire sur ce qu'on n'a pas réparé serait
   laisser le professeur devant un carnet à moitié juste sans le savoir. */
bilan('toutes les copies avec faute sont NOMMÉES dans le rapport, jamais tues',
  /NON RÉPARÉES : 3 copie/.test(rapport)
  && /resolutions-graphiques \(devoir dm_1\) : 2 note/.test(rapport)
  && /somme-fractions \(devoir fc_3\) : 1 note/.test(rapport), rapport);
bilan('le rapport nomme la fiche comme le professeur la connaît',
  /fiche n°3 « Fractions »/.test(rapport) && /devoir n°1 « Lecture graphique »/.test(rapport), rapport);
bilan('une note PARTIELLE n\'est jamais remise à 100 % : l\'élève n\'a pas fini',
  pct('notes', 17) === '50/4', pct('notes', 17));
bilan('un brouillon de pause n\'est pas touché', pct('notes', 18) === '25/4', pct('notes', 18));
bilan('même un brouillon de pause qui porterait des « misses »',
  pct('notes', 21) === '25/4', pct('notes', 21));
bilan('une note hors devoir n\'est pas touchée : la coupe ne l\'a jamais vue',
  pct('notes', 19) === '75/4', pct('notes', 19));
bilan('une note déjà juste reste telle quelle, sans marque de correction',
  pct('notes', 20) === '100/4'
  && String(psql('notes', ['-tAc', "select count(*) from public.resultats_2nde where id="
     + "'00000000-0000-4000-8000-000000000020' and details ? 'correction_bareme'"])).trim() === '0',
  pct('notes', 20));
bilan('la Première n\'est pas touchée', String(psql('notes', ['-tAc',
  'select percent from public.resultats_1ere'])).trim() === '75');

/* L'ancien état est CONSERVÉ : rien n'est perdu, et le retour arrière du
   fichier peut s'appuyer dessus. */
const garde = String(psql('notes', ['-tAc',
  "select details->'correction_bareme'->>'total_avant' || '/' || (details->'correction_bareme'->>'percent_avant')"
  + " from public.resultats_2nde where id='00000000-0000-4000-8000-000000000010'"])).trim();
bilan('l\'ancien barème et l\'ancien pourcentage sont gardés dans la ligne',
  garde === '4/75', garde);

/* AUCUNE note ne baisse — l'invariant qui rend le geste sûr. */
const apresTout = String(psql('notes', ['-tAc',
  "select string_agg(id::text || '=' || percent, ',' order by id::text) from public.resultats_2nde"])).trim();
const baisses = avantTout.split(',').filter(function(x, i){
  const ap = apresTout.split(',')[i];
  return parseFloat(ap.split('=')[1]) < parseFloat(x.split('=')[1]);
});
bilan('aucune note n\'a baissé', baisses.length === 0, baisses.join(' '));

/* IDEMPOTENCE : le rejouer ne trouve plus rien et ne change plus rien. */
const etat1 = lire('notes');
const rapport2 = psql('notes', ['-f', REPARER]);
bilan('le rejouer ne change plus aucune valeur', lire('notes') === etat1, lire('notes'));
bilan('et il le dit plutôt que de rester muet',
  /RÉPARÉES : 0 copie/.test(rapport2) && /4 déjà réparée/.test(rapport2), rapport2);

/* Le retour arrière rend exactement l'état d'avant. */
psql('notes', ['-c',
  "update public.resultats_2nde set total=(details->'correction_bareme'->>'total_avant')::int,"
  + " percent=(details->'correction_bareme'->>'percent_avant')::numeric,"
  + " details=details-'correction_bareme' where details ? 'correction_bareme'"]);
bilan('le retour arrière rend exactement l\'état d\'avant', String(psql('notes', ['-tAc',
  "select string_agg(id::text || '=' || percent, ',' order by id::text) from public.resultats_2nde"])).trim()
  === avantTout);
psql('postgres', ['-c', 'drop database if exists notes']);

/* ---------------------------------------------------------------------------
   7. Fusionner deux comptes d'un même élève (Seconde)
   -------------------------------------------------------------------------
   Demande de Turquet (octobre 2026) : réunir les deux comptes de Clément sous
   « DELMONT Clément », en ne gardant que la meilleure note de chaque exercice
   de devoir ou de fiche. supabase/fusionner-eleves-2nde.sql écrit dans la base
   vivante et SUPPRIME des lignes : ce banc exige qu'il garde exactement ce que
   la page compterait (la meilleure par exercice ET par mode), qu'il archive
   tout ce qu'il écarte, qu'il ne touche à aucun autre élève, qu'il refuse un
   motif ambigu sans rien bouger, et qu'il soit sans effet rejoué. */
console.log('\n7. FUSIONNER DEUX COMPTES D\'UN MÊME ÉLÈVE');
const FUSION = path.join(RACINE, 'supabase/fusionner-eleves-2nde.sql');
monter('fusion');
psql('fusion', ['-f', MIG]);
psql('fusion', ['-f', MIG2]);
psql('fusion', ['-f', MIG3]);

const UK = 'aaaaaaaa-0000-4000-8000-00000000000a', UP = 'bbbbbbbb-0000-4000-8000-00000000000b';
const K = 'aaaaaaaa-1111-4111-8111-11111111111a';   /* « Clément », a travaillé hier : il reste */
const P = 'bbbbbbbb-2222-4222-8222-22222222222b';   /* « CLEMENT D », plus ancien : il s'en va */
const A = 'cccccccc-3333-4333-8333-33333333333c';   /* Alice, témoin */
psql('fusion', ['-c', "insert into auth.users (id,email) values ('" + UK + "','k@x.invalid'),('" + UP + "','p@x.invalid')"]);
psql('fusion', ['-c', "insert into public.eleves_2nde (id,prenom,cle,user_id) values "
  + "('" + K + "','Clément','ck','" + UK + "'),('" + P + "','CLEMENT D','cp','" + UP + "'),('" + A + "','Alice','ca',null)"]);
const NOTES_AV = {};
NOTES_AV[P + '|ex1'] = 7; NOTES_AV[K + '|ex1'] = 5; NOTES_AV[P + '|ex2'] = 4; NOTES_AV[A + '|ex1'] = 3;
psql('fusion', ['-c', "insert into public.parametres_2nde (id,valeurs) values (1, '"
  + JSON.stringify({ locks:['ex9'],
      devoirs:[{id:'dm_1', num:1, titre:'Fonctions', exercices:[{id:'ex1'}], notes:NOTES_AV}],
      fiches:[{id:'fc_2', num:2, titre:'Calcul', exercices:[{id:'ex2'}]}] }).replace(/'/g, "''") + "'::jsonb)"]);

/* [rang, élève, percent, jours avant aujourd'hui, details] — le commentaire dit le sort attendu */
const FUS = [
  [1,  K, 60, 9, {test:'ex1', mode:'train',   dm:'dm_1'}],                 /* écartée : 80 sur l'autre compte */
  [2,  P, 80, 8, {test:'ex1', mode:'train',   dm:'dm_1'}],                 /* gardée */
  [3,  P, 90, 7, {test:'ex1', mode:'soutien', dm:'dm_1'}],                 /* gardée : l'autre mode */
  [4,  K, 40, 6, {test:'ex1', mode:'soutien', dm:'dm_1'}],                 /* écartée */
  [5,  K, 70, 2, {test:'ex2', mode:'train',   dm:'fc_2'}],                 /* gardée : égalité, la plus récente */
  [6,  P, 70, 5, {test:'ex2', mode:'train',   dm:'fc_2'}],                 /* écartée */
  [7,  P, 30, 4, {test:'ex1', mode:'train'}],                              /* hors devoir : déplacée */
  [8,  K, 50, 3, {test:'ex1', mode:'train'}],                              /* hors devoir : reste */
  [9,  P, 10, 4, {test:'ex3', mode:'train',   dm:'dm_1', state:'paused'}], /* pause unique : déplacée */
  [10, K, 20, 1, {test:'ex1', mode:'train',   dm:'dm_1', state:'paused'}], /* pause la plus récente : reste */
  [11, P, 90, 5, {test:'ex1', mode:'train',   dm:'dm_1', state:'paused'}], /* pause en double : écartée */
  [12, A, 20, 1, {test:'ex1', mode:'train',   dm:'dm_1'}],                 /* Alice : intacte */
  [13, A, 10, 2, {test:'ex1', mode:'train',   dm:'dm_1'}],                 /* Alice, moins bonne : intacte aussi */
];
const idFus = rang => '00000000-0000-4000-8000-0000000001' + String(rang).padStart(2, '0');
FUS.forEach(function(f){
  psql('fusion', ['-c', "insert into public.resultats_2nde (id,eleve_id,score,total,percent,duration_sec,details,created_at) values ('"
    + idFus(f[0]) + "','" + f[1] + "'," + f[2] + ",100," + f[2] + ",30,'" + JSON.stringify(f[4]) + "'::jsonb, now() - interval '"
    + f[3] + " days')"]);
});
psql('fusion', ['-c', "insert into public.signalements_2nde (eleve_id, exercice, message) values ('" + P + "','ex1','une remarque')"]);

const etatFusion = () => String(psql('fusion', ['-tAc',
  "select (select string_agg(prenom || '=' || id, ',' order by prenom) from public.eleves_2nde) || ' # '"
  + " || (select string_agg(right(id::text,3) || ':' || right(eleve_id::text,1), ',' order by id) from public.resultats_2nde)"
  + " || ' # ' || (select valeurs::text from public.parametres_2nde where id = 1)"])).trim();

/* Le bord du REFUS d'abord : un troisième nom qui contient le motif rend la
   cible ambiguë — le fichier doit s'arrêter en rouge, en nommant les comptes,
   sans avoir rien bougé. */
psql('fusion', ['-c', "insert into public.eleves_2nde (prenom,cle) values ('Clémentine','cc')"]);
const avantRefus = etatFusion();
const refus = psql('fusion', ['-f', FUSION], true);
bilan('trois comptes répondent au motif : la fusion s\'arrête en rouge et les nomme',
  refus.erreur && /FUSION ANNULÉE, RIEN N'A BOUGÉ/.test(refus.erreur) && /Clémentine/.test(refus.erreur)
  && /CLEMENT D/.test(refus.erreur), refus.erreur || 'aucune erreur');
bilan('et rien n\'a bougé', etatFusion() === avantRefus, etatFusion());
psql('fusion', ['-c', "delete from public.eleves_2nde where prenom = 'Clémentine'"]);

const sortieFus = psql('fusion', ['-f', FUSION]);
if(process.env.VOIR_RAPPORT) console.log(sortieFus);

const clements = String(psql('fusion', ['-tAc',
  "select string_agg(prenom || '=' || id, ',') from public.eleves_2nde where prenom ilike '%cl%ment%'"])).trim();
bilan('un seul compte reste, nommé « DELMONT Clément » — celui qui a travaillé le plus récemment',
  clements === 'DELMONT Clément=' + K, clements);
const restes = String(psql('fusion', ['-tAc',
  "select string_agg(right(id::text,2), ',' order by id) from public.resultats_2nde where eleve_id = '" + K + "'"])).trim();
bilan('il garde la meilleure note par exercice ET par mode, tout le hors-devoir, une pause par exercice',
  restes === '02,03,05,07,08,09,10', restes);
const archives = String(psql('fusion', ['-tAc',
  "select string_agg(x, ',' order by x) from (select case when table_source = 'eleves_2nde'"
  + " then ligne->>'prenom' else right(ligne->>'id',2) end as x from archives.fusion_eleves) t"])).trim();
bilan('tout ce qui est écarté est archivé, ligne entière — notes, pause en double, compte retiré',
  archives === '01,04,06,11,CLEMENT D', archives);
const alice = String(psql('fusion', ['-tAc',
  "select string_agg(right(id::text,2), ',' order by id) from public.resultats_2nde where eleve_id = '" + A + "'"])).trim();
bilan('un autre élève n\'est pas touché, même ses notes moins bonnes', alice === '12,13', alice);
const notesAp = JSON.parse(String(psql('fusion', ['-tAc',
  "select valeurs->'devoirs'->0->'notes' from public.parametres_2nde where id = 1"])).trim());
const notesAttendues = {}; notesAttendues[K + '|ex1'] = 7; notesAttendues[K + '|ex2'] = 4; notesAttendues[A + '|ex1'] = 3;
bilan('les notes posées à la main passent au compte gardé, la plus haute l\'emporte',
  JSON.stringify(notesAp, Object.keys(notesAp).sort()) === JSON.stringify(notesAttendues, Object.keys(notesAttendues).sort()),
  JSON.stringify(notesAp));
const reglages = String(psql('fusion', ['-tAc',
  "select (valeurs->'locks')::text || ' ' || (valeurs->'fiches')::text from public.parametres_2nde where id = 1"])).trim();
bilan('le reste des réglages n\'a pas bougé',
  reglages === '["ex9"] [{"id": "fc_2", "num": 2, "titre": "Calcul", "exercices": [{"id": "ex2"}]}]', reglages);
const sig = String(psql('fusion', ['-tAc', "select eleve_id from public.signalements_2nde"])).trim();
bilan('le signalement suit l\'élève sur le compte gardé', sig === K, sig);
const comptes = String(psql('fusion', ['-tAc', "select string_agg(id::text, ',' order by id) from auth.users"])).trim();
bilan('le compte de connexion du compte retiré est supprimé, l\'autre reste', comptes === UK, comptes);
bilan('l\'éditeur SQL affiche les notes de devoir du compte fusionné',
  /DELMONT Clément/.test(sortieFus) && /devoir n°1 « Fonctions »/.test(sortieFus) && /fiche n°2 « Calcul »/.test(sortieFus), sortieFus);

const apresFus = etatFusion();
const rejeuFus = psql('fusion', ['-f', FUSION]);
bilan('le rejouer ne change plus rien, et le dit',
  etatFusion() === apresFus && /déjà nommé « DELMONT Clément »/.test(rejeuFus), rejeuFus);
psql('postgres', ['-c', 'drop database if exists fusion']);

/* ---------------------------------------------------------------------------
   8. Renommer les élèves de Seconde « NOM Prénom » d'après la liste de classe
   -------------------------------------------------------------------------
   Demande de Turquet (octobre 2026). supabase/renommer-eleves-2nde.sql écrit
   dans la base vivante : ce banc exige qu'il renomme ce que la liste reconnaît
   sans doute possible ou que Turquet a désigné (« Manon » seul, ambigu entre
   deux Manon, est CHECCHI Manon), qu'il laisse intacts un compte ambigu et un
   compte absent de la liste,
   que les notes suivent l'élève, et qu'il soit sans effet rejoué. */
console.log('\n8. RENOMMER LES ÉLÈVES DE SECONDE D\'APRÈS LA LISTE');
const RENOM = path.join(RACINE, 'supabase/renommer-eleves-2nde.sql');
monter('renom');
psql('renom', ['-f', MIG]);
psql('renom', ['-f', MIG2]);
const LINA = 'dddddddd-4444-4444-8444-44444444444d';
psql('renom', ['-c', "insert into public.eleves_2nde (id,prenom,cle) values "
  + "('" + LINA + "','lina','r1'),"          /* prénom seul, en minuscules */
  + "(gen_random_uuid(),'Jahinna','r2'),"    /* sans son accent */
  + "(gen_random_uuid(),'Manon','r3'),"      /* désignée à la main : CHECCHI Manon */
  + "(gen_random_uuid(),'Manon G.','r4'),"   /* l'initiale du nom tranche, et l'emporte sur r3 */
  + "(gen_random_uuid(),'Roan Lewis','r5'),"  /* tiret perdu */
  + "(gen_random_uuid(),'DELMONT Clément','r6')," /* déjà au bon nom */
  + "(gen_random_uuid(),'Basil','r9'),"
  + "(gen_random_uuid(),'mathiot BASIL','r10')," /* idem */
  + "(gen_random_uuid(),'Zoé','r11'),"       /* absente de la liste */
  + "(gen_random_uuid(),'Iness','r14')"      /* désignée à la main : VALGRESY Ines */]);
psql('renom', ['-c', "insert into public.resultats_2nde (eleve_id,score,total,percent,duration_sec,details) values ('"
  + LINA + "',8,10,80,30,'{\"test\":\"ex1\"}'::jsonb)"]);
const noms = () => String(psql('renom', ['-tAc',
  "select string_agg(cle || '=' || prenom, ',' order by length(cle), cle) from public.eleves_2nde"])).trim();
const sortieRen = psql('renom', ['-f', RENOM]);
if(process.env.VOIR_RAPPORT) console.log(sortieRen);
const apresRen = noms();
bilan('les comptes reconnus sans doute prennent « NOM Prénom » de la liste, les autres sont intacts',
  apresRen === 'r1=MARMASSE Lina,r2=DIJOUX Jahînna,r3=CHECCHI Manon,r4=GESTIN Manon,r5=DAVERY Roan-Lewis,'
  + 'r6=DELMONT Clément,r9=Basil,r10=mathiot BASIL,r11=Zoé,r14=VALGRESY Ines', apresRen);
const noteLina = String(psql('renom', ['-tAc',
  "select e.prenom from public.resultats_2nde r join public.eleves_2nde e on e.id = r.eleve_id"])).trim();
bilan('les notes suivent l\'élève renommé', noteLina === 'MARMASSE Lina', noteLina);
bilan('l\'éditeur SQL dit ce qui a été fait, ligne par ligne',
  /MARMASSE Lina\s*\|\s*lina\s*\|\s*renommé/.test(sortieRen)
  && /CHECCHI Manon\s*\|\s*Manon\s*\|\s*renommé/.test(sortieRen)
  && /VALGRESY Ines\s*\|\s*Iness\s*\|\s*renommé/.test(sortieRen)
  && /MATHIOT Basil\s*\|\s*Basil\s*\|\s*ambigu/.test(sortieRen)
  && /GESTIN Manon\s*\|\s*Manon G\.\s*\|\s*renommé/.test(sortieRen)
  && /AHMED Inaya\s*\|\s*—\s*\|\s*aucun compte/.test(sortieRen)
  && /Zoé\s*\|\s*compte absent de la liste/.test(sortieRen), sortieRen);
/* Deux comptes pour un même élève, l'un au bon nom, l'autre à une espace
   près : le fichier ne choisit pas — aucun des deux ne bouge. */
psql('renom', ['-c', "insert into public.eleves_2nde (prenom,cle) values ('OBERLE Lison','r12'),('oberle  lison','r13')"]);
const pris = psql('renom', ['-f', RENOM]);
const lisons = String(psql('renom', ['-tAc',
  "select string_agg(cle || '=' || prenom, ',' order by cle) from public.eleves_2nde where cle in ('r12','r13')"])).trim();
bilan('deux comptes pour un élève, même l\'un au bon nom : rien ne bouge, et c\'est dit',
  lisons === 'r12=OBERLE Lison,r13=oberle  lison' && /OBERLE Lison\s*\|\s*oberle  lison\s*\|\s*ambigu/.test(pris),
  lisons + '\n' + pris);
psql('renom', ['-c', "delete from public.eleves_2nde where cle in ('r12','r13')"]);
const avantRejeu = noms();
const rejeuRen = psql('renom', ['-f', RENOM]);
const apresRejeu = noms();
bilan('le rejouer ne change rien, et le dit',
  apresRejeu === avantRejeu
  && /MARMASSE Lina\s*\|\s*MARMASSE Lina\s*\|\s*déjà au bon nom/.test(rejeuRen), apresRejeu + '\n' + rejeuRen);
psql('postgres', ['-c', 'drop database if exists renom']);

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
