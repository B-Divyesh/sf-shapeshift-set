const CACHE = 'shapeshift-set-v1';
const SHELL = ['/', '/index.html', '/demo', '/privacy', '/terms', '/assets/favicon.svg', '/assets/moon-garden-720.webp', '/assets/moon-garden-1200.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch('/index.html');
    const html = await response.clone().text();
    await cache.put('/index.html', response.clone());
    await cache.put('/', response);
    const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
      .map((match) => match[1])
      .filter((url) => url.startsWith('/'));
    await cache.addAll([...new Set([...SHELL.slice(2), ...assets])]);
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
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      if (event.request.mode === 'navigate') return (await cache.match('/index.html'));
      throw new Error('Offline asset not cached');
    }
  })());
});
