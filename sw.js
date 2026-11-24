/* Sudoku service worker: stores the page, pug and wallpapers on the first visit.
   Put this file in the SAME folder as the game's HTML file.
   Change VERSION whenever you add or rename files, so phones refresh the stored copy. */
const VERSION = 'sudoku-v2.1';

const CORE = ['./', 'sudoku.ico', 'dancing_pug.webp'];
const WALLPAPERS = Array.from({ length: 10 }, (_, i) => 'sudoku_wallpapers/img' + (i + 1) + '.jpg');

// the address without any ?query, so dancing_pug.webp?12345 and dancing_pug.webp are one file
const keyFor = url => {
  const u = new URL(url, self.location);
  u.search = '';
  return u.href;
};

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // one by one, so a missing file never blocks the rest
    await Promise.all(CORE.concat(WALLPAPERS).map(async path => {
      try {
        const res = await fetch(path, { cache: 'reload' });
        if (res.ok) await cache.put(keyFor(path), res);
      } catch (e) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // delete stored copies from older versions
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== VERSION).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // only this site's own files; the Google Sheet request (POST, other domain) is left alone
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const key = keyFor(req.url);
    const stored = await cache.match(key);

    // fetch a fresh copy in the background; use it next time
    const refresh = fetch(req).then(res => {
      if (res && res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => null);

    if (stored) return stored;   // instant, works offline

    const fresh = await refresh;
    if (fresh) return fresh;

    // offline and not stored: for a page visit, fall back to the game itself
    if (req.mode === 'navigate') {
      const page = await cache.match(keyFor('./'));
      if (page) return page;
    }
    return new Response('', { status: 504, statusText: 'Offline' });
  })());
});
