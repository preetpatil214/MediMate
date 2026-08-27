const CACHE_NAME = "medimate-v1";
const APP_ASSETS = [
    "./index.html",
    "./manifest.json",
    "./icon.png",
    "./bgmain.jpg",
    "./med3.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_ASSETS);
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (cacheName) {
                        return cacheName !== CACHE_NAME;
                    })
                    .map(function (cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(function () {
                return caches.match("./index.html");
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            return cachedResponse || fetch(event.request).then(function (response) {
                if (!response || response.status !== 200 || response.type !== "basic") {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});
