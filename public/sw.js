const CACHE_NAME = 'mesoelfy-os-cache-v1';

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
  // Clean up old caches
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

// Cache First, Network Fallback Strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like YouTube)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new resources dynamically (except heavy media if preferred)
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
