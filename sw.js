/* =========================================================
   SERVICE WORKER — Procurement Information System
   Senaka Group
   ========================================================= */

const CACHE_NAME   = 'pis-senaka-v1.2';
const OFFLINE_URL  = 'offline.html';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap',
];

/* ── Install: pre-cache static assets ── */
self.addEventListener('install', event => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: purge old caches ── */
self.addEventListener('activate', event => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: network-first for API, cache-first for assets ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Apps Script API calls — network only, no caching
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(
          JSON.stringify({ status: 'error', message: 'You are offline. Please retry when connected.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // Google Fonts — cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }))
    );
    return;
  }

  // App shell — cache-first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            // Cache successful GET responses
            if (event.request.method === 'GET' && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // For navigation requests, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

/* ── Background Sync (queued submissions) ── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tender-submissions') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncQueuedSubmissions());
  }
});

async function syncQueuedSubmissions() {
  // Trigger the client to retry queued submissions
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_QUEUE' });
  });
}

/* ── Push Notifications ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body:    data.body || 'New tender notice alert',
    icon:    './icons/icon-192.png',
    badge:   './icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag:     'tender-alert',
    renotify: true,
    data:    { url: data.url || './' },
    actions: [
      { action: 'view',   title: '👁 View',   icon: './icons/icon-72.png' },
      { action: 'dismiss',title: '✕ Dismiss', icon: './icons/icon-72.png' },
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Senaka Group – PIS', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
