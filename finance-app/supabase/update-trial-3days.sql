-- ============================================
-- UPDATE: Ubah masa trial jadi 3 hari (dari sebelumnya 7 hari)
-- Jalankan di Supabase Dashboard > SQL Editor
-- Aman dijalankan di production — HANYA mengubah trigger untuk
-- user BARU yang daftar setelah ini. User lama yang sudah dapat
-- trial 7 hari TIDAK berubah/terpotong.
-- ============================================

create or replace function create_trial_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '3 days');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger yang sudah ada otomatis pakai function versi terbaru di atas,
-- tidak perlu drop/create ulang triggernya.
