// Service Worker: Caching strategy for third-party resources
// Cache terceros (Google Ads, Cloudflare Analytics) con TTL de 14 días

const CACHE_NAME = 'c0digos-v1';
const THIRD_PARTY_CACHE = 'third-party-v1';
const CACHE_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 días en ms

const CACHE_URLS = [
  'https://pagead2.googlesyndication.com/',
  'https://static.cloudflareinsights.com/'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== THIRD_PARTY_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Estrategia cache-first para terceros, network-first para propios
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Para recursos de terceros: cache-first con TTL
  if (url.hostname === 'pagead2.googlesyndication.com' || 
      url.hostname === 'static.cloudflareinsights.com' ||
      url.hostname === 'googleads.g.doubleclick.net') {
    
    event.respondWith(
      caches.open(THIRD_PARTY_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          // Si está en caché y no ha expirado, devolver
          if (response) {
            const cachedTime = response.headers.get('x-cache-time');
            if (cachedTime) {
              const age = Date.now() - parseInt(cachedTime);
              if (age < CACHE_DURATION) {
                return response;
              }
            } else {
              // Sin timestamp: devolver como válido (fallback)
              return response;
            }
          }

          // Si no está en caché o expiró, hacer fetch
          return fetch(request)
            .then((networkResponse) => {
              // Clonar y agregar timestamp.
              if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                const responseClone = networkResponse.clone();
                const headers = new Headers();
                headers.set('x-cache-time', Date.now().toString());

                const cachedResponse = new Response(responseClone.body, {
                  status: responseClone.status,
                  statusText: responseClone.statusText,
                  headers: headers
                });

                cache.put(request, cachedResponse);
              }
              return networkResponse;
            })
            .catch(() => {
              // Si falla: devolver del caché aunque esté expirado
              return cache.match(request) || new Response('Service unavailable', { status: 503 });
            });
        });
      })
    );
    return;
  }

  // Para recursos propios: network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        return caches.match(request) || new Response('Offline', { status: 503 });
      })
  );
});
