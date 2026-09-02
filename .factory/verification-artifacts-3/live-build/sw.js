const CACHE = 'shapeshift-set-1uj8een';
const SHELL = ["/","/index.html","/assets/favicon.svg","/assets/apple-touch.png","/assets/moon-garden-720.webp","/assets/moon-garden-1200.webp","/assets/index-cdAnxJgX.css","/assets/index-IUDNXAQ1.js"];
const ORIGIN = self.location.origin;
const INDEX = new URL('/index.html', ORIGIN).href;
const APP_ROUTES = new Set(['/', '/demo', '/privacy', '/terms']);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // The HTML names the hashed JS and CSS below. Install completes only
    // after those exact current shell files have reached Cache Storage.
    await Promise.all(SHELL.map(async (url) => {
      const response = await fetch(new Request(new URL(url, ORIGIN).href, { cache: 'reload' }));
      if (!response.ok) throw new Error('Could not cache ' + url);
      await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Valid app routes are not files in the deploy output, so resolve only
    // those to the explicitly precached shell. Unknown URLs go to the host so
    // they retain a real 404 response even after this worker controls a page.
    if (event.request.mode === 'navigate') {
      const url = new URL(event.request.url);
      if (APP_ROUTES.has(url.pathname)) {
        const shell = await cache.match(INDEX);
        if (shell) return shell;
        try {
          return await fetch(event.request);
        } catch {
          throw new Error('Offline navigation shell not cached');
        }
      }
      return fetch(event.request);
    }
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      throw new Error('Offline asset not cached');
    }
  })());
});
