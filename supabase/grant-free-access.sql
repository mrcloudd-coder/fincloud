-- ============================================
-- Kasih akses penuh tanpa langganan ke 1 akun spesifik
-- (misal akun pribadi kamu buat testing, gak perlu bayar/subscribe)
-- ============================================

update subscriptions
set status = 'active',
    current_period_end = '2099-12-31'
where user_id = (
  select id from auth.users where email = 'GANTI_DENGAN_EMAIL_KAMU@gmail.com'
);

-- Cek hasilnya:
select u.email, s.status, s.current_period_end
from subscriptions s
join auth.users u on u.id = s.user_id
where u.email = 'GANTI_DENGAN_EMAIL_KAMU@gmail.com';
