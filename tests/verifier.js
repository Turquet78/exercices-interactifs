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

  /* ---- ...et l'inverse, pour un niveau qui a fait l'autre choix -------------
     Envoyer le contexte rend l'aide utile — sans lui, le modèle ne connaît que
     le NOM de l'exercice et répond à côté de ce que l'élève a sous les yeux.
     Mais le contexte porte les RÉPONSES ATTENDUES, et la fenêtre est ouverte
     dès l'entraînement : sans la clause qui interdit de les révéler, elle
     donnerait gratuitement ce que le barème fait payer au soutien.
     Les deux vont donc ENSEMBLE, et le contrôle les exige ensemble : le
     contexte seul est pire que pas de contexte du tout. */
  if(P.missionAvecContexte){
    const mc = P.missionAvecContexte;
    const f = toutesFonctions.find(x => x.nom === mc.fonction);
    const g = toutesFonctions.find(x => x.nom === mc.appel);
    const soucis = [];
    if(!f) soucis.push(mc.fonction + ' introuvable');
    else if(!new RegExp('\\b' + mc.appel + '\\s*\\(').test(f.texte))
      soucis.push(mc.fonction + ' n’appelle pas ' + mc.appel + '() : la mission part sans le contexte de l’exercice');
    if(!g) soucis.push(mc.appel + ' introuvable');
    else {
      if(!/conseilCtxCourant\s*\(/.test(g.texte))
        soucis.push(mc.appel + '() ne lit pas conseilCtxCourant() : il n’a aucun contexte à envoyer');
      /* La clause de secret, en toutes lettres. On cherche le MOT, pas la
         phrase : la reformuler est permis, la retirer ne l'est pas. */
      if(!/SECRET|SECR\u00c8TES|SECRETES/i.test(g.texte))
        soucis.push(mc.appel + '() n’interdit pas de révéler les réponses attendues');
      if(!/ne les r[ée]v[èe]le jamais/i.test(g.texte))
        soucis.push(mc.appel + '() ne dit pas au modèle de ne jamais révéler la réponse');
    }
    verifier('la question à l’IA emporte le contexte, et l’interdit de le révéler',
      soucis.length === 0, soucis.join(' | '));
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

  /* ---- La porte du professeur n'a plus de bouton -------------------------
     Elle s'ouvre par l'adresse « …#prof », mise en favori (décision de
     Turquet, août 2026). Trois bords, et le troisième est le plus coûteux :
     un professeur enfermé dehors.
       · aucun attribut d'événement ne doit mener à l'écran du professeur —
         un bouton remis « pour dépanner » rouvrirait la porte à la classe
         entière sans que personne ne s'en aperçoive ;
       · le fragment est le MÊME sur les trois niveaux : le professeur n'a
         qu'une habitude, pas trois ;
       · et l'écran « Choisis ton rôle » ayant disparu, plus rien ne doit le
         nommer. Un show('home') oublié ne lève pas une erreur discrète : il
         cherche un écran absent, $('scr-home') vaut null, et la navigation se
         fige sur place. */
  const versProf = [...s.matchAll(/on[a-z]+="[^"]*"/g)]
    .filter(m => /show\(\s*'teacher-login'\s*\)/.test(m[0]))
    .map(m => ligneDe(m.index));
  verifier('aucun bouton de la page ne mène à l’écran du professeur',
    versProf.length === 0, 'ligne(s) ' + versProf.join(', ') + ' — la porte doit rester sans poignée');

  const fragment = (s.match(/const ENTREE_PROF\s*=\s*'([^']*)'/) || [])[1];
  verifier('la porte du professeur s’ouvre par « #prof »',
    fragment === '#prof', 'fragment déclaré : ' + JSON.stringify(fragment));

  const restes = [...s.matchAll(/scr-home|show\(\s*'home'\s*\)/g)].map(m => ligneDe(m.index));
  verifier('plus rien ne renvoie à l’écran d’accueil supprimé',
    restes.length === 0, 'ligne(s) ' + restes.join(', ') + ' — show() y figerait la navigation');

  /* ---- La page d'aiguillage du professeur -------------------------------
     prof.html rassemble les trois niveaux derrière un seul favori. Elle demande
     le mot de passe AVANT de montrer les trois portes (décision de Turquet,
     août 2026) — le même mot de passe, vérifié par le même serveur : ce n'est
     pas un verrou de plus, c'est le même, posé un cran plus tôt.
     Elle vit à côté des trois pages sans que rien ne l'y relie, d'où quatre
     bords.
       · le fragment qu'elle pose doit être celui que CETTE page attend. S'ils
         divergeaient, le bouton ouvrirait la connexion des ÉLÈVES, sans la
         moindre erreur nulle part ;
       · l'adresse du projet, la clé publique et le courriel du compte y sont
         écrits une QUATRIÈME fois. Divergents, la page d'aiguillage
         refuserait le bon mot de passe — ou pire, ouvrirait une session sur un
         autre projet — sans rien dire ;
       · le retour vers elle ne part que du TABLEAU DE BORD, jamais d'un écran
         d'élève : un lien posé ailleurs remettrait le bouton « Je suis le
         professeur » retiré à dessein, par un autre chemin ;
       · et ce retour ne doit pas fermer la session au passage, sinon la page
         redemande le mot de passe à chaque changement de niveau. */
  let aiguillage;
  try{ aiguillage = fs.readFileSync(path.join(__dirname, '..', 'prof.html'), 'utf8'); }
  catch(e){ aiguillage = undefined; }
  verifier('la page d’aiguillage mène à ce niveau, avec le fragment qu’il attend',
    !!aiguillage && !!fragment && aiguillage.includes('href="' + CIBLE + fragment + '"'),
    aiguillage === undefined ? 'prof.html est introuvable'
      : 'prof.html ne contient pas href="' + CIBLE + (fragment || '(fragment inconnu)') + '"');

  /* Les trois valeurs de configuration, comparées à celles de CETTE page. */
  const lireConst = (texte, nom) => {
    const m = (texte || '').match(new RegExp('const\\s+' + nom + '\\s*=\\s*"([^"]*)"'));
    return m ? m[1] : null;
  };
  for(const nom of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'COURRIEL_PROF']){
    const ici = lireConst(s, nom), la = lireConst(aiguillage, nom);
    verifier('prof.html porte le même ' + nom + ' que cette page',
      !!ici && ici === la,
      'ici ' + JSON.stringify(ici) + ', dans prof.html ' + JSON.stringify(la));
  }

  /* prof.html ne montre les trois niveaux qu'APRÈS le mot de passe : la carte
     qui les porte est cachée dans le fichier servi. Une carte livrée visible
     s'ouvrirait à qui tombe sur l'adresse — et rien ne rougirait. */
  verifier('prof.html livre ses trois niveaux cachés, derrière le mot de passe',
    !!aiguillage && /id="carte-niveaux"[^>]*\shidden/.test(aiguillage),
    'la carte des trois niveaux doit porter « hidden » dans le fichier servi');
  verifier('prof.html fait vérifier le mot de passe par le serveur',
    !!aiguillage && /sb\.auth\.signInWithPassword/.test(aiguillage)
      && /from\('professeurs'\)/.test(aiguillage),
    'la page d’aiguillage doit demander son avis à Supabase, pas à elle-même');
  /* Le dépôt est PUBLIC : un mot de passe écrit dans cette page serait lisible
     par n'importe qui, et « Afficher la source » rouvrirait le tableau de bord.
     Deux formes possibles — une constante qui le porte, ou une comparaison faite
     dans la page. Aucune des deux n'a le droit d'exister. */
  const motEnDur = !!aiguillage && (
        /const\s+[A-Z_]*(MOT_DE_PASSE|CODE_ACCES|CODE_PROF|MOTDEPASSE)[A-Z_]*\s*=/.test(aiguillage)
     || /(mdp|motdepasse|pass|code)\s*===?\s*['"]/i.test(aiguillage));
  verifier('prof.html ne contient aucun mot de passe',
    !!aiguillage && !motEnDur,
    'le dépôt est public : un mot de passe écrit là serait lisible par tout le monde');

  /* Le retour vers prof.html : uniquement depuis le tableau de bord. */
  const qth = toutesFonctions.find(f => f.nom === 'quitToHome');
  const dansQuit = !!qth && /prof\.html/.test(qth.texte);
  const finQuit = qth ? qth.debut + qth.texte.length : -1;
  /* On ne cherche que les prof.html ENTRE GUILLEMETS : une adresse qu'on suit,
     pas un commentaire qui la nomme. */
  const horsQuit = [...s.matchAll(/(['"`])[^'"`\n]*prof\.html[^'"`\n]*\1/g)]
    .filter(m => !(qth && m.index >= qth.debut && m.index < finQuit))
    .map(m => ligneDe(m.index));
  verifier('seul « Quitter » du tableau de bord ramène à la page d’aiguillage',
    dansQuit && horsQuit.length === 0,
    !dansQuit ? 'quitToHome ne ramène pas à prof.html'
              : 'ligne(s) ' + horsQuit.join(', ') + ' — un élève ne doit jamais y être conduit');
  verifier('« Quitter » ne ferme pas la session : le professeur change de niveau sans retaper',
    !!qth && !/fermerSession|signOut/.test(qth.texte),
    'quitToHome referme la session — prof.html redemanderait le mot de passe à chaque niveau');
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
  /* Le script de reliage (supabase/relier-comptes.sql) recalcule l'adresse
     des comptes à partir de la clé : le domaine y vit une TROISIÈME fois.
     S'il divergeait, le script ne relierait plus personne — sans erreur. */
  let domSql;
  try{
    domSql = (fs.readFileSync(path.join(__dirname, '..', 'supabase/relier-comptes.sql'), 'utf8')
      .match(/dom constant text := '([^']+)'/) || [])[1];
  }catch(e){ domSql = undefined; }
  verifier('le domaine des comptes est le même dans la page, la fonction Edge et le script de reliage',
    !!domPage && domPage === domEdge && domPage === domSql,
    'page : ' + (domPage || '(absent)') + ' — fonction Edge : ' + (domEdge || '(absent)')
      + ' — relier-comptes.sql : ' + (domSql || '(absent)'));

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

  /* PAS DEUX FOIS LA MÊME CLÉ DANS LE PROFIL DE CE FICHIER. tests/profils.js
     est un objet littéral : une clé écrite deux fois ne casse rien, la seconde
     l'emporte en silence. Un « suivant » ainsi doublé a fait attendre le banc
     navigateur sur un sélecteur qui n'existait pas — quarante tours de boucle,
     vingt minutes, et pas un mot. node --check passe, l'objet est valide.
     On lit donc le SOURCE, en suivant la profondeur des accolades. */
  const profSrc = fs.readFileSync(path.join(__dirname, 'profils.js'), 'utf8');
  const debut = profSrc.indexOf("'" + CIBLE + "': {");
  const doublons = [];
  if(debut >= 0){
    let prof = 0, i = profSrc.indexOf('{', debut), fin = i;
    for(; fin < profSrc.length; fin++){
      const ch = profSrc[fin];
      if(ch === '{') prof++;
      else if(ch === '}'){ prof--; if(prof === 0) break; }
    }
    const bloc = profSrc.slice(i, fin);
    /* Une pile de dictionnaires : un par objet ouvert. Les chaînes et les
       commentaires sont retirés d'abord — « http:// » et « ? a : b » y
       passeraient pour des clés. */
    const propre = bloc.replace(/\/\*[\s\S]*?\*\//g, ' ')
                       .replace(/\/\/[^\n]*/g, ' ')
                       .replace(/`(?:\\.|[^`\\])*`/g, '``')
                       .replace(/"(?:\\.|[^"\\])*"/g, '""')
                       .replace(/'(?:\\.|[^'\\])*'/g, "''");
    const pile = [];
    const re = /([{}])|(?:^|[,{\s])([A-Za-z_$][\w$]*)\s*:/g;
    let m;
    while((m = re.exec(propre))){
      if(m[1] === '{'){ pile.push(new Set()); continue; }
      if(m[1] === '}'){ pile.pop(); continue; }
      const cle = m[2];
      if(!pile.length) continue;
      const vues = pile[pile.length - 1];
      if(vues.has(cle)) doublons.push(cle);
      else vues.add(cle);
    }
  }
  verifier('le profil de ce fichier n’a pas deux fois la même clé',
    debut >= 0 && doublons.length === 0,
    debut < 0 ? 'profil introuvable dans tests/profils.js'
              : 'clé(s) en double : ' + [...new Set(doublons)].join(', '));

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
      /* deux écrans qui existent partout : « home » a disparu avec le bouton du professeur */
      try{ show('space'); avant=((document.querySelector('.screen.on')||{}).id)||''; }catch(e){}
      try{ show('login'); apres=((document.querySelector('.screen.on')||{}).id)||''; }catch(e){}
      fermerFenetresIA=vrai;
      if(!avant) return 'le premier show() n’a rien affiché';
      return avant!==apres ? true : 'la navigation est restée sur '+avant;
    })()`, v => v === true || v === 'sans objet', undefined);
    /* Et le démarrage AIGUILLE : sans fragment il ouvre la connexion de l'élève,
       avec « #prof » il ouvre celle du professeur. Le contrôle statique dit que
       le fragment est déclaré ; celui-ci dit qu'il ouvre quelque chose — c'est
       la seule porte qui reste, et un professeur enfermé dehors n'aurait aucun
       autre chemin. */
    verifierEval(w, 'le démarrage ouvre la connexion de l’élève, et « #prof » celle du professeur', `(function(){
      if(typeof demarrer!=='function') return 'demarrer() manque';
      const vu=function(){ return ((document.querySelector('.screen.on')||{}).id)||'(aucun)'; };
      let libre='', prof='';
      try{ location.hash=''; demarrer(); libre=vu(); }catch(e){ return 'sans fragment : '+e.message; }
      try{ location.hash='#prof'; demarrer(); prof=vu(); }catch(e){ return 'avec #prof : '+e.message; }
      try{ location.hash=''; }catch(e){}
      return libre+' / '+prof;
    })()`, v => v === 'scr-login / scr-teacher-login',
       'attendu « scr-login / scr-teacher-login » : la page doit s’ouvrir sur l’élève, et sur le professeur avec le fragment');
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


  /* ---- « Montre-moi un exemple de rédaction » est offerte PARTOUT ---------
     C'est une aide dont aucun exercice ne doit être privé (décision de
     Turquet, août 2026) : un élève bloqué demande d'abord à voir comment on
     rédige. Le piège est qu'elle ne peut pas vivre dans QIA_SUGG — une liste
     à tenir exercice par exercice finit toujours par en oublier un, et c'est
     celui-là qui en aurait eu besoin. Elle est donc posée par
     qiaSuggestions() en tête de la liste, quoi qu'il arrive.
     On éprouve CHAQUE liste, y compris « gen » (le repli d'un exercice sans
     entrée) et un kind inconnu : c'est par là qu'un nouvel exercice passe.
     Et on exige qu'elle n'apparaisse qu'UNE fois — une liste qui la
     recopierait afficherait deux boutons identiques. */
  verifierEval(w, 'chaque exercice propose « un exemple de rédaction » à l’IA', `(function(){
    if(typeof qiaSuggestions!=='function') return 'qiaSuggestions() introuvable';
    if(typeof QIA_EXEMPLE!=='string' || !QIA_EXEMPLE.trim()) return 'QIA_EXEMPLE introuvable : aucune demande d\\'exemple n\\'est offerte';
    const vus=[], kindSauve=test&&test.kind, idSauve=(typeof currentTestId!=='undefined')?currentTestId:null;
    const cles=Object.keys(QIA_SUGG).concat(['kind-inconnu-du-controle']);
    cles.forEach(function(k){
      try{
        test.kind=k;
        if(typeof currentTestId!=='undefined') currentTestId=(QIA_SUGG[k]?k:'');
        const l=qiaSuggestions()||[], n=l.filter(function(t){ return t===QIA_EXEMPLE; }).length;
        if(n===0) vus.push(k+' : la demande d\\'exemple n\\'est pas proposée du tout');
        else if(l[0]!==QIA_EXEMPLE) vus.push(k+' : la demande d\\'exemple n\\'est pas en tête ('+l[0]+')');
        else if(n>1) vus.push(k+' : la demande d\\'exemple est proposée '+n+' fois');
      }catch(e){ vus.push(k+' : '+e.message); }
    });
    if(test) test.kind=kindSauve;
    if(idSauve!==null && typeof currentTestId!=='undefined') currentTestId=idSauve;
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);

  /* ---- Le modèle parle simplement, sans qu'on le lui demande -------------
     Le conseil du soutien et la réponse de la fenêtre « Question à l'IA »
     s'écrivent TOUJOURS en français simple (décision de Turquet, août 2026).
     C'est un renversement : ces deux aides portaient un bouton « Explique-moi
     plus simplement », et le bouton supposait que l'élève sache qu'il a le
     droit de le demander — celui qui en a le plus besoin est justement celui
     qui n'ose pas.

     Il n'y a plus de bouton nulle part, rappel de cours compris. Le rappel
     n'est pas une réponse du modèle — c'est du HTML écrit à la main —, il
     reste donc tel que le professeur l'a écrit : c'est un arbitrage assumé,
     pas un oubli.

     Deux bords. La consigne peut MANQUER dans l'une des deux aides : rien ne
     casse, elle reparle comme avant, et seul un élève s'en apercevrait. Et le
     bouton peut REVENIR — un second chemin vers la même chose, qui se
     contredirait avec la consigne le jour où l'une des deux changerait.
     On EXÉCUTE les deux aides et on relit ce qui part vraiment. */
  verifierEval(w, 'le conseil et la question à l’IA parlent simplement, sans bouton', `(function(){
    if(typeof LANGUE_SIMPLE!=='string' || LANGUE_SIMPLE.trim().length<200)
      return 'LANGUE_SIMPLE introuvable ou trop courte : les aides ne disent pas comment écrire';
    const vus=[];
    /* Ce qui PART vraiment, aide par aide. */
    const sbSauve=sb, sauve=currentEleve;
    let parti='';
    sb={ functions:{ invoke:function(n,o){ parti=(o&&o.body&&o.body.contexte)||''; return new Promise(function(){}); } } };
    currentEleve={id:'e-controle',prenom:'Contrôle'};
    const temoin='CONTEXTE-TEMOIN-DU-BANC';
    /* 1. le conseil du soutien */
    if(typeof lancerConseil!=='function') vus.push('lancerConseil() introuvable');
    else {
      const fb=document.createElement('div'); document.body.appendChild(fb);
      parti=''; conseilBusy=false;
      try{ if(lancerConseil.length>=3) lancerConseil('', temoin, fb); else lancerConseil(temoin, fb); }
      catch(e){ vus.push('le conseil lève : '+e.message); }
      conseilBusy=false;
      if(parti.indexOf(temoin)<0) vus.push('le conseil n\\'envoie pas son contexte : le contrôle ne mesure rien');
      else if(parti.indexOf(LANGUE_SIMPLE)<0) vus.push('le conseil du soutien ne dit pas au modèle d\\'écrire simplement');
      try{ fb.remove(); }catch(e){}
    }
    /* 2. la fenêtre « Question à l'IA » */
    if(typeof qiaEnvoyer!=='function') vus.push('qiaEnvoyer() introuvable');
    else {
      let d=document.getElementById('qiaDialog');
      if(!d){ d=document.createElement('div'); d.id='qiaDialog'; document.body.appendChild(d); }
      let inp=document.getElementById('qiaInput');
      if(!inp){ inp=document.createElement('input'); inp.id='qiaInput'; document.body.appendChild(inp); }
      inp.value='Comment on fait pour trouver la réponse ?';
      parti=''; qiaBusy=false;
      try{ qiaEnvoyer(); }catch(e){ vus.push('la fenêtre d\\'aide lève : '+e.message); }
      qiaBusy=false;
      if(!parti) vus.push('la fenêtre d\\'aide n\\'envoie rien : le contrôle ne mesure rien');
      else if(parti.indexOf(LANGUE_SIMPLE)<0) vus.push('la fenêtre « Question à l\\'IA » ne dit pas au modèle d\\'écrire simplement');
    }
    sb=sbSauve; currentEleve=sauve;
    /* 3. et le bouton ne revient NULLE PART. Il n'y en a plus : les deux aides
          parlent simplement d'elles-mêmes, et le rappel de cours reste tel que
          le professeur l'a écrit (décision de Turquet, août 2026). Un bouton
          remis « pour dépanner » sur l'une des aides serait un second chemin
          vers la même chose, et le jour où la consigne changerait, les deux se
          contrediraient. */
    if(typeof simpleBtnHTML!=='undefined' || typeof expliquerSimplement!=='undefined')
      vus.push('le bouton « Explique-moi plus simplement » est revenu : les aides parlent déjà simplement');
    if(typeof rappelHTML!=='function' || typeof RAPPELS==='undefined') vus.push('rappelHTML() ou RAPPELS introuvable');
    else {
      const k=Object.keys(RAPPELS)[0];
      if(test) test.kind=k;
      const h=String(rappelHTML()||'');
      if(!h.trim()) vus.push('aucun rappel de cours : le contrôle ne mesure rien');
      else if(h.indexOf('btn-simple')>=0) vus.push('le rappel de cours repose un bouton');
    }
    /* La consigne ne doit pas rouvrir ce que les garde-fous ferment. */
    if(!/ni r\u00e9sultat|ni réponse attendue/.test(LANGUE_SIMPLE))
      vus.push('LANGUE_SIMPLE ne rappelle pas qu\\'écrire simplement n\\'autorise pas à donner le résultat');
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);

  /* ---- {somme-fractions} : les deux opérations alternent -----------------
     L'élève passe d'une technique à l'autre à chaque question, au lieu de
     tomber six fois de suite sur la même (décision de Turquet, août 2026).
     Tiré au hasard, le même total sortait — mais pas le même exercice.
     Deux bords : l'ALTERNANCE, et le fait que ça commence par une addition.
     On appelle le vrai tirage, plusieurs fois : un générateur qui retomberait
     sur son repli doit alterner lui aussi. */
  if(src.indexOf('function sfBuildQuestions') >= 0){
    verifierEval(w, '{somme-fractions} alterne addition et soustraction', `(function(){
      for(let essai=0; essai<40; essai++){
        const qs=sfBuildQuestions();
        if(!qs.length) return 'aucune question tirée : le contrôle ne mesure rien';
        for(let i=0;i<qs.length;i++){
          const attendu = (i%2===0) ? '+' : '−';
          if(qs[i].op!==attendu)
            return 'question '+(i+1)+' : « '+qs[i].op+' » au lieu de « '+attendu+' »';
        }
      }
      return '';
    })()`, v => v === '', undefined);
  } else {
    ignorer('{somme-fractions} alterne addition et soustraction',
      'ce niveau n’a pas l’exercice de somme de fractions');
  }

  /* ---- Le NOMBRE de questions des exercices de fractions -----------------
     4 par exercice en Seconde, du 4.2 au 4.9 (demande de Turquet, août 2026) ;
     la Première garde 6. DEUX sources : la page a ses constantes (SF_NB,
     MLT_NB), le banc compare à tests/profils.js — lire la constante de la page
     et la comparer à elle-même ne prouverait rien. */
  /* ---- Le NOMBRE de questions des exercices de pourcentages (Première) ---
     4 du 2.1.3 au 2.1.7 (demande de Turquet, août 2026). On appelle les VRAIS
     démarreurs — chacun a sa fabrique, et un nombre changé dans l'une ne dit
     rien des autres. */
  if(P.nbQuestionsPourcentages){
    verifierEval(w, 'les exercices de pourcentages posent le bon nombre de questions', `(function(){
      const attendu=${JSON.stringify(P.nbQuestionsPourcentages)}, vus=[];
      currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
      const essais=[['2.1.3','startPercent'],['2.1.4','startPctDepart'],['2.1.5','startPctTaux'],
                    ['2.1.6','startPctSynthese'],['2.1.7','startPctSyntheseLibre']];
      essais.forEach(function(e){
        if(typeof window[e[1]]!=='function'){ vus.push(e[0]+' : '+e[1]+' absente'); return; }
        window[e[1]]();
        if(!test.questions || test.questions.length!==attendu)
          vus.push(e[0]+' : '+(test.questions?test.questions.length:0)+' questions au lieu de '+attendu);
      });
      return vus.join(' | ');
    })()`, v => v === '', undefined);
  }

  /* ---- 3 questions pour toutes les ÉVOLUTIONS — hausses 2.2.1 à 2.2.8,
     baisses 2.3.1 à 2.3.7, et la synthèse 2.5.1 (demande de Turquet, août
     2026, en trois temps), plus les synthèses rédigées 2.2.9 et 2.3.8 et le
     QCM des coefficients 2.5.2. On appelle les DIX-NEUF vrais démarreurs :
     un nombre changé dans un démarreur partagé ne dit rien des autres. */
  if(P.nbQuestionsEvolutions){
    verifierEval(w, 'les exercices sur les évolutions posent 3 questions, hausses et baisses', `(function(){
      const attendu=${JSON.stringify(P.nbQuestionsEvolutions)}, vus=[];
      currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
      [['2.2.1','startAug'],['2.2.2','startAugAdd'],['2.2.3','startAugDepart'],['2.2.4','startAugDepAdd'],
       ['2.2.5','startAugTaux'],['2.2.6','startAugTauxAdd'],['2.2.7','startHausses'],['2.2.8','startSynAug'],
       ['2.3.1','startDim'],['2.3.2','startDimSub'],['2.3.3','startDimDepart'],['2.3.4','startDimDepSub'],
       ['2.3.5','startDimTaux'],['2.3.6','startDimTauxSub'],['2.3.7','startBaisses'],
       ['2.2.9','startSynAugLibre'],['2.3.8','startSynDimLibre'],['2.5.1','startSyn'],
       ['2.5.2','startReconnaitreCoef']]
      .forEach(function(e){
        if(typeof window[e[1]]!=='function'){ vus.push(e[0]+' : '+e[1]+' absente'); return; }
        window[e[1]]();
        if(!test.questions || test.questions.length!==attendu)
          vus.push(e[0]+' : '+(test.questions?test.questions.length:0)+' questions au lieu de '+attendu);
      });
      return vus.join(' | ');
    })()`, v => v === '', undefined);

    /* ---- {synthese-augmentations} : la synthèse du 2.5.1, HAUSSES seules —
       même moteur, pas même identité. Trois bords : uniquement des hausses,
       les trois inconnues chacune une fois à ordre variable, et
       « Recommencer » qui relance la bonne identité des DEUX synthèses. */
    verifierEval(w, 'les deux synthèses tirent toutes les inconnues, les hausses seules pour 2.2.8, et gardent leur identité', `(function(){
      const vus=[];
      currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
      const ordres={}, famsSyn={};
      for(let t=0;t<30 && !vus.length;t++){
        /* le 2.5.1 suit la même règle des inconnues depuis son passage à 3
           questions — et ses familles restent MÉLANGÉES : une synthèse qui ne
           tirerait plus qu'une famille aurait perdu tout son sujet. Il passe
           AVANT startSynAug : le contrôle d'identité, après la boucle, lit
           l'état du DERNIER démarreur appelé. */
        startSyn();
        const incs2=test.questions.map(function(q){ return q.inc; });
        ['fin','ini','pct'].forEach(function(inc){ if(incs2.indexOf(inc)<0) vus.push('2.5.1 tirage '+t+' : l\\'inconnue « '+inc+' » ne sort pas'); });
        test.questions.forEach(function(q){ famsSyn[q.fam]=1; });
        if(typeof startSynAugLibre==='function'){
          startSynAugLibre();
          test.questions.forEach(function(q,i){ if(q.fam!=='aug') vus.push('2.2.9 tirage '+t+' q'+i+' : famille « '+q.fam+' » au lieu d\\'une hausse'); });
          const incs3=test.questions.map(function(q){ return q.inc; });
          ['fin','ini','pct'].forEach(function(inc){ if(incs3.indexOf(inc)<0) vus.push('2.2.9 tirage '+t+' : l\\'inconnue « '+inc+' » ne sort pas'); });
        }
        if(typeof startSynDimLibre==='function'){
          startSynDimLibre();
          test.questions.forEach(function(q,i){ if(q.fam!=='dim') vus.push('2.3.8 tirage '+t+' q'+i+' : famille « '+q.fam+' » au lieu d\\'une baisse'); });
          const incs4=test.questions.map(function(q){ return q.inc; });
          ['fin','ini','pct'].forEach(function(inc){ if(incs4.indexOf(inc)<0) vus.push('2.3.8 tirage '+t+' : l\\'inconnue « '+inc+' » ne sort pas'); });
        }
        startSynAug();
        const qs=test.questions;
        qs.forEach(function(q,i){ if(q.fam!=='aug') vus.push('tirage '+t+' q'+i+' : famille « '+q.fam+' » au lieu d\\'une hausse'); });
        const incs=qs.map(function(q){ return q.inc; });
        ['fin','ini','pct'].forEach(function(inc){ if(incs.indexOf(inc)<0) vus.push('tirage '+t+' : l\\'inconnue « '+inc+' » ne sort pas'); });
        ordres[incs.join(',')]=1;
      }
      if(!vus.length && Object.keys(ordres).length<2) vus.push('l\\'ordre des inconnues ne change jamais d\\'un tirage à l\\'autre');
      if(!vus.length && Object.keys(famsSyn).length<3) vus.push('sur 30 tirages du 2.5.1, les familles vues sont : '+Object.keys(famsSyn).join(',')+' — la synthèse ne mélange plus');
      if(!vus.length){
        if(test.qId!=='synthese-augmentations') vus.push('startSynAug n\\'épingle pas son identité ('+test.qId+')');
        test.kind='syn'; test.qId='synthese-augmentations'; restartCurrentTest();
        if(test.qId!=='synthese-augmentations') vus.push('« Recommencer » relance « '+test.qId+' » au lieu de la synthèse des augmentations');
        test.kind='syn'; test.qId='synthese-pourcentages'; restartCurrentTest();
        if(test.qId!=='synthese-pourcentages') vus.push('« Recommencer » sur le 2.5.1 relance « '+test.qId+' »');
      }
      return vus.slice(0,4).join(' | ');
    })()`, v => v === '', undefined);
  }

  /* ---- {reconnaitre-coefficient} (2.5.2) : le QCM des coefficients ------
     Cinq bords, et n'en tenir qu'un ne tient rien : le tirage (les trois
     familles chacune une fois à ordre variable, quatre propositions
     DISTINCTES qui contiennent les pièges, et à famille égale le rang de la
     bonne varie) ; la bonne réponse JAMAIS rangée à côté (la question ne
     porte que la famille et P — ckCoef la recalcule) ; la chaîne de
     vérification VISIBLE dès le rendu, et choisir qui ne redessine pas ; la
     correction CLIQUÉE (bonne choisie = ok, bonne montrée = sol, case vide
     jamais rougie, le piège choisi NOMMÉ) ; et l'identité. */
  if(typeof evaluer(w,"typeof startReconnaitreCoef").valeur==='string' && evaluer(w,"typeof startReconnaitreCoef").valeur==='function'){
    verifierEval(w, 'reconnaître le coefficient : trois familles, pièges nommés, vérification honnête', `(function(){
      const vus=[];
      currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
      /* ---- 1. le tirage ---- */
      const ordres={}, rangs={aug:{},dim:{},pre:{}};
      for(let t=0;t<30 && !vus.length;t++){
        startReconnaitreCoef();
        const fams=test.questions.map(function(q){ return q.fam; });
        ['aug','dim','pre'].forEach(function(f){ if(fams.indexOf(f)<0) vus.push('tirage '+t+' : la famille « '+f+' » ne sort pas'); });
        if(test.questions.length!==3) vus.push('tirage '+t+' : '+test.questions.length+' questions au lieu de 3');
        ordres[fams.join(',')]=1;
        test.questions.forEach(function(q){
          const cles=Object.keys(q).filter(function(k){ return ['fam','P','opts','choisi'].indexOf(k)<0; });
          if(cles.length) vus.push('la question porte d\\'autres champs que la famille et P : '+cles.join(','));
          if(new Set(q.opts).size!==4) vus.push('tirage '+t+' ('+q.fam+', P='+q.P+') : propositions non distinctes '+q.opts.join('/'));
          if(q.opts.indexOf(ckCoef(q))<0) vus.push('tirage '+t+' : la bonne réponse manque aux propositions');
          const Ps=(q.P%10===0)?q.P/10:q.P*10;
          const attendus=(q.fam==='aug')?[100-q.P,q.P,100+Ps]:(q.fam==='dim')?[q.P,Ps,100-Ps]:[Ps,100+q.P,100-q.P];
          attendus.forEach(function(c){ if(q.opts.indexOf(c)<0) vus.push('tirage '+t+' ('+q.fam+', P='+q.P+') : le piège '+c+' manque'); });
          rangs[q.fam][ckBon(q)]=1;
        });
      }
      if(!vus.length && Object.keys(ordres).length<2) vus.push('l\\'ordre des familles ne change jamais');
      ['aug','dim','pre'].forEach(function(f){ if(!vus.length && Object.keys(rangs[f]).length<2) vus.push('famille '+f+' : la bonne tombe toujours au même rang'); });

      /* ---- 2. la chaîne visible dès le rendu, le choix qui ne redessine pas ---- */
      startReconnaitreCoef();
      test.questions[0]={fam:'aug',P:30,opts:[130,103,70,30],choisi:null}; test.idx=0; renderCKTest();
      ['ck1n','ck1d','ck1p','ckC'].forEach(function(id){ if(!document.getElementById(id)) vus.push('la case '+id+' n\\'est pas visible avant le choix'); });
      const el0=document.getElementById('ck1n'); el0.value='30';
      choisirCK(2);
      if(document.getElementById('ck1n')!==el0) vus.push('choisir une proposition redessine l\\'écran — les cases écrites seraient effacées');
      if(el0.value!=='30') vus.push('choisir une proposition efface une case écrite');
      if(test.questions[0].choisi!==2) vus.push('choisirCK ne retient pas la proposition');

      /* ---- 3. la correction, CLIQUÉE ---- */
      const poser=function(q,vals){ test.questions[0]=q; test.idx=0; test.locked=false; renderCKTest();
        Object.keys(vals||{}).forEach(function(id){ const e=document.getElementById(id); if(e) e.value=String(vals[id]); }); };
      const cls=function(id){ return (document.getElementById(id)||{}).className||''; };
      const fb=function(){ return document.getElementById('ckFeedback').textContent; };
      const QA={fam:'aug',P:30,opts:[130,103,70,30],choisi:0};
      /* copie juste */
      poser(JSON.parse(JSON.stringify(QA)),{ck1n:'30',ck1d:'100',ck1p:'30',ckC:'30'});
      test.score=0; checkCKAnswer();
      if(test.score!==1) vus.push('la copie juste ne vaut pas le point ('+test.score+')');
      if(!/\\bok\\b/.test(cls('ckc0'))) vus.push('la bonne proposition choisie ne se marque pas ok');
      if(!/\\bok\\b/.test(cls('ckC'))) vus.push('le coefficient juste ne se marque pas ok');
      /* proposition fausse (le coefficient de la baisse), cases justes : le piège est NOMMÉ */
      poser(Object.assign(JSON.parse(JSON.stringify(QA)),{choisi:2}),{ck1n:'30',ck1d:'100',ck1p:'30',ckC:'30'});
      checkCKAnswer();
      if(!test.answers.length || test.answers[test.answers.length-1].correct) vus.push('la mauvaise proposition est comptée juste');
      if(!/\\bbad\\b/.test(cls('ckc2'))) vus.push('la proposition fausse ne rougit pas');
      if(!/\\bsol\\b/.test(cls('ckc0'))) vus.push('la bonne proposition ne se montre pas en correction (sol)');
      if(fb().indexOf('DIMINUTION')<0) vus.push('le retour ne nomme pas le piège du sens : '+fb().slice(0,60));
      /* la virgule décalée se nomme */
      poser(Object.assign(JSON.parse(JSON.stringify(QA)),{choisi:1}),{ck1n:'30',ck1d:'100',ck1p:'30',ckC:'30'});
      checkCKAnswer();
      if(fb().indexOf('VIRGULE')<0) vus.push('le retour ne nomme pas le piège de la virgule : '+fb().slice(0,60));
      /* case vide en entraînement : jamais rouge, remplie en vert */
      poser(JSON.parse(JSON.stringify(QA)),{ck1n:'30',ck1d:'100',ck1p:'30'});
      checkCKAnswer();
      if(/\\bbad\\b/.test(cls('ckC'))) vus.push('une case laissée vide rougit à la vérification');
      if(!/\\bsol\\b/.test(cls('ckC'))) vus.push('la case vide ne reçoit pas la correction en vert');
      if((document.getElementById('ckC').value||'')==='') vus.push('la correction n\\'écrit pas la valeur dans la case vide');
      /* en soutien, la vide reste NUE et l'exercice se rejoue */
      currentMode='soutien';
      poser(JSON.parse(JSON.stringify(QA)),{ck1n:'30',ck1d:'100',ck1p:'30'});
      checkCKAnswer();
      if(/\\b(bad|sol|ok)\\b/.test(cls('ckC'))) vus.push('en soutien, la case vide reçoit une couleur ('+cls('ckC')+')');
      if(test.locked) vus.push('en soutien, une copie incomplète verrouille l\\'exercice');
      currentMode='train';
      /* vérifier sans proposition : un message, jamais un verrou */
      poser(Object.assign(JSON.parse(JSON.stringify(QA)),{choisi:null}),{});
      checkCKAnswer();
      if(fb().indexOf('Choisis d')!==0) vus.push('vérifier sans proposition ne demande pas de choisir');
      if(test.locked) vus.push('vérifier sans proposition verrouille l\\'exercice');
      /* « prendre » : pas de maillon « 1 ± », la chaîne P/100 = 0,PP juge */
      const QP={fam:'pre',P:30,opts:[3,130,30,70],choisi:2};
      poser(JSON.parse(JSON.stringify(QP)),{ck1n:'30',ck1d:'100',ck1p:'30'});
      if(document.getElementById('ckC')) vus.push('« prendre » affiche un maillon « 1 ± » qui n\\'existe pas');
      test.score=0; checkCKAnswer();
      if(test.score!==1) vus.push('« prendre » : la copie juste ne vaut pas le point');

      /* ---- 4. l'identité ---- */
      test.kind='ck'; test.qId='(sentinelle)'; restartCurrentTest();
      if(test.qId!=='reconnaitre-coefficient') vus.push('« Recommencer » relance « '+test.qId+' »');
      return vus.slice(0,4).join(' | ');
    })()`, v => v === '', undefined);
  } else {
    ignorer('reconnaître le coefficient : trois familles, pièges nommés, vérification honnête',
      'ce niveau n\'a pas le QCM des coefficients');
  }

  if(P.nbQuestionsFractions){
    verifierEval(w, 'les exercices de fractions posent le bon nombre de questions', `(function(){
      const attendus=${JSON.stringify(P.nbQuestionsFractions)}, vus=[];
      if(attendus.sf!==undefined){
        if(typeof sfBuildQuestions!=='function') vus.push('sfBuildQuestions absente');
        else{ const n=sfBuildQuestions().length, n2=sfBuildQuestions('simplifier').length;
          if(n!==attendus.sf) vus.push('moteur sf : '+n+' questions au lieu de '+attendus.sf);
          if(n2!==attendus.sf) vus.push('moteur sf (simplifier) : '+n2+' questions au lieu de '+attendus.sf); }
      }
      if(attendus.mlt!==undefined){
        if(typeof mltBuildQuestions!=='function') vus.push('mltBuildQuestions absente');
        else{ const n=mltBuildQuestions().length;
          if(n!==attendus.mlt) vus.push('moteur mlt : '+n+' questions au lieu de '+attendus.mlt); }
      }
      return vus.join(' | ');
    })()`, v => v === '', undefined);
  }

  /* ---- Les écritures mathématiques des réponses du modèle ----------------
     Un élève de Seconde lisait « \frac{1}{2} », en toutes lettres, là où son
     cahier porte une fraction empilée : sa page posait la réponse du modèle en
     textContent, et lui demandait d'ailleurs d'écrire « sans LaTeX ». La
     Terminale et la Première rendaient déjà ces écritures depuis longtemps —
     encore une leçon apprise dans un coin qui n'avait pas gagné les autres.

     DEUX MOITIÉS, et n'en tenir qu'une ne tient rien :
       · la page doit SAVOIR RENDRE — la réponse passe par conseilHTML(), jamais
         par textContent : posée en texte, la plus belle formule du monde
         s'affiche avec ses antislashs ;
       · et elle doit DEMANDER — si la consigne envoyée au modèle ne réclame pas
         de LaTeX, il répond « 3/4 » et il n'y a rien à rendre. Pire : demander
         sans savoir rendre AFFICHE les antislashs, c'est-à-dire le défaut qu'on
         corrige. Les deux ensemble, ou aucune.
     Le moteur lui-même (huit fonctions et deux constantes) est le MÊME texte
     dans les trois fichiers : une moitié modifiée d'un seul côté ferait diverger
     le rendu d'un niveau sans que rien ne rougisse. */
  const MOTEUR_IA = ['latexRepare','fracAuto','iaMathAuto','iaTabCell','iaTableau',
                     'iaCoupe','iaDollars','conseilHTML'];
  /* corpsFonctions() et non un comptage d'accolades naïf : ces fonctions sont
     pleines d'expressions régulières où « { } » abondent, et un compteur qui ne
     saute ni les chaînes ni les regex avalait 11 000 lignes au lieu de 60 — le
     contrôle comparait alors deux moitiés de fichier et criait sur tout. */
  const corpsDe = (texte, nom) => {
    const f = corpsFonctions(texte, /^(?:async )?function ([A-Za-z_$][\w$]*)\s*\(/gm)
      .find(o => o.nom === nom);
    return f ? f.texte : null;
  };
  let origine;
  try{ origine = fs.readFileSync(path.join(__dirname, '..', 'terminale.html'), 'utf8'); }
  catch(e){ origine = undefined; }
  const manquantes = MOTEUR_IA.filter(n => corpsDe(src, n) === null);
  verifier('le moteur d’écritures mathématiques est au complet',
    manquantes.length === 0, 'manque : ' + manquantes.join(', '));
  if(!manquantes.length && origine){
    const differentes = MOTEUR_IA.filter(n => corpsDe(src, n) !== corpsDe(origine, n));
    verifier('le moteur est identique à celui de la Terminale, au caractère près',
      differentes.length === 0,
      differentes.length ? 'diverge sur : ' + differentes.join(', ')
                         : undefined);
  } else if(!origine){
    verifier('le moteur est identique à celui de la Terminale, au caractère près',
      false, 'terminale.html est introuvable');
  }

  /* ---- LE MOTEUR DES FRACTIONS EST LE MÊME TEXTE DANS LES DEUX NIVEAUX ----
     {somme-fractions} vit en Seconde ET en Première, et {croiser-denominateurs}
     comme {simplifier-fractions} tournent dessus. Une moitié recopiée aurait
     donné deux exercices qui se contredisent le jour où l'un des deux change de
     convention — et ce jour est venu trois fois en une seule journée d'août
     2026, la correction ayant été reprise à trois reprises à la main dans les
     DEUX fichiers. Rien ne comparait ces deux copies : le contrôle qui existait
     ne regardait que le moteur d'écritures mathématiques.
     DEUX FONCTIONS DIVERGENT VOLONTAIREMENT, et elles sont nommées ici plutôt
     que tues : sfBoutonsAide() — la Seconde pose sa rangée elle-même, la
     Première la fait poser par iaBoutons() — et sfCtxTexte(), qui porte les
     phrases des exercices propres à la Seconde. Les nommer est ce qui empêche
     la liste de se vider en silence. */
  /* ---- L'ÉDITEUR LIGNE PAR LIGNE EST CELUI DE LA TERMINALE -----------------
     mlFeuille() a été PORTÉE, pas réécrite : c'est le même éditeur qui sert le
     2.2 et le 3.5 là-bas et la saisie libre des fractions ici. Une copie
     retouchée d'un seul côté ferait diverger deux niveaux sans que rien ne
     rougisse — ce qui est arrivé trois fois au moteur des fractions en une
     seule journée d'août 2026. On la compare donc au caractère près. */
  if(src.indexOf('function mlFeuille') >= 0){
    let origineT;
    try{ origineT = fs.readFileSync(path.join(__dirname, '..', 'terminale.html'), 'utf8'); }
    catch(e){ origineT = undefined; }
    if(!origineT){
      verifier('l’éditeur ligne par ligne est identique à celui de la Terminale', false,
        'terminale.html est introuvable');
    } else {
      const ici = corpsDe(src, 'mlFeuille'), la = corpsDe(origineT, 'mlFeuille');
      verifier('l’éditeur ligne par ligne est identique à celui de la Terminale',
        !!ici && !!la && ici === la,
        (!ici || !la) ? 'mlFeuille introuvable d’un des deux côtés'
                      : 'le texte diverge de terminale.html');
    }
  } else {
    ignorer('l’éditeur ligne par ligne est identique à celui de la Terminale',
      'ce niveau n’a pas de feuille de calcul ligne par ligne');
  }

  /* ---- LE PAVÉ NUMÉRIQUE EST LE MÊME TEXTE DANS LES TROIS FICHIERS -------
     Cinq fonctions comparées au caractère près à terminale.html. UNE constante
     diverge VOLONTAIREMENT et elle est nommée ici plutôt que tue :
     PAVE_TOUCHES — la Terminale a la touche « / » pour ses fractions p/q. */
  const MOTEUR_PAVE = ['paveActif','paveHTML','paveInserer','paveCale','paveBrancher','paveObserver'];
  if(src.indexOf('function paveBrancher') >= 0){
    let refPave;
    try{ refPave = fs.readFileSync(path.join(__dirname, '..', 'terminale.html'), 'utf8'); }
    catch(e){ refPave = undefined; }
    if(!refPave){
      verifier('le pavé numérique est identique à celui de la Terminale', false,
        'terminale.html est introuvable');
    } else {
      const absentes = MOTEUR_PAVE.filter(n => corpsDe(src, n) === null || corpsDe(refPave, n) === null);
      const diff = MOTEUR_PAVE.filter(n => corpsDe(src, n) !== corpsDe(refPave, n));
      verifier('le pavé numérique est identique à celui de la Terminale',
        absentes.length === 0 && diff.length === 0,
        absentes.length ? 'manque : ' + absentes.join(', ') : (diff.length ? 'diverge sur : ' + diff.join(', ') : undefined));
    }
  } else {
    verifier('le pavé numérique est identique à celui de la Terminale', false,
      'paveBrancher est introuvable dans ce fichier');
  }

  const MOTEUR_SF = ['sfPgcd','sfPpcm','sfGen','sfBuildQuestions','sfTermeHTML','sfCases',
                     'renderSFTest','sfLu','sfJuge','sfLive','checkSFAnswer','sfPourquoi',
                     'nextSFQuestion','sfFracInner'];
  if(src.indexOf('function sfJuge') >= 0){
    let jumeau;
    const autre = CIBLE.indexOf('secondes') >= 0 ? 'premiere-specifique.html' : 'secondes.html';
    try{ jumeau = fs.readFileSync(path.join(__dirname, '..', autre), 'utf8'); }
    catch(e){ jumeau = undefined; }
    if(!jumeau){
      verifier('le moteur des fractions est identique dans les deux niveaux', false,
        autre + ' est introuvable');
    } else {
      const absentes = MOTEUR_SF.filter(n => corpsDe(src, n) === null || corpsDe(jumeau, n) === null);
      if(absentes.length){
        verifier('le moteur des fractions est identique dans les deux niveaux', false,
          'introuvable(s) : ' + absentes.join(', '));
      } else {
        const divergent = MOTEUR_SF.filter(n => corpsDe(src, n) !== corpsDe(jumeau, n));
        verifier('le moteur des fractions est identique dans les deux niveaux',
          divergent.length === 0,
          divergent.length ? 'diverge de ' + autre + ' sur : ' + divergent.join(', ') : undefined);
      }
    }
  } else {
    ignorer('le moteur des fractions est identique dans les deux niveaux',
      'ce niveau n’a pas l’exercice de somme de fractions');
  }

  /* La réponse du modèle ne doit JAMAIS être posée en texte. On cherche les
     endroits qui affichent d.feedback : chacun doit passer par conseilHTML(). */
  const sinks = [...src.matchAll(/[^\n]*\bd\.feedback\b[^\n]*/g)]
    .map(m => ({ ligne: src.slice(0, m.index).split('\n').length, texte: m[0] }))
    .filter(o => /textContent\s*=/.test(o.texte));
  verifier('la réponse du modèle est rendue, jamais posée en texte brut',
    sinks.length === 0,
    'ligne(s) ' + sinks.map(o => o.ligne).join(', ')
      + ' — une formule y arriverait avec ses antislashs');

  /* Et les rappels de cours eux-mêmes : une fraction s'y écrit \(\frac{a}{b}\),
     jamais « a/b ». Ce n'est pas une coquetterie — le rappel est ce que l'élève
     relit quand il ne comprend plus, et une barre oblique n'est pas ce que porte
     son cahier. Le contrôle du navigateur vérifie que ce qui est écrit s'AFFICHE
     empilé ; celui-ci vérifie que c'est ÉCRIT ainsi, sans quoi une fraction
     remise à plat repasserait sans un mot. */
  const rapsPlats = [];
  const listeRap = (src.match(/const RAPPELS\s*=\s*\{([\s\S]*?)\}/) || [])[1] || '';
  const listeRapId = (src.match(/const RAPPELS_ID\s*=\s*\{([\s\S]*?)\}/) || [])[1] || '';
  const nomsRap = [...new Set([...(listeRap + listeRapId).matchAll(/:\s*(RAP_[A-Z0-9_]+)/g)].map(m => m[1]))];
  for(const n of nomsRap){
    const m = src.match(new RegExp('^const ' + n + '\\s*=', 'm'));
    if(!m) continue;
    let i = m.index + m[0].length, prof = 0, fin = -1;
    for(let j = i; j < src.length; j++){
      const saut = sauter(src, j);
      if(saut >= 0){ j = saut; continue; }
      if(src[j] === '(' || src[j] === '{' || src[j] === '[') prof++;
      else if(src[j] === ')' || src[j] === '}' || src[j] === ']') prof--;
      else if(src[j] === ';' && prof <= 0){ fin = j; break; }
    }
    const corps = src.slice(i, fin < 0 ? src.length : fin);
    /* Chiffres ET lettres : « P/100 », « x/100 », « 100/b », « u/v » sont des
       fractions autant que « 1/2 ». Le premier jet ne cherchait que chiffre/chiffre
       et laissait passer les autres — ça s'est vu sur une capture d'écran, pas
       dans le vert du banc. Chaque côté est un nombre ou UNE lettre : « et/ou »
       et « km/h » ne sont pas des fractions et ne doivent pas rougir. */
    const plats = [...corps.matchAll(/(?<![\w\\])(?:[0-9]+|[a-zA-Z])\s*\/\s*(?:[0-9]+|[a-zA-Z])(?![\w])/g)].map(x => x[0]);
    if(plats.length) rapsPlats.push(n + ' (' + plats.slice(0, 3).join(', ') + ')');
  }
  verifier('les fractions des rappels de cours sont écrites empilées, jamais « a/b »',
    nomsRap.length > 0 && rapsPlats.length === 0,
    !nomsRap.length ? 'aucun rappel trouvé : le contrôle ne mesure rien'
                    : rapsPlats.slice(0, 3).join(' | '));

  verifierEval(w, 'les deux aides réclament des écritures mathématiques au modèle', `(function(){
    const CLAUSE='LaTeX entre \\\\( et \\\\)';
    const vus=[];
    if(typeof conseilHTML!=='function') vus.push('conseilHTML() introuvable : la page ne saurait pas rendre');
    const sbSauve=sb, sauve=currentEleve;
    let parti='';
    sb={ functions:{ invoke:function(n,o){ parti=(o&&o.body&&o.body.contexte)||''; return new Promise(function(){}); } } };
    currentEleve={id:'e-controle',prenom:'Contrôle'};
    if(typeof lancerConseil!=='function') vus.push('lancerConseil() introuvable');
    else {
      const fb=document.createElement('div'); document.body.appendChild(fb);
      parti=''; conseilBusy=false;
      try{ if(lancerConseil.length>=3) lancerConseil('', 'CONTEXTE-TEMOIN', fb); else lancerConseil('CONTEXTE-TEMOIN', fb); }
      catch(e){ vus.push('le conseil lève : '+e.message); }
      conseilBusy=false;
      if(!parti) vus.push('le conseil n\\'envoie rien : le contrôle ne mesure rien');
      else if(parti.indexOf(CLAUSE)<0) vus.push('le conseil du soutien ne réclame pas d\\'écritures en LaTeX');
      try{ fb.remove(); }catch(e){}
    }
    if(typeof qiaEnvoyer!=='function') vus.push('qiaEnvoyer() introuvable');
    else {
      let d=document.getElementById('qiaDialog');
      if(!d){ d=document.createElement('div'); d.id='qiaDialog'; document.body.appendChild(d); }
      let inp=document.getElementById('qiaInput');
      if(!inp){ inp=document.createElement('input'); inp.id='qiaInput'; document.body.appendChild(inp); }
      inp.value='Comment on fait ?';
      parti=''; qiaBusy=false;
      try{ qiaEnvoyer(); }catch(e){ vus.push('la fenêtre d\\'aide lève : '+e.message); }
      qiaBusy=false;
      if(!parti) vus.push('la fenêtre d\\'aide n\\'envoie rien : le contrôle ne mesure rien');
      else if(parti.indexOf(CLAUSE)<0) vus.push('la fenêtre « Question à l\\'IA » ne réclame pas d\\'écritures en LaTeX');
    }
    sb=sbSauve; currentEleve=sauve;
    return vus.slice(0,3).join(' | ');
  })()`, v => v === '', undefined);

  /* ---- Un bouton d'une fenêtre DÉTACHÉE trouve-t-il sa fonction ? --------
     Sur ordinateur, « Soutien » et « Question à l'IA » s'ouvrent dans une
     fenêtre indépendante et leur carte y est DÉPLACÉE. C'est alors un autre
     document, avec un autre window : un attribut onclick posé dans la carte y
     cherche sa fonction sur le window de la POPUP, qui n'en a aucune. Le bouton
     ne fait rien du tout — pas d'erreur à l'écran, pas de trace, juste un
     bouton mort chez l'élève qui a détaché sa fenêtre.
     garnirFenetre() recopie donc une LISTE DE NOMS sur la popup. Une liste
     tenue à la main est exactement ce qui dérive : « expliquerSimplement » y
     manquait le jour où le bouton a été ajouté, et rien ne l'aurait dit.
     Le contrôle ouvre les deux cartes, y déclenche tout ce qui pose un bouton
     — les questions suggérées, le rappel de cours, une réponse du modèle —,
     puis relève CHAQUE onclick présent et exige qu'il soit dans la liste. */
  verifierEval(w, 'chaque bouton des fenêtres d’aide survit à leur détachement', `(function(){
    if(typeof garnirFenetre!=='function') return 'garnirFenetre() introuvable : le contrôle ne mesure rien';
    const exportes=(String(garnirFenetre).match(/\\[([^\\]]*)\\]\\s*\\.forEach\\(function\\(n\\)/)||[])[1]||'';
    const liste=exportes.split(',').map(function(t){ return t.trim().replace(/^['"]|['"]$/g,''); }).filter(Boolean);
    if(liste.length<3) return 'la liste des fonctions recopiées sur la fenêtre est illisible : le contrôle serait aveugle';
    /* On garnit les deux cartes comme la page le fait pour un élève. */
    const sauveEleve=currentEleve, sauveMode=(typeof currentMode!=='undefined')?currentMode:null;
    currentEleve={id:'e-controle',prenom:'Contrôle'};
    if(typeof currentMode!=='undefined') currentMode='soutien';
    try{ if(typeof ouvrirQIA==='function') ouvrirQIA(); }catch(e){}
    try{ if(typeof basculerRappel==='function'){ const b=document.getElementById('conseilRappel'); if(b) b.hidden=true; basculerRappel(); } }catch(e){}
    /* une réponse du modèle dans le fil, et un conseil : chacun pose son bouton */
    const dlg=document.getElementById('qiaDialog');
    if(dlg && typeof simpleBtnHTML==='function'){
      const d=document.createElement('div'); d.className='qia-r';
      d.textContent='Réponse de contrôle.'; d.insertAdjacentHTML('beforeend', simpleBtnHTML());
      dlg.appendChild(d);
    }
    const corps=document.getElementById('conseilBody');
    if(corps && typeof simpleBtnHTML==='function'){
      corps.textContent='Indice de contrôle.'; corps.insertAdjacentHTML('beforeend', simpleBtnHTML());
    }
    /* Le bouton « détacher » est le seul à ne pas avoir besoin d'exister une
       fois la fenêtre détachée : garnirFenetre() le MASQUE. On lit donc les
       sélecteurs qu'elle met en display:none dans SA feuille, plutôt que de
       recopier un nom ici — masquer autre chose demain le dispenserait tout
       seul, et cesser de masquer le remettrait sous surveillance. */
    const caches=[];
    String(garnirFenetre).replace(/([.#][\\w-]+)\\{display:none\\s*!important\\}/g,
      function(t,sel){ caches.push(sel); return t; });
    const manquants=[], vus=[];
    ['.qia-card','.conseil-card'].forEach(function(sel){
      const carte=document.querySelector(sel);
      if(!carte){ manquants.push(sel+' introuvable'); return; }
      carte.querySelectorAll('[onclick]').forEach(function(e){
        const code=e.getAttribute('onclick')||'';
        /* le nom appelé en tête de l'attribut : « qiaPoser(this.textContent) » */
        const m=/^\\s*([A-Za-z_$][\\w$]*)\\s*\\(/.exec(code);
        if(!m) return;
        const nom=m[1];
        if(caches.some(function(c){ try{ return e.matches(c); }catch(x){ return false; } })) return;
        if(vus.indexOf(nom)<0) vus.push(nom);
        if(liste.indexOf(nom)<0) manquants.push(nom+' ('+sel+')');
      });
    });
    currentEleve=sauveEleve;
    if(sauveMode!==null && typeof currentMode!=='undefined') currentMode=sauveMode;
    try{ if(typeof fermerQIA==='function') fermerQIA(); if(typeof fermerConseil==='function') fermerConseil(); }catch(e){}
    if(!vus.length) return 'aucun bouton relevé dans les deux cartes : le contrôle ne mesure rien';
    /* Une liste qui nomme une fonction DISPARUE ne protège plus rien. */
    const morts=liste.filter(function(n){ return typeof window[n]!=='function'; });
    return [manquants.length ? 'absente(s) de garnirFenetre, donc morte(s) une fois la fenêtre détachée : '+manquants.join(', ') : '',
            morts.length ? 'recopiée(s) sans exister : '+morts.join(', ') : ''].filter(Boolean).join(' | ');
  })()`, v => v === '', undefined);

  /* ---- Le numéro de l'exercice est en tête de son écran ------------------
     Il apparaissait déjà partout ailleurs — la carte du menu, l'écran des
     modes, les résultats, le signalement — mais PAS là où l'élève passe son
     temps. La Seconde, portée depuis la Terminale, n'avait jamais reçu ce
     morceau : ses dix exercices s'ouvraient sans dire lequel on faisait. Rien
     ne cassait, et c'est pour ça que personne ne l'avait vu.

     Le contrôle vise show(), et show() seule : c'est l'unique porte vers un
     écran d'exercice, donc l'y vérifier une fois les couvre tous — y compris
     celui qu'on ajoutera demain. Deux bords. La pastille peut MANQUER. Et le
     numéro peut être FIGÉ : il n'est écrit nulle part, il se déduit de la
     position dans THEMES, et un numéro capturé une fois pour toutes enverrait
     l'élève au mauvais exercice le jour d'une réorganisation. */
  verifierEval(w, 'le numéro de l\u2019exercice est affiché en tête de son écran', `(function(){
    if(typeof show!=='function') return 'show() introuvable';
    const ecrans=(String(show).match(/const testScreens\\s*=\\s*\\[([^\\]]*)\\]/)||[])[1]||'';
    const liste=ecrans.split(',').map(function(t){ return t.trim().replace(/^['\"]|['\"]$/g,''); }).filter(Boolean);
    if(!liste.length) return 'testScreens illisible : le contrôle serait aveugle';
    const id=Object.keys(TESTS).filter(function(i){ return testNum(i); })[0];
    if(!id) return 'aucun exercice numéroté : le contrôle ne mesure rien';
    const sauveId=currentTestId, sauveNum=TEST_NUM[id], vus=[];
    currentTestId=id;
    const lire=function(nom){
      try{ show(nom); }catch(e){ return {err:e.message}; }
      const t=document.querySelector('#scr-'+nom+' .exo-title');
      if(!t) return {err:'aucune pastille'};
      const num=(t.querySelector('.exo-num')||{}).textContent||'';
      const nom2=(t.querySelector('.exo-name')||{}).textContent||'';
      return {num:num, nom:nom2};
    };
    /* 1. la pastille est là, sur CHAQUE écran d'exercice */
    liste.forEach(function(nom){
      const v=lire(nom);
      if(v.err){ vus.push(nom+' : '+v.err); return; }
      if(v.num!==TEST_NUM[id]) vus.push(nom+' : numéro « '+v.num+' » au lieu de « '+TEST_NUM[id]+' »');
      if(v.nom!==testName(id)) vus.push(nom+' : nom « '+v.nom+' » au lieu de « '+testName(id)+' »');
    });
    /* 2. et il SUIT une renumérotation — la preuve qui compte */
    if(!vus.length){
      TEST_NUM[id]='9.9.9';
      const v=lire(liste[0]);
      TEST_NUM[id]=sauveNum;
      if(v.err) vus.push(liste[0]+' : '+v.err);
      else if(v.num!=='9.9.9') vus.push('le numéro ne suit pas une renumérotation (« '+v.num+' ») : il est figé quelque part');
    }
    TEST_NUM[id]=sauveNum; currentTestId=sauveId;
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);

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
      /* la paire fausse ne rougit que sa case fautive (la capture du 1.7,
         août 2026) : le numérateur du profil est la valeur CANONIQUE, seul
         le dénominateur faux rougit */
      ecrire(c.n2, lc.faux.n2); ecrire(c.d2, lc.faux.d2); quitter();
      verifier('fraction fausse : seule la case fautive rougit',
        couleur(w, c.n2) === 'VERT' && couleur(w, c.d2) === 'ROUGE',
        c.n2 + '=' + couleur(w, c.n2) + ' (canonique, attendu ok) ; ' + c.d2 + '=' + couleur(w, c.d2));
      ecrire(c.n2, '999'); quitter();
      verifier('fraction fausse aux deux valeurs : les deux cases en rouge',
        couleur(w, c.n2) === 'ROUGE' && couleur(w, c.d2) === 'ROUGE');
      /* et la VÉRIFICATION suit la même règle que le direct — le sabotage qui
         remettait le verdict de paire au seul bouton « Vérifier » restait
         vert : aucun contrôle ne cliquait ce chemin-là */
      if(lc.verif){
        evaluer(w, "test.locked=false; " + t.rendu + "();");
        ecrire(c.n1, lc.justes.n1); ecrire(c.d1, lc.justes.d1);
        ecrire(c.n2, lc.faux.n2); ecrire(c.d2, lc.faux.d2);
        ecrire(c.res, lc.justes.res);
        evaluer(w, lc.verif);
        verifier('à la vérification aussi, seule la case fautive rougit',
          couleur(w, c.n2) === 'VERT' && couleur(w, c.d2) === 'ROUGE',
          c.n2 + '=' + couleur(w, c.n2) + ' (canonique, attendu ok) ; ' + c.d2 + '=' + couleur(w, c.d2));
      }
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
      verifierEval(w, 'le signalement emporte l\'état de l\'exercice, rejouable', `(function(){
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

      /* ---- La copie d'écran, facultative, jointe au signalement ----------
         Elle est FACULTATIVE, et c'est le mot qui porte tout le contrôle : le
         signalement doit partir dans tous les cas. Quatre bords, tous silencieux
         si on les lâche :
           · sans image, la ligne part comme avant et « capture » vaut null ;
           · avec image, elle part D'ABORD dans le stockage, et c'est SON chemin
             qui est écrit dans la ligne — pas un autre, pas rien ;
           · si le dépôt échoue, le signalement part QUAND MÊME, sans image. Le
             pire serait qu'un élève qui veut aider reparte les mains vides ;
           · si l'écriture échoue APRÈS le dépôt, l'image est retirée : gardée,
             elle serait invisible et décomptée du quota — l'orphelin des cours
             en PDF, au même endroit.
         Et le chemin commence par l'identifiant de l'élève : la politique du
         bucket (migration 007) n'accepte que son propre dossier. Un chemin qui
         cesserait de le porter serait refusé par la base, chez l'élève, sans que
         rien ne rougisse ici.
         La RÉDUCTION de l'image et le COLLAGE ne sont pas éprouvés ici : jsdom
         n'a ni canvas ni presse-papiers. C'est le banc navigateur qui les voit. */
      evalPromis(w, `(function(){
        const vus=[];
        /* Le double HÉRITE du vrai « sb » : les contrôles qui suivent celui-ci
           s'exécutent AVANT que la partie asynchrone d'ici n'ait rendu la main,
           donc avant la restauration. Un double construit à plat leur retirait
           sb.functions, et le contrôle du contexte envoyé au modèle rougissait
           en accusant la page — d'un défaut qui était le mien. */
        const faireSb=(echecDepot, echecEcriture)=>{
          const j={depots:[], retires:[], lignes:[]};
          return Object.assign(Object.create(sb||{}), { __j:j,
            storage:{ from:function(b){ j.bucket=b; return {
              upload:function(c,f,o){ j.depots.push(c);
                return Promise.resolve(echecDepot?{data:null,error:{message:'refusé'}}:{data:{path:c},error:null}); },
              remove:function(cs){ j.retires.push.apply(j.retires,cs);
                return Promise.resolve({data:cs.map(function(c){return {name:c};}),error:null}); } }; } },
            from:function(){ return { insert:function(l){ j.lignes.push(l);
              return Promise.resolve(echecEcriture?{error:{message:'refusé'}}:{error:null}); } }; } });
        };
        const preparer=()=>{
          currentEleve={id:'eleve-42',prenom:'Contrôle'}; currentTestId='${sg.exercice}'; currentMode='train';
          test.kind='${t.kind}'; test.questions=[${t.generateur}]; test.idx=0;
          sigEnvoyes={};
          let champ=document.getElementById('sigInput');
          if(!champ){ champ=document.createElement('textarea'); champ.id='sigInput'; document.body.appendChild(champ); }
          champ.value='la case reste rouge alors que j\\'ai bon';
        };
        const attendre=()=>new Promise(function(r){ setTimeout(r,0); });
        const sbSauve=sb, eleveSauve=currentEleve;
        return (async function(){
          /* On garde une référence au double plutôt que de relire « sb » après
             l'attente : la page peut l'avoir remplacé entre-temps, et le
             contrôle lirait alors le journal d'un autre. */
          /* 1. sans image */
          preparer(); sigCapture=null; const d1=faireSb(false,false); sb=d1;
          await envoyerSignalement(); await attendre();
          if(d1.__j.lignes.length!==1) vus.push('sans image : '+d1.__j.lignes.length+' ligne écrite au lieu d\\'une');
          else if(d1.__j.lignes[0].capture!==null) vus.push('sans image : « capture » devrait valoir null');
          if(d1.__j.depots.length) vus.push('sans image : un dépôt a quand même eu lieu');

          /* 2. avec image */
          preparer(); sigCapture={blob:{size:1234},url:'',nom:'ecran.png'};
          const d2=faireSb(false,false); sb=d2;
          await envoyerSignalement(); await attendre();
          const j2=d2.__j;
          if(j2.bucket!=='signalements') vus.push('avec image : déposée dans « '+j2.bucket+' »');
          if(j2.depots.length!==1) vus.push('avec image : '+j2.depots.length+' dépôt(s) au lieu d\\'un');
          else{
            if(j2.lignes.length!==1 || j2.lignes[0].capture!==j2.depots[0])
              vus.push('avec image : le chemin déposé n\\'est pas celui écrit dans la ligne');
            if(j2.depots[0].indexOf('eleve-42/')!==0)
              vus.push('avec image : le chemin ne commence pas par l\\'identifiant de l\\'élève');
          }

          /* 3. le dépôt échoue : le signalement part quand même */
          preparer(); sigCapture={blob:{size:1234},url:'',nom:'ecran.png'};
          const d3=faireSb(true,false); sb=d3;
          await envoyerSignalement(); await attendre();
          if(d3.__j.lignes.length!==1) vus.push('dépôt refusé : le signalement est perdu');
          else if(d3.__j.lignes[0].capture!==null) vus.push('dépôt refusé : un chemin est écrit alors que rien n\\'est déposé');

          /* 4. l'écriture échoue après le dépôt : pas d'orphelin */
          preparer(); sigCapture={blob:{size:1234},url:'',nom:'ecran.png'};
          const d4=faireSb(false,true); sb=d4;
          await envoyerSignalement(); await attendre();
          const j4=d4.__j;
          if(!j4.depots.length) vus.push('écriture refusée : le contrôle ne mesure rien, aucun dépôt');
          else if(j4.retires.indexOf(j4.depots[0])<0)
            vus.push('écriture refusée : l\\'image déposée reste en ligne, orpheline');


          /* ---- et la capture s'en va AVEC le signalement --------------------
             Deux bords, et le second est le piège le plus coûteux du projet :
             sous RLS, storage.remove() rend une liste VIDE sans la moindre
             erreur. La page annoncerait « supprimé » sur un fichier toujours en
             ligne, et la ligne partirait quand même : signalement perdu, image
             gardée. Ces cas vivent dans le MÊME contrôle que les précédents, et
             non dans un second : deux contrôles asynchrones qui se rendent
             « sb » à tour de rôle se le reprennent l'un l'autre en plein vol —
             celui-ci lisait alors le double de l'autre, et accusait la page. */
          const faireSbSup=(refusMuet)=>{
            const k={retires:[], supprimees:0};
            return Object.assign(Object.create(sbSauve||{}), { __k:k,
              storage:{ from:function(){ return { remove:function(cs){
                if(refusMuet) return Promise.resolve({data:[],error:null});
                k.retires.push.apply(k.retires,cs);
                return Promise.resolve({data:cs.map(function(c){return {name:c};}),error:null}); } }; } },
              from:function(){ const q={ delete:function(){ return q; },
                eq:function(){ k.supprimees++; return Promise.resolve({error:null}); } }; return q; } });
          };
          const confirmSauve=window.confirm;
          window.confirm=function(){ return true; };
          if(typeof supprimerSignalement!=='function') vus.push('supprimerSignalement introuvable');
          else{
            mesSignalements=[{id:'s1', capture:'eleve-42/abc.jpg', message:'x', lu:false}];
            const e1=faireSbSup(false); sb=e1;
            await supprimerSignalement('s1'); await attendre();
            if(e1.__k.retires.indexOf('eleve-42/abc.jpg')<0) vus.push('suppression : la copie d\\'écran reste en ligne');
            if(e1.__k.supprimees!==1) vus.push('suppression : la ligne n\\'a pas été supprimée');

            mesSignalements=[{id:'s2', capture:'eleve-42/def.jpg', message:'x', lu:false}];
            const e2=faireSbSup(true); sb=e2;
            await supprimerSignalement('s2'); await attendre();
            if(e2.__k.supprimees!==0)
              vus.push('refus muet : la ligne est partie alors que l\\'image est restée');

            mesSignalements=[{id:'s3', capture:null, message:'x', lu:false}];
            const e3=faireSbSup(false); sb=e3;
            await supprimerSignalement('s3'); await attendre();
            if(e3.__k.supprimees!==1) vus.push('sans capture : la suppression ne marche plus');
            if(e3.__k.retires.length) vus.push('sans capture : un retrait a quand même eu lieu');
          }
          window.confirm=confirmSauve;
          sb=sbSauve; currentEleve=eleveSauve;
          return vus.slice(0,3).join(' | ');
        })();
      })()`, r => {
        verifier('la copie d’écran part avec le signalement, s’en va avec lui, et ne le perd jamais',
          r.ok && r.valeur === '', r.ok ? r.valeur : ('erreur JavaScript : ' + r.erreur));
      });

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
      ignorer('le signalement emporte l\'état de l\'exercice, rejouable',
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
    /* ---- UNE NOTE POSÉE PAR LE PROFESSEUR ---------------------------------
       Turquet doit pouvoir corriger la note d'un exercice pour un élève, dans
       un devoir. Elle se pose PAR-DESSUS : le travail de l'élève reste dans
       « resultats », intact, et la note posée vit à côté, dans la
       configuration du devoir. Rien n'est réécrit — une note corrigée par
       erreur serait sinon irrécupérable, et la trace de ce que l'élève a fait,
       perdue.
       QUATRE BORDS, et n'en tenir qu'un ne tient rien.
       · Elle REMPLACE la note calculée, et le total du devoir la suit. Un
         total qui ne bougerait pas ferait deux vérités sur le même écran.
       · Elle SURVIT au rechargement. La configuration est relue à chaque
         ouverture de l'onglet et recopiée champ par champ : un champ que
         ensureDevoir() ne connaît pas disparaît SANS erreur, et le professeur
         retrouverait la note d'avant sans comprendre pourquoi.
       · Elle est BORNÉE à 0–10. C'est un JSON qu'on peut éditer à la main dans
         la base ; une valeur bricolée doit retomber sur quelque chose de sensé
         plutôt que produire un 47/10.
       · La RETIRER rend la note obtenue. C'est la seule façon d'annuler.
       Et le même entonnoir sert l'élève et le professeur : deux calculs
       auraient fini par donner deux notes, comme l'a montré exercicesDevoir(). */
    if(evaluer(w, "typeof noteForcee==='function' && typeof noteDevoirExo==='function'").valeur){
      verifierEval(w, 'une note posée par le professeur remplace la note calculée, et lui survit', `(function(){
        const vus=[];
        const copie=(p)=>({percent:p});
        const dev={id:'dm-n',num:9,actif:true,exercices:[{id:'a',modes:['train']},{id:'b',modes:['train']}],
                   notes:{'e1|a':8}};
        /* 1. sans note posée, rien ne change */
        let nd=noteDevoirExo(copie(100), copie(50), noteForcee(dev,'e1','b'));
        if(nd.posee) vus.push('un exercice sans note posée se croit forcé');
        if(Math.round(nd.note*10)/10!==5) vus.push('la note calculée vaut '+nd.note+' au lieu de 5');
        /* 2. avec, elle remplace — et se distingue */
        nd=noteDevoirExo(copie(100), copie(50), noteForcee(dev,'e1','a'));
        if(!nd.posee) vus.push('la note posée n\\'est pas signalée comme telle');
        if(nd.note!==8) vus.push('la note posée vaut '+nd.note+' au lieu de 8');
        if(Math.round(nd.auto*10)/10!==5) vus.push('la note OBTENUE n\\'est plus lisible à côté ('+nd.auto+' au lieu de 5)');
        /* 3. elle vaut même si l'élève n'a rien fait : le professeur a noté */
        nd=noteDevoirExo(null, null, noteForcee(dev,'e1','a'));
        if(!nd.fait) vus.push('une note posée sur un exercice non fait ne compte pas dans le devoir');
        if(nd.note!==8) vus.push('une note posée sur un exercice non fait vaut '+nd.note);
        /* 4. elle ne déborde pas de 0–10 */
        if(noteDevoirExo(null,null,47).note!==10) vus.push('47 n\\'est pas ramené à 10');
        if(noteDevoirExo(null,null,-3).note!==0) vus.push('−3 n\\'est pas ramené à 0');
        /* 5. une valeur illisible dans le JSON est ignorée, pas transformée en NaN */
        const sale={notes:{'e1|a':'huit','e1|b':null}};
        if(noteForcee(sale,'e1','a')!==undefined) vus.push('une note écrite en toutes lettres est lue comme un nombre');
        /* un SOUTIEN à 100 % vaut 5 sur 10, par construction — c'est le
           plafond du mode, et le contrôle s'était trompé, pas la page. */
        if(noteDevoirExo(copie(100),null,noteForcee(sale,'e1','a')).note!==5)
          vus.push('une note illisible efface la note obtenue');
        /* 6. ELLE SURVIT AU RECHARGEMENT : ensureDevoir recopie champ par champ */
        if(typeof ensureDevoir==='function'){
          const relu=ensureDevoir(JSON.parse(JSON.stringify(dev)),0);
          if(noteForcee(relu,'e1','a')!==8)
            vus.push('la note posée ne survit pas au rechargement : ensureDevoir ne la recopie pas');
        } else vus.push('ensureDevoir() est introuvable');
        /* 7. la retirer rend la note obtenue */
        const sans=JSON.parse(JSON.stringify(dev)); delete sans.notes['e1|a'];
        const rendu=noteDevoirExo(copie(100), copie(50), noteForcee(sans,'e1','a'));
        if(rendu.posee || Math.round(rendu.note*10)/10!==5)
          vus.push('retirer la note posée ne rend pas la note obtenue ('+rendu.note+')');
        return vus.join(' | ');
      })()`, v => v === '', undefined);
    } else {
      ignorer('une note posée par le professeur remplace la note calculée, et lui survit',
        'ce niveau n’a pas de note posée par le professeur');
    }

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
       d'une référence. C'est un manque assumé, pas un oubli.
       Un rappel s'inspecte sur son texte, BALISES RETIRÉES — remplacées par une
       espace, jamais lues : depuis que le rappel de l'inéquation graphique
       porte ses dessins, la chaîne brute est truffée des mêmes décimales de
       tracé que le contexte — « 70.4 » y est une coordonnée dans un attribut,
       pas un numéro que l'élève lit. L'espace de remplacement compte : un
       textContent nu COLLE deux paragraphes voisins, et « …n+1.</p><p>2.
       Remplacer… » fabriquait le faux numéro « 1.2 » dans un rappel de la
       Terminale. Un numéro écrit dans le texte, lui, reste attrapé. */
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
          var v=t[1][k]; v=String((typeof v==='function'?v():v)||'').replace(/<[^>]*>/g,' ');
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
      /* commentaires retirés d'abord : la première version de ce contrôle lisait
         le commentaire qui EXPLIQUE l'appel et passait au vert sur une fonction
         débranchée. Elle a été prise en défaut sur ce cas exact. */
      var sansNotes=function(fn){
        return String(fn).replace(/\\/\\*[\\s\\S]*?\\*\\//g,'').replace(/(^|[^:])\\/\\/[^\\n]*/g,'$1');
      };
      /* Un entonnoir a le droit de DÉLÉGUER : conseilCtxCourant() ne résout pas
         lui-même, il rend la version en une chaîne de conseilPaire(), qui
         résout. Exiger numeros() dans son corps propre l'aurait déclaré
         débranché alors qu'il est juste — et la seule façon de le faire taire
         aurait été d'y recopier un appel inutile. On suit donc UN niveau
         d'appel : c'est assez pour ce fichier, et ça ne dispense personne, un
         entonnoir qui n'appellerait rien restant signalé. */
      var resout=function(fn, profondeur){
        if(typeof fn!=='function') return true;
        var corps=sansNotes(fn);
        if(corps.indexOf('numeros(')>=0) return true;
        if(profondeur<=0) return false;
        var appels=corps.match(/([A-Za-z_$][\\w$]*)\\s*\\(/g)||[];
        for(var i=0;i<appels.length;i++){
          var nom=appels[i].replace(/\\s*\\($/,'');
          var g=(typeof window!=='undefined')?window[nom]:null;
          if(typeof g==='function' && g!==fn && resout(g, profondeur-1)) return true;
        }
        return false;
      };
      var debranches=['cardHTML','rappelHTML','conseilCtxCourant'].filter(function(f){
        var fn=(typeof window!=='undefined')?window[f]:null;
        if(typeof fn!=='function') return false;
        return !resout(fn, 1);
      });
      return debranches.length ? 'ces fonctions laissent passer un texte sans le résoudre : '+debranches.join(', ') : '';
    })()`, v => v === '', undefined);

    sommeFractions(w, P);
    simplifierFractions(w, P);
    sommeFractionsLibre(w, P);
    placerSurLaDroite(w, P);
    ordreCroissant(w, P);
    imageNombre(w, P);
    tangenteExp(w, P);
    antecedentNombre(w, P);
    boutonSuivantCourbes(w, P);
    inequationGraphique(w, P);
    paveNumerique(w, P);
    etudeExponentielle(w, P);
    correctionBleueListes(w, P);
    jugeArithmetique(w, P);
    equationGraphique(w, P);
    lectureDeuxCourbes(w, P);
    courbesFGSeDistinguent(w, P);
    construireFonction(w, P);
    exercicesBonus(w, P);
    resolutionsGraphiques(w, P);
    fractionsDecimalesVides(w, P);
    paireFausseCaseFautive(w, P);
    associerDerivee(w, P);
    signePremierDegre(w, P);
    variationsDerivee(w, P);
    /* LA LISTE DE LA PAGE ne doit nommer que des exercices qui existent. Le
       banc navigateur compare ce qui est AFFICHÉ à la liste de tests/profils.js,
       et ne peut donc rien dire d'un identifiant périmé dans celle de la page :
       l'exercice n'étant jamais visité, la comparaison passe. Un sabotage l'a
       montré en restant vert. Une exemption qui ne protège plus rien masquerait
       le jour où on réutilise l'identifiant. */
    if(evaluer(w, "typeof TABLES_SANS!=='undefined'").valeur){
      verifierEval(w, 'chaque exercice nommé dans TABLES_SANS existe encore', `(function(){
        const inconnus=TABLES_SANS.filter(function(id){ return !TESTS[id]; });
        return inconnus.length ? 'identifiant(s) inconnu(s) : '+inconnus.join(', ') : '';
      })()`, v => v === '', undefined);
    }
    simplifierBarres(w, P);
    multiplierFractions(w, P);
    synthesePourcentage(w, P);
    syntheseLibrePourcentage(w, P);
    syntheseAugLibreRedigee(w, P);
    verificationAvecPropositions(w, P);
    poseSuitLEleve(w, P);
    poseOperationSuitLEleve(w, P);
    correctionSignesVariations(w, P);
    termeEntierDansCaseCoefficient(w, P);

    if(P.specifique === 'premiere') premiere(w);
    if(P.specifique === 'seconde') seconde(w);
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
    coursEnPdf(w, apres);
  });
}

/* ---------- 4 quinquies. Ce que la page envoie au modèle tient-il ? --------
   L'aide par IA passe par la fonction Edge « corriger-definition », qui REFUSE
   tout contexte plus long que MAX_CTX — et le refus arrive à l'élève sous la
   forme « Demande de conseil invalide. », qui n'explique rien.

   C'est arrivé en production, en août 2026 : la Terminale envoie à elle seule
   6650 caractères de consignes AVANT le contexte de l'exercice, et deux écrans
   dépassaient la borne de 8000 — « Signe et variations » (8139) et « Lecture
   graphique » (8096). Les élèves de ces deux exercices n'avaient plus d'aide du
   tout, les autres passaient à 400 caractères près, et rien ne le disait : ni
   erreur dans la page, ni trace dans le banc, qui ne mesurait pas cette
   longueur.

   Le contrôle OUVRE donc chaque exercice et mesure ce qui partirait vraiment.
   La borne est LUE dans la source de la fonction, jamais recopiée : c'est le
   même défaut « deux endroits que rien ne relie » que pour le domaine des
   comptes ou la longueur des codes. Attention toutefois — la fonction ne se
   déploie pas toute seule : ce contrôle compare la page au FICHIER du dépôt, il
   ne voit pas ce qui tourne réellement chez Supabase. */
/* ---------- L'étude complète CLIQUÉE : la note compte les cases ET la dérivée lue par l'IA ----------
   {etude-exponentielle} mélange deux juges : 46 cases locales et une feuille
   dont le verdict vient du modèle. Le contrôle stubbe sb ET la feuille (le
   modèle de verdictColore), puis CLIQUE : la feuille vide arrête la
   vérification AVANT l'appel, la copie parfaite vaut 47/47, l'appel à l'IA
   porte la dérivée attendue et la rédaction telle quelle, une dérivée refusée
   coûte exactement le point de la feuille, et les cases fausses sont révélées
   et décomptées. Il vit dans la chaîne séquentielle parce qu'il remplace sb :
   lancé en parallèle, un autre contrôle le lui reprendrait en plein vol. */
/* ---- Le verdict du juge PRIME sur celui du modèle -------------------------
   Le juge peut être parfait et ne rien changer si checkSFL/checkMLL n'en font
   rien : les contrôles CLIQUENT donc « Vérifier » avec un modèle stubbé qui
   SE TROMPE, et lisent la note et la couleur — la leçon de partout, l'élève
   regarde la couleur. Quatre bords : le modèle refuse une copie juste (le
   défaut de production) et la page donne quand même le point ; le modèle
   accepte une copie fausse et la page refuse quand même ; quand le juge
   s'abstient, le modèle redevient seul juge, sans bloc VERDICT dans la
   règle ; et quand le modèle est en panne, le juge répond seul au lieu de
   bloquer l'élève. */
function jugeArithmetiqueClique(w, apres){
  const present = evaluer(w, "typeof libreJuge==='function' && typeof checkSFL==='function'");
  if(!present.ok || !present.valeur){
    ignorer('le verdict du juge arithmétique prime sur celui du modèle',
      'ce niveau n\'a pas le juge arithmétique des rédactions');
    return etudeCompleteClique(w, apres);
  }
  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    const feuille=function(texte){ return { lire:function(){ return texte; },
      lignes:[{mf:{getValue:function(){ return 'x'; },focus:function(){},setValue:function(){},executeCommand:function(){}}}],
      verrouiller:function(){} }; };
    let MODELE={correct:false, panne:false}, envoye=null;
    sb.functions={ invoke:async function(nom, opts){
      envoye=(opts&&opts.body)||null;
      if(MODELE.panne) throw new Error('panne simulée');
      return { data:{ correct:MODELE.correct, feedback:'Retour du modèle stubbé.' } };
    } };
    const qS={n1:1,d1:2,n2:1,d2:6,op:'\\u2212',D:6,N1:3,N2:1,N:2,Nr:1,Dr:3};
    const lina='(1)/(2)-(1)/(6)\\n= (1*6)/(2*6)-(1*2)/(6*2)\\n= (6)/(12)-(2)/(12)\\n= (4)/(12)\\n= (1)/(3)';
    function armeSFL(copie){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'sfl', questions:[qS], idx:0, score:0,
        answers:[], startTime:Date.now(), locked:false, sflBusy:false});
      test.qId='somme-fractions-libre'; test.sflDepart='depart';
      sflFeuille=feuille(copie); envoye=null;
      const f=document.getElementById('sflFeedback'); if(f){ f.textContent=''; f.className='mp-feedback'; }
    }
    function couleur(){ const c=(document.getElementById('sflFeedback')||{}).className||'';
      return /\\bgood\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':'rien'); }

    /* 1. le défaut de production : le modèle refuse une copie juste */
    armeSFL(lina); MODELE={correct:false, panne:false};
    await checkSFL();
    if(test.score!==1 || test.answers[0].correct!==true)
      vus.push('le modèle refuse une copie juste et la page le suit : score '+test.score);
    if(couleur()!=='vert') vus.push('copie juste sous modèle qui refuse : peinte « '+couleur()+' » au lieu de vert');
    /* le modèle a contredit le verdict : sa prose raconte l'autre verdict,
       elle ne doit pas s'afficher sous une peinture verte */
    const fb1=(document.getElementById('sflFeedback')||{}).textContent||'';
    if(fb1.indexOf('stubbé')>=0) vus.push('le modèle contredit le verdict et sa prose s\\'affiche quand même');
    if(!envoye || String(envoye.question||'').indexOf('VERDICT DÉJÀ CALCULÉ')<0 || String(envoye.question||'').indexOf('vaut true')<0)
      vus.push('le verdict du juge ne part pas au modèle avec la règle');

    /* 2. le bord opposé : le modèle accepte une copie fausse */
    armeSFL('(1)/(2)-(1)/(6)\\n= (3)/(6)-(1)/(6)\\n= (5)/(12)'); MODELE={correct:true, panne:false};
    await checkSFL();
    if(test.score!==0 || test.answers[0].correct!==false)
      vus.push('le modèle accepte une copie fausse et la page le suit : score '+test.score);
    if(couleur()!=='rouge') vus.push('copie fausse sous modèle qui accepte : peinte « '+couleur()+' » au lieu de rouge');
    if(!envoye || String(envoye.question||'').indexOf('vaut false')<0)
      vus.push('le verdict « faux » du juge ne part pas au modèle');

    /* 3. le juge s'abstient (étape absente) : le modèle redevient seul juge */
    armeSFL('(1)/(2)-(1)/(6)\\n= (1)/(3)'); MODELE={correct:false, panne:false};
    await checkSFL();
    if(test.score!==0 || test.answers[0].correct!==false)
      vus.push('juge abstenu : le refus du modèle devait faire foi, score '+test.score);
    if(envoye && String(envoye.question||'').indexOf('VERDICT DÉJÀ CALCULÉ')>=0)
      vus.push('le juge s\\'abstient mais un bloc VERDICT part quand même au modèle');

    /* 4. le modèle en panne : le juge répond seul */
    armeSFL(lina); MODELE={correct:false, panne:true};
    await checkSFL();
    if(test.score!==1 || !test.answers.length || test.answers[0].correct!==true)
      vus.push('modèle en panne sur une copie juste : la page devait donner le point, score '+test.score);
    const fbtxt=(document.getElementById('sflFeedback')||{}).textContent||'';
    if(fbtxt.indexOf('indisponible')>=0) vus.push('modèle en panne : la page dit « indisponible » alors que le juge savait');

    /* 5. 4.9 : la division multipliée sans retourner, sous un modèle qui accepte */
    if(typeof checkMLL==='function'){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'mll', inv:true, questions:[{n1:3,d1:5,n2:2,d2:7,a1:3,a2:7,b1:5,b2:2,P:21,Q:10}], idx:0, score:0,
        answers:[], startTime:Date.now(), locked:false, mllBusy:false});
      test.qId='diviser-fractions-libre'; test.mllDepart='depart';
      mllFeuille=feuille('(3)/(5)\\\\div(2)/(7)\\n= (3)/(5)*(2)/(7)\\n= (6)/(35)');
      MODELE={correct:true, panne:false};
      await checkMLL();
      if(test.score!==0 || test.answers[0].correct!==false)
        vus.push('4.9 : la division multipliée sans retourner passe sous un modèle qui accepte, score '+test.score);
      const fb5=(document.getElementById('mllFeedback')||{}).textContent||'';
      if(fb5.indexOf('stubbé')>=0) vus.push('4.9 : le modèle contredit le verdict et sa prose s\\'affiche quand même');
    }
    return vus.join(' | ');
  })()`, function(r){
    if(!r.ok) verifier('le verdict du juge arithmétique prime sur celui du modèle', false, 'erreur JavaScript : '+r.erreur);
    else verifier('le verdict du juge arithmétique prime sur celui du modèle', r.valeur==='', r.valeur);
    etudeCompleteClique(w, apres);
  });
}
function etudeCompleteClique(w, apres){
  const present = evaluer(w, "typeof checkEC==='function' && typeof ecJugeLocal==='function'");
  if(!present.ok || !present.valeur){
    ignorer('l\'étude complète cliquée : la note compte les cases ET la dérivée lue par l\'IA',
      'ce niveau n\'a pas l\'exercice de l\'étude complète');
    return devoirPapierClique(w, apres);
  }
  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='etude-exponentielle';
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'ec', questions:[{a:1,b:-3}], idx:0, score:0, answers:[], locked:false, startTime:Date.now(), maxScore:47});
    const feuille=function(texte){ return { lire:function(){ return texte; }, lignes:[], verrouiller:function(){} }; };
    let appels=[], verdictOk=true;
    const BON={'ec-a1':0,'ec-a2':0,'ec-aexp':'jamais','ec-a3':0,'ec-a4':3,'ec-a5':3,'ec-a6':0,'ec-a7':0,'ec-a8':0,'ec-a9':0,'ec-a10':-3,'ec-a11':0,'ec-a12':-3,'ef-r0':4,'ef-l0s0':'+','ef-l0s1':'\u2212','ef-l1s0':'+','ef-l1s1':'+','ef-l2s0':'+','ef-l2s1':'\u2212','ef-a0':'up','ef-a1':'down','ef-e0t':'max','ef-e0x':4,'ec-d1':4,'ec-d2':4,'ec-d3':4,'ec-d4':1,'ec-d5':-4,'ec-e1':1,'ec-e2':1,'ec-e3':-2,'ec-f1':1,'ec-f2':1,'ec-f3':3,'ec-g1':1,'ec-g2':1,'ec-g3':1,'ec-g4':3,'ec-g5':1,'ec-g6':-2,'ec-g7':3,'ec-g8':-3,'ec-g9':-2,'ec-g10':3,'ec-g11':-5};
    const poser=function(vals){ test.locked=false; test.ecBusy=false; renderEC();
      sb.functions={ invoke:async function(nom, opts){ appels.push((opts&&opts.body)||{});
        return { data:{ correct:verdictOk, feedback: verdictOk?'Ta dérivée est juste.':'Il y a une erreur dans ta dérivée.' } }; } };
      Object.keys(vals).forEach(function(id){ const el=document.getElementById(id); if(el) el.value=String(vals[id]); }); };
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':'rien'); };

    /* la feuille vide arrête la vérification AVANT l'appel au modèle */
    poser(BON); ecF=feuille('');
    await checkEC();
    if(appels.length) vus.push('la feuille vide part quand même à l\\'IA');
    if(test.locked) vus.push('la feuille vide verrouille la question');

    /* copie parfaite : 47/47, tout vert, et l'appel porte la bonne dérivée */
    poser(BON); ecF=feuille("f'(x) = (-x+4)e^(-x)"); test.score=0;
    await checkEC();
    if(!test.locked) vus.push('la copie parfaite ne verrouille pas la question');
    if(test.score!==47) vus.push('la copie parfaite vaut '+test.score+' au lieu de 47');
    const rouges=Object.keys(BON).filter(function(id){ return peint(id)!=='vert'; });
    if(rouges.length) vus.push('cases non vertes sur la copie parfaite : '+rouges.slice(0,5).join(','));
    const corps=appels[appels.length-1]||{};
    /* l'attendu porte DEUX écritures (principale, puis « ÉGALEMENT CORRECT dans
       l'autre ordre ») : chercher la dérivée dans TOUT le texte ne prouve rien,
       l'autre moitié la porterait encore — le sabotage l'a montré en restant
       vert. On exige la dérivée dans CHAQUE moitié. */
    const att=String(corps.attendu||'');
    const attCoupe=att.indexOf(' — ÉGALEMENT');
    const attP=attCoupe<0?att:att.slice(0,attCoupe), attA=attCoupe<0?'':att.slice(attCoupe);
    if(attP.indexOf('−x + 4')<0 && attP.indexOf('-x + 4')<0)
      vus.push('l\\'attendu principal envoyé à l\\'IA ne porte pas la dérivée (−x + 4)e^(−x) : « '+attP.slice(0,60)+' »');
    if(attA.indexOf('−x + 4')<0 && attA.indexOf('-x + 4')<0)
      vus.push('l\\'attendu n\\'offre pas la dérivée dans l\\'autre ordre : « '+attA.slice(0,60)+' »');
    if(corps.reponse!=="f'(x) = (-x+4)e^(-x)") vus.push('la rédaction de l\\'élève ne part pas telle quelle');
    if(corps.balises!==true) vus.push('l\\'appel ne demande pas les balises');

    /* dérivée refusée par le modèle : la note perd EXACTEMENT le point de la feuille */
    verdictOk=false;
    poser(BON); ecF=feuille("f'(x) = (x+4)e^(-x)"); test.score=0;
    await checkEC();
    if(test.score!==46) vus.push('cases justes + dérivée fausse : '+test.score+' au lieu de 46');

    /* deux cases fausses : décomptées, puis révélées (correction verte, classe sol) */
    verdictOk=true;
    poser(Object.assign({},BON,{'ec-e3':999,'ec-g11':999})); ecF=feuille("f'(x) = (-x+4)e^(-x)"); test.score=0;
    await checkEC();
    if(test.score!==45) vus.push('deux cases fausses : '+test.score+' au lieu de 45');
    const rev=(document.getElementById('ec-e3')||{}).value||'';
    if(rev!=='−2' && rev!=='-2') vus.push('la case fausse n\\'est pas révélée à la correction (valeur « '+rev+' »)');
    return vus.slice(0,4).join(' | ');
  })()`, function(r){
    const nom='l\'étude complète cliquée : la note compte les cases ET la dérivée lue par l\'IA';
    if(!r.ok) verifier(nom, false, 'erreur JavaScript : '+r.erreur);
    else verifier(nom, r.valeur==='', r.valeur);
    devoirPapierClique(w, apres);
  });
}
/* ---------- Le devoir sur papier : l'énoncé d'abord, et il part avec le prénom ----------
   En Terminale, un exercice de devoir montre D'ABORD son énoncé complet —
   toutes les questions, cases remplacées par des pointillés — puis l'élève
   choisit : papier ou ordinateur. Papier : l'énoncé part au professeur par le
   canal des signalements, avec le prénom et le tirage EXACT montré — c'est ce
   que le professeur corrigera. Le contrôle joue le parcours entier : les deux
   portes d'entrée, l'affichage, le choix ordinateur, l'envoi papier (prénom,
   marque dmPapier, tirage fidèle, double clic muet, échec DIT), puis la vue
   professeur (ligne distinguée, énoncé rejoué, verrou REJEU). Il vit dans la
   chaîne séquentielle parce qu'il remplace sb — le piège documenté. */
function devoirPapierClique(w, apres){
  const present = evaluer(w, "typeof dmEnonce==='function' && typeof dmePapier==='function'");
  if(!present.ok || !present.valeur){
    ignorer('le devoir sur papier : l\'énoncé d\'abord, et il part avec le prénom',
      'ce niveau n\'a pas le choix papier/ordinateur des devoirs');
    return longueurContexteIA(w, apres);
  }
  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Léa'}; currentMode='train'; currentDM=null;
    mesDevoirs=[{id:'dev-1', num:7, titre:'Contrôle', actif:true, exercices:[{id:'tangente-exp',modes:['train']}]}];
    let continuerAppels=0;

    /* ---- 1. l'énoncé complet s'affiche, sans une seule case de saisie ---- */
    await dmEnonce('dev-1','tangente-exp', function(){ continuerAppels++; });
    const on=document.querySelector('.screen.on');
    if(!on||on.id!=='scr-dmenonce') vus.push('l\\'écran d\\'énoncé ne s\\'affiche pas ('+(on?on.id:'aucun')+')');
    const nb=document.querySelectorAll('#dmeCorps .dme-q').length;
    if(nb!==3) vus.push(nb+' question(s) dans l\\'énoncé au lieu de 3');
    if(document.querySelector('#dmeCorps input,#dmeCorps select,#dmeCorps math-field,#dmeCorps button'))
      vus.push('l\\'énoncé garde des cases de saisie ou des boutons');
    if(!document.querySelector('#dmeCorps .dme-blank')) vus.push('aucun pointillé : les cases ne sont pas remplacées');
    if((document.getElementById('dmeCorps').textContent||'').indexOf('Démontre que')<0)
      vus.push('l\\'énoncé ne porte pas le texte des questions');
    /* une photo ne porte AUCUN id : les conteneurs clonés gardaient les leurs,
       et l'écran d'énoncé venant avant les écrans d'exercice, un vrai
       navigateur faisait écrire le rendu de l'exercice DANS le clone —
       « Complète au moins une case » sur copie pleine (signalé par Turquet,
       août 2026). jsdom rend l'original par son cache d'id : ce bord se tient
       donc en STRUCTURE, pas par getElementById. */
    if(document.querySelector('#dmeCorps [id]'))
      vus.push('la photo de l\\'énoncé garde des id — le rendu de l\\'exercice écrirait dans le clone chez l\\'élève');

    /* ---- 2. « sur l'ordinateur » : la suite d'avant, inchangée ---- */
    dmeOrdinateur();
    if(continuerAppels!==1) vus.push('« sur l\\'ordinateur » n\\'appelle pas la suite normale ('+continuerAppels+')');
    if((document.getElementById('dmeCorps').innerHTML||'').trim()!=='')
      vus.push('quitter l\\'énoncé laisse son clone dans le document — un écran fantôme de plus');

    /* ---- 3. « sur papier » : la ligne part, prénom + marque + tirage exact ---- */
    await dmEnonce('dev-1','tangente-exp', function(){ continuerAppels++; });
    const tirage=test.questions.map(function(q){ return q.a+'/'+q.b; }).join(';');
    await dmePapier();
    let lignes=(window.__faux.journal||[]).filter(function(j){ return j.op==='insert'&&j.table==='signalements'; });
    let row=null;
    if(lignes.length!==1){ vus.push(lignes.length+' insertion(s) au lieu de 1'); }
    else{
      row=lignes[0].lignes[0];
      const msg=String(row.message||'');
      if(msg.indexOf('Léa')<0) vus.push('le message ne porte pas le prénom : « '+msg+' »');
      if(msg.indexOf('DM sur papier')<0) vus.push('le message ne dit pas « DM sur papier »');
      if(msg.indexOf('Devoir n°7')<0) vus.push('le message ne nomme pas le devoir');
      if(!row.contexte||row.contexte.dmPapier!==true) vus.push('la ligne ne porte pas la marque dmPapier');
      if(!row.contexte||row.contexte.dm!=='dev-1') vus.push('la ligne ne porte pas l\\'identifiant du devoir');
      const envoye=((row.contexte&&row.contexte.questions)||[]).map(function(q){ return q.a+'/'+q.b; }).join(';');
      if(envoye!==tirage) vus.push('le tirage envoyé n\\'est pas celui montré à l\\'élève ('+envoye+' contre '+tirage+')');
    }
    await dmePapier();   /* second clic : rien ne repart */
    lignes=(window.__faux.journal||[]).filter(function(j){ return j.op==='insert'&&j.table==='signalements'; });
    if(lignes.length!==1) vus.push('un second clic envoie une seconde ligne ('+lignes.length+')');

    /* ---- 4. l'échec d'envoi se DIT, et ne se fait pas passer pour un succès ---- */
    await dmEnonce('dev-1','tangente-exp', function(){});
    const vraiToast=toast, dits=[];
    toast=function(m,t){ dits.push((t||'ok')+':'+m); };
    window.__faux.panne=true;
    await dmePapier();
    window.__faux.panne=false; toast=vraiToast;
    if(!dits.some(function(t){ return /^err:/.test(t); })) vus.push('l\\'échec d\\'envoi n\\'est pas dit à l\\'élève : '+dits.join(' ¦ '));
    if(dits.some(function(t){ return /^ok:/.test(t); })) vus.push('l\\'échec d\\'envoi est annoncé comme un succès : '+dits.join(' ¦ '));
    if(dmeCtx&&dmeCtx.envoye) vus.push('l\\'échec d\\'envoi marque quand même « envoyé »');
    dmeCtx=null;

    /* ---- 5. les DEUX portes d'un devoir passent par l'énoncé ---- */
    const vraiDme=dmEnonce; let passes=0;
    dmEnonce=async function(){ passes++; };
    try{ lancerDevoir('dev-1','tangente-exp','train'); openTestDevoir('dev-1','tangente-exp'); }
    finally{ dmEnonce=vraiDme; }
    if(passes!==2) vus.push('une porte de devoir contourne l\\'écran d\\'énoncé ('+passes+'/2)');

    /* ---- 6. côté professeur : la ligne se distingue, l'énoncé se rejoue, REJEU posé ---- */
    if(row){
      mesSignalements=[{id:'sig-1', eleve_id:'e2', exercice:'tangente-exp', numero:'5.2', mode:null,
        message:row.message, prenom:'Léa', lu:false, created_at:'2026-08-26T08:00:00Z',
        version:1, navigateur:'x', capture:null, contexte:row.contexte}];
      renderSignalements();
      const item=document.querySelector('#sigListe .sig-item');
      if(!item){ vus.push('la liste des signalements du professeur est vide'); }
      else{
        if((item.textContent||'').indexOf('devoir sur papier')<0) vus.push('la ligne DM papier ne se distingue pas d\\'un signalement');
        if(!item.querySelector('button[onclick*="voirEnonceDM"]')) vus.push('pas de bouton « Voir l\\'énoncé complet »');
        if(item.querySelector('button[onclick*="rejouerSignalement"]')) vus.push('la ligne papier propose encore « Rejouer l\\'écran »');
      }
      REJEU=false;
      voirEnonceDM('sig-1');
      if(REJEU!==true) vus.push('la vue professeur ne pose pas le verrou REJEU — terminer un écran rejoué poserait une note');
      const on2=document.querySelector('.screen.on');
      if(!on2||on2.id!=='scr-dmenonce') vus.push('la vue professeur n\\'affiche pas l\\'écran d\\'énoncé');
      if((document.getElementById('dmeTitre').textContent||'').indexOf('Léa')<0) vus.push('le prénom de l\\'élève manque sur l\\'énoncé du professeur');
      const nb2=document.querySelectorAll('#dmeCorps .dme-q').length;
      if(nb2!==3) vus.push('la vue professeur montre '+nb2+' question(s) au lieu de 3');
      REJEU=false;
    }
    return vus.slice(0,4).join(' | ');
  })()`, function(r){
    const nom='le devoir sur papier : l\'énoncé d\'abord, et il part avec le prénom';
    if(!r.ok) verifier(nom, false, 'erreur JavaScript : '+r.erreur);
    else verifier(nom, r.valeur==='', r.valeur);
    longueurContexteIA(w, apres);
  });
}
function longueurContexteIA(w, apres){
  let maxCtx;
  try{
    maxCtx = parseInt((fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/corriger-definition/index.ts'), 'utf8')
      .match(/const MAX_CTX\s*=\s*(\d+)/) || [])[1], 10);
  }catch(e){ maxCtx = undefined; }
  if(!maxCtx){
    verifier('le contexte envoyé au modèle tient dans la borne de la fonction Edge',
      false, 'MAX_CTX introuvable dans supabase/functions/corriger-definition/index.ts');
    return apres();
  }

  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    if(typeof qiaEnvoyer!=='function') return { absent:true };
    let taille=0;
    sb.functions.invoke=function(n,o){
      taille=Math.max(taille, ((o&&o.body&&o.body.contexte)||'').length);
      return Promise.resolve({ data:{ feedback:'ok' }, error:null });
    };
    currentEleve={id:'e1',prenom:'Contrôle'}; currentMode='soutien'; currentDM=null;
    /* la question ne doit pas demander un rappel de cours : la page y répond
       elle-même, sans appeler la fonction — on ne mesurerait rien. */
    const QUESTION='Quel est le lien entre le signe de la dérivée et les variations ?';
    const mesures=[];
    for(const id of Object.keys(TESTS)){
      const t=TESTS[id];
      if(!t || typeof t.start!=='function') continue;
      try{ await t.start(); }catch(e){}
      await new Promise(function(r){ setTimeout(r,0); });
      let d=document.getElementById('qiaDialog');
      if(!d){ d=document.createElement('div'); d.id='qiaDialog'; document.body.appendChild(d); }
      let i=document.getElementById('qiaInput');
      if(!i){ i=document.createElement('input'); i.id='qiaInput'; document.body.appendChild(i); }
      i.value=QUESTION; taille=0; qiaBusy=false;
      try{ await qiaEnvoyer(); }catch(e){}
      if(taille>0) mesures.push([id, taille]);
    }
    mesures.sort(function(a,b){ return b[1]-a[1]; });
    return { mesures:mesures };
  })()`, r => {
    if(!r.ok){
      verifier('le contexte envoyé au modèle tient dans la borne de la fonction Edge',
        false, 'erreur JavaScript : ' + r.erreur);
      return apres();
    }
    const v = r.valeur || {};
    if(v.absent){
      ignorer('le contexte envoyé au modèle tient dans la borne de la fonction Edge',
        'ce niveau n’a pas de fenêtre « Question à l’IA »');
      return apres();
    }
    const mesures = v.mesures || [];
    if(!mesures.length){
      verifier('le contexte envoyé au modèle tient dans la borne de la fonction Edge',
        false, 'aucun exercice n’a envoyé de contexte : le contrôle ne mesure rien');
      return apres();
    }
    const trop = mesures.filter(m => m[1] > maxCtx);
    const pire = mesures[0];
    verifier('le contexte envoyé au modèle tient dans la borne de la fonction Edge',
      trop.length === 0,
      trop.map(m => m[0] + ' : ' + m[1]).slice(0, 4).join(' , ') +
      ' — la fonction refuse au-delà de ' + maxCtx + ' et l’élève lit « Demande de conseil invalide. »');
    if(trop.length === 0){
      console.log('   · le plus long contexte : ' + pire[0] + ' (' + pire[1] +
        ' caractères, ' + (maxCtx - pire[1]) + ' de marge sur ' + maxCtx + ')');
    }
    apres();
  });
}

/* ---------- 4 quater. Les cours en PDF déposés par le professeur -----------
   Le professeur dépose un PDF, l'élève le retrouve en haut de la page des
   exercices. Le fichier vit dans un bucket Supabase, les métadonnées dans la
   table des paramètres, à côté des devoirs.

   Quatre bords, et aucun ne se voit à la relecture :

   — LE REFUS MUET, une fois de plus. storage.remove() rend la liste de ce qui
     a été retiré : sous RLS, un refus n'est pas une erreur, c'est une liste
     VIDE. La page doit compter, sinon elle annonce « supprimé ✓ » sur un
     fichier que la classe a toujours sous les yeux. C'est exactement le défaut
     qui a coûté le plus cher à ce projet, sur les brouillons de pause ;

   — L'ORPHELIN. Un dépôt qui réussit suivi d'un enregistrement qui échoue
     laisserait un fichier en ligne que plus rien ne désigne : invisible, et
     décompté du quota. Il doit être retiré ;

   — LES DEVOIRS D'À CÔTÉ. Métadonnées et devoirs partagent une seule ligne de
     paramètres. Un enregistrement qui repartirait d'une copie ancienne — ou
     qui écraserait « valeurs » au lieu de le compléter — effacerait les
     devoirs de la classe sans un mot ;

   — L'ONGLET AVANT L'ATTENTE. window.open() appelé APRÈS un await est bloqué
     comme une fenêtre surgissante : l'élève cliquerait sans que rien ne
     s'ouvre. Ce dernier bord se lit dans le source de la fonction, faute de
     bloqueur dans jsdom. */
function coursEnPdf(w, apres){
  const src = lire(CIBLE);
  const TP = (src.match(/from\('(parametres[a-z0-9_]*)'\)/) || [])[1];
  if(!TP || !/BUCKET_COURS/.test(src)){
    ignorer('le professeur peut déposer un cours en PDF', 'ce niveau n’a pas de dépôt de cours');
    return renommerEleve(w, apres);
  }

  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const dits=[]; const vraiToast=toast; toast=function(m,k){ dits.push((k||'ok')+':'+m); };
    const bilan={};
    const fichiers=function(){ return Object.keys((window.__faux.fichiers||{}).cours||{}); };
    const poserFichier=function(nom,type,taille){
      const champ=document.getElementById('coursFichier');
      Object.defineProperty(champ,'files',{configurable:true,
        value:[{name:nom,type:type,size:taille}]});
      return champ;
    };
    try{
      window.confirm=function(){ return true; };
      /* La ligne des paramètres porte DÉJÀ un devoir et un réglage : ils doivent
         être encore là après le dépôt. */
      window.__faux.tables['${TP}']=[{id:1,valeurs:{
        secondsPerQuestion:30,
        devoirs:[{id:'dm_1',num:1,actif:true,titre:'Devoir de contrôle',cours:'',exercices:[]}]}}];

      /* 1. ce qui n'est pas un PDF, et ce qui est trop lourd, sont refusés ici */
      poserFichier('photo.png','image/png',1024);
      dits.length=0; await deposerCours();
      bilan.refusType=dits.join(' | ')+' /'+fichiers().length;
      poserFichier('enorme.pdf','application/pdf',25*1024*1024);
      dits.length=0; await deposerCours();
      bilan.refusTaille=dits.join(' | ')+' /'+fichiers().length;

      /* 2. le dépôt ordinaire */
      document.getElementById('coursTitre').value='Cours et fiche n\u00b01';
      poserFichier('Chapitre 3 — pourcentages.pdf','application/pdf',2*1024*1024);
      dits.length=0; await deposerCours();
      bilan.ditsDepot=dits.join(' | ');
      bilan.deposes=fichiers().join(',');
      const liste=await listeCours();
      bilan.enregistres=liste.map(function(c){ return c.titre; }).join(' ; ');
      /* le chemin est une adresse : ni accent, ni espace, ni apostrophe */
      bilan.chemin=liste.length?liste[0].chemin:'';
      /* et les devoirs n'ont pas bougé */
      const ligne=window.__faux.tables['${TP}'][0].valeurs;
      bilan.devoirsRestants=(ligne.devoirs||[]).length;
      bilan.reglageRestant=ligne.secondsPerQuestion;

      /* 3. la liste du professeur montre ce qu'il vient de déposer. C'est
         désormais le seul écran de l'application qui affiche les cours : les
         élèves les lisent sur le portail, pas ici. */
      await chargerCoursProf();
      const liste2=document.getElementById('coursListeProf');
      bilan.profTexte=liste2.textContent.replace(/[ \\n\\t]+/g,' ').trim();
      bilan.profOuvre=liste2.innerHTML.indexOf('onclick="ouvrirCours(')>=0;

      /* 4. LE REFUS MUET : rien n'est retiré, rien n'est dit par la base */
      const id=(await listeCours())[0].id;
      dits.length=0; window.__faux.refusMuet=true;
      await supprimerCours(id);
      window.__faux.refusMuet=false;
      bilan.muetFichiers=fichiers().length;
      bilan.muetListe=(await listeCours()).length;
      bilan.ditsMuet=dits.join(' | ');

      /* 5. la suppression qui aboutit vraiment */
      dits.length=0;
      await supprimerCours(id);
      bilan.supFichiers=fichiers().length;
      bilan.supListe=(await listeCours()).length;

      /* 6. L'ORPHELIN : le fichier part, l'enregistrement échoue */
      const vraiPersist=persistCours;
      persistCours=function(){ return Promise.reject(new Error('base refusée')); };
      document.getElementById('coursTitre').value='Cours orphelin';
      poserFichier('orphelin.pdf','application/pdf',1024);
      dits.length=0; await deposerCours();
      persistCours=vraiPersist;
      bilan.orphelins=fichiers().length;
      bilan.ditsOrphelin=dits.join(' | ');

      /* 7. l'onglet s'ouvre AVANT l'attente, sinon le navigateur le bloque */
      const corps=String(ouvrirCours);
      bilan.ordreOnglet=(corps.indexOf('window.open')>=0
        && corps.indexOf('window.open')<corps.indexOf('createSignedUrl'));
    } finally { toast=vraiToast; window.__faux.refusMuet=false; window.__faux.panne=false; }
    return bilan;
  })()`, r => {
    const b = r.ok ? (r.valeur || {}) : {};
    const souci = r.ok ? '' : 'erreur JavaScript : ' + r.erreur;

    verifier('un fichier qui n’est pas un PDF est refusé, et rien n’est déposé',
      r.ok && /err:/.test(String(b.refusType||'')) && / \/0$/.test(String(b.refusType||'')),
      souci || 'réaction : ' + b.refusType);
    verifier('un fichier trop lourd est refusé avant l’envoi',
      r.ok && /err:/.test(String(b.refusTaille||'')) && / \/0$/.test(String(b.refusTaille||'')),
      souci || 'réaction : ' + b.refusTaille);
    verifier('le dépôt d’un PDF met le fichier en ligne et l’enregistre',
      r.ok && String(b.deposes||'').split(',').filter(Boolean).length === 1
           && /Cours et fiche n/.test(String(b.enregistres||'')) && /\u2713/.test(String(b.ditsDepot||'')),
      souci || 'fichiers : ' + b.deposes + ' — enregistrés : ' + b.enregistres + ' — dit : ' + b.ditsDepot);
    verifier('le chemin du fichier ne porte ni accent, ni espace, ni apostrophe',
      r.ok && /^[a-z0-9]+\/[a-z0-9.\-]+\.pdf$/.test(String(b.chemin||'')),
      souci || 'chemin produit : ' + b.chemin);
    verifier('déposer un cours ne touche ni aux devoirs ni aux réglages',
      r.ok && b.devoirsRestants === 1 && b.reglageRestant === 30,
      souci || 'devoirs restants : ' + b.devoirsRestants + ' — temps par question : ' + b.reglageRestant);
    verifier('le professeur retrouve son cours dans sa liste, avec de quoi l’ouvrir',
      r.ok && /Cours et fiche n/.test(String(b.profTexte||'')) && b.profOuvre === true,
      souci || 'liste affichée : « ' + String(b.profTexte||'').slice(0, 90) + ' »');
    verifier('une suppression que la base refuse EN SILENCE n’est pas annoncée comme faite',
      r.ok && b.muetFichiers === 1 && b.muetListe === 1 && /err:/.test(String(b.ditsMuet||'')),
      souci || 'fichiers restants : ' + b.muetFichiers + ', enregistrés : ' + b.muetListe +
               ' — l’élève du professeur a lu « ' + b.ditsMuet + ' »');
    verifier('la suppression qui aboutit retire le fichier ET son enregistrement',
      r.ok && b.supFichiers === 0 && b.supListe === 0,
      souci || 'fichiers restants : ' + b.supFichiers + ', enregistrés : ' + b.supListe);
    verifier('un dépôt dont l’enregistrement échoue ne laisse pas de fichier fantôme',
      r.ok && b.orphelins === 0 && /err:/.test(String(b.ditsOrphelin||'')),
      souci || 'fichiers restants : ' + b.orphelins + ' — dit : ' + b.ditsOrphelin);
    verifier('l’onglet du PDF s’ouvre avant l’attente, sinon le navigateur le bloque',
      r.ok && b.ordreOnglet === true,
      souci || 'window.open() est appelé après createSignedUrl() dans ouvrirCours()');
    renommerEleve(w, apres);
  });
}

/* ---------- 4 bis. Contrôles propres à la Seconde ----------
   L'exercice des intervalles montre un SCHÉMA et demande d'écrire ce qu'il
   montre. Le dessin et l'écriture sont donc la même chose dite deux fois : si
   l'un des deux se met à dire autre chose, l'exercice enseigne le contraire de
   ce qu'il affirme, et rien ne le signale — l'élève répond ce que le dessin
   lui montre, la page le corrige avec l'autre version, et il croit s'être
   trompé. C'est le défaut de la retenue de la soustraction, dessinée au bon
   endroit dans le mauvais sens : personne ne l'a lu, pas même un professeur de
   mathématiques.
   Aucune coordonnée n'est recopiée ici : les graduations se lisent DANS le
   schéma, et le sens d'un crochet se juge par rapport au trait rouge, jamais
   par rapport à un nombre écrit dans le contrôle. Un schéma dont l'échelle
   changerait resterait donc mesuré juste. */
/* ---------- 4 quater. Somme et différence de deux fractions ----------------
   Le même exercice vit en Seconde et en Première, sur un moteur unique : le
   tirage, la pose et la correction sont le MÊME texte dans les deux fichiers.
   Ce contrôle vaut donc pour les deux, et il s'annonce non applicable là où
   l'exercice n'est pas — la Terminale — plutôt que de disparaître en silence.

   Cinq bords, tous silencieux. Aucun ne casse quoi que ce soit : chacun compte
   faux un élève qui a raison, ou juste un élève qui a tort, et rien nulle part
   ne rougit.

   · L'ÉNONCÉ CONTREDIT SA CORRECTION. « q.N/q.D » est rangé au tirage, à côté
     des nombres de l'énoncé, et rien ne les relie : le jour où l'un des deux
     change, l'exercice affiche un calcul et en corrige un autre. C'est le pire
     des cinq, celui de l'inégalité qui contredit l'intervalle — la correction
     donne tort à une lecture juste.
   · LE DÉNOMINATEUR COMMUN N'EST PAS IMPOSÉ, et c'est une promesse. Un élève
     qui multiplie 1/2 et 1/3 par 12 et 8 au lieu de 6 et 4 a raison : il a bien
     mis les deux au même dénominateur. Une correction qui comparerait au PPCM
     compterait faux une méthode juste — exactement ce qu'un exercice ne doit
     jamais faire.
   · LE MULTIPLICATEUR VA EN HAUT ET EN BAS. Multiplier le numérateur par 3 et
     le dénominateur par 4 CHANGE la fraction, et c'est l'erreur que l'étape ①
     vise. Acceptée, l'exercice enseigne l'inverse de ce qu'il montre.
   · LE TIRAGE NE POSE PAS DE QUESTION PIÉGÉE. Deux dénominateurs égaux, il n'y
     a plus rien à mettre au même ; une fraction de départ réductible (6/2), et
     l'élève qui la simplifie d'abord — ce qui est juste — écrit des
     multiplicateurs que la correction, calée sur les nombres de l'énoncé,
     compte faux ; un résultat négatif ou nul sort du sujet ; un résultat
     réductible pose la question « faut-il simplifier ? » que l'exercice ne
     traite pas.
   · LA DERNIÈRE ÉTAPE ACCEPTE TOUTE FRACTION ÉGALE, comme partout ailleurs
     dans l'application. Exiger la forme irréductible ici seul serait une règle
     que rien n'annonce à l'élève.

   On EXERCE la vraie correction, en posant des valeurs dans les vraies cases —
   jamais une réimplémentation, qui se serait trompée du même côté. */
function sommeFractions(w, P){
  const present = evaluer(w, "typeof sfGen==='function' && typeof sfJuge==='function' && typeof startSF==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la somme de deux fractions se corrige sans compter faux une méthode juste',
      'ce niveau n\'a pas l\'exercice « Somme et différence de fractions »');
    return;
  }
  verifierEval(w, 'la somme de deux fractions se corrige sans compter faux une méthode juste', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='somme-fractions';

    /* ---- 1. le tirage, sur un grand nombre de coups ---------------------- */
    const pgcd=function(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t; } return a||1; };
    let entiers=0, plus=0, moins=0;
    for(let i=0;i<3000;i++){
      const q=sfGen();
      const eti='tirage '+q.n1+'/'+q.d1+' '+q.op+' '+q.n2+'/'+q.d2;
      /* l'énoncé et la correction disent-ils la même chose ? */
      const g=(q.op==='+') ? (q.n1*q.d2 + q.n2*q.d1) : (q.n1*q.d2 - q.n2*q.d1);
      const h=q.d1*q.d2;
      if(g*q.D !== q.N*h){ vus.push(eti+' : l\\'énoncé annonce '+q.N+'/'+q.D+', le calcul donne '+g+'/'+h); break; }
      if(q.d1===q.d2){ vus.push(eti+' : les deux dénominateurs sont déjà égaux, il n\\'y a rien à mettre au même'); break; }
      if(pgcd(q.n1,q.d1)!==1 || pgcd(q.n2,q.d2)!==1){ vus.push(eti+' : une fraction de départ est réductible — la simplifier d\\'abord est juste, et serait compté faux'); break; }
      if(q.N<=0){ vus.push(eti+' : le résultat vaut '+q.N+'/'+q.D); break; }
      if(pgcd(q.N,q.D)!==1){ vus.push(eti+' : le résultat '+q.N+'/'+q.D+' est réductible'); break; }
      if(q.N===q.D){ vus.push(eti+' : le résultat vaut 1 tout rond'); break; }
      if([q.n1,q.d1,q.n2,q.d2].some(function(x){ return x<1 || x>9; })){ vus.push(eti+' : un nombre de l\\'énoncé n\\'a pas un seul chiffre'); break; }
      if(q.D%q.d1 || q.D%q.d2 || q.k1!==q.D/q.d1 || q.k2!==q.D/q.d2){ vus.push(eti+' : les multiplicateurs rangés ne mènent pas au dénominateur '+q.D); break; }
      if(q.d1===1||q.d2===1) entiers++;
      if(q.op==='+') plus++; else moins++;
    }
    /* les deux formes doivent SORTIR : un tirage qui ne donnerait jamais
       d'entier retirerait le cas que l'énoncé annonce, sans rien casser.
       Seulement si la boucle est allée au bout : arrêtée à son premier tirage
       fautif, elle n'a rien compté, et le dire ferait passer un même défaut
       pour deux. */
    if(!vus.length){
      if(!entiers) vus.push('aucun entier tiré en 3000 coups : le cas « un terme sans dénominateur » a disparu');
      if(!plus || !moins) vus.push('une seule opération tirée en 3000 coups (+ : '+plus+', − : '+moins+')');
    }

    /* ---- 2. la correction, exercée pour de vrai -------------------------- */
    startSF();
    const poser=function(vals){
      Object.keys(vals).forEach(function(id){
        const el=document.getElementById(id); if(el) el.value=String(vals[id]);
      });
    };
    /* on force une question connue : 1/2 + 1/3, dénominateur commun 6 */
    test.questions[test.idx]={n1:1,d1:2,n2:1,d2:3,op:'+',D:6,k1:3,k2:2,N1:3,N2:2,N:5};
    renderSFTest();
    const q=test.questions[test.idx];
    const juger=function(vals){ poser(vals); return sfJuge(q); };

    /* a) la voie du PPCM : tout juste */
    let r=juger({'sf-a1':3,'sf-b1':3,'sf-a2':2,'sf-b2':2,'sf-num1':3,'sf-num2':2,'sf-den':6,'sf-fn':5,'sf-fd':6});
    if(!(r.ok1&&r.ok2&&r.ok3&&r.ok4)) vus.push('la voie du PPCM (×3 et ×2, 3/6 + 2/6 = 5/6) est comptée fausse');

    /* b) un dénominateur commun NON minimal : 12. C'est la promesse même de
          l'exercice — une méthode plus lourde reste une méthode juste. */
    r=juger({'sf-a1':6,'sf-b1':6,'sf-a2':4,'sf-b2':4,'sf-num1':6,'sf-num2':4,'sf-den':12,'sf-fn':5,'sf-fd':6});
    if(!(r.ok1&&r.ok2&&r.ok3&&r.ok4)) vus.push('le dénominateur commun 12 (×6 et ×4) est compté faux : l\\'exercice impose le PPCM');

    /* c) la dernière étape accepte toute fraction ÉGALE */
    r=juger({'sf-a1':3,'sf-b1':3,'sf-a2':2,'sf-b2':2,'sf-num1':3,'sf-num2':2,'sf-den':6,'sf-fn':10,'sf-fd':12});
    if(!r.ok4) vus.push('10/12 est refusé alors qu\\'il vaut 5/6');

    /* d) le multiplicateur n'est pas le même en haut et en bas : la fraction
          a CHANGÉ de valeur, c'est l'erreur que l'étape ① vise.
          LE CAS EST CHOISI POUR QUE LE DÉNOMINATEUR RESTE BON — ×5 en haut,
          ×3 en bas donne toujours 6 au dénominateur. Un premier essai posait
          ×3 et ×4, et il ne prouvait rien : la règle du même dénominateur
          rougissait avant celle-ci, si bien que retirer « a1===b1 » ne se
          voyait pas. Ici, tout le reste est juste ; seule cette règle tient. */
    r=juger({'sf-a1':5,'sf-b1':3,'sf-a2':2,'sf-b2':2,'sf-num1':5,'sf-num2':2,'sf-den':6,'sf-fn':7,'sf-fd':6});
    if(r.ok1) vus.push('multiplier le haut par 5 et le bas par 3 est accepté : la fraction a pourtant changé de valeur');

    /* e) deux dénominateurs DIFFÉRENTS d'une ligne à l'autre : rien n'a été mis
          au même, et l'addition qui suit n'a pas de sens */
    r=juger({'sf-a1':3,'sf-b1':3,'sf-a2':4,'sf-b2':4,'sf-num1':3,'sf-num2':4,'sf-den':6,'sf-fn':5,'sf-fd':6});
    if(r.ok1||r.ok2||r.ok3) vus.push('6 d\\'un côté et 12 de l\\'autre est accepté : les deux ne sont pas au même dénominateur');

    /* f) additionner les DÉNOMINATEURS — l'erreur classique, 1/2 + 1/3 = 2/5 */
    r=juger({'sf-a1':1,'sf-b1':1,'sf-a2':1,'sf-b2':1,'sf-num1':1,'sf-num2':1,'sf-den':5,'sf-fn':2,'sf-fd':5});
    if(r.ok1||r.ok2||r.ok3||r.ok4) vus.push('2/5 est accepté pour 1/2 + 1/3');

    /* g) une case vide n'est pas une case juste.
          Tout laisser vide ne prouvait rien : les dénominateurs ne tombaient
          alors pas d'accord, et c'est cette règle-là qui rougissait. On prend
          donc un tirage où le multiplicateur attendu vaut 1 — 1/2 + 5/6, où la
          seconde ligne n'a rien à multiplier — et on ne laisse vide QUE ce qui
          vaudrait 1 : une case vide lue comme un 1 rendrait alors l'exercice
          parfait, pendant que l'élève n'a rien écrit. */
    r=juger({'sf-a1':'','sf-b1':'','sf-a2':'','sf-b2':'','sf-num1':'','sf-num2':'','sf-den':'','sf-fn':'','sf-fd':''});
    if(r.ok1||r.ok2||r.ok3||r.ok4) vus.push('des cases vides sont comptées justes');
    test.questions[test.idx]={n1:1,d1:2,n2:5,d2:6,op:'+',D:6,k1:3,k2:1,N1:3,N2:5,N:8};
    renderSFTest();
    const q2=test.questions[test.idx];
    const juger2=function(vals){ poser(vals); return sfJuge(q2); };
    r=juger2({'sf-a1':3,'sf-b1':3,'sf-a2':'','sf-b2':'','sf-num1':3,'sf-num2':5,'sf-den':6,'sf-fn':8,'sf-fd':6});
    if(r.ok2) vus.push('la seconde ligne laissée VIDE est comptée juste, parce que son multiplicateur vaut 1');
    /* Une case vide n'est plus jugée avec son groupe — chaque étape se juge sur
       ce que l'élève a ÉCRIT. Ce qui doit rester vrai, c'est qu'elle ne soit
       jamais comptée JUSTE : on regarde donc la case, seule chose que l'élève
       voit, et non le verdict de l'étape. */
    poser({'sf-a1':3,'sf-b1':3,'sf-a2':1,'sf-b2':1,'sf-num1':3,'sf-num2':'','sf-den':6,'sf-fn':8,'sf-fd':6});
    r=sfJuge(q2);   /* AVANT le clic : la correction remplit ensuite la case vide */
    if(!r.vide) vus.push('un numérateur laissé VIDE ne se voit pas : la copie passe pour complète');
    checkSFAnswer();
    const vert=function(id){ const el=document.getElementById(id); return !!el && /\\bok\\b/.test(el.className); };
    if(vert('sf-num2')) vus.push('un numérateur laissé VIDE est compté juste à l\\'étape ②');
    /* et le tirage doit vraiment produire des multiplicateurs de 1, sans quoi
       les deux essais ci-dessus n'éprouveraient qu'une question inventée */
    let unMult=false;
    for(let i=0;i<3000 && !unMult;i++){ const c=sfGen(); if(c.k1===1||c.k2===1) unMult=true; }
    if(!unMult) vus.push('aucun multiplicateur de 1 en 3000 tirages : les deux essais sur la case vide ne portent sur rien de réel');

    /* h) un dénominateur nul ne doit pas passer par une division muette */
    r=juger({'sf-a1':3,'sf-b1':3,'sf-a2':2,'sf-b2':2,'sf-num1':3,'sf-num2':2,'sf-den':6,'sf-fn':0,'sf-fd':0});
    if(r.ok4) vus.push('0/0 est accepté comme fraction finale');

    /* i) UNE CASE JUSTE NE ROUGIT PAS PARCE QU'UNE AUTRE EST VIDE.
          C'est la copie que Turquet a signalée en août 2026 : « 8/5 + 4/9 »,
          9 et 9 écrits sous la première fraction, tout le reste vide, et la
          vérification rougissait les deux seules cases remplies — justes —
          en annonçant « 0 case juste sur 9 ». Rien ne cassait ; l'exercice
          apprenait simplement l'inverse de ce qu'il enseigne.
          LES DEUX BORDS, et n'en tenir qu'un ne tient rien : une paire seule
          qui MÈNE quelque part est juste, une paire seule qui ne mène nulle
          part reste fausse. Sans le second, « toujours vrai » passerait. */
    test.questions[test.idx]={n1:8,d1:5,n2:4,d2:9,op:'+',D:45,k1:9,k2:5,N1:72,N2:20,N:92};
    renderSFTest();
    const q3=test.questions[test.idx];
    const juger3=function(vals){ poser(vals); return sfJuge(q3); };
    const rien={'sf-a1':'','sf-b1':'','sf-a2':'','sf-b2':'','sf-num1':'','sf-num2':'','sf-den':'','sf-fn':'','sf-fd':''};
    const avec=function(o){ const c=Object.assign({},rien); Object.keys(o).forEach(function(k){ c[k]=o[k]; }); return c; };
    r=juger3(avec({'sf-a1':9,'sf-b1':9}));
    if(!r.ok1) vus.push('×9 sous 8/5, le reste encore vide : la paire est comptée FAUSSE alors qu\\'elle est juste');
    if(!r.vide) vus.push('sept cases vides et la correction ne le sait pas : le message parlera d\\'autre chose');
    r=juger3(avec({'sf-a2':5,'sf-b2':5}));
    if(!r.ok2) vus.push('×5 sous 4/9, le reste encore vide : la paire est comptée FAUSSE alors qu\\'elle est juste');
    /* le bord opposé : 5 × 2 = 10, et 9 ne divise pas 10 — cette paire seule
       ne peut mener à aucun dénominateur commun */
    r=juger3(avec({'sf-a1':2,'sf-b1':2}));
    if(r.ok1) vus.push('×2 sous 8/5 est accepté : 10 ne sera jamais un multiple de 9');
    /* et un dénominateur commun NON minimal reste juste, même seul : 5 × 18 = 90 */
    r=juger3(avec({'sf-a1':18,'sf-b1':18}));
    if(!r.ok1) vus.push('×18 sous 8/5 est refusé : 90 est pourtant un dénominateur commun');
    /* les deux paires posées et DIVERGENTES restent fausses toutes les deux —
       45 et 90 sont chacun un dénominateur commun possible, mais ensemble ils
       ne mettent rien au même dénominateur. Les déclarer justes dirait à
       l'élève que son étape ① est faite alors qu'elle ne l'est pas. Sans ce
       bord, « toujours vrai » passerait. */
    r=juger3(avec({'sf-a1':9,'sf-b1':9,'sf-a2':10,'sf-b2':10}));
    if(r.ok1||r.ok2) vus.push('45 d\\'un côté et 90 de l\\'autre est accepté');

    /* i bis) UNE PAIRE JUSTE NE ROUGIT PAS PARCE QUE L'AUTRE EST FAUSSE.
       TROISIÈME profondeur du même défaut, signalée par Turquet en août 2026
       sur une capture de « 8/5 − 1/8 » : ×1 sous la première fraction, ×5 sous
       la seconde, et les QUATRE cases rouges. Or 8 × 5 = 40 est un multiple de
       5 : la seconde paire mène quelque part et elle est juste. Seule la
       première ne mène nulle part — 5 × 1 = 5 n'est pas un multiple de 8.
       Les deux corrections précédentes n'avaient ouvert que le cas où l'autre
       paire est VIDE ; dès qu'elle était remplie ET fausse, l'ancien
       comportement revenait et la paire juste payait pour sa voisine.
       DEUX BORDS ENCORE, et n'en tenir qu'un ne tient rien : la paire qui mène
       quelque part passe au vert, ET celle qui ne mène nulle part reste rouge
       — sinon il suffirait de rendre « toujours vrai ». */
    test.questions[test.idx]={n1:8,d1:5,n2:1,d2:8,op:'−',D:40,k1:8,k2:5,N1:64,N2:5,N:59};
    renderSFTest();
    const qCap=test.questions[test.idx];
    const jugerCap=function(vals){ poser(vals); return sfJuge(qCap); };
    const rienCap={'sf-a1':'','sf-b1':'','sf-a2':'','sf-b2':'','sf-num1':'','sf-num2':'','sf-den':'','sf-fn':'','sf-fd':''};
    const avecCap=function(o){ const c=Object.assign({},rienCap); Object.keys(o).forEach(function(k){ c[k]=o[k]; }); return c; };
    r=jugerCap(avecCap({'sf-a1':1,'sf-b1':1,'sf-a2':5,'sf-b2':5}));
    if(!r.ok2) vus.push('la capture de Turquet : ×5 sous 1/8 (40, multiple de 5) est compté FAUX parce que l\\'autre paire est fausse');
    if(r.ok1) vus.push('×1 sous 8/5 est accepté : 5 ne sera jamais un multiple de 8');
    /* et le symétrique, pour qu\'un correctif qui ne regarderait qu\'un côté
       ne puisse pas passer */
    r=jugerCap(avecCap({'sf-a1':8,'sf-b1':8,'sf-a2':1,'sf-b2':1}));
    if(!r.ok1) vus.push('×8 sous 8/5 (40, multiple de 8) est compté FAUX parce que l\\'autre paire est fausse');
    if(r.ok2) vus.push('×1 sous 1/8 est accepté : 8 ne sera jamais un multiple de 5');
    /* LE MESSAGE DIT LA VÉRITÉ. Devant une copie où une paire est juste et
       l\'autre non, « il faut le même dénominateur des deux côtés » est vrai
       mais aveugle : l\'élève ne sait pas laquelle des deux reprendre, et peut
       croire qu\'il doit tout refaire alors que la moitié de son travail est
       verte à l\'écran.
       La copie est ENTIÈREMENT remplie, et il le faut : une case vide passe
       AVANT tout le reste dans le message — « il manque des cases » — et c\'est
       la bonne priorité, une case vide n\'étant pas une erreur de calcul. Le
       premier essai de ce contrôle l\'ignorait et mesurait donc autre chose. */
    r=jugerCap({'sf-a1':1,'sf-b1':1,'sf-a2':5,'sf-b2':5,
                'sf-num1':8,'sf-num2':5,'sf-den':40,'sf-fn':3,'sf-fd':40});
    if(r.vide) vus.push('la copie d\\'essai du message n\\'est pas complète : le message parlera des cases vides');
    const msg=sfPourquoi(qCap,r);
    if(!/une des deux paires/i.test(msg) || msg.indexOf('40')<0 || !/première/.test(msg))
      vus.push('le message ne dit pas laquelle des deux paires reprendre : « '+msg+' »');
    /* l'étape ② se juge sur le dénominateur ÉCRIT, et refuse de suivre une
       étape ① qui dit autre chose */
    r=juger3(avec({'sf-a1':9,'sf-b1':9,'sf-a2':5,'sf-b2':5,'sf-num1':72,'sf-num2':20,'sf-den':45}));
    if(!r.ok3) vus.push('72 + 20 sur 45 est compté faux');
    /* Une étape ① qui fait foi est une étape ① COHÉRENTE : ×18 et ×10 donnent
       tous deux 90, les deux paires sont vertes, et l'étape ② ne peut plus dire
       45. Le premier essai de ce contrôle posait ×18 et ×5 — 90 d'un côté, 45
       de l'autre : une étape ① qui dit DEUX choses différentes ne dit rien, et
       l'étape ② se juge alors seule. Il mesurait donc autre chose que ce qu'il
       annonçait. */
    r=juger3(avec({'sf-a1':18,'sf-b1':18,'sf-a2':10,'sf-b2':10,'sf-num1':72,'sf-num2':20,'sf-den':45}));
    if(r.okDen) vus.push('l\\'étape ② est acceptée sur 45 alors que l\\'étape ① annonce 90 des deux côtés');
    if(!r.ok1 || !r.ok2) vus.push('×18 et ×10 donnent tous deux 90 : l\\'étape ① est pourtant comptée fausse');
    /* et la copie ENTIÈRE, celle de la capture, reste juste d'un bout à l'autre */
    r=juger3({'sf-a1':9,'sf-b1':9,'sf-a2':5,'sf-b2':5,'sf-num1':72,'sf-num2':20,'sf-den':45,'sf-fn':92,'sf-fd':45});
    if(!(r.ok1&&r.ok2&&r.ok3&&r.ok4)) vus.push('la copie complète 9/9 · 5/5 · 72+20/45 · 92/45 est comptée fausse');
    if(r.vide) vus.push('une copie entièrement remplie est signalée comme incomplète');

    /* j) LE BOUTON, ET LA NOTE QUI EN SORT. Les essais ci-dessus appellent la
          correction ; celui-ci CLIQUE dessus, et c'est la différence qui
          comptait — ce que Turquet a vu, c'est la note « 0 case juste sur 9 »
          sous une copie dont deux cases étaient justes. Elle sort de
          ptsEcran(), donc de ce que checkSFAnswer a réellement peint, et elle
          part en base. La chaîne entière se vérifie ici : les deux cases
          remplies vertes, les sept laissées vides écrites en bleu (« sol »),
          et la note qui les compte. */
    test.questions[test.idx]={n1:8,d1:5,n2:4,d2:9,op:'+',D:45,k1:9,k2:5,N1:72,N2:20,N:92};
    renderSFTest();
    poser(rien); poser({'sf-a1':9,'sf-b1':9});
    checkSFAnswer();
    const cls=function(id){ const el=document.getElementById(id); return el?el.className:''; };
    if(!/\\bok\\b/.test(cls('sf-a1'))||!/\\bok\\b/.test(cls('sf-b1')))
      vus.push('après un clic sur « Vérifier », les deux cases justes ne sont pas vertes (' + cls('sf-a1') + ')');
    if(!/\\bsol\\b/.test(cls('sf-den')))
      vus.push('une case laissée vide n\\'est pas complétée en bleu par la correction');
    const note=ptsEcran();
    if(!note || note.cases!==9) vus.push('la note ne compte pas les neuf cases');
    else if(note.justes!==2) vus.push('la note annonce ' + note.justes + ' case(s) juste(s) sur ' + note.cases + ' alors que deux sont justes');

    /* k) UNE CASE SEULE, SA JUMELLE ENCORE VIDE. Deuxième signalement de
          Turquet, le même défaut une couche plus bas : sur « 1/5 − 1/8 » il
          écrit 8 dans la case du haut, laisse celle du bas vide, vérifie — et
          son 8, qui est le bon multiplicateur, devient ROUGE. La paire
          réclamait ses DEUX cases pour se juger.
          Un multiplicateur se met en haut comme en bas : les deux cases
          portent le même nombre, donc une seule suffit à le désigner. LES DEUX
          BORDS : la case seule JUSTE est verte, la case seule FAUSSE reste
          rouge — sans le second, « toujours vrai » passerait. */
    test.questions[test.idx]={n1:1,d1:5,n2:1,d2:8,op:'−',D:40,k1:8,k2:5,N1:8,N2:5,N:3};
    renderSFTest();
    const q4=test.questions[test.idx];
    const rien4={'sf-a1':'','sf-b1':'','sf-a2':'','sf-b2':'','sf-num1':'','sf-num2':'','sf-den':'','sf-fn':'','sf-fd':''};
    const seul=function(o){ const c=Object.assign({},rien4); Object.keys(o).forEach(function(k){ c[k]=o[k]; }); poser(c); return sfJuge(q4); };
    r=seul({'sf-a1':8});
    if(!r.ok1) vus.push('8 écrit seul dans la case du haut est compté FAUX : sa jumelle était encore vide');
    r=seul({'sf-b1':8});
    if(!r.ok1) vus.push('8 écrit seul dans la case du BAS est compté faux');
    r=seul({'sf-a1':3});
    if(r.ok1) vus.push('3 écrit seul est accepté : 15 ne sera jamais un multiple de 8');
    r=seul({'sf-a1':8,'sf-b1':3});
    if(r.ok1) vus.push('8 en haut et 3 en bas est accepté : la fraction a changé de valeur');
    /* L'ÉTAPE ② ET LA FRACTION FINALE SE JUGENT CASE PAR CASE. Elles étaient
       peintes d'un seul verdict : un numérateur faux rougissait le second et le
       dénominateur, tous deux justes. Les essais visent donc la CASE — « ok3 »
       et « ok4 » restent l'étape entière, et ne servent plus qu'à la note. */
    r=seul({'sf-den':40});
    if(!r.okDen) vus.push('40 écrit seul au dénominateur commun est compté faux');
    r=seul({'sf-den':42});
    if(r.okDen) vus.push('42 est accepté comme dénominateur commun de 5 et 8');
    r=seul({'sf-fn':3});
    if(!r.okFn) vus.push('3 écrit seul au numérateur de la fraction finale est compté faux');
    r=seul({'sf-fn':4});
    if(r.okFn) vus.push('4 est accepté au numérateur de la fraction finale (le résultat est 3/40)');
    /* LE BORD QUI COMPTE, celui pour lequel tout ceci existe : une case JUSTE
       ne rougit pas parce que sa voisine est FAUSSE. 8 et 40 sont justes, 9 ne
       l'est pas — et seules les cases fausses doivent être rouges. */
    r=seul({'sf-num1':8,'sf-num2':9,'sf-den':40});
    if(!r.okN1) vus.push('le premier numérateur JUSTE rougit parce que le second est faux');
    if(!r.okDen) vus.push('le dénominateur commun JUSTE rougit parce qu\\'un numérateur est faux');
    if(r.okN2) vus.push('9 est accepté au second numérateur (1 × 5 = 5)');
    /* et le symétrique, pour qu\'un correctif ne regardant qu\'un côté ne passe pas */
    r=seul({'sf-num1':9,'sf-num2':5,'sf-den':40});
    if(!r.okN2) vus.push('le second numérateur JUSTE rougit parce que le premier est faux');
    if(r.okN1) vus.push('9 est accepté au premier numérateur (8 × 8 = 64… ici 8 × 1 = 8)');
    /* la fraction finale de même : 3/40 est le résultat, 3 juste et 41 faux */
    r=seul({'sf-fn':3,'sf-fd':41});
    if(r.okFd) vus.push('41 est accepté au dénominateur de la fraction finale');
    /* ET LE SECOND BORD, celui des paires de l'étape ① transposé ici : deux
       moitiés chacune défendable qui NE SE REJOIGNENT PAS restent fausses
       toutes les deux. 6 est un multiple de 3 et 80 un multiple de 40, mais
       6/80 ne vaut pas 3/40 — les déclarer justes dirait à l'élève que son
       résultat est bon. Sans ce bord, « chacune sur sa promesse » suffirait, et
       un sabotage l'a montré en passant au vert. */
    r=seul({'sf-fn':6,'sf-fd':40});
    if(r.okFn||r.okFd) vus.push('6/40 est accepté comme fraction finale : elle ne vaut pas 3/40');
    /* alors que la MÊME fraction, écrite en plus grand, reste juste — et le
       premier essai de ce contrôle s'était trompé LÀ : il exigeait le refus de
       6/80, qui vaut exactement 3/40. C'est le contrôle qui avait tort, pas la
       page ; un essai faux se reconnaît à ce qu'il rougit sur du code juste. */
    r=seul({'sf-fn':9,'sf-fd':120});
    if(!r.okFn || !r.okFd) vus.push('9/120 est refusé alors qu\\'il vaut 3/40');
    /* et une copie à moitié remplie ne vaut PAS le point entier, même si tout
       ce qui y est écrit est juste : c'est le trou qu'ouvre le jugement case
       par case, et « r.vide » est ce qui le ferme */
    r=seul({'sf-a1':8,'sf-a2':5,'sf-num1':8,'sf-den':40,'sf-fn':3});
    if(!(r.ok1&&r.ok2&&r.okN1&&r.okDen&&r.okFn)) vus.push('une demi-copie pourtant juste est comptée fausse');
    if(!r.vide) vus.push('une demi-copie passe pour complète — elle vaudrait le point entier');
    /* l'étape ② sans dénominateur écrit : c'est l'étape ① qui le dit. Sans ce
       report, un numérateur juste rougirait parce que la case du dénominateur
       commun est encore vide — le défaut signalé, une case plus loin. */
    r=seul({'sf-a1':8,'sf-b1':8,'sf-num1':8});
    if(!r.okN1) vus.push('8 au premier numérateur est compté faux alors que l\\'étape ① annonce déjà 40');
    r=seul({'sf-a1':8,'sf-b1':8,'sf-num1':5});
    if(r.okN1) vus.push('5 au premier numérateur est accepté sur le dénominateur 40 (1 × 8 = 8)');

    /* UNE DEMI-COPIE NE VAUT PAS LE POINT ENTIER. Chaque étape se jugeant
       désormais sur les cases écrites, les quatre verdicts peuvent passer au
       vert sur une copie à moitié remplie : sans « r.vide » dans allOk, elle
       vaudrait 1/1 ET ses cases vides ne recevraient même pas la correction en
       bleu, l'application les tenant pour terminées. */
    poser(rien4); poser({'sf-a1':8,'sf-a2':5,'sf-num1':8,'sf-den':40,'sf-fn':3});
    checkSFAnswer();
    const der=test.answers[test.answers.length-1];
    if(der && der.correct) vus.push('une copie à moitié remplie vaut le point entier');
    if(!/\\bsol\\b/.test(document.getElementById('sf-fd').className))
      vus.push('sur une demi-copie déclarée juste, les cases vides ne reçoivent pas la correction en bleu');

    /* le geste EXACT du signalement : le 8 seul, puis « Vérifier ».
       On REDESSINE d'abord : la vérification précédente a laissé ses couleurs
       et verrouillé l'écran, et vider les cases ne les efface pas. */
    renderSFTest();
    poser(rien4); poser({'sf-a1':8});
    checkSFAnswer();
    if(!/\\bok\\b/.test(document.getElementById('sf-a1').className))
      vus.push('après le clic, le 8 écrit seul n\\'est pas vert (' + document.getElementById('sf-a1').className + ')');
    if(!/\\bsol\\b/.test(document.getElementById('sf-b1').className))
      vus.push('la jumelle laissée vide n\\'est pas complétée en bleu');
    const note4=ptsEcran();
    if(!note4 || note4.cases!==9 || note4.justes!==1)
      vus.push('la note annonce ' + (note4?note4.justes+' sur '+note4.cases:'rien') + ' alors qu\\'une seule case est juste sur neuf');

    /* k) CE QUI EST PEINT, et non ce qui est jugé. Les essais ci-dessus lisent
          le VERDICT rendu par sfJuge ; l'élève, lui, voit la COULEUR posée par
          checkSFAnswer — et c'est là que vivait le défaut : trois cases
          peintes d'un seul verdict, donc rouges ensemble. Quatre sabotages ont
          traversé les essais précédents en ne touchant qu'aux appels à
          « mark », sans rien changer aux verdicts. Un contrôle qui ne regarde
          pas ce que l'élève regarde parle d'autre chose. */
    renderSFTest();
    poser(rien4);
    poser({'sf-a1':8,'sf-b1':8,'sf-a2':5,'sf-b2':5,'sf-num1':8,'sf-num2':9,'sf-den':40,'sf-fn':3,'sf-fd':44});
    checkSFAnswer();
    const cl4=function(id){ const el=document.getElementById(id); return el?el.className:'(absent)'; };
    const peint=function(id){ const c=cl4(id);
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
    /* 8 et 40 sont justes, 9 ne l'est pas : seule la fausse doit être rouge. */
    if(peint('sf-num1')!=='vert') vus.push('le premier numérateur JUSTE est peint en '+peint('sf-num1')+' alors que seul le second est faux');
    if(peint('sf-den')!=='vert') vus.push('le dénominateur commun JUSTE est peint en '+peint('sf-den')+' alors que seul un numérateur est faux');
    if(peint('sf-num2')!=='rouge') vus.push('le second numérateur, FAUX, est peint en '+peint('sf-num2'));
    /* la fraction finale de même : 3 est juste, 44 ne mène nulle part. */
    if(peint('sf-fn')!=='vert') vus.push('le numérateur final JUSTE est peint en '+peint('sf-fn')+' alors que seul le dénominateur est faux');
    if(peint('sf-fd')!=='rouge') vus.push('le dénominateur final, FAUX, est peint en '+peint('sf-fd'));

    return vus.join(' | ');
  })()`, v => v === '', undefined);
}

/* ---------- 4 quater bis. Une somme de fractions À SIMPLIFIER --------------
   Le troisième exercice du moteur « sf ». Il ne change que deux choses au
   tirage — des dénominateurs qui PARTAGENT un diviseur, et une somme qui se
   simplifie — et ajoute deux étapes : diviser en haut et en bas par le même
   nombre, puis écrire la fraction réduite.

   TOUT LE RISQUE EST DANS LE TIRAGE ET DANS LA PROMESSE.

   · SI LA SOMME NE SE SIMPLIFIE PAS, l'exercice n'a plus de sujet : sa
     dernière étape demande de diviser par un nombre qui n'existe pas. Deux
     dénominateurs qui partagent un diviseur NE SUFFISENT PAS — 1/6 + 1/4 ont
     bien 2 en commun et donnent 5/12, irréductible. Les deux conditions sont
     indépendantes, et n'en tenir qu'une ne tient rien.
   · LE DÉNOMINATEUR COMMUN RESTE LIBRE, comme dans {somme-fractions}. Qui
     prend 12 au lieu de 6 divise ensuite par 4 au lieu de 2 et retombe au même
     endroit. Compter faux cette route punirait une méthode juste.
   · LE DIVISEUR N'EST PAS RANGÉ À CÔTÉ DE LA QUESTION : il dépend de la route,
     donc il est calculé sur ce que l'élève a écrit. Seul le résultat réduit ne
     bouge pas.
   · DIVISER PAR TROP PEU N'EST PAS FINI, et doit rougir : sans quoi l'exercice
     accepterait 32/6 comme « simplifié ».

   On EXERCE la vraie correction, en posant des valeurs dans les vraies cases. */
/* {simplifier-barres} — la fraction dite deux fois : coloriée, puis divisée.
   « colonnes » est l'identifiant d'origine et il ne se renomme PAS : c'est la
   clé sous laquelle les notes des élèves sont enregistrées. Le dessin, lui, est
   passé de deux colonnes à deux barres couchées le jour même — le partage va
   jusqu'à 40, et seule la largeur en donne la place.
   Le contrôle EXERCE la vraie correction en posant des valeurs dans les vraies
   cases, jamais une réimplémentation — qui se serait trompée du même côté.
   Il tient quatre bords, et n'en tenir qu'un ne tient rien :
     · le tirage — le PGCD est bien k, la fraction d'arrivée est irréductible,
       et le partage reste cliquable (b borné) ;
     · la correction — une copie juste vaut 5, un diviseur qui ne va pas
       jusqu'au bout est refusé ;
     · une réponse laissée VIDE ne rougit pas, barres COMPRISES — le contrôle
       universel du banc navigateur ne regarde que les champs et les listes, il
       ne verrait jamais une barre rouge ;
     · la note compte CINQ réponses — les deux coloriages en font partie, et
       sans « pts-case » l'écran annonçait « 3 justes sur 3 » sur une question
       qui en vaut 5. */
/* {multiplier-fractions} et {multiplier-fractions-libre} — le miroir de la
   somme, SANS mise au même dénominateur.
   Quatre bords, et n'en tenir qu'un ne tient rien :
     · le tirage — le PRODUIT doit être irréductible, et ce n'est PAS impliqué
       par « chaque fraction irréductible » : 2/3 × 3/2 donne 6/6 ;
     · l'ordre des deux facteurs est LIBRE — rien à l'écran ne dit quelle case
       appartient à quelle fraction, et la multiplication est commutative ;
     · une case juste ne rougit pas pour sa voisine, et on lit la COULEUR
       peinte, pas seulement le verdict — c'est la leçon du jour ;
     · l'erreur VISÉE (mettre au même dénominateur) est nommée par le message. */
function multiplierFractions(w, P){
  const present = evaluer(w, "typeof startMlt==='function' && typeof mltGen==='function'");
  if(!present.ok || !present.valeur){
    ignorer('multiplier deux fractions : l\'ordre est libre, et le produit ne se simplifie pas',
      'ce niveau n\'a pas les exercices de multiplication de fractions');
    return;
  }
  verifierEval(w, 'multiplier deux fractions : l\'ordre est libre, et le produit ne se simplifie pas', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='multiplier-fractions';
    const pgcd=function(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t; } return a||1; };

    /* ---- 1. le tirage ---------------------------------------------------- */
    let vuNonTrivial=false;
    for(let i=0;i<2000;i++){
      const q=mltGen(), eti='tirage '+q.n1+'/'+q.d1+' × '+q.n2+'/'+q.d2;
      if(q.P!==q.n1*q.n2 || q.Q!==q.d1*q.d2){ vus.push(eti+' : le produit rangé ne suit pas les facteurs'); break; }
      /* LE BORD QUI COMPTE. « Chaque fraction irréductible » NE SUFFIT PAS :
         2/3 × 3/2 a ses deux fractions irréductibles et donne 6/6. C'est bien
         le PRODUIT qu'il faut tester — sinon l'élève qui simplifie, ce qui est
         juste, écrirait une fraction comptée fausse. */
      if(pgcd(q.P,q.Q)!==1){ vus.push(eti+' : le produit '+q.P+'/'+q.Q+' se simplifie encore'); break; }
      if(q.P===q.Q){ vus.push(eti+' : le produit vaut 1 tout rond'); break; }
      if(q.d1<2 || q.d2<2){ vus.push(eti+' : un dénominateur vaut '+Math.min(q.d1,q.d2)); break; }
      if(q.n1<1 || q.n2<1){ vus.push(eti+' : un numérateur est nul ou négatif'); break; }
      if(q.n1===1 && q.n2===1){ vus.push(eti+' : les deux numérateurs valent 1, il n\\'y a rien à multiplier en haut'); break; }
      if(q.n1!==1 && q.n2!==1) vuNonTrivial=true;
    }
    if(!vus.length && !vuNonTrivial) vus.push('le tirage ne produit jamais deux numérateurs différents de 1');

    /* ---- 2. la correction, exercée pour de vrai -------------------------- */
    startMlt();
    /* 3/7 × 4/9 = 12/63… non : 12 et 63 partagent 3. On prend 5/7 × 4/9 = 20/63,
       irréductible, et dont aucun facteur n'est égal à un autre. */
    test.questions[test.idx]={n1:5,d1:7,n2:4,d2:9,a1:5,a2:4,b1:7,b2:9,P:20,Q:63};
    const CASES=['mlt-h1','mlt-h2','mlt-b1','mlt-b2','mlt-fn','mlt-fd'];
    const q=test.questions[test.idx];
    const juger=function(o){
      test.locked=false; renderMltTest();
      CASES.forEach(function(id){ const el=document.getElementById(id);
        if(el) el.value=(o[id]===undefined)?'':String(o[id]); });
      return mltJuge(q);
    };
    const JUSTE={'mlt-h1':5,'mlt-h2':4,'mlt-b1':7,'mlt-b2':9,'mlt-fn':20,'mlt-fd':63};
    const avec=function(o){ const c=Object.assign({},JUSTE); Object.keys(o).forEach(function(k){
      if(o[k]===null) delete c[k]; else c[k]=o[k]; }); return c; };
    const tout=function(r){ return r.haut&&r.bas&&r.fin&&!r.vide; };

    let r=juger(JUSTE);
    if(!tout(r)) vus.push('la copie juste est comptée fausse : '+JSON.stringify(r));
    /* L'ORDRE EST LIBRE : rien à l'écran ne dit quelle case va avec quelle
       fraction, et 4 × 5 vaut 5 × 4. */
    r=juger(avec({'mlt-h1':4,'mlt-h2':5,'mlt-b1':9,'mlt-b2':7}));
    if(!tout(r)) vus.push('les facteurs écrits dans l\\'autre ordre sont comptés faux');
    /* mais les deux cases doivent former la PAIRE : deux fois le même nombre
       est chacune défendable et fausse ensemble */
    r=juger(avec({'mlt-h2':5}));
    if(r.okH1||r.okH2) vus.push('5 et 5 sont acceptés en haut alors qu\\'on attend 5 et 4');
    /* une case juste ne rougit pas pour sa voisine */
    r=juger(avec({'mlt-h2':6}));
    if(!r.okH1) vus.push('le numérateur JUSTE rougit parce que l\\'autre est faux');
    if(r.okH2) vus.push('6 est accepté au numérateur (on attend 5 et 4)');
    if(!r.okB1 || !r.okB2) vus.push('les dénominateurs JUSTES rougissent parce qu\\'un numérateur est faux');
    if(!r.okFn || !r.okFd) vus.push('le résultat JUSTE rougit parce qu\\'un numérateur est faux');
    /* L'ERREUR VISÉE : mettre au même dénominateur. 63 est le produit, mais le
       PPCM de 7 et 9 vaut aussi 63 — on prend donc un cas où ils diffèrent. */
    test.questions[test.idx]={n1:5,d1:4,n2:5,d2:8,a1:5,a2:5,b1:4,b2:8,P:25,Q:32};
    const q2=test.questions[test.idx];
    test.locked=false; renderMltTest();
    CASES.forEach(function(id){ const el=document.getElementById(id); if(el) el.value=''; });
    ({'mlt-h1':5,'mlt-h2':5,'mlt-b1':8,'mlt-b2':8,'mlt-fn':25,'mlt-fd':32}) &&
      Object.keys({'mlt-h1':5,'mlt-h2':5,'mlt-b1':8,'mlt-b2':8,'mlt-fn':25,'mlt-fd':32}).forEach(function(id){
        const v={'mlt-h1':5,'mlt-h2':5,'mlt-b1':8,'mlt-b2':8,'mlt-fn':25,'mlt-fd':32}[id];
        const el=document.getElementById(id); if(el) el.value=String(v); });
    const r2=mltJuge(q2);
    if(r2.bas) vus.push('mettre les deux dénominateurs au même (8 et 8) est accepté');
    if(!r2.haut) vus.push('les numérateurs JUSTES rougissent parce que l\\'élève a mis au même dénominateur');
    if(!r2.fin) vus.push('le résultat JUSTE rougit parce que l\\'élève a mis au même dénominateur');
    const msg=mltPourquoi(q2,r2);
    if(!/pas besoin du m/i.test(msg) || msg.indexOf('4')<0 || msg.indexOf('8')<0)
      vus.push('le message ne nomme pas l\\'erreur visée : « '+msg+' »');

    /* ---- 3. RIEN N'EST ÉCRIT : rien ne rougit, et la COULEUR le dit ------ */
    test.questions[test.idx]={n1:5,d1:7,n2:4,d2:9,a1:5,a2:4,b1:7,b2:9,P:20,Q:63};
    test.locked=false; renderMltTest();
    checkMltAnswer();
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
    const rouges=CASES.filter(function(id){ return peint(id)==='rouge'; });
    if(rouges.length) vus.push('une copie entièrement vide rougit : '+rouges.join(', '));
    const bleus=CASES.filter(function(id){ return peint(id)==='bleu'; });
    if(bleus.length!==6) vus.push('les cases vides ne reçoivent pas toutes la correction en bleu ('+bleus.length+'/6)');
    const der=test.answers[test.answers.length-1];
    if(der && der.correct) vus.push('une copie entièrement vide vaut le point');
    if(!der || der.cases!==6) vus.push('la note compte '+(der?der.cases:'?')+' cases au lieu de 6');
    /* ET LE MÊME BORD EN SOUTIEN, où il est le seul à être ATTEIGNABLE : en
       entraînement, la correction en bleu repasse derrière et efface le rouge
       d'une case vide, si bien qu'une case vide qui rougirait ne se verrait
       pas. Un sabotage l'a montré en restant vert — non parce que le contrôle
       était trop faible, mais parce qu'il regardait le seul mode où le défaut
       ne peut pas se voir. En soutien, rien n'efface : c'est là qu'on mesure. */
    currentMode='soutien';
    test.locked=false; renderMltTest();
    checkMltAnswer();
    const rougesS=CASES.filter(function(id){ return peint(id)==='rouge'; });
    if(rougesS.length) vus.push('en soutien, une copie entièrement vide rougit : '+rougesS.join(', '));
    currentMode='train';

    /* ---- 4. CE QUI EST PEINT, une case juste à côté d'une fausse --------- */
    test.locked=false; renderMltTest();
    CASES.forEach(function(id){ const el=document.getElementById(id); if(el) el.value=''; });
    [['mlt-h1',5],['mlt-h2',6],['mlt-b1',7],['mlt-b2',9],['mlt-fn',20],['mlt-fd',63]].forEach(function(pr){
      const el=document.getElementById(pr[0]); if(el) el.value=String(pr[1]); });
    checkMltAnswer();
    if(peint('mlt-h1')!=='vert') vus.push('après le clic, le numérateur JUSTE est peint en '+peint('mlt-h1'));
    if(peint('mlt-h2')!=='rouge') vus.push('après le clic, le numérateur FAUX est peint en '+peint('mlt-h2'));
    if(peint('mlt-b1')!=='vert' || peint('mlt-fn')!=='vert')
      vus.push('après le clic, des cases justes d\\'autres étapes rougissent');

    /* ---- 5. DIVISER, C'EST MULTIPLIER PAR L'INVERSE --------------------- */
    if(typeof divGen!=='function' || typeof startDiv!=='function'){
      vus.push('les exercices de division sont absents');
    } else {
      /* le tirage : ce sont les facteurs INVERSÉS qui doivent être rangés, et
         c'est le quotient qui doit être irréductible — ni « chaque fraction
         irréductible » ni la condition du produit direct ne l'impliquent. */
      for(let i=0;i<2000;i++){
        const g=divGen(), eti='tirage '+g.n1+'/'+g.d1+' ÷ '+g.n2+'/'+g.d2;
        if(g.a1!==g.n1 || g.a2!==g.d2 || g.b1!==g.d1 || g.b2!==g.n2){
          vus.push(eti+' : les facteurs rangés ne sont pas ceux de la fraction INVERSÉE'); break; }
        if(g.P!==g.n1*g.d2 || g.Q!==g.d1*g.n2){ vus.push(eti+' : le quotient rangé ne suit pas les facteurs'); break; }
        if(pgcd(g.P,g.Q)!==1){ vus.push(eti+' : le quotient '+g.P+'/'+g.Q+' se simplifie encore'); break; }
        if(g.n2===0){ vus.push(eti+' : on divise par zéro'); break; }
        if(g.n2===g.d2){ vus.push(eti+' : on divise par 1, il n\\'y a rien à faire'); break; }
        if(g.P===g.Q){ vus.push(eti+' : le quotient vaut 1 tout rond'); break; }
      }
      /* la correction : l'inverse se juge case par case, et le MESSAGE nomme
         l'erreur visée — multiplier sans retourner la seconde fraction. */
      startDiv();
      test.questions[test.idx]={n1:3,d1:5,n2:2,d2:7,a1:3,a2:7,b1:5,b2:2,P:21,Q:10};
      const qd=test.questions[test.idx];
      const jugerD=function(o){
        test.locked=false; renderMltTest();
        mltCases().forEach(function(id){ const el=document.getElementById(id);
          if(el) el.value=(o[id]===undefined)?'':String(o[id]); });
        return mltJuge(qd);
      };
      const JUSTED={'mlt-i1':7,'mlt-i2':2,'mlt-h1':3,'mlt-h2':7,'mlt-b1':5,'mlt-b2':2,'mlt-fn':21,'mlt-fd':10};
      const avecD=function(o){ const c=Object.assign({},JUSTED); Object.keys(o).forEach(function(k){ c[k]=o[k]; }); return c; };
      let rd=jugerD(JUSTED);
      if(!(rd.inverse&&rd.haut&&rd.bas&&rd.fin) || rd.vide) vus.push('la copie juste de la division est comptée fausse : '+JSON.stringify(rd));
      if(mltCases().length!==8) vus.push('la division ne compte pas ses huit cases ('+mltCases().length+')');
      /* L'ERREUR VISÉE : l'élève n'a pas retourné la seconde fraction. */
      rd=jugerD(avecD({'mlt-i1':2,'mlt-i2':7,'mlt-h2':2,'mlt-b2':7,'mlt-fn':6,'mlt-fd':35}));
      if(rd.inverse) vus.push('recopier 2/7 au lieu de 7/2 est accepté comme inverse');
      if(!rd.okH1 || !rd.okB1) vus.push('la première fraction, JUSTE, rougit parce que l\\'inverse est faux');
      const msgD=mltPourquoi(qd,rd);
      if(!/RETOURNER/.test(msgD) || msgD.indexOf('7')<0) vus.push('le message ne nomme pas l\\'erreur visée : « '+msgD+' »');
      /* UN INVERSE FAUX EMPÊCHE LA COPIE D'ÊTRE JUSTE, et ce bord ne se voit
         que par le BOUTON : les produits se jugent sur les facteurs inversés,
         indépendamment de ce que l'élève a écrit dans les cases de l'inverse.
         Une copie peut donc avoir ses six dernières cases justes et son inverse
         faux — sans ce bord, elle vaudrait le point entier avec une case rouge
         à l'écran. Un sabotage est passé au vert ici : le contrôle lisait le
         verdict de sfJuge, jamais la NOTE que le bouton enregistre. */
      test.locked=false; renderMltTest();
      mltCases().forEach(function(id){ const el=document.getElementById(id); if(el) el.value=''; });
      Object.keys(avecD({'mlt-i1':2,'mlt-i2':7})).forEach(function(id){
        const el=document.getElementById(id); if(el) el.value=String(avecD({'mlt-i1':2,'mlt-i2':7})[id]); });
      checkMltAnswer();
      const derD=test.answers[test.answers.length-1];
      if(derD && derD.correct) vus.push('une copie dont l\\'inverse est faux vaut le point entier');
      const clD=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
        return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
      if(clD('mlt-i1')!=='rouge') vus.push('après le clic, l\\'inverse FAUX est peint en '+clD('mlt-i1'));
      if(clD('mlt-h1')!=='vert') vus.push('après le clic, un facteur JUSTE rougit parce que l\\'inverse est faux');

      /* et une case de l'inverse juste ne rougit pas parce que l'autre est fausse */
      rd=jugerD(avecD({'mlt-i2':9}));
      if(!rd.okI1) vus.push('le numérateur JUSTE de l\\'inverse rougit parce que l\\'autre case est fausse');
      if(rd.okI2) vus.push('9 est accepté au dénominateur de l\\'inverse');
      /* la règle envoyée au modèle exige l'étape de l'inverse, et n'exige PAS
         la ligne des produits : « 3/5 × 7/2 = 21/10 » est une rédaction juste. */
      if(typeof startDLL==='function'){
        startDLL();
        test.questions[test.idx]=qd;
        const aD=mllAttenduIA(qd), eD=mllEnonceIA(qd);
        if(eD.indexOf('÷')<0) vus.push('l\\'énoncé envoyé au modèle ne dit pas que c\\'est une division');
        if(aD.indexOf('3/5 × 7/2')<0) vus.push('la règle n\\'écrit pas la multiplication par l\\'inverse');
        if(!/N’EST PAS exigé|N'EST PAS exigé/.test(aD))
          vus.push('la règle exige la ligne des produits : une rédaction juste serait refusée');
        if(aD.indexOf('division')<0) vus.push('la règle ne dit pas qu\\'il s\\'agit d\\'une division');
      }
      startMlt();
      test.questions[test.idx]={n1:5,d1:7,n2:4,d2:9,a1:5,a2:4,b1:7,b2:9,P:20,Q:63};
    }

    /* ---- 6. LE LIBRE : les mêmes nombres, et la règle envoyée au modèle --- */
    if(typeof startMLL!=='function' || typeof mllAttenduIA!=='function'){
      vus.push('l\\'exercice en saisie libre est absent');
    } else {
      for(let i=0;i<200;i++){
        const g=mltGen(), a=mllAttenduIA(g), e=mllEnonceIA(g);
        if(a.indexOf(g.P+'/'+g.Q)<0){ vus.push('la règle ne nomme pas le résultat '+g.P+'/'+g.Q); break; }
        if(a.indexOf('('+g.n1+'×'+g.n2+')/('+g.d1+'×'+g.d2+')')<0){ vus.push('la règle n\\'écrit pas l\\'étape du produit'); break; }
        if(e.indexOf(g.n1+'/'+g.d1)<0 || e.indexOf(g.n2+'/'+g.d2)<0){ vus.push('l\\'énoncé envoyé au modèle ne porte pas les deux fractions'); break; }
        /* CHAQUE EXIGENCE DANS SON POINT — chercher les mots dans tout le
           texte ne prouverait rien, ils y reviennent partout. DEPUIS AOÛT 2026
           (décision de Turquet), l'étape du produit N'EST PLUS EXIGÉE : la
           règle n'a que DEUX points — le résultat, les égalités — et doit
           AUTORISER en toutes lettres la rédaction directe. Les deux bords se
           tiennent : un point 3 revenu, ou l'autorisation disparue, rougissent
           l'un comme l'autre. */
        const iR=a.indexOf('RÈGLE DE DÉCISION'), iC=a.indexOf('CONSIGNES POUR LE FEEDBACK');
        if(iR<0 || iC<0 || iC<iR){ vus.push('la règle de décision et les consignes de feedback ne se distinguent plus'); break; }
        const regle=a.slice(iR,iC);
        const pt=function(n){ const d=regle.indexOf('\\n'+n+'. '); if(d<0) return '';
          const f=regle.indexOf('\\n'+(n+1)+'. ', d); return regle.slice(d, f<0?regle.length:f); };
        const p1=pt(1), p2=pt(2), p3=pt(3);
        if(!p1||!p2){ vus.push('la règle de décision n\\'a plus ses deux points numérotés'); break; }
        if(p3){ vus.push('la règle du produit a retrouvé un troisième point : une étape serait exigée de nouveau'); break; }
        if(p1.indexOf('RÉSULTAT FINAL')<0 || p1.indexOf(g.P+'/'+g.Q)<0){
          vus.push('le point 1 ne dit plus quel résultat attendre'); break; }
        if(!/ÉGALITÉ FAUSSE/.test(p2)){ vus.push('le point 2 n\\'interdit plus les égalités fausses'); break; }
        if(/REFUS/.test(regle)){ vus.push('la règle du produit REFUSE quelque chose : une rédaction directe serait recalée'); break; }
        if(a.indexOf('AUCUNE ÉTAPE N’EST EXIGÉE')<0 || a.indexOf('ne la refuse JAMAIS')<0
           || a.indexOf(g.n1+'/'+g.d1+' × '+g.n2+'/'+g.d2+' = '+g.P+'/'+g.Q)<0){
          vus.push('la règle n\\'autorise plus la rédaction directe « '+g.n1+'/'+g.d1+' × '+g.n2+'/'+g.d2+' = '+g.P+'/'+g.Q+' »'); break; }
        /* et la règle ne doit RIEN réclamer à simplifier : le produit est
           irréductible par construction, exiger une simplification enverrait
           l'élève chercher ce qui n'existe pas. */
        if(/simplifi/i.test(p1)){ vus.push('le point 1 parle de simplification alors que le produit est irréductible'); break; }
      }
    }
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* {pourcentage-synthese} (Première 2.1.6) — la synthèse de {pourcentage},
   {pourcentage-depart} et {pourcentage-taux} sur le moteur pctq. Ses bords :
     · le tirage mêle les TROIS types, chacun au moins une fois, et l'ordre
       change d'un tirage à l'autre — sinon l'élève apprend le rang, pas la
       méthode ; la bonne réponse est calculée des nombres mêmes de l'énoncé,
       jamais rangée à part, et les propositions sont quatre entiers distincts,
       mélangés (à type égal, le rang de la bonne varie) ;
     · TOUTES les cases sont vides, y compris le nombre de départ (demande de
       Turquet, août 2026) — ailleurs (2.1.4, 2.1.5) la page l'écrit encore ;
     · la case du nombre se JUGE : juste elle verdit, fausse elle rougit seule,
       et la note la compte ;
     · une case vide ne rougit jamais, et une case seule dans sa fraction se
       juge sur sa PROMESSE, pas sur sa jumelle vide — mesuré en SOUTIEN, le
       seul mode où le bord est atteignable ;
     · l'aide du type « résultat » ne révèle JAMAIS le résultat — elle rappelle
       la proposition choisie ; et le message « calcul juste, proposition
       fausse » ne dit pas « 12, et non 12 ». */
function synthesePourcentage(w, P){
  const present = evaluer(w, "typeof startPctSynthese==='function' && typeof genPctRes==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la synthèse des pourcentages mêle les trois types, et toutes ses cases sont vides',
      'ce niveau n\'a pas la synthèse « prendre un pourcentage »');
    return;
  }
  verifierEval(w, 'la synthèse des pourcentages mêle les trois types, et toutes ses cases sont vides', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='pourcentage-synthese';

    /* ---- 1. le tirage : les trois types, mélangés, la bonne réponse calculée */
    const ordres={}, rangs={res:{},val:{},pct:{}};
    for(let t=0;t<60 && !vus.length;t++){
      startPctSynthese();
      const qs=test.questions;
      if(!qs || qs.length<3){ vus.push('tirage : '+(qs?qs.length:0)+' questions'); break; }
      const types=qs.map(function(q){ return q.type; });
      ['res','val','pct'].forEach(function(ty){
        if(types.indexOf(ty)<0) vus.push('tirage '+t+' : aucun type « '+ty+' » sur '+qs.length+' questions');
      });
      ordres[types.join(',')]=1;
      qs.forEach(function(q,i){
        const eti='tirage '+t+' q'+i+' ('+q.type+')';
        if(q.prod!==q.P*q.N || q.result*100!==q.prod){ vus.push(eti+' : l\\'énoncé contredit sa correction'); return; }
        if(!q.opts || q.opts.length!==4){ vus.push(eti+' : '+(q.opts?q.opts.length:0)+' propositions'); return; }
        if(new Set(q.opts).size!==4) vus.push(eti+' : deux propositions identiques ('+q.opts.join(', ')+')');
        if(q.opts.some(function(v){ return !Number.isInteger(v) || v<1; }))
          vus.push(eti+' : une proposition n\\'est pas un entier positif ('+q.opts.join(', ')+')');
        const attendu=(q.type==='res')?q.result:(q.type==='pct'?q.P:q.N);
        if(q.opts[q.bon]!==attendu) vus.push(eti+' : « bon » désigne '+q.opts[q.bon]+' au lieu de '+attendu);
        rangs[q.type][q.bon]=1;
      });
    }
    if(!vus.length && Object.keys(ordres).length<2)
      vus.push('l\\'ordre des types ne change jamais d\\'un tirage à l\\'autre');
    ['res','val','pct'].forEach(function(ty){
      if(!vus.length && Object.keys(rangs[ty]).length<3)
        vus.push('à type égal ('+ty+'), la bonne réponse ne change pas assez de rang : '+Object.keys(rangs[ty]).join(','));
    });

    /* ---- 2. toutes les cases sont VIDES, y compris le nombre de départ ---- */
    const RES={type:'res',P:30,N:40,unit:'€',prod:1200,result:12,opts:[11,12,13,14],bon:1,choisi:null,ci:0,v:0};
    const fixe=function(q,choix){ test.idx=0; test.locked=false;
      test.questions[0]=JSON.parse(JSON.stringify(q)); test.questions[0].choisi=choix;
      renderQTest(); return test.questions[0]; };
    const CASES=['q1n','q1d','qN','q2n','q2d','q3'];
    const el=function(id){ return document.getElementById(id); };
    startPctSynthese(); fixe(RES,1);
    CASES.forEach(function(id){
      const e=el(id);
      if(!e) vus.push('la case '+id+' manque à l\\'écran de la synthèse');
      else if(String(e.value||'').trim()!=='') vus.push('la case '+id+' n\\'est pas vide au départ');
      else if(e.tagName!=='MATH-FIELD') vus.push(id+' n\\'est pas une case de saisie ('+e.tagName+')');
    });
    /* le bord opposé : en 2.1.4, le nombre reste ÉCRIT par la page */
    startPctDepart(); test.questions[0].choisi=0; test.idx=0; test.locked=false; renderQTest();
    if(el('qN')) vus.push('2.1.4 a maintenant une case qN : le nombre doit y rester écrit par la page');

    /* ---- 3. la case du nombre se juge, et la note la compte -------------- */
    const remplir=function(o){ CASES.forEach(function(id){ const e=el(id);
      if(e) e.value=(o[id]===undefined)?'':String(o[id]); }); };
    const peint=function(id){ const c=el(id)?el(id).className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
    const JUSTE={q1n:30,q1d:100,qN:40,q2n:1200,q2d:100,q3:12};
    startPctSynthese(); fixe(RES,1); remplir(JUSTE); test.answers=[]; checkQAnswer();
    CASES.forEach(function(id){ if(peint(id)!=='vert') vus.push('copie juste : '+id+' est peinte « '+peint(id)+' »'); });
    let der=test.answers[test.answers.length-1];
    if(!der || !der.correct) vus.push('la copie juste ne vaut pas le point');
    fixe(RES,1); remplir(Object.assign({},JUSTE,{qN:50})); test.answers=[]; checkQAnswer();
    if(peint('qN')!=='rouge') vus.push('un nombre de départ FAUX est peint « '+peint('qN')+' »');
    ['q1n','q1d','q2n','q2d','q3'].forEach(function(id){
      if(peint(id)!=='vert') vus.push('qN faux : la case juste '+id+' est peinte « '+peint(id)+' »'); });
    der=test.answers[test.answers.length-1];
    if(der && der.correct) vus.push('un nombre de départ faux vaut quand même le point');

    /* ---- 4. cases vides et paires à moitié écrites, en SOUTIEN ----------- */
    currentMode='soutien';
    fixe(RES,1); remplir({q1n:30}); checkQAnswer();
    if(peint('q1n')==='rouge') vus.push('30 seul au numérateur rougit alors qu\\'il promet 30/100');
    ['q1d','qN','q2n','q2d','q3'].forEach(function(id){
      if(peint(id)==='rouge') vus.push('en soutien, la case vide '+id+' rougit'); });
    fixe(RES,1); remplir({q1n:7}); checkQAnswer();
    if(peint('q1n')!=='rouge') vus.push('7 seul au numérateur ne rougit pas : aucune fraction 7/d ne vaut 30/100');
    fixe(RES,1); remplir({q1d:10}); checkQAnswer();
    if(peint('q1d')==='rouge') vus.push('10 seul au dénominateur rougit alors qu\\'il promet 3/10 = 30/100');
    if(peint('q1d')==='rien') vus.push('le dénominateur seul n\\'est pas jugé du tout');

    /* ---- 5. l'aide du type « résultat » ne révèle rien ------------------- */
    currentMode='train';
    fixe(RES,0);                                     /* proposition FAUSSE : 11 */
    const aide=(document.querySelector('#qHost ~ .pt-aide')||document.querySelector('.screen.on .pt-aide')||{}).textContent||'';
    if(aide.indexOf('11')<0) vus.push('l\\'aide ne rappelle pas la proposition choisie : « '+aide+' »');
    if(/retrouver\\s+12/.test(aide)) vus.push('l\\'aide du type « résultat » RÉVÈLE le résultat : « '+aide+' »');

    /* ---- 6. « calcul juste, proposition fausse », sans non-sens ---------- */
    currentMode='soutien';
    fixe(RES,0); remplir(JUSTE); checkQAnswer();
    const fb=(el('qFeedback')||{}).textContent||'';
    if(!/tu avais choisi\\s+11/.test(fb)) vus.push('le message ne nomme pas la proposition choisie : « '+fb+' »');
    if(/et non\\s+12/.test(fb)) vus.push('le message dit « fait 12, et non 12 » : « '+fb+' »');
    currentMode='train';

    /* ---- 7. l'identité : « Recommencer » relance bien la synthèse -------- */
    test.kind='pctq'; test.qId='pourcentage-synthese'; restartCurrentTest();
    if(test.qId!=='pourcentage-synthese') vus.push('« Recommencer » relance '+test.qId+' au lieu de la synthèse');

    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---------- La pose facultative suit les nombres de L'ÉLÈVE -----------------
   (décision de Turquet, août 2026) : dans les quatre écrans qui posent la
   multiplication des numérateurs (2.2.1, 2.3.1, les QCM « retrouver », la
   synthèse en méthode coefficient), la pose est bâtie sur ce que l'élève a
   ÉCRIT dans la ligne coefficient × valeur — même si ses nombres ne sont pas
   ceux de la correction : c'est une aide pour SON calcul, pas une révélation.
   Elle n'est proposée que si un facteur garde au moins 2 chiffres non nuls
   (un fait de table ne se pose pas), les zéros finaux sont retirés, et elle
   ne se reconstruit que si les facteurs changent — reconstruire à chaque
   frappe effacerait ce que l'élève y écrit. */
function poseSuitLEleve(w, P){
  const present = evaluer(w, "typeof poseEleveMAJ==='function' && typeof startAug==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la pose facultative suit les nombres de l\'élève',
      'ce niveau n\'a pas la pose facultative des multiplications');
    return;
  }
  verifierEval(w, 'la pose facultative suit les nombres de l\'élève', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    function essai(nom, demarrer, step, host, nId, vId, maj){
      demarrer();
      const cache=()=>$(step).classList.contains('step-hidden');
      if(!cache()){ vus.push(nom+' : pose visible sans facteurs'); return; }
      $(nId).value='14'; $(vId).value='30'; maj();
      if(cache()){ vus.push(nom+' : pose cachée avec 14 × 30'); return; }
      if($(host).dataset.pose!=='14x3'){ vus.push(nom+' : pose '+$(host).dataset.pose+' au lieu de 14x3'); return; }
      const exps=[...$(host).querySelectorAll('.mp-box')].map(e=>e.dataset.exp).join('');
      if(exps!=='42') vus.push(nom+' : la pose n\\'attend pas le produit de l\\'ÉLÈVE (42) mais « '+exps+' »');
      $(nId).value='13'; maj();
      if($(host).dataset.pose!=='13x3') vus.push(nom+' : la pose ne suit pas les nombres de l\\'élève ('+$(host).dataset.pose+')');
      $(nId).value='2'; maj();
      if(!cache()) vus.push(nom+' : une table (2 × 3) est posée — l\\'aide ne sert à rien');
      $(nId).value='140'; maj();
      if($(host).dataset.pose!=='14x3') vus.push(nom+' : les zéros finaux ne sont pas retirés ('+$(host).dataset.pose+')');
      const in1=$(host).querySelector('input'); if(in1){ in1.value='4'; maj();
        if($(host).querySelector('input').value!=='4') vus.push(nom+' : la pose se reconstruit sans changement de facteurs — l\\'élève perd ce qu\\'il y écrit'); }
      $(vId).value='14'; $(nId).value='3'; maj();
      if(cache()||$(host).dataset.pose!=='14x3') vus.push(nom+' : 3 × 14 n\\'est pas retourné pour rentrer dans la pose');
    }
    essai('2.2.1', startAug, 'aStep3', 'aMul', 'a3n', 'a3v', updateAStep3);
    essai('2.3.1', startDim, 'dStep3', 'dMul', 'd3n', 'd3v', updateDStep3);
    /* QCM : la pose suit l'élève SANS qu'aucune proposition soit choisie */
    essai('retrouver (QCM)', startAugDepart, 'vStep3', 'vMul', 'v3n', 'v3v', updateVStep3);
    /* synthèse, méthode coefficient */
    essai('synthèse (coef)', function(){
      startSyn();
      let q=test.questions[0], garde=0;
      while(q.fam==='pct' && garde++<200){ test.questions[0]=q=genSyn(); }
      renderSynTest(); choisirSyMeth('coef');
    }, 'syPose', 'syMul', 'y3n', 'y3v', updateSynPose);
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}
/* ---------- La pose de l'opération FINALE suit les nombres de l'élève ------
   (demande de Turquet, août 2026, sur une capture du 2.2.2 : l'élève avait
   écrit 6000 + 300 dans la ligne « départ + augmentation », et la pose en
   colonnes montrait 70 + 63 — les nombres de la CORRECTION, pas les siens).
   Dans les trois écrans de la méthode directe (2.2.2/2.3.2, les QCM
   « retrouver » en addition/soustraction, la synthèse en méthode directe),
   la pose de l'addition ou de la soustraction est bâtie sur les termes que
   l'élève a ÉCRITS — c'est une aide pour SON calcul. Les colonnes ne posent
   que des entiers (une soustraction qui ne descend pas sous zéro) ; pas de
   zéros finaux retirés, contrairement à la multiplication : dans une
   addition posée, chaque zéro tient sa colonne. Reconstruite quand les
   termes changent, jamais sinon. */
function poseOperationSuitLEleve(w, P){
  const present = evaluer(w, "typeof poseOpEleveMAJ==='function' && typeof startAugAdd==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la pose de l\'addition ou de la soustraction suit les nombres de l\'élève',
      'ce niveau n\'a pas la méthode directe des évolutions');
    return;
  }
  verifierEval(w, 'la pose de l\'addition ou de la soustraction suit les nombres de l\'élève', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    function essai(nom, demarrer, step, host, aId, bId, maj, neg){
      demarrer();
      const cache=()=>$(step).classList.contains('step-hidden');
      if(!cache()){ vus.push(nom+' : pose visible sans termes écrits'); return; }
      if(neg){
        $(aId).value='70'; $(bId).value='63'; maj();
        if(cache()||$(host).dataset.pose!=='-70;63') vus.push(nom+' : 70 − 63 non posé ('+$(host).dataset.pose+')');
        $(aId).value='63'; $(bId).value='70'; maj();
        if(!cache()) vus.push(nom+' : 63 − 70 est posé — les colonnes ne descendent pas sous zéro');
        return;
      }
      /* LA CAPTURE : 6000 + 300 — la pose montre les nombres de l'ÉLÈVE */
      $(aId).value='6000'; $(bId).value='300'; maj();
      if(cache()){ vus.push(nom+' : pose cachée avec 6000 + 300'); return; }
      if($(host).dataset.pose!=='+6000;300'){ vus.push(nom+' : pose '+$(host).dataset.pose+' au lieu de +6000;300 — elle montre la correction, pas l\\'élève'); return; }
      const exps=[...$(host).querySelectorAll('.mp-box')].map(e=>e.dataset.exp).join('');
      if(exps!=='6300') vus.push(nom+' : la pose n\\'attend pas la somme de l\\'ÉLÈVE (6300) mais « '+exps+' »');
      $(bId).value='63'; maj();
      if($(host).dataset.pose!=='+6000;63') vus.push(nom+' : la pose ne suit pas un terme changé ('+$(host).dataset.pose+')');
      const in1=$(host).querySelector('input'); if(in1){ in1.value='3'; maj();
        if($(host).querySelector('input').value!=='3') vus.push(nom+' : la pose se reconstruit sans changement de termes — l\\'élève perd ce qu\\'il y écrit'); }
      $(aId).value='70,5'; maj();
      if(!cache()) vus.push(nom+' : un terme DÉCIMAL est posé en colonnes');
    }
    essai('2.2.2', startAugAdd, 'ag2Step5', 'ag2Mul', 'g4a', 'g4b', updateAG2Step5, false);
    essai('2.3.2', startDimSub, 'ag2Step5', 'ag2Mul', 'g4a', 'g4b', updateAG2Step5, true);
    /* QCM : la pose suit l'élève SANS qu'aucune proposition soit choisie */
    essai('retrouver (QCM, addition)', startAugDepAdd, 'wPose', 'wMul', 'w4a', 'w4b', updateWPose, false);
    /* synthèse, méthode directe, sur une HAUSSE forcée */
    essai('synthèse (directe)', function(){
      startSyn();
      let q=test.questions[0], garde=0;
      while((q.fam==='pct'||q.sens<0) && garde++<300){ test.questions[0]=q=genSyn(); }
      renderSynTest(); choisirSyMeth('dir');
    }, 'syPose', 'syMul', 'y4a', 'y4b', updateSynPose, false);
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}
/* ---------- 2.1 : le terme entier recopié dans une case de coefficient -----
   Signalé par Julien, transmis par Turquet (août 2026) : « on me signale une
   erreur alors que la correction est conforme à ce que j'ai écrit ». Dans la
   ligne développée, chaque case attend le COEFFICIENT — la page écrit e^(kx)
   juste après — et l'élève avait recopié le terme ENTIER (« 3xe^(−x) ») dans
   la case : son terme affiché valait (3xe^(−x))·e^(−x), compté faux à bon
   droit, mais la bonne démarche affichée lui ressemblait trait pour trait.
   Le message NOMME donc cette erreur quand elle se produit, en entraînement
   comme en soutien — et jamais sur une copie juste. */
function termeEntierDansCaseCoefficient(w, P){
  const present = evaluer(w, "typeof dexpVerdicts==='function' && typeof checkDexp==='function'");
  if(!present.ok || !present.valeur){
    ignorer('2.1 : le terme entier recopié dans une case de coefficient est nommé',
      'ce niveau n\'a pas la dérivée du produit avec exponentielle');
    return;
  }
  verifierEval(w, '2.1 : le terme entier recopié dans une case de coefficient est nommé', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='derivee-exp'; test.kind='dexp';
    /* la question du signalement : f(x) = (−3x+3)e^(−x) */
    const q={type:'dexp', a:-3, b:3, k:-1, uStr:polyToStr([3,-3]), vTxt:expMenu(-1), duTxt:numFmt(-3),
             dvTxt:vprimeMenu(-1), dcoef:[-6,3], facAns:polyFr([-6,3]), expHtml:expCore(-1)};
    test.questions=[q]; test.idx=0; test.score=0; test.answers=[]; test.startTime=Date.now(); test.locked=false;
    show('dexp'); renderDexp();
    /* la copie de Julien, lue par un double (jsdom n'a pas MathLive) */
    const V={'dexp-u':'-3x+3','dexp-du':'-3','dexp-v':'e^(-x)','dexp-dv':'-e^(-x)',
             'dexp-s2a':'-3','dexp-s2b':'e^(-x)','dexp-s2c':'-e^(-x)','dexp-s2d':'-3x+3',
             'dexp-s3a':'-3','dexp-s3b':'3x*e^(-x)','dexp-s3c':'-3','dexp-fac':'3x-6'};
    const vrai=dexpCellValue; dexpCellValue=function(id){ return (id in V)?V[id]:''; };
    try{
      /* d'abord la copie JUSTE : si elle ne passe pas, c'est le contrôle qui a tort */
      const VJ=Object.assign({},V,{'dexp-s3b':'3x'});
      dexpCellValue=function(id){ return (id in VJ)?VJ[id]:''; };
      const rj=dexpVerdicts();
      if(!Object.values(rj.verdicts).every(Boolean)){ vus.push('la copie témoin juste ne passe pas'); return vus.join(' | '); }
      if(rj.groups.s3TermeEntier) vus.push('l\\'avertissement sort sur une copie juste');
      /* puis la copie du signalement */
      dexpCellValue=function(id){ return (id in V)?V[id]:''; };
      const r=dexpVerdicts();
      if(r.verdicts['dexp-s3b']!==false) vus.push('le terme entier recopié dans la case est ACCEPTÉ — le terme affiché vaudrait coefficient×e×e');
      if(r.groups.s3TermeEntier!==true) vus.push('le terme entier n\\'est pas détecté');
      checkDexp();
      const fb=$('dexpFeedback').innerHTML;
      if(fb.indexOf('COEFFICIENT')<0 || fb.indexOf('APRÈS chaque case')<0)
        vus.push('le message ne nomme pas l\\'erreur');
      if(fb.indexOf('La bonne d')<0) vus.push('la bonne démarche a disparu du message');
      /* en soutien aussi : l'élève qui corrige doit savoir QUOI corriger */
      currentMode='soutien'; test.locked=false; renderDexp(); checkDexp();
      const fbs=$('dexpFeedback').innerHTML;
      if(fbs.indexOf('COEFFICIENT')<0) vus.push('en soutien, le message ne nomme pas l\\'erreur');
      currentMode='train';
    } finally { dexpCellValue=vrai; }
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}
/* ---------- 1.3 Signes & variations : la correction dit QUELLE case reprendre
   Signalé par Julien, transmis par Turquet (août 2026) : « toutes les cases
   correctes, mais 0,9/1 ». L'écran révélait TOUT en vert par-dessus la copie
   (la convention abandonnée du 5.2) : l'élève ne voyait plus quelle case
   était fausse, et la note ne tenait qu'au garde-fou de ptsRep. La convention
   COMMUNE (corrCase) s'applique désormais : la case fausse reste ROUGE avec
   la réponse de l'élève et la bonne s'affiche en bleu à côté, la case vide
   est remplie en bleu (jamais rougie), et la note enregistrée compte les
   vraies cases. */
function correctionSignesVariations(w, P){
  const present = evaluer(w, "typeof svBuild==='function' && typeof checkSV==='function'");
  if(!present.ok || !present.valeur){
    ignorer('signes & variations : la correction dit quelle case reprendre',
      'ce niveau n\'a pas l\'exercice Signes & variations');
    return;
  }
  verifierEval(w, 'signes & variations : la correction dit quelle case reprendre', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='signes-variations'; test.kind='sv';
    const lancer=()=>{ test.questions=[svBuild('maxLeft',2,2,'f')]; test.idx=0; test.score=0;
      test.answers=[]; test.startTime=Date.now(); test.locked=false; show('sv'); renderSV(); };
    const a=()=>test.questions[0].ans, cls=id=>$(id).className;

    /* 1. une case fausse + une flèche vide : rouge qui reste, bleu qui dit */
    lancer();
    $('sv-rootx').value=a().rootx; $('sv-extrx').value=a().extrx;
    $('sv-fl').value=a().fl; $('sv-fr').value=(a().fr==='+'?'\\u2212':'+');
    $('sv-dl').value=a().dl; $('sv-dr').value=a().dr;
    $('sv-al').value=a().al;                       /* sv-ar reste VIDE */
    checkSV();
    if(!/\\bbad\\b/.test(cls('sv-fr'))) vus.push('la case fausse ne reste pas rouge ('+cls('sv-fr')+')');
    if($('sv-fr').value===a().fr) vus.push('la case fausse a été écrasée par la correction');
    const badge=$('sv-fr').nextElementSibling;
    if(!badge||!badge.classList.contains('mf-cor')) vus.push('pas de badge bleu à côté de la case fausse');
    if(!/\\bsol\\b/.test(cls('sv-ar'))) vus.push('la flèche vide n\\'est pas remplie en bleu ('+cls('sv-ar')+')');
    if(/\\bbad\\b/.test(cls('sv-ar'))) vus.push('la flèche restée vide ROUGIT');
    ['sv-rootx','sv-extrx','sv-fl','sv-dl','sv-dr','sv-al'].forEach(id=>{
      if(!/\\bok\\b/.test(cls(id))) vus.push('case juste '+id+' non verte ('+cls(id)+')'); });
    let der=test.answers[test.answers.length-1]||{};
    if(!(der.pts<1)||der.cases!==8) vus.push('la note enregistrée ment (pts='+der.pts+' cases='+der.cases+')');
    /* la règle CSS .sol de la famille vt-sel2 existe — la leçon des familles de listes */
    if(!/\\.vt-sel2\\.sol/.test(document.documentElement.innerHTML)) vus.push('aucune règle CSS .vt-sel2.sol : la flèche corrigée en bleu s\\'écrirait à l\\'encre ordinaire');

    /* 2. la copie toute juste vaut le point entier */
    lancer();
    $('sv-rootx').value=a().rootx; $('sv-extrx').value=a().extrx; $('sv-fl').value=a().fl; $('sv-fr').value=a().fr;
    $('sv-dl').value=a().dl; $('sv-dr').value=a().dr; $('sv-al').value=a().al; $('sv-ar').value=a().ar;
    checkSV();
    der=test.answers[test.answers.length-1]||{};
    if(!der.correct) vus.push('la copie toute juste ne vaut pas le point');

    /* 3. en soutien, la case vide ne reçoit AUCUNE couleur */
    currentMode='soutien';
    lancer();
    $('sv-fl').value=a().fl;                       /* le reste VIDE */
    checkSV();
    if(/\\bbad\\b/.test(cls('sv-rootx'))) vus.push('en soutien, une case vide rougit à la vérification');
    if(!/\\bok\\b/.test(cls('sv-fl'))) vus.push('en soutien, la case juste seule n\\'est pas verte');
    currentMode='train';
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}
/* ---------- La vérification s'affiche AVEC les propositions ----------------
   (décision de Turquet, août 2026) : dans tous les QCM à chaîne de
   vérification — pourcentages 2.1.4/2.1.5/2.1.6, les quatre « retrouver »
   des évolutions, leurs variantes addition/soustraction, la synthèse des
   évolutions — l'élève écrit les étapes AVANT de choisir s'il veut, et
   choisir (ou changer) ne détruit jamais ce qu'il a écrit. Quatre bords :
   la chaîne visible sans choix, la case qui survit au choix ET au
   changement, la marque « sel » qui suit, et la POSE facultative qui ne se
   révèle jamais vide (elle n'existe qu'une proposition choisie). La synthèse
   des évolutions a son bord propre : la méthode se choisit AVANT la
   proposition, et la chaîne apparaît dès la méthode. */
function verificationAvecPropositions(w, P){
  const present = evaluer(w, "typeof startPctDepart==='function' && typeof choisirQ==='function' && typeof qcmRedessiner==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la vérification s\'affiche avec les propositions, et choisir n\'efface rien',
      'ce niveau n\'a pas les QCM à chaîne de vérification');
    return;
  }
  /* Contrôle SYNCHRONE, exprès : les démarreurs de ces exercices n'attendent
     rien, et un contrôle asynchrone laisserait les minuteurs en attente des
     contrôles précédents s'exécuter à chaque await — un exercice chronométré
     avançait et verrouillait test en plein vol (le piège documenté des
     contrôles qui se rendent l'état à tour de rôle). */
  verifierEval(w, 'la vérification s\'affiche avec les propositions, et choisir n\'efface rien', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    const visible=id=>{ let e=$(id); if(!e) return false; for(let n=e;n;n=n.parentElement){ if(n.classList&&n.classList.contains('step-hidden')) return false; } return true; };
    function essai(nom, demarrer, champ, choisir, prefixe){
      demarrer();
      if(!visible(champ)){ vus.push(nom+' : la chaîne de vérification est cachée avant le choix'); return; }
      $(champ).value='7';
      choisir(1);
      if(String($(champ).value)!=='7'){ vus.push(nom+' : choisir efface la case écrite'); return; }
      const b=$(prefixe+'1');
      if(!b || b.className.indexOf('sel')<0){ vus.push(nom+' : la proposition choisie ne se marque pas'); return; }
      choisir(2);
      if(String($(champ).value)!=='7'){ vus.push(nom+' : changer de proposition efface la case écrite'); return; }
      if(b.isConnected && b.className.indexOf('sel')>=0) vus.push(nom+' : la marque ne suit pas le changement de proposition');
      const b2=$(prefixe+'2');
      if(!b2 || b2.className.indexOf('sel')<0) vus.push(nom+' : la nouvelle proposition ne se marque pas');
    }
    essai('2.1.4', startPctDepart, 'q1n', choisirQ, 'qc');
    essai('2.1.5', startPctTaux, 'q1n', choisirQ, 'qc');
    essai('2.1.6', startPctSynthese, 'qN', choisirQ, 'qc');
    essai('retrouver la valeur (hausse)', startAugDepart, 'v1n', choisirV, 'vc');
    essai('retrouver le taux (hausse)', startAugTaux, 'v1n', choisirV, 'vc');
    essai('retrouver le taux (addition)', startAugTauxAdd, 'w1n', choisirW, 'wc');

    /* la synthèse des évolutions : la méthode se choisit AVANT la proposition,
       la chaîne apparaît dès la méthode, et le choix n'efface rien */
    startSyn();
    let q=test.questions[0], garde=0;
    while(q.fam==='pct' && garde++<200){ test.questions[0]=q=genSyn(); }
    renderSynTest();
    if(q.fam==='pct'){ vus.push('impossible de tirer une question à évolution pour la synthèse'); }
    else {
      if(!$('syMeth')) vus.push('synthèse : les boutons de méthode manquent avant le choix de la proposition');
      choisirSyMeth('coef');
      if(!visible('y1n')) vus.push('synthèse : la chaîne reste cachée une fois la méthode choisie');
      else { $('y1n').value='7'; choisirSy(1);
        if(String($('y1n').value)!=='7') vus.push('synthèse : choisir la proposition efface la case écrite'); }
    }
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}
/* {pourcentage-synthese-libre} (Première 2.1.7) — les questions de la
   synthèse, mais l'élève JUSTIFIE dans la feuille de calcul de la Terminale,
   vide, et c'est l'IA qui lit. Tout le risque est DANS CE QUI PART AU MODÈLE :
     · la règle nomme la voie attendue avec les nombres MÊMES de la question
       (P/100 × N), dit que les étapes suivantes sont FACULTATIVES, ACCEPTE
       tout calcul différent qui fonctionne, et REFUSE la copie sans étape —
       n'en tenir qu'un ne tient rien ;
     · la bonne proposition y est déclarée STRICTEMENT SECRÈTE, et le point 1
       tranche selon la proposition réellement choisie ;
     · l'énoncé et la règle tiennent dans les bornes de troncature de la
       fonction Edge, LUES dans sa source — une règle coupée en son milieu ne
       lève rien, le modèle corrige avec la moitié reçue ;
     · le tirage mêle les trois types, chacun au moins une fois, ordre variable.
   La fonction Edge ne se déploie pas toute seule : ce contrôle compare la page
   au FICHIER du dépôt, il ne voit pas ce qui tourne chez Supabase. */
function syntheseLibrePourcentage(w, P){
  const present = evaluer(w, "typeof startPctSyntheseLibre==='function' && typeof pslAttenduIA==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la règle de la synthèse rédigée est complète et tient dans la borne de la fonction Edge',
      'ce niveau n\'a pas la synthèse rédigée des pourcentages');
    return;
  }
  let bornes;
  try{
    const srcF = fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/corriger-definition/index.ts'), 'utf8');
    const q = srcF.match(/payload\.question\s*\|\|\s*""\)\.toString\(\)\.slice\(0,\s*(\d+)\)/);
    const a = srcF.match(/payload\.attendu\s*\|\|\s*""\)\.toString\(\)\.slice\(0,\s*(\d+)\)/);
    if(q && a) bornes = { question:+q[1], attendu:+a[1] };
  }catch(e){ bornes = undefined; }
  if(!bornes){
    verifier('la règle de la synthèse rédigée est complète et tient dans la borne de la fonction Edge',
      false, 'les bornes de troncature sont introuvables dans supabase/functions/corriger-definition/index.ts');
    return;
  }
  const mesure = verifierEval(w, 'la règle de la synthèse rédigée est complète et tient dans la borne de la fonction Edge', `(function(){
    const vus=[]; const B=${JSON.stringify(bornes)};
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='pourcentage-synthese-libre';

    /* ---- 1. le tirage : les trois types, ordre variable ------------------- */
    const ordres={};
    for(let t=0;t<40 && !vus.length;t++){
      startPctSyntheseLibre();
      const types=test.questions.map(function(q){ return q.type; });
      ['res','val','pct'].forEach(function(ty){
        if(types.indexOf(ty)<0) vus.push('tirage '+t+' : aucun type « '+ty+' »');
      });
      ordres[types.join(',')]=1;
    }
    if(!vus.length && Object.keys(ordres).length<2)
      vus.push('l\\'ordre des types ne change jamais d\\'un tirage à l\\'autre');

    /* ---- 2. la règle, par type et par choix ------------------------------- */
    let pireQ=0, pireA=0, pireEti='';
    const gens=[genPctRes,genPctDepart,genPctTaux];
    for(let i=0;i<400 && !vus.length;i++){
      const q=gens[i%3](); q.choisi=(i%2===0)?q.bon:((q.bon+1)%4);
      const e=pslEnonceIA(q), a=pslAttenduIA(q);
      if(e.length>pireQ) pireQ=e.length;
      if(a.length>pireA){ pireA=a.length; pireEti=q.type+' '+q.P+'% de '+q.N; }
      const eti='('+q.type+', choix '+(q.choisi===q.bon?'juste':'faux')+') ';
      /* la voie attendue doit être NOMMÉE dans la règle de décision : la ligne
         d'égalité, plus haut, porte la même écriture — chercher dans tout le
         texte ne prouvait rien, un sabotage l'a montré en restant vert */
      const regle=a.slice(Math.max(0,a.indexOf('RÈGLE DE DÉCISION')));
      if(regle.indexOf(q.P+'/100 × '+q.N)<0){ vus.push(eti+'la règle de décision n\\'écrit pas la voie attendue '+q.P+'/100 × '+q.N); break; }
      /* pour « retrouver le pourcentage », la PART SUR LE TOUT amenée à /100
         (32/40 = 80/100) est une voie attendue, nommée avec les nombres de la
         question et déclarée à accepter — signalée par Turquet sur une copie
         refusable, août 2026 */
      if(q.type==='pct' && (regle.indexOf(q.result+'/'+q.N+' = '+q.P+'/100')<0 || regle.indexOf('DOIT être acceptée')<0)){
        vus.push(eti+'la règle n\\'accepte plus la part sur le tout '+q.result+'/'+q.N+' = '+q.P+'/100'); break; }
      if(a.indexOf('FACULTATIVES')<0){ vus.push(eti+'la règle n\\'a plus les étapes facultatives'); break; }
      if(a.indexOf('FONCTIONNENT')<0 || a.indexOf('idée différente')<0){ vus.push(eti+'la règle n\\'accepte plus un calcul différent qui fonctionne'); break; }
      if(!/sans aucun calcul, est REFUSÉ/.test(a)){ vus.push(eti+'la règle ne refuse plus la copie sans étape'); break; }
      if(a.indexOf('AUCUNE ÉGALITÉ FAUSSE')<0){ vus.push(eti+'la règle n\\'interdit plus les égalités fausses'); break; }
      if(a.indexOf('STRICTEMENT SECRÈTE')<0){ vus.push(eti+'la bonne proposition n\\'est plus déclarée secrète'); break; }
      if(q.choisi===q.bon && a.indexOf('c\\u2019est la bonne')<0){ vus.push(eti+'le point 1 ne valide pas le bon choix'); break; }
      if(q.choisi!==q.bon && a.indexOf('N\\u2019EST PAS la bonne')<0){ vus.push(eti+'le point 1 ne condamne pas le mauvais choix'); break; }
      if(q.prod!==q.P*q.N || q.result*100!==q.prod){ vus.push(eti+'l\\'énoncé contredit sa correction'); break; }
      if(e.indexOf(QLET[q.choisi]+')')<0){ vus.push(eti+'l\\'énoncé envoyé ne dit pas ce que l\\'élève a choisi'); break; }
    }
    if(!vus.length && pireA>B.attendu-300)
      vus.push('la règle frôle ou dépasse la borne de la fonction Edge : '+pireA+' caractères pour '+B.attendu+' ('+pireEti+')');
    if(!vus.length && pireQ>B.question-300)
      vus.push('l\\'énoncé frôle ou dépasse sa borne : '+pireQ+' caractères pour '+B.question);

    /* ---- 3. la feuille avant le choix, et le choix qui ne l'efface pas ----
       (décision de Turquet, août 2026) : la justification s'écrit SANS avoir
       choisi de proposition, et choisir ensuite ne doit ni recréer la feuille
       ni redessiner l'écran — un redessin effacerait le calcul que l'élève
       vient d'écrire, au moment précis où il valide. On tient l'identité de
       l'objet ET la présence de la ligne dans le document : le contenu d'une
       feuille vit dans ses éléments, les préserver préserve le texte. */
    startPctSyntheseLibre();
    if(!pslFeuille || !pslFeuille.lignes.length){
      vus.push('au démarrage, la feuille de justification n\\'existe pas avant le choix d\\'une proposition');
    } else {
      const f0=pslFeuille, ligne0=pslFeuille.lignes[0].line;
      choisirPsl(2);
      if(test.questions[0].choisi!==2) vus.push('choisirPsl ne retient pas la proposition');
      if(pslFeuille!==f0) vus.push('choisir une proposition recrée la feuille — la justification écrite serait effacée');
      else if(!ligne0.isConnected) vus.push('choisir une proposition redessine l\\'écran — la ligne écrite a disparu du document');
      const b2=$('pslc2');
      if(!b2 || b2.className.indexOf('sel')<0) vus.push('la proposition choisie ne se marque pas');
      choisirPsl(1);
      if((b2 && b2.className.indexOf('sel')>=0) || !$('pslc1') || $('pslc1').className.indexOf('sel')<0)
        vus.push('changer de proposition ne déplace pas la marque');
      if(pslFeuille!==f0) vus.push('changer de proposition recrée la feuille');
      /* vérifier sans proposition : un message, jamais un verrou */
      test.questions[0].choisi=null;
      checkPsl();
      const fb=$('pslFeedback');
      if(!fb || fb.textContent.indexOf('Choisis d')!==0) vus.push('vérifier sans proposition ne demande pas de choisir');
      if(test.locked) vus.push('vérifier sans proposition verrouille l\\'exercice');
    }

    /* ---- 4. l'identité : « Recommencer » relance bien la synthèse rédigée - */
    test.kind='psl'; test.qId='(sentinelle)'; restartCurrentTest();
    if(test.qId!=='pourcentage-synthese-libre') vus.push('« Recommencer » relance « '+test.qId+' » au lieu de la synthèse rédigée');

    return vus.join(' | ') || ('OK|'+pireA+'|'+pireQ);
  })()`, v => typeof v==='string' && v.indexOf('OK|')===0, undefined);
  if(typeof mesure==='string' && mesure.indexOf('OK|')===0){
    const p=mesure.split('|');
    console.log('   · la plus longue règle de la synthèse rédigée : '+p[1]+' caractères pour '+bornes.attendu
      +' ('+(bornes.attendu-p[1])+' de marge) ; le plus long énoncé : '+p[2]+' pour '+bornes.question);
  }
}
/* {synthese-augmentations-libre} (2.2.9) — la synthèse des hausses, rédigée.
   La page porte son JUGE (salJuge) : on l'éprouve cas par cas sur des
   questions ÉPINGLÉES (la leçon documentée : une copie qui ne colle pas à la
   question tirée mesurerait autre chose), puis on tient la RÈGLE envoyée au
   modèle — les deux voies NOMMÉES avec les nombres de la question, après
   « RÈGLE DE DÉCISION » (chercher dans tout le texte ne prouve rien) — et la
   borne de troncature de la fonction Edge, verdict du juge inclus. Enfin la
   feuille avant le choix, le choix qui ne l'efface pas, et l'identité. */
function syntheseAugLibreRedigee(w, P){
  const present = evaluer(w, "typeof startSynAugLibre==='function' && typeof salAttenduIA==='function' && typeof salJuge==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la synthèse des augmentations rédigée : juge local, règle complète, feuille préservée',
      'ce niveau n\'a pas la synthèse des augmentations rédigée');
    return;
  }
  let bornes;
  try{
    const srcF = fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/corriger-definition/index.ts'), 'utf8');
    const q = srcF.match(/payload\.question\s*\|\|\s*""\)\.toString\(\)\.slice\(0,\s*(\d+)\)/);
    const a = srcF.match(/payload\.attendu\s*\|\|\s*""\)\.toString\(\)\.slice\(0,\s*(\d+)\)/);
    if(q && a) bornes = { question:+q[1], attendu:+a[1] };
  }catch(e){ bornes = undefined; }
  if(!bornes){
    verifier('la synthèse des augmentations rédigée : juge local, règle complète, feuille préservée',
      false, 'les bornes de troncature sont introuvables dans supabase/functions/corriger-definition/index.ts');
    return;
  }
  const mesure = verifierEval(w, 'la synthèse des augmentations rédigée : juge local, règle complète, feuille préservée', `(function(){
    const vus=[]; const B=${JSON.stringify(bornes)};
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='synthese-augmentations-libre';

    /* ---- 1. le JUGE, cas par cas, sur deux questions épinglées ---- */
    const qFin={fam:'aug',inc:'fin',sens:1,P:5,N:600,aug:30,fin:630,decStr:'630',unit:'€',opts:[615,630,660,690],bon:1,choisi:1,ci:0,v:0};
    const qPct={fam:'aug',inc:'pct',sens:1,P:30,N:600,aug:180,fin:780,decStr:'780',unit:'€',opts:[20,30,40,50],bon:1,choisi:1,ci:0,v:0};
    const qFinD={fam:'dim',inc:'fin',sens:-1,P:5,N:600,aug:30,fin:570,decStr:'570',unit:'€',opts:[555,570,600,630],bon:1,choisi:1,ci:0,v:0};
    /* la copie de production (signalée par Turquet, août 2026) : « 100 ×
       140/100 = 140 » sur « +40 % atteint 140, retrouve la valeur initiale »
       — le coefficient écrit en FRACTION, la valeur initiale devant. Si elle
       ne passe pas au juge, c'est le juge qui a tort. */
    const qIni={fam:'aug',inc:'ini',sens:1,P:40,N:100,aug:40,fin:140,decStr:'140',unit:'articles',opts:[300,60,200,100],bon:3,choisi:3,ci:0,v:0};
    /* la seconde copie de production (signalée par Turquet, août 2026) :
       « 936/900 = 104/100 » puis « donc coef 1.04 » sur « 900 devient 936,
       retrouve le pourcentage » — LA VOIE DU QUOTIENT, et une ligne de
       commentaire que le juge ne sait pas lire. Elle SUFFIT : si elle ne
       passe pas au juge, c'est le juge qui a tort. */
    const qQuot={fam:'aug',inc:'pct',sens:1,P:4,N:900,aug:36,fin:936,decStr:'936',unit:'licenciés',opts:[30,4,8,40],bon:1,choisi:1,ci:0,v:0};
    const cas=[
      ['coefficient',            qFin, 1, '1,05 × 600 = 630',                  true,  true ],
      ['coefficient, ordre libre',qFin, 1, '600 × 1,05 = 630',                 true,  true ],
      ['augmentation en 2 lignes',qFin, 1, '0,05 × 600 = 30\\n600 + 30 = 630', true,  true ],
      ['ligne combinée',         qFin, 1, '600 + 0,05 × 600 = 630',            true,  true ],
      ['fraction 5/100',         qFin, 1, '5/100 × 600 = 30\\n600 + 30 = 630', true,  true ],
      ['recopie sans calcul',    qFin, 1, '630',                               true,  false],
      ['égalité fausse',         qFin, 1, '1,05 × 600 = 640',                  true,  false],
      ['addition manquante',     qFin, 1, '0,05 × 600 = 30',                   true,  false],
      ['multiplication manquante',qFin, 1, '600 + 30 = 630',                   true,  false],
      ['mauvaise proposition',   qFin, 0, '1,05 × 600 = 630',                  true,  false],
      ['multiplication noyée dans un autre calcul', qFin, 1, '1,05 × 600 − 30 = 600', true, false],
      ['pourcentage choisi juste',qPct, 1, '1,3 × 600 = 780',                  true,  true ],
      ['pourcentage choisi faux, calcul cohérent', qPct, 2, '1,4 × 600 = 840', true,  false],
      ['écriture inconnue',      qFin, 1, 'j’ai trouvé 630',                   false, null ],
      ['copie de production : Vi × 140/100', qIni, 3, '100 × 140/100 = 140',    true,  true ],
      ['coefficient en fraction, ordre inverse', qIni, 3, '140/100 × 100 = 140', true, true ],
      ['baisse : coefficient',   qFinD, 1, '0,95 × 600 = 570',                  true,  true ],
      ['baisse : diminution puis soustraction', qFinD, 1, '0,05 × 600 = 30\\n600 − 30 = 570', true, true ],
      ['baisse : une addition au lieu de la soustraction', qFinD, 1, '0,05 × 600 = 30\\n630 = 600 + 30', true, false],
      ['baisse : soustraction sans la multiplication', qFinD, 1, '600 − 30 = 570', true, false],
      ['baisse : une addition qui retombe sur la valeur finale ne remplace pas la soustraction', qFinD, 1, '0,05 × 600 = 30\\n540 + 30 = 570', true, false],
      ['copie de production : le quotient 936/900 = 104/100 suffit', qQuot, 1, '936/900 = 104/100\\ndonc coef 1.04', true, true ],
      ['le quotient égalé au décimal', qQuot, 1, '936/900 = 1,04',              true,  true ],
      ['le quotient en tautologie ne nomme rien', qQuot, 1, '936/900 = 936/900', true, false],
      ['le quotient avec la mauvaise proposition', qQuot, 3, '936/900 = 104/100', true, false],
      ['le quotient sur une baisse',   qFinD, 1, '570/600 = 95/100',            true,  true ],
      ['un commentaire illisible n\\'annule pas une voie montrée', qFin, 1, '1,05 × 600 = 630\\ndonc ça marche', true, true ],
    ];
    cas.forEach(function(c){
      const q=JSON.parse(JSON.stringify(c[1])); q.choisi=c[2];
      const j=salJuge(q, c[3]);
      if(j.sait!==c[4]) vus.push('juge « '+c[0]+' » : sait='+j.sait+' au lieu de '+c[4]);
      else if(c[4] && j.correct!==c[5]) vus.push('juge « '+c[0]+' » : correct='+j.correct+' au lieu de '+c[5]);
    });
    if(!vus.length){
      const q=JSON.parse(JSON.stringify(qFin)); q.choisi=1;
      const j=salJuge(q,'1,05 × 600 = 640');
      if(!j.phrase || j.phrase.indexOf('640')<0) vus.push('le refus d\\'une égalité fausse ne la nomme pas');
    }

    /* ---- 2. la règle envoyée au modèle, par inconnue et par choix ---- */
    let pireQ=0, pireA=0, pireEti='';
    const jugeMesure={sait:true, correct:false, phrase:'Il y a une égalité fausse dans ton calcul : « 1,05 × 600 = 640 ». Reprends cette ligne.'};
    for(let i=0;i<120 && !vus.length;i++){
      const q=genSyn((i%2===0)?'aug':'dim', ['fin','ini','pct'][i%3]); q.choisi=(i%4<2)?q.bon:((q.bon+1)%4);
      const e=salEnonceIA(q), a=salAttenduIA(q, (i%4===0)?jugeMesure:null), c=salCouple(q);
      if(e.length>pireQ) pireQ=e.length;
      if(a.length>pireA){ pireA=a.length; pireEti=q.inc+' '+c.P+'% de '+c.N; }
      const eti='('+q.inc+', choix '+(q.choisi===q.bon?'juste':'faux')+') ';
      const regle=a.slice(Math.max(0,a.indexOf('RÈGLE DE DÉCISION')));
      if(regle.indexOf(c.coefStr+' × '+c.N)<0){ vus.push(eti+'la règle n\\'écrit pas la voie du coefficient '+c.coefStr+' × '+c.N); break; }
      if(regle.indexOf(c.pDecStr+' × '+c.N)<0){ vus.push(eti+'la règle n\\'écrit pas la voie de l\\'augmentation '+c.pDecStr+' × '+c.N); break; }
      if(q.fam==='aug' && regle.indexOf('addition')<0){ vus.push(eti+'la règle n\\'exige plus l\\'addition de la voie de l\\'augmentation'); break; }
      if(q.fam==='dim' && regle.indexOf('soustraction')<0){ vus.push(eti+'la règle n\\'exige plus la soustraction de la voie de la diminution'); break; }
      if(!/sans aucun calcul, est REFUSÉ/.test(regle)){ vus.push(eti+'la règle ne refuse plus la copie sans étape'); break; }
      if(regle.indexOf('AUCUNE ÉGALITÉ FAUSSE')<0){ vus.push(eti+'la règle n\\'interdit plus les égalités fausses'); break; }
      if(a.indexOf('STRICTEMENT SECRÈTE')<0){ vus.push(eti+'la bonne proposition n\\'est plus déclarée secrète'); break; }
      if(q.choisi===q.bon && a.indexOf('c\\u2019est la bonne')<0){ vus.push(eti+'le point 1 ne valide pas le bon choix'); break; }
      if(q.choisi!==q.bon && a.indexOf('N\\u2019EST PAS la bonne')<0){ vus.push(eti+'le point 1 ne condamne pas le mauvais choix'); break; }
      if((i%4===0) && (a.indexOf('VERDICT DE LA PAGE')<0 || a.indexOf('PRIORITAIRE')<0)){ vus.push(eti+'le verdict du juge ne part plus avec la règle'); break; }
      if(e.indexOf(QLET[q.choisi]+')')<0){ vus.push(eti+'l\\'énoncé envoyé ne dit pas ce que l\\'élève a choisi'); break; }
    }
    if(!vus.length && pireA>B.attendu-300)
      vus.push('la règle frôle ou dépasse la borne de la fonction Edge : '+pireA+' caractères pour '+B.attendu+' ('+pireEti+')');
    if(!vus.length && pireQ>B.question-300)
      vus.push('l\\'énoncé frôle ou dépasse sa borne : '+pireQ+' caractères pour '+B.question);

    /* ---- 3. la feuille avant le choix, le choix qui ne l'efface pas ---- */
    startSynAugLibre();
    if(!salFeuille || !salFeuille.lignes.length){
      vus.push('au démarrage, la feuille de justification n\\'existe pas avant le choix d\\'une proposition');
    } else {
      const f0=salFeuille, ligne0=salFeuille.lignes[0].line;
      choisirSal(2);
      if(test.questions[0].choisi!==2) vus.push('choisirSal ne retient pas la proposition');
      if(salFeuille!==f0) vus.push('choisir une proposition recrée la feuille — la justification écrite serait effacée');
      else if(!ligne0.isConnected) vus.push('choisir une proposition redessine l\\'écran — la ligne écrite a disparu du document');
      const b2=$('salc2');
      if(!b2 || b2.className.indexOf('sel')<0) vus.push('la proposition choisie ne se marque pas');
      choisirSal(1);
      if((b2 && b2.className.indexOf('sel')>=0) || !$('salc1') || $('salc1').className.indexOf('sel')<0)
        vus.push('changer de proposition ne déplace pas la marque');
      if(salFeuille!==f0) vus.push('changer de proposition recrée la feuille');
      test.questions[0].choisi=null;
      checkSal();
      const fb=$('salFeedback');
      if(!fb || fb.textContent.indexOf('Choisis d')!==0) vus.push('vérifier sans proposition ne demande pas de choisir');
      if(test.locked) vus.push('vérifier sans proposition verrouille l\\'exercice');
    }

    /* ---- 4. l'identité : « Recommencer » relance la bonne synthèse rédigée ---- */
    test.kind='sal'; test.qId='(sentinelle)'; restartCurrentTest();
    if(test.qId!=='synthese-augmentations-libre') vus.push('« Recommencer » relance « '+test.qId+' » au lieu de la synthèse rédigée des augmentations');
    if(typeof startSynDimLibre==='function'){
      test.kind='sal'; test.qId='synthese-diminutions-libre'; restartCurrentTest();
      if(test.qId!=='synthese-diminutions-libre') vus.push('« Recommencer » sur le 2.3.8 relance « '+test.qId+' »');
    }

    return vus.join(' | ') || ('OK|'+pireA+'|'+pireQ);
  })()`, v => typeof v==='string' && v.indexOf('OK|')===0, undefined);
  if(typeof mesure==='string' && mesure.indexOf('OK|')===0){
    const p=mesure.split('|');
    console.log('   · la plus longue règle du 2.2.9 : '+p[1]+' caractères pour '+bornes.attendu
      +' ('+(bornes.attendu-p[1])+' de marge) ; le plus long énoncé : '+p[2]+' pour '+bornes.question);
  }
}
/* {ordre-croissant} — les nombres de {placer-intervalle}, à ranger avec « < ».
   Quatre bords, et n'en tenir qu'un ne tient rien :
     · le tirage vient de plcGen() et garantit trois nombres distincts, dont
       les décomptes de décimales diffèrent — sans quoi le bouton des zéros
       n'aurait rien à faire ;
     · l'ordre est CALCULÉ par la fonction qui corrige, en entiers, et une
       SECONDE méthode le vérifie ici — les écritures complétées de zéros
       comparées comme des chaînes ;
     · chaque case a son verdict, une case vide ne rougit pas, la note compte ;
     · le bouton ne change QUE l'écriture — jamais une réponse déjà choisie,
       jamais la correction. */
/* ---------- L'image d'un nombre : la réponse est lue dans la courbe ---------- */
/* {image-nombre} (Seconde, 2.2). Trois promesses, chacune silencieuse si elle
   casse. La bonne réponse n'est JAMAIS rangée à côté de la question : l'image
   se calcule depuis q.pts — les données mêmes qui dessinent la courbe — par la
   fonction qui corrige, donc un énoncé ne peut pas contredire sa correction ;
   le contrôle exige que la question ne porte RIEN d'autre. Le trait est LA
   MÉTHODE de la fiche : absent pendant la recherche (il donnerait la hauteur),
   dessiné à la validation, et mesuré contre les GRADUATIONS du dessin — aucune
   coordonnée recopiée, une échelle qui changerait resterait mesurée juste.
   Et les règles de partout : cinq réponses comptées cinq, une case juste qui
   ne rougit pas pour sa voisine, une case vide jamais rouge. */
/* ---------- Inéquation graphique : quatre dessins dans un ordre tiré, conservé, jamais menteur ---------- */
/* {inequation-graphique} (Seconde, thème Fonctions). Le pire défaut possible est
   ici un dessin qui contredit sa question — l'élève lit juste et rougit. Le
   contrôle MESURE donc les quatre dessins contre les graduations du dessin
   même (aucune coordonnée recopiée), vérifie que l'ordre des dessins est tiré
   (à op égal, le rang du bon varie d'une séance à l'autre) et CONSERVÉ pour
   les quatre sous-questions, que la question ne range rien d'autre que la
   courbe, la hauteur, l'ordre et le signe, puis CLIQUE « Vérifier » sur des
   copies choisies — canonique, à une faute, à cases vides, et la copie qui
   décrit les deux morceaux dans l'autre ordre, qui est juste. */
function inequationGraphique(w, P){
  const present = evaluer(w, "typeof startIng==='function' && typeof ingJuge==='function'");
  if(!present.ok || !present.valeur){
    ignorer('l\'inéquation graphique : quatre dessins dans un ordre tiré, conservé, et jamais menteur',
      'ce niveau n\'a pas l\'exercice de l\'inéquation graphique');
    return;
  }
  verifierEval(w, 'l\'inéquation graphique : quatre dessins dans un ordre tiré, conservé, et jamais menteur', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='inequation-graphique';

    /* ---- 1. le tirage : les quatre sous-questions de la fiche, le même
       tirage pour les quatre, l'ordre des dessins mélangé, les croisements
       PILE sur des graduations et jamais au bord — le tout par sa propre
       arithmétique, et RIEN d'autre dans la question. ---- */
    const rangs=new Set();
    for(let t=0;t<80 && !vus.length;t++){
      startIng(); clearTimeout(test.fbTimer);
      if(test.questions.length!==4){ vus.push(test.questions.length+' questions au lieu de 4'); break; }
      if(test.questions.map(function(q){ return q.op; }).join(',')!=='ge,gt,le,lt')
        vus.push('les sous-questions ne suivent pas l\\'ordre de la fiche (\\u2265, >, \\u2264, <) : '+test.questions.map(function(q){ return q.op; }).join(','));
      const q0=test.questions[0];
      const ref=JSON.stringify([q0.pts,q0.k,q0.perm]);
      if(test.questions.some(function(q){ return JSON.stringify([q.pts,q.k,q.perm])!==ref; }))
        vus.push('la courbe ou l\\'ordre des dessins CHANGE d\\'une sous-question à l\\'autre — l\\'ordre tiré doit être conservé pour les quatre');
      if(q0.perm.slice().sort().join(',')!=='ge,gt,le,lt')
        vus.push('l\\'ordre des dessins n\\'est pas une permutation des quatre signes : '+q0.perm.join(','));
      rangs.add(q0.perm.indexOf('ge'));
      test.questions.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return ['pts','k','perm','op'].indexOf(k)<0; });
        if(cles.length) vus.push('la question range autre chose que la courbe, la hauteur, l\\'ordre et le signe : '+cles.join(','));
      });
      if(q0.pts.length!==7 || q0.pts.some(function(y){ return !Number.isInteger(y)||y<-3||y>3; })) vus.push('courbe hors du quadrillage');
      if(!Number.isInteger(q0.k)||q0.k<-3||q0.k>3) vus.push('hauteur de droite hors du quadrillage : '+q0.k);
      if(q0.k===0) vus.push('la droite est posée SUR l\\'axe des abscisses (k = 0) : elle ne se voit plus, et ses marques tombent sur les étiquettes');
      const cross=[]; for(let x=-3;x<=3;x++){ if(q0.pts[x+3]===q0.k) cross.push(x); }
      if(cross.length!==2){ vus.push('la droite croise la courbe en '+cross.length+' graduation(s) au lieu de 2'); }
      else{
        if(cross[0]<=-3||cross[1]>=3) vus.push('un croisement tombe au bord de la courbe : un morceau du dessous serait vide');
        for(let x=-3;x<=3;x++){ const y=q0.pts[x+3];
          if(x>cross[0]&&x<cross[1]){ if(y<=q0.k) vus.push('entre les croisements, la courbe n\\'est pas strictement au-dessus de la droite'); }
          else if(x<cross[0]||x>cross[1]){ if(y>=q0.k) vus.push('hors des croisements, la courbe n\\'est pas strictement au-dessous de la droite'); }
        }
      }
    }
    if(!vus.length && rangs.size<2)
      vus.push('sur 80 séances, le dessin de \\u2265 tombe toujours au rang '+Array.from(rangs)[0]+' : l\\'ordre des dessins n\\'est pas mélangé');

    /* ---- 2. les quatre dessins, MESURÉS contre les graduations du dessin
       même : même courbe noire partout, et le rouge de chaque carte dit
       exactement son signe — morceaux, bornes, point plein ou rond vide. ---- */
    startIng(); clearTimeout(test.fbTimer);
    test.idx=0; renderIngTest();
    const q=test.questions[0];
    const cross=[]; for(let x=-3;x<=3;x++){ if(q.pts[x+3]===q.k) cross.push(x); }
    const x1=cross[0], x2=cross[1];
    const cartes=document.querySelectorAll('#ingHost .ing-carte');
    if(cartes.length!==4) vus.push(cartes.length+' dessins au lieu de 4');
    else{
      const dNoir=[]; cartes.forEach(function(c){ const p=c.querySelector('.lv-curve'); dNoir.push(p?p.getAttribute('d'):'absente'); });
      if(new Set(dNoir).size!==1) vus.push('les quatre dessins ne portent pas la MÊME courbe noire');
      /* l'échelle se relit sur les étiquettes des graduations — aucune
         coordonnée recopiée, un viewBox qui changerait resterait mesuré juste */
      const carte0=cartes[0];
      const grad=function(txt,horiz){
        const ts=carte0.querySelectorAll('text.lv-ax');
        for(let i=0;i<ts.length;i++){ if(ts[i].textContent===txt &&
          (horiz ? ts[i].getAttribute('text-anchor')==='middle' : ts[i].getAttribute('text-anchor')==='end')) return ts[i]; }
        return null; };
      const g3=grad(numFmt(-3),true), g3b=grad(numFmt(3),true);
      const h1=grad(numFmt(-1),false), h1b=grad(numFmt(1),false);
      if(!g3||!g3b||!h1||!h1b){ vus.push('les graduations \\u22123, 3, \\u22121 ou 1 sont introuvables sur le dessin'); }
      else{
        const gx=function(el){ return parseFloat(el.getAttribute('x')); };
        const gy=function(el){ return parseFloat(el.getAttribute('y'))-3.5; };
        const sx=function(v){ return gx(g3)+(v+3)*(gx(g3b)-gx(g3))/6; };
        const sy=function(v){ return (gy(h1)+gy(h1b))/2 - v*(gy(h1)-gy(h1b))/2; };
        const deb=function(d){ const m=d.match(/M\\s*([-\\d.]+)\\s+([-\\d.]+)/); return m?[parseFloat(m[1]),parseFloat(m[2])]:[NaN,NaN]; };
        const fin=function(d){ const t=d.trim().split(/[\\s,]+/); return [parseFloat(t[t.length-2]),parseFloat(t[t.length-1])]; };
        const pres=function(a,b){ return Math.abs(a-b)<=1.5; };
        cartes.forEach(function(c,i){
          const op=q.perm[i], dessus=(op==='ge'||op==='gt'), pris=(op==='ge'||op==='le');
          const nom='dessin '+(i+1)+' ('+op+')';
          const niv=c.querySelector('.ing-niv');
          if(!niv) vus.push(nom+' : la droite horizontale manque');
          else if(!pres(parseFloat(niv.getAttribute('y1')), sy(q.k))) vus.push(nom+' : la droite n\\'est pas à la hauteur '+q.k);
          const rouges=c.querySelectorAll('.ing-rouge');
          if(rouges.length!==(dessus?1:2)){ vus.push(nom+' : '+rouges.length+' morceau(x) rouge(s) au lieu de '+(dessus?1:2)); return; }
          if(dessus){
            const d=rouges[0].getAttribute('d'), a=deb(d), z=fin(d);
            if(!pres(a[0],sx(x1))||!pres(z[0],sx(x2))) vus.push(nom+' : le rouge ne va pas de '+x1+' à '+x2);
            if(!pres(a[1],sy(q.k))||!pres(z[1],sy(q.k))) vus.push(nom+' : le rouge ne part pas de la droite ou n\\'y revient pas');
          } else {
            const dg=rouges[0].getAttribute('d'), dd=rouges[1].getAttribute('d');
            if(!pres(deb(dg)[0],sx(-3))||!pres(fin(dg)[0],sx(x1))) vus.push(nom+' : le morceau de gauche ne va pas de \\u22123 à '+x1);
            if(!pres(deb(dd)[0],sx(x2))||!pres(fin(dd)[0],sx(3))) vus.push(nom+' : le morceau de droite ne va pas de '+x2+' à 3');
          }
          const surCroisement=function(el){ const cx=parseFloat(el.getAttribute('cx')), cy=parseFloat(el.getAttribute('cy'));
            return pres(cy,sy(q.k)) && (pres(cx,sx(x1))||pres(cx,sx(x2))); };
          const pleins=Array.prototype.filter.call(c.querySelectorAll('.ing-pt'), surCroisement);
          const vides=Array.prototype.filter.call(c.querySelectorAll('.ing-vide'), surCroisement);
          if(pris && (pleins.length!==2 || vides.length!==0))
            vus.push(nom+' : les croisements devraient porter deux points PLEINS ('+pleins.length+' pleins, '+vides.length+' vides)');
          if(!pris && (vides.length!==2 || pleins.length!==0))
            vus.push(nom+' : les croisements devraient porter deux ronds VIDES ('+pleins.length+' pleins, '+vides.length+' vides)');
          if(!dessus){
            const bouts=Array.prototype.filter.call(c.querySelectorAll('.ing-pt'), function(el){
              const cx=parseFloat(el.getAttribute('cx'));
              return (pres(cx,sx(-3))&&pres(parseFloat(el.getAttribute('cy')),sy(q.pts[0])))
                  || (pres(cx,sx(3))&&pres(parseFloat(el.getAttribute('cy')),sy(q.pts[6]))); });
            if(bouts.length!==2) vus.push(nom+' : les bouts de la courbe ne portent pas leurs points pleins ('+bouts.length+'/2)');
          }
        });
      }
    }

    /* ---- 3. la correction, CLIQUÉE — la leçon des sommes : les contrôles
       lisaient le verdict, l'élève regarde la couleur. ---- */
    const poser=function(idx, vals){ test.locked=false; test.idx=idx; renderIngTest();
      Object.keys(vals).forEach(function(id){ const el=document.getElementById(id);
        if(el) el.value=(vals[id]==null?'':String(vals[id])); }); };
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
    const sch=String(q.perm.indexOf('ge'));
    const BON={'ing-sch':sch,'ing-d1':x1,'ing-p1':'oui','ing-d2':x2,'ing-p2':'oui',
               'ing-co1':'[','ing-b1':x1,'ing-b2':x2,'ing-cf1':']'};
    const IDS=Object.keys(BON);

    /* copie juste : tout vert, la note compte les 9 cases, la bonne carte s'entoure */
    poser(0,BON); let avant=test.score; checkIngAnswer();
    if(IDS.some(function(id){ return peint(id)!=='vert'; }))
      vus.push('la copie juste de \\u2265 n\\'est pas entièrement verte ('+IDS.map(peint).join(',')+')');
    if(test.score-avant!==9) vus.push('la copie juste de \\u2265 vaut '+(test.score-avant)+' au lieu de 9');
    const carteOk=document.querySelectorAll('#ingHost .ing-carte')[q.perm.indexOf('ge')];
    if(!carteOk || !/\\bok\\b/.test(carteOk.className)) vus.push('le bon dessin n\\'est pas entouré à la vérification');

    /* une seule case fausse : elle SEULE rougit */
    poser(0,Object.assign({},BON,{'ing-p2':'non'})); checkIngAnswer();
    if(peint('ing-p2')!=='rouge') vus.push('la case fausse est peinte en '+peint('ing-p2'));
    IDS.filter(function(id){ return id!=='ing-p2'; }).forEach(function(id){
      if(peint(id)!=='vert') vus.push('une case juste ('+id+') est peinte en '+peint(id)+' parce qu\\'une autre est fausse'); });

    /* en entraînement, une case VIDE ne rougit pas : correction en bleu, valeur écrite */
    poser(0,Object.assign({},BON,{'ing-b2':null})); checkIngAnswer();
    if(peint('ing-b2')==='rouge') vus.push('une case laissée vide rougit à la vérification');
    if(peint('ing-b2')!=='bleu') vus.push('une case vide ne reçoit pas la correction en bleu ('+peint('ing-b2')+')');
    if((document.getElementById('ing-b2').value||'')==='') vus.push('la correction en bleu n\\'écrit pas la valeur');

    /* ---- 4. l'ordre des deux morceaux est LIBRE : la copie de f(x) < k qui
       décrit le morceau de droite D'ABORD est juste, phrases ET solution. ---- */
    const schLt=String(q.perm.indexOf('lt'));
    const INVERSE={'ing-sch':schLt,
      'ing-d1':x2,'ing-p1':'non','ing-d2':3,'ing-p2':'oui',
      'ing-d3':-3,'ing-p3':'oui','ing-d4':x1,'ing-p4':'non',
      'ing-co1':']','ing-b1':x2,'ing-b2':3,'ing-cf1':']',
      'ing-co2':'[','ing-b3':-3,'ing-b4':x1,'ing-cf2':'['};
    poser(3,INVERSE); avant=test.score; checkIngAnswer();
    const rougesInv=Object.keys(INVERSE).filter(function(id){ return peint(id)!=='vert'; });
    if(rougesInv.length) vus.push('la copie qui décrit les morceaux dans l\\'autre ordre est comptée fausse : '+rougesInv.map(function(id){ return id+'='+peint(id); }).join(','));
    if(test.score-avant!==17) vus.push('la copie inversée de < vaut '+(test.score-avant)+' au lieu de 17');

    /* ...et le même morceau décrit DEUX fois n'est défendable qu'une fois */
    poser(3,{'ing-d1':-3,'ing-p1':'oui','ing-d3':-3,'ing-p3':'oui'});
    const res2=ingJuge(test.questions[3]);
    const okD=function(id){ return res2.subs.filter(function(s){ return s.id===id; })[0].ok; };
    if(okD('ing-d1')&&okD('ing-d3')) vus.push('les deux phrases décrivent le même morceau et sont comptées justes toutes les deux');

    /* ---- 5. le rappel de cours MONTRE les quatre dessins, et chaque légende
       dit exactement SON dessin — le pire défaut serait la légende « ≥ »
       posée sous le dessin des ronds vides : l'élève apprendrait l'inverse.
       On lit le signe dans la légende, on exige que le dessin le dise aussi
       (morceaux, points pleins, ronds vides), et que la solution écrite soit
       celle qu'ingPlain() calcule sur les données mêmes du dessin. ---- */
    const rap=document.createElement('div');
    rap.innerHTML=(typeof RAPPELS!=='undefined' && RAPPELS.ing) ? RAPPELS.ing : '';
    const figs=rap.querySelectorAll('.rap-ing-fig');
    if(figs.length!==4) vus.push('le rappel montre '+figs.length+' dessin(s) au lieu de 4');
    else if(typeof RAP_ING_EX==='undefined') vus.push('RAP_ING_EX introuvable : le contrôle ne peut pas relier les légendes aux dessins');
    else{
      const OPS={'≥':'ge','>':'gt','≤':'le','<':'lt'};
      const signesVus=[];
      Array.prototype.forEach.call(figs, function(f,i){
        const leg=(f.querySelector('figcaption')||{textContent:''}).textContent;
        const m=leg.match(/f\\s*\\(x\\)\\s*([≥>≤<])/);
        if(!m){ vus.push('dessin '+(i+1)+' du rappel : la légende ne dit pas son signe'); return; }
        const op=OPS[m[1]]; signesVus.push(op);
        const dessus=(op==='ge'||op==='gt'), pris=(op==='ge'||op==='le');
        const rouges=f.querySelectorAll('.ing-rouge').length;
        if(rouges!==(dessus?1:2)) vus.push('rappel, dessin « '+m[1]+' » : '+rouges+' morceau(x) rouge(s) au lieu de '+(dessus?1:2));
        const pleins=f.querySelectorAll('.ing-pt').length, vides=f.querySelectorAll('.ing-vide').length;
        const attP=(pris?2:0)+(dessus?0:2), attV=(pris?0:2);
        if(pleins!==attP||vides!==attV)
          vus.push('rappel, dessin « '+m[1]+' » : '+pleins+' plein(s) et '+vides+' vide(s) au lieu de '+attP+' et '+attV+' — la légende dit le contraire du dessin');
        if(!f.querySelector('.ing-niv')) vus.push('rappel, dessin « '+m[1]+' » : la droite horizontale manque');
        const S=ingPlain({pts:RAP_ING_EX.pts, k:RAP_ING_EX.k, op:op});
        if(leg.indexOf(S)<0) vus.push('rappel, dessin « '+m[1]+' » : la légende n\\'écrit pas la solution de SON dessin ('+S+')');
      });
      if(signesVus.slice().sort().join(',')!=='ge,gt,le,lt')
        vus.push('les quatre signes ne sont pas tous illustrés dans le rappel : '+signesVus.join(','));
    }

    /* ---- 6. en soutien : la frappe colore, la case vide ne reçoit RIEN, et
       une copie incomplète laisse corriger. ---- */
    currentMode='soutien';
    poser(2,{'ing-d1':-3,'ing-p1':'oui','ing-d2':x1+1});
    ingLive();
    if(peint('ing-d1')!=='vert') vus.push('en soutien, la case juste ne verdit pas pendant la frappe');
    if(peint('ing-d2')!=='rouge') vus.push('en soutien, la case fausse ne rougit pas pendant la frappe');
    if(peint('ing-b1')!=='rien') vus.push('en soutien, une case vide reçoit '+peint('ing-b1')+' pendant la frappe');
    checkIngAnswer();
    if(peint('ing-b1')!=='rien') vus.push('en soutien, la vérification pose '+peint('ing-b1')+' sur une case vide');
    if(test.locked) vus.push('en soutien, une copie incomplète verrouille la question au lieu de laisser corriger');
    currentMode='train';
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}

/* ---------- Étude complète de (ax+b)e^(−x) : l'énoncé et la correction lisent la même fonction ---------- */
/* {etude-exponentielle} (Terminale, thème 5). La question ne porte QUE a et b ;
   ecAns() recalcule tout — le zéro, la racine de f′, l'extremum, f(1), f′(1),
   la tangente — et l'énoncé comme la correction le lisent. Le contrôle refait
   ces calculs par sa PROPRE arithmétique sur les 14 couples possibles, exige
   que les « Démontre que » les disent, puis exerce le jugement local sur une
   copie canonique (la fiche : a = 1, b = −3, soit f(x) = (x − 3)e^(−x)), une
   copie à une faute, la paire de la tangente dans l'autre ordre, et les cases
   vides du soutien. Le clic complet — avec la feuille lue par l'IA — vit dans
   la chaîne séquentielle (etudeCompleteClique), le piège documenté de sb. */
/* ---- Une liste vide reçoit la correction en vert, et le message dit d'abord
   les cases manquantes -------------------------------------------------------
   Signalé par Turquet sur une capture (août 2026) : « 6 cases justes sur 7 »
   sur {intervalles-inegalite} avec toutes les réponses visiblement justes. La
   septième était restée VIDE : corrChoix l'avait remplie avec la classe
   « sol » — qu'aucune règle CSS ne dessinait sur .itv-sel, la leçon déjà
   apprise par .plc-sel.sol et .lv-in.sol, revenue sur une troisième famille de
   listes — et le message rouge déroulait la solution entière comme si l'élève
   s'était trompé.
   Quatre bords, et n'en tenir qu'un ne tient rien : la règle CSS existe ; une
   case vide seule donne « il te manquait 1 case … en vert » SANS dérouler
   l'explication (elle donnerait tort à une lecture juste) ; une vraie faute
   garde l'explication ; les deux ensemble donnent les deux. Puis le même
   geste sur {intervalles} et {inequation-graphique}, qui partagent corrChoix
   et .itv-sel : une famille corrigée à moitié ne serait pas corrigée. */
function correctionBleueListes(w, P){
  const present = evaluer(w, "typeof startItq==='function' && typeof itqCases==='function'");
  if(!present.ok || !present.valeur){
    ignorer('une liste vide reçoit la correction en vert, et le message dit d\'abord les cases manquantes',
      'ce niveau n\'a pas les exercices d\'intervalles à listes');
    return;
  }
  verifierEval(w, 'une liste vide reçoit la correction en vert, et le message dit d\'abord les cases manquantes', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;

    /* ---- 1. la règle CSS : sans elle, la classe « sol » ne dessine rien ---- */
    const css=Array.prototype.map.call(document.querySelectorAll('style'),function(st){ return st.textContent; }).join('\\n');
    if(!/\\.itv-sel\\.sol\\s*\\{[^}]*dashed/.test(css))
      vus.push('aucune règle .itv-sel.sol en pointillés : corrChoix pose la classe, rien ne la dessine');

    /* ---- 2. {intervalles-inegalite}, sur une question FIXE ---- */
    function poseItq(sauf, faux){
      startItq(); clearTimeout(test.fbTimer);
      const q={bg:0,bd:null,fg:true,fd:false,
        cands:[{bg:0,bd:null,fg:true,fd:false},{bg:0,bd:null,fg:false,fd:false},
               {bg:null,bd:0,fg:false,fd:true},{bg:null,bd:0,fg:false,fd:false}],bon:0};
      test.questions[test.idx]=q; renderItqTest();
      itqCases(q).forEach(function(c){ const sel=document.getElementById(c.id); if(!sel) return;
        if(sauf&&sauf.indexOf(c.id)>=0) return;
        sel.value=(faux&&faux[c.id]!==undefined)?faux[c.id]:c.bon; });
      checkItqAnswer();
      return document.getElementById('itqFeedback').textContent;
    }
    /* a. une case vide, tout le reste juste */
    let fb=poseItq(['itq-og'], null);
    const og=document.getElementById('itq-og');
    if(!og || !og.classList.contains('sol')) vus.push('la case vide ne porte pas la classe « sol » après la vérification');
    if(og && og.value!=='ferme') vus.push('la case vide n\\'a pas reçu la bonne réponse : '+(og?og.value:'(absente)'));
    if(fb.indexOf('Il te manquait 1 case')!==0) vus.push('le message ne commence pas par « Il te manquait 1 case » : '+fb.slice(0,60));
    if(fb.indexOf('vert')<0) vus.push('le message ne dit pas que la correction est en vert');
    if(fb.indexOf('Le reste est juste')<0) vus.push('le message ne dit pas que le reste est juste');
    if(fb.indexOf('se lit')>=0) vus.push('le message déroule l\\'explication alors qu\\'aucune case n\\'est fausse — il donne tort à une lecture juste');
    /* b. une vraie faute, aucune case vide : l'explication reste */
    fb=poseItq(null, {'itq-og':'ouvert'});
    if(fb.indexOf('se lit')<0) vus.push('sur une vraie faute, l\\'explication a disparu : '+fb.slice(0,60));
    if(fb.indexOf('manquait')>=0) vus.push('« il te manquait » s\\'affiche alors qu\\'aucune case n\\'est vide');
    /* c. une faute ET une case vide : les deux moitiés du message */
    fb=poseItq(['itq-og'], {'itq-od':'ferme'});
    if(fb.indexOf('Il te manquait 1 case')!==0) vus.push('faute + case vide : le message ne commence pas par la case manquante : '+fb.slice(0,60));
    if(fb.indexOf('se lit')<0) vus.push('faute + case vide : l\\'explication de la faute a disparu');
    /* d. tout juste : bravo, sans « manquait » */
    fb=poseItq(null, null);
    if(fb.indexOf('manquait')>=0) vus.push('« il te manquait » s\\'affiche sur une copie entièrement juste');

    /* ---- 3. le même geste sur {intervalles} et {inequation-graphique} ---- */
    if(typeof startItv!=='function' || typeof itvCases!=='function') vus.push('{intervalles} introuvable');
    else {
      startItv(); clearTimeout(test.fbTimer);
      const q=test.questions[test.idx], cs=itvCases(q), dernier=cs[cs.length-1];
      cs.forEach(function(c,i){ const sel=document.getElementById(c.id); if(sel && i<cs.length-1) sel.value=c.bon; });
      checkItvAnswer();
      const sel=document.getElementById(dernier.id);
      if(!sel || !sel.classList.contains('sol')) vus.push('{intervalles} : la case vide ne porte pas « sol »');
      const f2=document.getElementById('itvFeedback').textContent;
      if(f2.indexOf('Il te manquait 1 case')!==0) vus.push('{intervalles} : le message ne dit pas la case manquante : '+f2.slice(0,60));
    }
    if(typeof startIng!=='function' || typeof ingCases!=='function') vus.push('{inequation-graphique} introuvable');
    else {
      startIng(); clearTimeout(test.fbTimer);
      const q=test.questions[test.idx], cs=ingCases(q), dernier=cs[cs.length-1];
      cs.forEach(function(c,i){ const sel=document.getElementById(c.id); if(sel && i<cs.length-1) sel.value=c.bon; });
      checkIngAnswer();
      const sel=document.getElementById(dernier.id);
      if(!sel || !sel.classList.contains('sol')) vus.push('{inequation-graphique} : la case vide ne porte pas « sol »');
      const f3=document.getElementById('ingFeedback').textContent;
      if(f3.indexOf('Il te manquait 1 case')!==0) vus.push('{inequation-graphique} : le message ne dit pas la case manquante : '+f3.slice(0,60));
    }
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}

function etudeExponentielle(w, P){
  const present = evaluer(w, "typeof startEC==='function' && typeof ecJugeLocal==='function'");
  if(!present.ok || !present.valeur){
    ignorer('l\'étude complète de (ax+b)e^(−x) : l\'énoncé et la correction lisent la même fonction',
      'ce niveau n\'a pas l\'exercice de l\'étude complète');
    return;
  }
  verifierEval(w, 'l\'étude complète de (ax+b)e^(−x) : l\'énoncé et la correction lisent la même fonction', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='etude-exponentielle';

    /* ---- 1. le tirage : a = ±1, b entier de −4 à 4, jamais 0 ni −1, et
       RIEN d'autre dans la question ---- */
    for(let t=0;t<200 && !vus.length;t++){
      const q=genECCase();
      if(q.a!==1 && q.a!==-1) vus.push('a vaut '+q.a+' au lieu de ±1');
      if(!Number.isInteger(q.b)||q.b<-4||q.b>4) vus.push('b hors bornes : '+q.b);
      if(q.b===0) vus.push('b = 0 autorisé : f\\'(1) = 0, la tangente serait horizontale');
      if(q.b===-1) vus.push('b = −1 autorisé : f(1) = 0, le point de tangence tomberait sur l\\'axe');
      const cles=Object.keys(q).filter(function(k){ return k!=='a'&&k!=='b'; });
      if(cles.length) vus.push('la question range autre chose que a et b : '+cles.join(','));
    }

    /* ---- 2. ecAns contre une SECONDE arithmétique, sur les 14 couples ---- */
    [1,-1].forEach(function(a){ [-4,-3,-2,1,2,3,4].forEach(function(b){
      const A=ecAns({a:a,b:b});
      const att={p:a, q:a*b, x0:-b, r:1-b, dp:-a, dq:a-a*b, ext:(a===1?'max':'min'),
                 mE:b-1, f1:a*(1+b), d1:-a*b, tM:-a*b, tP:a*(1+2*b)};
      Object.keys(att).forEach(function(k){
        if(A[k]!==att[k]) vus.push('ecAns.'+k+' vaut '+A[k]+' au lieu de '+att[k]+' pour a='+a+', b='+b); });
    }); });

    /* ---- 3. l'énoncé dit ce que la correction attend — cas de la fiche ---- */
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'ec', questions:[{a:1,b:-3}], idx:0, score:0, answers:[], locked:false, startTime:Date.now()});
    renderEC();
    const txt=function(){ return (document.getElementById('ecForm').textContent||'').replace(/\\s+/g,' '); };
    if(txt().indexOf('(−x + 4)')<0) vus.push('l\\'énoncé de la dérivée ne dit pas (−x + 4) : '+txt().slice(0,80));
    /* « maximum » seul ne prouve rien : le sélecteur min/max porte toujours
       les deux mots dans son textContent — on vise le TITRE de la partie d */
    if(txt().indexOf('ce maximum vaut')<0) vus.push('a = 1 : le titre d doit annoncer « ce maximum vaut »');
    if((document.getElementById('ecPrompt').textContent||'').indexOf('− 3')<0) vus.push('l\\'énoncé n\\'écrit pas la fonction (x − 3)e^(−x)');
    test.questions=[{a:-1,b:2}]; renderEC();
    if(txt().indexOf('ce minimum vaut')<0) vus.push('a = −1 : le titre d doit annoncer « ce minimum vaut »');

    /* ---- 4. le jugement local, exercé sur les vraies cases ---- */
    test.questions=[{a:1,b:-3}];
    const BON={'ec-a1':0,'ec-a2':0,'ec-aexp':'jamais','ec-a3':0,'ec-a4':3,'ec-a5':3,'ec-a6':0,'ec-a7':0,'ec-a8':0,'ec-a9':0,'ec-a10':-3,'ec-a11':0,'ec-a12':-3,'ef-r0':4,'ef-l0s0':'+','ef-l0s1':'\u2212','ef-l1s0':'+','ef-l1s1':'+','ef-l2s0':'+','ef-l2s1':'\u2212','ef-a0':'up','ef-a1':'down','ef-e0t':'max','ef-e0x':4,'ec-d1':4,'ec-d2':4,'ec-d3':4,'ec-d4':1,'ec-d5':-4,'ec-e1':1,'ec-e2':1,'ec-e3':-2,'ec-f1':1,'ec-f2':1,'ec-f3':3,'ec-g1':1,'ec-g2':1,'ec-g3':1,'ec-g4':3,'ec-g5':1,'ec-g6':-2,'ec-g7':3,'ec-g8':-3,'ec-g9':-2,'ec-g10':3,'ec-g11':-5};
    const IDS=Object.keys(BON);
    const poser=function(vals){ test.locked=false; renderEC();
      Object.keys(vals).forEach(function(id){ const el=document.getElementById(id);
        if(el) el.value=(vals[id]==null?'':String(vals[id])); }); };
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':'rien'); };

    /* copie canonique : 46 cases justes, tout vert */
    poser(BON); let r=ecJugeLocal(test.questions[0], false);
    if(!r.allOk || r.nOk!==46 || r.nTot!==46)
      vus.push('la copie canonique vaut '+r.nOk+'/'+r.nTot+' au lieu de 46/46 — rouges : '
        +IDS.filter(function(id){ return peint(id)!=='vert'; }).slice(0,5).join(','));

    /* une seule case fausse : elle SEULE rougit */
    poser(Object.assign({},BON,{'ec-f3':99})); r=ecJugeLocal(test.questions[0], false);
    if(peint('ec-f3')!=='rouge') vus.push('la case fausse est peinte en '+peint('ec-f3'));
    IDS.filter(function(id){ return id!=='ec-f3'; }).forEach(function(id){
      if(peint(id)!=='vert') vus.push('une case juste ('+id+') est peinte en '+peint(id)+' parce qu\\'une autre est fausse'); });
    if(r.nOk!==45) vus.push('une faute : '+r.nOk+'/46 au lieu de 45/46');

    /* les deux constantes de la tangente, dans l'autre ordre : copie juste */
    poser(Object.assign({},BON,{'ec-g8':BON['ec-g9'],'ec-g9':BON['ec-g8']}));
    r=ecJugeLocal(test.questions[0], false);
    if(!r.allOk) vus.push('les deux constantes de la tangente écrites dans l\\'autre ordre sont comptées fausses ('
      +peint('ec-g8')+','+peint('ec-g9')+')');

    /* en soutien : la case vide ne reçoit RIEN, la juste verdit, la fausse rougit */
    currentMode='soutien';
    poser({'ec-a1':0,'ec-f3':99});
    ecJugeLocal(test.questions[0], false);
    if(peint('ec-a1')!=='vert') vus.push('en soutien, la case juste ne verdit pas');
    if(peint('ec-f3')!=='rouge') vus.push('en soutien, la case fausse ne rougit pas');
    if(peint('ec-e1')!=='rien') vus.push('en soutien, une case vide reçoit '+peint('ec-e1'));
    currentMode='train';
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}

function imageNombre(w, P){
  const present = evaluer(w, "typeof startImg==='function' && typeof imgCheck==='function'");
  if(!present.ok || !present.valeur){
    ignorer('l\'image d\'un nombre : la réponse est lue dans la courbe, et le trait montre la méthode',
      'ce niveau n\'a pas l\'exercice de l\'image');
    return;
  }
  verifierEval(w, 'l\'image d\'un nombre : la réponse est lue dans la courbe, et le trait montre la méthode', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='image-nombre';

    /* ---- 1. le tirage : jamais 0, jamais d'image nulle, quatre abscisses
       distinctes, et RIEN d'autre que la courbe et l'abscisse dans la
       question. ---- */
    for(let t=0;t<300 && !vus.length;t++){
      startImg(); clearTimeout(test.fbTimer);
      if(test.questions.length!==4){ vus.push(test.questions.length+' questions au lieu de 4'); break; }
      const xs=test.questions.map(function(q){ return q.x0; });
      if(xs.some(function(x){ return x===0; })) vus.push('une question demande l\\'image de 0 — le trait vertical n\\'y a rien à tracer');
      if(xs.some(function(x){ return !Number.isInteger(x)||x<-3||x>3; })) vus.push('abscisse hors de la droite graduée : '+xs.join(','));
      if(new Set(xs).size!==4) vus.push('deux questions demandent la même abscisse : '+xs.join(','));
      test.questions.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return k!=='pts'&&k!=='x0'; });
        if(cles.length) vus.push('la question range autre chose que la courbe et l\\'abscisse : '+cles.join(','));
        if(q.pts.length!==7 || q.pts.some(function(y){ return !Number.isInteger(y)||y<-3||y>3; })) vus.push('courbe hors du quadrillage');
        if(q.pts[q.x0+3]===0) vus.push('l\\'image demandée vaut 0 : le trait vertical serait invisible');
      });
    }

    /* ---- 2. la correction, exercée sur les vraies cases. La question est
       CHOISIE (la fiche des variations) : x0 positif, image négative — le
       signe moins de l'écran passe par numFmt. ---- */
    startImg(); clearTimeout(test.fbTimer);
    test.questions[0]={pts:[-3,-1,1,3,1,-1,-3], x0:2};
    const q=test.questions[0], y0=q.pts[q.x0+3];
    const CASES=['img-c','img-fx','img-fv','img-tx','img-tv'];
    const BON={'img-c':y0,'img-fx':q.x0,'img-fv':y0,'img-tx':q.x0,'img-tv':y0};
    const poser=function(vals){ test.locked=false; test.idx=0; renderImg();
      CASES.forEach(function(id){ const el=document.getElementById(id);
        if(el){ if(vals[id]===undefined||vals[id]===null) el.value=''; else el.value=String(vals[id]); } }); };
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };

    /* l'énoncé nomme l'abscisse demandée, et le trait ATTEND la validation */
    poser({});
    if(document.getElementById('imgInstr').textContent.indexOf(numFmt(q.x0))<0)
      vus.push('l\\'énoncé ne nomme pas l\\'abscisse demandée');
    if(document.querySelector('#imgGraph .img-trait'))
      vus.push('le trait est déjà dessiné avant la validation — il donne la hauteur qu\\'on demande de lire');

    /* copie juste : cinq cases vertes, la note les compte toutes les cinq */
    poser(BON); const avant=test.score; submitImg(); clearTimeout(test.fbTimer);
    if(CASES.some(function(id){ return peint(id)!=='vert'; }))
      vus.push('la copie juste n\\'est pas entièrement verte ('+CASES.map(peint).join(',')+')');
    if(test.score-avant!==5) vus.push('la copie juste vaut '+(test.score-avant)+' au lieu de 5');

    /* ...et le trait est dessiné, DE la bonne abscisse À la bonne hauteur,
       lu contre les graduations du dessin même. */
    const svg=document.getElementById('imgGraph');
    const traits=svg.querySelectorAll('.img-trait');
    if(traits.length<2){ vus.push('le trait de la méthode n\\'est pas dessiné à la validation'); }
    else{
      const num=function(el,a){ return parseFloat(el.getAttribute(a)); };
      const vert=Array.prototype.find.call(traits,function(l){ return Math.abs(num(l,'x1')-num(l,'x2'))<0.5; });
      const horz=Array.prototype.find.call(traits,function(l){ return Math.abs(num(l,'y1')-num(l,'y2'))<0.5 && Math.abs(num(l,'x1')-num(l,'x2'))>=0.5; });
      if(!vert||!horz) vus.push('il manque le trait vertical ou le trait horizontal');
      else{
        const lab=function(txt,horiz){
          const ts=svg.querySelectorAll('text.lv-ax');
          for(let i=0;i<ts.length;i++){ if(ts[i].textContent===txt &&
            (horiz ? ts[i].getAttribute('text-anchor')==='middle' : ts[i].getAttribute('text-anchor')==='end')) return ts[i]; }
          return null; };
        const lx=lab(numFmt(q.x0),true), ly=lab(numFmt(y0),false);
        if(!lx) vus.push('aucune graduation ne porte '+numFmt(q.x0));
        else if(Math.abs(num(vert,'x1')-parseFloat(lx.getAttribute('x')))>1)
          vus.push('le trait vertical ne part pas de la graduation '+numFmt(q.x0));
        if(!ly) vus.push('aucune graduation ne porte '+numFmt(y0));
        else if(Math.abs(num(horz,'y1')-(parseFloat(ly.getAttribute('y'))-3.5))>1)
          vus.push('le trait horizontal n\\'arrive pas à la hauteur '+numFmt(y0));
        const pt=svg.querySelector('.img-pt');
        if(!pt) vus.push('le point d\\'arrivée sur la courbe manque');
        else if(Math.abs(parseFloat(pt.getAttribute('cx'))-num(vert,'x1'))>1
             || Math.abs(parseFloat(pt.getAttribute('cy'))-num(horz,'y1'))>1)
          vus.push('le point d\\'arrivée n\\'est pas au bout des deux traits');
      }
    }

    /* une seule case fausse : elle SEULE rougit */
    poser(Object.assign({},BON,{'img-fv':y0+1})); submitImg(); clearTimeout(test.fbTimer);
    if(peint('img-fv')!=='rouge') vus.push('la case fausse est peinte en '+peint('img-fv'));
    ['img-c','img-fx','img-tx','img-tv'].forEach(function(id){
      if(peint(id)!=='vert') vus.push('une case juste ('+id+') est peinte en '+peint(id)+' parce qu\\'une autre est fausse'); });

    /* en entraînement, une case VIDE ne rougit pas : la correction en bleu */
    poser(Object.assign({},BON,{'img-tv':null})); submitImg(); clearTimeout(test.fbTimer);
    if(peint('img-tv')==='rouge') vus.push('une case laissée vide rougit à la vérification');
    if(peint('img-tv')!=='bleu') vus.push('une case vide ne reçoit pas la correction en bleu ('+peint('img-tv')+')');
    if((document.getElementById('img-tv').value||'')==='') vus.push('la correction en bleu n\\'écrit pas la valeur');

    /* en soutien : la frappe colore, la case vide ne reçoit RIEN, et la
       vérification d'une copie incomplète laisse corriger */
    currentMode='soutien';
    poser(Object.assign({},BON,{'img-tv':null,'img-fx':q.x0+1}));
    imgLive();
    if(peint('img-tv')!=='rien') vus.push('en soutien, la case vide reçoit '+peint('img-tv')+' pendant la frappe');
    if(peint('img-fx')!=='rouge') vus.push('en soutien, la case fausse ne rougit pas pendant la frappe');
    if(peint('img-c')!=='vert') vus.push('en soutien, la case juste ne verdit pas pendant la frappe');
    submitImg();
    if(peint('img-tv')!=='rien') vus.push('en soutien, la vérification pose '+peint('img-tv')+' sur une case vide');
    if(test.locked) vus.push('en soutien, une copie incomplète verrouille la question au lieu de laisser corriger');
    currentMode='train';
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}

/* ---------- Tangente à (ax+b)e^x : l'énoncé et la correction lisent la même fonction ---------- */
/* {tangente-exp} (Terminale, thème 5). La question ne porte QUE a et b ; tout le
   reste — f(0), f'(0), f(1), f'(1), les deux tangentes — est recalculé par
   txAns(), que l'énoncé ET la correction lisent : le contrôle recalcule ces
   valeurs par sa PROPRE arithmétique et exige que les phrases « Démontre
   que … » les disent, puis que les cases remplies avec elles passent toutes
   au vert. Les pentes ne sont jamais nulles, les deux constantes de la ligne
   développée s'acceptent dans les deux ordres, une case vide ne rougit pas
   en soutien, et le cas b = 0 retire la case du « + 0 » au lieu de l'exiger. */
function tangenteExp(w, P){
  const present = evaluer(w, "typeof startTX==='function' && typeof genTXCase==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la tangente à (ax+b)e^x : l\'énoncé et la correction lisent la même fonction',
      'ce niveau n\'a pas l\'exercice de la tangente à (ax+b)e^x');
    return;
  }
  verifierEval(w, 'la tangente à (ax+b)e^x : l\'énoncé et la correction lisent la même fonction', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='tangente-exp'; currentDM=null;

    /* ---- 1. le tirage : a jamais nul, pentes jamais nulles, trois fonctions
       distinctes, et RIEN d'autre que a et b dans la question ---- */
    if(TX_N!==3) vus.push(TX_N+' questions au lieu de 3');
    for(let t=0;t<400 && !vus.length;t++){
      const qs=[]; for(let i=0;i<3;i++) qs.push(genTXCase(qs));
      qs.forEach(function(q){
        if(!Number.isInteger(q.a)||q.a===0||q.a<-2||q.a>2) vus.push('a hors bornes ou nul : '+q.a);
        if(!Number.isInteger(q.b)||q.b<-2||q.b>2) vus.push('b hors bornes : '+q.b);
        if(q.a+q.b===0) vus.push('pente nulle en 0 (a+b=0) : la ligne « y = …x » n\\'a plus de terme en x');
        if(2*q.a+q.b===0) vus.push('pente nulle en 1 (2a+b=0)');
        const cles=Object.keys(q).filter(function(k){ return k!=='a'&&k!=='b'; });
        if(cles.length) vus.push('la question range autre chose que a et b : '+cles.join(','));
      });
      if(new Set(qs.map(function(q){ return q.a+'/'+q.b; })).size!==3) vus.push('deux questions posent la même fonction');
    }

    /* ---- 2. l'énoncé dit ce que la correction attend — recalculé ICI, par
       une seconde arithmétique. Cas choisi : f(x) = (2x − 1)e^x. ---- */
    test.kind='tx'; test.questions=[{a:2,b:-1}]; test.idx=0; test.score=0; test.answers=[]; test.locked=false;
    const A={ f0:-1, d0:1, f1:1, d1:3, t1a:-3, t1b:1, b1:-2 };
    renderTX();
    const txt=function(){ return (document.getElementById('txForm').textContent||'').replace(/\\s+/g,' '); };
    if(txt().indexOf('y = x − 1')<0) vus.push('l\\'énoncé de la tangente en 0 ne dit pas « y = x − 1 » : '+txt().slice(0,80));
    if(txt().indexOf('3e x − 2e')<0) vus.push('l\\'énoncé de la tangente en 1 ne dit pas « y = 3e x − 2e »');
    if(txt().indexOf('f(1) = e')<0) vus.push('l\\'énoncé de f(1) n\\'écrit pas « e » quand le coefficient vaut 1');

    /* AVANT chaque calcul, le rappel de l'expression (demande de Turquet,
       août 2026) : « Avec f(x) = …, on a : » — quatre lignes, l'expression de
       f pour a et d, celle de f ′ pour b et e, écrites avec les nombres MÊMES
       de la fonction tirée. */
    const nAvec=(txt().match(/Avec f/g)||[]).length;
    if(nAvec!==4) vus.push(nAvec+' rappels « Avec f(x) = …, on a : » au lieu de 4');
    if(txt().indexOf('Avec f(x) = (2x − 1) ex, on a')<0) vus.push('le rappel de f(x) manque ou ne dit pas la fonction : '+txt().slice(0,60));
    if(txt().indexOf('Avec f ′(x) = (2x + 1) ex, on a')<0) vus.push('le rappel de f ′(x) manque ou ne dit pas la dérivée');

    const IDS=['tx-a-x','tx-a-e','tx-a-r','tx-b-x','tx-b-e','tx-b-r',
      'tx-c-a1','tx-c-a2','tx-c-a3','tx-c-m1','tx-c-a4','tx-c-f1','tx-c-m2','tx-c-b2',
      'tx-d-x','tx-d-e','tx-d-r','tx-e-x','tx-e-e','tx-e-r',
      'tx-f-a1','tx-f-a2','tx-f-a3','tx-f-m1','tx-f-a4','tx-f-f1','tx-f-m2','tx-f-t1','tx-f-t2','tx-f-m3','tx-f-b3'];
    const BON={ 'tx-a-x':0,'tx-a-e':0,'tx-a-r':A.f0, 'tx-b-x':0,'tx-b-e':0,'tx-b-r':A.d0,
      'tx-c-a1':0,'tx-c-a2':0,'tx-c-a3':0,'tx-c-m1':A.d0,'tx-c-a4':0,'tx-c-f1':A.f0,'tx-c-m2':A.d0,'tx-c-b2':A.f0,
      'tx-d-x':1,'tx-d-e':1,'tx-d-r':A.f1, 'tx-e-x':1,'tx-e-e':1,'tx-e-r':A.d1,
      'tx-f-a1':1,'tx-f-a2':1,'tx-f-a3':1,'tx-f-m1':A.d1,'tx-f-a4':1,'tx-f-f1':A.f1,
      'tx-f-m2':A.d1,'tx-f-t1':A.t1a,'tx-f-t2':A.t1b,'tx-f-m3':A.d1,'tx-f-b3':A.b1 };
    const poser=function(vals){ test.locked=false; renderTX();
      IDS.forEach(function(id){ const el=document.getElementById(id);
        if(el){ const v=vals[id]; el.value=(v===undefined||v===null)?'':String(v); } }); };
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':'rien'); };

    /* la copie juste passe entière au vert, et vaut le point */
    poser(BON); checkTX();
    const pasVerts=IDS.filter(function(id){ return peint(id)!=='vert'; });
    if(pasVerts.length) vus.push('la copie juste n\\'est pas entièrement verte : '+pasVerts.slice(0,3).join(', '));
    if(test.score!==1) vus.push('la copie juste vaut '+test.score+' au lieu de 1');
    if(!test.answers.length || !test.answers[test.answers.length-1].correct) vus.push('la copie juste est comptée fausse');

    /* les deux constantes de la ligne développée, dans l'AUTRE ordre */
    const B2=Object.assign({},BON,{'tx-f-t1':A.t1b,'tx-f-t2':A.t1a});
    test.score=0; poser(B2); checkTX();
    if(test.score!==1) vus.push('les deux constantes de la ligne développée ne s\\'acceptent pas dans l\\'autre ordre');

    /* en entraînement, une copie fausse révèle les bonnes réponses en vert */
    poser(Object.assign({},BON,{'tx-f-b3':A.b1+1})); checkTX();
    if(!/\\bsol\\b/.test((document.getElementById('tx-f-b3')||{}).className||'')) vus.push('la case fausse révélée ne porte pas « sol » — la correction verte ('+peint('tx-f-b3')+')');
    if(String(document.getElementById('tx-f-b3').value)!==numFmt(A.b1)) vus.push('la valeur révélée n\\'est pas la bonne');
    if(!test.locked) vus.push('la question fausse ne se verrouille pas en entraînement');

    /* la copie entièrement vide ne rougit nulle part */
    poser({}); checkTX();
    const rouges=IDS.filter(function(id){ return peint(id)==='rouge'; });
    if(rouges.length) vus.push('la copie vide rougit : '+rouges.slice(0,3).join(', '));
    if(test.locked) vus.push('la copie vide verrouille la question');

    /* en soutien : la case fausse rougit SEULE, la case vide ne reçoit rien,
       et la vérification laisse corriger */
    currentMode='soutien';
    poser(Object.assign({},BON,{'tx-e-r':A.d1+1,'tx-d-r':null})); checkTX();
    if(peint('tx-e-r')!=='rouge') vus.push('en soutien, la case fausse est peinte en '+peint('tx-e-r'));
    if(peint('tx-d-r')!=='rien') vus.push('en soutien, la case VIDE est peinte en '+peint('tx-d-r'));
    if(peint('tx-a-r')!=='vert'||peint('tx-f-m3')!=='vert') vus.push('en soutien, une case juste ne verdit pas');
    if(test.locked) vus.push('en soutien, une copie à corriger se verrouille');
    currentMode='train';

    /* ---- 3. b = 0 : la ligne réduite en 0 n'a pas de case « + 0 » ---- */
    test.questions=[{a:2,b:0}]; test.idx=0; test.score=0; test.answers=[]; test.locked=false;
    renderTX();
    if(document.getElementById('tx-c-b2')) vus.push('avec b = 0, la ligne réduite exige une case « + 0 »');
    if(txt().indexOf('y = 2x')<0) vus.push('avec b = 0, l\\'énoncé de la tangente en 0 ne dit pas « y = 2x »');
    const B0={ 'tx-a-x':0,'tx-a-e':0,'tx-a-r':0, 'tx-b-x':0,'tx-b-e':0,'tx-b-r':2,
      'tx-c-a1':0,'tx-c-a2':0,'tx-c-a3':0,'tx-c-m1':2,'tx-c-a4':0,'tx-c-f1':0,'tx-c-m2':2,
      'tx-d-x':1,'tx-d-e':1,'tx-d-r':2, 'tx-e-x':1,'tx-e-e':1,'tx-e-r':4,
      'tx-f-a1':1,'tx-f-a2':1,'tx-f-a3':1,'tx-f-m1':4,'tx-f-a4':1,'tx-f-f1':2,
      'tx-f-m2':4,'tx-f-t1':-4,'tx-f-t2':2,'tx-f-m3':4,'tx-f-b3':-2 };
    poser(B0); checkTX();
    if(test.score!==1) vus.push('avec b = 0, la copie juste vaut '+test.score+' au lieu de 1');

    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}

/* ---------- Les antécédents d'un nombre : la ligne de niveau ne coupe qu'aux graduations ---------- */
/* {antecedent-nombre} (Seconde, 2.3), l'inverse de {image-nombre}. Le risque
   propre à cet exercice est la hauteur ILLISIBLE : une hauteur strictement
   comprise entre deux valeurs voisines de la courbe est traversée par la ligne
   de niveau ENTRE deux graduations — l'élève voit un croisement qu'il ne peut
   pas lire, et sa réponse juste est comptée fausse. Le contrôle recompte les
   traversées par sa PROPRE arithmétique sur chaque tirage. L'ordre des
   antécédents est LIBRE (règle des paires), le même antécédent posé deux fois
   ne compte qu'une fois, le trait se mesure contre les GRADUATIONS du dessin,
   et la séance montre toujours les deux visages — une hauteur à UN antécédent,
   une à PLUSIEURS. */
/* ---------- La question vérifiée attend le bouton, elle ne s'enfuit plus ----
   Demande de Turquet (août 2026) : « quand on a vérifié une question, il n'y
   a pas de bouton suivant ». Les trois exercices de courbes (2.1, 2.2, 2.3)
   avançaient TOUT SEULS, 0,9 s après une copie juste et 2,4 s après une
   fausse — le temps de rien : la correction et le trait de la méthode
   s'effaçaient sous les yeux de l'élève. Le bouton « Valider » devient
   « Question suivante » (« Voir mes résultats » sur la dernière), le rendu le
   réarme, et plus aucun minuteur ne tourne. */
function boutonSuivantCourbes(w, P){
  const present = evaluer(w, "typeof lvBoutonSuivant==='function' && typeof startImg==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la question vérifiée attend le bouton « Question suivante »',
      'ce niveau n\'a pas les exercices de courbes de la Seconde');
    return;
  }
  verifierEval(w, 'la question vérifiée attend le bouton « Question suivante »', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    [['2.1', startLV, submitLV, renderLV, 'lvValidate'],
     ['2.2', startImg, submitImg, renderImg, 'imgValidate'],
     ['2.3', startAnt, submitAnt, renderAnt, 'antValidate']].forEach(function(e){
      const nom=e[0], demarrer=e[1], soumettre=e[2], rendre=e[3], id=e[4];
      demarrer();
      const b=document.getElementById(id);
      if(!b){ vus.push(nom+' : pas de bouton #'+id); return; }
      if(b.textContent!=='Valider') vus.push(nom+' : le bouton du départ dit « '+b.textContent+' »');
      soumettre();
      if(test.fbTimer) vus.push(nom+' : un minuteur d\\'avance automatique tourne encore — l\\'écran va s\\'enfuir');
      if(b.disabled) vus.push(nom+' : le bouton est éteint après la vérification — aucun chemin vers la suite');
      if(b.textContent!=='Question suivante') vus.push(nom+' : après la vérification le bouton dit « '+b.textContent+' » au lieu de « Question suivante »');
      const avant=test.idx;
      if(typeof b.onclick==='function') b.onclick(); else { vus.push(nom+' : le bouton n\\'a pas de geste'); return; }
      if(test.idx!==avant+1){ vus.push(nom+' : « Question suivante » n\\'avance pas (idx '+test.idx+')'); return; }
      if(b.textContent!=='Valider') vus.push(nom+' : le rendu ne réarme pas le bouton — un clic de plus sauterait une question');
      /* la DERNIÈRE question propose les résultats, jamais une question fantôme */
      test.idx=test.questions.length-1; test.locked=false; rendre();
      soumettre();
      if(b.textContent!=='Voir mes résultats') vus.push(nom+' : sur la dernière question le bouton dit « '+b.textContent+' »');
    });
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}
function antecedentNombre(w, P){
  const present = evaluer(w, "typeof startAnt==='function' && typeof antCheck==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les antécédents d\'un nombre : la ligne de niveau ne coupe la courbe qu\'aux graduations',
      'ce niveau n\'a pas l\'exercice des antécédents');
    return;
  }
  verifierEval(w, 'les antécédents d\'un nombre : la ligne de niveau ne coupe la courbe qu\'aux graduations', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='antecedent-nombre';

    /* ---- 1. le tirage : hauteur lisible, 1 à 3 antécédents, les deux
       visages dans chaque séance, et RIEN d'autre que la courbe et la
       hauteur dans la question ---- */
    for(let t=0;t<200 && !vus.length;t++){
      const qs=antTirage();
      if(qs.length!==4){ vus.push(qs.length+' questions au lieu de 4'); break; }
      const ns=[];
      qs.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return k!=='pts'&&k!=='y0'; });
        if(cles.length) vus.push('la question range autre chose que la courbe et la hauteur : '+cles.join(','));
        if(q.pts.length!==7 || q.pts.some(function(y){ return !Number.isInteger(y)||y<-3||y>3; })) vus.push('courbe hors du quadrillage');
        if(!Number.isInteger(q.y0)||q.y0<-3||q.y0>3) vus.push('hauteur hors du quadrillage : '+q.y0);
        /* la traversée, recomptée ici */
        for(let i=0;i<6;i++){ const lo=Math.min(q.pts[i],q.pts[i+1]), hi=Math.max(q.pts[i],q.pts[i+1]);
          if(q.y0>lo && q.y0<hi) vus.push('la ligne de niveau '+q.y0+' traverse la courbe ENTRE deux graduations ('+q.pts[i]+' → '+q.pts[i+1]+')'); }
        const n=q.pts.filter(function(v){ return v===q.y0; }).length;
        if(n<1||n>3) vus.push(n+' antécédents pour la hauteur '+q.y0);
        ns.push(n);
      });
      if(ns.indexOf(1)<0) vus.push('aucune question à UN SEUL antécédent dans la séance');
      if(!ns.some(function(n){ return n>1; })) vus.push('aucune question à PLUSIEURS antécédents dans la séance');
    }

    /* ---- 2. la correction, sur une question CHOISIE : la fiche des
       variations, hauteur −1 — deux antécédents, −2 et 2. ---- */
    startAnt(); clearTimeout(test.fbTimer);
    test.questions[0]={pts:[-3,-1,1,3,1,-1,-3], y0:-1};
    const poser=function(vals){ test.locked=false; test.idx=0; renderAnt();
      Object.keys(vals).forEach(function(id){ const el=document.getElementById(id);
        if(el){ const x=vals[id]; el.value=(x===undefined||x===null)?'':String(x); } }); };
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
    const IDS=['ant-s-0','ant-s-1','ant-fx-0','ant-fy-0','ant-fx-1','ant-fy-1'];

    poser({});
    if(document.getElementById('antInstr').textContent.indexOf(numFmt(-1))<0)
      vus.push('l\\'énoncé ne nomme pas la hauteur demandée');
    if(document.querySelector('#antGraph .img-trait'))
      vus.push('la ligne de niveau est déjà dessinée avant la validation — elle montre les croisements qu\\'on demande de trouver');

    /* copie juste : six cases vertes, la note les compte toutes */
    const BON={'ant-s-0':-2,'ant-s-1':2,'ant-fx-0':-2,'ant-fy-0':-1,'ant-fx-1':2,'ant-fy-1':-1};
    poser(BON); const avant=test.score; submitAnt(); clearTimeout(test.fbTimer);
    if(IDS.some(function(id){ return peint(id)!=='vert'; }))
      vus.push('la copie juste n\\'est pas entièrement verte ('+IDS.map(peint).join(',')+')');
    if(test.score-avant!==6) vus.push('la copie juste vaut '+(test.score-avant)+' au lieu de 6');

    /* le trait, mesuré contre les GRADUATIONS du dessin même */
    const svg=document.getElementById('antGraph');
    const traits=svg.querySelectorAll('.img-trait');
    if(traits.length<3){ vus.push('la ligne de niveau et ses descentes ne sont pas dessinées à la validation ('+traits.length+' traits)'); }
    else{
      const num=function(el,a){ return parseFloat(el.getAttribute(a)); };
      const horz=Array.prototype.filter.call(traits,function(l){ return Math.abs(num(l,'y1')-num(l,'y2'))<0.5 && Math.abs(num(l,'x1')-num(l,'x2'))>=0.5; });
      const verts=Array.prototype.filter.call(traits,function(l){ return Math.abs(num(l,'x1')-num(l,'x2'))<0.5; });
      const lab=function(txt,horiz){
        const ts=svg.querySelectorAll('text.lv-ax');
        for(let i=0;i<ts.length;i++){ if(ts[i].textContent===txt &&
          (horiz ? ts[i].getAttribute('text-anchor')==='middle' : ts[i].getAttribute('text-anchor')==='end')) return ts[i]; }
        return null; };
      if(horz.length!==1) vus.push(horz.length+' lignes de niveau au lieu de 1');
      else{
        const ly=lab(numFmt(-1),false);
        if(!ly) vus.push('aucune graduation ne porte '+numFmt(-1));
        else if(Math.abs(num(horz[0],'y1')-(parseFloat(ly.getAttribute('y'))-3.5))>1)
          vus.push('la ligne de niveau n\\'est pas à la hauteur '+numFmt(-1));
      }
      if(verts.length!==2) vus.push(verts.length+' descentes au lieu de 2');
      else [-2,2].forEach(function(x0){
        const lx=lab(numFmt(x0),true);
        if(!lx){ vus.push('aucune graduation ne porte '+numFmt(x0)); return; }
        if(!verts.some(function(l){ return Math.abs(num(l,'x1')-parseFloat(lx.getAttribute('x')))<=1; }))
          vus.push('aucune descente ne tombe sur la graduation '+numFmt(x0));
      });
      if(svg.querySelectorAll('.img-pt').length!==2) vus.push('les points de croisement manquent');
    }

    /* L'ORDRE EST LIBRE : la même copie, antécédents échangés */
    poser({'ant-s-0':2,'ant-s-1':-2,'ant-fx-0':2,'ant-fy-0':-1,'ant-fx-1':-2,'ant-fy-1':-1});
    const av2=test.score; submitAnt(); clearTimeout(test.fbTimer);
    if(test.score-av2!==6) vus.push('les antécédents ne s\\'acceptent pas dans l\\'autre ordre ('+(test.score-av2)+'/6)');

    /* le MÊME antécédent posé deux fois : défendable une fois, faux la seconde */
    poser(Object.assign({},BON,{'ant-s-0':-2,'ant-s-1':-2})); submitAnt(); clearTimeout(test.fbTimer);
    if(peint('ant-s-0')!=='vert') vus.push('le premier −2 est peint en '+peint('ant-s-0'));
    if(peint('ant-s-1')==='vert') vus.push('le même antécédent posé deux fois est compté juste deux fois');

    /* une case vide en entraînement : jamais rouge, la correction en bleu */
    poser(Object.assign({},BON,{'ant-s-1':null})); submitAnt(); clearTimeout(test.fbTimer);
    if(peint('ant-s-1')==='rouge') vus.push('une case laissée vide rougit à la vérification');
    if(peint('ant-s-1')!=='bleu') vus.push('une case vide ne reçoit pas la correction en bleu ('+peint('ant-s-1')+')');
    if((document.getElementById('ant-s-1').value||'')==='') vus.push('la correction en bleu n\\'écrit pas la valeur');

    /* en soutien : la case vide ne reçoit rien, la fausse rougit seule */
    currentMode='soutien';
    poser(Object.assign({},BON,{'ant-fy-1':null,'ant-fx-0':0}));
    antLive();
    if(peint('ant-fy-1')!=='rien') vus.push('en soutien, la case vide reçoit '+peint('ant-fy-1')+' pendant la frappe');
    if(peint('ant-fx-0')!=='rouge') vus.push('en soutien, la case fausse ne rougit pas pendant la frappe');
    if(peint('ant-s-0')!=='vert') vus.push('en soutien, une case juste ne verdit pas');
    submitAnt();
    if(peint('ant-fy-1')!=='rien') vus.push('en soutien, la vérification pose '+peint('ant-fy-1')+' sur une case vide');
    if(test.locked) vus.push('en soutien, une copie incomplète verrouille la question');
    currentMode='train';

    /* ---- 3. UN SEUL antécédent : le singulier, et trois cases ---- */
    test.questions[0]={pts:[-3,-1,1,3,1,-1,-3], y0:3};
    poser({});
    const txt=(document.getElementById('antBody').textContent||'').replace(/\\s+/g,' ');
    if(txt.indexOf('L’antécédent de 3 est')<0) vus.push('une hauteur à un seul antécédent ne se dit pas au singulier : '+txt.slice(0,50));
    if(document.getElementById('ant-s-1')) vus.push('une hauteur à un seul antécédent affiche deux cases');
    poser({'ant-s-0':0,'ant-fx-0':0,'ant-fy-0':3}); const av3=test.score; submitAnt(); clearTimeout(test.fbTimer);
    if(test.score-av3!==3) vus.push('la copie juste au singulier vaut '+(test.score-av3)+' au lieu de 3');

    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);
}

/* ---------- Le pavé numérique compact : tactile seulement, et il écrit vraiment ---------- */
/* Quatre promesses, chacune silencieuse si elle casse. Sur ordinateur, RIEN ne
   change — un pavé qui s'ouvrirait partout volerait la place de l'exercice.
   Sur écran tactile, les cases déclarées numériques perdent le clavier du
   système (inputmode="none") et gagnent le pavé. Ses touches ÉCRIVENT dans la
   case et préviennent la page (événement input — sans lui, la correction en
   direct du soutien ne verrait jamais la frappe). Le signe moins insère le
   TIRET du clavier : lvReadInt passe par parseFloat, qui ne connaît pas « − ».
   Et la liste des touches est comparée à tests/profils.js — deux sources. */
function paveNumerique(w, P){
  const present = evaluer(w, "typeof paveBrancher==='function' && typeof PAVE_TOUCHES!=='undefined'");
  if(!present.ok || !present.valeur){
    ignorer('le pavé numérique compact : tactile seulement, et il écrit vraiment',
      'ce fichier n\'a pas le pavé numérique');
    return;
  }
  const attendues = JSON.stringify((P.pave && P.pave.touches) || []);
  verifierEval(w, 'le pavé numérique compact : tactile seulement, et il écrit vraiment', `(function(){
    const vus=[];
    const gaine=document.createElement('div');
    gaine.innerHTML='<input id="pv-essai" inputmode="numeric"><input id="pv-libre" type="text"><button id="pv-bouton" type="button">ailleurs</button>';
    document.body.appendChild(gaine);
    const essai=document.getElementById('pv-essai'), libre=document.getElementById('pv-libre');

    /* ---- 1. sur ordinateur, RIEN ne change ---- */
    delete window.__paveForce;
    if(paveActif()) vus.push('paveActif() est vrai hors écran tactile — le pavé s\\'ouvrirait sur ordinateur');
    paveObserver();
    if(document.getElementById('paveNum')) vus.push('le pavé est construit hors écran tactile');
    if(essai.getAttribute('inputmode')!=='numeric') vus.push('hors tactile, la case perd son inputmode ('+essai.getAttribute('inputmode')+')');

    /* ---- 2. la liste des touches, comparée à tests/profils.js ---- */
    if(JSON.stringify(PAVE_TOUCHES)!=='${attendues}'.replace(/&quot;/g,'"'))
      vus.push('PAVE_TOUCHES ne dit pas ce que tests/profils.js attend : '+JSON.stringify(PAVE_TOUCHES));

    /* ---- 3. en tactile : la conversion, le pavé, la frappe ---- */
    window.__paveForce=true;
    paveObserver();
    const pave=document.getElementById('paveNum');
    if(!pave){ document.body.removeChild(gaine); return 'le pavé n\\'est pas construit en tactile'; }
    if(essai.getAttribute('inputmode')!=='none') vus.push('la case numérique garde le clavier du système (inputmode='+essai.getAttribute('inputmode')+')');
    if(!essai.hasAttribute('data-pave')) vus.push('la case numérique n\\'est pas marquée data-pave');
    if(libre.hasAttribute('data-pave')) vus.push('un champ de TEXTE reçoit le pavé — il deviendrait inutilisable sur tablette');

    essai.focus();
    essai.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));
    if(pave.hidden) vus.push('le pavé ne s\\'ouvre pas quand une case numérique prend le focus');

    let frappes=0, entrees=0;
    essai.addEventListener('input',function(){ frappes++; });
    essai.addEventListener('keydown',function(e){ if(e.key==='Enter') entrees++; });
    const appuyer=function(t){ const b=pave.querySelector('button[data-t="'+t+'"]');
      if(!b){ vus.push('la touche « '+t+' » manque'); return; }
      b.dispatchEvent(new MouseEvent('click',{bubbles:true})); };
    appuyer('1'); appuyer('2'); appuyer(','); appuyer('5');
    if(essai.value!=='12,5') vus.push('les touches écrivent « '+essai.value+' » au lieu de « 12,5 »');
    appuyer('⌫');
    if(essai.value!=='12,') vus.push('la touche effacer laisse « '+essai.value+' »');
    if(frappes<5) vus.push('les touches ne préviennent pas la page ('+frappes+' événements input sur 5) : la correction en direct ne verrait rien');
    essai.value=''; appuyer('−');
    if(essai.value!=='-') vus.push('le signe moins insère « '+essai.value+' » au lieu du tiret du clavier — parseFloat ne le lirait pas');
    appuyer('⏎');
    if(entrees!==1) vus.push('la touche ⏎ n\\'envoie pas la touche Entrée — sur tablette, le calcul mental ne pourrait plus valider');

    /* ---- 4. le focus ailleurs referme le pavé ---- */
    const bouton=document.getElementById('pv-bouton');
    bouton.focus();
    bouton.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));
    if(!pave.hidden) vus.push('le pavé reste ouvert quand le focus quitte les cases numériques');

    delete window.__paveForce;
    document.body.removeChild(gaine);
    return vus.slice(0,4).join(' | ');
  })()`, r => r === '', undefined);
}

function ordreCroissant(w, P){
  const present = evaluer(w, "typeof startOrd==='function' && typeof ordGen==='function'");
  if(!present.ok || !present.valeur){
    ignorer('ranger trois nombres : l\'ordre est calculé, et le bouton ne change que l\'écriture',
      'ce niveau n\'a pas l\'exercice du rangement');
    return;
  }
  verifierEval(w, 'ranger trois nombres : l\'ordre est calculé, et le bouton ne change que l\'écriture', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='ordre-croissant';

    /* ---- 1. le tirage, jugé par une SECONDE méthode ---------------------- */
    const chaine=function(v,d){   /* l'écriture complétée, comparée comme du texte */
      const s=plcEcrit(v,d);
      return (s[0]==='−'?'-':'+')+s.replace('−','').padStart(12,'0');
    };
    const rangs={};
    for(let i=0;i<1500;i++){
      const q=ordGen(), eti='tirage '+q.nombres.map(function(v){ return plcEcrit(v,null); }).join(' ; ');
      if(q.nombres.length!==3){ vus.push(eti+' : pas trois nombres'); break; }
      const ks=q.nombres.map(function(v){ return v.k; });
      if(new Set(ks).size<2){ vus.push(eti+' : les trois nombres ont le même nombre de décimales, le bouton n\\'a rien à faire'); break; }
      if(Math.max.apply(null,ks)>3){ vus.push(eti+' : plus de trois décimales'); break; }
      if(plcCmp(q.nombres[0],q.nombres[1])===0 || plcCmp(q.nombres[0],q.nombres[2])===0
        || plcCmp(q.nombres[1],q.nombres[2])===0){ vus.push(eti+' : deux nombres égaux'); break; }
      /* l'ordre calculé, contre la seconde méthode. Les négatifs se comparent
         à part : sur les chaînes, « plus grand » s'inverse sous le signe. */
      const d=ordDecMax(q), tri=ordTri(q);
      const attendu=q.nombres.map(function(v,ix){ return ix; }).sort(function(a,b){
        const A=q.nombres[a], B=q.nombres[b];
        const negA=A.n<0, negB=B.n<0;
        if(negA!==negB) return negA?-1:1;
        const cA=chaine(A,d).slice(1), cB=chaine(B,d).slice(1);
        const c=(cA<cB)?-1:(cA>cB?1:0);
        return negA ? -c : c;
      });
      if(tri.join(',')!==attendu.join(',')){
        vus.push(eti+' : ordTri rend '+tri.join(',')+', la méthode des chaînes '+attendu.join(',')); break; }
      rangs[tri[0]]=(rangs[tri[0]]||0)+1;
    }
    /* le plus petit ne tombe pas toujours au même rang de la liste : sans
       mélange, l'élève apprendrait le rang plutôt que la comparaison */
    if(!vus.length && Object.keys(rangs).length<3)
      vus.push('le plus petit nombre tombe toujours aux rangs '+Object.keys(rangs).join(','));

    /* ---- 2. la correction, exercée par le BOUTON ------------------------- */
    startOrd();
    /* la fiche : 1,1 ; 1,075 ; 1,009 — l'ordre juste est 1,009 < 1,075 < 1,1,
       c'est-à-dire les indices 2, 1, 0 : le piège de la lecture chiffre à
       chiffre est dans la question même. */
    test.questions[test.idx]={nombres:[{n:11,k:1},{n:1075,k:3},{n:1009,k:3}]};
    const CASES=['ord-s-0','ord-s-1','ord-s-2'];
    const poser=function(vals){
      test.locked=false; renderOrdTest();
      CASES.forEach(function(id,i){ const el=document.getElementById(id);
        if(el) el.value=(vals[i]===undefined||vals[i]===null)?'':String(vals[i]); });
    };
    const peint=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
    /* copie juste */
    poser([2,1,0]); checkOrdAnswer();
    let der=test.answers[test.answers.length-1];
    if(!der || !der.correct) vus.push('la copie juste (1,009 < 1,075 < 1,1) est comptée fausse');
    if(CASES.some(function(id){ return peint(id)!=='vert'; })) vus.push('la copie juste n\\'est pas entièrement verte');
    if(!der || der.cases!==3) vus.push('la note compte '+(der?der.cases:'?')+' cases au lieu de 3');
    /* LE PIÈGE : ranger par la lecture chiffre à chiffre (1,009 < 1,1 < 1,075) */
    poser([2,0,1]); checkOrdAnswer();
    der=test.answers[test.answers.length-1];
    if(der && der.correct) vus.push('le rangement chiffre à chiffre est accepté');
    if(peint('ord-s-0')!=='vert') vus.push('la première case, JUSTE, est peinte en '+peint('ord-s-0'));
    if(peint('ord-s-1')!=='rouge' || peint('ord-s-2')!=='rouge') vus.push('les cases fausses ne rougissent pas');
    /* la correction MONTRE la méthode : les zéros restent posés */
    if(!test.plcZeros) vus.push('après une erreur, la méthode des zéros n\\'est pas montrée');
    if((document.getElementById('ord-n-0')||{}).textContent!=='1,100')
      vus.push('les zéros de la correction ne sont pas écrits : « '+(document.getElementById('ord-n-0')||{}).textContent+' »');
    /* une case vide ne rougit pas — elle reçoit la correction en bleu */
    poser([2,null,0]); checkOrdAnswer();
    if(peint('ord-s-1')==='rouge') vus.push('une case laissée vide rougit');
    if(peint('ord-s-1')!=='bleu') vus.push('une case vide ne reçoit pas la correction en bleu ('+peint('ord-s-1')+')');
    if(peint('ord-s-0')!=='vert' || peint('ord-s-2')!=='vert') vus.push('une case juste rougit parce qu\\'une autre est vide');
    /* le même nombre posé deux fois : chacun jugé seul */
    poser([2,2,0]); checkOrdAnswer();
    if(peint('ord-s-0')!=='vert') vus.push('la case juste rougit parce que son nombre est repris ailleurs');
    if(peint('ord-s-1')==='vert') vus.push('le même nombre posé deux fois est compté juste deux fois');

    /* ---- 3. le bouton ne change QUE l'écriture --------------------------- */
    /* le drapeau posé par la correction des essais précédents se retire : ici
       on éprouve l'APPUI seul, l'autre état a son essai plus haut */
    test.plcZeros=false;
    poser([2,1,0]);
    const avant=document.getElementById('ord-s-0').value;
    plcAppuiZeros(true);
    if((document.getElementById('ord-n-0')||{}).textContent!=='1,100')
      vus.push('l\\'appui n\\'écrit pas les zéros : « '+(document.getElementById('ord-n-0')||{}).textContent+' »');
    const optTenu=[...document.getElementById('ord-s-0').options].find(function(o){ return o.value==='0'; });
    if(optTenu && optTenu.textContent!=='1,100')
      vus.push('l\\'appui ne réécrit pas les libellés des listes : « '+optTenu.textContent+' »');
    if(document.getElementById('ord-s-0').value!==avant)
      vus.push('l\\'appui a CHANGÉ une réponse déjà choisie');
    const rTenu=(function(){ const q=test.questions[test.idx];
      return ordCases(q).map(function(c){ return document.getElementById(c.id).value===c.bon; }).join(' '); })();
    plcAppuiZeros(false);
    if((document.getElementById('ord-n-0')||{}).textContent!=='1,1')
      vus.push('le relâchement ne rend pas l\\'écriture minimale : « '+(document.getElementById('ord-n-0')||{}).textContent+' »');
    const rLache=(function(){ const q=test.questions[test.idx];
      return ordCases(q).map(function(c){ return document.getElementById(c.id).value===c.bon; }).join(' '); })();
    if(rTenu!==rLache) vus.push('la correction ne juge pas pareil pendant l\\'appui et après');

    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---------- Le professeur change le prénom d'un élève ---------------------
   Un prénom se tape à la rentrée, et il se tape parfois de travers : « Theo »
   pour « Théo », un nom de famille à la place du prénom, deux « Léa » qu'il
   faut distinguer. Jusqu'ici il n'y avait qu'un chemin — retirer l'élève et le
   recréer — et il emportait TOUT son historique.

   Ce geste ne passe pas par la fonction Edge, à la différence du code, de
   l'ajout et du retrait : il ne demande aucun droit que le navigateur du
   professeur n'ait déjà (la politique « prof_modif » lui ouvre l'UPDATE), et
   il ne touche à rien de secret — le compte Supabase est dérivé de « cle »,
   jamais du prénom. Le contrôle EXIGE cette propriété plutôt que de la
   supposer : un renommage qui partirait vers admin-eleve serait un bouton mort
   jusqu'au prochain redéploiement à la main, et rien ne le dirait.

   Six bords, et chacun a son défaut :
     · le renommage ordinaire — sinon le bouton ne sert à rien ;
     · « Annuler » et le prénom vide n'écrivent rien ;
     · un prénom DÉJÀ PRIS est refusé : deux élèves du même nom ne se
       distinguent plus sur l'écran de connexion, et l'un prendrait la place de
       l'autre ;
     · mais l'élève LUI-MÊME passe : « marie » doit pouvoir devenir « Marie »,
       et un contrôle de doublon trop large le refuserait ;
     · le REFUS MUET de la base — PostgREST rend « 0 ligne » sans erreur, comme
       pour une suppression : sans le compte des lignes touchées, la page
       annonce « Prénom modifié ✓ » sur un prénom qui n'a pas bougé ;
     · et rien d'autre ne bouge : ni la clé du compte, ni l'identifiant qui
       porte les notes. Renommer ne doit ni changer le code de l'élève, ni
       détacher son historique. */
function renommerEleve(w, apres){
  const present = evaluer(w, "typeof renameStudent==='function' && typeof renderRoster==='function'");
  if(!present.ok || !present.valeur){
    ignorer('le professeur peut changer le prénom d’un élève', 'ce niveau n’a pas renameStudent()');
    return fichesDeTravail(w, apres);
  }
  const TE = P.tableEleves, TR = P.tableResultats;

  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const dits=[]; const vraiToast=toast; toast=function(m,k){ dits.push((k||'ok')+':'+m); };
    const vraiPrompt=window.prompt;
    const bilan={};
    const semer=function(){
      window.__faux.tables['${TE}']=[
        {id:'e1',prenom:'Theo',cle:'cle-1',user_id:'compte-1'},
        {id:'e2',prenom:'Léa', cle:'cle-2',user_id:'compte-2'}];
      /* une note DÉJÀ obtenue : elle désigne l'élève par eleve_id, et doit le
         désigner encore après le renommage */
      window.__faux.tables['${TR}']=[{id:'r1',eleve_id:'e1',percent:80,details:{test:'x',mode:'train'}}];
      window.__faux.journal.length=0; dits.length=0;
    };
    const lu=function(id){ return (window.__faux.tables['${TE}']||[]).filter(function(l){return l.id===id;})[0]||{}; };
    try{
      /* 1. le renommage ordinaire — et le roster montre le nouveau nom */
      semer(); window.prompt=function(){ return ' Théo '; };
      await renameStudent('e1','Theo');
      bilan.nom=lu('e1').prenom;
      bilan.dits=dits.join(' | ');
      /* rien d'autre n'a bougé : ni la clé du compte, ni l'identifiant des notes */
      bilan.cle=lu('e1').cle; bilan.compte=lu('e1').user_id;
      bilan.note=(window.__faux.tables['${TR}'][0]||{}).eleve_id;
      /* et le geste n'est PAS passé par la fonction Edge : elle ne se déploie
         qu'à la main, un bouton qui l'appellerait serait mort jusque-là */
      bilan.edge=window.__faux.operations('invoke').length;
      await renderRoster();
      const ul=document.getElementById('rosterList');
      bilan.affiche=(ul?ul.textContent:'').indexOf('Théo')>=0;
      bilan.bouton=(ul?ul.innerHTML:'').indexOf('renameStudent(')>=0;

      /* 2. « Annuler » : rien n'est écrit, rien n'est dit */
      semer(); window.prompt=function(){ return null; };
      await renameStudent('e1','Theo');
      bilan.annule=lu('e1').prenom+' /'+window.__faux.operations('update','${TE}').length+' /'+dits.length;

      /* 3. un prénom vide n'écrit rien, et le dit */
      semer(); window.prompt=function(){ return '   '; };
      await renameStudent('e1','Theo');
      bilan.vide=lu('e1').prenom+' /'+window.__faux.operations('update','${TE}').length+' /'+dits.join(' | ');

      /* 4. le prénom d'un AUTRE élève est refusé, à la casse près */
      semer(); window.prompt=function(){ return 'léa'; };
      await renameStudent('e1','Theo');
      bilan.doublon=lu('e1').prenom+' /'+window.__faux.operations('update','${TE}').length+' /'+dits.join(' | ');

      /* 5. mais SON PROPRE prénom passe : « Theo » doit pouvoir devenir « THEO » */
      semer(); window.prompt=function(){ return 'THEO'; };
      await renameStudent('e1','Theo');
      bilan.casse=lu('e1').prenom;

      /* 6. LE REFUS MUET : la base ne change rien et ne dit rien. Le double sert
         les autres bords ; celui-ci demande un sb à lui — deux contrôles qui se
         rendent sb à tour de rôle se le reprennent en plein vol, le piège
         documenté — et il est rendu tout de suite après. */
      semer();
      const sbSauve=sb;
      sb={ from:function(){ const q={
        select:function(){ return q; }, ilike:function(){ return q; },
        update:function(){ return q; }, eq:function(){ return q; },
        then:function(ok,ko){ return Promise.resolve({data:[],error:null}).then(ok,ko); } }; return q; } };
      window.prompt=function(){ return 'Théodore'; };
      await renameStudent('e1','Theo');
      sb=sbSauve;
      bilan.muet=dits.join(' | ');
    } finally { toast=vraiToast; window.prompt=vraiPrompt; }
    return bilan;
  })()`, r => {
    const b = r.ok ? (r.valeur || {}) : {};
    const souci = r.ok ? '' : 'erreur JavaScript : ' + r.erreur;

    verifier('le professeur change le prénom d’un élève, espaces en trop retirés',
      r.ok && b.nom === 'Théo' && /ok:/.test(String(b.dits||'')),
      souci || 'prénom en base : « ' + b.nom + ' » — dit : ' + b.dits);
    verifier('renommer ne touche ni au compte de l’élève ni à ses notes',
      r.ok && b.cle === 'cle-1' && b.compte === 'compte-1' && b.note === 'e1' && b.edge === 0,
      souci || 'clé : ' + b.cle + ', compte : ' + b.compte + ', note rattachée à : ' + b.note +
               ', appels à la fonction Edge : ' + b.edge);
    verifier('la liste du professeur montre le nouveau prénom, et offre le bouton',
      r.ok && b.affiche === true && b.bouton === true,
      souci || 'nouveau nom affiché : ' + b.affiche + ' — bouton présent : ' + b.bouton);
    verifier('« Annuler » ne renomme rien',
      r.ok && b.annule === 'Theo /0 /0',
      souci || 'après annulation : ' + b.annule + ' — attendu « Theo /0 /0 »');
    verifier('un prénom vide est refusé, et le professeur le lit',
      r.ok && /^Theo \/0 \//.test(String(b.vide||'')) && /err:/.test(String(b.vide||'')),
      souci || 'après un prénom vide : ' + b.vide);
    verifier('le prénom d’un autre élève est refusé, même écrit autrement',
      r.ok && /^Theo \/0 \//.test(String(b.doublon||'')) && /err:/.test(String(b.doublon||'')),
      souci || 'après un doublon : ' + b.doublon);
    verifier('mais changer la casse de SON prénom reste possible',
      r.ok && b.casse === 'THEO',
      souci || 'prénom en base : « ' + b.casse + ' » — attendu « THEO »');
    verifier('un changement que la base refuse EN SILENCE n’est pas annoncé comme fait',
      r.ok && /err:/.test(String(b.muet||'')) && !/ok:/.test(String(b.muet||'')),
      souci || 'le professeur a lu « ' + b.muet + ' » — sous RLS, PostgREST rend « 0 ligne » sans erreur');
    fichesDeTravail(w, apres);
  });
}

/* Les FICHES DE TRAVAIL EN CLASSE — la seconde famille de devoirs (demande de
   Turquet, août 2026). Même moteur, deux clés de stockage : le portail lit
   valeurs.devoirs, et une fiche rangée dedans y serait publiée.
   Quatre bords, et n'en tenir qu'un ne tient rien :
     · la page des fiches montre les fiches, JAMAIS les devoirs — et
       réciproquement : mélangées, l'élève ferait deux fois le même travail ;
     · le détail d'une fiche remet le bon titre, même en y arrivant par le seul
       identifiant (le retour après un exercice) ;
     · l'enregistrement d'une famille NE TOUCHE PAS l'autre ;
     · une note lancée depuis une fiche porte l'identifiant de la fiche. */
/* SÉQUENTIEL, dans la chaîne des contrôles asynchrones — la leçon des deux
   contrôles qui se rendaient « sb » à tour de rôle : celui-ci ré-injecte le
   double de la base, et un contrôle qui courrait à côté lui reprendrait la
   main en plein vol (« panne simulée » au milieu d'une lecture). Il vit donc
   entre coursEnPdf et longueurContexteIA, jamais dans la liste synchrone. */
function fichesDeTravail(w, apres){
  const present = evaluer(w, "typeof GENRE_DEVOIRS!=='undefined' && typeof openDevoirsEleve==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les fiches de travail vivent à côté des devoirs, jamais dedans',
      'ce niveau n\'a pas les fiches de travail en classe');
    return ordreDesFiches(w, apres);
  }
  const TABLE=(P.coursPdf&&P.coursPdf.table)||'parametres';
  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'};
    const exId=Object.keys(TESTS)[0];
    window.__faux.semer('${TABLE}',[{id:1,valeurs:{
      devoirs:[{id:'dm_temoin',num:3,actif:true,titre:'Devoir témoin',cours:'',exercices:[{id:exId,modes:['train']}]}],
      fiches:[{id:'fc_temoin',num:2,actif:true,titre:'Fiche témoin',cours:'',exercices:[{id:exId,modes:['train']}]}]
    }}]);

    /* 1. chaque page montre SA famille */
    await openDevoirsEleve('fiche');
    let corps=document.getElementById('devoirsBody').textContent;
    let titre=document.getElementById('devoirsTitle').textContent;
    if(titre.indexOf('Fiches de travail')<0) vus.push('la page des fiches se titre « '+titre+' »');
    if(corps.indexOf('Fiche témoin')<0) vus.push('la fiche affichée n\\'arrive pas jusqu\\'à l\\'élève');
    if(corps.indexOf('Fiche n°2')<0) vus.push('la carte ne dit pas « Fiche n°2 » : '+corps.slice(0,80));
    if(corps.indexOf('Devoir témoin')>=0) vus.push('un DEVOIR s\\'affiche dans la page des fiches');
    /* 1 bis. LA LISTE EST COMPACTE (demande de Turquet, août 2026) : le numéro,
       le titre, la note s'il y en a une — jamais le contenu, qui ne vit que sur
       la page du devoir. Trois bords : le contenu absent de la liste, « À
       faire » quand rien n'est fait, la note quand elle existe — et le
       contenu, lui, doit être SUR la page du devoir. */
    const exLbl=testLabel(exId);
    if(corps.indexOf(exLbl)>=0) vus.push('la liste recopie le contenu : « '+exLbl+' » s\\'affiche avant d\\'ouvrir la fiche');
    if(corps.indexOf('À faire')<0) vus.push('une fiche jamais travaillée ne dit pas « À faire » : '+corps.slice(0,90));
    window.__faux.semer('${P.tableResultats||'resultats'}',[{id:1,eleve_id:'e-controle',score:8,total:10,percent:80,
      details:{test:exId,mode:'train',dm:'fc_temoin'}}]);
    await openDevoirsEleve('fiche');
    corps=document.getElementById('devoirsBody').textContent;
    if(corps.indexOf('Note : 8 / 10')<0) vus.push('la note obtenue ne s\\'affiche pas sur la liste : '+corps.slice(0,110));
    window.__faux.semer('${P.tableResultats||'resultats'}',[]);
    await openDevoirsEleve();
    corps=document.getElementById('devoirsBody').textContent;
    titre=document.getElementById('devoirsTitle').textContent;
    if(titre.indexOf('Devoirs à la maison')<0) vus.push('la page des devoirs se titre « '+titre+' »');
    if(corps.indexOf('Devoir témoin')<0) vus.push('le devoir a disparu de sa page');
    if(corps.indexOf('Fiche témoin')>=0) vus.push('une FICHE s\\'affiche dans la page des devoirs');

    /* 2. le détail par le seul identifiant : le titre suit la famille */
    await ouvrirDevoirDetail('fc_temoin');
    titre=document.getElementById('devoirsTitle').textContent;
    corps=document.getElementById('devoirsBody').textContent;
    if(titre.indexOf('Fiches de travail')<0) vus.push('le détail d\\'une fiche se titre « '+titre+' »');
    if(corps.indexOf('Note de la fiche')<0) vus.push('le détail d\\'une fiche parle de « Note du devoir »');
    if(corps.indexOf(exLbl)<0) vus.push('le contenu de la fiche n\\'est plus sur sa page : « '+exLbl+' » manque');

    /* 3. une note lancée depuis une fiche porte SON identifiant */
    if(typeof openTestDevoir==='function'){
      await openTestDevoir('fc_temoin', exId);
      if(currentDM!=='fc_temoin') vus.push('un exercice lancé depuis la fiche est étiqueté « '+currentDM+' »');
      currentDM=null;
    }

    /* 4. l'enregistrement d'une famille NE TOUCHE PAS l'autre */
    const lireValeurs=function(){ return (window.__faux.tables['${TABLE}']||[{}])[0].valeurs||{}; };
    if(typeof persistDevoirs==='function' && typeof dmGenre!=='undefined'){
      /* Seconde : l'éditeur écrit dmList sous la clé de SA famille */
      dmGenre='fiche';
      dmList=[{id:'fc_temoin',num:2,actif:true,titre:'Fiche corrigée',cours:'',exercices:[{id:exId,modes:['train']}]}];
      await persistDevoirs();
      let v=lireValeurs();
      if(!v.fiches || v.fiches[0].titre!=='Fiche corrigée') vus.push('la fiche enregistrée n\\'est pas sous valeurs.fiches');
      if(!v.devoirs || v.devoirs.length!==1 || v.devoirs[0].titre!=='Devoir témoin')
        vus.push('enregistrer une fiche a touché valeurs.devoirs : '+JSON.stringify(v.devoirs));
      dmGenre='dm';
      dmList=[{id:'dm_temoin',num:3,actif:true,titre:'Devoir corrigé',cours:'',exercices:[{id:exId,modes:['train']}]}];
      await persistDevoirs();
      v=lireValeurs();
      if(!v.devoirs || v.devoirs[0].titre!=='Devoir corrigé') vus.push('le devoir enregistré n\\'est pas sous valeurs.devoirs');
      if(!v.fiches || v.fiches[0].titre!=='Fiche corrigée')
        vus.push('enregistrer un devoir a touché valeurs.fiches : '+JSON.stringify(v.fiches));
    } else if(typeof newDM==='function' && typeof dmGenre!=='undefined'){
      /* Première : la création écrit sous la clé de SA famille */
      dmGenre='fiche';
      await newDM();
      let v=lireValeurs();
      if(!v.fiches || v.fiches.length!==2) vus.push('la fiche créée n\\'est pas sous valeurs.fiches ('+(v.fiches||[]).length+')');
      if(!v.devoirs || v.devoirs.length!==1) vus.push('créer une fiche a touché valeurs.devoirs ('+(v.devoirs||[]).length+')');
      if(v.fiches && v.fiches[1] && v.fiches[1].id.indexOf('fc_')!==0) vus.push('une fiche créée porte l\\'identifiant « '+v.fiches[1].id+' »');
      dmGenre='dm';
      await newDM();
      v=lireValeurs();
      if(!v.devoirs || v.devoirs.length!==2) vus.push('le devoir créé n\\'est pas sous valeurs.devoirs');
      if(!v.fiches || v.fiches.length!==2) vus.push('créer un devoir a touché valeurs.fiches');
    } else {
      vus.push('aucun éditeur de fiches à exercer');
    }
    return vus.join(' | ');
  })()`, function(r){
    if(!r.ok) verifier('les fiches de travail vivent à côté des devoirs, jamais dedans', false, 'erreur JavaScript : '+r.erreur);
    else verifier('les fiches de travail vivent à côté des devoirs, jamais dedans', r.valeur==='', r.valeur);
    ordreDesFiches(w, apres);
  });
}
/* L'ORDRE IMPOSÉ DES FICHES (demande de Turquet, août 2026) : une fiche de
   travail en classe se fait dans l'ordre écrit par le professeur — le premier
   exercice non fait est le prochain, tout ce qui vient après est verrouillé,
   un exercice déjà fait se refait librement. Les devoirs à la maison, eux,
   restent tous ouverts. Quatre bords, et n'en tenir qu'un ne tient rien :
     · la DÉFINITION (dmVerrouille) : rien de fait → seul le premier est
       ouvert ; une note sur le premier débloque le deuxième et pas le
       troisième ; le premier se refait toujours ;
     · l'ÉCRAN dit la même chose : cartes 🔒 grisées, rangs écrits, phrase
       d'ordre — et la page d'un DEVOIR ne grise rien ;
     · la PORTE (openTestDevoir) refuse ce que l'écran grise — une carte se
       recrée par un vieux rendu, la porte est l'entonnoir ;
     · l'ÉDITEUR fixe l'ordre : la relecture du formulaire le PRÉSERVE
       (l'ordre du menu écraserait celui du professeur), les flèches le
       déplacent, l'enregistrement l'emporte tel quel — et un devoir garde
       l'ordre du menu, sans ruban. */
function ordreDesFiches(w, apres){
  const present = evaluer(w, "typeof GENRE_DEVOIRS!=='undefined' && typeof dmVerrouille==='function' && typeof openTestDevoir==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les fiches se font dans l\'ordre : la définition, l\'écran, la porte et l\'éditeur',
      'ce niveau n\'a pas les fiches de travail en classe');
    return reglagesDevoirs(w, apres);
  }
  const TABLE=(P.coursPdf&&P.coursPdf.table)||'parametres';
  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'};
    const ids=Object.keys(TESTS).slice(0,3);
    const A=ids[2], B=ids[0], C=ids[1];      /* un ordre qui n'est PAS celui du menu */
    const trois=[{id:A,modes:['train']},{id:B,modes:['train']},{id:C,modes:['train']}];
    window.__faux.semer('${TABLE}',[{id:1,valeurs:{
      devoirs:[{id:'dm_o',num:1,actif:true,titre:'Devoir libre',cours:'',exercices:JSON.parse(JSON.stringify(trois))}],
      fiches:[{id:'fc_o',num:1,actif:true,titre:'Fiche ordonnée',cours:'',exercices:JSON.parse(JSON.stringify(trois))}]
    }}]);
    window.__faux.semer('${P.tableResultats||'resultats'}',[]);
    const ecran=function(){ return ([].slice.call(document.querySelectorAll('section.screen')).find(function(s){ return s.classList.contains('on'); })||{}).id; };

    /* 1. la définition : rien de fait, seul le premier est ouvert */
    await ouvrirDevoirDetail('fc_o');
    const fiche=(mesDevoirs||[]).find(function(d){ return d.id==='fc_o'; });
    if(!fiche) return 'la fiche témoin n\\'arrive pas chez l\\'élève';
    if(dmVerrouille(fiche,A)) vus.push('le premier exercice est verrouillé alors que rien n\\'est fait');
    if(!dmVerrouille(fiche,B)) vus.push('le deuxième est ouvert alors que le premier n\\'est pas fait');
    if(!dmVerrouille(fiche,C)) vus.push('le troisième est ouvert alors que rien n\\'est fait');
    /* et l'écran dit la même chose que la définition */
    let grises=document.querySelectorAll('#devoirsBody .choice.locked').length;
    const texte=document.getElementById('devoirsBody').textContent;
    if(grises!==2) vus.push('l\\'écran grise '+grises+' carte(s) au lieu de 2');
    if(texte.indexOf('1. ')<0 || texte.indexOf('3. ')<0) vus.push('les rangs ne s\\'écrivent pas sur les cartes');
    if(texte.indexOf('dans l\\u2019ordre')<0) vus.push('la page ne dit pas que la fiche se fait dans l\\'ordre');

    /* 2. la porte refuse ce que l'écran grise */
    currentDM=null;
    await openTestDevoir('fc_o',C);
    if(ecran()==='scr-mode') vus.push('la porte ouvre un exercice verrouillé');
    if(currentDM==='fc_o') vus.push('la porte pose le contexte du devoir avant de refuser');

    /* 3. une note sur le premier débloque le deuxième, pas le troisième */
    window.__faux.semer('${P.tableResultats||'resultats'}',[{id:'r1',eleve_id:'e-controle',score:8,total:10,percent:80,
      details:{test:A,mode:'train',dm:'fc_o'}}]);
    await ouvrirDevoirDetail('fc_o');
    const f2=(mesDevoirs||[]).find(function(d){ return d.id==='fc_o'; });
    if(dmVerrouille(f2,B)) vus.push('une note sur le premier ne débloque pas le deuxième');
    if(!dmVerrouille(f2,C)) vus.push('le troisième se débloque avant son tour');
    if(dmVerrouille(f2,A)) vus.push('un exercice déjà fait ne se refait plus');
    grises=document.querySelectorAll('#devoirsBody .choice.locked').length;
    if(grises!==1) vus.push('après la note, l\\'écran grise '+grises+' carte(s) au lieu de 1');
    await openTestDevoir('fc_o',B);
    if(ecran()!=='scr-mode') vus.push('la porte reste fermée sur un exercice débloqué');
    currentDM=null;

    /* 4. un devoir à la maison n'est jamais verrouillé */
    window.__faux.semer('${P.tableResultats||'resultats'}',[]);
    await ouvrirDevoirDetail('dm_o');
    const devL=(mesDevoirs||[]).find(function(d){ return d.id==='dm_o'; });
    if(dmVerrouille(devL,C)) vus.push('le verrou déborde sur les devoirs à la maison');
    if(document.querySelectorAll('#devoirsBody .choice.locked').length) vus.push('la page d\\'un devoir grise des cartes');

    /* 5. l'éditeur fixe l'ordre, et l'enregistrement l'emporte */
    const lireValeurs=function(){ return (window.__faux.tables['${TABLE}']||[{}])[0].valeurs||{}; };
    const idsDe=function(arr){ return (arr||[]).map(function(e){ return e.id; }).join('>'); };
    if(typeof readEditorIntoDevoir==='function'){
      /* Seconde : la relecture du formulaire préserve l'ordre de la fiche */
      dmGenre='fiche';
      dmList=[{id:'fc_o',num:1,actif:true,titre:'Fiche ordonnée',cours:'',exercices:[{id:A,modes:['train']},{id:B,modes:['train']}]}];
      dmSelId='fc_o';
      renderDevoirEditor();
      if(!document.getElementById('dmOrdre')) vus.push('le ruban d\\'ordre manque dans l\\'éditeur des fiches');
      const cb=document.querySelector('#dmExos input[data-ex="'+C+'"][data-mode="train"]');
      if(!cb){ vus.push('la case de l\\'exercice témoin est introuvable dans l\\'éditeur'); }
      else {
        cb.checked=true; readEditorIntoDevoir();
        if(idsDe(dmList[0].exercices)!==A+'>'+B+'>'+C)
          vus.push('la relecture réordonne la fiche : '+idsDe(dmList[0].exercices)+' au lieu de '+A+'>'+B+'>'+C);
        dmOrdreBouge(C,-1);
        if(idsDe(dmList[0].exercices)!==A+'>'+C+'>'+B)
          vus.push('la flèche ne déplace pas l\\'exercice : '+idsDe(dmList[0].exercices));
        await persistDevoirs();
        const v=lireValeurs();
        if(idsDe((v.fiches||[{}])[0].exercices)!==A+'>'+C+'>'+B)
          vus.push('l\\'enregistrement perd l\\'ordre : '+idsDe((v.fiches||[{}])[0].exercices));
      }
      /* un devoir, lui, garde l'ordre du menu, sans ruban */
      dmGenre='dm';
      dmList=[{id:'dm_o',num:1,actif:true,titre:'Devoir libre',cours:'',exercices:[{id:A,modes:['train']},{id:B,modes:['train']}]}];
      dmSelId='dm_o';
      renderDevoirEditor();
      if(document.getElementById('dmOrdre')) vus.push('le ruban d\\'ordre s\\'affiche sur un devoir');
      readEditorIntoDevoir();
      const menu=TEST_ORDER.filter(function(id){ return id===A||id===B; }).join('>');
      if(idsDe(dmList[0].exercices)!==menu) vus.push('un devoir ne suit plus l\\'ordre du menu : '+idsDe(dmList[0].exercices));
    } else if(typeof renderDmEditor==='function'){
      /* Première : les flèches déplacent, l'enregistrement emporte l'ordre */
      dmGenre='fiche';
      dmAdminList=[{id:'fc_o',num:1,actif:true,titre:'Fiche ordonnée',cours:'',exercices:JSON.parse(JSON.stringify(trois))}];
      dmSelId='fc_o';
      renderDmEditor();
      if(!document.getElementById('dmOrdre')) vus.push('le ruban d\\'ordre manque dans l\\'éditeur des fiches');
      dmOrdreBouge(C,-1);
      if(idsDe(dmAdminList[0].exercices)!==A+'>'+C+'>'+B)
        vus.push('la flèche ne déplace pas l\\'exercice : '+idsDe(dmAdminList[0].exercices));
      await saveDM();
      await new Promise(function(r){ setTimeout(r,80); });   /* renderDevoirsAdmin se pose */
      const v=lireValeurs();
      if(idsDe((v.fiches||[{}])[0].exercices)!==A+'>'+C+'>'+B)
        vus.push('l\\'enregistrement perd l\\'ordre : '+idsDe((v.fiches||[{}])[0].exercices));
      dmGenre='dm';
      dmAdminList=[{id:'dm_o',num:1,actif:true,titre:'Devoir libre',cours:'',exercices:JSON.parse(JSON.stringify(trois))}];
      dmSelId='dm_o';
      renderDmEditor();
      if(document.getElementById('dmOrdre')) vus.push('le ruban d\\'ordre s\\'affiche sur un devoir');
    } else {
      vus.push('aucun éditeur à exercer');
    }
    dmGenre='dm'; currentDM=null;
    return vus.join(' | ');
  })()`, function(r){
    const nom='les fiches se font dans l\'ordre : la définition, l\'écran, la porte et l\'éditeur';
    if(!r.ok) verifier(nom, false, 'erreur JavaScript : '+r.erreur);
    else verifier(nom, r.valeur==='', r.valeur);
    reglagesDevoirs(w, apres);
  });
}
/* Les phrases qui commentent une vérification par l'IA sont VERTES quand c'est
   bon, ROUGES quand c'est faux (demande de Turquet, août 2026) — comme tous
   les retours de l'application. Les trois exercices rédigés de la Seconde
   (4.5, 4.7, 4.9) passent par deux fonctions, checkSFL et checkMLL : on
   exerce les deux, pour de vrai — le verdict du modèle est stubbé, la feuille
   aussi (jsdom n'a pas MathLive), mais la fonction qui PEINT est la vraie et
   c'est la COULEUR qu'on relit. Le contrôle vit dans la chaîne séquentielle,
   parce qu'il remplace sb : lancé en parallèle, un autre contrôle le lui
   reprendrait en plein vol — le piège documenté. */
/* ---- Le juge arithmétique des rédactions ----------------------------------
   La note du 4.5, du 4.7 et du 4.9 venait du modèle seul, et le modèle a
   compté faux une copie juste en production (« 6/12 − 2/12 = 4/12 » déclaré
   faux — signalé par Turquet sur une capture, août 2026). La page juge
   maintenant elle-même, en entiers ; le modèle ne fait plus que rédiger.
   Ce contrôle éprouve le JUGE, cas par cas — la copie de production d'abord :
   si elle ne passe pas au juge, c'est le juge qui a tort, pas la page. Puis
   les trois positions : FAUX sur un fait prouvable (égalité fausse, résultat
   non simplifié), JUSTE quand tout est vérifié, et JE-NE-SAIS-PAS partout
   ailleurs — une étape absente ou une écriture illisible font s'abstenir,
   jamais refuser : le modèle reste alors seul juge, comme avant. */
function jugeArithmetique(w, P){
  const present = evaluer(w, "typeof libreJuge==='function'");
  if(!present.ok || !present.valeur){
    ignorer('le juge arithmétique des rédactions : juste, faux, ou je-ne-sais-pas',
      'ce niveau n\'a pas le juge arithmétique des rédactions');
    return;
  }
  verifierEval(w, 'le juge arithmétique des rédactions : juste, faux, ou je-ne-sais-pas', `(function(){
    const vus=[];
    const qS={n1:1,d1:2,n2:1,d2:6,op:'\\u2212',D:6,N1:3,N2:1,N:2,Nr:1,Dr:3};
    const qM={n1:2,d1:3,n2:5,d2:7,a1:2,a2:5,b1:3,b2:7,P:10,Q:21};
    const qD={n1:3,d1:5,n2:2,d2:7,a1:3,a2:7,b1:5,b2:2,P:21,Q:10};
    function cas(nom, q, rep, genre, attendu){
      const j=libreJuge(q, rep, genre);
      const vu=j.sait?(j.correct?'juste':'faux ('+(j.motif||'?')+')'):'je-ne-sais-pas';
      if(vu!==attendu) vus.push(nom+' : le juge dit « '+vu+' » au lieu de « '+attendu+' »');
      return j;
    }
    /* LA COPIE DE PRODUCTION, telle que la feuille la lit (toPlain met les
       parenthèses). Le dénominateur commun 12 au lieu de 6 est autorisé. */
    const lina='(1)/(2)-(1)/(6)\\n= (1*6)/(2*6)-(1*2)/(6*2)\\n= (6)/(12)-(2)/(12)\\n= (4)/(12)\\n= (1)/(3)';
    cas('la copie de production (juste, dénominateur 12)', qS, lina, 'sfl', 'juste');
    cas('la même par le PPCM', qS, '(1)/(2)-(1)/(6)\\n= (3)/(6)-(1)/(6)\\n= (2)/(6)\\n= (1)/(3)', 'sfl', 'juste');
    const jF=cas('une égalité fausse', qS, '(1)/(2)-(1)/(6)\\n= (3)/(6)-(1)/(6)\\n= (5)/(12)\\n= (1)/(3)', 'sfl', 'faux (egalite)');
    if(jF.sait && jF.morceau!=='(5)/(12)') vus.push('le juge ne nomme pas le morceau faux : '+jF.morceau);
    cas('un résultat non simplifié', qS, '(1)/(2)-(1)/(6)\\n= (3)/(6)-(1)/(6)\\n= (2)/(6)', 'sfl', 'faux (simplifier)');
    cas('l\\'étape du même dénominateur absente : le modèle reste juge', qS, '(1)/(2)-(1)/(6)\\n= (1)/(3)', 'sfl', 'je-ne-sais-pas');
    cas('une écriture illisible : le modèle reste juge', qS, '(1)/(2)-(1)/(6)\\n= n importe quoi', 'sfl', 'je-ne-sais-pas');
    cas('un résultat écrit comme un calcul : le modèle reste juge', qS, '(1)/(2)-(1)/(6)\\n= (3)/(6)-(1)/(6)\\n= (3-1)/(6)', 'sfl', 'je-ne-sais-pas');
    /* 4.7 : aucune étape exigée — la rédaction directe est jugée juste. */
    cas('le produit rédigé en direct (4.7)', qM, '(2)/(3)*(5)/(7)\\n= (10)/(21)', 'mll', 'juste');
    cas('le produit au mauvais résultat (4.7)', qM, '(2)/(3)*(5)/(7)\\n= (7)/(10)', 'mll', 'faux (egalite)');
    /* 4.9 : l'inverse est exigé — et le « ÷ » de la première ligne doit se
       lire, sinon le juge s'abstiendrait sur TOUTE copie de division. */
    cas('le quotient avec son inverse (4.9)', qD, '(3)/(5)\\\\div(2)/(7)\\n= (3)/(5)*(7)/(2)\\n= (21)/(10)', 'dll', 'juste');
    cas('l\\'inverse dans l\\'autre ordre (4.9)', qD, '(3)/(5)\\\\div(2)/(7)\\n= (7)/(2)*(3)/(5)\\n= (21)/(10)', 'dll', 'juste');
    cas('le quotient sans l\\'étape de l\\'inverse : le modèle reste juge', qD, '(3)/(5)\\\\div(2)/(7)\\n= (21)/(10)', 'dll', 'je-ne-sais-pas');
    cas('la division multipliée SANS retourner (4.9)', qD, '(3)/(5)\\\\div(2)/(7)\\n= (3)/(5)*(2)/(7)\\n= (6)/(35)', 'dll', 'faux (egalite)');
    /* Un produit VRAI qui n'est pas l'inverse — 21/2 × 1/5 vaut bien 21/10 —
       ne compte pas comme l'étape : le juge s'abstient, le modèle tranche.
       Sans ce cas, un sabotage qui acceptait n'importe quel produit restait
       vert : l'égalité fausse attrapait tous les autres avant lui. */
    cas('un produit vrai qui n\\'est pas l\\'inverse : le modèle reste juge', qD, '(3)/(5)\\\\div(2)/(7)\\n= (21)/(2)*(1)/(5)\\n= (21)/(10)', 'dll', 'je-ne-sais-pas');
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- Les équations graphiques : deux courbes, des croisements lisibles, et
   au moins dix dessins --------------------------------------------------------
   Repris de la fiche « équation et inéquation » (demande de Turquet, août
   2026, « au moins 10 dessins possibles »). Le risque propre : un croisement
   ILLISIBLE — f moins la droite de g n'est pas monotone entre deux
   graduations, et la page a RETIRÉ son échantillonnage après l'avoir mesuré
   mort (0 rejet sur 2000). C'est donc CE contrôle qui exige la propriété, en
   relisant les courbes de Bézier que lvPath écrit — le dessin même, jamais
   eqgSpline ni une réimplémentation qui se tromperait du même côté. */
function equationGraphique(w, P){
  const present = evaluer(w, "typeof startEqg==='function' && typeof eqgBuildQuestions==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les équations graphiques : deux courbes, des croisements lisibles, au moins dix dessins',
      'ce niveau n\'a pas l\'exercice des équations graphiques');
    return;
  }
  verifierEval(w, 'les équations graphiques : deux courbes, des croisements lisibles, au moins dix dessins', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='equation-graphique';

    /* Le dessin MÊME, relu : lvPath en coordonnées de données, ses cubiques
       échantillonnées par ce contrôle — indépendamment de toute fonction de
       correction de la page. */
    const echantillons=function(pts){
      const d=lvPath(pts, function(x){ return x; }, function(y){ return y; });
      const nums=d.replace(/[MC]/g,' ').trim().split(/\\s+/).map(Number);
      if(nums.some(isNaN)) return null;
      const out=[]; let px=nums[0], py=nums[1];
      for(let i=2;i+5<nums.length;i+=6){
        const c1x=nums[i],c1y=nums[i+1],c2x=nums[i+2],c2y=nums[i+3],x1=nums[i+4],y1=nums[i+5];
        for(let t=0;t<=1.0001;t+=0.04){
          const u=1-t;
          out.push({x:u*u*u*px+3*u*u*t*c1x+3*u*t*t*c2x+t*t*t*x1,
                    y:u*u*u*py+3*u*u*t*c1y+3*u*t*t*c2y+t*t*t*y1});
        }
        px=x1; py=y1;
      }
      return out;
    };

    /* ---- 1. le tirage : 300 séances, tout par sa propre arithmétique ---- */
    const dessins=new Set(), opsVus=new Set(), opsFVus=new Set(), opsGVus=new Set(),
          rangsBonN={}, rangsParForme={}, rangsParFormeG={}, nAntVus=new Set();
    /* le REPLI du tirage garde ses permutations mélangées : une séance de
       repli parmi les 300 suffisait à faire varier UN rang et à masquer une
       permutation figée — le sabotage restait vert une fois sur trois. On
       compte donc les occurrences : toute forme vue au moins 10 fois doit
       varier, et aucun rang du « bon » ne doit dépasser 90 %. */
    const noteRang=function(map,f,rang){ const e=map[f]=map[f]||{set:new Set(),n:0}; e.set.add(rang); e.n++; };
    for(let t=0;t<300 && !vus.length;t++){
      const qs=eqgBuildQuestions();
      if(qs.length!==8){ vus.push(qs.length+' questions au lieu de 8'); break; }
      if(qs.map(function(q){ return q.type; }).join(',')!=='img,ant,eqk,infk,gk,ingk,crx,ineq')
        vus.push('les questions ne suivent pas l\\'ordre attendu (images, antécédents, f(x)=k puis son inéquation, g(x)=k puis la sienne, f(x)=g(x), f signe g) : '+qs.map(function(q){ return q.type; }).join(','));
      const q0=qs[0];
      const CHAMPS=['pts','s','c','k','kg','ka','a','b','op','opf','opg','xtk','xtg','xtc','xta','permE','permI','permG'];
      const ref=JSON.stringify(CHAMPS.map(function(ch){ return q0[ch]; }));
      if(qs.some(function(q){ return JSON.stringify(CHAMPS.map(function(ch){ return q[ch]; }))!==ref; }))
        vus.push('le tirage CHANGE d\\'une question à l\\'autre — le même dessin doit servir aux huit');
      qs.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return CHAMPS.concat(['type']).indexOf(k)<0; });
        if(cles.length) vus.push('la question range autre chose que les courbes, les hauteurs, les signes, les points en trop et les ordres : '+cles.join(','));
      });
      /* g(x) = kg se lit d'un point : solution ENTIÈRE, intérieure, hors des
         croisements — et le piège « lu sur f » reste à au moins 1 de la ligne */
      {
        const gl=function(x){ return q0.s*x+q0.c; };
        const crG=[]; for(let x=-3;x<=3;x++){ if(q0.pts[x+3]===gl(x)) crG.push(x); }
        const xg=(q0.kg-q0.c)/q0.s;
        if(!Number.isInteger(xg)||xg<-2||xg>2) vus.push('la solution de g(x)=kg ('+xg+') n\\'est pas une graduation intérieure');
        else if(crG.indexOf(xg)>=0) vus.push('la solution de g(x)=kg tombe sur un croisement de f et g');
        if(q0.kg===q0.k) vus.push('kg = k : deux questions à la même hauteur');
        if(gl(crG[0])===q0.k||gl(crG[1])===q0.k) vus.push('un croisement de f et g tombe à la hauteur k : le piège « croisements » de f(x)=k serait invisible');
        const solsK0=[]; for(let x=-3;x<=3;x++){ if(q0.pts[x+3]===q0.k) solsK0.push(x); }
        if(solsK0.indexOf(q0.xtk)>=0||q0.xtk<-2||q0.xtk>2) vus.push('le point en trop de f(x)=k est un vrai croisement ou hors bornes');
        if(q0.xtg===xg||q0.xtg<-2||q0.xtg>2) vus.push('le point en trop de g(x)=kg est la vraie solution ou hors bornes');
        if(crG.indexOf(q0.xtc)>=0||q0.xtc<-2||q0.xtc>2||Math.abs(gl(q0.xtc))>3) vus.push('le point en trop de f(x)=g(x) est un vrai croisement, hors bornes ou hors dessin');
        /* f(x) signe k écrit son union « [−3 ; x1] ∪ [x2 ; 3] » : les deux
           solutions de f(x)=k sont INTÉRIEURES, sans quoi l'union mentirait */
        if(solsK0[0]<=-3||solsK0[solsK0.length-1]>=3) vus.push('une solution de f(x)=k tombe au bord du dessin ('+solsK0.join(',')+') : l\\'union de f(x) signe k mentirait');
        /* ka : lisible sur f (1 ou 2 antécédents, jamais voisins, jamais
           traversée entre deux graduations) ET sur g (xa graduation
           intérieure hors des antécédents par f), distincte de k et de kg,
           hors des hauteurs de croisement */
        const solsA=[]; for(let x=-3;x<=3;x++){ if(q0.pts[x+3]===q0.ka) solsA.push(x); }
        if(solsA.length<1||solsA.length>2) vus.push('la hauteur des antécédents a '+solsA.length+' antécédent(s) par f au lieu de 1 ou 2');
        if(solsA.length===2&&solsA[1]-solsA[0]<2) vus.push('les deux antécédents par f sont voisins ('+solsA.join(',')+') : le segment entier est à cette hauteur');
        for(let i=0;i<6;i++){ const lo=Math.min(q0.pts[i],q0.pts[i+1]), hi=Math.max(q0.pts[i],q0.pts[i+1]);
          if(q0.ka>lo && q0.ka<hi) vus.push('la hauteur des antécédents est traversée ENTRE deux graduations : un antécédent illisible'); }
        const xa=(q0.ka-q0.c)/q0.s;
        if(!Number.isInteger(xa)||xa<-2||xa>2) vus.push('l\\'antécédent par g ('+xa+') n\\'est pas une graduation intérieure');
        else if(solsA.indexOf(xa)>=0) vus.push('l\\'antécédent par g tombe sur un antécédent par f : deux points confondus');
        if(q0.ka===q0.k||q0.ka===q0.kg) vus.push('la hauteur des antécédents retombe sur k ou sur kg');
        if(gl(crG[0])===q0.ka||gl(crG[1])===q0.ka) vus.push('un croisement de f et g tombe à la hauteur des antécédents : le piège « croisements » serait invisible');
        if(solsA.indexOf(q0.xta)>=0||q0.xta===xa||q0.xta<-2||q0.xta>2) vus.push('le point en trop des antécédents est un vrai antécédent ou hors bornes');
        nAntVus.add(solsA.length);
        const permOk=function(p,r){ return Array.isArray(p)&&p.length===4&&r.every(function(f){ return p.indexOf(f)>=0; }); };
        if(!permOk(q0.permE,['bon','oubli','trop','confu'])) vus.push('permE n\\'est pas une permutation des quatre formes d\\'équation');
        if(!permOk(q0.permI,['mo','mn','eo','en'])) vus.push('permI n\\'est pas une permutation des quatre coloriages');
        if(!permOk(q0.permG,['dp','dv','gp','gv'])) vus.push('permG n\\'est pas une permutation des quatre demi-droites');
        const rb=q0.permE.indexOf('bon'); rangsBonN[rb]=(rangsBonN[rb]||0)+1;
        noteRang(rangsParForme, eqgFormeIneq(qs[7]), q0.permI.indexOf(eqgFormeIneq(qs[7])));
        noteRang(rangsParForme, eqgFormeInFk(qs[3]), q0.permI.indexOf(eqgFormeInFk(qs[3])));
        noteRang(rangsParFormeG, eqgFormeInGk(qs[5]), q0.permG.indexOf(eqgFormeInGk(qs[5])));
      }
      dessins.add(JSON.stringify([q0.pts,q0.s,q0.c])); opsVus.add(q0.op); opsFVus.add(q0.opf); opsGVus.add(q0.opg);
      const g=function(x){ return q0.s*x+q0.c; };
      /* les croisements : exactement 2, sur des graduations, jamais au bord,
         hauteur lisible, et le signe de f-g change bien à chacun */
      const cr=[]; for(let x=-3;x<=3;x++){ if(q0.pts[x+3]===g(x)) cr.push(x); }
      if(cr.length!==2){ vus.push(cr.length+' croisement(s) au lieu de 2'); continue; }
      if(cr[0]<=-3||cr[1]>=3) vus.push('un croisement tombe au bord du dessin : '+cr.join(','));
      if(Math.abs(g(cr[0]))>3||Math.abs(g(cr[1]))>3) vus.push('un croisement sort du quadrillage en hauteur');
      let milieu=0;
      for(let x=-3;x<=3;x++){
        if(x===cr[0]||x===cr[1]) continue;
        const d=q0.pts[x+3]-g(x);
        if(d===0){ vus.push('f touche la droite sur une graduation qui n\\'est pas un croisement (x='+x+')'); break; }
        const attendu=(x>cr[0]&&x<cr[1])?1:-1;
        if(milieu===0 && x>cr[0]&&x<cr[1]) milieu=(d>0?1:-1);
        if(milieu!==0){ const cote=(x>cr[0]&&x<cr[1])?milieu:-milieu; if((d>0?1:-1)!==cote){ vus.push('f ne change pas de côté à chaque croisement (x='+x+')'); break; } }
      }
      if(milieu===0) vus.push('aucune graduation strictement entre les deux croisements');
      /* k : exactement 2 solutions, jamais traversé entre deux graduations */
      const sols=[]; for(let x=-3;x<=3;x++){ if(q0.pts[x+3]===q0.k) sols.push(x); }
      if(sols.length!==2) vus.push('f(x) = '+q0.k+' a '+sols.length+' solution(s) au lieu de 2');
      /* deux solutions VOISINES = un segment de spline CONSTANT à la hauteur
         k (valeurs égales, tangentes nulles) : la vraie solution serait un
         intervalle entier, pas deux nombres — l'énoncé mentirait. Ce bord a
         pris le tirage en défaut à la première exécution du contrôle. */
      if(sols.length===2 && sols[1]-sols[0]<2)
        vus.push('les deux solutions de f(x) = '+q0.k+' sont voisines ('+sols.join(',')+') : le segment entier est à cette hauteur');
      for(let i=0;i<6;i++){ const lo=Math.min(q0.pts[i],q0.pts[i+1]), hi=Math.max(q0.pts[i],q0.pts[i+1]);
        if(q0.k>lo && q0.k<hi) vus.push('la hauteur k = '+q0.k+' est traversée ENTRE deux graduations : une solution illisible'); }
      /* les images se lisent : g(b) reste dans le quadrillage */
      if(Math.abs(g(q0.b))>3) vus.push('g('+q0.b+') = '+g(q0.b)+' sort du dessin : l\\'image ne se lit pas');
      /* LE DESSIN MÊME : la courbe écrite par lvPath ne frôle ni ne recroise
         la droite hors des croisements — c'est le seul vrai risque, f moins
         une droite PENCHÉE n'étant pas monotone entre deux graduations. La
         hauteur k, elle, est déjà tenue par le bord discret : la spline est
         monotone entre deux graduations, et un premier essai qui la mesurait
         quand même criait sur les SOMMETS, où la courbe plate reste proche de
         k sans le retraverser — un contrôle qui parle d'autre chose. */
      const ech=echantillons(q0.pts);
      if(!ech){ vus.push('le chemin de lvPath ne se relit pas'); break; }
      ech.forEach(function(p){
        if(!cr.some(function(x0){ return Math.abs(p.x-x0)<0.35; }) && Math.abs(p.y-g(p.x))<0.15)
          vus.push('la courbe frôle la droite hors d\\'un croisement (x≈'+p.x.toFixed(2)+')');
      });
    }
    /* AU MOINS DIX DESSINS : la demande même de l'exercice. */
    if(!vus.length && dessins.size<10)
      vus.push('seulement '+dessins.size+' dessin(s) distinct(s) sur 300 séances — il en faut au moins 10');
    if(!vus.length && opsVus.size<4)
      vus.push('le signe de l\\'inéquation f signe g ne varie pas assez : '+Array.from(opsVus).join(','));
    if(!vus.length && (opsFVus.size<4||opsGVus.size<4))
      vus.push('les signes de f(x) signe k ('+opsFVus.size+') ou de g(x) signe k ('+opsGVus.size+') ne varient pas assez');
    if(!vus.length && nAntVus.size<2)
      vus.push('les antécédents par f ne montrent jamais les deux visages (un seul / deux) sur 300 séances');
    /* à forme égale, le rang du bon dessin varie d'une séance à l'autre —
       et une poignée de séances de repli ne suffit pas à le prouver */
    if(!vus.length){
      const nBon=Object.keys(rangsBonN).reduce(function(a,r){ return a+rangsBonN[r]; },0);
      const maxBon=Object.keys(rangsBonN).reduce(function(a,r){ return Math.max(a,rangsBonN[r]); },0);
      if(Object.keys(rangsBonN).length<3||maxBon>0.9*nBon)
        vus.push('le rang du bon dessin d\\'équation ne varie pas assez ('+Object.keys(rangsBonN).length+' rang(s), le plus fréquent '+maxBon+'/'+nBon+') : l\\'élève apprendrait le rang');
      const figes=function(map){ return Object.keys(map).filter(function(f){ return map[f].n>=10 && map[f].set.size<2; }); };
      const fI=figes(rangsParForme);
      if(fI.length) vus.push('à forme égale, le rang du bon coloriage d\\'inéquation ne varie jamais ('+fI.join(', ')+')');
      const fG=figes(rangsParFormeG);
      if(fG.length) vus.push('à forme égale, le rang de la bonne demi-droite de g(x) signe k ne varie jamais ('+fG.join(', ')+')');
    }
    /* ---- 2. les gestes, sur DEUX tirages FIXES : Q0 (le repli — deux
       antécédents par f) et Q1 (un seul antécédent par f, le singulier).
       Permutations IDENTITÉ pour lire les rangs ; la correction est la
       fonction même qui juge. Q0 : f par [-3,-2,0,3,2,-2,3], g = x+1,
       croisements -1 et 1 (f au-dessus entre les deux), k = -2 (solutions
       -2 et 2, f au-dessus entre elles), ka = 3 (antécédents 0 et 3 par f,
       2 par g), kg = 1 (solution x = 0, pente +1). ---- */
    const Q0={pts:[-3,-2,0,3,2,-2,3], s:1, c:1, k:-2, kg:1, ka:3, a:2, b:2, xtk:-1, xtg:-1, xtc:2, xta:-2,
              permE:['bon','oubli','trop','confu'], permI:['mo','mn','eo','en'], permG:['dp','dv','gp','gv']};
    const Q1={pts:[3,2,0,-3,-2,2,3], s:-1, c:-1, k:2, kg:-1, ka:-3, a:-3, b:2, xtk:-1, xtg:-1, xtc:2, xta:-2,
              permE:['bon','oubli','trop','confu'], permI:['mo','mn','eo','en'], permG:['dp','dv','gp','gv']};
    const TYPES=['img','ant','eqk','infk','gk','ingk','crx','ineq'];
    function pose(type, ops, valeurs, base){
      const B=base||Q0, o=ops||{};
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'eqg', questions:TYPES.map(function(tt){ return Object.assign({},B,{op:o.op||'ge',opf:o.opf||'ge',opg:o.opg||'ge',type:tt}); }),
        idx:TYPES.indexOf(type), score:0, maxScore:99, answers:[], startTime:Date.now(), locked:false});
      renderEqgTest();
      Object.keys(valeurs||{}).forEach(function(id){ const el=document.getElementById(id); if(el) el.value=valeurs[id]; });
      checkEqgAnswer();
      return { fb:document.getElementById('eqgFeedback').textContent,
               cls:document.getElementById('eqgFeedback').className,
               score:test.score };
    }
    const cartesEtat=function(){ return [].map.call(document.querySelectorAll('#eqgHost .ing-carte'),
      function(c){ return c.className.replace('itq-carte','').replace('ing-carte','').trim(); }).join('|'); };
    const ptsParCarte=function(sel){ return [].map.call(document.querySelectorAll('#eqgHost .ing-carte'),
      function(c){ return c.querySelectorAll(sel).length; }).join(','); };
    const montre=function(type){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'eqg', questions:TYPES.map(function(tt){ return Object.assign({},Q0,{op:'ge',opf:'ge',opg:'ge',type:tt}); }),
        idx:TYPES.indexOf(type), score:0, maxScore:99, answers:[], startTime:Date.now(), locked:false});
      renderEqgTest();
    };
    /* le trait de la méthode de l'IMAGE n'apparaît qu'à la vérification, et
       la droite de g est toujours dessinée */
    montre('img');
    if(document.querySelector('#eqgGraph .img-trait'))
      vus.push('le trait de la méthode est dessiné AVANT la vérification : il donne ce qu\\'on demande de trouver');
    if(!document.querySelector('#eqgGraph .eqg-g')) vus.push('la droite de g n\\'est pas dessinée');
    checkEqgAnswer();
    if(!document.querySelector('#eqgGraph .img-trait'))
      vus.push('après la vérification, le trait de la méthode manque sur la lecture d\\'images');
    /* les CARTES de chaque question : quatre dessins, la droite de g partout,
       les points et morceaux selon la forme, rien de marqué avant la
       vérification */
    montre('eqk');
    if(document.querySelectorAll('#eqgHost .ing-carte').length!==4) vus.push('f(x)=k : '+document.querySelectorAll('#eqgHost .ing-carte').length+' cartes au lieu de 4');
    if(cartesEtat()!=='|||') vus.push('f(x)=k : une carte est marquée avant la vérification ('+cartesEtat()+')');
    if(ptsParCarte('.ing-pt')!=='2,1,3,2') vus.push('f(x)=k : points des cartes (bon,oubli,trop,confu) = '+ptsParCarte('.ing-pt')+' au lieu de 2,1,3,2');
    if(ptsParCarte('.eqg-g')!=='1,1,1,1') vus.push('f(x)=k : la droite de g manque sur une carte ('+ptsParCarte('.eqg-g')+')');
    montre('gk');
    if(ptsParCarte('.ing-pt')!=='1,0,2,1') vus.push('g(x)=kg : points des cartes = '+ptsParCarte('.ing-pt')+' au lieu de 1,0,2,1');
    montre('crx');
    if(ptsParCarte('.ing-niv')!=='0,0,0,1') vus.push('f(x)=g(x) : la ligne horizontale ne doit vivre que sur la carte « confu » ('+ptsParCarte('.ing-niv')+')');
    if(ptsParCarte('.ing-pt')!=='2,1,3,2') vus.push('f(x)=g(x) : points des cartes = '+ptsParCarte('.ing-pt')+' au lieu de 2,1,3,2');
    montre('ant');
    if(ptsParCarte('.ing-niv')!=='1,1,1,1') vus.push('antécédents : la ligne manque sur une carte ('+ptsParCarte('.ing-niv')+')');
    if(ptsParCarte('.ing-pt')!=='3,2,4,2') vus.push('antécédents : points des cartes (bon,oubli,trop,confu) = '+ptsParCarte('.ing-pt')+' au lieu de 3,2,4,2 — l\\'oubli est le point de g');
    montre('infk');
    if(ptsParCarte('.ing-niv')!=='1,1,1,1') vus.push('f(x) signe k : la ligne manque sur une carte ('+ptsParCarte('.ing-niv')+')');
    if(ptsParCarte('.ing-rouge')!=='1,1,2,2') vus.push('f(x) signe k : morceaux rouges = '+ptsParCarte('.ing-rouge')+' au lieu de 1,1,2,2');
    if(ptsParCarte('.ing-pt')!=='2,0,4,2') vus.push('f(x) signe k : points pleins = '+ptsParCarte('.ing-pt')+' au lieu de 2,0,4,2');
    montre('ingk');
    if(ptsParCarte('.ing-niv')!=='1,1,1,1') vus.push('g(x) signe kg : la ligne manque sur une carte ('+ptsParCarte('.ing-niv')+')');
    if(ptsParCarte('.ing-rouge')!=='1,1,1,1') vus.push('g(x) signe kg : chaque carte porte UN morceau rouge sur la droite ('+ptsParCarte('.ing-rouge')+')');
    if(ptsParCarte('.ing-pt')!=='1,0,1,0') vus.push('g(x) signe kg : points pleins = '+ptsParCarte('.ing-pt')+' au lieu de 1,0,1,0');
    if(ptsParCarte('.ing-vide')!=='0,1,0,1') vus.push('g(x) signe kg : points vides = '+ptsParCarte('.ing-vide')+' au lieu de 0,1,0,1');
    /* images : justes, et la vide reçoit la correction avec le message des vides */
    let r=pose('img', null, {'eqg-fa':'-2','eqg-gb':'3'});
    if(r.score!==2 || !/\\bgood\\b/.test(r.cls)) vus.push('images justes refusées : f(2)=-2 et g(2)=3, score '+r.score);
    r=pose('img', null, {'eqg-fa':'-2'});
    if(r.fb.indexOf('Il te manquait 1 case')!==0) vus.push('image vide : le message ne dit pas la case manquante : '+r.fb.slice(0,50));
    { const el=document.getElementById('eqg-gb');
      if(!el || !el.classList.contains('sol') || el.value!=='3') vus.push('image vide : la case n\\'a pas reçu la correction'); }
    /* les antécédents : carte + par f dans l'ordre libre + par g, le doublon
       défendable une fois, la mauvaise carte montrée */
    r=pose('ant', null, {'eqg-sch':'0','eqg-af-0':'3','eqg-af-1':'0','eqg-ag':'2'});
    if(r.score!==4 || !/\\bgood\\b/.test(r.cls)) vus.push('antécédents justes (carte + 3 et 0 par f dans l\\'autre ordre + 2 par g) : score '+r.score+'/4');
    r=pose('ant', null, {'eqg-sch':'0','eqg-af-0':'0','eqg-af-1':'0','eqg-ag':'2'});
    if(r.score!==3) vus.push('le même antécédent écrit deux fois : score '+r.score+'/4 attendu 3 — défendable une fois, faux la seconde');
    r=pose('ant', null, {'eqg-sch':'1','eqg-af-0':'0','eqg-af-1':'3','eqg-ag':'2'});
    if(cartesEtat()!=='sol|bad||') vus.push('antécédents, mauvaise carte : attendu sol|bad||, vu '+cartesEtat());
    /* le SINGULIER : sur Q1, ka n'a qu'un antécédent par f — une seule case,
       et la phrase le dit au singulier */
    r=pose('ant', null, {'eqg-sch':'0','eqg-af-0':'0','eqg-ag':'2'}, Q1);
    if(r.score!==3 || !/\\bgood\\b/.test(r.cls)) vus.push('antécédent unique (Q1) juste : score '+r.score+'/3');
    if(document.getElementById('eqg-af-1')) vus.push('antécédent unique : une seconde case par f est proposée alors que f n\\'en a qu\\'un');
    if(document.getElementById('eqgHost').innerHTML.indexOf('antécédent de')<0) vus.push('antécédent unique : la phrase ne passe pas au singulier');
    /* f(x) = k : la carte + l'ordre libre des solutions, le doublon une fois */
    r=pose('eqk', null, {'eqg-sch':'0','eqg-s-0':'2','eqg-s-1':'-2'});
    if(r.score!==3) vus.push('f(x)=k juste (carte + solutions dans l\\'autre ordre) : score '+r.score+'/3');
    { const c0=document.querySelectorAll('#eqgHost .ing-carte')[0];
      if(!c0.classList.contains('ok')) vus.push('la bonne carte CHOISIE n\\'est pas bleue (ok)'); }
    r=pose('eqk', null, {'eqg-sch':'0','eqg-s-0':'-2','eqg-s-1':'-2'});
    if(r.score!==2) vus.push('la même solution écrite deux fois : score '+r.score+'/3 attendu 2 — défendable une fois, fausse la seconde');
    r=pose('eqk', null, {'eqg-sch':'2','eqg-s-0':'-2','eqg-s-1':'2'});
    if(cartesEtat()!=='sol||bad|') vus.push('mauvaise carte : attendu sol||bad|, vu '+cartesEtat());
    /* f(x) signe k : le coloriage et l'intervalle suivent le signe — f est
       AU-DESSUS de k entre les solutions -2 et 2 */
    r=pose('infk', {opf:'ge'}, {'eqg-sch':'0','eqg-co1':'[','eqg-b1':'-2','eqg-b2':'2','eqg-cf1':']'});
    if(r.score!==5) vus.push('f(x) ≥ k : carte + S = [-2 ; 2] refusés, score '+r.score+'/5');
    r=pose('infk', {opf:'lt'}, {'eqg-sch':'3','eqg-co1':'[','eqg-b1':'-3','eqg-b2':'-2','eqg-cf1':'[','eqg-co2':']','eqg-b3':'2','eqg-b4':'3','eqg-cf2':']'});
    if(r.score!==9) vus.push('f(x) < k : carte + S = [-3 ; -2[ ∪ ]2 ; 3] refusés, score '+r.score+'/9');
    /* sur Q1 le côté S'INVERSE (f au-dessous de k entre les solutions) : un
       côté figé dans le code passerait Q0 sans broncher */
    r=pose('infk', {opf:'ge'}, {'eqg-sch':'2','eqg-co1':'[','eqg-b1':'-3','eqg-b2':'-2','eqg-cf1':']','eqg-co2':'[','eqg-b3':'2','eqg-b4':'3','eqg-cf2':']'}, Q1);
    if(r.score!==9) vus.push('f(x) ≥ k sur Q1 (f au-dessous entre les solutions) : S = [-3 ; -2] ∪ [2 ; 3] refusé, score '+r.score+'/9');
    /* g(x) = kg : la carte + LA solution, sur la droite */
    r=pose('gk', null, {'eqg-sch':'0','eqg-s-0':'0'});
    if(r.score!==2 || !/\\bgood\\b/.test(r.cls)) vus.push('g(x)=1 juste (carte + S={0}) : score '+r.score+'/2');
    r=pose('gk', null, {'eqg-sch':'3','eqg-s-0':'0'});
    if(r.score!==1) vus.push('g(x)=1 avec la carte « lu sur f » : score '+r.score+'/2 attendu 1');
    /* g(x) signe kg : une DEMI-DROITE — la pente est +1, donc ≥ va à droite */
    r=pose('ingk', {opg:'ge'}, {'eqg-sch':'0','eqg-co1':'[','eqg-b1':'0','eqg-b2':'3','eqg-cf1':']'});
    if(r.score!==5) vus.push('g(x) ≥ kg : carte + S = [0 ; 3] refusés, score '+r.score+'/5');
    r=pose('ingk', {opg:'lt'}, {'eqg-sch':'3','eqg-co1':'[','eqg-b1':'-3','eqg-b2':'0','eqg-cf1':'['});
    if(r.score!==5) vus.push('g(x) < kg : carte + S = [-3 ; 0[ refusés, score '+r.score+'/5');
    /* f(x) = g(x) : la carte + les croisements, ordre libre */
    r=pose('crx', null, {'eqg-sch':'0','eqg-s-0':'1','eqg-s-1':'-1'});
    if(r.score!==3) vus.push('f(x)=g(x) juste (carte + croisements -1 et 1 dans l\\'autre ordre) : score '+r.score+'/3');
    /* l'inéquation f signe g : f au-dessus entre -1 et 1 ; permI identité :
       ge=mo(0), gt=mn(1), le=eo(2), lt=en(3) */
    r=pose('ineq', {op:'ge'}, {'eqg-sch':'0','eqg-co1':'[','eqg-b1':'-1','eqg-b2':'1','eqg-cf1':']'});
    if(r.score!==5) vus.push('f(x) ≥ g(x) : carte + S = [-1 ; 1] refusés, score '+r.score+'/5');
    r=pose('ineq', {op:'lt'}, {'eqg-sch':'3','eqg-co1':']','eqg-b1':'1','eqg-b2':'3','eqg-cf1':']','eqg-co2':'[','eqg-b3':'-3','eqg-b4':'-1','eqg-cf2':'['});
    if(r.score!==9) vus.push('f(x) < g(x) : l\\'union écrite droite-gauche est refusée, score '+r.score+'/9');
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- La lecture de deux courbes : la fiche « images et antécédents avec
   f et g » ------------------------------------------------------------------
   Sept questions dans l'ordre de la fiche, sur le MÊME tirage : les domaines,
   les images, les antécédents par f ET par g, f(x)=k et g(x)=k, f(x) signe k,
   f(x)=g(x), f(x) signe g(x). Le risque propre a changé de nature : spline
   contre SPLINE, la garantie de la droite penchée du 2.5 ne tient plus — le
   tirage échantillonne l'écart et CE contrôle relit les courbes de Bézier que
   lvPath écrit, tirage après tirage. Et le palier est un piège de PLUS : deux
   solutions voisines à une hauteur interrogée seraient un segment entier posé
   à cette hauteur — pour les antécédents comme pour les équations, sur f
   comme sur g. */
/* LES EXERCICES BONUS D'UN DEVOIR OU D'UNE FICHE (demande de Turquet, août
   2026) : un exercice coché « bonus » vaut UN POINT — sa note /10 ramenée sur
   1 — qui s'ajoute au total SANS le faire dépasser. Le plafond est la note des
   exercices normaux, donc un bonus ne peut jamais porter la note au-delà de ce
   que le devoir vaut. Cinq bords, et n'en tenir qu'un ne tient rien :
   · le bonus AJOUTE (un devoir sans bonus ne change pas d'un cheveu) ;
   · le total ne DÉPASSE jamais le maximum ;
   · le maximum ne compte QUE les exercices normaux (sinon le bonus rendrait le
     devoir plus dur : 10 points de plus à trouver pour 1 point offert) ;
   · un devoir qui n'aurait QUE des bonus retombe sur le comportement normal —
     un bonus n'a de sens qu'en PLUS de quelque chose ;
   · un bonus est FACULTATIF : dans une fiche à ordre imposé, il n'est jamais
     verrouillé et ne bloque jamais la suite.
   Plus l'éditeur, qui doit emporter le drapeau sans jamais écrire le défaut,
   et l'écran de l'élève, qui doit AFFICHER le bonus sur 1 et non sur 10. */
function exercicesBonus(w, P){
  const present = evaluer(w, "typeof dmTotal==='function' && typeof dmEstBonus==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les exercices bonus : 1 point chacun, sans dépasser le maximum',
      'ce niveau n\'a pas les exercices bonus');
    return;
  }
  verifierEval(w, 'les exercices bonus : 1 point chacun, sans dépasser le maximum', `(function(){
    const vus=[];
    const N=function(note,fait,bonus){ return {note:note, fait:fait!==false, bonus:!!bonus}; };
    /* ---- 1. le bonus AJOUTE, sur 1 point ---- */
    const sans=dmTotal([N(7),N(6)]);
    if(sans.somme!==13||sans.totMax!==20) vus.push('sans bonus, le total a changé : '+JSON.stringify(sans));
    const avec=dmTotal([N(7),N(6),N(8,true,true)]);
    if(avec.totMax!==20) vus.push('le maximum compte le bonus : '+avec.totMax+' au lieu de 20');
    if(Math.abs(avec.somme-13.8)>1e-9) vus.push('un bonus à 8/10 n\\'ajoute pas 0,8 point ('+avec.somme+' au lieu de 13,8)');
    const plein=dmTotal([N(7),N(6),N(10,true,true)]);
    if(Math.abs(plein.somme-14)>1e-9) vus.push('un bonus PARFAIT n\\'ajoute pas 1 point entier ('+plein.somme+')');
    const nul=dmTotal([N(7),N(6),N(0,false,true)]);
    if(nul.somme!==13) vus.push('un bonus non fait retire des points ('+nul.somme+')');
    /* ---- 2. le total ne DÉPASSE jamais le maximum ---- */
    const cap=dmTotal([N(10),N(10),N(10,true,true)]);
    if(cap.somme!==20) vus.push('le bonus fait dépasser le maximum : '+cap.somme+' / '+cap.totMax);
    const cap1=dmTotal([N(10),N(9,true,true)]);
    if(cap1.somme!==10) vus.push('sur un seul exercice noté 10, le bonus dépasse : '+cap1.somme+' / '+cap1.totMax);
    /* près du plafond, ce qui reste à prendre est ce qui MANQUE, pas 1 */
    const presque=dmTotal([N(9.5),N(10,true,true)]);
    if(Math.abs(presque.somme-10)>1e-9) vus.push('à 9,5 + un bonus plein, la note n\\'est pas 10 ('+presque.somme+')');
    /* ---- 3. un devoir qui n'a QUE des bonus retombe sur le normal ---- */
    const tout=dmTotal([N(7,true,true),N(6,true,true)]);
    if(tout.totMax!==20||tout.somme!==13) vus.push('un devoir tout-bonus ne retombe pas sur le comportement normal : '+JSON.stringify(tout));
    /* ---- 4. « fait » suit les parties, bonus compris ---- */
    if(dmTotal([N(0,false),N(0,false)]).fait) vus.push('un devoir vierge est déclaré fait');
    if(!dmTotal([N(0,false),N(5,true,true)]).fait) vus.push('un devoir dont SEUL le bonus est fait n\\'est pas déclaré fait');
    /* ---- 5. dmEstBonus lit le drapeau, et lui seul ---- */
    if(dmEstBonus({id:'x'})) vus.push('un exercice sans drapeau est pris pour un bonus');
    if(!dmEstBonus({id:'x',bonus:true})) vus.push('le drapeau bonus n\\'est pas lu');
    if(dmEstBonus(null)||dmEstBonus(undefined)) vus.push('dmEstBonus lève ou ment sur une entrée vide');
    /* ---- 6. LE VERROU DES FICHES ignore les bonus ---- */
    if(typeof dmVerrouille==='function' && typeof dmOrdreImpose==='function'){
      currentEleve={id:'e-controle',prenom:'Contrôle'};
      const ids=Object.keys(TESTS).filter(function(k){ return TESTS[k] && TESTS[k].start; }).slice(0,3);
      if(ids.length<3) vus.push('moins de trois exercices pour éprouver le verrou');
      else {
        mesResultats=[];
        const fiche={id:'fc-b',genre:'fiche',num:1,actif:true,exercices:[
          {id:ids[0],modes:['train']}, {id:ids[1],modes:['train'],bonus:true}, {id:ids[2],modes:['train']}]};
        if(!dmOrdreImpose(fiche)) vus.push('la fiche témoin ne porte pas l\\'ordre imposé : le contrôle du verrou ne mesure rien');
        else {
          if(dmVerrouille(fiche,ids[1])) vus.push('un exercice BONUS est verrouillé alors qu\\'il est facultatif');
          if(!dmVerrouille(fiche,ids[2])) vus.push('le verrou de la fiche ne joue plus du tout : le 3e est ouvert alors que le 1er n\\'est pas fait');
          /* le 1er fait, le bonus toujours pas : le 3e doit s'OUVRIR */
          mesResultats=[{eleve_id:'e-controle', percent:100, details:{test:ids[0], mode:'train', dm:'fc-b'}}];
          if(dmVerrouille(fiche,ids[2])) vus.push('un bonus non fait BLOQUE la suite de la fiche');
          mesResultats=[];
        }
      }
    }
    /* ---- 7. l'éditeur emporte le drapeau, et n'écrit jamais le défaut ---- */
    if(typeof readEditorIntoDevoir==='function' && typeof renderDevoirEditor==='function'){
      dmList=[{id:'d-b',num:1,actif:true,titre:'t',cours:'',exercices:[]}]; dmSelId='d-b';
      if(typeof dmGenre!=='undefined') dmGenre='dm';
      renderDevoirEditor();
      const cb=document.querySelector('#dmExos input[data-mode="train"]');
      if(!cb) vus.push('l\\'éditeur n\\'a aucune ligne d\\'exercice');
      else {
        const exid=cb.dataset.ex; cb.checked=true;
        const bx=document.querySelector('#dmExos input[data-bonus="'+exid+'"]');
        if(!bx) vus.push('la case « Bonus » manque dans l\\'éditeur');
        else {
          bx.checked=true; readEditorIntoDevoir();
          const e0=(dmList[0].exercices||[]).find(function(x){ return x.id===exid; });
          if(!e0||e0.bonus!==true) vus.push('l\\'enregistrement perd le drapeau bonus ('+JSON.stringify(e0)+')');
          bx.checked=false; readEditorIntoDevoir();
          const e1=(dmList[0].exercices||[]).find(function(x){ return x.id===exid; });
          if(!e1) vus.push('l\\'exercice coché a disparu à la relecture');
          else if('bonus' in e1) vus.push('le défaut (pas bonus) s\\'écrit au lieu de rester absent ('+JSON.stringify(e1)+')');
        }
      }
    } else if(typeof dmSetBonus==='function'){
      const dev={exercices:[{id:'zz',modes:['train']}]};
      const ancien=window.dmCur; window.dmCur=function(){ return dev; };
      dmSetBonus('zz',true);
      if(dev.exercices[0].bonus!==true) vus.push('dmSetBonus ne pose pas le drapeau');
      dmSetBonus('zz',false);
      if('bonus' in dev.exercices[0]) vus.push('dmSetBonus n\\'efface pas le drapeau : le défaut s\\'écrirait');
      window.dmCur=ancien;
    } else {
      vus.push('aucun éditeur de bonus trouvé (ni readEditorIntoDevoir ni dmSetBonus)');
    }
    /* ---- 8. exercicesDevoir NORMALISE : le drapeau doit survivre ---- */
    if(typeof exercicesDevoir==='function'){
      const id0=Object.keys(TESTS)[0];
      const l=exercicesDevoir({exercices:[{id:id0,modes:['train'],bonus:true}]});
      if(!l.length||!dmEstBonus(l[0])) vus.push('exercicesDevoir efface le drapeau bonus en normalisant');
    }
    return vus.slice(0,4).join(' | ');
  })()`, function(v){ return v===''; });
}
/* Construire une fonction : l'INVERSE de la lecture graphique — le tirage
   fabrique un témoin, en DÉRIVE cinq consignes, et le juge ne relit que les
   consignes : toute courbe qui les respecte est juste, différente du témoin
   ou pas. Les bords : le témoin lisible (pas de palier, 0 jamais traversé
   entre deux graduations, 2-3 zéros, antécédent unique, ensemble de
   l'inéquation en 1-2 intervalles jamais réduits à un point), les consignes
   qui ne se recouvrent pas, le témoin qui respecte SES consignes par le juge
   même, la copie ALTERNATIVE acceptée, chaque consigne qui rougit seule, la
   copie incomplète sans couleur, le témoin vert en entraînement seulement. */
function construireFonction(w, P){
  const present = evaluer(w, "typeof startCfx==='function' && typeof cfxGen==='function' && typeof cfxJuge==='function'");
  if(!present.ok || !present.valeur){
    ignorer('construire une fonction : des consignes dérivées d\'un témoin, une courbe libre jugée sur elles seules',
      'ce niveau n\'a pas l\'exercice de construction');
    return;
  }
  verifierEval(w, 'construire une fonction : des consignes dérivées d\'un témoin, une courbe libre jugée sur elles seules', `(function(){
    const vus=[];
    const traverse=function(pts,y){ for(let i=0;i<pts.length-1;i++){ const lo=Math.min(pts[i],pts[i+1]),hi=Math.max(pts[i],pts[i+1]); if(y>lo&&y<hi) return true; } return false; };
    const ant=function(pts,y){ const o=[]; for(let i=0;i<pts.length;i++){ if(pts[i]===y) o.push(-5+i); } return o; };
    const ens=function(pts,k,op){
      const okI=function(i){ return op==='le' ? pts[i]<=k : pts[i]>=k; };
      const out=[]; let deb=null;
      for(let i=0;i<pts.length;i++){
        if(okI(i)){ if(deb===null) deb=i; }
        else if(deb!==null){ out.push([-5+deb,-5+i-1]); deb=null; }
      }
      if(deb!==null) out.push([-5+deb,-5+pts.length-1]);
      return out;
    };
    /* les gardes d'UN tirage — jouées sur 300 tirages ET sur le repli figé */
    const gardes=function(q,nom){
      const cles=Object.keys(q).filter(function(k){ return ['w','a1','a2','ya','k','op','rep'].indexOf(k)<0; });
      if(cles.length) vus.push(nom+' : la question range autre chose que le témoin, les colonnes, la hauteur et le signe : '+cles.join(','));
      if(!Array.isArray(q.w)||q.w.length!==11||q.w.some(function(v){ return !Number.isInteger(v)||v<-4||v>4; })){ vus.push(nom+' : le témoin n\\'est pas fait de 11 hauteurs entières de −4 à 4'); return; }
      for(let i=0;i<10;i++){
        if(q.w[i]===q.w[i+1]) vus.push(nom+' : le témoin a un PALIER (colonnes '+(i-5)+' et '+(i-4)+') — équation et antécédent y perdent leur sens');
        if(q.w[i]*q.w[i+1]<0) vus.push(nom+' : le témoin traverse 0 entre deux graduations — un zéro illisible');
      }
      const z=ant(q.w,0);
      if(z.length<2||z.length>3) vus.push(nom+' : '+z.length+' zéro(s) au lieu de 2 ou 3');
      if(q.ya===0||traverse(q.w,q.ya)||ant(q.w,q.ya).length!==1) vus.push(nom+' : la hauteur de l\\'antécédent est nulle, traversée ou à plusieurs antécédents');
      if(q.k===0||q.k===q.ya||traverse(q.w,q.k)) vus.push(nom+' : la hauteur de l\\'inéquation est nulle, égale à celle de l\\'antécédent, ou traversée');
      const S=ens(q.w,q.k,q.op);
      if(S.length<1||S.length>2) vus.push(nom+' : S de l\\'inéquation a '+S.length+' morceau(x) au lieu de 1 ou 2');
      if(S.some(function(pr){ return pr[0]===pr[1]; })) vus.push(nom+' : un morceau de S est réduit à un point');
      if(S.length===1&&S[0][0]===-5&&S[0][1]===5) vus.push(nom+' : S est le domaine entier — l\\'inéquation ne demande rien');
      const b=ant(q.w,q.ya)[0];
      if(q.a1===q.a2||q.a1===b||q.a2===b) vus.push(nom+' : les colonnes des consignes se recouvrent');
      if(q.w[q.a1+5]===0||q.w[q.a2+5]===0) vus.push(nom+' : une valeur donnée est nulle — elle répéterait l\\'équation');
      /* le témoin respecte SES consignes, par le juge même de la page */
      const qq=Object.assign({},q); qq.rep=q.w.slice();
      if(!cfxJuge(qq).allOk) vus.push(nom+' : le témoin ne respecte pas ses propres consignes');
    };
    const opsV=new Set();
    for(let t=0;t<300 && !vus.length;t++){ const q=cfxGen(); gardes(q,'tirage '+t); opsV.add(q.op); }
    if(!vus.length && opsV.size<2) vus.push('le signe de l\\'inéquation ne varie jamais sur 300 séances');
    gardes(Object.assign({},CFX_REPLI),'le REPLI');
    if(vus.length) return vus.join(' | ');
    /* ---- les gestes, sur le repli — la correction est la fonction qui juge ---- */
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentDM=null; currentTestId='construire-fonction';
    const monte=function(mode,rep){
      currentMode=mode;
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'cfx', questions:[Object.assign({},CFX_REPLI,{rep:rep})], idx:0, score:0, maxScore:5, answers:[], startTime:Date.now(), locked:false});
      renderCfx();
    };
    const etats=function(){ return [].map.call(document.querySelectorAll('#cfxHost .cfx-consigne'),
      function(c){ return c.classList.contains('ok')?'+':(c.classList.contains('bad')?'-':'.'); }).join(''); };
    /* 1. les cinq consignes sont des RÉPONSES (pts-case), rien n'est peint au rendu */
    monte('train', CFX_REPLI.w.slice());
    if(document.querySelectorAll('#cfxHost .cfx-consigne.pts-case').length!==5)
      vus.push('les consignes ne portent pas toutes la classe pts-case : la note affichée ne les compterait pas');
    if(etats()!=='.....') vus.push('une consigne est peinte avant la vérification ('+etats()+')');
    /* 2. une copie INCOMPLÈTE ne reçoit aucune couleur, et le message compte les manques */
    const rep7=CFX_REPLI.w.slice(); rep7[2]=null; rep7[6]=null; rep7[9]=null;
    monte('train', rep7);
    checkCfxAnswer();
    if(etats()!=='.....') vus.push('une copie incomplète peint des consignes ('+etats()+') : une courbe à moitié tracée n\\'est pas fausse');
    if(document.getElementById('cfxFeedback').textContent.indexOf('il en manque 3')<0)
      vus.push('le message de la copie incomplète ne compte pas les colonnes manquantes : '+document.getElementById('cfxFeedback').textContent.slice(0,60));
    if(test.locked) vus.push('une copie incomplète verrouille la question');
    /* 3. le témoin recopié : 5/5 — et pas de courbe verte (rien à corriger) */
    monte('train', CFX_REPLI.w.slice());
    checkCfxAnswer();
    if(test.score!==5||etats()!=='+++++') vus.push('le témoin recopié ne fait pas 5/5 ('+test.score+', '+etats()+')');
    if(document.querySelector('#cfxHost .cfx-sol')) vus.push('la courbe verte s\\'affiche sur une copie toute juste');
    /* 4. LE POINT CLÉ : une copie DIFFÉRENTE du témoin qui respecte tout est
       acceptée — le juge lit les consignes, jamais le témoin */
    const alt=CFX_REPLI.w.slice(); alt[1]=-3;
    monte('train', alt);
    checkCfxAnswer();
    if(test.score!==5) vus.push('une courbe différente du témoin mais qui respecte TOUT est refusée ('+test.score+'/5) : le juge compare au témoin');
    /* 5. chaque consigne rougit là où sa violation vit — motifs épinglés */
    const cas=[
      ['P[4]=2',  '-+++-', 'la valeur f(a1) changée (et la traversée de k qu\\'elle crée)'],
      ['P[7]=1',  '+-+++', 'l\\'image de a2 changée'],
      ['P[2]=4',  '++---', 'un second antécédent de ya (et les traversées qu\\'il crée)'],
      ['P[3]=1',  '+++-+', 'un zéro perdu'],
      ['P[5]=3',  '++-+-', 'le sommet aplati : l\\'antécédent disparaît et S change']
    ];
    cas.forEach(function(c){
      const Pm=CFX_REPLI.w.slice(); eval(c[0].replace('P','Pm'));
      monte('train', Pm);
      checkCfxAnswer();
      if(etats()!==c[1]) vus.push(c[2]+' : consignes '+etats()+' au lieu de '+c[1]);
    });
    /* 6. sur une copie fausse en ENTRAÎNEMENT : le témoin vert se montre, la
       question se verrouille, le bouton suivant arrive */
    if(!document.querySelector('#cfxHost .cfx-sol')) vus.push('le témoin vert ne se montre pas sur une copie fausse en entraînement');
    if(!test.locked) vus.push('la copie fausse d\\'entraînement ne verrouille pas');
    if(!document.getElementById('cfxNext')) vus.push('pas de bouton pour continuer après la vérification');
    /* 7. en SOUTIEN : pas de témoin, pas de verrou — l\\'élève corrige lui-même */
    const Pm=CFX_REPLI.w.slice(); Pm[3]=1;
    monte('soutien', Pm);
    checkCfxAnswer();
    if(document.querySelector('#cfxHost .cfx-sol')) vus.push('le témoin vert fuit en soutien : il souffle la réponse que le barème fait payer');
    if(test.locked) vus.push('le soutien verrouille au lieu de laisser corriger');
    if(etats()!=='+++-+') vus.push('le soutien ne peint pas la consigne fausse ('+etats()+')');
    /* 8. deux tracés en entraînement, un seul en soutien */
    currentMode='train'; startCfx();
    if(test.questions.length!==2||test.maxScore!==10) vus.push('l\\'entraînement ne fait pas deux tracés sur 10 ('+test.questions.length+', '+test.maxScore+')');
    currentMode='soutien'; startCfx();
    if(test.questions.length!==1) vus.push('le soutien ne fait pas un seul tracé');
    return vus.join(' | ');
  })()`, function(v){ return v===''; });
}
/* Les courbes de f et de g se DISTINGUENT (signalé par Turquet, août 2026 :
   « on a du mal quelquefois à savoir quelle est la courbe f et quelle est
   g ») : f et g portaient deux BLEUS (#2B50C8 et #4a5a80), que seuls les
   pointillés et de petites étiquettes séparaient — illisible sur les petites
   cartes des propositions. Trois bords : les deux encres sont de dominantes
   OPPOSÉES (f bleue, g chaude) et les étiquettes/bouts de g suivent son
   encre ; une LÉGENDE s'affiche sur les deux exercices, cartes comprises ;
   ses échantillons portent les CLASSES mêmes des courbes — une légende à
   couleurs propres pourrait contredire le dessin. */
function courbesFGSeDistinguent(w, P){
  const present = evaluer(w, "typeof fgLegende==='function' && typeof renderEqgTest==='function' && typeof renderIfgTest==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les courbes de f et de g se distinguent : deux encres, une légende',
      'ce niveau n\'a pas les exercices à deux courbes');
    return;
  }
  verifierEval(w, 'les courbes de f et de g se distinguent : deux encres, une légende', `(function(){
    const vus=[];
    /* ---- 1. les deux encres, lues dans la feuille de styles ---- */
    let css=''; document.querySelectorAll('style').forEach(function(st){ css+=st.textContent; });
    const regle=function(sel,prop){
      const i=css.indexOf(sel+'{'); if(i<0) return null;
      const bloc=css.slice(i+sel.length+1, css.indexOf('}',i));
      const j=bloc.indexOf(prop+':'); if(j<0) return null;
      let v=bloc.slice(j+prop.length+1); const k=v.indexOf(';'); if(k>=0) v=v.slice(0,k);
      return v.trim();
    };
    const hex=function(v){
      if(!v) return null;
      if(v.indexOf('var(')===0){ const nom=v.slice(4,v.indexOf(')')).trim(); const i=css.indexOf(nom+':'); if(i<0) return null; v=css.slice(i+nom.length+1, i+nom.length+30); }
      const h=v.match(/#([0-9a-fA-F]{6})/);
      if(!h) return null;
      return {r:parseInt(h[1].slice(0,2),16), b:parseInt(h[1].slice(4,6),16), brut:('#'+h[1]).toUpperCase()};
    };
    const f=hex(regle('.lv-curve','stroke')), g=hex(regle('.eqg-g','stroke'));
    if(!f||!g){ vus.push('impossible de lire les encres de .lv-curve ou .eqg-g : le contrôle ne mesure rien'); return vus.join(' | '); }
    if(!(f.b>f.r+40)) vus.push('la courbe de f n\\'est pas à dominante bleue ('+f.brut+')');
    if(!(g.r>g.b+40)) vus.push('g n\\'est pas à dominante chaude ('+g.brut+') : deux encres proches de f ne se distinguent pas');
    const cg=hex(regle('.eqg-cg','fill')), boutg=hex(regle('.ifg-boutg','fill'));
    if(!cg||cg.brut!==g.brut) vus.push('l\\'étiquette Cg ('+(cg?cg.brut:'introuvable')+') ne porte pas l\\'encre de g ('+g.brut+')');
    if(!boutg||boutg.brut!==g.brut) vus.push('les bouts de g au 2.6 ('+(boutg?boutg.brut:'introuvable')+') ne portent pas l\\'encre de g ('+g.brut+')');
    /* ---- 2. la légende, sur les DEUX exercices — dessin nu ET cartes ---- */
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    const legOk=function(host,ou){
      const leg=document.querySelector('#'+host+' .fg-leg');
      if(!leg){ vus.push('pas de légende f/g sur '+ou); return; }
      if(!leg.querySelector('line.lv-curve')) vus.push('la légende de '+ou+' ne dessine pas son échantillon de f par la classe lv-curve');
      if(!leg.querySelector('line.eqg-g')) vus.push('la légende de '+ou+' ne dessine pas son échantillon de g par la classe eqg-g');
      const t=leg.textContent;
      if(!/plein/.test(t)||!/pointill/.test(t)) vus.push('la légende de '+ou+' ne dit pas le trait avec des mots : la couleur porterait seule');
    };
    const Q0={pts:[-3,-2,2,3,1,-1,-3], s:-1, c:1, k:-3, kg:1, a:-2, b:2, xtk:0, xtg:2, xtc:0,
      permE:['bon','oubli','trop','confu'], permI:['mo','mn','eo','en']};
    currentTestId='equation-graphique';
    Object.assign(test,{kind:'eqg', questions:['img','ineq'].map(function(tt){ return Object.assign({},Q0,{op:'ge',type:tt}); }), idx:0, score:0, maxScore:99, answers:[], startTime:Date.now(), locked:false});
    renderEqgTest(); legOk('eqgHost','le 2.5 (dessin nu)');
    test.idx=1; renderEqgTest(); legOk('eqgHost','le 2.5 (question à cartes)');
    currentTestId='lecture-deux-courbes';
    Object.assign(test,{kind:'ifg', questions:ifgBuildQuestions(), idx:0, score:0, maxScore:99, answers:[], startTime:Date.now(), locked:false});
    renderIfgTest(); legOk('ifgHost','le 2.6');
    return vus.join(' | ');
  })()`, function(v){ return v===''; });
}
function lectureDeuxCourbes(w, P){
  const present = evaluer(w, "typeof startIfg==='function' && typeof ifgBuildQuestions==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la lecture de deux courbes : domaines, images, antécédents et résolutions sur un même tirage',
      'ce niveau n\'a pas l\'exercice de lecture de deux courbes');
    return;
  }
  verifierEval(w, 'la lecture de deux courbes : domaines, images, antécédents et résolutions sur un même tirage', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='lecture-deux-courbes';

    /* le dessin MÊME, relu : les cubiques de lvPath échantillonnées ici */
    const echantillons=function(pts){
      const d=lvPath(pts, function(x){ return x; }, function(y){ return y; });
      const nums=d.replace(/[MC]/g,' ').trim().split(/\\s+/).map(Number);
      if(nums.some(isNaN)) return null;
      const out=[]; let px=nums[0], py=nums[1];
      for(let i=2;i+5<nums.length;i+=6){
        const c1x=nums[i],c1y=nums[i+1],c2x=nums[i+2],c2y=nums[i+3],x1=nums[i+4],y1=nums[i+5];
        for(let t=0;t<=1.0001;t+=0.04){
          const u=1-t;
          out.push({x:u*u*u*px+3*u*u*t*c1x+3*u*t*t*c2x+t*t*t*x1,
                    y:u*u*u*py+3*u*u*t*c1y+3*u*t*t*c2y+t*t*t*y1});
        }
        px=x1; py=y1;
      }
      return out;
    };
    const sols=function(pts,dom,y){ const o=[]; for(let x=dom[0];x<=dom[1];x++){ if(pts[x+3]===y) o.push(x); } return o; };
    const traverse=function(pts,dom,y){ for(let i=dom[0]+3;i<dom[1]+3;i++){ const lo=Math.min(pts[i],pts[i+1]),hi=Math.max(pts[i],pts[i+1]); if(y>lo&&y<hi) return true; } return false; };
    const sansVois=function(l){ for(let i=1;i<l.length;i++){ if(l[i]-l[i-1]<2) return false; } return true; };

    /* ---- 1. le tirage : 250 séances, tout par sa propre arithmétique ---- */
    const dessins=new Set(), ops1=new Set(), ops2=new Set();
    for(let t=0;t<250 && !vus.length;t++){
      const qs=ifgBuildQuestions();
      if(qs.length!==7){ vus.push(qs.length+' questions au lieu de 7'); break; }
      if(qs.map(function(q){ return q.type; }).join(',')!=='dom,img,ant,eqk,ineqk,crx,ineq')
        vus.push('les questions ne suivent pas l\\'ordre de la fiche : '+qs.map(function(q){ return q.type; }).join(','));
      const q0=qs[0];
      const ref=JSON.stringify([q0.ptsF,q0.ptsG,q0.domF,q0.domG,q0.k1,q0.k2,q0.a1,q0.a2,q0.b1,q0.b2,q0.op1,q0.op2]);
      if(qs.some(function(q){ return JSON.stringify([q.ptsF,q.ptsG,q.domF,q.domG,q.k1,q.k2,q.a1,q.a2,q.b1,q.b2,q.op1,q.op2])!==ref; }))
        vus.push('le tirage CHANGE d\\'une question à l\\'autre — le même dessin doit servir aux sept');
      qs.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return ['ptsF','ptsG','domF','domG','k1','k2','a1','a2','b1','b2','op1','op2','type'].indexOf(k)<0; });
        if(cles.length) vus.push('la question range autre chose que les courbes, les domaines, k1, k2, les abscisses et les signes : '+cles.join(','));
      });
      dessins.add(JSON.stringify([q0.ptsF,q0.ptsG,q0.domF,q0.domG])); ops1.add(q0.op1); ops2.add(q0.op2);
      const dF=q0.domF, dG=q0.domG;
      /* les domaines : dans le cadre, assez longs, et DIFFÉRENTS */
      if(dF[0]<-3||dF[1]>3||dF[1]-dF[0]<4) vus.push('le domaine de f est invraisemblable : ['+dF.join(';')+']');
      if(dG[0]<-3||dG[1]>3||dG[1]-dG[0]<4) vus.push('le domaine de g est invraisemblable : ['+dG.join(';')+']');
      if(dF[0]===dG[0]&&dF[1]===dG[1]) vus.push('les deux domaines sont égaux : la question 1 n\\'enseigne rien');
      const ca=Math.max(dF[0],dG[0]), cb=Math.min(dF[1],dG[1]);
      /* les croisements : exactement 2, strictement intérieurs au commun,
         écartés, marge >= 1 partout ailleurs, et le côté alterne */
      const cr=[]; for(let x=ca;x<=cb;x++){ if(q0.ptsF[x+3]===q0.ptsG[x+3]) cr.push(x); }
      if(cr.length!==2){ vus.push(cr.length+' croisement(s) au lieu de 2'); continue; }
      if(cr[0]<=ca||cr[1]>=cb) vus.push('un croisement tombe au bord du domaine commun : '+cr.join(','));
      if(cr[1]-cr[0]<2) vus.push('les deux croisements sont voisins');
      let milieu=0;
      for(let x=ca;x<=cb;x++){
        if(x===cr[0]||x===cr[1]) continue;
        const d=q0.ptsF[x+3]-q0.ptsG[x+3];
        if(Math.abs(d)<1){ vus.push('f est à moins de 1 de g sur une graduation qui n\\'est pas un croisement (x='+x+')'); break; }
        if(milieu===0 && x>cr[0]&&x<cr[1]) milieu=(d>0?1:-1);
        if(milieu!==0){ const cote=(x>cr[0]&&x<cr[1])?milieu:-milieu; if((d>0?1:-1)!==cote){ vus.push('f ne change pas de côté à chaque croisement (x='+x+')'); break; } }
      }
      if(milieu===0) vus.push('aucune graduation strictement entre les deux croisements');
      /* k1 : lisible pour les deux, les deux visages, jamais un palier */
      if(traverse(q0.ptsF,dF,q0.k1)||traverse(q0.ptsG,dG,q0.k1)) vus.push('k1 = '+q0.k1+' est traversé entre deux graduations : un antécédent illisible');
      const aF=sols(q0.ptsF,dF,q0.k1), aG=sols(q0.ptsG,dG,q0.k1);
      if(!((aF.length===1&&aG.length>1)||(aF.length>1&&aG.length===1)))
        vus.push('k1 ne montre pas les deux visages (f : '+aF.length+', g : '+aG.length+')');
      if(!sansVois(aF)||!sansVois(aG)) vus.push('deux antécédents de k1 sont voisins : un segment entier est à cette hauteur');
      /* k2 : deux solutions pour f, intérieures, non voisines ; 1 à 3 pour g */
      if(q0.k2===q0.k1) vus.push('k2 = k1 : deux questions sur la même hauteur');
      if(traverse(q0.ptsF,dF,q0.k2)||traverse(q0.ptsG,dG,q0.k2)) vus.push('k2 = '+q0.k2+' est traversé entre deux graduations');
      const sF=sols(q0.ptsF,dF,q0.k2), sG=sols(q0.ptsG,dG,q0.k2);
      if(sF.length!==2) vus.push('f(x) = '+q0.k2+' a '+sF.length+' solution(s) au lieu de 2');
      else{ if(sF[0]<=dF[0]||sF[1]>=dF[1]) vus.push('une solution de f(x) = k2 tombe au bord du domaine');
            if(sF[1]-sF[0]<2) vus.push('les deux solutions de f(x) = k2 sont voisines : le segment entier est à cette hauteur'); }
      if(sG.length<1||sG.length>3) vus.push('g(x) = '+q0.k2+' a '+sG.length+' solution(s)');
      if(!sansVois(sG)) vus.push('deux solutions de g(x) = k2 sont voisines');
      /* les images : abscisses distinctes, dans le domaine */
      if(q0.a1===q0.a2||q0.a1<dF[0]||q0.a2<dF[0]||q0.a1>dF[1]||q0.a2>dF[1]) vus.push('les abscisses des images par f ne conviennent pas');
      if(q0.b1===q0.b2||q0.b1<dG[0]||q0.b2<dG[0]||q0.b1>dG[1]||q0.b2>dG[1]) vus.push('les abscisses des images par g ne conviennent pas');
      /* LE DESSIN MÊME : les deux splines écrites par lvPath ne se frôlent
         jamais hors d'un croisement — spline contre spline, c'est le seul
         vrai risque, et le bord discret ne suffit plus */
      const eF=echantillons(q0.ptsF), eG=echantillons(q0.ptsG);
      if(!eF||!eG){ vus.push('le chemin de lvPath ne se relit pas'); break; }
      for(let i=0;i<eF.length;i++){
        const p=eF[i];
        if(p.x<ca-1e-6||p.x>cb+1e-6) continue;
        if(cr.some(function(x0){ return Math.abs(p.x-x0)<0.35; })) continue;
        if(Math.abs(p.y-eG[i].y)<0.15){ vus.push('les deux courbes se frôlent hors d\\'un croisement (x≈'+p.x.toFixed(2)+')'); break; }
      }
    }
    if(!vus.length && dessins.size<10)
      vus.push('seulement '+dessins.size+' dessin(s) distinct(s) sur 250 séances — il en faut au moins 10');
    if(!vus.length && (ops1.size<4||ops2.size<4))
      vus.push('les signes des inéquations ne varient pas assez ('+ops1.size+' et '+ops2.size+' sur 4)');

    /* ---- 2. les gestes, sur le tirage FIXE du repli (f : -1..3, g : -3..3,
       croisements 0 et 2, f au-dessous entre les deux, k1=3, k2=1) ---- */
    const Q0=JSON.parse(JSON.stringify(IFG_FB));
    function pose(type, op1, op2, valeurs){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'ifg', questions:['dom','img','ant','eqk','ineqk','crx','ineq'].map(function(tt){
        return Object.assign({},Q0,{op1:op1||'ge',op2:op2||'gt',type:tt}); }),
        idx:{dom:0,img:1,ant:2,eqk:3,ineqk:4,crx:5,ineq:6}[type], score:0, maxScore:99, answers:[], startTime:Date.now(), locked:false});
      renderIfgTest();
      Object.keys(valeurs||{}).forEach(function(id){ const el=document.getElementById(id); if(el) el.value=valeurs[id]; });
      checkIfgAnswer();
      return { fb:document.getElementById('ifgFeedback').textContent,
               cls:document.getElementById('ifgFeedback').className,
               score:test.score };
    }
    /* le dessin de l'énoncé : g en pointillés, les bouts des deux courbes —
       et AUCUN trait de méthode avant la vérification */
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'ifg', questions:[Object.assign({},Q0,{op1:'ge',op2:'gt',type:'eqk'})], idx:0, score:0, maxScore:5, answers:[], startTime:Date.now(), locked:false});
    renderIfgTest();
    if(!document.querySelector('#ifgGraph .eqg-g')) vus.push('la courbe de g n\\'est pas dessinée');
    if(document.querySelectorAll('#ifgGraph .ifg-bout, #ifgGraph .ifg-boutg').length!==4)
      vus.push('les bouts des courbes ne sont pas marqués : les domaines ne se lisent pas');
    if(document.querySelector('#ifgGraph .img-trait, #ifgGraph .ing-rouge'))
      vus.push('le trait de la méthode est dessiné AVANT la vérification');
    checkIfgAnswer();
    if(!document.querySelector('#ifgGraph .img-trait'))
      vus.push('après la vérification, la ligne de niveau manque sur f(x) = k');
    /* les domaines : justes, et la case vide reçoit la correction en vert */
    let r=pose('dom', 'ge', 'gt', {'ifg-df1':'-1','ifg-df2':'3','ifg-dg1':'-3','ifg-dg2':'3'});
    if(r.score!==4 || !/\\bgood\\b/.test(r.cls)) vus.push('les domaines justes sont refusés : Df=[-1;3], Dg=[-3;3], score '+r.score);
    r=pose('dom', 'ge', 'gt', {'ifg-df1':'-1','ifg-df2':'3','ifg-dg1':'-3'});
    if(r.fb.indexOf('Il te manquait 1 case')!==0) vus.push('domaine vide : le message ne dit pas la case manquante : '+r.fb.slice(0,50));
    { const el=document.getElementById('ifg-dg2');
      if(!el || !el.classList.contains('sol') || el.value!=='3') vus.push('domaine vide : la case n\\'a pas reçu la correction'); }
    /* les images, par la bonne courbe */
    r=pose('img', 'ge', 'gt', {'ifg-fa1':'1','ifg-fa2':'-1','ifg-gb1':'1','ifg-gb2':'1'});
    if(r.score!==4) vus.push('les images justes sont refusées : f(0)=1, f(1)=-1, g(-2)=1, g(2)=1, score '+r.score);
    /* les antécédents : par f ET par g, l'ordre libre, le doublon une fois */
    r=pose('ant', 'ge', 'gt', {'ifg-af-0':'3','ifg-af-1':'-1','ifg-ag-0':'-3'});
    if(r.score!==3) vus.push('les antécédents justes (ordre inversé pour f) sont refusés, score '+r.score);
    r=pose('ant', 'ge', 'gt', {'ifg-af-0':'3','ifg-af-1':'3','ifg-ag-0':'-3'});
    if(r.score!==2) vus.push('le même antécédent écrit deux fois vaut '+r.score+' au lieu de 2 : défendable une fois, faux la seconde');
    /* f(x)=k et g(x)=k ensemble, listes libres */
    r=pose('eqk', 'ge', 'gt', {'ifg-sf-0':'2','ifg-sf-1':'0','ifg-sg-0':'2','ifg-sg-1':'-2','ifg-sg-2':'0'});
    if(r.score!==5) vus.push('f(x)=1 et g(x)=1 : les listes permutées sont refusées, score '+r.score);
    /* f(x) signe k : f au-dessous de 1 entre 0 et 2, bornes = domaine de f */
    r=pose('ineqk', 'lt', 'gt', {'ifg-co1':']','ifg-b1':'0','ifg-b2':'2','ifg-cf1':'['});
    if(r.score!==4) vus.push('f(x) < 1 : S = ]0 ; 2[ refusé, score '+r.score);
    r=pose('ineqk', 'ge', 'gt', {'ifg-co1':'[','ifg-b1':'-1','ifg-b2':'0','ifg-cf1':']','ifg-co2':'[','ifg-b3':'2','ifg-b4':'3','ifg-cf2':']'});
    if(r.score!==8) vus.push('f(x) ≥ 1 : S = [-1 ; 0] ∪ [2 ; 3] refusé (les bornes sont les bouts du domaine de f), score '+r.score);
    /* f(x)=g(x) : les croisements */
    r=pose('crx', 'ge', 'gt', {'ifg-sx-0':'2','ifg-sx-1':'0'});
    if(r.score!==2) vus.push('les croisements 0 et 2 (dans l\\'autre ordre) sont refusés, score '+r.score);
    /* f(x) signe g(x) : bornes = les bouts du domaine COMMUN, union au mieux */
    r=pose('ineq', 'ge', 'le', {'ifg-co1':'[','ifg-b1':'0','ifg-b2':'2','ifg-cf1':']'});
    if(r.score!==4) vus.push('f(x) ≤ g(x) : S = [0 ; 2] refusé, score '+r.score);
    r=pose('ineq', 'ge', 'gt', {'ifg-co1':']','ifg-b1':'2','ifg-b2':'3','ifg-cf1':']','ifg-co2':'[','ifg-b3':'-1','ifg-b4':'0','ifg-cf2':'['});
    if(r.score!==8) vus.push('f(x) > g(x) : l\\'union écrite droite-gauche (bornes -1 et 3, les bouts du commun) est refusée, score '+r.score);
    /* en soutien, une case vide ne reçoit AUCUNE couleur au fil de la frappe */
    currentMode='soutien';
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'ifg', questions:[Object.assign({},Q0,{op1:'ge',op2:'gt',type:'img'})], idx:0, score:0, maxScore:4, answers:[], startTime:Date.now(), locked:false});
    renderIfgTest();
    { const el=document.getElementById('ifg-fa1'); el.value='1'; }
    ifgLive();
    { const plein=document.getElementById('ifg-fa1'), vide=document.getElementById('ifg-fa2');
      if(!plein.classList.contains('ok')) vus.push('soutien : la case juste ne verdit pas au fil de la frappe');
      if(vide.classList.contains('ok')||vide.classList.contains('bad')) vus.push('soutien : une case vide reçoit une couleur'); }
    currentMode='train';
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- Les résolutions graphiques : équations et inéquations sur quatre
   dessins -------------------------------------------------------------------
   La fiche « Exercice 2 » : UNE courbe, deux hauteurs k1 < k2 (k = 0 sort —
   la fiche l'exige, f(x) = 0), et quatre questions sur le MÊME tirage
   conservé — équation puis inéquation à chaque hauteur. Pour une équation,
   les quatre dessins ne diffèrent que par la ligne et ses points (bon,
   l'autre hauteur, un point oublié, un point en trop) ; pour une inéquation,
   ce sont les quatre coloriages du 2.4 (milieu/extérieur × pris/exclu),
   généralisés au CÔTÉ réel de f entre les croisements. Le risque propre est
   la TANGENCE : une hauteur qui touche la courbe sans la traverser
   laisserait l'inéquation sans aucun des quatre dessins proposés — l'énoncé
   mentirait avant que l'élève ne commence. */
function resolutionsGraphiques(w, P){
  const present = evaluer(w, "typeof startEig==='function' && typeof eigBuildQuestions==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les résolutions graphiques : équations et inéquations sur quatre dessins',
      'ce niveau n\'a pas l\'exercice des résolutions graphiques');
    return;
  }
  verifierEval(w, 'les résolutions graphiques : équations et inéquations sur quatre dessins', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='resolutions-graphiques';

    /* ---- 1. le tirage : 250 séances, tout par sa propre arithmétique ---- */
    let k0=0; const rangsEq=new Set(), rangsParForme={};
    for(let t=0;t<250 && !vus.length;t++){
      const qs=eigBuildQuestions();
      if(qs.length!==4){ vus.push(qs.length+' questions au lieu de 4'); break; }
      if(qs.map(function(q){ return q.type; }).join(',')!=='eq1,in1,eq2,in2')
        vus.push('les questions ne suivent pas l\\'ordre de la fiche (équation puis inéquation, hauteur basse puis haute) : '+qs.map(function(q){ return q.type; }).join(','));
      const q0=qs[0];
      const ref=JSON.stringify([q0.pts,q0.k1,q0.k2,q0.op1,q0.op2,q0.xt1,q0.xt2,q0.permE,q0.permI]);
      if(qs.some(function(q){ return JSON.stringify([q.pts,q.k1,q.k2,q.op1,q.op2,q.xt1,q.xt2,q.permE,q.permI])!==ref; }))
        vus.push('le tirage CHANGE d\\'une question à l\\'autre — le même dessin doit servir aux quatre');
      qs.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return ['pts','k1','k2','op1','op2','xt1','xt2','permE','permI','type'].indexOf(k)<0; });
        if(cles.length) vus.push('la question range autre chose que la courbe, les hauteurs, les signes, les points en trop et les ordres : '+cles.join(','));
      });
      if(!(q0.k1<q0.k2)) vus.push('k1 >= k2 : l\\'ordre de la fiche (la plus basse d\\'abord) est perdu');
      [q0.k1,q0.k2].forEach(function(k,i){
        const so=[]; for(let x=-3;x<=3;x++){ if(q0.pts[x+3]===k) so.push(x); }
        if(so.length!==2){ vus.push('f(x) = '+k+' a '+so.length+' solution(s) au lieu de 2'); return; }
        if(so[0]<=-3||so[1]>=3) vus.push('un croisement de k'+(i+1)+' tombe au bord du dessin');
        if(so[1]-so[0]<2) vus.push('les deux solutions de f(x) = '+k+' sont voisines : le segment entier est à cette hauteur');
        so.forEach(function(x){ if(x>-3&&x<3&&(q0.pts[x+2]-k)*(q0.pts[x+4]-k)>=0)
          vus.push('la hauteur '+k+' TOUCHE la courbe en x='+x+' sans la traverser : l\\'inéquation n\\'a aucun des quatre dessins'); });
        for(let j=0;j<6;j++){ const lo=Math.min(q0.pts[j],q0.pts[j+1]), hi=Math.max(q0.pts[j],q0.pts[j+1]);
          if(k>lo&&k<hi) vus.push('la hauteur '+k+' est traversée ENTRE deux graduations : une solution illisible'); }
        const xt=(i===0)?q0.xt1:q0.xt2;
        if(typeof xt!=='number'||xt<-2||xt>2) vus.push('le point en trop de k'+(i+1)+' n\\'est pas une graduation intérieure');
        else if(q0.pts[xt+3]===k) vus.push('le point en trop de k'+(i+1)+' tombe sur un vrai croisement');
      });
      if(k0===0 && (q0.k1===0||q0.k2===0)) k0=1;
      rangsEq.add(q0.permE.indexOf('bon'));
      const fi=eigFormeIneq(qs[1]);
      (rangsParForme[fi]=rangsParForme[fi]||new Set()).add(q0.permI.indexOf(fi));
    }
    if(!vus.length && !k0) vus.push('k = 0 ne sort jamais sur 250 séances : la fiche demande f(x) = 0');
    if(!vus.length && rangsEq.size<3) vus.push('le rang du bon dessin d\\'équation ne varie pas assez ('+rangsEq.size+' rang(s) vu(s)) : l\\'élève apprendrait le rang');
    if(!vus.length){
      const fig=Object.keys(rangsParForme).filter(function(f){ return rangsParForme[f].size>=2; });
      if(!fig.length) vus.push('à forme égale, le rang du bon dessin d\\'inéquation ne varie jamais');
    }

    /* ---- 2. les gestes, sur un tirage FIXE (la courbe du repli : f vaut
       -3,-1,1,3,1,-1,-3 — croisements de -1 en x=-2 et 2, de 1 en x=-1 et 1,
       f AU-DESSUS de la hauteur entre les deux croisements dans les deux
       cas ; permutations identité, donc le bon dessin est le premier) ---- */
    const Q0={pts:[-3,-1,1,3,1,-1,-3], k1:-1, k2:1, op1:'ge', op2:'ge', xt1:0, xt2:2,
      permE:['bon','autre','oubli','trop'], permI:['mo','mn','eo','en']};
    function pose(type, op1, valeurs){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'eig', questions:['eq1','in1','eq2','in2'].map(function(tt){ return Object.assign({},Q0,{op1:op1||'ge',type:tt}); }),
        idx:{eq1:0,in1:1,eq2:2,in2:3}[type], score:0, maxScore:99, answers:[], startTime:Date.now(), locked:false});
      renderEigTest();
      Object.keys(valeurs||{}).forEach(function(id){ const el=document.getElementById(id); if(el) el.value=valeurs[id]; });
      checkEigAnswer();
      return { fb:document.getElementById('eigFeedback').textContent,
               cls:document.getElementById('eigFeedback').className,
               score:test.score };
    }
    /* les quatre dessins d'une équation : la ligne partout, les points selon la forme */
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'eig', questions:[Object.assign({},Q0,{type:'eq1'})], idx:0, score:0, maxScore:5, answers:[], startTime:Date.now(), locked:false});
    renderEigTest();
    { const cartes=document.querySelectorAll('#eigHost .ing-carte');
      if(cartes.length!==4) vus.push(cartes.length+' cartes au lieu de 4');
      const pts=[].map.call(cartes,function(c){ return c.querySelectorAll('.ing-pt').length; });
      /* permE identité : bon = 2 points, autre = les 2 points de l'AUTRE
         hauteur, oubli = 1, trop = 3 */
      if(pts.join(',')!=='2,2,1,3') vus.push('les points des quatre dessins d\\'équation (bon, autre, oubli, trop) : '+pts.join(',')+' au lieu de 2,2,1,3');
      [].forEach.call(cartes,function(c,i){ if(!c.querySelector('.ing-niv')) vus.push('le dessin '+i+' n\\'a pas de ligne horizontale'); });
      const ys=[].map.call(cartes,function(c){ const n=c.querySelector('.ing-niv'); return n?n.getAttribute('y1'):''; });
      if(ys[0]===ys[1]) vus.push('le dessin « autre hauteur » porte la MÊME ligne que le bon');
      if(ys[0]!==ys[2]||ys[0]!==ys[3]) vus.push('« oubli » et « trop » doivent garder la ligne de la bonne hauteur');
    }
    /* équation juste, abscisses et S dans l'ordre INVERSE : l'ordre est libre */
    let r=pose('eq1', 'ge', {'eig-sch':'0','eig-a-0':'2','eig-a-1':'-2','eig-s-0':'2','eig-s-1':'-2'});
    if(r.score!==5 || !/\\bgood\\b/.test(r.cls)) vus.push('l\\'équation juste avec les abscisses dans l\\'autre ordre est refusée, score '+r.score+'/5');
    { const carte=document.querySelectorAll('#eigHost .ing-carte')[0];
      if(!carte || !carte.classList.contains('ok')) vus.push('la bonne carte CHOISIE n\\'est pas bleue (ok)'); }
    /* le doublon : défendable une fois, faux la seconde */
    r=pose('eq1', 'ge', {'eig-sch':'0','eig-a-0':'-2','eig-a-1':'-2','eig-s-0':'-2','eig-s-1':'2'});
    if(r.score!==4) vus.push('la même abscisse écrite deux fois : la paire vaut '+(r.score-3)+' au lieu de 1 (score '+r.score+')');
    /* le mauvais dessin choisi : la bonne carte se MONTRE en vert, la choisie rougit,
       et la case rouge porte la bonne réponse en VERT à côté — en LIBELLÉ (« A »),
       jamais en valeur interne (« 0 ») — demande de Turquet, août 2026 */
    r=pose('eq1', 'ge', {'eig-sch':'1','eig-a-0':'-2','eig-a-1':'2','eig-s-0':'-2','eig-s-1':'2'});
    { const cartes=document.querySelectorAll('#eigHost .ing-carte');
      if(!cartes[0].classList.contains('sol')) vus.push('la bonne carte ne se montre pas en vert quand l\\'élève en a choisi une autre');
      if(!cartes[1].classList.contains('bad')) vus.push('la carte choisie à tort ne rougit pas');
      const b=document.getElementById('eig-sch').nextElementSibling;
      if(!(b&&b.classList&&b.classList.contains('mf-cor'))) vus.push('la case rouge du dessin n\\'a pas la bonne réponse en vert à côté');
      else if(b.textContent!=='A') vus.push('le badge de la case rouge écrit « '+b.textContent+' » au lieu du libellé « A »'); }
    /* et une abscisse fausse porte aussi son badge, au libellé du nombre */
    r=pose('eq1', 'ge', {'eig-sch':'0','eig-a-0':'-1','eig-a-1':'2','eig-s-0':'-2','eig-s-1':'2'});
    { const b=document.getElementById('eig-a-0').nextElementSibling;
      if(!(b&&b.classList&&b.classList.contains('mf-cor'))) vus.push('l\\'abscisse fausse n\\'a pas la bonne réponse en vert à côté');
      else if(b.textContent.indexOf('2')<0) vus.push('le badge de l\\'abscisse fausse n\\'écrit pas le nombre attendu : « '+b.textContent+' »'); }
    /* une case vide ne rougit JAMAIS : elle reçoit la correction en bleu */
    r=pose('eq1', 'ge', {'eig-sch':'0','eig-a-0':'-2','eig-a-1':'2','eig-s-0':'-2'});
    { const el=document.getElementById('eig-s-1');
      if(el.classList.contains('bad')) vus.push('la case vide ROUGIT à la vérification');
      if(!el.classList.contains('sol') || el.value!=='2') vus.push('la case vide n\\'a pas reçu la correction en bleu (2)');
      if(r.fb.indexOf('Il te manquait 1 case')!==0) vus.push('le message ne dit pas d\\'abord la case manquante : '+r.fb.slice(0,60)); }
    /* l'inéquation ≥ : f au-dessus entre -2 et 2 → le milieu, pris (forme mo) */
    r=pose('in1', 'ge', {'eig-sch':'0','eig-d1':'-2','eig-p1':'oui','eig-d2':'2','eig-p2':'oui','eig-co1':'[','eig-b1':'-2','eig-b2':'2','eig-cf1':']'});
    if(r.score!==9) vus.push('f(x) ≥ -1 : S = [-2 ; 2] refusé, score '+r.score+'/9');
    /* l'inéquation < : l'extérieur exclu (forme en), les deux morceaux et
       l'union dans l'AUTRE ordre — jugés au mieux, la règle du 2.4 */
    r=pose('in1', 'lt', {'eig-sch':'3','eig-d1':'2','eig-p1':'non','eig-d2':'3','eig-p2':'oui','eig-d3':'-3','eig-p3':'oui','eig-d4':'-2','eig-p4':'non',
      'eig-co1':']','eig-b1':'2','eig-b2':'3','eig-cf1':']','eig-co2':'[','eig-b3':'-3','eig-b4':'-2','eig-cf2':'['});
    if(r.score!==17) vus.push('f(x) < -1 : les deux morceaux écrits droite-gauche sont refusés, score '+r.score+'/17');
    /* en soutien, une case vide ne reçoit AUCUNE couleur au fil du choix */
    currentMode='soutien';
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'eig', questions:[Object.assign({},Q0,{type:'eq1'})], idx:0, score:0, maxScore:5, answers:[], startTime:Date.now(), locked:false});
    renderEigTest();
    { const a0=document.getElementById('eig-a-0'); a0.value='-2'; }
    eigLive();
    { const plein=document.getElementById('eig-a-0'), vide=document.getElementById('eig-a-1');
      if(!plein.classList.contains('ok')) vus.push('soutien : la case juste ne bleuit pas au fil du choix');
      if(vide.classList.contains('ok')||vide.classList.contains('bad')) vus.push('soutien : une case vide reçoit une couleur'); }
    /* en soutien, la vérification n'affiche PAS le badge : l'élève corrige lui-même */
    document.getElementById('eig-sch').value='1'; document.getElementById('eig-a-1').value='2';
    document.getElementById('eig-s-0').value='-2'; document.getElementById('eig-s-1').value='2';
    checkEigAnswer();
    { const b=document.getElementById('eig-sch').nextElementSibling;
      if(b&&b.classList&&b.classList.contains('mf-cor')) vus.push('soutien : le badge vert révèle la bonne réponse'); }
    currentMode='train';
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- Les fractions décimales : le dénominateur vide ne condamne personne --
   Signalé par Turquet sur une capture (août 2026, le 1.7 en soutien) : sur
   « 0,04 × 17 », le 4 tapé au numérateur ROUGISSAIT pendant que l'élève
   écrivait son dénominateur — le vide valait 1 (la convention du facteur
   entier, correcte au contrôle final) et 4/1 se comparait à 4/100. La règle
   des paires, encore : un numérateur seul se juge sur sa PROMESSE — « ok »
   s'il est déjà juste en entier (le 17), rien s'il peut encore mener à une
   fraction égale (le 4), rouge seulement s'il ne mène nulle part. Et à la
   vérification, une case restée VIDE ne reçoit jamais de couleur
   (marqueSaufVide, partagé par les quatre exercices à facteur entier :
   1.7, 1.8, 2.2.7, 2.3.7). */
function fractionsDecimalesVides(w, P){
  const present = evaluer(w, "typeof startMultDec==='function' && typeof checkMDAnswer==='function'");
  if(!present.ok || !present.valeur){
    ignorer('les fractions décimales : le dénominateur vide ne condamne personne',
      'ce niveau n\'a pas l\'exercice des multiplications de décimaux');
    return;
  }
  verifierEval(w, 'les fractions décimales : le dénominateur vide ne condamne personne', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='soutien'; currentDM=null;
    currentTestId='mult-decimaux';
    /* la question de la capture : 0,04 × 17 */
    const Q={fA:{num:4,den:100}, fB:{num:17,den:1}, numD:17, numS:4, prodNum:68, prodDen:100,
             tensD:1, unitsD:7, carry1:2, u:8, t:6, h:0, three:false, aStr:'0,04', bStr:'17', decStr:'0,68'};
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'md', questions:[JSON.parse(JSON.stringify(Q))], idx:0, score:0,
      answers:[], startTime:Date.now(), locked:false});
    renderMDTest();
    const cl=function(id){ const c=document.getElementById(id).classList;
      return c.contains('ok')?'ok':(c.contains('bad')?'bad':'rien'); };
    const pose=function(id,v){ document.getElementById(id).value=v; };
    /* 1. en direct : le 4 sans dénominateur ne reçoit RIEN */
    pose('md1n','4'); checkMDAnswer(true);
    if(cl('md1n')!=='rien') vus.push('le 4 de 0,04 est « '+cl('md1n')+' » pendant que son dénominateur est vide');
    /* 2. le facteur ENTIER, lui, verdit tout de suite : 17 sans dénominateur est déjà juste */
    pose('md2n','17'); checkMDAnswer(true);
    if(cl('md2n')!=='ok') vus.push('le 17 (facteur entier, dénominateur vide) est « '+cl('md2n')+' » au lieu de ok');
    /* 3. un numérateur qui ne mène nulle part rougit quand même */
    pose('md1n','0'); checkMDAnswer(true);
    if(cl('md1n')!=='bad') vus.push('un 0 au numérateur (aucun dénominateur possible) est « '+cl('md1n')+' » au lieu de bad');
    /* 4. la paire complète se juge : 4/100 ok, 3/100 bad */
    pose('md1n','4'); pose('md1d','100'); checkMDAnswer(true);
    if(cl('md1n')!=='ok'||cl('md1d')!=='ok') vus.push('4/100 en direct : '+cl('md1n')+'/'+cl('md1d')+' au lieu de ok/ok');
    pose('md1n','3'); checkMDAnswer(true);
    if(cl('md1n')!=='bad') vus.push('3/100 en direct : le numérateur est « '+cl('md1n')+' » au lieu de bad');
    /* 5. à la VÉRIFICATION, une case vide ne reçoit aucune couleur — le
       numérateur faux en entier, lui, rougit à bon droit */
    pose('md1n','4'); pose('md1d',''); pose('md2n',''); pose('md2d','');
    checkMDAnswer();
    if(cl('md1n')!=='bad') vus.push('vérification : 4 sans dénominateur (réponse entière fausse) est « '+cl('md1n')+' » au lieu de bad');
    if(cl('md1d')!=='rien') vus.push('vérification : le dénominateur VIDE est « '+cl('md1d')+' » — une case vide ne rougit jamais');
    if(cl('md2n')!=='rien') vus.push('vérification : le numérateur VIDE est « '+cl('md2n')+' » — une case vide ne rougit jamais');
    /* 6. les quatre exercices à facteur entier partagent la même marque —
       depuis la capture du 616, la paire passe par marqueFracSaufVide */
    const src=document.documentElement.outerHTML;
    ['hsAn','bsAn','md1n','u1n'].forEach(function(id){
      if(src.indexOf("marqueFracSaufVide('"+id+"'")<0) vus.push('l\\'exercice de « '+id+' » ne passe pas par marqueFracSaufVide');
    });
    currentMode='train';
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- La paire fausse ne rougit que sa case fautive ------------------------
   Signalé par Turquet sur une capture (août 2026, le 1.7) : sur 0,08 × 0,77,
   le produit écrit 616/100000 rougissait ses DEUX cases — « la case 616 ne
   doit pas être rouge car correct ». Un seul verdict de paire peignait les
   deux cellules d'une fraction (marqueSaufVide appelé deux fois avec le même
   ok). Quand la paire ne fait pas la bonne fraction, chaque case se juge
   seule contre la valeur CANONIQUE — celle que l'énoncé fait écrire — dans
   les quatre écrans de la famille (1.7, 1.8, 2.2.7, 2.3.7), à la
   vérification comme en direct. Toute fraction ÉGALE reste acceptée. */
function paireFausseCaseFautive(w, P){
  const present = evaluer(w, "typeof marqueFracSaufVide==='function' && typeof checkMDAnswer==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la paire fausse ne rougit que sa case fautive (1.7, 1.8, 2.2.7, 2.3.7)',
      'ce niveau n\'a pas la famille des multiplications de décimaux');
    return;
  }
  verifierEval(w, 'la paire fausse ne rougit que sa case fautive (1.7, 1.8, 2.2.7, 2.3.7)', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentDM=null; currentTestId='mult-decimaux';
    const Q={aStr:'0,08', bStr:'0,77', fA:{num:8,den:100}, fB:{num:77,den:100}, prodNum:616, prodDen:10000,
             decStr:'0,0616', tensD:7, unitsD:7, numS:8, carry1:'5', t:'1', u:'6', h:'6', three:true};
    const pose=function(valeurs, mode){
      currentMode=mode||'train';
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'md', questions:[Q], idx:0, score:0, answers:[], startTime:Date.now(), locked:false});
      show('mdtest'); renderMDTest();
      Object.keys(valeurs).forEach(function(id){ const el=document.getElementById(id); if(el) el.value=valeurs[id]; });
      checkMDAnswer();
    };
    const teinte=function(id){ const el=document.getElementById(id);
      return el.classList.contains('ok')?'ok':el.classList.contains('bad')?'bad':'rien'; };
    /* la copie JUSTE d'abord : si elle ne passe pas, c'est le contrôle qui a tort */
    pose({md1n:'8',md1d:'100',md2n:'77',md2d:'100',md3n:'616',md3d:'10000',mdDec:'0,0616'});
    ['md1n','md1d','md2n','md2d','md3n','md3d','mdDec'].forEach(function(id){
      if(teinte(id)!=='ok') vus.push('copie juste : '+id+' est '+teinte(id)); });
    /* LA CAPTURE : 616/100000 — le 616 reste juste, seul le dénominateur rougit */
    pose({md1n:'8',md1d:'100',md2n:'77',md2d:'100',md3n:'616',md3d:'100000',mdDec:'0,0616'});
    if(teinte('md3n')!=='ok') vus.push('la capture : 616 est '+teinte('md3n')+' au lieu de ok');
    if(teinte('md3d')!=='bad') vus.push('la capture : 100000 est '+teinte('md3d')+' au lieu de rouge');
    /* le miroir : 1232/10000 — le dénominateur canonique reste juste */
    pose({md1n:'8',md1d:'100',md2n:'77',md2d:'100',md3n:'1232',md3d:'10000',mdDec:'0,0616'});
    if(teinte('md3n')!=='bad') vus.push('miroir : 1232 est '+teinte('md3n')+' au lieu de rouge');
    if(teinte('md3d')!=='ok') vus.push('miroir : 10000 est '+teinte('md3d')+' au lieu de ok');
    /* toute fraction ÉGALE reste acceptée, même sans être la canonique */
    pose({md1n:'8',md1d:'100',md2n:'77',md2d:'100',md3n:'308',md3d:'5000',mdDec:'0,0616'});
    if(teinte('md3n')!=='ok'||teinte('md3d')!=='ok') vus.push('308/5000 (fraction égale) refusée : '+teinte('md3n')+'/'+teinte('md3d'));
    /* en DIRECT (soutien), la même règle au fil de la frappe */
    currentMode='soutien';
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'md', questions:[Q], idx:0, score:0, answers:[], startTime:Date.now(), locked:false});
    show('mdtest'); renderMDTest();
    document.getElementById('md3n').value='616'; document.getElementById('md3d').value='100000';
    checkMDAnswer(true);
    if(teinte('md3n')!=='ok') vus.push('en direct : 616 est '+teinte('md3n')+' au lieu de ok');
    if(teinte('md3d')!=='bad') vus.push('en direct : 100000 est '+teinte('md3d')+' au lieu de rouge');
    /* la famille entière est branchée : les trois autres écrans passent par le
       même helper — on lit les SOURCES, un appel de paire revenu à
       marqueSaufVide double ne se verrait sur aucun geste du 1.7 */
    ['checkUAnswer','checkHSAnswer','checkBSAnswer'].forEach(function(fn){
      const src=String(window[fn]);
      if(src.indexOf('marqueFracSaufVide(')<0) vus.push(fn+' ne passe pas par marqueFracSaufVide');
      const paires=src.match(/marqueSaufVide\\('[a-z]+[0-9]?[nd]'/g)||[];
      if(paires.length) vus.push(fn+' peint encore une paire par un verdict unique : '+paires.join(','));
    });
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- Associer f à f' : la fiche 9, purement graphique ---------------------
   Deux paires de courbes par séance — l'une compatible, l'autre non —,
   chacune en trois questions a/b/c sur les MÊMES dessins. Le moteur de
   courbes est PORTÉ de la Seconde au caractère près : cinq fonctions
   comparées ici entre les deux fichiers, parce qu'une copie retouchée d'un
   seul côté ferait diverger deux niveaux sans que rien ne rougisse — la
   leçon de mlFeuille et du moteur des fractions. Le reste se recompte par
   la propre arithmétique du contrôle : les sommets de f par les différences
   de ses valeurs, les zéros et signes de f' par ses valeurs mêmes — jamais
   afpSignes ni afpZeros, qui se tromperaient du même côté. */
function associerDerivee(w, P){
  const present = evaluer(w, "typeof startAfp==='function' && typeof afpBuildQuestions==='function'");
  if(!present.ok || !present.valeur){
    ignorer('associer f à f\' : deux paires par séance, l\'une compatible, l\'autre non',
      'ce niveau n\'a pas l\'exercice « Associer f et f\' »');
    return;
  }
  /* le moteur de courbes porté de la Seconde, au caractère près */
  const LV_PORT=['lvPickSubset','lvGenPts','lvAnalyze','lvTangents','lvPath'];
  const corpsLv=(texte,nom)=>{
    const f=corpsFonctions(texte, /^(?:async )?function ([A-Za-z_$][\w$]*)\s*\(/gm).find(o=>o.nom===nom);
    return f ? f.texte : null;
  };
  let srcSec;
  try{ srcSec = fs.readFileSync(path.join(__dirname, '..', 'secondes.html'), 'utf8'); }
  catch(e){ srcSec = undefined; }
  let srcTer;
  try{ srcTer = fs.readFileSync(path.join(__dirname, '..', 'terminale.html'), 'utf8'); }
  catch(e){ srcTer = undefined; }
  if(!srcSec || !srcTer){
    verifier('le moteur de courbes est identique à celui de la Seconde, au caractère près', false,
      'un des deux fichiers est introuvable');
  } else {
    const abs=LV_PORT.filter(n=>corpsLv(srcSec,n)===null || corpsLv(srcTer,n)===null);
    const diff=LV_PORT.filter(n=>corpsLv(srcSec,n)!==corpsLv(srcTer,n));
    verifier('le moteur de courbes est identique à celui de la Seconde, au caractère près',
      abs.length===0 && diff.length===0,
      abs.length ? 'introuvable : '+abs.join(', ') : 'diverge sur : '+diff.join(', '));
  }
  verifierEval(w, 'associer f à f\' : deux paires par séance, l\'une compatible, l\'autre non', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='associer-derivee';

    /* la table de f, recomptée par les DIFFÉRENCES de ses valeurs */
    const tableDeF=function(pts){
      const roots=[], s=[]; let d0=Math.sign(pts[1]-pts[0]);
      s.push(d0>0?'+':'-');
      for(let i=1;i<6;i++){ const d=Math.sign(pts[i+1]-pts[i]);
        if(d!==d0){ roots.push(i-3); s.push(d>0?'+':'-'); d0=d; } }
      return {roots:roots, s:s};
    };
    /* la table de f', recomptée sur ses valeurs mêmes */
    const tableDeFp=function(ptsp){
      const roots=[]; for(let x=-3;x<=3;x++){ if(ptsp[x+3]===0) roots.push(x); }
      const seps=[-3.5].concat(roots,[3.5]), s=[];
      for(let i=0;i<seps.length-1;i++){
        let signe=null;
        for(let x=-3;x<=3;x++){ if(x>seps[i]&&x<seps[i+1]&&ptsp[x+3]!==0){ signe=(ptsp[x+3]>0)?'+':'-'; break; } }
        s.push(signe);
      }
      return {roots:roots, s:s};
    };
    const compatibles=function(q){
      const A=tableDeF(q.pts), B=tableDeFp(q.ptsp);
      return A.roots.join(',')===B.roots.join(',') && A.s.join('')===B.s.join('');
    };

    /* ---- 1. le tirage : 200 séances ---- */
    const rangsCompat=new Set();
    for(let t=0;t<200 && !vus.length;t++){
      const qs=afpBuildQuestions();
      if(qs.length!==6){ vus.push(qs.length+' questions au lieu de 6'); break; }
      if(qs.map(function(q){ return q.type; }).join(',')!=='a,b,c,a,b,c')
        vus.push('les questions ne suivent pas l\\'ordre a, b, c de la fiche : '+qs.map(function(q){ return q.type; }).join(','));
      for(let p=0;p<2;p++){
        const tri=qs.slice(3*p, 3*p+3);
        const ref=JSON.stringify([tri[0].pts, tri[0].ptsp]);
        if(tri.some(function(q){ return JSON.stringify([q.pts,q.ptsp])!==ref; }))
          vus.push('les dessins CHANGENT au sein d\\'une paire — les trois questions a/b/c portent sur les mêmes courbes');
      }
      qs.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return ['pts','ptsp','type'].indexOf(k)<0; });
        if(cles.length) vus.push('la question range autre chose que les deux courbes et le type : '+cles.join(','));
      });
      const comps=[compatibles(qs[0]), compatibles(qs[3])];
      if(comps[0]===comps[1])
        vus.push('la séance n\\'a pas une paire compatible ET une incompatible ('+comps.join(',')+') — l\\'élève apprendrait que la réponse est toujours du même côté');
      rangsCompat.add(comps[0]?0:1);
      qs.filter(function(q,i){ return i%3===0; }).forEach(function(q){
        const A=tableDeF(q.pts);
        if(A.roots.length<1||A.roots.length>2) vus.push(A.roots.length+' sommet(s) sur la courbe de f');
        if(A.roots.some(function(r){ return r<=-3||r>=3; })) vus.push('un sommet de f au bord du dessin');
        const B=tableDeFp(q.ptsp);
        if(!B.roots.length||B.roots.length>2) vus.push(B.roots.length+' zéro(s) sur la courbe de f\\'');
        if(B.roots.some(function(r){ return r<=-3||r>=3; })) vus.push('un zéro de f\\' au bord du dessin');
        for(let i=1;i<B.roots.length;i++){ if(B.roots[i]-B.roots[i-1]<2)
          vus.push('deux zéros de f\\' voisins ('+B.roots.join(',')+') : le segment entier serait posé sur l\\'axe'); }
        if(B.s.some(function(x){ return x===null; })) vus.push('un intervalle de f\\' sans aucune graduation pour porter son signe');
        for(let i=1;i<B.s.length;i++){ if(B.s[i]===B.s[i-1])
          vus.push('f\\' ne change pas de signe à un zéro : ce ne serait pas un extremum de f'); }
        q.ptsp.forEach(function(v,i){ if(v!==0 && Math.abs(v)<1) vus.push('f\\' frôle l\\'axe sans le toucher (valeur '+v+')'); });
      });
    }
    if(!vus.length && rangsCompat.size<2)
      vus.push('la paire compatible tombe toujours au même rang : l\\'élève apprendrait le rang');

    /* ---- 2. les gestes, sur une paire FIXE (sommet de f en 0, f\\' compatible) ---- */
    const P1={pts:[-3,-1,1,3,1,-1,-3], ptsp:[2,1,3,0,-2,-1,-3]};
    const P2={pts:[-3,-1,1,3,1,-1,-3], ptsp:[-2,-1,-3,0,2,1,3]};   /* signes opposés */
    function pose(paire, type, valeurs){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'afp', questions:['a','b','c'].map(function(tt){ return Object.assign({},paire,{type:tt}); }),
        idx:{a:0,b:1,c:2}[type], score:0, answers:[], startTime:Date.now(), locked:false});
      renderAfp();
      Object.keys(valeurs||{}).forEach(function(id){ const el=document.getElementById(id); if(el) el.value=valeurs[id]; });
      checkAfp();
      return { score:test.score, fb:document.getElementById('afpFeedback').textContent,
        rouges:[].slice.call(document.querySelectorAll('#scr-afp .bad'))
          .filter(function(e){ return /^(INPUT|SELECT)$/.test(e.tagName); })
          .map(function(e){ return e.id; }) };
    }
    let r=pose(P1,'a',{ 'ef-r0':'0','ef-l0s0':'+','ef-l0s1':'\\u2212','ef-a0':'up','ef-a1':'down' });
    if(r.score!==1) vus.push('la table juste de f (sommet en 0, + puis \\u2212) est refusée');
    r=pose(P1,'b',{ 'ef-r0':'0','ef-l0s0':'\\u2212','ef-l0s1':'+','ef-a0':'down','ef-a1':'up' });
    if(r.score!==0) vus.push('la table de f\\' aux signes inversés est acceptée');
    /* la convention COMMUNE (corrCase) : la saisie fausse RESTE en rouge, la
       bonne réponse s'affiche en vert à côté — la révélation intégrale du
       premier jet peignait tout l'écran en vert sous « quelques erreurs »,
       signalé par Turquet sur une capture. */
    { const el=document.getElementById('ef-l0s0'), b=el&&el.nextElementSibling;
      if(!el || el.value!=='\u2212' || !el.classList.contains('bad'))
        vus.push('la saisie fausse doit RESTER en rouge, avec ce que l\\'élève a choisi');
      if(!b || !b.classList || !b.classList.contains('mf-cor') || b.textContent!=='+')
        vus.push('la bonne réponse en vert manque à côté de la case fausse'); }
    { const css=Array.prototype.map.call(document.querySelectorAll('style'),function(st){ return st.textContent; }).join('\\n');
      if(!/\.s1-in\.sol\s*\{/.test(css)) vus.push('aucune règle .s1-in.sol : la case vide remplie en vert s\\'écrit à l\\'encre ordinaire'); }
    /* une copie vide ne rougit pas et ne verrouille pas */
    r=pose(P1,'a',{});
    if(r.rouges.length) vus.push('une copie vide rougit : '+r.rouges.join(','));
    if(r.fb.indexOf('au moins une case')<0) vus.push('une copie vide devrait demander de compléter, pas juger');
    /* une seule case remplie : les cases VIDES ne rougissent pas non plus */
    r=pose(P1,'a',{ 'ef-r0':'0' });
    if(r.rouges.length) vus.push('des cases vides rougissent quand une seule est remplie : '+r.rouges.join(','));
    { const el=document.getElementById('ef-l0s0');
      if(!el || !el.classList.contains('sol') || el.value!=='+')
        vus.push('la case restée vide n\\'est pas remplie en vert à la vérification'); }
    /* le bord n'est atteignable qu'en SOUTIEN : en entraînement, la révélation
       en vert repasse derrière et efface le rouge — la leçon documentée des
       sabotages impossibles */
    currentMode='soutien';
    r=pose(P1,'a',{ 'ef-r0':'5' });
    if(r.rouges.indexOf('ef-r0')<0) vus.push('soutien : la case fausse ne rougit pas');
    if(r.rouges.length>1) vus.push('soutien : des cases vides rougissent : '+r.rouges.join(','));
    currentMode='train';
    /* la question c, sur les deux paires, contre l\\'arithmétique du contrôle */
    r=pose(P1,'c',{ 'afp-comp':'oui' });
    if(r.score!==1) vus.push('la paire compatible refusée quand l\\'élève répond oui');
    r=pose(P2,'c',{ 'afp-comp':'oui' });
    if(r.score!==0) vus.push('la paire aux signes opposés acceptée comme compatible');
    { const el=document.getElementById('afp-comp'), b=el&&el.nextElementSibling;
      if(!el || el.value!=='oui' || !el.classList.contains('bad'))
        vus.push('la réponse fausse de la question c doit rester en rouge, telle que choisie');
      if(!b || !b.classList || !b.classList.contains('mf-cor') || b.textContent!=='non')
        vus.push('la bonne réponse « non » en bleu manque à côté du menu'); }
    if(r.fb.indexOf('SIGNE')<0 && r.fb.indexOf('signe')<0) vus.push('le pourquoi de l\\'incompatibilité ne nomme pas le signe');
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- Le signe du premier degré : 5 questions, les trois niveaux présents --
   L'exercice en posait 15 (5 par niveau) ; Turquet en demande 5 (août 2026).
   Deux bords : le COMPTE, comparé à tests/profils.js — deux sources, comme
   SF_NB —, et la COMPOSITION : chaque niveau garde au moins une question,
   dans l'ordre des niveaux, sans quoi l'un des trois disparaîtrait en
   silence — une aide absente ne se signale pas. */
function signePremierDegre(w, P){
  const present = evaluer(w, "typeof s1BuildQuestions==='function'");
  if(!present.ok || !present.valeur || !P.nbQuestionsSignePremier){
    ignorer('le signe du premier degré pose 5 questions, les trois niveaux présents',
      'ce niveau n\'a pas l\'exercice du signe du premier degré');
    return;
  }
  verifierEval(w, 'le signe du premier degré pose 5 questions, les trois niveaux présents', `(function(){
    const vus=[];
    for(let t=0;t<40 && !vus.length;t++){
      const qs=s1BuildQuestions();
      if(qs.length!==${P.nbQuestionsSignePremier})
        vus.push(qs.length+' questions au lieu de ${P.nbQuestionsSignePremier}');
      [1,2,3].forEach(function(n){
        if(!qs.some(function(q){ return q.level===n; })) vus.push('le niveau '+n+' a disparu de la séance');
      });
      for(let i=1;i<qs.length;i++){ if(qs[i].level<qs[i-1].level)
        vus.push('les niveaux ne se suivent plus dans l\\'ordre : '+qs.map(function(q){ return q.level; }).join(',')); }
    }
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* ---- Le tableau de f depuis la courbe de f' : quatre propositions, les
   pièges de la fiche ---------------------------------------------------------
   La fiche 9, exercice 4 : la courbe de f' donnée, choisir parmi quatre
   tableaux de variations celui de f. Les distracteurs sont les pièges mêmes
   de la fiche — les SOMMETS de f' lus comme des zéros, les sens inversés, un
   zéro décalé ou manquant — et le contrôle recompte tout par sa propre
   arithmétique : zéros et signes sur les valeurs de la courbe, sommets sur
   les différences. Quatre bords silencieux : le vrai tableau qui ne colle pas
   à la courbe, deux propositions identiques (deux bonnes réponses, une seule
   comptée), le piège du sommet posé SUR un zéro (il ne piègerait plus rien),
   et la bonne qui tombe toujours au même rang — à forme égale le rang change,
   la leçon d'{intervalles-inegalite}. */
function variationsDerivee(w, P){
  const present = evaluer(w, "typeof startAfq==='function' && typeof afqBuildQuestions==='function'");
  if(!present.ok || !present.valeur){
    ignorer('le tableau de f depuis la courbe de f\' : quatre propositions, les pièges de la fiche',
      'ce niveau n\'a pas l\'exercice du tableau depuis la courbe de f\'');
    return;
  }
  verifierEval(w, 'le tableau de f depuis la courbe de f\' : quatre propositions, les pièges de la fiche', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='variations-depuis-derivee';
    const zerosDe=function(p){ const out=[]; for(let x=-3;x<=3;x++){ if(p[x+3]===0) out.push(x); } return out; };
    const signesDe=function(p, roots){
      const seps=[-3.5].concat(roots,[3.5]), out=[];
      for(let i=0;i<seps.length-1;i++){ let sg=null;
        for(let x=-3;x<=3;x++){ if(x>seps[i]&&x<seps[i+1]&&p[x+3]!==0){ sg=(p[x+3]>0)?'+':'-'; break; } }
        out.push(sg); }
      return out;
    };
    const sommetsDe=function(p){ const out=[]; let d0=Math.sign(p[1]-p[0]);
      for(let i=1;i<6;i++){ const d=Math.sign(p[i+1]-p[i]); if(d!==0&&d0!==0&&d!==d0) out.push(i-3); if(d!==0) d0=d; }
      return out;
    };
    const parRang={};
    for(let t=0;t<200 && !vus.length;t++){
      const qs=afqBuildQuestions();
      if(qs.length!==4){ vus.push(qs.length+' questions au lieu de 4'); break; }
      qs.forEach(function(q){
        const cles=Object.keys(q).filter(function(k){ return ['ptsp','perm','gard','dec'].indexOf(k)<0; });
        if(cles.length) vus.push('la question range autre chose que la courbe, l\\'ordre et les indices : '+cles.join(','));
        if(q.perm.slice().sort().join(',')!=='autre,inverse,sommets,vrai')
          vus.push('l\\'ordre n\\'est pas une permutation des quatre natures : '+q.perm.join(','));
        const zeros=zerosDe(q.ptsp);
        if(!zeros.length||zeros.length>2) vus.push(zeros.length+' zéro(s) sur la courbe de f\\'');
        if(zeros.some(function(r){ return r<=-3||r>=3; })) vus.push('un zéro de f\\' au bord du dessin');
        for(let i=1;i<zeros.length;i++){ if(zeros[i]-zeros[i-1]<2) vus.push('deux zéros voisins : '+zeros.join(',')); }
        const sg=signesDe(q.ptsp, zeros);
        if(sg.some(function(x){ return x===null; })) vus.push('un intervalle sans graduation pour porter son signe');
        for(let i=1;i<sg.length;i++){ if(sg[i]===sg[i-1]) vus.push('f\\' ne change pas de signe à un zéro'); }
        q.ptsp.forEach(function(v){ if(v!==0&&Math.abs(v)<1) vus.push('f\\' frôle l\\'axe sans le toucher'); });
        const som=sommetsDe(q.ptsp);
        if(!som.length) vus.push('aucun sommet sur la courbe de f\\' : le piège de la fiche n\\'a rien à lire');
        if(som.some(function(x){ return zeros.indexOf(x)>=0; }))
          vus.push('un sommet de f\\' tombe SUR un zéro : le piège serait la bonne réponse');
        /* les quatre tableaux affichés : le vrai colle à la courbe, et deux
           à deux différents */
        const T=afqTables(q);
        const flAtt=sg.map(function(x){ return x==='+'?'up':'down'; }).join(',');
        if(T.vrai.roots.join(',')!==zeros.join(',') || T.vrai.fleches.join(',')!==flAtt)
          vus.push('le tableau « vrai » ne colle pas à la courbe : '+T.vrai.roots.join(',')+' | '+T.vrai.fleches.join(','));
        const sigs=['vrai','sommets','inverse','autre'].map(function(k){ return T[k].roots.join(',')+'|'+T[k].fleches.join(','); });
        if(new Set(sigs).size!==4) vus.push('deux propositions identiques : deux bonnes réponses, une seule comptée');
        const forme=String(zeros.length);
        (parRang[forme]=parRang[forme]||new Set()).add(q.perm.indexOf('vrai'));
      });
    }
    if(!vus.length){
      Object.keys(parRang).forEach(function(f){
        if(parRang[f].size<2) vus.push('à forme égale ('+f+' zéro(s)), la bonne tombe toujours au rang '+Array.from(parRang[f]).join(''));
      });
    }

    /* ---- les gestes, sur une question FIXE ---- */
    const Q0={ptsp:[-1,-2,-3,0,1,2,3], perm:['sommets','vrai','autre','inverse'], gard:0, dec:1};
    function pose(valeur){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'afq', questions:[JSON.parse(JSON.stringify(Q0))], idx:0, score:0,
        answers:[], startTime:Date.now(), locked:false});
      renderAfq();
      const sel=document.getElementById('afq-sel'); if(sel && valeur!==null) sel.value=valeur;
      checkAfq();
      return { score:test.score, fb:document.getElementById('afqFeedback').textContent,
        selCls:(document.getElementById('afq-sel')||{}).className||'',
        cartes:[].slice.call(document.querySelectorAll('#afqHost .afq-carte')).map(function(e){ return e.className.replace('afq-carte','').trim(); }) };
    }
    let r=pose('1');   /* le vrai est au rang 1 (lettre b) */
    if(r.score!==1) vus.push('la bonne lettre est refusée');
    if(r.cartes[1].indexOf('ok')<0) vus.push('la bonne carte choisie ne se marque pas juste (ok)');
    r=pose('0');       /* rang 0 = le piège des sommets */
    if(r.score!==0) vus.push('le piège des sommets est accepté');
    if(r.fb.indexOf('SOMMETS')<0) vus.push('le retour ne nomme pas le piège des sommets choisi');
    if(r.cartes[0].indexOf('bad')<0 || r.cartes[1].indexOf('sol')<0) vus.push('les cartes ne montrent pas le choisi (bad) et la bonne en correction (sol)');
    r=pose('3');       /* rang 3 = les sens inversés */
    if(r.fb.indexOf('INVERSE')<0) vus.push('le retour ne nomme pas l\\'inversion des sens choisie');
    r=pose(null);      /* rien choisi */
    if(r.fb.indexOf('Choisis un tableau')<0) vus.push('une copie vide devrait demander de choisir, pas juger');
    if(/\\bbad\\b/.test(r.selCls)) vus.push('le menu vide rougit');
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
/* Les réglages PAR EXERCICE d'un devoir : le NOMBRE DE QUESTIONS et la NOTE
   MAXIMALE EN SOUTIEN (demande de Turquet, août 2026). Quatre bords, et n'en
   tenir qu'un ne tient rien : le plafond entre dans la note (et une valeur
   bricolée retombe sur 5) ; la coupe s'applique au lancement DEPUIS le devoir
   (et une valeur au-delà du format retombe dessus, et rien ne fuit hors du
   devoir) ; l'écran des modes DIT le plafond et lance par l'entonnoir ; et
   l'éditeur EMPORTE les réglages (et n'écrit jamais le défaut). En Terminale,
   l'énoncé du circuit papier porte la même coupe : la feuille du professeur
   doit montrer exactement la séance de l'élève. SÉQUENTIEL, dans la chaîne
   des contrôles asynchrones — il ré-injecte le double de la base. */
function reglagesDevoirs(w, apres){
  const R=P.reglagesDevoirs;
  const present = evaluer(w, "typeof lancerDevoirExo==='function' && typeof dmPlafondSoutien==='function'");
  if(!R || !present.ok || !present.valeur){
    ignorer('les réglages par exercice d\'un devoir : nombre de questions et plafond du soutien',
      'ce niveau n\'a pas les réglages par exercice des devoirs');
    return verdictColore(w, apres);
  }
  /* Première : l'éditeur passe par saveDM(), qu'on ne peut pas cliquer ici —
     on tient au moins la trace des réglages dans son corps, et les setters
     s'exercent dans l'éval. */
  const srcPage=lire(CIBLE);
  if(/async function saveDM\(/.test(srcPage)){
    const corpsSave=(srcPage.split('async function saveDM(')[1]||'').slice(0,1600);
    verifier('saveDM emporte les réglages nbQ et smax',
      corpsSave.indexOf('nbQ')>=0 && corpsSave.indexOf('smax')>=0,
      'le corps de saveDM ne recopie plus nbQ/smax : un devoir enregistré les perdrait');
  }
  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    const EX=${JSON.stringify(R.exercice)};

    /* ---- 1. le plafond du soutien entre dans la note ---- */
    const nDE=function(bs,be,smax){ return (typeof noteForcee==='function')?noteDevoirExo(bs,be,undefined,smax):noteDevoirExo(bs,be,smax); };
    if(nDE({percent:100},null).note!==5) vus.push('sans réglage, le soutien plein ne vaut pas 5 ('+nDE({percent:100},null).note+')');
    if(nDE({percent:100},null,8).note!==8) vus.push('le plafond réglé à 8 ne donne pas 8 ('+nDE({percent:100},null,8).note+')');
    if(nDE({percent:50},null,8).note!==4) vus.push('à mi-parcours sous un plafond de 8, la note n\\'est pas 4');
    if(nDE({percent:100},null,12).note!==5) vus.push('un plafond bricolé (12) ne retombe pas sur 5');
    if(nDE({percent:100},null,'abc').note!==5) vus.push('un plafond illisible ne retombe pas sur 5');
    if(nDE({percent:100},{percent:100},8).note!==10) vus.push('l\\'entraînement plein ne l\\'emporte plus sur un soutien plafonné à 8');
    if(typeof noteForcee==='function'){
      const f=noteDevoirExo({percent:100},null,3,8);
      if(f.note!==3) vus.push('la note posée par le professeur ne prime plus sur le plafond réglé ('+f.note+')');
    }

    /* ---- 2. la coupe du nombre de questions, au lancement depuis le devoir ---- */
    mesDevoirs=[{id:'dev-r',num:1,actif:true,titre:'Réglages',cours:'',exercices:[{id:EX,modes:['soutien','train']}]}];
    await lancerDevoirExo('dev-r',EX,'train');
    const defaut=(test.questions||[]).length;
    if(defaut<3) vus.push('le témoin ne tire que '+defaut+' questions : la coupe n\\'a rien à éprouver');
    mesDevoirs[0].exercices[0].nbQ=2;
    await lancerDevoirExo('dev-r',EX,'train');
    if((test.questions||[]).length!==2) vus.push('nbQ=2 : la séance fait '+(test.questions||[]).length+' questions au lieu de 2');
    if(test.idx!==0) vus.push('après la coupe, la séance ne repart pas de la première question');
    mesDevoirs[0].exercices[0].nbQ=99;
    await lancerDevoirExo('dev-r',EX,'train');
    if((test.questions||[]).length!==defaut) vus.push('nbQ=99 : une valeur au-delà du format ne retombe pas dessus ('+(test.questions||[]).length+')');
    /* le réglage ne FUIT pas hors du devoir */
    mesDevoirs[0].exercices[0].nbQ=2; currentDM=null; currentTestId=EX;
    await Promise.resolve(TESTS[EX].start());
    if((test.questions||[]).length!==defaut) vus.push('hors devoir, la séance porte la coupe du devoir ('+(test.questions||[]).length+')');

    /* ---- 3. l'écran des modes dit le plafond, et lance par l'entonnoir ---- */
    mesDevoirs[0].exercices[0]={id:EX,modes:['soutien','train'],smax:8};
    await (typeof openTestDevoirModes==='function'?openTestDevoirModes:openTestDevoir)('dev-r',EX);
    const htmlModes=document.getElementById('modeChoices').innerHTML;
    if(htmlModes.indexOf('8 points')<0) vus.push('la carte du soutien ne dit pas le plafond réglé (8)');
    if(htmlModes.indexOf('lancerDevoirExo')<0) vus.push('les cartes du devoir ne passent plus par l\\'entonnoir lancerDevoirExo');

    /* ---- 4. Terminale : l'énoncé du circuit papier porte la même coupe ---- */
    if(typeof dmEnonce==='function'){
      mesDevoirs[0].exercices[0]={id:EX,modes:['train'],nbQ:2};
      await dmEnonce('dev-r',EX,function(){});
      if((test.questions||[]).length!==2) vus.push('l\\'énoncé du circuit papier ignore la coupe ('+(test.questions||[]).length+' questions)');
      if(typeof dmeRetour==='function'){ try{ dmeCtx=null; dmeViderCorps(); }catch(e){} }
    }

    /* ---- 5. l'éditeur emporte les réglages, et n'écrit jamais le défaut ---- */
    if(typeof readEditorIntoDevoir==='function' && typeof renderDevoirEditor==='function'){
      dmList=[{id:'d-ed',num:1,actif:true,titre:'t',cours:'',exercices:[]}]; dmSelId='d-ed';
      if(typeof dmGenre!=='undefined') dmGenre='dm';
      renderDevoirEditor();
      const cb=document.querySelector('#dmExos input[data-mode="train"]');
      if(!cb){ vus.push('l\\'éditeur n\\'a aucune ligne d\\'exercice'); }
      else {
        const exid=cb.dataset.ex; cb.checked=true;
        const sq=document.querySelector('#dmExos select[data-nbq="'+exid+'"]');
        const ss=document.querySelector('#dmExos select[data-smax="'+exid+'"]');
        if(!sq||!ss) vus.push('les réglages nbQ/smax manquent dans l\\'éditeur');
        else {
          sq.value='2'; ss.value='8'; readEditorIntoDevoir();
          const e0=(dmList[0].exercices||[]).find(function(x){ return x.id===exid; });
          if(!e0||e0.nbQ!==2||e0.smax!==8) vus.push('l\\'enregistrement perd les réglages ('+JSON.stringify(e0)+')');
          sq.value=''; ss.value='5'; readEditorIntoDevoir();
          const e1=(dmList[0].exercices||[]).find(function(x){ return x.id===exid; });
          if(!e1) vus.push('l\\'exercice coché a disparu à la relecture');
          else if(('nbQ' in e1)||('smax' in e1)) vus.push('le défaut s\\'écrit au lieu de rester absent ('+JSON.stringify(e1)+')');
        }
      }
    } else if(typeof dmSetNbQ==='function' && typeof dmSetSmax==='function'){
      const dev={exercices:[{id:EX,modes:['train']}]};
      const ancien=window.dmCur; window.dmCur=function(){ return dev; };
      dmSetNbQ(EX,'2'); dmSetSmax(EX,'8');
      if(dev.exercices[0].nbQ!==2||dev.exercices[0].smax!==8) vus.push('les setters de l\\'éditeur ne posent pas les réglages');
      dmSetNbQ(EX,''); dmSetSmax(EX,'5');
      if(('nbQ' in dev.exercices[0])||('smax' in dev.exercices[0])) vus.push('le défaut s\\'écrit au lieu de rester absent');
      window.dmCur=ancien;
    } else {
      vus.push('aucun éditeur de réglages trouvé (ni readEditorIntoDevoir ni dmSetNbQ)');
    }
    return vus.slice(0,4).join(' | ');
  })()`, function(r){
    const nom='les réglages par exercice d\'un devoir : nombre de questions et plafond du soutien';
    if(!r.ok) verifier(nom, false, 'erreur JavaScript : '+r.erreur);
    else verifier(nom, r.valeur==='', r.valeur);
    verdictColore(w, apres);
  });
}
function verdictColore(w, apres){
  /* Trois fonctions peignent un verdict d'IA : checkSFL et checkMLL en
     Seconde, checkPsl en Première — on exerce celles que le niveau possède. */
  const present = evaluer(w, "(typeof checkMLL==='function' && typeof checkSFL==='function') || typeof checkPsl==='function'");
  if(!present.ok || !present.valeur){
    ignorer('le verdict de l\'IA se peint en vert quand c\'est bon, en rouge quand c\'est faux',
      'ce niveau n\'a pas d\'exercice rédigé corrigé par l\'IA');
    return jugeArithmetiqueClique(w, apres);
  }
  evalPromis(w, `(async function(){
    ${lire('tests/faux-supabase.js')}
    initSupabase();
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    const feuille=function(texte){ return { lire:function(){ return texte; },
      lignes:[{mf:{getValue:function(){ return 'x'; },focus:function(){},setValue:function(){},executeCommand:function(){}}}],
      verrouiller:function(){} }; };
    const verdict=function(ok){ sb.functions={ invoke:async function(){
      return { data:{ correct:ok, feedback: ok?'Bravo, ton calcul est juste.':'Il y a une erreur dans ton calcul.' } }; } }; };
    const couleur=function(id){ const c=(document.getElementById(id)||{}).className||'';
      return /\\bgood\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':'rien'); };

    /* 2.1.7 (Première) — la synthèse rédigée (checkPsl) */
    if(typeof checkPsl==='function'){
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'psl', questions:[{type:'res',P:30,N:40,unit:'€',prod:1200,result:12,opts:[11,12,13,14],bon:1,choisi:1,ci:0,v:0}],
        idx:0, score:0, answers:[], startTime:Date.now(), locked:false, pslBusy:false});
      test.qId='pourcentage-synthese-libre';
      pslFeuille=feuille('30/100 × 40 = 12');
      verdict(true); await checkPsl();
      if(couleur('pslFeedback')!=='vert') vus.push('2.1.7 : verdict juste peint « '+couleur('pslFeedback')+' » au lieu de vert');
      test.locked=false; test.pslBusy=false; pslFeuille=feuille('30/100 × 40 = 11');
      verdict(false); await checkPsl();
      if(couleur('pslFeedback')!=='rouge') vus.push('2.1.7 : verdict faux peint « '+couleur('pslFeedback')+' » au lieu de rouge');
    }

    /* 2.2.9 (Première) — la synthèse des augmentations rédigée (checkSal) :
       ici la page porte son JUGE, et c'est lui qu'on éprouve — le modèle
       stubbé SE TROMPE dans les deux sens, le verdict peint doit être celui
       du juge (la leçon de la Seconde : un verdict arithmétique ne se confie
       pas à un modèle). */
    if(typeof checkSal==='function'){
      const q29={fam:'aug',inc:'fin',sens:1,P:5,N:600,aug:30,fin:630,decStr:'630',unit:'€',opts:[615,630,660,690],bon:1,choisi:1,ci:0,v:0};
      Object.keys(test).forEach(function(k){ delete test[k]; });
      Object.assign(test,{kind:'sal', questions:[JSON.parse(JSON.stringify(q29))],
        idx:0, score:0, answers:[], startTime:Date.now(), locked:false, salBusy:false});
      test.qId='synthese-augmentations-libre';
      salFeuille=feuille('1,05 × 600 = 630');
      verdict(false); await checkSal();   /* le modèle MENT : la copie est juste */
      if(couleur('salFeedback')!=='vert') vus.push('2.2.9 : copie juste sous modèle qui refuse, peinte « '+couleur('salFeedback')+' » — le juge ne prime pas');
      if(test.score!==1) vus.push('2.2.9 : copie juste sous modèle qui refuse — le point n\\'est pas donné ('+test.score+')');
      test.locked=false; test.salBusy=false; test.score=0;
      test.questions=[JSON.parse(JSON.stringify(q29))];
      salFeuille=feuille('1,05 × 600 = 640');
      verdict(true); await checkSal();    /* le modèle MENT : l'égalité est fausse */
      if(couleur('salFeedback')!=='rouge') vus.push('2.2.9 : égalité fausse sous modèle qui accepte, peinte « '+couleur('salFeedback')+' » — le juge ne prime pas');
      if(test.score!==0) vus.push('2.2.9 : égalité fausse sous modèle qui accepte — le point est donné quand même');
      /* Sur un REFUS, la phrase du JUGE s'affiche toujours : le modèle avait
         rédigé en production un refus qui se contredisait (« c'est faux…
         donc c'est vrai ! », signalé par Turquet, août 2026) — même
         d'accord sur le verdict, sa prose ne s'affiche plus. */
      test.locked=false; test.salBusy=false; test.score=0;
      test.questions=[JSON.parse(JSON.stringify(q29))];
      salFeuille=feuille('1,05 × 600 = 640');
      sb.functions={ invoke:async function(){ return { data:{ correct:false, feedback:'C est faux. Enfin non, c est vrai !' } }; } };
      await checkSal();
      { const fbTxt=document.getElementById('salFeedback').textContent;
        if(fbTxt.indexOf('égalité fausse')<0 || fbTxt.indexOf('Enfin')>=0)
          vus.push('2.2.9 : sur un refus, la prose du modèle s\\'affiche au lieu de la phrase du juge : « '+fbTxt.slice(0,60)+' »'); }
      /* et sur une BAISSE (2.3.8), même moteur, même primauté */
      const q38={fam:'dim',inc:'fin',sens:-1,P:5,N:600,aug:30,fin:570,decStr:'570',unit:'€',opts:[555,570,600,630],bon:1,choisi:1,ci:0,v:0};
      test.locked=false; test.salBusy=false; test.score=0;
      test.questions=[JSON.parse(JSON.stringify(q38))]; test.qId='synthese-diminutions-libre';
      salFeuille=feuille('0,95 × 600 = 570');
      verdict(false); await checkSal();   /* le modèle MENT : la copie est juste */
      if(couleur('salFeedback')!=='vert') vus.push('2.3.8 : copie juste sous modèle qui refuse, peinte « '+couleur('salFeedback')+' » — le juge ne prime pas');
      if(test.score!==1) vus.push('2.3.8 : copie juste sous modèle qui refuse — le point n\\'est pas donné ('+test.score+')');

      /* Et la copie SE VOIT (signalé par Turquet, août 2026) : à la
         vérification, chaque ligne de la feuille est peinte — toute égalité
         vraie en bleu (ok), une égalité fausse en rouge (bad), une ligne que
         le juge ne sait pas lire ne reçoit rien. La feuille est ici adossée à
         de VRAIS éléments : salPeindreLignes lit mf.value quand MathLive
         n'est pas là, et ce repli rend la peinture mesurable au banc. */
      const feuilleDom=function(lignes){ const ls=lignes.map(function(t){
          const el=document.createElement('math-field'); el.value=t; return {mf:el, line:el}; });
        return { lire:function(){ return lignes.join('\\n'); }, lignes:ls, verrouiller:function(){} }; };
      test.locked=false; test.salBusy=false; test.score=0;
      test.questions=[JSON.parse(JSON.stringify(q29))]; test.qId='synthese-augmentations-libre';
      salFeuille=feuilleDom(['1,05 × 600 = 630','1,05 × 600 = 640','du texte sans egalite']);
      verdict(true); await checkSal();
      const cl=function(i){ const c=salFeuille.lignes[i].mf.classList;
        return c.contains('ok')?(c.contains('bad')?'ok et bad':'ok'):(c.contains('bad')?'bad':'rien'); };
      if(cl(0)!=='ok') vus.push('peinture : la ligne juste est « '+cl(0)+' » au lieu de ok (bleu)');
      if(cl(1)!=='bad') vus.push('peinture : la ligne fausse est « '+cl(1)+' » au lieu de bad (rouge)');
      if(cl(2)!=='rien') vus.push('peinture : une ligne illisible reçoit « '+cl(2)+' » au lieu de rien');
      /* la repeinture retire l'encre d'avant : la ligne corrigée passe de bad à ok */
      salFeuille.lignes[1].mf.value='2 × 315 = 630'; salPeindreLignes();
      if(cl(1)!=='ok') vus.push('peinture : la ligne corrigée reste « '+cl(1)+' » au lieu de repasser ok');
    }

    /* 4.7 — multiplier en rédigeant (checkMLL) ; 4.9 passe par la même ligne */
    if(typeof checkMLL==='function'){
    Object.keys(test).forEach(function(k){ delete test[k]; });
    /* La question est ÉPINGLÉE pour correspondre aux copies posées : depuis
       que la page porte son juge arithmétique, une copie qui ne colle pas à
       la question tirée serait refusée par le juge — à bon droit — et le
       contrôle mesurerait autre chose que la peinture. */
    Object.assign(test,{kind:'mll', questions:[{n1:3,d1:5,n2:7,d2:2,a1:3,a2:7,b1:5,b2:2,P:21,Q:10}], idx:0, score:0,
      answers:[], startTime:Date.now(), locked:false, mllBusy:false});
    test.qId='multiplier-fractions-libre';
    mllFeuille=feuille('3/5 × 7/2 = 21/10'); test.mllDepart='depart';
    verdict(true); await checkMLL();
    if(couleur('mllFeedback')!=='vert') vus.push('4.7 : verdict juste peint « '+couleur('mllFeedback')+' » au lieu de vert');
    test.locked=false; test.mllBusy=false; mllFeuille=feuille('3/5 × 7/2 = 9/9');
    verdict(false); await checkMLL();
    if(couleur('mllFeedback')!=='rouge') vus.push('4.7 : verdict faux peint « '+couleur('mllFeedback')+' » au lieu de rouge');

    /* 4.5 — la somme en rédigeant (checkSFL), même règle */
    Object.keys(test).forEach(function(k){ delete test[k]; });
    Object.assign(test,{kind:'sfl', questions:[{n1:1,d1:2,n2:1,d2:3,op:'+',D:6,N1:3,N2:2,N:5,Nr:5,Dr:6}], idx:0, score:0,
      answers:[], startTime:Date.now(), locked:false, sflBusy:false});
    test.qId='somme-fractions-libre';
    sflFeuille=feuille('1/2 + 1/3 = 5/6'); test.sflDepart='depart';
    verdict(true); await checkSFL();
    if(couleur('sflFeedback')!=='vert') vus.push('4.5 : verdict juste peint « '+couleur('sflFeedback')+' » au lieu de vert');
    test.locked=false; test.sflBusy=false; sflFeuille=feuille('1/2 + 1/3 = 2/5');
    verdict(false); await checkSFL();
    if(couleur('sflFeedback')!=='rouge') vus.push('4.5 : verdict faux peint « '+couleur('sflFeedback')+' » au lieu de rouge');
    }
    return vus.join(' | ');
  })()`, function(r){
    if(!r.ok) verifier('le verdict de l\'IA se peint en vert quand c\'est bon, en rouge quand c\'est faux', false, 'erreur JavaScript : '+r.erreur);
    else verifier('le verdict de l\'IA se peint en vert quand c\'est bon, en rouge quand c\'est faux', r.valeur==='', r.valeur);
    jugeArithmetiqueClique(w, apres);
  });
}
function simplifierBarres(w, P){
  const present = evaluer(w, "typeof startSmp==='function' && typeof smpGen==='function'");
  if(!present.ok || !present.valeur){
    ignorer('simplifier une fraction en coloriant deux barres',
      'ce niveau n\'a pas l\'exercice « Simplifier une fraction en coloriant deux barres »');
    return;
  }
  verifierEval(w, 'simplifier une fraction en coloriant deux barres', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='simplifier-barres';
    const pgcd=function(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t; } return a||1; };

    /* ---- 1. le tirage ---------------------------------------------------- */
    const vusK={}, vusB={};
    for(let i=0;i<2000;i++){
      const q=smpGen(), eti='tirage '+q.a+'/'+q.b+' (n='+q.n+', d='+q.d+', k='+q.k+')';
      if(q.a!==q.n*q.k || q.b!==q.d*q.k){ vus.push(eti+' : a et b ne sont pas n×k et d×k'); break; }
      /* LE BORD QUI COMPTE : le diviseur attendu est le PGCD, et lui seul.
         S'il ne l'était pas, le dénominateur d'arrivée écrit à l'écran serait
         atteignable autrement, et la correction refuserait une route juste. */
      if(pgcd(q.a,q.b)!==q.k){ vus.push(eti+' : le PGCD vaut '+pgcd(q.a,q.b)+', pas '+q.k); break; }
      if(pgcd(q.n,q.d)!==1){ vus.push(eti+' : la fraction d\\'arrivée '+q.n+'/'+q.d+' se simplifie encore'); break; }
      if(q.k<2){ vus.push(eti+' : rien à simplifier'); break; }
      if(q.k>10){ vus.push(eti+' : le PGCD dépasse 10'); break; }
      if(q.d<2){ vus.push(eti+' : la seconde barre n\\'aurait qu\\'une seule part'); break; }
      if(q.n<1 || q.n>=q.d){ vus.push(eti+' : le numérateur d\\'arrivée sort de la barre'); break; }
      /* LES DEUX BORNES DEMANDÉES : de 4 à 40. Au-delà de 40, une part de barre
         descend sous 27 px et cesse d\\'être cliquable ; en deçà de 4, il n\\'y a
         plus grand-chose à partager. */
      if(q.b>SMP_BMAX){ vus.push(eti+' : '+q.b+' parts, une part devient trop fine pour être cliquée'); break; }
      if(q.b<SMP_BMIN){ vus.push(eti+' : '+q.b+' parts, en deçà du partage demandé'); break; }
      if(q.selL!==0 || q.selR!==0){ vus.push(eti+' : une barre est déjà coloriée au tirage'); break; }
      vusK[q.k]=1; vusB[q.b]=1;
    }
    if(!vus.length && Object.keys(vusK).length<3)
      vus.push('le tirage ne produit que '+Object.keys(vusK).length+' diviseur(s) différent(s)');
    /* Le partage demandé va de 4 à 40 : si le tirage ne montait jamais au-delà
       d\'une vingtaine, la borne serait écrite sans être atteinte — et une borne
       qu\'on n\'atteint jamais fait croire qu\'on couvre un domaine. */
    if(!vus.length){
      const bs=Object.keys(vusB).map(Number);
      if(Math.max.apply(null,bs)<30) vus.push('le tirage ne dépasse jamais '+Math.max.apply(null,bs)+' parts, alors que la borne est '+SMP_BMAX);
      if(Math.min.apply(null,bs)>8) vus.push('le tirage ne descend jamais sous '+Math.min.apply(null,bs)+' parts');
    }

    /* ---- 2. la correction, exercée pour de vrai -------------------------- */
    startSmp();
    /* 8/12 : PGCD 4, arrivée 2/3. Choisie pour que TOUT LE RESTE soit juste
       dans les copies fautives — un cas où seule la case visée cloche. */
    test.questions[test.idx]={a:8,b:12,n:2,d:3,k:4,selL:0,selR:0};
    const CASES=['smp-q1','smp-q2','smp-fn'];
    const juger=function(o){
      test.locked=false;
      renderSmpTest();
      const qq=test.questions[test.idx];
      qq.selL=o.L||0; qq.selR=o.R||0;
      CASES.forEach(function(id){ const el=document.getElementById(id);
        if(el) el.value=(o[id]===undefined)?'':String(o[id]); });
      const avant=test.score;
      checkSmpAnswer();
      const etat=function(id){ const e=document.getElementById(id); if(!e) return '(absent)';
        const c=(e.className||'').split(/\\s+/);
        return c.indexOf('ok')>=0?'ok':(c.indexOf('bad')>=0?'bad':(c.indexOf('sol')>=0?'sol':''));
      };
      const rep=test.answers[test.answers.length-1]||{};
      return { justes:test.score-avant, correct:!!rep.correct, cases:rep.cases, bons:rep.justes,
               g:etat('smpBarL'), d:etat('smpBarR'),
               q1:etat('smp-q1'), q2:etat('smp-q2'), fn:etat('smp-fn'),
               cibles:document.querySelectorAll('.smp-cible').length,
               retour:(document.getElementById('smpFeedback')||{}).textContent||'' };
    };
    const JUSTE={L:8,R:2,'smp-q1':4,'smp-q2':4,'smp-fn':2};
    const avec=function(o){ const c=Object.assign({},JUSTE); Object.keys(o).forEach(function(k){
      if(o[k]===null) delete c[k]; else c[k]=o[k]; }); return c; };

    let r=juger(JUSTE);
    if(r.justes!==5 || !r.correct) vus.push('la copie juste ne vaut pas 5 réponses : '+JSON.stringify(r));
    if(r.g!=='ok'||r.d!=='ok'||r.q1!=='ok'||r.q2!=='ok'||r.fn!=='ok')
      vus.push('la copie juste n\\'est pas entièrement verte : '+JSON.stringify(r));
    /* LA NOTE AFFICHÉE COMPTE LES DEUX COLONNES. Sans « pts-case », ptsEcran()
       ne voyait que les trois champs : « 3 cases justes sur 3 » sur une
       question qui en vaut 5, pendant que la note enregistrée en comptait 5. */
    if(r.cases!==5) vus.push('la note affichée compte '+r.cases+' cases au lieu de 5 : les barres n\\'y sont pas');

    /* diviser par trop peu : le dénominateur d\\'arrivée est ÉCRIT, 8/12 divisé
       par 2 donne 4/6 et n\\'atteint pas 3. */
    r=juger(avec({'smp-q1':2,'smp-q2':2,'smp-fn':4}));
    if(r.q1==='ok'||r.q2==='ok') vus.push('diviser 8/12 par 2 est accepté alors que le dénominateur d\\'arrivée est 3');
    if(r.fn==='ok') vus.push('4 est accepté comme numérateur alors que la fraction attendue est 2/3');
    /* pas le même diviseur en haut et en bas */
    r=juger(avec({'smp-q2':2}));
    if(r.q2==='ok') vus.push('diviser le haut par 4 et le bas par 2 est accepté');
    if(r.q1!=='ok') vus.push('le diviseur JUSTE du haut rougit parce que celui du bas est faux');
    /* le coloriage de la seconde barre doit être la MÊME longueur */
    r=juger(avec({R:1}));
    if(r.d==='ok') vus.push('1 part sur 3 est accepté alors que 8/12 vaut 2/3');
    if(r.g!=='ok') vus.push('le coloriage JUSTE de la 1re barre rougit parce que celui de la 2de est faux');

    /* ---- 3. RIEN N\\'EST ÉCRIT : rien ne rougit -------------------------- */
    r=juger({});
    if(r.g==='bad'||r.d==='bad') vus.push('une barre laissée VIDE rougit : '+r.g+' / '+r.d);
    if(r.q1==='bad'||r.q2==='bad'||r.fn==='bad') vus.push('une case laissée vide rougit');
    if(r.g!=='sol'||r.d!=='sol') vus.push('une barre vide ne reçoit pas la correction en bleu : '+r.g+' / '+r.d);
    if(r.cibles!==2) vus.push('la bonne mesure n\\'est pas montrée sur les deux barres ('+r.cibles+' trait(s))');
    if(r.justes!==0) vus.push('une copie entièrement vide vaut '+r.justes+' réponse(s)');
    if(r.cases!==5) vus.push('une copie vide compte '+r.cases+' cases au lieu de 5');
    if(!/manque/.test(r.retour)) vus.push('le message ne dit pas qu\\'il manque des réponses : « '+r.retour+' »');

    /* ---- 4. une réponse écrite SEULE ne rougit pas les autres ------------ */
    r=juger({'smp-q1':4});
    if(r.q1!=='ok') vus.push('le diviseur juste écrit seul est compté faux');
    if(r.g==='bad'||r.d==='bad'||r.q2==='bad'||r.fn==='bad') vus.push('une réponse laissée vide rougit à côté d\\'une case juste');
    if(r.justes!==1) vus.push('une seule réponse juste vaut '+r.justes);
    /* LE GARDE-FOU : une demi-copie dont tout ce qui est écrit est juste ne
       doit pas passer pour terminée. Sans lui, elle vaudrait le point entier. */
    r=juger(avec({'smp-fn':null}));
    if(r.correct) vus.push('une copie à laquelle il manque une réponse est comptée terminée');
    if(r.justes!==4) vus.push('la demi-copie juste vaut '+r.justes+' au lieu de 4');

    return vus.join(' | ');
  })()`, v => v === '', undefined);
}
function simplifierFractions(w, P){
  const present = evaluer(w, "typeof startSFSimp==='function' && typeof sfGen==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la somme de fractions à simplifier accepte toutes les routes et exige d\'aller au bout',
      'ce niveau n\'a pas l\'exercice « Somme de fractions à simplifier »');
    return;
  }
  verifierEval(w, 'la somme de fractions à simplifier accepte toutes les routes et exige d\'aller au bout', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='simplifier-fractions';
    const pgcd=function(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t; } return a||1; };

    /* ---- 1. le tirage ---------------------------------------------------- */
    let plus=0, moins=0;
    for(let i=0;i<3000;i++){
      const q=sfGen(i%2===0?'+':'−','simplifier');
      const eti='tirage '+q.n1+'/'+q.d1+' '+q.op+' '+q.n2+'/'+q.d2;
      const g=(q.op==='+') ? (q.n1*q.d2 + q.n2*q.d1) : (q.n1*q.d2 - q.n2*q.d1);
      const h=q.d1*q.d2;
      if(g*q.D !== q.N*h){ vus.push(eti+' : l\\'énoncé annonce '+q.N+'/'+q.D+', le calcul donne '+g+'/'+h); break; }
      if(q.d1===1 || q.d2===1){ vus.push(eti+' : un terme est un ENTIER, l\\'écran en porte déjà quatre étapes'); break; }
      if(q.d1===q.d2){ vus.push(eti+' : les deux dénominateurs sont déjà égaux'); break; }
      if(pgcd(q.d1,q.d2)===1){ vus.push(eti+' : les deux dénominateurs n\\'ont aucun diviseur commun — c\\'est l\\'autre exercice'); break; }
      /* LE BORD QUI COMPTE : la somme doit vraiment se simplifier. */
      if(pgcd(q.N,q.D)===1){ vus.push(eti+' : '+q.N+'/'+q.D+' est déjà irréductible — la dernière étape n\\'a rien à diviser'); break; }
      if(q.Nr!==q.N/pgcd(q.N,q.D) || q.Dr!==q.D/pgcd(q.N,q.D)){ vus.push(eti+' : le résultat réduit rangé ('+q.Nr+'/'+q.Dr+') n\\'est pas celui de '+q.N+'/'+q.D); break; }
      if(q.Nr===q.Dr){ vus.push(eti+' : le résultat vaut 1 tout rond'); break; }
      if(q.N<=0){ vus.push(eti+' : le résultat vaut '+q.N+'/'+q.D); break; }
      if(pgcd(q.n1,q.d1)!==1 || pgcd(q.n2,q.d2)!==1){ vus.push(eti+' : une fraction de départ est réductible'); break; }
      if(q.op==='+') plus++; else moins++;
    }
    if(!vus.length && (!plus || !moins)) vus.push('une seule opération tirée (+ : '+plus+', − : '+moins+')');

    /* ---- 2. la correction, exercée pour de vrai -------------------------- */
    startSFSimp();
    const poser=function(vals){
      sfCases().forEach(function(id){ const el=document.getElementById(id); if(el) el.value=''; });
      Object.keys(vals).forEach(function(id){
        const el=document.getElementById(id); if(el) el.value=String(vals[id]);
      });
    };
    /* 9/2 + 5/6 : PPCM 6, somme 32/6, réduite 16/3. Par 12 : 64/12, divisé
       par 4, même résultat. */
    test.questions[test.idx]={n1:9,d1:2,n2:5,d2:6,op:'+',D:6,k1:3,k2:1,N1:27,N2:5,N:32,Nr:16,Dr:3};
    renderSFTest();
    const q=test.questions[test.idx];
    const tout=function(r){ return r.ok1&&r.ok2&&r.ok3&&r.okS&&r.okQ&&r.ok4; };
    const juger=function(vals){ poser(vals); return sfJuge(q); };
    const PPCM={'sf-a1':3,'sf-b1':3,'sf-a2':1,'sf-b2':1,'sf-num1':27,'sf-num2':5,'sf-den':6,
                'sf-sn':32,'sf-q1':2,'sf-sd':6,'sf-q2':2,'sf-fn':16,'sf-fd':3};
    const DOUZE={'sf-a1':6,'sf-b1':6,'sf-a2':2,'sf-b2':2,'sf-num1':54,'sf-num2':10,'sf-den':12,
                 'sf-sn':64,'sf-q1':4,'sf-sd':12,'sf-q2':4,'sf-fn':16,'sf-fd':3};
    const avec=function(base,o){ const c=Object.assign({},base); Object.keys(o).forEach(function(k){ c[k]=o[k]; }); return c; };

    let r=juger(PPCM);
    if(!tout(r)) vus.push('la voie du PPCM (32/6 divisé par 2 = 16/3) est comptée fausse : '+JSON.stringify(r));
    /* LA PROMESSE : une autre route, un autre diviseur, le même résultat. */
    r=juger(DOUZE);
    if(!tout(r)) vus.push('le dénominateur commun 12 (64/12 divisé par 4 = 16/3) est compté faux : l\\'exercice impose le PPCM');

    /* diviser par trop peu n'est pas fini */
    r=juger(avec(DOUZE,{'sf-q1':2,'sf-q2':2,'sf-fn':32,'sf-fd':6}));
    if(r.okQ) vus.push('diviser 64/12 par 2 est accepté : 32/6 se simplifie encore');
    if(r.ok4) vus.push('32/6 est accepté comme fraction simplifiée de 16/3');
    /* diviser par 1 n'est pas simplifier */
    r=juger(avec(PPCM,{'sf-q1':1,'sf-q2':1,'sf-fn':32,'sf-fd':6}));
    if(r.okQ) vus.push('diviser par 1 est accepté comme une simplification');
    /* pas le même diviseur en haut et en bas : la fraction change de valeur */
    r=juger(avec(PPCM,{'sf-q1':2,'sf-q2':1}));
    if(r.okQ) vus.push('diviser le haut par 2 et le bas par 1 est accepté');
    /* la fraction recopiée doit être celle qu'on vient d'obtenir */
    r=juger(avec(PPCM,{'sf-sn':30}));
    if(r.okS) vus.push('30 est accepté comme somme alors que 27 + 5 = 32');
    r=juger(avec(PPCM,{'sf-sd':12}));
    if(r.okS) vus.push('12 est accepté comme dénominateur obtenu alors que l\\'élève a écrit 6 à l\\'étape ②');
    /* la dernière étape veut la fraction RÉDUITE, elle seule */
    r=juger(avec(PPCM,{'sf-fn':32,'sf-fd':6}));
    if(r.ok4) vus.push('32/6 passe à la dernière étape : elle vaut 16/3, mais elle n\\'est pas simplifiée');

    /* ---- 3. les cases écrites seules, comme partout ailleurs ------------- */
    const rien={}; sfCases().forEach(function(id){ rien[id]=''; });
    const seul=function(o){ return juger(avec(rien,o)); };
    r=seul({'sf-q1':2});
    if(!r.okQ) vus.push('2 écrit seul comme diviseur est compté faux : les cases d\\'avant étaient vides');
    r=seul({'sf-q1':5});
    if(r.okQ) vus.push('5 écrit seul comme diviseur est accepté : 5 ne divise ni 32 ni 6');
    r=seul({'sf-fn':16});
    if(!r.okFn) vus.push('16 écrit seul au numérateur final est compté faux');
    r=seul({'sf-fd':3});
    if(!r.okFd) vus.push('3 écrit seul au dénominateur final est compté faux');
    r=seul({'sf-fd':6});
    if(r.okFd) vus.push('6 est accepté au dénominateur final : la fraction réduite est 16/3');
    /* ICI AUSSI, une case juste ne rougit pas pour sa voisine — et cet exercice
       a DEUX étapes de plus que les autres, donc deux endroits de plus où le
       défaut pouvait vivre (demande de Turquet, août 2026). */
    r=seul({'sf-fn':16,'sf-fd':6});
    if(!r.okFn) vus.push('16, juste, rougit parce que le dénominateur final est faux');
    if(r.okFd) vus.push('6 est accepté au dénominateur final alors que 16 est écrit à côté');
    r=seul({'sf-sn':32,'sf-sd':7});
    if(!r.okSn) vus.push('la somme recopiée JUSTE rougit parce que le dénominateur recopié est faux');
    if(r.okSd) vus.push('7 est accepté comme dénominateur recopié');

    /* ET CE QUI EST PEINT, pas seulement ce qui est jugé. Cet exercice a DEUX
       étapes de plus que les autres, donc deux endroits de plus où trois cases
       pouvaient partager un verdict — c'est exactement le défaut signalé, une
       étape plus loin. Un sabotage qui ne touchait qu'aux appels à « mark » a
       traversé les essais ci-dessus : ils lisent le verdict, l'élève regarde la
       couleur. */
    renderSFTest();
    poser(avec(PPCM,{'sf-sd':7}));
    checkSFAnswer();
    const peintS=function(id){ const el=document.getElementById(id); const c=el?el.className:'';
      return /\\bok\\b/.test(c)?'vert':(/\\bbad\\b/.test(c)?'rouge':(/\\bsol\\b/.test(c)?'bleu':'rien')); };
    if(peintS('sf-sn')!=='vert') vus.push('la somme recopiée JUSTE est peinte en '+peintS('sf-sn')+' alors que seul le dénominateur recopié est faux');
    if(peintS('sf-sd')!=='rouge') vus.push('le dénominateur recopié, FAUX, est peint en '+peintS('sf-sd'));
    if(peintS('sf-num1')!=='vert' || peintS('sf-den')!=='vert')
      vus.push('l\\'étape ② rougit alors qu\\'elle est juste : la faute est une étape plus loin');
    /* et une demi-copie ne vaut pas le point entier */
    r=seul({'sf-a1':3,'sf-sn':32,'sf-fn':16});
    if(!r.vide) vus.push('une demi-copie passe pour complète');
    /* LES QUATRE CASES NOUVELLES COMPTENT COMME LES AUTRES. Si sfCases() les
       ignorait, une copie à qui il manque le diviseur passerait pour complète
       et vaudrait le point entier — et rien d'autre ne le dirait : la
       coloration, elle, les marque bien. */
    ['sf-sn','sf-q1','sf-sd','sf-q2'].forEach(function(id){
      const c=Object.assign({},PPCM); c[id]='';
      poser(c);
      const rr=sfJuge(q);
      if(!rr.vide) vus.push(id+' laissée vide ne se voit pas : la copie passe pour complète');
      renderSFTest(); poser(c); checkSFAnswer();
      const d=test.answers[test.answers.length-1];
      if(d && d.correct) vus.push('une copie sans '+id+' vaut quand même le point entier');
    });
    renderSFTest();

    /* ---- 4. le clic, et la note qui en sort ------------------------------ */
    renderSFTest();
    poser(PPCM); checkSFAnswer();
    let note=ptsEcran();
    if(!note || note.cases!==13) vus.push('la note ne compte pas les treize cases ('+(note?note.cases:'aucune')+')');
    else if(note.justes!==13) vus.push('une copie entièrement juste compte '+note.justes+' cases justes sur 13');
    let der=test.answers[test.answers.length-1];
    if(!der || !der.correct) vus.push('une copie entièrement juste ne vaut pas le point');
    /* et la copie qui s'arrête à mi-simplification garde ses cases justes */
    renderSFTest();
    poser(avec(DOUZE,{'sf-q1':2,'sf-q2':2,'sf-fn':32,'sf-fd':6})); checkSFAnswer();
    note=ptsEcran();
    if(!note || note.justes!==9) vus.push('la copie qui divise par 2 au lieu de 4 compte '+(note?note.justes:'?')+' cases justes, au lieu de 9');
    der=test.answers[test.answers.length-1];
    if(der && der.correct) vus.push('une fraction non simplifiée vaut quand même le point');
    /* ET LA CORRECTION EN BLEU DOIT DIRE LA MÊME CHOSE QUE LE MESSAGE. Sur
       cette copie, passée par 12, le diviseur attendu est 4 : un badge affichant
       2 — le diviseur de la voie du PPCM — contredirait, sur le même écran, la
       phrase posée juste en dessous. Rien ne casserait, et l'élève ne saurait
       pas laquelle des deux croire. */
    const badge=function(id){ const el=document.getElementById(id); const s=el&&el.nextElementSibling;
      return (s&&s.classList&&s.classList.contains('mf-cor')) ? s.textContent.trim() : ''; };
    if(badge('sf-q1')!=='4') vus.push('la correction en bleu du diviseur annonce « '+badge('sf-q1')+' » alors que la route de l\\'élève (12) demande 4');
    const dit=document.getElementById('sfFeedback').textContent;
    if(dit.indexOf('4')<0) vus.push('le message ne nomme pas le diviseur 4');

    return vus.join(' | ');
  })()`, v => v === '', undefined);
}

/* ---------- 4 quater ter. La somme de fractions ÉCRITE PAR L'ÉLÈVE ---------
   Les mêmes nombres que {simplifier-fractions}, mais plus une seule case :
   l'élève écrit son calcul dans une feuille ligne par ligne, et c'est l'IA qui
   le lit. Tout le risque est donc DANS CE QUI PART AU MODÈLE.

   · LA RÈGLE DE DÉCISION EST TRONQUÉE EN SILENCE À 4000 CARACTÈRES par la
     fonction Edge (« .slice(0, 4000) »). Une règle coupée en son milieu ne
     lève rien : le modèle corrige simplement avec la moitié qu'il a reçue, et
     l'exercice se met à accepter des copies sans étape. C'est le défaut de
     MAX_CTX, au même endroit du raisonnement — et la borne est LUE dans la
     source de la fonction, jamais recopiée.
   · LA RÈGLE DOIT DIRE CE QU'ELLE EXIGE. Trois conditions, et n'en tenir
     qu'une ne tient rien : l'étape du même dénominateur, le résultat
     irréductible, et l'absence de ligne fausse. Si la règle cesse de nommer le
     résultat réduit ou la somme non simplifiée, elle ne peut plus les
     distinguer — et rien ne rougirait.
   · ELLE NE DOIT PAS CONTREDIRE LE TIRAGE. Les nombres qu'elle annonce sont
     recalculés ici depuis la question : un énoncé qui contredit sa correction
     est le pire défaut possible.

   La fonction Edge ne se déploie pas toute seule : ce contrôle compare la page
   au FICHIER du dépôt, il ne voit pas ce qui tourne chez Supabase. */
function sommeFractionsLibre(w, P){
  const present = evaluer(w, "typeof startSFL==='function' && typeof sflAttenduIA==='function'");
  if(!present.ok || !present.valeur){
    ignorer('la règle envoyée au modèle est complète, exacte, et tient dans la borne de la fonction Edge',
      'ce niveau n\'a pas l\'exercice « Somme de fractions — tu écris ton calcul »');
    return;
  }
  let bornes;
  try{
    const src = fs.readFileSync(path.join(__dirname, '..', 'supabase/functions/corriger-definition/index.ts'), 'utf8');
    const q = src.match(/payload\.question\s*\|\|\s*""\)\.toString\(\)\.slice\(0,\s*(\d+)\)/);
    const a = src.match(/payload\.attendu\s*\|\|\s*""\)\.toString\(\)\.slice\(0,\s*(\d+)\)/);
    const r = src.match(/payload\.reponse\s*\|\|\s*""\)\.toString\(\)\.trim\(\)\.slice\(0,\s*(\d+)\)/);
    if(q && a && r) bornes = { question:+q[1], attendu:+a[1], reponse:+r[1] };
  }catch(e){ bornes = undefined; }
  if(!bornes){
    verifier('la règle envoyée au modèle est complète, exacte, et tient dans la borne de la fonction Edge',
      false, 'les bornes de troncature sont introuvables dans supabase/functions/corriger-definition/index.ts');
    return;
  }
  const mesure = verifierEval(w, 'la règle envoyée au modèle est complète, exacte, et tient dans la borne de la fonction Edge', `(function(){
    const vus=[]; const B=${JSON.stringify(bornes)};
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='somme-fractions-libre';
    let pireQ=0, pireA=0, pireId='';
    for(let i=0;i<400;i++){
      const q=sfGen(i%2===0?'+':'−','simplifier');
      /* le bloc verdict du juge part AVEC l'énoncé : on mesure ce qui part
         vraiment, dans son pire cas — un refus, avec un morceau cité à sa
         borne de 80 caractères */
      const bloc=(typeof libreVerdictIA==='function')
        ? libreVerdictIA({sait:true, correct:false, motif:'egalite', morceau:new Array(81).join('x')}).length : 0;
      const e=sflEnonceIA(q), a=sflAttenduIA(q);
      if(e.length+bloc>pireQ) pireQ=e.length+bloc;
      if(a.length>pireA){ pireA=a.length; pireId=q.n1+'/'+q.d1+' '+q.op+' '+q.n2+'/'+q.d2; }
      /* la règle NOMME ce qu'elle doit distinguer */
      const reduite=q.Nr+'/'+q.Dr, brute=q.N+'/'+q.D;
      if(a.indexOf(reduite)<0){ vus.push('la règle ne nomme pas le résultat réduit '+reduite); break; }
      if(a.indexOf(brute)<0){ vus.push('la règle ne nomme pas la somme non simplifiée '+brute+' : elle ne peut plus la refuser'); break; }
      if(reduite===brute){ vus.push('le tirage rend '+brute+' déjà irréductible'); break; }
      /* et elle ne contredit pas le tirage : les nombres qu'elle annonce sont
         recalculés ici, jamais recopiés depuis la question */
      const attJ=(q.op==='+')?(q.n1*(q.D/q.d1)+q.n2*(q.D/q.d2)):(q.n1*(q.D/q.d1)-q.n2*(q.D/q.d2));
      if(a.indexOf(q.N1+'/'+q.D)<0 || a.indexOf(q.N2+'/'+q.D)<0){ vus.push('la règle n\\'écrit pas les deux fractions sur le dénominateur commun'); break; }
      if(attJ!==q.N){ vus.push('le tirage lui-même se contredit : '+attJ+' contre '+q.N); break; }
      /* LES TROIS EXIGENCES, CHACUNE DANS SON POINT. Chercher les mots dans
         TOUT le texte ne prouvait rien : « même dénominateur » et
         « irréductible » y reviennent partout, si bien que vider un point de
         sa substance passait au vert. On découpe donc la règle en ses trois
         points numérotés, et on regarde CHACUN. Trois sabotages l'ont montré :
         un contrôle qui passe au vert sous le sabotage parle d'autre chose. */
      const iR=a.indexOf('RÈGLE DE DÉCISION'), iC=a.indexOf('CONSIGNES POUR LE FEEDBACK');
      if(iR<0 || iC<0 || iC<iR){ vus.push('la règle de décision et les consignes de feedback ne se distinguent plus'); break; }
      const regle=a.slice(iR,iC);
      const pt=function(n){
        const d=regle.indexOf('\\n'+n+'. '); if(d<0) return '';
        const f=regle.indexOf('\\n'+(n+1)+'. ', d);
        return regle.slice(d, f<0?regle.length:f);
      };
      const p1=pt(1), p2=pt(2), p3=pt(3);
      if(!p1||!p2||!p3){ vus.push('la règle de décision n\\'a plus ses trois points numérotés'); break; }
      if(!/m[êe]me d[ée]nominateur/i.test(p1)){ vus.push('le point 1 n\\'exige plus l\\'étape du même dénominateur'); break; }
      if(p1.indexOf(q.N1+'/'+q.D)<0 || p1.indexOf(q.N2+'/'+q.D)<0){ vus.push('le point 1 ne montre plus les deux fractions sur le dénominateur commun'); break; }
      /* le dénominateur commun n'est pas imposé, et le point 1 doit le dire :
         sans cette phrase, le modèle refuserait une méthode juste */
      if(p1.indexOf(String(2*q.D))<0){ vus.push('le point 1 ne dit plus qu\\'un autre dénominateur commun ('+(2*q.D)+') convient'); break; }
      if(!/irr[ée]ductible/i.test(p2)){ vus.push('le point 2 n\\'exige plus un résultat irréductible'); break; }
      if(p2.indexOf(reduite)<0){ vus.push('le point 2 ne nomme plus le résultat réduit '+reduite); break; }
      if(p2.indexOf(brute)<0){ vus.push('le point 2 ne nomme plus '+brute+', la fraction sur laquelle il ne faut PAS s\\'arrêter'); break; }
      if(!/fausse/i.test(p3)){ vus.push('le point 3 n\\'interdit plus les lignes fausses'); break; }
    }
    if(!vus.length){
      if(pireQ>B.question) vus.push('l\\'énoncé envoyé fait '+pireQ+' caractères, tronqué à '+B.question);
      if(pireA>B.attendu) vus.push('la règle envoyée fait '+pireA+' caractères, tronquée à '+B.attendu+' (sur '+pireId+')');
    }
    if(!vus.length && pireA>B.attendu-300)
      vus.push('la règle fait '+pireA+' caractères pour une borne de '+B.attendu+' : moins de 300 de marge');
    /* La marge est AFFICHÉE à chaque exécution, comme celle de MAX_CTX : un
       chiffre qu'on voit fondre prévient avant que la troncature ne morde. */
    if(!vus.length) return 'MARGE '+pireA+' '+B.attendu;
    return vus.join(' | ');
  })()`, v => /^MARGE /.test(v), undefined);
  const m = (typeof mesure === 'string') ? /^MARGE (\d+) (\d+)$/.exec(mesure) : null;
  if(m) console.log('   · règle la plus longue : ' + m[1] + ' caractères, ' + (+m[2] - +m[1]) + ' de marge sur ' + m[2]);
}

/* ---------- 4 quinquies. Placer trois nombres sur une droite graduée -------
   Deux graduations, trois nombres, trois zones — avant, entre, après. Le
   risque n'est pas dans le dessin : il est ARITHMÉTIQUE, et il est le même
   que celui de « Appartient ou pas ? ». Se tromper d'une zone compterait faux
   un élève qui a raison, sans que rien ne rougisse : c'est le pire défaut
   possible pour un exercice, il apprend l'inverse de ce qu'il enseigne.

   On compare donc la page à LA FICHE, cas par cas — les trois exemples
   écrits à la main, y compris celui aux nombres négatifs, où −1,59 est APRÈS
   −1,6. Si le code et le papier divergent, c'est le code qui a tort.

   Puis on balaie le tirage, et on juge chaque comparaison par une SECONDE
   méthode : les deux écritures complétées de zéros, puis comparées comme des
   chaînes. Une réimplémentation en entiers se serait trompée du même côté que
   l'originale ; celle-ci n'a rien en commun avec elle.

   Enfin le bouton d'aide : il ajoute des zéros, donc il ne doit RIEN changer
   à la correction. Un bouton qui déplacerait une réponse serait un piège posé
   à l'élève qui demande de l'aide — exactement celui qui n'en a pas besoin. */
function placerSurLaDroite(w, P){
  const present = evaluer(w, "typeof plcGen==='function' && typeof plcZone==='function' && typeof plcEcrit==='function'");
  if(!present.ok || !present.valeur){
    ignorer('un nombre est placé dans la zone que la fiche lui donne',
      'ce niveau n\'a pas l\'exercice « Placer des nombres sur une droite graduée »');
    return;
  }
  verifierEval(w, 'un nombre est placé dans la zone que la fiche lui donne', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    currentTestId='placer-intervalle';
    const d=function(n,k){ return {n:n,k:k}; };

    /* ---- 1. LA FICHE, cas par cas ---------------------------------------- */
    const FICHE=[
      { a:d(107,2), b:d(108,2), items:[[d(1075,3),'entre'],[d(1009,3),'avant'],[d(11,1),'apres']] },
      { a:d(16,1),  b:d(17,1),  items:[[d(165,2),'entre'],[d(159,2),'avant'],[d(172,2),'apres']] },
      /* le tableau aux négatifs : −1,59 est APRÈS −1,6, et −1,71 AVANT −1,7 */
      { a:d(-17,1), b:d(-16,1), items:[[d(-161,2),'entre'],[d(-159,2),'apres'],[d(-171,2),'avant']] }
    ];
    FICHE.forEach(function(f){
      const q={p:0, a:f.a, b:f.b, nombres:f.items.map(function(it){ return it[0]; })};
      f.items.forEach(function(it){
        const z=plcZone(it[0], q);
        if(z!==it[1]) vus.push('la fiche : '+plcEcrit(it[0],null)+' entre '+plcEcrit(f.a,null)
          +' et '+plcEcrit(f.b,null)+' → la page dit « '+z+' », la fiche dit « '+it[1]+' »');
      });
    });

    /* ---- 2. la SECONDE méthode : comparer les écritures ------------------- */
    /* On complète les deux nombres de zéros — à droite pour les décimales, à
       gauche pour la partie entière — puis on compare les chaînes. Rien de
       commun avec la comparaison en entiers de la page : si l'une se trompe
       d'échelle, l'autre ne suit pas. */
    const parEcriture=function(x,y){
      const dec=Math.max(x.k,y.k);
      const bout=function(v){
        const t=plcEcrit(v,dec), neg=t.charAt(0)==='\\u2212';
        const nu=(neg?t.slice(1):t).replace(',','');
        return {neg:neg, s:nu};
      };
      const A=bout(x), B=bout(y);
      const L=Math.max(A.s.length,B.s.length);
      const pa=A.s.padStart(L,'0'), pb=B.s.padStart(L,'0');
      if(A.neg!==B.neg) return A.neg ? -1 : 1;        /* un négatif est toujours plus petit */
      const c = pa<pb ? -1 : (pa>pb ? 1 : 0);
      return A.neg ? -c : c;                          /* chez les négatifs, tout s'inverse */
    };
    const zoneParEcriture=function(v,q){
      if(parEcriture(v,q.a)<0) return 'avant';
      if(parEcriture(v,q.b)>0) return 'apres';
      return 'entre';
    };

    /* ---- 3. le balayage du tirage ---------------------------------------- */
    let negatifs=0, moinsDec=0, plusDec=0, surBorne=0;
    const TOURS=4000;
    for(let i=0;i<TOURS && vus.length===0;i++){
      const q=plcGen();
      const eti='['+plcEcrit(q.a,null)+' | '+plcEcrit(q.b,null)+'] '
        +q.nombres.map(function(v){ return plcEcrit(v,null); }).join(' ');
      if(plcCmp(q.a,q.b)>=0){ vus.push(eti+' : la première graduation n\\'est pas avant la seconde'); break; }
      const zones=q.nombres.map(function(v){ return plcZone(v,q); });
      /* les deux méthodes doivent dire la MÊME chose */
      q.nombres.forEach(function(v,j){
        const z2=zoneParEcriture(v,q);
        if(z2!==zones[j]) vus.push(eti+' : '+plcEcrit(v,null)+' → « '+zones[j]+' » en entiers, « '+z2+' » par l\\'écriture');
      });
      if(vus.length) break;
      /* chaque zone reçoit exactement un nombre, comme sur le papier */
      if(new Set(zones).size!==3){ vus.push(eti+' : les trois nombres n\\'occupent pas les trois zones ('+zones.join(', ')+')'); break; }
      /* aucun nombre ne tombe SUR une graduation : il n'appartiendrait alors à
         aucune zone, et la question n'aurait pas de réponse */
      q.nombres.forEach(function(v){ if(plcCmp(v,q.a)===0||plcCmp(v,q.b)===0) surBorne++; });
      /* le bouton d'aide doit avoir de quoi faire */
      const ks=[q.a.k,q.b.k].concat(q.nombres.map(function(v){ return v.k; }));
      if(new Set(ks).size<2){ vus.push(eti+' : les cinq nombres ont tous le même nombre de décimales, « ajouter les zéros » ne ferait rien'); break; }
      const dmax=plcDecMax(q);
      if(dmax>3){ vus.push(eti+' : '+dmax+' décimales, la fiche n\\'en écrit jamais autant'); break; }
      /* et l'écriture complétée doit valoir EXACTEMENT le nombre : c'est toute
         la promesse du bouton. On relit ce qu'il écrit. */
      [q.a,q.b].concat(q.nombres).forEach(function(v){
        const t=plcEcrit(v,dmax), neg=t.charAt(0)==='\\u2212';
        const parts=(neg?t.slice(1):t).split(',');
        const k=(parts[1]||'').length;
        const n=parseInt(parts[0]+(parts[1]||''),10)*(neg?-1:1);
        if(plcCmp({n:n,k:k}, v)!==0) vus.push(eti+' : « '+t+' » ne vaut pas '+plcEcrit(v,null));
      });
      if(q.a.n<0) negatifs++;
      const gk=Math.max(q.a.k,q.b.k);
      q.nombres.forEach(function(v){ if(v.k<gk) moinsDec++; if(v.k>gk) plusDec++; });
    }
    if(surBorne) vus.push(surBorne+' nombre(s) tombent SUR une graduation : ils n\\'appartiennent à aucune zone');

    /* Le garde-fou du tirage — « aucun nombre sur une graduation » — n'a jamais
       rien à écarter, parce que plcAuDela() ne rend JAMAIS la borne elle-même.
       Le retirer ne change donc rien, et le compteur ci-dessus reste à zéro :
       il ne mesure pas ce qu'on croit. Ce qu'il faut éprouver est la propriété
       dont il dépend, et celle-là s'éprouve directement. */
    if(!vus.length && typeof plcAuDela==='function'){
      let hors=0;
      for(let F=3;F<=4 && !hors;F++){
        for(let dec=1; dec<=3 && !hors; dec++){
          for(let b=-2999; b<=2999 && !hors; b+=137){
            const bF=b*Math.pow(10,F-2);
            for(let e=0;e<=2;e++){
              if(plcAuDela(bF,+1,dec,F,e)<=bF) hors++;
              if(plcAuDela(bF,-1,dec,F,e)>=bF) hors++;
            }
          }
        }
      }
      if(hors) vus.push('plcAuDela rend '+hors+' valeur(s) du mauvais côté de la borne, ou la borne elle-même : un nombre pourrait tomber sur une graduation');
    }
    if(!vus.length){
      /* les deux pièges de la fiche doivent SORTIR, sinon l'exercice a perdu
         ce qu'il enseigne sans que rien ne casse */
      if(!negatifs) vus.push('aucune droite négative en '+TOURS+' tirages : le piège de « −1,59 est après −1,6 » a disparu');
      if(!moinsDec) vus.push('aucun nombre à MOINS de décimales que les graduations en '+TOURS+' tirages : le piège de « 1,1 face à 1,08 » a disparu');
      if(!plusDec)  vus.push('aucun nombre à PLUS de décimales que les graduations en '+TOURS+' tirages');
    }

    /* ---- 4. la correction, exercée pour de vrai --------------------------- */
    if(!vus.length){
      startPlc();
      const q=test.questions[test.idx];
      const cases=plcCases(q);
      if(!document.getElementById('plcZeroBtn')) vus.push('le bouton « Ajouter les zéros » n\\'est pas sur l\\'écran : l\\'aide est écrite mais rien n\\'y mène');
      /* on répond juste : tout doit être compté juste */
      cases.forEach(function(c){ const sel=document.getElementById(c.id); if(sel) sel.value=c.bon; });
      checkPlcAnswer();
      let a=test.answers[test.answers.length-1]||{};
      if(!a.correct) vus.push('une réponse entièrement juste est comptée fausse');
      if(a.justes!==cases.length || a.cases!==cases.length)
        vus.push('la note affichée compte '+a.justes+' case(s) juste(s) sur '+a.cases+', au lieu de '+cases.length+' sur '+cases.length);
      /* et le bouton d'aide ne déplace AUCUNE réponse */
      const avant=plcCases(q).map(function(c){ return c.bon; }).join(' ');
      plcAppuiZeros(true); plcAppuiZeros(false);
      const apres=plcCases(q).map(function(c){ return c.bon; }).join(' ');
      if(avant!==apres) vus.push('« voir les zéros » change la correction : ' + avant + ' devient ' + apres);
      /* L'AIDE NE DURE QUE LE TEMPS DE L'APPUI. C'est tout ce qui la distingue
         d'un exercice où les zéros seraient déjà écrits : l'élève jette un œil,
         relâche, et compare lui-même. Un bouton resté bloqué en position
         « affiché » ne casserait rien — il retirerait simplement l'exercice. */
      const lu=function(){
        const t=[document.getElementById('plc-ta'),document.getElementById('plc-tb')]
          .concat(q.nombres.map(function(v,i){ return document.getElementById('plc-n-'+i); }));
        return t.map(function(e){ return e?e.textContent:'?'; }).join(' ');
      };
      test.plcZeros=false; plcAppuiZeros(false); renderPlcTest();
      const nu=lu();
      plcAppuiZeros(true);
      const tenu=lu();
      plcAppuiZeros(false);
      const relache=lu();
      const d=plcDecMax(q);
      const attenduTenu=[q.a,q.b].concat(q.nombres).map(function(v){ return plcEcrit(v,d); }).join(' ');
      const attenduNu=[q.a,q.b].concat(q.nombres).map(function(v){ return plcEcrit(v,null); }).join(' ');
      if(nu!==attenduNu) vus.push('sans appui, les nombres ne sont pas dans leur écriture naturelle : « '+nu+' »');
      if(tenu!==attenduTenu) vus.push('bouton MAINTENU, les zéros ne sont pas tous posés : « '+tenu+' » au lieu de « '+attenduTenu+' »');
      if(relache!==nu) vus.push('bouton RELÂCHÉ, les zéros restent affichés : « '+relache+' » — l\\'aide est devenue l\\'exercice');
      if(nu===attenduTenu) vus.push('ce tirage écrit déjà tout à la même longueur : le contrôle ne mesure rien');
      /* et le bouton s'écoute à l'APPUI, pas au clic : un clic n'arrive qu'une
         fois le doigt levé, c'est-à-dire trop tard. */
      const b=document.getElementById('plcZeroBtn');
      if(b && b.getAttribute('onclick')) vus.push('le bouton des zéros répond encore à onclick : le clic arrive après le relâchement');
      /* on répond FAUX sur une nouvelle question : rien ne doit passer */
      test.idx=0; test.locked=false; test.score=0; test.answers=[]; test.plcZeros=false;
      renderPlcTest();
      const q2=test.questions[0], c2=plcCases(q2);
      const ordre=['avant','entre','apres'];
      c2.forEach(function(c){ const sel=document.getElementById(c.id);
        if(sel) sel.value=ordre[(ordre.indexOf(c.bon)+1)%3]; });
      checkPlcAnswer();
      a=test.answers[test.answers.length-1]||{};
      if(a.correct) vus.push('trois zones décalées d\\'un cran sont comptées justes');
      if(a.justes!==0) vus.push('trois réponses fausses comptent '+a.justes+' case(s) juste(s)');
      /* et la correction MONTRE la méthode : les cinq nombres passent à la
         même longueur, comme le ferait le bouton */
      if(!test.plcZeros) vus.push('la correction ne complète pas les nombres de zéros : elle décrit la méthode sans la montrer');
      /* Et un appui qui suit la correction ne doit pas l'emporter en se
         relâchant : ce sont DEUX états, et un seul drapeau ferait disparaître
         la méthode juste au moment où on la montre. */
      if(test.plcZeros){
        plcAppuiZeros(true); plcAppuiZeros(false);
        const apresAppui=[document.getElementById('plc-ta'),document.getElementById('plc-tb')]
          .map(function(e){ return e?e.textContent:'?'; }).join(' ');
        const q3=test.questions[test.idx], d3=plcDecMax(q3);
        if(apresAppui!==[q3.a,q3.b].map(function(v){ return plcEcrit(v,d3); }).join(' '))
          vus.push('un appui relâché efface les zéros que la CORRECTION avait posés');
      }
    }
    return vus.join(' | ');
  })()`, v => v === '', undefined);
}

function seconde(w){
  verifierEval(w, 'le schéma d’un intervalle dit la même chose que son écriture', `(function(){
    if(typeof ITV_FORMES==='undefined' || typeof itvGen!=='function' || typeof itvSchema!=='function')
      return 'l\\'exercice des intervalles est introuvable : le contrôle ne mesure rien';
    const vus=[], pres=function(a,b){ return Math.abs(a-b)<0.5; };
    for(let tour=0; tour<400 && vus.length<6; tour++){
      const f=ITV_FORMES[tour%ITV_FORMES.length], q=itvGen(f), nom=itvPlain(q);
      /* 1. la question survit à un aller-retour JSON : la pause l'écrit en base,
            et une borne rangée en Infinity y deviendrait null sans un mot. */
      if(JSON.stringify(JSON.parse(JSON.stringify(q)))!==JSON.stringify(q))
        vus.push(nom+' : ne survit pas à un aller-retour JSON');
      /* 2. les bornes tiennent sur la droite dessinée, et dans l'ordre */
      if(q.bg!==null && (q.bg<ITV_MIN||q.bg>ITV_MAX)) vus.push(nom+' : borne gauche hors de la droite graduée');
      if(q.bd!==null && (q.bd<ITV_MIN||q.bd>ITV_MAX)) vus.push(nom+' : borne droite hors de la droite graduée');
      if(q.bg!==null && q.bd!==null && !(q.bg<q.bd)) vus.push(nom+' : bornes dans le désordre');
      /* 3. les trois lignes à compléter se répondent l'une l'autre */
      const cases=itvCases(q), par={};
      cases.forEach(function(c){ par[c.id]=c.bon; });
      if(par['itv-cg']!==(q.fg?'[':']')) vus.push(nom+' : crochet de gauche');
      if(par['itv-cd']!==(q.fd?']':'[')) vus.push(nom+' : crochet de droite');
      if(par['itv-og']!==(q.fg?'ferme':'ouvert')) vus.push(nom+' : « ouvert / fermé » à gauche');
      if(par['itv-od']!==(q.fd?'ferme':'ouvert')) vus.push(nom+' : « ouvert / fermé » à droite');
      if(q.bg!==null && par['itv-ig']!==(q.fg?'le':'lt')) vus.push(nom+' : inégalité de gauche');
      if(q.bd!==null && par['itv-id']!==(q.fd?'le':'lt')) vus.push(nom+' : inégalité de droite');
      /* 4. l'infini n'est jamais fermé, et n'a pas d'inégalité : « x ≤ +∞ » ne
            veut rien dire, et une case posée là n'aurait pas de bonne réponse. */
      if(q.bg===null && (q.fg || par['itv-og']!=='ouvert' || par['itv-ig']!==undefined))
        vus.push(nom+' : −∞ n\\'est pas traité comme une borne ouverte sans inégalité');
      if(q.bd===null && (q.fd || par['itv-od']!=='ouvert' || par['itv-id']!==undefined))
        vus.push(nom+' : +∞ n\\'est pas traité comme une borne ouverte sans inégalité');
      /* 5. LE DESSIN, dans SES DEUX TAILLES. « {intervalles-inegalite} » propose
            quatre schémas côte à côte, rendus par le même itvSchema() en mode
            « mini » : traits, points et crochets y sont grossis dans le viewBox
            pour rester lisibles une fois réduits. Ne mesurer que le grand aurait
            laissé la moitié du dessin hors du banc — et c'est justement celle
            que l'élève compare case par case. */
      [false,true].forEach(function(mini){
      const svg=String(itvSchema(q,mini)), ticks=[];
      let rouge=null;
      svg.replace(/<line x1="([-\\d.]+)" y1="([-\\d.]+)" x2="([-\\d.]+)" y2="([-\\d.]+)"([^>]*)>/g,
        function(t,x1,y1,x2,y2,reste){
          if(x1===x2) ticks.push(parseFloat(x1));
          else if(reste.indexOf('E5232B')>=0) rouge=[parseFloat(x1),parseFloat(x2)];
          return t;
        });
      ticks.sort(function(a,b){ return a-b; });
      const attendu=ITV_MAX-ITV_MIN+1;
      const taille=mini?' (schéma réduit)':'';
      if(ticks.length!==attendu){ vus.push(nom+taille+' : '+ticks.length+' graduations au lieu de '+attendu); return; }
      if(!rouge){ vus.push(nom+taille+' : aucun trait rouge dans le schéma'); return; }
      const posDe=function(v){ return ticks[v-ITV_MIN]; };
      /* le trait rouge part de la borne, ou file au-delà de la droite graduée */
      if(q.bg===null){ if(!(rouge[0]<ticks[0])) vus.push(nom+taille+' : le trait rouge ne part pas au-delà de la première graduation'); }
      else if(!pres(rouge[0],posDe(q.bg))) vus.push(nom+taille+' : le trait rouge ne part pas de '+itvNum(q.bg));
      if(q.bd===null){ if(!(rouge[1]>ticks[ticks.length-1])) vus.push(nom+taille+' : le trait rouge ne file pas au-delà de la dernière graduation'); }
      else if(!pres(rouge[1],posDe(q.bd))) vus.push(nom+taille+' : le trait rouge ne s\\'arrête pas à '+itvNum(q.bd));
      const milieu=(rouge[0]+rouge[1])/2;
      /* les points pleins (bornes prises) et les crochets (bornes exclues) */
      const points=[], crochets=[];
      svg.replace(/<circle cx="([-\\d.]+)"/g, function(t,x){ points.push(parseFloat(x)); return t; });
      svg.replace(/<path d="M ([-\\d.]+) [-\\d.]+ L ([-\\d.]+) [^"]*"([^>]*)>/g,
        function(t,x1,x2,reste){ if(reste.indexOf('E5232B')>=0) crochets.push([parseFloat(x1),parseFloat(x2)]); return t; });
      const pleines=[q.bg,q.bd].filter(function(v,i){ return v!==null && (i?q.fd:q.fg); });
      const vides=[q.bg,q.bd].filter(function(v,i){ return v!==null && !(i?q.fd:q.fg); });
      if(points.length!==pleines.length) vus.push(nom+taille+' : '+points.length+' point(s) plein(s) pour '+pleines.length+' borne(s) prise(s)');
      if(crochets.length!==vides.length) vus.push(nom+taille+' : '+crochets.length+' crochet(s) pour '+vides.length+' borne(s) exclue(s)');
      pleines.forEach(function(v){
        if(!points.some(function(x){ return pres(x,posDe(v)); })) vus.push(nom+taille+' : aucun point plein sur '+itvNum(v));
      });
      vides.forEach(function(v){
        const c=crochets.filter(function(b){ return pres(b[1],posDe(v)); })[0];
        if(!c){ vus.push(nom+taille+' : aucun crochet sur '+itvNum(v)); return; }
        /* LE POINT QUI COMPTE : le crochet TOURNE LE DOS à l'intervalle. Ses
           bras doivent s'écarter du trait rouge, comme le « ] » de ]−2 ; 3[
           s'écarte de ce qu'il ouvre. Retourné, il dit « borne prise » à
           l'élève pendant que la correction attend « exclue ». */
        const bras=c[0]-c[1], dehors=c[1]-milieu;
        if(bras*dehors<=0) vus.push(nom+taille+' : le crochet de '+itvNum(v)+' tourne ses bras VERS l\\'intervalle');
      });
      });
    }
    return vus.join(' | ');
  })()`, v => v === '', undefined);

  /* ---- La note d'une question compte ses cases JUSTES, pas seulement ses
     fautes ------------------------------------------------------------------
     ptsEcran() calcule la note affichée sous le retour, et il ne connaît que
     trois classes : « ok », « bad » et « sol ». Une case juste marquée d'une
     autre classe n'est comptée nulle part — elle sort du dénominateur en même
     temps que du numérateur —, si bien qu'une question réussie à trois cases
     sur cinq annonçait « 0 case juste sur 2 », et qu'une question TOUTE juste
     n'affichait plus de note du tout. Deux exercices de la Seconde marquaient
     « good » : les ensembles de nombres et la lecture graphique.
     Rien ne casse, rien ne rougit, et la note enregistrée en base reste juste :
     seule la note montrée à l'élève ment. C'est exactement le genre de défaut
     qu'aucune relecture ne voit, parce que le mot « good » est parfaitement
     sensé partout ailleurs. On répond donc juste, pour de vrai, et on lit ce
     que la page a compté. */
  verifierEval(w, 'la note d’une question compte ses cases justes, pas seulement ses fautes', `(function(){
    const vus=[];
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='train'; currentDM=null;
    /* Les ensembles de nombres : cinq cases, on les remplit toutes juste. */
    if(typeof startEns!=='function' || typeof ENS_SETS_ORDER==='undefined') vus.push('les ensembles de nombres sont introuvables');
    else {
      startEns(1);
      const q=test.questions[test.idx];
      ENS_SETS_ORDER.forEach(function(k){ const s=document.getElementById('ens-s-'+k); if(s) s.value=q.sets[k]?'in':'out'; });
      checkEnsAnswer();
      const a=test.answers[test.answers.length-1]||{}, n=ENS_SETS_ORDER.length;
      if(a.cases!==n || a.justes!==n) vus.push('ensembles de nombres : '+a.justes+' case(s) juste(s) sur '+a.cases+' comptée(s), au lieu de '+n+' sur '+n);
    }
    /* Les intervalles : sept ou huit cases selon la question. */
    if(typeof startItv!=='function' || typeof itvCases!=='function') vus.push('les intervalles sont introuvables');
    else {
      startItv();
      const q=test.questions[test.idx], cs=itvCases(q);
      cs.forEach(function(c){ const s=document.getElementById(c.id); if(s) s.value=c.bon; });
      checkItvAnswer();
      const a=test.answers[test.answers.length-1]||{};
      if(a.cases!==cs.length || a.justes!==cs.length) vus.push('intervalles : '+a.justes+' case(s) juste(s) sur '+a.cases+' comptée(s), au lieu de '+cs.length+' sur '+cs.length);
    }
    /* La lecture graphique ne se résout pas en trois lignes — il faudrait
       relire la courbe. Son marquage vit heureusement à un seul endroit,
       lvMarkFields(), et c'est ce point-là qui doit parler la même langue que
       ptsEcran() : on lui donne une case fausse et le reste juste. */
    if(typeof startLV!=='function' || typeof lvMarkFields!=='function' || typeof lvCheckPart!=='function')
      vus.push('la lecture graphique est introuvable');
    else {
      startLV();
      const q=test.questions[test.idx], res=lvCheckPart(q);
      if(!res.subs.length) vus.push('lecture graphique : aucune case à marquer, le contrôle ne mesure rien');
      else {
        /* La valeur attendue VOYAGE avec la case, et il faut la donner ici
           aussi : depuis qu'une case vide reçoit la réponse en bleu au lieu de
           rougir, c'est elle qui la fait compter. Sans « val », la case fautive
           ne recevait plus aucune classe et sortait du dénominateur — « 6 sur
           6 » au lieu de « 6 sur 7 ». Le contrôle a vu le changement tout de
           suite, ce qui est exactement son travail. */
        const faits=res.subs.map(function(x,i){ return {id:x.id, val:x.val, ok:i>0}; });
        lvMarkFields({subs:faits}, true);
        const m=ptsEcran()||{};
        if(m.cases!==faits.length || m.justes!==faits.length-1)
          vus.push('lecture graphique : '+m.justes+' case(s) juste(s) sur '+m.cases+' comptée(s), au lieu de '+(faits.length-1)+' sur '+faits.length);
      }
    }
    return vus.join(' | ');
  })()`, v => v === '', undefined);

  /* ---- Chaque exercice a vraiment quelque chose à dire au modèle ----------
     conseilCtxCourant() sert deux aides : le Conseil du soutien et la fenêtre
     « Question à l'IA ». Trois exercices ont leur propre description ; tous les
     autres se lisent À L'ÉCRAN, par ctxVisible() — qui cherche un énoncé, une
     scène et les saisies de l'élève. Un exercice dont l'écran ne porterait
     aucun de ces repères retomberait sur la phrase de secours, « L'élève est en
     difficulté sur un exercice de mathématiques de Seconde », et le modèle
     répondrait dans le vide : rien ne casse, rien ne rougit, l'aide est
     simplement devenue creuse.
     On OUVRE donc chaque exercice et on lit ce qui partirait. La phrase de
     secours est refusée nommément — elle est le signe que rien n'a été trouvé,
     et sa présence est précisément ce qu'on ne veut pas voir. */
  verifierEval(w, 'chaque exercice a un contexte à envoyer au modèle', `(function(){
    if(typeof conseilCtxCourant!=='function') return 'conseilCtxCourant() introuvable : le contrôle ne mesure rien';
    const SECOURS='en difficulté sur un exercice';
    currentEleve={id:'e-controle',prenom:'Contrôle'}; currentMode='soutien'; currentDM=null;
    const creux=[], mesures=[];
    Object.keys(TESTS).forEach(function(id){
      const t=TESTS[id]; if(!t || typeof t.start!=='function') return;
      currentTestId=id;
      try{ t.start(); }catch(e){ creux.push(id+' (ne démarre pas : '+e.message+')'); return; }
      let c='';
      try{ c=String(conseilCtxCourant()||''); }catch(e){ creux.push(id+' (contexte illisible : '+e.message+')'); return; }
      if(c.indexOf(SECOURS)>=0){ creux.push(id+' (retombe sur la phrase de secours)'); return; }
      if(c.length<60){ creux.push(id+' ('+c.length+' caractères seulement)'); return; }
      /* une référence {identifiant} non résolue partirait telle quelle au modèle */
      const acc=(c.match(/\{[a-z0-9-]+\}/g)||[]).filter(function(m){ return TESTS[m.slice(1,-1)]; });
      if(acc.length){ creux.push(id+' (accolade non résolue : '+acc.join(' ')+')'); return; }
      mesures.push([id,c.length]);
    });
    if(!mesures.length) return 'aucun exercice n\\'a produit de contexte : le contrôle ne mesure rien';
    return creux.join(' | ');
  })()`, v => v === '', undefined);

  /* ---- De l'inégalité à l'intervalle : ce qu'on donne doit être vrai -----
     Le miroir de l'exercice précédent. On ne donne que l'inégalité, et l'élève
     retrouve le dessin, l'écriture et la phrase « ouvert / fermé en … ».
     Quatre bords, tous silencieux :

     · l'inégalité affichée CONTREDIT l'intervalle attendu. L'énoncé est alors
       faux avant que l'élève ne commence, et la correction lui donne tort sur
       une lecture juste. C'est le pire des quatre, et rien ne le signale.
     · deux propositions IDENTIQUES : l'élève a deux bonnes réponses et une
       seule est comptée juste.
     · « bon » ne DÉSIGNE pas la bonne : la correction rouge une réponse juste.
     · les quatre ne sont pas MÉLANGÉES. Rien ne casse — mais la bonne tombe
       toujours au même rang, et l'élève apprend le rang, pas les intervalles. */
  verifierEval(w, 'l’inégalité donnée dit bien l’intervalle attendu', `(function(){
    if(typeof itqGen!=='function' || typeof itqInegalite!=='function' || typeof itqCases!=='function')
      return 'l\\'exercice « de l\\'inégalité à l\\'intervalle » est introuvable';
    const vus=[], rangs={};
    for(let tour=0; tour<400 && vus.length<5; tour++){
      const f=ITV_FORMES[tour%ITV_FORMES.length], q=itqGen(f), nom=itvPlain(q);
      /* 1. l'inégalité affichée redit exactement l'intervalle attendu */
      const ineg=String(itqInegalite(q));
      const g=(q.bg!==null), d=(q.bd!==null);
      const attendu=(g&&d) ? (itvNum(q.bg)+' '+(q.fg?'\\u2264':'<')+' x '+(q.fd?'\\u2264':'<')+' '+itvNum(q.bd))
                 : g ? (itvNum(q.bg)+' '+(q.fg?'\\u2264':'<')+' x')
                     : ('x '+(q.fd?'\\u2264':'<')+' '+itvNum(q.bd));
      if(ineg!==attendu) vus.push(nom+' : on affiche « '+ineg+' » pour « '+attendu+' »');
      /* une borne infinie ne peut pas porter d'inégalité : « x \\u2264 +\\u221e » n'a pas de sens */
      if(!g && ineg.indexOf(ITV_INF_N)>=0) vus.push(nom+' : \\u2212\\u221e apparaît dans l\\'inégalité');
      if(!d && ineg.indexOf(ITV_INF_P)>=0) vus.push(nom+' : +\\u221e apparaît dans l\\'inégalité');
      /* 2. quatre propositions, toutes différentes */
      const c=q.cands||[];
      if(c.length!==4){ vus.push(nom+' : '+c.length+' proposition(s) au lieu de 4'); continue; }
      const cles=c.map(function(x){ return x.bg+'|'+x.bd+'|'+x.fg+'|'+x.fd; });
      if(new Set(cles).size!==4) vus.push(nom+' : deux propositions identiques \\u2014 deux bonnes réponses possibles');
      /* 3. « bon » désigne la bonne, et elle est la SEULE à correspondre */
      const justes=c.filter(function(x){ return itqMeme(x,q); }).length;
      if(justes!==1) vus.push(nom+' : '+justes+' proposition(s) correspondent à l\\'intervalle attendu');
      else if(!itqMeme(c[q.bon]||{}, q)) vus.push(nom+' : « bon » ne désigne pas la bonne proposition');
      /* 4. et le rang de la bonne varie, FORME PAR FORME. Compter les rangs
            toutes formes confondues ne prouvait rien : sans mélange, les quatre
            combinaisons de crochets sortent dans un ordre fixe, si bien que la
            bonne tombe à un rang différent selon la forme — quatre rangs
            distincts, et le contrôle passait au vert sur un tirage qui n'était
            pas mélangé du tout. Ce qui compte est qu'à forme ÉGALE le rang
            change : c'est ce qu'un élève apprendrait par cœur. */
      const cle='f'+(tour%ITV_FORMES.length);
      (rangs[cle]=rangs[cle]||{})[q.bon]=true;
      /* 5. les cases attendues suivent l'intervalle, comme dans l'exercice miroir */
      const par={}; itqCases(q).forEach(function(x){ par[x.id]=x.bon; });
      if(par['itq-cg']!==(q.fg?'[':']')) vus.push(nom+' : crochet de gauche');
      if(par['itq-cd']!==(q.fd?']':'[')) vus.push(nom+' : crochet de droite');
      if(par['itq-og']!==(q.fg?'ferme':'ouvert')) vus.push(nom+' : « ouvert / fermé » à gauche');
      if(par['itq-od']!==(q.fd?'ferme':'ouvert')) vus.push(nom+' : « ouvert / fermé » à droite');
      if(par['itq-sch']!==String(q.bon)) vus.push(nom+' : la case du schéma ne désigne pas la bonne');
    }
    const figees=Object.keys(rangs).filter(function(k){ return Object.keys(rangs[k]).length<2; });
    if(!vus.length && figees.length)
      vus.push(figees.length+' forme(s) sur '+Object.keys(rangs).length+
               ' posent toujours la bonne au même rang : l\\'élève apprendrait le rang, pas les intervalles');
    return vus.slice(0,4).join(' | ');
  })()`, v => v === '', undefined);

  /* ---- « Appartient ou pas ? » : l'arithmétique avant tout ---------------
     Le risque de cet exercice n'est pas graphique, il est ARITHMÉTIQUE. Une
     comparaison en virgule flottante peut faire dire à la page le contraire
     des mathématiques sur une borne — 2 qui n'appartiendrait pas à [2 ; 3] —
     et l'élève serait compté faux sur une réponse juste, sans que rien ne
     rougisse. C'est le pire défaut possible pour un exercice : il apprend
     l'inverse de ce qu'il enseigne.

     Le contrôle compare donc appCmp() à LA FICHE, item par item — les vingt
     items décimaux du tableau, et les douze cas d'irrationnels, de fractions
     et d'unités des exercices 5 et 6. Ce sont les réponses du papier, pas les
     miennes : si le code et la fiche divergent, c'est le code qui a tort.

     Trois autres bords. Une question toute ∈ ou toute ∉ se répondrait sans
     rien lire — le premier tirage du niveau 2 donnait trois ∈ sur quatre.
     La bonne réponse doit être CALCULÉE par la fonction qui corrige, jamais
     rangée à côté : sinon l'énoncé peut contredire sa correction. Et un
     irrationnel ne doit jamais frôler une borne de trop près : la comparaison
     resterait juste, mais l'exercice deviendrait un piège de précision. */
  verifierEval(w, 'l\u2019appartenance à un intervalle est calculée exactement', `(function(){
    if(typeof appCmp!=='function' || typeof appDansIntervalle!=='function')
      return 'l\\'exercice « appartient ou pas ? » est introuvable';
    const vus=[];
    const D=function(t){ const neg=t[0]==='-'; t=t.replace('-','');
      const m=t.split(','), d=m[1]||'';
      return {n:(neg?-1:1)*parseInt(m[0]+d,10), k:d.length}; };
    const IV=function(t){ return {a:D(t[1]), b:D(t[2]), fg:t[0]==='[', fd:t[3]===']'}; };
    /* [nombre, [crochetG, borneG, borneD, crochetD], réponse de la FICHE] */
    const dec=function(t){ const d=D(t); return {t:'dec', n:d.n, k:d.k}; };
    const FICHE=[
      [dec('2,9'),['[','2','3',']'],true],   [dec('1,9'),['[','2','3',']'],false],
      [dec('2'),['[','2','3',']'],true],     [dec('3'),['[','2','3',']'],true],
      [dec('2,9'),[']','2','3',']'],true],   [dec('2,1'),[']','2','3',']'],true],
      [dec('2'),[']','2','3',']'],false],    [dec('3'),[']','2','3',']'],true],
      [dec('2,02'),[']','2,1','2,9','['],false], [dec('2,09'),[']','2,1','2,9','['],false],
      [dec('2,91'),[']','2,1','2,9','['],false], [dec('2,89'),[']','2,1','2,9','['],true],
      [dec('-3,02'),[']','-4,8','-3,1','['],false], [dec('-4,12'),[']','-4,8','-3,1','['],true],
      [dec('-3,12'),[']','-4,8','-3,1','['],true],  [dec('-4,09'),[']','-4,8','-3,1','['],true],
      [dec('-3,082'),[']','-4,8','-3,1','['],false], [dec('-4,122'),[']','-4,8','-3,1','['],true],
      [dec('-3,099'),[']','-4,8','-3,1','['],false], [dec('-4,785'),[']','-4,8','-3,1','['],true],
      [{t:'pi'},['[','3','4',']'],true],     [{t:'pi'},['[','3','3,2',']'],true],
      [{t:'pi'},['[','3','3,1',']'],false],  [{t:'pi'},['[','3','3,14',']'],false],
      [{t:'pi'},['[','3,14','3,141',']'],false],
      [{t:'rac',n:2},[']','1','2',']'],true], [{t:'rac',n:15},[']','3','4','['],true],
      [{t:'frac',p:2,q:5},[']','0,39','2,5',']'],true],
      [dec('-0,25'),[']','-0,3','-0,2','['],true],
      [dec('-0,199'),[']','-0,2','-0,19','['],true],
      [{t:'mult',n:2,k:1,u:'millier'},['[','0,2','0,3','['],false],
      [{t:'mult',n:2,k:1,u:'millier'},['[','200','201','['],true],
      /* Ceux-ci ne sont pas sur la fiche : ils épinglent le cas où la valeur
         tombe EXACTEMENT sur la borne après conversion d'unité — « 0,1
         millier » vaut 100 tout rond, et c'est alors le crochet, et lui seul,
         qui décide. C'est le cas qu'un arrondi d'un cran ferait basculer. */
      [{t:'mult',n:1,k:1,u:'millier'},[']','100','101','['],false],
      [{t:'mult',n:1,k:1,u:'millier'},['[','100','101','['],true],
      [{t:'mult',n:7,k:1,u:'centaine'},[']','70','71','['],false],
      /* Et ceux-là défendent l'échelle des racines : avec des bornes entières,
         une erreur d'exposant reste invisible. */
      [{t:'rac',n:15},['[','3,87','3,88',']'],true],
      [{t:'rac',n:15},['[','3,88','3,9',']'],false],
      [{t:'rac',n:2},['[','1,41','1,42',']'],true],
      [{t:'rac',n:2},[']','1,42','1,5','['],false]
    ];
    FICHE.forEach(function(x){
      const vu=appDansIntervalle(x[0], IV(x[1]));
      if(vu!==x[2]) vus.push(appNombrePlain(x[0])+' '+appIntervalle(IV(x[1]))+' : la page dit '
        +(vu?'∈':'∉')+', la fiche dit '+(x[2]?'∈':'∉'));
    });
    if(vus.length) return vus.slice(0,3).join(' | ');
    /* Force brute contre une référence indépendante — décimaux, puis racines.
       Les racines demandent leur propre balayage : avec les seules bornes
       entières de la fiche, une erreur d'échelle (n·10^k au lieu de n·10^2k)
       reste parfaitement invisible. */
    for(let n=-300;n<=300 && vus.length<3;n++) for(let m=-30;m<=30;m++){
      const attendu=Math.sign(n/100-m/10);
      if(appCmp({t:'dec',n:n,k:2},{n:m,k:1})!==attendu){
        vus.push('décimaux : '+(n/100)+' contre '+(m/10)+' mal comparés'); break; }
    }
    for(let n=2;n<=60 && vus.length<3;n++) for(let m=0;m<=250;m++){
      const ecart=Math.sqrt(n)-m/100;
      const attendu=(Math.abs(ecart)<1e-12)?0:Math.sign(ecart);
      if(appCmp({t:'rac',n:n},{n:m,k:2})!==attendu){
        vus.push('racines : √'+n+' contre '+(m/100)+' mal comparé'); break; }
    }
    if(vus.length) return vus.slice(0,3).join(' | ');
    /* Le tirage : équilibre, cohérence, et l'écart des irrationnels. */
    for(let niveau=1; niveau<=2 && vus.length<3; niveau++){
      for(let tour=0; tour<80 && vus.length<3; tour++){
        const q=(niveau===1)?appGen1():appGen2();
        if(!q.lignes || q.lignes.length!==4){ vus.push('niveau '+niveau+' : '+((q.lignes||[]).length)+' ligne(s) au lieu de 4'); break; }
        const n=q.lignes.filter(function(l){ return l.dans; }).length;
        if(n===0 || n===4) vus.push('niveau '+niveau+' : les quatre lignes ont la même réponse — elle se devine sans lire');
        if(niveau===2 && n!==2) vus.push('niveau 2 : '+n+' ∈ sur 4 — le tirage penche d\\'un côté');
        q.lignes.forEach(function(l){
          /* la réponse affichée EST celle que la correction calculera */
          if(l.dans!==appDansIntervalle(l.v,l.iv))
            vus.push(appNombrePlain(l.v)+' : la réponse rangée contredit la correction');
          /* bornes dans l'ordre */
          if(appCmp({t:'dec',n:l.iv.a.n,k:l.iv.a.k}, l.iv.b)>=0)
            vus.push('bornes dans le désordre : '+appIntervalle(l.iv));
          /* un irrationnel ne frôle jamais une borne */
          if(l.v.t==='rac' || l.v.t==='pi'){
            const x=appVal(l.v);
            [l.iv.a,l.iv.b].forEach(function(b){
              if(Math.abs(x-b.n/Math.pow(10,b.k))<1e-6)
                vus.push(appNombrePlain(l.v)+' frôle la borne '+appBorne(b)+' : piège de précision, pas de lecture');
            });
          }
        });
      }
    }
    return vus.slice(0,3).join(' | ');
  })()`, v => v === '', undefined);

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
    show('tm'); ouvrirTables(); show('space');   /* « home » n'existe plus : l'écran de l'élève fait aussi bien */
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
     correction révélée ; en ENTRAÎNEMENT, la case vide est complétée en vert */
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
  verifier('en entraînement, la case vide est complétée en vert', bleues > 0, 'aucune case .sol');

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
