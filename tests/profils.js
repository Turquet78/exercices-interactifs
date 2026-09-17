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
  ['pcol','genPctCol()'], ['bs','genBaisses()'], ['lc','genLireCoef()'], ['hs','genHausses()'], ['hsc','genHaussesCent()'],
  ['psl','genPctRes()'], ['ac','genAC()'],
];

/* Identifiant d'exercice -> clé de la table RAPPELS, pour la Première. */
const RAPPELS_PREMIERE = `(function(){
  const cles={ 'calcul-mental':'cm','pourcentage':'pct','pourcentage-depart':'pctq','pourcentage-taux':'pctq',
    'augmenter-pourcentage':'aug','augmenter-depart':'augq','augmenter-taux':'augq',
    'diminuer-pourcentage':'dim','multiplication-posee':'mp','mult-decimaux':'md',
    'mult-dec-un':'u','fractions-decimales':'fracp','fraction-pourcentage':'fp','pourcentage-colonnes':'pcol',
    'augmenter-addition':'ag2','diminuer-soustraction':'ag2','augmenter-depart-addition':'ag2q',
    'diminuer-taux-soustraction':'ag2q','augmenter-taux-addition':'ag2q',
    'diminuer-depart-soustraction':'ag2q','synthese-pourcentages':'syn','synthese-augmentations':'syn','synthese-diminutions':'syn','baisses-successives':'bs','lire-coefficient':'lc','hausses-successives':'hs','hausses-successives-cent':'hsc',
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
               'plus-petit-ensemble':'pge','lecture-variations':'lv','tableau-variation':'tvd','lecture-signes':'ls','signes-variations':'lsv','signes-variations-grand':'gsv','choisir-tableau-variation':'vtq','maximum-minimum':'mmx','maximum-minimum-tableau':'mmt','tableau-equations':'tve','tableau-vrai-faux':'tvf','image-nombre':'img','placer-image':'pim','antecedent-nombre':'ant','antecedents-droite':'adr','inequation-droite':'iqd','inequation-graphique':'ing','equation-graphique':'eqg','lecture-deux-courbes':'ifg','resolutions-graphiques':'eig','tableau-signes-graphique':'tsg','solutions-graphique':'tvg','construire-fonction':'cfx','construire-max-min':'cfx','pourcentage':'pct',
               'augmenter-pourcentage':'aug','diminuer-pourcentage':'dim','intervalles':'itv','intervalles-inegalite':'itq',
               'appartient-intervalle':'app','appartient-intervalle-2':'app','somme-fractions':'sf',
               'placer-intervalle':'plc','croiser-denominateurs':'sf','simplifier-fractions':'sf',
               'somme-fractions-libre':'sfl','simplifier-barres':'smp',
               'multiplier-fractions':'mlt','multiplier-fractions-libre':'mll',
               'diviser-fractions':'mlt','diviser-fractions-libre':'mll',
               'ordre-croissant':'ord','ecrire-solutions':'ecs','python-completer':'pyx','python-affichage':'py','python-types':'pty','python-afficher-variable':'pyc','python-noms-variables':'pvn',
               'ordre-croissant':'ord','ecrire-solutions':'ecs','python-affichage':'py','python-types':'pty','python-afficher-variable':'pyc',
               'ordre-croissant':'ord','ecrire-solutions':'ecs','python-affichage':'py','python-types':'pty','python-nom-variable':'pnv',
               'synthese-fonction':'syn', 'python-print':'pyp', 'python-deux-lignes':'pyd', 'python-placer-variables':'pyv', 'python-tableau-valeurs':'ptv', 'python-changer-valeurs':'pcv' };
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
    /* ET LA FENÊTRE FERMÉE SE ROUVRE. Détachée, sa carte est DÉPLACÉE dans la
       fenêtre du système : la page ne l’a plus. Fermer la fenêtre, puis
       recliquer, n’ouvrait plus rien (signalé par Turquet sur le 6.14,
       septembre 2026). Le banc rejoue le GESTE sur chaque fenêtre déclarée ;
       la Seconde ne détache que la Question à l’IA, son soutien reste en page.
       « bouton » est le nom de la fonction que l’onclick appelle : c’est le
       bouton de l’écran, celui que l’élève a sous la souris — sans vrai clic,
       Chromium bloque la pop-up et le contrôle mesurerait le repli en page. */
    fenetresDetachees: { exercice: "pourcentage", fenetres: [
      { nom: 'Soutien', bouton: 'conseilCourant', carte: '.conseil-card' },
      { nom: 'Question à l’IA', bouton: 'ouvrirQIA', carte: '.qia-card' },
    ] },
    /* La Première l'a depuis toujours ; on le mesure pour que les deux
       niveaux ne divergent pas — c'est d'elle que la Seconde tient sa
       largeur. « somme-fractions » partage son moteur avec la Seconde. */
    pleineLargeur: { exercices: ['pourcentage', 'mult-decimaux', 'somme-fractions'],
                     chaine: [['pourcentage', 1], ['somme-fractions', 1]] },

    /* UN « = » NE SE SÉPARE JAMAIS DE LA CASE QU'IL ANNONCE (demande de
       Turquet, septembre 2026, en deux temps : « quand on affiche "= 0 ," avec
       une case à côté, si la case passe à la ligne je veux que le "= 0" passe
       aussi à la ligne », puis « en fait dès qu'une case passe à la ligne et
       qu'il y a un "=" devant, mettre le "=" aussi à la ligne »). La rangée est
       un flex qui se replie, et le repli tombait entre le signe et la case où
       l'élève répond — une égalité qui se lit comme deux, une virgule décimale
       coupée de ses décimales. Un seul endroit assemble le groupe
       (« fabrique », dont « raccourci » est la forme sans tête), et « classe »
       est le flex qui le tient d'un seul tenant, du même écart que « rangee ».
       Le banc jsdom exige que plus aucun groupe ne soit écrit à la main, que la
       classe soit vraiment un flex, et que le rendu en pose au moins « minimum » ;
       le banc navigateur ouvre les exercices déclarés à une largeur où la rangée
       SE REPLIE pour de vrai, et mesure que la tête et sa case restent sur la
       même ligne.
       La Seconde le déclare aussi (demande de Turquet, septembre 2026 : « fais
       la même chose en seconde ») ; la Terminale, qui n'a pas ces rangées, s'y
       affiche « non applicable » plutôt que d'être tue. */
    teteCollee: { fabrique: 'fEqTete', raccourci: 'fEq', classe: 'f-grp', rangee: 'pt-row',
                  minimum: 6,
                  exercices: ['diminuer-pourcentage', 'augmenter-pourcentage',
                              'baisses-successives', 'hausses-successives', 'hausses-successives-cent',
                              'somme-fractions', 'mult-decimaux', 'fraction-pourcentage',
                              'augmenter-addition', 'pourcentage'],
                  largeurs: [[820, 1180], [600, 900], [390, 844]] },

    /* LE CADRE D'UN EXERCICE PREND TOUTE LA LARGEUR QUE LE CONTENEUR OFFRE
       (demande de Turquet, septembre 2026, pour la Seconde, « comme en
       Première »). La Terminale ne le déclare PAS, et ce n'est pas un oubli :
       elle donne à ses cartes une largeur propre par une variable unique
       (--card-max, paliers 560 / 780 / 1040 / 1200), avec une gouttière
       voulue — son fichier l'écrit en toutes lettres et interdit de la
       redéclarer. Le banc l'affiche « non applicable » plutôt que de le taire. */
    cadrePleineLargeur: true,


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
    /* {pourcentage-synthese-libre}, {synthese-augmentations-libre},
       {synthese-diminutions-libre} et {synthese-pourcentages-libre} : la copie
       s'écrit dans une feuille libre, et la correction est le verdict de la
       page (ou de l'IA) — il n'y a aucune case à colorer pendant la saisie.
       {associer-coefficient} : l'élève ne tape rien, il CHOISIT dans trois
       listes — colorer une ligne au moment où il la choisit lui dirait si elle
       est juste avant même qu'il vérifie, et il n'aurait plus qu'à essayer les
       six. C'est la règle de {solutions-graphique} en Seconde. */
    /* « ptv » — {python-tableau-valeurs} — recopie dans ses cases ce que la
       console affiche : la valeur cherchée est DÉJÀ à l'écran, et une couleur
       posée pendant la frappe ne dirait que si l'élève a bien recopié. Pire,
       « 4 » tapé avant « .5 » se déclarerait faux au milieu d'un nombre juste.
       Le soutien y colore à la vérification, sans jamais révéler la valeur. */
    soutienEnDirect: { sans: ['psl', 'sal', 'ac'] },
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
       à 2.2.9, baisses 2.3.1 à 2.3.7, et la synthèse 2.5.1 (demande de
       Turquet, août 2026, en trois temps). DEUX sources : la page a EVOL_NB,
       le banc compare à ceci. */
    nbQuestionsEvolutions: 3,
    /* 3 questions pour {associer-coefficient} — une par pourcentage, et
       chacune porte TROIS associations. DEUX sources : la page a AC_NB, le
       banc compare à ceci. */
    nbQuestionsAssocier: 3,
    /* Le témoin du GARDE DE LA SAISIE : en soutien, une case ne se colore pas
       tant que l'élève y écrit (décision de Turquet, août 2026). Il faut une
       case qui soit un vrai « input » ET que la correction en direct JUGE à
       chaque frappe — c'est là que le défaut vivait. Le banc exige d'ailleurs
       qu'un verdict soit calculé (la couleur retenue), sans quoi il resterait
       vert sur une case que personne ne juge, en parlant d'autre chose. */
    gardeSaisie: { exercice: 'multiplication-posee', champ: '.mp-box', valeur: '9' },
    /* {synthese-pourcentages-libre} (2.5.2) — la synthèse des TROIS familles,
       rédigée. Le banc navigateur TAPE la justification dans la vraie feuille
       MathLive : la voie de la fraction simplifiée (« 180/600 = 30/100 »)
       n'existe que si la sérialisation réelle repasse par le juge, et jsdom,
       qui pose des chaînes qu'il écrit lui-même, ne mesure pas cela. Il tient
       aussi le bord du VERDICT : le double répond toujours « correct:false »,
       et le juge de la page doit primer. */
    syntheseRedigee: { exercice: 'synthese-pourcentages-libre' },
    /* Le pavé numérique compact de la Première sert AUSSI ses cases MathLive
       (champsMaths = PAVE_MF dans la page — deux sources) : toutes ses cases
       pm-mf n'attendent qu'un nombre. Le banc navigateur en tape une pour de
       vrai (maths), avec un contexte TACTILE, et exige que le clavier MathLive
       complet ne s'ouvre pas. Sa FORME ne change PAS avec l'orientation : une
       rangée en bas, en portrait comme en paysage — le rectangle 4 × 3 du
       paysage a été retiré à la demande de Turquet (septembre 2026), et le
       banc navigateur mesure la rangée dans les deux orientations.
       commandes : sur tablette, les commandes du bas descendent au ras de
       l'écran et le pavé avec elles (portrait), et en paysage elles sont
       resserrées avec le pavé sur la MÊME ligne (demande de Turquet,
       septembre 2026) — la Terminale ne le déclare pas et garde sa mise en
       page. */
    /* Sur TABLETTE (écran tactile d'au moins 600 px), la police de toute la
       page est réduite à ce pourcentage (décision de Turquet, septembre 2026).
       La page doit porter exactement cette règle, et le banc navigateur mesure
       la racine rendue : réduite sur tablette, intacte sur ordinateur et sur
       téléphone. */
    /* LE MODE D'AFFICHAGE DE L'APPLICATION INSTALLÉE (demande de Turquet,
       septembre 2026, sur sa tablette Samsung : « peut-on supprimer la bande
       en bas de l'écran qui permet de réduire la fenêtre »). Cette bande est
       la barre de navigation d'ANDROID, et aucune page web ne peut la cacher :
       seul le MANIFESTE le peut, en demandant « fullscreen » au lieu de
       « standalone » — Chrome lance alors l'application en plein écran, sans
       barre système ni en bas ni en haut. Le geste, lui, RESTE : un balayage
       depuis le bas fait revenir la barre, puis l'accueil — l'élève peut
       toujours sortir, ce n'est pas un verrou. Le prix est assumé : l'heure et
       la batterie disparaissent avec la barre du bas, on ne peut pas cacher
       l'une sans l'autre.
       Deux bords, et n'en tenir qu'un ne tient rien : ce niveau doit demander
       « fullscreen », et les DEUX AUTRES — hors de la demande — doivent rester
       en « standalone », sans quoi la règle fuirait sans que rien ne le dise.
       Chromium le vérifie lui-même au banc navigateur : un mode d'affichage
       qu'il refuse rend la page non installable, et il le NOMME. */
    manifeste: { display: 'fullscreen' },
    /* LA BANDE DU BAS APPARTIENT AU SYSTÈME, EN MODE APPLICATION (signalé par
       Turquet, septembre 2026, sur une tablette Samsung : « la ligne la plus
       basse du clavier virtuel ne fonctionne pas, les caractères ne
       s'affichent pas — en portrait comme en paysage »). La page demandant
       « fullscreen », elle dessine jusqu'au bord physique de l'écran, et les
       48 dp du bas sont la zone du geste d'Android : le système y prend les
       touches. Rien de ce qui se touche ne doit donc y descendre — le clavier
       mathématique ancré, les commandes du bas, le pavé numérique.
       px : la réserve, écrite ICI et dans la page (deux sources). Elle ne vaut
       QUE pour un niveau dont le manifeste demande « fullscreen » : les deux
       autres, en « standalone », gardent la barre du système et la page ne
       descend jamais jusque-là — le contrôle exige les deux bords, et un
       niveau qui passerait en fullscreen sans réserve rougirait aussitôt.
       Le banc navigateur ouvre l'exercice SIGNALÉ, déploie le clavier et
       mesure ce qui reste dans la bande, dans les deux orientations. */
    basSysteme: { px: 48, exercice: 'synthese-diminutions-libre',
                  champ: '#salSheet math-field',
                  regles: ['#testCtrls', '#paveNum', '.MLK__rows'] },
    /* le fond du clavier, lui, reste collé au bord : c'est ce qui distingue
       le rembourrage des rangées de la marge d'avant — pas de trou sous le
       clavier, et pas une touche dans la bande. Mesuré au navigateur. */
    policeTablette: 90,
    /* Combien de poses de « mp-feedback … iafb » n'ont PAS de couleur de
       verdict (ni good ni bad). Zéro partout où un verdict connu se peint
       toujours ; quatre en Terminale, où le 6.7 et le 6.8 affichent le bilan
       AVANT de savoir — « L'IA relit ton calcul… » — et quand la relecture est
       indisponible : rien n'est décidé, donc rien n'est peint. Un verdict qui
       perdrait sa couleur fait monter ce compte, et le banc le NOMME. */
    verdictSansCouleur: 0,
    /* Sur tablette, la feuille de calcul libre (.dexp2-sheet : 2.1.7, 2.2.10,
       2.3.9) écrit à cette taille en rem au lieu de 2 rem (demande de Turquet,
       septembre 2026 : « la case d'édition du calcul peut-elle avoir une police
       plus petite »). Le banc jsdom exige la règle sous la requête média de la
       tablette, avec cette valeur, plus petite que la taille normale ; le banc
       navigateur mesure la police RENDUE de la feuille du 2.2.10 sur la tablette
       (au plus pxMax) et exige qu'elle soit plus petite que sur l'ordinateur. */
    feuilleTablette: { rem: 1.4, pxMax: 21 },
    /* SUR TABLETTE, LA CHAÎNE À NOMBRES ÉCRIT PLUS PETIT (demande de Turquet,
       septembre 2026) : « pour les exercices avec des cases à remplir avec des
       nombres, sur les tablettes, après l'énoncé, les écritures avant et après
       une case à remplir ont une police légèrement plus petite, ainsi que la
       police des cases ». Un SEUL facteur, porté par les règles mêmes qui
       donnent les tailles (calc(… * var(--tab-nb,1))) et posé sur le stage —
       ce qui vient APRÈS l'énoncé — par la requête média de la tablette : case
       et écritures rétrécissent donc du même facteur, et « une case a la taille
       des nombres qui l'entourent » tient par construction.
       Le banc jsdom exige que CHAQUE règle de taille d'une case à nombres passe
       par le facteur, que les écritures nommées ici le portent aussi, et que le
       facteur ne soit déclaré qu'à UN endroit, jamais sur la racine — posé là,
       il emporterait l'énoncé et toute la page. Le banc navigateur mesure les
       polices RENDUES sur une tablette et sur un ordinateur : la chaîne réduite
       du facteur, l'énoncé réduit de la seule police de la page. */
    chaineTablette: { facteur: 0.85,
                      ecritures: ['.f-whole', '.f-dec-q', '.f-eq', '.f-times', '.f-frac', '.fr .fn',
                                  '.fr .fd', '.fpm-const', '.mf-cor', '.pcol-phrase'],
                      /* La feuille de RÉDACTION libre (2.1.7, 2.2.10, 2.3.9, 2.5.2) est hors
                         de cette demande : elle n'a pas de case à nombres, et elle a
                         déjà sa règle de tablette (feuilleTablette). Son préfixe écrit
                         les fractions de l'énoncé — il est donc nommé ici plutôt que
                         tu, sans quoi le contrôle rougirait sur un écran voulu. */
                      hors: ['.dexp2-prefix'],
                      exercice: 'pourcentage', champ: '#p3', ecriture: '.f-whole', enonce: '#pPrompt' },
    /* Le clavier mathématique à l'écran (buildKbTerm) : sa touche « ⏎ » VALIDE
       — commit, l'événement « change » : une ligne de plus dans la feuille du
       2.2.10, la case suivante dans un exercice guidé — là où un « ✓ » ne
       faisait que CACHER le clavier (signalé par Turquet, septembre 2026 :
       « la touche valider ne fonctionne pas et ne permet pas de passer à la
       ligne »). Et sur une tablette en PAYSAGE, le clavier ancré tient sur
       DEUX rangées — les mêmes touches, moitié moins de hauteur (demande de
       Turquet, même jour). Le banc jsdom évalue les deux formes depuis la
       source et la table de routage (kbCompact/applyKbLayout) ; le banc
       navigateur ouvre l'exercice déclaré sur une tablette tactile en
       paysage, compte les rangées RENDUES, clique la vraie touche ⏎ et exige
       la ligne de plus, puis tourne l'écran en portrait où les quatre
       rangées reviennent. */
    clavierEcran: { entree: '\u23ce',
                    paysage: { rangees: 2, exercice: 'synthese-augmentations-libre',
                               champ: '#salSheet math-field', lignes: '#salSheet .dexp2-line' },
                    /* Et sur une tablette DEBOUT, le clavier ancré tient sur TROIS
                       rangées — les mêmes touches, une rangée de moins (demande de
                       Turquet, septembre 2026 : « en mode portrait, que le clavier
                       tienne sur 3 lignes au lieu de 4 »). Un TÉLÉPHONE en portrait,
                       trop étroit pour huit touches sur une rangée, garde les
                       quatre : c'est le bord opposé, et il est aussi vérifié —
                       une forme courte qui fuirait sur le téléphone rendrait ses
                       touches intouchables. */
                    portraitTablette: { rangees: 3, telephone: 4 } },
    pave: { exercice: 'multiplication-posee', champ: '.mp-box', frappe: ['5'], attendu: '5',
            touches: ['1','2','3','4','5','6','7','8','9','0',',','\u2212','\u232b','\u23ce'],
            champsMaths: 'math-field.pm-mf', commandes: true,
            /* LE PAVÉ EST AUSSI LARGE QUE L'ÉCRAN LE PERMET en paysage
               (demande de Turquet, septembre 2026) : ses touches grandissent
               pour occuper la largeur libre — jusqu'au plafond, au-delà
               duquel la rangée se centre plutôt que de devenir des barres.
               Le plafond vit ICI et la page doit porter le même (deux
               sources) ; le plancher est ce que le banc navigateur exige
               d'une touche RENDUE sur une tablette de 1180 px, où le pavé
               faisait 634 px et ses touches 40. */
            largeurPaysage: { toucheMax: 80, plancher: 52 },
            maths: { exercice: 'pourcentage', champ: '#p3', frappe: ['5', ',', '5'], attendu: '5,5' } },
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

    /* {associer-coefficient} (2.4.2) répond par une LISTE, et c'est le seul
       écran de ce niveau qui le fasse. Trois bords ne se voient donc nulle
       part ailleurs, et aucun hors d'un navigateur : la feuille pose
       « select{width:100%} », donc une liste sans largeur propre s'étire sur
       toute la ligne et les trois phrases se posent l'une sous l'autre ; le
       contrôle universel de la taille des cases ne mesure que les
       « math-field », donc une liste écrite plus petit que sa phrase lui
       échappe ; et une règle perdue sur « .ac-sel.ok » laisserait la
       vérification muette pendant que jsdom, qui lit la classe, resterait
       vert. Le banc CHOISIT dans les vraies listes avant de lire l'encre
       rendue. */
    associerCoefficient: { exercice: 'associer-coefficient' },

    /* Le devoir à la maison va du professeur à l'élève par la table des
       réglages. Si la base ne la rend pas lisible à l'élève, PostgREST répond
       « aucune ligne » — ce qui n'est PAS une erreur — et l'espace élève
       annonçait « Aucun devoir à la maison » d'un ton assuré pendant que le
       professeur voyait le sien. Le banc éprouve les trois situations, parce
       que corriger une seule ne corrigerait rien : ligne illisible, ligne lue
       mais sans devoir affiché, et devoir affiché. */
    devoirsEleve: { table: 'parametres_1ere', exercice: 'pourcentage',
                    aveu: 'ne voit aucun réglage' },
    /* LA SECONDE FAMILLE DE DEVOIRS — ce que la page doit en dire, déclaré
       ICI pour que le contrôle compare DEUX sources (le profil et la page) au
       lieu de lire la page et de la comparer à elle-même : le titre de la
       carte de l'accueil et de la page, le badge des cartes, le libellé de la
       note, et les deux différences qui ne valent pas partout — l'ordre
       imposé (ordre) et la note ramenée sur 20 (sur20). « compacte » dit si
       la liste de l'élève est la liste compacte (numéro, titre, note) ou la
       liste historique qui recopie les exercices. */
    fiches: { titre: 'Fiches de travail en classe', badge: 'Fiche', note: 'Note de la fiche',
              ordre: true, sur20: true, compacte: true },
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
    /* ET LA FENÊTRE FERMÉE SE ROUVRE. Détachée, sa carte est DÉPLACÉE dans la
       fenêtre du système : la page ne l’a plus. Fermer la fenêtre, puis
       recliquer, n’ouvrait plus rien (signalé par Turquet sur le 6.14,
       septembre 2026). Le banc rejoue le GESTE sur chaque fenêtre déclarée ;
       la Seconde ne détache que la Question à l’IA, son soutien reste en page.
       « bouton » est le nom de la fonction que l’onclick appelle : c’est le
       bouton de l’écran, celui que l’élève a sous la souris — sans vrai clic,
       Chromium bloque la pop-up et le contrôle mesurerait le repli en page. */
    fenetresDetachees: { exercice: "pourcentage", fenetres: [
      { nom: 'Question à l’IA', bouton: 'ouvrirQIA', carte: '.qia-card' },
    ] },
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
    cadrePleineLargeur: true,
    /* UN « = » NE SE SÉPARE JAMAIS DE LA CASE QU'IL ANNONCE (demande de
       Turquet, septembre 2026 : « fais la même chose en seconde »). Même
       fabrique, même classe, même contrôle qu'en Première — voir le profil de
       la Première pour la doctrine. Les quatre exercices déclarés sont ceux
       que la SONDE a vus céder : 2.2.1 et 2.3.1 à 600 px, la division de
       fractions à 600, les deux barres à 390 ; {somme-fractions} n'y est plus,
       son moteur partagé ayant déjà reçu le groupe. */
    teteCollee: { fabrique: 'fEqTete', raccourci: 'fEq', classe: 'f-grp', rangee: 'pt-row',
                  minimum: 4,
                  exercices: ['augmenter-pourcentage', 'diminuer-pourcentage',
                              'diviser-fractions', 'simplifier-barres', 'somme-fractions'],
                  largeurs: [[820, 1180], [600, 900], [390, 844]] },
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
    /* {solutions-graphique} (porté du 4.5 de la Terminale) : les cibles se
       CLIQUENT sur le dessin — ronds sur la courbe, carrés sur l'axe — et
       les couleurs du verdict se lisent à l'encre rendue. jsdom n'a pas de
       mise en page : le clic et l'encre ne se voient que dans un navigateur. */
    solutionsGraphique: { exercice: 'solutions-graphique' },
    /* {ecrire-solutions} : la réponse se TAPE en entier à côté de « S = » —
       crochets, point-virgule, U, accolades. Deux choses ne se voient pas hors
       d'un vrai navigateur : la rangée de touches AU-DESSUS du champ, cliquée
       pour de vrai (un bouton mort n'écrirait rien sans qu'une erreur ne se
       lève), et le PAVÉ des tablettes, qui doit porter les six mêmes symboles
       sur une seconde rangée — data-pave-plus. */
    ecrireSolutions: { exercice: 'ecrire-solutions', touches: ['[', ']', ';', 'U', '{', '}'] },
    /* {placer-image} : le point se POSE au clic sur le graphe d’{image-nombre} — le
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
    ecransHorsExercice: ['setup','login','space','rattrapage','choose','theme','soustheme','devoirs','mode',
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
    /* « tvg » — {solutions-graphique}, porté du 4.5 de la Terminale — ne
       colore rien au fil des clics, et c'est voulu : peindre chaque cible au
       moment où on la pose dirait laquelle est juste avant même de vérifier.
       Le soutien y colore à la vérification, sans révéler ce qui manque. */
    /* « ecs » — {ecrire-solutions} — n'a qu'une case, et elle porte la
       réponse ENTIÈRE : la colorer au fil de la frappe dirait à l'élève qu'il
       a juste avant même qu'il ne vérifie. Le soutien y colore à la
       vérification, sans jamais révéler l'écriture attendue. */
    /* « pyx » — {python-completer} — n'a qu'une case, et c'est une LIGNE DE
       CODE : la juger lettre par lettre déclarerait fausse une ligne qu'on
       n'a pas fini d'écrire. Le soutien y juge à la vérification, et NOMME
       où est l'erreur, sans révéler la ligne attendue. */
    /* « pyd » — {python-deux-lignes} — pour la même raison, deux cases plus
       loin : ses deux cases portent chacune une LIGNE DE CODE. */
    soutienEnDirect: { sans: ['lv', 'img', 'ant', 'def', 'pge', 'sfl', 'mll', 'tvg', 'ecs', 'py', 'pty', 'pyc', 'pvn', 'pyp', 'pyx', 'pyd', 'pyv', 'ptv', 'pcv'] },
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
    /* Le témoin de la BULLE LEVÉE PAR LA VÉRIFICATION (demande de Turquet,
       septembre 2026). Il faut un exercice SANS correction en direct — la
       partie Algorithmique et Python en est faite —, le seul endroit où la
       couleur n'arrive qu'au clic sur « Vérifier » : c'est là que la bulle ne
       paraissait jamais. « faux » pose une copie qui ne PEUT pas être juste :
       elle lit la réponse par la fonction même qui corrige pour en choisir une
       AUTRE — le banc ne mesure pas la réponse, il conduit — et rend le nombre
       de cases faussées, sans quoi un renommage de champ laisserait le banc
       vert devant un écran que personne n'a rempli. */
    bulleVerification: {
      exercice: 'python-affichage',
      valider: '#pyActions button.btn-primary',
      cases: '#pyHost select',
      faux: "(function(){ var q=test.questions[test.idx], a=pyAns(q), n=0;"
          + " pyCases(q).forEach(function(c){ var e=document.getElementById(c.id); if(!e) return;"
          + "   var att=String(a[c.cle]);"
          + "   var o=[].slice.call(e.options).filter(function(x){"
          + "     return !x.disabled && x.value!=='' && x.value!==att; })[0];"
          + "   if(o){ e.value=o.value; n++; } });"
          + " return n; })()",
    },
    /* Comme en Première : le pavé sert aussi les cases MathLive (toutes les
       pm-mf n'attendent qu'un nombre), tapées au banc navigateur dans un
       contexte tactile, et une seule rangée dans les deux orientations
       (demande de Turquet, septembre 2026). commandes : comme en Première,
       les commandes du bas au ras de l'écran en portrait, resserrées sur la
       ligne du pavé en paysage. */
    /* Sur TABLETTE (écran tactile d'au moins 600 px), la police de toute la
       page est réduite à ce pourcentage (décision de Turquet, septembre 2026).
       La page doit porter exactement cette règle, et le banc navigateur mesure
       la racine rendue : réduite sur tablette, intacte sur ordinateur et sur
       téléphone. */
    /* Le mode d'affichage de l'application installée. Seule la PREMIÈRE est
       passée en plein écran (demande de Turquet, septembre 2026) ; ce niveau
       garde « standalone », donc la barre de navigation d'Android. C'est le
       bord OPPOSÉ de cette demande, et il empêche la règle de fuir sur un
       niveau qui ne l'a pas demandée. */
    manifeste: { display: 'standalone' },
    policeTablette: 90,
    /* Combien de poses de « mp-feedback … iafb » n'ont PAS de couleur de
       verdict (ni good ni bad). Zéro partout où un verdict connu se peint
       toujours ; quatre en Terminale, où le 6.7 et le 6.8 affichent le bilan
       AVANT de savoir — « L'IA relit ton calcul… » — et quand la relecture est
       indisponible : rien n'est décidé, donc rien n'est peint. Un verdict qui
       perdrait sa couleur fait monter ce compte, et le banc le NOMME. */
    verdictSansCouleur: 0,
    /* Même feuille de calcul libre qu'en Première (4.5, 4.7, 4.9 et la
       synthèse) : sur tablette elle écrit à cette taille au lieu de 2 rem
       (« même chose en Seconde », Turquet, septembre 2026). */
    feuilleTablette: { rem: 1.4, pxMax: 21 },
    /* Le même clavier mathématique qu'en Première : « ⏎ » valide (commit), et
       sur une tablette deux rangées en paysage, trois en portrait — mesuré au
       banc navigateur sur la feuille du 4.5. */
    clavierEcran: { entree: '\u23ce',
                    paysage: { rangees: 2, exercice: 'somme-fractions-libre',
                               champ: '#sflSheet math-field', lignes: '#sflSheet .dexp2-line' },
                    /* Et sur une tablette DEBOUT, TROIS rangées, comme en Première
                       (« fais pareil pour la Seconde », Turquet, septembre 2026).
                       Un TÉLÉPHONE en portrait garde les quatre : c'est le bord
                       opposé, et il est vérifié lui aussi. */
                    portraitTablette: { rangees: 3, telephone: 4 } },
    pave: { exercice: 'image-nombre', champ: '#img-c', frappe: ['5', ',', '5'], attendu: '5,5',
            touches: ['1','2','3','4','5','6','7','8','9','0',',','\u2212','\u232b','\u23ce'],
            champsMaths: 'math-field.pm-mf', commandes: true,
            /* LE PAVÉ EST AUSSI LARGE QUE L'ÉCRAN LE PERMET en paysage
               (demande de Turquet, septembre 2026) : ses touches grandissent
               pour occuper la largeur libre — jusqu'au plafond, au-delà
               duquel la rangée se centre plutôt que de devenir des barres.
               Le plafond vit ICI et la page doit porter le même (deux
               sources) ; le plancher est ce que le banc navigateur exige
               d'une touche RENDUE sur une tablette de 1180 px, où le pavé
               faisait 634 px et ses touches 40. */
            largeurPaysage: { toucheMax: 80, plancher: 52 },
            maths: { exercice: 'pourcentage', champ: '#p3', frappe: ['5', ',', '5'], attendu: '5,5' } },
    /* LA SYNTHÈSE (fiche « Synthèse fonction », septembre 2026) : le banc
       navigateur ouvre l'exercice, mesure le dessin contre ses graduations
       RENDUES — la courbe s'arrête à son domaine — et joue la copie juste
       sur les quatre parties en relisant les couleurs. */
    syntheseFonction: { exercice: 'synthese-fonction' },
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
                         'tableau-signes-graphique', 'signes-variations', 'signes-variations-grand', 'choisir-tableau-variation', 'maximum-minimum', 'maximum-minimum-tableau', 'tableau-equations', 'tableau-vrai-faux', 'solutions-graphique', 'ecrire-solutions', 'construire-fonction', 'construire-max-min', 'synthese-fonction', 'python-affichage', 'python-types', 'python-afficher-variable', 'python-noms-variables', 'python-nom-variable', 'python-print', 'python-completer', 'python-deux-lignes', 'python-placer-variables', 'python-tableau-valeurs'] },
    /* {tableau-signes-graphique} : 5 questions — la seconde source du compte,
       la page a la sienne (TSG_NB). */
    nbQuestionsTableauSignes: 5,
    /* {signes-variations-grand} : trois graphiques, un par forme du tableau de
       variation (2, 3 et 4 segments — demande de Turquet, septembre 2026), et
       le tableau à quatre segments (617 px) doit TENIR dans sa carte : dans
       celle de 600 px il se cachait derrière le défilement du .lv-tblwrap, la
       borne et la dernière case coupées. Seul un navigateur mesure un tableau
       rendu contre son cadre. */
    grandsTableaux: { exercice: 'signes-variations-grand', corps: 'gsvBody', rendu: 'renderGSV', formes: [2, 3, 4] },
    /* le QCM des tableaux de variation : cinq cartes depuis que le tableau aux IMAGES fausses
       existe (demande de Turquet, septembre 2026) */
    qcmTableauVariation: { exercice: 'choisir-tableau-variation', cartes: 5 },
    /* {maximum-minimum} : le grand dessin doit rester LISIBLE et
       « … ≤ f (x) ≤ … » tenir d'un seul tenant — un repli entre les deux
       cases se lirait comme deux morceaux de phrase. Seul un navigateur
       mesure une largeur rendue et un repli. */
    /* L'ÉTIQUETTE DE COURBE SE POSE À CÔTÉ DE SA COURBE, jamais dessus
       (« même chose en seconde », Turquet, septembre 2026 — après le dessin des
       dérivées de la Terminale). Le banc navigateur mesure la boîte RENDUE
       (getBBox, Nunito 800 italique 15 px pour « Cf », Fredoka 700 pour
       « Cg ») contre les chemins RENDUS (getPointAtLength) : jsdom n'a ni
       police ni mise en page, et la boîte supposée était justement le défaut.
       Les trois exercices couvrent les trois dessins — le petit (lvGraphSVG),
       le grand (adrSVG), et celui à DEUX courbes, le plus encombré, où « Cg »
       doit éviter la courbe de f et « Cf » à la fois. */
    etiquetteCourbe: { moteur: 'lv', exercices: ['lecture-variations', 'lecture-deux-courbes', 'signes-variations-grand'] },
    maxMin: { exercice: 'maximum-minimum' },
    /* {maximum-minimum-tableau} : le tableau se lit — il doit tenir dans sa
       carte, et ses valeurs RENDUES monter avec leurs flèches. jsdom lit un
       « top » écrit ; seul un navigateur voit où la valeur tombe. */
    maxMinTableau: { exercice: 'maximum-minimum-tableau' },
    /* {tableau-equations} : l'union « S = [ ; ] ∪ [ ; ] » à huit cases doit
       se lire d'un seul tenant — coupée en deux, elle se lit comme deux
       solutions — et sans défilement à la largeur d'un écran d'ordinateur.
       Seul un navigateur sait où une rangée se replie. */
    tableauEquations: { exercice: 'tableau-equations' },
    /* {tableau-vrai-faux} : chaque affirmation — texte, Vrai/Faux, sens,
       intervalle — se lit d'un seul tenant sur SA rangée ; coupée en deux,
       la justification se lirait sans son affirmation. Seul un navigateur
       sait où une rangée se replie. */
    tableauVraiFaux: { exercice: 'tableau-vrai-faux' },
    /* {python-affichage} : un programme Python à PRÉDIRE avant de l'exécuter
       (décision de Turquet, septembre 2026). « nb » est la SECONDE source du
       nombre de questions (la page a PY_NB). Le banc jsdom compare
       l'interpréteur de la page à un vrai python3 ; le navigateur choisit dans
       les listes, clique Vérifier puis Exécuter, et relit la console rendue. */
    pythonAffichage: { exercice: 'python-affichage', nb: 4 },
    /* {python-types} : les trois types de variables — int, float, str —
       expliqués par les trois cadres du cours SUR l'écran, puis testés
       (demande de Turquet, septembre 2026). « nb » est la SECONDE source du
       nombre de questions (la page a PTY_NB). Le banc jsdom compare type() à
       un vrai python3 ; le navigateur mesure les cadres RENDUS, choisit dans
       les listes, clique Vérifier puis Exécuter, et relit la console. */
    pythonTypes: { exercice: 'python-types', nb: 4 },
    /* {python-afficher-variable} : le cours (comment on affiche une variable)
       sur l'écran, puis un programme qui commence par « note = 12 » à
       COMPLÉTER pour qu'il affiche la valeur de la variable — l'élève écrit la
       suite, peut l'exécuter, la page vérifie et le soutien dit OÙ est
       l'erreur (demande de Turquet, septembre 2026). « nb » est la SECONDE
       source du nombre de questions (la page a PYC_NB). Le banc jsdom éprouve
       le juge copie par copie et le compare à un vrai python3 ; le navigateur
       TAPE dans la vraie zone, exécute, vérifie et relit l'encre rendue. */
    pythonAfficherVariable: { exercice: 'python-afficher-variable', nb: 4 },
    /* {python-noms-variables} : pour chaque nom proposé, correct ou incorrect,
       et la RAISON s'il est incorrect (demande de Turquet, septembre 2026).
       « nb » et « par » sont la SECONDE source du nombre de questions et de
       noms par question (la page a PVN_NB et PVN_PAR). Le banc jsdom refait la
       correction par une seconde méthode et tient la porte de la
       justification ; le navigateur choisit dans les vraies listes et mesure
       les rangées rendues. */
    pythonNoms: { exercice: 'python-noms-variables', nb: 3, par: 6 },
    /* {python-nom-variable} : la fiche « Exercice 5 » — un nom de variable à
       proposer pour chaque grandeur, sans espace (demande de Turquet,
       septembre 2026). « nb » est la SECONDE source du nombre de questions
       (la page a PNV_NB), « parQ » celle des grandeurs par question
       (PNV_PAR_Q), « fiche » les quatre grandeurs du carnet, toujours dans la
       séance. Le banc jsdom compare le juge de la forme à un vrai python3 ;
       le navigateur TAPE les noms dans les vraies cases, clique Vérifier puis
       Exécuter, et relit la console. */
    pythonNomVariable: { exercice: 'python-nom-variable', nb: 3, parQ: 4,
                         fiche: ['le nombre de filles de Seconde', 'le tarif d’un repas', 'l’aire d’une figure', 'la note à un devoir'] },
    /* {python-print} : le cours de print en trois cadres, puis l'élève ÉCRIT un
       programme qui affiche la phrase demandée — « je suis en seconde » en
       première question, toujours (demande de Turquet, septembre 2026).
       « Exécuter » est LIBRE (la sortie est l'outil, pas la réponse), le juge
       est la SORTIE de pyRun, et en soutien le diagnostic nomme ce qui ne va
       pas. « nb » est la SECONDE source du nombre de questions (la page a
       PYP_NB), « premier » celle de la phrase de la demande. Le banc jsdom
       éprouve le diagnostic cas par cas ; le navigateur TAPE dans la vraie zone
       de texte, exécute, vérifie, et relit la console et l'encre rendues. */
    pythonPrint: { exercice: 'python-print', nb: 3, premier: 'je suis en seconde' },
    /* {python-completer} : le cours sur l'écran, puis un programme à
       COMPLÉTER — la ligne 1 donnée (note = 12), la ligne 2 à écrire — que
       l'élève EXÉCUTE avant de vérifier ; en soutien la page dit OÙ est
       l'erreur (demande de Turquet, septembre 2026). « nb » est la SECONDE
       source du nombre de questions (la page a PYX_NB). Le banc jsdom tient
       la fiche épinglée, le juge sur des lignes justes et fausses — chacune
       avec le diagnostic qu'elle doit recevoir —, les portes et le soutien ;
       le navigateur TAPE la ligne dans la vraie case, clique Exécuter puis
       Vérifier, et relit la console et le verdict RENDUS.
       LE COURS OUVRE LA SÉANCE, sur son propre écran, avec un exemple qui
       S'EXÉCUTE (demande de Turquet, septembre 2026) : « J'ai compris » ne
       s'ouvre qu'une fois l'exemple lancé, puis les quatre questions
       s'enchaînent sans lui. « exemple » est la SECONDE source de ce que cet
       exemple affiche : la page a PYX_EXEMPLE, et lire sa sortie pour la
       comparer à elle-même ne prouverait rien. */
    pythonCompleter: { exercice: 'python-completer', nb: 4, exemple: 'nous sommes en 2026' },
    /* {python-deux-lignes} : l'exercice 9 (suite et fin) du carnet — un
       programme à TROIS variables dont une est déjà affichée, et DEUX lignes
       à écrire, chacune avec LA bonne variable (demande de Turquet, septembre
       2026). « nb » est la SECONDE source du nombre de questions : le compte
       n'est pas un réglage de la page, c'est la structure de la séance — la
       fiche du carnet, puis un modèle par visage restant. « fiche » est celle
       du carnet, épinglée en première question. Le banc jsdom tient le
       tirage, le juge — dont les deux erreurs propres à l'exercice, le modèle
       recopié et la mauvaise variable —, la règle des paires, les portes et
       le soutien ; le navigateur TAPE les deux lignes, exécute, vérifie et
       relit la console et l'encre RENDUES. */
    pythonDeuxLignes: { exercice: 'python-deux-lignes', nb: 3,
                        fiche: { aff: ['note1 = 15', 'note2 = 15.5', 'prenom = "Louane"'],
                                 modele: 'print("la 1ère note vaut:", note1)',
                                 lignes: ['print("la 2ème note vaut", note2)', 'print("le prénom est", prenom)'] } },
    /* {python-placer-variables} : l'exercice 10 du carnet — le programme est
       ÉCRIT en entier, print compris, et seuls les NOMS des variables
       manquent : « compléter LOGIQUEMENT avec les noms des variables »
       (demande de Turquet, septembre 2026). « nb » est la SECONDE source du
       nombre de questions : le compte n'est pas un réglage de la page, c'est
       la structure de la séance — la fiche du carnet, puis un jeu de
       variables par question. « fiche » est celle du carnet, épinglée en
       première question, avec ses textes au caractère près (leurs espaces de
       frappe comprises, d'où les DEUX espaces que Python affiche), la phrase
       obtenue quand les variables sont bien placées, et celle que donne leur
       INTERVERSION — parfaitement valide pour Python, et c'est tout le sujet.
       Le banc jsdom tient le tirage, le juge, le diagnostic, les portes, la
       case vide et le soutien, et compare l'interpréteur à un vrai python3 ;
       le navigateur TAPE les noms dans les vraies cases, exécute, vérifie et
       relit l'encre RENDUE. */
    pythonPlacerVariables: { exercice: 'python-placer-variables', nb: 4,
                             fiche: { aff: ['note = 14', 'prenom = "Mathéo"'],
                                      ligne: 'print("la note de ", prenom, " est de ", note, "sur 20")',
                                      noms: ['prenom', 'note'],
                                      sortie: 'la note de  Mathéo  est de  14 sur 20',
                                      interversion: 'la note de  14  est de  Mathéo sur 20' } },
    /* {python-tableau-valeurs} : l'exercice 11 du carnet — a) exécuter le
       programme — prolongé par le TABLEAU DE VALEURS qu'on remplit en
       modifiant x dans ce programme et en l'exécutant (demande de Turquet,
       septembre 2026). « nb » et « cols » sont la SECONDE source du nombre de
       questions et de colonnes (la page a PTV_NB et PTV_COLS) ; « ecart » celle
       de l'écart minimal entre deux abscisses, en dixièmes — le contrôle lisait
       d'abord PTV_ECART dans la page et le comparait à lui-même : le sabotage
       qui collait les colonnes restait vert, à bon droit ; « fiche » est
       le programme de la demande, épinglé en première question, avec ce que
       CPython en affiche — un ENTIER, là où une abscisse décimale donne un
       flottant. Le banc jsdom refait le GARDE du tirage par sa propre
       arithmétique en dixièmes entiers — un affichage sur trois serait sale
       sans lui —, tient les portes des colonnes, le juge et le soutien, et
       compare l'interpréteur à un vrai python3 ; le navigateur TAPE la valeur
       de x dans la vraie case, clique Exécuter, remplit le tableau rendu et
       relit l'encre RENDUE des verdicts. */
    pythonTableauValeurs: { exercice: 'python-tableau-valeurs', nb: 3, cols: 5, ecart: 5,
                            fiche: { lignes: ['x = 2', 'fonction = 2*x+3', 'print(fonction)'],
                                     sortie: '7', calcul: '2x + 3' } },
    /* {python-changer-valeurs} : l'exercice 12 du carnet — un programme qui
       range deux CALCULS (somme = a + b, produit = a * b), qu'on exécute,
       puis dont on CHANGE les valeurs pour l'exécuter à nouveau (demande de
       Turquet, septembre 2026). L'ordre du carnet est renversé, comme au
       5.1 : l'élève PRÉDIT avant d'exécuter. « nb » est la SECONDE source du
       nombre de questions : ce n'est pas un réglage, c'est la structure de la
       séance — la fiche du carnet (valeurs DONNÉES, le a) en tête, puis les
       suivantes en valeurs À CHANGER (le b). « fiche » est celle du carnet,
       épinglée ; « sortie » ce qu'elle affiche, l'espace de « est égal à »
       comprise, que print double en séparant ses arguments — lire la page
       pour la comparer à elle-même ne prouverait rien. Le banc jsdom tient la
       fiche, le tirage, le juge, les trois portes et la phrase de prédiction
       qui SUIT les valeurs ; le navigateur TAPE les valeurs et les
       prédictions dans les vraies cases, clique Vérifier puis Exécuter, et
       relit la console et l'encre RENDUES.
       IL N'EST PAS DANS « tablesAide.sans », et c'est le seul exercice Python
       qui n'y soit pas : « produit = a * b » est un calcul de table, et le
       bouton n'est proposé que là où il SERT. */
    pythonChangerValeurs: { exercice: 'python-changer-valeurs', nb: 3,
                            fiche: { prog: ['a = 6', 'b = 5', 'somme = a + b', 'produit = a * b',
                                            'print("La somme de",a,"et",b,"est \u00e9gal \u00e0 ",somme)',
                                            'print("Le produit de",a,"et",b,"est \u00e9gal \u00e0 ",produit)'],
                                     somme: '11', produit: '30',
                                     sortie: 'La somme de 6 et 5 est \u00e9gal \u00e0  11\nLe produit de 6 et 5 est \u00e9gal \u00e0  30\n' } },
    /* LA TOLÉRANCE DES TEXTES AFFICHÉS — décision de Turquet (septembre
       2026) : « pour les algorithmes qui affichent un texte, accepter les
       textes qui sont presque bons : des espaces en trop ou en moins ne sont
       pas pénalisés, un ou deux caractères faux ou en trop ne sont pas
       pénalisés. » Elle vit à un seul endroit dans la page (pyTexteProche) et
       sert {python-print}, {python-completer} et {python-deux-lignes} — dont le
       juge passe par pyxAffiche ; {python-afficher-variable} reste dehors, sa
       sortie étant une VALEUR. « plusCourt » est la SECONDE source du plus
       court texte que ces exercices font afficher — « age : 16 », six
       caractères une fois les espaces retirées : en dessous, deux fautes ne
       seraient plus une faute de frappe mais un autre texte, et le banc MESURE
       les trois tirages plutôt que de le supposer. */
    toleranceTexte: { plusCourt: 6 },
    /* la seconde famille de devoirs : voir la Première */
    fiches: { titre: 'Fiches de travail en classe', badge: 'Fiche', note: 'Note de la fiche',
              ordre: true, sur20: true, compacte: true },

  /* L'ORDRE DES EXERCICES D'UN DEVOIR SE RÈGLE dans l'éditeur de ce niveau
     (ruban ▲▼) : la relecture du formulaire PRÉSERVE l'ordre rangé au lieu de
     le rabattre sur celui du menu, et l'écran de l'élève le suit — sans
     verrouiller quoi que ce soit, un devoir reste tout ouvert. Le niveau qui
     ne le déclare pas doit faire l'inverse : aucun ruban sur un devoir, et
     l'ordre du menu. Deux sources : lire la page et la comparer à elle-même ne
     prouverait rien. */
    ordreDevoirs: true,

    lacunes: [
      "le cadre de pose inséré (multiplication des numérateurs) n'existe qu'en Première : le contrôle de largeur du navigateur s'affiche « non applicable »",
      "la fenêtre des tables de multiplication n'a pas d'exercice de rapidité où se refermer (la Seconde n'en a aucun, c'est un niveau sans chronomètre) : ce seul bord du contrôle du navigateur s'affiche « non applicable »",
      "la fenêtre « Question à l'IA » est portée dans sa version réduite : pas d'illustrations, pas de courbes SVG, pas de corrigés types — ils sont indexés sur des exercices que la Seconde n'a pas. La réponse du modèle est rendue en texte simple, comme le conseil.",
    ],
  },

  /* ------------------------------------------------------------------ */
  'terminale.html': {

    /* UN « = » NE SE SÉPARE JAMAIS DE CE QU'IL ANNONCE (demande de Turquet,
       septembre 2026 : « fais la même chose en terminale »). Ce niveau n'a NI
       la fabrique NI la classe des deux autres — il écrit ses égalités avec
       six classes différentes (eq, sa2-eq, tg-eq, su-eq, rf-eq…) et parfois en
       texte nu au milieu d'une phrase, et il a déjà son propre idiome pour
       les tenir ensemble (« .dhv-eqgrp{white-space:nowrap} »). Il ne déclare
       donc pas de fabrique : le contrôle jsdom s'y affiche « non applicable »,
       et c'est le banc NAVIGATEUR qui tient la règle — sa mesure ne connaît
       aucune fabrique, elle part de chaque case et lit ce qui la précède.
       Les exercices déclarés sont ceux que la SONDE a vus céder. */
    teteCollee: { minimum: 8,
                  exercices: ['etude-fonction', 'tvi-alpha-signe', 'recurrence-fractions',
                              'tvi', 'suite-auxiliaire', 'recurrence-complete'],
                  largeurs: [[820, 1180], [600, 900], [390, 844]] },

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
    /* « devoirEntier » : ce niveau sait aussi poser la note du DEVOIR ENTIER,
       sans passer par les notes de chaque exercice (demande de Turquet,
       septembre 2026). Le banc navigateur tape alors dans les DEUX champs. */
    notesDevoir: { exercice: 'derivee-exp', tableParametres: 'parametres', tableResultats: 'resultats',
                   devoirEntier: true },
    /* LE MOT « BONUS » EST ÉCRIT, ET IL SE VOIT (demande de Turquet, septembre
       2026 : « je veux que l'on écrive bonus pour les exercices qui sont en
       bonus quand on annonce le dm avec la liste de tous les exercices et
       quand on fait cet exercice aussi »). Le banc jsdom lit le DOM ; celui-ci
       mesure le badge RENDU — un CSS perdu le rendrait invisible sans qu'une
       erreur ne se lève — et fait le trajet entier, l'énoncé du circuit papier
       compris, dont le titre ne s'écrit qu'APRÈS le tirage.
       « bonus » et « normal » sont deux exercices du niveau : le premier est
       coché bonus dans le devoir du banc, le second sert le bord OPPOSÉ. */
    bonusEcrit: { table: 'parametres', bonus: 'tangente-exp',
                  normal: 'equation-tangente', mot: 'Bonus' },
    /* La Terminale a la touche « / » de plus : ses tangentes acceptent p/q. */
    /* Le témoin du GARDE DE LA SAISIE : en soutien, une case ne se colore pas
       tant que l'élève y écrit (décision de Turquet, août 2026). Il faut une
       case qui soit un vrai « input » ET que la correction en direct JUGE à
       chaque frappe — c'est là que le défaut vivait. Le banc exige d'ailleurs
       qu'un verdict soit calculé (la couleur retenue), sans quoi il resterait
       vert sur une case que personne ne juge, en parlant d'autre chose. */
    gardeSaisie: { exercice: 'equation-tangente', champ: '#tg-fa', valeur: '9' },
    /* Sur TABLETTE (écran tactile d'au moins 600 px), la police de toute la
       page est réduite à ce pourcentage (décision de Turquet, septembre 2026).
       La page doit porter exactement cette règle, et le banc navigateur mesure
       la racine rendue : réduite sur tablette, intacte sur ordinateur et sur
       téléphone. */
    /* Le mode d'affichage de l'application installée. Seule la PREMIÈRE est
       passée en plein écran (demande de Turquet, septembre 2026) ; ce niveau
       garde « standalone », donc la barre de navigation d'Android. C'est le
       bord OPPOSÉ de cette demande, et il empêche la règle de fuir sur un
       niveau qui ne l'a pas demandée. */
    manifeste: { display: 'standalone' },
    policeTablette: 90,
    /* Combien de poses de « mp-feedback … iafb » n'ont PAS de couleur de
       verdict (ni good ni bad). Zéro partout où un verdict connu se peint
       toujours ; quatre en Terminale, où le 6.7 et le 6.8 affichent le bilan
       AVANT de savoir — « L'IA relit ton calcul… » — et quand la relecture est
       indisponible : rien n'est décidé, donc rien n'est peint. Un verdict qui
       perdrait sa couleur fait monter ce compte, et le banc le NOMME. */
    verdictSansCouleur: 4,
    pave: { exercice: 'equation-tangente', champ: '#tg-fa', frappe: ['5', ',', '5'], attendu: '5,5',
            touches: ['1','2','3','4','5','6','7','8','9','0',',','\u2212','/','\u232b','\u23ce'],
            /* LE PAVÉ EST AUSSI LARGE QUE L'ÉCRAN LE PERMET en paysage
               (demande de Turquet, septembre 2026) : ses touches grandissent
               pour occuper la largeur libre — jusqu'au plafond, au-delà
               duquel la rangée se centre plutôt que de devenir des barres.
               Le plafond vit ICI et la page doit porter le même (deux
               sources) ; le plancher est ce que le banc navigateur exige
               d'une touche RENDUE sur une tablette de 1180 px, où le pavé
               faisait 634 px et ses touches 40. */
            largeurPaysage: { toucheMax: 80, plancher: 52 } },
    /* LE CLAVIER MATHÉMATIQUE À L'ÉCRAN (demande de Turquet, septembre 2026) :
       ses deux couches se nomment « clavier A » (chiffres, opérations) et
       « clavier B » (sin, cos, π…) — « fn » et « 123 » ne disaient rien à un
       élève. Les mots vivent ICI, et la page doit les porter (deux sources).
       Et sur un TÉLÉPHONE en portrait, ses touches sont RÉDUITES : le banc
       navigateur ouvre l'exercice déclaré à la taille d'un téléphone, déploie
       le clavier par son vrai bouton ⌨️ et mesure la touche RENDUE — hauteur
       et police au plus égales aux plafonds déclarés ici, le plancher du
       réglage général étant 40 px et 20 px — puis clique « clavier B » et
       « clavier A », et regrandit la fenêtre à la taille d'une tablette, où
       les touches doivent reprendre leur taille. */
    clavierEcran: { versB: 'clavier B', versA: 'clavier A', entree: '\u23ce',   /* ⏎ valide (commit) sur ses deux couches */
                    portrait: { exercice: 'suite-auxiliaire', champ: '#scr-sa math-field.sa-mf',
                                bouton: '#scr-sa button[aria-label^="Afficher ou masquer le clavier"]',
                                hauteurMax: 36, policeMax: 18 },
                    /* LE PARTAGE DES DEUX COUCHES (demande de Turquet, septembre
                       2026, sur le clavier du 6.9) : « faire passer les touches
                       U.., n, inf, --> et l'intégrale sur le clavier B ; une
                       ligne en moins dans le clavier A ». Le clavier A garde les
                       nombres et les opérations — QUATRE rangées — et le clavier
                       B porte les variables de l'exercice et les symboles. Les
                       touches nommées ici doivent vivre sur B et NULLE PART sur
                       A : la page et le profil sont deux sources. */
                    couches: { rangeesA: 4, rangeesB: 4, unitesMax: 8, effacer: '\u232b',
                               /* Et sur une TABLETTE, les deux couches tiennent sur
                                  TROIS rangées — DEBOUT (« fais pareil pour la
                                  terminale », Turquet, septembre 2026) comme COUCHÉE
                                  (« en mode paysage, les touches doivent être plus
                                  petites de façon à tenir sur 3 lignes »). D'où le nom :
                                  la forme COURTE, et non « celle du portrait ». Le
                                  partage des couches, lui, ne bouge pas : surA et surB
                                  valent pour toutes les formes. */
                               courte: { rangeesA: 3, rangeesB: 3, unitesMax: 10 },
                               surB: ['\\infty', '\\longrightarrow', '\\smallint'],
                               surA: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '=', ','],
                               /* UN EXERCICE SUR LES LIMITES rend la rangée des variables
                                  au clavier A (demande de Turquet, septembre 2026 : « quand
                                  c'est un exercice sur les limites, mettre les touches
                                  inf, -->, x, f sur le clavier A ») : c'est là qu'on écrit
                                  « x ⟶ +∞ ». Le clavier B perd alors sa première rangée.
                                  La page ne tient aucune liste — elle lit le THÈME — et
                                  ces témoins sont là pour que le banc l'éprouve : un thème
                                  renommé ferait repartir ∞ sur le clavier B en silence.
                                  « hors » est le bord opposé : un exercice qui n'est PAS
                                  sur les limites garde le clavier d'avant. */
                               limites: { /* « equation-droite-h-v » n'a PAS « limite » dans son
                                              identifiant : c'est le témoin du THÈME, le seul
                                              qui éprouve cette moitié de kbLimites — sans lui
                                              le thème pouvait être renommé sans que rien ne
                                              rougisse, et le sabotage l'a montré en restant
                                              vert. « suite-tcm-limite », lui, éprouve l'autre
                                              moitié : il vit dans le thème des Suites. */
                                           exercices: ['limites-redaction', 'limites-graphiques',
                                                      'limites-graphiques-3', 'equation-droite-h-v',
                                                      'suite-tcm-limite'],
                                          hors: ['derivee-exp-2', 'suite-auxiliaire', 'tvi'],
                                          rangeesA: 4, rangeesB: 3, unitesMax: 9,
                                          courte: { rangeesA: 3, rangeesB: 2, unitesMax: 12 },
                                          surA: ['\\infty', '\\longrightarrow'],
                                          surB: ['\\smallint'] } },
                    /* Et sur une TABLETTE, les touches sont légèrement réduites :
                       le banc navigateur ouvre l'exercice déclaré à la taille
                       d'une tablette et mesure la touche RENDUE contre ces
                       plafonds (58 px et 30 px avant la règle). */
                    tablette: { exercice: 'suite-auxiliaire-redaction',
                                champ: '#sarSheetA math-field',
                                bouton: '#sarOutils button[aria-label^="Afficher ou masquer le clavier"]',
                                hauteurMax: 48, policeMax: 24,
                                /* ET COUCHÉE, plus petites encore (demande de Turquet,
                                   septembre 2026) : en paysage l'écran est COURT, et la
                                   plaque de quatre rangées prenait 208 px sur 768 — un
                                   quart de ce que l'élève a devant lui. La rangée de
                                   moins et ces touches réduites la ramènent à 132 px,
                                   mesurés. Le banc navigateur tourne la tablette et
                                   exige les deux : la forme courte, et ces plafonds. */
                                paysage: { hauteurMax: 40, policeMax: 20, plaqueMax: 140 },
                                /* L'exercice SUR LES LIMITES, celui où ∞ et ⟶ passent sur
                                   le clavier A : le banc l'ouvre pour de vrai et cherche
                                   les quatre touches sur la couche RENDUE. */
                                limites: { exercice: 'limites-redaction',
                                           champ: '#lrSheet math-field',
                                           bouton: '#lrActions button[aria-label^="Afficher ou masquer le clavier"]' } } },
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
    /* ET LA FENÊTRE FERMÉE SE ROUVRE. Détachée, sa carte est DÉPLACÉE dans la
       fenêtre du système : la page ne l’a plus. Fermer la fenêtre, puis
       recliquer, n’ouvrait plus rien (signalé par Turquet sur le 6.14,
       septembre 2026). Le banc rejoue le GESTE sur chaque fenêtre déclarée ;
       la Seconde ne détache que la Question à l’IA, son soutien reste en page.
       « bouton » est le nom de la fonction que l’onclick appelle : c’est le
       bouton de l’écran, celui que l’élève a sous la souris — sans vrai clic,
       Chromium bloque la pop-up et le contrôle mesurerait le repli en page. */
    fenetresDetachees: { exercice: "suite-vocabulaire", fenetres: [
      { nom: 'Soutien', bouton: 'conseilCourant', carte: '.conseil-card' },
      { nom: 'Question à l’IA', bouton: 'ouvrirQIA', carte: '.qia-card' },
    ] },

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
    /* La touche morte « ^ » d'AZERTY (signalée par Turquet sur le 6.6) : le
       gestionnaire chapeauMorte vit en Terminale — seul niveau où l'élève
       TAPE des exposants — et seul un vrai MathLive voit le texte composé. */
    chapeauMorte: { exercice: 'recurrence-formule' },
    /* La RÉCURRENCE EN FRACTIONS (6.10) : des fractions IMBRIQUÉES à cases,
       que seul un navigateur sait dessiner — la barre extérieure doit
       envelopper les barres intérieures, aucune rangée ne doit défiler, et
       les cases doivent grandir sous « 3n+9 ». Le banc TAPE la copie de la
       fiche pour de vrai avant de relire la note. */
    recurrenceFractions: { exercice: 'recurrence-fractions' },
    /* LA CONVERGENCE MONOTONE ET LA LIMITE (6.12) : le banc jsdom tient le
       tirage honnête, la fiche épinglée et les deux juges ; le NAVIGATEUR
       choisit dans les vraies listes, tape les nombres, clique « Vérifier » et
       lit la note et l'encre RENDUE — et mesure le « lim » empilé et les
       rangées qui ne défilent pas. */
    suiteTcmLimite: { exercice: 'suite-tcm-limite' },
    /* LA SUITE MONOTONE (6.11) : le tracé en escalier se pose au CLIC, et c'est
       le NAVIGATEUR qui dit sur quel rail — chaque courbe est doublée d'un
       chemin transparent épais. jsdom n'a ni mise en page ni getScreenCTM :
       le banc principal éprouve svrPoser(), seul celui-ci clique. */
    suiteVariation: { exercice: 'suite-variation-recurrence' },
    /* LA SYNTHÈSE SUR LES VARIATIONS (6.14) : la fiche 3 entière. Le banc
       jsdom tient le tirage honnête, la fiche épinglée et les deux juges ;
       celui-ci CLIQUE l'escalier pour de vrai — c'est le navigateur qui
       départage les deux rails —, TAPE la dérivée dans un vrai MathLive,
       mesure les « ≤ » de la récurrence alignés en colonnes et exige que les
       chaînes de f) et de i) tiennent sur UNE ligne. */
    suiteSynthese: { exercice: 'suite-synthese-variations' },
    /* LE VOCABULAIRE SUR LES SUITES (6.12) : la fiche se COCHE. Le banc
       principal tient le tirage et le juge ; celui-ci clique les cases pour de
       vrai, lit l'encre RÉSOLUE des verdicts et mesure le quadrillage rendu. */
    suiteVocabulaire: { exercice: 'suite-vocabulaire' },
    /* LA SUITE PAR LA DIFFÉRENCE (6.12) : le repère du 6.11 servi dans un autre
       hôte — seul un clic réel dit qu'il pose dans le bon —, la fraction de d)
       TAPÉE dans un vrai MathLive, et les grilles à colonnes RENDUES. */
    suiteVariationDifference: { exercice: 'suite-variation-difference' },
    /* Le 4.6 (l'étude menée au TVI) : ce que jsdom ne voit pas — le tableau
       du 5.3 RENDU (flèches dessinées à taille non nulle), la page qui ne
       déborde pas, et le bouton ∞ réellement CLIQUÉ, qui écrit dans la case
       et lève l'événement input. */
    alphaSigne: { exercice: 'tvi-alpha-signe' },
    /* L'étiquette « Cf′ » du dessin partagé des dérivées (afGraphSVG) se pose
       À CÔTÉ de la courbe, jamais dessus : le banc navigateur mesure la boîte
       RENDUE (getBBox) contre le chemin RENDU (getPointAtLength) sur chacun
       des trois exercices, puis sur quarante courbes de plus dessinées par la
       fonction même de la page — jsdom n'a ni police ni mise en page. */
    etiquetteCourbe: { moteur: 'af', exercices: ['associer-derivee', 'variations-depuis-derivee', 'signe-derivee-qcm'] },
    /* LA TERMINALE EST LE SEUL NIVEAU qui pose des indices — Uₙ, eˣ — DANS des
       conteneurs flex : les cellules des grilles de récurrence, les
       numérateurs et les dénominateurs des fractions, les lignes tg et s1. Un
       <sub> ou un <sup> enfant direct d'un flex en devient un ITEM, où la
       spécification ignore vertical-align : il remonte sur la ligne de sa
       lettre, et le gap l'en écarte — « Uₙ » se lit « U n » (signalé par
       Turquet, septembre 2026, sur le 6.13). La page lui rend sa place ; le
       banc navigateur l'exige sur tous les exercices visités, et ce drapeau
       est son BORD OPPOSÉ : il dit que ce niveau a bien des indices à
       mesurer. La Seconde et la Première n'en posent aucun (mesuré : 0), donc
       elles ne le déclarent pas et le contrôle s'y affiche « non
       applicable » — un contrôle qui ne s'applique pas se déclare, il ne se
       retire pas. */
    indicesEnFlex: true,
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
    /* LES TRAVAUX FACULTATIFS (demande de Turquet, septembre 2026) : la seconde
       famille de devoirs de la Terminale. Gérés « de la même manière que les
       DM » : tous les exercices ouverts (pas d'ordre imposé) et la note en
       points bruts — les deux différences que les fiches de la Seconde et de
       la Première portent ne valent PAS ici, et le dire est ce qui empêche
       le banc de les exiger à tort. La liste de l'élève est la liste
       historique de la Terminale, qui recopie les exercices. */
    fiches: { titre: 'Travaux facultatifs', badge: 'Fiche', note: 'Note de la fiche',
              ordre: false, sur20: false, compacte: false },

    ordreDevoirs: true,

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
