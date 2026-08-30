const CACHE_NAME = "medimate-v15";

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
    "./icon.png"
];

/* =================================================
   INSTALL
================================================= */

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                // Cache each file independently so one bad/slow asset
                // can never prevent the service worker from installing.
                for (const file of APP_FILES) {
                    try {
                        const response = await fetch(file, {
                            cache: "no-store"
                        });

                        if (response && response.ok) {
                            await cache.put(file, response);
                        }
                    } catch (error) {
                        console.warn("MediMate cache skipped:", file, error);
                    }
                }
            })
            .then(() => self.skipWaiting())
    );
});


/* =================================================
   ACTIVATE
================================================= */

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


/* =================================================
   FETCH
================================================= */

function fetchWithTimeout(request, timeoutMs = 5000) {
    return Promise.race([
        fetch(request, { cache: "no-store" }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Network timeout")), timeoutMs)
        )
    ]);
}

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;

    const isHTML =
        event.request.mode === "navigate" ||
        url.pathname.endsWith(".html") ||
        url.pathname === "/";

    if (isHTML) {
        event.respondWith(
            fetchWithTimeout(event.request)
                .then(response => response)
                .catch(() =>
                    caches.match(event.request)
                        .then(cached =>
                            cached ||
                            caches.match("./index.html")
                        )
                )
        );
        return;
    }

    // The current icon must update immediately after deployment.
    if (url.pathname.endsWith("/icon.png")) {
        event.respondWith(
            fetchWithTimeout(event.request)
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, copy))
                            .catch(() => {});
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets: cache first, then network.
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;

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
                    });
            })
    );
});


/* =================================================
   APP MESSAGES
================================================= */

self.addEventListener("message", event => {
    if (!event.data) return;

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
        return;
    }

    if (event.data.type === "TEST_ALARM") {
        event.waitUntil(
            showAlarmNotification(
                "💊 MediMate",
                "This is a test medicine reminder.",
                "medimate-test-alarm"
            )
        );
        return;
    }

    if (event.data.type === "MEDICINE_ALARM") {
        const medicine = event.data.medicine || {};

        event.waitUntil(
            showAlarmNotification(
                "💊 Time for your medicine",
                `${medicine.name || "Your medicine"}${medicine.time ? " — " + medicine.time : ""}`,
                event.data.tag || "medimate-medicine-alarm"
            )
        );
    }
});


/* =================================================
   NOTIFICATION
================================================= */

async function showAlarmNotification(title, body, tag) {
    await self.registration.showNotification(title, {
        body,
        icon: "./icon.png",
        badge: "./icon.png",
        tag,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 200, 300, 200, 700],
        timestamp: Date.now(),
        data: {
            url: "./index.html"
        },
        actions: [
            {
                action: "open",
                title: "Open MediMate"
            }
        ]
    });
}


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
        })
    );
});
