const CACHE_NAME = "medimate-v14";

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

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                /*
                 * Cache files individually.
                 * If one file fails, the whole app
                 * will NOT get stuck installing.
                 */

                return Promise.all(
                    APP_FILES.map(file => {

                        return fetch(
                            file,
                            {
                                cache: "no-store"
                            }
                        )
                            .then(response => {

                                if (response.ok) {

                                    return cache.put(
                                        file,
                                        response
                                    );
                                }

                            })
                            .catch(error => {

                                console.warn(
                                    "Could not cache:",
                                    file,
                                    error
                                );

                            });

                    })
                );

            })

            .then(() => {

                return self.skipWaiting();

            })

    );

});


/* =================================================
   ACTIVATE
================================================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()

            .then(keys => {

                return Promise.all(

                    keys
                        .filter(
                            key =>
                                key !== CACHE_NAME
                        )
                        .map(
                            key =>
                                caches.delete(key)
                        )

                );

            })

            .then(() => {

                return self.clients.claim();

            })

    );

});


/* =================================================
   FETCH
================================================= */

self.addEventListener("fetch", event => {

    if (
        event.request.method !== "GET"
    ) {

        return;

    }


    const url =
        new URL(event.request.url);


    if (
        url.origin !== location.origin
    ) {

        return;

    }


    /*
     * HTML:
     * Always use the newest version from Vercel.
     */

    if (
        event.request.mode === "navigate" ||
        url.pathname.endsWith(".html") ||
        url.pathname === "/"
    ) {

        event.respondWith(

            fetch(
                event.request,
                {
                    cache: "no-store"
                }
            )

                .then(response => {

                    return response;

                })

                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );

        return;

    }


    /*
     * ICON:
     * Always try the newest icon first.
     */

    if (
        url.pathname.endsWith("/icon.png")
    ) {

        event.respondWith(

            fetch(
                event.request,
                {
                    cache: "no-store"
                }
            )

                .then(response => {

                    if (
                        response.ok
                    ) {

                        const copy =
                            response.clone();

                        caches.open(
                            CACHE_NAME
                        )
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    copy
                                );

                            })
                            .catch(() => {});

                    }

                    return response;

                })

                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );

        return;

    }


    /*
     * Other files:
     * Cache first, network fallback.
     */

    event.respondWith(

        caches.match(
            event.request
        )

            .then(cached => {

                if (cached) {

                    return cached;

                }


                return fetch(
                    event.request
                );

            })

    );

});


/* =================================================
   MESSAGE
================================================= */

self.addEventListener("message", event => {

    if (
        event.data &&
        event.data.type ===
        "SKIP_WAITING"
    ) {

        self.skipWaiting();

    }

});


/* =================================================
   NOTIFICATION CLICK
================================================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        event.waitUntil(

            clients.matchAll({

                type: "window",
                includeUncontrolled: true

            })

                .then(clientList => {

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