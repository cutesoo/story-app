const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

const CACHE_NAME = 'story-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png',
  '/styles/styles.css',
  '/app.bundle.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and Caching App Shell');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('Failed to cache during install:', error))
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          console.log('Service Worker: Deleting old cache', cacheName);
          return caches.delete(cacheName);
        }
        return null;
      }),
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (urlsToCache.includes(requestUrl.pathname) || requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  if (requestUrl.hostname === 'story-api.dicoding.dev') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          const responseClone = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, responseClone);
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          return cachedResponse || new Response('Offline and no cached data available.', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || new Response('Offline and no cached content available.', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received!');
  const data = event.data.json();
  const title = data.title || 'Story App Notification';
  const options = {
    body: data.options.body || 'You have a new notification.',
    icon: '/favicon.png',
    badge: '/favicon.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}