/* Sudoku service worker: this file is run by the browser in the background, separately from the game's page.
   It stores the page, pug and wallpapers on the first visit.
   Change VERSION whenever you add or rename files, or replace the pug or a wallpaper, so phones refresh the stored copy. */
const VERSION = 'sudoku-v6.4';

// true  = when the game is opened online, quietly fetch a newer copy of the page for next time
// false = never touch the network once files are stored (page updates then arrive only when VERSION changes)
const REFRESH_PAGE = true;

// const CORE = ['./', 'sudoku.ico', 'dancing_pug.webp'];
const CORE = ['./', 'sudoku.ico', 'dancing_pug.webp', 'theme.css', 'theme.js'];

const LANDSCAPE_COUNT = 24;      
const PORTRAIT_COUNT  = 10;

const WALLPAPERS = Array.from({ length: LANDSCAPE_COUNT }, (_, i) => 'sudoku_wallpapers/img' + (i + 1) + '.jpg')
  .concat(Array.from({ length: PORTRAIT_COUNT }, (_, i) => 'Sudoku_images_portrait/img' + (i + 1) + '.jpg'));

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

    if (stored) {
      // only the page itself may refresh in the background; the pug and wallpapers never touch the network
      if (REFRESH_PAGE && req.mode === 'navigate') {
        fetch(req).then(res => { if (res && res.ok) cache.put(key, res.clone()); }).catch(() => {});
      }
      return stored;   // instant, no network
    }

    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(key, res.clone());
      return res;
    } catch (e) {
      // offline and not stored: for a page visit, fall back to the game itself
      if (req.mode === 'navigate') {
        const page = await cache.match(keyFor('./'));
        if (page) return page;
      }
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
