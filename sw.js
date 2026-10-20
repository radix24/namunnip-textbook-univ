/* 오프라인: 한 번 연 파일은 캐시에 두고, 네트워크가 되면 늘 새 파일을 받는다(네트워크 우선). */
const CACHE = "quri-v1";

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  // 같은 주소(github.io)의 다른 사이트(나뭇잎 교과서)와 캐시 저장소를 함께 쓰므로 QURI 캐시만 지운다
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("quri-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.registration.scope)) return;   // QURI 폴더 밖(나뭇잎 등)은 건드리지 않는다
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((r) => r || c.match("./"))))
  );
});
