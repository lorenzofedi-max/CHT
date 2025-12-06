
const CACHE_NAME = 'cupra-hybrid-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Attivazione e pulizia vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercettazione richieste di rete
self.addEventListener('fetch', (event) => {
  // Per le chiamate API o esterne, usa la rete. Per i file statici, usa la cache prima.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se è in cache, restituiscilo, ma aggiorna la cache in background (Stale-while-revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Aggiorna la cache solo se la richiesta è valida
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se siamo offline e non c'è rete, non fare nulla (il cachedResponse verrà restituito)
      });

      return cachedResponse || fetchPromise;
    })
  );
});
