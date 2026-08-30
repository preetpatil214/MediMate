const CACHE_NAME = "medimate-v12";

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

/* =====================================================
   INSTALL
===================================================== */

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});


/* =====================================================
   ACTIVATE
===================================================== */

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});


/* =====================================================
   FETCH
===================================================== */

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    const isHTML =
        event.request.mode === "navigate" ||
        url.pathname.endsWith(".html") ||
        url.pathname === "/";

    /* -------------------------------
       HTML = ALWAYS GET FRESH VERSION
    ------------------------------- */

    if (isHTML) {
        event.respondWith(
            fetch(event.request, {
                cache: "no-store"
            })
                .then(response => response)
                .catch(() => caches.match(event.request))
        );

        return;
    }

    /* -------------------------------
       OTHER FILES = CACHE FIRST
    ------------------------------- */

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(response => {

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {
                            const responseClone =
                                response.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(
                                        event.request,
                                        responseClone
                                    );
                                })
                                .catch(() => {});
                        }

                        return response;
                    });
            })
    );
});


/* =====================================================
   MESSAGE FROM APP
===================================================== */

self.addEventListener("message", event => {

    if (!event.data) {
        return;
    }


    /* -------------------------------
       ACTIVATE NEW SERVICE WORKER
    ------------------------------- */

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
        return;
    }


    /* -------------------------------
       MEDICINE SAVED
    ------------------------------- */

    if (event.data.type === "MEDICINE_SAVED") {

        console.log(
            "Medicine received by service worker:",
            event.data.medicine
        );

        return;
    }


    /* -------------------------------
       TEST ALARM
    ------------------------------- */

    if (event.data.type === "TEST_ALARM") {

        event.waitUntil(
            showAlarmNotification({
                name: "MediMate",
                body: "This is a test medicine reminder."
            })
        );

        return;
    }


    /* -------------------------------
       MEDICINE ALARM
    ------------------------------- */

    if (event.data.type === "MEDICINE_ALARM") {

        const medicine =
            event.data.medicine || {};

        event.waitUntil(
            showAlarmNotification({
                name:
                    medicine.name ||
                    "Medicine Reminder",

                body:
                    medicine.message ||
                    `Time to take ${medicine.name || "your medicine"}.`
            })
        );

        return;
    }
});


/* =====================================================
   SHOW ALARM NOTIFICATION
===================================================== */

async function showAlarmNotification(data) {

    const title =
        data.name || "Medicine Reminder";

    const body =
        data.body || "It's time to take your medicine.";

    const options = {

        body: body,

        icon: "./icon.png",

        badge: "./icon.png",

        tag: "medimate-medicine-alarm",

        renotify: true,

        requireInteraction: true,

        vibrate: [
            300,
            200,
            300,
            200,
            700
        ],

        data: {
            url: "./index.html",
            type: "MEDICINE_ALARM"
        },

        actions: [
            {
                action: "open",
                title: "Open MediMate"
            }
        ]
    };

    await self.registration.showNotification(
        title,
        options
    );
}


/* =====================================================
   NOTIFICATION CLICK
===================================================== */

self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(

        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        })
        .then(clientList => {

            /* -------------------------------
               OPEN EXISTING MEDIMATE WINDOW
            ------------------------------- */

            for (const client of clientList) {

                if ("focus" in client) {

                    return client.focus();
                }
            }


            /* -------------------------------
               OTHERWISE OPEN MEDIMATE
            ------------------------------- */

            if (clients.openWindow) {

                return clients.openWindow(
                    "./index.html"
                );
            }

        })
    );
});


/* =====================================================
   NOTIFICATION ACTIONS
===================================================== */

self.addEventListener("notificationclick", event => {

    if (event.action !== "open") {
        return;
    }

    event.notification.close();

    event.waitUntil(
        clients.openWindow("./index.html")
    );
});


/* =====================================================
   NOTIFICATION CLOSE
===================================================== */

self.addEventListener("notificationclose", event => {

    console.log(
        "MediMate notification dismissed."
    );

});