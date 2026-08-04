import Link from 'next/link'

export const metadata = {
  title: 'Kebijakan Privasi & Syarat Ketentuan — FinCloud',
}

export default function LegalPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-5 py-10">
        <Link href="/login" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
          ← Kembali
        </Link>

        <h1 className="text-2xl font-bold mt-4 mb-1" style={{ color: 'var(--primary)' }}>
          Kebijakan Privasi & Syarat Ketentuan
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--ink-soft)' }}>
          FinCloud — by cloud.studio
        </p>

        <div className="prose-legal text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <h2 className="text-lg font-bold mt-6 mb-2">A. Kebijakan Privasi</h2>

          <h3 className="font-semibold mt-4 mb-1">1. Data yang Kami Kumpulkan</h3>
          <p className="mb-2">Saat menggunakan FinCloud, kami mengumpulkan:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li><strong>Data akun</strong>: email dan password (terenkripsi) saat kamu mendaftar</li>
            <li><strong>Data keuangan</strong>: transaksi pengeluaran, pemasukan, kategori, dan rekening yang kamu input sendiri ke dalam aplikasi</li>
            <li><strong>Data pembayaran</strong>: bukti transfer yang kamu upload untuk verifikasi langganan</li>
            <li><strong>Data teknis</strong>: log penggunaan dasar (waktu akses, jenis perangkat) untuk keperluan keamanan dan perbaikan layanan</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-1">2. Cara Kami Menggunakan Data Kamu</h3>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Data keuangan yang kamu input digunakan <strong>semata-mata untuk menjalankan fitur aplikasi</strong> (mencatat, menampilkan ringkasan, membuat grafik) untuk akun kamu sendiri</li>
            <li>Chat pengeluaran yang kamu ketik akan <strong>dikirim ke penyedia layanan AI pihak ketiga (Google Gemini API)</strong> untuk diproses menjadi data transaksi terstruktur. Kami tidak mengontrol kebijakan privasi pihak ketiga tersebut secara langsung, namun tidak mengirimkan data yang tidak relevan dengan fungsi pencatatan</li>
            <li>Bukti transfer yang kamu upload digunakan <strong>hanya untuk verifikasi pembayaran</strong>, dan akan dihapus secara otomatis dari sistem kami dalam waktu 7 hari setelah proses verifikasi selesai</li>
            <li>Kami <strong>tidak menjual, menyewakan, atau membagikan</strong> data pribadi/keuangan kamu ke pihak ketiga untuk tujuan komersial/pemasaran</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-1">3. Penyimpanan Data</h3>
          <p className="mb-3">
            Data kamu disimpan menggunakan layanan infrastruktur cloud pihak ketiga (Supabase) dengan mekanisme
            keamanan standar industri (enkripsi, kontrol akses berbasis autentikasi). Meskipun kami berupaya
            menjaga keamanan data secara wajar, <strong>kami tidak dapat menjamin keamanan absolut</strong> atas
            data yang tersimpan di internet, dan kamu memahami risiko ini dengan menggunakan layanan ini.
          </p>

          <h3 className="font-semibold mt-4 mb-1">4. Hak Kamu</h3>
          <p className="mb-3">
            Kamu berhak meminta penghapusan akun dan seluruh data terkait dengan menghubungi kontak resmi di
            bagian bawah dokumen ini. Permintaan akan diproses dalam waktu yang wajar.
          </p>

          <h3 className="font-semibold mt-4 mb-1">5. Cookie & Teknologi Serupa</h3>
          <p className="mb-3">
            Aplikasi ini menggunakan cookie/local storage minimal yang diperlukan untuk menjaga sesi login kamu
            tetap aktif. Kami tidak menggunakan cookie untuk pelacakan iklan pihak ketiga.
          </p>

          <h2 className="text-lg font-bold mt-8 mb-2">B. Syarat & Ketentuan Penggunaan</h2>

          <h3 className="font-semibold mt-4 mb-1">1. Penerimaan Ketentuan</h3>
          <p className="mb-3">
            Dengan mendaftar dan menggunakan FinCloud, kamu dianggap telah membaca, memahami, dan menyetujui
            seluruh isi dokumen ini.
          </p>

          <h3 className="font-semibold mt-4 mb-1">2. Sifat Layanan</h3>
          <p className="mb-2">
            FinCloud disediakan <strong>&quot;sebagaimana adanya&quot; (as-is)</strong> dan{' '}
            <strong>&quot;sebagaimana tersedia&quot; (as-available)</strong>, tanpa jaminan dalam bentuk apa pun,
            baik tersurat maupun tersirat, termasuk namun tidak terbatas pada:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Jaminan bahwa layanan akan bebas dari gangguan, error, atau bug</li>
            <li>Jaminan atas keakuratan hasil pemrosesan AI dalam mengkategorikan/membaca transaksi</li>
            <li>Jaminan ketersediaan layanan 100% sepanjang waktu (uptime)</li>
          </ul>
          <p className="mb-3">
            <strong>Kamu bertanggung jawab penuh</strong> untuk memverifikasi keakuratan data keuangan yang
            tercatat di aplikasi. FinCloud adalah alat bantu pencatatan, <strong>bukan nasihat keuangan, bukan
            layanan perbankan, dan bukan penyimpan dana</strong> — aplikasi ini tidak menyimpan atau mengelola
            uang kamu secara langsung, hanya mencatat data yang kamu input.
          </p>

          <h3 className="font-semibold mt-4 mb-1">3. Langganan & Pembayaran</h3>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Layanan penuh memerlukan langganan berbayar setelah masa uji coba gratis berakhir</li>
            <li>Pembayaran dilakukan melalui metode yang tersedia di aplikasi (QRIS dan/atau metode lain yang kami sediakan)</li>
            <li><strong>Kebijakan Refund</strong>: Biaya langganan yang telah dibayarkan <strong>tidak dapat dikembalikan (non-refundable)</strong>, kecuali terjadi kesalahan sistem yang terbukti murni dari pihak kami</li>
            <li>Kami berhak mengubah harga langganan di masa mendatang, dengan pemberitahuan wajar kepada pengguna aktif</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-1">4. Verifikasi Pembayaran Manual</h3>
          <p className="mb-2">
            Selama periode tertentu, verifikasi pembayaran dilakukan secara manual oleh admin. Dengan mengunggah
            bukti pembayaran, kamu menyatakan bahwa <strong>bukti tersebut asli dan sah</strong>. Kami berhak:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Menangguhkan akses fitur premium sewaktu-waktu apabila ditemukan bukti pembayaran yang tidak valid, palsu, atau mencurigakan</li>
            <li>Melakukan tindakan hukum apabila ditemukan upaya penipuan yang disengaja</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-1">5. Larangan Penyalahgunaan</h3>
          <p className="mb-2">Kamu dilarang:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Menggunakan aplikasi untuk tujuan ilegal atau melanggar hukum yang berlaku di Indonesia</li>
            <li>Mencoba mengeksploitasi celah sistem untuk mendapatkan akses tanpa pembayaran yang sah</li>
            <li>Melakukan tindakan yang dapat membebani/merusak sistem (spam request, scraping, dsb.)</li>
          </ul>
          <p className="mb-3">
            Pelanggaran atas hal ini dapat mengakibatkan <strong>penangguhan atau penghapusan akun tanpa
            pemberitahuan sebelumnya</strong>, dan tanpa kewajiban pengembalian dana.
          </p>

          <h3 className="font-semibold mt-4 mb-1">6. Batasan Tanggung Jawab</h3>
          <p className="mb-2">
            Sepanjang diizinkan oleh hukum yang berlaku, cloud.studio <strong>tidak bertanggung jawab</strong>{' '}
            atas segala kerugian langsung maupun tidak langsung yang timbul dari:
          </p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Penggunaan atau ketidakmampuan menggunakan layanan ini</li>
            <li>Kesalahan pencatatan, kehilangan data, atau ketidakakuratan data akibat kegagalan sistem, kesalahan input pengguna, atau gangguan pihak ketiga</li>
            <li>Keputusan finansial apa pun yang kamu ambil berdasarkan data/insight dari aplikasi ini</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-1">7. Perubahan Layanan</h3>
          <p className="mb-3">
            Kami berhak mengubah, menambah, menghapus fitur, atau menghentikan layanan sewaktu-waktu tanpa
            kewajiban kompensasi, dengan itikad baik memberi pemberitahuan yang wajar apabila memungkinkan.
          </p>

          <h3 className="font-semibold mt-4 mb-1">8. Hukum yang Berlaku</h3>
          <p className="mb-3">
            Ketentuan ini diatur dan ditafsirkan berdasarkan hukum yang berlaku di <strong>Republik Indonesia</strong>.
            Segala sengketa yang timbul akan diupayakan diselesaikan secara musyawarah terlebih dahulu.
          </p>

          <h3 className="font-semibold mt-4 mb-1">9. Kontak</h3>
          <p className="mb-3">
            Untuk pertanyaan, keluhan, atau permintaan terkait data pribadi, hubungi:
            <br />
            <strong>Telegram: @mrclooudd</strong>
          </p>

          <p className="text-xs italic mt-8" style={{ color: 'var(--ink-soft)' }}>
            Dokumen ini dapat diperbarui sewaktu-waktu. Penggunaan berkelanjutan atas layanan setelah perubahan
            dianggap sebagai persetujuan atas versi terbaru.
          </p>
        </div>
      </div>
    </div>
  )
}
