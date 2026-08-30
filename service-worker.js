const CACHE_NAME = "medimate-v13-reminders";

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

            .then(async cache => {

                for (const file of APP_FILES) {

                    try {

                        const response = await fetch(
                            file,
                            {
                                cache: "no-store"
                            }
                        );

                        if (response.ok) {

                            await cache.put(
                                file,
                                response
                            );
                        }

                    } catch (error) {

                        console.warn(
                            "Cache failed:",
                            file,
                            error
                        );
                    }
                }

            })

            .then(() =>
                self.skipWaiting()
            )
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

            .then(() =>
                self.clients.claim()
            )

            .then(async () => {

                const clientsList =
                    await self.clients.matchAll({
                        type: "window"
                    });

                clientsList.forEach(client => {

                    client.postMessage({
                        type: "MEDIMATE_SW_UPDATED"
                    });

                });

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
        url.origin !== self.location.origin
    ) {
        return;
    }


    const isHtml =
        event.request.mode === "navigate" ||
        url.pathname.endsWith(".html") ||
        url.pathname === "/";


    const isIcon =
        url.pathname.endsWith("/icon.png") ||
        url.pathname === "/icon.png";


    /* =================================================
       HTML — NETWORK FIRST
    ================================================= */

    if (isHtml) {

        event.respondWith(

            fetch(
                event.request,
                {
                    cache: "no-store"
                }
            )

                .then(response => {

                    if (
                        response &&
                        response.ok
                    ) {

                        return response;
                    }

                    throw new Error(
                        "HTML network request failed"
                    );
                })

                .catch(() =>
                    caches.match(
                        event.request
                    )
                )
        );

        return;
    }


    /* =================================================
       ICON — NETWORK FIRST
    ================================================= */

    if (isIcon) {

        event.respondWith(

            fetch(
                event.request,
                {
                    cache: "no-store"
                }
            )

                .then(response => {

                    if (
                        response &&
                        response.ok
                    ) {

                        const copy =
                            response.clone();

                        caches.open(
                            CACHE_NAME
                        )
                            .then(cache =>
                                cache.put(
                                    event.request,
                                    copy
                                )
                            )
                            .catch(() => {});

                        return response;
                    }

                    throw new Error(
                        "Icon request failed"
                    );
                })

                .catch(() =>
                    caches.match(
                        event.request
                    )
                )
        );

        return;
    }


    /* =================================================
       OTHER FILES — CACHE FIRST
    ================================================= */

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
                )

                    .then(response => {

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {

                            const copy =
                                response.clone();

                            caches.open(
                                CACHE_NAME
                            )
                                .then(cache =>
                                    cache.put(
                                        event.request,
                                        copy
                                    )
                                )
                                .catch(() => {});
                        }


                        return response;
                    });

            })
    );
});


/* =================================================
   MESSAGE
================================================= */

self.addEventListener("message", event => {

    if (
        !event.data
    ) {
        return;
    }


    if (
        event.data.type ===
        "SKIP_WAITING"
    ) {

        self.skipWaiting();
    }


    /*
     * Allows the page to explicitly ask the
     * service worker to display a reminder.
     */

    if (
        event.data.type ===
        "SHOW_MEDICINE_NOTIFICATION"
    ) {

        const data =
            event.data.data || {};

        event.waitUntil(

            showMedicineNotification(
                data
            )
        );
    }

});


/* =================================================
   MEDICINE NOTIFICATION
================================================= */

async function showMedicineNotification(data) {

    const medicineName =
        data.medicineName ||
        "Your medicine";


    const time =
        data.time ||
        "";


    const reminderKey =
        data.reminderKey ||
        (
            "medimate-" +
            Date.now()
        );


    /*
     * Check existing notifications with the
     * same tag before creating another one.
     */

    const existing =
        await self.registration
            .getNotifications({
                tag: reminderKey
            });


    if (
        existing.length > 0
    ) {

        return;
    }


    await self.registration.showNotification(

        "💊 Time for your medicine",

        {

            body:
                medicineName +
                (
                    time
                        ? " — " + time
                        : ""
                ),

            icon:
                "./icon.png",

            badge:
                "./icon.png",

            tag:
                reminderKey,

            renotify:
                true,

            requireInteraction:
                true,

            vibrate:
                [
                    300,
                    150,
                    300,
                    150,
                    600
                ],

            timestamp:
                Date.now(),

            data: {

                medicineId:
                    data.medicineId || null,

                date:
                    data.date || null,

                time:
                    data.time || null,

                url:
                    "./index.html"
            }

        }
    );
}


/* =================================================
   NOTIFICATION CLICK
================================================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        event.waitUntil(

            clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            })

                .then(clientList => {

                    /*
                     * If MediMate is already open,
                     * focus it.
                     */

                    for (
                        const client of clientList
                    ) {

                        if (
                            client.url.includes(
                                "/index.html"
                            ) &&
                            "focus" in client
                        ) {

                            return client.focus();
                        }
                    }


                    /*
                     * Otherwise open MediMate.
                     */

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