/* ============================================================================
   FAUX SUPABASE — la base de données des tests de navigateur
   ============================================================================
   Ce fichier est injecté dans la page À LA PLACE de supabase-js. Aucun test
   n'atteint donc le vrai projet : ni lecture des comptes réels, ni écriture de
   notes fantômes dans la progression des élèves.

   Il tient les lignes en mémoire et journalise chaque opération, ce qui permet
   aux contrôles d'affirmer des choses précises : « une seule insertion », « la
   durée envoyée est un entier », « le brouillon n'a pas été supprimé ».

   Poser window.__faux.panne = true fait échouer toutes les écritures suivantes,
   comme le ferait une coupure réseau ou un refus de la base — c'est ainsi qu'on
   vérifie que l'application le dit à l'élève au lieu de l'assurer du contraire.

   Le texte de ce fichier est envoyé tel quel au navigateur : il doit rester du
   JavaScript autonome, sans require ni export.
   ========================================================================== */
window.__faux = {
  tables: {},
  journal: [],
  panne: false,
  suivant: 1,
  /* Les comptes tiennent le rôle de auth.users : c'est là que vivent les codes
     depuis qu'ils ont quitté la table des élèves. Le double les compare
     lui-même, comme le ferait Supabase — un mauvais code doit être refusé ICI,
     pas dans la page. */
  comptes: {},
  session: null,
  lignes(nom){ return this.tables[nom] || (this.tables[nom] = []); },
  semer(nom, lignes){ this.tables[nom] = lignes.map(l => Object.assign({}, l)); },
  semerCompte(courriel, motDePasse, userId, meta){
    const id = userId || ('compte-' + (this.suivant++));
    this.comptes[courriel] = { motDePasse: String(motDePasse), userId: id,
                               app_metadata: meta || {} };
    return id;
  },
  operations(op, table){
    return this.journal.filter(e => (!op || e.op === op) && (!table || e.table === table));
  },
};

window.supabase = {
  createClient(){
    const F = window.__faux;

    function colonnesDe(demandees){
      return (demandees && String(demandees).trim() !== '*')
        ? String(demandees).split(',').map(c => c.trim()).filter(Boolean) : null;
    }

    function requete(nom, op, charge, colonnes){
      const etat = { filtres: [], unique: false, tolereVide: false, tri: null,
                     colonnes: colonnesDe(colonnes) };

      function correspond(ligne){
        return etat.filtres.every(([type, col, val]) => {
          if(type === 'ilike') return String(ligne[col] == null ? '' : ligne[col]).toLowerCase() === String(val).toLowerCase();
          if(type === 'neq')   return ligne[col] !== val;
          return ligne[col] === val;
        });
      }

      function executer(){
        if(F.panne && op !== 'select'){
          F.journal.push({ op, table: nom, echec: true });
          return { data: null, error: { message: 'panne simulée' } };
        }
        const lignes = F.lignes(nom);
        if(op === 'upsert'){                           /* remplace la ligne de même id, ne l'empile pas */
          const donnees = Array.isArray(charge) ? charge : [charge];
          const posees = donnees.map(p => {
            const existante = p.id != null && lignes.find(l => l.id === p.id);
            if(existante){ Object.assign(existante, p); return existante; }
            const neuve = Object.assign({ id: 'ligne-' + (F.suivant++), created_at: new Date().toISOString() }, p);
            lignes.push(neuve); return neuve;
          });
          F.journal.push({ op: 'upsert', table: nom, lignes: posees });
          return { data: etat.unique ? posees[0] : posees, error: null };
        }
        if(op === 'insert'){
          const ajoutees = (Array.isArray(charge) ? charge : [charge]).map(p =>
            Object.assign({ id: 'ligne-' + (F.suivant++), created_at: new Date().toISOString() }, p));
          lignes.push.apply(lignes, ajoutees);
          F.journal.push({ op: 'insert', table: nom, lignes: ajoutees });
          return { data: etat.unique ? ajoutees[0] : ajoutees, error: null };
        }
        if(op === 'update'){
          const touchees = lignes.filter(correspond);
          touchees.forEach(l => Object.assign(l, charge));
          F.journal.push({ op: 'update', table: nom, n: touchees.length });
          return { data: touchees, error: null };
        }
        if(op === 'delete'){
          const gardees = lignes.filter(l => !correspond(l));
          F.journal.push({ op: 'delete', table: nom, n: lignes.length - gardees.length });
          F.tables[nom] = gardees;
          return { data: null, error: null };
        }
        /* Le vrai PostgREST ne rend que les colonnes demandées. Le double le
           fait aussi, sans quoi un select('id,prenom') et un select('*')
           seraient indiscernables au banc — et la fuite des codes n'aurait
           laissé aucune trace observable. */
        let trouvees = lignes.filter(correspond).map(l => {
          if(!etat.colonnes) return Object.assign({}, l);
          const projetee = {};
          etat.colonnes.forEach(c => { projetee[c] = l[c]; });
          return projetee;
        });
        if(etat.tri){                                  /* supabase-js trie vraiment : le double aussi */
          const [col, croissant] = etat.tri;
          trouvees.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (croissant ? 1 : -1));
        }
        if(etat.unique && !etat.tolereVide && trouvees.length === 0){   /* .single() sans ligne EST une erreur côté Supabase ; .maybeSingle() non */
          return { data: null, error: { message: 'aucune ligne', code: 'PGRST116' } };
        }
        F.journal.push({ op: 'select', table: nom, n: trouvees.length,
                         colonnes: etat.colonnes ? etat.colonnes.join(',') : '*' });
        return { data: etat.unique ? (trouvees[0] || null) : trouvees, error: null };
      }

      const b = {
        select(colonnes){ etat.colonnes = colonnesDe(colonnes); return b; },
        eq(c, v){ etat.filtres.push(['eq', c, v]); return b; },
        neq(c, v){ etat.filtres.push(['neq', c, v]); return b; },
        ilike(c, v){ etat.filtres.push(['ilike', c, v]); return b; },
        order(col, opts){ etat.tri = [col, !opts || opts.ascending !== false]; return b; },
        limit(){ return b; },
        single(){ etat.unique = true; return b; },
        maybeSingle(){ etat.unique = true; etat.tolereVide = true; return b; },
        then(ok, ko){ return Promise.resolve().then(executer).then(ok, ko); },
        catch(ko){ return this.then(undefined, ko); },
      };
      return b;
    }

    return {
      from(nom){
        return {
          /* La liste des colonnes arrive sur CE select-là, pas sur celui du
             constructeur de requête : from(x).select('id,prenom'). La première
             version de ce double la jetait, et rendait la ligne entière. */
          select(colonnes){ return requete(nom, 'select', undefined, colonnes); },
          insert(charge){ return requete(nom, 'insert', charge); },
          update(charge){ return requete(nom, 'update', charge); },
          delete(){ return requete(nom, 'delete'); },
          upsert(charge){ return requete(nom, 'upsert', charge); },
        };
      },
      /* auth reproduit ce que fait Supabase : il détient les codes, il les
         compare, et il est le seul à pouvoir le faire. La page, elle, ne peut
         plus que lui demander son avis. */
      auth: {
        signInWithPassword(id){
          const courriel = id && id.email, mdp = id && id.password;
          const c = F.comptes[courriel];
          const ok = !!c && c.motDePasse === String(mdp);
          F.journal.push({ op: 'signIn', table: 'auth', courriel: courriel, ok: ok });
          if(!ok) return Promise.resolve({ data: { user: null, session: null },
                                           error: { message: 'Invalid login credentials' } });
          F.session = { user: { id: c.userId, email: courriel,
                                app_metadata: c.app_metadata || {} } };
          return Promise.resolve({ data: { user: F.session.user, session: F.session }, error: null });
        },
        signUp(id){
          const courriel = id && id.email, mdp = id && id.password;
          if(F.comptes[courriel]){
            F.journal.push({ op: 'signUp', table: 'auth', courriel: courriel, ok: false });
            return Promise.resolve({ data: { user: null, session: null },
                                     error: { message: 'User already registered' } });
          }
          const userId = F.semerCompte(courriel, mdp);
          F.journal.push({ op: 'signUp', table: 'auth', courriel: courriel, ok: true });
          F.session = { user: { id: userId, email: courriel, app_metadata: {} } };
          return Promise.resolve({ data: { user: F.session.user, session: F.session }, error: null });
        },
        /* Un compte connecté change SON mot de passe, et rien d'autre : le
           double refuse hors session, comme le ferait Supabase. */
        updateUser(attrs){
          if(!F.session){
            F.journal.push({ op: 'updateUser', table: 'auth', ok: false });
            return Promise.resolve({ data: { user: null }, error: { message: 'Auth session missing!' } });
          }
          const courriel = F.session.user.email;
          if(attrs && attrs.password) F.comptes[courriel].motDePasse = String(attrs.password);
          F.journal.push({ op: 'updateUser', table: 'auth', courriel: courriel, ok: true });
          return Promise.resolve({ data: { user: F.session.user }, error: null });
        },
        signOut(){
          F.journal.push({ op: 'signOut', table: 'auth' });
          F.session = null;
          return Promise.resolve({ error: null });
        },
        getUser(){ return Promise.resolve({ data: { user: F.session ? F.session.user : null }, error: null }); },
        getSession(){ return Promise.resolve({ data: { session: F.session }, error: null }); },
      },
      functions: {
        invoke(nom, opts){
          const action = opts && opts.body && opts.body.action;
          F.journal.push({ op: 'invoke', table: nom, action: action });
          if(action === 'code-choisi'){
            /* le service retire le marqueur du compte connecté, et de lui seul */
            if(F.session){
              const c = F.comptes[F.session.user.email];
              if(c){ c.app_metadata = Object.assign({}, c.app_metadata, { code_provisoire: false }); }
              F.session.user.app_metadata = Object.assign({}, F.session.user.app_metadata, { code_provisoire: false });
            }
            return Promise.resolve({ data: { ok: true }, error: null });
          }
          if(action === 'verif') return Promise.resolve({ data: { correct: false, feedback: 'Réponse de contrôle.' }, error: null });
          return Promise.resolve({ data: { feedback: 'Indice de contrôle.' }, error: null });
        },
      },
    };
  },
};
