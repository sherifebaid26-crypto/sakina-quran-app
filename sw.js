/* ============================================================
   SAKINA — Service Worker
   - Caches the app shell (works offline, instant loads)
   - Stale-while-revalidate: updates in background, never stale
   - Never intercepts cross-origin audio (pass-through)
   ============================================================ */

const CACHE = "sakina-v1.10";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/data.js",
  "./js/offline.js",
  "./js/ambience.js",
  "./js/audio.js",
  "./js/ui.js",
  "./js/app.js",
  "./data/surahs.json",
  "./data/quran-ar.json",
  "./data/quran-en.json",
  "./assets/fonts/amiri-quran-400.woff2",
  "./assets/fonts/inter-400.woff2",
  "./assets/fonts/inter-500.woff2",
  "./assets/fonts/inter-600.woff2",
  "./assets/fonts/inter-700.woff2",
  "./assets/fonts/noto-sans-arabic-400.woff2",
  "./assets/fonts/noto-sans-arabic-500.woff2",
  "./assets/fonts/noto-sans-arabic-600.woff2",
  "./assets/fonts/noto-sans-arabic-700.woff2",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/reciters/alafasy.jpg",
  "./assets/reciters/sudais.jpg",
  "./assets/reciters/shuraim.jpg",
  "./assets/reciters/muaiqly.jpg",
  "./assets/reciters/ghamdi.jpg",
  "./assets/reciters/kamil.jpg",
  "./assets/reciters/husary.jpg",
  "./assets/reciters/minshawi.jpg",
  "./assets/reciters/abdulbasit.jpg",
  "./assets/reciters/shatri.jpg",
  "./assets/reciters/dosari.jpg",
  "./assets/audio/001-alafasy.mp3",
  "./assets/audio/002-sudais.mp3",
  "./assets/audio/003-shuraim.mp3",
  "./assets/audio/004-muaiqly.mp3",
  "./assets/audio/005-ghamdi.mp3",
  "./assets/audio/006-husary.mp3",
  "./assets/audio/007-minshawi.mp3",
  "./assets/audio/008-abdulbasit.mp3",
  "./assets/audio/009-shatri.mp3",
  "./assets/audio/010-dosari.mp3",
  "./assets/reciters/mohamedahmedhassan.jpg",
  "./assets/reciters/islamsobhi.jpg",
  "./assets/reciters/abdulrahmanmusad.jpg",
  "./assets/reciters/moazsyam.jpg",
  "./assets/audio/012-mohamedahmedhassan.mp3",
  "./assets/audio/013-islamsobhi.mp3",
  "./assets/audio/014-moazsyam.mp3",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  const url = new URL(req.url);

  // never touch cross-origin (audio CDNs) or non-GET
  if (url.origin !== self.location.origin || req.method !== "GET") return;

  // navigation: network-first, fallback to cached index
  if (req.mode === "navigate") {
    ev.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // static assets: code files (.js/.css/.mjs) are network-first so fixes
  // reach the tablet immediately; everything else (images/fonts/audio)
  // stays stale-while-revalidate since it rarely changes.
  const isCodeFile = /\.(js|css|mjs)$/.test(url.pathname);

  if (isCodeFile) {
    ev.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  ev.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
