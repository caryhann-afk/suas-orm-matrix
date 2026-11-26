// Offline cache. Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'suas-forms-v2';
const ASSETS = ['./', 'index.html', 'hub.css', 'manifest.webmanifest', 'vendor/pdf-lib.min.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'orm/', 'orm/index.html', 'orm/app.css', 'orm/app.js', 'orm/orm.js', 'orm/form.pdf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Network first (so updates show up when online), cache fallback (so it works in the field with no signal).
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match(new URL(req.url).pathname.startsWith('/orm') ? 'orm/index.html' : 'index.html')))
  );
});
