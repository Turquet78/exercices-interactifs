/* ============================================================================
   SAUVEGARDE — exporte les données des neuf tables dans un seul fichier JSON
   ============================================================================
   Le plan gratuit de Supabase ne fait AUCUNE sauvegarde automatique. Si la base
   est effacée — fausse manœuvre, projet suspendu, migration ratée — il n'y a
   rien à restaurer. Ce script comble ce trou, et l'action GitHub le lance
   chaque nuit du samedi au dimanche.

   CE QU'IL SAUVEGARDE : les données. Prénoms, notes, devoirs, réglages.
   CE QU'IL NE SAUVEGARDE PAS, et pourquoi :

     · la STRUCTURE des tables et les règles d'accès — elles vivent déjà dans
       supabase/migrations/, versionnées dans ce dépôt. Les sauvegarder ici
       serait les tenir à deux endroits, donc les laisser diverger ;
     · les CODES des élèves — ils sont hachés par Supabase, dans un schéma que
       ce script ne peut pas lire, et un hachage ne se restaure pas utilement.
       Après une restauration, il faut redonner un code à chaque élève. C'est
       l'affaire de quelques minutes, et les notes, elles, sont sauvées.

   Restaurer, si le pire arrive : rejouer 001 puis 002 sur une base neuve, puis
   réinsérer les lignes de ce fichier. La marche à suivre est dans LISEZMOI.md.

   Le fichier produit est CHIFFRÉ par l'action avant d'être conservé : il
   contient des prénoms d'élèves mineurs associés à leurs résultats, et le
   dépôt est public.
   ========================================================================== */

const URL_SB  = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_KEY;

const TABLES = [
  'eleves',     'resultats',      'parametres',
  'eleves_1ere','resultats_1ere', 'parametres_1ere',
  'eleves_2nde','resultats_2nde', 'parametres_2nde',
  'professeurs',
];

/* PostgREST ne rend qu'un millier de lignes par requête. Sans pagination, une
   classe entière tiendrait dans la sauvegarde aujourd'hui et serait tronquée
   en silence le jour où elle grandirait — le genre de défaut qu'on ne
   découvre qu'au moment de restaurer. */
const PAR_PAGE = 1000;

function sortir(message){
  console.error('\n✗ ' + message + '\n');
  process.exit(1);
}

if(!URL_SB || !SERVICE){
  sortir('SUPABASE_URL ou SUPABASE_SERVICE_KEY absente.\n'
       + '  Ces deux valeurs sont des secrets GitHub, à poser dans\n'
       + '  Settings → Secrets and variables → Actions.');
}

async function lireTable(nom){
  const lignes = [];
  for(let depart = 0; ; depart += PAR_PAGE){
    const url = URL_SB.replace(/\/+$/, '')
      + '/rest/v1/' + encodeURIComponent(nom)
      + '?select=*&limit=' + PAR_PAGE + '&offset=' + depart;
    const r = await fetch(url, {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
    });
    if(!r.ok){
      const corps = await r.text().catch(() => '');
      /* Une table absente n'est pas une panne : les trois niveaux n'ont pas
         forcément tous leurs tables. Tout le reste en est une, et se dit. */
      if(r.status === 404) return null;
      sortir('lecture de « ' + nom + ' » refusée (' + r.status + ') : ' + corps.slice(0, 200));
    }
    const page = await r.json();
    lignes.push(...page);
    if(page.length < PAR_PAGE) break;
  }
  return lignes;
}

const donnees = {};
const compte  = {};
let total = 0;

for(const nom of TABLES){
  const lignes = await lireTable(nom);
  if(lignes === null){ console.log('  ○ ' + nom + ' — table absente, ignorée'); continue; }
  donnees[nom] = lignes;
  compte[nom]  = lignes.length;
  total += lignes.length;
  console.log('  ✓ ' + nom.padEnd(18) + lignes.length + ' ligne(s)');
}

const sauvegarde = {
  /* De quoi savoir, en ouvrant le fichier six mois plus tard, ce qu'il contient
     et comment le relire. */
  faite_le: new Date().toISOString(),
  projet: URL_SB,
  contenu: 'données seules — la structure est dans supabase/migrations/',
  codes_eleves: 'non sauvegardés (hachés par Supabase) — à redonner après restauration',
  lignes: compte,
  total: total,
  donnees: donnees,
};

const fichier = process.argv[2] || 'sauvegarde.json';
await import('node:fs').then(fs => fs.writeFileSync(fichier, JSON.stringify(sauvegarde, null, 1)));

console.log('\n' + total + ' ligne(s) dans ' + Object.keys(donnees).length + ' table(s) → ' + fichier);

/* Une sauvegarde vide est le pire des cas : elle rassure sans rien contenir,
   et on ne s'en aperçoit qu'en voulant restaurer. Tant que la base est vide
   c'est normal — mais le dire fort, plutôt que de laisser croire au succès. */
if(total === 0){
  console.log('\n⚠  Cette sauvegarde ne contient AUCUNE ligne.');
  console.log('   Normal si la base est encore vide. Anormal en cours d\'année :');
  console.log('   vérifiez alors que SUPABASE_SERVICE_KEY est bien la clé de service.');
}
