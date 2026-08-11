// ============================================================================
//  admin-eleve — les gestes du professeur qui demandent des droits
// ============================================================================
//  Depuis que les codes sont hachés par Supabase, le tableau de bord ne peut
//  plus ni les lire ni les écrire directement : changer le code d'un élève,
//  créer un compte pour lui ou le supprimer réclame la clé de service, qui ne
//  doit JAMAIS descendre dans un navigateur. Ces quatre gestes passent donc
//  par ici.
//
//  Toute demande est vérifiée deux fois :
//    1. le jeton de l'appelant identifie un compte Supabase réel ;
//    2. ce compte figure dans la table « professeurs ».
//  Un élève qui rejouerait la requête depuis sa console échoue à la seconde.
//
//  Le nom de table n'est jamais construit à partir de ce qu'envoie le client :
//  il est choisi dans une liste fermée. Un « niveau » inconnu est refusé.
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const NIVEAUX: Record<string, { eleves: string; resultats: string }> = {
  'secondes':  { eleves: 'eleves_2nde', resultats: 'resultats_2nde' },
  'premiere':  { eleves: 'eleves_1ere', resultats: 'resultats_1ere' },
  'terminale': { eleves: 'eleves',      resultats: 'resultats'      },
};

// Le domaine ne reçoit jamais de courriel : il ne sert qu'à donner à chaque
// élève un identifiant de compte stable, dérivé de son id. Il doit rester
// IDENTIQUE à celui des trois fichiers HTML (constante DOMAINE_COMPTES).
const DOMAINE = 'eleves.exercices-interactifs.invalid';

const ENTETES = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function repondre(corps: unknown, statut = 200){
  return new Response(JSON.stringify(corps), { status: statut, headers: ENTETES });
}

/* Un code tiré au sort, sans biais : Math.random() n'est pas fait pour ça, et
   le reste d'une division par 10000 ne tombe pas non plus uniformément. */
function codeAuHasard(): string {
  const t = new Uint32Array(1);
  let n: number;
  do { crypto.getRandomValues(t); n = t[0]; } while (n >= 4294960000);
  return String(n % 10000).padStart(4, '0');
}

Deno.serve(async (req) => {
  if(req.method === 'OPTIONS') return new Response('ok', { headers: ENTETES });

  // Supabase a deux générations de noms pour ces clés : les anciennes
  // (ANON / SERVICE_ROLE) et les nouvelles (PUBLISHABLE / SECRET). Un projet
  // récent peut n'injecter que les secondes. On accepte les deux plutôt que de
  // parier sur l'une : le mauvais pari se solderait par une fonction qui
  // échoue au premier appel, avec un message que rien ne relie à sa cause.
  const URL_SB  = Deno.env.get('SUPABASE_URL');
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
               ?? Deno.env.get('SUPABASE_SECRET_KEY');
  const ANON    = Deno.env.get('SUPABASE_ANON_KEY')
               ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

  if(!URL_SB || !SERVICE || !ANON){
    const manque = [!URL_SB && 'SUPABASE_URL',
                    !SERVICE && 'SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)',
                    !ANON && 'SUPABASE_ANON_KEY (ou SUPABASE_PUBLISHABLE_KEY)'].filter(Boolean);
    return repondre({ erreur: 'variables d’environnement absentes : ' + manque.join(', ') }, 500);
  }

  let corps: any;
  try { corps = await req.json(); }
  catch { return repondre({ erreur: 'requête illisible' }, 400); }

  const niveau = NIVEAUX[String(corps?.niveau ?? '')];
  if(!niveau) return repondre({ erreur: 'niveau inconnu' }, 400);

  // ---- 1. qui appelle ? -----------------------------------------------------
  const entete = req.headers.get('Authorization') ?? '';
  if(!entete.startsWith('Bearer ')) return repondre({ erreur: 'non connecté' }, 401);

  const commeAppelant = createClient(URL_SB, ANON, {
    global: { headers: { Authorization: entete } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: errUser } = await commeAppelant.auth.getUser();
  if(errUser || !user) return repondre({ erreur: 'non connecté' }, 401);

  // ---- 2. est-ce bien le professeur ? --------------------------------------
  const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });
  const { data: prof, error: errProf } = await admin
    .from('professeurs').select('user_id').eq('user_id', user.id).maybeSingle();
  // Supabase rend ses erreurs SANS lever d'exception : les ignorer ferait
  // passer une panne de lecture pour « ce n'est pas un professeur »… ou pire,
  // selon le sens du test. On les traite explicitement.
  if(errProf) return repondre({ erreur: 'vérification impossible' }, 500);
  if(!prof)   return repondre({ erreur: 'réservé au professeur' }, 403);

  const action = String(corps?.action ?? '');

  try {
    // ---- créer un compte pour un élève -------------------------------------
    if(action === 'ajouter'){
      const prenom = String(corps?.prenom ?? '').trim();
      if(!prenom) return repondre({ erreur: 'prénom vide' }, 400);

      const { data: deja, error: errDeja } = await admin
        .from(niveau.eleves).select('id').ilike('prenom', prenom);
      if(errDeja) return repondre({ erreur: 'vérification impossible' }, 500);
      if(deja && deja.length) return repondre({ erreur: 'ce prénom existe déjà' }, 409);

      // Une CLÉ, pas un identifiant de ligne : « id » est un uuid en Terminale
      // et en Seconde, mais un bigint en Première. Y écrire un uuid échouait
      // sur ce niveau-là. La base produit « id » elle-même.
      const cle = crypto.randomUUID();
      const code = codeAuHasard();
      const { data: compte, error: errCompte } = await admin.auth.admin.createUser({
        email: `${cle}@${DOMAINE}`,
        password: code,
        email_confirm: true,
      });
      if(errCompte || !compte?.user) return repondre({ erreur: 'création du compte impossible' }, 500);

      const { error: errLigne } = await admin.from(niveau.eleves)
        .insert({ prenom, cle, user_id: compte.user.id });
      if(errLigne){
        // sans ce rattrapage, un compte orphelin resterait et le prénom
        // deviendrait impossible à réutiliser
        await admin.auth.admin.deleteUser(compte.user.id);
        return repondre({ erreur: 'enregistrement impossible' }, 500);
      }
      return repondre({ prenom, code });
    }

    // ---- donner un nouveau code -------------------------------------------
    if(action === 'nouveau-code'){
      const id = String(corps?.eleveId ?? '');
      const { data: eleve, error: errEleve } = await admin
        .from(niveau.eleves).select('user_id, prenom').eq('id', id).maybeSingle();
      if(errEleve) return repondre({ erreur: 'lecture impossible' }, 500);
      if(!eleve)   return repondre({ erreur: 'élève introuvable' }, 404);
      if(!eleve.user_id) return repondre({ erreur: 'cet élève n’a pas encore de compte' }, 409);

      const code = codeAuHasard();
      const { error: errMaj } = await admin.auth.admin.updateUserById(eleve.user_id, { password: code });
      if(errMaj) return repondre({ erreur: 'changement de code impossible' }, 500);
      return repondre({ prenom: eleve.prenom, code });
    }

    // ---- retirer un élève --------------------------------------------------
    if(action === 'retirer'){
      const id = String(corps?.eleveId ?? '');
      const { data: eleve, error: errEleve } = await admin
        .from(niveau.eleves).select('user_id').eq('id', id).maybeSingle();
      if(errEleve) return repondre({ erreur: 'lecture impossible' }, 500);
      if(!eleve)   return repondre({ erreur: 'élève introuvable' }, 404);

      const { error: errSuppr } = await admin.from(niveau.eleves).delete().eq('id', id);
      if(errSuppr) return repondre({ erreur: 'suppression impossible' }, 500);
      if(eleve.user_id) await admin.auth.admin.deleteUser(eleve.user_id);
      return repondre({ ok: true });
    }

    // ---- tout effacer ------------------------------------------------------
    if(action === 'tout-effacer'){
      const { data: tous, error: errTous } = await admin.from(niveau.eleves).select('id, user_id');
      if(errTous) return repondre({ erreur: 'lecture impossible' }, 500);

      const { error: errNotes } = await admin.from(niveau.resultats)
        .delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if(errNotes) return repondre({ erreur: 'suppression des notes impossible' }, 500);

      const { error: errEleves } = await admin.from(niveau.eleves)
        .delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if(errEleves) return repondre({ erreur: 'suppression des élèves impossible' }, 500);

      for(const e of tous ?? []){
        if(e.user_id) await admin.auth.admin.deleteUser(e.user_id);
      }
      return repondre({ ok: true, n: (tous ?? []).length });
    }

    return repondre({ erreur: 'action inconnue' }, 400);
  } catch (e) {
    return repondre({ erreur: String((e as Error)?.message ?? e) }, 500);
  }
});
