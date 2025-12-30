// Service Worker para PWA - Gestão de Pré-Natal Mais Mulher
const CACHE_NAME = 'mais-mulher-pwa-v1';
const RUNTIME_CACHE = 'mais-mulher-runtime-v1';

// Arquivos essenciais para cache inicial
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo-horizontal.png',
  '/logo-vertical.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        console.log('[SW] Deleting old cache:', cacheToDelete);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Network First com fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de API (tRPC) - sempre buscar da rede
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // Cachear resposta bem-sucedida
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar buscar do cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não houver cache, retornar página offline
            return caches.match('/index.html');
          });
        });
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
