const CACHE_NAME = "medimate-v2";

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

    "./alarm.mp3"
];


/* =================================================
   INSTALL
================================================= */

self.addEventListener(
    "install",
    function(event) {

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(function(cache) {

                    return cache.addAll(
                        APP_FILES
                    );

                })
                .then(function() {

                    return self.skipWaiting();

                })

        );

    }
);


/* =================================================
   ACTIVATE
================================================= */

self.addEventListener(
    "activate",
    function(event) {

        event.waitUntil(

            caches.keys()
                .then(function(cacheNames) {

                    return Promise.all(

                        cacheNames.map(
                            function(cacheName) {

                                if (
                                    cacheName !==
                                    CACHE_NAME
                                ) {

                                    return caches.delete(
                                        cacheName
                                    );

                                }

                            }
                        )

                    );

                })
                .then(function() {

                    return self.clients.claim();

                })

        );

    }
);


/* =================================================
   FETCH
================================================= */

self.addEventListener(
    "fetch",
    function(event) {

        event.respondWith(

            caches.match(event.request)
                .then(function(cachedResponse) {

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(event.request)
                        .then(function(response) {

                            return response;

                        })
                        .catch(function() {

                            return caches.match(
                                "./index.html"
                            );

                        });

                })

        );

    }
);


/* =================================================
   NOTIFICATION CLICK
================================================= */

self.addEventListener(
    "notificationclick",
    function(event) {

        event.notification.close();

        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })
            .then(function(clientList) {

                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client
                    ) {

                        return client.focus();

                    }

                }

                if (
                    clients.openWindow
                ) {

                    return clients.openWindow(
                        "./index.html"
                    );

                }

            })

        );

    }
);