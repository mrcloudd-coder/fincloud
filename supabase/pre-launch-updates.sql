-- ============================================
-- UPDATE SEBELUM LAUNCH:
-- 1. Masa trial jadi 3 hari (dari 7 hari)
-- 2. Rekening default untuk user baru: Cash, BCA, BRI, DANA
--    (sebelumnya cuma "Kas/Tunai" dan "Rekening Utama")
--
-- Jalankan di Supabase Dashboard > SQL Editor.
-- HANYA memengaruhi USER BARU yang daftar setelah ini dijalankan.
-- User yang sudah ada (termasuk akun rekening custom kamu sendiri
-- seperti BCA/BRI/SEABANK yang sudah kamu buat manual) TIDAK berubah.
-- ============================================

-- 1. Trial 3 hari
create or replace function create_trial_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '3 days');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Default rekening baru untuk user yang baru daftar
create or replace function create_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, color, is_default) values
    (new.id, 'Makanan & Minuman', '#f97316', true),
    (new.id, 'Transportasi', '#3b82f6', true),
    (new.id, 'Hiburan', '#a855f7', true),
    (new.id, 'Belanja', '#ec4899', true),
    (new.id, 'Tagihan', '#ef4444', true),
    (new.id, 'Kesehatan', '#22c55e', true),
    (new.id, 'Lainnya', '#6b7280', true);

  insert into public.accounts (user_id, name, color, is_default) values
    (new.id, 'Cash', '#0f6650', true),
    (new.id, 'BCA', '#2563eb', true),
    (new.id, 'BRI', '#0891b2', true),
    (new.id, 'DANA', '#a855f7', true);

  return new;
end;
$$ language plpgsql security definer set search_path = public;
