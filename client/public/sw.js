const CACHE_NAME = 'nexchat-v1-cache-matrix';

// Core assets to cache for absolute offline startup velocity
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/globals.css',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation Phase — Cache static ecosystem shells instantly
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 PWA Core Cache Shell Opened Successfully');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activation Phase — Wipe old legacy data cache blocks
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Wiping legacy obsolete cache segment:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept Fetch Requests — Serve from cache if offline, otherwise query network pipeline
self.addEventListener('fetch', (event) => {
  // Bypass non-GET assets like file uploads or standard POST API streams
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Return clean asset from local storage storage cache
      }

      return fetch(event.request).then((networkResponse) => {
        // Validation check to verify safe responses before capturing cache blocks
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Absolute fallback offline block matrix if both fail
        return caches.match('/');
      });
    })
  );
});

// Web Push Notification Event Listener System
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'NexChat Messenger', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Block encryption transmission received.',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open Chat Window' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'NexChat', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});