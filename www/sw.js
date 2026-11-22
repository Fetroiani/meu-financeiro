// Guarda o app no celular para abrir rápido e funcionar sem internet.
const V = 'meucaixa-v12';
const ARQ = ['./', 'index.html', 'cupom.js', 'cofre.js', 'extrato.js', 'i18n.js','sync.js', 'config.js', 'vendor/supabase.js', 'vendor/xlsx.full.min.js', 'logo.png', 'manifest.webmanifest', 'icons/v3/icon-192.png',
  'vendor/jsQR.js', 'vendor/tesseract.min.js', 'vendor/worker.min.js', 'vendor/lang/por.traineddata.gz',
  'vendor/core/tesseract-core-lstm.wasm.js', 'vendor/core/tesseract-core-simd-lstm.wasm.js', 'vendor/core/tesseract-core-relaxedsimd-lstm.wasm.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(ARQ)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;   // nunca guarda respostas do servidor de dados (Supabase)
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
