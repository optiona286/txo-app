const CACHE_NAME = 'txo-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// CDN 資源（ECharts、JSZip）— 網路優先，失敗再用快取
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/echarts@5',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
];

// ── 安裝：預快取 App Shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── 啟動：清除舊版快取 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── 攔截請求 ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // CDN 資源：網路優先，失敗用快取
  if (CDN_URLS.some(cdn => url.startsWith(cdn.split('@')[0]))) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App Shell：快取優先
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
  );
});
