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
  verifier(intitule, juge ? juge(r.valeur) : r.valeur === true, detail);
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
    suite();
  });
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

    /* ---- Un devoir qui demande plusieurs fois le même exercice -------------
       « Trois fois les tables niveau 1, puis le niveau 2. » Le verrou n'est pas
       l'écran, c'est la NOTE : elle porte {dm, test} et rien d'autre, si bien que
       deux passages du même exercice y étaient rigoureusement indiscernables.
       Le numéro du passage s'ajoute donc dans l'entonnoir d'enregistrement — pas
       dans les quatorze fins de test, dont la quinzième l'aurait oublié.
       Et une note d'AVANT, écrite sans passage, doit continuer de compter : sans
       cela, porter un exercice de un à trois passages effacerait de l'écran les
       notes déjà obtenues. */
    if(P.devoirPassages){
      const dp = P.devoirPassages;
      verifierEval(w, 'un devoir peut demander plusieurs fois le même exercice', `(function(){
        const dev={id:'dm-ctrl',num:1,actif:true,exercices:[
          {id:'${dp.exercice}',modes:['train'],rep:3},
          {id:'${dp.suivant}',modes:['train'],verrou:true}]};
        const l=passagesDevoir(dev);
        if(l.length!==4) return 'le devoir compte '+l.length+' passages au lieu de 4';
        if(!l.slice(0,3).every(function(p,i){ return p.id==='${dp.exercice}' && p.passe===i+1 && p.sur===3; }))
          return 'les trois passages ne sont pas numérotés 1, 2, 3';
        /* un exercice demandé UNE fois garde passe:null — sa note s'écrit alors
           sans ce champ, exactement comme les devoirs déjà rendus */
        if(l[3].passe!==null) return 'un exercice demandé une seule fois ne doit pas être numéroté';
        return '';
      })()`, v => v === '', undefined);

      verifierEval(w, 'un exercice verrouillé attend que TOUS les précédents soient faits', `(function(){
        const dev={id:'dm-ctrl',num:1,actif:true,exercices:[
          {id:'${dp.exercice}',modes:['train'],rep:3},
          {id:'${dp.suivant}',modes:['train'],verrou:true}]};
        const l=passagesDevoir(dev), fait={};
        const est=function(px){ return !!fait[px.id+'#'+px.passe]; };
        if(!passageOuvert(l,0,est)) return 'le premier passage devrait être ouvert';
        if(passageOuvert(l,3,est)) return 'le verrou ne bloque rien au départ';
        fait['${dp.exercice}#1']=1; fait['${dp.exercice}#2']=1;
        if(passageOuvert(l,3,est)) return 'le verrou s\\'ouvre alors qu\\'un passage manque';
        fait['${dp.exercice}#3']=1;
        if(!passageOuvert(l,3,est)) return 'le verrou reste fermé alors que tout est fait';
        return '';
      })()`, v => v === '', undefined);

      verifierEval(w, 'chaque passage retrouve sa note, et les notes d\'avant comptent', `(function(){
        mesResultats=[
          {percent:60,details:{dm:'dm-ctrl',test:'${dp.exercice}',mode:'train',passe:1}},
          {percent:80,details:{dm:'dm-ctrl',test:'${dp.exercice}',mode:'train',passe:2}}];
        const n=function(p){ const b=dmBest('dm-ctrl','${dp.exercice}','train',p); return b?b.percent:null; };
        if(n(1)!==60 || n(2)!==80) return 'les passages se mélangent : '+n(1)+' et '+n(2);
        if(n(3)!==null) return 'un passage jamais fait rend quand même une note';
        /* la note d'avant, sans passage : elle doit rester lisible au passage 1 */
        mesResultats=[{percent:70,details:{dm:'dm-ctrl',test:'${dp.exercice}',mode:'train'}}];
        if(n(1)!==70) return 'une note écrite avant les passages est perdue';
        if(n(2)!==null) return 'une note sans passage compte pour tous les passages';
        mesResultats=[];
        return '';
      })()`, v => v === '', undefined);

      verifierEval(w, 'le passage est posé par l\'entonnoir, et seulement dans un devoir', `(function(){
        const vues=[];
        sb={ from:function(){ return { insert:function(p){ vues.push(p); return Promise.resolve({error:null}); } }; } };
        REJEU=false;
        currentDM='dm-ctrl'; currentPasse=2;
        enregistrerResultat({eleve_id:1,score:8,total:10,percent:80,duration_sec:9,
          details:{test:'${dp.exercice}',mode:'train',dm:'dm-ctrl'}});
        currentDM=null; currentPasse=null;
        enregistrerResultat({eleve_id:1,score:8,total:10,percent:80,duration_sec:9,
          details:{test:'${dp.exercice}',mode:'train'}});
        if(vues.length!==2) return 'les deux notes ne sont pas parties';
        if(vues[0].details.passe!==2) return 'la note du devoir ne porte pas son passage';
        if(vues[1].details.passe!==undefined) return 'une note hors devoir a reçu un passage';
        return '';
      })()`, v => v === '', undefined);
    } else {
      ignorer('un devoir peut demander plusieurs fois le même exercice',
        'ce niveau n\'a pas l\'éditeur de devoirs qui le permet');
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

    /* Abandon : la note partielle compte comme note. Si elle n'est pas partie,
       jeter le brouillon fait perdre la note ET la session reprenable d'un coup.
       abandonTest délègue à enregistrerNotePartielle, donc les contrôles
       statiques ne voient rien de son corps : il faut l'exercer. */
    let abandon='(sans objet)';
    if(aNote && typeof abandonTest==='function' && typeof clearRecovery==='function' && typeof debutFin==='function'){
      const vraiClear=clearRecovery, vraiConfirm=window.confirm;
      let repondOui=true, jete=false, notes=0;
      window.confirm=function(){ return repondOui; };
      clearRecovery=function(){ jete=true; return Promise.resolve(); };
      const essaiAbandon=async function(noteOk, depart){
        jete=false; notes=0;
        enregistrerNotePartielle=function(){ notes++; return Promise.resolve(noteOk); };
        currentEleve={id:1,prenom:'Contrôle'}; currentMode='train'; currentDM=null;
        test.startTime=depart;
        try{ await abandonTest(); }catch(e){}
      };
      await essaiAbandon(false, 101); const aEchec=jete;
      await essaiAbandon(true,  102); const aSucces=jete;
      await essaiAbandon(null,  103); const aRien=jete;     /* rien à noter : le brouillon peut partir */
      /* deuxième clic sur le MÊME test : le verrou doit refuser la seconde note */
      await essaiAbandon(true,  104);
      try{ await abandonTest(); }catch(e){}
      const double=notes;
      /* « Annuler » dans la boîte de confirmation ne doit PAS consommer le verrou :
         sinon la fin normale du test serait refusée ensuite, et la note perdue. */
      repondOui=false; test.startTime=105;
      try{ await abandonTest(); }catch(e){}
      repondOui=true;
      const verrouLibre=debutFin();
      clearRecovery=vraiClear; window.confirm=vraiConfirm; enregistrerNotePartielle=vraiNote;
      abandon=[aEchec?'echec:jette':'echec:garde', aSucces?'succes:jette':'succes:garde',
               aRien?'rien:jette':'rien:garde', 'double:'+double,
               verrouLibre?'annule:libre':'annule:consomme'].join('|');
    }
    return JSON.stringify({echec:echec, succes:succes, devoir:devoir,
      precoce:(precoce===null?'null':String(precoce)), abandon:abandon});
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
    if(d.abandon === '(sans objet)'){
      ignorer('l’abandon ne jette le brouillon que si la note est enregistrée', 'ce niveau n’enregistre pas de note à l’abandon');
    } else {
      verifier('l’abandon ne jette le brouillon que si la note est enregistrée',
        d.abandon === 'echec:garde|succes:jette|rien:jette|double:1|annule:libre',
        'observé : ' + (d.abandon || '(inconnu)') + ' — attendu ' +
        '« echec:garde|succes:jette|rien:jette|double:1|annule:libre » : une note perdue laisse la session ' +
        'reprenable, un double clic n’écrit qu’une note, et un « Annuler » ne consomme pas le verrou');
    }
    if(d.devoir === '(sans objet)'){
      ignorer('un devoir mis en pause avant d’être commencé n’alarme pas', 'ce niveau n’enregistre pas de note partielle');
    } else {
      verifier('un devoir mis en pause avant d’être commencé n’alarme pas', /✓/.test(d.devoir || ''),
        'messages affichés : ' + (d.devoir || '(aucun)') + ' — « rien à noter » n’est pas un échec');
    }
    suite();
  });
}

/* ---------- 4 bis. Contrôles propres à la Première ---------- */
function premiere(w){
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
