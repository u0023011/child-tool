const CACHE_NAME = "child-tool-pwa-20260724-matching-v1";
const CACHE_PREFIX = "child-tool-pwa-";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./matching-check-tool/",
  "./matching-check-tool/index.html",
  "./age-tool/",
  "./childcare-law/",
  "./childcare-case-library/",
  "./report-date-tool/",
  "./receipt-tool/",
  "./report-generator/",
  "./training-hours-tool/",
  "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.allSettled(
        PRECACHE_URLS.map(function (url) {
          return cache.add(new Request(url, { cache: "reload" }));
        })
      );
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const fallback = await cache.match("./index.html");
    if (fallback) return fallback;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: false });
  const networkPromise = fetch(request).then(function (response) {
    if (response && (response.ok || response.type === "opaque")) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(function () {
    return null;
  });

  return cached || (await networkPromise) || Response.error();
}

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 登入、登出與使用人次都必須向後端取得最新結果，不放入快取。
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
