/* ============================================================================
   VÉRIFICATIONS — à lancer avant toute mise en ligne :
       node tests/verifier.js <fichier.html>
   ============================================================================
   Quatre familles de contrôles, du moins au plus coûteux :

     1. STRUCTURE   syntaxe JS, accolades CSS, écrans et fonctions référencés
     2. DÉMARRAGE   la page se charge-t-elle sans erreur JavaScript ?
     3. AIDE        les boutons d'aide répondent-ils, y compris en fenêtre
                    détachée (le cas qui a échoué trois fois de suite) ?
     4. EXERCICES   l'exercice témoin, la pause, les générateurs

   Les familles 1 et 2 sont les mêmes pour les trois niveaux. Les familles 3
   et 4 dépendent de ce que le fichier sait faire : c'est tests/profils.js qui
   le déclare. Un contrôle inapplicable s'affiche « ○ non applicable » avec sa
   raison — il n'est jamais retiré en silence, et les manques de chaque fichier
   sont récapitulés à la fin.

   Une erreur JavaScript imprévue fait ÉCHOUER un contrôle ; elle n'interrompt
   plus le banc. Auparavant un ReferenceError parti d'un setTimeout tuait le
   processus avant tout verdict, et les deux fichiers autres que la Première
   n'ont ainsi jamais pu être vérifiés jusqu'au bout.

   Sortie 0 si tout passe, 1 sinon — utilisable tel quel dans une action GitHub.
   ========================================================================== */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');
const { charger, lire, preparer, couleur } = require('./harnais');
const PROFILS = require('./profils');

const CIBLE = process.argv[2] || 'premiere-specifique.html';
const P = PROFILS[CIBLE];
if(!P){
  console.error('Aucun profil pour « ' + CIBLE +' ». Fichiers connus : ' + Object.keys(PROFILS).join(', '));
  console.error('Ajoutez son profil dans tests/profils.js avant de le contrôler.');
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

/* Un contrôle ne doit jamais tuer le banc : toute exception devient un échec. */
function evaluer(w, code){
  try { return { ok:true, valeur: w.eval(code) }; }
  catch(e){ return { ok:false, erreur: e.message }; }
}
function verifierEval(w, intitule, code, juge, detail){
  const r = evaluer(w, code);
  if(!r.ok){ verifier(intitule, false, 'erreur JavaScript : ' + r.erreur); return undefined; }
  /* Beaucoup de ces contrôles rendent une CHAÎNE qui décrit ce qui cloche, et
     rendent '' quand tout va bien. Sans cette ligne, leur échec s'affichait
     nu — « ✗ » et rien d'autre —, et il fallait relire le contrôle pour savoir
     lequel de ses bords avait cédé. */
  const ok = juge ? juge(r.valeur) : r.valeur === true;
  verifier(intitule, ok, detail || (!ok && typeof r.valeur==='string' && r.valeur ? r.valeur : undefined));
  return r.valeur;
}
/* Même chose pour un code qui rend une promesse — la pause et la fin de test en
   sont, et il faut les attendre pour savoir ce qu'elles ont vraiment fait. */
function evalPromis(w, code, suite){
  const r = evaluer(w, code);
  if(!r.ok) return suite({ ok:false, erreur: r.erreur });
  Promise.resolve(r.valeur).then(v => suite({ ok:true, valeur:v }),
                                 e => suite({ ok:false, erreur: e && e.message ? e.message : String(e) }));
}

/* Corps EXACT d'une fonction : accolades appariées, en sautant tout ce qui n'en
   est pas — chaînes, gabarits et leurs ${}, commentaires, expressions
   régulières.

   Deux bornes approchées ont été essayées avant celle-ci, et chacune a laissé
   passer une panne. « Jusqu'à la déclaration suivante » absorbait le code
   intercalé : une fonction d'une ligne emportait jusqu'à 180 lignes de la
   section voisine, et un commentaire y mentionnant showResults faisait entrer
   une fonction innocente dans le lot des fins de test. « Jusqu'à la première
   accolade en colonne 0 » coupait au beau milieu d'un gabarit contenant du CSS,
   escamotant la fin de test qui suivait dans le même corps. Approximer la borne
   ne marche pas : il faut lire le code. */
function finChaine(s, i, guillemet){
  for(i++; i < s.length; i++){
    if(s[i] === '\\'){ i++; continue; }
    if(s[i] === guillemet) return i;
    if(s[i] === '\n' && guillemet !== '`') return i;      /* chaîne non terminée : on ne s'égare pas */
  }
  return s.length;
}
function finGabarit(s, i){
  for(i++; i < s.length; i++){
    if(s[i] === '\\'){ i++; continue; }
    if(s[i] === '`') return i;
    if(s[i] === '$' && s[i+1] === '{'){                    /* ${ … } peut contenir de tout */
      let n = 1; i += 2;
      for(; i < s.length && n > 0; i++){
        const saut = sauter(s, i);                         /* y compris une expression régulière : le
                                                              CSV écrit `"${v.replace(/"/g,'""')}"` */
        if(saut >= 0){ i = saut; continue; }
        if(s[i] === '{') n++;
        else if(s[i] === '}') n--;
      }
      i--;
    }
  }
  return s.length;
}
/* Un « / » ouvre une expression régulière quand il ne peut pas être une division :
   après un opérateur, une parenthèse ouvrante, une virgule, un début de bloc —
   mais aussi après une flèche et après un mot-clé. « return /…/ » figure dix fois
   dans le code livré : le prendre pour une division fait lire le motif comme du
   code, et une accolade y suffirait à fausser tout le découpage. */
const MOTS_AVANT_REGEX = /^(return|typeof|case|in|of|new|delete|void|yield|do|else|instanceof|await|throw)$/;
function ouvreRegex(s, i){
  let j = i - 1;
  while(j >= 0 && ' \t\n\r'.indexOf(s[j]) >= 0) j--;
  if(j < 0) return true;
  const c = s[j];
  if(c === '>' && s[j-1] === '=') return true;                     /* x => /re/ */
  if((c === '+' || c === '-') && s[j-1] === c) return false;       /* i++ / 2 : une division */
  if(/[A-Za-z_$]/.test(c)){
    let k = j;
    while(k >= 0 && /[\w$]/.test(s[k])) k--;
    return MOTS_AVANT_REGEX.test(s.slice(k + 1, j + 1));
  }
  return '(,=:[!&|?{};+-*%~^'.indexOf(c) >= 0;
}
function finRegex(s, i){
  let classe = false;
  for(i++; i < s.length; i++){
    if(s[i] === '\\'){ i++; continue; }
    if(s[i] === '[') classe = true;
    else if(s[i] === ']') classe = false;
    else if(s[i] === '/' && !classe) return i;
    else if(s[i] === '\n') return i;
  }
  return s.length;
}
/* Indice du dernier caractère du littéral ou commentaire ouvert en i, ou -1 si i
   n'ouvre rien de tel. Même logique pour le corps d'une fonction et pour
   l'intérieur d'un ${ } : c'est en la dédoublant que le premier jet s'est perdu
   sur exportCSV. */
function sauter(s, i){
  const c = s[i];
  if(c === '/' && s[i+1] === '/'){ const f = s.indexOf('\n', i); return f < 0 ? s.length : f; }
  if(c === '/' && s[i+1] === '*'){ const f = s.indexOf('*/', i+2); return f < 0 ? s.length : f + 1; }
  if(c === '/' && ouvreRegex(s, i)) return finRegex(s, i);
  if(c === '"' || c === "'") return finChaine(s, i, c);
  if(c === '`') return finGabarit(s, i);
  return -1;
}
function corpsFonctions(source, motif){
  return [...source.matchAll(motif)].map(m => {
    /* La signature d'abord. Une accolade peut s'y trouver — paramètre déstructuré
       « ({a,b}) », valeur par défaut « (o={}) », rappel « (f=()=>{}) » — et serait
       prise pour le début du corps : la fonction disparaîtrait du lot en silence. */
    let i = m.index + m[0].length - 1;                 /* la parenthèse ouvrante */
    let p = 0;
    for(; i < source.length; i++){
      const saut = sauter(source, i);
      if(saut >= 0){ i = saut; continue; }
      if(source[i] === '(') p++;
      else if(source[i] === ')'){ p--; if(p === 0){ i++; break; } }
    }
    i = source.indexOf('{', i);
    if(i < 0) return { nom: m[1], debut: m.index, texte: m[0] };
    let n = 0, fin = -1;
    for(; i < source.length; i++){
      const saut = sauter(source, i);
      if(saut >= 0){ i = saut; continue; }
      if(source[i] === '{') n++;
      else if(source[i] === '}'){ n--; if(n === 0){ fin = i; break; } }
    }
    return { nom: m[1], debut: m.index, texte: source.slice(m.index, fin >= 0 ? fin + 1 : source.length) };
  });
}

/* Dernier filet : une exception échappée (rappel de setTimeout, promesse) doit
   faire échouer le banc proprement, pas afficher une pile et sortir sans verdict. */
process.on('uncaughtException', e => {
  console.log('\n   ✗ erreur JavaScript non rattrapée  → ' + e.message);
  console.log('\n' + '─'.repeat(58));
  console.log('✗ Le banc s\'est interrompu sur ' + CIBLE + '. NE PAS mettre en ligne.');
  process.exit(1);
});

/* ---------- 1. Structure ---------- */
function structure(){
  titre('1. STRUCTURE DU FICHIER');
  const s = lire(CIBLE);
  const ligneDe = i => s.slice(0, i).split('\n').length;

  /* sans lui, le navigateur passe en mode quirks et la mise en page casse sur mobile */
  verifier('<!DOCTYPE html> en première ligne', /^<!DOCTYPE html>/i.test(s));

  /* Supabase renvoie ses erreurs sans lever d'exception : tout appel doit les
     examiner. Deux façons de passer à côté, et le banc ne voyait que la
     première — l'insertion de la note de fin de test échappait au compte. */
  const sansError = [...s.matchAll(/const \{data(?::[A-Za-z_$][\w$]*)?\}\s*=\s*await sb/g)].map(m => ligneDe(m.index));
  const nus = [];
  [...s.matchAll(/await sb\./g)].forEach(m => {
    const avant = s.slice(Math.max(0, m.index - 60), m.index).replace(/\s+$/, '');
    if(!/=$/.test(avant)) nus.push(ligneDe(m.index));       /* appel dont le retour n'est même pas recueilli */
  });
  const fautifs = [...new Set([...sansError, ...nus])].sort((a,b) => a-b);
  verifier('chaque appel Supabase examine error', fautifs.length === 0,
    fautifs.length + ' appel(s) l’ignorent, ligne(s) ' + fautifs.join(', '));

  /* les colonnes integer refusent une durée décimale, et le refus est muet */
  const durees = [...s.matchAll(/const durationSec\s*=\s*([^;\n]+);/g)]
    .filter(m => !/Math\.round/.test(m[1])).map(m => ligneDe(m.index));
  verifier('les durées partent arrondies vers la base', durees.length === 0,
    durees.length + ' durée(s) décimale(s), ligne(s) ' + durees.join(', '));

  /* Un double-clic sur le bouton de la dernière question lançait deux fois la fin
     du test : deux lignes en base pour le même exercice. Et le brouillon de
     reprise était supprimé AVANT l'enregistrement — un échec faisait perdre à la
     fois la note et la session reprenable. */
  /* Une fin de test se reconnaît à ce qu'elle fait — elle affiche l'écran de
     résultats — et non à son nom. Le premier jet de ce contrôle filtrait sur le
     préfixe « finish » : tmFinir(), qui termine les deux exercices de tables,
     lui était invisible et restait sans verrou. C'est le piège « portage par
     filtre de nom » du CLAUDE.md, retombé dans le banc lui-même.
     Le deuxième jet ne cherchait que « showResults( » : c'était un pivot, pas un
     élargissement — il gagnait tmFinir mais perdait finishParcours(), qui pose
     son écran à la main et finit par show('results').
     Le critère retenu ne dépend donc plus de l'affichage seul : est une fin de
     test toute fonction qui ÉCRIT une note finale, ou qui affiche l'écran de
     résultats de l'une ou l'autre façon. Seules les fonctions qui écrivent un
     brouillon ou une note partielle sont écartées, nommément — elles sont peu
     nombreuses et stables. Compte obtenu : 15 en Première, 4 en Seconde, 1 en
     Terminale, soit exactement le nombre de sites d'enregistrement final. */
  /* HORS_FIN reste un filtre par nom, mais assumé : il ne porte que sur les
     quelques fonctions qui écrivent un brouillon ou une note partielle. Une
     future fonction qui insérerait dans la table sans terminer d'exercice — une
     saisie de note à la main par le professeur, par exemple — serait signalée à
     tort et devrait être ajoutée ici. C'est le compromis voulu : un faux positif
     est bruyant et bloquant, donc quelqu'un y regarde ; un faux négatif est
     muet, et c'est lui qui met une panne en ligne. */
  /* Le banc contrôle son propre découpage. Un corps tronqué ne compile pas : il
     se signale de lui-même, quelle que soit la construction qui l'a causé — y
     compris celles auxquelles personne n'a pensé. Quatre tours de correction du
     critère « fin de test » ont montré que c'est le seul garde-fou qui tienne :
     à chaque fois, une construction plausible faisait disparaître une fonction
     du lot, en silence, et le banc annonçait « peut être mis en ligne ». */
  const toutesFonctions = corpsFonctions(s, /^(?:async )?function ([A-Za-z_$][\w$]*)\s*\(/gm);
  const malDecoupees = toutesFonctions.filter(f => {
    if(!/\}\s*$/.test(f.texte)) return true;
    try { new vm.Script(f.texte); return false; } catch(e){ return true; }
  }).map(f => f.nom);
  verifier('chaque corps de fonction est découpé entier', malDecoupees.length === 0,
    malDecoupees.length + ' mal découpée(s) : ' + malDecoupees.slice(0, 6).join(', '));

  /* Le contrôle précédent valide ce que le motif a trouvé. Celui-ci vérifie qu'il
     a tout trouvé — et c'est la couverture, pas le découpage, qui a échoué quatre
     fois. Deux modifications banales suffisent à faire sortir une fin de test du
     lot ET du contrôle de découpage : l'indenter de deux espaces, ou l'écrire
     « const finX = async function(…) ». Plutôt que d'énumérer les formes de
     déclaration — un jeu qu'on perd toujours — on énonce la propriété qui compte :
     tout endroit qui écrit une note ou affiche les résultats doit se trouver dans
     une fonction que le banc sait lire. Peu importe comment elle est déclarée. */
  const portees = toutesFonctions.map(f => [f.debut, f.debut + f.texte.length]);
  const horsPortee = [];
  [/enregistrerResultat\s*\(/g, new RegExp('from\\(\'' + (P.tableResultats || '\\u0000') + '\'\\)\\.insert', 'g'),
   /showResults\s*\(/g, /show\('results'\)/g].forEach(re => {
    for(const m of s.matchAll(re)){
      if(!portees.some(([a, b]) => m.index >= a && m.index < b)) horsPortee.push(ligneDe(m.index));
    }
  });
  verifier('chaque enregistrement de note est dans une fonction que le banc voit',
    horsPortee.length === 0,
    horsPortee.length + ' hors de portée, ligne(s) ' + [...new Set(horsPortee)].sort((a,b)=>a-b).join(', '));

  /* HORS_FIN reste un filtre par nom, mais assumé : il ne porte que sur les
     quelques fonctions qui écrivent un brouillon ou une note partielle. Une
     future fonction qui insérerait dans la table sans terminer d'exercice — une
     saisie de note à la main par le professeur, par exemple — serait signalée à
     tort et devrait être ajoutée ici. C'est le compromis voulu : un faux positif
     est bruyant et bloquant, donc quelqu'un y regarde ; un faux négatif est
     muet, et c'est lui qui met une panne en ligne. */
  const HORS_FIN = ['showResults','doRecoverySave','enregistrerNotePartielle','enregistrerResultat','clearRecovery','autoSave'];
  /* Sans ce champ, la moitié « écrit une note » du critère devenait
     from('undefined').insert — elle ne trouvait plus rien, en silence. */
  verifier('le profil déclare la table de résultats du niveau', !!P.tableResultats,
    'tableResultats manque dans tests/profils.js');
  const ecritNote = new RegExp('enregistrerResultat\\(|from\\(\'' + (P.tableResultats || '\\u0000') + '\'\\)\\.insert');
  const fins = toutesFonctions
    .filter(f => HORS_FIN.indexOf(f.nom) < 0
              && (ecritNote.test(f.texte) || f.texte.includes('showResults(') || /show\('results'\)/.test(f.texte)));
  if(fins.length){
    const sansVerrou = fins.filter(f => !/^(?:async )?function [A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{\s*\n?\s*if\(!debutFin\(\)\)\s*return;/.test(f.texte)).map(f => f.nom);
    verifier('chaque fin de test est protégée du double-clic', sansVerrou.length === 0,
      sansVerrou.join(', ') + ' — « if(!debutFin()) return; » manque en première ligne');

    const tropTot = fins.filter(f => {
      const efface = f.texte.indexOf('clearRecovery(');
      if(efface < 0) return false;
      const enregistre = Math.min(...['.insert(', 'enregistrerResultat(']
        .map(x => f.texte.indexOf(x)).filter(i => i >= 0).concat([Infinity]));
      return enregistre === Infinity ? false : efface < enregistre;
    }).map(f => f.nom);
    verifier('le brouillon n’est effacé qu’après l’enregistrement', tropTot.length === 0,
      tropTot.join(', ') + ' — clearRecovery() passe avant la note');
  }

  /* Le bouton « Poser une question a l'IA » est offert des l'entrainement, alors
     que le Conseil est reserve au soutien — note moins cher. Si la mission
     envoyee au modele emportait l'enonce et les reponses de l'eleve, elle
     ouvrirait par une autre porte l'aide que le bareme reserve au soutien. */
  if(P.missionSansReponses){
    const f = toutesFonctions.find(x => x.nom === P.missionSansReponses);
    const fuite = f ? /ctxVisible\s*\(|conseilCtxCourant\s*\(/.test(f.texte) : false;
    verifier('la question à l’IA n’emporte pas l’énoncé ni les réponses de l’élève',
      !!f && !fuite, f ? 'la mission appelle le contexte de l’exercice' : P.missionSansReponses + ' introuvable');
  }

  const styles = [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  styles.forEach((css, i) => {
    const o = (css.match(/\{/g)||[]).length, f = (css.match(/\}/g)||[]).length;
    verifier('bloc <style> n°' + (i+1) + ' équilibré', o === f, o + ' ouvrantes / ' + f + ' fermantes');
  });

  const scripts = [...s.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.forEach((js, i) => {
    const f = path.join(os.tmpdir(), 'ctrl' + i + '.js');
    fs.writeFileSync(f, js);
    let ok = true, err = '';
    try { execFileSync('node', ['--check', f], { stdio:'pipe' }); }
    catch(e){ ok = false; err = String(e.stderr).split('\n')[1] || ''; }
    fs.unlinkSync(f);
    verifier('script n°' + (i+1) + ' syntaxiquement valide', ok, err);
  });

  const ecrans = new Set([...s.matchAll(/<section class="screen" id="scr-([a-z0-9-]+)"/g)].map(m => m[1]));
  const demandes = new Set([...s.matchAll(/show\('([a-z0-9-]+)'\)/g)].map(m => m[1]));
  const manquants = [...demandes].filter(x => !ecrans.has(x));
  verifier('chaque show() vise un écran existant', manquants.length === 0, manquants.join(', '));

  /* ---- Tout écran d'exercice figure dans testScreens ----------------------
     testScreens est la liste que show() consulte : elle décide du plein écran,
     du titre de l'exercice, du bouton de pause — et c'est elle que le contrôle
     de l'encadré « Énoncé », plus bas, parcourt. Un écran d'exercice absent de
     testScreens n'y était donc pas SIGNALÉ : il sortait du champ du banc, qui
     restait vert sur un exercice qu'il ne regardait plus. C'est le point 5 des
     quinze branchements d'un nouvel exercice, et l'oublier ne coûtait rien.
     Les écrans de MENU sont déclarés dans tests/profils.js, et tout le reste
     doit être un écran d'exercice. Déclarer en négatif est délibéré : ajouter
     un exercice ne demande alors aucune ligne au fichier de profils. L'inverse
     — déclarer les exercices — aurait fait revenir l'oubli par la fenêtre. */
  if(P.ecransHorsExercice){
    const brutTS = (s.match(/const testScreens\s*=\s*\[([^\]]*)\]/) || [])[1] || '';
    const listeTS = [...brutTS.matchAll(/'([^']+)'/g)].map(m => m[1]);
    const menus = new Set(P.ecransHorsExercice);
    const oublies = [...ecrans].filter(e => !menus.has(e) && !listeTS.includes(e));
    verifier('chaque écran d\'exercice figure dans testScreens', oublies.length === 0,
      oublies.join(', ') + ' — soit un exercice hors du champ du banc, soit un écran de menu à déclarer dans tests/profils.js');
    const fantomes = listeTS.filter(e => !ecrans.has(e));
    verifier('testScreens ne nomme aucun écran disparu', fantomes.length === 0, fantomes.join(', '));

    /* ---- La réserve du bas, sous les commandes flottantes ---------------
       #testCtrls — « Pause » et « Abandonner » — est en position fixe, en bas
       à droite de l'écran. Sans une réserve au bas de la carte, il recouvre la
       dernière ligne de l'exercice : la case y est toujours là, mais l'élève ne
       peut plus ni la lire ni la toucher. Rien ne casse, aucune erreur n'est
       levée, et cela ne se voit qu'en regardant l'écran — c'est exactement ce
       qui était arrivé à l'exercice en colonnes.
       La liste est écrite à la main en CSS, à côté de testScreens, sans que
       rien ne les relie : chacun des trois fichiers avait fini par diverger.
       La Seconde était le cas extrême — sa règle nommait huit écrans de la
       Terminale, dont aucun n'existe chez elle. */
    const reserve = new Set();
    for(const m of s.matchAll(/(#scr-[^{}]*?)\{([^{}]*)\}/g)){
      const pb = /padding-bottom\s*:\s*(\d+)px/.exec(m[2]);
      if(!pb || parseInt(pb[1], 10) < 60) continue;
      for(const id of m[1].matchAll(/#scr-([a-z0-9-]+)/g)) reserve.add(id[1]);
    }
    const decouverts = listeTS.filter(e => !reserve.has(e));
    verifier('chaque écran d\'exercice réserve la place des commandes flottantes',
      decouverts.length === 0,
      decouverts.map(e => '#scr-' + e).join(', ') + ' — le bas de la carte passe sous #testCtrls');
    const enTrop = [...reserve].filter(e => !ecrans.has(e));
    verifier('la réserve ne vise aucun écran inexistant', enTrop.length === 0,
      enTrop.map(e => '#scr-' + e).join(', '));
  } else {
    ignorer('chaque écran d\'exercice figure dans testScreens',
      'ce niveau n\'a pas déclaré ses écrans de menu (voir tests/profils.js)');
  }

  /* ---- L'encadré « Énoncé » ----------------------------------------------
     Demandé pour TOUS les exercices. Un exercice ajouté demain sans énoncé
     encadré ne lèverait aucune erreur : il serait simplement moins lisible, et
     personne ne s'en apercevrait avant qu'un élève s'y perde. C'est
     exactement le mode de panne que ce fichier existe pour attraper.
     La liste de référence est « testScreens », celle que show() consulte —
     pas une liste tenue à la main ici, qui divergerait. */
  if(P.enonce){
    const CL = P.enonce.classes;
    verifier('le CSS pose un cadre autour de l\'énoncé',
      new RegExp('\\.(?:' + CL.join('|') + ')[^{]*\\{[^}]*border\\s*:\\s*\\d').test(s),
      'sans cadre, l\'énoncé se confond avec le reste de la page');
    verifier('l\'encadré porte l\'étiquette « Énoncé »',
      /::before[^{]*\{[^}]*content\s*:\s*'Énoncé'/.test(s),
      'le cadre seul ne dit pas à l\'élève ce qu\'il encadre');
    /* Le vert veut dire « juste » partout ailleurs dans ces pages. Un énoncé
       sur fond vert se lit comme une réponse déjà validée — c'était le cas en
       Terminale, et c'est le genre de détail qu'aucune relecture n'attrape. */
    const regleEnonce = (s.match(new RegExp('\\.(?:' + CL.join('|') + ')[^{]*\\{[^}]*\\}', 'g')) || []).join(' ');
    verifier('l\'énoncé n\'emprunte pas le vert qui veut dire « juste »',
      !/green/.test(regleEnonce), 'fond vert : l\'élève lit une réponse validée');

    const brut = (s.match(/const testScreens\s*=\s*\[([^\]]*)\]/) || [])[1] || '';
    const ecransTest = [...brut.matchAll(/'([^']+)'/g)].map(m => m[1]);
    verifier('la liste des écrans d\'exercice est lisible par le banc',
      ecransTest.length > 0, 'testScreens introuvable : le contrôle suivant ne mesure rien');

    const bornes = [...s.matchAll(/<section class="screen"[^>]*id="(scr-[^"]+)"/g)];
    const blocDe = id => {
      const k = bornes.findIndex(b => b[1] === id);
      if(k < 0) return null;
      return s.slice(bornes[k].index, k + 1 < bornes.length ? bornes[k+1].index : s.length);
    };
    /* On lit les classes jeton par jeton : « enonce-suite » contient
       « enonce », et une comparaison par sous-chaîne compterait la suite d'un
       énoncé comme un énoncé de plus. */
    const enoncesDe = bloc => [...bloc.matchAll(/class="([^"]*)"/g)]
      .map(m => m[1].split(/\s+/))
      .filter(t => t.some(c => CL.includes(c)));

    const sansEncadre = [], doubleEtiquette = [], introuvables = [];
    ecransTest.forEach(nom => {
      if(P.enonce.ardoise.includes(nom)) return;
      const bloc = blocDe('scr-' + nom);
      if(!bloc){ introuvables.push(nom); return; }
      const trouves = enoncesDe(bloc);
      if(trouves.length === 0) sansEncadre.push(nom);
      if(trouves.filter(t => !t.includes('enonce-suite')).length > 1) doubleEtiquette.push(nom);
    });
    verifier('chaque écran d\'exercice porte un énoncé encadré',
      sansEncadre.length === 0 && introuvables.length === 0,
      [sansEncadre.length ? 'sans encadré : ' + sansEncadre.join(', ') : '',
       introuvables.length ? 'écran absent : ' + introuvables.join(', ') : ''].filter(Boolean).join(' — '));
    /* Un écran qui affiche son énoncé en deux temps (« a) … » puis « b) … »)
       montrerait deux fois l'étiquette, comme s'il y avait deux exercices.
       La suite se déclare avec « enonce-suite ». */
    verifier('l\'étiquette « Énoncé » n\'apparaît qu\'une fois par écran',
      doubleEtiquette.length === 0, doubleEtiquette.join(', '));

    /* LE CONTRÔLE QUI A SERVI. Les deux précédents ne lisent que le HTML écrit
       à la main. Or plusieurs énoncés sont posés par JavaScript, dans des
       chaînes — et le contrôle par écran ne les voit pas. Deux défauts sont
       passés ainsi, tous deux visibles à l'écran et invisibles au banc :
       une légende de tableau (« Tableau de variation de f : ») qui portait la
       classe des énoncés et s'est retrouvée étiquetée « Énoncé », et la partie
       a) d'un énoncé en deux temps, qui affichait une deuxième étiquette sur le
       même écran.
       Celui-ci compte les occurrences dans TOUT le fichier, chaînes comprises,
       et exige l'égalité : autant d'énoncés étiquetés que d'écrans d'exercice
       qui en attendent un. Une classe d'énoncé posée sur autre chose fait donc
       rougir le banc, où qu'elle soit écrite. */
    const occurrences = [...s.matchAll(/class="([^"]*)"/g)]
      .map(m => ({ toks: m[1].split(/\s+/), i: m.index }))
      .filter(o => o.toks.some(c => CL.includes(c)));
    const primaires = occurrences.filter(o => !o.toks.includes('enonce-suite'));
    const attendus = ecransTest.filter(e => !P.enonce.ardoise.includes(e));
    /* Pour désigner le coupable et non les vingt-trois innocents : les énoncés
       du HTML des écrans sont, à ce jour, tous légitimes — un par écran. Ceux
       qui sortent d'une chaîne JavaScript sont les seuls à vérifier. */
    const zonesJS = [...s.matchAll(/<script[\s\S]*?<\/script>/g)]
      .map(m => [m.index, m.index + m[0].length]);
    const parJS = primaires.filter(o => zonesJS.some(z => o.i > z[0] && o.i < z[1]));
    verifier('autant d\'énoncés étiquetés que d\'écrans qui en attendent un ('
      + primaires.length + '/' + attendus.length + ')',
      primaires.length === attendus.length,
      primaires.length > attendus.length
        ? (parJS.length
            ? 'posé(s) par JavaScript, ligne(s) ' + parJS.map(o => ligneDe(o.i)).join(', ')
              + ' : si c\'est la suite d\'un énoncé, ajouter « enonce-suite » ; '
              + 'si c\'est une légende, employer une autre classe'
            : 'un écran porte plus d\'un énoncé étiqueté')
        : 'un écran d\'exercice n\'a pas d\'énoncé étiqueté');
    if(P.enonce.ardoise.length)
      console.log('   · énoncé porté par l\'ardoise, sans encadré : '
        + P.enonce.ardoise.map(e => 'scr-' + e).join(', '));
  }

  const principal = scripts.reduce((a,b) => a.length > b.length ? a : b, '');
  const definis = new Set();
  principal.split('\n').forEach(l => {
    const m = l.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/) || l.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/);
    if(m) definis.add(m[1]);
  });
  const html = s.replace(/<script[\s\S]*?<\/script>/g, '');
  const appeles = new Set([...html.matchAll(/on(?:click|mousedown|change|input)="([A-Za-z_$][\w$]*)\(/g)].map(m => m[1]));
  const orphelins = [...appeles].filter(f => !definis.has(f) && f !== 'if');
  verifier('chaque bouton appelle une fonction définie', orphelins.length === 0, orphelins.join(', '));

  /* Une chaîne posée dans un attribut onclick traverse DEUX analyseurs :
     l'analyseur HTML décode les entités AVANT que JavaScript ne voie le texte.
     esc() y est donc inopérant — il écrit &#39;, l'analyseur HTML le rend en ',
     et l'apostrophe ferme la chaîne JavaScript. Le prénom étant choisi
     librement par l'élève à la création de son compte, « O'Brien » suffisait à
     tuer le bouton du professeur, et « ',alert(1),' » y exécutait du code.
     Le contrôle porte sur la propriété, pas sur les emplacements connus : toute
     interpolation placée entre apostrophes dans un attribut d'événement doit
     passer par escJS(), y compris celles qui seront écrites demain. */
  const nonEchappes = [];
  for(const a of s.matchAll(/on[a-z]+="[^"]*"/g)){
    for(const m of a[0].matchAll(/'\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'/g)){
      if(!/^\s*escJS\(/.test(m[1])) nonEchappes.push(ligneDe(a.index) + ' : ' + m[1].trim());
    }
  }
  verifier('toute donnée mise dans un attribut d’événement passe par escJS',
    nonEchappes.length === 0,
    nonEchappes.length + ' interpolation(s) non échappée(s) — ' + nonEchappes.slice(0, 4).join(' , '));

  /* Le mot de passe du tableau de bord était écrit en clair ligne 10, et
     comparé dans le navigateur. « Afficher la source » ouvrait donc les notes
     de la classe, les codes, la réinitialisation, la suppression d'élèves et
     les verrous d'évaluation. */
  verifier('le mot de passe du professeur n’est plus dans la page',
    !/MOT_DE_PASSE_PROF/.test(s), 'la constante est encore là');
  const tl = toutesFonctions.find(f => f.nom === 'teacherLogin');
  verifier('la connexion du professeur est vérifiée par le serveur',
    !!tl && /sb\.auth\.signInWithPassword/.test(tl.texte),
    tl ? 'teacherLogin ne demande son avis à personne' : 'teacherLogin introuvable');

  /* select('*') sur la table des élèves rapportait la colonne des codes : tous
     ceux de la classe, lisibles dans l'onglet Réseau. La colonne a disparu de
     la base, mais rien n'empêche d'y remettre un jour une donnée sensible —
     on ne redemande donc que ce qui s'affiche. */
  const litEleves = [...s.matchAll(new RegExp(
    "from\\('" + (P.tableEleves || '\\u0000') + "'\\)\\s*\\.select\\(\\s*'([^']*)'", 'g'))];
  const enEntier = litEleves.filter(m => m[1].trim() === '*').map(m => ligneDe(m.index));
  verifier('la table des élèves n’est jamais demandée en entier',
    !!P.tableEleves && enEntier.length === 0,
    !P.tableEleves ? 'tableEleves manque dans tests/profils.js'
                   : enEntier.length + ' select(*), ligne(s) ' + enEntier.join(', '));

  /* L'adresse du compte d'un élève est dérivée de son identifiant. Ce domaine
     est écrit à DEUX endroits que rien ne relie : cette page et la fonction
     Edge. S'ils divergent, les comptes créés d'un côté deviennent introuvables
     de l'autre — et l'élève reçoit « Code incorrect » avec le bon code. Aucune
     erreur, aucune trace : exactement le genre de panne que ce banc existe pour
     attraper. */
  /* L'adresse du compte d'un élève ne doit JAMAIS être dérivée de l'identifiant
     de sa ligne : « id » est un uuid en Terminale et en Seconde, mais un bigint
     en Première. Le premier jet le faisait, et cassait la création de compte
     sur ce seul niveau — sans qu'aucun banc ne le voie, parce que le double en
     mémoire accepte n'importe quel type et que la structure réelle n'avait
     jamais été relevée. Elle l'est maintenant : tests/base-avant.sql. */
  const surId = [...s.matchAll(/courrielDe\(([^)]*)\)/g)]
    .filter(m => /\bid\b/.test(m[1]) && !/\bcle\b/.test(m[1]))
    .map(m => ligneDe(m.index) + ' : courrielDe(' + m[1].trim() + ')');
  verifier('l’adresse du compte est dérivée de la clé, jamais de l’identifiant de ligne',
    surId.length === 0, surId.join(' , '));

  /* Et l'application ne doit pas écrire « id » elle-même : la base le produit,
     ce qui la rend indifférente au type. */
  const ecritId = [...s.matchAll(new RegExp(
    "from\\('" + (P.tableEleves || '\u0000') + "'\\)\\s*\\.insert\\(\\{([^}]*)\\}", 'g'))]
    .filter(m => /(^|[,{\s])id\s*[,:}]/.test(m[1]))
    .map(m => ligneDe(m.index));
  verifier('la création d’un élève laisse la base produire l’identifiant',
    ecritId.length === 0, 'ligne(s) ' + ecritId.join(', '));

  const domPage = (s.match(/const DOMAINE_COMPTES\s*=\s*'([^']+)'/) || [])[1];
  let domEdge;
  try{
    domEdge = (fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/admin-eleve/index.ts'), 'utf8')
      .match(/const DOMAINE\s*=\s*'([^']+)'/) || [])[1];
  }catch(e){ domEdge = undefined; }
  verifier('le domaine des comptes est le même dans la page et dans la fonction Edge',
    !!domPage && domPage === domEdge,
    'page : ' + (domPage || '(absent)') + ' — fonction Edge : ' + (domEdge || '(absent)'));

  /* Supabase refuse tout mot de passe de moins de 6 caractères : le code d'un
     élève en fait 4, et l'application envoie donc une chaîne dérivée. Le
     préfixe qui sert à la dériver vit lui aussi à DEUX endroits que rien ne
     relie — cette page et la fonction Edge, qui pose les codes que le
     professeur distribue. S'ils divergent, le code affiché au professeur ne
     fonctionne pas, et personne ne voit d'erreur nulle part. */
  const prefPage = (s.match(/const PREFIXE_CODE\s*=\s*'([^']*)'/) || [])[1];
  let prefEdge;
  try{
    prefEdge = (fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/admin-eleve/index.ts'), 'utf8')
      .match(/const PREFIXE_CODE\s*=\s*'([^']*)'/) || [])[1];
  }catch(e){ prefEdge = undefined; }
  verifier('le préfixe du code est le même dans la page et dans la fonction Edge',
    prefPage !== undefined && prefPage === prefEdge,
    'page : ' + JSON.stringify(prefPage) + ' — fonction Edge : ' + JSON.stringify(prefEdge));

  /* La LONGUEUR du code vit elle aussi à deux endroits : la page l'exige de
     l'élève qui choisit le sien, la fonction Edge la produit pour ceux que le
     professeur distribue. Si elles divergent, une moitié de la classe reçoit
     des codes que l'autre moitié ne pourrait pas saisir — et rien ne le dit. */
  const nPage = parseInt((s.match(/const CHIFFRES_CODE\s*=\s*(\d+)/) || [])[1], 10);
  let nEdge;
  try{
    nEdge = parseInt((fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/admin-eleve/index.ts'), 'utf8')
      .match(/const CHIFFRES_CODE\s*=\s*(\d+)/) || [])[1], 10);
  }catch(e){ nEdge = undefined; }
  verifier('la longueur du code est la même dans la page et dans la fonction Edge',
    !!nPage && nPage === nEdge, 'page : ' + nPage + ' — fonction Edge : ' + nEdge);

  /* Le contrôle ci-dessus compare deux FICHIERS du dépôt. Il ne voit pas ce qui
     est réellement déployé chez Supabase : la fonction Edge se déploie à la
     main, et peut donc rester en arrière sans que rien ne le signale. C'est
     arrivé — le professeur a reçu des codes à 4 chiffres après le passage à 6.
     Seule la page peut s'en apercevoir, en regardant les codes qu'elle reçoit. */
  const veille = [...s.matchAll(/String\(data\.code\)\.length\s*!==\s*CHIFFRES_CODE/g)].length;
  verifier('la page s’aperçoit qu’une fonction Edge déployée est restée en arrière',
    veille === 2, veille + ' vérification(s) au lieu de 2 (nouveau code, ajout)');

  /* Et les champs de saisie doivent laisser entrer cette longueur-là : un
     maxlength resté à 4 tronquerait silencieusement un code à 6 chiffres, et
     l'élève lirait « Code incorrect » avec le bon code. */
  const champs = [...s.matchAll(/<input[^>]*id="(loginPin|newPin|newPin2)"[^>]*>/g)];
  const troples = champs.filter(m => {
    const max = (m[0].match(/maxlength="(\d+)"/) || [])[1];
    return !max || parseInt(max, 10) < nPage;
  }).map(m => m[1]);
  verifier('les champs de saisie acceptent un code entier',
    champs.length === 3 && troples.length === 0,
    champs.length !== 3 ? champs.length + ' champ(s) trouvé(s) au lieu de 3'
                        : 'trop court(s) : ' + troples.join(', '));

  /* L'ÉLÈVE DOIT ÊTRE PRÉVENU DE NOTER SON CODE, AUX DEUX ENDROITS où il s'en
     donne un : la création de compte, et le changement imposé après un code
     provisoire (décision de Turquet, août 2026). N'en couvrir qu'un seul ne
     couvre rien — un code oublié se perd aussi bien dans un cas que dans
     l'autre, et c'est le second qui arrive le plus souvent, précisément parce
     que l'élève avait déjà oublié le premier.
     On exige la phrase ET sa mise en évidence : posée dans une « note » grise
     comme les autres, elle se lirait comme une remarque de bas de page. */
  const PHRASE = /Note ton code dans le carnet de liaison/;
  const avert = (s.match(/<p class="avert-code">([^<]*)<\/p>/) || [])[1] || '';
  verifier('la création de compte prévient de noter le code, bien en évidence',
    PHRASE.test(avert) && /class="avert-code"/.test(s) && /\.avert-code\{/.test(s),
    !/class="avert-code"/.test(s) ? 'aucun avertissement sur le formulaire'
      : (!/\.avert-code\{/.test(s) ? 'la classe .avert-code n’a aucun style — invisible'
      : 'phrase absente : ' + JSON.stringify(avert.slice(0, 60))));

  /* Et il doit se lire AVANT de valider. Posé sous le bouton « Créer mon
     compte », il était parfaitement visible — et parfaitement inutile : l'élève
     clique puis lit. Trouvé en regardant la page, pas le code. */
  const iAvert = s.indexOf('class="avert-code"');
  const iBouton = s.indexOf('onclick="creerCompte()"');
  verifier('l’avertissement se lit avant le bouton de validation',
    iAvert > 0 && iBouton > 0 && iAvert < iBouton,
    iAvert < 0 ? 'aucun avertissement' : 'l’avertissement est APRÈS le bouton');

  const impose = (s.match(/async function imposerChoixCode\(\)\{[\s\S]*?\n\}/) || [''])[0];
  const nImpose = (impose.match(new RegExp(PHRASE.source, 'gi')) || []).length;
  verifier('le changement de code imposé prévient lui aussi',
    impose !== '' && nImpose >= 1,
    impose === '' ? 'imposerChoixCode() introuvable'
                  : nImpose + ' rappel(s) dans imposerChoixCode()');

  /* Et le style doit vraiment SE VOIR : une classe qui reprendrait la couleur
     du texte courant satisferait le contrôle ci-dessus sans rien changer. */
  const regle = (s.match(/\.avert-code\{([^}]*)\}/) || [])[1] || '';
  verifier('l’avertissement est visuellement distinct du texte courant',
    /background/.test(regle) && /border/.test(regle) && /font-weight\s*:\s*[7-9]00/.test(regle),
    'règle .avert-code : ' + JSON.stringify(regle.slice(0, 70)));

  /* Et le code brut ne doit jamais partir tel quel : il serait refusé. */
  const brut = [...s.matchAll(/sb\.auth\.sign(?:Up|InWithPassword)\(\{([^}]*)\}/g)]
    .filter(m => /password\s*:\s*(pin|code)\b/.test(m[1]))
    .map(m => ligneDe(m.index));
  verifier('le code de l’élève ne part jamais brut vers Supabase',
    brut.length === 0, 'ligne(s) ' + brut.join(', ') + ' — Supabase exige 6 caractères');
}

/* ---------- 2. Démarrage ---------- */
function demarrage(suite){
  titre('2. DÉMARRAGE DE LA PAGE');
  charger(CIBLE, (w, erreurs) => {
    const reelles = erreurs.filter(e => !/Not implemented/.test(e));   /* limites de jsdom, pas de l'appli */
    verifier('aucune erreur JavaScript au chargement', reelles.length === 0, reelles.join(' | '));
    verifier('numéro de version lisible', /^\d+$/.test(String(w.eval('APP_VERSION'))), 'APP_VERSION = ' + w.eval('APP_VERSION'));
    /* testName de la Seconde renvoyait à FRAC_INFO, qui n'existe qu'en Première :
       tout identifiant hors de TESTS — un devoir pointant un exercice retiré, une
       vieille ligne de résultat — levait une ReferenceError et cassait la liste
       entière qui l'affichait. Le nom d'un exercice inconnu doit rester anodin. */
    /* show() ferme les fenetres d'aide en premier : une exception y figerait toute
       la navigation, sur l'ecran courant, sans un mot. */
    verifierEval(w, 'un incident de fenêtre d’aide ne fige pas la navigation', `(function(){
      if(typeof fermerFenetresIA!=='function') return 'sans objet';
      const vrai=fermerFenetresIA;
      fermerFenetresIA=function(){ throw new Error('incident simulé'); };
      let avant='', apres='';
      try{ show('home'); avant=((document.querySelector('.screen.on')||{}).id)||''; }catch(e){}
      try{ show('login'); apres=((document.querySelector('.screen.on')||{}).id)||''; }catch(e){}
      fermerFenetresIA=vrai;
      if(!avant) return 'le premier show() n’a rien affiché';
      return avant!==apres ? true : 'la navigation est restée sur '+avant;
    })()`, v => v === true || v === 'sans objet', undefined);
    verifierEval(w, 'les fonctions d’affichage encaissent une donnée inconnue', `(function(){
      const rate=[];
      const essais=[['testName','exercice-absent-du-registre'],['testLabel','exercice-absent-du-registre'],
                    ['testNum','exercice-absent-du-registre'],['modeName','mode-inconnu'],
                    ['testIdOf',{}],['modeOf',{}],['fmtDur',0]];
      essais.forEach(function(p){
        if(typeof window[p[0]]!=='function') return;
        try{ window[p[0]](p[1]); }catch(e){ rate.push(p[0]+' : '+e.message); }
      });
      return rate.join(' | ');
    })()`, v => v === '', 'une référence à une globale inexistante casse la liste entière qui l affiche');
    /* Le contrôle statique dit que escJS() est appelé. Celui-ci dit qu'il
       protège : on reconstruit la ligne exacte de renderRoster avec des prénoms
       hostiles, on la fait analyser par le VRAI analyseur HTML, et on clique
       dessus. Le prénom doit revenir intact au gestionnaire, et rien d'autre ne
       doit s'exécuter. Un escJS() affaibli — ou remplacé par esc() — fait virer
       ce contrôle au rouge alors que le contrôle statique, lui, reste vert. */
    verifierEval(w, 'un prénom hostile ne s’exécute pas dans le tableau du professeur', `(function(){
      if(typeof escJS!=='function') return 'escJS() manque';
      const rate=[];
      window.__injecte=0; window.__recu=null;
      window.__cible=function(id,prenom){ window.__recu=prenom; };
      ["O'Brien", "',window.__injecte=1,'", '<img src=x onerror="window.__injecte=1">',
       'Zoé"; window.__injecte=1; "', 'a\\\\b', 'saut\\nligne'].forEach(function(p){
        const d=document.createElement('div');
        d.innerHTML='<button onclick="__cible(\\''+escJS('id-1')+'\\',\\''+escJS(p)+'\\')"></button>';
        const b=d.querySelector('button');
        if(!b){ rate.push(JSON.stringify(p)+' : bouton non construit'); return; }
        window.__recu=null;
        try{ b.click(); }catch(e){ rate.push(JSON.stringify(p)+' : '+e.message); return; }
        if(window.__recu!==p) rate.push(JSON.stringify(p)+' -> reçu '+JSON.stringify(window.__recu));
      });
      if(window.__injecte) rate.push('du code injecté s’est exécuté');
      return rate.join(' | ');
    })()`, v => v === '', 'l’analyseur HTML décode l’entité avant que JavaScript ne lise la chaîne');
    verifierEval(w, 'chaque exercice de TESTS a une fonction de démarrage', `(function(){
      const sans=[];
      Object.keys(TESTS).forEach(function(id){ if(typeof TESTS[id].start!=='function') sans.push(id); });
      return sans.join(', ');
    })()`, v => v === '', 'exercice(s) sans start()');
    branchements(w);
    suite();
  });
}

/* ---------- 2 bis. Les branchements d'un nouvel exercice ------------------
   Ajouter un exercice demande une quinzaine de raccordements, énumérés dans
   CLAUDE.md. En oublier un ne provoque AUCUNE erreur : l'exercice marche, et
   c'est l'aide, la correction en direct ou la note qui manquent — chez un
   élève, un soir, sans que rien ne remonte. Cinq de ces raccordements
   n'étaient contrôlés nulle part — la place dans THEMES, la réserve du bas en
   CSS (celle-ci est plus haut, avec le reste du CSS), la correction en direct,
   les questions à l'IA, et l'identifiant de la note. Chaque contrôle a été
   éprouvé en le cassant, et trois d'entre eux ont trouvé un manque déjà en
   place : deux écrans de la Première sans réserve du bas, toute la Seconde
   dans le même cas, et trois écrans de la Terminale sans questions à l'IA. */
function branchements(w){
  const src = lire(CIBLE);

  /* ---- Le gestionnaire de mots de passe ne déborde pas sur un exercice ----
     Chrome cherche toujours l'identifiant qui accompagne un champ « password ».
     Sans balise <form>, il n'a AUCUNE frontière : il fouille le document
     entier et se rabat sur le premier champ texte venu — en l'occurrence celui
     où l'élève tape sa réponse, d'où une bulle « Gérer les mots de passe »
     posée au milieu des tables de multiplication. Le symptôme est
     intermittent, parce que Chrome refait son analyse à chaque chargement et
     ne retient pas toujours le même champ : c'est exactement le genre de panne
     qu'une relecture ne voit pas et qu'un banc doit tenir.
     « autocomplete=off » ne protège de rien ici : Chrome l'ignore
     délibérément pour son gestionnaire de mots de passe. Ce qui compte, c'est
     la frontière, l'identifiant offert dedans, et le fait qu'aucun champ
     d'exercice ne partage ce formulaire. */
  verifierEval(w, 'le gestionnaire de mots de passe ne peut pas déborder sur un exercice', `(function(){
    const vus=[];
    const mdp=Array.from(document.querySelectorAll('input[type=password]'));
    if(!mdp.length) return 'aucun champ mot de passe : le contrôle ne mesure plus rien';
    mdp.forEach(function(p){
      const nom=p.id||'(sans id)';
      if(!p.form){ vus.push(nom+' n\\'est dans aucun <form> — Chrome fouille toute la page'); return; }
      const u=p.form.querySelector('input[autocomplete=username]');
      if(!u){ vus.push(nom+' : son formulaire n\\'offre aucun identifiant, Chrome ira en chercher un ailleurs'); return; }
      if(!u.value) vus.push(nom+' : l\\'identifiant proposé est vide');
      if(getComputedStyle(u).display==='none') vus.push(nom+' : l\\'identifiant est en display:none, Chrome l\\'ignore');
    });
    /* Aucun champ d'un écran d'exercice ne doit se trouver dans un formulaire :
       c'est la moitié qui compte pour l'élève. */
    (typeof testScreens!=='undefined'?testScreens:[]).forEach(function(nom){
      const ec=document.getElementById('scr-'+nom); if(!ec) return;
      ec.querySelectorAll('input').forEach(function(i){
        if(i.form) vus.push('le champ '+(i.id||i.className)+' de l\\'écran '+nom+' est dans un formulaire');
      });
    });
    /* Un bouton sans type explicite SOUMET le formulaire qui l'entoure : la
       page se rechargerait, et la connexion serait perdue. */
    document.querySelectorAll('form button').forEach(function(b){
      if((b.getAttribute('type')||'submit')==='submit')
        vus.push('le bouton « '+(b.textContent||'').trim()+' » soumettrait son formulaire');
    });
    return vus.join(' | ');
  })()`, v => v === '', undefined);

  const kinds = (() => {
    const f = evaluer(w, 'String(afficherEcranDe)');
    if(!f.ok) return null;
    return [...String(f.valeur).matchAll(/([A-Za-z_$][\w$]*)\s*:\s*\[/g)].map(m => m[1]);
  })();

  /* ---- Tout exercice de TESTS est rangé dans un thème -------------------
     TESTS dit ce que l'exercice EST ; THEMES dit OÙ il se trouve — et rien ne
     les relie. Un exercice absent de THEMES n'apparaît ni dans le menu de
     l'élève, ni dans le tableau du professeur, ni dans le total d'un devoir :
     il existe, il démarre, et personne ne peut l'atteindre. Il n'a pas non
     plus de numéro, puisque le numéro se déduit de la position dans THEMES.
     L'inverse — un identifiant listé dans THEMES sans exercice derrière —
     laissait une carte vide dans le menu.
     C'est ce contrôle qui remplace l'ancien point « MENU » de la liste des
     branchements : cette constante ne servait plus à rien depuis que le
     tableau du professeur se construit, lui aussi, à partir de THEMES.
     Un exercice retiré du menu mais gardé dans TESTS — pour que les notes
     déjà obtenues gardent un nom — se déclare dans tests/profils.js. */
  const rangement = evaluer(w, `(function(){
    const retires=${JSON.stringify(P.horsThemes || [])};
    const dansThemes=[];
    THEMES.forEach(function(t){
      (t.sous||[]).forEach(function(st){ (st.ids||[]).forEach(function(i){ dansThemes.push(i); }); });
      (t.ids||[]).forEach(function(i){ dansThemes.push(i); });
    });
    const orphelins=Object.keys(TESTS).filter(function(i){ return dansThemes.indexOf(i)<0 && retires.indexOf(i)<0; });
    const fantomes=dansThemes.filter(function(i){ return !TESTS[i]; });
    const perimes=retires.filter(function(i){ return !TESTS[i]; });
    return [orphelins.length?'hors de tout thème : '+orphelins.join(', '):'',
            fantomes.length?'thème citant un exercice inexistant : '+fantomes.join(', '):'',
            perimes.length?'retrait déclaré dans tests/profils.js sans exercice derrière : '+perimes.join(', '):'']
           .filter(Boolean).join(' — ');
  })()`);
  verifier('chaque exercice de TESTS est rangé dans un thème',
    rangement.ok && rangement.valeur === '',
    (rangement.ok ? rangement.valeur : 'erreur JavaScript : ' + rangement.erreur)
      + ' (un exercice hors de THEMES est inatteignable et sans numéro)');

  /* ---- Le mode soutien corrige en direct sur chaque écran ---------------
     liveCheckCurrent() est le point 6 des branchements. L'oublier laisse un
     exercice où le soutien ne corrige plus rien pendant la saisie : l'élève
     coche tout, ne voit aucune couleur, et croit que l'exercice est cassé.
     La liste de référence est celle d'afficherEcranDe() — les écrans qui ont
     leur propre rendu. Un exercice qui corrige autrement se déclare dans
     tests/profils.js plutôt que d'affaiblir le contrôle pour tout le monde. */
  if(!kinds){
    ignorer('le soutien corrige en direct sur chaque écran d’exercice', 'afficherEcranDe() introuvable');
  } else if(!P.soutienEnDirect){
    ignorer('le soutien corrige en direct sur chaque écran d’exercice',
      'ce niveau ne passe pas par liveCheckCurrent() (voir tests/profils.js)');
  } else {
    const f = evaluer(w, 'String(liveCheckCurrent)');
    const corps = f.ok ? String(f.valeur) : '';
    const dispenses = P.soutienEnDirect.sans || [];
    const oublies = kinds.filter(k => dispenses.indexOf(k) < 0
      && !new RegExp('===\\s*[\'"]' + k + '[\'"]').test(corps));
    verifier('le soutien corrige en direct sur chaque écran d’exercice',
      f.ok && oublies.length === 0,
      !f.ok ? 'liveCheckCurrent() introuvable' : oublies.join(', ') + ' — absent(s) de liveCheckCurrent()');
    const inutiles = dispenses.filter(k => kinds.indexOf(k) < 0);
    verifier('aucune dispense de soutien ne survit à son écran', inutiles.length === 0,
      inutiles.join(', ') + ' — écran(s) disparu(s) : à retirer de tests/profils.js');
  }

  /* ---- Chaque écran a ses propres questions à l'IA ----------------------
     QIA_SUGG est le point 11. Sans entrée, la fenêtre « Question à l'IA »
     retombe sur QIA_SUGG.gen — deux questions passe-partout, sans rapport
     avec ce que l'élève a sous les yeux. Rien ne casse, rien ne s'affiche en
     rouge : l'aide est simplement devenue inutile pour cet exercice. Trois
     écrans de la Terminale étaient dans ce cas.
     Une clé SANS écran est licite en revanche : la Première en a une, « dimq »,
     choisie à la volée quand une question augq porte une baisse. */
  if(!kinds){
    ignorer('chaque écran d’exercice a ses questions à l’IA', 'afficherEcranDe() introuvable');
  } else {
    const cles = evaluer(w, 'Object.keys(QIA_SUGG)');
    const listees = cles.ok ? cles.valeur : [];
    const sans = kinds.filter(k => listees.indexOf(k) < 0);
    verifier('chaque écran d’exercice a ses questions à l’IA',
      cles.ok && sans.length === 0,
      !cles.ok ? 'QIA_SUGG introuvable' : sans.join(', ') + ' — retombent sur les questions génériques');
  }

  /* ---- L'identifiant sous lequel la note est enregistrée ----------------
     Point 14, et le plus coûteux à rater : la note part sous l'identifiant
     d'un AUTRE exercice, ou sous un identifiant que rien n'affiche. Elle est
     bien en base, l'élève voit sa note à l'écran — et elle a disparu de son
     bilan comme du tableau du professeur, sans erreur nulle part. C'est le
     même identifiant qui ne se renomme jamais : le renommer efface toutes les
     notes déjà obtenues, du bilan de l'élève comme du tableau du professeur.
     On ne peut pas le vérifier en exécutant : il faudrait finir chaque
     exercice. On lit donc le fichier, et on suit les trois chemins par
     lesquels un identifiant atteint « details.test » :
       · écrit tel quel                     details:{test:'pourcentage'…
       · pris dans currentTestId            {test:currentTestId…            (Terminale, Seconde)
       · rangé dans test.qId / test.tmId    details:{test:(test.qId||'…')…  (Première)
     Le troisième chemin passe le plus souvent par un démarreur partagé —
     startA2Q('augmenter-taux-addition', …) — et huit identifiants de la
     Première ne sont atteignables QUE par là : les chercher comme littéraux
     en aurait manqué le tiers. On remonte donc jusqu'au paramètre. */
  const ids = new Set(), props = new Set();
  let parCurrent = false;
  for(const m of src.matchAll(/\{\s*test\s*:\s*(?:'([^']+)'|(currentTestId)\b|\(\s*test\.([A-Za-z_$][\w$]*)\s*\|\|\s*'([^']+)'\s*\))/g)){
    if(m[1]) ids.add(m[1]);
    if(m[2]) parCurrent = true;
    if(m[3]){ props.add(m[3]); ids.add(m[4]); }
  }
  if(parCurrent) for(const m of src.matchAll(/currentTestId\s*=\s*'([^']+)'/g)) ids.add(m[1]);
  const fns = corpsFonctions(src, /(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g);
  props.forEach(p => {
    for(const m of src.matchAll(new RegExp('test\\.' + p + '\\s*=\\s*\'([^\']+)\'', 'g'))) ids.add(m[1]);
    /* le démarreur partagé : test.qId = <un de ses paramètres> */
    fns.forEach(f => {
      const pose = new RegExp('test\\.' + p + '\\s*=\\s*([A-Za-z_$][\\w$]*)\\b').exec(f.texte);
      if(!pose) return;
      const entete = /\(([^)]*)\)/.exec(f.texte);
      if(!entete || entete[1].split(',').map(x => x.trim()).indexOf(pose[1]) < 0) return;
      for(const c of src.matchAll(new RegExp('\\b' + f.nom + '\\s*\\(\\s*\'([^\']+)\'', 'g'))) ids.add(c[1]);
    });
  });
  const declares = evaluer(w, 'Object.keys(TESTS)');
  if(!declares.ok){
    ignorer('aucune note ne part sous un identifiant inconnu', 'TESTS illisible');
    ignorer('chaque exercice enregistre sa note sous son identifiant', 'TESTS illisible');
    return;
  }
  /* CE CONTRÔLE-CI VAUT POUR LES TROIS FICHIERS. Tout identifiant écrit en
     toutes lettres dans une note doit exister dans TESTS : sinon la note part,
     et rien ne l'affiche jamais. C'est ce qui arriverait au premier renommage
     d'un identifiant qui oublierait la fin de test. */
  const inconnus = [...ids].filter(i => declares.valeur.indexOf(i) < 0);
  verifier('aucune note ne part sous un identifiant inconnu', inconnus.length === 0,
    inconnus.join(', ') + ' — absent(s) de TESTS : la note serait invisible partout');

  /* CELUI-LÀ NE VAUT QUE POUR LA PREMIÈRE, et il faut dire pourquoi.
     La Seconde et la Terminale enregistrent leur note sous « currentTestId »,
     c'est-à-dire l'identifiant choisi dans le menu : tout exercice y est
     atteignable par construction, et le contrôle ne mesurerait rien. La
     Première, elle, épingle l'identifiant DANS chacune de ses quatorze fins de
     test — c'est là qu'un exercice ajouté peut se retrouver sans note, ou avec
     celle du voisin recopié. */
  if(!P.noteParExercice){
    ignorer('chaque exercice enregistre sa note sous son identifiant',
      'ce niveau enregistre sous currentTestId, l\'identifiant choisi dans le menu');
  } else {
    const jamais = declares.valeur.filter(i => !ids.has(i));
    verifier('chaque exercice enregistre sa note sous son identifiant', jamais.length === 0,
      jamais.join(', ') + ' — aucune note ne peut leur être rattachée');
  }
}

/* ---------- 3. Boutons d'aide ---------- */
function aide(suite){
  titre('3. BOUTONS D\'AIDE');
  const a = P.aide, t = P.temoin;
  charger(CIBLE, w => {
    const pret = evaluer(w, `currentEleve={id:'test',prenom:'Test'}; currentMode='soutien'; currentTestId='${t.testId}';`
      + `test.kind='${t.kind}'; test.idx=0; test.questions=[${t.generateur}]; test.locked=false;`
      + `show('${t.ecran}'); ${t.rendu}();` + (a.amorce ? ' ' + a.amorce : ''));
    verifier('l\'exercice témoin (' + t.testId + ') s\'affiche sans erreur', pret.ok, pret.erreur);

    if(a.rangee){
      const boutons = w.document.querySelectorAll(a.rangee.selecteur);
      verifier('les boutons d\'aide apparaissent en soutien', boutons.length >= a.rangee.attendus,
        boutons.length + ' bouton(s) pour ' + a.rangee.attendus + ' attendu(s) sur ' + a.rangee.selecteur);
    } else {
      ignorer('les boutons d\'aide apparaissent en soutien', 'ce niveau n\'a pas de rangée de boutons d\'aide');
    }

    /* Question à l'IA : sur ordinateur la fenêtre se détache, et c'est ce chemin
       — le chemin par défaut — qui a échoué trois fois de suite. */
    const fenetres = [];
    w.__nouvelleFenetre = function(){
      const p = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual:true }).window;
      p.closed = false; p.focus = function(){}; fenetres.push(p); return p;
    };
    evaluer(w, "sb={functions:{invoke:function(){ return Promise.resolve({data:{feedback:'Indice de test.'}}); }}};");

    if(a.qiaDetachee){
      evaluer(w, "detachementPossible=function(){return true;}; window.open=function(){ return window.__nouvelleFenetre(); };");
      const ouvre = evaluer(w, 'ouvrirQIA()');
      verifier('la fenêtre Question s\'ouvre détachée', ouvre.ok, ouvre.erreur);
      verifier('sa carte est bien dans la fenêtre indépendante',
        fenetres.some(p => p.document.querySelector('.qia-card')),
        'window.__fenetresDetachees doit être initialisé');
      const poser = evaluer(w, "qiaPoser('Question de test.')");
      verifier('poser une question ne lève pas d\'erreur', poser.ok, poser.erreur);
    } else {
      ignorer('la fenêtre Question à l\'IA', 'ce niveau n\'a pas de fenêtre détachable');
    }

    const soutien = evaluer(w, 'conseilCourant()');
    verifier('le bouton Soutien répond', soutien.ok, soutien.erreur);

    setTimeout(() => {
      const chercher = id => { for(const p of fenetres){ const e = p.document.getElementById(id); if(e) return e; }
                               return w.document.getElementById(id); };
      if(a.qiaDetachee){
        const dlg = chercher('qiaDialog');
        verifier('la réponse s\'affiche dans le dialogue', !!dlg && dlg.querySelectorAll('.qia-q, .qia-r').length >= 2,
          'une fenêtre détachée exige que $ cherche aussi dans les fenêtres détachées');
      }
      const corps = chercher('conseilBody');
      verifier('le conseil du Soutien s\'affiche', !!corps && corps.textContent.trim().length > 0);

      /* contexte envoyé au modèle, pour chaque type d'exercice */
      if(a.ctx){
        let bons = 0; const rates = [];
        a.ctx.kinds.forEach(([k, gen]) => {
          const r = evaluer(w, `test.kind='${k}'; test.questions=[${gen}]; test.idx=0;`
            + (a.ctx.prepare[k] || '') + ` String(${a.ctx.appel}).length`);
          if(r.ok && r.valeur > a.ctx.seuil) bons++; else rates.push(k);
        });
        verifier('le contexte IA existe pour les ' + a.ctx.kinds.length + ' exercices contrôlés',
          bons === a.ctx.kinds.length, 'manque : ' + rates.join(', '));
      } else {
        ignorer('le contexte IA de chaque exercice', 'ce niveau construit son contexte depuis l\'écran affiché');
      }

      /* la feuille de styles MathLive, sans laquelle les fractions s'aplatissent */
      const css = [...w.document.querySelectorAll('style')].map(x => x.textContent).join('\n');
      if(a.mlStatic){
        verifier('les styles de fraction MathLive sont présents',
          css.includes('.ML__mfrac') && css.includes('.ML__frac-line'),
          'sans eux, 25/100 s\'affiche « 10025 »');
      } else {
        ignorer('les styles de fraction MathLive', 'feuille ml-static-css absente de ce niveau (voir les manques)');
      }
      suite();
    }, 400);
  });
}

/* ---------- 4. Exercices ---------- */
function exercices(suite){
  titre('4. EXERCICES');
  const t = P.temoin;
  charger(CIBLE, w => {

    /* correction en direct : une fraction n'est jugée qu'une fois complète */
    if(P.liveCheck){
      const lc = P.liveCheck, c = lc.cases;
      preparer(w, { testId:t.testId, kind:t.kind, ecran:t.ecran, rendu:t.rendu, question:t.question });
      const ecrire = (id, v) => { const e = w.document.getElementById(id); if(e) e.value = v; };
      const quitter = () => { evaluer(w, lc.amorce); };

      ecrire(c.n1, lc.justes.n1); quitter();
      verifier('numérateur seul : aucune couleur', couleur(w, c.n1) === 'neutre');
      ecrire(c.d1, lc.justes.d1); quitter();
      verifier('fraction complète et juste : les deux cases en vert',
        couleur(w, c.n1) === 'VERT' && couleur(w, c.d1) === 'VERT');
      ecrire(c.n2, lc.faux.n2); ecrire(c.d2, lc.faux.d2); quitter();
      verifier('fraction fausse : les deux cases en rouge',
        couleur(w, c.n2) === 'ROUGE' && couleur(w, c.d2) === 'ROUGE');
      ecrire(c.res, lc.justes.res); quitter();
      verifier('résultat décimal juste : case en vert', couleur(w, c.res) === 'VERT');

      evaluer(w, `currentMode='train'; test.locked=false; ${t.rendu}();`);
      ecrire(c.n1, lc.justes.n1); ecrire(c.d1, lc.justes.d1); quitter();
      verifier('en entraînement : aucune coloration', couleur(w, c.n1) === 'neutre');
      evaluer(w, "currentMode='soutien';");
    } else {
      ignorer('la correction en direct colore les cases', 'ce niveau corrige à la validation, pas à la frappe');
    }

    /* la pause doit conserver le devoir en cours, sinon la reprise ne crédite
       jamais le devoir maison — et sa durée doit partir entière */
    if(P.pause.dm){
      verifierEval(w, 'la pause conserve le devoir maison en cours', `(function(){
        currentEleve={id:1,prenom:'Contrôle'}; currentTestId='${t.testId}'; currentDM='dm-controle';
        test.kind='${t.kind}'; test.questions=[${t.generateur}]; test.idx=0; test.startTime=Date.now()-1500;
        const p=recoveryPayload(); currentDM=null;
        window.__pauseDuree=p.duration_sec;
        return p.details.dm==='dm-controle' && p.details.state==='paused';
      })()`);
      verifierEval(w, 'la durée de la pause part entière', 'Number.isInteger(window.__pauseDuree)',
        v => v === true, 'durée décimale : la colonne integer la refuserait');
    }

    /* la pause doit capturer les saisies en cours, y compris les math-field
       (elles étaient perdues : seuls les input à id étaient sauvés) */
    if(P.pause.boxes){
      const b = P.pause.boxes;
      verifierEval(w, 'la pause capture et restaure les saisies math-field', `(function(){
        currentMode='train'; test.kind='${t.kind}'; test.locked=false;
        test.questions=[${t.question}]; test.idx=0;
        show('${t.ecran}'); ${t.rendu}();
        const champ=document.getElementById('${b.champ}');
        if(!champ) return 'champ ${b.champ} absent';
        champ.value='${b.valeur}';
        const m=captureBoxes();
        champ.value='';
        restoreBoxes(m);
        return document.getElementById('${b.champ}').value;
      })()`, v => v === b.valeur, 'restauré : « ' + b.champ + ' »');
    } else {
      ignorer('la pause capture et restaure les saisies math-field', 'captureBoxes ne lit pas les math-field sur ce niveau (voir les manques)');
    }

    /* ---- Signaler un problème -------------------------------------------
       Le bouton est le seul retour que la page donne : trois pannes sont
       passées en production sans qu'aucune ne soit apprise autrement qu'en
       classe. Trois choses doivent tenir, et chacune a son piège.
       1. Le signalement emporte l'ÉTAT de l'exercice — sans lui, le professeur
          reçoit « ça marche pas » et ne peut rien rejouer.
       2. Il n'emporte PAS de note et n'en écrit pas.
       3. Le rejeu, côté professeur, n'enregistre AUCUNE note. Le professeur est
          connecté à son propre compte : sans verrou, terminer l'exercice rejoué
          poserait une note sur un élève. C'est le défaut le plus coûteux de tout
          ce dispositif, et le seul qui ne se verrait pas à l'œil nu. */
    if(P.signalement){
      const sg = P.signalement;
      verifierEval(w, 'le signalement emporte l\'état de l\'exercice, pas une image', `(function(){
        currentEleve={id:1,prenom:'Contrôle'}; currentTestId='${sg.exercice}'; currentMode='train';
        test.kind='${t.kind}'; test.questions=[${t.generateur}]; test.idx=0;
        const p=signalementPayload('la case reste rouge');
        if(p.eleve_id!==1) return 'eleve_id absent';
        if(p.exercice!=='${sg.exercice}') return 'exercice absent';
        if(p.message!=='la case reste rouge') return 'message absent';
        if(!p.contexte || p.contexte.kind!=='${t.kind}') return 'instantané de l\\'exercice absent';
        if(!p.contexte.questions || !p.contexte.questions.length) return 'la question tirée n\\'est pas jointe';
        if(!p.contexte._boxes) return 'les saisies ne sont pas jointes';
        if(p.version!==APP_VERSION) return 'la version n\\'est pas jointe';
        return '';
      })()`, v => v === '', undefined);

      /* sb est nul hors navigateur : le banc pose un double qui note les tables
         touchées. C'est la seule façon de voir OÙ part l'écriture — un contrôle
         qui se contenterait de lire le code passerait au vert sur un copier-
         coller qui aurait gardé le nom de la table des notes. */
      const DOUBLE_SB = `sb={ __vues:[], from:function(t){ this.__vues.push(t); const r={
          insert:function(){ return Promise.resolve({error:null}); },
          update:function(){ return r; }, delete:function(){ return r; },
          select:function(){ return r; }, eq:function(){ return Promise.resolve({error:null}); },
          order:function(){ return r; }, limit:function(){ return Promise.resolve({data:[],error:null}); } };
        return r; } };`;

      verifierEval(w, 'un signalement va dans sa table, jamais dans les notes', `(function(){
        ${DOUBLE_SB}
        currentEleve={id:1,prenom:'Contrôle'}; currentTestId='${sg.exercice}'; currentMode='train';
        test.kind='${t.kind}'; test.questions=[${t.generateur}]; test.idx=0;
        const champ=document.getElementById('sigInput');
        if(!champ) return 'le champ du signalement est absent de la page';
        champ.value='la case reste rouge alors que j\\'ai bon';
        envoyerSignalement();
        const vues=sb.__vues;
        if(vues.indexOf('${sg.table}')<0) return 'rien n\\'est parti vers ${sg.table} (vu : '+vues.join(',')+')';
        if(vues.indexOf('${P.tableResultats}')>=0) return 'il a touché la table des notes';
        return '';
      })()`, v => v === '', undefined);

      /* Le verrou est posé sur le CLIENT, pas sur une fonction d'enregistrement :
         la Première en a une, les deux autres écrivent leurs notes depuis sept et
         quatre endroits différents. Un verrou par point d'écriture aurait laissé
         passer le prochain exercice ajouté. */
      verifierEval(w, 'le rejeu d\'un signalement n\'enregistre aucune note', `(function(){
        if(typeof REJEU==='undefined') return 'le verrou REJEU n\\'existe pas';
        if(typeof poserGardeRejeu!=='function') return 'poserGardeRejeu() n\\'existe pas';
        const arrivees=[];
        sb={ from:function(t){ return {
          insert:function(){ arrivees.push(t); return Promise.resolve({error:null}); },
          update:function(){ arrivees.push(t); return Promise.resolve({error:null}); } }; } };
        poserGardeRejeu();
        REJEU=true;
        window.__rejeuRendu=sb.from('${P.tableResultats}').insert({score:10,total:10});
        const pendant=arrivees.length;
        REJEU=false;
        sb.from('${P.tableResultats}').insert({score:10,total:10});
        const apres=arrivees.length;
        if(pendant>0) return 'une note est partie en base pendant un rejeu';
        if(apres===0) return 'le verrou bloque aussi HORS rejeu : plus aucune note ne s\\'enregistrerait';
        return '';
      })()`, v => v === '', undefined);

      /* Et il doit le DIRE : un refus silencieux ferait croire à l'appelant que
         la note est enregistrée, et le brouillon de reprise serait jeté pour rien. */
      evalPromis(w, 'window.__rejeuRendu', r => {
        verifier('et le rejeu rend une erreur plutôt qu\'un succès muet',
          r.ok && r.valeur && r.valeur.error && /rejou/i.test(String(r.valeur.error.message||'')),
          r.ok ? ('rendu : ' + JSON.stringify(r.valeur)) : r.erreur);
      });

      /* La table écran/rendu du rejeu doit désigner des fonctions qui existent.
         Elle est née fausse — « renderA2QTest » n'a jamais existé — et le défaut
         ne se serait vu qu'au premier rejeu, chez le professeur. */
      verifierEval(w, 'chaque écran rejouable désigne une fonction de rendu réelle', `(function(){
        const src=String(afficherEcranDe);
        const noms=(src.match(/render[A-Za-z0-9]+/g)||[]);
        if(!noms.length) return 'aucune fonction de rendu dans la table';
        const absentes=noms.filter(function(n){ return typeof window[n]!=='function'; });
        return absentes.length ? absentes.join(', ') : '';
      })()`, v => v === '', undefined);
    } else {
      ignorer('le signalement emporte l\'état de l\'exercice, pas une image',
        'ce niveau n\'a pas déclaré sa table de signalements (voir tests/profils.js)');
    }

    /* « Recommencer » doit relancer le MÊME exercice */
    if(P.relance){
      const r = P.relance;
      verifierEval(w, '« Recommencer » relance bien l\'exercice en cours', `(function(){
        currentTestId='${r.testId}'; test.kind='${r.kind}';
        let lance=false;
        const parTests=TESTS['${r.testId}'] && TESTS['${r.testId}'].start;
        const parNom=typeof ${r.fonction}==='function' ? ${r.fonction} : null;
        if(parTests) TESTS['${r.testId}'].start=function(){ lance=true; };
        if(parNom) ${r.fonction}=function(){ lance=true; };
        try{ restartCurrentTest(); }catch(e){}
        if(parTests) TESTS['${r.testId}'].start=parTests;
        if(parNom) ${r.fonction}=parNom;
        return lance;
      })()`);
    }

    /* le rappel de cours doit s'afficher sans consommer un appel au modele */
    if(P.rappelSansIA){
      const R = P.rappelSansIA;
      verifierEval(w, 'le rappel de cours s’affiche sans appeler l’IA', `(function(){
        if(typeof ${R.fonction}!=='function') return '${R.fonction} absente';
        let appels=0; const vrai=${R.appelIA}; ${R.appelIA}=function(){ appels++; };
        currentTestId='${t.testId}'; test.kind='${t.kind}';
        try{ ${R.fonction}(); }catch(e){ ${R.appelIA}=vrai; return 'erreur : '+e.message; }
        ${R.appelIA}=vrai;
        const cadre=document.getElementById('conseilRappel');
        if(appels!==0) return appels+' appel(s) au modèle';
        if(!cadre || cadre.hidden) return 'le cadre du rappel reste masqué';
        if(cadre.innerHTML.length<50) return 'le rappel est vide';
        return true;
      })()`, v => v === true, undefined);
      verifierEval(w, 'le rappel est offert en entraînement, jamais en évaluation', `(function(){
        if(typeof rappelInlineBtn!=='function') return 'rappelInlineBtn absente';
        currentTestId='${t.testId}'; test.kind='${t.kind}';
        const sauve=currentMode;
        currentMode='train';   const enTrain=rappelInlineBtn().length>0;
        currentMode='soutien'; const enSoutien=rappelInlineBtn().length>0;
        currentMode='eval';    const enEval=rappelInlineBtn().length>0;
        currentMode=sauve;
        if(!enTrain)   return 'absent en entraînement';
        if(!enSoutien) return 'absent en soutien';
        if(enEval)     return 'présent en évaluation — il ne doit pas l’être';
        return true;
      })()`, v => v === true, undefined);
    } else {
      ignorer('le rappel de cours s’affiche sans appeler l’IA', 'ce niveau ouvre son rappel depuis la fenêtre d’aide déjà en place');
      ignorer('le rappel est offert en entraînement, jamais en évaluation', 'ce niveau n’a pas de bouton de rappel distinct');
    }

    /* chaque exercice doit fournir son rappel de cours */
    if(P.rappels){
      verifierEval(w, 'chaque exercice a son rappel de cours', P.rappels, v => v === '', undefined);
    } else {
      ignorer('chaque exercice a son rappel de cours', 'ce niveau n\'a pas encore de table RAPPELS (voir les manques)');
    }

    /* ---- Un devoir ne demande qu'une fois chaque exercice ---------------
       Les devoirs ont su un temps demander plusieurs passages du même exercice
       et en verrouiller un tant que les précédents n'étaient pas faits. C'est
       retiré (décision de Turquet, août 2026), éditeur compris.
       Deux choses à tenir, et la seconde compte autant que la première :
       le réglage ne doit pas revenir par l'éditeur, ET un devoir enregistré du
       temps des passages doit continuer de se lire — avec toutes les notes
       prises pendant ces passages, sans quoi les retirer aurait effacé de
       l'écran des notes réellement obtenues. */
    if(P.devoirs){
      const dv = P.devoirs;
      verifierEval(w, 'un devoir ne demande qu\'une fois chaque exercice', `(function(){
        if(typeof exercicesDevoir!=='function') return 'exercicesDevoir() n\\'existe pas';
        /* un devoir d'AVANT, avec ses trois passages et son verrou */
        const vieux={id:'dm-ctrl',num:1,actif:true,exercices:[
          {id:'${dv.exercice}',modes:['train'],rep:3},
          {id:'${dv.suivant}',modes:['train'],verrou:true}]};
        const l=exercicesDevoir(vieux);
        if(l.length!==2) return 'le devoir compte '+l.length+' lignes au lieu de 2';
        if(l[0].id!=='${dv.exercice}' || l[1].id!=='${dv.suivant}') return 'les exercices ne sont pas les bons';
        if(l.some(function(x){ return x.passe!==undefined || x.verrou!==undefined || x.sur!==undefined; }))
          return 'une ligne porte encore un passage ou un verrou';
        /* et l'éditeur ne propose plus de les régler */
        if(typeof renderDmEditor==='function'){
          const src=String(renderDmEditor);
          if(/dmSetRep|dmSetVerrou|Passages/.test(src)) return 'l\\'éditeur propose encore les passages ou le verrou';
        }
        return '';
      })()`, v => v === '', undefined);

      verifierEval(w, 'les notes prises du temps des passages comptent toujours', `(function(){
        const avant=mesResultats;
        /* trois passages joués autrefois, et une note d'avant sans passage */
        mesResultats=[
          {percent:60,details:{dm:'dm-ctrl',test:'${dv.exercice}',mode:'train',passe:1}},
          {percent:80,details:{dm:'dm-ctrl',test:'${dv.exercice}',mode:'train',passe:2}},
          {percent:55,details:{dm:'dm-ctrl',test:'${dv.exercice}',mode:'train'}}];
        const b=dmBest('dm-ctrl','${dv.exercice}','train');
        mesResultats=avant;
        if(!b) return 'aucune note retrouvée : les notes des passages ont disparu du devoir';
        if(b.percent!==80) return 'la meilleure note vaut '+b.percent+' au lieu de 80';
        return '';
      })()`, v => v === '', undefined);
    } else {
      ignorer('un devoir ne demande qu\'une fois chaque exercice', 'ce niveau n\'a pas d\'éditeur de devoirs');
      ignorer('les notes prises du temps des passages comptent toujours', 'ce niveau n\'a pas d\'éditeur de devoirs');
    }

    /* ---- Un mode qui n'existe pas ne se propose nulle part -----------------
       Les tables de multiplication sont un exercice de rapidité : le mode
       soutien, qui laisse corriger sans limite de temps, n'y a pas de sens.
       L'écran des modes le refusait depuis toujours — mais l'éditeur de devoirs
       l'ignorait et le proposait au professeur, qui pouvait donc composer un
       devoir offrant à l'élève une carte menant à un exercice sans soutien.
       La règle vit maintenant dans sansSoutien(), et les trois écrans la
       consultent. Ce contrôle exige les trois. */
    if(P.devoirs){
      verifierEval(w, 'un mode inexistant n\'est proposé ni au menu, ni dans un devoir', `(function(){
        if(typeof sansSoutien!=='function') return 'la règle sansSoutien() n\\'existe pas';
        const id='${P.devoirs.exercice}';
        if(!sansSoutien(id)) return id+' devrait être déclaré sans soutien';
        /* l'écran des modes : la carte du soutien ne doit pas être posée */
        const src=String(openTest);
        if(src.indexOf('sansSoutien(')<0) return 'l\\'écran des modes ne consulte pas la règle';
        /* le devoir : même si le professeur l'a coché autrefois, l'élève ne doit
           pas voir la carte */
        const sd=String(openTestDevoir);
        if(sd.indexOf('sansSoutien(')<0) return 'l\\'écran d\\'un devoir ne consulte pas la règle';
        /* l'éditeur : la case doit être refusée à la composition */
        const se=String(renderDmEditor);
        if(se.indexOf('sansSoutien(')<0) return 'l\\'éditeur de devoirs propose encore ce mode';
        /* et un exercice ordinaire garde son soutien */
        if(sansSoutien('${P.temoin.testId}')) return 'la règle mord sur un exercice qui a bien un soutien';
        return '';
      })()`, v => v === '', undefined);
    }

    /* ---- Deux exercices ne portent jamais le même nom ---------------------
       Né d'un cas réel : les six exercices d'augmentation ont été renommés pour
       dire leur méthode — « Retrouver la valeur initiale en calculant le
       coefficient multiplicateur… » — et le même patron appliqué aux diminutions
       produisait EXACTEMENT le même nom. Sur la page de sa partie, le contexte
       lève l'ambiguïté ; dans le tableau du professeur, dans les notes, dans
       « À retravailler » et dans l'export CSV, les deux exercices devenaient
       indiscernables. Le sens a donc été ajouté des deux côtés (« après une
       hausse », « après une baisse »), et ce contrôle interdit que le cas
       revienne au prochain renommage. */
    verifierEval(w, 'deux exercices ne portent pas le même nom', `(function(){
      const vus={}, doublons=[];
      Object.keys(TESTS).forEach(function(id){
        const n=String((TESTS[id]&&TESTS[id].name)||'').trim();
        if(!n) return;
        if(vus[n]) doublons.push('« '+n+' » : '+vus[n]+' et '+id);
        else vus[n]=id;
      });
      return doublons.join(' | ');
    })()`, v => v === '', undefined);

    /* ---- Aucun numéro d'exercice écrit en toutes lettres --------------------
       Un numéro (3.1.1) n'existe nulle part dans le fichier : il se déduit de la
       POSITION de l'exercice dans THEMES. Réordonner un thème les décale donc
       tous — et les phrases qui en citaient un, « les 3 étapes de l'exercice
       3.1.1 », renvoyaient l'élève au mauvais exercice sans que rien ne bronche.
       Elles s'écrivent maintenant {identifiant}, résolu à l'affichage par
       numeros(). Ce contrôle interdit qu'un numéro en dur y revienne : sans lui,
       la prochaine phrase écrite à la main ramènerait le défaut en silence.
       On n'inspecte que les DEUX sources de texte pur — descriptions et rappels.
       Le contexte envoyé au modèle en est exclu : il est truffé de décimales
       (coordonnées de tracé, bornes d'intervalle) qu'aucune règle ne distingue
       d'une référence. C'est un manque assumé, pas un oubli. */
    verifierEval(w, 'aucun numéro d\'exercice écrit en dur dans un texte vu par l\'élève', `(function(){
      var fautifs=[], suspect=/\\d+\\.\\d+(?:\\.\\d+)?/;
      Object.keys(TESTS).forEach(function(id){
        var d=TESTS[id] && TESTS[id].desc;
        if(d && suspect.test(d)) fautifs.push('description de '+id+' cite '+d.match(suspect)[0]);
      });
      [['RAPPELS', typeof RAPPELS!=='undefined'?RAPPELS:null],
       ['RAPPELS_ID', typeof RAPPELS_ID!=='undefined'?RAPPELS_ID:null]].forEach(function(t){
        if(!t[1]) return;
        Object.keys(t[1]).forEach(function(k){
          var v=t[1][k]; v=String((typeof v==='function'?v():v)||'');
          if(suspect.test(v)) fautifs.push(t[0]+'.'+k+' cite '+v.match(suspect)[0]);
        });
      });
      return fautifs.join(' | ');
    })()`, v => v === '', undefined);

    /* Et le remplaçant doit remplacer : un contrôle qui vérifie seulement
       l'absence de numéros en dur passerait au vert sur un numeros() cassé,
       qui laisserait « {pourcentage} » s'afficher tel quel à l'élève. */
    verifierEval(w, 'numeros() rend bien le numéro de l\'exercice cité', `(function(){
      if(typeof numeros!=='function') return 'numeros() absente';
      var id=Object.keys(TESTS)[0], attendu=testNum(id)||TESTS[id].name;
      var rendu=numeros('voir {'+id+'} pour la méthode');
      if(rendu.indexOf('{')>=0) return 'accolade non résolue : '+rendu;
      if(rendu.indexOf(attendu)<0) return 'numéro absent du rendu : '+rendu;
      if(numeros('{exercice-inexistant}')!=='{exercice-inexistant}') return 'un identifiant inconnu devrait rester tel quel';
      /* La preuve qui compte : le numéro doit SUIVRE une renumérotation. Sans
         elle, un numeros() qui aurait figé le numéro au chargement passerait au
         vert — et c'est exactement le défaut qu'on cherche à rendre impossible. */
      var sauve=TEST_NUM[id]; TEST_NUM[id]='9.9.9';
      var apres=numeros('voir {'+id+'}'); TEST_NUM[id]=sauve;
      if(apres.indexOf('9.9.9')<0) return 'le numéro ne suit pas une renumérotation : '+apres;
      /* Et la carte de l'élève doit être branchée dessus : numeros() juste mais
         cardHTML non câblée afficherait « {pourcentage} » tel quel sur l'écran. */
      var cite=null;
      Object.keys(TESTS).forEach(function(k){ if(!cite && /\\{[a-z0-9-]+\\}/.test(TESTS[k].desc||'')) cite=k; });
      if(!cite) return '';                    /* aucun texte ne cite d'exercice ici */
      var carte=cardHTML('x','titre',TESTS[cite].desc,'');
      if(/\\{[a-z0-9-]+\\}/.test(carte)) return 'la carte affiche encore une accolade : '+cite;
      /* Tout entonnoir par lequel un texte atteint l'élève — ou le modèle — doit
         résoudre. Ce contrôle est né d'un défaut réel : les deux citations du
         contexte de la Terminale avaient été converties en {identifiant} sans que
         conseilCtxCourant() soit branchée, et elles seraient parties au modèle en
         accolades. La carte, elle, était juste : rien d'autre ne l'aurait vu. */
      var debranches=['cardHTML','rappelHTML','conseilCtxCourant'].filter(function(f){
        var fn=(typeof window!=='undefined')?window[f]:null;
        if(typeof fn!=='function') return false;
        /* commentaires retirés d'abord : la première version de ce contrôle lisait
           le commentaire qui EXPLIQUE l'appel et passait au vert sur une fonction
           débranchée. Elle a été prise en défaut sur ce cas exact. */
        var corps=String(fn).replace(/\\/\\*[\\s\\S]*?\\*\\//g,'').replace(/(^|[^:])\\/\\/[^\\n]*/g,'$1');
        return corps.indexOf('numeros(')<0;
      });
      return debranches.length ? 'ces fonctions laissent passer un texte sans le résoudre : '+debranches.join(', ') : '';
    })()`, v => v === '', undefined);

    if(P.specifique === 'premiere') premiere(w);
    fiabilite(w, suite);
  });
}

/* ---------- 4 ter. Ce que l'application dit à l'élève ---------- */
function fiabilite(w, suite){
  /* le verrou doit bloquer le second clic du même test, et se rouvrir au suivant */
  verifierEval(w, 'le verrou ne laisse passer qu’une fin par test', `(function(){
    if(typeof debutFin!=='function') return 'debutFin absente';
    test.startTime=Date.now();
    const premier=debutFin(), second=debutFin();
    test.startTime=Date.now()+5000;          /* test suivant : startTime toujours réaffecté */
    const suivant=debutFin();
    return premier===true && second===false && suivant===true;
  })()`, v => v === true, 'le double-clic doit être refusé, le test suivant accepté');

  /* Le retour anticipé de doRecoverySave annonçait un succès alors qu'il n'avait
     rien écrit : atteignable en cliquant sur Pause pendant qu'un test se termine,
     et la pause affirmait alors « ✓ » sans le moindre brouillon en base. Les deux
     essais ci-dessous remplacent doRecoverySave par un bouchon et ne peuvent donc
     pas le voir — celui-ci exerce la vraie fonction. */
  /* « Mis en pause ✓ » ne doit s'afficher que si la sauvegarde a réussi : c'est sur
     la foi de ce message que l'élève ferme son onglet */
  evalPromis(w, `(async function(){
    if(typeof pauseTest!=='function') return JSON.stringify({absent:true});
    const vraiToast=toast, vraiSave=doRecoverySave;
    const aNote=(typeof enregistrerNotePartielle==='function');
    const vraiNote=aNote?enregistrerNotePartielle:null;
    currentEleve={id:1,prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    async function essai(reussite){
      const messages=[];
      toast=function(m,t){ messages.push((t||'ok')+':'+m); };
      doRecoverySave=function(){ return Promise.resolve(reussite); };
      if(aNote) enregistrerNotePartielle=function(){ return Promise.resolve(reussite); };
      try{ await pauseTest(); }catch(e){}
      toast=vraiToast;
      return messages.join(' ¦ ');
    }
    const echec=await essai(false);
    const succes=await essai(true);
    /* Devoir ouvert mais pas encore commencé : il n'y a rien à noter, ce qui
       n'est pas un échec. La première version de ce correctif lisait ce cas
       comme une panne et annonçait « Pause non enregistrée » à un élève dont
       tout avait pourtant été sauvegardé. */
    let devoir='(sans objet)';
    if(aNote){
      const messages=[];
      toast=function(m,t){ messages.push((t||'ok')+':'+m); };
      doRecoverySave=function(){ return Promise.resolve(true); };
      enregistrerNotePartielle=vraiNote;                 /* la vraie fonction, pas un bouchon */
      currentDM='dm-controle'; test.answers=[]; test.questions=test.questions&&test.questions.length?test.questions:[{}];
      try{ await pauseTest(); }catch(e){}
      toast=vraiToast; currentDM=null;
      devoir=messages.join(' ¦ ');
    }
    doRecoverySave=vraiSave; if(aNote) enregistrerNotePartielle=vraiNote;
    /* Retour anticipé de la VRAIE doRecoverySave : quand un test est déjà en
       cours d'enregistrement, elle n'écrit rien. Elle renvoyait « true », si
       bien que la pause annonçait « ✓ » sans le moindre brouillon en base. Les
       trois essais ci-dessus la remplacent par un bouchon et ne peuvent donc pas
       le voir : celui-ci exerce la fonction elle-même. */
    const sauveClos=recoveryClosed;
    currentEleve={id:1,prenom:'Contrôle'}; currentMode='train'; recoveryClosed=true;
    let precoce;
    try{ precoce=await doRecoverySave(); }catch(e){ precoce='exception : '+e.message; }
    recoveryClosed=sauveClos;

    /* Il y avait ici tout un scénario sur la note posée par l'abandon : elle
       n'existe plus. Abandonner ne touche plus à la progression — c'est
       désormais le contrôle « abandonner n'enregistre aucune note », plus bas,
       qui le tient, en exerçant la VRAIE fonction contre le double de la base
       plutôt qu'en bouchonnant enregistrerNotePartielle(). */
    return JSON.stringify({echec:echec, succes:succes, devoir:devoir,
      precoce:(precoce===null?'null':String(precoce))});
  })()`, r => {
    if(!r.ok){ verifier('la pause n’annonce « ✓ » que si elle a réussi', false, 'erreur JavaScript : ' + r.erreur); return suite(); }
    let d = {};
    try { d = JSON.parse(r.valeur); } catch(e){ d = {}; }
    if(d.absent){ ignorer('la pause n’annonce « ✓ » que si elle a réussi', 'ce niveau n’a pas de mise en pause'); return suite(); }
    verifier('la pause avoue son échec au lieu d’annoncer « ✓ »',
      /err:/.test(d.echec || '') && !/✓/.test(d.echec || ''),
      'messages affichés : ' + (d.echec || '(aucun)'));
    verifier('la pause réussie confirme bien à l’élève', /✓/.test(d.succes || ''),
      'messages affichés : ' + (d.succes || '(aucun)'));
    verifier('doRecoverySave ne fait pas passer « rien à enregistrer » pour un succès',
      d.precoce === 'null', 'retour anticipé : ' + (d.precoce || '(inconnu)') + ' — attendu null');
    if(d.devoir === '(sans objet)'){
      ignorer('un devoir mis en pause avant d’être commencé n’alarme pas', 'ce niveau n’enregistre pas de note partielle');
    } else {
      verifier('un devoir mis en pause avant d’être commencé n’alarme pas', /✓/.test(d.devoir || ''),
        'messages affichés : ' + (d.devoir || '(aucun)') + ' — « rien à noter » n’est pas un échec');
    }
    abandonSortDePause(w, suite);
  });
}

/* ---------- 4 ter. Ce qu'un abandon efface, et ce qu'il laisse -------------
   Un brouillon de pause désigne QUATRE choses : l'exercice, le mode, le devoir
   et — en Première — le passage. Trois endroits en avaient chacun leur idée, et
   l'effacement était le plus large des trois : il ne regardait ni le devoir ni
   le passage.
   LA RÈGLE, décidée par Turquet : abandonner efface la pause de SON mode et de
   lui seul. L'entraînement et le soutien sont deux travaux distincts, que
   l'écran des modes montre côte à côte — abandonner l'un ne jette pas l'autre.
   Ce contrôle tient les deux bords à la fois, parce que chacun a son défaut :
   trop étroit, l'exercice reste « en pause » dans le mode qu'on vient
   d'abandonner ; trop large, un seul abandon emporte le travail en cours des
   autres passages, des autres devoirs et du travail libre — c'était le cas, et
   sans le moindre message.
   Ce contrôle vient EN DERNIER et rend la main lui-même : son scénario est une
   suite d'attentes, et le verdict du banc partait avant lui.
   Le double de la base est chargé pour de bon — un talon qui répond « pas
   d'erreur » à tout ne prouverait rien de ce qui est écrit là. */
function abandonSortDePause(w, apres){
  const exo = P.temoin.testId, TR = P.tableResultats;
  const SEMER = `window.__faux.tables['${TR}']=[
    {id:'L1',eleve_id:'e1',details:{state:'paused',test:'${exo}',mode:'train'}},
    {id:'L2',eleve_id:'e1',details:{state:'paused',test:'${exo}',mode:'soutien'}},
    {id:'L3',eleve_id:'e1',details:{state:'paused',test:'${exo}',mode:'train',dm:'devoir-1'}},
    {id:'L4',eleve_id:'e1',details:{state:'paused',test:'autre-exercice',mode:'train'}}];`;
  const RESTANT = `(window.__faux.tables['${TR}']||[]).filter(function(r){return r.details&&r.details.state==='paused';}).map(function(r){return r.id;}).sort().join(',')`;
  const POSER = `window.confirm=function(){return true;};
    currentEleve={id:'e1',prenom:'Contrôle'}; currentTestId='${exo}'; currentDM=null;
    if(typeof currentPasse!=='undefined') currentPasse=null;
    recoveryRowId=null; recoveryClosed=false; recoveryDirty=false;
    test.questions=[]; test.answers=[]; test.score=0;
    /* Chaque étape est un test NEUF : debutFin() se verrouille sur startTime, et
       sans cela la Seconde et la Terminale refusaient d'abandonner une deuxième
       fois — le contrôle mesurait alors le vide. */
    test.startTime=Date.now()-1000-(window.__ctrAbandon=(window.__ctrAbandon||0)+1);`;

  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const dits=[]; const vraiToast=toast; toast=function(m,k){ dits.push((k||'ok')+':'+m); };
    const bilan={};
    try{
      /* 1. abandon en soutien, hors devoir */
      ${SEMER} ${POSER} currentMode='soutien';
      test.questions=[{q:'2+2',answer:4}]; test.answers=[{q:'2+2',answer:4,given:4,correct:true}]; test.score=1;
      window.__faux.journal.length=0;
      await abandonTest();
      bilan.abandon=${RESTANT};
      /* Ce qui a été ÉCRIT pendant l'abandon : il ne doit y avoir aucune
         insertion dans la table des notes. L'élève a répondu juste à une
         question — de quoi nourrir une note partielle, si elle existait encore. */
      bilan.ecrits=window.__faux.operations('insert','${TR}').length
                  +window.__faux.operations('upsert','${TR}').length;
      /* ET LE CONTRÔLE QUI COUVRE TOUS LES EXERCICES À LA FOIS. Celui du dessus
         n'exerce qu'un seul écran : abandonTest() a longtemps eu des branches
         propres à certains d'entre eux — les tables de multiplication avaient la
         leur, qui posait la note des calculs déjà sus. On lit donc le corps de la
         fonction, commentaires retirés (la première version d'un contrôle voisin
         lisait le commentaire qui EXPLIQUE l'appel et passait au vert sur une
         fonction débranchée) : aucun chemin d'écriture de note ne doit y être
         nommé, quel que soit l'exercice. */
      const corpsAbandon=String(abandonTest)
        .replace(/\\/\\*[\\s\\S]*?\\*\\//g,'').replace(/(^|[^:])\\/\\/[^\\n]*/g,'$1');
      bilan.ecrivains=['enregistrerNotePartielle','enregistrerResultat','tmFinir','tmAbandon','showResults']
        .filter(function(n){ return corpsAbandon.indexOf(n)>=0; }).join(', ');
      /* 1 bis. et l'écran où l'élève retombe le dit. C'est le contrôle qui
         compte vraiment : effacer la bonne ligne ne sert à rien si le menu, lui,
         en montre une autre. Le menu libre montrait les brouillons nés dans un
         DEVOIR — il proposait donc de reprendre un travail que l'abandon laisse
         en place à dessein. La carte du mode abandonné doit disparaître, celle
         de l'AUTRE mode doit rester. */
      await openTest('${exo}');
      const vu=document.getElementById('modeChoices').innerHTML;
      bilan.menu=(vu.indexOf('Reprendre le soutien')>=0?'soutien':'')
                +(vu.indexOf('Reprendre l\u2019entraînement')>=0?'+entraînement':'');
      /* 2. abandon DANS le devoir : les brouillons libres ne bougent pas */
      ${SEMER} ${POSER} currentMode='train'; currentDM='devoir-1';
      await clearRecovery(true);
      bilan.devoir=${RESTANT};
      /* 3. fin de test ordinaire : l'autre mode garde sa pause */
      ${SEMER} ${POSER} currentMode='soutien';
      await clearRecovery();
      bilan.finNormale=${RESTANT};
      /* 4. la base refuse : l'élève doit l'apprendre, pas être rassuré */
      ${SEMER} ${POSER} currentMode='soutien';
      dits.length=0; window.__faux.panne=true;
      await abandonTest();
      window.__faux.panne=false;
      bilan.panne=${RESTANT};
      bilan.ditsPanne=dits.join(' | ');
      /* 5. ET LE CAS QUI A VRAIMENT COÛTÉ. La base refuse la suppression SANS
         le dire — c'est ce que fait RLS : une ligne qu'on n'a pas le droit de
         toucher est une ligne qui n'existe pas, et PostgREST répond « 0 ligne
         effacée », pas « refusé ». Les élèves n'avaient aucune politique de
         suppression sur leurs résultats : la page a donc annoncé « Exercice
         abandonné ✓ » des mois durant, et l'exercice restait proposé « à
         reprendre ». Aucune erreur nulle part, donc aucun contrôle ne bougeait.
         La migration 004 ouvre le droit ; ceci vérifie que le PROCHAIN refus
         muet, quel qu'il soit, se verra tout de suite. */
      ${SEMER} ${POSER} currentMode='soutien';
      dits.length=0; window.__faux.refusMuet=true;
      await abandonTest();
      window.__faux.refusMuet=false;
      bilan.muet=${RESTANT};
      bilan.ditsMuet=dits.join(' | ');
    } finally { toast=vraiToast; window.__faux.panne=false; }
    return bilan;
  })()`, r => {
    const b = r.ok ? (r.valeur || {}) : {};
    const souci = r.ok ? '' : 'erreur JavaScript : ' + r.erreur;
    verifier('abandonner n’enregistre aucune note',
      r.ok && b.ecrits === 0,
      souci || b.ecrits + ' écriture(s) dans la table des notes — abandonner ne doit rien poser sur la progression');
    verifier('et aucun exercice n’a de chemin de note à l’abandon',
      r.ok && b.ecrivains === '',
      souci || 'abandonTest() appelle encore : ' + b.ecrivains);
    verifier('abandonner efface la pause de son mode',
      r.ok && b.abandon === 'L1,L3,L4',
      souci || 'brouillons restants : ' + b.abandon + ' — attendu L1,L3,L4 : le soutien abandonné part, l’entraînement reste');
    verifier('et l’écran ne propose plus de reprendre CE mode-là, mais toujours l’autre',
      r.ok && b.menu === '+entraînement',
      souci || 'cartes de reprise au menu : « ' + b.menu + ' » — attendu l’entraînement seul');
    verifier('abandonner n’efface pas le travail mis en pause ailleurs',
      r.ok && b.devoir === 'L1,L2,L4',
      souci || 'brouillons restants : ' + b.devoir + ' — attendu L1,L2,L4 : abandonner dans un devoir ne touche pas au travail libre');
    verifier('terminer un exercice laisse la pause de l’autre mode',
      r.ok && b.finNormale === 'L1,L3,L4',
      souci || 'brouillons restants : ' + b.finNormale + ' — attendu L1,L3,L4 : finir le soutien n’efface pas l’entraînement en pause');
    verifier('un refus MUET de la base est vu quand même',
      r.ok && b.muet === 'L1,L2,L3,L4' && /err:/.test(String(b.ditsMuet || '')) && /pause/i.test(String(b.ditsMuet || '')),
      souci || 'restants : ' + b.muet + ' — l’élève a lu « ' + b.ditsMuet + ' » ; sous RLS la suppression ne rend aucune erreur');
    verifier('un abandon que la base refuse n’est pas annoncé comme réussi',
      r.ok && b.panne === 'L1,L2,L3,L4' && /err:/.test(String(b.ditsPanne || '')) && /pause/i.test(String(b.ditsPanne || '')),
      souci || 'restants : ' + b.panne + ' — l’élève a lu « ' + b.ditsPanne + ' »');
    apres();
  });
}

/* ---------- 4 bis. Contrôles propres à la Première ---------- */
function premiere(w){
  /* ---- La fenêtre des tables de multiplication -------------------------
     Une table de référence, ouverte depuis TOUS les écrans d'exercice. Deux
     bords opposés, et c'est leur opposition qui compte : sur l'exercice DES
     tables elle devient une antisèche, donc elle se referme dès que l'élève
     revient à son calcul ; partout ailleurs elle doit RESTER ouverte à côté,
     sans quoi une fenêtre flottante ne sert à rien. Corriger un seul des deux
     côtés ne corrige rien.
     Note : jsdom n'implémente pas PointerEvent — un premier essai écrit avec
     « new PointerEvent » ne levait rien et laissait croire que la fermeture ne
     marchait pas. On émet donc un Event ordinaire du bon type. */
  /* testScreens est une constante LOCALE à show() : invisible depuis la page.
     Une première version de ce contrôle bouclait donc sur une liste vide et
     passait au vert alors que le bouton avait disparu de deux écrans. On lit
     donc la liste dans le SOURCE, comme le fait le contrôle de l'énoncé, et on
     refuse de continuer si l'extraction rend une liste invraisemblable. */
  const ecransEx = ((lire(CIBLE).match(/const testScreens\s*=\s*\[([^\]]*)\]/) || [])[1] || '')
    .split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);

  verifierEval(w, 'la fenêtre des tables s’ouvre partout et ne reste ouverte que là où il faut', `(function(){
    const ECRANS=${JSON.stringify(ecransEx)};
    if(ECRANS.length<10) return 'liste des écrans d\\'exercice illisible ('+ECRANS.length+') : le contrôle serait aveugle';
    if(typeof ouvrirTables!=='function') return 'ouvrirTables() n\\'existe pas';
    const vus=[];
    /* 1. le contenu : 8 tables, 80 produits, tous justes */
    ouvrirTables();
    const blocs=document.querySelectorAll('#tablesCorps .tables-bloc');
    if(blocs.length!==8) vus.push(blocs.length+' tables au lieu de 8');
    const titres=Array.from(blocs).map(function(b){ return b.querySelector('h4').textContent.replace(/\\D/g,''); }).join(',');
    if(titres!=='2,3,4,5,6,7,8,9') vus.push('tables affichées : '+titres);
    let faux=0, lignes=0;
    blocs.forEach(function(b){
      const t=+b.querySelector('h4').textContent.replace(/\\D/g,'');
      b.querySelectorAll('.tables-ligne').forEach(function(l,i){
        lignes++; if(+l.querySelector('b').textContent!==t*(i+1)) faux++;
      });
    });
    if(lignes!==80) vus.push(lignes+' lignes au lieu de 80');
    if(faux) vus.push(faux+' produit(s) FAUX');
    fermerTables();
    /* 2. le bouton, sur chaque écran d'exercice */
    const sans=[];
    ECRANS.forEach(function(nom){
      show(nom);
      if(!document.querySelector('#scr-'+nom+' .tables-btn')) sans.push(nom);
    });
    if(sans.length) vus.push('aucun bouton sur : '+sans.join(', '));
    /* 3. les deux bords, chacun exercé */
    const clic=function(el){ if(el) el.dispatchEvent(new Event('pointerdown',{bubbles:true})); };
    show('tm'); ouvrirTables();
    clic(document.getElementById('tmInput'));
    if(tablesOuvertes()) vus.push('sur les tables, revenir au calcul ne la referme pas');
    show('tm'); ouvrirTables();
    clic(document.querySelector('#tablesCorps .tables-bloc'));
    if(!tablesOuvertes()) vus.push('un clic DANS la fenêtre la referme');
    show('ptest'); ouvrirTables();
    clic(document.getElementById('scr-ptest'));
    if(!tablesOuvertes()) vus.push('ailleurs, elle se referme alors qu\\'elle devrait rester');
    fermerTables();
    /* 4. quitter l'exercice la referme */
    show('tm'); ouvrirTables(); show('home');
    if(tablesOuvertes()) vus.push('quitter l\\'exercice ne la referme pas');
    return vus.join(' | ');
  })()`, v => v === '', undefined);

  /* ---- Le tirage des additions-soustractions ---------------------------
     Un nombre à TROIS chiffres, un nombre à DEUX chiffres, et une addition sur
     deux. « Une fois sur deux » est pris au pied de la lettre : le tirage est
     équilibré, pas tiré à pile ou face à chaque question — sinon une séance sur
     cinquante serait faite de huit additions d'affilée, et l'élève n'aurait pas
     travaillé ce qu'on visait. Le contrôle exige donc l'équilibre EXACT sur
     chaque séance, et pas seulement en moyenne : une moyenne juste ne dit rien
     de ce qu'un élève reçoit un soir. */
  verifierEval(w, 'les additions-soustractions alternent, sont bien posées et n’ont de case qu’où il faut', `(function(){
    if(typeof tirageAddSub!=='function') return 'tirageAddSub() n\\'existe pas';
    let plus=0, moins=0, horsFormat=0, faux=0, desequilibres=0, sansRetenue=0, ordre=0;
    for(let s=0;s<2000;s++){
      const q=tirageAddSub(10);
      if(q.length!==10){ horsFormat++; continue; }
      let p=0;
      q.forEach(function(x){
        const m=/^(\\d+) ([+\\u2212]) (\\d+)$/.exec(x.text);
        if(!m){ horsFormat++; return; }
        const a=+m[1], b=+m[3];
        if(a<100||a>999||b<10||b>99) horsFormat++;
        if((m[2]==='+'?a+b:a-b)!==x.answer) faux++;
        /* Il faut TOUJOURS une retenue : sans elle le calcul se fait chiffre à
           chiffre et n'exerce rien. Recalculée ici, et non lue sur la fonction
           de la page : le contrôle doit pouvoir contredire le code. */
        const ua=a%10, ub=b%10, da=Math.floor(a/10)%10, db=Math.floor(b/10)%10;
        const aRetenue = (m[2]==='+') ? ((ua+ub>=10)||(da+db>=10)) : ((ua<ub)||(da<db));
        if(!aRetenue) sansRetenue++;
        if(m[2]==='+'){ plus++; p++; } else moins++;
      });
      if(p!==5) desequilibres++;
      /* On ALTERNE, en commençant par une addition : l'élève passe d'une
         technique à l'autre à chaque calcul. Un tirage mélangé donnerait le
         même total mais pas le même exercice. */
      q.forEach(function(x,i){ if((x.text.indexOf('+')>=0)!==(i%2===0)) ordre++; });
    }
    /* L'opération est POSÉE : le générateur doit fournir, en plus du résultat,
       les chiffres de chaque colonne et les retenues attendues. On les
       RECALCULE ici plutôt que d'appeler la fonction de la page — un contrôle
       qui demande au code de se juger ne peut pas le contredire. */
    let posee=0;
    for(let s=0;s<400;s++) tirageAddSub(10).forEach(function(q){
      const r = q.plus ? q.a+q.b : q.a-q.b;
      if(q.res.join('')!==String(r)) posee++;
      if(q.ha*100+q.da*10+q.ua!==q.a || q.db*10+q.ub!==q.b) posee++;
      if(q.plus){
        const c1=(q.ua+q.ub>=10)?1:0, c2=(q.da+q.db+c1>=10)?1:0, c3=(q.ha+c2>=10)?1:0;
        if(q.ret.d!==c1||q.ret.h!==c2||q.ret.m!==c3) posee++;
      } else {
        const e1=(q.ua<q.ub)?1:0, e2=(q.da<q.db+e1)?1:0;
        if(q.ret.d!==e1||q.ret.h!==e2) posee++;
      }
    });
    /* La grille est en flexbox à cellules de largeur fixe : si les rangées
       n'ont pas TOUTES le même nombre de cellules, le signe et les colonnes se
       décalent — l'opération n'est plus posée, elle est de travers. C'est le
       défaut qu'a eu la première version. On vérifie sur les quatre formes :
       addition, soustraction, addition qui déborde à quatre chiffres, et
       soustraction dont le résultat n'a qu'un chiffre. */
    let grille=[], vus0=[];
    const vraiesQ=test.questions, vraiIdx=test.idx, vraiKind=test.kind;
    [[true,347,58],[false,432,87],[true,978,45],[false,102,97]].forEach(function(c){
      const plus=c[0], a=c[1], b=c[2];
      const r=plus?a+b:a-b, ua=a%10, da=Math.floor(a/10)%10, ha=Math.floor(a/100), ub=b%10, db=Math.floor(b/10);
      let ret;
      if(plus){ const c1=(ua+ub>=10)?1:0,c2=(da+db+c1>=10)?1:0,c3=(ha+c2>=10)?1:0; ret={d:c1,h:c2,m:c3}; }
      else { const e1=(ua<ub)?1:0,e2=(da<db+e1)?1:0; ret={d:e1,h:e2,m:0}; }
      test.kind='asp'; test.idx=0;
      test.questions=[{plus:plus,a:a,b:b,ua:ua,da:da,ha:ha,ub:ub,db:db,ret:ret,
        res:String(r).split('').map(Number),text:a+(plus?' + ':' - ')+b,answer:r}];
      show('asptest'); renderASPTest();
      const rangees=[].slice.call(document.querySelectorAll('#aspHost .mp-row'));
      const n=rangees.map(function(x){ return x.children.length; });
      if(n.length && n.some(function(x){ return x!==n[0]; }))
        grille.push(a+(plus?'+':'-')+b+' : rangées de '+n.join(','));
      const cases=document.querySelectorAll('#aspHost .mp-box').length;
      if(cases!==String(r).length) grille.push(a+(plus?'+':'-')+b+' : '+cases+' case(s) pour '+String(r).length+' chiffre(s)');
    });
    /* La retenue de la SOUSTRACTION s'écrit DEUX fois — le petit 1 devant le
       chiffre du haut, et le même en « +1 » devant le chiffre du bas de la
       colonne SUIVANTE. C'est le geste du cahier, et c'est ce qui manquait :
       la première version ne posait qu'une case, au-dessus de la colonne,
       c'est-à-dire à l'endroit de l'ADDITION — indéchiffrable pour un élève.
       On vérifie donc que chaque retenue est présente aux deux endroits, avec
       la même valeur attendue, et décalée d'exactement une colonne. */
    let deux=[];
    test.kind='asp'; test.idx=0;
    test.questions=[{plus:false,a:432,b:87,ua:2,da:3,ha:4,ub:7,db:8,
                     ret:{d:1,h:1,m:0},res:[3,4,5],text:'432 - 87',answer:345}];
    show('asptest'); renderASPTest();
    (function(){
      const rangees=[].slice.call(document.querySelectorAll('#aspHost .mp-row'));
      if(rangees.length<3){ deux.push('grille incomplète'); return; }
      const marques=function(r){ return [].slice.call(r.children).map(function(c){
        const i=c.querySelector('.asp-ret');
        return i ? {exp:i.dataset.exp, plus:!!c.querySelector('.asp-plus')} : null; }); };
      const haut=marques(rangees[0]), bas=marques(rangees[1]);
      if(document.querySelectorAll('#aspHost .mp-carry').length)
        deux.push('la soustraction porte encore une rangée de retenues au-dessus');
      haut.forEach(function(m,i){
        if(!m) return;
        if(m.plus) deux.push('la marque du HAUT porte un « + »');
        const v=bas[i-1];                       /* une colonne à gauche */
        if(!v) deux.push('la retenue de la colonne '+i+' ne redescend pas sur le nombre du bas');
        else{
          if(!v.plus) deux.push('la marque du BAS n\\'affiche pas « + »');
          if(v.exp!==m.exp) deux.push('haut='+m.exp+' mais bas='+v.exp+' : ce n\\'est pas la même retenue');
        }
      });
      if(!haut.filter(Boolean).length) deux.push('aucune marque sur le nombre du haut');
      /* et l'addition, elle, garde sa rangée au-dessus */
      test.questions=[{plus:true,a:347,b:58,ua:7,da:4,ha:3,ub:8,db:5,
                       ret:{d:1,h:1,m:0},res:[4,0,5],text:'347 + 58',answer:405}];
      renderASPTest();
      if(!document.querySelectorAll('#aspHost .mp-carry').length)
        deux.push('l\\'addition a perdu sa rangée de retenues');
      if(document.querySelectorAll('#aspHost .asp-ret').length)
        deux.push('l\\'addition porte les marques de la soustraction');
    })();
    if(deux.length) vus0.push('retenue de soustraction — '+deux.join(' ; '));

    /* Aucune case de retenue là où il n'y en a pas : une case vide à remplir de
       rien n'apprend rien (décision de Turquet, août 2026). On pose donc une
       opération dont UNE SEULE colonne porte une retenue, et on compte.
       Les deux bords : trop de cases, et plus assez. */
    let cases=[];
    [ {nom:'addition, retenue aux seules unités', q:{plus:true,a:342,b:19,ua:2,da:4,ha:3,ub:9,db:1,
        ret:{d:1,h:0,m:0},res:[3,6,1],text:'342 + 19',answer:361}, attendu:1},
      {nom:'soustraction, emprunt aux seules unités', q:{plus:false,a:342,b:19,ua:2,da:4,ha:3,ub:9,db:1,
        ret:{d:1,h:0,m:0},res:[3,2,3],text:'342 - 19',answer:323}, attendu:2}
    ].forEach(function(c){
      test.kind='asp'; test.idx=0; test.questions=[c.q];
      show('asptest'); renderASPTest();
      const n=document.querySelectorAll('#aspHost .mp-carry, #aspHost .asp-ret').length;
      if(n!==c.attendu) cases.push(c.nom+' : '+n+' case(s) au lieu de '+c.attendu);
      const plusVides=[].slice.call(document.querySelectorAll('#aspHost .asp-plus')).length;
      if(!c.q.plus && plusVides!==1) cases.push(c.nom+' : '+plusVides+' signe(s) « + » au lieu de 1');
    });
    if(cases.length) vus0.push('cases inutiles — '+cases.join(' ; '));

    test.questions=vraiesQ; test.idx=vraiIdx; test.kind=vraiKind;

    const vus=[];
    if(posee) vus.push(posee+' incohérence(s) entre les colonnes et le résultat');
    if(grille.length) vus.push('grille de travers — '+grille.join(' ; '));
    vus0.forEach(function(x){ vus.push(x); });
    if(horsFormat) vus.push(horsFormat+' calcul(s) hors du format 3 chiffres ± 2 chiffres');
    if(faux)       vus.push(faux+' réponse(s) fausse(s)');
    if(sansRetenue) vus.push(sansRetenue+' calcul(s) SANS retenue');
    if(desequilibres) vus.push(desequilibres+' séance(s) sans 5 additions sur 10');
    if(ordre) vus.push(ordre+' calcul(s) hors de l\\'alternance addition/soustraction');
    if(plus!==moins)  vus.push('au total '+plus+' additions pour '+moins+' soustractions');
    return vus.join(' | ');
  })()`, v => v === '', undefined);

  /* ---- Un devoir peut allonger la séance des tables --------------------
     Le format normal est TM_NB calculs — c'est ce que l'élève trouve au menu.
     Un devoir peut en demander davantage sur le niveau 1, et sur lui seul : le
     niveau 2 tire les produits les plus ratés, sa liste a sa propre logique.
     Trois bords à tenir, et le troisième est le moins évident :
       · le devoir obtient ce qu'il demande ;
       · hors devoir, et dans un devoir sans réglage, rien ne change ;
       · une valeur BRICOLÉE dans la base — le réglage est un simple champ JSON,
         que le professeur ou un curieux peut éditer — ne doit pas produire une
         séance de quatre cents calculs. TM_NB_CHOIX borne les deux côtés :
         l'éditeur ET la relecture. */
  verifierEval(w, 'un devoir peut allonger la séance des tables, dans des bornes', `(function(){
    if(typeof tmNbDevoir!=='function') return 'tmNbDevoir() n\\'existe pas';
    const vrai=mesDevoirs, dm=currentDM, tid=currentTestId;
    mesDevoirs=[{id:'d20',exercices:[{id:'tables-multiplication',modes:['train'],nb:20}]},
                {id:'d10',exercices:[{id:'tables-multiplication',modes:['train']}]},
                {id:'dbric',exercices:[{id:'tables-multiplication',modes:['train'],nb:400}]}];
    currentTestId='tables-multiplication';
    const lu=function(d){ currentDM=d; return tmNbDevoir(); };
    const vus=[];
    if(lu('d20')!==20)      vus.push('le devoir qui demande 20 en obtient '+lu('d20'));
    if(lu('d10')!==TM_NB)   vus.push('un devoir sans réglage donne '+lu('d10')+' au lieu de '+TM_NB);
    if(lu('dbric')!==TM_NB) vus.push('un réglage bricolé (400) passe : '+lu('dbric'));
    if(lu(null)!==TM_NB)    vus.push('hors devoir, la séance fait '+lu(null)+' au lieu de '+TM_NB);
    /* le tirage doit VRAIMENT en produire autant, et sans doublon */
    const plus=Math.max.apply(null,TM_NB_CHOIX);
    const t=tmTirage(plus);
    if(t.length!==plus) vus.push('le tirage rend '+t.length+' calculs pour '+plus+' demandés');
    const vusPaires={};
    t.forEach(function(it){ const k=Math.min(it.a,it.b)+'x'+Math.max(it.a,it.b); vusPaires[k]=(vusPaires[k]||0)+1; });
    if(Object.keys(vusPaires).length!==t.length) vus.push('le tirage répète un produit');
    /* et le réglage ne se propose que là où il a un sens */
    if(typeof renderDmEditor==='function' && !/TM_ID_NB/.test(String(renderDmEditor)))
      vus.push('l\\'éditeur propose le nombre de calculs ailleurs que sur les tables de niveau 1');
    mesDevoirs=vrai; currentDM=dm; currentTestId=tid;
    return vus.join(' | ');
  })()`, v => v === '', undefined);

  /* ---- La durée des tables de multiplication n'est écrite qu'une fois ----
     TM_SECONDES commande le minuteur. Le même nombre était pourtant écrit en
     toutes lettres à quatre autres endroits : les deux descriptions du menu,
     un commentaire, et le contexte envoyé au modèle. Le porter de 3 à 4
     secondes en laissait donc trois qui annonçaient encore 3 — l'élève lisait
     une durée, en vivait une autre, et le modèle en racontait une troisième.
     C'est la même maladie que les numéros d'exercice écrits en dur, et elle se
     soigne pareil : un seul endroit, tous les textes le citent.
     Le contrôle lit les textes RENDUS, pas le fichier : un nombre remis en dur
     y apparaîtrait tel quel, et un commentaire n'y apparaît pas du tout. */
  verifierEval(w, 'la durée des tables n’est annoncée que d’après TM_SECONDES', `(function(){
    if(typeof TM_SECONDES!=='number') return 'TM_SECONDES introuvable';
    const vus=[];
    const lire=function(quoi, txt){
      String(txt||'').replace(/(\\d+)\\s*secondes?/g, function(m,n){
        if(Number(n)!==TM_SECONDES) vus.push(quoi+' annonce '+n+' au lieu de '+TM_SECONDES);
        return m;
      });
    };
    lire('la description du niveau 1', TESTS['tables-multiplication'] && TESTS['tables-multiplication'].desc);
    lire('la description du niveau 2', TESTS['tables-multiplication-2'] && TESTS['tables-multiplication-2'].desc);
    /* le contexte envoyé au modèle : on se met sur l'exercice, comme l'élève */
    currentTestId='tables-multiplication'; test.kind='tm';
    test.questions=[{a:7,b:8,text:'7 × 8',answer:56,acquis:false,essais:0,premiere:null}]; test.idx=0;
    try{ lire('le contexte envoyé au modèle', conseilCtxCourant()); }catch(e){ vus.push('contexte illisible : '+e.message); }
    return vus.join(' | ');
  })()`, v => v === '', undefined);

  /* générateurs : mêmes invariants que ceux vérifiés à la main jusqu'ici */
  const audit = w.eval(`(function(){
    const bilan={};
    [['genPercent',5000],['genPctDepart',5000],['genPctTaux',5000],
     ['genAugDepart',5000],['genAugTaux',5000],
     ['genDimDepart',5000],['genDimTaux',5000]].forEach(function(p){
      const nom=p[0], n=p[1]; let pb=0;
      for(let k=0;k<n;k++){
        const q=window[nom]();
        if(q.opts){
          if(q.opts.length!==4) pb++;
          if(new Set(q.opts).size!==4) pb++;
          if(q.bon<0||q.bon>3) pb++;
        }
        if(q.prod!==undefined && q.prod!==q.P*q.N) pb++;
        if(q.result!==undefined && q.result!==Math.round(q.result)) pb++;
        if(q.unit===undefined||q.unit==='') pb++;
      }
      bilan[nom]=pb;
    });
    return JSON.stringify(bilan);
  })()`);
  const bilan = JSON.parse(audit);
  Object.keys(bilan).forEach(nom =>
    verifier('générateur ' + nom + ' : 5000 questions conformes', bilan[nom] === 0, bilan[nom] + ' anomalies'));

  /* fraction et pourcentage : a < b, b divise 100, pourcentage multiple de 5,
     sélections à zéro (elles vivent dans la question pour la reprise) */
  const fpPb = w.eval(`(function(){
    let pb=0;
    for(let k=0;k<5000;k++){
      const q=genFP();
      if([2,4,5,10].indexOf(q.b)<0) pb++;
      if(!(q.a>=1 && q.a<q.b)) pb++;
      if(q.pct!==q.a*100/q.b || q.pct%5!==0) pb++;
      if(q.selL!==0 || q.selR!==0) pb++;
      if(typeof q.v!=='number') pb++;
    }
    return pb;
  })()`);
  verifier('générateur genFP : 5000 questions conformes', fpPb === 0, fpPb + ' anomalies');

  /* série du 3.1.4 : les six fractions d'un même test sont toutes différentes */
  const fpSeriePb = w.eval(`(function(){
    let pb=0;
    for(let k=0;k<3000;k++){
      const qs=genFPSerie(6);
      if(qs.length!==6) pb++;
      const sigs=qs.map(q=>q.a+'/'+q.b);
      if(new Set(sigs).size!==6) pb++;
    }
    return pb;
  })()`);
  verifier('série genFPSerie : 3000 tests de 6 fractions sans répétition', fpSeriePb === 0, fpSeriePb + ' anomalies');

  /* augmenter par l'addition : augmentation entière (P×N divisible par 100),
     somme cohérente, contexte et variante présents */
  const agPb = w.eval(`(function(){
    let pb=0;
    for(let k=0;k<5000;k++){
      const q=genAugAdd();
      if(q.P*q.N%100!==0) pb++;
      if(q.aug!==q.P*q.N/100 || q.aug!==Math.round(q.aug)) pb++;
      if(q.fin!==q.N+q.aug) pb++;
      if(q.unit===undefined||q.unit==='') pb++;
      if(typeof q.v!=='number') pb++;
    }
    return pb;
  })()`);
  verifier('générateur genAugAdd : 5000 questions conformes', agPb === 0, agPb + ' anomalies');

  const di2Pb = w.eval(`(function(){
    let pb=0;
    for(let k=0;k<5000;k++){
      const q=genDimSub();
      if(q.P*q.N%100!==0) pb++;
      if(q.aug!==q.P*q.N/100 || q.aug!==Math.round(q.aug)) pb++;
      if(q.fin!==q.N-q.aug || q.fin<0) pb++;
      if(q.unit===undefined||q.unit==='') pb++;
      if(typeof q.v!=='number') pb++;
    }
    return pb;
  })()`);
  verifier('générateur genDimSub : 5000 questions conformes', di2Pb === 0, di2Pb + ' anomalies');

  /* synthèse : 4 propositions distinctes, bonne réponse indexée, et le calcul
     reste ENTIER pour chacune des quatre propositions, quelle que soit l'inconnue */
  const synPb = w.eval(`(function(){
    let pb=0;
    for(let k=0;k<8000;k++){
      const q=genSyn();
      if(q.opts.length!==4 || new Set(q.opts).size!==4) pb++;
      if(q.opts.indexOf(q.bonV)!==q.bon) pb++;
      if(q.unit===undefined||q.unit==='') pb++;
      if(typeof q.v!=='number') pb++;
      for(let i=0;i<4;i++){
        if(q.inc==='fin') break;                    /* les propositions sont le résultat lui-même */
        const P=(q.inc==='pct')?q.opts[i]:q.P, N=(q.inc==='ini')?q.opts[i]:q.N;
        const a=P*N/100;
        if(a!==Math.round(a)) pb++;
        if(q.sens===-1 && N-a<0) pb++;
      }
    }
    return pb;
  })()`);
  verifier('générateur genSyn : 8000 questions conformes', synPb === 0, synPb + ' anomalies');

  /* propositions vérifiées par le calcul direct : l'augmentation (ou la baisse)
     doit rester ENTIÈRE pour chacune des quatre propositions */
  const a2qAudit = w.eval(`(function(){
    const bilan={};
    [['genAugDepAdd'],['genDimTauxSub'],['genAugTauxAdd'],['genDimDepSub']].forEach(function(p){
      const nom=p[0]; let pb=0;
      for(let k=0;k<5000;k++){
        const q=window[nom]();
        if(q.opts.length!==4 || new Set(q.opts).size!==4) pb++;
        if(q.opts.indexOf(q.type==='pct'?q.P:q.N)!==q.bon) pb++;
        if(q.aug!==q.P*q.N/100 || q.fin!==q.N+(q.sens===-1?-1:1)*q.aug) pb++;
        if(q.unit===undefined||q.unit==='') pb++;
        for(let i=0;i<4;i++){
          const P=(q.type==='pct')?q.opts[i]:q.P, N=(q.type==='pct')?q.N:q.opts[i];
          const a=P*N/100;
          if(a!==Math.round(a)) pb++;
          if(q.sens===-1 && N-a<0) pb++;
        }
      }
      bilan[nom]=pb;
    });
    return JSON.stringify(bilan);
  })()`);
  const a2qB = JSON.parse(a2qAudit);
  Object.keys(a2qB).forEach(nom =>
    verifier('générateur ' + nom + ' : 5000 questions conformes', a2qB[nom] === 0, a2qB[nom] + ' anomalies'));

  /* « Recommencer » doit relancer le MÊME exercice — le kind tm retombait sur
     le calcul mental */
  const relance = w.eval(`(function(){
    let lance='';
    const sauve={tm:startTM, tm2:startTM2, cm:startTest};
    startTM=function(){lance='tm';}; startTM2=function(){lance='tm2';}; startTest=function(){lance='cm';};
    test.kind='tm'; test.tmId='tables-multiplication';   restartCurrentTest(); const a=lance;
    test.tmId='tables-multiplication-2';                 restartCurrentTest(); const b=lance;
    startTM=sauve.tm; startTM2=sauve.tm2; startTest=sauve.cm;
    return a+'/'+b;
  })()`);
  verifier('« Recommencer » relance bien chacune des deux tables', relance === 'tm/tm2', relance);

  /* 2.2 : chaque proposition, bonne ou fausse, doit donner un calcul ENTIER
     (N=10 produisait des leurres 5…9 et des vérifications décimales) */
  const qdPb = w.eval(`(function(){
    let pb=0;
    for(let k=0;k<5000;k++){
      const q=genPctDepart();
      if(q.N===10) pb++;
      q.opts.forEach(function(o){ if(o<=0 || o%10!==0 || (q.P*o)%100!==0) pb++; });
    }
    return pb;
  })()`);
  verifier('2.2 : les 4 propositions donnent toutes un calcul entier', qdPb === 0, qdPb + ' anomalies');

  /* convention des modes dans les poses en colonnes : en ÉVALUATION, aucune
     correction révélée ; en ENTRAÎNEMENT, la case vide est complétée en bleu */
  const modesPose = w.eval(`(function(){
    currentMode='eval';
    test.kind='mp'; test.questions=[genMultPosee()]; test.idx=0; test.score=0; test.answers=[]; test.locked=false;
    show('mtest'); renderMTest();
    checkMAnswer();
    const host=document.getElementById('mpHost');
    const fuites=[...host.querySelectorAll('.mp-box')].filter(b=>b.value.trim()!=='').length
                + host.querySelectorAll('.mp-fix').length;
    currentMode='train'; test.locked=false; test.answers=[]; renderMTest();
    checkMAnswer();
    const bleues=[...document.getElementById('mpHost').querySelectorAll('.mp-box')]
      .filter(b=>b.classList.contains('sol') && b.value.trim()!=='').length;
    return fuites+'|'+bleues;
  })()`);
  const [fuites, bleues] = modesPose.split('|').map(Number);
  verifier('en évaluation, la pose ne révèle rien', fuites === 0, fuites + ' case(s) révélée(s)');
  verifier('en entraînement, la case vide est complétée en bleu', bleues > 0, 'aucune case .sol');

  /* pas de « 52,5 licenciés » : une valeur finale décimale interdit les
     contextes dénombrables (ent:true) dans les quatre générateurs augq */
  const ctxPb = w.eval(`(function(){
    let pb=0;
    ['genAugDepart','genAugTaux','genDimDepart','genDimTaux'].forEach(function(nom){
      for(let k=0;k<5000;k++){
        const q=window[nom]();
        if(q.prodNum%100!==0 && AUGQ_CTX[q.ci].ent) pb++;
      }
    });
    return pb;
  })()`);
  verifier('finale décimale ⇒ jamais d’unité dénombrable (20000 tirages)', ctxPb === 0, ctxPb + ' anomalies');
}

/* ---------- enchaînement ---------- */
console.log('Vérification de ' + CIBLE + '  (' + P.niveau + ')');
structure();
demarrage(() => aide(() => exercices(() => {
  if(P.lacunes.length){
    titre('CE QUE CE NIVEAU N\'A PAS ENCORE');
    P.lacunes.forEach(l => console.log('   · ' + l));
  }
  console.log('\n' + '─'.repeat(58));
  const suffixe = ignores ? ' (' + ignores + ' non applicable' + (ignores > 1 ? 's' : '') + ')' : '';
  console.log(echecs === 0
    ? '✓ ' + controles + ' contrôles passés' + suffixe + '. Le fichier peut être mis en ligne.'
    : '✗ ' + echecs + ' échec(s) sur ' + controles + ' contrôles' + suffixe + '. NE PAS mettre en ligne.');
  process.exit(echecs ? 1 : 0);
})));
