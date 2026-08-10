-- ============================================================================
--  001 — ANNULATION
-- ============================================================================
--  À n'exécuter que si la migration 001 a rendu le site inutilisable et qu'il
--  faut rouvrir l'accès tout de suite, en pleine classe.
--
--  CE QU'ELLE REND : l'accès. Le site refonctionne comme avant.
--  CE QU'ELLE NE REND PAS : les anciens codes des élèves. La colonne « pin »
--  est recréée VIDE — ses valeurs ont été supprimées par la migration, et rien
--  ici ne peut les inventer. Les comptes Supabase créés entre-temps, eux,
--  restent : les élèves qui ont déjà reçu leur nouveau code le gardent.
--
--  Autrement dit : annuler vous ramène à un site ouvert, avec des codes à
--  redistribuer de toute façon. Si vous en êtes là, mieux vaut presque toujours
--  corriger en avant plutôt qu'annuler.
--
--  Elle ne touche QUE ce que la migration 001 a créé : les politiques
--  préfixées « p_ », la table professeurs, la fonction est_prof(). Toute
--  politique que vous auriez écrite vous-même est laissée intacte.
-- ============================================================================

do $$
declare
  suffixe text;
  t text;
  p record;
begin
  foreach suffixe in array array['', '_1ere', '_2nde'] loop
    foreach t in array array['eleves' || suffixe, 'resultats' || suffixe, 'parametres' || suffixe] loop
      if to_regclass('public.' || t) is null then continue; end if;

      -- on ne retire que les politiques posées par 001
      for p in select policyname from pg_policies
               where schemaname = 'public' and tablename = t and policyname like 'p\_%' loop
        execute format('drop policy if exists %I on public.%I', p.policyname, t);
      end loop;

      execute format('alter table public.%I disable row level security', t);
      raise notice '  % rouverte', t;
    end loop;

    -- la colonne revient, mais vide : les codes d'avant n'existent plus
    if to_regclass('public.eleves' || suffixe) is not null then
      execute format('alter table public.%I add column if not exists pin text', 'eleves' || suffixe);
    end if;
  end loop;
end $$;

drop policy if exists p_professeurs_lecture on public.professeurs;
drop function if exists public.est_prof();
drop table if exists public.professeurs;

do $$ begin
  raise notice '';
  raise notice 'Annulation terminée. Le site est de nouveau ouvert.';
  raise notice 'ATTENTION : la colonne pin est VIDE — aucun élève ne peut se';
  raise notice 'connecter par l''ancien mécanisme tant que vous n''y avez pas';
  raise notice 'remis des codes.';
  raise notice '';
end $$;
