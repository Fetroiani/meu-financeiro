// Guarda o app no celular para abrir rápido e funcionar sem internet.
const V = 'meucaixa-v2';
const ARQ = ['./', 'index.html', 'cupom.js', 'cofre.js', 'logo.png', 'manifest.webmanifest', 'icons/icon-192.png',
  'vendor/jsQR.js', 'vendor/tesseract.min.js', 'vendor/worker.min.js', 'vendor/lang/por.traineddata.gz',
  'vendor/core/tesseract-core-lstm.wasm.js', 'vendor/core/tesseract-core-simd-lstm.wasm.js', 'vendor/core/tesseract-core-relaxedsimd-lstm.wasm.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(ARQ)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
