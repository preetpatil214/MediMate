const CACHE_NAME = "medimate-v3";

const APP_FILES = [
    "./",
    "./index.html",
    "./addmed.html",
    "./manifest.json",
    "./bgmain.jpg",
    "./med1.png",
    "./med2.png",
    "./med3.png",
    "./med4.png",
    "./pillicon.png",
    "./icon.png",
    "./icon-192.png",
    "./icon-512.png",
    "./alarm.mp3"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames =>
                Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request)
                    .then(response => {

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {
                            const copy = response.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, copy))
                                .catch(() => {});
                        }

                        return response;
                    })
                    .catch(() => caches.match("./index.html"));
            })
    );
});

self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        })
        .then(clientList => {

            for (const client of clientList) {
                if ("focus" in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow("./index.html");
            }

            return undefined;
        })
    );
});
