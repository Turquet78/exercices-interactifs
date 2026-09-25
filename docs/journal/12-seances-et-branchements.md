# Séances : pause, abandon, branchements oubliés

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Portage depuis `terminale.html`** — ne jamais extraire par script en filtrant
sur `function`, `const` et `let` : les affectations comme
`window.__fenetresDetachees = […]` et les redéfinitions de `$` sont invisibles à
ce filtre. Deux pannes sont nées exactement de là.

**Un brouillon de pause désigne quatre choses, pas une.** L'exercice, le mode,
le devoir, et — en Première — le passage. Trois endroits en avaient chacun leur
idée : l'écran des modes en montre deux, un par mode, mais ne regardait pas le
devoir ; l'écran d'un devoir n'en montre qu'un, celui de ce devoir et de ce
passage ; et l'effacement ne regardait ni le devoir ni le passage. Un seul
abandon emportait donc la pause de tous les autres passages, des autres devoirs
et du travail libre — du travail en cours perdu, sans le moindre message ; et le
menu libre proposait de reprendre un brouillon né dans un devoir, si bien qu'y
« reprendre » relançait en douce une tentative de devoir. `memeBrouillon()` en
décide maintenant seule, et les trois écrans la partagent — **ce que l'écran
montre et ce que l'effacement retire doivent être la même chose**, sans quoi
corriger un seul des deux côtés ne corrige rien.

**Abandonner ne pose aucune note, et n'efface que la pause de son mode.** Le
même bouton faisait trois choses selon l'endroit : rien en Première, une note
partielle « sur ce qui a été fait » en Seconde et en Terminale, et la note des
calculs déjà sus aux tables de multiplication — un élève qui renonçait repartait
donc avec une note qu'il n'avait pas demandée. Abandonner ne touche plus à la
progression (décision de Turquet, août 2026) ; `tmAbandon()` a disparu et
`tmFinir()` ne sert plus qu'à la vraie fin, tous les calculs sus. Le mode, lui,
n'est jamais élargi : l'entraînement et le soutien sont deux travaux distincts,
que l'écran des modes montre côte à côte, et abandonner l'un ne jette pas
l'autre. Et l'abandon **dit la vérité** : si la base refuse d'effacer,
l'exercice est toujours en pause, et l'élève l'apprend au lieu de lire
« abandonné ✓ » puis de retrouver sa pause intacte. Le contrôle du mode tient
les deux bords, parce que chacun a son défaut : trop étroit, l'exercice reste en
pause dans le mode qu'on vient d'abandonner ; trop large, il emporte le travail
d'à côté. Celui de la note en a deux aussi — l'un exerce la vraie fonction
contre le double de la base, l'autre lit le corps d'`abandonTest()` pour qu'une
branche propre à un exercice ne puisse pas y ramener une note sans être vue.

**Cinq oublis silencieux en ajoutant un exercice.** Cinq des quinze
branchements n'étaient contrôlés par rien. Aucun ne casse quoi que ce soit : ils
retirent une aide, une correction ou une note, et personne ne s'en aperçoit
avant qu'un élève ne bute dessus un soir. Trois d'entre eux avaient déjà laissé
passer un manque, trouvé le jour où le contrôle a été écrit.

*Hors de `THEMES`, un exercice est inatteignable.* `TESTS` dit ce qu'il est,
`THEMES` où il se trouve, et rien ne les relie : absent de `THEMES`, il
n'apparaît ni dans le menu de l'élève, ni dans le tableau du professeur, ni dans
le total d'un devoir, et il n'a pas de numéro — le numéro EST sa position. Un
exercice volontairement retiré du menu mais gardé dans `TESTS` pour que ses
vieilles notes gardent un nom se déclare (`horsThemes` ; la Terminale en a deux).

*La réserve du bas.* `#testCtrls` — « Pause », « Abandonner » — est en position
fixe en bas de l'écran. Sans `padding-bottom:84px` sur l'écran de l'exercice, il
recouvre la dernière ligne : la case est là, l'élève ne peut ni la lire ni la
toucher. La liste des écrans est écrite à la main en CSS, à côté de
`testScreens`, et les trois fichiers avaient divergé — la Seconde nommait huit
écrans de la Terminale, dont aucun n'existe chez elle, et ne couvrait donc aucun
de ses propres exercices.

*`liveCheckCurrent()`.* L'oublier laisse un exercice où le mode soutien ne
corrige plus rien pendant la saisie : l'élève remplit tout, ne voit aucune
couleur, et croit l'exercice cassé. Un exercice qui corrige autrement se déclare
(`soutienEnDirect.sans`) plutôt que d'affaiblir le contrôle pour tout le monde.

*`QIA_SUGG`.* Sans entrée, la fenêtre « Question à l'IA » retombe sur deux
questions passe-partout, sans rapport avec ce que l'élève a sous les yeux :
l'aide est là, elle ne sert plus à rien. Trois écrans de la Terminale étaient
dans ce cas. Une clé sans écran reste licite — la Première en a une, `dimq`,
choisie à la volée.

*`details.test`.* Le plus coûteux : la note part sous l'identifiant d'un autre
exercice, ou sous un identifiant que rien n'affiche. Elle est bien en base,
l'élève voit son résultat, et elle a disparu de son bilan comme du tableau du
professeur. Un contrôle vaut pour les trois fichiers — aucun identifiant écrit
dans une note ne doit être étranger à `TESTS` ; l'autre ne vaut que pour la
Première, seule à épingler l'identifiant dans chacune de ses quatorze fins de
test (les deux autres enregistrent sous `currentTestId`, celui du menu, où tout
exercice est atteignable par construction). Huit identifiants de la Première ne
sont atteignables que par le paramètre d'un démarreur partagé —
`startA2Q('augmenter-taux-addition', …)` — : les chercher comme littéraux en
aurait manqué le tiers.

**Aucune séance ne pose deux fois la même question.** Signalé par Turquet
(septembre 2026) : une élève a eu deux fois le même énoncé au 4.4.2 de la
Seconde. Le correctif de cet exercice (`genAC(deja)`, voir
`10-premiere-pourcentages.md`) a été suivi d'un TOUR DES TROIS NIVEAUX, fait
par une sonde avant tout correctif : chaque exercice du menu démarré cent fois,
et deux questions d'une même séance comparées sur leurs données. TRENTE
exercices tiraient leurs questions une à une, `Array.from({length:n}, gen)`,
sans regarder les précédentes — de une séance sur cinquante (les
pourcentages à contexte) à une sur trois ({lire-coefficient}, qui n'a que
seize coefficients à lire). Trois autres sont sortis à la seconde sonde,
plus rares, et un cinquième ({antecedent-nombre}) au contrôle lui-même : un
tirage rare échappe à tout échantillon, et c'est pourquoi le contrôle a deux
bords.
**UN SEUL ENTONNOIR** : `distincte(qs, fabrique)` retire une question tant
qu'elle reprend les DONNÉES d'une question déjà tirée, et `distinctes(n,
fabrique)` remplace `Array.from` — même appel, `fabrique(undefined, i)`,
pour que les fabriques qui lisent l'index ne changent pas. La clé
(`cleQuestion`) retire la tournure (`v`), le contexte (`ci`, `intro`,
`unit`, `g`), l'ordre des propositions (`ordre`, `opts`, `bon`) et les choix
de l'élève : les mêmes nombres sous un autre habit restent le même calcul.
Deux cents essais au plus : un vivier plus petit que la séance rend un
doublon plutôt que de figer la page.
**UN PIÈGE S'EST MONTRÉ EN BRANCHANT** : la synthèse des pourcentages passait
`()=>plan[i++]()` — une fabrique qui AVANCE un compteur à chaque appel. Un
nouvel essai y aurait consommé la question suivante du plan, puis lu au-delà
de sa fin. Elle lit désormais le plan par l'index de la question,
`(_,i)=>plan[i]()`. Une fabrique passée à `distinctes()` doit pouvoir être
rappelée sans effet de bord.
**LE CONTRÔLE A DEUX BORDS** (« aucune séance ne pose deux fois la même
question », banc principal) : le PRATIQUE démarre chaque exercice du menu
quarante fois et compare les questions sur une clé écrite dans le banc, pas
lue dans la page ; le STRUCTUREL lit la source et refuse tout
`test.questions=Array.from({length:`, le motif même des trente doublons.
Il ne voit pas une boucle `push` écrite à la main : c'est le bord pratique
qui l'a vue sur les quatre constructeurs de ce genre, et il ne verra pas
un doublon d'une séance sur mille. Le dire vaut mieux que le taire.

