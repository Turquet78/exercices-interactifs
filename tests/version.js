/* ============================================================================
   LE NUMÉRO DE VERSION D'UNE PAGE MODIFIÉE DOIT DÉPASSER CELUI DE `main`.
       node tests/version.js
   ============================================================================
   CE QU'IL EMPÊCHE, ET IL A DÉJÀ COÛTÉ UNE AMBIGUÏTÉ. Deux branches partent du
   même `main`, chacune incrémente `APP_VERSION` du même cran, et la première
   fusionnée pose le numéro sur `main`. La seconde porte alors EXACTEMENT le même
   nombre, sur la même ligne : `git` ne voit aucun conflit — les deux côtés
   écrivent la même valeur —, aucun banc ne bronche, l'action est verte, et
   `main` se retrouve avec DEUX livraisons sous un seul numéro. C'est arrivé en
   septembre 2026 : v327 de la Terminale porte le clavier en paysage ET le mot
   « Bonus », et la règle 4 promet le contraire — « ce numéro permet de savoir
   d'un coup d'œil quelle version est ouverte ».

   AUCUNE BRANCHE NE PEUT LE VOIR SEULE, et c'est ce qui rend ce banc
   nécessaire. C'est la collision des numéros d'exercice et des numéros de
   section du banc navigateur, transposée à la version : chaque branche est
   juste de son côté, le défaut n'existe que dans la fusion. Un contrôle qui ne
   lirait que le dépôt local resterait vert ; celui-ci va CHERCHER ce que `main`
   porte au moment où l'on s'apprête à fusionner.

   CE QU'IL COMPARE. Pour chaque page, le fichier de l'ARBRE DE TRAVAIL — dans
   l'intégration continue, c'est le résultat de la fusion, donc exactement ce qui
   serait publié — contre le même fichier sur `main` :
     · les octets diffèrent  → le numéro doit être STRICTEMENT plus grand ;
     · les octets sont identiques → le numéro ne peut pas avoir bougé, et rien
       n'est exigé : une branche qui ne touche qu'un banc ou `CLAUDE.md` n'a
       aucun numéro à incrémenter.
   Ce second point est le bord OPPOSÉ, et il compte autant : un contrôle qui
   réclamerait un incrément à chaque poussée ferait monter la version sans que
   rien ne change à l'écran, c'est-à-dire fabriquerait l'ambiguïté qu'il corrige.

   IL TIENT AUSSI LA RÈGLE 4 PAR LA MÊME MESURE : une page modifiée dont le
   numéro n'a pas bougé du tout porte le même numéro que `main` — donc rouge,
   sans qu'on ait à écrire une seconde règle.

   « STRICTEMENT PLUS GRAND », ET NON « +1 » : une branche qui reprend `main`
   deux fois incrémente deux fois, et exiger le cran exact la ferait rougir sur
   un numéro parfaitement légitime. Ce qui compte est qu'aucun numéro ne
   désigne deux pages différentes, pas qu'ils se suivent sans trou.

   CE QU'IL FAIT QUAND IL NE PEUT PAS MESURER. Sans `git`, sans dépôt, ou sans
   `main` atteignable, il ne mesure RIEN : il le dit bruyamment et sort en
   échec, comme le banc de la base le fait quand PostgreSQL manque. Un banc qui
   passerait au vert faute de référence serait pire que pas de banc du tout.
   Pour passer outre en connaissance de cause : SANS_VERSION=1. Hors ligne, il se
   rabat sur le `origin/main` déjà présent — en le DISANT dans sa première
   ligne : le verdict vaut alors pour ce `main`-là.

   CE QU'IL NE VOIT PAS, et le dire vaut mieux que de le taire : il compare à
   `main` AU MOMENT OÙ IL TOURNE. Si `main` avance ensuite, son verdict devient
   périmé sans qu'il le sache — rejouer l'action, ou reprendre `main` dans la
   branche, le remet à jour, et c'est ce qu'on fait de toute façon avant de
   fusionner.
   ========================================================================== */
const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const PROFILS = require('./profils');

const RACINE  = path.join(__dirname, '..');
/* La seule branche publiée : GitHub Pages sert `main`, et c'est la fusion vers
   elle qui met la page sous les yeux des élèves. */
const BRANCHE = 'main';

let echecs = 0;
function verifier(intitule, ok, detail){
  console.log((ok ? '✓ ' : '✗ ') + intitule + (ok || !detail ? '' : ' — ' + detail));
  if(!ok) echecs++;
}

function git(args, binaire){
  return spawnSync('git', args, {
    cwd: RACINE,
    encoding: binaire ? 'buffer' : 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
}

function refusDeMesurer(lignes){
  console.error('\n╔' + '═'.repeat(58) + '╗');
  console.error('║  CE CONTRÔLE N\'A PAS PU ÊTRE EXÉCUTÉ' + ' '.repeat(21) + '║');
  console.error('╚' + '═'.repeat(58) + '╝');
  lignes.forEach(l => console.error(l));
  console.error('');
  console.error('Aucune comparaison n\'a eu lieu : les numéros de version n\'ont');
  console.error('été vérifiés PAR RIEN, et aucun autre banc ne les regarde.');
  console.error('');
  console.error('Pour passer outre en connaissance de cause : SANS_VERSION=1');
  process.exit(process.env.SANS_VERSION ? 0 : 1);
}

/* ---------------------------------------------------------------------------
   1. RETROUVER `main`. On n'invente pas la référence : on la nomme dans la
   sortie, pour que le banc ne puisse pas dire à quoi il a comparé autre chose
   que ce qu'il a vraiment lu.
   --------------------------------------------------------------------------- */
if(git(['rev-parse', '--git-dir']).status !== 0){
  refusDeMesurer(['Ce dossier n\'est pas un dépôt git, ou `git` est introuvable.']);
}

function resoudre(){
  /* ON RÉCUPÈRE AVANT DE LIRE, et c'est le point qui compte. Une référence en
     retard est pire qu'aucune : elle manquerait justement la collision qu'on
     cherche — `main` a avancé, le dépôt local ne le sait pas, et le banc
     passerait au vert en comparant à l'avant-veille. Dans l'intégration
     continue, `origin/main` n'existe même pas : le dépôt y est cloné sur la
     seule fusion de la pull request.
     AUCUNE PROFONDEUR N'EST IMPOSÉE, et c'est mesuré plutôt que supposé : un
     `--depth=1` TRONQUE l'historique du dépôt qui lance le banc — relevé ici,
     127 commits ramenés à 1 — quand une récupération ordinaire laisse la borne
     exactement où elle était, superficielle ou non. Un banc ne touche pas au
     dépôt de celui qui le lance. */
  const f = git(['fetch', '--no-tags', 'origin', BRANCHE]);
  if(f.status === 0){
    const r = git(['rev-parse', '--verify', '--quiet', 'FETCH_HEAD^{commit}']);
    if(r.status === 0 && r.stdout.trim()){
      return { ref: 'origin/' + BRANCHE + ' (récupéré à l\'instant)', sha: r.stdout.trim() };
    }
  }
  /* Hors ligne, on se rabat sur ce que le dépôt porte déjà — en le DISANT :
     le verdict vaut alors pour ce `main`-là, pas forcément pour celui d'en
     face. On ne se rabat JAMAIS sur la branche locale `main` : elle est en
     retard par nature, et un banc qui la prendrait pour référence dirait
     « comparé à main » en ayant comparé à autre chose. */
  const r = git(['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/' + BRANCHE + '^{commit}']);
  if(r.status === 0 && r.stdout.trim()){
    return { ref: 'origin/' + BRANCHE + ' (SANS récupération : la référence peut être en retard)',
             sha: r.stdout.trim() };
  }
  return null;
}

const REF = resoudre();
if(!REF){
  refusDeMesurer([
    '`origin/' + BRANCHE + '` est introuvable, et la récupération a échoué',
    '(pas de réseau, ou pas de dépôt distant).',
    '',
    '  git fetch origin ' + BRANCHE
  ]);
}
console.log('Référence : ' + REF.ref + ' — ' + REF.sha.slice(0, 10));
console.log('');

/* ---------------------------------------------------------------------------
   2. LIRE LE NUMÉRO. Une page qui n'en porterait pas un, ou en porterait deux,
   rend la comparaison impossible : c'est un échec, jamais un silence. Une
   expression qui cesserait de reconnaître la déclaration rendrait ce banc vert
   sur TOUT, et c'est exactement ce que ce garde empêche.
   --------------------------------------------------------------------------- */
function lireVersion(texte){
  const trouves = [...texte.matchAll(/\bconst\s+APP_VERSION\s*=\s*(\d+)\s*;/g)];
  if(trouves.length !== 1) return { n: null, combien: trouves.length };
  return { n: parseInt(trouves[0][1], 10), combien: 1 };
}

/* ---------------------------------------------------------------------------
   3. COMPARER, page par page. La liste vient de `tests/profils.js` : une page
   ajoutée demain y déclare son profil, donc elle est couverte sans rien de plus.
   --------------------------------------------------------------------------- */
const pages = Object.keys(PROFILS);
let comparees = 0, modifiees = 0;

for(const page of pages){
  const cheminLocal = path.join(RACINE, page);
  if(!fs.existsSync(cheminLocal)){
    verifier(page + ' : le fichier existe', false, 'introuvable dans l\'arbre de travail');
    continue;
  }
  const octetsLocaux = fs.readFileSync(cheminLocal);
  const vLocale = lireVersion(octetsLocaux.toString('utf8'));
  if(vLocale.n === null){
    verifier(page + ' : la page déclare un APP_VERSION et un seul', false,
             vLocale.combien + ' déclaration(s) trouvée(s)');
    continue;
  }

  const r = git(['show', REF.sha + ':' + page], true);
  if(r.status !== 0){
    console.log('○ ' + page + ' : absente de ' + BRANCHE + ' — page neuve, aucun numéro à dépasser (v' + vLocale.n + ')');
    continue;
  }
  const octetsMain = r.stdout;
  const vMain = lireVersion(octetsMain.toString('utf8'));
  if(vMain.n === null){
    verifier(page + ' : ' + BRANCHE + ' déclare un APP_VERSION et un seul', false,
             vMain.combien + ' déclaration(s) sur ' + BRANCHE);
    continue;
  }

  comparees++;
  const identique = octetsLocaux.equals(octetsMain);
  if(identique){
    /* Bord OPPOSÉ : rien ne change, donc rien n'est exigé. Le numéro ne peut
       pas avoir bougé sans que les octets bougent, et on le dit quand même :
       un contrôle qui n'affirme rien sur ce cas laisserait croire qu'il
       réclame un incrément à chaque poussée. */
    verifier(page + ' : inchangée depuis ' + BRANCHE + ', son numéro ne bouge pas (v' + vLocale.n + ')',
             vLocale.n === vMain.n, 'v' + vLocale.n + ' ici, v' + vMain.n + ' sur ' + BRANCHE);
    continue;
  }

  modifiees++;
  const ok = vLocale.n > vMain.n;
  verifier(page + ' : modifiée, son numéro dépasse celui de ' + BRANCHE
             + ' (v' + vMain.n + ' → v' + vLocale.n + ')',
           ok,
           vLocale.n === vMain.n
             ? 'v' + vLocale.n + ' est DÉJÀ PRIS sur ' + BRANCHE + ' : deux pages différentes '
               + 'porteraient le même numéro. Incrémenter AVANT de fusionner.'
             : 'v' + vLocale.n + ' ici, mais ' + BRANCHE + ' est déjà à v' + vMain.n
               + ' : le numéro reculerait. Reprendre ' + BRANCHE + ', puis incrémenter.');
}

/* ---------------------------------------------------------------------------
   4. LE GARDE « CE BANC NE MESURE RIEN ». Si aucune page n'a pu être comparée,
   tous les contrôles ci-dessus sont verts en ne disant rien du tout.
   --------------------------------------------------------------------------- */
verifier('des pages ont bien été comparées à ' + BRANCHE,
         comparees > 0, 'aucune des ' + pages.length + ' page(s) n\'a pu être comparée');

console.log('');
console.log(modifiees === 0
  ? 'Aucune page ne change : il n\'y a pas de numéro à incrémenter.'
  : modifiees + ' page(s) modifiée(s) sur ' + comparees + ' comparée(s).');

console.log('\n' + '═'.repeat(58));
console.log(echecs === 0
  ? '✓ Les numéros de version ne se heurtent pas à ceux de ' + BRANCHE + '.'
  : '✗ ' + echecs + ' contrôle(s) en échec. NE PAS fusionner.');
process.exit(echecs ? 1 : 0);
