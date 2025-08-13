
// public/sw.js

// Using a new cache name to ensure the new service worker's caches are used.
const CACHE_NAME = 'digital-binder-pro-cache-v3';
// Essential files for the app shell to work offline.
// We remove '/index.tsx' as it's a source file not directly fetched by the browser as an asset.
// The fetch handler will cache the resulting JS bundle when it's requested by index.html.
const URLS_TO_CACHE = [
  '/', // The root path, often serves index.html
  '/index.html',
];

// --- Lifecycle Listeners ---

// Install the service worker and cache the app shell.
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // addAll() is atomic - if one file fails, the whole operation fails.
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate the service worker and clean up old caches.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  // Remove any caches that are not the current version.
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open pages without requiring a reload.
      return self.clients.claim();
    })
  );
});

// --- Fetch Listener ---

// Intercept network requests and serve from cache if available.
// This uses a "Cache falling back to Network" strategy.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests and ignore others (e.g., POST) and browser extensions.
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
        // If we have a cached response, return it.
        if (cachedResponse) {
            return cachedResponse;
        }

        // If not, fetch from the network.
        return fetch(event.request).then(networkResponse => {
            // A response must be consumed only once.
            // We need to clone it to put it in the cache and to return it to the browser.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME).then(cache => {
                // We only cache successful responses.
                if (networkResponse.status === 200) {
                    cache.put(event.request, responseToCache);
                }
            });

            return networkResponse;
        }).catch(error => {
            // This will be triggered if the network is unavailable.
            // Here you could return a fallback offline page if you have one cached.
            console.error('Fetch failed; returning offline fallback if available.', error);
        });
    })
  );
});


// --- Push Notification Listeners ---

self.addEventListener('push', event => {
  let data = { title: 'New Notification', body: 'You have an update.', url: '/' };
  try {
    if (event.data) {
        data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const title = data.title;
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge72.png',
    data: {
      url: data.url,
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If a window for the app is already open, focus it.
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
