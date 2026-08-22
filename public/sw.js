// Service worker minimal — syarat wajib Chrome supaya dialog "Install app"
// muncul dengan benar (pakai ikon custom, bukan cuma shortcut biasa).
//
// PENTING: fetch handler ini SENGAJA dibikin sangat konservatif.
// Next.js pakai fetch() internal buat navigasi client-side (RSC payload),
// server actions, dll — kalau semua fetch di-intercept & di-forward ulang
// lewat service worker, kadang gagal dan bikin navigasi/interaktivitas app
// rusak total (pernah kejadian, klik apapun jadi gak respon).
//
// Makanya sekarang cuma request navigasi HALAMAN PENUH (ketik URL langsung,
// atau buka dari luar app) yang disentuh. Semua fetch lain (klik, geser
// bulan, chat AI, dst) dibiarkan lewat natural tanpa campur tangan sama
// sekali — paling aman, karena itu semua fetch internal Next.js.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request))
  }
  // Request lain (fetch internal Next.js, API call, dll) TIDAK disentuh
  // sama sekali — dibiarkan jalan natural seperti tanpa service worker.
})
