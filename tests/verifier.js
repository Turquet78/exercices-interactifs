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
    verifierEval(w, 'le nom d’un exercice inconnu ne lève pas d’erreur', `(function(){
      try{
        if(typeof testName==='function') testName('exercice-absent-du-registre');
        if(typeof testLabel==='function') testLabel('exercice-absent-du-registre');
        if(typeof testNum==='function') testNum('exercice-absent-du-registre');
        return true;
      }catch(e){ return 'erreur : '+e.message; }
    })()`, v => v === true, undefined);
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

    /* chaque exercice doit fournir son rappel de cours */
    if(P.rappels){
      verifierEval(w, 'chaque exercice a son rappel de cours', P.rappels, v => v === '', undefined);
    } else {
      ignorer('chaque exercice a son rappel de cours', 'ce niveau n\'a pas encore de table RAPPELS (voir les manques)');
    }

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
