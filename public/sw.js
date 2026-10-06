self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", event => {
  self.clients.claim();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isDynamicRequest =
    request.mode === "navigate" ||
    request.headers.get("rsc") === "1" ||
    url.pathname.startsWith("/_next/data") ||
    url.pathname.startsWith("/api/") ||
    url.searchParams.has("_rsc") ||
    url.searchParams.has("action");

  if (!isSameOrigin || isDynamicRequest) {
    return;
  }

  event.respondWith(fetch(request));
});
