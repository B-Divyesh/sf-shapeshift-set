import { defineConfig, type Plugin } from 'vite';

function revisionedServiceWorker(): Plugin {
  return {
    name: 'revisioned-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const buildAssets = Object.values(bundle)
        .map((output) => `/${output.fileName}`)
        .filter((url) => /\/assets\/index-[^/]+\.(?:js|css)$/.test(url));
      // Navigation is always fulfilled from index.html by the worker.  Keep
      // this list to actual shell files instead of depending on the host's
      // SPA fallback to cache each route separately.
      const shell = [...new Set([
        '/', '/index.html',
        '/assets/favicon.svg', '/assets/apple-touch.png',
        '/assets/moon-garden-720.webp', '/assets/moon-garden-1200.webp',
        ...buildAssets,
      ])];
      const indexOutput = Object.values(bundle).find((output) => output.fileName === 'index.html');
      const revisionInput = `${shell.join('|')}|${indexOutput && 'source' in indexOutput ? String(indexOutput.source) : ''}`;
      let hash = 5381;
      for (const character of revisionInput) hash = (hash * 33) ^ character.charCodeAt(0);
      const cache = `shapeshift-set-${(hash >>> 0).toString(36)}`;
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = '${cache}';\nconst SHELL = ${JSON.stringify(shell)};\nconst ORIGIN = self.location.origin;\nconst INDEX = new URL('/index.html', ORIGIN).href;\nconst APP_ROUTES = new Set(['/', '/demo', '/privacy', '/terms']);\n
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
});\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [revisionedServiceWorker()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
