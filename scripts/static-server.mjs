import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT ?? 4173);
const spaRoutes = new Set(['/', '/demo', '/privacy', '/terms']);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function safePath(pathname) {
  const file = normalize(join(root, pathname));
  return file.startsWith(`${root}/`) || file === root ? file : null;
}

function sendFile(response, file, status = 200) {
  response.writeHead(status, {
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': extname(file) === '.html' || file.endsWith('/sw.js') ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(file).pipe(response);
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end();
    return;
  }
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname;
  const requested = safePath(pathname === '/' ? '/index.html' : pathname);
  if (spaRoutes.has(pathname)) {
    sendFile(response, join(root, 'index.html'));
  } else if (requested && existsSync(requested) && statSync(requested).isFile()) {
    sendFile(response, requested);
  } else {
    sendFile(response, join(root, '404.html'), 404);
  }
});

server.listen(port, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
