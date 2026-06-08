const CACHE_NAME = 'pixel-jump-v3.70';

// CRITICAL: Strategy "Network First" for logic
// We always try to get the latest version from the server.
// Only if offline do we use the cache.
const CRITICAL_URLS = [
    './',
    'index.html',
    'main.v3.js',
    'engine.v3.js',
    'audio.js',
    'biomes.js',
    'character-ui.js',
    'characters.js',
    'challenges.js',
    'cloud-sync.js',
    'daily-challenge.js',
    'device-utils.js',
    'firebase-config.js',
    'genesis-skins.js',
    'ghost.js',
    'i18n.js',
    'leaderboard.js',
    'perks.js',
    'settings-skins.js',
    'skin-effects.js',
    'telegram.js',
    'tutorial.js',
    'manifest.json',
    'style.css' // CSS is also critical for UI fixes
];


// Strategy "Stale While Revalidate" for assets
// Load from cache instantly, then update in background.
const ASSET_PATTERNS = [
    '/assets/images/',
    '/assets/audio/',
    '/fonts/'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    self.skipWaiting(); // Activate immediately

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching critical files');
            // We use 'no-cache' to ensure we get fresh versions on install
            const cachePromises = CRITICAL_URLS.map(url => {
                return fetch(url, { cache: 'no-cache' })
                    .then(response => {
                        if (response.ok) {
                            return cache.put(url, response);
                        }
                    })
                    .catch(e => console.warn(`Failed to precache ${url}`, e));
            });
            return Promise.all(cachePromises);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase/Firestore/Analytics requests
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // 1. IS IT A CRITICAL FILE? -> NETWORK FIRST
    const isCritical = CRITICAL_URLS.some(u => {
        const cleanU = u.replace(/^\.\//, ''); // remove leading './'
        if (cleanU === '' || cleanU === '/') {
            return url.pathname === '/' || url.pathname.endsWith('/');
        }
        return url.pathname.endsWith(cleanU);
    });

    if (isCritical) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Update cache with fresh version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Network failed, return cached version
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 2. IS IT AN ASSET? -> STALE WHILE REVALIDATE
    const isAsset = ASSET_PATTERNS.some(p => url.pathname.includes(p));

    if (isAsset) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    // Return cached response if found
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        // Update cache in background
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });

                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Default: Network First
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
