import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url, request }) => {
    return request.destination === 'document' ||
           request.destination === 'style' ||
           request.destination === 'script' ||
           request.destination === 'image';
  },
  new CacheFirst({
    cacheName: 'app-static-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.hostname === 'story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'story-api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({ request, url }) => url.hostname === 'story-api.dicoding.dev' && request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://unpkg.com',
  new CacheFirst({
    cacheName: 'unpkg-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received!');
  const data = event.data.json();
  const title = data.title || 'Story App Notification';
  const options = {
    body: data.options.body || 'You have a new notification.',
    icon: '/story-app/favicon.png',
    badge: '/story-app/favicon.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/story-app/#/')
  );
});