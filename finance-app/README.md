# Catatan Keuangan AI

Web app pencatat keuangan — user tinggal chat pengeluarannya, AI (Gemini) yang otomatis
mem-parsing jadi transaksi terstruktur dan menyimpannya ke database.

## Fitur
- Input pemasukan
- Chat bebas untuk catat pengeluaran → AI parsing otomatis (multi-transaksi sekaligus)
- Konfirmasi/edit hasil parsing sebelum disimpan
- Dashboard ringkasan (pemasukan vs pengeluaran vs sisa saldo) + pie chart per kategori
- Kategori custom
- Export riwayat pengeluaran ke Excel (.xlsx)

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (database + auth)
- Gemini API (`gemini-2.5-flash`) untuk parsing chat
- Recharts (chart), SheetJS/xlsx (export Excel)

---

## Cara Deploy (langkah demi langkah)

### 1. Setup database Supabase
1. Buka project Supabase kamu -> menu **SQL Editor**
2. Copy seluruh isi file `supabase/schema.sql` di folder ini
3. Paste ke SQL Editor, klik **Run**
4. Ini akan membuat tabel `categories`, `income`, `transactions`, mengaktifkan Row Level
   Security (supaya data tiap user terisolasi), dan membuat kategori default otomatis
   untuk user baru.

### 2. Push kode ke GitHub
```bash
cd finance-app
git init
git add .
git commit -m "Initial commit"
```
Lalu buat repo baru di GitHub (kosongan, tanpa README), dan jalankan perintah yang
diberikan GitHub untuk push repo lokal ke sana (`git remote add origin ...` lalu
`git push -u origin main`).

### 3. Deploy ke Vercel
1. Buka vercel.com/new
2. Import repo GitHub yang baru kamu push
3. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan 3 ini:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase (Settings -> API) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key dari Supabase |
   | `GEMINI_API_KEY` | API key dari Google AI Studio |

4. Klik **Deploy**, tunggu 1-2 menit
5. Selesai -- kamu akan dapat link seperti `nama-project.vercel.app`. Ini yang bisa
   langsung dikirim ke customer.

### 4. Testing lokal (opsional, sebelum deploy)
```bash
npm install
cp .env.local.example .env.local   # lalu isi dengan value asli kamu
npm run dev
```
Buka `http://localhost:3000`.

---

## Struktur folder penting
```
app/
  login/               -> halaman login & daftar
  (app)/dashboard/     -> ringkasan + chart
  (app)/chat/          -> input chat + konfirmasi AI parsing
  (app)/transactions/  -> tabel riwayat + export Excel
  api/parse-expense/   -> API route yang panggil Gemini
lib/
  gemini.ts            -> logic parsing AI
  supabase/             -> koneksi ke Supabase (client, server, middleware)
supabase/
  schema.sql            -> SQL untuk setup database
```

## Catatan
- Model Gemini yang dipakai: `gemini-3.1-flash-lite` — model generasi terbaru
  (GA, bukan alias eksperimental), dioptimalkan untuk kecepatan & task ekstraksi
  sederhana, masih di free tier. Bisa diganti di `lib/gemini.ts` kalau nanti mau upgrade model.
- Free tier Gemini ada limit rate (request per menit/hari) -- cukup untuk testing dan
  early users, tapi kalau user sudah banyak, perlu upgrade ke paid tier.
- Jangan commit file `.env.local` ke git (sudah otomatis di-ignore lewat `.gitignore`).

## Menambah Banyak API Key (biar nggak gampang kena limit)

Karena limit gratis Gemini itu per **Google Cloud project**, kamu bisa bikin beberapa
project terpisah di Google AI Studio, tiap project dapat jatah 1.500 request/hari
sendiri-sendiri. Sistem sudah otomatis pindah ke key berikutnya kalau key yang lagi
dipakai kena limit — user nggak akan sadar/terganggu.

### Cara bikin API key tambahan
1. Buka [aistudio.google.com](https://aistudio.google.com)
2. Klik dropdown project di bagian atas (biasanya di sebelah nama project aktif)
3. Pilih **"Create new project"** — kasih nama bebas, misal "keuangan-ai-2"
4. Setelah project baru aktif, klik **"Get API Key"** -> **"Create API Key"**
5. Copy API key baru itu
6. Ulangi langkah 2-5 untuk bikin key ke-3, ke-4, dst sesuai kebutuhan

### Cara pasang di aplikasi
1. Buka dashboard **Vercel** -> project kamu -> **Settings** -> **Environment Variables**
2. Cari variable `GEMINI_API_KEY` yang lama
3. **Hapus** variable itu (atau biarkan saja, tidak akan dipakai lagi)
4. Tambah variable baru:
   - Key: `GEMINI_API_KEYS` (pakai **S** di akhir, beda dengan yang lama)
   - Value: semua API key digabung dipisah koma, tanpa spasi, contoh:
     ```
     AQ.key_pertama,AQ.key_kedua,AQ.key_ketiga
     ```
5. Klik **Save**, lalu **redeploy** project (Vercel -> Deployments -> titik tiga di deployment terakhir -> Redeploy)

Sistem akan otomatis coba key pertama dulu; kalau limitnya habis, otomatis lanjut ke
key berikutnya di daftar, sampai salah satu berhasil.

## Sistem Langganan & Pembayaran (Midtrans)

Aplikasi ini punya sistem trial 7 hari, lalu wajib berlangganan Rp49.000/30 hari.
User yang trial-nya habis dan belum bayar otomatis dibatasi: 1 chat/hari (maks 8 kata),
tidak bisa edit/hapus transaksi, tidak bisa export Excel.

### 1. Jalankan migration database
Di Supabase SQL Editor, jalankan file `supabase/migration-subscription.sql`
(setelah `schema.sql` yang lama sudah pernah dijalankan).

### 2. Ambil Service Role Key dari Supabase
1. Dashboard Supabase -> **Settings** -> **API**
2. Cari **service_role key** (beda dengan anon/publishable key yang sudah dipakai)
3. Copy — key ini **RAHASIA**, jangan pernah taruh di kode/expose ke browser

### 3. Bikin akun Midtrans
1. Daftar di [midtrans.com](https://midtrans.com) -> pilih **Sandbox** dulu untuk testing
   (gratis, tidak perlu verifikasi bisnis dulu)
2. Dashboard Midtrans -> **Settings** -> **Access Keys**
3. Copy **Server Key** dan **Client Key** (masing-masing ada versi Sandbox & Production)

### 4. Pasang di Vercel
Tambahkan environment variables berikut (Settings -> Environment Variables):

| Key | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase |
| `MIDTRANS_SERVER_KEY` | Server Key dari Midtrans |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client Key dari Midtrans |
| `MIDTRANS_IS_PRODUCTION` | `false` (Sandbox) atau `true` (Production) |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | sama dengan di atas |

### 5. Daftarkan URL webhook di Midtrans
1. Dashboard Midtrans -> **Settings** -> **Configuration**
2. Isi **Payment Notification URL** dengan:
   ```
   https://nama-project-kamu.vercel.app/api/billing/webhook
   ```
3. Save

Ini penting — tanpa ini, status pembayaran user tidak akan otomatis ter-update
setelah mereka bayar.

### 6. Testing di Sandbox
Sebelum ganti ke Production, coba dulu alur bayar pakai Sandbox — Midtrans kasih
[kartu/akun simulasi](https://docs.midtrans.com/docs/testing-payment-on-sandbox)
untuk testing tanpa uang beneran.

### 7. Ganti ke Production
Setelah yakin semua jalan lancar, dan akun Midtrans kamu sudah diverifikasi untuk
Production: ganti `MIDTRANS_SERVER_KEY`/`NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` ke versi
Production, dan ubah `MIDTRANS_IS_PRODUCTION` + `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`
jadi `true`. Jangan lupa update juga webhook URL di dashboard Midtrans ke mode Production.

## Setup Cron Job Auto-hapus Bukti Transfer

Bukti transfer yang sudah direview (approved/rejected) otomatis dihapus TOTAL
(foto + data) 7 hari setelah direview, lewat Vercel Cron Job.

1. Cron sudah dikonfigurasi di `vercel.json`, jalan otomatis tiap hari jam 18:00 UTC (01:00 WIB)
2. Tambahkan environment variable `CRON_SECRET` di Vercel — isi string acak bebas (misal hasil generate password acak), dipakai buat melindungi endpoint ini supaya tidak bisa dipanggil sembarang orang
3. Vercel otomatis mengirim header `Authorization: Bearer <CRON_SECRET>` saat memanggil cron — tidak perlu setup tambahan lain

## Halaman Legal

Kebijakan Privasi & Syarat Ketentuan ada di `/legal`, linknya muncul di halaman
login/daftar. User wajib centang checkbox persetujuan sebelum bisa mendaftar —
timestamp persetujuan otomatis tersimpan di tabel `user_consents` sebagai bukti.

## Batas Fitur Gratis (Non-Subscriber)

- Maksimal 3 rekening custom (di luar rekening default)
- Maksimal 5 kategori custom (di luar kategori default)
- Chat 1x/hari, maksimal 8 kata per chat

Semua ini di-enforce di level database (trigger), jadi tidak bisa diakalin lewat developer tools.
