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

/* Les 13 exercices de la Première dont le contexte part au modèle. */
const KINDS_PREMIERE = [
  ['pct','genPercent()'], ['pctq','genPctTaux()'], ['aug','genAug()'],
  ['augq','genAugTaux()'], ['dim','genDim()'], ['mp','genMultPosee()'],
  ['md','genMultDec()'], ['u','genU()'], ['fp','genFP()'],
  ['ag2','genAugAdd()'], ['ag2q','genDimTauxSub()'], ['syn','genSyn()'],
  ['pcol','genPctCol()'], ['bs','genBaisses()'], ['lc','genLireCoef()'], ['hs','genHausses()'],
  ['psl','genPctRes()'],
];

/* Identifiant d'exercice -> clé de la table RAPPELS, pour la Première. */
const RAPPELS_PREMIERE = `(function(){
  const cles={ 'calcul-mental':'cm','pourcentage':'pct','pourcentage-depart':'pctq','pourcentage-taux':'pctq',
    'augmenter-pourcentage':'aug','augmenter-depart':'augq','augmenter-taux':'augq',
    'diminuer-pourcentage':'dim','multiplication-posee':'mp','mult-decimaux':'md',
    'mult-dec-un':'u','fractions-decimales':'fracp','fraction-pourcentage':'fp','pourcentage-colonnes':'pcol',
    'augmenter-addition':'ag2','diminuer-soustraction':'ag2','augmenter-depart-addition':'ag2q',
    'diminuer-taux-soustraction':'ag2q','augmenter-taux-addition':'ag2q',
    'diminuer-depart-soustraction':'ag2q','synthese-pourcentages':'syn','synthese-augmentations':'syn','baisses-successives':'bs','lire-coefficient':'lc','hausses-successives':'hs',
    'tables-multiplication':'tm','tables-multiplication-2':'tm','somme-fractions':'sf' };
  const manquants=[];
  Object.keys(TESTS).forEach(function(id){
    /* un exercice peut avoir SON rappel, indépendant du kind : deux exercices
       partagent parfois le même moteur sans avoir les mêmes réflexes à
       rappeler. */
    if(typeof RAPPELS_ID!=='undefined' && RAPPELS_ID[id]) return;
    const k=cles[id];
    /* un identifiant que ce contrôle ne connaît pas était IGNORÉ : un exercice
       ajouté sans rappel passait donc au vert sans que rien ne le dise. */
    if(!k){ manquants.push(id+' (le contrôle ne connaît pas son kind)'); return; }
    if(!RAPPELS[k]) manquants.push(id);
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
               'plus-petit-ensemble':'pge','lecture-variations':'lv','tableau-variation':'tvd','lecture-signes':'ls','signes-variations':'lsv','image-nombre':'img','placer-image':'pim','antecedent-nombre':'ant','antecedents-droite':'adr','inequation-droite':'iqd','inequation-graphique':'ing','equation-graphique':'eqg','lecture-deux-courbes':'ifg','resolutions-graphiques':'eig','tableau-signes-graphique':'tsg','construire-fonction':'cfx','pourcentage':'pct',
               'augmenter-pourcentage':'aug','diminuer-pourcentage':'dim','intervalles':'itv','intervalles-inegalite':'itq',
               'appartient-intervalle':'app','appartient-intervalle-2':'app','somme-fractions':'sf',
               'placer-intervalle':'plc','croiser-denominateurs':'sf','simplifier-fractions':'sf',
               'somme-fractions-libre':'sfl','simplifier-barres':'smp',
               'multiplier-fractions':'mlt','multiplier-fractions-libre':'mll',
               'diviser-fractions':'mlt','diviser-fractions-libre':'mll',
               'ordre-croissant':'ord' };
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

    /* Le signalement : la table du niveau, et le nom de la fonction de rendu de
       l'exercice témoin. Le banc dépose un signalement comme le ferait un élève,
       puis le rejoue comme le ferait le professeur. */
    signalement: { table: 'signalements_1ere', exercice: 'pourcentage' },
    /* La fenêtre « Soutien » se saisit n'importe où, et pas seulement par sa
       barre de titre. Un exercice de ce niveau qui a un mode soutien suffit :
       le banc y ouvre la fenêtre, la traîne par son texte, puis vérifie que
       ses boutons n'ont pas été avalés par la poignée. */
    fenetreSoutien: { exercice: 'pourcentage' },
    /* La Première l'a depuis toujours ; on le mesure pour que les deux
       niveaux ne divergent pas — c'est d'elle que la Seconde tient sa
       largeur. « somme-fractions » partage son moteur avec la Seconde. */
    pleineLargeur: { exercices: ['pourcentage', 'mult-decimaux', 'somme-fractions'],
                     chaine: [['pourcentage', 1], ['somme-fractions', 1]] },

    /* Un résidu MathLive INVISIBLE en fin de case ne doit pas rendre fausse une
       réponse juste. Un élève tape « 2 », effleure la touche exposant, et la case
       contient « 2^{} » : elle affiche toujours « 2 », mais l'évaluateur la refuse.
       Signalé par un élève sur le 2.1 en août 2026 — « 2 » et « 4x » rouges,
       « 4 » vert, 10 cases sur 12, et la copie était juste.
       « lire » nomme le LECTEUR du niveau : c'est le seul endroit où le résidu
       peut être arrêté, et le seul endroit qu'un sabotage doit rougir. */
    residuMathlive: { lire: 'id => pmPlain(document.getElementById(id))' },

    /* {somme-fractions} : les deux niveaux le partagent, au caractère près.
       Le banc navigateur y remplit une copie JUSTE case par case et exige
       qu'aucune ne vire au rouge en chemin — une paire de multiplicateurs ne se
       juge pas à moitié écrite —, puis mesure l'alignement des termes. */
    sommeFractions: { exercice: 'somme-fractions' },
    /* Le dépôt de cours en PDF : la table où vivent ses métadonnées, à côté
       des devoirs et des réglages. Un niveau qui n'aurait pas ce dépôt le dit
       en retirant cette ligne — le banc affiche alors « non applicable » au
       lieu de rougir. */
    coursPdf: { table: 'parametres_1ere' },

    /* Exercices sans bouton « Poser une question à l'IA », et pourquoi. Ce ne
       sont pas des oublis : ces trois-là sont CHRONOMÉTRÉS — TM_SECONDES par
       calcul —, et une question à l'IA n'a pas de sens quand la réponse est
       attendue en quatre secondes. On le déclare plutôt que d'affaiblir le
       contrôle : un exercice ajouté sans aide doit continuer à faire rougir le
       banc. Retirer un identifiant d'ici suffit à réexiger le bouton. */
    aideIA: { sans: ['tables-multiplication', 'tables-multiplication-2', 'calcul-mental'] },

    /* Les écrans qui ne sont PAS des exercices. Tout autre écran doit figurer
       dans testScreens : c'est cette liste que show() consulte pour passer en
       plein écran, et c'est elle que le contrôle de l'encadré « Énoncé »
       parcourt. Un exercice oublié là n'y était donc pas SIGNALÉ, il en était
       RETIRÉ — le banc restait vert sur un exercice qu'il ne regardait plus.
       Déclarés en négatif exprès : ajouter un exercice ne demande rien ici,
       seul un nouvel écran de menu doit être inscrit. */
    ecransHorsExercice: ['setup','login','space','choose','theme','soustheme','rattrapage',
                        'devoirs','mode','results','teacher-login','teacher'],
    niveau: 'Première',
    /* Les classes qui portent l'encadré « Énoncé », et les écrans qui n'en ont
       pas besoin : leur énoncé EST l'ardoise noire, où le calcul s'affiche en
       très grand. Les déclarer ici plutôt que de les deviner — un exercice
       ajouté demain sans encadré doit faire rougir le banc, pas passer. */
    enonce: { classes: ['enonce', 'mp-instr'], ardoise: ['test', 'tm'],
              navigateur: ['pourcentage', 'pourcentage-colonnes', 'addition-soustraction'] },
    /* La correction en direct du mode soutien passe par liveCheckCurrent(), qui
       doit aiguiller CHAQUE écran d'exercice. Aucune dispense ici : les
       quatorze écrans y sont. « sans » existe pour les niveaux où un exercice
       corrige autrement — le déclarer vaut mieux que d'affaiblir le contrôle. */
    /* {pourcentage-synthese-libre} : la correction est le verdict de l'IA,
       il n'y a rien à colorer pendant la saisie. */
    soutienEnDirect: { sans: ['psl', 'sal'] },
    /* Chacune des quatorze fins de test épingle l'identifiant sous lequel la
       note part — en toutes lettres, ou par le paramètre d'un démarreur
       partagé. Le banc peut donc exiger que les vingt-cinq exercices y soient :
       un exercice ajouté sans son identifiant enregistrerait sa note sous
       celle du voisin recopié, ou sous rien. Les deux autres niveaux
       enregistrent sous currentTestId, et le contrôle n'y mesurerait rien. */
    noteParExercice: true,
    /* Le nombre de questions des exercices du moteur sf — DEUX sources : la
       page a sa constante SF_NB, le banc compare à celle-ci. 6 en Première,
       4 en Seconde (demande de Turquet, août 2026). */
    nbQuestionsFractions: { sf: 6 },
    /* 4 questions du 2.1.3 au 2.1.7 (demande de Turquet, août 2026) —
       DEUX sources : la page a PCT_NB et QD_NB, le banc compare à ceci. */
    nbQuestionsPourcentages: 4,
    /* 3 questions pour tous les exercices sur les ÉVOLUTIONS — hausses 2.2.1
       à 2.2.8, baisses 2.3.1 à 2.3.7, et la synthèse 2.5.1 (demande de
       Turquet, août 2026, en trois temps). DEUX sources : la page a EVOL_NB,
       le banc compare à ceci. */
    nbQuestionsEvolutions: 3,
    /* Le témoin du GARDE DE LA SAISIE : en soutien, une case ne se colore pas
       tant que l'élève y écrit (décision de Turquet, août 2026). Il faut une
       case qui soit un vrai « input » ET que la correction en direct JUGE à
       chaque frappe — c'est là que le défaut vivait. Le banc exige d'ailleurs
       qu'un verdict soit calculé (la couleur retenue), sans quoi il resterait
       vert sur une case que personne ne juge, en parlant d'autre chose. */
    gardeSaisie: { exercice: 'multiplication-posee', champ: '.mp-box', valeur: '9' },
    pave: { exercice: 'multiplication-posee', champ: '.mp-box', frappe: ['5'], attendu: '5',
            touches: ['1','2','3','4','5','6','7','8','9','0',',','\u2212','\u232b','\u23ce'] },
    /* le témoin des réglages par exercice d'un devoir (coupe du nombre de
       questions) : un exercice au tirage homogène, présent dans la table du
       rejeu. */
    reglagesDevoirs: { exercice: 'pourcentage' },
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
             prepare: { pctq: 'test.questions[0].choisi=0;', augq: 'test.questions[0].choisi=0;', psl: 'test.questions[0].choisi=0;' } },
      mlStatic: true,
    },
    liveCheck: {
      amorce: "window.dexpLiveCheck && window.dexpLiveCheck('x')",
      cases: { n1:'p1n', d1:'p1d', n2:'p2n', d2:'p2d', res:'p3' },
      justes: { n1:'30', d1:'100', res:'12' }, faux: { n2:'1200', d2:'10' },
      verif: 'checkPAnswer();',
    },
    pause: { dm: true, boxes: { champ: 'p1n', valeur: '30' } },
    relance: null,          /* couvert par le contrôle des deux tables, ci-dessous */
    rappels: RAPPELS_PREMIERE,
    /* Le thème des pourcentages est le seul découpé en parties : sa page ne
       montre QUE les quatre parties, et les exercices s'ouvrent sur la page de la
       partie choisie. Le banc navigateur clique ces deux étages comme le ferait
       un élève — une carte sans onclick ou un écran qui ne change pas ne se
       voit pas autrement. */
    menu: { theme: 2, parties: 5, exercice: 'pourcentage' },
    /* Un devoir peut demander plusieurs fois le même exercice, et verrouiller un
       exercice tant que les précédents ne sont pas faits. Seule la Première a
       cet éditeur de devoirs : les deux autres niveaux construisent les leurs
       autrement, et n'ont pas ces exercices. */
    /* L'éditeur de devoirs, et deux exercices pour l'éprouver. « exercice » doit
       être un exercice SANS mode soutien (les tables sont un exercice de
       rapidité) : le contrôle du mode inexistant s'en sert aussi. */
    devoirs: { exercice: 'tables-multiplication', suivant: 'tables-multiplication-2' },
    specifique: 'premiere',
    /* La fenêtre des tables de multiplication : ouverte depuis tous les
       exercices, mais refermée dès qu'on revient au calcul sur l'exercice DES
       tables. Seul un vrai navigateur a de vrais clics — jsdom n'implémente
       même pas PointerEvent. On déclare donc les deux exercices à visiter :
       celui où elle doit se refermer, et un autre où elle doit RESTER. */
    tablesAide: { referme: 'tables-multiplication', reste: 'pourcentage' },
    /* Une opération POSÉE se juge à l'œil : les colonnes doivent s'aligner.
       Aucun banc hors navigateur ne mesure une position à l'écran. */
    operationPosee: { exercice: 'addition-soustraction', hote: 'aspHost' },
    /* Le cadre de pose inséré dans les deux exercices de multiplication de
       décimaux : il est dimensionné par son ÉNONCÉ, pas par l'opération. Sans
       borne, l'énoncé tenait sur une ligne de 700 à 830 px et le cadre suivait,
       quatre fois plus large que ce qu'il encadre. Seul un navigateur mesure
       une largeur rendue — elle dépend de la police et du repli au mot. */
    cadrePose: { exercices: [['mult-decimaux','mdHost'], ['mult-dec-un','uHost']], largeurMax: 520 },

    /* La case du produit du 1.7 : la police du groupe de référence, et la
       largeur qui suit la saisie — « 100000 » écrit en entier, jamais coupé
       (demande de Turquet, août 2026, sur une capture du 1.7). */
    /* une liste : une case qui grandirait sur un écran et pas sur l'autre ne
       se verrait nulle part ailleurs — la leçon d'aideMaintenue. Le 1.6 ouvre
       sur son niveau 1 (sans fraction) : « niveauFracp » dit au banc quel
       niveau poser avant de mesurer. */
    caseQuiGrandit: [
      { exercice: 'mult-decimaux', hote: 'mdHost', num: 'md3n', den: 'md3d', grand: '100000' },
      { exercice: 'fractions-decimales', hote: 'fHost', num: 'fNum', den: 'fDen', grand: '230230', niveauFracp: 'frac-n2' },
    ],

    /* L'étiquette de la colonne de gauche de « Fraction et pourcentage » doit
       nommer le DÉNOMINATEUR de la fraction étudiée — « pour 5 » devant 2/5 —
       et non « pour 1 » (décision de Turquet, août 2026). C'est ce qui rend la
       lecture parallèle des deux colonnes : « 2 pour 5 » à gauche, « 40 pour
       100 » à droite. Elle est posée dans une chaîne JavaScript, invisible à
       un contrôle qui lirait le HTML : le banc OUVRE l'exercice et lit ce qui
       s'affiche. L'exercice voisin étiquette déjà sa colonne de la même
       façon. */
    colonneFraction: { exercice: 'fraction-pourcentage', hote: 'fpHost', droite: 'pour 100' },

    /* Le devoir à la maison va du professeur à l'élève par la table des
       réglages. Si la base ne la rend pas lisible à l'élève, PostgREST répond
       « aucune ligne » — ce qui n'est PAS une erreur — et l'espace élève
       annonçait « Aucun devoir à la maison » d'un ton assuré pendant que le
       professeur voyait le sien. Le banc éprouve les trois situations, parce
       que corriger une seule ne corrigerait rien : ligne illisible, ligne lue
       mais sans devoir affiché, et devoir affiché. */
    devoirsEleve: { table: 'parametres_1ere', exercice: 'pourcentage',
                    aveu: 'ne voit aucun réglage' },
    lacunes: [],
  },

  /* ------------------------------------------------------------------ */
  'secondes.html': {

    /* Le signalement : la table du niveau, et le nom de la fonction de rendu de
       l'exercice témoin. Le banc dépose un signalement comme le ferait un élève,
       puis le rejoue comme le ferait le professeur. */
    signalement: { table: 'signalements_2nde', exercice: 'pourcentage' },
    /* La fenêtre « Soutien » se saisit n'importe où, et pas seulement par sa
       barre de titre. Un exercice de ce niveau qui a un mode soutien suffit :
       le banc y ouvre la fenêtre, la traîne par son texte, puis vérifie que
       ses boutons n'ont pas été avalés par la poignée. */
    fenetreSoutien: { exercice: 'pourcentage' },
    /* L'écran d'un exercice prend toute la largeur, et les étapes d'une même
       égalité tiennent sur une seule ligne. « chaine » dit combien de blocs
       empilés un exercice a le droit de garder : au-delà, la chaîne est
       coupée. Le pourcentage n'en a qu'un ; augmenter et diminuer en ont
       deux — le coefficient est une autre égalité — plus la pose
       facultative, qui reste cachée tant que l'élève n'a rien écrit. */
    /* {simplifier-fractions} est la chaîne la PLUS LONGUE de l'application :
       six égalités sur une seule rangée, dont deux blocs de division. C'est
       exactement là qu'un repli se produirait, et aucun banc hors navigateur
       ne sait où un contenu se replie. */
    /* {diviser-fractions} pose HUIT cases sur une ligne — la transformation en
       multiplication, puis le produit, puis le résultat. C'est la chaîne la
       plus chargée après {simplifier-fractions}, et c'est là qu'un repli se
       produirait. */
    pleineLargeur: { exercices: ['pourcentage', 'augmenter-pourcentage', 'somme-fractions', 'simplifier-fractions', 'diviser-fractions'],
                     chaine: [['pourcentage', 1], ['augmenter-pourcentage', 2],
                              ['diminuer-pourcentage', 2], ['somme-fractions', 1],
                              ['simplifier-fractions', 1], ['diviser-fractions', 1]] },

    /* Un résidu MathLive INVISIBLE en fin de case ne doit pas rendre fausse une
       réponse juste. Un élève tape « 2 », effleure la touche exposant, et la case
       contient « 2^{} » : elle affiche toujours « 2 », mais l'évaluateur la refuse.
       Signalé par un élève sur le 2.1 en août 2026 — « 2 » et « 4x » rouges,
       « 4 » vert, 10 cases sur 12, et la copie était juste.
       « lire » nomme le LECTEUR du niveau : c'est le seul endroit où le résidu
       peut être arrêté, et le seul endroit qu'un sabotage doit rougir. */
    residuMathlive: { lire: 'id => pmPlain(document.getElementById(id))' },

    /* {somme-fractions} : les deux niveaux le partagent, au caractère près.
       Le banc navigateur y remplit une copie JUSTE case par case et exige
       qu'aucune ne vire au rouge en chemin — une paire de multiplicateurs ne se
       juge pas à moitié écrite —, puis mesure l'alignement des termes. */
    sommeFractions: { exercice: 'somme-fractions' },

    /* {croiser-denominateurs} : le même moteur que {somme-fractions}, avec les
       flèches en plus. Le banc navigateur mesure ce que l'élève VOIT — les
       couleurs, les liserés et le croisement des deux flèches. */
    croisement: { exercice: 'croiser-denominateurs' },
    /* {simplifier-barres} : les deux barres doivent aller exactement aussi
       loin, partir du MÊME bord, et tenir entières dans un écran d'ordinateur
       portable avec des parts assez larges pour être cliquées. Rien de tout
       cela ne se voit hors d'un vrai navigateur. */
    barresSimplifier: { exercice: 'simplifier-barres' },
    construireFonction: { exercice: 'construire-fonction' },
    /* {placer-image} : le point se POSE au clic sur le graphe du 2.2 — le
       calcul clic → nœud ne se voit que dans un vrai navigateur. */
    placerImage: { exercice: 'placer-image' },
    /* {antecedents-droite} : la droite se fait GLISSER à la hauteur demandée,
       puis les points se posent au clic sur elle. Le glisser et le calcul
       geste → nœud (grille doublée, 13 graduations) ne se voient que dans un
       vrai navigateur — jsdom n'a pas de mise en page. */
    antecedentsDroite: { exercice: 'antecedents-droite' },
    /* {inequation-droite} : la même droite orange se fait glisser — le geste
       ne se voit que dans un vrai navigateur. */
    inequationDroite: { exercice: 'inequation-droite' },
    /* Le bouton des zéros de « Placer des nombres sur une droite graduée » :
       l'aide ne dure que le temps de l'appui. Seul un vrai navigateur APPUIE ;
       le banc principal, lui, ne peut qu'appeler la fonction. */
    /* DEUX exercices portent le bouton : {placer-intervalle} et
       {ordre-croissant}, qui partagent le drapeau et le branchement. Le banc
       APPUIE sur chacun — un appui qui marcherait sur l'un et pas sur l'autre
       ne se verrait nulle part ailleurs. */
    aideMaintenue: [{ exercice: 'placer-intervalle', bouton: 'plcZeroBtn',
                      nombres: '#plc-ta,#plc-tb,.plc-nb' },
                    { exercice: 'ordre-croissant', bouton: 'ordZeroBtn',
                      nombres: '.ord-nbs .plc-nb' }],
    /* Le dépôt de cours en PDF : la table où vivent ses métadonnées, à côté
       des devoirs et des réglages. Un niveau qui n'aurait pas ce dépôt le dit
       en retirant cette ligne — le banc affiche alors « non applicable » au
       lieu de rougir. */
    coursPdf: { table: 'parametres_2nde' },

    /* Les écrans qui ne sont PAS des exercices. Tout autre écran doit figurer
       dans testScreens : c'est cette liste que show() consulte pour passer en
       plein écran, et c'est elle que le contrôle de l'encadré « Énoncé »
       parcourt. Un exercice oublié là n'y était donc pas SIGNALÉ, il en était
       RETIRÉ — le banc restait vert sur un exercice qu'il ne regardait plus.
       Déclarés en négatif exprès : ajouter un exercice ne demande rien ici,
       seul un nouvel écran de menu doit être inscrit. */
    ecransHorsExercice: ['setup','login','space','rattrapage','choose','devoirs','mode',
                        'results','teacher-login','teacher'],
    niveau: 'Seconde',
    /* .lv-instr est l'énoncé de la lecture graphique : une classe à part, née
       avant les autres. Elle prend le même encadré. Aucun écran d'ardoise ici. */
    enonce: { classes: ['enonce', 'mp-instr', 'lv-instr'], ardoise: [],
              navigateur: ['pourcentage', 'lecture-variations'] },
    /* Trois écrans ne passent pas par liveCheckCurrent(), et c'est voulu :
         lv  — la lecture graphique a sa propre correction en direct, lvLive(),
               branchée sur les champs du tableau de variation ;
         def — la définition est corrigée par le modèle, pas par la page ;
         pge — le plus petit ensemble se corrige question par question, à la
               validation, comme le moteur générique.
       Les nommer les met sous surveillance : si l'un de ces écrans disparaît,
       le banc réclame le retrait de sa dispense au lieu de l'oublier ici. */
    /* « sfl » corrige AUTREMENT : la saisie est libre, et c'est l'IA qui lit le
       calcul. Il n'y a donc rien à colorer pendant la frappe — et surtout, un
       appel au modèle à chaque touche serait absurde. Le manque est DÉCLARÉ
       plutôt que le contrôle affaibli pour tout le monde. */
    /* L'exercice à saisie LIBRE : l'élève écrit son calcul dans une feuille
       ligne par ligne, et c'est l'IA qui le lit. Rien de cet écran ne se
       mesure hors d'un vrai navigateur. */
    saisieLibre: { exercice: 'somme-fractions-libre' },
    /* « mll » corrige comme « sfl » : la saisie est libre et c'est l'IA qui
       lit le calcul. Il n'y a rien à colorer pendant la frappe, et un appel
       au modèle à chaque touche serait absurde. Déclaré plutôt que le
       contrôle affaibli pour tout le monde. */
    soutienEnDirect: { sans: ['lv', 'img', 'ant', 'def', 'pge', 'sfl', 'mll'] },
    /* 4 questions par exercice de fractions, du 4.2 au 4.9 (demande de
       Turquet, août 2026) : les quatre du moteur sf ET les quatre du moteur
       mlt. DEUX sources — la page a ses constantes, le banc compare à
       celles-ci. */
    nbQuestionsFractions: { sf: 4, mlt: 4 },
    /* Le pavé numérique compact : la SECONDE source de sa liste de touches,
       et la case réelle que le banc navigateur pilote en mode tactile. */
    /* Le témoin du GARDE DE LA SAISIE : en soutien, une case ne se colore pas
       tant que l'élève y écrit (décision de Turquet, août 2026). Il faut une
       case qui soit un vrai « input » ET que la correction en direct JUGE à
       chaque frappe — c'est là que le défaut vivait. Le banc exige d'ailleurs
       qu'un verdict soit calculé (la couleur retenue), sans quoi il resterait
       vert sur une case que personne ne juge, en parlant d'autre chose. */
    gardeSaisie: { exercice: 'image-nombre', champ: '#img-c', valeur: '9' },
    pave: { exercice: 'image-nombre', champ: '#img-c', frappe: ['5', ',', '5'], attendu: '5,5',
            touches: ['1','2','3','4','5','6','7','8','9','0',',','\u2212','\u232b','\u23ce'] },
    reglagesDevoirs: { exercice: 'pourcentage' },
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
      verif: 'checkPAnswer();',
    },
    pause: { dm: true, boxes: { champ: 'p1n', valeur: '30' } },
    relance: { testId: 'pourcentage', kind: 'pct', fonction: 'startPercent' },
    rappels: RAPPELS_SECONDE,
    /* la fenetre d'aide de la Seconde lance l'IA des son ouverture : le rappel a
       donc son propre chemin, et ce chemin ne doit RIEN appeler */
    rappelSansIA: { fonction: 'ouvrirRappelSeul', appelIA: 'lancerConseil' },
    /* La mission envoyée au modèle emporte le CONTEXTE de l'exercice, comme en
       Terminale (décision de Turquet, août 2026). Elle ne l'emportait pas
       jusque-là, et c'était volontaire : le bouton IA est offert dès
       l'entraînement, alors que le conseil est réservé au soutien, noté moins
       cher — un contexte qui contient les réponses attendues ouvrait par une
       autre porte l'aide que le barème réserve au soutien.
       Le contrôle n'est donc pas RETIRÉ, il est RETOURNÉ : il exigeait
       l'absence du contexte, il exige maintenant sa présence ET la clause qui
       le rend sans danger. Les deux ensemble, parce que le contexte seul est
       pire que pas de contexte du tout. */
    missionAvecContexte: { fonction: 'qiaEnvoyer', appel: 'qiaCtxExercice' },
    specifique: 'seconde',
    /* La fenêtre des tables de multiplication, portée depuis la Première.
       Pas de « referme » : la Seconde n'a aucun exercice de rapidité, donc
       aucun écran où la fenêtre deviendrait une antisèche. Ce manque est
       déclaré plutôt que tu — le banc affiche « non applicable » sur ce
       seul bord, et continue d'exiger l'autre. */
    /* OÙ LES TABLES SERVENT, ET OÙ ELLES NE SERVENT PAS (demande de Turquet,
       août 2026). « sans » nomme les exercices qui ne demandent AUCUN calcul
       mental : écrire une définition, choisir un crochet, lire une courbe,
       comparer 1,07 et 1,1. Les trois exercices sur les ensembles n'y sont
       PAS — ils présentent des fractions comme 24/4, et décider que c'est un
       entier est un calcul de table ; {appartient-intervalle-2} non plus, il
       demande si √15 tombe entre 3 et 4.
       Cette liste est la SECONDE source : la page a la sienne, le banc compare
       ce qui est réellement affiché à celle-ci. Les lire toutes deux au même
       endroit n'aurait rien prouvé. */
    tablesAide: { reste: 'pourcentage',
                  sans: ['definitions-ensembles', 'intervalles', 'intervalles-inegalite',
                         'appartient-intervalle', 'placer-intervalle', 'ordre-croissant', 'lecture-variations',
                         'tableau-variation', 'lecture-signes', 'image-nombre', 'placer-image', 'antecedent-nombre', 'antecedents-droite', 'inequation-droite', 'inequation-graphique',
                         'equation-graphique', 'lecture-deux-courbes', 'resolutions-graphiques',
                         'tableau-signes-graphique', 'signes-variations', 'construire-fonction'] },
    /* {tableau-signes-graphique} : 5 questions — la seconde source du compte,
       la page a la sienne (TSG_NB). */
    nbQuestionsTableauSignes: 5,
    lacunes: [
      "le cadre de pose inséré (multiplication des numérateurs) n'existe qu'en Première : le contrôle de largeur du navigateur s'affiche « non applicable »",
      "la fenêtre des tables de multiplication n'a pas d'exercice de rapidité où se refermer (la Seconde n'en a aucun, c'est un niveau sans chronomètre) : ce seul bord du contrôle du navigateur s'affiche « non applicable »",
      "la fenêtre « Question à l'IA » est portée dans sa version réduite : pas d'illustrations, pas de courbes SVG, pas de corrigés types — ils sont indexés sur des exercices que la Seconde n'a pas. La réponse du modèle est rendue en texte simple, comme le conseil.",
    ],
  },

  /* ------------------------------------------------------------------ */
  'terminale.html': {

    /* UNE CASE VIDE QUI ROUGIT — six exercices de ce niveau le font encore, et
       ce n'est PAS un oubli qu'on peut corriger d'office. La Terminale a une
       convention à elle, écrite dans checkDexp() : elle ne remplace jamais les
       réponses de l'élève ; les cases fausses gardent ce qu'il a écrit et la
       bonne démarche s'affiche en dessous. Y appliquer la règle de la Seconde
       — la réponse en bleu dans la case vide — changerait cette convention, et
       surtout le CALCUL DE LA NOTE : une case vide qui cesse d'être comptée
       fait passer « 3 justes sur 5 » à « 3 sur 3 ». C'est une décision de
       Turquet, pas une correction technique.
       Les six sont donc NOMMÉS ici et s'affichent à chaque exécution : un
       manque tu finit par se croire normal. */
    /* Le professeur pose une note sur un exercice d'un devoir : le banc
       principal éprouve le calcul, celui-ci éprouve le GESTE — taper la note,
       la voir tenir, et le total du devoir la suivre. */
    notesDevoir: { exercice: 'derivee-exp', tableParametres: 'parametres', tableResultats: 'resultats' },
    /* La Terminale a la touche « / » de plus : ses tangentes acceptent p/q. */
    /* Le témoin du GARDE DE LA SAISIE : en soutien, une case ne se colore pas
       tant que l'élève y écrit (décision de Turquet, août 2026). Il faut une
       case qui soit un vrai « input » ET que la correction en direct JUGE à
       chaque frappe — c'est là que le défaut vivait. Le banc exige d'ailleurs
       qu'un verdict soit calculé (la couleur retenue), sans quoi il resterait
       vert sur une case que personne ne juge, en parlant d'autre chose. */
    gardeSaisie: { exercice: 'equation-tangente', champ: '#tg-fa', valeur: '9' },
    pave: { exercice: 'equation-tangente', champ: '#tg-fa', frappe: ['5', ',', '5'], attendu: '5,5',
            touches: ['1','2','3','4','5','6','7','8','9','0',',','\u2212','/','\u232b','\u23ce'] },
    /* Le signe du premier degré : 5 questions par séance (demande de Turquet,
       août 2026), et non plus 15 — les trois niveaux tous représentés. */
    nbQuestionsSignePremier: 5,

    casesVides: { sans: ['derivee-exp', 'derivee-exp-3', 'derivee-exp-quotient',
                         'etude-fonction', 'etude-quotient', 'recurrence-encadrement'] },


    /* Le signalement : la table du niveau, et le nom de la fonction de rendu de
       l'exercice témoin. Le banc dépose un signalement comme le ferait un élève,
       puis le rejoue comme le ferait le professeur. */
    signalement: { table: 'signalements', exercice: 'derivee-exp' },
    /* La fenêtre « Soutien » se saisit n'importe où, et pas seulement par sa
       barre de titre. Un exercice de ce niveau qui a un mode soutien suffit :
       le banc y ouvre la fenêtre, la traîne par son texte, puis vérifie que
       ses boutons n'ont pas été avalés par la poignée. */
    fenetreSoutien: { exercice: 'derivee-exp' },

    /* Un résidu MathLive INVISIBLE en fin de case ne doit pas rendre fausse une
       réponse juste. Un élève tape « 2 », effleure la touche exposant, et la case
       contient « 2^{} » : elle affiche toujours « 2 », mais l'évaluateur la refuse.
       Signalé par un élève sur le 2.1 en août 2026 — « 2 » et « 4x » rouges,
       « 4 » vert, 10 cases sur 12, et la copie était juste.
       « lire » nomme le LECTEUR du niveau : c'est le seul endroit où le résidu
       peut être arrêté, et le seul endroit qu'un sabotage doit rougir. */
    residuMathlive: {
      lire: 'id => dexpCellValue(id)',
      /* et la copie de l'élève, à l'identique, jouée de bout en bout : le contrôle
         la joue D'ABORD sans résidu — si elle ne passe pas au vert ainsi, c'est le
         contrôle qui a tort, pas la page — puis avec, et exige le même verdict. */
      copie: {
        exercice: 'derivee-exp',
        question: "test.questions[test.idx]={type:'dexp',a:2,b:2,k:2,uStr:polyToStr([2,2]),"
                + "vTxt:expMenu(2),duTxt:numFmt(2),dvTxt:vprimeMenu(2),dcoef:[6,4],"
                + "facAns:polyFr([6,4]),expHtml:expCore(2)}; renderDexp();",
        cases: { 'dexp-u':'2x+2', 'dexp-v':'e^{2x}', 'dexp-du':'2', 'dexp-dv':'2e^{2x}',
                 'dexp-s2a':'2', 'dexp-s2b':'e^{2x}', 'dexp-s2c':'2e^{2x}', 'dexp-s2d':'2x+2',
                 'dexp-s3a':'2', 'dexp-s3b':'4x', 'dexp-s3c':'4', 'dexp-fac':'4x+6' },
        residus: ['dexp-s3a', 'dexp-s3b'],
        valider: '#dexpActions button.btn-primary'
      }
    },
    /* Le dépôt de cours en PDF : la table où vivent ses métadonnées, à côté
       des devoirs et des réglages. Un niveau qui n'aurait pas ce dépôt le dit
       en retirant cette ligne — le banc affiche alors « non applicable » au
       lieu de rougir. */
    /* La RÉCURRENCE RÉDIGÉE : l'exercice que le banc navigateur pilote en
       TAPANT une démonstration entière. Rien de cet écran ne se mesure hors
       d'un vrai MathLive — la prose française et ses accents, la barre
       d'espace qui doit SORTIR d'un indice, et l'encre RÉSOLUE du bilan. */
    recurrenceRedigee: { exercice: 'recurrence-redaction' },
    suiteAuxRedigee: { exercice: 'suite-auxiliaire-redaction' },
    coursPdf: { table: 'parametres' },
    /* Les deux exercices d'origine, retirés du menu mais gardés dans TESTS :
       des notes portent encore leur identifiant, et testIdOf() y renvoie même
       les lignes trop vieilles pour en avoir un. Les supprimer de TESTS ferait
       disparaître ces notes du bilan comme du tableau du professeur. Ils sont
       donc hors de THEMES à dessein — déclaré ici plutôt que toléré en
       silence : si l'un des deux disparaît, le banc réclame cette ligne. */
    horsThemes: ['derivees', 'suites'],

    /* Les écrans qui ne sont PAS des exercices. Tout autre écran doit figurer
       dans testScreens : c'est cette liste que show() consulte pour passer en
       plein écran, et c'est elle que le contrôle de l'encadré « Énoncé »
       parcourt. Un exercice oublié là n'y était donc pas SIGNALÉ, il en était
       RETIRÉ — le banc restait vert sur un exercice qu'il ne regardait plus.
       Déclarés en négatif exprès : ajouter un exercice ne demande rien ici,
       seul un nouvel écran de menu doit être inscrit. */
    ecransHorsExercice: ['setup','login','space','rattrapage','choose','theme','devoirs','mode','dmenonce',
                        'results','teacher-login','teacher',
                        /* choix du niveau de « Signe du second degré » : un menu, pas un exercice */
                        's2lvl'],
    niveau: 'Terminale',
    /* .tvi-instr n'est PAS un énoncé : c'est la consigne de travail qui suit
       (« Rédige la justification : »). L'application elle-même les distingue,
       dans ctxVisible(). Seul .tvi-prompt porte l'énoncé. */
    /* Deux exercices visités dans un vrai navigateur, choisis pour ce qu'ils
       exercent : « signe-produit » pose son énoncé en trois morceaux dont deux
       par JavaScript, et « limites-graphiques-2 » ajoute une légende de tableau
       qui a porté par erreur la classe des énoncés. */
    enonce: { classes: ['enonce', 'tvi-prompt'], ardoise: ['test'],
              navigateur: ['signe-produit', 'limites-graphiques-2'] },
    reglagesDevoirs: { exercice: 'tangente-exp' },
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
      "le cadre de pose inséré (multiplication des numérateurs) n'existe qu'en Première : le contrôle de largeur du navigateur s'affiche « non applicable »",
      "la fenêtre des tables de multiplication (bouton sur chaque exercice) n'existe qu'en Première : le contrôle du navigateur correspondant s'affiche « non applicable »",
      "six exercices rougissent encore une case laissée VIDE (2.1, 2.3, 2.4, 5.2, 5.3, 6.4) : ce niveau ne remplace jamais les réponses de l'élève, et la règle de la Seconde y changerait le calcul de la note — décision à prendre, pas correction technique",
      "liveCheckCurrent() a un corps vide : la correction du mode soutien passe par submitAnswer et par un check… propre à chaque exercice, donc aucun contrôle de coloration en direct n'est transposable — c'est pourquoi « soutienEnDirect » n'est pas déclaré ici, et que le contrôle correspondant s'affiche « non applicable »",
      "le contexte envoyé au modèle n'est vérifié que pour l'exercice témoin (dexp) : la table kind -> générateur des 23 autres exercices reste à écrire",
      "aucun audit de générateur : les 45 générateurs de Terminale n'ont pas d'invariants déclarés (les 15 de la Première en ont)",
      "33 fonctions nommées vivent dans des modules enveloppés en IIFE (le bloc SA-CORE, ligne 10268, et le module de copier-coller ligne 2101) : le banc ne descend pas dedans, donc aucun contrôle de structure ne les voit. Aucune n'enregistre de note aujourd'hui — le contrôle « chaque enregistrement de note est dans une fonction que le banc voit » le vérifie à chaque exécution et virerait au rouge si un exercice y était porté",
    ],
  },
};
