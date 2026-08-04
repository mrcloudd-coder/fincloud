-- ============================================
-- MIGRATION: Persiapan Launch
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- (jalankan SETELAH semua migration sebelumnya)
-- ============================================

-- 1. Trial balik jadi 7 hari (sebelumnya sempat diubah jadi 3 hari)
create or replace function create_trial_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '7 days');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Tambah kolom untuk Optimistic Activation di payment_requests
--    (snapshot status subscription SEBELUM optimistic activation, buat di-restore kalau di-reject)
alter table payment_requests add column if not exists status_snapshot text;
alter table payment_requests add column if not exists period_end_snapshot timestamptz;
alter table payment_requests add column if not exists user_notified boolean default true;

-- 3. Batasi 1 payment_request PENDING per user — dicek di kode aplikasi (API route),
--    bukan di sini, karena butuh custom error message yang jelas ke user.

-- 4. Limit fitur untuk user yang belum/tidak berlangganan:
--    maks 3 rekening custom, maks 5 kategori custom (di luar yang default).

create or replace function enforce_account_limit()
returns trigger as $$
declare
  cnt int;
begin
  if not has_active_access(new.user_id) then
    select count(*) into cnt from accounts where user_id = new.user_id and is_default = false;
    if cnt >= 3 then
      raise exception 'LIMIT_REACHED_ACCOUNTS';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists check_account_limit on accounts;
create trigger check_account_limit
  before insert on accounts
  for each row execute function enforce_account_limit();

create or replace function enforce_category_limit()
returns trigger as $$
declare
  cnt int;
begin
  if not has_active_access(new.user_id) then
    select count(*) into cnt from categories where user_id = new.user_id and is_default = false;
    if cnt >= 5 then
      raise exception 'LIMIT_REACHED_CATEGORIES';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists check_category_limit on categories;
create trigger check_category_limit
  before insert on categories
  for each row execute function enforce_category_limit();

-- 5. Tabel bukti persetujuan Privacy Policy & Syarat Ketentuan (untuk kekuatan hukum)
create table if not exists user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consented_at timestamptz not null default now(),
  version text not null default 'v1'
);

alter table user_consents enable row level security;

create policy "Users can view own consent" on user_consents
  for select using (auth.uid() = user_id);
create policy "Users can insert own consent" on user_consents
  for insert with check (auth.uid() = user_id);
