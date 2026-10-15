const CACHE = 'infra-v3';
const LOCAL = ['./', './index.html', './station_schouw.html', './trace_schouw.html'];
const LIBS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
];

// Eén mislukte download mag de installatie niet blokkeren
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all([
    ...LOCAL.map(u => fetch(u, {cache:'reload'}).then(r => r.ok && c.put(u, r)).catch(() => {})),
    ...LIBS.map(u => fetch(u, {mode:'no-cors'}).then(r => c.put(u, r)).catch(() => {}))
  ])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if(r.method !== 'GET') return;
  const url = new URL(r.url);
  if(url.origin === location.origin){
    // eigen bestanden: eerst netwerk (nieuwe versie altijd zichtbaar), offline uit cache
    e.respondWith(fetch(r).then(resp => {
      if(resp && resp.status === 200){ const cl = resp.clone(); caches.open(CACHE).then(c => c.put(r, cl)); }
      return resp;
    }).catch(() => caches.match(r, {ignoreSearch:true})));
  } else if(LIBS.includes(r.url)){
    e.respondWith(caches.match(r).then(c => c || fetch(r)));
  }
});
