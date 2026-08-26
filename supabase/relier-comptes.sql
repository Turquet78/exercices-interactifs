-- ============================================================================
--  RELIER LES ÉLÈVES À LEUR COMPTE SUPABASE (colonne user_id)
-- ============================================================================
--  À COLLER DANS L'ÉDITEUR SQL DE SUPABASE. Il est IDEMPOTENT : le relancer
--  ne trouve plus rien.
--
--  POURQUOI CE FICHIER EXISTE
--
--  Un élève de Terminale a cliqué « Le faire sur papier » et la page a affiché
--  « new row violates row-level security policy for table "signalements" »
--  (signalé par Turquet sur une capture, août 2026). La politique d'écriture
--  exige que la ligne de l'élève soit RELIÉE à son compte Supabase :
--  eleves.user_id = auth.uid(). Or cette colonne peut être VIDE pendant que la
--  connexion, elle, marche parfaitement — l'élève tape son code, Supabase le
--  reconnaît, et rien ne dit que sa ligne n'est plus rattachée à rien.
--
--  COMMENT UNE LIGNE SE DÉ-RELIE
--
--  · La restauration d'une sauvegarde remet user_id à VIDE, volontairement :
--    elle ne peut pas savoir si le compte d'avant le sinistre existe encore,
--    et une ligne rattachée à un compte fantôme serait pire (voir
--    restaurer.sql). Mais quand les comptes ont SURVÉCU — ils vivent dans
--    auth.users, que la restauration ne touche pas —, l'élève continue de se
--    connecter avec son code pendant que sa ligne reste orpheline.
--  · Les lignes d'avant la bascule des comptes : la migration 001 a ajouté la
--    colonne, vide.
--
--  CE QUE ÇA CASSE : tout ce que la RLS accorde « à l'élève de cette ligne » —
--  déposer un signalement, envoyer un devoir sur papier, enregistrer une note,
--  poser ou lever une pause. Et le refus des notes est MUET côté base : c'est
--  le piège documenté de la suppression refusée, en pire.
--
--  CE QUE FAIT CE FICHIER : l'adresse du compte d'un élève est DÉRIVÉE de sa
--  clé — cle || '@' || domaine — donc le lien se recalcule. Pour chaque ligne
--  sans user_id dont le compte existe encore dans auth.users, il remet le
--  lien. Il ne touche NI aux codes, NI aux comptes, NI aux lignes déjà
--  reliées. Les élèves dont le compte n'existe plus sont LISTÉS à la fin :
--  pour eux, un seul chemin — « Nouveau code » dans le tableau du professeur,
--  qui recrée le compte et pose le lien (l'élève reçoit un code provisoire).
--
--  Le domaine ci-dessous doit être LE MÊME que DOMAINE_COMPTES dans les trois
--  pages et dans admin-eleve : un contrôle de `npm test` les compare.
-- ============================================================================

do $$
declare
  dom constant text := 'eleves.exercices-interactifs.invalid';
  t text; n_total int; n_orphelins int; n_relies int; restant record;
begin
  raise notice '';
  raise notice '=== RELIER LES COMPTES ===';
  foreach t in array array['eleves', 'eleves_1ere', 'eleves_2nde'] loop
    if to_regclass('public.' || t) is null then
      raise notice '  % : table absente du projet', t;
      continue;
    end if;
    execute format('select count(*), count(*) filter (where user_id is null) from public.%I', t)
      into n_total, n_orphelins;

    /* Le lien se recalcule par l'adresse dérivée de la clé. Le garde-fou
       « aucun autre élève ne tient déjà ce compte » protège la contrainte
       UNIQUE de user_id : un conflit se saute au lieu de tout arrêter. */
    execute format($q$
      update public.%I e set user_id = u.id
        from auth.users u
       where e.user_id is null
         and e.cle is not null
         and u.email = e.cle || '@' || %L
         and not exists (select 1 from public.%I x where x.user_id = u.id)
    $q$, t, dom, t);
    get diagnostics n_relies = row_count;

    raise notice '  %  % élève(s), % sans lien, % relié(s) par ce script',
      rpad(t, 14), n_total, n_orphelins, n_relies;

    /* Ceux qui restent : leur compte n'existe plus, « Nouveau code » est le
       seul chemin. Les nommer ici vaut mieux qu'un chiffre — c'est le
       professeur qui lit cette sortie, sur son propre projet. */
    for restant in execute format(
      'select prenom from public.%I where user_id is null order by prenom', t)
    loop
      raise notice '      encore sans lien : %  (donner un « Nouveau code »)', restant.prenom;
    end loop;
  end loop;
  raise notice '';
end $$;
