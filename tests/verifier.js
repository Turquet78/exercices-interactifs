/* ============================================================================
   VÉRIFICATIONS — à lancer avant toute mise en ligne :  node tests/verifier.js
   ============================================================================
   Quatre familles de contrôles, du moins au plus coûteux :

     1. STRUCTURE   syntaxe JS, accolades CSS, écrans et fonctions référencés
     2. DÉMARRAGE   la page se charge-t-elle sans erreur JavaScript ?
     3. INTERFACE   les boutons d'aide s'ouvrent-ils, y compris en fenêtre
                    détachée (le cas qui a échoué trois fois de suite) ?
     4. EXERCICES   les générateurs et la correction en direct tiennent-ils ?

   Sortie 0 si tout passe, 1 sinon — utilisable tel quel dans une action GitHub.
   ========================================================================== */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');
const { charger, lire, preparer, couleur } = require('./harnais');

const CIBLE = process.argv[2] || 'premiere-specifique.html';
let echecs = 0, controles = 0;

function verifier(intitule, condition, detail){
  controles++;
  if(condition){ console.log('   \u2713 ' + intitule); }
  else { echecs++; console.log('   \u2717 ' + intitule + (detail ? '  \u2192 ' + detail : '')); }
}
function titre(t){ console.log('\n' + t); }

/* ---------- 1. Structure ---------- */
function structure(){
  titre('1. STRUCTURE DU FICHIER');
  const s = lire(CIBLE);

  const styles = [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  styles.forEach((css, i) => {
    const o = (css.match(/\{/g)||[]).length, f = (css.match(/\}/g)||[]).length;
    verifier('bloc <style> n\u00b0' + (i+1) + ' \u00e9quilibr\u00e9', o === f, o + ' ouvrantes / ' + f + ' fermantes');
  });

  const scripts = [...s.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.forEach((js, i) => {
    const f = path.join(os.tmpdir(), 'ctrl' + i + '.js');
    fs.writeFileSync(f, js);
    let ok = true, err = '';
    try { execFileSync('node', ['--check', f], { stdio:'pipe' }); }
    catch(e){ ok = false; err = String(e.stderr).split('\n')[1] || ''; }
    fs.unlinkSync(f);
    verifier('script n\u00b0' + (i+1) + ' syntaxiquement valide', ok, err);
  });

  const ecrans = new Set([...s.matchAll(/<section class="screen" id="scr-([a-z0-9-]+)"/g)].map(m => m[1]));
  const demandes = new Set([...s.matchAll(/show\('([a-z0-9-]+)'\)/g)].map(m => m[1]));
  const manquants = [...demandes].filter(x => !ecrans.has(x));
  verifier('chaque show() vise un \u00e9cran existant', manquants.length === 0, manquants.join(', '));

  const principal = scripts.reduce((a,b) => a.length > b.length ? a : b, '');
  const definis = new Set();
  principal.split('\n').forEach(l => {
    const m = l.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/) || l.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/);
    if(m) definis.add(m[1]);
  });
  const html = s.replace(/<script[\s\S]*?<\/script>/g, '');
  const appeles = new Set([...html.matchAll(/on(?:click|mousedown|change|input)="([A-Za-z_$][\w$]*)\(/g)].map(m => m[1]));
  const orphelins = [...appeles].filter(f => !definis.has(f) && f !== 'if');
  verifier('chaque bouton appelle une fonction d\u00e9finie', orphelins.length === 0, orphelins.join(', '));
}

/* ---------- 2. Démarrage ---------- */
function demarrage(suite){
  titre('2. D\u00c9MARRAGE DE LA PAGE');
  charger(CIBLE, (w, erreurs) => {
    const reelles = erreurs.filter(e => !/Not implemented/.test(e));   /* limites de jsdom, pas de l'appli */
    verifier('aucune erreur JavaScript au chargement', reelles.length === 0, reelles.join(' | '));
    verifier('num\u00e9ro de version lisible', /^\d+$/.test(String(w.eval('APP_VERSION'))), 'APP_VERSION = ' + w.eval('APP_VERSION'));
    suite();
  });
}

/* ---------- 3. Fenêtres d'aide ---------- */
function interface_(suite){
  titre('3. BOUTONS D\'AIDE (Soutien et Question \u00e0 l\'IA)');
  charger(CIBLE, w => {
    preparer(w, { testId:'pourcentage', kind:'pct', question:'genPercent()', ecran:'ptest', rendu:'renderPTest' });
    w.eval('iaBoutons();');
    const rangee = w.document.querySelector('#scr-ptest .ia-row');
    verifier('la rang\u00e9e de boutons appara\u00eet en soutien', !!rangee && rangee.querySelectorAll('button').length === 2);

    /* le cas qui a échoué trois fois : sur ordinateur, la fenêtre se détache */
    const fenetres = [];
    w.__nouvelleFenetre = function(){
      const p = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual:true }).window;
      p.closed = false; fenetres.push(p); return p;
    };
    w.eval("detachementPossible=function(){return true;}; window.open=function(){ return window.__nouvelleFenetre(); };");
    w.eval("sb={functions:{invoke:function(){ return Promise.resolve({data:{feedback:'Indice de test.'}}); }}};");

    let ouvre = true, err = '';
    try { w.eval('ouvrirQIA()'); } catch(e){ ouvre = false; err = e.message; }
    verifier('la fen\u00eatre Question s\'ouvre d\u00e9tach\u00e9e', ouvre, err);
    verifier('sa carte est bien dans la fen\u00eatre ind\u00e9pendante',
      fenetres.some(p => p.document.querySelector('.qia-card')));

    let poser = true; err = '';
    try { w.eval("qiaPoser('Question de test.')"); } catch(e){ poser = false; err = e.message; }
    verifier('poser une question ne l\u00e8ve pas d\'erreur', poser, err);

    let soutien = true; err = '';
    try { w.eval('conseilCourant()'); } catch(e){ soutien = false; err = e.message; }
    verifier('le bouton Soutien r\u00e9pond', soutien, err);

    setTimeout(() => {
      const chercher = id => { for(const p of fenetres){ const e = p.document.getElementById(id); if(e) return e; }
                               return w.document.getElementById(id); };
      const dlg = chercher('qiaDialog');
      verifier('la r\u00e9ponse s\'affiche dans le dialogue', !!dlg && dlg.querySelectorAll('.qia-q, .qia-r').length >= 2,
        'une fen\u00eatre d\u00e9tach\u00e9e exige que $ cherche aussi dans les fen\u00eatres d\u00e9tach\u00e9es');
      const corps = chercher('conseilBody');
      verifier('le conseil du Soutien s\'affiche', !!corps && corps.textContent.trim().length > 0);

      /* contexte envoyé au modèle, pour chaque type d'exercice */
      const kinds = [['pct','genPercent()'],['pctq','genPctTaux()'],['aug','genAug()'],
                     ['augq','genAugTaux()'],['dim','genDim()'],['mp','genMultPosee()'],
                     ['md','genMultDec()'],['u','genU()']];
      let bons = 0;
      kinds.forEach(([k, gen]) => {
        try {
          w.eval("test.kind='" + k + "'; test.questions=[" + gen + "]; test.idx=0;");
          if(k === 'pctq' || k === 'augq') w.eval('test.questions[0].choisi=0;');
          if(String(w.eval('conseilCtxCourant()')).length > 80) bons++;
        } catch(e){}
      });
      verifier('le contexte IA existe pour les ' + kinds.length + ' exercices', bons === kinds.length, bons + ' sur ' + kinds.length);

      /* la feuille de styles MathLive, sans laquelle les fractions s'aplatissent */
      const css = [...w.document.querySelectorAll('style')].map(x => x.textContent).join('\n');
      verifier('les styles de fraction MathLive sont pr\u00e9sents',
        css.includes('.ML__mfrac') && css.includes('.ML__frac-line'),
        'sans eux, 25/100 s\'affiche \u00ab 10025 \u00bb');
      suite();
    }, 400);
  });
}

/* ---------- 4. Exercices ---------- */
function exercices(suite){
  titre('4. EXERCICES');
  charger(CIBLE, w => {
    /* correction en direct : une fraction n'est jugée qu'une fois complète */
    preparer(w, { testId:'pourcentage', kind:'pct', ecran:'ptest', rendu:'renderPTest',
      question:"{P:30,N:40,unit:'\u20ac',prod:1200,result:12,ci:0,v:0}" });
    const ecrire = (id, v) => { w.document.getElementById(id).value = v; };
    const quitter = () => { try { w.eval("window.dexpLiveCheck && window.dexpLiveCheck('x')"); } catch(e){} };

    ecrire('p1n', '30'); quitter();
    verifier('num\u00e9rateur seul : aucune couleur', couleur(w,'p1n') === 'neutre');
    ecrire('p1d', '100'); quitter();
    verifier('fraction compl\u00e8te et juste : les deux cases en vert',
      couleur(w,'p1n') === 'VERT' && couleur(w,'p1d') === 'VERT');
    ecrire('p2n', '1200'); ecrire('p2d', '10'); quitter();
    verifier('fraction fausse : les deux cases en rouge',
      couleur(w,'p2n') === 'ROUGE' && couleur(w,'p2d') === 'ROUGE');
    ecrire('p3', '12'); quitter();
    verifier('r\u00e9sultat d\u00e9cimal juste : case en vert', couleur(w,'p3') === 'VERT');

    w.eval("currentMode='train'; test.locked=false; renderPTest();");
    ecrire('p1n', '30'); ecrire('p1d', '100'); quitter();
    verifier('en entra\u00eenement : aucune coloration', couleur(w,'p1n') === 'neutre');

    /* générateurs : mêmes invariants que ceux vérifiés à la main jusqu'ici */
    w.eval("currentMode='soutien';");
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
      verifier('g\u00e9n\u00e9rateur ' + nom + ' : 5000 questions conformes', bilan[nom] === 0, bilan[nom] + ' anomalies'));

    /* chaque exercice doit fournir son rappel de cours */
    const sansRappel = w.eval(`(function(){
      const manquants=[];
      Object.keys(TESTS).forEach(function(id){
        const k={ 'pourcentage':'pct','pourcentage-depart':'pctq','pourcentage-taux':'pctq',
                  'augmenter-pourcentage':'aug','augmenter-depart':'augq','augmenter-taux':'augq',
                  'diminuer-pourcentage':'dim','multiplication-posee':'mp','mult-decimaux':'md',
                  'mult-dec-un':'u','fractions-decimales':'fracp',
                  'tables-multiplication':'tm','tables-multiplication-2':'tm' }[id];
        if(k && !RAPPELS[k]) manquants.push(id);
      });
      return manquants.join(', ');
    })()`);
    verifier('chaque exercice a son rappel de cours', sansRappel === '', sansRappel);

    suite();
  });
}

/* ---------- enchaînement ---------- */
console.log('V\u00e9rification de ' + CIBLE);
structure();
demarrage(() => interface_(() => exercices(() => {
  console.log('\n' + '\u2500'.repeat(58));
  console.log(echecs === 0
    ? '\u2713 ' + controles + ' contr\u00f4les pass\u00e9s. Le fichier peut \u00eatre mis en ligne.'
    : '\u2717 ' + echecs + ' \u00e9chec(s) sur ' + controles + ' contr\u00f4les. NE PAS mettre en ligne.');
  process.exit(echecs ? 1 : 0);
})));
