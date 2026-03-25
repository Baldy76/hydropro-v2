const CACHE_NAME = 'hydro-pro-v59';
const ASSETS = [
    './index.html',
    './styles.css',
    './app.js',
    './Logo.png',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. INSTALL: Save all files to the phone's hard drive
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting(); // Forces the browser to activate the new version immediately
});

// 2. ACTIVATE: The "Trash Can" - Delete old versions of the app when a new one is downloaded
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of all open app windows immediately
});

// 3. FETCH: How the app runs offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Return the cached version if we have it, otherwise fetch from the internet
            return response || fetch(event.request);
        })
    );
});
