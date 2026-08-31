const CACHE_NAME = "medimate-v16";

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
   BACKGROUND SCHEDULED REMINDERS
================================================= */

function normalizeSWTime(value) {
    if (typeof value !== "string") return null;
    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }

    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}

function swDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function swParseDate(value) {
    if (typeof value !== "string") return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
    );

    date.setHours(0, 0, 0, 0);
    return date;
}

async function scheduleMedicineReminders(medicine) {
    if (
        typeof TimestampTrigger === "undefined" ||
        !self.registration.showNotification ||
        !medicine ||
        !Array.isArray(medicine.times)
    ) {
        return;
    }

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const medicineEnd = swParseDate(medicine.endDate);
    if (medicineEnd && medicineEnd < end) {
        end.setTime(medicineEnd.getTime());
    }

    for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
    ) {
        const dateStr = swDateString(date);

        if (
            (medicine.startDate && dateStr < medicine.startDate) ||
            (medicine.endDate && dateStr > medicine.endDate)
        ) {
            continue;
        }

        for (const timeObj of medicine.times) {
            const time = normalizeSWTime(timeObj && timeObj.time);
            if (!time) continue;

            const [hours, minutes] = time.split(":").map(Number);
            const triggerDate = new Date(date);
            triggerDate.setHours(hours, minutes, 0, 0);

            if (triggerDate.getTime() <= Date.now()) continue;

            const tag =
                "medimate-reminder-" +
                String(medicine.id) +
                "-" +
                dateStr +
                "-" +
                time;

            try {
                await self.registration.showNotification(
                    "💊 Time for your medicine !!!",
                    {
                        body:
                            String(medicine.name || "Your medicine") +
                            " — " +
                            time,
                        icon: "./icon.png",
                        badge: "./icon.png",
                        tag,
                        renotify: true,
                        requireInteraction: true,
                        vibrate: [300, 150, 300, 150, 600],
                        timestamp: triggerDate.getTime(),
                        showTrigger: new TimestampTrigger(
                            triggerDate.getTime()
                        ),
                        data: {
                            medicineId: medicine.id,
                            date: dateStr,
                            time,
                            url: "./index.html"
                        }
                    }
                );
            } catch (error) {
                console.info("Scheduled reminder unavailable:", error);
            }
        }
    }
}


/* =================================================
   APP MESSAGES
================================================= */

self.addEventListener("message", event => {
    if (!event.data) return;

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
        return;
    }

    if (event.data.type === "MEDICINE_SAVED") {
        event.waitUntil(
            scheduleMedicineReminders(event.data.medicine)
        );
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
