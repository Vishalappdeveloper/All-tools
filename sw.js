/* allfreecalculators.in service worker
   Strategy: NETWORK-FIRST for HTML/CSS/JS (always get the latest working code),
   with cache fallback for offline. Cache-first for images/fonts/static assets.
   Bumping CACHE forces every client to drop old cached files. */
var CACHE = 'calcfc-v9';
var CORE = [
  'index.html', 'offline.html', 'css/calcverse.css',
  'js/core.js', 'js/calculators-financial.js', 'js/calculators-math.js', 'js/calculators-health.js',
  'js/calculators-datetime.js', 'js/calculators-extra.js', 'js/seo-data.js', 'js/seo-data-extra.js',
  'js/tools-300.js', 'js/tools-mega.js', 'js/tools-families.js', 'js/tools-web.js', 'js/tools-interactive.js',
  'js/tools-build.js', 'js/firebase-config.js', 'js/calcverse.js', 'js/firebase.js', 'js/forgot-password.js', 'js/rates.js',
  'js/numora-i18n.js', 'js/page.js', 'js/cf-boot.js', 'js/afc-config.js', 'js/afc-site.js', 'css/afc-chrome.css', 'css/afc-unified.css',
  'js/cfc-features.js', 'css/cfc-features.css',
  'favicon.ico', 'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isFreshAsset(url) {
  // HTML pages, JS and CSS should always prefer the network so updates take effect.
  if (/\.(?:html|js|css)(?:[?#]|$)/i.test(url)) return true;
  return false;
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  // never touch cross-origin (Firebase, Google fonts, AdSense, rate APIs)
  if (url.indexOf(self.location.origin) !== 0) return;

  var navreq = e.request.mode === 'navigate';

  if (navreq || isFreshAsset(url)) {
    // NETWORK-FIRST: get latest, update cache, fall back to cache/offline.
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          if (hit) return hit;
          if (navreq) return caches.match('offline.html').then(function (m) { return m || caches.match('index.html'); });
          return caches.match('index.html');
        });
      })
    );
    return;
  }

  // CACHE-FIRST for everything else (images, icons, fonts, etc.)
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
    })
  );
});
