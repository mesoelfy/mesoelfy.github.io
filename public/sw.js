const CACHE_NAME = 'mesoelfy-os-cache-v3';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/assets/images/social-card.jpg',
  '/assets/audio/music/mesoelfy_os/01 - 004_16 - Aerlind (Cover) - Acid Techno, DnB, atmospheric pads.mp3'
];

self.addEventListener('install', (event) => {
  // Force this SW to become the "waiting" worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  // Force this SW to become the "active" worker immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('// SW: PURGING OLD CACHE', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  // STRATEGY: Network First for HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // STRATEGY: Cache First for Assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
