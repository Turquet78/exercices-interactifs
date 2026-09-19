# Opérations posées

Chronique du projet — pourquoi cette règle existe, ce qu'elle a coûté,
par quel sabotage elle a été éprouvée. Les règles qui valent à chaque
tour vivent dans `CLAUDE.md` ; ce fichier garde le détail et les preuves.

---

**Une opération posée se juge à l'œil, pas au compte.** La grille des
opérations posées (`.mp-op`) est en flexbox à cellules de largeur fixe, et les
rangées sont alignées à droite. Une rangée qui n'a pas le MÊME nombre de
cellules que les autres décale donc le signe et les colonnes : l'opération n'est
plus posée, elle est de travers — et rien dans le code ne le dit. Chaque rangée
compte un `op` puis exactement `nCols` cellules, `nCols` valant 3 d'ordinaire et
4 quand l'addition déborde (999 + 99 = 1098) ; le trait suit la largeur. Les
cases du résultat suivent le RÉSULTAT et non une largeur fixe — une case en trop
se lirait comme un zéro à écrire, et 102 − 97 n'en demande qu'une. Deux
contrôles : l'un compte les cellules et les cases sur les quatre formes, l'autre
MESURE les positions dans un vrai navigateur — seul un navigateur sait où tombe
une colonne.
Les cases de retenue sont facultatives, et **ne sont posées que là où il y a
une retenue** : une case vide à remplir de rien n'apprend rien, et l'élève
finissait par se demander ce qu'on lui demandait (décision de Turquet, août
2026). C'est un arbitrage assumé — la présence d'une case dit désormais où la
retenue tombe. Le tirage garantit qu'il en reste toujours au moins une.
Les deux opérations **alternent**, en commençant par une addition : l'élève
passe d'une technique à l'autre à chaque calcul. Le tirage était auparavant
mélangé — même total, pas le même exercice.
**À la soustraction, la retenue s'écrit à DEUX endroits, pas un.** Méthode par
compensation : le petit `1` devant le chiffre du HAUT — 2 se lit alors 12 — et
la même retenue redescend en `+1` devant le chiffre du BAS de la colonne
suivante. C'est le geste du cahier. La première version n'en posait qu'une, sur
la rangée au-dessus, c'est-à-dire à l'endroit de l'ADDITION : même position,
deux sens opposés — la case s'ajoutait au nombre du bas alors qu'à l'addition
elle entre dans la colonne. Turquet, professeur de mathématiques, n'a pas su la
lire ; aucun élève ne l'aurait pu. L'énoncé le dit maintenant, et il change
selon l'opération. La soustraction n'a donc **que trois rangées** là où
l'addition en a quatre — un contrôle du navigateur qui en exigeait quatre
partout rougissait sur une soustraction parfaitement dessinée.
**Et la retenue du haut REDESCEND toute seule** (demande de Turquet, août
2026, Première) : les deux marques sont UNE retenue écrite deux fois, l'élève
ne l'écrit donc plus qu'en haut — la page pose le « +1 » du bas et l'efface
s'il efface. Le miroir copie la VALEUR écrite, juste ou non : un miroir qui
écrirait « 1 » sous un 7 corrigerait l'élève au lieu de le refléter. Il ne
lève AUCUN événement sur la case du bas — son écouteur générique y volerait le
focus — et l'avance automatique SAUTE ces cases : la page les remplit, le
curseur qui s'y parquerait laisserait l'élève devant une case déjà pleine
(elles restent atteignables au clic et à Tab). En soutien, la case remplie par
la page prend sa couleur à la sortie de la case, comme toute case non touchée
— et le premier jet du banc navigateur s'y est pris en défaut : il tabulait
UNE fois, atterrissait DANS la case du bas, et mesurait une case encore sous
le curseur, où le garde de la saisie diffère la couleur à bon droit. La
consigne dit le nouveau geste — une page qui pose le +1 pendant que la
consigne demande de l'écrire ferait chercher une case à remplir. Sept
sabotages, chacun rougissant en nommant son défaut.
Les colonnes de cet exercice sont plus larges (`--asp-col`, 78 px mesurés) :
il faut la place d'écrire une marque DEVANT le chiffre sans la poser dessus. La
largeur vit à un seul endroit, le trait la relit.
