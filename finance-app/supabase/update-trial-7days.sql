-- ============================================
-- UPDATE: Ubah masa trial balik jadi 7 hari (dari 3 hari)
-- Jalankan di Supabase Dashboard > SQL Editor
-- HANYA memengaruhi user BARU yang daftar setelah ini.
-- ============================================

create or replace function create_trial_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '7 days');
  return new;
end;
$$ language plpgsql security definer set search_path = public;
