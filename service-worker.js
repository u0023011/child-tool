const CACHE_NAME = "toolbox-home-v20260714-9";
const HOME_PAGE = "./index.html";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        const response = await fetch(HOME_PAGE, { cache: "no-store" });
        if (response.ok) {
          await cache.put(HOME_PAGE, response);
        }
      } catch (error) {}
    })
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("toolbox-home-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const isNavigation = request.mode === "navigate";

  if (!isNavigation) return;

  event.respondWith(
    fetch(request, { cache: "no-store" })
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(HOME_PAGE, copy));
        return response;
      })
      .catch(() =>
        caches.match(HOME_PAGE).then(cached => cached || Response.error())
      )
  );
});
