-- ============================================================================
--  009 — La connexion sans la liste des prénoms
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE, APRÈS LA MIGRATION 008.
--
--  ⚠️  ELLE SE JOUE APRÈS LA MISE EN LIGNE, PAS AVANT — l'inverse des 003,
--      007 et 008, et pour une raison qui ne se devine pas.
--
--  LE REPÈRE À LIRE est l'écran de connexion lui-même : la page qui connaît
--  cette migration demande de TAPER son prénom (un champ « Ton prénom », puis
--  le code). Tant que vous voyez des PASTILLES de prénoms à cliquer, sur l'une
--  des trois pages, NE JOUEZ PAS ce fichier. Les numéros qui l'ont apportée —
--  Seconde v483, Première v317, Terminale v384 — valent « ce numéro ou plus »,
--  et un numéro recopié peut se tromper (c'est arrivé avant même la mise en
--  ligne) : c'est le champ qu'on regarde. Dans l'autre ordre, la connexion de TOUT LE MONDE
--  est coupée : l'ancienne page demande la liste des prénoms avant toute
--  authentification (select sur eleves… en tant que visiteur), et cette
--  migration ferme précisément cette lecture — l'écran afficherait « Aucun
--  compte pour l'instant » à une classe entière. La nouvelle page, elle, se
--  passe de la liste ; et TANT QUE cette migration n'est pas jouée, elle se
--  replie d'elle-même sur l'ancienne lecture (PostgREST répond 404, code
--  PGRST202, à une fonction qui n'existe pas encore). Ce repli s'éteint tout
--  seul dès que ce fichier est passé : il ne reste rien à retirer.
--
--  POURQUOI CE FICHIER EXISTE
--
--  La migration 001 avait posé, sur chaque table d'élèves, une politique de
--  lecture ouverte à anon : « la liste des prénoms doit rester lisible sans
--  être connecté, c'est l'écran de connexion qui la demande ». C'était vrai, et
--  c'était le prix : n'importe qui, sans compte, lisait les prénoms de trois
--  classes de mineurs et la clé de chacun — dont l'adresse de connexion est
--  dérivée. Décision de Turquet (octobre 2026) : cette lecture se ferme.
--  L'élève TAPE son prénom, et la page n'obtient que ce qu'il faut pour le
--  connecter : la ou les clés de CE prénom.
--
--  CE QU'ELLE FAIT
--
--  1. public.normaliser_prenom(text) : minuscules, espaces rognés et réduits,
--     accents retirés — pour que « Chloé », « chloe » et « CHLOÉ  » soient le
--     même prénom. La page applique la MÊME règle de son côté (normaliserPrenom,
--     par NFD) ; les deux doivent rester d'accord.
--
--  2. public.cles_de_connexion(niveau, prenom) : rend la ou les clés des élèves
--     du niveau dont le prénom normalisé est celui demandé — cinq au plus,
--     triées. Elle est SECURITY DEFINER : elle lit la table SANS repasser par
--     la RLS, comme est_prof() — sans cela, le visiteur qui l'appelle ne verrait
--     rien, puisque la politique qui le laissait lire disparaît au point 3.
--     Et elle ne rend QUE la clé : ni l'identifiant, ni le prénom, ni la liste.
--     Un visiteur n'obtient plus que ce qu'il savait déjà (le prénom qu'il a
--     tapé) traduit en ce qu'il lui faut pour tenter un code — et le code,
--     lui, reste vérifié par Supabase seul.
--
--  3. Sur eleves, eleves_1ere et eleves_2nde : la politique p_<table>_liste
--     est REMPLACÉE par la même, pour « authenticated » seul. Le NOM ne change
--     pas (d'autres scripts peuvent le citer), seul « anon » disparaît. On
--     remplace, on n'ajoute pas : deux politiques permissives se combinent par
--     un OU, et c'est ainsi qu'on garde une règle qu'on croit avoir retirée
--     (la leçon de la migration 002).
--
--  CE QU'ELLE NE FAIT PAS, ET C'EST VOULU
--
--  Un élève CONNECTÉ lit toujours la liste entière de sa classe : le tableau
--  du professeur, les signalements et le bilan en ont besoin (ils lisent
--  eleves….id et prenom pour nommer les lignes). Restreindre l'élève connecté
--  à sa propre ligne est une étape possible plus tard, NOMMÉE ici comme non
--  faite — et non faite.
--
--  Elle ne touche pas aux scripts à clé de service — sauvegarde.mjs,
--  relier-comptes.sql, la fonction Edge admin-eleve : ils traversent la RLS,
--  qu'une politique soit là ou non.
--
--  Et elle laisse un RÉSIDU, nommé plutôt que caché : un visiteur peut
--  demander si « Léa » a un compte dans une classe, et obtenir ses clés —
--  cinq au plus par appel (limit 5 : au-delà, les homonymes suivants ne
--  sortent pas, et ne peuvent pas se connecter par cet écran), sans autre
--  cadence que celle de PostgREST. C'est un oracle d'existence par prénom :
--  bien moins que la liste entière d'avant, mais pas « rien ». Le code, lui,
--  reste le seul secret, vérifié par Supabase seul, sous sa limitation de
--  cadence. Un durcissement possible, NON FAIT ici : « revoke select on
--  public.eleves, public.eleves_1ere, public.eleves_2nde from anon » — la
--  fonction, SECURITY DEFINER, n'en a pas besoin, et une politique anon
--  recréée un jour dans la console ne rouvrirait plus rien.
--
--  LE CACHE DE SCHÉMA DE POSTGREST. Le fichier se termine par
--  « notify pgrst, 'reload schema' » : Supabase recharge normalement ce cache
--  de lui-même après un CREATE FUNCTION, mais pas à la seconde. Tant qu'il
--  n'est pas rechargé, la page reçoit PGRST202, se replie sur une liste que
--  ce fichier vient de fermer, et répond « Prénom inconnu » à tout le monde.
--  Si c'est ce que vous voyez dans la minute qui suit : attendez, ne rejouez
--  rien.
--
--  ELLE EST IDEMPOTENTE : la rejouer ne casse rien et ne duplique rien.
--  Un niveau dont la table est absente est SIGNALÉ et sauté, jamais deviné.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Le prénom normalisé — la MÊME règle que normaliserPrenom() dans la page
-- ---------------------------------------------------------------------------
-- La page normalise par NFD : chaque lettre précomposée est décomposée, les
-- signes combinants (U+0300 à U+036F) retirés, puis minuscules, blancs rognés
-- et réduits. PostgreSQL sait faire EXACTEMENT cela depuis sa version 13 :
-- normalize(p, NFD) — c'est elle qu'on emploie, et non une table d'accents.
-- Une liste « à la française » n'était pas cette règle : ş, š, č, ğ, ă, ễ
-- passaient d'un côté et pas de l'autre ; une table générée depuis NFD ne
-- l'était pas non plus, parce qu'elle ne retirait pas un accent DÉJÀ
-- décomposé (« e » suivi d'un accent combinant, ce qu'un collage ou certains
-- claviers produisent). Avec normalize(), précomposé et décomposé se
-- rejoignent avant le retrait, comme dans la page.
-- Ce qui reste : les minuscules. lower() dépend de la locale du serveur —
-- sous un ctype « C », « Ł », « Ø », « Æ » restent en majuscules quand la page
-- rend « ł », « ø », « æ ». La table de translate ci-dessous ne contient donc
-- QUE les majuscules non décomposables hors ASCII, chacune vers sa minuscule
-- (772 lettres du plan de base, générées depuis String.prototype.toLowerCase :
-- une règle qui dépend de la locale n'est pas une règle) ; lower() ne traite
-- plus que l'ASCII, identique partout. Les blancs sont ceux que \s et trim()
-- voient en JavaScript, insécable compris ; on réduit d'abord, on rogne
-- ensuite. Le banc de la base (tests/base.js, 1 sexies) relit les fonctions
-- de la page et du double et exige le même résultat sur les mêmes sondes —
-- décomposées comprises : la règle « les deux doivent rester équivalentes »
-- a un contrôle, elle n'est plus une promesse.
create or replace function public.normaliser_prenom(p text)
returns text
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select btrim(
           regexp_replace(
             lower(translate(
               regexp_replace(normalize(p, NFD), '[\u0300-\u036f]', '', 'g'),
               'ÆÐØÞĐĦĲĿŁŊŒŦƁƂƄƆƇƉƊƋƎƏƐƑƓƔƖƗƘƜƝƟƢƤƦƧƩƬƮƱƲƳƵƷƸƼǄǅǇǈǊǋǤǱǲǶǷȜȠȢȤȺȻȽȾɁɃɄɅɆɈɊɌɎͰͲͶͿΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩϏϘϚϜϞϠϢϤϦϨϪϬϮϴϷϹϺϽϾϿЂЄЅІЈЉЊЋЏАБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯѠѢѤѦѨѪѬѮѰѲѴѸѺѼѾҀҊҌҎҐҒҔҖҘҚҜҞҠҢҤҦҨҪҬҮҰҲҴҶҸҺҼҾӀӃӅӇӉӋӍӔӘӠӨӶӺӼӾԀԂԄԆԈԊԌԎԐԒԔԖԘԚԜԞԠԢԤԦԨԪԬԮԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖႠႡႢႣႤႥႦႧႨႩႪႫႬႭႮႯႰႱႲႳႴႵႶႷႸႹႺႻႼႽႾႿჀჁჂჃჄჅჇჍᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᎸᎹᎺᎻᎼᎽᎾᎿᏀᏁᏂᏃᏄᏅᏆᏇᏈᏉᏊᏋᏌᏍᏎᏏᏐᏑᏒᏓᏔᏕᏖᏗᏘᏙᏚᏛᏜᏝᏞᏟᏠᏡᏢᏣᏤᏥᏦᏧᏨᏩᏪᏫᏬᏭᏮᏯᏰᏱᏲᏳᏴᏵᲉᲐᲑᲒᲓᲔᲕᲖᲗᲘᲙᲚᲛᲜᲝᲞᲟᲠᲡᲢᲣᲤᲥᲦᲧᲨᲩᲪᲫᲬᲭᲮᲯᲰᲱᲲᲳᲴᲵᲶᲷᲸᲹᲺᲽᲾᲿẞỺỼỾℲⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅬⅭⅮⅯↃⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⰀⰁⰂⰃⰄⰅⰆⰇⰈⰉⰊⰋⰌⰍⰎⰏⰐⰑⰒⰓⰔⰕⰖⰗⰘⰙⰚⰛⰜⰝⰞⰟⰠⰡⰢⰣⰤⰥⰦⰧⰨⰩⰪⰫⰬⰭⰮⰯⱠⱢⱣⱤⱧⱩⱫⱭⱮⱯⱰⱲⱵⱾⱿⲀⲂⲄⲆⲈⲊⲌⲎⲐⲒⲔⲖⲘⲚⲜⲞⲠⲢⲤⲦⲨⲪⲬⲮⲰⲲⲴⲶⲸⲺⲼⲾⳀⳂⳄⳆⳈⳊⳌⳎⳐⳒⳔⳖⳘⳚⳜⳞⳠⳢⳫⳭⳲꙀꙂꙄꙆꙈꙊꙌꙎꙐꙒꙔꙖꙘꙚꙜꙞꙠꙢꙤꙦꙨꙪꙬꚀꚂꚄꚆꚈꚊꚌꚎꚐꚒꚔꚖꚘꚚꜢꜤꜦꜨꜪꜬꜮꜲꜴꜶꜸꜺꜼꜾꝀꝂꝄꝆꝈꝊꝌꝎꝐꝒꝔꝖꝘꝚꝜꝞꝠꝢꝤꝦꝨꝪꝬꝮꝹꝻꝽꝾꞀꞂꞄꞆꞋꞍꞐꞒꞖꞘꞚꞜꞞꞠꞢꞤꞦꞨꞪꞫꞬꞭꞮꞰꞱꞲꞳꞴꞶꞸꞺꞼꞾꟀꟂꟄꟅꟆꟇꟉꟋꟌꟐꟖꟘꟚꟜꟵＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ',
               'æðøþđħĳŀłŋœŧɓƃƅɔƈɖɗƌǝəɛƒɠɣɩɨƙɯɲɵƣƥʀƨʃƭʈʊʋƴƶʒƹƽǆǆǉǉǌǌǥǳǳƕƿȝƞȣȥⱥȼƚⱦɂƀʉʌɇɉɋɍɏͱͳͷϳαβγδεζηθικλμνξοπρστυφχψωϗϙϛϝϟϡϣϥϧϩϫϭϯθϸϲϻͻͼͽђєѕіјљњћџабвгдежзиклмнопрстуфхцчшщъыьэюяѡѣѥѧѩѫѭѯѱѳѵѹѻѽѿҁҋҍҏґғҕҗҙқҝҟҡңҥҧҩҫҭүұҳҵҷҹһҽҿӏӄӆӈӊӌӎӕәӡөӷӻӽӿԁԃԅԇԉԋԍԏԑԓԕԗԙԛԝԟԡԣԥԧԩԫԭԯաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆⴀⴁⴂⴃⴄⴅⴆⴇⴈⴉⴊⴋⴌⴍⴎⴏⴐⴑⴒⴓⴔⴕⴖⴗⴘⴙⴚⴛⴜⴝⴞⴟⴠⴡⴢⴣⴤⴥⴧⴭꭰꭱꭲꭳꭴꭵꭶꭷꭸꭹꭺꭻꭼꭽꭾꭿꮀꮁꮂꮃꮄꮅꮆꮇꮈꮉꮊꮋꮌꮍꮎꮏꮐꮑꮒꮓꮔꮕꮖꮗꮘꮙꮚꮛꮜꮝꮞꮟꮠꮡꮢꮣꮤꮥꮦꮧꮨꮩꮪꮫꮬꮭꮮꮯꮰꮱꮲꮳꮴꮵꮶꮷꮸꮹꮺꮻꮼꮽꮾꮿᏸᏹᏺᏻᏼᏽᲊაბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰჱჲჳჴჵჶჷჸჹჺჽჾჿßỻỽỿⅎⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻⅼⅽⅾⅿↄⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⰰⰱⰲⰳⰴⰵⰶⰷⰸⰹⰺⰻⰼⰽⰾⰿⱀⱁⱂⱃⱄⱅⱆⱇⱈⱉⱊⱋⱌⱍⱎⱏⱐⱑⱒⱓⱔⱕⱖⱗⱘⱙⱚⱛⱜⱝⱞⱟⱡɫᵽɽⱨⱪⱬɑɱɐɒⱳⱶȿɀⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱⲳⲵⲷⲹⲻⲽⲿⳁⳃⳅⳇⳉⳋⳍⳏⳑⳓⳕⳗⳙⳛⳝⳟⳡⳣⳬⳮⳳꙁꙃꙅꙇꙉꙋꙍꙏꙑꙓꙕꙗꙙꙛꙝꙟꙡꙣꙥꙧꙩꙫꙭꚁꚃꚅꚇꚉꚋꚍꚏꚑꚓꚕꚗꚙꚛꜣꜥꜧꜩꜫꜭꜯꜳꜵꜷꜹꜻꜽꜿꝁꝃꝅꝇꝉꝋꝍꝏꝑꝓꝕꝗꝙꝛꝝꝟꝡꝣꝥꝧꝩꝫꝭꝯꝺꝼᵹꝿꞁꞃꞅꞇꞌɥꞑꞓꞗꞙꞛꞝꞟꞡꞣꞥꞧꞩɦɜɡɬɪʞʇʝꭓꞵꞷꞹꞻꞽꞿꟁꟃꞔʂᶎꟈꟊɤꟍꟑꟗꟙꟛƛꟶａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ')),
             '[\s\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+', ' ', 'g'),
           ' ')
$$;

revoke all on function public.normaliser_prenom(text) from public;
grant execute on function public.normaliser_prenom(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Les clés d'un prénom — ce que l'écran de connexion a le droit de demander
-- ---------------------------------------------------------------------------
-- Les clés de niveau sont celles de NIVEAUX dans la fonction Edge admin-eleve
-- et de la constante NIVEAU de chaque page : 'secondes', 'premiere',
-- 'terminale'. Un niveau inconnu est une erreur, pas une liste vide : la page
-- qui enverrait un mauvais nom doit le voir, pas conclure « prénom inconnu ».
create or replace function public.cles_de_connexion(niveau text, prenom text)
returns setof text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  t text;
  p text;
begin
  t := case niveau
         when 'secondes'  then 'eleves_2nde'
         when 'premiere'  then 'eleves_1ere'
         when 'terminale' then 'eleves'
       end;
  if t is null then
    raise exception 'niveau inconnu : %', niveau;
  end if;

  -- Un prénom vide après normalisation ne rend rien : sans ce garde, une
  -- table où un prénom serait vide rendrait sa clé à qui n'a rien tapé.
  p := public.normaliser_prenom(prenom);
  if p is null or p = '' then
    return;
  end if;

  -- « limit 5 » : deux homonymes dans une classe, c'est courant ; cinq, c'est
  -- déjà le signe d'autre chose. La page essaie le code sur chaque clé rendue.
  -- Jamais une clé VIDE : une ligne sans clé (créée à la main, jamais reliée)
  -- rendrait un « null » que la page transformerait en adresse « null@… ».
  return query execute format(
    'select e.cle from public.%I e
      where public.normaliser_prenom(e.prenom) = $1
        and e.cle is not null
      order by e.cle
      limit 5', t)
    using p;
end $$;

revoke all on function public.cles_de_connexion(text, text) from public;
grant execute on function public.cles_de_connexion(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. La liste des prénoms ne se lit plus sans être connecté
-- ---------------------------------------------------------------------------
do $$
declare
  el text;
  faits int := 0;
begin
  raise notice '';
  raise notice '=== CONNEXION SANS LA LISTE DES PRÉNOMS ===';

  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    -- Un niveau absent du projet est SIGNALÉ et sauté, jamais deviné : les
    -- trois pages partagent un seul projet, mais rien ne garantit que les
    -- trois jeux de tables y soient.
    if to_regclass('public.' || el) is null then
      raise notice '  % : table absente, ignorée', el;
      continue;
    end if;

    -- Même nom qu'en 001, « anon » en moins. REMPLACÉE, pas doublée.
    execute format('drop policy if exists p_%s_liste on public.%I', el, el);
    execute format('create policy p_%s_liste on public.%I for select to authenticated using (true)', el, el);

    faits := faits + 1;
    raise notice '  % : connexion sans liste', el;
  end loop;

  raise notice '';
  raise notice '% table(s) d''élèves fermée(s) aux visiteurs.', faits;
end $$;

-- ---------------------------------------------------------------------------
--  ÉCHEC BRUYANT SI UNE PIÈCE MANQUE
-- ---------------------------------------------------------------------------
--  Un fichier qui se termine sans rien dire laisse croire qu'il a travaillé.
--  Quatre choses doivent être vraies à la fois ; chacune manquante est nommée.
do $$
declare
  p record;
  el text;
  n int;
  definer bool;
  chemin text[];
  temoin text;
  ancien text;
begin
  -- 1. Plus aucune politique de LECTURE d'une table d'élèves ne nomme anon —
  --    ni « public », qui le contient. « for all » compte comme une lecture :
  --    c'est la forme des neuf politiques que la 002 retire, et si l'une
  --    d'elles était revenue par la console Supabase, la liste serait de
  --    nouveau ouverte quoi que dise p_<table>_liste.
  for p in
    select tablename, policyname, roles
      from pg_policies
     where schemaname = 'public'
       and tablename in ('eleves', 'eleves_1ere', 'eleves_2nde')
       and cmd in ('SELECT', 'ALL')
       and roles::text[] && array['anon', 'public']
     order by tablename, policyname
  loop
    raise exception 'la liste des prénoms reste lisible sans connexion : %.% (pour %) — jouez 002 si cette politique n''est pas à vous',
      p.tablename, p.policyname, array_to_string(p.roles::text[], '+');
  end loop;

  -- 2. Une seule politique de lecture par table : la nôtre. Une seconde posée
  --    à côté, même fermée, est une règle de trop qu'on ne relit jamais.
  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    if to_regclass('public.' || el) is null then continue; end if;
    select count(*) into n
      from pg_policies
     where schemaname = 'public' and tablename = el and cmd in ('SELECT', 'ALL');
    if n <> 1 then
      raise exception '% : % politique(s) de lecture au lieu d''une seule', el, n;
    end if;
  end loop;

  -- 3. La fonction existe, et elle lit SANS la RLS. Sans security definer,
  --    elle s'exécuterait comme le visiteur qui l'appelle — et ne rendrait
  --    plus rien, puisque la lecture vient de lui être fermée : l'écran de
  --    connexion répondrait « prénom inconnu » à toute la classe.
  select prosecdef, proconfig into definer, chemin
    from pg_proc
   where oid = to_regprocedure('public.cles_de_connexion(text, text)');
  if definer is null then
    raise exception 'la fonction public.cles_de_connexion(text, text) manque';
  end if;
  if not definer then
    raise exception 'public.cles_de_connexion n''est pas SECURITY DEFINER : elle ne rendrait rien à un visiteur';
  end if;
  if chemin is null or not exists (select 1 from unnest(chemin) c where c like 'search_path=%') then
    raise exception 'public.cles_de_connexion ne verrouille pas son search_path';
  end if;

  -- 4. Et le visiteur a le droit de l'appeler : c'est tout ce qu'il lui reste.
  if not has_function_privilege('anon', 'public.cles_de_connexion(text, text)', 'execute') then
    raise exception 'anon ne peut pas exécuter public.cles_de_connexion : la connexion serait impossible';
  end if;

  -- 5. Et elle RÉPOND au visiteur : l'attribut ne suffit pas, l'effet se
  --    mesure. SECURITY DEFINER ne traverse la RLS que si le PROPRIÉTAIRE de
  --    la fonction la traverse (propriétaire des tables, ou bypassrls) — sur
  --    un projet Supabase l'éditeur SQL tourne en « postgres », propriétaire
  --    des tables créées depuis le tableau de bord, mais on ne le suppose
  --    pas : on prend le rôle anon, on demande un prénom présent, et il faut
  --    une clé. Une table vide se DÉCLARE ; un rôle qu'on ne peut pas prendre
  --    aussi — ni l'un ni l'autre ne passe au vert en silence.
  foreach el in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    if to_regclass('public.' || el) is null then continue; end if;
    -- Un témoin que la fonction PEUT rendre : une ligne au prénom blanc mais
    -- à clé (créée à la main) se classerait première, et la fonction ne rend
    -- rien pour elle PAR CONCEPTION — le contrôle accuserait alors la RLS.
    execute format('select prenom from public.%I where cle is not null and public.normaliser_prenom(prenom) <> '''' order by prenom limit 1', el) into temoin;
    if temoin is null then
      raise notice '  % : aucun prénom exploitable, effet non mesuré', el;
      continue;
    end if;
    -- Seule la PRISE DE RÔLE est protégée : une erreur levée DANS la fonction
    -- (droit manquant, search_path cassé) doit faire échouer ce fichier, pas
    -- se faire passer pour « impossible de prendre le rôle ». Le rôle d'avant
    -- est rendu tel quel — « reset role » rendrait le rôle de SESSION, qui
    -- n'est pas forcément celui en vigueur.
    ancien := current_user;
    begin
      set local role anon;
    exception when insufficient_privilege then
      raise notice '  % : impossible de prendre le rôle anon ici, effet non mesuré', el;
      continue;
    end;
    select count(*) into n from public.cles_de_connexion(
      case el when 'eleves' then 'terminale' when 'eleves_1ere' then 'premiere' else 'secondes' end, temoin);
    execute format('set local role %I', ancien);
    if n = 0 then
      raise exception '% : la fonction ne rend rien à un visiteur pour un prénom pourtant présent (« % ») — le propriétaire de la fonction traverse-t-il la RLS ?', el, temoin;
    end if;
    raise notice '  % : un visiteur obtient bien la clé de « % »', el, temoin;
  end loop;

  raise notice 'La liste des prénoms ne se lit plus sans connexion ; cles_de_connexion répond au visiteur, et elle seule.';
end $$;

-- ---------------------------------------------------------------------------
--  ÉTAT OBTENU — à relire dans la sortie de l'éditeur SQL
-- ---------------------------------------------------------------------------
do $$
declare p record;
begin
  raise notice '';
  raise notice '=== POLITIQUES DES TABLES D''ÉLÈVES ===';
  for p in
    select tablename, policyname, cmd, roles
      from pg_policies
     where schemaname = 'public' and tablename in ('eleves', 'eleves_1ere', 'eleves_2nde')
     order by tablename, policyname
  loop
    raise notice '  %  %  (%, pour %)', rpad(p.tablename, 14), rpad(p.policyname, 28), p.cmd,
      array_to_string(p.roles::text[], '+');
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  LE CACHE DE SCHÉMA DE POSTGREST
-- ---------------------------------------------------------------------------
--  Une fonction qui vient d'être créée n'est appelable par rpc qu'une fois le
--  cache de schéma rechargé. Supabase s'en charge de lui-même (un déclencheur
--  d'événement envoie ce même signal après chaque DDL), mais pas à la
--  seconde ; sans auditeur — sur le PostgreSQL du banc — la ligne ne fait
--  rien, et elle est idempotente.
notify pgrst, 'reload schema';
