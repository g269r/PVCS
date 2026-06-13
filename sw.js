/* ============================================================
   Service Worker – PVCS DMS PWA
   Full offline support with cache-first strategy
   ============================================================ */

const CACHE_NAME = 'pvcs-dms-v1';
const CDN_CACHE = 'pvcs-cdn-v1';

// Core app assets to cache
const APP_ASSETS = [
  './',
  './index.html',
  './tools/generate-bylaws-pdf.html',
  './css/style.css',
  './js/db.js',
  './js/utils.js',
  './js/recipients.js',
  './js/refnum.js',
  './js/templates.js',
  './js/pdf-export.js',
  './js/docx-export.js',
  './js/bylaws.js',
  './js/ai-drafter.js',
  './js/app.js',
  './js/sw-register.js',
  './js/pages/dashboard.js',
  './js/pages/create-letter.js',
  './js/pages/archive.js',
  './js/pages/templates-page.js',
  './js/pages/bylaws-page.js',
  './js/pages/backup.js',
  './js/pages/settings.js',
  './manifest.json',
];

// CDN libraries to cache
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/fuse.js/7.0.0/fuse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.9/lunr.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/docx/8.2.3/docx.umd.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(APP_ASSETS).catch(err => {
          console.warn('[SW] Some app assets failed to cache:', err);
        });
      }),
      caches.open(CDN_CACHE).then(cache => {
        return Promise.allSettled(
          CDN_ASSETS.map(url => cache.add(url).catch(e => console.warn('[SW] CDN cache miss:', url)))
        );
      }),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== CDN_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CDN: cache-first
  if (url.host.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.open(CDN_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // App assets: network-first with cache fallback
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => {
            if (cached) return cached;
            // Return app shell for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          })
        )
    );
  }
});
