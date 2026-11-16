// Service worker de la démo : l'app fonctionne hors ligne une fois chargée.
// Pages : réseau d'abord, cache en secours. Ressources statiques : cache d'abord.
const CACHE = "dressr-demo-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const isStatic = url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/images") || url.pathname.startsWith("/video") || url.pathname.startsWith("/_next/image");
  if (isStatic) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req, { ignoreVary: true });
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok && res.status === 200) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req, { ignoreVary: true }).then((r) => r || caches.match("/accueil"))),
  );
});
