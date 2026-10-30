const CACHE_PREFIX = 'ghostsignal-app-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const manifestResponse = await fetch('/build-manifest.json', { cache: 'no-store' });
    if (!manifestResponse.ok) throw new Error('Build asset manifest is unavailable.');
    const manifest = await manifestResponse.json();
    const assets = new Set(['/', '/offline.html', '/manifest.webmanifest']);
    Object.values(manifest).forEach((entry) => {
      if (entry.file) assets.add(`/${entry.file.replace(/^\//, '')}`);
      (entry.css ?? []).forEach((file) => assets.add(`/${file.replace(/^\//, '')}`));
      (entry.assets ?? []).forEach((file) => assets.add(`/${file.replace(/^\//, '')}`));
    });
    await cache.addAll([...assets]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) ?? (await caches.match('/')) ?? (await caches.match('/offline.html'))));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
    if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
