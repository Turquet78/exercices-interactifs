/* ============================================================================
   sw.js — le service worker des trois pages, TABLETTES SEULEMENT.

   Il est enregistré par manifesteTablette(), dans la page, sous la même garde
   que le manifeste (écran tactile) : sur ordinateur il n'existe pas.

   POURQUOI IL EXISTE — ET POUR RIEN D'AUTRE
   Chrome n'INSTALLE une page comme une application (« Installer l'appli »,
   qui s'ouvre sans barre d'adresse) que si elle satisfait ses critères ;
   sinon « Ajouter à l'écran d'accueil » ne pose qu'un simple RACCOURCI qui
   rouvre le navigateur avec sa barre — c'est ce que la tablette de Turquet a
   proposé (septembre 2026) avec un manifeste que Chromium lui-même déclarait
   sans défaut. Jusqu'à Chrome 108 sur Android, un de ces critères est un
   service worker qui répond à fetch, y compris HORS CONNEXION ; les versions
   plus récentes s'en passent, mais la tablette d'un élève n'est pas
   forcément à jour, et rien ne dit à l'écran lequel des critères manque.

   CE QU'IL NE FAIT PAS : IL NE MET RIEN EN CACHE.
   `main` publie immédiatement (règle 1 de CLAUDE.md) : un cache servirait
   une vieille version de la page après une mise en ligne, sans que rien ne
   le dise. Toute requête ordinaire passe au navigateur sans intermédiaire
   (aucun respondWith) ; seule une NAVIGATION est relayée, et si le réseau
   la refuse, l'élève reçoit une page qui le dit au lieu de l'erreur brute
   du navigateur. Un contrôle refuse qu’une API de cache y revienne.
   ============================================================================ */
const SW_VERSION = 1;

const HORS_CONNEXION = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<title>Pas de connexion</title>'
  + '<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F8FC;color:#1E2A4A;text-align:center;padding:24px}'
  + 'h1{font-size:1.6rem;margin:0 0 12px}p{margin:0 0 20px;font-size:1.1rem}'
  + 'button{font:inherit;font-size:1.1rem;padding:12px 24px;border:0;border-radius:12px;background:#2B50C8;color:#fff}</style></head>'
  + '<body><div><h1>Pas de connexion</h1><p>Les exercices ont besoin d’Internet.<br>Vérifie le wifi, puis réessaie.</p>'
  + '<button onclick="location.reload()">Réessayer</button></div></body></html>';

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function(e){
  if(e.request.mode !== 'navigate') return;      /* scripts, images, base : le navigateur, sans intermédiaire */
  e.respondWith(fetch(e.request).catch(function(){
    return new Response(HORS_CONNEXION, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }));
});
