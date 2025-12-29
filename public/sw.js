const CACHE_NAME = 'mesoelfy-os-cache-v2';

// Assets to cache immediately
const PRECACHE_URLS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/assets/images/social-card.jpg',
  '/assets/audio/music/mesoelfy_os/01 - 004_16 - Aerlind (Cover) - Acid Techno, DnB, atmospheric pads.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('// SW: CLEARING OLD CACHE', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  // STRATEGY 1: Network First (Navigation/HTML)
  // Ensures we always get the latest build (latest commit hash)
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
          return caches.match(event.request); // Offline fallback
        })
    );
    return;
  }

  // STRATEGY 2: Cache First (Static Assets - JS, CSS, Images, Audio)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
