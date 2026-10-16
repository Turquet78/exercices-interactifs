/* ============================================================================
   HARNAIS DE TEST — charge une des applications dans un navigateur simulé
   ============================================================================
   Les tests tournent dans jsdom : un vrai DOM, sans fenêtre à l'écran. Deux
   substitutions sont nécessaires, parce que MathLive est un module ESM chargé
   depuis Internet que jsdom n'exécute pas :

     1. le <script type="module"> est retiré ;
     2. un élément <math-field> minimal est défini à la place, avec value,
        getValue et setValue — c'est tout ce que l'application lui demande.

   Sans le point 2, toute lecture de .value renvoie undefined et les tests
   remontent de faux échecs. C'est arrivé, d'où ce commentaire.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const SUBSTITUT = `<script>
/* LES RELEVÉS DES OBSERVATEURS DE MUTATIONS SE DÉLIVRENT À LA FIN DE CHAQUE
   CONTRÔLE (octobre 2026). Un MutationObserver ne reçoit ses relevés qu'au
   retour de la main (une microtâche), et chaque relevé garde en vie les nœuds
   RETIRÉS du DOM. Le banc enchaîne des centaines de contrôles sans jamais
   rendre la main : chaque écran redessiné restait en mémoire, et la Seconde a
   fini par épuiser les 4 Go de l'action (« heap out of memory », au 8.1.11).
   La page crée ses observateurs avec cette classe ; evaluer() (tests/
   verifier.js) appelle __viderObservateurs() après chaque contrôle, qui leur
   délivre ce qui attend, comme le navigateur au retour de la main. */
(function(){
  const MO=window.MutationObserver; if(typeof MO!=='function') return;
  const vivants=new Set();
  window.MutationObserver=class extends MO{
    constructor(cb){ super(cb); this.__cb=cb; }
    observe(c,o){ vivants.add(this); return super.observe(c,o); }
    disconnect(){ vivants.delete(this); return super.disconnect(); }
  };
  window.__viderObservateurs=function(){
    for(let tour=0; tour<5; tour++){
      let rien=true;
      vivants.forEach(function(o){ const r=o.takeRecords(); if(!r.length) return; rien=false;
        try{ o.__cb.call(o, r, o); }catch(e){ setTimeout(function(){ throw e; }, 0); } });
      if(rien) return;
    }
  };
})();
class __MathFieldFactice extends HTMLElement {
  get value(){ return this.__v || ''; }   set value(v){ this.__v = String(v); }
  getValue(){ return this.__v || ''; }    setValue(v){ this.__v = String(v); }
  get disabled(){ return !!this.__d; }    set disabled(v){ this.__d = !!v; }
  get readOnly(){ return !!this.__r; }    set readOnly(v){ this.__r = !!v; }
  executeCommand(){ return false; }
}
customElements.define('math-field', __MathFieldFactice);
/* toPlain reste un PASSE-PLAT — le contrôle qui le mesure lit la SOURCE, pas
   ce double. Deux conversions font exception, et ce sont les seules que la
   PAGE ÉCRIT elle-même dans une case avant qu'un juge ne la relise : le
   bouton ±∞ et la correction d'une case de limite y posent du LaTeX. Sans
   elles, le double rendait « -\\infty » et le juge refusait une case que la
   page venait de remplir juste. */
window.mlDexp = { toPlain:x=>String(x).replace(/\\\\infty/g,'\u221e').replace(/\\{,\\}/g,'.'),
  plainToML:x=>x, tex:()=>null, upgrade(){}, showShortcuts(){ return false; } };
</script>`;

function racine(){ return path.resolve(__dirname, '..'); }

/** Lit le fichier d'une application. Ex. : lire('premiere-specifique.html') */
function lire(fichier){
  return fs.readFileSync(path.join(racine(), fichier), 'utf8');
}

/** Charge l'application dans un DOM simulé et rend la fenêtre au rappel. */
function charger(fichier, rappel, attente = 1200){
  const html = SUBSTITUT + lire(fichier).replace(/<script type="module">[\s\S]*?<\/script>/g, '');
  const erreurs = [];
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
    virtualConsole: new (require('jsdom').VirtualConsole)().on('jsdomError', e => erreurs.push(e.message)) });
  const w = dom.window;
  w.addEventListener('error', e => erreurs.push(String(e.message)));
  setTimeout(() => rappel(w, erreurs), attente);
}

/** Prépare un élève connecté sur un exercice donné, prêt à être testé. */
function preparer(w, { mode='soutien', testId, kind, question, ecran, rendu }){
  w.eval("currentEleve={id:'test',prenom:'Test'}; currentMode='" + mode + "'; currentTestId='" + testId + "';");
  w.eval("test.kind='" + kind + "'; test.idx=0; test.questions=[" + question + "]; test.locked=false;");
  w.eval("show('" + ecran + "'); " + rendu + "();");
}

/** État de coloration d'une case : VERT, ROUGE ou neutre. */
function couleur(w, id){
  const e = w.document.getElementById(id);
  if(!e) return 'absente';
  return e.classList.contains('ok') ? 'VERT' : e.classList.contains('bad') ? 'ROUGE' : 'neutre';
}

module.exports = { charger, lire, racine, preparer, couleur };
