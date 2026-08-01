-- ============================================
-- MIGRATION: Konfirmasi pembayaran manual (QRIS)
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Tabel permintaan konfirmasi pembayaran
create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proof_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table payment_requests enable row level security;

-- User cuma boleh lihat & bikin permintaan miliknya sendiri.
-- Update status (approve/reject) HANYA lewat service role (halaman admin),
-- supaya user tidak bisa self-approve pembayarannya sendiri.
create policy "Users can view own payment requests" on payment_requests
  for select using (auth.uid() = user_id);
create policy "Users can insert own payment requests" on payment_requests
  for insert with check (auth.uid() = user_id);

-- 2. Storage bucket buat nyimpen foto bukti transfer (private, bukan public)
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- User cuma boleh upload/lihat file di folder miliknya sendiri
-- (path harus diawali user_id, contoh: {user_id}/bukti.jpg)
create policy "Users can upload own payment proof"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view own payment proof"
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
