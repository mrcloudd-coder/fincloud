-- ============================================
-- MIGRATION: Sistem Subscription & Trial
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- (jalankan SETELAH schema.sql yang lama)
-- ============================================

-- 1. Tabel subscription — 1 baris per user
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'trialing' check (status in ('trialing', 'active', 'expired')),
  trial_ends_at timestamptz not null,
  current_period_end timestamptz,
  midtrans_order_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

-- User cuma boleh LIHAT status langganannya sendiri.
-- Insert/update HANYA lewat service role (webhook Midtrans / trigger sistem),
-- supaya user tidak bisa mengubah status langganannya sendiri lewat client.
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- 2. Tabel pelacak jatah chat gratis harian (untuk user expired/belum bayar)
create table if not exists daily_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count int not null default 0,
  primary key (user_id, usage_date)
);

alter table daily_chat_usage enable row level security;

create policy "Users can view own chat usage" on daily_chat_usage
  for select using (auth.uid() = user_id);
create policy "Users can insert own chat usage" on daily_chat_usage
  for insert with check (auth.uid() = user_id);
create policy "Users can update own chat usage" on daily_chat_usage
  for update using (auth.uid() = user_id);

-- 3. Function: cek apakah user punya akses penuh (masih trial ATAU subscription aktif)
create or replace function has_active_access(uid uuid)
returns boolean as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid
    and (
      (status = 'trialing' and trial_ends_at > now())
      or (status = 'active' and current_period_end > now())
    )
  );
$$ language sql security definer set search_path = public stable;

-- 4. Trigger: otomatis bikin subscription trial 3 hari untuk user baru
create or replace function create_trial_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '7 days');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function create_trial_subscription();

-- 5. Kunci EDIT & HAPUS transaksi kalau subscription sudah habis/expired.
-- User expired masih bisa INSERT (nambah, dengan limit dari sisi API) dan
-- SELECT (lihat riwayat), tapi tidak bisa UPDATE/DELETE.
drop policy if exists "Users can update own transactions" on transactions;
create policy "Users can update own transactions" on transactions
  for update using (auth.uid() = user_id and has_active_access(auth.uid()));

drop policy if exists "Users can delete own transactions" on transactions;
create policy "Users can delete own transactions" on transactions
  for delete using (auth.uid() = user_id and has_active_access(auth.uid()));

-- 6. Untuk user yang SUDAH ada sebelum migration ini dijalankan (kalau ada),
-- kasih trial 3 hari juga supaya tidak tiba-tiba terkunci.
insert into subscriptions (user_id, status, trial_ends_at)
select id, 'trialing', now() + interval '7 days'
from auth.users
where id not in (select user_id from subscriptions)
on conflict (user_id) do nothing;
