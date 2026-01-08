// ============================================================
// =================== Service Worker - لعبة كوبو ==============
// ============================================================

const CACHE_NAME = 'kobo-game-v1';

// ============================================================
// قائمة الملفات للتخزين المؤقت
// ============================================================

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',

    // ===== صور كوبو =====
    './photos/Media.jpg',
    './photos/Media (1).jpg',
    './photos/Media (2).jpg',
    './photos/Media (3).jpg',
    './photos/Media (4).jpg',
    './photos/Media (5).jpg',
    './photos/Media (6).jpg',
    './photos/Media (7).jpg',
    './photos/Media (8).jpg',
    './photos/Media (9).jpg',
    './photos/Media (10).jpg',
    './photos/Media (11).jpg',
    './photos/Media (12).jpg',
    './photos/Media (13).jpg',
    './photos/Media (14).jpg',

    // ===== مجلد الأيقونات =====
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// ============================================================
// حدث التثبيت - تخزين الملفات
// ============================================================

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell and content');

                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(asset =>
                        cache.add(asset).catch(err => {
                            console.warn(`[Service Worker] Failed to cache: ${asset}`, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[Service Worker] All assets cached');
                return self.skipWaiting();
            })
    );
});

// ============================================================
// حدث التفعيل - حذف الكاش القديم
// ============================================================

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[Service Worker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[Service Worker] Now ready to handle fetches');
            return self.clients.claim();
        })
    );
});

// ============================================================
// حدث الجلب - إستراتيجية Cache First
// ============================================================

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        return caches.match('./index.html');
                    });
            })
    );
});

// ============================================================
// رسالة لتحديث الكاش يدوياً
// ============================================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[Service Worker] Cache cleared');
        });
    }
});
