# Terminale — équations différentielles (thème 8)

## {equadiff-verifier-solution} (8.1.1) : vérifier qu'une fonction est solution

Demande de Turquet (novembre 2026), avec la fiche « équa diff » (exercice 2) :
« en terminale, créer un exercice comme le pdf dans le nouveau thème équation
différentielle. On pourra créer des équations différentielles de la même
difficulté. Il ne faut pas de logarithme népérien. S'il y a une dérivée
produit à déterminer ou un quotient, on présentera cette dérivée comme dans
les exercices 4.1.1 ou le 4.1.4 ».

**Un thème neuf, une partie, un exercice.** Thème 8 « Équations
différentielles », partie 1 « Vérifier une solution » : 8.1.1. Le moteur est
le kind `edv`, l'écran `#scr-edv`.

**Les cinq vérifications de la fiche, dans son ordre — une question chacune.**

| Question | Équation (E) | Fonction | Sur la fiche |
|---|---|---|---|
| 1 | y′ = ay + cx + d | f(x) = mx + p | y′ = y + x, f = −x − 1 |
| 2 | la même | g(x) = Ke^(ax) + mx + p | g = eˣ − x − 1 |
| 3 | y′ = ay + m e^(ax) | f(x) = (mx + p)e^(ax) | y′ = y + eˣ, f = xeˣ |
| 4 | y′ = P′(x) y | f(x) = e^(P(x)) | y′ = 2xy, f = e^(x²) |
| 5 | la même | g(x) = ke^(P(x)), k réel | g = ke^(x²) |

Les familles sont construites À L'ENVERS, pour que la fonction soit toujours
solution : on tire la solution (m, p, a), et l'équation en découle
(c = −am, d = m − ap). a parmi 1 (le plus souvent), 2, 3, −1, −2 ; P parmi
x², −x², 2x², 3x², x² + cx, x³. Aucun logarithme : des polynômes et des
exponentielles seulement. Les questions 1 et 2 partagent leur équation, les
questions 4 et 5 aussi, comme sur la fiche. Le réglage « Questions » d'un
devoir est lu (`dmNbQuestions(5)`) : moins de cinq questions en prennent une
sur deux à peu près dans l'ordre, plus de cinq recommencent la série avec de
nouvelles équations.

**La vérification suit les lignes de la fiche**, dans une grille où les ⟺ et
les = s'alignent :

    Vérification : y′(x) = y(x) + x ⟺  […]′(x) = […](x) + x
                                    ⟺  ( [……] )′ = [……] + x
                                    ⟺  [……] = [……]
                                    ⟺  [……] = [……]      ce qui est [vrai ▾]

La première ligne attend le NOM de la fonction (f ou g), la deuxième son
expression, la troisième la dérivée calculée à gauche et le second membre où
la fonction est remplacée à droite, la dernière les deux membres réduits. Au
b), la dernière ligne est `e^(ax)( […] ) = e^(ax)( […] )` — chaque membre
factorisé par l'exponentielle. Au c), trois lignes, comme sur la fiche ; la
conclusion « ce qui est [vrai] » y est ajoutée, pour toutes les questions.
Les deux lignes identiques de la fiche au b) (« e^x(……) = e^x(……) » deux
fois) n'en font qu'une.

**La dérivée du produit se présente comme au 4.1.1** (demande explicite) :
« On calcule d'abord la dérivée de f(x) = … » ; u, v, u′, v′ dans l'ordre
qu'on veut ; l'encadré f′(x) = u′×v + u×v′ ; la substitution
( )×( ) + ( )×( ) ; le développement, un coefficient devant chaque e^(ax)
(trois termes, deux quand p = 0, comme le 4.1.1 quand b = 0) ; la
factorisation e^(ax)( … ). Le juge reprend celui du 4.1.1 : l'ordre u/v
retenu est celui qui colle le mieux aux cases écrites ; une ligne juste en
bloc rend toutes ses cases justes ; sinon chaque case est appariée à un
facteur ou à un terme attendu, et la correction écrit celui qui reste. Aucune
famille ne demande de quotient : la fiche n'en a pas. Si une famille à
quotient vient un jour, sa dérivée se présente comme au 4.1.4.

**Le juge est numérique.** Chaque case est lue comme une fonction de x
(`compileExprExp`, la lecture du 4.1.1, après `dexpCellValue` qui retire les
résidus MathLive) et comparée en six valeurs de x à ce qu'elle doit valoir :
toute écriture égale est juste. La lettre k de la question 5 est remplacée
par deux réels (1,7 et −2,3) et l'égalité doit tenir pour les deux — « pour
tout k ». Une seule case demande une FORME : la dernière ligne du a), qui
doit être RÉDUITE — pas plus de termes au premier niveau que la forme
réduite (`edvNbTermes`) : « −x − 1 + x » à la place de « −1 » est rouge.

**Les cases d'une même ligne valent souvent la même fonction**, et ce n'est
pas un défaut : f′(x) et ay + cx + d sont égales PARCE QUE f est solution —
c'est exactement ce qu'on vérifie. Une case se distingue par sa place, pas par
sa valeur ; la case du second membre accepte donc aussi une forme déjà
réduite.

**Le reste suit la convention** : en soutien, une case se colore quand on la
quitte (la correction en direct `checkEDV(true)`, les gardes du site) ; une
copie corrigée peint le juste en bleu, le faux en rouge avec la réponse en
vert à côté (écrite en mathématiques par MathLive, pas en LaTeX brut), la case
oubliée reçoit sa réponse en vert ; la note de la question compte ses cases.
Navigation au clavier par `FICHE_ECRANS` (Entrée : case suivante, puis
« Vérifier »).

**Exécuté** dans un vrai Chromium avant la livraison : les cinq questions
remplies juste donnent 5 / 5 et l'écran de fin ; la fiche exacte (y′ = y + x,
f = −x − 1) avec « g » au lieu de « f » et une dernière ligne non réduite
donne 6 cases justes sur 9, les deux fausses en rouge, la conclusion oubliée
en vert ; le b) avec u et v inversés (u = eˣ, v = x) est accepté, un
coefficient faux du développement rougit seul ; en soutien, eˣ écrit pour
e^(x²) rougit à la sortie de la case.
