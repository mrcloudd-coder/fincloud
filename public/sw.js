// Service worker minimal — syarat wajib Chrome supaya dialog "Install app"
// muncul dengan benar (pakai ikon custom, bukan cuma shortcut biasa).
//
// Sengaja TIDAK melakukan caching kompleks: app ini berisi data keuangan
// yang harus selalu fresh/real-time, jadi tiap request tetap diteruskan
// langsung ke network seperti browser normal.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
