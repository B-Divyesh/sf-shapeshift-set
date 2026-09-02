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
        source: `const CACHE = '${cache}';\nconst SHELL = ${JSON.stringify(shell)};\n
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
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
    // A navigation can be /demo, /privacy, or a future SPA URL.  Those URLs
    // are not files in the deploy output, so resolve them to the explicitly
    // precached app shell before attempting the network.  This is what makes
    // a brand-new offline navigation deterministic after the first visit.
    if (event.request.mode === 'navigate') {
      const shell = await cache.match('/index.html');
      if (shell) return shell;
      try {
        return await fetch(event.request);
      } catch {
        throw new Error('Offline navigation shell not cached');
      }
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
