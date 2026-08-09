-- ============================================
-- KONFIRMASI MANUAL PEMBAYARAN LANGGANAN
-- Dipakai selama belum pakai Midtrans Production —
-- misal user transfer manual/QRIS langsung ke kamu,
-- lalu kamu aktifin akses mereka lewat query ini.
--
-- Jalankan di Supabase Dashboard > SQL Editor.
-- Aktif 30 hari dari sekarang (sama seperti paket
-- "Langganan Bulanan" di app). Aman dijalankan
-- berkali-kali untuk perpanjang (re-run aja pas
-- mereka bayar lagi bulan depan).
-- ============================================

update subscriptions
set status = 'active',
    current_period_end = now() + interval '30 days',
    midtrans_order_id = 'MANUAL-' || to_char(now(), 'YYYYMMDD-HH24MI')
where user_id = (
  select id from auth.users where email = 'GANTI_DENGAN_EMAIL_USER@gmail.com'
);

-- Cek hasilnya:
select u.email, s.status, s.current_period_end, s.midtrans_order_id
from subscriptions s
join auth.users u on u.id = s.user_id
where u.email = 'GANTI_DENGAN_EMAIL_USER@gmail.com';
