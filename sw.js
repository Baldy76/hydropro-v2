const CACHE_NAME = 'hydro-pro-v59-1';
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
    self.skipWaiting(); 
});

// 2. ACTIVATE: Delete old versions of the app when a new one is downloaded
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
    self.clients.claim(); 
});

// 3. FETCH: Run the app offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
