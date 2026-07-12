const CACHE_NAME = 'nexchat-pwa-v3-matrix';

// Fallback core assets list for safe startup velocity
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 PWA Core Cache Shell Opened Safely');
      // Using individually mapped elements to prevent structural addAll crashes if an asset is missing
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => {
          return cache.add(asset).catch(err => console.log(`Cache bypass logged for: ${asset}`, err));
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});