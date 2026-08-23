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
    return longueurContexteIA(w, apres);
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
    longueurContexteIA(w, apres);
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
    /* les deux paires posées et DIVERGENTES restent fausses toutes les deux */
    r=juger3(avec({'sf-a1':9,'sf-b1':9,'sf-a2':10,'sf-b2':10}));
    if(r.ok1||r.ok2) vus.push('45 d\\'un côté et 90 de l\\'autre est accepté');
    /* l'étape ② se juge sur le dénominateur ÉCRIT, et refuse de suivre une
       étape ① qui dit autre chose */
    r=juger3(avec({'sf-a1':9,'sf-b1':9,'sf-a2':5,'sf-b2':5,'sf-num1':72,'sf-num2':20,'sf-den':45}));
    if(!r.ok3) vus.push('72 + 20 sur 45 est compté faux');
    r=juger3(avec({'sf-a1':18,'sf-b1':18,'sf-a2':5,'sf-b2':5,'sf-num1':72,'sf-num2':20,'sf-den':45}));
    if(r.ok3) vus.push('l\\'étape ② est acceptée sur 45 alors que l\\'étape ① annonce 90');
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
    /* l'étape ② et la fraction finale suivent la même règle */
    r=seul({'sf-den':40});
    if(!r.ok3) vus.push('40 écrit seul au dénominateur commun est compté faux');
    r=seul({'sf-den':42});
    if(r.ok3) vus.push('42 est accepté comme dénominateur commun de 5 et 8');
    r=seul({'sf-fn':3});
    if(!r.ok4) vus.push('3 écrit seul au numérateur de la fraction finale est compté faux');
    r=seul({'sf-fn':4});
    if(r.ok4) vus.push('4 est accepté au numérateur de la fraction finale (le résultat est 3/40)');
    /* et une copie à moitié remplie ne vaut PAS le point entier, même si tout
       ce qui y est écrit est juste : c'est le trou qu'ouvre le jugement case
       par case, et « r.vide » est ce qui le ferme */
    r=seul({'sf-a1':8,'sf-a2':5,'sf-num1':8,'sf-den':40,'sf-fn':3});
    if(!(r.ok1&&r.ok2&&r.ok3&&r.ok4)) vus.push('une demi-copie pourtant juste est comptée fausse');
    if(!r.vide) vus.push('une demi-copie passe pour complète — elle vaudrait le point entier');
    /* l'étape ② sans dénominateur écrit : c'est l'étape ① qui le dit. Sans ce
       report, un numérateur juste rougirait parce que la case du dénominateur
       commun est encore vide — le défaut signalé, une case plus loin. */
    r=seul({'sf-a1':8,'sf-b1':8,'sf-num1':8});
    if(!r.ok3) vus.push('8 au premier numérateur est compté faux alors que l\\'étape ① annonce déjà 40');
    r=seul({'sf-a1':8,'sf-b1':8,'sf-num1':5});
    if(r.ok3) vus.push('5 au premier numérateur est accepté sur le dénominateur 40 (1 × 8 = 8)');

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
    if(!r.ok4) vus.push('16 écrit seul au numérateur final est compté faux');
    r=seul({'sf-fd':3});
    if(!r.ok4) vus.push('3 écrit seul au dénominateur final est compté faux');
    r=seul({'sf-fd':6});
    if(r.ok4) vus.push('6 est accepté au dénominateur final : la fraction réduite est 16/3');
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
      const e=sflEnonceIA(q), a=sflAttenduIA(q);
      if(e.length>pireQ) pireQ=e.length;
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
