const CACHE_NAME = 'sesac-library-v16';

const STATIC_ASSETS = [
  './',
  './index.html',
  './app.js',
  './app.js?v=9',
  './firebase-config.js',
  './firebase-config.js?v=4',
  './styles.css',
  './styles.css?v=9',
  './manifest.json',
  './manifest.json?v=2',
  './collected_books.json',
  './apple-touch-icon.png',
  './apple-touch-icon-precomposed.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192.png?v=2',
  './icons/icon-512.png?v=2',
  './icons/icon_logo_512.svg',
  './icons/icon_logo_512.png',
  './images/01_AI 에이전트, 우리는 이렇게 씁니다.jpg',
  './images/02_7인의 AI 드림팀 만들기.jpg',
  './images/03_AI 게임 개발 with 코덱스.jpg',
  './images/04_트렌드 코리아 2027.jpg',
  './images/05_그림으로 이해하는 서버 구조와 기술.jpg',
  './images/06_조코딩의 바이브 코딩 1인 창업.jpg',
  './images/07_난생처음 AI x 부동산.jpg',
  './images/08_바이브 코딩 프로덕션의 원칙.jpg',
  './images/09_피지컬 AI 2026.jpg',
  './images/10_만들면서 배우는 AI 에이전트 개발.jpg',
  './images/11_하네스 엔지니어링.jpg',
  './images/12_바이브 코딩 주식 자동매매.jpg',
  './images/13_AI가 알아서 굴려주는 월급쟁이 재테크.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(encodeURI));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET and chrome-extension or external requests safely
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Firestore or Auth API should bypass cache
  if (url.hostname.includes('firestore') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and refresh in background (stale-while-revalidate for local files)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
