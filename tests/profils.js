/* ============================================================================
   PROFILS — ce que chaque application sait faire, et ce qu'elle ne sait pas
   ============================================================================
   Le banc de contrôles est le même pour les trois niveaux, mais les trois
   fichiers ne se ressemblent pas : la Seconde n'a pas de fenêtre « Question à
   l'IA », la Terminale place ses boutons d'aide en ligne au lieu d'une rangée,
   chacun a ses propres générateurs. Sans ce fichier, le banc supposait partout
   les symboles de la Première et mourait sur un ReferenceError avant d'avoir
   rendu le moindre verdict.

   Chaque profil déclare donc :

     temoin     l'exercice que le banc pilote pour ce fichier
     aide       ce qui existe du dispositif d'aide (rangée, IA, conseil, styles)
     pause      ce que la mise en pause doit savoir conserver
     relance    le « Recommencer » à vérifier
     rappels    l'expression qui liste les exercices sans rappel de cours
     specifique le bloc de contrôles propres au fichier (aujourd'hui : Première)
     lacunes    ce qui MANQUE à ce fichier, affiché à chaque exécution

   La liste « lacunes » est la partie importante. Un contrôle qu'on retire en
   silence est pire que pas de contrôle du tout : il rend le banc vert sur un
   fichier qu'il ne vérifie plus. Tout ce qui est retiré doit donc être écrit
   ici, et s'affiche en clair à la fin de chaque exécution.
   ========================================================================== */

/* Les 12 exercices de la Première dont le contexte part au modèle. */
const KINDS_PREMIERE = [
  ['pct','genPercent()'], ['pctq','genPctTaux()'], ['aug','genAug()'],
  ['augq','genAugTaux()'], ['dim','genDim()'], ['mp','genMultPosee()'],
  ['md','genMultDec()'], ['u','genU()'], ['fp','genFP()'],
  ['ag2','genAugAdd()'], ['ag2q','genDimTauxSub()'], ['syn','genSyn()'],
];

/* Identifiant d'exercice -> clé de la table RAPPELS, pour la Première. */
const RAPPELS_PREMIERE = `(function(){
  const cles={ 'calcul-mental':'cm','pourcentage':'pct','pourcentage-depart':'pctq','pourcentage-taux':'pctq',
    'augmenter-pourcentage':'aug','augmenter-depart':'augq','augmenter-taux':'augq',
    'diminuer-pourcentage':'dim','multiplication-posee':'mp','mult-decimaux':'md',
    'mult-dec-un':'u','fractions-decimales':'fracp','fraction-pourcentage':'fp',
    'augmenter-addition':'ag2','diminuer-soustraction':'ag2','augmenter-depart-addition':'ag2q',
    'diminuer-taux-soustraction':'ag2q','augmenter-taux-addition':'ag2q',
    'diminuer-depart-soustraction':'ag2q','synthese-pourcentages':'syn',
    'tables-multiplication':'tm','tables-multiplication-2':'tm' };
  const manquants=[];
  Object.keys(TESTS).forEach(function(id){
    const k=cles[id];
    if(k && !RAPPELS[k]) manquants.push(id);
  });
  return manquants.join(', ');
})()`;

/* En Terminale, RAPPELS est indexé par kind et RAPPELS_ID par identifiant : on
   vérifie qu'aucune des deux tables ne contient d'entrée vide. */
const RAPPELS_TERMINALE = `(function(){
  const vides=[];
  [['RAPPELS',typeof RAPPELS!=='undefined'?RAPPELS:null],
   ['RAPPELS_ID',typeof RAPPELS_ID!=='undefined'?RAPPELS_ID:null]].forEach(function(p){
    if(!p[1]) return;
    Object.keys(p[1]).forEach(function(k){
      const v=p[1][k];
      if(!v || !String(typeof v==='function'?v():v).trim()) vides.push(p[0]+'.'+k);
    });
  });
  return vides.join(', ');
})()`;


/* En Seconde, un rappel par kind ; RAPPELS_ID distingue les deux niveaux
   d'ensembles, qui partagent le kind 'ens'. */
const RAPPELS_SECONDE = `(function(){
  const cles={ 'ensembles-nombres':'ens','ensembles-nombres-2':'ens','definitions-ensembles':'def',
               'plus-petit-ensemble':'pge','lecture-variations':'lv','pourcentage':'pct',
               'augmenter-pourcentage':'aug','diminuer-pourcentage':'dim' };
  const manquants=[];
  Object.keys(TESTS).forEach(function(id){
    const k=cles[id];
    if(!k){ manquants.push(id+' (le contrôle ne connaît pas son kind)'); return; }
    if(!RAPPELS_ID[id] && !RAPPELS[k]) manquants.push(id);
  });
  return manquants.join(', ');
})()`;

module.exports = {

  /* ------------------------------------------------------------------ */
  'premiere-specifique.html': {
    niveau: 'Première',
    tableResultats: 'resultats_1ere',
    tableEleves: 'eleves_1ere',
    navigateur: {
      exercice: 'pourcentage', ecran: 'ptest',
      /* remplit la question courante avec la bonne réponse, dans les vrais champs */
      /* m() rend false si le champ n'existe plus : sans cela, un renommage de
         champ laissait l'élève fictif ne rien saisir, et le banc restait vert. */
      repondre: "(function(){ var q=test.questions[test.idx], ok=true; function m(i,v){ var e=document.getElementById(i); if(!e){ ok=false; return; } e.value=String(v); }"
              + " m('p1n',q.P); m('p1d',100); m('p2n',q.prod); m('p2d',100); m('p3',q.result); return ok; })()",
      valider: '#pActions button.btn-primary',
      suivant: '#pNext',
    },
    temoin: {
      testId: 'pourcentage', kind: 'pct', ecran: 'ptest', rendu: 'renderPTest',
      generateur: 'genPercent()',
      /* question figée pour la correction en direct : 30 % de 40 € = 12 */
      question: "{P:30,N:40,unit:'€',prod:1200,result:12,ci:0,v:0}",
    },
    aide: {
      amorce: 'iaBoutons();',
      rangee: { selecteur: '#scr-ptest .ia-row button', attendus: 2 },
      qiaDetachee: true,
      conseil: true,
      ctx: { appel: 'conseilCtxCourant()', seuil: 80, kinds: KINDS_PREMIERE,
             prepare: { pctq: 'test.questions[0].choisi=0;', augq: 'test.questions[0].choisi=0;' } },
      mlStatic: true,
    },
    liveCheck: {
      amorce: "window.dexpLiveCheck && window.dexpLiveCheck('x')",
      cases: { n1:'p1n', d1:'p1d', n2:'p2n', d2:'p2d', res:'p3' },
      justes: { n1:'30', d1:'100', res:'12' }, faux: { n2:'1200', d2:'10' },
    },
    pause: { dm: true, boxes: { champ: 'p1n', valeur: '30' } },
    relance: null,          /* couvert par le contrôle des deux tables, ci-dessous */
    rappels: RAPPELS_PREMIERE,
    specifique: 'premiere',
    lacunes: [],
  },

  /* ------------------------------------------------------------------ */
  'secondes.html': {
    niveau: 'Seconde',
    tableResultats: 'resultats_2nde',
    tableEleves: 'eleves_2nde',
    navigateur: {
      exercice: 'pourcentage', ecran: 'ptest',
      /* m() rend false si le champ n'existe plus : sans cela, un renommage de
         champ laissait l'élève fictif ne rien saisir, et le banc restait vert. */
      repondre: "(function(){ var q=test.questions[test.idx], ok=true; function m(i,v){ var e=document.getElementById(i); if(!e){ ok=false; return; } e.value=String(v); }"
              + " m('p1n',q.P); m('p1d',100); m('p2n',q.prod); m('p2d',100); m('p3',q.result); return ok; })()",
      valider: '#pActions button.btn-primary',
      suivant: '#pNext',
    },
    temoin: {
      testId: 'pourcentage', kind: 'pct', ecran: 'ptest', rendu: 'renderPTest',
      generateur: 'genPercent()',
      /* genPercent() de Seconde ne pose ni ci ni v : la question s'arrête à result */
      question: "{P:30,N:40,unit:'€',prod:1200,result:12}",
    },
    aide: {
      amorce: null,
      rangee: { selecteur: '#scr-ptest .mp-actions button, #pActions button', attendus: 3 },
      qiaDetachee: true,
      conseil: true,
      ctx: null,
      mlStatic: true,
    },
    liveCheck: {
      amorce: "window.dexpLiveCheck && window.dexpLiveCheck('x')",
      cases: { n1:'p1n', d1:'p1d', n2:'p2n', d2:'p2d', res:'p3' },
      justes: { n1:'30', d1:'100', res:'12' }, faux: { n2:'1200', d2:'10' },
    },
    pause: { dm: true, boxes: { champ: 'p1n', valeur: '30' } },
    relance: { testId: 'pourcentage', kind: 'pct', fonction: 'startPercent' },
    rappels: RAPPELS_SECONDE,
    /* la fenetre d'aide de la Seconde lance l'IA des son ouverture : le rappel a
       donc son propre chemin, et ce chemin ne doit RIEN appeler */
    rappelSansIA: { fonction: 'ouvrirRappelSeul', appelIA: 'lancerConseil' },
    /* la mission envoyee au modele ne doit pas emporter l'enonce ni les reponses
       de l'eleve : le bouton IA est offert des l'entrainement, alors que le
       conseil est reserve au soutien, note moins cher */
    missionSansReponses: 'qiaEnvoyer',
    specifique: null,
    lacunes: [
      "la fenêtre « Question à l'IA » est portée dans sa version réduite : pas d'illustrations, pas de courbes SVG, pas de corrigés types — ils sont indexés sur des exercices que la Seconde n'a pas. La réponse du modèle est rendue en texte simple, comme le conseil.",
    ],
  },

  /* ------------------------------------------------------------------ */
  'terminale.html': {
    niveau: 'Terminale',
    tableResultats: 'resultats',
    tableEleves: 'eleves',
    navigateur: {
      exercice: 'derivees', ecran: 'test',
      /* le moteur générique enchaîne tout seul après un court délai : pas de bouton « suivant » */
      repondre: "(function(){ var q=test.questions[test.idx]; var e=document.getElementById('answerInput');"
              + " if(!e) return false; e.value=String(q.answer); return true; })()",
      valider: '#validateBtn',
      suivant: null,
    },
    temoin: {
      testId: 'derivee-exp', kind: 'dexp', ecran: 'dexp', rendu: 'renderDexp',
      generateur: 'genDexp()',
      question: 'genDexp()',
    },
    aide: {
      amorce: null,                                   /* les boutons sont posés par le rendu */
      rangee: { selecteur: '#scr-dexp .mp-actions button', attendus: 3 },
      qiaDetachee: true,
      conseil: true,
      ctx: { appel: 'conseilCtxCourant()', seuil: 80, kinds: [['dexp','genDexp()']], prepare: {} },
      mlStatic: true,
    },
    liveCheck: null,
    pause: { dm: true, boxes: { champ: 'dexp-u', valeur: '30' } },
    relance: { testId: 'derivee-exp', kind: 'dexp', fonction: 'startDexp' },
    rappels: RAPPELS_TERMINALE,
    specifique: null,
    lacunes: [
      "liveCheckCurrent() a un corps vide : la correction du mode soutien passe par submitAnswer et par un check… propre à chaque exercice, donc aucun contrôle de coloration en direct n'est transposable",
      "le contexte envoyé au modèle n'est vérifié que pour l'exercice témoin (dexp) : la table kind -> générateur des 23 autres exercices reste à écrire",
      "aucun audit de générateur : les 45 générateurs de Terminale n'ont pas d'invariants déclarés (les 15 de la Première en ont)",
      "33 fonctions nommées vivent dans des modules enveloppés en IIFE (le bloc SA-CORE, ligne 10268, et le module de copier-coller ligne 2101) : le banc ne descend pas dedans, donc aucun contrôle de structure ne les voit. Aucune n'enregistre de note aujourd'hui — le contrôle « chaque enregistrement de note est dans une fonction que le banc voit » le vérifie à chaque exécution et virerait au rouge si un exercice y était porté",
    ],
  },
};
