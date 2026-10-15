/* =========================================================
   LUMERA · SERVICE WORKER v24
   Caches static assets, card images, and offline data.
   ========================================================= */
const CACHE_STATIC = 'lumera-static-v29';
const CACHE_IMAGES = 'lumera-images-v1';

/* ================= STATIC ASSETS ================= */
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',

  // CSS
  './css/main.css',
  './css/animations.css',
  './css/profile.css',
  './css/natal.css',
  './css/onboarding.css',
  './css/themes.css',

  // JS
  './js/avatars.js',
  './js/onboarding.js',
  './js/theme-engine.js',
  './js/bg-animation.js',
  './js/card-art.js',
  './js/tarot-interpreter.js',
  './js/tarot-engine.js',
  './js/daily-v2.js',
  './js/natal.js',
  './js/user.js',
  './js/achievements.js',
  './js/stats.js',
  './js/app.js',

  // Data
  './data/tarot-full.json',

  // Icons
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* ================= CARD IMAGES (78 cards + 1 back) ================= */
const CARD_IDS = [
  'major-00','major-01','major-02','major-03','major-04','major-05','major-06',
  'major-07','major-08','major-09','major-10','major-11','major-12','major-13',
  'major-14','major-15','major-16','major-17','major-18','major-19','major-20',
  'major-21',
  'cups-ace','cups-two','cups-three','cups-four','cups-five','cups-six',
  'cups-seven','cups-eight','cups-nine','cups-ten','cups-page','cups-knight',
  'cups-queen','cups-king',
  'swords-ace','swords-two','swords-three','swords-four','swords-five','swords-six',
  'swords-seven','swords-eight','swords-nine','swords-ten','swords-page','swords-knight',
  'swords-queen','swords-king',
  'wands-ace','wands-two','wands-three','wands-four','wands-five','wands-six',
  'wands-seven','wands-eight','wands-nine','wands-ten','wands-page','wands-knight',
  'wands-queen','wands-king',
  'pentacles-ace','pentacles-two','pentacles-three','pentacles-four','pentacles-five',
  'pentacles-six','pentacles-seven','pentacles-eight','pentacles-nine','pentacles-ten',
  'pentacles-page','pentacles-knight','pentacles-queen','pentacles-king'
];

const CARD_IMAGES = [
  './assets/backs/back.jpg',
  ...CARD_IDS.map(id => `./assets/cards/${id}.jpg`)
];

/* ================= INSTALL ================= */
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS)),
      caches.open(CACHE_IMAGES).then(c => c.addAll(CARD_IMAGES))
    ]).then(() => self.skipWaiting())
  );
});

/* ================= ACTIVATE ================= */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_IMAGES)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ================= FETCH ================= */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Card images: Cache-First
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_IMAGES).then(c => c.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  // HTML: Network-First (fallback to cache)
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_STATIC).then(c => c.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req).then(r => r || caches.match('./index.html'))
      )
    );
    return;
  }

  // Everything else: Cache-First
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});